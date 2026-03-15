#!/usr/bin/env python3
"""Simulate a fantasy Top Chef snake draft using team rankings from Supabase."""

import argparse
import json
import random
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client
import os

# Chef roster — mirrors src/lib/chefs.ts
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

NUM_ROUNDS = 4
MAX_PER_CHEF = 3


@dataclass
class Team:
    id: str
    team_name: str
    owner_name: str
    rankings: dict[str, int] = field(default_factory=dict)  # chef_id -> rank (1=most wanted)


@dataclass
class DraftPick:
    round_num: int
    pick_num: int
    team_name: str
    chef_id: str
    chef_name: str
    rank_on_list: int


def load_teams() -> list[Team]:
    """Fetch draft submissions and picks from Supabase."""
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    load_dotenv(env_path)

    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(url, key)

    # Fetch submissions
    subs = supabase.table("draft_submissions").select("*").execute()
    if not subs.data:
        print("No draft submissions found.")
        sys.exit(1)

    # Fetch all picks
    picks = supabase.table("draft_picks").select("*").execute()
    picks_by_sub: dict[str, list[dict]] = {}
    for p in picks.data:
        picks_by_sub.setdefault(p["submission_id"], []).append(p)

    teams: list[Team] = []
    for sub in subs.data:
        team = Team(
            id=sub["id"],
            team_name=sub["team_name"],
            owner_name=sub["owner_name"],
        )
        for pick in picks_by_sub.get(sub["id"], []):
            team.rankings[pick["chef_id"]] = pick["rank"]
        teams.append(team)

    return teams


def run_draft(teams: list[Team], seed: int | None = None) -> list[DraftPick]:
    """Run a 4-round snake draft."""
    rng = random.Random(seed)
    rng.shuffle(teams)

    chef_count: dict[str, int] = {}
    draft_log: list[DraftPick] = []
    overall_pick = 0

    for round_num in range(1, NUM_ROUNDS + 1):
        order = teams if round_num % 2 == 1 else list(reversed(teams))
        for team in order:
            overall_pick += 1
            # Pick highest-ranked available chef
            available = [
                (rank, cid)
                for cid, rank in team.rankings.items()
                if chef_count.get(cid, 0) < MAX_PER_CHEF
            ]
            available.sort()  # lowest rank number = most wanted
            if not available:
                print(f"WARNING: {team.team_name} has no available chefs to pick!")
                continue
            rank, chef_id = available[0]
            chef_count[chef_id] = chef_count.get(chef_id, 0) + 1
            pick = DraftPick(
                round_num=round_num,
                pick_num=overall_pick,
                team_name=team.team_name,
                chef_id=chef_id,
                chef_name=CHEFS.get(chef_id, chef_id),
                rank_on_list=rank,
            )
            draft_log.append(pick)
            # Remove chef from this team's rankings so they can't pick them again
            del team.rankings[chef_id]

    return draft_log


def print_results(teams: list[Team], draft_log: list[DraftPick]) -> None:
    """Print all output sections."""
    # 1. Draft Order
    print("=" * 60)
    print("DRAFT ORDER")
    print("=" * 60)
    for i, team in enumerate(teams, 1):
        print(f"  {i}. {team.team_name} ({team.owner_name})")
    print()

    # 2. Draft Log
    print("=" * 60)
    print("DRAFT LOG")
    print("=" * 60)
    for pick in draft_log:
        print(
            f"  Pick {pick.round_num}.{((pick.pick_num - 1) % len(teams)) + 1}: "
            f"{pick.team_name} selects {pick.chef_name} (ranked #{pick.rank_on_list})"
        )
    print()

    # 3. Final Rosters
    print("=" * 60)
    print("FINAL ROSTERS")
    print("=" * 60)
    rosters: dict[str, list[DraftPick]] = {}
    for pick in draft_log:
        rosters.setdefault(pick.team_name, []).append(pick)

    for team in teams:
        picks = rosters.get(team.team_name, [])
        avg_rank = sum(p.rank_on_list for p in picks) / len(picks) if picks else 0
        print(f"\n  {team.team_name} ({team.owner_name}) — avg rank: {avg_rank:.1f}")
        for p in picks:
            print(f"    Round {p.round_num}: {p.chef_name} (ranked #{p.rank_on_list})")
    print()

    # 4. Stats
    print("=" * 60)
    print("STATS")
    print("=" * 60)

    # Chef popularity
    chef_picks: dict[str, int] = {}
    for pick in draft_log:
        chef_picks[pick.chef_id] = chef_picks.get(pick.chef_id, 0) + 1

    print("\n  Chef Popularity (times drafted):")
    for chef_id, count in sorted(chef_picks.items(), key=lambda x: -x[1]):
        print(f"    {CHEFS.get(chef_id, chef_id)}: {count}")

    # Undrafted chefs
    undrafted = [name for cid, name in CHEFS.items() if cid not in chef_picks]
    if undrafted:
        print(f"\n  Undrafted: {', '.join(undrafted)}")
    else:
        print("\n  All chefs were drafted!")

    # Avg pick rank per team
    print("\n  Average Pick Rank by Team:")
    team_avgs = []
    for team in teams:
        picks = rosters.get(team.team_name, [])
        avg = sum(p.rank_on_list for p in picks) / len(picks) if picks else 0
        team_avgs.append((avg, team.team_name))
    team_avgs.sort()
    for avg, name in team_avgs:
        print(f"    {name}: {avg:.1f}")
    print()


