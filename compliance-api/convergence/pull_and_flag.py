#!/usr/bin/env python3
"""
pull_and_flag.py — pure data mechanics for convergence detection. No LLM
calls live here: this script pulls chat titles for every roster citizen
who is actually in the Claude Enterprise org (many aren't yet — full
rollout is mid-October), caches them locally, diffs against the last run,
and writes a comparison payload for a Claude Code session to screen.

The actual semantic title-similarity judgment happens in the
/convergence-scan skill, not in this script — mirrors how citizen_1on1_prep.js
pulls data and the assistant does the judgment live, rather than scripts
calling out to a separate LLM API (no general-purpose Messages API key
exists in this workspace; only the Compliance-scoped key, which can't call
Claude at all).

Usage: python3 pull_and_flag.py
Writes:
  cache/chats_cache.jsonl   — append-only, every chat ever seen, one per line
  cache/last_run.json       — per-citizen last-seen updated_at, for the next diff
  cache/pending_screen.json — this run's new chats + the full cross-citizen
                              pool, ready for the assistant to read and screen
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
import compliance_client as cc

ROOT = Path(__file__).resolve().parent.parent.parent
ROSTER_PATH = ROOT / "citizen_roster.json"
CACHE_DIR = Path(__file__).resolve().parent.parent / "shared" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
CHATS_CACHE = CACHE_DIR / "chats_cache.jsonl"
LAST_RUN = CACHE_DIR / "last_run.json"
PENDING_SCREEN = CACHE_DIR / "pending_screen.json"


def load_cache() -> dict:
    """Returns {chat_id: chat_record} for everything ever pulled."""
    cache = {}
    if CHATS_CACHE.exists():
        with open(CHATS_CACHE) as f:
            for line in f:
                if line.strip():
                    rec = json.loads(line)
                    cache[rec["id"]] = rec
    return cache


def append_new(records: list):
    with open(CHATS_CACHE, "a") as f:
        for rec in records:
            f.write(json.dumps(rec) + "\n")


def match_roster_to_org(org_uuid: str) -> tuple:
    roster = json.load(open(ROSTER_PATH))
    org_users = cc.list_org_users(org_uuid)
    org_by_name = {u["full_name"].strip().lower(): u for u in org_users if u.get("full_name")}
    matched, unmatched = [], []
    for c in roster:
        key = c["name"].strip().lower()
        if key in org_by_name:
            u = org_by_name[key]
            matched.append({"name": c["name"], "team": c["team"],
                             "email": u["email"], "user_id": u["id"]})
        else:
            unmatched.append(c["name"])
    return matched, unmatched


def main():
    print("Resolving org + roster...")
    org_uuid = cc.get_org_uuid()
    matched, unmatched = match_roster_to_org(org_uuid)
    print(f"  {len(matched)}/{len(matched) + len(unmatched)} roster citizens are in the "
          f"Enterprise org today. Not yet onboarded (expected until mid-October): "
          f"{', '.join(unmatched) if unmatched else '(none)'}")

    cache = load_cache()
    last_run = json.load(open(LAST_RUN)) if LAST_RUN.exists() else {}
    new_last_run = dict(last_run)
    new_records = []

    for citizen in matched:
        chats = cc.list_user_chats(citizen["user_id"])
        newest_seen = last_run.get(citizen["email"])
        new_this_citizen = 0
        for chat in chats:
            if chat["id"] in cache:
                continue  # already cached from a prior run
            rec = {
                "id": chat["id"],
                "citizen": citizen["name"],
                "team": citizen["team"],
                "title": chat.get("name"),
                "created_at": chat.get("created_at"),
                "updated_at": chat.get("updated_at"),
                "model": chat.get("model"),
                "project_id": chat.get("project_id"),
            }
            new_records.append(rec)
            cache[rec["id"]] = rec
            new_this_citizen += 1
            if not newest_seen or (rec["updated_at"] and rec["updated_at"] > newest_seen):
                newest_seen = rec["updated_at"]
        if newest_seen:
            new_last_run[citizen["email"]] = newest_seen
        print(f"  {citizen['name']}: {len(chats)} total chats, {new_this_citizen} new this run")

    append_new(new_records)
    json.dump(new_last_run, open(LAST_RUN, "w"), indent=2)

    # Build the screening payload: every NEW chat this run, plus the full
    # historical title pool grouped by citizen (excluding each chat's own
    # author) for the assistant to compare against. Never expires, so a
    # chat from months ago is still comparable — this is what makes
    # delayed-reuse detection possible, not just same-day overlap.
    by_citizen = {}
    for rec in cache.values():
        by_citizen.setdefault(rec["citizen"], []).append(
            {"chat_id": rec["id"], "title": rec["title"], "created_at": rec["created_at"]})

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "new_chats_this_run": new_records,
        "title_pool_by_citizen": by_citizen,
        "roster_not_yet_onboarded": unmatched,
    }
    json.dump(payload, open(PENDING_SCREEN, "w"), indent=2)

    print(f"\n{len(new_records)} new chats this run. Screening payload written to "
          f"{PENDING_SCREEN.relative_to(ROOT)}")
    print("Next: run the /convergence-scan skill to screen these for cross-citizen overlap.")


if __name__ == "__main__":
    main()
