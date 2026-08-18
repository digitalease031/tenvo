# Textile Wholesale - Integration Guide

## Quick Start

This guide shows how to integrate the textile wholesale enhancements into the existing hub without breaking other domains.

---

## Step 1: Import the Hub Component

**File:** `app/business/[category]/page.jsx` (or your main hub route)

```jsx
import { TextileWholesaleHub } from '@/components/textile/TextileWholesaleHub';
import {
  calculateThaanStockSummary,
  calculatePartyOutstandingSummary,
  groupProductsByArticle,
  getSeasonalRestockRecommendations,
} from '@/lib/utils/textileWholesaleHelpers';
```

---

## Step 2: Add Conditional Rendering

**In your hub component:**

```jsx
export default async function BusinessHub({ params }) {
  const { category } = params;
  const session = await getServerSession();
  const business = await getBusinessForUser(session.user.id);
  
  // Fetch data
  const [customers, products, invoices, payments] = await Promise.all([
    getCustomersAction(business.id),
    getProductsAction(business.id),
    getInvoicesAction(business.id, { limit: 100 }),
    getRecentPaymentsAction(business.id, { limit: 10 }),
  ]);

  // Check if textile wholesale
  if (business.category === 'textile-wholesale' || business.category === 'textile') {
    // Calculate textile-specific metrics
    const stockSummary = calculateThaanStockSummary(products);
    const partySummary = calculatePartyOutstandingSummary(customers);
    const restockRecommendations = getSeasonalRestockRecommendations(products);
    
    // Filter pending invoices
    const pendingInvoices = invoices.filter(inv => 
      inv.payment_status !== 'paid'
    );

    // Calculate today's stats
    const today = new Date();
    const todayInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.created_at);
      return invDate.toDateString() === today.toDateString();
    });

    const metrics = {
      todayInvoices: todayInvoices.length,
      todayRevenue: todayInvoices.reduce((sum, inv) => sum + inv.grand_total, 0),
      totalOutstanding: partySummary.totalOutstanding,
      overdueParties: partySummary.overdueParties,
      ...stockSummary,
    };

    return (
      <TextileWholesaleHub
        metrics={metrics}
        customers={customers}
        topProducts={products.slice(0, 20)}
        pendingInvoices={pendingInvoices}
        recentPayments={payments}
        stockSummary={stockSummary}
        onAction={handleTextileAction}
      />
    );
  }

  // Default hub for other domains
  return <BusinessHubLayout {...defaultProps} />;
}
```

---

## Step 3: Add Action Handler

**Handle quick actions from the hub:**

```jsx
'use client';

function handleTextileAction(actionId, data) {
  switch (actionId) {
    case 'new-invoice':
      router.push('/business/textile-wholesale/invoices?action=new');
      break;
      
    case 'record-payment':
      router.push('/business/textile-wholesale/payments?action=record');
      break;
      
    case 'check-stock':
      router.push('/business/textile-wholesale/inventory?view=articles');
      break;
      
    case 'party-ledger':
      router.push('/business/textile-wholesale/customers?view=ledger');
      break;
      
    case 'add-stock':
      router.push('/business/textile-wholesale/inventory?action=add');
      break;
      
    case 'broker-expense':
      router.push('/business/textile-wholesale/expenses?category=agent_commission');
      break;
      
    case 'view-party-ledger':
      // data = customer.id
      router.push(`/business/textile-wholesale/customers/${data}`);
      break;
      
    case 'record-payment-for':
      // data = invoice.id
      router.push(`/business/textile-wholesale/payments?invoice=${data}`);
      break;
      
    case 'view-product-stock':
      // data = product.id
      router.push(`/business/textile-wholesale/inventory/${data}`);
      break;
      
    case 'export-ledger':
      exportPartyLedger();
      break;
      
    case 'seasonal-restock':
      router.push('/business/textile-wholesale/inventory?view=restock');
      break;
      
    default:
      console.warn('Unknown action:', actionId);
  }
}

async function exportPartyLedger() {
  const { exportPartyLedgerToCSV } = await import('@/lib/utils/textileWholesaleHelpers');
  const csv = exportPartyLedgerToCSV(customers);
  
  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `party-ledger-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

