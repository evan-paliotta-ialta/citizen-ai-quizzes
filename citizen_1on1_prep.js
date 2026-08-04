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
const CHATS_CACHE = path.join(__dirname, 'compliance-api/shared/cache/chats_cache.jsonl');

// Reused from the convergence pipeline's title-similarity logic, scoped to
// one citizen's own history instead of cross-citizen — a repeated-pattern
// heuristic for Capability Maturity, not a full semantic judgment. Simple
// word-overlap (Jaccard on lowercased title words), not a model call.
function titleSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (!wordsA.size || !wordsB.size) return 0;
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

function isoWeekKey(dateStr) {
  const d = new Date(dateStr);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function loadCitizenChats(name) {
  if (!fs.existsSync(CHATS_CACHE)) return null;
  const lines = fs.readFileSync(CHATS_CACHE, 'utf8').split('\n').filter(Boolean);
  const chats = lines.map(l => JSON.parse(l)).filter(c => c.citizen.toLowerCase() === name.toLowerCase());
  return chats.length ? chats : null;
}

function computeSignals(name) {
  const chats = loadCitizenChats(name);
  if (!chats) return null;

  // Adoption cadence — chats per ISO week
  const byWeek = {};
  for (const c of chats) {
    const wk = isoWeekKey(c.created_at);
    byWeek[wk] = (byWeek[wk] || 0) + 1;
  }
  const weeks = Object.keys(byWeek).sort();
  const cadence = weeks.map(w => `${w}: ${byWeek[w]}`);

  // Model-selection discipline — distribution
  const byModel = {};
  for (const c of chats) {
    const m = c.model || '(unknown)';
    byModel[m] = (byModel[m] || 0) + 1;
  }

  // Capability Maturity signal — repeated-similar-title pairs (threshold 0.5 Jaccard)
  let repeatedPairs = 0;
  for (let i = 0; i < chats.length; i++) {
    for (let j = i + 1; j < chats.length; j++) {
      if (titleSimilarity(chats[i].title || '', chats[j].title || '') >= 0.5) repeatedPairs++;
    }
  }

  return { totalChats: chats.length, cadence, byModel, repeatedPairs };
}

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

  const signals = computeSignals(nameArg);
  console.log('');
  console.log('--- Compliance API signals (from compliance-api/convergence pull cache) ---');
  if (!signals) {
    console.log('No cached chat data for this citizen yet. Either they are not yet onboarded to the '
      + 'Enterprise org (rollout continues through mid-October), or the convergence pull hasn\'t run '
      + 'since they were onboarded — run pull_and_flag.py to refresh.');
  } else {
    console.log(`Adoption cadence: ${signals.totalChats} chats total, by week:`);
    signals.cadence.forEach(line => console.log(`  ${line}`));
    console.log('Model-selection discipline:');
    Object.entries(signals.byModel).forEach(([model, count]) => console.log(`  ${model}: ${count}`));
    console.log(`Capability Maturity signal: ${signals.repeatedPairs} pair(s) of similarly-titled chats `
      + `out of ${signals.totalChats} total — high counts may suggest repeatable patterns (Level 3) `
      + `rather than one-off ad hoc use (Level 2). This is a heuristic to prompt discussion, not a verdict.`);
  }
  console.log('='.repeat(60));
  console.log('');
  console.log(template);
}

main().catch(e => { console.error(e); process.exit(1); });
