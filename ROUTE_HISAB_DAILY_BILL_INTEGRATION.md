# Route Hisab Daily Bill - Integration Guide

## Quick Start

The daily route bill shows a summary of all customer transactions for a specific date with columns:
**Cust | Del | Rec | Bal | Cash**

## Step 1: Import the Function

```javascript
import { printDailyRouteSummary } from '@/lib/print/milkHisabThermalBill';
```

## Step 2: Prepare Your Data

```javascript
const routeData = {
  business: {
    business_name: 'Your Business Name',
    address: 'Your Address',
    phone: 'Your Phone',
    country: 'Pakistan', // or your country
    category: 'milk-shop', // or 'water-supply'
  },
  date: '2026-08-12', // or new Date()
  routeName: 'Khalid · Bahria Town Route', // Optional route/driver name
  customers: [
    {
      customerName: 'Customer Name',
      houseNo: '123', // Optional house number
      delivered: 1,    // Number of bottles delivered
      received: 1,     // Number of empties received
      balance: 0,      // Bottle balance with customer
      cash: 150.00,    // Cash amount collected
      amount: 150.00,  // Transaction amount (for totals)
    },
    // ... more customers
  ],
};
```

## Step 3: Print or Download

```javascript
// Print to thermal printer
await printDailyRouteSummary(routeData, 'print');

// Download as PDF
await printDailyRouteSummary(routeData, 'pdf');
```

## Integration with Existing Route Hisab Component

If you already have a Route Hisab component with daily stops data:

```javascript
// In your component or action
async function printDailySummary(businessId, date) {
  // 1. Fetch business info
  const business = await getBusiness(businessId);
  
  // 2. Fetch daily stops for the date
  const dailyStops = await pool.query(`
    SELECT 
      c.name as customer_name,
      s.house_no,
      s.delivered_qty,
      s.empties_returned,
      s.bottle_balance,
      s.cash_collected,
      s.amount
    FROM route_stops s
    JOIN customers c ON s.customer_id = c.id
    WHERE s.business_id = $1 
    AND s.delivery_date = $2
    ORDER BY s.sequence
  `, [businessId, date]);
  
  // 3. Map data to the expected format
  const customers = dailyStops.rows.map(stop => ({
    customerName: stop.customer_name,
    houseNo: stop.house_no,
    delivered: Number(stop.delivered_qty || 0),
    received: Number(stop.empties_returned || 0),
    balance: Number(stop.bottle_balance || 0),
    cash: Number(stop.cash_collected || 0),
    amount: Number(stop.amount || 0),
  }));
  
  // 4. Print the summary
  await printDailyRouteSummary({
    business,
    date,
    routeName: 'Main Route', // You can get this from route table
    customers,
  }, 'print');
}
```

## Add a Print Button to Your UI

```jsx
// In your Route Hisab component
import { printDailyRouteSummary } from '@/lib/print/milkHisabThermalBill';
import { useBusiness } from '@/lib/context/BusinessContext';

function RouteHisabDailySummary({ date, customers }) {
  const { business } = useBusiness();
  const [isPrinting, setIsPrinting] = useState(false);
  
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printDailyRouteSummary({
        business,
        date,
        routeName: 'Main Route',
        customers,
      }, 'print');
    } catch (error) {
      console.error('Print failed:', error);
      // Show error toast
    } finally {
      setIsPrinting(false);
    }
  };
  
  return (
    <button 
      onClick={handlePrint}
      disabled={isPrinting}
      className="btn btn-primary"
    >
      {isPrinting ? 'Printing...' : 'Print Daily Summary'}
    </button>
  );
}
```

## Data Fields Explained

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerName` | string | Yes | Customer name |
| `houseNo` | string | No | House number (shows as "Name H123") |
| `delivered` | number | Yes | Number of bottles delivered today |
| `received` | number | Yes | Number of empty bottles returned |
| `balance` | number | Yes | Current bottle balance with customer |
| `cash` | number | Yes | Cash amount collected from customer |
| `amount` | number | No | Used for total calculation only |

## Bill Calculation Logic

The function automatically:
- Sums all `delivered` values
- Sums all `received` values  
- Sums all `balance` values
- Sums all `cash` values
- Displays totals in the bottom row

## Customization

### Change Currency
The currency is automatically taken from the business's regional pack (e.g., PKR for Pakistan, USD for USA).

### Change Route Name
You can make the route name more detailed:

```javascript
routeName: 'Khalid · A/C: W-R7FHWJ | Town: BTK · Precinct 1 (Villa Precinct) · Bahria Town Route'
```

### Filter Customers
Only include customers with activity:

```javascript
const customers = dailyStops
  .filter(stop => stop.delivered_qty > 0 || stop.cash_collected > 0)
  .map(stop => ({
    // ... mapping
  }));
```

## Testing

1. Open `test-daily-route-bill.html` in your browser to see the bill preview
2. Check `lib/print/dailyRouteSummaryExample.js` for more examples
3. Verify thermal printer is connected before printing

## Troubleshooting

**Print doesn't work:**
- Check thermal printer connection
- Ensure printer supports 58mm paper
- Try PDF mode first to verify data is correct

**Columns don't align:**
- This is normal for very long customer names
- Names are automatically truncated to fit 58mm width
- Balance and cash columns always align properly

**Currency shows wrong:**
- Check `business.country` is set correctly
- Regional pack determines currency automatically
- Can be overridden via business settings

## Support

For issues or questions, see:
- `lib/print/milkHisabThermalBill.js` - Main implementation
- `lib/print/dailyRouteSummaryExample.js` - Usage examples
- `.superpowers/WATER_ROUTE_DAILY_BILL_FIX.md` - Technical details
