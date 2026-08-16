'use server';

/**
 * Construction Site Operations Server Actions
 * Daily work reports, safety logs, quality testing, site inspections
 */

import { db } from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';

// ============================================================================
// Validation Schemas
// ============================================================================

const createDailyWorkReportSchema = z.object({
  project_id: z.string().uuid(),
  report_date: z.string(),
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
  log_date: z.string(),
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
  test_date: z.string(),
  test_type: z.string().min(1),
  test_standard: z.string().optional(),
  sample_location: z.string().optional(),
  test_results: z.string().min(1),
  pass_fail_status: z.enum(['PASS', 'FAIL', 'PENDING', 'CONDITIONAL']),
  tested_by: z.string().optional(),
  remarks: z.string().optional(),
  domain_data: z.record(z.any()).optional(),
});

const createSiteInspectionSchema = z.object({
  project_id: z.string().uuid(),
  inspection_date: z.string(),
  inspection_type: z.enum(['PROGRESS', 'QUALITY', 'SAFETY', 'CLIENT', 'ENGINEER', 'FINAL']),
  inspector_name: z.string().min(1),
  findings: z.string().min(1),
  recommendations: z.string().optional(),
  compliance_status: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'CONDITIONAL']),
  follow_up_required: z.boolean().default(false),
  next_inspection_date: z.string().optional(),
  domain_data: z.record(z.any()).optional(),
});

// ============================================================================
// Daily Work Reports
// ============================================================================

export async function createDailyWorkReportAction(businessId, data) {
  const { session } = await withGuard(businessId, { permission: 'inventory.manage' });

  try {
    const normalizedData = {
      project_id: data.project_id,
      report_date: data.report_date ? String(data.report_date) : new Date().toISOString().slice(0, 10),
      weather_conditions: data.weather_conditions ? String(data.weather_conditions) : 'Clear',
      manpower_on_site: data.manpower_on_site ? parseInt(String(data.manpower_on_site), 10) : 0,
      work_description: String(data.work_description || data.description || 'Daily Construction Progress').trim(),
      equipment_deployed: data.equipment_deployed ? String(data.equipment_deployed) : undefined,
      materials_consumed: data.materials_consumed ? String(data.materials_consumed) : undefined,
      progress_pct: data.progress_pct ? parseFloat(String(data.progress_pct)) : 0,
      issues_encountered: data.issues_encountered ? String(data.issues_encountered) : undefined,
      remarks: data.remarks ? String(data.remarks) : undefined,
      reported_by: data.reported_by || session?.user?.name ? String(data.reported_by || session.user.name) : undefined,
      domain_data: data.domain_data || {},
    };

    const validated = createDailyWorkReportSchema.parse(normalizedData);

    const project = await db.construction_projects.findFirst({
      where: { id: validated.project_id, business_id: businessId },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const existing = await db.construction_daily_reports.findFirst({
      where: { project_id: validated.project_id, report_date: new Date(validated.report_date) },
    });

    if (existing) {
      return { success: false, error: 'Daily report already exists for this date' };
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
        reported_by: validated.reported_by || session?.user?.id,
        domain_data: validated.domain_data || {},
      },
    });

    revalidatePath(`/business/projects/${validated.project_id}`);

    return { success: true, report: serializeDecimalsDeep(report) };
  } catch (err) {
    console.error('[createDailyWorkReportAction]', err);
    return { success: false, error: err.message || 'Failed to create daily work report' };
  }
}

export async function getDailyWorkReportsAction(businessId, options = {}) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const { projectId, startDate, endDate, limit = 30 } = options;

    const where = {
      business_id: businessId,
      ...(projectId && { project_id: projectId }),
      ...(startDate && endDate && {
        report_date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    };

    const reports = await db.construction_daily_reports.findMany({
      where,
      orderBy: { report_date: 'desc' },
      take: limit,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    return { success: true, reports: serializeDecimalsDeep(reports) };
  } catch (err) {
    console.error('[getDailyWorkReportsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch daily reports' };
  }
}

// ============================================================================
// Safety Logs
// ============================================================================

export async function createSafetyLogAction(businessId, data) {
  const { session } = await withGuard(businessId, { permission: 'inventory.manage' });

  try {
    const validated = createSafetyLogSchema.parse(data);

    const project = await db.construction_projects.findFirst({
      where: { id: validated.project_id, business_id: businessId },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
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
        logged_by: session?.user?.id,
        domain_data: validated.domain_data || {},
      },
    });

    revalidatePath(`/business/projects/${validated.project_id}`);

    return { success: true, safetyLog: serializeDecimalsDeep(safetyLog) };
  } catch (err) {
    console.error('[createSafetyLogAction]', err);
    return { success: false, error: err.message || 'Failed to create safety log' };
  }
}

export async function getSafetyLogsAction(businessId, options = {}) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const { projectId, status, severity, startDate, endDate, limit = 50 } = options;

    const where = {
      business_id: businessId,
      ...(projectId && { project_id: projectId }),
      ...(status && { status }),
      ...(severity && { severity }),
      ...(startDate && endDate && {
        log_date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    };

    const logs = await db.construction_safety_logs.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { log_date: 'desc' }],
      take: limit,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    return { success: true, safetyLogs: serializeDecimalsDeep(logs) };
  } catch (err) {
    console.error('[getSafetyLogsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch safety logs' };
  }
}

