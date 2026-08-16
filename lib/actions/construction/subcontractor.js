'use server';

/**
 * Subcontractor Work Order Server Actions
 * Handles work orders, running accounts, retainage, and DLP management.
 */

import { db } from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { computeSubcontractorRetainage } from '@/lib/construction/constructionIntelligence';

// ── Schemas ───────────────────────────────────────────────────────────────────

const createWorkOrderSchema = z.object({
  project_id: z.string().uuid(),
  vendor_id: z.string().uuid().optional(),
  work_order_no: z.string().min(1).max(50),
  work_order_date: z.string(),
  subcontractor_name: z.string().min(1),
  subcontractor_category: z
    .enum(['C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6', 'Labour', 'Specialist'])
    .optional(),
  pec_license_no: z.string().max(100).optional(),
  specialization_code: z.string().max(50).optional(),
  work_order_value: z.number().min(0),
  retainage_pct: z.number().min(0).max(20).default(10),
  scope_of_work: z.string().min(1),
  start_date: z.string().optional(),
  completion_date: z.string().optional(),
  dlp_months: z.number().int().min(0).max(36).default(12),
  performance_bond_amount: z.number().min(0).optional(),
  notes: z.string().optional(),
  domain_data: z.record(z.any()).optional(),
});

const certifyWorkOrderSchema = z.object({
  amount_to_certify: z.number().min(0),
  payment_reference: z.string().optional(),
  remarks: z.string().optional(),
});

// ── Create Work Order ─────────────────────────────────────────────────────────

export async function createSubcontractorWorkOrderAction(businessId, data) {
  const { session } = await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const today = new Date().toISOString().slice(0, 10);
    const normalizedData = {
      project_id: data.project_id,
      vendor_id: data.vendor_id || undefined,
      work_order_no: String(data.work_order_no || `WO-${Date.now().toString().slice(-4)}`).trim(),
      work_order_date: data.work_order_date ? String(data.work_order_date) : today,
      subcontractor_name: String(data.subcontractor_name || 'Subcontractor Partner').trim(),
      subcontractor_category: data.subcontractor_category || 'Specialist',
      pec_license_no: data.pec_license_no ? String(data.pec_license_no) : undefined,
      specialization_code: data.specialization_code ? String(data.specialization_code) : undefined,
      work_order_value: Number(data.work_order_value ?? 0),
      retainage_pct: Number(data.retainage_pct ?? 10),
      scope_of_work: String(data.scope_of_work || 'Subcontractor Scope of Work').trim(),
      start_date: data.start_date ? String(data.start_date) : today,
      completion_date: data.completion_date ? String(data.completion_date) : undefined,
      dlp_months: Number(data.dlp_months ?? 12),
      performance_bond_amount: data.performance_bond_amount ? Number(data.performance_bond_amount) : undefined,
      notes: data.notes ? String(data.notes) : undefined,
      domain_data: data.domain_data || {},
    };

    const validated = createWorkOrderSchema.parse(normalizedData);

    const project = await db.construction_projects.findFirst({
      where: { id: validated.project_id, business_id: businessId },
    });
    if (!project) return { success: false, error: 'Project not found' };

    const existing = await db.subcontractor_work_orders.findFirst({
      where: { business_id: businessId, work_order_no: validated.work_order_no },
    });
    if (existing) return { success: false, error: 'Work order number already exists' };

    const workOrder = await db.subcontractor_work_orders.create({
      data: {
        business_id: businessId,
        project_id: validated.project_id,
        vendor_id: validated.vendor_id,
        work_order_no: validated.work_order_no,
        work_order_date: new Date(validated.work_order_date),
        subcontractor_name: validated.subcontractor_name,
        subcontractor_category: validated.subcontractor_category,
        pec_license_no: validated.pec_license_no,
        specialization_code: validated.specialization_code,
        work_order_value: validated.work_order_value,
        retainage_pct: validated.retainage_pct,
        scope_of_work: validated.scope_of_work,
        start_date: validated.start_date ? new Date(validated.start_date) : null,
        completion_date: validated.completion_date ? new Date(validated.completion_date) : null,
        dlp_months: validated.dlp_months,
        notes: validated.notes,
        domain_data: validated.domain_data || {},
        created_by: session?.user?.id,
      },
    });

    revalidatePath(`/business/projects/${validated.project_id}`);
    return { success: true, workOrder: serializeDecimalsDeep(workOrder) };
  } catch (err) {
    console.error('[createSubcontractorWorkOrderAction]', err);
    return { success: false, error: err.message || 'Failed to create work order' };
  }
}

