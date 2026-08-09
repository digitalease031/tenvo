'use server';

/**
 * Water-delivery Route Hisab server actions (daily sheet + week/month invoices).
 * Uses schema-generated water_delivery_stops and water_delivery_lines tables.
 */
import { prismaBase, pool } from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { InvoiceService } from '@/lib/services/InvoiceService';
import { isWaterHisabRelevant } from '@/lib/storefront/waterShopHisab';
import {
  resolveWaterHisabProducts,
  readWaterCustomerPrefs,
  isWaterCustomerDueOnDate,
  toWaterHisabDateKey,
  waterHisabPeriodMarker,
  parseWaterHisabBillingPeriod,
  buildWaterHisabPeriodKpis,
  buildWaterHisabDayBreakdownGrid,
  buildWaterHisabBillLinesForReminder,
  isWaterHisabWalkInCustomer,
  isWaterHisabBillRemindable,
  computeWaterBottleBalance,
  openingWaterBottleBalance,
  computeWaterSaleAmount,
  WATER_HISAB_PERIOD_PREFIX,
  WATER_HISAB_COLLECTION_NOTE,
  resolveWaterHisabInvoiceForPeriod,
  readWaterHisabPeriodPayment,
  patchWaterHisabPeriodPayment,
  resolveWaterHisabRowPaymentStatus,
  computeWaterRiderShiftReconciliation,
  resolveWaterBottleFloatSummary,
  findIdleBottleCustomers,
  pickWaterHisabDefaultProductId,
  readWaterHisabEnabledSizeIds,
  readWaterHisabEnabledColumns,
  readWaterHisabChecklistMode,
  generateWaterCustomerId,
  WATER_HISAB_SIZE_GROUPS,
  WATER_HISAB_DEFAULT_ENABLED_SIZES,
  WATER_HISAB_COLUMN_TYPES,
  WATER_HISAB_DEFAULT_ENABLED_COLUMNS,
  WATER_HISAB_CHECKLIST_MODES,
  WATER_HISAB_DEFAULT_CHECKLIST_MODE,
} from '@/lib/storefront/waterShopHisab';
import { InvoicePaymentService } from '@/lib/services/InvoicePaymentService';
import {
  buildMilkHisabReminderMessage,
  buildMilkHisabWhatsAppUrl,
  resolveMilkHisabReminderChannels,
  postMilkHisabWhatsAppWebhook,
} from '@/lib/storefront/milkShopHisabReminders';
import {
  getCampaignIntegrationsFromSettings,
  resolveCampaignEmailConfig,
} from '@/lib/marketing/campaignIntegrations';
import { sendCampaignOutreachEmail } from '@/lib/email/campaignOutreach';
import { CampaignOutreachEmail } from '@/lib/email/templates/CampaignOutreachEmail';
import { createNotification, NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '@/lib/notifications/notificationHelpers';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import {
  findExpenseCategory,
  getExpenseCategoryShopLabel,
} from '@/lib/utils/expenseCategories';


function assertWaterHisab(category) {
  if (!isWaterHisabRelevant(category)) {
    const err = new Error('Route Hisab is only available for water delivery businesses');
    err.code = 'WATER_HISAB_DOMAIN';
    throw err;
  }
}

/**
 * Ensure every active water customer has a unique Customer ID (domain_data.accountno).
 * Preserves existing manual/legacy values; only fills blanks.
 * @param {string} businessId
 * @param {Array<{ id: string, domain_data?: object }>} customers
 * @param {import('@prisma/client').PrismaClient | object} [db]
 */
async function ensureWaterCustomerIds(businessId, customers, db = prismaBase) {
  const used = new Set();
  for (const c of customers || []) {
    const prefs = readWaterCustomerPrefs(c);
    const existing = String(prefs.accountNo || '').trim();
    if (existing) used.add(existing.toUpperCase());
  }

  const updates = [];
  for (const c of customers || []) {
    const prefs = readWaterCustomerPrefs(c);
    if (String(prefs.accountNo || '').trim()) continue;

    let nextId = generateWaterCustomerId();
    let guard = 0;
    while (used.has(nextId.toUpperCase()) && guard < 40) {
      nextId = generateWaterCustomerId();
      guard += 1;
    }
    used.add(nextId.toUpperCase());

    const prevDd = c.domain_data && typeof c.domain_data === 'object' ? c.domain_data : {};
    const nextDd = { ...prevDd, accountno: nextId };
    c.domain_data = nextDd;
    updates.push({ id: c.id, domain_data: nextDd });
  }

  if (!updates.length) return 0;

  await db.$transaction(
    updates.map((u) =>
      db.customers.update({
        where: { id: u.id },
        data: { domain_data: u.domain_data },
      })
    )
  );
  return updates.length;
}

/**
 * Load daily sheet: customers + product columns + existing stops.
 */
export async function getWaterHisabDayAction({ businessId, category, deliveryDate }) {
  try {
    assertWaterHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.view' });
    void session;

    const dateKey = toWaterHisabDateKey(deliveryDate || new Date());
    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true, category: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const [customers, products, stops] = await Promise.all([
      prismaBase.customers.findMany({
        where: { business_id: businessId, is_deleted: false, is_active: true },
        orderBy: { name: 'asc' },
        take: 500,
        select: {
          id: true,
          name: true,
          phone: true,
          domain_data: true,
          is_active: true,
          is_deleted: true,
        },
      }),
      prismaBase.products.findMany({
        where: { business_id: businessId, is_deleted: false, is_active: true },
        orderBy: { name: 'asc' },
        take: 200,
        select: {
          id: true,
          name: true,
          unit: true,
          price: true,
          category: true,
          domain_data: true,
          is_active: true,
          is_deleted: true,
        },
      }),
      prismaBase.water_delivery_stops.findMany({
        where: {
          business_id: businessId,
          delivery_date: new Date(dateKey),
          is_deleted: false,
        },
        include: { lines: true },
      }),
    ]);

    const hisabProducts = resolveWaterHisabProducts(products, business.settings || {});
    // Fire-and-forget: ensure customer IDs are populated without blocking the sheet load
    void ensureWaterCustomerIds(businessId, customers);

    const enabledSizeIds = readWaterHisabEnabledSizeIds(business.settings || {});
    const enabledColumns = readWaterHisabEnabledColumns(business.settings || {});
    const checklistMode = readWaterHisabChecklistMode(business.settings || {});
    const stopByCustomer = new Map(stops.map((s) => [String(s.customer_id), s]));

    const rows = customers
      .map((c) => {
        const prefs = readWaterCustomerPrefs(c);
        const cid = String(c.id);
        const hasStop = stopByCustomer.has(cid);
        // Keep route book focused: skip walk-ins and inactive unless they already have a stop today.
        if (!hasStop) {
          if (!prefs.deliveryActive) return null;
          if (isWaterHisabWalkInCustomer(c)) return null;
          if (!isWaterCustomerDueOnDate(prefs, new Date(`${dateKey}T12:00:00`))) return null;
        }
        const stop = stopByCustomer.get(cid);
        const defaultProductId = pickWaterHisabDefaultProductId(hisabProducts, prefs);
        const qtyByProduct = {};
        const recByProduct = {};
        let dayAmount = 0;
        let delTotal = 0;
        let recTotal = 0;
        for (const p of hisabProducts) {
          const pid = String(p.id);
          const line = stop?.lines?.find((l) => String(l.product_id) === pid);
          let qty = 0;
          let rec = 0;
          if (line) {
            qty = Number(line.quantity) || 0;
            rec = Number(line.received_quantity) || 0;
          } else if (!stop && defaultProductId && pid === String(defaultProductId) && prefs.dailyBottles > 0) {
            qty = prefs.dailyBottles;
            rec = prefs.dailyBottles; // default REC = DEL for refill routes (empties come back)
          }
          qtyByProduct[pid] = qty;
          recByProduct[pid] = rec;
          delTotal += qty;
          recTotal += rec;
          const rate = prefs.productRate > 0 ? prefs.productRate : Number(p.price) || 0;
          dayAmount += qty * rate;
        }
        const discount = Number(stop?.special_discount) || 0;
        const cashCollected = Number(stop?.cash_collected) || 0;
        dayAmount = Math.max(0, Math.round((dayAmount - discount) * 100) / 100);
        // When a stop already exists, stored bottleBalance includes today's DEL/REC —
        // reverse that delta so prevBottle is the true opening and re-save stays idempotent.
        const prevBottle = stop
          ? openingWaterBottleBalance({
              storedBalance: prefs.bottleBalance,
              delivered: delTotal,
              received: recTotal,
            })
          : prefs.bottleBalance || 0;
        const bottleBal = computeWaterBottleBalance({
          previous: prevBottle,
          delivered: delTotal,
          received: recTotal,
        });
        return {
          customerId: cid,
          customerName: c.name,
          phone: c.phone || '',
          accountNo: stop?.account_no_snapshot || prefs.accountNo || '',
          customerCode: stop?.account_no_snapshot || prefs.accountNo || '',
          townCode: stop?.town_code_snapshot || prefs.townCode || '',
          houseNo: stop?.house_no_snapshot || prefs.houseNo || '',
          floorFlat: prefs.floorFlat || '',
          routeLabel: stop?.route_label || prefs.routeLabel || '',
          city: prefs.city || '',
          deliveryArea: prefs.deliveryArea || '',
          customerType: prefs.customerType || '',
          deliveryDays: prefs.deliveryDays || 'Daily',
          bottleSizePref: prefs.bottleSizePref || '',
          productRate: prefs.productRate || 0,
          prevBottle,
          bottleBalance: bottleBal,
          cashCollected,
          specialDiscount: discount,
          notes: stop?.notes || '',
          stopId: stop?.id || null,
          qtyByProduct,
          recByProduct,
          dayAmount,
        };
      })
      .filter(Boolean);

    const delivered = rows.filter((r) =>
      Object.values(r.qtyByProduct || {}).some((q) => Number(q) > 0)
    ).length;
    const dayTotal = Math.round(rows.reduce((s, r) => s + (Number(r.dayAmount) || 0), 0) * 100) / 100;
    const cashTotal = Math.round(rows.reduce((s, r) => s + (Number(r.cashCollected) || 0), 0) * 100) / 100;
    const delBottles = rows.reduce(
      (s, r) => s + Object.values(r.qtyByProduct || {}).reduce((a, q) => a + (Number(q) || 0), 0),
      0
    );
    const recBottles = rows.reduce(
      (s, r) => s + Object.values(r.recByProduct || {}).reduce((a, q) => a + (Number(q) || 0), 0),
      0
    );

    return await actionSuccess(
      serializeDecimalsDeep({
        deliveryDate: dateKey,
        products: hisabProducts.map((p) => ({
          id: String(p.id),
          name: p.name,
          hisabShortLabel: p.hisabShortLabel || null,
          unit: p.unit || 'pcs',
          price: Number(p.price) || 0,
          category: p.category || '',
          sizeGroup: p.sizeGroup || null,
          productType: p.productType || null,
        })),
        enabledSizeIds,
        enabledColumns,
        checklistMode,
        sizeGroups: WATER_HISAB_SIZE_GROUPS.map((g) => ({
          id: g.id,
          label: g.label,
          defaultEnabled: g.defaultEnabled,
        })),
        columnTypes: WATER_HISAB_COLUMN_TYPES.map((c) => ({
          id: c.id,
          label: c.label,
          shortLabel: c.shortLabel,
          defaultEnabled: c.defaultEnabled,
        })),
        rows,
        kpis: {
          onRoute: rows.length,
          delivered,
          pending: Math.max(0, rows.length - delivered),
          dayTotal,
          cashTotal,
          delBottles: Math.round(delBottles * 1000) / 1000,
          recBottles: Math.round(recBottles * 1000) / 1000,
          housesSet: rows.filter((r) => String(r.houseNo || '').trim()).length,
        },
      })
    );
  } catch (e) {
    console.error('getWaterHisabDayAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_DAY_FAILED', await getErrorMessage(e));
  }
}

/**
 * Save daily sheet rows (upsert stops + replace lines).
 * Processes customers in parallel batches (10 at a time) to avoid transaction timeouts.
 * Each customer's save is independent and idempotent — no cross-customer dependency.
 * @param {{ businessId: string, category: string, deliveryDate: string, rows: Array }} params
 */
export async function saveWaterHisabDayAction(params) {
  try {
    const { businessId, category, deliveryDate, rows = [] } = params || {};
    assertWaterHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.create_invoice' });
    void session;

    const dateKey = toWaterHisabDateKey(deliveryDate);
    const deliveryDateObj = new Date(dateKey);

    // Pre-load all products and customers in bulk — avoid per-row DB round-trips
    const [products, customers] = await Promise.all([
      prismaBase.products.findMany({
        where: { business_id: businessId, is_deleted: false },
        take: 500,
      }),
      prismaBase.customers.findMany({
        where: {
          business_id: businessId,
          is_deleted: false,
          id: { in: rows.map((r) => r.customerId).filter(Boolean) },
        },
      }),
    ]);

    const productMap = new Map(products.map((p) => [String(p.id), p]));
    const customerMap = new Map(customers.map((c) => [String(c.id), c]));

    // Pre-load existing stops for today in one query
    const existingStops = await prismaBase.water_delivery_stops.findMany({
      where: {
        business_id: businessId,
        delivery_date: deliveryDateObj,
        is_deleted: false,
        customer_id: { in: customers.map((c) => String(c.id)) },
      },
      include: { lines: true },
    });
    const existingStopMap = new Map(existingStops.map((s) => [String(s.customer_id), s]));

    /**
     * Process one customer row — fully idempotent, no shared transaction.
     */
    async function processRow(row) {
      const customerId = row.customerId;
      if (!customerId) return;
      const customer = customerMap.get(String(customerId));
      if (!customer) return;
      const prefs = readWaterCustomerPrefs(customer);

      const qtyMap = row.qtyByProduct || {};
      const recMap = row.recByProduct || {};
      const lineCreates = [];
      let delTotal = 0;
      let recTotal = 0;

      for (const productId of new Set([...Object.keys(qtyMap), ...Object.keys(recMap)])) {
        const qty = Number(qtyMap[productId]) || 0;
        const rec = Number(recMap[productId]) || 0;
        if ((!Number.isFinite(qty) || qty <= 0) && (!Number.isFinite(rec) || rec <= 0)) continue;
        const pid = String(productId);
        const product = productMap.get(pid);
        if (!product) {
          console.warn('[waterHisab] skip line; product not found', pid);
          continue;
        }
        const rate =
          Number(row.productRate) > 0
            ? Number(row.productRate)
            : prefs.productRate > 0
              ? prefs.productRate
              : Number(product.price) || 0;
        delTotal += qty;
        recTotal += rec;
        lineCreates.push({
          business_id: businessId,
          product_id: String(product.id),
          product_name_snapshot: product.name,
          unit_snapshot: product.unit || 'pcs',
          quantity: qty,
          received_quantity: rec,
          unit_price_snapshot: rate,
        });
      }

      const cashCollected = Math.max(0, Number(row.cashCollected) || 0);
      const specialDiscount = Math.max(0, Number(row.specialDiscount) || 0);
      const hasActivity = lineCreates.length > 0 || cashCollected > 0;
      const existingStop = existingStopMap.get(String(customerId));
      const prevDd = customer.domain_data && typeof customer.domain_data === 'object' ? customer.domain_data : {};
      const nextHouse = String(row.houseNo || '').trim();
      const nextRoute = String(row.routeLabel || '').trim();

      if (!hasActivity) {
        // Clear empty stop and reverse bottle balance
        if (existingStop) {
          let oldDel = 0;
          let oldRec = 0;
          for (const line of existingStop.lines || []) {
            oldDel += Number(line.quantity) || 0;
            oldRec += Number(line.received_quantity) || 0;
          }
          const restoredBal = openingWaterBottleBalance({
            storedBalance: prefs.bottleBalance,
            delivered: oldDel,
            received: oldRec,
          });
          await prismaBase.water_delivery_lines.deleteMany({
            where: { stop_id: existingStop.id, business_id: businessId },
          });
          await prismaBase.water_delivery_stops.update({
            where: { id: existingStop.id },
            data: { is_deleted: true, deleted_at: new Date() },
          });
          await prismaBase.customers.update({
            where: { id: customerId },
            data: {
              domain_data: {
                ...prevDd,
                houseno: nextHouse || prevDd.houseno || null,
                deliveryroute: nextRoute || prevDd.deliveryroute || null,
                bottlebalance: restoredBal,
              },
            },
          });
        } else if (nextHouse !== prefs.houseNo || nextRoute !== prefs.routeLabel) {
          await prismaBase.customers.update({
            where: { id: customerId },
            data: {
              domain_data: {
                ...prevDd,
                houseno: nextHouse || prevDd.houseno || null,
                deliveryroute: nextRoute || prevDd.deliveryroute || null,
              },
            },
          });
        }
        return;
      }

      // Compute opening bottle balance (reverse today's delta if stop already exists)
      let openingBal = prefs.bottleBalance || 0;
      if (existingStop) {
        let oldDel = 0;
        let oldRec = 0;
        for (const line of existingStop.lines || []) {
          oldDel += Number(line.quantity) || 0;
          oldRec += Number(line.received_quantity) || 0;
        }
        openingBal = openingWaterBottleBalance({
          storedBalance: prefs.bottleBalance,
          delivered: oldDel,
          received: oldRec,
        });
      }

      // Upsert stop — unique constraint handles concurrent saves safely
      const stop = await prismaBase.water_delivery_stops.upsert({
        where: {
          water_business_id_delivery_date_customer_id: {
            business_id: businessId,
            delivery_date: deliveryDateObj,
            customer_id: customerId,
          },
        },
        create: {
          business_id: businessId,
          delivery_date: deliveryDateObj,
          customer_id: customerId,
          house_no_snapshot: row.houseNo || prefs.houseNo || null,
          customer_name_snapshot: customer.name,
          route_label: row.routeLabel || prefs.routeLabel || null,
          notes: row.notes || null,
          cash_collected: cashCollected,
          special_discount: specialDiscount,
          account_no_snapshot: prefs.accountNo || row.accountNo || null,
          town_code_snapshot: row.townCode || prefs.townCode || null,
          status: 'confirmed',
        },
        update: {
          house_no_snapshot: row.houseNo || prefs.houseNo || null,
          customer_name_snapshot: customer.name,
          route_label: row.routeLabel || prefs.routeLabel || null,
          notes: row.notes || null,
          cash_collected: cashCollected,
          special_discount: specialDiscount,
          account_no_snapshot: prefs.accountNo || row.accountNo || null,
          town_code_snapshot: row.townCode || prefs.townCode || null,
          status: 'confirmed',
          is_deleted: false,
          deleted_at: null,
        },
      });

      // Replace lines atomically for this stop
      await prismaBase.water_delivery_lines.deleteMany({
        where: { stop_id: stop.id, business_id: businessId },
      });
      if (lineCreates.length) {
        await prismaBase.water_delivery_lines.createMany({
          data: lineCreates.map((line) => ({ ...line, stop_id: stop.id })),
        });
      }

      // Update customer domain_data: route, house, bottle balance
      const nextBal = computeWaterBottleBalance({
        previous: openingBal,
        delivered: delTotal,
        received: recTotal,
      });
      const nextRate = Number(row.productRate);
      const stableCustomerId = String(prevDd.accountno || prefs.accountNo || row.accountNo || '').trim() || null;
      await prismaBase.customers.update({
        where: { id: customerId },
        data: {
          domain_data: {
            ...prevDd,
            houseno: nextHouse || prevDd.houseno || null,
            deliveryroute: nextRoute || prevDd.deliveryroute || null,
            floorflat: row.floorFlat ?? prevDd.floorflat ?? null,
            accountno: stableCustomerId,
            towncode: row.townCode || prevDd.towncode || null,
            bottlebalance: nextBal,
            ...(Number.isFinite(nextRate) && nextRate > 0 ? { productrate: nextRate } : {}),
          },
        },
      });
    }

    // Process in parallel batches of 10 — fast enough for 54+ customers, safe on pool
    const BATCH = 10;
    const errors = [];
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const results = await Promise.allSettled(batch.map((row) => processRow(row)));
      for (const r of results) {
        if (r.status === 'rejected') {
          console.error('[saveWaterHisabDayAction] row error:', r.reason);
          errors.push(r.reason?.message || 'Row save failed');
        }
      }
    }

    if (errors.length) {
      console.warn(`[saveWaterHisabDayAction] ${errors.length} row(s) failed:`, errors.slice(0, 3));
    }

    return await actionSuccess({
      deliveryDate: dateKey,
      saved: rows.length - errors.length,
      errors: errors.length,
    });
  } catch (e) {
    console.error('saveWaterHisabDayAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_SAVE_FAILED', await getErrorMessage(e));
  }
}

