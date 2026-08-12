/**
 * Water-delivery Route Hisab helpers — daily rider sheet + week/month collection.
 * Isolated: only use when isWaterHisabRelevant(category).
 * Date/period math reuses milk helpers (calendar-local, ISO week) without sharing tables.
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import {
  toMilkHisabDateKey,
  toMilkHisabPeriodKey,
  toMilkHisabWeekKey,
  parseMilkHisabBillingPeriod,
  milkHisabPeriodsOverlap,
  buildMilkHisabPeriodKpis,
  shortMilkHisabProductLabel,
  abbreviateMilkHisabColumn,
  buildMilkHisabDayBreakdownGrid,
  formatMilkHisabDayHeaderLine,
  isMilkHisabBillRemindable,
  buildMilkHisabBillLinesForReminder,
  resolveMilkHisabRowPaymentStatus,
} from '@/lib/storefront/milkShopHisab';
import { waterDeliveryCadenceCoversDate } from '@/lib/data/pakistanDeliveryAreas';

export const WATER_HISAB_PERIOD_PREFIX = '[water_hisab_period=';
export const WATER_HISAB_COLLECTION_NOTE = 'Water Route Hisab collection';

/** Unambiguous alphabet for auto customer IDs (no 0/O/1/I). */
const WATER_CUSTOMER_ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Sheet size groups — most water suppliers run 19L only; others are opt-in.
 * @type {Array<{ id: string, label: string, match: RegExp, defaultEnabled: boolean }>}
 */
export const WATER_HISAB_SIZE_GROUPS = [
  { id: '19l', label: '19L', match: /19\s*l/i, defaultEnabled: true },
  { id: '12l', label: '12L', match: /12\s*l/i, defaultEnabled: false },
  { id: '5l', label: '5L', match: /5\s*l\b/i, defaultEnabled: false },
  { id: 'pet', label: 'PET / Cases', match: /1\.5\s*l|1500\s*ml|600\s*ml|500\s*ml|330\s*ml|\bpet\b|case|pack/i, defaultEnabled: false },
  { id: 'deposit', label: 'Deposit', match: /deposit|empty|security/i, defaultEnabled: false },
  { id: 'stand', label: 'Stand', match: /stand|dispenser\s*unit|cooler/i, defaultEnabled: false },
];

export const WATER_HISAB_DEFAULT_ENABLED_SIZES = WATER_HISAB_SIZE_GROUPS.filter((g) => g.defaultEnabled).map(
  (g) => g.id
);

/**
 * Daily sheet column configuration options.
 * Allows business owners to show/hide Del/Rec columns for each enabled size.
 */
export const WATER_HISAB_COLUMN_TYPES = [
  { id: 'delivered', label: 'Delivered', shortLabel: 'Del', defaultEnabled: true },
  { id: 'received', label: 'Received', shortLabel: 'Rec', defaultEnabled: true },
];

export const WATER_HISAB_DEFAULT_ENABLED_COLUMNS = WATER_HISAB_COLUMN_TYPES
  .filter((c) => c.defaultEnabled)
  .map((c) => c.id);

/**
 * Rider checklist configuration.
 */
export const WATER_HISAB_CHECKLIST_MODES = {
  RIDER_WISE: 'rider_wise', // Filter by rider (default)
  FULL_LIST: 'full_list',   // Always print full list regardless of rider
};

export const WATER_HISAB_DEFAULT_CHECKLIST_MODE = WATER_HISAB_CHECKLIST_MODES.RIDER_WISE;

/**
 * Canonical product type keys — one column per (sizeGroup × type) pair.
 * The resolver ensures at most ONE product per type per size group appears.
 */
export const WATER_PRODUCT_TYPE_PATTERNS = {
  refill: /\b(refill|rfl|exchange)\b/i,
  bottle: /\b(bottle|bot|new\s*bottle|dispenser|gallon|can)\b/i,
  case:   /\b(case|cas|crate|pack|box)\b/i,
  deposit: /\b(deposit|security|empty)\b/i,
  stand:   /\b(stand|dispenser\s*unit|cooler)\b/i,
};

/** Products whose names match these patterns are NEVER shown as columns. */
const WATER_VAGUE_PRODUCT_PATTERN = /\b(pcs|set|kit|unit)\b/i;

