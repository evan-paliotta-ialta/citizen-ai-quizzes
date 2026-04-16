/**
 * Verify quiz and Final Exam submission pages.
 * Takes screenshots of what a student actually sees.
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');

const PAGES_TO_CHECK = [
  { label: 'Quiz_1', url: 'https://forms.office.com/Pages/ResponsePage.aspx?id=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1URVFIOE02S0VJSjZGT1NMUlpEMUQzUkJBQy4u' },
  { label: 'Quiz_13_Safety', url: 'https://forms.office.com/Pages/ResponsePage.aspx?id=emtdGS5jG0uCJ082nQr_8DCB3gRaXcJBpjzeCN56RK1UQU00Vlc5RkxLRDVNVFJEM1BGWUUwUkdOUi4u' },
  { label: 'Final_Exam_List', url: 'https://ialta.sharepoint.com/sites/CitizenAI/Lists/Final%20Exam%20Submissions/NewForm.aspx' },
];

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: AUTH_PATH,
    viewport: { width: 1280, height: 900 },
  });

  for (const item of PAGES_TO_CHECK) {
    const page = await context.newPage();
    log(`Navigating to ${item.label}`);
    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // For Forms pages, wait until the loading spinner is gone
      if (item.url.includes('forms.office.com')) {
        try {
          // Wait for form content to appear — Forms renders a div with the form questions
          await page.waitForFunction(
            () => document.body.innerText.length > 100 && !document.body.innerText.includes('Loading…'),
            { timeout: 20000 }
          );
        } catch (e) {
          log(`Form still loading after 20s for ${item.label}, taking screenshot anyway`);
        }
        await page.waitForTimeout(2000);
      } else {
        await page.waitForTimeout(4000);
      }

      const screenshotPath = path.join(__dirname, `verify_${item.label}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      log(`Screenshot saved: verify_${item.label}.png`);

      const info = await page.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        headings: Array.from(document.querySelectorAll('h1, h2, h3, [class*="title" i], [role="heading"]'))
                    .map(el => el.innerText?.trim()).filter(t => t && t.length > 2).slice(0, 8),
        formText: (document.body?.innerText || '').slice(0, 800),
      }));
      log(`--- ${item.label} ---`);
      log(`Title: ${info.title}`);
      log(`Headings: ${JSON.stringify(info.headings)}`);
      log(`Body text preview:\n${info.formText}`);
      log('');
    } catch (e) {
      log(`Error checking ${item.label}: ${e.message}`);
    }
    await page.close();
  }

  await browser.close();
  log('Done.');
})();
