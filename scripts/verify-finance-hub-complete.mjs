#!/usr/bin/env node
/**
 * Comprehensive Finance Hub Verification Script
 * 
 * Validates all Finance Hub tabs, APIs, and integrations
 * 
 * Usage: node scripts/verify-finance-hub-complete.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const { Pool } = pg;

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
  console.log('\n' + colors.bold + colors.blue + '═'.repeat(70) + colors.reset);
  console.log(colors.bold + colors.blue + ` ${title}` + colors.reset);
  console.log(colors.bold + colors.blue + '═'.repeat(70) + colors.reset + '\n');
}

// Finance Hub Tabs Configuration
const FINANCE_TABS = {
  overview: { component: 'FinanceHub.jsx', feature: null },
  statements: { component: 'FinancialReports', feature: 'basic_reports' },
  accounts: { component: 'ChartOfAccountsManager', feature: 'basic_accounting' },
  journal: { component: 'JournalEntryForm+JournalEntryList', feature: 'basic_accounting' },
  'general-ledger': { component: 'GeneralLedgerReport', feature: 'basic_accounting' },
  reconciliation: { component: 'BankReconciliation', feature: 'basic_accounting' },
  expenses: { component: 'ExpenseManager', feature: 'expense_tracking' },
  'personal-finance': { component: 'PersonalFinanceManager', feature: null },
  'credit-notes': { component: 'CreditNotesPanel', feature: 'credit_notes' },
  fiscal: { component: 'FiscalPeriodManager', feature: 'fiscal_periods' },
  exchange: { component: 'ExchangeRateManager', feature: 'exchange_rates' },
};

function checkFinanceComponents() {
  logSection('Finance Components Check');
  
  const components = [
    'components/finance/FinanceHub.jsx',
    'components/JournalEntryForm.jsx',
    'components/finance/JournalEntryList.jsx',
    'components/finance/BankReconciliation.jsx',
    'components/finance/ChartOfAccountsManager.jsx',
    'components/finance/ExpenseManager.jsx',
    'components/finance/FiscalPeriodManager.jsx',
    'components/finance/PersonalFinanceManager.jsx',
    'components/reports/GeneralLedgerReport.jsx',
    'components/FinancialReports.jsx',
  ];
  
  let allExist = true;
  for (const file of components) {
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

function checkFinanceAPIs() {
  logSection('Finance API Routes Check');
  
  const apis = [
    'app/api/v1/finance/journal-entries/route.js',
    'app/api/v1/finance/bank-reconciliation/route.js',
    'app/api/v1/finance/bank-reconciliation/[id]/route.js',
  ];
  
  let allExist = true;
  for (const file of apis) {
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

function checkFinanceActions() {
  logSection('Finance Server Actions Check');
  
  try {
    const actionsPath = join(ROOT, 'lib/actions/basic/accounting.js');
    const content = readFileSync(actionsPath, 'utf-8');
    
    const requiredActions = [
      'getGLAccountsAction',
      'createGLAccountAction',
      'updateGLAccountAction',
      'getGLEntriesAction',
      'createJournalAction',
    ];
    
    let allExist = true;
    for (const action of requiredActions) {
      if (content.includes(`export async function ${action}`) || 
          content.includes(`export const ${action}`)) {
        log(`✓ ${action}`, 'green');
      } else {
        log(`✗ ${action} not found`, 'red');
        allExist = false;
      }
    }
    
    return allExist;
  } catch (error) {
    log(`✗ Failed to check actions: ${error.message}`, 'red');
    return false;
  }
}

function checkFinanceServices() {
  logSection('Finance Services Check');
  
  try {
    const servicesPath = join(ROOT, 'lib/services/AccountingService.js');
    const content = readFileSync(servicesPath, 'utf-8');
    
    const requiredMethods = [
      'createJournalEntry',
      'recordBusinessTransaction',
      'getGLAccountsByTypes',
    ];
    
    let allExist = true;
    for (const method of requiredMethods) {
      if (content.includes(`${method}(`)) {
        log(`✓ AccountingService.${method}`, 'green');
      } else {
        log(`✗ AccountingService.${method} not found`, 'red');
        allExist = false;
      }
    }
    
    return allExist;
  } catch (error) {
    log(`✗ Failed to check services: ${error.message}`, 'red');
    return false;
  }
}

function checkValidationSchemas() {
  logSection('Validation Schemas Check');
  
  try {
    const schemasPath = join(ROOT, 'lib/validation/schemas.js');
    const content = readFileSync(schemasPath, 'utf-8');
    
    const requiredSchemas = [
      'glEntryLineSchema',
      'journalEntrySchema',
      'glAccountSchema',
    ];
    
    let allExist = true;
    for (const schema of requiredSchemas) {
      if (content.includes(`export const ${schema}`)) {
        log(`✓ ${schema}`, 'green');
      } else {
        log(`✗ ${schema} not found`, 'red');
        allExist = false;
      }
    }
    
    return allExist;
  } catch (error) {
    log(`✗ Failed to check schemas: ${error.message}`, 'red');
    return false;
  }
}

async function checkDatabaseTables() {
  logSection('Finance Database Tables Check');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log('⚠️  DATABASE_URL not set. Skipping database checks.', 'yellow');
    return false;
  }

  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    const client = await pool.connect();
    
    try {
      const requiredTables = [
        'journal_entries',
        'gl_entries',
        'gl_accounts',
        'bank_reconciliation_sessions',
        'bank_statement_lines',
        'fiscal_periods',
        'exchange_rates',
      ];
      
      const tablesCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = ANY($1)
        ORDER BY table_name
      `, [requiredTables]);
      
      const existing = tablesCheck.rows.map(r => r.table_name);
      
      let allExist = true;
      for (const table of requiredTables) {
        if (existing.includes(table)) {
          log(`✓ ${table}`, 'green');
        } else {
          log(`✗ ${table} is missing`, 'red');
          allExist = false;
        }
      }
      
      // Check critical columns
      if (existing.includes('journal_entries')) {
        const jeColumns = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'journal_entries'
            AND column_name IN ('id', 'business_id', 'journal_number', 'transaction_date', 'description')
        `);
        
        if (jeColumns.rows.length === 5) {
          log('  ✓ journal_entries has all critical columns', 'green');
        } else {
          log('  ✗ journal_entries is missing columns', 'red');
          allExist = false;
        }
      }
      
      if (existing.includes('gl_entries')) {
        const geColumns = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'gl_entries'
            AND column_name IN ('id', 'business_id', 'journal_id', 'account_id', 'debit', 'credit')
        `);
        
        if (geColumns.rows.length === 6) {
          log('  ✓ gl_entries has all critical columns', 'green');
        } else {
          log('  ✗ gl_entries is missing columns', 'red');
          allExist = false;
        }
      }
      
      return allExist;
      
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

function checkJournalEntryForm() {
  logSection('Journal Entry Form Validation');
  
  try {
    const formPath = join(ROOT, 'components/JournalEntryForm.jsx');
    const content = readFileSync(formPath, 'utf-8');
    
    const checks = [
      { pattern: /validEntries\.filter/, label: 'Filters incomplete entries' },
      { pattern: /account_id\.trim\(\)/, label: 'Validates account_id is not empty' },
      { pattern: /parseFloat\(e\.amount\)/, label: 'Validates amount is numeric' },
      { pattern: /isIncomplete.*border-red/, label: 'Visual feedback for incomplete entries' },
      { pattern: /totals\.isBalanced/, label: 'Balance validation' },
    ];
    
    let allPassed = true;
    for (const check of checks) {
      if (check.pattern.test(content)) {
        log(`✓ ${check.label}`, 'green');
      } else {
        log(`✗ ${check.label} not found`, 'red');
        allPassed = false;
      }
    }
    
    return allPassed;
  } catch (error) {
    log(`✗ Failed to check Journal Entry Form: ${error.message}`, 'red');
    return false;
  }
}

function checkBankReconciliation() {
  logSection('Bank Reconciliation Validation');
  
  try {
    const reconPath = join(ROOT, 'components/finance/BankReconciliation.jsx');
    const content = readFileSync(reconPath, 'utf-8');
    
    const checks = [
      { pattern: /filter\(l => l && l\.matched\)/, label: 'Null safety in stats calculation' },
      { pattern: /filter\(line => line && line\.id\)/, label: 'Filters null lines' },
      { pattern: /filter\(ge => ge && ge\.id\)/, label: 'Filters null GL entries' },
      { pattern: /ge\.id \? ge\.id\.slice/, label: 'Safe ID slicing' },
    ];
    
    let allPassed = true;
    for (const check of checks) {
      if (check.pattern.test(content)) {
        log(`✓ ${check.label}`, 'green');
      } else {
        log(`✗ ${check.label} not found`, 'red');
        allPassed = false;
      }
    }
    
    return allPassed;
  } catch (error) {
    log(`✗ Failed to check Bank Reconciliation: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  console.log(colors.bold + '\n🔍 Finance Hub Comprehensive Verification\n' + colors.reset);
  
  const componentsOk = checkFinanceComponents();
  const apisOk = checkFinanceAPIs();
  const actionsOk = checkFinanceActions();
  const servicesOk = checkFinanceServices();
  const schemasOk = checkValidationSchemas();
  const journalFormOk = checkJournalEntryForm();
  const bankReconOk = checkBankReconciliation();
  const dbOk = await checkDatabaseTables();
  
  logSection('Summary');
  
  const results = [
    { name: 'Components', ok: componentsOk },
    { name: 'API Routes', ok: apisOk },
    { name: 'Server Actions', ok: actionsOk },
    { name: 'Services', ok: servicesOk },
    { name: 'Validation Schemas', ok: schemasOk },
    { name: 'Journal Entry Form', ok: journalFormOk },
    { name: 'Bank Reconciliation', ok: bankReconOk },
    { name: 'Database Tables', ok: dbOk },
  ];
  
  for (const result of results) {
    if (result.ok) {
      log(`✅ ${result.name}: PASSED`, 'green');
    } else {
      log(`❌ ${result.name}: FAILED`, 'red');
    }
  }
  
  const allPassed = results.every(r => r.ok);
  
  if (allPassed) {
    log('\n✅ All Finance Hub checks passed!', 'green');
    log('The Finance Hub is properly configured and ready to use.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some Finance Hub checks failed.', 'red');
    log('Review the issues above and apply the necessary fixes.', 'yellow');
    
    if (!dbOk) {
      log('\n💡 Database tables may need migration:', 'yellow');
      log('   Run: npm run db:migrate', 'yellow');
    }
    
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Verification failed with error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
