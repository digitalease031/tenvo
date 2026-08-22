export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { WarehouseService } from '@/lib/services/WarehouseService';
import { withGuard } from '@/lib/rbac/serverGuard';
import { pickBusinessIdFromBody, pickBusinessIdFromSearchParams } from '@/lib/utils/pickBusinessId';

/**
 * GET /api/v1/warehouses?business_id=xxx | ?businessId=xxx
 * List all warehouses for a business
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const businessId = pickBusinessIdFromSearchParams(searchParams);
        if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 });

        await withGuard(businessId, { permission: 'warehouses.view' });

        const result = await WarehouseService.getWarehouses(businessId);
        return NextResponse.json({ success: true, warehouses: result });
    } catch (error) {
        console.error('GET /api/v1/warehouses error:', error);
        return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 403 : 500 });
    }
}

/**
 * POST /api/v1/warehouses
 * Create a new warehouse
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const businessId = pickBusinessIdFromBody(body);
        const { business_id: _snake, businessId: _camel, ...warehouseData } = body;
        if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 });

        // Count matches WarehouseService / prisma model warehouse_locations (no warehouses table)
        const countRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM warehouse_locations WHERE business_id = $1`,
            [businessId]
        );
        const currentCount = countRes.rows[0].count;

        await withGuard(businessId, {
            permission: 'warehouses.manage',
            limitKey: 'max_warehouses',
            currentCount,
        });

        const warehouse = await WarehouseService.createWarehouse({ ...warehouseData, business_id: businessId });
        return NextResponse.json({ success: true, warehouse }, { status: 201 });
    } catch (error) {
        console.error('POST /api/v1/warehouses error:', error);
        const status = error.code === 'LIMIT_REACHED' ? 403
            : error.code === 'UNAUTHENTICATED' ? 401
            : error.code === 'PERMISSION_DENIED' ? 403
            : 500;
        return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
}

