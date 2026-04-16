# Claude Team vs Enterprise Plan: Compliance-Focused Comparison

**Date:** 2026-03-02

---

## Pricing

| | Team | Enterprise |
|---|---|---|
| Standard seat | $30/mo (monthly) or $25/mo (annual) | Custom pricing (~$60/seat/mo estimated) |
| Premium seat (Claude Code) | $150/mo per seat | Custom pricing |
| Minimum seats | 5 | 20 |
| Billing | Self-serve | Annual contract, usage-based model emerging |

---

## The Compliance-Critical Differences

### 1. Audit Logging - ENTERPRISE ONLY

| Capability | Team | Enterprise |
|---|---|---|
| Audit logs | **No** | **Yes** |
| Export (past 180 days) | N/A | Yes (JSON/CSV) |
| Compliance API (programmatic) | **No** | **Yes** |

**SOC2 impact:** CC6.1, CC7.2, CC7.3 require logging of user access and system events. No native audit trail on Team. This alone likely makes Enterprise mandatory.

### 2. SCIM Provisioning - ENTERPRISE ONLY

| Capability | Team | Enterprise |
|---|---|---|
| SCIM 2.0 automated provisioning | **No** | **Yes** |
| SCIM deprovisioning | **No** | **Yes** |
| IdP group sync | No | Yes |

**SOC2 impact:** CC6.1, CC6.2 require timely provisioning/deprovisioning. Without SCIM, manual user management increases risk of stale accounts.

### 3. Data Retention Controls

| Capability | Team | Enterprise |
|---|---|---|
| Default retention | 30 days | Configurable/custom |
| Zero Data Retention (ZDR) | No | Yes |
| Data residency | No | Yes |
| Selective data deletion | No | Yes (via Compliance API) |

### 4. Admin Controls

| Capability | Team | Enterprise |
|---|---|---|
| Basic admin console | Yes | Yes |
| RBAC (fine-grained) | Basic | Full |
| Per-user spend controls | Limited | Yes |
| Domain capture | No | Yes |
| Usage analytics | Basic | Advanced |

---

## What's the SAME on Both Plans

| Capability | Team | Enterprise |
|---|---|---|
| SSO (SAML 2.0 / OIDC) | Yes | Yes |
| Data used for model training | **No** | **No** |
| `managed-settings.json` deployment | Yes | Yes |
| `managed-mcp.json` deployment | Yes | Yes |
| `disableBypassPermissionsMode` | Yes | Yes |
| `allowManagedPermissionRulesOnly` | Yes | Yes |
| `allowManagedHooksOnly` | Yes | Yes |
| `strictKnownMarketplaces` | Yes | Yes |
| MCP server allowlist/denylist | Yes | Yes |
| Permission deny rules | Yes | Yes |
| Sandbox enforcement | Yes | Yes |
| Hooks system | Yes | Yes |

---

## Bottom Line

**Enterprise is effectively required for SOC2/ISO 27001 compliant rollout.** The Team plan provides solid *preventive* controls (SSO, managed settings, sandbox) but lacks the *detective* controls (audit logs, Compliance API) that auditors expect. SOC2 requires both.

### Required (Enterprise-only):
1. **Audit Logs** - No workaround on Team
2. **SCIM** - Manual deprovisioning is an audit risk
3. **Compliance API** - Needed for SIEM integration and continuous monitoring
4. **Custom data retention** - Needed for ISO 27001 A.8.10

### Nice-to-have (addressable with compensating controls on Team):
1. SSO - Available on both
2. Claude Code managed settings - Available on both
3. Domain capture - Compensate with onboarding procedures
4. Per-user spend controls - Org-level caps may suffice
5. ZDR/Data residency - Only if regulatory requirements demand it

---

## Sources

- [Claude Plans & Pricing](https://claude.com/pricing)
- [Claude Code on Team and Enterprise](https://www.anthropic.com/news/claude-code-on-team-and-enterprise)
- [Enterprise Plan Details](https://support.claude.com/en/articles/9797531-what-is-the-enterprise-plan)
- [Audit Logs](https://support.claude.com/en/articles/9970975-how-to-access-audit-logs)
- [SSO Setup](https://support.claude.com/en/articles/13132885-set-up-single-sign-on-sso)
- [Anthropic Trust Center](https://trust.anthropic.com/)
- [Claude Code Security](https://code.claude.com/docs/en/security)
- [Claude Code Settings](https://code.claude.com/docs/en/settings)
- [Anthropic Compliance API](https://www.token.security/blog/why-anthropics-new-compliance-api-is-a-game-changer-for-secure-agentic-ai-access)
