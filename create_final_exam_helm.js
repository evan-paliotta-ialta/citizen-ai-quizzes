/**
 * create_final_exam_helm.js
 *
 * Creates the 25-question Final Exam as an auto-graded Microsoft Form in the
 * Helm tenant, sourced from course-content/final-exam.md (Sections 1-4, the
 * 25 MC questions only — the two Practical Submissions are separate, human-graded
 * work products and are not part of this auto-graded form).
 *
 * Run: node create_final_exam_helm.js
 */

const path = require('path');
const fs = require('fs');
const { chromium } = require('./playwright/node_modules/playwright');
const { addQuestion, createFormsQuiz, sleep, log, parseQuizMarkdown, AUTH_PATH } = require('./create_forms_quizzes_helm.js');

async function main() {
  const mdPath = path.join(__dirname, 'course-content/final-exam.md');
  const md = fs.readFileSync(mdPath, 'utf8');
  const questions = parseQuizMarkdown(md);
  log(`Parsed ${questions.length} graded MC questions from final-exam.md`);
  if (questions.length !== 25) {
    log(`WARNING: expected 25 questions, got ${questions.length} — check final-exam.md format before proceeding`);
  }

  const browser = await chromium.launch({ headless: false, slowMo: 30 });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const formsTab = await ctx.newPage();
  await formsTab.goto('https://forms.office.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await formsTab.waitForFunction(
    () => !!document.querySelector('[aria-label="Quiz"], [aria-label="Create a new quiz"]'),
    null, { timeout: 60000 }
  );
  log('Forms home loaded (Helm tenant)');

  const { shareUrl, formId } = await createFormsQuiz(ctx, formsTab, 'Final Exam — Citizen AI Developer Program', questions);

  const result = { title: 'Final Exam — Citizen AI Developer Program', formId, shareUrl, questionCount: questions.length };
  fs.writeFileSync(path.join(__dirname, 'final_exam_form_helm.json'), JSON.stringify(result, null, 2));
  log(`\n✓ Final Exam form created: ${formId}`);
  log(`Saved to final_exam_form_helm.json`);

  await browser.close();
}

main();
