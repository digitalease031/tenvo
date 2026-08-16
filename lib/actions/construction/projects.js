'use server';

/**
 * Construction Projects Server Actions
 * Handles CRUD operations for construction projects with PEC/PPRA compliance
 */

import { db } from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';

// ============================================================================
// Validation Schemas (module-level, not exported — 'use server' safe)
// ============================================================================

const createProjectSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  client_name: z.string().min(1).max(255),
  client_contact: z.string().max(100).optional(),
  contractor_category: z.enum(['C-A', 'C-B', 'C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6']).default('C-1'),
  contract_value: z.number().min(0),
  commencement_date: z.string(),
  completion_date: z.string(),
  province_code: z.enum(['PK-PB', 'PK-SD', 'PK-KP', 'PK-BA']).default('PK-PB'),
  is_government_project: z.boolean().default(false),
  pec_project_no: z.string().max(100).optional(),
  ppra_reference: z.string().max(100).optional(),
  employer_dept: z.string().max(255).optional(),
  mobilization_adv_pct: z.number().min(0).max(100).default(10),
  retention_pct: z.number().min(0).max(100).default(5),
  notes: z.string().optional(),
  domain_data: z.record(z.any()).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  client_name: z.string().min(1).max(255).optional(),
  client_contact: z.string().max(100).optional(),
  contractor_category: z.enum(['C-A', 'C-B', 'C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6']).optional(),
  contract_value: z.number().min(0).optional(),
  commencement_date: z.string().optional(),
  completion_date: z.string().optional(),
  province_code: z.enum(['PK-PB', 'PK-SD', 'PK-KP', 'PK-BA']).optional(),
  is_government_project: z.boolean().optional(),
  pec_project_no: z.string().max(100).optional(),
  ppra_reference: z.string().max(100).optional(),
  employer_dept: z.string().max(255).optional(),
  mobilization_adv_pct: z.number().min(0).max(100).optional(),
  retention_pct: z.number().min(0).max(100).optional(),
  status: z.enum(['BIDDING', 'ACTIVE', 'DLP', 'CLOSED', 'CANCELLED']).optional(),
  completion_pct: z.number().min(0).max(100).optional(),
  cumulative_certified: z.number().min(0).optional(),
  cumulative_paid: z.number().min(0).optional(),
  retention_held: z.number().min(0).optional(),
  mobilization_recovered: z.number().min(0).optional(),
  notes: z.string().optional(),
  domain_data: z.record(z.any()).optional(),
});

// ============================================================================
// Create Project
// ============================================================================

export async function createProjectAction(businessId, data) {
  const { session, userId } = await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const today = new Date().toISOString().slice(0, 10);
    const oneYearLater = new Date(Date.now() + 365 * 86400 * 1000).toISOString().slice(0, 10);

    const normalizedData = {
      code: String(data.code || `PRJ-${Date.now().toString().slice(-4)}`).trim(),
      name: String(data.name || 'New Project').trim(),
      client_name: String(data.client_name || 'Client').trim(),
      client_contact: data.client_contact ? String(data.client_contact) : undefined,
      contractor_category: data.contractor_category || 'C-1',
      contract_value: Number(data.contract_value ?? 0),
      commencement_date: data.commencement_date ? String(data.commencement_date) : today,
      completion_date: data.completion_date ? String(data.completion_date) : oneYearLater,
      province_code: data.province_code || 'PK-PB',
      is_government_project: Boolean(data.is_government_project),
      pec_project_no: data.pec_project_no ? String(data.pec_project_no) : undefined,
      ppra_reference: data.ppra_reference ? String(data.ppra_reference) : undefined,
      employer_dept: data.employer_dept ? String(data.employer_dept) : undefined,
      mobilization_adv_pct: Number(data.mobilization_adv_pct ?? 10),
      retention_pct: Number(data.retention_pct ?? 5),
      notes: data.notes ? String(data.notes) : undefined,
      domain_data: data.domain_data || {},
    };

    const validated = createProjectSchema.parse(normalizedData);

    const existing = await db.construction_projects.findFirst({
      where: { business_id: businessId, code: validated.code },
    });

    if (existing) {
      return { success: false, error: 'A project with this code already exists' };
    }

    const project = await db.construction_projects.create({
      data: {
        business_id: businessId,
        code: validated.code,
        name: validated.name,
        client_name: validated.client_name,
        client_contact: validated.client_contact,
        contractor_category: validated.contractor_category,
        contract_value: validated.contract_value,
        commencement_date: new Date(validated.commencement_date),
        completion_date: new Date(validated.completion_date),
        province_code: validated.province_code,
        is_government_project: validated.is_government_project,
        pec_project_no: validated.pec_project_no,
        ppra_reference: validated.ppra_reference,
        employer_dept: validated.employer_dept,
        mobilization_adv_pct: validated.mobilization_adv_pct,
        retention_pct: validated.retention_pct,
        notes: validated.notes,
        domain_data: validated.domain_data || {},
        created_by: session?.user?.id,
      },
    });

    revalidatePath('/business/projects');

    return { success: true, project: serializeDecimalsDeep(project) };
  } catch (err) {
    console.error('[createProjectAction]', err);
    return { success: false, error: err.message || 'Failed to create project' };
  }
}

