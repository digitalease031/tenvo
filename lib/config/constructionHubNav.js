/**
 * Construction Domain Hub Navigation & Configuration
 * Pakistan-focused construction contractor management
 *
 * For: construction-contractor, civil-engineering, building-construction, road-infrastructure
 * Package: construction-management (Enterprise tier)
 *
 * Mirrors the milk-shop hub nav pattern — hides retail/POS/storefront chrome
 * and shows only construction-relevant modules.
 */

import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { getConstructionLeanFeatureStrip } from '@/lib/config/domainPackageFeatures';
import { getPackagingFromSettings } from '@/lib/subscription/effectivePlanAccess';
import { mergePackagingIntoBusinessSettings } from '@/lib/utils/businessPackagingSettings';

// ── Domain Detection ─────────────────────────────────────────────────────────

const CONSTRUCTION_CANONICAL = 'construction-contractor';

/**
 * Check if a business category resolves to the construction domain.
 * @param {string | null | undefined} category
 */
export function isConstructionDomain(category) {
  if (!category) return false;
  return resolveDomainKey(String(category)) === CONSTRUCTION_CANONICAL;
}

// ── Hidden Nav Keys ──────────────────────────────────────────────────────────

/**
 * Nav keys always hidden for construction businesses.
 * Construction runs on Projects / BOQ / IPC — not retail POS, loyalty, or memberships.
 */
export const CONSTRUCTION_HIDDEN_NAV_KEYS = Object.freeze([
  // Retail / POS / Hospitality — irrelevant for a contractor
  'pos',
  'refunds',
  'restaurant',
  'kds',
  'loyalty',
  'memberships',
  // Marketing / campaigns — contractor lands clients via PEC/PPRA tenders, not ads
  'campaigns',
  'promotions',
  // Retail-only storefront flows — construction has a portfolio site, not a shop
  'orders',
  'store-settings',
  'view-storefront',
  // HR modules not yet wired to construction
  'payroll',
  'attendance',
  'shifts',
  // Route delivery — milk/water specific
  'route-hisab',
  // Approval workflow shown separately in construction hub
  'approvals',
]);

const HIDDEN = new Set(CONSTRUCTION_HIDDEN_NAV_KEYS);

/**
 * @param {string} navKey
 * @param {string | null | undefined} category
 * @returns {boolean} true when the nav item may appear (still plan/RBAC gated)
 */
export function isConstructionHubNavAllowed(navKey, category) {
  if (!isConstructionDomain(category)) return true;
  return !HIDDEN.has(String(navKey || ''));
}

/**
 * Merge the construction lean packaging into business settings,
 * stripping POS/restaurant/loyalty feature flags for construction tenants.
 * Owner explicit overrides are preserved.
 * @param {unknown} settings
 * @param {string | null | undefined} category
 */
export function mergeConstructionLeanNavSettings(settings, category) {
  if (!isConstructionDomain(category)) return settings;

  let strip = {};
  try {
    strip = getConstructionLeanFeatureStrip?.() || {};
  } catch {
    // domainPackageFeatures may not yet export this — degrade gracefully
  }

  const existing = getPackagingFromSettings(settings)?.feature_overrides || {};
  const { nextSettings } = mergePackagingIntoBusinessSettings(
    settings && typeof settings === 'object'
      ? /** @type {Record<string, unknown>} */ (settings)
      : {},
    {
      mode: 'custom',
      featureOverrides: {
        ...strip,
        ...existing, // owner's own overrides always win
      },
    }
  );
  return nextSettings;
}

// ── Hub Tab Configuration ────────────────────────────────────────────────────

/**
 * Construction Hub Tabs
 * Replaces generic retail tabs with a full construction workflow.
 */
