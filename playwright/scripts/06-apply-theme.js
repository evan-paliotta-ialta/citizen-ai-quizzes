/**
 * STEP 7 — Applies visual branding to the CitizenAI SharePoint site.
 *
 * Run with:  node scripts/06-apply-theme.js
 *
 * What it does:
 *  1. Applies a dark professional theme (navy/slate) to the site
 *  2. Rewrites the Home page with a proper hero layout and structured sections
 *  3. Updates the site logo/header description
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { MODULES } = require('../utils/content-loader');

const AUTH_PATH = path.resolve(__dirname, '../', config.authStatePath);
const SITE_URL = `https://${config.tenant}.sharepoint.com/sites/${config.siteSlug}`;

// ── Theme definition ──────────────────────────────────────────────────────────
// Professional navy + slate blue theme matching an AI/tech aesthetic
const THEME = {
  name: 'CitizenAI Theme',
  palette: {
    themePrimary: '#0f4c81',       // Deep navy blue — primary actions, links
    themeLighterAlt: '#f0f6fc',
    themeLighter: '#c5dcf0',
    themeLight: '#97bfe2',
    themeTertiary: '#4a8ec2',
    themeSecondary: '#1e6aad',
    themeDarkAlt: '#0d4374',
    themeDark: '#0b3862',
    themeDarker: '#082949',
    neutralLighterAlt: '#f8f8f8',
    neutralLighter: '#f4f4f4',
    neutralLight: '#eaeaea',
    neutralQuaternaryAlt: '#dadada',
    neutralQuaternary: '#d0d0d0',
    neutralTertiaryAlt: '#c8c8c8',
    neutralTertiary: '#a6a6a6',
    neutralSecondary: '#666666',
    neutralPrimaryAlt: '#3c3c3c',
    neutralPrimary: '#222222',
    neutralDark: '#1a1a1a',
    black: '#000000',
    white: '#ffffff',
    primaryBackground: '#ffffff',
    primaryText: '#222222',
    bodyBackground: '#ffffff',
    bodyText: '#222222',
    disabledBackground: '#f4f4f4',
    disabledText: '#c8c8c8',
  },
  isInverted: false,
};

// ── Better home page HTML ─────────────────────────────────────────────────────
function buildBetterHomePage() {
  const moduleRows = MODULES.map(m => {
    const trackColor = {
      'Foundation': '#0f4c81',
      'Core Skills': '#1e6aad',
      'Claude Desktop': '#2d7dd2',
      'Application': '#3a5a8a',
      'Required': '#c0392b',
      'Advanced': '#6c3483',
      'Citizen Developer': '#1a7a4a',
    }[m.track] || '#0f4c81';

    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eaeaea;font-weight:600;color:#0f4c81;">${m.id}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eaeaea;"><a href="${SITE_URL}/SitePages/${encodeURIComponent(m.title)}.aspx" style="color:#0f4c81;text-decoration:none;font-weight:500;">${m.title}</a></td>
      <td style="padding:10px 12px;border-bottom:1px solid #eaeaea;"><span style="background:${trackColor};color:white;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;">${m.track}</span></td>
    </tr>`;
  }).join('\n');

  return `
<div style="background:linear-gradient(135deg,#0f4c81 0%,#1e6aad 60%,#2d7dd2 100%);padding:48px 40px;border-radius:8px;margin-bottom:32px;">
  <h1 style="color:white;margin:0 0 12px 0;font-size:32px;font-weight:700;letter-spacing:-0.5px;">Citizen AI Developer Program</h1>
  <p style="color:rgba(255,255,255,0.9);margin:0;font-size:18px;max-width:600px;line-height:1.6;">Learn to think like a developer. Master Claude for your daily work — no technical background required.</p>
  <div style="display:flex;gap:24px;margin-top:24px;flex-wrap:wrap;">
    <div style="background:rgba(255,255,255,0.15);padding:12px 20px;border-radius:6px;text-align:center;">
      <div style="color:white;font-size:28px;font-weight:700;">16</div>
      <div style="color:rgba(255,255,255,0.85);font-size:13px;">Modules</div>
    </div>
    <div style="background:rgba(255,255,255,0.15);padding:12px 20px;border-radius:6px;text-align:center;">
      <div style="color:white;font-size:28px;font-weight:700;">5</div>
      <div style="color:rgba(255,255,255,0.85);font-size:13px;">Learning Tracks</div>
    </div>
    <div style="background:rgba(255,255,255,0.15);padding:12px 20px;border-radius:6px;text-align:center;">
      <div style="color:white;font-size:28px;font-weight:700;">1</div>
      <div style="color:rgba(255,255,255,0.85);font-size:13px;">License Earned</div>
    </div>
  </div>
</div>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:36px;">
  <div style="background:#f0f6fc;border-left:4px solid #0f4c81;padding:20px;border-radius:6px;">
    <div style="font-size:22px;margin-bottom:8px;">📖</div>
    <div style="font-weight:700;color:#0f4c81;margin-bottom:6px;">Complete each module</div>
    <div style="color:#444;font-size:14px;line-height:1.5;">Read the lesson content in order. No skipping — each module builds on the last.</div>
  </div>
  <div style="background:#f0f6fc;border-left:4px solid #1e6aad;padding:20px;border-radius:6px;">
    <div style="font-size:22px;margin-bottom:8px;">✅</div>
    <div style="font-weight:700;color:#0f4c81;margin-bottom:6px;">Pass each quiz</div>
    <div style="color:#444;font-size:14px;line-height:1.5;">Each module has a 5-question quiz. You must pass before moving on.</div>
  </div>
  <div style="background:#f0f6fc;border-left:4px solid #2d7dd2;padding:20px;border-radius:6px;">
    <div style="font-size:22px;margin-bottom:8px;">🎓</div>
    <div style="font-weight:700;color:#0f4c81;margin-bottom:6px;">Pass the Final Exam</div>
    <div style="color:#444;font-size:14px;line-height:1.5;">25-question exam. Score 80%+ to qualify for your Claude Desktop license.</div>
  </div>
  <div style="background:#f0f6fc;border-left:4px solid #3a5a8a;padding:20px;border-radius:6px;">
    <div style="font-size:22px;margin-bottom:8px;">🚀</div>
    <div style="font-weight:700;color:#0f4c81;margin-bottom:6px;">Complete the Capstone</div>
    <div style="color:#444;font-size:14px;line-height:1.5;">Apply what you learned to a real work task. Submit for review within 5 days.</div>
  </div>
</div>

<h2 style="color:#0f4c81;border-bottom:2px solid #0f4c81;padding-bottom:8px;margin-bottom:20px;">Course Modules</h2>

<table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
  <thead>
    <tr style="background:#0f4c81;color:white;">
      <th style="padding:12px 12px;text-align:left;width:48px;">#</th>
      <th style="padding:12px 12px;text-align:left;">Module</th>
      <th style="padding:12px 12px;text-align:left;width:150px;">Track</th>
    </tr>
  </thead>
  <tbody style="background:white;">
    ${moduleRows}
  </tbody>
</table>

<div style="margin-top:32px;padding:20px;background:#fff8e1;border-left:4px solid #f39c12;border-radius:6px;">
  <strong style="color:#c0392b;">⚠ Module 13 — Safety and Responsible Use</strong> requires a perfect score (5/5). This is non-negotiable.
</div>

<div style="margin-top:24px;padding:20px;background:#f4f4f4;border-radius:6px;">
  <strong>Questions?</strong> Post in the <strong>Citizen AI Developer Program</strong> Teams channel.
</div>
`.trim();
}

(async () => {
  console.log('=== Apply Visual Theme & Layout ===\n');

  if (!fs.existsSync(AUTH_PATH)) {
    console.error('✗ No auth session found. Run:  node auth/save-auth.js\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_PATH });
  const page = await context.newPage();
  await page.goto(SITE_URL, { waitUntil: 'networkidle' });

  // ── 1. Apply the theme ─────────────────────────────────────────────────────
  console.log('Applying site theme...');
  const themeResult = await page.evaluate(async ({ siteUrl, theme }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST',
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const digestData = await digestRes.json();
    const digest = digestData.d.GetContextWebInformation.FormDigestValue;

    // Apply theme via ThemeManager
    const themeRes = await fetch(`${siteUrl}/_api/thememanager/ApplyTheme`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      },
      body: JSON.stringify({
        name: theme.name,
        themeJson: JSON.stringify(theme),
      }),
    });

    if (!themeRes.ok) {
      const err = await themeRes.text();
      return { ok: false, error: err.substring(0, 300) };
    }
    return { ok: true };
  }, { siteUrl: SITE_URL, theme: THEME });

  if (themeResult.ok) {
    console.log('  ✓ Theme applied');
  } else {
    console.log(`  ⚠ Theme apply failed (will continue): ${themeResult.error}`);
  }

  // ── 2. Update the Home page with the better layout ────────────────────────
  console.log('\nUpdating Home page layout...');
  const homeHtml = buildBetterHomePage();

  const homeResult = await page.evaluate(async ({ siteUrl, content }) => {
    // Get digest
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST',
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const digestData = await digestRes.json();
    const digest = digestData.d.GetContextWebInformation.FormDigestValue;

    // Find the Home page
    const findRes = await fetch(
      `${siteUrl}/_api/sitepages/pages?$filter=Title eq 'Home'&$select=Id,Title`,
      { headers: { Accept: 'application/json;odata=verbose' } }
    );
    const findData = await findRes.json();
    if (!findData.d || findData.d.results.length === 0) return { ok: false, error: 'Home page not found' };
    const pageId = findData.d.results[0].Id;

    // Checkout
    await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
      method: 'POST',
      headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });

    // Build canvas content
    const instanceId = 'text-home-main';
    const canvasContent = JSON.stringify([{
      controlType: 4,
      id: instanceId,
      innerHTML: content,
      editorType: 'CKEditor',
      textEditorVersion: 3,
      addedFromPersistedData: false,
      reservedHeight: 100,
      reservedWidth: 0,
    }]);

    // MERGE to set content
    const mergeRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
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

    if (!mergeRes.ok) {
      const err = await mergeRes.text();
      return { ok: false, error: err.substring(0, 300) };
    }

    // Publish
    await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
      method: 'POST',
      headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });

    return { ok: true, pageId };
  }, { siteUrl: SITE_URL, content: homeHtml });

  if (homeResult.ok) {
    console.log('  ✓ Home page updated with new layout');
  } else {
    console.log(`  ✗ Home page update failed: ${homeResult.error}`);
  }

  // ── 3. Update site description ─────────────────────────────────────────────
  console.log('\nUpdating site description...');
  const descResult = await page.evaluate(async ({ siteUrl }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST',
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const digestData = await digestRes.json();
    const digest = digestData.d.GetContextWebInformation.FormDigestValue;

    const res = await fetch(`${siteUrl}/_api/web`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
        'X-HTTP-Method': 'MERGE',
        'IF-MATCH': '*',
      },
      body: JSON.stringify({
        __metadata: { type: 'SP.Web' },
        Description: 'Master Claude and AI tools for your daily work. No technical background required.',
      }),
    });
    return { ok: res.ok || res.status === 204 };
  }, { siteUrl: SITE_URL });

  if (descResult.ok) {
    console.log('  ✓ Site description updated');
  } else {
    console.log('  ⚠ Site description update skipped');
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ Visual updates complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Visit your site: ${SITE_URL}
`);

  await browser.close();
})();
