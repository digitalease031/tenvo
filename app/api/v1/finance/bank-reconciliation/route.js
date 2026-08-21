export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withApiPermission } from '@/lib/api/_shared/middleware';
import { apiSuccess, apiError } from '@/lib/api/_shared/response';

/**
 * GET /api/v1/finance/bank-reconciliation
 * List reconciliation sessions for a business.
 * Query params: business_id, account_id
 *
 * POST /api/v1/finance/bank-reconciliation
 * Create a new reconciliation session.
 * Body: { account_id, statement_date, statement_closing_balance, lines: [...] }
 *
 * Authentication: Required (withApiAuth middleware)
 */
export const GET = withApiPermission('finance.view_gl', async (request, { businessId }) => {
    const { searchParams } = new URL(request.url);
    const account_id = searchParams.get('account_id');

    const client = await pool.connect();
    try {
        const params = [businessId];
        let where = 'brs.business_id = $1';
        if (account_id && account_id !== 'all') {
            where += ` AND brs.account_id = $2`;
            params.push(account_id);
        }

        const res = await client.query(
            `SELECT
                brs.*,
                ga.code AS account_code,
                ga.name AS account_name,
                (SELECT COUNT(*)::int FROM bank_statement_lines bsl WHERE bsl.session_id = brs.id)                        AS line_count,
                (SELECT COUNT(*)::int FROM bank_statement_lines bsl WHERE bsl.session_id = brs.id AND bsl.matched = true) AS matched_count
             FROM bank_reconciliation_sessions brs
             LEFT JOIN gl_accounts ga ON ga.id = brs.account_id
             WHERE ${where}
             ORDER BY brs.statement_date DESC`,
            params
        );

        return apiSuccess({ sessions: res.rows });
    } catch (err) {
        if (err.code === '42P01') {
            return apiSuccess({ sessions: [], warning: 'Reconciliation tables not yet migrated.' });
        }
        console.error('[bank-reconciliation GET]', err);
        return apiError('FETCH_FAILED', 'Internal server error', 500);
    } finally {
        client.release();
    }
});

export const POST = withApiPermission('finance.manage_accounts', async (request, { businessId, parsedBody }) => {
    const body = parsedBody || {};
    const { account_id, statement_date, statement_closing_balance, lines = [] } = body;

    if (!account_id || !statement_date) {
        return apiError('VALIDATION_ERROR', 'account_id and statement_date are required', 400);
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if a session already exists for this business, account, and date
        const existingRes = await client.query(
            `SELECT * FROM bank_reconciliation_sessions 
             WHERE business_id = $1 AND account_id = $2 AND statement_date = $3`,
            [businessId, account_id, statement_date]
        );

        let session;
        let isExisting = false;

        if (existingRes.rows.length > 0) {
            session = existingRes.rows[0];
            if (session.status === 'completed') {
                await client.query('ROLLBACK');
                return apiError('SESSION_COMPLETED', 'A completed reconciliation session already exists for this account on this date.', 409);
            }
            isExisting = true;
            if (statement_closing_balance != null && statement_closing_balance !== '') {
                await client.query(
                    `UPDATE bank_reconciliation_sessions SET statement_closing_balance = $1 WHERE id = $2`,
                    [statement_closing_balance, session.id]
                );
            }
        } else {
            const sessionRes = await client.query(
                `INSERT INTO bank_reconciliation_sessions
                    (business_id, account_id, statement_date, statement_closing_balance, status)
                 VALUES ($1, $2, $3, $4, 'in_progress')
                 RETURNING *`,
                [businessId, account_id, statement_date, statement_closing_balance || 0]
            );
            session = sessionRes.rows[0];
        }

        for (const line of lines) {
            await client.query(
                `INSERT INTO bank_statement_lines
                    (session_id, statement_date, description, debit, credit, matched, gl_entry_id, business_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    session.id,
                    line.statement_date || statement_date,
                    line.description || '',
                    line.debit  || 0,
                    line.credit || 0,
                    line.matched     || false,
                    line.gl_entry_id || null,
                    businessId,
                ]
            );
        }

        await client.query('COMMIT');
        return apiSuccess({ session, isExisting }, isExisting ? 200 : 201);
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '42P01') {
            return apiError('TABLES_MISSING',
                'Reconciliation tables not yet migrated. Apply the bank reconciliation migration first.', 503);
        }
        if (err.code === '23505') {
            return apiError('SESSION_EXISTS', 'A reconciliation session already exists for this account on this date.', 409);
        }
        console.error('[bank-reconciliation POST]', err);
        return apiError('CREATE_FAILED', 'Internal server error', 500);
    } finally {
        client.release();
    }
});

