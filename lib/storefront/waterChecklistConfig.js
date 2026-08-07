/**
 * Water Delivery Checklist Configuration System
 * 
 * INTELLIGENCE:
 * - Smart target calculation from multiple data sources
 * - Flexible area grouping strategies
 * - Column visibility and customization
 * - Multiple checklist presets for different workflows
 * 
 * CUSTOMIZATION:
 * - Per-business checklist preferences
 * - Column enable/disable
 * - Area grouping rules
 * - Target calculation strategies
 * 
 * ACCURACY:
 * - All calculations based on real route hisab data
 * - Bottle balance reflects opening + DEL - REC
 * - Phone and account info from customer records
 */

// ============================================================================
// Column Definitions
// ============================================================================

/**
 * Available checklist columns with metadata.
 * Each column defines its purpose, data source, and display properties.
 */
export const CHECKLIST_COLUMN_DEFS = {
  serial: {
    id: 'serial',
    label: '#',
    width: { thermal58: null, thermal80: null, areaList: '7mm' },
    required: false,
    description: 'Sequential stop number',
  },
  house: {
    id: 'house',
    label: 'H#',
    width: { thermal58: '11%', thermal80: '10%', areaList: null },
    required: true,
    description: 'House number identifier',
    source: 'row.houseNo',
  },
  accountNo: {
    id: 'accountNo',
    label: 'A/C',
    width: { thermal58: null, thermal80: null, areaList: '20mm' },
    required: false,
    description: 'Customer account number',
    source: 'row.accountNo || row.customerCode',
  },
  customer: {
    id: 'customer',
    label: 'CUSTOMER',
    width: { thermal58: '38%', thermal80: '25%', areaList: null },
    required: true,
    description: 'Customer name',
    source: 'row.customerName',
  },
  address: {
    id: 'address',
    label: 'ADDRESS',
    width: { thermal58: null, thermal80: null, areaList: 'flex' },
    required: false,
    description: 'Combined house + customer name',
    source: 'formatCustomerAddress(row)',
  },
  phone: {
    id: 'phone',
    label: 'PHONE',
    width: { thermal58: null, thermal80: '15%', areaList: '28mm' },
    required: false,
    description: 'Customer contact number',
    source: 'row.phone',
  },
  target: {
    id: 'target',
    label: 'TGT',
    width: { thermal58: '11%', thermal80: '8%', areaList: '10mm' },
    required: true,
    description: 'Target bottles to deliver',
    source: 'calculateSmartTarget(row, products, config)',
  },
  delivered: {
    id: 'delivered',
    label: 'DEL',
    width: { thermal58: '12%', thermal80: '10%', areaList: '16mm' },
    required: true,
    description: 'Delivered bottles (rider fills)',
    tickBox: true,
  },
  received: {
    id: 'received',
    label: 'REC',
    width: { thermal58: '12%', thermal80: '10%', areaList: '16mm' },
    required: true,
    description: 'Received empties (rider fills)',
    tickBox: true,
  },
  cash: {
    id: 'cash',
    label: 'CASH',
    width: { thermal58: null, thermal80: '10%', areaList: '16mm' },
    required: false,
    description: 'Cash collected (rider fills)',
    tickBox: true,
  },
  balance: {
    id: 'balance',
    label: 'BAL',
    width: { thermal58: '16%', thermal80: '12%', areaList: '11mm' },
    required: true,
    description: 'Bottle balance at customer',
    source: 'row.bottleBalance',
  },
};

// ============================================================================
// Target Calculation Strategies
// ============================================================================

/**
 * Strategies for calculating target bottles per customer.
 * Priority: qtyByProduct sum > dailyBottles > 1 (minimum)
 */
