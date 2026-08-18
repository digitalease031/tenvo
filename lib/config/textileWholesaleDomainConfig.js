/**
 * Textile Wholesale Domain Configuration
 * Clean, focused setup that hides features irrelevant to cloth wholesalers
 * 
 * Philosophy: Show only what textile wholesalers need
 * - NO manufacturing (they're traders, not mills)
 * - NO serial tracking (thaans don't have serial numbers)
 * - NO memberships (not a service business)
 * - NO restaurant/KDS (not food service)
 * - YES batch tracking (roll/bale numbers)
 * - YES credit management (party ledger is critical)
 * - YES multi-warehouse (for large wholesalers)
 */

/**
 * Textile Wholesale Enabled Modules
 * Only show relevant tabs and features
 */
export const TEXTILE_WHOLESALE_MODULES = {
  // CORE - Always enabled
  invoicing: true,
  purchases: true,
  customers: true,
  vendors: true,
  basic_accounting: true,
  basic_reports: true,
  quotations: true,

  // POS - Optional (counter sales)
  pos: true,
  pos_refunds: true,
  barcode_scanning: true,
  offline_pos_mode: false, // Usually don't need offline

  // FINANCE - Essential for credit business
  expense_tracking: true, // For broker commission
  credit_notes: true,
  payment_allocations: true,
  fiscal_periods: false, // Not needed for basic wholesale
  multi_currency: false, // Usually single currency
  exchange_rates: false,
  tax_compliance: true, // FBR/GST critical

  // OPERATIONS
  multi_warehouse: true, // Many have multiple godowns
  batch_tracking: true, // Roll/bale numbers
  serial_tracking: false, // NOT needed for fabric
  manufacturing: false, // Traders, NOT mills
  delivery_challans: true, // Gate pass for fabric
  stock_reservations: false, // Usually not needed

  // CRM
  loyalty_programs: false, // B2B doesn't need loyalty points
  membership_management: false, // Not a service business
  campaigns: false, // Usually no marketing campaigns
  promotions_crm: false, // Wholesale pricing is fixed
  price_lists: true, // Different prices for retailers vs tailors
  supplier_quotes: true,

  // HR
  payroll: false, // Small staff, manual payroll
  attendance_tracking: false,
  shift_scheduling: false,

  // INTELLIGENCE
  ai_analytics: false, // Start simple
  ai_forecasting: false,
  ai_restock: false,
  advanced_reports: true, // Need party ledger reports
  custom_reports: false,

  // GOVERNANCE
  approval_workflows: false, // Owner approves everything manually
  audit_logs: false,
  multi_branch: false, // Usually single location
  multi_domain: false,

  // PLATFORM
  custom_workflows: false,
  api_access: false,
  priority_support: false,
  white_label: false,
  webhook_integrations: false,

  // RESTAURANT (NOT APPLICABLE)
  restaurant_pos: false,
  restaurant_kds: false,

  // STOREFRONT
  storefront_orders: false, // Usually offline wholesale only
  sales_hub: false,
  finance_hub: false,
};

/**
 * Hidden Tabs for Textile Wholesale
 * These tabs will not appear in the hub navigation
 */
export const TEXTILE_WHOLESALE_HIDDEN_TABS = [
  'manufacturing', // Not mills
  'bom', // No bill of materials
  'serials', // No serial tracking
  'memberships', // Not service business
  'loyalty', // B2B doesn't need points
  'campaigns', // No marketing
  'promotions', // Fixed wholesale pricing
  'payroll', // Manual payroll
  'attendance', // Manual tracking
  'shifts', // No shift management
  'restaurant', // Not food service
  'kds', // No kitchen
  'forecasting', // Keep it simple
  'projects', // Not construction
  'boq', // Not construction
  'ipc', // Not construction
  'site-materials', // Not construction
  'machinery', // Not construction
  'subcontractors', // Not construction
  'route-hisab', // Not milk/water delivery
];

/**
 * Visible Tabs for Textile Wholesale (in order)
 * Simple, focused navigation
 */
export const TEXTILE_WHOLESALE_VISIBLE_TABS = [
  'dashboard', // Overview
  'invoices', // Sales invoices (most important)
  'customers', // Party ledger
  'inventory', // Thaan stock
  'purchases', // Buying from mills
  'vendors', // Mill/supplier management
  'payments', // Collections
  'expenses', // Broker commission
  'finance', // Basic accounting (consolidated)
  'reports', // Party ledger, stock reports
  'quotations', // Price quotes
  'warehouses', // Multiple godowns (if needed)
  'batches', // Roll/bale tracking
  'pos', // Counter sales (if needed)
  'settings', // Business settings
];

