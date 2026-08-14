/**
 * Construction Operations Seed Data
 * Creates realistic construction projects, BOQ, IPCs, machinery, and site operations
 * for demo-construction business.
 */

import { db } from '../db.js';

// ── Seed Projects ─────────────────────────────────────────────────────────────

export const CONSTRUCTION_SEED_PROJECTS = [
  {
    code: 'PRJ-PH-2026-001',
    name: 'Confidential Pharmaceutical cGMP Cleanroom Facility',
    client_name: 'Life Sciences Pakistan Ltd',
    client_contact: '+92-42-3456-7890',
    employer_dept: 'Project Management Unit',
    contractor_category: 'C-1',
    contract_value: 850000000, // PKR 850M
    commencement_date: '2026-03-01',
    completion_date: '2027-12-31',
    province_code: 'PK-PB',
    is_government_project: false,
    pec_project_no: 'PEC-CE-PH-2026-001',
    ppra_reference: null,
    mobilization_adv_pct: 10,
    retention_pct: 5,
    status: 'ACTIVE',
    notes: 'Turnkey EPC project — ISO 5-8 cleanrooms, HVAC HEPA filtration, VDC coordinated MEP',
    cumulative_certified: 425000000, // 50% progress
    retention_held: 21250000, // 5% of certified
  },
  {
    code: 'PRJ-CI-2026-002',
    name: 'Lahore Ring Road Southern Loop Phase-II',
    client_name: 'National Highway Authority',
    client_contact: '+92-42-9900-5500',
    employer_dept: 'CWD Punjab — Roads Division',
    contractor_category: 'C-A',
    contract_value: 2500000000, // PKR 2.5B
    commencement_date: '2026-01-15',
    completion_date: '2028-06-30',
    province_code: 'PK-PB',
    is_government_project: true,
    pec_project_no: 'PEC-CE-CI-2026-002',
    ppra_reference: 'PPRA-PB-2025-009988',
    mobilization_adv_pct: 15,
    retention_pct: 5,
    status: 'ACTIVE',
    notes: '65km dual carriageway, Grade 60 rebar, RMC C25/C30, PEC Category C-A compliance',
    cumulative_certified: 750000000, // 30% progress
    retention_held: 37500000,
  },
  {
    code: 'PRJ-RH-2026-003',
    name: 'Elite Residencia Tower-A (G+24 Mixed-Use)',
    client_name: 'Elite Developers Pvt Ltd',
    client_contact: '+92-42-3789-1234',
    employer_dept: 'Private Developer',
    contractor_category: 'C-1',
    contract_value: 1200000000, // PKR 1.2B
    commencement_date: '2025-11-01',
    completion_date: '2027-10-31',
    province_code: 'PK-PB',
    is_government_project: false,
    pec_project_no: 'PEC-CE-RH-2026-003',
    ppra_reference: null,
    mobilization_adv_pct: 10,
    retention_pct: 5,
    status: 'ACTIVE',
    notes: '450 residential units + commercial podium, seismic design, post-tensioned slabs',
    cumulative_certified: 840000000, // 70% progress
    retention_held: 42000000,
  },
  {
    code: 'PRJ-ID-2026-004',
    name: 'Central RMC Batching Plant & Heavy Equipment Hub',
    client_name: 'Tenvo Constructors (Self)',
    client_contact: '+92-300-1234567',
    employer_dept: 'Internal Capital Project',
    contractor_category: 'C-2',
    contract_value: 350000000, // PKR 350M
    commencement_date: '2026-02-01',
    completion_date: '2026-12-31',
    province_code: 'PK-PB',
    is_government_project: false,
    pec_project_no: null,
    ppra_reference: null,
    mobilization_adv_pct: 0,
    retention_pct: 0,
    status: 'ACTIVE',
    notes: '5,000 Cu.M/day capacity, automated batching, fleet parking & maintenance facility',
    cumulative_certified: 245000000, // 70% progress
    retention_held: 0, // Self-project, no retention
  },
  {
    code: 'PRJ-DLP-2025-005',
    name: 'Islamabad Convention Centre Phase-I',
    client_name: 'Capital Development Authority',
    client_contact: '+92-51-9000-3000',
    employer_dept: 'CDA Infrastructure Wing',
    contractor_category: 'C-A',
    contract_value: 1800000000, // PKR 1.8B
    commencement_date: '2024-06-01',
    completion_date: '2026-05-31',
    province_code: 'PK-IS',
    is_government_project: true,
    pec_project_no: 'PEC-CE-DLP-2025-005',
    ppra_reference: 'PPRA-IC-2024-007766',
    mobilization_adv_pct: 15,
    retention_pct: 5,
    status: 'DLP', // Defects Liability Period
    notes: 'Major convention facility, structural complete, in 12-month DLP warranty period',
    cumulative_certified: 1800000000, // 100% complete
    retention_held: 90000000, // 5% held during DLP
  },
  {
    code: 'PRJ-BID-2026-006',
    name: 'Faisalabad-Multan Motorway Interchange (Pkg-C)',
    client_name: 'National Highway Authority',
    client_contact: '+92-41-9200-8800',
    employer_dept: 'NHA Zone-II',
    contractor_category: 'C-A',
    contract_value: 3200000000, // PKR 3.2B
    commencement_date: null,
    completion_date: null,
    province_code: 'PK-PB',
    is_government_project: true,
    pec_project_no: null,
    ppra_reference: 'PPRA-NHA-2026-001122',
    mobilization_adv_pct: 15,
    retention_pct: 5,
    status: 'BIDDING',
    notes: 'Pre-qualification complete, technical proposal under review, financial opening pending',
    cumulative_certified: 0,
    retention_held: 0,
  },
];

