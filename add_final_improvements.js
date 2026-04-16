/**
 * add_final_improvements.js
 *
 * Two final course improvements based on gap analysis + external research:
 *
 * 1. Add financial services compliance section to Module 13 (Safety)
 *    — GLBA data handling, regulatory output rules, audit trail requirements
 *
 * 2. Create a "Prompt Library" support page — all role-specific prompts
 *    from Module 12 in one browsable reference, plus cross-module prompt templates
 *
 * Run: node add_final_improvements.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

async function getPageCanvas(page, pageId) {
  return page.evaluate(async ({ siteUrl, pageId }) => {
    const r = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})?$select=Id,Title,CanvasContent1`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const d = await r.json();
    try { return JSON.parse(d.d.CanvasContent1 || '[]'); }
    catch { return []; }
  }, { siteUrl: SITE_URL, pageId });
}

async function savePage(page, pageId, newCanvas) {
  return page.evaluate(async ({ siteUrl, pageId, newCanvas }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;
    await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
        'X-HTTP-Method': 'MERGE',
        'IF-MATCH': '*',
      },
      body: JSON.stringify({
        __metadata: { type: 'SP.Publishing.SitePage' },
        CanvasContent1: JSON.stringify(newCanvas),
      }),
    });
    if (!saveRes.ok) return { status: `save_failed_${saveRes.status}` };
    const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}` };
  }, { siteUrl: SITE_URL, pageId, newCanvas });
}

// ─── 1. Add financial services compliance section to Module 13 ─────────────────
async function addFinServComplianceToModule13(page) {
  log('Adding financial services compliance section to Module 13...');
  const canvas = await getPageCanvas(page, 13);

  const fsSection = `
<hr/>
<h2>Financial Services Compliance — iAltA-Specific Rules</h2>
<p>The rules below apply at iAltA specifically. They are derived from our regulatory environment and legal obligations. If general data hygiene is the common-sense layer, this is the legal layer.</p>

<h3>GLBA — Gramm-Leach-Bliley Act</h3>
<p>GLBA requires financial institutions to protect the privacy and security of customer financial information. For AI use, this means:</p>
<ul>
  <li><strong>Never paste client NPI (Non-Public Personal Information) into Claude.</strong> NPI includes names combined with financial account numbers, investment holdings, net worth, portfolio data, or any personally identifiable financial information.</li>
  <li>Working on a client analysis? Anonymize the data first — strip names and account identifiers before asking Claude to help. Claude does not need to know whose portfolio it is to help you analyze it.</li>
  <li>If a task requires Claude to process actual client NPI, that is Zone 3. Stop. Get explicit approval before proceeding.</li>
</ul>

<h3>AI Output in Client-Facing Materials</h3>
<p>Claude can generate content that goes to clients — with the right workflow:</p>
<ol>
  <li><strong>Never send AI-generated content to a client without human review.</strong> Review means reading it, not just scanning it. This is both a quality standard and a regulatory requirement under the supervision rules for investment advisory communication.</li>
  <li><strong>Any specific figures, statistics, or market data in Claude's output must be independently verified</strong> before appearing in client communications. Claude can hallucinate plausible-sounding statistics. In financial services, a hallucinated statistic in a client document is a material risk.</li>
  <li><strong>Investment-related recommendations or analyses</strong> produced with Claude's help must be reviewed by a licensed representative before use. Claude is a drafting and analysis tool — it is not licensed, and its output is not advice.</li>
</ol>

<h3>Audit Trail and Record Retention</h3>
<p>Claude conversations are not automatically preserved as business records. If you use Claude to produce a work product that becomes a business record (a client memo, a proposal, a compliance report), the record is the final document — not the Claude conversation that helped you produce it.</p>
<ul>
  <li>Save your final outputs in the appropriate system of record (SharePoint, HubSpot, email).</li>
  <li>Do not rely on Claude conversation history as documentation. Conversations can be cleared and are not retained indefinitely.</li>
  <li>If Highlander tracks your GitHub commits, the commit history is a record of your AI-assisted work activity — maintain it.</li>
</ul>

<h3>Data Classification Quick Reference</h3>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <thead>
    <tr style="background-color:#000D2D;color:white;">
      <th style="padding:10px;border:1px solid #ccc;">Data Type</th>
      <th style="padding:10px;border:1px solid #ccc;">Can Claude See It?</th>
      <th style="padding:10px;border:1px solid #ccc;">Requirements</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color:#e8f0fe;">
      <td style="padding:10px;border:1px solid #ccc;">Public market data, industry reports, public filings</td>
      <td style="padding:10px;border:1px solid #ccc;color:green;font-weight:700;">Yes — Zone 1</td>
      <td style="padding:10px;border:1px solid #ccc;">No restrictions. Commit work to GitHub.</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #ccc;">Internal memos, meeting notes, team processes, internal analytics</td>
      <td style="padding:10px;border:1px solid #ccc;color:#e08000;font-weight:700;">Yes — Zone 2</td>
      <td style="padding:10px;border:1px solid #ccc;">GitHub repo required. Be thoughtful about what is pasted.</td>
    </tr>
    <tr style="background-color:#fff8e8;">
      <td style="padding:10px;border:1px solid #ccc;">Client names + financial data, deal terms, NDA-protected information, AUM figures</td>
      <td style="padding:10px;border:1px solid #ccc;color:#cc6600;font-weight:700;">Anonymized only — Zone 3</td>
      <td style="padding:10px;border:1px solid #ccc;">Strip identifiers first. Manager review required before any output is used externally.</td>
    </tr>
    <tr style="background-color:#fde8e8;">
      <td style="padding:10px;border:1px solid #ccc;">Client NPI with identifiers, regulatory filings in draft, credentials/API keys</td>
      <td style="padding:10px;border:1px solid #ccc;color:red;font-weight:700;">No — No-Drive Zone</td>
      <td style="padding:10px;border:1px solid #ccc;">Do not paste. Violation triggers immediate license review.</td>
    </tr>
  </tbody>
</table>
<p style="color:#555;font-size:13px;font-style:italic;">Questions about whether specific data qualifies? Ask IT Security or the program administrator before proceeding — not after.</p>
`;

  const lastBlock = canvas[canvas.length - 1];
  if (lastBlock && lastBlock.innerHTML !== undefined) {
    if (!lastBlock.innerHTML.includes('Financial Services Compliance')) {
      lastBlock.innerHTML += fsSection;
    } else {
      log('Module 13 already has FS compliance section — skipping.');
      return { status: 'already_exists' };
    }
  }

  return savePage(page, 13, canvas);
}

// ─── 2. Create Prompt Library page ────────────────────────────────────────────
async function createPromptLibrary(page) {
  log('Creating Prompt Library page...');

  const existing = await page.evaluate(async (siteUrl) => {
    const r = await fetch(`${siteUrl}/_api/sitepages/pages?$select=Id,Title&$filter=Title eq 'Prompt Library'`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const d = await r.json();
    return d.d.results.length > 0 ? d.d.results[0].Id : null;
  }, SITE_URL);

  if (existing) {
    log(`Prompt Library already exists (ID ${existing})`);
    return { status: 'already_exists', id: existing };
  }

  const html = `
<h1>Prompt Library — Citizen AI Developer Program</h1>
<p style="font-size:16px;">A living reference of proven prompts for iAltA work. Bookmark this page. Add your own via the Teams channel.</p>
<p style="color:#555;font-size:13px;border-left:3px solid #0042E0;padding:8px 12px;background:#f0f4ff;">
  <strong>How to use these:</strong> Copy the prompt, replace anything in [brackets] with your actual context, and run it. The more specific you make the bracketed fields, the better the output. These are starting points — iterate from them.
</p>

<hr/>

<h2>Universal — Works in Any Function</h2>

<h3>The Clarifying Question Prompt</h3>
<p>Use this before any complex task to surface ambiguities before wasting time on a misdirected response.</p>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
I'm about to give you a complex task. Before you begin, ask me up to three clarifying questions that, if answered, would most improve the quality of your output. Do not attempt the task yet — just ask the questions.
</blockquote>

<h3>The Expert Reviewer</h3>
<p>Have Claude critique a draft from a specific expert perspective.</p>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
You are a [senior partner at a top-tier consulting firm / experienced CFO / seasoned investor]. Review the following [document/proposal/analysis] and give me your honest critical assessment. What's weak, what's missing, what would you change? Be direct — I want your sharpest feedback, not validation.

[Paste content]
</blockquote>

<h3>The Handoff Brief</h3>
<p>Generate a context brief to start a new session or hand a task to a colleague.</p>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
Write a concise handoff brief summarizing: the context of what we've been working on, the key decisions made so far, any constraints established, where we left off, and exactly what needs to happen next. Someone should be able to paste this into a new conversation and continue seamlessly.
</blockquote>

<h3>The Structured Output Extractor</h3>
<p>Turn unstructured text (meeting notes, emails, documents) into structured data.</p>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
Extract the following from the text below and return as a structured list:
- Action items (owner, action, deadline if mentioned)
- Key decisions made
- Open questions that were not resolved
- Next meeting date/agenda if mentioned

Text: [paste content]
</blockquote>

<hr/>

<h2>Sales</h2>

<h3>Call Notes → CRM Update</h3>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
You are a sales operations specialist. Convert the following call notes into a structured CRM update with these fields: Company, Contact, Call date, Key discussion points (3 bullets max), Identified needs/pain points, Next steps, Deal stage assessment, Follow-up required by [date].

Call notes: [paste notes]
</blockquote>

<h3>Follow-Up Email from Call Notes</h3>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
Write a follow-up email to [prospect name] at [company] after a [type of call — intro/demo/proposal]. Tone: direct and professional, not salesy. Reference the specific things they mentioned: [key points they raised]. Close with the agreed next step: [next step]. Keep it under 150 words.
</blockquote>

<h3>Competitive Intel Summary</h3>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
You are a competitive intelligence analyst. Based on the following information [paste: website content, press releases, job postings, news], give me: (1) their apparent product positioning, (2) their likely target customer, (3) how they differentiate from us based on messaging, (4) any signals about where they're investing. Note any gaps in your analysis — I'll provide more sources.
</blockquote>

<hr/>

<h2>Client Success / Account Management</h2>

<h3>NPS Response Analysis</h3>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
Analyze the following NPS survey responses. Give me: (1) the top 3 themes in positive responses, (2) the top 3 themes in negative/critical responses, (3) any responses that suggest urgent action is needed — flag these separately, (4) one recommended action based on the patterns you see.

Responses: [paste]
</blockquote>

<h3>QBR Prep from Account Data</h3>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
I'm preparing for a quarterly business review with [client name]. Based on the data below [paste: usage metrics, support tickets, key interactions], help me: (1) identify the narrative of this quarter (what went well, what didn't), (2) anticipate the questions they're likely to raise, (3) draft three talking points that strengthen the relationship and set up renewal.
</blockquote>

<hr/>

<h2>Marketing</h2>

<h3>Campaign Brief Generator</h3>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
You are a senior marketing strategist for an alternative investment data platform. Write a campaign brief for: [campaign name]. Target audience: [describe]. Core message: [describe]. Channel: [LinkedIn/email/paid/event]. Campaign goal: [awareness/leads/engagement]. Tone: direct, data-driven, no jargon. Output: objective, audience, key messages (3), call to action, success metrics.
</blockquote>

<h3>Content Repurposing</h3>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
Take the following [blog post/report/presentation] and repurpose it into: (1) a 3-tweet thread, (2) a LinkedIn post under 200 words, (3) a 3-sentence email teaser for a newsletter. Maintain the core insight in each. Tone: [describe]. Do not dilute the main point to make it more palatable — keep the sharpest claim front and center.

Source content: [paste]
</blockquote>

<hr/>

<h2>Operations / Finance / Analysis</h2>

<h3>Document Analysis Template</h3>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
Analyze the following [contract/report/filing/document] and give me: (1) the key terms/obligations I should be aware of, (2) anything unusual or that deviates from standard practice, (3) any risks or open questions, (4) a plain-English summary in 3 sentences.

Document: [paste or attach]
</blockquote>

<h3>Process Documentation</h3>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
Based on the following description of how we currently [process/task], write a clear step-by-step process document. Include: who is responsible at each step, what inputs are needed, what the output should be, and any decision points where judgment is required. Write it so that a new employee could follow it on day one.

Current process description: [describe in your own words]
</blockquote>

<hr/>

<h2>Product / Engineering</h2>

<h3>Requirements to User Stories</h3>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
Convert the following product requirements into properly formatted user stories with acceptance criteria. For each story: As a [user type], I want [capability], so that [outcome]. Acceptance criteria: [list of testable conditions]. Flag any requirements that are ambiguous or could be interpreted multiple ways.

Requirements: [paste]
</blockquote>

<h3>Code Review Assistant</h3>
<blockquote style="background:#f9f9f9;border-left:4px solid #0042E0;padding:12px 16px;margin:8px 0;font-family:monospace;font-size:14px;">
Review the following code. Focus on: (1) correctness — does it do what the comments/intent suggest? (2) security — any obvious vulnerabilities? (3) readability — would a new engineer understand this in 6 months? (4) efficiency — any obvious performance issues? Be specific and actionable.

[paste code]
</blockquote>

<hr/>

<h2>Add Your Own</h2>
<p>Found a prompt that works consistently well? Post it in the <strong>Citizen AI Developer Program Teams channel</strong> with the tag <code>#promptlibrary</code> and the program administrator will add it here.</p>
<p style="color:#555;font-size:13px;">The prompt library grows as the program grows. The citizens who share what works build a competitive advantage for the whole team.</p>
`;

  const result = await page.evaluate(async ({ siteUrl, html }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    const createRes = await fetch(`${siteUrl}/_api/sitepages/pages`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      },
      body: JSON.stringify({
        __metadata: { type: 'SP.Publishing.SitePage' },
        Title: 'Prompt Library',
        FileName: 'Prompt-Library.aspx',
        PromotedState: 0,
      }),
    });
    if (!createRes.ok) {
      const t = await createRes.text();
      return { status: `create_failed_${createRes.status}`, error: t.slice(0, 200) };
    }
    const created = await createRes.json();
    const pageId = created.d.Id;

    const canvas = [{
      position: { zoneIndex: 1, sectionIndex: 1, sectionFactor: 12, layoutIndex: 1 },
      controlType: 4,
      id: 'prompt-library-content',
      innerHTML: html,
      editorType: 'CKEditor',
    }];

    await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
        'X-HTTP-Method': 'MERGE',
        'IF-MATCH': '*',
      },
      body: JSON.stringify({
        __metadata: { type: 'SP.Publishing.SitePage' },
        CanvasContent1: JSON.stringify(canvas),
      }),
    });
    if (!saveRes.ok) return { status: `save_failed_${saveRes.status}`, id: pageId };
    const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}`, id: pageId };
  }, { siteUrl: SITE_URL, html });

  log(`Prompt Library result: ${JSON.stringify(result)}`);
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_PATH, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  log('\n─── Module 13: Add Financial Services Compliance Section ───');
  const m13Result = await addFinServComplianceToModule13(page);
  log(`Result: ${JSON.stringify(m13Result)}`);

  log('\n─── Create Prompt Library Page ───');
  const plResult = await createPromptLibrary(page);
  log(`Result: ${JSON.stringify(plResult)}`);

  log('\n═══ DONE ═══');
  await browser.close();
})();
