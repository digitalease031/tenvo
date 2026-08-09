'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Loader2,
  RefreshCw,
  Save,
  FileText,
  Printer,
  Download,
  Bell,
  MessageCircle,
  Mail,
  Receipt,
  Truck,
  ShieldCheck,
  Droplets,
  AlertTriangle,
  Plus,
  CheckCircle2,
  BarChart2,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { formatCurrency } from '@/lib/currency';
import notify from '@/lib/utils/appToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileTabHeader, MobileStatStrip } from '@/components/mobile/MobileTabHeader';
import { HUB_MOBILE_ROOT } from '@/lib/utils/mobileLayout';
import { navigateHubTab } from '@/lib/utils/hubTabNavigation';
import {
  getWaterHisabDayAction,
  saveWaterHisabDayAction,
  getWaterHisabPeriodSummaryAction,
  generateWaterHisabInvoicesAction,
  getWaterHisabBillPrintAction,
  getWaterHisabCustomerDayBreakdownAction,
  getWaterHisabBulkDayBreakdownAction,
  sendWaterHisabReminderAction,
  sendWaterHisabBulkRemindersAction,
  setWaterHisabBillPaymentStatusAction,
  getWaterRiderShiftsAction,
  saveWaterRiderShiftAction,
  deleteWaterRiderShiftAction,
  getWaterBottleFloatIntelligenceAction,
  saveWaterBottleFloatSettingsAction,
  saveWaterHisabSheetSettingsAction,
  getWaterExpenseReportDataAction,
} from '@/lib/actions/standard/waterHisab';
import {
  toWaterHisabDateKey,
  toWaterHisabPeriodKey,
  toWaterHisabWeekKey,
  shortWaterHisabProductLabel,
  buildWaterHisabPeriodKpis,
  isWaterHisabBillRemindable,
  WATER_HISAB_SIZE_GROUPS,
  WATER_HISAB_DEFAULT_ENABLED_SIZES,
  WATER_HISAB_COLUMN_TYPES,
  WATER_HISAB_CHECKLIST_MODES,
} from '@/lib/storefront/waterShopHisab';
import {
  printWaterDailySaleBill,
  printWaterDailySaleBulk,
  printWaterPeriodBill,
  printWaterPeriodBulk,
  printWaterThermalBill,
  printWaterThermalBillFromRow,
  printWaterDeliveryChecklist,
  printWaterAreaList,
  createWaterPeriodPdfBlob,
  printWaterAllCustomersBillSummary,
  resolvePeriodMeta,
} from '@/lib/print/waterHisabThermalBill';
import { downloadStandardInvoicePdfFromRow } from '@/lib/print/clientInvoicePrint';
import { openWhatsAppSmart, shareOrDownloadMilkHisabBillPdf } from '@/lib/storefront/milkShopHisabReminders';
import { MARKETING_STAT_VALUE } from '@/lib/utils/typography';
import { resolveBusinessCountryIso } from '@/lib/utils/businessRegionalContext';

/** Water Route Hisab Phase 1: online-only (offline queue deferred). */
function isWaterHisabOfflineEnabled() {
  return false;
}
function isWaterHisabNetworkFailure() {
  return false;
}
const noopAsync = async () => {};
const syncPendingStub = async () => ({ synced: 0, failed: 0 });
const queueDaySaveStub = async () => {
  throw new Error('Offline hisab not enabled');
};
const readSnapshotStub = async () => null;

/**
 * Milk-compatible offline hook shape. Tracks browser online state so Generate /
 * Remind / bulk print gates work; queue/cache stay no-ops until Phase 1 ships.
 */
function useWaterHisabOffline(_businessId, { enabled: _enabled = false } = {}) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
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

  return {
    isOnline,
    pendingCount: 0,
    isSyncing: false,
    lastSyncAt: null,
    refreshPending: noopAsync,
    syncPending: syncPendingStub,
    queueDaySave: queueDaySaveStub,
    cacheDaySnapshot: noopAsync,
    readDaySnapshot: readSnapshotStub,
    cachePeriodSnapshot: noopAsync,
    readPeriodSnapshot: readSnapshotStub,
  };
}
function WaterHisabOfflineBanner() {
  return null;
}


function todayKey() {
  return toWaterHisabDateKey(new Date());
}

function currentMonth() {
  return toWaterHisabPeriodKey(new Date());
}

function currentWeek() {
  return toWaterHisabWeekKey(new Date());
}

/**
 * Water-delivery Daily Route: daily doorstep grid + week/month 58mm bills.
 * Hub tab key remains `route-hisab`; UI label is Daily Route.
 */
