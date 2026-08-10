# Restaurant POS Deep Dive - Architecture, Flow & Issues

## 🔍 Executive Summary

This document provides a comprehensive analysis of the Restaurant POS system, including:
- Complete architecture and data flow
- Identified bug: `this.ensureTokenColumn is not a function` 
- Missing functionalities
- Improvement recommendations

---

## 🐛 CRITICAL BUG IDENTIFIED

### Error: `this.ensureTokenColumn is not a function`

**Location:** `lib/services/RestaurantService.js:73`

**Root Cause:** 
The `ensureTokenColumn` method is defined with incorrect JSDoc comment format that breaks the JavaScript parsing.

**Current Code (BROKEN):**
```javascript
/**
async ensureTokenColumn(client) {
    try {
        await client.query('ALTER TABLE restaurant_orders ADD COLUMN IF NOT EXISTS token_number INT');
    } catch (e) {
        console.warn('[RestaurantService] ensureTokenColumn warning:', e.message);
    }
},
```

**Issue:** The `/**` comment opener without a closing `*/` causes the method to be treated as part of the comment block, making it undefined at runtime.

**Fix Required:**
```javascript
/**
 * Ensure token_number column exists in restaurant_orders table
 */
async ensureTokenColumn(client) {
    try {
        await client.query('ALTER TABLE restaurant_orders ADD COLUMN IF NOT EXISTS token_number INT');
    } catch (e) {
        console.warn('[RestaurantService] ensureTokenColumn warning:', e.message);
    }
},
```

**Impact:**
- When creating a restaurant order, if the `token_number` column doesn't exist in the database, the fallback migration fails
- This causes order creation to fail completely
- The error appears in the UI as shown in the screenshot

---

## 🏗️ Architecture Overview

### Core Components

#### 1. **Frontend - RestaurantPOS Component**
**File:** `components/restaurant/RestaurantPOS.jsx`

**Key Features:**
- Order type selection (Dine-in, Takeaway, Delivery)
- Table management integration
- Menu browsing with categories and search
- Cart management with quantity controls
- Kitchen order ticket (KOT) printing
- Payment processing
- Tax calculations
- POS hotkeys (F1-F9)
- Mobile-responsive design
- Fullscreen mode

**State Management:**
```javascript
- orderType: 'dine-in' | 'takeaway' | 'delivery'
- selectedTable: Table object or null
- orderItems: Array of cart items
- covers: Number of guests (dine-in only)
- customerName/Phone/Address: For takeaway/delivery
- deliveryFee: For delivery orders
- waiterNote: Kitchen instructions
- paymentMethod: 'cash' | 'card' | 'digital_wallet' | 'staff_account'
- currentOrderId: After order is sent to kitchen
- showPayment: Payment modal state
```

#### 2. **Backend Services**

##### RestaurantService
**File:** `lib/services/RestaurantService.js`

**Methods:**
- `upsertTable()` - Create/update restaurant tables
- `createOrder()` - Create restaurant order with KOT
- `updateOrderStatus()` - Update order lifecycle
- `updateTableStatus()` - Manage table availability
- `updateKitchenOrder()` - Update KDS status
- `ensureTokenColumn()` - **BROKEN** - Migration helper

##### POSService (Integration)
**File:** `lib/services/POSService.js`

**Integration Points:**
- Restaurant orders can optionally sync to POS transactions
- Enabled via `posSettings.syncRestaurantToPos`
- Creates POS transaction record when settling with active session
- Maintains dual ledger: `restaurant_orders` + `pos_transactions`

#### 3. **Server Actions**
**File:** `lib/actions/standard/restaurant.js`

