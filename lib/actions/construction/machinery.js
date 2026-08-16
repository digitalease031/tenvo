'use server';

/**
 * Machinery & Equipment Logs Server Actions
 * Handles daily equipment logbook with hour-meter, fuel, and output tracking
 */

import { db } from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { analyzeEquipmentProductivity } from '@/lib/construction/constructionIntelligence';

// ============================================================================
// Validation Schema
// ============================================================================

const logMachineryOperationSchema = z
  .object({
    project_id: z.string().uuid().optional(),
    machinery_code: z.string().min(1).max(50),
    machinery_name: z.string().min(1).max(255),
    equipment_type: z.string().max(100).optional(),
    operator_name: z.string().min(1).max(255),
    operator_id: z.string().max(100).optional(),
    start_hours: z.number().min(0),
    end_hours: z.number().min(0),
    fuel_litres: z.number().min(0).default(0),
    output_qty: z.number().min(0).default(0),
    output_unit: z.string().max(20).optional(),
    location_station: z.string().max(255).optional(),
    work_description: z.string().optional(),
    boq_item_ref: z.string().max(50).optional(),
    log_date: z.string(),
    shift: z.enum(['Morning', 'Evening', 'Night']).optional(),
    maintenance_required: z.boolean().default(false),
    maintenance_notes: z.string().optional(),
    notes: z.string().optional(),
    domain_data: z.record(z.any()).optional(),
  })
  .refine((data) => data.end_hours >= data.start_hours, {
    message: 'End hours must be greater than or equal to start hours',
    path: ['end_hours'],
  });

// ============================================================================
// Log Machinery Operation
// ============================================================================

export async function logMachineryOperationAction(businessId, data) {
  const { session } = await withGuard(businessId, {
    permission: 'inventory.manage',
  });

  try {
    const startHrs = Number(data.start_hours ?? data.start_hour_meter ?? 0);
    const endHrs = Number(data.end_hours ?? data.end_hour_meter ?? (startHrs + Number(data.hours_worked ?? 8)));

    const normalizedData = {
      project_id: data.project_id || undefined,
      machinery_code: String(data.machinery_code || data.equipment_id || data.equipment_code || `EQ-${Date.now().toString().slice(-4)}`).trim(),
      machinery_name: String(data.machinery_name || data.equipment_type || 'General Machinery').trim(),
      equipment_type: String(data.equipment_type || data.machinery_name || 'General Equipment').trim(),
      operator_name: String(data.operator_name || 'Site Operator').trim(),
      operator_id: data.operator_id ? String(data.operator_id) : undefined,
      start_hours: startHrs,
      end_hours: Math.max(endHrs, startHrs),
      fuel_litres: Number(data.fuel_litres ?? data.fuel_consumed_litres ?? 0),
      output_qty: Number(data.output_qty ?? 0),
      output_unit: data.output_unit ? String(data.output_unit) : 'Cu.M',
      location_station: data.location_station ? String(data.location_station) : undefined,
      work_description: data.work_description || data.operation_type ? String(data.work_description || data.operation_type) : undefined,
      boq_item_ref: data.boq_item_ref ? String(data.boq_item_ref) : undefined,
      log_date: data.log_date ? String(data.log_date) : new Date().toISOString().slice(0, 10),
      shift: data.shift || 'Morning',
      maintenance_required: Boolean(data.maintenance_required || data.maintenance_flag),
      maintenance_notes: data.maintenance_notes || data.maintenance_note ? String(data.maintenance_notes || data.maintenance_note) : undefined,
      notes: data.notes ? String(data.notes) : undefined,
      domain_data: data.domain_data || {},
    };

    const validated = logMachineryOperationSchema.parse(normalizedData);

    if (validated.project_id) {
      const project = await db.construction_projects.findFirst({
        where: { id: validated.project_id, business_id: businessId },
      });

      if (!project) {
        return { success: false, error: 'Project not found' };
      }
    }

    const log = await db.machinery_logs.create({
      data: {
        business_id: businessId,
        project_id: validated.project_id,
        machinery_code: validated.machinery_code,
        machinery_name: validated.machinery_name,
        equipment_type: validated.equipment_type,
        operator_name: validated.operator_name,
        operator_id: validated.operator_id,
        start_hours: validated.start_hours,
        end_hours: validated.end_hours,
        fuel_litres: validated.fuel_litres,
        output_qty: validated.output_qty,
        output_unit: validated.output_unit,
        location_station: validated.location_station,
        work_description: validated.work_description,
        boq_item_ref: validated.boq_item_ref,
        log_date: new Date(validated.log_date),
        shift: validated.shift,
        maintenance_required: validated.maintenance_required,
        maintenance_notes: validated.maintenance_notes,
        notes: validated.notes,
        domain_data: validated.domain_data || {},
        created_by: session?.user?.id,
      },
    });

    if (validated.project_id) {
      revalidatePath(`/business/projects/${validated.project_id}`);
    }
    revalidatePath('/business/machinery');

    return { success: true, log: serializeDecimalsDeep(log) };
  } catch (err) {
    console.error('[logMachineryOperationAction]', err);
    return { success: false, error: err.message || 'Failed to log machinery operation' };
  }
}

