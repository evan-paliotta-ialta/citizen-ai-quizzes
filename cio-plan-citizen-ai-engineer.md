# Citizen AI Engineer Program: Executive Plan

## What We're Doing

Rolling out Claude AI licenses to employees across the organization using a "driver's license" model: everyone who receives a license completes a certification course, signs an acceptable use agreement, and follows tiered processes based on the sensitivity of their work. This enables productivity gains from AI while maintaining SOC2 Type II and ISO 27001 compliance.

## Licensing Approach

We are proceeding with the **Claude Teams plan** we already have — no upgrade required for initial rollout. This allows us to move immediately.

The Teams plan provides the technical guardrails needed to get started (sandbox, managed settings, MCP server lockdown). The gap vs. Enterprise is on the compliance monitoring side: Teams lacks audit logs (SOC2 CC7.2), the Compliance API for SIEM integration (SOC2 CC7.1), SCIM provisioning (SOC2 CC6.1/6.2), and configurable data retention (ISO 27001 A.8.10).

**Future state**: The Anthropic Enterprise API is the target — it provides per-user usage tracking, token-level consumption visibility, and the compliance controls needed to prove the program's value and satisfy auditors. We will evaluate this once the program has run for one quarter and usage patterns are established.

## The Driving Zones Model

Usage is tiered by **data sensitivity** with no gray areas:

| Zone | Analogy | Data Involved | Process Required |
|---|---|---|---|
| **Zone 1: Private Property** | Your driveway | Public data only, no company info | No governance required — but commit to GitHub anyway. Highlander tracks all citizen activity. |
| **Zone 2: Residential** | Neighborhood streets | Internal (non-confidential), no PII/client data | GitHub repo + branch protection + code review |
| **Zone 3: Highway** | Highway driving | Confidential/PII/client data, MCP servers, production systems | Zone 2 + approved MCP servers only + full audit logging + manager review |
| **No-Drive Zone** | Zero tolerance | Credentials, secrets, bypassing guardrails, unapproved tools | Prohibited always. Violation = license revocation |

**Decision rule:** The data determines the zone. Any MCP server connecting to a live system automatically triggers Zone 3.

## Technical Guardrail Stack

All enforced centrally via IT-deployed configuration files that users cannot override:

- **managed-settings.json** - Org-wide permission rules, sandbox enforcement, approved domains
- **managed-mcp.json** - Allowlisted MCP servers only (deny-by-default)
- **Global CLAUDE.md** - Governance rules loaded into every session
- **Hooks** - Audit logging (every command timestamped), dangerous command blocking
- **GitHub-first workflow** - All AI-assisted work in version control with branch protection
- **Sandbox** - OS-level filesystem/network isolation (the true enforcement layer)

## Order of Operations

| Phase | Action | Owner |
|---|---|---|
| **1. Agree on the Plan** | CIO reviews this plan against existing SOC2/ISO policies. Approve the Driving Zones model and overall approach. | CIO + Program Lead |
| **2. Amend the Policies** | Update the drafted Acceptable Use Policy to reflect the Driving Zones, data classification rules, No-Drive Zone violations, and enforcement procedures. Align with existing SOC2/ISO control matrices. | CIO + Legal/Compliance |
| **3. Build the Technical Guardrail Stack** | Create and deploy managed-settings.json, managed-mcp.json, global CLAUDE.md, audit hooks, and GitHub repo templates. Set up citizen repos in GitHub Teams. | IT/Engineering + Program Lead |
| **4. Design the Course** | Build certification course: AI basics, Driving Zones, hands-on sandbox practice per zone, No-Drive Zone scenarios, and assessment. | Program Lead + L&D |
| **5. Pilot** | 5-10 people across roles. Run through course, work in all zones, collect feedback, iterate on policies/guardrails/course. | Program Lead |
| **6. Rollout** | Department-by-department rollout. License granted upon course completion + agreement signature. | Program Lead + Department Heads |

