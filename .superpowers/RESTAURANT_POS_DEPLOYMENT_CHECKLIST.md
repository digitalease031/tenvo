# Restaurant POS Fix - Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] **Identified the Bug**
  - Issue: `this.ensureTokenColumn is not a function`
  - Root cause: Malformed JSDoc comment
  - Impact: Order creation failing completely

- [x] **Fixed the Code**
  - File: `lib/services/RestaurantService.js`
  - Change: Properly closed JSDoc comment
  - Status: ✅ Verified via verification script

- [x] **Created Database Migration**
  - File: `prisma/migrations/20260810084208_add_restaurant_order_token_number/migration.sql`
  - Purpose: Add `token_number INT` column to `restaurant_orders`
  - Status: ✅ Created and ready to apply

- [x] **Verified the Fix**
  - Script: `scripts/verify-restaurant-pos-fix.mjs`
  - Result: ✅ All tests passed
  - Status: Code-level verification complete

- [x] **Documentation Complete**
  - Executive Summary: ✅
  - Fix Summary: ✅
  - Deep Dive: ✅
  - Improvements Roadmap: ✅
  - Flow Diagrams: ✅
  - README Index: ✅
  - Total: 25,000+ words across 6 documents

---

## 🚀 Deployment Steps

### Step 1: Backup Database ⏳
**Status:** Pending  
**Owner:** DevOps / Database Admin

```bash
# Create backup before migration
pg_dump -h <host> -U <user> -d <database> > restaurant_pos_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Verification:**
- [ ] Backup file created
- [ ] Backup file size > 0
- [ ] Backup can be restored (optional: test on staging)

**Estimated Time:** 5-10 minutes (depends on database size)

---

### Step 2: Apply Migration ⏳
**Status:** Pending  
**Owner:** Developer / DevOps

**Commands:**
```bash
# Navigate to project directory
cd e:\tenvo-main

# Apply the migration
npx prisma migrate deploy

# Verify migration applied
npx prisma migrate status
```

**Expected Output:**
```
✅ Migration 20260810084208_add_restaurant_order_token_number applied successfully
```

**Verification:**
- [ ] Migration applied without errors
- [ ] `token_number` column exists in `restaurant_orders` table
- [ ] Index created: `idx_restaurant_orders_token_lookup`

**Check via SQL:**
```sql
-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'restaurant_orders' 
  AND column_name = 'token_number';

-- Should return: token_number | integer

-- Verify index exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'restaurant_orders' 
  AND indexname = 'idx_restaurant_orders_token_lookup';
```

**Rollback Plan (if needed):**
```sql
-- If something goes wrong:
DROP INDEX IF EXISTS idx_restaurant_orders_token_lookup;
ALTER TABLE restaurant_orders DROP COLUMN IF EXISTS token_number;
```

**Estimated Time:** 2-5 minutes

---

### Step 3: Deploy Code ⏳
**Status:** Pending  
**Owner:** DevOps

**For Staging:**
```bash
# Pull latest code
git pull origin main

# Install dependencies (if needed)
npm install

# Restart application
pm2 restart tenvo-staging
# OR
npm run build && npm start
```

**For Production:**
```bash
# Deploy via CI/CD pipeline
# OR manual deployment:
git pull origin main
npm install
npm run build
pm2 restart tenvo-production
```

**Verification:**
- [ ] Application restarted successfully
- [ ] No startup errors in logs
- [ ] Health check passes: `/api/health`

**Estimated Time:** 5-10 minutes

---

### Step 4: Smoke Testing ⏳
**Status:** Pending  
**Owner:** QA / Developer

**Critical Path Test: Create Dine-in Order**

1. **Navigate to Restaurant POS**
   - [ ] URL loads without errors
   - [ ] Products display correctly
   - [ ] No console errors

2. **Create Dine-in Order**
   - [ ] Select "Dine In" order type
   - [ ] Select a table
   - [ ] Set covers (e.g., 2)
   - [ ] Add 2-3 items to cart
   - [ ] Items appear in cart with correct prices
   - [ ] Subtotal calculated correctly
   - [ ] Tax calculated correctly
   - [ ] Total = Subtotal + Tax

3. **Send to Kitchen**
   - [ ] Click "Send to Kitchen" (or press F5)
   - [ ] Success toast appears
   - [ ] Toast shows order number (e.g., "ORD-000123")
   - [ ] Toast shows **token number** (e.g., "Token #1") ← **CRITICAL CHECK**
   - [ ] No console errors
   - [ ] No `ensureTokenColumn` errors

4. **Verify KOT**
   - [ ] KOT print window opens
   - [ ] Token number displayed prominently
   - [ ] Order details correct (items, table, covers)
   - [ ] Print (or close window)

5. **Complete Payment**
   - [ ] Payment modal opens automatically
   - [ ] Select payment method (e.g., Cash)
   - [ ] Click "Complete Payment" (or press Enter)
   - [ ] Success toast appears
   - [ ] Cart clears
   - [ ] Table status updates to "Available"
   - [ ] No console errors

**Alternative Paths Test:**

6. **Create Takeaway Order**
   - [ ] Select "Takeaway"
   - [ ] Optionally enter customer name
   - [ ] Add items
   - [ ] Send to kitchen
   - [ ] ✅ Token number appears
   - [ ] Complete payment

7. **Create Delivery Order**
   - [ ] Select "Delivery"
   - [ ] Enter customer name (required)
   - [ ] Enter phone (required)
   - [ ] Enter address (required)
   - [ ] Enter delivery fee
   - [ ] Add items
   - [ ] Send to kitchen
   - [ ] ✅ Token number appears
   - [ ] Complete payment

**Error Scenarios:**

8. **Validation Tests**
   - [ ] Try dine-in without table → Shows error
   - [ ] Try delivery without name → Shows error
   - [ ] Try delivery without phone → Shows error
   - [ ] Try delivery without address → Shows error
   - [ ] Try sending empty cart → Shows error

**Estimated Time:** 20-30 minutes

---

### Step 5: Backend Verification ⏳
**Status:** Pending  
**Owner:** Developer

**Database Checks:**

```sql
-- 1. Verify order created
SELECT id, order_number, token_number, order_type, status, total_amount
FROM restaurant_orders 
WHERE business_id = '<test-business-id>'
ORDER BY created_at DESC 
LIMIT 5;

