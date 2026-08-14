# Construction Domain Integration - Root Cause Analysis & Fix Summary

## Executive Summary

The Server Components render errors after construction domain integration are caused by **SQL column mismatches** between the Prisma schema and queries in the codebase. The Prisma schema was updated during integration, but several action files and seed scripts still reference old column names that no longer exist.

## Root Causes Identified

### 1. **Machinery Logs Column Mismatch** (CRITICAL)
**Location**: `lib/actions/dashboard/domainOperationsSnapshot.js:456`

**Problem**:
```javascript
`SELECT COALESCE(SUM(hours_worked), 0) AS hours_this_month
 FROM machinery_logs
 WHERE business_id = $1::uuid
   AND log_date >= date_trunc('month', CURRENT_DATE)`
```

**Root Cause**: The `hours_worked` column was **dropped** from `machinery_logs` table during schema refactoring. The new schema uses:
- `start_hours` (Decimal)
- `end_hours` (Decimal)
- Hours worked is computed as `end_hours - start_hours`

**Impact**: This query runs during domain operations snapshot for construction businesses, causing a PostgreSQL error:
```
ERROR: column "hours_worked" does not exist
```

---

### 2. **BOQ Items Column Mismatch** (CRITICAL)
**Columns dropped**:
- `estimated_total`
- `actual_total`

**New Schema**: These were computed columns. Now use:
- `estimated_qty * estimated_rate` for estimated total
- `actual_qty * actual_rate` for actual total

**Potential Impact**: Any query or component referencing these columns will fail.

---

### 3. **Seed Data Using Old Schema** (HIGH)
**Location**: `lib/dataLab/constructionOperationsSeed.js:557-613`

**Problem**: Seed data still references `hours_worked`:
```javascript
{
  equipment_code: 'EXC-001',
  log_date: '2026-08-12',
  hours_worked: 9.5,  // ❌ Column no longer exists
  operator_name: 'Muhammad Akram',
  ...
}
```

**Impact**: Construction demo/seed data will fail to insert.

---

### 4. **Hub Configuration Reference** (MEDIUM)
**Location**: `lib/config/constructionHubNav.js:349`

```javascript
{
  id: 'machinery-fleet-hours',
  label: 'Fleet Hours (This Month)',
  type: 'number',
  source: 'machinery_logs',
  aggregation: 'sum',
  field: 'hours_worked',  // ❌ Column no longer exists
  filter: 'current_month',
}
```

---

### 5. **Computed Fields in Actions** (MEDIUM)
**Location**: `lib/actions/construction/machinery.js:285-286`

```javascript
avg_fuel_per_hour: equipment.total_hours > 0 
  ? equipment.total_fuel / equipment.total_hours 
  : 0,
avg_output_per_hour: equipment.total_hours > 0 
  ? equipment.total_output / equipment.total_hours 
  : 0,
```

These computed fields reference dropped columns (`fuel_per_hour`, `output_per_hour`).

---

## Schema Change Summary

### `machinery_logs` Table Changes

**BEFORE (Old Schema)**:
```prisma
model machinery_logs {
  hours_worked      Decimal  // ❌ DROPPED
  fuel_per_hour     Decimal  // ❌ DROPPED
  output_per_hour   Decimal  // ❌ DROPPED
}
```

**AFTER (Current Schema)**:
```prisma
model machinery_logs {
  start_hours       Decimal  @db.Decimal(10, 2)
  end_hours         Decimal  @db.Decimal(10, 2)
  fuel_litres       Decimal  @db.Decimal(10, 2)
  output_qty        Decimal  @db.Decimal(15, 3)
  output_unit       String?
}
```

**Computed Values**:
- `hours_worked` → `end_hours - start_hours`
- `fuel_per_hour` → `fuel_litres / (end_hours - start_hours)`
- `output_per_hour` → `output_qty / (end_hours - start_hours)`

### `bill_of_quantities_items` Table Changes

**BEFORE**:
```prisma
model bill_of_quantities_items {
  estimated_total  Decimal  // ❌ DROPPED
  actual_total     Decimal  // ❌ DROPPED
}
```

**AFTER**:
```prisma
model bill_of_quantities_items {
  estimated_qty    Decimal
  estimated_rate   Decimal
  actual_qty       Decimal
  actual_rate      Decimal?
}
```

