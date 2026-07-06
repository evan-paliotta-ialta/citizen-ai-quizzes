# Citizen AI Developer Program — Refresh and Migration Plan
**Date:** 2026-06-26
**Based on:** `course-audit-2026-06-26.md`
**Scope:** Full course content update + migration from iAltA to Helm SharePoint, including all connected infrastructure (MS Forms, `/citizen-ai-check` skill, Citizen Developer Agreement, GitHub references, provisioning workflow)

---

## What This Plan Covers

The course currently lives on iAltA SharePoint and was built for a team on Claude Teams. Helm has since moved to Claude Enterprise with Microsoft Entra SCIM provisioning. The course content has iAltA branding, outdated product names, wrong model IDs, and critically wrong onboarding instructions (Day 1 tells users to wait for an invite email that will never arrive).

This plan covers four tracks that run in parallel once prerequisites are met:

| Track | What | When |
|-------|------|------|
| A | Content updates (text edits on existing site) | Start now |
| B | New content sections (advanced features gap) | After Track A |
| C | Infrastructure migration (SharePoint, Forms, Skill, docs) | After Helm tenant ready |
| D | Cutover and decommission | After Track C complete |

---

## Prerequisites (do before starting)

**P1 — Confirm Helm SharePoint tenant**
Does `helmmarkets.sharepoint.com` have a Communications site provisioned? If not, request creation from the M365 admin (Ben Cable or whoever has Global Admin on the Helm tenant). This is the blocking dependency for Track C.

**P2 — Confirm Helm Microsoft 365 tenant for Forms**
MS Forms for the new quizzes need to live in the Helm tenant so Helm employees can submit responses. Confirm that `forms.office.com` is accessible with a `helmmarkets.com` account and that you can create forms there.

**P3 — Confirm GitHub org for citizen developers**
Day 1 currently tells users to create repos at `github.com/ialta`. What is the correct org for citizen developers on Helm? Options:
- Create a new `github.com/helm-markets-ai` org for citizen dev repos
- Have citizens create repos in their personal GitHub accounts under a naming convention
- Use the existing `evan-paliotta-ialta` org with a new team
Decide this before updating Day 1.

**P4 — Confirm Teams vs. Slack for program channel**
Day 1 Step 7 tells participants to post in "the Citizen AI Developer Program Teams channel." Helm employees use Slack for most internal communication. Decide: does the program channel move to Slack, stay on Teams, or both?

---

## Track A — Content Updates on Existing Site

Do this now, before migration. It unblocks the next cohort immediately without waiting for Helm SharePoint.

### A1 — Global find-replace across all 17 source markdown files

Source files are in `Citizen AI Engineer/course-content/`. These are the authoritative source of truth — update here first, then push to SharePoint pages.

| Find | Replace | Files affected |
|------|---------|---------------|
| `iAltA` | `Helm` | All modules, Final Exam, Day 1 |
| `Claude Teams` | `Claude Enterprise` | Module 0, Day 1, Final Exam |
| `Claude Desktop license` | `Claude Enterprise account` | Module 0, Home, Final Exam, Day 1 |
| `claude-opus-4-5` | `claude-opus-4-8` | Module 2 |
| `claude-sonnet-4-5` | `claude-sonnet-4-6` | Module 2 |
| `claude-haiku-4-5` | `claude-haiku-4-5-20251001` | Module 2 |
| `evan@ialta.com` | `evan@helmmarkets.com` | Day 1 |
| `internal to iAltA` | `internal to Helm` | Module 13 |

**Note on "Claude Desktop":** Not a blanket replace. Replace when it means "the primary chat interface" — change to "claude.ai (Enterprise)." Keep references that are technically specific (Claude Desktop as a downloadable app distinct from claude.ai web) because both still exist. Full guidance:

