/**
 * fix_quiz_submissions.js
 *
 * 1. Creates a SharePoint list "Quiz Completions" with fields:
 *    - Title → relabeled to "Your Full Name" (built-in)
 *    - Module (Choice: Module 1 – Module 15)
 *    - Team (Text)
 *    - Key Takeaway (Note — one thing learned from this module)
 *
 * 2. Updates all 16 module quiz pages to link to the new list form
 *    instead of the empty "Untitled quiz" Microsoft Forms.
 *
 * Run: node fix_quiz_submissions.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

// ─── Step 1: Create the "Quiz Completions" list ───────────────────────────────
async function createQuizList(page) {
  log('Creating Quiz Completions list...');

  const result = await page.evaluate(async (siteUrl) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    // Check if list already exists
    const checkRes = await fetch(
      `${siteUrl}/_api/web/lists/getbytitle('Quiz Completions')`,
      { headers: { Accept: 'application/json;odata=verbose' } }
    );
    if (checkRes.ok) {
      const existing = await checkRes.json();
      return { status: 'already_exists', listId: existing.d.Id };
    }

    // Create the list
    const createRes = await fetch(`${siteUrl}/_api/web/lists`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      },
      body: JSON.stringify({
        __metadata: { type: 'SP.List' },
        Title: 'Quiz Completions',
        BaseTemplate: 100, // Generic list
        Description: 'Citizen AI Engineer Program — module quiz completion records',
      }),
    });
    if (!createRes.ok) {
      const errText = await createRes.text();
      return { status: `create_failed_${createRes.status}`, error: errText.slice(0, 200) };
    }
    const created = await createRes.json();
    return { status: 'created', listId: created.d.Id };
  }, SITE_URL);

  log(`List result: ${JSON.stringify(result)}`);
  return result;
}

// ─── Step 2: Rename Title field and add custom fields ─────────────────────────
async function setupListFields(page, listId) {
  log(`Setting up fields for list ${listId}...`);

  const result = await page.evaluate(async ({ siteUrl, listId }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;
    const errors = [];
    const successes = [];

    // Rename the built-in Title field to "Your Full Name"
    const renameRes = await fetch(
      `${siteUrl}/_api/web/lists('${listId}')/fields/getbytitle('Title')`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          'X-HTTP-Method': 'MERGE',
          'IF-MATCH': '*',
        },
        body: JSON.stringify({
          __metadata: { type: 'SP.FieldText' },
          Title: 'Your Full Name',
        }),
      }
    );
    if (renameRes.ok) successes.push('Title renamed to "Your Full Name"');
    else errors.push(`Title rename failed: ${renameRes.status}`);

    // Add Module choice field
    const moduleXml = `<Field Type="Choice" DisplayName="Module" Required="TRUE" FillInChoice="FALSE" Name="Module">
      <CHOICES>
        <CHOICE>Module 0 — Why We Are Doing This</CHOICE>
        <CHOICE>Module 1 — What Is Claude?</CHOICE>
        <CHOICE>Module 2 — Driving Zones Framework</CHOICE>
        <CHOICE>Module 3 — Setting Up Claude Desktop</CHOICE>
        <CHOICE>Module 4 — Prompt Engineering Fundamentals</CHOICE>
        <CHOICE>Module 5 — Effective Communication with Claude</CHOICE>
        <CHOICE>Module 6 — Projects and Memory</CHOICE>
        <CHOICE>Module 7 — Advanced Prompting Techniques</CHOICE>
        <CHOICE>Module 8 — MCP Servers</CHOICE>
        <CHOICE>Module 9 — Claude Code</CHOICE>
        <CHOICE>Module 10 — Agentic Workflows</CHOICE>
        <CHOICE>Module 11 — Real-World Use Cases</CHOICE>
        <CHOICE>Module 12 — Building Your First Agent</CHOICE>
        <CHOICE>Module 13 — Safety and Responsible Use</CHOICE>
        <CHOICE>Module 14 — Measuring Impact and ROI</CHOICE>
        <CHOICE>Module 15 — GitHub and the ODL</CHOICE>
      </CHOICES>
    </Field>`;

    const modRes = await fetch(
      `${siteUrl}/_api/web/lists('${listId}')/fields/createfieldasxml`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
        body: JSON.stringify({ parameters: { __metadata: { type: 'SP.XmlSchemaFieldCreationInformation' }, SchemaXml: moduleXml } }),
      }
    );
    if (modRes.ok) successes.push('Module choice field created');
    else {
      const t = await modRes.text();
      // Check if already exists
      if (t.includes('already exists')) successes.push('Module field already exists');
      else errors.push(`Module field failed: ${modRes.status} ${t.slice(0, 150)}`);
    }

    // Add Team text field
    const teamXml = `<Field Type="Text" DisplayName="Team / Department" Required="TRUE" Name="Team_x002f_Department" />`;
    const teamRes = await fetch(
      `${siteUrl}/_api/web/lists('${listId}')/fields/createfieldasxml`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
        body: JSON.stringify({ parameters: { __metadata: { type: 'SP.XmlSchemaFieldCreationInformation' }, SchemaXml: teamXml } }),
      }
    );
    if (teamRes.ok) successes.push('Team field created');
    else {
      const t = await teamRes.text();
      if (t.includes('already exists')) successes.push('Team field already exists');
      else errors.push(`Team field failed: ${teamRes.status} ${t.slice(0, 150)}`);
    }

    // Add Key Takeaway note field
    const takeawayXml = `<Field Type="Note" DisplayName="Key Takeaway" Required="TRUE" NumLines="6" RichText="FALSE" Name="Key_x0020_Takeaway"><Default></Default></Field>`;
    const takeRes = await fetch(
      `${siteUrl}/_api/web/lists('${listId}')/fields/createfieldasxml`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
        body: JSON.stringify({ parameters: { __metadata: { type: 'SP.XmlSchemaFieldCreationInformation' }, SchemaXml: takeawayXml } }),
      }
    );
    if (takeRes.ok) successes.push('Key Takeaway field created');
    else {
      const t = await takeRes.text();
      if (t.includes('already exists')) successes.push('Key Takeaway field already exists');
      else errors.push(`Key Takeaway field failed: ${takeRes.status} ${t.slice(0, 150)}`);
    }

    return { successes, errors };
  }, { siteUrl: SITE_URL, listId });

  log(`Field setup: ${JSON.stringify(result)}`);
  return result;
}

// ─── Step 3: Get quiz page IDs and their current quiz link HTML ───────────────
async function getQuizPages(page) {
  log('Fetching all SharePoint pages to find quiz pages...');

  const result = await page.evaluate(async (siteUrl) => {
    const res = await fetch(
      `${siteUrl}/_api/sitepages/pages?$select=Id,Title,CanvasContent1&$top=100`,
      { headers: { Accept: 'application/json;odata=verbose' } }
    );
    const data = await res.json();
    return data.d.results.map(p => ({
      id: p.Id,
      title: p.Title,
      hasCanvas: !!p.CanvasContent1,
      hasFormsLink: (p.CanvasContent1 || '').includes('forms.office.com'),
    }));
  }, SITE_URL);

  const quizPages = result.filter(p => p.hasFormsLink);
  log(`Found ${quizPages.length} pages with forms.office.com links`);
  quizPages.forEach(p => log(`  - Page ${p.id}: ${p.title}`));
  return quizPages;
}

// ─── Step 4: Update a page to replace Forms link with SharePoint list link ────
async function updatePageQuizLink(page, pageId, listFormUrl) {
  const result = await page.evaluate(
    async ({ siteUrl, pageId, listFormUrl }) => {
      const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
      });
      const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

      // Fetch current canvas
      const pageRes = await fetch(
        `${siteUrl}/_api/sitepages/pages(${pageId})?$select=Id,Title,CanvasContent1`,
        { headers: { Accept: 'application/json;odata=verbose' } }
      );
      const pageData = await pageRes.json();
      let canvas;
      try { canvas = JSON.parse(pageData.d.CanvasContent1 || '[]'); }
      catch { return { status: 'parse_error' }; }

      // Replace forms.office.com href with the new list form URL in all blocks
      let changed = 0;
      for (const block of canvas) {
        if (block.innerHTML && block.innerHTML.includes('forms.office.com')) {
          block.innerHTML = block.innerHTML.replace(
            /href="https:\/\/forms\.office\.com\/[^"]+"/g,
            `href="${listFormUrl}"`
          );
          changed++;
        }
      }
      if (changed === 0) return { status: 'no_forms_link_found' };

      // Checkout → save → publish
      await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          'X-HTTP-Method': 'MERGE',
          'IF-MATCH': '*',
        },
        body: JSON.stringify({
          __metadata: { type: 'SP.Publishing.SitePage' },
          CanvasContent1: JSON.stringify(canvas),
        }),
      });
      if (!saveRes.ok) return { status: `save_failed_${saveRes.status}` };

      const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
        method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
      });

      return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}`, blocksChanged: changed };
    },
    { siteUrl: SITE_URL, pageId, listFormUrl }
  );
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: AUTH_PATH,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 1. Create list
  const listResult = await createQuizList(page);
  if (!listResult.listId) {
    log('FATAL: Could not create or find list. Exiting.');
    await browser.close();
    process.exit(1);
  }
  const listId = listResult.listId;
  log(`Using list ID: ${listId}`);

  // 2. Set up fields
  await setupListFields(page, listId);

  // 3. Build the submission URL
  const listFormUrl = `${SITE_URL}/Lists/Quiz%20Completions/NewForm.aspx`;
  log(`Quiz submission URL: ${listFormUrl}`);

  // 4. Find and update all quiz pages
  const quizPages = await getQuizPages(page);
  if (quizPages.length === 0) {
    log('No quiz pages found with forms.office.com links. Check if pages were already updated.');
  }

  let successCount = 0;
  for (const qp of quizPages) {
    log(`Updating page ${qp.id}: ${qp.title}...`);
    const res = await updatePageQuizLink(page, qp.id, listFormUrl);
    log(`  → ${JSON.stringify(res)}`);
    if (res.status === 'published') successCount++;
    await new Promise(r => setTimeout(r, 500)); // brief pause between API calls
  }

  log('');
  log(`═══ COMPLETE ═══`);
  log(`List created: ${listResult.status} (ID: ${listId})`);
  log(`Quiz pages updated: ${successCount} / ${quizPages.length}`);
  log(`Submit URL: ${listFormUrl}`);
  log('');
  log('Students will now see a proper SharePoint form asking for:');
  log('  • Their full name');
  log('  • Which module they completed (dropdown)');
  log('  • Their team / department');
  log('  • Their key takeaway from the module');

  await browser.close();
  log('Done.');
})();
