# How the Mid-Season Redraft Works

This explains the mechanic and the simulator at `scripts/simulate_redraft.py`. It's the companion to `how-the-draft-works.md`, which describes the original season-opening draft.

---

## The Big Picture

After 8 episodes, only 8 of the 15 chefs were still in the competition. With 10 teams of 4 chefs each, half of every roster was eliminated. The redraft refreshes rosters from the surviving chef pool.

1. Each team optionally **keeps 1 chef** (any Active or In-LCK chef from their original roster). They may also keep nothing.
2. Teams submit a **ranked list of the remaining surviving chefs** (the 7 or 8 they didn't keep).
3. The script **orders the draft by reverse current standings** — the team in last place picks first.
4. Teams take turns picking until each team has **3 chefs total** (kept + drafted), in a snake-draft format.
5. A chef can now be on **at most 4 teams** (raised from 3) since the surviving pool is small.
6. The results are written to `src/app/results/redraft-results.json`, which the standings and results pages consume.

The original draft results (`draft-results.json`) are not modified — that file remains the ep-1-through-8 record of who owned which chef.

---

## Configuration

```python
MAX_PER_CHEF = 4              # raised from 3 in the original draft
TARGET_ROSTER_SIZE = 3        # post-redraft roster size
EFFECTIVE_FROM_EPISODE = 9    # phase boundary
```

---

## Step 1: Load the redraft submissions

Each team's submission is a row in `redraft_submissions` with:

- `team_name` (must match an original `draft_submissions.team_name`)
- `owner_name`
- `keep_chef_id` (nullable)

Their ranked list of redraftable chefs is in `redraft_picks`, one row per chef with a `rank` (1 = most wanted).

The script connects to Supabase using credentials from `.env.local` and pulls both tables.

---

## Step 2: Determine the surviving chef pool

The simulator reads `episode_results` and runs the same status logic as the website (`deriveChefStatus` in `src/lib/scoring.ts`): a chef is **Eliminated** if any `eliminated` event appears in their history. All other chefs are eligible to be redrafted.

Each team's submitted ranking is validated to cover the surviving chefs **exactly**, minus their kept chef. A mismatch is a hard error.

---

## Step 3: Compute current standings

The redraft order is reverse current standings: the worst-ranked team picks first. The simulator computes each team's current point total by reading `episode_results` and applying `POINT_VALUES` to events for chefs the team owned in the original draft.

The team list is sorted ascending by total points → that's the round-1 pick order.

---

## Step 4: Run the snake redraft

```python
chef_count = {}        # chef_id -> number of teams that own them
roster_size = {}       # team_name -> current chef count

# Pre-seed: kept chefs count toward both caps
for team in teams_sorted:
    if team.keep_chef_id:
        chef_count[team.keep_chef_id] += 1
        roster_size[team.team_name] = 1
```

Then snake through rounds (forward, then reverse, then forward) until every team is at 3 chefs. On each turn, a team picks their **highest-ranked available chef** where `chef_count[chef] < 4`.

In practice this is 2 rounds (since most teams keep 1 and need 2 more), but the loop is generic.

---

## Step 5: Output JSON

```bash
python scripts/simulate_redraft.py --output src/app/results/redraft-results.json
```

The JSON shape:

```json
{
  "effectiveFromEpisode": 9,
  "draftOrder": [{ "teamName": "...", "ownerName": "..." }, ...],
  "picks": [{ "round_num": 1, "pick_num": 1, ..., "kept": false }, ...],
  "rosters": [
    {
      "teamName": "...",
      "ownerName": "...",
      "keepChefId": "...|null",
      "picks": [
        { "chef_id": "...", "kept": true, ... },
        { "chef_id": "...", "round_num": 1, "rank_on_list": 2, "kept": false, ... }
      ]
    }
  ],
  "chefPopularity": [...],
  "numTeams": 10
}
```

The standings page reads both `draft-results.json` and `redraft-results.json` and apportions episode events by phase: ep `< effectiveFromEpisode` → original-draft owners; ep `>=` → redraft owners. Points already earned by chefs in episodes 1–8 stay with whoever drafted them originally.

---

## Why "keep up to 1, max 4 per chef"?

8 surviving chefs × 4-team cap = 32 chef-slots available. 10 teams × 3 chefs = 30 needed. There's exactly 2 slots of slack — feasible but tight. Raising the cap to 5 would dilute differentiation; not raising it would leave the math impossible.

The optional "keep 1" preserves continuity for teams that scouted well early (e.g., kept a 10-pt Anthony Jones) without forcing every team to start from zero.

---

## Why reverse standings?

Classic mid-season fantasy rebalancing: teams that fell behind get first pick at the now-scarce surviving chefs.
