#!/usr/bin/env node
/**
 * Verification script for water supply monthly bill format.
 * Tests the new consolidated Day/Del/Rec/Bal column layout.
 * 
 * Run: node scripts/verify-water-bill-format.mjs
 */

import {
  aggregateWaterLinesBySizeGroup,
  buildWaterMonthlyBillGrid,
  formatWaterMonthlyBillHeaderLine,
  formatWaterMonthlyBillDayLine,
  resolveWaterHisabProductSizeGroup,
} from '../lib/storefront/waterShopHisab.js';

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

console.log(`${BLUE}=== Water Supply Bill Format Verification ===${RESET}\n`);

// Test 1: Size group resolution
console.log(`${YELLOW}Test 1: Product size group resolution${RESET}`);
assert(
  resolveWaterHisabProductSizeGroup('19L Mineral Water Refill') === '19l',
  'Identifies 19L products'
);
assert(
  resolveWaterHisabProductSizeGroup('12L Bottle') === '12l',
  'Identifies 12L products'
);
assert(
  resolveWaterHisabProductSizeGroup('5L Jug') === '5l',
  'Identifies 5L products'
);
assert(
  resolveWaterHisabProductSizeGroup('1.5L Case') === 'pet',
  'Identifies PET/case products'
);
console.log('');

// Test 2: Line aggregation by size group
console.log(`${YELLOW}Test 2: Aggregate lines by bottle size${RESET}`);

const products = [
  { id: 'p1', name: '19L Refill', sizeGroup: '19l' },
  { id: 'p2', name: '19L First Fill', sizeGroup: '19l' },
  { id: 'p3', name: '12L Bottle', sizeGroup: '12l' },
];

const lines = [
  { product_id: 'p1', quantity: 2, received_quantity: 2 }, // 19L Refill
  { product_id: 'p2', quantity: 1, received_quantity: 0 }, // 19L First Fill (new bottle, no empty)
  { product_id: 'p3', quantity: 1, received_quantity: 1 }, // 12L
];

const aggregated = aggregateWaterLinesBySizeGroup(lines, products);
assert(aggregated.has('19l'), 'Creates 19L size group');
assert(aggregated.get('19l').del === 3, '19L: Combines refill (2) + first fill (1) = 3 delivered');
assert(aggregated.get('19l').rec === 2, '19L: Only refill empties returned (2)');
assert(aggregated.get('12l').del === 1, '12L: 1 delivered');
assert(aggregated.get('12l').rec === 1, '12L: 1 received');
console.log('');

// Test 3: Monthly bill grid generation
console.log(`${YELLOW}Test 3: Monthly bill grid with running balance${RESET}`);

const stops = [
  {
    delivery_date: new Date('2026-08-08'),
    lines: [
      { product_id: 'p1', quantity: 1, received_quantity: 1 }, // Day 8: 19L refill
    ],
  },
  {
    delivery_date: new Date('2026-08-14'),
    lines: [
      { product_id: 'p1', quantity: 1, received_quantity: 1 }, // Day 14: 19L refill
    ],
  },
  {
    delivery_date: new Date('2026-08-20'),
    lines: [
      { product_id: 'p2', quantity: 1, received_quantity: 0 }, // Day 20: 19L first fill (keeps bottle)
    ],
  },
];

const grid = buildWaterMonthlyBillGrid({
  stops,
  products,
  startIso: '2026-08-01',
  endIso: '2026-08-31',
  openingBalance: 1,
});

assert(grid.days.length === 31, 'Grid has 31 days for August');
assert(grid.activeDays === 3, 'Active days count is correct (3 deliveries)');

// Check day 1 (no activity, opening balance)
const day1 = grid.days[0];
assert(day1.dayNum === 1, 'Day 1 is first');
assert(day1.del === 0, 'Day 1: No delivery');
assert(day1.rec === 0, 'Day 1: No collection');
assert(day1.balance === 1, 'Day 1: Balance = 1 (opening)');