// ── BOQ Items for Project 1 (Pharmaceutical Cleanroom) ────────────────────────

export const CONSTRUCTION_SEED_BOQ_PROJECT1 = [
  {
    item_code: 'A-01.01',
    description: 'Site Clearance & Excavation (Bulk)',
    unit: 'Cu.M',
    quantity: 12500,
    unit_rate: 450,
    category: 'Earthwork',
    notes: 'Machine excavation up to 5m depth, disposal within site',
  },
  {
    item_code: 'B-02.05',
    description: 'RCC Foundation Mat (C30 Grade) with Grade 60 Rebar',
    unit: 'Cu.M',
    quantity: 850,
    unit_rate: 28500,
    category: 'Concrete Work',
    notes: 'Ready-mix concrete C30 (3000 PSI), ASTM A615 Gr.60 rebar',
  },
  {
    item_code: 'C-03.12',
    description: 'Structural Steel Frame (ASTM A992)',
    unit: 'MT',
    quantity: 320,
    unit_rate: 185000,
    category: 'Structural Steel',
    notes: 'Prime structural steel beams & columns, shop drawings required',
  },
  {
    item_code: 'D-04.20',
    description: 'Cleanroom Modular Wall Panels (ISO 5-7)',
    unit: 'Sq.M',
    quantity: 4200,
    unit_rate: 8500,
    category: 'Architectural Finishes',
    notes: 'Insulated sandwich panels, powder-coated steel, cGMP compliant',
  },
  {
    item_code: 'E-05.08',
    description: 'HVAC Air Handling Unit (AHU) with HEPA 99.97% Filtration',
    unit: 'Unit',
    quantity: 12,
    unit_rate: 4500000,
    category: 'MEP — HVAC',
    notes: 'Pharmaceutical-grade AHUs, 10,000 CFM capacity, H14 HEPA filters',
  },
  {
    item_code: 'F-06.15',
    description: 'Electrical Distribution Panels & UPS (500 KVA)',
    unit: 'LS',
    quantity: 1,
    unit_rate: 18000000,
    category: 'MEP — Electrical',
    notes: 'Lump sum for main & sub-distribution, UPS backup, emergency lighting',
  },
  {
    item_code: 'G-07.03',
    description: 'Fire Alarm & Suppression System (FM200)',
    unit: 'LS',
    quantity: 1,
    unit_rate: 6500000,
    category: 'MEP — Fire Protection',
    notes: 'Addressable fire alarm, FM200 clean agent suppression for cleanrooms',
  },
  {
    item_code: 'H-08.10',
    description: 'BMS & SCADA Integration (Building Automation)',
    unit: 'LS',
    quantity: 1,
    unit_rate: 9000000,
    category: 'MEP — Automation',
    notes: 'Central BMS for HVAC, lighting, access control, and monitoring',
  },
];

