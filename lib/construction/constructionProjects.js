/**
 * Construction Project Tracker & Operations Manager
 *
 * Provides structured tracking for:
 * - Project Registry (Civil, Highway, Bridge, Building, Irrigation, Dam)
 * - Bill of Quantities (BOQ) Schedule & Line Item Execution
 * - Interim Payment Certificates (IPC) Log & Status Lifecycle
 * - Heavy Plant & Machinery Daily Logbook & Fuel Consumption
 * - Subcontractor Work Orders & Retainage Ledger
 */

import { computeIPCRunningBill, analyzeBOQVariance, computePECEscalation } from './constructionIntelligence.js';

/**
 * In-memory / tenant-scoped helper for initializing a new Construction Project.
 * @param {{
 *   code: string,
 *   name: string,
 *   clientName: string,
 *   contractorCategory: 'C-A'|'C-B'|'C-1'|'C-2'|'C-3'|'C-4'|'C-5'|'C-6',
 *   contractValue: number,
 *   commencementDate: string,
 *   completionDate: string,
 *   provinceCode?: 'PK-PB'|'PK-SD'|'PK-KP'|'PK-BA',
 *   isGovernmentProject?: boolean,
 *   mobilizationAdvancePct?: number,
 *   retentionPct?: number,
 *   boqItems?: any[],
 * }} params
 */
export function createConstructionProject(params) {
  const {
    code,
    name,
    clientName,
    contractorCategory = 'C-1',
    contractValue = 0,
    commencementDate,
    completionDate,
    provinceCode = 'PK-PB',
    isGovernmentProject = true,
    mobilizationAdvancePct = 10,
    retentionPct = 5,
    boqItems = [],
  } = params;

  return {
    id: `PRJ-${code.toUpperCase()}`,
    code: code.toUpperCase(),
    name,
    clientName,
    contractorCategory,
    contractValue: Math.round(contractValue),
    commencementDate,
    completionDate,
    provinceCode,
    isGovernmentProject: Boolean(isGovernmentProject),
    mobilizationAdvancePct,
    retentionPct,
    status: 'ACTIVE',
    cumulativeCertified: 0,
    cumulativePaid: 0,
    retentionHeld: 0,
    mobilizationRecovered: 0,
    boqItems: Array.isArray(boqItems) ? boqItems : [],
    ipcs: [],
    machineryLogs: [],
    subcontractorLedgers: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Record a new Interim Payment Certificate (IPC) for a project.
 * @param {object} project
 * @param {{
 *   ipcNumber: number,
 *   grossCertifiedAmount: number,
 *   periodEnding: string,
 *   escalationAmount?: number,
 *   securedAdvance?: number,
 *   isCompanyContractor?: boolean,
 *   hasWhtExemption?: boolean,
 * }} ipcData
 */
export function recordProjectIPC(project, ipcData) {
  const {
    ipcNumber,
    grossCertifiedAmount,
    periodEnding,
    escalationAmount = 0,
    securedAdvance = 0,
    isCompanyContractor = true,
    hasWhtExemption = false,
  } = ipcData;

  const bill = computeIPCRunningBill({
    grossCertifiedAmount,
    cumulativePreviousIPCs: project.cumulativeCertified || 0,
    contractValue: project.contractValue,
    mobilizationAdvancePct: project.mobilizationAdvancePct || 10,
    mobilizationRecovered: project.mobilizationRecovered || 0,
    retentionPct: project.retentionPct || 5,
    retentionReleased: 0,
    isCompanyContractor,
    provinceCode: project.provinceCode || 'PK-PB',
    hasWhtExemption,
    escalationAmount,
    securedAdvance,
  });

  const record = {
    ipcNumber,
    ipcCode: `IPC-${String(ipcNumber).padStart(2, '0')}`,
    periodEnding,
    grossCertifiedAmount: Math.round(grossCertifiedAmount),
    thisIpcGross: bill.thisIpcGross,
    escalationAmount: bill.escalationAmount,
    retentionDeduction: bill.retentionDeductible,
    mobilizationRecovery: bill.mobilizationRecoveryThisIPC,
    securedAdvance: bill.securedAdvance,
    netBeforeTax: bill.netBeforeTax,
    whtDeduction: bill.whtDeduction,
    provincialTaxDeduction: bill.provincialTaxDeduction,
    netPayable: bill.netPayable,
    status: 'SUBMITTED', // SUBMITTED -> VERIFIED -> APPROVED -> DISBURSED
    submittedAt: new Date().toISOString(),
  };

  // Mutate project summary
  project.cumulativeCertified = Math.round(grossCertifiedAmount);
  project.retentionHeld = (project.retentionHeld || 0) + bill.retentionDeductible;
  project.mobilizationRecovered = bill.mobilizationRecoveredTotal;
  if (!Array.isArray(project.ipcs)) project.ipcs = [];
  project.ipcs.push(record);

  return { project, ipcRecord: record };
}

/**
 * Log daily heavy machinery operation entry.
 * @param {object} project
 * @param {{
 *   machineryCode: string,
 *   machineryName: string,
 *   operatorName: string,
 *   startHours: number,
 *   endHours: number,
 *   fuelLitres: number,
 *   locationStation: string,
 *   workDescription: string,
 *   date: string,
 * }} logData
 */
export function logMachineryOperation(project, logData) {
  const hoursWorked = Math.max(0, logData.endHours - logData.startHours);
  const fuelPerHour = hoursWorked > 0 ? +(logData.fuelLitres / hoursWorked).toFixed(2) : 0;

  const logEntry = {
    id: `MACH-LOG-${Date.now()}`,
    machineryCode: logData.machineryCode,
    machineryName: logData.machineryName,
    operatorName: logData.operatorName,
    startHours: logData.startHours,
    endHours: logData.endHours,
    hoursWorked,
    fuelLitres: logData.fuelLitres,
    fuelPerHour,
    locationStation: logData.locationStation,
    workDescription: logData.workDescription,
    date: logData.date || new Date().toISOString().slice(0, 10),
  };

  if (!Array.isArray(project.machineryLogs)) project.machineryLogs = [];
  project.machineryLogs.push(logEntry);

  return { project, logEntry };
}

/**
 * Summarize construction domain operations state for a tenant business.
 * @param {object} project
 */
export function getConstructionDomainSnapshot(project) {
  if (!project) {
    return {
      activeProjects: 0,
      totalContractValue: 0,
      totalCertifiedWork: 0,
      totalRetentionHeld: 0,
      completionRatePct: 0,
      recentIPCs: [],
      machineryFleetCount: 0,
    };
  }

  const completionRatePct = project.contractValue > 0
    ? +((project.cumulativeCertified / project.contractValue) * 100).toFixed(1)
    : 0;

  const totalFuelLitres = (project.machineryLogs || []).reduce((s, m) => s + (m.fuelLitres || 0), 0);
  const totalMachineryHours = (project.machineryLogs || []).reduce((s, m) => s + (m.hoursWorked || 0), 0);

  return {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    clientName: project.clientName,
    contractorCategory: project.contractorCategory,
    contractValue: project.contractValue,
    cumulativeCertified: project.cumulativeCertified,
    retentionHeld: project.retentionHeld,
    mobilizationRecovered: project.mobilizationRecovered,
    completionRatePct,
    ipcCount: (project.ipcs || []).length,
    latestIPC: (project.ipcs || [])[(project.ipcs || []).length - 1] || null,
    totalMachineryHours,
    totalFuelLitres,
    overallFuelAvgPerHour: totalMachineryHours > 0 ? +(totalFuelLitres / totalMachineryHours).toFixed(2) : 0,
  };
}
