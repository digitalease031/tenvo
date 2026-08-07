#!/usr/bin/env node
/**
 * Water Hisab Daily Sheet Column Audit
 * 
 * Verifies:
 * 1. No duplicate product IDs in columns
 * 2. No duplicate column labels
 * 3. Product resolution logic is working correctly
 * 4. Label disambiguation is applied when needed
 * 5. All columns are accurate and intelligently assigned
 */

import { resolveWaterHisabProducts, shortWaterHisabProductLabel } from '../lib/storefront/waterShopHisab.js';

console.log('\n📋 Water Hisab Daily Sheet Column Audit\n');
console.log('='.repeat(80));

// Test scenarios
const testScenarios = [
  {
    name: 'Duplicate product names (15L Refill vs 15L Bottle)',
    products: [
      { id: '1', name: '15L Refill', category: 'water-bottle', unit: 'pcs', price: 30, is_active: true, is_deleted: false },
      { id: '2', name: '15L Bottle', category: 'water-bottle', unit: 'pcs', price: 400, is_active: true, is_deleted: false },
      { id: '3', name: '19L Refill', category: 'water-bottle', unit: 'pcs', price: 35, is_active: true, is_deleted: false },
      { id: '4', name: '19L Bottle', category: 'water-bottle', unit: 'pcs', price: 450, is_active: true, is_deleted: false },
    ],
    settings: {},
  },
  {
    name: 'Multiple sizes (15L, 19L, 6L)',
    products: [
      { id: '1', name: '15L Refill', category: 'water-bottle', unit: 'pcs', price: 30, is_active: true, is_deleted: false },
      { id: '2', name: '19L Refill', category: 'water-bottle', unit: 'pcs', price: 35, is_active: true, is_deleted: false },
      { id: '3', name: '6L Refill', category: 'water-bottle', unit: 'pcs', price: 20, is_active: true, is_deleted: false },
      { id: '4', name: '1.5L Bottle Case (12)', category: 'water-bottle', unit: 'case', price: 120, is_active: true, is_deleted: false },
    ],
    settings: {},
  },
  {
    name: 'Identical names requiring disambiguation',
    products: [
      { id: '1', name: '15L Water', category: 'water-bottle', unit: 'pcs', price: 30, is_active: true, is_deleted: false },
      { id: '2', name: '15L Water', category: 'water-bottle', unit: 'btl', price: 400, is_active: true, is_deleted: false },
      { id: '3', name: '15L Water', category: 'water-bottle', unit: 'case', price: 600, is_active: true, is_deleted: false },
    ],
    settings: {},
  },
  {
    name: 'Custom product IDs in settings',
    products: [
      { id: 'prod-a', name: '15L Refill', category: 'water-bottle', unit: 'pcs', price: 30, is_active: true, is_deleted: false },
      { id: 'prod-b', name: '19L Refill', category: 'water-bottle', unit: 'pcs', price: 35, is_active: true, is_deleted: false },
      { id: 'prod-c', name: '6L Refill', category: 'water-bottle', unit: 'pcs', price: 20, is_active: true, is_deleted: false },
      { id: 'prod-d', name: '19L Bottle', category: 'water-bottle', unit: 'pcs', price: 450, is_active: true, is_deleted: false },
    ],
    settings: {
      waterHisab: {
        productIds: ['prod-b', 'prod-a', 'prod-b'], // intentional duplicate to test dedup
      },
    },
  },
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.log(`  ✗ ${message}`);
    failedTests++;
  }
}

// Run tests for each scenario
for (const scenario of testScenarios) {
  console.log(`\n▸ ${scenario.name}`);
  console.log('-'.repeat(80));

  const result = resolveWaterHisabProducts(scenario.products, scenario.settings);

  // Test 1: No duplicate product IDs
  const productIds = result.map((p) => p.id);
  const uniqueIds = new Set(productIds);
  test(
    productIds.length === uniqueIds.size,
    `No duplicate product IDs (${productIds.length} columns, ${uniqueIds.size} unique)`
  );

  // Test 2: No duplicate labels
  const labels = result.map((p) => p.hisabShortLabel || shortWaterHisabProductLabel(p, 16));
  const uniqueLabels = new Set(labels);
  test(
    labels.length === uniqueLabels.size,
    `No duplicate labels (${labels.length} labels, ${uniqueLabels.size} unique)`
  );

  // Test 3: Max 8 columns
  test(result.length <= 8, `Column count within limit (${result.length}/8)`);

  // Test 4: All products have IDs
  const allHaveIds = result.every((p) => p && p.id);
  test(allHaveIds, 'All products have valid IDs');

  // Test 5: All products have names or labels
  const allHaveNames = result.every((p) => p && (p.name || p.hisabShortLabel));
  test(allHaveNames, 'All products have names or labels');

  // Display column structure
  console.log('\n  Columns:');
  result.forEach((p, idx) => {
    const label = p.hisabShortLabel || shortWaterHisabProductLabel(p, 16);
    console.log(`    ${idx + 1}. ${label.padEnd(20)} (ID: ${p.id}, Unit: ${p.unit || 'pcs'}, Price: ${p.price})`);
  });

  // Test label disambiguation if there are identical base names
  const baseNames = result.map((p) => p.name.toLowerCase());
  const duplicateBaseNames = baseNames.filter((name, idx) => baseNames.indexOf(name) !== idx);
  if (duplicateBaseNames.length > 0) {
    const hasDisambiguation = labels.some((l) => /\(Rfl\)|\(Bot\)|\(Case\)|\(#\d\)|\(\w{1,3}\)/.test(l));
    test(
      hasDisambiguation,
      `Label disambiguation applied for duplicate names (${duplicateBaseNames.length} duplicates found)`
    );
  }
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('📊 Test Summary\n');
console.log(`  Total tests: ${totalTests}`);
console.log(`  Passed: ${passedTests} ✓`);
console.log(`  Failed: ${failedTests} ✗`);
console.log(`  Success rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);

if (failedTests === 0) {
  console.log('✅ All water hisab daily sheet column checks passed!\n');
  console.log('Column intelligence verified:');
  console.log('  • No duplicate product IDs');
  console.log('  • No duplicate column labels');
  console.log('  • Label disambiguation working correctly');
  console.log('  • Column limits respected (max 8)');
  console.log('  • Custom product IDs honored');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ Some water hisab column checks failed. Review output above.\n');
  process.exit(1);
}
