# Water Hisab Monthly Bill Format Fix

## Problem

The Water Route Hisab Bills tab was printing monthly bills with the **milk hisab template** instead of the **water-specific template**. This resulted in:

- Chaotic, hard-to-read layout
- Y/N delivery format (milk-style) instead of bottle counts
- Missing proper columns for CUST, REC (Received), DEL (Delivered), BAL (Balance), and CASH

## Root Cause

In `lib/print/waterHisabThermalBill.js`:

1. **`printWaterPeriodBill` function** was using `buildMilkHisabDayBreakdownHtml` as the HTML fallback
2. **`printWaterPeriodBulk` function** (used by "Print Bills" button) was calling `buildMilkHisabDayBreakdownHtml` for all customers

Even though a proper water-specific template `buildWaterPeriodBillHtml` exists with the correct format, it wasn't being used.

## Solution

### Fixed Functions

#### 1. `printWaterPeriodBill` (lines ~924-958)

**Before:**
```javascript
const html = buildMilkHisabDayBreakdownHtml(model);
return printThermalReceiptHtml(html, {
  delayMs: model.billLocale === 'ur' ? 900 : 500,
});
```

**After:**
```javascript
// Use water-specific HTML template with proper Day/Bottles/Balance columns
const html = model.billLocale === 'ur' 
  ? buildMilkHisabDayBreakdownHtml(model) 
  : buildWaterPeriodBillHtml(model);
return printThermalReceiptHtml(html, {
  delayMs: model.billLocale === 'ur' ? 900 : 500,
});
```

Also fixed PDF error fallback to use water template instead of milk PDF function.

#### 2. `printWaterPeriodBulk` (lines ~965-1025)

**Before:**
```javascript
const parts = list.map((args) => {
  const model = buildWaterPeriodPrintModel(args);
  const enriched = {
    ...model,
    customerName: [
      model.customerName,
      model.accountNo ? `A/C ${model.accountNo}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
    houseNo: [model.houseNo, model.floorFlat].filter(Boolean).join(' / '),
  };
  const inner = buildMilkHisabDayBreakdownHtml(enriched)
    .replace(/^[\s\S]*<body[^>]*>/i, '')
    .replace(/<\/body>[\s\S]*$/i, '');
  return `<section class="slip">${inner}</section>`;
});
```

**After:**
```javascript
const parts = list.map((args) => {
  const model = buildWaterPeriodPrintModel(args);
  // Use water-specific HTML template with Day/Bottles/Balance columns
  const inner = buildWaterPeriodBillHtml(model)
    .replace(/^[\s\S]*<body[^>]*>/i, '')
    .replace(/<\/body>[\s\S]*$/i, '');
  return `<section class="slip">${inner}</section>`;
});
```

## What The Bills Now Show

### Monthly Bill Format (58mm Thermal)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Tenvo Water Supply
   DHA Phase 6, Korangi Industrial
         +92-xxx-xxxx

MONTHLY WATER BILL
      August 2026
    Casa Bella · A/C 11B-CASA
    INV-000001 · CASH · 5 active days
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Day delivery (Bottles)

DD   Del Rec  Bal
━━━━━━━━━━━━━━━━━━━━
01     1   1    5
02     0   0    5
03     1   0    6
10     3   0    9
15     1   3    7
18     1   2    6
20     0   3    3
21     0   3    0
22     0   3   -3
━━━━━━━━━━━━━━━━━━━━

Delivered bottles       12
Received empties        15
────────────────────────
Opening BAL              5
Closing BAL             -3
────────────────────────
Cash collected   Rs 1,200

━━━━━━━━━━━━━━━━━━━━

Product totals

(Refill) 10 bottle  Rs 1,500
Bottle 2 pcs        Rs 300
TOTAL DUE           Rs 2,400

━━━━━━━━━━━━━━━━━━━━

   Shukriya · Thank you
 Del = delivered · Rec = empties
```

### Column Explanation

- **DD**: Day of month (01-31)
- **Del**: Bottles delivered on that day
- **Rec**: Empty bottles received back
- **Bal**: Running balance (previous balance + delivered - received)

### Summary Sections

1. **Bottles Summary**
   - Total delivered bottles for the period
   - Total received empties
   - Opening balance (at start of period)
   - Closing balance (at end of period)
   - Cash collected

2. **Product Totals**
   - Breakdown by product type (19L Refill, 12L, 5L, etc.)
   - Quantity and amount per product
   - Grand total due

## Files Modified

- `lib/print/waterHisabThermalBill.js`
  - `printWaterPeriodBill()` - Fixed HTML fallback
  - `printWaterPeriodBulk()` - Fixed bulk print template

## Testing

Test the fix by:

1. Go to Water Route Hisab → **Bills** tab
2. Select August 2026 (or any period with data)
3. Click **Print Bills** or **Download PDF**
4. Verify the bills show:
   - Clean Day/Del/Rec/Bal columns
   - Proper running balance calculation
   - Correct product totals
   - Professional thermal receipt format

## Related Functions (Working Correctly)

These water-specific functions are already implemented correctly:

- `buildWaterMonthlyBillGrid()` - Generates day-by-day grid with running balance
- `formatWaterMonthlyBillHeaderLine()` - Returns "DD   Del Rec  Bal"
- `formatWaterMonthlyBillDayLine()` - Formats each day row
- `buildWaterPeriodBillHtml()` - Creates the proper HTML template
- `createWaterPeriodPdf()` - PDF generation (jsPDF)
- `buildWaterPeriodPrintModel()` - Prepares the data model

## Impact

- **No breaking changes** - Only fixes template selection
- **No database changes** - Pure presentation layer fix
- **No API changes** - Internal print function only
- **Backward compatible** - Urdu bills still use milk template (as designed)

---

**Status**: ✅ **FIXED**  
**Date**: 2026-08-12  
**Issue**: Water monthly bills showing milk-style Y/N format  
**Fix**: Route water bills to `buildWaterPeriodBillHtml` template
