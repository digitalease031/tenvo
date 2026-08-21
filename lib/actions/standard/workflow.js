'use server';

import { WorkflowService } from '@/lib/services/WorkflowService';
import { InvoiceApprovalService } from '@/lib/services/InvoiceApprovalService';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { withGuard } from '@/lib/rbac/serverGuard';
import pool from '@/lib/db';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';

async function checkAuth(businessId, client = null, permission = 'workflows.view', feature = 'approval_workflows') {
    const { session } = await withGuard(businessId, { permission, feature, client });
    return session;
}

/**
 * Submit an approval request
 */
export async function submitApprovalAction(data) {
    try {
        const session = await checkAuth(data.businessId, null, 'approvals.request', 'approval_workflows');
        const request = await WorkflowService.submitApproval(data, session.user.id);

        auditWrite({
            businessId: data.businessId, action: 'create', entityType: 'approval_request', entityId: request.id,
            description: `Submitted ${data.requestType} approval request ${request.id}`,
        });

        return { success: true, request: serializeDecimalsDeep(request) };
    } catch (error) {
        console.error('Submit approval action error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Approve or reject a request
 */
export async function resolveApprovalAction(data) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(data.businessId, client, 'approvals.approve', 'approval_workflows');
        const userId = session?.user?.id || null;
        const requestId = String(data.requestId || '');
        const isApproved = data.action === 'approve' || data.action === 'approved';

        // Handle synthetic Purchase Order approval
        if (requestId.startsWith('po_')) {
            const poId = requestId.replace(/^po_/, '');
            const newStatus = isApproved ? 'ordered' : 'cancelled';
            await client.query(
                `UPDATE purchases SET status = $1, updated_at = NOW() WHERE id = $2 AND business_id = $3`,
                [newStatus, poId, data.businessId]
            );
            return { success: true, status: newStatus };
        }

        // Handle synthetic Stock Adjustment approval
        if (requestId.startsWith('sa_')) {
            const saId = requestId.replace(/^sa_/, '');
            const newStatus = isApproved ? 'approved' : 'rejected';
            await client.query(
                `UPDATE stock_adjustments SET status = $1, updated_at = NOW() WHERE id = $2 AND business_id = $3`,
                [newStatus, saId, data.businessId]
            );
            return { success: true, status: newStatus };
        }

        // Handle synthetic Invoice approval
        if (requestId.startsWith('inv_')) {
            const invId = requestId.replace(/^inv_/, '');
            if (isApproved) {
                await InvoiceApprovalService.approveInvoice(data.businessId, invId, userId, data.rejectionReason || '');
            } else {
                await InvoiceApprovalService.rejectInvoice(data.businessId, invId, userId, data.rejectionReason || '');
            }
            return { success: true, status: isApproved ? 'approved' : 'rejected' };
        }

        const result = await WorkflowService.resolveApproval({ ...data, action: isApproved ? 'approve' : 'reject' }, userId, client);

        auditWrite({
            businessId: data.businessId, action: isApproved ? 'approve' : 'reject',
            entityType: 'approval_request', entityId: data.requestId,
            description: `${result.status} approval request ${data.requestId}`,
            metadata: { requestType: result.request.request_type, rejectionReason: data.rejectionReason },
        });

        return { success: true, status: result.status };
    } catch (error) {
        console.error('Resolve approval action error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get pending approvals for a user / business
 * Aggregates explicit approval_requests + pending POs + pending Stock Adjustments + pending Invoices
 */
export async function getPendingApprovalsAction(businessId) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(businessId, client, 'workflows.view', 'approval_workflows');
        const userId = session?.user?.id;

        // 1. Explicit approval_requests
        const reqResult = await client.query(`
            SELECT ar.*,
                   COALESCE(u.name, ar.requested_by, 'System') as requester_name
            FROM approval_requests ar
            LEFT JOIN "user" u ON (ar.requested_by = u.id OR ar.requested_by = u.email)
            WHERE ar.business_id = $1
            AND (ar.approver_id IS NULL OR ar.approver_id = $2 OR ar.approver_id IN ('admin', 'manager', 'owner', 'accountant', 'warehouse_manager'))
            AND ar.status = 'pending'
            ORDER BY ar.requested_at DESC
        `, [businessId, userId]);

        const requests = reqResult.rows.map(r => ({
            id: r.id,
            request_type: r.request_type || 'expense',
            reference_id: r.reference_id,
            requested_by: r.requested_by,
            requester_name: r.requester_name || 'System',
            status: r.status || 'pending',
            title: r.title || `${r.request_type || 'Approval'} Request`,
            description: r.description || `${r.request_type || 'Item'} pending review`,
            amount: Number(r.amount) || 0,
            requested_at: r.requested_at || new Date().toISOString(),
        }));

        // 2. Draft / Pending Purchase Orders needing manager sign-off
        const poResult = await client.query(`
            SELECT p.id, p.purchase_number, p.total_amount, p.created_at, p.date, v.name as vendor_name
            FROM purchases p
            LEFT JOIN vendors v ON p.vendor_id = v.id
            WHERE p.business_id = $1
              AND LOWER(p.status) IN ('draft', 'pending')
              AND (p.is_deleted = false OR p.is_deleted IS NULL)
            ORDER BY p.created_at DESC
            LIMIT 25
        `, [businessId]);

        for (const po of poResult.rows) {
            requests.push({
                id: `po_${po.id}`,
                request_type: 'purchase',
                reference_id: po.id,
                requested_by: 'Procurement',
                requester_name: 'Procurement Team',
                status: 'pending',
                title: `Purchase Order #${po.purchase_number}`,
                description: `PO #${po.purchase_number}${po.vendor_name ? ` from ${po.vendor_name}` : ''} pending approval`,
                amount: Number(po.total_amount) || 0,
                requested_at: po.created_at || po.date || new Date().toISOString(),
            });
        }

        // 3. Pending Stock Adjustments needing approval
        try {
            const saResult = await client.query(`
                SELECT sa.id, sa.reason, sa.total_cost, sa.created_at
                FROM stock_adjustments sa
                WHERE sa.business_id = $1
                  AND LOWER(sa.status) IN ('pending', 'pending_approval')
                  AND (sa.is_deleted = false OR sa.is_deleted IS NULL)
                ORDER BY sa.created_at DESC
                LIMIT 25
            `, [businessId]);

            for (const sa of saResult.rows) {
                requests.push({
                    id: `sa_${sa.id}`,
                    request_type: 'stock_adjustment',
                    reference_id: sa.id,
                    requested_by: 'Inventory',
                    requester_name: 'Inventory Audit',
                    status: 'pending',
                    title: `Stock Adjustment Request`,
                    description: `Stock Adjustment (${sa.reason || 'Inventory audit'})`,
                    amount: Number(sa.total_cost) || 0,
                    requested_at: sa.created_at || new Date().toISOString(),
                });
            }
        } catch { /* Table may be optional */ }

        // 4. Pending Invoices awaiting approval
        try {
            const invResult = await client.query(`
                SELECT i.id, i.invoice_number, i.grand_total, i.created_at, c.name as customer_name
                FROM invoices i
                LEFT JOIN customers c ON i.customer_id = c.id
                WHERE i.business_id = $1
                  AND (i.approval_status = 'pending' OR LOWER(i.status) = 'awaiting_approval')
                  AND (i.is_deleted = false OR i.is_deleted IS NULL)
                ORDER BY i.created_at DESC
                LIMIT 25
            `, [businessId]);

            for (const inv of invResult.rows) {
                requests.push({
                    id: `inv_${inv.id}`,
                    request_type: 'invoice',
                    reference_id: inv.id,
                    requested_by: 'Sales',
                    requester_name: 'Sales Team',
                    status: 'pending',
                    title: `Invoice #${inv.invoice_number}`,
                    description: `Invoice #${inv.invoice_number}${inv.customer_name ? ` for ${inv.customer_name}` : ''} awaiting sign-off`,
                    amount: Number(inv.grand_total) || 0,
                    requested_at: inv.created_at || new Date().toISOString(),
                });
            }
        } catch { /* Table or column optional */ }

        // Sort combined requests by date descending
        requests.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));

        return { success: true, requests: serializeDecimalsDeep(requests) };
    } catch (error) {
        console.error('Get pending approvals error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get all approval history for a business
 */
export async function getApprovalHistoryAction(businessId, filters = {}) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client, 'workflows.view', 'approval_workflows');

        let query = `
            SELECT ar.*,
                   COALESCE(u_req.name, ar.requested_by, 'System') as requester_name,
                   COALESCE(u_app.name, ar.approver_id, 'Manager') as approver_name
            FROM approval_requests ar
            LEFT JOIN "user" u_req ON ar.requested_by = u_req.id
            LEFT JOIN "user" u_app ON ar.approver_id = u_app.id
            WHERE ar.business_id = $1
        `;
        const params = [businessId];
        let idx = 2;

        if (filters.status) {
            query += ` AND ar.status = $${idx}`;
            params.push(filters.status);
            idx++;
        }
        if (filters.requestType) {
            query += ` AND ar.request_type = $${idx}`;
            params.push(filters.requestType);
            idx++;
        }

        query += ` ORDER BY ar.requested_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(filters.limit || 50, filters.offset || 0);

        const result = await client.query(query, params);
        const history = result.rows.map(r => ({
            id: r.id,
            request_type: r.request_type || 'expense',
            reference_id: r.reference_id,
            requested_by: r.requested_by,
            requester_name: r.requester_name || 'System',
            approver_name: r.approver_name || 'Manager',
            status: r.status,
            title: r.title || `${r.request_type || 'Approval'} Request`,
            description: r.description || `${r.request_type} request`,
            amount: Number(r.amount) || 0,
            requested_at: r.requested_at || new Date().toISOString(),
            resolved_at: r.resolved_at,
        }));

        return { success: true, requests: serializeDecimalsDeep(history) };
    } catch (error) {
        console.error('Get approval history error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get workflow rules for a business
 */
export async function getWorkflowRulesAction(businessId) {
    try {
        await checkAuth(businessId, null, 'workflows.view', 'approval_workflows');
        const rules = await WorkflowService.getWorkflowRules(businessId);
        return { success: true, rules: serializeDecimalsDeep(rules) };
    } catch (error) {
        console.error('Get workflow rules action error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Save workflow rule action
 */
export async function saveWorkflowRuleAction(businessId, ruleData) {
    try {
        await checkAuth(businessId, null, 'workflows.edit', 'approval_workflows');
        const rule = await WorkflowService.saveWorkflowRule(businessId, ruleData);

        auditWrite({
            businessId, action: 'update', entityType: 'workflow_rule', entityId: rule.id,
            description: `Saved workflow rule ${rule.name}`,
        });

        return { success: true, rule: serializeDecimalsDeep(rule) };
    } catch (error) {
        console.error('Save workflow rule action error:', error);
        return { success: false, error: error.message };
    }
}

