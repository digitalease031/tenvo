# Water Route Daily Bill Fix - Summary

## Problem
The existing milk/water hisab bill was showing product columns (like Milk, Egg, Bread with Y/N delivery markers per day), but for a **daily route summary**, we needed customer-level transaction columns showing:
- **Cust** - Customer name (with house number)
- **Del** - Bottles delivered
- **Rec** - Empty bottles received/returned
- **Bal** - Bottle balance with customer
- **Cash** - Cash collected

## Solution
Added new thermal bill functions specifically for daily route customer summaries:

### New Functions in `lib/print/milkHisabThermalBill.js`

1. **`buildDailyRouteSummaryModel(args)`**
   - Builds the data model for daily route summary
   - Takes business info, date, route name, and array of customer transactions
   - Calculates totals automatically

2. **`buildDailyRouteSummaryHtml(model)`**
   - Generates 58mm thermal-optimized HTML with customer table
   - Compact monospace font for readability on thermal printer
   - Proper table structure with headers and totals row

3. **`printDailyRouteSummary(args, mode)`**
   - Main print/PDF function
   - Modes: 'print' (thermal printer) or 'pdf' (download)

## Usage Example

```javascript
import { printDailyRouteSummary } from '@/lib/print/milkHisabThermalBill';

const routeData = {
  business: {
    business_name: 'Tenvo Water Supply',
    address: 'DHA Phase 6, Korangi Industrial Area',
    phone: '+92-300-1234567',
    country: 'Pakistan',
  },
  date: '2026-08-12',
  routeName: 'Khalid · Bahria Town Route',
  customers: [
    {
      customerName: 'Ahmed',
      houseNo: '123',
      delivered: 1,      // 1 bottle delivered
      received: 1,       // 1 empty returned
      balance: 0,        // bottles with customer
      cash: 150.00,      // cash collected
    },
    // ... more customers
  ],
};

// Print to thermal printer
await printDailyRouteSummary(routeData, 'print');

// Or download as PDF
await printDailyRouteSummary(routeData, 'pdf');
```

## Bill Format

```
┌─────────────────────────────────────┐
│      Tenvo Water Supply             │
│  DHA Phase 6, Korangi Industrial    │
│        +92-300-1234567              │
├─────────────────────────────────────┤
│      DAILY SALE SUMMARY             │
│          2026-08-12                 │
│  Khalid · Bahria Town Route         │
├─────────────────────────────────────┤
│ Cust    | Del | Rec | Bal | Cash   │
├─────────────────────────────────────┤
│ Ahmed H123 | 1 | 1  | 0  | Rs 150  │
│ Fatima H124| 2 | 1  | 1  | Rs 0    │
│ Hassan H125| 1 | 0  | 2  | Rs 150  │
├─────────────────────────────────────┤
│ TOTAL      | 4 | 2  | 3  | Rs 300  │
├─────────────────────────────────────┤
│      Shukriya · Thank you           │
│ Del = delivered · Rec = empty       │
│ returned · Bal = bottles with cust  │
└─────────────────────────────────────┘
```

## Files Modified

1. **`lib/print/milkHisabThermalBill.js`** - Added daily route summary functions

## Files Created

1. **`lib/print/dailyRouteSummaryExample.js`** - Usage examples and integration guide
2. **`test-daily-route-bill.html`** - Visual preview of the printed bill format

## Integration with Route Hisab

To integrate with your existing Route Hisab component:

1. Fetch daily stops/transactions for the route
2. Map customer data to the expected format
3. Call `printDailyRouteSummary()` with the data

```javascript
// Example integration
const dailyStops = await getDailyRouteStops(businessId, date);
const customers = dailyStops.map(stop => ({
  customerName: stop.customer_name,
  houseNo: stop.house_no,
  delivered: stop.delivered_qty,
  received: stop.empties_returned,
  balance: stop.bottle_balance,
  cash: stop.cash_collected,
  amount: stop.amount,
}));

await printDailyRouteSummary({
  business,
  date: new Date(),
  routeName: 'Main Route',
  customers,
}, 'print');
```

## Benefits

1. **Clear Format** - Easy-to-read table format perfect for 58mm thermal printers
2. **Automatic Totals** - Calculates totals for all columns automatically
3. **Flexible** - Works with both thermal printer and PDF download
4. **Professional** - Includes business header, route info, and legend
5. **Compact** - Optimized for thermal printer width with proper column alignment

## Testing

Open `test-daily-route-bill.html` in your browser to see how the bill will look when printed.
