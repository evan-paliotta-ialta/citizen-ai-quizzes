/**
 * setup_convergence_list.js
 *
 * One-time (idempotent-ish — safe to re-run, skips creation if the list
 * already exists): creates the "Convergence Queue" SharePoint list that
 * pull_and_flag.py / deep_compare.py's output gets written to, mirroring
 * how "1on1 Tracker" already exists as a restricted list on this site.
 *
 * IMPORTANT — this script does NOT set the Owners-only permission break.
 * "1on1 Tracker" and the "Program Admin" library both have broken
 * permission inheritance (Owners group only) and there's no scripted
 * pattern for that in this repo to mirror — it appears to have been done
 * once, manually, via the SharePoint UI. Getting a permission change wrong
 * silently is the one mistake that actually matters here (this list will
 * contain citizen names and real chat titles), so: after running this
 * script, go to the list's settings in the SharePoint UI and break
 * inheritance to Owners-only, the same way "1on1 Tracker" is configured,
 * BEFORE writing any real data into it.
 *
 * Run: node setup_convergence_list.js
 */

const path = require('path');
const { chromium } = require('./../../playwright/node_modules/playwright');

const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';
const AUTH_PATH = path.join(__dirname, '../../playwright/auth/auth.helm.json');
const LIST_TITLE = 'Convergence Queue';

// FieldTypeKind: 2 = single line text, 3 = multi-line text, 6 = choice, 4 = date/time
const FIELDS = [
  { Title: 'CitizenB', FieldTypeKind: 2 },
  { Title: 'ChatTitleA', FieldTypeKind: 2 },
  { Title: 'ChatTitleB', FieldTypeKind: 2 },
  { Title: 'OverlapType', FieldTypeKind: 6, Choices: ['Concurrent', 'DelayedReuse'] },
  { Title: 'ConnectRecommended', FieldTypeKind: 6, Choices: ['Yes', 'No'] },
  { Title: 'PriorWorkSummary', FieldTypeKind: 3 },
  { Title: 'Reasoning', FieldTypeKind: 3 },
  { Title: 'Status', FieldTypeKind: 6, Choices: ['Pending', 'Confirmed', 'Rejected', 'Notified'] },
  { Title: 'DateFlagged', FieldTypeKind: 4 },
  { Title: 'DateResolved', FieldTypeKind: 4 },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const tab = await ctx.newPage();
  await tab.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const result = await tab.evaluate(async ({ siteUrl, listTitle, fields }) => {
    const log = [];
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    // Check if it already exists
    const existsRes = await fetch(
      `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')`,
      { headers: { Accept: 'application/json;odata=verbose' } }
    );
    if (existsRes.ok) {
      return { alreadyExists: true, log: [`List "${listTitle}" already exists — skipping creation.`] };
    }

    // Create the list (BaseTemplate 100 = generic custom list, same as 1on1 Tracker)
    const createRes = await fetch(`${siteUrl}/_api/web/lists`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      },
      body: JSON.stringify({
        __metadata: { type: 'SP.List' },
        Title: listTitle,
        BaseTemplate: 100,
        Description: 'Convergence/overlap candidates from compliance-api/convergence — Owners-only, do not open permission inheritance.',
      }),
    });
    if (!createRes.ok) {
      return { alreadyExists: false, log: [`List creation FAILED ${createRes.status}: ${await createRes.text()}`] };
    }
    log.push(`List "${listTitle}" created.`);

    // Add each custom field (Title/CitizenA is the built-in list Title column, no need to add it)
    for (const field of fields) {
      const body = field.Choices
        ? {
            __metadata: { type: 'SP.FieldChoice' },
            Title: field.Title,
            FieldTypeKind: field.FieldTypeKind,
            Choices: { results: field.Choices },
          }
        : {
            __metadata: { type: 'SP.Field' },
            Title: field.Title,
            FieldTypeKind: field.FieldTypeKind,
          };
      const fieldRes = await fetch(
        `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/fields`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': digest,
          },
          body: JSON.stringify(body),
        }
      );
      log.push(`  Field ${field.Title}: ${fieldRes.ok ? 'ok' : `FAILED ${fieldRes.status} ${await fieldRes.text()}`}`);
    }

    return { alreadyExists: false, log };
  }, { siteUrl: SITE_URL, listTitle: LIST_TITLE, fields: FIELDS });

  console.log(result.log.join('\n'));
  if (!result.alreadyExists) {
    console.log('\nNEXT STEP (manual, one-time): go to the list settings in the SharePoint UI '
      + 'and break permission inheritance to Owners-only, matching "1on1 Tracker" — do this '
      + 'before writing real data via convergence_queue.js.');
  }
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
