# Water Hisab Missing 19L Columns - Diagnostic Guide

## Issue Report
**Date**: January 8, 2026  
**Reporter**: User  
**Issue**: New water-delivery business in Starter plan cannot see 19L bottle columns (Del/Rec) in daily sheet

---

## Expected Behavior

For a NEW water-delivery business:
1. ✅ Registration should seed 19L products (`19L Mineral Water (Refill)`, `19L New Bottle + First Fill`)
2. ✅ Settings should default to `enabledSizeIds: ['19l']`
3. ✅ Daily sheet should show 19L columns with Del/Rec

---

## System Architecture

### Default Configuration
```javascript
// lib/storefront/waterShopHisab.js

WATER_HISAB_SIZE_GROUPS = [
  { id: '19l', label: '19L', match: /19\s*l/i, defaultEnabled: true },  // ✅ Enabled by default
  { id: '12l', label: '12L', match: /12\s*l/i, defaultEnabled: false },
  { id: '5l', label: '5L', match: /5\s*l\b/i, defaultEnabled: false },
  { id: 'pet', label: 'PET / Cases', match: /..., defaultEnabled: false },
  { id: 'deposit', label: 'Deposit', match: /..., defaultEnabled: false },
  { id: 'stand', label: 'Stand', match: /..., defaultEnabled: false },
];

WATER_HISAB_DEFAULT_ENABLED_SIZES = ['19l']; // Only 19L enabled
```

### Registration Seed Products
```javascript
// lib/dataLab/waterShopDemoCatalog.js

WATER_SHOP_SEED_PRODUCTS = [
  {
    name: '19L Mineral Water (Refill)',
    category: '19L Dispenser',
    sku: 'WTR-19L-REFILL-01',
    unit: 'bottle',
    price: 150,
    stock: 400,
  },
  {
    name: '19L New Bottle + First Fill',
    category: '19L Dispenser',
    sku: 'WTR-19L-NEW-02',
    unit: 'bottle',
    price: 950,
    stock: 80,
  },
  // ... more products
];
```

### Product Resolution Flow
```
getWaterHisabDayAction()
  ↓
prismaBase.products.findMany({ business_id, is_deleted: false, is_active: true })
  ↓
resolveWaterHisabProducts(products, business.settings || {})
  ↓
readWaterHisabEnabledSizeIds(settings)
  ↓
Returns ['19l'] when settings empty
  ↓
Filters products matching /19\s*l/i regex
  ↓
Returns matched products as columns
```

---

## Diagnostic Checklist

### 1. Verify Registration Seed
**Check**: Did the business get seeded products during registration?

```sql
-- Run in database
SELECT 
  id, 
  name, 
  sku, 
  category, 
  is_active, 
  is_deleted,
  stock
FROM products
WHERE business_id = '<business_id>'
  AND (name ILIKE '%19L%' OR category ILIKE '%19L%')
ORDER BY name;
```

**Expected**: Should return 2 rows:
- `19L Mineral Water (Refill)` - SKU: WTR-19L-REFILL-01
- `19L New Bottle + First Fill` - SKU: WTR-19L-NEW-02

**If EMPTY**: Registration seed failed ❌
**If EXISTS**: Continue to step 2 ✅

---

### 2. Verify Product Active Status
**Check**: Are the products marked as active?

```sql
SELECT 
  id,
  name,
  is_active,
  is_deleted
FROM products
WHERE business_id = '<business_id>'
  AND (name ILIKE '%19L%' OR category ILIKE '%19L%');
```

**Expected**:
- `is_active = true` ✅
- `is_deleted = false` ✅

**If INACTIVE**: Product was deactivated ❌
**If DELETED**: Product was deleted ❌

---

### 3. Verify Business Settings
**Check**: What are the current `enabledSizeIds` in business settings?

```sql
SELECT 
  id,
  business_name,
  category,
  settings
FROM businesses
WHERE id = '<business_id>';
```

**Check `settings` JSON**:
```json
{
  "waterHisab": {
    "enabledSizeIds": ["19l"]  // ✅ Should contain '19l'
  }
}
```

**Possible Issues**:
1. `settings` is `NULL` or `{}` → Should default to `['19l']` ✅
2. `settings.waterHisab.enabledSizeIds` is `[]` → No sizes enabled ❌
3. `settings.waterHisab.enabledSizeIds` is `['12l', '5l']` → Wrong sizes ❌

---

### 4. Check Product Name/Category Pattern
**Check**: Do product names match the 19L regex `/19\s*l/i`?

Test patterns:
- ✅ `19L Mineral Water` → MATCH
- ✅ `19l refill` → MATCH
- ✅ `19 L Bottle` → MATCH (space allowed)
- ❌ `Nineteen Liter` → NO MATCH
- ❌ `Large Bottle` → NO MATCH

If products have generic names like "Water Bottle" or "Refill", they won't match.

---

### 5. Verify Size Group Resolution
**Check**: Does `resolveWaterHisabProductSizeGroup()` correctly identify products?

```javascript
// Test in browser console on water hisab page
const testProduct = {
  name: '19L Mineral Water (Refill)',
  category: '19L Dispenser',
};

const blob = `${testProduct.name} ${testProduct.category}`;
console.log('Blob:', blob);

// Test regex
const regex = /19\s*l/i;
console.log('Matches 19L regex:', regex.test(blob)); // Should be true
```

---

