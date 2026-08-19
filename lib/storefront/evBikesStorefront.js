/**
 * Storefront helpers for EV Bikes & Scooters vertical.
 */
import { resolveDomainKey } from '../config/domainKeyAliases.js';

export const EV_BIKES_ACCENTS = Object.freeze({
  primary: '#10b981',
  dark: '#064e3b',
  light: '#ecfdf5',
  badge: '#059669',
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
    specs.push({
      id: 'range',
      label: 'Range',
      value: `${range} km`,
      icon: 'Zap',
    });
  }

  const topSpeed = dd.top_speed_kmh ?? dd.topspeedkmh ?? dd.top_speed ?? dd.speed;
  if (topSpeed != null && topSpeed !== '') {
    specs.push({
      id: 'speed',
      label: 'Top Speed',
      value: `${topSpeed} km/h`,
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
    const val = String(motor).includes('W') ? String(motor) : `${motor}W`;
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
