#!/usr/bin/env python3
"""
smoke_test.py — confirms the Compliance API client actually works against
live data before anything gets built on top of it. Prints response shapes,
not full content, so this is safe to run and read without a second thought
about exposure.

Usage: python3 smoke_test.py [citizen-name-substring]
Defaults to the first user found in the org roster if no name is given.
"""
import sys

import compliance_client as cc


def main():
    print("1. Resolving org uuid...")
    org_uuid = cc.get_org_uuid()
    print(f"   org_uuid = {org_uuid}")

    print("2. Listing org users...")
    users = cc.list_org_users(org_uuid)
    print(f"   {len(users)} users returned. Sample keys: {sorted(users[0].keys()) if users else '(none)'}")

    target = None
    name_filter = sys.argv[1].lower() if len(sys.argv) > 1 else None
    for u in users:
        label = f"{u.get('full_name', '')} {u.get('email', '')}".lower()
        if name_filter is None or name_filter in label:
            target = u
            break
    if not target:
        print(f"   No user matched filter {name_filter!r}. Aborting.")
        return
    print(f"   Using: {target.get('full_name')} <{target.get('email')}> (id={target.get('id')})")

    print("3. Listing chats for that user...")
    chats = cc.list_user_chats(target["id"])
    print(f"   {len(chats)} chats returned. Sample keys: {sorted(chats[0].keys()) if chats else '(none)'}")
    for c in chats[:5]:
        print(f"     - {c.get('created_at')}  {c.get('name')!r}")

    if not chats:
        print("   No chats to test message-fetch against. Done.")
        return

    print("4. Fetching full messages for the most recent chat...")
    chat_id = chats[0]["id"]
    messages = cc.get_chat_messages(chat_id)
    print(f"   {len(messages)} messages returned. Sample keys: "
          f"{sorted(messages[0].keys()) if messages else '(none)'}")
    print("   (Not printing message content here — shape confirmation only.)")

    print("\nSmoke test complete. If all four steps printed real counts and")
    print("keys (not empty/error), the client is ready for pull_and_flag.py.")


if __name__ == "__main__":
    main()
