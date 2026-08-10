# Restaurant POS Flow Diagrams

## 📊 Complete Order Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RESTAURANT POS ORDER FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Customer   │
│    Arrives   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: ORDER TYPE SELECTION                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │  DINE-IN    │  │   TAKEAWAY   │  │   DELIVERY   │                      │
│  ├─────────────┤  ├──────────────┤  ├──────────────┤                      │
│  │ • Select    │  │ • Customer   │  │ • Customer   │                      │
│  │   table     │  │   name (opt) │  │   name*      │                      │
│  │ • Set       │  │ • Phone (opt)│  │ • Phone*     │                      │
│  │   covers    │  │              │  │ • Address*   │                      │
│  │             │  │              │  │ • Delivery   │                      │
│  │             │  │              │  │   fee        │                      │
│  └─────────────┘  └──────────────┘  └──────────────┘                      │
│         │                │                  │                               │
└─────────┼────────────────┼──────────────────┼───────────────────────────────┘
          │                │                  │
          └────────────────┴──────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: MENU BROWSING & CART BUILDING                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────┐    ┌────────────────────────────────┐  │
│  │       MENU BROWSER             │    │        CART PANEL              │  │
│  ├────────────────────────────────┤    ├────────────────────────────────┤  │
│  │ • Search by name/SKU           │    │ • Item list with qty controls  │  │
│  │ • Filter by category           │    │ • Add/remove items             │  │
│  │ • View prices                  │    │ • View subtotal                │  │
│  │ • Check stock status (LOW)     │    │ • View tax breakdown           │  │
│  │ • Tap item to add to cart      │    │ • View total                   │  │
│  └────────────────────────────────┘    └────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────┬───────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: SEND TO KITCHEN (KOT)                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User clicks "Send to Kitchen" (F5) or "Quick Pay"                          │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  createRestaurantOrderAction()                              │            │
│  ├─────────────────────────────────────────────────────────────┤            │
│  │  1. Generate order number (ORD-000001)                      │            │
│  │  2. Generate token number (1, 2, 3... daily) ← FIX HERE    │            │
│  │  3. Calculate totals (subtotal + tax + delivery)            │            │
│  │  4. Create restaurant_orders row                            │            │
│  │  5. Create restaurant_order_items rows                      │            │
│  │  6. Reserve stock (InventoryService.reserveStock)           │            │
│  │  7. Create kitchen_orders row (KOT)                         │            │
│  │  8. Mark table as 'occupied' (if dine-in)                   │            │
│  └─────────────────────────────────────────────────────────────┘            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  DATABASE WRITES                                            │            │
│  ├─────────────────────────────────────────────────────────────┤            │
│  │  restaurant_orders:                                         │            │
│  │    - status: 'pending'                                      │            │
│  │    - payment_status: 'unpaid'                               │            │
│  │                                                              │            │
│  │  kitchen_orders:                                            │            │
│  │    - status: 'pending'                                      │            │
│  │    - items: [{ name, qty, mods, special }]                 │            │
│  │                                                              │            │
│  │  inventory_reservations:                                    │            │
│  │    - status: 'active'                                       │            │
│  │    - reference: 'KOT Order: ORD-000001'                    │            │
│  └─────────────────────────────────────────────────────────────┘            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  KOT PRINTED                                                │            │
│  ├─────────────────────────────────────────────────────────────┤            │
│  │  *** KITCHEN ORDER TICKET ***                               │            │
│  │  Tenvo Restaurant                                           │            │
│  │  ┌───────────────────────┐                                  │            │
│  │  │   TOKEN NUMBER        │                                  │            │
│  │  │        #42            │                                  │            │
│  │  └───────────────────────┘                                  │            │
│  │  Order #: ORD-000123    Type: DINE-IN                       │            │
│  │  TABLE: 5               Covers: 4                           │            │
│  │  Time: 8/10/26, 12:30 PM                                   │            │
│  │  ═══════════════════════════════════════════════            │            │
│  │  2x Chicken Burger                                          │            │
│  │     + Extra cheese                                          │            │
│  │     *** No onions ***                                       │            │
│  │  1x Caesar Salad                                            │            │
│  │  3x Coca Cola                                               │            │
│  │  ═══════════════════════════════════════════════            │            │
│  │  NOTE: Guest prefers less salt                              │            │
│  │  ═══════════════════════════════════════════════            │            │
│  │  --- END OF KOT ---                                         │            │
│  └─────────────────────────────────────────────────────────────┘            │
│                                                                              │
└──────────────────────────────────────────────────────┬───────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: KITCHEN PREPARATION (KDS)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Kitchen Display System shows order                                         │
│         │                                                                    │
│         ▼                                                                    │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐            │
│  │    PENDING     │ →  │   PREPARING    │ →  │     READY      │            │
│  ├────────────────┤    ├────────────────┤    ├────────────────┤            │
│  │ New order      │    │ Chef started   │    │ Food is ready  │            │
│  │ appears in     │    │ cooking        │    │ for serving    │            │
│  │ queue          │    │                │    │                │            │
│  │                │    │ started_at     │    │ completed_at   │            │
│  │ Priority: 0    │    │ timestamp      │    │ timestamp      │            │
│  │ Elapsed: 0m    │    │ Elapsed: 5m    │    │ Elapsed: 15m   │            │
│  └────────────────┘    └────────────────┘    └────────────────┘            │
│                                                       │                      │
│                                         All items ready?                     │
│                                                       │                      │
│                                                       ▼                      │
│                                         restaurant_orders.status = 'ready'   │
│                                                                              │
└──────────────────────────────────────────────────────┬───────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: PAYMENT SETTLEMENT                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Payment modal auto-opens after sending to kitchen                          │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  PAYMENT METHODS                                            │            │
│  ├─────────────────────────────────────────────────────────────┤            │
│  │  • Cash                                                     │            │
│  │  • Card                                                     │            │
│  │  • Digital Wallet                                           │            │
│  │  • Staff Account                                            │            │
│  │                                                              │            │
│  │  Total: Rs. 1,250                                           │            │
│  │  [Complete Payment] or Enter key                            │            │
│  └─────────────────────────────────────────────────────────────┘            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  settleRestaurantOrderAction()                              │            │
│  ├─────────────────────────────────────────────────────────────┤            │
│  │  BEGIN TRANSACTION                                          │            │
│  │    1. Get restaurant order                                  │            │
│  │    2. [Optional] Create POS transaction if session active   │            │
│  │    3. Record payment in payments table                      │            │
│  │    4. Update order: status='completed', paid='paid'         │            │
│  │    5. Post GL entry (AccountingService)                     │            │
│  │    6. Free table: status='available'                        │            │
│  │    7. Mark kitchen orders: status='completed'               │            │
│  │    8. Release stock reservations                            │            │
│  │    9. Deduct stock (InventoryService.removeStock)           │            │
│  │  COMMIT                                                      │            │
│  └─────────────────────────────────────────────────────────────┘            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  LEDGER POSTINGS                                            │            │
│  ├─────────────────────────────────────────────────────────────┤            │
│  │  journal_entries:                                           │            │
│  │    - type: 'pos_sale'                                       │            │
│  │    - description: 'Restaurant Order #ORD-000123'            │            │
│  │                                                              │            │
│  │  gl_entries:                                                │            │
│  │    DR Cash/Card          1,250                              │            │
│  │       CR Sales Revenue   1,087 (net)                        │            │
│  │       CR Tax Payable       163 (17%)                        │            │
│  │                                                              │            │
│  │  inventory_movements:                                       │            │
│  │    - quantity: -2 (burgers)                                 │            │
│  │    - reference: 'restaurant_order'                          │            │
│  │    - reference_id: order.id                                 │            │
│  └─────────────────────────────────────────────────────────────┘            │
│                                                                              │
└──────────────────────────────────────────────────────┬───────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: COMPLETION                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ✅ Order complete                                                          │
│  ✅ Payment recorded                                                        │
│  ✅ Stock deducted                                                          │
│  ✅ Table freed (if dine-in)                                                │
│  ✅ GL posted                                                               │
│  ✅ Cart cleared                                                            │
│  ✅ Ready for next order                                                    │
│                                                                              │
│  Customer receives receipt and leaves satisfied! 🎉                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Inventory Flow Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INVENTORY MANAGEMENT FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

                        ┌────────────────────────┐
                        │   INITIAL INVENTORY    │
                        │   Chicken Burger: 50   │
                        │   Caesar Salad: 30     │
                        └───────────┬────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 1: ORDER CREATED (KOT)                                              │
