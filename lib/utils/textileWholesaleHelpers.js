/**
 * Textile Wholesale Helper Functions
 * Simplified utilities for cloth wholesalers
 */

/**
 * Calculate thaan stock summary from products
 * @param {Array} products - Product array with domain_data
 * @returns {Object} Summary with totalThaans, totalMeters, stockValue
 */
/**
 * Parse comma-separated or array Thaan roll meter breakdown into structured array and total meters.
 * Example input: "30, 12, 45.5, 28" or [30, 12, 45.5, 28]
 * @param {string|Array|number} input
 * @param {number} [fallbackLength=40]
 * @returns {{ rolls: number[], totalMeters: number, rollCount: number, averageLength: number }}
 */
export function parseThaanBreakdown(input, fallbackLength = 40) {
  let rolls = [];
  if (Array.isArray(input)) {
    rolls = input.map(Number).filter(n => !isNaN(n) && n > 0);
  } else if (typeof input === 'string' && input.trim()) {
    rolls = input.split(/[,;\s]+/).map(Number).filter(n => !isNaN(n) && n > 0);
  } else if (typeof input === 'number' && input > 0) {
    rolls = [input];
  }

  const rollCount = rolls.length;
  const totalMeters = rollCount > 0
    ? Math.round(rolls.reduce((sum, len) => sum + len, 0) * 100) / 100
    : 0;
  const averageLength = rollCount > 0
    ? Math.round((totalMeters / rollCount) * 100) / 100
    : Number(fallbackLength || 40);

  return { rolls, totalMeters, rollCount, averageLength };
}

/**
 * Calculate thaan stock summary from products
 * @param {Array} products - Product array with domain_data
 * @returns {Object} Summary with totalThaans, totalMeters, stockValue
 */
export function calculateThaanStockSummary(products = []) {
  let totalThaans = 0;
  let totalMeters = 0;
  let stockValue = 0;

  for (const product of products) {
    const unit = String(product.unit || '').toLowerCase();
    const stock = Number(product.stock || 0);
    const costPrice = Number(product.cost_price || product.price || 0);

    const breakdownRaw = product.domain_data?.thaan_breakdown || product.domain_data?.thaanbreakdown;
    const { rolls, totalMeters: breakdownMeters, rollCount } = parseThaanBreakdown(breakdownRaw);

    if (rolls.length > 0) {
      totalThaans += rollCount;
      totalMeters += breakdownMeters;
    } else if (unit === 'thaan') {
      totalThaans += stock;
      const thaanLength = Number(product.domain_data?.thaanlength || 40);
      totalMeters += stock * thaanLength;
    } else if (unit === 'meter' || unit === 'metre') {
      totalMeters += stock;
      const thaanLength = Number(product.domain_data?.thaanlength || 40);
      if (thaanLength > 0) {
        totalThaans += stock / thaanLength;
      }
    } else if (unit === 'suit') {
      const suitCutting = Number(product.domain_data?.suitcutting || 2.25);
      totalMeters += stock * suitCutting;
    }

    stockValue += stock * costPrice;
  }

  return {
    totalThaans: Math.round(totalThaans),
    totalMeters: Math.round(totalMeters),
    stockValue: Math.round(stockValue),
  };
}

/**
 * Group products by Article Number
 * @param {Array} products
 * @returns {Array} Grouped by article
 */
export function groupProductsByArticle(products = []) {
  const grouped = new Map();

  for (const product of products) {
    const articleNo = product.domain_data?.articleno || product.sku || 'UNKNOWN';
    
    if (!grouped.has(articleNo)) {
      grouped.set(articleNo, {
        articleNo,
        designs: [],
        totalStock: 0,
        totalValue: 0,
      });
    }

    const group = grouped.get(articleNo);
    group.designs.push(product);
    group.totalStock += Number(product.stock || 0);
    group.totalValue += Number(product.stock || 0) * Number(product.cost_price || 0);
  }

  return Array.from(grouped.values()).sort((a, b) => b.totalValue - a.totalValue);
}

/**
 * Group products by Design Number
 * @param {Array} products
 * @returns {Array} Grouped by design
 */
export function groupProductsByDesign(products = []) {
  const grouped = new Map();

  for (const product of products) {
    const designNo = product.domain_data?.designno || 'NO-DESIGN';
    
    if (!grouped.has(designNo)) {
      grouped.set(designNo, {
        designNo,
        articles: [],
        totalStock: 0,
        totalSold: 0,
      });
    }

    const group = grouped.get(designNo);
    group.articles.push(product);
    group.totalStock += Number(product.stock || 0);
    group.totalSold += Number(product.sold_qty || 0);
  }

  return Array.from(grouped.values()).sort((a, b) => b.totalSold - a.totalSold);
}

