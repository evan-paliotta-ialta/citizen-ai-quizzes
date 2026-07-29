/**
 * citizen_1on1_prep.js
 *
 * Pre-fills the 1:1 agenda template for a given citizen: current quarter,
 * today's date, and their prior quarter's goal (if any), pulled from the
 * restricted "1on1 Tracker" SharePoint list. Prints the ready-to-use
 * agenda to stdout.
 *
 * Run: node citizen_1on1_prep.js "Jane Doe" [--quarter=Q3-2026]
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('./playwright/node_modules/playwright');

const [, , nameArg, ...rest] = process.argv;
if (!nameArg) {
  console.error('Usage: node citizen_1on1_prep.js "<citizen name>" [--quarter=Q3-2026]');
  process.exit(1);
}

const quarterFlag = rest.find(a => a.startsWith('--quarter='));
const overrideQuarter = quarterFlag ? quarterFlag.split('=')[1] : null;

const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';
const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.helm.json');
const LIST_ID = '1837443e-f712-456f-bc81-fc3ddbf7da4d'; // "1on1 Tracker"

function currentQuarter(date = new Date()) {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `Q${q}-${date.getFullYear()}`;
}

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const tab = await ctx.newPage();
  await tab.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const prior = await tab.evaluate(async ({ siteUrl, listId, name }) => {
    const filterName = name.replace(/'/g, "''");
    const url = `${siteUrl}/_api/web/lists(guid'${listId}')/items` +
      `?$filter=Title eq '${encodeURIComponent(filterName)}'` +
      `&$orderby=OneOnOneDate desc&$top=1` +
      `&$select=Quarter,OneOnOneDate,GoalSet`;
    const r = await fetch(url, { headers: { Accept: 'application/json;odata=verbose' } });
    if (!r.ok) return { error: `${r.status} ${await r.text()}` };
    const d = await r.json();
    return d.d.results[0] || null;
  }, { siteUrl: SITE_URL, listId: LIST_ID, name: nameArg });

  await browser.close();

  if (prior && prior.error) {
    console.error(`Lookup failed: ${prior.error}`);
    process.exit(1);
  }

  const quarter = overrideQuarter || currentQuarter();
  const today = localDateString();

  const templatePath = path.join(__dirname, '1on1_agenda_template.md');
  const template = fs.readFileSync(templatePath, 'utf8');

  console.log('='.repeat(60));
  console.log(`1:1 PREP — ${nameArg}`);
  console.log('='.repeat(60));
  console.log(`Quarter: ${quarter}`);
  console.log(`Date: ${today}`);
  if (prior) {
    console.log(`Prior goal (from ${prior.Quarter}): ${prior.GoalSet}`);
  } else {
    console.log('Prior goal: none on record — this is their first tracked 1:1.');
  }
  console.log('='.repeat(60));
  console.log('');
  console.log(template);
}

main().catch(e => { console.error(e); process.exit(1); });
