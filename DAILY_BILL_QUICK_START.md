# Water Route Daily Bill - Quick Start Guide

## 🚀 Print Daily Route Summary in 3 Steps

### Step 1: Import
```javascript
import { printDailyRouteSummary } from '@/lib/print/milkHisabThermalBill';
```

### Step 2: Prepare Data
```javascript
const data = {
  business: yourBusinessObject,
  date: '2026-08-12',
  routeName: 'Khalid - Bahria Town Route',
  customers: [
    {
      customerName: 'Ahmed',
      houseNo: '123',
      delivered: 1,    // bottles delivered
      received: 1,     // empties returned
      balance: 0,      // bottles with customer
      cash: 150.00,    // cash collected
    },
    // ... more customers
  ],
};
```

### Step 3: Print
```javascript
// Print to thermal printer
await printDailyRouteSummary(data, 'print');

// Or download PDF
await printDailyRouteSummary(data, 'pdf');
```

---

## 📋 What It Prints

```
┌─────────────────────────────────┐
│    Tenvo Water Supply           │
│    DAILY SALE SUMMARY           │
│       2026-08-12                │
├─────────────────────────────────┤
│ Cust    | Del | Rec | Bal | Cash│
│ Ahmed123|  1  |  1  |  0  | 150 │
│ Fatima  |  2  |  1  |  1  |   0 │
│ TOTAL   |  3  |  2  |  1  | 150 │
└─────────────────────────────────┘
```

---

## 📊 Columns Explained

| Column | Meaning |
|--------|---------|
| **Cust** | Customer name (+ house no) |
| **Del** | Bottles delivered |
| **Rec** | Empties received |
| **Bal** | Bottles with customer |
| **Cash** | Cash collected (Rs) |

---

## 💡 Common Patterns

### Print Button in React Component
```jsx
<button onClick={async () => {
  await printDailyRouteSummary({
    business,
    date: new Date(),
    routeName: 'Main Route',
    customers: customerData,
  }, 'print');
}}>
  Print Daily Summary
</button>
```

### Server Action
```javascript
'use server';
export async function printRouteSummary(businessId, date) {
  const business = await getBusiness(businessId);
  const customers = await getRouteCustomers(businessId, date);
  
  return printDailyRouteSummary({
    business,
    date,
    routeName: 'Route 1',
    customers,
  }, 'print');
}
```

### API Route
```javascript
// app/api/route-summary/print/route.js
export async function POST(request) {
  const { businessId, date, customers } = await request.json();
  const business = await getBusiness(businessId);
  
  await printDailyRouteSummary({
    business,
    date,
    routeName: 'Main Route',
    customers,
  }, 'print');
  
  return Response.json({ success: true });
}
```

---

## ⚡ Full Example

```javascript
import { printDailyRouteSummary } from '@/lib/print/milkHisabThermalBill';

async function printRouteEnd() {
  const business = {
    business_name: 'Tenvo Water Supply',
    address: 'DHA Phase 6, Korangi',
    phone: '+92-300-1234567',
    country: 'Pakistan',
  };
  
  const customers = [
    { 
      customerName: 'Ahmed', 
      houseNo: '123',
      delivered: 1, 
      received: 1, 
      balance: 0, 
      cash: 150.00 
    },
    { 
      customerName: 'Fatima', 
      houseNo: '124',
      delivered: 2, 
      received: 1, 
      balance: 1, 
      cash: 0.00 
    },
    { 
      customerName: 'Hassan', 
      houseNo: '125',
      delivered: 1, 
      received: 0, 
      balance: 2, 
      cash: 150.00 
    },
  ];
  
  await printDailyRouteSummary({
    business,
    date: '2026-08-12',
    routeName: 'Khalid - Bahria Town Route',
    customers,
  }, 'print');
}
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Nothing prints | Check thermal printer connection |
| Wrong currency | Set `business.country` correctly |
| Names cut off | Normal for 58mm paper - names auto-truncate |
| Totals wrong | Check customer data has correct numbers |

---

## 📚 More Help

- **Full docs:** `ROUTE_HISAB_DAILY_BILL_INTEGRATION.md`
- **Examples:** `lib/print/dailyRouteSummaryExample.js`
- **Preview:** Open `test-daily-route-bill.html` in browser
- **Technical:** `.superpowers/WATER_ROUTE_DAILY_BILL_FIX.md`

---

## ✨ Key Features

✅ 58mm thermal printer optimized
✅ Automatic totals calculation
✅ Clean table format
✅ Multi-language support (via currency)
✅ PDF download option
✅ Professional business header
✅ Route/driver name support
✅ House number display

---

## 🎯 Perfect For

- Daily route summaries
- Driver end-of-day reports
- Cash collection tracking
- Bottle inventory tracking
- Route performance reports