│                                                                           │
│  InventoryService.reserveStock()                                         │
│    ├─ Product: Chicken Burger                                            │
│    ├─ Quantity: 2                                                        │
│    ├─ Status: 'active'                                                   │
│    └─ Reference: 'KOT Order: ORD-000123'                                │
│                                                                           │
│  inventory_reservations table:                                           │
│    ┌──────────┬──────────┬─────────┬────────┬──────────────────────┐   │
│    │ product  │ quantity │ status  │ ref    │ reference            │   │
│    ├──────────┼──────────┼─────────┼────────┼──────────────────────┤   │
│    │ Burger   │ 2        │ active  │ ...    │ KOT Order: ORD-123   │   │
│    │ Salad    │ 1        │ active  │ ...    │ KOT Order: ORD-123   │   │
│    └──────────┴──────────┴─────────┴────────┴──────────────────────┘   │
│                                                                           │
│  Physical stock: NO CHANGE YET                                           │
│    - Burger: 50 (but 2 reserved)                                        │
│    - Salad: 30 (but 1 reserved)                                         │
│                                                                           │
│  Available for new orders:                                               │
│    - Burger: 48 (50 - 2 reserved)                                       │
│    - Salad: 29 (30 - 1 reserved)                                        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ SCENARIO A: ORDER COMPLETED                                              │
│                                                                           │
│  RestaurantService.updateOrderStatus({ status: 'completed' })           │
│    │                                                                      │
│    ├─ 1. Mark reservations as 'completed'                               │
│    │     UPDATE inventory_reservations                                   │
│    │     SET status = 'completed'                                        │
│    │     WHERE reference = 'KOT Order: ORD-123'                         │
│    │                                                                      │
│    └─ 2. Deduct physical stock                                          │
│          InventoryService.removeStock()                                  │
│            - Burger: 50 → 48 (-2)                                        │
│            - Salad: 30 → 29 (-1)                                         │
│                                                                           │
│  RESULT:                                                                  │
│    Physical stock: Burger=48, Salad=29                                   │
│    Reservations: Completed (no longer active)                            │
│    Available: Burger=48, Salad=29                                        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ SCENARIO B: ORDER CANCELLED                                              │
│                                                                           │
│  RestaurantService.updateOrderStatus({ status: 'cancelled' })           │
│    │                                                                      │
│    └─ Mark reservations as 'cancelled'                                  │
│       UPDATE inventory_reservations                                      │
│       SET status = 'cancelled'                                           │
│       WHERE reference = 'KOT Order: ORD-123'                            │
│                                                                           │
│  RESULT:                                                                  │
│    Physical stock: NO CHANGE (still Burger=50, Salad=30)                │
│    Reservations: Cancelled (no longer active)                            │
│    Available: Burger=50, Salad=30 (reservation released)                │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 🚨 The Bug That Was Fixed

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE BUG: ensureTokenColumn Error                          │
└─────────────────────────────────────────────────────────────────────────────┘

