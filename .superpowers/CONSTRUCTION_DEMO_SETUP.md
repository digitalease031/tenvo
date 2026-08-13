# Construction Demo Business Setup

**Demo Name**: Tenvo Constructors  
**Domain**: `demo-construction`  
**Category**: `construction-contractor`  
**Country**: Pakistan  
**Status**: Configured & Ready to Seed

---

## 📝 CONFIGURATION COMPLETE

### 1. Demo Seed Definition ✓
**File**: `lib/dataLab/domains.mjs`

Added to `DEMO_SHOWCASE_PACK`:
```javascript
{
  key: 'construction-contractor',
  name: 'Tenvo Constructors',
  domain: 'demo-construction',
  country: 'Pakistan',
  fullSeed: true,
  showcase: true
}
```

**Flags**:
- `fullSeed: true` — Full operational data (projects, BOQs, IPCs, machinery, site ops)
- `showcase: true` — Featured in marketing gallery

### 2. Featured Demos List ✓
**File**: `lib/marketing/demoStores.js`

Added `'demo-construction'` to `FEATURED_DEMO_STORES` array.

This makes it appear in:
- Homepage demo gallery carousel
- Marketing "Explore Demos" section
- Solutions pages demo cards

### 3. Gallery Hero Image ✓
**File**: `lib/marketing/demoStoreGalleryMeta.js`

Added to `CANONICAL_DEMO_HEROES`:
```javascript
'demo-construction': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=85&auto=format&fit=crop'
```

Professional construction site image (steel beams, workers, modern infrastructure).

### 4. Gallery Override Styling ✓
**File**: `lib/marketing/demoStoreGalleryMeta.js`

Added to `GALLERY_OVERRIDES`:
```javascript
'demo-construction': {
  vertical: 'Construction & Infrastructure',
  marketingName: 'Tenvo Constructors',
  icon: 'hard-hat',
  backgroundColor: 'bg-gradient-to-br from-red-900 via-zinc-900 to-black',
  glowGradient: '#a71930',
  glowColor: 'rgba(167, 25, 48, 0.4)',
}
```

**Visual Theme**:
- Icon: Hard hat (construction)
- Accent color: #a71930 (construction red)
- Dark gradient background with red/black blend
- Glow effect matching construction domain accent

---

## 🚀 HOW TO CREATE THE DEMO

### Option 1: Via Demo Seed Script (Recommended)

```bash
# Create demo-construction with default owner
npx tsx scripts/data-lab/ensure-demo-storefronts.mjs --only demo-construction

# Or specify owner email
npx tsx scripts/data-lab/ensure-demo-storefronts.mjs --only demo-construction --owner your@email.com
```

This will:
1. Create the business under platform owner
2. Set up storefront with construction defaults
3. Seed sample projects (if fullSeed catalog exists)
4. Configure Store Settings with PEC/PPRA intelligence
5. Enable all construction hub tabs

### Option 2: Manual Registration

1. Go to `/register`
2. Select industry: "Construction & Infrastructure"
3. Business name: "Tenvo Constructors"
4. Domain: `demo-construction`
5. Complete wizard
6. Manually add sample projects via hub

---

## 📊 WHAT GETS CREATED

### Business Record:
- **Name**: Tenvo Constructors
- **Domain**: demo-construction
- **Category**: construction-contractor
- **Country**: Pakistan
- **Storefront**: Enabled by default

### Store Settings:
- **Accent Color**: #a71930 (construction red)
- **Announcement**: "PEC Registered · BOQ & IPC Management · Public & Private Sector Projects"
- **Business Hours**: Mon – Sat, 8:00 AM – 6:00 PM
- **Hero**: Professional construction hero carousel (3 slides)
- **Sections**: All construction storefront sections enabled
  - Trust stats
  - Featured projects
  - Service capabilities
  - Project categories
  - Certifications
  - Delivery methods
  - Get In Touch RFQ form

### Public Storefront:
**URL**: `/store/demo-construction`

**Homepage Sections**:
- Hero Carousel (3 slides)
- Trust Stats (500+ projects, 25M+ sq ft, $12B+ value)
- Why Consigli? (Safety, Preconstruction, Emergency, VDC)
- Diverse Modalities (OSD, Biologics, CGT, Commercial)
- Delivery Methods (CMR, Design-Build EPC, IPD)
- Featured Projects (4 showcase projects)
- In-House Services (6 interactive tabs)
- Get In Touch Form

### Hub Access:
**URL**: `/business/demo-construction`

**11 Tabs**:
1. Dashboard — KPI overview
2. Projects — Create/manage projects
3. BOQ — Bill of Quantities editor
4. IPC — Interim Payment Certificates
5. Site Materials — Material deliveries
6. Machinery — Fleet management
7. Subcontractors — Vendor work orders
8. Site Ops — Materials, Safety, Quality
9. Finance — Project P&L, cost codes
10. Procurement — POs, RFQs, PPRA
11. Reports — Profitability, BOQ variance