**Exposed Actions:**
- `upsertTableAction()` - Table CRUD
- `getTablesAction()` - Fetch all tables with status
- `updateTableStatusAction()` - Change table status
- `createRestaurantOrderAction()` - Create order + send to kitchen
- `updateOrderStatusAction()` - Update order lifecycle
- `getActiveOrdersAction()` - Get pending/preparing orders
- `settleRestaurantOrderAction()` - **Process payment & complete order**
- `updateKitchenOrderAction()` - KDS status updates
- `getOrderHistoryAction()` - Historical orders with filters
- `getKitchenQueueAction()` - Get KDS queue

---

## 📊 Complete Data Flow

### 1. Order Creation Flow

```
User adds items to cart
  ↓
Selects order type (dine-in/takeaway/delivery)
  ↓
[If dine-in] Selects table + covers
[If delivery] Enters customer info + address + fee
[If takeaway] Optionally enters customer name/phone
  ↓
User clicks "Send to Kitchen" (F5)
  ↓
RestaurantPOS.submitOrder({ skipKitchen: false })
  ↓
createRestaurantOrderAction()
  ↓
RestaurantService.createOrder()
  ├─ Generate order_number (ORD-XXXXXX)
  ├─ Generate token_number (daily sequence) ← **BUG HERE**
  ├─ Calculate totals (subtotal, tax, discount, delivery fee)
  ├─ Create restaurant_orders row
  ├─ Create restaurant_order_items rows
  ├─ Reserve stock via InventoryService.reserveStock()
  ├─ Create kitchen_orders row (KOT)
  └─ Mark table as 'occupied'
  ↓
UI shows success toast with order # and token #
  ↓
KOT printed via printKotWindow()
  ↓
Payment modal opens automatically
```

### 2. Payment Settlement Flow

```
User selects payment method
  ↓
User clicks "Complete Payment" or presses Enter
  ↓
RestaurantPOS.handlePayment()
  ↓
settleRestaurantOrderAction()
  ↓
BEGIN TRANSACTION
  ├─ Get restaurant order
  ├─ [Optional] Create POS transaction if session active
  │   └─ Maps order lines to POS items via mapOrderLinesToPosItems()
  ├─ Record payment in payments table
  ├─ Update restaurant_orders: status='completed', payment_status='paid'
  ├─ Post GL entry via AccountingService (if not POS synced)
  ├─ Free table: status='available', current_order_id=NULL
  └─ Mark kitchen_orders as 'completed'
COMMIT
  ↓
UI clears cart and resets form
  ↓
onOrderComplete callback fires
```

### 3. Inventory Flow

**KOT Creation (Soft Reserve):**
```
RestaurantService.createOrder()
  ↓
For each item with productId:
  InventoryService.reserveStock()
    - Creates inventory_reservations row
    - Status: 'active'
    - Reference: 'KOT Order: ORD-XXXXXX'
    - Does NOT decrement physical stock yet
```

**Order Completion (Hard Deduction):**
```
RestaurantService.updateOrderStatus({ status: 'completed' })
  ↓
For each item:
  ├─ Mark reservation as 'completed'
  └─ InventoryService.removeStock()
      - Decrements product_stock_locations or products.stock
      - FIFO allocation for batch/serial tracking
      - Reference: 'restaurant_order', reference_id: order.id
```

**Order Cancellation (Release Reserve):**
```
RestaurantService.updateOrderStatus({ status: 'cancelled' })
  ↓
Mark all reservations as 'cancelled' for that order
  - Stock returns to available pool
  - No physical deduction occurs
```

### 4. Kitchen Display System (KDS) Flow

```
createOrder() creates kitchen_orders row
  ├─ station: 'hot' | 'cold' | 'grill' | null
  ├─ status: 'pending'
  ├─ items: JSON array of line items
  └─ priority: integer (higher = urgent)
  ↓
Kitchen staff view via getKitchenQueueAction()
  - Displays order #, token #, table, items, elapsed time
  ↓
Staff clicks "Start Preparing"
  updateKitchenOrderAction({ status: 'preparing' })
    - Sets started_at timestamp
  ↓
Staff clicks "Mark Ready"
  updateKitchenOrderAction({ status: 'ready' })
    - Sets completed_at timestamp
    - If all kitchen orders for parent are ready:
      → Update restaurant_orders.status = 'ready'
```

