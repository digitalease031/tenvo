# Water Delivery Checklist - Quick Start Guide

## 🚀 For Developers

### Print a Thermal Checklist
```javascript
import { printWaterDeliveryChecklist } from '@/lib/print/waterHisabThermalBill';

// 58mm thermal (minimal)
await printWaterDeliveryChecklist({
  business,
  rows,              // from getWaterHisabDayAction
  products,          // from getWaterHisabDayAction
  deliveryDate,      // 'YYYY-MM-DD'
  riderName,         // active rider name
  paperSize: '58mm',
}, 'print');

// 80mm thermal (with phone & cash)
await printWaterDeliveryChecklist({
  business,
  rows,
  products,
  deliveryDate,
  riderName,
  paperSize: '80mm',
}, 'print');
```

### Print an Area List
```javascript
import { printWaterAreaList } from '@/lib/print/waterHisabThermalBill';

// A4 full page
await printWaterAreaList({
  business,
  rows,
  products,
  deliveryDate,
  riderName,
  paperSize: 'A4',
}, 'print');

// A5 compact
await printWaterAreaList({
  business,
  rows,
  products,
  deliveryDate,
  riderName,
  paperSize: 'A5',
}, 'print');
```

### Use Configuration System
```javascript
import { 
  buildChecklistPayload,
  CHECKLIST_PRESETS,
  readChecklistConfig 
} from '@/lib/storefront/waterChecklistConfig';

// Build enriched payload
const payload = buildChecklistPayload({
  business,
  rows,
  products,
  config: CHECKLIST_PRESETS.full80mm, // or custom config
});

// Access enriched data
payload.enrichedRows;     // rows with calculatedTarget
payload.groups;           // grouped by area with subtotals
payload.totals;           // { stops, targetBottles }
payload.config;           // resolved configuration
```

### Customize Checklist
```javascript
// Read business config with overrides
const config = readChecklistConfig(business, {
  targetStrategy: 'auto',
  areaGrouping: {
    enabled: true,
    sortBy: ['routeLabel', 'townCode'],
    sortOrder: 'asc',
  },
});

// Use in print functions
await printWaterAreaList({
  business,
  rows,
  products,
  deliveryDate,
  riderName,
  paperSize: 'A4',
  // config will be read automatically from business.settings
}, 'print');
```

## 🎯 For Business Users

### Checklist Formats

| Format | Paper Size | Columns | Best For |
|--------|-----------|---------|----------|
| **Thermal 58mm** | 58mm | H# \| Customer \| TGT \| DEL☐ \| REC☐ \| BAL | Quick rider checklist |
| **Thermal 80mm** | 80mm | H# \| Customer \| Phone \| TGT \| DEL☐ \| REC☐ \| CASH☐ \| BAL | Detailed rider checklist |
| **Area List A4** | A4 | # \| A/C \| Address \| Phone \| TGT \| DEL☐ \| REC☐ \| CASH☐ \| BAL | Office register |
| **Area List A5** | A5 | # \| A/C \| Address \| TGT \| DEL☐ \| REC☐ \| CASH☐ \| BAL | Mobile supervisor |

### Column Meanings

- **#** / **H#**: Stop number / House number
- **A/C**: Customer account number
- **Customer**: Customer name
- **Address**: Full address (house + name)
- **Phone**: Customer contact number
- **TGT**: Target bottles to deliver (auto-calculated)
- **DEL☐**: Delivered bottles (rider fills)
- **REC☐**: Received empties (rider fills)
- **CASH☐**: Cash collected (rider fills)
- **BAL**: Bottle balance at customer

### How Targets Are Calculated

The system automatically calculates target bottles:

1. **First**: Sums quantities from all product columns
2. **If empty**: Uses customer's daily bottles preference
3. **Minimum**: Always shows at least 1 for active routes

Example:
```
Customer has:
- 19L bottles: 5 units
- 5L bottles: 10 units
→ Target = 15 bottles total
```

### Area Grouping

Checklists group customers by:
1. **Route Label** (primary)
2. **Town Code** (if route empty)
3. **Delivery Area** (if town empty)
4. **"General"** (if all empty)

Each group shows:
- Area header (blue background)
- Customer rows (zebra-striped)
- Subtotal row (light blue)
- Grand total (black background)

## 🔧 Configuration (Advanced)

### In Business Settings

Store in `businesses.settings.waterHisab.checklist`:

```json
{
  "targetStrategy": "auto",
  "areaGrouping": {
    "enabled": true,
    "sortBy": ["routeLabel", "townCode", "deliveryArea"],
    "sortOrder": "asc",
    "showSubtotals": true
  },
  "columns": {
    "thermal58": ["house", "customer", "target", "delivered", "received", "balance"],
    "thermal80": ["house", "customer", "phone", "target", "delivered", "received", "cash", "balance"],
    "areaList": ["serial", "accountNo", "address", "phone", "target", "delivered", "received", "cash", "balance"]
  },
  "display": {
    "zebraStripe": true,
    "showLegend": true,
    "showReconciliation": true
  }
}
```

### Target Strategies

- **`auto`**: Intelligent calculation (default)
- **`manual`**: Use `manualTarget` if provided
- **`historical`**: Use historical average
- **`scheduled`**: Adjust based on delivery schedule

### Presets

Use pre-configured layouts:
- `minimal58mm`: Basic rider checklist
- `full80mm`: Detailed with phone & cash
- `detailedAreaList`: Full A4 register
- `compactAreaList`: Compact A5 register

## ✅ Verification

Check system health:
```bash
npm run verify:water-checklist
```

All checks should pass ✅

## 📖 Full Documentation

See `docs/WATER_CHECKLIST_SYSTEM.md` for:
- Complete API reference
- All configuration options
- Troubleshooting guide
- Best practices
- Advanced customization

## 🆘 Common Issues

### Targets show as 1
**Fix**: Ensure products are loaded and qtyByProduct is populated

### All in "General" group
**Fix**: Set routeLabel, townCode, or deliveryArea in customer prefs

### Phone not showing
**Fix**: Use 80mm or A4/A5 format (58mm excludes phone)

### Print doesn't open
**Fix**: Allow pop-ups in browser settings

## 📞 Support

1. Run verification: `npm run verify:water-checklist`
2. Check console for validation warnings
3. Review config in business settings
4. Test with default presets first
