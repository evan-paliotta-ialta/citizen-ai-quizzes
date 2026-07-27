/**
 * bulk_check_all_forms.js
 *
 * Companion to /citizen-ai-check for checking the WHOLE cohort at once (50-70+ people)
 * instead of one participant at a time.
 *
 * Mechanism: fetch each of the 17 forms' full response list ONCE (17 API calls total,
 * regardless of how many people are enrolled), group by responder email, score every
 * response against the embedded answer key, and write one row per participant to a CSV.
 * This is the same formapi + scoring approach as /citizen-ai-check (quizResult is null,
 * so scoring is done by comparing each answer's letter against the correct-answer array),
 * just applied to everyone at once instead of a single name/email search.
 *
 * Run: node bulk_check_all_forms.js [--out=filename.csv]
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.helm.json');

const outArg = process.argv.find(a => a.startsWith('--out='));
const OUT_FILE = outArg ? outArg.split('=')[1] : 'cohort_progress_report.csv';

// Same 17 forms + answer keys as citizen-ai-check.md — keep these two in sync if forms change.
const FORMS = [
  { module: 1,  title: "Module 1",  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UMFpCVEwzWkE3NjVXWU41RkJFT0lHTzRTVC4u", correct: ["B","C","B","C"] },
  { module: 2,  title: "Module 2",  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1URDJZV01JVjlQMDJKMjYzMlZVM0xCSFlDNS4u", correct: ["B","B","B","C"] },
  { module: 3,  title: "Module 3",  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNk1TTVRFQjVVTldYRU1YVjVXWTVWQ1ZCMy4u", correct: ["C","B","C","B"] },
  { module: 4,  title: "Module 4",  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UQ0IyVzRCRVVYSjVSNU41RDhGMzFLTThNTi4u", correct: ["C","B","D","B"] },
  { module: 5,  title: "Module 5",  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UOUdTOEw0TThQTDNRVkdWRU9RNUtEU1NEWi4u", correct: ["C","B","C","B"] },
  { module: 6,  title: "Module 6",  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UOTNaMlQ2VllGUEZHNzM0VTRNUDlCQzQyQi4u", correct: ["C","B","C","B"] },
  { module: 7,  title: "Module 7",  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UN1BZMEFMOElGR0VEWDZGSk1PQzVOUUdWNC4u", correct: ["C","C","B","B"] },
  { module: 8,  title: "Module 8",  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNTZNWlZSNUVFUk9VUUE1OFhHWUxNWlZXMi4u", correct: ["B","B","B","B"] },
  { module: 9,  title: "Module 9",  id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UQUFTSVNPWlJMVDhPSktPMzhMRkxIWEdSMi4u", correct: ["B","C","C","B"] },
  { module: 10, title: "Module 10", id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNDRDSlczN05DVzRVSFcwRDFZR1ZJMlJaUC4u", correct: ["B","C","B","B"] },
  { module: 11, title: "Module 11", id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UMzVaVkRHVFNXTjBLR0kwVUtWWlVBU0lUVC4u", correct: ["C","B","B","C"] },
  { module: 12, title: "Module 12", id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UMlFMWElIOVE2NFlORzROMFJFT01RQVRIMS4u", correct: ["C","C","B","A"] },
  { module: 13, title: "Module 13", id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNUVEUzVFSU9CQ01XRURVNUtTSTAwMlNEOS4u", correct: ["B","B","B","B","B","B","C"], perfectRequired: true },
  { module: 14, title: "Module 14", id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UQzQ1Q00xOEhNUzc4RlI5Wk0yRDFMUldCSy4u", correct: ["B","B","B","B"] },
  { module: 15, title: "Module 15", id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UMzFHTEI1TFZPODhWWVA1M01JUU40U1dSUC4u", correct: ["B","B","C","B"] },
  { module: 16, title: "Module 16", id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNUNKQkczMVFPV0dDTEoxOEMySjg2NlZIWS4u", correct: ["B","B","C","B"] },
  { module: "F", title: "Final Exam", id: "BbL4chLj6UmUs98ziH7rxeYJblFG9RZPlKsTM_d41T1UNjEwOUNPQzJYUk1DOFVGTDFWU0cxQUdFSC4u",
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

function csvEscape(val) {
  const s = String(val ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 10 });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const tab = await ctx.newPage();
  await tab.goto('https://forms.office.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(15000);

  const authInfo = await tab.evaluate(() => {
    const info = window.OfficeFormServerInfo;
    const userInfo = typeof info.userInfo === 'string' ? JSON.parse(info.userInfo) : info.userInfo;
    return { token: info.antiForgeryToken, tenantId: userInfo.TenantId, userId: userInfo.UserId };
  });

  // cohort: email -> { name, modules: { [moduleKey]: { latest: {score,max,attempts,date}, perfectRequired } } }
  const cohort = {};

  for (const form of FORMS) {
    const responses = await tab.evaluate(async ({ token, tenantId, userId, formId }) => {
      const url = `/formapi/api/${tenantId}/users/${userId}/forms('${formId}')/responses`;
      const res = await fetch(url, { headers: { Accept: 'application/json', '__RequestVerificationToken': token } });
      const json = await res.json();
      return json.value;
    }, { ...authInfo, formId: form.id });

    console.log(`${form.title}: ${responses.length} total responses`);

    // group by responder email within this form
    const byResponder = {};
    for (const r of responses) {
      const key = (r.responder || r.responderName || 'unknown').toLowerCase();
      if (!byResponder[key]) byResponder[key] = [];
      byResponder[key].push(r);
    }

    for (const [email, resps] of Object.entries(byResponder)) {
      resps.sort((a, b) => new Date(a.submitDate) - new Date(b.submitDate));
      const latestResp = resps[resps.length - 1];
      const score = scoreResponse(latestResp, form.correct);

      if (!cohort[email]) cohort[email] = { name: latestResp.responderName || email, modules: {} };
      cohort[email].modules[form.module] = {
        score,
        max: form.correct.length,
        attempts: resps.length,
        date: latestResp.submitDate,
        perfectRequired: !!form.perfectRequired,
        passThreshold: form.passThreshold,
      };
    }

    await sleep(500);
  }

  // Build CSV
  const moduleCols = FORMS.map(f => f.module);
  const header = ['Name', 'Email', ...moduleCols.map(m => `Module ${m} (score/attempts)`), 'Verdict'];
  const rows = [header];

  for (const [email, person] of Object.entries(cohort)) {
    const row = [person.name, email];
    let ready = true;
    const blockers = [];

    for (const m of moduleCols) {
      const rec = person.modules[m];
      if (!rec) {
        row.push('NOT TAKEN');
        if (m !== 'F') blockers.push(`Module ${m} not taken`);
        else blockers.push('Final Exam not taken');
        ready = false;
        continue;
      }
      row.push(`${rec.score}/${rec.max} (${rec.attempts}x)`);

      if (rec.perfectRequired && rec.score < rec.max) {
        blockers.push(`Module ${m} not perfect (${rec.score}/${rec.max})`);
        ready = false;
      }
      if (rec.passThreshold && rec.score < rec.passThreshold) {
        blockers.push(`Final Exam below threshold (${rec.score}/${rec.max}, need ${rec.passThreshold})`);
        ready = false;
      }
    }

    row.push(ready ? 'READY' : blockers.join('; '));
    rows.push(row);
  }

  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n');
  fs.writeFileSync(path.join(__dirname, OUT_FILE), csv);

  console.log(`\n✓ Wrote ${rows.length - 1} participant rows to ${OUT_FILE}`);
  console.log(`  Ready to issue: ${rows.slice(1).filter(r => r[r.length-1] === 'READY').length}`);

  await browser.close();
}

main();
