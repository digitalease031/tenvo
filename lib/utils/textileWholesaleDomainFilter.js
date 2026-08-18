/**
 * Textile Wholesale Domain Filter
 * Applies domain-aware filtering to ensure wholesalers only see relevant features
 * 
 * Usage:
 * - Call filterTabsForTextileWholesale() to get visible tabs
 * - Call filterFeaturesForTextileWholesale() to get enabled features
 * - Call applyTextileWholesaleLabels() to get domain-specific labels
 */

import {
  TEXTILE_WHOLESALE_HIDDEN_TABS,
  TEXTILE_WHOLESALE_VISIBLE_TABS,
  TEXTILE_WHOLESALE_MODULES,
  TEXTILE_WHOLESALE_LABELS,
  isTextileWholesaleTabVisible,
  isTextileWholesaleFeatureHidden,
  getTextileWholesaleLabel,
  isTextileWholesaleFieldVisible,
} from '@/lib/config/textileWholesaleDomainConfig';

/**
 * Check if business is textile wholesale
 * @param {string} category
 * @returns {boolean}
 */
export function isTextileWholesale(category) {
  const key = String(category || '').toLowerCase().trim();
  return key === 'textile-wholesale' || key === 'textile';
}

/**
 * Filter hub tabs for textile wholesale
 * Removes irrelevant tabs
 * 
 * @param {Array} allTabs - All available tabs
 * @param {string} category - Business category
 * @returns {Array} Filtered tabs
 */
export function filterTabsForTextileWholesale(allTabs, category) {
  if (!isTextileWholesale(category)) {
    return allTabs; // No filtering for other domains
  }

  return allTabs.filter((tab) => {
    const tabKey = typeof tab === 'string' ? tab : tab.id || tab.key;
    return isTextileWholesaleTabVisible(tabKey);
  });
}

/**
 * Filter plan features for textile wholesale
 * Disables irrelevant features
 * 
 * @param {object} planFeatures - Base plan features
 * @param {string} category - Business category
 * @returns {object} Filtered features
 */
export function filterFeaturesForTextileWholesale(planFeatures, category) {
  if (!isTextileWholesale(category)) {
    return planFeatures; // No filtering for other domains
  }

  // Merge base plan features with textile-specific overrides
  return {
    ...planFeatures,
    ...TEXTILE_WHOLESALE_MODULES,
  };
}

/**
 * Apply textile wholesale labels
 * Replace generic labels with domain-specific ones
 * 
 * @param {object} labels - Base labels
 * @param {string} category - Business category
 * @returns {object} Domain-aware labels
 */
export function applyTextileWholesaleLabels(labels, category) {
  if (!isTextileWholesale(category)) {
    return labels;
  }

  const domainLabels = {};
  
  // Apply textile-specific labels
  for (const [key, value] of Object.entries(labels)) {
    const textileLabel = getTextileWholesaleLabel(key);
    domainLabels[key] = textileLabel !== key ? textileLabel : value;
  }

  return domainLabels;
}

/**
 * Filter form fields for textile wholesale
 * Hides irrelevant fields
 * 
 * @param {Array} fields - All form fields
 * @param {string} formType - 'product' | 'customer' | 'vendor' | 'invoice' | 'expense'
 * @param {string} category - Business category
 * @returns {Array} Filtered fields
 */
export function filterFormFieldsForTextileWholesale(fields, formType, category) {
  if (!isTextileWholesale(category)) {
    return fields;
  }

  return fields.filter((field) => {
    const fieldKey = typeof field === 'string' ? field : field.name || field.id;
    return isTextileWholesaleFieldVisible(formType, fieldKey);
  });
}

/**
 * Get dashboard widgets for textile wholesale
 * Returns only relevant widgets
 * 
 * @param {string} category - Business category
 * @returns {Array} Widgets to display
 */
export function getTextileWholesaleDashboardWidgets(category) {
  if (!isTextileWholesale(category)) {
    return null; // Use default widgets
  }

  const { TEXTILE_WHOLESALE_DASHBOARD_WIDGETS } = require('@/lib/config/textileWholesaleDomainConfig');
  return TEXTILE_WHOLESALE_DASHBOARD_WIDGETS;
}

