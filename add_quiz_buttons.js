/**
 * add_quiz_buttons.js
 *
 * Appends a "Take Quiz →" button to all 16 module content pages on SharePoint.
 * The button links to the GitHub Pages self-graded quiz for that module.
 * Also re-renders modules with the fixed markdownToHtml (correct table handling).
 *
 * Run: node add_quiz_buttons.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';
const CONTENT_DIR = path.join(__dirname, 'course-content');
const QUIZ_BASE_URL = 'https://evan-paliotta-ialta.github.io/citizen-ai-quizzes';

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

function markdownToHtml(markdown) {
  let html = markdown;

  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^---+$/gm, '<hr/>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Fixed table regex — supports multi-column separators like |---|---|---|
  html = html.replace(/(\|.+\|\n)((?:\|[-| :]+\|\n))(\|.+\|\n?)+/g, (match) => {
    const rows = match.trim().split('\n').filter(r => r.trim());
    const headerRow = rows[0];
    const dataRows = rows.slice(2);
    const parseRow = (row, tag) => {
      const cells = row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
      const style = tag === 'th'
        ? 'padding:10px 16px;text-align:left;font-weight:600;white-space:nowrap;'
        : 'padding:10px 16px;vertical-align:top;border-bottom:1px solid #e8ecf4;';
      return '<tr>' + cells.map(cell => `<${tag} style="${style}">${cell.trim()}</${tag}>`).join('') + '</tr>';
    };
    return (
      '<table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:14px;border:1px solid #dde3f0;">' +
      '<thead style="background:#000D2D;color:#ffffff;">' +
      parseRow(headerRow, 'th') +
      '</thead><tbody>' +
      dataRows.map(r => parseRow(r, 'td')).join('') +
      '</tbody></table>'
    );
  });

  html = html.replace(/(^[-*] .+\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^[-*] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });
  html = html.replace(/(^\d+\. .+\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h[1-6]|ul|ol|li|table|pre|blockquote|hr)/.test(block)) return block;
    return `<p>${block.replace(/\n/g, ' ')}</p>`;
  }).join('\n');

  return html;
}

const MODULES = [
  { num: 1,  spId: 1,  slug: 'module-01-what-claude-is',            title: "Module 1: What Claude Is (and Isn't)" },
  { num: 2,  spId: 2,  slug: 'module-02-how-models-are-built',       title: "Module 2: How the Model Was Built" },
  { num: 3,  spId: 3,  slug: 'module-03-tokens',                     title: "Module 3: Tokens \u2014 The Currency of AI" },
  { num: 4,  spId: 4,  slug: 'module-04-context-window',             title: "Module 4: The Context Window" },
  { num: 5,  spId: 5,  slug: 'module-05-specificity',                title: "Module 5: Why Specificity is Everything" },
  { num: 6,  spId: 6,  slug: 'module-06-anatomy-of-a-prompt',        title: "Module 6: Anatomy of a Good Prompt" },
  { num: 7,  spId: 7,  slug: 'module-07-iteration',                  title: "Module 7: Iteration, Examples, and Getting to Great" },
  { num: 8,  spId: 8,  slug: 'module-08-tips-and-tricks',            title: "Module 8: Tips, Tricks, and Power User Habits" },
  { num: 9,  spId: 9,  slug: 'module-09-operating-framework',        title: "Module 9: The Operating Framework" },
  { num: 10, spId: 10, slug: 'module-10-projects',                   title: "Module 10: Claude Desktop Projects" },
  { num: 11, spId: 11, slug: 'module-11-documents-and-multimodal',   title: "Module 11: Documents, Images, and Multimodal Input" },
  { num: 12, spId: 12, slug: 'module-12-team-use-cases',             title: "Module 12: Claude for Your Team" },
  { num: 13, spId: 13, slug: 'module-13-safety-and-responsible-use', title: "Module 13: Safety and Responsible Use" },
  { num: 14, spId: 14, slug: 'module-14-advanced-mcp-and-agents',    title: "Module 14: MCP, Agents, and RAG" },
  { num: 15, spId: 15, slug: 'module-15-github',                     title: "Module 15: GitHub \u2014 The Collaboration Layer" },
  { num: 16, spId: 16, slug: 'module-16-databases',                  title: "Module 16: Databases and Data Storage" },
];

function buildQuizButton(moduleNum) {
  const quizUrl = `${QUIZ_BASE_URL}/quiz-module-${moduleNum}.html`;
  return `
<hr style="margin:32px 0 24px;border:none;border-top:1px solid #eaeaea;">
<div style="background:#000D2D;padding:28px 32px;border-radius:6px;text-align:center;margin:0 0 24px;">
  <p style="color:#aac4ff;font-size:14px;margin:0 0 14px;">Ready to test your knowledge?</p>
  <a href="${quizUrl}" target="_blank"
     style="display:inline-block;background:#0042E0;color:#fff;font-weight:700;font-size:16px;padding:13px 32px;border-radius:4px;text-decoration:none;">
    Take Quiz ${moduleNum} →
  </a>
  <p style="color:#7a92bf;font-size:13px;margin:12px 0 0;">Opens in a new tab &nbsp;·&nbsp; Auto-graded &nbsp;·&nbsp; Unlimited attempts</p>
</div>`;
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
      id: `module-content-${pageId}`,
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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const page = await ctx.newPage();
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Verify page IDs by fetching pages list
  log('Verifying SharePoint page IDs...');
  const allPages = await page.evaluate(async (siteUrl) => {
    const r = await fetch(`${siteUrl}/_api/sitepages/pages?$select=Id,Title&$top=100`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const d = await r.json();
    return d.d.results.reduce((acc, p) => { acc[p.Title] = p.Id; return acc; }, {});
  }, SITE_URL);

  let successCount = 0;
  for (const mod of MODULES) {
    const mdPath = path.join(CONTENT_DIR, `${mod.slug}.md`);
    if (!fs.existsSync(mdPath)) {
      log(`SKIP module-${mod.num}: ${mdPath} not found`);
      continue;
    }

    // Resolve actual page ID from SharePoint (in case IDs differ)
    const pageId = allPages[mod.title] || mod.spId;
    if (!allPages[mod.title]) {
      log(`WARNING: could not find page by title "${mod.title}", using assumed ID ${mod.spId}`);
    }

    const markdown = fs.readFileSync(mdPath, 'utf8');
    // Remove the "Complete the quiz below" line from markdown — we replace it with the actual button
    const cleanMarkdown = markdown.replace(/\*Complete the quiz below.*?\*/g, '').trimEnd();
    const contentHtml = markdownToHtml(cleanMarkdown);
    const fullHtml = contentHtml + buildQuizButton(mod.num);

    log(`Updating module-${mod.num} (SP page ${pageId}): "${mod.title}"`);
    const result = await savePage(page, pageId, fullHtml);
    log(`  → ${result}`);
    if (result === 'published') successCount++;

    await new Promise(r => setTimeout(r, 400));
  }

  log(`\n═══ DONE: ${successCount}/${MODULES.length} module pages updated with quiz buttons ═══`);
  await browser.close();
})();