export const WATER_HISAB_DEFAULT_COLUMN_HINTS = [
  // 19L — specific hints first, then a catch-all for any 19L product
  { id: '19l_refill', sizeGroup: '19l', type: 'refill', label: '19L Refill',  match: /19\s*l.*refill|refill.*19\s*l/i,                                              preferUnit: 'bottle' },
  { id: '19l_bottle', sizeGroup: '19l', type: 'bottle', label: '19L Bottle',  match: /19\s*l.*(bottle|bot|dispenser|gallon|can|new)|(bottle|bot|dispenser|gallon|can|new).*19\s*l/i, preferUnit: 'bottle' },
  { id: '19l_case',   sizeGroup: '19l', type: 'case',   label: '19L Case',    match: /19\s*l.*(case|cas|crate|pack)|(case|cas|crate|pack).*19\s*l/i,                preferUnit: 'case'   },
  // Catch-all: any 19L product that doesn't match the specific hints above
  // (e.g. "19L Water", "19 Litre Pure", "19L Drinking Water") — treated as refill (most common)
  { id: '19l_gen',    sizeGroup: '19l', type: 'refill', label: '19L',         match: /19\s*l|19\s*litr/i,                                                           preferUnit: 'bottle' },
  // 12L
  { id: '12l_refill', sizeGroup: '12l', type: 'refill', label: '12L Refill',  match: /12\s*l.*refill|refill.*12\s*l/i,                                             preferUnit: 'bottle' },
  { id: '12l_bottle', sizeGroup: '12l', type: 'bottle', label: '12L Bottle',  match: /12\s*l.*(bottle|bot|new|gallon)|(bottle|bot|new|gallon).*12\s*l/i,           preferUnit: 'bottle' },
  { id: '12l_gen',    sizeGroup: '12l', type: 'refill', label: '12L',         match: /12\s*l\b/i,                                                                  preferUnit: 'bottle' },
  // 5L
  { id: '5l_refill',  sizeGroup: '5l',  type: 'refill', label: '5L Refill',   match: /5\s*l.*refill|refill.*5\s*l/i,                                               preferUnit: 'bottle' },
  { id: '5l_jug',     sizeGroup: '5l',  type: 'bottle', label: '5L Jug',      match: /5\s*l.*(jug|bottle|can|new)|(jug|bottle|can|new).*5\s*l/i,                  preferUnit: 'bottle' },
  { id: '5l_gen',     sizeGroup: '5l',  type: 'refill', label: '5L',          match: /5\s*l\b/i,                                                                   preferUnit: 'bottle' },
  // PET / Cases
  { id: '1_5l_case',  sizeGroup: 'pet', type: 'case',   label: '1.5L Case',   match: /1\.5\s*l.*(case|pack|12)|(case|pack|12).*1\.5\s*l/i,                        preferUnit: 'case'   },
  { id: '1_5l_single',sizeGroup: 'pet', type: 'bottle', label: '1.5L Single', match: /1\.5\s*l|1500\s*ml/i,                                                        preferUnit: 'bottle' },
  { id: '600ml',      sizeGroup: 'pet', type: 'bottle', label: '600ml',        match: /600\s*ml|500\s*ml|pet/i,                                                     preferUnit: 'case'   },
  // Deposit / Stand
  { id: 'deposit',    sizeGroup: 'deposit', type: 'deposit', label: 'Deposit', match: /deposit|empty|security/i,                                                   preferUnit: 'pcs'    },
  { id: 'stand',      sizeGroup: 'stand',   type: 'stand',   label: 'Stand',   match: /stand|dispenser\s*unit|cooler/i,                                             preferUnit: 'pcs'    },
];

/**
 * @param {object} [settings]
 * @returns {string[]}
 */
export function readWaterHisabEnabledSizeIds(settings = {}) {
  const raw =
    settings?.waterHisab?.enabledSizeIds ||
    settings?.waterHisab?.enabledSizes ||
    settings?.storefront?.waterDelivery?.enabledSizeIds;
  if (Array.isArray(raw) && raw.length) {
    const allowed = new Set(WATER_HISAB_SIZE_GROUPS.map((g) => g.id));
    const cleaned = [...new Set(raw.map((id) => String(id || '').toLowerCase().trim()).filter((id) => allowed.has(id)))];
    if (cleaned.length) return cleaned;
  }
  return [...WATER_HISAB_DEFAULT_ENABLED_SIZES];
}

/**
 * @param {object} [settings]
 * @returns {string[]}
 */
export function readWaterHisabEnabledColumns(settings = {}) {
  const raw = settings?.waterHisab?.enabledColumns;
  if (Array.isArray(raw) && raw.length) {
    const allowed = new Set(WATER_HISAB_COLUMN_TYPES.map((c) => c.id));
    const cleaned = [...new Set(raw.map((id) => String(id || '').toLowerCase().trim()).filter((id) => allowed.has(id)))];
    if (cleaned.length) return cleaned;
  }
  return [...WATER_HISAB_DEFAULT_ENABLED_COLUMNS];
}

/**
 * @param {object} [settings]
 * @returns {string} 'rider_wise' | 'full_list'
 */
export function readWaterHisabChecklistMode(settings = {}) {
  const raw = settings?.waterHisab?.checklistMode;
  const valid = Object.values(WATER_HISAB_CHECKLIST_MODES);
  if (raw && valid.includes(raw)) {
    return raw;
  }
  return WATER_HISAB_DEFAULT_CHECKLIST_MODE;
}

/**
 * Minimum hisab-ready SKUs seeded for existing water-delivery accounts that have
 * no products (registered before the full catalog seed was wired).
 * Intentionally minimal — just the two core 19L route SKUs every operator needs.
 * No Unsplash dependency so this is safe to import in server actions.
 */
export const WATER_HISAB_CORE_SKUS = [
  {
    name: '19L Mineral Water (Refill)',
    category: '19L Dispenser',
    sku: 'WTR-19L-REFILL-01',
    unit: 'bottle',
    price: 150,
    cost_price: 83,
    stock: 400,
    is_featured: true,
    description:
      'Standard 19-litre dispenser refill. Rider delivers full bottles and collects empties (DEL / REC).',
    domain_data: {
      bottlesize: '19L Dispenser',
      refilltype: 'Refill (empty return)',
      productcode: '1',
      depositamount: 800,
      packtype: 'Single bottle',
      seedCatalog: true,
    },
  },
  {
    name: '19L New Bottle + First Fill',
    category: '19L Dispenser',
    sku: 'WTR-19L-NEW-02',
    unit: 'bottle',
    price: 950,
    cost_price: 523,
    stock: 80,
    is_featured: true,
    description:
      'New 19L bottle with first fill. Security deposit applies on account (refundable on close).',
    domain_data: {
      bottlesize: '19L Dispenser',
      refilltype: 'Both',
      productcode: '1N',
      depositamount: 800,
      seedCatalog: true,
    },
  },
];

