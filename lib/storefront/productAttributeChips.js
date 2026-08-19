import { normalizeKey } from '@/lib/utils/domainHelpers';

/** Read domain_data field with legacy key normalization. */
export function domainField(domainData, key) {
  const val = domainData?.[key] ?? domainData?.[normalizeKey(key)];
  if (val == null) return null;
  const s = String(val).trim();
  return s || null;
}

/** Honest storefront label for sourcing values. */
export function formatSourcingLabel(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (v === 'local') return 'Local';
  if (v === 'imported') return 'Imported';
  const trimmed = String(raw || '').trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : '';
}

/** Whether sourcing should render as a top-level badge (local / imported). */
export function isCanonicalSourcingBadge(raw) {
  const v = String(raw || '').trim().toLowerCase();
  return v === 'local' || v === 'imported';
}

/**
 * @param {string} businessDomain
 * @param {string} filterKey
 * @param {string} value
 */
export function buildStorefrontFilterHref(businessDomain, filterKey, value) {
  if (!businessDomain || !value || !filterKey) return null;
  const params = new URLSearchParams();
  params.set(filterKey, String(value).trim());
  return `/store/${businessDomain}/products?${params.toString()}`;
}

/**
 * Clothing / textile attribute rows for product detail and cards.
 * @param {object} product
 * @returns {Array<{ key: string, label: string, value: string, filterKey?: string, badge?: boolean }>}
 */
export function buildClothingAttributeRows(product) {
  const dd = product?.domain_data || {};
  /** @type {Array<{ key: string, label: string, value: string, filterKey?: string, badge?: boolean }>} */
  const rows = [];

  const brand =
    product?.brand?.trim() ||
    domainField(dd, 'designertracking') ||
    domainField(dd, 'designer') ||
    domainField(dd, 'brand');
  if (brand) {
    rows.push({ key: 'brand', label: 'Brand', value: brand, filterValue: brand, filterKey: 'brand' });
  }

  const fabric = domainField(dd, 'fabrictype') || domainField(dd, 'fabric');
  if (fabric) {
    rows.push({ key: 'fabric', label: 'Fabric', value: fabric, filterValue: fabric, filterKey: 'fabric' });
  }

  const sourcing = domainField(dd, 'sourcing');
  if (sourcing) {
    rows.push({
      key: 'sourcing',
      label: 'Sourcing',
      value: formatSourcingLabel(sourcing),
      filterValue: String(sourcing).trim().toLowerCase(),
      filterKey: 'sourcing',
      badge: isCanonicalSourcingBadge(sourcing),
    });
  }

  const size = domainField(dd, 'size') || domainField(dd, 'sizecolormatrix');
  if (size) rows.push({ key: 'size', label: 'Size', value: size, filterValue: size, filterKey: 'size' });

  const color = domainField(dd, 'color');
  if (color) rows.push({ key: 'color', label: 'Color', value: color });

  const origin = domainField(dd, 'origin');
  if (origin) rows.push({ key: 'origin', label: 'Origin', value: origin });

  const season = domainField(dd, 'season');
  if (season) rows.push({ key: 'season', label: 'Season', value: season });

  const stitching = domainField(dd, 'stitchingstatus') || domainField(dd, 'stitchingtype');
  if (stitching) rows.push({ key: 'stitching', label: 'Stitching', value: stitching });

  const collection = domainField(dd, 'collection') || domainField(dd, 'collectionname');
  if (collection) rows.push({ key: 'collection', label: 'Collection', value: collection });

  const article = domainField(dd, 'articleno');
  if (article) rows.push({ key: 'articleno', label: 'Article No', value: article, filterValue: article, filterKey: 'search' });

  const designno = domainField(dd, 'designno');
  if (designno) rows.push({ key: 'designno', label: 'Design No', value: designno });

  // Textile mill specific fields
  const yarntype = domainField(dd, 'yarntype');
  if (yarntype) rows.push({ key: 'yarntype', label: 'Yarn Type', value: yarntype, filterValue: yarntype, filterKey: 'search' });

  const countgsm = domainField(dd, 'countgsm');
  if (countgsm) rows.push({ key: 'countgsm', label: 'Count/GSM', value: countgsm });

  const fabricdesign = domainField(dd, 'fabricdesign');
  if (fabricdesign) rows.push({ key: 'fabricdesign', label: 'Fabric Design', value: fabricdesign });

  const bloomid = domainField(dd, 'bloomid');
  if (bloomid) rows.push({ key: 'bloomid', label: 'Bloom/Batch ID', value: bloomid });

  // Textile wholesale — thaan dimensions
  const thaanlength = domainField(dd, 'thaanlength');
  if (thaanlength) rows.push({ key: 'thaanlength', label: 'Thaan Length', value: `${thaanlength}m` });

  const widtharz = domainField(dd, 'widtharz');
  if (widtharz) rows.push({ key: 'widtharz', label: 'Width (Arz)', value: `${widtharz}"` });

  return rows;
}