/**
 * Get available reports for textile wholesale
 * Returns only relevant reports
 * 
 * @param {string} category - Business category
 * @returns {Array} Reports to show
 */
export function getTextileWholesaleReports(category) {
  if (!isTextileWholesale(category)) {
    return null; // Use default reports
  }

  const { TEXTILE_WHOLESALE_REPORTS } = require('@/lib/config/textileWholesaleDomainConfig');
  return TEXTILE_WHOLESALE_REPORTS;
}

/**
 * Get inventory view modes for textile wholesale
 * 
 * @param {string} category - Business category
 * @returns {Array} View modes
 */
export function getTextileWholesaleInventoryViews(category) {
  if (!isTextileWholesale(category)) {
    return null;
  }

  const { TEXTILE_WHOLESALE_INVENTORY_VIEWS } = require('@/lib/config/textileWholesaleDomainConfig');
  return TEXTILE_WHOLESALE_INVENTORY_VIEWS;
}

/**
 * Get customer view modes for textile wholesale
 * 
 * @param {string} category - Business category
 * @returns {Array} View modes
 */
export function getTextileWholesaleCustomerViews(category) {
  if (!isTextileWholesale(category)) {
    return null;
  }

  const { TEXTILE_WHOLESALE_CUSTOMER_VIEWS } = require('@/lib/config/textileWholesaleDomainConfig');
  return TEXTILE_WHOLESALE_CUSTOMER_VIEWS;
}

/**
 * Build navigation menu for textile wholesale
 * Simplified menu structure
 * 
 * @param {string} category - Business category
 * @param {object} planFeatures - Plan features
 * @returns {Array} Menu items
 */
export function buildTextileWholesaleNavigation(category, planFeatures = {}) {
  if (!isTextileWholesale(category)) {
    return null; // Use default navigation
  }

  const filteredFeatures = filterFeaturesForTextileWholesale(planFeatures, category);

  const navigation = [
    {
      section: 'Core',
      items: [
        { id: 'dashboard', label: 'Overview', icon: 'LayoutDashboard' },
        { id: 'invoices', label: 'Invoices', icon: 'FileText', badge: 'primary' },
        { id: 'customers', label: 'Parties', icon: 'Users' },
      ],
    },
    {
      section: 'Operations',
      items: [
        { id: 'inventory', label: 'Stock', icon: 'Package' },
        { id: 'purchases', label: 'Purchases', icon: 'ShoppingCart' },
        { id: 'vendors', label: 'Mills', icon: 'Factory' },
      ],
    },
    {
      section: 'Finance',
      items: [
        { id: 'payments', label: 'Collections', icon: 'Wallet' },
        { id: 'expenses', label: 'Expenses', icon: 'Receipt' },
        ...(filteredFeatures.finance_hub
          ? [{ id: 'finance', label: 'Accounts', icon: 'Calculator' }]
          : []
        ),
      ],
    },
    {
      section: 'More',
      items: [
        { id: 'reports', label: 'Reports', icon: 'FileBarChart' },
        ...(filteredFeatures.quotations
          ? [{ id: 'quotations', label: 'Quotations', icon: 'FileCheck' }]
          : []
        ),
        ...(filteredFeatures.multi_warehouse
          ? [{ id: 'warehouses', label: 'Godowns', icon: 'Warehouse' }]
          : []
        ),
        ...(filteredFeatures.batch_tracking
          ? [{ id: 'batches', label: 'Rolls', icon: 'Tag' }]
          : []
        ),
        ...(filteredFeatures.pos
          ? [{ id: 'pos', label: 'Counter', icon: 'CreditCard' }]
          : []
        ),
        { id: 'settings', label: 'Settings', icon: 'Settings' },
      ],
    },
  ];

  return navigation;
}

/**
 * Get onboarding checklist for textile wholesale
 * Simplified setup steps
 * 
 * @param {string} category - Business category
 * @returns {Array} Checklist items
 */