// ── BOQ Items for Project 2 (Highway) ─────────────────────────────────────────

export const CONSTRUCTION_SEED_BOQ_PROJECT2 = [
  {
    item_code: 'A-01.02',
    description: 'Earthwork Cutting & Embankment',
    unit: 'Cu.M',
    quantity: 580000,
    unit_rate: 320,
    category: 'Earthwork',
    notes: 'Machine excavation, compaction in 200mm layers, 95% MDD',
  },
  {
    item_code: 'B-02.08',
    description: 'Sub-base (GSB) — Granular Sub Base',
    unit: 'Cu.M',
    quantity: 95000,
    unit_rate: 1850,
    category: 'Pavement Layers',
    notes: 'Crushed aggregate base, 150mm thickness, mechanically compacted',
  },
  {
    item_code: 'C-03.15',
    description: 'Bituminous Base Course (100mm)',
    unit: 'Sq.M',
    quantity: 420000,
    unit_rate: 680,
    category: 'Pavement Layers',
    notes: 'Hot mix asphalt binder course, 100mm compacted thickness',
  },
  {
    item_code: 'D-04.22',
    description: 'Wearing Course — Asphaltic Concrete (50mm)',
    unit: 'Sq.M',
    quantity: 420000,
    unit_rate: 420,
    category: 'Pavement Layers',
    notes: 'Dense bituminous macadam (DBM), 50mm final wearing surface',
  },
  {
    item_code: 'E-05.10',
    description: 'RCC Box Culvert (3.0m x 2.5m)',
    unit: 'R.M',
    quantity: 850,
    unit_rate: 125000,
    category: 'Drainage Structures',
    notes: 'Reinforced concrete box culvert, internal waterproofing',
  },
  {
    item_code: 'F-06.18',
    description: 'Road Signage & Traffic Safety Barriers',
    unit: 'LS',
    quantity: 1,
    unit_rate: 45000000,
    category: 'Traffic Management',
    notes: 'Reflective road signs, W-beam guardrails, rumble strips, markings',
  },
];

// ── BOQ Items for Project 3 (Residential Tower) ───────────────────────────────

export const CONSTRUCTION_SEED_BOQ_PROJECT3 = [
  {
    item_code: 'A-01.05',
    description: 'Basement Excavation & Shoring (4-Level)',
    unit: 'Cu.M',
    quantity: 28000,
    unit_rate: 580,
    category: 'Earthwork',
    notes: 'Deep excavation with sheet pile shoring, dewatering included',
  },
  {
    item_code: 'B-02.12',
    description: 'RCC Columns & Shear Walls (C40 Grade)',
    unit: 'Cu.M',
    quantity: 3200,
    unit_rate: 32000,
    category: 'Concrete Work',
    notes: 'High-strength concrete C40, Grade 60 rebar, seismic design',
  },
  {
    item_code: 'C-03.18',
    description: 'Post-Tensioned Slab System (PT)',
    unit: 'Sq.M',
    quantity: 42000,
    unit_rate: 4800,
    category: 'Concrete Work',
    notes: 'Unbonded PT cables, 200mm slab thickness, VSL system',
  },
  {
    item_code: 'D-04.25',
    description: 'Aluminum & Glass Curtain Wall Facade',
    unit: 'Sq.M',
    quantity: 9500,
    unit_rate: 12500,
    category: 'Facade',
    notes: 'Unitized curtain wall, low-E double glazing, wind load tested',
  },
  {
    item_code: 'E-05.12',
    description: 'Passenger Elevators (12-person, 6 units)',
    unit: 'Unit',
    quantity: 6,
    unit_rate: 8500000,
    category: 'MEP — Elevators',
    notes: 'High-speed traction elevators, 1.5 m/s, MRL design',
  },
  {
    item_code: 'F-06.20',
    description: 'Fire Fighting Wet Riser & Sprinkler System',
    unit: 'LS',
    quantity: 1,
    unit_rate: 22000000,
    category: 'MEP — Fire Protection',
    notes: 'Wet riser to all floors, sprinkler coverage, jockey pump system',
  },
];