/**
 * Persist which bottle size columns appear on the daily sheet (default: 19L only).
 * Also save column visibility (Del/Rec) and checklist mode settings.
 */
export async function saveWaterHisabSheetSettingsAction({ 
  businessId, 
  category, 
  enabledSizeIds,
  enabledColumns,
  checklistMode,
}) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.create_invoice' });

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const allowed = new Set(WATER_HISAB_SIZE_GROUPS.map((g) => g.id));
    let nextSizes = Array.isArray(enabledSizeIds)
      ? [...new Set(enabledSizeIds.map((id) => String(id || '').toLowerCase().trim()).filter((id) => allowed.has(id)))]
      : [...WATER_HISAB_DEFAULT_ENABLED_SIZES];
    if (!nextSizes.length) nextSizes = [...WATER_HISAB_DEFAULT_ENABLED_SIZES];

    // Validate enabled columns
    const allowedColumns = new Set(['delivered', 'received']);
    let nextColumns = Array.isArray(enabledColumns)
      ? [...new Set(enabledColumns.map((id) => String(id || '').toLowerCase().trim()).filter((id) => allowedColumns.has(id)))]
      : undefined;
    if (nextColumns && !nextColumns.length) nextColumns = ['delivered', 'received'];

    // Validate checklist mode
    const validModes = ['rider_wise', 'full_list'];
    let nextChecklistMode = validModes.includes(checklistMode) ? checklistMode : undefined;

    const settings = business.settings && typeof business.settings === 'object' ? { ...business.settings } : {};
    const waterHisab = settings.waterHisab && typeof settings.waterHisab === 'object' ? { ...settings.waterHisab } : {};
    waterHisab.enabledSizeIds = nextSizes;
    
    if (nextColumns) {
      waterHisab.enabledColumns = nextColumns;
    }
    
    if (nextChecklistMode) {
      waterHisab.checklistMode = nextChecklistMode;
    }
    
    // Clear explicit productIds so size toggles rebuild columns from inventory hints.
    if (Array.isArray(waterHisab.productIds)) delete waterHisab.productIds;
    settings.waterHisab = waterHisab;

    if (settings.storefront && typeof settings.storefront === 'object') {
      const storefront = { ...settings.storefront };
      if (storefront.waterDelivery && typeof storefront.waterDelivery === 'object') {
        const waterDelivery = { ...storefront.waterDelivery };
        if (Array.isArray(waterDelivery.hisabProductIds)) delete waterDelivery.hisabProductIds;
        waterDelivery.enabledSizeIds = nextSizes;
        storefront.waterDelivery = waterDelivery;
      }
      settings.storefront = storefront;
    }

    await prismaBase.businesses.update({
      where: { id: businessId },
      data: { settings },
    });

    return await actionSuccess({ 
      enabledSizeIds: nextSizes,
      enabledColumns: nextColumns || waterHisab.enabledColumns || ['delivered', 'received'],
      checklistMode: nextChecklistMode || waterHisab.checklistMode || 'rider_wise',
    });
  } catch (e) {
    console.error('saveWaterHisabSheetSettingsAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_SETTINGS_FAILED', await getErrorMessage(e));
  }
}

