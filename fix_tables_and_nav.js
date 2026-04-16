/**
 * fix_tables_and_nav.js
 *
 * 1. Fetches all SharePoint module page URLs (to build nextUrl map for quizzes)
 * 2. Fixes broken markdown table rendering in modules 2, 14, 15, 16
 *    — the original regex failed on multi-column separator rows (|---|---|---|)
 *    — also adds proper inline table styling
 * 3. Re-publishes those 4 module pages to SharePoint
 * 4. Prints the full module URL map (JSON) so quiz nextUrl values can be updated
 *
 * Run: node fix_tables_and_nav.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';
const CONTENT_DIR = path.join(__dirname, 'course-content');

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

// ─── Fixed markdown → HTML converter ─────────────────────────────────────────
// Key fix: separator row pattern changed from \|[-: ]+\| to \|[-| :]+\|
// so |---|---|---| is matched correctly for multi-column tables.
// Also adds inline styles so tables render attractively in SharePoint.

function markdownToHtml(markdown) {
  let html = markdown;

  // Fenced code blocks
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr/>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // ── Tables (FIXED) ──────────────────────────────────────────────────────────
  // Old bug: separator pattern \|[-: ]+\| failed on multi-col: |---|---|---|
  // because | is not in [-: ]. Fixed by adding | to the character class.
  html = html.replace(/(\|.+\|\n)((?:\|[-| :]+\|\n))(\|.+\|\n?)+/g, (match) => {
    const rows = match.trim().split('\n').filter(r => r.trim());
    const headerRow = rows[0];
    const dataRows = rows.slice(2); // skip separator row

    const parseRow = (row, tag) => {
      const cells = row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
      const style = tag === 'th'
        ? 'padding:10px 16px;text-align:left;font-weight:600;white-space:nowrap;'
        : 'padding:10px 16px;vertical-align:top;border-bottom:1px solid #e8ecf4;';
      return '<tr>' + cells.map(cell => `<${tag} style="${style}">${cell.trim()}</${tag}>`).join('') + '</tr>';
    };

    const theadStyle = 'background:#000D2D;color:#ffffff;';
    const tableStyle = 'border-collapse:collapse;width:100%;margin:16px 0;font-size:14px;border:1px solid #dde3f0;border-radius:4px;overflow:hidden;';

    return (
      `<table style="${tableStyle}">` +
      `<thead style="${theadStyle}">` +
      parseRow(headerRow, 'th') +
      '</thead><tbody>' +
      dataRows.map(r => parseRow(r, 'td')).join('') +
      '</tbody></table>'
    );
  });

  // Unordered lists
  html = html.replace(/(^[-*] .+\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^[-*] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/(^\d+\. .+\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Paragraphs
  html = html
    .split('\n\n')
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|li|table|pre|blockquote|hr)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');

  return html;
}

// ─── Modules that need table fixes ───────────────────────────────────────────
const MODULES_TO_FIX = [
  { num: 2,  slug: 'module-02-how-models-are-built' },
  { num: 14, slug: 'module-14-advanced-mcp-and-agents' },
  { num: 15, slug: 'module-15-github' },
  { num: 16, slug: 'module-16-databases' },
];

// ─── All module titles (for URL lookup) ──────────────────────────────────────
const ALL_MODULE_TITLES = [
  "Module 1: What Claude Is (and Isn't)",
  "Module 2: How the Model Was Built",
  "Module 3: Tokens \u2014 The Currency of AI",
  "Module 4: The Context Window",
  "Module 5: Why Specificity is Everything",
  "Module 6: Anatomy of a Good Prompt",
  "Module 7: Iteration, Examples, and Getting to Great",
  "Module 8: Tips, Tricks, and Power User Habits",
  "Module 9: The Operating Framework",
  "Module 10: Claude Desktop Projects",
  "Module 11: Documents, Images, and Multimodal Input",
  "Module 12: Claude for Your Team",
  "Module 13: Safety and Responsible Use",
  "Module 14: MCP, Agents, and RAG",
  "Module 15: GitHub \u2014 The Collaboration Layer",
  "Module 16: Databases and Data Storage",
];

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

  // ── Step 1: Fetch all pages to build module URL map ───────────────────────
  log('Fetching all SharePoint pages...');
  const allPages = await page.evaluate(async (siteUrl) => {
    let results = [];
    let url = `${siteUrl}/_api/sitepages/pages?$select=Id,Title,AbsoluteUrl&$top=100`;
    while (url) {
      const r = await fetch(url, { headers: { Accept: 'application/json;odata=verbose' } });
      const d = await r.json();
      results = results.concat(d.d.results);
      url = d.d.__next || null;
    }
    return results;
  }, SITE_URL);

  // Build title→{id, url} map
  const pageMap = {};
  for (const p of allPages) {
    pageMap[p.Title] = { id: p.Id, url: p.AbsoluteUrl };
  }

  // Print module URL map
  log('\n=== MODULE PAGE URL MAP ===');
  const moduleUrlMap = {};
  for (let i = 0; i < ALL_MODULE_TITLES.length; i++) {
    const title = ALL_MODULE_TITLES[i];
    const found = pageMap[title];
    if (found) {
      moduleUrlMap[i + 1] = found.url;
      log(`  Module ${i + 1}: ${found.url}`);
    } else {
      log(`  Module ${i + 1}: NOT FOUND (title: "${title}")`);
      // Try partial match
      const partial = allPages.find(p => p.Title && p.Title.includes(`Module ${i + 1}:`));
      if (partial) {
        moduleUrlMap[i + 1] = partial.AbsoluteUrl;
        log(`    → Found by partial match: "${partial.Title}" → ${partial.AbsoluteUrl}`);
      }
    }
  }

  // Write URL map to JSON for use by other scripts
  fs.writeFileSync(
    path.join(__dirname, 'module_page_urls.json'),
    JSON.stringify(moduleUrlMap, null, 2),
    'utf8'
  );
  log('\nWrote module_page_urls.json');

  // ── Step 2: Fix tables in affected modules ────────────────────────────────
  log('\n=== FIXING TABLE RENDERING ===');
  let fixed = 0;

  for (const mod of MODULES_TO_FIX) {
    const mdPath = path.join(CONTENT_DIR, `${mod.slug}.md`);
    if (!fs.existsSync(mdPath)) {
      log(`SKIP module-${mod.num}: content file not found`);
      continue;
    }

    const markdown = fs.readFileSync(mdPath, 'utf8');
    const html = markdownToHtml(markdown);

    // Find the page ID from the map
    const title = ALL_MODULE_TITLES[mod.num - 1];
    const pageInfo = pageMap[title] || allPages.find(p => p.Title && p.Title.includes(`Module ${mod.num}:`));

    if (!pageInfo) {
      log(`SKIP module-${mod.num}: page not found in SharePoint (title: "${title}")`);
      continue;
    }

    const pageId = pageInfo.Id || pageInfo.id;
    log(`Fixing module-${mod.num} (SP page ${pageId}): "${title}"`);

    const result = await savePage(page, pageId, html);
    log(`  → ${result}`);
    if (result === 'published') fixed++;

    await new Promise(r => setTimeout(r, 400));
  }

  log(`\n=== DONE: ${fixed}/${MODULES_TO_FIX.length} module pages fixed ===`);
  await browser.close();
})();
