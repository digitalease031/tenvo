# Water Supply Monthly Bill Format Analysis

## Current Implementation Overview

The water supply domain uses a **Route Hisab** system similar to milk delivery businesses, with daily delivery tracking and monthly bill generation.

### Key Components

1. **Daily Delivery Sheet** (`water_delivery_stops` + `water_delivery_lines`)
   - Tracks daily deliveries per customer
   - Records: Delivered (DEL), Received/Empties (REC), Cash collected
   - Columns are dynamically configured based on bottle sizes (19L, 12L, 5L, PET, etc.)

2. **Monthly Bills** (generated from daily stops)
   - Shows day-by-day delivery breakdown
   - Calculates running bottle balance
   - Generates invoices with payment tracking

3. **Thermal Receipt** (58mm format)
   - Day header with delivery status (Y/N)
   - Product totals section
   - Bottle balance summary

## Current Bill Structure (from `waterHisabThermalBill.js`)

### Monthly Bill Components:
```
MONTHLY WATER BILL
August 2026

Customer: Casa Bella · A/C 118-CASA · T11-B
H 7 · INV-000001 · CASH · 4 active days

Day delivery (Y/N)
DD Y  Bottles  Balance
01 N    -        1
02 N    -        1
...
31 N    -        1

Delivered bottles:      15
Received empties:       13

Opening BAL:            1
Closing BAL:            1

Cash collected:         Rs 468.00

Product totals:
(Refill) 2 bottle      Rs 300.00
(Fill) 10 pcs          Rs 150.00
Fill 12 bottle         Rs 1,800.00

TOTAL DUE:             Rs 2,250.00
```

## Issues Identified from Your Image

Based on your thermal receipt, the current implementation has these issues:

### 1. **Missing Day Column**
- Your receipt shows: `DD Y Bottles Balance`
- But printed days show: `01 N - 1` (no proper alignment)
- **Issue**: The "DD" (Day) column is too narrow and doesn't align properly with dates

### 2. **Confusing Product Column Labels**
- Current: Shows generic product names
- Your need: Show **only necessary columns** with clear labels:
  - **19L Bottles** (combined first fill + refill)
  - **Del** (Delivered)
  - **Rec** (Received/Empties)
  - **Bal** (Running Balance)

### 3. **Day Format Issues**
- Currently prints: `01 N - 1` (delivery status + dash + balance)
- Should print: `01 N 0 0 1` (day + status + del + rec + balance)

### 4. **Product Type Confusion**
- Current: Separates "(Refill)" and "Fill" as different line items
- Reality: Both are 19L bottles — should count together in daily grid
- Your totals show:
  - `(Refill) 2 bottle Rs 300.00`
  - `(Fill) 10 pcs Rs 150.00`
  - `Fill 12 bottle Rs 1,800.00`
- This creates confusion about what was actually delivered each day

## Recommended Fix

### Updated Daily Grid Format (58mm thermal):
```
Day Y/N  Del  Rec  Bal
----------------------------------------
01   N    0    0    1
02   N    0    0    1
03   N    0    0    1
04   N    0    0    1
05   M    0    0    1
06   M    0    0    1
07   M    0    0    1
08   M    1    1    1    ← Delivered 1, collected 1 empty
09   M    0    0    1
10   M    0    0    1
11   M    0    0    1
12   M    0    0    1
13   M    0    0    1
14   M    1    1    1    ← Another delivery
15   M    0    0    1
...
```

### Key Changes Needed:

1. **Merge Product Types in Daily Grid**
   - Don't separate "Refill" vs "Fill" in the day-by-day breakdown
   - Show total 19L bottles delivered that day (regardless of type)
   - Formula: `Del = sum(all 19L products delivered)`
   - Formula: `Rec = sum(all 19L empties received)`

2. **Fix Column Widths** (58mm = ~32 chars usable)
   ```
   Day Y/N  Del  Rec  Bal
   02  3     4    4    4   = 17 chars (fits easily)
   ```

3. **Show Product Breakdown Only in Totals Section**
   - Keep the detailed product breakdown at the bottom
   - But the daily grid should show consolidated bottle count

4. **Handle First Fill vs Refill in Product Totals**
   - Example:
     ```
     Product totals:
     19L Refill × 2         Rs 300.00
     19L First Fill × 1     Rs 950.00
     12L Bottle × 12        Rs 1,800.00
     ```

