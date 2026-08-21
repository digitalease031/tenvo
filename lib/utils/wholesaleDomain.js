/**
 * Wholesale Domain Utilities
 * Central helper to detect wholesale domain categories and verticals.
 */

/**
 * Check if a business category is a wholesale domain
 * @param {string} category
 * @returns {boolean}
 */
export function isWholesaleDomain(category) {
  if (!category) return false;
  const key = String(category).toLowerCase().trim();
  return (
    key === 'textile-wholesale' ||
    key === 'textile' ||
    key === 'wholesale-distribution' ||
    key === 'wholesale' ||
    key === 'lubricant-distribution' ||
    key === 'b2b-wholesale' ||
    key === 'clothing-wholesale' ||
    key.includes('wholesale')
  );
}

/**
 * Wholesale-gated navigation tab keys requiring Enterprise plan
 */
export const WHOLESALE_ENTERPRISE_NAV_KEYS = Object.freeze([
  'campaigns',
  'reports',
  'analytics',
  'forecasting',
  'orders',
  'inquiries',
  'view-storefront',
  'store-settings',
]);

/**
 * Check if a nav key requires Enterprise plan for wholesale domains
 * @param {string} navKey
 * @param {string} category
 * @returns {boolean}
 */
export function isWholesaleEnterpriseNavKey(navKey, category) {
  return isWholesaleDomain(category) && WHOLESALE_ENTERPRISE_NAV_KEYS.includes(navKey);
}
