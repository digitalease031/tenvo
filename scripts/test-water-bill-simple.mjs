#!/usr/bin/env node
/**
 * Simple inline test for water bill format functions.
 * Tests core logic without external dependencies.
 */

// ANSI colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const RESET = '\x1b[0m';

function assert(condition, message) {
  if (!condition) {
    console.error(`${RED}✗ FAIL${RESET}: ${message}`);
    process.exit(1);
  }
  console.log(`${GREEN}✓ PASS${RESET}: ${message}`);
}

console.log(`${BLUE}=== Water Supply Bill Format Tests ===${RESET}\n`);

// Test 1: Column widths for 58mm thermal
console.log(`${YELLOW}Test 1: Column formatting${RESET}`);

function padWaterColumn(text, width, align = 'left') {
  const str = String(text ?? '').slice(0, width);
  if (align === 'right') return str.padStart(width, ' ');
  if (align === 'center') {
    const leftPad = Math.floor((width - str.length) / 2);
    return str.padStart(leftPad + str.length, ' ').padEnd(width, ' ');
  }
  return str.padEnd(width, ' ');
}

function formatWaterMonthlyBillHeaderLine() {
  const day = padWaterColumn('DD', 2);
  const del = padWaterColumn('Del', 3, 'right');
  const rec = padWaterColumn('Rec', 3, 'right');
  const bal = padWaterColumn('Bal', 3, 'right');
  return `${day}   ${del} ${rec}  ${bal}`;
}

function formatWaterMonthlyBillDayLine(day) {
  const dayNum = padWaterColumn(String(day.dayNum || '?'), 2, 'right');
  const del = padWaterColumn(String(day.del || 0), 3, 'right');
  const rec = padWaterColumn(String(day.rec || 0), 3, 'right');
  const bal = padWaterColumn(String(day.balance || 0), 3, 'right');
  return `${dayNum}   ${del} ${rec}  ${bal}`;
}

const header = formatWaterMonthlyBillHeaderLine();
console.log(`  Header: "${header}"`);
assert(header.includes('DD'), 'Header has DD column');
assert(header.includes('Del'), 'Header has Del column');
assert(header.includes('Rec'), 'Header has Rec column');
assert(header.includes('Bal'), 'Header has Bal column');
assert(!header.includes('Y/N'), 'Header does NOT have Y/N column');
assert(header.length <= 32, 'Header fits in 58mm (≤32 chars)');

const day1 = formatWaterMonthlyBillDayLine({ dayNum: 1, del: 0, rec: 0, balance: 5 });
const day8 = formatWaterMonthlyBillDayLine({ dayNum: 8, del: 1, rec: 1, balance: 5 });
const day20 = formatWaterMonthlyBillDayLine({ dayNum: 20, del: 2, rec: 0, balance: 7 });

console.log(`  Day 1:  "${day1}"`);
console.log(`  Day 8:  "${day8}"`);
console.log(`  Day 20: "${day20}"`);

assert(day1.length <= 32, 'Day line fits in 58mm');
assert(day8.includes('1'), 'Day 8 shows delivery count');
assert(day20.includes('2'), 'Day 20 shows delivery count');

console.log('');

// Test 2: Balance calculation logic
console.log(`${YELLOW}Test 2: Balance calculations${RESET}`);

function computeBottleBalance(prev, del, rec) {
  return Math.round((prev + del - rec) * 1000) / 1000;
}

let balance = 5; // Opening
balance = computeBottleBalance(balance, 1, 1); // Day 1: delivered 1, collected 1
assert(balance === 5, 'Balance unchanged after exchange (5 + 1 - 1 = 5)');

balance = computeBottleBalance(balance, 2, 0); // Day 2: first fill, no collection
assert(balance === 7, 'Balance increases after first fill (5 + 2 - 0 = 7)');

balance = computeBottleBalance(balance, 0, 0); // Day 3: no activity
assert(balance === 7, 'Balance unchanged with no activity');

balance = computeBottleBalance(balance, 3, 3); // Day 4: exchange 3
assert(balance === 7, 'Balance unchanged after bulk exchange (7 + 3 - 3 = 7)');

console.log('');

// Test 3: Monthly grid simulation
console.log(`${YELLOW}Test 3: Monthly grid logic${RESET}`);

