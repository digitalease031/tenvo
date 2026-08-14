/**
 * Material Rate Intelligence - City-Specific Rates & Trend Analysis
 * 
 * Provides city-wise material pricing, rate comparison, and budget impact analysis
 * Based on Aug 2026 market data from brickpakistan.com, cementrate.pk, nuroa.com.pk
 */

// ── City-Wise Brick Rates (Per 1,000 Pieces) ────────────────────────────────
export const BRICK_RATES_BY_CITY_2026 = {
  lahore: { 
    first_class: { min: 15000, max: 19000, avg: 17000 },
    second_class: { min: 12000, max: 16000, avg: 14000 },
    third_class: { min: 9000, max: 13000, avg: 11000 }
  },
  karachi: { 
    first_class: { min: 16000, max: 20000, avg: 18000 },
    second_class: { min: 13000, max: 17000, avg: 15000 },
    third_class: { min: 10000, max: 14000, avg: 12000 }
  },
  islamabad: { 
    first_class: { min: 17000, max: 21000, avg: 19000 },
    second_class: { min: 14000, max: 18000, avg: 16000 },
    third_class: { min: 11000, max: 15000, avg: 13000 }
  },
  rawalpindi: { 
    first_class: { min: 16500, max: 20500, avg: 18500 },
    second_class: { min: 13500, max: 17500, avg: 15500 },
    third_class: { min: 10500, max: 14500, avg: 12500 }
  },
  faisalabad: { 
    first_class: { min: 14500, max: 18500, avg: 16500 },
    second_class: { min: 11500, max: 15500, avg: 13500 },
    third_class: { min: 8500, max: 12500, avg: 10500 }
  },
  multan: { 
    first_class: { min: 14000, max: 18000, avg: 16000 },
    second_class: { min: 11000, max: 15000, avg: 13000 },
    third_class: { min: 8000, max: 12000, avg: 10000 }
  },
  peshawar: { 
    first_class: { min: 15500, max: 19500, avg: 17500 },
    second_class: { min: 12500, max: 16500, avg: 14500 },
    third_class: { min: 9500, max: 13500, avg: 11500 }
  },
  quetta: { 
    first_class: { min: 16000, max: 20000, avg: 18000 },
    second_class: { min: 13000, max: 17000, avg: 15000 },
    third_class: { min: 10000, max: 14000, avg: 12000 }
  }
};

// ── City-Wise Sand & Aggregate Rates (Per Cubic Feet) ────────────────────────
export const SAND_AGGREGATE_RATES_BY_CITY_2026 = {
  lahore: {
    sand: { min: 65, max: 95, avg: 80 },
    crush: { min: 120, max: 140, avg: 130 }
  },
  karachi: {
    sand: { min: 70, max: 100, avg: 85 },
    crush: { min: 115, max: 135, avg: 125 }
  },
  islamabad: {
    sand: { min: 75, max: 105, avg: 90 },
    crush: { min: 125, max: 145, avg: 135 }
  },
  rawalpindi: {
    sand: { min: 72, max: 102, avg: 87 },
    crush: { min: 122, max: 142, avg: 132 }
  },
  faisalabad: {
    sand: { min: 60, max: 90, avg: 75 },
    crush: { min: 115, max: 135, avg: 125 }
  },
  multan: {
    sand: { min: 58, max: 88, avg: 73 },
    crush: { min: 112, max: 132, avg: 122 }
  },
  peshawar: {
    sand: { min: 68, max: 98, avg: 83 },
    crush: { min: 118, max: 138, avg: 128 }
  },
  quetta: {
    sand: { min: 70, max: 100, avg: 85 },
    crush: { min: 120, max: 140, avg: 130 }
  }
};

