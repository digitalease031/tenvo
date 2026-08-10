#!/usr/bin/env node
/**
 * Verification script for Water Hisab performance fixes and expense bug
 * Run: node scripts/verify-water-hisab-fixes.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const CHECKS = [];
let passCount = 0;
let failCount = 0;

function check(name, fn) {
  CHECKS.push({ name, fn });
}

function pass(msg) {
  console.log(`✅ ${msg}`);
  passCount++;
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  failCount++;
}

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
}

// Check 1: Migration file exists
check('Migration file created', () => {
  const migrationPath = join(rootDir, 'prisma/migrations/20260810000001_water_hisab_performance_indexes/migration.sql');
  if (existsSync(migrationPath)) {
    pass('Migration file exists');
    const content = readFileSync(migrationPath, 'utf8');
    if (content.includes('idx_water_stops_business_date_deleted')) {
      pass('  └─ Contains idx_water_stops_business_date_deleted');
    } else {
      fail('  └─ Missing idx_water_stops_business_date_deleted');
    }
    if (content.includes('idx_water_stops_business_date_customer')) {
      pass('  └─ Contains idx_water_stops_business_date_customer');
    } else {
      fail('  └─ Missing idx_water_stops_business_date_customer');
    }
    if (content.includes('idx_invoices_business_notes_trgm')) {
      pass('  └─ Contains idx_invoices_business_notes_trgm');
    } else {
      fail('  └─ Missing idx_invoices_business_notes_trgm');
    }
  } else {
    fail('Migration file not found');
  }
});

// Check 2: WaterRouteHisab expense-saved listener
check('WaterRouteHisab expense listener', () => {
  const filePath = join(rootDir, 'components/water/WaterRouteHisab.jsx');
  if (!existsSync(filePath)) {
    fail('WaterRouteHisab.jsx not found');
    return;
  }
  const content = readFileSync(filePath, 'utf8');
  if (content.includes('expense-saved')) {
    pass('WaterRouteHisab listens for expense-saved event');
    if (content.includes('loadExpenses(expensePeriodKey)')) {
      pass('  └─ Calls loadExpenses on expense-saved');
    } else {
      fail('  └─ Does not call loadExpenses');
    }
  } else {
    fail('WaterRouteHisab missing expense-saved listener');
  }
});

// Check 3: ExpenseEntryForm emits event
check('ExpenseEntryForm emits expense-saved', () => {
  const filePath = join(rootDir, 'components/ExpenseEntryForm.jsx');
  if (!existsSync(filePath)) {
    fail('ExpenseEntryForm.jsx not found');
    return;
  }
  const content = readFileSync(filePath, 'utf8');
  if (content.includes("window.dispatchEvent(new CustomEvent('expense-saved'")) {
    pass('ExpenseEntryForm emits expense-saved event');
  } else {
    fail('ExpenseEntryForm does not emit expense-saved event');
  }
});

// Check 4: Period summary uses SQL aggregation
check('Period summary SQL optimization', () => {
  const filePath = join(rootDir, 'lib/actions/standard/waterHisab.js');
  if (!existsSync(filePath)) {
    fail('waterHisab.js not found');
    return;
  }
  const content = readFileSync(filePath, 'utf8');
  if (content.includes('WITH stop_aggregates AS')) {
    pass('Period summary uses CTE aggregation');
    if (content.includes('jsonb_object_agg')) {
      pass('  └─ Uses jsonb_object_agg for efficiency');
    } else {
      warn('  └─ Missing jsonb_object_agg optimization');
    }
  } else {
    fail('Period summary still uses N+1 loop pattern');
  }
});

// Check 5: Customer ID backfill is debounced
check('Customer ID backfill throttling', () => {
  const filePath = join(rootDir, 'lib/actions/standard/waterHisab.js');
  if (!existsSync(filePath)) {
    fail('waterHisab.js not found');
    return;
  }
  const content = readFileSync(filePath, 'utf8');
  if (content.includes('water-customer-id-backfill')) {
    pass('Customer ID backfill uses localStorage throttle');
    if (content.includes('shouldBackfill()')) {
      pass('  └─ Has shouldBackfill check');
    } else {
      fail('  └─ Missing shouldBackfill function');
    }
  } else {
    fail('Customer ID backfill not throttled (runs on every load)');
  }
});

// Check 6: Sync product seed removed
check('Synchronous product seed removed', () => {
  const filePath = join(rootDir, 'lib/actions/standard/waterHisab.js');
  if (!existsSync(filePath)) {
    fail('waterHisab.js not found');
    return;
  }
  const content = readFileSync(filePath, 'utf8');
  if (!content.includes('await ensureWaterHisabCoreProducts(businessId)')) {
    pass('Synchronous core product seed removed from hot path');
  } else {
    warn('Synchronous product seed still in hot path (blocks first load)');
  }
});

// Check 7: Plan gate verification
check('Starter plan has expense_tracking', () => {
  const filePath = join(rootDir, 'lib/config/plans.js');
  if (!existsSync(filePath)) {
    fail('plans.js not found');
    return;
  }
  const content = readFileSync(filePath, 'utf8');
  
  // Find Starter plan section (after FREE, before PROFESSIONAL)
  const starterMatch = content.match(/STARTER[\s\S]*?expense_tracking:\s*(true|false)/);
  if (starterMatch) {
    if (starterMatch[1] === 'true') {
      pass('Starter plan has expense_tracking enabled');
    } else {
      fail('Starter plan does NOT have expense_tracking (should be true)');
    }
  } else {
    fail('Could not find Starter plan expense_tracking config');
  }
});

// Run all checks
console.log('\n🔍 Verifying Water Hisab Fixes...\n');
for (const { name, fn } of CHECKS) {
  console.log(`\n📋 ${name}:`);
  try {
    fn();
  } catch (error) {
    fail(`Check failed with error: ${error.message}`);
  }
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log(`\n📊 Summary: ${passCount} passed, ${failCount} failed\n`);

if (failCount === 0) {
  console.log('✅ All checks passed! Ready to deploy.\n');
  console.log('Next steps:');
  console.log('1. Run database migration:');
  console.log('   npx prisma migrate deploy');
  console.log('2. Test in development:');
  console.log('   - Record expense in Route Hisab → verify table updates');
  console.log('   - Check Daily Sheet load time (<1.5s target)');
  console.log('   - Check Bills tab load time (<2.5s target)');
  console.log('3. Deploy to production');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Review and fix before deploying.\n');
  process.exit(1);
}
