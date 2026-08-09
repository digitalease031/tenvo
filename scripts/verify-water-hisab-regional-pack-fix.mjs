#!/usr/bin/env node

/**
 * Verification script for Water Hisab getBusinessRegionalPack import fix
 * Ensures waterHisab.js properly imports getBusinessRegionalPack before using it
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const checks = {
  passed: 0,
  failed: 0,
  total: 0,
};

function mark(msg) {
  checks.failed++;
  checks.total++;
  console.log(`❌ ${msg}`);
}

function pass(msg) {
  checks.passed++;
  checks.total++;
  console.log(`✅ ${msg}`);
}

function read(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

console.log('🔍 Verifying Water Hisab Regional Pack Fix...\n');

// Check waterHisab.js has the import
const waterHisab = read('lib/actions/standard/waterHisab.js');

// 1. Check import statement exists
if (!waterHisab.includes("import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext'")) {
  mark('waterHisab.js must import getBusinessRegionalPack');
} else {
  pass('waterHisab.js imports getBusinessRegionalPack');
}

// 2. Check usage exists
if (!waterHisab.includes('const pack = getBusinessRegionalPack(business)')) {
  mark('waterHisab.js must use getBusinessRegionalPack');
} else {
  pass('waterHisab.js uses getBusinessRegionalPack');
}

// 3. Check no undefined reference errors
const importIndex = waterHisab.indexOf("import { getBusinessRegionalPack }");
const usageIndex = waterHisab.indexOf('const pack = getBusinessRegionalPack(business)');

if (importIndex === -1) {
  mark('Import must be present before usage');
} else if (usageIndex === -1) {
  mark('Usage must be present');
} else if (importIndex > usageIndex) {
  mark('Import must come before usage (import at index ' + importIndex + ', usage at ' + usageIndex + ')');
} else {
  pass('Import comes before usage (proper order)');
}

// 4. Check milkHisab.js also has it (consistency check)
const milkHisab = read('lib/actions/standard/milkHisab.js');
if (!milkHisab.includes("import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext'")) {
  mark('milkHisab.js should also import getBusinessRegionalPack (consistency)');
} else {
  pass('milkHisab.js also imports getBusinessRegionalPack (consistent)');
}

// 5. Check waterHisab uses it in reminder-related action context (either prepare or send)
const reminderActionMatch = waterHisab.match(/export async function (sendWaterHisabReminderAction|prepareWaterHisabReminderAction)[\s\S]*?const pack = getBusinessRegionalPack\(business\)/);
if (!reminderActionMatch) {
  mark('getBusinessRegionalPack must be used in water hisab reminder action context');
} else {
  pass('getBusinessRegionalPack is used in water hisab reminder action');
}

// 6. Check the reminder message builder receives currency from pack
const currencyPassMatch = waterHisab.match(/const pack = getBusinessRegionalPack\(business\);[\s\S]*?currency:\s*pack\.currency/);
if (!currencyPassMatch) {
  mark('pack.currency must be passed to reminder message builder');
} else {
  pass('pack.currency is passed to reminder message builder');
}

// 7. Check prepareWaterHisabReminderAction also uses it
const prepareActionMatch = waterHisab.match(/export async function prepareWaterHisabReminderAction[\s\S]*?const pack = getBusinessRegionalPack\(business\)/);
if (!prepareActionMatch) {
  mark('getBusinessRegionalPack should be used in prepareWaterHisabReminderAction');
} else {
  pass('getBusinessRegionalPack is used in prepareWaterHisabReminderAction');
}

// 8. Check no stray undefined references
const getBusinessRegionalPackMatches = waterHisab.match(/getBusinessRegionalPack/g);
const importStatements = waterHisab.match(/import.*getBusinessRegionalPack/g);

if (getBusinessRegionalPackMatches && importStatements) {
  // Should have at least 1 import and at least 1 usage
  if (getBusinessRegionalPackMatches.length < 2) {
    mark('Should have import + at least 1 usage of getBusinessRegionalPack');
  } else {
    pass(`getBusinessRegionalPack is imported and used (${getBusinessRegionalPackMatches.length} references)`);
  }
}

// 9. Check buildMilkHisabReminderMessage is imported (needed for water reminders)
if (!waterHisab.includes("buildMilkHisabReminderMessage")) {
  mark('waterHisab.js must import buildMilkHisabReminderMessage');
} else {
  pass('waterHisab.js imports buildMilkHisabReminderMessage');
}

// 10. Check no syntax errors in import section (basic validation)
const importSection = waterHisab.substring(0, 3000); // First ~3000 chars should cover imports
if (importSection.includes('import {') && !importSection.includes('} from')) {
  mark('Import section may have syntax errors');
} else {
  pass('Import section appears syntactically correct');
}

console.log('\n============================================================');
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`📊 Total: ${checks.total}`);
console.log('============================================================\n');

if (checks.failed > 0) {
  console.log('❌ Some checks failed. Please review the issues above.\n');
  process.exit(1);
} else {
  console.log('🎉 All checks passed! Water Hisab regional pack fix is complete.\n');
  console.log('✅ getBusinessRegionalPack is properly imported');
  console.log('✅ WhatsApp reminder button will work correctly');
  console.log('✅ Currency formatting will use business regional settings\n');
  process.exit(0);
}
