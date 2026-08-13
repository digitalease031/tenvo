# Construction Domain Comprehensive Audit & Roadmap
**Date**: August 13, 2026  
**Domain Key**: `construction-contractor`  
**Package**: `construction-management`  
**Status**: ⚠️ PARTIALLY IMPLEMENTED - Needs Hub Management UI & Company Website Template

---

## Executive Summary

The construction domain (`construction-contractor`) is **partially implemented** with:
- ✅ **Rich domain knowledge** (BOQ, IPC, PEC categories, MRS rates)
- ✅ **Intelligence helpers** (cost analysis, IPC calculations, escalation formulas)
- ✅ **Seed catalog** (14 construction materials + equipment)
- ✅ **Storefront template** (company showcase website)
- ❌ **Missing hub management UI** (Projects, BOQ, IPC tracking)
- ❌ **Storefront is retail-style** (should be portfolio/services website)
- ❌ **No project management workflows**
- ❌ **Construction-specific features not wired to hub tabs**

**Critical Gap**: Construction businesses need **project & contract management**, not a retail product catalog store.

---

## What We Have ✅

### 1. Domain Knowledge (`lib/domainData/construction.js`)

**Comprehensive configuration including**:
- PEC Contractor Categories (C-A to C-6)
- Pakistani tax categories (FBR WHT 7.5%, PRA, SRB, KPRA, BRA)
- Construction-specific units (Cu.M, Sq.Ft, Ton, Trip, Hour, Day)
- Schedule of Rates references (MRS Punjab, NHA CSR, SPPRA, KPK CSR)
- Material benchmark rates (Steel, Cement, Bitumen, RMC, Aggregate)
- Machinery rental rates (Excavators, Graders, Pavers, Mixers)
- Product fields: `boq_item_no`, `specification_grade`, `schedule_code`, `material_cost_ratio`
- Customer fields: `client_type`, `pec_project_no`, `employer_dept`, `retention_rate`
- Vendor fields: `subcontractor_category`, `pec_license_no`
- Inventory features: `boq_tracking`, `ipc_billing`, `machinery_logbook`

### 2. Intelligence Layer (`lib/construction/`)

**Three specialized modules**:

#### `constructionIntelligence.js`
- `computeCompositeRateAnalysis()` — Material/Labor/Machinery breakdown
- `computeIPCRunningBill()` — IPC with mobilization recovery, retention, WHT, provincial tax
- `computePECEscalation()` — PEC Clause 70 price adjustment formula
- `analyzeBOQVariance()` — Estimated vs actual cost variance
- `analyzeEquipmentProductivity()` — Fuel consumption per output
- `projectConstructionCashFlow()` — Monthly S-curve projection
- `materialRateVarianceAlert()` — Market rate vs BOQ rate alerts
- `computeSubcontractorRetainage()` — Subcontractor retention ledger
- `resolveConstructionDashboardKPIs()` — Hub KPI calculator

#### `constructionProjects.js`
- `createConstructionProject()` — Project registry initialization
- `recordProjectIPC()` — IPC logging with retention/recovery
- `logMachineryOperation()` — Daily plant logbook
- `getConstructionDomainSnapshot()` — Project summary

#### `constructionCosting.js`
- `buildRealtimeBOQEstimate()` — BOQ with MRS/CSR rates, inflation multiplier
- `analyzeTenderPrice()` — Bid risk analysis with L1/L2 comparison
- `calculateFXSensitivity()` — USD/PKR exchange rate impact
- `computeMobilizationAdvance()` — Advance amortization schedule
- `lookupMaterialRate()` — 2026 benchmark lookup

**Provincial Rates**: MRS Punjab, NHA CSR, SPPRA Sindh (25+ rate codes)

### 3. Seed Catalog (`lib/dataLab/constructionContractorCatalog.js`)

**14 SKUs across 6 categories**:
- **Civil & Structural**: Rebar 12mm/25mm, OPC Cement, RMC C25/C30
- **Roads & Asphalt**: Bitumen 60/70, Aggregate 19mm, River Sand
- **Earthwork**: Excavation, Surplus Disposal
- **Plant & Equipment**: Excavator, Grader, Roller, Paver, Mixer (hour/day logs)
- **Labor**: Steel Fixer, Mason, Unskilled Helper
- **MEP**: GI Pipe, XLPE Cable

