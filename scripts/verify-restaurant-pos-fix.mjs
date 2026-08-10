#!/usr/bin/env node
/**
 * Verification Script: Restaurant POS Fix
 * Checks the source code for proper JSDoc formatting
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verifying Restaurant POS Fix...\n');

// Read the service file
const servicePath = join(__dirname, '..', 'lib', 'services', 'RestaurantService.js');
let fileContent;

try {
  fileContent = readFileSync(servicePath, 'utf-8');
  console.log('✅ Found RestaurantService.js\n');
} catch (error) {
  console.log('❌ FAIL: Could not read RestaurantService.js');
  console.error(error.message);
  process.exit(1);
}

// Test 1: Check if method exists
console.log('Test 1: Checking if ensureTokenColumn method exists...');
if (fileContent.includes('async ensureTokenColumn(client)')) {
  console.log('✅ PASS: ensureTokenColumn method found\n');
} else {
  console.log('❌ FAIL: ensureTokenColumn method not found\n');
  process.exit(1);
}

// Test 2: Check for proper JSDoc comment (the bug fix)
console.log('Test 2: Checking for proper JSDoc formatting...');
const jsDocPattern = /\/\*\*[\s\S]*?\*\/\s*async\s+ensureTokenColumn\s*\(/;
if (jsDocPattern.test(fileContent)) {
  console.log('✅ PASS: JSDoc comment is properly closed before method\n');
} else {
  console.log('❌ FAIL: JSDoc comment issue detected\n');
  process.exit(1);
}

// Test 3: Check it's not part of a comment (the original bug)
console.log('Test 3: Checking method is not commented out...');
const buggedPattern = /\/\*\*\s*async\s+ensureTokenColumn/;
if (!buggedPattern.test(fileContent)) {
  console.log('✅ PASS: Method is not part of comment block\n');
} else {
  console.log('❌ FAIL: Method appears to be inside comment block (BUG PRESENT)\n');
  process.exit(1);
}

// Test 4: Check method calls it
console.log('Test 4: Checking if method is called in createOrder...');
if (fileContent.includes('this.ensureTokenColumn(client)') || fileContent.includes('await this.ensureTokenColumn')) {
  console.log('✅ PASS: Method is called in code\n');
} else {
  console.log('⚠️  WARNING: Method exists but may not be used\n');
}

// Test 5: Check for ALTER TABLE query
console.log('Test 5: Checking for token_number column creation...');
if (fileContent.includes('ADD COLUMN IF NOT EXISTS token_number INT')) {
  console.log('✅ PASS: Token column creation query found\n');
} else {
  console.log('❌ FAIL: Token column creation query not found\n');
  process.exit(1);
}

// Test 6: Check migration file exists
console.log('Test 6: Checking for migration file...');
const { readdirSync, existsSync } = await import('fs');
const migrationsDir = join(__dirname, '..', 'prisma', 'migrations');

if (existsSync(migrationsDir)) {
  const migrations = readdirSync(migrationsDir);
  const tokenMigration = migrations.find(m => m.includes('restaurant_order_token_number'));
  if (tokenMigration) {
    console.log(`✅ PASS: Migration found: ${tokenMigration}\n`);
  } else {
    console.log('⚠️  WARNING: Token number migration not found in prisma/migrations\n');
  }
} else {
  console.log('⚠️  WARNING: Migrations directory not found\n');
}

// Summary
console.log('═══════════════════════════════════════════════');
console.log('✅ ALL CRITICAL TESTS PASSED!');
console.log('═══════════════════════════════════════════════');
console.log('\nThe Restaurant POS fix has been verified at the source code level.');
console.log('\nNext steps:');
console.log('1. Apply the migration:');
console.log('   npx prisma migrate deploy');
console.log('\n2. Restart the application:');
console.log('   npm run dev');
console.log('\n3. Test order creation in the UI:');
console.log('   - Navigate to Restaurant POS');
console.log('   - Create a dine-in order');
console.log('   - Verify token number appears');
console.log('   - Check for errors in console');
console.log('\nFor more info, see:');
console.log('- .superpowers/RESTAURANT_POS_FIX_SUMMARY.md');
console.log('- .superpowers/RESTAURANT_POS_DEEP_DIVE.md');
console.log('- .superpowers/RESTAURANT_POS_FLOW_DIAGRAM.md');

