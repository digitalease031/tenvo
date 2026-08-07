'use server';

import { db } from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { checkPlanLimit } from '@/lib/auth/planGuard';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { isTrustedAuthBypassActive } from '@/lib/actions/_shared/trustedAuthBypass';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { customerSchema, validateWithSchema } from '@/lib/validation/schemas';
import { isWaterHisabRelevant, generateWaterCustomerId, readWaterCustomerPrefs } from '@/lib/storefront/waterShopHisab';

/** Columns needed for hub CRM list / invoice picker (avoid SELECT * fat rows). */
const CUSTOMER_LIST_SELECT = {
    id: true,
    business_id: true,
    name: true,
    email: true,
    phone: true,
    ntn: true,
    cnic: true,
    srn: true,
    address: true,
    city: true,
    state: true,
    pincode: true,
    country: true,
    credit_limit: true,
    outstanding_balance: true,
    opening_balance: true,
    filer_status: true,
    type: true,
    notes: true,
    is_active: true,
    domain_data: true,
    created_at: true,
    updated_at: true,
};

async function checkAuth(businessId, permission = 'customers.view') {
    if (isTrustedAuthBypassActive()) return null;
    const { session } = await withGuard(businessId, { permission });
    return session;
}

/**
 * Merge UI-only market_location into domain_data (no dedicated Prisma column).
 * @param {Record<string, unknown> | null | undefined} domainData
 * @param {string | null | undefined} marketLocation
 */
function mergeCustomerDomainData(domainData, marketLocation) {
    const merged =
        domainData && typeof domainData === 'object' && !Array.isArray(domainData)
            ? { ...domainData }
            : {};
    const loc = typeof marketLocation === 'string' ? marketLocation.trim() : '';
    if (loc) {
        merged.market_location = loc;
        // Keep normalized domain-field key in sync when present on forms
        if (!merged.marketlocation) merged.marketlocation = loc;
    }
    return merged;
}

function emptyToNull(value) {
    if (value == null) return null;
    if (typeof value === 'string' && !value.trim()) return null;
    return value;
}

/**
 * @param {string} businessId
 * @param {{
 *   limit?: number | null;
 *   offset?: number;
 *   lean?: boolean;
 * }} [options]
 */
export async function getCustomersAction(businessId, options = {}) {
    try {
        await checkAuth(businessId, 'customers.view');

        const { skipAuth: _ignoredSkipAuth, ...customerOptions } = options || {};
        const lean = customerOptions.lean !== false;
        const rawLimit = customerOptions.limit;
        const hasLimit = rawLimit != null && Number.isFinite(Number(rawLimit));
        const take = hasLimit
            ? Math.min(Math.max(Number(rawLimit), 1), 1000)
            : null;
        const skip = Math.max(Number(customerOptions.offset) || 0, 0);

        const customers = await db.customers.findMany({
            where: {
                business_id: businessId,
                is_deleted: false,
                is_active: true,
            },
            orderBy: { created_at: 'desc' },
            ...(lean ? { select: CUSTOMER_LIST_SELECT } : {}),
            ...(take != null ? { take, skip } : {}),
        });

        return {
            success: true,
            customers: /** @type {unknown[]} */ (serializeDecimalsDeep(customers)),
            hasMore: take != null ? customers.length >= take : false,
        };
    } catch (error) {
        console.error('getCustomersAction Error:', error);
        return { success: false, error: error.message };
    }
}

