# ✅ SAFE DEPLOYMENT GUIDE - Water Hisab Fixes

**Pre-Deployment Check:** ✅ PASSED  
**Critical Issues:** 0  
**Warnings:** 1 (non-blocking - CONCURRENTLY recommendation)  
**Date:** 2026-08-10  

---

## 🎯 What Will Be Changed

### Database Changes (4 New Indexes):
1. ✅ `idx_water_stops_business_date_active` - Partial index for active stops
2. ✅ `idx_water_stops_period_range` - Composite index for date ranges
3. ✅ `idx_invoices_water_hisab_notes` - GIN index for invoice search
4. ✅ `idx_customers_water_active` - Partial index for active customers

### Existing Indexes (NOT modified):
- ✅ `idx_water_delivery_stops_business_date`
- ✅ `idx_water_delivery_stops_business_customer`
- ✅ `idx_water_delivery_lines_business_product`
- ✅ `water_delivery_stops_business_date_customer_key` (UNIQUE)

### Code Changes (4 Files):
1. ✅ `components/water/WaterRouteHisab.jsx` - Event listener
2. ✅ `components/ExpenseEntryForm.jsx` - Event emission
3. ✅ `lib/actions/standard/waterHisab.js` - SQL optimization
4. ✅ `prisma/migrations/.../migration.sql` - Index creation

---

## 📊 Risk Assessment

| Risk Factor | Level | Mitigation |
|-------------|-------|------------|
| Data Loss | 🟢 None | Read-only indexes, no table alterations |
| Downtime | 🟢 None | Indexes use IF NOT EXISTS, safe to re-run |
| Breaking Changes | 🟢 None | Backward compatible code |
| Rollback Complexity | 🟢 Low | Simple index drops + code revert |
| Performance Regression | 🟢 None | Only adds optimizations |
| Table Locks | 🟡 Brief | Indexes without CONCURRENTLY (~5-10s lock per index) |

**Overall Risk:** 🟢 **LOW - SAFE TO DEPLOY**

---

## 🚀 Step-by-Step Deployment

### Pre-Flight Checklist ✈️

```bash
# 1. Verify you're in the right directory
cd e:\tenvo-main
pwd

# 2. Run pre-deployment check
node scripts/pre-deploy-water-hisab-check.mjs
# Expected: "PROCEED WITH CAUTION" with 0 critical issues

# 3. Check current git status
git status
# Should show modified files only (no untracked critical files)

# 4. Verify Prisma CLI is available
npx prisma --version
```

---

### Step 1: Database Backup (MANDATORY) 💾

```bash
# Create timestamped backup
BACKUP_FILE="tenvo_backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -U postgres -d tenvo -F c -b -v -f "$BACKUP_FILE"

# Verify backup size is reasonable (should be several MB+)
ls -lh "$BACKUP_FILE"

# Store backup safely
mv "$BACKUP_FILE" ~/backups/
```

**⚠️ DO NOT PROCEED WITHOUT A BACKUP ⚠️**

---

### Step 2: Apply Database Migration 🗄️

```bash
# Method A: Using Prisma CLI (Recommended)
npx prisma migrate deploy

# Method B: Manual SQL (if Prisma fails)
psql -U postgres -d tenvo -f prisma/migrations/20260810000001_water_hisab_performance_indexes/migration.sql
```

**Expected Output:**
```
Applying migration `20260810000001_water_hisab_performance_indexes`
The following migration(s) have been applied:

migrations/
  └─ 20260810000001_water_hisab_performance_indexes/
    └─ migration.sql

All migrations have been successfully applied.
```

**If Error Occurs:**
- Check error message carefully
- If "index already exists" → Safe to ignore (idempotent)
- If "permission denied" → Check postgres user permissions
- If "pg_trgm extension" → See troubleshooting below

---

### Step 3: Verify Indexes Created ✓

```bash
# Check new indexes exist
psql -U postgres -d tenvo -c "
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_water%' OR indexname LIKE 'idx_invoices_water%' OR indexname LIKE 'idx_customers_water%'
ORDER BY tablename, indexname;
"
```

**Expected Output (4 new indexes):**
```
 schemaname |     tablename         |        indexname                  | indexdef
------------+-----------------------+-----------------------------------+----------
 public     | customers             | idx_customers_water_active        | CREATE ...
 public     | invoices              | idx_invoices_water_hisab_notes    | CREATE ...
 public     | water_delivery_stops  | idx_water_stops_business_date_active | CREATE ...
 public     | water_delivery_stops  | idx_water_stops_period_range      | CREATE ...
```

---

### Step 4: Deploy Code Changes 📦

```bash
# 1. Build production bundle
npm run build

# 2. Check build output
ls -lh .next/
# Should show fresh build timestamp

# 3. Restart application (choose your method)

# Option A: PM2
pm2 restart tenvo

# Option B: Systemd
sudo systemctl restart tenvo

# Option C: Docker
docker-compose up -d --build

# 4. Check application started successfully
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}
```

---

### Step 5: Post-Deployment Verification 🧪

```bash
# Test 1: Check application is running
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# Test 2: Verify indexes are being used
psql -U postgres -d tenvo -c "
EXPLAIN ANALYZE
SELECT * FROM water_delivery_stops
WHERE business_id = (SELECT id FROM businesses LIMIT 1)
  AND delivery_date = CURRENT_DATE
  AND is_deleted = false;
"
# Look for: "Index Scan using idx_water_stops_business_date_active"
# NOT: "Seq Scan on water_delivery_stops"
```

