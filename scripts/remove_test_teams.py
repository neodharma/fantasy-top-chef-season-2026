#!/usr/bin/env python3
"""Remove test teams from the draft database."""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

TEAMS_TO_REMOVE = ["Test1", "Test2", "Test4"]


def main():
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    load_dotenv(env_path)

    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(url, key)

    # Find submissions for these team names
    subs = (
        supabase.table("draft_submissions")
        .select("id, team_name")
        .in_("team_name", TEAMS_TO_REMOVE)
        .execute()
    )

    if not subs.data:
        print("No matching test teams found.")
        sys.exit(0)

    found = [s["team_name"] for s in subs.data]
    ids = [s["id"] for s in subs.data]
    print(f"Found test teams: {found}")

    # Delete draft_picks first (foreign key dependency)
    for sub_id in ids:
        result = (
            supabase.table("draft_picks")
            .delete()
            .eq("submission_id", sub_id)
            .execute()
        )
        print(f"  Deleted picks for submission {sub_id}")

    # Delete the submissions
    for sub_id in ids:
        supabase.table("draft_submissions").delete().eq("id", sub_id).execute()

    print(f"\nRemoved {len(ids)} test team(s): {found}")


if __name__ == "__main__":
    main()
