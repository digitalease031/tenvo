'use server';

/**
 * Interim Payment Certificate (IPC) Server Actions
 * Handles IPC running bills with mobilization advance recovery, retention, and tax deductions
 */

import { db } from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { computeIPCRunningBill } from '@/lib/construction/constructionIntelligence';

// ============================================================================
// Validation Schemas
// ============================================================================

const recordIPCSchema = z.object({
  project_id: z.string().uuid(),
  ipc_number: z.number().int().positive(),
  period_starting: z.string().optional(),
  period_ending: z.string(),
  gross_certified_amount: z.number().min(0),
  escalation_amount: z.number().min(0).default(0),
  secured_advance: z.number().min(0).default(0),
  is_company_contractor: z.boolean().default(true),
  has_wht_exemption: z.boolean().default(false),
  engineer_remarks: z.string().optional(),
  contractor_remarks: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// Record IPC
// ============================================================================

export async function recordIPCAction(businessId, data) {
  const { session } = await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const normalizedData = {
      project_id: data.project_id,
      ipc_number: Number(data.ipc_number ?? 1),
      period_starting: data.period_starting ? String(data.period_starting) : undefined,
      period_ending: data.period_ending ? String(data.period_ending) : new Date().toISOString().slice(0, 10),
      gross_certified_amount: Number(data.gross_certified_amount ?? data.gross_certified ?? 0),
      escalation_amount: Number(data.escalation_amount ?? 0),
      secured_advance: Number(data.secured_advance ?? 0),
      is_company_contractor: data.is_company_contractor !== undefined ? Boolean(data.is_company_contractor) : true,
      has_wht_exemption: Boolean(data.has_wht_exemption),
      engineer_remarks: data.engineer_remarks ? String(data.engineer_remarks) : undefined,
      contractor_remarks: data.contractor_remarks ? String(data.contractor_remarks) : undefined,
      notes: data.notes ? String(data.notes) : undefined,
    };

    const validated = recordIPCSchema.parse(normalizedData);

    const project = await db.construction_projects.findFirst({
      where: { id: validated.project_id, business_id: businessId },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const existing = await db.interim_payment_certificates.findFirst({
      where: { project_id: validated.project_id, ipc_number: validated.ipc_number },
    });

    if (existing) {
      return { success: false, error: 'IPC number already exists for this project' };
    }

    const calculation = computeIPCRunningBill({
      grossCertifiedAmount: validated.gross_certified_amount,
      cumulativePreviousIPCs: Number(project.cumulative_certified),
      contractValue: Number(project.contract_value),
      mobilizationAdvancePct: Number(project.mobilization_adv_pct),
      mobilizationRecovered: Number(project.mobilization_recovered),
      retentionPct: Number(project.retention_pct),
      retentionReleased: 0,
      isCompanyContractor: validated.is_company_contractor,
      provinceCode: project.province_code,
      hasWhtExemption: validated.has_wht_exemption,
      escalationAmount: validated.escalation_amount,
      securedAdvance: validated.secured_advance,
    });

    const [ipc] = await db.$transaction([
      db.interim_payment_certificates.create({
        data: {
          business_id: businessId,
          project_id: validated.project_id,
          ipc_number: validated.ipc_number,
          ipc_code: `IPC-${String(validated.ipc_number).padStart(2, '0')}`,
          period_starting: validated.period_starting ? new Date(validated.period_starting) : null,
          period_ending: new Date(validated.period_ending),
          gross_certified_amount: validated.gross_certified_amount,
          this_ipc_gross: calculation.thisIpcGross,
          escalation_amount: calculation.escalationAmount,
          secured_advance: calculation.securedAdvance,
          retention_deduction: calculation.retentionDeductible,
          mobilization_recovery: calculation.mobilizationRecoveryThisIPC,
          net_before_tax: calculation.netBeforeTax,
          wht_rate: calculation.whtRate,
          wht_deduction: calculation.whtDeduction,
          provincial_tax_rate: calculation.provincialTaxRate,
          provincial_tax_label: calculation.provincialTaxLabel,
          provincial_tax_deduction: calculation.provincialTaxDeduction,
          net_payable: calculation.netPayable,
          status: 'SUBMITTED',
          engineer_remarks: validated.engineer_remarks,
          contractor_remarks: validated.contractor_remarks,
          notes: validated.notes,
          created_by: session?.user?.id,
        },
      }),
      db.construction_projects.update({
        where: { id: validated.project_id },
        data: {
          cumulative_certified: validated.gross_certified_amount,
          retention_held: { increment: calculation.retentionDeductible },
          mobilization_recovered: calculation.mobilizationRecoveredTotal,
        },
      }),
    ]);

    revalidatePath(`/business/projects/${validated.project_id}`);

    return {
      success: true,
      ipc: serializeDecimalsDeep(ipc),
      calculation: serializeDecimalsDeep(calculation),
    };
  } catch (err) {
    console.error('[recordIPCAction]', err);
    return { success: false, error: err.message || 'Failed to record IPC' };
  }
}

// ============================================================================
// Get IPCs for Project
// ============================================================================

export async function getIPCsAction(businessId, projectId) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const project = await db.construction_projects.findFirst({
      where: { id: projectId, business_id: businessId },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const ipcs = await db.interim_payment_certificates.findMany({
      where: { project_id: projectId },
      orderBy: { ipc_number: 'asc' },
    });

    return { success: true, ipcs: serializeDecimalsDeep(ipcs) };
  } catch (err) {
    console.error('[getIPCsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch IPCs' };
  }
}

// ============================================================================
// Get IPC Detail
// ============================================================================

export async function getIPCDetailAction(businessId, ipcId) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const ipc = await db.interim_payment_certificates.findFirst({
      where: { id: ipcId, business_id: businessId },
      include: { project: true },
    });

    if (!ipc) {
      return { success: false, error: 'IPC not found' };
    }

    return { success: true, ipc: serializeDecimalsDeep(ipc) };
  } catch (err) {
    console.error('[getIPCDetailAction]', err);
    return { success: false, error: err.message || 'Failed to fetch IPC' };
  }
}

// ============================================================================
// Update IPC Status
// ============================================================================

export async function updateIPCStatusAction(businessId, ipcId, status, remarks = '') {
  const { session } = await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const validStatuses = ['SUBMITTED', 'VERIFIED', 'APPROVED', 'DISBURSED', 'REJECTED'];

    if (!validStatuses.includes(status)) {
      return { success: false, error: 'Invalid status' };
    }

    const existing = await db.interim_payment_certificates.findFirst({
      where: { id: ipcId, business_id: businessId },
    });

    if (!existing) {
      return { success: false, error: 'IPC not found' };
    }

    const updateData = { status, updated_at: new Date() };
    const userId = session?.user?.id;

    if (status === 'VERIFIED') {
      updateData.verified_at = new Date();
      updateData.verified_by = userId;
    } else if (status === 'APPROVED') {
      updateData.approved_at = new Date();
      updateData.approved_by = userId;
    } else if (status === 'DISBURSED') {
      updateData.disbursed_at = new Date();
      if (remarks) updateData.disbursement_reference = remarks;
    }

    const ipc = await db.interim_payment_certificates.update({
      where: { id: ipcId },
      data: updateData,
    });

    if (status === 'DISBURSED') {
      await db.construction_projects.update({
        where: { id: existing.project_id },
        data: { cumulative_paid: { increment: Number(existing.net_payable) } },
      });
    }

    revalidatePath(`/business/projects/${existing.project_id}`);

    return { success: true, ipc: serializeDecimalsDeep(ipc) };
  } catch (err) {
    console.error('[updateIPCStatusAction]', err);
    return { success: false, error: err.message || 'Failed to update IPC status' };
  }
}