/**
 * Default `settings.waterHisab` seed written into `businesses.settings` at registration.
 * Makes the 19L DEL+REC sheet configuration durable from day one instead of relying
 * purely on runtime fallback defaults in readWaterHisabEnabled*.
 * @returns {{ waterHisab: { enabledSizeIds: string[], enabledColumns: string[], checklistMode: string } }}
 */
export function buildDefaultWaterDeliverySettingsSeed() {
  return {
    waterHisab: {
      enabledSizeIds: [...WATER_HISAB_DEFAULT_ENABLED_SIZES],
      enabledColumns: [...WATER_HISAB_DEFAULT_ENABLED_COLUMNS],
      checklistMode: WATER_HISAB_DEFAULT_CHECKLIST_MODE,
    },
  };
}

/**
 * Map a product name/category blob to a size-group id.
 * @param {string} blob
 * @returns {string | null}
 */
export function resolveWaterHisabProductSizeGroup(blob = '') {
  const text = String(blob || '');
  for (const group of WATER_HISAB_SIZE_GROUPS) {
    if (group.match.test(text)) return group.id;
  }
  return null;
}

/**
 * Random unique customer ID: W-XXXXXX (per-business uniqueness checked by caller).
 * @param {() => number} [rng]
 */
export function generateWaterCustomerId(rng = Math.random) {
  let body = '';
  for (let i = 0; i < 6; i += 1) {
    body += WATER_CUSTOMER_ID_ALPHABET[Math.floor(rng() * WATER_CUSTOMER_ID_ALPHABET.length)];
  }
  return `W-${body}`;
}

/**
 * @param {string | null | undefined} value
 */
export function isValidWaterCustomerIdFormat(value) {
  return /^W-[2-9A-HJ-NP-Z]{6}$/i.test(String(value || '').trim());
}

/**
 * Prefer customer preferred size, then first 19L column, then first product.
 * @param {object[]} hisabProducts
 * @param {{ bottleSizePref?: string }} [prefs]
 * @returns {string | null}
 */
export function pickWaterHisabDefaultProductId(hisabProducts = [], prefs = {}) {
  const list = Array.isArray(hisabProducts) ? hisabProducts : [];
  if (!list.length) return null;

  const prefRaw = String(prefs.bottleSizePref || '').trim().toLowerCase();
  if (prefRaw && prefRaw !== 'mixed') {
    const prefMatch = list.find((p) => {
      const blob = `${p.name || ''} ${p.category || ''} ${p.hisabShortLabel || ''}`.toLowerCase();
      if (prefRaw.includes('19') && /19\s*l/.test(blob)) return true;
      if (prefRaw.includes('12') && /12\s*l/.test(blob)) return true;
      if (prefRaw.includes('5') && !prefRaw.includes('1.5') && /5\s*l/.test(blob)) return true;
      if ((prefRaw.includes('1.5') || prefRaw.includes('pet') || prefRaw.includes('600') || prefRaw.includes('500')) &&
          /1\.5\s*l|600\s*ml|500\s*ml|pet|case/.test(blob)) return true;
      if (prefRaw.includes('stand') && /stand|cooler/.test(blob)) return true;
      return blob.includes(prefRaw.replace(/\s+/g, ''));
    });
    if (prefMatch) return String(prefMatch.id);
  }

  const nineteen = list.find((p) => /19\s*l/i.test(`${p.name || ''} ${p.category || ''} ${p.hisabShortLabel || ''}`));
  if (nineteen) return String(nineteen.id);

  const waterish = list.find((p) =>
    /water|dispenser|bottle|mineral|refill/i.test(`${p.name || ''} ${p.category || ''}`)
  );
  return String((waterish || list[0]).id);
}

/**
 * @param {string | null | undefined} category
 */
export function isWaterDeliveryStore(category) {
  return resolveDomainKey(category) === 'water-delivery';
}

/**
 * @param {string | null | undefined} category
 */
export function isWaterHisabRelevant(category) {
  return isWaterDeliveryStore(category);
}

/**
 * True when either milk or water route sheet applies.
 * @param {string | null | undefined} category
 */
export function isRouteHisabRelevant(category) {
  const key = resolveDomainKey(category);
  return key === 'milk-shop' || key === 'water-delivery';
}

export const toWaterHisabDateKey = toMilkHisabDateKey;
export const toWaterHisabPeriodKey = toMilkHisabPeriodKey;
export const toWaterHisabWeekKey = toMilkHisabWeekKey;
export const parseWaterHisabBillingPeriod = parseMilkHisabBillingPeriod;
export const waterHisabPeriodsOverlap = milkHisabPeriodsOverlap;
export const buildWaterHisabPeriodKpis = buildMilkHisabPeriodKpis;
export const abbreviateWaterHisabColumn = abbreviateMilkHisabColumn;
export const buildWaterHisabDayBreakdownGrid = buildMilkHisabDayBreakdownGrid;
export const formatWaterHisabDayHeaderLine = formatMilkHisabDayHeaderLine;
export const isWaterHisabBillRemindable = isMilkHisabBillRemindable;
export const buildWaterHisabBillLinesForReminder = buildMilkHisabBillLinesForReminder;
export const resolveWaterHisabRowPaymentStatus = resolveMilkHisabRowPaymentStatus;

/**
 * Resolves a clean, short, distinct label for a water product.
 * @param {object|string} nameOrProduct
 * @param {number} [max=14]
 */