export function WaterRouteHisab({ businessId, category }) {
  const { currency, business, planTier, regionalPack } = useBusiness();
  const handle = business?.handle || business?.domain || category;
  const urduBillsEnabled = resolveBusinessCountryIso(business) === 'PK';
  const offlineEnabled = isWaterHisabOfflineEnabled({
    category: business?.category || category,
    planTier,
    settings: business?.settings,
  });
  const {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncAt,
    syncPending,
    queueDaySave,
    cacheDaySnapshot,
    readDaySnapshot,
    cachePeriodSnapshot,
    readPeriodSnapshot,
  } = useWaterHisabOffline(businessId, { enabled: offlineEnabled });

  const [view, setView] = useState('daily');
  const [billKind, setBillKind] = useState('week');
  const [deliveryDate, setDeliveryDate] = useState(todayKey);
  const [weekPeriod, setWeekPeriod] = useState(currentWeek);
  const [monthPeriod, setMonthPeriod] = useState(currentMonth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [printingId, setPrintingId] = useState(null);
  const [remindingId, setRemindingId] = useState(null);
  const [bulkReminding, setBulkReminding] = useState(false);
  const [bulkPrinting, setBulkPrinting] = useState(false);
  const [paymentBusyId, setPaymentBusyId] = useState(null);
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([]);
  const [billRows, setBillRows] = useState([]);
  const [productColumns, setProductColumns] = useState([]);
  const [periodLabel, setPeriodLabel] = useState('');
  const [dayKpis, setDayKpis] = useState(null);
  const [billKpis, setBillKpis] = useState(null);
  const [filter, setFilter] = useState('');
  const [dayDirty, setDayDirty] = useState(false);
  const [daySnapshotReady, setDaySnapshotReady] = useState(true);
  const [billsFromCache, setBillsFromCache] = useState(false);

  // Rider Shifts & Bottle Float state
  const [riderShifts, setRiderShifts] = useState([]);
  const [riderShiftsSummary, setRiderShiftsSummary] = useState(null);
  const [savedRiders, setSavedRiders] = useState([]);
  const [riderLoading, setRiderLoading] = useState(false);
  const [savingRiderShift, setSavingRiderShift] = useState(false);

  const [bottleSummary, setBottleSummary] = useState(null);
  const [idleCustomers, setIdleCustomers] = useState([]);
  const [bottleLoading, setBottleLoading] = useState(false);
  const [savingBottleSettings, setSavingBottleSettings] = useState(false);
  const [enabledSizeIds, setEnabledSizeIds] = useState([...WATER_HISAB_DEFAULT_ENABLED_SIZES]);
  const [enabledColumns, setEnabledColumns] = useState(['delivered', 'received']);
  const [checklistMode, setChecklistMode] = useState('rider_wise');
  const [savingSizes, setSavingSizes] = useState(false);

  /**
   * Per-product column visibility: { [productId]: { del: boolean, rec: boolean } }
   * Default: 19L Bottle shows Del+Rec; everything else hidden until products load,
   * then auto-defaults are applied in a useEffect.
   */
  const [visibleProductColumns, setVisibleProductColumns] = useState({});

  /**
   * After products load, seed default visibility:
   * - 19L Bottle → del: true, rec: true
   * - All others → del: false, rec: false (hidden by default)
   * If only one product exists, show it.
   */
  useEffect(() => {
    if (!products.length) return;
    setVisibleProductColumns((prev) => {
      // Build defaults for any NEW products not yet in state
      const next = { ...prev };
      let hasAnyVisible = Object.values(next).some((v) => v.del || v.rec);
      for (const p of products) {
        const pid = String(p.id);
        if (next[pid] !== undefined) continue; // already configured
        // Is this a 19L Bottle? (type = bottle, sizeGroup = 19l)
        const is19lBottle =
          p.productType === 'bottle' && p.sizeGroup === '19l';
        // Only one product total → always show it
        const isOnly = products.length === 1;
        const show = isOnly || is19lBottle || (!hasAnyVisible && products.indexOf(p) === 0);
        next[pid] = { del: show, rec: show };
        if (show) hasAnyVisible = true;
      }
      // If nothing ended up visible (e.g. no 19L bottle), show the first product
      const anyVisible = Object.values(next).some((v) => v.del || v.rec);
      if (!anyVisible && products.length) {
        next[String(products[0].id)] = { del: true, rec: true };
      }
      return next;
    });
  }, [products]);
  const [showNewBottles, setShowNewBottles] = useState(true);
  const [savingNewBottleToggle, setSavingNewBottleToggle] = useState(false);
  const [exportingExpensePdf, setExportingExpensePdf] = useState(false);
  const [expenseData, setExpenseData] = useState(null);
  const [expensePeriodKey, setExpensePeriodKey] = useState('monthly');
  const [expenseLoading, setExpenseLoading] = useState(false);

  const handleExportExpenseReportPdf = async (periodKey) => {
    if (!periodKey || !businessId) return;
    setExportingExpensePdf(true);
    try {
      const res = await getWaterExpenseReportDataAction({
        businessId,
        category,
        periodKey,
        deliveryDate,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Failed to fetch expense report data');
        return;
      }

      const { generateExpenseReportPdf } = await import('@/lib/pdf/expenseReportPdf');
      const doc = generateExpenseReportPdf({
        business: res.business || business || {},
        currency,
        locale: regionalPack?.locale || 'en-US',
        periodKey: res.periodKey,
        periodLabel: res.periodLabel,
        dateFrom: res.dateFrom,
        dateTo: res.dateTo,
        expenses: res.expenses || [],
      });

      const filename = `Expense_Report_${periodKey}_${res.dateTo || 'date'}.pdf`;
      doc.save(filename);
      notify.compactSave(`Downloaded ${res.periodLabel} (${res.expenseCount || 0} expenses)`);
    } catch (e) {
      console.error('handleExportExpenseReportPdf', e);
      notify.error(e?.message || 'Failed to generate expense PDF report');
    } finally {
      setExportingExpensePdf(false);
    }
  };
  const [bottleForm, setBottleForm] = useState({
    plantFull: 0,
    plantEmpty: 0,
    damagedScrapped: 0,
    bottleUnitCost: 1200,
  });

  const billingPeriod = billKind === 'week' ? weekPeriod : monthPeriod;

  const loadDay = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setDaySnapshotReady(true);
    try {
      if (offlineEnabled && typeof navigator !== 'undefined' && !navigator.onLine) {
        const snap = await readDaySnapshot(businessId, deliveryDate);
        if (!snap) {
          setRows([]);
          setProducts([]);
          setDayKpis(null);
          setDaySnapshotReady(false);
          notify.error('No offline copy of this day. Open it once while online.');
          return;
        }
        setProducts(snap.products || []);
        setRows(snap.rows || []);
        setDayKpis(snap.kpis || null);
        setDayDirty(false);
        setDaySnapshotReady(true);
        return;
      }

      const res = await getWaterHisabDayAction({
        businessId,
        category,
        deliveryDate,
      });
      if (!res?.success) {
        // Network/action failure: try snapshot
        if (offlineEnabled) {
          const snap = await readDaySnapshot(businessId, deliveryDate);
          if (snap) {
            setProducts(snap.products || []);
            setRows(snap.rows || []);
            setDayKpis(snap.kpis || null);
            setDayDirty(false);
            setDaySnapshotReady(true);
            notify.compactSave('Loaded offline day sheet copy');
            return;
          }
        }
        notify.error(res?.error || 'Failed to load day sheet');
        setRows([]);
        setProducts([]);
        setDayKpis(null);
        setDaySnapshotReady(false);
        return;
      }
      setProducts(res.products || []);
      setRows(res.rows || []);
      setDayKpis(res.kpis || null);
      if (Array.isArray(res.enabledSizeIds) && res.enabledSizeIds.length) {
        setEnabledSizeIds(res.enabledSizeIds);
      }
      if (Array.isArray(res.enabledColumns) && res.enabledColumns.length) {
        setEnabledColumns(res.enabledColumns);
      }
      if (res.checklistMode) {
        setChecklistMode(res.checklistMode);
      }
      setDayDirty(false);
      setDaySnapshotReady(true);
      if (offlineEnabled) {
        try {
          await cacheDaySnapshot(businessId, deliveryDate, {
            products: res.products || [],
            rows: res.rows || [],
            kpis: res.kpis || null,
          });
        } catch {
          /* IndexedDB optional */
        }
      }
    } catch (e) {
      if (offlineEnabled) {
        try {
          const snap = await readDaySnapshot(businessId, deliveryDate);
          if (snap) {
            setProducts(snap.products || []);
            setRows(snap.rows || []);
            setDayKpis(snap.kpis || null);
            setDayDirty(false);
            setDaySnapshotReady(true);
            notify.compactSave('Loaded offline day sheet copy');
            return;
          }
        } catch {
          /* ignore */
        }
      }
      notify.error(e?.message || 'Failed to load day sheet');
      setDaySnapshotReady(false);
    } finally {
      setLoading(false);
    }
  }, [
    businessId,
    category,
    deliveryDate,
    offlineEnabled,
    readDaySnapshot,
    cacheDaySnapshot,
  ]);

  const loadBills = useCallback(async () => {
    if (!businessId || !billingPeriod) return;
    setLoading(true);
    setBillsFromCache(false);
    try {
      if (offlineEnabled && typeof navigator !== 'undefined' && !navigator.onLine) {
        const snap = await readPeriodSnapshot(businessId, billingPeriod);
        if (!snap) {
          setBillRows([]);
          setProductColumns([]);
          setPeriodLabel('');
          setBillKpis(null);
          notify.error('No offline bill summary for this period. Open it once while online.');
          return;
        }
        setBillRows(snap.rows || []);
        setProductColumns(snap.productColumns || []);
        setPeriodLabel(snap.label || billingPeriod);
        setBillKpis(snap.kpis || buildWaterHisabPeriodKpis(snap.rows || []));
        setBillsFromCache(true);
        return;
      }

      const res = await getWaterHisabPeriodSummaryAction({
        businessId,
        category,
        period: billingPeriod,
      });
      if (!res?.success) {
        if (offlineEnabled) {
          const snap = await readPeriodSnapshot(businessId, billingPeriod);
          if (snap) {
            setBillRows(snap.rows || []);
            setProductColumns(snap.productColumns || []);
            setPeriodLabel(snap.label || billingPeriod);
            setBillKpis(snap.kpis || buildWaterHisabPeriodKpis(snap.rows || []));
            setBillsFromCache(true);
            notify.compactSave('Loaded offline bill summary');
            return;
          }
        }
        notify.error(res?.error || 'Failed to load bill summary');
        setBillRows([]);
        setProductColumns([]);
        setPeriodLabel('');
        setBillKpis(null);
        return;
      }
      setBillRows(res.rows || []);
      setProductColumns(res.productColumns || []);
      setPeriodLabel(res.label || billingPeriod);
      setBillKpis(res.kpis || buildWaterHisabPeriodKpis(res.rows || []));
      if (offlineEnabled) {
        try {
          await cachePeriodSnapshot(businessId, billingPeriod, {
            rows: res.rows || [],
            productColumns: res.productColumns || [],
            label: res.label || billingPeriod,
            kpis: res.kpis || null,
          });
        } catch {
          /* optional */
        }
      }
    } catch (e) {
      if (offlineEnabled) {
        try {
          const snap = await readPeriodSnapshot(businessId, billingPeriod);
          if (snap) {
            setBillRows(snap.rows || []);
            setProductColumns(snap.productColumns || []);
            setPeriodLabel(snap.label || billingPeriod);
            setBillKpis(snap.kpis || buildWaterHisabPeriodKpis(snap.rows || []));
            setBillsFromCache(true);
            notify.compactSave('Loaded offline bill summary');
            return;
          }
        } catch {
          /* ignore */
        }
      }
      notify.error(e?.message || 'Failed to load bill summary');
    } finally {
      setLoading(false);
    }
  }, [
    businessId,
    category,
    billingPeriod,
    offlineEnabled,
    readPeriodSnapshot,
    cachePeriodSnapshot,
  ]);

  const loadRiderShifts = useCallback(async () => {
    if (!businessId) return;
    setRiderLoading(true);
    try {
      const res = await getWaterRiderShiftsAction({
        businessId,
        category,
        deliveryDate,
      });
      if (res?.success) {
        setRiderShifts(res.shifts || []);
        setRiderShiftsSummary(res.summary || null);
        if (Array.isArray(res.savedRiders)) {
          setSavedRiders(res.savedRiders);
        }
      }
    } catch (e) {
      console.error('loadRiderShifts', e);
    } finally {
      setRiderLoading(false);
    }
  }, [businessId, category, deliveryDate]);

  const handleSaveRiderShift = async (shiftData) => {
    setSavingRiderShift(true);
    try {
      const res = await saveWaterRiderShiftAction({
        businessId,
        category,
        deliveryDate,
        shiftData,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Failed to save rider shift');
        return;
      }
      notify.compactSave('Rider shift load-out saved');
      await loadRiderShifts();
    } catch (e) {
      notify.error(e?.message || 'Failed to save rider shift');
    } finally {
      setSavingRiderShift(false);
    }
  };

  const handleDeleteRiderShift = async (shiftId) => {
    if (!shiftId || !businessId) return;
    setSavingRiderShift(true);
    try {
      const res = await deleteWaterRiderShiftAction({
        businessId,
        category,
        deliveryDate,
        shiftId,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Failed to delete rider shift');
        return;
      }
      notify.compactSave('Rider shift record deleted');
      await loadRiderShifts();
    } catch (e) {
      notify.error(e?.message || 'Failed to delete rider shift');
    } finally {
      setSavingRiderShift(false);
    }
  };

  const handlePrintRiderChecklist = async (shift, selectedArea, mode = 'print', paperSize = '58mm') => {
    if (!shift) return;
    const allRows = rows || [];
    let list = allRows;
    const area = String(selectedArea || '').trim();

    // Apply filtering only if checklistMode is 'rider_wise'
    if (checklistMode === 'rider_wise') {
      if (area && area !== 'ALL') {
        const filtered = allRows.filter((r) => {
          const rArea = String(r.routeLabel || '').trim().toLowerCase();
          return rArea === area.toLowerCase() || rArea.includes(area.toLowerCase());
        });
        if (filtered.length) {
          list = filtered;
        } else {
          notify.error(`No customer stops found matching area "${area}" on today's sheet`);
          return;
        }
      }
    }
    // If checklistMode is 'full_list', always use all rows (no filtering)

    if (!list.length) {
      notify.error('No route customers loaded for today yet');
      return;
    }

    setBulkPrinting(true);
    try {
      const routeTitle = checklistMode === 'full_list' 
        ? 'All Customers (Full List)'
        : (area && area !== 'ALL' ? area : (shift.routeLabel || 'All Areas'));
      const ok = await printWaterDeliveryChecklist(
        {
          business: thermalBusiness,
          rows: list,
          products,
          deliveryDate,
          riderName: shift.riderName || 'Rider',
          routeLabel: routeTitle,
          vehicleNo: shift.vehicleNo || '',
          paperSize,
        },
        mode
      );
      if (!ok) {
        notify.error('Could not print delivery checklist');
        return;
      }
      const modeLabel = checklistMode === 'full_list' ? ' (Full List)' : '';
      notify.compactSave(
        mode === 'print'
          ? `Checklist for ${shift.riderName} [${routeTitle}]${modeLabel} (${paperSize}) sent to printer`
          : `Checklist PDF for ${shift.riderName} [${routeTitle}]${modeLabel} (${paperSize}) downloaded`
      );
    } catch (e) {
      notify.error(e?.message || 'Delivery checklist print failed');
    } finally {
      setBulkPrinting(false);
    }
  };

  const handlePrintRiderAreaList = async (shift, selectedArea, paperSize = 'A4') => {
    if (!shift) return;
    const allRows = rows || [];
    let list = allRows;
    const area = String(selectedArea || '').trim();

    // Apply filtering only if checklistMode is 'rider_wise'
    if (checklistMode === 'rider_wise') {
      if (area && area !== 'ALL') {
        const filtered = allRows.filter((r) => {
          const rArea = String(r.routeLabel || '').trim().toLowerCase();
          return rArea === area.toLowerCase() || rArea.includes(area.toLowerCase());
        });
        if (filtered.length) {
          list = filtered;
        } else {
          notify.error(`No customer stops found matching area "${area}" on today's sheet`);
          return;
        }
      }
    }
    // If checklistMode is 'full_list', always use all rows (no filtering)

    if (!list.length) {
      notify.error('No route customers loaded for today yet');
      return;
    }

    setBulkPrinting(true);
    try {
      const routeTitle = checklistMode === 'full_list'
        ? 'All Customers (Full List)'
        : (area && area !== 'ALL' ? area : (shift.routeLabel || 'All Areas'));
      const ok = await printWaterAreaList(
        {
          business: thermalBusiness,
          rows: list,
          products,
          deliveryDate,
          riderName: shift.riderName || 'Rider',
          routeLabel: routeTitle,
          vehicleNo: shift.vehicleNo || '',
          paperSize,
        },
        'print'
      );
      if (!ok) {
        notify.error('Could not open area list');
        return;
      }
      const modeLabel = checklistMode === 'full_list' ? ' (Full List)' : '';
      notify.compactSave(`Area list for ${shift.riderName} [${routeTitle}]${modeLabel} (${paperSize}) opened for print`);
    } catch (e) {
      notify.error(e?.message || 'Area list print failed');
    } finally {
      setBulkPrinting(false);
    }
  };

  const loadBottleIntelligence = useCallback(async () => {
    if (!businessId) return;
    setBottleLoading(true);
    try {
      const res = await getWaterBottleFloatIntelligenceAction({
        businessId,
        category,
      });
      if (res?.success) {
        setBottleSummary(res.summary || null);
        setIdleCustomers(res.idleCustomers || []);
        if (res.summary) {
          setBottleForm({
            plantFull: res.summary.plantFull,
            plantEmpty: res.summary.plantEmpty,
            damagedScrapped: res.summary.damagedScrapped,
            bottleUnitCost: res.summary.bottleUnitCost,
          });
        }
      }
    } catch (e) {
      console.error('loadBottleIntelligence', e);
    } finally {
      setBottleLoading(false);
    }
  }, [businessId, category]);

  const loadExpenses = useCallback(async (periodKey) => {
    if (!businessId) {
      console.warn('[WaterHisab] loadExpenses: no businessId');
      return;
    }
    setExpenseLoading(true);
    setExpenseData(null); // Clear old data
    try {
      const res = await getWaterExpenseReportDataAction({
        businessId,
        category,
        periodKey: periodKey || expensePeriodKey,
        deliveryDate,
      });
      if (res?.success) {
        setExpenseData(res);
      } else {
        console.error('[WaterHisab] loadExpenses failed:', res?.error);
        notify.error(res?.error || 'Failed to load expenses');
      }
    } catch (e) {
      console.error('[WaterHisab] loadExpenses exception:', e);
      notify.error('Error loading expenses: ' + (e?.message || 'Unknown error'));
    } finally {
      setExpenseLoading(false);
    }
  }, [businessId, category, expensePeriodKey, deliveryDate]);

  const handleSaveBottleSettings = async (formData) => {
    setSavingBottleSettings(true);
    try {
      const res = await saveWaterBottleFloatSettingsAction({
        businessId,
        category,
        ...formData,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Failed to save bottle inventory');
        return;
      }
      notify.compactSave('Plant bottle inventory updated');
      await loadBottleIntelligence();
    } catch (e) {
      notify.error(e?.message || 'Failed to save bottle inventory');
    } finally {
      setSavingBottleSettings(false);
    }
  };

  const toggleSheetSize = async (sizeId) => {
    if (!businessId || savingSizes) return;
    const id = String(sizeId);
    const currentlyOn = enabledSizeIds.includes(id);
    let next = currentlyOn
      ? enabledSizeIds.filter((s) => s !== id)
      : [...enabledSizeIds, id];
    if (!next.length) {
      notify.error('Keep at least one sheet size enabled');
      return;
    }
    setSavingSizes(true);
    setEnabledSizeIds(next);
    try {
      const res = await saveWaterHisabSheetSettingsAction({
        businessId,
        category,
        enabledSizeIds: next,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Failed to update sheet sizes');
        await loadDay();
        return;
      }
      setEnabledSizeIds(res.enabledSizeIds || next);
      const sizes = res.enabledSizeIds || next;
      notify.compactSave(
        sizes.length === 1 && sizes[0] === '19l' ? 'Sheet set to 19L only' : 'Sheet sizes updated'
      );
      await loadDay();
    } catch (e) {
      notify.error(e?.message || 'Failed to update sheet sizes');
      await loadDay();
    } finally {
      setSavingSizes(false);
    }
  };

  const toggleSheetColumn = async (columnId) => {
    if (!businessId || savingSizes) return;
    const id = String(columnId);
    const currentlyOn = enabledColumns.includes(id);
    let next = currentlyOn
      ? enabledColumns.filter((c) => c !== id)
      : [...enabledColumns, id];
    if (!next.length) {
      notify.error('Keep at least one column type enabled');
      return;
    }
    setSavingSizes(true);
    setEnabledColumns(next);
    try {
      const res = await saveWaterHisabSheetSettingsAction({
        businessId,
        category,
        enabledColumns: next,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Failed to update column visibility');
        await loadDay();
        return;
      }
      setEnabledColumns(res.enabledColumns || next);
      notify.compactSave('Column visibility updated');
      await loadDay();
    } catch (e) {
      notify.error(e?.message || 'Failed to update columns');
      await loadDay();
    } finally {
      setSavingSizes(false);
    }
  };

  const toggleChecklistMode = async () => {
    if (!businessId || savingSizes) return;
    const nextMode = checklistMode === 'rider_wise' ? 'full_list' : 'rider_wise';
    setSavingSizes(true);
    setChecklistMode(nextMode);
    try {
      const res = await saveWaterHisabSheetSettingsAction({
        businessId,
        category,
        checklistMode: nextMode,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Failed to update checklist mode');
        setChecklistMode(checklistMode); // revert
        return;
      }
      setChecklistMode(res.checklistMode || nextMode);
      notify.compactSave(
        nextMode === 'full_list' 
          ? 'Checklist mode: Print full list (no rider filter)'
          : 'Checklist mode: Filter by rider'
      );
    } catch (e) {
      notify.error(e?.message || 'Failed to update checklist mode');
      setChecklistMode(checklistMode); // revert
    } finally {
      setSavingSizes(false);
    }
  };

  /**
   * Toggle Del or Rec visibility for a specific product column.
   * At least one product×field must stay visible to avoid a blank sheet.
   * @param {string} productId
   * @param {'del'|'rec'} field
   */
  const toggleProductColumnVisibility = (productId, field) => {
    setVisibleProductColumns((prev) => {
      const pid = String(productId);
      const cur = prev[pid] || { del: false, rec: false };
      const next = { ...prev, [pid]: { ...cur, [field]: !cur[field] } };
      // Guard: at least one cell must remain visible
      const anyVisible = Object.values(next).some((v) => v.del || v.rec);
      if (!anyVisible) return prev; // revert silently
      return next;
    });
  };

  useEffect(() => {
    if (view === 'daily') void loadDay();
    else if (view === 'bills') void loadBills();
    else if (view === 'rider-shifts') void loadRiderShifts();
    else if (view === 'bottle-control') void loadBottleIntelligence();
    else if (view === 'expenses') void loadExpenses();
  }, [view, loadDay, loadBills, loadRiderShifts, loadBottleIntelligence, loadExpenses]);

  // After background sync lands, refresh the visible sheet from the server.
  useEffect(() => {
    if (!offlineEnabled || !lastSyncAt || !isOnline) return;
    if (view === 'daily') void loadDay();
    else void loadBills();
  }, [lastSyncAt]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: reload only on sync timestamp

  useEffect(() => {
    if (!dayDirty || view !== 'daily') return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dayDirty, view]);

  const visibleRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter(
        (r) =>
          String(r.customerName || '').toLowerCase().includes(q) ||
          String(r.houseNo || '').toLowerCase().includes(q) ||
          String(r.routeLabel || '').toLowerCase().includes(q) ||
          String(r.accountNo || '').toLowerCase().includes(q) ||
          String(r.townCode || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const houseCmp = String(a.houseNo || '').localeCompare(String(b.houseNo || ''), undefined, {
        numeric: true,
      });
      if (houseCmp !== 0) return houseCmp;
      return String(a.customerName || '').localeCompare(String(b.customerName || ''));
    });
  }, [rows, filter]);

  const visibleBillRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return billRows;
    return billRows.filter(
      (r) =>
        String(r.customerName || '').toLowerCase().includes(q) ||
        String(r.houseNo || '').toLowerCase().includes(q) ||
        String(r.accountNo || '').toLowerCase().includes(q) ||
        String(r.townCode || '').toLowerCase().includes(q)
    );
  }, [billRows, filter]);

  const dayTotal = useMemo(() => {
    let amount = 0;
    let cash = 0;
    let del = 0;
    let rec = 0;
    for (const row of rows) {
      const rate =
        Number(row.productRate) > 0
          ? Number(row.productRate)
          : null;
      for (const p of products) {
        const qty = Number(row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id]) || 0;
        const unit = rate != null ? rate : Number(p.price) || 0;
        amount += qty * unit;
        del += qty;
        rec += Number(row.recByProduct?.[String(p.id)] ?? row.recByProduct?.[p.id]) || 0;
      }
      amount -= Number(row.specialDiscount) || 0;
      cash += Number(row.cashCollected) || 0;
    }
    return {
      amount: Math.max(0, Math.round(amount * 100) / 100),
      cash: Math.round(cash * 100) / 100,
      del: Math.round(del * 1000) / 1000,
      rec: Math.round(rec * 1000) / 1000,
    };
  }, [rows, products]);

  const liveBillKpis = useMemo(() => buildWaterHisabPeriodKpis(billRows), [billRows]);

  const dayStatItems = useMemo(() => {
    let deliveredLive = 0;
    let housesSetLive = 0;
    for (const row of rows) {
      if (Object.values(row.qtyByProduct || {}).some((q) => Number(q) > 0)) deliveredLive += 1;
      if (String(row.houseNo || '').trim()) housesSetLive += 1;
    }
    const onRoute = rows.length;
    const pending = Math.max(0, onRoute - deliveredLive);
    return [
      {
        label: 'On route',
        value: onRoute,
        hint: 'Accounts today',
      },
      {
        label: 'Del bottles',
        value: dayTotal.del,
        valueTone: 'text-sky-700',
        hint: 'Delivered',
      },
      {
        label: 'Rec empties',
        value: dayTotal.rec,
        hint: 'Empty return',
      },
      {
        label: 'Sale total',
        value: formatCurrency(dayTotal.amount, currency),
        valueTone: 'text-gray-900',
      },
      {
        label: 'Cash recovery',
        value: formatCurrency(dayTotal.cash, currency),
        valueTone: 'text-emerald-700',
        hint: 'Collected today',
      },
      {
        label: 'Pending',
        value: pending,
        valueTone: pending ? 'text-amber-700' : 'text-gray-900',
        hint: `${housesSetLive} houses set`,
        alert: pending > 0 && deliveredLive > 0,
      },
    ];
  }, [rows, dayTotal, currency]);

  const billStatItems = useMemo(
    () => [
      {
        label: 'Customers',
        value: liveBillKpis.customers || 0,
        hint: periodLabel || 'This period',
      },
      {
        label: 'Period total',
        value: formatCurrency(liveBillKpis.totalAmount || 0, currency),
      },
      {
        label: 'Unbilled',
        value: formatCurrency(liveBillKpis.unbilledAmount || 0, currency),
        valueTone: liveBillKpis.unbilledCount ? 'text-amber-700' : 'text-gray-900',
        hint: `${liveBillKpis.unbilledCount || 0} to generate`,
        alert: (liveBillKpis.unbilledCount || 0) > 0,
      },
      {
        label: 'Unpaid',
        value: formatCurrency(liveBillKpis.unpaidAmount || 0, currency),
        valueTone: liveBillKpis.unpaidCount ? 'text-rose-700' : 'text-gray-900',
        hint: `${liveBillKpis.unpaidCount || 0} open`,
        alert: (liveBillKpis.unpaidCount || 0) > 0,
      },
      {
        label: 'Paid',
        value: formatCurrency(liveBillKpis.paidAmount || 0, currency),
        valueTone: 'text-emerald-700',
        hint: `${liveBillKpis.paidCount || 0} collected`,
      },
      {
        label: 'Stops',
        value: liveBillKpis.deliveryDays || 0,
        hint: 'Delivery days logged',
      },
    ],
    [liveBillKpis, currency, periodLabel]
  );

  const riderStatItems = useMemo(() => {
    if (!riderShifts.length && !riderShiftsSummary) return [];
    const s = riderShiftsSummary || {};
    return [
      { label: 'Riders today', value: Number(s.totalRiders || riderShifts.length || 0), hint: 'Active shifts' },
      { label: 'Bottles loaded', value: Number(s.totalBottlesLoaded || 0), valueTone: 'text-sky-700' },
      { label: 'Bottles returned', value: Number(s.totalBottlesReturned || 0) },
      { label: 'Cash collected', value: formatCurrency(Number(s.totalCashCollected || 0), currency), valueTone: 'text-emerald-700' },
      { label: 'Shortage', value: formatCurrency(Number(s.totalCashShortage || 0), currency), valueTone: Number(s.totalCashShortage || 0) > 0 ? 'text-rose-700' : 'text-gray-900', alert: Number(s.totalCashShortage || 0) > 0 },
    ];
  }, [riderShifts, riderShiftsSummary, currency]);

  const bottleStatItems = useMemo(() => {
    if (!bottleSummary) return [];
    const s = bottleSummary || {};
    return [
      { label: 'Total owned', value: Number(s.totalOwned || 0), hint: 'Full asset count' },
      { label: 'Full (plant)', value: Number(s.fullAtPlant || 0), valueTone: 'text-sky-700' },
      { label: 'With customers', value: Number(s.withCustomers || 0), hint: 'Deposits outstanding' },
      { label: 'With riders', value: Number(s.withRiders || 0) },
      { label: 'Empty (plant)', value: Number(s.emptyAtPlant || 0) },
      { label: 'Idle risk', value: Number(s.idleRisk || idleCustomers.length || 0), valueTone: Number(s.idleRisk || idleCustomers.length || 0) > 0 ? 'text-amber-700' : 'text-gray-900', alert: (idleCustomers.length || 0) > 0, hint: 'No delivery 14+ days' },
    ];
  }, [bottleSummary, idleCustomers, currency]);

  const expenseStatItems = useMemo(() => {
    if (!expenseData) return [];
    const total = expenseData.totalAmount || 0;
    const expenses = expenseData.expenses || [];
    // Build top category for hint
    const catMap = {};
    expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    return [
      { label: 'Total Expenses', value: formatCurrency(total, currency), valueTone: total > 0 ? 'text-rose-700' : 'text-gray-900', hint: expenseData.periodLabel || '' },
      { label: 'Transactions', value: expenseData.expenseCount || 0, hint: expenseData.dateFrom ? `${expenseData.dateFrom} to ${expenseData.dateTo}` : '' },
      { label: 'Top Category', value: topCat ? topCat[0] : 'None', hint: topCat ? formatCurrency(topCat[1], currency) : 'No expenses recorded' },
      { label: 'Period', value: expensePeriodKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), hint: 'Selected range' },
    ];
  }, [expenseData, currency, expensePeriodKey]);

  const updateQty = (customerId, productId, value) => {
    const next = value === '' ? '' : value;
    const pid = String(productId);
    setDayDirty(true);
    setRows((prev) =>
      prev.map((r) => {
        if (String(r.customerId) !== String(customerId)) return r;
        return {
          ...r,
          qtyByProduct: {
            ...r.qtyByProduct,
            [pid]: next === '' ? '' : Number(next),
          },
        };
      })
    );
  };

  const updateRec = (customerId, productId, value) => {
    const next = value === '' ? '' : value;
    const pid = String(productId);
    setDayDirty(true);
    setRows((prev) =>
      prev.map((r) => {
        if (String(r.customerId) !== String(customerId)) return r;
        return {
          ...r,
          recByProduct: {
            ...(r.recByProduct || {}),
            [pid]: next === '' ? '' : Number(next),
          },
        };
      })
    );
  };

  const updateRowField = (customerId, field, value) => {
    setDayDirty(true);
    setRows((prev) =>
      prev.map((r) => (r.customerId === customerId ? { ...r, [field]: value } : r))
    );
  };

  const buildDayPayloadRows = () =>
    rows.map((r) => {
      const qtyByProduct = {};
      const recByProduct = {};
      for (const [pid, raw] of Object.entries(r.qtyByProduct || {})) {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) qtyByProduct[String(pid)] = n;
      }
      for (const [pid, raw] of Object.entries(r.recByProduct || {})) {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) recByProduct[String(pid)] = n;
      }
      return {
        customerId: r.customerId,
        houseNo: r.houseNo,
        floorFlat: r.floorFlat,
        routeLabel: r.routeLabel,
        accountNo: r.accountNo,
        townCode: r.townCode,
        productRate: r.productRate,
        notes: r.notes,
        cashCollected: Number(r.cashCollected) || 0,
        specialDiscount: Number(r.specialDiscount) || 0,
        qtyByProduct,
        recByProduct,
      };
    });

  const queueAndCacheDay = async (payloadRows) => {
    await queueDaySave({
      category,
      deliveryDate,
      rows: payloadRows,
    });
    try {
      await cacheDaySnapshot(businessId, deliveryDate, {
        products,
        rows,
        kpis: dayKpis,
      });
    } catch {
      /* optional */
    }
    setDayDirty(false);
  };

  const handleSaveDay = async () => {
    if (offlineEnabled && !isOnline && !daySnapshotReady) {
      notify.error('Cannot save offline without a cached day sheet');
      return;
    }
    setSaving(true);
    try {
      const payloadRows = buildDayPayloadRows();

      if (offlineEnabled && !isOnline) {
        await queueAndCacheDay(payloadRows);
        notify.compactSave('Day sheet saved offline — will sync when online');
        return;
      }

      const res = await saveWaterHisabDayAction({
        businessId,
        category,
        deliveryDate,
        rows: payloadRows,
      });
      if (!res?.success) {
        // Only queue on transport failures — never hide validation/auth errors.
        if (offlineEnabled && isWaterHisabNetworkFailure(null, res?.error || res?.code || '')) {
          await queueAndCacheDay(payloadRows);
          notify.compactSave('Save queued offline — will sync when connection is stable');
          return;
        }
        notify.error(res?.error || 'Save failed');
        return;
      }
      notify.compactSave('Day sheet saved');
      await loadDay();
    } catch (e) {
      if (offlineEnabled && isWaterHisabNetworkFailure(e)) {
        try {
          await queueAndCacheDay(buildDayPayloadRows());
          notify.compactSave('Save queued offline — will sync when online');
          return;
        } catch (queueErr) {
          notify.error(queueErr?.message || e?.message || 'Save failed');
          return;
        }
      }
      notify.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInvoices = async () => {
    if (!isOnline) {
      notify.error('Connect to the internet to generate bills');
      return;
    }
    setGenerating(true);
    try {
      const res = await generateWaterHisabInvoicesAction({
        businessId,
        category,
        period: billingPeriod,
      });
      // Always refresh so partial creates show invoice numbers
      await loadBills();
      if (!res?.success) {
        notify.error(res?.error || 'Bill generation failed');
        return;
      }
      const created = res.created?.length || 0;
      const skipped = res.skipped?.length || 0;
      const failed = res.failed?.length || 0;
      const paidPending = (res.created || []).filter((c) => c.hisabPaidPending).length;
      const kindLabel = billKind === 'week' ? 'weekly' : 'monthly';
      if (created) {
        notify.compactSave(
          `Created ${created} ${kindLabel} bill${created === 1 ? '' : 's'}${skipped ? ` · ${skipped} skipped` : ''}${failed ? ` · ${failed} failed` : ''}`
        );
      } else if (failed) {
        notify.error(res.failed[0]?.reason || 'Bill generation failed');
      } else if (skipped) {
        notify.compactSave(`No new bills (${skipped} already billed or empty)`);
      } else {
        notify.compactSave('No deliveries to bill in this period');
      }
      if (failed && created) {
        notify.error(`${failed} customer bill${failed === 1 ? '' : 's'} failed: ${res.failed[0]?.reason || 'error'}`);
      }
      if (paidPending) {
        notify.error(
          `${paidPending} paid hisab bill${paidPending === 1 ? '' : 's'} need Mark paid again on the invoice`
        );
      }
    } catch (e) {
      await loadBills();
      notify.error(e?.message || 'Bill generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const thermalBusiness = useMemo(
    () => ({
      ...(business || {}),
      business_name:
        business?.business_name || business?.name || business?.businessName || 'Water supply',
      category: business?.category || category,
    }),
    [business, category]
  );

  const handlePrintBill = async (row, mode = 'print', billLocale = 'en') => {
    if (!row || !(Number(row.amount) > 0 || row.invoiceId)) {
      notify.error('No billable amount for this customer');
      return;
    }
    const localeKey = billLocale === 'ur' && urduBillsEnabled ? 'ur' : 'en';
    if (billLocale === 'ur' && !urduBillsEnabled) {
      notify.error('Urdu bills are only available for Pakistan businesses');
      return;
    }
    const printKey = `${row.invoiceId || row.customerId}:${mode}:${localeKey}`;
    setPrintingId(printKey);
    try {
      if (!isOnline) {
        const ok = await printWaterThermalBillFromRow(
          {
            business: thermalBusiness,
            row,
            productColumns,
            period: billingPeriod,
            periodLabel,
            category,
          },
          mode
        );
        if (!ok) {
          notify.error(mode === 'pdf' ? 'PDF download failed' : 'Print dialog could not open');
          return;
        }
        notify.compactSave(mode === 'pdf' ? '58mm totals PDF downloaded' : '58mm totals sent to printer');
        return;
      }

      if (row.customerId && billingPeriod) {
        const dayRes = await getWaterHisabCustomerDayBreakdownAction({
          businessId,
          category,
          customerId: row.customerId,
          period: billingPeriod,
        });
        if (dayRes?.success && dayRes.breakdown?.days?.length) {
          const ok = await printWaterPeriodBill(
            {
              business: thermalBusiness,
              breakdown: dayRes.breakdown,
              customerName: dayRes.customerName || row.customerName || 'Customer',
              houseNo: dayRes.houseNo || row.houseNo || '',
              floorFlat: dayRes.floorFlat || row.floorFlat || '',
              accountNo: dayRes.accountNo || row.accountNo || '',
              townCode: dayRes.townCode || row.townCode || '',
              cashCollected: dayRes.cashCollected ?? row.cashCollected ?? 0,
              specialDiscount: dayRes.specialDiscount || 0,
              delTotal: dayRes.delTotal || 0,
              recTotal: dayRes.recTotal || 0,
              bottleBalance: dayRes.bottleBalance ?? row.bottleBalance,
              period: dayRes.period || billingPeriod,
              periodLabel: dayRes.label || periodLabel,
              invoiceNumber: dayRes.invoiceNumber || row.invoiceNumber || '',
              grandTotal: dayRes.amount ?? row.amount ?? 0,
              paymentStatus: dayRes.paymentStatus || row.paymentStatus || 'unpaid',
              productMeta: dayRes.productMeta || row.productMeta || {},
              billLocale: localeKey,
            },
            mode
          );
          if (!ok) {
            notify.error(mode === 'pdf' ? 'PDF download failed' : 'Print dialog could not open');
            return;
          }
          notify.compactSave(
            mode === 'pdf'
              ? `${billKind === 'week' ? 'Weekly' : 'Monthly'} 58mm bill downloaded`
              : `${billKind === 'week' ? 'Weekly' : 'Monthly'} 58mm bill sent to printer`
          );
          return;
        }
      }

      if (row.invoiceId) {
        const res = await getWaterHisabBillPrintAction({
          businessId,
          category,
          invoiceId: row.invoiceId,
        });
        if (!res?.success) {
          const ok = await printWaterThermalBillFromRow(
            {
              business: thermalBusiness,
              row,
              productColumns,
              period: billingPeriod,
              periodLabel,
              category,
            },
            mode
          );
          if (!ok) {
            notify.error(mode === 'pdf' ? 'PDF download failed' : 'Print dialog could not open');
            return;
          }
          notify.compactSave('Printed totals from bills row');
          return;
        }
        const ok = await printWaterThermalBill(
          {
            business: thermalBusiness,
            invoice: res.invoice,
            items: res.items || [],
            houseNo: res.houseNo || row.houseNo || '',
            period: res.period || billingPeriod,
            periodLabel: res.periodLabel || periodLabel,
            category,
          },
          mode
        );
        if (!ok) {
          notify.error(mode === 'pdf' ? 'PDF download failed' : 'Print dialog could not open');
          return;
        }
      } else {
        const ok = await printWaterThermalBillFromRow(
          {
            business: thermalBusiness,
            row,
            productColumns,
            period: billingPeriod,
            periodLabel,
            category,
          },
          mode
        );
        if (!ok) {
          notify.error(mode === 'pdf' ? 'PDF download failed' : 'Print dialog could not open');
          return;
        }
      }
      notify.compactSave(mode === 'pdf' ? '58mm bill PDF downloaded' : '58mm bill sent to printer');
    } catch (e) {
      console.error('handlePrintBill', e);
      notify.error(e?.message || 'Print failed');
    } finally {
      setPrintingId(null);
    }
  };

  const handlePrintDailyCustomer = async (row, mode = 'pdf') => {
    if (!row) return;
    const hasActivity =
      Object.values(row.qtyByProduct || {}).some((q) => Number(q) > 0) ||
      Object.values(row.recByProduct || {}).some((q) => Number(q) > 0) ||
      Number(row.cashCollected) > 0;
    if (!hasActivity) {
      notify.error('No delivery or cash on this row yet');
      return;
    }
    setPrintingId(`${row.customerId}:${mode}:daily`);
    try {
      const ok = await printWaterDailySaleBill(
        {
          business: thermalBusiness,
          row,
          products,
          deliveryDate,
          category,
        },
        mode
      );
      if (!ok) {
        notify.error(mode === 'pdf' ? 'PDF download failed' : 'Print dialog could not open');
        return;
      }
      notify.compactSave(
        mode === 'pdf' ? 'Daily 58mm bill downloaded' : 'Daily 58mm bill sent to printer'
      );
    } catch (e) {
      notify.error(e?.message || 'Daily bill failed');
    } finally {
      setPrintingId(null);
    }
  };

  const handleBulkDailyBills = async (mode = 'pdf') => {
    const active = (visibleRows || []).filter(
      (row) =>
        Object.values(row.qtyByProduct || {}).some((q) => Number(q) > 0) ||
        Object.values(row.recByProduct || {}).some((q) => Number(q) > 0) ||
        Number(row.cashCollected) > 0
    );
    if (!active.length) {
      notify.error('No deliveries to print today');
      return;
    }
    setBulkPrinting(true);
    try {
      const ok = await printWaterDailySaleBulk(
        {
          business: thermalBusiness,
          rows: active,
          products,
          deliveryDate,
          category,
        },
        mode
      );
      if (!ok) {
        notify.error('Could not open daily bills');
        return;
      }
      notify.compactSave(
        mode === 'print'
          ? `Printing ${active.length} daily bills (58mm)`
          : `Daily bills ready — use Save as PDF for all ${active.length} customers`
      );
    } catch (e) {
      notify.error(e?.message || 'Bulk daily bills failed');
    } finally {
      setBulkPrinting(false);
    }
  };

  const handlePrintDeliveryChecklist = async (mode = 'print', paperSize = '58mm') => {
    const list = visibleRows || rows || [];
    if (!list.length) {
      notify.error('No route customers on this shift');
      return;
    }
    setBulkPrinting(true);
    try {
      const activeRider = riderShifts?.length ? riderShifts[0]?.riderName : '';
      const ok = await printWaterDeliveryChecklist(
        {
          business: thermalBusiness,
          rows: list,
          products,
          deliveryDate,
          riderName: activeRider,
          paperSize,
        },
        mode
      );
      if (!ok) {
        notify.error('Could not print delivery checklist');
        return;
      }
      notify.compactSave(
        mode === 'print'
          ? `Delivery checklist (${paperSize}) sent to thermal printer`
          : `Delivery checklist PDF (${paperSize}) downloaded`
      );
    } catch (e) {
      notify.error(e?.message || 'Delivery checklist failed');
    } finally {
      setBulkPrinting(false);
    }
  };

  const handlePrintAreaList = async (paperSize = 'A4') => {
    const list = visibleRows || rows || [];
    if (!list.length) {
      notify.error('No route customers on this shift');
      return;
    }
    setBulkPrinting(true);
    try {
      const activeRider = riderShifts?.length ? riderShifts[0]?.riderName : '';
      const ok = await printWaterAreaList(
        {
          business: thermalBusiness,
          rows: list,
          products,
          deliveryDate,
          riderName: activeRider,
          paperSize,
        },
        'print'
      );
      if (!ok) {
        notify.error('Could not open area list — check pop-up permissions');
        return;
      }
      notify.compactSave(`Area list (${paperSize}) opened for print / Save as PDF`);
    } catch (e) {
      notify.error(e?.message || 'Area list failed');
    } finally {
      setBulkPrinting(false);
    }
  };

  const handleBulkPeriodBills = async (mode = 'pdf') => {
    const billable = (visibleBillRows || []).filter((r) => Number(r.amount) > 0 || r.invoiceId);
    if (!billable.length) {
      notify.error(`No ${billKind === 'week' ? 'weekly' : 'monthly'} bills to print`);
      return;
    }
    if (!isOnline) {
      notify.error('Connect to the internet to download week/month day sheets');
      return;
    }
    setBulkPrinting(true);
    try {
      const res = await getWaterHisabBulkDayBreakdownAction({
        businessId,
        category,
        period: billingPeriod,
      });
      if (!res?.success || !res.sheets?.length) {
        notify.error(res?.error || 'Could not load period sheets');
        return;
      }
      const visibleIds = new Set(billable.map((r) => String(r.customerId)));
      const models = res.sheets
        .filter((s) => visibleIds.has(String(s.customerId)))
        .map((s) => ({
          business: thermalBusiness,
          breakdown: s.breakdown,
          customerName: s.customerName,
          houseNo: s.houseNo,
          floorFlat: s.floorFlat,
          accountNo: s.accountNo,
          townCode: s.townCode,
          cashCollected: s.cashCollected,
          specialDiscount: s.specialDiscount,
          delTotal: s.delTotal,
          recTotal: s.recTotal,
          bottleBalance: s.bottleBalance,
          period: res.period || billingPeriod,
          periodLabel: res.label || periodLabel,
          invoiceNumber: s.invoiceNumber || '',
          grandTotal: s.amount || 0,
          paymentStatus: s.paymentStatus || 'unpaid',
          productMeta: s.productMeta || {},
          billLocale: 'en',
        }));
      if (!models.length) {
        notify.error('No matching customers in this filter');
        return;
      }
      const ok = await printWaterPeriodBulk({
        models,
        periodLabel: res.label || periodLabel,
        kind: res.kind || billKind,
        mode,
      });
      if (!ok) {
        notify.error('Could not open period bills');
        return;
      }
      notify.compactSave(
        mode === 'print'
          ? `Printing ${models.length} ${billKind === 'week' ? 'weekly' : 'monthly'} bills`
          : `${models.length} ${billKind === 'week' ? 'weekly' : 'monthly'} bills ready — Save as PDF`
      );
    } catch (e) {
      notify.error(e?.message || 'Bulk period bills failed');
    } finally {
      setBulkPrinting(false);
    }
  };

  const handlePrintA4BillSummary = async (mode = 'print') => {
    if (!billRows.length || !business) {
      notify.error('No bills to print for this period');
      return;
    }
    setBulkPrinting(true);
    try {
      const { kind, label } = resolvePeriodMeta(billingPeriod, periodLabel);
      const ok = await printWaterAllCustomersBillSummary(
        {
          business: thermalBusiness,
          rows: billRows,
          productColumns,
          periodLabel: label,
          period: billingPeriod,
          kind,
        },
        mode
      );
      if (!ok) {
        notify.error('Print operation was cancelled or failed');
        return;
      }
      notify.compactSave(
        mode === 'print'
          ? `A4 bills summary (${billRows.length} customers) sent to printer`
          : `A4 bills summary PDF downloaded`
      );
    } catch (e) {
      notify.error(e?.message || 'A4 summary print failed');
    } finally {
      setBulkPrinting(false);
    }
  };

  const handleDownloadStandardInvoice = async (row) => {
    if (!row?.invoiceId) {
      notify.error('Generate the weekly/monthly invoice first for a standard A4 bill');
      return;
    }
    setPrintingId(`${row.invoiceId}:pdf:a4`);
    try {
      const res = await getWaterHisabBillPrintAction({
        businessId,
        category,
        invoiceId: row.invoiceId,
      });
      if (!res?.success || !res.invoice) {
        notify.error(res?.error || 'Could not load invoice');
        return;
      }
      await downloadStandardInvoicePdfFromRow(res.invoice, thermalBusiness, category, {
        businessId,
      });
      notify.compactSave('Standard A4 Delivery Bill downloaded');
    } catch (e) {
      notify.error(e?.message || 'A4 invoice download failed');
    } finally {
      setPrintingId(null);
    }
  };

  const openWhatsApp = (url) => {
    if (!url || typeof window === 'undefined') return;
    openWhatsAppSmart(url);
  };

  /**
   * Prepare 58mm week/month day-sheet PDF for WhatsApp (share when possible, else download).
   */
  const prepareWhatsAppBillPdf = async (row) => {
    if (!row?.customerId || !billingPeriod || !isOnline) return null;
    try {
      const dayRes = await getWaterHisabCustomerDayBreakdownAction({
        businessId,
        category,
        customerId: row.customerId,
        period: billingPeriod,
      });
      if (!dayRes?.success || !dayRes.breakdown?.days?.length) return null;
      return await createWaterPeriodPdfBlob({
        business: thermalBusiness,
        breakdown: dayRes.breakdown,
        customerName: dayRes.customerName || row.customerName || 'Customer',
        houseNo: dayRes.houseNo || row.houseNo || '',
        floorFlat: dayRes.floorFlat || row.floorFlat || '',
        accountNo: dayRes.accountNo || row.accountNo || '',
        townCode: dayRes.townCode || row.townCode || '',
        cashCollected: dayRes.cashCollected || 0,
        delTotal: dayRes.delTotal || 0,
        recTotal: dayRes.recTotal || 0,
        bottleBalance: dayRes.bottleBalance,
        period: dayRes.period || billingPeriod,
        periodLabel: dayRes.label || periodLabel,
        invoiceNumber: dayRes.invoiceNumber || row.invoiceNumber || '',
        grandTotal: dayRes.amount ?? row.amount ?? 0,
        paymentStatus: dayRes.paymentStatus || row.paymentStatus || 'unpaid',
        productMeta: dayRes.productMeta || row.productMeta || {},
      });
    } catch (err) {
      console.warn('[WaterRouteHisab] WhatsApp bill PDF prep failed', err);
      return null;
    }
  };

  const handleRemindCustomer = async (row, channels = ['hub', 'email', 'whatsapp']) => {
    if (!isOnline) {
      notify.error('Connect to the internet to send reminders');
      return;
    }
    if (!row?.customerId || !(Number(row.amount) > 0)) {
      notify.error('No amount to remind for this customer');
      return;
    }
    if (!isWaterHisabBillRemindable(row)) {
      notify.error('Already paid. No reminder needed.');
      return;
    }
    setRemindingId(row.customerId);
    try {
      const wantWhatsApp = channels.includes('whatsapp');
      let pdfPack = null;
      if (wantWhatsApp) {
        pdfPack = await prepareWhatsAppBillPdf(row);
      }

      const res = await sendWaterHisabReminderAction({
        businessId,
        category,
        customerId: row.customerId,
        period: billingPeriod,
        amount: row.amount,
        invoiceId: row.invoiceId,
        invoiceNumber: row.invoiceNumber,
        houseNo: row.houseNo,
        qtyByProduct: row.qtyByProduct,
        productMeta: row.productMeta,
        channels,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Reminder failed');
        return;
      }

      if (wantWhatsApp && pdfPack?.blob) {
        const shareResult = await shareOrDownloadMilkHisabBillPdf({
          blob: pdfPack.blob,
          filename: pdfPack.filename,
          text: res.message || '',
          title: `${periodLabel || 'Hisab'} bill`,
        });
        if (shareResult.shared) {
          notify.compactSave('Bill PDF shared — pick WhatsApp to send with the file');
        } else if (shareResult.downloaded) {
          if (res.whatsappUrl) openWhatsApp(res.whatsappUrl);
          notify.compactSave('58mm bill PDF downloaded — attach it in WhatsApp');
        } else if (res.whatsappUrl) {
          openWhatsApp(res.whatsappUrl);
        }
      } else if (res.whatsappUrl && wantWhatsApp) {
        openWhatsApp(res.whatsappUrl);
      }

      const parts = [];
      if (res.results?.hub?.ok) parts.push('hub alert');
      if (res.results?.email?.ok) parts.push('email');
      if (res.results?.whatsapp?.ok) parts.push('WhatsApp');
      if (!(wantWhatsApp && pdfPack?.blob)) {
        notify.compactSave(parts.length ? `Reminder: ${parts.join(', ')}` : 'Reminder prepared');
      }
      if (res.results?.email?.error && !res.results?.email?.ok) {
        notify.error(res.results.email.error);
      }
    } catch (e) {
      notify.error(e?.message || 'Reminder failed');
    } finally {
      setRemindingId(null);
    }
  };

  const handleBulkRemind = async () => {
    if (!isOnline) {
      notify.error('Connect to the internet to send reminders');
      return;
    }
    setBulkReminding(true);
    try {
      const res = await sendWaterHisabBulkRemindersAction({
        businessId,
        category,
        period: billingPeriod,
        channels: ['hub', 'email', 'whatsapp'],
      });
      if (!res?.success) {
        notify.error(res?.error || 'Bulk reminder failed');
        return;
      }
      const total = res.total || 0;
      const withWa = (res.outcomes || []).filter((o) => o.whatsappUrl).length;
      notify.compactSave(
        total
          ? `Reminded ${total} customer${total === 1 ? '' : 's'}${withWa ? ` (${withWa} WhatsApp)` : ''}`
          : 'No unpaid bills to remind'
      );
      // Open first WhatsApp link to kick off collection; rest stay as hub/email
      const firstWa = (res.outcomes || []).find((o) => o.whatsappUrl)?.whatsappUrl;
      if (firstWa) openWhatsApp(firstWa);
    } catch (e) {
      notify.error(e?.message || 'Bulk reminder failed');
    } finally {
      setBulkReminding(false);
    }
  };

  const handleBillPaymentStatus = async (row, nextStatus) => {
    if (!isOnline) {
      notify.error('Connect to the internet to update payment');
      return;
    }
    if (!row?.customerId || !(Number(row.amount) > 0 || row.billed)) {
      notify.error('No bill amount for this customer');
      return;
    }
    const next = String(nextStatus || '').toLowerCase() === 'paid' ? 'paid' : 'unpaid';
    const current = String(row.paymentStatus || 'unpaid').toLowerCase() === 'paid' ? 'paid' : 'unpaid';
    if (next === current) return;

    setPaymentBusyId(row.customerId);
    try {
      const res = await setWaterHisabBillPaymentStatusAction({
        businessId,
        category,
        invoiceId: row.invoiceId || null,
        customerId: row.customerId,
        period: billingPeriod,
        paymentStatus: next,
      });
      if (!res?.success) {
        notify.error(res?.error || 'Could not update payment');
        return;
      }
      setBillRows((prev) =>
        prev.map((r) =>
          r.customerId === row.customerId
            ? {
                ...r,
                paymentStatus: res.paymentStatus || next,
                hisabPaymentStatus: next,
              }
            : r
        )
      );
      setBillKpis(null);
      notify.compactSave(next === 'paid' ? 'Marked paid' : 'Marked unpaid');
    } catch (e) {
      notify.error(e?.message || 'Could not update payment');
    } finally {
      setPaymentBusyId(null);
    }
  };

  const openInvoices = () => {
    navigateHubTab({ domain: handle, tab: 'invoices' });
  };

  return (
    <div className={cn(HUB_MOBILE_ROOT, 'space-y-4')}>
      <div className="lg:hidden">
        <MobileTabHeader
          title="Water Route"
          subtitle="Rider sheet by city, area, and delivery day"
          icon={BookOpen}
        />
      </div>

      <div className="hidden lg:flex lg:items-start lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Water Route</h2>
          <p className="text-sm text-gray-500 max-w-2xl">
            Rider Del / Rec / BAL sheet by city and area. Download 58mm daily slips per house, or all
            on-route customers. Bills tab covers weekly and monthly day sheets for one or all accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('open-modal', { detail: { modalId: 'expense' } })
                );
              }
            }}
            title="Log water plant or route fuel expense"
          >
            <Receipt className="h-4 w-4 mr-1.5 text-emerald-600" />
            Log Expense
          </Button>

          <div className="relative inline-block text-left">
            <select
              defaultValue=""
              disabled={exportingExpensePdf}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  handleExportExpenseReportPdf(val);
                  e.target.value = '';
                }
              }}
              className="h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 cursor-pointer pr-6"
              title="Download accurate, beautifully formatted expense PDF report for any period"
            >
              <option value="" disabled>📥 Export Expense Report...</option>
              <option value="daily">📅 Daily Report (Today)</option>
              <option value="weekly">🗓️ Weekly Report (This Week)</option>
              <option value="monthly">📅 Monthly Report (This Month)</option>
              <option value="last-3-months">📊 Last 3 Months</option>
              <option value="last-6-months">📈 Last 6 Months</option>
              <option value="yearly">🗓️ Yearly Report (This Year)</option>
            </select>
            {exportingExpensePdf && (
              <div className="absolute right-2 top-2.5 pointer-events-none">
                <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (view === 'daily') loadDay();
              else if (view === 'bills') loadBills();
              else if (view === 'rider-shifts') loadRiderShifts();
              else if (view === 'bottle-control') loadBottleIntelligence();
              else if (view === 'expenses') loadExpenses();
            }}
            disabled={loading || riderLoading || bottleLoading || expenseLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1.5', (loading || riderLoading || bottleLoading) && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <WaterHisabOfflineBanner
        offlineEnabled={offlineEnabled}
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        daySnapshotReady={daySnapshotReady}
        view={view}
        onSync={async () => {
          const res = await syncPending();
          if (res?.synced) {
            notify.compactSave(
              `Synced ${res.synced} day sheet${res.synced === 1 ? '' : 's'}`
            );
            if (view === 'daily') await loadDay();
            else await loadBills();
          } else if (res?.failed) {
            notify.error('Some offline saves failed to sync');
          } else {
            notify.compactSave('Nothing pending to sync');
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              view === 'daily' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => setView('daily')}
          >
            Daily Sheet
          </button>
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              view === 'rider-shifts' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => setView('rider-shifts')}
          >
            Rider Shifts
          </button>
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              view === 'bottle-control' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => setView('bottle-control')}
          >
            Bottle Control
          </button>
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              view === 'bills' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => setView('bills')}
          >
            Bills
          </button>
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              view === 'expenses' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
            onClick={() => setView('expenses')}
          >
            <span className="flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5" />
              Expenses
            </span>
          </button>
        </div>

        {view === 'daily' && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value || todayKey())}
              className="h-9 w-[10.5rem]"
            />
          </label>
        )}
        {view === 'bills' && (
          <>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              <button
                type="button"
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  billKind === 'week' ? 'bg-sky-100 text-sky-800' : 'text-gray-600 hover:bg-gray-50'
                )}
                onClick={() => setBillKind('week')}
              >
                Weekly
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  billKind === 'month' ? 'bg-sky-100 text-sky-800' : 'text-gray-600 hover:bg-gray-50'
                )}
                onClick={() => setBillKind('month')}
              >
                Monthly
              </button>
            </div>
            {billKind === 'week' ? (
              <Input
                type="week"
                value={weekPeriod}
                onChange={(e) => setWeekPeriod(e.target.value || currentWeek())}
                className="h-9 w-[11rem]"
              />
            ) : (
              <Input
                type="month"
                value={monthPeriod}
                onChange={(e) => setMonthPeriod(e.target.value || currentMonth())}
                className="h-9 w-[10.5rem]"
              />
            )}
          </>
        )}
        {view === 'rider-shifts' && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value || todayKey())}
              className="h-9 w-[10.5rem]"
            />
          </label>
        )}
        {view === 'expenses' && (
          <select
            value={expensePeriodKey}
            onChange={(e) => {
              const pkey = e.target.value;
              setExpensePeriodKey(pkey);
              setExpenseData(null);
              setTimeout(() => loadExpenses(pkey), 0);
            }}
            className="h-9 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="last-6-months">Last 6 Months</option>
            <option value="yearly">This Year</option>
          </select>
        )}

        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter house, ID, or customer"
          className="h-9 max-w-xs"
        />

        {view === 'daily' ? (
          <div className="flex flex-wrap items-center gap-3">
            {/* Size toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sizes</span>
              {WATER_HISAB_SIZE_GROUPS.map((g) => {
                const on = enabledSizeIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    disabled={savingSizes || loading}
                    onClick={() => toggleSheetSize(g.id)}
                    className={cn(
                      'rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors',
                      on
                        ? 'border-sky-300 bg-sky-50 text-sky-800'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
                      (savingSizes || loading) && 'opacity-60'
                    )}
                    title={on ? `Hide ${g.label} columns` : `Show ${g.label} columns`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            {/* Column visibility dropdown — pick which product columns and Del/Rec are shown */}
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
              <ColumnVisibilityDropdown
                products={products}
                visibleProductColumns={visibleProductColumns}
                onToggle={toggleProductColumnVisibility}
                disabled={savingSizes || loading}
              />
            </div>

            {/* Checklist mode toggle */}
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
              <button
                type="button"
                disabled={savingSizes || loading}
                onClick={toggleChecklistMode}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                  checklistMode === 'rider_wise'
                    ? 'border-purple-300 bg-purple-50 text-purple-800'
                    : 'border-orange-300 bg-orange-50 text-orange-800',
                  (savingSizes || loading) && 'opacity-60'
                )}
                title={
                  checklistMode === 'rider_wise'
                    ? 'Checklist prints rider-wise (filtered). Click to print full list always.'
                    : 'Checklist prints full list always. Click to enable rider-wise filtering.'
                }
              >
                {checklistMode === 'rider_wise' ? '👤 Rider Filter' : '📋 Full List'}
              </button>
            </div>
          </div>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {view === 'daily' && (
            <>
              <div className="relative inline-flex rounded-md shadow-sm">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrintDeliveryChecklist('print', '58mm')}
                  disabled={bulkPrinting || loading || !rows.length}
                  title="Print 58mm thermal route delivery checklist for riders with [ ] checkboxes"
                  className="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 rounded-r-none border-r-0"
                >
                  <FileText className="h-4 w-4 mr-1.5 text-sky-600" />
                  Print Checklist
                </Button>
                <select
                  defaultValue=""
                  disabled={bulkPrinting || loading || !rows.length}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'print-58') handlePrintDeliveryChecklist('print', '58mm');
                    else if (val === 'print-80') handlePrintDeliveryChecklist('print', '80mm');
                    else if (val === 'pdf-58') handlePrintDeliveryChecklist('pdf', '58mm');
                    else if (val === 'pdf-80') handlePrintDeliveryChecklist('pdf', '80mm');
                    e.target.value = '';
                  }}
                  className="h-9 rounded-r-md border border-sky-200 bg-sky-50 px-1 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  title="Select 58mm, 80mm thermal size, or Download PDF"
                >
                  <option value="" disabled>▼</option>
                  <option value="print-58">🖨️ Print 58mm Thermal</option>
                  <option value="print-80">🖨️ Print 80mm Wide Thermal</option>
                  <option value="pdf-58">📄 Download PDF (58mm)</option>
                  <option value="pdf-80">📄 Download PDF (80mm)</option>
                </select>
              </div>
              {/* Area List — full A4 register sheet matching plant paper register format */}
              <div className="relative inline-flex rounded-md shadow-sm">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrintAreaList('A4')}
                  disabled={bulkPrinting || loading || !rows.length}
                  title="Print full-page A4 Area List — grouped by route/area with phone, TGT, DEL/REC/CASH columns, BAL and rider signature (matches plant register format)"
                  className="border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-r-none border-r-0"
                >
                  <FileText className="h-4 w-4 mr-1.5 text-blue-600" />
                  Area List
                </Button>
                <select
                  defaultValue=""
                  disabled={bulkPrinting || loading || !rows.length}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'a4') handlePrintAreaList('A4');
                    else if (val === 'a5') handlePrintAreaList('A5');
                    e.target.value = '';
                  }}
                  className="h-9 rounded-r-md border border-blue-200 bg-blue-50 px-1 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  title="Select paper size for Area List"
                >
                  <option value="" disabled>▼</option>
                  <option value="a4">📋 A4 Area List</option>
                  <option value="a5">📋 A5 Compact</option>
                </select>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleBulkDailyBills('print')}
                disabled={bulkPrinting || loading || !rows.length}
                title="Print 58mm daily sale slips for all delivered customers"
              >
                {bulkPrinting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-1.5" />
                )}
                Print all daily
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleBulkDailyBills('pdf')}
                disabled={bulkPrinting || loading || !rows.length}
                title="Download / Save as PDF — all daily 58mm slips"
              >
                <Download className="h-4 w-4 mr-1.5" />
                All daily bills
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveDay}
                disabled={
                  saving ||
                  loading ||
                  (offlineEnabled && !isOnline && !daySnapshotReady)
                }
              >
                {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                {offlineEnabled && !isOnline ? 'Save offline' : 'Save day'}
              </Button>
            </>
          )}
          {view === 'bills' && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleBulkPeriodBills('print')}
                disabled={bulkPrinting || loading || !billRows.length || !isOnline}
                title={`Print all ${billKind === 'week' ? 'weekly' : 'monthly'} 58mm bills`}
              >
                {bulkPrinting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-1.5" />
                )}
                Print all {billKind === 'week' ? 'weekly' : 'monthly'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleBulkPeriodBills('pdf')}
                disabled={bulkPrinting || loading || !billRows.length || !isOnline}
                title={`Download all ${billKind === 'week' ? 'weekly' : 'monthly'} 58mm bills (Save as PDF)`}
              >
                <Download className="h-4 w-4 mr-1.5" />
                All {billKind === 'week' ? 'weekly' : 'monthly'} bills
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handlePrintA4BillSummary('print')}
                disabled={bulkPrinting || loading || !billRows.length}
                title="Print professional A4 all-customers bill summary report — one page with all customers in a compact table"
                className="border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
              >
                {bulkPrinting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-1.5" />
                )}
                A4 Summary
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateInvoices}
                disabled={
                  generating ||
                  loading ||
                  !isOnline ||
                  billsFromCache ||
                  !(liveBillKpis.unbilledCount > 0)
                }
                title={!isOnline ? 'Needs internet' : undefined}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-1.5" />
                )}
                Generate {billKind === 'week' ? 'weekly' : 'monthly'} bills
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleBulkRemind}
                disabled={
                  bulkReminding ||
                  loading ||
                  !isOnline ||
                  !(liveBillKpis.unpaidCount || 0)
                }
                title={!isOnline ? 'Needs internet' : undefined}
              >
                {bulkReminding ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 mr-1.5" />
                )}
                Remind unpaid
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={openInvoices}>
                Open invoices
              </Button>
            </>
          )}
          {view === 'expenses' && null /* Actions are in the page header toolbar — no duplicate here */}
        </div>
      </div>

      <MobileStatStrip items={view === 'daily' ? dayStatItems : view === 'rider-shifts' ? riderStatItems : view === 'bottle-control' ? bottleStatItems : view === 'expenses' ? expenseStatItems : billStatItems} layout="scroll" />
      <HisabKpiStrip items={view === 'daily' ? dayStatItems : view === 'rider-shifts' ? riderStatItems : view === 'bottle-control' ? bottleStatItems : view === 'expenses' ? expenseStatItems : billStatItems} />

      {view === 'daily' && dayDirty ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Unsaved changes. Click <span className="font-semibold">Save day</span> so deliveries are
          recorded and appear on weekly/monthly bills.
        </p>
      ) : null}

      {view === 'bills' && periodLabel ? (
        <p className="text-xs text-gray-500">
          Billing period: <span className="font-semibold text-gray-700">{periodLabel}</span>
          {billsFromCache ? ' · Offline cache' : ''}
          {' · '}Generate creates standard A4 invoices · Print icons: 58mm day sheet · File icon: A4 Delivery Bill
          {urduBillsEnabled ? ' · اردو thermal available' : ''}
          {' · '}Remind can share the 58mm day sheet PDF
        </p>
      ) : null}

      {view === 'daily' && offlineEnabled && !isOnline && !daySnapshotReady ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
          This day was not cached for offline use. Reconnect, open the day once, then you can log the
          route without internet.
        </p>
      ) : null}

      {loading || riderLoading || bottleLoading || (view === 'expenses' && expenseLoading) ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : view === 'daily' ? (
        <DailySheet
          products={products}
          rows={visibleRows}
          currency={currency}
          onQty={updateQty}
          onRec={updateRec}
          onField={updateRowField}
          onPrintDaily={(row) => handlePrintDailyCustomer(row, 'print')}
          onPdfDaily={(row) => handlePrintDailyCustomer(row, 'pdf')}
          printingId={printingId}
          readOnly={offlineEnabled && !isOnline && !daySnapshotReady}
          visibleProductColumns={visibleProductColumns}
        />
      ) : view === 'rider-shifts' ? (
        <RiderShiftsSheet
          shifts={riderShifts}
          summary={riderShiftsSummary}
          savedRiders={savedRiders}
          loading={riderLoading}
          saving={savingRiderShift}
          deliveryDate={deliveryDate}
          currency={currency}
          dailyRows={rows}
          products={products}
          onSaveShift={handleSaveRiderShift}
          onDeleteShift={handleDeleteRiderShift}
          onPrintRiderChecklist={handlePrintRiderChecklist}
          onPrintRiderAreaList={handlePrintRiderAreaList}
        />
      ) : view === 'bottle-control' ? (
        <BottleControlSheet
          summary={bottleSummary}
          idleCustomers={idleCustomers}
          loading={bottleLoading}
          saving={savingBottleSettings}
          currency={currency}
          bottleForm={bottleForm}
          setBottleForm={setBottleForm}
          onSaveSettings={handleSaveBottleSettings}
        />
      ) : view === 'expenses' ? (
        <ExpensesView
          expenseData={expenseData}
          currency={currency}
          periodKey={expensePeriodKey}
          loading={expenseLoading}
        />
      ) : (
        <BillsSheet
          productColumns={productColumns}
          rows={visibleBillRows}
          currency={currency}
          printingId={printingId}
          remindingId={remindingId}
          paymentBusyId={paymentBusyId}
          paymentDisabled={!isOnline}
          urduBillsEnabled={urduBillsEnabled}
          onOpenInvoices={openInvoices}
          onPaymentStatus={handleBillPaymentStatus}
          onPrint={(row) => handlePrintBill(row, 'print', 'en')}
          onPdf={(row) => handlePrintBill(row, 'pdf', 'en')}
          onInvoicePdf={handleDownloadStandardInvoice}
          onPrintUrdu={(row) => handlePrintBill(row, 'print', 'ur')}
          onPdfUrdu={(row) => handlePrintBill(row, 'pdf', 'ur')}
          onRemind={(row) => handleRemindCustomer(row)}
          onRemindWhatsApp={(row) => handleRemindCustomer(row, ['hub', 'whatsapp'])}
          onRemindEmail={(row) => handleRemindCustomer(row, ['hub', 'email'])}
          remindersDisabled={!isOnline}
        />
      )}
    </div>
  );
}

