'use server';

/**
 * Bill of Quantities (BOQ) Server Actions
 * Handles BOQ line items with MRS/CSR schedule codes and variance analysis
 */

import { db } from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { analyzeBOQVariance } from '@/lib/construction/constructionIntelligence';

// ============================================================================
// Validation Schemas
// ============================================================================

const createBOQItemSchema = z.object({
  project_id: z.string().uuid(),
  item_no: z.string().min(1).max(50),
  description: z.string().min(1),
  unit: z.string().min(1).max(20),
  estimated_qty: z.number().min(0),
  estimated_rate: z.number().min(0),
  actual_qty: z.number().min(0).optional(),
  actual_rate: z.number().min(0).optional(),
  schedule_code: z.string().max(50).optional(),
  sor_reference: z.string().max(100).optional(),
  material_cost_ratio: z.number().min(0).max(1).default(0.6),
  labor_cost_ratio: z.number().min(0).max(1).default(0.25),
  machinery_cost_ratio: z.number().min(0).max(1).default(0.1),
  overhead_ratio: z.number().min(0).max(1).default(0.05),
  location_station: z.string().max(255).optional(),
  work_phase: z.string().max(100).optional(),
  specification_grade: z.string().optional(),
  notes: z.string().optional(),
  domain_data: z.record(z.any()).optional(),
});

const updateBOQItemSchema = createBOQItemSchema.partial().omit({ project_id: true });

// ============================================================================
// Create BOQ Item
// ============================================================================

export async function addBOQItemAction(businessId, data) {
  await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const normalizedData = {
      project_id: data.project_id,
      item_no: String(data.item_no || `BOQ-${Date.now().toString().slice(-4)}`).trim(),
      description: String(data.description || 'BOQ Work Item').trim(),
      unit: String(data.unit || 'Cu.M').trim(),
      estimated_qty: Number(data.estimated_qty ?? 0),
      estimated_rate: Number(data.estimated_rate ?? 0),
      actual_qty: Number(data.actual_qty ?? 0),
      actual_rate: data.actual_rate ? Number(data.actual_rate) : undefined,
      schedule_code: data.schedule_code ? String(data.schedule_code) : undefined,
      sor_reference: data.sor_reference ? String(data.sor_reference) : undefined,
      material_cost_ratio: Number(data.material_cost_ratio ?? 0.6),
      labor_cost_ratio: Number(data.labor_cost_ratio ?? 0.25),
      machinery_cost_ratio: Number(data.machinery_cost_ratio ?? 0.1),
      overhead_ratio: Number(data.overhead_ratio ?? 0.05),
      location_station: data.location_station ? String(data.location_station) : undefined,
      work_phase: data.work_phase ? String(data.work_phase) : undefined,
      specification_grade: data.specification_grade ? String(data.specification_grade) : undefined,
      notes: data.notes ? String(data.notes) : undefined,
      domain_data: data.domain_data || {},
    };

    const validated = createBOQItemSchema.parse(normalizedData);

    const project = await db.construction_projects.findFirst({
      where: { id: validated.project_id, business_id: businessId },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const existing = await db.bill_of_quantities_items.findFirst({
      where: { project_id: validated.project_id, item_no: validated.item_no },
    });

    if (existing) {
      return { success: false, error: 'BOQ item number already exists in this project' };
    }

    const ratioSum =
      validated.material_cost_ratio +
      validated.labor_cost_ratio +
      validated.machinery_cost_ratio +
      validated.overhead_ratio;

    if (ratioSum > 1.0) {
      return { success: false, error: 'Cost ratios sum cannot exceed 100%' };
    }

    const boqItem = await db.bill_of_quantities_items.create({
      data: {
        business_id: businessId,
        project_id: validated.project_id,
        item_no: validated.item_no,
        description: validated.description,
        unit: validated.unit,
        estimated_qty: validated.estimated_qty,
        estimated_rate: validated.estimated_rate,
        actual_qty: validated.actual_qty || 0,
        actual_rate: validated.actual_rate,
        schedule_code: validated.schedule_code,
        sor_reference: validated.sor_reference,
        material_cost_ratio: validated.material_cost_ratio,
        labor_cost_ratio: validated.labor_cost_ratio,
        machinery_cost_ratio: validated.machinery_cost_ratio,
        overhead_ratio: validated.overhead_ratio,
        location_station: validated.location_station,
        work_phase: validated.work_phase,
        specification_grade: validated.specification_grade,
        notes: validated.notes,
        domain_data: validated.domain_data || {},
      },
    });

    revalidatePath(`/business/projects/${validated.project_id}`);

    return { success: true, boqItem: serializeDecimalsDeep(boqItem) };
  } catch (err) {
    console.error('[addBOQItemAction]', err);
    return { success: false, error: err.message || 'Failed to add BOQ item' };
  }
}

// ============================================================================
// Get BOQ Items for Project
// ============================================================================

export async function getBOQItemsAction(businessId, projectId) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const project = await db.construction_projects.findFirst({
      where: { id: projectId, business_id: businessId },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const boqItems = await db.bill_of_quantities_items.findMany({
      where: { project_id: projectId },
      orderBy: { item_no: 'asc' },
    });

    return { success: true, boqItems: serializeDecimalsDeep(boqItems) };
  } catch (err) {
    console.error('[getBOQItemsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch BOQ items' };
  }
}

// ============================================================================
// Update BOQ Item
// ============================================================================

export async function updateBOQItemAction(businessId, itemId, data) {
  await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const validated = updateBOQItemSchema.parse(data);

    const existing = await db.bill_of_quantities_items.findFirst({
      where: { id: itemId, business_id: businessId },
    });

    if (!existing) {
      return { success: false, error: 'BOQ item not found' };
    }

    if (
      validated.material_cost_ratio !== undefined ||
      validated.labor_cost_ratio !== undefined ||
      validated.machinery_cost_ratio !== undefined ||
      validated.overhead_ratio !== undefined
    ) {
      const ratioSum =
        (validated.material_cost_ratio ?? Number(existing.material_cost_ratio)) +
        (validated.labor_cost_ratio ?? Number(existing.labor_cost_ratio)) +
        (validated.machinery_cost_ratio ?? Number(existing.machinery_cost_ratio)) +
        (validated.overhead_ratio ?? Number(existing.overhead_ratio));

      if (ratioSum > 1.0) {
        return { success: false, error: 'Cost ratios sum cannot exceed 100%' };
      }
    }

    const boqItem = await db.bill_of_quantities_items.update({
      where: { id: itemId },
      data: { ...validated, updated_at: new Date() },
    });

    revalidatePath(`/business/projects/${existing.project_id}`);

    return { success: true, boqItem: serializeDecimalsDeep(boqItem) };
  } catch (err) {
    console.error('[updateBOQItemAction]', err);
    return { success: false, error: err.message || 'Failed to update BOQ item' };
  }
}

