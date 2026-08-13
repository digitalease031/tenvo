#!/usr/bin/env node
/**
 * Verify copyright protection is properly configured
 * Copyright © 2026 Mindscape Analytics LLC. All Rights Reserved.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const REQUIRED_FILES = [
  'LICENSE',
  'COPYRIGHT',
  'NOTICE',
  'SECURITY.md',
  'ANTI-PIRACY.md',
  'README.md',
  '.gitattributes',
  '.copyright-header.js',
];

const REQUIRED_IN_GITHUB = [
  '.github/DMCA-NOTICE.md',
];

async function checkFile(filePath, description) {
  try {
    await fs.access(path.join(ROOT, filePath));
    console.log(`✓ ${description}`);
    return true;
  } catch {
    console.log(`✗ MISSING: ${description}`);
    return false;
  }
}

async function verifyFileContent(filePath, requiredText, description) {
  try {
    const content = await fs.readFile(path.join(ROOT, filePath), 'utf-8');
    if (content.includes(requiredText)) {
      console.log(`✓ ${description}`);
      return true;
    } else {
      console.log(`✗ MISSING TEXT: ${description}`);
      return false;
    }
  } catch {
    console.log(`✗ CANNOT READ: ${description}`);
    return false;
  }
}

async function verifyGitignore() {
  try {
    const content = await fs.readFile(path.join(ROOT, '.gitignore'), 'utf-8');
    
    // Check that sensitive READMEs are hidden
    const hasInternalProtection = 
      content.includes('INTERNAL_README.md') ||
      content.includes('TECHNICAL_README.md');
    
    if (hasInternalProtection) {
      console.log('✓ .gitignore protects internal documentation');
      return true;
    } else {
      console.log('⚠ .gitignore may not fully protect internal docs');
      return true; // Warning, not failure
    }
  } catch {
    console.log('✗ Cannot read .gitignore');
    return false;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Copyright Protection Verification                     ║');
  console.log('║     Mindscape Analytics LLC — TENVO                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  const results = [];
  
  console.log('Checking Required Legal Files:\n');
  
  for (const file of REQUIRED_FILES) {
    results.push(await checkFile(file, file));
  }
  
  console.log('\nChecking GitHub Protection Files:\n');
  
  for (const file of REQUIRED_IN_GITHUB) {
    results.push(await checkFile(file, file));
  }
  
  console.log('\nVerifying File Contents:\n');
  
  results.push(await verifyFileContent(
    'LICENSE',
    'PROPRIETARY SOFTWARE LICENSE',
    'LICENSE contains proprietary notice'
  ));
  
  results.push(await verifyFileContent(
    'LICENSE',
    'Mindscape Analytics LLC',
    'LICENSE mentions Mindscape Analytics LLC'
  ));
  
  results.push(await verifyFileContent(
    'package.json',
    'UNLICENSED',
    'package.json marked as UNLICENSED'
  ));
  
  results.push(await verifyFileContent(
    'package.json',
    'Mindscape Analytics LLC',
    'package.json has copyright notice'
  ));
  
  results.push(await verifyFileContent(
    'README.md',
    'NOT open source',
    'README.md clearly states NOT open source'
  ));
  
  results.push(await verifyFileContent(
    'COPYRIGHT',
    'All Rights Reserved',
    'COPYRIGHT file has rights reserved notice'
  ));
  
  console.log('\nChecking .gitignore Protection:\n');
  results.push(await verifyGitignore());
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  const passed = results.filter(Boolean).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`\nResults: ${passed}/${total} checks passed (${percentage}%)\n`);
  
  if (passed === total) {
    console.log('✅ COPYRIGHT PROTECTION: STRONG');
    console.log('   All copyright protection measures are in place.\n');
    process.exit(0);
  } else if (percentage >= 80) {
    console.log('⚠️  COPYRIGHT PROTECTION: GOOD');
    console.log('   Most protection measures are in place.');
    console.log('   Review the items marked with ✗ above.\n');
    process.exit(0);
  } else {
    console.log('❌ COPYRIGHT PROTECTION: WEAK');
    console.log('   Critical protection measures are missing!');
    console.log('   Fix the items marked with ✗ above immediately.\n');
    process.exit(1);
  }
}

main().catch(console.error);
