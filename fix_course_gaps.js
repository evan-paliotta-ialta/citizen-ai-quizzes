/**
 * fix_course_gaps.js
 *
 * Fixes confirmed content and structural gaps in the Citizen AI Engineer course:
 *
 * 1. Delete API Test Page (ID 35)
 * 2. Rebuild Administrator Reference page with correct SharePoint list links
 * 3. Update Home page — add Module 0 to the course table (currently buried in footnotes)
 * 4. Create Capstone Guide page (Final Exam promises it; it doesn't exist)
 * 5. Update Module 9 — add explicit Driving Zones governance section to connect
 *    the task-delegation zones with the data governance framework
 *
 * Run: node fix_course_gaps.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

async function getDigest(page) {
  return page.evaluate(async (siteUrl) => {
    const r = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    return (await r.json()).d.GetContextWebInformation.FormDigestValue;
  }, SITE_URL);
}

// ─── 1. Delete a page ──────────────────────────────────────────────────────────
async function deletePage(page, pageId) {
  log(`Deleting page ID ${pageId}...`);
  return page.evaluate(async ({ siteUrl, pageId }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;
    const res = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose',
        'X-RequestDigest': digest,
        'X-HTTP-Method': 'DELETE',
        'IF-MATCH': '*',
      },
    });
    return { status: res.ok ? 'deleted' : `failed_${res.status}` };
  }, { siteUrl: SITE_URL, pageId });
}

// ─── Generic checkout → merge → publish ───────────────────────────────────────
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

// ─── 2. Rebuild Admin Reference page (ID 36) ──────────────────────────────────
async function fixAdminReferencePage(page) {
  log('Rebuilding Administrator Reference page...');

  const QUIZ_LIST_URL = `${SITE_URL}/Lists/Quiz%20Completions/AllItems.aspx`;
  const EXAM_LIST_URL = `${SITE_URL}/Lists/Final%20Exam%20Submissions/AllItems.aspx`;

  const newHtml = `
<h1>Program Administrator Reference</h1>
<p>This page is for program administrators only. It contains links to all submission trackers and program resources.</p>

<h2>Submission Lists</h2>
<p>All student submissions are stored as SharePoint lists within this site. Click each link to view, filter, and export submissions.</p>
<table style="width:100%;border-collapse:collapse;">
  <thead>
    <tr style="background-color:#000D2D;color:white;">
      <th style="padding:10px;text-align:left;border:1px solid #ccc;">Tracker</th>
      <th style="padding:10px;text-align:left;border:1px solid #ccc;">What It Contains</th>
      <th style="padding:10px;text-align:left;border:1px solid #ccc;">Link</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color:#f9f9f9;">
      <td style="padding:10px;border:1px solid #ccc;font-weight:700;">Quiz Completions</td>
      <td style="padding:10px;border:1px solid #ccc;">All 16 module quiz submissions — student name, module, team, key takeaway</td>
      <td style="padding:10px;border:1px solid #ccc;"><a href="${QUIZ_LIST_URL}" style="color:#0042E0;">View Quiz Completions →</a></td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #ccc;font-weight:700;">Final Exam Submissions</td>
      <td style="padding:10px;border:1px solid #ccc;">Final Exam entries — student name, team, Q1–Q25 answers, both practical submissions</td>
      <td style="padding:10px;border:1px solid #ccc;"><a href="${EXAM_LIST_URL}" style="color:#0042E0;">View Final Exam Submissions →</a></td>
    </tr>
  </tbody>
</table>

<h2>Grading the Final Exam</h2>
<p>The Final Exam has two components:</p>
<ol>
  <li><strong>Multiple Choice (Q1–Q25):</strong> Students paste their answers in the format <code>Q1:B, Q2:C, Q3:A...</code> in the Q1-to-Q25 Answers field. Mark each answer against the answer key in the Final Exam page. Passing = 20/25 (80%).</li>
  <li><strong>Practical 1 — Scenario Analysis:</strong> Students answer three questions about a competitive intelligence scenario. Evaluate: (a) correct Zone classification with justification, (b) a complete 5-element prompt, (c) a genuine risk and mitigation. No single right answer — use judgment.</li>
  <li><strong>Practical 2 — Project Setup:</strong> Students paste their Claude Desktop Project instructions. Evaluate: name + role + company context + communication style + at least two standing rules. Should feel genuinely personalized, not a copy of the example.</li>
</ol>
<p>When a student passes: issue their Claude Desktop license via the Teams admin portal. Send them the Day 1 Quick Start link.</p>

<h2>Answer Key — Final Exam Multiple Choice</h2>
<p><em>Section 1 (Q1–Q8):</em> Q1:B Q2:B Q3:C Q4:B Q5:D Q6:C Q7:A Q8:B</p>
<p><em>Section 2 (Q9–Q16):</em> Q9:C Q10:B Q11:B Q12:C Q13:B Q14:B Q15:C Q16:B</p>
<p><em>Section 3 (Q17–Q25):</em> Q17:B Q18:C Q19:B Q20:A Q21:C Q22:B Q23:B Q24:C Q25:B</p>
<p style="color:#888;font-size:13px;font-style:italic;">Cross-reference with the Final Exam page for question text. This is a condensed key for fast grading.</p>

<h2>License Management</h2>
<ul>
  <li>License issuance: Claude Teams admin portal → Add member → use student's company email</li>
  <li>License revocation: remove from Teams org AND remove from GitHub citizen team</li>
  <li>See the Citizen AI Engineer Policies &amp; Procedures doc for the full offboarding checklist</li>
</ul>

<h2>Progress Tracking</h2>
<p>Export Quiz Completions list to Excel to see which students have completed which modules. Filter by the Module column to see per-module completion rates. Export Final Exam Submissions to see who is ready for license issuance.</p>
<p>The Highlander ODL tracks post-license GitHub activity. Review Highlander commit reports in quarterly 1:1s with each citizen.</p>
`;

  const newCanvas = [
    {
      position: { zoneIndex: 1, sectionIndex: 1, sectionFactor: 12, layoutIndex: 1 },
      controlType: 4,
      id: 'admin-ref-content',
      innerHTML: newHtml,
      editorType: 'CKEditor',
    }
  ];

  return savePage(page, 36, newCanvas);
}

// ─── 3. Update Home page — add Module 0 as the course entry point ──────────────
async function fixHomePage(page) {
  log('Updating Home page to elevate Module 0...');
  const canvas = await getPageCanvas(page, 1);

  for (const block of canvas) {
    if (!block.innerHTML) continue;

    // Fix the "Start with Module 1" CTA to point to Module 0 first
    if (block.innerHTML.includes('Start with Module 1')) {
      block.innerHTML = block.innerHTML.replace(
        /→\s*Start with Module 1[^<]*/g,
        '→ Start with Module 0: Why We\'re Doing This (read first, no quiz)'
      );
    }

    // Add Module 0 as row 0 in the course table
    if (block.innerHTML.includes('Module 1: What Claude Is') && block.innerHTML.includes('<table')) {
      // Insert Module 0 row before the Module 1 row
      block.innerHTML = block.innerHTML.replace(
        /(<tr[^>]*>[\s\S]*?Module 1: What Claude Is[\s\S]*?<\/tr>)/,
        `<tr style="background-color:#e8f0fe;">
  <td style="padding:8px;border:1px solid #ccc;font-weight:700;color:#0042E0;">0</td>
  <td style="padding:8px;border:1px solid #ccc;"><a href="${SITE_URL}/SitePages/Module-0--Why-We-re-Doing-This.aspx" style="color:#0042E0;font-weight:700;">Module 0: Why We're Doing This</a> <em style="color:#555;font-size:12px;">(orientation — read before Module 1)</em></td>
  <td style="padding:8px;border:1px solid #ccc;color:#888;font-style:italic;">No quiz</td>
</tr>
$1`
      );
    }

    // Remove Module 0 from "Important Notes" since it's now in the table
    if (block.innerHTML.includes('Module 0: Why We\'re Doing This (Orientation')) {
      block.innerHTML = block.innerHTML.replace(
        /Module 0: Why We're Doing This \(Orientation[^<]*\)<br\s*\/?>/gi,
        ''
      );
    }
  }

  return savePage(page, 1, canvas);
}

