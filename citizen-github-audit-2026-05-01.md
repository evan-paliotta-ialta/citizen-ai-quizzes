# Helm Markets GitHub Org — Audit

**Date:** 2026-05-01
**Audited by:** Evan Paliotta (via gh CLI, account `evan-paliotta-ialta`)
**Token scopes:** `gist`, `project`, `read:org`, `repo`, `workflow`
**Companion docs:** `citizen-github-platform-vision.md`, `citizen-github-implementation-steps.md`

---

## Access caveats

The auditor's token has `read:org` but not `admin:org`. The following could **not** be verified directly and are noted as unknowns:
- Org-level rulesets list
- Security manager team assignments
- Org-wide secret-scanning / dependabot / code-scanning alert state
- Confirmed 2FA enforcement state (API returned `null`)
- Installed GitHub Apps and webhooks
- SAML/SSO configuration

Anything below labeled "unverified" should be confirmed by an Owner.

---

## Org snapshot

| Field | Value |
|---|---|
| Login | `helmmarkets` |
| Display name | Helm Markets |
| Created | 2026-03-09 |
| Plan | **Enterprise** (96.5 GB storage, effectively unlimited private repos) |
| Seats | 34 of 36 filled |
| Domain verified | Yes |
| Public repos | 0 |
| Private/internal repos | 7 owned |
| Default repo branch | `main` |
| Default repo permission | `null` (none — members do not auto-receive any access) |
| 2FA enforcement | Unverified |
| Web commit signoff required | No |

**Implication:** Enterprise plan unlocks internal-visibility repos, repository rulesets, custom roles, advanced auditing, and SAML SSO. The platform is correctly licensed; the gaps below are configuration, not capability.

---

## Org-level member privileges

These are policies applied to every non-Owner member:

| Setting | Current | Recommended | Risk if left as-is |
|---|---|---|---|
| Members can create repositories | `true` (all visibilities) | Restrict to **internal** only for Citizens | Citizens could create public repos exposing internal work |
| Members can create public pages | `true` | `false` | Same — accidental publication |
| Members can fork private repos | `false` | Keep | Already safe |
| Members can delete repositories | **`true`** | `false` | A citizen could delete their own repo, erasing audit trail |
| Members can change repo visibility | **`true`** | `false` | A citizen could flip a private repo to public |
| Members can invite outside collaborators | **`true`** | `false` | A citizen could grant external party access |
| Members can create teams | `true` | Owner-only | Sprawl |
| Web commit signoff required | `false` | Consider `true` | DCO trail for compliance |

The four bolded rows are the highest-priority tightening targets.

---

## Teams

Six teams exist. None have parent/child relationships (flat structure). All have base permission `pull`.

| Team | Slug | Members | Description | Notes |
|---|---|---|---|---|
| **Citizens** | `citizens` | 2 | "All the Citizen AI Engineers (non-product & engineering teams)" | **Severely underpopulated** — program target is ~25. Currently: Evan, bmarcus28. |
| Highlander | `highlander` | 6 | "Highlander Ambassadors" | tobynott80, GarethColes, Jonathan-iAlta, zachkushel, evan-paliotta-ialta, bmarcus28 |
| helm-data | `helm-data` | (not pulled) | "Neal Nemeroff et al" | |
| infra | `infra` | 2 | — | rohanjoshi95, dmolik-ialta |
| pt-leads | `pt-leads` | 2 | "Leaders of the Helm Digital Factory" | johndemler, Jonathan-iAlta |
| Westcap CTOs | `westcap-ctos` | (not pulled) | — | |

**Citizens team has zero repos assigned to it.** This is the central operational gap: the team exists in name only.

---

## Repositories

7 repos, all owned by the org. None public.