// ============================================================================
// Delete BOQ Item
// ============================================================================

export async function deleteBOQItemAction(businessId, itemId) {
  await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const existing = await db.bill_of_quantities_items.findFirst({
      where: { id: itemId, business_id: businessId },
    });

    if (!existing) {
      return { success: false, error: 'BOQ item not found' };
    }

    await db.bill_of_quantities_items.delete({ where: { id: itemId } });

    revalidatePath(`/business/projects/${existing.project_id}`);

    return { success: true, message: 'BOQ item deleted successfully' };
  } catch (err) {
    console.error('[deleteBOQItemAction]', err);
    return { success: false, error: err.message || 'Failed to delete BOQ item' };
  }
}

// ============================================================================
// Analyze BOQ Variance
// ============================================================================

export async function analyzeBOQVarianceAction(businessId, projectId) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const project = await db.construction_projects.findFirst({
      where: { id: projectId, business_id: businessId },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const boqItems = await db.bill_of_quantities_items.findMany({
      where: { project_id: projectId },
      orderBy: { item_no: 'asc' },
    });

    const items = boqItems.map((item) => ({
      id: item.id,
      description: item.description,
      unit: item.unit,
      estimatedQty: Number(item.estimated_qty),
      estimatedRate: Number(item.estimated_rate),
      actualQty: Number(item.actual_qty),
      actualRate: Number(item.actual_rate || item.estimated_rate),
    }));

    const analysis = analyzeBOQVariance(items);

    return { success: true, analysis: serializeDecimalsDeep(analysis) };
  } catch (err) {
    console.error('[analyzeBOQVarianceAction]', err);
    return { success: false, error: err.message || 'Failed to analyze BOQ variance' };
  }
}

// ============================================================================
// Bulk Import BOQ Items
// ============================================================================

export async function bulkImportBOQItemsAction(businessId, projectId, items) {
  await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const project = await db.construction_projects.findFirst({
      where: { id: projectId, business_id: businessId },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const validated = items.map((item) =>
      createBOQItemSchema.parse({ ...item, project_id: projectId })
    );

    const itemNos = validated.map((v) => v.item_no);
    const duplicates = itemNos.filter((item, index) => itemNos.indexOf(item) !== index);

    if (duplicates.length > 0) {
      return {
        success: false,
        error: `Duplicate item numbers found: ${duplicates.join(', ')}`,
      };
    }

    const created = await db.$transaction(
      validated.map((item) =>
        db.bill_of_quantities_items.create({
          data: {
            business_id: businessId,
            project_id: projectId,
            ...item,
            domain_data: item.domain_data || {},
          },
        })
      )
    );

    revalidatePath(`/business/projects/${projectId}`);

    return {
      success: true,
      count: created.length,
      boqItems: serializeDecimalsDeep(created),
    };
  } catch (err) {
    console.error('[bulkImportBOQItemsAction]', err);
    return { success: false, error: err.message || 'Failed to import BOQ items' };
  }
}