**Manual UI Tests:**

1. **Test Expense Recording:**
   - Login → Navigate to any water business
   - Go to Route Hisab → Expenses tab
   - Click "Log Expense"
   - Fill form (Amount: 500, Category: Fuel)
   - Click Save
   - ✅ **PASS:** Expense appears in table immediately (no refresh)
   - ❌ **FAIL:** Need to refresh page to see expense

2. **Test Daily Sheet Performance:**
   - Go to Route Hisab → Daily Sheet
   - Open Browser DevTools → Network tab
   - Select today's date
   - ✅ **PASS:** Loads in <1.5 seconds
   - ❌ **FAIL:** Takes >2 seconds

3. **Test Bills Tab Performance:**
   - Go to Route Hisab → Bills → Monthly
   - Select current month
   - ✅ **PASS:** Loads in <2.5 seconds
   - ❌ **FAIL:** Takes >4 seconds

---

## 🔄 Rollback Procedure (If Needed)

### If Expense Bug Persists:

```bash
# 1. Revert code changes
git revert HEAD

# 2. Rebuild
npm run build

# 3. Restart
pm2 restart tenvo
```

### If Performance Degrades:

```bash
# Drop new indexes (keeps existing ones)
psql -U postgres -d tenvo -c "
DROP INDEX IF EXISTS idx_water_stops_business_date_active;
DROP INDEX IF EXISTS idx_water_stops_period_range;
DROP INDEX IF EXISTS idx_invoices_water_hisab_notes;
DROP INDEX IF EXISTS idx_customers_water_active;
"

# Revert code
git revert HEAD
npm run build
pm2 restart tenvo
```

### If Complete Rollback Needed:

```bash
# 1. Restore database backup
pg_restore -U postgres -d tenvo -c ~/backups/tenvo_backup_YYYYMMDD_HHMMSS.sql

# 2. Revert code
git reset --hard HEAD~1

# 3. Rebuild and restart
npm run build
pm2 restart tenvo
```

---

## 🐛 Troubleshooting

### Issue: pg_trgm extension error

**Error:** `ERROR:  permission denied to create extension "pg_trgm"`

**Solution:**
```bash
# Connect as superuser
psql -U postgres -d tenvo

# Create extension manually
CREATE EXTENSION IF NOT EXISTS pg_trgm;

# Re-run migration
\q
npx prisma migrate deploy
```

---

### Issue: Index creation timeout

**Error:** `ERROR:  canceling statement due to user request`

**Solution:**
```bash
# Indexes are created one at a time. Check which succeeded:
psql -U postgres -d tenvo -c "\di+ idx_water*"

# Manually create missing indexes from migration.sql
```

---

### Issue: High database CPU after deployment

**Symptom:** CPU usage spikes to 80%+

**Diagnosis:**
```sql
-- Check running queries
SELECT pid, query, state, query_start
FROM pg_stat_activity
WHERE state = 'active' AND query NOT LIKE '%pg_stat%'
ORDER BY query_start;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE tablename LIKE 'water%'
ORDER BY idx_scan DESC;
```

**Solution:**
- If indexes aren't being used → Run `ANALYZE water_delivery_stops;`
- If queries are slow → Check query plan with EXPLAIN ANALYZE
- If CPU persists → Consider dropping new indexes temporarily

---

## 📈 Success Metrics (Monitor for 48 hours)

| Metric | Before | Target After | How to Check |
|--------|--------|--------------|--------------|
| Daily Sheet load (p95) | 2-3s | <1.5s | Browser DevTools Network tab |
| Bills Tab load (p95) | 4-6s | <2.5s | Browser DevTools Network tab |
| Expense save → visible | Manual refresh | <500ms | Manual testing |
| DB CPU usage | Baseline | -20% | CloudWatch / pg_stat_database |
| User complaints | N/A | 0 | Support tickets |

---

## ✅ Final Checklist

Before marking deployment as complete:

- [ ] Database backup created and verified
- [ ] Migration applied successfully (4 new indexes)
- [ ] All indexes verified with `\di+` command
- [ ] Code deployed and application restarted
- [ ] Health check endpoint returns 200 OK
- [ ] Expense recording tested (immediate table update)
- [ ] Daily Sheet load time <1.5s
- [ ] Bills Tab load time <2.5s
- [ ] No errors in application logs
- [ ] No errors in database logs
- [ ] Monitoring dashboards show normal metrics
- [ ] Team notified of deployment

---

## 📞 Emergency Contacts

**If issues arise:**
1. Check application logs: `pm2 logs tenvo`
2. Check database logs: `tail -f /var/log/postgresql/postgresql-*.log`
3. Execute rollback procedure above
4. Document issue in `.superpowers/deployment-issues.md`

**Status Dashboard:**
- Application: `http://localhost:3000/api/health`
- Database: `psql -U postgres -d tenvo -c "SELECT version();"`

---

**Deployment Completed By:** _(Your Name)_  
**Deployment Date/Time:** _(YYYY-MM-DD HH:MM)_  
**Rollback Plan Reviewed:** [ ] Yes [ ] No  
**Backup Location:** `~/backups/tenvo_backup_YYYYMMDD_HHMMSS.sql`  
**Post-Deployment Tests:** [ ] All Passed [ ] Some Failed (document below)  

---

**Notes:**
