# How the Fantasy Top Chef Draft Works

This explains, step by step, what the draft simulator does when we run it. The script lives at `scripts/simulate_draft.py`.

---

## The Big Picture

1. Every team submits a **ranked list** of all 15 chefs (1 = most wanted, 15 = least wanted)
2. The script **randomly determines a draft order** (who picks first, second, etc.)
3. Teams take turns picking chefs across **4 rounds** using a **snake draft** format
4. Each chef can be on **at most 3 teams** — after that, they're off the board
5. The results get saved to a JSON file that powers the results page on the website

---

## Configuration

At the top of the script, we define the full chef roster and the two key rules:

```python
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

NUM_ROUNDS = 4      # each team gets 4 picks total
MAX_PER_CHEF = 3    # a chef can appear on at most 3 teams
```

Each team and each pick are tracked as structured data:

```python
@dataclass
class Team:
    id: str
    team_name: str
    owner_name: str
    rankings: dict[str, int]  # chef_id -> rank (1 = most wanted)

@dataclass
class DraftPick:
    round_num: int       # which round (1-4)
    pick_num: int        # overall pick number (1-36)
    team_name: str       # who made the pick
    chef_id: str         # which chef was picked
    chef_name: str       # human-readable name
    rank_on_list: int    # where this chef was on the team's ranked list
```

---

## Step 1: Load Everyone's Rankings from the Database

When a team submits their rankings through the website, two things get saved to our database (Supabase):

- A **submission record** — the team name and owner name
- Their **picks** — which chef they ranked #1, #2, #3, etc.

The script connects to Supabase using credentials from the `.env.local` file, then pulls all submissions and picks:

```python
def load_teams() -> list[Team]:
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    load_dotenv(env_path)

    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(url, key)

    # Get all team submissions
    subs = supabase.table("draft_submissions").select("*").execute()

    # Get all individual chef rankings
    picks = supabase.table("draft_picks").select("*").execute()

    # Group the picks by submission so we know which rankings belong to which team
    picks_by_sub: dict[str, list[dict]] = {}
    for p in picks.data:
        picks_by_sub.setdefault(p["submission_id"], []).append(p)

    # Build each team with their full rankings
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
```

At this point we have a list of `Team` objects, each containing their full ranked list of all 15 chefs.

---

## Step 2: Randomize the Draft Order

The draft order is determined randomly. If you want to reproduce the exact same draft (for testing or verification), you can pass a `--seed` number — otherwise it's truly random each time.

```python
rng = random.Random(seed)
rng.shuffle(teams)
```

After this shuffle, the list of teams is in draft order. Team at index 0 picks first, index 1 picks second, etc.

---

## Step 3: Run the Snake Draft (4 Rounds)

This is the core of the whole thing. A **snake draft** means the pick order reverses every other round:

| Round | Order |
|-------|-------|
| Round 1 | Team 1 → Team 2 → ... → Team 9 |
| Round 2 | Team 9 → Team 8 → ... → Team 1 |
| Round 3 | Team 1 → Team 2 → ... → Team 9 |
| Round 4 | Team 9 → Team 8 → ... → Team 1 |

This makes things fairer — the team that picks last in round 1 gets to pick first in round 2.

Here's the full draft loop:

```python
def run_draft(teams: list[Team], seed: int | None = None) -> list[DraftPick]:
    rng = random.Random(seed)
    rng.shuffle(teams)

    chef_count: dict[str, int] = {}   # tracks how many teams have each chef
    draft_log: list[DraftPick] = []   # every pick, in order
    overall_pick = 0

    for round_num in range(1, NUM_ROUNDS + 1):
        # Odd rounds go forward (1→9), even rounds go backward (9→1)
        order = teams if round_num % 2 == 1 else list(reversed(teams))

        for team in order:
            overall_pick += 1

            # Find all chefs this team hasn't picked yet who aren't "full" (< 3 teams)
            available = [
                (rank, cid)
                for cid, rank in team.rankings.items()
                if chef_count.get(cid, 0) < MAX_PER_CHEF
            ]
            available.sort()  # sort by rank number — lowest = most wanted

            if not available:
                print(f"WARNING: {team.team_name} has no available chefs to pick!")
                continue

            # Take the highest-ranked available chef
            rank, chef_id = available[0]

            # Update the global count
            chef_count[chef_id] = chef_count.get(chef_id, 0) + 1

            # Record the pick
            pick = DraftPick(
                round_num=round_num,
                pick_num=overall_pick,
                team_name=team.team_name,
                chef_id=chef_id,
                chef_name=CHEFS.get(chef_id, chef_id),
                rank_on_list=rank,
            )
            draft_log.append(pick)

            # Remove this chef from the team's rankings so they can't pick them again
            del team.rankings[chef_id]

    return draft_log
```

### Walking Through a Pick

