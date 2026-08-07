# Water Hisab Quick Start Guide

## Fix Duplicate Columns (5 Minutes)

### Problem
Daily sheet shows **too many columns** (7+ for same size)?

Example: 19L REFILL, 19L BOTTLE, 19L (BOT), 19L PCS, 19L CASE, 19L (CAS), 19L SET

### Solution (3 Steps)

#### Step 1: Check What You Have
```bash
# Option 1: Using standalone script (recommended - faster)
node --env-file=.env scripts/audit-water-products-standalone.mjs <business-id>

# Option 2: Using tsx (if standalone has issues)
npx tsx scripts/audit-water-products.mjs <business-id>
```

This shows:
- 🔵 Products to KEEP
- ❌ Products to DELETE (duplicates/vague)
- Reasons for each

#### Step 2: Delete Duplicates
```bash
# Option 1: Using standalone script (recommended)
node --env-file=.env scripts/audit-water-products-standalone.mjs <business-id> --delete

# Option 2: Using tsx
npx tsx scripts/audit-water-products.mjs <business-id> --delete
```

Safe to run - only marks as deleted (recoverable).

#### Step 3: Verify
Open **Hub → Route Hisab → Daily Route**

Should now show only **2-3 columns per size:**
- ✅ 19L Refill (exchange)
- ✅ 19L Bottle (new + deposit)
- ✅ 19L Case (optional - wholesale)

### Done! ✅

---

## Product Types Explained

| Type | Price | Use Case | Keep? |
|------|-------|----------|-------|
| **REFILL** | ~60 PKR | Customer returns empty, gets refilled | ✅ YES |
| **BOTTLE** | ~1200 PKR | New bottle + deposit | ✅ YES |
| **CASE** | Bulk price | Wholesale (12-pack, 24-pack) | 🟡 Optional |
| **PCS** | ??? | Vague - unclear purpose | ❌ DELETE |
| **SET** | ??? | Vague - unclear purpose | ❌ DELETE |

---

## Size Filters (Already Work)

After cleanup, use existing size filter buttons:

**[19L]** - Most common (home delivery) ← Click to show/hide  
**[12L]** - Optional  
**[5L]** - Optional  
**[PET / Cases]** - Retail bottles  
**[Deposit]** - Security deposits  
**[Stand]** - Dispensers

No need for extra filters when products are clean!

---

## Common Scenarios

### "I have 3 types of 19L Refill"
**Problem:** 19L Refill, 19L Fresh Refill, 19L Pure Refill (all same thing)

**Fix:** Script keeps best one (with stock/price/SKU), deletes rest

### "What's the difference between BOT and BOTTLE?"
**Answer:** Same thing! BOT = abbreviation of BOTTLE

**Fix:** Script normalizes abbreviations, keeps only one

### "Should I delete CASE or CASE (CAS)?"
**Answer:** Keep "CASE" (full word), delete "CAS" (abbreviation)

**Fix:** Script does this automatically

### "I only deliver 19L, hide everything else"
**Answer:** Use size filter [19L] button (already exists)

**Fix:** No script needed - just click size filter

---

## Audit All Businesses

Check all water stores at once:
```bash
# Option 1: Standalone
node --env-file=.env scripts/audit-water-products-standalone.mjs --all

# Option 2: Using tsx
npx tsx scripts/audit-water-products.mjs --all
```

Shows summary for each business.

---

## Help

**Full guide:** `docs/WATER_PRODUCT_CLEANUP_GUIDE.md`  
**Solution doc:** `docs/WATER_HISAB_COLUMN_DUPLICATION_SOLUTION.md`  
**Customization:** `docs/WATER_HISAB_COLUMN_CUSTOMIZATION.md`

**Manual SQL:**
```sql
-- See all products
SELECT id, name, price, stock 
FROM products 
WHERE business_id = 'xxx' 
  AND is_deleted = false 
  AND name ILIKE '%19L%';

-- Delete duplicates
UPDATE products 
SET is_deleted = true, is_active = false
WHERE id IN ('prod-2', 'prod-3', 'prod-7', 'prod-8');
```

---

## Why This Approach?

| Method | Result |
|--------|--------|
| ✅ **Delete duplicates** | Clean data everywhere (sheet, billing, reports) |
| ❌ Add UI filters | Band-aid, duplicates still in database |
| ❌ Do nothing | Problem persists, confusion continues |

**Bottom line:** Fix the root cause (duplicate products), not the symptom (too many columns).

---

**Ready?** Run the audit script now:
```bash
# Recommended (standalone - no dependencies)
node --env-file=.env scripts/audit-water-products-standalone.mjs <your-business-id>

# Alternative (using tsx)
npx tsx scripts/audit-water-products.mjs <your-business-id>
```