/**
 * Auto-parts attribute rows for product detail.
 * @param {object} product
 */
export function buildPartsAttributeRows(product) {
  const dd = product?.domain_data || {};
  const rows = [];
  const partNumber = domainField(dd, 'partnumber') || product?.sku;
  if (partNumber) rows.push({ key: 'partnumber', label: 'Part number', value: partNumber });

  const oem = domainField(dd, 'oemnumber');
  if (oem) rows.push({ key: 'oem', label: 'OEM', value: oem });

  const fitment = [domainField(dd, 'vehiclemake'), domainField(dd, 'vehiclemodel'), domainField(dd, 'modelyear')]
    .filter(Boolean)
    .join(' ');
  if (fitment) {
    rows.push({ key: 'fitment', label: 'Fits', value: fitment, filterValue: fitment, filterKey: 'brand' });
  }

  return rows;
}

/**
 * Electronics / appliance attribute rows for cards and product detail.
 * @param {object} product
 */
export function buildElectronicsAttributeRows(product) {
  const dd = product?.domain_data || {};
  const rows = [];

  const brand = product?.brand?.trim() || domainField(dd, 'brand');
  if (brand) {
    rows.push({ key: 'brand', label: 'Brand', value: brand, filterValue: brand, filterKey: 'brand' });
  }

  const model = domainField(dd, 'model') || domainField(dd, 'modelnumber');
  if (model) {
    rows.push({ key: 'model', label: 'Model', value: model });
  }

  const capacity = domainField(dd, 'capacity');
  if (capacity) {
    rows.push({
      key: 'capacity',
      label: 'Capacity',
      value: capacity,
      filterValue: capacity,
      filterKey: 'search',
    });
  }

  const screen = domainField(dd, 'screensize') || domainField(dd, 'screen');
  if (screen) {
    rows.push({
      key: 'screensize',
      label: 'Screen',
      value: screen,
      filterValue: screen,
      filterKey: 'search',
    });
  }

  const warranty = domainField(dd, 'warranty');
  if (warranty) {
    rows.push({ key: 'warranty', label: 'Warranty', value: warranty });
  }

  const specs = domainField(dd, 'specifications') || domainField(dd, 'specs');
  if (specs) {
    rows.push({ key: 'specifications', label: 'Specs', value: specs });
  }

  const energy = domainField(dd, 'energylabel');
  if (energy) {
    rows.push({ key: 'energylabel', label: 'Energy', value: energy });
  }

  return rows;
}

/**
 * Footwear attribute rows for cards and product detail.
 * @param {object} product
 */
