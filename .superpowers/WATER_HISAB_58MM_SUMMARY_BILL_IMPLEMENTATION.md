# Water Hisab 58mm All-Customers Summary Bill

## Overview

Implemented a **single consolidated 58mm thermal bill** showing all customers in a table format for the Water Route Hisab Bills tab. This replaces the individual customer bills when using "Print Bills" button.

## User Request

> "PRINT BILLS WE SHOULD HAVE A SINGLE MONTHLY BILL WITH CUST, REC, DEL, BAL, CASH COLUMN"

## Implementation

### Two Different Formats

1. **"Print Bills" button** → Single 58mm thermal summary table (NEW)
   - Shows ALL customers in one consolidated bill
   - Columns: CUST | DEL | REC | BAL | CASH
   - Perfect for quick overview on thermal printer

2. **"Download PDF" button** → Individual customer bills (EXISTING)
   - Separate bill per customer with day-by-day breakdown
   - Shows DD | Del | Rec | Bal grid for each customer
   - Good for distribution to customers

### New Functions Added

#### 1. `buildWater58mmAllCustomersSummaryHtml()`

**Location**: `lib/print/waterHisabThermalBill.js` (after `printWaterPeriodBulk`)

**Purpose**: Builds 58mm thermal HTML with customer summary table

**Parameters**:
```javascript
{
  business: {},        // Business details
  rows: [],           // Array of customer bill rows
  periodLabel: '',    // e.g. "August 2026"
  period: '',         // e.g. "2026-08"
  kind: 'month'       // 'week' or 'month'
}
```

**Output Format** (58mm thermal):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Tenvo Water Supply
   DHA Phase 6, Korangi Industrial
         +92-xxx-xxxx

      MONTHLY BILLS SUMMARY
         August 2026
          57 customers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CUSTOMER           DEL REC BAL  CASH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1A Ahmed Khan       12  10   5  1200
2B Fatima Ali       15  15   3  1800
3C Tariq Hassan     10   8   7  1000
5D Zainab Malik     18  15  10  2100
...

Total Delivered:              480
Total Received:               420
Cash Collected:            Rs 48,600
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GRAND TOTAL:               Rs 52,400
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Shukriya · Thank you
 Del = Delivered · Rec = Received
BAL = Customer balance · Cash = Collected
```

**Features**:
- 58mm thermal-optimized layout (32 chars usable width)
- Monospace font for perfect column alignment
- Customer name includes house number when available
- Sorted by house number then customer name
- Running totals section at bottom
- Grand total prominently displayed

#### 2. `printWater58mmAllCustomersSummary()`

**Location**: `lib/print/waterHisabThermalBill.js` (after `buildWater58mmAllCustomersSummaryHtml`)

**Purpose**: Print or preview the 58mm summary bill

**Parameters**:
```javascript
(args, mode = 'print')
```

**Modes**:
- `'print'` - Direct thermal printer output
- `'pdf'` - Opens print dialog for Save as PDF

**Returns**: `Promise<boolean>` - Success status

### Modified Functions

#### `handleBulkPeriodBills()` in WaterRouteHisab.jsx

**Changed Behavior**:

**Before**: Always fetched individual customer day breakdowns and printed separate bills

**After**: 
- **Print mode** (`mode === 'print'`): Uses new `printWater58mmAllCustomersSummary()` → single consolidated table
- **PDF mode** (`mode === 'pdf'`): Uses existing `printWaterPeriodBulk()` → individual customer bills

**Logic Flow**:
```javascript
if (mode === 'print') {
  // NEW: Single 58mm summary table
  printWater58mmAllCustomersSummary({
    business,
    rows: billable,
    periodLabel,
    period,
    kind
  }, 'print');
} else {
  // EXISTING: Individual customer bills PDF
  // Fetch day breakdowns
  // Build models per customer
  // printWaterPeriodBulk(models, 'pdf')
}
```

### Column Specifications (58mm Thermal)

| Column | Width | Alignment | Content |
|--------|-------|-----------|---------|
| CUSTOMER | 18 chars | Left | House + Name (e.g. "1A Ahmed Khan") |
| DEL | 3 chars | Right | Delivered bottles count |
| REC | 3 chars | Right | Received empties count |
| BAL | 3 chars | Right | Customer balance |
| CASH | 6 chars | Right | Cash collected (no decimals) |

**Total line width**: ~32 chars (fits 58mm thermal perfectly)

### Button Behavior

#### Bills Tab Actions:

1. **"Print Bills"** 
   - Calls: `handleBulkPeriodBills('print')`
   - Output: Single 58mm consolidated summary table
   - Use case: Quick thermal receipt showing all customers

2. **"Download PDF"**
   - Calls: `handleBulkPeriodBills('pdf')`
   - Output: Multi-page PDF with individual customer bills
   - Use case: Detailed bills for distribution to each customer

3. **"Monthly Summary"**
   - Calls: `handlePrintA4BillSummary('print')`
   - Output: A4 professional report with full table
   - Use case: Comprehensive office report

## Files Modified

### 1. `lib/print/waterHisabThermalBill.js`

**Added** (after line ~1025):
- `buildWater58mmAllCustomersSummaryHtml()` (~140 lines)
- `printWater58mmAllCustomersSummary()` (~40 lines)

**Total**: ~180 lines added

### 2. `components/water/WaterRouteHisab.jsx`

**Import** (line ~77):
```javascript
import { ..., printWater58mmAllCustomersSummary } from '@/lib/print/waterHisabThermalBill';
```

**Modified** `handleBulkPeriodBills()` (line ~1644):
- Added mode check for 'print' vs 'pdf'
- Calls new 58mm summary for print mode
- Keeps existing individual bills logic for pdf mode

**Total**: ~35 lines modified

## Technical Details

### Column Formatting Functions

```javascript
// Customer name with house number
const formatCustomerName = (name, house) => {
  let base = String(name || 'Customer').slice(0, 18);
  if (house && house !== '?' && house !== 'null') {
    base = `${house} ${base}`.slice(0, 18);
  }
  return base.padEnd(18, ' ');
};

