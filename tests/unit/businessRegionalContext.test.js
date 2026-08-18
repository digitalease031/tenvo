import { describe, it, expect } from 'vitest';
import {
  resolveFormDefaultTaxRate,
  getBusinessRegionalPack,
  resolveDisplayCurrency,
} from '@/lib/utils/businessRegionalContext';
import { buildRegionalTaxCategoryDefaults } from '@/lib/utils/regionalHelpers';

describe('businessRegionalContext', () => {
  it('uses UAE VAT rate for AE-registered business without domain override', () => {
    const business = {
      country: 'United Arab Emirates',
      settings: {
        registration: { country_iso: 'AE', country_name: 'United Arab Emirates' },
        financials: { taxEnabled: true },
      },
    };
    expect(getBusinessRegionalPack(business).currency).toBe('AED');
    expect(getBusinessRegionalPack(business).defaultTaxRate).toBe(5);
    expect(resolveFormDefaultTaxRate(business, 'retail-shop')).toBe(5);
  });

  it('defaults taxEnabled false when not set, and activates tax rates only when financials.taxEnabled is true', () => {
    const defaultBus = {
      country: 'Pakistan',
      settings: {
        registration: { country_iso: 'PK' },
        financials: {},
      },
    };
    expect(getBusinessRegionalPack(defaultBus).taxEnabled).toBe(false);
    expect(getBusinessRegionalPack(defaultBus).defaultTaxRate).toBe(0);

    const enabled = {
      country: 'Pakistan',
      settings: {
        registration: { country_iso: 'PK' },
        financials: { taxEnabled: true, defaultTaxRate: 18 },
      },
    };
    const pack = getBusinessRegionalPack(enabled);
    expect(pack.taxEnabled).toBe(true);
    expect(pack.defaultTaxRate).toBe(18);
    expect(resolveFormDefaultTaxRate(enabled, 'retail-shop')).toBe(18);
  });

  it('prefers financials.currency then businesses.currency for pack and display', () => {
    const business = {
      currency: 'USD',
      country: 'Pakistan',
      settings: {
        registration: { country_iso: 'PK' },
        financials: { currency: 'AED', currencySymbol: 'د.إ' },
      },
    };
    const pack = getBusinessRegionalPack(business);
    expect(pack.currency).toBe('AED');
    expect(resolveDisplayCurrency(business, pack)).toBe('AED');
    expect(resolveDisplayCurrency({ currency: 'USD', settings: { registration: { country_iso: 'PK' } } })).toBe('USD');
  });
});
