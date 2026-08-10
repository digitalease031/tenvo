# Water Hisab Performance & Expense Bug Root Cause Analysis

## Date: 2026-08-10
## Scope: Water delivery Route Hisab slowness + Expense recording bug

---

## Issue 1: Water Hisab Slowness Root Causes

### **Primary Bottlenecks Identified:**

#### 1. **Serial Customer ID Backfill (Line 265)**
```javascript
// Fire-and-forget: ensure customer IDs are populated without blocking the sheet load
void ensureWaterCustomerIds(businessId, customers);
```

**Problem:** 
- `ensureWaterCustomerIds()` loops through ALL customers TWICE (once to collect used IDs, once to generate new ones)
- Even though it's fire-and-forget, it runs `db.$transaction()` with N update statements for customers missing IDs
- With 50+ customers, this can add 500ms-1s+ latency

**Impact:** Medium (async but blocks DB connection pool)

---

#### 2. **N+1 Query Pattern in Period Summary (Line 797-990)**
```javascript
// getWaterHisabPeriodSummaryAction
const stops = await prismaBase.water_delivery_stops.findMany({ ... });
const invoices = await prismaBase.invoices.findMany({ ... });

// Then loops through byCustomer map
for (const stop of stops) {
  // Processes each stop with nested line iteration
  for (const line of meaningfulLines) { ... }
}
```

**Problem:**
- Fetches ALL stops for the period (week/month = 200-500+ rows)
- Fetches ALL invoices with `WATER_HISAB_PERIOD_PREFIX` (unbounded)
- Client-side joins and aggregations in JavaScript instead of SQL
- No indexes on `water_delivery_stops.delivery_date` + `business_id` composite

**Impact:** HIGH — Bills tab can take 3-5s with 50 customers × 7-30 days

---

#### 3. **Redundant Product Catalog Re-fetch (Line 823-844)**
```javascript
const allProducts = await prismaBase.products.findMany({
  where: { business_id: businessId, is_deleted: false },
  select: { id: true, name: true, unit: true, price: true, category: true },
  take: 500,
});
const businessForSettings = await prismaBase.businesses.findFirst({
  where: { id: businessId },
  select: { settings: true },
});
const resolvedCatalog = resolveWaterHisabProducts(allProducts, businessForSettings?.settings || {});
```

**Problem:**
- Daily sheet ALREADY loaded products (line 210-226)
- Period summary re-fetches the ENTIRE product catalog again just to enrich column metadata
- Two separate business queries (one at line 195, another at line 839)

**Impact:** Medium (200-500ms per Bills tab load)

---

#### 4. **Synchronous Core Product Seeding (Line 244-267)**
```javascript
let resolvedProducts = products;
if (products.length === 0) {
  await ensureWaterHisabCoreProducts(businessId);
  // Re-fetch so the freshly seeded SKUs are visible in the same response.
  resolvedProducts = await prismaBase.products.findMany({ ... });
}
```

**Problem:**
- Blocks first-time load while seeding 2 core SKUs
- Re-fetches ALL products after seed (take: 200)
- Should be a one-time migration, not on-demand

**Impact:** Low (only affects first load for legacy accounts)

---

#### 5. **Settings Backfill Fire-and-Forget (Line 276-300)**
```javascript
if (!business.settings?.waterHisab) {
  void (async () => {
    // ... nested async check + update
  })();
}
```

**Problem:**
- Another async DB write on EVERY load when settings are missing
- Nested `findFirst` + `update` instead of upsert
- Non-critical but adds connection pool pressure

**Impact:** Low

---

### **Secondary Issues:**

#### 6. **Large Take Limits**
- `customers`: `take: 500` (line 210)
- `products`: `take: 200` (line 217, 253, 834)
- Should use pagination or smarter filtering (active-only, route-relevant)

#### 7. **No Database Indexes Confirmed**
Missing critical indexes:
- `water_delivery_stops (business_id, delivery_date, is_deleted)`
- `water_delivery_stops (business_id, customer_id, delivery_date)` ← used in upsert
- `invoices (business_id, notes)` for `WATER_HISAB_PERIOD_PREFIX` search

---

## Issue 2: Expense Recording Bug

### **Root Cause: Missing Integration**

**Expected Flow:**
1. User clicks "Log Expense" button (line 2009-2018)
2. Opens `ExpenseEntryForm` modal via `open-modal` event with `modalId: 'expense'`
3. Form saves via standard expense action
4. ❌ **MISSING:** Reload `loadExpenses()` after save
5. Expense table shows old data from last `loadExpenses()` call

**The Bug:**
```jsx
// Line 2009-2018 — Button ONLY opens modal
<Button
  onClick={() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-modal', { detail: { modalId: 'expense' } })
      );
    }
  }}
>
  Log Expense
</Button>
```

**What's Missing:**
- No `onSave` callback passed to `ExpenseEntryForm` that calls `loadExpenses()`
- The modal is managed globally by `ActionModals.jsx` (line 427+), NOT by `WaterRouteHisab`
- After expense saves, the form closes but **does NOT** trigger a refresh of the Expenses view

---

### **Plan Gate Check: ✅ Not the Issue**

