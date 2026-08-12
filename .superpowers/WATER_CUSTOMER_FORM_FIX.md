# Water Customer Entry Form - Default Values Fix

## Issue Summary

The water domain customer entry form was showing the auto-generated Customer ID (`W-VQV747`) in **all empty fields**, causing confusion and duplication. Fields like House/Villa/Office, Floor/Flat, Proprietor/Contact, and Opening Balance Hint were all incorrectly populated with the customer ID.

## Root Cause

In `components/CustomerForm.jsx`, the `DomainFieldRenderer` was receiving this problematic value prop:

```jsx
value={formData.domain_data?.[key] || formData.domain_data?.accountno || ''}
```

This fallback logic meant that when any domain field was empty, it would fall back to `accountno` (the Customer ID), causing the ID to appear everywhere.

## Changes Made

### 1. Fixed Field Value Prop (Line ~449)
**Before:**
```jsx
value={formData.domain_data?.[key] || formData.domain_data?.accountno || ''}
```

**After:**
```jsx
value={formData.domain_data?.[key] || ''}
```

Removed the fallback to `accountno` so each field only shows its actual value or remains empty.

### 2. Cleaned Up Default Initialization (Lines ~50-85)

**Improved the initialization logic to:**
- Only set defaults for **operational fields** that genuinely need them:
  - `deliveryarea`: "Bahria Town Karachi (BTK)" (only if not provided)
  - `deliveryroute`: "Bahria Town Route"
  - `productrate`: 150
  - `deliverydays`: "Daily"
  
- **Never set defaults** for address/personal fields that should be user-entered:
  - `houseno` (House/Villa/Office)
  - `floorflat` (Floor/Flat)
  - `proprietorname` (Proprietor/Contact)
  - `openingbalancehint` (Opening Balance Hint)
  - `postalcode` (Postal Code)
  - `areacode` (Area Code)

**Key code improvement:**
```jsx
// For water domain, set sensible defaults for key operational fields only
// Do NOT set defaults for address fields (houseno, floorflat, proprietorname, openingbalancehint)
const waterDefaults = isWaterHisabRelevant(category) ? {
    deliveryarea: defaultArea || 'Bahria Town Karachi (BTK)',
    deliveryroute: 'Bahria Town Route',
    productrate: 150,
    deliverydays: 'Daily',
} : {};
```

## Expected Behavior After Fix

### ✅ What Should Happen Now

1. **Delivery Area**: Shows "Bahria Town Karachi (BTK)" by default (sensible operational default)
2. **Route/Rider**: Shows "Bahria Town Route" (matches the delivery area default)
3. **Product Rate**: Shows 150 (standard rate per bottle)
4. **Delivery Days**: Shows "Daily" (most common cadence)
5. **Account No (Customer ID)**: Auto-generated `W-XXXXXX` (read-only, system-managed)

### ✅ What Should Be Blank (User Entry Required)

1. **Postal / Area Code**: Blank (auto-filled when delivery area is selected)
2. **House / Villa / Office**: Blank (customer-specific address)
3. **Floor / Flat**: Blank (customer-specific detail)
4. **Proprietor / Contact**: Blank (customer-specific contact person)
5. **Opening Balance Hint**: Blank (only for migration scenarios)
6. **Deposit on File**: Blank (customer-specific)
7. **Bottles with Customer**: Blank (customer-specific inventory)

## User Experience Improvements

### Before Fix
- ❌ Customer ID appeared in 6+ unrelated fields
- ❌ Users had to manually clear duplicate IDs
- ❌ Confusion about which fields to fill
- ❌ Risk of saving incorrect data

### After Fix
- ✅ Only relevant defaults shown
- ✅ Clear which fields need user input (they're blank)
- ✅ No duplicate customer IDs
- ✅ Professional, Zoho/Busy-style data entry
- ✅ Easy to understand field purposes

## Related Files

- `components/CustomerForm.jsx` - Main form component (fixed)
- `components/domain/DomainFieldRenderer.jsx` - Field rendering logic (already correct)
- `lib/domainData/retail.js` - Water domain field definitions (reference)
- `lib/storefront/waterShopHisab.js` - Water customer preferences utilities

## Testing Checklist

- [ ] Open Add New Customer for water-delivery domain
- [ ] Verify Customer ID (Account No) is auto-generated
- [ ] Verify Delivery Area shows "Bahria Town Karachi (BTK)"
- [ ] Verify Route shows "Bahria Town Route"
- [ ] Verify Product Rate shows "150"
- [ ] Verify Delivery Days shows "Daily"
- [ ] Verify House/Villa/Office is **blank**
- [ ] Verify Floor/Flat is **blank**
- [ ] Verify Proprietor/Contact is **blank**
- [ ] Verify Opening Balance Hint is **blank**
- [ ] Save a new customer and verify data integrity
- [ ] Edit an existing customer and verify fields populate correctly

## Domain Knowledge Reference

According to `lib/domainData/retail.js`, water-delivery customer fields:

**Fields with sensible defaults:**
- `city`: 'Karachi' (business location)
- `deliveryarea`: City-specific areas with postal codes
- `deliverydays`: 'Daily' (most common cadence)
- `productrate`: Per-bottle rate (business-specific)
- `deliveryroute`: Route/rider name (operational default)

**Fields that should remain blank (user-entered):**
- `houseno`: Customer address
- `floorflat`: Apartment/floor detail
- `proprietorname`: Contact person name
- `postalcode`: Auto-filled from area (can be manual)
- `dailybottles`: Customer consumption pattern
- `bottlebalance`: Current empties with customer
- `emptydeposit`: Security deposit amount
- `openingbalancehint`: Migration-only field

## Notes

- Customer ID (`accountno`) is **system-generated** and **read-only**
- Postal Code is **auto-filled** when Delivery Area is selected (via `onDomainPatch`)
- All address fields are **optional** for flexibility
- Only customer **name** is truly required
- Form follows Pakistani water delivery business practices (BTK = Bahria Town Karachi)