export function buildFootwearAttributeRows(product) {
  const dd = product?.domain_data || {};
  const rows = [];

  const brand = product?.brand?.trim() || domainField(dd, 'brand');
  if (brand) {
    rows.push({ key: 'brand', label: 'Brand', value: brand, filterValue: brand, filterKey: 'brand' });
  }

  const size = domainField(dd, 'size');
  if (size) {
    rows.push({ key: 'size', label: 'Size', value: size, filterValue: size, filterKey: 'size' });
  }

  const color = domainField(dd, 'color');
  if (color && !/^(excellent|premium|very good|brand new|store return)/i.test(color)) {
    rows.push({ key: 'color', label: 'Color', value: color, filterValue: color, filterKey: 'search' });
  }

  const style = domainField(dd, 'style');
  if (style) {
    rows.push({ key: 'style', label: 'Style', value: style, filterValue: style, filterKey: 'search' });
  }

  const gender = domainField(dd, 'gender');
  if (gender) {
    const label = String(gender).charAt(0).toUpperCase() + String(gender).slice(1);
    rows.push({ key: 'gender', label: 'Fit', value: label, filterValue: gender, filterKey: 'gender' });
  }

  const condition = domainField(dd, 'condition');
  if (condition) {
    const label = String(condition)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    rows.push({
      key: 'condition',
      label: 'Condition',
      value: label,
      filterValue: condition,
      filterKey: 'search',
    });
  }

  const material = domainField(dd, 'material');
  if (material) {
    rows.push({ key: 'material', label: 'Material', value: material });
  }

  const article = domainField(dd, 'articlenumber') || domainField(dd, 'articleno');
  if (article) {
    rows.push({ key: 'articlenumber', label: 'Article', value: article });
  }

  const sourcing = domainField(dd, 'sourcing');
  if (sourcing) {
    rows.push({
      key: 'sourcing',
      label: 'Sourcing',
      value: formatSourcingLabel(sourcing),
      filterValue: String(sourcing).trim().toLowerCase(),
      filterKey: 'sourcing',
      badge: isCanonicalSourcingBadge(sourcing),
    });
  }

  return rows;
}

/**
 * Tyre / wheel attribute rows for cards and product detail.
 * @param {object} product
 */
export function buildTyreAttributeRows(product) {
  const dd = product?.domain_data || {};
  const rows = [];

  const brand = product?.brand?.trim() || domainField(dd, 'brand');
  if (brand) {
    rows.push({ key: 'brand', label: 'Brand', value: brand, filterValue: brand, filterKey: 'brand' });
  }

  const size = domainField(dd, 'tyresize') || domainField(dd, 'size');
  if (size) {
    rows.push({ key: 'tyresize', label: 'Size', value: size, filterValue: size, filterKey: 'search' });
  }

  const load = domainField(dd, 'loadindex');
  const speed = domainField(dd, 'speedrating');
  if (load || speed) {
    rows.push({
      key: 'loadspeed',
      label: 'Load / speed',
      value: [load, speed].filter(Boolean).join(' '),
    });
  }

  const rim = domainField(dd, 'rimsize');
  if (rim) {
    rows.push({ key: 'rimsize', label: 'Rim', value: `${rim}"`, filterValue: rim, filterKey: 'search' });
  }

  const sourcing = domainField(dd, 'sourcing');
  if (sourcing) {
    rows.push({
      key: 'sourcing',
      label: 'Sourcing',
      value: formatSourcingLabel(sourcing),
      filterValue: String(sourcing).trim().toLowerCase(),
      filterKey: 'sourcing',
      badge: isCanonicalSourcingBadge(sourcing),
    });
  }

  return rows;
}

/**
 * Marine spare-parts attribute rows for product detail.
 * @param {object} product
 */