---

## 🗃️ Database Schema

### restaurant_orders
```sql
- id (uuid, PK)
- business_id (uuid, FK to businesses)
- order_number (varchar, unique) - ORD-XXXXXX
- token_number (int) - Daily sequence 1,2,3...
- table_id (uuid, FK to restaurant_tables, nullable)
- order_type (varchar) - 'dine_in' | 'takeaway' | 'delivery'
- customer_id (uuid, FK to customers, nullable)
- waiter_id (uuid, FK to user, nullable)
- status (varchar) - 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
- payment_status (varchar) - 'unpaid' | 'paid'
- payment_method (varchar)
- subtotal (numeric)
- tax_amount (numeric)
- discount_amount (numeric)
- total_amount (numeric)
- notes (text) - JSON metadata for customer/delivery info
- created_at, updated_at
```

### restaurant_order_items
```sql
- id (uuid, PK)
- business_id (uuid)
- order_id (uuid, FK to restaurant_orders)
- product_id (uuid, FK to products, nullable)
- item_name (varchar)
- quantity (numeric)
- unit_price (numeric)
- modifiers (jsonb) - [{ name, price }, ...]
- special_instructions (text)
- status (varchar) - 'pending' | 'preparing' | 'ready' | 'served'
- created_at, updated_at
```

### restaurant_tables
```sql
- id (uuid, PK)
- business_id (uuid)
- table_number (varchar, unique per business)
- name (varchar) - Display name
- section (varchar) - 'indoor' | 'outdoor' | 'patio' | etc
- capacity (int) - Number of seats
- status (varchar) - 'available' | 'occupied' | 'reserved'
- current_order_id (uuid, FK to restaurant_orders, nullable)
- is_active (boolean)
- sort_order (int)
```

### kitchen_orders
```sql
- id (uuid, PK)
- business_id (uuid)
- order_id (uuid, FK to restaurant_orders)
- station (varchar) - 'hot' | 'cold' | 'grill' | null
- priority (int) - Higher = more urgent
- status (varchar) - 'pending' | 'preparing' | 'ready' | 'completed'
- items (jsonb) - Array of { item_name, quantity, mods, special }
- estimated_time (int) - Minutes
- started_at, completed_at
- created_at, updated_at
```

### inventory_reservations
```sql
- id (uuid, PK)
- business_id (uuid)
- product_id (uuid, FK to products)
- quantity (numeric)
- status (varchar) - 'active' | 'completed' | 'cancelled'
- reference (text) - 'KOT Order: ORD-XXXXXX'
- created_at, updated_at
```

---

## ⚡ POS Hotkeys

**Implemented in RestaurantPOS:**

| Key | Action | Description |
|-----|--------|-------------|
| F1  | Search | Focus search/scan input |
| F2  | Customer | Focus customer field (takeaway/delivery) |
| F3  | Discount | Shows toast (managed from hub) |
| F4  | Hold | Shows toast (use Send to Kitchen) |
| F5  | Pay/Send | Send to Kitchen or Complete Payment |
| F6  | Payment | Cycle payment method |
| F7  | Tax | Open tax panel (if enabled) |
| F8  | Clear | Clear order (requires manager PIN) |
| F9  | Print | Print bill from cart |
| F11 | Fullscreen | Toggle fullscreen mode |
| Ctrl+F | Search | Focus search input |
| Enter | Confirm | Complete payment (when in payment modal) |
| Esc | Clear Search | Clear search term |

---

## 🚀 Features Implemented

