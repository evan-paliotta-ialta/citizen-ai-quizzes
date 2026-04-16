/**
 * ONE-TIME SETUP: Log in to SharePoint and save your session.
 * After this runs once, all other scripts reuse the saved session — no more logins.
 *
 * Run: node setup_sp_session.js
 * Log in when the browser opens. Close the browser manually when done.
 * Session is saved to: .sp-profile/ (persists until Microsoft token expires, ~90 days)
 */

const { chromium } = require("./playwright/node_modules/playwright");
const path = require("path");

const PROFILE_DIR = path.join(__dirname, ".sp-profile");

(async () => {
  console.log("Opening persistent browser — log in to Microsoft, then close the browser window.");
  console.log(`Session will be saved to: ${PROFILE_DIR}`);

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    slowMo: 50,
    args: ["--start-maximized"],
    viewport: null,
  });

  const page = await context.newPage();
  await page.goto("https://ialta.sharepoint.com/sites/CitizenAI");

  console.log("Waiting for you to log in... Close the browser window when you're on the SharePoint site.");
  // Wait until the browser is closed by the user
  await page.waitForEvent("close", { timeout: 300000 }).catch(() => {});
  await context.close();

  console.log("Session saved. Future scripts will use this session automatically.");
})();
