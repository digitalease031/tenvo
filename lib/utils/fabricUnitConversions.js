/**
 * Fabric unit conversion utilities for Pakistani textile verticals.
 *
 * Base unit for fabric products is typically `meter`.
 * Traditional Pakistani/South Asian units:
 *   - 1 gaz  = 1 yard ≈ 0.9144 meters  (standard since British era; still used in PK cloth markets)
 *   - 1 yard = 0.9144 meters (exact)
 *   - 1 thaan = variable (35–45 meters per roll; defaults to 40)
 *   - 1 guth = bundle of suits, typically 10 suits
 *
 * Conversions stored in products.unit_conversions JSONB as:
 *   { "gaz": 0.9144, "yard": 0.9144 }  (factor to multiply to get base unit value)
 */

/** Verticals that deal in fabric and benefit from unit conversion defaults. */
export const FABRIC_UNIT_CONVERSION_VERTICALS = new Set([
  'textile-wholesale',
  'textile-mill',
]);

/**
 * Default unit conversion map for fabric products with base unit `meter`.
 * factor = meters per 1 unit of that key.
 */
export const DEFAULT_FABRIC_UNIT_CONVERSIONS = Object.freeze({
  gaz: 0.9144,
  yard: 0.9144,
});

/**
 * Returns true if this domain vertical uses fabric unit conversions.
 * @param {string} domainKey
 */
export function isFabricConversionVertical(domainKey) {
  return FABRIC_UNIT_CONVERSION_VERTICALS.has(String(domainKey || '').trim().toLowerCase());
}

/**
 * Apply default fabric unit_conversions to a product payload if:
 * - the vertical is a fabric conversion vertical
 * - the product's base unit is 'meter' (or 'metre')
 * - unit_conversions is null or empty
 *
 * Always preserves any existing conversion factors the owner has set.
 *
 * @param {object} productPayload - mutable product object (unit, unit_conversions)
 * @param {string} domainKey - resolved domain key (e.g. 'textile-wholesale')
 * @returns {object} the same payload with unit_conversions filled in
 */
export function applyDefaultFabricUnitConversions(productPayload, domainKey) {
  if (!productPayload || !isFabricConversionVertical(domainKey)) return productPayload;

  const baseUnit = String(productPayload.unit || '').trim().toLowerCase();
  if (baseUnit !== 'meter' && baseUnit !== 'metre') return productPayload;

  const existing = productPayload.unit_conversions;
  const hasConversions =
    existing &&
    typeof existing === 'object' &&
    Object.keys(existing).length > 0;

  if (!hasConversions) {
    productPayload.unit_conversions = { ...DEFAULT_FABRIC_UNIT_CONVERSIONS };
  } else {
    // Backfill only missing keys — do not overwrite owner customizations
    const merged = { ...DEFAULT_FABRIC_UNIT_CONVERSIONS, ...existing };
    productPayload.unit_conversions = merged;
  }

  return productPayload;
}

/**
 * Convert a quantity from an alternate unit to the product's base unit (meter).
 * Returns the converted quantity and preserves 4 decimal precision.
 *
 * @param {number} quantity - quantity in the alternate unit
 * @param {string} fromUnit - the unit the quantity is in (e.g. 'gaz')
 * @param {string} baseUnit - the product's base unit (e.g. 'meter')
 * @param {Record<string, number> | null | undefined} unitConversions - product.unit_conversions
 * @returns {{ convertedQty: number, factor: number, warned: boolean }}
 */
export function convertFabricQuantity(quantity, fromUnit, baseUnit, unitConversions) {
  const from = String(fromUnit || '').trim().toLowerCase();
  const base = String(baseUnit || '').trim().toLowerCase();

  if (from === base || from === '') {
    return { convertedQty: Number(quantity), factor: 1, warned: false };
  }

  const conversions = unitConversions && typeof unitConversions === 'object' ? unitConversions : {};
  const factor = conversions[from] ?? DEFAULT_FABRIC_UNIT_CONVERSIONS[from] ?? null;

  if (factor == null) {
    // No conversion factor — log warning and use 1:1 fallback
    console.warn(
      `[fabricUnitConversions] No conversion factor for unit "${from}" → "${base}". ` +
        `Using factor=1. Add unit_conversions to this product to fix.`
    );
    return { convertedQty: Number(quantity), factor: 1, warned: true };
  }

  // Round to 4 decimal places to avoid float drift in large-volume trades
  const convertedQty = Math.round(Number(quantity) * factor * 10000) / 10000;
  return { convertedQty, factor, warned: false };
}

/**
 * Fabric unit display labels for receipts and invoices.
 * Used by formatFabricUnit in invoiceHelpers.js and thermalReceipt.js.
 */
export const FABRIC_UNIT_DISPLAY = Object.freeze({
  en: {
    meter: 'Meter',
    metre: 'Meter',
    gaz: 'Gaz',
    yard: 'Yard',
    thaan: 'Thaan',
    guth: 'Guth',
    suit: 'Suit',
    kg: 'KG',
    pcs: 'Pcs',
    set: 'Set',
  },
  ur: {
    meter: 'میٹر',
    metre: 'میٹر',
    gaz: 'گز',
    yard: 'یارڈ',
    thaan: 'تھان',
    guth: 'گٹھ',
    suit: 'سوٹ',
    kg: 'کلو',
    pcs: 'عدد',
    set: 'سیٹ',
  },
});
/**
 * Format a fabric quantity for receipt/invoice display.
 * Produces human-readable strings like "2 Thaan (40m ea) = 80m"
 *
 * @param {{ quantity: number, unit: string, thaan_length?: number, suit_cutting?: number }} lineItem
 * @param {'en'|'ur'} [lang]
 * @returns {string}
 */
export function formatFabricQtyDisplay(lineItem, lang = 'en') {
  const qty = Number(lineItem?.quantity || 0);
  const unit = String(lineItem?.unit || '').toLowerCase().trim();
  const thaanLen = Number(lineItem?.thaan_length || lineItem?.thaanLength || 0);
  const suitLen = Number(lineItem?.suit_cutting || lineItem?.suitCutting || 2.25);
  const labels = FABRIC_UNIT_DISPLAY[lang] || FABRIC_UNIT_DISPLAY.en;
  const unitLabel = labels[unit] || unit;

  if (unit === 'thaan' && thaanLen > 0) {
    const totalM = Math.round(qty * thaanLen * 100) / 100;
    return lang === 'ur'
      ? `${qty} ${unitLabel} (${thaanLen}م ہر) = ${totalM}م`
      : `${qty} ${unitLabel} (${thaanLen}m ea) = ${totalM}m`;
  }

  if (unit === 'suit' && suitLen > 0) {
    const totalM = Math.round(qty * suitLen * 100) / 100;
    return lang === 'ur'
      ? `${qty} ${unitLabel} = ${totalM}م`
      : `${qty} ${unitLabel} = ${totalM}m`;
  }

  if (unit === 'gaz' || unit === 'yard') {
    const totalM = Math.round(qty * 0.9144 * 100) / 100;
    return lang === 'ur'
      ? `${qty} ${unitLabel} = ${totalM}م`
      : `${qty} ${unitLabel} = ${totalM}m`;
  }

  return `${qty} ${unitLabel}`;
}
