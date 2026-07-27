**Citizen AI Developer Program**

*The single source of truth for Helm's Citizen AI Developer Program — onboarding, certification, and continuing education*

Program Lead: Evan Paliotta · Version 1.0 · Last verified: 2026-07-21

## Contents

0. How to Use This Document
1. Program Overview and Philosophy
2. Onboarding and Certification Path
3. Continuing Education — Weekly Office Hours
4. Continuing Education — Monthly Mandatory Sessions
5. Continuing Education — Quarterly 1:1s
6. Content Library and Recordings
7. Tools and Infrastructure
8. Program Governance
9. Change Log

---

## 0. How to Use This Document

This document is the operating reference for the Citizen AI Developer Program — everything after initial certification. It complements, not replaces, the course itself (hosted on SharePoint at `helmmarkets.sharepoint.com/sites/citizenai`), which covers the 16-module curriculum, Final Exam, and Capstone in full.

Use this document to answer: what happens after someone earns their license, how the ongoing cadence works, where recordings and reference material live, and what tooling supports program administration.

---

## 1. Program Overview and Philosophy

The program is built on four pillars, introduced to every citizen in Module 0 of the course:

| Pillar | What It Means |
|---|---|
| ADKAR | Change-readiness framework — are people Aware, willing (Desire), trained (Knowledge), capable (Ability), and is the change sticking (Reinforcement)? |
| Capability Maturity | A 5-level model for organizational AI adoption maturity, from "no deliberate use" (Level 1) to "strategic differentiator" (Level 5). The program's goal is Level 3 (Structured) for every citizen team. |
| OKRs | Every citizen project connects to a company objective. AI use that doesn't link to a goal doesn't qualify as program work. |
| Monitor and Measure | Highlander (Helm's internal ODL) tracks commit activity, project velocity, and OKR attribution — the program produces evidence, not just effort. |

**The mental model (Jensen Huang, NVIDIA):** *"AI will not take your job. But someone who uses AI will."* Every job is Purpose (judgment, relationships, decisions) plus Tasks (writing, summarizing, researching, formatting). AI offloads tasks; citizens use the time back to do more purpose-driven work.

**What onboarding builds; what continuing education sustains.** The 16-module course and certification (Section 2) address Knowledge and Ability. Everything in this document — office hours, monthly sessions, quarterly 1:1s — addresses Reinforcement. Without it, ADKAR predicts exactly what happens: initial enthusiasm fades, old habits return, no accountability structure remains.

---

## 2. Onboarding and Certification Path

Full detail lives in the course itself. Summary for reference:

| Stage | What Happens |
|---|---|
| Module 0 | Program philosophy and operating model (no quiz) |
| Modules 1-16 | Foundation through Advanced tracks — see table below |
| Final Exam | 25 multiple-choice questions (auto-graded), passing threshold 20/25 (80%), plus two human-graded Practical Submissions |
| Day 1 Quick Start | Sign the Citizen Developer Agreement, sign in via SSO (Microsoft Entra provisions the Claude Enterprise account automatically — no invite email, no manual request), set up first Project, create first GitHub repo |
| Capstone | Three deliverables (Project instructions, GitHub repo with METADATA.yaml, one real work output) submitted via the program Teams channel within five business days of licensing; license is provisional until acknowledged |

**The 16 modules:**

| # | Module | Track |
|---|---|---|
| 1 | What Claude Is (and Isn't) | Foundation |
| 2 | How the Model Was Built | Foundation |
| 3 | Tokens — The Currency of AI | Foundation |
| 4 | The Context Window | Foundation |
| 5 | Why Specificity is Everything | Foundation |
| 6 | Anatomy of a Good Prompt | Core Skills |
| 7 | Iteration, Examples, and Getting to Great | Core Skills |
| 8 | Tips, Tricks, and Power User Habits | Core Skills |
| 9 | The Operating Framework (Zone system) | Core Skills |
| 10 | Claude Desktop Projects | Claude Desktop |
| 11 | Documents, Images, and Multimodal Input | Claude Desktop |
| 12 | Claude for Your Team | Application |
| 13 | Safety, Data Hygiene, and Responsible Use — perfect score required (7/7) | Foundation (Required for All) |
| 14 | Advanced Claude — MCP, Agents, and RAG | Advanced |
| 15 | GitHub — The Collaboration Layer | Citizen Developer |
| 16 | Databases and Data Storage | Citizen Developer |

Progress can be checked one participant at a time (`/citizen-ai-check`) or for the whole cohort at once (`/citizen-ai-check-bulk`) — see Section 7.

---

## 3. Continuing Education — Weekly Office Hours

**Purpose:** low-stakes, drop-in support. This is where the day-to-day friction of using Claude gets resolved before it turns into abandonment.

**Format:** rotating light structure to avoid staleness —

| Week | Format |
|---|---|
| 1 | Open Q&A — bring your blockers |
| 2 | Feature spotlight — live demo of an advanced capability (Extended Thinking, native connectors, Routines, subagents) |
| 3 | Citizen show-and-tell — a participant walks through something they built |
| 4 | Open Q&A |

**Mechanics:**
- Citizens post blockers ahead of time in the program Teams channel where practical, so the session can triage efficiently
- Attendance is optional — this is support, not certification
- Recorded (raw recording is sufficient, no production polish needed) and posted to the Content Library (Section 6)

---

## 4. Continuing Education — Monthly Mandatory Sessions

**Purpose:** structured reinforcement. This is the ADKAR "Reinforcement" pillar in practice — mandatory because the program's value depends on the change actually sticking, not just training happening once.

**Format:** ownership rotates so it doesn't become a lecture series —

- One month: program-lead-led deep dive on an advanced topic
- One month: citizen presents a real project (peer learning — the best prompter on the team makes everyone better)
- One month: cross-team panel (e.g., Sales and CS comparing how they each use Claude)
- Periodically: a Highlander metrics review, showing the cohort its own aggregate impact — this tends to land better than any external motivational content, because it's their own data
- As needed: safety/zone-framework refreshers, especially after any incident or policy update

**Mechanics:**
- Mandatory attendance, tracked
- Recorded and posted to the Content Library — this is the primary way someone who missed a mandatory session catches up, so recording quality (audio especially) matters more here than for office hours

---

## 5. Continuing Education — Quarterly 1:1s

**Purpose:** individual coaching, not a performance review. The goal is unblocking and goal-setting, tied to the citizen's own OKR-linked work.

**Structure:**

1. **Pre-1:1 self-assessment** (citizen fills out beforehand): what did you build this quarter, what's blocking you, what do you want to learn next
2. **Review Highlander/GitHub activity**: what did they actually ship, tied back to their OKR
3. **Capability Maturity check-in**: has their work moved from Level 2 (Experimenting) toward Level 3 (Structured) — repeatable playbooks, shared prompts, consistent GitHub hygiene?
4. **Set one concrete goal** for the next quarter

**Future automation opportunity:** a one-pager generated per citizen from their Highlander activity ahead of each 1:1, so the quarter's work is summarized before the conversation starts rather than reconstructed from memory. Not built yet — flagged here as a natural next step once the cohort is large enough (50-70 people) that manual prep doesn't scale.

**Not recorded** — these are private coaching conversations. Action items from each 1:1 should be logged somewhere lightweight (a simple tracker, not a full recording) so follow-through can be checked at the next 1:1.

---

## 6. Content Library and Recordings

**Recommendation: do not split the existing course site in half.** The current Home page and module navigation work well and should not be restructured. Instead, add one new entry point — a **Continuing Education Hub** page, linked from Home via a single new card, with everything below living under it as its own set of subpages. This achieves full separation between "the course" and "ongoing programming" without touching the certification flow at all.

**Proposed structure under the hub:**
- Office Hours Archive — recordings by date, lightly tagged by topic
- Monthly Session Library — recordings, with the citizen-presented sessions given equal visibility to program-lead-led ones
- Feature Spotlight Index — a running list of which advanced capability was covered when, cross-linked to the relevant course module (e.g., the Extended Thinking spotlight links back to Module 8)
- 1:1 Prep Resources — the self-assessment template, for admin use

**Not yet built** — this section documents the plan; implementation is a separate piece of work once prioritized.

---

## 7. Tools and Infrastructure

| Tool | What It Does |
|---|---|
| 17 Microsoft Forms (16 module quizzes + Final Exam) | Auto-graded quiz and exam submissions, hosted in the Helm tenant |
| `/citizen-ai-check [name or email]` | Checks one participant's quiz and exam results, reports latest score and attempt count per module, gives a READY / blockers verdict |
| `/citizen-ai-check-bulk` | Checks the entire cohort at once, writes a CSV with one row per participant covering all 16 modules plus Final Exam, and a Verdict column — the way to review the whole program's progress without going participant by participant |
| Highlander (internal ODL) | Tracks GitHub commit activity, project velocity, and OKR attribution post-licensing |
| GitHub | Every citizen project lives in its own repo with a METADATA.yaml linking it to an OKR — see Module 15 |
| Microsoft Entra | Provisions and revokes Claude Enterprise access; licensing is SCIM-based, no manual invite process |

Both `/citizen-ai-check` and `/citizen-ai-check-bulk` require an active session signed into forms.office.com with a Helm (@helmmarkets.com) account — they read live Form responses directly, since Microsoft Forms does not expose a usable score through its API and both tools compute scores by comparing submitted answers against an embedded answer key.

---

## 8. Program Governance

**Licensing:**
- Issuance: Microsoft Entra admin portal → assign the Claude Enterprise app to the student's company email. Live within about an hour; no invitation email is sent.
- Revocation: remove the Entra app assignment and remove from the GitHub citizen team. See the Citizen AI Engineer Policies & Procedures document for the full offboarding checklist.

**Safety and data handling** (full detail in Module 13, required for all citizens with a perfect score):
- Zone 1 (public data only), Zone 2 (internal, non-confidential), Zone 3 (confidential, client data, PII, or any live connected system) — the data determines the zone, not the task. When in doubt, go up a zone.
- Credentials are a hard stop with no exceptions, in any zone.
- Native connectors and MCP connections to live systems are automatically Zone 3, regardless of what data is believed to be involved.

**Human-in-the-loop principle:** any automated workflow that takes a real-world action (sends an email, updates a record, publishes content) requires a human review step before execution, at least until the workflow has proven reliable.

---

## 9. Change Log

| Date | Change |
|---|---|
| 2026-07-21 | Initial version — program overview, continuing education cadence, tools, and governance |