// ── IPCs for Active Projects ──────────────────────────────────────────────────

export const CONSTRUCTION_SEED_IPCS = [
  // Project 1 — Pharmaceutical Cleanroom (50% progress)
  {
    project_code: 'PRJ-PH-2026-001',
    ipc_number: 1,
    bill_date: '2026-05-31',
    work_done_value: 127500000, // 15%
    previous_bills: 0,
    retention_percent: 5,
    tax_deducted: 12750000, // 10% WHT
    status: 'APPROVED',
    notes: 'Mobilization advance + initial earthwork & foundation',
  },
  {
    project_code: 'PRJ-PH-2026-001',
    ipc_number: 2,
    bill_date: '2026-07-31',
    work_done_value: 170000000, // 20%
    previous_bills: 127500000,
    retention_percent: 5,
    tax_deducted: 17000000,
    status: 'APPROVED',
    notes: 'Structural frame complete, MEP rough-ins commenced',
  },
  {
    project_code: 'PRJ-PH-2026-001',
    ipc_number: 3,
    bill_date: '2026-09-30',
    work_done_value: 127500000, // 15%
    previous_bills: 297500000,
    retention_percent: 5,
    tax_deducted: 12750000,
    status: 'APPROVED',
    notes: 'Cleanroom modular panels installation, HVAC AHU positioning',
  },

  // Project 2 — Highway (30% progress)
  {
    project_code: 'PRJ-CI-2026-002',
    ipc_number: 1,
    bill_date: '2026-04-30',
    work_done_value: 375000000, // 15%
    previous_bills: 0,
    retention_percent: 5,
    tax_deducted: 37500000,
    status: 'APPROVED',
    notes: 'Mobilization + earthwork 25km completed',
  },
  {
    project_code: 'PRJ-CI-2026-002',
    ipc_number: 2,
    bill_date: '2026-07-31',
    work_done_value: 375000000, // 15%
    previous_bills: 375000000,
    retention_percent: 5,
    tax_deducted: 37500000,
    status: 'SUBMITTED',
    notes: 'Sub-base & base course 40km in progress',
  },

  // Project 3 — Residential Tower (70% progress)
  {
    project_code: 'PRJ-RH-2026-003',
    ipc_number: 1,
    bill_date: '2026-01-31',
    work_done_value: 180000000, // 15%
    previous_bills: 0,
    retention_percent: 5,
    tax_deducted: 18000000,
    status: 'APPROVED',
    notes: 'Basement excavation & shoring complete',
  },
  {
    project_code: 'PRJ-RH-2026-003',
    ipc_number: 2,
    bill_date: '2026-03-31',
    work_done_value: 180000000, // 15%
    previous_bills: 180000000,
    retention_percent: 5,
    tax_deducted: 18000000,
    status: 'APPROVED',
    notes: 'Basement RCC complete, ground floor commenced',
  },
  {
    project_code: 'PRJ-RH-2026-003',
    ipc_number: 3,
    bill_date: '2026-05-31',
    work_done_value: 240000000, // 20%
    previous_bills: 360000000,
    retention_percent: 5,
    tax_deducted: 24000000,
    status: 'APPROVED',
    notes: 'Floors 1-8 structural complete',
  },
  {
    project_code: 'PRJ-RH-2026-003',
    ipc_number: 4,
    bill_date: '2026-07-31',
    work_done_value: 240000000, // 20%
    previous_bills: 600000000,
    retention_percent: 5,
    tax_deducted: 24000000,
    status: 'APPROVED',
    notes: 'Floors 9-18 complete, curtain wall commenced',
  },
];

// ── Machinery Fleet ───────────────────────────────────────────────────────────

