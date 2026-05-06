# Citizen GitHub Platform — Implementation Steps

**Date:** 2026-05-01
**Purpose:** Plain-language, ordered steps to operationalize the platform vision in the `helmmarkets` GitHub org.
**Companion docs:** `citizen-github-platform-vision.md` (the *why*), `citizen-github-audit-2026-05-01.md` (the *current state*).

The order matters. Steps 1–3 unblock everything else.

---

## The goal in one sentence

Get every citizen pushing their AI-assisted work into `helmmarkets/` under the `Citizens` team, on a foundation where it can be reviewed, connected, recognized, and audited — without it feeling like surveillance.

---

## Authority levels — what each role can and cannot do

Two role axes matter. Evan currently sits at: **org Member** + **Citizens team Maintainer** (verified 2026-05-04 via API).

| Capability | Org Member | Org Owner | Team Maintainer (Citizens) |
|---|---|---|---|
| Add/remove people on Citizens team | — | ✅ | ✅ |
| Manage Citizens team settings (name, repos linked) | — | ✅ | ✅ |
| Install GitHub Apps on org | — | ✅ | — |
| Set org-wide rulesets / branch protection | — | ✅ | — |
| Turn on secret scanning + push protection | — | ✅ | — |
| Tighten member privileges (delete, visibility, outside collab) | — | ✅ | — |
| Change default repo visibility (private → internal) | — | ✅ | — |
| Read security alerts across org | — | ✅ | — |
| Stream audit log / configure SAML | — | ✅ | — |

Restated: as **team Maintainer**, Evan runs the *human* side of the program (enrollment, removal, team config). As **org Member**, Evan cannot enforce program policy at the GitHub level. The Jensen Huang frame says *trust + accountability* — today Evan has trust, the accountability layer is locked behind Owner.

**Bottom line:** as Member, the program runs on goodwill. As Owner, it runs on policy.

---

## Step 1 — Get Owner role on `helmmarkets`

**Why first:** You cannot install Apps, set rulesets, change security policies, or tighten member privileges as a Member. Everything below requires Owner.

**How:**
- Identify a current Owner (likely Jonathan-iAlta, or whoever set up the org on 2026-03-09; the `infra` team — rohanjoshi95, dmolik-ialta — is also worth checking).
- Ask to be promoted. Suggested framing: *"To operationalize the citizen program — secret scanning, branch protection, the App that feeds Highlander — I need Owner role on helmmarkets. The CIO already approved the program; this is the GitHub permission that lets me run it."*
- Mechanic: GitHub UI → Settings → People → find `evan-paliotta-ialta` → change role to **Owner**.

**Decision point:** One Owner or several? Recommended: at least two (you + one backup) to avoid single-key lockout.

**Done when:** `gh api orgs/helmmarkets/memberships/evan-paliotta-ialta` returns `"role": "owner"`.

### Parallel work while waiting for Owner

Even before promotion, the following can move forward without Owner role:

- **Onboard new citizens to the team** (you have Maintainer rights for this — though they won't have a useful environment yet, since branch protection / scanning / template aren't in place).
- **Draft the repo template content** (Step 6) in your own GitHub account or local folder. When Owner lands, you push it to `helmmarkets/citizen-template` and flip the Template flag.
- **Write the program-agreement updates** (Step 12) — what gets scanned, what it's used for, what it's not used for. Sign-off-ready before citizens are added.
- **Have the Highlander verification conversation** (Step 10) — does it support GitHub App org-installation, what signals does it ingest, can it push back to Slack.

Steps 2–5, 7, 9, and 11 all sit blocked until Owner is granted.

---

## Step 2 — Decide on default repo visibility

**Why:** Today, only 1 of 7 repos is internal-visibility. The "peer learning" use cases (find similar projects, prevent duplication, browse what others built) **only work** if citizen repos default to internal, which makes them visible to all org members.

**Decision point:**
- **Option A (recommended):** New citizen repos default to `internal`. Existing private repos stay private (Highlander code, etc.). Citizens can opt up to `private` only with program lead approval.
- **Option B:** Everything stays private. You lose ~half the use cases (peer discovery, duplicate prevention, internal newsletter sourcing). Not recommended.

**How (for Option A):**
1. Owner → Settings → Repository → Repository creation → restrict to **Internal** for non-Owners.
2. Owner → Settings → Repository → Default visibility for new repos → **Internal**.

**Done when:** A test repo created by a non-Owner defaults to internal.

---

## Step 3 — Tighten risky member privileges

