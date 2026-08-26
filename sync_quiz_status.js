/**
 * sync_quiz_status.js
 *
 * Companion to sync_course_progress.js, but explodes the data into one row per
 * citizen PER MODULE (17 rows each: 16 module quizzes + Final Exam) instead of
 * one summary row per citizen. Backs the "Your Quiz Status" pill strip on the
 * Home page — lets someone who jumped around modules see exactly which quizzes
 * they've done, not just a single "resume here" guess.
 *
 * Security model is identical to sync_course_progress.js: the "Quiz Status" list
 * is locked to Owners-only at the base, and every row gets its own broken-inheritance
 * grant (Read for that citizen, Full Control for Owners). Folder-per-citizen
 * permission inheritance was tried and abandoned — AddValidateUpdateItemUsingPath
 * rejected the folder path on this list ("Invalid URL value") — so this locks
 * each of the ~300 rows individually, same proven mechanism as before, just at
 * 17x the row count. A single SharePoint form digest is reused across the whole
 * run (refreshed on a 403) instead of re-fetched per call, since that's what
 * keeps ~300 rows x ~4 calls/row from being needlessly slow.
 *
 * "Completed" means "at least one attempt is on record" for every module,
 * including Module 13 and the Final Exam — this answers "did I do this quiz,"
 * not "did I pass it." Pass/fail nuance (Module 13 needs 7/7, Final Exam needs
 * 20/25) stays the separate job of /citizen-ai-check for license readiness.
 *
 * Run: node sync_quiz_status.js [--dry-run]
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.helm.json');
const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';
const LIST_TITLE = 'Quiz Status';
const OWNERS_GROUP_ID = 3;
const ROLE_READ = 1073741826;
const ROLE_FULL_CONTROL = 1073741829;
const EVAN_PRINCIPAL_ID = 10; // auto-added by SharePoint whenever inheritance is broken
const DRY_RUN = process.argv.includes('--dry-run');

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

// Same 17 forms + answer keys as sync_course_progress.js / citizen-ai-check.md.
const FORMS = [
  { module: 1,  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UMFpCVEwzWkE3NjVXWU41RkJFT0lHTzRTVC4u", correct: ["B","C","B","C"] },
  { module: 2,  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1URDJZV01JVjlQMDJKMjYzMlZVM0xCSFlDNS4u", correct: ["B","B","B","C"] },
  { module: 3,  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNk1TTVRFQjVVTldYRU1YVjVXWTVWQ1ZCMy4u", correct: ["C","B","C","B"] },
  { module: 4,  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UQ0IyVzRCRVVYSjVSNU41RDhGMzFLTThNTi4u", correct: ["C","B","D","B"] },
  { module: 5,  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UOUdTOEw0TThQTDNRVkdWRU9RNUtEU1NEWi4u", correct: ["C","B","C","B"] },
  { module: 6,  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UOTNaMlQ2VllGUEZHNzM0VTRNUDlCQzQyQi4u", correct: ["C","B","C","B"] },
  { module: 7,  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UN1BZMEFMOElGR0VEWDZGSk1PQzVOUUdWNC4u", correct: ["C","C","B","B"] },
  { module: 8,  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNTZNWlZSNUVFUk9VUUE1OFhHWUxNWlZXMi4u", correct: ["B","B","B","B"] },
  { module: 9,  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UQUFTSVNPWlJMVDhPSktPMzhMRkxIWEdSMi4u", correct: ["B","C","C","B"] },
  { module: 10, id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNDRDSlczN05DVzRVSFcwRDFZR1ZJMlJaUC4u", correct: ["B","C","B","B"] },
  { module: 11, id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UMzVaVkRHVFNXTjBLR0kwVUtWWlVBU0lUVC4u", correct: ["C","B","B","C"] },
  { module: 12, id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UMlFMWElIOVE2NFlORzROMFJFT01RQVRIMS4u", correct: ["C","C","B","A"] },
  { module: 13, id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNUVEUzVFSU9CQ01XRURVNUtTSTAwMlNEOS4u", correct: ["B","B","B","B","B","B","C"] },
  { module: 14, id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UQzQ1Q00xOEhNUzc4RlI5Wk0yRDFMUldCSy4u", correct: ["B","B","B","B"] },
  { module: 15, id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UMzFHTEI1TFZPODhWWVA1M01JUU40U1dSUC4u", correct: ["B","B","C","B"] },
  { module: 16, id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNUNKQkczMVFPV0dDTEoxOEMySjg2NlZIWS4u", correct: ["B","B","C","B"] },
  { module: "F", id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNjEwOUNPQzJYUk1DOFVGTDFWU0cxQUdFSC4u",
    correct: ["B","B","C","B","C","C","B","B","C","B","C","B","B","D","B","B","B","B","B","B","B","B","B","B","B"] },
];

function scoreResponse(response, correctLetters) {
  const answers = JSON.parse(response.answers);
  let score = 0;
  answers.forEach((a, i) => {
    if ((a.answer1 || '').trim().charAt(0) === correctLetters[i]) score++;
  });
  return score;
}

const FIELD = {
  email: 'Citizen_x0020_Email',
  order: 'Module_x0020_Order',
  label: 'Module_x0020_Label',
  title: 'Module_x0020_Title',
  completed: 'Completed',
  completedDate: 'Completed_x0020_Date',
  score: 'Score',
};

function normLastName(fullName) {
  return fullName.trim().split(/\s+/).pop().replace(/[^a-zA-Z]/g, '').toLowerCase();
}

function slots() {
  const s = [];
  for (let m = 1; m <= 16; m++) s.push({ order: m, label: String(m), title: `Module ${m}` });
  s.push({ order: 17, label: 'F', title: 'Final Exam' });
  return s;
}

// Digest reused across the whole run; refreshed lazily on a 403 rather than per-call.
function makeDigestManager(page) {
  let cached = null;
  async function fetchFresh() {
    cached = await page.evaluate(async (siteUrl) => {
      const r = await fetch(`${siteUrl}/_api/contextinfo`, { method: 'POST', headers: { Accept: 'application/json;odata=nometadata' } });
      return (await r.json()).FormDigestValue;
    }, SITE_URL);
    return cached;
  }
  return {
    async get() { return cached || (await fetchFresh()); },
    async refresh() { return fetchFresh(); },
  };
}

async function spCall(page, digestMgr, fn, args) {
  let digest = await digestMgr.get();
  let result = await page.evaluate(fn, { ...args, siteUrl: SITE_URL, digest });
  if (result && result.status === 403) {
    digest = await digestMgr.refresh();
    result = await page.evaluate(fn, { ...args, siteUrl: SITE_URL, digest });
  }
  return result;
}

async function main() {
  const roster = JSON.parse(fs.readFileSync(path.join(__dirname, 'citizen_roster.json'), 'utf8'));

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const page = await ctx.newPage();

  // ─── 1. Pull and score all 17 forms ───────────────────────────────────────
  await page.goto('https://forms.office.com/Pages/DesignPageV2.aspx', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => !!(window.OfficeFormServerInfo && window.OfficeFormServerInfo.antiForgeryToken), { timeout: 30000 });
  const authInfo = await page.evaluate(() => {
    const info = window.OfficeFormServerInfo;
    const userInfo = typeof info.userInfo === 'string' ? JSON.parse(info.userInfo) : info.userInfo;
    return { token: info.antiForgeryToken, tenantId: userInfo.TenantId, userId: userInfo.UserId };
  });

  const byEmail = {}; // email(lowercase) -> { [moduleKeyOrF]: {score,max,date} }
  for (const form of FORMS) {
    const responses = await page.evaluate(async ({ token, tenantId, userId, formId }) => {
      const res = await fetch(`/formapi/api/${tenantId}/users/${userId}/forms('${formId}')/responses`, {
        headers: { Accept: 'application/json', '__RequestVerificationToken': token },
      });
      if (!res.ok) return { error: res.status };
      return { value: (await res.json()).value };
    }, { ...authInfo, formId: form.id });

    if (responses.error) { log(`WARN: form ${form.module} fetch failed (${responses.error})`); continue; }

    const byResponder = {};
    for (const r of responses.value) {
      const key = (r.responder || '').toLowerCase();
      if (!key) continue;
      (byResponder[key] = byResponder[key] || []).push(r);
    }
    for (const [email, resps] of Object.entries(byResponder)) {
      resps.sort((a, b) => new Date(a.submitDate) - new Date(b.submitDate));
      const latest = resps[resps.length - 1];
      const score = scoreResponse(latest, form.correct);
      byEmail[email] = byEmail[email] || {};
      byEmail[email][form.module] = { score, max: form.correct.length, date: latest.submitDate };
    }
  }
  log(`Pulled ${FORMS.length} forms, ${Object.keys(byEmail).length} distinct responder emails.`);

  // ─── 2. Resolve roster names -> live SharePoint identities ────────────────
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const siteUsers = await page.evaluate(async (siteUrl) => {
    const res = await fetch(`${siteUrl}/_api/web/siteusers?$select=Id,Title,Email,PrincipalType&$top=200`, { headers: { Accept: 'application/json;odata=nometadata' } });
    return (await res.json()).value.filter(u => u.PrincipalType === 1 && u.Email);
  }, SITE_URL);

  const resolved = [];
  const unresolved = [];
  for (const citizen of roster) {
    const wanted = normLastName(citizen.name);
    const match = siteUsers.find(u => normLastName(u.Title) === wanted);
    if (match) resolved.push({ ...citizen, email: match.Email.toLowerCase(), principalId: match.Id, siteName: match.Title });
    else unresolved.push(citizen.name);
  }
  if (unresolved.length) log(`SKIPPING (no SharePoint identity yet): ${unresolved.join(', ')}`);
  log(`Resolved ${resolved.length}/${roster.length} roster citizens.`);

  // ─── 3. Get the Quiz Status list, fetch existing rows ─────────────────────
  const listMeta = await page.evaluate(async ({ siteUrl, listTitle }) => {
    const res = await fetch(`${siteUrl}/_api/web/lists/getbytitle('${listTitle}')?$select=Id`, { headers: { Accept: 'application/json;odata=nometadata' } });
    if (!res.ok) return null;
    return await res.json();
  }, { siteUrl: SITE_URL, listTitle: LIST_TITLE });
  if (!listMeta) { log(`FATAL: "${LIST_TITLE}" list not found.`); await browser.close(); process.exit(1); }
  const listId = listMeta.Id;

  const existingItems = await page.evaluate(async ({ siteUrl, listId, emailField, orderField }) => {
    const res = await fetch(`${siteUrl}/_api/web/lists('${listId}')/items?$select=Id,${emailField},${orderField}&$top=1000`, { headers: { Accept: 'application/json;odata=nometadata' } });
    return (await res.json()).value;
  }, { siteUrl: SITE_URL, listId, emailField: FIELD.email, orderField: FIELD.order });
  const existingByKey = {};
  for (const it of existingItems) existingByKey[`${(it[FIELD.email] || '').toLowerCase()}::${it[FIELD.order]}`] = it.Id;
  log(`Existing rows in ${LIST_TITLE}: ${existingItems.length}`);

  // ─── 4. Compute + upsert each resolved citizen's 17 rows ──────────────────
  const digestMgr = makeDigestManager(page);
  const results = { created: 0, updated: 0, permissionsFixed: 0, permissionsAlreadyOk: 0, errors: [] };
  const MODULE_SLOTS = slots();

  for (const citizen of resolved) {
    const data = byEmail[citizen.email] || {};
    let personCreated = 0, personUpdated = 0, personFixed = 0, personOk = 0;

    for (const slot of MODULE_SLOTS) {
      const rec = data[slot.order <= 16 ? slot.order : 'F'];
      const completed = !!rec;
      const fields = {
        __metadata: { type: 'SP.ListItem' },
        Title: citizen.siteName,
        [FIELD.email]: citizen.email,
        [FIELD.order]: slot.order,
        [FIELD.label]: slot.label,
        [FIELD.title]: slot.title,
        [FIELD.completed]: completed,
      };
      if (rec) { fields[FIELD.completedDate] = rec.date; fields[FIELD.score] = `${rec.score}/${rec.max}`; }

      if (DRY_RUN) continue;

      try {
        const key = `${citizen.email}::${slot.order}`;
        const existingId = existingByKey[key];
        let itemId;
        if (existingId) {
          const upd = await spCall(page, digestMgr, async ({ siteUrl, listId, itemId, fields, digest }) => {
            const res = await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})`, {
              method: 'POST',
              headers: { Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*' },
              body: JSON.stringify(fields),
            });
            return { status: res.status, ok: res.ok || res.status === 204 };
          }, { listId, itemId: existingId, fields });
          if (!upd.ok) throw new Error(`update failed for item ${existingId}: ${upd.status}`);
          itemId = existingId;
          personUpdated++;
        } else {
          const created = await spCall(page, digestMgr, async ({ siteUrl, listId, fields, digest }) => {
            const res = await fetch(`${siteUrl}/_api/web/lists('${listId}')/items`, {
              method: 'POST',
              headers: { Accept: 'application/json;odata=nometadata', 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': digest },
              body: JSON.stringify(fields),
            });
            if (!res.ok) return { status: res.status, error: await res.text() };
            const body = await res.json();
            return { status: res.status, Id: body.Id };
          }, { listId, fields });
          if (created.error) throw new Error(`create failed (${created.status}): ${created.error.slice(0, 200)}`);
          itemId = created.Id;
          personCreated++;
        }

        const permState = await spCall(page, digestMgr, async ({ siteUrl, listId, itemId }) => {
          const r = await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})?$select=HasUniqueRoleAssignments`, { headers: { Accept: 'application/json;odata=nometadata' } });
          const hasUnique = (await r.json()).HasUniqueRoleAssignments;
          if (!hasUnique) return { hasUnique: false, principals: [] };
          const ra = await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})/roleassignments?$expand=Member`, { headers: { Accept: 'application/json;odata=nometadata' } });
          return { hasUnique: true, principals: (await ra.json()).value.map(x => x.Member.Id) };
        }, { listId, itemId });

        const correctlyLocked = permState.hasUnique
          && permState.principals.includes(citizen.principalId)
          && permState.principals.includes(OWNERS_GROUP_ID)
          && permState.principals.every(id => id === citizen.principalId || id === OWNERS_GROUP_ID || id === EVAN_PRINCIPAL_ID);

        if (correctlyLocked) {
          personOk++;
        } else {
          await spCall(page, digestMgr, async ({ siteUrl, listId, itemId, digest }) => {
            await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})/breakroleinheritance(copyRoleAssignments=false,clearSubscopes=true)`, {
              method: 'POST', headers: { Accept: 'application/json;odata=nometadata', 'X-RequestDigest': digest },
            });
            return { status: 200 };
          }, { listId, itemId });

          await spCall(page, digestMgr, async ({ siteUrl, listId, itemId, principalId, digest }) => {
            await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})/roleassignments/addroleassignment(principalid=${principalId},roledefid=1073741826)`, {
              method: 'POST', headers: { Accept: 'application/json;odata=nometadata', 'X-RequestDigest': digest },
            });
            return { status: 200 };
          }, { listId, itemId, principalId: citizen.principalId });

          await spCall(page, digestMgr, async ({ siteUrl, listId, itemId, principalId, digest }) => {
            await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})/roleassignments/addroleassignment(principalid=${principalId},roledefid=1073741829)`, {
              method: 'POST', headers: { Accept: 'application/json;odata=nometadata', 'X-RequestDigest': digest },
            });
            return { status: 200 };
          }, { listId, itemId, principalId: OWNERS_GROUP_ID });

          personFixed++;
        }
      } catch (e) {
        results.errors.push(`${citizen.name} / Module ${slot.label}: ${e.message}`);
      }
    }

    results.created += personCreated; results.updated += personUpdated;
    results.permissionsFixed += personFixed; results.permissionsAlreadyOk += personOk;
    log(`${citizen.name} (${citizen.team}): ${personCreated} created, ${personUpdated} updated, perms ${personOk} ok / ${personFixed} fixed`);
  }

  log('');
  log('═══ SYNC COMPLETE ═══');
  log(`Created: ${results.created}  Updated: ${results.updated}`);
  log(`Permissions already correct: ${results.permissionsAlreadyOk}  Fixed this run: ${results.permissionsFixed}`);
  log(`Skipped citizens (no SharePoint identity): ${unresolved.length}${unresolved.length ? ' -> ' + unresolved.join(', ') : ''}`);
  log(`Errors: ${results.errors.length}${results.errors.length ? '\n  - ' + results.errors.join('\n  - ') : ''}`);

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