def build_json(teams: list[Team], draft_log: list[DraftPick], all_rankings: dict[str, dict[str, int]]) -> dict:
    """Build a JSON-serializable dict of the full draft results."""
    rosters: dict[str, list[DraftPick]] = {}
    for pick in draft_log:
        rosters.setdefault(pick.team_name, []).append(pick)

    chef_picks: dict[str, int] = {}
    for pick in draft_log:
        chef_picks[pick.chef_id] = chef_picks.get(pick.chef_id, 0) + 1

    undrafted = [
        {"id": cid, "name": name}
        for cid, name in CHEFS.items()
        if cid not in chef_picks
    ]

    return {
        "draftOrder": [
            {"teamName": t.team_name, "ownerName": t.owner_name}
            for t in teams
        ],
        "picks": [asdict(p) for p in draft_log],
        "rosters": [
            {
                "teamName": t.team_name,
                "ownerName": t.owner_name,
                "picks": [asdict(p) for p in rosters.get(t.team_name, [])],
                "avgRank": round(
                    sum(p.rank_on_list for p in rosters.get(t.team_name, []))
                    / len(rosters.get(t.team_name, []))
                    if rosters.get(t.team_name)
                    else 0,
                    1,
                ),
            }
            for t in teams
        ],
        "chefAvgRank": sorted(
            [
                {
                    "chefId": cid,
                    "chefName": name,
                    "avgRank": round(
                        sum(r[cid] for r in all_rankings.values() if cid in r)
                        / sum(1 for r in all_rankings.values() if cid in r),
                        1,
                    ),
                    "numTeams": sum(1 for r in all_rankings.values() if cid in r),
                }
                for cid, name in CHEFS.items()
                if any(cid in r for r in all_rankings.values())
            ],
            key=lambda x: x["avgRank"],
        ),
        "chefPopularity": [
            {"chefId": cid, "chefName": CHEFS.get(cid, cid), "count": count}
            for cid, count in sorted(chef_picks.items(), key=lambda x: -x[1])
        ],
        "undrafted": undrafted,
        "numTeams": len(teams),
    }


def main():
    parser = argparse.ArgumentParser(description="Simulate fantasy Top Chef snake draft")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    parser.add_argument("--output", type=str, default=None, help="Write JSON results to file")
    args = parser.parse_args()

    teams = load_teams()
    print(f"Loaded {len(teams)} teams from Supabase.\n")

    # Snapshot rankings before draft mutates them
    all_rankings: dict[str, dict[str, int]] = {
        t.team_name: dict(t.rankings) for t in teams
    }

    draft_log = run_draft(teams, seed=args.seed)
    print_results(teams, draft_log)

    if args.output:
        data = build_json(teams, draft_log, all_rankings)
        out_path = Path(args.output)
        out_path.write_text(json.dumps(data, indent=2))
        print(f"JSON results written to {out_path}")


if __name__ == "__main__":
    main()