// ─── 4. Create Capstone Guide page ────────────────────────────────────────────
async function createCapstonePage(page) {
  log('Creating Capstone Guide page...');

  // Check if it already exists
  const existing = await page.evaluate(async (siteUrl) => {
    const r = await fetch(`${siteUrl}/_api/sitepages/pages?$select=Id,Title&$filter=Title eq 'Capstone Guide'`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const d = await r.json();
    return d.d.results.length > 0 ? d.d.results[0].Id : null;
  }, SITE_URL);

  if (existing) {
    log(`Capstone Guide already exists (ID ${existing})`);
    return { status: 'already_exists', id: existing };
  }

  const html = `
<h1>Capstone Exercise — Citizen AI Developer Program</h1>
<p style="font-size:16px;color:#333;">
  You've passed the Final Exam and received your Claude Desktop license. This is your first real assignment.
  Complete it within five business days of receiving your license.
</p>
<p style="background-color:#e8f0fe;border-left:4px solid #0042E0;padding:16px;margin:16px 0;">
  <strong>The capstone is not optional.</strong> It is the bridge between passing a certification and actually integrating AI into your work.
  Your license is provisional until your capstone is submitted and acknowledged by the program administrator.
</p>

<hr/>

<h2>What You're Building</h2>
<p>Your capstone has three deliverables:</p>

<h3>Deliverable 1 — Your Claude Project (already done in Day 1 Quick Start)</h3>
<p>If you followed the Day 1 Quick Start, you already did this: you created a Claude Desktop Project with personalized instructions for your role.
For the capstone, paste your final Project instructions into the capstone submission form. They should include:</p>
<ul>
  <li>Your name, role, and company context</li>
  <li>At least three standing rules (e.g., "always ask a clarifying question if the task is ambiguous")</li>
  <li>Your communication style preferences</li>
  <li>At least one standing constraint (something Claude should never do in your work context)</li>
</ul>
<p>A copy-paste of the example from Day 1 Quick Start is not acceptable. This must be genuinely yours.</p>

<h3>Deliverable 2 — Your GitHub Repo</h3>
<p>Create your first citizen AI GitHub repository following the naming convention: <code>citizen-[yourteam]-[project]</code></p>
<p>Your repo must contain:</p>
<ul>
  <li>A completed <code>METADATA.yaml</code> linking the project to a real OKR from your team's current quarter</li>
  <li>A <code>README.md</code> describing what the project does in one paragraph</li>
  <li>At least one real prompt you have used in your work (saved in a <code>prompts/</code> folder)</li>
</ul>
<p>See Module 15 (GitHub) for setup instructions. The Highlander ODL will begin tracking your repo automatically once it's created under the iAltA GitHub org.</p>

<h3>Deliverable 3 — One Real Work Output</h3>
<p>Use Claude to complete one real task from your actual job. Not a demo. Not a test. A real piece of work that you would have done manually otherwise.</p>
<p>Examples by team:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <thead>
    <tr style="background-color:#000D2D;color:white;">
      <th style="padding:10px;border:1px solid #ccc;">Team</th>
      <th style="padding:10px;border:1px solid #ccc;">Example capstone task</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color:#f9f9f9;">
      <td style="padding:10px;border:1px solid #ccc;">Sales</td>
      <td style="padding:10px;border:1px solid #ccc;">Convert three months of your call notes into CRM summaries. Save the prompt template you built in your GitHub repo.</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #ccc;">Client Success</td>
      <td style="padding:10px;border:1px solid #ccc;">Use Claude to analyze one quarter of NPS responses — identify top themes, most urgent issues, and draft a response to the most critical comment.</td>
    </tr>
    <tr style="background-color:#f9f9f9;">
      <td style="padding:10px;border:1px solid #ccc;">Marketing</td>
      <td style="padding:10px;border:1px solid #ccc;">Build a campaign brief template in Claude. Run it on one real upcoming campaign. Commit both the template and the output to your GitHub repo.</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #ccc;">Operations / Finance</td>
      <td style="padding:10px;border:1px solid #ccc;">Build a prompt that extracts structured data from one type of document you process regularly (invoices, reports, agreements). Save it in your repo.</td>
    </tr>
    <tr style="background-color:#f9f9f9;">
      <td style="padding:10px;border:1px solid #ccc;">HR</td>
      <td style="padding:10px;border:1px solid #ccc;">Use Claude to draft or rewrite a key HR document — a job description, policy, or onboarding checklist — and save the prompt template for future reuse.</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #ccc;">Any team</td>
      <td style="padding:10px;border:1px solid #ccc;">The task that immediately came to mind when you read Module 0. Do that one.</td>
    </tr>
  </tbody>
</table>
<p>Commit your output (or a prompt template that produces it) to your GitHub repo.</p>

<hr/>

<h2>How to Submit</h2>
<p>Send a message in the <strong>Citizen AI Developer Program Teams channel</strong> with:</p>
<ol>
  <li>Your GitHub repo URL</li>
  <li>Your Claude Project instructions (paste them directly)</li>
  <li>One sentence describing what real work output you produced</li>
</ol>
<p>The program administrator will acknowledge within one business day. Your license is then fully activated.</p>

<hr/>

<h2>What Good Looks Like</h2>
<p>The capstone is not graded on complexity. It is graded on authenticity:</p>
<ul>
  <li>Did you build a real GitHub repo with a real METADATA.yaml?</li>
  <li>Are your Project instructions specific to your actual job, or are they generic?</li>
  <li>Did you use Claude on a real task, or did you invent a demo scenario?</li>
</ul>
<p>The citizens who get the most out of this program are the ones who treat the capstone as the beginning, not the end. Your GitHub repo should still be getting commits a year from now.</p>

<hr/>

<h2>Questions?</h2>
<p>Post in the Citizen AI Developer Program Teams channel. The program administrator monitors it daily.</p>
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
        Title: 'Capstone Guide',
        FileName: 'Capstone-Guide.aspx',
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
      id: 'capstone-content',
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

  return result;
}

// ─── 5. Update Module 9 — connect task zones to data governance zones ──────────
async function fixModule9(page) {
  log('Updating Module 9 to connect task delegation zones with data governance zones...');
  const canvas = await getPageCanvas(page, 9);

  const governanceSection = `
<hr/>
<h2>The Other Dimension: Data Governance Zones</h2>
<p>The three zones above describe <em>how much delegation is appropriate</em> based on the task type. There is a second dimension that governs <em>what data you are allowed to use</em>. These are the same Zone 1/2/3 labels — and they are intentionally aligned.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <thead>
    <tr style="background-color:#000D2D;color:white;">
      <th style="padding:10px;border:1px solid #ccc;">Zone</th>
      <th style="padding:10px;border:1px solid #ccc;">Data Type</th>
      <th style="padding:10px;border:1px solid #ccc;">Delegation Level</th>
      <th style="padding:10px;border:1px solid #ccc;">What's Required</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color:#e8f0fe;">
      <td style="padding:10px;border:1px solid #ccc;font-weight:700;">Zone 1</td>
      <td style="padding:10px;border:1px solid #ccc;">Public or non-sensitive data — nothing from company systems</td>
      <td style="padding:10px;border:1px solid #ccc;">Delegate Fully</td>
      <td style="padding:10px;border:1px solid #ccc;">GitHub commit only — no approvals needed. Highlander still needs to see the work.</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #ccc;font-weight:700;">Zone 2</td>
      <td style="padding:10px;border:1px solid #ccc;">Internal data — company docs, internal metrics, team processes</td>
      <td style="padding:10px;border:1px solid #ccc;">Collaborate (human in the loop)</td>
      <td style="padding:10px;border:1px solid #ccc;">GitHub repo required. Branch protection. Do not push directly to main.</td>
    </tr>
    <tr style="background-color:#fff8e8;">
      <td style="padding:10px;border:1px solid #ccc;font-weight:700;">Zone 3</td>
      <td style="padding:10px;border:1px solid #ccc;">Confidential, client data, PII, live system access via MCP</td>
      <td style="padding:10px;border:1px solid #ccc;">Verify &amp; Augment (every output reviewed)</td>
      <td style="padding:10px;border:1px solid #ccc;">GitHub + manager reviews every output before anything goes external. Playwright use is automatically Zone 3.</td>
    </tr>
    <tr style="background-color:#fde8e8;">
      <td style="padding:10px;border:1px solid #ccc;font-weight:700;">No-Drive Zone</td>
      <td style="padding:10px;border:1px solid #ccc;">Credentials, API keys, unapproved tools, bypassing program guardrails</td>
      <td style="padding:10px;border:1px solid #ccc;">Do not proceed</td>
      <td style="padding:10px;border:1px solid #ccc;">These are prohibited. Violation = immediate license suspension pending review.</td>
    </tr>
  </tbody>
</table>
<p><strong>The decision rule:</strong> Look at the data you are working with. If it's public knowledge, you're in Zone 1. If it's internal, Zone 2. If it's confidential or involves client data, Zone 3. If you're not sure, go up a zone. If you're about to use credentials or unapproved tools, stop.</p>
<p>Module 13 (Safety &amp; Responsible Use) covers the No-Drive Zone in detail. The governance framework is fully documented in the Citizen AI Engineer Policies &amp; Procedures document.</p>
`;

  // Append governance section to the last content block
  const lastBlock = canvas[canvas.length - 1];
  if (lastBlock && lastBlock.innerHTML !== undefined) {
    // Only add if not already present
    if (!lastBlock.innerHTML.includes('Data Governance Zones')) {
      lastBlock.innerHTML += governanceSection;
    }
  }

  return savePage(page, 9, canvas);
}

// ─── 6. Update Final Exam and Day 1 Quick Start to link to Capstone Guide ──────
async function linkCapstoneInFinalExam(page, capstoneUrl) {
  log('Linking Capstone Guide in Final Exam and Day 1 Quick Start...');
  const results = [];

  for (const pageId of [32, 40]) {
    const canvas = await getPageCanvas(page, pageId);
    let changed = false;
    for (const block of canvas) {
      if (!block.innerHTML) continue;
      if (block.innerHTML.includes('instructions for the capstone exercise') && !block.innerHTML.includes('Capstone-Guide')) {
        block.innerHTML = block.innerHTML.replace(
          'you will receive instructions for the capstone exercise',
          `you will receive instructions for the capstone exercise. <a href="${capstoneUrl}" style="color:#0042E0;font-weight:700;">View the Capstone Guide →</a>`
        );
        changed = true;
      }
      // Day 1 Quick Start might reference capstone
      if (pageId === 40 && block.innerHTML.includes('capstone') && !block.innerHTML.includes('Capstone-Guide')) {
        block.innerHTML = block.innerHTML.replace(
          /capstone/gi,
          `<a href="${capstoneUrl}" style="color:#0042E0;">Capstone Guide</a>`
        );
        changed = true;
      }
    }
    if (changed) {
      const r = await savePage(page, pageId, canvas);
      results.push({ pageId, ...r });
    } else {
      results.push({ pageId, status: 'no_change_needed' });
    }
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: AUTH_PATH,
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 1. Delete API Test Page
  log('\n─── Step 1: Delete API Test Page ───');
  const deleteResult = await deletePage(page, 35);
  log(`Delete result: ${JSON.stringify(deleteResult)}`);

  // 2. Fix Admin Reference page
  log('\n─── Step 2: Rebuild Admin Reference ───');
  const adminResult = await fixAdminReferencePage(page);
  log(`Admin ref result: ${JSON.stringify(adminResult)}`);

  // 3. Fix Home page
  log('\n─── Step 3: Update Home Page ───');
  const homeResult = await fixHomePage(page);
  log(`Home page result: ${JSON.stringify(homeResult)}`);

  // 4. Create Capstone Guide
  log('\n─── Step 4: Create Capstone Guide ───');
  const capstoneResult = await createCapstonePage(page);
  log(`Capstone result: ${JSON.stringify(capstoneResult)}`);

  // 5. Update Module 9 with governance zones
  log('\n─── Step 5: Update Module 9 ───');
  const mod9Result = await fixModule9(page);
  log(`Module 9 result: ${JSON.stringify(mod9Result)}`);

  // 6. Link Capstone in Final Exam and Day 1
  if (capstoneResult.status === 'published' || capstoneResult.status === 'already_exists') {
    log('\n─── Step 6: Link Capstone in Final Exam + Day 1 ───');
    const capstoneUrl = `${SITE_URL}/SitePages/Capstone-Guide.aspx`;
    const linkResults = await linkCapstoneInFinalExam(page, capstoneUrl);
    log(`Link results: ${JSON.stringify(linkResults)}`);
  }

  log('\n═══ ALL DONE ═══');
  await browser.close();
})();