// ============================================================================
// Get Projects (List)
// ============================================================================

export async function getProjectsAction(businessId, options = {}) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const {
      status,
      search,
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    const where = {
      business_id: businessId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { client_name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      db.construction_projects.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              boq_items: true,
              ipcs: true,
              machinery_logs: true,
              subcontractor_orders: true,
            },
          },
        },
      }),
      db.construction_projects.count({ where }),
    ]);

    return {
      success: true,
      projects: serializeDecimalsDeep(projects),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    };
  } catch (err) {
    console.error('[getProjectsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch projects' };
  }
}

// ============================================================================
// Get Project Detail
// ============================================================================

export async function getProjectDetailAction(businessId, projectId) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const project = await db.construction_projects.findFirst({
      where: { id: projectId, business_id: businessId },
      include: {
        boq_items: { orderBy: { item_no: 'asc' } },
        ipcs: { orderBy: { ipc_number: 'asc' } },
        machinery_logs: { orderBy: { log_date: 'desc' }, take: 20 },
        subcontractor_orders: true,
      },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    return { success: true, project: serializeDecimalsDeep(project) };
  } catch (err) {
    console.error('[getProjectDetailAction]', err);
    return { success: false, error: err.message || 'Failed to fetch project' };
  }
}

// ============================================================================
// Update Project
// ============================================================================

export async function updateProjectAction(businessId, projectId, data) {
  await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const validated = updateProjectSchema.parse(data);

    const existing = await db.construction_projects.findFirst({
      where: { id: projectId, business_id: businessId },
    });

    if (!existing) {
      return { success: false, error: 'Project not found' };
    }

    const updateData = { ...validated };
    if (validated.commencement_date) {
      updateData.commencement_date = new Date(validated.commencement_date);
    }
    if (validated.completion_date) {
      updateData.completion_date = new Date(validated.completion_date);
    }

    const project = await db.construction_projects.update({
      where: { id: projectId },
      data: { ...updateData, updated_at: new Date() },
    });

    revalidatePath('/business/projects');
    revalidatePath(`/business/projects/${projectId}`);

    return { success: true, project: serializeDecimalsDeep(project) };
  } catch (err) {
    console.error('[updateProjectAction]', err);
    return { success: false, error: err.message || 'Failed to update project' };
  }
}

// ============================================================================
// Delete Project
// ============================================================================

export async function deleteProjectAction(businessId, projectId) {
  await withGuard(businessId, {
    permission: 'inventory.manage',
    feature: 'project_costing',
  });

  try {
    const existing = await db.construction_projects.findFirst({
      where: { id: projectId, business_id: businessId },
    });

    if (!existing) {
      return { success: false, error: 'Project not found' };
    }

    if (existing.status === 'ACTIVE') {
      return { success: false, error: 'Cannot delete an active project. Change status first.' };
    }

    await db.construction_projects.delete({ where: { id: projectId } });

    revalidatePath('/business/projects');

    return { success: true, message: 'Project deleted successfully' };
  } catch (err) {
    console.error('[deleteProjectAction]', err);
    return { success: false, error: err.message || 'Failed to delete project' };
  }
}

// ============================================================================
// Get Projects Summary (for dashboard)
// ============================================================================

export async function getProjectsSummaryAction(businessId) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const projects = await db.construction_projects.findMany({
      where: { business_id: businessId },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        contract_value: true,
        cumulative_certified: true,
        cumulative_paid: true,
        retention_held: true,
        completion_pct: true,
        commencement_date: true,
        completion_date: true,
        client_name: true,
        province_code: true,
        contractor_category: true,
        _count: {
          select: {
            boq_items: true,
            ipcs: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const summary = {
      total: projects.length,
      active: projects.filter((p) => p.status === 'ACTIVE').length,
      bidding: projects.filter((p) => p.status === 'BIDDING').length,
      dlp: projects.filter((p) => p.status === 'DLP').length,
      closed: projects.filter((p) => p.status === 'CLOSED').length,
      totalContractValue: projects.reduce((sum, p) => sum + Number(p.contract_value || 0), 0),
      totalCertified: projects.reduce((sum, p) => sum + Number(p.cumulative_certified || 0), 0),
      totalPaid: projects.reduce((sum, p) => sum + Number(p.cumulative_paid || 0), 0),
      totalRetention: projects.reduce((sum, p) => sum + Number(p.retention_held || 0), 0),
    };

    return {
      success: true,
      projects: serializeDecimalsDeep(projects),
      summary: serializeDecimalsDeep(summary),
    };
  } catch (err) {
    console.error('[getProjectsSummaryAction]', err);
    return { success: false, error: err.message || 'Failed to fetch projects summary' };
  }
}