/**
 * Week or month summary per customer for collection.
 */
export async function getWaterHisabPeriodSummaryAction({ businessId, category, period }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    const bounds = parseWaterHisabBillingPeriod(period);
    const { period: periodKey, startIso, endIso, kind, label } = bounds;

    const stops = await prismaBase.water_delivery_stops.findMany({
      where: {
        business_id: businessId,
        is_deleted: false,
        delivery_date: {
          gte: new Date(`${startIso}T00:00:00.000Z`),
          lte: new Date(`${endIso}T23:59:59.999Z`),
        },
      },
      include: { lines: true, customers: { select: { id: true, name: true, domain_data: true, address: true } } },
    });

    const invoices = await prismaBase.invoices.findMany({
      where: {
        business_id: businessId,
        is_deleted: false,
        notes: { contains: WATER_HISAB_PERIOD_PREFIX },
      },
      select: {
        id: true,
        customer_id: true,
        invoice_number: true,
        grand_total: true,
        payment_status: true,
        status: true,
        notes: true,
        date: true,
        subtotal: true,
        tax_total: true,
        discount_total: true,
        payment_method: true,
      },
    });

    const byCustomer = new Map();
    for (const stop of stops) {
      const meaningfulLines = (stop.lines || []).filter((l) => Number(l.quantity) > 0);
      if (!meaningfulLines.length) continue;

      const cid = stop.customer_id;
      if (!byCustomer.has(cid)) {
        const prefs = readWaterCustomerPrefs(stop.customers || {});
        byCustomer.set(cid, {
          customerId: cid,
          customerName: stop.customer_name_snapshot || stop.customers?.name || 'Customer',
          houseNo: stop.house_no_snapshot || prefs.houseNo || '',
          accountNo: stop.account_no_snapshot || prefs.accountNo || '',
          townCode: stop.town_code_snapshot || prefs.townCode || '',
          floorFlat: prefs.floorFlat || '',
          bottleBalance: prefs.bottleBalance || 0,
          domainData: stop.customers?.domain_data || null,
          qtyByProduct: {},
          amount: 0,
          specialDiscount: 0,
          cashCollected: 0,
          stopCount: 0,
        });
      }
      const row = byCustomer.get(cid);
      row.stopCount += 1;
      row.cashCollected += Number(stop.cash_collected) || 0;
      row.specialDiscount += Number(stop.special_discount) || 0;
      if (!row.accountNo && stop.account_no_snapshot) row.accountNo = stop.account_no_snapshot;
      if (!row.townCode && stop.town_code_snapshot) row.townCode = stop.town_code_snapshot;
      for (const line of meaningfulLines) {
        const q = Number(line.quantity) || 0;
        const price = Number(line.unit_price_snapshot) || 0;
        const pid = String(line.product_id);
        row.qtyByProduct[pid] = (row.qtyByProduct[pid] || 0) + q;
        row.amount += q * price;
        if (!row.productMeta) row.productMeta = {};
        row.productMeta[pid] = {
          name: line.product_name_snapshot,
          unit: line.unit_snapshot,
          unitPrice: price,
        };
      }
    }

    const rows = [...byCustomer.values()]
      .map((r) => {
        const inv = resolveWaterHisabInvoiceForPeriod(invoices, r.customerId, periodKey);
        const hisabPaymentStatus = readWaterHisabPeriodPayment(r.domainData, periodKey);
        const billed = Boolean(inv);
        const paymentStatus = resolveWaterHisabRowPaymentStatus({
          invoicePaymentStatus: inv?.payment_status || null,
          hisabPaymentStatus,
          billed,
        });
        return {
          customerId: r.customerId,
          customerName: r.customerName,
          houseNo: r.houseNo,
          accountNo: r.accountNo || '',
          townCode: r.townCode || '',
          floorFlat: r.floorFlat || '',
          bottleBalance: r.bottleBalance || 0,
          cashCollected: Math.round((r.cashCollected || 0) * 100) / 100,
          specialDiscount: Math.round((r.specialDiscount || 0) * 100) / 100,
          qtyByProduct: r.qtyByProduct,
          productMeta: r.productMeta || {},
          amount: Math.max(
            0,
            Math.round(((r.amount || 0) - (r.specialDiscount || 0)) * 100) / 100
          ),
          stopCount: r.stopCount,
          invoiceId: inv?.id || null,
          invoiceNumber: inv?.invoice_number || null,
          paymentStatus,
          hisabPaymentStatus,
          billed,
          billedPeriod: inv ? (String(inv.notes || '').match(/\[water_hisab_period=([^\]]+)\]/)?.[1] || periodKey) : null,
        };
      })
      .filter((r) => r.amount > 0 || r.billed);

    rows.sort((a, b) => {
      const houseCmp = String(a.houseNo || '').localeCompare(String(b.houseNo || ''), undefined, {
        numeric: true,
      });
      if (houseCmp !== 0) return houseCmp;
      return String(a.customerName).localeCompare(String(b.customerName));
    });

    const productIds = new Set();
    for (const r of rows) {
      Object.keys(r.qtyByProduct || {}).forEach((id) => productIds.add(id));
    }

    // Enrich product columns with full metadata from the catalog so labels
    // match exactly what the daily sheet shows (hisabShortLabel, sizeGroup, productType).
    const allProducts = await prismaBase.products.findMany({
      where: { business_id: businessId, is_deleted: false },
      select: { id: true, name: true, unit: true, price: true, category: true },
      take: 500,
    });
    const businessForSettings = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { settings: true },
    });
    const resolvedCatalog = resolveWaterHisabProducts(allProducts, businessForSettings?.settings || {});
    const catalogById = new Map(resolvedCatalog.map((p) => [String(p.id), p]));

    const productCols = [...productIds].map((id) => {
      const catalogEntry = catalogById.get(id);
      const meta = rows.find((r) => r.productMeta?.[id])?.productMeta?.[id];
      return {
        id,
        name: catalogEntry?.name || meta?.name || 'Item',
        unit: catalogEntry?.unit || meta?.unit || '',
        hisabShortLabel: catalogEntry?.hisabShortLabel || null,
        sizeGroup: catalogEntry?.sizeGroup || null,
        productType: catalogEntry?.productType || null,
        category: catalogEntry?.category || '',
      };
    });

    const kpis = buildWaterHisabPeriodKpis(rows);

    return await actionSuccess(
      serializeDecimalsDeep({
        period: periodKey,
        kind,
        label,
        startIso,
        endIso,
        productColumns: productCols,
        rows,
        kpis,
      })
    );
  } catch (e) {
    console.error('getWaterHisabPeriodSummaryAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_PERIOD_FAILED', await getErrorMessage(e));
  }
}

/** @deprecated Prefer getWaterHisabPeriodSummaryAction (week + month). */
export async function getWaterHisabMonthSummaryAction(params) {
  return getWaterHisabPeriodSummaryAction(params);
}

/**
 * Generate one unpaid invoice per customer for the week or month (skip already billed).
 * Partial success: one customer failure does not abort the rest.
 */