// ── Get Work Orders ───────────────────────────────────────────────────────────

export async function getSubcontractorWorkOrdersAction(businessId, options = {}) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const { projectId, status, limit = 50 } = options;

    const where = {
      business_id: businessId,
      ...(projectId && { project_id: projectId }),
      ...(status && { status }),
    };

    const workOrders = await db.subcontractor_work_orders.findMany({
      where,
      orderBy: { work_order_date: 'desc' },
      take: limit,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    return { success: true, workOrders: serializeDecimalsDeep(workOrders) };
  } catch (err) {
    console.error('[getSubcontractorWorkOrdersAction]', err);
    return { success: false, error: err.message || 'Failed to fetch work orders' };
  }
}

// ── Certify Work (Record Running Account Payment) ────────────────────────────

export async function certifySubcontractorWorkAction(businessId, workOrderId, data) {
  await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const validated = certifyWorkOrderSchema.parse(data);

    const workOrder = await db.subcontractor_work_orders.findFirst({
      where: { id: workOrderId, business_id: businessId },
    });
    if (!workOrder) return { success: false, error: 'Work order not found' };
    if (workOrder.status === 'TERMINATED')
      return { success: false, error: 'Cannot certify a terminated work order' };

    const newAmountCertified = Number(workOrder.amount_certified) + validated.amount_to_certify;
    const retainage = computeSubcontractorRetainage({
      subcontractorName: workOrder.subcontractor_name,
      workOrderValue: Number(workOrder.work_order_value),
      retainagePct: Number(workOrder.retainage_pct),
      amountCertified: newAmountCertified,
      amountReleased: Number(workOrder.amount_released),
    });

    const thisPayment = validated.amount_to_certify * (1 - Number(workOrder.retainage_pct) / 100);

    const updated = await db.subcontractor_work_orders.update({
      where: { id: workOrderId },
      data: {
        amount_certified: newAmountCertified,
        retainage_deducted: retainage.totalRetainageDeducted,
        net_paid: { increment: thisPayment },
        completion_pct: Math.min(
          100,
          (newAmountCertified / Number(workOrder.work_order_value)) * 100
        ),
        ...(newAmountCertified >= Number(workOrder.work_order_value) &&
          !workOrder.dlp_start_date && {
            dlp_status: 'DLP_ACTIVE',
            dlp_start_date: new Date(),
            dlp_end_date: new Date(
              Date.now() + workOrder.dlp_months * 30 * 24 * 60 * 60 * 1000
            ),
          }),
        updated_at: new Date(),
      },
    });

    revalidatePath(`/business/projects/${workOrder.project_id}`);
    return {
      success: true,
      workOrder: serializeDecimalsDeep(updated),
      retainage: serializeDecimalsDeep(retainage),
    };
  } catch (err) {
    console.error('[certifySubcontractorWorkAction]', err);
    return { success: false, error: err.message || 'Failed to certify work' };
  }
}

// ── Release Retainage ─────────────────────────────────────────────────────────

