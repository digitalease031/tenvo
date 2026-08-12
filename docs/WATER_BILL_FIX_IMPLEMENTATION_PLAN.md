# Water Supply Monthly Bill - Implementation Plan

## Problem Statement

The water supply monthly bill currently shows confusing product columns that separate "Refill" and "First Fill" as different line items in the daily delivery grid. This makes it hard to understand how many bottles were actually delivered each day.

**Current Format (Incorrect):**
```
Day Product1 Product2 Product3
01  1        0        0        ← Which is refill? Which is new bottle?
02  0        1        0
```

**Target Format (Correct):**
```
Day Y/N  Del  Rec  Bal
01  Y    1    1    1     ← Clear: 1 bottle delivered, 1 empty collected
02  N    0    0    1     ← No delivery today
```

## Core Issue

Water delivery has TWO types of 19L transactions:
1. **Refill**: Customer returns empty bottle, gets full bottle (exchange)
2. **First Fill**: Customer gets new bottle + first fill (keeps the new bottle)

BUT in the daily tracking grid, we should show:
- **Del**: Total bottles delivered (refill + first fill combined)
- **Rec**: Total empties collected (from refills only)
- **Bal**: Running balance (bottles customer is holding)

The product breakdown (refill vs first fill) should only appear in the **Product Totals** section at the bottom of the bill.

## Implementation Steps

### Step 1: Add Size Group Aggregation Helper

**File**: `lib/storefront/waterShopHisab.js`

Add this function after `computeWaterSaleAmount`:

```javascript
/**
 * Aggregate daily water deliveries by bottle size for monthly bill printing.
 * Merges first-fill + refill + new bottle products into single size-group totals.
 * 
 * Example: 19L Refill (2) + 19L First Fill (1) → 19L: { del: 3, rec: 2 }
 * 
 * @param {Array<{ productId: string, quantity: number, receivedQuantity: number }>} lines
 * @param {Array<{ id: string, sizeGroup: string|null }>} products
 * @returns {Map<string, { del: number, rec: number }>} Size group → totals
 */
export function aggregateWaterLinesBySizeGroup(lines = [], products = []) {
  const productSizeMap = new Map(
    products.map((p) => [String(p.id), p.sizeGroup || '19l'])
  );

  const totals = new Map();

  for (const line of lines || []) {
    const pid = String(line.product_id || line.productId);
    const sizeGroup = productSizeMap.get(pid) || '19l'; // Default to 19L if unknown
    
    if (!totals.has(sizeGroup)) {
      totals.set(sizeGroup, { del: 0, rec: 0 });
    }
    
    const group = totals.get(sizeGroup);
    group.del += Number(line.quantity) || 0;
    group.rec += Number(line.received_quantity || line.receivedQuantity) || 0;
  }

  return totals;
}
```

### Step 2: Update Monthly Bill Grid Builder

**File**: `lib/storefront/waterShopHisab.js`

Find the `buildWaterMonthlyBillGrid` function (currently reuses milk helper). We need to create a water-specific version:

```javascript
/**
 * Build water-specific monthly bill grid with Day/Y-N/Del/Rec/Bal columns.
 * Consolidates all bottle sizes into single delivery totals per day.
 * 
 * @param {object} args
 * @param {Array<{ delivery_date, lines }>} args.stops - Daily delivery stops
 * @param {Array<{ id, sizeGroup }>} args.products - Product catalog
 * @param {string} args.startIso - Period start date (YYYY-MM-DD)
 * @param {string} args.endIso - Period end date (YYYY-MM-DD)
 * @param {number} args.openingBalance - Bottle balance at period start
 * @returns {{ days: Array, activeDays: number, closingBalance: number }}
 */
export function buildWaterMonthlyBillGrid({
  stops = [],
  products = [],
  startIso = '',
  endIso = '',
  openingBalance = 0,
}) {
  const start = new Date(startIso || new Date());
  const end = new Date(endIso || new Date());
  
  // Build map of date → aggregated deliveries
  const dayMap = new Map();
  
  for (const stop of stops || []) {
    const dateKey = toWaterHisabDateKey(stop.delivery_date);
    const sizeGroups = aggregateWaterLinesBySizeGroup(stop.lines || [], products);
    
    // Sum across all size groups (19L + 12L + 5L etc.)
    let dayDel = 0;
    let dayRec = 0;
    for (const [_, totals] of sizeGroups) {
      dayDel += totals.del;
      dayRec += totals.rec;
    }
    
    dayMap.set(dateKey, { del: dayDel, rec: dayRec });
  }
  
  // Generate day-by-day grid with running balance
  const days = [];
  let runningBalance = Number(openingBalance) || 0;
  let activeDays = 0;
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = toWaterHisabDateKey(d);
    const dayData = dayMap.get(dateKey) || { del: 0, rec: 0 };
    
    const dayNum = d.getDate();
    const hasActivity = dayData.del > 0 || dayData.rec > 0;
    
    if (hasActivity) activeDays += 1;
    
    // Update running balance: BAL = previous + DEL - REC
    runningBalance = Math.round((runningBalance + dayData.del - dayData.rec) * 1000) / 1000;
    
    days.push({
      dayNum,
      dateKey,
      yesNo: hasActivity ? 'Y' : 'N',
      del: dayData.del,
      rec: dayData.rec,
      balance: runningBalance,
    });
  }
  
  return {
    days,
    activeDays,
    closingBalance: runningBalance,
  };
}
```

