'use server';

import { db, pool } from '@/lib/db';
import { createGLEntryAction } from '@/lib/actions/basic/accounting';
import { ACCOUNT_CODES } from '@/lib/config/accounting';
import { vendorSchema, validateWithSchema } from '@/lib/validation/schemas';
import { withGuard } from '@/lib/rbac/serverGuard';
import { checkPlanLimit } from '@/lib/auth/planGuard';
import { assertEntityBelongsToBusiness } from '@/lib/actions/_shared/tenant';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';

async function checkAuth(businessId, permission = 'vendors.view') {
    const { session } = await withGuard(businessId, { permission });
    return session;
}

/**
 * Server Action: Get all vendors for a business
 * 
 * @param {string} businessId - Business UUID
 * @returns {Promise<{success: boolean, vendors?: any[], error?: string}>}
 */
export async function getVendorsAction(businessId) {
    try {
        await checkAuth(businessId, 'vendors.view');

        // Use raw SQL so Prisma client/DB column drift (is_deleted, is_active) never breaks queries
        const client = await pool.connect();
        let rows;
        try {
            const result = await client.query(
                `SELECT * FROM vendors
                 WHERE business_id = $1
                   AND (is_deleted IS NULL OR is_deleted = false)
                 ORDER BY name ASC
                 LIMIT 2000`,
                [businessId]
            );
            rows = result.rows;
        } finally {
            client.release();
        }

        return { success: true, vendors: serializeDecimalsDeep(rows) };
    } catch (error) {
        console.error('getVendorsAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get vendor by ID
 */
export async function getVendorByIdAction(businessId, vendorId) {
    try {
        await checkAuth(businessId, 'vendors.view');

        const client = await pool.connect();
        let vendor;
        try {
            const result = await client.query(
                `SELECT * FROM vendors WHERE id = $1 AND business_id = $2 AND (is_deleted IS NULL OR is_deleted = false) LIMIT 1`,
                [vendorId, businessId]
            );
            vendor = result.rows[0] || null;
        } finally {
            client.release();
        }

        if (!vendor) {
            return { success: false, error: 'Vendor not found or deleted' };
        }

        return { success: true, vendor: serializeDecimalsDeep(vendor) };
    } catch (error) {
        console.error('getVendorByIdAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Create vendor
 */
export async function createVendorAction(vendorData) {
    try {
        const numericFields = ['credit_limit', 'opening_balance', 'outstanding_balance'];
        const sanitizedData = { ...vendorData };

        numericFields.forEach(field => {
            if (sanitizedData[field] !== undefined) {
                if (typeof sanitizedData[field] === 'string') {
                    const val = parseFloat(sanitizedData[field]);
                    sanitizedData[field] = isNaN(val) ? 0 : val;
                } else if (sanitizedData[field] === null) {
                    sanitizedData[field] = 0;
                }
            }
        });

        if (vendorData.creditLimit !== undefined) sanitizedData.credit_limit = parseFloat(vendorData.creditLimit) || 0;
        if (vendorData.openingBalance !== undefined) sanitizedData.opening_balance = parseFloat(vendorData.openingBalance) || 0;

        const validation = validateWithSchema(vendorSchema, sanitizedData);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errorCode: 'VALIDATION_ERROR',
                code: 'VALIDATION_ERROR',
                errors: validation.errors,
                details: validation.errors,
            };
        }
        const validated = validation.data;

        await checkAuth(validated.business_id, 'vendors.create');

        const client = await pool.connect();
        let currentVendorCount;
        try {
            const countRes = await client.query(
                `SELECT COUNT(*)::int AS cnt FROM vendors WHERE business_id = $1 AND (is_deleted IS NULL OR is_deleted = false)`,
                [validated.business_id]
            );
            currentVendorCount = countRes.rows[0]?.cnt || 0;
        } finally {
            client.release();
        }
        await checkPlanLimit(validated.business_id, 'max_vendors', currentVendorCount + 1);

        const baseDomainData =
            validated.domain_data && typeof validated.domain_data === 'object' && !Array.isArray(validated.domain_data)
                ? { ...validated.domain_data }
                : {};
        // Persist UI-only extras that have no dedicated columns
        if (vendorData.market_location) baseDomainData.market_location = vendorData.market_location;
        if (vendorData.certificate_url) baseDomainData.certificate_url = vendorData.certificate_url;

        const insertClient = await pool.connect();
        let vendor;
        try {
            const ins = await insertClient.query(
                `INSERT INTO vendors (
                    business_id, name, email, phone, contact_person, ntn, srn,
                    address, city, state, pincode, country, payment_terms, notes,
                    credit_limit, outstanding_balance, opening_balance, filer_status,
                    domain_data, is_active, is_deleted
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,true,false
                ) RETURNING *`,
                [
                    validated.business_id,
                    validated.name,
                    validated.email || null,
                    validated.phone || null,
                    validated.contact_person || vendorData.contactPerson || null,
                    validated.ntn || null,
                    validated.srn || vendorData.strn || null,
                    validated.address || null,
                    validated.city || null,
                    validated.state || null,
                    validated.pincode || null,
                    validated.country || 'Pakistan',
                    validated.payment_terms || null,
                    validated.notes || null,
                    Number(validated.credit_limit || 0),
                    Number(validated.outstanding_balance || 0),
                    Number(validated.opening_balance || 0),
                    validated.filer_status || 'none',
                    JSON.stringify(baseDomainData),
                ]
            );
            vendor = ins.rows[0];
        } finally {
            insertClient.release();
        }

        // Post opening balance GL entry if non-zero
        if (Number(vendor.opening_balance) !== 0) {
            try {
                await createGLEntryAction({
                    businessId: validated.business_id,
                    date: new Date().toISOString(),
                    description: `Opening Balance for Supplier: ${vendor.name}`,
                    referenceType: 'vendor_opening',
                    referenceId: vendor.id,
                    entries: [
                        { accountCode: ACCOUNT_CODES.SUSPENSE_ACCOUNT || '3000', debit: Math.abs(Number(vendor.opening_balance)), credit: 0 },
                        { accountCode: ACCOUNT_CODES.ACCOUNTS_PAYABLE, debit: 0, credit: Math.abs(Number(vendor.opening_balance)) }
                    ]
                });
            } catch (glError) {
                // Log but don't fail vendor creation for GL posting issues
                console.error('GL Entry for vendor opening balance failed:', glError);
            }
        }

        auditWrite({
            businessId: validated.business_id,
            action: 'create',
            entityType: 'vendor',
            entityId: vendor.id,
            description: `Created vendor: ${vendor.name}`,
            metadata: { openingBalance: vendor.opening_balance }
        });

        return { success: true, vendor: serializeDecimalsDeep(vendor) };
    } catch (error) {
        console.error('createVendorAction Error:', error);
        return {
            success: false,
            error: error.message,
            errorCode: error.code || null,
            requiredPlan: error.requiredPlan || null,
            limitKey: error.limitKey || null,
            limit: Number.isFinite(Number(error.limit)) ? Number(error.limit) : null,
        };
    }
}

/**
 * Server Action: Update vendor
 */
export async function updateVendorAction(businessId, vendorId, updates) {
    try {
        await checkAuth(businessId, 'vendors.edit');

        // Tenant isolation check (Prisma-native)
        await assertEntityBelongsToBusiness(null, 'vendor', vendorId, businessId);

        const numericFields = ['credit_limit', 'opening_balance', 'outstanding_balance'];
        const sanitizedUpdates = { ...updates };

        numericFields.forEach(field => {
            if (sanitizedUpdates[field] !== undefined) {
                if (typeof sanitizedUpdates[field] === 'string') {
                    const val = parseFloat(sanitizedUpdates[field]);
                    sanitizedUpdates[field] = isNaN(val) ? 0 : val;
                } else if (sanitizedUpdates[field] === null) {
                    sanitizedUpdates[field] = 0;
                }
            }
        });

        if (updates.creditLimit !== undefined) sanitizedUpdates.credit_limit = parseFloat(updates.creditLimit) || 0;
        if (updates.openingBalance !== undefined) sanitizedUpdates.opening_balance = parseFloat(updates.openingBalance) || 0;

        // Validate full object shape (merging in business_id for schema)
        const validation = validateWithSchema(vendorSchema, { ...sanitizedUpdates, business_id: businessId, id: vendorId });
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errorCode: 'VALIDATION_ERROR',
                code: 'VALIDATION_ERROR',
                errors: validation.errors,
                details: validation.errors,
            };
        }
        const validated = validation.data;

        // Whitelist allowed update fields
        const allowedFields = [
            'name', 'email', 'phone', 'contact_person', 'ntn', 'srn',
            'address', 'city', 'state', 'pincode', 'country', 'payment_terms', 'notes',
            'credit_limit', 'outstanding_balance', 'domain_data', 'filer_status',
            'opening_balance', 'is_active'
        ];

        const updateData = {};
        for (const [key, val] of Object.entries(validated)) {
            let dbKey = key;
            if (key === 'contactPerson') dbKey = 'contact_person';
            if (key === 'strn') dbKey = 'srn';
            if (key === 'tax_number') dbKey = 'ntn';
            if (key === 'tax_id') dbKey = 'ntn';

            if (allowedFields.includes(dbKey) && key !== 'id' && key !== 'business_id') {
                if (dbKey === 'domain_data') {
                    const merged =
                        (typeof val === 'object' && val !== null && !Array.isArray(val)) ? { ...val } : {};
                    if (updates.market_location) merged.market_location = updates.market_location;
                    if (updates.certificate_url) merged.certificate_url = updates.certificate_url;
                    updateData[dbKey] = JSON.stringify(merged);
                } else {
                    updateData[dbKey] = val;
                }
            }
        }

        // If domain_data was not in validated payload but UI extras were sent, merge into existing
        if (!updateData.domain_data && (updates.market_location || updates.certificate_url)) {
            const client2 = await pool.connect();
            let existingDomain;
            try {
                const r = await client2.query(`SELECT domain_data FROM vendors WHERE id = $1 AND business_id = $2 LIMIT 1`, [vendorId, businessId]);
                existingDomain = r.rows[0]?.domain_data;
            } finally {
                client2.release();
            }
            const merged = { ...(existingDomain && typeof existingDomain === 'object' ? existingDomain : {}) };
            if (updates.market_location) merged.market_location = updates.market_location;
            if (updates.certificate_url) merged.certificate_url = updates.certificate_url;
            updateData.domain_data = JSON.stringify(merged);
        }

        // Build SET clause dynamically from updateData
        const keys = Object.keys(updateData);
        let updatedVendor;
        const pgClient = await pool.connect();
        try {
            if (keys.length > 0) {
                const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
                const values = [...Object.values(updateData), vendorId, businessId];
                await pgClient.query(
                    `UPDATE vendors SET ${setClauses} WHERE id = $${keys.length + 1} AND business_id = $${keys.length + 2} AND (is_deleted IS NULL OR is_deleted = false)`,
                    values
                );
            }
            const r = await pgClient.query(`SELECT * FROM vendors WHERE id = $1 AND business_id = $2 LIMIT 1`, [vendorId, businessId]);
            updatedVendor = r.rows[0] || null;
        } finally {
            pgClient.release();
        }

        if (!updatedVendor) {
            return { success: false, error: 'Vendor not found or deleted' };
        }

        auditWrite({
            businessId,
            action: 'update',
            entityType: 'vendor',
            entityId: vendorId,
            description: `Updated vendor: ${updatedVendor?.name || vendorId}`,
        });

        return { success: true, vendor: updatedVendor ? serializeDecimalsDeep(updatedVendor) : null };
    } catch (error) {
        console.error('updateVendorAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Delete vendor (Soft Delete)
 */
export async function deleteVendorAction(businessId, vendorId) {
    try {
        await checkAuth(businessId, 'vendors.delete');

        // Tenant isolation check (Prisma-native)
        await assertEntityBelongsToBusiness(null, 'vendor', vendorId, businessId);

        const pgDel = await pool.connect();
        let delCount = 0;
        try {
            const r = await pgDel.query(
                `UPDATE vendors SET is_deleted = true, is_active = false, deleted_at = NOW() WHERE id = $1 AND business_id = $2`,
                [vendorId, businessId]
            );
            delCount = r.rowCount;
        } finally {
            pgDel.release();
        }

        if (delCount === 0) {
            return { success: false, error: 'Vendor not found' };
        }

        auditWrite({
            businessId,
            action: 'delete',
            entityType: 'vendor',
            entityId: vendorId,
            description: `Soft-deleted vendor ${vendorId}`,
        });

        return { success: true, message: 'Vendor soft-deleted successfully' };
    } catch (error) {
        console.error('deleteVendorAction Error:', error);
        return { success: false, error: error.message };
    }
}
