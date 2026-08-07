/**
 * Tenvo Plan Configuration - Modular Packaging System
 * Re-exports canonical 5-tier definitions from `lib/config/plans.js` to ensure 100% pricing & feature parity across the platform.
 * 
 * Pakistan Pricing Strategy (PKR):
 * - Free: 0 PKR (Solo entrepreneurs testing the platform)
 * - Starter: 5,000 PKR ($18 USD) - Small shops & POS
 * - Professional: 10,000 PKR ($35 USD) - Multi-warehouse, CRM & Storefront
 * - Business: 20,000 PKR ($70 USD) - Full ERP with Manufacturing, HR & AI
 * - Enterprise: 50,000 PKR ($175 USD) - Custom & White-Label
 */

import {
  PLAN_TIERS as CANONICAL_PLAN_TIERS,
  PLAN_ORDER as CANONICAL_PLAN_ORDER,
  PLAN_ALIASES as CANONICAL_PLAN_ALIASES,
  FEATURE_LABELS,
  resolvePlanTier as canonicalResolvePlanTier,
  planHasFeature as canonicalPlanHasFeature,
  planWithinLimit as canonicalPlanWithinLimit,
  planAtLeast as canonicalPlanAtLeast,
  getUpgradeBenefits as canonicalGetUpgradeBenefits,
  getNextTier as canonicalGetNextTier,
  getAllPlansOrdered as canonicalGetAllPlansOrdered,
} from './plans';

export const PLAN_TIERS = CANONICAL_PLAN_TIERS;
export const PLAN_ORDER = CANONICAL_PLAN_ORDER;
export const PLAN_ALIASES = CANONICAL_PLAN_ALIASES;
export const resolvePlanTier = canonicalResolvePlanTier;
export const planHasFeature = canonicalPlanHasFeature;
export const planWithinLimit = canonicalPlanWithinLimit;
export const planAtLeast = canonicalPlanAtLeast;
export const getUpgradeBenefits = canonicalGetUpgradeBenefits;
export const getNextTier = canonicalGetNextTier;
export const getAllPlansOrdered = canonicalGetAllPlansOrdered;

// ============================================
// MODULE PACKAGE DEFINITIONS
// ============================================

export const MODULE_PACKAGES = {
  // ESSENTIALS - Core business operations (Free tier includes this)
  essentials: {
    key: 'essentials',
    name: 'Business Essentials',
    description: 'Core invoicing, inventory, customers, and vendors management',
    icon: 'Package',
    standalone_price_pkr: 0,
    standalone_price_usd: 0,
    features: [
      'invoicing',
      'purchases',
      'customers',
      'vendors',
      'basic_accounting',
      'basic_reports',
      'quotations',
      'sales_orders',
      'delivery_challans',
    ],
  },

  // ACCOUNTS - Complete accounting & finance
  accounts: {
    key: 'accounts',
    name: 'Complete Accounting',
    description: 'Full financial management with GST, expenses, credit notes, and fiscal periods',
    icon: 'Calculator',
    standalone_price_pkr: 499,
    standalone_price_usd: 2,
    features: [
      'expense_tracking',
      'credit_notes',
      'payment_allocations',
      'fiscal_periods',
      'tax_compliance',
      'journal_entries',
      'bank_reconciliation',
      'chart_of_accounts',
    ],
  },

  // POS - Point of Sale & Retail
  pos: {
    key: 'pos',
    name: 'Point of Sale',
    description: 'Complete POS system with refunds, barcode scanning, and restaurant features',
    icon: 'ShoppingCart',
    standalone_price_pkr: 799,
    standalone_price_usd: 3,
    features: [
      'pos_terminal',
      'pos_refunds',
      'barcode_scanning',
      'multi_pos_terminals',
      'restaurant_pos',
      'kitchen_display_system',
      'table_management',
      'offline_pos_mode',
    ],
  },

  // OPERATIONS - Advanced inventory & logistics
  operations: {
    key: 'operations',
    name: 'Operations & Logistics',
    description: 'Multi-warehouse, batch/serial tracking, manufacturing, and stock management',
    icon: 'Warehouse',
    standalone_price_pkr: 1499,
    standalone_price_usd: 5,
    features: [
      'multi_warehouse',
      'batch_tracking',
      'serial_tracking',
      'manufacturing',
      'bill_of_materials',
      'production_orders',
      'stock_reservations',
      'stock_transfers',
    ],
  },

  // CRM - Marketing & Loyalty
  crm: {
    key: 'crm',
    name: 'CRM & Marketing',
    description: 'Loyalty programs, customer segmentation, and marketing campaigns',
    icon: 'Users',
    standalone_price_pkr: 999,
    standalone_price_usd: 4,
    features: [
      'loyalty_programs',
      'customer_segmentation',
      'campaigns_email_sms',
      'promotions_discounts',
      'price_lists',
      'customer_portal',
    ],
  },

  // HR - Payroll & Team Management
  hr: {
    key: 'hr',
    name: 'HR & Payroll',
    description: 'Complete HR suite with payroll processing, attendance, and shift scheduling',
    icon: 'UserCheck',
    standalone_price_pkr: 1299,
    standalone_price_usd: 5,
    features: [
      'payroll_processing',
      'salary_slips',
      'tax_deductions',
      'attendance_tracking',
      'shift_scheduling',
      'leave_management',
    ],
  },

  // INTELLIGENCE - AI & Advanced Analytics
  intelligence: {
    key: 'intelligence',
    name: 'AI & Intelligence',
    description: 'AI-powered demand forecasting, smart restock, and business intelligence',
    icon: 'Sparkles',
    standalone_price_pkr: 1999,
    standalone_price_usd: 7,
    features: [
      'ai_analytics',
      'ai_demand_forecasting',
      'ai_smart_restock',
      'advanced_reports',
      'custom_report_builder',
    ],
  },
};

