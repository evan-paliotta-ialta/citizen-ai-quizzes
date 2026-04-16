# Enterprise Plan Recommendation Summary

**Date:** 2026-03-02

---

## Why Enterprise is Required (Not Optional)

The Team plan and Enterprise plan share the same *preventive* controls (managed settings, MCP lockdown, hooks, sandbox). But Team is missing the *detective* controls auditors require:

| Missing on Team | SOC2/ISO Impact |
|---|---|
| **Audit logs** | CC7.2 requires monitoring. No native way to prove who did what. |
| **Compliance API** | Can't feed usage data to SIEM. Can't do continuous monitoring. |
| **SCIM provisioning** | CC6.1/CC6.2 require timely deprovisioning. Manual = audit risk. |
| **Custom data retention** | ISO 27001 A.8.10 requires provable data lifecycle management. |

You can set the rules on Team but can't prove they're being followed. SOC2 requires both preventive AND detective controls.

## Cost Context

- Team: $30/seat/mo standard, $150/seat/mo premium (Claude Code)
- Enterprise: ~$60/seat/mo (custom pricing, annual contract, min ~20 seats)
- Enterprise is a prerequisite, not an upgrade. Building homegrown logging/monitoring would cost more and be less reliable.

## What's the Same on Both Plans

SSO (SAML/OIDC), managed-settings.json, managed-mcp.json, MCP allowlist/denylist, permission deny rules, sandbox enforcement, hooks system, no model training on data.