### ✅ Core Features
- [x] Multi-order type support (dine-in, takeaway, delivery)
- [x] Table management with real-time status
- [x] Category-based menu browsing
- [x] Product search by name/SKU
- [x] Cart with quantity controls
- [x] Tax calculation (inclusive/exclusive modes)
- [x] Kitchen order ticket (KOT) printing
- [x] Token number system (daily sequence)
- [x] Payment processing with multiple methods
- [x] Table status updates
- [x] Order history tracking
- [x] Kitchen Display System (KDS)
- [x] Stock reservation system
- [x] Delivery fee calculation
- [x] Customer information capture
- [x] Special instructions/notes
- [x] Optional POS ledger sync
- [x] General Ledger (GL) posting
- [x] Mobile-responsive design
- [x] POS hotkeys
- [x] Manager PIN gates for sensitive actions
- [x] Auto-print KOT after sending to kitchen
- [x] Payment modal auto-opens after KOT
- [x] Fullscreen mode

### ✅ Advanced Features
- [x] Pro-rata tax allocation
- [x] Dual ledger support (restaurant + POS)
- [x] FIFO stock allocation
- [x] Batch/serial tracking integration
- [x] Cover count tracking
- [x] Kitchen station routing
- [x] Priority queuing
- [x] Order modifiers support
- [x] Order status lifecycle management
- [x] Table section organization
- [x] Regional currency/locale support

---

## ❌ Missing Functionalities & Gaps

### 1. **Token Column Migration**
**Priority:** 🔴 CRITICAL
- The `ensureTokenColumn` method is broken (documented above)
- Needs immediate fix to prevent order creation failures

### 2. **Split Bill / Partial Payments**
**Priority:** 🟡 HIGH
- Currently only supports full payment in one transaction
- No support for splitting bills across multiple payment methods
- No support for partial payments with balance tracking

### 3. **Tip/Gratuity Handling**
**Priority:** 🟡 HIGH
- No UI or backend support for tips
- Important for restaurant industry
- Should support percentage or fixed amount
- Should track tip separately from order total

### 4. **Order Modifications After Sending to Kitchen**
**Priority:** 🟡 HIGH
- Once sent to kitchen, items cannot be added/removed
- No "Modify Order" flow
- Kitchen must manually handle changes

### 5. **Item-Level Status Tracking**
**Priority:** 🟢 MEDIUM
- restaurant_order_items has status field but not wired to UI
- No way to mark individual items as served
- Useful for large tables with staggered serving

### 6. **Waiter/Staff Management**
**Priority:** 🟢 MEDIUM
- Limited waiter tracking
- No waiter assignment UI in POS
- No waiter performance reports

### 7. **Reservation System Integration**
**Priority:** 🟢 MEDIUM
- Tables can be marked 'reserved' but no booking flow
- No reservation time slots
- No guest arrival tracking

### 8. **Kitchen Preparation Time Tracking**
**Priority:** 🟢 MEDIUM
- `estimated_time` field exists but not used
- No actual vs estimated time reports
- No kitchen efficiency metrics

### 9. **Order Modifiers Pricing**
**Priority:** 🟢 MEDIUM
- Modifiers stored but pricing not fully integrated
- No UI to add modifiers in RestaurantPOS
- Modifier prices not reflected in totals

### 10. **Quick Pay (Skip Kitchen) Refinement**
**Priority:** 🟢 MEDIUM
- `skipKitchen` flag exists but UX is confusing
- Should have separate "Quick Sale" button for beverages/retail items
- Inventory still decremented but no KOT printed

### 11. **Order Transfer Between Tables**
**Priority:** 🟢 LOW
- Cannot move an order from one table to another
- Useful when guests change tables

### 12. **Multi-Language KOT**
**Priority:** 🟢 LOW
- KOT only prints in English
- Regional languages (Urdu, Arabic, etc.) not supported

### 13. **Combo Meals / Set Menus**
**Priority:** 🟢 LOW
- No support for bundled items at special pricing
- Example: "Lunch Special" with drink + main + dessert

### 14. **Happy Hour / Time-Based Pricing**
**Priority:** 🟢 LOW
- No dynamic pricing based on time of day
- Important for bars and lounges

