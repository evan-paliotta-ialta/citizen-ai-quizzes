# Citizen GitHub Platform — Vision

**Date:** 2026-05-01
**Owner:** Evan Paliotta (program lead)
**Status:** Strategy doc. Pre-implementation. Companion to:
- `driving-zones-framework.md` (zone rules — the *what*)
- `cio-plan-citizen-ai-engineer.md` (program plan — the *who*)
- `Claude Skills/docs/citizen-developer-vision.md` (per-citizen ROI tracker — the *prove it*)

This doc captures the *platform* layer: what we get when every citizen's work lives in one place inside the Helm Markets GitHub org.

---

## Purpose, in one paragraph

The Citizen AI Engineer program produces ~25 people building AI-assisted automations across Helm. Without a shared container, those 25 streams of work are invisible to each other and to program leadership. With a shared container — every citizen pushing into `helmmarkets/` under a `Citizens` team — the program becomes *managed* rather than just *licensed*. Reviewing work, connecting people, recognizing wins, catching rule violations, and proving ROI all become tractable, because the data is in one place and accessible to one operator (the program lead).

This doc is the *why* and *what*. The audit doc is the *where we are*. The implementation-steps doc is the *how*.

---

## The mental model: GitHub as the town square

Jensen Huang frame (already adopted in the program): a job = a purpose + a set of tasks; AI offloads tasks so people can find more problems to solve. The org-wide repo container is what makes that visible at scale.

Without the container: 25 people doing AI work in isolation. With it: a flywheel.

```
Citizen ships → repo lands in helmmarkets/ under Citizens team →
  scanner reads it → program lead connects / recognizes / coaches →
  citizen sees value → more output → loop
```

The Driving Zones doc already commits to this principle ("Highlander tracks all citizen activity — even Zone 1 work counts"). This doc names the *operating system* layered on top.

---

## Day-to-day for a citizen using Claude Code

Strawman flow. The unifying rule: **work that isn't in a repo isn't work.** That single norm is what makes everything below tractable.

1. **Problem appears.** Citizen identifies a task inside their actual job (Jensen frame).
2. **Spin up a repo.** First step is `gh repo create helmmarkets/<citizen>-<project> --internal --team citizens`. Repo creation is the program ritual — no repo, no work.
3. **CLAUDE.md template lands automatically.** Every new repo derives from a GitHub repo template that ships with: zone declaration, ROI marker stub, MCP allowlist reference, and a README skeleton.
4. **Work happens in Claude Code.** Commits and pushes go to a feature branch, not main.
5. **Branch protection forces a PR.** Even for solo work. The PR description is the value statement; merging to main is the act of "shipping."
6. **README ROI marker on completion.** The structured `<!-- ROI: ... -->` block from the citizen-developer-vision doc.
7. **Tag for "shipped."** A `status: production` README field or `v1.0` tag distinguishes built-but-shelved from in-use.
8. **Office hours / Slack** when stuck. Citizens reference repo URLs, not screenshots. Help becomes searchable.

A new citizen sees this on day one through a "Starting a project" one-pager and a course module.

---

## Use cases, bucketed

**Program management (program lead)**
- Review work — primary use case
- Compliance check — are zone rules being followed? PII in a Zone 1 repo, secrets committed, unapproved MCP in `.mcp.json`
- Spot citizens going dark — repo activity drops, no commits in 3 weeks → office hours invite
- Office hours topic generation — scan for repeated pain patterns; that's next week's session
- Course content updates — what concepts trip people up? Feeds back into SharePoint course content

**Citizen connection (peer-to-peer)**
- Connect similar projects — semantic scan flags two citizens both writing HubSpot scripts
- Prevent duplication — before someone starts work, "X already built this, talk to them"
- Internal skills marketplace — "who's done a Slack integration?" returns a citizen + repo
- Mentor pairing — strong citizens paired with newer ones in the same domain

**Recognition & education**
- Internal newsletter — featured repos with a short writeup
- Case studies for continuing education — pick standout repos, deconstruct in a course module
- "Citizen of the month" — ROI-attested or adoption-attested
- Onboarding — new citizens browse existing repos to see what's possible

