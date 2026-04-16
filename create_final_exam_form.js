/**
 * Creates the Final Exam Microsoft Form and links it to the Final Exam SharePoint page.
 *
 * Uses the saved persistent browser profile (.sp-profile/) which has full
 * Microsoft 365 auth including forms.office.com.
 *
 * Run: node create_final_exam_form.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const PROFILE_DIR = path.join(__dirname, '.sp-profile');
const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }
async function ss(page, name) {
  await page.screenshot({ path: `form_${name}.png`, fullPage: false });
  log(`Screenshot: form_${name}.png`);
}

// ─── Update the Final Exam SharePoint page with a forms link ─────────────────
async function updateFinalExamPage(formUrl) {
  log(`Linking Final Exam to form: ${formUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_PATH });
  const page = await context.newPage();
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const result = await page.evaluate(
    async ({ siteUrl, formUrl }) => {
      const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
      });
      const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

      const res = await fetch(`${siteUrl}/_api/sitepages/pages(32)?$select=Id,Title,CanvasContent1`,
        { headers: { Accept: 'application/json;odata=verbose' } });
      const data = await res.json();
      const canvas = JSON.parse(data.d.CanvasContent1 || '[]');

      // Check if form already linked
      const allHtml = canvas.map(b => b.innerHTML || '').join('');
      if (allHtml.includes(formUrl) || allHtml.includes('forms.office.com')) {
        return { status: 'already_linked' };
      }

      // Add submission button + celebration text before closing of last block
      const submitHtml = `
<hr>
<table style="width:100%;border-collapse:collapse;margin-top:24px;">
  <tbody><tr>
    <td style="padding:24px;background-color:#0042E0;text-align:center;">
      <a href="${formUrl}" style="color:white;font-weight:700;font-size:20px;text-decoration:none;">
        → Submit Final Exam
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:16px;background-color:#000D2D;text-align:center;">
      <span style="color:#aac4ff;font-size:13px;">Your license will be issued within one business day of the program administrator reviewing your submission.</span>
    </td>
  </tr></tbody>
</table>`;

      // Find the last content block and append the submit button
      const lastBlock = canvas[canvas.length - 1];
      if (lastBlock && lastBlock.innerHTML !== undefined) {
        lastBlock.innerHTML += submitHtml;
      }

      await fetch(`${siteUrl}/_api/sitepages/pages(32)/checkout`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(32)`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*',
        },
        body: JSON.stringify({ __metadata: { type: 'SP.Publishing.SitePage' }, CanvasContent1: JSON.stringify(canvas) }),
      });
      if (!saveRes.ok) return { status: `save_failed_${saveRes.status}` };

      const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(32)/publish`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}` };
    },
    { siteUrl: SITE_URL, formUrl }
  );

  await browser.close();
  return result;
}

// ─── Try Forms API approach (if available) ────────────────────────────────────
async function tryFormsAPI(page) {
  log('Trying Microsoft Forms internal API...');

  const result = await page.evaluate(async () => {
    // Try to get the Forms API base URL and current user info from the page
    try {
      const res = await fetch('/formapi/api/forms', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return { available: true, sample: JSON.stringify(data).slice(0, 200) };
      }
      return { available: false, status: res.status };
    } catch (e) {
      return { available: false, error: e.message };
    }
  });

  return result;
}

// ─── Create form via Microsoft Forms UI ──────────────────────────────────────
async function createFormViaUI(page) {
  log('Navigating to Microsoft Forms...');
  await page.goto('https://forms.office.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  await ss(page, '01_forms_home');

  // Check if we're on the forms page or still on login
  const url = page.url();
  if (url.includes('login') || url.includes('microsoftonline')) {
    log('Not authenticated for Forms — session may not cover forms.office.com');
    return null;
  }
  log(`On Forms page: ${url}`);

  // Try the internal API first since we're on the page
  const apiCheck = await tryFormsAPI(page);
  log(`Forms API check: ${JSON.stringify(apiCheck)}`);

  // Look for "New Form" button
  log('Looking for New Form button...');
  const newFormSelectors = [
    'button:has-text("New Form")',
    '[aria-label*="New Form" i]',
    '[data-automation-id*="newForm" i]',
    'button:has-text("New form")',
    'button:has-text("New quiz")',
    '[title*="New Form" i]',
  ];

  let clicked = false;
  for (const sel of newFormSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.count() > 0) {
      log(`Clicking New Form via: ${sel}`);
      await btn.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    // Try to find by screenshot inspection — look for any button or card
    log('Could not find New Form button — trying alternative approach');
    await ss(page, '02_no_new_form_button');

    // Try navigating directly to form creation
    await page.goto('https://forms.office.com/FormsPro/Pages/DesignPage.aspx', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss(page, '02b_design_page');
  }

  await page.waitForTimeout(3000);
  await ss(page, '03_after_new_form_click');

  // Set form title
  log('Setting form title...');
  const titleSelectors = [
    '[aria-label*="title" i][contenteditable]',
    '[placeholder*="Untitled form" i]',
    '[data-automation-id*="title" i]',
    '.title-box',
    'h1[contenteditable]',
    '[class*="title"][contenteditable]',
    'input[placeholder*="title" i]',
  ];

  let titleSet = false;
  for (const sel of titleSelectors) {
    const el = page.locator(sel).first();
    if (await el.count() > 0) {
      await el.click();
      await page.keyboard.selectAll();
      await page.keyboard.type('Final Exam — Citizen AI Developer Program');
      titleSet = true;
      log(`Title set via: ${sel}`);
      break;
    }
  }

  if (!titleSet) {
    log('Could not find title field');
    await ss(page, '04_no_title_field');
    return null;
  }

  await page.waitForTimeout(1000);
  await ss(page, '04_title_set');

  // Add questions
  log('Adding questions...');
  const addBtnSelectors = [
    'button[aria-label*="Add new" i]',
    '[data-automation-id*="addQuestion" i]',
    'button:has-text("Add new")',
    '[title*="Add" i][class*="add" i]',
    '.add-question-button',
  ];

  async function clickAddQuestion() {
    for (const sel of addBtnSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(800);
        return true;
      }
    }
    // Try the "+" button
    const plusBtn = page.locator('button').filter({ hasText: '+' }).first();
    if (await plusBtn.count() > 0) {
      await plusBtn.click();
      await page.waitForTimeout(800);
      return true;
    }
    return false;
  }

  async function selectQuestionType(type) {
    // After clicking Add, a dropdown/menu appears
    // type is 'Text', 'Choice', etc.
    const typeSelectors = [
      `[aria-label*="${type}" i]`,
      `button:has-text("${type}")`,
      `[data-automation-id*="${type}" i]`,
      `[title*="${type}" i]`,
    ];
    for (const sel of typeSelectors) {
      const el = page.locator(sel).first();
      if (await el.count() > 0) {
        await el.click();
        await page.waitForTimeout(500);
        return true;
      }
    }
    return false;
  }

  const questions = [
    { type: 'Text', text: 'Your full name', required: true, long: false },
    { type: 'Text', text: 'Your team / department', required: true, long: false },
    {
      type: 'Text',
      text: 'Questions 1–25 answers (copy the format: Q1:B, Q2:C, Q3:A, Q4:B, Q5:C, ... Q25:D)',
      required: true,
      long: true,
    },
    {
      type: 'Text',
      text: 'Practical Submission 1 — Scenario Analysis: Answer all three questions for the competitive intelligence scenario. (1) What Zone is this task? Justify your answer. (2) Write the full 5-element prompt you would use. (3) Identify one risk and how you would mitigate it.',
      required: true,
      long: true,
    },
    {
      type: 'Text',
      text: 'Practical Submission 2 — Project Setup: Paste your Claude Desktop Project instructions in full. These should include: your name, role, company context, communication style, and at least two standing rules.',
      required: true,
      long: true,
    },
  ];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    log(`Adding question ${i + 1}: ${q.text.slice(0, 50)}...`);

    const added = await clickAddQuestion();
    if (!added) {
      log(`Could not click Add button for question ${i + 1}`);
      await ss(page, `05_add_fail_q${i + 1}`);
      continue;
    }

    // Select Text type
    await selectQuestionType(q.type);
    await ss(page, `05_q${i + 1}_type_selected`);

    // Find the question text field (most recently added)
    await page.waitForTimeout(500);

    // Type the question text
    const questionTextSels = [
      '[aria-label*="question text" i]',
      '[placeholder*="question" i]',
      '[contenteditable][class*="question" i]',
    ];
    let typedQuestion = false;
    for (const sel of questionTextSels) {
      const els = await page.locator(sel).all();
      if (els.length > 0) {
        const lastEl = els[els.length - 1];
        await lastEl.click();
        await lastEl.fill(q.text);
        typedQuestion = true;
        break;
      }
    }
    if (!typedQuestion) {
      // Try Tab key to move to question field after selecting type
      await page.keyboard.press('Tab');
      await page.keyboard.type(q.text);
    }

    await page.waitForTimeout(300);
  }

  await ss(page, '06_questions_added');

  // Get the sharing link
  log('Getting sharing link...');
  await page.waitForTimeout(1000);

  // Look for Share button
  const shareBtnSels = [
    'button:has-text("Share")',
    '[aria-label*="Share" i]',
    '[data-automation-id*="share" i]',
  ];

  let shareClicked = false;
  for (const sel of shareBtnSels) {
    const btn = page.locator(sel).first();
    if (await btn.count() > 0) {
      await btn.click();
      shareClicked = true;
      log(`Share clicked via: ${sel}`);
      await page.waitForTimeout(2000);
      break;
    }
  }

  await ss(page, '07_share_dialog');

  // Try to extract the form URL from the page
  const formUrl = await page.evaluate(() => {
    // Look for the shareable link in the page
    const inputs = document.querySelectorAll('input[type="text"]');
    for (const input of inputs) {
      if (input.value.includes('forms.office.com')) {
        return input.value;
      }
    }
    // Try the current URL - if it's the edit URL, derive the share URL
    const url = window.location.href;
    if (url.includes('forms.office.com') && url.includes('id=')) {
      // Extract the form ID
      const match = url.match(/id=([A-Za-z0-9_-]+)/);
      if (match) {
        return `https://forms.office.com/Pages/ResponsePage.aspx?id=${match[1]}`;
      }
    }
    // Return the current edit URL as fallback
    return url;
  });

  log(`Form URL: ${formUrl}`);
  await ss(page, '08_final');

  return formUrl;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  log('Launching browser with persistent profile...');
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    slowMo: 100,
    viewport: null,
    args: ['--start-maximized'],
  });
  const page = await context.newPage();

  let formUrl = null;

  try {
    formUrl = await createFormViaUI(page);
  } catch (e) {
    log(`Form creation error: ${e.message}`);
    await ss(page, 'error_form_creation');
  }

  if (formUrl && formUrl.includes('forms.office.com')) {
    log(`✓ Form created: ${formUrl}`);

    // Update the Final Exam SharePoint page
    const updateResult = await updateFinalExamPage(formUrl);
    log(`Final Exam page update: ${JSON.stringify(updateResult)}`);

    // Write the URL to a file for reference
    fs.writeFileSync(path.join(__dirname, 'final_exam_form_url.txt'), formUrl + '\n');
    log(`Form URL saved to: final_exam_form_url.txt`);
  } else {
    log(`⚠ Form URL not obtained (got: ${formUrl})`);
    log('Check the screenshots (form_*.png) to see what happened.');
    log('You can create the form manually at forms.office.com and then run:');
    log('  node update_final_exam_link.js <form-url>');
  }

  log('Keeping browser open 15s for review...');
  await page.waitForTimeout(15000);
  await context.close();
  log('Done.');
})();