---

## Step 4: Enhance Invoice Form

**Add thaan-specific fields to invoice form:**

```jsx
// In InvoiceLineItem.jsx or similar

import { autoFillTextileLineOnUnitChange } from '@/lib/utils/invoiceHelpers';
import { formatThaanQuantity } from '@/lib/utils/textileWholesaleHelpers';

function InvoiceLineItem({ line, product, category, onChange }) {
  const isTextile = category === 'textile-wholesale' || category === 'textile';

  // Handle unit change
  const handleUnitChange = (newUnit) => {
    if (isTextile) {
      // Auto-fill thaan_length, suit_cutting, and convert rates
      const patches = autoFillTextileLineOnUnitChange(line, product, newUnit);
      onChange({ ...line, ...patches });
    } else {
      onChange({ ...line, unit: newUnit });
    }
  };

  return (
    <div className="invoice-line-item">
      {/* SKU/Article */}
      <input
        value={line.sku || product?.sku || ''}
        placeholder={isTextile ? 'Article No' : 'SKU'}
        onChange={(e) => onChange({ ...line, sku: e.target.value })}
      />

      {/* Design No (Textile only) */}
      {isTextile && (
        <input
          value={line.design_no || product?.domain_data?.designno || ''}
          placeholder="Design No"
          onChange={(e) => onChange({ ...line, design_no: e.target.value })}
        />
      )}

      {/* Quantity */}
      <input
        type="number"
        value={line.quantity || 0}
        onChange={(e) => onChange({ ...line, quantity: parseFloat(e.target.value) })}
      />

      {/* Unit Selector */}
      <select value={line.unit} onChange={(e) => handleUnitChange(e.target.value)}>
        {isTextile ? (
          <>
            <option value="thaan">Thaan</option>
            <option value="meter">Meter</option>
            <option value="suit">Suit</option>
            <option value="gaz">Gaz</option>
            <option value="guth">Guth</option>
          </>
        ) : (
          <>
            <option value="pcs">Pcs</option>
            <option value="kg">KG</option>
            <option value="ltr">Ltr</option>
          </>
        )}
      </select>

      {/* Thaan Length (when unit is thaan) */}
      {isTextile && line.unit === 'thaan' && (
        <input
          type="number"
          step="0.01"
          value={line.thaan_length || 40}
          placeholder="Thaan Length (m)"
          onChange={(e) => onChange({ ...line, thaan_length: parseFloat(e.target.value) })}
        />
      )}

      {/* Suit Cutting (when unit is suit) */}
      {isTextile && line.unit === 'suit' && (
        <input
          type="number"
          step="0.01"
          value={line.suit_cutting || 2.25}
          placeholder="Meters per Suit"
          onChange={(e) => onChange({ ...line, suit_cutting: parseFloat(e.target.value) })}
        />
      )}

      {/* Rate */}
      <input
        type="number"
        step="0.01"
        value={line.rate || 0}
        onChange={(e) => onChange({ ...line, rate: parseFloat(e.target.value) })}
      />

      {/* Display Conversion (Textile) */}
      {isTextile && (
        <div className="text-xs text-gray-500">
          {formatThaanQuantity(line.quantity, line.unit, {
            thaanlength: line.thaan_length,
            suitcutting: line.suit_cutting,
          })}
        </div>
      )}

      {/* Line Total */}
      <div className="font-semibold">
        {((line.quantity || 0) * (line.rate || 0)).toFixed(2)}
      </div>
    </div>
  );
}
```

---

## Step 5: Add Credit Check

**Before saving invoice:**