**Computed Values**:
- `estimated_total` → `estimated_qty * estimated_rate`
- `actual_total` → `actual_qty * actual_rate`

---

## Required Fixes

### Fix 1: Update Domain Operations Snapshot Query ✅ PRIORITY 1

**File**: `lib/actions/dashboard/domainOperationsSnapshot.js`

**Line 456**, replace:
```javascript
`SELECT COALESCE(SUM(hours_worked), 0) AS hours_this_month
 FROM machinery_logs
 WHERE business_id = $1::uuid
   AND log_date >= date_trunc('month', CURRENT_DATE)`
```

**With**:
```javascript
`SELECT COALESCE(SUM(end_hours - start_hours), 0) AS hours_this_month
 FROM machinery_logs
 WHERE business_id = $1::uuid
   AND log_date >= date_trunc('month', CURRENT_DATE)`
```

---

### Fix 2: Update Hub Nav Configuration ✅ PRIORITY 1

**File**: `lib/config/constructionHubNav.js`

**Line 349**, update KPI definition:
```javascript
{
  id: 'machinery-fleet-hours',
  label: 'Fleet Hours (This Month)',
  type: 'number',
  source: 'machinery_logs',
  aggregation: 'computed',  // Changed from 'sum'
  calculation: '(end_hours - start_hours)',  // Added
  filter: 'current_month',
}
```

---

### Fix 3: Update Seed Data Schema ✅ PRIORITY 1

**File**: `lib/dataLab/constructionOperationsSeed.js`

**Lines 557-613**, replace `hours_worked` with `start_hours` and `end_hours`:

```javascript
{
  equipment_code: 'EXC-001',
  log_date: '2026-08-12',
  start_hours: 1240.0,      // Added
  end_hours: 1249.5,        // Added
  fuel_litres: 85.0,        // Changed from fuel_consumed
  operator_name: 'Muhammad Akram',
  activity_description: 'Excavation for underground water tanks',
  // ... other fields
}
```

**Pattern for conversion**:
- If `hours_worked: 9.5` → use `start_hours: 0, end_hours: 9.5` for new logs
- Or use realistic hour-meter readings like `start_hours: 1240.0, end_hours: 1249.5`

---

### Fix 4: Update Machinery Action Computed Fields ✅ PRIORITY 2

**File**: `lib/actions/construction/machinery.js`

**Lines 285-286**, ensure fleet summary computes from raw data:

```javascript
const fleetArray = Object.values(fleet).map((equipment) => {
  const totalHours = equipment.total_hours || 0;
  return {
    ...equipment,
    avg_fuel_per_hour: totalHours > 0 
      ? (equipment.total_fuel || 0) / totalHours 
      : 0,
    avg_output_per_hour: totalHours > 0 
      ? (equipment.total_output || 0) / totalHours 
      : 0,
  };
});
```

**Verify `total_hours` calculation** in the parent query aggregates `SUM(end_hours - start_hours)`.

---

### Fix 5: Update BOQ Queries (If Any) ✅ PRIORITY 2

**Search for**: `estimated_total`, `actual_total` in BOQ-related files

**Replace with computed values**:
```javascript
// Instead of selecting estimated_total:
`SELECT 
  id,
  item_no,
  description,
  estimated_qty,
  estimated_rate,
  (estimated_qty * estimated_rate) AS estimated_total,
  actual_qty,
  actual_rate,
  (actual_qty * COALESCE(actual_rate, estimated_rate)) AS actual_total
FROM bill_of_quantities_items
WHERE project_id = $1`
```

---

## Database State Verification

### Current Schema Status ✅
```bash
npx prisma db push --accept-data-loss
```

**Output**:
- ✅ Schema synced successfully
- ⚠️  Data loss warnings for dropped columns (expected)
- Tables created:
  - `construction_projects`
  - `bill_of_quantities_items`
  - `interim_payment_certificates`
  - `machinery_logs`
  - `subcontractor_work_orders`
  - `construction_daily_reports`
  - `construction_safety_logs`
  - `construction_quality_tests`
  - `construction_site_inspections`

---

## Testing Checklist

### 1. Domain Operations Snapshot
```bash
# Test construction business dashboard load
curl http://localhost:3000/api/internal/domain-ops-snapshot?businessId=<uuid>
```

**Expected**: No SQL errors, `constructionOps` populated with zeros for empty state.