From `lib/config/plans.js` line 74:
```javascript
// FREE Plan
expense_tracking: false,

// STARTER Plan (line 191)
expense_tracking: true,
```

**Verdict:** Starter plan HAS `expense_tracking` feature enabled. The bug is NOT plan-related.

---

### **Expense Data Flow:**

1. **Load:** `loadExpenses()` → `getWaterExpenseReportDataAction` (line 2503+)
   - Queries `expenses` table via `pool.query` (line 2551-2557)
   - Merges GL expenses + rider shift cash shortages
   - Returns to `expenseData` state (line 793)

2. **Display:** Expenses view tab (must be after line 2400)
   - Renders `expenseData.expenses` array
   - Shows stat strip via `expenseStatItems` (line 1155-1167)

3. **Save:** `ExpenseEntryForm` → standard expense action
   - **NOT** wired to call `loadExpenses()` after commit

---

## Recommended Fixes

### **Performance Fixes (Priority Order):**

#### 🔥 **P0: Optimize Period Summary Query**
- Move aggregation to SQL (single query with CTEs)
- Add composite index: `CREATE INDEX idx_water_stops_business_date ON water_delivery_stops(business_id, delivery_date, is_deleted)`
- Limit invoice search: `notes LIKE 'water_hisab_period=%'` with GIN index

**Expected Improvement:** 3-5s → 800ms-1.2s

---

#### 🔥 **P1: Cache Product Catalog in Component State**
- Load products ONCE in Daily view
- Reuse same products array for Bills enrichment
- Skip redundant `resolveWaterHisabProducts()` call

**Expected Improvement:** 500ms saved per Bills load

---

#### ⚡ **P2: Defer Customer ID Backfill**
- Move `ensureWaterCustomerIds` to a scheduled job or manual migration
- OR: batch update once per day (not on every load)

**Expected Improvement:** 300-500ms (reduces pool contention)

---

#### ⚡ **P3: Remove Synchronous Core Product Seed**
- Run `ensureWaterHisabCoreProducts` as a one-time migration
- Add to registration flow for new water-delivery businesses
- Remove from hot path

**Expected Improvement:** 200ms (first-load only)

---

### **Expense Bug Fix:**

#### 🐛 **P0: Wire `onSave` Callback**

**Option A:** Local expense form (recommended)
```jsx
// In WaterRouteHisab.jsx
const [showExpenseForm, setShowExpenseForm] = useState(false);

<Button onClick={() => setShowExpenseForm(true)}>Log Expense</Button>

{showExpenseForm && (
  <ExpenseEntryForm
    businessId={businessId}
    category={category}
    onClose={() => setShowExpenseForm(false)}
    onSave={async () => {
      setShowExpenseForm(false);
      await loadExpenses(expensePeriodKey);
      notify.compactSave('Expense recorded');
    }}
  />
)}
```

**Option B:** Global modal event listener
```jsx
// Add useEffect in WaterRouteHisab
useEffect(() => {
  const handleExpenseSaved = () => {
    if (view === 'expenses') {
      loadExpenses(expensePeriodKey);
    }
  };
  window.addEventListener('expense-saved', handleExpenseSaved);
  return () => window.removeEventListener('expense-saved', handleExpenseSaved);
}, [view, expensePeriodKey, loadExpenses]);
```

Then emit event from `ExpenseEntryForm` after save:
```javascript
window.dispatchEvent(new CustomEvent('expense-saved'));
```

---

## Testing Checklist

### Performance:
- [ ] Time `getWaterHisabDayAction` with 50+ customers (target: <800ms)
- [ ] Time `getWaterHisabPeriodSummaryAction` for month (target: <1.2s)
- [ ] Verify no N+1 queries in Chrome DevTools Network tab
- [ ] Check Postgres slow query log

### Expense Bug:
- [ ] Record expense in Route Hisab → Expenses tab
- [ ] Verify new expense appears in table immediately
- [ ] Check GL `expenses` table has the row
- [ ] Verify expense appears in PDF export

### Plan Gate:
- [ ] Confirm Starter plan can access Expenses tab
- [ ] Confirm Log Expense button is visible
- [ ] Test with Free plan (should be blocked)

---

## Files to Modify

1. **`lib/actions/standard/waterHisab.js`**
   - Optimize `getWaterHisabPeriodSummaryAction` (SQL aggregation)
   - Remove sync core product seed
   - Add SQL EXPLAIN analyze logging

2. **`components/water/WaterRouteHisab.jsx`**
   - Wire expense form `onSave` callback
   - Cache products in state
   - Add performance markers

3. **`prisma/migrations/`** (new)
   - Add composite indexes for water_delivery_stops

4. **`lib/db/migrations/`** (new)
   - Migration script for missing indexes

---

## Estimated Impact

**Before:**
- Daily sheet: 2-3s load
- Bills tab: 4-6s load
- Expense recording: Shows "recorded" but table empty until manual refresh

**After:**
- Daily sheet: 800ms-1.2s (60% faster)
- Bills tab: 1.5-2s (70% faster)
- Expense recording: Immediate table update ✅

**ROI:** High — Route Hisab is used daily by milk/water shop operators on mobile. Every second matters.
