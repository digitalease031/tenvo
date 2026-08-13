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

// ── 2026 Pakistan Material Benchmark Rates (PKR) ──────────────────────────
export const PK_CONSTRUCTION_MATERIAL_RATES_2026 = {
  'Rebar Grade 60 12mm': { rate: 260000, unit: 'Ton', category: 'steel', minOrder: 5 },
  'Rebar Grade 60 16mm': { rate: 261000, unit: 'Ton', category: 'steel', minOrder: 5 },
  'Rebar Grade 60 20mm': { rate: 262000, unit: 'Ton', category: 'steel', minOrder: 5 },
  'Rebar Grade 60 25mm': { rate: 265000, unit: 'Ton', category: 'steel', minOrder: 5 },
  'OPC Cement 50kg Bag': { rate: 1420, unit: 'Bag', category: 'cement', minOrder: 100 },
  'SRC Cement 50kg Bag': { rate: 1550, unit: 'Bag', category: 'cement', minOrder: 100 },
  'Bitumen 60/70': { rate: 210000, unit: 'Ton', category: 'bitumen', minOrder: 2 },
  'Bitumen 80/100': { rate: 208000, unit: 'Ton', category: 'bitumen', minOrder: 2 },
  'RMC C20 (2500 PSI)': { rate: 14000, unit: 'Cu.M', category: 'concrete', minOrder: 10 },
  'RMC C25 (3000 PSI)': { rate: 15500, unit: 'Cu.M', category: 'concrete', minOrder: 10 },
  'RMC C30 (4000 PSI)': { rate: 17500, unit: 'Cu.M', category: 'concrete', minOrder: 10 },
  'Aggregate 19mm (Margalla)': { rate: 120, unit: 'Cu.Ft', category: 'aggregate', minOrder: 500 },
  'Aggregate 38mm (Base)': { rate: 105, unit: 'Cu.Ft', category: 'aggregate', minOrder: 500 },
  'River Sand (Lawrencepur)': { rate: 55, unit: 'Cu.Ft', category: 'sand', minOrder: 1000 },
  'Excavator 1m3 (CAT 320)': { rate: 14000, unit: 'Hour', category: 'machinery', minOrder: 8 },
  'Motor Grader (CAT 140K)': { rate: 16000, unit: 'Hour', category: 'machinery', minOrder: 8 },
  'Vibratory Roller 10T': { rate: 8500, unit: 'Hour', category: 'machinery', minOrder: 8 },
  'Asphalt Paver (Vögele)': { rate: 30000, unit: 'Hour', category: 'machinery', minOrder: 8 },
  'Transit Mixer 6-8 Cu.M': { rate: 95000, unit: 'Day', category: 'machinery', minOrder: 1 },
  'Steel Fixer Labour': { rate: 3000, unit: 'Day', category: 'labor', minOrder: 1 },
  'Mason Labour': { rate: 2800, unit: 'Day', category: 'labor', minOrder: 1 },
  'Unskilled Helper': { rate: 1750, unit: 'Day', category: 'labor', minOrder: 1 },
  'Shuttering Carpenter': { rate: 3200, unit: 'Day', category: 'labor', minOrder: 1 },
  'Plumber': { rate: 2500, unit: 'Day', category: 'labor', minOrder: 1 },
  'Electrician': { rate: 2700, unit: 'Day', category: 'labor', minOrder: 1 },
};

// ── PEC Contractor Categories ─────────────────────────────────────────────
export const PEC_CONTRACTOR_CATEGORIES = [
  { code: 'C-A', label: 'C-A — No Financial Limit', limitPKR: Infinity },
  { code: 'C-B', label: 'C-B — Up to PKR 3,000M', limitPKR: 3_000_000_000 },
  { code: 'C-1', label: 'C-1 — Up to PKR 1,000M', limitPKR: 1_000_000_000 },
  { code: 'C-2', label: 'C-2 — Up to PKR 500M', limitPKR: 500_000_000 },
  { code: 'C-3', label: 'C-3 — Up to PKR 250M', limitPKR: 250_000_000 },
  { code: 'C-4', label: 'C-4 — Up to PKR 100M', limitPKR: 100_000_000 },
  { code: 'C-5', label: 'C-5 — Up to PKR 50M', limitPKR: 50_000_000 },
  { code: 'C-6', label: 'C-6 — Up to PKR 25M', limitPKR: 25_000_000 },
];

// ── Schedule of Rates References ─────────────────────────────────────────
export const CONSTRUCTION_SOR_REFERENCES = [
  { code: 'MRS-PUNJAB', label: 'Punjab Market Rate System (MRS / CSR)', issuer: 'Government of Punjab CWD' },
  { code: 'CSR-NHA', label: 'Federal CSR (NHA)', issuer: 'National Highway Authority' },
  { code: 'SPPRA-DRC', label: 'Sindh SPPRA DRC / Schedule Rates', issuer: 'SPPRA Sindh' },
  { code: 'KPK-CSR', label: 'KPK Composite Schedule of Rates', issuer: 'Government of KP C&W' },
  { code: 'BSR-BALOCH', label: 'Balochistan Schedule of Rates (BSR)', issuer: 'Government of Balochistan' },
];

// ── Tax Configuration (Pakistan 2026) ─────────────────────────────────────
export const CONSTRUCTION_TAX_CONFIG_PK = {
  whtCompany: 7.5,     // FBR Section 153(1)(c) — Company contractor
  whtNonCompany: 8.0,  // FBR Section 153(1)(c) — Non-company contractor
  pra: 5.0,            // Punjab Revenue Authority — reduced rate for construction
  praStandard: 16.0,   // PRA standard rate
  srb: 13.0,           // Sindh Revenue Board
  kpra: 15.0,          // Khyber Pakhtunkhwa Revenue Authority
  bra: 15.0,           // Balochistan Revenue Authority
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
  const whtRate = hasWhtExemption ? 0 : (isCompanyContractor ? CONSTRUCTION_TAX_CONFIG_PK.whtCompany : CONSTRUCTION_TAX_CONFIG_PK.whtNonCompany);
  const whtDeduction = Math.round(netBeforeTax * (whtRate / 100));

  // Provincial Tax (construction services)
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
  const fuelCostPerLitre = 310; // PKR approximate 2026
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
