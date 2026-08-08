#!/usr/bin/env node
/**
 * Verification script for Water Hisab Settings Enhancement
 * Tests column visibility, checklist mode, and WhatsApp reminder functionality
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

let passedChecks = 0;
let failedChecks = 0;

function check(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
    passedChecks++;
  } else {
    console.log(`❌ ${description}`);
    failedChecks++;
  }
}

function readFile(relativePath) {
  try {
    return readFileSync(join(rootDir, relativePath), 'utf-8');
  } catch (e) {
    return '';
  }
}

console.log('🔍 Verifying Water Hisab Settings Enhancement...\n');

// ==========================================
// 1. Check Constants in waterShopHisab.js
// ==========================================
console.log('═══════════════════════════════════════════════════════════');
console.log('           CONSTANTS & HELPERS CHECK');
console.log('═══════════════════════════════════════════════════════════\n');

const waterShopHisab = readFile('lib/storefront/waterShopHisab.js');

check(
  'WATER_HISAB_COLUMN_TYPES constant exists',
  /export const WATER_HISAB_COLUMN_TYPES\s*=/.test(waterShopHisab)
);

check(
  'WATER_HISAB_COLUMN_TYPES includes delivered and received',
  /delivered.*label.*Delivered/.test(waterShopHisab) && 
  /received.*label.*Received/.test(waterShopHisab)
);

check(
  'WATER_HISAB_DEFAULT_ENABLED_COLUMNS constant exists',
  /export const WATER_HISAB_DEFAULT_ENABLED_COLUMNS/.test(waterShopHisab)
);

check(
  'WATER_HISAB_CHECKLIST_MODES constant exists',
  /export const WATER_HISAB_CHECKLIST_MODES\s*=/.test(waterShopHisab)
);

check(
  'WATER_HISAB_CHECKLIST_MODES includes rider_wise and full_list',
  /RIDER_WISE:\s*['"]rider_wise['"]/.test(waterShopHisab) &&
  /FULL_LIST:\s*['"]full_list['"]/.test(waterShopHisab)
);

check(
  'WATER_HISAB_DEFAULT_CHECKLIST_MODE constant exists',
  /export const WATER_HISAB_DEFAULT_CHECKLIST_MODE/.test(waterShopHisab)
);

check(
  'readWaterHisabEnabledColumns function exists',
  /export function readWaterHisabEnabledColumns/.test(waterShopHisab)
);

check(
  'readWaterHisabChecklistMode function exists',
  /export function readWaterHisabChecklistMode/.test(waterShopHisab)
);

// ==========================================
// 2. Check Server Action Updates
// ==========================================
console.log('\n═══════════════════════════════════════════════════════════');
console.log('           SERVER ACTION CHECK');
console.log('═══════════════════════════════════════════════════════════\n');

const waterHisabActions = readFile('lib/actions/standard/waterHisab.js');

check(
  'Import WATER_HISAB_COLUMN_TYPES',
  /import\s*\{[^}]*WATER_HISAB_COLUMN_TYPES[^}]*\}\s*from/.test(waterHisabActions)
);

check(
  'Import WATER_HISAB_CHECKLIST_MODES',
  /import\s*\{[^}]*WATER_HISAB_CHECKLIST_MODES[^}]*\}\s*from/.test(waterHisabActions)
);

check(
  'Import readWaterHisabEnabledColumns',
  /import\s*\{[^}]*readWaterHisabEnabledColumns[^}]*\}\s*from/.test(waterHisabActions)
);

check(
  'Import readWaterHisabChecklistMode',
  /import\s*\{[^}]*readWaterHisabChecklistMode[^}]*\}\s*from/.test(waterHisabActions)
);

check(
  'saveWaterHisabSheetSettingsAction accepts enabledColumns parameter',
  /saveWaterHisabSheetSettingsAction[^{]*\{[^}]*enabledColumns/.test(waterHisabActions)
);

check(
  'saveWaterHisabSheetSettingsAction accepts checklistMode parameter',
  /saveWaterHisabSheetSettingsAction[^{]*\{[^}]*checklistMode/.test(waterHisabActions)
);

check(
  'saveWaterHisabSheetSettingsAction validates enabledColumns',
  /allowedColumns.*Set.*delivered.*received/.test(waterHisabActions) ||
  /nextColumns/.test(waterHisabActions)
);

check(
  'saveWaterHisabSheetSettingsAction validates checklistMode',
  /validModes.*rider_wise.*full_list/.test(waterHisabActions) ||
  /nextChecklistMode/.test(waterHisabActions)
);

check(
  'getWaterHisabDayAction calls readWaterHisabEnabledColumns',
  /readWaterHisabEnabledColumns\s*\(/.test(waterHisabActions)
);

check(
  'getWaterHisabDayAction calls readWaterHisabChecklistMode',
  /readWaterHisabChecklistMode\s*\(/.test(waterHisabActions)
);

check(
  'getWaterHisabDayAction returns enabledColumns',
  /enabledColumns[,\s]/.test(waterHisabActions)
);

check(
  'getWaterHisabDayAction returns checklistMode',
  /checklistMode[,\s]/.test(waterHisabActions)
);

check(
  'getWaterHisabDayAction returns columnTypes metadata',
  /columnTypes.*WATER_HISAB_COLUMN_TYPES/.test(waterHisabActions)
);

// ==========================================
// 3. Check Component Implementation
// ==========================================
console.log('\n═══════════════════════════════════════════════════════════');
console.log('           COMPONENT CHECK');
console.log('═══════════════════════════════════════════════════════════\n');

const waterRouteHisab = readFile('components/water/WaterRouteHisab.jsx');

check(
  'Import WATER_HISAB_COLUMN_TYPES in component',
  /import\s*\{[^}]*WATER_HISAB_COLUMN_TYPES[^}]*\}\s*from/.test(waterRouteHisab)
);

check(
  'Import WATER_HISAB_CHECKLIST_MODES in component',
  /import\s*\{[^}]*WATER_HISAB_CHECKLIST_MODES[^}]*\}\s*from/.test(waterRouteHisab)
);

check(
  'enabledColumns state variable exists',
  /\[enabledColumns,\s*setEnabledColumns\]/.test(waterRouteHisab)
);

check(
  'checklistMode state variable exists',
  /\[checklistMode,\s*setChecklistMode\]/.test(waterRouteHisab)
);

check(
  'toggleSheetColumn function exists',
  /const toggleSheetColumn\s*=|function toggleSheetColumn/.test(waterRouteHisab)
);

check(
  'toggleChecklistMode function exists',
  /const toggleChecklistMode\s*=|function toggleChecklistMode/.test(waterRouteHisab)
);

check(
  'loadDay sets enabledColumns from response',
  /setEnabledColumns\(res\.enabledColumns/.test(waterRouteHisab)
);

check(
  'loadDay sets checklistMode from response',
  /setChecklistMode\(res\.checklistMode/.test(waterRouteHisab)
);

check(
  'toggleSheetColumn calls saveWaterHisabSheetSettingsAction',
  /toggleSheetColumn[\s\S]{0,500}saveWaterHisabSheetSettingsAction/.test(waterRouteHisab)
);

check(
  'toggleChecklistMode calls saveWaterHisabSheetSettingsAction',
  /toggleChecklistMode[\s\S]{0,500}saveWaterHisabSheetSettingsAction/.test(waterRouteHisab)
);

check(
  'UI renders column type toggles',
  /WATER_HISAB_COLUMN_TYPES\.map/.test(waterRouteHisab)
);

check(
  'UI renders checklist mode toggle button',
  /checklistMode === 'rider_wise'/.test(waterRouteHisab) &&
  /checklistMode === 'full_list'/.test(waterRouteHisab)
);

check(
  'handlePrintRiderChecklist respects checklistMode',
  /handlePrintRiderChecklist[\s\S]{0,800}checklistMode === 'rider_wise'/.test(waterRouteHisab)
);

check(
  'handlePrintRiderAreaList respects checklistMode',
  /handlePrintRiderAreaList[\s\S]{0,800}checklistMode === 'rider_wise'/.test(waterRouteHisab)
);

// ==========================================
// 4. Check WhatsApp Reminder Integration
// ==========================================
console.log('\n═══════════════════════════════════════════════════════════');
console.log('           WHATSAPP REMINDER CHECK');
console.log('═══════════════════════════════════════════════════════════\n');

check(
  'sendWaterHisabReminderAction exists',
  /export async function sendWaterHisabReminderAction/.test(waterHisabActions)
);

check(
  'prepareWaterHisabReminderAction exists',
  /export async function prepareWaterHisabReminderAction/.test(waterHisabActions)
);

check(
  'sendWaterHisabReminderAction supports whatsapp channel',
  /sendWaterHisabReminderAction[\s\S]{0,2000}channels.*whatsapp/.test(waterHisabActions)
);

check(
  'prepareWaterHisabReminderAction builds WhatsApp URL',
  /buildMilkHisabWhatsAppUrl/.test(waterHisabActions)
);

check(
  'handleRemindCustomer function exists in component',
  /const handleRemindCustomer\s*=|function handleRemindCustomer/.test(waterRouteHisab)
);

check(
  'handleRemindCustomer accepts channels parameter',
  /handleRemindCustomer.*channels/.test(waterRouteHisab)
);

check(
  'handleRemindCustomer calls sendWaterHisabReminderAction',
  /sendWaterHisabReminderAction/.test(waterRouteHisab)
);

check(
  'handleRemindCustomer opens WhatsApp URL',
  /openWhatsApp\(res\.whatsappUrl\)/.test(waterRouteHisab)
);

check(
  'BillsActionCluster has WhatsApp reminder button',
  /BillsActionCluster[\s\S]{0,2000}onRemindWhatsApp/.test(waterRouteHisab)
);

check(
  'BillsActionCluster passes onRemindWhatsApp handler',
  /onRemindWhatsApp=\{.*\(row\).*handleRemindCustomer/.test(waterRouteHisab)
);

check(
  'WhatsApp reminder button has MessageCircle icon',
  /onRemindWhatsApp[\s\S]{0,300}MessageCircle/.test(waterRouteHisab)
);

check(
  'Reminders disabled when offline',
  /remindersDisabled=\{!isOnline\}/.test(waterRouteHisab)
);

// ==========================================
// 5. Check UI Polish and UX
// ==========================================
console.log('\n═══════════════════════════════════════════════════════════');
console.log('           UI/UX CHECK');
console.log('═══════════════════════════════════════════════════════════\n');

check(
  'Column toggles use emerald color scheme',
  /border-emerald-300.*bg-emerald-50.*text-emerald-800/.test(waterRouteHisab)
);

check(
  'Checklist mode button uses purple/orange colors',
  /border-purple-300.*bg-purple-50.*text-purple-800/.test(waterRouteHisab) &&
  /border-orange-300.*bg-orange-50.*text-orange-800/.test(waterRouteHisab)
);

check(
  'Toggles have tooltips',
  /title=\{.*?\}/.test(waterRouteHisab)
);

check(
  'Toast notifications on toggle',
  /notify\.compactSave/.test(waterRouteHisab) ||
  /notify\.error/.test(waterRouteHisab)
);

check(
  'Prevents disabling all columns',
  /Keep at least one.*enabled/.test(waterRouteHisab)
);

check(
  'Shows mode indicator in notification',
  /Full List|Rider Filter/.test(waterRouteHisab)
);

check(
  'Checklist mode indicator shows emojis',
  /👤.*Rider Filter|📋.*Full List/.test(waterRouteHisab)
);

// ==========================================
// Summary
// ==========================================
console.log('\n═══════════════════════════════════════════════════════════');
console.log(`✅ Passed: ${passedChecks}`);
console.log(`❌ Failed: ${failedChecks}`);
console.log(`📊 Total: ${passedChecks + failedChecks}`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failedChecks === 0) {
  console.log('🎉 All checks passed! Water Hisab settings enhancement is complete.\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failedChecks} check(s) failed. Please review the implementation.\n`);
  process.exit(1);
}
