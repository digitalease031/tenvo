# Water & Milk Domain Mobile Navigation Improvement

## Summary
Implemented plan-aware, domain-specific mobile navigation for water-delivery and milk-shop domains to provide a clean, native app-like experience on mobile devices.

## Changes Made

### 1. Mobile Hub Navigation (`lib/hooks/useHubMobileNav.js`)

#### New Lean Primary Navigation
Created `WATER_MILK_LEAN_PRIMARY` navigation array specifically for water and milk domains:
```javascript
const WATER_MILK_LEAN_PRIMARY = [
  { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { key: 'route-hisab', label: 'Route', icon: BookOpen },
  { key: 'inventory', label: 'Stock', icon: Package },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: '__more__', label: 'More', icon: Settings },
];
```

#### Key Features:
- **Route** (Daily Route) is now a **primary bottom nav item** for water/milk domains
- Clean 5-item bottom navigation: Home | Route | Stock | Customers | More
- Finance, Reports, Sales, and other advanced tabs moved to "More" menu
- Automatic detection via `routeHisabRelevant || milkHisabRelevant`

#### Implementation:
```javascript
const isWaterOrMilkDomain = useMemo(() => {
  return routeHisabRelevant || milkHisabRelevant;
}, [routeHisabRelevant, milkHisabRelevant]);

const primaryItems = useMemo(() => {
  // For water-delivery and milk-shop domains: use lean primary nav
  if (isWaterOrMilkDomain) {
    return WATER_MILK_LEAN_PRIMARY.map(filterItem).filter((i) => i.visible && !i.locked);
  }
  // Standard navigation for other domains
  const base = isEasyMode ? EASY_PRIMARY : ADVANCED_PRIMARY;
  return base.map(filterItem).filter((i) => i.visible && !i.locked);
}, [isEasyMode, isWaterOrMilkDomain, ctx, safeIsPlatformAdmin]);
```

### 2. Water Route Hisab Mobile UI (`components/water/WaterRouteHisab.jsx`)

#### Hidden Size Toggles on Mobile
Size toggle buttons (19L, 12L, etc.) are now **hidden on mobile** for a cleaner interface:

**Before:**
```jsx
<div className="flex flex-wrap items-center gap-3">
  {/* Size toggles visible on all screens */}
```

**After:**
```jsx
<div className="hidden flex-wrap items-center gap-3 lg:flex">
  {/* Size toggles - hidden on mobile for clean app experience */}
```

#### Benefits:
- No horizontal scrolling required on mobile
- Cleaner, more focused mobile UI
- Size toggles and column visibility controls remain available on desktop (lg+ screens)
- Checklist mode toggle also hidden on mobile, configurable via Settings when needed

## User Experience Improvements

### Mobile View (< lg breakpoint)
1. **Clean Bottom Navigation:**
   - 5 essential tabs only: Home | Route | Stock | Customers | More
   - "Route" tab gives instant access to daily delivery sheet
   - No clutter from irrelevant tabs (Restaurant, Warehouse, Manufacturing, etc.)

2. **Simplified Daily Sheet:**
   - No size toggle buttons taking up space
   - No column visibility dropdowns
   - No checklist mode toggles
   - Full-width action buttons (Print Bills, Generate Bills, etc.)
   - Compact, app-style spacing

3. **More Menu:**
   - Finance, Reports, Settings, and other tabs accessible via "More"
   - Organized list with proper grouping
   - Bills/Reports easily accessible but not cluttering primary nav

### Desktop View (lg+ breakpoint)
- All advanced controls remain visible and functional
- Size toggles (19L, 12L, etc.) available
- Column visibility dropdowns present
- Full feature set unchanged

## Plan Awareness

### Free Plan
- Route tab may be locked/hidden based on plan limits
- Core navigation still functions

### Starter Plan and Above
- Route (Daily Route) becomes primary action
- Full access to daily delivery sheet
- Mobile navigation optimized for daily operations

## Technical Details