export async function generateWaterHisabInvoicesAction({ businessId, category, period, customerIds = null }) {
  try {
    assertWaterHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.create_invoice' });
    const bounds = parseWaterHisabBillingPeriod(period);
    const { period: periodKey, startIso, endIso, kind, label } = bounds;
    const marker = waterHisabPeriodMarker(periodKey);

    const summary = await getWaterHisabPeriodSummaryAction({ businessId, category, period: periodKey });
    if (!summary.success) return summary;
    let targets = summary.rows || [];
    if (Array.isArray(customerIds) && customerIds.length) {
      const allow = new Set(customerIds.map(String));
      targets = targets.filter((r) => allow.has(String(r.customerId)));
    }
    targets = targets.filter((r) => !r.billed && r.amount > 0);

    const created = [];
    const skipped = [];
    const failed = [];
    const collectionTerms =
      kind === 'week' ? 'Weekly water delivery collection' : 'Monthly water delivery collection';

    for (const row of targets) {
      try {
        const existingInvoices = await prismaBase.invoices.findMany({
          where: {
            business_id: businessId,
            customer_id: row.customerId,
            is_deleted: false,
            notes: { contains: WATER_HISAB_PERIOD_PREFIX },
          },
          select: {
            id: true,
            customer_id: true,
            invoice_number: true,
            notes: true,
            payment_status: true,
          },
        });
        const existing = resolveWaterHisabInvoiceForPeriod(existingInvoices, row.customerId, periodKey);
        if (existing) {
          skipped.push({
            customerId: row.customerId,
            reason: 'already_billed',
            invoiceId: existing.id,
            invoiceNumber: existing.invoice_number,
          });
          continue;
        }

        const lines = await prismaBase.water_delivery_lines.findMany({
          where: {
            business_id: businessId,
            stop: {
              customer_id: row.customerId,
              delivery_date: {
                gte: new Date(`${startIso}T00:00:00.000Z`),
                lte: new Date(`${endIso}T23:59:59.999Z`),
              },
              is_deleted: false,
            },
          },
        });
        const agg = new Map();
        for (const line of lines) {
          const pid = String(line.product_id);
          const cur = agg.get(pid) || {
            qty: 0,
            amount: 0,
            name: line.product_name_snapshot,
            unit: line.unit_snapshot,
          };
          const q = Number(line.quantity) || 0;
          cur.qty += q;
          cur.amount += q * (Number(line.unit_price_snapshot) || 0);
          cur.name = line.product_name_snapshot || cur.name;
          cur.unit = line.unit_snapshot || cur.unit;
          agg.set(pid, cur);
        }

        const invoiceItems = [...agg.entries()]
          .filter(([, v]) => v.qty > 0)
          .map(([productId, v]) => {
            const unitPrice = v.qty > 0 ? Math.round((v.amount / v.qty) * 100) / 100 : 0;
            return {
              product_id: productId,
              name: v.name || 'Item',
              description: `${v.name || 'Item'} (${periodKey} route hisab)`,
              quantity: v.qty,
              unit_price: unitPrice,
              discount_amount: 0,
              tax_percent: 0,
              tax_amount: 0,
              total_amount: Math.round(v.qty * unitPrice * 100) / 100,
              metadata: { unit: v.unit || 'bottle' },
            };
          });

        if (!invoiceItems.length) {
          skipped.push({ customerId: row.customerId, reason: 'no_lines' });
          continue;
        }

        const subtotal = invoiceItems.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0);
        const discountTotal = Math.max(0, Number(row.specialDiscount) || 0);
        const grand = Math.max(0, Math.round((subtotal - discountTotal) * 100) / 100);

        const invoice = await InvoiceService.createInvoice(
          {
            business_id: businessId,
            customer_id: row.customerId,
            date: new Date(`${endIso}T12:00:00`),
            due_date: new Date(`${endIso}T12:00:00`),
            status: 'sent',
            payment_status: 'unpaid',
            payment_method: 'credit',
            subtotal: Math.round(subtotal * 100) / 100,
            tax_total: 0,
            total_tax: 0,
            discount_total: Math.round(discountTotal * 100) / 100,
            grand_total: grand,
            notes: `Water route hisab ${label}. House ${row.houseNo || '-'}. ${marker}`,
            terms: collectionTerms,
            tax_details: { invoice_type: 'retail' },
            skip_inventory: true,
            skip_credit_check: true,
            items: invoiceItems,
          },
          session.user.id
        );

        // Carry manual hisab Paid onto the new invoice so status stays in sync.
        let appliedHisabPaid = false;
        if (String(row.paymentStatus || '').toLowerCase() === 'paid') {
          try {
            await InvoicePaymentService.recordPayment({
              businessId,
              invoiceId: invoice.id,
              amount: Math.round(Number(invoice.grand_total || grand) * 100) / 100,
              paymentMethod: 'cash',
              notes: WATER_HISAB_COLLECTION_NOTE,
              userId: session.user.id,
            });
            appliedHisabPaid = true;
          } catch (payErr) {
            console.error('generateWaterHisabInvoicesAction apply hisab paid', row.customerId, payErr);
          }
        }

        created.push({
          customerId: row.customerId,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          grandTotal: Number(invoice.grand_total),
          paymentStatus: appliedHisabPaid ? 'paid' : 'unpaid',
          hisabPaidPending: String(row.paymentStatus || '').toLowerCase() === 'paid' && !appliedHisabPaid,
        });
      } catch (err) {
        console.error('generateWaterHisabInvoicesAction customer', row.customerId, err);
        failed.push({
          customerId: row.customerId,
          customerName: row.customerName,
          reason: err?.message || 'Invoice create failed',
          code: err?.code || null,
        });
      }
    }

    return await actionSuccess(
      serializeDecimalsDeep({
        period: periodKey,
        kind,
        label,
        created,
        skipped,
        failed,
        success: failed.length === 0 || created.length > 0,
      })
    );
  } catch (e) {
    console.error('generateWaterHisabInvoicesAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_INVOICE_FAILED', await getErrorMessage(e));
  }
}

/**
 * Load one customer's stops for a week/month and build the day Y/N grid
 * used by the PK-style 58mm monthly sheet.
 */
export async function getWaterHisabCustomerDayBreakdownAction({
  businessId,
  category,
  customerId,
  period,
}) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    if (!customerId) return await actionFailure('INVALID', 'Customer required');
    if (!period) return await actionFailure('INVALID', 'Period required');

    const bounds = parseWaterHisabBillingPeriod(period);
    const { period: periodKey, startIso, endIso, kind, label } = bounds;

    const stops = await prismaBase.water_delivery_stops.findMany({
      where: {
        business_id: businessId,
        customer_id: customerId,
        is_deleted: false,
        delivery_date: {
          gte: new Date(`${startIso}T00:00:00.000Z`),
          lte: new Date(`${endIso}T23:59:59.999Z`),
        },
      },
      include: { lines: true, customers: { select: { id: true, name: true, domain_data: true, address: true } } },
      orderBy: { delivery_date: 'asc' },
    });

    /** @type {Map<string, { id: string, name: string, unit: string, unitPrice: number }>} */
    const colMap = new Map();
    let amount = 0;
    let houseNo = '';
    let customerName = 'Customer';

    for (const stop of stops) {
      if (!houseNo) {
        const prefs = readWaterCustomerPrefs(stop.customers || {});
        houseNo = stop.house_no_snapshot || prefs.houseNo || '';
      }
      if (customerName === 'Customer') {
        customerName = stop.customer_name_snapshot || stop.customers?.name || 'Customer';
      }
      for (const line of stop.lines || []) {
        const q = Number(line.quantity) || 0;
        if (q <= 0) continue;
        const pid = String(line.product_id);
        const price = Number(line.unit_price_snapshot) || 0;
        amount += q * price;
        if (!colMap.has(pid)) {
          colMap.set(pid, {
            id: pid,
            name: line.product_name_snapshot || 'Item',
            unit: line.unit_snapshot || '',
            unitPrice: price,
          });
        }
      }
    }

    // Enrich columns with resolved catalog metadata (hisabShortLabel, sizeGroup, productType)
    // so 58mm bill labels and print logic match the daily sheet exactly.
    const [rawCatalog, businessForSettings] = await Promise.all([
      prismaBase.products.findMany({
        where: { business_id: businessId, is_deleted: false },
        select: { id: true, name: true, unit: true, price: true, category: true },
        take: 500,
      }),
      prismaBase.businesses.findFirst({
        where: { id: businessId },
        select: { settings: true },
      }),
    ]);
    const resolvedCatalog = resolveWaterHisabProducts(rawCatalog, businessForSettings?.settings || {});
    const catalogById = new Map(resolvedCatalog.map((p) => [String(p.id), p]));

    const columns = [...colMap.values()].map((col) => {
      const entry = catalogById.get(col.id);
      return {
        ...col,
        hisabShortLabel: entry?.hisabShortLabel || null,
        sizeGroup: entry?.sizeGroup || null,
        productType: entry?.productType || null,
      };
    });

    const breakdown = buildWaterHisabDayBreakdownGrid({
      stops,
      columns,
      startIso,
      endIso,
    });

    const invoices = await prismaBase.invoices.findMany({
      where: {
        business_id: businessId,
        customer_id: customerId,
        is_deleted: false,
        notes: { contains: WATER_HISAB_PERIOD_PREFIX },
      },
      select: {
        id: true,
        customer_id: true,
        invoice_number: true,
        payment_status: true,
        notes: true,
        grand_total: true,
      },
    });
    const inv = resolveWaterHisabInvoiceForPeriod(invoices, customerId, periodKey);

    const productMeta = {};
    for (const col of columns) {
      productMeta[col.id] = {
        name: col.name,
        unit: col.unit,
        unitPrice: col.unitPrice,
        hisabShortLabel: col.hisabShortLabel || null,
        sizeGroup: col.sizeGroup || null,
        productType: col.productType || null,
      };
    }

    const customerRow = stops[0]?.customers || null;
    const prefs = readWaterCustomerPrefs(customerRow || {});
    let cashCollected = 0;
    let specialDiscount = 0;
    let delTotal = 0;
    let recTotal = 0;
    let accountNo = prefs.accountNo || '';
    let townCode = prefs.townCode || '';
    let floorFlat = prefs.floorFlat || '';
    for (const stop of stops) {
      cashCollected += Number(stop.cash_collected) || 0;
      specialDiscount += Number(stop.special_discount) || 0;
      if (!accountNo && stop.account_no_snapshot) accountNo = stop.account_no_snapshot;
      if (!townCode && stop.town_code_snapshot) townCode = stop.town_code_snapshot;
      for (const line of stop.lines || []) {
        delTotal += Number(line.quantity) || 0;
        recTotal += Number(line.received_quantity) || 0;
      }
    }

    return await actionSuccess(
      serializeDecimalsDeep({
        period: periodKey,
        kind,
        label,
        startIso,
        endIso,
        customerId,
        customerName,
        houseNo,
        floorFlat,
        accountNo,
        townCode,
        cashCollected: Math.round(cashCollected * 100) / 100,
        specialDiscount: Math.round(specialDiscount * 100) / 100,
        delTotal: Math.round(delTotal * 1000) / 1000,
        recTotal: Math.round(recTotal * 1000) / 1000,
        bottleBalance: prefs.bottleBalance,
        amount: Math.max(0, Math.round((amount - specialDiscount) * 100) / 100),
        invoiceId: inv?.id || null,
        invoiceNumber: inv?.invoice_number || null,
        paymentStatus: inv?.payment_status || null,
        productMeta,
        breakdown,
      })
    );
  } catch (e) {
    console.error('getWaterHisabCustomerDayBreakdownAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_DAY_SHEET_FAILED', await getErrorMessage(e));
  }
}

