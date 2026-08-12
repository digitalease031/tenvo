#!/usr/bin/env node
/**
 * Test script for water delivery days tracking improvements
 * Tests individual day patterns, weekend patterns, and backward compatibility
 * 
 * Usage: node scripts/test-water-delivery-days.mjs
 */

import { waterDeliveryCadenceCoversDate, WATER_DELIVERY_DAY_PRESETS } from '../lib/data/pakistanDeliveryAreas.js';

console.log('🧪 Testing Water Delivery Days Tracking System\n');
console.log('=' .repeat(70));

// Test helper
function testCadence(cadence, expectedDays, description) {
  console.log(`\n📋 Testing: ${description}`);
  console.log(`   Pattern: "${cadence}"`);
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const results = [];
  let passed = true;
  
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const testDate = new Date(2026, 0, 4 + dayOfWeek); // Week starting Jan 4, 2026 (Sunday)
    const shouldShow = waterDeliveryCadenceCoversDate(cadence, testDate);
    const expected = expectedDays.includes(dayOfWeek);
    const match = shouldShow === expected;
    
    results.push({
      day: dayNames[dayOfWeek],
      result: shouldShow ? '✓' : '○',
      expected: expected ? '✓' : '○',
      match
    });
    
    if (!match) {
      passed = false;
    }
  }
  
  // Display results in a single row
  const resultStr = results.map(r => `${r.day}:${r.result}`).join(' ');
  const expectedStr = results.map(r => `${r.day}:${r.expected}`).join(' ');
  
  console.log(`   Result:   ${resultStr}`);
  console.log(`   Expected: ${expectedStr}`);
  console.log(`   Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  return passed;
}

let totalTests = 0;
let passedTests = 0;

console.log('\n\n🔬 PHASE 1: Individual Day Patterns');
console.log('=' .repeat(70));

// Test individual days
const individualDayTests = [
  { cadence: 'Monday only', days: [1], desc: 'Monday only deliveries' },
  { cadence: 'Tuesday only', days: [2], desc: 'Tuesday only deliveries' },
  { cadence: 'Wednesday only', days: [3], desc: 'Wednesday only deliveries' },
  { cadence: 'Thursday only', days: [4], desc: 'Thursday only deliveries' },
  { cadence: 'Friday only', days: [5], desc: 'Friday only deliveries' },
  { cadence: 'Saturday only', days: [6], desc: 'Saturday only deliveries' },
  { cadence: 'Sunday only', days: [0], desc: 'Sunday only deliveries' },
];

for (const test of individualDayTests) {
  totalTests++;
  if (testCadence(test.cadence, test.days, test.desc)) {
    passedTests++;
  }
}

console.log('\n\n🔬 PHASE 2: Weekend & Weekday Patterns');
console.log('=' .repeat(70));

const weekPatterns = [
  { cadence: 'Weekdays', days: [1, 2, 3, 4, 5], desc: 'Weekdays (Mon-Fri)' },
  { cadence: 'Sat-Sun', days: [0, 6], desc: 'Weekend only (Sat-Sun)' },
  { cadence: 'Daily', days: [0, 1, 2, 3, 4, 5, 6], desc: 'Daily (all 7 days)' },
];

for (const test of weekPatterns) {
  totalTests++;
  if (testCadence(test.cadence, test.days, test.desc)) {
    passedTests++;
  }
}

console.log('\n\n🔬 PHASE 3: Multi-Day Patterns');
console.log('=' .repeat(70));

const multiDayTests = [
  { cadence: 'Mon-Wed-Fri', days: [1, 3, 5], desc: 'Mon-Wed-Fri pattern' },
  { cadence: 'Tue-Thu-Sat', days: [2, 4, 6], desc: 'Tue-Thu-Sat pattern' },
  { cadence: 'Mon Wed Fri', days: [1, 3, 5], desc: 'Mon Wed Fri (space-separated)' },
];

for (const test of multiDayTests) {
  totalTests++;
  if (testCadence(test.cadence, test.days, test.desc)) {
    passedTests++;
  }
}

console.log('\n\n🔬 PHASE 4: Backward Compatibility');
console.log('=' .repeat(70));

const legacyTests = [
  { cadence: 'Alternate Days', days: [1, 3, 5], desc: 'Legacy "Alternate Days" (defaults to Mon/Wed/Fri)' },
  { cadence: 'Weekly', days: [1, 3, 5], desc: 'Legacy "Weekly" (parsed as Mon/Wed/Fri tokens)' },
  { cadence: 'On Demand', days: [0, 1, 2, 3, 4, 5, 6], desc: 'On Demand (shows all days for manual tracking)' },
  { cadence: 'Custom', days: [0, 1, 2, 3, 4, 5, 6], desc: 'Custom (shows all days for manual tracking)' },
];

for (const test of legacyTests) {
  totalTests++;
  if (testCadence(test.cadence, test.days, test.desc)) {
    passedTests++;
  }
}

console.log('\n\n🔬 PHASE 5: Edge Cases & Validation');
console.log('=' .repeat(70));

const edgeCaseTests = [
  { cadence: '', days: [0, 1, 2, 3, 4, 5, 6], desc: 'Empty string (defaults to all days)' },
  { cadence: 'DAILY', days: [0, 1, 2, 3, 4, 5, 6], desc: 'DAILY (case insensitive)' },
  { cadence: 'monday only', days: [1], desc: 'monday only (lowercase)' },
  { cadence: 'MONDAY ONLY', days: [1], desc: 'MONDAY ONLY (uppercase)' },
  { cadence: 'sat sun', days: [0, 6], desc: 'sat sun (space-separated, no dash)' },
  { cadence: 'Mon, Wed, Fri', days: [1, 3, 5], desc: 'Mon, Wed, Fri (comma-separated)' },
];

for (const test of edgeCaseTests) {
  totalTests++;
  if (testCadence(test.cadence, test.days, test.desc)) {
    passedTests++;
  }
}

console.log('\n\n📊 PRESET OPTIONS VALIDATION');
console.log('=' .repeat(70));

console.log('\nAvailable Presets in WATER_DELIVERY_DAY_PRESETS:');
WATER_DELIVERY_DAY_PRESETS.forEach((preset, index) => {
  console.log(`   ${String(index + 1).padStart(2, ' ')}. ${preset}`);
});

console.log(`\n✅ Total presets: ${WATER_DELIVERY_DAY_PRESETS.length}`);
console.log('   Expected: 15 options (Daily + Weekdays + 7 individual days + 4 patterns + Weekly + On Demand + Custom)');

console.log('\n\n📈 FINAL RESULTS');
console.log('=' .repeat(70));
console.log(`\n   Total Tests:  ${totalTests}`);
console.log(`   Passed:       ${passedTests}`);
console.log(`   Failed:       ${totalTests - passedTests}`);
console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! Water delivery days tracking is working perfectly.\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the logic.\n');
  process.exit(1);
}
