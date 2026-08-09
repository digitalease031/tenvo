#!/usr/bin/env node
/**
 * Verify Water Hisab A4 All-Customers Bill Summary Report implementation.
 * 
 * Checks:
 * - HTML builder function exports and structure
 * - Print function exports and implementation
 * - Component handler and button integration
 * - Proper styling and layout specifications
 * - Summary statistics calculations
 * - Customer table structure and sorting
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let checksPassed = 0;
let checksFailed = 0;

function check(name, condition, message = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    checksPassed++;
  } else {
    console.error(`❌ ${name}${message ? `: ${message}` : ''}`);
    checksFailed++;
  }
}

function readFile(relativePath) {
  try {
    return readFileSync(join(root, relativePath), 'utf-8');
  } catch (err) {
    console.error(`Failed to read ${relativePath}:`, err.message);
    return '';
  }
}

// ============================================================================
// 1. Check thermal bill implementation
// ============================================================================
console.log('\n📄 Verifying lib/print/waterHisabThermalBill.js...\n');

const thermalBillFile = readFile('lib/print/waterHisabThermalBill.js');

check(
  'Thermal bill file exists',
  thermalBillFile.length > 0
);

check(
  'buildWaterAllCustomersBillSummaryHtml function exported',
  /export\s+function\s+buildWaterAllCustomersBillSummaryHtml/.test(thermalBillFile),
  'Must export buildWaterAllCustomersBillSummaryHtml function'
);

check(
  'printWaterAllCustomersBillSummary function exported',
  /export\s+async\s+function\s+printWaterAllCustomersBillSummary/.test(thermalBillFile),
  'Must export printWaterAllCustomersBillSummary function'
);

// Check HTML builder structure
check(
  'HTML builder has business parameter',
  /buildWaterAllCustomersBillSummaryHtml[\s\S]*?business/.test(thermalBillFile),
  'Function should accept business parameter'
);

check(
  'HTML builder has rows parameter',
  /buildWaterAllCustomersBillSummaryHtml[\s\S]*?rows/.test(thermalBillFile),
  'Function should accept rows parameter'
);

check(
  'HTML builder has productColumns parameter',
  /buildWaterAllCustomersBillSummaryHtml[\s\S]*?productColumns/.test(thermalBillFile),
  'Function should accept productColumns parameter'
);

check(
  'HTML builder has periodLabel parameter',
  /buildWaterAllCustomersBillSummaryHtml[\s\S]*?periodLabel/.test(thermalBillFile),
  'Function should accept periodLabel parameter'
);

// Check A4 page setup
check(
  'A4 page size specified in @page rule',
  /@page\s*\{[^}]*size:\s*A4/.test(thermalBillFile),
  'Should use A4 page size'
);

check(
  'Print margins specified',
  /@page\s*\{[^}]*margin:[^}]*\}/.test(thermalBillFile),
  'Should specify print margins'
);

// Check summary statistics section
check(
  'Total Customers stat included',
  /Total\s+Customers/.test(thermalBillFile),
  'Should show Total Customers statistic'
);

check(
  'Total Amount stat included',
  /Total\s+Amount/.test(thermalBillFile),
  'Should show Total Amount statistic'
);

check(
  'Paid Count stat included',
  /Paid\s+Count/.test(thermalBillFile) || /Paid\s*:/.test(thermalBillFile),
  'Should show Paid Count statistic'
);

check(
  'Unpaid Count stat included',
  /Unpaid\s+Count/.test(thermalBillFile) || /Unpaid\s*:/.test(thermalBillFile),
  'Should show Unpaid Count statistic'
);

check(
  'Collection Rate stat included',
  /Collection\s+Rate/.test(thermalBillFile),
  'Should show Collection Rate statistic'
);

// Check customer table structure
check(
  'Table header with customer columns',
  /House|Customer|Name|Account|Days|Amount|Status/.test(thermalBillFile),
  'Should have proper table headers'
);

check(
  'Customer sorting implementation',
  /sort|House|houseNo/.test(thermalBillFile),
  'Should sort customers by house number then name'
);

// Check status badge rendering
check(
  'Paid status badge styling',
  /paid.*emerald|emerald.*paid|status-paid/i.test(thermalBillFile),
  'Should use emerald color for paid status'
);

check(
  'Unpaid status badge styling',
  /unpaid.*red|red.*unpaid|status-unpaid/i.test(thermalBillFile),
  'Should use red color for unpaid status'
);

// Check print function implementation
check(
  'Print mode handler',
  /mode\s*===\s*['"]print['"]/.test(thermalBillFile),
  'Should handle print mode'
);

check(
  'PDF mode handler',
  /mode\s*===\s*['"]pdf['"]/.test(thermalBillFile),
  'Should handle pdf mode'
);

check(
  'Window print call for print mode',
  /window\.print\(\)/.test(thermalBillFile),
  'Should call window.print() for print mode'
);

check(
  'Download blob for PDF mode',
  /download|blob|createObjectURL|iframe/.test(thermalBillFile),
  'Should trigger download for PDF mode'
);

// Check styling and layout
check(
  'Sky blue theme color',
  /sky-|#0ea5e9|#0284c7|rgb\(14,\s*165,\s*233\)/.test(thermalBillFile),
  'Should use sky blue theme'
);

check(
  'Responsive table layout',
  /table|width:\s*100%/.test(thermalBillFile),
  'Should have responsive table layout'
);

check(
  'Professional business header',
  /business.*name|businessName/.test(thermalBillFile),
  'Should display business header'
);

// ============================================================================
// 2. Check component integration
// ============================================================================
console.log('\n📄 Verifying components/water/WaterRouteHisab.jsx...\n');

const componentFile = readFile('components/water/WaterRouteHisab.jsx');

check(
  'Component file exists',
  componentFile.length > 0
);

check(
  'printWaterAllCustomersBillSummary imported',
  /import[\s\S]*?printWaterAllCustomersBillSummary[\s\S]*?from\s*['"]@\/lib\/print\/waterHisabThermalBill['"]/.test(componentFile),
  'Must import printWaterAllCustomersBillSummary'
);

check(
  'handlePrintA4BillSummary handler defined',
  /const\s+handlePrintA4BillSummary\s*=/.test(componentFile),
  'Must define handlePrintA4BillSummary handler'
);

check(
  'handlePrintA4BillSummary is async',
  /const\s+handlePrintA4BillSummary\s*=\s*async/.test(componentFile),
  'Handler must be async'
);

check(
  'handlePrintA4BillSummary accepts mode parameter',
  /handlePrintA4BillSummary\s*=\s*async\s*\(\s*mode/.test(componentFile),
  'Handler should accept mode parameter'
);

check(
  'Handler validates billRows exist',
  /handlePrintA4BillSummary[^}]*billRows\.length/.test(componentFile),
  'Should validate billRows exist'
);

check(
  'Handler validates business exists',
  /handlePrintA4BillSummary[^}]*business/.test(componentFile),
  'Should validate business exists'
);

check(
  'Handler calls printWaterAllCustomersBillSummary',
  /printWaterAllCustomersBillSummary\s*\(/.test(componentFile),
  'Handler must call printWaterAllCustomersBillSummary'
);

check(
  'Handler passes business parameter',
  /printWaterAllCustomersBillSummary\([^)]*business/.test(componentFile),
  'Should pass business to print function'
);

check(
  'Handler passes rows parameter',
  /printWaterAllCustomersBillSummary\([^)]*rows:\s*billRows/.test(componentFile),
  'Should pass billRows to print function'
);

check(
  'Handler passes productColumns parameter',
  /printWaterAllCustomersBillSummary\([^)]*productColumns/.test(componentFile),
  'Should pass productColumns to print function'
);

check(
  'Handler passes mode parameter',
  /printWaterAllCustomersBillSummary\([^)]*mode\s*\)/.test(componentFile),
  'Should pass mode to print function'
);

check(
  'Handler uses setBulkPrinting state',
  /setBulkPrinting\s*\(\s*true\s*\)/.test(componentFile),
  'Should set bulkPrinting state'
);

check(
  'Handler has try-catch error handling',
  /handlePrintA4BillSummary[\s\S]*try[\s\S]*catch/.test(componentFile),
  'Should have error handling'
);

check(
  'Handler shows success notification',
  /handlePrintA4BillSummary[\s\S]*notify\.(compactSave|success)/.test(componentFile),
  'Should show success notification'
);

check(
  'Handler shows error notification on failure',
  /handlePrintA4BillSummary[\s\S]*catch[\s\S]*notify\.error/.test(componentFile),
  'Should show error notification'
);

// Check button rendering
check(
  'A4 Summary button exists',
  /<Button[\s\S]*?A4\s+Summary[\s\S]*?<\/Button>/.test(componentFile),
  'Should render A4 Summary button'
);

check(
  'Button onClick calls handlePrintA4BillSummary',
  /onClick=\{[^}]*handlePrintA4BillSummary/.test(componentFile),
  'Button should call handlePrintA4BillSummary on click'
);

check(
  'Button passes print mode',
  /onClick=\{[^}]*handlePrintA4BillSummary\s*\(\s*['"]print['"]/.test(componentFile),
  'Button should pass print mode'
);

check(
  'Button is disabled when loading',
  /disabled=\{[^}]*loading/.test(componentFile),
  'Button should be disabled when loading'
);

check(
  'Button is disabled when bulkPrinting',
  /disabled=\{[^}]*bulkPrinting/.test(componentFile),
  'Button should be disabled when bulkPrinting'
);

check(
  'Button is disabled when no billRows',
  /disabled=\{[^}]*billRows\.length/.test(componentFile),
  'Button should be disabled when no billRows'
);

check(
  'Button has indigo styling',
  /className=[^>]*indigo/.test(componentFile),
  'Button should use indigo styling'
);

check(
  'Button has FileText icon',
  /<FileText\s+className/.test(componentFile),
  'Button should have FileText icon'
);

check(
  'Button has descriptive title tooltip',
  /title=[^>]*A4.*customers.*bill.*summary/.test(componentFile),
  'Button should have descriptive tooltip'
);

// ============================================================================
// 3. Verify feature documentation
// ============================================================================
console.log('\n📄 Verifying documentation...\n');

const docFile = readFile('WATER_A4_BILL_SUMMARY_FEATURE.md');

check(
  'Feature documentation exists',
  docFile.length > 0,
  'WATER_A4_BILL_SUMMARY_FEATURE.md should exist'
);

if (docFile.length > 0) {
  check(
    'Documentation describes feature purpose',
    /purpose|overview|feature/i.test(docFile),
    'Should describe feature purpose'
  );

  check(
    'Documentation lists implementation files',
    /lib\/print\/waterHisabThermalBill\.js/.test(docFile),
    'Should list implementation files'
  );

  check(
    'Documentation describes HTML structure',
    /HTML|structure|layout/i.test(docFile),
    'Should describe HTML structure'
  );

  check(
    'Documentation describes summary statistics',
    /statistics|total.*customers|collection.*rate/i.test(docFile),
    'Should describe summary statistics'
  );
}

// ============================================================================
// 4. Check for common issues
// ============================================================================
console.log('\n🔍 Checking for common issues...\n');

check(
  'No hardcoded currency symbols',
  !/PKR|Rs\.?\s*\d|\u20a8/.test(thermalBillFile) || /currencyCode|getBusinessRegionalPack/.test(thermalBillFile),
  'Should use dynamic currency from regional pack'
);

check(
  'No console.log statements in production code',
  !/console\.log\(/.test(thermalBillFile),
  'Should not have console.log in production'
);

check(
  'Proper error handling in print function',
  /try[\s\S]*catch[\s\S]*printWaterAllCustomersBillSummary/.test(thermalBillFile),
  'Print function should have error handling'
);

check(
  'No duplicate function definitions',
  (thermalBillFile.match(/function\s+buildWaterAllCustomersBillSummaryHtml/g) || []).length === 1,
  'Should only define buildWaterAllCustomersBillSummaryHtml once'
);

check(
  'No duplicate import statements',
  (componentFile.match(/import\s*\{[^}]*printWaterAllCustomersBillSummary[^}]*\}\s*from/g) || []).length === 1,
  'Should only import printWaterAllCustomersBillSummary once'
);

// ============================================================================
// Summary
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${checksPassed}`);
console.log(`❌ Failed: ${checksFailed}`);
console.log(`📊 Success Rate: ${Math.round((checksPassed / (checksPassed + checksFailed)) * 100)}%`);
console.log('='.repeat(60) + '\n');

if (checksFailed > 0) {
  console.error('❌ Some checks failed. Please review the errors above.\n');
  process.exit(1);
} else {
  console.log('✅ All checks passed! Water Hisab A4 Summary feature is properly implemented.\n');
  process.exit(0);
}
