#!/usr/bin/env node
/**
 * Script to add copyright headers to source files
 * Copyright © 2026 Mindscape Analytics LLC. All Rights Reserved.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const COPYRIGHT_HEADERS = {
  js: `/**
 * Copyright © 2026 Mindscape Analytics LLC. All Rights Reserved.
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying or distribution is strictly prohibited.
 */\n\n`,
  
  jsx: `/**
 * Copyright © 2026 Mindscape Analytics LLC. All Rights Reserved.
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying or distribution is strictly prohibited.
 */\n\n`,
  
  ts: `/**
 * Copyright © 2026 Mindscape Analytics LLC. All Rights Reserved.
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying or distribution is strictly prohibited.
 */\n\n`,
  
  tsx: `/**
 * Copyright © 2026 Mindscape Analytics LLC. All Rights Reserved.
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying or distribution is strictly prohibited.
 */\n\n`,
  
  css: `/*
 * Copyright © 2026 Mindscape Analytics LLC. All Rights Reserved.
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying or distribution is strictly prohibited.
 */\n\n`,
  
  sql: `-- Copyright © 2026 Mindscape Analytics LLC. All Rights Reserved.
-- PROPRIETARY AND CONFIDENTIAL
-- Unauthorized copying or distribution is strictly prohibited.

`,
  
  prisma: `// Copyright © 2026 Mindscape Analytics LLC. All Rights Reserved.
// PROPRIETARY AND CONFIDENTIAL
// Unauthorized copying or distribution is strictly prohibited.

`,
};

const EXTENSIONS_TO_PROCESS = ['.js', '.jsx', '.ts', '.tsx', '.css', '.sql', '.prisma'];
const DIRS_TO_SKIP = ['node_modules', '.next', 'out', 'build', 'dist', '.git'];

async function hasHeader(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.includes('Copyright © 2026 Mindscape Analytics LLC');
  } catch {
    return false;
  }
}

async function addHeader(filePath, ext) {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Skip if already has header
  if (content.includes('Copyright © 2026 Mindscape Analytics LLC')) {
    return false;
  }
  
  const header = COPYRIGHT_HEADERS[ext.slice(1)];
  if (!header) return false;
  
  // Handle special cases
  let finalContent;
  if (content.startsWith('#!/usr/bin/env')) {
    // Keep shebang at top
    const lines = content.split('\n');
    finalContent = lines[0] + '\n' + header + lines.slice(1).join('\n');
  } else if (content.startsWith('\'use client\'') || content.startsWith('"use client"')) {
    // Keep 'use client' at top
    const lines = content.split('\n');
    finalContent = lines[0] + '\n' + header + lines.slice(1).join('\n');
  } else if (content.startsWith('\'use server\'') || content.startsWith('"use server"')) {
    // Keep 'use server' at top
    const lines = content.split('\n');
    finalContent = lines[0] + '\n' + header + lines.slice(1).join('\n');
  } else {
    finalContent = header + content;
  }
  
  await fs.writeFile(filePath, finalContent, 'utf-8');
  return true;
}

async function processDirectory(dir, stats = { processed: 0, updated: 0, skipped: 0 }) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!DIRS_TO_SKIP.includes(entry.name)) {
        await processDirectory(fullPath, stats);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS_TO_PROCESS.includes(ext)) {
        stats.processed++;
        const updated = await addHeader(fullPath, ext);
        if (updated) {
          stats.updated++;
          console.log(`✓ Added header to: ${path.relative(ROOT, fullPath)}`);
        } else {
          stats.skipped++;
        }
      }
    }
  }
  
  return stats;
}

async function main() {
  console.log('Adding copyright headers to source files...\n');
  
  const targetDirs = ['app', 'components', 'lib', 'prisma'];
  const stats = { processed: 0, updated: 0, skipped: 0 };
  
  for (const dir of targetDirs) {
    const fullPath = path.join(ROOT, dir);
    try {
      await processDirectory(fullPath, stats);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error processing ${dir}:`, error.message);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Copyright Header Addition Complete');
  console.log('='.repeat(60));
  console.log(`Files processed: ${stats.processed}`);
  console.log(`Headers added:   ${stats.updated}`);
  console.log(`Already had:     ${stats.skipped}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
