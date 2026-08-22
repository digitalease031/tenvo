import { openInvoiceOfflineDb } from './invoiceOfflineDb';

/**
 * Queue a newly created invoice locally when offline.
 */
export async function queueOfflineInvoice(businessId, invoicePayload) {
    try {
        const db = await openInvoiceOfflineDb();
        const offlineId = `OFFLINE-INV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const record = {
            offlineId,
            businessId,
            payload: invoicePayload,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        await new Promise((resolve, reject) => {
            const tx = db.transaction('pending_invoices', 'readwrite');
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
            tx.objectStore('pending_invoices').put(record);
        });

        return record;
    } catch (err) {
        console.warn('[invoiceOfflineSync] Failed to queue offline invoice:', err);
        return null;
    }
}

/**
 * Queue a payment recording locally when offline.
 */
export async function queueOfflinePayment(businessId, paymentPayload) {
    try {
        const db = await openInvoiceOfflineDb();
        const offlineId = `OFFLINE-PAY-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const record = {
            offlineId,
            businessId,
            invoiceId: paymentPayload.invoiceId,
            payload: paymentPayload,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        await new Promise((resolve, reject) => {
            const tx = db.transaction('pending_payments', 'readwrite');
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
            tx.objectStore('pending_payments').put(record);
        });

        return record;
    } catch (err) {
        console.warn('[invoiceOfflineSync] Failed to queue offline payment:', err);
        return null;
    }
}

/**
 * Get all pending offline invoices for a business.
 */
export async function getPendingOfflineInvoices(businessId) {
    try {
        const db = await openInvoiceOfflineDb();
        return await new Promise((resolve) => {
            const tx = db.transaction('pending_invoices', 'readonly');
            const store = tx.objectStore('pending_invoices');
            const idx = store.index('businessId');
            const req = idx.getAll(businessId);
            req.onsuccess = () => resolve((req.result || []).filter(r => r.status === 'pending'));
            req.onerror = () => resolve([]);
        });
    } catch {
        return [];
    }
}

/**
 * Get all pending offline payments for a business.
 */
export async function getPendingOfflinePayments(businessId) {
    try {
        const db = await openInvoiceOfflineDb();
        return await new Promise((resolve) => {
            const tx = db.transaction('pending_payments', 'readonly');
            const store = tx.objectStore('pending_payments');
            const idx = store.index('businessId');
            const req = idx.getAll(businessId);
            req.onsuccess = () => resolve((req.result || []).filter(r => r.status === 'pending'));
            req.onerror = () => resolve([]);
        });
    } catch {
        return [];
    }
}

/**
 * Delete synced record from offline store.
 */
export async function removeOfflineItem(storeName, offlineId) {
    try {
        const db = await openInvoiceOfflineDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
            tx.objectStore(storeName).delete(offlineId);
        });
    } catch (err) {
        console.warn(`[invoiceOfflineSync] Failed to remove offline item ${offlineId}:`, err);
    }
}

let isFlushing = false;

/**
 * Flush all pending offline invoices and payments to server actions.
 */
export async function flushOfflineInvoicesAndPayments(businessId, actions = {}) {
    if (typeof window !== 'undefined' && !navigator.onLine) {
        return { syncedInvoices: 0, syncedPayments: 0 };
    }

    if (isFlushing) {
        return { syncedInvoices: 0, syncedPayments: 0 };
    }

    isFlushing = true;
    let syncedInvoices = 0;
    let syncedPayments = 0;

    try {
        const { createInvoiceAction, recordInvoicePaymentAction } = actions;

        // 1. Flush offline invoices
        if (typeof createInvoiceAction === 'function') {
            const pendingInvoices = await getPendingOfflineInvoices(businessId);
            for (const item of pendingInvoices) {
                try {
                    const result = await createInvoiceAction(item.payload);
                    if (result?.success || result?.invoice) {
                        await removeOfflineItem('pending_invoices', item.offlineId);
                        syncedInvoices++;
                    }
                } catch (err) {
                    console.warn('[invoiceOfflineSync] Error syncing offline invoice:', err);
                }
            }
        }

        // 2. Flush offline payments
        if (typeof recordInvoicePaymentAction === 'function') {
            const pendingPayments = await getPendingOfflinePayments(businessId);
            for (const item of pendingPayments) {
                try {
                    const result = await recordInvoicePaymentAction(item.payload);
                    if (result?.success || result?.payment) {
                        await removeOfflineItem('pending_payments', item.offlineId);
                        syncedPayments++;
                    }
                } catch (err) {
                    console.warn('[invoiceOfflineSync] Error syncing offline payment:', err);
                }
            }
        }

        return { syncedInvoices, syncedPayments };
    } finally {
        isFlushing = false;
    }
}
