# Construction Domain — Quick Reference

**Last Updated**: August 14, 2026  
**Status**: ✅ Production Ready

---

## 🚀 Quick Access

### Demo Business
- **Name**: Tenvo Constructors
- **Hub URL**: `https://www.tenvo.store/business/demo-construction`
- **Public Store**: `https://www.tenvo.store/store/demo-construction`
- **Owner**: zeeshan.keerio@mindscapeanalytics.com
- **Category**: `construction-contractor`

### Key Features
✅ 11 construction-specific hub tabs  
✅ Professional B2B portfolio storefront  
✅ BOQ & IPC automation  
✅ Site operations tracking  
✅ PEC/PPRA/ISO compliance  
✅ 30+ professional construction images  

---

## 📂 Critical Files

### Hub Components
- `components/construction/ConstructionHub.jsx` — Main hub container
- `components/construction/ConstructionProjectsManager.jsx` — Projects tab
- `components/construction/BOQItemsTable.jsx` — BOQ editor
- `components/construction/IPCCalculator.jsx` — IPC running bills
- `components/construction/MachineryManager.jsx` — Equipment tracking
- `components/construction/SiteOperationsHub.jsx` — Site logs & safety

### Storefront
- `lib/storefront/constructionStorefront.js` — Config & detection
- `lib/storefront/constructionArchiveMap.js` — Images & content
- `components/storefront/sections/construction/ConstructionHomeSections.jsx` — Homepage

### Navigation & Config
- `components/layout/Sidebar.jsx` — Construction nav sections
- `lib/config/constructionHubNav.js` — Nav logic
- `lib/domainData/construction.js` — Domain intelligence
- `lib/dataLab/domains.mjs` — Demo configuration

### Server Actions
- `lib/actions/construction/projects.js` — Project CRUD
- `lib/actions/construction/boq.js` — BOQ operations
- `lib/actions/construction/ipc.js` — IPC generation
- `lib/actions/construction/machinery.js` — Equipment tracking
- `lib/actions/construction/siteOperations.js` — Site logs
- `lib/actions/construction/subcontractor.js` — Subcontractor ledger

---

## 🔧 Common Tasks

### Add New Construction Tab
1. Add tab definition in `components/construction/ConstructionHub.jsx`
2. Create tab component in `components/construction/`
3. Add nav item in `components/layout/Sidebar.jsx` → `CONSTRUCTION_NAV_SECTIONS`
4. Create server action in `lib/actions/construction/`
5. Wire action to tab component

### Update Hero Slides
1. Edit `lib/storefront/constructionArchiveMap.js` → `CONSTRUCTION_HERO_SLIDES`
2. Add new Unsplash URL or local image path
3. Update title, subtitle, CTA

### Add Featured Project
1. Edit `components/storefront/sections/construction/ConstructionHomeSections.jsx`
2. Add to `FEATURED_PROJECTS` array
3. Include: title, category, location, image, specs, badge

### Modify RFQ Form Subjects
1. Edit `lib/storefront/constructionStorefront.js` → `CONSTRUCTION_RFQ_SUBJECTS`
2. Add new project type option

### Change Accent Color
1. Update `lib/storefront/constructionArchiveMap.js` → `CONSTRUCTION_ACCENT_COLOR`
2. Update demo seed in `lib/storefront/constructionStorefront.js` → `CONSTRUCTION_REGISTRATION_METADATA.accentColor`

---

## 🐛 Troubleshooting

### Sidebar Doesn't Show Construction Tabs
**Check**: `isConstructionDomain(category)` in `Sidebar.jsx`  
**Fix**: Ensure category is `construction-contractor` or alias

### Auto-Redirect Not Working
**Check**: `DashboardClient.jsx` redirect effect  
**Fix**: Verify `isConstructionDomain` and `goToTab('projects')` logic

### Dashboard Shows Generic KPIs
**Check**: `DashboardTabs.jsx` conditional rendering  
**Fix**: Ensure `constructionDomain` flag and `ConstructionHub` wiring

### Server Action Import Error
**Check**: `withGuard` import path  
**Fix**: Use `@/lib/rbac/serverGuard`, not `@/lib/auth/withGuard`

### Images Not Loading
**Check**: File paths in `constructionArchiveMap.js`  
**Fix**: Verify `/tenvo-img/construction/` files exist or use Unsplash URLs

---

## 📊 Database Schema Quick Ref

```sql
-- Projects
construction_projects (id, business_id, name, client, contract_value, start_date, end_date, status, location)

-- BOQ Items
construction_boq_items (id, business_id, project_id, item_code, description, unit, quantity, unit_rate, amount)

-- IPC Running Bills
construction_ipcs (id, business_id, project_id, ipc_number, bill_date, work_done_value, cumulative_value, retention_amount, net_payable, status)

-- Machinery
construction_machinery (id, business_id, name, type, registration, status, hourly_rate, current_project)

-- Site Operations
construction_site_operations (id, business_id, project_id, date, type, description, severity, resolved)

-- Subcontractors
construction_subcontractors (id, business_id, name, contact_person, phone, email, trade, retention_limit, outstanding)
```

---

## 🎨 Design Tokens

```javascript
// Accent Color
const CONSTRUCTION_ACCENT = '#a71930'; // Deep red

// Typography
const HEADING_FONT = 'font-extrabold uppercase tracking-tight';
const BODY_FONT = 'font-light leading-relaxed';

// Spacing
const SECTION_PADDING = 'py-16';
const CONTAINER = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

// Shadows
const CARD_SHADOW = 'shadow-md hover:shadow-xl';
const HERO_SHADOW = 'shadow-2xl';
```

---

## 🔗 External Resources

### Imagery Sources
- **Unsplash**: Construction site photos (30+ curated URLs in `constructionArchiveMap.js`)
- **Local**: `/tenvo-img/construction/` (4 files: affordable.jpg, construction-1.jpg, construction-service.jpg, service2.jpg)

### Certifications Reference
- **PEC**: Pakistan Engineering Council ([pec.org.pk](https://pec.org.pk))
- **PPRA**: Public Procurement Regulatory Authority
- **ISO 9001**: Quality Management
- **ISO 45001**: Occupational Health & Safety
- **FIDIC**: International Federation of Consulting Engineers contracts

### Industry Standards
- **MRS**: Market Rate Schedule (Punjab/Sindh)
- **ASTM A615**: Steel rebar specifications
- **PSQCA**: Pakistan Standards & Quality Control Authority

---

## ✅ Pre-Deployment Checklist

- [ ] Build succeeds without errors
- [ ] All 11 hub tabs accessible
- [ ] Auto-redirect to Projects tab works
- [ ] Dashboard shows construction KPIs
- [ ] Public storefront renders complete homepage
- [ ] Hero carousel displays 3 slides
- [ ] Featured projects grid loads
- [ ] RFQ form validates and submits
- [ ] Images load (Unsplash + local)
- [ ] Responsive on mobile and desktop
- [ ] Server actions execute without errors
- [ ] Demo business seeded with data

---

## 📞 Support

**Documentation**:
- `.superpowers/CONSTRUCTION_IMPLEMENTATION_COMPLETE.md` — Full implementation details
- `.superpowers/CONSTRUCTION_HUB_INTEGRATION_FIXES.md` — Integration fixes log
- `.superpowers/CONSTRUCTION_FINAL_STATUS.md` — Comprehensive final status

**Contact**: Development Team

---

**Quick Ref Version**: 1.0  
**Last Updated**: August 14, 2026