/**
 * Simplified Labels for Textile Domain
 * Use industry-specific terminology
 */
export const TEXTILE_WHOLESALE_LABELS = {
  product: 'Article',
  sku: 'Article No',
  invoice: 'Invoice',
  purchase: 'Purchase Bill',
  customer: 'Party / Retailer',
  vendor: 'Mill / Supplier',
  warehouse: 'Godown',
  batch_number: 'Roll / Bale No',
  pos_terminal: 'Counter',
  delivery_challan: 'Gate Pass',
  price_list: 'Rate List',
  quotation: 'Price Quotation',
};

/**
 * Textile Wholesale Dashboard Widgets (Simplified)
 * Only show what matters to cloth wholesalers
 */
export const TEXTILE_WHOLESALE_DASHBOARD_WIDGETS = [
  // Row 1: Critical Metrics
  {
    id: 'total-outstanding',
    title: 'Total Outstanding',
    type: 'metric',
    icon: 'Users',
    size: 'small',
    priority: 1,
  },
  {
    id: 'overdue-parties',
    title: 'Overdue Parties',
    type: 'metric',
    icon: 'AlertCircle',
    size: 'small',
    priority: 1,
  },
  {
    id: 'thaan-stock',
    title: 'Thaan Stock',
    type: 'metric',
    icon: 'Package',
    size: 'small',
    priority: 1,
  },
  {
    id: 'today-sales',
    title: "Today's Sales",
    type: 'metric',
    icon: 'TrendingUp',
    size: 'small',
    priority: 1,
  },

  // Row 2: Lists
  {
    id: 'top-outstanding',
    title: 'Top Outstanding Parties',
    type: 'list',
    size: 'large',
    priority: 2,
  },
  {
    id: 'fast-movers',
    title: 'Fast Moving Designs',
    type: 'list',
    size: 'large',
    priority: 2,
  },

  // Row 3: Alerts
  {
    id: 'seasonal-alert',
    title: 'Seasonal Intelligence',
    type: 'alert',
    size: 'full',
    priority: 3,
    conditional: 'isPeakSeason',
  },
  {
    id: 'low-stock',
    title: 'Low Stock Articles',
    type: 'list',
    size: 'medium',
    priority: 3,
  },
  {
    id: 'pending-payments',
    title: 'Recent Collections',
    type: 'list',
    size: 'medium',
    priority: 3,
  },
];

/**
 * Textile Wholesale Reports (Focused)
 * Only essential reports for cloth wholesalers
 */
export const TEXTILE_WHOLESALE_REPORTS = [
  // Party Management
  {
    id: 'party-ledger',
    name: 'Party Ledger',
    category: 'accounts',
    description: 'Outstanding balance by party',
    icon: 'Users',
  },
  {
    id: 'ar-aging',
    name: 'Accounts Receivable Aging',
    category: 'accounts',
    description: '30/60/90 day aging',
    icon: 'Clock',
  },
  {
    id: 'collections-summary',
    name: 'Collections Summary',
    category: 'accounts',
    description: 'Payments received',
    icon: 'Wallet',
  },

  // Stock Reports
  {
    id: 'stock-by-article',
    name: 'Stock by Article',
    category: 'inventory',
    description: 'Article-wise stock summary',
    icon: 'Package',
  },
  {
    id: 'stock-by-design',
    name: 'Stock by Design',
    category: 'inventory',
    description: 'Design-wise stock summary',
    icon: 'Palette',
  },
  {
    id: 'stock-valuation',
    name: 'Stock Valuation',
    category: 'inventory',
    description: 'Thaan/meter stock value',
    icon: 'DollarSign',
  },
  {
    id: 'slow-movers',
    name: 'Slow Moving Stock',
    category: 'inventory',
    description: 'Dead stock analysis',
    icon: 'TrendingDown',
  },

  // Sales Reports
  {
    id: 'daily-sales',
    name: 'Daily Sales Report',
    category: 'sales',
    description: 'Day-wise sales summary',
    icon: 'Calendar',
  },
  {
    id: 'design-wise-sales',
    name: 'Design-wise Sales',
    category: 'sales',
    description: 'Sales by design',
    icon: 'TrendingUp',
  },
  {
    id: 'party-wise-sales',
    name: 'Party-wise Sales',
    category: 'sales',
    description: 'Sales by party',
    icon: 'Users',
  },

  // Purchase Reports
  {
    id: 'purchase-summary',
    name: 'Purchase Summary',
    category: 'purchases',
    description: 'Purchases from mills',
    icon: 'ShoppingCart',
  },
  {
    id: 'supplier-ledger',
    name: 'Supplier Ledger',
    category: 'purchases',
    description: 'Payable to mills',
    icon: 'Factory',
  },

  // Expense Reports
  {
    id: 'broker-commission',
    name: 'Broker Commission Report',
    category: 'expenses',
    description: 'Commission summary',
    icon: 'UserCheck',
  },
  {
    id: 'expense-summary',
    name: 'Expense Summary',
    category: 'expenses',
    description: 'Monthly expenses',
    icon: 'Receipt',
  },
];