BEFORE THE FIX:
───────────────

1. User creates order
      │
      ▼
2. RestaurantService.createOrder() called
      │
      ▼
3. Try to generate token_number
      │
      ▼
4. Query: SELECT MAX(token_number) FROM restaurant_orders WHERE...
      │
      ├─ SUCCESS → Continue
      │
      └─ ERROR (42703: column "token_number" does not exist)
            │
            ▼
         5. Try to call this.ensureTokenColumn()
            │
            ▼
         6. ❌ TypeError: this.ensureTokenColumn is not a function
            │
            ▼
         7. 💥 Order creation FAILS completely
            │
            ▼
         8. User sees error in UI


WHY IT HAPPENED:
────────────────

lib/services/RestaurantService.js:

    /**                          ← JSDoc comment starts
    async ensureTokenColumn() {  ← Method is part of comment!
        // ...
    }

JavaScript parser thinks the method is inside a comment, so it's never defined!


AFTER THE FIX:
──────────────

    /**
     * Proper JSDoc comment
     */                          ← JSDoc comment ENDS
    async ensureTokenColumn() {  ← Method is now defined!
        // ...
    }

Now when column is missing:
1. Error 42703 occurs
2. this.ensureTokenColumn() is called successfully
3. Column is created automatically
4. Query is retried
5. ✅ Order created successfully!
```

---

## 🔍 Token Number System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TOKEN NUMBER GENERATION SYSTEM                            │
└─────────────────────────────────────────────────────────────────────────────┘

WHAT IS A TOKEN NUMBER?
───────────────────────

A daily sequence number that makes it easy for kitchen staff to track orders:
- Order #: ORD-000123 (permanent, never resets)
- Token #: 42 (resets to 1 every day at midnight)

Kitchen staff call out: "Token 42 is ready!" instead of "ORD-000123 is ready!"


HOW IT WORKS:
─────────────

Date: 2026-08-10

┌────────┬──────────────┬──────────────┬─────────────┐
│ Time   │ Order Number │ Token Number │ Business ID │
├────────┼──────────────┼──────────────┼─────────────┤
│ 09:00  │ ORD-000120   │ 1            │ abc-123     │
│ 09:15  │ ORD-000121   │ 2            │ abc-123     │
│ 09:30  │ ORD-000122   │ 3            │ abc-123     │
│ 12:00  │ ORD-000123   │ 4            │ abc-123     │
│ 14:30  │ ORD-000124   │ 5            │ abc-123     │
└────────┴──────────────┴──────────────┴─────────────┘

Date: 2026-08-11 (next day)

┌────────┬──────────────┬──────────────┬─────────────┐
│ Time   │ Order Number │ Token Number │ Business ID │
├────────┼──────────────┼──────────────┼─────────────┤
│ 09:00  │ ORD-000125   │ 1 ← RESETS! │ abc-123     │
│ 09:15  │ ORD-000126   │ 2            │ abc-123     │
│ 09:30  │ ORD-000127   │ 3            │ abc-123     │
└────────┴──────────────┴──────────────┴─────────────┘


SQL QUERY:
──────────

SELECT COALESCE(MAX(token_number), 0) + 1 as next_token
FROM restaurant_orders
WHERE business_id = $1 
  AND DATE(created_at) = CURRENT_DATE
  
Example results:
- No orders today → next_token = 1
- 3 orders today (tokens 1,2,3) → next_token = 4
- New day starts → next_token = 1 again


BENEFITS:
─────────

✅ Easy for kitchen staff to remember and call out
✅ Resets daily so numbers stay small (1-100 range typically)
✅ No confusion with long order numbers
✅ Fast lookup (indexed on business_id + date)
✅ Per-tenant isolation (each restaurant has own sequence)
```

---

## 🎯 Key Takeaways

### The Bug:
- ❌ Malformed JSDoc comment
- ❌ Method undefined at runtime
- ❌ Order creation fails
- ❌ Bad user experience

### The Fix:
- ✅ Proper JSDoc syntax
- ✅ Method defined correctly
- ✅ Automatic migration fallback
- ✅ Orders create successfully
- ✅ Token numbers display properly

### The Lesson:
- 🎓 JSDoc comments must be properly closed with `*/`
- 🎓 Test edge cases (missing DB columns)
- 🎓 Add unit tests for critical methods
- 🎓 Use TypeScript to catch undefined methods at compile time

---

**Diagram Version:** 1.0  
**Last Updated:** 2026-08-10  
**See Also:** 
- [Fix Summary](./RESTAURANT_POS_FIX_SUMMARY.md)
- [Deep Dive](./RESTAURANT_POS_DEEP_DIVE.md)
- [Improvements](./RESTAURANT_POS_IMPROVEMENTS.md)
