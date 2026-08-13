/**
 * Construction Archive Image Map
 * Professional construction company imagery for elevated storefront.
 * Combines local `/tenvo-img/construction/*` with curated Unsplash.
 */

// ── Local Construction Images ────────────────────────────────────────────────

export const LOCAL_CONSTRUCTION_IMAGES = {
  affordable: '/tenvo-img/construction/affordable.jpg',
  construction1: '/tenvo-img/construction/construction-1.jpg',
  constructionService: '/tenvo-img/construction/construction-service.jpg',
  service2: '/tenvo-img/construction/service2.jpg',
};

// ── Curated Unsplash Construction & Infrastructure Images ────────────────────

export const CONSTRUCTION_UNSPLASH_IMAGES = {
  // Hero & Banner
  heroMain: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=85&auto=format&fit=crop',
  heroAlt1: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=85&auto=format&fit=crop',
  heroAlt2: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1920&q=85&auto=format&fit=crop',
  
  // Project Types
  commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=82&auto=format&fit=crop',
  residential: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=82&auto=format&fit=crop',
  infrastructure: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800&q=82&auto=format&fit=crop',
  industrial: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=82&auto=format&fit=crop',
  bridges: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=82&auto=format&fit=crop',
  roads: 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=800&q=82&auto=format&fit=crop',
  
  // Services & Capabilities
  planning: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=82&auto=format&fit=crop',
  vdc: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&q=82&auto=format&fit=crop',
  quality: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=82&auto=format&fit=crop',
  safety: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=82&auto=format&fit=crop',
  machinery: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=82&auto=format&fit=crop',
  materials: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=82&auto=format&fit=crop',
  
  // Team & About
  team: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=82&auto=format&fit=crop',
  site: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=82&auto=format&fit=crop',
  meeting: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=82&auto=format&fit=crop',
  
  // Detail Shots
  concrete: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=82&auto=format&fit=crop',
  steel: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=82&auto=format&fit=crop',
  blueprint: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=82&auto=format&fit=crop',
};

// ── Hero Carousel Slides ──────────────────────────────────────────────────────

export const CONSTRUCTION_HERO_SLIDES = [
  {
    id: 'slide-1',
    image: CONSTRUCTION_UNSPLASH_IMAGES.heroMain,
    fallback: LOCAL_CONSTRUCTION_IMAGES.construction1,
    eyebrow: 'Building Excellence',
    title: 'Life Sciences & Civil Construction',
    subtitle: 'PEC C-A & C-1 licensed general contractor for turnkey pharmaceutical, commercial, and infrastructure projects',
    ctaLabel: 'Discover Our Work',
    ctaHref: '#featured-projects',
  },
  {
    id: 'slide-2',
    image: CONSTRUCTION_UNSPLASH_IMAGES.heroAlt1,
    fallback: LOCAL_CONSTRUCTION_IMAGES.constructionService,
    eyebrow: 'Precision Engineering',
    title: 'BOQ & IPC Management',
    subtitle: 'FIDIC-compliant billing, PEC-certified processes, and transparent project controls',
    ctaLabel: 'View Capabilities',
    ctaHref: '#capabilities',
  },
  {
    id: 'slide-3',
    image: CONSTRUCTION_UNSPLASH_IMAGES.heroAlt2,
    fallback: LOCAL_CONSTRUCTION_IMAGES.service2,
    eyebrow: 'Turnkey Solutions',
    title: 'EPC & Design-Build Delivery',
    subtitle: 'From concept to commissioning — integrated design, procurement, and construction',
    ctaLabel: 'Get In Touch',
    ctaHref: '#get-in-touch',
  },
];

// ── Trust Stats ───────────────────────────────────────────────────────────────

export const CONSTRUCTION_TRUST_STATS = [
  { value: '500+', label: 'Projects Completed' },
  { value: '25M+', label: 'Sq Ft Delivered' },
  { value: '$12B+', label: 'Contract Value' },
  { value: '15+', label: 'Years Experience' },
];

// ── Project Categories ────────────────────────────────────────────────────────

export const CONSTRUCTION_PROJECT_CATEGORIES = [
  {
    id: 'commercial',
    label: 'Commercial Buildings',
    icon: 'building',
    image: CONSTRUCTION_UNSPLASH_IMAGES.commercial,
    description: 'Multi-story office towers, shopping complexes, and mixed-use developments',
  },
  {
    id: 'residential',
    label: 'Residential Housing',
    icon: 'home',
    image: CONSTRUCTION_UNSPLASH_IMAGES.residential,
    fallback: LOCAL_CONSTRUCTION_IMAGES.affordable,
    description: 'Affordable housing, luxury apartments, and gated community infrastructure',
  },
  {
    id: 'infrastructure',
    label: 'Civil Infrastructure',
    icon: 'road',
    image: CONSTRUCTION_UNSPLASH_IMAGES.infrastructure,
    description: 'Roads, highways, bridges, dams, and water supply systems',
  },
  {
    id: 'industrial',
    label: 'Industrial Facilities',
    icon: 'factory',
    image: CONSTRUCTION_UNSPLASH_IMAGES.industrial,
    fallback: LOCAL_CONSTRUCTION_IMAGES.constructionService,
    description: 'Manufacturing plants, warehouses, power generation, and pharmaceutical facilities',
  },
];

