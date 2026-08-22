/**
 * Shared IndexedDB adapter for offline hub invoicing & payment records.
 */

export const INVOICE_OFFLINE_DB_NAME = 'tenvo_invoice_offline';
export const INVOICE_OFFLINE_DB_VERSION = 1;

export function openInvoiceOfflineDb() {
    if (typeof indexedDB === 'undefined') {
        return Promise.reject(new Error('IndexedDB unavailable'));
    }
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(INVOICE_OFFLINE_DB_NAME, INVOICE_OFFLINE_DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('pending_invoices')) {
                const os = db.createObjectStore('pending_invoices', { keyPath: 'offlineId' });
                os.createIndex('businessId', 'businessId', { unique: false });
                os.createIndex('status', 'status', { unique: false });
                os.createIndex('createdAt', 'createdAt', { unique: false });
            }
            if (!db.objectStoreNames.contains('pending_payments')) {
                const os = db.createObjectStore('pending_payments', { keyPath: 'offlineId' });
                os.createIndex('businessId', 'businessId', { unique: false });
                os.createIndex('invoiceId', 'invoiceId', { unique: false });
                os.createIndex('status', 'status', { unique: false });
                os.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
    });
}
