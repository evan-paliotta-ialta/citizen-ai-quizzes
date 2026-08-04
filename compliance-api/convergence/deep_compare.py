#!/usr/bin/env python3
"""
deep_compare.py — pure data mechanics for the expensive stage of convergence
detection. Given a list of chat_ids flagged by the title screen, pulls full
message content for each and writes it to a local file for a Claude Code
session to actually judge (no LLM call happens in this script — see
pull_and_flag.py's docstring for why).

Usage: python3 deep_compare.py <chat_id> [<chat_id> ...]
Writes: cache/deep_compare_<timestamp>.json (gitignored)
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
import compliance_client as cc

CACHE_DIR = Path(__file__).resolve().parent.parent / "shared" / "cache"


def extract_text(message: dict) -> str:
    """Flattens a chat_messages entry's `content` blocks to plain text,
    noting (but not including) any artifacts/generated_files/uploaded files."""
    parts = []
    for block in message.get("content", []) or []:
        if isinstance(block, dict) and block.get("type") == "text":
            parts.append(block.get("text", ""))
        elif isinstance(block, str):
            parts.append(block)
    text = "\n".join(parts)
    extras = []
    if message.get("artifacts"):
        extras.append(f"[{len(message['artifacts'])} artifact(s)]")
    if message.get("generated_files"):
        extras.append(f"[{len(message['generated_files'])} generated file(s)]")
    if message.get("files"):
        extras.append(f"[{len(message['files'])} uploaded file(s)]")
    if extras:
        text += "\n" + " ".join(extras)
    return text


def fetch_chat(chat_id: str) -> dict:
    messages = cc.get_chat_messages(chat_id)
    return {
        "chat_id": chat_id,
        "message_count": len(messages),
        "messages": [{"role": m.get("role"), "text": extract_text(m),
                      "created_at": m.get("created_at")} for m in messages],
    }


def main():
    chat_ids = sys.argv[1:]
    if not chat_ids:
        print("Usage: python3 deep_compare.py <chat_id> [<chat_id> ...]", file=sys.stderr)
        sys.exit(1)

    results = [fetch_chat(cid) for cid in chat_ids]
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = CACHE_DIR / f"deep_compare_{ts}.json"
    json.dump({"fetched_at": ts, "chats": results}, open(out_path, "w"), indent=2)

    for r in results:
        print(f"{r['chat_id']}: {r['message_count']} messages fetched")
    print(f"\nWritten to {out_path}. Read this file directly to judge overlap "
          f"against the criteria in the convergence plan — no separate LLM call needed.")


if __name__ == "__main__":
    main()
