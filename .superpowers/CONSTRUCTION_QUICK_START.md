# Construction Domain Quick Start Guide

**For**: New construction contractors registering on Tenvo  
**Domain**: `construction-contractor`  
**Package**: `construction-management`  
**Plan**: Enterprise (recommended)

---

## 🚀 REGISTRATION

### Option 1: Direct Registration
```
1. Go to /register
2. Select industry: "Construction & Infrastructure"
3. Complete wizard
4. Hub opens with construction tabs
```

### Option 2: Package Link
```
Register via: /register?package=construction-management
→ Pre-selects construction vertical
→ Enables enterprise features
→ Applies lean feature strip (no F&B/retail clutter)
```

---

## 🏗️ HUB LAYOUT (11 Tabs)

### 1. Dashboard (Overview)
**Path**: `/business/[handle]?tab=dashboard`

**KPIs Shown**:
- Active Projects
- Total Contract Value
- Certified Work (IPC amounts)
- Retention Held
- Pending IPCs
- Machinery Hours Logged
- Safety Incidents (7/30/90 day counts)
- Quality Test Failures

**Charts**:
- Revenue trend (by project)
- Project status distribution
- Top 5 projects by value

### 2. Projects
**Path**: `/business/[handle]?tab=projects`

**Features**:
- Create new project (contract value, client, dates)
- Update project status (Bidding → Active → Completed)
- View project details
- Filter by status
- Archive completed projects

**Fields**:
- Project Code (e.g., PRJ-001)
- Name
- Client Name
- Contract Value
- Start Date / End Date
- Status (Bidding, Active, On Hold, Completed, Cancelled)
- Description

### 3. BOQ (Bill of Quantities)
**Path**: `/business/[handle]?tab=boq`

**Features**:
- Build BOQ line-by-line
- PEC category selection (Buildings, Roads, Water Supply, etc.)
- MRS/CSR code reference
- Quantity, unit, rate, amount
- Bulk import from Excel
- Generate BOQ Estimate PDF (tender-ready)

**PEC Categories** (Pakistan):
- Civil Works (Buildings, Roads, Bridges, Dams)
- Mechanical Works (HVAC, Plumbing, Lifts)
- Electrical Works (Power, Lighting, Fire Alarm)
- Structural Works (Steel, RCC)
- Finishing Works (Tiles, Paint, Doors/Windows)

### 4. IPC (Interim Payment Certificates)
**Path**: `/business/[handle]?tab=ipc`

**Features**:
- Submit new IPC
- Auto-calculate cumulative work vs previous IPCs
- 10% retention deduction
- VAT (17% standard) and WHT (7% under Section 153(1)(c))
- Approval workflow
- Generate IPC Running Bill PDF (FIDIC-compliant)

**IPC Calculation**:
```
Work Done This Period:   PKR 5,000,000
Previous Certified:      PKR 3,000,000
Cumulative Work:         PKR 8,000,000
Less Retention (10%):    PKR (800,000)
Add: VAT (17%):          PKR 1,224,000
Less: WHT (7%):          PKR (560,000)
Net Payable:             PKR 7,864,000
```

### 5. Site Materials
**Path**: `/business/[handle]?tab=site-materials`

**Features**:
- Log material deliveries to site
- Cement, steel, aggregates, bricks
- Delivery challan reference
- Supplier name
- Quantity received vs ordered
- Delivery date
- Material status (Accepted, Rejected, Pending)

### 6. Machinery
**Path**: `/business/[handle]?tab=machinery`

**Features**:
- Fleet master data (excavators, cranes, mixers, trucks)
- Daily usage logs (hours, fuel, operator)
- Equipment utilization KPIs
- Maintenance due alerts
- Idle vs active status
- Fleet summary (total hours, avg utilization)

**Equipment Types**:
- Excavators
- Cranes (mobile, tower)
- Concrete mixers
- Trucks (dumpers, water tankers)
- Compactors (vibratory, plate)
- Generators
- Pumps (water, concrete)

### 7. Subcontractors
**Path**: `/business/[handle]?tab=subcontractors`