## Ask

1. Approve the Driving Zones tiering model as our governance framework
2. Review the attached Acceptable Use Policy draft against this framework
3. Designate compliance/legal reviewers to align with SOC2/ISO control matrices
4. *(Future)* Evaluate Anthropic Enterprise API after Q1 of program operation for usage tracking + compliance controls

---

## Tracking & Proving Business Value via Highlander

### Overview

The CIO's Highlander platform (ODL + Learning Platform) already has the infrastructure to track citizen developer activity end-to-end. No new systems are needed — citizens just need to work through GitHub, which feeds directly into Highlander's existing ingestion pipeline.

### How It Works

```
Citizen commits to GitHub repo
        ↓
GitHub webhook → Lambda (real-time) → staging.github_commits
        ↓
Highlander analyzers run across GitHub commits and repo metadata
        ↓
engineer_effectiveness + gap_analysis + CONSTRAINT_ANALYSIS output
        ↓
MCP tools expose data to Claude Code / CIO dashboards
```

Highlander already tracks: commit velocity, AI co-authorship %, engineer effectiveness per person, gap ratios between client pain and developer effort, and constraint reduction over time. Citizens just need to be connected to it.

### GitHub Org Structure for Citizens

1. **Repo naming convention**: `citizen-<team>-<project>` (e.g., `citizen-ops-deal-tracker`, `citizen-finance-arr-report`)
2. **Required `METADATA.yaml`** in every citizen repo:
   ```yaml
   owner: jane.doe@helmmarkets.com
   team: operations
   okr: "OKR-3.2 - Reduce manual ops overhead by 40%"
   business_problem: "Deal intake was taking 2 hours manually per submission"
   zone: 2  # Driving Zone from governance model
   ```
3. **GitHub topic tag**: all citizen repos tagged `citizen-ai` so Highlander can segment them from core engineering output
4. **Company email required**: every citizen's GitHub account must use their company email — this maps to Highlander's `engineer_email_mapping` table for identity resolution

### Connecting to Highlander (One-Time Setup — ~8 hrs engineering)

| Step | Action | Effort |
|---|---|---|
| Add citizen repos | Populate `admin.github_repositories` for each repo | 1 hr |
| Map identities | Add citizens to `engineer_email_mapping` (GitHub handle → name/team) | 1 hr |
| Segment analyzer | Add `citizen` filter to `engineer_effectiveness` analyzer output | 2-4 hrs |
| Repo template | Create GitHub template repo with `METADATA.yaml`, `README` structure, `.github/` config | 2-3 hrs |

### Business Value Metrics Available After Setup

| Metric | Source in Highlander | OKR Story |
|---|---|---|
| Commit velocity per citizen | `staging.github_commits` | Adoption rate — who is active vs. inactive |
| AI co-authorship % | `github_commits.ai_coauthored` | Force multiplication — AI leverage per developer |
| Gap ratio reduction | `gap_analysis.json` | Are citizens solving real operational bottlenecks? |
| Constraint reduction over time | `CONSTRAINT_ANALYSIS.md` | Are citizen tools reducing support case volume? |
| OKR attribution | `METADATA.yaml` → KB | Which commits map to which OKRs |
| Certification completion | Learning Platform `quiz_results` | Funnel: enrolled → certified → shipping → value |

**Target narrative for CIO/board**: "X citizen developers shipped Y tools that closed Z operational bottlenecks, reducing support case volume by N% against OKR [X]."

### Learning Platform Tie-In

Highlander's Learning Platform already tracks quiz completions per user email. Use this as the **certification gate** — a citizen is not considered "active" in the program until they've completed the required journey modules. This creates a clean, auditable funnel tracked in a system that already exists.

---

## Cost Model: 20–25 Citizen Developers

### 1. Claude Licensing

We are staying on the **Claude Teams plan** we already have. No additional licensing cost for the initial rollout — seats just need to be provisioned for each citizen.

