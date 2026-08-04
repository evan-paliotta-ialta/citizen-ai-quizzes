# Compliance API — Convergence Detection Build

**Date:** 2026-08-03
**Project / Portal:** Citizen AI Program, Claude Enterprise org (Helm Markets, org_uuid `a32e1c1a-7881-4647-a9dd-05db491115cc`)
**Scope:** Built and live-tested the first two Compliance API use cases prioritized from `Jonathan_Vision_Ideation.docx` §7: convergence/overlap detection (new) and 1:1 prep signals (extends the existing `/citizen-1on1-prep` skill). Three other catalog use cases got research docs only, no code. One use case dropped outright.

---

## What's live (the final state)

| Component | Path | Status |
|---|---|---|
| Compliance API client | `compliance-api/shared/compliance_client.py` | Live-tested |
| Convergence pull + cache | `compliance-api/convergence/pull_and_flag.py` | Live-tested |
| `/convergence-scan` skill | `~/.claude/commands/convergence-scan.md` | Live-tested, run manually |
| Deep-compare data puller | `compliance-api/convergence/deep_compare.py` | Live-tested |
| Convergence Queue list creator | `compliance-api/convergence/setup_convergence_list.js` | Ran live — list exists |
| Convergence Queue writer | `compliance-api/convergence/convergence_queue.js` | Live-tested, wrote + read back one real row |
| Daily cron scaffolding | `compliance-api/convergence/run_daily.sh` + `com.ialta.convergence-scan.plist` | Written, **not installed** |
| 1:1 prep signal extension | `citizen_1on1_prep.js` (existing file, extended in place) | Live-tested |
| Research docs (no code) | `compliance-api/research/*.md` (3 files) | Written |
| Decisions log | `compliance-api/DECISIONS.md` | Written |

Real data produced by this session:
- **8/20 roster citizens** are actually in the Claude Enterprise org today (Dan Blasi, Sarah Sherman, Brian Marcus, Auria Fuentes, Troy Delagardelle, Barty Gray, Louise Downey, Harry Tustin) — the rest onboard through mid-October.
- **55 real chats** pulled and cached across the 4 citizens with activity (Sarah Sherman, Brian Marcus, Barty Gray, Harry Tustin).
- **One real convergence finding**, sitting as a Pending row in the "Convergence Queue" SharePoint list: Brian Marcus and Barty Gray, both CS, independently working the same week on fixing missing/incorrect investor data fields at scale on the platform — Brian identified the problem and asked tech to script a fix; Barty had already built working Playwright/Excel automation that does exactly that.

## Design decisions and why

1. **No LLM calls inside Python scripts.** The original convergence design assumed a script calling Claude/Haiku directly for the title-similarity and deep-compare judgment. There is no general-purpose Anthropic Messages API key anywhere in this workspace (only `CLAUDE_COMPLIANCE_API_KEY`, scoped `read:compliance_*`, which can't call Claude at all). Rebuilt around the existing pattern in this repo: scripts do pure data mechanics (pull, cache, diff), and a Claude Code session does the semantic judgment live — exactly how `/citizen-1on1-prep` already works. This became the `/convergence-scan` skill.
2. **Cloud "schedule" routines rejected for the daily cron.** Tried the `schedule` skill (RemoteTrigger/cloud routines) first. Rejected once its own docs made clear cloud routines run in an isolated sandbox with no access to local files — this pipeline needs the local `.env` (Compliance API key) and the local Playwright SharePoint auth session, neither of which is or should be committed to a git repo a cloud agent could clone. Fell back to the same local-launchd pattern the existing `usage_report` cron already uses, but invoking `claude -p "/convergence-scan"` (non-interactive Claude Code) rather than a bare Python script, since this cron needs real reasoning, not just data pulls.
3. **Cron built but not installed.** Per Helm's own AI-usage guardrails, an automation touching credentials, a live API, and running on a schedule is a Tier 3 automation requiring an Office of the CIO review before going live — a separate gate from Jonathan's earlier verbal approval of reading chat content itself. The plist and wrapper script exist; installing into launchd is one command, deliberately not run this session.
4. **1:1 signals extend the existing script, no new skill.** Considered a new `/oneonone` skill superseding `/citizen-1on1-prep`. Evan chose extension over replacement to avoid a skill-identity migration for a working command — `citizen_1on1_prep.js` grew three new output sections instead.
5. **Wide net at the title-screen stage, criteria-based filter at deep-compare.** Evan's explicit call: cast a loose net cheaply (titles only), let the expensive full-content read be the real filter. Confirmed working as designed — the pipeline flagged 2 candidates and correctly rejected 1 (Sarah Sherman's chat turned out to be an unrelated client-facing release-note draft, not investor-data work).
6. **Three use cases parked as research-only.** Cost attribution per OKR, ROI/success-story mining, and PII/MNPI + Zone-violation detection each got a design doc instead of code, per Evan's own flagged concern that the mapping/trigger design for each isn't solved yet. The PII/MNPI doc is explicitly blocked on the Module 13/AUP disclosure update landing first, not just a technical prerequisite.
7. **Prompt library / redundant-question detection dropped, not deferred.** Evan's reasoning: every citizen's query differs enough that a fixed-prompt match would misfire and read as invasive.