export function shortWaterHisabProductLabel(nameOrProduct, max = 14) {
  const product =
    nameOrProduct && typeof nameOrProduct === 'object'
      ? nameOrProduct
      : { name: String(nameOrProduct || '') };

  if (product.hisabShortLabel) {
    const s = String(product.hisabShortLabel).trim();
    if (s.length <= max) return s;
    return s.slice(0, max);
  }

  const hinted = resolveWaterHisabHintLabel(product);
  if (hinted) {
    if (hinted.length <= max) return hinted;
    return hinted.slice(0, max);
  }

  let raw = String(product.name || 'Item').trim();
  if (raw.length > max) {
    raw = raw
      .replace(/\b(tenvo|fresh|pure|mineral|water)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (!raw) raw = String(product.name || 'Item').trim();
  if (raw.length <= max) return raw;
  return raw.slice(0, max);
}

/**
 * @param {string | null | undefined} notes
 */
export function extractWaterHisabPeriodFromNotes(notes) {
  const m = String(notes || '').match(/\[water_hisab_period=([^\]]+)\]/);
  return m?.[1] || null;
}

/**
 * @param {string} period
 */
export function waterHisabPeriodMarker(period) {
  return `${WATER_HISAB_PERIOD_PREFIX}${period}]`;
}

/**
 * @param {string | null | undefined} notes
 * @param {string} period
 */
export function invoiceHasWaterHisabPeriod(notes, period) {
  if (!notes || !period) return false;
  return String(notes).includes(waterHisabPeriodMarker(period));
}

/**
 * @param {Array<object>} invoices
 * @param {string} customerId
 * @param {string} periodKey
 */
export function resolveWaterHisabInvoiceForPeriod(invoices = [], customerId, periodKey) {
  const forCustomer = (invoices || []).filter((inv) => String(inv.customer_id) === String(customerId));
  if (!forCustomer.length) return null;
  const exact = forCustomer.find((inv) => invoiceHasWaterHisabPeriod(inv.notes, periodKey));
  if (exact) return exact;
  for (const inv of forCustomer) {
    const marked = extractWaterHisabPeriodFromNotes(inv.notes);
    if (marked && waterHisabPeriodsOverlap(marked, periodKey)) return inv;
  }
  return null;
}

/**
 * @param {object} product
 * @param {Set<string>} enabledSizes
 */
function productMatchesEnabledWaterSizes(product, enabledSizes) {
  if (!enabledSizes || enabledSizes.size === 0) return true;
  const blob = `${product.name || ''} ${product.category || ''} ${product.category_name || ''} ${product.hisabShortLabel || ''}`;
  const group = resolveWaterHisabProductSizeGroup(blob);
  if (!group) {
    // Unknown SKUs only appear when every enabled group is already covered — caller decides pad.
    return false;
  }
  return enabledSizes.has(group);
}

/**
 * @param {object[]} products
 * @param {object} [settings]
 */
/**
 * Resolves which products appear as columns on the daily delivery sheet.
 * Strict deduplication: at most ONE product per (sizeGroup × type) combination.
 * Example: 19L can have ONE "refill" + ONE "bottle" + ONE "case" = max 3 columns.
 * 
 * @param {object[]} products - Full product inventory
 * @param {object} settings - Business settings with enabledSizeIds
 * @returns {object[]} - Up to 8 products with unique sizeGroup+type combos
 */
export function resolveWaterHisabProducts(products = [], settings = {}) {
  const enabledSizeIds = readWaterHisabEnabledSizeIds(settings);
  const enabledSizes = new Set(enabledSizeIds);
  const rawIds = settings?.waterHisab?.productIds || settings?.storefront?.waterDelivery?.hisabProductIds;
  
  // Filter active, non-deleted products
  const active = (products || []).filter(
    (p) => p && p.id && p.is_active !== false && p.is_deleted !== true && (p.name || p.sku)
  );

  /**
   * Classify product type (refill/bottle/case/deposit/stand).
   * Returns null if product is vague (PCS/SET/KIT).
   */
  function classifyProductType(product) {
    const name = String(product.name || '').toLowerCase();
    
    // REJECT vague products immediately
    if (WATER_VAGUE_PRODUCT_PATTERN.test(name)) {
      return null;
    }
    
    // Check explicit type patterns
    for (const [type, pattern] of Object.entries(WATER_PRODUCT_TYPE_PATTERNS)) {
      if (pattern.test(name)) {
        return type;
      }
    }
    
    // Fallback: products without explicit type → assume "refill" (most common)
    return 'refill';
  }

  /**
   * Wraps product with metadata
   */
  function withShortLabel(p, label, type) {
    const sizeGroup = resolveWaterHisabProductSizeGroup(
      `${p.name || ''} ${p.category || ''} ${p.category_name || ''}`
    );
    return {
      ...p,
      id: String(p.id),
      hisabShortLabel: label || resolveWaterHisabHintLabel(p) || null,
      sizeGroup,
      productType: type || classifyProductType(p),
    };
  }

  // Priority 1: Manual productIds override (if set in settings)
  if (Array.isArray(rawIds) && rawIds.length) {
    const uniqueRawIds = Array.from(new Set(rawIds.map((id) => String(id))));
    const byId = new Map(active.map((p) => [String(p.id), p]));
    const picked = uniqueRawIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .filter((p) => {
        const type = classifyProductType(p);
        if (!type) return false; // Reject vague
        return productMatchesEnabledWaterSizes(p, enabledSizes);
      })
      .map((p) => withShortLabel(p, null, classifyProductType(p)));
    
    if (picked.length) {
      return picked.slice(0, 8);
    }
  }

  // Priority 2: Auto-select using hints (one product per sizeGroup×type)
  const hints = WATER_HISAB_DEFAULT_COLUMN_HINTS.filter((h) => enabledSizes.has(h.sizeGroup || ''));
  const usedCombos = new Map(); // key = `${sizeGroup}:${type}`, value = product
  const used = new Set(); // product IDs already selected

  // First pass: match specific hints (refill, bottle, case)
  for (const hint of hints) {
    if (!hint.type) continue; // Skip hints without explicit type
    
    const comboKey = `${hint.sizeGroup}:${hint.type}`;
    if (usedCombos.has(comboKey)) continue; // Already have this combo
    
    const match = active.find((p) => {
      if (used.has(String(p.id))) return false;
      
      const pType = classifyProductType(p);
      if (!pType || pType !== hint.type) return false; // Wrong type or vague
      
      const blob = `${p.name || ''} ${p.category || ''} ${p.category_name || ''}`;
      if (!hint.match.test(blob)) return false; // Doesn't match hint pattern
      
      // Check size group
      const pSizeGroup = resolveWaterHisabProductSizeGroup(blob);
      if (pSizeGroup !== hint.sizeGroup) return false;
      
      // preferUnit is a soft tiebreaker only — never hard-reject on unit mismatch.
      // A product that matches name + sizeGroup + type is always accepted regardless of unit.
      return true;
    });
    
    if (match) {
      used.add(String(match.id));
      usedCombos.set(comboKey, withShortLabel(match, hint.label, hint.type));
    }
  }

  // Second pass: fill remaining combos from unmatched products (if space available)
  // This handles products that don't match specific hints but are valid types
  if (usedCombos.size < 8) {
    for (const p of active) {
      if (usedCombos.size >= 8) break;
      if (used.has(String(p.id))) continue;
      
      const pType = classifyProductType(p);
      if (!pType) continue; // Reject vague products
      
      const blob = `${p.name || ''} ${p.category || ''} ${p.category_name || ''}`;
      const pSizeGroup = resolveWaterHisabProductSizeGroup(blob);
      if (!pSizeGroup || !enabledSizes.has(pSizeGroup)) continue;
      
      const comboKey = `${pSizeGroup}:${pType}`;
      if (usedCombos.has(comboKey)) continue; // Already have this combo
      
      used.add(String(p.id));
      usedCombos.set(comboKey, withShortLabel(p, null, pType));
    }
  }

  // Convert map to array, sort by sizeGroup priority
  // Bottle comes before Refill: for water delivery the primary SKU is the new 19L bottle
  const sizeGroupPriority = { '19l': 1, '12l': 2, '5l': 3, 'pet': 4, 'deposit': 5, 'stand': 6 };
  const typePriority = { 'bottle': 1, 'refill': 2, 'case': 3, 'deposit': 4, 'stand': 5 };
  
  return Array.from(usedCombos.values())
    .sort((a, b) => {
      const aSizeP = sizeGroupPriority[a.sizeGroup] || 99;
      const bSizeP = sizeGroupPriority[b.sizeGroup] || 99;
      if (aSizeP !== bSizeP) return aSizeP - bSizeP;
      
      const aTypeP = typePriority[a.productType] || 99;
      const bTypeP = typePriority[b.productType] || 99;
      return aTypeP - bTypeP;
    })
    .slice(0, 8);
}

/**
 * @param {object} product
 */
export function resolveWaterHisabHintLabel(product = {}) {
  const blob = `${product.name || ''} ${product.category || ''} ${product.category_name || ''}`;
  for (const hint of WATER_HISAB_DEFAULT_COLUMN_HINTS) {
    if (hint.match.test(blob)) return hint.label;
  }
  return null;
}

/**
 * @param {object} customer
 */
export function readWaterCustomerPrefs(customer = {}) {
  const dd = customer.domain_data && typeof customer.domain_data === 'object' ? customer.domain_data : {};
  const house =
    dd.houseno || dd.house_no || dd.houseNo || dd.villa || customer.address || '';
  const route = dd.deliveryroute || dd.delivery_route || dd.rider || '';
  const dailyBottles = Number(dd.dailybottles ?? dd.daily_bottles ?? dd.dailymilkkg ?? 0);
  const activeRaw = dd.deliveryactive ?? dd.delivery_active;
  const deliveryActive =
    activeRaw === false || activeRaw === 'No' || activeRaw === 'no' || activeRaw === 0
      ? false
      : true;
  const deliveryDays = String(dd.deliverydays || dd.delivery_days || 'Daily').trim() || 'Daily';
  const productRate = Number(dd.productrate ?? dd.product_rate ?? dd.accountrate ?? dd.rate ?? 0);
  const bottleBalance = Number(dd.bottlebalance ?? dd.bottle_balance ?? dd.balbottle ?? 0);
  const dayOfFollow = Number(dd.dayoffollow ?? dd.day_of_follow ?? dd.followday ?? 0);
  return {
    houseNo: String(house || '').trim(),
    floorFlat: String(dd.floorflat || dd.floor_flat || dd.flat || '').trim(),
    proprietorName: String(dd.proprietorname || dd.proprietor || dd.contactperson || '').trim(),
    accountNo: String(
      dd.accountno ||
        dd.account_no ||
        dd.partyaccountno ||
        dd.customerid ||
        dd.customer_id ||
        dd.customercode ||
        ''
    ).trim(),
    townCode: String(dd.towncode || dd.town_code || '').trim(),
    routeLabel: String(route || '').trim(),
    city: String(dd.city || '').trim(),
    deliveryArea: String(dd.deliveryarea || dd.delivery_area || dd.area || '').trim(),
    postalCode: String(dd.postalcode || dd.postal_code || dd.areacode || dd.area_code || dd.zip || '').trim(),
    customerType: String(dd.customertype || dd.customer_type || 'Home & Flat').trim() || 'Home & Flat',
    deliveryDays,
    dayOfFollow: Number.isFinite(dayOfFollow) && dayOfFollow > 0 ? dayOfFollow : 0,
    dailyBottles: Number.isFinite(dailyBottles) && dailyBottles > 0 ? dailyBottles : 0,
    productRate: Number.isFinite(productRate) && productRate > 0 ? productRate : 0,
    bottleBalance: Number.isFinite(bottleBalance) ? bottleBalance : 0,
    bottleSizePref: String(dd.bottlesizepref || dd.preferredbottlesize || dd.bottlesize || '').trim(),
    emptyDeposit: Number(dd.emptydeposit ?? dd.empty_deposit ?? dd.depositamount ?? 0) || 0,
    openingBalanceHint: Number(dd.openingbalancehint ?? dd.opening_balance_hint ?? dd.prevmbal ?? 0) || 0,
    deliveryActive,
    preferredPayment: String(
      dd.preferredpayment ||
        dd.preferred_payment ||
        dd.preferredpaymentmethod ||
        dd.preferred_payment_method ||
        ''
    ).trim(),
    /** Alias for milk-shaped day sheet code that expects dailyMilkKg */
    dailyMilkKg: Number.isFinite(dailyBottles) && dailyBottles > 0 ? dailyBottles : 0,
  };
}

/**
 * Classic plant formula: BAL = previous + DEL − REC
 * @param {{ previous?: number, delivered?: number, received?: number }} args
 */
export function computeWaterBottleBalance({ previous = 0, delivered = 0, received = 0 } = {}) {
  const prev = Number(previous) || 0;
  const del = Number(delivered) || 0;
  const rec = Number(received) || 0;
  return Math.round((prev + del - rec) * 1000) / 1000;
}

/**
 * Opening BAL for a day when stored balance already includes that day's DEL/REC.
 * opening = stored − DEL + REC
 * @param {{ storedBalance?: number, delivered?: number, received?: number }} args
 */
export function openingWaterBottleBalance({ storedBalance = 0, delivered = 0, received = 0 } = {}) {
  return computeWaterBottleBalance({
    previous: storedBalance,
    delivered: -(Number(delivered) || 0),
    received: -(Number(received) || 0),
  });
}

/**
 * Sale amount using account rate when set (ZARA RATE field).
 * @param {{ qty?: number, unitPrice?: number, accountRate?: number, discount?: number }} args
 */
export function computeWaterSaleAmount({ qty = 0, unitPrice = 0, accountRate = 0, discount = 0 } = {}) {
  const q = Number(qty) || 0;
  const rate = (Number(accountRate) > 0 ? Number(accountRate) : Number(unitPrice)) || 0;
  const disc = Number(discount) || 0;
  return Math.max(0, Math.round((q * rate - disc) * 100) / 100);
}

/**
 * Aggregate daily water deliveries by bottle size for monthly bill printing.
 * Merges first-fill + refill + new bottle products into single size-group totals.
 * This allows the monthly bill to show a clean "Del / Rec / Bal" column format instead
 * of separate columns for each product SKU.
 * 
 * Example: If a day has:
 *   - 2× 19L Refill (product_id: 'abc')
 *   - 1× 19L First Fill (product_id: 'xyz')
 * Result: 19l → { del: 3, rec: 2 }
 * 
 * @param {Array<{ product_id: string, quantity: number, received_quantity: number }>} lines
 * @param {Array<{ id: string, sizeGroup?: string|null }>} products
 * @returns {Map<string, { del: number, rec: number }>} Size group → delivery totals
 */
export function aggregateWaterLinesBySizeGroup(lines = [], products = []) {
  const productSizeMap = new Map(
    (products || []).map((p) => [String(p.id), p.sizeGroup || '19l'])
  );

  const totals = new Map();

  for (const line of lines || []) {
    const pid = String(line.product_id || line.productId);
    const sizeGroup = productSizeMap.get(pid) || '19l'; // Default to 19L if product not found
    
    if (!totals.has(sizeGroup)) {
      totals.set(sizeGroup, { del: 0, rec: 0 });
    }
    
    const group = totals.get(sizeGroup);
    group.del += Number(line.quantity) || 0;
    group.rec += Number(line.received_quantity || line.receivedQuantity) || 0;
  }

  return totals;
}

/**
 * Build water-specific monthly bill grid with Day/Del/Rec/Bal columns only.
 * Consolidates all bottle sizes (first fill + refill) into single delivery totals per day.
 * The Y/N status column is removed — activity is shown by non-zero Del/Rec values.
 * 
 * Monthly bill format:
 * ```
 * Day  Bottles  Balance
 * DD   Del Rec  Bal
 * 01    1   1    5
 * 02    0   0    5
 * 03    2   2    5
 * ```
 * 
 * @param {object} args
 * @param {Array<{ delivery_date: Date|string, lines: Array }>} args.stops - Daily delivery stops
 * @param {Array<{ id: string, sizeGroup?: string }>} args.products - Product catalog with size metadata
 * @param {string} args.startIso - Period start date (YYYY-MM-DD)
 * @param {string} args.endIso - Period end date (YYYY-MM-DD)
 * @param {number} args.openingBalance - Bottle balance at period start
 * @returns {{ days: Array<{ dayNum, dateKey, del, rec, balance }>, activeDays: number, closingBalance: number }}
 */
export function buildWaterMonthlyBillGrid({
  stops = [],
  products = [],
  startIso = '',
  endIso = '',
  openingBalance = 0,
}) {
  const start = new Date(startIso || new Date());
  const end = new Date(endIso || new Date());
  
  // Build map of date → aggregated deliveries (sum all bottle sizes)
  const dayMap = new Map();
  
  for (const stop of stops || []) {
    const dateKey = toWaterHisabDateKey(stop.delivery_date);
    const sizeGroups = aggregateWaterLinesBySizeGroup(stop.lines || [], products);
    
    // Sum across all size groups (19L + 12L + 5L etc.) for total daily Del/Rec
    let dayDel = 0;
    let dayRec = 0;
    for (const [_, totals] of sizeGroups) {
      dayDel += totals.del;
      dayRec += totals.rec;
    }
    
    // If multiple stops on same day (rare but possible), sum them
    if (dayMap.has(dateKey)) {
      const existing = dayMap.get(dateKey);
      dayDel += existing.del;
      dayRec += existing.rec;
    }
    
    dayMap.set(dateKey, { del: dayDel, rec: dayRec });
  }
  
  // Generate day-by-day grid with running balance
  const days = [];
  let runningBalance = Number(openingBalance) || 0;
  let activeDays = 0;
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = toWaterHisabDateKey(d);
    const dayData = dayMap.get(dateKey) || { del: 0, rec: 0 };
    
    const dayNum = d.getDate();
    const hasActivity = dayData.del > 0 || dayData.rec > 0;
    
    if (hasActivity) activeDays += 1;
    
    // Update running balance: BAL = previous + DEL - REC
    runningBalance = Math.round((runningBalance + dayData.del - dayData.rec) * 1000) / 1000;
    
    days.push({
      dayNum,
      dateKey,
      del: Math.round(dayData.del * 1000) / 1000,
      rec: Math.round(dayData.rec * 1000) / 1000,
      balance: runningBalance,
      hasActivity,
    });
  }
  
  return {
    days,
    activeDays,
    closingBalance: runningBalance,
  };
}