/**
 * ExpensesView - Expense reporting panel for water delivery Hisab.
 * Shows KPI summary, category breakdown, and itemized ledger for any period.
 */
function ExpensesView({
  expenseData,
  currency,
  periodKey,
  loading,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading expense report...
      </div>
    );
  }

  if (!expenseData) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
        <BarChart2 className="h-10 w-10 text-rose-200" />
        <p className="text-sm font-medium">No expense data loaded</p>
        <p className="text-xs text-gray-400">Select a period above or refresh to load expenses</p>
      </div>
    );
  }

  const expenses = expenseData.expenses || [];
  const totalAmount = expenseData.totalAmount || 0;
  const expenseCount = expenseData.expenseCount || 0;
  const periodLabel = expenseData.periodLabel || periodKey;
  const dateFrom = expenseData.dateFrom || '';
  const dateTo = expenseData.dateTo || '';

  // Build category breakdown
  const catMap = new Map();
  for (const exp of expenses) {
    const cat = exp.category || 'Other';
    const curr = catMap.get(cat) || { count: 0, amount: 0 };
    catMap.set(cat, { count: curr.count + 1, amount: curr.amount + (Number(exp.amount) || 0) });
  }
  const categoryRows = Array.from(catMap.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([cat, data]) => ({
      cat,
      count: data.count,
      amount: data.amount,
      pct: totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(1) : '0.0',
    }));

  return (
    <div className="space-y-4">
      {/* Period label shown as section heading — actions are in the page header toolbar */}
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{periodLabel}</h3>
        {dateFrom && dateTo && (
          <p className="text-xs text-gray-500">{dateFrom} to {dateTo}</p>
        )}
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center space-y-2">
          <BarChart2 className="h-8 w-8 text-gray-200 mx-auto" />
          <p className="text-sm font-medium text-gray-500">No expenses recorded for this period</p>
          <p className="text-xs text-gray-400">
            Click <span className="font-semibold">Log Expense</span> to record water supply expenses (fuel, plant utilities, rider commission, etc.)
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'expense' } }));
              }
            }}
            className="mt-2"
          >
            <Receipt className="h-4 w-4 mr-1.5 text-emerald-600" />
            Log First Expense
          </Button>
        </div>
      ) : (
        <>
          {/* Category Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-rose-600" />
              <h3 className="text-sm font-semibold text-gray-900">Expense Breakdown by Category</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5 text-center">Transactions</th>
                  <th className="px-4 py-2.5 text-right">Amount ({currency})</th>
                  <th className="px-4 py-2.5 text-right">% Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoryRows.map((row) => (
                  <tr key={row.cat} className="hover:bg-rose-50/20">
                    <td className="px-4 py-2 font-semibold text-gray-800">{row.cat}</td>
                    <td className="px-4 py-2 text-center text-gray-600 tabular-nums">{row.count}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold text-rose-700">
                      {formatCurrency(row.amount, currency)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-500">{row.pct}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-rose-50 border-t border-rose-200">
                  <td className="px-4 py-2.5 text-xs font-bold text-gray-900">TOTAL EXPENSES</td>
                  <td className="px-4 py-2.5 text-center tabular-nums font-semibold text-gray-700">{expenseCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-rose-800">
                    {formatCurrency(totalAmount, currency)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-600">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Itemized Expense Ledger */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-600" />
              <h3 className="text-sm font-semibold text-gray-900">Itemized Expense Ledger</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead className="bg-gray-50 text-gray-600 border-b font-semibold">
                  <tr>
                    <th className="px-3 py-2.5 whitespace-nowrap">Date</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Ref #</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Category</th>
                    <th className="px-3 py-2.5">Description / Payee</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-center">Payment</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-right">Amount ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600 tabular-nums">
                        {exp.date || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-400 font-mono text-[10px]">
                        {exp.expense_number || exp.id || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700">
                          {exp.category || 'General'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">
                        {exp.description || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 uppercase">
                          {String(exp.paymentMethod || 'Cash').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums font-semibold text-gray-900">
                        {formatCurrency(exp.amount || 0, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-rose-50 border-t-2 border-rose-200">
                    <td colSpan={4} className="px-3 py-2.5 text-xs font-bold text-gray-900">
                      GRAND TOTAL EXPENSES
                    </td>
                    <td />
                    <td className="px-3 py-2.5 text-right tabular-nums font-bold text-rose-800">
                      {formatCurrency(totalAmount, currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center pb-2">
            Export PDF generates a professional Expense Report with Executive Summary, Category Breakdown, and full Itemized Ledger
          </p>
        </>
      )}
    </div>
  );
}

function HisabKpiStrip({ items = [] }) {
  if (!items.length) return null;
  const cols =
    items.length <= 4
      ? 'lg:grid-cols-4'
      : items.length === 5
        ? 'lg:grid-cols-5'
        : 'lg:grid-cols-3 xl:grid-cols-6';
  return (
    <div className={cn('hidden lg:grid gap-2', cols)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'rounded-xl border bg-white px-3 py-2.5 shadow-sm min-w-0',
            item.alert ? 'border-amber-200' : 'border-gray-100'
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{item.label}</p>
          <p className={cn(MARKETING_STAT_VALUE, 'mt-0.5 text-base text-gray-900 truncate', item.valueTone)}>
            {item.value}
          </p>
          {item.hint ? <p className="mt-0.5 text-[11px] text-gray-400 truncate">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

function dailyRowQtyEntries(row, products) {
  return (products || [])
    .map((p) => {
      const qty = Number(row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id] ?? 0);
      if (!(qty > 0)) return null;
      return {
        id: p.id,
        label: shortWaterHisabProductLabel(p, 12),
        qty,
        unit: p.unit || 'pcs',
      };
    })
    .filter(Boolean);
}

/**
 * Dropdown that lists each resolved product column (e.g. "19L Bottle", "19L Refill")
 * with individual Del / Rec checkboxes. Replaces the old global Del/Rec pill toggles.
 * Pure client-side visibility — data is always saved in full; this just hides columns.
 */
function ColumnVisibilityDropdown({ products = [], visibleProductColumns = {}, onToggle, disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Summary label for the trigger button
  const visibleCount = products.filter((p) => {
    const v = visibleProductColumns[String(p.id)];
    return v && (v.del || v.rec);
  }).length;
  const totalCount = products.length;

  const label =
    totalCount === 0
      ? 'Columns'
      : visibleCount === 0 || visibleCount === totalCount
      ? 'Columns'
      : `${visibleCount} of ${totalCount} shown`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled || !products.length}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors',
          open
            ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
          (disabled || !products.length) && 'opacity-50 cursor-not-allowed'
        )}
        title="Choose which product columns and Del/Rec to show on the daily sheet"
      >
        <span>Columns</span>
        {label !== 'Columns' && (
          <span className="rounded-full bg-indigo-100 px-1.5 text-[10px] font-bold text-indigo-700">
            {label}
          </span>
        )}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && products.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Show columns
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Data always saves — this only hides columns from view.
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {products.map((p) => {
              const pid = String(p.id);
              const v = visibleProductColumns[pid] || { del: false, rec: false };
              const label = shortWaterHisabProductLabel(p, 20);
              const sizeTag = p.sizeGroup
                ? { '19l': '19L', '12l': '12L', '5l': '5L', pet: 'PET', deposit: 'DEP', stand: 'STD' }[p.sizeGroup] || p.sizeGroup.toUpperCase()
                : null;
              const typeTag = p.productType
                ? { refill: 'Refill', bottle: 'Bottle', case: 'Case', deposit: 'Deposit', stand: 'Stand' }[p.productType] || ''
                : null;

              return (
                <div key={pid} className="px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-gray-800 truncate flex-1">{label}</span>
                    {sizeTag && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold bg-sky-50 text-sky-700">
                        {sizeTag}
                        {typeTag ? ` · ${typeTag}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={v.del}
                        onChange={() => onToggle(pid, 'del')}
                        className="h-3.5 w-3.5 rounded border-gray-300 accent-emerald-600 cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-emerald-700">Del</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={v.rec}
                        onChange={() => onToggle(pid, 'rec')}
                        className="h-3.5 w-3.5 rounded border-gray-300 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-amber-700">Rec</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 px-3 py-2 flex gap-2">
            <button
              type="button"
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              onClick={() => {
                for (const p of products) {
                  const pid = String(p.id);
                  const v = visibleProductColumns[pid] || { del: false, rec: false };
                  if (!v.del) onToggle(pid, 'del');
                  if (!v.rec) onToggle(pid, 'rec');
                }
              }}
            >
              Show all
            </button>
            <span className="text-gray-300">·</span>
            <button
              type="button"
              className="text-[11px] font-semibold text-gray-500 hover:text-gray-700"
              onClick={() => {
                // Hide all except the first visible one to maintain the guard
                let keptOne = false;
                for (const p of products) {
                  const pid = String(p.id);
                  const v = visibleProductColumns[pid] || { del: false, rec: false };
                  if (!keptOne && (v.del || v.rec)) {
                    keptOne = true;
                    continue; // keep this one
                  }
                  if (v.del) onToggle(pid, 'del');
                  if (v.rec) onToggle(pid, 'rec');
                }
              }}
            >
              Reset
            </button>
            <span className="ml-auto">
              <button
                type="button"
                className="text-[11px] font-semibold text-gray-400 hover:text-gray-600"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function DailySheet({
  products,
  rows,
  currency,
  onQty,
  onRec,
  onField,
  onPrintDaily,
  onPdfDaily,
  printingId = null,
  readOnly = false,
  visibleProductColumns = {},
}) {
  // Derive which products have visible Del/Rec — fall back to showing all if nothing is configured
  const visibleProducts = useMemo(() => {
    const anyConfigured = products.some((p) => {
      const v = visibleProductColumns[String(p.id)];
      return v && (v.del || v.rec);
    });
    if (!anyConfigured) return products; // no config yet → show everything
    return products.filter((p) => {
      const v = visibleProductColumns[String(p.id)];
      return v && (v.del || v.rec);
    });
  }, [products, visibleProductColumns]);

  const showDel = (p) => {
    const v = visibleProductColumns[String(p.id)];
    return !v || v.del; // default true when unconfigured
  };
  const showRec = (p) => {
    const v = visibleProductColumns[String(p.id)];
    return !v || v.rec; // default true when unconfigured
  };
  const [expandedId, setExpandedId] = useState(null);

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center">
        <p className="text-sm font-semibold text-gray-700">No route customers yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Add Home & Flat accounts with House / Villa, Town Code, and turn on delivery route in Customers.
        </p>
      </div>
    );
  }

  const toggleRow = (customerId) => {
    setExpandedId((prev) => (String(prev) === String(customerId) ? null : customerId));
  };

  const handleKeyDown = (e, rowIndex, colIndex) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
      let targetRow = rowIndex;
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        targetRow = rowIndex + 1;
      } else if (e.key === 'ArrowUp') {
        targetRow = rowIndex - 1;
      }

      if (targetRow !== rowIndex && targetRow >= 0 && targetRow < rows.length) {
        e.preventDefault();
        const nextInput = document.getElementById(`nav-${targetRow}-${colIndex}`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select?.();
        }
      }
    }
  };

  return (
    <>
      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="space-y-2 lg:hidden">
        {rows.map((row) => {
          const open = String(expandedId) === String(row.customerId);
          const filled = dailyRowQtyEntries(row, products);
          const filledCount = filled.length;
          return (
            <div
              key={row.customerId}
              className={cn(
                'rounded-xl border bg-white shadow-sm overflow-hidden',
                open ? 'border-sky-300 ring-1 ring-sky-100' : 'border-gray-200'
              )}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 p-3 bg-white cursor-pointer select-none text-left"
                onClick={() => toggleRow(row.customerId)}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                    open ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-gray-200 bg-gray-50 text-gray-500'
                  )}
                >
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', open ? 'rotate-0' : '-rotate-90')}
                    aria-hidden
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900 truncate">
                    {row.customerName}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-gray-500 truncate">
                    {row.accountNo ? `ID ${row.accountNo} · ` : ''}
                    House {row.houseNo || '-'}
                    {row.floorFlat ? ` / ${row.floorFlat}` : ''}
                    {row.routeLabel ? ` · ${row.routeLabel}` : ''}
                    {filledCount > 0
                      ? ` · ${filled
                          .slice(0, 3)
                          .map((e) => `${e.label} ${e.qty}`)
                          .join(', ')}${filledCount > 3 ? '…' : ''}`
                      : ' · No Del yet'}
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
                    filledCount > 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  )}
                >
                  {filledCount > 0 ? `${filledCount} item${filledCount === 1 ? '' : 's'}` : 'Pending'}
                </span>
              </button>

              {open ? (
                <div
                  id={`daily-route-row-${row.customerId}`}
                  className="border-t border-gray-100 bg-gray-50/60 px-3 py-2.5 space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-gray-500">
                      Customer ID
                      <Input
                        value={row.accountNo || ''}
                        readOnly
                        className="mt-0.5 h-9 bg-gray-50 font-mono text-xs"
                        disabled
                        title="Auto-assigned unique customer ID"
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Town code
                      <Input
                        value={row.townCode || ''}
                        onChange={(e) => onField(row.customerId, 'townCode', e.target.value)}
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      House / villa
                      <Input
                        value={row.houseNo || ''}
                        onChange={(e) => onField(row.customerId, 'houseNo', e.target.value)}
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Floor / flat
                      <Input
                        value={row.floorFlat || ''}
                        onChange={(e) => onField(row.customerId, 'floorFlat', e.target.value)}
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Route / rider
                      <Input
                        value={row.routeLabel || ''}
                        onChange={(e) => onField(row.customerId, 'routeLabel', e.target.value)}
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Rate
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.productRate || ''}
                        onChange={(e) => onField(row.customerId, 'productRate', e.target.value === '' ? '' : Number(e.target.value))}
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-2.5 py-2">Product</th>
                          {visibleProducts.some(showDel) && <th className="px-2 py-2 text-right w-20">Del</th>}
                          {visibleProducts.some(showRec) && <th className="px-2 py-2 text-right w-20">Rec</th>}
                          <th className="px-2.5 py-2 text-right w-16">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {visibleProducts.map((p) => (
                          <tr key={p.id}>
                            <td className="px-2.5 py-1.5 font-medium text-gray-900">
                              {shortWaterHisabProductLabel(p, 18)}
                            </td>
                            {showDel(p) && (
                              <td className="px-2 py-1.5 text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  inputMode="decimal"
                                  value={
                                    row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id] ?? ''
                                  }
                                  onChange={(e) => onQty(row.customerId, p.id, e.target.value)}
                                  className="ml-auto h-9 w-[4.25rem] tabular-nums text-center bg-white"
                                  disabled={readOnly}
                                  aria-label={`${p.name} delivered`}
                                />
                              </td>
                            )}
                            {showRec(p) && (
                              <td className="px-2 py-1.5 text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  inputMode="decimal"
                                  value={
                                    row.recByProduct?.[String(p.id)] ?? row.recByProduct?.[p.id] ?? ''
                                  }
                                  onChange={(e) => onRec?.(row.customerId, p.id, e.target.value)}
                                  className="ml-auto h-9 w-[4.25rem] tabular-nums text-center bg-white"
                                  disabled={readOnly}
                                  aria-label={`${p.name} empties received`}
                                />
                              </td>
                            )}
                            <td className="px-2.5 py-1.5 text-right text-[11px] tabular-nums text-gray-500">
                              {formatCurrency(
                                Number(row.productRate) > 0
                                  ? Number(row.productRate)
                                  : Number(p.price) || 0,
                                currency
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-gray-500">
                      Cash recovery
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.cashCollected || ''}
                        onChange={(e) =>
                          onField(
                            row.customerId,
                            'cashCollected',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                    <label className="text-xs text-gray-500">
                      Sp. discount
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.specialDiscount || ''}
                        onChange={(e) =>
                          onField(
                            row.customerId,
                            'specialDiscount',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        className="mt-0.5 h-9 bg-white"
                        disabled={readOnly}
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Prev bottles {Number(row.prevBottle) || 0} · Bal after save{' '}
                    {Number(row.bottleBalance) || 0}
                  </p>

                  <label className="block text-xs text-gray-500">
                    Notes
                    <Input
                      value={row.notes || ''}
                      onChange={(e) => onField(row.customerId, 'notes', e.target.value)}
                      className="mt-0.5 h-9 bg-white"
                      disabled={readOnly}
                      placeholder="Optional"
                    />
                  </label>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className={BILL_ACTION_BTN}
                      disabled={printingId === `${row.customerId}:print:daily`}
                      onClick={() => onPrintDaily?.(row)}
                      title="Print 58mm daily sale slip"
                      aria-label="Print daily bill"
                    >
                      {printingId === `${row.customerId}:print:daily` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Printer className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      className={BILL_ACTION_BTN}
                      disabled={printingId === `${row.customerId}:pdf:daily`}
                      onClick={() => onPdfDaily?.(row)}
                      title="Download 58mm daily sale PDF"
                      aria-label="Download daily bill"
                    >
                      {printingId === `${row.customerId}:pdf:daily` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span className="text-[11px] text-gray-400">58mm daily slip</span>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="hidden lg:block overflow-x-auto rounded-lg border border-gray-300 bg-white shadow-2xs">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-slate-100/90 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 border-b border-slate-300">
            <tr>
              <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200">ID</th>
              <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200">House</th>
              <th className="px-3 py-2 whitespace-nowrap border-r border-slate-200">Customer</th>
              <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200">Route</th>
              {visibleProducts.map((p) => {
                const hasDel = showDel(p);
                const hasRec = showRec(p);
                const cols = (hasDel ? 1 : 0) + (hasRec ? 1 : 0);
                return (
                  <th
                    key={p.id}
                    colSpan={cols}
                    className="px-2 py-1.5 text-center align-bottom border-r border-slate-200 bg-slate-200/50"
                    title={`${p.name} · Del / Rec empties`}
                  >
                    <span className="block truncate text-[11px] font-bold text-slate-800 uppercase tracking-tight">
                      {shortWaterHisabProductLabel(p, 16)}
                    </span>
                    {cols > 1 ? (
                      <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] font-bold normal-case border-t border-slate-300 pt-0.5">
                        {hasDel && <span className="text-emerald-700">Del</span>}
                        {hasRec && <span className="text-amber-700">Rec</span>}
                      </div>
                    ) : (
                      <div className="mt-1 text-[10px] font-bold normal-case border-t border-slate-300 pt-0.5 text-center">
                        {hasDel ? <span className="text-emerald-700">Del</span> : <span className="text-amber-700">Rec</span>}
                      </div>
                    )}
                  </th>
                );
              })}
              <th className="px-2.5 py-2 text-center whitespace-nowrap border-r border-slate-200">Cash</th>
              <th className="px-2.5 py-2 text-center whitespace-nowrap border-r border-slate-200">Disc</th>
              <th className="px-3 py-2 whitespace-nowrap border-r border-slate-200">Notes</th>
              <th className="px-2.5 py-2 text-center whitespace-nowrap">Bill</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.customerId} className="hover:bg-sky-50/50 transition-colors divide-x divide-gray-200">
                <td className="px-1.5 py-1">
                  <span
                    className="inline-flex h-8 min-w-[5.5rem] items-center rounded-sm border border-gray-200 bg-slate-50 px-2 text-xs font-mono tabular-nums text-slate-700"
                    title="Auto-assigned unique customer ID"
                  >
                    {row.accountNo || '—'}
                  </span>
                </td>
                <td className="px-1.5 py-1">
                  <Input
                    value={row.houseNo || ''}
                    onChange={(e) => onField(row.customerId, 'houseNo', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-24 px-2 text-xs border-gray-300 rounded-sm bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:bg-sky-50 focus:outline-none transition-colors"
                    disabled={readOnly}
                  />
                </td>
                <td className="px-3 py-1 font-semibold text-gray-900 whitespace-nowrap">
                  {row.customerName}
                  {row.townCode ? (
                    <span className="ml-1 text-[10px] font-normal text-gray-400">T{row.townCode}</span>
                  ) : null}
                </td>
                <td className="px-1.5 py-1">
                  <Input
                    value={row.routeLabel || ''}
                    onChange={(e) => onField(row.customerId, 'routeLabel', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-28 px-2 text-xs border-gray-300 rounded-sm bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:bg-sky-50 focus:outline-none transition-colors"
                    disabled={readOnly}
                  />
                </td>
                {visibleProducts.map((p) => (
                  <td key={p.id} className="px-1.5 py-1 text-center bg-slate-50/30">
                    <div className="inline-flex items-center gap-1.5">
                      {showDel(p) && (
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          inputMode="decimal"
                          value={row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id] ?? ''}
                          onChange={(e) => onQty(row.customerId, p.id, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="h-8 w-16 px-1 tabular-nums text-center text-xs font-mono font-semibold border-gray-300 rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:bg-emerald-50/50 focus:outline-none transition-colors"
                          disabled={readOnly}
                          title="Delivered bottles"
                        />
                      )}
                      {showRec(p) && (
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          inputMode="decimal"
                          value={row.recByProduct?.[String(p.id)] ?? row.recByProduct?.[p.id] ?? ''}
                          onChange={(e) => onRec?.(row.customerId, p.id, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="h-8 w-16 px-1 tabular-nums text-center text-xs font-mono font-semibold border-gray-300 rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:bg-amber-50/50 focus:outline-none transition-colors"
                          disabled={readOnly}
                          title="Empty bottles received"
                        />
                      )}
                    </div>
                  </td>
                ))}
                <td className="px-1.5 py-1 text-center">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.cashCollected || ''}
                    onChange={(e) =>
                      onField(
                        row.customerId,
                        'cashCollected',
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    className="mx-auto h-8 w-20 px-1 tabular-nums text-center text-xs font-mono font-semibold border-gray-300 rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:bg-sky-50 focus:outline-none transition-colors"
                    disabled={readOnly}
                  />
                </td>
                <td className="px-1.5 py-1 text-center">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.specialDiscount || ''}
                    onChange={(e) =>
                      onField(
                        row.customerId,
                        'specialDiscount',
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    className="mx-auto h-8 w-16 px-1 tabular-nums text-center text-xs font-mono font-semibold border-gray-300 rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:bg-sky-50 focus:outline-none transition-colors"
                    disabled={readOnly}
                  />
                </td>
                <td className="px-1.5 py-1">
                  <Input
                    value={row.notes || ''}
                    onChange={(e) => onField(row.customerId, 'notes', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="h-8 min-w-[9rem] w-full px-2 text-xs border-gray-300 rounded-sm bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:bg-sky-50 focus:outline-none transition-colors"
                    disabled={readOnly}
                  />
                </td>
                <td className="px-2 py-1 text-center whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className={BILL_ACTION_BTN}
                      disabled={printingId === `${row.customerId}:print:daily`}
                      onClick={() => onPrintDaily?.(row)}
                      title="Print 58mm daily sale slip"
                      aria-label="Print daily bill"
                    >
                      {printingId === `${row.customerId}:print:daily` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Printer className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      className={BILL_ACTION_BTN}
                      disabled={printingId === `${row.customerId}:pdf:daily`}
                      onClick={() => onPdfDaily?.(row)}
                      title="Download 58mm daily sale PDF"
                      aria-label="Download daily bill"
                    >
                      {printingId === `${row.customerId}:pdf:daily` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function WaterHisabPaymentToggle({ status, disabled, busy, onChange }) {
  const paid = String(status || '').toLowerCase() === 'paid';
  return (
    <div
      className="inline-flex h-7 items-stretch overflow-hidden rounded border border-gray-200 bg-white"
      role="group"
      aria-label="Payment status"
    >
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => onChange('unpaid')}
        className={cn(
          'inline-flex min-w-[3.1rem] items-center justify-center px-2 text-[10px] font-semibold uppercase tracking-wide transition-colors',
          !paid
            ? 'bg-rose-600 text-white'
            : 'bg-white text-gray-500 hover:bg-rose-50 hover:text-rose-700',
          (disabled || busy) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {busy && !paid ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Unpaid'}
      </button>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => onChange('paid')}
        className={cn(
          'inline-flex min-w-[3.1rem] items-center justify-center border-l border-gray-200 px-2 text-[10px] font-semibold uppercase tracking-wide transition-colors',
          paid
            ? 'bg-emerald-600 text-white'
            : 'bg-white text-gray-500 hover:bg-emerald-50 hover:text-emerald-700',
          (disabled || busy) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {busy && paid ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Paid'}
      </button>
    </div>
  );
}

const BILL_ACTION_BTN =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 bg-white p-0 text-gray-700 hover:bg-gray-50 disabled:opacity-50';

function BillsActionCluster({
  row,
  printingId,
  remindingId,
  urduBillsEnabled = false,
  remindersDisabled = false,
  onPrint,
  onPdf,
  onInvoicePdf,
  onPrintUrdu,
  onPdfUrdu,
  onRemind,
  onRemindWhatsApp,
  onRemindEmail,
}) {
  const baseId = row.invoiceId || row.customerId;
  const busy = typeof printingId === 'string' && printingId.startsWith(`${baseId}:`);
  const remindable = isWaterHisabBillRemindable(row) && !remindersDisabled;
  const remindBusy = remindingId === row.customerId || remindersDisabled;
  const canPrint = Boolean(row.invoiceId) || Number(row.amount) > 0;
  const canA4 = Boolean(row.invoiceId);
  const spin = (mode, locale) => printingId === `${baseId}:${mode}:${locale}`;

  if (!canPrint && !remindable) {
    return <span className="text-xs text-gray-300">-</span>;
  }

  return (
    <div className="inline-flex flex-nowrap items-center gap-1">
      {canA4 ? (
        <button
          type="button"
          className={cn(BILL_ACTION_BTN, 'text-sky-700 border-sky-200')}
          disabled={busy}
          onClick={() => onInvoicePdf?.(row)}
          title="Download standard A4 Delivery Bill (invoice)"
          aria-label="Download A4 invoice"
        >
          {printingId === `${row.invoiceId}:pdf:a4` ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}
      {canPrint ? (
        <>
          <button
            type="button"
            className={BILL_ACTION_BTN}
            disabled={busy}
            onClick={() => onPrint(row)}
            title="Print English 58mm week/month day sheet"
            aria-label="Print English thermal bill"
          >
            {spin('print', 'en') ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Printer className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            className={BILL_ACTION_BTN}
            disabled={busy}
            onClick={() => onPdf(row)}
            title="Download English 58mm week/month day sheet"
            aria-label="Download English thermal PDF"
          >
            {spin('pdf', 'en') ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </button>
          {urduBillsEnabled ? (
            <>
              <button
                type="button"
                className={cn(BILL_ACTION_BTN, 'w-auto min-w-[1.75rem] px-1.5 font-urdu text-[10px] leading-none')}
                disabled={busy}
                onClick={() => onPrintUrdu?.(row)}
                title="اردو بل پرنٹ کریں"
                aria-label="Print Urdu bill"
              >
                {spin('print', 'ur') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'اردو'}
              </button>
              <button
                type="button"
                className={BILL_ACTION_BTN}
                disabled={busy}
                onClick={() => onPdfUrdu?.(row)}
                title="اردو بل PDF"
                aria-label="Download Urdu PDF"
              >
                {spin('pdf', 'ur') ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </button>
            </>
          ) : null}
        </>
      ) : null}

      {canPrint && remindable ? <span className="mx-0.5 h-4 w-px shrink-0 bg-gray-200" aria-hidden /> : null}

      {remindable ? (
        <>
          <button
            type="button"
            className={BILL_ACTION_BTN}
            disabled={remindBusy}
            onClick={() => onRemind(row)}
            title="Remind with bill details (hub, email, WhatsApp)"
            aria-label="Send reminder"
          >
            {remindBusy && remindingId === row.customerId ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            className={cn(BILL_ACTION_BTN, 'text-emerald-700')}
            disabled={remindBusy}
            onClick={() => onRemindWhatsApp(row)}
            title="WhatsApp reminder with bill details (unpaid only)"
            aria-label="WhatsApp reminder"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={BILL_ACTION_BTN}
            disabled={remindBusy}
            onClick={() => onRemindEmail(row)}
            title="Email reminder with bill details (unpaid only)"
            aria-label="Email reminder"
          >
            <Mail className="h-3.5 w-3.5" />
          </button>
        </>
      ) : Number(row.amount) > 0 && String(row.paymentStatus || '').toLowerCase() === 'paid' ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Paid</span>
      ) : null}
    </div>
  );
}

function billProductSummary(row, productColumns) {
  const bits = [];
  for (const p of productColumns || []) {
    const qty = Number(row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id]) || 0;
    if (qty <= 0) continue;
    const label = shortWaterHisabProductLabel(p, 8);
    bits.push(`${qty}${p.unit ? ` ${p.unit}` : ''} ${label}`);
  }
  return bits.join(' · ');
}

function BillsSheet({
  productColumns,
  rows,
  currency,
  printingId,
  remindingId,
  paymentBusyId,
  paymentDisabled = false,
  urduBillsEnabled = false,
  onOpenInvoices,
  onPaymentStatus,
  onPrint,
  onPdf,
  onInvoicePdf,
  onPrintUrdu,
  onPdfUrdu,
  onRemind,
  onRemindWhatsApp,
  onRemindEmail,
  remindersDisabled = false,
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center">
        <p className="text-sm font-semibold text-gray-700">No deliveries in this period</p>
        <p className="mt-1 text-sm text-gray-500">
          Save daily route sheets first, then generate weekly or monthly bills.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {rows.map((row) => {
          const summary = billProductSummary(row, productColumns);
          const payBusy = paymentBusyId === row.customerId;
          const canPay = Number(row.amount) > 0 || row.billed;
          return (
            <div
              key={row.customerId}
              className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{row.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {row.accountNo ? `ID ${row.accountNo} · ` : ''}
                    House {row.houseNo || '-'}
                    {' · '}
                    {row.stopCount || 0} days
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                  {formatCurrency(Number(row.amount) || 0, currency)}
                </p>
              </div>
              {summary ? <p className="mt-1.5 text-[11px] text-gray-500 leading-snug">{summary}</p> : null}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                {row.invoiceNumber ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-sky-700 hover:underline"
                    onClick={onOpenInvoices}
                  >
                    {row.invoiceNumber}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Not billed</span>
                )}
                {canPay ? (
                  <WaterHisabPaymentToggle
                    status={row.paymentStatus || 'unpaid'}
                    disabled={paymentDisabled}
                    busy={payBusy}
                    onChange={(next) => onPaymentStatus?.(row, next)}
                  />
                ) : null}
              </div>
              <div className="mt-2 border-t border-gray-100 pt-2">
                <BillsActionCluster
                  row={row}
                  printingId={printingId}
                  remindingId={remindingId}
                  urduBillsEnabled={urduBillsEnabled}
                  remindersDisabled={remindersDisabled}
                  onPrint={onPrint}
                  onPdf={onPdf}
                  onInvoicePdf={onInvoicePdf}
                  onPrintUrdu={onPrintUrdu}
                  onPdfUrdu={onPdfUrdu}
                  onRemind={onRemind}
                  onRemindWhatsApp={onRemindWhatsApp}
                  onRemindEmail={onRemindEmail}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2">House</th>
              <th className="sticky left-[4.5rem] z-10 bg-gray-50 px-3 py-2">Customer</th>
              <th className="px-3 py-2 text-center">Days</th>
              {productColumns.map((p) => (
                <th
                  key={p.id}
                  className="px-2 py-2 text-center align-bottom min-w-[4.5rem] max-w-[5.5rem]"
                  title={p.name}
                >
                  <span className="block truncate text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    {shortWaterHisabProductLabel(p, 12)}
                  </span>
                  {p.unit ? (
                    <span className="mt-0.5 block font-normal normal-case text-[10px] text-gray-400">
                      {p.unit}
                    </span>
                  ) : null}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 whitespace-nowrap">Invoice</th>
              <th className="px-3 py-2 whitespace-nowrap">Status</th>
              <th className="px-3 py-2 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const payBusy = paymentBusyId === row.customerId;
              const canPay = Number(row.amount) > 0 || row.billed;
              return (
                <tr key={row.customerId} className="hover:bg-sky-50/40">
                  <td className="sticky left-0 z-[1] bg-white px-3 py-1.5 whitespace-nowrap text-gray-700 align-middle">
                    {row.houseNo || '-'}
                  </td>
                  <td className="sticky left-[4.5rem] z-[1] bg-white px-3 py-1.5 font-semibold text-gray-900 whitespace-nowrap align-middle">
                    {row.customerName}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums text-center text-gray-600 align-middle">
                    {row.stopCount || 0}
                  </td>
                  {productColumns.map((p) => (
                    <td
                      key={p.id}
                      className="px-2 py-1.5 tabular-nums text-center text-gray-700 align-middle"
                    >
                      {Number(row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id]) || 0}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-gray-900 align-middle whitespace-nowrap">
                    {formatCurrency(Number(row.amount) || 0, currency)}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    {row.invoiceNumber ? (
                      <button
                        type="button"
                        className="text-sky-700 font-semibold hover:underline"
                        onClick={onOpenInvoices}
                      >
                        {row.invoiceNumber}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400" title="Optional: Generate weekly/monthly invoices">
                        Not billed
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    {canPay ? (
                      <WaterHisabPaymentToggle
                        status={row.paymentStatus || 'unpaid'}
                        disabled={paymentDisabled}
                        busy={payBusy}
                        onChange={(next) => onPaymentStatus?.(row, next)}
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                    <BillsActionCluster
                      row={row}
                      printingId={printingId}
                      remindingId={remindingId}
                      urduBillsEnabled={urduBillsEnabled}
                      remindersDisabled={remindersDisabled}
                      onPrint={onPrint}
                      onPdf={onPdf}
                      onInvoicePdf={onInvoicePdf}
                      onPrintUrdu={onPrintUrdu}
                      onPdfUrdu={onPdfUrdu}
                      onRemind={onRemind}
                      onRemindWhatsApp={onRemindWhatsApp}
                      onRemindEmail={onRemindEmail}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RiderShiftsSheet({
  shifts = [],
  summary = null,
  savedRiders = [],
  loading = false,
  saving = false,
  deliveryDate,
  currency,
  dailyRows = [],
  products = [],
  onSaveShift,
  onDeleteShift,
  onPrintRiderChecklist,
  onPrintRiderAreaList,
}) {
  const [form, setForm] = useState({
    id: null,
    riderName: '',
    routeLabel: '',
    vehicleNo: '',
    shiftType: 'Morning',
    loadedBottles: 60,
    returnedFull: 0,
    returnedEmpty: 0,
    cashCollected: 0,
    defaultUnitPrice: 150,
    notes: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedAreaByShift, setSelectedAreaByShift] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Available unique areas from active daily route sheet
  const availableAreas = useMemo(() => {
    const set = new Set();
    dailyRows.forEach((r) => {
      const lbl = String(r.routeLabel || '').trim();
      if (lbl) set.add(lbl);
    });
    return [...set].sort();
  }, [dailyRows]);

  // Build smart suggestion lists from saved rider directory, past shift history, and active daily route sheet
  const knownRiders = useMemo(() => {
    const set = new Set();
    savedRiders.forEach(r => { if (r.name) set.add(r.name); });
    shifts.forEach(s => { if (s.riderName) set.add(s.riderName); });
    dailyRows.forEach(r => {
      const label = String(r.routeLabel || '').trim();
      if (label && label.toLowerCase().includes('rider')) set.add(label);
    });
    // Seed common names if no history
    if (set.size === 0) {
      ['Rider Ali', 'Rider Ahmed', 'Rider Imran', 'Rider Hassan', 'Rider Bilal', 'Rider Usman', 'Rider Shahid', 'Rider Kamran'].forEach(n => set.add(n));
    }
    return [...set].sort();
  }, [savedRiders, shifts, dailyRows]);

  const knownRoutes = useMemo(() => {
    const set = new Set();
    savedRiders.forEach(r => { if (r.routeLabel) set.add(r.routeLabel); });
    shifts.forEach(s => { if (s.routeLabel) set.add(s.routeLabel); });
    dailyRows.forEach(r => { if (r.routeLabel) set.add(r.routeLabel); });
    [
      'BTK Precinct 1-10', 'BTK Precinct 11-20', 'BTK Precinct 27-31', 'BTK Sports City',
      'BTK Bahria Heights / Apartments', 'BTK Jinnah Avenue', 'BTK Paradise',
      'Bahria Town Karachi Main', 'DHA Phase 6', 'DHA Phase 8', 'Clifton',
      'Gulshan-e-Iqbal', 'North Nazimabad', 'PECHS', 'Scheme 33',
    ].forEach(r => set.add(r));
    return [...set].sort();
  }, [savedRiders, shifts, dailyRows]);

  const knownVehicles = useMemo(() => {
    const set = new Set();
    savedRiders.forEach(r => { if (r.vehicleNo) set.add(r.vehicleNo); });
    shifts.forEach(s => { if (s.vehicleNo) set.add(s.vehicleNo); });
    return [...set].sort();
  }, [savedRiders, shifts]);

  // Live calculated fields
  const deliveredBottles = Math.max(0, (form.loadedBottles || 0) - (form.returnedFull || 0));
  const expectedCash = deliveredBottles * (form.defaultUnitPrice || 0);
  const cashShortage = Math.max(0, expectedCash - (form.cashCollected || 0));
  const isBalanced = cashShortage === 0;

  // Auto-fill route, vehicle, and rate from saved rider info or last shift
  const handleRiderChange = (riderName) => {
    const saved = savedRiders.find(r => String(r.name || '').toLowerCase() === String(riderName || '').toLowerCase());
    const lastShift = shifts.find(s => String(s.riderName || '').toLowerCase() === String(riderName || '').toLowerCase());

    setForm(prev => ({
      ...prev,
      riderName,
      routeLabel: (saved?.routeLabel || lastShift?.routeLabel || prev.routeLabel || ''),
      vehicleNo: (saved?.vehicleNo || lastShift?.vehicleNo || prev.vehicleNo || ''),
      defaultUnitPrice: Number(saved?.defaultUnitPrice || lastShift?.defaultUnitPrice || prev.defaultUnitPrice || 150),
    }));
  };

  // Smart Auto-Sync: pull total delivered bottles & cash collected from today's Daily Sheet
  const handleAutoSyncFromDailySheet = () => {
    if (!dailyRows.length) {
      notify.error('No daily sheet entries loaded for today yet');
      return;
    }
    const rider = String(form.riderName || '').trim().toLowerCase();
    const route = String(form.routeLabel || '').trim().toLowerCase();

    let matched = dailyRows;
    if (rider || route) {
      matched = dailyRows.filter((r) => {
        const rRoute = String(r.routeLabel || '').toLowerCase();
        const rNotes = String(r.notes || '').toLowerCase();
        return (
          (rider && (rRoute.includes(rider) || rNotes.includes(rider))) ||
          (route && (rRoute.includes(route) || rNotes.includes(route)))
        );
      });
    }

    if (!matched.length) matched = dailyRows;

    let sumDel = 0;
    let sumRec = 0;
    let sumCash = 0;

    for (const row of matched) {
      for (const p of products) {
        const pid = String(p.id);
        sumDel += Number(row.qtyByProduct?.[pid] ?? row.qtyByProduct?.[p.id]) || 0;
        sumRec += Number(row.recByProduct?.[pid] ?? row.recByProduct?.[p.id]) || 0;
      }
      sumCash += Number(row.cashCollected) || 0;
    }

    setForm((prev) => ({
      ...prev,
      loadedBottles: sumDel > 0 ? Math.round(sumDel) : prev.loadedBottles,
      returnedFull: 0,
      returnedEmpty: Math.round(sumRec),
      cashCollected: sumCash > 0 ? Math.round(sumCash) : prev.cashCollected,
      notes: prev.notes || `Auto-synced from ${matched.length} doorstep customer deliveries`,
    }));

    notify.compactSave(`Synced ${sumDel} delivered & ${sumRec} empties from ${matched.length} customer stops`);
  };

  const handleEditShift = (shift) => {
    setEditingId(shift.id);
    setForm({
      id: shift.id,
      riderName: shift.riderName || '',
      routeLabel: shift.routeLabel || '',
      vehicleNo: shift.vehicleNo || '',
      shiftType: shift.shiftType || 'Morning',
      loadedBottles: shift.loadedBottles || 60,
      returnedFull: shift.returnedFull || 0,
      returnedEmpty: shift.returnedEmpty || 0,
      cashCollected: shift.cashCollected || 0,
      defaultUnitPrice: shift.defaultUnitPrice || 150,
      notes: shift.notes || '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.riderName.trim()) {
      notify.error('Rider name is required');
      return;
    }
    onSaveShift({ ...form, deliveredBottles, expectedCash, cashShortage });
    setEditingId(null);
    setForm({
      id: null,
      riderName: '',
      routeLabel: '',
      vehicleNo: '',
      shiftType: 'Morning',
      loadedBottles: 60,
      returnedFull: 0,
      returnedEmpty: 0,
      cashCollected: 0,
      defaultUnitPrice: 150,
      notes: '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      id: null, riderName: '', routeLabel: '', vehicleNo: '', shiftType: 'Morning',
      loadedBottles: 60, returnedFull: 0, returnedEmpty: 0, cashCollected: 0,
      defaultUnitPrice: 150, notes: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Datalists for type-ahead */}
      <datalist id="rider-names-list">
        {knownRiders.map(r => <option key={r} value={r} />)}
      </datalist>
      <datalist id="route-areas-list">
        {knownRoutes.map(r => <option key={r} value={r} />)}
      </datalist>
      <datalist id="vehicle-nos-list">
        {knownVehicles.map(v => <option key={v} value={v} />)}
      </datalist>

      {/* Top summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Shifts Today</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{summary?.totalShifts || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Loaded 19L</p>
          <p className="text-lg font-bold text-sky-700 mt-1">{summary?.totalLoaded || 0} bottles</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Delivered 19L</p>
          <p className="text-lg font-bold text-emerald-700 mt-1">{summary?.totalDelivered || 0} bottles</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Cash Collected</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(summary?.totalCash || 0, currency)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Cash Shortage</p>
          <p className={cn('text-lg font-bold mt-1', (summary?.totalShortage || 0) > 0 ? 'text-rose-600' : 'text-emerald-600')}>
            {formatCurrency(summary?.totalShortage || 0, currency)}
          </p>
        </div>
      </div>

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Truck className="h-4 w-4 text-sky-600" />
            {editingId ? 'Edit Shift Record' : 'Rider Dispatch & Shift Load Reconciliation'}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoSyncFromDailySheet}
              className="h-7 text-xs font-semibold text-sky-700 border-sky-300 bg-white hover:bg-sky-50 gap-1"
              title="Import total delivered bottles and cash collected from today's daily doorstep sheet"
            >
              <RefreshCw className="h-3 w-3" />
              Import from Today's Sheet
            </Button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="text-xs text-gray-500 hover:text-gray-700 font-medium underline">
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* Quick Rider Selection Chips */}
        {knownRiders.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-gray-500">Quick Select Rider:</span>
            {knownRiders.map((rName) => (
              <button
                key={rName}
                type="button"
                onClick={() => handleRiderChange(rName)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors',
                  form.riderName === rName
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-50'
                )}
              >
                + {rName}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Rider Name - type-ahead datalist */}
          <div>
            <label className="text-xs text-gray-600 font-medium">Rider Name *</label>
            <Input
              value={form.riderName}
              onChange={(e) => handleRiderChange(e.target.value)}
              list="rider-names-list"
              placeholder="Type rider name..."
              className="h-9 bg-white"
              autoComplete="off"
              required
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Type first letter to see suggestions</p>
          </div>

          {/* Route / Area - type-ahead datalist */}
          <div>
            <label className="text-xs text-gray-600 font-medium">Route / Area</label>
            <Input
              value={form.routeLabel}
              onChange={(e) => setForm({ ...form, routeLabel: e.target.value })}
              list="route-areas-list"
              placeholder="Type area..."
              className="h-9 bg-white"
              autoComplete="off"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">BTK precincts & Karachi areas</p>
          </div>

          {/* Vehicle - type-ahead datalist */}
          <div>
            <label className="text-xs text-gray-600 font-medium">Vehicle / Van No.</label>
            <Input
              value={form.vehicleNo}
              onChange={(e) => setForm({ ...form, vehicleNo: e.target.value.toUpperCase() })}
              list="vehicle-nos-list"
              placeholder="e.g. KHI-4890"
              className="h-9 bg-white"
              autoComplete="off"
            />
          </div>

          {/* Shift Type dropdown */}
          <div>
            <label className="text-xs text-gray-600 font-medium">Shift Type</label>
            <select
              value={form.shiftType}
              onChange={(e) => setForm({ ...form, shiftType: e.target.value })}
              className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500"
            >
              <option value="Morning">Morning (AM)</option>
              <option value="Evening">Evening (PM)</option>
              <option value="Night">Night</option>
              <option value="Full Day">Full Day</option>
            </select>
          </div>

          {/* Bottle Unit Rate */}
          <div>
            <label className="text-xs text-gray-600 font-medium">Bottle Unit Rate (Rs)</label>
            <Input
              type="number"
              value={form.defaultUnitPrice}
              onChange={(e) => setForm({ ...form, defaultUnitPrice: Number(e.target.value) || 0 })}
              className="h-9 bg-white"
            />
          </div>
        </div>

        {/* Load / Return / Cash row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">Load-Out (19L)</label>
            <Input
              type="number"
              value={form.loadedBottles}
              onChange={(e) => setForm({ ...form, loadedBottles: Number(e.target.value) || 0 })}
              className="h-9 bg-white font-semibold text-sky-700"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Returned Full</label>
            <Input
              type="number"
              value={form.returnedFull}
              onChange={(e) => setForm({ ...form, returnedFull: Number(e.target.value) || 0 })}
              className="h-9 bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-emerald-700 font-semibold">Delivered (Auto)</label>
            <div className="flex h-9 items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700">
              {deliveredBottles} bottles
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Returned Empties</label>
            <Input
              type="number"
              value={form.returnedEmpty}
              onChange={(e) => setForm({ ...form, returnedEmpty: Number(e.target.value) || 0 })}
              className="h-9 bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Expected Cash (Auto)</label>
            <div className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700">
              {formatCurrency(expectedCash, currency)}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Cash Recovered</label>
            <Input
              type="number"
              value={form.cashCollected}
              onChange={(e) => setForm({ ...form, cashCollected: Number(e.target.value) || 0 })}
              className="h-9 bg-white font-semibold"
            />
          </div>
          <div>
            <label className={cn('text-xs font-semibold', isBalanced ? 'text-emerald-700' : 'text-rose-600')}>
              {isBalanced ? '✓ Balanced' : '⚠ Shortage'}
            </label>
            <div className={cn(
              'flex h-9 items-center rounded-md border px-3 text-sm font-bold',
              isBalanced ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
            )}>
              {isBalanced ? 'Rs 0' : formatCurrency(cashShortage, currency)}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {editingId ? 'Update Shift' : 'Save Shift Record'}
          </Button>
        </div>
      </form>

      {/* Shifts Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b font-semibold">
            <tr>
              <th className="p-3">Rider / Van</th>
              <th className="p-3">Route</th>
              <th className="p-3">Shift</th>
              <th className="p-3 text-right">Loaded</th>
              <th className="p-3 text-right">Ret. Full</th>
              <th className="p-3 text-right">Delivered</th>
              <th className="p-3 text-right">Ret. Empties</th>
              <th className="p-3 text-right">Cash Recovered</th>
              <th className="p-3 text-right">Cash Shortage</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center min-w-[14rem]">Area & Checklist Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shifts.map((s) => {
              const currentArea = selectedAreaByShift[s.id] ?? (s.routeLabel || 'ALL');
              const filteredStopCount = currentArea === 'ALL'
                ? dailyRows.length
                : dailyRows.filter((r) => {
                    const rLbl = String(r.routeLabel || '').trim().toLowerCase();
                    return rLbl === currentArea.toLowerCase() || rLbl.includes(currentArea.toLowerCase());
                  }).length;

              return (
                <tr key={s.id} className={cn('hover:bg-gray-50', editingId === s.id && 'bg-sky-50 ring-1 ring-sky-200')}>
                  <td className="p-3 font-semibold text-gray-900">
                    {s.riderName}
                    {s.vehicleNo ? <span className="block text-[11px] text-gray-400 font-normal">{s.vehicleNo}</span> : null}
                  </td>
                  <td className="p-3 text-gray-600">
                    <span className="font-medium text-gray-800">{s.routeLabel || '—'}</span>
                  </td>
                  <td className="p-3 text-gray-600">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-semibold">
                      {s.shiftType || 'Morning'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium text-sky-700">{s.loadedBottles}</td>
                  <td className="p-3 text-right text-gray-600">{s.returnedFull}</td>
                  <td className="p-3 text-right font-semibold text-emerald-700">{s.deliveredBottles}</td>
                  <td className="p-3 text-right text-gray-600">{s.returnedEmpty}</td>
                  <td className="p-3 text-right font-medium text-gray-900">{formatCurrency(s.cashCollected, currency)}</td>
                  <td className={cn('p-3 text-right font-semibold', s.cashShortage > 0 ? 'text-rose-600' : 'text-gray-600')}>
                    {formatCurrency(s.cashShortage, currency)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold', s.isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                      {s.isBalanced ? 'Balanced' : 'Shortage'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      {/* Area Selector for Checklist */}
                      <select
                        value={currentArea}
                        onChange={(e) => setSelectedAreaByShift(prev => ({ ...prev, [s.id]: e.target.value }))}
                        className="h-7 w-full rounded border border-sky-200 bg-sky-50 px-1.5 text-[11px] font-semibold text-sky-900 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                        title="Select area to print route checklist for this rider"
                      >
                        <option value="ALL">🌐 All Areas / Routes ({dailyRows.length} stops)</option>
                        {s.routeLabel && (
                          <option value={s.routeLabel}>📍 Rider Route: {s.routeLabel}</option>
                        )}
                        {availableAreas
                          .filter(a => a.toLowerCase() !== (s.routeLabel || '').toLowerCase())
                          .map(a => {
                            const count = dailyRows.filter(r => String(r.routeLabel || '').trim().toLowerCase() === a.toLowerCase()).length;
                            return (
                              <option key={a} value={a}>
                                📍 Area: {a} ({count} stops)
                              </option>
                            );
                          })}
                      </select>

                      {/* Action Cluster Buttons */}
                      <div className="flex items-center gap-1 flex-wrap justify-center">
                        <div className="relative inline-flex rounded shadow-xs">
                          <button
                            type="button"
                            onClick={() => onPrintRiderChecklist?.(s, currentArea, 'print', '58mm')}
                            className="inline-flex h-6 items-center gap-1 rounded-l border border-sky-300 bg-sky-600 px-2 text-[10px] font-semibold text-white hover:bg-sky-700 transition-colors"
                            title={`Print 58mm checklist for ${s.riderName} (${currentArea})`}
                          >
                            <FileText className="h-3 w-3" />
                            Checklist ({filteredStopCount})
                          </button>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'print-58') onPrintRiderChecklist?.(s, currentArea, 'print', '58mm');
                              else if (val === 'print-80') onPrintRiderChecklist?.(s, currentArea, 'print', '80mm');
                              else if (val === 'pdf-58') onPrintRiderChecklist?.(s, currentArea, 'pdf', '58mm');
                              else if (val === 'pdf-80') onPrintRiderChecklist?.(s, currentArea, 'pdf', '80mm');
                              else if (val === 'area-a4') onPrintRiderAreaList?.(s, currentArea, 'A4');
                              else if (val === 'area-a5') onPrintRiderAreaList?.(s, currentArea, 'A5');
                              e.target.value = '';
                            }}
                            className="h-6 rounded-r border border-l-0 border-sky-300 bg-sky-600 px-0.5 text-[10px] font-bold text-white hover:bg-sky-700 cursor-pointer focus:outline-none"
                            title="Select format (58mm, 80mm, A4 Area Register, PDF)"
                          >
                            <option value="" disabled>▼</option>
                            <option value="print-58">🖨️ Thermal 58mm Checklist</option>
                            <option value="print-80">🖨️ Thermal 80mm Wide</option>
                            <option value="area-a4">📋 A4 Area List (Plant Register)</option>
                            <option value="area-a5">📋 A5 Area List Compact</option>
                            <option value="pdf-58">📄 Download PDF (58mm)</option>
                            <option value="pdf-80">📄 Download PDF (80mm)</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEditShift(s)}
                          className="inline-flex h-6 items-center px-2 text-[10px] text-sky-700 font-semibold border border-sky-200 rounded bg-white hover:bg-sky-50 transition-colors"
                          title="Edit shift load-out details"
                        >
                          Edit
                        </button>

                        {confirmDeleteId === s.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => { setConfirmDeleteId(null); onDeleteShift?.(s.id); }}
                              className="inline-flex h-6 items-center px-1.5 text-[10px] text-white font-bold bg-rose-600 rounded hover:bg-rose-700 transition-colors"
                              title="Confirm delete"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="inline-flex h-6 items-center px-1 text-[10px] text-gray-500 font-medium hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(s.id)}
                            className="inline-flex h-6 items-center px-1.5 text-[10px] text-rose-600 font-semibold border border-rose-200 rounded bg-white hover:bg-rose-50 transition-colors"
                            title="Delete shift record"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!shifts.length && (
              <tr>
                <td colSpan={11} className="p-8 text-center text-gray-400">
                  No rider shift load-out records for {deliveryDate} yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BottleControlSheet({
  summary,
  idleCustomers = [],
  loading = false,
  saving = false,
  currency,
  bottleForm,
  setBottleForm,
  onSaveSettings,
}) {
  return (
    <div className="space-y-4">
      {/* Plant asset metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Plant Full Bottles</p>
          <p className="text-lg font-bold text-sky-700 mt-1">{summary?.plantFull || 0}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Ready for dispatch</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Plant Empty Bottles</p>
          <p className="text-lg font-bold text-amber-700 mt-1">{summary?.plantEmpty || 0}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Awaiting refill</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Bottles with Customers</p>
          <p className="text-lg font-bold text-emerald-700 mt-1">{summary?.withCustomers || 0}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Customer float</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Float Bottles</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{summary?.totalFloatBottles || 0}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Total company float</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Float Asset Value</p>
          <p className="text-lg font-bold text-indigo-700 mt-1">{formatCurrency(summary?.totalAssetValue || 0, currency)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">@{summary?.bottleUnitCost || 1200} per bottle</p>
        </div>
      </div>

      {/* Plant stock update form */}
      <form onSubmit={(e) => { e.preventDefault(); onSaveSettings(bottleForm); }} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-sky-600" />
          Plant Bottle Inventory Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">Plant Full Bottles (19L)</label>
            <Input
              type="number"
              value={bottleForm.plantFull}
              onChange={(e) => setBottleForm({ ...bottleForm, plantFull: Number(e.target.value) || 0 })}
              className="h-9"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Plant Empty Bottles</label>
            <Input
              type="number"
              value={bottleForm.plantEmpty}
              onChange={(e) => setBottleForm({ ...bottleForm, plantEmpty: Number(e.target.value) || 0 })}
              className="h-9"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Damaged / Scrapped</label>
            <Input
              type="number"
              value={bottleForm.damagedScrapped}
              onChange={(e) => setBottleForm({ ...bottleForm, damagedScrapped: Number(e.target.value) || 0 })}
              className="h-9"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Replacement Cost / Bottle</label>
            <Input
              type="number"
              value={bottleForm.bottleUnitCost}
              onChange={(e) => setBottleForm({ ...bottleForm, bottleUnitCost: Number(e.target.value) || 0 })}
              className="h-9"
            />
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Bottle Inventory
          </Button>
        </div>
      </form>

      {/* Idle Bottle Risk Alerts */}
      <div className="rounded-xl border border-amber-200 bg-white overflow-hidden shadow-sm">
        <div className="bg-amber-50/80 px-4 py-3 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <h3 className="text-sm font-semibold text-amber-900">Idle Empty Bottle Recovery Alerts</h3>
          </div>
          <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
            {idleCustomers.length} accounts holding empty bottles
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b font-semibold">
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">House / Address</th>
              <th className="p-3">Route</th>
              <th className="p-3 text-right">Unreturned Empties</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {idleCustomers.map((c) => {
              const waText = encodeURIComponent(`Assalamu Alaikum ${c.name},\nThis is a gentle reminder regarding ${c.bottleBalance} empty 19L water bottles at your address (${c.houseNo || 'Home'}). Please let us know when our rider can collect the empties or replace them with refills. Thank you!`);
              const waUrl = c.phone ? `https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${waText}` : null;
              return (
                <tr key={c.id} className="hover:bg-amber-50/30">
                  <td className="p-3 font-semibold text-gray-900">
                    {c.name}
                    {c.accountNo ? <span className="block text-[11px] text-gray-400 font-normal">ID {c.accountNo}</span> : null}
                  </td>
                  <td className="p-3 text-gray-600">{c.houseNo || '-'}</td>
                  <td className="p-3 text-gray-600">{c.routeLabel || '-'}</td>
                  <td className="p-3 text-right font-bold text-amber-700">{c.bottleBalance} bottles</td>
                  <td className="p-3 text-center">
                    {waUrl ? (
                      <a href={waUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition-colors">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Remind Return
                      </a>
                    ) : (
                      <span className="text-gray-400">No phone</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!idleCustomers.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  No idle unreturned empty bottles detected. All customer bottle balances are clear!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WaterRouteHisab;