## Pitfalls and gotchas

- **Compliance API field names don't match the ideation doc's assumptions.** User records use `full_name`, not `name`. Chat records use `name` for the title, not `title`. Caught by running a live smoke test before building further, not by reading docs.
- **Pagination style differs by endpoint.** `/compliance/organizations/{org}/users` is cursor-based (`data`/`has_more`/`next_page`). `/compliance/apps/chats` and `/compliance/apps/chats/{id}/messages` are id-based (`has_more`/`first_id`/`last_id`), matching the existing `activities` endpoint's style, not the Analytics cursor style. The messages endpoint also returns the parent chat object with messages nested under `chat_messages`, not `data`.
- **No general Anthropic Messages API key exists in this workspace** — only `CLAUDE_COMPLIANCE_API_KEY` (compliance-scoped) and `CLAUDE_ADMIN_API_KEY`/`CLAUDE_ANALYTICS_API_KEY` (admin/analytics-scoped). Any future use case here that seems to need "an LLM call from a script" should instead become a Claude Code skill.
- **The new "Convergence Queue" SharePoint list defaults to open permission inheritance.** Creating a list via REST does not replicate "1on1 Tracker"'s Owners-only lock — that appears to have been set once manually via the SharePoint UI, with no scripted pattern in this repo to mirror. Left as a manual one-time step (see Related Files / open item below).

## Verification log

- `smoke_test.py` against Jonathan Meyer's real account: org uuid resolved, 28 org users returned, 19 real chat titles returned, full message content returned for 1 chat (2 messages).
- `pull_and_flag.py` full run: 8/20 roster citizens matched to real org users by `full_name`; 55 new chats pulled and cached; `pending_screen.json` written.
- Manual title screen (this session, not scripted) over the 55-chat pool: flagged Brian Marcus / Barty Gray (investor-data theme) and Brian Marcus / Sarah Sherman (weaker, data-export theme) as candidates.
- `deep_compare.py` against 7 real chat_ids: fetched real message content (4 to 74 messages per chat). Read directly and judged: Brian/Barty **confirmed** genuine overlap (concurrent, connect recommended); Sarah Sherman's chat **rejected** (client-facing release-note draft, different objective).
- `setup_convergence_list.js` run live: "Convergence Queue" list created with 10 custom fields, all confirmed `ok`.
- `convergence_queue.js` run live with the real Brian/Barty verdict; read back via a direct REST GET immediately after — all fields (CitizenB, ChatTitleA/B, OverlapType, ConnectRecommended, PriorWorkSummary, Reasoning, Status=Pending, DateFlagged) persisted correctly.
- `citizen_1on1_prep.js` extension run against **Barty Gray** (real cached data: 34 chats, weekly cadence breakdown, model distribution `claude-sonnet-4-6`/`claude-sonnet-5`, 2 similar-title pairs) and **Nik Mitev** (not yet onboarded — confirmed the graceful fallback message, not an error).
- `.gitignore` correctness confirmed via `git check-ignore -v` on the actual secret and cache files: `.env`, `chats_cache.jsonl`, `pending_screen.json`, and the Python `__pycache__` artifact all resolved as ignored.