/**
 * Pad helper for column alignment in thermal receipts.
 * @param {string|number} text
 * @param {number} width
 * @param {'left'|'right'|'center'} align
 */
function padWaterColumn(text, width, align = 'left') {
  const str = String(text ?? '').slice(0, width);
  if (align === 'right') return str.padStart(width, ' ');
  if (align === 'center') {
    const leftPad = Math.floor((width - str.length) / 2);
    return str.padStart(leftPad + str.length, ' ').padEnd(width, ' ');
  }
  return str.padEnd(width, ' ');
}

/**
 * Format header line for water monthly bill grid (58mm thermal).
 * Layout (32 chars usable):
 * "Day  Bottles  Balance"
 * "DD   Del Rec  Bal"
 * 
 * Column widths: DD(2) + space(2) + Del(3) + space(1) + Rec(3) + space(2) + Bal(3) = 16 chars
 * 
 * @returns {string} "DD   Del Rec  Bal"
 */
export function formatWaterMonthlyBillHeaderLine() {
  const day = padWaterColumn('DD', 2);
  const del = padWaterColumn('Del', 3, 'right');
  const rec = padWaterColumn('Rec', 3, 'right');
  const bal = padWaterColumn('Bal', 3, 'right');
  return `${day}   ${del} ${rec}  ${bal}`;
}

