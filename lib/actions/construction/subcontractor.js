'use server';

/**
 * Subcontractor Work Order Server Actions
 * Handles work orders, running accounts, retainage, and DLP management.
 */

import { db } from '@/lib/db';
import { withGuard } from '@/lib/auth/withGuard';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { computeSubcontractorRetainage } from '@/lib/construction/constructionIntelligence';

// ── Schemas ───────────────────────────────────────────────────────────────────

const createWorkOrderSchema = z.object({
  project_id: z.string().uuid(),
  vendor_id: z.string().uuid().optional(),
  work_order_no: z.string().min(1).max(50),
  work_order_date: z.string(), // YYYY-MM-DD
  subcontractor_name: z.string().min(1),
  subcontractor_category: z.enum(['C-1','C-2','C-3','C-4','C-5','C-6','Labour','Specialist']).optional(),
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

export const createSubcontractorWorkOrderAction = withGuard(
  async ({ businessId, userId }, data) => {
    const validated = createWorkOrderSchema.parse(data);

    // Verify project belongs to business
    const project = await db.construction_projects.findFirst({
      where: { id: validated.project_id, business_id: businessId },
    });
    if (!project) return { success: false, error: 'Project not found' };

    // Duplicate work order check
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
        created_by: userId,
      },
    });

    revalidatePath(`/business/projects/${validated.project_id}`);
    return { success: true, workOrder: serializeDecimalsDeep(workOrder) };
  },
  { requiredFeature: 'subcontractor_ledger', requiredRole: ['owner', 'admin', 'manager'] }
);

// ── Get Work Orders ───────────────────────────────────────────────────────────

export const getSubcontractorWorkOrdersAction = withGuard(
  async ({ businessId }, { projectId, status, limit = 50 } = {}) => {
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
  },
  { requiredFeature: 'subcontractor_ledger' }
);

// ── Certify Work (Record Running Account Payment) ────────────────────────────

export const certifySubcontractorWorkAction = withGuard(
  async ({ businessId, userId }, workOrderId, data) => {
    const validated = certifyWorkOrderSchema.parse(data);

    const workOrder = await db.subcontractor_work_orders.findFirst({
      where: { id: workOrderId, business_id: businessId },
    });
    if (!workOrder) return { success: false, error: 'Work order not found' };
    if (workOrder.status === 'TERMINATED') return { success: false, error: 'Cannot certify a terminated work order' };

    // Calculate retainage
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
        completion_pct: Math.min(100, (newAmountCertified / Number(workOrder.work_order_value)) * 100),
        // Auto-set DLP when complete
        ...(newAmountCertified >= Number(workOrder.work_order_value) && !workOrder.dlp_start_date && {
          dlp_status: 'DLP_ACTIVE',
          dlp_start_date: new Date(),
          dlp_end_date: new Date(Date.now() + workOrder.dlp_months * 30 * 24 * 60 * 60 * 1000),
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
  },
  { requiredFeature: 'subcontractor_ledger', requiredRole: ['owner', 'admin', 'manager'] }
);

// ── Release Retainage ─────────────────────────────────────────────────────────

export const releaseSubcontractorRetainageAction = withGuard(
  async ({ businessId, userId }, workOrderId, releaseAmount, notes = '') => {
    const workOrder = await db.subcontractor_work_orders.findFirst({
      where: { id: workOrderId, business_id: businessId },
    });
    if (!workOrder) return { success: false, error: 'Work order not found' };

    const currentRetainageBalance = Number(workOrder.retainage_deducted) - Number(workOrder.amount_released);
    if (releaseAmount > currentRetainageBalance) {
      return { success: false, error: `Cannot release more than the balance: PKR ${currentRetainageBalance.toLocaleString()}` };
    }

    const updated = await db.subcontractor_work_orders.update({
      where: { id: workOrderId },
      data: {
        amount_released: { increment: releaseAmount },
        net_paid: { increment: releaseAmount },
        ...(Number(workOrder.amount_released) + releaseAmount >= Number(workOrder.retainage_deducted) && {
          dlp_status: 'RELEASED',
        }),
        updated_at: new Date(),
      },
    });

    revalidatePath(`/business/projects/${workOrder.project_id}`);
    return { success: true, workOrder: serializeDecimalsDeep(updated) };
  },
  { requiredFeature: 'subcontractor_ledger', requiredRole: ['owner', 'admin'] }
);

// ── Update Work Order Status ──────────────────────────────────────────────────

export const updateSubcontractorWorkOrderStatusAction = withGuard(
  async ({ businessId }, workOrderId, status) => {
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
  },
  { requiredFeature: 'subcontractor_ledger', requiredRole: ['owner', 'admin', 'manager'] }
);

// ── Get Retainage Ledger Summary ──────────────────────────────────────────────

export const getSubcontractorRetainageLedgerAction = withGuard(
  async ({ businessId }, projectId) => {
    const project = await db.construction_projects.findFirst({
      where: { id: projectId, business_id: businessId },
    });
    if (!project) return { success: false, error: 'Project not found' };

    const workOrders = await db.subcontractor_work_orders.findMany({
      where: { project_id: projectId, business_id: businessId },
      orderBy: { work_order_date: 'asc' },
    });

    const ledger = workOrders.map(wo => {
      const retainage = computeSubcontractorRetainage({
        subcontractorName: wo.subcontractor_name,
        workOrderValue: Number(wo.work_order_value),
        retainagePct: Number(wo.retainage_pct),
        amountCertified: Number(wo.amount_certified),
        amountReleased: Number(wo.amount_released),
      });
      return {
        ...serializeDecimalsDeep(wo),
        retainageSummary: retainage,
      };
    });

    const totals = {
      totalWorkOrderValue: workOrders.reduce((s, wo) => s + Number(wo.work_order_value), 0),
      totalCertified: workOrders.reduce((s, wo) => s + Number(wo.amount_certified), 0),
      totalRetainageDeducted: workOrders.reduce((s, wo) => s + Number(wo.retainage_deducted), 0),
      totalRetainageReleased: workOrders.reduce((s, wo) => s + Number(wo.amount_released), 0),
      totalNetPaid: workOrders.reduce((s, wo) => s + Number(wo.net_paid), 0),
    };
    totals.retainageBalance = totals.totalRetainageDeducted - totals.totalRetainageReleased;

    return { success: true, ledger, totals: serializeDecimalsDeep(totals) };
  },
  { requiredFeature: 'subcontractor_ledger' }
);