### 6. Check Daily Sheet API Response
**Check**: What products are returned by `getWaterHisabDayAction`?

**In browser console**:
```javascript
// Open Water Route Hisab → Daily Sheet
// Open Network tab
// Look for API call to /api/.../water-hisab/day?date=...

// Response should include:
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "...",
        "name": "19L Mineral Water (Refill)",
        "hisabShortLabel": "19L Refill",
        "unit": "bottle",
        "price": 150,
        "sizeGroup": "19l"  // ✅ Should be '19l'
      },
      // ... more products
    ],
    "enabledSizeIds": ["19l"],  // ✅ Should contain '19l'
    "enabledColumns": ["delivered", "received"],
    "rows": [ /* customer rows */ ]
  }
}
```

**If `products` is EMPTY**: Product resolution failed ❌  
**If `products` has items but `sizeGroup` is `null`**: Pattern matching failed ❌  
**If `enabledSizeIds` doesn't include `'19l'`**: Settings issue ❌

---

## Common Root Causes

### 1. **Products Not Seeded** ❌
**Symptom**: Database has no 19L products  
**Cause**: Registration seed didn't run or failed  
**Fix**: Manually add products or re-run registration seed

### 2. **Products Deactivated/Deleted** ❌
**Symptom**: Products exist but `is_active = false` or `is_deleted = true`  
**Cause**: User accidentally deactivated products  
**Fix**: Reactivate products in inventory

### 3. **Wrong Size Group Selected** ❌
**Symptom**: Settings has `enabledSizeIds: ['12l']` instead of `['19l']`  
**Cause**: User changed settings accidentally  
**Fix**: Reset settings or select 19L in hisab settings

### 4. **Generic Product Names** ❌
**Symptom**: Products named "Water Bottle" without "19L" in name/category  
**Cause**: User renamed products after registration  
**Fix**: Add "19L" to product names or categories

### 5. **Empty Settings Not Defaulting** ❌
**Symptom**: Settings is `{}` but not returning default `['19l']`  
**Cause**: Logic bug in `readWaterHisabEnabledSizeIds`  
**Fix**: Code fix needed (unlikely - function looks correct)

---

## Quick Fix Guide

### For User (Business Owner)

**If products exist but columns missing:**

1. Go to **Water Route Hisab → Settings** (gear icon in toolbar)
2. Look for **"Product Sizes"** or **"Enabled Sizes"** section
3. Ensure **"19L"** checkbox is **checked** ✅
4. Click **Save**
5. Refresh the daily sheet

**If products don't exist:**

1. Go to **Inventory → Products**
2. Click **Add Product**
3. Create: `19L Mineral Water (Refill)`
   - Category: `19L Dispenser`
   - Unit: `bottle`
   - Price: 150 (or your rate)
   - Stock: 100+
4. Save and return to Water Hisab

---

### For Developer (Platform Admin)

**Quick SQL Fix** (if products missing):

```sql
-- Insert 19L products for business
INSERT INTO products (
  id,
  business_id,
  name,
  category,
  sku,
  unit,
  price,
  cost_price,
  stock,
  is_active,
  is_deleted,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '<business_id>',
  '19L Mineral Water (Refill)',
  '19L Dispenser',
  'WTR-19L-REFILL-01',
  'bottle',
  150,
  83,
  400,
  true,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '<business_id>',
  '19L New Bottle + First Fill',
  '19L Dispenser',
  'WTR-19L-NEW-02',
  'bottle',
  950,
  523,
  80,
  true,
  false,
  NOW(),
  NOW()
);
```

**Reset Settings** (if wrong sizes):

```sql
-- Reset water hisab settings to defaults
UPDATE businesses
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{waterHisab,enabledSizeIds}',
  '["19l"]'::jsonb
)
WHERE id = '<business_id>';
```

---

## Prevention Checklist

To prevent this issue for future water-delivery registrations:

1. ✅ Verify `water-delivery` in `REGISTRATION_RICH_CATALOG_VERTICALS`
2. ✅ Verify `WATER_SHOP_SEED_PRODUCTS` contains 19L products
3. ✅ Verify `WATER_HISAB_DEFAULT_ENABLED_SIZES = ['19l']`
4. ✅ Add registration verification test
5. ✅ Add post-registration health check

---

## Code References

### Key Files
- **Seed Catalog**: `lib/dataLab/waterShopDemoCatalog.js`
- **Size Config**: `lib/storefront/waterShopHisab.js`
- **Registration**: `lib/onboarding/registrationRichVerticals.js`
- **Day Action**: `lib/actions/standard/waterHisab.js`
- **Component**: `components/water/WaterRouteHisab.jsx`

### Key Functions
- `resolveWaterHisabProducts()` - Filters products by enabled sizes
- `readWaterHisabEnabledSizeIds()` - Reads settings with ['19l'] default
- `resolveWaterHisabProductSizeGroup()` - Matches product names to size groups
- `getWaterHisabDayAction()` - Fetches day data with product columns

---

## Next Steps

1. **Immediate**: Get the specific `business_id` from user
2. **Run diagnostic SQL** to identify root cause
3. **Apply fix** based on findings
4. **Verify** columns appear in daily sheet
5. **Document** actual root cause for knowledge base

---

**Status**: 🔍 Awaiting business ID for diagnostics  
**Priority**: High (blocks daily operations)  
**Impact**: Cannot record deliveries without visible columns
