#!/usr/bin/env python3
"""Simulate the mid-season redraft using submissions from Supabase.

Mechanics (mirrors plan):
- Each team optionally keeps one Active or In-LCK chef from their original draft.
- Per-chef cap is raised from 3 to 4 post-redraft (kept chefs count toward cap).
- Each team ends with 3 chefs total (kept + drafted).
- Draft order is reverse current standings (worst-first). Snake reverses on
  even rounds.

Outputs JSON with shape compatible with the standings/results page:
  {
    "effectiveFromEpisode": 9,
    "draftOrder": [...],
    "picks": [...],
    "rosters": [{ teamName, ownerName, keepChefId, picks: [...] }, ...],
    "chefPopularity": [...]
  }
"""

import argparse
import json
import os
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


CHEFS: dict[str, str] = {
    "anthony-jones": "Anthony Jones",
    "brandon-dearden": "Brandon Dearden",
    "brittany-cochran": "Brittany Cochran",
    "day-anais-joseph": "Day Anais Joseph",
    "duyen-ha": "Duyen Ha",
    "jassi-bindra": "Jassi Bindra",
    "jennifer-lee-jackson": "Jennifer Lee Jackson",
    "jonathan-dearden": "Jonathan Dearden",
    "justin-tootla": "Justin Tootla",
    "laurence-louie": "Laurence Louie",
    "nana-araba-wilmot": "Nana Araba Wilmot",
    "oscar-diaz": "Oscar Diaz",
    "rhoda-magbitang": "Rhoda Magbitang",
    "sherry-cardoso": "Sherry Cardoso",
    "sieger-bayer": "Sieger Bayer",
}

POINT_VALUES = {
    "quickfire_win": 1.5,
    "quickfire_top": 1,
    "quickfire_bottom": -1,
    "elimination_win": 2,
    "elimination_top": 1,
    "elimination_bottom": -1,
    "lck_win": 1,
    "sent_to_lck": 0,
    "eliminated": 0,
    "returned_to_competition": 0,
    "bonus_risotto": 0.5,
    "bonus_cries": 0.5,
    "bonus_incomplete_plate": 0.5,
    "bonus_forgot_ingredient": 0.5,
    "bonus_liquid_nitrogen": 0.5,
}

MAX_PER_CHEF = 4
TARGET_ROSTER_SIZE = 3
EFFECTIVE_FROM_EPISODE = 9


@dataclass
class Team:
    team_name: str
    owner_name: str
    keep_chef_id: str | None
    rankings: dict[str, int] = field(default_factory=dict)


@dataclass
class RedraftPick:
    round_num: int
    pick_num: int
    team_name: str
    chef_id: str
    chef_name: str
    rank_on_list: int


def derive_status(events: list[dict]) -> str:
    ordered = sorted(events, key=lambda e: (e["episode"], e["created_at"]))
    status = "Active"
    for e in ordered:
        if e["event"] == "eliminated":
            return "Eliminated"
        if e["event"] == "sent_to_lck":
            status = "In LCK"
        elif e["event"] == "returned_to_competition":
            status = "Active"
    return status


def connect():
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    load_dotenv(env_path)
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def load_redraft_teams(supabase) -> list[Team]:
    subs = supabase.table("redraft_submissions").select("*").execute()
    if not subs.data:
        print("No redraft submissions found.")
        sys.exit(1)

    picks = supabase.table("redraft_picks").select("*").execute()
    picks_by_sub: dict[str, list[dict]] = {}
    for p in picks.data:
        picks_by_sub.setdefault(p["submission_id"], []).append(p)

    teams: list[Team] = []
    for sub in subs.data:
        team = Team(
            team_name=sub["team_name"],
            owner_name=sub["owner_name"],
            keep_chef_id=sub.get("keep_chef_id"),
        )
        for pick in picks_by_sub.get(sub["id"], []):
            team.rankings[pick["chef_id"]] = pick["rank"]
        teams.append(team)
    return teams


