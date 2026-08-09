/**
 * Offline day-save queue for Water Route Hisab.
 * Coalesces to one pending row per (businessId, deliveryDate) — last write wins,
 * superseding any previous pending save for the same day so only the latest
 * state is synced when connectivity returns.
 */
import {
  openWaterHisabOfflineDb,
  waterHisabBusinessDateKey,
} from '@/lib/utils/waterHisabOfflineDb';

const STORE = 'daySaves';

/**
 * Queue a day-sheet save for later sync.
 * If a pending save already exists for the same (businessId, deliveryDate),
 * it is superseded and replaced by this new one.
 *
 * @param {{
 *   businessId: string,
 *   deliveryDate: string,
 *   category: string,
 *   rows: object[],
 *   clientRef: string,
 * }} save
 */
export async function enqueueWaterHisabDaySave(save) {
  const { businessId, deliveryDate, clientRef } = save || {};
  if (!businessId || !deliveryDate) {
    throw new Error('businessId and deliveryDate required for offline water hisab save');
  }
  if (!clientRef || typeof clientRef !== 'string') {
    throw new Error('clientRef required for offline water hisab save');
  }

  const businessDate = waterHisabBusinessDateKey(businessId, deliveryDate);
  const db = await openWaterHisabOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const idx = store.index('businessDate');
    const getAll = idx.getAll(businessDate);

    getAll.onsuccess = () => {
      // Supersede any existing pending saves for this day
      const existing = (getAll.result || []).filter((r) => r.status === 'pending');
      for (const row of existing) {
        row.status = 'superseded';
        row.supersededAt = new Date().toISOString();
        store.put(row);
      }
      const record = {
        businessId,
        deliveryDate,
        businessDate,
        clientRef,
        category: save.category,
        payload: {
          businessId,
          category: save.category,
          deliveryDate,
          rows: save.rows || [],
          clientRef,
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        attempts: 0,
      };
      const addReq = store.add(record);
      addReq.onsuccess = () => resolve(addReq.result);
      addReq.onerror = () => reject(addReq.error);
    };
    getAll.onerror = () => reject(getAll.error);
  });
}

export async function listPendingWaterHisabDaySaves(businessId) {
  const db = await openWaterHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const idx = tx.objectStore(STORE).index('businessId');
    const req = idx.getAll(businessId);
    req.onsuccess = () => {
      const rows = (req.result || []).filter((r) => r.status === 'pending');
      rows.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function countPendingWaterHisabDaySaves(businessId) {
  const rows = await listPendingWaterHisabDaySaves(businessId);
  return rows.length;
}

export async function markWaterHisabDaySaveSynced(id) {
  const db = await openWaterHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const row = getReq.result;
      if (!row) { resolve(false); return; }
      row.status = 'synced';
      row.syncedAt = new Date().toISOString();
      store.put(row);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function incrementWaterHisabDaySaveAttempt(id, error) {
  const db = await openWaterHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const row = getReq.result;
      if (!row) { resolve(false); return; }
      row.attempts = (row.attempts || 0) + 1;
      row.lastError = String(error || '').slice(0, 500);
      store.put(row);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function markWaterHisabDaySaveFailed(id, error) {
  const db = await openWaterHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const row = getReq.result;
      if (!row) { resolve(false); return; }
      row.status = 'failed';
      row.lastError = String(error || '').slice(0, 500);
      row.failedAt = new Date().toISOString();
      store.put(row);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/** Generate a client-side idempotency key for deduplication on the server. */
export function newWaterHisabClientRef() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `wh-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
