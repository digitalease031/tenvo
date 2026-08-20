'use server';

import { ExpenseService } from '@/lib/services/ExpenseService';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { withGuard } from '@/lib/rbac/serverGuard';
import pool from '@/lib/db';
import { expenseSchema } from '@/lib/validation/schemas';
import { normalizeExpenseCategory } from '@/lib/utils/expenseCategories';
import { resolveExpenseAccountId } from '@/lib/utils/resolveExpenseAccount';

/**
 * Authentication helper
 */
async function checkAuth(businessId, client = null, permission = 'finance.manage_expenses') {
    const { session } = await withGuard(businessId, { permission, client });
    return session;
}

// Note: generateExpenseNumber is now in ExpenseService

/**
 * Server Action: Create an expense with automatic GL posting
 * Debit: Expense Account (category-driven)
 * Credit: Cash/Bank/AP (based on payment method)
 * 
 * @param {Object} data - Expense data
 * @param {string} data.businessId - Business UUID
 * @param {string} data.accountId - GL Account UUID for the expense
 * @param {string} [data.category] - Expense category
 * @param {number} data.amount - Expense amount
 * @param {number} [data.taxAmount] - Tax amount (included in total)
 * @param {string} [data.vendorId] - Vendor UUID
 * @param {string} [data.paymentMethod] - 'cash', 'bank', 'credit' (on account)
 * @param {string} data.date - Expense date
 * @param {string} [data.description] - Description
 * @param {string} [data.receiptUrl] - Receipt attachment URL
 * @returns {Promise<{success: boolean, expense?: Object, error?: string}>}
 */
/**
 * Server Action: Create an expense with automatic GL posting
 */