All SKUs include `domain_data`: `boq_item_no`, `specification_grade`, `schedule_code`, `material_cost_ratio`

### 4. Storefront Template (`components/storefront/sections/construction/ConstructionHomeSections.jsx`)

**Full company showcase website with**:
- Hero banner (Life Sciences & Civil Construction theme)
- "By The Numbers" stats (15 ISO Cleanrooms, 500+ Ops, $12B+ value)
- "Why Consigli?" interactive tabs (Safety, Preconstruction, Emergency, VDC)
- Diverse Modality cards (OSD, Biologics, CGT, Commercial Towers)
- Delivery Methods (CMR, Design-Build, IPD)
- 4 Featured Projects (Pharma, Lab, Housing, RMC Hub)
- 6 In-House Services tabs (Preconstruction, VDC, QC, Lean, IPC, Safety)
- Contact/Quote form

**Theme**: Red accent (#a71930), professional industrial imagery

### 5. Domain Package (`lib/config/domainPackages.js`)

**`construction-management` suite**:
- **Verticals**: `construction-contractor`, `civil-engineering`, `building-construction`, `road-infrastructure`
- **Recommended Plan**: Enterprise
- **Pricing**: PKR 24,999/mo or USD 89/mo
- **Limits**: 50 users, 50K products, 2K customers/vendors, 25 warehouses
- **Packaging**: `boq_tracking`, `ipc_billing`, `machinery_logbook`, `subcontractor_ledger`, `price_escalation_clause`
- **Marketing Path**: `/solutions/construction-management`
- **Demo**: `demo-construction`
- **Module Groups**: BOQ Estimation, IPC Billing, Site Machinery

### 6. Registration & Onboarding

- ✅ Rich catalog seed on registration (`REGISTRATION_RICH_CATALOG_VERTICALS`)
- ✅ Demo profile (`demoStoreProfiles.js`)
- ✅ Domain aliases (10+ aliases: `construction`, `contractor`, `builder`, `civil-engineering`, etc.)
- ✅ Regional brand catalog (PK construction brands: Mughal Steel, Bestway Cement, etc.)

---

## What's Missing ❌

### 1. **Hub Management UI — CRITICAL GAP**

**No dedicated construction hub tabs or components**. Construction businesses need:

#### **Projects Tab** (`/business/projects`)
- Project registry (Code, Name, Client, Contract Value, PEC Category)
- Status workflow (Bidding → Active → DLP → Closed)
- BOQ Items list per project
- IPC Running Bills timeline
- Retention Money ledger
- Mobilization Advance tracker
- Project dashboard (% complete, spend vs budget, alerts)

#### **BOQ Management** (nested under Projects or Inventory)
- BOQ line items (Item No, Description, Unit, Qty, Rate, Total)
- Composite Rate breakdown (Material/Labor/Machinery)
- MRS/CSR schedule code mapping
- Cost variance (Estimated vs Actual)
- Material rate alerts (BOQ rate vs current market)

#### **IPC Billing** (nested under Finance or Sales)
- IPC #1, #2, ... Final workflow
- Cumulative certified amount
- Retention deduction (5-10%)
- Mobilization recovery schedule
- WHT & Provincial Tax calculation
- Net payable summary
- IPC PDF/print templates

#### **Machinery Logbook** (nested under Inventory or Operations)
- Heavy equipment registry (Excavators, Graders, Pavers, etc.)
- Daily hour-meter logs
- Fuel consumption (Liters/Hour)
- Output tracking (Cu.M excavated, tons paved)
- Maintenance schedules
- Rental vs owned cost analysis

#### **Subcontractor Ledger** (nested under Purchases or Vendors)
- Work order registry
- Running account (certified vs paid)
- Retainage tracking (10% typical)
- DLP release workflow
- Payment approval pipeline

#### **Domain Operations Tab**
Currently shows placeholder metrics. Need real DB wiring:
- Active Projects count
- Contract Value (PKR)
- Pending IPC count
- Machinery Fleet Hours
- BOQ Item count

### 2. **Database Schema Extensions**

**Required tables** (not in Prisma schema):

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
  province_code         String?  // PK-PB, PK-SD, PK-KP, PK-BA
  is_government_project Boolean  @default(false)
  mobilization_adv_pct  Float    @default(10)
  retention_pct         Float    @default(5)
  status                String   @default("ACTIVE") // ACTIVE, DLP, CLOSED
  
  cumulative_certified  Decimal  @default(0)
  cumulative_paid       Decimal  @default(0)
  retention_held        Decimal  @default(0)
  mobilization_recovered Decimal @default(0)
  
  boq_items             BillOfQuantitiesItem[]
  ipcs                  InterimPaymentCertificate[]
  machinery_logs        MachineryLog[]
  
  @@index([business_id, status])
  @@unique([business_id, code])
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
  material_cost_ratio  Float?
  labor_cost_ratio     Float?
  machinery_cost_ratio Float?
  
  project              ConstructionProject @relation(fields: [project_id], references: [id])
  @@index([project_id])
}