### Step 3: Update Bill Line Formatters

**File**: `lib/storefront/waterShopHisab.js`

Add new formatting functions for the consolidated view:

```javascript
/**
 * Format header line for water monthly bill grid.
 * Returns: "Day Y/N  Del  Rec  Bal"
 */
export function formatWaterMonthlyBillHeaderLine() {
  const day = pad('Day', 3);
  const yn = pad('Y/N', 3);
  const del = pad('Del', 4, 'right');
  const rec = pad('Rec', 4, 'right');
  const bal = pad('Bal', 4, 'right');
  return `${day} ${yn}  ${del}  ${rec}  ${bal}`;
}

/**
 * Format single day line for water monthly bill.
 * @param {{ dayNum: number, yesNo: string, del: number, rec: number, balance: number }} day
 * @returns {string} "01  Y    1    1    1"
 */
export function formatWaterMonthlyBillDayLine(day) {
  const dayNum = pad(String(day.dayNum || '?'), 2, 'right');
  const yn = pad(day.yesNo || 'N', 3);
  const del = pad(String(day.del || 0), 4, 'right');
  const rec = pad(String(day.rec || 0), 4, 'right');
  const bal = pad(String(day.balance || 0), 4, 'right');
  return `${dayNum}  ${yn}  ${del}  ${rec}  ${bal}`;
}

// Helper function for column padding (if not already defined)
function pad(text, width, align = 'left') {
  const str = String(text || '').slice(0, width);
  if (align === 'right') return str.padStart(width, ' ');
  if (align === 'center') {
    const leftPad = Math.floor((width - str.length) / 2);
    return str.padStart(leftPad + str.length, ' ').padEnd(width, ' ');
  }
  return str.padEnd(width, ' ');
}
```

### Step 4: Update Thermal Bill Print Model

**File**: `lib/print/waterHisabThermalBill.js`

Update `buildWaterPeriodPrintModel` to use the new grid builder:

```javascript
export function buildWaterPeriodPrintModel(args = {}) {
  const pack = getBusinessRegionalPack(args.business);
  const { kind, label } = resolvePeriodMeta(args.period, args.periodLabel);
  
  // ... existing code ...
  
  // Build the water-specific grid with consolidated bottle columns
  const waterGrid = buildWaterMonthlyBillGrid({
    stops: args.stops || [],
    products: args.products || [], // Must include sizeGroup metadata
    startIso: args.startIso || startIso,
    endIso: args.endIso || endIso,
    openingBalance: args.openingBalance || 0,
  });

  // Format header and day lines
  const headerLine = formatWaterMonthlyBillHeaderLine();
  const dayLines = (waterGrid.days || []).map((day) => 
    formatWaterMonthlyBillDayLine(day)
  );

  // ... rest of function returns model with waterGrid, headerLine, dayLines ...
}
```

### Step 5: Update Period Summary Action

**File**: `lib/actions/standard/waterHisab.js`

Update `getWaterHisabPeriodSummaryAction` to pass products with sizeGroup metadata:

```javascript
export async function getWaterHisabPeriodSummaryAction({ businessId, category, period }) {
  // ... existing code ...
  
  const [products, stops] = await Promise.all([
    prismaBase.products.findMany({
      where: { business_id: businessId, is_deleted: false },
      select: {
        id: true,
        name: true,
        unit: true,
        price: true,
        category: true,
        domain_data: true, // Contains bottle size hints
      },
    }),
    prismaBase.water_delivery_stops.findMany({
      where: {
        business_id: businessId,
        delivery_date: { gte: startDate, lte: endDate },
        customer_id: customerId, // If filtering by customer
        is_deleted: false,
      },
      include: { lines: true },
    }),
  ]);
  
  // Resolve size groups for each product
  const productsWithSizeGroup = products.map((p) => ({
    ...p,
    sizeGroup: resolveWaterHisabProductSizeGroup(
      `${p.name} ${p.category} ${JSON.stringify(p.domain_data || {})}`
    ),
  }));
  
  // Calculate opening balance (reverse current month's activity from stored balance)
  const customerPrefs = readWaterCustomerPrefs(customer);
  const currentBalance = customerPrefs.bottleBalance || 0;
  let periodDel = 0;
  let periodRec = 0;
  for (const stop of stops) {
    for (const line of stop.lines || []) {
      periodDel += Number(line.quantity) || 0;
      periodRec += Number(line.received_quantity) || 0;
    }
  }
  const openingBalance = currentBalance - periodDel + periodRec;
  
  // Build grid for printing
  const breakdown = {
    stops,
    products: productsWithSizeGroup,
    startIso,
    endIso,
    openingBalance,
  };
  
  // ... return result with breakdown ...
}
```