/**
 * Format single day line for water monthly bill (58mm thermal).
 * Shows day number, delivered count, received count, and running balance.
 * 
 * Example outputs:
 * - "01     1   1    5" (delivered 1, received 1, balance 5)
 * - "02     0   0    5" (no activity, balance unchanged)
 * - "15     2   2    6" (delivered 2, received 2, balance 6)
 * 
 * @param {{ dayNum: number, del: number, rec: number, balance: number }} day
 * @returns {string} Fixed-width line for thermal printing
 */
export function formatWaterMonthlyBillDayLine(day) {
  const dayNum = padWaterColumn(String(day.dayNum || '?'), 2, 'right');
  const del = padWaterColumn(String(day.del || 0), 3, 'right');
  const rec = padWaterColumn(String(day.rec || 0), 3, 'right');
  const bal = padWaterColumn(String(day.balance || 0), 3, 'right');
  return `${dayNum}   ${del} ${rec}  ${bal}`;
}

/**
 * Whether this customer should appear on today's route sheet.
 * Day of follow (1–31) gates monthly/custom accounts like classic NEW.EXE.
 * @param {ReturnType<typeof readWaterCustomerPrefs>} prefs
 * @param {Date} [date]
 */
export function isWaterCustomerDueOnDate(prefs, date = new Date()) {
  if (!prefs?.deliveryActive) return false;
  if (!waterDeliveryCadenceCoversDate(prefs.deliveryDays, date)) return false;
  const follow = Number(prefs.dayOfFollow) || 0;
  if (follow > 0 && follow <= 31) {
    const cadence = String(prefs.deliveryDays || '').toLowerCase();
    // Enforce calendar-day follow only for custom / monthly-style cadences.
    if (/custom|month|follow|monthly/.test(cadence)) {
      const day = date.getDate();
      const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      return day === Math.min(follow, last);
    }
  }
  return true;
}

