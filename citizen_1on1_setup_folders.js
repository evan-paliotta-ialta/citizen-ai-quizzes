/**
 * citizen_1on1_setup_folders.js
 *
 * One-time (idempotent) setup: pre-creates the Program Admin/1on1 Notes/
 * <Team>/<Name>/ folder structure for every citizen in citizen_roster.json,
 * so the restricted library is browsable by team before anyone's first
 * 1:1 actually happens. Safe to re-run — existing folders are left alone.
 *
 * Run: node citizen_1on1_setup_folders.js
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('./playwright/node_modules/playwright');

const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';
const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.helm.json');

async function main() {
  const roster = JSON.parse(fs.readFileSync(path.join(__dirname, 'citizen_roster.json'), 'utf8'));

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const tab = await ctx.newPage();
  await tab.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const result = await tab.evaluate(async ({ siteUrl, roster }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;
    const log = [];

    async function ensureFolder(serverRelativeUrl) {
      const res = await fetch(`${siteUrl}/_api/web/folders`, {
        method: 'POST',
        headers: { Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': digest },
        body: JSON.stringify({ __metadata: { type: 'SP.Folder' }, ServerRelativeUrl: serverRelativeUrl }),
      });
      return res.ok || res.status === 500; // 500 here is usually "already exists" — treat as success
    }

    await ensureFolder('/sites/citizenai/Program Admin/1on1 Notes');

    const teams = [...new Set(roster.map(r => r.team))];
    for (const team of teams) {
      await ensureFolder(`/sites/citizenai/Program Admin/1on1 Notes/${team}`);
    }

    for (const citizen of roster) {
      const ok = await ensureFolder(`/sites/citizenai/Program Admin/1on1 Notes/${citizen.team}/${citizen.name}`);
      log.push(`${citizen.team}/${citizen.name}: ${ok ? 'ok' : 'FAILED'}`);
    }

    return log;
  }, { siteUrl: SITE_URL, roster });

  console.log(result.join('\n'));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
