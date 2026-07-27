/**
 * push_module_to_helm.js
 *
 * Converts a course-content/module-*.md file to HTML matching the existing
 * page style and pushes it to the live Helm SharePoint page, preserving the
 * "Take the Quiz / Next Module" nav footer table already on the page (we
 * don't try to regenerate it — just keep whatever's already there).
 *
 * Run: node push_module_to_helm.js "Module 2: How the Model Was Built" course-content/module-02-how-models-are-built.md
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.helm.json');
const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';

const [, , pageTitleArg, mdPathArg] = process.argv;
if (!pageTitleArg || !mdPathArg) {
  console.error('Usage: node push_module_to_helm.js "<exact page title>" <path-to-md>');
  process.exit(1);
}

// ─── Minimal markdown → HTML converter matching the site's existing style ────
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(md) {
  // Order matters: code spans first (so we don't mangle markup inside them), then bold, then italic, then links
  let out = md;
  out = out.replace(/`([^`]+)`/g, (m, code) => `<code>${escapeHtml(code)}</code>`);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

function tableToHtml(lines) {
  const rows = lines.filter(l => l.trim().startsWith('|'));
  const headerCells = rows[0].split('|').slice(1, -1).map(c => c.trim());
  const bodyRows = rows.slice(2); // skip header + separator row
  let html = '<table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:14px;border:1px solid #dde3f0;">';
  html += '<thead style="background:#000D2D;color:#ffffff;"><tr>';
  headerCells.forEach(c => {
    html += `<th style="padding:10px 16px;text-align:left;font-weight:600;white-space:nowrap;color:#ffffff;background:#000D2D;">${inline(c)}</th>`;
  });
  html += '</tr></thead><tbody>';
  bodyRows.forEach(r => {
    const cells = r.split('|').slice(1, -1).map(c => c.trim());
    html += '<tr>';
    cells.forEach(c => {
      html += `<td style="padding:10px 16px;vertical-align:top;border-bottom:1px solid #e8ecf4;">${inline(c)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function markdownToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  let listBuffer = [];
  let listType = null;

  function flushList() {
    if (listBuffer.length) {
      const tag = listType === 'ol' ? 'ol' : 'ul';
      out.push(`<${tag}>` + listBuffer.map(item => `<li>${inline(item)}</li>`).join('') + `</${tag}>`);
      listBuffer = [];
      listType = null;
    }
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') { flushList(); i++; continue; }
    if (trimmed === '---') { flushList(); out.push('<hr>'); i++; continue; }

    if (trimmed.startsWith('```')) {
      flushList();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++; // skip closing ```
      out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    if (trimmed.startsWith('#')) {
      flushList();
      const m = trimmed.match(/^(#{1,4})\s+(.*)$/);
      if (m) {
        const level = m[1].length === 1 ? 1 : Math.min(m[1].length, 4);
        out.push(`<h${level}>${inline(m[2])}</h${level}>`);
        i++;
        continue;
      }
    }

    if (trimmed.startsWith('> ')) {
      flushList();
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${quoteLines.map(inline).join('<br>')}</blockquote>`);
      continue;
    }

    if (trimmed.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { tableLines.push(lines[i]); i++; }
      flushList();
      out.push(tableToHtml(tableLines));
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ''));
      i++;
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listBuffer.push(trimmed.replace(/^\d+\.\s+/, ''));
      i++;
      continue;
    }

    flushList();
    out.push(`<p>${inline(trimmed)}</p>`);
    i++;
  }
  flushList();
  return out.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  const md = fs.readFileSync(path.join(__dirname, mdPathArg), 'utf8');
  // Skip the H1 title line (SharePoint's titleArea already shows the page title
  // separately in some layouts, but the existing pages DO repeat an <h1> in-body
  // too, matching original behavior) — keep everything, convert as-is.
  const newBodyHtml = markdownToHtml(md);

  const browser = await chromium.launch({ headless: false, slowMo: 10 });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const tab = await ctx.newPage();
  await tab.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(5000);

  const pages = await tab.evaluate(async (siteUrl) => {
    const r = await fetch(`${siteUrl}/_api/sitepages/pages?$select=Id,Title,CanvasContent1&$top=200`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    const d = await r.json();
    return d.d.results;
  }, SITE_URL);

  const page = pages.find(p => p.title === pageTitleArg || p.Title === pageTitleArg);
  if (!page) {
    console.error(`Page not found: "${pageTitleArg}"`);
    console.error('Available titles (first 30):', pages.slice(0, 30).map(p => p.Title).join(' | '));
    await browser.close();
    process.exit(1);
  }
  const pageId = page.Id;
  log(`Found page "${pageTitleArg}" (id ${pageId})`);

  const canvas = JSON.parse(page.CanvasContent1);
  const block = canvas[0]; // single one-column block, matches observed page structure
  const oldHtml = block.innerHTML;

  // Preserve the trailing nav-footer table: find the LAST <table...>...</table> in the old HTML
  // (the nav footer is always the final element on these pages) and keep it verbatim.
  const lastTableStart = oldHtml.lastIndexOf('<table');
  let navFooterHtml = '';
  if (lastTableStart !== -1) {
    navFooterHtml = oldHtml.slice(lastTableStart);
  }

  const finalHtml = newBodyHtml + (navFooterHtml ? '\n<hr>\n' + navFooterHtml : '');

  const result = await tab.evaluate(async ({ siteUrl, pageId, html }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    const canvas = [{
      position: { zoneIndex: 1, sectionIndex: 1, sectionFactor: 12, layoutIndex: 1 },
      controlType: 4, id: `content-${pageId}`, innerHTML: html, editorType: 'CKEditor',
    }];

    await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });

    const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*',
      },
      body: JSON.stringify({ __metadata: { type: 'SP.Publishing.SitePage' }, CanvasContent1: JSON.stringify(canvas) }),
    });
    if (!saveRes.ok) return { status: `save_failed_${saveRes.status}`, body: await saveRes.text() };

    const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}` };
  }, { siteUrl: SITE_URL, pageId, html: finalHtml });

  log(`Result: ${JSON.stringify(result)}`);
  await browser.close();
}

main();