## What was NOT verified

- The daily cron (`run_daily.sh` + plist) has never actually been run via launchd — written and reviewed, but not installed, per the Tier 3 policy gate.
- `claude -p "/convergence-scan" --permission-mode bypassPermissions --allowedTools "Bash,Read"` has not been test-run end-to-end as a true non-interactive headless invocation — only the individual steps (pull_and_flag.py, deep_compare.py, convergence_queue.js) were run manually inside this interactive session.
- The "Convergence Queue" list's permission inheritance has not been broken to Owners-only yet — it is currently open, same as a freshly created list, unlike "1on1 Tracker".
- Coverage is thin by necessity: only 4 of 8 onboarded citizens had any chat activity to test against, and only 1 team pairing (both CS) produced a real overlap candidate. Cross-team convergence detection (the scenario most valuable to Jonathan's original "siloed department" concern) is unverified until more citizens onboard through mid-October.
- The three research docs (cost attribution, ROI mining, PII/MNPI+zone) are design thinking only — none of their recommended pilot/trigger approaches have been prototyped.
- Model-selection discipline and capability-maturity signals in `citizen_1on1_prep.js` are simple heuristics (model-count distribution, Jaccard title-overlap), not validated against an actual 1:1 conversation yet.

## How to revisit / extend / roll back

- **Run the pipeline manually:** `cd "Citizen AI Engineer" && /convergence-scan` (as a Claude Code skill invocation) — safe to re-run anytime, only ever adds Pending rows.
- **Refresh 1:1 signals for anyone:** `node citizen_1on1_prep.js "<name>"` — unchanged command, richer output for the 8 onboarded citizens.
- **Install the daily cron** (only after the Tier 3 Office-of-the-CIO review clears):
  ```
  cp "compliance-api/convergence/com.ialta.convergence-scan.plist" ~/Library/LaunchAgents/
  launchctl load ~/Library/LaunchAgents/com.ialta.convergence-scan.plist
  ```
- **Break the Convergence Queue list to Owners-only** in the SharePoint UI (Site contents → Convergence Queue → List settings → Permissions for this list → Stop Inheriting Permissions → remove everything except Owners) — do this before more real data accumulates in it.
- **Roll back:** delete `compliance-api/` from the repo, remove the `.gitignore` addition, revert `citizen_1on1_prep.js` to its prior version (git diff will show exactly the added block), delete `~/.claude/commands/convergence-scan.md`. The "Convergence Queue" SharePoint list would need manual deletion in the UI (not scripted here). Nothing was pushed to git this session — check `git status` before any of this.
- **Extend to a new use case:** follow the `research/*.md` docs' recommended pilot approach for cost attribution, ROI mining, or PII/MNPI detection — each has an explicit "why not build now" and a concrete first step.

## Related files

- Plan: `~/.claude/plans/eager-noodling-bird.md`
- `compliance-api/README.md` — status section reflects this session's exact test results
- `compliance-api/DECISIONS.md` — prompt-library/redundant-question detection dropped; course-gap detection ad hoc only
- `compliance-api/research/cost-attribution-per-okr.md`
- `compliance-api/research/roi-success-story-mining.md`
- `compliance-api/research/pii-mnpi-zone-violation.md`
- Source ideation doc: `~/Downloads/Jonathan_Vision_Ideation.docx` (§7 use-case catalog, §5b live API test)
