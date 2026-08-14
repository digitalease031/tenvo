#!/usr/bin/env node

/**
 * Seed Construction Site Operations Data
 * - Daily Work Reports
 * - Safety Logs (HSE incidents)
 * - Quality Tests (material testing)
 * - Site Inspections
 * - Subcontractor Work Orders
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const businessId = '32cd9aa6-8fbf-4ab7-824e-6f49d88276c1'; // demo-construction
const userId = 'zeeshan.keerio@mindscapeanalytics.com';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🏗️  Seeding Construction Site Operations Data...\n');

    // Get active projects for seeding
    const projectsRes = await pool.query(
      `SELECT id, code, name FROM construction_projects 
       WHERE business_id = $1 AND status = 'ACTIVE' 
       ORDER BY code LIMIT 3`,
      [businessId]
    );

    if (projectsRes.rows.length === 0) {
      console.error('❌ No active projects found. Run seed-construction-demo.mjs first.');
      process.exit(1);
    }

    const projects = projectsRes.rows;
    console.log(`📋 Found ${projects.length} active projects for seeding\n`);

    // ============================================================================
    // DAILY WORK REPORTS (15 reports across 3 projects)
    // ============================================================================

    console.log('📅 Seeding Daily Work Reports...');

    const dailyReports = [];

    // PRJ-PHA-001 — Pharmaceutical project (5 reports)
    const pharmaProject = projects.find(p => p.code === 'PRJ-PHA-001');
    if (pharmaProject) {
      dailyReports.push(
        {
          project_id: pharmaProject.id,
          report_date: '2024-06-01',
          weather_conditions: 'Clear sky, 32°C, Low humidity',
          manpower_on_site: 145,
          work_description: 'Continued RCC foundation work at Grid E-F. Poured 85 Cu.M concrete for foundation slab. Steel reinforcement fixing for cleanroom perimeter walls. Excavation completed for HVAC duct trenches.',
          equipment_deployed: 'Excavator Unit 1, Crane Unit 2, Concrete Mixer Unit 3, Transit Mixer x3',
          materials_consumed: 'Rebar Grade 60: 12.5 Ton, OPC Cement: 450 Bags, Aggregate: 120 Cu.M, Diesel: 400L',
          progress_pct: 62.0,
          issues_encountered: 'Minor delay in concrete delivery due to traffic. Resolved by 11:00 AM.',
          remarks: 'Good progress. On schedule for Phase 2 completion.',
          reported_by: 'Engr. Ahmed Raza (Site Engineer)',
        },
        {
          project_id: pharmaProject.id,
          report_date: '2024-06-02',
          weather_conditions: 'Partly cloudy, 30°C, Moderate humidity',
          manpower_on_site: 148,
          work_description: 'Continued steel reinforcement for cleanroom walls (ISO 5 zone). Completed shutter installation for perimeter wall section B-C. Started brick masonry for external boundary wall. HVAC duct installation in progress.',
          equipment_deployed: 'Crane Unit 2, Concrete Mixer Unit 3, Compressor Unit x2',
          materials_consumed: 'Bricks 1st Class: 18,000 units, Cement: 320 Bags, Rebar: 8.2 Ton',
          progress_pct: 63.5,
          issues_encountered: 'None',
          remarks: 'Excellent weather. Exceeded daily target.',
          reported_by: 'Engr. Ahmed Raza',
        },
        {
          project_id: pharmaProject.id,
          report_date: '2024-06-03',
          weather_conditions: 'Clear, 34°C, Low humidity, Strong sunlight',
          manpower_on_site: 142,
          work_description: 'RCC casting for cleanroom walls completed. Total 42 Cu.M concrete poured. Curing started immediately. Continued brick masonry and plaster work on external walls. Electrical conduit installation at Grid A-B.',
          equipment_deployed: 'Crane Unit 2, Transit Mixer x4, Concrete Pump',
          materials_consumed: 'Concrete C30: 42 Cu.M, Steel: 6.5 Ton, Electrical Conduits: 450 R.Ft',
          progress_pct: 65.0,
          issues_encountered: 'High temperature required additional water for curing',
          remarks: 'Quality checked and approved by consultant.',
          reported_by: 'Engr. Ahmed Raza',
        },
        {
          project_id: pharmaProject.id,
          report_date: '2024-06-04',
          weather_conditions: 'Hot and dry, 36°C',
          manpower_on_site: 138,
          work_description: 'Formwork removal from cleanroom walls. Quality inspection passed. Started HEPA filtration system installation prep work. Fire fighting piping installation in progress. Cement plaster at external boundary wall.',
          equipment_deployed: 'Scissor Lift x2, Welding Machine x3, Crane Unit 2',
          materials_consumed: 'GI Pipes 2": 280 R.Ft, Cement: 220 Bags, HEPA Filter Units: 12 units',
          progress_pct: 66.2,
          issues_encountered: 'None',
          remarks: 'HEPA system on schedule. Client visit scheduled for June 10.',
          reported_by: 'Engr. Ahmed Raza',
        },
        {
          project_id: pharmaProject.id,
          report_date: '2024-06-05',
          weather_conditions: 'Clear sky, 33°C',
          manpower_on_site: 150,
          work_description: 'HVAC duct installation completed at cleanroom zone. HEPA filtration mounting brackets fixed. Electrical wiring for 11kV substation in progress. Plaster and paint work at admin block. Quality testing scheduled for June 6.',
          equipment_deployed: 'Crane Unit 2, Scissor Lift x2, Compressor x2',
          materials_consumed: 'HVAC Duct: 120 sqm, XLPE Cable 16mm²: 850 R.Ft, Paint: 45 gallons',
          progress_pct: 67.5,
          issues_encountered: 'None',
          remarks: 'Excellent progress. Quality team arriving tomorrow.',
          reported_by: 'Engr. Ahmed Raza',
        }
      );
    }

    // PRJ-NHA-002 — Highway project (5 reports)
    const nhaProject = projects.find(p => p.code === 'PRJ-NHA-002');
    if (nhaProject) {
      dailyReports.push(
        {
          project_id: nhaProject.id,
          report_date: '2024-06-01',
          weather_conditions: 'Clear, 35°C, Dry',
          manpower_on_site: 220,
          work_description: 'Sub-base compaction at Chainage 12+500 to 13+200. Asphalt base course laying at Chainage 10+800 to 11+400. Earthwork cutting at hills near Chainage 15+000. Bridge pier reinforcement at Structure No. 3.',
          equipment_deployed: 'Motor Grader x2, Vibratory Roller 10T x3, Asphalt Paver, Excavator x4',
          materials_consumed: 'Aggregate Sub-base: 1,250 Cu.M, Bitumen 60/70: 18 Ton, Diesel: 2,800L',
          progress_pct: 77.0,
          issues_encountered: 'Rock outcrop encountered at Chainage 15+100. Using jack hammer.',
          remarks: 'Good weather. Paving on schedule.',
          reported_by: 'Engr. Khalid Mahmood (Project Manager)',
        },
        {
          project_id: nhaProject.id,
          report_date: '2024-06-02',
          weather_conditions: 'Sunny, 37°C',
          manpower_on_site: 215,
          work_description: 'Continued asphalt base course at Chainage 11+400 to 12+100. Total 650m paved today. Bridge deck casting at Structure No. 2 completed (120 Cu.M concrete). Road marking prep work started at completed sections.',
          equipment_deployed: 'Asphalt Paver, Roller x3, Crane 100T, Transit Mixer x6',
          materials_consumed: 'AC-Base Mix: 420 Ton, Concrete C40: 120 Cu.M, White Paint: 180L',
          progress_pct: 78.5,
          issues_encountered: 'Paver breakdown at 2 PM. Repaired by 4 PM.',
          remarks: 'Bridge deck curing started. High strength concrete used.',
          reported_by: 'Engr. Khalid Mahmood',
        },
        {
          project_id: nhaProject.id,
          report_date: '2024-06-03',
          weather_conditions: 'Hot, 38°C',
          manpower_on_site: 218,
          work_description: 'Asphaltic concrete wearing course at Chainage 9+500 to 10+200. Total 700m completed. Road marking at Chainage 8+000 to 9+500. Guardrail installation started. Flyover approach embankment compaction.',
          equipment_deployed: 'Asphalt Paver x2, Vibratory Roller x4, Line Marking Machine',
          materials_consumed: 'AC-WC Mix: 480 Ton, Road Marking Paint: 220L, Guardrail: 850 R.Ft',
          progress_pct: 80.0,
          issues_encountered: 'None',
          remarks: 'Excellent daily output. NHA inspection passed.',
          reported_by: 'Engr. Khalid Mahmood',
        },
        {
          project_id: nhaProject.id,
          report_date: '2024-06-04',
          weather_conditions: 'Clear, 36°C',
          manpower_on_site: 212,
          work_description: 'Final wearing course at Chainage 10+200 to 10+900. Road surface temperature monitored (185°C laydown). Traffic signage installation at 12 locations. Slope protection work at embankment sections.',
          equipment_deployed: 'Paver, Roller x3, Crane 50T, Dump Truck x8',
          materials_consumed: 'AC-WC: 385 Ton, Traffic Signs: 12 units, Riprap Stone: 240 Cu.M',
          progress_pct: 81.2,
          issues_encountered: 'None',
          remarks: 'Quality checks passed. Surface smoothness within tolerance.',
          reported_by: 'Engr. Khalid Mahmood',
        },
        {
          project_id: nhaProject.id,
          report_date: '2024-06-05',
          weather_conditions: 'Partly cloudy, 34°C',
          manpower_on_site: 208,
          work_description: 'Continued road marking and signage. Crash barriers installed at median. Flyover approach ramp paving completed. Final cleanup and finishing work at completed sections. Trial run scheduled for next week.',
          equipment_deployed: 'Line Marking Machine, Crane x2, Compactor x3',
          materials_consumed: 'Paint: 180L, Crash Barriers: 420 R.Ft, Cleaning supplies',
          progress_pct: 82.0,
          issues_encountered: 'None',
          remarks: 'Project nearing completion. Client acceptance trial soon.',
          reported_by: 'Engr. Khalid Mahmood',
        }
      );
    }

    // PRJ-LDA-003 — Housing project (5 reports)
    const ldaProject = projects.find(p => p.code === 'PRJ-LDA-003');
    if (ldaProject) {
      dailyReports.push(
        {
          project_id: ldaProject.id,
          report_date: '2024-06-01',
          weather_conditions: 'Clear, 31°C',
          manpower_on_site: 185,
          work_description: 'Foundation work for Block C (50 units). Brick masonry at Block A ground floor. RCC columns casting for Block B first floor. Plumbing rough-in at Block A. Electrical conduit installation.',
          equipment_deployed: 'Crane Unit x2, Concrete Mixer x4, Transit Mixer x3',
          materials_consumed: 'Bricks: 35,000 units, Cement: 680 Bags, Rebar: 14.5 Ton, Concrete: 65 Cu.M',
          progress_pct: 41.0,
          issues_encountered: 'Rain forecast for tomorrow. Covering exposed work.',
          remarks: 'Block A approaching first floor slab stage.',
          reported_by: 'Engr. Faisal Malik (Site Supervisor)',
        },
        {
          project_id: ldaProject.id,
          report_date: '2024-06-02',
          weather_conditions: 'Light rain in morning, 28°C',
          manpower_on_site: 165,
          work_description: 'Work resumed at 11 AM after rain stopped. Continued brick masonry at Block A. Block B column curing. Foundation excavation for Block D started. Internal plastering at Block A ground floor units.',
          equipment_deployed: 'Excavator x2, Mixer x3, Crane Unit',
          materials_consumed: 'Bricks: 22,000 units, Cement: 420 Bags, Plaster Sand: 85 Cu.Ft',
          progress_pct: 42.0,
          issues_encountered: 'Morning rain delayed start. Lost 3 hours.',
          remarks: 'Recovered some time in afternoon. Block D excavation on track.',
          reported_by: 'Engr. Faisal Malik',
        },
        {
          project_id: ldaProject.id,
          report_date: '2024-06-03',
          weather_conditions: 'Clear, 32°C',
          manpower_on_site: 190,
          work_description: 'Block A first floor slab reinforcement completed. Block B first floor brick masonry in progress. Block C foundation RCC casting (92 Cu.M). Sanitary fitting installation at Block A ground floor.',
          equipment_deployed: 'Crane x2, Mixer x4, Transit Mixer x4, Pump',
          materials_consumed: 'Concrete C25: 92 Cu.M, Rebar: 18.2 Ton, Bricks: 28,000 units',
          progress_pct: 43.8,
          issues_encountered: 'None',
          remarks: 'Excellent progress. LDA inspection scheduled for June 7.',
          reported_by: 'Engr. Faisal Malik',
        },
        {
          project_id: ldaProject.id,
          report_date: '2024-06-04',
          weather_conditions: 'Sunny, 33°C',
          manpower_on_site: 188,
          work_description: 'Block A first floor slab casting completed (145 Cu.M). Block B continued masonry. Block C foundation formwork removal. Block D foundation reinforcement. Electrical wiring at Block A ground floor.',
          equipment_deployed: 'Crane x2, Transit Mixer x6, Concrete Pump',
          materials_consumed: 'Concrete: 145 Cu.M, Rebar: 12.5 Ton, XLPE Cable: 680 R.Ft',
          progress_pct: 45.0,
          issues_encountered: 'None',
          remarks: 'Block A slab curing started. Quality approved.',
          reported_by: 'Engr. Faisal Malik',
        },
        {
          project_id: ldaProject.id,
          report_date: '2024-06-05',
          weather_conditions: 'Clear, 31°C',
          manpower_on_site: 192,
          work_description: 'Block A first floor masonry started (18 units). Block B first floor slab reinforcement. Block C foundation curing. Block D foundation excavation completed. Plumbing and electrical rough-in ongoing.',
          equipment_deployed: 'Crane x2, Mixer x4, Excavator x2',
          materials_consumed: 'Bricks: 32,000 units, Cement: 520 Bags, GI Pipes: 420 R.Ft',
          progress_pct: 46.2,
          issues_encountered: 'None',
          remarks: 'All blocks progressing well. Material stock adequate.',
          reported_by: 'Engr. Faisal Malik',
        }
      );
    }

    // Insert daily reports
    for (const report of dailyReports) {
      await pool.query(
        `INSERT INTO construction_daily_reports 
         (business_id, project_id, report_date, weather_conditions, manpower_on_site, 
          work_description, equipment_deployed, materials_consumed, progress_pct, 
          issues_encountered, remarks, reported_by, domain_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          businessId,
          report.project_id,
          report.report_date,
          report.weather_conditions,
          report.manpower_on_site,
          report.work_description,
          report.equipment_deployed,
          report.materials_consumed,
          report.progress_pct,
          report.issues_encountered,
          report.remarks,
          report.reported_by,
          JSON.stringify({}),
        ]
      );
    }

    console.log(`✅ Seeded ${dailyReports.length} daily work reports\n`);

    // ============================================================================
    // SAFETY LOGS (10 incidents with varying severities)
    // ============================================================================

    console.log('🦺 Seeding Safety Logs...');

    const safetyLogs = [];

    if (pharmaProject) {
      safetyLogs.push(
        {
          project_id: pharmaProject.id,
          log_date: '2024-05-28',
          incident_type: 'NEAR_MISS',
          severity: 'MEDIUM',
          description: 'Crane hook load came within 2 feet of worker without proper signaling. No injury. Worker was not wearing high-visibility vest.',
          location_station: 'Grid E-F, Cleanroom Zone',
          corrective_action: 'Mandatory toolbox talk conducted. High-vis vests issued to all workers. Crane operator retrained on hand signals.',
          responsible_person: 'Site Safety Officer — Yasir Hussain',
          status: 'CLOSED',
        },
        {
          project_id: pharmaProject.id,
          log_date: '2024-06-02',
          incident_type: 'SAFETY_VIOLATION',
          severity: 'HIGH',
          description: 'Three workers found working at height (12 feet) without fall protection harness. Scaffolding guardrails missing on west side.',
          location_station: 'Cleanroom perimeter wall',
          corrective_action: 'Work stopped immediately. Guardrails installed. Workers provided fall arrest system. Written warning issued.',
          responsible_person: 'HSE Manager — Engr. Tariq Mahmood',
          status: 'RESOLVED',
        }
      );
    }

    if (nhaProject) {
      safetyLogs.push(
        {
          project_id: nhaProject.id,
          log_date: '2024-05-25',
          incident_type: 'INJURY',
          severity: 'MEDIUM',
          description: 'Mason sustained minor cut on left hand while handling steel shuttering. First aid administered on site. No stitches required.',
          location_station: 'Bridge Structure No. 3, Pier foundation',
          corrective_action: 'Worker provided proper gloves. Safety briefing on PPE usage. Incident reported to labor department.',
          responsible_person: 'Site HSE Officer',
          status: 'CLOSED',
        },
        {
          project_id: nhaProject.id,
          log_date: '2024-06-01',
          incident_type: 'EQUIPMENT_FAILURE',
          severity: 'HIGH',
          description: 'Asphalt paver hydraulic failure resulted in hot mix spillage. No personnel injury but created hazardous work zone.',
          location_station: 'Chainage 11+850',
          corrective_action: 'Area cordoned off immediately. Paver repaired. Pre-start checklist now mandatory for all equipment.',
          responsible_person: 'Machinery Supervisor',
          status: 'RESOLVED',
        },
        {
          project_id: nhaProject.id,
          log_date: '2024-06-04',
          incident_type: 'NEAR_MISS',
          severity: 'CRITICAL',
          description: 'Dump truck reversed without spotter. Came within 1 meter of workers. Backup alarm was not functioning.',
          location_station: 'Chainage 13+200, Embankment section',
          corrective_action: 'CRITICAL: All dump trucks grounded for alarm inspection. Mandatory spotter rule enforced. Driver suspended for 3 days.',
          responsible_person: 'Project Manager — Engr. Khalid Mahmood',
          status: 'IN_PROGRESS',
        }
      );
    }

    if (ldaProject) {
      safetyLogs.push(
        {
          project_id: ldaProject.id,
          log_date: '2024-05-30',
          incident_type: 'INSPECTION',
          severity: 'LOW',
          description: 'Routine HSE inspection conducted. Minor issues found: insufficient fire extinguishers, first aid kit supplies low.',
          location_station: 'Block A & B',
          corrective_action: '6 additional fire extinguishers installed. First aid supplies replenished. Monthly inspection schedule posted.',
          responsible_person: 'HSE Coordinator',
          status: 'CLOSED',
        },
        {
          project_id: ldaProject.id,
          log_date: '2024-06-03',
          incident_type: 'SAFETY_VIOLATION',
          severity: 'MEDIUM',
          description: 'Electrical wiring work being done without LOTO (Lock Out Tag Out) procedure. Live wires exposed in Block A ground floor.',
          location_station: 'Block A, Unit 12-15',
          corrective_action: 'Electrical work halted. Electrician retrained on LOTO. LOTO tags and locks provided. Supervisor warned.',
          responsible_person: 'Electrical Supervisor',
          status: 'RESOLVED',
        },
        {
          project_id: ldaProject.id,
          log_date: '2024-06-05',
          incident_type: 'NEAR_MISS',
          severity: 'MEDIUM',
          description: 'Scaffold plank slipped while worker was climbing. Worker grabbed support column. No fall occurred but potential for serious injury.',
          location_station: 'Block B, First floor exterior',
          corrective_action: 'All scaffolding inspected and secured. Planks replaced. Daily scaffold inspection checklist implemented.',
          responsible_person: 'Site Safety Officer',
          status: 'RESOLVED',
        }
      );
    }

    // Insert safety logs
    for (const log of safetyLogs) {
      await pool.query(
        `INSERT INTO construction_safety_logs 
         (business_id, project_id, log_date, incident_type, severity, description, 
          location_station, corrective_action, responsible_person, status, logged_by, domain_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          businessId,
          log.project_id,
          log.log_date,
          log.incident_type,
          log.severity,
          log.description,
          log.location_station,
          log.corrective_action,
          log.responsible_person,
          log.status,
          userId,
          JSON.stringify({}),
        ]
      );
    }

    console.log(`✅ Seeded ${safetyLogs.length} safety incident logs\n`);

    // ============================================================================
    // QUALITY TESTS (12 material tests with PASS/FAIL results)
    // ============================================================================

    console.log('🧪 Seeding Quality Tests...');

    const qualityTests = [];

    if (pharmaProject) {
      qualityTests.push(
        {
          project_id: pharmaProject.id,
          test_date: '2024-05-28',
          test_type: 'Concrete Cube Compressive Strength Test (7-day)',
          test_standard: 'ASTM C39 / BS 1881-116',
          sample_location: 'Cleanroom foundation slab, Grid E-F',
          test_results: 'Average strength: 28.5 MPa (Target: 25 MPa @ 7 days for C30 grade). All 3 cubes passed. Actual 28-day strength projected at 38 MPa.',
          pass_fail_status: 'PASS',
          tested_by: 'National Testing Lab (NTL) — Test Report #NT-24-1523',
          remarks: 'Excellent early strength gain. Mix design approved.',
        },
        {
          project_id: pharmaProject.id,
          test_date: '2024-06-04',
          test_type: 'Concrete Cube Compressive Strength Test (28-day)',
          test_standard: 'ASTM C39',
          sample_location: 'Cleanroom foundation slab, Grid E-F',
          test_results: 'Average strength: 39.2 MPa (Target: 30 MPa @ 28 days for C30 grade). Exceeds specification by 30%. All cubes passed.',
          pass_fail_status: 'PASS',
          tested_by: 'National Testing Lab — Test Report #NT-24-1687',
          remarks: 'Final strength excellent. Quality certified for structural use.',
        },
        {
          project_id: pharmaProject.id,
          test_date: '2024-06-02',
          test_type: 'Reinforcement Steel Tensile Test',
          test_standard: 'ASTM A615 / BS 4449',
          sample_location: 'Rebar Grade 60, 20mm diameter — Batch #R-2024-0542',
          test_results: 'Yield Strength: 425 MPa (Min: 420 MPa). Ultimate Tensile Strength: 625 MPa (Min: 550 MPa). Elongation: 16.5% (Min: 14%). PASS.',
          pass_fail_status: 'PASS',
          tested_by: 'Material Testing Lab — Report #MTL-2024-0892',
          remarks: 'Steel quality certified. Batch approved for use.',
        }
      );
    }

    if (nhaProject) {
      qualityTests.push(
        {
          project_id: nhaProject.id,
          test_date: '2024-05-27',
          test_type: 'Soil Compaction Test (Modified Proctor)',
          test_standard: 'AASHTO T99 Method D',
          sample_location: 'Sub-base course, Chainage 12+800',
          test_results: 'Maximum Dry Density: 2.15 g/cm³. Optimum Moisture Content: 8.2%. Field compaction achieved: 98.5% (Min: 95%). PASS.',
          pass_fail_status: 'PASS',
          tested_by: 'NHA Field Lab — Chainage 10+000',
          remarks: 'Compaction meets specification. Approved for next layer.',
        },
        {
          project_id: nhaProject.id,
          test_date: '2024-06-01',
          test_type: 'Bitumen Penetration Test',
          test_standard: 'ASTM D5 / AASHTO T49',
          sample_location: 'Bitumen 60/70 — Batch #BT-2024-1254',
          test_results: 'Penetration @ 25°C: 64 dmm (Spec: 60-70 dmm). Softening Point: 51°C (Min: 48°C). PASS.',
          pass_fail_status: 'PASS',
          tested_by: 'Bitumen Testing Lab — Report #BTL-2024-0445',
          remarks: 'Bitumen quality approved for AC-Base and AC-WC mix.',
        },
        {
          project_id: nhaProject.id,
          test_date: '2024-06-03',
          test_type: 'Asphalt Mix Marshall Stability Test',
          test_standard: 'ASTM D6927 / AASHTO T245',
          sample_location: 'AC-WC Mix, Plant Batch #AC-2024-0678',
          test_results: 'Stability: 1,850 kg (Min: 900 kg). Flow: 3.2 mm (Spec: 2-4 mm). Air Voids: 4.5% (Spec: 3-5%). PASS.',
          pass_fail_status: 'PASS',
          tested_by: 'NHA Central Lab Lahore — Report #CL-2024-1122',
          remarks: 'Mix design excellent. Approved for paving.',
        },
        {
          project_id: nhaProject.id,
          test_date: '2024-06-04',
          test_type: 'Bridge Deck Concrete Cube Test (7-day)',
          test_standard: 'ASTM C39',
          sample_location: 'Bridge Structure No. 2, Deck slab',
          test_results: 'Average: 32.8 MPa (Target: 28 MPa @ 7 days for C40 grade). Projected 28-day: 45+ MPa. PASS.',
          pass_fail_status: 'PASS',
          tested_by: 'NHA Field Lab',
          remarks: 'High early strength. Deck curing on schedule.',
        }
      );
    }

    if (ldaProject) {
      qualityTests.push(
        {
          project_id: ldaProject.id,
          test_date: '2024-05-29',
          test_type: 'Brick Compressive Strength Test',
          test_standard: 'ASTM C67 / BS 3921',
          sample_location: 'Block A masonry, Batch #BK-2024-1145',
          test_results: 'Average strength: 12.5 MPa (Min: 10 MPa for 1st class brick). Water absorption: 8.5% (Max: 15%). PASS.',
          pass_fail_status: 'PASS',
          tested_by: 'Material Testing Lab — Report #MTL-2024-0821',
          remarks: 'Brick quality approved. Batch released for use.',
        },
        {
          project_id: ldaProject.id,
          test_date: '2024-06-02',
          test_type: 'Concrete Cube Test (7-day) — Block C Foundation',
          test_standard: 'ASTM C39',
          sample_location: 'Block C foundation, RCC',
          test_results: 'Average: 19.2 MPa (Target: 17.5 MPa @ 7 days for C25 grade). Projected 28-day: 28+ MPa. PASS.',
          pass_fail_status: 'PASS',
          tested_by: 'LDA Quality Control Lab',
          remarks: 'Foundation strength adequate. Proceeding to next stage.',
        },
        {
          project_id: ldaProject.id,
          test_date: '2024-06-04',
          test_type: 'Cement Fineness Test (Blaine)',
          test_standard: 'ASTM C204',
          sample_location: 'OPC Cement, Batch #OPC-2024-8842',
          test_results: 'Specific Surface Area: 3,450 cm²/g (Min: 2,250 cm²/g). Setting Time: Initial 145 min, Final 275 min. PASS.',
          pass_fail_status: 'PASS',
          tested_by: 'Cement Testing Lab — Report #CTL-2024-0556',
          remarks: 'Cement quality good. Approved for structural work.',
        },
        {
          project_id: ldaProject.id,
          test_date: '2024-06-05',
          test_type: 'Soil Bearing Capacity Test (Plate Load)',
          test_standard: 'ASTM D1194 / IS 1888',
          sample_location: 'Block D foundation, Test Pit #4',
          test_results: 'Safe Bearing Capacity: 18.5 Ton/sqm (Design assumption: 15 Ton/sqm). Settlement @ 1.5x load: 8mm (Max: 25mm). PASS.',
          pass_fail_status: 'PASS',
          tested_by: 'Soil Investigation Lab',
          remarks: 'Soil capacity exceeds design. Foundation design validated.',
        }
      );
    }

    // Insert quality tests
    for (const test of qualityTests) {
      await pool.query(
        `INSERT INTO construction_quality_tests 
         (business_id, project_id, test_date, test_type, test_standard, sample_location, 
          test_results, pass_fail_status, tested_by, remarks, domain_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          businessId,
          test.project_id,
          test.test_date,
          test.test_type,
          test.test_standard,
          test.sample_location,
          test.test_results,
          test.pass_fail_status,
          test.tested_by,
          test.remarks,
          JSON.stringify({}),
        ]
      );
    }

    console.log(`✅ Seeded ${qualityTests.length} quality test results\n`);

    // ============================================================================
    // SITE INSPECTIONS (8 inspections with various types)
    // ============================================================================

    console.log('🔍 Seeding Site Inspections...');

    const inspections = [];

    if (pharmaProject) {
      inspections.push(
        {
          project_id: pharmaProject.id,
          inspection_date: '2024-05-25',
          inspection_type: 'PROGRESS',
          inspector_name: 'Engr. Sohail Ahmad — Client Representative',
          findings: 'Overall progress: 60% complete. Foundation work completed as per schedule. Cleanroom structural work on track. HVAC ducting prep work started. No major deviations from approved drawings.',
          recommendations: 'Recommend expediting HEPA filter procurement to avoid delay. Suggest additional quality checks on cleanroom wall finish.',
          compliance_status: 'COMPLIANT',
          follow_up_required: false,
          next_inspection_date: '2024-06-15',
        },
        {
          project_id: pharmaProject.id,
          inspection_date: '2024-06-02',
          inspection_type: 'QUALITY',
          inspector_name: 'Engr. Nasir Mahmood — Consultant QA/QC',
          findings: 'RCC work quality excellent. Concrete cover adequate. Steel reinforcement as per design. Formwork alignment within tolerance. Material test reports reviewed and approved.',
          recommendations: 'Continue current quality standards. Ensure cube testing for all pours.',
          compliance_status: 'COMPLIANT',
          follow_up_required: false,
          next_inspection_date: '2024-06-20',
        }
      );
    }

    if (nhaProject) {
      inspections.push(
        {
          project_id: nhaProject.id,
          inspection_date: '2024-05-28',
          inspection_type: 'ENGINEER',
          inspector_name: 'Engr. Tariq Rahim — NHA Resident Engineer',
          findings: 'Asphalt paving quality good. Compaction test results reviewed — all passing. Road surface smoothness within IRI limits. Bridge deck work progressing well.',
          recommendations: 'Monitor asphalt temperature during hot weather. Ensure proper curing of concrete deck.',
          compliance_status: 'COMPLIANT',
          follow_up_required: false,
          next_inspection_date: '2024-06-12',
        },
        {
          project_id: nhaProject.id,
          inspection_date: '2024-06-03',
          inspection_type: 'SAFETY',
          inspector_name: 'Engr. Yasir Bashir — NHA Safety Inspector',
          findings: 'CRITICAL: Safety violations observed. Workers at height without fall protection. Dump truck backup alarms not functioning. Insufficient traffic control at active work zones.',
          recommendations: 'IMMEDIATE ACTION REQUIRED: Halt high-risk work until compliance. Repair all vehicle alarms. Install proper traffic barriers and signage.',
          compliance_status: 'NON_COMPLIANT',
          follow_up_required: true,
          next_inspection_date: '2024-06-05',
        },
        {
          project_id: nhaProject.id,
          inspection_date: '2024-06-05',
          inspection_type: 'SAFETY',
          inspector_name: 'Engr. Yasir Bashir — NHA Safety Inspector (Follow-up)',
          findings: 'Follow-up inspection: Corrective actions implemented. All vehicle alarms repaired and tested. Fall protection systems provided. Traffic control improved with barriers and flagmen.',
          recommendations: 'Maintain current safety standards. Continue daily toolbox talks.',
          compliance_status: 'COMPLIANT',
          follow_up_required: false,
          next_inspection_date: '2024-06-20',
        }
      );
    }

    if (ldaProject) {
      inspections.push(
        {
          project_id: ldaProject.id,
          inspection_date: '2024-05-30',
          inspection_type: 'PROGRESS',
          inspector_name: 'Engr. Faisal Usman — LDA Project Director',
          findings: 'Project at 40% completion. Block A ground floor complete. Block B foundation in progress. Slight delay in Block C due to material shortage. Overall schedule acceptable.',
          recommendations: 'Expedite Block C materials. Consider parallel work streams to recover time.',
          compliance_status: 'COMPLIANT',
          follow_up_required: false,
          next_inspection_date: '2024-06-15',
        },
        {
          project_id: ldaProject.id,
          inspection_date: '2024-06-04',
          inspection_type: 'CLIENT',
          inspector_name: 'Mr. Imran Khalid — LDA Chief Engineer & Client Team',
          findings: 'Client walkthrough conducted. Quality of work appreciated. Some finishing issues noted in Block A ground floor units (uneven plaster, electrical box misalignment).',
          recommendations: 'Rectify finishing issues before first floor work. Provide finishing quality checklist to supervisors.',
          compliance_status: 'CONDITIONAL',
          follow_up_required: true,
          next_inspection_date: '2024-06-10',
        }
      );
    }

    // Insert site inspections
    for (const inspection of inspections) {
      await pool.query(
        `INSERT INTO construction_site_inspections 
         (business_id, project_id, inspection_date, inspection_type, inspector_name, 
          findings, recommendations, compliance_status, follow_up_required, 
          next_inspection_date, domain_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          businessId,
          inspection.project_id,
          inspection.inspection_date,
          inspection.inspection_type,
          inspection.inspector_name,
          inspection.findings,
          inspection.recommendations,
          inspection.compliance_status,
          inspection.follow_up_required,
          inspection.next_inspection_date || null,
          JSON.stringify({}),
        ]
      );
    }

    console.log(`✅ Seeded ${inspections.length} site inspections\n`);

    // ============================================================================
    // SUBCONTRACTOR WORK ORDERS (5 orders with different specializations)
    // ============================================================================

    console.log('👷 Seeding Subcontractor Work Orders...');

    const workOrders = [];

    if (pharmaProject) {
      workOrders.push(
        {
          project_id: pharmaProject.id,
          work_order_no: 'WO-PHA-001',
          work_order_date: '2024-04-15',
          subcontractor_name: 'Al-Razi Steel Fabricators',
          subcontractor_category: 'Specialist',
          pec_license_no: 'PEC-SF-2023-4521',
          specialization_code: 'Steel Fabrication & Erection',
          work_order_value: 42000000, // PKR 42M
          retainage_pct: 10.0,
          scope_of_work: 'Supply, fabricate, and erect all structural steel for cleanroom support structure. Includes columns, beams, and HVAC platform structural steel. Total weight: 185 Ton.',
          start_date: '2024-04-20',
          completion_date: '2024-07-15',
          dlp_months: 12,
          performance_bond_amount: 2100000,
          status: 'ACTIVE',
          amount_certified: 28000000, // PKR 28M certified (67%)
          retainage_deducted: 2800000, // 10% of certified
          net_paid: 25200000, // Certified - retention
          completion_pct: 66.7,
        },
        {
          project_id: pharmaProject.id,
          work_order_no: 'WO-PHA-002',
          work_order_date: '2024-05-01',
          subcontractor_name: 'Prime HVAC Systems',
          subcontractor_category: 'Specialist',
          pec_license_no: 'PEC-ME-2022-7841',
          specialization_code: 'HVAC & Cleanroom Environmental Control',
          work_order_value: 65000000, // PKR 65M
          retainage_pct: 10.0,
          scope_of_work: 'Design, supply, install, test, and commission complete HVAC system for ISO 5 cleanroom including HEPA filtration, temperature/humidity control, differential pressure monitoring, and validation.',
          start_date: '2024-05-10',
          completion_date: '2024-08-30',
          dlp_months: 18,
          performance_bond_amount: 3250000,
          status: 'ACTIVE',
          amount_certified: 15000000, // PKR 15M (23%)
          retainage_deducted: 1500000,
          net_paid: 13500000,
          completion_pct: 23.1,
        }
      );
    }

    if (nhaProject) {
      workOrders.push(
        {
          project_id: nhaProject.id,
          work_order_no: 'WO-NHA-001',
          work_order_date: '2024-03-10',
          subcontractor_name: 'Pak Asphalt Contractors',
          subcontractor_category: 'C-2',
          pec_license_no: 'PEC-CE-C2-2021-1254',
          specialization_code: 'Highway Asphalt Paving',
          work_order_value: 180000000, // PKR 180M
          retainage_pct: 5.0, // Lower retention for C-2 category
          scope_of_work: 'Supply and lay asphaltic concrete for 25km road length. Includes AC-Base course and AC-WC wearing course. Total asphalt mix: 15,000 Ton.',
          start_date: '2024-03-20',
          completion_date: '2024-07-30',
          dlp_months: 12,
          performance_bond_amount: 9000000,
          status: 'ACTIVE',
          amount_certified: 145000000, // PKR 145M (81%)
          retainage_deducted: 7250000, // 5% of certified
          net_paid: 137750000,
          completion_pct: 80.6,
        }
      );
    }

    if (ldaProject) {
      workOrders.push(
        {
          project_id: ldaProject.id,
          work_order_no: 'WO-LDA-001',
          work_order_date: '2024-04-01',
          subcontractor_name: 'Metro Plumbing & Sanitary Works',
          subcontractor_category: 'C-4',
          pec_license_no: 'PEC-CE-C4-2023-8854',
          specialization_code: 'Plumbing, Sanitary & Drainage',
          work_order_value: 28000000, // PKR 28M
          retainage_pct: 10.0,
          scope_of_work: 'Complete plumbing and sanitary installation for 450 housing units. Includes water supply lines, sewerage lines, sanitary fixtures, and drainage system.',
          start_date: '2024-04-10',
          completion_date: '2024-09-30',
          dlp_months: 12,
          performance_bond_amount: 1400000,
          status: 'ACTIVE',
          amount_certified: 12000000, // PKR 12M (43%)
          retainage_deducted: 1200000,
          net_paid: 10800000,
          completion_pct: 42.9,
        },
        {
          project_id: ldaProject.id,
          work_order_no: 'WO-LDA-002',
          work_order_date: '2024-04-05',
          subcontractor_name: 'Power Tech Electrical Contractors',
          subcontractor_category: 'C-3',
          pec_license_no: 'PEC-EE-C3-2022-4412',
          specialization_code: 'Electrical Wiring & Distribution',
          work_order_value: 35000000, // PKR 35M
          retainage_pct: 10.0,
          scope_of_work: 'Complete electrical installation for 450 units including wiring, distribution boards, meters, switches, sockets, and lighting fixtures. External street lighting also included.',
          start_date: '2024-04-15',
          completion_date: '2024-10-15',
          dlp_months: 12,
          performance_bond_amount: 1750000,
          status: 'ACTIVE',
          amount_certified: 14500000, // PKR 14.5M (41%)
          retainage_deducted: 1450000,
          net_paid: 13050000,
          completion_pct: 41.4,
        }
      );
    }

    // Insert subcontractor work orders
    for (const wo of workOrders) {
      await pool.query(
        `INSERT INTO subcontractor_work_orders 
         (business_id, project_id, work_order_no, work_order_date, subcontractor_name, 
          subcontractor_category, pec_license_no, specialization_code, work_order_value, 
          retainage_pct, scope_of_work, dlp_months, 
          status, amount_certified, retainage_deducted, 
          net_paid, completion_pct, domain_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
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
          wo.retainage_pct,
          wo.scope_of_work,
          wo.dlp_months,
          wo.status,
          wo.amount_certified,
          wo.retainage_deducted,
          wo.net_paid,
          wo.completion_pct,
          JSON.stringify({ start_date: wo.start_date, completion_date: wo.completion_date, performance_bond: wo.performance_bond_amount }),
        ]
      );
    }

    console.log(`✅ Seeded ${workOrders.length} subcontractor work orders\n`);

    // ============================================================================
    // SUMMARY
    // ============================================================================

    console.log('📊 SEEDING SUMMARY:');
    console.log(`  ✅ Daily Work Reports: ${dailyReports.length}`);
    console.log(`  ✅ Safety Logs: ${safetyLogs.length}`);
    console.log(`  ✅ Quality Tests: ${qualityTests.length}`);
    console.log(`  ✅ Site Inspections: ${inspections.length}`);
    console.log(`  ✅ Subcontractor Orders: ${workOrders.length}`);
    console.log(`  ────────────────────────────────`);
    console.log(`  🎉 Total Records: ${dailyReports.length + safetyLogs.length + qualityTests.length + inspections.length + workOrders.length}\n`);

    console.log('✨ Construction site operations data seeded successfully!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
