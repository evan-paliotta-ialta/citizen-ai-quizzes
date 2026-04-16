/**
 * SharePoint Safety Module Updater — v2
 *
 * Adds "Key Risks" content to the Safety & Responsible Use module.
 * No interactive prompts — fully automated once you log in.
 *
 * Run from the "Citizen AI Engineer" folder:
 *   node update_sharepoint_safety_module.js
 */

const { chromium } = require("./playwright/node_modules/playwright");
const path = require("path");

const PROFILE_DIR = path.join(__dirname, ".sp-profile");
const PAGE_URL =
  "https://ialta.sharepoint.com/sites/CitizenAI/SitePages/Module-13--Safety-and-Responsible-Use.aspx";

const NEW_PARAGRAPHS = [
  "",
  "─── Key Risks ───",
  "",
  "Playwright + Prompt Injection",
  "If you use the Playwright MCP server to automate a browser, be aware: hidden content on web pages you visit can attempt to inject instructions that override Claude's behavior. A page doesn't have to look malicious to contain malicious instructions. This is one reason all Playwright sessions are automatically Zone 3 — they require extra care and awareness.",
  "",
  "Approved Clients Only",
  "Claude.ai in your browser and the Claude mobile app do NOT have the guardrails that Claude Desktop and Claude Code have. The managed settings, the MCP allowlist, and the hooks only apply to the approved desktop clients. All company work must happen through Claude Desktop or Claude Code. This is not optional — it's the difference between working under the program's protections and working outside them.",
  "",
  "Oversharing in Prompts",
  "Claude cannot access company data unless you give it access via an MCP server or paste the data yourself. The data classification decision happens the moment you add information to the conversation. Once something is in the context window, it has been processed. Think before you paste.",
];

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function ss(page, name) {
  await page.screenshot({ path: `sp_${name}.png`, fullPage: false });
  log(`Screenshot: sp_${name}.png`);
}