**Business value**
- Per-citizen ROI (lives in `Claude Skills/docs/citizen-developer-vision.md` — don't re-spec)
- Org-wide AI artifact catalog — "what has Helm built with AI?" answerable in one place
- Tool/MCP usage telemetry — which connectors are actually load-bearing, which are unused

**Risk**
- Secret/credential scanning (GitHub Advanced Security or open-source equivalents)
- NDA / client-data exposure detection
- Drift from approved MCP allowlist

That's ~20 use cases. The first two buckets justify the program-management layer; the rest follow once the data is flowing.

---

## Permissioning model — the "full transparency" target

The clean target state, in priority order:

- **Single org.** All citizen repos live under `helmmarkets`. Not personal accounts. (The vision doc flagged this open question — single org is the answer.)
- **Default visibility = internal.** Visible to all org members, invisible externally. This is what makes peer learning real. Requires Enterprise plan — already confirmed via audit.
- **Citizens team.** Citizens get *write* on their own repos via repo-creation; *read* on all other Citizens-team repos via team membership. Read-on-siblings is what enables the connection use cases.
- **Program lead access.** Owner role on the org. Required to install Apps, set rulesets, manage security policies. Member-only access (Evan's current state) is insufficient.
- **Programmatic access for scanning.** A GitHub App installed on `helmmarkets` with `Contents: read`, `Metadata: read`, `Pull requests: read`, `Members: read`. Generates short-lived tokens, has an audit trail, doesn't depend on any individual's PAT. Same App can serve as the substrate for Highlander integration.
- **Branch protection via org-level ruleset.** One config covering every repo matching `helmmarkets/*` (or a citizen-specific pattern). Requires PR review, prevents force-push, forbids commits with secrets.
- **Secret scanning + push protection.** Org-level. GitHub catches credentials on commit before they hit the remote.
- **Member privilege tightening.** Disable repo deletion, visibility flipping, and outside-collaborator invitation for non-Owners.

What this gets you: full read across all citizen output, an auditable scanning identity, and policy enforced *by GitHub* not by goodwill.

The Jensen calibration: this is **transparency, not surveillance**. Citizens see each other's work too. Frame it that way in the program docs.

---

## Highlander integration — open questions

Highlander is on the approved MCP allowlist and the program already commits to "Highlander tracks all citizen activity." The structural answer for ingest: if Highlander can consume a GitHub App's webhook stream or poll the org via an installation token, then *all citizen repos under one org with one App installed = one config*.

Questions to verify with Highlander's owner:

1. Does Highlander have a GitHub org-installation flow today, or only per-repo?
2. What signals does it ingest — commits, PRs, repo metadata, README content?
3. Does it persist semantic embeddings of repo content? (Needed for "find similar projects.")
4. Can it push back to Slack/email for connection/notification use cases?

If Highlander only ingests partial signal, the gap is filled by a custom scanner script. They're complements, not alternatives.

---

## Risks and how the program controls for them

- **Goodhart trap.** The vision doc names this: don't measure citizens on commit counts. The shift to "shipped artifact + adoption + self-attested ROI" must hold for these new use cases too. Don't let a newsletter become a leaderboard.
- **Surveillance perception.** A scanner that detects rule violations is also a scanner that watches everything. The program agreement needs to be explicit about what's scanned, why, and what consequences look like. Pair the driving-zones "license revocation" framing with "we're not reading every line of code, we're looking for X, Y, Z."
- **Privacy / HR.** Per-individual productivity data can feed performance review or program-ROI defense, not both. Agree with People Ops up front. SPACE paper (Forsgren et al., ACM 2021) has guidance.
- **Curation overhead.** Newsletter and case-study programs need human judgment. Don't try to fully automate. The scanner *surfaces candidates*, the program lead decides what's featured.
- **Citizens never push.** The whole vision collapses if citizens treat GitHub as optional. The "no repo, no work" norm is the lever. Course content, office hours, and program agreement all reinforce it.

---

## What this doc is *not*

- Not a step-by-step implementation plan. See `citizen-github-implementation-steps.md`.
- Not the current-state audit. See `citizen-github-audit-2026-05-01.md`.
- Not the per-citizen ROI design. See `Claude Skills/docs/citizen-developer-vision.md`.
- Not the zone rules. See `driving-zones-framework.md`.
