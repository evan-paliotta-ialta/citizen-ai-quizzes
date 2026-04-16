/**
 * STEP 2 — Creates the SharePoint Communication Site.
 *
 * Run with:  node scripts/01-create-site.js
 *
 * What it does:
 *  1. Loads your saved Microsoft 365 session
 *  2. Navigates to the SharePoint home
 *  3. Clicks "Create site" → "Communication site"
 *  4. Fills in the site name and description
 *  5. Waits for the site to be provisioned
 *  6. Confirms the site URL
 *
 * Safe to re-run — if the site already exists, it will detect this and skip creation.
 */

const { chromium } = require('playwright');
const path = require('path');
const config = require('../config');

const SITE_URL = `https://${config.tenant}.sharepoint.com/sites/${config.siteSlug}`;
const AUTH_PATH = path.resolve(__dirname, '../', config.authStatePath);

(async () => {
  console.log('=== Step 2: Create SharePoint Site ===\n');

  // ── Check if auth state exists ──────────────────────────────────────────
  const fs = require('fs');
  if (!fs.existsSync(AUTH_PATH)) {
    console.error('✗ No auth session found. Run this first:\n  node auth/save-auth.js\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false }); // headless: false so you can see what's happening
  const context = await browser.newContext({ storageState: AUTH_PATH });
  const page = await context.newPage();

  // ── Check if site already exists ────────────────────────────────────────
  console.log(`Checking if site already exists at: ${SITE_URL}`);
  const checkResponse = await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

  if (checkResponse && checkResponse.status() === 200) {
    const title = await page.title();
    if (!title.toLowerCase().includes('error') && !title.toLowerCase().includes('not found')) {
      console.log(`✓ Site already exists at: ${SITE_URL}`);
      console.log('  Skipping creation. Proceeding to next step.\n');
      console.log('Run next:  node scripts/02-create-pages.js');
      await browser.close();
      return;
    }
  }

  // ── Navigate to SharePoint home ──────────────────────────────────────────
  console.log('Navigating to SharePoint home...');
  await page.goto(`https://${config.tenant}.sharepoint.com`, { waitUntil: 'networkidle' });

  // ── Click "+ Create site" ────────────────────────────────────────────────
  console.log('Looking for "Create site" button...');
  try {
    // SharePoint home has a "Create site" button — selector may vary by tenant config
    await page.waitForSelector(
      '[data-automationid="createSiteButton"], button:has-text("Create site"), a:has-text("Create site")',
      { timeout: 15000 }
    );
    await page.click(
      '[data-automationid="createSiteButton"], button:has-text("Create site"), a:has-text("Create site")'
    );
  } catch {
    // Fallback: use the SharePoint admin approach via URL
    console.log('  Create site button not found via selector — trying alternate approach...');
    await page.goto(
      `https://${config.tenant}.sharepoint.com/_layouts/15/sharepoint.aspx`,
      { waitUntil: 'networkidle' }
    );
    await page.click('button:has-text("Create site"), a:has-text("Create site")');
  }

  // ── Choose "Communication site" ──────────────────────────────────────────
  console.log('Selecting Communication site...');
  await page.waitForSelector(
    '[data-automationid="CommunicationSite"], button:has-text("Communication site")',
    { timeout: 15000 }
  );
  await page.click(
    '[data-automationid="CommunicationSite"], button:has-text("Communication site")'
  );

  // ── Fill in site details ─────────────────────────────────────────────────
  console.log('Filling in site name...');

  // Site name field
  await page.waitForSelector('input[id*="SiteName"], input[placeholder*="name"], input[aria-label*="name" i]', { timeout: 15000 });
  const nameField = await page.$('input[id*="SiteName"], input[placeholder*="name"], input[aria-label*="name" i]');
  await nameField.fill(config.siteName);

  // Wait for the URL slug to auto-populate, then check it matches our desired slug
  await page.waitForTimeout(1500);

  // Site description field (optional but useful)
  const descField = await page.$('textarea[id*="Description"], input[id*="Description"], textarea[aria-label*="description" i]');
  if (descField) {
    await descField.fill(config.siteDescription);
  }

  // ── Click "Finish" / "Create" ────────────────────────────────────────────
  console.log('Submitting site creation...');
  await page.click(
    'button:has-text("Finish"), button:has-text("Create"), [data-automationid="wizardSubmitButton"]'
  );

  // ── Wait for provisioning ────────────────────────────────────────────────
  console.log('Waiting for site to be provisioned (this can take 60–90 seconds)...');
  try {
    await page.waitForURL(`**${config.siteSlug}**`, { timeout: 180000 });
    await page.waitForLoadState('networkidle');
    console.log(`\n✓ Site created successfully: ${SITE_URL}`);
  } catch {
    console.log('\n⚠ Timeout waiting for site URL — checking current page...');
    console.log(`  Current URL: ${page.url()}`);
    console.log('  If provisioning is still in progress, wait 2–3 minutes and check:');
    console.log(`  ${SITE_URL}`);
  }

  console.log('\nRun next:  node scripts/02-create-pages.js\n');
  await browser.close();
})();