/**
 * @param {object | null | undefined} domainData
 * @param {string} periodKey
 * @returns {'paid'|'unpaid'|null}
 */
export function readWaterHisabPeriodPayment(domainData, periodKey) {
  const key = String(periodKey || '').trim();
  if (!key) return null;
  const dd = domainData && typeof domainData === 'object' ? domainData : {};
  const water = dd.waterHisab && typeof dd.waterHisab === 'object' ? dd.waterHisab : {};
  const map =
    (water.periodPayments && typeof water.periodPayments === 'object' ? water.periodPayments : null) ||
    (water.period_payments && typeof water.period_payments === 'object' ? water.period_payments : null) ||
    {};
  const raw = map[key];
  const status = String(raw || '').toLowerCase();
  if (status === 'paid') return 'paid';
  if (status === 'unpaid') return 'unpaid';
  return null;
}

/**
 * @param {object | null | undefined} domainData
 * @param {string} periodKey
 * @param {'paid'|'unpaid'} status
 */
export function patchWaterHisabPeriodPayment(domainData, periodKey, status) {
  const key = String(periodKey || '').trim();
  const nextStatus = String(status || '').toLowerCase() === 'paid' ? 'paid' : 'unpaid';
  const dd = domainData && typeof domainData === 'object' ? { ...domainData } : {};
  const water =
    dd.waterHisab && typeof dd.waterHisab === 'object' ? { ...dd.waterHisab } : {};
  const map =
    water.periodPayments && typeof water.periodPayments === 'object'
      ? { ...water.periodPayments }
      : {};
  if (key) map[key] = nextStatus;
  water.periodPayments = map;
  dd.waterHisab = water;
  return dd;
}