-- Should show:
-- - order_number: ORD-XXXXXX
-- - token_number: 1, 2, 3... (NOT NULL)
-- - status: 'completed' (after payment)

-- 2. Verify order items
SELECT product_id, item_name, quantity, unit_price
FROM restaurant_order_items
WHERE order_id = '<order-id-from-above>';

-- 3. Verify kitchen order
SELECT id, status, items
FROM kitchen_orders
WHERE order_id = '<order-id-from-above>';

-- 4. Verify payment
SELECT payment_type, amount, payment_mode
FROM payments
WHERE reference_type = 'restaurant_order' 
  AND reference_id = '<order-id-from-above>';

-- 5. Verify GL entry
SELECT je.id, je.entry_type, je.total_amount, ge.account_name, ge.debit_amount, ge.credit_amount
FROM journal_entries je
LEFT JOIN gl_entries ge ON ge.journal_entry_id = je.id
WHERE je.business_id = '<test-business-id>'
  AND je.description LIKE '%Order #ORD-%'
ORDER BY je.created_at DESC
LIMIT 1;

-- Should show:
-- - DR Cash/Card (debit)
-- - CR Sales Revenue (credit)
-- - CR Tax Payable (credit)

-- 6. Verify stock movement
SELECT product_id, quantity, reference_type, reference_id, notes
FROM inventory_movements
WHERE reference_type = 'restaurant_order'
  AND reference_id = '<order-id-from-above>';

-- Should show negative quantity (stock deducted)

-- 7. Verify table freed (if dine-in)
SELECT id, table_number, status, current_order_id
FROM restaurant_tables
WHERE business_id = '<test-business-id>'
  AND table_number = '<table-used-in-test>';

-- Should show:
-- - status: 'available'
-- - current_order_id: NULL
```

**Verification Checklist:**
- [ ] Order record created with token_number
- [ ] Order items saved correctly
- [ ] Kitchen order created
- [ ] Payment recorded
- [ ] GL entry posted correctly
- [ ] Stock deducted from inventory
- [ ] Table freed (if dine-in)

**Estimated Time:** 10-15 minutes

---

### Step 6: Monitoring ⏳
**Status:** Pending  
**Owner:** DevOps / On-call Developer

**Monitor for 24-48 hours:**

**Key Metrics:**
- [ ] Order creation success rate
- [ ] `ensureTokenColumn` error rate (should be 0)
- [ ] Average order creation time
- [ ] Payment settlement success rate
- [ ] API error rate

**Log Patterns to Watch:**
```bash
# Look for these errors (should NOT appear):
grep -i "ensureTokenColumn" /var/log/tenvo/app.log
grep -i "token_number" /var/log/tenvo/error.log
grep -i "42703" /var/log/tenvo/error.log  # Column not found error