---

## 🎯 SAMPLE DATA (If Full Seed)

When `fullSeed: true`, the script can optionally create:

### Sample Projects:
1. **Pharmaceutical cGMP Cleanroom Facility**
   - Contract Value: PKR 500M
   - Client: Confidential Pharma Co.
   - Status: Active
   - Category: Life Sciences

2. **Urban Housing Complex**
   - Contract Value: PKR 750M
   - Client: City Development Authority
   - Status: Bidding
   - Category: Residential

3. **Highway Interchange Infrastructure**
   - Contract Value: PKR 1.2B
   - Client: National Highway Authority (NHA)
   - Status: Active
   - Category: Civil Infrastructure

### Sample BOQ Items:
- Concrete Grade 40 (C40)
- Steel Rebar Grade 60
- Excavation & Earthwork
- Formwork & Shuttering
- MEP Rough-in
- Cleanroom ISO 5 Panels

### Sample IPCs:
- IPC #1: Mobilization & Site Setup
- IPC #2: Foundation & Substructure
- IPC #3: Superstructure & Columns

### Sample Machinery:
- Excavator CAT 320D (Active)
- Tower Crane Potain MDT 368 (Active)
- Concrete Mixer Liebherr BTM 180 (Idle)

### Sample Subcontractors:
- MEP Contractor (Electrical & Plumbing)
- Steel Fabricator (Structural Steel)
- Finishing Contractor (Tiles, Paint, Carpentry)

---

## 🔍 VERIFICATION

After running the seed script, verify:

```bash
# Check if demo exists
psql $DATABASE_URL -c "SELECT domain, category, is_active FROM businesses WHERE domain = 'demo-construction';"

# Check storefront enabled
psql $DATABASE_URL -c "SELECT is_storefront_enabled FROM business_settings bs JOIN businesses b ON b.id = bs.business_id WHERE b.domain = 'demo-construction';"

# Check products/projects count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products WHERE business_id = (SELECT id FROM businesses WHERE domain = 'demo-construction');"

# Check construction projects
psql $DATABASE_URL -c "SELECT COUNT(*) FROM construction_projects WHERE business_id = (SELECT id FROM businesses WHERE domain = 'demo-construction');"
```

### Expected Results:
- Business exists: ✓
- Storefront enabled: ✓
- Products: 0+ (optional catalog)
- Projects: 3+ (if full seed)

---

## 🌐 ACCESS URLs

### Public Storefront:
- Local Dev: `http://localhost:3000/store/demo-construction`
- Production: `https://www.tenvo.store/store/demo-construction`

### Hub:
- Local Dev: `http://localhost:3000/business/demo-construction`
- Production: `https://www.tenvo.store/business/demo-construction`

### Marketing Gallery:
- Will appear in homepage demo carousel
- Will appear in /solutions pages
- Will appear in "Explore Demos" section

---

## 📝 NOTES

1. **No Cart/Checkout**: Construction is B2B portfolio-driven, not e-commerce
2. **RFQ Focus**: "Get In Touch" form for tender inquiries
3. **Pakistan-Specific**: PEC, PPRA, FIDIC intelligence built-in
4. **Enterprise Plan**: Recommended plan tier for construction features
5. **Full Operational**: All 11 hub tabs accessible with demo data

---

## 🎨 BRANDING

**Accent Color**: #a71930 (Deep Red)  
**Theme**: Professional, corporate, industrial  
**Tone**: B2B, technical, compliance-focused  
**Imagery**: Construction sites, infrastructure, industrial facilities  

**Similar Demos**:
- Marine (B2B spare parts)
- Auto Parts (Trade counter)
- Furniture (Showroom)

---

## ✅ READY TO SEED

All configuration is complete. Run the seed script to create the demo:

```bash
npx tsx scripts/data-lab/ensure-demo-storefronts.mjs --only demo-construction
```

**Expected Output**:
```
🔧 Tenvo — Ensure demo storefronts
═══════════════════════════════════════════════════════
Owner: Platform Owner <owner@tenvo.store>

Audit: 25 curated demos — 1 missing, 0 need repair
  demo-construction: MISSING

Bootstrapping: demo-construction
  ✓ Created business: Tenvo Constructors
  ✓ Initialized storefront
  ✓ Configured settings
  ✓ Seeded sample projects
  ✓ Created BOQ items
  ✓ Setup construction hub

✅ Demo ready: /store/demo-construction
```

---

**Created**: August 13, 2026  
**Status**: Ready to Seed  
**Next Step**: Run seed script