// Check day 8 (first delivery: refill exchange)
const day8 = grid.days[7];
assert(day8.dayNum === 8, 'Day 8 is 8th');
assert(day8.del === 1, 'Day 8: Delivered 1');
assert(day8.rec === 1, 'Day 8: Received 1');
assert(day8.balance === 1, 'Day 8: Balance unchanged (1 + 1 - 1 = 1)');

// Check day 14 (second delivery: refill exchange)
const day14 = grid.days[13];
assert(day14.dayNum === 14, 'Day 14 is 14th');
assert(day14.del === 1, 'Day 14: Delivered 1');
assert(day14.rec === 1, 'Day 14: Received 1');
assert(day14.balance === 1, 'Day 14: Balance still 1');

// Check day 20 (third delivery: first fill - customer keeps bottle)
const day20 = grid.days[19];
assert(day20.dayNum === 20, 'Day 20 is 20th');
assert(day20.del === 1, 'Day 20: Delivered 1 (first fill)');
assert(day20.rec === 0, 'Day 20: No empty returned (new bottle)');
assert(day20.balance === 2, 'Day 20: Balance increases to 2 (customer keeps bottle)');

// Check closing balance
assert(grid.closingBalance === 2, 'Closing balance = 2 (opening 1 + net +1)');

console.log('');

// Test 4: Thermal receipt formatting
console.log(`${YELLOW}Test 4: 58mm thermal receipt column formatting${RESET}`);

const headerLine = formatWaterMonthlyBillHeaderLine();
console.log(`  Header: "${headerLine}"`);
assert(headerLine.includes('DD'), 'Header includes day column');
assert(headerLine.includes('Del'), 'Header includes delivered column');
assert(headerLine.includes('Rec'), 'Header includes received column');
assert(headerLine.includes('Bal'), 'Header includes balance column');
assert(!headerLine.includes('Y/N'), 'Header does NOT include Y/N status column');

const dayLine = formatWaterMonthlyBillDayLine({
  dayNum: 8,
  del: 1,
  rec: 1,
  balance: 5,
});
console.log(`  Day 8:  "${dayLine}"`);
assert(dayLine.trim().startsWith('8') || dayLine.trim().startsWith(' 8'), 'Day line starts with day number');
assert(dayLine.includes('1'), 'Day line includes delivery count');

// Test column alignment (58mm = ~32 chars usable)
const longDayLine = formatWaterMonthlyBillDayLine({
  dayNum: 28,
  del: 12,
  rec: 10,
  balance: 123,
});
console.log(`  Day 28: "${longDayLine}"`);
assert(longDayLine.length <= 32, '58mm line fits within 32 chars (monospace)');

console.log('');

// Test 5: Realistic monthly scenario
console.log(`${YELLOW}Test 5: Realistic monthly bill scenario${RESET}`);

const realisticStops = [];
// Weekly delivery pattern (Mondays only, 4 weeks)
for (let day = 1; day <= 28; day += 7) {
  realisticStops.push({
    delivery_date: new Date(`2026-08-${String(day).padStart(2, '0')}`),
    lines: [
      { product_id: 'p1', quantity: 2, received_quantity: 2 }, // 2× 19L refills
    ],
  });
}

const realisticGrid = buildWaterMonthlyBillGrid({
  stops: realisticStops,
  products,
  startIso: '2026-08-01',
  endIso: '2026-08-31',
  openingBalance: 3,
});

assert(realisticGrid.activeDays === 4, 'Realistic: 4 active days (weekly deliveries)');

// Opening balance = 3
// Week 1 (day 1): del 2, rec 2 → balance = 3 + 2 - 2 = 3
// Week 2 (day 8): del 2, rec 2 → balance = 3 + 2 - 2 = 3
// Week 3 (day 15): del 2, rec 2 → balance = 3 + 2 - 2 = 3
// Week 4 (day 22): del 2, rec 2 → balance = 3 + 2 - 2 = 3
// Total delivered: 8, Total received: 8, Closing: 3

