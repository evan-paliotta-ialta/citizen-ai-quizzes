/**
 * rebuild_quiz_pages.js
 *
 * Rebuilds all 16 quiz pages with a proper structure:
 * 1. Questions with A/B/C/D on separate lines (readable)
 * 2. NO answers shown above the fold
 * 3. Clear submission instructions + prominent Submit button
 * 4. Answer key BELOW the submit button (self-check after submitting)
 *
 * Run: node rebuild_quiz_pages.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';
const SUBMIT_URL = `${SITE_URL}/Lists/Quiz%20Completions/NewForm.aspx`;

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

// Parse raw innerHTML to extract questions, choices, correct answers
function parseQuizHTML(html) {
  // Strip tags to plain text for parsing
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  const questions = [];
  // Match "Question N <text> A) <text> B) <text> C) <text> D) <text> Correct answer : X"
  const qRegex = /Question\s+(\d+)\s+([\s\S]*?)(?=Question\s+\d+|$)/g;
  let qMatch;

  while ((qMatch = qRegex.exec(plain)) !== null) {
    const block = qMatch[2].trim();

    // Extract correct answer
    const correctMatch = block.match(/Correct answer\s*[:\s]+([A-D])/i);
    const correct = correctMatch ? correctMatch[1].toUpperCase() : '?';

    // Extract question text (before A) )
    const qTextMatch = block.match(/^([\s\S]*?)(?:\s+A\)|\s+A\.)/);
    const qText = qTextMatch ? qTextMatch[1].trim() : block.split('A)')[0].trim();

    // Extract choices
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

// Build the new quiz page HTML
function buildQuizHTML(title, moduleNum, moduleTitle, nextQuizUrl, questions, passingScore) {
  const totalQ = questions.length;

  // Question blocks
  let qHtml = '';
  for (const q of questions) {
    qHtml += `
<div style="margin-bottom:28px;">
  <p style="font-weight:700;font-size:15px;margin-bottom:8px;">Question ${q.num}</p>
  <p style="margin-bottom:10px;">${q.text}</p>`;

    for (const [letter, text] of Object.entries(q.choices)) {
      qHtml += `
  <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px;padding:8px 12px;background:#f8f9fc;border-radius:4px;border:1px solid #e8ecf4;">
    <span style="font-weight:700;color:#0042E0;min-width:20px;">${letter})</span>
    <span>${text}</span>
  </div>`;
    }
    qHtml += `\n</div>\n<hr style="border:none;border-top:1px solid #eaeaea;margin:4px 0 20px 0;">`;
  }

  // Answer key (shown below submit button)
  let keyHtml = questions.map(q =>
    `<span style="display:inline-block;margin:4px 8px 4px 0;padding:5px 12px;background:#e8f0fe;border-radius:4px;font-weight:700;color:#000D2D;">Q${q.num}: ${q.correct}</span>`
  ).join('');

  const nextLink = nextQuizUrl
    ? `<p style="margin-top:20px;"><a href="${nextQuizUrl}" style="color:#0042E0;">→ Continue to next module</a></p>`
    : `<p style="margin-top:20px;"><a href="${SITE_URL}/SitePages/Final-Exam.aspx" style="color:#0042E0;">→ Proceed to the Final Exam</a></p>`;

  return `
<h1>${title}</h1>
<p>
  <strong>Passing score:</strong> ${passingScore}/${totalQ} &nbsp;|&nbsp;
  <strong>Attempts:</strong> Unlimited &nbsp;|&nbsp;
  <strong>Format:</strong> Multiple choice
</p>
<hr>

<p style="background:#e8f0fe;border-left:4px solid #0042E0;padding:12px 16px;margin:16px 0;">
  <strong>How to take this quiz:</strong> Read each question and choose the best answer (A, B, C, or D).
  Write down your answers, then click <strong>Submit Quiz Answers</strong> below.
  You'll enter them in the format <code>Q1:B, Q2:C, Q3:A...</code>
  The answer key is available at the bottom of this page — check it <em>after</em> you submit.
</p>

<hr>

${qHtml}

<div style="margin:32px 0;padding:24px;background:#000D2D;text-align:center;border-radius:4px;">
  <p style="color:#aac4ff;margin-bottom:12px;font-size:14px;">Ready? Enter your answers in the submission form.</p>
  <a href="${SUBMIT_URL}" style="display:inline-block;background:#0042E0;color:white;font-weight:700;font-size:18px;padding:14px 32px;border-radius:4px;text-decoration:none;">
    Submit Quiz ${moduleNum} Answers →
  </a>
  <p style="color:#aac4ff;margin-top:10px;font-size:13px;">Select <strong>Module ${moduleNum} — ${moduleTitle}</strong> from the dropdown.</p>
</div>

${nextLink}

<hr style="margin:40px 0;">

<details style="background:#f8f9fc;border:1px solid #ddd;border-radius:4px;padding:16px;">
  <summary style="font-weight:700;cursor:pointer;font-size:15px;color:#000D2D;">
    ▶ Answer Key — check your answers after submitting
  </summary>
  <div style="margin-top:16px;">
    ${keyHtml}
  </div>
</details>
`;
}

async function savePage(page, pageId, html) {
  return page.evaluate(async ({ siteUrl, pageId, html }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    const canvas = [{
      position: { zoneIndex: 1, sectionIndex: 1, sectionFactor: 12, layoutIndex: 1 },
      controlType: 4,
      id: `quiz-content-${pageId}`,
      innerHTML: html,
      editorType: 'CKEditor',
    }];

    await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    const s = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
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

// Quiz page IDs and metadata
const QUIZ_PAGES = [
  { id: 34, moduleNum: 1,  title: 'Quiz — Module 1: What Claude Is (and Isn\'t)',           moduleTitle: 'What Claude Is (and Isn\'t)',           nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-2--How-the-Model-Was-Built.aspx`,               passingScore: 4 },
  { id: 17, moduleNum: 2,  title: 'Quiz — Module 2: How the Model Was Built',                moduleTitle: 'How the Model Was Built',                nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-3--Tokens-—-The-Currency-of-AI.aspx`,           passingScore: 4 },
  { id: 18, moduleNum: 3,  title: 'Quiz — Module 3: Tokens — The Currency of AI',            moduleTitle: 'Tokens — The Currency of AI',            nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-4--The-Context-Window.aspx`,                    passingScore: 4 },
  { id: 19, moduleNum: 4,  title: 'Quiz — Module 4: The Context Window',                     moduleTitle: 'The Context Window',                     nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-5--Why-Specificity-is-Everything.aspx`,          passingScore: 4 },
  { id: 20, moduleNum: 5,  title: 'Quiz — Module 5: Why Specificity is Everything',          moduleTitle: 'Why Specificity is Everything',          nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-6--Anatomy-of-a-Good-Prompt.aspx`,              passingScore: 4 },
  { id: 21, moduleNum: 6,  title: 'Quiz — Module 6: Anatomy of a Good Prompt',               moduleTitle: 'Anatomy of a Good Prompt',               nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-7--Iteration,-Examples,-and-Getting-to-Great.aspx`, passingScore: 4 },
  { id: 22, moduleNum: 7,  title: 'Quiz — Module 7: Iteration, Examples, and Getting to Great', moduleTitle: 'Iteration, Examples, and Getting to Great', nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-8--Tips,-Tricks,-and-Power-User-Habits.aspx`, passingScore: 4 },
  { id: 23, moduleNum: 8,  title: 'Quiz — Module 8: Tips, Tricks, and Power User Habits',    moduleTitle: 'Tips, Tricks, and Power User Habits',    nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-9--The-Operating-Framework.aspx`,               passingScore: 4 },
  { id: 24, moduleNum: 9,  title: 'Quiz — Module 9: The Operating Framework',                moduleTitle: 'The Operating Framework',                nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-10--Claude-Desktop-Projects.aspx`,              passingScore: 4 },
  { id: 25, moduleNum: 10, title: 'Quiz — Module 10: Claude Desktop Projects',               moduleTitle: 'Claude Desktop Projects',                nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-11--Documents,-Images,-and-Multimodal-Input.aspx`, passingScore: 4 },
  { id: 26, moduleNum: 11, title: 'Quiz — Module 11: Documents, Images, and Multimodal Input', moduleTitle: 'Documents, Images, and Multimodal Input', nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-12--Claude-for-Your-Team.aspx`,               passingScore: 4 },
  { id: 27, moduleNum: 12, title: 'Quiz — Module 12: Claude for Your Team',                  moduleTitle: 'Claude for Your Team',                   nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-13--Safety-and-Responsible-Use.aspx`,           passingScore: 4 },
  { id: 28, moduleNum: 13, title: 'Quiz — Module 13: Safety and Responsible Use',            moduleTitle: 'Safety and Responsible Use',             nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-14--MCP,-Agents,-and-RAG.aspx`,                 passingScore: 5 },
  { id: 29, moduleNum: 14, title: 'Quiz — Module 14: MCP, Agents, and RAG',                  moduleTitle: 'MCP, Agents, and RAG',                   nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-15--GitHub-—-The-Collaboration-Layer.aspx`,     passingScore: 4 },
  { id: 30, moduleNum: 15, title: 'Quiz — Module 15: GitHub — The Collaboration Layer',      moduleTitle: 'GitHub — The Collaboration Layer',       nextQuizUrl: `${SITE_URL}/SitePages/Quiz-—-Module-16--Databases-and-Data-Storage.aspx`,          passingScore: 4 },
  { id: 31, moduleNum: 16, title: 'Quiz — Module 16: Databases and Data Storage',            moduleTitle: 'Databases and Data Storage',             nextQuizUrl: null,                                                                                    passingScore: 4 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const page = await ctx.newPage();
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Fetch all quiz page canvases
  const rawPages = await page.evaluate(async (siteUrl) => {
    const r = await fetch(`${siteUrl}/_api/sitepages/pages?$select=Id,Title,CanvasContent1&$top=100`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const d = await r.json();
    return d.d.results.reduce((acc, p) => { acc[p.Id] = p.CanvasContent1; return acc; }, {});
  }, SITE_URL);

  let successCount = 0;
  for (const qp of QUIZ_PAGES) {
    const rawCanvas = rawPages[qp.id];
    if (!rawCanvas) { log(`SKIP ${qp.id}: no canvas`); continue; }

    // Extract full innerHTML from canvas
    let fullHtml = '';
    try {
      const blocks = JSON.parse(rawCanvas);
      fullHtml = blocks.map(b => b.innerHTML || '').join(' ');
    } catch { fullHtml = rawCanvas; }

    const questions = parseQuizHTML(fullHtml);
    if (questions.length === 0) {
      log(`SKIP [${qp.id}] ${qp.title}: could not parse questions`);
      continue;
    }

    log(`Rebuilding [${qp.id}] ${qp.title} — ${questions.length} questions parsed`);

    const newHtml = buildQuizHTML(qp.title, qp.moduleNum, qp.moduleTitle, qp.nextQuizUrl, questions, qp.passingScore);
    const result = await savePage(page, qp.id, newHtml);
    log(`  → ${result}`);
    if (result === 'published') successCount++;

    await new Promise(r => setTimeout(r, 300));
  }

  log(`\n═══ DONE: ${successCount}/${QUIZ_PAGES.length} quiz pages rebuilt ═══`);
  await browser.close();
})();
