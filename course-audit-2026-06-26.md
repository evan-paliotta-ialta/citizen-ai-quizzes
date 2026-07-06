# Citizen AI Developer Program — Course Audit
**Date:** 2026-06-26
**Scope:** Full read-through of all 17 modules (0–16), Final Exam, and Day 1 Quick Start at `ialta.sharepoint.com/sites/CitizenAI`. Every page reviewed for outdated content, brand/product name accuracy, and missing features. Pages published April 2026 — approximately 3 months since last update.

---

## Critical Fixes (must address before next cohort)

### 1. Day 1 Quick Start — SCIM provisioning flow is completely wrong
**Current text says:** "You will receive an invite email from Anthropic."
**What actually happens:** Helm provisions via Microsoft Entra SCIM. No invitation email is sent. Users will wait indefinitely for an email that never arrives.

**Also wrong in Step 3:** "If you are using Claude.ai in a browser — stop. Those do not have the program's safety controls."
With Helm Enterprise, `claude.ai` IS the org-governed, policy-controlled interface. Managed settings apply to claude.ai web, Claude Code CLI, and Claude Desktop equally. This line is the opposite of correct.

**Day 1 Step 2-3 rewrite needed:**
- Remove "request your license" email flow
- Add: accounts are provisioned by the program admin via Microsoft Entra — no action needed from you
- Add: when provisioned (~40 min after Entra assignment), go to `claude.ai` → "Continue with SSO" → your Helm Microsoft login → you'll land in the Helm Markets org
- Change Step 3 from "Download Claude Desktop" to: primary access is claude.ai in any browser; Claude Code and Claude Desktop are additional options for technical work

### 2. "Claude Teams" product name throughout
Helm is on Claude Enterprise. "Claude Teams" appears in:
- Module 0
- Day 1 Quick Start (Step 2 subject line, multiple times)
- Final Exam header and Practical Submission 2
- Home page

Replace all with "Claude Enterprise."

### 3. evan@ialta.com contact email
Module Day 1 Step 1 and Step 2 both direct users to `evan@ialta.com`. Current email is `evan@helmmarkets.com`.

### 4. "iAltA" company name throughout
Appears in: Module 0, Module 9 (Driving Zones Decision Flowchart), Module 10 (CLAUDE.md example), Module 12 (HR section), Module 13 (Zone 2 description), Final Exam (Practical Submission 1 scenario), Day 1 Quick Start (Steps 1, 4, 5).

Global find-replace: `iAltA` → `Helm`.

---

## Important Updates (next planned refresh)

### 5. Model version IDs in Module 2
**Current (outdated):**
- `claude-opus-4-5`, `claude-sonnet-4-5`, `claude-haiku-4-5`

**Current (correct as of June 2026):**
- `claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`

Also update the Claude Code `/model` command examples that show these IDs.

### 6. "Claude Desktop" as the primary tool — needs repositioning
The course was built when Claude Desktop was the primary interface. Helm's Enterprise plan makes `claude.ai` the primary tool (with managed settings, Projects, connectors, and org governance all living there). Claude Desktop is now one of several access points.

Specific places to update:
- Module 1: "This course is about Claude Desktop" → "this course covers claude.ai (Enterprise) and Claude Code"
- Module 3 exercise: "Open a conversation in Claude Desktop" → "open claude.ai"
- Module 4: context recovery example references Claude Desktop → claude.ai
- Module 6: "In Claude Desktop Projects" → "In claude.ai Projects"
- Module 8: prompt-saving guidance references Claude Desktop → claude.ai
- Module 9: daily workflow step → "Open claude.ai and create the relevant Project"
- Module 10: entire module title and framing (see item 7 below)
- Module 11: track label "Claude Desktop" → "claude.ai"; upload instructions
- Final Exam Practical Submission 2: "Created a Project in Claude Desktop" → "in claude.ai"

### 7. Module 10 title and CLAUDE.md examples
Module is titled "Claude Desktop Projects" — rename to "Projects and Persistent Context."

The CLAUDE.md example in the Claude Code section still uses iAltA branding:
- `Role: Marketing Manager, iAltA` → `Helm Markets`
- `iAltA is a financial technology firm. Clients are institutional investors and family offices.` → update to Helm
- `Product: Verivend platform. Key contacts: Dan (Sales), Sam (CS).` → update to current product/contact names