### Domain Detection
- Uses existing `isRouteHisabRelevant(category)` and `isMilkHisabRelevant(category)`
- Automatically applies to:
  - `water-delivery` domain
  - `bottled-water` domain (alias)
  - `milk-shop` domain
  - All milk shop aliases (`milk`, `milkshop`, `doodh-shop`, `dairy-shop`)

### Navigation Logic
1. Check if domain is water or milk via `routeHisabRelevant || milkHisabRelevant`
2. If yes, use `WATER_MILK_LEAN_PRIMARY` for bottom nav
3. If no, use standard `EASY_PRIMARY` or `ADVANCED_PRIMARY` based on mode
4. All items still respect plan/RBAC via `resolveNavVisibility`

### Responsive Design
- Mobile: `hidden lg:flex` hides size toggles
- Desktop: Full controls remain visible
- Consistent with existing mobile patterns in the codebase

## Files Modified

1. **`lib/hooks/useHubMobileNav.js`**
   - Added `WATER_MILK_LEAN_PRIMARY` navigation array
   - Added `isWaterOrMilkDomain` detection logic
   - Updated `primaryItems` memo to use lean nav for water/milk domains
   - Updated `overflowItems` memo to properly exclude lean primary items

2. **`components/water/WaterRouteHisab.jsx`**
   - Added `hidden lg:flex` classes to size toggle section
   - Wrapped size controls, column visibility, and checklist mode in responsive container
   - Desktop functionality unchanged

## Testing Recommendations

1. **Mobile Testing:**
   - Test on actual mobile devices or DevTools mobile emulation
   - Verify size toggles are hidden below lg breakpoint
   - Confirm bottom navigation shows 5 items: Home | Route | Stock | Customers | More
   - Verify "Route" tab opens daily delivery sheet
   - Check that Finance/Reports are in "More" menu

2. **Desktop Testing:**
   - Verify size toggles visible on desktop (lg+ screens)
   - Confirm all advanced controls remain functional
   - Check column visibility dropdowns work

3. **Plan Testing:**
   - Test with Free plan (Route may be locked)
   - Test with Starter plan (Route should be accessible)
   - Test with Professional+ plans (full access)

4. **Domain Testing:**
   - Test with `water-delivery` domain
   - Test with `milk-shop` domain
   - Test with other domains (should use standard nav)

## Related Files & Patterns

### Similar Domain-Specific Nav Configs:
- `lib/config/milkShopHubNav.js` - Milk shop nav filtering
- `lib/config/waterDeliveryHubNav.js` - Water delivery nav filtering
- Both use `HIDDEN_NAV_KEYS` to strip restaurant/warehouse/gym chrome

### Mobile UI Patterns:
- `components/layout/HubMobileBottomNav.jsx` - Mobile bottom nav shell
- `lib/utils/mobileLayout.js` - Mobile spacing tokens
- `components/mobile/MobileHubPrimitives.jsx` - Mobile UI components

## Future Enhancements

1. **Settings Access:**
   - Add sheet configuration (sizes, columns) to Settings panel
   - Allow mobile users to configure via Settings instead of inline toggles

2. **Quick Actions:**
   - Consider adding a mobile-specific quick actions menu
   - Could include: Print Daily Bills, Generate Monthly Bills, View Reports

3. **Offline Mode:**
   - Already implemented in WaterRouteHisab (Phase 1)
   - Mobile nav could show offline status indicator

4. **Progressive Disclosure:**
   - Advanced options could be in a collapsible section on mobile
   - "Advanced Options" drawer for size/column configuration

## Verification Commands

```bash
# Verify navigation hook changes
bun run verify:hub-mobile-nav

# Verify water hisab mobile UI
bun run verify:water-delivery

# Run all hub navigation tests
bun run verify:domains
```

## Notes

- This change aligns with the existing domain-specific navigation patterns
- Water and milk domains already have lean feature strips via `mergeWaterDeliveryLeanNavSettings` and `mergeMilkShopLeanNavSettings`
- Mobile navigation now matches the simplified domain focus
- Desktop power users retain full control via visible advanced options
- Changes are backward compatible and don't affect other domain types

---

**Date:** 2026-08-12  
**Status:** ✅ Completed  
**Task:** Mobile Hub Navigation for Water/Milk Domains (Plan-Aware)
