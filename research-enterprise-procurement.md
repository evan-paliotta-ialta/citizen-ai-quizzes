# Claude Enterprise Procurement Research

**Date:** 2026-03-02

---

## The Short Answer: Try Again

**Self-serve Enterprise launched February 12, 2026** - just 3 weeks ago. The minimum is now **20 seats**, purchased directly at `claude.ai/create/enterprise` with no sales conversation required. Your CIO may have been told "no" under the old model (which reportedly required 70 seats + annual contract through sales). That barrier has been significantly lowered.

For comparison, ChatGPT Enterprise requires **150 minimum seats**. Claude's 20-seat minimum is the most accessible enterprise AI plan on the market.

---

## Three Ways to Buy Enterprise

1. **Self-serve (fastest):** Go to `claude.ai/create/enterprise`. Set up workspace, configure SSO, invite members. Credit card, annual commitment. **Minimum 20 seats.**
2. **Sales-assisted:** Contact `sales@anthropic.com` or [claude.com/contact-sales](https://claude.com/contact-sales). Needed for invoicing, HIPAA/BAA, custom contract terms, trials, or dedicated CSM.
3. **AWS Marketplace:** Available at [AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-nnvi6wff6ef6m). May simplify procurement if you already have AWS billing.

---

## Pricing

- Enterprise pricing is **not publicly disclosed** per-seat. Third-party estimates suggest ~$60/seat/month (unconfirmed).
- Billed annually. Usage purchased upfront as credits that draw down.
- Seats cannot be removed mid-term on self-serve. Can add seats (prorated).
- Transitioning to a **single seat type** (no more separate Chat vs Claude Code seats). At renewal, all users move to all-inclusive Enterprise seat.

---

## If 20 Seats is Still Too Many

### Option A: Team Plan + Compensating Controls
Team ($25/seat/mo, minimum 5 seats) gives you SSO, spend controls, and basic admin. Supplement with:
- **Local `managed-settings.json`** - Works on Team. Full tool permissions, hook restrictions, MCP server lockdown.
- **Hooks-based audit logging** - Trail of Bits pattern: log every command with timestamps locally.
- **GitHub audit trail** - All work through version control provides a secondary audit trail.
- **Missing:** Native audit logs, Compliance API, SCIM. These are the compliance gaps.

### Option B: API Keys + Third-Party Governance
Run Claude Code against Anthropic API keys (pay-per-use) and add governance via:
- **Bifrost** (open-source AI gateway) - Budget controls, audit trails, rate limiting, Prometheus metrics
- **Local `managed-settings.json`** - Works without any plan. Enforces all local governance.
- **Missing:** Server-managed settings (requires Team+), Anthropic audit logs.

### Option C: AWS Bedrock
Route Claude through AWS Bedrock, which gives you AWS IAM, CloudTrail logging, VPC controls, and AWS's compliance framework. Higher effort but leverages existing AWS governance.

### Option D: Buy 20 Seats Anyway
If you're close to 20 people who would benefit from Claude (not just AI engineers - include anyone who'd use Claude for Zone 1/2 tasks), purchasing 20 seats even if not all immediately used may be the simplest path. At ~$60/seat that's ~$14,400/year.

### Option E: Negotiate with Sales
Contact `sales@anthropic.com` directly. Some companies report success getting accommodations for smaller deployments, especially when they can articulate specific compliance requirements.

---

## What Claude Max Is (And Isn't)

Max ($100/mo or $200/mo) is an **individual power-user plan**. Zero admin, audit, or governance features. No SSO, no SCIM, no team management. Not a middle ground for organizational use.

---

## Feature Availability Summary

| Feature | Team (5+) | Enterprise (20+) | API Keys |
|---|---|---|---|
| SSO (SAML/OIDC) | Yes | Yes | N/A |
| SCIM | No | Yes | N/A |
| Audit Logs | **No** | Yes | No |
| Compliance API | **No** | Yes | No |
| managed-settings.json (local) | Yes | Yes | Yes |
| managed-mcp.json (local) | Yes | Yes | Yes |
| Hooks | Yes | Yes | Yes |
| Sandbox | Yes | Yes | Yes |
| Server-managed settings | Yes (v2.1.38+) | Yes | No |
| Spend controls | Org-level | Org + per-user | API limits |
| Custom data retention | No | Yes | N/A |
| No model training on data | Yes | Yes | Yes |
| Admin API | No | No | Yes |

---

## Sources

- [Claude Enterprise, now available self-serve (Feb 2026)](https://claude.com/blog/self-serve-enterprise)
- [Enterprise plan details](https://www.anthropic.com/enterprise)
- [Purchase and manage seats](https://support.claude.com/en/articles/13393991-purchase-and-manage-seats-on-enterprise-plans)
- [Billing FAQ](https://support.claude.com/en/articles/11526368-how-am-i-billed-for-my-enterprise-plan)
- [Contact sales](https://claude.com/contact-sales)
- [Admin API docs](https://docs.anthropic.com/en/api/administration-api)
- [Claude Code settings](https://code.claude.com/docs/en/settings)
- [managed-settings.json guide](https://managed-settings.com/)
- [Anthropic Security Layers Explained](https://securitysandman.com/2025/10/24/anthropics-security-layers-explained-what-you-lose-on-basic-plans-and-what-you-gain-at-enterprise/)