**Why:** Today, any member (including future citizens) can delete repos, flip visibility from private to public, and invite outside collaborators. Each is a one-click way to break the program's audit trail or expose internal work.

**How** — Owner → Settings → Member privileges, set:
- Repository deletion: **Owners only**
- Repository visibility change: **Owners only**
- Outside collaborators invite: **Owners only**
- Team creation: **Owners only**

**Done when:** A non-Owner test member tries to delete a repo and gets blocked.

---

## Step 4 — Author one org-wide ruleset for branch protection

**Why:** Right now, anyone can push directly to `main`, force-push, delete branches. A ruleset enforces "PRs to main only" across every citizen repo with one config — no per-repo setup needed.

**How:**
1. Owner → Settings → Repository → Rulesets → New branch ruleset.
2. Name: `citizen-default`.
3. Target: All repositories matching `*-citizen-*` *or* a tag-based dynamic group (revisit when naming convention is finalized in Step 6).
4. Branches: include default branch `main`.
5. Rules: Require pull request before merge (1 approver — can be self-approve initially), restrict force-push, restrict deletion of `main`, require linear history.
6. Bypass list: Owners only.

**Decision point:** Self-approval on PRs to one's own repo? Recommended: **yes** initially. The PR is the forcing function for a structured commit message + ROI marker review, even with self-approval.

**Done when:** A citizen tries to push directly to `main` and is rejected.

---

## Step 5 — Enable secret scanning + push protection at org level

**Why:** First line of defense for "no secrets in repos." GitHub catches credentials before they hit the remote. Free for private repos on Enterprise.

**How:** Owner → Settings → Code security → enable for all eligible repos:
- Secret scanning
- Push protection
- Dependabot alerts (no action required, just visibility)

**Decision point:** GitHub Advanced Security (paid) adds CodeQL code scanning and richer alerts. Skip for now; revisit once 10+ citizen repos exist.

**Done when:** A test commit containing a fake AWS key is rejected at push.

---

## Step 6 — Create the citizen repo template

**Why:** The "no repo, no work" norm only sticks if creating a repo takes 30 seconds and lands a clean starting point. The template carries CLAUDE.md, the ROI marker, the zone declaration, and a README skeleton.

**How:**
1. Create `helmmarkets/citizen-template`. Mark it as a **template repository** (Settings → Template repository).
2. Populate with:
   - `README.md` — title, owner, status (`draft` / `production`), one-line problem, ROI marker block.
   - `CLAUDE.md` — zone declaration, MCP allowlist reference, link to driving-zones-framework.md.
   - `.mcp.json` — empty allowlist with comment pointing to the approved list.
   - `.gitignore` — sensible defaults (`.env`, `*.key`, `node_modules/`, etc.).
   - `LICENSE` — internal-only marker (or omit).
3. Decide on naming convention. Recommended: `<citizen-username>-<project-slug>`. Example: `epaliotta-hubspot-deal-cleanup`.

**Done when:** `gh repo create helmmarkets/test-repo --template helmmarkets/citizen-template --internal --team citizens` produces a working repo with all template files.

---

## Step 7 — Configure the Citizens team to auto-grant access

**Why:** When a citizen creates a repo, the Citizens team should automatically get **read** on it (so peers can discover/learn) and the citizen themselves should get **write/maintain**. Without this, every new repo requires manual access setup.

**How:**
1. Owner → Settings → Teams → Citizens → Repositories → set base permission: **read**.
2. In the repo template, configure team access at template level so it carries through.
3. Document in the "starting a project" one-pager: `gh repo create ... --team citizens` is the required incantation.

**Decision point:** Should the program lead (Evan) be the maintainer on every citizen repo by default? Recommended: **yes**, via a dedicated `program-leads` team or by adding Evan as collaborator at template level. This makes review and rescue painless.

**Done when:** A new citizen-created repo automatically appears in `gh api orgs/helmmarkets/teams/citizens/repos`.

---

## Step 8 — Onboard the actual 25 citizens

**Why:** Currently the Citizens team has 2 people. The platform is empty without the people.

**How:**
1. Confirm the citizen roster from the program-launch plan.
2. For each: invite to org (`gh api orgs/helmmarkets/invitations -f email=<email> -f role=direct_member`), then add to Citizens team.
3. Pair each invite with the "starting a project" one-pager and a course-completion gate (the program already requires course completion before activation).

**Decision point:** Do citizens use personal GitHub accounts or company-issued accounts? If company-issued, this becomes an IT provisioning task. Recommended: **personal accounts, invited to org**, unless SSO is being rolled out simultaneously.