// ── Major Cement Brands (PKR per 50kg Bag - August 2026) ─────────────────────
export const CEMENT_BRANDS_2026 = {
  'Lucky Cement': { rate: 1450, market_share: 'High', quality: 'Premium' },
  'Maple Leaf': { rate: 1430, market_share: 'High', quality: 'Premium' },
  'Bestway': { rate: 1440, market_share: 'High', quality: 'Premium' },
  'DG Khan': { rate: 1420, market_share: 'High', quality: 'Good' },
  'Fauji': { rate: 1460, market_share: 'Medium', quality: 'Premium' },
  'Askari': { rate: 1450, market_share: 'Medium', quality: 'Good' },
  'Cherat': { rate: 1470, market_share: 'Low', quality: 'Premium' },
  'Flying': { rate: 1400, market_share: 'Low', quality: 'Good' },
  'Kohat': { rate: 1390, market_share: 'Low', quality: 'Budget' },
  'Pioneer': { rate: 1420, market_share: 'Low', quality: 'Good' }
};

// ── Major Steel Brands (PKR per kg - August 2026) ─────────────────────────────
export const STEEL_BRANDS_2026 = {
  'Amreli': { rate_per_kg: 268, grade: 'Grade 60', quality: 'Premium' },
  'Mughal': { rate_per_kg: 265, grade: 'Grade 60', quality: 'Premium' },
  'Ittefaq': { rate_per_kg: 262, grade: 'Grade 60', quality: 'Good' },
  'KSM': { rate_per_kg: 266, grade: 'Grade 60', quality: 'Premium' },
  'Agha': { rate_per_kg: 265, grade: 'Grade 60', quality: 'Good' }
};

/**
 * Get brick rate for a specific city and quality grade
 * @param {string} city - City name (lowercase)
 * @param {'first_class'|'second_class'|'third_class'} grade - Quality grade
 * @returns {{ min: number, max: number, avg: number, per1000: number }}
 */
export function getBrickRate(city, grade = 'first_class') {
  const cityRates = BRICK_RATES_BY_CITY_2026[city.toLowerCase()];
  if (!cityRates) {
    // Return national average if city not found
    return { min: 15000, max: 19000, avg: 17500, per1000: 17500 };
  }
  const gradeRates = cityRates[grade] || cityRates.first_class;
  return { ...gradeRates, per1000: gradeRates.avg };
}

/**
 * Get sand/aggregate rate for a specific city
 * @param {string} city - City name (lowercase)
 * @param {'sand'|'crush'} material - Material type
 * @returns {{ min: number, max: number, avg: number, perCft: number }}
 */
export function getSandAggregateRate(city, material = 'sand') {
  const cityRates = SAND_AGGREGATE_RATES_BY_CITY_2026[city.toLowerCase()];
  if (!cityRates) {
    // Return national average
    const national = material === 'sand' 
      ? { min: 65, max: 95, avg: 85 }
      : { min: 115, max: 145, avg: 130 };
    return { ...national, perCft: national.avg };
  }
  const materialRates = cityRates[material];
  return { ...materialRates, perCft: materialRates.avg };
}

/**
 * Calculate budget impact of rate variance
 * @param {{
 *   materialName: string,
 *   estimatedRate: number,
 *   currentRate: number,
 *   quantity: number,
 *   unit: string
 * }} params
 */
export function calculateBudgetImpact({ materialName, estimatedRate, currentRate, quantity, unit }) {
  const estimatedCost = estimatedRate * quantity;
  const currentCost = currentRate * quantity;
  const costVariance = currentCost - estimatedCost;
  const variancePct = estimatedCost > 0 ? (costVariance / estimatedCost) * 100 : 0;
  
  let severity = 'OK';
  let recommendation = '';
  
  if (variancePct > 20) {
    severity = 'CRITICAL';
    recommendation = 'Material cost significantly higher than estimate. Consider: (1) Raise price escalation claim under PEC Clause 70, (2) Negotiate with client for rate adjustment, (3) Explore alternative suppliers.';
  } else if (variancePct > 10) {
    severity = 'WARNING';
    recommendation = 'Material cost moderately higher. Consider: (1) Lock in current rates with forward purchase, (2) Prepare escalation notice to client, (3) Review alternative suppliers.';
  } else if (variancePct < -10) {
    severity = 'FAVORABLE';
    recommendation = 'Market rate lower than estimated. Consider: (1) Bulk purchase to lock rates, (2) Verify quality standards before procurement, (3) Review savings for profit optimization.';
  } else {
    severity = 'ON_TRACK';
    recommendation = 'Rate variance within acceptable range. Proceed with procurement as planned.';
  }
  
  return {
    materialName,
    unit,
    quantity,
    estimatedRate,
    currentRate,
    estimatedCost: Math.round(estimatedCost),
    currentCost: Math.round(currentCost),
    costVariance: Math.round(costVariance),
    variancePct: +variancePct.toFixed(2),
    severity,
    recommendation,
    actionRequired: severity === 'CRITICAL' || severity === 'WARNING'
  };
}