model InterimPaymentCertificate {
  id                        String   @id @default(uuid())
  project_id                String
  ipc_number                Int
  period_ending             DateTime
  gross_certified_amount    Decimal
  this_ipc_gross            Decimal
  escalation_amount         Decimal  @default(0)
  retention_deduction       Decimal
  mobilization_recovery     Decimal
  secured_advance           Decimal  @default(0)
  net_before_tax            Decimal
  wht_deduction             Decimal
  provincial_tax_deduction  Decimal
  net_payable               Decimal
  status                    String   @default("SUBMITTED") // SUBMITTED, VERIFIED, APPROVED, DISBURSED
  submitted_at              DateTime @default(now())
  
  project                   ConstructionProject @relation(fields: [project_id], references: [id])
  @@index([project_id, ipc_number])
  @@unique([project_id, ipc_number])
}

model MachineryLog {
  id                 String   @id @default(uuid())
  business_id        String
  project_id         String?
  machinery_code     String   // EQ-01
  machinery_name     String   // Excavator CAT 320
  operator_name      String
  start_hours        Float
  end_hours          Float
  hours_worked       Float
  fuel_litres        Float
  fuel_per_hour      Float
  location_station   String
  work_description   String
  date               DateTime
  
  project            ConstructionProject? @relation(fields: [project_id], references: [id])
  @@index([business_id, date])
  @@index([project_id, date])
}
```

### 3. **Server Actions**

**Required in** `lib/actions/construction/`:

```javascript
// projects.js
export async function createProjectAction(data)
export async function updateProjectAction(projectId, data)
export async function getProjectsAction({ businessId, status })
export async function getProjectDetailAction(projectId)

// boq.js
export async function addBOQItemAction(projectId, item)
export async function updateBOQItemAction(itemId, data)
export async function getBOQItemsAction(projectId)
export async function analyzeBOQVarianceAction(projectId)

// ipc.js
export async function recordIPCAction(projectId, ipcData)
export async function getIPCsAction(projectId)
export async function approveIPCAction(ipcId)
export async function generateIPCPdfAction(ipcId)

