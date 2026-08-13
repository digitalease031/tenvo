# Construction Domain Quick Reference

## Status: ⚠️ 40% Complete

### What Works ✅
1. **Domain knowledge** — Full PEC/PPRA/MRS configuration
2. **Intelligence helpers** — IPC calculation, BOQ variance, escalation formulas
3. **Seed catalog** — 14 construction SKUs
4. **Storefront template** — Company showcase website (needs to be portfolio-style)
5. **Registration** — Rich catalog seeded on signup

### What's Missing ❌
1. **Projects hub tab** — No UI to manage construction projects
2. **BOQ tracking** — No hub UI for BOQ line items
3. **IPC billing** — No hub UI for IPC running bills
4. **Machinery logbook** — No hub UI for equipment logs
5. **Database schema** — No `ConstructionProject`, `BOQItem`, `IPC`, `MachineryLog` tables
6. **Server actions** — No CRUD actions for projects/IPC/BOQ
7. **PDF templates** — No IPC bill PDF, BOQ estimate PDF
8. **Portfolio storefront** — Storefront is retail-style (should be services/projects showcase)

---

## Core Construction Features Needed

### 1. Projects Management
- Project registry (Code, Name, Client, Contract Value, PEC Category)
- BOQ items per project
- IPC timeline (#1, #2, ... Final)
- % complete, spend vs budget, alerts

### 2. IPC (Interim Payment Certificate) Billing
- Calculate: Gross certified → Deduct retention (5-10%) → Recover mobilization advance → Apply WHT (7.5%) + Provincial Tax (PRA/SRB/KPRA) → Net payable
- Status workflow: SUBMITTED → VERIFIED → APPROVED → DISBURSED
- PDF generation

### 3. BOQ (Bill of Quantities) Tracking
- Line items: Item No, Description, Unit, Qty, Rate
- Composite rate breakdown (Material/Labor/Machinery)
- Variance analysis (Estimated vs Actual)
- MRS/CSR schedule code mapping

### 4. Machinery & Equipment
- Daily logbook (hour-meter, fuel, output)
- Productivity analysis (fuel per hour, output per hour)
- Maintenance schedules

### 5. Subcontractor Ledger
- Work orders, certified amounts, retainage (10%)
- Running account (certified vs paid)
- DLP release workflow

---

## Intelligence Helpers Available

### In `lib/construction/constructionIntelligence.js`:
- `computeIPCRunningBill()` — Full IPC calculation with retention, mobilization, WHT, provincial tax
- `computeCompositeRateAnalysis()` — Material/Labor/Machinery breakdown
- `computePECEscalation()` — PEC Clause 70 price adjustment
- `analyzeBOQVariance()` — Estimated vs actual cost variance
- `analyzeEquipmentProductivity()` — Fuel consumption analysis
- `projectConstructionCashFlow()` — Monthly S-curve projection
- `materialRateVarianceAlert()` — BOQ rate vs market rate alerts

### In `lib/construction/constructionCosting.js`:
- `buildRealtimeBOQEstimate()` — BOQ with MRS/CSR rates, inflation multiplier
- `analyzeTenderPrice()` — Bid risk analysis (L1 status, risk score)
- `calculateFXSensitivity()` — USD/PKR impact on imported materials
- `computeMobilizationAdvance()` — Advance amortization schedule

### In `lib/construction/constructionProjects.js`:
- `createConstructionProject()` — Project initialization helper
- `recordProjectIPC()` — IPC logging helper
- `logMachineryOperation()` — Daily equipment log helper
- `getConstructionDomainSnapshot()` — Project summary

---

## Required Database Schema

```prisma
model ConstructionProject {
  id                    String   @id @default(uuid())
  business_id           String
  code                  String   // PRJ-001
  name                  String
  client_name           String
  contractor_category   String   // C-A, C-1, etc.
  contract_value        Decimal
  commencement_date     DateTime
  completion_date       DateTime
  status                String   @default("ACTIVE")
  
  cumulative_certified  Decimal  @default(0)
  retention_held        Decimal  @default(0)
  mobilization_recovered Decimal @default(0)
  
  boq_items             BillOfQuantitiesItem[]
  ipcs                  InterimPaymentCertificate[]
  machinery_logs        MachineryLog[]
}

model BillOfQuantitiesItem {
  id                   String   @id @default(uuid())
  project_id           String
  item_no              String   // BOQ-3.1
  description          String
  unit                 String   // Cu.M, Ton
  estimated_qty        Float
  estimated_rate       Decimal
  actual_qty           Float    @default(0)
  actual_rate          Decimal?
  schedule_code        String?  // MRS-PUNJAB-14.2
}

model InterimPaymentCertificate {
  id                        String   @id @default(uuid())
  project_id                String
  ipc_number                Int
  period_ending             DateTime
  gross_certified_amount    Decimal
  retention_deduction       Decimal
  mobilization_recovery     Decimal
  wht_deduction             Decimal
  provincial_tax_deduction  Decimal
  net_payable               Decimal
  status                    String   @default("SUBMITTED")
}

model MachineryLog {
  id                 String   @id @default(uuid())
  business_id        String
  project_id         String?
  machinery_code     String   // EQ-01
  machinery_name     String   // Excavator CAT 320
  operator_name      String
  hours_worked       Float
  fuel_litres        Float
  date               DateTime
}
```

---

## Key Files

### Domain Config
- `lib/domainData/construction.js` — Domain knowledge (PEC, MRS, rates)
- `lib/config/domainPackages.js` — construction-management suite
- `lib/config/domainKeyAliases.js` — Aliases (construction, contractor, etc.)

### Intelligence
- `lib/construction/constructionIntelligence.js` — IPC, BOQ, escalation
- `lib/construction/constructionProjects.js` — Project helpers
- `lib/construction/constructionCosting.js` — BOQ estimation, tender analysis

### Storefront
- `components/storefront/sections/construction/ConstructionHomeSections.jsx`

### Data
- `lib/dataLab/constructionContractorCatalog.js` — 14 seed SKUs

---

## Implementation Priority

### Phase 1: Core Project Management (Critical)
1. Add database schema (Project, BOQItem, IPC, MachineryLog)
2. Create server actions (projects CRUD, IPC recording)
3. Build hub components (ProjectsManager, IPCTimeline, BOQTable)
4. Add "Projects" tab to construction hub

### Phase 2: IPC Billing
1. IPC calculator UI
2. IPC PDF template
3. Approval workflow

### Phase 3: Portfolio Storefront
1. Remove retail elements (cart, checkout)
2. Add portfolio sections (projects, services, certifications)
3. RFQ form

### Phase 4: Machinery & Subcontractors
1. Machinery logbook UI
2. Subcontractor ledger UI

---

## Quick Test Commands

```bash
# Verify domain configuration
bun run verify:domains

# Verify construction seed catalog
node scripts/verify-construction-seed.mjs

# Check construction domain operations
bun run verify:domain-operations
```

---

## Recommended Next Action

**Build the Projects Hub Tab** — This is the #1 missing piece. Construction businesses need to see their active projects, not just inventory.

1. Add Prisma schema (ConstructionProject, BOQItem, IPC)
2. Create `lib/actions/construction/projects.js` (CRUD)
3. Build `components/construction/ConstructionProjectsManager.jsx`
4. Wire to hub: `/business/projects`
5. Show in Domain Operations widget

---

## Construction vs Retail Comparison

| Feature | Retail | Construction |
|---------|--------|-------------|
| Core Entity | Products | **Projects** |
| Revenue Model | Per-unit sales | **Long-term contracts** |
| Billing | Invoices | **IPCs (Interim Payment Certificates)** |
| Inventory | Stock for sale | **BOQ materials for project consumption** |
| Storefront | E-commerce | **Company portfolio & services** |
| KPIs | Daily sales | **Contract value, % complete, retention** |
| Customers | Buyers | **Clients (govt, developers)** |
| Documents | Sales invoices | **BOQ, IPC, Work Orders** |

---

## Contact for Questions

See full audit: `CONSTRUCTION_DOMAIN_AUDIT_2026.md`
