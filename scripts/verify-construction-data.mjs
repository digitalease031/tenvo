#!/usr/bin/env node

/**
 * Verify Construction Data — Quick check of seeded data
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const businessId = '32cd9aa6-8fbf-4ab7-824e-6f49d88276c1'; // demo-construction

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🔍 Verifying Construction Data for demo-construction...\n');

    // Check projects
    const projectsRes = await pool.query(
      `SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_count,
        COALESCE(SUM(contract_value), 0) as total_value,
        COALESCE(SUM(cumulative_certified), 0) as total_certified
       FROM construction_projects 
       WHERE business_id = $1`,
      [businessId]
    );
    
    const stats = projectsRes.rows[0];
    console.log('✅ PROJECTS:', {
      total: stats.total_count,
      active: stats.active_count,
      contractValue: `PKR ${Number(stats.total_value).toLocaleString()}`,
      certified: `PKR ${Number(stats.total_certified).toLocaleString()}`,
    });

    // Sample projects
    const samplesRes = await pool.query(
      `SELECT code, name, status, contract_value, cumulative_certified
       FROM construction_projects 
       WHERE business_id = $1 
       ORDER BY code LIMIT 3`,
      [businessId]
    );
    
    console.log('\n📋 SAMPLE PROJECTS:');
    samplesRes.rows.forEach(p => {
      console.log(`  - ${p.code}: ${p.name} [${p.status}]`);
      console.log(`    Contract: PKR ${Number(p.contract_value).toLocaleString()}`);
    });

    // Check BOQ items
    const boqRes = await pool.query(
      `SELECT COUNT(*) as count, project_id
       FROM bill_of_quantities_items 
       WHERE business_id = $1
       GROUP BY project_id
       ORDER BY count DESC
       LIMIT 1`,
      [businessId]
    );
    
    if (boqRes.rows.length > 0) {
      console.log(`\n✅ BOQ ITEMS: ${boqRes.rows[0].count} items for top project`);
    } else {
      console.log('\n⚠️  BOQ ITEMS: None found');
    }

    // Check IPCs
    const ipcRes = await pool.query(
      `SELECT COUNT(*) as count, 
        COUNT(*) FILTER (WHERE status = 'SUBMITTED') as submitted,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE status = 'DISBURSED') as disbursed
       FROM interim_payment_certificates 
       WHERE business_id = $1`,
      [businessId]
    );
    
    const ipcStats = ipcRes.rows[0];
    console.log('\n✅ IPCs:', {
      total: ipcStats.count,
      submitted: ipcStats.submitted,
      approved: ipcStats.approved,
      disbursed: ipcStats.disbursed,
    });

    // Check machinery logs
    const machineryRes = await pool.query(
      `SELECT COUNT(*) as count, 
        COALESCE(SUM(hours_worked), 0) as total_hours
       FROM machinery_logs 
       WHERE business_id = $1`,
      [businessId]
    );
    
    const machStats = machineryRes.rows[0];
    console.log('\n✅ MACHINERY LOGS:', {
      count: machStats.count,
      totalHours: Number(machStats.total_hours).toFixed(1),
    });

    console.log('\n✨ All construction data verified successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
