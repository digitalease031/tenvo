#!/usr/bin/env node
/**
 * Rollback Script for Restaurant POS Fix
 * 
 * Use this if the deployment causes issues and you need to revert
 * 
 * Usage:
 *   node scripts/rollback-restaurant-pos-fix.mjs
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

async function confirm(question) {
  const readline = (await import('readline')).createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function rollback() {
  log('🔄 Restaurant POS Fix Rollback Script', 'cyan');
  log('======================================\n', 'cyan');
  
  logWarning('This script will attempt to rollback the Restaurant POS fix.');
  logWarning('Make sure you understand the implications before proceeding.\n');
  
  const shouldProceed = await confirm('Do you want to proceed with rollback? (yes/no): ');
  
  if (!shouldProceed) {
    log('\nRollback cancelled');
    process.exit(0);
  }
  
  try {
    // Step 1: Revert code changes
    log('\n📝 Step 1: Reverting Code Changes', 'cyan');
    logWarning('Manual step required:');
    log('  git log --oneline -10  # Find the commit to revert to');
    log('  git reset --hard <commit-hash>  # Revert to before the fix');
    log('  OR');
    log('  git revert <commit-hash>  # Create a revert commit\n');
    
    const codeReverted = await confirm('Have you reverted the code changes? (yes/no): ');
    if (!codeReverted) {
      logError('Please revert code changes before continuing');
      process.exit(1);
    }
    
    // Step 2: Rollback migration
    log('\n🗄️  Step 2: Rolling Back Database Migration', 'cyan');
    logWarning('The token_number column will remain in the database');
    logWarning('Having the column without the code is SAFE - orders will just have NULL token_numbers');
    log('\nOptions:');
    log('  A) Leave column (RECOMMENDED) - safe, no data loss');
    log('  B) Drop column (RISKY) - removes token numbers from existing orders\n');
    
    const shouldDropColumn = await confirm('Do you want to DROP the token_number column? (yes/no): ');
    
    if (shouldDropColumn) {
      logWarning('Dropping token_number column...');
      log('\nManual SQL required:');
      log('  DROP INDEX IF EXISTS idx_restaurant_orders_token_lookup;');
      log('  ALTER TABLE restaurant_orders DROP COLUMN IF EXISTS token_number;\n');
      
      const columnDropped = await confirm('Have you executed the DROP statements? (yes/no): ');
      if (columnDropped) {
        logSuccess('Column dropped');
      } else {
        logError('Please drop the column manually if needed');
      }
    } else {
      logSuccess('Keeping token_number column (recommended)');
      log('Orders will continue to work, token numbers will just be NULL');
    }
    
    // Step 3: Mark migration as rolled back in Prisma
    log('\n📋 Step 3: Update Prisma Migration Status', 'cyan');
    log('\nExecute:');
    log('  npx prisma migrate resolve --rolled-back 20260810084208_add_restaurant_order_token_number\n');
    
    const prismaUpdated = await confirm('Have you updated Prisma migration status? (yes/no): ');
    if (!prismaUpdated) {
      logWarning('Prisma may think migration is still applied');
    }
    
    // Step 4: Restore from backup (if needed)
    log('\n💾 Step 4: Database Restore (Optional)', 'cyan');
    logWarning('Only needed if database is in bad state');
    log('\nTo restore from backup:');
    log('  psql -h <host> -U <user> -d <database> < backup_file.sql\n');
    
    const needsRestore = await confirm('Do you need to restore from backup? (yes/no): ');
    
    if (needsRestore) {
      log('\nManual restore required');
      log('1. Stop application');
      log('2. Restore backup: psql ... < backup.sql');
      log('3. Verify data');
      log('4. Restart application\n');
      
      const restored = await confirm('Has database been restored? (yes/no): ');
      if (restored) {
        logSuccess('Database restored');
      } else {
        logError('Please complete restore before proceeding');
        process.exit(1);
      }
    } else {
      logSuccess('No restore needed');
    }
    
    // Step 5: Restart application
    log('\n🔄 Step 5: Restart Application', 'cyan');
    logWarning('Manual restart required:');
    log('  pm2 restart tenvo-production');
    log('  OR use your deployment pipeline\n');
    
    const restarted = await confirm('Has application been restarted? (yes/no): ');
    if (!restarted) {
      logError('Please restart application');
      process.exit(1);
    }
    
    // Step 6: Verify system
    log('\n✓ Step 6: Verify System', 'cyan');
    log('\nVerification checklist:');
    log('1. Application is running');
    log('2. Can create restaurant orders (even without token number)');
    log('3. No new errors in logs');
    log('4. Existing orders still accessible\n');
    
    const verified = await confirm('Has system been verified? (yes/no): ');
    if (!verified) {
      logWarning('Please verify system before declaring rollback complete');
    }
    
    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('ROLLBACK SUMMARY', 'cyan');
    log('='.repeat(60), 'cyan');
    log('\n✅ Code reverted');
    log(shouldDropColumn ? '✅ Column dropped' : '✅ Column kept (safe)');
    log(prismaUpdated ? '✅ Prisma updated' : '⚠️  Prisma status unclear');
    log(needsRestore && restored ? '✅ Database restored' : '- No restore needed');
    log(restarted ? '✅ Application restarted' : '⚠️  Restart needed');
    log(verified ? '✅ System verified' : '⚠️  Verification pending');
    
    log('\n' + '='.repeat(60), 'cyan');
    
    if (verified && restarted && (prismaUpdated || !shouldDropColumn)) {
      logSuccess('\n✅ ROLLBACK COMPLETE');
      log('\nNext steps:');
      log('1. Monitor logs for 1-2 hours');
      log('2. Investigate root cause of deployment failure');
      log('3. Fix issues in development');
      log('4. Re-test thoroughly');
      log('5. Schedule new deployment');
    } else {
      logWarning('\n⚠️  ROLLBACK INCOMPLETE');
      log('\nComplete remaining steps before resuming normal operations');
    }
    
    log('\n📚 Documentation:');
    log('- .superpowers/RESTAURANT_POS_FIX_SUMMARY.md');
    log('- .superpowers/RESTAURANT_POS_DEPLOYMENT_CHECKLIST.md\n');
    
  } catch (error) {
    logError(`\nRollback error: ${error.message}`);
    log('\nManual intervention required');
    process.exit(1);
  }
}

// Run rollback
rollback();
