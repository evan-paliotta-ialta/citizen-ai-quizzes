#!/usr/bin/env python3
"""
compliance_client.py — thin wrapper over Anthropic's Compliance API.

Reuses the auth + retry pattern already proven in
"AI Policies/Claude Code Enterprise Deployment/usage_report/claude_org_report.py"
(same key, same headers, same backoff), applied to the endpoints that return
chat titles and full message content rather than activity-log events:

  GET /compliance/organizations                          -> org uuid
  GET /compliance/organizations/{org_uuid}/users          -> user roster
  GET /compliance/apps/chats?user_ids[]=<id>              -> chat titles/metadata
  GET /compliance/apps/chats/{chat_id}/messages           -> full message content

Pagination shape for apps/chats and its messages endpoint is unconfirmed —
run smoke_test.py first and adjust _paginate_* usage below if the real
response doesn't match the cursor-based guess.
"""

import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

PROJECT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_DIR / ".env")

COMPLIANCE_KEY = os.environ.get("CLAUDE_COMPLIANCE_API_KEY", "").strip()
BASE = "https://api.anthropic.com/v1"
HEADERS = {"anthropic-version": "2023-06-01"}


def _get(url: str, params=None) -> dict:
    if not COMPLIANCE_KEY:
        raise RuntimeError("CLAUDE_COMPLIANCE_API_KEY not set — copy it into compliance-api/.env")
    headers = {**HEADERS, "x-api-key": COMPLIANCE_KEY}
    for attempt in range(5):
        r = requests.get(url, headers=headers, params=params, timeout=30)
        if r.status_code == 429 or r.status_code >= 500:
            wait = min(60, 2 ** attempt) + 1.2
            time.sleep(wait)
            continue
        if r.status_code in (401, 403):
            raise RuntimeError(f"Auth error {r.status_code} on {url}: {r.text[:200]}")
        if not r.ok:
            raise RuntimeError(f"{r.status_code} on {url}: {r.text[:200]}")
        return r.json()
    raise RuntimeError(f"Gave up retrying {url} after 5 attempts")


def _paginate_cursor(url: str, base_params: dict,
                      cursor_key: str = "next_page", page_key: str = "page") -> list:
    """Cursor pagination — confirmed shape for /compliance/organizations/{org}/users
    (response has data/has_more/next_page)."""
    rows, cursor = [], None
    params = {**base_params, "limit": 100}
    while True:
        call = dict(params)
        if cursor:
            call[page_key] = cursor
        payload = _get(url, call)
        rows.extend(payload.get("data", []))
        cursor = payload.get(cursor_key)
        if not payload.get("has_more") or not cursor:
            break
        time.sleep(1.0)
    return rows


def _paginate_id(url: str, base_params: dict, rows_key: str = "data",
                  id_field: str = "last_id", before_key: str = "before_id") -> list:
    """Id-based (before_id) pagination — confirmed shape for /compliance/apps/chats
    and /compliance/apps/chats/{id}/messages (response has has_more/first_id/last_id,
    rows under `rows_key` — "data" for the chats list, "chat_messages" for a single
    chat's messages)."""
    rows, before = [], None
    params = {**base_params, "limit": 100}
    while True:
        call = dict(params)
        if before:
            call[before_key] = before
        payload = _get(url, call)
        batch = payload.get(rows_key, [])
        rows.extend(batch)
        if not payload.get("has_more") or not batch:
            break
        before = payload.get(id_field)
        time.sleep(0.5)
    return rows


def get_org_uuid() -> str:
    payload = _get(f"{BASE}/compliance/organizations")
    orgs = payload.get("data", [])
    if not orgs:
        raise RuntimeError(f"No organizations returned: {payload}")
    return orgs[0]["uuid"] if "uuid" in orgs[0] else orgs[0]["id"]


def list_org_users(org_uuid: str) -> list:
    """Returns [{id, email, full_name, organization_role, created_at}, ...]
    for every org member. Note the name field is `full_name`, not `name`."""
    return _paginate_cursor(f"{BASE}/compliance/organizations/{org_uuid}/users", {})


def list_user_chats(user_id: str) -> list:
    """Returns [{id, name, created_at, updated_at, model, project_id, ...}, ...]
    for one user — titles+metadata only, no message content. Note the title
    field is `name`, not `title`."""
    return _paginate_id(f"{BASE}/compliance/apps/chats", {"user_ids[]": user_id})


def get_chat_messages(chat_id: str) -> list:
    """Returns full message content (both user and assistant turns) for one chat.
    The endpoint responds with the parent chat object; messages live under
    `chat_messages`, which this unwraps to a flat list. Expensive relative to
    the above — only call for chats a cheap screen already flagged as worth
    reading in full."""
    return _paginate_id(f"{BASE}/compliance/apps/chats/{chat_id}/messages",
                         {}, rows_key="chat_messages", id_field="first_id")


if __name__ == "__main__":
    import sys
    print("Use smoke_test.py to exercise this client end-to-end against live data.",
          file=sys.stderr)
