/**
 * create_forms_quizzes.js
 *
 * Creates 16 auto-graded Microsoft Forms quizzes using the questions from the
 * existing SharePoint quiz pages. Updates each SharePoint quiz page with a
 * "Take Quiz" button linking to the graded form.
 *
 * Run: node create_forms_quizzes.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function clearModals(page) {
  await page.evaluate(() => {
    const host = document.getElementById('fluent-default-layer-host');
    if (host) host.innerHTML = '';
    // Also remove any ms-Overlay elements
    document.querySelectorAll('.ms-Overlay, .ms-Dialog-main').forEach(el => el.remove());
  }).catch(() => {});
}

// Wait for an element via JS polling (avoids Playwright locator engine bugs)
async function waitForElement(page, selectorFn, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const found = await page.evaluate(selectorFn).catch(() => false);
    if (found) return true;
    await sleep(300);
  }
  throw new Error(`Timeout waiting for element (${timeout}ms)`);
}

// ─── Parse questions from SharePoint HTML ─────────────────────────────────────

function parseQuizHTML(html) {
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const questions = [];
  const qRegex = /Question\s+(\d+)\s+([\s\S]*?)(?=Question\s+\d+|$)/g;
  let qMatch;
  while ((qMatch = qRegex.exec(plain)) !== null) {
    const block = qMatch[2].trim();
    const correctMatch = block.match(/Correct answer\s*[:\s]+([A-D])/i);
    const correct = correctMatch ? correctMatch[1].toUpperCase() : '?';
    const qTextMatch = block.match(/^([\s\S]*?)\s+[A-D]\)\s/);
    const qText = qTextMatch ? qTextMatch[1].trim() : block.split(/\s+[A-D]\)\s/)[0].trim();
    const choices = {};
    const choiceRegex = /([A-D])[)\.]?\s+(.*?)(?=\s+[A-D][)\.]?\s+|\s+Correct answer|$)/gi;
    let cMatch;
    while ((cMatch = choiceRegex.exec(block)) !== null) {
      choices[cMatch[1].toUpperCase()] = cMatch[2].trim();
    }
    if (qText && Object.keys(choices).length >= 2) {
      questions.push({ num: parseInt(qMatch[1]), text: qText, choices, correct });
    }
  }
  return questions;
}

// ─── Quiz metadata ─────────────────────────────────────────────────────────────

const QUIZ_PAGES = [
  { id: 34, moduleNum: 1,  title: "Quiz — Module 1: What Claude Is (and Isn't)",               passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-2--How-the-Model-Was-Built.aspx` },
  { id: 17, moduleNum: 2,  title: 'Quiz — Module 2: How the Model Was Built',                   passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-3--Tokens-—-The-Currency-of-AI.aspx` },
  { id: 18, moduleNum: 3,  title: 'Quiz — Module 3: Tokens — The Currency of AI',               passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-4--The-Context-Window.aspx` },
  { id: 19, moduleNum: 4,  title: 'Quiz — Module 4: The Context Window',                        passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-5--Why-Specificity-is-Everything.aspx` },
  { id: 20, moduleNum: 5,  title: 'Quiz — Module 5: Why Specificity is Everything',             passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-6--Anatomy-of-a-Good-Prompt.aspx` },
  { id: 21, moduleNum: 6,  title: 'Quiz — Module 6: Anatomy of a Good Prompt',                  passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-7--Iteration,-Examples,-and-Getting-to-Great.aspx` },
  { id: 22, moduleNum: 7,  title: 'Quiz — Module 7: Iteration, Examples, and Getting to Great', passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-8--Tips,-Tricks,-and-Power-User-Habits.aspx` },
  { id: 23, moduleNum: 8,  title: 'Quiz — Module 8: Tips, Tricks, and Power User Habits',       passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-9--The-Operating-Framework.aspx` },
  { id: 24, moduleNum: 9,  title: 'Quiz — Module 9: The Operating Framework',                   passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-10--Claude-Desktop-Projects.aspx` },
  { id: 25, moduleNum: 10, title: 'Quiz — Module 10: Claude Desktop Projects',                  passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-11--Documents,-Images,-and-Multimodal-Input.aspx` },
  { id: 26, moduleNum: 11, title: 'Quiz — Module 11: Documents, Images, and Multimodal Input',  passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-12--Claude-for-Your-Team.aspx` },
  { id: 27, moduleNum: 12, title: 'Quiz — Module 12: Claude for Your Team',                     passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-13--Safety-and-Responsible-Use.aspx` },
  { id: 28, moduleNum: 13, title: 'Quiz — Module 13: Safety and Responsible Use',               passingScore: 5, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-14--MCP,-Agents,-and-RAG.aspx` },
  { id: 29, moduleNum: 14, title: 'Quiz — Module 14: MCP, Agents, and RAG',                     passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-15--GitHub-—-The-Collaboration-Layer.aspx` },
  { id: 30, moduleNum: 15, title: 'Quiz — Module 15: GitHub — The Collaboration Layer',         passingScore: 4, nextUrl: `${SITE_URL}/SitePages/Quiz-—-Module-16--Databases-and-Data-Storage.aspx` },
  { id: 31, moduleNum: 16, title: 'Quiz — Module 16: Databases and Data Storage',               passingScore: 4, nextUrl: null },
];

// ─── Step 1: Fetch questions from SharePoint ───────────────────────────────────

async function fetchAllQuestions(spPage) {
  log('Fetching quiz questions from SharePoint...');
  const rawPages = await spPage.evaluate(async (siteUrl) => {
    const r = await fetch(`${siteUrl}/_api/sitepages/pages?$select=Id,Title,CanvasContent1&$top=100`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const d = await r.json();
    return d.d.results.reduce((acc, p) => { acc[p.Id] = p.CanvasContent1; return acc; }, {});
  }, SITE_URL);

  const allQuestions = {};
  for (const qp of QUIZ_PAGES) {
    const raw = rawPages[qp.id];
    if (!raw) { log(`  SKIP [${qp.id}]: no canvas`); continue; }
    let html = '';
    try { html = JSON.parse(raw).map(b => b.innerHTML || '').join(' '); }
    catch { html = raw; }
    const questions = parseQuizHTML(html);
    allQuestions[qp.id] = questions;
    log(`  [${qp.id}] Module ${qp.moduleNum}: ${questions.length} questions`);
  }
  return allQuestions;
}

// ─── Step 2: Add one question to the open Forms quiz ─────────────────────────

async function addQuestion(tab, q, isFirst) {
  const sorted = Object.entries(q.choices).sort(([a], [b]) => a.localeCompare(b));
  const correctIdx = sorted.findIndex(([l]) => l === q.correct);

  // Count existing options BEFORE adding new question (baseline for this question's options)
  const baseOptIdx = await tab.evaluate(() =>
    document.querySelectorAll('[aria-label*="Choice Option Text"]').length
  );

  if (!isFirst) {
    // Click "Add new question"
    const addClicked = await tab.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => (/add new question/i.test(b.textContent) || b.getAttribute('aria-label') === 'Add new question')
          && b.offsetParent !== null);
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!addClicked) throw new Error('Could not find "Add new question" button');
    await sleep(1200);

    // Click "Choice" from the question type panel
    const choiceClicked = await tab.evaluate(() => {
      let btn = document.querySelector('[aria-label="Choice"]');
      if (!btn) {
        btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.trim() === 'Choice' && b.offsetParent !== null);
      }
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!choiceClicked) throw new Error('Could not find "Choice" button');
    await sleep(2500);
  }

  // Wait for question title field using JS polling (avoids Playwright locator engine bug)
  log(`    Waiting for Q${q.num} title field...`);
  await tab.waitForFunction(() => {
    return Array.from(document.querySelectorAll('[aria-label]'))
      .some(e => e.getAttribute('aria-label')?.includes('Question title'));
  }, null, { timeout: 15000 });

  // Wait for the 2 default option slots to appear at baseOptIdx and baseOptIdx+1
  await tab.waitForFunction((base) => {
    return document.querySelectorAll('[aria-label*="Choice Option Text"]').length >= base + 2;
  }, baseOptIdx, { timeout: 10000 });

  // Click the LAST question title field (newest question)
  await tab.evaluate(() => {
    const els = Array.from(document.querySelectorAll('[aria-label]'))
      .filter(e => e.getAttribute('aria-label')?.includes('Question title'));
    const el = els[els.length - 1];
    if (el) { el.focus(); el.click(); }
  });
  await sleep(500);
  await tab.keyboard.press('Control+A');
  await tab.keyboard.type(q.text, { delay: 15 });
  await sleep(400);

  // Fill each choice option
  for (let i = 0; i < sorted.length; i++) {
    const [letter, text] = sorted[i];
    const optIdx = baseOptIdx + i;

    if (i >= 2) {
      // Need to add another option slot first
      const addOptClicked = await tab.evaluate(() => {
        // "Add option" button is near the active question
        const btn = Array.from(document.querySelectorAll('button, [role=button]'))
          .find(b => /^add option$/i.test(b.textContent.trim()) && b.offsetParent !== null);
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (!addOptClicked) {
        // fallback: look for any "Add option" link/span
        await tab.evaluate(() => {
          const el = Array.from(document.querySelectorAll('*'))
            .find(e => /^add option$/i.test(e.textContent.trim()) && e.offsetParent !== null
              && ['BUTTON','A','SPAN','DIV'].includes(e.tagName));
          if (el) el.click();
        });
      }
      await sleep(900);
    }

    // Wait for the option field to exist at this index
    await tab.waitForFunction((idx) => {
      return document.querySelectorAll('[aria-label*="Choice Option Text"]').length > idx;
    }, optIdx, { timeout: 10000 });

    // Click and fill
    await tab.evaluate((idx) => {
      const opts = Array.from(document.querySelectorAll('[aria-label*="Choice Option Text"]'));
      if (opts[idx]) { opts[idx].focus(); opts[idx].click(); }
    }, optIdx);
    await sleep(350);
    await tab.keyboard.press('Control+A');
    await tab.keyboard.type(`${letter}) ${text}`, { delay: 12 });
    await sleep(250);
  }

  // Mark the correct answer
  // "Correct answer" toggle buttons appear once per option in the active question
  await sleep(600);
  // Count total "Correct answer" buttons — last N belong to current question (N = sorted.length)
  const totalCorrectBtns = await tab.evaluate(() =>
    document.querySelectorAll('[aria-label="Correct answer"]').length
  );
  const correctBtnIdx = totalCorrectBtns - sorted.length + correctIdx;

  const marked = await tab.evaluate((idx) => {
    const btns = Array.from(document.querySelectorAll('[aria-label="Correct answer"]'));
    if (btns[idx]) { btns[idx].click(); return true; }
    return false;
  }, correctBtnIdx);

  if (!marked) {
    log(`    WARNING: could not mark correct answer for Q${q.num} (btn idx ${correctBtnIdx})`);
  }

  log(`    Q${q.num} ✓  (correct: ${q.correct})`);
  await sleep(400);
}

// ─── Step 2 main: Open Forms, create a quiz, return its share URL ─────────────

async function createFormsQuiz(ctx, homeTab, quizTitle, questions) {
  log(`  Creating: ${quizTitle}`);

  // Navigate to Forms home if needed
  if (!homeTab.url().includes('forms.microsoft.com')) {
    await homeTab.goto('https://forms.microsoft.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  // Wait for "Create a new quiz" button
  await homeTab.waitForFunction(
    () => !!document.querySelector('[aria-label="Create a new quiz"]'),
    null, { timeout: 30000 }
  );

  // Click "Create a new quiz" — it opens a new tab with the editor.
  // Strategy: capture the editor URL from the new tab, then navigate homeTab there directly.
  // (New tabs can hit SSO issues; homeTab already has a valid Forms session.)
  await clearModals(homeTab);

  let editorUrl = '';
  const newPageP = ctx.waitForEvent('page', { timeout: 25000 }).catch(() => null);
  await homeTab.evaluate(() => {
    const btn = document.querySelector('[aria-label="Create a new quiz"]');
    if (btn) {
      ['mouseenter', 'mouseover', 'mousedown', 'mouseup', 'click'].forEach(type => {
        btn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      });
    }
  });

  // Wait for the popup to navigate to the editor URL (may take a few seconds through SSO)
  const popupTab = await newPageP;
  if (popupTab) {
    // Wait for the popup to finish navigating (it might go through SSO redirects)
    try {
      await popupTab.waitForURL(u => u.includes('subpage=design'), { timeout: 20000 });
      editorUrl = popupTab.url();
    } catch {
      // Fallback: just grab whatever URL it landed on
      editorUrl = popupTab.url();
    }
    await popupTab.close();
  }

  if (!editorUrl || !editorUrl.includes('subpage=design')) {
    // If popup approach failed, try getting the URL from the home tab itself
    // (sometimes Forms opens the editor in the same tab)
    await sleep(3000);
    if (homeTab.url().includes('subpage=design')) {
      editorUrl = homeTab.url();
    } else {
      throw new Error(`Could not get editor URL. Popup URL: ${editorUrl || '(none)'}`);
    }
  }

  log(`  Editor URL: ${editorUrl.substring(0, 90)}...`);

  // Navigate homeTab (authenticated) directly to the editor URL
  await homeTab.goto(editorUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  await clearModals(homeTab);
  const tab = homeTab;

  // Wait for the initial Choice button (the quick-start cards)
  // Use waitForSelector with :has-text (partial match) — more robust than exact text match
  try {
    await tab.waitForSelector('button:has-text("Choice")', { timeout: 20000 });
  } catch {
    // Fallback: dump button list and screenshot for diagnostics
    const btns = await tab.evaluate(() =>
      Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().slice(0, 40))
    );
    log(`  Choice button not found. Visible buttons: ${btns.slice(0, 20).join(' | ')}`);
    await tab.screenshot({ path: path.join(__dirname, `debug_module_${Date.now()}.png`) });
    throw new Error('Choice button not found after 20s');
  }

  // Set quiz title — find the title input/heading and replace its text
  await tab.waitForFunction(() => {
    const el = document.querySelector('[aria-label="Quiz title"], [placeholder*="Untitled"], [data-automation-id="quizTitle"]');
    if (el) return true;
    const heading = Array.from(document.querySelectorAll('[role=heading]'))
      .find(h => /untitled/i.test(h.textContent));
    return !!heading;
  }, null, { timeout: 10000 }).catch(() => {});

  await tab.evaluate(() => {
    let el = document.querySelector('[aria-label="Quiz title"]')
      || document.querySelector('[placeholder*="Untitled"]')
      || document.querySelector('[data-automation-id="quizTitle"]')
      || Array.from(document.querySelectorAll('[role=heading]'))
          .find(h => /untitled/i.test(h.textContent));
    if (el) { el.focus(); el.click(); }
  });
  await sleep(400);
  await tab.keyboard.press('Control+A');
  await tab.keyboard.type(quizTitle, { delay: 12 });
  await tab.keyboard.press('Tab');
  await sleep(600);

  // Click the first "Choice" button to start the first question
  await tab.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('Choice'));
    if (btn) btn.click();
  });
  await sleep(2500);

  // Add all questions
  for (let i = 0; i < questions.length; i++) {
    await addQuestion(tab, questions[i], i === 0);
  }

  // Get shareable link
  await clearModals(tab);
  await sleep(500);

  // Click "Collect responses" or "Share" button
  const sharedClicked = await tab.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, [role=button]'))
      .find(b => /collect responses|share/i.test(b.textContent) && b.offsetParent !== null);
    if (btn) { btn.click(); return true; }
    return false;
  });

  let shareUrl = '';
  if (sharedClicked) {
    await sleep(3000);
    // Extract URL from the share panel input
    shareUrl = await tab.evaluate(() => {
      // Look for an input containing a forms share link
      const inputs = Array.from(document.querySelectorAll('input'));
      const shareInput = inputs.find(i => i.value && (
        i.value.includes('forms.microsoft.com') ||
        i.value.includes('forms.office.com') ||
        i.value.includes('office365')
      ));
      return shareInput ? shareInput.value : '';
    });
    await tab.keyboard.press('Escape');
    await sleep(500);
  }

  // Fallback: use the current tab URL (edit URL → convert to response URL)
  if (!shareUrl) {
    const editUrl = tab.url();
    // Forms edit URL: .../Pages/Design.aspx?subpage=design&id=<ID>
    // Share URL: https://forms.microsoft.com/r/<ID> or similar
    // Extract the form ID and build the share URL
    const idMatch = editUrl.match(/[?&]id=([^&]+)/);
    if (idMatch) {
      shareUrl = `https://forms.microsoft.com/r/${idMatch[1]}`;
    } else {
      shareUrl = editUrl;
    }
  }

  log(`  Share URL: ${shareUrl}`);

  // Navigate homeTab back to Forms home for the next quiz
  await homeTab.goto('https://forms.microsoft.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await homeTab.waitForFunction(
    () => !!document.querySelector('[aria-label="Create a new quiz"]'),
    null, { timeout: 30000 }
  );
  await sleep(1000);

  return shareUrl;
}

// ─── Step 3: Update SharePoint quiz page ─────────────────────────────────────

function buildQuizPageHTML(qp, formUrl, totalQ) {
  const nextLink = qp.nextUrl
    ? `<p style="margin-top:20px;"><a href="${qp.nextUrl}" style="color:#0042E0;">→ Continue to next module after you pass</a></p>`
    : `<p style="margin-top:20px;font-style:italic;color:#555;">You've reached the last module quiz. Proceed to the Final Exam when ready.</p>`;

  return `
<h1>${qp.title}</h1>
<p>
  <strong>Passing score:</strong> ${qp.passingScore}/${totalQ} &nbsp;|&nbsp;
  <strong>Attempts:</strong> Unlimited &nbsp;|&nbsp;
  <strong>Format:</strong> Multiple choice (auto-graded)
</p>
<hr>

<p style="background:#e8f0fe;border-left:4px solid #0042E0;padding:12px 16px;margin:16px 0;">
  This quiz is auto-graded by Microsoft Forms. You will see your score immediately after submitting.
  If you don't pass, click <strong>Retake</strong> — you can try as many times as needed.
</p>

<div style="margin:32px 0;padding:32px 24px;background:#000D2D;text-align:center;border-radius:4px;">
  <p style="color:#aac4ff;margin-bottom:16px;font-size:15px;">
    The quiz opens in a new tab. Come back here when you've passed.
  </p>
  <a href="${formUrl}" target="_blank" style="display:inline-block;background:#0042E0;color:white;font-weight:700;font-size:20px;padding:16px 40px;border-radius:4px;text-decoration:none;">
    Take Quiz ${qp.moduleNum} →
  </a>
  <p style="color:#aac4ff;margin-top:12px;font-size:13px;">
    Need ${qp.passingScore} or more correct to pass.
  </p>
</div>

${nextLink}
`;
}

async function saveSpPage(spPage, pageId, html) {
  return spPage.evaluate(async ({ siteUrl, pageId, html }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;
    const canvas = [{
      position: { zoneIndex: 1, sectionIndex: 1, sectionFactor: 12, layoutIndex: 1 },
      controlType: 4, id: `quiz-content-${pageId}`, innerHTML: html, editorType: 'CKEditor',
    }];
    await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    const s = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*',
      },
      body: JSON.stringify({ __metadata: { type: 'SP.Publishing.SitePage' }, CanvasContent1: JSON.stringify(canvas) }),
    });
    if (!s.ok) return `save_failed_${s.status}`;
    const p = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    return p.ok ? 'published' : `publish_error_${p.status}`;
  }, { siteUrl: SITE_URL, pageId, html });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  const logPath = path.join(__dirname, 'forms_quiz_urls.json');

  // Resume from existing results if interrupted mid-run (only keep successfully published ones)
  let results = [];
  let completedModules = new Set();
  if (fs.existsSync(logPath)) {
    try {
      const prior = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      results = prior.filter(r => r.formUrl && r.spResult === 'published');
      completedModules = new Set(results.map(r => r.moduleNum));
      if (completedModules.size > 0) {
        log(`Resuming — already completed modules: ${[...completedModules].join(', ')}`);
      }
    } catch { results = []; }
  }

  const browser = await chromium.launch({ headless: false, slowMo: 30 });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });

  // SharePoint tab
  const spTab = await ctx.newPage();
  await spTab.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Forms home tab
  const formsTab = await ctx.newPage();
  await formsTab.goto('https://forms.microsoft.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await formsTab.waitForFunction(
    () => !!document.querySelector('[aria-label="Create a new quiz"]'),
    null, { timeout: 60000 }
  );
  log('Forms home loaded');

  // Fetch all quiz questions from SharePoint
  const allQuestions = await fetchAllQuestions(spTab);

  for (const qp of QUIZ_PAGES) {
    if (completedModules.has(qp.moduleNum)) {
      log(`SKIP Module ${qp.moduleNum} — already done`);
      continue;
    }

    const questions = allQuestions[qp.id];
    if (!questions || questions.length === 0) {
      log(`SKIP [${qp.id}] Module ${qp.moduleNum}: no questions parsed`);
      continue;
    }

    log(`\n── Module ${qp.moduleNum}: ${qp.title} (${questions.length} questions)`);

    try {
      const formUrl = await createFormsQuiz(ctx, formsTab, qp.title, questions);

      const html = buildQuizPageHTML(qp, formUrl, questions.length);
      const spResult = await saveSpPage(spTab, qp.id, html);
      log(`  SP page ${qp.id}: ${spResult}`);

      results.push({ moduleNum: qp.moduleNum, title: qp.title, formUrl, spResult });
      fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
    } catch (e) {
      log(`  ERROR: ${e.message}`);
      results.push({ moduleNum: qp.moduleNum, title: qp.title, error: e.message });
      fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
      // Try to recover — navigate forms tab back to home
      try {
        await formsTab.goto('https://forms.microsoft.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(2000);
      } catch { /* ignore */ }
    }

    await sleep(2000);
  }

  log('\n═══ DONE ═══');
  log(`Results saved to: ${logPath}`);
  const ok = results.filter(r => r.spResult === 'published').length;
  const fail = results.filter(r => r.error).length;
  log(`✓ ${ok} quizzes published  ✗ ${fail} errors`);
  for (const r of results) {
    if (r.error) log(`  ✗ Module ${r.moduleNum}: ${r.error}`);
    else log(`  ✓ Module ${r.moduleNum}: ${r.spResult} — ${r.formUrl}`);
  }

  await browser.close();
})();
