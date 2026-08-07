# Water Product Cleanup Guide

## Problem: Duplicate Columns in Daily Sheet

When the daily sheet shows **7 columns for 19L water** with duplicates like:
- 19L REFILL
- 19L BOTTLE
- 19L (BOT) ← duplicate of BOTTLE
- 19L (PCS) ← vague
- 19L (CAS) ← should be CASE
- 19L (CASE) ← duplicate
- 19L (SET) ← vague

This happens because:
1. **Database has too many similar products** (19L Refill, 19L Fresh Refill, 19L Pure Refill = all the same)
2. **Vague products exist** (PCS, SET, KIT) that have unclear purpose
3. **Abbreviations aren't normalized** before counting (BOT vs BOTTLE, CAS vs CASE)

## Solution: Database Cleanup (Best Practice)

The cleanest solution is to **delete duplicate products from the database** rather than adding complex filters.

### Step 1: Audit Current Products

Run the audit script to see what you have:

```bash
npx tsx scripts/audit-water-products.mjs <business-id>
```

Example output:
```
📦 19L Products (7):
────────────────────────────────────────────────────────────────────────────────
🔵 19L Refill
   ID: prod-1
   Type: REFILL - Exchange/Refill (customer returns empty)
   Price: 60, Stock: 100, SKU: 19L-RFL
   Score: 1000 (lower = better)

🔵 19L Fresh Refill
   ID: prod-2
   Type: REFILL - Exchange/Refill (customer returns empty)
   Price: 60, Stock: 0, SKU: none
   Score: 1512 (lower = better)

⚠️  Found 1 duplicate group(s):

   ✅ KEEP: 19L Refill (ID: prod-1)
      Score: 1000, Type: REFILL
   
   ❌ DELETE: 19L Fresh Refill (ID: prod-2)
      Reason: Duplicate of "19L Refill"
      Score: 1512
   
   ❌ DELETE: 19L Pure Refill (ID: prod-3)
      Reason: Duplicate of "19L Refill"
      Score: 1515
```

### Step 2: Review Recommendations

The script categorizes products:

| Icon | Type | Priority | Description |
|------|------|----------|-------------|
| 🔵 | REFILL | Keep | Exchange/Refill (customer returns empty) |
| 🟢 | NEW_BOTTLE | Keep | New Bottle (includes bottle deposit) |
| 🟡 | CASE | Optional | Case/Pack (wholesale only) |
| 🔴 | VAGUE | Delete | PCS/SET/KIT (unclear purpose) |

**Scoring** (lower = better to keep):
- Has stock: -500 points
- Has price: -200 points
- Has SKU: -100 points
- Shorter name: +length points (prefer "19L Refill" over "19L Fresh Pure Mineral Refill")

### Step 3: Delete Duplicates

**DRY RUN** (safe - shows what would be deleted):
```bash
npx tsx scripts/audit-water-products.mjs <business-id>
```

**ACTUAL DELETE** (removes duplicates):
```bash
npx tsx scripts/audit-water-products.mjs <business-id> --delete
```

### Step 4: Verify Daily Sheet

After cleanup, the daily sheet should show only **2-3 columns per size**:
- ✅ **19L Refill** (exchange - customer returns empty)
- ✅ **19L Bottle** (new bottle - includes deposit)
- ✅ **19L Case** (optional - wholesale/bulk only)

## Understanding Product Types

### 1. REFILL / EXCHANGE
**What it is:** Customer returns empty bottle, gets refilled bottle
**Pricing:** Lower (just water cost, ~PKR 60)
**Keywords:** refill, rfl, exchange
**Use case:** Regular home delivery customers

### 2. NEW BOTTLE / DISPENSER
**What it is:** Customer buys bottle + dispenser (first time or replacement)
**Pricing:** Higher (water + bottle deposit, ~PKR 1200-1500)
**Keywords:** bottle, new, dispenser, gallon, can
**Use case:** New customers, broken bottle replacement

### 3. CASE / PACK (Optional)
**What it is:** Bulk wholesale orders (12-pack, 24-pack cases)
**Pricing:** Bulk discount pricing
**Keywords:** case, pack, box, crate
**Use case:** Restaurants, offices, wholesale customers

### 4. VAGUE (Should Delete)
**What it is:** Unclear product types (PCS, SET, KIT)
**Problem:** Confusing for riders and operators
**Keywords:** pcs, set, kit, unit
**Action:** Delete and use Refill/Bottle instead

## Most Common Setup

**Typical water business needs only 2 products per size:**

```
19L Refill    (60 PKR)  - daily home delivery
19L Bottle    (1200 PKR) - new customer deposit

12L Refill    (45 PKR)  - optional
12L Bottle    (900 PKR) - optional

5L Refill     (30 PKR)  - optional
5L Jug        (400 PKR) - optional
```

## Audit All Businesses

To check all water delivery businesses:

```bash
npx tsx scripts/audit-water-products.mjs --all
```

## Manual Cleanup (Alternative)

If you prefer SQL cleanup:

```sql
-- 1. Find duplicates
SELECT 
  id,
  name,
  price,
  stock,
  sku,
  created_at
FROM products
WHERE business_id = 'your-business-id'
  AND is_deleted = false
  AND name ILIKE '%19L%'
ORDER BY name, created_at;

-- 2. Delete specific products (by ID)
UPDATE products 
SET is_deleted = true, is_active = false
WHERE id IN (
  'prod-2',  -- 19L Fresh Refill (duplicate)
  'prod-3',  -- 19L Pure Refill (duplicate)
  'prod-5',  -- 19L New Bottle (duplicate)
  'prod-7',  -- 19L PCS (vague)
  'prod-8'   -- 19L SET (vague)
)
AND business_id = 'your-business-id';
```

## After Cleanup

Once duplicates are deleted, the system will:
1. ✅ Show only 2-3 columns per size (Refill + Bottle + optional Case)
2. ✅ No duplicate column labels
3. ✅ Clear rider daily sheets
4. ✅ Accurate daily totals
5. ✅ Fast data entry (less scrolling)

The existing **Size Filters** (19L, 12L, 5L, PET, Deposit, Stand) work perfectly after cleanup to show/hide entire size groups.

## Size Filter Recommendations

After cleanup, use size filters to control daily sheet:

- **19L only** → Most common (home delivery)
- **19L + 12L** → Some areas offer both
- **19L + PET** → Retail + home delivery
- **All sizes** → Full product range (may be too wide)

The size filters already exist and work well when products are clean.

## Summary

✅ **DO THIS**: Delete duplicate products from database (cleanest solution)
❌ **DON'T DO**: Add more filters/toggles to hide duplicates (band-aid)

The script makes cleanup **safe, auditable, and repeatable** across all water businesses.
