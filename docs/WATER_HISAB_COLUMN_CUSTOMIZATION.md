# Water Hisab Column Customization Guide

> ⚠️ **FIRST: Fix Duplicate Products**
> 
> If you're seeing **7+ columns for the same size** (19L REFILL, 19L Fresh Refill, 19L Pure Refill, 19L BOT, 19L BOTTLE, 19L PCS, 19L SET), this means you have **duplicate products in your database**.
>
> **Best solution:** Delete the duplicates (5 minutes)
> 
> → **[Water Hisab Quick Start Guide](./WATER_HISAB_QUICK_START.md)** ← Start here!
>
> This document explains column customization, but **database cleanup should be done first** for best results.

---

**Purpose**: Choose which products appear as columns in your daily delivery sheet  
**Use Case**: Most businesses only need 2-3 columns (Refill + Bottle)  
**Benefit**: Clean, focused daily sheet without unnecessary columns

---

## 📋 Understanding Column Types

### What Each Column Means

| Column Type | Real-World Meaning | When to Use | Example |
|-------------|-------------------|-------------|---------|
| **19L REFILL** | Exchange empty for full bottle | ✅ **ALWAYS NEEDED** | Customer returns empty, gets full bottle |
| **19L BOTTLE (BOT)** | Brand new bottle with deposit | ✅ **Usually needed** | New customer or bottle replacement |
| **19L PCS** | Individual pieces (vague) | ❌ Redundant - use Refill | Not recommended |
| **19L CASE** | Bulk/wholesale (6-12 bottles) | ⚠️ **Optional** | Restaurants, offices, bulk orders |
| **19L SET** | Bundle/package deal | ❌ Rarely needed | Special promotions only |

### 💡 **Recommended Setups**

**Standard Water Delivery Business (Most Common)**:
```
Column 1: 19L (Rfl)  - Daily refills
Column 2: 19L (Bot)  - New bottle sales
```

**Business with Wholesale Orders**:
```
Column 1: 19L (Rfl)  - Daily refills
Column 2: 19L (Bot)  - New bottle sales  
Column 3: 19L (Case) - Bulk orders
```

**Multi-Size Business**:
```
Column 1: 19L (Rfl)  - 19L refills
Column 2: 19L (Bot)  - 19L bottles
Column 3: 12L (Rfl)  - 12L refills
Column 4: 6L (Rfl)   - 6L refills
```

---

## 🎛️ How to Customize Columns

### Method 1: Database Settings (Current - Admin Only)

**Location**: Business Settings in Database

```sql
-- Set custom product IDs for columns
UPDATE businesses
SET settings = jsonb_set(
  settings,
  '{waterHisab,productIds}',
  '["product-id-1", "product-id-2"]'::jsonb
)
WHERE id = 'your-business-id';
```

**Steps**:
1. Get product IDs you want to show:
   ```sql
   SELECT id, name, category, unit
   FROM products
   WHERE business_id = 'your-business-id'
     AND is_deleted = false
     AND is_active = true
   ORDER BY name;
   ```

2. Pick 2-3 product IDs (Refill + Bottle minimum)

3. Update settings with those IDs

4. System will show ONLY those products as columns

### Method 2: UI Settings Panel (Recommended - Coming Soon)

**Location**: Settings → Water Delivery → Sheet Columns

**Features**:
- ✅ Visual product selector
- ✅ Drag-and-drop column reordering
- ✅ Live preview of daily sheet
- ✅ Save/reset buttons
- ✅ Max 8 columns enforced
- ✅ Auto-detection of duplicates

**Screenshot**:
```
┌────────────────────────────────────────────────┐
│  Available Products     │  Selected Columns    │
├─────────────────────────┼──────────────────────┤
│  □ 19L Refill          │  ☰ 19L Refill    [×] │
│  □ 19L Bottle          │  ☰ 19L Bottle    [×] │
│  □ 19L Case            │                      │
│  □ 12L Refill          │  [Preview]           │
│  □ 6L Refill           │  19L Rfl | 19L Bot   │
│                        │  Del|Rec | Del|Rec   │
└─────────────────────────┴──────────────────────┘
   [Reset to Auto]              [Save Settings]
```

---

## 🔧 Method 3: Clean Up Database Products (Best Long-Term Solution)

### Why This Matters

If you have 7 different "19L" products in your database, you'll keep getting duplicate columns even with the fix.

**Best Practice**: Keep ONLY the products you actually need.

### Step 1: Audit Your Products

```sql
SELECT id, name, category, unit, price, is_active
FROM products  
WHERE business_id = 'your-business-id'
  AND (name ILIKE '%19L%' OR name ILIKE '%19 L%')
  AND is_deleted = false
ORDER BY name;
```