// machinery.js
export async function logMachineryOperationAction(data)
export async function getMachineryLogsAction({ businessId, projectId, startDate, endDate })
export async function analyzeMachineryProductivityAction(machineryCode, period)
```

### 4. **Hub Components**

**Required in** `components/construction/`:

- `ConstructionProjectsManager.jsx` — Projects list + detail view
- `BOQItemsTable.jsx` — BOQ line items with variance analysis
- `IPCTimeline.jsx` — IPC #1, #2, ... with status
- `IPCCalculator.jsx` — IPC running bill calculation UI
- `MachineryLogbook.jsx` — Equipment daily logs
- `SubcontractorLedger.jsx` — Subcontractor running account
- `ProjectDashboard.jsx` — Project-level KPIs (% complete, budget variance)

### 5. **Storefront Should Be Company Portfolio**

Current storefront is **retail product catalog style** (Add to Cart, /products, categories).

**Construction businesses need**:
- Portfolio showcase (completed projects gallery)
- Services pages (Preconstruction, VDC, EPC, Lean)
- Contact/RFQ forms (not e-commerce checkout)
- Client testimonials
- Certifications (PEC, ISO, PSQCA)
- No cart, no checkout, no product catalog

**Recommended template**: Similar to `vehicle-dealership` (services/portfolio, not retail)

### 6. **PDF Templates**

**Required construction-specific PDFs**:
- IPC Running Bill PDF (`lib/pdf/ipcBillPdf.js`)
- BOQ Cost Estimate PDF
- Project Summary PDF
- Machinery Logbook PDF
- Subcontractor Payment Certificate

### 7. **Plan Feature Gates**

**Construction features should be gated**:
- `boq_tracking` → BOQ tab access
- `ipc_billing` → IPC workflows
- `machinery_logbook` → Equipment logs
- `subcontractor_ledger` → Subcontractor accounts
- `project_costing` → Advanced cost variance analysis

Currently these are defined in domain knowledge but not wired to hub guards.

### 8. **Easy Mode / Simplified Dashboard**

Construction businesses need:
- Active Projects widget
- Pending IPCs alert
- Material rate variance alerts
- Machinery fuel cost summary
- Cash flow projection

Currently `easyDomainIntelligence.js` has placeholder copy but no real data wiring.

---

## Domain-Specific Requirements

### Construction is NOT Retail

**Key differences**:

| Feature | Retail | Construction |
|---------|--------|-------------|
| **Core Entity** | Products | Projects |
| **Revenue Model** | Per-unit sales | Long-term contracts |
| **Billing** | Invoices | IPCs (Interim Payment Certificates) |
| **Inventory** | Stock for sale | BOQ materials for project consumption |
| **Storefront** | E-commerce catalog | Company portfolio & services |
| **KPIs** | Daily sales, stock turnover | Contract value, % complete, retention held |
| **Customers** | Buyers | Clients (government, private developers) |
| **Vendors** | Suppliers | Subcontractors + Material suppliers |
| **Documents** | Sales invoices | BOQ, IPC, Work Orders, Gate Passes |

### Public Website Should Be Portfolio

Construction contractors need:
1. **Hero**: Company tagline, certifications (PEC C-A, ISO 45001)
2. **About**: Years in business, specializations, leadership
3. **Services**: Preconstruction, Design-Build, EPC, VDC, Lean
4. **Projects**: Featured projects gallery (Pharma, Infrastructure, Commercial)
5. **Sectors**: Life Sciences, Industrial, Commercial, Roads, Bridges
6. **Contact**: RFQ form, office locations, leadership contact
7. **Certifications**: PEC license, ISO certifications, safety awards

**No cart, no /products catalog, no Add to Cart buttons**.

### Hub Should Prioritize Project Management

**Navigation priority**:
1. **Projects** (not Inventory first)
2. **BOQ & Costing**
3. **IPC Billing**
4. **Machinery & Equipment**
5. **Subcontractors**
6. **Finance** (IPC payments, retention ledger)
7. **Materials** (BOQ inventory consumption)
8. **Reports** (Project P&L, BOQ Variance, Machinery Productivity)

---

## Recommendations

### Phase 1: Core Project Management (2-3 weeks)

**Goal**: Enable construction businesses to track projects, BOQ, and IPCs.

1. **Database**:
   - Add Prisma models: `ConstructionProject`, `BillOfQuantitiesItem`, `InterimPaymentCertificate`, `MachineryLog`
   - Run migrations

2. **Server Actions**:
   - `lib/actions/construction/projects.js` (CRUD)
   - `lib/actions/construction/ipc.js` (record, calculate, approve)
   - `lib/actions/construction/boq.js` (add items, variance analysis)

3. **Hub Components**:
   - `ConstructionProjectsManager.jsx` (list + detail)
   - `IPCTimeline.jsx` (IPC #1, #2, ... with status)
   - `BOQItemsTable.jsx` (line items + variance)

4. **Hub Tab**:
   - Add "Projects" tab to construction hub
   - Route: `/business/projects`
   - Gate: Plan feature `project_costing`

5. **Domain Operations**:
   - Wire real DB queries in `domainOperationsSnapshot.js`
   - Show: Active Projects, Contract Value, Pending IPCs

### Phase 2: IPC Billing & PDF (1-2 weeks)

1. **IPC Calculator UI**:
   - `IPCCalculator.jsx` with live calculation
   - Inputs: Gross certified, previous cumulative, escalation, secured advance
   - Outputs: Retention, mobilization recovery, WHT, provincial tax, net payable

2. **PDF Templates**:
   - `lib/pdf/ipcBillPdf.js` (IPC Running Bill)
   - Include: Project header, BOQ items, deductions breakdown, net payable
   - Signature blocks for Engineer and Contractor

3. **IPC Approval Workflow**:
   - Status: SUBMITTED → VERIFIED → APPROVED → DISBURSED
   - Notifications when IPC approved
   - Link IPC to Finance/Payments

### Phase 3: Machinery Logbook & Subcontractors (1-2 weeks)

1. **Machinery Logbook**:
   - `MachineryLogbook.jsx` (daily logs)
   - Inputs: Equipment code, operator, start/end hours, fuel, location
   - Analytics: Fuel per hour, output per hour, cost per unit

2. **Subcontractor Ledger**:
   - `SubcontractorLedger.jsx` (running account)
   - Work orders, certified amounts, retainage (10%), payments
   - DLP release workflow

3. **Gate Passes**:
   - Material inward/outward tracking
   - Integration with inventory stock movements

### Phase 4: Portfolio Storefront (1 week)

1. **Remove retail elements**:
   - No cart, no checkout, no "Add to Cart"
   - `/products` → `/projects` (portfolio gallery)
   - Categories → Sectors (Life Sciences, Infrastructure, Commercial)

2. **Add portfolio sections**:
   - Featured Projects with images, specs, location
   - Services grid (Preconstruction, VDC, EPC, Lean, Safety)
   - Client testimonials
   - Certifications showcase (PEC, ISO, Awards)

3. **RFQ Form**:
   - Contact form for project inquiries
   - Fields: Project type, location, scope, budget range
   - Routes to hub Contact Queue

### Phase 5: Advanced Features (2-3 weeks)

1. **BOQ Material Consumption**:
   - Link inventory stock movements to BOQ items
   - Track: Budgeted qty vs actual consumed
   - Alerts when over-budget consumption

2. **PEC Escalation Calculator**:
   - UI for PEC Clause 70 price adjustment
   - Inputs: Base WPI, current WPI, labor/steel/cement/bitumen components
   - Output: Escalation amount to claim in next IPC

3. **Tender Bid Analyzer**:
   - `TenderBidAnalyzer.jsx`
   - Input: Tender price, BOQ estimate, competitor prices
   - Output: L1 status, risk score, margin analysis

4. **Cash Flow Projection**:
   - Monthly S-curve projection
   - Contract value × duration → monthly billing forecast
   - Retention release schedule

5. **Material Rate Alerts**:
   - Monitor market rates vs BOQ rates
   - Alert when variance >10%
   - Recommend escalation claim or forward purchase

---

## Implementation Checklist

### Database & Backend

- [ ] Add Prisma schema: `ConstructionProject`, `BOQItem`, `IPC`, `MachineryLog`
- [ ] Create migrations
- [ ] Server actions: `projects.js`, `ipc.js`, `boq.js`, `machinery.js`
- [ ] Domain operations snapshot: wire real construction queries
- [ ] Plan guards: `boq_tracking`, `ipc_billing`, `machinery_logbook`

### Hub UI

- [ ] `ConstructionProjectsManager.jsx` (Projects list + detail)
- [ ] `BOQItemsTable.jsx` (BOQ line items + variance)
- [ ] `IPCTimeline.jsx` (IPC #1, #2, ... with status)
- [ ] `IPCCalculator.jsx` (IPC running bill UI)
- [ ] `MachineryLogbook.jsx` (Equipment daily logs)
- [ ] `SubcontractorLedger.jsx` (Subcontractor running account)
- [ ] Add "Projects" tab to hub navigation
- [ ] Domain Operations widget: show Active Projects, Contract Value, Pending IPCs

### PDF Templates

- [ ] `lib/pdf/ipcBillPdf.js` (IPC Running Bill)
- [ ] `lib/pdf/boqEstimatePdf.js` (BOQ Cost Estimate)
- [ ] `lib/pdf/projectSummaryPdf.js` (Project Dashboard)

### Storefront

- [ ] Remove retail elements (cart, checkout, "Add to Cart")
- [ ] `/products` → `/projects` (portfolio gallery)
- [ ] Add portfolio sections: Services, Projects, Certifications
- [ ] RFQ contact form
- [ ] Update `ConstructionHomeSections.jsx` to be portfolio-first

### Intelligence & Analytics

- [ ] Wire IPC calculation helpers to UI
- [ ] BOQ variance analysis (estimated vs actual)
- [ ] Material rate variance alerts
- [ ] Machinery productivity dashboard
- [ ] PEC Clause 70 escalation calculator UI
- [ ] Tender bid risk analyzer UI

### Testing & QA

- [ ] Test project CRUD workflows
- [ ] Test IPC calculation accuracy (mobilization, retention, WHT, provincial tax)
- [ ] Test BOQ variance analysis
- [ ] Test PDF generation (IPC, BOQ)
- [ ] Test construction storefront (portfolio mode, no cart)
- [ ] Run verify scripts (if applicable)

---

## Domain Knowledge Summary

### Existing Configuration

**Domain**: `construction-contractor`  
**Package**: `construction-management`  
**Aliases**: `construction`, `contractor`, `builder`, `civil-engineering`, `infrastructure`, `epc`, `public-works`, etc.

**Key Features**:
- PEC Contractor Categories (C-A to C-6)
- BOQ tracking with MRS/CSR schedule codes
- IPC billing with mobilization advance recovery
- Retention money ledger (5-10%)
- PEC Clause 70 price escalation
- FBR WHT Section 153(1)(c) — 7.5% company, 8% non-company
- Provincial taxes: PRA 5%, SRB 13%, KPRA 15%, BRA 15%
- Machinery logbook (hour-meter, fuel, productivity)
- Subcontractor retainage
- Material benchmark rates (2026 PKR)
- Construction-specific units (Cu.M, Ton, Trip, Hour, Day)

**Intelligence Helpers**:
- Composite rate analysis (Material/Labor/Machinery)
- IPC running bill calculator
- PEC escalation formula
- BOQ variance analysis
- Tender bid risk scoring
- FX sensitivity (USD/PKR impact)
- Equipment productivity analysis
- Cash flow S-curve projection

**Seed Catalog**: 14 SKUs (Rebar, Cement, RMC, Bitumen, Aggregate, Sand, Earthwork, Equipment logs, Labor)

**Storefront Template**: Company showcase (currently retail-style, needs portfolio mode)

**Plan Tier**: Enterprise (PKR 24,999/mo or USD 89/mo)

---

## Files Involved

### Domain Configuration
- `lib/domainData/construction.js`
- `lib/config/domains.js` (domain registry)
- `lib/config/domainPackages.js` (construction-management suite)
- `lib/config/domainKeyAliases.js` (aliases)
- `lib/config/storefrontDomains.js` (storefront config)
- `lib/config/domainPackageFeatures.js` (CONSTRUCTION_MANAGEMENT_FEATURE_OVERRIDES)

### Intelligence & Business Logic
- `lib/construction/constructionIntelligence.js` (IPC, BOQ, escalation, variance)
- `lib/construction/constructionProjects.js` (project tracker helpers)
- `lib/construction/constructionCosting.js` (BOQ estimation, tender analysis, FX sensitivity)

### Data & Seed
- `lib/dataLab/constructionContractorCatalog.js` (14 seed SKUs)
- `lib/dataLab/richProductCatalog.js` (includes construction seed)
- `lib/dataLab/demoStoreProfiles.js` (demo-construction profile)

### Storefront
- `components/storefront/sections/construction/ConstructionHomeSections.jsx` (company showcase)
- `components/storefront/sections/LazyVerticalHomeSections.jsx` (lazy loader)
- `lib/storefront/canonicalStorefrontVariants.js` (hero slides, shortcuts)

### Registration & Onboarding
- `lib/onboarding/registrationRichVerticals.js` (rich catalog on registration)
- `lib/utils/inventoryFieldSuggestions.js` (construction name hints)

### Domain Operations
- `lib/dashboard/domainOperationsIntelligence.js` (construction_ops mode)
- `lib/actions/dashboard/domainOperationsSnapshot.js` (placeholder metrics)
- `lib/dashboard/easyDomainIntelligence.js` (Easy mode guidance)

### Marketing & Branding
- `lib/marketing/tenvoMarketingImages.js` (construction hero images)
- `lib/regionalMarket/domainBrandMap.js` (construction brand pack)
- `lib/regionalMarket/brandCatalogs/*.js` (PK construction brands)

### Assets
- `public/tenvo-img/construction/` (construction-1.jpg, construction-service.jpg, affordable.jpg, service2.jpg)
- `archive/Construction/` (archive images)

---

## Critical Architectural Decision

**Should Construction be in Tenvo?**

Given construction's unique requirements (project-based, IPC billing, long-term contracts, portfolio websites), consider:

### Option A: Full Build-Out (Recommended)
- Complete Phases 1-5 above
- Position as "Construction & Infrastructure EPC Suite"
- Premium Enterprise pricing (PKR 24,999/mo)
- Target: PEC C-A to C-3 contractors, 20-200 employees
- Unique value: Only platform with PEC/PPRA/IPC compliance + MRS rate intelligence

### Option B: Partner with Construction-Specific Software
- Focus on retail/commerce verticals where Tenvo excels
- Integrate with Procore, Autodesk Build, or regional ERP
- Construction domain stays as light catalog mode only

### Option C: Construction-Material Retail (Pivot)
- Change domain from `construction-contractor` to `construction-material` retail
- Sell construction materials (cement, steel, sand, etc.) online
- B2B e-commerce catalog for contractors to order materials
- Keep retail storefront (no portfolio mode)
- Remove project management features

**Recommendation**: Option A. Construction EPC market in Pakistan is huge (CPEC, housing, infrastructure), and no local SaaS competitor offers PEC/PPRA/IPC compliance + real-time MRS rate intelligence. Tenvo's multi-warehouse, batch tracking, and financial compliance foundation is already 60% of what's needed.

---

## Success Metrics (Post-Implementation)

### Adoption
- 10+ construction businesses on Enterprise plan (PKR 24,999/mo)
- 50+ active projects tracked in system
- 200+ IPCs generated monthly
- 500+ BOQ items managed

### Feature Usage
- Projects module: 80%+ of construction tenants use weekly
- IPC billing: 60%+ generate IPCs in-system (vs manual Excel)
- BOQ variance: 40%+ run variance analysis monthly
- Machinery logs: 30%+ track equipment daily

### Revenue
- Construction-management package: PKR 250K MRR (10 tenants × PKR 24,999)
- Average LTV: PKR 3M per tenant (10-year contracts typical)

### Competitive Differentiation
- Only SaaS in Pakistan with PEC/PPRA/IPC compliance
- Only platform with MRS Punjab/NHA CSR/SPPRA rate intelligence
- Only system with FBR WHT + Provincial Tax auto-calculation for construction

---

## Next Steps

1. **Stakeholder Decision**: Option A (full build-out) vs Option B (partner) vs Option C (pivot to material retail)
2. **If Option A**: Prioritize Phase 1 (Core Project Management)
3. **Database Schema**: Design and review Prisma models
4. **UI/UX Mockups**: ConstructionProjectsManager, IPCTimeline, BOQItemsTable
5. **Developer Assignment**: 1 senior full-stack dev + 1 domain expert
6. **Timeline**: 8-10 weeks for Phases 1-4 (MVP)
7. **Beta Testers**: Recruit 3-5 PEC-registered contractors for pilot

---

**End of Audit**

For questions or implementation guidance, consult:
- `lib/construction/constructionIntelligence.js` (calculation formulas)
- `lib/domainData/construction.js` (domain configuration)
- This audit document (roadmap and requirements)