- "Open Claude Desktop" when it means "open your Claude interface" → "Open claude.ai"
- "This course is about Claude Desktop" → "This course covers claude.ai (Enterprise) and Claude Code"
- "Claude Desktop Projects" as the feature name → "claude.ai Projects"
- "Artifacts are a Claude Desktop and Claude.ai feature" → leave (accurate, both have it)
- "Claude Code equivalent of Claude Desktop Projects" → leave (accurate contrast)

### A2 — Day 1 Quick Start: full rewrite of Steps 2-3 (CRITICAL)

This is the most important edit. Current content will cause new users to wait indefinitely for an invite email that never arrives.

**Current Step 2:**
> Email evan@ialta.com: Subject: Claude Teams License Request — [Your Name]
> Attachment: The signed acknowledgment page
> Evan will add you to the Claude Teams organization within one business day. You will receive an invite email from Anthropic.

**New Step 2:**
> There is nothing to request. Your account is provisioned automatically by the program admin through Microsoft Entra.
>
> After you pass the Final Exam and submit your signed Agreement (Step 1), the program admin assigns you in Entra. Within about an hour, your account is live. **No invitation email will arrive — that is normal with enterprise provisioning.**

**Current Step 3:**
> If you are using Claude.ai in a browser or the mobile app instead — stop. Those do not have the program's safety controls. All company work runs through Claude Desktop or Claude Code.

