# Textile Wholesale - Quick Reference Card 📋

**For**: Developers maintaining textile wholesale features  
**Last Updated**: 2026-08-18

---

## 🎯 Domain Detection

```javascript
import { isTextileWholesale } from '@/lib/utils/textileWholesaleDomainFilter';

if (isTextileWholesale(category)) {
  // Textile wholesale specific logic
}
```

**Matches**: `textile-wholesale`, `textile`

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `components/textile/TextileWholesaleHub.jsx` | Custom dashboard |
| `components/textile/TextileCustomerForm.jsx` | Custom customer form |
| `lib/config/textileWholesaleDomainConfig.js` | Configuration |
| `lib/utils/textileWholesaleDomainFilter.js` | Filters & helpers |
| `lib/utils/textileWholesaleHelpers.js` | Business logic |

---

## 🎨 Integration Points

### 1. DashboardTabs (Dashboard)
```javascript
// File: app/business/[category]/components/DashboardTabs.jsx

import { isTextileWholesale } from '@/lib/utils/textileWholesaleDomainFilter';

{isTextileWholesale(category) ? (
  <TextileWholesaleHub {...props} />
) : (
  <DomainDashboard {...props} />
)}
```

### 2. ActionModals (Customer Form)
```javascript
// File: app/business/[category]/components/ActionModals.jsx

import { isTextileWholesale } from '@/lib/utils/textileWholesaleDomainFilter';

{isTextileWholesale(category) ? (
  <TextileCustomerForm {...props} />
) : (
  <CustomerForm {...props} />
)}
```

### 3. Sidebar (Navigation)
```javascript
// File: components/layout/Sidebar.jsx

import { isTextileWholesale, isTextileWholesaleTabVisible } from '@/lib/utils/textileWholesaleDomainFilter';

if (isTextileWholesale(category) && !isTextileWholesaleTabVisible(item.key)) {
  return { visible: false };
}
```

---

## 🎬 Event System (Actions)

### Dispatch Events
```javascript
// Open modal
window.dispatchEvent(new CustomEvent('open-modal', { 
  detail: { modalId: 'invoice' | 'product' | 'customer' | 'expense' } 
}));

// Switch tab
window.dispatchEvent(new CustomEvent('switch-tab', { 
  detail: { tab: 'inventory' | 'customers' | 'payments' } 
}));

// View details
window.dispatchEvent(new CustomEvent('view-details', { 
  detail: { type: 'customer' | 'product', item: { id: '...' } } 
}));
```

### Quick Actions Map
| Button | Event | Detail |
|--------|-------|--------|
| Quick Invoice | `open-modal` | `{ modalId: 'invoice' }` |
| Add Thaans | `open-modal` | `{ modalId: 'product' }` |
| Log Commission | `open-modal` | `{ modalId: 'expense' }` |
| Article Stock | `switch-tab` | `{ tab: 'inventory' }` |
| Party Ledger | `switch-tab` | `{ tab: 'customers' }` |
| Record Payment | `switch-tab` | `{ tab: 'payments' }` |

---

## 🏷️ Domain Labels

```javascript
import { TEXTILE_WHOLESALE_LABELS } from '@/lib/config/textileWholesaleDomainConfig';

// product → Article
// customer → Party / Retailer
// vendor → Mill / Supplier
// warehouse → Godown
// batch_number → Roll / Bale No
// pos_terminal → Counter
```

---

## 📊 Visible Tabs

```javascript
import { TEXTILE_WHOLESALE_VISIBLE_TABS } from '@/lib/config/textileWholesaleDomainConfig';

// ~19 tabs:
['dashboard', 'invoices', 'customers', 'inventory', 'purchases', 
 'vendors', 'payments', 'expenses', 'finance', 'reports', 
 'quotations', 'warehouses', 'batches', 'pos', 'settings']
```

---

## 🚫 Hidden Tabs

```javascript
import { TEXTILE_WHOLESALE_HIDDEN_TABS } from '@/lib/config/textileWholesaleDomainConfig';

// Hidden:
['manufacturing', 'bom', 'serials', 'memberships', 'loyalty', 
 'campaigns', 'promotions', 'payroll', 'attendance', 'shifts', 
 'restaurant', 'kds', 'forecasting', 'projects', 'route-hisab']
```

---

## 🔧 Helper Functions

### Stock Management
```javascript
import { 
  calculateThaanMeters,
  calculateMetersFromThaans,
  calculateSuitsFromMeters,
  groupProductsByArticle,
  groupProductsByDesign
} from '@/lib/utils/textileWholesaleHelpers';
```

