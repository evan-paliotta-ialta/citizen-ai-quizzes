/**
 * STEP 6 — Verifies everything was created correctly.
 *
 * Run with:  node scripts/05-verify.js
 *
 * What it checks:
 *  ✓ SharePoint site is accessible
 *  ✓ All 16 module pages exist
 *  ✓ All 16 quiz pages exist
 *  ✓ Final Exam page exists
 *  ✓ Admin Reference page exists
 *  ✓ Progress tracker file exists
 *  ✓ forms-urls.json has entries for all quizzes + final exam + capstone
 *
 * Prints a checklist with pass/fail for each item.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { MODULES } = require('../utils/content-loader');

const AUTH_PATH = path.resolve(__dirname, '../', config.authStatePath);
const FORMS_URL_FILE = path.resolve(__dirname, '../forms-urls.json');
const SITE_URL = `https://${config.tenant}.sharepoint.com/sites/${config.siteSlug}`;

(async () => {
  console.log('=== Step 6: Verify Build ===\n');

  if (!fs.existsSync(AUTH_PATH)) {
    console.error('✗ No auth session found. Run:  node auth/save-auth.js\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_PATH });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function check(label, result) {
    if (result) {
      console.log(`  ✓ ${label}`);
      passed++;
    } else {
      console.log(`  ✗ ${label}`);
      failed++;
    }
  }

  // ── Check SharePoint site ────────────────────────────────────────────────
  console.log('SharePoint site:');
  const siteResponse = await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
  check('Site is accessible', siteResponse && siteResponse.status() === 200);

  // ── Check all module pages ────────────────────────────────────────────────
  console.log('\nModule pages:');
  await page.goto(SITE_URL, { waitUntil: 'networkidle' });

  const pageCheckResult = await page.evaluate(
    async ({ siteUrl, modules }) => {
      const results = {};
      for (const mod of modules) {
        const escapedTitle = mod.title.replace(/'/g, "''");
        const res = await fetch(
          `${siteUrl}/_api/sitepages/pages?$filter=Title eq '${escapedTitle}'&$select=Id,Title`,
          { headers: { Accept: 'application/json;odata=verbose' } }
        );
        const data = await res.json();
        results[mod.id] = data.d && data.d.results.length > 0;
      }
      return results;
    },
    { siteUrl: SITE_URL, modules: MODULES }
  );

  for (const mod of MODULES) {
    check(`Module ${mod.id}: ${mod.title.replace(/^Module \d+: /, '').substring(0, 40)}`, pageCheckResult[mod.id]);
  }

  // ── Check quiz pages ──────────────────────────────────────────────────────
  console.log('\nQuiz pages:');
  const quizCheckResult = await page.evaluate(
    async ({ siteUrl, modules }) => {
      const results = {};
      for (const mod of modules) {
        const quizTitle = `Quiz — ${mod.title}`;
        const escapedTitle = quizTitle.replace(/'/g, "''");
        const res = await fetch(
          `${siteUrl}/_api/sitepages/pages?$filter=Title eq '${escapedTitle}'&$select=Id,Title`,
          { headers: { Accept: 'application/json;odata=verbose' } }
        );
        const data = await res.json();
        results[mod.id] = data.d && data.d.results.length > 0;
      }
      return results;
    },
    { siteUrl: SITE_URL, modules: MODULES }
  );

  for (const mod of MODULES) {
    check(`Quiz ${mod.id} page`, quizCheckResult[mod.id]);
  }

  // ── Check Final Exam and Admin pages ─────────────────────────────────────
  console.log('\nOther pages:');
  const otherPagesResult = await page.evaluate(
    async ({ siteUrl }) => {
      const pagesToCheck = ['Final Exam', 'Administrator Reference', 'Home'];
      const results = {};
      for (const title of pagesToCheck) {
        const escapedTitle = title.replace(/'/g, "''");
        const res = await fetch(
          `${siteUrl}/_api/sitepages/pages?$filter=Title eq '${escapedTitle}'&$select=Id,Title`,
          { headers: { Accept: 'application/json;odata=verbose' } }
        );
        const data = await res.json();
        results[title] = data.d && data.d.results.length > 0;
      }
      return results;
    },
    { siteUrl: SITE_URL }
  );

  check('Home page', otherPagesResult['Home']);
  check('Final Exam page', otherPagesResult['Final Exam']);
  check('Administrator Reference page', otherPagesResult['Administrator Reference']);

  // ── Check forms-urls.json ────────────────────────────────────────────────
  console.log('\nForms:');
  const formsExist = fs.existsSync(FORMS_URL_FILE);
  check('forms-urls.json exists', formsExist);

  if (formsExist) {
    const formUrls = JSON.parse(fs.readFileSync(FORMS_URL_FILE, 'utf8'));
    for (const mod of MODULES) {
      check(`Quiz ${mod.id} form URL`, !!formUrls[`quiz_${mod.id}`]);
    }
    check('Final Exam form URL', !!formUrls['final_exam']);
    check('Capstone form URL', !!formUrls['capstone']);
  }

  // ── Check tracker file ────────────────────────────────────────────────────
  console.log('\nTracker:');
  const trackerResult = await page.evaluate(
    async ({ siteUrl }) => {
      const res = await fetch(
        `${siteUrl}/_api/web/GetFileByServerRelativeUrl('/sites/${siteUrl.split('/sites/')[1]}/Shared Documents/Course_Progress_Tracker.csv')`,
        { headers: { Accept: 'application/json;odata=verbose' } }
      );
      return res.ok;
    },
    { siteUrl: SITE_URL }
  );
  check('Progress tracker file exists', trackerResult);

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Passed: ${passed}
  Failed: ${failed}
  Total:  ${passed + failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (failed === 0) {
    console.log(`
✓ Build complete. Your course is live.

  Course site : ${SITE_URL}
  Admin page  : ${SITE_URL}/SitePages/Administrator-Reference.aspx

Next steps:
  1. Visit the site and review each page for formatting
  2. Open each Form and add the correct answers to enable auto-grading
  3. Share the site URL with the first cohort via the Teams channel
  4. Post the Teams channel welcome message with instructions
`);
  } else {
    console.log(`
⚠ ${failed} checks failed. For each failure:
  - Re-run the corresponding script (e.g. node scripts/02-create-pages.js)
  - Already-successful items will be skipped automatically
  - Re-run verify (node scripts/05-verify.js) to confirm fixes
`);
  }

  await browser.close();
})();
