# Compliance API Use Cases

Builds on top of Anthropic's Compliance API (Enterprise-only, Primary-Owner-only —
see `AI Policies/Claude Code Enterprise Deployment/Compliance-API-Explainer.md`),
which was live-tested against Jonathan Meyer's account on 2026-07-30 and confirmed
working end-to-end (org lookup, user lookup, chat titles, full message content).
Full use-case catalog and reasoning: `Jonathan_Vision_Ideation.docx` (Downloads),
§7. Evan's prioritization and the resulting build plan are recorded in the plan
that produced this directory.

## Titles vs. full content — the depth rule

Default to **titles-only** for anything program-management-related. Reserve
**full message content** for the specific cases where title-level signal
genuinely isn't enough, and read full content only for the subset of chats
that a cheap, titles-only pass already flagged — never as a blanket scan.
This isn't just cost discipline: published guidance on enterprise AI monitoring
calls for it to be "proportionate and disclosed, not covert." Titles-first,
full-content-only-where-justified is what that looks like in practice.

## What's here

- `shared/` — the Compliance API client and the local chat-title cache every
  use case reads from. One pull, many consumers — nothing here re-pulls data
  another piece already has.
- `convergence/` — overlap/convergence detection: the flagship build, most
  directly tied to Jonathan's "go far together" ask. See its own notes inline
  in `convergence/run_daily.sh`.
- `research/` — design docs only, no code, for use cases that have a real
  open design question before they're buildable.
- `DECISIONS.md` — use cases considered and explicitly not built, with why.

## What's NOT here

1:1 prep signals (adoption cadence, model-selection discipline, capability
maturity) live in `../citizen_1on1_prep.js`, not in this directory — they
extend the existing `/citizen-1on1-prep` skill rather than becoming a new one.

## Data handling

Chat titles and content pulled from the Compliance API are Confidential-class
data per Helm's AI usage policy. Raw pulls are cached locally under
`shared/cache/` and are gitignored — never commit them. Only derived,
already-reviewed outputs (SharePoint tracker rows, doc summaries) leave this
directory's local cache.

## Status (as of the first real build/test pass)

- `shared/compliance_client.py` — live-tested against the real org (28 users,
  Jonathan Meyer's 19 real chats, full message content for one chat).
- `convergence/pull_and_flag.py` — live-tested: 8/20 roster citizens are
  actually in the Enterprise org today (the rest onboard through
  mid-October); pulled 55 real chats across the 4 active ones.
- `convergence/deep_compare.py` + the `/convergence-scan` skill's screening
  logic — live-tested: found and confirmed one real cross-citizen overlap
  (Brian Marcus / Barty Gray, investor-onboarding data-fix work), correctly
  rejected a second candidate (Sarah Sherman's chat turned out to be an
  unrelated release-note draft).
- `convergence/setup_convergence_list.js` — ran live; **"Convergence Queue"
  list exists on the SharePoint site now, but still has default (open)
  permission inheritance.** Break it to Owners-only in the SharePoint UI,
  matching "1on1 Tracker", before this list holds anything beyond the one
  test row already in it.
- `convergence/convergence_queue.js` — live-tested: wrote and read back the
  Brian/Barty verdict successfully.
- `convergence/run_daily.sh` + `com.ialta.convergence-scan.plist` — written,
  **not installed into launchd yet**. This automation touches credentials, a
  live API, and would run on a schedule — per Helm's own AI-usage guardrails
  that's a Tier 3 automation requiring an Office of the CIO review before it
  goes live, separate from Jonathan's earlier approval of reading chat
  content itself. Install with `cp compliance-api/convergence/com.ialta.convergence-scan.plist
  ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.ialta.convergence-scan.plist`
  only after that review.
- `citizen_1on1_prep.js` extensions — live-tested against Barty Gray (real
  signals) and Nik Mitev (graceful "not onboarded yet" fallback).
