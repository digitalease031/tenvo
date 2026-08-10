# 🚀 Quick Deployment Commands

**Status:** ✅ Ready to deploy  
**Risk:** 🟢 LOW  
**Time:** ~10 minutes  

---

## Step-by-Step Commands

### 1️⃣ Pre-Deployment Check (1 min)

```bash
# Run safety check
node scripts/pre-deploy-water-hisab-check.mjs

# Expected: "PROCEED WITH CAUTION" with 0 critical issues
```

---

### 2️⃣ Backup Database (2 mins) ⚠️ MANDATORY

```bash
# Create backup
pg_dump -U postgres -d tenvo -F c -b -v -f "tenvo_backup_$(date +%Y%m%d_%H%M%S).sql"

# Verify backup created
ls -lh tenvo_backup_*.sql

# Move to safe location
mkdir -p ~/backups
mv tenvo_backup_*.sql ~/backups/
```

---

### 3️⃣ Apply Database Migration (2 mins)

```bash
# Apply migration
npx prisma migrate deploy

# Verify indexes created
psql -U postgres -d tenvo -c "
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE indexname LIKE 'idx_water%' 
   OR indexname LIKE 'idx_invoices_water%' 
   OR indexname LIKE 'idx_customers_water%'
ORDER BY indexname;
"

# Expected: 4 new indexes shown
```

---

### 4️⃣ Deploy Code (3 mins)

```bash
# Build production bundle
npm run build

# Restart application (choose one)
pm2 restart tenvo
# OR
sudo systemctl restart tenvo
# OR
docker-compose up -d --build

# Verify application started
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}
```

---

### 5️⃣ Post-Deployment Tests (2 mins)

**Test 1: Expense Recording**
1. Login → Water business → Route Hisab → Expenses
2. Click "Log Expense" → Fill form → Save
3. ✅ Expense should appear immediately (no refresh)

**Test 2: Performance**
1. Route Hisab → Daily Sheet → Select today
2. Open DevTools → Network tab
3. ✅ Should load in <1.5 seconds

**Test 3: Bills Tab**
1. Route Hisab → Bills → Monthly → Current month
2. ✅ Should load in <2.5 seconds

---

## Quick Rollback (if needed)

```bash
# Drop new indexes
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

---

## Files to Review Before Deploy

1. **Migration:** `prisma/migrations/20260810000001_water_hisab_performance_indexes/migration.sql`
2. **Guide:** `.superpowers/SAFE_DEPLOYMENT_GUIDE.md`
3. **Status:** `.superpowers/FINAL_DEPLOYMENT_STATUS.md`

---

## Monitoring After Deploy

```bash
# Check application logs
pm2 logs tenvo

# Check database performance
psql -U postgres -d tenvo -c "
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
WHERE tablename LIKE 'water%' 
ORDER BY idx_scan DESC;
"

# Check for errors
pm2 logs tenvo --err --lines 50
```

---

**Questions?** Read: `.superpowers/SAFE_DEPLOYMENT_GUIDE.md`  
**Issues?** Check rollback procedure above  