| Repo | Visibility | Last push | Size (KB) | Description |
|---|---|---|---|---|
| `passage` | private | 2026-04-30 | 2,197 | Experimentation, reviews, prototyping, spec generation for the Helm private markets ecosystem |
| `highlander-app` | private | 2026-05-01 | 803,135 | The code repo for Highlander |
| `highlander-helm-kb` | private | 2026-04-21 | 7,966 | Helm instance of Highlander's KB |
| `highlander-helm-kb-dev` | private | 2026-04-17 | 7,686 | Helm Highlander KB — dev |
| `highlander-ialta-kb` | private | 2026-04-07 | 6,054 | iAlta instance of Highlander's KB — production |
| `highlander-ialta-kb-dev` | private | 2026-04-14 | 6,539 | iAlta Highlander KB — dev/test |
| `core-os-reporting` | **internal** | 2026-04-23 | 0 | Neal Nemeroff's work on Helm Core O/S research |

Observations:
- Six repos are **private**; only `core-os-reporting` is **internal**. Citizens added to the org will *not* see most existing repos by default — they need explicit team or collab grants.
- Zero citizen-built repos exist yet. The platform is empty from the program's perspective.
- All repos use `main` as default; forking from private is disabled (good).

---

## Branch protection and rulesets

- `helmmarkets/passage`: no branch protection on `main`, no rulesets.
- `helmmarkets/highlander-app`: no rulesets.
- Org-level rulesets: unverified (requires `admin:org`).

**Implication:** With zero rulesets, citizens (once added) could push directly to `main` on any repo they own, force-push, delete branches, and leave no review trail. This is the largest enforcement gap.

---

## Security features

Could not query directly. Likely status, inferred from defaults:

- Secret scanning + push protection: **likely off** for non-public repos until enabled at org level. Enterprise plan is eligible for free private-repo secret scanning since 2024 — needs an Owner to flip on.
- Dependabot alerts: status unknown.
- Code scanning (CodeQL): status unknown, likely requires GHAS purchase.
- Audit log streaming: unverified.

**Recommended verification by an Owner:**
```
GitHub UI: Settings → Code security → Configure secret scanning, push protection, Dependabot
```

---

## Member roster

Visible org members (from `gh api orgs/helmmarkets/members`): 9 of 34 seats. The remaining ~25 have private membership and are not visible at the `read:org` scope.

| Login | Notes |
|---|---|
| evan-paliotta-ialta | Program lead — Member (not Owner) |
| Jonathan-iAlta | CIO; on Highlander, pt-leads |
| bmarcus28 | On Citizens, Highlander |
| GarethColes | On Highlander |
| tobynott80 | On Highlander |
| zachkushel | On Highlander |
| dmolik-ialta | On infra |
| rohanjoshi95 | On infra |
| johndemler | On pt-leads |

**Evan's role:** `member`, `direct_membership: true`. **Not Owner.** This is the first blocker to fix — see implementation steps.

---

## Gap analysis vs. the platform vision

| Vision element | Current state | Gap |
|---|---|---|
| Single org for citizen output | Org exists | None |
| Default visibility = internal | Default = private; only 1 of 7 repos is internal | Change org default; convert existing where appropriate |
| Citizens team with read on all citizen repos | Team exists, 2 members, 0 repos | Add citizens; assign team to their repos as auto-grant on creation |
| Program lead = Owner | Evan is Member only | Promote to Owner |
| GitHub App for scanning + Highlander | None installed (unverified but no signs of it) | Create + install |
| Org-level ruleset (branch protection) | None | Author and apply |
| Secret scanning / push protection | Unverified, likely off | Enable at org level |
| Member-creates-repo policy | Unrestricted (all visibilities) | Tighten — internal only for citizens |
| Repo template with CLAUDE.md, ROI marker | None | Create `helmmarkets/citizen-template` |
| Repo deletion / visibility / outside collab | All allowed for members | Disable for non-Owners |
| Citizens enrolled | 2 of ~25 | Add the rest |

---

## Headline summary

The org is on the right plan, has the right team structure in name, and has a clean foundation — but **zero of the operational controls** that the platform vision depends on are in place. Five blockers dominate everything else:

1. Evan is a Member, not an Owner.
2. The Citizens team has 2 people and no repos.
3. There is no branch protection anywhere in the org.
4. Member privileges allow destructive actions (delete, visibility flip, outside collaborators).
5. Default repo visibility is private, not internal — so the "shared learning" use cases don't work even after citizens are added.

All five are fixable in a few hours of Owner-level configuration. See the implementation-steps doc for the order of operations.