export async function createExpenseAction(data) {
    const domainKey = data?.domainKey || data?.businessCategory || null;
    // Validate input (ignore UI-only domainKey on schema)
    const parsed = expenseSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    const validData = parsed.data;
    if (validData.category) {
        validData.category = normalizeExpenseCategory(validData.category);
    }

    try {
        const session = await checkAuth(validData.businessId, null, 'finance.manage_expenses');
        const accountId = await resolveExpenseAccountId({
            businessId: validData.businessId,
            accountId: validData.accountId,
            category: validData.category,
            domainKey,
        });
        const expense = await ExpenseService.createExpense(
            { ...validData, accountId },
            session.user.id
        );

        auditWrite({
            businessId: validData.businessId, action: 'create', entityType: 'expense', entityId: expense.id,
            description: `Created expense ${expense.expense_number} -- ${validData.description || validData.category || 'N/A'}`,
            metadata: { expenseNumber: expense.expense_number, amount: validData.amount, paymentMethod: validData.paymentMethod },
        });

        return { success: true, expense };
    } catch (error) {
        console.error('Create expense action error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get expenses for a business
 * 
 * @param {string} businessId
 * @param {Object} [filters]
 * @param {string} [filters.category]
 * @param {string} [filters.vendorId]
 * @param {string} [filters.dateFrom]
 * @param {string} [filters.dateTo]
 * @param {string} [filters.status]
 * @param {number} [filters.limit]
 * @param {number} [filters.offset]
 * @returns {Promise<{success: boolean, expenses?: Object[], total?: number, error?: string}>}
 */
export async function getExpensesAction(businessId, filters = {}) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client, 'finance.view_reports');

        let query = `
            SELECT 
                e.*,
                ga.code as account_code,
                ga.name as account_name,
                v.name as vendor_name
            FROM expenses e
            LEFT JOIN gl_accounts ga ON e.account_id = ga.id
            LEFT JOIN vendors v ON e.vendor_id = v.id
            WHERE e.business_id = $1 AND e.is_deleted = false
        `;
        const params = [businessId];
        let paramIndex = 2;

        if (filters.category) {
            query += ` AND e.category = $${paramIndex}`;
            params.push(filters.category);
            paramIndex++;
        }

        if (filters.vendorId) {
            query += ` AND e.vendor_id = $${paramIndex}`;
            params.push(filters.vendorId);
            paramIndex++;
        }

        if (filters.dateFrom) {
            query += ` AND e.date >= $${paramIndex}`;
            params.push(filters.dateFrom);
            paramIndex++;
        }

        if (filters.dateTo) {
            query += ` AND e.date <= $${paramIndex}`;
            params.push(filters.dateTo);
            paramIndex++;
        }

        if (filters.status) {
            query += ` AND e.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        // Get total count
        const countQuery = query.replace(
            /SELECT\s+[\s\S]*?\s+FROM/i,
            'SELECT COUNT(*) as total FROM'
        );
        const countResult = await client.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total, 10);

        // Add pagination and ordering
        query += ` ORDER BY e.date DESC, e.created_at DESC`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(filters.limit || 50, filters.offset || 0);

        const result = await client.query(query, params);

        return { success: true, expenses: result.rows, total };
    } catch (error) {
        console.error('Get expenses error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Get expense summary by category
 * 
 * @param {string} businessId
 * @param {string} [startDate]
 * @param {string} [endDate]
 * @returns {Promise<{success: boolean, summary?: Object[], total?: number, error?: string}>}
 */
export async function getExpenseSummaryAction(businessId, startDate, endDate) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client, 'finance.view_reports');

        let query = `
            SELECT 
                e.category,
                COUNT(*)::int as count,
                SUM(e.amount)::numeric as total_amount,
                SUM(e.tax_amount)::numeric as total_tax
            FROM expenses e
            WHERE e.business_id = $1 AND e.is_deleted = false
        `;
        const params = [businessId];
        let paramIndex = 2;

        if (startDate) {
            query += ` AND e.date >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            query += ` AND e.date <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        query += ` GROUP BY e.category ORDER BY total_amount DESC`;

        const result = await client.query(query, params);

        const total = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);

        return { success: true, summary: result.rows, total: Math.round(total * 100) / 100 };
    } catch (error) {
        console.error('Get expense summary error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Delete (soft) an expense and reverse GL entries
 * 
 * @param {string} businessId
 * @param {string} expenseId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
/**
 * Server Action: Delete (soft) an expense and reverse GL entries
 */
export async function deleteExpenseAction(businessId, expenseId) {
    try {
        const session = await checkAuth(businessId, null, 'finance.manage_expenses');
        await ExpenseService.deleteExpense(businessId, expenseId, session.user.id);

        auditWrite({
            businessId, action: 'delete', entityType: 'expense', entityId: expenseId,
            description: `Deleted expense ${expenseId}`,
        });

        return { success: true, message: 'Expense deleted and GL reversed' };
    } catch (error) {
        console.error('Delete expense action error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get expense report data for any domain (Monthly, 3 Months, 6 Months, Yearly, All Time)
 */
export async function getGeneralExpenseReportDataAction({ businessId, periodKey = 'monthly', businessCategory = 'retail-shop' }) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client, 'finance.view_reports');

        const bRes = await client.query('SELECT * FROM businesses WHERE id = $1', [businessId]);
        const business = bRes.rows[0] || {};

        const refDate = new Date();
        const formatDateStr = (d) => d.toISOString().split('T')[0];

        let dateFrom = '';
        let dateTo = formatDateStr(refDate);
        let periodLabel = 'Monthly Expense Report';

        if (periodKey === 'daily') {
            dateFrom = dateTo;
            periodLabel = `Daily Expense Report (${dateTo})`;
        } else if (periodKey === 'weekly') {
            const startOfWeek = new Date(refDate);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek.setDate(diff);
            dateFrom = formatDateStr(startOfWeek);
            periodLabel = `Weekly Expense Report (${dateFrom} to ${dateTo})`;
        } else if (periodKey === 'monthly') {
            const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
            dateFrom = formatDateStr(startOfMonth);
            periodLabel = `Monthly Expense Report (${refDate.toLocaleString('default', { month: 'long', year: 'numeric' })})`;
        } else if (periodKey === 'last-3-months' || periodKey === '3-months') {
            const start3m = new Date(refDate);
            start3m.setMonth(start3m.getMonth() - 3);
            dateFrom = formatDateStr(start3m);
            periodLabel = `3 Months Expense Report (${dateFrom} to ${dateTo})`;
        } else if (periodKey === 'last-6-months' || periodKey === '6-months') {
            const start6m = new Date(refDate);
            start6m.setMonth(start6m.getMonth() - 6);
            dateFrom = formatDateStr(start6m);
            periodLabel = `6 Months Expense Report (${dateFrom} to ${dateTo})`;
        } else if (periodKey === 'yearly') {
            const startYear = new Date(refDate.getFullYear(), 0, 1);
            dateFrom = formatDateStr(startYear);
            periodLabel = `Yearly Expense Report (Year ${refDate.getFullYear()})`;
        } else if (periodKey === 'all-time') {
            dateFrom = '2000-01-01';
            periodLabel = `All Time Expense Report`;
        }

        let query = `
            SELECT e.id, e.expense_number, e.amount, e.category, e.description, e.payment_method, e.date, e.created_at,
                   v.name as vendor_name
            FROM expenses e
            LEFT JOIN vendors v ON e.vendor_id = v.id
            WHERE e.business_id = $1 AND e.is_deleted = false
        `;
        const params = [businessId];

        if (dateFrom && dateFrom !== '2000-01-01') {
            query += ` AND e.date >= $2::date AND e.date < ($3::date + INTERVAL '1 day')`;
            params.push(dateFrom, dateTo);
        }

        query += ` ORDER BY e.date DESC, e.created_at DESC`;

        const res = await client.query(query, params);

        const expenses = res.rows.map((row) => {
            const rawCat = row.category || 'miscellaneous';
            const catObj = findExpenseCategory(rawCat, businessCategory);
            const categoryLabel = catObj?.label || getExpenseCategoryShopLabel({ value: rawCat }) || rawCat;
            return {
                id: row.id,
                expense_number: row.expense_number || row.id,
                amount: Number(row.amount) || 0,
                category: categoryLabel,
                categoryKey: rawCat,
                description: row.description || row.vendor_name || '',
                paymentMethod: row.payment_method || 'Cash',
                date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
            };
        });

        return {
            success: true,
            business,
            dateFrom,
            dateTo,
            periodLabel,
            expenses,
        };
    } catch (error) {
        console.error('getGeneralExpenseReportDataAction error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}