const monthDays = [];
let runningBal = 1; // Opening balance

// Simulate August 2026 (31 days)
for (let day = 1; day <= 31; day++) {
  let del = 0;
  let rec = 0;
  
  // Weekly delivery pattern (every 7 days)
  if (day === 1 || day === 8 || day === 15 || day === 22 || day === 29) {
    del = 1;
    rec = 1;
  }
  
  runningBal = computeBottleBalance(runningBal, del, rec);
  
  monthDays.push({
    dayNum: day,
    del,
    rec,
    balance: runningBal,
  });
}

assert(monthDays.length === 31, 'Grid has 31 days for August');

const activeDays = monthDays.filter(d => d.del > 0 || d.rec > 0).length;
assert(activeDays === 5, 'Active days count is correct (5 weekly deliveries)');

const totalDel = monthDays.reduce((sum, d) => sum + d.del, 0);
const totalRec = monthDays.reduce((sum, d) => sum + d.rec, 0);
assert(totalDel === 5, 'Total delivered = 5');
assert(totalRec === 5, 'Total received = 5');

const closingBalance = monthDays[30].balance;
assert(closingBalance === 1, 'Closing balance = opening (exchange pattern)');

console.log('');

// Test 4: Mixed scenario (first fill + refills)
console.log(`${YELLOW}Test 4: Mixed first fill + refill scenario${RESET}`);

const mixedDays = [];
let mixedBal = 0; // New customer

// Day 3: First fill (customer gets bottle and keeps it)
mixedBal = computeBottleBalance(mixedBal, 1, 0);
mixedDays.push({ dayNum: 3, del: 1, rec: 0, balance: mixedBal });

// Day 10: Refill exchange
mixedBal = computeBottleBalance(mixedBal, 1, 1);
mixedDays.push({ dayNum: 10, del: 1, rec: 1, balance: mixedBal });

// Day 17: Another refill
mixedBal = computeBottleBalance(mixedBal, 1, 1);
mixedDays.push({ dayNum: 17, del: 1, rec: 1, balance: mixedBal });

// Day 24: First fill again (adds another bottle)
mixedBal = computeBottleBalance(mixedBal, 1, 0);
mixedDays.push({ dayNum: 24, del: 1, rec: 0, balance: mixedBal });

assert(mixedDays[0].balance === 1, 'After first fill: balance = 1');
assert(mixedDays[1].balance === 1, 'After refill exchange: balance still 1');
assert(mixedDays[3].balance === 2, 'After second first fill: balance = 2');

console.log('');

// Summary
console.log(`${GREEN}╔═══════════════════════════════════════════════════╗${RESET}`);
console.log(`${GREEN}║  ✓ All water bill format tests passed!           ║${RESET}`);
console.log(`${GREEN}╚═══════════════════════════════════════════════════╝${RESET}`);
console.log('');
console.log(`${BLUE}Bill Format Example:${RESET}`);
console.log('');
console.log(`  ${formatWaterMonthlyBillHeaderLine()}`);
console.log(`  ${formatWaterMonthlyBillDayLine({ dayNum: 1, del: 0, rec: 0, balance: 1 })}`);
console.log(`  ${formatWaterMonthlyBillDayLine({ dayNum: 2, del: 0, rec: 0, balance: 1 })}`);
console.log(`  ${formatWaterMonthlyBillDayLine({ dayNum: 3, del: 1, rec: 0, balance: 2 })}`);
console.log(`  ${formatWaterMonthlyBillDayLine({ dayNum: 4, del: 0, rec: 0, balance: 2 })}`);
console.log(`  ${formatWaterMonthlyBillDayLine({ dayNum: 5, del: 0, rec: 0, balance: 2 })}`);
console.log(`  ...`);
console.log(`  ${formatWaterMonthlyBillDayLine({ dayNum: 8, del: 1, rec: 1, balance: 2 })}`);
console.log(`  ...`);
console.log('');
console.log(`${BLUE}Key Features:${RESET}`);
console.log('  • DD / Del / Rec / Bal columns (no Y/N status)');
console.log('  • Counts show actual bottle deliveries');
console.log('  • First fill + refill combined in daily totals');
console.log('  • Running balance calculated correctly');
console.log('  • Fits 58mm thermal paper (~32 chars)');
console.log('');
