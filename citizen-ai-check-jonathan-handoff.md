# Citizen AI Check — Highlander Integration Handoff

**From:** Evan Paliotta  
**To:** Jonathan  
**Date:** 2026-04-22  
**Purpose:** Everything you need to integrate the `/citizen-ai-check` skill into your workflow or Highlander — pick any of the three options below and you'll have what you need to execute it independently.

---

## What This Does

The `citizen-ai-check` skill checks whether any iAltA staff member has passed all **16 Citizen AI module quizzes + the Final Exam** before I issue them a Claude Desktop license.

Given a name or email address, it:

1. Authenticates against iAltA's Microsoft 365 tenant
2. Queries the Microsoft Forms API for all 17 assessments simultaneously
3. Finds the participant's responses by name or email match
4. Returns a formatted report showing pass/fail status per module, scores, and attempt counts
5. Delivers a final **READY / NOT READY** verdict

**Pass rules:**
- Modules 1–12, 14–16: any attempt on record counts (no minimum score)
- Module 13 (Safety): must score **4/4 perfect** — special governance requirement
- Final Exam: must score **≥ 20/25 (80%)**

**Sample output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CITIZEN AI COURSE COMPLETION REPORT
 Participant: Jane Smith (jane.smith@ialta.com)
 Checked: 2026-04-22
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUIZZES (pass = any attempt; ⚠ M13 = 4/4 required)

 #   Module                        Latest   Attempts  Status
 1   What Claude Is (and Isn't)    4/4      2         ✓
 2   How the Model Was Built       3/4      1         ✓
 3   Tokens                        4/4      1         ✓
 ...
 13  Safety                        4/4      1         ✓ PERFECT
 ...
 16  Databases                     4/4      1         ✓

FINAL EXAM (pass = 20/25, 80%)
     Score: 23/25   Attempts: 2   ✓ PASSED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VERDICT: ✓ READY — issue license
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Prerequisites (Required for All Options)

Before choosing a path, confirm you have the following. These are blockers — no option works without them.

### 1. iAltA Microsoft 365 Account

You need an active account on the **iAltA tenant** (not Helm). The quizzes and final exam live in iAltA's Microsoft Forms, tied to the iAltA SharePoint site.

- **Tenant:** `ialta` (login at `ialta.sharepoint.com`)
- **Required:** A user account with access to Microsoft Forms responses for the Citizen AI forms
- **Verify access:** Try opening any of the form response URLs in the [Form Access Verification](#form-access-verification) section below while logged into your iAltA account

If you don't have an iAltA M365 account or can't see the form responses, Evan needs to grant you Forms owner/co-owner access on each form, or add you as a site member on the CitizenAI SharePoint site.

### 2. Access to the 17 Microsoft Forms

The skill queries 17 forms (16 module quizzes + 1 Final Exam). You need to be able to view **responses** on each form — not just submit answers.

**Quick access check:** Log into your iAltA account and open this URL. If you can see a table of submitted responses (not just the quiz questions), you're good:
```
https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMTRDVURBUVdKSE1BQ1I5WkxSTUhVNlNDRi4u
```
*(This is Module 1. If it works, the others will too since they're all on the same iAltA account.)*

If you see "You don't have permission," ask Evan to add you as a co-owner on the Citizen AI forms.

### 3. Playwright MCP (Options A and B only)

Options A and B use Playwright browser automation to authenticate. Option C (MCP server) eliminates this dependency but requires more setup upfront.

- Playwright MCP must be in your Claude Code MCP allowlist
- The Playwright browser must be signed into your iAltA M365 account before running the skill
- Highlander already uses Playwright (Dragon pipeline) — if it's active in your environment, you're set

**To verify Playwright MCP is active in your Claude Code session:**
```
/mcp
```
Look for a Playwright entry in the list.

---

## Option A: Claude Code Skill (Recommended Starting Point)

**Effort:** ~15 minutes  
**Prerequisites:** iAltA M365 account + form access + Playwright MCP active  
**How it runs:** You invoke `/citizen-ai-check [name]` from any Claude Code session  
**No code changes to Highlander required**

### Setup

**For your personal Claude Code (works anywhere):**

1. Create the commands directory if it doesn't exist:
   ```
   mkdir -p ~/.claude/commands
   ```

2. Save the skill file (full content in the [Skill File section](#the-skill-file) below) as:
   ```
   ~/.claude/commands/citizen-ai-check.md
   ```

3. Restart Claude Code.

4. Run it:
   ```
   /citizen-ai-check Jane Smith
   /citizen-ai-check jane.smith@ialta.com
   ```

**To add it to the Highlander repo (so the whole team can use it):**

1. Create the file at:
   ```
   .claude/commands/citizen-ai-check.md
   ```

2. Commit and push. Anyone working in the repo with Claude Code can then invoke `/citizen-ai-check`.

### Runtime behavior

When you invoke the skill, Claude will:
1. Open a Playwright browser and navigate to `https://forms.office.com`
2. Extract the session auth token from `window.OfficeFormServerInfo` (no password prompt — uses your existing browser session)
3. Query all 17 forms in parallel via the Forms API
4. Match the participant by name or email (case-insensitive partial match)
5. Return the formatted report

**If the browser isn't logged in:** Claude will prompt you to log into your iAltA account in the Playwright browser. This is a one-time step per session.

---

## Option B: Python Script (CLI or Highlander UI Route)

**Effort:** 1–2 days  
**Prerequisites:** iAltA M365 account + form access + Playwright installed  
**How it runs:** CLI (`python scripts/citizen_ai_checker.py "Jane Smith"`) or wired into a Highlander UI route  
**Follows the existing Dragon/Delio Playwright pattern in Highlander**

This approach packages the same logic as a proper Python script — useful if you want to call it programmatically, add it as a Highlander UI endpoint, or run it on a schedule to snapshot enrollment status.

### Implementation sketch

Create `scripts/citizen_ai_checker.py` following the `dragon_delio_fetch.py` pattern:

```python
import os
import sys
import json
import httpx
from pathlib import Path
from playwright.sync_api import sync_playwright

FORMS = [
    {"module": 1,  "title": "What Claude Is (and Isn't)",    "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMTRDVURBUVdKSE1BQ1I5WkxSTUhVNlNDRi4u", "max_pts": 4},
    {"module": 2,  "title": "How the Model Was Built",        "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMUtKTUMzT1pBNUdGOERTUVFZQVlPWjI4Ri4u", "max_pts": 4},
    {"module": 3,  "title": "Tokens",                         "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UOU9aR1k1UFRKQlMwWDNBVjkySUVYN1VMMC4u", "max_pts": 4},
    {"module": 4,  "title": "Context Window",                 "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNlo4MlBVNDZWN1BITTZaMDZMVlhITUtLTy4u", "max_pts": 4},
    {"module": 5,  "title": "Specificity",                    "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMVVDQVJDNlFIR0pTWTRXU1ZPVkdEN1BWQy4u", "max_pts": 4},
    {"module": 6,  "title": "Anatomy of a Good Prompt",       "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UQldXR1M5UjBTQTNYMzZNVThHT0RBUFBZVy4u", "max_pts": 4},
    {"module": 7,  "title": "Iteration & Examples",           "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNU5DMEIyTDQzSlZSU0Q5Tk1HOVZNNlVVSi4u", "max_pts": 4},
    {"module": 8,  "title": "Tips & Tricks",                  "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNFpQVkFHVDRWT0I3SDNaMUcyQVJWWDlZUi4u", "max_pts": 4},
    {"module": 9,  "title": "Operating Framework",            "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UOVMxMkdNVUhOWDdXQUdQU0lWOTNQRkFWWi4u", "max_pts": 4},
    {"module": 10, "title": "Claude Desktop Projects",        "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1URTIyQ0ZVSTVBTjFHUUJOR1dNU05MN0VVOS4u", "max_pts": 4},
    {"module": 11, "title": "Documents & Multimodal",         "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNDVHRFkyWjA0SklaT0FFNjlFM0g5WTlNWS4u", "max_pts": 4},
    {"module": 12, "title": "Claude for Your Team",           "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UQlVDR08wVFFHNEJEQkpKQk9YOTFaRkFJQS4u", "max_pts": 4},
    {"module": 13, "title": "Safety",                         "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNUhGOVRDWTFDNVkwM1VTNUc1SklXSDgxVS4u", "max_pts": 4, "perfect_required": True},
    {"module": 14, "title": "MCP, Agents & RAG",              "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMVJITEkwMDMxQkFYQ0E4NDRJMVI5TUhXNy4u", "max_pts": 4},
    {"module": 15, "title": "GitHub",                         "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMDBHTlpOQlRQVzBXNTU4UFRENE1HU1hXRi4u", "max_pts": 4},
    {"module": 16, "title": "Databases",                      "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1URFpMRU5DWVNSQzJFSjBCQkoxWUJZWE4wSy4u", "max_pts": 4},
    {"module": "F","title": "Final Exam",                     "id": "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNFJMUk84RU9CUkVPS1lLNjMwUU1FNVIxRS4u", "max_pts": 25, "pass_threshold": 20},
]

def get_auth_tokens(page):
    return page.evaluate("""
        () => {
            const info = window.OfficeFormServerInfo;
            const userInfo = typeof info.userInfo === 'string'
                ? JSON.parse(info.userInfo) : info.userInfo;
            return {
                token: info.antiForgeryToken,
                tenantId: userInfo.TenantId,
                userId: userInfo.UserId
            };
        }
    """)

def query_form_responses(auth, form_id, search_term):
    url = (
        f"https://forms.office.com/formapi/api/{auth['tenantId']}"
        f"/users/{auth['userId']}/forms('{form_id}')/responses"
    )
    headers = {
        "__RequestVerificationToken": auth["token"],
        "Accept": "application/json",
    }
    resp = httpx.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    responses = resp.json().get("value", [])
    term = search_term.lower()
    matches = [
        r for r in responses
        if term in (r.get("responderName") or "").lower()
        or term in (r.get("email") or "").lower()
    ]
    if not matches:
        return None
    latest = sorted(matches, key=lambda r: r.get("submitDate", ""), reverse=True)[0]
    return latest

def check_participant(search_term: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_context(viewport={"width": 1400, "height": 900}).new_page()
        page.goto("https://forms.office.com", timeout=30000)
        page.wait_for_load_state("networkidle")
        auth = get_auth_tokens(page)
        browser.close()

    results = []
    for form in FORMS:
        response = query_form_responses(auth, form["id"], search_term)
        results.append({"form": form, "response": response})

    return results

if __name__ == "__main__":
    search = " ".join(sys.argv[1:])
    if not search:
        print("Usage: python citizen_ai_checker.py <name or email>")
        sys.exit(1)
    results = check_participant(search)
    print(json.dumps(results, indent=2, default=str))
```

### To wire into Highlander UI

Add a route in `apps/highlander-ui/app_next.py`:

```python
from scripts.citizen_ai_checker import check_participant

@app.post("/citizen-ai/check")
async def citizen_ai_check(search: str):
    results = check_participant(search)
    # Format and return
    return JSONResponse(results)
```

### Auth note

The script uses the same browser-session token extraction approach as Dragon (`dragon_delio_fetch.py` extracts Delio JWTs the same way). The Playwright browser must be signed into an iAltA M365 account. If running headless in a server context, you'll need to pre-capture a Playwright `storageState` session file (same pattern as the Citizen AI `playwright/auth/auth.json` file) and pass it via `browser.new_context(storage_state="auth.json")`.

---

## Option C: M365 MCP Server Tool (No Browser Session Required)

**Effort:** 3–5 days  
**Prerequisites:** Azure AD app registration on iAltA tenant with Forms permissions + AWS Secrets Manager entry  
**How it runs:** As a tool in `apps/m365-mcp-server/` — callable by Claude or any Highlander service  
**Eliminates the Playwright browser dependency entirely**

This is the cleanest long-term integration. Instead of a browser session, it uses a service principal (Azure AD app registration) to call the Microsoft Forms API server-to-server. Highlander already uses this pattern for SharePoint and Teams access in the `apps/m365-mcp-server/`.

### Prerequisites for Option C

**Step 1: Azure AD app registration on iAltA tenant**

Someone with iAltA Azure AD admin access needs to:

1. Go to [portal.azure.com](https://portal.azure.com) → Azure Active Directory → App registrations → New registration
2. Name: `highlander-forms-reader` (or similar)
3. Add API permission: `Microsoft Graph` → Delegated → `Forms.Read.All` (or check if this scope exists — Microsoft Graph Forms API coverage is limited; may need `Sites.Read.All` instead)
4. Grant admin consent
5. Create a client secret
6. Note: `tenant_id`, `client_id`, `client_secret`

> **Important caveat:** Microsoft Graph's Forms API is not fully documented and has limited coverage. The `/formapi/api/` endpoint used in Options A and B is an internal Microsoft Forms endpoint that requires a browser session. If Graph doesn't expose Forms responses directly, Option C may need to use a delegated auth flow (user signs in once, refresh token stored) rather than a pure service principal approach. Recommend testing Option A first to confirm the Forms API structure before committing to Option C.

**Step 2: Store credentials in AWS Secrets Manager**

Follow the existing Highlander pattern:
```
/prod/highlander/m365/ialta/{tenant_id}
/prod/highlander/m365/ialta/{client_id}
/prod/highlander/m365/ialta/{client_secret}
```

**Step 3: Add tool to `apps/m365-mcp-server/server.py`**

```python
@mcp.tool()
def check_citizen_ai_completion(
    search_term: str,
    opco_id: str = "ialta",
) -> dict:
    """
    Check whether a participant has passed all Citizen AI quizzes and Final Exam.
    Args:
        search_term: Participant name or email address (partial match supported)
        opco_id: Operating company ID (default: ialta)
    Returns:
        Completion report with pass/fail per module and overall verdict
    """
    auth = M365Auth(opco_id=opco_id)
    token = auth.get_token()
    # Query all 17 forms via Graph or formapi
    # Return structured results
    ...
```

---

## The Skill File

This is the complete Claude Code skill. For **Option A**, save this entire block as `~/.claude/commands/citizen-ai-check.md` (personal) or `.claude/commands/citizen-ai-check.md` (Highlander repo).

```markdown
---
description: Check a Citizen AI course participant's quiz and exam results before issuing a Claude license. Usage: /citizen-ai-check [name or email]
argument-hint: "[name or email of the participant to check]"
---

# Citizen AI Course Completion Check

You are helping verify whether a course participant has passed all required quizzes and the Final Exam before issuing a Claude Desktop license.

## What to do

The argument provided is the participant's **name or email** to look up. If no argument is given, ask for it before proceeding.

Use the Playwright MCP browser to run the following steps.

### Step 1 — Navigate to Forms

Navigate to `https://forms.office.com` and wait for the page to load fully.

### Step 2 — Extract auth token

Run this in the browser:
```js
const info = window.OfficeFormServerInfo;
const userInfo = typeof info.userInfo === 'string' ? JSON.parse(info.userInfo) : info.userInfo;
return { token: info.antiForgeryToken, tenantId: userInfo.TenantId, userId: userInfo.UserId };
```

### Step 3 — Query all 17 forms for this participant

Run a single browser evaluate that:
1. Uses the token/tenantId/userId from Step 2
2. Queries all 17 forms (16 quizzes + final exam) for responses
3. For each form, finds all responses matching the search name/email (case-insensitive partial match on responderName or email)
4. Returns the latest score, total attempts, and last submission date per form

Use these form IDs:

```js
const forms = [
  { module: 1,  title: "Module 1: What Claude Is (and Isn't)",        id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMTRDVURBUVdKSE1BQ1I5WkxSTUhVNlNDRi4u", maxPts: 4 },
  { module: 2,  title: "Module 2: How the Model Was Built",           id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMUtKTUMzT1pBNUdGOERTUVFZQVlPWjI4Ri4u", maxPts: 4 },
  { module: 3,  title: "Module 3: Tokens",                            id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UOU9aR1k1UFRKQlMwWDNBVjkySUVYN1VMMC4u", maxPts: 4 },
  { module: 4,  title: "Module 4: Context Window",                    id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNlo4MlBVNDZWN1BITTZaMDZMVlhITUtLTy4u", maxPts: 4 },
  { module: 5,  title: "Module 5: Specificity",                       id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMVVDQVJDNlFIR0pTWTRXU1ZPVkdEN1BWQy4u", maxPts: 4 },
  { module: 6,  title: "Module 6: Anatomy of a Good Prompt",          id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UQldXR1M5UjBTQTNYMzZNVThHT0RBUFBZVy4u", maxPts: 4 },
  { module: 7,  title: "Module 7: Iteration & Examples",              id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNU5DMEIyTDQzSlZSU0Q5Tk1HOVZNNlVVSi4u", maxPts: 4 },
  { module: 8,  title: "Module 8: Tips & Tricks",                     id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNFpQVkFHVDRWT0I3SDNaMUcyQVJWWDlZUi4u", maxPts: 4 },
  { module: 9,  title: "Module 9: Operating Framework",               id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UOVMxMkdNVUhOWDdXQUdQU0lWOTNQRkFWWi4u", maxPts: 4 },
  { module: 10, title: "Module 10: Claude Desktop Projects",          id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1URTIyQ0ZVSTVBTjFHUUJOR1dNU05MN0VVOS4u", maxPts: 4 },
  { module: 11, title: "Module 11: Documents & Multimodal",           id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNDVHRFkyWjA0SklaT0FFNjlFM0g5WTlNWS4u", maxPts: 4 },
  { module: 12, title: "Module 12: Claude for Your Team",             id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UQlVDR08wVFFHNEJEQkpKQk9YOTFaRkFJQS4u", maxPts: 4 },
  { module: 13, title: "Module 13: Safety ⚠ PERFECT REQUIRED",       id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNUhGOVRDWTFDNVkwM1VTNUc1SklXSDgxVS4u", maxPts: 4, perfectRequired: true },
  { module: 14, title: "Module 14: MCP, Agents & RAG",                id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMVJITEkwMDMxQkFYQ0E4NDRJMVI5TUhXNy4u", maxPts: 4 },
  { module: 15, title: "Module 15: GitHub",                           id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMDBHTlpOQlRQVzBXNTU4UFRENE1HU1hXRi4u", maxPts: 4 },
  { module: 16, title: "Module 16: Databases",                        id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1URFpMRU5DWVNSQzJFSjBCQkoxWUJZWE4wSy4u", maxPts: 4 },
  { module: "F",title: "Final Exam",                                  id: "emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNFJMUk84RU9CUkVPS1lLNjMwUU1FNVIxRS4u", maxPts: 25, passThreshold: 20 },
];
```

For each form, fetch:
```
GET /formapi/api/{tenantId}/users/{userId}/forms('{formId}')/responses
```

Filter responses where `responderName` or `email` contains the search term (case-insensitive). Then take the response with the **latest** `submitDate` for scoring.

Note: The responses API may not return `score` directly. If needed, fetch individual response details. If score data isn't available in the list, use the count of correct answers visible in the response data.

The Final Exam is 25 multiple choice questions only. Pass threshold is 20/25 (80%).

### Step 4 — Format and display the report

Output the results as a clean report in this format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CITIZEN AI COURSE COMPLETION REPORT
 Participant: [Name] ([email if found])
 Checked: [today's date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUIZZES (pass = any attempt on record; ⚠ M13 = 4/4 required)

 #   Module                        Latest   Attempts  Status
 1   What Claude Is (and Isn't)    4/4      2         ✓
 2   How the Model Was Built       —        0         ✗ NOT TAKEN
 ...
 13  Safety                        4/4      1         ✓ PERFECT
 ...

FINAL EXAM (pass = 20/25, 80%)
     Score: 24/25   Attempts: 1   ✓ PASSED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VERDICT: ✓ READY — issue license
  (or list specific blockers if not ready)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Pass rules:**
- Quizzes 1–12, 14–16: at least one submission on record (score shown for reference)
- Quiz 13 (Safety): latest score must be 4/4
- Final Exam: latest score must be ≥ 20/25 (80%)

If the participant has not taken a quiz, show "— NOT TAKEN" and flag it as a blocker.

If no responses are found for the participant at all, say so clearly and suggest checking the spelling of the name or email.

## Important notes

- Always navigate to forms.office.com BEFORE making any formapi calls (auth is browser-session based)
- Use `window.OfficeFormServerInfo.antiForgeryToken` for the `__RequestVerificationToken` header
- The tenantId and userId are embedded in `window.OfficeFormServerInfo.userInfo`
- If a form returns 0 responses but the participant claims they submitted, check whether they used a different email
- This skill does NOT issue the license — it only confirms readiness. Evan issues the license manually in the Claude Teams admin console
```

---

## Form Access Verification

Use these links to verify you can see form responses (must be logged into iAltA M365 account):

| # | Module | Response View URL |
|---|--------|-------------------|
| 1 | What Claude Is (and Isn't) | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMTRDVURBUVdKSE1BQ1I5WkxSTUhVNlNDRi4u |
| 2 | How the Model Was Built | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMUtKTUMzT1pBNUdGOERTUVFZQVlPWjI4Ri4u |
| 3 | Tokens | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UOU9aR1k1UFRKQlMwWDNBVjkySUVYN1VMMC4u |
| 4 | Context Window | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNlo4MlBVNDZWN1BITTZaMDZMVlhITUtLTy4u |
| 5 | Specificity | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMVVDQVJDNlFIR0pTWTRXU1ZPVkdEN1BWQy4u |
| 6 | Anatomy of a Good Prompt | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UQldXR1M5UjBTQTNYMzZNVThHT0RBUFBZVy4u |
| 7 | Iteration & Examples | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNU5DMEIyTDQzSlZSU0Q5Tk1HOVZNNlVVSi4u |
| 8 | Tips & Tricks | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNFpQVkFHVDRWT0I3SDNaMUcyQVJWWDlZUi4u |
| 9 | Operating Framework | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UOVMxMkdNVUhOWDdXQUdQU0lWOTNQRkFWWi4u |
| 10 | Claude Desktop Projects | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1URTIyQ0ZVSTVBTjFHUUJOR1dNU05MN0VVOS4u |
| 11 | Documents & Multimodal | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNDVHRFkyWjA0SklaT0FFNjlFM0g5WTlNWS4u |
| 12 | Claude for Your Team | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UQlVDR08wVFFHNEJEQkpKQk9YOTFaRkFJQS4u |
| 13 | Safety ⚠ | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNUhGOVRDWTFDNVkwM1VTNUc1SklXSDgxVS4u |
| 14 | MCP, Agents & RAG | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMVJITEkwMDMxQkFYQ0E4NDRJMVI5TUhXNy4u |
| 15 | GitHub | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UMDBHTlpOQlRQVzBXNTU4UFRENE1HU1hXRi4u |
| 16 | Databases | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1URFpMRU5DWVNSQzJFSjBCQkoxWUJZWE4wSy4u |
| F | **Final Exam** | https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UNFJMUk84RU9CUkVPS1lLNjMwUU1FNVIxRS4u |

If any of these return a "You don't have permission" error, ping Evan to add you as a co-owner on that form.

---

## Decision Guide

| | Option A (Claude Code Skill) | Option B (Python Script) | Option C (MCP Server Tool) |
|---|---|---|---|
| **Setup time** | 15 min | 1–2 days | 3–5 days |
| **Requires Playwright MCP** | Yes | Yes (headless) | No |
| **Requires iAltA M365 login** | Yes (browser session) | Yes (session or saved auth) | No (service principal) |
| **Callable from Highlander UI** | No | Yes | Yes |
| **Works without browser** | No | Partially (with saved session) | Yes |
| **Best for** | Quick personal use | Programmatic / scheduled | Clean long-term integration |
| **Fits existing Highlander pattern** | `.claude/skills/` | `scripts/dragon/` pattern | `apps/m365-mcp-server/` |

**Recommendation:** Start with Option A to validate the approach and confirm form access works. Upgrade to B or C based on how often it gets used and whether you want it surfaced in the Highlander UI.

---

*This document was generated 2026-04-22. Form IDs are stable as long as the Microsoft Forms aren't recreated. The auth approach (browser session token) is consistent with how Highlander's Dragon pipeline authenticates with Delio.*
