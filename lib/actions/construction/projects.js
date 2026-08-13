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
// Validation Schemas
// ============================================================================

const createProjectSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  client_name: z.string().min(1).max(255),
  client_contact: z.string().max(100).optional(),
  contractor_category: z.enum(['C-A', 'C-B', 'C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6']).default('C-1'),
  contract_value: z.number().min(0),
  commencement_date: z.string(), // ISO date
  completion_date: z.string(), // ISO date
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

export const createProjectAction = withGuard(
  async ({ businessId, userId, session, membership }, data) => {
    // Validate input
    const validated = createProjectSchema.parse(data);

    // Check for duplicate code
    const existing = await db.construction_projects.findFirst({
      where: {
        business_id: businessId,
        code: validated.code,
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'A project with this code already exists',
      };
    }

    // Create project
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
        created_by: userId,
      },
    });

    revalidatePath('/business/projects');

    return {
      success: true,
      project: serializeDecimalsDeep(project),
    };
  },
  {
    requiredFeature: 'project_costing',
    requiredRole: ['owner', 'admin', 'manager'],
  }
);

// ============================================================================
// Get Projects (List)
// ============================================================================

export const getProjectsAction = withGuard(
  async ({ businessId }, options = {}) => {
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
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  },
  {
    requiredFeature: 'project_costing',
  }
);

// ============================================================================
// Get Project Detail
// ============================================================================

export const getProjectDetailAction = withGuard(
  async ({ businessId }, projectId) => {
    const project = await db.construction_projects.findFirst({
      where: {
        id: projectId,
        business_id: businessId,
      },
      include: {
        boq_items: {
          orderBy: { item_no: 'asc' },
        },
        ipcs: {
          orderBy: { ipc_number: 'asc' },
        },
        _count: {
          select: {
            machinery_logs: true,
            subcontractor_orders: true,
          },
        },
      },
    });

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    return {
      success: true,
      project: serializeDecimalsDeep(project),
    };
  },
  {
    requiredFeature: 'project_costing',
  }
);

// ============================================================================
// Update Project
// ============================================================================

export const updateProjectAction = withGuard(
  async ({ businessId, userId }, projectId, data) => {
    // Validate input
    const validated = updateProjectSchema.parse(data);

    // Verify project belongs to business
    const existing = await db.construction_projects.findFirst({
      where: {
        id: projectId,
        business_id: businessId,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    // Update project
    const updateData = {
      ...validated,
      ...(validated.commencement_date && {
        commencement_date: new Date(validated.commencement_date),
      }),
      ...(validated.completion_date && {
        completion_date: new Date(validated.completion_date),
      }),
      updated_at: new Date(),
    };

    const project = await db.construction_projects.update({
      where: { id: projectId },
      data: updateData,
    });

    revalidatePath('/business/projects');
    revalidatePath(`/business/projects/${projectId}`);

    return {
      success: true,
      project: serializeDecimalsDeep(project),
    };
  },
  {
    requiredFeature: 'project_costing',
    requiredRole: ['owner', 'admin', 'manager'],
  }
);

// ============================================================================
// Delete Project
// ============================================================================

export const deleteProjectAction = withGuard(
  async ({ businessId }, projectId) => {
    // Verify project belongs to business
    const existing = await db.construction_projects.findFirst({
      where: {
        id: projectId,
        business_id: businessId,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    // Delete project (cascade will handle related records)
    await db.construction_projects.delete({
      where: { id: projectId },
    });

    revalidatePath('/business/projects');

    return {
      success: true,
      message: 'Project deleted successfully',
    };
  },
  {
    requiredFeature: 'project_costing',
    requiredRole: ['owner', 'admin'],
  }
);

// ============================================================================
// Get Project Summary (For Dashboard)
// ============================================================================

export const getProjectsSummaryAction = withGuard(
  async ({ businessId }) => {
    const [activeProjects, allProjects, totalContractValue, totalCertified] = await Promise.all([
      db.construction_projects.count({
        where: {
          business_id: businessId,
          status: 'ACTIVE',
        },
      }),
      db.construction_projects.count({
        where: {
          business_id: businessId,
        },
      }),
      db.construction_projects.aggregate({
        where: {
          business_id: businessId,
          status: { in: ['ACTIVE', 'DLP'] },
        },
        _sum: {
          contract_value: true,
        },
      }),
      db.construction_projects.aggregate({
        where: {
          business_id: businessId,
          status: { in: ['ACTIVE', 'DLP'] },
        },
        _sum: {
          cumulative_certified: true,
          retention_held: true,
        },
      }),
    ]);

    return {
      success: true,
      summary: {
        activeProjects,
        totalProjects: allProjects,
        totalContractValue: Number(totalContractValue._sum.contract_value || 0),
        totalCertified: Number(totalCertified._sum.cumulative_certified || 0),
        totalRetentionHeld: Number(totalCertified._sum.retention_held || 0),
      },
    };
  },
  {
    requiredFeature: 'project_costing',
  }
);
