/**
 * Restaurant QR Code & Table Link Utility
 */

export function buildTableOrderUrl(storeUrl, tableNumber, orderMode = 'dine-in') {
  if (!storeUrl) return '#';
  const url = new URL(storeUrl);
  url.searchParams.set('table', tableNumber);
  url.searchParams.set('mode', orderMode);
  return url.toString();
}

/**
 * Generate Google Chart API QR image URL for table QR cards
 */
export function buildQrImageUrl(content, size = 250) {
  if (!content) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(content)}`;
}
