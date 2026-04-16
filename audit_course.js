/**
 * Course Audit Script
 *
 * Audits every module and quiz page on the SharePoint course site:
 *  1. Verifies each page exists and has content
 *  2. Checks quiz pages have Microsoft Forms links embedded
 *  3. Checks quiz result tracking (forms URL present)
 *  4. Reports content quality issues (empty sections, placeholder text, etc.)
 *  5. Checks navigation links between pages
 *
 * Run from the "Citizen AI Engineer" folder:
 *   node audit_course.js
 *
 * Output: audit_report.json + console summary
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

// All expected pages with correct naming convention from the site
const ALL_PAGES = [
  // Modules
  { type: 'module', num: 0,  title: "Module 0: Why We're Doing This" },
  { type: 'module', num: 1,  title: "Module 1: What Claude Is (and Isn't)" },
  { type: 'module', num: 2,  title: "Module 2: How the Model Was Built" },
  { type: 'module', num: 3,  title: "Module 3: Tokens — The Currency of AI" },
  { type: 'module', num: 4,  title: "Module 4: The Context Window" },
  { type: 'module', num: 5,  title: "Module 5: Why Specificity is Everything" },
  { type: 'module', num: 6,  title: "Module 6: Anatomy of a Good Prompt" },
  { type: 'module', num: 7,  title: "Module 7: Iteration, Examples, and Getting to Great" },
  { type: 'module', num: 8,  title: "Module 8: Tips, Tricks, and Power User Habits" },
  { type: 'module', num: 9,  title: "Module 9: The Operating Framework" },
  { type: 'module', num: 10, title: "Module 10: Claude Desktop Projects" },
  { type: 'module', num: 11, title: "Module 11: Documents, Images, and Multimodal Input" },
  { type: 'module', num: 12, title: "Module 12: Claude for Your Team" },
  { type: 'module', num: 13, title: "Module 13: Safety and Responsible Use" },
  { type: 'module', num: 14, title: "Module 14: MCP, Agents, and RAG" },
  { type: 'module', num: 15, title: "Module 15: GitHub — The Collaboration Layer" },
  { type: 'module', num: 16, title: "Module 16: Databases and Data Storage" },
  // Quizzes (actual naming convention on the site)
  { type: 'quiz',   num: 1,  title: "Quiz — Module 1: What Claude Is (and Isn't)" },
  { type: 'quiz',   num: 2,  title: "Quiz — Module 2: How the Model Was Built" },
  { type: 'quiz',   num: 3,  title: "Quiz — Module 3: Tokens — The Currency of AI" },
  { type: 'quiz',   num: 4,  title: "Quiz — Module 4: The Context Window" },
  { type: 'quiz',   num: 5,  title: "Quiz — Module 5: Why Specificity is Everything" },
  { type: 'quiz',   num: 6,  title: "Quiz — Module 6: Anatomy of a Good Prompt" },
  { type: 'quiz',   num: 7,  title: "Quiz — Module 7: Iteration, Examples, and Getting to Great" },
  { type: 'quiz',   num: 8,  title: "Quiz — Module 8: Tips, Tricks, and Power User Habits" },
  { type: 'quiz',   num: 9,  title: "Quiz — Module 9: The Operating Framework" },
  { type: 'quiz',   num: 10, title: "Quiz — Module 10: Claude Desktop Projects" },
  { type: 'quiz',   num: 11, title: "Quiz — Module 11: Documents, Images, and Multimodal Input" },
  { type: 'quiz',   num: 12, title: "Quiz — Module 12: Claude for Your Team" },
  { type: 'quiz',   num: 13, title: "Quiz — Module 13: Safety and Responsible Use" },
  { type: 'quiz',   num: 14, title: "Quiz — Module 14: MCP, Agents, and RAG" },
  { type: 'quiz',   num: 15, title: "Quiz — Module 15: GitHub — The Collaboration Layer" },
  { type: 'quiz',   num: 16, title: "Quiz — Module 16: Databases and Data Storage" },
  { type: 'exam',   num: 0,  title: "Final Exam" },
  { type: 'support', num: 0, title: "Day 1 Quick Start" },
];

// Fetch all pages with full content via REST API
async function fetchAllPages(playwrightPage) {
  log('Fetching all site pages via REST API...');
  const result = await playwrightPage.evaluate(async ({ siteUrl }) => {
    const res = await fetch(
      `${siteUrl}/_api/sitepages/pages?$select=Id,Title,CanvasContent1,PromotedState,Modified,CheckoutUser&$top=200`,
      { headers: { Accept: 'application/json;odata=verbose' } }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API call failed ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    return (data.d?.results || []).map(p => ({
      id: p.Id,
      title: p.Title,
      modified: p.Modified,
      promotedState: p.PromotedState,
      canvasLength: (p.CanvasContent1 || '').length,
      canvas: p.CanvasContent1 || '',
    }));
  }, { siteUrl: SITE_URL });
  return result;
}

// Extract plain text from canvas HTML
function extractText(canvas) {
  try {
    const blocks = JSON.parse(canvas);
    return blocks
      .filter(b => b.innerHTML)
      .map(b => b.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      .join('\n');
  } catch (e) {
    return '';
  }
}

// Extract all href values from canvas HTML
// canvas is the raw JSON string — parse it first so quotes aren't escaped
function extractLinks(canvas) {
  const links = [];
  try {
    const blocks = JSON.parse(canvas);
    const html = blocks.map(b => b.innerHTML || '').join('\n');
    const hrefRegex = /href="([^"]+)"/g;
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
      links.push(match[1]);
    }
  } catch (e) {
    // fallback: search raw string with escaped quotes
    const hrefRegex = /href=\\"([^"\\]+)\\"/g;
    let match;
    while ((match = hrefRegex.exec(canvas)) !== null) {
      links.push(match[1]);
    }
  }
  return links;
}

// Analyze a page's content
function analyzePage(pageData, expected) {
  const issues = [];
  const warnings = [];
  const info = {};

  if (!pageData) {
    return {
      status: 'MISSING',
      issues: ['Page does not exist on SharePoint'],
      warnings: [],
      info: {},
    };
  }

  info.pageId = pageData.id;
  info.modified = pageData.modified;
  info.canvasLength = pageData.canvasLength;

  // PromotedState: 0 = regular published page, 1 = awaiting news promotion, 2 = promoted as news
  // A page being "checked out" is a separate state not visible in this field
  // PromotedState 0 = normal published page (NOT a draft issue)
  info.promotedState = pageData.promotedState;

  if (pageData.canvasLength < 50) {
    issues.push('Page is essentially empty (canvas content < 50 chars)');
    return { status: 'ISSUES', issues, warnings, info };
  }

  const allText = extractText(pageData.canvas);
  const allLinks = extractLinks(pageData.canvas);

  info.textLength = allText.length;
  info.linkCount = allLinks.length;

  // Placeholder text checks — skip instructional uses of the word "placeholder"
  const placeholders = ['TODO', 'lorem ipsum', 'Insert content here', '[content]', '[['];
  for (const ph of placeholders) {
    if (allText.toLowerCase().includes(ph.toLowerCase())) {
      issues.push(`Contains placeholder text: "${ph}"`);
    }
  }
  // "PLACEHOLDER" (uppercase) check — but only flag if it's NOT in an instructional sentence
  if (allText.includes('PLACEHOLDER') && !allText.toLowerCase().includes('replace all the placeholders') && !allText.toLowerCase().includes('replace the placeholder')) {
    issues.push('Contains uppercase PLACEHOLDER text — likely unfilled template content');
  }

  // Quiz/exam checks
  if (expected.type === 'quiz' || expected.type === 'exam') {
    const formsLinks = allLinks.filter(l =>
      l.includes('forms.office.com') ||
      l.includes('forms.microsoft.com') ||
      l.includes('forms.gle')
    );
    // Also accept SharePoint list submission forms
    const hasListForm = allLinks.some(l => l.includes('/Lists/') && l.includes('NewForm')) ||
                        pageData.canvas.includes('Final%20Exam%20Submissions') ||
                        pageData.canvas.includes('Final Exam Submissions');
    const hasFormsEmbed = pageData.canvas.includes('microsoftforms') ||
                          pageData.canvas.includes('<iframe') ||
                          pageData.canvas.includes('officeapps.live');

    info.formsLinks = formsLinks;
    info.hasFormsEmbed = hasFormsEmbed;
    info.hasListForm = hasListForm;

    if (formsLinks.length === 0 && !hasFormsEmbed && !hasListForm) {
      issues.push('No submission mechanism found (no Forms link or SharePoint list form)');
    } else {
      info.quizLinked = true;
      if (hasListForm) {
        info.submissionType = 'SharePoint List';
      } else if (formsLinks.length > 0) {
        warnings.push('Manual verification needed: confirm Form has "Send results to spreadsheet" enabled in Forms settings');
      }
    }

    // Verify quiz has questions/instructions
    if (allText.length < 200) {
      issues.push(`Quiz content is very short (${allText.length} chars) — may be missing instructions`);
    }
  }

  // Module checks
  if (expected.type === 'module') {
    if (allText.length < 500) {
      issues.push(`Module content is very short (${allText.length} chars) — may be incomplete`);
    }

    // Check for navigation link to next page
    const hasNextLink = allLinks.some(l => l.includes('sharepoint.com')) ||
                        allText.includes('→') ||
                        allText.includes('Next:') ||
                        allText.includes('Next Module') ||
                        allText.includes('Take the Quiz');
    info.hasNavigation = hasNextLink;
    if (!hasNextLink) {
      warnings.push('No navigation link to next page/quiz found');
    }

    // Module 0 doesn't have a quiz, so skip quiz link check
    // Other modules should link to their quiz
    if (expected.num > 0) {
      const quizTitle = `Quiz — Module ${expected.num}`;
      const hasQuizLink = allLinks.some(l => l.toLowerCase().includes('quiz')) ||
                          allText.includes('Take the Quiz') ||
                          allText.includes('Quiz');
      if (!hasQuizLink) {
        warnings.push('Module does not appear to link to its quiz');
      }
    }
  }

  const status = issues.length > 0 ? 'ISSUES' : (warnings.length > 0 ? 'WARNINGS' : 'OK');
  return { status, issues, warnings, info };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  if (!fs.existsSync(AUTH_PATH)) {
    log('ERROR: No auth session found. Run: node playwright/auth/save-auth.js');
    process.exit(1);
  }

  log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_PATH });
  const page = await context.newPage();

  log('Loading SharePoint site...');
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const url = page.url();
  if (url.includes('login.microsoftonline') || url.includes('login.live')) {
    log('ERROR: Session expired. Run: node playwright/auth/save-auth.js');
    await browser.close();
    process.exit(1);
  }
  log('Authenticated.');

  let allPages;
  try {
    allPages = await fetchAllPages(page);
    log(`Fetched ${allPages.length} pages from SharePoint.`);
  } catch (e) {
    log(`ERROR: ${e.message}`);
    await browser.close();
    process.exit(1);
  }

  // Index by title
  const pagesByTitle = {};
  for (const p of allPages) {
    pagesByTitle[p.title] = p;
  }

  // Run audit
  const report = {
    auditDate: new Date().toISOString(),
    siteUrl: SITE_URL,
    summary: { ok: 0, warnings: 0, issues: 0, missing: 0 },
    pages: [],
    contentGaps: [],
  };

  console.log('\n' + '═'.repeat(72));
  console.log('COURSE AUDIT RESULTS');
  console.log('═'.repeat(72));

  for (const expected of ALL_PAGES) {
    const pageData = pagesByTitle[expected.title] || null;
    const analysis = analyzePage(pageData, expected);

    const pageReport = {
      title: expected.title,
      type: expected.type,
      num: expected.num,
      ...analysis,
    };
    report.pages.push(pageReport);

    if (analysis.status === 'OK') {
      report.summary.ok++;
      console.log(`\n  ✓ [${expected.type.toUpperCase().padEnd(6)}] ${expected.title}`);
    } else if (analysis.status === 'WARNINGS') {
      report.summary.warnings++;
      console.log(`\n  ~ [${expected.type.toUpperCase().padEnd(6)}] ${expected.title}`);
      for (const w of analysis.warnings) console.log(`       ⚠  ${w}`);
    } else if (analysis.status === 'MISSING') {
      report.summary.missing++;
      console.log(`\n  ✗ [MISSING] ${expected.title}`);
    } else {
      report.summary.issues++;
      console.log(`\n  ✗ [${expected.type.toUpperCase().padEnd(6)}] ${expected.title}`);
      for (const issue of analysis.issues) console.log(`       ✗  ${issue}`);
      for (const w of analysis.warnings) console.log(`       ⚠  ${w}`);
    }

    // Detailed info for quizzes
    if ((expected.type === 'quiz' || expected.type === 'exam') && analysis.info.formsLinks?.length > 0) {
      console.log(`       📝 Forms URL: ${analysis.info.formsLinks[0]}`);
    }
  }

  // Check for unexpected pages (not in our list)
  const expectedTitles = new Set(ALL_PAGES.map(p => p.title));
  const extraPages = allPages.filter(p => !expectedTitles.has(p.title) && p.title !== 'Home');

  console.log('\n' + '═'.repeat(72));
  console.log('SUMMARY');
  console.log('═'.repeat(72));
  console.log(`  OK:         ${report.summary.ok}`);
  console.log(`  Warnings:   ${report.summary.warnings}`);
  console.log(`  Issues:     ${report.summary.issues}`);
  console.log(`  Missing:    ${report.summary.missing}`);
  console.log(`  Total:      ${ALL_PAGES.length}`);

  if (extraPages.length > 0) {
    console.log('\nUnexpected pages on site (not in course structure):');
    for (const p of extraPages) {
      console.log(`  [ID:${p.id}] "${p.title}" (${p.canvasLength} chars)`);
    }
  }

  console.log('\n' + '═'.repeat(72));
  console.log('CONTENT GAPS & RECOMMENDATIONS');
  console.log('═'.repeat(72));

  // Identify content gaps
  const quizzesMissingForms = report.pages.filter(
    p => (p.type === 'quiz' || p.type === 'exam') && p.issues?.some(i => i.includes('No Microsoft Forms'))
  );
  if (quizzesMissingForms.length > 0) {
    console.log('\n⚠  QUIZZES WITH NO FORMS LINK (quiz cannot be taken):');
    for (const q of quizzesMissingForms) {
      console.log(`   - ${q.title}`);
    }
    console.log('   → Each quiz needs a Microsoft Form created and linked.');
    console.log('   → In Forms, enable "Send results to spreadsheet" for tracking.');
    report.contentGaps.push({
      gap: 'Quiz forms not linked',
      pages: quizzesMissingForms.map(q => q.title),
      recommendation: 'Create Microsoft Forms for each quiz, link to quiz page, enable spreadsheet result tracking',
    });
  }

  const modulesWithPlaceholders = report.pages.filter(
    p => p.type === 'module' && p.issues?.some(i => i.includes('placeholder'))
  );
  if (modulesWithPlaceholders.length > 0) {
    console.log('\n⚠  MODULES WITH PLACEHOLDER CONTENT:');
    for (const m of modulesWithPlaceholders) {
      console.log(`   - ${m.title}`);
    }
    report.contentGaps.push({
      gap: 'Placeholder content in modules',
      pages: modulesWithPlaceholders.map(m => m.title),
      recommendation: 'Review and replace placeholder text with real content',
    });
  }

  const modulesNoNav = report.pages.filter(
    p => p.type === 'module' && p.warnings?.some(w => w.includes('navigation'))
  );
  if (modulesNoNav.length > 0) {
    console.log('\n~  MODULES MISSING NAVIGATION LINKS:');
    for (const m of modulesNoNav) console.log(`   - ${m.title}`);
    report.contentGaps.push({
      gap: 'Missing navigation links',
      pages: modulesNoNav.map(m => m.title),
      recommendation: 'Add "Next: [Quiz/Module] →" links at the bottom of each module',
    });
  }

  const quizzesNeedingFormVerification = report.pages.filter(
    p => (p.type === 'quiz' || p.type === 'exam') && p.warnings?.some(w => w.includes('spreadsheet'))
  );
  if (quizzesNeedingFormVerification.length > 0) {
    console.log('\n~  QUIZZES NEEDING MANUAL RESULT-TRACKING VERIFICATION:');
    for (const q of quizzesNeedingFormVerification) console.log(`   - ${q.title}`);
    console.log('   → Log into Microsoft Forms, open each form,');
    console.log('     click "Open in Excel" or "Responses" → "Open in Excel" to confirm tracking is set up.');
    report.contentGaps.push({
      gap: 'Quiz result tracking not confirmed',
      pages: quizzesNeedingFormVerification.map(q => q.title),
      recommendation: 'Verify each Form has "Send results to spreadsheet" enabled. Check in Microsoft Forms > Responses > Open in Excel.',
    });
  }

  // Save report
  const reportPath = path.join(__dirname, 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\nFull report saved to: audit_report.json`);

  await browser.close();
  log('Audit complete.');
})();