Say it's Round 1 and it's "Tom's Nom's" turn. Their rankings look like:

| Rank | Chef |
|------|------|
| 1 | Anthony Jones |
| 2 | Oscar Diaz |
| 3 | Rhoda Magbitang |
| ... | ... |

The script checks: has Anthony Jones been picked by 3 teams already? No (it's early in the draft), so Anthony Jones is available. Since he's ranked #1, he's the pick.

Now in Round 3, suppose Oscar Diaz has already been picked by 3 teams. When it's Tom's Nom's turn again, the script skips Oscar (full) and moves to their next highest-ranked available chef.

---

## Step 4: Output the Results

After all 4 rounds (9 teams × 4 rounds = 36 total picks), the script prints four sections to the terminal:

```python
def print_results(teams: list[Team], draft_log: list[DraftPick]) -> None:
    # 1. Draft Order — the randomized order teams picked in
    for i, team in enumerate(teams, 1):
        print(f"  {i}. {team.team_name} ({team.owner_name})")

    # 2. Draft Log — every pick, in order
    for pick in draft_log:
        print(
            f"  Pick {pick.round_num}.{...}: "
            f"{pick.team_name} selects {pick.chef_name} (ranked #{pick.rank_on_list})"
        )

    # 3. Final Rosters — each team's 4 chefs + their average ranking
    for team in teams:
        picks = rosters.get(team.team_name, [])
        avg_rank = sum(p.rank_on_list for p in picks) / len(picks)
        print(f"  {team.team_name} ({team.owner_name}) — avg rank: {avg_rank:.1f}")
        for p in picks:
            print(f"    Round {p.round_num}: {p.chef_name} (ranked #{p.rank_on_list})")

    # 4. Stats — chef popularity, undrafted chefs, avg pick rank per team
    for chef_id, count in sorted(chef_picks.items(), key=lambda x: -x[1]):
        print(f"    {CHEFS[chef_id]}: {count}")
```

The "average rank" stat tells you how close each team got to their ideal roster. A low average (like 2.0) means the team got chefs near the top of their list. A higher average means they had to settle for lower-ranked picks.

---

## Step 5 (Optional): Save to JSON for the Website

If you run the script with `--output`, it saves everything to a JSON file that the website reads:

```bash
python scripts/simulate_draft.py --output src/app/results/draft-results.json
```

The JSON builder packages up all the data:

```python
def build_json(teams, draft_log, all_rankings) -> dict:
    return {
        "draftOrder": [
            {"teamName": t.team_name, "ownerName": t.owner_name}
            for t in teams
        ],
        "picks": [asdict(p) for p in draft_log],        # every pick
        "rosters": [...],                                 # each team's 4 chefs
        "chefAvgRank": [...],                             # how wanted each chef was across ALL teams
        "chefPopularity": [...],                          # how many teams drafted each chef
        "undrafted": [...],                               # chefs no one picked
        "numTeams": len(teams),
    }
```

One thing to note: `chefAvgRank` uses the rankings from **all teams' submissions**, not just the teams who drafted that chef. This shows how universally wanted a chef was across the entire league. A chef with an average rank of 3.0 means most teams had them near the top of their list.

---

## Running It

```bash
# Basic run — prints results to terminal
.venv/bin/python scripts/simulate_draft.py

# With a specific random seed (reproducible draft order)
.venv/bin/python scripts/simulate_draft.py --seed 42

# Save results to the JSON file the website uses
.venv/bin/python scripts/simulate_draft.py --seed 42 --output src/app/results/draft-results.json
```

---

## Key Rules Summary

| Rule | Value |
|------|-------|
| Number of rounds | 4 |
| Chefs per team | 4 (one per round) |
| Max teams per chef | 3 |
| Draft format | Snake (order reverses each round) |
| Draft order | Random |
| Pick logic | Always picks highest-ranked available chef |

---

## FAQ

**Q: Can two teams have the same chef?**
Yes! Up to 3 teams can share the same chef. This is why rankings matter — if everyone wants the same chef, only the first 3 teams to pick them get them.

**Q: What if I ranked a chef #1 but didn't get them?**
That means 3 other teams who picked before you also wanted them, and the chef hit the 3-team cap. You'd get your next highest-ranked available chef instead.

**Q: Is the draft order rigged?**
No — it's randomized by the script. If you want to verify, ask Ben for the seed number and re-run it yourself.

**Q: Why a snake draft?**
Fairness. If Team 1 always picked first in every round, they'd have a huge advantage. The snake format means the last-picking team in round 1 gets first pick in round 2, evening things out.

**Q: What does "avg rank" mean on my roster?**
It's the average of where each of your 4 chefs fell on your personal ranked list. If you got your #1, #2, #3, and #4 picks, your average rank is 2.5 — meaning you got almost exactly what you wanted. A higher number means you had to reach further down your list.
