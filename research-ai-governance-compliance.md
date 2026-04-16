# Research: Enterprise AI Rollout with SOC2 & ISO 27001 Compliance

**Date:** 2026-03-02

---

## 1. AI Acceptable Use Policies

Enterprise AI acceptable use policies have evolved from vague guidelines into highly specific, enforceable documents.

**Key clauses companies are including:**

- **Data Protection (most critical):** "Personnel are strictly prohibited from inputting any data classified as Confidential, Restricted, or containing PII into publicly available AI tools without explicit written approval."
- **Decision-Making Restrictions:** AI may not make final decisions on employment, credit, housing, healthcare, or legal matters without human review.
- **Tiered Use Boundaries:** Define what is/isn't permitted per task type ("You may use AI for drafting social media posts; you may not use it to generate final legal contracts.")
- **Vendor/Platform Terms:** Demand explicit provisions from AI vendors prohibiting model training on customer data, requiring data segregation, and including audit rights. Anthropic's Enterprise Terms explicitly prohibit data training.
- **Contractual Use Limitations on Client Data:** NDAs increasingly include "you are prohibited from using AI with our data without consent" (flagged by Debevoise & Plimpton).
- **Risk Classification Tiers:**
  - Low Risk: basic user training required
  - Medium Risk: role-based access controls, activity logging, quarterly reviews
  - High Risk: strict obligations, fairness testing, documented thresholds
  - Unacceptable Risk: prohibited outright
- **Enforcement:** Violations escalate from warnings to access revocation to disciplinary measures.

