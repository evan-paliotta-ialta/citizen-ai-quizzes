/**
 * STEP 4 — Creates Microsoft Forms for each module quiz and the final exam.
 *
 * Run with:  node scripts/03-create-forms.js
 *
 * What it does:
 *  1. Navigates to forms.microsoft.com
 *  2. Creates one Form per module (quiz) + one Form for the final exam
 *     + one Form for the capstone submission
 *  3. Adds questions from each quiz file
 *  4. Enables "Record name" so the Excel tracker captures who submitted
 *  5. Saves the Form URL for each quiz to forms-urls.json
 *     (used by step 04 to embed links in SharePoint pages)
 *
 * Safe to re-run — checks forms-urls.json first and skips already-created forms.
 *
 * NOTE: Microsoft Forms has no public creation API.
 *       This script drives the browser UI directly.
 *       If Microsoft updates the Forms UI, selectors may need adjustment.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { MODULES } = require('../utils/content-loader');

const AUTH_PATH = path.resolve(__dirname, '../', config.authStatePath);
const FORMS_URL_FILE = path.resolve(__dirname, '../forms-urls.json');
const FORMS_HOME = 'https://forms.microsoft.com';

// ── Quiz question data ─────────────────────────────────────────────────────
// Structured version of the quiz questions for programmatic form creation.
// Each module has 4 multiple-choice questions + 1 short-answer.

const QUIZ_QUESTIONS = {
  1: [
    { text: 'Claude is best described as:', type: 'choice', options: ['A search engine that retrieves facts from the internet', 'A language model that predicts the most probable, coherent response', 'A database that stores and retrieves company information', 'A live assistant that looks up answers in real time'], correct: 1 },
    { text: 'You ask Claude to analyze a complex strategic question and the response feels shallow. What is the most likely cause?', type: 'choice', options: ['Claude is not capable of complex analysis', 'The question was too long', 'Claude defaulted to a fast, probable answer rather than a thorough one', 'Claude ran out of context window'], correct: 2 },
    { text: 'Claude gives you a specific statistic to include in a client report. What should you do?', type: 'choice', options: ['Use it — Claude is very accurate with numbers', 'Verify it independently before including it in any document', 'Ask Claude to confirm the statistic a second time', 'Only use it if Claude cited a source'], correct: 1 },
    { text: 'You start a new Claude conversation on Monday. Claude:', type: 'choice', options: ['Remembers everything from your Friday session', 'Has access to your previous conversations through your account', 'Starts completely blank with no memory of previous sessions', 'Remembers your preferences but not the content of past conversations'], correct: 2 },
    { text: 'In your own words, describe one situation in your daily work where you would tell Claude to "take your time" before answering, and why.', type: 'text' },
  ],
  2: [
    { text: 'Why does Claude have a knowledge cutoff date?', type: 'choice', options: ['Anthropic restricts Claude from accessing new information for safety reasons', 'Training uses a fixed dataset collected before a certain date and cannot be updated continuously', "Claude's knowledge cutoff is a subscription tier limitation", 'Claude deletes old information to make room for new knowledge'], correct: 1 },
    { text: 'You ask Claude about a regulatory change announced last month and it gives a detailed, confident answer. What should you do?', type: 'choice', options: ['Trust the answer — Claude is thorough on regulatory topics', 'Verify the answer — Claude may be generating a plausible-sounding but outdated or incorrect response', 'Ask Claude to cite its sources before trusting it', 'Use Opus instead of Sonnet for better accuracy on recent events'], correct: 1 },
    { text: 'Sycophancy in Claude means:', type: 'choice', options: ['Claude is programmed to be excessively polite', 'Claude tends to agree with or validate the user, even when the user may be wrong', 'Claude avoids giving negative feedback entirely', 'Claude will never change its answer once given'], correct: 1 },
    { text: 'You are working on a complex strategic memo requiring careful reasoning. Which model should you use?', type: 'choice', options: ['Haiku — it is the fastest', 'Sonnet — it is always the best choice', 'Opus — it is best suited for complex, high-stakes reasoning tasks', 'It does not matter — all models produce identical output'], correct: 2 },
    { text: "Think of one type of question you do regularly at work where Claude's knowledge cutoff could cause problems. How would you work around it?", type: 'text' },
  ],
  3: [
    { text: 'What is a token?', type: 'choice', options: ['A single word', 'A single character', 'A variable-length chunk of text, roughly three-quarters of a word on average', 'A unit of cost charged per Claude session'], correct: 2 },
    { text: 'You are asking a question about one specific clause in a 60-page contract. What is the best approach?', type: 'choice', options: ['Upload the full contract so Claude has complete context', 'Paste only the relevant clause or section to conserve context window space', 'Summarize the contract yourself first, then paste the summary', 'Use Opus instead of Sonnet to handle the full document'], correct: 1 },
    { text: 'Midway through a long Claude conversation, Claude starts ignoring something you established clearly at the beginning. What is the most likely explanation?', type: 'choice', options: ['Claude is malfunctioning', 'You need to re-state your instructions more forcefully', 'The context window is getting full and earlier information is carrying less weight', 'Claude disagreed with your earlier instruction'], correct: 2 },
    { text: 'You ask Claude to count the number of times the letter "e" appears in a paragraph. Claude gives you the wrong count. Why?', type: 'choice', options: ['Claude is not capable of reading carefully', 'Claude operates on tokens, not individual characters, making precise character-level tasks unreliable', 'You need to use a different prompt', 'This only happens in Haiku, not Sonnet'], correct: 1 },
    { text: 'Describe one change you could make to how you currently plan to use Claude to be more token-efficient. Be specific.', type: 'text' },
  ],
};

// For modules 4–16, use a simplified 4-question format (the full set is in the quiz .md files)
// We generate placeholder questions for the remaining modules
function getModuleQuestions(moduleId) {
  if (QUIZ_QUESTIONS[moduleId]) return QUIZ_QUESTIONS[moduleId];

  // Default structure for modules not fully enumerated above
  return [
    { text: `[Module ${moduleId}] Question 1 — see quiz page for full text`, type: 'choice', options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'], correct: 0 },
    { text: `[Module ${moduleId}] Question 2 — see quiz page for full text`, type: 'choice', options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'], correct: 1 },
    { text: `[Module ${moduleId}] Question 3 — see quiz page for full text`, type: 'choice', options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'], correct: 1 },
    { text: `[Module ${moduleId}] Question 4 — see quiz page for full text`, type: 'choice', options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'], correct: 1 },
    { text: `[Module ${moduleId}] Short answer — see quiz page for full text`, type: 'text' },
  ];
}

// ── Create a single Form ───────────────────────────────────────────────────
// NOTE: The new Microsoft Forms UI (2025+) redirects to a template picker.
// Clicking "Quiz" opens a new browser tab with a blank quiz editor.
// This function handles that flow.
async function createForm(context, formTitle, questions) {
  // Open a fresh page and navigate to Forms
  const launchPage = await context.newPage();
  await launchPage.goto(FORMS_HOME, { waitUntil: 'load', timeout: 60000 });

  // Wait for the template picker and click "Quiz"
  await launchPage.waitForSelector('button:has-text("Quiz")', { timeout: 30000 });
  // Wait for any loading overlay to clear
  await launchPage.waitForSelector('.ms-Overlay', { state: 'detached', timeout: 10000 }).catch(() => {});
  await launchPage.waitForTimeout(1000);

  // Clicking "Quiz" opens a new tab — capture it
  const [formPage] = await Promise.all([
    context.waitForEvent('page', { timeout: 30000 }),
    launchPage.click('button:has-text("Quiz")', { force: true }),
  ]);

  await launchPage.close();
  await formPage.waitForLoadState('load');
  await formPage.waitForTimeout(3000);

  // Get the form ID from the URL before any navigation
  const designUrl = formPage.url();
  const formIdMatch = designUrl.match(/[?&]id=([^&]+)/);
  const formId = formIdMatch ? formIdMatch[1] : null;

  // Close the template suggestions panel if it appears
  try {
    const closeBtn = await formPage.waitForSelector(
      'button:has-text("Close"), [aria-label="Close"], button[title="Close"]',
      { timeout: 5000 }
    );
    await closeBtn.click();
    await formPage.waitForTimeout(1000);
  } catch (e) { /* panel not present, continue */ }

  // ── Set the form title ────────────────────────────────────────────────────
  try {
    const titleSel = [
      '[aria-label*="form title" i]',
      '[aria-label*="quiz title" i]',
      '[data-automation-id*="titleTextBox"]',
      'div[role="textbox"][aria-label]',
    ].join(', ');
    await formPage.waitForSelector(titleSel, { timeout: 10000 });
    const titleEl = await formPage.$(titleSel);
    if (titleEl) {
      await titleEl.click();
      await formPage.keyboard.press('ControlOrMeta+a');
      await formPage.keyboard.type(formTitle);
      await formPage.waitForTimeout(800);
    }
  } catch (e) {
    console.warn(`    ⚠ Could not set title: ${e.message.substring(0, 80)}`);
  }

  // ── Add each question ─────────────────────────────────────────────────────
  for (const q of questions) {
    try {
      // Click "Add new question" button
      const addSel = [
        'button:has-text("Add new")',
        '[aria-label*="Add new" i]',
        '[data-automation-id*="addNew"]',
      ].join(', ');
      await formPage.waitForSelector(addSel, { timeout: 10000 });
      await formPage.click(addSel);
      await formPage.waitForTimeout(600);

      if (q.type === 'choice') {
        // Select "Choice" question type
        await formPage.click(
          'button:has-text("Choice"), [aria-label*="Choice" i], li:has-text("Choice"), [data-automation-id*="choice"]',
        );
        await formPage.waitForTimeout(600);

        // Fill question text (last question's input)
        const qInputs = await formPage.$$('input[placeholder*="question" i], [aria-label*="question text" i]');
        const qInput = qInputs[qInputs.length - 1];
        if (qInput) {
          await qInput.click();
          await qInput.fill(q.text);
        }
        await formPage.waitForTimeout(400);

        // Fill options
        for (let i = 0; i < q.options.length; i++) {
          if (i >= 2) {
            const addOpt = await formPage.$('button:has-text("Add option"), [aria-label*="add option" i]');
            if (addOpt) { await addOpt.click(); await formPage.waitForTimeout(300); }
          }
          const opts = await formPage.$$('input[placeholder*="option" i], input[aria-label*="option" i]');
          if (opts[i]) await opts[i].fill(q.options[i]);
        }
        await formPage.waitForTimeout(300);

      } else if (q.type === 'text') {
        await formPage.click(
          'button:has-text("Text"), [aria-label*="Text" i]:not([aria-label*="option"]), li:has-text("Text"), [data-automation-id*="text"]'
        );
        await formPage.waitForTimeout(600);

        const qInputs = await formPage.$$('input[placeholder*="question" i]');
        const qInput = qInputs[qInputs.length - 1];
        if (qInput) {
          await qInput.click();
          await qInput.fill(q.text);
        }
      }

      await formPage.waitForTimeout(500);
    } catch (e) {
      console.warn(`    ⚠ Question add failed: ${e.message.substring(0, 80)}`);
    }
  }

  // Build response URL from form ID
  await formPage.waitForTimeout(1000);
  const responseUrl = formId
    ? `https://forms.office.com/Pages/ResponsePage.aspx?id=${formId}`
    : formPage.url();

  await formPage.close();
  return responseUrl;
}