// ─── Find the editable canvas zone ───────────────────────────────────────────
async function findEditor(page) {
  // Try selectors in order of specificity for SharePoint modern canvas editor
  const candidates = [
    '[role="textbox"]',
    '[contenteditable="true"]',
    '.CanvasZone [contenteditable]',
    '[data-automation-id="CanvasControl"] [contenteditable]',
    ".rteContent",
    ".sp-rte-container [contenteditable]",
  ];

  for (const sel of candidates) {
    const els = await page.locator(sel).all();
    if (els.length > 0) {
      log(`Found editor via selector: ${sel} (${els.length} match(es))`);
      return els;
    }
  }

  // Fallback: evaluate in page context
  const found = await page.evaluate(() => {
    const els = document.querySelectorAll("[contenteditable]");
    return Array.from(els).map((el, i) => ({
      i,
      tag: el.tagName,
      role: el.getAttribute("role"),
      cls: el.className.slice(0, 80),
      textSnippet: (el.innerText || "").slice(0, 60),
    }));
  });
  log("Contenteditable elements found via evaluate:");
  console.log(JSON.stringify(found, null, 2));
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  log("Launching browser...");
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    slowMo: 80,
    args: ["--start-maximized"],
    viewport: null,
  });
  const page = await context.newPage();

  // ── 1. Navigate ──────────────────────────────────────────────────────────
  log(`Navigating to page: ${PAGE_URL}`);
  await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  // ── 2. Wait for full login + SharePoint page ─────────────────────────────
  // A fresh Playwright session has no cookies — the user must log in.
  // We wait up to 3 minutes for them to complete the Microsoft auth flow.
  log("Browser opened. Please log in with your Microsoft credentials.");
  log("Waiting for page to load (session should be pre-authenticated)...");
  try {
    await page.waitForURL(/sharepoint\.com\/sites\/CitizenAI/, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  } catch (e) {
    log(`Not on SharePoint yet — may need to log in. Waiting up to 3 minutes...`);
    try {
      await page.waitForURL(/sharepoint\.com\/sites\/CitizenAI/, { timeout: 180000 });
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    } catch (e2) {
      log(`Login timed out: ${e2.message}`);
      await ss(page, "01_login_timeout");
      await context.close();
      process.exit(1);
    }
  }
  await ss(page, "01_loaded");
  log(`Authenticated. URL: ${page.url()}`);

  // ── 3. Click Edit if not already editing ─────────────────────────────────
  const isEditing = await page.evaluate(() =>
    !!document.querySelector('[contenteditable="true"], [role="textbox"]')
  );

  if (!isEditing) {
    log("Not in edit mode — clicking Edit...");
    // SharePoint edit button options
    const editSelectors = [
      'button[name="Edit"]',
      'button[aria-label*="Edit"]',
      '[data-automation-id="editButton"]',
      'button:has-text("Edit")',
    ];
    let clicked = false;
    for (const sel of editSelectors) {
      const btn = page.locator(sel).first();
      if ((await btn.count()) > 0) {
        await btn.click();
        log(`Clicked edit via: ${sel}`);
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // Try the pencil icon in the top-right command bar
      await page.locator('[data-icon-name="Edit"], [aria-label="Edit page"]').first().click();
    }
    await page.waitForTimeout(3000);
    await ss(page, "02_edit_mode");
  } else {
    log("Already in edit mode.");
    await ss(page, "02_already_editing");
  }

  // ── 4. Find all text zones and pick the last one ──────────────────────────
  log("Enumerating canvas text zones...");
  const editors = await findEditor(page);

  if (!editors) {
    log("ERROR: Could not find any editable areas. Saving debug screenshot and exiting.");
    await ss(page, "error_no_editor");
    await browser.close();
    process.exit(1);
  }

  // Use page.evaluate to find the text zone that mentions "Prompt Injection"
  // and click it to position cursor
  log("Looking for the text section containing 'Prompt Injection'...");

  const targetFound = await page.evaluate(() => {
    const els = document.querySelectorAll("[contenteditable], [role='textbox']");
    for (const el of els) {
      if ((el.innerText || "").toLowerCase().includes("prompt injection")) {
        el.focus();
        // Move cursor to end of this element
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false); // collapse to end
        sel.removeAllRanges();
        sel.addRange(range);
        el.scrollIntoView({ behavior: "smooth", block: "end" });
        return true;
      }
    }
    // If not found, focus the last contenteditable on the page
    const allEditable = document.querySelectorAll("[contenteditable='true']");
    if (allEditable.length > 0) {
      const last = allEditable[allEditable.length - 1];
      last.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(last);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      last.scrollIntoView({ behavior: "smooth", block: "end" });
      return "last";
    }
    return false;
  });

  log(`Target found: ${targetFound}`);
  await ss(page, "03_cursor_positioned");

  if (!targetFound) {
    log("Could not position cursor. Saving state and exiting.");
    await ss(page, "error_cursor");
    await browser.close();
    process.exit(1);
  }

  // ── 5. Navigate to absolute end of the focused element ───────────────────
  await page.keyboard.press("Control+End");
  await page.waitForTimeout(300);

  // ── 6. Type the new content ───────────────────────────────────────────────
  log("Typing new content...");
  for (const line of NEW_PARAGRAPHS) {
    await page.keyboard.press("Enter");
    if (line) {
      await page.keyboard.type(line, { delay: 10 });
    }
    await page.waitForTimeout(30);
  }
  log("Content typed.");
  await ss(page, "04_content_typed");

  // ── 7. Dismiss overlay then publish via JS (bypasses pointer-intercept) ───
  log("Dismissing overlay and publishing...");
  await page.waitForTimeout(1000);

  // Dismiss the "Expand your SharePoint skills" overlay via JS
  await page.evaluate(() => {
    const article = document.querySelector('article[data-is-authoring-area="true"]');
    if (article) article.style.pointerEvents = "none";
    // Also try clicking the close button if visible
    const closeBtn = document.querySelector('[data-automation-id="teachingBubbleClose"], button[title="Close"]');
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(500);

  // JS click bypasses any remaining pointer-event interception
  const publishResult = await page.evaluate(() => {
    const btn = document.querySelector('[data-automation-id="pageCommandBarPublishButton"]');
    if (btn) { btn.click(); return btn.getAttribute("aria-label") || "clicked"; }
    // Fallback: find any Publish/Republish button
    const all = Array.from(document.querySelectorAll("button"));
    const pub = all.find(b => /publish|republish/i.test(b.getAttribute("aria-label") || b.textContent));
    if (pub) { pub.click(); return pub.textContent.trim() || "fallback clicked"; }
    return null;
  });

  let published = !!publishResult;
  log(published ? `Publish clicked: "${publishResult}"` : "Publish button not found via JS");

  await page.waitForTimeout(4000);
  await ss(page, "05_done");

  if (published) {
    log("✓  Content published successfully.");
  } else {
    log("⚠  Could not find Publish/Save — changes may not be saved. Check sp_05_done.png.");
  }

  log("Keeping browser open 20s for review...");
  await page.waitForTimeout(20000);
  await context.close();
  log("Done.");
})();