/**
 * Compare rates across multiple cities for procurement planning
 * @param {'bricks'|'sand'|'crush'} material - Material type
 * @param {number} quantity - Quantity needed
 * @param {string[]} cities - Cities to compare (optional, defaults to all major cities)
 */
export function compareCityRates(material, quantity, cities = null) {
  const citiesToCompare = cities || ['lahore', 'karachi', 'islamabad', 'rawalpindi', 'faisalabad', 'multan', 'peshawar', 'quetta'];
  
  const comparisons = citiesToCompare.map(city => {
    let rate, unit;
    
    if (material === 'bricks') {
      const brickRate = getBrickRate(city, 'first_class');
      rate = brickRate.avg;
      unit = 'Per 1000';
    } else if (material === 'sand') {
      const sandRate = getSandAggregateRate(city, 'sand');
      rate = sandRate.avg;
      unit = 'Cu.Ft';
    } else if (material === 'crush') {
      const crushRate = getSandAggregateRate(city, 'crush');
      rate = crushRate.avg;
      unit = 'Cu.Ft';
    }
    
    const totalCost = rate * quantity;
    
    return {
      city: city.charAt(0).toUpperCase() + city.slice(1),
      rate,
      unit,
      totalCost: Math.round(totalCost)
    };
  });
  
  // Sort by total cost (cheapest first)
  comparisons.sort((a, b) => a.totalCost - b.totalCost);
  
  const cheapest = comparisons[0];
  const mostExpensive = comparisons[comparisons.length - 1];
  const potentialSavings = mostExpensive.totalCost - cheapest.totalCost;
  
  return {
    material,
    quantity,
    unit: comparisons[0].unit,
    comparisons,
    analysis: {
      cheapestCity: cheapest.city,
      cheapestRate: cheapest.rate,
      cheapestCost: cheapest.totalCost,
      mostExpensiveCity: mostExpensive.city,
      mostExpensiveRate: mostExpensive.rate,
      mostExpensiveCost: mostExpensive.totalCost,
      potentialSavings,
      savingsPct: mostExpensive.totalCost > 0 
        ? +((potentialSavings / mostExpensive.totalCost) * 100).toFixed(1)
        : 0,
      recommendation: potentialSavings > 50000
        ? `Significant savings (PKR ${potentialSavings.toLocaleString()}) possible by sourcing from ${cheapest.city}. Consider transportation costs.`
        : `Minimal cost variation across cities. Prioritize local suppliers for reduced transportation costs.`
    }
  };
}

/**
 * Calculate cement requirement for concrete grade
 * @param {'C15'|'C20'|'C25'|'C30'|'C35'|'C40'} grade - Concrete grade
 * @param {number} volumeCuM - Volume in cubic meters
 * @returns {{ bags: number, cost: number, cementRate: number }}
 */
export function calculateCementRequirement(grade, volumeCuM) {
  // Cement bags per Cu.M for different grades
  const bagsPerCuM = {
    'C15': 6.5,   // 2000 PSI
    'C20': 7.5,   // 2500 PSI
    'C25': 8.5,   // 3000 PSI
    'C30': 9.5,   // 4000 PSI
    'C35': 10.5,  // 5000 PSI
    'C40': 11.5   // 6000 PSI
  };
  
  const bags = Math.ceil((bagsPerCuM[grade] || 8.5) * volumeCuM);
  const avgCementRate = 1450; // PKR per 50kg bag (market average)
  const cost = bags * avgCementRate;
  
  return {
    grade,
    volumeCuM,
    bagsRequired: bags,
    bagsPerCuM: bagsPerCuM[grade] || 8.5,
    cementRate: avgCementRate,
    totalCost: Math.round(cost),
    brands: Object.entries(CEMENT_BRANDS_2026).map(([brand, data]) => ({
      brand,
      rate: data.rate,
      cost: Math.round(bags * data.rate),
      quality: data.quality
    })).sort((a, b) => a.cost - b.cost)
  };
}

