#!/usr/bin/env node
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const businessId = '32cd9aa6-8fbf-4ab7-824e-6f49d88276c1';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🔍 Checking Construction Data Status...\n');
    
    const [r1, r2, r3, r4, r5] = await Promise.all([
      pool.query('SELECT COUNT(*) as c FROM construction_daily_reports WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM construction_safety_logs WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM construction_quality_tests WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM construction_site_inspections WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM subcontractor_work_orders WHERE business_id = $1', [businessId])
    ]);
    
    console.log('📊 Data Status:');
    console.log(`   Daily Reports: ${r1.rows[0].c}`);
    console.log(`   Safety Logs: ${r2.rows[0].c}`);
    console.log(`   Quality Tests: ${r3.rows[0].c}`);
    console.log(`   Site Inspections: ${r4.rows[0].c}`);
    console.log(`   Subcontractor Work Orders: ${r5.rows[0].c}`);
    
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