export function getTextileWholesaleOnboarding(category) {
  if (!isTextileWholesale(category)) {
    return null;
  }

  return [
    {
      id: 'add-products',
      title: 'Add Fabric Articles',
      description: 'Add your thaans, lawns, and fabrics with Article/Design numbers',
      icon: 'Package',
      action: '/business/textile-wholesale/inventory?action=add',
    },
    {
      id: 'add-parties',
      title: 'Add Parties (Retailers)',
      description: 'Add your customers with credit limits and payment terms',
      icon: 'Users',
      action: '/business/textile-wholesale/customers?action=add',
    },
    {
      id: 'add-mills',
      title: 'Add Mills (Suppliers)',
      description: 'Add mills and suppliers you buy fabric from',
      icon: 'Factory',
      action: '/business/textile-wholesale/vendors?action=add',
    },
    {
      id: 'create-invoice',
      title: 'Create First Invoice',
      description: 'Create a sale invoice with thaan/meter/suit units',
      icon: 'FileText',
      action: '/business/textile-wholesale/invoices?action=new',
    },
    {
      id: 'record-payment',
      title: 'Record Payment',
      description: 'Log customer payments to track outstanding balances',
      icon: 'Wallet',
      action: '/business/textile-wholesale/payments?action=record',
    },
    {
      id: 'view-ledger',
      title: 'Check Party Ledger',
      description: 'View outstanding balances and credit utilization',
      icon: 'FileBarChart',
      action: '/business/textile-wholesale/reports?report=party-ledger',
    },
  ];
}

/**
 * Get help content for textile wholesale
 * Domain-specific guidance
 * 
 * @param {string} category - Business category
 * @returns {object} Help content
 */
export function getTextileWholesaleHelp(category) {
  if (!isTextileWholesale(category)) {
    return null;
  }

  return {
    gettingStarted: {
      title: 'Getting Started with Textile Wholesale',
      sections: [
        {
          title: 'Understanding Units',
          content: `
            - **Thaan**: Fabric roll (usually 35-45 meters)
            - **Meter**: Base unit for all conversions
            - **Suit**: Fabric needed for one suit (usually 2.25m)
            - **Gaz**: Traditional unit (0.9144 meters)
            - **Guth**: Bundle of 10 suits
          `,
        },
        {
          title: 'Credit Management',
          content: `
            - Set credit limits for each party
            - System blocks invoices when limit exceeded
            - Track outstanding balances automatically
            - Get alerts for overdue parties
          `,
        },
        {
          title: 'Seasonal Planning',
          content: `
            - Eid peaks: Stock up 6-8 weeks ahead
            - Wedding season: October-December
            - System alerts you during peak months
            - Get restock recommendations
          `,
        },
      ],
    },
    commonTasks: [
      {
        task: 'Create thaan invoice',
        steps: [
          'Go to Invoices tab',
          'Click "New Invoice"',
          'Select party',
          'Add product and select "thaan" as unit',
          'Enter thaan length (e.g., 40m)',
          'System auto-converts to total meters',
          'Save invoice',
        ],
      },
      {
        task: 'Record payment',
        steps: [
          'Go to Payments tab',
          'Click "Record Payment"',
          'Select invoice or party',
          'Enter amount received',
          'Select payment method (Cash/Bank/Cheque)',
          'Outstanding balance updates automatically',
        ],
      },
      {
        task: 'Check party ledger',
        steps: [
          'Go to Customers tab',
          'Click on party name',
          'View full ledger with all invoices',
          'See outstanding balance',
          'Check credit utilization',
        ],
      },
    ],
  };
}

// Re-export functions from config for convenience
export { isTextileWholesaleTabVisible, isTextileWholesaleFeatureHidden, getTextileWholesaleLabel, isTextileWholesaleFieldVisible };

export default {
  isTextileWholesale,
  isTextileWholesaleTabVisible,
  filterTabsForTextileWholesale,
  filterFeaturesForTextileWholesale,
  applyTextileWholesaleLabels,
  filterFormFieldsForTextileWholesale,
  getTextileWholesaleDashboardWidgets,
  getTextileWholesaleReports,
  getTextileWholesaleInventoryViews,
  getTextileWholesaleCustomerViews,
  buildTextileWholesaleNavigation,
  getTextileWholesaleOnboarding,
  getTextileWholesaleHelp,
};