/**
 * Bulk week/month day sheets for all customers with deliveries in the period (58mm print/PDF).
 */
export async function getWaterHisabBulkDayBreakdownAction({ businessId, category, period }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    if (!period) return await actionFailure('INVALID', 'Period required');

    const bounds = parseWaterHisabBillingPeriod(period);
    const { period: periodKey, startIso, endIso, kind, label } = bounds;

    const stops = await prismaBase.water_delivery_stops.findMany({
      where: {
        business_id: businessId,
        is_deleted: false,
        delivery_date: {
          gte: new Date(`${startIso}T00:00:00.000Z`),
          lte: new Date(`${endIso}T23:59:59.999Z`),
        },
      },
      include: {
        lines: true,
        customers: { select: { id: true, name: true, domain_data: true, address: true } },
      },
      orderBy: [{ delivery_date: 'asc' }],
    });

    const invoices = await prismaBase.invoices.findMany({
      where: {
        business_id: businessId,
        is_deleted: false,
        notes: { contains: WATER_HISAB_PERIOD_PREFIX },
      },
      select: {
        id: true,
        customer_id: true,
        invoice_number: true,
        payment_status: true,
        notes: true,
        grand_total: true,
      },
    });

    // Resolve catalog once for the whole bulk operation — enriches each column with
    // hisabShortLabel, sizeGroup, productType so 58mm bill labels match the daily sheet.
    const [rawCatalogBulk, businessForSettingsBulk] = await Promise.all([
      prismaBase.products.findMany({
        where: { business_id: businessId, is_deleted: false },
        select: { id: true, name: true, unit: true, price: true, category: true },
        take: 500,
      }),
      prismaBase.businesses.findFirst({
        where: { id: businessId },
        select: { settings: true },
      }),
    ]);
    const resolvedCatalogBulk = resolveWaterHisabProducts(rawCatalogBulk, businessForSettingsBulk?.settings || {});
    const catalogByIdBulk = new Map(resolvedCatalogBulk.map((p) => [String(p.id), p]));

    /** @type {Map<string, typeof stops>} */
    const byCustomer = new Map();
    for (const stop of stops) {
      const cid = String(stop.customer_id);
      if (!byCustomer.has(cid)) byCustomer.set(cid, []);
      byCustomer.get(cid).push(stop);
    }

    const sheets = [];
    for (const [cid, custStops] of byCustomer) {
      /** @type {Map<string, { id: string, name: string, unit: string, unitPrice: number }>} */
      const colMap = new Map();
      let amount = 0;
      let cashCollected = 0;
      let specialDiscount = 0;
      let delTotal = 0;
      let recTotal = 0;
      let houseNo = '';
      let customerName = 'Customer';
      const prefs = readWaterCustomerPrefs(custStops[0]?.customers || {});
      let accountNo = prefs.accountNo || '';
      let townCode = prefs.townCode || '';
      let floorFlat = prefs.floorFlat || '';

      for (const stop of custStops) {
        if (!houseNo) {
          houseNo = stop.house_no_snapshot || prefs.houseNo || '';
        }
        if (customerName === 'Customer') {
          customerName = stop.customer_name_snapshot || stop.customers?.name || 'Customer';
        }
        if (!accountNo && stop.account_no_snapshot) accountNo = stop.account_no_snapshot;
        if (!townCode && stop.town_code_snapshot) townCode = stop.town_code_snapshot;
        cashCollected += Number(stop.cash_collected) || 0;
        specialDiscount += Number(stop.special_discount) || 0;
        for (const line of stop.lines || []) {
          const q = Number(line.quantity) || 0;
          const rec = Number(line.received_quantity) || 0;
          delTotal += q;
          recTotal += rec;
          if (q <= 0) continue;
          const pid = String(line.product_id);
          const price = Number(line.unit_price_snapshot) || 0;
          amount += q * price;
          if (!colMap.has(pid)) {
            colMap.set(pid, {
              id: pid,
              name: line.product_name_snapshot || 'Item',
              unit: line.unit_snapshot || '',
              unitPrice: price,
            });
          }
        }
      }

      amount = Math.max(0, Math.round((amount - specialDiscount) * 100) / 100);
      if (!(amount > 0)) continue;

      // Enrich each column with resolved metadata
      const columns = [...colMap.values()].map((col) => {
        const entry = catalogByIdBulk.get(col.id);
        return {
          ...col,
          hisabShortLabel: entry?.hisabShortLabel || null,
          sizeGroup: entry?.sizeGroup || null,
          productType: entry?.productType || null,
        };
      });

      const breakdown = buildWaterHisabDayBreakdownGrid({
        stops: custStops,
        columns,
        startIso,
        endIso,
      });
      const inv = resolveWaterHisabInvoiceForPeriod(invoices, cid, periodKey);
      const productMeta = {};
      for (const col of columns) {
        productMeta[col.id] = {
          name: col.name,
          unit: col.unit,
          unitPrice: col.unitPrice,
          hisabShortLabel: col.hisabShortLabel || null,
          sizeGroup: col.sizeGroup || null,
          productType: col.productType || null,
        };
      }

      sheets.push({
        customerId: cid,
        customerName,
        houseNo,
        floorFlat,
        accountNo,
        townCode,
        cashCollected: Math.round(cashCollected * 100) / 100,
        specialDiscount: Math.round(specialDiscount * 100) / 100,
        delTotal: Math.round(delTotal * 1000) / 1000,
        recTotal: Math.round(recTotal * 1000) / 1000,
        bottleBalance: prefs.bottleBalance,
        amount,
        invoiceId: inv?.id || null,
        invoiceNumber: inv?.invoice_number || null,
        paymentStatus: inv?.payment_status || null,
        productMeta,
        breakdown,
      });
    }

    sheets.sort((a, b) => {
      const h = String(a.houseNo || '').localeCompare(String(b.houseNo || ''), undefined, {
        numeric: true,
      });
      if (h !== 0) return h;
      return String(a.customerName).localeCompare(String(b.customerName));
    });

    return await actionSuccess(
      serializeDecimalsDeep({
        period: periodKey,
        kind,
        label,
        startIso,
        endIso,
        sheets,
        count: sheets.length,
      })
    );
  } catch (e) {
    console.error('getWaterHisabBulkDayBreakdownAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_BULK_SHEET_FAILED', await getErrorMessage(e));
  }
}

/**
 * Load invoice + lines for 58mm thermal hisab bill print.
 */
export async function getWaterHisabBillPrintAction({ businessId, category, invoiceId }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    if (!invoiceId) return await actionFailure('INVALID', 'Invoice required');

    let invoice;
    try {
      invoice = await InvoiceService.getInvoiceWithItems(invoiceId, businessId);
    } catch (err) {
      return await actionFailure(err?.code || 'NOT_FOUND', err?.message || 'Invoice not found');
    }
    if (!invoice || invoice.is_deleted) {
      return await actionFailure('NOT_FOUND', 'Invoice not found');
    }

    const notes = String(invoice.notes || '');
    const markerMatch = notes.match(/\[water_hisab_period=([^\]]+)\]/);
    const period = markerMatch?.[1] || '';
    let periodLabel = period;
    let kind = 'month';
    if (period) {
      try {
        const parsed = parseWaterHisabBillingPeriod(period);
        periodLabel = parsed.label;
        kind = parsed.kind;
      } catch {
        /* keep raw */
      }
    }

    const houseMatch = notes.match(/House\s+([^.[\]]+)/i);
    const houseNo = (houseMatch?.[1] || '').trim().replace(/^-+\s*$/, '') || '';

    return await actionSuccess(
      serializeDecimalsDeep({
        invoice,
        items: invoice.items || [],
        houseNo: houseNo === '-' ? '' : houseNo,
        period,
        periodLabel,
        kind,
      })
    );
  } catch (e) {
    console.error('getWaterHisabBillPrintAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_PRINT_FAILED', await getErrorMessage(e));
  }
}

/**
 * Preview reminder channels + prefilled WhatsApp / email copy for one customer.
 */
export async function prepareWaterHisabReminderAction({
  businessId,
  category,
  customerId,
  period,
  amount,
  invoiceId = null,
  invoiceNumber = null,
  houseNo = '',
  billLines = null,
  qtyByProduct = null,
  productMeta = null,
}) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    if (!customerId) return await actionFailure('INVALID', 'Customer required');

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: {
        id: true,
        business_name: true,
        domain: true,
        country: true,
        currency: true,
        settings: true,
        category: true,
        address: true,
        phone: true,
        ntn: true,
      },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const customer = await prismaBase.customers.findFirst({
      where: { id: customerId, business_id: businessId, is_deleted: false },
    });
    if (!customer) return await actionFailure('NOT_FOUND', 'Customer not found');

    const prefs = readWaterCustomerPrefs(customer);
    let periodLabel = String(period || '');
    let periodKey = String(period || '');
    try {
      if (period) {
        const bounds = parseWaterHisabBillingPeriod(period);
        periodLabel = bounds.label;
        periodKey = bounds.period;
      }
    } catch {
      /* keep raw */
    }

    const hisabPaid = readWaterHisabPeriodPayment(customer.domain_data, periodKey) === 'paid';
    if (hisabPaid) {
      return await actionFailure('WATER_HISAB_ALREADY_PAID', 'Already paid. No reminder needed.');
    }

    if (invoiceId) {
      const invPay = await prismaBase.invoices.findFirst({
        where: { id: invoiceId, business_id: businessId, is_deleted: false },
        select: { payment_status: true },
      });
      if (String(invPay?.payment_status || '').toLowerCase() === 'paid') {
        return await actionFailure('WATER_HISAB_ALREADY_PAID', 'Already paid. No reminder needed.');
      }
    }

    const resolvedLines = Array.isArray(billLines)
      ? billLines
      : buildWaterHisabBillLinesForReminder({
          qtyByProduct: qtyByProduct || {},
          productMeta: productMeta || {},
        });

    const pack = getBusinessRegionalPack(business);
    const message = buildMilkHisabReminderMessage({
      businessName: business.business_name,
      customerName: customer.name,
      houseNo: houseNo || prefs.houseNo,
      amount,
      periodLabel,
      invoiceNumber,
      currency: pack.currency,
      billLines: resolvedLines,
      deliveryNoun: 'water delivery',
    });

    const channels = resolveMilkHisabReminderChannels({
      settings: business.settings,
      customer,
      country: business.country,
      hasInvoice: Boolean(invoiceId),
    });

    const whatsappUrl = channels.whatsapp.available
      ? buildMilkHisabWhatsAppUrl(customer.phone, business.country, message)
      : null;

    return await actionSuccess({
      customerId: customer.id,
      customerName: customer.name,
      email: customer.email || null,
      phone: customer.phone || null,
      message,
      periodLabel,
      billLines: resolvedLines,
      channels,
      whatsappUrl,
      emailConfigured: resolveCampaignEmailConfig(business.settings).configured,
    });
  } catch (e) {
    console.error('prepareWaterHisabReminderAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_REMIND_PREVIEW_FAILED', await getErrorMessage(e));
  }
}