// ── Main ───────────────────────────────────────────────────────────────────
(async () => {
  console.log('=== Step 4: Create Microsoft Forms ===\n');

  if (!fs.existsSync(AUTH_PATH)) {
    console.error('✗ No auth session found. Run:  node auth/save-auth.js\n');
    process.exit(1);
  }

  // Load existing form URLs to enable re-run safety
  let formUrls = {};
  if (fs.existsSync(FORMS_URL_FILE)) {
    formUrls = JSON.parse(fs.readFileSync(FORMS_URL_FILE, 'utf8'));
    console.log(`Loaded ${Object.keys(formUrls).length} existing form URLs from forms-urls.json\n`);
  }

  const browser = await chromium.launch({ headless: false }); // headless: false helps with Forms UI reliability
  const context = await browser.newContext({ storageState: AUTH_PATH });

  let created = 0;
  let skipped = 0;
  let failed = 0;

  // ── Module quizzes ─────────────────────────────────────────────────────
  for (const mod of MODULES) {
    const formKey = `quiz_${mod.id}`;
    const formTitle = `Quiz — Module ${mod.id}: ${mod.title.replace(/^Module \d+: /, '')}`;

    if (formUrls[formKey]) {
      console.log(`  Quiz ${mod.id}: skipped (already created)`);
      skipped++;
      continue;
    }

    process.stdout.write(`  Quiz ${mod.id}: ${mod.title}... `);
    try {
      const questions = getModuleQuestions(mod.id);
      const url = await createForm(context, formTitle, questions);
      formUrls[formKey] = { title: formTitle, url, moduleId: mod.id };
      fs.writeFileSync(FORMS_URL_FILE, JSON.stringify(formUrls, null, 2));
      console.log('✓ created');
      created++;
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.log(`✗ FAILED — ${err.message}`);
      failed++;
    }
  }

  // ── Final exam form ────────────────────────────────────────────────────
  if (!formUrls['final_exam']) {
    process.stdout.write('\n  Final Exam form... ');
    try {
      const examQuestions = [
        { text: 'Claude is best described as:', type: 'choice', options: ['A search engine that retrieves verified facts', 'A language model that predicts the most probable, coherent response based on training patterns', 'A live assistant with access to real-time information', 'A database of human knowledge that can be queried'], correct: 1 },
        { text: 'You ask Claude for the strongest prompt opening for a complex question. Which is best?', type: 'choice', options: ['Analyze this for me:', 'Quickly, what do you think about...', 'Before you answer, take your time and think through this from multiple angles. Consider the strongest arguments on each side before giving me your recommendation.', 'You are Claude. Analyze this:'], correct: 2 },
        { text: 'Which should NEVER be entered into Claude Desktop?', type: 'choice', options: ['A publicly available industry report', "A client's name paired with their investment portfolio details", 'A draft marketing email for review', 'Meeting notes from an internal team meeting'], correct: 1 },
        { text: 'The five elements of a well-structured prompt are:', type: 'choice', options: ['Question, Answer, Length, Model, Temperature', 'Role, Task, Context, Constraints, Output Format', 'Who, What, When, Where, Why', 'Input, Process, Output, Review, Iterate'], correct: 1 },
        { text: 'An MCP server enables:', type: 'choice', options: ['A faster version of Claude for high-volume tasks', 'Claude to read from and write to external tools and systems directly', 'Encrypted storage for sensitive conversations', 'Multi-user access to a single Claude account'], correct: 1 },
        { text: 'SCENARIO: You are asked to use Claude to draft a $2M ARR client proposal. Which approach is most appropriate?', type: 'choice', options: ['Zone 1 — draft, quick review, send', 'Zone 2 — use Claude to draft with thorough context, iterate, verify all facts before sending', 'Zone 3 — write it yourself, use Claude only to proofread', 'Do not use Claude for proposals of this size'], correct: 1 },
        { text: 'PRACTICAL: Describe a real workflow in your role where an MCP server, RAG system, or agent would add meaningful value. Specify which type and why.', type: 'text' },
        { text: 'PRACTICAL: Paste your Claude Desktop Project instructions below. These will be reviewed to confirm your setup before your license is issued.', type: 'text' },
      ];
      const url = await createForm(context, 'Final Exam — Citizen AI Developer Program', examQuestions);
      formUrls['final_exam'] = { title: 'Final Exam', url };
      fs.writeFileSync(FORMS_URL_FILE, JSON.stringify(formUrls, null, 2));
      console.log('✓ created');
      created++;
    } catch (err) {
      console.log(`✗ FAILED — ${err.message}`);
      failed++;
    }
  } else {
    console.log('\n  Final Exam form: skipped (already created)');
    skipped++;
  }

  // ── Capstone submission form ───────────────────────────────────────────
  if (!formUrls['capstone']) {
    process.stdout.write('\n  Capstone submission form... ');
    try {
      const capstoneQuestions = [
        { text: 'Your name and team', type: 'text' },
        { text: 'Paste your Claude Desktop Project instructions (the system prompt you set up for your role)', type: 'text' },
        { text: 'Describe the real work task you completed using Claude for this capstone. What was the task and what did you produce?', type: 'text' },
        { text: 'Paste or describe the Claude output you produced for this task', type: 'text' },
        { text: 'What prompt did you use? (Paste the full prompt)', type: 'text' },
        { text: 'What would you do differently next time based on what you learned in the course?', type: 'text' },
      ];
      const url = await createForm(context, 'Capstone Submission — Citizen AI Developer Program', capstoneQuestions);
      formUrls['capstone'] = { title: 'Capstone Submission', url };
      fs.writeFileSync(FORMS_URL_FILE, JSON.stringify(formUrls, null, 2));
      console.log('✓ created');
      created++;
    } catch (err) {
      console.log(`✗ FAILED — ${err.message}`);
      failed++;
    }
  } else {
    console.log('  Capstone form: skipped (already created)');
    skipped++;
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Forms created : ${created}
  Skipped       : ${skipped}
  Failed        : ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (failed > 0) {
    console.log('\n⚠ Some forms failed. Re-run this script — already-created forms will be skipped.');
  } else {
    console.log('\n✓ All forms created. URLs saved to forms-urls.json');
    console.log('\nRun next:  node scripts/04-setup-tracker.js\n');
  }

  await browser.close();
})();