### 15. **Offline Mode**
**Priority:** 🟢 LOW
- No offline support for restaurant POS
- POS Terminal has offline Phase 1 but not restaurant variant

### 16. **Order Cancellation Improvements**
**Priority:** 🟢 LOW
- Cancellation requires manual status update
- No cancellation reason tracking
- No partial cancellation (cancel specific items)

### 17. **Kitchen Printer Auto-Print**
**Priority:** 🟡 HIGH
- Currently uses browser print dialog
- Should support direct thermal printer via network/USB
- Silent printing for high-volume kitchens

### 18. **Customer Feedback / Rating**
**Priority:** 🟢 LOW
- No post-meal feedback collection
- No rating system

### 19. **Discounts & Promotions**
**Priority:** 🟡 HIGH
- Very limited discount support
- No promo codes
- No item-level discounts (only order-level)
- No happy hour auto-discounts

### 20. **Ingredient/Recipe Management**
**Priority:** 🟢 LOW
- No recipe tracking
- No ingredient-level inventory deduction
- Menu items don't decompose into ingredients

---

## 🔧 Recommended Improvements

### 1. **Fix the Critical Bug** 🔴
**File:** `lib/services/RestaurantService.js`
**Change:** Fix JSDoc comment for `ensureTokenColumn()`
**Impact:** Prevents order creation failures

### 2. **Add Migration for token_number Column** 🔴
**Create:** `prisma/migrations/YYYYMMDD_add_restaurant_order_token_number.sql`
```sql
-- Add token_number column if not exists
ALTER TABLE restaurant_orders 
ADD COLUMN IF NOT EXISTS token_number INT;

-- Create index for daily token sequence
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_token_lookup 
ON restaurant_orders(business_id, created_at, token_number) 
WHERE token_number IS NOT NULL;
```

### 3. **Enhance Payment Flow - Split Bill Support** 🟡
**New Method:** `RestaurantService.addPartialPayment()`
**Changes:**
- Add `paid_amount` and `balance` columns to `restaurant_orders`
- Allow multiple payment records per order
- Mark order complete only when `balance = 0`

### 4. **Add Tips Support** 🟡
**UI Changes:** Add tip input field in payment modal
**Backend Changes:**
- Add `tip_amount` column to `restaurant_orders`
- Record tip separately in payments table
- Include in GL posting

### 5. **Improve Order Modification** 🟡
**New Action:** `modifyRestaurantOrderAction()`
**Flow:**
- Allow adding items to existing order
- Create new kitchen order for added items
- Original KOT stays unchanged
- New KOT printed with "ADDITIONAL" label

### 6. **Kitchen Printer Integration** 🟡
**Approach:**
- Support ESC/POS protocol thermal printers
- Network printer via WebSocket bridge
- USB printer via Chrome Native Messaging
- Auto-print on order creation (no dialog)

### 7. **Add Item-Level Status UI** 🟢
**Component:** `OrderItemStatusBadge`
**KDS Changes:**
- Mark individual items complete
- Show item status in order view
- Notify waiters when ready

### 8. **Waiter Dashboard** 🟢
**New Component:** `WaiterDashboard`
**Features:**
- Show assigned tables
- Show orders in progress
- One-tap table status changes
- Tips earned today

### 9. **Order Analytics** 🟢
**New Component:** `RestaurantAnalytics`
**Metrics:**
- Average order value
- Peak hours heat map
- Top-selling items
- Table turnover rate
- Kitchen prep time averages

### 10. **Discount Engine** 🟡
**New Service:** `PromotionService`
**Features:**
- Promo codes (SUMMER20, etc.)
- Item-level discounts
- Time-based discounts (happy hour)
- Combo discounts
- Manager approval for high discounts

---

## 🧪 Testing Recommendations