```jsx
import { validatePartyCredit } from '@/lib/utils/textileWholesaleHelpers';
import { CreditGuardService } from '@/lib/services/CreditGuardService';

async function handleSaveInvoice(invoiceData) {
  const { businessId, customerId, grandTotal } = invoiceData;

  // Skip for cash customers
  if (!customerId) {
    return await saveInvoice(invoiceData);
  }

  // Check credit limit (uses existing CreditGuardService)
  const creditCheck = await CreditGuardService.checkCreditLimit(
    businessId,
    customerId,
    grandTotal
  );

  if (!creditCheck.allowed) {
    // Show error to user
    toast.error(creditCheck.reason, {
      title: 'Credit Limit Exceeded',
      description: 'Contact party for payment before proceeding',
    });
    return { error: creditCheck.reason };
  }

  // Show warning if approaching limit
  if (creditCheck.allowed && creditCheck.usage > 80) {
    toast.warning(`Party using ${creditCheck.usage}% of credit limit`, {
      title: 'Credit Usage High',
    });
  }

  // Proceed with save
  return await saveInvoice(invoiceData);
}
```

---

## Step 6: Enhance Customer Form

**Add textile-specific fields:**

```jsx
import { getTextilePaymentTerms } from '@/lib/utils/textileWholesaleHelpers';

function CustomerForm({ business, customer, onSave }) {
  const isTextile = business.category === 'textile-wholesale';

  return (
    <form onSubmit={handleSubmit}>
      {/* Standard Fields */}
      <input name="name" label="Party Name" required />
      <input name="phone" label="Phone" />
      <input name="email" label="Email" />

      {/* Textile-Specific Fields */}
      {isTextile && (
        <>
          <input
            name="domain_data.shop_name"
            label="Shop Name"
            placeholder="e.g., Ali Cloth House"
          />
          
          <select name="domain_data.market_location" label="Market Location">
            <option value="">Select Market</option>
            <option value="Jama Cloth">Jama Cloth</option>
            <option value="Lunda Bazaar">Lunda Bazaar</option>
            <option value="Tariq Road">Tariq Road</option>
            <option value="Faisalabad Market">Faisalabad Market</option>
          </select>

          <select name="domain_data.buyer_type" label="Buyer Type">
            <option value="Retailer">Retailer</option>
            <option value="Wholesaler">Sub-Wholesaler</option>
            <option value="Tailor">Tailor</option>
            <option value="Boutique">Boutique</option>
          </select>

          <input
            type="number"
            name="credit_limit"
            label="Credit Limit (PKR)"
            placeholder="e.g., 500000"
            help="Maximum outstanding balance allowed"
          />

          <select name="payment_terms" label="Payment Terms">
            {getTextilePaymentTerms().map(term => (
              <option key={term.value} value={term.value}>
                {term.label}
              </option>
            ))}
          </select>

          <input
            name="domain_data.broker_name"
            label="Broker/Agent Name"
            placeholder="Optional"
          />

          <select name="domain_data.ntn_status" label="NTN Status">
            <option value="">Not Specified</option>
            <option value="filer">Filer</option>
            <option value="non_filer">Non-Filer</option>
          </select>
        </>
      )}

      <button type="submit">Save Party</button>
    </form>
  );
}
```

---

## Step 7: Add Inventory Grouping

**Create article/design view:**

```jsx
import { groupProductsByArticle, groupProductsByDesign } from '@/lib/utils/textileWholesaleHelpers';

function InventoryPage({ business, products }) {
  const [groupBy, setGroupBy] = useState('product'); // product | article | design

  const grouped = useMemo(() => {
    if (groupBy === 'article') {
      return groupProductsByArticle(products);
    }
    if (groupBy === 'design') {
      return groupProductsByDesign(products);
    }
    return products;
  }, [products, groupBy]);

  const isTextile = business.category === 'textile-wholesale';

  return (
    <div>
      {isTextile && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setGroupBy('product')}
            className={groupBy === 'product' ? 'active' : ''}
          >
            All Products
          </button>
          <button
            onClick={() => setGroupBy('article')}
            className={groupBy === 'article' ? 'active' : ''}
          >
            Group by Article
          </button>
          <button
            onClick={() => setGroupBy('design')}
            className={groupBy === 'design' ? 'active' : ''}
          >
            Group by Design
          </button>
        </div>
      )}

      {groupBy === 'product' ? (
        <ProductTable products={grouped} />
      ) : groupBy === 'article' ? (
        <ArticleGroupTable groups={grouped} />
      ) : (
        <DesignGroupTable groups={grouped} />
      )}
    </div>
  );
}
```