**Done when:** Citizens team has the full ~25-person roster, all with course completion verified.

---

## Step 9 — Install a GitHub App for scanning + Highlander integration

**Why:** PATs are tied to individuals and have wide scope. A GitHub App installed on the org gives a stable, auditable, narrowly-scoped identity for every automated read of citizen repos — used by both the per-citizen ROI scanner and Highlander.

**How:**
1. Decide app ownership: who maintains it? Recommended: same person/team that maintains Highlander.
2. Create the App at GitHub → Settings → Developer settings → GitHub Apps. Permissions: `Contents: Read`, `Metadata: Read`, `Pull requests: Read`, `Members: Read`.
3. Install on `helmmarkets` org, scope to **All repositories** (or just Citizens-team repos if narrower scope preferred).
4. Issue installation token to the scanner script and to Highlander.

**Decision point:** Single App for both ROI scanner and Highlander, or separate? Recommended: **separate**. Different lifecycles, different owners, different blast radius.

**Done when:** A test scanner script can list all citizen repos using only an installation token (no PAT).

---

## Step 10 — Confirm Highlander's GitHub ingest path

**Why:** The vision assumes Highlander can read citizen repos. The audit couldn't verify this end-to-end.

**How:**
- One conversation with Highlander's owner. Four questions:
  1. Can Highlander be installed via a GitHub App on `helmmarkets`?
  2. What signals does it ingest (commits, PRs, README content, embeddings)?
  3. Does it support the "find similar projects" semantic query?
  4. Can it push to Slack / email for connection notifications?

**Done when:** A test citizen repo's content is searchable in Highlander.

---

## Step 11 — Pilot the smallest scanner

**Why:** Validate that the foundation works end-to-end before committing to the full per-citizen ROI tracker.

**How:**
1. Write `scan_citizen_repos.py` (location: `Claude Skills/roi-tracker/`).
2. Inputs: GitHub App installation token.
3. Outputs: a flat CSV of `repo, owner, status_marker, last_push, lines_in_readme`.
4. Run weekly (cron or GitHub Actions).
5. First use case: simple semantic compare (Claude API, with prompt caching) of READMEs to flag potential duplicate work.

**Done when:** The scanner produces a weekly report you can hand to a citizen ("hey, this overlaps with what X is building").

---

## Step 12 — Publish the program agreement update

**Why:** Citizens need to know what's scanned, why, and what consequences look like. The driving-zones doc covers behavior; the program agreement covers data use.

**How:**
- Update `Citizen AI Engineer Program - Policies, Procedures & Agreements.docx`:
  - What gets scanned (repo content, commit metadata, README ROI markers — *not* keystrokes, *not* private conversations).
  - What it's used for (program-level ROI defense, peer connection, compliance with zone rules).
  - What it's not used for (individual performance review — confirm with People Ops).
  - License-revocation conditions (zone violations, secret commits, attempts to evade audit).

**Done when:** Each citizen has signed the updated agreement before being added to the Citizens team.

---

## Cost summary

| Item | Cost | Status |
|---|---|---|
| Enterprise plan | Already paid | ✅ |
| GitHub Teams | Subsumed by Enterprise | ✅ |
| Secret scanning + push protection | Free on Enterprise | Just turn on |
| GitHub Advanced Security (CodeQL) | ~$49/seat/mo | Skip for now |
| GitHub App | Free | Build it |
| Highlander integration | Internal | Verify path |
| Scanner script (Claude API) | <$50/mo at this scale | Build it |
| Program-lead time | Real cost — ~2 days for steps 1–7, ongoing for 8–12 | Plan accordingly |

---

## Order of operations recap

```
Block 1 — Foundation (a few hours, requires Owner role first)
  Step 1: Become Owner
  Step 2: Default visibility = internal
  Step 3: Tighten member privileges
  Step 4: Org-wide branch protection ruleset
  Step 5: Secret scanning + push protection

Block 2 — Citizen onboarding (a day)
  Step 6: Repo template
  Step 7: Citizens team auto-grant
  Step 8: Invite the 25

Block 3 — Automation (1–2 weeks)
  Step 9: GitHub App
  Step 10: Highlander ingest confirmation
  Step 11: Pilot scanner

Block 4 — Governance (parallel with Block 3)
  Step 12: Program agreement update + signatures
```

Block 1 unblocks everything. Block 2 makes the platform usable. Block 3 makes it intelligent. Block 4 makes it defensible.
