#!/usr/bin/env python3
"""Interactive CLI for entering episode results into Supabase."""

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

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

CHEF_IDS = list(CHEFS.keys())

CATEGORIES = [
    ("quickfire_win", "Quickfire Winner(s)"),
    ("quickfire_top", "Quickfire Top (not winner)"),
    ("quickfire_bottom", "Quickfire Bottom"),
    ("elimination_win", "Elimination Winner(s)"),
    ("elimination_top", "Elimination Top (not winner)"),
    ("elimination_bottom", "Elimination Bottom"),
    ("lck_win", "LCK Winner(s)"),
    ("sent_to_lck", "Sent to LCK"),
    ("eliminated", "Eliminated (out of competition)"),
]


def connect():
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    load_dotenv(env_path)
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def show_chefs():
    print("\n  Chefs:")
    for i, (cid, name) in enumerate(CHEFS.items(), 1):
        print(f"    {i:2d}. {name}")
    print()


def show_existing(supabase, episode: int):
    resp = (
        supabase.table("episode_results")
        .select("*")
        .eq("episode", episode)
        .execute()
    )
    if not resp.data:
        print(f"  No existing results for episode {episode}.\n")
        return
    print(f"  Existing results for episode {episode}:")
    for row in sorted(resp.data, key=lambda r: (r["event"], r["chef_id"])):
        name = CHEFS.get(row["chef_id"], row["chef_id"])
        print(f"    {row['event']:25s}  {name}")
    print()


def parse_chef_numbers(raw: str) -> list[str]:
    """Parse comma-separated chef numbers (1-indexed) into chef IDs."""
    if not raw.strip():
        return []
    ids = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            num = int(part)
        except ValueError:
            print(f"  Invalid input: {part!r} (expected a number)")
            continue
        if num < 1 or num > len(CHEF_IDS):
            print(f"  Out of range: {num} (must be 1-{len(CHEF_IDS)})")
            continue
        ids.append(CHEF_IDS[num - 1])
    return ids


def collect_results(episode: int) -> list[dict]:
    """Interactively collect episode results."""
    rows = []
    print(f"Enter results for Episode {episode}.")
    print("For each category, enter chef numbers separated by commas, or blank to skip.\n")

    for event, label in CATEGORIES:
        raw = input(f"  {label}: ").strip()
        chef_ids = parse_chef_numbers(raw)
        for cid in chef_ids:
            rows.append({"episode": episode, "chef_id": cid, "event": event})

    return rows


def main():
    parser = argparse.ArgumentParser(description="Enter episode results")
    parser.add_argument("--episode", type=int, required=True, help="Episode number")
    parser.add_argument("--clear", action="store_true", help="Clear existing results for this episode")
    args = parser.parse_args()

    supabase = connect()

    if args.clear:
        print(f"Clearing all results for episode {args.episode}...")
        supabase.table("episode_results").delete().eq("episode", args.episode).execute()
        print("Done.")
        return

    show_chefs()
    show_existing(supabase, args.episode)

    rows = collect_results(args.episode)

    if not rows:
        print("\nNo results to enter.")
        return

    # Show summary
    print("\n  Summary:")
    for row in rows:
        name = CHEFS.get(row["chef_id"], row["chef_id"])
        print(f"    Episode {row['episode']}  {row['event']:25s}  {name}")

    confirm = input("\n  Confirm upsert? (y/N): ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return

    # Upsert rows
    supabase.table("episode_results").upsert(
        rows, on_conflict="episode,chef_id,event"
    ).execute()
    print(f"\n  Upserted {len(rows)} results for episode {args.episode}.")


if __name__ == "__main__":
    main()