// ============================================================================
// Get Machinery Logs
// ============================================================================

export async function getMachineryLogsAction(businessId, options = {}) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const { project_id, machinery_code, start_date, end_date, limit = 100, offset = 0 } = options;

    const where = {
      business_id: businessId,
      ...(project_id && { project_id }),
      ...(machinery_code && { machinery_code }),
      ...(start_date &&
        end_date && {
          log_date: { gte: new Date(start_date), lte: new Date(end_date) },
        }),
    };

    const [logs, total] = await Promise.all([
      db.machinery_logs.findMany({
        where,
        orderBy: { log_date: 'desc' },
        take: limit,
        skip: offset,
        include: {
          project: { select: { code: true, name: true } },
        },
      }),
      db.machinery_logs.count({ where }),
    ]);

    return {
      success: true,
      logs: serializeDecimalsDeep(logs),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    };
  } catch (err) {
    console.error('[getMachineryLogsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch machinery logs' };
  }
}

// ============================================================================
// Analyze Machinery Productivity
// ============================================================================

export async function analyzeMachineryProductivityAction(businessId, machineryCode, period = {}) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const { start_date, end_date } = period;

    const where = {
      business_id: businessId,
      machinery_code: machineryCode,
      ...(start_date &&
        end_date && {
          log_date: { gte: new Date(start_date), lte: new Date(end_date) },
        }),
    };

    const logs = await db.machinery_logs.findMany({ where, orderBy: { log_date: 'desc' } });

    if (logs.length === 0) {
      return { success: false, error: 'No logs found for this machinery' };
    }

    const totalHours = logs.reduce(
      (sum, log) => sum + (Number(log.end_hours) - Number(log.start_hours)),
      0
    );
    const totalFuel = logs.reduce((sum, log) => sum + Number(log.fuel_litres), 0);
    const totalOutput = logs.reduce((sum, log) => sum + Number(log.output_qty), 0);

    const analysis = analyzeEquipmentProductivity({
      equipmentType: logs[0].equipment_type || logs[0].machinery_name,
      hoursLogged: totalHours,
      fuelConsumedLitres: totalFuel,
      outputQty: totalOutput,
      outputUnit: logs[0].output_unit || 'Units',
    });

    return {
      success: true,
      analysis: serializeDecimalsDeep(analysis),
      period: { start_date, end_date, log_count: logs.length },
    };
  } catch (err) {
    console.error('[analyzeMachineryProductivityAction]', err);
    return { success: false, error: err.message || 'Failed to analyze machinery productivity' };
  }
}

// ============================================================================
// Get Machinery Fleet Summary
// ============================================================================