export async function createCustomerAction(customerData) {
    try {
        const numericFields = ['credit_limit', 'opening_balance', 'outstanding_balance'];
        const sanitizedData = { ...customerData };
        numericFields.forEach((field) => {
            if (sanitizedData[field] !== undefined) {
                if (typeof sanitizedData[field] === 'string') {
                    const val = parseFloat(sanitizedData[field]);
                    sanitizedData[field] = Number.isFinite(val) ? val : 0;
                } else if (sanitizedData[field] === null) {
                    sanitizedData[field] = 0;
                }
            }
        });

        const validation = validateWithSchema(customerSchema, sanitizedData);
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

        await checkAuth(validated.business_id, 'customers.create');

        const currentCustomerCount = await db.customers.count({
            where: {
                business_id: validated.business_id,
                is_deleted: false
            }
        });
        
        await checkPlanLimit(validated.business_id, 'max_customers', currentCustomerCount + 1, null);

        let domain_data = mergeCustomerDomainData(
            validated.domain_data,
            customerData.market_location || validated.market_location
        );

        // Water delivery: auto-assign unique Customer ID when blank.
        try {
            const business = await db.businesses.findFirst({
                where: { id: validated.business_id },
                select: { category: true },
            });
            if (isWaterHisabRelevant(business?.category)) {
                const existingId = String(readWaterCustomerPrefs({ domain_data }).accountNo || '').trim();
                if (!existingId) {
                    const siblings = await db.customers.findMany({
                        where: { business_id: validated.business_id, is_deleted: false },
                        select: { domain_data: true },
                        take: 500,
                    });
                    const used = new Set(
                        siblings
                            .map((c) => String(readWaterCustomerPrefs(c).accountNo || '').trim().toUpperCase())
                            .filter(Boolean)
                    );
                    let nextId = generateWaterCustomerId();
                    let guard = 0;
                    while (used.has(nextId.toUpperCase()) && guard < 40) {
                        nextId = generateWaterCustomerId();
                        guard += 1;
                    }
                    domain_data = { ...domain_data, accountno: nextId };
                }
            }
        } catch (idErr) {
            console.warn('[createCustomerAction] water customer id assign skipped', idErr?.message || idErr);
        }

        const customer = await db.customers.create({
            data: {
                business_id: validated.business_id,
                name: validated.name,
                email: emptyToNull(validated.email),
                phone: emptyToNull(validated.phone),
                address: emptyToNull(validated.address),
                city: emptyToNull(validated.city),
                state: emptyToNull(validated.state),
                pincode: emptyToNull(validated.pincode),
                country: emptyToNull(validated.country) || 'Pakistan',
                ntn: emptyToNull(validated.ntn),
                cnic: emptyToNull(validated.cnic),
                srn: emptyToNull(validated.srn),
                credit_limit: Number(validated.credit_limit || 0),
                outstanding_balance: Number(validated.outstanding_balance || 0),
                opening_balance: Number(validated.opening_balance || 0),
                filer_status: validated.filer_status || 'none',
                type: validated.type || 'individual',
                notes: emptyToNull(validated.notes),
                domain_data,
                is_active: true,
                is_deleted: false,
            }
        });

        auditWrite({
            businessId: validated.business_id,
            action: 'create',
            entityType: 'customer',
            entityId: customer.id,
            description: `Created customer: ${customer.name}`,
            metadata: { openingBalance: customer.opening_balance, type: customer.type }
        });

        return { success: true, customer: serializeDecimalsDeep(customer) };
    } catch (error) {
        console.error('createCustomerAction Error:', error);
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

export async function updateCustomerAction(id, businessId, updates) {
    try {
        await checkAuth(businessId, 'customers.edit');
        
        const cleanUpdates = { ...updates };
        if (cleanUpdates.tax_id) {
            cleanUpdates.ntn = cleanUpdates.tax_id;
            delete cleanUpdates.tax_id;
        }

        const numericFields = ['credit_limit', 'opening_balance', 'outstanding_balance'];
        numericFields.forEach((field) => {
            if (cleanUpdates[field] !== undefined) {
                if (typeof cleanUpdates[field] === 'string') {
                    const val = parseFloat(cleanUpdates[field]);
                    cleanUpdates[field] = Number.isFinite(val) ? val : 0;
                } else if (cleanUpdates[field] === null) {
                    cleanUpdates[field] = 0;
                }
            }
        });

        const validation = validateWithSchema(customerSchema, {
            ...cleanUpdates,
            business_id: businessId,
        });
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

        const allowedUpdates = [
            'name', 'email', 'phone', 'address', 'city',
            'state', 'pincode', 'country',
            'ntn', 'cnic', 'srn',
            'credit_limit', 'outstanding_balance', 'opening_balance', 'filer_status',
            'type', 'notes', 'is_active',
            'domain_data'
        ];

        const updateData = {};
        for (const key of Object.keys(cleanUpdates)) {
            if (allowedUpdates.includes(key)) {
                if (key === 'domain_data') {
                    updateData[key] = mergeCustomerDomainData(
                        cleanUpdates[key],
                        cleanUpdates.market_location
                    );
                } else if (numericFields.includes(key)) {
                    updateData[key] = Number(cleanUpdates[key] || 0);
                } else if (typeof cleanUpdates[key] === 'string') {
                    updateData[key] = emptyToNull(cleanUpdates[key]);
                } else {
                    updateData[key] = cleanUpdates[key];
                }
            }
        }

        if (!updateData.domain_data && cleanUpdates.market_location) {
            const existing = await db.customers.findFirst({
                where: { id, business_id: businessId, is_deleted: false },
                select: { domain_data: true },
            });
            updateData.domain_data = mergeCustomerDomainData(
                existing?.domain_data,
                cleanUpdates.market_location
            );
        }

        if (Object.keys(updateData).length === 0) {
            const unchanged = await db.customers.findFirst({
                where: { id: id, business_id: businessId, is_deleted: false },
            });
            return {
                success: true,
                message: 'No changes',
                customer: unchanged ? serializeDecimalsDeep(unchanged) : null,
            };
        }

        const result = await db.customers.updateMany({
            where: {
                id: id,
                business_id: businessId,
                is_deleted: false
            },
            data: updateData
        });

        if (result.count === 0) return { success: false, error: 'Customer not found or deleted' };
        
        const customer = await db.customers.findFirst({
            where: { id: id, business_id: businessId }
        });

        auditWrite({
            businessId: businessId,
            action: 'update',
            entityType: 'customer',
            entityId: id,
            description: `Updated customer: ${customer?.name || id}`,
        });

        return { success: true, customer: customer ? serializeDecimalsDeep(customer) : null };
    } catch (error) {
        console.error('updateCustomerAction Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteCustomerAction(id, businessId) {
    try {
        await checkAuth(businessId, 'customers.delete');
        
        const result = await db.customers.updateMany({
            where: {
                id: id,
                business_id: businessId
            },
            data: {
                is_deleted: true,
                is_active: false,
                deleted_at: new Date()
            }
        });

        if (result.count === 0) return { success: false, error: 'Customer not found' };

        auditWrite({
            businessId: businessId,
            action: 'delete',
            entityType: 'customer',
            entityId: id,
            description: `Soft-deleted customer ${id}`,
        });

        return { success: true, message: 'Customer soft-deleted successfully' };
    } catch (error) {
        console.error('deleteCustomerAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check a list of candidate customers for potential duplicates against existing database records.
 * Scoped strictly by business_id.
 *
 * @param {string} businessId
 * @param {Array<{ name?: string, phone?: string, cnic?: string, ntn?: string, towncode?: string, address?: string }>} candidates
 */
export async function checkCustomerDuplicatesAction(businessId, candidates = []) {
    try {
        await checkAuth(businessId, 'customers.view');
        if (!businessId || !Array.isArray(candidates) || candidates.length === 0) {
            return { success: true, duplicates: [] };
        }

        const existingCustomers = await db.customers.findMany({
            where: {
                business_id: businessId,
                is_deleted: false,
            },
            select: {
                id: true,
                name: true,
                phone: true,
                cnic: true,
                ntn: true,
                domain_data: true,
            },
            take: 2000,
        });

        // Index existing phone numbers (digits only) and CNICs/NTNs
        const existingByPhone = new Map();
        const existingByCnic = new Map();
        const existingByNameRoute = new Map();

        for (const cust of existingCustomers) {
            if (cust.phone) {
                const digits = cust.phone.replace(/\D/g, '');
                if (digits.length >= 7) {
                    const key = digits.slice(-10);
                    existingByPhone.set(key, cust);
                }
            }
            if (cust.cnic) {
                const cnicDigits = cust.cnic.replace(/\D/g, '');
                if (cnicDigits) existingByCnic.set(cnicDigits, cust);
            }
            if (cust.ntn) {
                const ntnClean = cust.ntn.replace(/\D/g, '');
                if (ntnClean) existingByCnic.set(ntnClean, cust);
            }
            if (cust.name) {
                const domain = cust.domain_data && typeof cust.domain_data === 'object' ? cust.domain_data : {};
                const town = String(domain.towncode || domain.deliveryroute || '').trim().toLowerCase();
                const nameKey = `${cust.name.trim().toLowerCase()}_${town}`;
                existingByNameRoute.set(nameKey, cust);
            }
        }

        const duplicates = [];

        candidates.forEach((cand, idx) => {
            const phoneDigits = String(cand.phone || '').replace(/\D/g, '');
            if (phoneDigits.length >= 7) {
                const candKey = phoneDigits.slice(-10);
                if (existingByPhone.has(candKey)) {
                    const match = existingByPhone.get(candKey);
                    duplicates.push({
                        index: idx,
                        field: 'phone',
                        value: cand.phone,
                        matchedCustomer: { id: match.id, name: match.name, phone: match.phone },
                        message: `Phone number matches existing customer "${match.name}"`,
                    });
                    return;
                }
            }

            const cnicDigits = String(cand.cnic || cand.ntn || '').replace(/\D/g, '');
            if (cnicDigits && existingByCnic.has(cnicDigits)) {
                const match = existingByCnic.get(cnicDigits);
                duplicates.push({
                    index: idx,
                    field: 'cnic',
                    value: cand.cnic || cand.ntn,
                    matchedCustomer: { id: match.id, name: match.name, phone: match.phone },
                    message: `CNIC/NTN matches existing customer "${match.name}"`,
                });
                return;
            }

            if (cand.name) {
                const town = String(cand.towncode || cand.deliveryroute || '').trim().toLowerCase();
                const nameKey = `${String(cand.name).trim().toLowerCase()}_${town}`;
                if (existingByNameRoute.has(nameKey)) {
                    const match = existingByNameRoute.get(nameKey);
                    duplicates.push({
                        index: idx,
                        field: 'name',
                        value: cand.name,
                        matchedCustomer: { id: match.id, name: match.name, phone: match.phone },
                        message: `Same customer name & town code already exists as "${match.name}"`,
                    });
                }
            }
        });

        return { success: true, duplicates };
    } catch (error) {
        console.error('checkCustomerDuplicatesAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Batch create multiple customers at once from Excel grid entry.
 *
 * @param {string} businessId
 * @param {Array<Record<string, any>>} customerRows
 * @param {{ skipDuplicates?: boolean }} [options]
 */
export async function batchCreateCustomersAction(businessId, customerRows = [], options = {}) {
    try {
        await checkAuth(businessId, 'customers.create');
        if (!businessId || !Array.isArray(customerRows) || customerRows.length === 0) {
            return { success: false, error: 'No customer data provided' };
        }

        // Filter out empty rows (must have name or phone)
        const validRows = customerRows.filter(r => (r.name && String(r.name).trim()) || (r.phone && String(r.phone).trim()));

        if (validRows.length === 0) {
            return { success: false, error: 'All customer rows were empty' };
        }

        const currentCustomerCount = await db.customers.count({
            where: {
                business_id: businessId,
                is_deleted: false,
            },
        });

        await checkPlanLimit(businessId, 'max_customers', currentCustomerCount + validRows.length, null);

        const business = await db.businesses.findFirst({
            where: { id: businessId },
            select: { category: true, city: true },
        });

        const isWater = isWaterHisabRelevant(business?.category);

        // Fetch used water account IDs for auto-assignment
        let usedWaterIds = new Set();
        if (isWater) {
            const siblings = await db.customers.findMany({
                where: { business_id: businessId, is_deleted: false },
                select: { domain_data: true },
                take: 1000,
            });
            usedWaterIds = new Set(
                siblings
                    .map((c) => String(readWaterCustomerPrefs(c).accountNo || '').trim().toUpperCase())
                    .filter(Boolean)
            );
        }

        const createdCustomers = [];
        const errors = [];

        for (let i = 0; i < validRows.length; i++) {
            const row = validRows[i];
            const name = String(row.name || '').trim();
            if (!name) {
                errors.push({ index: i, error: 'Name is required' });
                continue;
            }

            let domain_data = mergeCustomerDomainData(
                row.domain_data,
                row.market_location
            );

            // Water delivery specific domain fields mapping
            if (row.towncode) domain_data.towncode = String(row.towncode).trim();
            if (row.deliveryroute) domain_data.deliveryroute = String(row.deliveryroute).trim();
            if (row.deliverydays) domain_data.deliverydays = String(row.deliverydays).trim();
            if (row.bottlebalance !== undefined) domain_data.bottlebalance = Number(row.bottlebalance) || 0;
            if (row.productrate !== undefined) domain_data.productrate = Number(row.productrate) || 0;
            if (row.emptydeposit !== undefined) domain_data.emptydeposit = Number(row.emptydeposit) || 0;
            if (row.houseno) domain_data.houseno = String(row.houseno).trim();
            if (row.floorflat) domain_data.floorflat = String(row.floorflat).trim();
            if (row.accounttype) domain_data.customertype = String(row.accounttype).trim();
            // Additional water delivery fields
            if (row.proprietorname) domain_data.proprietorname = String(row.proprietorname).trim();
            if (row.deliveryarea) domain_data.deliveryarea = String(row.deliveryarea).trim();
            if (row.dailybottles !== undefined && row.dailybottles !== '') domain_data.dailybottles = Number(row.dailybottles) || 1;
            if (row.dayoffollow !== undefined && row.dayoffollow !== '') domain_data.dayoffollow = Number(row.dayoffollow) || 0;
            if (row.deliveryactive) domain_data.deliveryactive = String(row.deliveryactive).trim();
            if (row.preferredpayment) domain_data.preferredpayment = String(row.preferredpayment).trim();
            // Strip temp client-side ID (server generates canonical accountno)
            delete domain_data._tempId;

            if (isWater && !domain_data.accountno) {
                let nextId = generateWaterCustomerId();
                let guard = 0;
                while (usedWaterIds.has(nextId.toUpperCase()) && guard < 40) {
                    nextId = generateWaterCustomerId();
                    guard += 1;
                }
                domain_data.accountno = nextId;
                usedWaterIds.add(nextId.toUpperCase());
            }

            try {
                const customer = await db.customers.create({
                    data: {
                        business_id: businessId,
                        name: name,
                        email: emptyToNull(row.email),
                        phone: emptyToNull(row.phone),
                        address: emptyToNull(row.address || row.houseno),
                        city: emptyToNull(row.city || business?.city),
                        state: emptyToNull(row.state),
                        pincode: emptyToNull(row.pincode),
                        country: emptyToNull(row.country) || 'Pakistan',
                        ntn: emptyToNull(row.ntn),
                        cnic: emptyToNull(row.cnic),
                        srn: emptyToNull(row.srn),
                        credit_limit: Number(row.credit_limit || 0),
                        outstanding_balance: Number(row.opening_balance || row.outstanding_balance || 0),
                        opening_balance: Number(row.opening_balance || 0),
                        filer_status: row.filer_status || 'none',
                        type: row.type || 'individual',
                        notes: emptyToNull(row.notes),
                        domain_data,
                        is_active: true,
                        is_deleted: false,
                    },
                });

                createdCustomers.push(customer);

                auditWrite({
                    businessId: businessId,
                    action: 'create',
                    entityType: 'customer',
                    entityId: customer.id,
                    description: `Batch created customer: ${customer.name}`,
                    metadata: { batchIndex: i, openingBalance: customer.opening_balance },
                });
            } catch (createErr) {
                console.error(`batchCreateCustomersAction error at row ${i}:`, createErr);
                errors.push({ index: i, error: createErr.message });
            }
        }

        return {
            success: true,
            createdCount: createdCustomers.length,
            errorCount: errors.length,
            errors,
            customers: serializeDecimalsDeep(createdCustomers),
        };
    } catch (error) {
        console.error('batchCreateCustomersAction Error:', error);
        return {
            success: false,
            error: error.message,
            errorCode: error.code || null,
        };
    }
}