### Step 6: Update Product Totals Section

The product totals section should still show the breakdown by product type, but with clearer labels:

**In `buildWaterPeriodPrintModel`:**

```javascript
// Product totals section (detailed breakdown)
const totals = [];
for (const p of productsWithSizeGroup) {
  let qty = 0;
  let amount = 0;
  
  for (const stop of stops) {
    for (const line of stop.lines || []) {
      if (String(line.product_id) === String(p.id)) {
        qty += Number(line.quantity) || 0;
        const rate = Number(line.unit_price_snapshot) || Number(p.price) || 0;
        amount += qty * rate;
      }
    }
  }
  
  if (qty > 0) {
    totals.push({
      label: shortWaterHisabProductLabel(p),
      qty,
      unit: p.unit || 'pcs',
      amount,
    });
  }
}
```

## Testing Checklist

### Unit Tests
- [ ] `aggregateWaterLinesBySizeGroup` correctly sums 19L refill + first fill
- [ ] `buildWaterMonthlyBillGrid` calculates running balance correctly
- [ ] `formatWaterMonthlyBillDayLine` produces correct column widths

### Integration Tests
- [ ] Monthly bill with mixed 19L products shows consolidated Del/Rec
- [ ] Product totals section shows individual SKU breakdown
- [ ] Opening balance calculation is correct (reverse current month activity)
- [ ] Closing balance matches customer's current bottle balance
- [ ] 58mm thermal receipt prints with proper column alignment

### Manual QA
1. Create test customer with opening balance = 5 bottles
2. Add daily stops:
   - Day 1: Deliver 2× 19L Refill, Collect 2 empties
   - Day 2: Deliver 1× 19L First Fill (new customer bottle)
   - Day 3: No delivery
   - Day 4: Deliver 1× 19L Refill, Collect 1 empty
3. Generate monthly bill
4. Verify output:
   ```
   Day Y/N  Del  Rec  Bal
   01  Y    2    2    5
   02  Y    1    0    6   ← Got new bottle, kept it
   03  N    0    0    6
   04  Y    1    1    6
   
   Product totals:
   19L Refill × 3         Rs 450.00
   19L First Fill × 1     Rs 950.00
   
   Opening BAL: 5
   Closing BAL: 6   ← Correct (5 + 4 delivered - 3 collected)
   ```

## Rollout Plan

### Phase 1: Backend Changes (Low Risk)
1. Add helper functions to `waterShopHisab.js`
2. Add unit tests
3. Deploy to staging
4. Test with sample data

### Phase 2: Print Format Update (Medium Risk)
1. Update thermal bill formatters
2. Test on 58mm printer
3. Verify PDF export
4. Deploy to production with feature flag

### Phase 3: UI Polish (Low Risk)
1. Update monthly bill preview in hub
2. Add tooltip explaining Del/Rec/Bal columns
3. Update help documentation

### Rollback Plan
If issues occur:
- Revert `buildWaterPeriodPrintModel` to use old milk-style columns
- Keep new helper functions (backwards compatible)
- Fix issues in development, redeploy

## Files Modified Summary

1. **`lib/storefront/waterShopHisab.js`** (Core logic)
   - Add `aggregateWaterLinesBySizeGroup()`
   - Add `buildWaterMonthlyBillGrid()`
   - Add `formatWaterMonthlyBillHeaderLine()`
   - Add `formatWaterMonthlyBillDayLine()`

2. **`lib/print/waterHisabThermalBill.js`** (Print formatting)
   - Update `buildWaterPeriodPrintModel()` to use new grid
   - Update HTML/PDF formatters for new column layout

3. **`lib/actions/standard/waterHisab.js`** (Server actions)
   - Update `getWaterHisabPeriodSummaryAction()` to include sizeGroup metadata
   - Update `getWaterHisabBillPrintAction()` to pass products correctly

4. **Test files** (New)
   - `lib/storefront/__tests__/waterShopHisab.test.js`
   - Test aggregation, balance calculations, formatting

## Estimated Effort
- Implementation: 4-6 hours
- Testing: 2-3 hours
- Documentation: 1 hour
- **Total: 1 working day**

## Success Criteria
✅ Monthly bills show Day/Y-N/Del/Rec/Bal columns only
✅ Product breakdown appears in totals section
✅ Balance calculations are mathematically correct
✅ 58mm thermal receipts print with proper alignment
✅ Existing daily route sheet (detailed product columns) remains unchanged
✅ No regression in milk hisab (separate domain)