// ============================================================================
// Delete IPC
// ============================================================================

export async function deleteIPCAction(businessId, ipcId) {
  await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const existing = await db.interim_payment_certificates.findFirst({
      where: { id: ipcId, business_id: businessId },
      include: { project: true },
    });

    if (!existing) {
      return { success: false, error: 'IPC not found' };
    }

    if (!['SUBMITTED', 'REJECTED'].includes(existing.status)) {
      return {
        success: false,
        error: 'Cannot delete IPC that has been verified, approved, or disbursed',
      };
    }

    await db.$transaction([
      db.interim_payment_certificates.delete({ where: { id: ipcId } }),
      db.construction_projects.update({
        where: { id: existing.project_id },
        data: {
          cumulative_certified: {
            decrement:
              Number(existing.gross_certified_amount) -
              Number(existing.project.cumulative_certified),
          },
          retention_held: { decrement: Number(existing.retention_deduction) },
          mobilization_recovered: { decrement: Number(existing.mobilization_recovery) },
        },
      }),
    ]);

    revalidatePath(`/business/projects/${existing.project_id}`);

    return { success: true, message: 'IPC deleted successfully' };
  } catch (err) {
    console.error('[deleteIPCAction]', err);
    return { success: false, error: err.message || 'Failed to delete IPC' };
  }
}

// ============================================================================
// Calculate IPC Preview (Without Saving)
// ============================================================================

export async function calculateIPCPreviewAction(businessId, projectId, data) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const project = await db.construction_projects.findFirst({
      where: { id: projectId, business_id: businessId },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const {
      gross_certified_amount,
      escalation_amount = 0,
      secured_advance = 0,
      is_company_contractor = true,
      has_wht_exemption = false,
    } = data;

    const calculation = computeIPCRunningBill({
      grossCertifiedAmount: gross_certified_amount,
      cumulativePreviousIPCs: Number(project.cumulative_certified),
      contractValue: Number(project.contract_value),
      mobilizationAdvancePct: Number(project.mobilization_adv_pct),
      mobilizationRecovered: Number(project.mobilization_recovered),
      retentionPct: Number(project.retention_pct),
      retentionReleased: 0,
      isCompanyContractor: is_company_contractor,
      provinceCode: project.province_code,
      hasWhtExemption: has_wht_exemption,
      escalationAmount: escalation_amount,
      securedAdvance: secured_advance,
    });

    return { success: true, calculation: serializeDecimalsDeep(calculation) };
  } catch (err) {
    console.error('[calculateIPCPreviewAction]', err);
    return { success: false, error: err.message || 'Failed to calculate IPC preview' };
  }
}