/**
 * Textile Wholesale Form Fields Visibility
 * Hide irrelevant fields from forms
 */
export const TEXTILE_WHOLESALE_FORM_FIELDS = {
  product: {
    visible: [
      'sku', // Article No
      'name', // Product name
      'category',
      'brand',
      'unit', // thaan, meter, suit
      'price',
      'cost_price',
      'stock',
      'reorder_level',
      'description',
      // Domain-specific fields (auto-shown)
      'domain_data.articleno',
      'domain_data.designno',
      'domain_data.fabrictype',
      'domain_data.colorshade',
      'domain_data.korafinished',
      'domain_data.widtharz',
      'domain_data.thaanlength',
      'domain_data.suitcutting',
      'domain_data.sourcing',
      'domain_data.origin',
    ],
    hidden: [
      'warranty_period', // Not applicable to fabric
      'warranty_type',
      'requires_prescription', // Not medicine
      'vehicle_model', // Not auto parts
      'imei', // Not electronics
      'expiry_date', // Fabric doesn't expire (unless specific)
      'manufacturer', // Usually brand is enough
      'dimensions', // Not critical for fabric
      'weight', // Usually by meter/kg
    ],
  },

  customer: {
    visible: [
      'name', // Party name
      'phone',
      'email',
      'credit_limit', // CRITICAL
      'payment_terms', // CRITICAL
      'opening_balance',
      'address',
      // Domain-specific
      'domain_data.shop_name',
      'domain_data.market_location',
      'domain_data.buyer_type',
      'domain_data.broker_name',
      'domain_data.ntn_status',
    ],
    hidden: [
      'tax_exemption', // Usually not applicable
      'membership_tier', // Not membership business
      'loyalty_points', // B2B doesn't need points
      'preferences', // Not relevant
      'birthday', // Not relevant
      'anniversary', // Not relevant
    ],
  },

  vendor: {
    visible: [
      'name', // Mill name
      'phone',
      'email',
      'payment_terms',
      'opening_balance',
      'address',
      // Domain-specific
      'domain_data.mill_name',
      'domain_data.agent_name',
      'domain_data.city',
      'domain_data.quality_grade',
      'domain_data.moq_thaan',
    ],
    hidden: [
      'tax_exemption',
      'lead_time', // Usually standard
    ],
  },

  invoice: {
    visible: [
      'customer', // Party
      'invoice_date',
      'due_date',
      'payment_terms',
      'line_items',
      'subtotal',
      'tax',
      'grand_total',
      'notes',
      'reference_number',
    ],
    hidden: [
      'shipping_address', // Usually pickup/delivery
      'shipping_cost', // Not applicable
      'discount_percentage', // Fixed wholesale pricing
      'loyalty_points_earned', // B2B doesn't earn points
      'delivery_date', // Usually same day/next day
      'project', // Not project-based
      'department', // Not departmentalized
    ],
  },

  expense: {
    visible: [
      'amount',
      'category', // Broker commission, etc.
      'date',
      'payment_method',
      'notes',
      'vendor', // If paying mill/supplier
    ],
    hidden: [
      'project', // Not project-based
      'employee', // Manual payroll
      'department',
      'billable', // Not service business
      'client', // Not consulting
    ],
  },
};

/**
 * Textile Wholesale Inventory View Modes
 * Simplified view options
 */
export const TEXTILE_WHOLESALE_INVENTORY_VIEWS = [
  {
    id: 'all',
    name: 'All Products',
    icon: 'Grid',
    default: true,
  },
  {
    id: 'by-article',
    name: 'Group by Article',
    icon: 'Layers',
  },
  {
    id: 'by-design',
    name: 'Group by Design',
    icon: 'Palette',
  },
  {
    id: 'by-fabric',
    name: 'Group by Fabric Type',
    icon: 'Filter',
  },
  {
    id: 'low-stock',
    name: 'Low Stock',
    icon: 'AlertTriangle',
  },
  {
    id: 'slow-moving',
    name: 'Slow Moving',
    icon: 'TrendingDown',
  },
];

/**
 * Textile Wholesale Customer View Modes
 * Focused on credit management
 */
