/**
 * Water Route Hisab offline snapshot (IndexedDB).
 * Stores day-sheet snapshots for offline read-back and
 * period (week/month) snapshots for the Bills view.
 */
import {
  openWaterHisabOfflineDb,
  waterHisabDaySnapshotKey,
  waterHisabPeriodSnapshotKey,
} from '@/lib/utils/waterHisabOfflineDb';

const DAY_STORE = 'daySnapshots';
const PERIOD_STORE = 'periodSnapshots';

/** Snapshots older than 7 days are treated as stale. */
export const WATER_HISAB_SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Write a day-sheet snapshot to IndexedDB.
 * @param {string} businessId
 * @param {string} deliveryDate  YYYY-MM-DD
 * @param {{ products: object[], rows: object[], kpis?: object|null }} data
 */
export async function writeWaterHisabDaySnapshot(businessId, deliveryDate, data) {
  if (!businessId || !deliveryDate) return false;
  const db = await openWaterHisabOfflineDb();
  const record = {
    id: waterHisabDaySnapshotKey(businessId, deliveryDate),
    businessId,
    deliveryDate,
    products: data.products || [],
    rows: data.rows || [],
    kpis: data.kpis || null,
    savedAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAY_STORE, 'readwrite');
    tx.objectStore(DAY_STORE).put(record);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Read a day-sheet snapshot from IndexedDB. Returns null if missing or stale.
 * @param {string} businessId
 * @param {string} deliveryDate
 */
export async function readWaterHisabDaySnapshot(businessId, deliveryDate) {
  if (!businessId || !deliveryDate) return null;
  const db = await openWaterHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAY_STORE, 'readonly');
    const req = tx.objectStore(DAY_STORE).get(waterHisabDaySnapshotKey(businessId, deliveryDate));
    req.onsuccess = () => {
      const row = req.result || null;
      if (!row) { resolve(null); return; }
      const age = Date.now() - new Date(row.savedAt || 0).getTime();
      if (!Number.isFinite(age) || age > WATER_HISAB_SNAPSHOT_TTL_MS) { resolve(null); return; }
      resolve(row);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Write a period (week/month) snapshot to IndexedDB.
 * @param {string} businessId
 * @param {string} period   e.g. "2026-W32" or "2026-08"
 * @param {{ rows: object[], productColumns: object[], label: string, kpis?: object|null }} data
 */
export async function writeWaterHisabPeriodSnapshot(businessId, period, data) {
  if (!businessId || !period) return false;
  const db = await openWaterHisabOfflineDb();
  const record = {
    id: waterHisabPeriodSnapshotKey(businessId, period),
    businessId,
    period,
    rows: data.rows || [],
    productColumns: data.productColumns || [],
    label: data.label || period,
    kpis: data.kpis || null,
    savedAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PERIOD_STORE, 'readwrite');
    tx.objectStore(PERIOD_STORE).put(record);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Read a period snapshot from IndexedDB. Returns null if missing or stale.
 * @param {string} businessId
 * @param {string} period
 */
export async function readWaterHisabPeriodSnapshot(businessId, period) {
  if (!businessId || !period) return null;
  const db = await openWaterHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PERIOD_STORE, 'readonly');
    const req = tx.objectStore(PERIOD_STORE).get(waterHisabPeriodSnapshotKey(businessId, period));
    req.onsuccess = () => {
      const row = req.result || null;
      if (!row) { resolve(null); return; }
      const age = Date.now() - new Date(row.savedAt || 0).getTime();
      if (!Number.isFinite(age) || age > WATER_HISAB_SNAPSHOT_TTL_MS) { resolve(null); return; }
      resolve(row);
    };
    req.onerror = () => reject(req.error);
  });
}

export function isWaterHisabOfflineSnapshotFresh(savedAt) {
  const age = Date.now() - new Date(savedAt || 0).getTime();
  return Number.isFinite(age) && age >= 0 && age <= WATER_HISAB_SNAPSHOT_TTL_MS;
}