**New Step 3:**
> **Signing in for the first time:**
> Go to [claude.ai](https://claude.ai) → click **"Continue with SSO"** → enter your @helmmarkets.com email → complete the Microsoft login → you'll land in the **Helm Markets** organization.
>
> You can use Claude in any of these places — all are org-governed with the same safety controls:
> - **claude.ai in any browser** (recommended for most work)
> - **Claude Desktop** (downloadable app — same as the browser but installed locally)
> - **Claude Code** (terminal-based, for technical work)
>
> If after an hour you sign in and don't see "Helm Markets" at the top, contact the program admin.

### A3 — Module-specific targeted edits

Beyond the global replace, these modules need manual edits that search-and-replace won't catch:

**Module 1:** 
- Change: "This course is about Claude Desktop" → "This course covers claude.ai (Enterprise), Claude Code, and the broader Claude ecosystem."

**Module 2:**
- Update all Claude Code `/model` command examples from old model IDs to new ones
- Add a note: "Model versions are updated regularly — check [claude.ai/models] for the current lineup. The tier names (Haiku/Sonnet/Opus) stay consistent even as version numbers change."

**Module 9 — Driving Zones Decision Flowchart:**
- "Is any data internal to iAltA?" → "Is any data internal to Helm?"

**Module 10 — CLAUDE.md example:**
```
Role: Marketing Manager, Helm Markets. Responsible for B2B content across email, LinkedIn, and client-facing materials.

Company Context: Helm Markets is a financial technology platform. Clients are institutional investors, GPs, and family offices. Tone is professional, direct, and jargon-free.

Standing Rules:
Always use active voice
Never use the words "leverage," "synergy," or "seamless"
All client-facing output should end with a clear call to action
Flag any claim that requires a data source

Reference: Products: Verivend (fund administration), Structuring (deal structuring platform). Key contacts: Dan (Sales), Sam (CS).
```

**Module 10 — Module title:**
- Rename from "Claude Desktop Projects" to "Projects and Persistent Context"
- Update all internal references to reflect claude.ai as the primary Projects interface

**Module 12 — HR section:**
- Job description template prompt: "Write a job description for a [Title] role at Helm Markets."

**Module 13 — Zone 2 description:**
- "Internal iAltA information" → "Internal Helm information"

**Final Exam — Practical Submission 1:**
- "You join a new team at iAltA" → "You join a new team at Helm"

**Final Exam — Practical Submission 2 checklist:**
- "Before receiving your Claude Desktop license" → "Before receiving your Claude Enterprise account"
- "Created a Project in Claude Desktop" → "Created a Project in claude.ai"

**Day 1 — Project template in Step 4:**
- "I'm [Name], [Role] at iAltA" → "at Helm"

**Day 1 — GitHub repo step (Step 5):**
- Update org URL to correct Helm GitHub org (pending P3 decision)
- `owner: "your.name@ialta.com"` → `"your.name@helmmarkets.com"`
- `started: "2026-[today's date]"` → leave as template placeholder (correct)

**Day 1 — Step 7 channel reference:**
- Update channel name/platform per P4 decision

### A4 — Push updates to SharePoint pages

Once source markdown files are updated, use the existing Playwright automation pattern from this repo (`update_course_content.js` / `update_sharepoint_safety_module.js`) to push each updated file to the corresponding SharePoint page.

Pages requiring updates:
- Home page (product name)
- Module 0 (company + product name)
- Module 1 (framing line)
- Module 2 (model IDs)
- Module 3 (minor exercise wording)
- Module 9 (Driving Zones)
- Module 10 (title + CLAUDE.md example)
- Module 12 (HR template)
- Module 13 (Zone 2)
- Final Exam (scenario + checklist)
- Day 1 Quick Start (Steps 2-3 full rewrite + supporting changes)

Modules with no SharePoint page changes needed (content is evergreen): 4, 5, 6, 7, 8, 11, 14, 15, 16.

---

## Track B — New Content (advanced features gap)

These are new sections that don't exist yet. Write them in `course-content/` first, then publish to SharePoint. They can be added as new sections within existing modules or as standalone addendums.

### B1 — claude.ai Native Connectors (highest value, add to Module 14)

Add a new section after "MCP Servers — Claude With Superpowers":

**Title:** "What's Available Right Now — No Developer Required"

**Content to cover:**
- claude.ai Enterprise has a built-in connector panel (Settings → Connectors)
- Available today: HubSpot, Slack, Google Drive, GitHub, Clay, and growing list
- How to add: Settings → Connectors → authorize the tool → done. No code, no MCP server setup, no IT ticket.
- Example walkthrough: Connect HubSpot → ask "Summarize my open deals this week" → Claude reads your actual CRM data
- Data zone: connecting a live system is automatic Zone 3, regardless of what data you think you're pulling
- Difference from custom MCP: connectors are pre-built, pre-approved, no setup cost; custom MCP is for tools not in the list or for complex/custom integrations
- Approved connectors for Helm: see the AI policy (same list as managed settings — HubSpot, Slack, Google Drive, GitHub, Highlander, Playwright)

**Practical exercise:**
Connect one native connector to a tool you use daily. Have a real conversation with Claude that references live data from that tool. Note whether the output quality is meaningfully better than copy-paste.

### B2 — Extended Thinking (add to Module 8)

Add after "Flag What Claude Is Not Sure About":

**Title:** "Extended Thinking — Getting Claude's Deepest Reasoning"

**Content to cover:**
- Opus 4 supports extended thinking: before answering, Claude reasons through the problem step by step, considering alternatives and checking its own logic
- When to use it: complex strategy calls, multi-factor analysis, anything where the first answer feels shallow or too quick
- How to activate: switch to Opus in claude.ai model selector, then add "Before you answer, take your time and think through this carefully from multiple angles. Consider the strongest counterarguments before giving me your recommendation."
- The visible result: a collapsible "thinking" section before the answer showing Claude's reasoning chain
- Cost/time tradeoff: 2-3x slower than a standard response, consumes more tokens. Don't use for routine tasks — save it for the decisions that matter.
- Not a magic upgrade: it helps with problems that have genuine logical depth. It won't fix a vague prompt.

### B3 — Routines (add to Module 14)

Add after "Agents — When Claude Takes Actions":

**Title:** "Routines — Scheduled Tasks Without a Developer"

**Content to cover:**
- Routines (Claude Enterprise feature): tasks that run on a schedule without you initiating each one
- You describe the task, set the schedule (daily at 8am, every Monday, monthly), and Claude runs it and delivers output
- Output delivery: to your email, to a Slack channel, or saved to a location you specify
- Examples: daily pipeline summary, weekly competitor news digest, monthly usage report, Friday end-of-week team summary
- This is the "agent" concept made non-technical — you don't need to build anything
- Human review still required: for anything going to clients or leadership, configure the routine to draft and deliver to your inbox for review rather than sending directly
- Data zones apply: a routine that connects to live CRM data is Zone 3, same rules as any other Zone 3 task
- Where to find it: claude.ai → left sidebar → Routines (or equivalent navigation when live for your account)

**Practical exercise:**
Identify one recurring report or summary you produce manually each week. Draft the prompt you would use for a Routine to produce a first draft of that report. Even if you're not ready to deploy the Routine, having the prompt ready means you can start when you decide to.

### B4 — Shared Projects for Teams (add to Module 10)

Add after "Building Your First Project: Step by Step":

**Title:** "Shared Projects — Team Context, Not Just Individual Context"

**Content to cover:**
- Claude Enterprise allows Projects to be shared across multiple team members
- Every person on the team opens their conversations inside the shared Project and starts with the same org context pre-loaded
- Use case examples: CS team Project with the renewal playbook and product brief; Sales team Project with ICP, objection library, and tone guide; Marketing team Project with brand voice and campaign context
- How to set one up: create a Project → Project settings → Share with people or groups → team members see it in their Projects list
- What goes in a shared Project vs. individual Project: standing context that applies to everyone on the team goes in the shared Project; personal preferences and individual standing rules stay in your personal Project
- Governance: the Project owner controls the instructions. Establish who maintains it and how often it gets reviewed.

**Practical exercise:**
Think about your team's most common Claude task. Write the Project instructions that would load before every conversation in a shared team Project. What context would every team member benefit from having pre-loaded?

### B5 — Claude Code Advanced Features (expand Module 10)

Expand the "Claude Code Equivalent: CLAUDE.md Files" section to include:

**Sub-section: Beyond CLAUDE.md — What Claude Code Can Do**

- **/research command:** Ask Claude Code to research a topic and it browses the web, reads multiple sources, and delivers a synthesized report. Usage: type `/research [your question]` at the start of any Claude Code session.
- **/review command:** Structured review of a document or piece of code with explicit feedback dimensions. Usage: type `/review` followed by the content or file path.
- **Session memory:** Claude Code automatically remembers facts about you and your projects across sessions (stored in `~/.claude/projects/.../memory/`). Things like "I use Python not JavaScript" or "this codebase is for Helm's internal tools" get remembered without re-explaining. You can also tell Claude explicitly: "Remember that X" and it saves it.
- **Slash command skills:** You can build your own slash commands — reusable instructions for tasks you do repeatedly. Type `/[command-name]` in any Claude Code session to invoke them. Example: `/citizen-ai-check [name]` checks whether a course participant is ready for their license. The program has several of these in the Claude Skills repo.
- **CLAUDE.md global vs. local:** A `CLAUDE.md` in your home directory (`~/.claude/CLAUDE.md` or `~/CLAUDE.md`) applies to every Claude Code session on your machine — good for personal standing rules. A `CLAUDE.md` in a project folder applies only when you open Claude Code from that folder. Build both.

---

## Track C — Infrastructure Migration

This track depends on **P1** (Helm SharePoint tenant) and **P2** (Helm M365 tenant for Forms). Do not start C until both are confirmed.

### C1 — Helm SharePoint Communications Site Setup

**Goal:** A new Communications site at `helmmarkets.sharepoint.com/sites/CitizenAI` (or equivalent URL).

Steps:
1. Request site creation from M365 admin (Global Admin on Helm tenant)
   - Site type: Communication site
   - Name: "Citizen AI Developer Program"
   - URL slug: `/sites/CitizenAI` (match current URL slug for consistency)
2. Set permissions: all Helm employees with helmmarkets.com accounts should have read access; Evan has owner/edit access
3. Create the same navigation structure as the iAltA site: Home → Modules 0-16 → Final Exam → Day 1 Quick Start → Quiz pages
4. Do not yet build any content — that's C3

**Why a Communication site specifically:** same type as the current iAltA site; designed for broadcasting content to a broad audience rather than team collaboration.

### C2 — MS Forms Recreation in Helm Tenant

**Goal:** 17 new forms in the Helm M365 tenant with new form IDs, containing the same (updated) questions as the iAltA forms.

The iAltA quiz forms are owned by the iAltA tenant. Helm employees with `helmmarkets.com` accounts can access them as guests, but this is fragile — if iAltA guest access policies change, forms break. All forms need to be recreated in the Helm tenant.

**What needs to be created:**
- 16 quiz forms (4 questions each, Modules 1-16)
- 1 final exam form (25 multiple-choice questions)

**Content source:** Quiz questions exist in `course-content/quizzes/quiz-module-01.md` through `quiz-module-16.md`. The final exam questions are in the Final Exam SharePoint page (read in the audit). Update quiz content for any questions that reference outdated info (model IDs, product names) before recreating forms.

**Creation approach:** Use the existing `create_forms_quizzes.js` script as a pattern but target the Helm tenant. You'll need to be authenticated to MS Forms as your Helm account (evan@helmmarkets.com) when running the Playwright automation.

**Output needed:** A new `module_page_urls_helm.json` with the 17 new form IDs in the same format as the current `module_page_urls.json`. These IDs go into the updated `/citizen-ai-check` skill (see C4).

**Quiz question updates needed before recreation:**
- Module 10 quiz: any question referencing "Claude Desktop Projects" → update to "claude.ai Projects"
- Module 2 quiz: any question citing specific model IDs → update model IDs
- Verify Module 13 quiz still requires perfect 5/5 (the hardcoded `perfectRequired: true` logic)

### C3 — Build SharePoint Pages on Helm Site

**Goal:** All 19+ pages (17 modules + Home + Final Exam + Day 1 Quick Start + 16 quiz pages) live on the Helm site with fully updated content.

**Source:** Updated source markdown files from Track A + new content sections from Track B.

**Page structure per module (mirror existing):**
- Module page: title, track/reading time/quiz labels, learning objectives, full content, practical exercise, "Take the Quiz" link (pointing to Helm Forms), next module link
- Quiz page: embedded or linked to Helm MS Form, back/forward navigation
- Final Exam page: link to Helm MS Form, instructions
- Day 1 Quick Start: fully rewritten per A2/A3 edits above

**Navigation:** Home page navigation links must all point to the Helm site pages. No cross-links back to iAltA SharePoint.

**New pages needed (Track B content):**
- Add Connectors section to Module 14 page
- Add Extended Thinking section to Module 8 page
- Add Routines section to Module 14 page
- Add Shared Projects section to Module 10 page
- Add Claude Code advanced section to Module 10 page

**Automation approach:** Use existing Playwright patterns from this repo (see `update_course_content.js`, `update_sharepoint_safety_module.js`, `publish_sharepoint_draft.js`). Target the Helm SharePoint site URL instead of iAltA.

**Estimated pages to build/publish:** 36 total (19 content pages + 16 quiz pages + 1 home)

### C4 — Update `/citizen-ai-check` Skill

**Goal:** Update the skill to use new Helm form IDs, reflect the new provisioning process, and reference the correct admin workflow.

**Changes needed:**

1. **Form IDs array** — Replace all 17 form IDs with the new Helm tenant IDs from C2. This is the main change. The ID format will be different (Helm tenant vs. iAltA tenant).

2. **Authentication context** — The skill currently uses `window.OfficeFormServerInfo` from `forms.office.com`. This works when Evan is signed into his iAltA account. After migration, he'll need to be signed into his Helm account (`evan@helmmarkets.com`) for the skill to access Helm tenant forms. Add a note in the skill: "Must be authenticated to forms.office.com with your Helm (helmmarkets.com) account before running."

3. **License issuance step** — Change:
   > "This skill does NOT issue the license — it only confirms readiness. Evan issues the license manually in the Claude Teams admin console."
   
   To:
   > "This skill does NOT issue the license — it only confirms readiness. Provisioning happens via Microsoft Entra: in the Entra admin portal, assign the user to the Claude Enterprise app. The user's account will be live within ~40 minutes; no invitation email is sent."

4. **Module 10 form title** — Update `title: "Module 10: Claude Desktop Projects"` → `title: "Module 10: Projects and Persistent Context"`

**Files to update:**
- Live: `~/.claude/commands/citizen-ai-check.md`
- Repo copy: `Claude Skills/commands/citizen-ai-check.md`
Both must stay in sync per the Claude Skills `CLAUDE.md` convention.

### C5 — Update Citizen Developer Agreement Document

**Goal:** Updated Word doc in Helm branding for the new cohort.

**Changes needed:**
- Replace all "iAltA" → "Helm" / "Helm Markets" throughout the document
- Update email address: `evan@ialta.com` → `evan@helmmarkets.com`
- Update product references: "Claude Teams" → "Claude Enterprise"
- Update the signed acknowledgment return address in the instructions

**Files:**
- Source: `Citizen AI Engineer/Citizen AI Engineer Program — Policies, Procedures & Agreements.docx`
- Rename output to: `Citizen AI Developer Program — Policies, Procedures & Agreements.docx` (consistent with course title)

**Optional — electronic signature:** Consider replacing the "sign and email" workflow with a DocuSign or Microsoft equivalent. This removes the manual email step and gives you a signed copy automatically. Not required for the first Helm cohort, but worth noting.

### C6 — Update the Course-Internal GitHub References

**Goal:** All GitHub references in the course point to the correct Helm-era org/email.

**Changes (once P3 is decided):**
- Day 1 Step 5: update `github.com/ialta` to correct org URL
- Day 1 METADATA.yaml template: update `owner` email to `helmmarkets.com` domain
- Module 15: if there are any org-specific GitHub URLs, update them

---

## Track D — Cutover and Decommission

Run this after Track C is complete and verified.

### D1 — Verification checklist before cutover

- [ ] All 36 Helm SharePoint pages are published and accessible with a helmmarkets.com account
- [ ] All 17 Helm Forms are live and accepting responses
- [ ] `/citizen-ai-check` skill has been tested against a dummy submission in the Helm tenant and returns correct results
- [ ] Day 1 Quick Start correctly describes SSO flow; no invite-email references remain
- [ ] All "iAltA" and "Claude Teams" references are gone from all pages
- [ ] Updated Citizen Developer Agreement is available to new participants
- [ ] New GitHub org/instructions are clear in Day 1 Step 5

### D2 — Redirect and communication

- Update the `course-refresh-plan-2026-06-26.md` (this doc) with the new Helm SharePoint URL
- Update the `claude-skills` repo README and the Claude Skills CLAUDE.md with the new site URL and form IDs
- If any links to the iAltA course exist in Slack, Teams, Highlander, or other places, update them
- Post in the program channel: "The course has moved to [new URL]. Use your Helm account to access it."
- Add a redirect notice or banner on the iAltA SharePoint Home page pointing to the new Helm site for any users who still navigate there

### D3 — Archive iAltA course (don't delete immediately)

Keep the iAltA SharePoint site read-only for 90 days after cutover in case any participants need to access their submitted work or quiz history. After 90 days, archive or delete.

The iAltA MS Forms should remain accessible (read-only, no new submissions) for the same period so any historical completions can be retrieved if needed.

### D4 — Update memory and documentation

After cutover:
- Update `project_citizen_ai_engineer.md` in memory with the new Helm site URL
- Update the `claude-skills` repo `commands/citizen-ai-check.md` with final Helm form IDs
- Add a `/document` note capturing the migration with final URLs and form IDs

---

## Sequencing and Dependencies Map

```
P1 (Helm SharePoint site exists)
P2 (Helm M365 for Forms)
P3 (GitHub org decision)
P4 (Teams vs Slack channel)
   │
   ├─► Track A (no dependencies — start now)
   │     A1: global find-replace on source markdown
   │     A2: Day 1 rewrite (SCIM flow)
   │     A3: module-specific edits
   │     A4: push to iAltA SharePoint
   │
   ├─► Track B (no dependencies — start now, run parallel with A)
   │     B1: Connectors section (Module 14)
   │     B2: Extended Thinking (Module 8)
   │     B3: Routines (Module 14)
   │     B4: Shared Projects (Module 10)
   │     B5: Claude Code Advanced (Module 10)
   │
   └─► Track C (needs P1 + P2 + A complete + B complete)
         C1: Helm SharePoint site setup ← P1
         C2: MS Forms recreation ← P2, A3 (updated questions)
         C3: Build SharePoint pages ← C1, A4 source files, B content
         C4: Update /citizen-ai-check skill ← C2 (new form IDs)
         C5: Update Agreement doc
         C6: Update GitHub references ← P3
         │
         └─► Track D (needs C complete)
               D1: Verification checklist
               D2: Redirect and communications ← P4
               D3: Archive iAltA course
               D4: Update memory + docs
```

---

## Effort Estimate

| Track | Work items | Effort |
|-------|-----------|--------|
| A1-A3 | Source file edits | 1-2 hours (mostly automated find-replace + manual review) |
| A4 | Push 10 updated pages to SharePoint via Playwright | 1 hour |
| B1-B5 | Write 5 new content sections | 3-4 hours |
| C1 | Request + wait for Helm SharePoint site | External dependency — days |
| C2 | Recreate 17 forms in Helm tenant | 2-3 hours |
| C3 | Build 36 pages on Helm SharePoint | 4-6 hours (Playwright automation) |
| C4 | Update `/citizen-ai-check` skill | 30 minutes |
| C5 | Update Agreement doc | 30 minutes |
| C6 | GitHub reference updates | 15 minutes |
| D1-D4 | Cutover, verification, comms | 2 hours |

**Total active work:** ~15-18 hours spread across the tracks
**Wall-clock time:** Gated on P1 (Helm SharePoint provisioning), which could take days

---

## Files Touched by This Plan

| File | Track | Change |
|------|-------|--------|
| `course-content/module-*.md` (17 files) | A | Content updates |
| `course-content/quizzes/quiz-module-*.md` (16 files) | A + C2 | Content updates; source for new forms |
| `module_page_urls.json` | C3 | New file for Helm site URLs |
| `Citizen AI Engineer Program — Policies, Procedures & Agreements.docx` | C5 | Brand update + email |
| `~/.claude/commands/citizen-ai-check.md` (live) | C4 | New form IDs + Entra provisioning language |
| `Claude Skills/commands/citizen-ai-check.md` (repo copy) | C4 | Same as above |
| New: `module_page_urls_helm.json` | C2 | Stores 17 new Helm form IDs |

---

## Open Decisions (requires your input before executing)

| # | Decision | Options | Impact |
|---|---------|---------|--------|
| P3 | GitHub org for citizen developers | New Helm org / existing ialta org / personal accounts | Day 1 Step 5 content; tracking in Highlander |
| P4 | Program channel platform | Teams (stay) / Slack / both | Day 1 Step 7; ongoing cohort communications |
| — | Electronic signing for Agreement | Email as-is / DocuSign / Microsoft equivalent | C5 effort level |
| — | Course module count | Keep 16 / add a Module 17 for advanced features | Whether B content becomes a new module vs. in-line additions |

---

## Related Files

- `course-audit-2026-06-26.md` — page-by-page audit findings (basis for this plan)
- `course-content/` — source markdown for all module content
- `course-content/quizzes/` — source markdown for all quiz content
- `module_page_urls.json` — current iAltA SharePoint + iAltA form URLs
- `Claude Skills/commands/citizen-ai-check.md` — skill that reads form completion data
- `AI Policies/Claude Code Enterprise Deployment/Teams_to_Enterprise_Migration_2026_06_25.md` — Enterprise provisioning context (Entra SCIM facts)