### Credit Management
```javascript
import {
  calculateOutstandingSummary,
  validateCreditLimit,
  calculateBrokerCommission
} from '@/lib/utils/textileWholesaleHelpers';
```

### Seasonal Intelligence
```javascript
import {
  getSeasonalRecommendations,
  identifySlowMovingStock
} from '@/lib/utils/textileWholesaleHelpers';
```

---

## 🎯 Module Flags

```javascript
import { TEXTILE_WHOLESALE_MODULES } from '@/lib/config/textileWholesaleDomainConfig';

// Enabled
✅ invoicing, purchases, customers, vendors
✅ pos, batch_tracking, multi_warehouse
✅ expense_tracking, credit_notes, tax_compliance

// Disabled
❌ manufacturing, serial_tracking
❌ loyalty_programs, membership_management
❌ campaigns, payroll, restaurant_pos
```

---

## 📱 Props Structure

### TextileWholesaleHub
```javascript
<TextileWholesaleHub
  businessId={string}          // Required
  category={string}             // Required
  products={array}              // Required
  customers={array}             // Required
  invoices={array}              // Required
  currency={string}             // Default: 'PKR'
  dashboardMetrics={object}     // Optional
  isLoading={boolean}           // Default: false
  onAction={function}           // Optional (uses events)
/>
```

### TextileCustomerForm
```javascript
<TextileCustomerForm
  initialData={object}          // Optional
  onSave={function}             // Required
  onCancel={function}           // Required
  category={string}             // Required
  currency={string}             // Optional
  business={object}             // Optional
/>
```

---

## 🔍 Debugging

### Check if textile wholesale is detected
```javascript
console.log('Is Textile:', isTextileWholesale(category));
```

### Check tab visibility
```javascript
console.log('Tab visible:', isTextileWholesaleTabVisible('manufacturing')); // false
console.log('Tab visible:', isTextileWholesaleTabVisible('inventory'));    // true
```

### Check event listeners
```javascript
// In browser console
window.addEventListener('open-modal', (e) => console.log('Modal:', e.detail));
window.addEventListener('switch-tab', (e) => console.log('Tab:', e.detail));
```

---

## ⚠️ Common Mistakes

### ❌ Wrong
```javascript
// Using onAction callback
onAction?.('new-invoice');

// Passing wrong category format
isTextileWholesale('Textile Wholesale'); // false - needs lowercase
```

### ✅ Right
```javascript
// Using window events
window.dispatchEvent(new CustomEvent('open-modal', { 
  detail: { modalId: 'invoice' } 
}));

// Correct category format
isTextileWholesale('textile-wholesale'); // true
isTextileWholesale('textile');           // true
```

---

## 📈 Testing

### Manual Test
```bash
1. Login to textile-wholesale business
2. Verify TextileWholesaleHub renders
3. Click all 6 quick action buttons
4. Verify each button action works
5. Check sidebar has ~19 tabs only
6. Add a party - should see TextileCustomerForm
7. Check no other domains affected
```

### Browser Console
```javascript
// Check detection
console.log(window.location.pathname);
// Should be: /business/textile-wholesale

// Test event
window.dispatchEvent(new CustomEvent('open-modal', { 
  detail: { modalId: 'invoice' } 
}));
// Should open invoice builder
```

---

## 🎨 Styling

### Color Scheme
- Primary: Brand color (wine/purple)
- Success: Green (credit OK)
- Warning: Amber (credit 60-80%)
- Danger: Red (credit >80%)

### Layout
- Hub: 6-column grid on desktop
- Cards: Rounded, shadowed
- Buttons: Consistent with platform
- Mobile: Responsive stacking

---

## 📚 Further Reading

| Document | Purpose |
|----------|---------|
| `TEXTILE_WHOLESALE_PRODUCTION_READY.md` | Complete status |
| `TEXTILE_WHOLESALE_ACTIONS_FIXED.md` | Action button fix |
| `TEXTILE_WHOLESALE_HUB_INTEGRATED.md` | Hub integration |
| `TEXTILE_CUSTOMER_FORM_QUICK_START.md` | Form testing |
| `TEXTILE_WHOLESALE_MASTER_SUMMARY.md` | Feature summary |

---

## 🆘 Support

### Issues?
1. Check domain detection: `isTextileWholesale(category)`
2. Check browser console for errors
3. Verify event listeners are attached
4. Check category is lowercase hyphenated
5. Review integration points above

### Contact
- See documentation files in `.superpowers/`
- Review code comments in implementation files
- Check JSDoc types for function signatures

---

**Quick Reference**: Keep this handy when working with textile wholesale features!  
**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2026-08-18