**Example Result**:
```
ID                  NAME                UNIT    PRICE
prod-1              19L Refill          bottle  30
prod-2              19L Fresh Refill    bottle  30    ← DUPLICATE
prod-3              19L Pure Refill     bottle  30    ← DUPLICATE
prod-4              19L Bottle          bottle  400
prod-5              19L New Bottle      bottle  400   ← DUPLICATE
prod-6              19L Case (12)       case    350
prod-7              19L PCS             pcs     30    ← VAGUE
prod-8              19L SET             set     600   ← UNCLEAR
```

### Step 2: Identify What to Keep vs Delete

**Keep These**:
- ✅ **prod-1**: "19L Refill" - Main refill product
- ✅ **prod-4**: "19L Bottle" - New bottle with deposit
- ✅ **prod-6**: "19L Case (12)" - If you sell wholesale

**Delete These** (Duplicates/Unclear):
- ❌ **prod-2**: "19L Fresh Refill" - Same as prod-1
- ❌ **prod-3**: "19L Pure Refill" - Same as prod-1
- ❌ **prod-5**: "19L New Bottle" - Same as prod-4
- ❌ **prod-7**: "19L PCS" - Vague, use Refill instead
- ❌ **prod-8**: "19L SET" - Unclear purpose

### Step 3: Soft Delete Duplicates

```sql
-- Mark duplicates as deleted (keeps historical data)
UPDATE products
SET is_deleted = true, deleted_at = NOW()
WHERE id IN ('prod-2', 'prod-3', 'prod-5', 'prod-7', 'prod-8');
```

### Step 4: Verify Clean State

```sql
-- Should show only 2-3 products now
SELECT id, name, unit, price
FROM products
WHERE business_id = 'your-business-id'
  AND (name ILIKE '%19L%' OR name ILIKE '%19 L%')
  AND is_deleted = false;
```

**Expected**:
```
ID       NAME            UNIT    PRICE
prod-1   19L Refill      bottle  30
prod-4   19L Bottle      bottle  400
prod-6   19L Case (12)   case    350   (optional)
```

---

## 📊 Testing Your Customization

### Test 1: Verify Column Count

1. Clear cache: `rm -rf .next`
2. Restart dev server
3. Hard refresh browser (Ctrl + Shift + R)
4. Open Daily Route tab
5. Count product columns

**Expected**: 2-3 columns maximum

### Test 2: Verify Column Labels

**Should show**:
- ✅ 19L (Rfl) | Del | Rec
- ✅ 19L (Bot) | Del | Rec
- ✅ 19L (Case) | Del | Rec (if wholesale)

**Should NOT show**:
- ❌ 19L (PCS)
- ❌ 19L (SET)
- ❌ Duplicate BOT/BOTTLE
- ❌ Duplicate CAS/CASE

### Test 3: Verify Data Entry

1. Enter delivery quantities in columns
2. Save the daily sheet
3. Check saved data includes correct product IDs
4. Verify bills generate correctly

---

## 🎯 Customization Examples

### Example 1: Simple Refill-Only Business

**Use Case**: Only exchanges, no new bottle sales

**Database**:
```sql
-- Keep only refill product
DELETE FROM products
WHERE business_id = 'your-business-id'
  AND name LIKE '%Bottle%' 
  AND name NOT LIKE '%Refill%';
```

**Result**: Single column
```
19L (Rfl)
Del | Rec
```

### Example 2: Refill + New Bottles (Standard)

**Use Case**: Daily exchanges + occasional new customer bottles

**Database**: Keep both
- 19L Refill (exchange)
- 19L Bottle (new + deposit)

**Result**: Two columns
```
19L (Rfl)     | 19L (Bot)
Del | Rec     | Del | Rec
```

### Example 3: Refill + Bottles + Wholesale

**Use Case**: Homes + restaurants/offices

**Database**: Keep three
- 19L Refill (daily routes)
- 19L Bottle (new customers)
- 19L Case (bulk orders 6-12 bottles)

**Result**: Three columns
```
19L (Rfl)  | 19L (Bot)  | 19L (Case)
Del | Rec  | Del | Rec  | Del | Rec
```

### Example 4: Multi-Size Business

**Use Case**: Offering 19L, 12L, and 6L sizes

**Database**: Keep one refill per size
- 19L Refill
- 12L Refill
- 6L Refill