/**
 * Calculate party-wise outstanding summary
 * @param {Array} customers
 * @returns {Object} Summary stats
 */
export function calculatePartyOutstandingSummary(customers = []) {
  let totalOutstanding = 0;
  let totalCreditLimit = 0;
  let partiesWithBalance = 0;
  let overdueParties = 0;

  for (const customer of customers) {
    const outstanding = Number(customer.outstanding_balance || 0);
    const creditLimit = Number(customer.credit_limit || 0);

    if (outstanding > 0) {
      partiesWithBalance++;
      totalOutstanding += outstanding;

      // Check if approaching or exceeding credit limit
      if (creditLimit > 0 && outstanding >= creditLimit * 0.8) {
        overdueParties++;
      }
    }

    if (creditLimit > 0) {
      totalCreditLimit += creditLimit;
    }
  }

  return {
    totalOutstanding: Math.round(totalOutstanding),
    totalCreditLimit: Math.round(totalCreditLimit),
    partiesWithBalance,
    overdueParties,
    creditUtilization: totalCreditLimit > 0 
      ? Math.round((totalOutstanding / totalCreditLimit) * 100)
      : 0,
  };
}

/**
 * Calculate broker commission
 * @param {number} invoiceTotal
 * @param {number} commissionRate - percentage (e.g., 1.5 for 1.5%)
 * @returns {number} Commission amount
 */
export function calculateBrokerCommission(invoiceTotal, commissionRate = 1.5) {
  return Math.round((invoiceTotal * commissionRate) / 100);
}

/**
 * Get seasonal restock recommendations
 * @param {Array} products - Product array with sales history
 * @param {string} currentMonth
 * @returns {Array} Recommended restock items
 */
export function getSeasonalRestockRecommendations(products = [], currentMonth = null) {
  const month = currentMonth || new Date().toLocaleString('default', { month: 'long' });
  const peakMonths = ['April', 'May', 'June', 'July', 'November', 'December'];
  const isPeakSeason = peakMonths.includes(month);

  // Identify fast movers with low stock
  const recommendations = products
    .filter(product => {
      const stock = Number(product.stock || 0);
      const soldQty = Number(product.sold_qty || 0);
      const avgMonthlySales = soldQty / 12; // Rough estimate

      // Low stock relative to sales
      const isLowStock = stock < avgMonthlySales * 2;
      
      // Fast mover
      const isFastMover = soldQty > 10;

      return isLowStock && isFastMover;
    })
    .map(product => {
      const soldQty = Number(product.sold_qty || 0);
      const stock = Number(product.stock || 0);
      const avgMonthlySales = soldQty / 12;
      
      // Calculate recommended order quantity
      const safetyFactor = isPeakSeason ? 1.5 : 1.2;
      const recommendedQty = Math.ceil((avgMonthlySales * 2 * safetyFactor) - stock);

      return {
        productId: product.id,
        sku: product.sku,
        articleNo: product.domain_data?.articleno,
        designNo: product.domain_data?.designno,
        currentStock: stock,
        avgMonthlySales: Math.round(avgMonthlySales),
        recommendedQty,
        reason: isPeakSeason 
          ? 'Peak season demand + low stock'
          : 'Fast mover with low coverage',
      };
    })
    .sort((a, b) => b.avgMonthlySales - a.avgMonthlySales)
    .slice(0, 20);

  return recommendations;
}

/**
 * Identify slow-moving designs (dead stock candidates)
 * @param {Array} products
 * @param {number} daysThreshold - Days without sales
 * @returns {Array} Slow movers
 */
export function identifySlowMovingDesigns(products = [], daysThreshold = 90) {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() - daysThreshold * 24 * 60 * 60 * 1000);

  return products
    .filter(product => {
      const stock = Number(product.stock || 0);
      const soldQty = Number(product.sold_qty || 0);
      const lastSaleDate = product.last_sale_date 
        ? new Date(product.last_sale_date)
        : null;

      // Has stock but no recent sales
      const hasStock = stock > 0;
      const noRecentSales = !lastSaleDate || lastSaleDate < thresholdDate;
      const lowSales = soldQty < 5;

      return hasStock && (noRecentSales || lowSales);
    })
    .map(product => ({
      productId: product.id,
      sku: product.sku,
      articleNo: product.domain_data?.articleno,
      designNo: product.domain_data?.designno,
      stock: product.stock,
      soldQty: product.sold_qty || 0,
      lastSaleDate: product.last_sale_date,
      daysWithoutSale: product.last_sale_date
        ? Math.floor((now - new Date(product.last_sale_date)) / (1000 * 60 * 60 * 24))
        : daysThreshold + 1,
      stockValue: Math.round((product.stock || 0) * (product.cost_price || 0)),
    }))
    .sort((a, b) => b.stockValue - a.stockValue);
}

