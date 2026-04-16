/**
 * STEP 8 — Full site redesign with iAltA branding.
 *
 * Run with:  node scripts/07-redesign-site.js
 *
 * What it does:
 *  1. Applies iAltA brand theme (navy #000D2D + electric blue #0042E0)
 *  2. Queries actual page URLs from SharePoint
 *  3. Rewrites the Home page with proper navigation and clear user journey
 *  4. Adds a navigation header (Next Module link) to each module page
 *  5. Updates each quiz page with a direct link to the Form
 *  6. Updates SharePoint top navigation
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { MODULES } = require('../utils/content-loader');

const AUTH_PATH = path.resolve(__dirname, '../', config.authStatePath);
const FORMS_URL_FILE = path.resolve(__dirname, '../forms-urls.json');
const SITE_URL = `https://${config.tenant}.sharepoint.com/sites/${config.siteSlug}`;

// ── iAltA Brand Theme ─────────────────────────────────────────────────────────
const IALTA_THEME = {
  name: 'iAltA',
  palette: {
    themePrimary: '#0042E0',
    themeLighterAlt: '#f0f4ff',
    themeLighter: '#c5d5fb',
    themeLight: '#97b3f7',
    themeTertiary: '#4a7aef',
    themeSecondary: '#1a57e6',
    themeDarkAlt: '#003bc9',
    themeDark: '#0031a9',
    themeDarker: '#00257d',
    neutralLighterAlt: '#f8f8f8',
    neutralLighter: '#f4f4f4',
    neutralLight: '#eaeaea',
    neutralQuaternaryAlt: '#dadada',
    neutralQuaternary: '#d0d0d0',
    neutralTertiaryAlt: '#c8c8c8',
    neutralTertiary: '#8a8fa6',
    neutralSecondary: '#333D57',
    neutralPrimaryAlt: '#1a1f33',
    neutralPrimary: '#000D2D',
    neutralDark: '#000820',
    black: '#000000',
    white: '#ffffff',
    primaryBackground: '#ffffff',
    primaryText: '#000D2D',
    bodyBackground: '#ffffff',
    bodyText: '#333D57',
    disabledBackground: '#f4f4f4',
    disabledText: '#c8c8c8',
  },
  isInverted: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getDigest(page) {
  const res = await page.evaluate(async (siteUrl) => {
    const r = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST',
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const d = await r.json();
    return d.d.GetContextWebInformation.FormDigestValue;
  }, SITE_URL);
  return res;
}

async function mergePage(page, pageId, canvasContent, digest) {
  return page.evaluate(async ({ siteUrl, pageId, canvasContent, digest }) => {
    // Checkout
    await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
      method: 'POST',
      headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    // Merge
    const r = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
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
        CanvasContent1: JSON.stringify([{
          position: {
            layoutIndex: 1,
            zoneIndex: 1,
            sectionIndex: 1,
            sectionFactor: 12,
            controlIndex: 1,
            isLayoutReflowing: false,
          },
          controlType: 4,
          id: `text-${pageId}`,
          innerHTML: canvasContent,
          editorType: 'CKEditor',
          textEditorVersion: 3,
          addedFromPersistedData: false,
          reservedHeight: 100,
          reservedWidth: 0,
        }]),
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      return { ok: false, status: r.status, error: err.substring(0, 200) };
    }
    // Publish
    await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
      method: 'POST',
      headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    return { ok: true };
  }, { siteUrl: SITE_URL, pageId, canvasContent, digest });
}

// ── Build home page HTML (SharePoint-safe — no div+style, no flexbox/grid) ───
function buildHomePage(pageMap, formUrls) {
  const mod1Url = pageMap['Module 1: What Claude Is (and Isn\'t)'] || `${SITE_URL}/SitePages/Home.aspx`;

  // 16 shades of blue: darkest (#000D2D) → brightest (#0055E8), all readable with white text
  const quizShades = [
    '#000D2D','#001239','#001746','#001B52',
    '#00205F','#00256B','#002A78','#002E84',
    '#003391','#00389D','#003DAA','#0041B6',
    '#0046C3','#004BCF','#0050DC','#0055E8',
  ];

  const moduleRows = MODULES.map(m => {
    const url = pageMap[m.title] || '#';
    const quizUrl = pageMap[`Quiz — ${m.title}`] || '#';
    const isSafety = m.id === 13;
    const rowBg = m.id % 2 === 0 ? '#ffffff' : '#f8f9fc';
    const quizColor = quizShades[m.id - 1];
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eaeaea;color:#0042E0;font-weight:700;text-align:center;background-color:${rowBg};">${m.id}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eaeaea;background-color:${rowBg};">
        <a href="${url}" style="color:#000D2D;font-weight:600;text-decoration:none;">${m.title}</a>
        ${isSafety ? ' <strong style="color:#c0392b;">(perfect score required)</strong>' : ''}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #eaeaea;text-align:center;background-color:${quizColor};">
        <a href="${quizUrl}" style="color:white;text-decoration:none;font-size:13px;font-weight:600;">Quiz ${m.id}</a>
      </td>
    </tr>`;
  }).join('\n');

  const finalExamUrl = pageMap['Final Exam'] || '#';

  return `<h1>Citizen AI Developer Program</h1>
<p><em>Modernizing how iAltA works — one tool at a time.</em></p>
<hr/>

<h2>Welcome</h2>
<p>This program will teach you to use Claude and AI tools effectively in your daily work. No technical background required. When you finish, you earn your Claude Desktop license.</p>

<h2>How the Course Works</h2>
<table style="width:100%;border-collapse:collapse;border:1px solid #e0e8f8;">
  <tr>
    <td style="padding:14px 18px;background-color:#0042E0;color:white;font-weight:700;font-size:18px;width:48px;text-align:center;">1</td>
    <td style="padding:14px 18px;background-color:#f0f4ff;color:#000D2D;font-weight:600;border-bottom:1px solid #e0e8f8;">Read each module in order</td>
  </tr>
  <tr>
    <td style="padding:14px 18px;background-color:#0042E0;color:white;font-weight:700;font-size:18px;text-align:center;">2</td>
    <td style="padding:14px 18px;background-color:#ffffff;color:#000D2D;font-weight:600;border-bottom:1px solid #e0e8f8;">Pass the quiz at the end of each module</td>
  </tr>
  <tr>
    <td style="padding:14px 18px;background-color:#0042E0;color:white;font-weight:700;font-size:18px;text-align:center;">3</td>
    <td style="padding:14px 18px;background-color:#f0f4ff;color:#000D2D;font-weight:600;border-bottom:1px solid #e0e8f8;">Pass the Final Exam (80%+) to receive your Claude Desktop license</td>
  </tr>
  <tr>
    <td style="padding:14px 18px;background-color:#0042E0;color:white;font-weight:700;font-size:18px;text-align:center;">4</td>
    <td style="padding:14px 18px;background-color:#ffffff;color:#000D2D;font-weight:600;">Submit your Capstone exercise within 5 days of receiving your license</td>
  </tr>
</table>

<p>&nbsp;</p>
<p><strong><a href="${mod1Url}" style="color:#0042E0;font-size:18px;">→ Start with Module 1: What Claude Is (and Isn't)</a></strong></p>
<hr/>

<h2>Course Modules</h2>
<p>Each module links to the lesson. The coloured quiz button takes you to the submission form.</p>

<table style="width:100%;border-collapse:collapse;border:1px solid #eaeaea;">
  <thead>
    <tr style="background-color:#000D2D;">
      <th style="padding:10px 14px;color:white;text-align:center;width:40px;">#</th>
      <th style="padding:10px 14px;color:white;text-align:left;">Module</th>
      <th style="padding:10px 14px;color:white;text-align:center;width:80px;">Quiz</th>
    </tr>
  </thead>
  <tbody>
    ${moduleRows}
  </tbody>
</table>

<p>&nbsp;</p>
<p><strong><a href="${finalExamUrl}" style="color:#0042E0;">→ Final Exam</a></strong> — 25 questions, 80% to pass</p>
<hr/>

<h2>Important Notes</h2>
<ul>
  <li><strong>Module 13 (Safety)</strong> requires a perfect 5/5 score. This is non-negotiable.</li>
  <li>Do not share confidential client data, PII, or unreleased deal information with Claude.</li>
  <li>Verify any specific facts, numbers, or dates Claude gives you before using them in client materials.</li>
</ul>

<p>&nbsp;</p>
<p>Questions? Post in the <strong>Citizen AI Developer Program</strong> Teams channel.</p>`;
}

// ── Build module page footer HTML (nav strip) ─────────────────────────────────
function buildModuleFooter(mod, nextMod, pageMap, formUrls) {
  const quizUrl = pageMap[`Quiz — ${mod.title}`] || '#';
  const formKey = `quiz_${mod.id}`;
  const formUrl = formUrls[formKey] ? formUrls[formKey].url : null;

  let navHtml = `<hr/>
<table style="width:100%;border-collapse:collapse;margin-top:16px;border:1px solid #e0e8f8;">
  <tr>
    <td style="padding:16px 20px;background-color:#0042E0;text-align:center;width:50%;">
      <a href="${quizUrl}" style="color:white;font-weight:700;font-size:15px;text-decoration:none;">
        → Take the Quiz for Module ${mod.id}
      </a>`;

  if (formUrl) {
    navHtml += `<br/><a href="${formUrl}" style="color:#c5d5fb;font-size:12px;text-decoration:none;">or submit answers directly</a>`;
  }

  navHtml += `</td>`;

  if (nextMod) {
    const nextUrl = pageMap[nextMod.title] || '#';
    navHtml += `
    <td style="padding:16px 20px;background-color:#f0f4ff;text-align:center;width:50%;border-left:1px solid #e0e8f8;">
      <a href="${nextUrl}" style="color:#000D2D;font-weight:700;font-size:15px;text-decoration:none;">
        Next: Module ${nextMod.id} →<br/>
        <span style="font-size:12px;font-weight:400;color:#333D57;">${nextMod.title.replace(/^Module \d+: /, '')}</span>
      </a>
    </td>`;
  }

  navHtml += `
  </tr>
</table>`;

  return navHtml;
}

// ── Build quiz page HTML (links Form directly) ────────────────────────────────
function buildQuizFooter(mod, formUrls, pageMap) {
  const formKey = `quiz_${mod.id}`;
  const formUrl = formUrls[formKey] ? formUrls[formKey].url : null;
  if (!formUrl) return '';

  const nextMod = MODULES.find(m => m.id === mod.id + 1);

  let html = `<hr/>
<table style="width:100%;border-collapse:collapse;margin-top:16px;border:1px solid #e0e8f8;">
  <tr>
    <td style="padding:18px 20px;background-color:#0042E0;text-align:center;width:50%;">
      <a href="${formUrl}" style="color:white;font-weight:700;font-size:16px;text-decoration:none;">
        → Submit Quiz ${mod.id} Answers
      </a>
    </td>`;

  if (nextMod) {
    const nextModUrl = pageMap ? (pageMap[nextMod.title] || '#') : '#';
    html += `
    <td style="padding:18px 20px;background-color:#f0f4ff;text-align:center;width:50%;border-left:1px solid #e0e8f8;">
      <a href="${nextModUrl}" style="color:#000D2D;font-weight:700;font-size:15px;text-decoration:none;">
        After passing → Module ${nextMod.id}<br/>
        <span style="font-size:12px;font-weight:400;color:#333D57;">${nextMod.title.replace(/^Module \d+: /, '')}</span>
      </a>
    </td>`;
  }

  html += `
  </tr>
</table>`;
  return html;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('=== iAltA Site Redesign ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_PATH });
  const page = await context.newPage();
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

  // Load form URLs
  const formUrls = fs.existsSync(FORMS_URL_FILE)
    ? JSON.parse(fs.readFileSync(FORMS_URL_FILE, 'utf8'))
    : {};

  // ── Step 1: Apply iAltA theme ──────────────────────────────────────────────
  console.log('1. Applying iAltA brand theme...');
  const themeResult = await page.evaluate(async ({ siteUrl, theme }) => {
    const dR = await fetch(`${siteUrl}/_api/contextinfo`, { method: 'POST', headers: { Accept: 'application/json;odata=verbose' } });
    const dD = await dR.json();
    const digest = dD.d.GetContextWebInformation.FormDigestValue;
    const r = await fetch(`${siteUrl}/_api/thememanager/ApplyTheme`, {
      method: 'POST',
      headers: { Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': digest },
      body: JSON.stringify({ name: theme.name, themeJson: JSON.stringify(theme) }),
    });
    return { ok: r.ok, status: r.status };
  }, { siteUrl: SITE_URL, theme: IALTA_THEME });
  console.log(themeResult.ok ? '   ✓ Theme applied' : `   ⚠ Theme: ${themeResult.status}`);

  // ── Step 2: Query all page URLs ────────────────────────────────────────────
  console.log('\n2. Querying page URLs...');
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
  const allPages = await page.evaluate(async (siteUrl) => {
    const r = await fetch(
      `${siteUrl}/_api/sitepages/pages?$select=Id,Title,Url&$top=100`,
      { headers: { Accept: 'application/json;odata=verbose' } }
    );
    const d = await r.json();
    return d.d ? d.d.results : [];
  }, SITE_URL);

  // Build title → full URL map
  const pageMap = {};
  for (const p of allPages) {
    const fullUrl = `${SITE_URL}/${p.Url}`;
    pageMap[p.Title] = fullUrl;
  }
  console.log(`   ✓ Found ${allPages.length} pages`);

  // Build title → Id map
  const pageIdMap = {};
  for (const p of allPages) {
    pageIdMap[p.Title] = p.Id;
  }

  const digest = await getDigest(page);

  // ── Step 3: Rewrite Home page ──────────────────────────────────────────────
  console.log('\n3. Rewriting Home page...');
  const homeId = pageIdMap['Home'];
  if (homeId) {
    const homeHtml = buildHomePage(pageMap, formUrls);
    const r = await mergePage(page, homeId, homeHtml, digest);
    console.log(r.ok ? '   ✓ Home page updated' : `   ✗ Home failed: ${r.error}`);
  } else {
    console.log('   ✗ Home page not found');
  }

  // ── Step 4: Add nav footer to each module page ─────────────────────────────
  console.log('\n4. Adding navigation footers to module pages...');
  for (const mod of MODULES) {
    const nextMod = MODULES.find(m => m.id === mod.id + 1) || null;
    const pageId = pageIdMap[mod.title];
    if (!pageId) {
      console.log(`   ⚠ Module ${mod.id} not found`);
      continue;
    }

    // Read existing page content
    const existing = await page.evaluate(async ({ siteUrl, pageId }) => {
      const r = await fetch(
        `${siteUrl}/_api/sitepages/pages(${pageId})?$select=CanvasContent1`,
        { headers: { Accept: 'application/json;odata=verbose' } }
      );
      const d = await r.json();
      if (!d.d) return null;
      // Extract innerHTML from CanvasContent1
      try {
        const canvas = JSON.parse(d.d.CanvasContent1 || '[]');
        return canvas.length > 0 ? canvas[0].innerHTML : null;
      } catch(e) { return null; }
    }, { siteUrl: SITE_URL, pageId });

    const footer = buildModuleFooter(mod, nextMod, pageMap, formUrls);
    const newContent = (existing || '') + footer;
    const r = await mergePage(page, pageId, newContent, digest);
    console.log(r.ok ? `   ✓ Module ${mod.id}` : `   ✗ Module ${mod.id}: ${r.error}`);
  }

  // ── Step 5: Add form links to quiz pages ───────────────────────────────────
  console.log('\n5. Linking quiz pages to Forms...');
  for (const mod of MODULES) {
    const quizTitle = `Quiz — ${mod.title}`;
    const pageId = pageIdMap[quizTitle];
    if (!pageId) { console.log(`   ⚠ Quiz ${mod.id} page not found`); continue; }

    const existing = await page.evaluate(async ({ siteUrl, pageId }) => {
      const r = await fetch(
        `${siteUrl}/_api/sitepages/pages(${pageId})?$select=CanvasContent1`,
        { headers: { Accept: 'application/json;odata=verbose' } }
      );
      const d = await r.json();
      if (!d.d) return null;
      try {
        const canvas = JSON.parse(d.d.CanvasContent1 || '[]');
        return canvas.length > 0 ? canvas[0].innerHTML : null;
      } catch(e) { return null; }
    }, { siteUrl: SITE_URL, pageId });

    const footer = buildQuizFooter(mod, formUrls, pageMap);
    const newContent = (existing || '') + footer;
    const r = await mergePage(page, pageId, newContent, digest);
    console.log(r.ok ? `   ✓ Quiz ${mod.id}` : `   ✗ Quiz ${mod.id}: ${r.error}`);
  }

  // ── Step 6: Update site navigation ────────────────────────────────────────
  console.log('\n6. Updating site navigation...');
  const navResult = await page.evaluate(async ({ siteUrl, pageMap }) => {
    const dR = await fetch(`${siteUrl}/_api/contextinfo`, { method: 'POST', headers: { Accept: 'application/json;odata=verbose' } });
    const dD = await dR.json();
    const digest = dD.d.GetContextWebInformation.FormDigestValue;

    const addNode = async (title, url) => {
      const r = await fetch(`${siteUrl}/_api/web/navigation/topnavigationbar`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
        body: JSON.stringify({
          __metadata: { type: 'SP.NavigationNode' },
          Title: title,
          Url: url,
          IsExternal: false,
        }),
      });
      return r.ok || r.status === 201;
    };

    const results = {};
    const mod1Url = pageMap["Module 1: What Claude Is (and Isn't)"] || siteUrl;
    const finalUrl = pageMap['Final Exam'] || siteUrl;
    const adminUrl = pageMap['Administrator Reference'] || siteUrl;

    results.module1 = await addNode('▶ Start: Module 1', mod1Url);
    results.finalExam = await addNode('Final Exam', finalUrl);
    results.admin = await addNode('Admin Reference', adminUrl);

    return results;
  }, { siteUrl: SITE_URL, pageMap });
  console.log(`   ✓ Navigation: ${JSON.stringify(navResult)}`);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ Redesign complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Site: ${SITE_URL}
`);

  await browser.close();
})();