export const MODULE_PICKER_CONFIG = {
  base_price_pkr: 0,
  base_price_usd: 0,
  bundle_discounts: {
    any_3_modules: 0.15,
    any_5_modules: 0.25,
    all_modules: 0.35,
  },
};

/**
 * Calculate custom package price based on selected modules
 */
export function calculateCustomPackagePrice(selectedModules, currency = 'pkr') {
  const { base_price_pkr, base_price_usd, bundle_discounts } = MODULE_PICKER_CONFIG;
  const priceKey = currency === 'pkr' ? 'standalone_price_pkr' : 'standalone_price_usd';
  const basePrice = currency === 'pkr' ? base_price_pkr : base_price_usd;
  
  let moduleTotal = selectedModules.reduce((sum, moduleKey) => {
    const module = MODULE_PACKAGES[moduleKey];
    return sum + (module ? module[priceKey] : 0);
  }, 0);
  
  let discount = 0;
  if (selectedModules.length >= 5) {
    discount = bundle_discounts.all_modules;
  } else if (selectedModules.length >= 3) {
    discount = bundle_discounts.any_3_modules;
  }
  
  const finalPrice = Math.round((basePrice + moduleTotal) * (1 - discount));
  
  return {
    basePrice,
    moduleTotal,
    discount,
    discountAmount: Math.round((basePrice + moduleTotal) * discount),
    finalPrice,
  };
}

/**
 * Get features by module package
 */
export function getModuleFeatures(moduleKey) {
  const module = MODULE_PACKAGES[moduleKey];
  if (!module) return [];
  
  return module.features.map(featureKey => ({
    key: featureKey,
    label: FEATURE_LABELS[featureKey] || featureKey,
  }));
}

/**
 * Get included modules for a tier
 */
export function getTierModules(tierKey) {
  const resolved = resolvePlanTier(tierKey);
  const tier = PLAN_TIERS[resolved];
  if (!tier) return [];
  
  const includedKeys = tier.included_modules || (tier.modules ? Object.keys(tier.modules).filter(k => tier.modules[k]) : []);
  return includedKeys.map(moduleKey => ({
    key: moduleKey,
    ...(MODULE_PACKAGES[moduleKey] || { name: moduleKey, description: '' }),
  }));
}

// Legacy feature map
export const LEGACY_FEATURE_MAP = {
  'basic_accounting': ['accounts'],
  'pos': ['pos_terminal', 'pos_refunds', 'barcode_scanning'],
  'finance': ['expense_tracking', 'credit_notes', 'payment_allocations', 'fiscal_periods'],
  'operations': ['multi_warehouse', 'batch_tracking', 'serial_tracking', 'manufacturing'],
  'crm': ['loyalty_programs', 'campaigns_email_sms', 'promotions_discounts'],
  'hr': ['payroll_processing', 'attendance_tracking', 'shift_scheduling'],
  'intelligence': ['ai_analytics', 'ai_demand_forecasting', 'ai_smart_restock'],
  'governance': ['approval_workflows', 'audit_logs', 'multi_branch'],
};

export function getLegacyModuleFeatures(moduleName) {
  const features = LEGACY_FEATURE_MAP[moduleName];
  if (!features) return [];
  
  return features.map(key => ({
    key,
    label: FEATURE_LABELS[key] || key,
  }));
}