# Should return: No results
```

**Alert Thresholds:**
- Error rate > 1%: Investigate immediately
- Order creation time > 5s: Performance issue
- Any `ensureTokenColumn` error: Rollback candidate

**Monitoring Tools:**
- Error tracking: Sentry / DataDog
- Application logs: CloudWatch / ELK
- Database monitoring: pgAdmin / DataDog
- User feedback: Support tickets

**Estimated Duration:** 24-48 hours continuous

---

### Step 7: Customer Communication ⏳
**Status:** Pending  
**Owner:** Support / Customer Success

**If downtime occurred during deployment:**

**Email Template:**
```
Subject: Restaurant POS System Update - Issue Resolved

Dear [Customer],

We've successfully resolved a technical issue that was affecting 
restaurant order creation in your POS system.

What was fixed:
- Order creation errors have been resolved
- Token number system now works correctly
- All restaurant POS features are fully operational

What you need to do:
- Nothing! The fix has been applied automatically
- You may need to refresh your browser (Ctrl+F5)

If you experience any issues:
- Contact support at support@tenvo.store
- Live chat available in-app

Thank you for your patience.

Best regards,
Tenvo Team
```

**Social Media / Status Page:**
```
✅ [RESOLVED] Restaurant POS Order Creation
We've resolved an issue affecting restaurant order creation. 
All systems are now fully operational.
```

**Estimated Time:** 15-30 minutes

---

## 📊 Success Criteria

### Deployment Successful If:
- ✅ Migration applied without errors
- ✅ Application restarts successfully
- ✅ Orders can be created (all types)
- ✅ Token numbers display correctly
- ✅ No `ensureTokenColumn` errors
- ✅ Payments process successfully
- ✅ Stock movements recorded
- ✅ GL entries posted
- ✅ No increase in error rate
- ✅ No customer complaints

### Deployment Failed If:
- ❌ Migration fails or rolls back
- ❌ Application won't start
- ❌ Orders still fail to create
- ❌ Token numbers don't appear
- ❌ `ensureTokenColumn` errors persist
- ❌ Critical errors in logs
- ❌ Customer reports issues

---

## 🚨 Rollback Plan

### If Deployment Fails:

**Step 1: Immediate Actions**
```bash
# Stop application
pm2 stop tenvo-production

# Revert code
git reset --hard HEAD~1

# Rollback migration
npx prisma migrate resolve --rolled-back 20260810084208_add_restaurant_order_token_number

# Restore database (if necessary)
psql -h <host> -U <user> -d <database> < restaurant_pos_backup_YYYYMMDD_HHMMSS.sql

# Restart application
pm2 start tenvo-production
```

**Step 2: Verify Rollback**
- [ ] Application running on previous version
- [ ] Orders can be created (even if token number missing)
- [ ] No new errors introduced

**Step 3: Post-Mortem**
- Document what went wrong
- Fix the issue in development
- Re-test thoroughly
- Schedule new deployment

---

## 📋 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Update internal documentation
- [ ] Mark fix as deployed in issue tracker
- [ ] Send success notification to stakeholders
- [ ] Remove old backup files (after 7 days)

### Short Term (Week 1)
- [ ] Review monitoring metrics
- [ ] Gather customer feedback
- [ ] Document lessons learned
- [ ] Update deployment runbook

### Long Term (Month 1)
- [ ] Start work on next priority feature (split bill)
- [ ] Add unit tests for RestaurantService
- [ ] Add E2E tests for order flow
- [ ] Review and update documentation

---

## ✅ Final Checklist

**Before going live:**
- [ ] All pre-deployment tasks complete
- [ ] Database backup created
- [ ] Migration script tested on staging
- [ ] Code changes reviewed and merged
- [ ] Rollback plan documented and understood
- [ ] On-call person assigned
- [ ] Monitoring alerts configured
- [ ] Customer communication prepared

**Ready to deploy?**
- [ ] Yes, all checks passed → Proceed with deployment
- [ ] No, blockers exist → Document and resolve first

---

## 📞 Emergency Contacts

**On-Call Developer:**  
Name: _____________  
Phone: _____________  
Slack: @___________

**DevOps Lead:**  
Name: _____________  
Phone: _____________  
Slack: @___________

**Database Admin:**  
Name: _____________  
Phone: _____________  
Slack: @___________

**Product Manager:**  
Name: _____________  
Email: _____________  
Slack: @___________

---

## 📚 Related Documentation

- [Fix Summary](./RESTAURANT_POS_FIX_SUMMARY.md) - What was fixed and why
- [Deep Dive](./RESTAURANT_POS_DEEP_DIVE.md) - Complete technical reference
- [Executive Summary](./RESTAURANT_POS_EXECUTIVE_SUMMARY.md) - Business overview
- [Flow Diagrams](./RESTAURANT_POS_FLOW_DIAGRAM.md) - Visual guides

---

**Checklist Version:** 1.0  
**Date Created:** 2026-08-10  
**Last Updated:** 2026-08-10  
**Status:** Ready for Use

**Good luck with the deployment! 🚀**