### Unit Tests Needed
- [ ] RestaurantService.createOrder() with valid data
- [ ] RestaurantService.createOrder() with missing token column
- [ ] RestaurantService.updateOrderStatus() lifecycle
- [ ] mapOrderLinesToPosItems() tax allocation
- [ ] Token number daily sequence reset
- [ ] Stock reservation and release

### Integration Tests Needed
- [ ] End-to-end dine-in order flow
- [ ] End-to-end delivery order flow
- [ ] Payment settlement with POS sync
- [ ] Payment settlement without POS sync
- [ ] Order cancellation with stock return
- [ ] Table status changes
- [ ] KDS queue updates

### E2E Tests Needed
- [ ] Create order → send to kitchen → pay → complete
- [ ] Create order → cancel → verify stock restored
- [ ] Multiple orders on same table (should fail)
- [ ] Pay order → table freed → can create new order
- [ ] KOT print renders correctly
- [ ] Mobile POS usage flow

---

## 📋 Security Considerations

### Current Security
✅ RBAC via `withGuard()` - Permission checks on all actions
✅ Business ID scoping - All queries scoped to tenant
✅ Manager PIN gates - Sensitive actions require approval
✅ SQL injection protection - Parameterized queries
✅ Audit logging - All order actions logged

### Security Gaps
⚠️ No rate limiting on order creation
⚠️ No fraud detection for rapid order cancellations
⚠️ Payment method not validated (any string accepted)
⚠️ No session expiry for open POS windows
⚠️ KOT print contains sensitive customer info (phone/address)

---

## 📱 Mobile Experience

### Current State
- Responsive design with breakpoints
- Touch-optimized buttons
- Mobile pane switching (menu <-> cart)
- Mobile bottom navigation
- Safe area insets respected

### Improvements Needed
- Larger touch targets for high-volume usage
- Swipe gestures (swipe to remove item)
- Pull-to-refresh for order queue
- Haptic feedback on actions
- Offline mode for spotty connectivity

---

## 🎯 Priority Action Items

### Immediate (This Week)
1. 🔴 Fix `ensureTokenColumn()` JSDoc bug
2. 🔴 Run migration to ensure `token_number` column exists
3. 🔴 Add error handling for token generation failures
4. 🟡 Test order creation flow end-to-end

### Short Term (This Month)
1. 🟡 Implement split bill support
2. 🟡 Add tip handling
3. 🟡 Kitchen printer auto-print
4. 🟡 Order modification flow

### Medium Term (Next Quarter)
1. 🟢 Waiter dashboard
2. 🟢 Item-level status tracking
3. 🟢 Discount engine
4. 🟢 Order analytics

### Long Term (Backlog)
1. 🟢 Reservation system
2. 🟢 Recipe/ingredient management
3. 🟢 Customer feedback system
4. 🟢 Offline mode

---

## 📚 Related Documentation

- `docs/AUDIT.md` - Inventory audit procedures
- `docs/DATA_INTEGRITY_AND_FORMS.md` - Form validation patterns
- `docs/DATABASE_MIGRATIONS.md` - Migration best practices
- `lib/config/posHotkeys.js` - POS hotkey definitions
- `lib/print/thermalReceipt.js` - Receipt printing
- `lib/pdf/kotPrint.js` - KOT formatting
- `lib/utils/posTax.js` - Tax calculation helpers

---

## 🤝 Contributing

When working on restaurant POS features:

1. **Always test with real data** - Use demo-restaurant tenant
2. **Test all order types** - Dine-in, takeaway, and delivery
3. **Verify inventory flow** - Check stock reservations and deductions
4. **Test payment settlement** - With and without POS sync
5. **Print KOT** - Ensure formatting is correct
6. **Check mobile layout** - Test on actual mobile devices
7. **Verify RBAC** - Test with different user roles
8. **Run migrations** - Ensure schema changes are applied

---

**Document Version:** 1.0  
**Last Updated:** 2026-08-10  
**Maintained By:** Development Team
