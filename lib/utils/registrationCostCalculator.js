/**
 * Utility functions for Registration Project Cost & Custom Advance Payment Calculations
 *
 * Calculates:
 * - One-time costs (Setup, Training, Support)
 * - Monthly subscription charges
 * - Custom discounts (One-time and Monthly)
 * - Total Advance Payment Payable (Net One-Time + Net First Month)
 */

import { formatCurrency } from '@/lib/currency';

/**
 * Standard preset defaults for commercial deal setup (in major currency units, e.g. PKR / USD)
 */
export const DEFAULT_DEAL_PRESETS = {
  setupFee: 15000,
  trainingFee: 10000,
  supportFee: 5000,
  oneTimeDiscount: 0,
  monthlyDiscount: 0,
};

/**
 * Calculate registration costs and advance payment breakdown
 *
 * @param {Object} params
 * @param {number} [params.setupFee=0] - One-time setup & onboarding fee
 * @param {number} [params.trainingFee=0] - One-time staff/owner training fee
 * @param {number} [params.supportFee=0] - One-time launch & migration support fee
 * @param {number} [params.monthlyFee=0] - Monthly recurring subscription charge
 * @param {number} [params.oneTimeDiscount=0] - Discount on one-time costs
 * @param {number} [params.monthlyDiscount=0] - Discount on monthly recurring fee
 * @param {string} [params.currency='PKR'] - Currency code
 * @param {string} [params.notes=''] - Additional commercial deal notes
 * @returns {Object} Complete cost breakdown and advance payment total
 */
export function calculateRegistrationCosts({
  setupFee = 0,
  trainingFee = 0,
  supportFee = 0,
  monthlyFee = 0,
  oneTimeDiscount = 0,
  monthlyDiscount = 0,
  currency = 'PKR',
  notes = '',
} = {}) {
  const setup = Math.max(0, Number(setupFee) || 0);
  const training = Math.max(0, Number(trainingFee) || 0);
  const support = Math.max(0, Number(supportFee) || 0);
  const monthly = Math.max(0, Number(monthlyFee) || 0);

  const discOneTime = Math.max(0, Number(oneTimeDiscount) || 0);
  const discMonthly = Math.max(0, Number(monthlyDiscount) || 0);

  const totalOneTimeGross = setup + training + support;
  const totalOneTimeNet = Math.max(0, totalOneTimeGross - discOneTime);

  const firstMonthNet = Math.max(0, monthly - discMonthly);
  const totalAdvancePayable = totalOneTimeNet + firstMonthNet;

  return {
    setupFee: setup,
    trainingFee: training,
    supportFee: support,
    monthlyFee: monthly,
    oneTimeDiscount: discOneTime,
    monthlyDiscount: discMonthly,
    totalOneTimeGross,
    totalOneTimeNet,
    firstMonthNet,
    totalAdvancePayable,
    currency: String(currency || 'PKR').toUpperCase(),
    notes: String(notes || '').trim(),
    formatted: {
      setupFee: formatCurrency(setup, currency),
      trainingFee: formatCurrency(training, currency),
      supportFee: formatCurrency(support, currency),
      monthlyFee: formatCurrency(monthly, currency),
      oneTimeDiscount: formatCurrency(discOneTime, currency),
      monthlyDiscount: formatCurrency(discMonthly, currency),
      totalOneTimeGross: formatCurrency(totalOneTimeGross, currency),
      totalOneTimeNet: formatCurrency(totalOneTimeNet, currency),
      firstMonthNet: formatCurrency(firstMonthNet, currency),
      totalAdvancePayable: formatCurrency(totalAdvancePayable, currency),
    },
  };
}

/**
 * Format deal terms for display or storage
 */
export function buildDealTermsPayload(inputData) {
  const calc = calculateRegistrationCosts(inputData);
  return {
    setup_fee: calc.setupFee,
    training_fee: calc.trainingFee,
    support_fee: calc.supportFee,
    monthly_fee: calc.monthlyFee,
    one_time_discount: calc.oneTimeDiscount,
    monthly_discount: calc.monthlyDiscount,
    total_one_time_net: calc.totalOneTimeNet,
    first_month_net: calc.firstMonthNet,
    total_advance_payable: calc.totalAdvancePayable,
    currency: calc.currency,
    notes: calc.notes,
    calculated_at: new Date().toISOString(),
  };
}
