# Restaurant POS Improvements & Feature Roadmap

## 🎯 Quick Fixes Applied

### 1. ✅ Fixed `ensureTokenColumn` JSDoc Bug
**File:** `lib/services/RestaurantService.js`
**Issue:** Broken JSDoc comment caused method to be undefined
**Fix:** Properly closed JSDoc comment block
**Impact:** Order creation will no longer fail when token_number column is missing

### 2. ✅ Created Token Number Migration
**File:** `prisma/migrations/20260810084208_add_restaurant_order_token_number/migration.sql`
**Added:**
- `token_number INT` column to `restaurant_orders`
- Index for efficient daily sequence lookups
- Column documentation

**To Apply:**
```bash
npx prisma migrate deploy
```

---

## 🚀 Feature Enhancements (Prioritized)

### Priority 1: Critical & High Impact 🔴

#### 1.1 Split Bill Support
**Status:** Not Implemented  
**Effort:** Medium (3-5 days)  
**Business Value:** High - Essential for restaurants

**Requirements:**
- Allow splitting by percentage (50/50, 60/40, etc.)
- Allow splitting by item (Guest 1 pays for items 1-3)
- Allow splitting by equal shares (divide total by N guests)
- Support multiple payment methods per split
- Update schema to track split payments

**Schema Changes:**
```sql
ALTER TABLE restaurant_orders ADD COLUMN payment_splits JSONB;
-- Structure: [{ guest: 1, amount: 500, payment_method: 'cash', paid_at: timestamp }]

CREATE TABLE restaurant_order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES restaurant_orders(id),
  split_number INT NOT NULL DEFAULT 1,
  amount NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  paid_at TIMESTAMP DEFAULT NOW(),
  paid_by UUID REFERENCES "user"(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Implementation Plan:**
1. Add `RestaurantService.addPaymentToOrder()`
2. Track total paid vs order total
3. Update UI to show "Split Bill" button
4. Create `SplitBillModal` component
5. Allow marking order complete when fully paid

---

#### 1.2 Tip/Gratuity Handling
**Status:** Not Implemented  
**Effort:** Small (1-2 days)  
**Business Value:** High - Industry standard

**Requirements:**
- Support percentage tips (10%, 15%, 20%)
- Support custom tip amount
- Show suggested tip amounts
- Track tips per waiter
- Include tip in payment total
- Separate tip in receipts and reports

**Schema Changes:**
```sql
ALTER TABLE restaurant_orders ADD COLUMN tip_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE restaurant_orders ADD COLUMN tip_percent NUMERIC(5,2);
```

**UI Changes:**
- Add tip calculator in payment modal
- Show tip options: None, 10%, 15%, 20%, Custom
- Display tip in KOT/receipt
- Waiter dashboard shows tips earned

---

#### 1.3 Kitchen Printer Auto-Print
**Status:** Partial (uses browser print dialog)  
**Effort:** Large (5-7 days)  
**Business Value:** High - Critical for high-volume restaurants

**Requirements:**
- Direct thermal printer support (ESC/POS protocol)
- Network printer via IP address
- USB printer via Chrome Native Messaging
- Silent printing (no browser dialog)
- Print queue management
- Retry failed prints

**Tech Stack:**
- ESC/POS library for thermal formatting
- WebSocket bridge for network printers
- Chrome Native Messaging host for USB
- Fallback to browser print if direct fails

**Implementation Steps:**
1. Create `lib/print/escpos.js` - ESC/POS command builder
2. Create `lib/print/printerBridge.js` - WebSocket/USB bridge
3. Add printer settings in Store Settings
4. Auto-detect available printers
5. Test with common thermal printers (Epson, Star, Bixolon)

---

#### 1.4 Order Modification Flow
**Status:** Not Implemented  
**Effort:** Medium (3-4 days)  
**Business Value:** High - Common restaurant need

**Requirements:**
- Add items to existing order after KOT sent
- Remove items before preparation starts
- Create "ADDITIONAL" KOT for new items
- Update order totals
- Track modifications in audit log

**API Changes:**
```javascript
// New action
export async function modifyRestaurantOrderAction({
  businessId,
  orderId,
  addItems,      // Items to add
  removeItems,   // Item IDs to remove
  reason         // Modification reason
})
```

**Flow:**
1. User clicks "Modify Order" on active order
2. Shows current items with checkboxes
3. Can add new menu items
4. Can remove items (only if status = 'pending')
5. Creates new kitchen order for additions
6. Marks removed items as 'cancelled'
7. Prints "ADDITIONAL KOT" for kitchen

---

### Priority 2: Important Enhancements 🟡

#### 2.1 Enhanced Discount Engine
**Effort:** Large (5-7 days)  
**Business Value:** Medium-High

**Features:**
- Promo codes (SUMMER20, WELCOME10, etc.)
- Item-level discounts
- Time-based discounts (happy hour 5-7pm)
- Combo discounts (buy 2 get 1 free)
- Manager approval for discounts > threshold
- Track discount usage and ROI

**Schema:**
```sql
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage' | 'fixed' | 'combo'
  discount_value NUMERIC(10,2) NOT NULL,
  applicable_to JSONB, -- { items: [], categories: [] }
  min_order_amount NUMERIC(10,2),
  max_discount_amount NUMERIC(10,2),
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  time_restrictions JSONB, -- { days: [1,2,3], start_time: '17:00', end_time: '19:00' }
  usage_limit INT,
  usage_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### 2.2 Item-Level Status Tracking
