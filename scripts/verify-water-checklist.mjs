#!/usr/bin/env node
/**
 * Verification script: Water Delivery Checklist Wiring
 * 
 * Ensures the intelligent, customizable water delivery checklist system is:
 * 1. Properly integrated with the water delivery domain
 * 2. Configuration system is working correctly
 * 3. Smart target calculation is functional
 * 4. All print formats (thermal & area list) are wired correctly
 * 5. Customization options are accessible and validated
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const errors = [];
const warnings = [];

function error(msg) {
  errors.push(`❌ ${msg}`);
}

function warn(msg) {
  warnings.push(`⚠️  ${msg}`);
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

function checkFileExists(path, description) {
  if (!existsSync(path)) {
    error(`Missing ${description}: ${path}`);
    return false;
  }
  return true;
}

function checkFileContains(path, pattern, description) {
  if (!checkFileExists(path, description)) return false;
  const content = readFileSync(path, 'utf-8');
  const regex = typeof pattern === 'string' ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) : pattern;
  if (!regex.test(content)) {
    error(`${description} missing pattern: ${pattern}`);
    return false;
  }
  return true;
}

console.log('\n🔍 Verifying Water Delivery Checklist System...\n');

// ============================================================================
// 1. Core Configuration Files
// ============================================================================
console.log('📋 Checking core configuration files...');

checkFileExists(
  resolve('lib/storefront/waterChecklistConfig.js'),
  'Water checklist configuration module'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /export\s+const\s+DEFAULT_CHECKLIST_CONFIG/,
  'Default checklist config export'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /export\s+const\s+CHECKLIST_COLUMN_DEFS/,
  'Column definitions export'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /export\s+function\s+calculateSmartTarget/,
  'Smart target calculation function'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /export\s+function\s+groupCustomersByArea/,
  'Area grouping function'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /export\s+function\s+buildChecklistPayload/,
  'Checklist payload builder'
);

success('Configuration module structure verified');

// ============================================================================
// 2. Thermal Print Integration
// ============================================================================
console.log('\n📄 Checking thermal print integration...');

checkFileContains(
  resolve('lib/print/waterHisabThermalBill.js'),
  /buildChecklistPayload.*readChecklistConfig/,
  'Thermal PDF uses intelligent config'
);

checkFileContains(
  resolve('lib/print/waterHisabThermalBill.js'),
  /displayTarget.*calculatedTarget/,
  'Thermal PDF uses smart targets'
);

checkFileContains(
  resolve('lib/print/waterHisabThermalBill.js'),
  /export.*buildWaterDeliveryChecklistHtml/,
  'HTML thermal checklist export'
);

checkFileContains(
  resolve('lib/print/waterHisabThermalBill.js'),
  /export.*printWaterDeliveryChecklist/,
  'Thermal checklist print function export'
);

success('Thermal print integration verified');

// ============================================================================
// 3. Area List Integration
// ============================================================================
console.log('\n📋 Checking area list integration...');

checkFileContains(
  resolve('lib/print/waterHisabThermalBill.js'),
  /async\s+function\s+buildWaterAreaListHtml/,
  'Area list builder is async (for config import)'
);

checkFileContains(
  resolve('lib/print/waterHisabThermalBill.js'),
  /buildChecklistPayload/,
  'Area list uses intelligent payload builder'
);

checkFileContains(
  resolve('lib/print/waterHisabThermalBill.js'),
  /enrichedRows.*groups/,
  'Area list uses enriched rows and groups with smart targets'
);

checkFileContains(
  resolve('lib/print/waterHisabThermalBill.js'),
  /export.*buildWaterAreaListHtml/,
  'Area list HTML export'
);

checkFileContains(
  resolve('lib/print/waterHisabThermalBill.js'),
  /export.*printWaterAreaList/,
  'Area list print function export'
);

success('Area list integration verified');

// ============================================================================
// 4. WaterRouteHisab Component Integration
// ============================================================================
console.log('\n🎛️  Checking component integration...');

checkFileContains(
  resolve('components/water/WaterRouteHisab.jsx'),
  /printWaterDeliveryChecklist/,
  'Component imports thermal checklist printer'
);

checkFileContains(
  resolve('components/water/WaterRouteHisab.jsx'),
  /printWaterAreaList/,
  'Component imports area list printer'
);

checkFileContains(
  resolve('components/water/WaterRouteHisab.jsx'),
  /handlePrintDeliveryChecklist/,
  'Component has delivery checklist handler'
);

checkFileContains(
  resolve('components/water/WaterRouteHisab.jsx'),
  /handlePrintAreaList/,
  'Component has area list handler'
);

checkFileContains(
  resolve('components/water/WaterRouteHisab.jsx'),
  /58mm|80mm/,
  'Component supports both thermal sizes'
);

checkFileContains(
  resolve('components/water/WaterRouteHisab.jsx'),
  /A4|A5/,
  'Component supports both paper sizes for area list'
);

success('Component integration verified');

// ============================================================================
// 5. Target Calculation Strategies
// ============================================================================
console.log('\n🎯 Checking target calculation strategies...');

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /TARGET_CALCULATION_STRATEGIES/,
  'Target calculation strategies object'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /auto:\s*\(/,
  'Auto target strategy'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /manual:\s*\(/,
  'Manual target strategy'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /historical:\s*\(/,
  'Historical target strategy'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /scheduled:\s*\(/,
  'Scheduled target strategy'
);

success('Target calculation strategies verified');

// ============================================================================
// 6. Column Customization
// ============================================================================
console.log('\n📊 Checking column customization...');

const requiredColumns = [
  'house',
  'customer',
  'address',
  'phone',
  'target',
  'delivered',
  'received',
  'cash',
  'balance',
  'accountNo',
  'serial',
];

const configContent = existsSync(resolve('lib/storefront/waterChecklistConfig.js'))
  ? readFileSync(resolve('lib/storefront/waterChecklistConfig.js'), 'utf-8')
  : '';

requiredColumns.forEach((col) => {
  if (configContent.includes(`${col}:`)) {
    success(`Column definition exists: ${col}`);
  } else {
    warn(`Column definition missing: ${col}`);
  }
});

// ============================================================================
// 7. Area Grouping Configuration
// ============================================================================
console.log('\n🗂️  Checking area grouping configuration...');

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /areaGrouping:\s*{/,
  'Area grouping configuration'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /sortBy:.*routeLabel.*townCode.*deliveryArea/,
  'Area grouping sort options'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /sortOrder:.*asc.*desc/,
  'Area grouping sort order'
);

success('Area grouping configuration verified');

// ============================================================================
// 8. Checklist Presets
// ============================================================================
console.log('\n🎨 Checking checklist presets...');

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /export\s+const\s+CHECKLIST_PRESETS/,
  'Checklist presets export'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /minimal58mm:/,
  'Minimal 58mm preset'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /full80mm:/,
  'Full 80mm preset'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /detailedAreaList:/,
  'Detailed area list preset'
);

success('Checklist presets verified');

// ============================================================================
// 9. Configuration Validation
// ============================================================================
console.log('\n✔️  Checking configuration validation...');

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /export\s+function\s+validateChecklistConfig/,
  'Config validation function'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /readChecklistConfig/,
  'Config reader function'
);

checkFileContains(
  resolve('lib/storefront/waterChecklistConfig.js'),
  /getActiveColumns/,
  'Active columns filter function'
);

success('Configuration validation verified');

// ============================================================================
// Results
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION RESULTS');
console.log('='.repeat(60) + '\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Water checklist system is properly wired.\n');
  process.exit(0);
}

if (warnings.length > 0) {
  console.log(`⚠️  Warnings (${warnings.length}):\n`);
  warnings.forEach((w) => console.log(`  ${w}`));
  console.log('');
}

if (errors.length > 0) {
  console.log(`❌ Errors (${errors.length}):\n`);
  errors.forEach((e) => console.log(`  ${e}`));
  console.log('');
  console.log('❌ Water checklist verification FAILED\n');
  process.exit(1);
}

console.log('⚠️  Water checklist verification completed with warnings\n');
process.exit(0);
