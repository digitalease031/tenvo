'use server';

/**
 * Construction Site Operations Server Actions
 * Daily work reports, safety logs, quality testing, site inspections
 */

import { db } from '@/lib/db';
import { withGuard } from '@/lib/auth/withGuard';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';

// ============================================================================
// Validation Schemas
// ============================================================================

const createDailyWorkReportSchema = z.object({
  project_id: z.string().uuid(),
  report_date: z.string(), // YYYY-MM-DD
  weather_conditions: z.string().optional(),
  manpower_on_site: z.number().int().min(0).optional(),
  work_description: z.string().min(1),
  equipment_deployed: z.string().optional(),
  materials_consumed: z.string().optional(),
  progress_pct: z.number().min(0).max(100).optional(),
  issues_encountered: z.string().optional(),
  remarks: z.string().optional(),
  reported_by: z.string().optional(),
  domain_data: z.record(z.any()).optional(),
});

const createSafetyLogSchema = z.object({
  project_id: z.string().uuid(),
  log_date: z.string(), // YYYY-MM-DD
  incident_type: z.enum(['NEAR_MISS', 'INJURY', 'EQUIPMENT_FAILURE', 'SAFETY_VIOLATION', 'INSPECTION', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(1),
  location_station: z.string().optional(),
  corrective_action: z.string().optional(),
  responsible_person: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).default('OPEN'),
  domain_data: z.record(z.any()).optional(),
});

const createQualityTestSchema = z.object({
  project_id: z.string().uuid(),
  test_date: z.string(), // YYYY-MM-DD
  test_type: z.string().min(1), // e.g., "Concrete Cube Test", "Soil Compaction Test", "Rebar Tensile Test"
  test_standard: z.string().optional(), // e.g., "ASTM C39", "AASHTO T99"
  sample_location: z.string().optional(),
  test_results: z.string().min(1),
  pass_fail_status: z.enum(['PASS', 'FAIL', 'PENDING', 'CONDITIONAL']),
  tested_by: z.string().optional(),
  remarks: z.string().optional(),
  domain_data: z.record(z.any()).optional(),
});

const createSiteInspectionSchema = z.object({
  project_id: z.string().uuid(),
  inspection_date: z.string(), // YYYY-MM-DD
  inspection_type: z.enum(['PROGRESS', 'QUALITY', 'SAFETY', 'CLIENT', 'ENGINEER', 'FINAL']),
  inspector_name: z.string().min(1),
  findings: z.string().min(1),
  recommendations: z.string().optional(),
  compliance_status: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'CONDITIONAL']),
  follow_up_required: z.boolean().default(false),
  next_inspection_date: z.string().optional(), // YYYY-MM-DD
  domain_data: z.record(z.any()).optional(),
});

// ============================================================================
// Daily Work Reports
// ============================================================================