export const TARGET_CALCULATION_STRATEGIES = {
  /**
   * Auto: Intelligent calculation from available data
   * 1. Sum qtyByProduct across all products
   * 2. Fallback to dailyBottles preference
   * 3. Minimum 1 for active routes
   */
  auto: (row, products) => {
    let total = 0;
    
    // Try product columns
    if (row.qtyByProduct && typeof row.qtyByProduct === 'object') {
      for (const p of products || []) {
        total += Number(row.qtyByProduct[String(p.id)]) || 0;
      }
    }
    
    // Fallback to daily preference
    if (total === 0) {
      total = Number(row.dailyBottles) || 0;
    }
    
    // Ensure minimum
    return total > 0 ? total : 1;
  },

  /**
   * Manual: Use explicit target if provided, else auto
   */
  manual: (row, products) => {
    if (row.manualTarget != null && Number(row.manualTarget) > 0) {
      return Number(row.manualTarget);
    }
    return TARGET_CALCULATION_STRATEGIES.auto(row, products);
  },

  /**
   * Historical: Average from past deliveries
   * (Requires historical data - fallback to auto)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  historical: (row, products, _config) => {
    if (row.historicalAverage != null && Number(row.historicalAverage) > 0) {
      return Math.round(Number(row.historicalAverage));
    }
    return TARGET_CALCULATION_STRATEGIES.auto(row, products);
  },

  /**
   * Scheduled: Use delivery schedule if available
   * (For weekly/monthly patterns - fallback to auto)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scheduled: (row, products, _config) => {
    const deliveryDays = String(row.deliveryDays || '').toLowerCase();
    if (deliveryDays === 'daily') {
      return TARGET_CALCULATION_STRATEGIES.auto(row, products);
    }
    // For weekly/monthly, could multiply daily by frequency
    // For now, fallback to auto
    return TARGET_CALCULATION_STRATEGIES.auto(row, products);
  },
};

/**
 * Calculate smart target bottles for a customer row.
 */
export function calculateSmartTarget(row, products, config = {}) {
  const strategy = config.targetStrategy || 'auto';
  const calc = TARGET_CALCULATION_STRATEGIES[strategy];
  
  if (!calc) {
    console.warn(`[waterChecklist] Unknown strategy "${strategy}", using auto`);
    return TARGET_CALCULATION_STRATEGIES.auto(row, products);
  }
  
  return calc(row, products, config);
}

// ============================================================================
// Area Grouping
// ============================================================================

/**
 * Group customers by area intelligently.
 * Priority: routeLabel > deliveryArea > townCode > "General"
 */
export function groupCustomersByArea(rows, products, config = {}) {
  const groupMap = new Map();
  // Default sortBy priority: routeLabel, townCode, deliveryArea
  const sortBy = config.areaGrouping?.sortBy || ['routeLabel', 'townCode', 'deliveryArea'];
  
  rows.forEach((row) => {
    // Find first non-empty area field
    let area = '';
    for (const field of sortBy) {
      const val = String(row[field] || '').trim();
      if (val) {
        area = val;
        break;
      }
    }
    if (!area) area = 'General';
    
    if (!groupMap.has(area)) {
      groupMap.set(area, {
        name: area,
        rows: [],
        targetTotal: 0,
      });
    }
    
    const tgt = calculateSmartTarget(row, products, config);
    const group = groupMap.get(area);
    group.rows.push({ ...row, calculatedTarget: tgt });
    group.targetTotal += tgt;
  });
  
  // Convert to array and sort
  const groups = Array.from(groupMap.values());
  // sortOrder can be: asc or desc
  const sortOrder = config.areaGrouping?.sortOrder || 'asc';
  
  groups.sort((a, b) => {
    if (sortOrder === 'desc') {
      return b.name.localeCompare(a.name);
    }
    return a.name.localeCompare(b.name);
  });
  
  return groups;
}

/**
 * Format customer address intelligently.
 */
export function formatCustomerAddress(row) {
  const house = String(
    row.houseNo && row.houseNo !== '?' && row.houseNo !== 'null' 
      ? row.houseNo 
      : ''
  ).trim();
  
  const name = String(row.customerName || '').trim();
  
  if (house && name) {
    return `${house} — ${name}`;
  }
  return house || name || 'Customer';
}

// ============================================================================
// Checklist Presets
// ============================================================================

/**
 * Pre-configured checklist layouts for common workflows.
 */
export const CHECKLIST_PRESETS = {
  /**
   * Minimal 58mm thermal - Rider-only essentials
   * H# | CUSTOMER | TGT | DEL☐ | REC☐ | BAL
   */
  minimal58mm: {
    name: 'Minimal 58mm Thermal',
    paperSize: '58mm',
    format: 'thermal',
    columns: ['house', 'customer', 'target', 'delivered', 'received', 'balance'],
    targetStrategy: 'auto',
    areaGrouping: {
      enabled: false,
    },
  },

  /**
   * Full 80mm thermal - Includes phone & cash
   * H# | CUSTOMER | PHONE | TGT | DEL☐ | REC☐ | CASH☐ | BAL
   */
  full80mm: {
    name: 'Full 80mm Thermal',
    paperSize: '80mm',
    format: 'thermal',
    columns: ['house', 'customer', 'phone', 'target', 'delivered', 'received', 'cash', 'balance'],
    targetStrategy: 'auto',
    areaGrouping: {
      enabled: false,
    },
  },

  /**
   * Detailed area list - Full register format
   * # | A/C | ADDRESS | PHONE | TGT | DEL☐ | REC☐ | CASH☐ | BAL
   */
  detailedAreaList: {
    name: 'Detailed Area List (A4)',
    paperSize: 'A4',
    format: 'areaList',
    columns: ['serial', 'accountNo', 'address', 'phone', 'target', 'delivered', 'received', 'cash', 'balance'],
    targetStrategy: 'auto',
    areaGrouping: {
      enabled: true,
      sortBy: ['routeLabel', 'deliveryArea', 'townCode'],
      sortOrder: 'asc',
      showSubtotals: true,
    },
  },

  /**
   * Compact area list - A5 paper
   */
  compactAreaList: {
    name: 'Compact Area List (A5)',
    paperSize: 'A5',
    format: 'areaList',
    columns: ['serial', 'accountNo', 'address', 'target', 'delivered', 'received', 'cash', 'balance'],
    targetStrategy: 'auto',
    areaGrouping: {
      enabled: true,
      sortBy: ['routeLabel', 'deliveryArea', 'townCode'],
      sortOrder: 'asc',
      showSubtotals: true,
    },
  },
};

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default checklist configuration.
 * Can be overridden per business via settings.waterHisab.checklist
 */
export const DEFAULT_CHECKLIST_CONFIG = {
  // Target calculation strategy
  targetStrategy: 'auto',
  
  // Area grouping settings
  areaGrouping: {
    enabled: true,
    // sortBy priority: routeLabel, townCode, deliveryArea
    sortBy: ['routeLabel', 'townCode', 'deliveryArea'],
    // sortOrder: asc or desc
    sortOrder: 'asc',
    showSubtotals: true,
  },
  
  // Column visibility (for customization)
  columns: {
    thermal58: ['house', 'customer', 'target', 'delivered', 'received', 'balance'],
    thermal80: ['house', 'customer', 'phone', 'target', 'delivered', 'received', 'cash', 'balance'],
    areaList: ['serial', 'accountNo', 'address', 'phone', 'target', 'delivered', 'received', 'cash', 'balance'],
  },
  
  // Display preferences
  display: {
    zebraStripe: true,
    showLegend: true,
    showReconciliation: true,
  },
};

// ============================================================================
// Configuration Validation & Access
// ============================================================================

/**
 * Validate checklist configuration object.
 */
export function validateChecklistConfig(config) {
  const errors = [];
  
  if (config.targetStrategy && !TARGET_CALCULATION_STRATEGIES[config.targetStrategy]) {
    errors.push(`Invalid targetStrategy: ${config.targetStrategy}`);
  }
  
  if (config.areaGrouping?.sortOrder && !['asc', 'desc'].includes(config.areaGrouping.sortOrder)) {
    errors.push(`Invalid sortOrder: ${config.areaGrouping.sortOrder}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Read checklist configuration from business settings or use defaults.
 */
export function readChecklistConfig(business, overrides = {}) {
  const settingsConfig = business?.settings?.waterHisab?.checklist || {};
  
  const merged = {
    ...DEFAULT_CHECKLIST_CONFIG,
    ...settingsConfig,
    ...overrides,
    areaGrouping: {
      ...DEFAULT_CHECKLIST_CONFIG.areaGrouping,
      ...(settingsConfig.areaGrouping || {}),
      ...(overrides.areaGrouping || {}),
    },
    columns: {
      ...DEFAULT_CHECKLIST_CONFIG.columns,
      ...(settingsConfig.columns || {}),
      ...(overrides.columns || {}),
    },
    display: {
      ...DEFAULT_CHECKLIST_CONFIG.display,
      ...(settingsConfig.display || {}),
      ...(overrides.display || {}),
    },
  };
  
  const validation = validateChecklistConfig(merged);
  if (!validation.valid) {
    console.warn('[waterChecklist] Config validation warnings:', validation.errors);
  }
  
  return merged;
}

/**
 * Get active columns for a specific format.
 */
export function getActiveColumns(format, config = {}) {
  const formatKey = format === 'thermal' 
    ? (config.paperSize === '58mm' ? 'thermal58' : 'thermal80')
    : 'areaList';
  
  const activeIds = config.columns?.[formatKey] || DEFAULT_CHECKLIST_CONFIG.columns[formatKey];
  
  return activeIds
    .map(id => CHECKLIST_COLUMN_DEFS[id])
    .filter(Boolean);
}

/**
 * Build enriched checklist payload ready for print.
 */
export function buildChecklistPayload({ business, rows, products, config = {} }) {
  const finalConfig = readChecklistConfig(business, config);
  
  // Enrich rows with calculated targets
  const enrichedRows = rows.map(row => ({
    ...row,
    calculatedTarget: calculateSmartTarget(row, products, finalConfig),
    formattedAddress: formatCustomerAddress(row),
  }));
  
  // Group if needed
  const groups = finalConfig.areaGrouping?.enabled
    ? groupCustomersByArea(enrichedRows, products, finalConfig)
    : [{ name: 'All', rows: enrichedRows, targetTotal: enrichedRows.reduce((s, r) => s + r.calculatedTarget, 0) }];
  
  // Calculate grand totals
  let grandTarget = 0;
  groups.forEach(g => { grandTarget += g.targetTotal; });
  
  return {
    config: finalConfig,
    groups,
    enrichedRows,
    totals: {
      stops: rows.length,
      targetBottles: grandTarget,
    },
  };
}