### 2. Machinery Logs
```bash
# Test machinery log creation
POST /api/construction/machinery/logs
{
  "machinery_code": "EXC-001",
  "start_hours": 1240.0,
  "end_hours": 1249.5,
  "fuel_litres": 85.0,
  "log_date": "2026-08-14"
}
```

### 3. BOQ Items
```bash
# Test BOQ item creation
POST /api/construction/boq/items
{
  "project_id": "<uuid>",
  "item_no": "BOQ-1.1",
  "estimated_qty": 100,
  "estimated_rate": 500
}
```

### 4. Construction Hub Load
```bash
# Visit construction business hub
GET /business/construction-contractor?tab=dashboard
```

**Expected**: Dashboard loads without Server Component errors.

---

## Prevention Measures

### 1. Schema Change Protocol
- [ ] Update Prisma schema
- [ ] Run `npx prisma db push`
- [ ] Search codebase for old column names:
  ```bash
  rg "hours_worked|fuel_per_hour|output_per_hour|estimated_total|actual_total"
  ```
- [ ] Update all queries, seeds, and computed fields
- [ ] Update TypeScript types if applicable
- [ ] Run verification scripts

### 2. Add Verification Script

**Create**: `scripts/verify-construction-schema.mjs`

```javascript
#!/usr/bin/env node
import { db } from '../lib/db.js';

async function verifyConstructionSchema() {
  console.log('🔍 Verifying construction domain schema...\n');
  
  const checks = [
    {
      name: 'machinery_logs columns',
      query: `SELECT column_name FROM information_schema.columns 
              WHERE table_name = 'machinery_logs' 
              AND column_name IN ('start_hours', 'end_hours', 'fuel_litres')`,
      expected: 3,
    },
    {
      name: 'No legacy hours_worked',
      query: `SELECT column_name FROM information_schema.columns 
              WHERE table_name = 'machinery_logs' 
              AND column_name = 'hours_worked'`,
      expected: 0,
    },
  ];
  
  for (const check of checks) {
    const result = await db.$queryRawUnsafe(check.query);
    const passed = result.length === check.expected;
    console.log(
      passed ? '✅' : '❌',
      check.name,
      `(${result.length}/${check.expected})`
    );
  }
}

verifyConstructionSchema().then(() => process.exit(0));
```

Add to `package.json`:
```json
{
  "scripts": {
    "verify:construction-schema": "node scripts/verify-construction-schema.mjs"
  }
}
```

---

## Implementation Priority

1. **CRITICAL** (Deploy Blocker):
   - Fix 1: Domain Operations Snapshot Query
   - Fix 2: Hub Nav Configuration
   - Fix 3: Seed Data Schema

2. **HIGH** (Before Demo/Testing):
   - Fix 4: Machinery Action Computed Fields
   - Fix 5: BOQ Queries

3. **MEDIUM** (Before Production):
   - Add verification script
   - Update TypeScript types
   - Add integration tests

---

## Related Files

### Files Requiring Changes
- ✅ `lib/actions/dashboard/domainOperationsSnapshot.js`
- ✅ `lib/config/constructionHubNav.js`
- ✅ `lib/dataLab/constructionOperationsSeed.js`
- ✅ `lib/actions/construction/machinery.js`

### Schema Files (Reference Only)
- `prisma/schema.prisma` (already updated)
- `lib/domainData/construction.js` (knowledge base - OK)

### Component Files (Should Work After Fixes)
- `components/construction/ConstructionHub.jsx`
- `components/construction/SiteOperationsHub.jsx`
- `components/construction/MachineryLogbook.jsx`
- `components/construction/BOQItemsTable.jsx`

---

## Error Signature

**Browser Console**:
```
Error: An error occurred in the Server Components render.
Digest: <hash>
```

**Server Logs**:
```
PostgreSQL Error: column "hours_worked" does not exist
  at lib/actions/dashboard/domainOperationsSnapshot.js:456
```

**When**: Loading construction business dashboard with `?tab=dashboard` or any construction tab.

---

## Success Criteria

✅ Construction business dashboard loads without errors  
✅ Machinery logs can be created with new schema  
✅ BOQ items display correctly with computed totals  
✅ Domain operations snapshot returns valid construction KPIs  
✅ Seed script runs without errors  
✅ Verification script passes all checks  

---

**Generated**: 2026-08-14  
**Status**: Analysis Complete - Ready for Implementation  
**Estimated Fix Time**: 1-2 hours
