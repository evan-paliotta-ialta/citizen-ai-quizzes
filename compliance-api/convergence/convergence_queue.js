/**
 * convergence_queue.js
 *
 * Writes one convergence verdict (produced by a Claude Code session reading
 * deep_compare.py's output, per the criteria in the build plan) to the
 * "Convergence Queue" SharePoint list. Mirrors citizen_1on1_log.js's item
 * creation pattern (digest + POST to _api/web/lists(...)/items).
 *
 * This never auto-notifies anyone — it only writes a Pending row. Evan
 * reviews the list in SharePoint directly and marks Confirmed/Rejected
 * there; nothing here messages a citizen.
 *
 * Run: node convergence_queue.js --json '{"citizenA": "...", "citizenB": "...",
 *   "chatTitleA": "...", "chatTitleB": "...", "overlapType": "Concurrent|DelayedReuse",
 *   "connectRecommended": "Yes|No", "priorWorkSummary": "...", "reasoning": "..."}'
 */

const path = require('path');
const { chromium } = require('./../../playwright/node_modules/playwright');

const jsonFlagIndex = process.argv.indexOf('--json');
if (jsonFlagIndex === -1 || !process.argv[jsonFlagIndex + 1]) {
  console.error('Usage: node convergence_queue.js --json \'{"citizenA": "...", "citizenB": "...", '
    + '"chatTitleA": "...", "chatTitleB": "...", "overlapType": "...", "connectRecommended": "...", '
    + '"priorWorkSummary": "...", "reasoning": "..."}\'');
  process.exit(1);
}
const data = JSON.parse(process.argv[jsonFlagIndex + 1]);

const REQUIRED = ['citizenA', 'citizenB', 'chatTitleA', 'chatTitleB', 'overlapType', 'connectRecommended', 'reasoning'];
const missing = REQUIRED.filter(f => !data[f]);
if (missing.length) {
  console.error(`Missing required fields: ${missing.join(', ')}`);
  process.exit(1);
}

const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';
const AUTH_PATH = path.join(__dirname, '../../playwright/auth/auth.helm.json');
const LIST_TITLE = 'Convergence Queue';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const tab = await ctx.newPage();
  await tab.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const result = await tab.evaluate(async ({ siteUrl, listTitle, data }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    const listRes = await fetch(`${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    if (!listRes.ok) return { ok: false, error: `List not found: ${listRes.status}` };
    const listData = (await listRes.json()).d;
    const itemEntityType = listData.ListItemEntityTypeFullName;

    const itemRes = await fetch(`${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      },
      body: JSON.stringify({
        __metadata: { type: itemEntityType },
        Title: data.citizenA,
        CitizenB: data.citizenB,
        ChatTitleA: data.chatTitleA,
        ChatTitleB: data.chatTitleB,
        OverlapType: data.overlapType,
        ConnectRecommended: data.connectRecommended,
        PriorWorkSummary: data.priorWorkSummary || '',
        Reasoning: data.reasoning,
        Status: 'Pending',
        DateFlagged: new Date().toISOString(),
      }),
    });
    if (!itemRes.ok) return { ok: false, error: `${itemRes.status} ${await itemRes.text()}` };
    return { ok: true };
  }, { siteUrl: SITE_URL, listTitle: LIST_TITLE, data });

  await browser.close();

  if (!result.ok) {
    console.error(`Convergence Queue item FAILED: ${result.error}`);
    process.exit(1);
  }
  console.log(`Convergence Queue: added "${data.citizenA}" <-> "${data.citizenB}" (${data.overlapType}, Pending).`);
}

main().catch(e => { console.error(e); process.exit(1); });
