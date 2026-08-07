# Water Delivery Checklist System

## Overview

The water delivery checklist system provides **intelligent, customizable, and accurate** checklists for water delivery route management. The system supports both thermal receipts (58mm/80mm) and full-page area lists (A4/A5).

## Key Features

### 🎯 Intelligence
- **Smart Target Calculation**: Automatically calculates target bottles from multiple data sources
- **Flexible Grouping**: Intelligently groups customers by route/area/town
- **Auto-totals**: Calculates subtotals and grand totals automatically
- **Edge Case Handling**: Handles missing data, walk-ins, and inactive customers gracefully

### ⚙️ Customization
- **Per-Business Configuration**: Customize checklist preferences via `settings.waterHisab.checklist`
- **Column Visibility**: Enable/disable columns based on workflow needs
- **Area Grouping Rules**: Configure how customers are grouped and sorted
- **Target Strategies**: Choose from auto, manual, historical, or scheduled calculation methods
- **Multiple Presets**: Pre-configured layouts for common workflows

### ✅ Accuracy
- **Real Data Integration**: All calculations based on actual route hisab data
- **Phone & Account Info**: Pulls from customer records via `getWaterHisabDayAction`
- **Bottle Balance**: Reflects true opening balance + DEL - REC
- **No Hardcoding**: All totals are calculated, never hardcoded

## Checklist Formats

### 1. Thermal 58mm (Minimal)
**Use Case**: Compact rider checklist for small thermal printers  
**Columns**: H# | CUSTOMER | TGT | DEL☐ | REC☐ | BAL  
**Best For**: Quick route lists, minimal details

```javascript
await printWaterDeliveryChecklist({
  business,
  rows,
  products,
  deliveryDate,
  riderName,
  paperSize: '58mm',
}, 'print');
```

### 2. Thermal 80mm (Full)
**Use Case**: Detailed rider checklist with phone and cash tracking  
**Columns**: H# | CUSTOMER | PHONE | TGT | DEL☐ | REC☐ | CASH☐ | BAL  
**Best For**: Routes requiring contact info and cash collection

```javascript
await printWaterDeliveryChecklist({
  business,
  rows,
  products,
  deliveryDate,
  riderName,
  paperSize: '80mm',
}, 'print');
```

### 3. Area List A4/A5 (Register)
**Use Case**: Full-page register format for plant office  
**Columns**: # | A/C | ADDRESS | PHONE | TGT | DEL☐ | REC☐ | CASH☐ | BAL  
**Features**:
- Grouped by route/area with sub-headers
- Zebra-stripe rows for readability
- Area subtotals and grand total
- Reconciliation footer with signature line
- Legend explaining columns

```javascript
await printWaterAreaList({
  business,
  rows,
  products,
  deliveryDate,
  riderName,
  paperSize: 'A4', // or 'A5'
}, 'print');
```

## Target Calculation Strategies

The system supports multiple strategies for calculating target bottles:

### Auto (Default)
Intelligently calculates from available data:
1. Sum `qtyByProduct` across all products
2. Fallback to `dailyBottles` preference
3. Minimum 1 for active routes

```javascript
{
  targetStrategy: 'auto'
}
```

### Manual
Uses explicit `manualTarget` if provided, otherwise falls back to auto:

```javascript
{
  targetStrategy: 'manual'
}
```

### Historical
Uses historical average from past deliveries (requires historical data):

```javascript
{
  targetStrategy: 'historical'
}
```

### Scheduled
Adjusts based on delivery schedule (daily/weekly/monthly):

```javascript
{
  targetStrategy: 'scheduled'
}
```

## Area Grouping Configuration

Customize how customers are grouped and sorted:

```javascript
{
  areaGrouping: {
    enabled: true,
    // Priority: first non-empty field wins
    sortBy: ['routeLabel', 'townCode', 'deliveryArea'],
    sortOrder: 'asc', // or 'desc'
    showSubtotals: true,
  }
}
```

### Grouping Logic
1. Check `routeLabel` first
2. If empty, check `townCode`
3. If empty, check `deliveryArea`
4. If all empty, use "General"

## Column Customization

Enable/disable columns per format:

```javascript
{
  columns: {
    thermal58: ['house', 'customer', 'target', 'delivered', 'received', 'balance'],
    thermal80: ['house', 'customer', 'phone', 'target', 'delivered', 'received', 'cash', 'balance'],
    areaList: ['serial', 'accountNo', 'address', 'phone', 'target', 'delivered', 'received', 'cash', 'balance'],
  }
}
```

