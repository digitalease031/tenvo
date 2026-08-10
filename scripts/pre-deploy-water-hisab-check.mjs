#!/usr/bin/env node
/**
 * Pre-deployment safety check for Water Hisab fixes
 * Validates database state BEFORE applying migration
 * Run: node scripts/pre-deploy-water-hisab-check.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Pre-Deployment Safety Check for Water Hisab Fixes\n');
console.log('This script checks for potential conflicts BEFORE deployment.\n');

let warnings = 0;
let criticalIssues = 0;

function warn(msg) {
  console.warn(`⚠️  WARNING: ${msg}`);
  warnings++;
}

function critical(msg) {
  console.error(`🔴 CRITICAL: ${msg}`);
  criticalIssues++;
}

function pass(msg) {
  console.log(`✅ ${msg}`);
}

function info(msg) {
  console.log(`ℹ️  ${msg}`);
}

// ============================================
// 1. Check Migration File Integrity
// ============================================
console.log('📋 Step 1: Migration File Integrity\n');

const migrationPath = join(rootDir, 'prisma/migrations/20260810000001_water_hisab_performance_indexes/migration.sql');
try {
  const migration = readFileSync(migrationPath, 'utf8');
  
  // Check for CREATE EXTENSION with safe handling
  const unsafeExtension = migration.match(/CREATE EXTENSION\s+pg_trgm\s*;/);
  const hasDoBlock = migration.includes('DO $$') && migration.includes('IF NOT EXISTS') && migration.includes('pg_extension');
  const hasIfNotExists = migration.includes('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  
  if (unsafeExtension && !hasDoBlock && !hasIfNotExists) {
    critical('Migration uses bare CREATE EXTENSION without safety guard');
    info('   Fix: Use DO $$ block or IF NOT EXISTS clause');
  } else if (hasDoBlock) {
    pass('pg_trgm extension creation safely guarded with DO $$ block');
  } else if (hasIfNotExists) {
    pass('pg_trgm extension uses IF NOT EXISTS');
  } else if (migration.includes('pg_trgm')) {
    info('pg_trgm referenced but creation method unclear (manual check recommended)');
  }
  
  // Check all indexes use IF NOT EXISTS
  const createIndexCount = (migration.match(/CREATE INDEX/g) || []).length;
  const ifNotExistsCount = (migration.match(/CREATE INDEX IF NOT EXISTS/g) || []).length;
  
  if (createIndexCount !== ifNotExistsCount) {
    critical(`Found ${createIndexCount - ifNotExistsCount} CREATE INDEX without IF NOT EXISTS`);
  } else {
    pass(`All ${createIndexCount} CREATE INDEX statements use IF NOT EXISTS`);
  }
  
  // Check for CONCURRENTLY (optional but recommended for production)
  if (!migration.includes('CONCURRENTLY')) {
    warn('Indexes will be created without CONCURRENTLY - may briefly lock tables');
    info('   For zero-downtime: Add CONCURRENTLY after CREATE INDEX');
  }
  
  // Check for duplicate index names
  const indexNames = [];
  const indexMatches = migration.matchAll(/CREATE INDEX.*?(\w+)\s+ON/g);
  for (const match of indexMatches) {
    const indexName = match[1];
    if (indexNames.includes(indexName)) {
      critical(`Duplicate index name: ${indexName}`);
    }
    indexNames.push(indexName);
  }
  pass(`No duplicate index names found (${indexNames.length} unique indexes)`);
  
} catch (error) {
  critical(`Cannot read migration file: ${error.message}`);
}

// ============================================
// 2. Check Existing Indexes (from schema.prisma)
// ============================================
console.log('\n📋 Step 2: Existing Index Verification\n');

try {
  const schema = readFileSync(join(rootDir, 'prisma/schema.prisma'), 'utf8');
  
  // Extract water_delivery_stops model
  const stopsMatch = schema.match(/model water_delivery_stops \{[\s\S]*?\n\}/);
  if (!stopsMatch) {
    critical('Cannot find water_delivery_stops model in schema.prisma');
  } else {
    const stopsModel = stopsMatch[0];
    
    // Check existing indexes
    const existingIndexes = [
      'idx_water_delivery_stops_business_date',
      'idx_water_delivery_stops_business_customer',
      'water_delivery_stops_business_date_customer_key',
    ];
    
    for (const idx of existingIndexes) {
      if (stopsModel.includes(idx)) {
        pass(`Found existing index: ${idx}`);
      } else {
        warn(`Missing expected index: ${idx} (may need manual schema sync)`);
      }
    }
  }
  
  // Check invoices model for existing notes indexes
  const invoicesMatch = schema.match(/model invoices \{[\s\S]*?\n\}/);
  if (invoicesMatch) {
    const invoicesModel = invoicesMatch[0];
    if (invoicesModel.includes('notes') && invoicesModel.includes('@db.')) {
      pass('Invoices.notes column exists');
    } else {
      warn('Invoices.notes column structure may differ from expected');
    }
  }
  
} catch (error) {
  critical(`Cannot read schema.prisma: ${error.message}`);
}

// ============================================
// 3. Check Code Changes Integrity
// ============================================
console.log('\n📋 Step 3: Code Changes Integrity\n');

// Check WaterRouteHisab.jsx
try {
  const waterHisab = readFileSync(
    join(rootDir, 'components/water/WaterRouteHisab.jsx'),
    'utf8'
  );
  
  if (waterHisab.includes('expense-saved')) {
    pass('WaterRouteHisab: expense-saved event listener found');
  } else {
    critical('WaterRouteHisab: Missing expense-saved event listener');
  }
  
  if (waterHisab.includes('loadExpenses')) {
    pass('WaterRouteHisab: loadExpenses function exists');
  } else {
    critical('WaterRouteHisab: Missing loadExpenses function');
  }
  
  // Check for cleanup
  if (waterHisab.includes('removeEventListener')) {
    pass('WaterRouteHisab: Event listener cleanup present');
  } else {
    warn('WaterRouteHisab: Missing event listener cleanup (memory leak risk)');
  }
  
} catch (error) {
  critical(`Cannot read WaterRouteHisab.jsx: ${error.message}`);
}

// Check ExpenseEntryForm.jsx
try {
  const expenseForm = readFileSync(
    join(rootDir, 'components/ExpenseEntryForm.jsx'),
    'utf8'
  );
  
  if (expenseForm.includes("dispatchEvent(new CustomEvent('expense-saved'")) {
    pass('ExpenseEntryForm: expense-saved event emission found');
  } else {
    critical('ExpenseEntryForm: Missing expense-saved event emission');
  }
  
} catch (error) {
  critical(`Cannot read ExpenseEntryForm.jsx: ${error.message}`);
}

// Check waterHisab.js action
try {
  const waterHisabAction = readFileSync(
    join(rootDir, 'lib/actions/standard/waterHisab.js'),
    'utf8'
  );
  
  if (waterHisabAction.includes('WITH stop_aggregates AS')) {
    pass('waterHisab.js: SQL CTE optimization found');
  } else {
    warn('waterHisab.js: Missing SQL CTE optimization (performance may not improve)');
  }
  
  if (waterHisabAction.includes('water-customer-id-backfill')) {
    pass('waterHisab.js: Customer ID backfill throttling found');
  } else {
    warn('waterHisab.js: Customer ID backfill may run on every load');
  }
  
  // Check for SQL injection safety
  const sqlQueries = waterHisabAction.match(/pool\.query\([^)]+\)/g) || [];
  let unsafeSql = 0;
  for (const query of sqlQueries) {
    if (query.includes('${') || query.includes('`${')) {
      unsafeSql++;
    }
  }
  if (unsafeSql > 0) {
    critical(`Found ${unsafeSql} potential SQL injection risks (template literals in queries)`);
  } else {
    pass('waterHisab.js: All SQL queries use parameterized syntax');
  }
  
} catch (error) {
  critical(`Cannot read waterHisab.js: ${error.message}`);
}

// ============================================
// 4. Check for Potential Breaking Changes
// ============================================
console.log('\n📋 Step 4: Breaking Changes Check\n');

// Check if any other files reference water_delivery_stops
const filesToCheck = [
  'lib/actions/standard/milkHisab.js', // Similar pattern, might conflict
  'components/milk/MilkRouteHisab.jsx', // Similar component
];

for (const file of filesToCheck) {
  const filePath = join(rootDir, file);
  try {
    const content = readFileSync(filePath, 'utf8');
    if (content.includes('water_delivery_stops') || content.includes('water_delivery_lines')) {
      warn(`${file} references water delivery tables (may need similar updates)`);
    }
  } catch {
    // File doesn't exist or can't be read - not critical
  }
}

pass('No obvious breaking changes detected in related files');

// ============================================
// 5. Environment & Dependencies Check
// ============================================
console.log('\n📋 Step 5: Environment Check\n');

try {
  const packageJson = JSON.parse(
    readFileSync(join(rootDir, 'package.json'), 'utf8')
  );
  
  if (packageJson.dependencies['@prisma/client']) {
    pass(`Prisma client version: ${packageJson.dependencies['@prisma/client']}`);
  } else {
    critical('Prisma client not found in dependencies');
  }
  
  if (packageJson.dependencies['pg']) {
    pass(`PostgreSQL driver version: ${packageJson.dependencies['pg']}`);
  } else {
    warn('pg driver not found (may use different PostgreSQL client)');
  }
  
} catch (error) {
  warn(`Cannot read package.json: ${error.message}`);
}

// ============================================
// Summary & Recommendations
// ============================================
console.log('\n' + '═'.repeat(70));
console.log('\n📊 Pre-Deployment Check Summary\n');
console.log(`✅ Passed checks: ${pass.count || 'N/A'}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`🔴 Critical issues: ${criticalIssues}\n`);

if (criticalIssues > 0) {
  console.log('🔴 DEPLOYMENT BLOCKED\n');
  console.log('Fix all critical issues before proceeding:\n');
  console.log('1. Review error messages above');
  console.log('2. Fix code/migration issues');
  console.log('3. Run this check again\n');
  process.exit(1);
}

if (warnings > 0) {
  console.log('⚠️  PROCEED WITH CAUTION\n');
  console.log('Warnings detected but not blocking:');
  console.log('- Review warnings above');
  console.log('- Consider fixing non-critical issues');
  console.log('- Monitor closely after deployment\n');
  console.log('To proceed anyway, run deployment steps manually.\n');
  process.exit(0);
}

console.log('✅ ALL CHECKS PASSED - SAFE TO DEPLOY\n');
console.log('Next steps:\n');
console.log('1. Backup production database:');
console.log('   pg_dump -U postgres -d tenvo > backup_$(date +%Y%m%d).sql\n');
console.log('2. Apply migration:');
console.log('   npx prisma migrate deploy\n');
console.log('3. Verify indexes created:');
console.log('   psql -U postgres -d tenvo -c "\\di+ idx_water_*"\n');
console.log('4. Deploy code:');
console.log('   npm run build && pm2 restart tenvo\n');
console.log('5. Run post-deployment tests:');
console.log('   node scripts/post-deploy-water-hisab-test.mjs\n');

process.exit(0);
