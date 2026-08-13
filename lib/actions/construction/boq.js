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

export const addBOQItemAction = withGuard(
  async ({ businessId, userId }, data) => {
    const validated = createBOQItemSchema.parse(data);

    // Verify project belongs to business
    const project = await db.construction_projects.findFirst({
      where: {
        id: validated.project_id,
        business_id: businessId,
      },
    });

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    // Check for duplicate item_no
    const existing = await db.bill_of_quantities_items.findFirst({
      where: {
        project_id: validated.project_id,
        item_no: validated.item_no,
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'BOQ item number already exists in this project',
      };
    }

    // Validate ratios sum to <= 1.0
    const ratioSum =
      validated.material_cost_ratio +
      validated.labor_cost_ratio +
      validated.machinery_cost_ratio +
      validated.overhead_ratio;

    if (ratioSum > 1.0) {
      return {
        success: false,
        error: 'Cost ratios sum cannot exceed 100%',
      };
    }

    // Create BOQ item
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

    return {
      success: true,
      boqItem: serializeDecimalsDeep(boqItem),
    };
  },
  {
    requiredFeature: 'boq_tracking',
    requiredRole: ['owner', 'admin', 'manager'],
  }
);

// ============================================================================
// Get BOQ Items for Project
// ============================================================================

export const getBOQItemsAction = withGuard(
  async ({ businessId }, projectId) => {
    // Verify project belongs to business
    const project = await db.construction_projects.findFirst({
      where: {
        id: projectId,
        business_id: businessId,
      },
    });

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    const boqItems = await db.bill_of_quantities_items.findMany({
      where: {
        project_id: projectId,
      },
      orderBy: { item_no: 'asc' },
    });

    return {
      success: true,
      boqItems: serializeDecimalsDeep(boqItems),
    };
  },
  {
    requiredFeature: 'boq_tracking',
  }
);

// ============================================================================
// Update BOQ Item
// ============================================================================

export const updateBOQItemAction = withGuard(
  async ({ businessId }, itemId, data) => {
    const validated = updateBOQItemSchema.parse(data);

    // Verify item belongs to business project
    const existing = await db.bill_of_quantities_items.findFirst({
      where: {
        id: itemId,
        business_id: businessId,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: 'BOQ item not found',
      };
    }

    // If updating ratios, validate sum
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
        return {
          success: false,
          error: 'Cost ratios sum cannot exceed 100%',
        };
      }
    }

    const boqItem = await db.bill_of_quantities_items.update({
      where: { id: itemId },
      data: {
        ...validated,
        updated_at: new Date(),
      },
    });

    revalidatePath(`/business/projects/${existing.project_id}`);

    return {
      success: true,
      boqItem: serializeDecimalsDeep(boqItem),
    };
  },
  {
    requiredFeature: 'boq_tracking',
    requiredRole: ['owner', 'admin', 'manager'],
  }
);

// ============================================================================
// Delete BOQ Item
// ============================================================================

export const deleteBOQItemAction = withGuard(
  async ({ businessId }, itemId) => {
    // Verify item belongs to business project
    const existing = await db.bill_of_quantities_items.findFirst({
      where: {
        id: itemId,
        business_id: businessId,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: 'BOQ item not found',
      };
    }

    await db.bill_of_quantities_items.delete({
      where: { id: itemId },
    });

    revalidatePath(`/business/projects/${existing.project_id}`);

    return {
      success: true,
      message: 'BOQ item deleted successfully',
    };
  },
  {
    requiredFeature: 'boq_tracking',
    requiredRole: ['owner', 'admin'],
  }
);

// ============================================================================
// Analyze BOQ Variance
// ============================================================================

export const analyzeBOQVarianceAction = withGuard(
  async ({ businessId }, projectId) => {
    // Verify project belongs to business
    const project = await db.construction_projects.findFirst({
      where: {
        id: projectId,
        business_id: businessId,
      },
    });

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    // Get all BOQ items
    const boqItems = await db.bill_of_quantities_items.findMany({
      where: {
        project_id: projectId,
      },
      orderBy: { item_no: 'asc' },
    });

    // Transform to format expected by analyzeBOQVariance
    const items = boqItems.map((item) => ({
      id: item.id,
      description: item.description,
      unit: item.unit,
      estimatedQty: Number(item.estimated_qty),
      estimatedRate: Number(item.estimated_rate),
      actualQty: Number(item.actual_qty),
      actualRate: Number(item.actual_rate || item.estimated_rate),
    }));

    // Analyze variance using intelligence helper
    const analysis = analyzeBOQVariance(items);

    return {
      success: true,
      analysis: serializeDecimalsDeep(analysis),
    };
  },
  {
    requiredFeature: 'boq_tracking',
  }
);

// ============================================================================
// Bulk Import BOQ Items
// ============================================================================

export const bulkImportBOQItemsAction = withGuard(
  async ({ businessId, userId }, projectId, items) => {
    // Verify project belongs to business
    const project = await db.construction_projects.findFirst({
      where: {
        id: projectId,
        business_id: businessId,
      },
    });

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    // Validate all items
    const validated = items.map((item) => createBOQItemSchema.parse({ ...item, project_id: projectId }));

    // Check for duplicate item numbers
    const itemNos = validated.map((v) => v.item_no);
    const duplicates = itemNos.filter((item, index) => itemNos.indexOf(item) !== index);

    if (duplicates.length > 0) {
      return {
        success: false,
        error: `Duplicate item numbers found: ${duplicates.join(', ')}`,
      };
    }

    // Create all items in transaction
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
  },
  {
    requiredFeature: 'boq_tracking',
    requiredRole: ['owner', 'admin', 'manager'],
  }
);