export function buildMarinePartsAttributeRows(product) {
  const dd = product?.domain_data || {};
  const rows = [];
  const partNumber = domainField(dd, 'partnumber') || product?.sku;
  if (partNumber) rows.push({ key: 'partnumber', label: 'Part number', value: partNumber });

  const oem = domainField(dd, 'oemnumber');
  if (oem) rows.push({ key: 'oem', label: 'OEM', value: oem });

  const equipment = domainField(dd, 'equipmenttype');
  if (equipment) {
    rows.push({
      key: 'equipmenttype',
      label: 'Equipment',
      value: equipment,
      filterValue: equipment,
      filterKey: 'equipmentType',
    });
  }

  const condition = domainField(dd, 'systemcondition');
  if (condition) {
    rows.push({
      key: 'systemcondition',
      label: 'Condition',
      value: condition,
      filterValue: condition,
      filterKey: 'systemCondition',
    });
  }

  const vessel = domainField(dd, 'vesseltype');
  if (vessel) {
    rows.push({
      key: 'vesseltype',
      label: 'Vessel',
      value: vessel,
      filterValue: vessel,
      filterKey: 'vesselType',
    });
  }

  const manufacturer = domainField(dd, 'manufacturer') || product?.brand?.trim();
  if (manufacturer) {
    rows.push({
      key: 'manufacturer',
      label: 'Manufacturer',
      value: manufacturer,
      filterValue: manufacturer,
      filterKey: 'manufacturer',
    });
  }

  return rows;
}

/** Resolve canonical local/imported sourcing for top-level badges. */
export function resolveSourcingBadge(domainData) {
  const raw = domainField(domainData, 'sourcing');
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v === 'local' || v === 'imported') return v;
  return null;
}

/**
 * EV Bikes & Scooters attribute rows for product detail and cards.
 * @param {object} product
 * @returns {Array<{ key: string, label: string, value: string, filterKey?: string, filterValue?: string }>}
 */
export function buildEvBikesAttributeRows(product) {
  const dd = product?.domain_data || {};
  /** @type {Array<{ key: string, label: string, value: string, filterKey?: string, filterValue?: string }>} */
  const rows = [];

  const brand = product?.brand?.trim() || domainField(dd, 'brand');
  if (brand) {
    rows.push({ key: 'brand', label: 'Brand', value: brand, filterValue: brand, filterKey: 'brand' });
  }

  const batteryType = domainField(dd, 'battery_type') || domainField(dd, 'batterytype');
  if (batteryType) {
    rows.push({ key: 'battery_type', label: 'Battery Type', value: batteryType, filterValue: batteryType, filterKey: 'battery' });
  }

  const capacity = domainField(dd, 'battery_capacity') || domainField(dd, 'batterycapacity');
  if (capacity) {
    rows.push({ key: 'capacity', label: 'Battery Capacity', value: capacity });
  }

  const voltage = domainField(dd, 'voltage_v') || domainField(dd, 'voltage');
  if (voltage) {
    rows.push({ key: 'voltage', label: 'Voltage', value: voltage });
  }

  const motorPower = domainField(dd, 'motor_power_w') || domainField(dd, 'motorpower');
  if (motorPower) {
    const val = String(motorPower).includes('W') ? String(motorPower) : `${motorPower}W`;
    rows.push({ key: 'motor_power', label: 'Motor Power', value: val });
  }

  const range = domainField(dd, 'range_km') || domainField(dd, 'rangekm');
  if (range) {
    rows.push({ key: 'range', label: 'Range', value: `${range} km` });
  }

  const topSpeed = domainField(dd, 'top_speed_kmh') || domainField(dd, 'topspeedkmh');
  if (topSpeed) {
    rows.push({ key: 'top_speed', label: 'Top Speed', value: `${topSpeed} km/h` });
  }

  const chargeTime = domainField(dd, 'charging_time_hrs') || domainField(dd, 'chargingtime');
  if (chargeTime) {
    rows.push({ key: 'charge_time', label: 'Charging Time', value: chargeTime });
  }

  const warranty = domainField(dd, 'warranty_years') || domainField(dd, 'warrantyperiod');
  if (warranty) {
    rows.push({ key: 'warranty', label: 'Warranty', value: warranty });
  }

  return rows;
}