export const CONSTRUCTION_SEED_MACHINERY = [
  {
    equipment_code: 'EXC-001',
    name: 'Caterpillar 320D Hydraulic Excavator',
    type: 'Excavator',
    registration_no: 'LHR-CAT-320D-001',
    hourly_rate: 8500,
    ownership_type: 'OWNED',
    status: 'IN_USE',
    notes: '20-ton capacity, bucket 1.2 Cu.M, GPS fleet tracking',
  },
  {
    equipment_code: 'EXC-002',
    name: 'Komatsu PC200 Excavator',
    type: 'Excavator',
    registration_no: 'LHR-KOM-200-002',
    hourly_rate: 7500,
    ownership_type: 'OWNED',
    status: 'AVAILABLE',
    notes: '18-ton, fuel-efficient model, regular maintenance up-to-date',
  },
  {
    equipment_code: 'CRN-001',
    name: 'Liebherr LTM 1100 Mobile Crane',
    type: 'Mobile Crane',
    registration_no: 'LHR-LBH-1100-001',
    hourly_rate: 18000,
    ownership_type: 'OWNED',
    status: 'IN_USE',
    notes: '100-ton capacity, 52m boom, certified crane operator included',
  },
  {
    equipment_code: 'CRN-002',
    name: 'Tower Crane (Potain MC 310 K12)',
    type: 'Tower Crane',
    registration_no: 'LHR-POT-310-002',
    hourly_rate: 25000,
    ownership_type: 'RENTED',
    status: 'IN_USE',
    notes: 'Max load 12 tons, 70m jib, monthly rental PKR 4.5M',
  },
  {
    equipment_code: 'RMC-001',
    name: 'RMC Transit Mixer (8 Cu.M Capacity)',
    type: 'Concrete Mixer',
    registration_no: 'LHR-RMC-8M-001',
    hourly_rate: 3500,
    ownership_type: 'OWNED',
    status: 'AVAILABLE',
    notes: 'Drum capacity 8 cubic meters, GPS slump monitoring',
  },
  {
    equipment_code: 'RMC-002',
    name: 'RMC Transit Mixer (10 Cu.M)',
    type: 'Concrete Mixer',
    registration_no: 'LHR-RMC-10M-002',
    hourly_rate: 4000,
    ownership_type: 'OWNED',
    status: 'IN_USE',
    notes: '10 Cu.M drum, hydraulic pump, active on Elite Residencia',
  },
  {
    equipment_code: 'RLR-001',
    name: 'Hamm HD+ 120 VV Tandem Roller',
    type: 'Compactor',
    registration_no: 'LHR-HAM-120-001',
    hourly_rate: 6000,
    ownership_type: 'OWNED',
    status: 'IN_USE',
    notes: '12-ton smooth drum roller for asphalt compaction',
  },
  {
    equipment_code: 'GEN-001',
    name: 'Cummins 500 KVA Diesel Generator',
    type: 'Generator',
    registration_no: 'LHR-CUM-500-001',
    hourly_rate: 4500,
    ownership_type: 'OWNED',
    status: 'AVAILABLE',
    notes: 'Backup power for site offices and critical equipment',
  },
  {
    equipment_code: 'LDR-001',
    name: 'JCB 3CX Backhoe Loader',
    type: 'Loader',
    registration_no: 'LHR-JCB-3CX-001',
    hourly_rate: 5500,
    ownership_type: 'OWNED',
    status: 'AVAILABLE',
    notes: 'Front loader + rear excavator, versatile utility machine',
  },
  {
    equipment_code: 'TRK-001',
    name: 'Hino 700 Series Dump Truck (20T)',
    type: 'Dump Truck',
    registration_no: 'LHR-HIN-700-001',
    hourly_rate: 4000,
    ownership_type: 'OWNED',
    status: 'IN_USE',
    notes: '20-ton payload, hydraulic tipper, mileage tracking enabled',
  },
];

// ── Machinery Logs (Recent Activity) ──────────────────────────────────────────

