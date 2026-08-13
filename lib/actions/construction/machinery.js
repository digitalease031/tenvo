'use server';

/**
 * Machinery & Equipment Logs Server Actions
 * Handles daily equipment logbook with hour-meter, fuel, and output tracking
 */

import { db } from '@/lib/db';
import { withGuard } from '@/lib/auth/withGuard';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { analyzeEquipmentProductivity } from '@/lib/construction/constructionIntelligence';

// ============================================================================
// Validation Schema
// ============================================================================

const logMachineryOperationSchema = z.object({
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
  log_date: z.string(), // ISO date
  shift: z.enum(['Morning', 'Evening', 'Night']).optional(),
  maintenance_required: z.boolean().default(false),
  maintenance_notes: z.string().optional(),
  notes: z.string().optional(),
  domain_data: z.record(z.any()).optional(),
}).refine((data) => data.end_hours >= data.start_hours, {
  message: 'End hours must be greater than or equal to start hours',
  path: ['end_hours'],
});

// ============================================================================
// Log Machinery Operation
// ============================================================================

export const logMachineryOperationAction = withGuard(
  async ({ businessId, userId }, data) => {
    const validated = logMachineryOperationSchema.parse(data);

    // If project_id provided, verify it belongs to business
    if (validated.project_id) {
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
    }

    // Create machinery log
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
        created_by: userId,
      },
    });

    if (validated.project_id) {
      revalidatePath(`/business/projects/${validated.project_id}`);
    }
    revalidatePath('/business/machinery');

    return {
      success: true,
      log: serializeDecimalsDeep(log),
    };
  },
  {
    requiredFeature: 'machinery_logbook',
    requiredRole: ['owner', 'admin', 'manager', 'operator'],
  }
);

// ============================================================================
// Get Machinery Logs
// ============================================================================

export const getMachineryLogsAction = withGuard(
  async ({ businessId }, options = {}) => {
    const {
      project_id,
      machinery_code,
      start_date,
      end_date,
      limit = 100,
      offset = 0,
    } = options;

    const where = {
      business_id: businessId,
      ...(project_id && { project_id }),
      ...(machinery_code && { machinery_code }),
      ...(start_date &&
        end_date && {
          log_date: {
            gte: new Date(start_date),
            lte: new Date(end_date),
          },
        }),
    };

    const [logs, total] = await Promise.all([
      db.machinery_logs.findMany({
        where,
        orderBy: { log_date: 'desc' },
        take: limit,
        skip: offset,
        include: {
          project: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      }),
      db.machinery_logs.count({ where }),
    ]);

    return {
      success: true,
      logs: serializeDecimalsDeep(logs),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  },
  {
    requiredFeature: 'machinery_logbook',
  }
);

// ============================================================================
// Analyze Machinery Productivity
// ============================================================================

export const analyzeMachineryProductivityAction = withGuard(
  async ({ businessId }, machineryCode, period = {}) => {
    const { start_date, end_date } = period;

    const where = {
      business_id: businessId,
      machinery_code: machineryCode,
      ...(start_date &&
        end_date && {
          log_date: {
            gte: new Date(start_date),
            lte: new Date(end_date),
          },
        }),
    };

    const logs = await db.machinery_logs.findMany({
      where,
      orderBy: { log_date: 'desc' },
    });

    if (logs.length === 0) {
      return {
        success: false,
        error: 'No logs found for this machinery',
      };
    }

    // Aggregate totals
    const totalHours = logs.reduce((sum, log) => sum + (Number(log.end_hours) - Number(log.start_hours)), 0);
    const totalFuel = logs.reduce((sum, log) => sum + Number(log.fuel_litres), 0);
    const totalOutput = logs.reduce((sum, log) => sum + Number(log.output_qty), 0);

    // Use intelligence helper for analysis
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
      period: {
        start_date,
        end_date,
        log_count: logs.length,
      },
    };
  },
  {
    requiredFeature: 'machinery_logbook',
  }
);

// ============================================================================
// Get Machinery Fleet Summary
// ============================================================================

export const getMachineryFleetSummaryAction = withGuard(
  async ({ businessId }, period = {}) => {
    const { start_date, end_date } = period;

    const where = {
      business_id: businessId,
      ...(start_date &&
        end_date && {
          log_date: {
            gte: new Date(start_date),
            lte: new Date(end_date),
          },
        }),
    };

    // Aggregate by machinery_code
    const logs = await db.machinery_logs.findMany({
      where,
      orderBy: { log_date: 'desc' },
    });

    // Group by machinery_code
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
      avg_fuel_per_hour: equipment.total_hours > 0 ? equipment.total_fuel / equipment.total_hours : 0,
      avg_output_per_hour: equipment.total_hours > 0 ? equipment.total_output / equipment.total_hours : 0,
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
  },
  {
    requiredFeature: 'machinery_logbook',
  }
);

// ============================================================================
// Update Machinery Log
// ============================================================================

export const updateMachineryLogAction = withGuard(
  async ({ businessId }, logId, data) => {
    // Verify log belongs to business
    const existing = await db.machinery_logs.findFirst({
      where: {
        id: logId,
        business_id: businessId,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: 'Machinery log not found',
      };
    }

    const updateData = { ...data };

    // Validate end_hours >= start_hours
    const startHours = data.start_hours !== undefined ? data.start_hours : Number(existing.start_hours);
    const endHours = data.end_hours !== undefined ? data.end_hours : Number(existing.end_hours);

    if (endHours < startHours) {
      return {
        success: false,
        error: 'End hours must be greater than or equal to start hours',
      };
    }

    if (data.log_date) {
      updateData.log_date = new Date(data.log_date);
    }

    const log = await db.machinery_logs.update({
      where: { id: logId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });

    if (existing.project_id) {
      revalidatePath(`/business/projects/${existing.project_id}`);
    }
    revalidatePath('/business/machinery');

    return {
      success: true,
      log: serializeDecimalsDeep(log),
    };
  },
  {
    requiredFeature: 'machinery_logbook',
    requiredRole: ['owner', 'admin', 'manager'],
  }
);

// ============================================================================
// Delete Machinery Log
// ============================================================================

export const deleteMachineryLogAction = withGuard(
  async ({ businessId }, logId) => {
    // Verify log belongs to business
    const existing = await db.machinery_logs.findFirst({
      where: {
        id: logId,
        business_id: businessId,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: 'Machinery log not found',
      };
    }

    await db.machinery_logs.delete({
      where: { id: logId },
    });

    if (existing.project_id) {
      revalidatePath(`/business/projects/${existing.project_id}`);
    }
    revalidatePath('/business/machinery');

    return {
      success: true,
      message: 'Machinery log deleted successfully',
    };
  },
  {
    requiredFeature: 'machinery_logbook',
    requiredRole: ['owner', 'admin'],
  }
);
