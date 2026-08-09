/**
 * IndexedDB for Water Route Hisab offline snapshot + save queue.
 * Separate from milk hisab (tenvo_milk_hisab_offline) and POS (tenvo_pos_offline).
 */

export const WATER_HISAB_OFFLINE_DB_NAME = 'tenvo_water_hisab_offline';
export const WATER_HISAB_OFFLINE_DB_VERSION = 1;

export function openWaterHisabOfflineDb() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(WATER_HISAB_OFFLINE_DB_NAME, WATER_HISAB_OFFLINE_DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Day snapshots for read-back when offline
      if (!db.objectStoreNames.contains('daySnapshots')) {
        db.createObjectStore('daySnapshots', { keyPath: 'id' });
      }
      // Period (week/month) snapshots for bills view
      if (!db.objectStoreNames.contains('periodSnapshots')) {
        db.createObjectStore('periodSnapshots', { keyPath: 'id' });
      }
      // Pending day saves queued while offline
      if (!db.objectStoreNames.contains('daySaves')) {
        const os = db.createObjectStore('daySaves', { keyPath: 'id', autoIncrement: true });
        os.createIndex('businessId', 'businessId', { unique: false });
        os.createIndex('businessDate', 'businessDate', { unique: false });
        os.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

export function waterHisabDaySnapshotKey(businessId, deliveryDate) {
  return `${businessId}::${deliveryDate}`;
}

export function waterHisabPeriodSnapshotKey(businessId, period) {
  return `${businessId}::${period}`;
}

export function waterHisabBusinessDateKey(businessId, deliveryDate) {
  return `${businessId}::${deliveryDate}`;
}