export const CONSTRUCTION_SEED_MACHINERY_LOGS = [
  // Excavator on Project 1
  {
    project_code: 'PRJ-PH-2026-001',
    equipment_code: 'EXC-001',
    log_date: '2026-08-12',
    hours_worked: 9.5,
    operator_name: 'Muhammad Akram',
    activity_description: 'Excavation for underground water tanks',
    fuel_consumed: 85,
    notes: 'Normal operation, no issues',
  },
  {
    project_code: 'PRJ-PH-2026-001',
    equipment_code: 'EXC-001',
    log_date: '2026-08-13',
    hours_worked: 10.0,
    operator_name: 'Muhammad Akram',
    activity_description: 'Trenching for utility lines',
    fuel_consumed: 92,
    notes: 'Full day operation',
  },

  // Crane on Project 3
  {
    project_code: 'PRJ-RH-2026-003',
    equipment_code: 'CRN-001',
    log_date: '2026-08-12',
    hours_worked: 8.0,
    operator_name: 'Sajjad Hussain (Certified)',
    activity_description: 'Lifting precast facade panels to floor 18',
    fuel_consumed: 120,
    notes: 'Safety inspection completed before lift',
  },
  {
    project_code: 'PRJ-RH-2026-003',
    equipment_code: 'CRN-002',
    log_date: '2026-08-13',
    hours_worked: 10.5,
    operator_name: 'Tower Crane Crew',
    activity_description: 'Material hoisting — rebar bundles & formwork',
    fuel_consumed: 0, // Electric tower crane
    notes: 'Continuous operation floor 19-20',
  },

  // RMC Mixer on Project 3
  {
    project_code: 'PRJ-RH-2026-003',
    equipment_code: 'RMC-002',
    log_date: '2026-08-12',
    hours_worked: 7.5,
    operator_name: 'Naveed Ahmed',
    activity_description: 'RMC delivery — floor 19 slab pour',
    fuel_consumed: 45,
    notes: '8 trips batching plant → site, slump OK',
  },

  // Roller on Project 2
  {
    project_code: 'PRJ-CI-2026-002',
    equipment_code: 'RLR-001',
    log_date: '2026-08-12',
    hours_worked: 9.0,
    operator_name: 'Aslam Raza',
    activity_description: 'Asphalt compaction — Chainage 42+000 to 43+500',
    fuel_consumed: 68,
    notes: 'Density test passed — 97% MDD',
  },
];

// ── Site Operations Logs ──────────────────────────────────────────────────────

export const CONSTRUCTION_SEED_SITE_OPS = [
  // Site dailies
  {
    project_code: 'PRJ-PH-2026-001',
    log_date: '2026-08-12',
    log_type: 'DAILY_REPORT',
    category: 'Progress',
    description: 'Cleanroom wall panels installation — Area B completed. Total 180 panels installed.',
    severity: null,
    resolved: true,
    logged_by: 'Site Engineer — Faisal Khan',
  },
  {
    project_code: 'PRJ-RH-2026-003',
    log_date: '2026-08-12',
    log_type: 'DAILY_REPORT',
    category: 'Progress',
    description: 'Floor 19 slab pour completed. Curing commenced. Floor 20 formwork in progress.',
    severity: null,
    resolved: true,
    logged_by: 'Site Supervisor — Ali Raza',
  },

  // Safety incidents
  {
    project_code: 'PRJ-CI-2026-002',
    log_date: '2026-08-10',
    log_type: 'SAFETY_INCIDENT',
    category: 'Near Miss',
    description: 'Roller operator reversed near edge of embankment without spotter. No injury. Toolbox talk conducted.',
    severity: 'LOW',
    resolved: true,
    logged_by: 'HSE Officer — Tariq Mahmood',
  },
  {
    project_code: 'PRJ-RH-2026-003',
    log_date: '2026-08-11',
    log_type: 'SAFETY_INCIDENT',
    category: 'Minor Injury',
    description: 'Laborer cut finger on rebar tie wire. First aid administered on-site. Returned to work after 30 min.',
    severity: 'LOW',
    resolved: true,
    logged_by: 'HSE Officer — Imran Sheikh',
  },

  // Quality inspections
  {
    project_code: 'PRJ-PH-2026-001',
    log_date: '2026-08-09',
    log_type: 'QUALITY_TEST',
    category: 'Concrete',
    description: 'Concrete cube test results — 28-day strength 32.5 MPa (C30 spec: 30 MPa min). PASSED.',
    severity: null,
    resolved: true,
    logged_by: 'QA/QC Engineer — Hassan Ali',
  },
  {
    project_code: 'PRJ-CI-2026-002',
    log_date: '2026-08-11',
    log_type: 'QUALITY_TEST',
    category: 'Asphalt',
    description: 'Core samples taken at Chainage 42+500. Density 2,345 kg/m³ (97.2% MDD). PASSED.',
    severity: null,
    resolved: true,
    logged_by: 'QA/QC Lab — Kamran Hashmi',
  },

  // Material gate pass
  {
    project_code: 'PRJ-PH-2026-001',
    log_date: '2026-08-12',
    log_type: 'GATE_PASS',
    category: 'Material Inward',
    description: 'HVAC AHU Unit-05 received (Supplier: Climate Control Ltd). Inspected — OK. Stored in laydown area.',
    severity: null,
    resolved: true,
    logged_by: 'Store Keeper — Azeem Butt',
  },
  {
    project_code: 'PRJ-RH-2026-003',
    log_date: '2026-08-13',
    log_type: 'GATE_PASS',
    category: 'Material Outward',
    description: 'Returned 15 bags defective OPC cement to supplier (Maple Leaf). GRN reversed.',
    severity: null,
    resolved: true,
    logged_by: 'Store Keeper — Bilal Ahmed',
  },
];