// ── Service Offerings ─────────────────────────────────────────────────────────

export const CONSTRUCTION_SERVICES = [
  {
    id: 'preconstruction',
    icon: 'calculator',
    label: 'Preconstruction & BOQ',
    title: 'Preconstruction & BOQ Estimation',
    description: 'Comprehensive Bill of Quantities with MRS schedule codes, value engineering, and procurement planning',
    image: CONSTRUCTION_UNSPLASH_IMAGES.planning,
    bullets: [
      'Detailed BOQ itemized costing with MRS Punjab/Sindh pricing',
      'Value engineering saving up to 12% in structural costs',
      'Long-lead material procurement tracking',
    ],
  },
  {
    id: 'vdc',
    icon: 'cpu',
    label: 'VDC & BIM 5D',
    title: 'Virtual Design & Construction',
    description: '3D/4D/5D BIM coordination for clash detection, MEP routing optimization, and cost integration',
    image: CONSTRUCTION_UNSPLASH_IMAGES.vdc,
    bullets: [
      '3D spatial collision detection for MEP coordination',
      '4D construction sequencing and site logistics',
      '5D cost tracking linked to BOQ line items',
    ],
  },
  {
    id: 'quality',
    icon: 'shield-check',
    label: 'Quality Control',
    title: 'Quality & Compliance',
    description: 'ASTM/ISO certified testing, concrete compressive strength, steel tensile inspection, and PSQCA certification',
    image: CONSTRUCTION_UNSPLASH_IMAGES.quality,
    bullets: [
      'Third-party laboratory certified material testing',
      'Daily QA/QC logbook and non-conformance tracking',
      'ASTM A615 Grade 60 steel verification',
    ],
  },
  {
    id: 'project-controls',
    icon: 'file-text',
    label: 'IPC & Controls',
    title: 'IPC Running Bills & Project Controls',
    description: 'FIDIC-compliant interim payment certificates with retention tracking and PEC escalation',
    image: CONSTRUCTION_UNSPLASH_IMAGES.materials,
    bullets: [
      'Automated IPC running bill generation',
      'PECA/FIDIC contract escalation formulas',
      'Subcontractor retainage ledger management',
    ],
  },
  {
    id: 'safety',
    icon: 'hard-hat',
    label: 'Safety & HSE',
    title: 'Culture of Safety & Site Operations',
    description: 'Zero-harm HSE protocols, ISO 45001 certified field management, and digital gate pass control',
    image: CONSTRUCTION_UNSPLASH_IMAGES.safety,
    bullets: [
      'ISO 45001 Occupational Health & Safety certified',
      'Daily toolbox talks and high-risk activity permits',
      'Digital gate pass material tracking system',
    ],
  },
  {
    id: 'lean',
    icon: 'zap',
    label: 'Lean Construction',
    title: 'Lean & Just-In-Time Logistics',
    description: 'Last Planner System (LPS), modular pre-fabrication, and zero-waste material handling',
    image: CONSTRUCTION_UNSPLASH_IMAGES.machinery,
    bullets: [
      'Last Planner System weekly work commitments',
      'Modular off-site MEP skid assembly',
      'Zero-waste recycled aggregate utilization',
    ],
  },
];

// ── Certifications & Compliance ───────────────────────────────────────────────

export const CONSTRUCTION_CERTIFICATIONS = [
  { label: 'PEC Registered C-A', icon: 'award' },
  { label: 'ISO 9001:2015', icon: 'shield-check' },
  { label: 'ISO 45001:2018 HSE', icon: 'hard-hat' },
  { label: 'PPRA Compliant', icon: 'file-text' },
  { label: 'FIDIC Contracts', icon: 'file-check' },
  { label: 'ASTM/PSQCA Certified', icon: 'badge-check' },
];

// ── Default Accent Color ──────────────────────────────────────────────────────

export const CONSTRUCTION_ACCENT_COLOR = '#a71930';

// ── Quick Links (Footer/Nav) ──────────────────────────────────────────────────

export const CONSTRUCTION_QUICK_LINKS = [
  { id: 'projects', label: 'Featured Projects', href: '#featured-projects' },
  { id: 'services', label: 'Capabilities', href: '#capabilities' },
  { id: 'about', label: 'About Us', href: '#about' },
  { id: 'contact', label: 'Get In Touch', href: '#get-in-touch' },
];

// ── Equipment & Machinery ──────────────────────────────────────────────────────