/**
 * Format thaan quantity for display
 * @param {number} quantity
 * @param {string} unit
 * @param {object} domainData
 * @returns {string} Formatted string
 */
export function formatThaanQuantity(quantity, unit, domainData = {}) {
  const qty = Number(quantity || 0);
  const unitLower = String(unit || '').toLowerCase();

  if (unitLower === 'thaan') {
    const thaanLength = Number(domainData.thaanlength || 40);
    const totalMeters = Math.round(qty * thaanLength * 100) / 100;
    return `${qty} Thaan (${thaanLength}m ea) = ${totalMeters}m`;
  }

  if (unitLower === 'suit') {
    const suitCutting = Number(domainData.suitcutting || 2.25);
    const totalMeters = Math.round(qty * suitCutting * 100) / 100;
    return `${qty} Suit = ${totalMeters}m`;
  }

  if (unitLower === 'gaz' || unitLower === 'yard') {
    const totalMeters = Math.round(qty * 0.9144 * 100) / 100;
    return `${qty} ${unitLower === 'gaz' ? 'Gaz' : 'Yard'} = ${totalMeters}m`;
  }

  if (unitLower === 'guth') {
    const suits = qty * 10;
    const suitCutting = Number(domainData.suitcutting || 2.25);
    const totalMeters = Math.round(suits * suitCutting * 100) / 100;
    return `${qty} Guth (${suits} Suits) = ${totalMeters}m`;
  }

  return `${qty} ${unit || 'pcs'}`;
}

/**
 * Validate credit limit before invoice
 * @param {object} customer
 * @param {number} newInvoiceAmount
 * @returns {object} Validation result
 */
export function validatePartyCredit(customer, newInvoiceAmount) {
  const creditLimit = Number(customer.credit_limit || 0);
  const outstanding = Number(customer.outstanding_balance || 0);
  const projected = outstanding + newInvoiceAmount;

  // No limit set = unlimited credit
  if (creditLimit === 0) {
    return {
      allowed: true,
      message: 'No credit limit set (unlimited)',
    };
  }

  // Within limit
  if (projected <= creditLimit) {
    const remaining = creditLimit - projected;
    const usage = Math.round((projected / creditLimit) * 100);
    
    return {
      allowed: true,
      usage,
      remaining,
      message: `${usage}% credit used, ${remaining.toFixed(0)} remaining`,
      warning: usage > 80,
    };
  }

  // Exceeds limit
  const excess = projected - creditLimit;
  return {
    allowed: false,
    exceeded: true,
    excess,
    message: `Credit limit exceeded by ${excess.toFixed(0)}. Limit: ${creditLimit}, Outstanding: ${outstanding}, New Invoice: ${newInvoiceAmount}`,
  };
}

/**
 * Generate payment terms options for textile wholesale
 * @returns {Array} Payment term options
 */
export function getTextilePaymentTerms() {
  return [
    { value: 'cash', label: 'Cash (Immediate)', days: 0 },
    { value: 'credit_7', label: 'Credit 7 Days', days: 7 },
    { value: 'credit_15', label: 'Credit 15 Days', days: 15 },
    { value: 'credit_30', label: 'Credit 30 Days', days: 30 },
    { value: 'credit_45', label: 'Credit 45 Days', days: 45 },
    { value: 'credit_60', label: 'Credit 60 Days', days: 60 },
    { value: 'pdc', label: 'Cheque (PDC)', days: 30 },
    { value: 'cod', label: 'Cash on Delivery', days: 0 },
  ];
}

/**
 * Calculate due date from payment terms
 * @param {string} paymentTerms
 * @param {Date} invoiceDate
 * @returns {Date} Due date
 */
export function calculateDueDateFromTerms(paymentTerms, invoiceDate = new Date()) {
  const terms = getTextilePaymentTerms().find(t => t.value === paymentTerms);
  const days = terms?.days || 0;
  
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + days);
  
  return dueDate;
}

/**
 * Get textile fabric type suggestions
 * @returns {Array} Fabric types common in Pakistan
 */
export function getTextileFabricTypes() {
  return [
    'Lawn',
    'Cotton',
    'Wash & Wear',
    'Chiffon',
    'Silk',
    'Khaddar',
    'Linen',
    'Jacquard',
    'Karandi',
    'Organza',
    'Velvet',
    'Georgette',
    'Cambric',
    'Viscose',
    'Net',
    'Shamoz',
    'Denim',
    'Kattan',
    'Banarsi',
    'Raw Silk',
  ];
}

/**
 * Get textile color suggestions
 * @returns {Array} Common colors in textile trade
 */