def compute_team_standings(supabase, team_names: set[str]) -> dict[str, float]:
    """Return {team_name: total_points_through_today} from draft-results.json + episode_results."""
    results_path = (
        Path(__file__).resolve().parent.parent
        / "src"
        / "app"
        / "results"
        / "draft-results.json"
    )
    draft = json.loads(results_path.read_text())

    chef_to_teams: dict[str, list[str]] = {}
    for roster in draft["rosters"]:
        for pick in roster["picks"]:
            chef_to_teams.setdefault(pick["chef_id"], []).append(roster["teamName"])

    events = supabase.table("episode_results").select("*").execute().data or []

    points: dict[str, float] = {name: 0.0 for name in team_names}
    for e in events:
        pts = POINT_VALUES.get(e["event"], 0)
        for tname in chef_to_teams.get(e["chef_id"], []):
            if tname in points:
                points[tname] += pts
    return points


def get_surviving_chef_ids(supabase) -> set[str]:
    events = supabase.table("episode_results").select("*").execute().data or []
    by_chef: dict[str, list[dict]] = {}
    for e in events:
        by_chef.setdefault(e["chef_id"], []).append(e)
    return {
        cid
        for cid in CHEFS
        if derive_status(by_chef.get(cid, [])) != "Eliminated"
    }


def run_redraft(teams: list[Team], standings: dict[str, float]) -> list[RedraftPick]:
    teams_sorted = sorted(teams, key=lambda t: standings.get(t.team_name, 0.0))

    chef_count: dict[str, int] = {}
    roster_size: dict[str, int] = {}
    for t in teams_sorted:
        if t.keep_chef_id:
            chef_count[t.keep_chef_id] = chef_count.get(t.keep_chef_id, 0) + 1
            roster_size[t.team_name] = 1
        else:
            roster_size[t.team_name] = 0

    log: list[RedraftPick] = []
    overall_pick = 0
    round_num = 0
    forward = True

    while any(roster_size[t.team_name] < TARGET_ROSTER_SIZE for t in teams_sorted):
        round_num += 1
        order = teams_sorted if forward else list(reversed(teams_sorted))
        forward = not forward

        for team in order:
            if roster_size[team.team_name] >= TARGET_ROSTER_SIZE:
                continue

            available = [
                (rank, cid)
                for cid, rank in team.rankings.items()
                if chef_count.get(cid, 0) < MAX_PER_CHEF
            ]
            available.sort()
            if not available:
                print(
                    f"WARNING: {team.team_name} has no available chefs to pick "
                    f"(round {round_num})!"
                )
                continue

            rank, chef_id = available[0]
            chef_count[chef_id] = chef_count.get(chef_id, 0) + 1
            roster_size[team.team_name] += 1
            overall_pick += 1
            log.append(
                RedraftPick(
                    round_num=round_num,
                    pick_num=overall_pick,
                    team_name=team.team_name,
                    chef_id=chef_id,
                    chef_name=CHEFS.get(chef_id, chef_id),
                    rank_on_list=rank,
                )
            )
            del team.rankings[chef_id]

    return log


