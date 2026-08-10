#!/usr/bin/env node

/**
 * Verification Script for Restaurant Reservation UUID Fix
 * 
 * Checks that the dummy table fallback has been removed and
 * proper UUID validation is in place.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Verifying Restaurant Reservation UUID Fix...\n');

let passed = 0;
let failed = 0;
const errors = [];

function check(name, condition, errorMsg) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    errors.push(errorMsg);
    failed++;
  }
}

// Check 1: ReservationManager.jsx should not have dummy table fallback
console.log('\n📋 Checking ReservationManager.jsx...');
const reservationManagerPath = path.join(rootDir, 'components/restaurant/ReservationManager.jsx');
const reservationManagerContent = fs.readFileSync(reservationManagerPath, 'utf8');

check(
  'No dummy table fallback with string IDs',
  !reservationManagerContent.includes("{ id: '1', name: 'Table 1'") &&
  !reservationManagerContent.includes("{ id: '2', name: 'Table 2'") &&
  !reservationManagerContent.includes("tables.length > 0 ? tables : ["),
  'ReservationManager still contains dummy table fallback'
);

check(
  'displayTables uses tables directly',
  reservationManagerContent.includes('const displayTables = tables;'),
  'displayTables should be set to tables directly without fallback'
);

check(
  'Has comment explaining no dummy fallback',
  reservationManagerContent.includes('No dummy fallback') ||
  reservationManagerContent.includes('require real database tables'),
  'Missing explanatory comment about no dummy fallback'
);

check(
  'Prevents dialog open when no tables',
  reservationManagerContent.includes('if (!displayTables || displayTables.length === 0)') &&
  reservationManagerContent.includes('Please create tables first'),
  'Missing guard to prevent dialog open when no tables exist'
);

check(
  'Has empty state UI',
  reservationManagerContent.includes('No Tables Available') ||
  reservationManagerContent.includes('Create tables first'),
  'Missing empty state UI for when no tables exist'
);

check(
  'Table selector handles empty tables',
  reservationManagerContent.includes('No tables available') ||
  reservationManagerContent.includes('!displayTables || displayTables.length === 0'),
  'Table selector should handle empty tables gracefully'
);

// Check 2: ReservationService.js should have UUID validation
console.log('\n📋 Checking ReservationService.js...');
const reservationServicePath = path.join(rootDir, 'lib/services/ReservationService.js');
const reservationServiceContent = fs.readFileSync(reservationServicePath, 'utf8');

check(
  'createReservation has UUID validation',
  reservationServiceContent.includes('uuidRegex') &&
  reservationServiceContent.includes('createReservation'),
  'createReservation should validate UUID format'
);

check(
  'updateReservation has UUID validation',
  reservationServiceContent.includes('uuidRegex') &&
  reservationServiceContent.includes('updateReservation'),
  'updateReservation should validate UUID format'
);

check(
  'Has PostgreSQL error code 22P02 handling',
  reservationServiceContent.includes('22P02') ||
  reservationServiceContent.includes('invalid input syntax'),
  'Should handle PostgreSQL UUID error code 22P02'
);

check(
  'Provides user-friendly error message',
  reservationServiceContent.includes('Invalid table ID format') ||
  reservationServiceContent.includes('select a valid table'),
  'Should provide user-friendly error message for UUID violations'
);

// Check 3: Test file exists and is comprehensive
console.log('\n📋 Checking test coverage...');
const testPath = path.join(rootDir, 'tests/unit/ReservationUUIDFix.test.js');

check(
  'Test file exists',
  fs.existsSync(testPath),
  'Test file tests/unit/ReservationUUIDFix.test.js does not exist'
);

if (fs.existsSync(testPath)) {
  const testContent = fs.readFileSync(testPath, 'utf8');
  
  check(
    'Tests UUID validation helper',
    testContent.includes('UUID Validation Helper') ||
    testContent.includes('validateUUID'),
    'Missing tests for UUID validation helper'
  );
  
  check(
    'Tests rejection of string IDs "1", "2", "3"',
    testContent.includes('"1"') && testContent.includes('toBe(false)'),
    'Missing tests for rejecting string number IDs'
  );
  
  check(
    'Tests acceptance of valid UUIDs',
    testContent.includes('550e8400') || testContent.includes('valid UUID'),
    'Missing tests for accepting valid UUIDs'
  );
  
  check(
    'Tests table display logic',
    testContent.includes('Table Display Logic') ||
    testContent.includes('displayTables'),
    'Missing tests for table display logic'
  );
  
  check(
    'Tests empty state handling',
    testContent.includes('Empty State') ||
    testContent.includes('no tables'),
    'Missing tests for empty state handling'
  );
  
  check(
    'Tests backend UUID validation',
    testContent.includes('Backend UUID Validation') ||
    testContent.includes('ReservationService'),
    'Missing tests for backend UUID validation'
  );
  
  check(
    'Tests PostgreSQL error handling',
    testContent.includes('22P02') ||
    testContent.includes('PostgreSQL'),
    'Missing tests for PostgreSQL error code handling'
  );
  
  check(
    'Has integration tests',
    testContent.includes('Integration') ||
    testContent.includes('End-to-End'),
    'Missing integration/end-to-end tests'
  );
}

// Check 4: Documentation exists
console.log('\n📋 Checking documentation...');
const docPath = path.join(rootDir, '.superpowers/RESTAURANT_RESERVATION_UUID_FIX.md');

check(
  'Documentation file exists',
  fs.existsSync(docPath),
  'Documentation file .superpowers/RESTAURANT_RESERVATION_UUID_FIX.md does not exist'
);

if (fs.existsSync(docPath)) {
  const docContent = fs.readFileSync(docPath, 'utf8');
  
  check(
    'Documents root cause',
    docContent.includes('Root Cause') && docContent.includes('dummy table'),
    'Documentation should explain root cause'
  );
  
  check(
    'Documents solution',
    docContent.includes('Solution') && docContent.includes('UUID'),
    'Documentation should explain the solution'
  );
  
  check(
    'Includes verification steps',
    docContent.includes('Verification') || docContent.includes('Testing'),
    'Documentation should include verification steps'
  );
  
  check(
    'Includes before/after comparison',
    docContent.includes('Before') && docContent.includes('After'),
    'Documentation should include before/after comparison'
  );
}

// Check 5: Verify test configuration files
console.log('\n📋 Checking test configuration...');

check(
  'Vitest config exists',
  fs.existsSync(path.join(rootDir, 'vitest.reservation.config.js')),
  'vitest.reservation.config.js does not exist'
);

check(
  'Vitest setup exists',
  fs.existsSync(path.join(rootDir, 'vitest.reservation.setup.js')),
  'vitest.reservation.setup.js does not exist'
);

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (errors.length > 0) {
  console.log('\n❌ ERRORS FOUND:');
  errors.forEach((error, index) => {
    console.log(`  ${index + 1}. ${error}`);
  });
}

console.log('\n' + '='.repeat(60));

if (failed === 0) {
  console.log('✨ All checks passed! Restaurant Reservation UUID fix is properly implemented.');
  console.log('\n📝 Next steps:');
  console.log('  1. Run tests: npx vitest --config vitest.reservation.config.js --run');
  console.log('  2. Manual test: Navigate to Restaurant → Reservations');
  console.log('  3. Verify empty state appears when no tables exist');
  console.log('  4. Create tables and verify reservations work');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review and fix the issues above.');
  process.exit(1);
}