**Effort:** Medium (3-4 days)  
**Business Value:** Medium

**Features:**
- Track status per item: pending → preparing → ready → served
- Waiter marks items as served
- Kitchen marks items ready individually
- Useful for large tables with staggered courses

**UI Changes:**
- KDS shows item-level checkboxes
- Order view shows item status badges
- Waiter app has "Mark Served" button per item

---

#### 2.3 Waiter Management Dashboard
**Effort:** Medium (4-5 days)  
**Business Value:** Medium

**Features:**
- Waiter assignment to tables
- Active orders per waiter
- Tips earned (daily/weekly/monthly)
- Average order value per waiter
- Customer ratings per waiter
- Shift management
- Commission calculation

**New Component:** `components/restaurant/WaiterDashboard.jsx`

---

### Priority 3: Nice to Have 🟢

#### 3.1 Reservation System
**Effort:** Large (7-10 days)

**Features:**
- Table booking with time slots
- Walk-in vs reservation tracking
- No-show management
- Reservation reminder SMS/email
- Waitlist management
- Overbooking protection

---

#### 3.2 Recipe & Ingredient Management
**Effort:** Large (10-14 days)

**Features:**
- Define recipes (1 burger = 1 patty + 1 bun + 2 lettuce...)
- Ingredient-level inventory
- Auto-deduct ingredients when dish sold
- Low ingredient alerts
- Recipe costing
- Allergen tracking

---

#### 3.3 Customer Feedback System
**Effort:** Small (2-3 days)

**Features:**
- Post-meal rating (1-5 stars)
- Food quality rating
- Service quality rating
- Comments/suggestions
- Complaint tracking
- Response management

---

#### 3.4 Order Analytics Dashboard
**Effort:** Medium (4-5 days)

**Metrics:**
- Sales by hour/day/week/month
- Top-selling items
- Slow-moving items
- Average order value
- Table turnover rate
- Peak hours heat map
- Kitchen prep time trends
- Waiter performance
- Discount impact analysis

---

## 🛠️ Technical Improvements

### 1. Error Handling & Resilience

**Current Gaps:**
- No retry logic for failed stock reservations
- No graceful degradation if KOT print fails
- No offline queue for orders

**Improvements:**
- Add retry with exponential backoff
- Queue orders locally if network fails
- Show user-friendly error messages
- Log errors to monitoring service

---

### 2. Performance Optimization

**Current Issues:**
- Full product list loaded on POS mount
- No pagination on order history
- No debouncing on search

**Improvements:**
- Lazy load products (paginate or virtual scroll)
- Add search debouncing (300ms)
- Cache frequently accessed data
- Use React Query for server state
- Index commonly filtered columns

---

### 3. Testing Coverage

**Current State:**
- Very limited unit tests
- No E2E tests for restaurant flow