export const CONSTRUCTION_EQUIPMENT_CATEGORIES = [
  { label: 'Excavators & Earthmoving', icon: 'truck' },
  { label: 'Concrete Mixers & Pumps', icon: 'droplet' },
  { label: 'Cranes & Lifting Equipment', icon: 'crane' },
  { label: 'Steel Fabrication & Rebar', icon: 'layers' },
  { label: 'Scaffolding & Formwork', icon: 'grid' },
  { label: 'Power Tools & Generators', icon: 'zap' },
];

// ── Sector Cards (Two-Column CTA Sections) ────────────────────────────────────

export const CONSTRUCTION_SECTOR_CARDS = [
  {
    id: 'pharma-cleanroom',
    icon: 'shield',
    title: 'Pharmaceutical & Life Sciences',
    body: 'Turnkey cGMP cleanroom facilities with ISO 5-8 certification, HVAC HEPA filtration, and FDA-compliant construction for OSD, biologics, and cell therapy.',
    ctaLabel: 'View Projects',
    href: '#featured-projects',
    image: CONSTRUCTION_UNSPLASH_IMAGES.industrial,
  },
  {
    id: 'civil-infrastructure',
    icon: 'road',
    title: 'Civil & Infrastructure',
    body: 'Highways, bridges, dams, water supply, and urban development — NHA/PEC Category C-A certified with PPRA-compliant procurement.',
    ctaLabel: 'Learn More',
    href: '#capabilities',
    image: CONSTRUCTION_UNSPLASH_IMAGES.bridges,
  },
];

// ── Why Choose Us Tabs ────────────────────────────────────────────────────────

export const CONSTRUCTION_WHY_TABS = [
  {
    id: 'safety',
    label: 'Culture of Safety',
    title: 'Zero-Harm HSE Culture',
    description: 'ISO 45001 standards, crane safety audits, PPE protocols, and continuous worker training for accident-free job sites.',
  },
  {
    id: 'precon',
    label: 'Preconstruction',
    title: 'BOQ Cost Engineering',
    description: 'Detailed BOQ estimation with MRS codes, value engineering, and long-lead procurement planning before mobilization.',
  },
  {
    id: 'vdc',
    label: 'Virtual Construction',
    title: 'BIM 5D Coordination',
    description: '3D laser scan point-cloud integration, clash detection, digital twin handovers, and MEP spatial coordination.',
  },
  {
    id: 'emergency',
    label: 'Emergency Service',
    title: '24/7 Response Portal',
    description: 'Rapid dispatch for critical facility repairs, MEP failures, and mobile batching crew deployment.',
  },
];

// ── Insights & Resources ──────────────────────────────────────────────────────

export const CONSTRUCTION_INSIGHTS = [
  {
    id: 'insight-1',
    tag: 'Technical',
    title: 'BOQ Best Practices for PEC Projects',
    excerpt: 'How to structure Bills of Quantities with MRS schedule codes for public sector PPRA compliance.',
    image: CONSTRUCTION_UNSPLASH_IMAGES.blueprint,
    hrefSuffix: '/contact',
  },
  {
    id: 'insight-2',
    tag: 'Compliance',
    title: 'FIDIC Contract Escalation Formulas',
    excerpt: 'Understanding PECA price escalation clauses for cement, steel, and fuel in Pakistan construction contracts.',
    image: CONSTRUCTION_UNSPLASH_IMAGES.materials,
    hrefSuffix: '/contact',
  },
  {
    id: 'insight-3',
    tag: 'Innovation',
    title: 'VDC & Lean Construction Benefits',
    excerpt: 'How BIM 5D coordination and Last Planner System reduce field conflicts and material waste by 15%+.',
    image: CONSTRUCTION_UNSPLASH_IMAGES.vdc,
    hrefSuffix: '/contact',
  },
];

// ── Delivery Methods ──────────────────────────────────────────────────────────

export const CONSTRUCTION_DELIVERY_METHODS = [
  {
    number: 1,
    label: 'CM AT RISK (CMR)',
    description: 'Construction Manager at Risk with guaranteed maximum price and shared savings',
  },
  {
    number: 2,
    label: 'DESIGN-BUILD (EPC TURNKEY)',
    description: 'Single-point responsibility for engineering, procurement, and construction',
  },
  {
    number: 3,
    label: 'CM & INTEGRATED PROJECT DELIVERY (IPD)',
    description: 'Collaborative delivery with aligned incentives and shared risk/reward',
  },
];

// ── Speed to Market Strategies ────────────────────────────────────────────────

export const CONSTRUCTION_SPEED_STRATEGIES = [
  { icon: 'clock', label: 'Fast-Track Procurement' },
  { icon: 'layers', label: 'Pre-Fab & Offsite' },
  { icon: 'check-circle', label: 'Lean Construction' },
  { icon: 'cpu', label: 'BIM & VDC' },
  { icon: 'shield-check', label: 'Commissioning & CQV' },
];
