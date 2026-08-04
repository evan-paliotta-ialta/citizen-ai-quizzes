# PII/MNPI Detection + Zone-Violation Detection — Research, No Build Yet

## The problem

Two related catalog use cases (Jonathan_Vision_Ideation.docx §7b), both
full-content depth:
- **PII/MNPI detection** — scan message text for PII/MNPI patterns per the
  Module 13 Zone framework; a real enforcement layer behind what's currently
  a training-and-trust policy.
- **Zone-violation detection** — flag chats combining a client name with
  financial/contact detail in a standard (non-ZDR) session, the exact Zone 3
  pattern Module 13 warns about.

Evan's flagged concern: same cost-vs-value balance as the other research
items, but higher stakes on both sides — this is the highest governance
value in the whole catalog (a real MNPI leak is a real incident) and also
the most expensive and most invasive to scan for at scale (full content,
every chat, continuously, would be both costly and a much bigger privacy
footprint than anything else being built here).

## This is a different justification than convergence detection

Worth being precise: convergence detection's full-content reads are scoped
narrowly to "do these two flagged chats overlap," triggered by a titles-only
screen, for a collaboration purpose. PII/MNPI and zone-violation detection
would read full content for a compliance/DLP enforcement purpose instead.
Same API, same account, different reason — and per §6 of the ideation doc,
"proportionate and disclosed, not covert" is the stated principle. That
means this pair of use cases has a **policy prerequisite**, not just a
technical one: the Module 13 / AUP disclosure update needs to land and tell
citizens this kind of monitoring exists before it goes live, even though
nothing legally blocks building it today.

## Candidate approach — two-stage trigger, not a blanket scan

Don't run a full-content model pass over every chat. Pre-filter cheaply
first, using signals available without reading message content:
- A keyword/entity list of Helm client and fund names (sourced from HubSpot
  companies) — flags chats whose title or metadata references a specific
  client.
- A pattern match for financial-detail shapes (account-number-like strings,
  SSN-like patterns, etc.) where that's detectable without a full read.

Only chats that trip one of those cheap triggers get a full-content model
pass for the actual PII/MNPI/Zone-3 judgment. This keeps both the cost and
the privacy footprint bounded to a small, justified subset instead of a
standing scan of a mostly-non-technical, mostly-benign user base — the same
concern the original 2026-06-04 decision to defer the Compliance API's
content slice was built on.

## Why not build now

Blocked on the Module 13/AUP disclosure update, and the trigger word-list
(client/fund names, financial-detail patterns) needs to be built and
maintained by Evan before this is runnable at all. Revisit once that
disclosure work is scheduled — this shouldn't go live silently even in a
low-volume pilot form.
