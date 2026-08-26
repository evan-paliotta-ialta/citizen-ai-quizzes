/**
 * sync_course_progress.js
 *
 * Computes each roster citizen's course progress from the 17 Microsoft Forms
 * (16 module quizzes + Final Exam, Helm tenant) and upserts one row per person
 * into the "Course Progress" SharePoint list, so the course Home page can show
 * each citizen where to resume — without anyone being able to see anyone else's row.
 *
 * Security model: the list itself is locked to the site Owners group only
 * (no baseline Member/Visitor access). Each citizen's row additionally gets
 * its own broken-inheritance permission grant: Read for that citizen's SharePoint
 * principal + Full Control for Owners. A view filter is NOT what protects this data
 * — item-level permissions are. See project memory for why a filter alone is
 * insufficient (view filters don't survive a raw REST call, a different view,
 * or an export).
 *
 * Because the list rows are written by this script (running as the site owner),
 * SharePoint's native "read items created by the user" item-level setting can't
 * be used — Created By would be the owner, not the citizen. Permissions are
 * therefore granted explicitly per row instead of relying on that setting.
 *
 * Run: node sync_course_progress.js [--dry-run]
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.helm.json');
const SITE_URL = 'https://helmmarkets.sharepoint.com/sites/citizenai';
const LIST_TITLE = 'Course Progress';
const OWNERS_GROUP_ID = 3;
const ROLE_READ = 1073741826;
const ROLE_FULL_CONTROL = 1073741829;
const DRY_RUN = process.argv.includes('--dry-run');

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

// Same 17 forms + answer keys as citizen-ai-check.md / bulk_check_all_forms.js.
// Keep these three in sync manually if the forms ever change — no shared source yet.
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
  { module: 13, id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNUVEUzVFSU9CQ01XRURVNUtTSTAwMlNEOS4u", correct: ["B","B","B","B","B","B","C"], perfectRequired: true },
  { module: 14, id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UQzQ1Q00xOEhNUzc4RlI5Wk0yRDFMUldCSy4u", correct: ["B","B","B","B"] },
  { module: 15, id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UMzFHTEI1TFZPODhWWVA1M01JUU40U1dSUC4u", correct: ["B","B","C","B"] },
  { module: 16, id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNUNKQkczMVFPV0dDTEoxOEMySjg2NlZIWS4u", correct: ["B","B","C","B"] },
  { module: "F", id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNjEwOUNPQzJYUk1DOFVGTDFWU0cxQUdFSC4u",
    correct: ["B","B","C","B","C","C","B","B","C","B","C","B","B","D","B","B","B","B","B","B","B","B","B","B","B"], passThreshold: 20 },
];

function scoreResponse(response, correctLetters) {
  const answers = JSON.parse(response.answers);
  let score = 0;
  answers.forEach((a, i) => {
    if ((a.answer1 || '').trim().charAt(0) === correctLetters[i]) score++;
  });
  return score;
}

// Fields keyed on SharePoint's ACTUAL EntityPropertyName (verified live, not assumed —
// createfieldasxml derived several internal names from DisplayName, e.g. "Resume At" ->
// "Resume_x0020_At", ignoring the clean Name= attribute this list was created with).
function moduleFieldName(m) { return `Module_x0020_${m}`; }
const FIELD = {
  team: 'Team',
  email: 'Citizen_x0020_Email',
  finalExamDate: 'Final_x0020_Exam_x0020_Date',
  finalExamScore: 'Final_x0020_Exam_x0020_Score',
  resumeAt: 'Resume_x0020_At',
  notes: 'Notes',
  lastSynced: 'Last_x0020_Synced',
};

function computeResume(modules, final) {
  for (let m = 1; m <= 16; m++) {
    if (!modules[m]) return `Module ${m}`;
  }
  if (!final) return 'Final Exam';
  return final.score >= 20 ? 'Course Complete' : 'Retake Final Exam';
}

function buildNotes(modules) {
  const notes = [];
  const m13 = modules[13];
  if (m13 && m13.score < m13.max) notes.push(`Module 13 not yet perfect (${m13.score}/${m13.max}) — required before a license can be issued`);
  return notes.join('; ');
}

function normLastName(fullName) {
  return fullName.trim().split(/\s+/).pop().replace(/[^a-zA-Z]/g, '').toLowerCase();
}

async function digestFn(page) {
  return page.evaluate(async (siteUrl) => {
    const r = await fetch(`${siteUrl}/_api/contextinfo`, { method: 'POST', headers: { Accept: 'application/json;odata=nometadata' } });
    return (await r.json()).FormDigestValue;
  }, SITE_URL);
}

async function main() {
  const roster = JSON.parse(fs.readFileSync(path.join(__dirname, 'citizen_roster.json'), 'utf8'));

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const page = await ctx.newPage();

  // ─── 1. Pull and score all 17 forms ───────────────────────────────────────
  // Note: the bare forms.office.com root is a marketing shell that redirects to
  // forms.cloud.microsoft and never populates window.OfficeFormServerInfo. Only the
  // actual designer app path does, and it needs a moment to hydrate after navigation.
  await page.goto('https://forms.office.com/Pages/DesignPageV2.aspx', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => !!(window.OfficeFormServerInfo && window.OfficeFormServerInfo.antiForgeryToken), { timeout: 30000 });
  const authInfo = await page.evaluate(() => {
    const info = window.OfficeFormServerInfo;
    const userInfo = typeof info.userInfo === 'string' ? JSON.parse(info.userInfo) : info.userInfo;
    return { token: info.antiForgeryToken, tenantId: userInfo.TenantId, userId: userInfo.UserId };
  });

  // email(lowercase) -> { modules: { [n]: {score,max,date} }, final: {score,max,date} | null }
  const byEmail = {};

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
      const rec = { score, max: form.correct.length, date: latest.submitDate };
      byEmail[email] = byEmail[email] || { modules: {}, final: null };
      if (form.module === 'F') byEmail[email].final = rec;
      else byEmail[email].modules[form.module] = rec;
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
  if (unresolved.length) log(`SKIPPING (no SharePoint identity yet — never visited the site, can't safely grant permissions without guessing an email): ${unresolved.join(', ')}`);
  log(`Resolved ${resolved.length}/${roster.length} roster citizens to live SharePoint identities.`);

  // ─── 3. Get/create the Course Progress list, fetch existing rows ──────────
  const listMeta = await page.evaluate(async (siteUrl) => {
    const res = await fetch(`${siteUrl}/_api/web/lists/getbytitle('Course Progress')?$select=Id`, { headers: { Accept: 'application/json;odata=nometadata' } });
    if (!res.ok) return null;
    return await res.json();
  }, SITE_URL);
  if (!listMeta) { log('FATAL: "Course Progress" list not found. Run the list/field setup first.'); await browser.close(); process.exit(1); }
  const listId = listMeta.Id;

  const existingItems = await page.evaluate(async ({ siteUrl, listId, emailField }) => {
    const res = await fetch(`${siteUrl}/_api/web/lists('${listId}')/items?$select=Id,${emailField}&$top=500`, { headers: { Accept: 'application/json;odata=nometadata' } });
    return (await res.json()).value;
  }, { siteUrl: SITE_URL, listId, emailField: FIELD.email });
  const existingByEmail = {};
  for (const it of existingItems) existingByEmail[(it[FIELD.email] || '').toLowerCase()] = it.Id;
  log(`Existing rows in Course Progress: ${existingItems.length}`);

  // ─── 4. Compute + upsert each resolved citizen's row ───────────────────────
  const nowIso = new Date().toISOString();
  const results = { created: 0, updated: 0, permissionsFixed: 0, permissionsAlreadyOk: 0, errors: [] };

  for (const citizen of resolved) {
    const data = byEmail[citizen.email] || { modules: {}, final: null };
    const resumeAt = computeResume(data.modules, data.final);
    const notes = buildNotes(data.modules);

    const fields = { __metadata: { type: 'SP.ListItem' }, Title: citizen.siteName, [FIELD.team]: citizen.team, [FIELD.email]: citizen.email, [FIELD.resumeAt]: resumeAt, [FIELD.notes]: notes, [FIELD.lastSynced]: nowIso };
    for (let m = 1; m <= 16; m++) {
      fields[`Module_x0020_${m}_x0020_Done`] = !!data.modules[m];
      if (data.modules[m]) fields[moduleFieldName(m)] = data.modules[m].date;
    }
    fields['Final_x0020_Exam_x0020_Done'] = !!data.final;
    if (data.final) { fields[FIELD.finalExamDate] = data.final.date; fields[FIELD.finalExamScore] = data.final.score; }

    if (DRY_RUN) { log(`[dry-run] ${citizen.name}: resume="${resumeAt}"${notes ? ' note="'+notes+'"' : ''}`); continue; }

    try {
      const existingId = existingByEmail[citizen.email];
      let itemId;
      if (existingId) {
        const d = await digestFn(page);
        const upd = await page.evaluate(async ({ siteUrl, listId, itemId, fields, digest }) => {
          const res = await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})`, {
            method: 'POST',
            headers: { Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*' },
            body: JSON.stringify(fields),
          });
          return res.ok || res.status === 204;
        }, { siteUrl: SITE_URL, listId, itemId: existingId, fields, digest: d });
        if (!upd) throw new Error(`update failed for item ${existingId}`);
        itemId = existingId;
        results.updated++;
      } else {
        const d = await digestFn(page);
        const created = await page.evaluate(async ({ siteUrl, listId, fields, digest }) => {
          const res = await fetch(`${siteUrl}/_api/web/lists('${listId}')/items`, {
            method: 'POST',
            headers: { Accept: 'application/json;odata=nometadata', 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': digest },
            body: JSON.stringify(fields),
          });
          if (!res.ok) return { error: await res.text() };
          return await res.json();
        }, { siteUrl: SITE_URL, listId, fields, digest: d });
        if (created.error) throw new Error(`create failed: ${created.error.slice(0, 200)}`);
        itemId = created.Id;
        results.created++;
      }

      // ─── Permission check/lock — the actual security boundary ───────────
      const permState = await page.evaluate(async ({ siteUrl, listId, itemId }) => {
        const r = await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})?$select=HasUniqueRoleAssignments`, { headers: { Accept: 'application/json;odata=nometadata' } });
        const hasUnique = (await r.json()).HasUniqueRoleAssignments;
        if (!hasUnique) return { hasUnique: false, principals: [] };
        const ra = await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})/roleassignments?$expand=Member`, { headers: { Accept: 'application/json;odata=nometadata' } });
        return { hasUnique: true, principals: (await ra.json()).value.map(x => x.Member.Id) };
      }, { siteUrl: SITE_URL, listId, itemId });

      const correctlyLocked = permState.hasUnique
        && permState.principals.includes(citizen.principalId)
        && permState.principals.includes(OWNERS_GROUP_ID)
        && permState.principals.every(id => id === citizen.principalId || id === OWNERS_GROUP_ID || id === 10); // 10 = Evan, auto-added by SharePoint as the acting user on some break calls

      if (correctlyLocked) {
        results.permissionsAlreadyOk++;
      } else {
        let d = await digestFn(page);
        await page.evaluate(async ({ siteUrl, listId, itemId, digest }) => {
          await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})/breakroleinheritance(copyRoleAssignments=false,clearSubscopes=true)`, {
            method: 'POST', headers: { Accept: 'application/json;odata=nometadata', 'X-RequestDigest': digest },
          });
        }, { siteUrl: SITE_URL, listId, itemId, digest: d });

        d = await digestFn(page);
        await page.evaluate(async ({ siteUrl, listId, itemId, principalId, roleId, digest }) => {
          await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})/roleassignments/addroleassignment(principalid=${principalId},roledefid=${roleId})`, {
            method: 'POST', headers: { Accept: 'application/json;odata=nometadata', 'X-RequestDigest': digest },
          });
        }, { siteUrl: SITE_URL, listId, itemId, principalId: citizen.principalId, roleId: ROLE_READ, digest: d });

        d = await digestFn(page);
        await page.evaluate(async ({ siteUrl, listId, itemId, principalId, roleId, digest }) => {
          await fetch(`${siteUrl}/_api/web/lists('${listId}')/items(${itemId})/roleassignments/addroleassignment(principalid=${principalId},roledefid=${roleId})`, {
            method: 'POST', headers: { Accept: 'application/json;odata=nometadata', 'X-RequestDigest': digest },
          });
        }, { siteUrl: SITE_URL, listId, itemId, principalId: OWNERS_GROUP_ID, roleId: ROLE_FULL_CONTROL, digest: d });

        results.permissionsFixed++;
      }

      log(`${citizen.name} (${citizen.team}): resume="${resumeAt}" [item ${itemId}, ${existingId ? 'updated' : 'created'}, perms ${correctlyLocked ? 'ok' : 'fixed'}]`);
    } catch (e) {
      results.errors.push(`${citizen.name}: ${e.message}`);
      log(`ERROR on ${citizen.name}: ${e.message}`);
    }
  }

  log('');
  log('═══ SYNC COMPLETE ═══');
  log(`Created: ${results.created}  Updated: ${results.updated}`);
  log(`Permissions already correct: ${results.permissionsAlreadyOk}  Fixed this run: ${results.permissionsFixed}`);
  log(`Skipped (no SharePoint identity): ${unresolved.length}${unresolved.length ? ' -> ' + unresolved.join(', ') : ''}`);
  log(`Errors: ${results.errors.length}${results.errors.length ? ' -> ' + results.errors.join(' | ') : ''}`);

  await browser.close();
  // A per-citizen error was caught and logged above but must not be swallowed here —
  // the cron wrapper's retry/healthcheck logic keys off this process's exit code, not
  // the log prose (a real run silently reported success with a citizen's row left
  // unfixed until this was added, 2026-08-18).
  if (results.errors.length > 0) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1); });