// ── Subcontractors ────────────────────────────────────────────────────────────

export const CONSTRUCTION_SEED_SUBCONTRACTORS = [
  {
    name: 'Elite MEP Contractors',
    trade: 'MEP — HVAC, Plumbing, Electrical',
    contact_person: 'Engr. Adnan Siddiqui',
    phone: '+92-300-1112233',
    email: 'adnan@elitemep.pk',
    retention_limit: 5, // 5% of work order value
    outstanding_balance: 2250000,
    notes: 'Subcontractor for pharmaceutical cleanroom MEP package',
  },
  {
    name: 'Precision Steel Fabricators',
    trade: 'Structural Steel Fabrication & Erection',
    contact_person: 'Hammad Sheikh',
    phone: '+92-42-3456-7777',
    email: 'hammad@precisionsteel.pk',
    retention_limit: 5,
    outstanding_balance: 1850000,
    notes: 'ASTM A992 structural steel for pharmaceutical project',
  },
  {
    name: 'Roads & Asphalt Co.',
    trade: 'Asphalt Paving & Road Marking',
    contact_person: 'Naveed Akhtar',
    phone: '+92-42-9999-8888',
    email: 'naveed@roadsasphalt.pk',
    retention_limit: 5,
    outstanding_balance: 4500000,
    notes: 'Bituminous paving subcontractor for Lahore Ring Road',
  },
  {
    name: 'Curtain Wall Systems Ltd',
    trade: 'Aluminum & Glass Facade',
    contact_person: 'Sohail Mehmood',
    phone: '+92-300-5556666',
    email: 'sohail@cwsystems.pk',
    retention_limit: 5,
    outstanding_balance: 3200000,
    notes: 'Unitized curtain wall for Elite Residencia tower',
  },
];

// ── Seeding Function ──────────────────────────────────────────────────────────

/**
 * Seed construction operations data for a business.
 * Call this during demo business bootstrap.
 * 
 * @param {string} businessId - UUID of construction business
 */
