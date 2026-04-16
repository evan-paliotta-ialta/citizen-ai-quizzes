const { chromium } = require('playwright');
const path = require('path');

(async () => {
  // Use user's Chrome profile which has active HubSpot session
  const browser = await chromium.launchPersistentContext(
    '/Users/evanpaliotta/Library/Application Support/Google/Chrome/Default',
    {
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-first-run', '--no-default-browser-check']
    }
  );

  const page = await browser.newPage();

  // 1. Check Max's connected inbox in Delio (admin view)
  console.log('\n=== [1] Delio - Max connected inbox (admin) ===');
  await page.goto('https://app.hubspot.com/settings/4565634/email/private', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('URL:', page.url());
  let text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 3000));
  await page.screenshot({ path: '/tmp/delio-email-prefs.png', fullPage: true });

  // 2. Check Delio users to find Max
  console.log('\n=== [2] Delio users list ===');
  await page.goto('https://app.hubspot.com/settings/4565634/users', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('URL:', page.url());
  text = await page.evaluate(() => document.body.innerText);
  const maxIdx = text.toLowerCase().indexOf('max');
  console.log(text.substring(0, 2000));
  await page.screenshot({ path: '/tmp/delio-users.png', fullPage: true });

  // 3. Check Delio never-log settings
  console.log('\n=== [3] Delio email logging / never log settings ===');
  await page.goto('https://app.hubspot.com/settings/4565634/general', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  text = await page.evaluate(() => document.body.innerText);
  const emailIdx = text.toLowerCase().indexOf('never log');
  if (emailIdx > -1) console.log('Never log section:', text.substring(Math.max(0, emailIdx - 50), emailIdx + 500));
  else console.log(text.substring(0, 2000));
  await page.screenshot({ path: '/tmp/delio-general.png', fullPage: true });

  await browser.close();
  console.log('\nDone. Screenshots at /tmp/delio-*.png');
})();
