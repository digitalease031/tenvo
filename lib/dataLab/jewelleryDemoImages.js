/**
 * Curated Unsplash imagery for gems & jewellery demo stores.
 * @see https://unsplash.com/license
 */
import { buildUnsplashImageUrl } from '../storefront/unsplashUrl.js';

/** @param {string} photoId @param {number} [w] */
export function jewelleryStockImage(photoId, w = 900) {
  return buildUnsplashImageUrl(photoId, { w, q: 85 });
}

/**
 * Verified jewellery / gemstone photo ids.
 * @type {Record<string, Record<string, string>>}
 */
export const JEWELLERY_DEMO_IMAGES = {
  gold: {
    ring: '1603561596112-0a132b757442',
    chain: '1611591437281-460bfbe1220a',
    bangle: '1611591437281-460bfbe1220a',
    coin: '1603561596112-0a132b757442',
    earrings: '1599643478518-a784e5dc4c8f',
  },
  diamond: {
    solitaire: '1605100804763-247f67b3557e',
    studs: '1599643478518-a784e5dc4c8f',
    bracelet: '1611591437281-460bfbe1220a',
    pendant: '1535632066927-ab7c9d569692',
  },
  bridal: {
    set: '1515562141207-7a88fb7ce338',
    choker: '1595777457583-95e059d581b8',
    payal: '1611591437281-460bfbe1220a',
  },
  necklace: {
    ruby: '1515562141207-7a88fbbeb966',
    layered: '1611591437281-460bfbe1220a',
    pearl: '1535632066927-ab7c9d569692',
  },
  earrings: {
    pearl: '1599643478518-a784e5dc4c8f',
    hoops: '1599643478518-a784e5dc4c8f',
    drops: '1599643478518-a784e5dc4c8f',
  },
  rings: {
    emerald: '1605100804763-247f67b3557e',
    engagement: '1603561596112-0a132b757442',
  },
  silver: {
    pendant: '1535632066927-ab7c9d569692',
    toeRings: '1611591437281-460bfbe1220a',
  },
  gifts: {
    locket: '1535632066927-ab7c9d569692',
    figurine: '1515562141207-7a88fb7ce338',
  },
};

/**
 * @param {string} department
 * @param {string} key
 * @param {number} [w]
 */
export function getJewelleryDemoImage(department, key, w = 900) {
  const id = JEWELLERY_DEMO_IMAGES[department]?.[key];
  return id ? jewelleryStockImage(id, w) : null;
}
