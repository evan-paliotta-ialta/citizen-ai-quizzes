# Citizen AI Engineer: Driving Zones Framework

**Date:** 2026-03-02

---

## The Analogy

AI usage tiers map to driving zones. The **data you're working with** and **whether you're connecting to live systems** determine your zone. No gray areas.

---

## Zone 1: Private Property
*Your own driveway. No license required, just common sense.*

**What it covers:** Asking Claude questions where no company data enters the conversation.

**Hard criteria - ALL must be true:**
- Data is publicly available (could find it on Google)
- No company names, client names, project names, or internal terminology
- No code from any company repo
- No MCP servers connected
- Output is for your own learning/reference only

**Examples:** "Explain how OAuth works," "Write me a Python sorting algorithm," "Help me draft a generic meeting agenda template"

**Process:** No governance required, but commit to a GitHub repo anyway. Highlander tracks all citizen activity — even Zone 1 work counts toward your OKR picture and program participation record.

---

## Zone 2: Residential Streets
*Your neighborhood. License required. Speed limits, stop signs, seatbelt on.*

**What it covers:** Working with internal company data that is NOT confidential/restricted and does NOT contain PII or client data.

**Hard criteria - ALL must be true:**
- Data is classified Internal (not Confidential or Restricted)
- Zero PII (no names, emails, phone numbers, SSNs, etc.)
- Zero client/customer data of any kind
- No MCP servers connecting to production systems or databases
- Work is in a GitHub repo with branch protection enabled

**Examples:** Refactoring internal tooling code, writing internal documentation, generating test data with fake data, code review assistance on internal projects

**Process:**
- Must work in a GitHub repo (no local-only work)
- Standard CLAUDE.md guardrails active
- Branch protection enforced (no direct push to main)
- Code review required before merge
- Audit trail via git history

---

## Zone 3: The Highway
*High speed, high stakes. Full license, strict lane discipline, no exceptions.*

**What it covers:** ANY of these triggers Zone 3 - if even one is true, you're on the highway.

**Hard criteria - ANY ONE triggers this zone:**
- Data is classified Confidential or Restricted
- PII is present (even a single email address)
- Client/customer data is involved
- An MCP server connects to a live system (database, API, or any external service)
- Work touches production systems or infrastructure
- Output is a client deliverable
- Agentic workflows where Claude takes autonomous actions

**Examples:** Working with customer records, generating reports from live systems via MCP, modifying production infrastructure code, creating client-facing deliverables

**Process:**
- Everything from Zone 2, PLUS:
- GitHub repo with a clear description of the work in the commit message and METADATA.yaml
- Only pre-approved MCP servers (managed-mcp.json allowlist)
- Full audit logging via hooks (every command logged)
- Manager/lead review required
- Sandbox must be enabled

---

## No-Drive Zone (Zero Tolerance)
*Drunk driving. License revoked. No exceptions, no excuses.*

- Input credentials, API keys, secrets, or passwords into Claude
- Use a personal/consumer Claude account for any company work
- Disable sandbox, hooks, or guardrails
- Add unapproved MCP servers
- Push directly to main/production branches
- Store AI-assisted work only locally (must be in GitHub)
- Use AI for final decisions on employment, legal, or financial matters without human sign-off
- Input client data subject to NDAs without written client consent

**Violation consequence:** License revocation, escalation per company policy

---

## The Decision Flowchart

```
START: What data am I working with?
  |
  |-- Is ANY data Confidential/Restricted/PII/Client data?
  |     YES --> ZONE 3 (Highway)
  |     NO  |
  |         v
  |-- Is the data Internal (company, non-public)?
  |     YES --> ZONE 2 (Residential)
  |     NO  |
  |         v
  +-- Is it all publicly available information?
        YES --> ZONE 1 (Private Property)

OVERRIDE: Using an MCP server that connects to live systems?
  --> Automatically ZONE 3, regardless of data classification
```

No gray areas. The data determines the zone. MCP servers connecting to live systems are an automatic escalation.