**Sources:**
- [Tenable - AI AUP](https://www.tenable.com/cybersecurity-guide/learn/ai-acceptable-use-policy-aup)
- [Nexos AI - 11 Things to Include](https://nexos.ai/blog/ai-policy-for-companies/)
- [TechnoAdvantage - AI Policy Template 2026](https://technoadvantage.com/ai-policy-for-companies/)
- [Liminal - Enterprise AI Governance Guide](https://www.liminal.ai/blog/enterprise-ai-governance-guide)

---

## 2. SOC2 + ISO 27001 Controls for AI Tools

### SOC2 Trust Service Criteria

Anthropic holds SOC 2 Type II, ISO 27001:2022, and ISO/IEC 42001:2023. But **your organization's compliance is your responsibility**.

| SOC2 Criteria | AI Tool Control Required |
|---|---|
| CC6.1 - Logical Access | Document who can use Claude, which repos they access, monitoring |
| CC6.3 - Role-Based Access | RBAC for AI tool access; least-privilege for code repos |
| CC7.2 - System Monitoring | Audit logs of all AI tool usage; SIEM integration |
| CC8.1 - Change Management | Code review process for AI-generated code; human validation |
| PI1.4 - Processing Integrity | Document that AI outputs are reviewed for completeness, validity, accuracy |
| C1.1 - Confidentiality | Data classification for code sent to AI providers; encryption |

**Processing Integrity is the hardest:** AICPA now requires companies to demonstrate AI systems generate complete, valid, accurate, and permitted outputs. Controls: require human validation, log AI model version, use checkpoints as rollback evidence.

### ISO 27001 Annex A Controls

| ISO 27001 Control | AI Application |
|---|---|
| A.5.10 - Acceptable Use | AI-specific AUP covering approved tools, prohibited data types |
| A.5.12 - Information Classification | Classify code/data before sending to AI services |
| A.5.23 - Cloud Services Security | AI tools as cloud services requiring security assessment |
| A.8.2 - Privileged Access Rights | Admin controls for AI tool provisioning |
| A.8.5 - Secure Authentication | SSO/MFA for enterprise AI tool access |
| A.8.15 - Logging | Comprehensive AI usage logging |
| A.8.16 - Monitoring Activities | Real-time monitoring of AI interactions |
| A.8.25 - Secure Development | Adapted for AI-assisted development and adversarial testing |

**Sources:**
- [Claude Code SOC 2 Compliance Guide](https://amitkoth.com/claude-code-soc2-compliance-auditor-guide/)
- [Augment Code - AI SOC2 Guide](https://www.augmentcode.com/tools/ai-coding-tools-soc2-compliance-enterprise-security-guide)
- [HighTable - ISO 27001 for AI](https://hightable.io/iso-27001-for-ai-companies/)

---

## 3. AI Governance Frameworks

### NIST AI RMF vs ISO 42001

- **NIST AI RMF** (voluntary, US-focused): Govern, Map, Measure, Manage. Not certifiable. Best for risk-based guidance.
- **ISO/IEC 42001** (certifiable, international): AI Management System with 38 controls. Becoming the de facto certification. Anthropic already holds it.
- **NIST published a crosswalk** mapping AI RMF to ISO 42001: [airc.nist.gov](https://airc.nist.gov/docs/NIST_AI_RMF_to_ISO_IEC_42001_Crosswalk.pdf)

**Most mature orgs integrate both:** ISO 42001 as certifiable framework + NIST AI RMF for risk identification + SOC2 for operational evidence.

By 2026, 60% of organizations projected to have formalized AI governance programs.

---

## 4. Training & Certification Programs

AI adoption reached 78% of enterprises in 2025, but only 35% of employees received any AI training.

### Tiered Internal Certification ("AI License") Pattern

- **Level 1 - AI Literacy** (all employees): Basic AI concepts, responsible use, company policy, data classification. 1-2 weeks, 5-10 hours.
- **Level 2 - AI Practitioner** (power users): Job-specific applications, intermediate prompt engineering. 4-6 weeks.
- **Level 3 - AI Developer** (technical staff): Advanced prompt engineering, code review for AI outputs, security implications. 2-3 months ongoing.

### External Certifications
- EC-Council C|RAGE: Responsible AI governance aligned with NIST/ISO 42001
- EC-Council AIE: Practical AI literacy
- Google AI Professional Certificate
- NAVEX AI at Work: Compliance-focused training

### Key Best Practice
Provide safe sandbox environments with non-sensitive data before production rollout. Companies report 26-55% productivity gains.

---

## 5. Audit Trail / Logging Approaches

### Claude Enterprise Logging
- Audit logs for Enterprise orgs: active users, conversation frequency, breakdowns by project/file
- 30-day retention, exportable as JSON/CSV, SIEM integration (Splunk, Datadog, Elastic)
- **Compliance API**: Programmatic access for continuous monitoring and automated policy enforcement

### GitHub Copilot Audit Logging
- 180-day retention, queryable via `action:copilot`
- GraphQL and REST API access for Enterprise Cloud

### Git-Based Audit Approaches
- Link GitHub commits to Jira issues for connected audit trails
- Trail of Bits' `claude-code-config` includes `hooks/log-gam.sh`: classifies commands as read/write, logs mutations with timestamp, action, command, exit status
- Bash command logging hook: appends every agent command to timestamped log file

### Jira Integration
- Atlassian's Rovo MCP Server (GA) enables AI agents to work within Jira using OAuth 2.1
- Jira native audit log captures auth, permissions, project configs, admin actions
- Datadog integration brings Jira/Confluence audit logs into Cloud SIEM

**Sources:**
- [Claude - Audit Logs](https://support.claude.com/en/articles/9970975-how-to-access-audit-logs)
- [GitHub Docs - Copilot Audit Logs](https://docs.github.com/copilot/managing-github-copilot-in-your-organization/reviewing-audit-logs-for-copilot-business)
- [Trail of Bits - claude-code-config](https://github.com/trailofbits/claude-code-config)

---

## 6. Claude Code Specific Governance

### Configuration Hierarchy
1. **Enterprise-managed policies** (highest priority)
2. **Global** (`~/.claude/settings.json` and `~/.claude/CLAUDE.md`)
3. **Project** (`.claude/` in repo) - augments but cannot override global security settings

### settings.json for Enterprise Guardrails
- Permission deny rules block Read/Edit from sensitive paths (`.env`, `.ssh/`)
- **Critical caveat:** Deny rules do NOT stop Bash commands. Without sandbox, `cat ~/.ssh/id_rsa` bypasses deny rules. Sandbox (Seatbelt macOS, bubblewrap Linux) enforces at OS level.
- `allowManagedHooksOnly` blocks user/project/plugin hooks
- Network access configurable to disable or allow only specific domains

### CLAUDE.md for Governance
- Global `~/.claude/CLAUDE.md` defines standards, loaded at every session start
- Project CLAUDE.md augments (does not replace) global file
- Best practice: Start small, curate based on what Claude gets wrong

### Hooks System (Trail of Bits)
- **Hooks are "guardrails, not walls"** - NOT a security boundary (prompt injection can work around them)
- Recommended defaults: Block `rm -rf`, block direct push to `main`/`master`
- Audit hooks: Command logging, mutation logging with timestamps
- **HTTP Hooks**: POST JSON to a URL for centralized webhook-based governance

### Security Model
- Strict read-only permissions by default
- TLS 1.2+ for network; AES-256 encryption at rest
- Consumer Claude usage should be explicitly prohibited in AUP
- Claude Code talks directly to Anthropic API - single vendor risk assessment

### Enterprise Admin Controls
- Managed policy deployment across all users
- Self-serve seat management
- Granular spend controls (org and individual)
- Usage analytics (lines accepted, suggestion rate, patterns)
- SAML 2.0 and OIDC SSO
- BYOK encryption coming H1 2026

**Sources:**
- [Trail of Bits - claude-code-config](https://github.com/trailofbits/claude-code-config)
- [Claude Code - Security Docs](https://code.claude.com/docs/en/security)
- [Codacy - Security Guardrails](https://blog.codacy.com/equipping-claude-code-with-deterministic-security-guardrails)

---

## 7. Tiered Access Models

### Practical Tiers for AI Coding Tools

**Tier 1 - General Assistance (Low Control):**
- Basic code completion, documentation, general Q&A
- Public/Internal data only
- Controls: AUP acknowledgment, basic training completion
- Monitoring: Aggregate usage metrics

**Tier 2 - Code Generation (Medium Control):**
- Full code generation, refactoring, test writing
- Internal/Confidential (no PII)
- Controls: Role-based access, activity logging, quarterly reviews
- Monitoring: Per-user audit logging, code review requirements

**Tier 3 - Data Access / Agentic Operations (High Control):**
- Database queries, API integrations, autonomous agent operations
- Confidential/Restricted with explicit approval
- Controls: MFA, approval workflows, real-time monitoring, DLP
- Monitoring: Full audit trail, SIEM integration, anomaly detection

---

## 8. GitHub-First Workflows for AI Governance

### GitHub Agent HQ (GA Feb 26, 2026)
- Unified control plane for managing AI coding agents from multiple vendors
- **AI Controls Tab**: Permanent home for all AI-related policies
- **Agent Permission Management**: Compartmentalizes access at branch level
- **Delegated Administration**: Enterprise custom roles with fine-grained permissions

### AGENTS.md as Version-Controlled Governance
- Files in `.github/agents/*.md` serve as versioned specification for AI agent behavior
- Automatically inherited when cloning repos
- Enterprise admins can protect from edits using push rules
- Programmatically applied via API for enterprise-wide consistency

### Branch Protection for AI Agents
- Copilot coding agent: only create/push to `copilot/` branches
- Subject to all branch protections
- User who asked agent to create PR cannot approve it
- Read-only repo access in sandboxed environment

### The GitHub-First Compliance Pattern
1. All AI-generated code goes through version control (no direct production changes)
2. AGENTS.md defines and versions agent behavior rules
3. Branch protection enforces review requirements
4. AI agents operate on isolated branches with limited permissions
5. Automated code quality/security scanning on agent-generated PRs
6. Human review required before merge
7. Full audit trail via GitHub audit logs (180-day retention, API accessible)
8. Enterprise admin controls centralize policy

**Sources:**
- [GitHub Blog - Agent HQ](https://github.blog/news-insights/company-news/welcome-home-agents/)
- [GitHub - Enterprise AI Controls GA](https://github.blog/changelog/2026-02-26-enterprise-ai-controls-agent-control-plane-now-generally-available/)
- [GitHub Docs - Copilot Coding Agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent)

---

## Key Takeaways

1. **Start with policy, not technology.** Write your AI AUP first. Auditors ask for it first.
2. **Use enterprise tiers of AI tools.** Consumer Claude/ChatGPT should be explicitly prohibited.
3. **Implement the GitHub-first pattern.** Version control + branch protection + PR reviews = single most practical compliance control.
4. **Layer governance configuration.** Enterprise managed > global settings > project settings.
5. **Build audit trail from day one.** Integrate Claude Enterprise + GitHub audit logs into SIEM. Link commits to Jira.
6. **Require training before access.** Tiered "AI License" gating access behind responsible use training.
7. **Map controls to both SOC2 and ISO 27001.** Use the NIST AI RMF to ISO 42001 crosswalk.
8. **Plan for EU AI Act.** Risk-based classification becoming global best practice even for US companies.
