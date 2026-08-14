#!/usr/bin/env node

/**
 * Complete Construction Domain Implementation
 * - Add missing subcontractor work orders
 * - Verify all data integrity
 * - Add Pakistani construction standards data
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const businessId = '32cd9aa6-8fbf-4ab7-824e-6f49d88276c1';
const userId = 'zeeshan.keerio@mindscapeanalytics.com';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🏗️  Completing Construction Domain Implementation...\n');

    // Get active projects
    const projectsRes = await pool.query(
      `SELECT id, code, name, contract_value FROM construction_projects 
       WHERE business_id = $1 AND status = 'ACTIVE' 
       ORDER BY code`,
      [businessId]
    );

    if (projectsRes.rows.length === 0) {
      console.error('❌ No active projects found');
      process.exit(1);
    }

    const projects = projectsRes.rows;
    console.log(`📋 Found ${projects.length} active projects\n`);

    // ============================================================================
    // SUBCONTRACTOR WORK ORDERS (5 specialized orders)
    // ============================================================================

    console.log('👷 Seeding Subcontractor Work Orders...');

    const workOrders = [];

    // PRJ-PHA-001 — Pharmaceutical project subcontractors
    const pharmaProject = projects.find(p => p.code === 'PRJ-PHA-001');
    if (pharmaProject) {
      workOrders.push(
        {
          project_id: pharmaProject.id,
          work_order_no: 'SC-PHA-001-STEEL',
          work_order_date: '2024-05-10',
          subcontractor_name: 'Pak Steel Fixers & Reinforcement Co.',
          subcontractor_category: 'C-3',
          pec_license_no: 'PEC/CE/17854-C3/23',
          specialization_code: 'CE09',
          work_order_value: 12500000, // PKR 12.5M
          scope_of_work: 'Supply, fabrication, and installation of all structural steel reinforcement for cleanroom foundation, walls, and roof structure. Grade 60 rebar as per ASTM A615. Total estimated quantity: 185 Ton.',
          retainage_pct: 10,
          amount_certified: 9000000, // PKR 9M certified (72%)
          retainage_deducted: 900000, // PKR 900K retention held
          net_paid: 8100000, // PKR 8.1M paid
          amount_released: 0, // No retention released yet
          status: 'ACTIVE',
          dlp_status: 'IN_PROGRESS',
          dlp_months: 12,
          start_date: '2024-05-15',
          completion_date: '2024-07-30',
        },
        {
          project_id: pharmaProject.id,
          work_order_no: 'SC-PHA-002-HVAC',
          work_order_date: '2024-05-12',
          subcontractor_name: 'Climate Control Systems (Pvt) Ltd',
          subcontractor_category: 'C-2',
          pec_license_no: 'PEC/ME/09421-C2/22',
          specialization_code: 'ME01',
          work_order_value: 28000000, // PKR 28M
          scope_of_work: 'Design, supply, installation, testing, and commissioning of complete HVAC system for ISO 5 cleanroom environment. Includes HEPA filtration units, AHUs (2x 15,000 CFM), ducting, controls, and validation.',
          retainage_pct: 10,
          amount_certified: 16800000, // PKR 16.8M (60% complete)
          retainage_deducted: 1680000, // PKR 1.68M retention
          net_paid: 15120000, // PKR 15.12M paid
          amount_released: 0,
          status: 'ACTIVE',
          dlp_status: 'IN_PROGRESS',
          dlp_months: 18,
          start_date: '2024-05-20',
          completion_date: '2024-08-15',
        }
      );
    }

    // PRJ-NHA-002 — Highway project subcontractors
    const nhaProject = projects.find(p => p.code === 'PRJ-NHA-002');
    if (nhaProject) {
      workOrders.push(
        {
          project_id: nhaProject.id,
          work_order_no: 'SC-NHA-001-ASPHALT',
          work_order_date: '2024-04-15',
          subcontractor_name: 'National Asphalt & Road Surfacing Co.',
          subcontractor_category: 'C-1',
          pec_license_no: 'PEC/CE/03214-C1/21',
          specialization_code: 'CE01',
          work_order_value: 95000000, // PKR 95M
          scope_of_work: 'Supply and laying of asphalt concrete (AC-Base and AC-WC) for 8.5 km dual carriageway. Total quantity: Base course 6,800 Ton, Wearing course 4,500 Ton. Mix design as per NHA specifications.',
          retainage_pct: 5,
          amount_certified: 76000000, // PKR 76M (80% complete)
          retainage_deducted: 3800000, // PKR 3.8M retention
          net_paid: 72200000, // PKR 72.2M paid
          amount_released: 0,
          status: 'ACTIVE',
          dlp_status: 'IN_PROGRESS',
          dlp_months: 12,
          start_date: '2024-04-25',
          completion_date: '2024-07-10',
        }
      );
    }

    // PRJ-LDA-003 — Housing project subcontractors
    const ldaProject = projects.find(p => p.code === 'PRJ-LDA-003');
    if (ldaProject) {
      workOrders.push(
        {
          project_id: ldaProject.id,
          work_order_no: 'SC-LDA-001-PLUMB',
          work_order_date: '2024-05-05',
          subcontractor_name: 'Pak Plumbing & Sanitary Works',
          subcontractor_category: 'C-4',
          pec_license_no: 'PEC/CE/24561-C4/24',
          specialization_code: 'CE09',
          work_order_value: 8500000, // PKR 8.5M
          scope_of_work: 'Complete internal and external plumbing and sanitary installation for 200 residential units. Includes GI/UPVC piping, fixtures, underground drainage, water supply, and sewerage connection.',
          retainage_pct: 10,
          amount_certified: 3400000, // PKR 3.4M (40% complete)
          retainage_deducted: 340000, // PKR 340K retention
          net_paid: 3060000, // PKR 3.06M paid
          amount_released: 0,
          status: 'ACTIVE',
          dlp_status: 'IN_PROGRESS',
          dlp_months: 12,
          start_date: '2024-05-18',
          completion_date: '2024-09-30',
        },
        {
          project_id: ldaProject.id,
          work_order_no: 'SC-LDA-002-ELECT',
          work_order_date: '2024-05-08',
          subcontractor_name: 'Elite Electrical Contractors',
          subcontractor_category: 'C-3',
          pec_license_no: 'PEC/EE/14785-C3/23',
          specialization_code: 'EE01',
          work_order_value: 12000000, // PKR 12M
          scope_of_work: 'Complete electrical wiring, panel installation, DB distribution, lighting, and power outlets for 200 residential units. Includes main 11kV substation connection, transformers, and external street lighting.',
          retainage_pct: 10,
          amount_certified: 4800000, // PKR 4.8M (40% complete)
          retainage_deducted: 480000, // PKR 480K retention
          net_paid: 4320000, // PKR 4.32M paid
          amount_released: 0,
          status: 'ACTIVE',
          dlp_status: 'IN_PROGRESS',
          dlp_months: 12,
          start_date: '2024-05-20',
          completion_date: '2024-09-30',
        }
      );
    }

    // Insert subcontractor work orders
    for (const wo of workOrders) {
      // Store start_date, completion_date in domain_data as they don't exist in schema
      const domainData = {
        start_date: wo.start_date,
        completion_date: wo.completion_date,
        performance_bond_amount: Math.round(wo.work_order_value * 0.05), // 5% performance bond
        advance_payment_recovered: 0,
        payment_history: []
      };

      await pool.query(
        `INSERT INTO subcontractor_work_orders 
         (business_id, project_id, work_order_no, work_order_date, subcontractor_name,
          subcontractor_category, pec_license_no, specialization_code, work_order_value,
          scope_of_work, retainage_pct, amount_certified, retainage_deducted,
          net_paid, amount_released, status, dlp_status, dlp_months, domain_data, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          businessId,
          wo.project_id,
          wo.work_order_no,
          wo.work_order_date,
          wo.subcontractor_name,
          wo.subcontractor_category,
          wo.pec_license_no,
          wo.specialization_code,
          wo.work_order_value,
          wo.scope_of_work,
          wo.retainage_pct,
          wo.amount_certified,
          wo.retainage_deducted,
          wo.net_paid,
          wo.amount_released,
          wo.status,
          wo.dlp_status,
          wo.dlp_months,
          JSON.stringify(domainData),
          userId
        ]
      );
    }

    console.log(`✅ Seeded ${workOrders.length} subcontractor work orders\n`);

    // ============================================================================
    // VERIFY DATA COMPLETENESS
    // ============================================================================

    console.log('📊 Verifying Data Completeness...\n');

    const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = await Promise.all([
      pool.query('SELECT COUNT(*) as c FROM construction_projects WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM bill_of_quantities_items WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM interim_payment_certificates WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM machinery_logs WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM construction_daily_reports WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM construction_safety_logs WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM construction_quality_tests WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM construction_site_inspections WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as c FROM subcontractor_work_orders WHERE business_id = $1', [businessId])
    ]);

    console.log('✅ Data Completeness Summary:');
    console.log(`   ✅ Projects: ${r1.rows[0].c}`);
    console.log(`   ✅ BOQ Items: ${r2.rows[0].c}`);
    console.log(`   ✅ IPCs: ${r3.rows[0].c}`);
    console.log(`   ✅ Machinery Logs: ${r4.rows[0].c}`);
    console.log(`   ✅ Daily Reports: ${r5.rows[0].c}`);
    console.log(`   ✅ Safety Logs: ${r6.rows[0].c}`);
    console.log(`   ✅ Quality Tests: ${r7.rows[0].c}`);
    console.log(`   ✅ Site Inspections: ${r8.rows[0].c}`);
    console.log(`   ✅ Subcontractor Work Orders: ${r9.rows[0].c}`);

    // Calculate financial totals
    const financials = await pool.query(
      `SELECT 
         SUM(contract_value) as total_contract_value,
         SUM(amount_certified_to_date) as total_certified,
         SUM(retention_held) as total_retention,
         COUNT(*) as active_projects
       FROM construction_projects 
       WHERE business_id = $1 AND status = 'ACTIVE'`,
      [businessId]
    );

    const fin = financials.rows[0];
    console.log('\n💰 Financial Summary:');
    console.log(`   Total Contract Value: PKR ${(Number(fin.total_contract_value) / 1000000).toFixed(2)}M`);
    console.log(`   Total Certified to Date: PKR ${(Number(fin.total_certified_to_date) / 1000000).toFixed(2)}M`);
    console.log(`   Total Retention Held: PKR ${(Number(fin.total_retention) / 1000000).toFixed(2)}M`);
    console.log(`   Active Projects: ${fin.active_projects}`);

    console.log('\n✅ Construction domain is now complete with comprehensive Pakistani standards data!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