/**
 * Send collection reminder via hub alert, email, and/or WhatsApp (wa.me + optional webhook).
 * @param {{ channels?: Array<'hub'|'email'|'whatsapp'> }} params
 */
export async function sendWaterHisabReminderAction(params) {
  try {
    const {
      businessId,
      category,
      customerId,
      period,
      amount,
      invoiceId = null,
      invoiceNumber = null,
      houseNo = '',
      billLines = null,
      qtyByProduct = null,
      productMeta = null,
      channels: requestedChannels = ['hub', 'email', 'whatsapp'],
    } = params || {};

    assertWaterHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.view' });

    if (invoiceId) {
      const invPay = await prismaBase.invoices.findFirst({
        where: { id: invoiceId, business_id: businessId, is_deleted: false },
        select: { payment_status: true },
      });
      if (String(invPay?.payment_status || '').toLowerCase() === 'paid') {
        return await actionFailure('WATER_HISAB_ALREADY_PAID', 'Already paid. No reminder needed.');
      }
    }

    const preview = await prepareWaterHisabReminderAction({
      businessId,
      category,
      customerId,
      period,
      amount,
      invoiceId,
      invoiceNumber,
      houseNo,
      billLines,
      qtyByProduct,
      productMeta,
    });
    if (!preview.success) return preview;

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: {
        id: true,
        business_name: true,
        domain: true,
        country: true,
        currency: true,
        settings: true,
        category: true,
        address: true,
        phone: true,
        ntn: true,
      },
    });
    const customer = await prismaBase.customers.findFirst({
      where: { id: customerId, business_id: businessId, is_deleted: false },
    });

    const want = new Set(
      (Array.isArray(requestedChannels) ? requestedChannels : ['hub', 'email', 'whatsapp']).map(String)
    );
    const results = {
      hub: { attempted: false, ok: false },
      email: { attempted: false, ok: false },
      whatsapp: { attempted: false, ok: false, url: preview.whatsappUrl || null },
    };

    const handle = business?.domain || 'hub';
    const actionUrl = `/business/${handle}?tab=route-hisab`;

    if (want.has('hub')) {
      results.hub.attempted = true;
      try {
        await createNotification({
          businessId,
          userId: null,
          type: NOTIFICATION_TYPES.INVOICE,
          title: 'Water collection reminder',
          message: preview.message,
          actionUrl,
          metadata: {
            source: 'water_hisab_reminder',
            customerId,
            invoiceId,
            period,
            amount: Number(amount) || 0,
            sentBy: session?.user?.id || null,
          },
          priority: NOTIFICATION_PRIORITY.MEDIUM,
        });
        results.hub.ok = true;
      } catch (err) {
        results.hub.error = err?.message || 'Hub notify failed';
      }
    }

    if (want.has('email') && preview.channels?.email?.available) {
      results.email.attempted = true;
      try {
        const emailConfig = resolveCampaignEmailConfig(business?.settings);
        const sendRes = await sendCampaignOutreachEmail({
          apiKey: emailConfig.apiKey,
          from: emailConfig.from,
          to: preview.email,
          subject: invoiceNumber
            ? `Water delivery bill ${invoiceNumber} · ${preview.periodLabel}`
            : `Water delivery bill reminder · ${preview.periodLabel}`,
          replyTo: emailConfig.replyTo,
          react: React.createElement(CampaignOutreachEmail, {
            businessName: business?.business_name || 'Water supply',
            campaignName: 'Route Hisab reminder',
            body: preview.message,
            customerName: customer?.name || preview.customerName,
          }),
        });
        if (sendRes.skipped) {
          results.email.ok = false;
          results.email.error = sendRes.error || 'Email provider not configured';
        } else if (!sendRes.success) {
          results.email.ok = false;
          results.email.error = sendRes.error || 'Email failed';
        } else {
          results.email.ok = true;
          results.email.mode = 'resend';
        }
      } catch (err) {
        results.email.ok = false;
        results.email.error = err?.message || 'Email failed';
      }
    } else if (want.has('email')) {
      results.email.attempted = true;
      results.email.ok = false;
      results.email.error = preview.channels?.email?.hint || 'Email unavailable';
    }

    if (want.has('whatsapp')) {
      results.whatsapp.attempted = true;
      results.whatsapp.url = preview.whatsappUrl;
      if (!preview.whatsappUrl) {
        results.whatsapp.ok = false;
        results.whatsapp.error = preview.channels?.whatsapp?.hint || 'No phone';
      } else {
        results.whatsapp.ok = true;
        results.whatsapp.mode = 'wa.me';

        const integrations = getCampaignIntegrationsFromSettings(business?.settings);
        const wa = integrations.whatsapp && typeof integrations.whatsapp === 'object' ? integrations.whatsapp : {};
        if (wa.mode === 'webhook' && wa.webhook_url) {
          const hook = await postMilkHisabWhatsAppWebhook({
            webhookUrl: wa.webhook_url,
            apiToken: wa.api_token,
            payload: {
              type: 'water_hisab_reminder',
              businessId,
              customerId,
              customerName: preview.customerName,
              phone: preview.phone,
              message: preview.message,
              whatsappUrl: preview.whatsappUrl,
              period,
              amount: Number(amount) || 0,
              invoiceId,
              invoiceNumber,
            },
          });
          results.whatsapp.webhook = hook;
        }
      }
    }

    return await actionSuccess({
      customerId,
      message: preview.message,
      results,
      whatsappUrl: results.whatsapp.url,
    });
  } catch (e) {
    console.error('sendWaterHisabReminderAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_REMIND_FAILED', await getErrorMessage(e));
  }
}

/**
 * Remind all unpaid billed customers in a period (hub + email + WhatsApp links).
 */
export async function sendWaterHisabBulkRemindersAction({
  businessId,
  category,
  period,
  channels = ['hub', 'email', 'whatsapp'],
}) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });

    const summary = await getWaterHisabPeriodSummaryAction({ businessId, category, period });
    if (!summary.success) return summary;

    const targets = (summary.rows || []).filter((r) => isWaterHisabBillRemindable(r));

    const outcomes = [];
    for (const row of targets) {
      const res = await sendWaterHisabReminderAction({
        businessId,
        category,
        customerId: row.customerId,
        period,
        amount: row.amount,
        invoiceId: row.invoiceId,
        invoiceNumber: row.invoiceNumber,
        houseNo: row.houseNo,
        qtyByProduct: row.qtyByProduct,
        productMeta: row.productMeta,
        channels,
      });
      outcomes.push({
        customerId: row.customerId,
        customerName: row.customerName,
        success: Boolean(res.success),
        whatsappUrl: res.whatsappUrl || null,
        results: res.results || null,
        error: res.error || null,
      });
    }

    return await actionSuccess({
      period,
      label: summary.label,
      total: targets.length,
      outcomes,
    });
  } catch (e) {
    console.error('sendWaterHisabBulkRemindersAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_BULK_REMIND_FAILED', await getErrorMessage(e));
  }
}

async function refreshInvoicePaymentStatusFromBalance(businessId, invoiceId, client) {
  const balRes = await client.query('SELECT calculate_invoice_balance($1) as balance', [invoiceId]);
  const balance = Number(balRes.rows[0]?.balance || 0);
  const invRes = await client.query(
    `SELECT grand_total FROM invoices WHERE id = $1 AND business_id = $2 AND (is_deleted = false OR is_deleted IS NULL)`,
    [invoiceId, businessId]
  );
  const grand = Number(invRes.rows[0]?.grand_total || 0);
  const paidSoFar = Math.max(0, grand - balance);
  let paymentStatus = 'unpaid';
  if (balance <= 0.009) paymentStatus = 'paid';
  else if (paidSoFar > 0.009) paymentStatus = 'partial';

  await client.query(
    `UPDATE invoices
     SET payment_status = $1,
         status = CASE WHEN $2 THEN 'paid' WHEN status = 'paid' AND NOT $2 THEN 'sent' ELSE status END,
         updated_at = NOW()
     WHERE id = $3 AND business_id = $4`,
    [paymentStatus, paymentStatus === 'paid', invoiceId, businessId]
  );
  return { paymentStatus, balance };
}

/**
 * Compact Bills toggle: mark Route Hisab Paid/Unpaid.
 * Always writes customer domain_data period flag (hisab is separate from invoices).
 * When an invoice exists, also records/voids Route Hisab cash receipts on that invoice.
 */