const totalDelivered = realisticGrid.days.reduce((sum, d) => sum + d.del, 0);
const totalReceived = realisticGrid.days.reduce((sum, d) => sum + d.rec, 0);

assert(totalDelivered === 8, 'Realistic: Total delivered = 8 bottles');
assert(totalReceived === 8, 'Realistic: Total received = 8 empties');
assert(realisticGrid.closingBalance === 3, 'Realistic: Balance unchanged (exchange pattern)');

console.log('');

// Test 6: Edge cases
console.log(`${YELLOW}Test 6: Edge cases${RESET}`);

// Empty month (no deliveries)
const emptyGrid = buildWaterMonthlyBillGrid({
  stops: [],
  products,
  startIso: '2026-09-01',
  endIso: '2026-09-30',
  openingBalance: 5,
});

assert(emptyGrid.days.length === 30, 'Empty month: Grid has 30 days (September)');
assert(emptyGrid.activeDays === 0, 'Empty month: No active days');
assert(emptyGrid.closingBalance === 5, 'Empty month: Balance unchanged');

// First fill scenario (customer accumulates bottles)
const firstFillStops = [
  {
    delivery_date: new Date('2026-08-05'),
    lines: [
      { product_id: 'p2', quantity: 1, received_quantity: 0 }, // First fill (keeps bottle)
    ],
  },
  {
    delivery_date: new Date('2026-08-12'),
    lines: [
      { product_id: 'p2', quantity: 1, received_quantity: 0 }, // Another first fill
    ],
  },
];

const firstFillGrid = buildWaterMonthlyBillGrid({
  stops: firstFillStops,
  products,
  startIso: '2026-08-01',
  endIso: '2026-08-31',
  openingBalance: 0,
});

assert(firstFillGrid.closingBalance === 2, 'First fill: Customer accumulates 2 bottles');

// Mixed scenario: first fill + refills
const mixedStops = [
  {
    delivery_date: new Date('2026-08-03'),
    lines: [
      { product_id: 'p2', quantity: 1, received_quantity: 0 }, // First fill (day 3)
    ],
  },
  {
    delivery_date: new Date('2026-08-10'),
    lines: [
      { product_id: 'p1', quantity: 1, received_quantity: 1 }, // Refill exchange (day 10)
    ],
  },
];

const mixedGrid = buildWaterMonthlyBillGrid({
  stops: mixedStops,
  products,
  startIso: '2026-08-01',
  endIso: '2026-08-31',
  openingBalance: 0,
});

// Opening: 0
// Day 3: del 1, rec 0 → balance = 0 + 1 - 0 = 1
// Day 10: del 1, rec 1 → balance = 1 + 1 - 1 = 1
assert(mixedGrid.closingBalance === 1, 'Mixed: Closing balance = 1');

console.log('');

// Summary
console.log(`${GREEN}╔═══════════════════════════════════════════════════╗${RESET}`);
console.log(`${GREEN}║  ✓ All water bill format tests passed!           ║${RESET}`);
console.log(`${GREEN}╚═══════════════════════════════════════════════════╝${RESET}`);
console.log('');
console.log(`${BLUE}Monthly bill format:${RESET}`);
console.log('  • Day/Del/Rec/Bal columns only (no Y/N status)');
console.log('  • First fill + refill combined in daily totals');
console.log('  • Running balance calculated correctly');
console.log('  • Product breakdown shown in totals section');
console.log('');
console.log(`${BLUE}Example output:${RESET}`);
console.log(`  ${formatWaterMonthlyBillHeaderLine()}`);
for (let i = 0; i < 5; i++) {
  const day = realisticGrid.days[i];
  console.log(`  ${formatWaterMonthlyBillDayLine(day)}`);
}
console.log('  ...');
console.log('');
