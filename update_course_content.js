/**
 * Updates course content on the SharePoint site:
 *
 *  1. Add METADATA.yaml section to Module 15 (GitHub module)
 *  2. Create Day 1 Quick Start page
 *  3. Update Home page to link to Day 1 Quick Start
 *
 * Run: node update_course_content.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

// ─── METADATA.yaml HTML block to insert into Module 15 ───────────────────────
// Inserted just before the Key Takeaways section
const METADATA_YAML_HTML = `
<hr>
<h2>METADATA.yaml — Required in Every Citizen AI Repo</h2>

<p>Every citizen AI project lives in a GitHub repo. Every repo must have a <code>METADATA.yaml</code> file in the root directory.</p>

<p>This file is how Highlander — the program's tracking system — knows what you built, which OKR it serves, and who owns it. Without it, your work does not show up in the OKR attribution dashboard and your license activity cannot be verified.</p>

<h3>The Template</h3>

<pre><code># METADATA.yaml — required in every citizen AI repo
okr: "Q3-2026: [paste the exact OKR text from your team's OKR doc]"
zone: "2"           # 1 = public data only, 2 = internal data, 3 = confidential/PII/MCP
owner: "your.name@ialta.com"
team: "YourTeam"    # Sales, ClientServices, Marketing, Finance, HR, Operations, etc.
description: "One sentence — what does this project do and why?"
started: "YYYY-MM-DD"
</code></pre>

<h3>Four Rules</h3>

<table>
  <thead>
    <tr>
      <th>Field</th>
      <th>Rule</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>okr</strong></td>
      <td>Required. Copy the exact OKR text from your team's OKR doc. If your project does not link to a company OKR, it is personal experimentation — keep it in Zone 1 and do not represent it as program work.</td>
    </tr>
    <tr>
      <td><strong>zone</strong></td>
      <td>Must be accurate. Getting this wrong is a policy violation, not a typo. When in doubt, go up a zone — Zone 2 is always safer than Zone 1 if you are unsure about the data.</td>
    </tr>
    <tr>
      <td><strong>owner</strong></td>
      <td>Use your company email. This is how deprovisioning works — if you leave the program, your repos are transferred to the program lead based on this field.</td>
    </tr>
    <tr>
      <td><strong>description</strong></td>
      <td>One sentence, written for someone who does not know your team. "Automates weekly competitive intelligence summary using Claude + public web sources" is good. "AI stuff" is not.</td>
    </tr>
  </tbody>
</table>

<h3>When to Create METADATA.yaml</h3>

<p>On day one. Before you write any code, prompts, or automation. The initial commit of every repo should include:</p>
<ul>
  <li><code>README.md</code> — what this project does</li>
  <li><code>METADATA.yaml</code> — program metadata</li>
  <li><code>.gitignore</code> — excludes secrets and temp files</li>
</ul>

<p>Do not create a repo, do weeks of work, and add METADATA.yaml later. If Highlander does not see it from the first week, the early activity cannot be attributed.</p>

<h3>Example — Completed METADATA.yaml</h3>

<pre><code>okr: "Q3-2026: Reduce time spent on manual research tasks by 20% across the Sales team"
zone: "2"
owner: "alex.chen@ialta.com"
team: "Sales"
description: "Weekly competitive intelligence digest — pulls public news on 5 competitors, summarizes with Claude, emails to leadership every Monday"
started: "2026-04-14"
</code></pre>

<p><strong>After pushing your repo, confirm it appears in the <a href="https://github.com/ialta">iAltA GitHub org</a> with a complete METADATA.yaml. Highlander checks this weekly.</strong></p>
`;

// ─── Day 1 Quick Start HTML ───────────────────────────────────────────────────
const DAY_1_HTML = `
<h1>Day 1 Quick Start — You've Earned Your License</h1>

<p><em>You passed the Final Exam. Here's exactly what to do in the first few hours.</em></p>

<hr>

<h2>Step 1: Open Claude Desktop</h2>

<p>If you do not have Claude Desktop installed yet:</p>
<ul>
  <li>Download from <strong>claude.ai/download</strong></li>
  <li>Log in with your company email (this puts you on the Teams plan with the program's guardrails)</li>
  <li>Confirm: the top of the app should show <strong>"Claude Teams"</strong></li>
</ul>

<p>If you are using Claude.ai in a browser or the mobile app instead — stop. Those do not have the program's safety controls. All company work runs through Claude Desktop or Claude Code. This is a program requirement, not a preference.</p>

<hr>

<h2>Step 2: Create Your First Project (10 minutes)</h2>

<p>Projects give Claude persistent context about who you are, what you do, and how you want it to behave. Without a Project, Claude starts every conversation blank. With a Project, it knows your context from the first word.</p>

<p><strong>In Claude Desktop:</strong> Click "Projects" in the left sidebar → New Project → give it a name like "[Your Name] — [Your Role]"</p>

<p>In the Project Instructions, write something like this (adapt it to be genuinely yours):</p>

<pre><code>I'm [Name], [Role] at iAltA. My team does [one-sentence description].

I typically bring Claude:
- [Type of work 1, e.g., drafting client communications]
- [Type of work 2, e.g., analyzing documents and extracting key points]
- [Type of work 3, e.g., building prompt templates for recurring tasks]

Standing rules:
- Always ask me one clarifying question if my request is ambiguous before answering
- If you are not confident about a specific fact or number, say so explicitly
- Keep responses concise unless I ask for depth

My communication style: [e.g., direct and practical, no fluff]
</code></pre>

<p>Test it: ask Claude a real question from your work. Does the response feel more grounded and relevant than a blank-context response? If not, improve the instructions.</p>

<hr>

<h2>Step 3: Create Your GitHub Repo (15 minutes)</h2>

<p>Every AI-assisted work goes into a GitHub repo. No exceptions — even Zone 1 learning projects. Highlander tracks program value through GitHub activity. No commits = no data = no program.</p>

<p><strong>How to create your first repo:</strong></p>
<ol>
  <li>Go to <strong>github.com/ialta</strong> (or the org URL your program lead provides)</li>
  <li>Click <strong>New repository</strong></li>
  <li>Name it: <code>citizen-[yourteam]-[project-name]</code> — for example: <code>citizen-sales-competitive-intel</code></li>
  <li>Set to <strong>Private</strong></li>
  <li>Check <strong>"Initialize this repository with a README"</strong></li>
  <li>Click <strong>Create repository</strong></li>
</ol>

<p><strong>Immediately add METADATA.yaml</strong> to the root (see Module 15 for the full template):</p>

<pre><code>okr: "Q3-2026: [paste exact OKR text from your team's OKRs]"
zone: "1"           # 1=public data only, 2=internal, 3=confidential/MCP
owner: "your.name@ialta.com"
team: "YourTeam"
description: "One sentence — what does this project do?"
started: "2026-[today's date]"
</code></pre>

<p>Commit the file with message: <code>Initial setup: add METADATA.yaml</code></p>

<hr>

<h2>Step 4: Your First Task (30 minutes)</h2>

<p>Pick something real. Not a toy exercise — an actual problem from your work this week. Start with Zone 1 (public data, no confidential information) if you are not yet comfortable with the zone system.</p>

<p><strong>Good first tasks by team:</strong></p>

<table>
  <thead>
    <tr>
      <th>Team</th>
      <th>Example Zone 1 First Task</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Sales</td>
      <td>Research a prospect's publicly available news, earnings, and leadership changes. Summarize into a 1-page briefing.</td>
    </tr>
    <tr>
      <td>Client Services</td>
      <td>Draft a reusable template for a common client communication (onboarding welcome, renewal reminder, etc.).</td>
    </tr>
    <tr>
      <td>Finance / Legal</td>
      <td>Summarize a public regulation, framework, or industry report relevant to your current work.</td>
    </tr>
    <tr>
      <td>Marketing</td>
      <td>Draft 5 variations of a LinkedIn post or campaign headline for an upcoming initiative (using public company messaging only).</td>
    </tr>
    <tr>
      <td>HR</td>
      <td>Draft a job description or rewrite a standard HR policy to make it clearer and easier to read.</td>
    </tr>
    <tr>
      <td>Operations</td>
      <td>Document a recurring process step-by-step — something your team does manually — so it can be handed off or improved.</td>
    </tr>
  </tbody>
</table>

<p>When you are done, <strong>commit the output</strong> (the prompt, the result, or your synthesis) to your GitHub repo. Write a commit message that explains what you did.</p>

<hr>

<h2>Step 5: Tell the Channel</h2>

<p>Post in the <strong>Citizen AI Developer Program</strong> Teams channel:</p>

<blockquote>
<p>"License received. First project: [one sentence about what you're building]. Zone [1/2/3]."</p>
</blockquote>

<p>This creates accountability, surfaces ideas others might use, and gives the program lead visibility into what the cohort is working on.</p>

<hr>

<h2>Ongoing Habits That Make This Work</h2>

<table>
  <thead>
    <tr>
      <th>Habit</th>
      <th>Frequency</th>
      <th>Why It Matters</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Commit to GitHub</td>
      <td>Every time you use Claude for work</td>
      <td>Highlander only sees committed work. No commits = invisible program value.</td>
    </tr>
    <tr>
      <td>Write commit messages that explain what happened</td>
      <td>Every commit</td>
      <td>"Add prompt and output for competitor research, Q2 2026" beats "update."</td>
    </tr>
    <tr>
      <td>Review Claude's output before using it</td>
      <td>Always</td>
      <td>You are responsible for what you ship. Claude is a draft engine, not an authority.</td>
    </tr>
    <tr>
      <td>Check your zone before starting</td>
      <td>Every new task</td>
      <td>The zone is determined by the data, not the task. When in doubt, go up a zone.</td>
    </tr>
    <tr>
      <td>Attend office hours</td>
      <td>Monthly</td>
      <td>This is where you get help, share what is working, and level up faster.</td>
    </tr>
  </tbody>
</table>

<hr>

<h2>Reference Links</h2>

<ul>
  <li><a href="https://ialta.sharepoint.com/sites/CitizenAI/SitePages/Module-9--The-Operating-Framework.aspx">Module 9: The Operating Framework</a> — zone system, approval process, escalation</li>
  <li><a href="https://ialta.sharepoint.com/sites/CitizenAI/SitePages/Module-13--Safety-and-Responsible-Use.aspx">Module 13: Safety and Responsible Use</a> — what never to put in Claude</li>
  <li><a href="https://ialta.sharepoint.com/sites/CitizenAI/SitePages/Module-15--GitHub-%E2%80%94-The-Collaboration-Layer.aspx">Module 15: GitHub</a> — METADATA.yaml template and GitHub workflow</li>
</ul>

<hr>

<p><em>Questions? Post in the <strong>Citizen AI Developer Program</strong> Teams channel or bring them to office hours.</em></p>
`.trim();

// ─── Helper: get digest + page ID ────────────────────────────────────────────
async function getDigest(playwrightPage) {
  return playwrightPage.evaluate(async ({ siteUrl }) => {
    const res = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST',
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const data = await res.json();
    return data.d.GetContextWebInformation.FormDigestValue;
  }, { siteUrl: SITE_URL });
}

// ─── Create or overwrite a page ───────────────────────────────────────────────
async function upsertPage(playwrightPage, title, html, forceUpdate = false) {
  return playwrightPage.evaluate(
    async ({ siteUrl, pageTitle, content, force }) => {
      const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
      });
      const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

      const escaped = pageTitle.replace(/'/g, "''");
      const check = await fetch(
        `${siteUrl}/_api/sitepages/pages?$filter=Title eq '${escaped}'&$select=Id,Title,CanvasContent1`,
        { headers: { Accept: 'application/json;odata=verbose' } }
      );
      const checkData = await check.json();
      let pageId = null;
      if (checkData.d?.results?.length > 0) {
        pageId = checkData.d.results[0].Id;
        if (!force) return { status: 'skipped', id: pageId, title: pageTitle };
      }

      if (!pageId) {
        const createRes = await fetch(`${siteUrl}/_api/sitepages/pages`, {
          method: 'POST',
          headers: {
            Accept: 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': digest,
          },
          body: JSON.stringify({ __metadata: { type: 'SP.Publishing.SitePage' }, Title: pageTitle, PromotedState: 0 }),
        });
        if (!createRes.ok) throw new Error(`Create failed ${createRes.status}: ${(await createRes.text()).slice(0, 200)}`);
        pageId = (await createRes.json()).d.Id;
      }

      await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      const instanceId = `text-${Math.random().toString(36).substr(2, 9)}`;
      const canvasContent = JSON.stringify([{
        position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 1, sectionFactor: 12, controlIndex: 1, isLayoutReflowing: false },
        controlType: 4, id: instanceId, innerHTML: content,
        editorType: 'CKEditor', textEditorVersion: 3, addedFromPersistedData: false, reservedHeight: 100, reservedWidth: 0,
      }]);

      const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*',
        },
        body: JSON.stringify({ __metadata: { type: 'SP.Publishing.SitePage' }, CanvasContent1: canvasContent }),
      });
      if (!saveRes.ok) throw new Error(`Save failed ${saveRes.status}: ${(await saveRes.text()).slice(0, 200)}`);

      const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}`, id: pageId, title: pageTitle };
    },
    { siteUrl: SITE_URL, pageTitle: title, content: html, force: forceUpdate }
  );
}

// ─── Update Module 15: insert METADATA.yaml section before Key Takeaways ─────
async function updateModule15(playwrightPage) {
  log('Updating Module 15 — adding METADATA.yaml section...');

  return playwrightPage.evaluate(
    async ({ siteUrl, metadataHtml }) => {
      const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
      });
      const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

      const res = await fetch(`${siteUrl}/_api/sitepages/pages(15)?$select=Id,Title,CanvasContent1`,
        { headers: { Accept: 'application/json;odata=verbose' } });
      const data = await res.json();
      const pageId = data.d.Id;
      const canvas = JSON.parse(data.d.CanvasContent1 || '[]');

      // Already has METADATA.yaml section?
      const allHtml = canvas.map(b => b.innerHTML || '').join('');
      if (allHtml.includes('METADATA.yaml') && allHtml.includes('Four Rules')) {
        return { status: 'already_updated', id: pageId };
      }

      // Find the text block and insert before Key Takeaways
      for (const block of canvas) {
        if (block.innerHTML && block.innerHTML.includes('Key Takeaways')) {
          // Insert metadata section before the Key Takeaways h2
          block.innerHTML = block.innerHTML.replace(
            /(<h2[^>]*>Key Takeaways<\/h2>)/,
            metadataHtml + '\n\n$1'
          );
          break;
        }
      }

      await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*',
        },
        body: JSON.stringify({ __metadata: { type: 'SP.Publishing.SitePage' }, CanvasContent1: JSON.stringify(canvas) }),
      });
      if (!saveRes.ok) return { status: `save_failed_${saveRes.status}` };

      const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}`, id: pageId };
    },
    { siteUrl: SITE_URL, metadataHtml: METADATA_YAML_HTML }
  );
}

// ─── Update Home page: add Day 1 Quick Start link ─────────────────────────────
async function addDay1LinkToHome(playwrightPage) {
  log('Updating Home page — adding Day 1 Quick Start link...');

  return playwrightPage.evaluate(async ({ siteUrl }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    const res = await fetch(`${siteUrl}/_api/sitepages/pages(1)?$select=Id,Title,CanvasContent1`,
      { headers: { Accept: 'application/json;odata=verbose' } });
    const data = await res.json();
    const canvas = JSON.parse(data.d.CanvasContent1 || '[]');

    const allHtml = canvas.map(b => b.innerHTML || '').join('');
    if (allHtml.includes('Day-1-Quick-Start') || allHtml.includes('Day 1 Quick Start')) {
      return { status: 'already_has_link' };
    }

    // Find the block with Important Notes / Module 0 link and add Day 1 link
    for (const block of canvas) {
      if (block.innerHTML && block.innerHTML.includes("Module-0")) {
        // Add Day 1 link after the Module 0 bullet
        block.innerHTML = block.innerHTML.replace(
          /(<li><a href="[^"]*Module-0[^"]*"[^>]*>.*?<\/a>.*?<\/li>)/,
          `$1\n  <li><a href="${siteUrl}/SitePages/Day-1-Quick-Start.aspx"><strong>Day 1 Quick Start</strong></a> — <em>after passing your Final Exam, start here</em></li>`
        );
        break;
      }
    }

    await fetch(`${siteUrl}/_api/sitepages/pages(1)/checkout`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });

    const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(1)`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*',
      },
      body: JSON.stringify({ __metadata: { type: 'SP.Publishing.SitePage' }, CanvasContent1: JSON.stringify(canvas) }),
    });
    if (!saveRes.ok) return { status: `save_failed_${saveRes.status}` };

    const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(1)/publish`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}` };
  }, { siteUrl: SITE_URL });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  if (!fs.existsSync(AUTH_PATH)) {
    log('ERROR: No auth session. Run: node playwright/auth/save-auth.js');
    process.exit(1);
  }

  log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_PATH });
  const page = await context.newPage();

  log('Loading SharePoint...');
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (page.url().includes('login.microsoftonline')) {
    log('ERROR: Session expired. Run: node playwright/auth/save-auth.js');
    await browser.close();
    process.exit(1);
  }

  // 1. Update Module 15
  const m15Result = await updateModule15(page);
  log(`Module 15: ${JSON.stringify(m15Result)}`);

  // 2. Create Day 1 Quick Start page
  const day1Result = await upsertPage(page, 'Day 1 Quick Start', DAY_1_HTML);
  log(`Day 1 Quick Start: ${JSON.stringify(day1Result)}`);

  // 3. Update Home page with Day 1 link
  const homeResult = await addDay1LinkToHome(page);
  log(`Home page: ${JSON.stringify(homeResult)}`);

  await browser.close();
  log('Done.');
})();
