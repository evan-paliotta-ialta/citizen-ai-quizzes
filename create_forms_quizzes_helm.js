/**
 * create_forms_quizzes_helm.js
 *
 * Helm-tenant version of create_forms_quizzes.js. Recreates the 16 module quizzes
 * as auto-graded Microsoft Forms in the Helm tenant, sourced from the LIVE quiz
 * page content already copied to helmmarkets.sharepoint.com/sites/citizenai
 * (guarantees exact parity with what's actually live, including Module 13's
 * real question count, rather than trusting possibly-drifted local markdown).
 *
 * Unlike the original, page IDs are looked up dynamically by title (the PnP
 * migration assigned new page IDs on the Helm site).
 *
 * Run: node create_forms_quizzes_helm.js [--only=<moduleNum>]
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.helm.json');
const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';

const onlyArg = process.argv.find(a => a.startsWith('--only='));
const ONLY_MODULE = onlyArg ? parseInt(onlyArg.split('=')[1]) : null;
const DRY_RUN = process.argv.includes('--dry-run');

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function clearModals(page) {
  await page.evaluate(() => {
    const host = document.getElementById('fluent-default-layer-host');
    if (host) host.innerHTML = '';
    document.querySelectorAll('.ms-Overlay, .ms-Dialog-main').forEach(el => el.remove());
  }).catch(() => {});
}

// Parses the local markdown quiz source files (course-content/quizzes/*.md, final-exam.md).
// Only extracts graded multiple-choice questions (A–D + Correct answer/Correct) —
// short-answer and open scenario questions are intentionally excluded, matching
// how Microsoft Forms auto-grading (and /citizen-ai-check) only scores Choice questions.
function parseQuizMarkdown(md) {
  const questions = [];
  const blocks = md.split(/\n(?=\*\*Question\s+\d+)/);
  for (const block of blocks) {
    const numMatch = block.match(/^\*\*Question\s+(\d+)/);
    if (!numMatch) continue;
    const num = parseInt(numMatch[1]);

    const lines = block.split('\n').map(l => l.trim());
    const textLines = [];
    for (const line of lines.slice(1)) {
      if (/^[A-D]\)/.test(line) || /^\*\*Correct/i.test(line)) break;
      if (line) textLines.push(line);
    }
    const text = textLines.join(' ').trim();

    const choices = {};
    const choiceRegex = /^([A-D])\)\s*(.+)$/;
    for (const line of lines) {
      const m = line.match(choiceRegex);
      if (m) choices[m[1]] = m[2].trim();
    }

    const correctMatch = block.match(/\*\*Correct(?: answer)?\*\*:\s*([A-D])/i);
    const correct = correctMatch ? correctMatch[1].toUpperCase() : null;

    if (text && Object.keys(choices).length >= 2 && correct) {
      questions.push({ num, text, choices, correct });
    }
  }
  return questions;
}

const QUIZ_META = [
  { moduleNum: 1,  titleMatch: 'Module 1: What Claude Is',                mdFile: 'quiz-module-01.md' },
  { moduleNum: 2,  titleMatch: 'Module 2: How the Model Was Built',       mdFile: 'quiz-module-02.md' },
  { moduleNum: 3,  titleMatch: 'Module 3: Tokens',                        mdFile: 'quiz-module-03.md' },
  { moduleNum: 4,  titleMatch: 'Module 4: The Context Window',            mdFile: 'quiz-module-04.md' },
  { moduleNum: 5,  titleMatch: 'Module 5: Why Specificity',               mdFile: 'quiz-module-05.md' },
  { moduleNum: 6,  titleMatch: 'Module 6: Anatomy of a Good Prompt',      mdFile: 'quiz-module-06.md' },
  { moduleNum: 7,  titleMatch: 'Module 7: Iteration',                     mdFile: 'quiz-module-07.md' },
  { moduleNum: 8,  titleMatch: 'Module 8: Tips, Tricks',                  mdFile: 'quiz-module-08.md' },
  { moduleNum: 9,  titleMatch: 'Module 9: The Operating Framework',       mdFile: 'quiz-module-09.md' },
  { moduleNum: 10, titleMatch: 'Module 10: Claude Desktop Projects',      mdFile: 'quiz-module-10.md' },
  { moduleNum: 11, titleMatch: 'Module 11: Documents, Images',            mdFile: 'quiz-module-11.md' },
  { moduleNum: 12, titleMatch: 'Module 12: Claude for Your Team',         mdFile: 'quiz-module-12.md' },
  { moduleNum: 13, titleMatch: 'Module 13: Safety',                       mdFile: 'quiz-module-13.md' },
  { moduleNum: 14, titleMatch: 'Module 14: MCP, Agents',                  mdFile: 'quiz-module-14.md' },
  { moduleNum: 15, titleMatch: 'Module 15: GitHub',                       mdFile: 'quiz-module-15.md' },
  { moduleNum: 16, titleMatch: 'Module 16: Databases',                    mdFile: 'quiz-module-16.md' },
];

const QUIZ_MD_DIR = path.join(__dirname, 'course-content/quizzes');

async function fetchQuizPages(spPage) {
  log('Fetching quiz page list from Helm SharePoint (for page IDs) + local markdown (for content)...');
  const rawPages = await spPage.evaluate(async (siteUrl) => {
    const r = await fetch(`${siteUrl}/_api/sitepages/pages?$select=Id,Title&$top=200`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const d = await r.json();
    return d.d.results.map(p => ({ id: p.Id, title: p.Title }));
  }, SITE_URL);

  const resolved = [];
  for (const meta of QUIZ_META) {
    const page = rawPages.find(p => /^quiz/i.test(p.title) && p.title.includes(meta.titleMatch.split(':')[0]) && p.title.toLowerCase().includes(meta.titleMatch.split(': ')[1]?.slice(0, 15).toLowerCase() || ''));
    if (!page) {
      log(`  MISS: no SharePoint page found for Module ${meta.moduleNum} (${meta.titleMatch})`);
      continue;
    }
    const mdPath = path.join(QUIZ_MD_DIR, meta.mdFile);
    if (!fs.existsSync(mdPath)) {
      log(`  MISS: no local markdown file ${meta.mdFile}`);
      continue;
    }
    const md = fs.readFileSync(mdPath, 'utf8');
    const questions = parseQuizMarkdown(md);
    resolved.push({ ...meta, pageId: page.id, pageTitle: page.title, questions });
    log(`  Module ${meta.moduleNum}: page "${page.title}" (id ${page.id}) — ${questions.length} graded MC questions parsed from ${meta.mdFile}`);
  }
  return resolved;
}

// Note: this Forms UI (2026-07) only keeps the CURRENTLY ACTIVE question's option
// elements in the DOM — once you move to a new question, the previous question's
// options are removed (not just hidden), so indices are always local to the
// question being edited right now, never cumulative across the whole form.
async function addQuestion(tab, q, isFirst) {
  const sorted = Object.entries(q.choices).sort(([a], [b]) => a.localeCompare(b));
  const correctIdx = sorted.findIndex(([l]) => l === q.correct);

  if (!isFirst) {
    const addClicked = await tab.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => (/add new question/i.test(b.textContent) || b.getAttribute('aria-label') === 'Add new question')
          && b.offsetParent !== null);
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!addClicked) throw new Error('Could not find "Add new question" button');
    await sleep(1200);

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

  log(`    Waiting for Q${q.num} title field...`);
  await tab.waitForFunction(() => {
    return Array.from(document.querySelectorAll('[aria-label]'))
      .some(e => e.getAttribute('aria-label')?.includes('Question title'));
  }, null, { timeout: 15000 });

  try {
    await tab.waitForFunction(() => {
      return document.querySelectorAll('[aria-label*="Choice Option Text"]').length >= 2;
    }, null, { timeout: 10000 });
  } catch (e) {
    const cur = await tab.evaluate(() => document.querySelectorAll('[aria-label*="Choice Option Text"]').length);
    log(`    OPTION WAIT FAILED — current count=${cur}, expected>=2`);
    await tab.screenshot({ path: path.join(__dirname, `debug_optwait_${Date.now()}.png`), fullPage: true });
    throw e;
  }

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

  for (let i = 0; i < sorted.length; i++) {
    const [letter, text] = sorted[i];
    const optIdx = i; // always local to the current question

    if (i >= 2) {
      const addOptClicked = await tab.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button, [role=button]'))
          .find(b => /^add option$/i.test(b.textContent.trim()) && b.offsetParent !== null);
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (!addOptClicked) {
        await tab.evaluate(() => {
          const el = Array.from(document.querySelectorAll('*'))
            .find(e => /^add option$/i.test(e.textContent.trim()) && e.offsetParent !== null
              && ['BUTTON','A','SPAN','DIV'].includes(e.tagName));
          if (el) el.click();
        });
      }
      await sleep(900);
    }

    await tab.waitForFunction((idx) => {
      return document.querySelectorAll('[aria-label*="Choice Option Text"]').length > idx;
    }, optIdx, { timeout: 10000 });

    // Real triple-click (not a synthetic .click()) reliably selects the existing
    // "Option N" default text in this editor — Control+A alone left it in place
    // and the typed text was appended after it instead of replacing it.
    await tab.locator('[aria-label*="Choice Option Text"]').nth(optIdx).click({ clickCount: 3 });
    await sleep(350);
    await tab.keyboard.type(`${letter}) ${text}`, { delay: 12 });
    await sleep(250);
    const finalOptText = await tab.evaluate((idx) => {
      const opts = Array.from(document.querySelectorAll('[aria-label*="Choice Option Text"]'));
      return opts[idx] ? opts[idx].textContent.trim() : null;
    }, optIdx);
    if (finalOptText !== `${letter}) ${text}`) {
      log(`    WARNING: option ${letter} text mismatch after typing — got "${finalOptText}"`);
    }
  }

  await sleep(600);
  // Correct-answer buttons are also local to the current question (one per option,
  // in the same order), so the index within the current question's own button list
  // is just correctIdx — no need to offset against a running total.
  const marked = await tab.evaluate((idx) => {
    const btns = Array.from(document.querySelectorAll('[aria-label="Correct answer"]'));
    if (btns[idx]) { btns[idx].click(); return true; }
    return false;
  }, correctIdx);

  if (!marked) {
    log(`    WARNING: could not mark correct answer for Q${q.num} (btn idx ${correctIdx})`);
  }

  log(`    Q${q.num} ✓  (correct: ${q.correct})`);
  await sleep(400);
}

async function createFormsQuiz(ctx, homeTab, quizTitle, questions) {
  log(`  Creating: ${quizTitle}`);

  if (!homeTab.url().includes('forms.office.com') && !homeTab.url().includes('forms.microsoft.com')) {
    await homeTab.goto('https://forms.office.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  await homeTab.waitForFunction(
    () => !!document.querySelector('[aria-label="Create a new quiz"]'),
    null, { timeout: 30000 }
  );

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

  const popupTab = await newPageP;
  if (popupTab) {
    try {
      await popupTab.waitForURL(u => u.includes('subpage=design'), { timeout: 20000 });
      editorUrl = popupTab.url();
    } catch {
      editorUrl = popupTab.url();
    }
    await popupTab.close();
  }

  if (!editorUrl || !editorUrl.includes('subpage=design')) {
    await sleep(3000);
    if (homeTab.url().includes('subpage=design')) {
      editorUrl = homeTab.url();
    } else {
      throw new Error(`Could not get editor URL. Popup URL: ${editorUrl || '(none)'}`);
    }
  }

  log(`  Editor URL: ${editorUrl.substring(0, 90)}...`);

  await homeTab.goto(editorUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(4000);
  await clearModals(homeTab);
  const tab = homeTab;

  // Current Forms UI (2026-07): a "Create from featured templates" panel opens by
  // default on a brand-new quiz — close it before doing anything else.
  await tab.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => (b.getAttribute('aria-label') || '').includes('Close'));
    if (btn) btn.click();
  });
  await sleep(1000);

  // Set the quiz title — click the title area to turn it into an editable textbox.
  await tab.waitForFunction(() => !!document.querySelector('[aria-label^="Form title"]'), null, { timeout: 15000 });
  await tab.evaluate(() => {
    const el = document.querySelector('[aria-label="Form title Untitled quiz"]')
      || document.querySelector('[aria-label^="Form title"]');
    if (el) el.click();
  });
  await sleep(800);
  await tab.waitForFunction(() => {
    const el = document.querySelector('[aria-label="Form title"][role="textbox"]');
    return !!el;
  }, null, { timeout: 10000 });
  await tab.evaluate(() => {
    const el = document.querySelector('[aria-label="Form title"][role="textbox"]');
    if (el) el.focus();
  });
  await sleep(300);
  await tab.keyboard.press('Control+A');
  await tab.keyboard.type(quizTitle, { delay: 12 });
  await tab.keyboard.press('Tab');
  await sleep(600);

  // Start the first question: "Quick start with" reveals the question-type picker, then "Choice".
  try {
    await tab.waitForSelector('button[aria-label="Quick start with"]', { timeout: 15000 });
  } catch {
    const btns = await tab.evaluate(() =>
      Array.from(document.querySelectorAll('button')).map(b => (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 40))
    );
    log(`  "Quick start with" not found. Visible buttons: ${btns.slice(0, 30).join(' | ')}`);
    await tab.screenshot({ path: path.join(__dirname, `debug_helm_${Date.now()}.png`) });
    throw new Error('"Quick start with" button not found after 15s');
  }
  await tab.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Quick start with');
    if (btn) btn.click();
  });
  await sleep(1200);

  await tab.waitForSelector('button[aria-label="Choice"]', { timeout: 10000 });
  await tab.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Choice');
    if (btn) btn.click();
  });
  await sleep(2500);

  for (let i = 0; i < questions.length; i++) {
    await addQuestion(tab, questions[i], i === 0);
  }

  await clearModals(tab);
  await sleep(500);

  // Every quiz spec says "Attempts allowed: Unlimited", but the quiz template
  // defaults to "One response per person" — must be turned off, or a participant's
  // second attempt (e.g. after failing Module 13's safety quiz) would be silently
  // rejected. "Record name" must stay ON so /citizen-ai-check can match submissions
  // by participant name/email.
  await tab.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Settings');
    if (btn) btn.click();
  });
  await sleep(2000);
  const oneResponseChecked = await tab.evaluate(() => document.getElementById('oneResponse')?.checked);
  if (oneResponseChecked) {
    await tab.evaluate(() => document.querySelector('label[for="oneResponse"]')?.click());
    await sleep(800);
  }
  const recordNameChecked = await tab.evaluate(() => document.getElementById('recordName')?.checked);
  if (!recordNameChecked) {
    await tab.evaluate(() => document.querySelector('label[for="recordName"]')?.click());
    await sleep(800);
  }
  log(`    Settings: one-response-per-person=${!oneResponseChecked} (now off), record-name=on`);
  await tab.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.getAttribute('aria-label')||'').includes('Settings Close'));
    if (btn) btn.click();
  });
  await sleep(500);

  const sharedClicked = await tab.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, [role=button]'))
      .find(b => /collect responses|share/i.test(b.textContent) && b.offsetParent !== null);
    if (btn) { btn.click(); return true; }
    return false;
  });

  let shareUrl = '';
  if (sharedClicked) {
    await sleep(3000);
    shareUrl = await tab.evaluate(() => {
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

  if (!shareUrl) {
    const editUrl = tab.url();
    const idMatch = editUrl.match(/[?&]id=([^&]+)/);
    if (idMatch) {
      shareUrl = `https://forms.office.com/r/${idMatch[1]}`;
    } else {
      shareUrl = editUrl;
    }
  }

  // Also extract the raw form id for the /citizen-ai-check skill's formapi calls
  const editUrlFinal = tab.url();
  const rawIdMatch = editUrlFinal.match(/[?&]id=([^&]+)/);
  const formId = rawIdMatch ? decodeURIComponent(rawIdMatch[1]) : null;

  log(`  Share URL: ${shareUrl}`);
  log(`  Form ID: ${formId}`);

  await homeTab.goto('https://forms.office.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await homeTab.waitForFunction(
    () => !!document.querySelector('[aria-label="Create a new quiz"]'),
    null, { timeout: 30000 }
  );
  await sleep(1000);

  return { shareUrl, formId };
}

async function main() {
  const logPath = path.join(__dirname, 'forms_quiz_urls_helm.json');

  let results = [];
  let completedModules = new Set();
  if (fs.existsSync(logPath)) {
    try {
      const prior = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      results = prior.filter(r => r.formId);
      completedModules = new Set(results.map(r => r.moduleNum));
      if (completedModules.size > 0) {
        log(`Resuming — already completed modules: ${[...completedModules].join(', ')}`);
      }
    } catch { results = []; }
  }

  const browser = await chromium.launch({ headless: false, slowMo: 30 });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });

  const spTab = await ctx.newPage();
  await spTab.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  if (DRY_RUN) {
    const quizPages = await fetchQuizPages(spTab);
    for (const qp of quizPages) {
      log(`Module ${qp.moduleNum}: "${qp.pageTitle}" — ${qp.questions.length} Qs`);
      qp.questions.forEach(q => log(`    Q${q.num} [correct ${q.correct}]: ${q.text.slice(0, 70)}`));
    }
    log(`\nMatched ${quizPages.length}/16 quiz pages.`);
    await browser.close();
    return;
  }

  const formsTab = await ctx.newPage();
  await formsTab.goto('https://forms.office.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await formsTab.waitForFunction(
    () => !!document.querySelector('[aria-label="Create a new quiz"]'),
    null, { timeout: 60000 }
  );
  log('Forms home loaded (Helm tenant)');

  const quizPages = await fetchQuizPages(spTab);

  const toRun = ONLY_MODULE ? quizPages.filter(q => q.moduleNum === ONLY_MODULE) : quizPages;

  for (const qp of toRun) {
    if (completedModules.has(qp.moduleNum)) {
      log(`SKIP Module ${qp.moduleNum} — already done`);
      continue;
    }

    if (!qp.questions || qp.questions.length === 0) {
      log(`SKIP Module ${qp.moduleNum}: no questions parsed`);
      continue;
    }

    const title = qp.pageTitle.replace(/^Quiz\s*—\s*/i, '');
    log(`\n── Module ${qp.moduleNum}: ${title} (${qp.questions.length} questions)`);

    try {
      const { shareUrl, formId } = await createFormsQuiz(ctx, formsTab, title, qp.questions);

      results.push({ moduleNum: qp.moduleNum, title, formId, shareUrl, questionCount: qp.questions.length });
      fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
    } catch (e) {
      log(`  ERROR: ${e.message}`);
      results.push({ moduleNum: qp.moduleNum, title, error: e.message });
      fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
      try {
        await formsTab.goto('https://forms.office.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(2000);
      } catch { /* ignore */ }
    }

    await sleep(2000);
  }

  log('\n═══ DONE ═══');
  log(`Results saved to: ${logPath}`);
  const ok = results.filter(r => r.formId).length;
  const fail = results.filter(r => r.error).length;
  log(`✓ ${ok} quizzes created  ✗ ${fail} errors`);
  for (const r of results) {
    if (r.error) log(`  ✗ Module ${r.moduleNum}: ${r.error}`);
    else log(`  ✓ Module ${r.moduleNum}: ${r.formId}`);
  }

  await browser.close();
}

if (require.main === module) {
  main();
} else {
  module.exports = { addQuestion, createFormsQuiz, clearModals, sleep, log, parseQuizMarkdown, AUTH_PATH, SITE_URL };
}