---

## Step 8: Add Reports

**Textile-specific reports:**

```jsx
import {
  identifySlowMovingDesigns,
  getSeasonalRestockRecommendations,
  exportStockSummaryToCSV,
} from '@/lib/utils/textileWholesaleHelpers';

async function generateTextileReports(businessId) {
  const products = await getProductsAction(businessId);

  return {
    // Slow Movers (Dead Stock)
    slowMovers: identifySlowMovingDesigns(products, 90),
    
    // Restock Recommendations
    restockPlan: getSeasonalRestockRecommendations(products),
    
    // Stock Summary CSV
    stockCSV: exportStockSummaryToCSV(products),
  };
}
```

---

## Step 9: Testing

**Test the integration:**

```bash
# 1. Create a test textile business
npm run seed:textile-demo

# 2. Visit the hub
http://localhost:3000/business/textile-wholesale

# 3. Test quick actions
- Click "Quick Invoice"
- Click "Record Payment"
- Click "Party Ledger"
- Check seasonal alert shows (if peak month)

# 4. Test credit limits
- Set a customer credit limit: 100,000
- Create invoice for 120,000
- Should block with error message

# 5. Test unit conversions
- Create invoice with unit "thaan"
- Check thaan_length auto-fills (40m)
- Check rate converts from per-meter to per-thaan
- Verify display shows: "5 Thaan (40m ea) = 200m"

# 6. Test party ledger
- View parties with outstanding balance
- Check credit usage bar shows correctly
- Export CSV and verify format

# 7. Test seasonal intelligence
- Mock peak month (April)
- Verify alert shows
- Check restock recommendations appear
```

---

## Step 10: Deployment

**Environment check:**

```bash
# Ensure all dependencies are installed
npm install lucide-react
npm install @radix-ui/react-tabs

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build

# Test production build
npm start
```

---

## Troubleshooting

### Issue: Hub not showing for textile business

**Check:**
```javascript
// Verify category is correctly set
console.log(business.category); // Should be 'textile-wholesale' or 'textile'

// Check domain resolver
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
console.log(resolveDomainKey('textile')); // Should return 'textile-wholesale'
```

### Issue: Credit check not working

**Check:**
```javascript
// Verify CreditGuardService is imported
import { CreditGuardService } from '@/lib/services/CreditGuardService';

// Check customer has credit_limit set
console.log(customer.credit_limit); // Should be > 0

// Check outstanding_balance exists
console.log(customer.outstanding_balance); // Should be number
```

### Issue: Unit conversions not showing

**Check:**
```javascript
// Verify helpers are imported
import { formatThaanQuantity } from '@/lib/utils/textileWholesaleHelpers';

// Check product has domain_data
console.log(product.domain_data.thaanlength); // Should be 40 or similar

// Check unit is lowercase
console.log(line.unit.toLowerCase()); // Should be 'thaan', not 'Thaan'
```

---

## Performance Optimization

### 1. Lazy Load Hub Component

```jsx
import dynamic from 'next/dynamic';

const TextileWholesaleHub = dynamic(
  () => import('@/components/textile/TextileWholesaleHub'),
  { ssr: true, loading: () => <LoadingSkeleton /> }
);
```

### 2. Cache Calculations

```jsx
import { cache } from 'react';

const getCachedStockSummary = cache((products) => {
  return calculateThaanStockSummary(products);
});
```

### 3. Paginate Large Lists

```jsx
// Only show top 10 outstanding parties by default
const topOutstanding = customers
  .filter(c => c.outstanding_balance > 0)
  .sort((a, b) => b.outstanding_balance - a.outstanding_balance)
  .slice(0, 10);
```

---

## Summary

**Integration Steps:**
1. ✅ Import hub component
2. ✅ Add conditional rendering
3. ✅ Handle quick actions
4. ✅ Enhance invoice form
5. ✅ Add credit checks
6. ✅ Update customer form
7. ✅ Add inventory grouping
8. ✅ Create reports
9. ✅ Test thoroughly
10. ✅ Deploy

**Result:** Textile wholesalers get a specialized hub without affecting other 60+ domains.
