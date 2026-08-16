/**
 * Construction Domain Intelligence Engine (Pakistan 2026 Standards)
 *
 * Provides:
 * - BOQ Cost Breakdown & Composite Rate Analysis (Material / Labour / Machinery)
 * - IPC Running Bill calculation with Mobilization Advance recovery & Retention Money
 * - PEC Clause 70 Price Escalation formula (WPI-indexed escalation)
 * - WHT & Provincial Tax deduction computation (FBR Sec 153(1)(c), PRA, SRB, KPRA, BRA)
 * - Project timeline and cash-flow projection intelligence
 * - Material rate benchmarking (2026 PKR rates) and variance alerts
 * - Equipment fuel consumption and productivity analysis
 * - Subcontractor retainage ledger
 */

// ── 2026 WPI Base Indices (Pakistan Bureau of Statistics) ──────────────────
export const CONSTRUCTION_WPI_BASE_INDICES_2026 = {
  steel: 100,
  cement: 100,
  bitumen: 100,
  labor: 100,
  fuel: 100,
  aggregate: 100,
  sand: 100,
  machinery: 100,
};

// ── 2026 Pakistan Material Benchmark Rates (PKR) ────────────────────────────
// Updated August 2026 based on PBS Sensitive Price Indicator, brickpakistan.com,
// cementrate.pk market aggregators
export const PK_CONSTRUCTION_MATERIAL_RATES_2026 = {
  // Steel (Reinforcement Grade 60) - Updated Aug 2026
  'Rebar Grade 60 8mm': { rate: 260000, unit: 'Ton', category: 'steel', minOrder: 5, perKg: 260 },
  'Rebar Grade 60 10mm': { rate: 262000, unit: 'Ton', category: 'steel', minOrder: 5, perKg: 262 },
  'Rebar Grade 60 12mm': { rate: 265000, unit: 'Ton', category: 'steel', minOrder: 5, perKg: 265 },
  'Rebar Grade 60 16mm': { rate: 267000, unit: 'Ton', category: 'steel', minOrder: 5, perKg: 267 },
  'Rebar Grade 60 20mm': { rate: 270000, unit: 'Ton', category: 'steel', minOrder: 5, perKg: 270 },
  'Rebar Grade 60 25mm': { rate: 272000, unit: 'Ton', category: 'steel', minOrder: 5, perKg: 272 },
  
  // Cement (OPC - Ordinary Portland Cement) - PBS Official: PKR 1559 (Aug 8, 2026)
  'OPC Cement 50kg Bag (Lucky)': { rate: 1450, unit: 'Bag', category: 'cement', minOrder: 100, brand: 'Lucky' },
  'OPC Cement 50kg Bag (Maple Leaf)': { rate: 1430, unit: 'Bag', category: 'cement', minOrder: 100, brand: 'Maple Leaf' },
  'OPC Cement 50kg Bag (Bestway)': { rate: 1440, unit: 'Bag', category: 'cement', minOrder: 100, brand: 'Bestway' },
  'OPC Cement 50kg Bag (DG Khan)': { rate: 1420, unit: 'Bag', category: 'cement', minOrder: 100, brand: 'DG Khan' },
  'OPC Cement 50kg Bag (Fauji)': { rate: 1460, unit: 'Bag', category: 'cement', minOrder: 100, brand: 'Fauji' },
  'OPC Cement 50kg Bag (Average)': { rate: 1450, unit: 'Bag', category: 'cement', minOrder: 100, brand: 'Market Avg' },
  'SRC Cement 50kg Bag': { rate: 1550, unit: 'Bag', category: 'cement', minOrder: 100 },
  
  // Bitumen & Asphalt - Updated Aug 2026
  'Bitumen 60/70': { rate: 245000, unit: 'Ton', category: 'bitumen', minOrder: 2, per150kgDrum: 36750 },
  'Bitumen 80/100': { rate: 240000, unit: 'Ton', category: 'bitumen', minOrder: 2 },
  'Modified Bitumen (PMB)': { rate: 280000, unit: 'Ton', category: 'bitumen', minOrder: 2, application: 'Heavy traffic highways' },
  'AC-Base Mix': { rate: 12500, unit: 'Ton', category: 'asphalt', minOrder: 10 },
  'AC-WC Mix': { rate: 14500, unit: 'Ton', category: 'asphalt', minOrder: 10 },
  'Hot Mix Asphalt': { rate: 13500, unit: 'Ton', category: 'asphalt', minOrder: 10 },
  
  // Ready Mix Concrete - Updated rates (includes pumping prep)
  'RMC C15 (2000 PSI)': { rate: 15500, unit: 'Cu.M', category: 'concrete', minOrder: 10, grade: 'M15' },
  'RMC C20 (2500 PSI)': { rate: 16500, unit: 'Cu.M', category: 'concrete', minOrder: 10, grade: 'M20' },
  'RMC C25 (3000 PSI)': { rate: 18500, unit: 'Cu.M', category: 'concrete', minOrder: 10, grade: 'M25/C25' },
  'RMC C30 (4000 PSI)': { rate: 21000, unit: 'Cu.M', category: 'concrete', minOrder: 10, grade: 'M30/C30' },
  'RMC C35 (5000 PSI)': { rate: 24000, unit: 'Cu.M', category: 'concrete', minOrder: 10, grade: 'M35/C35' },
  'RMC C40 (6000 PSI)': { rate: 27000, unit: 'Cu.M', category: 'concrete', minOrder: 10, grade: 'M40/C40' },
  'Concrete Pumping': { rate: 800, unit: 'Cu.M', category: 'service', minOrder: 10, minimumCharge: 8000 },
  
  // Aggregates & Sand - City-averaged rates (per cubic feet)
  'Aggregate 20mm (Crush)': { rate: 135, unit: 'Cu.Ft', category: 'aggregate', minOrder: 500 },
  'Aggregate 40mm (Crush)': { rate: 130, unit: 'Cu.Ft', category: 'aggregate', minOrder: 500 },
  'Aggregate 60mm (Crush)': { rate: 125, unit: 'Cu.Ft', category: 'aggregate', minOrder: 500 },
  'Gravel/Bajri': { rate: 130, unit: 'Cu.Ft', category: 'aggregate', minOrder: 500 },
  'River Sand': { rate: 85, unit: 'Cu.Ft', category: 'sand', minOrder: 1000 },
  'Plaster Sand': { rate: 90, unit: 'Cu.Ft', category: 'sand', minOrder: 500 },
  
  // Bricks - National average (per 1,000 pieces)
  'Clay Bricks 1st Class': { rate: 17500, unit: 'Per 1000', category: 'masonry', minOrder: 10, cityRange: '15K-21K' },
  'Clay Bricks 2nd Class': { rate: 14000, unit: 'Per 1000', category: 'masonry', minOrder: 10 },
  'Clay Bricks 3rd Class': { rate: 11000, unit: 'Per 1000', category: 'masonry', minOrder: 10 },
  'Concrete Blocks': { rate: 80, unit: 'Piece', category: 'masonry', minOrder: 100 },
  
  // Equipment Rental (Per Day) - Updated Aug 2026
  'Excavator Small 180HP': { rate: 28000, unit: 'Day', category: 'machinery', minOrder: 1, hourly: 3500 },
  'Excavator Medium 200HP': { rate: 32000, unit: 'Day', category: 'machinery', minOrder: 1, hourly: 4000 },
  'Excavator Large 300HP': { rate: 45000, unit: 'Day', category: 'machinery', minOrder: 1, hourly: 5625 },
  'Mobile Crane 25 Ton': { rate: 35000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Mobile Crane 50 Ton': { rate: 55000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Mobile Crane 100 Ton': { rate: 95000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Tower Crane': { rate: 800000, unit: 'Month', category: 'machinery', minOrder: 1 },
  'Vibratory Roller 10T': { rate: 25000, unit: 'Day', category: 'machinery', minOrder: 1, hourly: 3125 },
  'Asphalt Paver 6m': { rate: 45000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Asphalt Paver 8m': { rate: 60000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Motor Grader CAT 140K': { rate: 35000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Concrete Mixer 7.5 CFT': { rate: 4500, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Batching Plant 30 Cu.M/Hr': { rate: 35000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Concrete Pump': { rate: 25000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Transit Mixer 6-8 Cu.M': { rate: 12000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Loader/Payloader': { rate: 30000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Bulldozer': { rate: 40000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Generator 50 KVA': { rate: 8000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Generator 100 KVA': { rate: 15000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Water Tanker': { rate: 12000, unit: 'Day', category: 'machinery', minOrder: 1 },
  
  // Labor Rates (Skilled Workers - Daily) - Updated Aug 2026
  'Mason (Rajmistri)': { rate: 3200, unit: 'Day', category: 'labor', minOrder: 1, skill: 'Skilled', range: '3000-3500' },
  'Carpenter (Barhai)': { rate: 3000, unit: 'Day', category: 'labor', minOrder: 1, skill: 'Skilled', range: '2800-3300' },
  'Steel Fixer': { rate: 2900, unit: 'Day', category: 'labor', minOrder: 1, skill: 'Skilled', range: '2700-3200' },
  'Electrician': { rate: 3100, unit: 'Day', category: 'labor', minOrder: 1, skill: 'Skilled', range: '2900-3400' },
  'Plumber': { rate: 2900, unit: 'Day', category: 'labor', minOrder: 1, skill: 'Skilled', range: '2700-3200' },
  'Painter': { rate: 2700, unit: 'Day', category: 'labor', minOrder: 1, skill: 'Skilled', range: '2500-3000' },
  'Welder': { rate: 3200, unit: 'Day', category: 'labor', minOrder: 1, skill: 'Skilled', range: '3000-3500' },
  'Shuttering Worker': { rate: 2800, unit: 'Day', category: 'labor', minOrder: 1, skill: 'Skilled', range: '2600-3100' },
  'Helper (Mistri)': { rate: 2000, unit: 'Day', category: 'labor', minOrder: 1, skill: 'Semi-Skilled', range: '1800-2200' },
  'Labour (Mazdoor)': { rate: 1700, unit: 'Day', category: 'labor', minOrder: 1, skill: 'Unskilled', range: '1500-1900' },
  'Site Engineer': { rate: 10000, unit: 'Day', category: 'professional', minOrder: 1, skill: 'Professional', range: '8K-12K' },
  'Foreman (Munshi)': { rate: 6000, unit: 'Day', category: 'professional', minOrder: 1, skill: 'Professional', range: '5K-7K' },
  'Surveyor': { rate: 7500, unit: 'Day', category: 'professional', minOrder: 1, skill: 'Professional', range: '6K-9K' },
  
  // Fuel & Energy - Updated July 30, 2026 (Government notified rates)
  'Diesel (HSD)': { rate: 390.62, unit: 'Litre', category: 'fuel', minOrder: 50, trend: 'up', lastChange: '+2.24' },
  'Petrol (RON 92)': { rate: 335.06, unit: 'Litre', category: 'fuel', minOrder: 50, trend: 'down', lastChange: '-0.75' },
  'Electricity Industrial': { rate: 28.50, unit: 'kWh', category: 'energy', minOrder: 1, peakSurcharge: 1.35 },
};

// ── PEC Contractor Categories (Updated 2024/2026) ───────────────────────────
// Source: PEC Registration Policy July 30, 2024 + 2026 enforcement updates
export const PEC_CONTRACTOR_CATEGORIES = [
  { 
    code: 'C-A', 
    label: 'C-A — No Financial Limit', 
    limitPKR: Infinity,
    minPaidCapital: 100000000, // PKR 100M
    requiredPE: 3, // Professional Engineers
    requiredRE: 5, // Registered Engineers
    description: 'Unlimited value projects, major infrastructure'
  },
  { 
    code: 'C-1', 
    label: 'C-1 — Up to PKR 500M', 
    limitPKR: 500_000_000,
    minPaidCapital: 50000000, // PKR 50M
    requiredPE: 2,
    requiredRE: 4,
    description: 'Major highways, bridges, large buildings'
  },
  { 
    code: 'C-2', 
    label: 'C-2 — Up to PKR 250M', 
    limitPKR: 250_000_000,
    minPaidCapital: 25000000, // PKR 25M
    requiredPE: 1,
    requiredRE: 3,
    description: 'Medium infrastructure, commercial buildings'
  },
  { 
    code: 'C-3', 
    label: 'C-3 — Up to PKR 100M', 
    limitPKR: 100_000_000,
    minPaidCapital: 10000000, // PKR 10M
    requiredPE: 1,
    requiredRE: 2,
    description: 'Roads, small bridges, residential'
  },
  { 
    code: 'C-4', 
    label: 'C-4 — Up to PKR 40M', 
    limitPKR: 40_000_000,
    minPaidCapital: 4000000, // PKR 4M
    requiredPE: 0,
    requiredRE: 2,
    description: 'Minor works, repairs'
  },
  { 
    code: 'C-5', 
    label: 'C-5 — Up to PKR 15M', 
    limitPKR: 15_000_000,
    minPaidCapital: 1500000, // PKR 1.5M
    requiredPE: 0,
    requiredRE: 1,
    description: 'Small construction, maintenance'
  },
  { 
    code: 'C-6', 
    label: 'C-6 — Up to PKR 5M', 
    limitPKR: 5_000_000,
    minPaidCapital: 500000, // PKR 500K
    requiredPE: 0,
    requiredRE: 1,
    description: 'Minor repairs, small works'
  },
  {
    code: 'Labour',
    label: 'Labour — Labor Supply Only',
    limitPKR: 0,
    description: 'Labor supply contractors (no equipment/materials)'
  },
  {
    code: 'Specialist',
    label: 'Specialist — Specialized Works',
    limitPKR: 0,
    description: 'Specialized trades (painting, waterproofing, steel structures)'
  }
];

// ── PEC Specialization Codes ─────────────────────────────────────────────────
export const PEC_SPECIALIZATION_CODES = {
  // Civil Engineering
  'CE01': 'Roads & Highways',
  'CE02': 'Bridges',
  'CE03': 'Water Supply & Treatment',
  'CE04': 'Irrigation & Drainage',
  'CE05': 'Dams & Reservoirs',
  'CE06': 'Tunnels',
  'CE07': 'Railways',
  'CE08': 'Airports',
  'CE09': 'Sewerage & Sanitation',
  'CE10': 'Flyovers & Underpasses',
  
  // Building Construction
  'BC01': 'Building Construction',
  'BC02': 'Pre-fabricated Structures',
  
  // Electrical
  'EE01': 'Electrical Works',
  'EE02': 'Transmission Lines',
  'EE03': 'Sub-stations',
  
  // Mechanical
  'ME01': 'HVAC & Mechanical',
  'ME02': 'Elevators & Lifts',
  
  // Specialized
  'SP01': 'Painting & Polishing',
  'SP02': 'Steel Structures',
  'SP03': 'Piling Works',
  'SP04': 'Waterproofing'
};

// ── Schedule of Rates References ─────────────────────────────────────────
export const CONSTRUCTION_SOR_REFERENCES = [
  { code: 'MRS-PUNJAB', label: 'Punjab Market Rate System (MRS / CSR)', issuer: 'Government of Punjab CWD' },
  { code: 'CSR-NHA', label: 'Federal CSR (NHA)', issuer: 'National Highway Authority' },
  { code: 'SPPRA-DRC', label: 'Sindh SPPRA DRC / Schedule Rates', issuer: 'SPPRA Sindh' },
  { code: 'KPK-CSR', label: 'KPK Composite Schedule of Rates', issuer: 'Government of KP C&W' },
  { code: 'BSR-BALOCH', label: 'Balochistan Schedule of Rates (BSR)', issuer: 'Government of Balochistan' },
];

// ── Tax Configuration (Pakistan Tax Year 2026) ───────────────────────────────
// Sources: FBR Finance Act 2026, Provincial Finance Acts 2026 (PRA, SRB, KPRA, BRA)
export const CONSTRUCTION_TAX_CONFIG_PK = {
  // FBR Withholding Tax - Section 153(1)(c) Execution of Contracts
  whtFiler: 7.5,           // Company/Filer rate (TY 2026)
  whtNonFiler: 15.0,       // Non-filer rate (doubled as per 2026 enforcement)
  whtMinThreshold: 25000,  // PKR - Below this no WHT deduction
  whtAdvanceThreshold: 100000000, // PKR 100M - Section 153(2A) upfront collection
  whtAdvanceRate: 3.75,    // 50% of normal rate, paid upfront for projects > 100M
  
  // Provincial Sales Tax on Services (Construction Services)
  // Punjab Revenue Authority (PRA)
  pra: 16.0,               // Increased from 15% (Punjab Finance Act 2026)
  praThreshold: 3000000,   // PKR 3M annual turnover registration threshold
  praEPaymentMandatory: true, // As per Punjab Finance Act 2026
  
  // Sindh Revenue Board (SRB)
  srb: 13.0,               // Lowest among provinces (competitive advantage)
  srbLuxuryRate: 15.0,     // For luxury construction (plots > 1000 sq yards)
  srbCommercialHighRise: 14.0, // Commercial high-rise surcharge
  srbThreshold: 3000000,
  
  // Khyber Pakhtunkhwa Revenue Authority (KPRA)
  kpra: 15.0,
  kpraThreshold: 3000000,
  kpraMergerDistrictsExempt: true, // Former FATA areas exempted
  
  // Balochistan Revenue Authority (BRA)
  bra: 15.0,
  braGwadarSpecial: 10.0,  // Reduced rate for CPEC-related Gwadar construction
  braThreshold: 3000000,
  
  // Filing & Compliance
  filingFrequency: 'Monthly',
  filingDueDate: '15th of following month',
  penaltyLatePayment: 1.25, // Percent per month
  penaltyMinNonFiling: 10000, // PKR minimum penalty
  
  // Notes
  notes: {
    wht: 'Section 153(1)(c) applies to all construction contracts',
    provincial: 'Each province levies separate sales tax on construction services',
    compliance: 'E-payment mandatory in Punjab from 2026',
    penalties: 'Late payment: 12% per annum, Non-filing: Min PKR 10,000'
  }
};

/**
 * Calculate Composite Rate Analysis for a BOQ item.
 * Splits total rate into material / labour / machinery components.
 * @param {{ totalRate: number, materialRatio: number, laborRatio: number, machineryRatio: number }} params
 * @returns {{ materialCost: number, laborCost: number, machineryCost: number, overhead: number }}
 */
export function computeCompositeRateAnalysis({ totalRate, materialRatio = 0.60, laborRatio = 0.25, machineryRatio = 0.10 }) {
  const material = totalRate * materialRatio;
  const labor = totalRate * laborRatio;
  const machinery = totalRate * machineryRatio;
  const overhead = totalRate - (material + labor + machinery);
  return {
    materialCost: Math.round(material),
    laborCost: Math.round(labor),
    machineryCost: Math.round(machinery),
    overhead: Math.round(overhead),
    totalRate: Math.round(totalRate),
  };
}

/**
 * Compute IPC (Interim Payment Certificate) Running Bill.
 * Calculates net payable after Mobilization Advance recovery, Retention, WHT, and Provincial Tax.
 *
 * @param {{
 *   grossCertifiedAmount: number,    // Total work certified in IPC
 *   cumulativePreviousIPCs: number,  // Sum of all previous IPC certified amounts
 *   contractValue: number,           // Total contract value
 *   mobilizationAdvancePct: number,  // Mobilization advance given as % of contract (typically 10-15)
 *   mobilizationRecovered: number,   // Already recovered mobilization advance to date
 *   retentionPct: number,            // Retention money % (typically 5-10)
 *   retentionReleased: number,       // Already released retention money
 *   isCompanyContractor: boolean,    // FBR WHT rate selector
 *   provinceCode: 'PK-PB'|'PK-SD'|'PK-KP'|'PK-BA'|null, // For provincial tax
 *   hasWhtExemption: boolean,
 *   escalationAmount: number,        // PEC Clause 70 price adjustment for this period
 *   securedAdvance: number,          // Advance on site materials (if applicable)
 * }} params
 */
export function computeIPCRunningBill(params) {
  const {
    grossCertifiedAmount = 0,
    cumulativePreviousIPCs = 0,
    contractValue = 0,
    mobilizationAdvancePct = 10,
    mobilizationRecovered = 0,
    retentionPct = 5,
    retentionReleased = 0,
    isCompanyContractor = true,
    provinceCode = 'PK-PB',
    hasWhtExemption = false,
    escalationAmount = 0,
    securedAdvance = 0,
  } = params;

  // Net work done in this IPC
  const thisIpcGross = Math.max(0, grossCertifiedAmount - cumulativePreviousIPCs);

  // Retention Money deduction (on gross certified amount for this IPC)
  const retentionDeductible = Math.round(thisIpcGross * (retentionPct / 100));

  // Mobilization Advance Recovery
  // Recovery rate: pro-rata on % complete — typically stops at 80% contract completion
  const mobilizationAdvanceTotal = Math.round(contractValue * (mobilizationAdvancePct / 100));
  const percentComplete = contractValue > 0 ? (grossCertifiedAmount / contractValue) : 0;
  const targetRecovery = Math.min(
    Math.round(mobilizationAdvanceTotal * Math.min(percentComplete / 0.8, 1)),
    mobilizationAdvanceTotal
  );
  const mobilizationRecoveryThisIPC = Math.max(0, targetRecovery - mobilizationRecovered);

  // Amount after deductions
  const netBeforeTax = thisIpcGross + escalationAmount - retentionDeductible - mobilizationRecoveryThisIPC - securedAdvance;

  // FBR WHT Section 153(1)(c)
  const whtRate = hasWhtExemption ? 0 : (isCompanyContractor ? CONSTRUCTION_TAX_CONFIG_PK.whtFiler : CONSTRUCTION_TAX_CONFIG_PK.whtNonFiler);
  const whtDeduction = Math.round(netBeforeTax * (whtRate / 100));

  // Provincial Tax (construction services) - Updated 2026 rates
  let provincialTaxRate = 0;
  let provincialTaxLabel = 'N/A';
  if (!hasWhtExemption) {
    switch (provinceCode) {
      case 'PK-PB': provincialTaxRate = CONSTRUCTION_TAX_CONFIG_PK.pra; provincialTaxLabel = `PRA ${CONSTRUCTION_TAX_CONFIG_PK.pra}%`; break;
      case 'PK-SD': provincialTaxRate = CONSTRUCTION_TAX_CONFIG_PK.srb; provincialTaxLabel = `SRB ${CONSTRUCTION_TAX_CONFIG_PK.srb}%`; break;
      case 'PK-KP': provincialTaxRate = CONSTRUCTION_TAX_CONFIG_PK.kpra; provincialTaxLabel = `KPRA ${CONSTRUCTION_TAX_CONFIG_PK.kpra}%`; break;
      case 'PK-BA': provincialTaxRate = CONSTRUCTION_TAX_CONFIG_PK.bra; provincialTaxLabel = `BRA ${CONSTRUCTION_TAX_CONFIG_PK.bra}%`; break;
    }
  }
  const provincialTaxDeduction = Math.round(netBeforeTax * (provincialTaxRate / 100));

  const netPayable = Math.max(0, netBeforeTax - whtDeduction - provincialTaxDeduction);

  return {
    thisIpcGross: Math.round(thisIpcGross),
    escalationAmount: Math.round(escalationAmount),
    retentionDeductible,
    retentionReleased: Math.round(retentionReleased),
    retentionBalance: retentionDeductible - retentionReleased,
    mobilizationAdvanceTotal,
    mobilizationRecoveryThisIPC: Math.round(mobilizationRecoveryThisIPC),
    mobilizationRecoveredTotal: Math.round(mobilizationRecovered + mobilizationRecoveryThisIPC),
    mobilizationOutstanding: Math.round(mobilizationAdvanceTotal - mobilizationRecovered - mobilizationRecoveryThisIPC),
    securedAdvance: Math.round(securedAdvance),
    netBeforeTax: Math.round(netBeforeTax),
    whtRate,
    whtDeduction,
    provincialTaxRate,
    provincialTaxLabel,
    provincialTaxDeduction,
    netPayable: Math.round(netPayable),
    totalDeductions: Math.round(retentionDeductible + mobilizationRecoveryThisIPC + whtDeduction + provincialTaxDeduction),
  };
}

/**
 * PEC Clause 70 — Price Escalation / Adjustment Formula.
 * Calculates adjustment based on WPI changes for steel, cement, bitumen, fuel, labor.
 *
 * @param {{
 *   contractValue: number,
 *   laborComponent: number,        // % of contract that is labor cost (e.g. 0.30)
 *   steelComponent: number,        // % of contract that is steel cost (e.g. 0.25)
 *   cementComponent: number,       // % of contract that is cement cost (e.g. 0.15)
 *   bitumenComponent: number,      // % of contract that is bitumen cost (e.g. 0.10)
 *   fuelComponent: number,         // % of contract that is fuel cost (e.g. 0.10)
 *   baseWpi: { labor: number, steel: number, cement: number, bitumen: number, fuel: number },
 *   currentWpi: { labor: number, steel: number, cement: number, bitumen: number, fuel: number },
 *   billedInPeriod: number,        // Amount billed in the escalation period
 *   fixedComponent: number,        // Fixed % not subject to escalation (PEC: typically 0.15)
 * }} params
 */
export function computePECEscalation(params) {
  const {
    contractValue,
    laborComponent = 0.30,
    steelComponent = 0.25,
    cementComponent = 0.15,
    bitumenComponent = 0.10,
    fuelComponent = 0.10,
    baseWpi,
    currentWpi,
    billedInPeriod,
    fixedComponent = 0.15,
  } = params;

  const adjustableBase = billedInPeriod * (1 - fixedComponent);

  const laborAdjFactor = baseWpi.labor > 0 ? (currentWpi.labor - baseWpi.labor) / baseWpi.labor : 0;
  const steelAdjFactor = baseWpi.steel > 0 ? (currentWpi.steel - baseWpi.steel) / baseWpi.steel : 0;
  const cementAdjFactor = baseWpi.cement > 0 ? (currentWpi.cement - baseWpi.cement) / baseWpi.cement : 0;
  const bitumenAdjFactor = baseWpi.bitumen > 0 ? (currentWpi.bitumen - baseWpi.bitumen) / baseWpi.bitumen : 0;
  const fuelAdjFactor = baseWpi.fuel > 0 ? (currentWpi.fuel - baseWpi.fuel) / baseWpi.fuel : 0;

  const laborAdj = adjustableBase * laborComponent * laborAdjFactor;
  const steelAdj = adjustableBase * steelComponent * steelAdjFactor;
  const cementAdj = adjustableBase * cementComponent * cementAdjFactor;
  const bitumenAdj = adjustableBase * bitumenComponent * bitumenAdjFactor;
  const fuelAdj = adjustableBase * fuelComponent * fuelAdjFactor;

  const totalEscalation = laborAdj + steelAdj + cementAdj + bitumenAdj + fuelAdj;

  return {
    adjustableBase: Math.round(adjustableBase),
    components: {
      labor: { factor: +(laborAdjFactor * 100).toFixed(2), amount: Math.round(laborAdj) },
      steel: { factor: +(steelAdjFactor * 100).toFixed(2), amount: Math.round(steelAdj) },
      cement: { factor: +(cementAdjFactor * 100).toFixed(2), amount: Math.round(cementAdj) },
      bitumen: { factor: +(bitumenAdjFactor * 100).toFixed(2), amount: Math.round(bitumenAdj) },
      fuel: { factor: +(fuelAdjFactor * 100).toFixed(2), amount: Math.round(fuelAdj) },
    },
    totalEscalation: Math.round(totalEscalation),
    isPositive: totalEscalation >= 0,
  };
}

/**
 * BOQ Cost Variance Analysis.
 * Compares estimated vs actual cost at line-item level for each BOQ item.
 * @param {Array<{ id: string, description: string, unit: string, estimatedQty: number, estimatedRate: number, actualQty: number, actualRate: number }>} boqItems
 */
export function analyzeBOQVariance(boqItems = []) {
  const lines = boqItems.map((item) => {
    const estimatedTotal = item.estimatedQty * item.estimatedRate;
    const actualTotal = item.actualQty * item.actualRate;
    const variance = actualTotal - estimatedTotal;
    const variancePct = estimatedTotal > 0 ? (variance / estimatedTotal) * 100 : 0;
    return {
      id: item.id,
      description: item.description,
      unit: item.unit,
      estimatedQty: item.estimatedQty,
      estimatedRate: item.estimatedRate,
      estimatedTotal: Math.round(estimatedTotal),
      actualQty: item.actualQty,
      actualRate: item.actualRate,
      actualTotal: Math.round(actualTotal),
      variance: Math.round(variance),
      variancePct: +variancePct.toFixed(2),
      status: variancePct > 10 ? 'OVER_BUDGET' : variancePct < -10 ? 'UNDER_BUDGET' : 'ON_TRACK',
    };
  });

  const totalEstimated = lines.reduce((s, l) => s + l.estimatedTotal, 0);
  const totalActual = lines.reduce((s, l) => s + l.actualTotal, 0);
  const totalVariance = totalActual - totalEstimated;

  return {
    lines,
    summary: {
      totalEstimated: Math.round(totalEstimated),
      totalActual: Math.round(totalActual),
      totalVariance: Math.round(totalVariance),
      overallVariancePct: totalEstimated > 0 ? +((totalVariance / totalEstimated) * 100).toFixed(2) : 0,
      overBudgetLines: lines.filter((l) => l.status === 'OVER_BUDGET').length,
      underBudgetLines: lines.filter((l) => l.status === 'UNDER_BUDGET').length,
      onTrackLines: lines.filter((l) => l.status === 'ON_TRACK').length,
    },
  };
}

/**
 * Equipment Fuel Productivity Calculator.
 * @param {{ equipmentType: string, hoursLogged: number, fuelConsumedLitres: number, outputQty: number, outputUnit: string }} params
 */
export function analyzeEquipmentProductivity({ equipmentType, hoursLogged, fuelConsumedLitres, outputQty, outputUnit }) {
  const fuelPerHour = hoursLogged > 0 ? fuelConsumedLitres / hoursLogged : 0;
  const outputPerHour = hoursLogged > 0 ? outputQty / hoursLogged : 0;
  const fuelPerOutput = outputQty > 0 ? fuelConsumedLitres / outputQty : 0;
  const fuelCostPerLitre = 390.62; // PKR diesel HSD rate (July 30, 2026 - Government notified)
  const fuelCostTotal = fuelConsumedLitres * fuelCostPerLitre;

  return {
    equipmentType,
    hoursLogged,
    fuelConsumedLitres,
    fuelPerHour: +fuelPerHour.toFixed(2),
    outputQty,
    outputUnit,
    outputPerHour: +outputPerHour.toFixed(2),
    fuelPerOutput: +fuelPerOutput.toFixed(2),
    fuelCostTotal: Math.round(fuelCostTotal),
    fuelCostPerOutput: outputQty > 0 ? Math.round(fuelCostTotal / outputQty) : 0,
  };
}

/**
 * Project Cash Flow Projection (Monthly).
 * @param {{ contractValue: number, durationMonths: number, sCurveFront: number }} params
 * S-curve front loading (default 0.15 = 15% front heavy)
 */
export function projectConstructionCashFlow({ contractValue, durationMonths, sCurveFront = 0.15 }) {
  const months = [];
  let cumulative = 0;

  for (let m = 1; m <= durationMonths; m++) {
    const progress = m / durationMonths;
    // Modified S-curve: bell-shaped monthly billing
    const peakMonth = Math.ceil(durationMonths * 0.45);
    const distanceToPeak = Math.abs(m - peakMonth);
    const rawWeight = Math.exp(-((distanceToPeak * distanceToPeak) / (2 * (durationMonths / 4) ** 2)));
    months.push({ month: m, rawWeight, progress });
  }

  const totalWeight = months.reduce((s, m) => s + m.rawWeight, 0);
  let runningCumulative = 0;

  const projections = months.map(({ month, rawWeight }) => {
    const monthlyBilling = Math.round((rawWeight / totalWeight) * contractValue);
    runningCumulative += monthlyBilling;
    const retentionDeducted = Math.round(monthlyBilling * 0.05);
    const netReceivable = monthlyBilling - retentionDeducted;
    return {
      month,
      monthlyBilling,
      cumulativeBilling: runningCumulative,
      retentionDeducted,
      netReceivable,
      percentComplete: +((runningCumulative / contractValue) * 100).toFixed(1),
    };
  });

  return {
    contractValue,
    durationMonths,
    totalRetention: Math.round(contractValue * 0.05),
    projections,
  };
}

/**
 * Smart material variance alert.
 * Compares current market price to BOQ estimated rate and flags deviations.
 * @param {{ materialName: string, boqEstimatedRate: number, currentMarketRate: number, unit: string }} params
 */
export function materialRateVarianceAlert({ materialName, boqEstimatedRate, currentMarketRate, unit }) {
  const variance = currentMarketRate - boqEstimatedRate;
  const variancePct = boqEstimatedRate > 0 ? (variance / boqEstimatedRate) * 100 : 0;
  let severity = 'OK';
  if (variancePct > 20) severity = 'CRITICAL';
  else if (variancePct > 10) severity = 'WARNING';
  else if (variancePct < -10) severity = 'FAVOURABLE';

  return {
    materialName,
    boqEstimatedRate,
    currentMarketRate,
    unit,
    variance: Math.round(variance),
    variancePct: +variancePct.toFixed(2),
    severity,
    recommendation: severity === 'CRITICAL'
      ? 'Raise price escalation claim under PEC Clause 70 immediately.'
      : severity === 'WARNING'
      ? 'Monitor closely — consider forward purchase or escalation notice.'
      : severity === 'FAVOURABLE'
      ? 'Market rate lower than BOQ. Verify quality and lock in purchase.'
      : 'Rate within acceptable range.',
  };
}

/**
 * Subcontractor Retainage Ledger Entry.
 * @param {{ subcontractorName: string, workOrderValue: number, retainagePct: number, amountCertified: number, amountReleased: number }} params
 */
export function computeSubcontractorRetainage({ subcontractorName, workOrderValue, retainagePct = 10, amountCertified, amountReleased = 0 }) {
  const totalRetainageDeducted = Math.round(amountCertified * (retainagePct / 100));
  const netPaidToDate = Math.round(amountCertified - totalRetainageDeducted + amountReleased);
  const retainageBalance = Math.round(totalRetainageDeducted - amountReleased);
  const percentComplete = workOrderValue > 0 ? +((amountCertified / workOrderValue) * 100).toFixed(1) : 0;

  return {
    subcontractorName,
    workOrderValue,
    retainagePct,
    amountCertified: Math.round(amountCertified),
    totalRetainageDeducted,
    amountReleased: Math.round(amountReleased),
    retainageBalance,
    netPaidToDate,
    percentComplete,
    dlpStatus: percentComplete >= 100 ? 'DLP_STARTED' : 'IN_PROGRESS',
  };
}

/**
 * Resolve recommended construction domain KPIs for hub dashboard.
 * @param {{ contractValue: number, boqTotal: number, expenditureToDate: number, ipcCertifiedTotal: number, retentionHeld: number, completionPct: number }} params
 */
export function resolveConstructionDashboardKPIs(params) {
  const {
    contractValue = 0,
    boqTotal = contractValue,
    expenditureToDate = 0,
    ipcCertifiedTotal = 0,
    retentionHeld = 0,
    completionPct = 0,
  } = params;

  const unbilledWork = Math.max(0, expenditureToDate - ipcCertifiedTotal);
  const remainingWork = Math.max(0, contractValue - ipcCertifiedTotal);
  const projectedFinalCost = completionPct > 0 ? Math.round(expenditureToDate / (completionPct / 100)) : null;
  const profitMarginProjected = projectedFinalCost && contractValue > 0
    ? +((((contractValue - projectedFinalCost) / contractValue) * 100).toFixed(1))
    : null;

  return {
    contractValue,
    boqTotal,
    expenditureToDate,
    ipcCertifiedTotal,
    retentionHeld,
    completionPct,
    unbilledWork,
    remainingWork,
    projectedFinalCost,
    profitMarginProjected,
    alerts: [
      unbilledWork > contractValue * 0.15 && { type: 'WARNING', message: 'Unbilled work exceeds 15% of contract. Raise IPC immediately.' },
      retentionHeld > contractValue * 0.10 && { type: 'INFO', message: 'Retention balance is above 10% of contract. Request DLP release upon milestone.' },
    ].filter(Boolean),
  };
}


// ── BOQ Item Presets (Common Construction Work Items Pakistan 2026) ─────────
export const BOQ_ITEM_PRESETS = [
  {
    category: 'Earthwork',
    items: [
      { description: 'Excavation in ordinary soil (manual)', unit: 'Cu.M', estimatedRate: 550, schedule_code: 'CE-EW-01', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.05', labor_cost_ratio: '0.80', machinery_cost_ratio: '0.10', overhead_ratio: '0.05', work_phase: 'Foundation' },
      { description: 'Excavation in ordinary soil (mechanical)', unit: 'Cu.M', estimatedRate: 320, schedule_code: 'CE-EW-02', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.05', labor_cost_ratio: '0.25', machinery_cost_ratio: '0.65', overhead_ratio: '0.05', work_phase: 'Foundation' },
      { description: 'Excavation in hard rock (blasting)', unit: 'Cu.M', estimatedRate: 2200, schedule_code: 'CE-EW-03', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.30', labor_cost_ratio: '0.35', machinery_cost_ratio: '0.30', overhead_ratio: '0.05', work_phase: 'Foundation' },
      { description: 'Filling and compaction (imported soil)', unit: 'Cu.M', estimatedRate: 450, schedule_code: 'CE-EW-04', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.40', labor_cost_ratio: '0.35', machinery_cost_ratio: '0.20', overhead_ratio: '0.05', work_phase: 'Foundation' },
      { description: 'Sub-grade preparation & compaction', unit: 'Sq.M', estimatedRate: 85, schedule_code: 'CE-EW-05', sor_reference: 'CSR-NHA', material_cost_ratio: '0.10', labor_cost_ratio: '0.40', machinery_cost_ratio: '0.45', overhead_ratio: '0.05', work_phase: 'Foundation' },
    ]
  },
  {
    category: 'Concrete Works',
    items: [
      { description: 'Plain cement concrete 1:2:4 (PCC)', unit: 'Cu.M', estimatedRate: 22000, schedule_code: 'BC-CC-01', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.68', labor_cost_ratio: '0.22', machinery_cost_ratio: '0.08', overhead_ratio: '0.02', work_phase: 'Foundation' },
      { description: 'RCC M-15 (2000 PSI) footings & foundations', unit: 'Cu.M', estimatedRate: 28500, schedule_code: 'BC-CC-02', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.70', labor_cost_ratio: '0.20', machinery_cost_ratio: '0.08', overhead_ratio: '0.02', work_phase: 'Foundation' },
      { description: 'RCC M-20 (2500 PSI) columns & beams', unit: 'Cu.M', estimatedRate: 32000, schedule_code: 'BC-CC-03', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.68', labor_cost_ratio: '0.22', machinery_cost_ratio: '0.08', overhead_ratio: '0.02', work_phase: 'Structure' },
      { description: 'RCC M-25 (3000 PSI) slabs & frames', unit: 'Cu.M', estimatedRate: 36500, schedule_code: 'BC-CC-04', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.70', labor_cost_ratio: '0.20', machinery_cost_ratio: '0.08', overhead_ratio: '0.02', work_phase: 'Structure' },
      { description: 'RCC M-30 (4000 PSI) high-stress members', unit: 'Cu.M', estimatedRate: 42000, schedule_code: 'BC-CC-05', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.72', labor_cost_ratio: '0.18', machinery_cost_ratio: '0.08', overhead_ratio: '0.02', work_phase: 'Structure' },
      { description: 'Steel reinforcement supply & fix (Grade 60)', unit: 'Ton', estimatedRate: 310000, schedule_code: 'BC-CC-06', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.85', labor_cost_ratio: '0.12', machinery_cost_ratio: '0.02', overhead_ratio: '0.01', work_phase: 'Structure' },
      { description: 'Formwork (shuttering) for slabs', unit: 'Sq.M', estimatedRate: 850, schedule_code: 'BC-CC-07', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.45', labor_cost_ratio: '0.45', machinery_cost_ratio: '0.08', overhead_ratio: '0.02', work_phase: 'Structure' },
    ]
  },
  {
    category: 'Masonry',
    items: [
      { description: 'Brick masonry in cement mortar 1:4 (9 inch)', unit: 'Cu.M', estimatedRate: 18500, schedule_code: 'BC-MS-01', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.58', labor_cost_ratio: '0.38', machinery_cost_ratio: '0.02', overhead_ratio: '0.02', work_phase: 'Structure' },
      { description: 'Brick masonry in cement mortar 1:4 (4.5 inch)', unit: 'Sq.M', estimatedRate: 3200, schedule_code: 'BC-MS-02', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.58', labor_cost_ratio: '0.38', machinery_cost_ratio: '0.02', overhead_ratio: '0.02', work_phase: 'Structure' },
      { description: 'Hollow block masonry 8 inch (200mm)', unit: 'Sq.M', estimatedRate: 2800, schedule_code: 'BC-MS-03', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.60', labor_cost_ratio: '0.36', machinery_cost_ratio: '0.02', overhead_ratio: '0.02', work_phase: 'Structure' },
      { description: 'Plaster (12mm cement plaster 1:4)', unit: 'Sq.M', estimatedRate: 450, schedule_code: 'BC-MS-04', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.40', labor_cost_ratio: '0.55', machinery_cost_ratio: '0.03', overhead_ratio: '0.02', work_phase: 'Finishing' },
      { description: 'Ceramic floor tiling (supplied & fixed)', unit: 'Sq.M', estimatedRate: 2200, schedule_code: 'BC-MS-05', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.65', labor_cost_ratio: '0.30', machinery_cost_ratio: '0.03', overhead_ratio: '0.02', work_phase: 'Finishing' },
    ]
  },
  {
    category: 'Road & Pavement',
    items: [
      { description: 'Sub-base granular material 150mm thick', unit: 'Sq.M', estimatedRate: 420, schedule_code: 'CE-RD-01', sor_reference: 'CSR-NHA', material_cost_ratio: '0.55', labor_cost_ratio: '0.20', machinery_cost_ratio: '0.22', overhead_ratio: '0.03', work_phase: 'Foundation' },
      { description: 'Crusher run macadam base course 200mm', unit: 'Sq.M', estimatedRate: 850, schedule_code: 'CE-RD-02', sor_reference: 'CSR-NHA', material_cost_ratio: '0.55', labor_cost_ratio: '0.15', machinery_cost_ratio: '0.27', overhead_ratio: '0.03', work_phase: 'Structure' },
      { description: 'Bituminous base course AC-Base 75mm', unit: 'Sq.M', estimatedRate: 1650, schedule_code: 'CE-RD-03', sor_reference: 'CSR-NHA', material_cost_ratio: '0.60', labor_cost_ratio: '0.10', machinery_cost_ratio: '0.27', overhead_ratio: '0.03', work_phase: 'Structure' },
      { description: 'Wearing course AC-WC 50mm dense graded', unit: 'Sq.M', estimatedRate: 1850, schedule_code: 'CE-RD-04', sor_reference: 'CSR-NHA', material_cost_ratio: '0.60', labor_cost_ratio: '0.10', machinery_cost_ratio: '0.27', overhead_ratio: '0.03', work_phase: 'Finishing' },
      { description: 'Tack coat bitumen emulsion', unit: 'Sq.M', estimatedRate: 55, schedule_code: 'CE-RD-05', sor_reference: 'CSR-NHA', material_cost_ratio: '0.72', labor_cost_ratio: '0.08', machinery_cost_ratio: '0.17', overhead_ratio: '0.03', work_phase: 'Structure' },
      { description: 'Road marking thermoplastic paint', unit: 'R.Ft', estimatedRate: 65, schedule_code: 'CE-RD-06', sor_reference: 'CSR-NHA', material_cost_ratio: '0.60', labor_cost_ratio: '0.25', machinery_cost_ratio: '0.12', overhead_ratio: '0.03', work_phase: 'Finishing' },
    ]
  },
  {
    category: 'Finishing Works',
    items: [
      { description: 'Aluminium door & frame (standard commercial)', unit: 'Job', estimatedRate: 55000, schedule_code: 'BC-FN-01', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.75', labor_cost_ratio: '0.20', machinery_cost_ratio: '0.03', overhead_ratio: '0.02', work_phase: 'Finishing' },
      { description: 'UPVC window glazed fixed', unit: 'Sq.Ft', estimatedRate: 1800, schedule_code: 'BC-FN-02', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.72', labor_cost_ratio: '0.24', machinery_cost_ratio: '0.02', overhead_ratio: '0.02', work_phase: 'Finishing' },
      { description: 'Exterior paint 2 coats weather shield', unit: 'Sq.M', estimatedRate: 380, schedule_code: 'BC-FN-03', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.55', labor_cost_ratio: '0.40', machinery_cost_ratio: '0.03', overhead_ratio: '0.02', work_phase: 'Finishing' },
      { description: 'Internal paint 3 coats emulsion', unit: 'Sq.M', estimatedRate: 220, schedule_code: 'BC-FN-04', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.50', labor_cost_ratio: '0.45', machinery_cost_ratio: '0.03', overhead_ratio: '0.02', work_phase: 'Finishing' },
      { description: 'Waterproofing 5 layer bituminous membrane', unit: 'Sq.M', estimatedRate: 1800, schedule_code: 'BC-FN-05', sor_reference: 'MRS-PUNJAB', material_cost_ratio: '0.65', labor_cost_ratio: '0.28', machinery_cost_ratio: '0.05', overhead_ratio: '0.02', work_phase: 'Finishing' },
    ]
  },
];

// ── City-Wise Rate Multipliers (Pakistan Aug 2026, Base = Lahore) ──────────
export const CITY_RATE_MULTIPLIERS = {
  'Lahore':      { steel: 1.000, cement: 1.000, aggregate: 1.000, labor: 1.000, machinery: 1.000 },
  'Karachi':     { steel: 0.970, cement: 0.960, aggregate: 0.990, labor: 0.950, machinery: 0.970 },
  'Islamabad':   { steel: 1.020, cement: 1.010, aggregate: 1.050, labor: 1.080, machinery: 1.020 },
  'Rawalpindi':  { steel: 1.015, cement: 1.005, aggregate: 1.040, labor: 1.060, machinery: 1.015 },
  'Peshawar':    { steel: 1.040, cement: 1.030, aggregate: 1.080, labor: 0.920, machinery: 1.050 },
  'Quetta':      { steel: 1.080, cement: 1.060, aggregate: 1.100, labor: 0.900, machinery: 1.090 },
  'Faisalabad':  { steel: 0.995, cement: 0.990, aggregate: 1.010, labor: 0.970, machinery: 0.995 },
  'Multan':      { steel: 1.005, cement: 0.995, aggregate: 1.020, labor: 0.960, machinery: 1.005 },
  'Gujranwala':  { steel: 0.990, cement: 0.985, aggregate: 0.995, labor: 0.965, machinery: 0.990 },
  'Hyderabad':   { steel: 0.975, cement: 0.965, aggregate: 0.985, labor: 0.940, machinery: 0.975 },
};

export function getCityAdjustedRate(materialName, city, baseRates) {
  const base = baseRates[materialName];
  if (!base) return null;
  const mults = CITY_RATE_MULTIPLIERS[city];
  if (!mults) return { rate: base.rate, cityMultiplier: 1.0, baseRate: base.rate };
  const mult = mults[base.category] || 1.0;
  return { rate: Math.round(base.rate * mult), cityMultiplier: mult, baseRate: base.rate };
}

// ── Seasonal Calendar ──────────────────────────────────────────────────────
export const CONSTRUCTION_SEASONAL_CALENDAR = {
  1:  { season: 'peak',    alert: null,           advice: 'Peak: ideal for concrete & RCC. Lock in material prices.' },
  2:  { season: 'peak',    alert: null,           advice: 'Best month for structural works. Maximize billing.' },
  3:  { season: 'peak',    alert: null,           advice: 'Final peak month. Accelerate works and submit pending IPCs.' },
  4:  { season: 'moderate',alert: null,           advice: 'Rising temperatures. Plan concrete pours for early morning.' },
  5:  { season: 'slow',    alert: 'heat',         advice: 'Extreme heat. Restrict concrete pours to early AM.' },
  6:  { season: 'slow',    alert: 'pre-monsoon',  advice: 'Pre-monsoon checks: drainage, formwork bracing, material storage.' },
  7:  { season: 'stop',    alert: 'monsoon',      advice: 'MONSOON: Halt earthworks & asphalt. Log rainfall for time extension claims.' },
  8:  { season: 'stop',    alert: 'monsoon',      advice: 'MONSOON PEAK: Halt road works. Log daily rainfall. Safety first.' },
  9:  { season: 'slow',    alert: 'post-monsoon', advice: 'Post-monsoon: inspect damage, re-survey, prepare for October restart.' },
  10: { season: 'start',   alert: null,           advice: 'Season starts! Mobilize equipment and ramp up workforce.' },
  11: { season: 'peak',    alert: null,           advice: 'Peak season: full productivity. All work types optimal.' },
  12: { season: 'peak',    alert: null,           advice: 'Peak continues. Year-end IPC billing. Close partial items.' },
};

export function getCurrentSeasonalIntelligence() {
  const month = new Date().getMonth() + 1;
  const data = CONSTRUCTION_SEASONAL_CALENDAR[month] || CONSTRUCTION_SEASONAL_CALENDAR[1];
  return { month, ...data, isMonsoon: data.alert === 'monsoon', isPeak: data.season === 'peak', isSlow: data.season === 'slow' || data.season === 'stop' };
}

// ── PEC Clause 70 Escalation ───────────────────────────────────────────────
export const PEC_CLAUSE_70_CONFIG = {
  alertThresholdPct: 10,
  claimThresholdPct: 20,
  wpiCategories: {
    steel:     { label: 'WPI Steel',     currentIndex: 148.2, baseIndex: 100, changePct: 48.2 },
    cement:    { label: 'WPI Cement',    currentIndex: 142.5, baseIndex: 100, changePct: 42.5 },
    bitumen:   { label: 'WPI Bitumen',   currentIndex: 165.8, baseIndex: 100, changePct: 65.8 },
    labor:     { label: 'WPI Labour',    currentIndex: 138.9, baseIndex: 100, changePct: 38.9 },
    fuel:      { label: 'WPI Fuel',      currentIndex: 172.4, baseIndex: 100, changePct: 72.4 },
    aggregate: { label: 'WPI Aggregate', currentIndex: 128.3, baseIndex: 100, changePct: 28.3 },
  },
};

export function computePECClause70Escalation({ contractAmount, category, customCurrentIndex, customBaseIndex }) {
  const cat = PEC_CLAUSE_70_CONFIG.wpiCategories[category];
  if (!cat) return { escalationAmount: 0, percentageClaim: 0, status: 'N/A', shouldClaim: false };
  const I1 = customCurrentIndex != null ? customCurrentIndex : cat.currentIndex;
  const I0 = customBaseIndex != null ? customBaseIndex : cat.baseIndex;
  const escalationAmount = Math.round(contractAmount * (I1 - I0) / I0);
  const percentageClaim = +((I1 - I0) / I0 * 100).toFixed(2);
  let status = 'OK';
  if (percentageClaim >= PEC_CLAUSE_70_CONFIG.claimThresholdPct) status = 'CLAIM_DUE';
  else if (percentageClaim >= PEC_CLAUSE_70_CONFIG.alertThresholdPct) status = 'ALERT';
  return { escalationAmount, percentageClaim, status, shouldClaim: percentageClaim >= PEC_CLAUSE_70_CONFIG.alertThresholdPct };
}

export function generateConstructionIntelligenceAlerts() {
  const alerts = [];
  const season = getCurrentSeasonalIntelligence();
  const dayOfMonth = new Date().getDate();
  if (season.isMonsoon) {
    alerts.push({ type: 'danger', message: 'MONSOON ACTIVE: Halt road & earthworks. Log daily rainfall for time extension claims.', actionTab: 'site-ops' });
  } else if (season.alert === 'pre-monsoon') {
    alerts.push({ type: 'warning', message: 'Pre-monsoon: Secure excavations, prepare time extension docs.', actionTab: 'site-ops' });
  } else if (season.isPeak) {
    alerts.push({ type: 'success', message: 'Peak season active — maximize productivity & accelerate IPC billing.', actionTab: 'ipc' });
  }
  if (dayOfMonth >= 12 && dayOfMonth <= 15) {
    alerts.push({ type: 'warning', message: 'FBR WHT monthly return due by 15th. File Section 153(1)(c) on time.', actionTab: 'tax-compliance' });
  }
  const fuelChange = PEC_CLAUSE_70_CONFIG.wpiCategories.fuel.changePct;
  const steelChange = PEC_CLAUSE_70_CONFIG.wpiCategories.steel.changePct;
  if (fuelChange > 40) alerts.push({ type: 'warning', message: 'Fuel WPI +' + fuelChange.toFixed(1) + '% - check machinery BOQ variance & Clause 70 eligibility.', actionTab: 'material-rates' });
  if (steelChange > 30) alerts.push({ type: 'warning', message: 'Steel WPI +' + steelChange.toFixed(1) + '% - verify BOQ rates vs market. Escalation claim may be due.', actionTab: 'material-rates' });
  return alerts;
}

export const WHT_FILING_CALENDAR_2026 = [
  { month: 'July 2026',      dueDate: '2026-08-15', period: 'Jul 2026', section: 'Sec 153(1)(c)', status: 'DUE' },
  { month: 'August 2026',    dueDate: '2026-09-15', period: 'Aug 2026', section: 'Sec 153(1)(c)', status: 'UPCOMING' },
  { month: 'September 2026', dueDate: '2026-10-15', period: 'Sep 2026', section: 'Sec 153(1)(c)', status: 'UPCOMING' },
  { month: 'October 2026',   dueDate: '2026-11-15', period: 'Oct 2026', section: 'Sec 153(1)(c)', status: 'UPCOMING' },
  { month: 'November 2026',  dueDate: '2026-12-15', period: 'Nov 2026', section: 'Sec 153(1)(c)', status: 'UPCOMING' },
  { month: 'December 2026',  dueDate: '2027-01-15', period: 'Dec 2026', section: 'Sec 153(1)(c)', status: 'UPCOMING' },
];

export const MACHINERY_TYPES = [
  { type: 'Excavator',            models: ['CAT 320D', 'Hitachi ZX200', 'Komatsu PC200', 'JCB JS220'], fuelRatePerHour: 18 },
  { type: 'Motor Grader',         models: ['CAT 140K', 'Komatsu GD655', 'John Deere 670G'], fuelRatePerHour: 22 },
  { type: 'Vibratory Roller',     models: ['Dynapac CA250', 'BOMAG BW212D', 'Hamm HD+110i'], fuelRatePerHour: 12 },
  { type: 'Asphalt Paver',        models: ['Vogele Super 1800', 'Dynapac F141C', 'CAT AP655F'], fuelRatePerHour: 15 },
  { type: 'Crawler Dozer',        models: ['CAT D6T', 'Komatsu D65PX', 'John Deere 850K'], fuelRatePerHour: 25 },
  { type: 'Wheel Loader',         models: ['CAT 938K', 'Komatsu WA380', 'Volvo L90H'], fuelRatePerHour: 16 },
  { type: 'Mobile Crane',         models: ['Tadano GR500E', 'Liebherr LTM1070', 'XCMG QY25K'], fuelRatePerHour: 20 },
  { type: 'Concrete Mixer',       models: ['7.5 Cu.Ft Diesel', 'Transit Mixer 6 Cu.M'], fuelRatePerHour: 6 },
  { type: 'Concrete Pump',        models: ['CIFA K45', 'Putzmeister M38'], fuelRatePerHour: 10 },
  { type: 'Generator',            models: ['50 KVA Perkins', '100 KVA Cummins', '200 KVA Volvo'], fuelRatePerHour: 14 },
  { type: 'Water Tanker',         models: ['5000 Gallon', '10000 Gallon'], fuelRatePerHour: 8 },
  { type: 'Dump Truck',           models: ['10 Ton', '20 Ton', '30 Ton'], fuelRatePerHour: 12 },
];

export const SUBCONTRACTOR_SPECIALIZATIONS = [
  'Civil Works (General)', 'Reinforced Concrete', 'Masonry & Brickwork',
  'Structural Steel Fabrication', 'Piling Works', 'Road & Pavement',
  'Asphalt Works', 'Electrical Works', 'Plumbing & Sanitation',
  'HVAC & Mechanical', 'Painting & Surface Treatment', 'Waterproofing',
  'Tiling & Flooring', 'Carpentry & Woodwork', 'Aluminium Fabrication',
  'Lifting & Crane Services', 'Earthmoving & Excavation', 'Landscaping',
  'Security & Fencing', 'Concrete Pumping Services',
];