export const createDailyWorkReportAction = withGuard(
  async ({ businessId, userId }, data) => {
    const validated = createDailyWorkReportSchema.parse(data);

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

    // Check if report already exists for this date
    const existing = await db.construction_daily_reports.findFirst({
      where: {
        project_id: validated.project_id,
        report_date: new Date(validated.report_date),
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'Daily report already exists for this date',
      };
    }

    const report = await db.construction_daily_reports.create({
      data: {
        business_id: businessId,
        project_id: validated.project_id,
        report_date: new Date(validated.report_date),
        weather_conditions: validated.weather_conditions,
        manpower_on_site: validated.manpower_on_site,
        work_description: validated.work_description,
        equipment_deployed: validated.equipment_deployed,
        materials_consumed: validated.materials_consumed,
        progress_pct: validated.progress_pct,
        issues_encountered: validated.issues_encountered,
        remarks: validated.remarks,
        reported_by: validated.reported_by || userId,
        domain_data: validated.domain_data || {},
      },
    });

    revalidatePath(`/business/projects/${validated.project_id}`);

    return {
      success: true,
      report: serializeDecimalsDeep(report),
    };
  },
  {
    requiredFeature: 'site_operations',
    requiredRole: ['owner', 'admin', 'manager', 'operator'],
  }
);

export const getDailyWorkReportsAction = withGuard(
  async ({ businessId }, { projectId, startDate, endDate, limit = 30 }) => {
    const where = {
      business_id: businessId,
      ...(projectId && { project_id: projectId }),
      ...(startDate && endDate && {
        report_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const reports = await db.construction_daily_reports.findMany({
      where,
      orderBy: { report_date: 'desc' },
      take: limit,
      include: {
        construction_projects: {
          select: {
            project_name: true,
            project_code: true,
          },
        },
      },
    });

    return {
      success: true,
      reports: serializeDecimalsDeep(reports),
    };
  },
  {
    requiredFeature: 'site_operations',
  }
);

// ============================================================================
// Safety Logs
// ============================================================================

export const createSafetyLogAction = withGuard(
  async ({ businessId, userId }, data) => {
    const validated = createSafetyLogSchema.parse(data);

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

    const safetyLog = await db.construction_safety_logs.create({
      data: {
        business_id: businessId,
        project_id: validated.project_id,
        log_date: new Date(validated.log_date),
        incident_type: validated.incident_type,
        severity: validated.severity,
        description: validated.description,
        location_station: validated.location_station,
        corrective_action: validated.corrective_action,
        responsible_person: validated.responsible_person,
        status: validated.status,
        logged_by: userId,
        domain_data: validated.domain_data || {},
      },
    });

    revalidatePath(`/business/projects/${validated.project_id}`);

    return {
      success: true,
      safetyLog: serializeDecimalsDeep(safetyLog),
    };
  },
  {
    requiredFeature: 'site_operations',
    requiredRole: ['owner', 'admin', 'manager', 'operator'],
  }
);

export const getSafetyLogsAction = withGuard(
  async ({ businessId }, { projectId, status, severity, startDate, endDate, limit = 50 }) => {
    const where = {
      business_id: businessId,
      ...(projectId && { project_id: projectId }),
      ...(status && { status }),
      ...(severity && { severity }),
      ...(startDate && endDate && {
        log_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const logs = await db.construction_safety_logs.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { log_date: 'desc' }],
      take: limit,
      include: {
        construction_projects: {
          select: {
            project_name: true,
            project_code: true,
          },
        },
      },
    });

    return {
      success: true,
      safetyLogs: serializeDecimalsDeep(logs),
    };
  },
  {
    requiredFeature: 'site_operations',
  }
);

export const updateSafetyLogStatusAction = withGuard(
  async ({ businessId }, logId, status, correctiveAction) => {
    const existing = await db.construction_safety_logs.findFirst({
      where: {
        id: logId,
        business_id: businessId,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: 'Safety log not found',
      };
    }

    const updated = await db.construction_safety_logs.update({
      where: { id: logId },
      data: {
        status,
        ...(correctiveAction && { corrective_action: correctiveAction }),
        updated_at: new Date(),
      },
    });

    revalidatePath(`/business/projects/${existing.project_id}`);

    return {
      success: true,
      safetyLog: serializeDecimalsDeep(updated),
    };
  },
  {
    requiredFeature: 'site_operations',
    requiredRole: ['owner', 'admin', 'manager'],
  }
);

// ============================================================================
// Quality Testing
// ============================================================================

export const createQualityTestAction = withGuard(
  async ({ businessId, userId }, data) => {
    const validated = createQualityTestSchema.parse(data);

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

    const qualityTest = await db.construction_quality_tests.create({
      data: {
        business_id: businessId,
        project_id: validated.project_id,
        test_date: new Date(validated.test_date),
        test_type: validated.test_type,
        test_standard: validated.test_standard,
        sample_location: validated.sample_location,
        test_results: validated.test_results,
        pass_fail_status: validated.pass_fail_status,
        tested_by: validated.tested_by || userId,
        remarks: validated.remarks,
        domain_data: validated.domain_data || {},
      },
    });

    revalidatePath(`/business/projects/${validated.project_id}`);

    return {
      success: true,
      qualityTest: serializeDecimalsDeep(qualityTest),
    };
  },
  {
    requiredFeature: 'site_operations',
    requiredRole: ['owner', 'admin', 'manager', 'operator'],
  }
);

export const getQualityTestsAction = withGuard(
  async ({ businessId }, { projectId, passFailStatus, startDate, endDate, limit = 50 }) => {
    const where = {
      business_id: businessId,
      ...(projectId && { project_id: projectId }),
      ...(passFailStatus && { pass_fail_status: passFailStatus }),
      ...(startDate && endDate && {
        test_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const tests = await db.construction_quality_tests.findMany({
      where,
      orderBy: { test_date: 'desc' },
      take: limit,
      include: {
        construction_projects: {
          select: {
            project_name: true,
            project_code: true,
          },
        },
      },
    });

    return {
      success: true,
      qualityTests: serializeDecimalsDeep(tests),
    };
  },
  {
    requiredFeature: 'site_operations',
  }
);

// ============================================================================
// Site Inspections
// ============================================================================

export const createSiteInspectionAction = withGuard(
  async ({ businessId, userId }, data) => {
    const validated = createSiteInspectionSchema.parse(data);

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

    const inspection = await db.construction_site_inspections.create({
      data: {
        business_id: businessId,
        project_id: validated.project_id,
        inspection_date: new Date(validated.inspection_date),
        inspection_type: validated.inspection_type,
        inspector_name: validated.inspector_name,
        findings: validated.findings,
        recommendations: validated.recommendations,
        compliance_status: validated.compliance_status,
        follow_up_required: validated.follow_up_required,
        next_inspection_date: validated.next_inspection_date ? new Date(validated.next_inspection_date) : null,
        domain_data: validated.domain_data || {},
      },
    });

    revalidatePath(`/business/projects/${validated.project_id}`);

    return {
      success: true,
      inspection: serializeDecimalsDeep(inspection),
    };
  },
  {
    requiredFeature: 'site_operations',
    requiredRole: ['owner', 'admin', 'manager'],
  }
);

export const getSiteInspectionsAction = withGuard(
  async ({ businessId }, { projectId, inspectionType, complianceStatus, startDate, endDate, limit = 50 }) => {
    const where = {
      business_id: businessId,
      ...(projectId && { project_id: projectId }),
      ...(inspectionType && { inspection_type: inspectionType }),
      ...(complianceStatus && { compliance_status: complianceStatus }),
      ...(startDate && endDate && {
        inspection_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const inspections = await db.construction_site_inspections.findMany({
      where,
      orderBy: { inspection_date: 'desc' },
      take: limit,
      include: {
        construction_projects: {
          select: {
            project_name: true,
            project_code: true,
          },
        },
      },
    });

    return {
      success: true,
      inspections: serializeDecimalsDeep(inspections),
    };
  },
  {
    requiredFeature: 'site_operations',
  }
);