export async function seedConstructionOperations(businessId) {
  console.log(`[Construction Seed] Starting for business ${businessId}...`);

  try {
    // 1. Seed Projects
    const projectMap = {};
    for (const proj of CONSTRUCTION_SEED_PROJECTS) {
      const created = await db.construction_projects.create({
        data: {
          business_id: businessId,
          ...proj,
          commencement_date: proj.commencement_date ? new Date(proj.commencement_date) : null,
          completion_date: proj.completion_date ? new Date(proj.completion_date) : null,
        },
      });
      projectMap[proj.code] = created.id;
      console.log(`  ✓ Project: ${proj.name}`);
    }

    // 2. Seed BOQ Items
    const boqSets = {
      [projectMap['PRJ-PH-2026-001']]: CONSTRUCTION_SEED_BOQ_PROJECT1,
      [projectMap['PRJ-CI-2026-002']]: CONSTRUCTION_SEED_BOQ_PROJECT2,
      [projectMap['PRJ-RH-2026-003']]: CONSTRUCTION_SEED_BOQ_PROJECT3,
    };

    for (const [projectId, boqItems] of Object.entries(boqSets)) {
      if (!projectId) continue;
      for (const item of boqItems) {
        await db.construction_boq_items.create({
          data: {
            business_id: businessId,
            project_id: projectId,
            ...item,
            amount: item.quantity * item.unit_rate,
          },
        });
      }
      console.log(`  ✓ BOQ Items: ${boqItems.length} items for project`);
    }

    // 3. Seed IPCs
    for (const ipc of CONSTRUCTION_SEED_IPCS) {
      const projectId = projectMap[ipc.project_code];
      if (!projectId) continue;

      const cumulative = ipc.work_done_value + ipc.previous_bills;
      const retention = (cumulative * ipc.retention_percent) / 100;
      const net = cumulative - retention - ipc.tax_deducted;

      await db.construction_ipcs.create({
        data: {
          business_id: businessId,
          project_id: projectId,
          ipc_number: ipc.ipc_number,
          bill_date: new Date(ipc.bill_date),
          work_done_value: ipc.work_done_value,
          previous_bills: ipc.previous_bills,
          cumulative_value: cumulative,
          retention_percent: ipc.retention_percent,
          retention_amount: retention,
          tax_deducted: ipc.tax_deducted,
          net_payable: net,
          status: ipc.status,
          notes: ipc.notes,
        },
      });
    }
    console.log(`  ✓ IPCs: ${CONSTRUCTION_SEED_IPCS.length} interim payment certificates`);

    // 4. Seed Machinery
    for (const machine of CONSTRUCTION_SEED_MACHINERY) {
      await db.construction_machinery.create({
        data: {
          business_id: businessId,
          ...machine,
        },
      });
    }
    console.log(`  ✓ Machinery: ${CONSTRUCTION_SEED_MACHINERY.length} equipment units`);

    // 5. Seed Machinery Logs
    for (const log of CONSTRUCTION_SEED_MACHINERY_LOGS) {
      const projectId = projectMap[log.project_code];
      if (!projectId) continue;

      await db.construction_machinery_logs.create({
        data: {
          business_id: businessId,
          project_id: projectId,
          equipment_code: log.equipment_code,
          log_date: new Date(log.log_date),
          hours_worked: log.hours_worked,
          operator_name: log.operator_name,
          activity_description: log.activity_description,
          fuel_consumed: log.fuel_consumed,
          notes: log.notes,
        },
      });
    }
    console.log(`  ✓ Machinery Logs: ${CONSTRUCTION_SEED_MACHINERY_LOGS.length} equipment logs`);

    // 6. Seed Site Operations
    for (const ops of CONSTRUCTION_SEED_SITE_OPS) {
      const projectId = projectMap[ops.project_code];
      if (!projectId) continue;

      await db.construction_site_operations.create({
        data: {
          business_id: businessId,
          project_id: projectId,
          log_date: new Date(ops.log_date),
          log_type: ops.log_type,
          category: ops.category,
          description: ops.description,
          severity: ops.severity,
          resolved: ops.resolved,
          logged_by: ops.logged_by,
        },
      });
    }
    console.log(`  ✓ Site Ops: ${CONSTRUCTION_SEED_SITE_OPS.length} site operation logs`);

    // 7. Seed Subcontractors
    for (const sub of CONSTRUCTION_SEED_SUBCONTRACTORS) {
      await db.construction_subcontractors.create({
        data: {
          business_id: businessId,
          ...sub,
        },
      });
    }
    console.log(`  ✓ Subcontractors: ${CONSTRUCTION_SEED_SUBCONTRACTORS.length} subcontractors`);

    console.log(`[Construction Seed] ✅ Complete for business ${businessId}`);
    return { success: true };
  } catch (error) {
    console.error('[Construction Seed] Error:', error);
    return { success: false, error: error.message };
  }
}