| Tier | Per User/Month | 20 Users/Month | 25 Users/Month | Notes |
|---|---|---|---|---|
| **Claude Teams** (current, proceeding) | ~$30 | ~$600 | ~$750 | Already contracted |
| *(Future) Anthropic Enterprise API* | *TBD* | *TBD* | *TBD* | *Evaluate after Q1 for usage analytics + compliance controls* |

**Planning estimate (25 seats, Teams): ~$750/month (~$9,000/year)**
If seats are already provisioned, marginal cost is $0 until headcount grows past current allocation.

### 2. GitHub Teams

Citizens will use **GitHub Teams** ($4/user/month). This is the confirmed tier.

| Users | Monthly | Annual |
|---|---|---|
| 20 citizens | ~$80 | ~$960 |
| 25 citizens | ~$100 | ~$1,200 |

**Planning estimate (25 seats): ~$100/month (~$1,200/year)**
Confirm whether citizen accounts fall under an existing org seat allocation — if so, this may already be covered.

### 3. Highlander Infrastructure (Marginal Increase)

The ODL already runs at ~$89/month. Adding 20–25 citizen repos increases:

| Component | Current | With Citizens | Delta |
|---|---|---|---|
| Lambda invocations | ~X/month | +webhook per commit | ~$2–5/month |
| RDS storage | 20 GB GP3 | Minimal row growth | ~$1–3/month |
| S3 raw storage | Existing | ~1–2 GB/year additional | ~$0.02/month |
| CloudWatch Logs | Existing | Slightly more log volume | ~$1–2/month |

**Marginal Highlander cost: ~$5–10/month. Negligible.**

### 4. One-Time Setup Costs (Engineering Time)

| Task | Hours | Notes |
|---|---|---|
| Repo template + METADATA convention | 3 hrs | One-time |
| Highlander analyzer segment update | 4 hrs | One-time |
| Identity mapping + repo registration | 2 hrs | One-time |
| Citizen onboarding docs + GitHub setup | 2 hrs | One-time |
| **Total** | **~11 hrs** | At $150/hr blended eng rate ≈ $1,650 one-time |

### 5. Training & Certification (Per Cohort)

| Activity | Hours | Notes |
|---|---|---|
| Course design (if not built) | 20–40 hrs | One-time; uses existing Learning Platform |
| Per-citizen onboarding/training | 2–4 hrs each | 25 citizens × 3 hrs avg = 75 hrs |
| Program management (ongoing) | ~5 hrs/month | Tracking, reporting, troubleshooting |

### Total Cost Summary

| Category | One-Time | Monthly | Annual |
|---|---|---|---|
| Claude Teams (25 seats, already contracted) | — | ~$750 | ~$9,000 |
| GitHub Teams (25 seats) | — | ~$100 | ~$1,200 |
| Highlander infra (marginal) | — | ~$8 | ~$96 |
| Engineering setup | ~$1,650 | — | — |
| Training / course design | ~$4,500 | — | — |
| Program management | — | ~$750 | ~$9,000 |
| **Total** | **~$6,150** | **~$1,608** | **~$19,296 + $6,150 setup** |

**~$25K total in year one. ~$19K/year ongoing.**

> **Future**: Anthropic Enterprise API adds usage analytics, per-user token tracking, and SIEM/compliance controls. Evaluate after Q1 once usage patterns are established. Budget ~$1,125–1,875/month incremental if/when adopted (delta between Teams and Enterprise pricing).

### Break-Even / ROI Frame

At 25 citizens saving even 1 hour/week each on manual work:
- 25 people × 1 hr/week × 50 weeks = **1,250 hours/year saved**
- At $75/hr fully-loaded cost = **$93,750/year in recaptured capacity**
- **Break-even at ~5 months; 2.8× ROI in year one on labor savings alone**

If citizens build tools that reduce support case volume (measurable via Highlander's `gap_analysis`), the ROI multiplies further — and Highlander gives you the data to prove it.
