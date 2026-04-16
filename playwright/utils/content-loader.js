/**
 * Reads course content Markdown files and converts them to HTML
 * for insertion into SharePoint pages.
 *
 * Also exports the structured module list used by all build scripts.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const CONTENT_DIR = path.resolve(__dirname, '../../course-content');
const QUIZ_DIR = path.join(CONTENT_DIR, 'quizzes');

/**
 * Master list of all modules.
 * Order here determines the order on the SharePoint site.
 */
const MODULES = [
  { id: 1,  slug: 'module-01-what-claude-is',           title: 'Module 1: What Claude Is (and Isn\'t)',               track: 'Foundation' },
  { id: 2,  slug: 'module-02-how-models-are-built',      title: 'Module 2: How the Model Was Built',                   track: 'Foundation' },
  { id: 3,  slug: 'module-03-tokens',                    title: 'Module 3: Tokens — The Currency of AI',               track: 'Foundation' },
  { id: 4,  slug: 'module-04-context-window',            title: 'Module 4: The Context Window',                        track: 'Foundation' },
  { id: 5,  slug: 'module-05-specificity',               title: 'Module 5: Why Specificity is Everything',             track: 'Foundation' },
  { id: 6,  slug: 'module-06-anatomy-of-a-prompt',       title: 'Module 6: Anatomy of a Good Prompt',                  track: 'Core Skills' },
  { id: 7,  slug: 'module-07-iteration',                 title: 'Module 7: Iteration, Examples, and Getting to Great', track: 'Core Skills' },
  { id: 8,  slug: 'module-08-tips-and-tricks',           title: 'Module 8: Tips, Tricks, and Power User Habits',       track: 'Core Skills' },
  { id: 9,  slug: 'module-09-operating-framework',       title: 'Module 9: The Operating Framework',                   track: 'Core Skills' },
  { id: 10, slug: 'module-10-projects',                  title: 'Module 10: Claude Desktop Projects',                  track: 'Claude Desktop' },
  { id: 11, slug: 'module-11-documents-and-multimodal',  title: 'Module 11: Documents, Images, and Multimodal Input',  track: 'Claude Desktop' },
  { id: 12, slug: 'module-12-team-use-cases',            title: 'Module 12: Claude for Your Team',                     track: 'Application' },
  { id: 13, slug: 'module-13-safety-and-responsible-use',title: 'Module 13: Safety and Responsible Use',               track: 'Required' },
  { id: 14, slug: 'module-14-advanced-mcp-and-agents',   title: 'Module 14: MCP, Agents, and RAG',                     track: 'Advanced' },
  { id: 15, slug: 'module-15-github',                    title: 'Module 15: GitHub — The Collaboration Layer',         track: 'Citizen Developer' },
  { id: 16, slug: 'module-16-databases',                 title: 'Module 16: Databases and Data Storage',               track: 'Citizen Developer' },
];

/**
 * Converts basic Markdown to HTML.
 * Handles: headings, bold, horizontal rules, code blocks, tables, ordered/unordered lists, paragraphs.
 * This is intentionally simple — not a full Markdown parser.
 */
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

  // Tables — fixed separator regex to support multi-column rows (|---|---|---|)
  // Old bug: \|[-: ]+\| failed because | is not in [-: ], so only single-column
  // separator rows matched. Fixed by adding | to the character class.
  // Also adds inline styles since SharePoint has no default table CSS.
  html = html.replace(/(\|.+\|\n)((?:\|[-| :]+\|\n))(\|.+\|\n?)+/g, (match) => {
    const rows = match.trim().split('\n').filter(r => r.trim());
    const headerRow = rows[0];
    const dataRows = rows.slice(2); // skip separator row

    const parseRow = (row, tag) => {
      const cells = row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
      const style = tag === 'th'
        ? 'padding:10px 16px;text-align:left;font-weight:600;white-space:nowrap;color:#ffffff;background:#000D2D;'
        : 'padding:10px 16px;vertical-align:top;border-bottom:1px solid #e8ecf4;';
      return '<tr>' + cells.map(cell => `<${tag} style="${style}">${cell.trim()}</${tag}>`).join('') + '</tr>';
    };

    const tableStyle = 'border-collapse:collapse;width:100%;margin:16px 0;font-size:14px;border:1px solid #dde3f0;';
    const theadStyle = 'background:#000D2D;color:#ffffff;';

    return (
      `<table style="${tableStyle}"><thead style="${theadStyle}">` +
      parseRow(headerRow, 'th') +
      '</thead><tbody>' +
      dataRows.map(r => parseRow(r, 'td')).join('') +
      '</tbody></table>'
    );
  });

  // Unordered lists — collect consecutive lines starting with - or *
  html = html.replace(/(^[-*] .+\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^[-*] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/(^\d+\. .+\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Blockquotes (used for callouts like > Note:)
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Paragraphs — wrap lines that are not already block elements
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

/**
 * Reads a module's Markdown file and returns its HTML content.
 */
function loadModuleContent(slug) {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Content file not found: ${filePath}`);
  }
  const markdown = fs.readFileSync(filePath, 'utf8');
  return markdownToHtml(markdown);
}

/**
 * Reads a quiz Markdown file and returns its HTML content.
 */
function loadQuizContent(moduleId) {
  const slug = `quiz-module-${String(moduleId).padStart(2, '0')}`;
  const filePath = path.join(QUIZ_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Quiz file not found: ${filePath}`);
  }
  const markdown = fs.readFileSync(filePath, 'utf8');
  return markdownToHtml(markdown);
}

/**
 * Reads the final exam Markdown file and returns its HTML.
 */
function loadFinalExamContent() {
  const filePath = path.join(CONTENT_DIR, 'final-exam.md');
  const markdown = fs.readFileSync(filePath, 'utf8');
  return markdownToHtml(markdown);
}

module.exports = {
  MODULES,
  loadModuleContent,
  loadQuizContent,
  loadFinalExamContent,
  markdownToHtml,
};