/**
 * Walk-in / counter customers without a house route.
 * @param {object} customer
 */
export function isWaterHisabWalkInCustomer(customer = {}) {
  const prefs = readWaterCustomerPrefs(customer);
  if (!prefs.deliveryActive) return true;
  const name = String(customer.name || '').toLowerCase();
  if (/walk[\s-]?in|counter|cash\s*sale/.test(name)) return true;
  return !prefs.houseNo && !prefs.routeLabel && !prefs.deliveryArea && prefs.dailyBottles <= 0;
}

/**
 * Rider shift load-out vs return reconciliation.
 * @param {{ loadedBottles?: number, returnedFull?: number, returnedEmpty?: number, cashCollected?: number, defaultUnitPrice?: number }} shift
 */
export function computeWaterRiderShiftReconciliation({
  loadedBottles = 0,
  returnedFull = 0,
  returnedEmpty = 0,
  cashCollected = 0,
  defaultUnitPrice = 150,
} = {}) {
  const loaded = Math.max(0, Number(loadedBottles) || 0);
  const fullRet = Math.max(0, Number(returnedFull) || 0);
  const emptyRet = Math.max(0, Number(returnedEmpty) || 0);
  const cash = Math.max(0, Number(cashCollected) || 0);
  const rate = Math.max(0, Number(defaultUnitPrice) || 0);

  const delivered = Math.max(0, loaded - fullRet);
  const expectedCash = Math.round(delivered * rate * 100) / 100;
  const cashShortage = Math.round((expectedCash - cash) * 100) / 100;
  const emptyShortage = Math.max(0, delivered - emptyRet);

  return {
    loadedBottles: loaded,
    returnedFull: fullRet,
    returnedEmpty: emptyRet,
    deliveredBottles: delivered,
    cashCollected: cash,
    expectedCash,
    cashShortage,
    emptyShortage,
    isBalanced: Math.abs(cashShortage) <= 1 && emptyShortage === 0,
  };
}

/**
 * Aggregates plant bottle assets, customer bottle balances, and float value.
 * @param {{ plantFull?: number, plantEmpty?: number, customerBalances?: number[], damagedCount?: number, bottleUnitCost?: number }} args
 */
export function resolveWaterBottleFloatSummary({
  plantFull = 0,
  plantEmpty = 0,
  customerBalances = [],
  damagedCount = 0,
  bottleUnitCost = 1200,
  withRiders = 0,
  idleRisk = 0,
} = {}) {
  const fullAtPlant = Math.max(0, Number(plantFull) || 0);
  const emptyAtPlant = Math.max(0, Number(plantEmpty) || 0);
  const damaged = Math.max(0, Number(damagedCount) || 0);
  const unitCost = Math.max(0, Number(bottleUnitCost) || 1200);
  const riders = Math.max(0, Number(withRiders) || 0);
  const idle = Math.max(0, Number(idleRisk) || 0);

  const withCustomers = (customerBalances || []).reduce((sum, bal) => sum + Math.max(0, Number(bal) || 0), 0);
  const totalFloatBottles = fullAtPlant + emptyAtPlant + withCustomers + damaged + riders;
  const totalAssetValue = Math.round(totalFloatBottles * unitCost * 100) / 100;
  const roundedFloat = Math.round(totalFloatBottles * 1000) / 1000;
  const roundedCustomers = Math.round(withCustomers * 1000) / 1000;

  return {
    plantFull: fullAtPlant,
    plantEmpty: emptyAtPlant,
    /** UI aliases used by Bottle Control strip */
    fullAtPlant,
    emptyAtPlant,
    withCustomers: roundedCustomers,
    withRiders: Math.round(riders * 1000) / 1000,
    damagedScrapped: damaged,
    totalFloatBottles: roundedFloat,
    totalOwned: roundedFloat,
    idleRisk: idle,
    bottleUnitCost: unitCost,
    totalAssetValue,
  };
}

/**
 * Identify customers with unreturned empty bottles holding idle inventory.
 * @param {Array<object>} customers
 * @param {number} [minBottleBal]
 */
export function findIdleBottleCustomers(customers = [], minBottleBal = 2) {
  const result = [];
  for (const c of customers || []) {
    const prefs = readWaterCustomerPrefs(c);
    if (prefs.bottleBalance >= minBottleBal) {
      result.push({
        id: String(c.id),
        name: c.name,
        phone: c.phone || null,
        houseNo: prefs.houseNo,
        routeLabel: prefs.routeLabel,
        bottleBalance: prefs.bottleBalance,
        accountNo: prefs.accountNo,
      });
    }
  }
  return result.sort((a, b) => b.bottleBalance - a.bottleBalance);
}


