'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { saveWaterHisabDayAction } from '@/lib/actions/standard/waterHisab';
import {
  countPendingWaterHisabDaySaves,
  enqueueWaterHisabDaySave,
  incrementWaterHisabDaySaveAttempt,
  listPendingWaterHisabDaySaves,
  markWaterHisabDaySaveFailed,
  markWaterHisabDaySaveSynced,
  newWaterHisabClientRef,
} from '@/lib/utils/waterHisabOfflineQueue';
import {
  readWaterHisabDaySnapshot,
  writeWaterHisabDaySnapshot,
  readWaterHisabPeriodSnapshot,
  writeWaterHisabPeriodSnapshot,
} from '@/lib/utils/waterHisabOfflineCache';

const MAX_SYNC_ATTEMPTS = 8;

/**
 * Offline detection + day-save queue sync for Water Route Hisab.
 *
 * - `isOnline` always tracks the browser network state.
 * - Queue and cache operations are active only when `enabled` is true.
 * - On reconnect, any pending saves are automatically synced in order.
 * - Day-sheet and period snapshots are written to IndexedDB so riders
 *   can load the current day's sheet from cache when offline.
 *
 * @param {string} businessId
 * @param {{ enabled?: boolean }} options
 */
export function useWaterHisabOffline(businessId, { enabled = false } = {}) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const syncingRef = useRef(false);

  // ─── Network listeners ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ─── Pending count ────────────────────────────────────────────────────────
  const refreshPending = useCallback(async () => {
    if (!businessId || !enabled) {
      setPendingCount(0);
      return;
    }
    try {
      setPendingCount(await countPendingWaterHisabDaySaves(businessId));
    } catch {
      setPendingCount(0);
    }
  }, [businessId, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    void refreshPending();
    return undefined;
  }, [enabled, refreshPending]);

  // ─── Sync pending saves on reconnect ─────────────────────────────────────
  const syncPending = useCallback(async () => {
    if (!businessId || !enabled || syncingRef.current) return { synced: 0, failed: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }
    syncingRef.current = true;
    setIsSyncing(true);
    let synced = 0;
    let failed = 0;
    try {
      const pending = await listPendingWaterHisabDaySaves(businessId);
      for (const row of pending) {
        try {
          const payload = row.payload || {};
          const res = await saveWaterHisabDayAction({
            businessId,
            category: payload.category || row.category,
            deliveryDate: payload.deliveryDate || row.deliveryDate,
            rows: payload.rows || [],
          });
          if (res?.success) {
            await markWaterHisabDaySaveSynced(row.id);
            synced += 1;
          } else {
            const errMsg = res?.error || 'Sync failed';
            const attempts = (row.attempts || 0) + 1;
            if (attempts >= MAX_SYNC_ATTEMPTS) {
              await markWaterHisabDaySaveFailed(row.id, errMsg);
              failed += 1;
            } else {
              await incrementWaterHisabDaySaveAttempt(row.id, errMsg);
            }
          }
        } catch (err) {
          const errMsg = err?.message || 'Sync failed';
          const attempts = (row.attempts || 0) + 1;
          if (attempts >= MAX_SYNC_ATTEMPTS) {
            await markWaterHisabDaySaveFailed(row.id, errMsg);
            failed += 1;
          } else {
            await incrementWaterHisabDaySaveAttempt(row.id, errMsg);
          }
        }
      }
      if (synced > 0) setLastSyncAt(new Date().toISOString());
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await refreshPending();
    }
    return { synced, failed };
  }, [businessId, enabled, refreshPending]);

  // Auto-sync when coming back online and there are pending saves
  useEffect(() => {
    if (!enabled || !isOnline || pendingCount <= 0) return undefined;
    const t = window.setTimeout(() => {
      void syncPending();
    }, 600); // small delay to let connectivity stabilise
    return () => window.clearTimeout(t);
  }, [enabled, isOnline, pendingCount, syncPending]);

  // ─── Offline save queue ───────────────────────────────────────────────────
  const queueDaySave = useCallback(
    async ({ category, deliveryDate, rows }) => {
      if (!businessId || !enabled) {
        throw new Error('Offline water hisab not enabled');
      }
      const clientRef = newWaterHisabClientRef();
      await enqueueWaterHisabDaySave({
        businessId,
        category,
        deliveryDate,
        rows,
        clientRef,
      });
      await refreshPending();
      return { clientRef };
    },
    [businessId, enabled, refreshPending]
  );

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncAt,
    refreshPending,
    syncPending,
    queueDaySave,
    // IndexedDB snapshot helpers — passed directly to the component
    cacheDaySnapshot: writeWaterHisabDaySnapshot,
    readDaySnapshot: readWaterHisabDaySnapshot,
    cachePeriodSnapshot: writeWaterHisabPeriodSnapshot,
    readPeriodSnapshot: readWaterHisabPeriodSnapshot,
  };
}