**Result**: Three columns
```
19L (Rfl)  | 12L (Rfl)  | 6L (Rfl)
Del | Rec  | Del | Rec  | Del | Rec
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Too Many Similar Products

**Bad**:
```sql
-- Having 5 refill products
19L Refill
19L Fresh Refill
19L Pure Refill
19L Mineral Refill
19L Spring Refill
```

**Good**:
```sql
-- One refill product
19L Refill
```

**Why**: They're all the same thing - just exchange bottles.

### ❌ Mistake 2: Vague Product Names

**Bad**:
```sql
19L PCS
19L SET
19L UNIT
```

**Good**:
```sql
19L Refill  (for exchange)
19L Bottle  (for new bottle + deposit)
19L Case    (for bulk orders)
```

**Why**: Clear names prevent confusion.

### ❌ Mistake 3: Using All Columns

**Bad**: Showing all 8 possible columns even if you don't need them

**Good**: Showing only 2-3 columns you actually use

**Why**: Cleaner UI, faster data entry, fewer mistakes.

---

## 🔄 How Auto-Selection Works (When No Custom Settings)

If you **don't** set custom product IDs, the system automatically selects columns using this priority:

### Priority Order

1. **Hint-Based Selection** (Preferred)
   - Looks for products matching "19L Refill" pattern
   - Looks for products matching "19L Bottle" pattern
   - Looks for products matching "19L Case" pattern
   - Uses first match for each pattern

2. **Size-Group Filtering**
   - Only products matching enabled size groups (19L, 15L, 12L, etc.)
   - Respects Settings → Enabled Sizes

3. **Smart Deduplication**
   - Removes products with identical base names
   - Normalizes abbreviations (BOT→BOTTLE, CAS→CASE)
   - Keeps max 8 columns

### Auto-Selection Example

**Your Products**:
```
1. 19L Refill
2. 19L Fresh Refill (similar to #1)
3. 19L Bottle
4. 19L New Bottle (similar to #3)
5. 19L Case
6. 12L Refill
7. 6L Refill
8. 1.5L Case (12)
```

**Auto-Selected Columns** (with our fixes):
```
1. 19L (Rfl)   - First refill match
2. 19L (Bot)   - First bottle match  
3. 19L (Case)  - Case match
4. 12L (Rfl)   - 12L refill
5. 6L (Rfl)    - 6L refill
```

**Skipped** (as duplicates):
- 19L Fresh Refill (duplicate of #1)
- 19L New Bottle (duplicate of #3)

---

## 💾 Settings Database Schema

### Current Schema

```javascript
// business.settings structure
{
  waterHisab: {
    // Custom product IDs (if set, overrides auto-selection)
    productIds: ['uuid-1', 'uuid-2', 'uuid-3'],
    
    // Enabled size groups (19L, 15L, 12L, etc.)
    enabledSizeIds: ['19l', '12l', '6l'],
    
    // Other hisab settings...
  }
}
```

### Example Settings

**Minimal (Refill + Bottle only)**:
```json
{
  "waterHisab": {
    "productIds": [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002"
    ]
  }
}
```

**With Wholesale**:
```json
{
  "waterHisab": {
    "productIds": [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002",
      "550e8400-e29b-41d4-a716-446655440003"
    ]
  }
}
```

**Auto (Empty - Let System Choose)**:
```json
{
  "waterHisab": {
    "productIds": []
    // or omit entirely
  }
}
```

---

## 📝 Summary

### ✅ **Recommended Approach**

1. **Clean up database products** - Delete duplicates
2. **Keep only 2-3 products** - Refill + Bottle (+ Case if needed)
3. **Let auto-selection work** - Don't set custom IDs unless needed
4. **Test thoroughly** - Clear cache, restart, verify columns

### 🎯 **Most Businesses Need**

```
Column 1: 19L Refill  (exchange empty for full)
Column 2: 19L Bottle  (new bottle + deposit)
```

That's it! Simple, clean, effective.

### 🔮 **Future Enhancement**

UI panel in Settings to:
- ✅ Visual product selector (drag and drop)
- ✅ Live preview
- ✅ Save/reset buttons
- ✅ Column reordering

---

## 🆘 Need Help?

### Check Current Settings

```sql
SELECT 
  id,
  business_name,
  settings->'waterHisab'->'productIds' as column_products,
  settings->'waterHisab'->'enabledSizeIds' as enabled_sizes
FROM businesses
WHERE id = 'your-business-id';
```

### Reset to Auto

```sql
UPDATE businesses
SET settings = settings #- '{waterHisab,productIds}'
WHERE id = 'your-business-id';
```

### Contact Support

If columns still show duplicates after:
1. Clearing cache
2. Restarting server
3. Database cleanup

Provide:
- Business ID
- Screenshot of columns
- Product list SQL result

---

**Last Updated**: 2026-08-06  
**Status**: ✅ Fully Documented