export async function updateSafetyLogStatusAction(businessId, logId, status, correctiveAction) {
  await withGuard(businessId, { permission: 'inventory.manage' });

  try {
    const existing = await db.construction_safety_logs.findFirst({
      where: { id: logId, business_id: businessId },
    });

    if (!existing) {
      return { success: false, error: 'Safety log not found' };
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

    return { success: true, safetyLog: serializeDecimalsDeep(updated) };
  } catch (err) {
    console.error('[updateSafetyLogStatusAction]', err);
    return { success: false, error: err.message || 'Failed to update safety log status' };
  }
}

// ============================================================================
// Quality Testing
// ============================================================================

export async function createQualityTestAction(businessId, data) {
  const { session } = await withGuard(businessId, { permission: 'inventory.manage' });

  try {
    const validated = createQualityTestSchema.parse(data);

    const project = await db.construction_projects.findFirst({
      where: { id: validated.project_id, business_id: businessId },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
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
        tested_by: validated.tested_by || session?.user?.id,
        remarks: validated.remarks,
        domain_data: validated.domain_data || {},
      },
    });

    revalidatePath(`/business/projects/${validated.project_id}`);

    return { success: true, qualityTest: serializeDecimalsDeep(qualityTest) };
  } catch (err) {
    console.error('[createQualityTestAction]', err);
    return { success: false, error: err.message || 'Failed to create quality test' };
  }
}

export async function getQualityTestsAction(businessId, options = {}) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const { projectId, passFailStatus, startDate, endDate, limit = 50 } = options;

    const where = {
      business_id: businessId,
      ...(projectId && { project_id: projectId }),
      ...(passFailStatus && { pass_fail_status: passFailStatus }),
      ...(startDate && endDate && {
        test_date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    };

    const tests = await db.construction_quality_tests.findMany({
      where,
      orderBy: { test_date: 'desc' },
      take: limit,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    return { success: true, qualityTests: serializeDecimalsDeep(tests) };
  } catch (err) {
    console.error('[getQualityTestsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch quality tests' };
  }
}

// ============================================================================
// Site Inspections
// ============================================================================

export async function createSiteInspectionAction(businessId, data) {
  await withGuard(businessId, { permission: 'inventory.manage' });

  try {
    const validated = createSiteInspectionSchema.parse(data);

    const project = await db.construction_projects.findFirst({
      where: { id: validated.project_id, business_id: businessId },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
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
        next_inspection_date: validated.next_inspection_date
          ? new Date(validated.next_inspection_date)
          : null,
        domain_data: validated.domain_data || {},
      },
    });

    revalidatePath(`/business/projects/${validated.project_id}`);

    return { success: true, inspection: serializeDecimalsDeep(inspection) };
  } catch (err) {
    console.error('[createSiteInspectionAction]', err);
    return { success: false, error: err.message || 'Failed to create site inspection' };
  }
}

export async function getSiteInspectionsAction(businessId, options = {}) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const { projectId, inspectionType, complianceStatus, startDate, endDate, limit = 50 } = options;

    const where = {
      business_id: businessId,
      ...(projectId && { project_id: projectId }),
      ...(inspectionType && { inspection_type: inspectionType }),
      ...(complianceStatus && { compliance_status: complianceStatus }),
      ...(startDate && endDate && {
        inspection_date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    };

    const inspections = await db.construction_site_inspections.findMany({
      where,
      orderBy: { inspection_date: 'desc' },
      take: limit,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    return { success: true, inspections: serializeDecimalsDeep(inspections) };
  } catch (err) {
    console.error('[getSiteInspectionsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch site inspections' };
  }
}
