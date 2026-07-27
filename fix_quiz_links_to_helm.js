/**
 * fix_quiz_links_to_helm.js
 *
 * The 16 quiz pages + Final Exam page still had "Take Quiz" buttons pointing at
 * the OLD iAltA-tenant Forms (carried over verbatim by the PnP site copy).
 * This swaps each button's href for the new Helm-tenant form's shareUrl, leaving
 * everything else on the page untouched.
 *
 * Run: node fix_quiz_links_to_helm.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.helm.json');
const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';

// moduleNum -> SharePoint quiz-page Id (from the full page listing captured 2026-07-20)
const QUIZ_PAGE_IDS = {
  1: 34, 2: 17, 3: 18, 4: 19, 5: 20, 6: 21, 7: 22, 8: 23,
  9: 24, 10: 25, 11: 26, 12: 27, 13: 28, 14: 29, 15: 30, 16: 31,
};
const FINAL_EXAM_PAGE_ID = 32;

async function updatePage(tab, pageId, newUrl, label) {
  const result = await tab.evaluate(async ({ siteUrl, pageId, newUrl }) => {
    const getRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})?$select=Id,CanvasContent1`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const page = (await getRes.json()).d;
    const canvas = JSON.parse(page.CanvasContent1);

    let matched = false;
    canvas.forEach(block => {
      if (!block.innerHTML) return;
      const before = block.innerHTML;
      // Replace any forms.office.com link (the old iAltA-tenant Take Quiz / Submit button URL)
      block.innerHTML = block.innerHTML.replace(
        /href=\\?"https:\/\/forms\.office\.com\/[^"\\]+\\?"/g,
        `href="${newUrl}"`
      );
      if (block.innerHTML !== before) matched = true;
    });

    if (!matched) return { status: 'no_match_found' };

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
        Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*',
      },
      body: JSON.stringify({ __metadata: { type: 'SP.Publishing.SitePage' }, CanvasContent1: JSON.stringify(canvas) }),
    });
    if (!saveRes.ok) return { status: `save_failed_${saveRes.status}` };

    const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}` };
  }, { siteUrl: SITE_URL, pageId, newUrl });

  log(`  ${label}: ${JSON.stringify(result)}`);
  return result;
}

async function main() {
  const quizUrls = JSON.parse(fs.readFileSync(path.join(__dirname, 'forms_quiz_urls_helm.json'), 'utf8'));
  const examUrl = JSON.parse(fs.readFileSync(path.join(__dirname, 'final_exam_form_helm.json'), 'utf8'));

  const browser = await chromium.launch({ headless: false, slowMo: 10 });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const tab = await ctx.newPage();
  await tab.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(5000);

  const results = [];
  for (const q of quizUrls) {
    const pageId = QUIZ_PAGE_IDS[q.moduleNum];
    if (!pageId) { log(`SKIP module ${q.moduleNum}: no page id mapping`); continue; }
    const r = await updatePage(tab, pageId, q.shareUrl, `Module ${q.moduleNum} quiz page (id ${pageId})`);
    results.push({ module: q.moduleNum, ...r });
    await sleep(500);
  }

  const examResult = await updatePage(tab, FINAL_EXAM_PAGE_ID, examUrl.shareUrl, `Final Exam page (id ${FINAL_EXAM_PAGE_ID})`);
  results.push({ module: 'F', ...examResult });

  const ok = results.filter(r => r.status === 'published').length;
  const noMatch = results.filter(r => r.status === 'no_match_found').length;
  const failed = results.filter(r => r.status && r.status.startsWith('save_failed')).length;
  log(`\n=== DONE: ${ok} published, ${noMatch} no-match, ${failed} failed ===`);
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

main();