export function getTextileColorSuggestions() {
  return [
    'Off White',
    'White',
    'Cream',
    'Ivory',
    'Beige',
    'Navy Blue',
    'Royal Blue',
    'Sky Blue',
    'Black',
    'Charcoal',
    'Grey',
    'Red',
    'Maroon',
    'Green',
    'Olive Green',
    'Brown',
    'Khaki',
    'Mustard',
    'Golden',
    'Pink',
    'Peach',
    'Purple',
    'Orange',
    'Teal',
    'Printed',
    'Multi-Color',
  ];
}

/**
 * Export party ledger to CSV format
 * @param {Array} customers
 * @returns {string} CSV content
 */
export function exportPartyLedgerToCSV(customers = []) {
  const headers = [
    'Party Name',
    'Shop Name',
    'Market Location',
    'Buyer Type',
    'Outstanding Balance',
    'Credit Limit',
    'Payment Terms',
    'Broker Name',
    'Phone',
  ];

  const rows = customers.map(customer => [
    customer.name || '',
    customer.domain_data?.shop_name || '',
    customer.domain_data?.market_location || '',
    customer.domain_data?.buyer_type || '',
    (customer.outstanding_balance || 0).toFixed(2),
    (customer.credit_limit || 0).toFixed(2),
    customer.payment_terms || '',
    customer.domain_data?.broker_name || '',
    customer.phone || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export stock summary to CSV
 * @param {Array} products
 * @returns {string} CSV content
 */
export function exportStockSummaryToCSV(products = []) {
  const headers = [
    'SKU',
    'Article No',
    'Design No',
    'Fabric Type',
    'Color/Shade',
    'Kora/Finished',
    'Unit',
    'Stock Qty',
    'Thaan Length',
    'Total Meters',
    'Cost Price',
    'Stock Value',
  ];

  const rows = products.map(product => {
    const unit = String(product.unit || '').toLowerCase();
    const stock = Number(product.stock || 0);
    const thaanLength = Number(product.domain_data?.thaanlength || 40);
    const totalMeters = unit === 'thaan' ? stock * thaanLength : stock;

    return [
      product.sku || '',
      product.domain_data?.articleno || '',
      product.domain_data?.designno || '',
      product.domain_data?.fabrictype || '',
      product.domain_data?.colorshade || '',
      product.domain_data?.korafinished || '',
      product.unit || '',
      stock,
      thaanLength,
      totalMeters.toFixed(2),
      (product.cost_price || 0).toFixed(2),
      (stock * (product.cost_price || 0)).toFixed(2),
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Convert thaans count to total meters
 */
export function convertThaanToMeters(thaans = 0, thaanLength = 40) {
  return Number(thaans || 0) * Number(thaanLength || 40);
}

/**
 * Convert meters to number of suits
 */
export function convertMetersToSuits(meters = 0, suitCutting = 2.25) {
  return suitCutting > 0 ? Math.floor(Number(meters || 0) / suitCutting) : 0;
}

/**
 * Calculate credit limit utilization percentage
 */
export function calculateCreditUtilization(outstanding = 0, creditLimit = 0) {
  const limit = Number(creditLimit || 0);
  const bal = Number(outstanding || 0);
  if (limit <= 0) return 0;
  return Math.round((bal / limit) * 100);
}

/**
 * Check if customer outstanding balance exceeds credit limit
 */
export function isCreditLimitExceeded(outstanding = 0, creditLimit = 0) {
  const limit = Number(creditLimit || 0);
  const bal = Number(outstanding || 0);
  return limit > 0 && bal > limit;
}

/**
 * Get detailed credit status object
 */
export function getCreditStatus(customer = {}) {
  const outstanding = Number(customer?.outstanding_balance || 0);
  const creditLimit = Number(customer?.credit_limit || 0);
  const utilization = calculateCreditUtilization(outstanding, creditLimit);
  const isExceeded = isCreditLimitExceeded(outstanding, creditLimit);

  return {
    outstanding,
    creditLimit,
    utilization,
    isExceeded,
    remainingCredit: creditLimit > 0 ? Math.max(0, creditLimit - outstanding) : null,
    status: isExceeded ? 'exceeded' : utilization > 80 ? 'warning' : 'ok',
  };
}

/**
 * Format currency in Pakistani style (e.g., PKR 150,000)
 */
export function formatPakistaniCurrency(amount = 0) {
  return `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;
}

/**
 * Get seasonal restock recommendations alias
 */
export function getSeasonalRecommendations(products = [], currentMonth = null) {
  return getSeasonalRestockRecommendations(products, currentMonth);
}

/**
 * Get default broker commission rate
 */
export function getBrokerCommissionRate(partyType = 'wholesale') {
  return 1.5;
}