/**
 * Calculate steel requirement for RCC work
 * @param {number} concreteCuM - Concrete volume in cubic meters
 * @param {'light'|'medium'|'heavy'} reinforcement - Reinforcement density
 * @returns {{ steelTon: number, cost: number, ratePerKg: number }}
 */
export function calculateSteelRequirement(concreteCuM, reinforcement = 'medium') {
  // Steel quantity per Cu.M of concrete
  const steelPerCuM = {
    'light': 80,    // kg/Cu.M (slabs, simple beams)
    'medium': 120,  // kg/Cu.M (typical RCC)
    'heavy': 180    // kg/Cu.M (columns, heavy beams)
  };
  
  const steelKg = (steelPerCuM[reinforcement] || 120) * concreteCuM;
  const steelTon = steelKg / 1000;
  const avgSteelRate = 265; // PKR per kg (Grade 60 average)
  const cost = steelKg * avgSteelRate;
  
  return {
    concreteCuM,
    reinforcement,
    steelKg: Math.round(steelKg),
    steelTon: +steelTon.toFixed(2),
    ratePerKg: avgSteelRate,
    ratePerTon: avgSteelRate * 1000,
    totalCost: Math.round(cost),
    brands: Object.entries(STEEL_BRANDS_2026).map(([brand, data]) => ({
      brand,
      ratePerKg: data.rate_per_kg,
      cost: Math.round(steelKg * data.rate_per_kg),
      quality: data.quality
    })).sort((a, b) => a.cost - b.cost)
  };
}

/**
 * Calculate transportation cost impact on material procurement
 * @param {number} materialCost - Base material cost
 * @param {number} distanceKm - Distance from supplier to site
 * @param {number} quantity - Quantity being transported
 * @param {'cement'|'steel'|'sand'|'bricks'} materialType - Material type
 */
export function calculateTransportationImpact({ materialCost, distanceKm, quantity, materialType }) {
  // Transportation cost per km for different materials
  const transportCostPerKm = {
    'cement': 8,     // PKR per bag per km
    'steel': 50,     // PKR per ton per km
    'sand': 5,       // PKR per Cu.Ft per km
    'bricks': 12     // PKR per 1000 pieces per km
  };
  
  const costPerKm = transportCostPerKm[materialType] || 10;
  const transportCost = costPerKm * distanceKm * quantity;
  const totalCost = materialCost + transportCost;
  const transportPct = materialCost > 0 ? (transportCost / materialCost) * 100 : 0;
  
  let recommendation = '';
  if (transportPct > 30) {
    recommendation = 'Transportation cost is >30% of material cost. Consider sourcing from closer suppliers or bulk procurement to reduce trips.';
  } else if (transportPct > 15) {
    recommendation = 'Transportation adds moderate cost. Evaluate bulk delivery options to optimize.';
  } else {
    recommendation = 'Transportation cost is reasonable. Current supplier distance acceptable.';
  }
  
  return {
    materialType,
    quantity,
    distanceKm,
    materialCost: Math.round(materialCost),
    transportCost: Math.round(transportCost),
    totalCost: Math.round(totalCost),
    transportPct: +transportPct.toFixed(1),
    costPerKm,
    recommendation
  };
}

export default {
  getBrickRate,
  getSandAggregateRate,
  calculateBudgetImpact,
  compareCityRates,
  calculateCementRequirement,
  calculateSteelRequirement,
  calculateTransportationImpact,
  BRICK_RATES_BY_CITY_2026,
  SAND_AGGREGATE_RATES_BY_CITY_2026,
  CEMENT_BRANDS_2026,
  STEEL_BRANDS_2026
};
