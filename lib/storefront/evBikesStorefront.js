/**
 * Storefront helpers for EV Bikes & Scooters vertical.
 */
import { resolveDomainKey } from '../config/domainKeyAliases.js';

export const EV_BIKES_ACCENTS = Object.freeze({
  primary: '#dc2626',
  dark: '#991b1b',
  light: '#fef2f2',
  badge: '#b91c1c',
});

/**
 * @param {string} domainKey
 * @returns {boolean}
 */
export function isEvBikesStore(domainKey) {
  const canonical = resolveDomainKey(domainKey);
  return canonical === 'ev-bikes';
}

/**
 * Extract EV specifications from product domain_data for card badges & PDP.
 * @param {object} product
 * @returns {Array<{ id: string, label: string, value: string, icon: string }>}
 */
export function formatEvProductSpecs(product) {
  const dd = product?.domain_data || {};
  const specs = [];

  const range = dd.range_km ?? dd.rangekm ?? dd.range;
  if (range != null && range !== '') {
    const val = String(range).toLowerCase().includes('km') ? String(range) : `${range} km`;
    specs.push({
      id: 'range',
      label: 'Range',
      value: val,
      icon: 'Zap',
    });
  }

  const topSpeed = dd.top_speed_kmh ?? dd.topspeedkmh ?? dd.top_speed ?? dd.speed;
  if (topSpeed != null && topSpeed !== '') {
    const val = String(topSpeed).toLowerCase().includes('km') ? String(topSpeed) : `${topSpeed} km/h`;
    specs.push({
      id: 'speed',
      label: 'Top Speed',
      value: val,
      icon: 'Gauge',
    });
  }

  const battery = dd.battery_type ?? dd.batterytype ?? dd.battery_capacity ?? dd.batterycapacity;
  if (battery != null && battery !== '') {
    specs.push({
      id: 'battery',
      label: 'Battery',
      value: String(battery),
      icon: 'BatteryCharging',
    });
  }

  const motor = dd.motor_power_w ?? dd.motorpower ?? dd.motor_power;
  if (motor != null && motor !== '') {
    const raw = String(motor);
    const val = raw.toLowerCase().includes('w') || raw.toLowerCase().includes('watt') ? raw : `${raw}W`;
    specs.push({
      id: 'motor',
      label: 'Motor',
      value: val,
      icon: 'Cpu',
    });
  }

  const chargeTime = dd.charging_time_hrs ?? dd.chargingtime ?? dd.charging_time;
  if (chargeTime != null && chargeTime !== '') {
    specs.push({
      id: 'charge',
      label: 'Charge Time',
      value: String(chargeTime),
      icon: 'Clock',
    });
  }

  return specs;
}

/**
 * Return 9 standardized EV comparison spec rows matching Metro EV specification structure.
 * @param {object} product
 * @returns {Array<{ label: string, value: string }>}
 */
export function getEvComparisonSpecs(product) {
  const dd = product?.domain_data || {};

  // 1. Battery Type
  const batteryType = dd.battery_type || dd.batterytype || dd.battery_tech || 'Nano Carbon Fiber Battery';
  
  // 2. Charge Cycle
  const chargeCycle = dd.charge_cycles || dd.charge_cycle || dd.chargecycle || '1000';

  // 3. Warranty
  const warranty = dd.warranty || dd.warranty_months || dd.warranty_years || '24 Months';

  // 4. Battery Capacity
  const batteryCap = dd.battery_capacity || dd.batterycapacity || dd.voltage_capacity || '72V X 27AH';

  // 5. Total Watt-Hour
  const wattHour = dd.total_watt_hour || dd.watt_hours || dd.watthours || '1872 WH';

  // 6. Motor Power
  const motorPower = dd.motor_power || dd.motor_power_w || dd.motorpower || '1000 ~ 1600 Watt';

  // 7. Tyre Size & Type
  const tyreSize = dd.tyre_size_type || dd.tyre_size || dd.tyresize || '10" Tubeless Tyres';

  // 8. Top Speed
  const rawSpeed = dd.top_speed_kmh || dd.top_speed || dd.topspeedkmh || dd.speed || 'Upto 50 Km/hour';
  const topSpeed = String(rawSpeed).toLowerCase().includes('km') ? String(rawSpeed) : `Upto ${rawSpeed} Km/hour`;

  // 9. Max Range
  const rawRange = dd.range_km || dd.range_kmh || dd.rangekm || dd.range || 'Upto 110 Km';
  const maxRange = String(rawRange).toLowerCase().includes('km') ? String(rawRange) : `Upto ${rawRange} Km`;

  return [
    { label: 'Battery Type:', value: String(batteryType) },
    { label: 'Charge Cycle:', value: String(chargeCycle) },
    { label: 'Warranty:', value: String(warranty) },
    { label: 'Battery Capacity:', value: String(batteryCap) },
    { label: 'Total Watt-Hour:', value: String(wattHour) },
    { label: 'Motor Power:', value: String(motorPower) },
    { label: 'Tyre Size & Type:', value: String(tyreSize) },
    { label: 'Top Speed:', value: String(topSpeed) },
    { label: 'Max Range:', value: String(maxRange) },
  ];
}

