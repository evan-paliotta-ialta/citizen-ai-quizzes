/**
 * fix_broken_quiz_links.js
 *
 * All 16 module pages have a broken quiz navigation URL:
 *   https://ialta.sharepoint.comSitePages/Quiz-...
 * Should be:
 *   https://ialta.sharepoint.com/sites/CitizenAI/SitePages/Quiz-...
 *
 * Fixes all affected pages in one pass.
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const page = await ctx.newPage();
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Fetch all pages, find those with the broken URL, fix and republish
  const results = await page.evaluate(async (siteUrl) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    const allRes = await fetch(
      `${siteUrl}/_api/sitepages/pages?$select=Id,Title,CanvasContent1&$top=100`,
      { headers: { Accept: 'application/json;odata=verbose' } }
    );
    const allData = await allRes.json();

    const results = [];

    for (const p of allData.d.results) {
      if (!p.CanvasContent1) continue;

      // Check for the broken pattern
      if (!p.CanvasContent1.includes('sharepoint.comSitePages')) continue;

      // Fix: insert /sites/CitizenAI/ between .com and SitePages
      const fixed = p.CanvasContent1.replace(
        /https:\/\/ialta\.sharepoint\.comSitePages\//g,
        'https://ialta.sharepoint.com/sites/CitizenAI/SitePages/'
      );

      let canvas;
      try { canvas = JSON.parse(fixed); }
      catch { results.push({ id: p.Id, title: p.Title, status: 'parse_error' }); continue; }

      // Checkout → save → publish
      await fetch(`${siteUrl}/_api/sitepages/pages(${p.Id})/checkout`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(${p.Id})`, {
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
          CanvasContent1: fixed,
        }),
      });

      if (!saveRes.ok) {
        results.push({ id: p.Id, title: p.Title, status: `save_failed_${saveRes.status}` });
        continue;
      }

      const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${p.Id})/publish`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      results.push({
        id: p.Id,
        title: p.Title,
        status: pubRes.ok ? 'fixed' : `publish_error_${pubRes.status}`,
      });
    }

    return results;
  }, SITE_URL);

  log(`Fixed ${results.filter(r => r.status === 'fixed').length} pages:`);
  for (const r of results) {
    log(`  ${r.status === 'fixed' ? '✓' : '✗'} [${r.id}] ${r.title} — ${r.status}`);
  }

  await browser.close();
  log('Done.');
})();
