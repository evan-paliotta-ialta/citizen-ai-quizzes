/**
 * Force-updates four pages on the CitizenAI SharePoint site:
 *   - Module 8: Tips, Tricks, and Power User Habits (removed Claude Code sections)
 *   - Module 11: Documents, Images, and Multimodal Input (fixed spreadsheet capabilities)
 *   - Day 1 Quick Start (removed Product/Engineering, added HR/Operations)
 *   - Capstone Guide (removed Product/Engineering, added HR)
 *
 * Bypasses the skip-if-exists check — always overwrites.
 *
 * Run: node 10-force-update-pages.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const { loadModuleContent } = require('./playwright/utils/content-loader');

const AUTH_PATH  = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL   = 'https://ialta.sharepoint.com/sites/CitizenAI';

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

// ── Force-upsert helper ────────────────────────────────────────────────────────
async function forceUpsert(playwrightPage, title, html) {
  log(`Updating: "${title}"...`);

  const result = await playwrightPage.evaluate(
    async ({ siteUrl, pageTitle, content }) => {
      const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
      });
      const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

      // Find existing page ID (or create new)
      const escaped = pageTitle.replace(/'/g, "''");
      const check = await fetch(
        `${siteUrl}/_api/sitepages/pages?$filter=Title eq '${escaped}'&$select=Id,Title`,
        { headers: { Accept: 'application/json;odata=verbose' } }
      );
      const checkData = await check.json();
      let pageId = checkData.d?.results?.length > 0 ? checkData.d.results[0].Id : null;

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
        if (!createRes.ok) return { status: `create_failed_${createRes.status}` };
        pageId = (await createRes.json()).d.Id;
      }

      // Checkout
      await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      // Write content
      const canvasContent = JSON.stringify([{
        position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 1, sectionFactor: 12, controlIndex: 1, isLayoutReflowing: false },
        controlType: 4,
        id: `text-${pageId}`,
        innerHTML: content,
        editorType: 'CKEditor',
        textEditorVersion: 3,
        addedFromPersistedData: false,
        reservedHeight: 100,
        reservedWidth: 0,
      }]);

      const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          'X-HTTP-Method': 'MERGE',
          'IF-MATCH': '*',
        },
        body: JSON.stringify({ __metadata: { type: 'SP.Publishing.SitePage' }, CanvasContent1: canvasContent }),
      });
      if (!saveRes.ok) return { status: `save_failed_${saveRes.status}`, error: (await saveRes.text()).slice(0, 200) };

      const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}`, id: pageId };
    },
    { siteUrl: SITE_URL, pageTitle: title, content: html }
  );

  log(`  → ${result.status}${result.error ? ': ' + result.error : ''}`);
  return result;
}

// ── Day 1 Quick Start HTML ─────────────────────────────────────────────────────
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

<p>If you are using Claude.ai in a browser or the mobile app instead — stop. Those do not have the program's safety controls. All company work runs through Claude Desktop. This is a program requirement, not a preference.</p>

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

<h2>Step 6 (Optional): Set Up Claude Code</h2>

<p><em>Claude Desktop is all you need to complete this course. This step is for anyone who wants to go further — using Claude directly in the terminal, working with files and folders on your machine, and running more powerful automations. If this sounds like you, follow the steps below from scratch.</em></p>

<p style="background-color:#fff8e1;border-left:4px solid #f0a500;padding:14px 18px;margin:16px 0;">
  <strong>Zone reminder:</strong> Claude Code has access to your local files and can run commands on your machine. That power comes with responsibility. Apply the same zone framework — check what data you are working with before you start a session.
</p>

<h3>What You Are Installing</h3>

<table>
  <thead>
    <tr>
      <th>Tool</th>
      <th>What it is</th>
      <th>Why you need it</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Xcode Command Line Tools</td>
      <td>Apple's developer utilities</td>
      <td>Required by almost everything else. Installs git and core build tools.</td>
    </tr>
    <tr>
      <td>Homebrew</td>
      <td>A package manager for Mac</td>
      <td>Makes installing software from the terminal simple and reliable.</td>
    </tr>
    <tr>
      <td>Node.js</td>
      <td>A JavaScript runtime</td>
      <td>Claude Code runs on Node. You need it installed before Claude Code will work.</td>
    </tr>
    <tr>
      <td>Claude Code</td>
      <td>Claude in your terminal</td>
      <td>Gives Claude access to your files, folders, and command line — far more powerful than the desktop app for technical work.</td>
    </tr>
  </tbody>
</table>

<h3>Step-by-Step Installation</h3>

<p><strong>First: open your Terminal.</strong><br/>
Press <strong>Cmd + Space</strong>, type <strong>Terminal</strong>, and hit Enter. This is the command line — a text interface to your computer. Everything below gets typed (or pasted) here.</p>

<p><strong>1. Install Xcode Command Line Tools</strong></p>
<pre><code>xcode-select --install</code></pre>
<p>A pop-up will appear asking you to install. Click Install and wait — this takes a few minutes. If you see "already installed," skip to step 2.</p>

<p><strong>2. Install Homebrew</strong></p>
<pre><code>/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"</code></pre>
<p>Paste the entire line above and press Enter. It will ask for your Mac password — type it and press Enter (the cursor won't move when you type a password, that is normal). This takes 2–5 minutes.</p>

<p>When it finishes, Homebrew will print instructions to add itself to your PATH. They look like this — <strong>run the two lines it gives you</strong> (they start with <code>echo</code> and <code>eval</code>). If you skip this, the <code>brew</code> command won't be found.</p>

<p>Verify it worked:</p>
<pre><code>brew --version</code></pre>
<p>You should see a version number. If you see "command not found," re-run the PATH lines Homebrew printed.</p>

<p><strong>3. Install Node.js</strong></p>
<pre><code>brew install node</code></pre>
<p>Homebrew handles everything. When it finishes, verify:</p>
<pre><code>node --version
npm --version</code></pre>
<p>Both should print version numbers (e.g. <code>v22.x.x</code> and <code>10.x.x</code>). If either says "command not found," close the Terminal window, reopen it, and try again.</p>

<p><strong>4. Install Claude Code</strong></p>
<pre><code>npm install -g @anthropic-ai/claude-code</code></pre>
<p>The <code>-g</code> flag installs it globally so you can run <code>claude</code> from any folder. When it finishes:</p>
<pre><code>claude --version</code></pre>
<p>You should see the Claude Code version printed. If you see "command not found," close and reopen Terminal, then try again.</p>

<h3>Starting Claude Code</h3>

<p><strong>Navigate to your project folder first.</strong> Claude Code works on the folder you launch it from — it reads files in that folder and its subfolders. Use <code>cd</code> to navigate:</p>
<pre><code>cd ~/Documents/my-project</code></pre>
<p>Replace <code>my-project</code> with your actual folder name. Not sure where your folder is? In Finder, right-click it and choose <strong>Get Info</strong> — the path is listed under "Where."</p>

<p><strong>Start a session:</strong></p>
<pre><code>claude</code></pre>
<p>The first time you run this, Claude will ask you to log in with your Anthropic account. Use the same account as your Claude Desktop license. Once authenticated, you will see the Claude Code prompt and can start typing.</p>

<p><strong>Start without permission prompts (use carefully):</strong></p>
<pre><code>claude --dangerously-skip-permissions</code></pre>
<p>This bypasses all approval prompts — Claude will read, write, and run commands without asking. It is useful for trusted, self-contained projects where you do not want interruptions. It is <strong>not</strong> appropriate when you are working with anything sensitive or when Claude has access to production systems. Per the zone framework, this flag on anything above a personal learning project requires manager awareness and a full audit trail in GitHub.</p>

<h3>Your First Claude Code Session</h3>

<p>Once you are in a session, try these to get oriented:</p>
<pre><code>What files are in this folder?</code></pre>
<pre><code>Read README.md and explain what this project does.</code></pre>
<pre><code>Help me write a prompt that I can reuse for [describe a recurring task].</code></pre>

<p>Type <strong>/help</strong> to see all available commands. Type <strong>q</strong> or press <strong>Ctrl+C</strong> to exit.</p>

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

// ── Capstone Guide HTML ────────────────────────────────────────────────────────
const CAPSTONE_HTML = `
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
`.trim();

// ── Main ───────────────────────────────────────────────────────────────────────
(async () => {
  console.log('=== Force-updating 4 pages on CitizenAI SharePoint ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_PATH });
  const page    = await context.newPage();
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

  const results = {};

  // 1. Module 8
  results.mod8 = await forceUpsert(
    page,
    'Module 8: Tips, Tricks, and Power User Habits',
    loadModuleContent('module-08-tips-and-tricks')
  );

  // 2. Module 11
  results.mod11 = await forceUpsert(
    page,
    'Module 11: Documents, Images, and Multimodal Input',
    loadModuleContent('module-11-documents-and-multimodal')
  );

  // 3. Day 1 Quick Start
  results.day1 = await forceUpsert(
    page,
    'Day 1 Quick Start — You\'ve Earned Your License',
    DAY_1_HTML
  );

  // 4. Capstone Guide
  results.capstone = await forceUpsert(
    page,
    'Capstone Guide',
    CAPSTONE_HTML
  );

  console.log('\n═══ Results ═══');
  for (const [key, val] of Object.entries(results)) {
    const icon = val.status === 'published' ? '✓' : '✗';
    console.log(`  ${icon} ${key}: ${val.status}`);
  }

  await browser.close();
  console.log('\nDone.\n');
})();