export const CONSTRUCTION_HUB_TABS = [
  {
    id: 'overview',
    label: 'Dashboard',
    label_ur: 'ڈیش بورڈ',
    icon: 'LayoutDashboard',
    description: 'Project KPIs, IPC timeline, BOQ variance, and machinery fleet summary',
    featureGate: null,
  },
  {
    id: 'projects',
    label: 'Projects',
    label_ur: 'پروجیکٹس',
    icon: 'Building2',
    description: 'PEC/PPRA registered projects, BOQ tracking, IPC billing, completion',
    featureGate: 'project_costing',
    subTabs: [
      { id: 'active',    label: 'Active Projects',   icon: 'CircleDot' },
      { id: 'bidding',   label: 'Bidding / Tender',  icon: 'FileText' },
      { id: 'dlp',       label: 'DLP / Handover',    icon: 'CheckCircle' },
      { id: 'completed', label: 'Completed',         icon: 'Archive' },
    ],
  },
  {
    id: 'boq',
    label: 'BOQ & Estimation',
    label_ur: 'بی او کیو اور تخمینہ',
    icon: 'Calculator',
    description: 'Bill of Quantities, MRS/CSR rates, composite analysis, variance tracking',
    featureGate: 'boq_tracking',
    subTabs: [
      { id: 'boq-items',         label: 'BOQ Items',         icon: 'List' },
      { id: 'variance',          label: 'Variance Analysis', icon: 'TrendingUp' },
      { id: 'material-rates',    label: 'Material Rates',    icon: 'DollarSign' },
      { id: 'tender-calculator', label: 'Tender Calculator', icon: 'Calculator' },
    ],
  },
  {
    id: 'material-rates',
    label: 'Material Rates',
    label_ur: 'میٹریل ریٹس',
    icon: 'Package',
    description: '2026 Pakistani market rates, BOQ comparison, PEC Clause 70 escalation alerts',
    featureGate: null,
  },
  {
    id: 'tax-compliance',
    label: 'Tax Compliance',
    label_ur: 'ٹیکس تعمیل',
    icon: 'Receipt',
    description: 'FBR WHT Section 153, provincial tax calculator, filing calendar, compliance checklist',
    featureGate: null,
  },
  {
    id: 'ipc',
    label: 'IPC & Billing',
    label_ur: 'آئی پی سی اور بلنگ',
    icon: 'Receipt',
    description: 'Interim Payment Certificates, running bills, retention, mobilization recovery',
    featureGate: 'ipc_billing',
    subTabs: [
      { id: 'ipcs',      label: 'IPC Timeline',        icon: 'Clock' },
      { id: 'pending',   label: 'Pending Approval',    icon: 'AlertCircle' },
      { id: 'approved',  label: 'Approved / Disbursed', icon: 'CheckCircle2' },
      { id: 'retention', label: 'Retention Ledger',    icon: 'Wallet' },
    ],
  },
  {
    id: 'site-materials',
    label: 'Site Materials',
    label_ur: 'سائٹ میٹریل',
    icon: 'Package',
    description: 'BOQ materials inventory, gate passes, site requisitions, batch tracking',
    featureGate: 'inventory',
    subTabs: [
      { id: 'stock',        label: 'On-Site Stock',       icon: 'Warehouse' },
      { id: 'gate-pass',    label: 'Gate Pass',           icon: 'ClipboardCheck' },
      { id: 'requisitions', label: 'Material Requisitions', icon: 'FileEdit' },
      { id: 'consumption',  label: 'BOQ Consumption',     icon: 'TrendingDown' },
    ],
  },
  {
    id: 'machinery',
    label: 'Plant & Machinery',
    label_ur: 'پلانٹ اور مشینری',
    icon: 'Truck',
    description: 'Heavy equipment logbook, fuel tracking, productivity analysis, maintenance',
    featureGate: 'machinery_logbook',
    subTabs: [
      { id: 'fleet',       label: 'Fleet Overview',  icon: 'Layers' },
      { id: 'logbook',     label: 'Daily Logbook',   icon: 'BookOpen' },
      { id: 'fuel',        label: 'Fuel & Costs',    icon: 'Fuel' },
      { id: 'maintenance', label: 'Maintenance',     icon: 'Wrench' },
    ],
  },
  {
    id: 'subcontractors',
    label: 'Subcontractors',
    label_ur: 'سب کانٹریکٹرز',
    icon: 'Users',
    description: 'Work orders, running accounts, retainage tracking, DLP management',
    featureGate: 'subcontractor_ledger',
    subTabs: [
      { id: 'active',     label: 'Active Work Orders', icon: 'FileText' },
      { id: 'payments',   label: 'Running Account',    icon: 'CreditCard' },
      { id: 'retainage',  label: 'Retainage Ledger',  icon: 'Lock' },
      { id: 'dlp-release', label: 'DLP Release',      icon: 'Unlock' },
    ],
  },
  {
    id: 'site-ops',
    label: 'Site Operations',
    label_ur: 'سائٹ آپریشنز',
    icon: 'HardHat',
    description: 'Daily work reports, safety logs, quality testing, site inspections',
    featureGate: 'site_operations',
    subTabs: [
      { id: 'daily-reports', label: 'Daily Work Reports', icon: 'Calendar' },
      { id: 'safety',        label: 'HSE & Safety Logs',  icon: 'Shield' },
      { id: 'quality',       label: 'Quality Testing',    icon: 'TestTube' },
      { id: 'inspections',   label: 'Site Inspections',   icon: 'Eye' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    label_ur: 'فنانس',
    icon: 'Banknote',
    description: 'GL accounts, cash flow, WHT compliance, retention release, project P&L',
    featureGate: 'finance',
    subTabs: [
      { id: 'cash-flow',        label: 'Cash Flow',        icon: 'ArrowRightLeft' },
      { id: 'project-pl',       label: 'Project P&L',      icon: 'PieChart' },
      { id: 'wht',              label: 'WHT Compliance',   icon: 'FileCheck' },
      { id: 'retention-release', label: 'Retention Release', icon: 'Unlock' },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    label_ur: 'خریداری',
    icon: 'ShoppingCart',
    description: 'Material purchase orders, supplier quotes, PPRA compliance, payment tracking',
    featureGate: 'purchases',
    subTabs: [
      { id: 'po',     label: 'Purchase Orders',  icon: 'FileText' },
      { id: 'quotes', label: 'Supplier Quotes',  icon: 'DollarSign' },
      { id: 'ppra',   label: 'PPRA Compliance',  icon: 'Shield' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    label_ur: 'رپورٹس',
    icon: 'BarChart3',
    description: 'BOQ variance, IPC history, machinery logs, subcontractor accounts, escalation',
    featureGate: null,
    subTabs: [
      { id: 'boq-variance',           label: 'BOQ Variance',           icon: 'TrendingUp' },
      { id: 'ipc-history',            label: 'IPC History',            icon: 'Clock' },
      { id: 'machinery-productivity', label: 'Machinery Productivity', icon: 'Zap' },
      { id: 'subcontractor-accounts', label: 'Subcontractor Accounts', icon: 'Users' },
      { id: 'escalation',             label: 'PEC Escalation',         icon: 'ArrowUp' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    label_ur: 'ترتیبات',
    icon: 'Settings',
    description: 'PEC license, PPRA registration, company profile, tax configuration',
    featureGate: null,
  },
];

// ── Dashboard KPIs ───────────────────────────────────────────────────────────

export const CONSTRUCTION_DASHBOARD_KPIS = [
  {
    id: 'active-projects',
    label: 'Active Projects',
    label_ur: 'فعال پروجیکٹس',
    icon: 'Building2',
    type: 'count',
    source: 'construction_projects',
    filter: { status: 'ACTIVE' },
  },
  {
    id: 'total-contract-value',
    label: 'Total Contract Value',
    label_ur: 'کل کنٹریکٹ ویلیو',
    icon: 'DollarSign',
    type: 'currency',
    source: 'construction_projects',
    aggregation: 'sum',
    field: 'contract_value',
    filter: { status: ['ACTIVE', 'DLP'] },
  },
  {
    id: 'certified-work',
    label: 'Certified Work (IPC)',
    label_ur: 'سرٹیفائیڈ ورک',
    icon: 'CheckCircle2',
    type: 'currency',
    source: 'construction_projects',
    aggregation: 'sum',
    field: 'cumulative_certified',
    filter: { status: ['ACTIVE', 'DLP'] },
  },
  {
    id: 'retention-held',
    label: 'Retention Held',
    label_ur: 'ریٹینشن ہیلڈ',
    icon: 'Lock',
    type: 'currency',
    source: 'construction_projects',
    aggregation: 'sum',
    field: 'retention_held',
    filter: { status: ['ACTIVE', 'DLP'] },
  },
  {
    id: 'pending-ipcs',
    label: 'Pending IPCs',
    label_ur: 'زیر التوا آئی پی سی',
    icon: 'Clock',
    type: 'count',
    source: 'interim_payment_certificates',
    filter: { status: ['SUBMITTED', 'VERIFIED'] },
  },
  {
    id: 'machinery-fleet-hours',
    label: 'Fleet Hours (This Month)',
    label_ur: 'فلیٹ گھنٹے (اس ماہ)',
    icon: 'Truck',
    type: 'number',
    source: 'machinery_logs',
    aggregation: 'computed',
    calculation: 'SUM(end_hours - start_hours)',
    filter: 'current_month',
  },
  {
    id: 'boq-variance',
    label: 'BOQ Variance',
    label_ur: 'بی او کیو ویریئنس',
    icon: 'TrendingUp',
    type: 'percentage',
    source: 'calculated',
    calculation: 'boq_variance',
  },
  {
    id: 'completion-rate',
    label: 'Avg. Completion',
    label_ur: 'اوسط تکمیل',
    icon: 'Target',
    type: 'percentage',
    source: 'construction_projects',
    aggregation: 'avg',
    field: 'completion_pct',
    filter: { status: 'ACTIVE' },
  },
];

// ── Quick Actions ────────────────────────────────────────────────────────────

export const CONSTRUCTION_QUICK_ACTIONS = [
  {
    id: 'new-project',
    label: 'New Project',
    label_ur: 'نیا پروجیکٹ',
    icon: 'Plus',
    modal: 'create-project',
    featureGate: 'project_costing',
    description: 'Register new PEC/PPRA project',
  },
  {
    id: 'record-ipc',
    label: 'Record IPC',
    label_ur: 'آئی پی سی ریکارڈ کریں',
    icon: 'Receipt',
    modal: 'record-ipc',
    featureGate: 'ipc_billing',
    description: 'Submit interim payment certificate',
  },
  {
    id: 'log-machinery',
    label: 'Log Machinery',
    label_ur: 'مشینری لاگ',
    icon: 'Truck',
    modal: 'log-machinery',
    featureGate: 'machinery_logbook',
    description: 'Daily equipment hour log',
  },
  {
    id: 'add-boq-item',
    label: 'Add BOQ Item',
    label_ur: 'بی او کیو آئٹم شامل کریں',
    icon: 'Plus',
    modal: 'add-boq-item',
    featureGate: 'boq_tracking',
    description: 'Add line item to project BOQ',
  },
  {
    id: 'gate-pass',
    label: 'Gate Pass',
    label_ur: 'گیٹ پاس',
    icon: 'ClipboardCheck',
    modal: 'gate-pass',
    featureGate: 'inventory',
    description: 'Material inward/outward gate pass',
  },
  {
    id: 'daily-report',
    label: 'Daily Report',
    label_ur: 'یومیہ رپورٹ',
    icon: 'FileEdit',
    modal: 'daily-report',
    featureGate: 'site_operations',
    description: 'Site daily work report',
  },
];

// ── Feature Map ──────────────────────────────────────────────────────────────

export const CONSTRUCTION_FEATURE_MAP = {
  project_costing: {
    label: 'Project Management',
    description: 'PEC/PPRA project registry, BOQ tracking, completion monitoring',
    modules: ['projects'],
  },
  boq_tracking: {
    label: 'BOQ & Estimation',
    description: 'Bill of Quantities with MRS/CSR rates and variance analysis',
    modules: ['boq'],
  },
  ipc_billing: {
    label: 'IPC Billing',
    description: 'Interim Payment Certificates with mobilization and retention tracking',
    modules: ['ipc'],
  },
  machinery_logbook: {
    label: 'Plant & Machinery',
    description: 'Heavy equipment logbook, fuel tracking, productivity analysis',
    modules: ['machinery'],
  },
  subcontractor_ledger: {
    label: 'Subcontractor Management',
    description: 'Work orders, running accounts, retainage, DLP tracking',
    modules: ['subcontractors'],
  },
  site_operations: {
    label: 'Site Operations',
    description: 'Daily reports, safety logs, quality testing, inspections',
    modules: ['site-ops'],
  },
  inventory: {
    label: 'Site Materials',
    description: 'On-site stock, gate passes, BOQ consumption tracking',
    modules: ['site-materials'],
  },
  finance: {
    label: 'Finance & Accounting',
    description: 'Cash flow, project P&L, WHT compliance, retention release',
    modules: ['finance'],
  },
  purchases: {
    label: 'Procurement',
    description: 'Material purchase orders, supplier quotes, PPRA compliance',
    modules: ['procurement'],
  },
};

// ── Onboarding Checklist ─────────────────────────────────────────────────────

export const CONSTRUCTION_ONBOARDING_CHECKLIST = [
  {
    id: 'company-profile',
    label: 'Complete Company Profile',
    label_ur: 'کمپنی پروفائل مکمل کریں',
    description: 'Add PEC license, PPRA registration, NTN, contact details',
    fields: ['pec_license', 'ppra_registration', 'ntn', 'address'],
    priority: 'high',
  },
  {
    id: 'first-project',
    label: 'Register First Project',
    label_ur: 'پہلا پروجیکٹ رجسٹر کریں',
    description: 'Add your first construction project with client and contract details',
    action: 'create-project',
    priority: 'high',
  },
  {
    id: 'boq-setup',
    label: 'Setup Project BOQ',
    label_ur: 'پروجیکٹ بی او کیو سیٹ اپ',
    description: 'Add BOQ line items with estimated quantities and MRS/CSR rates',
    action: 'add-boq-items',
    priority: 'high',
  },
  {
    id: 'machinery-fleet',
    label: 'Register Machinery Fleet',
    label_ur: 'مشینری فلیٹ رجسٹر کریں',
    description: 'Add excavators, graders, pavers, and other equipment',
    action: 'register-machinery',
    priority: 'medium',
  },
  {
    id: 'subcontractors',
    label: 'Add Subcontractors',
    label_ur: 'سب کانٹریکٹرز شامل کریں',
    description: 'Register subcontractors with PEC licenses and specializations',
    action: 'add-subcontractors',
    priority: 'medium',
  },
  {
    id: 'first-ipc',
    label: 'Submit First IPC',
    label_ur: 'پہلا آئی پی سی جمع کرائیں',
    description: 'Record your first interim payment certificate',
    action: 'record-ipc',
    priority: 'low',
  },
];

// ── Pakistan Intelligence ────────────────────────────────────────────────────

export const PAKISTAN_CONSTRUCTION_INTELLIGENCE = {
  peakSeason: {
    months: ['October', 'November', 'December', 'January', 'February', 'March'],
    reason: 'Winter months ideal for concrete work and asphalt paving; avoid monsoon (July–September)',
  },
  criticalMaterials: [
    'Deformed Steel Rebar Grade 60',
    'OPC Cement 50kg',
    'Bitumen 60/70',
    'Ready-Mix Concrete',
    'Diesel Fuel',
  ],
  volatileMaterials: {
    Steel:   { volatility: 'high',   reason: 'Import parity, USD/PKR rate, China steel prices' },
    Cement:  { volatility: 'medium', reason: 'Coal prices, power tariff, seasonal demand' },
    Bitumen: { volatility: 'high',   reason: 'Crude oil prices, refinery margins' },
    Diesel:  { volatility: 'high',   reason: 'OGRA fuel prices, quarterly adjustments' },
  },
  leadTimes: {
    'Deformed Steel Rebar': { days: 7,  note: 'Order from mills 1 week in advance' },
    'Ready-Mix Concrete':   { days: 1,  note: 'Same-day delivery possible' },
    'Bitumen':              { days: 14, note: 'Import lead time 2 weeks' },
    'Heavy Equipment':      { days: 30, note: 'Rental booking 1 month advance (peak season)' },
  },
  compliance: {
    pec: {
      label: 'Pakistan Engineering Council',
      required: ['PEC License Category', 'Specialization Code', 'Renewal Date'],
      renewalFrequency: 'Annual',
    },
    ppra: {
      label: 'Public Procurement Regulatory Authority',
      required: ['PPRA Registration', 'Active Taxpayer Status', 'Tender Submissions'],
      jurisdiction: ['Federal', 'Punjab', 'Sindh', 'KP', 'Balochistan'],
    },
    fbr: {
      label: 'Federal Board of Revenue',
      required: ['NTN', 'WHT Section 153(1)(c)', 'Monthly WHT Returns'],
      whtRate: { company: 7.5, nonCompany: 8.0 },
    },
    provincial: {
      label: 'Provincial Sales Tax',
      rates: { pra: 5.0, srb: 13.0, kpra: 15.0, bra: 15.0 },
      note: 'Reduced rate for construction services under PRA',
    },
  },
};

// ── Runtime Config Resolver ──────────────────────────────────────────────────

/**
 * Returns construction-specific hub configuration for the given business.
 * Returns null for non-construction categories.
 *
 * @param {{ category?: string } | null | undefined} business
 * @param {{ hasFeature?: (f: string) => boolean } | null | undefined} membership
 */
export function getConstructionHubConfig(business, membership) {
  if (!isConstructionDomain(business?.category)) return null;

  const hasFeature = (f) => !f || membership?.hasFeature?.(f) !== false;

  return {
    tabs: CONSTRUCTION_HUB_TABS.filter((t) => hasFeature(t.featureGate)),
    kpis: CONSTRUCTION_DASHBOARD_KPIS,
    quickActions: CONSTRUCTION_QUICK_ACTIONS.filter((a) => hasFeature(a.featureGate)),
    featureMap: CONSTRUCTION_FEATURE_MAP,
    onboardingChecklist: CONSTRUCTION_ONBOARDING_CHECKLIST,
    intelligence: PAKISTAN_CONSTRUCTION_INTELLIGENCE,
    defaultTab: 'overview',
    theme: {
      primaryColor: '#a71930', // construction red
      accentColor: '#ff6b35',  // safety orange
    },
  };
}

// ── Plan Nav Matrix (for verify scripts) ────────────────────────────────────

/**
 * Expected construction hub capabilities by plan tier.
 * Used by verify scripts — not a runtime gate.
 *
 * @typedef {'core'|'starter'|'professional'|'business'|'enterprise'} PlanBand
 * @type {Record<PlanBand, { visible: string[], lockedOrHidden: string[] }>}
 */
export const CONSTRUCTION_PLAN_NAV_MATRIX = Object.freeze({
  core: {
    visible: ['dashboard', 'inventory', 'invoices', 'customers', 'vendors', 'purchases', 'finance', 'settings'],
    lockedOrHidden: ['projects', 'boq', 'ipc', 'machinery', 'subcontractors', 'site-ops', 'reports', 'pos', 'orders'],
  },
  starter: {
    visible: ['dashboard', 'inventory', 'invoices', 'customers', 'vendors', 'purchases', 'finance', 'payments', 'gst', 'settings'],
    lockedOrHidden: ['projects', 'boq', 'ipc', 'machinery', 'subcontractors', 'site-ops', 'pos', 'orders'],
  },
  professional: {
    visible: ['dashboard', 'inventory', 'invoices', 'customers', 'vendors', 'purchases', 'finance', 'payments', 'gst', 'reports', 'settings'],
    lockedOrHidden: ['pos', 'orders', 'memberships', 'loyalty'],
  },
  business: {
    visible: ['dashboard', 'inventory', 'invoices', 'customers', 'vendors', 'purchases', 'finance', 'payments', 'gst', 'reports', 'settings'],
    lockedOrHidden: ['pos', 'orders', 'memberships'],
  },
  enterprise: {
    visible: [
      'dashboard', 'projects', 'boq', 'ipc', 'site-materials', 'machinery',
      'subcontractors', 'site-ops', 'finance', 'procurement', 'reports', 'settings',
      'inventory', 'invoices', 'customers', 'vendors', 'purchases', 'payments', 'gst',
    ],
    lockedOrHidden: ['pos', 'orders', 'restaurant', 'memberships', 'loyalty', 'route-hisab'],
  },
});

export default {
  CONSTRUCTION_HUB_TABS,
  CONSTRUCTION_DASHBOARD_KPIS,
  CONSTRUCTION_QUICK_ACTIONS,
  CONSTRUCTION_FEATURE_MAP,
  CONSTRUCTION_ONBOARDING_CHECKLIST,
  PAKISTAN_CONSTRUCTION_INTELLIGENCE,
  CONSTRUCTION_HIDDEN_NAV_KEYS,
  CONSTRUCTION_PLAN_NAV_MATRIX,
  isConstructionDomain,
  isConstructionHubNavAllowed,
  mergeConstructionLeanNavSettings,
  getConstructionHubConfig,
};
