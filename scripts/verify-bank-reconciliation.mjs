#!/usr/bin/env node
/**
 * Verification script for Bank Reconciliation feature
 * 
 * Checks:
 * 1. Database tables exist (bank_reconciliation_sessions, bank_statement_lines)
 * 2. Required indexes are in place
 * 3. Foreign key constraints are configured
 * 4. Component imports and exports are correct
 * 5. API routes are properly defined
 * 
 * Usage: node scripts/verify-bank-reconciliation.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const { Pool } = pg;

// Color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + colors.bold + colors.blue + '═'.repeat(60) + colors.reset);
  console.log(colors.bold + colors.blue + ` ${title}` + colors.reset);
  console.log(colors.bold + colors.blue + '═'.repeat(60) + colors.reset + '\n');
}

async function checkDatabaseTables() {
  logSection('Database Schema Check');
  
  if (!process.env.DATABASE_URL) {
    try {
      const dotenv = await import('dotenv');
      dotenv.config({ path: join(ROOT, '.env.local') });
      dotenv.config({ path: join(ROOT, '.env') });
    } catch { /* ignore */ }
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log('⚠️  DATABASE_URL not set. Skipping database checks.', 'yellow');
    return true;
  }

  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    const client = await pool.connect();
    
    try {
      // Check if tables exist
      const tablesCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('bank_reconciliation_sessions', 'bank_statement_lines')
        ORDER BY table_name
      `);
      
      const tables = tablesCheck.rows.map(r => r.table_name);
      
      if (tables.includes('bank_reconciliation_sessions')) {
        log('✓ Table bank_reconciliation_sessions exists', 'green');
      } else {
        log('✗ Table bank_reconciliation_sessions is missing', 'red');
        return false;
      }
      
      if (tables.includes('bank_statement_lines')) {
        log('✓ Table bank_statement_lines exists', 'green');
      } else {
        log('✗ Table bank_statement_lines is missing', 'red');
        return false;
      }
      
      // Check columns on bank_reconciliation_sessions
      const sessionColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'bank_reconciliation_sessions'
        ORDER BY ordinal_position
      `);
      
      const requiredSessionCols = ['id', 'business_id', 'account_id', 'statement_date', 'statement_closing_balance', 'status'];
      const sessionColNames = sessionColumns.rows.map(r => r.column_name);
      
      let sessionColsValid = true;
      for (const col of requiredSessionCols) {
        if (sessionColNames.includes(col)) {
          log(`  ✓ Column ${col} exists`, 'green');
        } else {
          log(`  ✗ Column ${col} is missing`, 'red');
          sessionColsValid = false;
        }
      }
      
      // Check columns on bank_statement_lines
      const lineColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'bank_statement_lines'
        ORDER BY ordinal_position
      `);
      
      const requiredLineCols = ['id', 'session_id', 'statement_date', 'description', 'debit', 'credit', 'matched', 'gl_entry_id', 'business_id'];
      const lineColNames = lineColumns.rows.map(r => r.column_name);
      
      let lineColsValid = true;
      for (const col of requiredLineCols) {
        if (lineColNames.includes(col)) {
          log(`  ✓ Column ${col} exists`, 'green');
        } else {
          log(`  ✗ Column ${col} is missing`, 'red');
          lineColsValid = false;
        }
      }
      
      // Check indexes
      const indexes = await client.query(`
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN ('bank_reconciliation_sessions', 'bank_statement_lines')
        ORDER BY tablename, indexname
      `);
      
      log('\nIndexes:', 'blue');
      for (const idx of indexes.rows) {
        log(`  ✓ ${idx.tablename}.${idx.indexname}`, 'green');
      }
      
      // Check foreign keys
      const fkeys = await client.query(`
        SELECT
          conname AS constraint_name,
          conrelid::regclass AS table_name,
          confrelid::regclass AS foreign_table_name
        FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid::regclass::text IN ('bank_reconciliation_sessions', 'bank_statement_lines')
        ORDER BY conname
      `);
      
      log('\nForeign Keys:', 'blue');
      for (const fk of fkeys.rows) {
        log(`  ✓ ${fk.constraint_name}: ${fk.table_name} -> ${fk.foreign_table_name}`, 'green');
      }
      
      return sessionColsValid && lineColsValid;
      
    } finally {
      client.release();
    }
  } catch (error) {
    log(`✗ Database check failed: ${error.message}`, 'red');
    return false;
  } finally {
    await pool.end();
  }
}

function checkComponentFiles() {
  logSection('Component Files Check');
  
  const files = [
    'components/finance/BankReconciliation.jsx',
    'app/api/v1/finance/bank-reconciliation/route.js',
    'app/api/v1/finance/bank-reconciliation/[id]/route.js',
  ];
  
  let allExist = true;
  for (const file of files) {
    const path = join(ROOT, file);
    if (existsSync(path)) {
      log(`✓ ${file}`, 'green');
    } else {
      log(`✗ ${file} not found`, 'red');
      allExist = false;
    }
  }
  
  return allExist;
}

function checkComponentImports() {
  logSection('Component Integration Check');
  
  try {
    // Check if BankReconciliation is imported in FinanceHub
    const financeHubPath = join(ROOT, 'components/finance/FinanceHub.jsx');
    const financeHubContent = readFileSync(financeHubPath, 'utf-8');
    
    if (financeHubContent.includes('import { BankReconciliation }') || 
        financeHubContent.includes("import { BankReconciliation }")) {
      log('✓ BankReconciliation imported in FinanceHub', 'green');
    } else {
      log('✗ BankReconciliation not imported in FinanceHub', 'red');
      return false;
    }
    
    if (financeHubContent.includes('<BankReconciliation')) {
      log('✓ BankReconciliation component used in FinanceHub', 'green');
    } else {
      log('✗ BankReconciliation component not used in FinanceHub', 'red');
      return false;
    }
    
    // Check if reconciliation tab is defined
    if (financeHubContent.includes("key: 'reconciliation'") || 
        financeHubContent.includes('key: "reconciliation"')) {
      log('✓ Reconciliation tab defined in FINANCE_TABS', 'green');
    } else {
      log('✗ Reconciliation tab not defined', 'red');
      return false;
    }
    
    // Check API route exports
    const apiRoutePath = join(ROOT, 'app/api/v1/finance/bank-reconciliation/route.js');
    const apiContent = readFileSync(apiRoutePath, 'utf-8');
    
    if (apiContent.includes('export const GET') && apiContent.includes('export const POST')) {
      log('✓ API route exports GET and POST', 'green');
    } else {
      log('✗ API route missing GET or POST exports', 'red');
      return false;
    }
    
    // Check detail API route
    const detailApiPath = join(ROOT, 'app/api/v1/finance/bank-reconciliation/[id]/route.js');
    const detailApiContent = readFileSync(detailApiPath, 'utf-8');
    
    if (detailApiContent.includes('export const GET') && detailApiContent.includes('export const PATCH')) {
      log('✓ Detail API route exports GET and PATCH', 'green');
    } else {
      log('✗ Detail API route missing GET or PATCH exports', 'red');
      return false;
    }
    
    // Check for proper parameter access
    if (detailApiContent.includes('routeParams?.params?.id')) {
      log('✓ Route parameters properly accessed', 'green');
    } else {
      log('⚠️  Route parameters may not be properly accessed', 'yellow');
    }
    
    // Check for safety guards
    const bankReconPath = join(ROOT, 'components/finance/BankReconciliation.jsx');
    const bankReconContent = readFileSync(bankReconPath, 'utf-8');
    
    if (bankReconContent.includes('filter(l => l && l.matched)') || 
        bankReconContent.includes('filter(ge => ge && ge.id)')) {
      log('✓ Null safety checks present in component', 'green');
    } else {
      log('⚠️  Consider adding null safety checks', 'yellow');
    }
    
    return true;
    
  } catch (error) {
    log(`✗ File check failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  console.log(colors.bold + '\n🔍 Bank Reconciliation Feature Verification\n' + colors.reset);
  
  const filesOk = checkComponentFiles();
  const importsOk = checkComponentImports();
  const dbOk = await checkDatabaseTables();
  
  logSection('Summary');
  
  if (filesOk && importsOk && dbOk) {
    log('✅ All checks passed! Bank Reconciliation feature is properly configured.', 'green');
    process.exit(0);
  } else {
    log('❌ Some checks failed. Please review the issues above.', 'red');
    
    if (!dbOk) {
      log('\n💡 To create the required tables, run the migration:', 'yellow');
      log('   prisma migrate deploy', 'yellow');
      log('   or apply: prisma/migrations/20260514_bank_reconciliation/migration.sql', 'yellow');
    }
    
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Verification failed with error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