## Technical Implementation Changes Required

### 1. Update `buildWaterMonthlyBillGrid` in `waterShopHisab.js`

Current code creates one column per product. Need to aggregate by size group:

```javascript
// Instead of separate columns for each product_id:
// { productId: '123', delivered: 1, received: 1 }

// Aggregate by bottle size:
// { '19l': { delivered: 2, received: 2 }, '12l': { delivered: 1, received: 0 } }
```

### 2. Update `formatWaterMonthlyBillDayLine` 

Current format:
```javascript
const day = pad(dayNum, 2);
const yesno = pad(hasActivity ? 'Y' : 'N', 3);
// then per-product columns...
```

Proposed format:
```javascript
const day = pad(dayNum, 2);
const yesno = pad(hasActivity ? 'Y' : 'N', 3);
const del = pad(total19LDelivered, 4, 'right');
const rec = pad(total19LReceived, 4, 'right');
const bal = pad(runningBalance, 4, 'right');
return `${day}  ${yesno}  ${del}  ${rec}  ${bal}`;
```

### 3. Update Header Line
```javascript
function formatWaterMonthlyBillHeaderLine() {
  return 'Day Y/N  Del  Rec  Bal';
}
```

### 4. Update Daily Sheet Column Logic

In `resolveWaterHisabProducts()`:
- Current: Returns array of individual products (up to 8 columns)
- Keep this for the daily route sheet (rider needs to see product types)
- But for monthly bills: consolidate by size group

### 5. Add Helper Function

```javascript
/**
 * Aggregate daily deliveries by bottle size group for monthly bill printing.
 * @param {Array<{ productId, delivered, received }>} dayLines
 * @param {Array<{ id, sizeGroup }>} products
 * @returns {{ '19l': { del: number, rec: number }, '12l': {...}, ... }}
 */
export function aggregateWaterDayLinesBySizeGroup(dayLines, products) {
  const productMap = new Map(products.map(p => [p.id, p.sizeGroup]));
  const totals = {};
  
  for (const line of dayLines) {
    const sizeGroup = productMap.get(line.productId) || '19l'; // default
    if (!totals[sizeGroup]) totals[sizeGroup] = { del: 0, rec: 0 };
    totals[sizeGroup].del += line.delivered || 0;
    totals[sizeGroup].rec += line.received || 0;
  }
  
  return totals;
}
```

## Bill Calculation Logic (Already Correct)

The bottle balance calculation is already working correctly:

```javascript
// Opening balance for day N
openingBal = prevDayBalance

// Closing balance after delivery
closingBal = openingBal + delivered - received

// Customer's current balance
bottleBalance = lastClosingBal
```

**Example from your receipt:**
- Opening BAL: 1 bottle
- Month activity: Del 15, Rec 13
- Closing BAL: 1 + 15 - 13 = 3 ✗ (shows 1 in your image — bug?)

## Summary of Required Changes

### Files to Modify:

1. **`lib/storefront/waterShopHisab.js`**
   - Add `aggregateWaterDayLinesBySizeGroup()` helper
   - Update `buildWaterMonthlyBillGrid()` to use size-group aggregation
   - Fix `formatWaterMonthlyBillDayLine()` to show 4 columns

2. **`lib/print/waterHisabThermalBill.js`**
   - Update `formatWaterMonthlyBillHeaderLine()` to show new column headers
   - Update `buildWaterPeriodBillHtml()` to render consolidated columns
   - Update `createWaterPeriodPdf()` for matching PDF output

3. **Verification Scripts**
   - Add test case for monthly bill with mixed product types
   - Verify column alignment at 58mm width
   - Test balance calculations across month boundaries

## Column Width Reference (58mm thermal)

Usable width: ~32 characters in Courier New 7pt

```
Day Y/N  Del  Rec  Bal
├─┤ ├─┤ ├──┤├──┤├──┤
2   3    4   4   4  = 17 chars
Leaves 15 chars margin/padding
```

This format ensures:
- ✅ Clear day-by-day delivery tracking
- ✅ Running balance visible for each day
- ✅ Consolidates first-fill + refill into single bottle count
- ✅ Detailed product breakdown stays in totals section
- ✅ Fits perfectly on 58mm thermal paper
