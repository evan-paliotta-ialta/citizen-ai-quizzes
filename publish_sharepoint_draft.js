/**
 * Publish the Safety module draft on SharePoint.
 * The content is already saved as a draft — this script just publishes it.
 *
 * Run from the "Citizen AI Engineer" folder:
 *   node publish_sharepoint_draft.js
 */

const { chromium } = require("./playwright/node_modules/playwright");
const path = require("path");

const PROFILE_DIR = path.join(__dirname, ".sp-profile");
const PAGE_URL =
  "https://ialta.sharepoint.com/sites/CitizenAI/SitePages/Module-13--Safety-and-Responsible-Use.aspx";

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function ss(page, name) {
  await page.screenshot({ path: `pub_${name}.png`, fullPage: false });
  log(`Screenshot: pub_${name}.png`);
}

(async () => {
  log("Launching browser with saved session...");
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    slowMo: 100,
    viewport: null,
  });
  const page = await context.newPage();

  // ── Navigate ──────────────────────────────────────────────────────────────
  log("Going to Safety module page...");
  await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  // ── Wait for login ────────────────────────────────────────────────────────
  log("Waiting for you to log in (up to 3 minutes)...");
  try {
    await page.waitForURL(/sharepoint\.com\/sites\/CitizenAI/, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  } catch (e) {
    log("Session expired or not set up — waiting for manual login (up to 3 min)...");
    try {
      await page.waitForURL(/sharepoint\.com\/sites\/CitizenAI/, { timeout: 180000 });
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    } catch {
      log("Login timed out. Run setup_sp_session.js first.");
      await context.close();
      process.exit(1);
    }
  }
  await ss(page, "01_loaded");
  log("On SharePoint. Looking for edit/draft state...");

  // ── Enter edit mode ───────────────────────────────────────────────────────
  // Try to click "Resume editing" (for a saved draft) or "Edit"
  const resumeBtn = page.locator('button:has-text("Resume editing")').first();
  const editBtn   = page.locator('button[name="Edit"]').first();

  if (await resumeBtn.count() > 0) {
    log("Found 'Resume editing' — clicking...");
    await resumeBtn.click();
  } else if (await editBtn.count() > 0) {
    log("Found 'Edit' button — clicking...");
    await editBtn.click();
  } else {
    log("Neither Resume editing nor Edit button found — may already be in edit mode.");
  }
  await page.waitForTimeout(3000);
  await ss(page, "02_edit_mode");

  // ── Dismiss any overlay ───────────────────────────────────────────────────
  log("Dismissing any overlays...");
  // Press Escape to close any tooltips/panels
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  // Look for and click the X on the "Expand your SharePoint skills" panel
  const closeOverlay = page.locator([
    'button[aria-label*="Close"]',
    'button[aria-label*="close"]',
    '[data-automation-id="teachingBubbleClose"]',
    'button.ms-TeachingBubble-closebutton',
    'button[title="Close"]',
  ].join(", ")).first();

  if (await closeOverlay.count() > 0) {
    await closeOverlay.click();
    log("Overlay dismissed.");
    await page.waitForTimeout(500);
  }

  // Also click somewhere neutral to deselect web part panel
  await page.mouse.click(400, 300);
  await page.waitForTimeout(500);
  await ss(page, "03_overlays_dismissed");

  // ── Verify new content is present ────────────────────────────────────────
  const hasNewContent = await page.evaluate(() =>
    document.body.innerText.includes("Key Risks")
  );
  log(`New content present on page: ${hasNewContent}`);

  // ── Publish via JS (bypasses any remaining pointer-intercept issues) ──────
  log("Publishing via JavaScript click...");
  const published = await page.evaluate(() => {
    // Try data-automation-id first
    let btn = document.querySelector('[data-automation-id="pageCommandBarPublishButton"]');
    if (!btn) {
      // Try aria-label containing Publish or Republish
      const btns = Array.from(document.querySelectorAll("button"));
      btn = btns.find(b =>
        /publish|republish/i.test(b.getAttribute("aria-label") || "") ||
        /publish|republish/i.test(b.textContent || "")
      );
    }
    if (btn) {
      btn.click();
      return btn.getAttribute("aria-label") || btn.textContent || "found and clicked";
    }
    return null;
  });

  if (published) {
    log(`Publish button clicked: "${published}"`);
  } else {
    log("Publish button not found via JS — trying Playwright locator with force...");
    await page.locator(
      '[data-automation-id="pageCommandBarPublishButton"]'
    ).click({ force: true });
    log("Force-clicked publish.");
  }

  await page.waitForTimeout(5000);
  await ss(page, "04_after_publish");

  // ── Verify ────────────────────────────────────────────────────────────────
  const url = page.url();
  log(`Final URL: ${url}`);
  const pageTitle = await page.title();
  log(`Page title: ${pageTitle}`);

  // Check if we're back in view mode (no edit controls = published)
  const stillEditing = await page.evaluate(() =>
    !!document.querySelector('[data-automation-id="pageCommandBarPublishButton"]')
  );
  log(stillEditing ? "⚠  Still in edit mode — may not have published yet." : "✓  Page appears published (edit controls gone).");

  log("Keeping browser open 15s...");
  await page.waitForTimeout(15000);
  await context.close();
  log("Done.");
})();