export async function releaseSubcontractorRetainageAction(
  businessId,
  workOrderId,
  releaseAmount,
  notes = ''
) {
  await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const workOrder = await db.subcontractor_work_orders.findFirst({
      where: { id: workOrderId, business_id: businessId },
    });
    if (!workOrder) return { success: false, error: 'Work order not found' };

    const currentRetainageBalance =
      Number(workOrder.retainage_deducted) - Number(workOrder.amount_released);
    if (releaseAmount > currentRetainageBalance) {
      return {
        success: false,
        error: `Cannot release more than the balance: PKR ${currentRetainageBalance.toLocaleString()}`,
      };
    }

    const updated = await db.subcontractor_work_orders.update({
      where: { id: workOrderId },
      data: {
        amount_released: { increment: releaseAmount },
        net_paid: { increment: releaseAmount },
        ...(Number(workOrder.amount_released) + releaseAmount >=
          Number(workOrder.retainage_deducted) && { dlp_status: 'RELEASED' }),
        updated_at: new Date(),
      },
    });

    revalidatePath(`/business/projects/${workOrder.project_id}`);
    return { success: true, workOrder: serializeDecimalsDeep(updated) };
  } catch (err) {
    console.error('[releaseSubcontractorRetainageAction]', err);
    return { success: false, error: err.message || 'Failed to release retainage' };
  }
}

// ── Update Work Order Status ──────────────────────────────────────────────────

export async function updateSubcontractorWorkOrderStatusAction(businessId, workOrderId, status) {
  await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const validStatuses = ['ACTIVE', 'COMPLETED', 'TERMINATED', 'SUSPENDED'];
    if (!validStatuses.includes(status)) return { success: false, error: 'Invalid status' };

    const workOrder = await db.subcontractor_work_orders.findFirst({
      where: { id: workOrderId, business_id: businessId },
    });
    if (!workOrder) return { success: false, error: 'Work order not found' };

    const updated = await db.subcontractor_work_orders.update({
      where: { id: workOrderId },
      data: { status, updated_at: new Date() },
    });

    revalidatePath(`/business/projects/${workOrder.project_id}`);
    return { success: true, workOrder: serializeDecimalsDeep(updated) };
  } catch (err) {
    console.error('[updateSubcontractorWorkOrderStatusAction]', err);
    return { success: false, error: err.message || 'Failed to update work order status' };
  }
}

// ── Get Retainage Ledger Summary ──────────────────────────────────────────────

export async function getSubcontractorRetainageLedgerAction(businessId, projectId) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const project = await db.construction_projects.findFirst({
      where: { id: projectId, business_id: businessId },
    });
    if (!project) return { success: false, error: 'Project not found' };

    const workOrders = await db.subcontractor_work_orders.findMany({
      where: { project_id: projectId, business_id: businessId },
      orderBy: { work_order_date: 'asc' },
    });

    const ledger = workOrders.map((wo) => {
      const retainage = computeSubcontractorRetainage({
        subcontractorName: wo.subcontractor_name,
        workOrderValue: Number(wo.work_order_value),
        retainagePct: Number(wo.retainage_pct),
        amountCertified: Number(wo.amount_certified),
        amountReleased: Number(wo.amount_released),
      });
      return { ...serializeDecimalsDeep(wo), retainageSummary: retainage };
    });

    const totals = {
      totalWorkOrderValue: workOrders.reduce((s, wo) => s + Number(wo.work_order_value), 0),
      totalCertified: workOrders.reduce((s, wo) => s + Number(wo.amount_certified), 0),
      totalRetainageDeducted: workOrders.reduce(
        (s, wo) => s + Number(wo.retainage_deducted),
        0
      ),
      totalRetainageReleased: workOrders.reduce((s, wo) => s + Number(wo.amount_released), 0),
      totalNetPaid: workOrders.reduce((s, wo) => s + Number(wo.net_paid), 0),
    };
    totals.retainageBalance = totals.totalRetainageDeducted - totals.totalRetainageReleased;

    return { success: true, ledger, totals: serializeDecimalsDeep(totals) };
  } catch (err) {
    console.error('[getSubcontractorRetainageLedgerAction]', err);
    return { success: false, error: err.message || 'Failed to fetch retainage ledger' };
  }
}
