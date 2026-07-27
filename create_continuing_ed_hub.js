/**
 * create_continuing_ed_hub.js
 *
 * Creates the Continuing Education Hub + 4 subpages on the Helm SharePoint
 * site, and adds one new card to Home linking to the Hub. Does not touch
 * the existing module table or certification flow.
 *
 * Run: node create_continuing_ed_hub.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.helm.json');
const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';

const PAGES = [
  {
    title: 'Continuing Education Hub',
    html: `
<h1>Continuing Education Hub</h1>
<p><em>Everything after certification — office hours, mandatory monthly sessions, and quarterly 1:1s. This does not replace the course; it's what keeps the program alive after someone earns their license.</em></p>
<hr>
<h2>The Three Cadences</h2>
<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background-color:#000D2D;color:white;">
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Cadence</th>
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Purpose</th>
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Attendance</th>
</tr></thead>
<tbody>
<tr style="background-color:#f9f9f9;">
<td style="padding:10px;border:1px solid #ccc;"><strong>Weekly Office Hours</strong></td>
<td style="padding:10px;border:1px solid #ccc;">Low-stakes, drop-in support — bring your blockers before they turn into abandonment. Rotates: open Q&amp;A, feature spotlight, citizen show-and-tell.</td>
<td style="padding:10px;border:1px solid #ccc;">Optional</td>
</tr>
<tr>
<td style="padding:10px;border:1px solid #ccc;"><strong>Monthly Mandatory Sessions</strong></td>
<td style="padding:10px;border:1px solid #ccc;">Structured reinforcement — deep dives, citizen presentations, cross-team panels, Highlander metrics reviews, safety refreshers.</td>
<td style="padding:10px;border:1px solid #ccc;">Mandatory</td>
</tr>
<tr style="background-color:#f9f9f9;">
<td style="padding:10px;border:1px solid #ccc;"><strong>Quarterly 1:1s</strong></td>
<td style="padding:10px;border:1px solid #ccc;">Individual coaching — review your Highlander/GitHub activity, check Capability Maturity progress, set one goal for next quarter. Not recorded.</td>
<td style="padding:10px;border:1px solid #ccc;">Required, scheduled individually</td>
</tr>
</tbody>
</table>
<hr>
<h2>Browse</h2>
<ul>
<li><a href="/sites/citizenai/SitePages/Office-Hours-Archive.aspx">Office Hours Archive</a> — past drop-in sessions, by date</li>
<li><a href="/sites/citizenai/SitePages/Monthly-Session-Library.aspx">Monthly Session Library</a> — mandatory session recordings</li>
<li><a href="/sites/citizenai/SitePages/Feature-Spotlight-Index.aspx">Feature Spotlight Index</a> — which advanced capability was covered when, cross-linked to the course module it extends</li>
<li><a href="/sites/citizenai/SitePages/1-1-Prep-Resources.aspx">1:1 Prep Resources</a> — the self-assessment template used ahead of every quarterly 1:1</li>
</ul>
<hr>
<p><a href="/sites/citizenai/SitePages/Home.aspx" style="color:#0042E0;">← Back to Course Home</a></p>
`,
  },
  {
    title: 'Office Hours Archive',
    html: `
<h1>Office Hours Archive</h1>
<p>Weekly, drop-in, optional. Format rotates: Week 1 &amp; 4 open Q&amp;A, Week 2 feature spotlight, Week 3 citizen show-and-tell. Recordings are raw (no production polish needed) — the point is catching up, not watching a produced video.</p>
<hr>
<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background-color:#000D2D;color:white;">
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Date</th>
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Format</th>
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Recording</th>
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Notes</th>
</tr></thead>
<tbody>
<tr><td style="padding:10px;border:1px solid #ccc;" colspan="4"><em>No sessions logged yet — add a row here after each week's office hours.</em></td></tr>
</tbody>
</table>
<hr>
<p><a href="/sites/citizenai/SitePages/Continuing-Education-Hub.aspx" style="color:#0042E0;">← Back to Continuing Education Hub</a></p>
`,
  },
  {
    title: 'Monthly Session Library',
    html: `
<h1>Monthly Session Library</h1>
<p>Mandatory. Ownership rotates — program-lead-led deep dive, citizen presentation, cross-team panel, Highlander metrics review, or safety/zone refresher. Recording quality (especially audio) matters more here than for office hours, since this is the primary way someone who missed a mandatory session catches up.</p>
<hr>
<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background-color:#000D2D;color:white;">
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Date</th>
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Session Type</th>
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Presenter</th>
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Recording</th>
</tr></thead>
<tbody>
<tr><td style="padding:10px;border:1px solid #ccc;" colspan="4"><em>No sessions logged yet — add a row here after each month's mandatory session.</em></td></tr>
</tbody>
</table>
<hr>
<p><a href="/sites/citizenai/SitePages/Continuing-Education-Hub.aspx" style="color:#0042E0;">← Back to Continuing Education Hub</a></p>
`,
  },
  {
    title: 'Feature Spotlight Index',
    html: `
<h1>Feature Spotlight Index</h1>
<p>A running log of which advanced Claude capability was covered in which office-hours spotlight, cross-linked back to the course module it extends — so a citizen who missed the live session (or wants a refresher) can find both the recording and the underlying course content in one place.</p>
<hr>
<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background-color:#000D2D;color:white;">
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Date</th>
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Feature Covered</th>
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Linked Course Module</th>
<th style="padding:10px;border:1px solid #ccc;text-align:left;">Recording</th>
</tr></thead>
<tbody>
<tr><td style="padding:10px;border:1px solid #ccc;">—</td><td style="padding:10px;border:1px solid #ccc;">Extended Thinking</td><td style="padding:10px;border:1px solid #ccc;"><a href="/sites/citizenai/SitePages/Module-8--Tips,-Tricks,-and-Power-User-Habits.aspx">Module 8</a></td><td style="padding:10px;border:1px solid #ccc;"><em>not yet recorded</em></td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">—</td><td style="padding:10px;border:1px solid #ccc;">Native Connectors</td><td style="padding:10px;border:1px solid #ccc;"><a href="/sites/citizenai/SitePages/Module-14--MCP,-Agents,-and-RAG.aspx">Module 14</a></td><td style="padding:10px;border:1px solid #ccc;"><em>not yet recorded</em></td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">—</td><td style="padding:10px;border:1px solid #ccc;">Routines</td><td style="padding:10px;border:1px solid #ccc;"><a href="/sites/citizenai/SitePages/Module-14--MCP,-Agents,-and-RAG.aspx">Module 14</a></td><td style="padding:10px;border:1px solid #ccc;"><em>not yet recorded</em></td></tr>
<tr><td style="padding:10px;border:1px solid #ccc;">—</td><td style="padding:10px;border:1px solid #ccc;">Shared Projects</td><td style="padding:10px;border:1px solid #ccc;"><a href="/sites/citizenai/SitePages/Module-10--Claude-Desktop-Projects.aspx">Module 10</a></td><td style="padding:10px;border:1px solid #ccc;"><em>not yet recorded</em></td></tr>
</tbody>
</table>
<p style="color:#888;font-size:13px;font-style:italic;">Rows above are placeholders matching the newest course content — replace "not yet recorded" with the actual recording link once each spotlight happens, and add new rows for anything else covered.</p>
<hr>
<p><a href="/sites/citizenai/SitePages/Continuing-Education-Hub.aspx" style="color:#0042E0;">← Back to Continuing Education Hub</a></p>
`,
  },
  {
    title: '1:1 Prep Resources',
    html: `
<h1>1:1 Prep Resources</h1>
<p>Quarterly 1:1s are individual coaching, not a performance review. Not recorded. Use this template before each session.</p>
<hr>
<h2>Citizen Self-Assessment (fill out before your 1:1)</h2>
<pre><code>What did I build this quarter?
[Describe real work — link to your GitHub repo/commits if helpful]

What's blocking me?
[Be specific — a tool gap, a skill gap, a process gap, anything]

What do I want to learn next?
[One or two things — a course module you haven't gone deep on, a capability you want to try]</code></pre>
<h2>Admin Checklist (during the 1:1)</h2>
<ol>
<li>Review the citizen's Highlander/GitHub activity for the quarter — what did they actually ship, tied back to their OKR</li>
<li>Capability Maturity check-in — has their work moved from Level 2 (Experimenting) toward Level 3 (Structured)?</li>
<li>Set one concrete goal for next quarter</li>
<li>Log any action items in your own tracker (not on this page) so follow-through can be checked next quarter</li>
</ol>
<hr>
<p><a href="/sites/citizenai/SitePages/Continuing-Education-Hub.aspx" style="color:#0042E0;">← Back to Continuing Education Hub</a></p>
`,
  },
];

async function createOrUpdatePage(tab, pageTitle, content) {
  const result = await tab.evaluate(async ({ siteUrl, pageTitle, content }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    const escapedTitle = pageTitle.replace(/'/g, "''");
    const checkRes = await fetch(
      `${siteUrl}/_api/sitepages/pages?$filter=Title eq '${escapedTitle}'&$select=Id,Title`,
      { headers: { Accept: 'application/json;odata=verbose' } }
    );
    const checkData = await checkRes.json();

    let pageId = null;
    if (checkData.d && checkData.d.results.length > 0) {
      pageId = checkData.d.results[0].Id;
    } else {
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
        return { status: `create_failed_${createRes.status}`, detail: errText.slice(0, 300) };
      }
      pageId = (await createRes.json()).d.Id;
    }

    await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });

    const instanceId = `text-${Math.random().toString(36).substr(2, 9)}`;
    const canvasContent = JSON.stringify([{
      position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 1, sectionFactor: 12, controlIndex: 1, isLayoutReflowing: false },
      controlType: 4, id: instanceId, innerHTML: content, editorType: 'CKEditor',
      textEditorVersion: 3, addedFromPersistedData: false, reservedHeight: 100, reservedWidth: 0,
    }]);

    const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*',
      },
      body: JSON.stringify({ __metadata: { type: 'SP.Publishing.SitePage' }, CanvasContent1: canvasContent }),
    });
    if (!saveRes.ok) {
      const errText = await saveRes.text();
      return { status: `save_failed_${saveRes.status}`, detail: errText.slice(0, 300) };
    }

    const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}`, pageId };
  }, { siteUrl: SITE_URL, pageTitle, content });

  return result;
}

async function addHomeCard(tab) {
  const result = await tab.evaluate(async ({ siteUrl }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    const getRes = await fetch(`${siteUrl}/_api/sitepages/pages(1)?$select=Id,CanvasContent1`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const page = (await getRes.json()).d;
    const canvas = JSON.parse(page.CanvasContent1);

    const cardHtml = `
<hr>
<table style="width:100%;border-collapse:collapse;margin-top:16px;">
  <tbody><tr>
    <td style="padding:20px;background-color:#000D2D;text-align:center;">
      <a href="/sites/citizenai/SitePages/Continuing-Education-Hub.aspx" style="color:white;font-weight:700;font-size:16px;text-decoration:none;">
        → Continuing Education Hub
      </a>
      <p style="color:#aac4ff;font-size:13px;margin-top:8px;margin-bottom:0;">Office hours, monthly sessions, and 1:1 resources for citizens who've already earned their license.</p>
    </td>
  </tr></tbody>
</table>`;

    let alreadyThere = false;
    canvas.forEach(block => {
      if (block.innerHTML && block.innerHTML.includes('Continuing Education Hub')) alreadyThere = true;
    });
    if (alreadyThere) return { status: 'already_present' };

    const lastBlock = canvas[canvas.length - 1];
    if (lastBlock && lastBlock.innerHTML !== undefined) {
      lastBlock.innerHTML += cardHtml;
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

  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 10 });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const tab = await ctx.newPage();
  await tab.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(5000);

  for (const p of PAGES) {
    const result = await createOrUpdatePage(tab, p.title, p.html);
    log(`  "${p.title}": ${JSON.stringify(result)}`);
    await sleep(1000);
  }

  const homeResult = await addHomeCard(tab);
  log(`  Home card: ${JSON.stringify(homeResult)}`);

  await browser.close();
}

main();