**Add Tests:**
```javascript
// Unit Tests
describe('RestaurantService.createOrder', () => {
  it('generates daily token number sequence')
  it('reserves stock for all items')
  it('creates kitchen order with correct items')
  it('marks table as occupied for dine-in')
  it('handles missing token column gracefully')
})

// Integration Tests
describe('Restaurant Order Flow', () => {
  it('creates dine-in order end-to-end')
  it('creates delivery order with customer info')
  it('settles order with payment')
  it('cancels order and releases stock')
})

// E2E Tests (Playwright)
describe('Restaurant POS UI', () => {
  it('adds items to cart')
  it('sends order to kitchen')
  it('processes payment')
  it('prints KOT')
})
```

---

### 4. Code Quality

**Current Issues:**
- Large component files (RestaurantPOS is 600+ lines)
- Mixed concerns (UI + business logic)
- Repeated code patterns

**Refactoring:**
```
components/restaurant/
  ├── RestaurantPOS.jsx (main shell, ~200 lines)
  ├── OrderTypeSelector.jsx
  ├── MenuBrowser.jsx
  ├── CartPanel.jsx
  ├── PaymentModal.jsx
  ├── SplitBillModal.jsx
  └── hooks/
      ├── useRestaurantCart.js
      ├── useRestaurantPayment.js
      └── useRestaurantKot.js
```

---

## 📋 Implementation Checklist

### Phase 1: Critical Fixes (Week 1) ✅
- [x] Fix ensureTokenColumn JSDoc bug
- [x] Create token_number migration
- [ ] Apply migration to production
- [ ] Test order creation end-to-end
- [ ] Monitor for token generation errors

### Phase 2: High Priority Features (Weeks 2-4)
- [ ] Implement split bill support
- [ ] Add tip handling
- [ ] Kitchen printer auto-print
- [ ] Order modification flow
- [ ] Write unit tests for new features

### Phase 3: Enhancements (Weeks 5-8)
- [ ] Discount engine
- [ ] Item-level status tracking
- [ ] Waiter dashboard
- [ ] Order analytics
- [ ] E2E testing

### Phase 4: Advanced Features (Weeks 9-12)
- [ ] Reservation system
- [ ] Recipe management
- [ ] Customer feedback
- [ ] Offline mode
- [ ] Mobile app (React Native)

---

## 🧪 Testing Strategy

### Before Each Release:
1. ✅ Run unit tests: `npm run test`
2. ✅ Test in demo-restaurant tenant
3. ✅ Test all order types (dine-in, takeaway, delivery)
4. ✅ Test payment settlement (with and without POS sync)
5. ✅ Verify stock movements
6. ✅ Print sample KOT
7. ✅ Test on mobile device
8. ✅ Test with different user roles
9. ✅ Check GL postings
10. ✅ Monitor error logs for 24 hours

---

## 📞 Support & Maintenance

### Known Issues:
1. ✅ FIXED: ensureTokenColumn not a function
2. Browser print dialog blocks high-volume kitchens (needs thermal)
3. No order modification after KOT sent
4. No split bill support

### Monitoring:
- Track failed order creations
- Monitor KOT print failures
- Track payment settlement errors
- Monitor stock reservation failures
- Track slow kitchen prep times

### Maintenance Tasks:
- Weekly: Review error logs
- Monthly: Analyze order trends
- Quarterly: Optimize slow queries
- Yearly: Archive old orders

---

## 🎓 Training Materials Needed

1. **Staff Training Guide**
   - How to use RestaurantPOS
   - Order types explained
   - Payment processing
   - Handling customer requests

2. **Kitchen Staff Guide**
   - Reading KOT tickets
   - Using KDS
   - Marking items ready

3. **Manager Guide**
   - Reviewing analytics
   - Applying discounts
   - Managing waiters
   - Resolving issues

---

## 📚 Related Resources

- [Restaurant POS Deep Dive](./RESTAURANT_POS_DEEP_DIVE.md) - Complete architecture documentation
- [Database Migrations Guide](../docs/DATABASE_MIGRATIONS.md)
- [POS Hotkeys Reference](../lib/config/posHotkeys.js)
- [KOT Print Format](../lib/pdf/kotPrint.js)
- [Tax Calculation Logic](../lib/utils/posTax.js)

---

**Last Updated:** 2026-08-10  
**Next Review:** 2026-09-10  
**Owner:** Development Team