export async function setWaterHisabBillPaymentStatusAction({
  businessId,
  category,
  invoiceId = null,
  customerId = null,
  period = null,
  paymentStatus,
}) {
  try {
    assertWaterHisab(category);
    const { session } = await withGuard(businessId, { permission: 'sales.record_payment' });
    const userId = session?.user?.id;
    const next = String(paymentStatus || '').toLowerCase() === 'paid' ? 'paid' : 'unpaid';

    let periodKey = null;
    if (period) {
      try {
        periodKey = parseWaterHisabBillingPeriod(period).period;
      } catch {
        return await actionFailure('INVALID_PERIOD', 'Invalid billing period');
      }
    }

    let resolvedInvoiceId = invoiceId || null;
    let resolvedCustomerId = customerId || null;
    let invoiceNumber = null;

    if (resolvedInvoiceId) {
      const invoice = await prismaBase.invoices.findFirst({
        where: { id: resolvedInvoiceId, business_id: businessId, is_deleted: false },
        select: {
          id: true,
          invoice_number: true,
          grand_total: true,
          payment_status: true,
          customer_id: true,
          notes: true,
        },
      });
      if (!invoice) return await actionFailure('NOT_FOUND', 'Invoice not found');
      resolvedCustomerId = resolvedCustomerId || invoice.customer_id;
      invoiceNumber = invoice.invoice_number;
      if (!periodKey) {
        periodKey = String(invoice.notes || '').match(/\[water_hisab_period=([^\]]+)\]/)?.[1] || null;
      }
    }

    if (!resolvedCustomerId) {
      return await actionFailure('INVALID', 'Customer required');
    }
    if (!periodKey) {
      return await actionFailure('INVALID_PERIOD', 'Billing period required to mark paid/unpaid');
    }

    const customer = await prismaBase.customers.findFirst({
      where: { id: resolvedCustomerId, business_id: businessId, is_deleted: false },
      select: { id: true, domain_data: true },
    });
    if (!customer) return await actionFailure('NOT_FOUND', 'Customer not found');

    const nextDomain = patchWaterHisabPeriodPayment(customer.domain_data, periodKey, next);
    await prismaBase.customers.update({
      where: { id: customer.id },
      data: { domain_data: nextDomain },
    });

    // No invoice yet — hisab-only status is enough.
    if (!resolvedInvoiceId) {
      return await actionSuccess({
        customerId: resolvedCustomerId,
        period: periodKey,
        paymentStatus: next,
        invoiceId: null,
        invoiceNumber: null,
        hisabOnly: true,
      });
    }

    if (next === 'paid') {
      const summary = await InvoicePaymentService.getPaymentSummary(businessId, resolvedInvoiceId);
      const balance = Number(summary?.balance ?? 0) || 0;
      if (balance <= 0.009) {
        return await actionSuccess({
          customerId: resolvedCustomerId,
          period: periodKey,
          invoiceId: resolvedInvoiceId,
          paymentStatus: 'paid',
          invoiceNumber,
          alreadyPaid: true,
        });
      }

      const result = await InvoicePaymentService.recordPayment({
        businessId,
        invoiceId: resolvedInvoiceId,
        amount: Math.round(balance * 100) / 100,
        paymentMethod: 'cash',
        notes: WATER_HISAB_COLLECTION_NOTE,
        userId,
      });

      return await actionSuccess(
        serializeDecimalsDeep({
          customerId: resolvedCustomerId,
          period: periodKey,
          invoiceId: resolvedInvoiceId,
          paymentStatus: result?.invoice?.payment_status || 'paid',
          invoiceNumber,
          paymentId: result?.payment?.id || null,
        })
      );
    }

    const payments = await InvoicePaymentService.getPaymentsForInvoice(businessId, resolvedInvoiceId);
    const routePayments = (payments || []).filter((p) =>
      String(p.notes || '').includes(WATER_HISAB_COLLECTION_NOTE)
    );

    if (!routePayments.length) {
      const inv = await prismaBase.invoices.findFirst({
        where: { id: resolvedInvoiceId, business_id: businessId, is_deleted: false },
        select: { payment_status: true },
      });
      const status = String(inv?.payment_status || '').toLowerCase();
      if (status === 'paid' || status === 'partial') {
        return await actionFailure(
          'WATER_HISAB_PAYMENT_OPEN_INVOICES',
          'This invoice has other receipts. Open invoices to reverse payment.'
        );
      }
      return await actionSuccess({
        customerId: resolvedCustomerId,
        period: periodKey,
        invoiceId: resolvedInvoiceId,
        paymentStatus: 'unpaid',
        invoiceNumber,
        alreadyUnpaid: true,
      });
    }

    for (const payment of routePayments) {
      await InvoicePaymentService.voidPayment(
        businessId,
        payment.id,
        userId,
        'Route Hisab unpaid toggle'
      );
    }

    const client = await pool.connect();
    try {
      const refreshed = await refreshInvoicePaymentStatusFromBalance(
        businessId,
        resolvedInvoiceId,
        client
      );
      if (refreshed.paymentStatus === 'paid' || refreshed.paymentStatus === 'partial') {
        return await actionFailure(
          'WATER_HISAB_PAYMENT_OPEN_INVOICES',
          'Other receipts still cover this bill. Open invoices to reverse payment.'
        );
      }
      return await actionSuccess({
        customerId: resolvedCustomerId,
        period: periodKey,
        invoiceId: resolvedInvoiceId,
        paymentStatus: refreshed.paymentStatus,
        invoiceNumber,
        voidedCount: routePayments.length,
      });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('setWaterHisabBillPaymentStatusAction', e);
    return await actionFailure(e?.code || 'WATER_HISAB_PAYMENT_STATUS_FAILED', await getErrorMessage(e));
  }
}

/**
 * Load daily rider shift dispatch & load-out reconciliation records.
 */
