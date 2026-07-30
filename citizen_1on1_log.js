/**
 * citizen_1on1_log.js
 *
 * Logs a completed 1:1: adds an item to the restricted "1on1 Tracker"
 * SharePoint list, generates a one-page docx summary, and uploads it to
 * the restricted "Program Admin" library
 * (Program Admin/1on1 Notes/<Team>/<Name>/<Quarter — Date>.docx, team
 * looked up from citizen_roster.json, creating folders as needed). Both
 * the list and the library have broken permission inheritance, granted
 * only to the site's Owners group.
 *
 * Run: node citizen_1on1_log.js --json '{"name": "...", ...}'
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

const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';
const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.helm.json');
const LIST_ID = '1837443e-f712-456f-bc81-fc3ddbf7da4d'; // "1on1 Tracker"

function lookupTeam(name) {
  const roster = JSON.parse(fs.readFileSync(path.join(__dirname, 'citizen_roster.json'), 'utf8'));
  const match = roster.find(r => r.name.toLowerCase() === name.toLowerCase());
  return match ? match.team : null;
}

async function main() {
  const team = lookupTeam(data.name);
  if (!team) {
    console.error(`Warning: "${data.name}" not found in citizen_roster.json — filing under "Unassigned" instead of a team folder. Add them to the roster if they're a real program participant.`);
  }
  const teamFolder = team || 'Unassigned';

  // 1. Generate docx
  const tmpDocx = path.join(os.tmpdir(), `1on1_${Date.now()}.docx`);
  execFileSync('python3', [
    path.join(__dirname, 'generate_1on1_doc.py'),
    '--json', JSON.stringify(data),
    '--out', tmpDocx,
  ], { stdio: 'inherit' });

  const siteUrl = SITE_URL;
  const authPath = AUTH_PATH;
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: authPath });
  const tab = await ctx.newPage();
  await tab.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const fileBytes = fs.readFileSync(tmpDocx);
  const base64 = fileBytes.toString('base64');
  const fileName = `${data.quarter} — ${data.date}.docx`;
  const folderPath = `/sites/citizenai/Program Admin/1on1 Notes/${teamFolder}/${data.name}`;

  const result = await tab.evaluate(async ({ siteUrl, listId, folderPath, fileName, base64, data, teamFolder }) => {
    const log = {};
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    // 2. Add the tracker item
    const itemRes = await fetch(`${siteUrl}/_api/web/lists(guid'${listId}')/items`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      },
      body: JSON.stringify({
        __metadata: { type: 'SP.Data.1on1_x0020_TrackerListItem' },
        Title: data.name,
        CitizenEmail: data.email,
        Quarter: data.quarter,
        OneOnOneDate: new Date(data.date).toISOString(),
        WhatBuilt: data.built,
        Blocker: data.blocker,
        CapabilityLevel: data.capability,
        GoalSet: data.goal,
        PriorGoalStatus: data.prior_status,
        Notes: data.notes || '',
      }),
    });
    if (!itemRes.ok) { log.item = `FAILED ${itemRes.status} ${await itemRes.text()}`; return log; }
    log.item = 'ok';

    // 3. Ensure "1on1 Notes" / <team> / <citizen> folders exist (each level created in order)
    const levels = [
      '/sites/citizenai/Program Admin/1on1 Notes',
      `/sites/citizenai/Program Admin/1on1 Notes/${teamFolder}`,
      folderPath,
    ];
    for (const levelPath of levels) {
      await fetch(`${siteUrl}/_api/web/folders`, {
        method: 'POST',
        headers: { Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': digest },
        body: JSON.stringify({ __metadata: { type: 'SP.Folder' }, ServerRelativeUrl: levelPath }),
      });
    }

    // 4. Upload the docx
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const uploadRes = await fetch(
      `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(folderPath)}')/Files/add(url='${encodeURIComponent(fileName)}',overwrite=true)`,
      {
        method: 'POST',
        headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
        body: bytes,
      }
    );
    if (!uploadRes.ok) { log.upload = `FAILED ${uploadRes.status} ${await uploadRes.text()}`; return log; }
    log.upload = 'ok';

    return log;
  }, { siteUrl, listId: LIST_ID, folderPath, fileName, base64, data, teamFolder });

  await browser.close();
  fs.unlinkSync(tmpDocx);

  if (result.item !== 'ok') {
    console.error(`Tracker list item FAILED: ${result.item}`);
    process.exit(1);
  }
  console.log('Tracker list item added.');

  if (result.upload !== 'ok') {
    console.error(`SharePoint doc upload FAILED: ${result.upload}`);
    process.exit(1);
  }
  console.log(`Uploaded to SharePoint: Program Admin/1on1 Notes/${teamFolder}/${data.name}/${fileName}`);
}

main().catch(e => { console.error(e); process.exit(1); });