export async function getMachineryFleetSummaryAction(businessId, period = {}) {
  await withGuard(businessId, { permission: 'analytics.basic' });

  try {
    const { start_date, end_date } = period;

    const where = {
      business_id: businessId,
      ...(start_date &&
        end_date && {
          log_date: { gte: new Date(start_date), lte: new Date(end_date) },
        }),
    };

    const logs = await db.machinery_logs.findMany({ where, orderBy: { log_date: 'desc' } });

    const fleet = logs.reduce((acc, log) => {
      const code = log.machinery_code;
      if (!acc[code]) {
        acc[code] = {
          machinery_code: code,
          machinery_name: log.machinery_name,
          equipment_type: log.equipment_type,
          total_hours: 0,
          total_fuel: 0,
          total_output: 0,
          log_count: 0,
        };
      }
      acc[code].total_hours += Number(log.end_hours) - Number(log.start_hours);
      acc[code].total_fuel += Number(log.fuel_litres);
      acc[code].total_output += Number(log.output_qty);
      acc[code].log_count += 1;
      return acc;
    }, {});

    const fleetArray = Object.values(fleet).map((equipment) => ({
      ...equipment,
      avg_fuel_per_hour:
        equipment.total_hours > 0 ? equipment.total_fuel / equipment.total_hours : 0,
      avg_output_per_hour:
        equipment.total_hours > 0 ? equipment.total_output / equipment.total_hours : 0,
    }));

    return {
      success: true,
      fleet: serializeDecimalsDeep(fleetArray),
      totals: {
        total_hours: fleetArray.reduce((sum, e) => sum + e.total_hours, 0),
        total_fuel: fleetArray.reduce((sum, e) => sum + e.total_fuel, 0),
        total_output: fleetArray.reduce((sum, e) => sum + e.total_output, 0),
        equipment_count: fleetArray.length,
      },
    };
  } catch (err) {
    console.error('[getMachineryFleetSummaryAction]', err);
    return { success: false, error: err.message || 'Failed to fetch fleet summary' };
  }
}

// ============================================================================
// Update Machinery Log
// ============================================================================

export async function updateMachineryLogAction(businessId, logId, data) {
  await withGuard(businessId, { permission: 'inventory.manage' });

  try {
    const existing = await db.machinery_logs.findFirst({
      where: { id: logId, business_id: businessId },
    });

    if (!existing) {
      return { success: false, error: 'Machinery log not found' };
    }

    const updateData = { ...data };
    const startHours = data.start_hours !== undefined ? data.start_hours : Number(existing.start_hours);
    const endHours = data.end_hours !== undefined ? data.end_hours : Number(existing.end_hours);

    if (endHours < startHours) {
      return { success: false, error: 'End hours must be greater than or equal to start hours' };
    }

    if (data.log_date) {
      updateData.log_date = new Date(data.log_date);
    }

    const log = await db.machinery_logs.update({
      where: { id: logId },
      data: { ...updateData, updated_at: new Date() },
    });

    if (existing.project_id) {
      revalidatePath(`/business/projects/${existing.project_id}`);
    }
    revalidatePath('/business/machinery');

    return { success: true, log: serializeDecimalsDeep(log) };
  } catch (err) {
    console.error('[updateMachineryLogAction]', err);
    return { success: false, error: err.message || 'Failed to update machinery log' };
  }
}

// ============================================================================
// Delete Machinery Log
// ============================================================================

export async function deleteMachineryLogAction(businessId, logId) {
  await withGuard(businessId, { permission: 'inventory.manage' });

  try {
    const existing = await db.machinery_logs.findFirst({
      where: { id: logId, business_id: businessId },
    });

    if (!existing) {
      return { success: false, error: 'Machinery log not found' };
    }

    await db.machinery_logs.delete({ where: { id: logId } });

    if (existing.project_id) {
      revalidatePath(`/business/projects/${existing.project_id}`);
    }
    revalidatePath('/business/machinery');

    return { success: true, message: 'Machinery log deleted successfully' };
  } catch (err) {
    console.error('[deleteMachineryLogAction]', err);
    return { success: false, error: err.message || 'Failed to delete machinery log' };
  }
}