def build_json(
    teams: list[Team],
    log: list[RedraftPick],
    standings: dict[str, float],
) -> dict:
    teams_sorted = sorted(teams, key=lambda t: standings.get(t.team_name, 0.0))

    rosters_out = []
    for team in teams_sorted:
        team_picks = [p for p in log if p.team_name == team.team_name]
        picks_payload = []
        if team.keep_chef_id:
            picks_payload.append(
                {
                    "round_num": 0,
                    "pick_num": 0,
                    "team_name": team.team_name,
                    "chef_id": team.keep_chef_id,
                    "chef_name": CHEFS.get(team.keep_chef_id, team.keep_chef_id),
                    "rank_on_list": 0,
                    "kept": True,
                }
            )
        for p in team_picks:
            picks_payload.append({**asdict(p), "kept": False})

        rosters_out.append(
            {
                "teamName": team.team_name,
                "ownerName": team.owner_name,
                "keepChefId": team.keep_chef_id,
                "picks": picks_payload,
            }
        )

    chef_popularity: dict[str, int] = {}
    for r in rosters_out:
        for p in r["picks"]:
            chef_popularity[p["chef_id"]] = chef_popularity.get(p["chef_id"], 0) + 1

    return {
        "effectiveFromEpisode": EFFECTIVE_FROM_EPISODE,
        "draftOrder": [
            {"teamName": t.team_name, "ownerName": t.owner_name}
            for t in teams_sorted
        ],
        "picks": [asdict(p) for p in log],
        "rosters": rosters_out,
        "chefPopularity": [
            {"chefId": cid, "chefName": CHEFS.get(cid, cid), "count": count}
            for cid, count in sorted(chef_popularity.items(), key=lambda x: -x[1])
        ],
        "numTeams": len(teams),
    }


def print_results(payload: dict) -> None:
    print("=" * 60)
    print(f"REDRAFT (effective from episode {payload['effectiveFromEpisode']})")
    print("=" * 60)
    print("\nDraft Order (worst-first):")
    for i, t in enumerate(payload["draftOrder"], 1):
        print(f"  {i}. {t['teamName']} ({t['ownerName']})")

    print("\nPick log:")
    for p in payload["picks"]:
        print(
            f"  Round {p['round_num']}, pick {p['pick_num']}: "
            f"{p['team_name']} selects {p['chef_name']} (ranked #{p['rank_on_list']})"
        )

    print("\nFinal rosters:")
    for r in payload["rosters"]:
        print(f"\n  {r['teamName']} ({r['ownerName']})")
        for p in r["picks"]:
            tag = " (kept)" if p.get("kept") else f" (R{p['round_num']})"
            rank_str = "" if p.get("kept") else f" — ranked #{p['rank_on_list']}"
            print(f"    {p['chef_name']}{tag}{rank_str}")

    print("\nChef popularity:")
    for c in payload["chefPopularity"]:
        print(f"  {c['chefName']}: {c['count']} team(s)")
    print()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the mid-season redraft")
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Write JSON results to this file",
    )
    args = parser.parse_args()

    supabase = connect()
    teams = load_redraft_teams(supabase)
    print(f"Loaded {len(teams)} redraft submissions.\n")

    survivors = get_surviving_chef_ids(supabase)
    print(f"Surviving chefs ({len(survivors)}): {', '.join(sorted(survivors))}\n")

    for team in teams:
        if team.keep_chef_id and team.keep_chef_id not in survivors:
            print(
                f"ERROR: {team.team_name} keeps {team.keep_chef_id} but that chef is eliminated."
            )
            sys.exit(1)
        expected = survivors - ({team.keep_chef_id} if team.keep_chef_id else set())
        if set(team.rankings.keys()) != expected:
            missing = expected - set(team.rankings.keys())
            extra = set(team.rankings.keys()) - expected
            print(f"ERROR: {team.team_name} rankings mismatch.")
            if missing:
                print(f"  Missing: {missing}")
            if extra:
                print(f"  Extra:   {extra}")
            sys.exit(1)

    team_names = {t.team_name for t in teams}
    standings = compute_team_standings(supabase, team_names)
    print("Current standings (used for reverse draft order):")
    for name, pts in sorted(standings.items(), key=lambda x: x[1]):
        print(f"  {pts:6.1f}  {name}")
    print()

    log = run_redraft(teams, standings)
    payload = build_json(teams, log, standings)
    print_results(payload)

    if args.output:
        out_path = Path(args.output)
        out_path.write_text(json.dumps(payload, indent=2))
        print(f"JSON results written to {out_path}")


if __name__ == "__main__":
    main()
