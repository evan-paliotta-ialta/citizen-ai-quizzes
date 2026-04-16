/**
 * Creates Module 0: Why We're Doing This on the SharePoint course site.
 *
 * Content:
 *  - Jensen Huang model: job = purpose + tasks; AI offloads tasks → solve more problems
 *  - ADKAR AI change readiness framework
 *  - Capability Maturity Model (5 levels)
 *  - Current state snapshot and what this program aims to achieve
 *  - No quiz
 *
 * Run from the "Citizen AI Engineer" folder:
 *   node create_module_0.js
 *
 * Uses the saved auth session at ./playwright/auth/auth.json
 * Re-run ./playwright/auth/save-auth.js if session expired.
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';
const PAGE_TITLE = 'Module 0: Why We\'re Doing This';

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

// ─── Module 0 HTML Content ────────────────────────────────────────────────────
const MODULE_0_HTML = `
<h1>Module 0: Why We're Doing This</h1>

<p><em>No quiz. Read this before starting Module 1 — it sets the context for everything that follows.</em></p>

<hr/>

<h2>The Jensen Huang Model: Purpose vs. Tasks</h2>

<p>Jensen Huang, CEO of NVIDIA, made a claim that sounds provocative but is actually optimistic:</p>

<blockquote>
<p><strong>"AI will not take your job. But someone who uses AI will."</strong></p>
</blockquote>

<p>Here's the mental model behind it:</p>

<p>Every job is made of two things:</p>
<ul>
  <li><strong>Purpose</strong> — the reason the role exists. The judgment, the relationships, the decisions, the things that actually matter.</li>
  <li><strong>Tasks</strong> — the work you do to serve that purpose. Writing, summarizing, researching, formatting, tracking, communicating.</li>
</ul>

<p>AI is very good at tasks. It is not a replacement for purpose.</p>

<p>When AI offloads tasks from you, two things happen:</p>
<ol>
  <li>You get time back.</li>
  <li>You can use that time to find and solve <em>more problems</em> — to do more of the purpose-driven work that is uniquely yours.</li>
</ol>

<p>This is not a threat. It's leverage. The goal of this program is to give you that leverage deliberately, safely, and in a way that creates measurable value for the company.</p>

<p>The citizens who will get the most out of this program are the ones who ask: <em>"If I didn't have to spend time on this task, what problem would I go solve?"</em></p>

<hr/>

<h2>The Operating Model: How This Program Works</h2>

<p>The Citizen AI Engineer Program is built on four pillars working together:</p>

<table>
  <thead>
    <tr>
      <th>Pillar</th>
      <th>What It Means</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>ADKAR</strong></td>
      <td>A framework for change readiness — are people Aware, willing (Desire), trained (Knowledge), capable (Ability), and is the change sticking (Reinforcement)?</td>
    </tr>
    <tr>
      <td><strong>Capability Maturity</strong></td>
      <td>A 5-level model for measuring how mature an organization's AI adoption is — from "no deliberate AI use" to "AI as a strategic differentiator."</td>
    </tr>
    <tr>
      <td><strong>OKRs</strong></td>
      <td>Every citizen project connects to a company objective. AI use that doesn't link to a goal doesn't qualify as program work. Your GitHub repo's METADATA.yaml makes this explicit.</td>
    </tr>
    <tr>
      <td><strong>Monitor &amp; Measure</strong></td>
      <td>Highlander (our internal ODL) tracks commit activity, project velocity, and OKR attribution. The program produces evidence, not just effort.</td>
    </tr>
  </tbody>
</table>

<hr/>

<h2>ADKAR: Are We Ready to Change?</h2>

<p>Before rolling out AI to 20+ employees, we need to ask: what does it actually take for a change like this to stick? The ADKAR model breaks it into five stages:</p>

<table>
  <thead>
    <tr>
      <th>Stage</th>
      <th>The Question</th>
      <th>What It Looks Like If Missing</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Awareness</strong></td>
      <td>Do people understand why AI adoption matters?</td>
      <td>Citizens ignore tools or treat them as optional extras.</td>
    </tr>
    <tr>
      <td><strong>Desire</strong></td>
      <td>Do people actually want to use AI?</td>
      <td>Mandated adoption without buy-in. Low engagement. Checkbox behavior.</td>
    </tr>
    <tr>
      <td><strong>Knowledge</strong></td>
      <td>Do people know how to use AI well?</td>
      <td>Poor prompts, shallow results, frustration, abandonment.</td>
    </tr>
    <tr>
      <td><strong>Ability</strong></td>
      <td>Can people actually implement what they've learned?</td>
      <td>Training happened but behavior hasn't changed. Knowing vs. doing.</td>
    </tr>
    <tr>
      <td><strong>Reinforcement</strong></td>
      <td>What keeps the change from reverting?</td>
      <td>Initial enthusiasm fades. Old habits return. No accountability structure.</td>
    </tr>
  </tbody>
</table>

<p>This course addresses <strong>Knowledge</strong> and <strong>Ability</strong>. The program structure (GitHub repos, Highlander tracking, quarterly 1:1s, office hours) addresses <strong>Reinforcement</strong>. Your decision to be here addresses <strong>Desire</strong>. This module addresses <strong>Awareness</strong>.</p>

<hr/>

<h2>Capability Maturity: Where We Are and Where We're Going</h2>

<p>The Capability Maturity Model describes five levels of AI adoption maturity in an organization. Think of it as a ladder:</p>

<table>
  <thead>
    <tr>
      <th>Level</th>
      <th>Name</th>
      <th>What It Looks Like</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Level 1</strong></td>
      <td>Initial</td>
      <td>No deliberate AI adoption. Individuals may experiment on their own, but there's no program, no policy, no measurement.</td>
    </tr>
    <tr>
      <td><strong>Level 2</strong></td>
      <td>Experimenting</td>
      <td>Pilots happening in pockets. Some teams are using AI, but inconsistently. No shared standards.</td>
    </tr>
    <tr>
      <td><strong>Level 3</strong></td>
      <td>Structured</td>
      <td>Org-wide AI policy and standards in place. Approved tooling. Training program. OKR linkage. This is the program's goal for every citizen team.</td>
    </tr>
    <tr>
      <td><strong>Level 4</strong></td>
      <td>Scaling</td>
      <td>AI embedded across functions. Repeatable playbooks. Cross-team knowledge sharing. Measurable productivity gains.</td>
    </tr>
    <tr>
      <td><strong>Level 5</strong></td>
      <td>Optimizing</td>
      <td>AI is a strategic differentiator. Continuous improvement of AI practices. Competitive advantage is demonstrably tied to AI capability.</td>
    </tr>
  </tbody>
</table>

<hr/>

<h2>Where We Are Right Now</h2>

<p>As of March 2026, here is the maturity snapshot for iAltA:</p>

<table>
  <thead>
    <tr>
      <th>Department</th>
      <th>Current Maturity Level</th>
      <th>Current ADKAR Stage</th>
      <th>Target (Q4 2026)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Engineering</td>
      <td>Level 3 — Structured</td>
      <td>Reinforcement</td>
      <td>Level 4 — Scaling</td>
    </tr>
    <tr>
      <td>Product</td>
      <td>Level 2 — Experimenting</td>
      <td>Knowledge</td>
      <td>Level 3 — Structured</td>
    </tr>
    <tr>
      <td>Sales</td>
      <td>Level 1 — Initial</td>
      <td>Awareness</td>
      <td>Level 2 — Active (ADKAR: Ability)</td>
    </tr>
    <tr>
      <td>Client Services</td>
      <td>Level 1 — Initial</td>
      <td>Awareness</td>
      <td>Level 2 — Active (ADKAR: Ability)</td>
    </tr>
    <tr>
      <td>Finance / Legal</td>
      <td>Level 1 — Initial</td>
      <td>Awareness</td>
      <td>Level 2 — Active (ADKAR: Ability)</td>
    </tr>
    <tr>
      <td>Marketing</td>
      <td>Level 1 — Initial</td>
      <td>Awareness</td>
      <td>Level 2 — Active (ADKAR: Ability)</td>
    </tr>
    <tr>
      <td><strong>Org Average</strong></td>
      <td><strong>1.4 / 5</strong></td>
      <td></td>
      <td><strong>3.0 / 5</strong></td>
    </tr>
  </tbody>
</table>

<p>The org average of 1.4 means most of the company is at Level 1 with pockets of Level 2. The Q4 2026 target of 3.0 means getting every department to Structured — which requires this program to work.</p>

<p><strong>You are part of the plan to close that gap.</strong></p>

<hr/>

<h2>What You're Signing Up For</h2>

<p>Completing this course and earning your Claude Desktop license means:</p>

<ul>
  <li>You've demonstrated you understand how AI works and how to use it well.</li>
  <li>You've agreed to the Citizen AI Engineer policies (the program rulebook).</li>
  <li>You have access to Claude Teams — the managed, policy-compliant version of Claude — with approved MCP connectors.</li>
  <li>Your work goes into GitHub. Every project you build connects to a company OKR. Highlander tracks the impact.</li>
  <li>You are expected to use this. Not occasionally — regularly. The value of the program is proportional to how much you build.</li>
</ul>

<p>The program isn't giving you a tool to play with. It's giving you a lever. The question is what you're going to move with it.</p>

<hr/>

<p><strong>Next:</strong> <a href="https://ialta.sharepoint.com/sites/CitizenAI/SitePages/Module-1--What-Claude-Is-(and-Isn't).aspx">Module 1: What Claude Is (and Isn't) →</a></p>
`.trim();

// ─── Create the page via SharePoint REST API ──────────────────────────────────
async function createModule0(playwrightPage) {
  log(`Creating page: "${PAGE_TITLE}"`);

  const result = await playwrightPage.evaluate(
    async ({ siteUrl, pageTitle, content }) => {
      // ── 1. Get request digest ────────────────────────────────────────────────
      const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: { Accept: 'application/json;odata=verbose' },
      });
      const digestData = await digestRes.json();
      const digest = digestData.d.GetContextWebInformation.FormDigestValue;

      // ── 2. Check if page already exists ─────────────────────────────────────
      const escapedTitle = pageTitle.replace(/'/g, "''");
      const checkRes = await fetch(
        `${siteUrl}/_api/sitepages/pages?$filter=Title eq '${escapedTitle}'&$select=Id,Title,CanvasContent1`,
        { headers: { Accept: 'application/json;odata=verbose' } }
      );
      const checkData = await checkRes.json();

      let pageId = null;
      let existingCanvas = null;

      if (checkData.d && checkData.d.results.length > 0) {
        const existing = checkData.d.results[0];
        pageId = existing.Id;
        existingCanvas = existing.CanvasContent1 || '';
        // Page exists with content — we'll overwrite it (force update)
        if (existingCanvas && existingCanvas.trim().length > 10) {
          // Try to detect if it already has Module 0 content
          if (existingCanvas.includes('Jensen Huang') || existingCanvas.includes('Why We')) {
            return { id: pageId, title: pageTitle, status: 'already_exists' };
          }
        }
      }

      // ── 3. Create page shell if needed ──────────────────────────────────────
      if (!pageId) {
        const createRes = await fetch(`${siteUrl}/_api/sitepages/pages`, {
          method: 'POST',
          headers: {
            Accept: 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': digest,
          },
          body: JSON.stringify({
            __metadata: { type: 'SP.Publishing.SitePage' },
            Title: pageTitle,
            PromotedState: 0,
          }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          throw new Error(`Page creation failed (${createRes.status}): ${errText.slice(0, 300)}`);
        }
        const pageData = await createRes.json();
        pageId = pageData.d.Id;
      }

      // ── 4. Checkout ──────────────────────────────────────────────────────────
      await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
      });

      // ── 5. Build canvas content ──────────────────────────────────────────────
      const instanceId = `text-module0-${Math.random().toString(36).substr(2, 9)}`;
      const canvasContent = JSON.stringify([
        {
          position: {
            layoutIndex: 1,
            zoneIndex: 1,
            sectionIndex: 1,
            sectionFactor: 12,
            controlIndex: 1,
            isLayoutReflowing: false,
          },
          controlType: 4,
          id: instanceId,
          innerHTML: content,
          editorType: 'CKEditor',
          textEditorVersion: 3,
          addedFromPersistedData: false,
          reservedHeight: 100,
          reservedWidth: 0,
        },
      ]);

      // ── 6. Save canvas content ───────────────────────────────────────────────
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
          CanvasContent1: canvasContent,
        }),
      });

      if (!saveRes.ok) {
        const errText = await saveRes.text();
        throw new Error(`Page save failed (${saveRes.status}): ${errText.slice(0, 300)}`);
      }

      // ── 7. Publish ───────────────────────────────────────────────────────────
      const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
      });

      return {
        id: pageId,
        title: pageTitle,
        status: pubRes.ok ? 'published' : `publish_failed_${pubRes.status}`,
      };
    },
    { siteUrl: SITE_URL, pageTitle: PAGE_TITLE, content: MODULE_0_HTML }
  );

  return result;
}

// ─── Also update the Home page to list Module 0 at the top ───────────────────
async function addModule0ToHomePage(playwrightPage) {
  log('Checking home page to ensure Module 0 is in the navigation...');

  const result = await playwrightPage.evaluate(
    async ({ siteUrl }) => {
      const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: { Accept: 'application/json;odata=verbose' },
      });
      const digestData = await digestRes.json();
      const digest = digestData.d.GetContextWebInformation.FormDigestValue;

      // Find the Home page
      const checkRes = await fetch(
        `${siteUrl}/_api/sitepages/pages?$filter=Title eq 'Home'&$select=Id,Title,CanvasContent1`,
        { headers: { Accept: 'application/json;odata=verbose' } }
      );
      const checkData = await checkRes.json();
      if (!checkData.d || checkData.d.results.length === 0) {
        return { status: 'home_not_found' };
      }

      const homePage = checkData.d.results[0];
      const pageId = homePage.Id;
      const existingCanvas = homePage.CanvasContent1 || '';

      // If Module 0 already in home page, skip
      if (existingCanvas.includes('Module 0') || existingCanvas.includes('Why We')) {
        return { status: 'already_has_module0' };
      }

      // Parse canvas and inject Module 0 link into the first text block
      let canvas;
      try {
        canvas = JSON.parse(existingCanvas);
      } catch (e) {
        return { status: 'parse_error', error: e.message };
      }

      // Find the text block with the module list (has "Module 1" in innerHTML)
      let updated = false;
      for (const block of canvas) {
        if (block.innerHTML && block.innerHTML.includes('Module 1')) {
          // Prepend Module 0 link before Module 1
          block.innerHTML = block.innerHTML.replace(
            /(<li>.*?Module 1.*?<\/li>)/,
            `<li><a href="${siteUrl}/SitePages/Module-0--Why-We're-Doing-This.aspx">Module 0: Why We're Doing This</a> <em>(Orientation — read first)</em></li>\n$1`
          );
          updated = true;
          break;
        }
      }

      if (!updated) {
        return { status: 'module1_link_not_found_in_home' };
      }

      // Checkout, update, publish
      await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
        method: 'POST',
        headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
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

      if (!saveRes.ok) {
        return { status: `save_failed_${saveRes.status}` };
      }

      await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
        method: 'POST',
        headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      return { status: 'home_updated' };
    },
    { siteUrl: SITE_URL }
  );

  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  if (!fs.existsSync(AUTH_PATH)) {
    log('ERROR: No auth session found.');
    log('Run: node playwright/auth/save-auth.js');
    process.exit(1);
  }

  log('Launching browser with saved session...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_PATH });
  const page = await context.newPage();

  // Navigate to site to establish session
  log(`Loading SharePoint site...`);
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Verify we're authenticated
  const url = page.url();
  if (url.includes('login.microsoftonline') || url.includes('login.live')) {
    log('ERROR: Session expired. Run: node playwright/auth/save-auth.js');
    await browser.close();
    process.exit(1);
  }
  log(`Authenticated. URL: ${url}`);

  // Create Module 0
  const result = await createModule0(page);
  log(`Module 0 result: ${JSON.stringify(result)}`);

  if (result.status === 'published') {
    log(`✓ Module 0 created and published. Page ID: ${result.id}`);
    log(`  URL: ${SITE_URL}/SitePages/Module-0--Why-We're-Doing-This.aspx`);
  } else if (result.status === 'already_exists') {
    log(`✓ Module 0 already exists with correct content — skipped.`);
  } else {
    log(`⚠ Unexpected status: ${result.status}`);
  }

  // Update home page navigation
  const homeResult = await addModule0ToHomePage(page);
  log(`Home page update result: ${JSON.stringify(homeResult)}`);

  await browser.close();
  log('Done.');
})();
