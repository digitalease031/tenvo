#!/usr/bin/env node
/**
 * Apply Construction Domain Migration
 * Runs the construction domain SQL migration directly
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { createPool } from '../../lib/dataLab/pool.mjs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

const pool = createPool();

async function main() {
  console.log('🏗️  Applying Construction Domain Migration...\n');

  try {
    // Read the migration SQL file
    const migrationSql = readFileSync(
      resolve(process.cwd(), 'prisma/migrations/20260813_construction_domain/migration.sql'),
      'utf-8'
    );

    console.log('📄 Executing migration SQL...');
    
    // Execute the migration
    await pool.query(migrationSql);
    
    console.log('✅ Migration applied successfully!\n');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'construction_projects',
          'bill_of_quantities_items',
          'interim_payment_certificates',
          'machinery_logs',
          'subcontractor_work_orders'
        )
      ORDER BY table_name
    `);
    
    console.log('📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
