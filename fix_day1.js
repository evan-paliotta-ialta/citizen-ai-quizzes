const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.helm.json');
const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';

(async () => {
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

  const day1 = pages.find(p => p.Title === "Day 1 Quick Start — You've Earned Your License");
  if (!day1) { console.log('Day 1 page not found'); await browser.close(); return; }
  log(`Found: "${day1.Title}" (id ${day1.Id})`);

  const canvas = JSON.parse(day1.CanvasContent1);
  const block = canvas[0];
  let html = block.innerHTML;

  const replacements = [
    // Step 1: SCIM-appropriate rewrite, no invite-wait, no "Teams plan"
    [
      /<h2>Step 1: Open Claude Desktop<\/h2>\s*<p>If you do not have Claude Desktop installed yet:<\/p>\s*<ul>\s*<li>Download from <strong>claude\.ai\/download<\/strong><\/li>\s*<li>Log in with your company email \(this puts you on the Teams plan with the program's guardrails\)<\/li>\s*<li>Confirm: the top of the app should show <strong>"Claude Teams"<\/strong><\/li>\s*<\/ul>\s*<p>If you are using Claude\.ai in a browser or the mobile app instead — stop\. Those do not have the program's safety controls\. All company work runs through Claude Desktop\. This is a program requirement, not a preference\.<\/p>/,
      `<h2>Step 1: Sign In</h2>
<p>Your account is provisioned automatically through Microsoft Entra once you pass the Final Exam — there is nothing to request and no invite email will arrive (that is normal with enterprise provisioning, not a problem).</p>
<ul>
  <li>Go to <strong>claude.ai</strong> and click <strong>"Continue with SSO"</strong>, or open the Claude Desktop app (download from <strong>claude.ai/download</strong> if you don't have it) and sign in with your @helmmarkets.com email</li>
  <li>Complete the Microsoft login — you'll land in the <strong>Helm Markets</strong> organization</li>
  <li>Confirm: the top of the app should show <strong>"Helm Markets"</strong> as your organization</li>
</ul>
<p>Claude Desktop and claude.ai in a browser are the same account with the same guardrails — use whichever is more convenient. If after an hour you sign in and don't see "Helm Markets," contact the program administrator.</p>`
    ],
    [/Claude Teams/g, 'Claude Enterprise'],
    [/iAltA/g, 'Helm'],
    [/github\.com\/ialta/gi, '[GitHub org — confirm with program lead]'],
    [/your\.name@Helm\.com/gi, 'your.name@helmmarkets.com'], // in case iAltA->Helm replace already hit the email domain
    [/owner:\s*"your\.name@ialta\.com"/gi, 'owner: "your.name@helmmarkets.com"'],
  ];

  let changedCount = 0;
  for (const [pattern, replacement] of replacements) {
    const before = html;
    html = html.replace(pattern, replacement);
    if (html !== before) changedCount++;
  }
  log(`Patterns matched: ${changedCount}/${replacements.length}`);

  block.innerHTML = html;

  const result = await tab.evaluate(async ({ siteUrl, pageId, canvas }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;
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
    if (!saveRes.ok) return { status: `save_failed_${saveRes.status}` };
    const pubRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    return { status: pubRes.ok ? 'published' : `publish_error_${pubRes.status}` };
  }, { siteUrl: SITE_URL, pageId: day1.Id, canvas });

  log(`Result: ${JSON.stringify(result)}`);
  await browser.close();
})();