### Available Columns
- `serial`: Sequential stop number (#)
- `house`: House number identifier (H#)
- `accountNo`: Customer account number (A/C)
- `customer`: Customer name
- `address`: Combined house + name
- `phone`: Customer contact number
- `target`: Target bottles (TGT)
- `delivered`: Delivered bottles - rider fills (DEL☐)
- `received`: Received empties - rider fills (REC☐)
- `cash`: Cash collected - rider fills (CASH☐)
- `balance`: Bottle balance (BAL)

## Business Settings Integration

Configure checklist preferences per business:

```javascript
// In businesses.settings
{
  waterHisab: {
    checklist: {
      targetStrategy: 'auto',
      areaGrouping: {
        enabled: true,
        sortBy: ['routeLabel', 'townCode', 'deliveryArea'],
        sortOrder: 'asc',
        showSubtotals: true,
      },
      columns: {
        thermal58: ['house', 'customer', 'target', 'delivered', 'received', 'balance'],
        thermal80: ['house', 'customer', 'phone', 'target', 'delivered', 'received', 'cash', 'balance'],
        areaList: ['serial', 'accountNo', 'address', 'phone', 'target', 'delivered', 'received', 'cash', 'balance'],
      },
      display: {
        zebraStripe: true,
        showLegend: true,
        showReconciliation: true,
      },
    }
  }
}
```

## Preset Layouts

Use pre-configured presets for common workflows:

```javascript
import { CHECKLIST_PRESETS } from '@/lib/storefront/waterChecklistConfig';

// Minimal 58mm
const config = CHECKLIST_PRESETS.minimal58mm;

// Full 80mm
const config = CHECKLIST_PRESETS.full80mm;

// Detailed A4 area list
const config = CHECKLIST_PRESETS.detailedAreaList;

// Compact A5 area list
const config = CHECKLIST_PRESETS.compactAreaList;
```

## API Functions

### buildChecklistPayload
Build enriched checklist data ready for print:

```javascript
import { buildChecklistPayload } from '@/lib/storefront/waterChecklistConfig';

const payload = buildChecklistPayload({
  business,
  rows,
  products,
  config: {
    targetStrategy: 'auto',
    areaGrouping: { enabled: true },
  },
});

// Returns:
// {
//   config: { ... },
//   groups: [...],
//   enrichedRows: [...],
//   totals: { stops: 50, targetBottles: 250 }
// }
```

### calculateSmartTarget
Calculate target bottles for a single row:

```javascript
import { calculateSmartTarget } from '@/lib/storefront/waterChecklistConfig';

const target = calculateSmartTarget(row, products, config);
```

### groupCustomersByArea
Group customers intelligently:

```javascript
import { groupCustomersByArea } from '@/lib/storefront/waterChecklistConfig';

const groups = groupCustomersByArea(rows, products, config);
// Returns: [{ name: 'Area A', rows: [...], targetTotal: 50 }, ...]
```

### formatCustomerAddress
Format customer address intelligently:

```javascript
import { formatCustomerAddress } from '@/lib/storefront/waterChecklistConfig';

const addr = formatCustomerAddress(row);
// Returns: "H123 — John Doe" or "H123" or "John Doe"
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ getWaterHisabDayAction                                      │
│ (lib/actions/standard/waterHisab.js)                       │
│                                                             │
│ Returns:                                                    │
│ - rows: [{ customerName, phone, houseNo, accountNo,        │
│          qtyByProduct, bottleBalance, ... }]                │
│ - products: [{ id, name, unit, price, ... }]                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ buildChecklistPayload                                       │
│ (lib/storefront/waterChecklistConfig.js)                   │
│                                                             │
│ 1. Read config from business.settings.waterHisab.checklist │
│ 2. Calculate smart targets for each row                    │
│ 3. Group by area if enabled                                │
│ 4. Calculate subtotals and grand totals                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Print Functions                                             │
│                                                             │
│ Thermal: buildWaterDeliveryChecklistHtml/PDF                │
│ Area List: buildWaterAreaListHtml                           │
│                                                             │
│ Uses enriched payload with:                                 │
│ - calculatedTarget per row                                  │
│ - formattedAddress per row                                  │
│ - groups with subtotals                                     │
│ - grand totals                                              │
└─────────────────────────────────────────────────────────────┘
```

## UI Integration

### WaterRouteHisab Component

```jsx
// Thermal checklist
const handlePrintDeliveryChecklist = async (paperSize = '58mm') => {
  await printWaterDeliveryChecklist({
    business: thermalBusiness,
    rows: visibleRows || rows,
    products,
    deliveryDate,
    riderName: riderShifts[0]?.riderName || '',
    paperSize,
  }, 'print');
};

// Area list
const handlePrintAreaList = async (paperSize = 'A4') => {
  await printWaterAreaList({
    business: thermalBusiness,
    rows: visibleRows || rows,
    products,
    deliveryDate,
    riderName: riderShifts[0]?.riderName || '',
    paperSize,
  }, 'print');
};
```

### Customization UI (Future)

```jsx
<ChecklistConfigPanel 
  business={business}
  onSave={async (config) => {
    await updateBusinessSettings({
      businessId: business.id,
      settings: {
        ...business.settings,
        waterHisab: {
          ...business.settings.waterHisab,
          checklist: config,
        },
      },
    });
  }}
/>
```

## Validation

The system validates configuration before use:

```javascript
import { validateChecklistConfig } from '@/lib/storefront/waterChecklistConfig';

const validation = validateChecklistConfig(config);
// Returns: { valid: true/false, errors: [...] }
```

### Validation Rules
- `targetStrategy` must be: auto, manual, historical, or scheduled
- `sortOrder` must be: asc or desc
- `columns` must reference valid column IDs
- `sortBy` must reference valid row fields

## Verification

Run the verification script to ensure proper wiring:

```bash
npm run verify:water-checklist
# or
node scripts/verify-water-checklist.mjs
```

### Checks Performed
1. Core configuration files exist
2. Thermal print integration
3. Area list integration
4. Component integration
5. Target calculation strategies
6. Column customization
7. Area grouping configuration
8. Checklist presets
9. Configuration validation

## Best Practices

### 1. Use Presets as Starting Points
Don't build configs from scratch - start with a preset and customize:

```javascript
import { CHECKLIST_PRESETS } from '@/lib/storefront/waterChecklistConfig';

const myConfig = {
  ...CHECKLIST_PRESETS.full80mm,
  areaGrouping: {
    ...CHECKLIST_PRESETS.full80mm.areaGrouping,
    sortOrder: 'desc',
  },
};
```

### 2. Test Configuration Changes
Always validate after changes:

```javascript
const validation = validateChecklistConfig(newConfig);
if (!validation.valid) {
  console.error('Config errors:', validation.errors);
  return;
}
```

### 3. Preserve Required Columns
Never remove required columns (house, customer, target, delivered, received, balance).

### 4. Consider Printer Capabilities
- 58mm: Minimum columns only (6 max)
- 80mm: Can handle 8 columns comfortably
- A4/A5: Can handle all columns (9 max)

### 5. Match Workflow to Format
- **Rider-only route**: Use 58mm minimal
- **Rider + cash collection**: Use 80mm full
- **Office register**: Use A4 area list
- **Mobile/field supervisor**: Use A5 compact

## Troubleshooting

### Issue: Targets show as 1 for all customers
**Cause**: `qtyByProduct` not populated or products array empty  
**Fix**: Ensure `getWaterHisabDayAction` returns product columns

### Issue: All customers in "General" group
**Cause**: `routeLabel`, `townCode`, and `deliveryArea` all empty  
**Fix**: Set route labels in customer preferences or water stops

### Issue: Phone numbers not showing
**Cause**: Using 58mm format (phone excluded) or customer.phone empty  
**Fix**: Use 80mm or A4/A5 format, or populate customer.phone

### Issue: Configuration not applying
**Cause**: Settings not saved to database  
**Fix**: Update `businesses.settings.waterHisab.checklist`

### Issue: Print dialog doesn't open
**Cause**: Pop-up blocker or blob URL failure  
**Fix**: Allow pop-ups, or system falls back to direct write

## Related Documentation

- [Water Delivery Domain](./WATER_DELIVERY_DOMAIN.md)
- [Route Hisab System](./ROUTE_HISAB.md)
- [Thermal Printing](./THERMAL_PRINTING.md)
- [Domain Verticals](./DOMAIN_VERTICALS.md)

## Support

For issues or questions:
1. Run `npm run verify:water-checklist` first
2. Check console for validation warnings
3. Review configuration in `settings.waterHisab.checklist`
4. Test with preset configs before custom configs