**Features**:
- Subcontractor vendor master
- Work order issuance
- Trade/speciality tracking (MEP, finishing, piling, etc.)
- Retainage calculation (5-10%)
- Payment status
- Performance ratings

**Trades**:
- MEP (Mechanical, Electrical, Plumbing)
- Steel Erection
- Piling & Foundation
- Finishing (Tiles, Paint, Carpentry)
- HVAC
- Fire Fighting
- Landscaping

### 8. Site Ops (Operations)
**Path**: `/business/[handle]?tab=site-ops`

**3 Sub-Tabs**:

#### Materials Tab
- Material deliveries (same as Site Materials tab)
- Delivery challan tracking

#### Safety Tab
- HSE incident logging
- Incident type (Fall, Struck-by, Electrical, Fire, Near-miss)
- Severity (Minor, Major, Fatal, Near-miss)
- Investigation status
- Corrective actions
- 7/30/90 day incident counts

#### Quality Tab
- QC test records
- Test type (Concrete cube, Slump, Soil compaction, Rebar tensile)
- Test date, sample ID, result
- Pass/Fail status
- Lab report reference
- Non-conformance tracking

### 9. Finance
**Path**: `/business/[handle]?tab=finance`

**Redirects to**: Main Finance Hub

**Construction-Specific**:
- Project-level P&L
- Cost codes (Labour, Material, Plant, Subcontractor, Overhead)
- Invoice to client (IPC-based)
- Vendor payments (subcontractors, suppliers)
- WHT tracking (Section 153(1)(c) — 7%)
- Retention payable (after defects liability)

### 10. Procurement
**Path**: `/business/[handle]?tab=procurement`

**Features**:
- Purchase orders for materials
- RFQ (Request for Quotation) workflows
- PPRA compliance (Public Procurement Regulatory Authority)
- Supplier quotes comparison
- PO approval chain
- GRN (Goods Receipt Note) against PO

### 11. Reports
**Path**: `/business/[handle]?tab=reports`

**Available Reports**:
- Project profitability (budget vs actual)
- BOQ variance analysis
- IPC summary (certified vs pending)
- Machinery utilization
- Safety incident trends
- Quality test summary
- Subcontractor ledger
- Material consumption

---

## 📄 PDF EXPORTS

### IPC Running Bill
**Trigger**: From IPC tab → Select IPC → "Download Bill"

**Format**:
- FIDIC-compliant running bill
- Contractor and client details
- BOQ item breakdown
- Cumulative work done vs previous
- Retention calculation
- VAT and WHT breakdown
- Net payable amount
- Professional header/footer

### BOQ Estimate
**Trigger**: From BOQ tab → "Export BOQ"

**Format**:
- PEC category grouping
- MRS/CSR code references
- Item description, quantity, unit, rate, amount
- Subtotals by category
- Grand total
- Tender-ready format

---

## 🇵🇰 PAKISTAN-SPECIFIC INTELLIGENCE

### PEC (Pakistan Engineering Council)
- **Contractor Classification**: C1 (Small), C2 (Medium), C3 (Large), C4 (Mega)
- **Work Categories**: Buildings, Roads, Water Supply, Drainage, etc.
- **Registration**: Mandatory for public sector contracts

### PPRA (Public Procurement Regulatory Authority)
- **Threshold Limits**:
  - < PKR 100,000: Direct purchase
  - PKR 100,000 - 2.5M: Quotations (3+)
  - > PKR 2.5M: Open tendering
- **Bidding Process**: Pre-qualification, technical evaluation, financial evaluation
- **Contract Award**: Lowest evaluated bidder

### Tax Compliance
- **WHT (Withholding Tax)**: 7% on construction payments (Section 153(1)(c))
- **VAT (Sales Tax)**: 17% standard rate
- **FBR Registration**: Required for contractors
- **PRA/SRB**: Provincial tax authorities

### Payment Terms
- **Mobilization Advance**: 10-15% of contract value
- **Running Bills**: Monthly (IPCs)
- **Retention**: 10% held for defects liability (12 months)
- **Payment Timeline**: 30-45 days after IPC approval

