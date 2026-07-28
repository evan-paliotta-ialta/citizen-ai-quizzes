/**
 * citizen_1on1_log.js
 *
 * Logs a completed 1:1: appends a row to citizen_1on1_tracker.csv,
 * generates a one-page docx summary, uploads it to the restricted
 * "Program Admin" SharePoint library (Program Admin/<Name>/<Quarter — Date>.docx,
 * creating folders as needed), then commits and pushes the CSV change.
 *
 * Run: node citizen_1on1_log.js --json '{"name": "...", "email": "...", ...}'
 *
 * Required JSON fields: name, email, quarter, date, built, blocker,
 * capability, goal, prior_status, notes (notes optional).
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require('./playwright/node_modules/playwright');

const jsonFlagIndex = process.argv.indexOf('--json');
if (jsonFlagIndex === -1 || !process.argv[jsonFlagIndex + 1]) {
  console.error('Usage: node citizen_1on1_log.js --json \'{"name": "...", "email": "...", "quarter": "...", "date": "...", "built": "...", "blocker": "...", "capability": "...", "goal": "...", "prior_status": "...", "notes": "..."}\'');
  process.exit(1);
}
const data = JSON.parse(process.argv[jsonFlagIndex + 1]);

const REQUIRED = ['name', 'email', 'quarter', 'date', 'built', 'blocker', 'capability', 'goal', 'prior_status'];
const missing = REQUIRED.filter(f => !data[f]);
if (missing.length) {
  console.error(`Missing required fields: ${missing.join(', ')}`);
  process.exit(1);
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function main() {
  // 1. Append CSV row
  const csvPath = path.join(__dirname, 'citizen_1on1_tracker.csv');
  const row = [
    data.name, data.email, data.quarter, data.date,
    data.built, data.blocker, data.capability, data.goal,
    data.prior_status, data.notes || '',
  ].map(csvEscape).join(',');
  fs.appendFileSync(csvPath, row + '\n');
  console.log('CSV row appended.');

  // 2. Generate docx
  const tmpDocx = path.join(os.tmpdir(), `1on1_${Date.now()}.docx`);
  execFileSync('python3', [
    path.join(__dirname, 'generate_1on1_doc.py'),
    '--json', JSON.stringify(data),
    '--out', tmpDocx,
  ], { stdio: 'inherit' });

  // 3. Upload to SharePoint: Program Admin/<Name>/<Quarter — Date>.docx
  const siteUrl = 'https://helmmarkets.sharepoint.com/sites/citizenai';
  const authPath = path.join(__dirname, 'playwright/auth/auth.helm.json');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: authPath });
  const tab = await ctx.newPage();
  await tab.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const fileBytes = fs.readFileSync(tmpDocx);
  const base64 = fileBytes.toString('base64');
  const fileName = `${data.quarter} — ${data.date}.docx`;
  const folderPath = `/sites/citizenai/Program Admin/${data.name}`;

  const uploadResult = await tab.evaluate(async ({ siteUrl, folderPath, fileName, base64 }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    // Ensure the per-citizen folder exists (ignore failure if it already does)
    await fetch(`${siteUrl}/_api/web/folders`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      },
      body: JSON.stringify({ __metadata: { type: 'SP.Folder' }, ServerRelativeUrl: folderPath }),
    });

    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const uploadRes = await fetch(
      `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(folderPath)}')/Files/add(url='${encodeURIComponent(fileName)}',overwrite=true)`,
      {
        method: 'POST',
        headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
        body: bytes,
      }
    );
    if (!uploadRes.ok) return { ok: false, status: uploadRes.status, text: await uploadRes.text() };
    return { ok: true };
  }, { siteUrl, folderPath, fileName, base64 });

  await browser.close();
  fs.unlinkSync(tmpDocx);

  if (!uploadResult.ok) {
    console.error(`SharePoint upload FAILED: ${uploadResult.status} ${uploadResult.text}`);
    process.exit(1);
  }
  console.log(`Uploaded to SharePoint: Program Admin/${data.name}/${fileName}`);

  // 4. Commit and push the CSV change
  const repoDir = __dirname;
  execFileSync('git', ['add', 'citizen_1on1_tracker.csv'], { cwd: repoDir, stdio: 'inherit' });
  const commitMsg = `Log ${data.quarter} 1:1 for ${data.name}\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`;
  try {
    execFileSync('git', ['commit', '-m', commitMsg], { cwd: repoDir, stdio: 'inherit' });
    execFileSync('git', ['push', 'origin', 'main'], { cwd: repoDir, stdio: 'inherit' });
    console.log('Committed and pushed.');
  } catch (e) {
    console.error('Git commit/push failed — CSV row and SharePoint doc are still saved. Commit manually.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