### 8. Module 12 HR prompt template
```
Write a job description for a [Title] role at iAltA.
```
→ `at Helm Markets`

### 9. Final Exam — license language
- "Passing this exam unlocks your Claude Desktop license." → "Claude Enterprise account"
- Practical Submission 2 checklist: "Created a Project in Claude Desktop" → "in claude.ai"

### 10. Day 1 — GitHub org URL and email domain
- "Go to github.com/ialta" → update to correct org
- METADATA.yaml template: `owner: "your.name@ialta.com"` → `"your.name@helmmarkets.com"`

---

## Global Find-Replace Cheat Sheet

| Find | Replace | Notes |
|------|---------|-------|
| `iAltA` | `Helm` | All instances |
| `evan@ialta.com` | `evan@helmmarkets.com` | Contact email |
| `Claude Teams` | `Claude Enterprise` | Product name |
| `Claude Desktop license` | `Claude Enterprise account` | Completion reward |
| `claude-opus-4-5` | `claude-opus-4-8` | Model IDs |
| `claude-sonnet-4-5` | `claude-sonnet-4-6` | Model IDs |
| `claude-haiku-4-5` | `claude-haiku-4-5-20251001` | Model IDs |
| `Claude Desktop Projects` | `claude.ai Projects` | When referring to the Projects feature |
| `internal to iAltA` | `internal to Helm` | Zone 2 description |

**Important caveat on "Claude Desktop":** Not every instance should become "claude.ai." In Module 10 and 15, "Claude Desktop" appears in technical explanations of how CLAUDE.md differs from Projects — those are still accurate (Claude Desktop is a real product). The replacement applies specifically when "Claude Desktop" is used to mean "the primary chat interface where all company work runs."

---

## Missing Features — New Content to Add

These capabilities exist now but are not covered in the course at all. Listed in order of value to a non-technical user.

### A. claude.ai Native Connectors (highest priority)
**Gap:** Module 14 covers MCP as a developer-setup concept. It doesn't mention that claude.ai Enterprise has a built-in connector panel that any user can activate with just an authorization click — no developer involved.

**Available connectors today:** HubSpot, Slack, Google Drive, GitHub, Clay, and growing.

**Where to add:** New section in Module 14, or an addendum after Module 14 titled "What's Available Right Now Without a Developer." Example content:

> In claude.ai, go to Settings → Connectors. You'll see a list of tools you can connect directly. Authorize HubSpot and you can ask Claude: "Summarize my open deals this week" — Claude reads your actual HubSpot data without copy-pasting. This is the MCP story made accessible to everyone, not just developers.

**Data zone note:** MCP connections via connectors are automatic Zone 3 (live system access). Flag this clearly.

### B. Extended Thinking
**Gap:** Not mentioned anywhere. Users who need high-quality analysis on hard problems don't know to switch to Opus and prompt for deeper reasoning.

**Where to add:** Module 8 (Tips and Power User Habits), as a new habit.

> When you need Claude's best work on a genuinely hard problem — a complex strategy, a multi-factor analysis, anything where the first answer feels shallow — switch to Opus 4 and add: "Before you answer, take your time and think through this carefully from multiple angles." Opus 4 supports extended thinking: it reasons through the problem step by step before responding. The output takes longer but is significantly deeper. Don't use it for routine tasks — save it for the ones where quality is worth the extra seconds.

### C. Routines (Enterprise scheduled tasks)
**Gap:** Module 14 covers agents conceptually but doesn't mention Routines, which is the accessible no-developer version for Enterprise users.

**Where to add:** New section in Module 14.

> Claude Enterprise includes Routines — scheduled tasks that run automatically on a cadence you set. You describe the task, set a schedule (daily at 8am, every Monday, etc.), and Claude runs it and delivers the output without you having to initiate it. Examples: a daily pipeline summary, a weekly competitor news digest, a monthly usage report. Routines are agents for non-developers. The same human-review principle applies: for anything that gets sent to clients or leadership, add a review step before delivery.

### D. Shared Projects (Enterprise team feature)
**Gap:** Module 10 covers individual Projects. Enterprise allows Projects to be shared across a team so every member starts with the same org context.