### MRS/CSR (Market Rate Schedule / Composite Schedule of Rates)
- **Published By**: Provincial PWD/C&W departments
- **Updated**: Quarterly or annually
- **Usage**: BOQ rate reference for public sector
- **Coverage**: All major work items with unit rates

### Seasonality
- **Monsoon Season** (July-Sept): Delays in earthwork, foundation
- **Winter** (Dec-Feb): Concrete curing issues (temperature management)
- **Summer** (Mar-June): Peak construction season

---

## 🎯 TYPICAL WORKFLOWS

### Workflow 1: New Project Setup
```
1. Go to Projects tab → Create Project
2. Enter: Code, Name, Client, Contract Value, Dates
3. Build BOQ (BOQ tab):
   - Add line items with PEC categories
   - Set quantities, rates
   - Import from Excel if bulk
4. Generate BOQ Estimate PDF
5. Submit tender / win contract
6. Update status: Bidding → Active
```

### Workflow 2: Monthly IPC Submission
```
1. Go to IPC tab → Create IPC
2. Select project
3. Enter work done this period (BOQ item-wise)
4. System auto-calculates:
   - Cumulative work
   - Retention (10%)
   - VAT (17%)
   - WHT (7%)
5. Submit for approval
6. Generate IPC Running Bill PDF
7. Send to client
8. Track payment in Finance tab
```

### Workflow 3: Daily Site Operations
```
1. Log material deliveries (Site Materials tab):
   - Cement: 100 bags received
   - Steel: 5 tons delivered
2. Log machinery usage (Machinery tab):
   - Excavator: 8 hours (Operator: Ali)
   - Concrete mixer: 6 hours (Fuel: 50L)
3. Log safety incidents if any (Site Ops → Safety):
   - Type: Near-miss
   - Corrective action: Additional barricading
4. Log quality tests (Site Ops → Quality):
   - Concrete cube test: 28 MPa (Pass)
```

### Workflow 4: Subcontractor Management
```
1. Add subcontractor (Subcontractors tab)
2. Issue work order:
   - Trade: MEP
   - Scope: Electrical wiring (Block A)
   - Value: PKR 2,000,000
3. Track progress via IPCs or milestones
4. Calculate retainage (5-10%)
5. Make payments (Finance tab)
6. Final settlement after defects liability
```

---

## 🔒 FEATURE GATING

### Enterprise Plan Features
Construction domain requires **Enterprise** plan for:
- `project_costing` — Project-level cost tracking
- `boq_tracking` — BOQ management
- `ipc_billing` — IPC certificates
- `machinery_logbook` — Equipment tracking
- `subcontractor_ledger` — Sub-vendor accounts
- `site_operations` — Safety/quality/materials

### Lean Feature Strip
Construction domain **auto-disables**:
- ❌ Restaurant POS / KDS
- ❌ Membership / Loyalty programs
- ❌ Storefront cart / Abandoned cart recovery

**Why?** Construction businesses don't need F&B or retail features.

---

## 🆘 COMMON QUESTIONS

### Q: Can I use this for residential construction?
**A:** Yes! Works for residential, commercial, infrastructure, and industrial projects.

### Q: Does it support multiple projects?
**A:** Yes, unlimited projects (plan limit: check your tier).

### Q: Can I track material inventory across sites?
**A:** Yes, use multi-warehouse with each site as a location.

### Q: How do I handle price escalation clauses?
**A:** Coming soon! For now, manually adjust BOQ rates and create new IPC revisions.

### Q: Can subcontractors access their data?
**A:** Not yet. Future: Subcontractor portal with limited access.

### Q: Is there a mobile app for site foremen?
**A:** Planned! For now, hub is mobile-responsive.

---

## 📞 SUPPORT

**Documentation**: `/docs/construction`  
**Video Tutorials**: `/learn/construction`  
**Live Chat**: Available in hub (bottom-right)  
**Email**: support@tenvo.store

---

**Last Updated**: August 13, 2026  
**Version**: 1.0.0 (Production Ready)