export async function getWaterRiderShiftsAction({ businessId, category, deliveryDate }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });
    const dateKey = toWaterHisabDateKey(deliveryDate || new Date());

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const settings = business.settings && typeof business.settings === 'object' ? business.settings : {};
    const waterDelivery = settings.waterDelivery && typeof settings.waterDelivery === 'object' ? settings.waterDelivery : {};
    const shiftsMap = waterDelivery.riderShifts && typeof waterDelivery.riderShifts === 'object' ? waterDelivery.riderShifts : {};
    const rawShifts = Array.isArray(shiftsMap[dateKey]) ? shiftsMap[dateKey] : [];

    const savedRiders = Array.isArray(waterDelivery.savedRiders) ? waterDelivery.savedRiders : [];

    const shifts = rawShifts.map((s) => {
      const recon = computeWaterRiderShiftReconciliation(s);
      return {
        id: s.id || `shift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        riderId: s.riderId || null,
        riderName: s.riderName || 'Rider',
        routeLabel: s.routeLabel || 'General Route',
        vehicleNo: s.vehicleNo || '',
        loadedBottles: recon.loadedBottles,
        returnedFull: recon.returnedFull,
        returnedEmpty: recon.returnedEmpty,
        deliveredBottles: recon.deliveredBottles,
        cashCollected: recon.cashCollected,
        expectedCash: recon.expectedCash,
        cashShortage: recon.cashShortage,
        emptyShortage: recon.emptyShortage,
        isBalanced: recon.isBalanced,
        status: s.status || 'closed',
        notes: s.notes || '',
      };
    });

    return await actionSuccess(
      serializeDecimalsDeep({
        deliveryDate: dateKey,
        shifts,
        savedRiders,
        summary: {
          totalShifts: shifts.length,
          totalRiders: shifts.length,
          totalLoaded: shifts.reduce((acc, s) => acc + s.loadedBottles, 0),
          totalBottlesLoaded: shifts.reduce((acc, s) => acc + s.loadedBottles, 0),
          totalDelivered: shifts.reduce((acc, s) => acc + s.deliveredBottles, 0),
          totalBottlesReturned: shifts.reduce(
            (acc, s) => acc + Number(s.returnedFull || 0) + Number(s.returnedEmpty || 0),
            0
          ),
          totalCash: shifts.reduce((acc, s) => acc + s.cashCollected, 0),
          totalCashCollected: shifts.reduce((acc, s) => acc + s.cashCollected, 0),
          totalShortage: shifts.reduce((acc, s) => acc + s.cashShortage, 0),
          totalCashShortage: shifts.reduce((acc, s) => acc + s.cashShortage, 0),
        },
      })
    );
  } catch (e) {
    console.error('getWaterRiderShiftsAction', e);
    return await actionFailure(e?.code || 'WATER_RIDER_SHIFTS_FAILED', await getErrorMessage(e));
  }
}

/**
 * Save rider shift load-out & return record for a date and update rider directory.
 */
export async function saveWaterRiderShiftAction({ businessId, category, deliveryDate, shiftData }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.create_invoice' });
    const dateKey = toWaterHisabDateKey(deliveryDate || new Date());

    if (!shiftData || !shiftData.riderName) {
      return await actionFailure('INVALID', 'Rider name required');
    }

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const settings = business.settings && typeof business.settings === 'object' ? { ...business.settings } : {};
    const waterDelivery = settings.waterDelivery && typeof settings.waterDelivery === 'object' ? { ...settings.waterDelivery } : {};
    const shiftsMap = waterDelivery.riderShifts && typeof waterDelivery.riderShifts === 'object' ? { ...waterDelivery.riderShifts } : {};
    const currentList = Array.isArray(shiftsMap[dateKey]) ? [...shiftsMap[dateKey]] : [];

    const recon = computeWaterRiderShiftReconciliation(shiftData);
    const shiftId = shiftData.id || `shift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const newRecord = {
      id: shiftId,
      riderId: shiftData.riderId || null,
      riderName: String(shiftData.riderName).trim(),
      routeLabel: String(shiftData.routeLabel || '').trim(),
      vehicleNo: String(shiftData.vehicleNo || '').trim(),
      loadedBottles: recon.loadedBottles,
      returnedFull: recon.returnedFull,
      returnedEmpty: recon.returnedEmpty,
      cashCollected: recon.cashCollected,
      defaultUnitPrice: Number(shiftData.defaultUnitPrice) || 150,
      notes: String(shiftData.notes || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = currentList.findIndex((s) => s.id === shiftId);
    if (existingIdx >= 0) {
      currentList[existingIdx] = newRecord;
    } else {
      currentList.push(newRecord);
    }

    // Automatically record & update Rider Directory info so operators don't have to re-enter
    const savedRiders = Array.isArray(waterDelivery.savedRiders) ? [...waterDelivery.savedRiders] : [];
    const rName = String(shiftData.riderName).trim();
    const riderIdx = savedRiders.findIndex(r => String(r.name).toLowerCase() === rName.toLowerCase());

    const riderProfile = {
      id: shiftData.riderId || (riderIdx >= 0 ? savedRiders[riderIdx].id : `rider_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
      name: rName,
      routeLabel: String(shiftData.routeLabel || (riderIdx >= 0 ? savedRiders[riderIdx].routeLabel : '') || '').trim(),
      vehicleNo: String(shiftData.vehicleNo || (riderIdx >= 0 ? savedRiders[riderIdx].vehicleNo : '') || '').trim(),
      defaultUnitPrice: Number(shiftData.defaultUnitPrice) || (riderIdx >= 0 ? savedRiders[riderIdx].defaultUnitPrice : 150),
      updatedAt: new Date().toISOString(),
    };

    if (riderIdx >= 0) {
      savedRiders[riderIdx] = { ...savedRiders[riderIdx], ...riderProfile };
    } else {
      savedRiders.push(riderProfile);
    }

    shiftsMap[dateKey] = currentList;
    waterDelivery.riderShifts = shiftsMap;
    waterDelivery.savedRiders = savedRiders;
    settings.waterDelivery = waterDelivery;

    await prismaBase.businesses.update({
      where: { id: businessId },
      data: { settings },
    });

    return await actionSuccess(
      serializeDecimalsDeep({
        deliveryDate: dateKey,
        shift: newRecord,
        savedRiders,
        reconciliation: recon,
      })
    );
  } catch (e) {
    console.error('saveWaterRiderShiftAction', e);
    return await actionFailure(e?.code || 'SAVE_RIDER_SHIFT_FAILED', await getErrorMessage(e));
  }
}

/**
 * Delete a saved rider shift record for a date.
 */
export async function deleteWaterRiderShiftAction({ businessId, category, deliveryDate, shiftId }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.create_invoice' });
    const dateKey = toWaterHisabDateKey(deliveryDate || new Date());

    if (!shiftId) {
      return await actionFailure('INVALID', 'Shift ID required');
    }

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const settings = business.settings && typeof business.settings === 'object' ? { ...business.settings } : {};
    const waterDelivery = settings.waterDelivery && typeof settings.waterDelivery === 'object' ? { ...settings.waterDelivery } : {};
    const shiftsMap = waterDelivery.riderShifts && typeof waterDelivery.riderShifts === 'object' ? { ...waterDelivery.riderShifts } : {};
    const currentList = Array.isArray(shiftsMap[dateKey]) ? [...shiftsMap[dateKey]] : [];

    const updatedList = currentList.filter((s) => s.id !== shiftId);
    shiftsMap[dateKey] = updatedList;
    waterDelivery.riderShifts = shiftsMap;
    settings.waterDelivery = waterDelivery;

    await prismaBase.businesses.update({
      where: { id: businessId },
      data: { settings },
    });

    return await actionSuccess({
      deliveryDate: dateKey,
      shiftId,
      deleted: true,
    });
  } catch (e) {
    console.error('deleteWaterRiderShiftAction', e);
    return await actionFailure(e?.code || 'DELETE_RIDER_SHIFT_FAILED', await getErrorMessage(e));
  }
}

/**
 * Plant Bottle Float & Asset Control Intelligence (plant full/empty + customer balances + idle bottle warnings).
 */
export async function getWaterBottleFloatIntelligenceAction({ businessId, category }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const settings = business.settings && typeof business.settings === 'object' ? business.settings : {};
    const waterDelivery = settings.waterDelivery && typeof settings.waterDelivery === 'object' ? settings.waterDelivery : {};
    const bottleSettings = waterDelivery.bottleAsset && typeof waterDelivery.bottleAsset === 'object' ? waterDelivery.bottleAsset : {};

    const customers = await prismaBase.customers.findMany({
      where: { business_id: businessId, is_deleted: false, is_active: true },
      select: { id: true, name: true, phone: true, domain_data: true },
      take: 500,
    });

    const customerBalances = customers.map((c) => {
      const prefs = readWaterCustomerPrefs(c);
      return prefs.bottleBalance;
    });

    const dateKey = toWaterHisabDateKey(new Date());
    const shiftsMap = waterDelivery.riderShifts && typeof waterDelivery.riderShifts === 'object' ? waterDelivery.riderShifts : {};
    const todayShifts = Array.isArray(shiftsMap[dateKey]) ? shiftsMap[dateKey] : [];
    const withRiders = todayShifts.reduce((sum, s) => {
      const loaded = Math.max(0, Number(s.loadedBottles) || 0);
      const fullRet = Math.max(0, Number(s.returnedFull) || 0);
      const emptyRet = Math.max(0, Number(s.returnedEmpty) || 0);
      return sum + Math.max(0, loaded - fullRet - emptyRet);
    }, 0);

    const idleCustomers = findIdleBottleCustomers(customers, 2);

    const summary = resolveWaterBottleFloatSummary({
      plantFull: Number(bottleSettings.plantFull) || 0,
      plantEmpty: Number(bottleSettings.plantEmpty) || 0,
      customerBalances,
      damagedCount: Number(bottleSettings.damagedScrapped) || 0,
      bottleUnitCost: Number(bottleSettings.bottleUnitCost) || 1200,
      withRiders,
      idleRisk: idleCustomers.length,
    });

    return await actionSuccess(
      serializeDecimalsDeep({
        summary,
        idleCustomers,
        totalCustomers: customers.length,
      })
    );
  } catch (e) {
    console.error('getWaterBottleFloatIntelligenceAction', e);
    return await actionFailure(e?.code || 'WATER_BOTTLE_FLOAT_FAILED', await getErrorMessage(e));
  }
}

/**
 * Save plant bottle asset counts (Plant full, empty, unit cost, damaged).
 */
export async function saveWaterBottleFloatSettingsAction({
  businessId,
  category,
  plantFull,
  plantEmpty,
  bottleUnitCost,
  damagedScrapped,
}) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.create_invoice' });

    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    if (!business) return await actionFailure('NOT_FOUND', 'Business not found');

    const settings = business.settings && typeof business.settings === 'object' ? { ...business.settings } : {};
    const waterDelivery = settings.waterDelivery && typeof settings.waterDelivery === 'object' ? { ...settings.waterDelivery } : {};

    waterDelivery.bottleAsset = {
      plantFull: Math.max(0, Number(plantFull) || 0),
      plantEmpty: Math.max(0, Number(plantEmpty) || 0),
      bottleUnitCost: Math.max(0, Number(bottleUnitCost) || 1200),
      damagedScrapped: Math.max(0, Number(damagedScrapped) || 0),
      updatedAt: new Date().toISOString(),
    };

    settings.waterDelivery = waterDelivery;

    await prismaBase.businesses.update({
      where: { id: businessId },
      data: { settings },
    });

    return await actionSuccess({
      saved: true,
      bottleAsset: waterDelivery.bottleAsset,
    });
  } catch (e) {
    console.error('saveWaterBottleFloatSettingsAction', e);
    return await actionFailure(e?.code || 'SAVE_BOTTLE_FLOAT_FAILED', await getErrorMessage(e));
  }
}

/**
 * Fetch business expense report data (Daily, Weekly, Monthly, 3-Month, 6-Month, Yearly).
 */
export async function getWaterExpenseReportDataAction({ businessId, category, periodKey = 'monthly', deliveryDate }) {
  try {
    assertWaterHisab(category);
    await withGuard(businessId, { permission: 'sales.view' });

    const refDate = deliveryDate ? new Date(deliveryDate) : new Date();
    let dateFrom = '';
    let dateTo = toWaterHisabDateKey(refDate);
    let periodLabel = 'Monthly Expense Report';

    if (periodKey === 'daily') {
      dateFrom = dateTo;
      periodLabel = `Daily Expense Report (${dateTo})`;
    } else if (periodKey === 'weekly') {
      const startOfWeek = new Date(refDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      dateFrom = toWaterHisabDateKey(startOfWeek);
      periodLabel = `Weekly Expense Report (${dateFrom} to ${dateTo})`;
    } else if (periodKey === 'monthly') {
      const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      dateFrom = toWaterHisabDateKey(startOfMonth);
      periodLabel = `Monthly Expense Report (${refDate.toLocaleString('default', { month: 'long', year: 'numeric' })})`;
    } else if (periodKey === 'last-3-months') {
      const start3m = new Date(refDate);
      start3m.setMonth(start3m.getMonth() - 3);
      dateFrom = toWaterHisabDateKey(start3m);
      periodLabel = `Last 3 Months Expense Report (${dateFrom} to ${dateTo})`;
    } else if (periodKey === 'last-6-months') {
      const start6m = new Date(refDate);
      start6m.setMonth(start6m.getMonth() - 6);
      dateFrom = toWaterHisabDateKey(start6m);
      periodLabel = `Last 6 Months Expense Report (${dateFrom} to ${dateTo})`;
    } else if (periodKey === 'yearly') {
      const startYear = new Date(refDate.getFullYear(), 0, 1);
      dateFrom = toWaterHisabDateKey(startYear);
      periodLabel = `Yearly Expense Report (Year ${refDate.getFullYear()})`;
    }

    // Query recorded GL expenses from Postgres expenses table with date boundary safety
    const res = await pool.query(
      `SELECT e.id, e.expense_number, e.amount, e.category, e.description, e.payment_method, e.date, e.created_at,
              v.name as vendor_name
       FROM expenses e
       LEFT JOIN vendors v ON e.vendor_id = v.id
       WHERE e.business_id = $1 AND e.is_deleted = false AND e.date >= $2::date AND e.date < ($3::date + INTERVAL '1 day')
       ORDER BY e.date DESC, e.created_at DESC`,
      [businessId, dateFrom, dateTo]
    );

    const dbExpenses = res.rows.map((row) => {
      const rawCat = row.category || 'miscellaneous';
      const catObj = findExpenseCategory(rawCat, 'water-delivery');
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
        source: 'gl_expense',
      };
    });

    // Fetch rider shift cash shortages as rider expense records for complete accounting
    const business = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { id: true, business_name: true, phone: true, settings: true },
    });

    const settings = business?.settings && typeof business.settings === 'object' ? business.settings : {};
    const waterDelivery = settings.waterDelivery && typeof settings.waterDelivery === 'object' ? settings.waterDelivery : {};
    const shiftsMap = waterDelivery.riderShifts && typeof waterDelivery.riderShifts === 'object' ? waterDelivery.riderShifts : {};

    const shiftExpenses = [];
    Object.entries(shiftsMap).forEach(([dKey, shiftList]) => {
      if (dKey >= dateFrom && dKey <= dateTo && Array.isArray(shiftList)) {
        shiftList.forEach((s) => {
          const recon = computeWaterRiderShiftReconciliation(s);
          if (recon.cashShortage > 0) {
            shiftExpenses.push({
              id: `shortage_${s.id || dKey}`,
              expense_number: `RIDER-SHORT-${dKey}`,
              amount: recon.cashShortage,
              category: 'Rider Cash Shortage',
              categoryKey: 'rider_shortage',
              description: `Shift cash shortage -- Rider: ${s.riderName || 'Rider'} (${s.routeLabel || 'Route'})`,
              paymentMethod: 'Cash Reconcile',
              date: dKey,
              source: 'rider_shift',
            });
          }
        });
      }
    });

    const allExpenses = [...dbExpenses, ...shiftExpenses].sort((a, b) => b.date.localeCompare(a.date));
    const totalAmount = Math.round(allExpenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;

    return await actionSuccess(
      serializeDecimalsDeep({
        periodKey,
        periodLabel,
        dateFrom,
        dateTo,
        expenses: allExpenses,
        totalAmount,
        expenseCount: allExpenses.length,
        business: {
          id: business?.id,
          name: business?.business_name || 'Water Delivery Business',
          phone: business?.phone || '',
          settings: business?.settings,
        },
      })
    );
  } catch (e) {
    console.error('getWaterExpenseReportDataAction', e);
    return await actionFailure(e?.code || 'EXPENSE_REPORT_FAILED', await getErrorMessage(e));
  }
}
