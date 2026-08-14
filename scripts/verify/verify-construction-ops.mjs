#!/usr/bin/env node
/**
 * Verify Construction Domain Operations Snapshot
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const businessId = '32cd9aa6-8fbf-4ab7-824e-6f49d88276c1';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🏗️  Verifying Construction Domain Operations...\n');
    
    // Test project aggregation
    const projectsResult = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_projects,
         COUNT(*) AS total_projects,
         COALESCE(SUM(contract_value) FILTER (WHERE status IN ('ACTIVE', 'DLP')), 0) AS contract_value,
         COALESCE(SUM(cumulative_certified) FILTER (WHERE status IN ('ACTIVE', 'DLP')), 0) AS certified_work,
         COALESCE(SUM(retention_held) FILTER (WHERE status IN ('ACTIVE', 'DLP')), 0) AS retention_held
       FROM construction_projects
       WHERE business_id = $1`,
      [businessId]
    );
    
    const pa = projectsResult.rows[0];
    console.log('✅ Projects:');
    console.log(`   Active: ${pa.active_projects}`);
    console.log(`   Total: ${pa.total_projects}`);
    console.log(`   Contract Value: PKR ${(Number(pa.contract_value) / 1000000).toFixed(2)}M`);
    console.log(`   Certified Work: PKR ${(Number(pa.certified_work) / 1000000).toFixed(2)}M`);
    console.log(`   Retention Held: PKR ${(Number(pa.retention_held) / 1000000).toFixed(2)}M`);
    
    // Test safety logs
    const safetyResult = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status NOT IN ('CLOSED', 'RESOLVED')) AS open_count,
         COUNT(*) FILTER (WHERE severity IN ('CRITICAL', 'HIGH') AND status NOT IN ('CLOSED', 'RESOLVED')) AS critical_count
       FROM construction_safety_logs
       WHERE business_id = $1`,
      [businessId]
    );
    
    const sa = safetyResult.rows[0];
    console.log('\n✅ Safety:');
    console.log(`   Open Incidents: ${sa.open_count}`);
    console.log(`   Critical Incidents: ${sa.critical_count}`);
    
    // Test quality tests
    const qualityResult = await pool.query(
      `SELECT 
         COUNT(*) AS total_tests,
         COUNT(*) FILTER (WHERE pass_fail_status = 'FAIL') AS failed_count,
         COUNT(*) FILTER (WHERE pass_fail_status = 'PASS') AS passed_count
       FROM construction_quality_tests
       WHERE business_id = $1`,
      [businessId]
    );
    
    const qa = qualityResult.rows[0];
    const passRate = qa.total_tests > 0 ? ((Number(qa.passed_count) / Number(qa.total_tests)) * 100).toFixed(1) : 0;
    console.log('\n✅ Quality:');
    console.log(`   Total Tests: ${qa.total_tests}`);
    console.log(`   Passed: ${qa.passed_count}`);
    console.log(`   Failed: ${qa.failed_count}`);
    console.log(`   Pass Rate: ${passRate}%`);
    
    // Test subcontractors
    const subResult = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_count,
         COALESCE(SUM(retainage_deducted - amount_released) FILTER (WHERE status IN ('ACTIVE', 'COMPLETED')), 0) AS retention_total,
         COALESCE(SUM(work_order_value), 0) AS total_wo_value,
         COALESCE(SUM(amount_certified), 0) AS total_certified
       FROM subcontractor_work_orders
       WHERE business_id = $1`,
      [businessId]
    );
    
    const sca = subResult.rows[0];
    console.log('\n✅ Subcontractors:');
    console.log(`   Active: ${sca.active_count}`);
    console.log(`   Total WO Value: PKR ${(Number(sca.total_wo_value) / 1000000).toFixed(2)}M`);
    console.log(`   Certified: PKR ${(Number(sca.total_certified) / 1000000).toFixed(2)}M`);
    console.log(`   Retention Held: PKR ${(Number(sca.retention_total) / 1000000).toFixed(2)}M`);
    
    // Test machinery
    const machineryResult = await pool.query(
      `SELECT 
         COUNT(*) AS total_logs,
         COALESCE(SUM(end_hours - start_hours), 0) AS total_hours,
         COALESCE(SUM(fuel_litres), 0) AS total_fuel
       FROM machinery_logs
       WHERE business_id = $1`,
      [businessId]
    );
    
    const ma = machineryResult.rows[0];
    console.log('\n✅ Machinery:');
    console.log(`   Total Logs: ${ma.total_logs}`);
    console.log(`   Total Hours: ${Number(ma.total_hours).toFixed(1)} hours`);
    console.log(`   Total Fuel: ${Number(ma.total_fuel).toFixed(1)} liters`);
    
    console.log('\n🎉 Construction Domain Operations: FULLY OPERATIONAL ✅');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