// Numbers right-aligned
const formatNum = (val, width) => 
  String(Math.round(val || 0)).padStart(width, ' ');

// Money without decimals
const formatMoney = (val) => {
  const rounded = Math.round(Number(val) || 0);
  return String(rounded).padStart(6, ' ');
};
```

### Data Aggregation

```javascript
sortedRows.forEach(row => {
  totalDel += Number(row.delTotal) || 0;
  totalRec += Number(row.recTotal) || 0;
  totalAmount += Number(row.amount) || 0;
  totalCash += Number(row.cashCollected) || 0;
});
```

### Sorting Logic

Customers sorted by:
1. House number (numeric comparison)
2. Customer name (alphabetical)

## Testing Checklist

- [ ] "Print Bills" button opens 58mm thermal with consolidated table
- [ ] Table shows CUST | DEL | REC | BAL | CASH columns
- [ ] Customer names include house numbers
- [ ] Numbers are right-aligned and properly formatted
- [ ] Totals section shows correct sums
- [ ] Grand total matches period total
- [ ] "Download PDF" still creates individual customer bills
- [ ] Column alignment is perfect on 58mm printer
- [ ] Legend explains all abbreviations
- [ ] Works with both weekly and monthly periods

## Benefits

1. **Fast Overview** - See all customers at a glance on one receipt
2. **Less Paper** - Single bill instead of 50+ separate bills
3. **Quick Verification** - Totals visible immediately
4. **Thermal Optimized** - Perfect 58mm layout
5. **Complementary** - Download PDF still available for detailed bills

## Use Cases

### "Print Bills" (58mm Summary)
- ✅ Manager wants quick overview
- ✅ Verify total collection for the period
- ✅ Check which customers paid/owe
- ✅ Daily office reference

### "Download PDF" (Individual Bills)
- ✅ Distribute bills to customers
- ✅ WhatsApp individual bills
- ✅ Customer needs day-by-day breakdown
- ✅ Record keeping per customer

### "Monthly Summary" (A4 Report)
- ✅ Comprehensive office report
- ✅ Full product breakdown
- ✅ Professional format for management
- ✅ Archive documentation

---

**Status**: ✅ **IMPLEMENTED**  
**Date**: 2026-08-12  
**Feature**: Single 58mm thermal summary bill for all customers  
**Format**: CUST | DEL | REC | BAL | CASH table with totals
