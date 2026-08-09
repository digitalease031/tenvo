/**
 * Access gate + network-failure detection for Water Route Hisab offline mode.
 */
import { planHasFeatureWithPackaging } from '@/lib/subscription/effectivePlanAccess';
import { isWaterHisabRelevant } from '@/lib/storefront/waterShopHisab';

/**
 * Returns true if offline mode should be active for this water delivery business.
 * Requires plan `offline_pos_mode` (Starter+) and the category to be water-delivery.
 * Owner can explicitly disable via settings.waterHisab.offlineEnabled = false.
 *
 * @param {{
 *   category?: string | null,
 *   planTier?: string | null,
 *   settings?: object | null,
 * }} args
 */
export function isWaterHisabOfflineEnabled({ category, planTier, settings } = {}) {
  if (!isWaterHisabRelevant(category)) return false;
  if (!planHasFeatureWithPackaging(planTier || 'free', 'offline_pos_mode', settings)) {
    return false;
  }
  // Default ON when plan allows; owner can override via settings.waterHisab.offlineEnabled = false
  const flag = settings?.waterHisab?.offlineEnabled;
  return flag !== false;
}

/**
 * True when an error or response message looks like a connectivity / transport failure
 * rather than a business-logic validation error (auth, permission, invalid data).
 *
 * @param {unknown} err
 * @param {string} [message]
 */
export function isWaterHisabNetworkFailure(err, message = '') {
  const msg = String(message || (err && err.message) || err || '').toLowerCase();
  if (!msg) return false;
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('offline') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504')
  );
}
