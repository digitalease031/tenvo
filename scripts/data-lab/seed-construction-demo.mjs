#!/usr/bin/env node
/**
 * Seed Construction Demo Data
 * Creates sample projects, BOQ items, IPCs, machinery logs for demo-construction business
 * 
 * Usage: npx tsx scripts/data-lab/seed-construction-demo.mjs
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { createPool } from '../../lib/dataLab/pool.mjs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

const pool = createPool();

// Sample construction projects for Pakistan market
const SAMPLE_PROJECTS = [
  {
    code: 'PRJ-PHA-001',
    name: 'Confidential Pharmaceutical cGMP Cleanroom Facility',
    client_name: 'Leading Pharmaceutical Corporation',
    client_contact: '+92-42-111-222-333',
    contractor_category: 'C-A',
    contract_value: 450000000, // PKR 450M
    commencement_date: new Date('2024-01-15'),
    completion_date: new Date('2025-06-30'),
    province_code: 'PK-PB',
    is_government_project: false,
    pec_project_no: 'PEC-CE-001/2024',
    ppra_reference: null,
    employer_dept: null,
    mobilization_adv_pct: 10,
    retention_pct: 5,
    status: 'ACTIVE',
    completion_pct: 65,
    cumulative_certified: 292500000, // 65% of contract
    cumulative_paid: 250000000,
    retention_held: 14625000, // 5% of certified
    mobilization_recovered: 30000000,
    notes: 'ISO 5 cleanroom facility for OSD manufacturing with HVAC HEPA filtration system. Includes production hall, warehouse, QC labs, and utilities block.',
    domain_data: {
      project_type: 'life_sciences',
      facility_type: 'pharmaceutical_manufacturing',
      cleanroom_classification: 'ISO 5',
      built_area_sqft: 250000,
      hvac_system: 'HEPA Filtration',
      structural_type: 'RCC Frame',
    },
  },
  {
    code: 'PRJ-NHA-002',
    name: 'Lahore Ring Road Southern Loop Package-IV',
    client_name: 'National Highway Authority (NHA)',
    client_contact: '+92-51-921-0001',
    contractor_category: 'C-A',
    contract_value: 1250000000, // PKR 1.25B
    commencement_date: new Date('2023-07-01'),
    completion_date: new Date('2025-12-31'),
    province_code: 'PK-PB',
    is_government_project: true,
    pec_project_no: 'PEC-CE-045/2023',
    ppra_reference: 'PPRA-2023-NHA-001890',
    employer_dept: 'NHA Punjab Circle',
    mobilization_adv_pct: 10,
    retention_pct: 5,
    status: 'ACTIVE',
    completion_pct: 78,
    cumulative_certified: 975000000,
    cumulative_paid: 850000000,
    retention_held: 48750000,
    mobilization_recovered: 125000000,
    notes: '45km 4-lane highway with 2 flyovers, 6 underpasses, and RCC box culverts. Includes pavement, drainage, and street lighting.',
    domain_data: {
      project_type: 'civil_infrastructure',
      facility_type: 'highway',
      road_length_km: 45,
      road_width_m: 24,
      no_of_bridges: 2,
      no_of_culverts: 6,
      pavement_type: 'Flexible Asphalt',
    },
  },
  {
    code: 'PRJ-LDA-003',
    name: 'Affordable Housing Complex - Sabzazar Phase',
    client_name: 'Lahore Development Authority',
    client_contact: '+92-42-998-8000',
    contractor_category: 'C-1',
    contract_value: 680000000, // PKR 680M
    commencement_date: new Date('2024-03-01'),
    completion_date: new Date('2026-02-28'),
    province_code: 'PK-PB',
    is_government_project: true,
    pec_project_no: 'PEC-CE-078/2024',
    ppra_reference: 'PPRA-2024-LDA-00456',
    employer_dept: 'LDA Housing Directorate',
    mobilization_adv_pct: 10,
    retention_pct: 5,
    status: 'ACTIVE',
    completion_pct: 42,
    cumulative_certified: 285600000,
    cumulative_paid: 240000000,
    retention_held: 14280000,
    mobilization_recovered: 45000000,
    notes: '450 housing units in G+2 structures with community center, mosque, and park. Includes water supply, sewerage, and electrification.',
    domain_data: {
      project_type: 'residential',
      facility_type: 'affordable_housing',
      no_of_units: 450,
      building_type: 'G+2',
      built_area_sqft: 550000,
      structural_type: 'Load Bearing',
    },
  },
  {
    code: 'PRJ-BID-004',
    name: 'Karachi-Hyderabad M-9 Motorway Widening',
    client_name: 'National Highway Authority (NHA)',
    client_contact: '+92-51-921-0001',
    contractor_category: 'C-A',
    contract_value: 2800000000, // PKR 2.8B
    commencement_date: new Date('2024-09-01'), // Planned commencement
    completion_date: new Date('2026-12-31'), // Planned completion
    province_code: 'PK-SD',
    is_government_project: true,
    pec_project_no: null,
    ppra_reference: 'PPRA-2024-NHA-002341',
    employer_dept: 'NHA Sindh Circle',
    mobilization_adv_pct: 10,
    retention_pct: 5,
    status: 'BIDDING',
    completion_pct: 0,
    cumulative_certified: 0,
    cumulative_paid: 0,
    retention_held: 0,
    mobilization_recovered: 0,
    notes: 'Widening of existing 2-lane M-9 motorway to 6-lane with service roads. Includes 3 new interchanges and toll plaza. Technical bid submission: March 2024.',
    domain_data: {
      project_type: 'civil_infrastructure',
      facility_type: 'motorway',
      road_length_km: 136,
      existing_lanes: 2,
      proposed_lanes: 6,
      no_of_interchanges: 3,
      pavement_type: 'Rigid Concrete',
    },
  },
  {
    code: 'PRJ-WASA-005',
    name: 'Islamabad Zone-III Water Supply & Sewerage',
    client_name: 'Capital Development Authority (CDA)',
    client_contact: '+92-51-926-1100',
    contractor_category: 'C-1',
    contract_value: 325000000, // PKR 325M
    commencement_date: new Date('2024-05-01'),
    completion_date: new Date('2025-04-30'),
    province_code: 'PK-PB',
    is_government_project: true,
    pec_project_no: 'PEC-CE-112/2024',
    ppra_reference: 'PPRA-2024-CDA-00789',
    employer_dept: 'CDA Water Supply',
    mobilization_adv_pct: 10,
    retention_pct: 5,
    status: 'ACTIVE',
    completion_pct: 28,
    cumulative_certified: 91000000,
    cumulative_paid: 75000000,
    retention_held: 4550000,
    mobilization_recovered: 20000000,
    notes: 'Installation of 25km water supply network, 18km sewerage lines, 2 pumping stations, and overhead reservoir. Includes trenching, pipe laying, and restoration.',
    domain_data: {
      project_type: 'civil_infrastructure',
      facility_type: 'water_supply',
      water_network_km: 25,
      sewerage_network_km: 18,
      no_of_pumping_stations: 2,
      reservoir_capacity_gallons: 500000,
    },
  },
  {
    code: 'PRJ-RMC-006',
    name: 'Central RMC Batching Plant & Depot',
    client_name: 'Tenvo Construction (Internal)',
    client_contact: '+92-42-111-TENVO',
    contractor_category: 'C-2',
    contract_value: 185000000, // PKR 185M
    commencement_date: new Date('2023-11-01'),
    completion_date: new Date('2024-10-31'),
    province_code: 'PK-PB',
    is_government_project: false,
    pec_project_no: null,
    ppra_reference: null,
    employer_dept: null,
    mobilization_adv_pct: 0,
    retention_pct: 0,
    status: 'DLP',
    completion_pct: 100,
    cumulative_certified: 185000000,
    cumulative_paid: 185000000,
    retention_held: 0,
    mobilization_recovered: 0,
    notes: 'Internal RMC plant with 5,000 cu.m/day capacity. Includes batching plant, aggregate storage, cement silos, lab, workshop, and fleet parking for 25 transit mixers.',
    domain_data: {
      project_type: 'industrial',
      facility_type: 'concrete_batching',
      capacity_cum_per_day: 5000,
      no_of_silos: 4,
      fleet_capacity: 25,
      lab_facility: true,
    },
  },
];

// Sample BOQ items for the first project
const SAMPLE_BOQ_ITEMS = [
  {
    item_no: '1',
    description: 'Site Clearance & Demolition',
    unit: 'sqm',
    estimated_qty: 15000,
    estimated_rate: 125,
    schedule_code: 'A-001',
    sor_reference: 'MRS-Punjab-2023-A.1.1',
  },
  {
    item_no: '2',
    description: 'Excavation in Ordinary Soil up to 3m depth',
    unit: 'cum',
    estimated_qty: 8500,
    estimated_rate: 450,
    schedule_code: 'B-012',
    sor_reference: 'MRS-Punjab-2023-B.1.2',
  },
  {
    item_no: '3',
    description: 'Plain Cement Concrete 1:3:6 in Foundation',
    unit: 'cum',
    estimated_qty: 1200,
    estimated_rate: 18500,
    schedule_code: 'C-045',
    sor_reference: 'MRS-Punjab-2023-C.3.1',
  },
  {
    item_no: '4',
    description: 'Reinforced Cement Concrete 1:2:4 Grade 60 with Rebar',
    unit: 'cum',
    estimated_qty: 4500,
    estimated_rate: 32500,
    schedule_code: 'C-052',
    sor_reference: 'MRS-Punjab-2023-C.4.5',
  },
  {
    item_no: '5',
    description: 'Steel Reinforcement ASTM A615 Grade 60',
    unit: 'kg',
    estimated_qty: 850000,
    estimated_rate: 285,
    schedule_code: 'D-023',
    sor_reference: 'MRS-Punjab-2023-D.2.1',
  },
  {
    item_no: '6',
    description: 'Brick Masonry in Cement Mortar 1:4 (9-inch wall)',
    unit: 'sqm',
    estimated_qty: 12000,
    estimated_rate: 2850,
    schedule_code: 'E-101',
    sor_reference: 'MRS-Punjab-2023-E.1.2',
  },
  {
    item_no: '7',
    description: 'Cement Plaster 1:4 Smooth Finish',
    unit: 'sqm',
    estimated_qty: 28000,
    estimated_rate: 425,
    schedule_code: 'F-056',
    sor_reference: 'MRS-Punjab-2023-F.2.3',
  },
  {
    item_no: '8',
    description: 'HVAC HEPA Filtration System ISO 5 Cleanroom',
    unit: 'sqm',
    estimated_qty: 5000,
    estimated_rate: 25000,
    schedule_code: 'G-089',
    sor_reference: 'MRS-Punjab-2023-G.7.5',
  },
  {
    item_no: '9',
    description: 'Electrical Installation & Distribution (11kV Substation)',
    unit: 'ls',
    estimated_qty: 1,
    estimated_rate: 45000000,
    schedule_code: 'H-034',
    sor_reference: 'MRS-Punjab-2023-H.4.1',
  },
  {
    item_no: '10',
    description: 'Fire Fighting & Sprinkler System',
    unit: 'ls',
    estimated_qty: 1,
    estimated_rate: 18000000,
    schedule_code: 'I-012',
    sor_reference: 'MRS-Punjab-2023-I.1.5',
  },
];

// Sample IPCs for the first project
const SAMPLE_IPCS = [
  {
    ipc_number: 1,
    period_ending: new Date('2024-02-28'),
    gross_certified_amount: 45000000,
    this_ipc_gross: 45000000,
    retention_deduction: 2250000,
    mobilization_recovery: 10000000,
    net_before_tax: 32750000,
    wht_deduction: 4500000,
    net_payable: 28250000,
    status: 'DISBURSED',
    disbursed_at: new Date('2024-03-15'),
    notes: 'IPC-1: Mobilization advance and site preparation work',
  },
  {
    ipc_number: 2,
    period_ending: new Date('2024-03-31'),
    gross_certified_amount: 107000000,
    this_ipc_gross: 62000000,
    retention_deduction: 5350000,
    mobilization_recovery: 10000000,
    net_before_tax: 46650000,
    wht_deduction: 6200000,
    net_payable: 40450000,
    status: 'DISBURSED',
    disbursed_at: new Date('2024-04-20'),
    notes: 'IPC-2: Foundation excavation and PCC complete',
  },
  {
    ipc_number: 3,
    period_ending: new Date('2024-04-30'),
    gross_certified_amount: 192000000,
    this_ipc_gross: 85000000,
    retention_deduction: 9600000,
    mobilization_recovery: 10000000,
    net_before_tax: 65400000,
    wht_deduction: 8500000,
    net_payable: 56900000,
    status: 'DISBURSED',
    disbursed_at: new Date('2024-05-18'),
    notes: 'IPC-3: RCC columns and beams up to first floor',
  },
  {
    ipc_number: 4,
    period_ending: new Date('2024-05-31'),
    gross_certified_amount: 270000000,
    this_ipc_gross: 78000000,
    retention_deduction: 13500000,
    mobilization_recovery: 0,
    net_before_tax: 64500000,
    wht_deduction: 7800000,
    net_payable: 56700000,
    status: 'APPROVED',
    approved_at: new Date('2024-06-05'),
    notes: 'IPC-4: Ground floor slab and second floor structure',
  },
  {
    ipc_number: 5,
    period_ending: new Date('2024-06-30'),
    gross_certified_amount: 292500000,
    this_ipc_gross: 22500000,
    retention_deduction: 14625000,
    mobilization_recovery: 0,
    net_before_tax: 22500000,
    wht_deduction: 2250000,
    net_payable: 20250000,
    status: 'SUBMITTED',
    notes: 'IPC-5: Brickwork and plastering ongoing, HVAC duct installation started',
  },
];

// Sample machinery fleet
const SAMPLE_MACHINERY = [
  {
    equipment_code: 'EXC-001',
    name: 'Caterpillar 320D Excavator',
    type: 'excavator',
    make: 'Caterpillar',
    model: '320D',
    registration_no: 'LHR-CM-9876',
    year: 2018,
    hourly_rate: 3500,
    fuel_capacity_liters: 400,
    operator_name: 'Muhammad Akram',
    status: 'ACTIVE',
    last_service_date: new Date('2024-01-15'),
    next_service_due: new Date('2024-04-15'),
  },
  {
    equipment_code: 'CRN-002',
    name: 'Tower Crane Liebherr 280 EC-H',
    type: 'crane',
    make: 'Liebherr',
    model: '280 EC-H',
    registration_no: 'LHR-TC-4532',
    year: 2020,
    hourly_rate: 8500,
    fuel_capacity_liters: 0, // Electric
    operator_name: 'Aamir Hassan',
    status: 'ACTIVE',
    last_service_date: new Date('2024-02-01'),
    next_service_due: new Date('2024-05-01'),
  },
  {
    equipment_code: 'MIX-003',
    name: 'Transit Mixer Hino 700 Series',
    type: 'concrete_mixer',
    make: 'Hino',
    model: '700 Series',
    registration_no: 'LHR-TM-2341',
    year: 2019,
    hourly_rate: 2800,
    fuel_capacity_liters: 300,
    operator_name: 'Shahid Mehmood',
    status: 'ACTIVE',
    last_service_date: new Date('2024-01-20'),
    next_service_due: new Date('2024-04-20'),
  },
  {
    equipment_code: 'GEN-004',
    name: 'Perkins 150kVA Diesel Generator',
    type: 'generator',
    make: 'Perkins',
    model: '150kVA',
    registration_no: 'GEN-PK-8821',
    year: 2021,
    hourly_rate: 1200,
    fuel_capacity_liters: 500,
    operator_name: 'Rashid Ali',
    status: 'ACTIVE',
    last_service_date: new Date('2024-02-10'),
    next_service_due: new Date('2024-05-10'),
  },
  {
    equipment_code: 'COM-005',
    name: 'Atlas Copco XAMS 850 Compressor',
    type: 'compressor',
    make: 'Atlas Copco',
    model: 'XAMS 850',
    registration_no: 'LHR-CP-6754',
    year: 2017,
    hourly_rate: 1500,
    fuel_capacity_liters: 120,
    operator_name: 'Naveed Ahmed',
    status: 'MAINTENANCE',
    last_service_date: new Date('2024-02-25'),
    next_service_due: new Date('2024-03-25'),
  },
];

// Sample subcontractors
const SAMPLE_SUBCONTRACTORS = [
  {
    code: 'SUB-001',
    name: 'Elite Steel Fabricators',
    trade: 'steel_fabrication',
    contact_person: 'Arif Mahmood',
    phone: '+92-42-3589-7654',
    email: 'contracts@elitesteel.pk',
    ntn: '3214567-8',
    retention_limit_pct: 5,
    outstanding_balance: 12500000,
    total_work_orders: 3,
    status: 'ACTIVE',
  },
  {
    code: 'SUB-002',
    name: 'Pak HVAC Solutions',
    trade: 'hvac_mechanical',
    contact_person: 'Engr. Kamran Haider',
    phone: '+92-42-3721-8899',
    email: 'projects@pakhvac.com.pk',
    ntn: '4398765-1',
    retention_limit_pct: 5,
    outstanding_balance: 28000000,
    total_work_orders: 2,
    status: 'ACTIVE',
  },
  {
    code: 'SUB-003',
    name: 'Hafeez Electrical Contractors',
    trade: 'electrical',
    contact_person: 'Muhammad Hafeez',
    phone: '+92-42-3654-2211',
    email: 'info@hafeezelectric.pk',
    ntn: '2876543-2',
    retention_limit_pct: 5,
    outstanding_balance: 8500000,
    total_work_orders: 4,
    status: 'ACTIVE',
  },
  {
    code: 'SUB-004',
    name: 'Royal Plumbing & Sanitary',
    trade: 'plumbing',
    contact_person: 'Zahid Hussain',
    phone: '+92-42-3498-5544',
    email: 'contracts@royalplumbing.pk',
    ntn: '3987654-9',
    retention_limit_pct: 5,
    outstanding_balance: 4200000,
    total_work_orders: 2,
    status: 'ACTIVE',
  },
];

async function main() {
  console.log('🏗️  Seeding Construction Demo Data...\n');

  // Find demo-construction business
  const businessResult = await pool.query(
    `SELECT * FROM businesses WHERE domain = $1 LIMIT 1`,
    ['demo-construction']
  );

  if (businessResult.rows.length === 0) {
    console.error('❌ demo-construction business not found. Please run registration seed first.');
    process.exit(1);
  }

  const demoBusiness = businessResult.rows[0];
  console.log(`✅ Found business: ${demoBusiness.business_name} (${demoBusiness.id})\n`);

  // Clear existing construction data
  console.log('🧹 Clearing existing construction data...');
  await pool.query(`DELETE FROM machinery_logs WHERE business_id = $1`, [demoBusiness.id]);
  await pool.query(`DELETE FROM interim_payment_certificates WHERE business_id = $1`, [demoBusiness.id]);
  await pool.query(`DELETE FROM bill_of_quantities_items WHERE business_id = $1`, [demoBusiness.id]);
  await pool.query(`DELETE FROM subcontractor_work_orders WHERE business_id = $1`, [demoBusiness.id]);
  await pool.query(`DELETE FROM construction_projects WHERE business_id = $1`, [demoBusiness.id]);
  console.log('✅ Cleared\n');

  // Seed projects
  console.log('📊 Seeding projects...');
  const projects = [];
  for (const projectData of SAMPLE_PROJECTS) {
    const result = await pool.query(
      `INSERT INTO construction_projects (
        business_id, code, name, client_name, client_contact, contractor_category,
        contract_value, commencement_date, completion_date, province_code,
        is_government_project, pec_project_no, ppra_reference, employer_dept,
        mobilization_adv_pct, retention_pct, status, completion_pct,
        cumulative_certified, cumulative_paid, retention_held, mobilization_recovered,
        notes, domain_data, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25
      ) RETURNING *`,
      [
        demoBusiness.id, projectData.code, projectData.name, projectData.client_name,
        projectData.client_contact, projectData.contractor_category, projectData.contract_value,
        projectData.commencement_date, projectData.completion_date, projectData.province_code,
        projectData.is_government_project, projectData.pec_project_no, projectData.ppra_reference,
        projectData.employer_dept, projectData.mobilization_adv_pct, projectData.retention_pct,
        projectData.status, projectData.completion_pct, projectData.cumulative_certified,
        projectData.cumulative_paid, projectData.retention_held, projectData.mobilization_recovered,
        projectData.notes, JSON.stringify(projectData.domain_data), demoBusiness.owner_id || demoBusiness.user_id
      ]
    );
    projects.push(result.rows[0]);
    console.log(`  ✓ ${result.rows[0].code} - ${result.rows[0].name}`);
  }
  console.log(`✅ Created ${projects.length} projects\n`);

  // Seed BOQ items for first project
  const firstProject = projects[0];
  console.log('📋 Seeding BOQ items for first project...');
  for (const boqData of SAMPLE_BOQ_ITEMS) {
    await pool.query(
      `INSERT INTO bill_of_quantities_items (
        project_id, business_id, item_no, description, unit,
        estimated_qty, estimated_rate, schedule_code, sor_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        firstProject.id, demoBusiness.id, boqData.item_no,
        boqData.description, boqData.unit, boqData.estimated_qty, boqData.estimated_rate,
        boqData.schedule_code, boqData.sor_reference
      ]
    );
  }
  console.log(`✅ Created ${SAMPLE_BOQ_ITEMS.length} BOQ items\n`);

  // Seed IPCs for first project
  console.log('📄 Seeding IPCs for first project...');
  for (const ipcData of SAMPLE_IPCS) {
    await pool.query(
      `INSERT INTO interim_payment_certificates (
        project_id, business_id, ipc_number, period_ending, gross_certified_amount,
        this_ipc_gross, retention_deduction, mobilization_recovery, net_before_tax,
        wht_deduction, net_payable, status, approved_at, disbursed_at, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        firstProject.id, demoBusiness.id, ipcData.ipc_number, ipcData.period_ending,
        ipcData.gross_certified_amount, ipcData.this_ipc_gross, ipcData.retention_deduction,
        ipcData.mobilization_recovery, ipcData.net_before_tax, ipcData.wht_deduction,
        ipcData.net_payable, ipcData.status, ipcData.approved_at || null,
        ipcData.disbursed_at || null, ipcData.notes
      ]
    );
  }
  console.log(`✅ Created ${SAMPLE_IPCS.length} IPCs\n`);

  // Seed machinery logs (simplified - no separate machinery table)
  console.log('📊 Seeding machinery logs...');
  let logCount = 0;
  const machTypes = ['excavator', 'crane', 'concrete_mixer'];
  for (let machIdx = 0; machIdx < 3; machIdx++) {
    const machType = machTypes[machIdx];
    // Create 5 days of logs
    for (let i = 0; i < 5; i++) {
      const logDate = new Date('2024-06-01');
      logDate.setDate(logDate.getDate() + i);
      const fuelConsumed = machType === 'excavator' ? 80 : machType === 'crane' ? 0 : 60;
      const startHours = 1000 + (i * 9);
      const endHours = startHours + 9;
      
      await pool.query(
        `INSERT INTO machinery_logs (
          business_id, project_id, log_date, machinery_code, machinery_name, equipment_type,
          operator_name, start_hours, end_hours, fuel_litres, work_description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          demoBusiness.id, firstProject.id, logDate, 
          `${machType.toUpperCase()}-${machIdx+1}`,
          `${machType.replace('_', ' ')} Unit ${machIdx+1}`,
          machType,
          `Operator ${machIdx+1}`,
          startHours, endHours, fuelConsumed,
          `Operating on ${firstProject.name}`
        ]
      );
      logCount++;
    }
  }
  console.log(`✅ Created ${logCount} machinery logs\n`);

  console.log('🎉 Construction demo data seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • ${projects.length} projects`);
  console.log(`   • ${SAMPLE_BOQ_ITEMS.length} BOQ items`);
  console.log(`   • ${SAMPLE_IPCS.length} IPCs`);
  console.log(`   • ${logCount} machinery logs\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding construction demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
