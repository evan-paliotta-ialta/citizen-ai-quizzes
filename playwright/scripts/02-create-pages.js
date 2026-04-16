/**
 * STEP 3 — Creates all module pages on the SharePoint site.
 *
 * Run with:  node scripts/02-create-pages.js
 *
 * What it does:
 *  1. Loads your saved session
 *  2. Creates a Home/landing page with the course overview and navigation
 *  3. Creates one page per module with the full lesson content
 *  4. Creates pages for all quizzes (content only — Forms links added in step 4)
 *  5. Creates the Final Exam page
 *
 * Safe to re-run — already-existing pages are skipped, not duplicated.
 * Progress is logged to the console as each page is created.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { createSharePointPage, pageExists, SITE_URL } = require('../utils/sharepoint');
const { MODULES, loadModuleContent, loadQuizContent, loadFinalExamContent } = require('../utils/content-loader');

const AUTH_PATH = path.resolve(__dirname, '../', config.authStatePath);

// ── Home page HTML ─────────────────────────────────────────────────────────
function buildHomePage() {
  const moduleLinks = MODULES.map(m =>
    `<li><a href="${SITE_URL}/SitePages/${encodeURIComponent(m.title)}.aspx">${m.title}</a> <em>(${m.track})</em></li>`
  ).join('\n');

  return `
<h1>Citizen AI Developer Program</h1>
<p><strong>Welcome.</strong> This program will help you use Claude and AI tools effectively in your daily work — no technical background required.</p>

<h2>How This Course Works</h2>
<ol>
  <li>Complete each module in order using the navigation below</li>
  <li>Pass the quiz at the end of each module to proceed</li>
  <li>Pass the Final Exam to receive your Claude Desktop license</li>
  <li>Complete the capstone exercise to be cleared for independent use</li>
</ol>

<h2>Learning Tracks</h2>
<table>
  <thead><tr><th>Track</th><th>Modules</th><th>Who It's For</th></tr></thead>
  <tbody>
    <tr><td>Foundation</td><td>1–5</td><td>Everyone — start here</td></tr>
    <tr><td>Core Skills</td><td>6–9</td><td>Everyone — prompting and daily use</td></tr>
    <tr><td>Claude Desktop</td><td>10–11</td><td>Everyone — tool-specific features</td></tr>
    <tr><td>Application</td><td>12–13</td><td>Everyone — your team's use cases + safety</td></tr>
    <tr><td>Advanced</td><td>14–16</td><td>Power users and citizen developers</td></tr>
  </tbody>
</table>

<h2>Course Modules</h2>
<ol>${moduleLinks}</ol>

<h2>Questions?</h2>
<p>Post in the <strong>Citizen AI Developer Program</strong> Teams channel.</p>
  `.trim();
}

(async () => {
  console.log('=== Step 3: Create SharePoint Pages ===\n');

  if (!fs.existsSync(AUTH_PATH)) {
    console.error('✗ No auth session found. Run:  node auth/save-auth.js\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_PATH });
  const page = await context.newPage();

  let created = 0;
  let skipped = 0;
  let failed = 0;

  // Helper: create one page with skip-if-exists logic
  async function safeCreatePage(title, htmlContent, label) {
    process.stdout.write(`  ${label}... `);
    try {
      const exists = await pageExists(page, title);
      if (exists) {
        console.log('skipped (already exists)');
        skipped++;
        return;
      }
      await createSharePointPage(page, title, htmlContent);
      console.log('✓ created');
      created++;
      // Brief pause between pages to avoid throttling
      await page.waitForTimeout(2000);
    } catch (err) {
      console.log(`✗ FAILED — ${err.message}`);
      failed++;
    }
  }

  // ── 1. Home page ──────────────────────────────────────────────────────────
  console.log('Creating Home page...');
  await safeCreatePage('Home', buildHomePage(), 'Home page');

  // ── 2. Module pages ───────────────────────────────────────────────────────
  console.log('\nCreating module pages...');
  for (const mod of MODULES) {
    const html = loadModuleContent(mod.slug);
    await safeCreatePage(mod.title, html, mod.title);
  }

  // ── 3. Quiz pages ─────────────────────────────────────────────────────────
  console.log('\nCreating quiz pages...');
  for (const mod of MODULES) {
    const quizTitle = `Quiz — ${mod.title}`;
    const html = loadQuizContent(mod.id);
    await safeCreatePage(quizTitle, html, `Quiz ${mod.id}`);
  }

  // ── 4. Final Exam page ────────────────────────────────────────────────────
  console.log('\nCreating Final Exam page...');
  const examHtml = loadFinalExamContent();
  await safeCreatePage('Final Exam', examHtml, 'Final Exam');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Pages created : ${created}
  Skipped       : ${skipped}
  Failed        : ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (failed > 0) {
    console.log('\n⚠ Some pages failed. Check the errors above.');
    console.log('  You can re-run this script — successful pages will be skipped.');
  } else {
    console.log('\n✓ All pages created successfully.');
    console.log(`\nView your site: ${SITE_URL}`);
    console.log('\nRun next:  node scripts/03-create-forms.js\n');
  }

  await browser.close();
})();
