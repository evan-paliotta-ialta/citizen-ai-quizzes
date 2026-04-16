const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://app.hubspot.com/login/?loginPortalId=4565634');
  console.log('Please log in to HubSpot (Delio portal 4565634)...');

  // Wait until we land on a HubSpot app page (not login)
  await page.waitForURL('https://app.hubspot.com/**', { timeout: 120000 });
  await page.waitForTimeout(2000);
  console.log('Logged in. Saving auth...');

  await context.storageState({ path: path.join(__dirname, '../auth/hubspot-auth.json') });
  console.log('Saved to auth/hubspot-auth.json');
  await browser.close();
})();
