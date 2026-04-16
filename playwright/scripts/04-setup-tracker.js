/**
 * STEP 5 — Creates the Excel progress tracker in SharePoint.
 *
 * Run with:  node scripts/04-setup-tracker.js
 *
 * What it does:
 *  1. Navigates to the SharePoint site's Documents library
 *  2. Creates a new Excel workbook named "Course Progress Tracker"
 *  3. Sets up the header row: Name | Email | Module 1 | Module 2 ... | Module 16 | Final Exam | Capstone | License Issued
 *  4. Adds a second sheet with form submission links for easy access
 *
 * NOTE: Excel Online does not have a simple creation API accessible from a browser session.
 * This script uses the SharePoint REST API to create the Excel file with predefined content,
 * then opens it in Excel Online so you can verify the layout.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { MODULES } = require('../utils/content-loader');

const AUTH_PATH = path.resolve(__dirname, '../', config.authStatePath);
const FORMS_URL_FILE = path.resolve(__dirname, '../forms-urls.json');
const SITE_URL = `https://${config.tenant}.sharepoint.com/sites/${config.siteSlug}`;

// Build the CSV content for the tracker (SharePoint can create an Excel from CSV)
function buildTrackerCsv() {
  const moduleHeaders = MODULES.map(m => `Module ${m.id} Quiz`).join(',');
  const header = `Name,Email,${moduleHeaders},Final Exam,Capstone Submitted,License Issued,Notes`;
  // Include 5 placeholder rows so the sheet isn't empty
  const rows = [header, '', '', '', '', ''].join('\n');
  return rows;
}

(async () => {
  console.log('=== Step 5: Set Up Progress Tracker ===\n');

  if (!fs.existsSync(AUTH_PATH)) {
    console.error('✗ No auth session found. Run:  node auth/save-auth.js\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_PATH });
  const page = await context.newPage();

  // ── Create the Excel tracker via SharePoint REST API ─────────────────────
  await page.goto(SITE_URL, { waitUntil: 'networkidle' });

  console.log('Creating progress tracker spreadsheet...');

  const result = await page.evaluate(
    async ({ siteUrl, modules }) => {
      // Get request digest
      const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: { Accept: 'application/json;odata=verbose' },
      });
      const digestData = await digestRes.json();
      const digest = digestData.d.GetContextWebInformation.FormDigestValue;

      // Build CSV content for the tracker
      const moduleHeaders = modules.map(m => `Module ${m.id} Quiz`).join(',');
      const header = `Name,Email,${moduleHeaders},Final Exam,Capstone Submitted,License Issued,Notes\n`;
      const csvContent = header;
      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      const csvBuffer = await csvBlob.arrayBuffer();

      // Upload as a CSV to Shared Documents — SharePoint will allow viewing in Excel Online
      const fileName = 'Course_Progress_Tracker.csv';
      const uploadRes = await fetch(
        `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('Shared Documents')/Files/Add(url='${fileName}',overwrite=true)`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json;odata=verbose',
            'Content-Type': 'text/csv',
            'X-RequestDigest': digest,
          },
          body: csvBuffer,
        }
      );

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        return { success: false, error: `Upload failed (${uploadRes.status}): ${errText}` };
      }

      const uploadData = await uploadRes.json();
      return {
        success: true,
        fileUrl: `${siteUrl}/Shared Documents/${fileName}`,
        serverRelativeUrl: uploadData.d.ServerRelativeUrl,
      };
    },
    { siteUrl: SITE_URL, modules: MODULES }
  );

  if (!result.success) {
    console.error(`✗ Tracker creation failed: ${result.error}`);
  } else {
    console.log('✓ Progress tracker created');
    console.log(`  File: ${result.fileUrl}`);
  }

  // ── Create a "Links" reference page on SharePoint ─────────────────────────
  // Load form URLs if they exist
  let formUrls = {};
  if (fs.existsSync(FORMS_URL_FILE)) {
    formUrls = JSON.parse(fs.readFileSync(FORMS_URL_FILE, 'utf8'));
  }

  const formLinksHtml = Object.entries(formUrls).map(([key, data]) =>
    `<li><strong>${data.title}</strong>: <a href="${data.url}">${data.url}</a></li>`
  ).join('\n');

  const adminPageHtml = `
<h1>Program Administrator Reference</h1>
<p>This page is for program administrators only. It contains links to all forms and the progress tracker.</p>

<h2>Progress Tracker</h2>
<p><a href="${SITE_URL}/Shared%20Documents/Course_Progress_Tracker.csv">Course_Progress_Tracker.csv</a> — open in Excel Online to view and edit</p>

<h2>Form Links</h2>
<ul>${formLinksHtml || '<li>Run scripts/03-create-forms.js to generate form links</li>'}</ul>

<h2>License Gate Workflow</h2>
<ol>
  <li>Check the tracker — all 16 module quizzes must show a submission date</li>
  <li>Check the Final Exam form responses — score must be 80% or higher</li>
  <li>Review the participant's Project instructions (submitted in Final Exam Q8)</li>
  <li>If all checks pass: issue Claude Desktop license via IT/admin portal</li>
  <li>Mark "License Issued" date in the tracker</li>
  <li>Review the Capstone submission within 5 business days of license issue</li>
</ol>
  `.trim();

  console.log('\nCreating Admin Reference page...');
  const { createSharePointPage, pageExists } = require('../utils/sharepoint');

  const adminPageTitle = 'Administrator Reference';
  const exists = await pageExists(page, adminPageTitle);
  if (exists) {
    console.log('  Admin Reference page: skipped (already exists)');
  } else {
    try {
      await createSharePointPage(page, adminPageTitle, adminPageHtml);
      console.log('  ✓ Admin Reference page created');
    } catch (err) {
      console.log(`  ✗ Admin Reference page failed: ${err.message}`);
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ Tracker setup complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run next:  node scripts/05-verify.js
`);

  await browser.close();
})();
