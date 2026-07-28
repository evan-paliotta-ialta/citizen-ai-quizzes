/**
 * citizen_1on1_prep.js
 *
 * Pre-fills the 1:1 agenda template for a given citizen: current quarter,
 * today's date, and their prior quarter's goal (if any), pulled from
 * citizen_1on1_tracker.csv. Prints the ready-to-use agenda to stdout.
 *
 * Run: node citizen_1on1_prep.js "Jane Doe" [--quarter=Q3-2026]
 */

const fs = require('fs');
const path = require('path');

const [, , nameArg, ...rest] = process.argv;
if (!nameArg) {
  console.error('Usage: node citizen_1on1_prep.js "<citizen name>" [--quarter=Q3-2026]');
  process.exit(1);
}

const quarterFlag = rest.find(a => a.startsWith('--quarter='));
const overrideQuarter = quarterFlag ? quarterFlag.split('=')[1] : null;

function currentQuarter(date = new Date()) {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `Q${q}-${date.getFullYear()}`;
}

function parseCsvLine(line) {
  // Minimal RFC4180 parser: handles quoted fields with embedded commas/quotes.
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { fields.push(cur); cur = ''; }
      else cur += c;
    }
  }
  fields.push(cur);
  return fields;
}

const csvPath = path.join(__dirname, 'citizen_1on1_tracker.csv');
const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
const header = parseCsvLine(lines[0]);
const rows = lines.slice(1).map(parseCsvLine);

const nameLower = nameArg.toLowerCase();
const priorRows = rows.filter(r => (r[0] || '').toLowerCase() === nameLower);

let priorGoal = null;
let priorQuarter = null;
if (priorRows.length > 0) {
  const last = priorRows[priorRows.length - 1];
  priorQuarter = last[2];
  priorGoal = last[7]; // Goal Set column
}

const quarter = overrideQuarter || currentQuarter();
const today = new Date().toISOString().slice(0, 10);

const templatePath = path.join(__dirname, '1on1_agenda_template.md');
const template = fs.readFileSync(templatePath, 'utf8');

console.log('='.repeat(60));
console.log(`1:1 PREP — ${nameArg}`);
console.log('='.repeat(60));
console.log(`Quarter: ${quarter}`);
console.log(`Date: ${today}`);
if (priorGoal) {
  console.log(`Prior goal (from ${priorQuarter}): ${priorGoal}`);
} else {
  console.log('Prior goal: none on record — this is their first tracked 1:1.');
}
console.log('='.repeat(60));
console.log('');
console.log(template);