**Where to add:** Module 10, new section after "Building Your First Project."

> In Helm's Enterprise plan, Projects can be shared across your team. A CS team Project might contain: the Helm product brief, the renewal playbook, and the customer communication style guide. Every CS rep opens their conversations inside that shared Project and starts with all that context pre-loaded — no one writes their own system prompt from scratch. Set this up once per team, refine quarterly.

### E. Claude Code Advanced Features
**Gap:** Module 10 briefly introduces CLAUDE.md. There's no coverage of Claude Code's more advanced capabilities that citizen developers would actually use.

**Where to add:** Expand Module 10's Claude Code section, or add a Module 15.5 / standalone "Claude Code Beyond the Basics."

Topics to cover:
- `/research` command: Claude browses the web and synthesizes a research report — no prompting required beyond the question
- `/review` command: structured review of a document or piece of code
- Session memory (`~/.claude/projects/.../memory/`): facts that persist across conversations automatically
- Skills / slash commands: building `/my-command` shortcuts for tasks you do repeatedly — write the instruction once, invoke it with a slash
- CLAUDE.md best practices: global (`~/.claude/CLAUDE.md`) vs project-level (`project-folder/CLAUDE.md`) — what belongs where

### F. Memory Feature in claude.ai
**Gap:** claude.ai is rolling out a Memory feature (persistent facts across conversations). If/when live for Enterprise, this is worth a module update.

**Where to add:** Module 4 (Context Window), as an addendum noting the memory feature supplements the blank-slate limitation for recurring context.

---

## Module-by-Module Verdict

| Module | Status | Priority |
|--------|--------|----------|
| Home | Fix product name | Medium |
| Module 0 | Fix product/company name | High |
| Module 1 | Fix framing ("this course is about Claude Desktop") | High |
| Module 2 | Fix model IDs | High |
| Module 3 | Minor wording (Claude Desktop → claude.ai) | Low |
| Module 4 | Minor wording | Low |
| Module 5 | No changes needed | — |
| Module 6 | Minor (Projects reference) | Low |
| Module 7 | No changes needed | — |
| Module 8 | Minor wording + add extended thinking | Low/Medium |
| Module 9 | Fix "iAltA" in flowchart; minor wording | Medium |
| Module 10 | Rename module, fix CLAUDE.md examples, add shared Projects | High |
| Module 11 | Minor track/tool reference | Low |
| Module 12 | Fix "iAltA" in HR template | Medium |
| Module 13 | Fix "iAltA" in Zone 2 description | Medium |
| Module 14 | Add native connectors section, Routines | High (new content) |
| Module 15 | Minor (GitHub org URL) | Low |
| Module 16 | No changes needed | — |
| Final Exam | Fix product name, "iAltA" in scenario | Medium |
| Day 1 Quick Start | Major rewrite (SCIM, email, tool guidance) | Critical |

---

## SharePoint Migration Recommendation

**Recommendation: Migrate to Helm SharePoint when Helm tenant is ready.**

The course currently lives in the iAltA SharePoint tenant (`ialta.sharepoint.com`). Helm employees will have `helmmarkets.com` Microsoft accounts via Entra — accessing an iAltA SharePoint site as a guest is workable short-term but creates friction and uncertainty about long-term access.

**Sequencing:**
1. Do all the content edits on the iAltA tenant first (lower friction, no migration risk)
2. When Helm SharePoint Communications site is available, copy pages over
3. Update Day 1 Quick Start URL to the new Helm SharePoint location
4. Leave the iAltA pages published with a redirect notice until everyone has confirmed they're on the new site

**Reason not to rush the migration:** Content edits can be done today on the existing site without any SharePoint setup work. Don't let the migration decision delay the critical fixes (SCIM flow, email address, product name).

---

## Files Referenced

- All page content read via Playwright from `ialta.sharepoint.com/sites/CitizenAI`, June 26 2026
- Enterprise provisioning behavior: `AI Policies/Claude Code Enterprise Deployment/Teams_to_Enterprise_Migration_2026_06_25.md`
- Current managed settings: `AI Policies/Claude Code Enterprise Deployment/managed-settings.json`
- Model version reference: Claude Code session context (claude-sonnet-4-6 as default, June 2026)