export const TEXTILE_WHOLESALE_CUSTOMER_VIEWS = [
  {
    id: 'all',
    name: 'All Parties',
    icon: 'Users',
    default: true,
  },
  {
    id: 'outstanding',
    name: 'Outstanding Balance',
    icon: 'DollarSign',
    sort: 'outstanding_desc',
  },
  {
    id: 'overdue',
    name: 'Overdue',
    icon: 'AlertCircle',
    filter: 'overdue',
  },
  {
    id: 'credit-limit',
    name: 'Near Credit Limit',
    icon: 'AlertTriangle',
    filter: 'credit_usage_gt_80',
  },
  {
    id: 'by-type',
    name: 'By Buyer Type',
    icon: 'Tag',
    group: 'buyer_type',
  },
];

/**
 * Check if a feature should be hidden for textile wholesale
 * @param {string} featureKey
 * @returns {boolean}
 */
export function isTextileWholesaleFeatureHidden(featureKey) {
  return TEXTILE_WHOLESALE_MODULES[featureKey] === false;
}

/**
 * Check if a tab should be visible for textile wholesale
 * @param {string} tabKey
 * @returns {boolean}
 */
export function isTextileWholesaleTabVisible(tabKey) {
  return (
    TEXTILE_WHOLESALE_VISIBLE_TABS.includes(tabKey) &&
    !TEXTILE_WHOLESALE_HIDDEN_TABS.includes(tabKey)
  );
}

/**
 * Get textile wholesale label for a field
 * @param {string} fieldKey
 * @returns {string}
 */
export function getTextileWholesaleLabel(fieldKey) {
  return TEXTILE_WHOLESALE_LABELS[fieldKey] || fieldKey;
}

/**
 * Check if a form field should be visible
 * @param {string} formType - 'product' | 'customer' | 'vendor' | 'invoice' | 'expense'
 * @param {string} fieldKey
 * @returns {boolean}
 */
export function isTextileWholesaleFieldVisible(formType, fieldKey) {
  const config = TEXTILE_WHOLESALE_FORM_FIELDS[formType];
  if (!config) return true; // Unknown form type, show all

  // Check if explicitly hidden
  if (config.hidden && config.hidden.includes(fieldKey)) {
    return false;
  }

  // If visible array exists, check membership
  if (config.visible && config.visible.length > 0) {
    return config.visible.includes(fieldKey);
  }

  // Default: show field
  return true;
}

/**
 * Get simplified plan features for textile wholesale
 * Hides complex features they don't need
 * @param {string} planTier
 * @returns {object}
 */
export function getTextileWholesalePlanFeatures(planTier) {
  const basePlan = resolvePlanTier(planTier);
  
  // Override with textile-specific module configuration
  return {
    ...basePlan.features,
    ...TEXTILE_WHOLESALE_MODULES,
  };
}

/**
 * Get recommended plan for textile wholesale
 * Based on business size and needs
 * @param {object} criteria
 * @returns {string}
 */
export function getTextileWholesaleRecommendedPlan(criteria = {}) {
  const {
    monthlyInvoices = 0,
    totalProducts = 0,
    totalCustomers = 0,
    needsMultiWarehouse = false,
    needsPOS = false,
  } = criteria;

  // Micro business: Free
  if (monthlyInvoices < 30 && totalProducts < 50 && totalCustomers < 50) {
    return 'free';
  }

  // Small shop: Starter (POS + basic finance)
  if (
    monthlyInvoices < 200 &&
    totalProducts < 250 &&
    totalCustomers < 200 &&
    !needsMultiWarehouse
  ) {
    return 'starter';
  }

  // Growing wholesaler: Professional (multi-warehouse + advanced reports)
  if (monthlyInvoices < 1000 || needsMultiWarehouse || totalProducts > 500) {
    return 'professional';
  }

  // Large wholesaler: Business (if they need advanced features)
  return 'professional'; // Usually don't need Business tier
}

export default {
  TEXTILE_WHOLESALE_MODULES,
  TEXTILE_WHOLESALE_HIDDEN_TABS,
  TEXTILE_WHOLESALE_VISIBLE_TABS,
  TEXTILE_WHOLESALE_LABELS,
  TEXTILE_WHOLESALE_DASHBOARD_WIDGETS,
  TEXTILE_WHOLESALE_REPORTS,
  TEXTILE_WHOLESALE_FORM_FIELDS,
  TEXTILE_WHOLESALE_INVENTORY_VIEWS,
  TEXTILE_WHOLESALE_CUSTOMER_VIEWS,
  isTextileWholesaleFeatureHidden,
  isTextileWholesaleTabVisible,
  getTextileWholesaleLabel,
  isTextileWholesaleFieldVisible,
  getTextileWholesalePlanFeatures,
  getTextileWholesaleRecommendedPlan,
};
