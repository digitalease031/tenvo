'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Wrench, 
  Building2, 
  Cpu, 
  CheckCircle2, 
  Compass, 
  Layers, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  HardHat,
  Truck,
  FileText
} from 'lucide-react';
import { notify } from '@/lib/utils/notify';
import { resolveStoreContact } from '@/lib/storefront/storeContact';

// Construction Domain Seed Projects
const FEATURED_PROJECTS = [
  {
    id: 'prj-1',
    title: 'Confidential Pharmaceutical & cGMP Facility',
    category: 'Life Sciences & Pharma',
    location: 'Lahore Industrial Estate',
    image: '/tenvo-img/construction/construction-service.jpg',
    specs: '250,000 Sq Ft · Cleanroom ISO 5 · Fast-Track EPC',
    badge: 'Turnkey EPC',
  },
  {
    id: 'prj-2',
    title: 'Biologics & Cell & Gene Therapy R&D Lab',
    category: 'R&D & High-Tech Cleanrooms',
    location: 'Islamabad Tech Zone',
    image: '/tenvo-img/construction/service2.jpg',
    specs: '120,000 Sq Ft · 3D VDC Coordinate · HVAC HEPA 99.97%',
    badge: 'VDC Coordinated',
  },
  {
    id: 'prj-3',
    title: 'Affordable Housing & Urban Infrastructure Complex',
    category: 'Commercial & High-Rise',
    location: 'Karachi Central District',
    image: '/tenvo-img/construction/affordable.jpg',
    specs: '450 Units · Grade 60 Rebar · PEC Category C-A',
    badge: 'PEC Approved',
  },
  {
    id: 'prj-4',
    title: 'Central Concrete Batching & Heavy Equipment Hub',
    category: 'Civil & Heavy Infrastructure',
    location: 'Motorway M-2 Interchange',
    image: '/tenvo-img/construction/construction-1.jpg',
    specs: '5,000 Cu.M / Day · RMC C25/C30 · Fleet Management',
    badge: 'Infrastructure',
  },
];

const DIVERSE_MODALITIES = [
  {
    title: 'Oral Solid Dosage (OSD)',
    subtitle: 'High-speed tablet & capsule manufacturing suites compliant with US-FDA & PSQCA.',
    image: '/tenvo-img/construction/construction-service.jpg',
  },
  {
    title: 'Biologics & Biopharmaceuticals',
    subtitle: 'Aseptic liquid filling lines, bioreactor cleanrooms, and cold-chain logistics.',
    image: '/tenvo-img/construction/service2.jpg',
  },
  {
    title: 'Cell & Gene Therapy (CGT)',
    subtitle: 'Ultra-clean ISO 5 airflow suites, negative-pressure containment, and biosafety labs.',
    image: '/tenvo-img/construction/construction-1.jpg',
  },
  {
    title: 'Commercial & High-Rise Towers',
    subtitle: 'Multi-story earthquake-resistant RCC structures with post-tensioned slab technology.',
    image: '/tenvo-img/construction/affordable.jpg',
  },
];

const INHOUSE_SERVICES = [
  {
    id: 'preconstruction',
    label: 'PRECONSTRUCTION',
    title: 'Preconstruction & BOQ Estimation',
    desc: 'Target budget alignment, constructability reviews, MRS schedule code mapping, value engineering, and preliminary procurement schedules to guarantee cost certainty before ground break.',
    bullets: [
      'Comprehensive BOQ itemized costing & MRS Punjab/Sindh price breakdown',
      'Value engineering saving up to 12% in structural steel and concrete',
      'Long-lead material procurement tracking & vendor vetting',
    ],
    image: '/tenvo-img/construction/service2.jpg',
  },
  {
    id: 'vdc',
    label: 'VIRTUAL DESIGN & CONSTRUCTION (VDC)',
    title: 'VDC & Building Data Models (BIM 5D)',
    desc: 'Full 3D/4D/5D BIM coordination eliminates field clashes, optimizes MEP routing in cleanroom ceilings, and integrates real-time interim payment certificate (IPC) tracking.',
    bullets: [
      '3D spatial collision detection for HVAC, MEP, and structural beams',
      '4D construction sequencing and site logistics simulation',
      '5D cost integration linked directly to BOQ line items',
    ],
    image: '/tenvo-img/construction/service2.jpg',
  },
  {
    id: 'quality',
    label: 'QUALITY CONTROL',
    title: 'Strict Quality & ASTM / ISO Compliance',
    desc: 'On-site concrete slump and 28-day cylinder compressive testing, ASTM A615 Grade 60 steel tensile inspection, and PSQCA certification for every raw material delivery.',
    bullets: [
      'Third-party laboratory certified steel and aggregate testing',
      'Daily site QA/QC logbook and non-conformance tracking',
      'Cleanroom particle count certification & HEPA air balance',
    ],
    image: '/tenvo-img/construction/construction-service.jpg',
  },
  {
    id: 'lean',
    label: 'INTEGRATED LEAN PROJECT DELIVERY',
    title: 'Lean Construction & Just-In-Time Logistics',
    desc: 'Eliminates site material wastage, streamlines gate pass dispatch, and synchronizes RMC transit mixers to keep pouring operations continuous without cold joints.',
    bullets: [
      'Last Planner System (LPS) weekly work plan commitments',
      'Modular pre-fabrication for off-site MEP skid assembly',
      'Zero-waste material handling and recycled aggregate utilization',
    ],
    image: '/tenvo-img/construction/construction-1.jpg',
  },
  {
    id: 'controls',
    label: 'PROJECT CONTROLS & IPC',
    title: 'IPC Running Bills & Project Controls',
    desc: 'FIDIC compliant interim payment certificates, mobilization advance recovery tracking, retention ledger, and PEC escalation calculation under local price indices.',
    bullets: [
      'Automated running bill generation with retention & tax deductions',
      'PECA / FIDIC contract escalation under cement, steel, & fuel indices',
      'Subcontractor retainage ledger & payment approvals',
    ],
    image: '/tenvo-img/construction/affordable.jpg',
  },
  {
    id: 'safety',
    label: 'FIELD OPERATIONS & SAFETY',
    title: 'Culture of Safety & Site Gate Passes',
    desc: 'Zero-harm HSE culture, compulsory PPE protocols, tower crane safety audits, site access gate pass logs, and heavy machinery fuel monitoring.',
    bullets: [
      'ISO 45001 Occupational Health & Safety Certified field management',
      'Daily toolbox talks & high-risk activity permits (hot work, scaffolding)',
      'Digital gate pass control for material inward & outward dispatch',
    ],
    image: '/tenvo-img/construction/construction-service.jpg',
  },
];

export function ConstructionHomeSections({ business, settings }) {
  const contact = resolveStoreContact(business, settings);
  
  // Interactive tab states
  const [whyTab, setWhyTab] = useState('safety');
  const [serviceTab, setServiceTab] = useState('preconstruction');
  
  // Contact / Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    company: '',
    projectType: 'Life Sciences & Pharma',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeService = INHOUSE_SERVICES.find(s => s.id === serviceTab) || INHOUSE_SERVICES[0];

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!quoteForm.firstName || !quoteForm.email || !quoteForm.phone) {
      notify.compactSave('Please complete your name, email, and phone number', false);
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate executive quote submission / store connection save
      await new Promise((r) => setTimeout(r, 600));
      notify.compactSave('Thank you! Our VP Market Leader & Engineering team will contact you shortly.', true);
      setQuoteForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        title: '',
        company: '',
        projectType: 'Life Sciences & Pharma',
        message: '',
      });
    } catch (err) {
      notify.compactSave('Failed to submit quote request. Please try again.', false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white text-gray-900 font-sans">
      
      {/* ── 1. HERO HEADER BANNER ────────────────────────────────────────────── */}
      <section className="relative min-h-[560px] lg:min-h-[640px] flex items-center justify-center bg-gray-950 overflow-hidden">
        <Image
          src="/tenvo-img/construction/construction-1.jpg"
          alt="Consigli Construction Life Sciences & Civil Engineering"
          fill
          priority
          className="object-cover object-center opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a71930] text-xs font-semibold uppercase tracking-wider mb-6 shadow-md">
            <Building2 className="w-4 h-4 text-white" />
            Consigli At A Glance
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight uppercase leading-tight mb-4 max-w-4xl mx-auto">
            LIFE SCIENCES & CIVIL CONSTRUCTION
          </h1>

          <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
            Innovation starts with a dream and a plan. PEC C-A & C-1 licensed general contractor for turnkey pharmaceutical, commercial, and high-tech infrastructure.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#featured-projects"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#a71930] hover:bg-[#800000] text-white font-semibold text-sm transition-colors shadow-lg"
            >
              Discover Work
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#get-in-touch"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-sm border border-white/20 transition-colors"
            >
              Get In Touch
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. BY THE NUMBERS STATS STRIP ───────────────────────────────────── */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-[#a71930] uppercase tracking-wide">By the Numbers</h2>
            <div className="w-12 h-1 bg-[#a71930] mx-auto mt-2 rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#a71930] tabular-nums mb-1">15</div>
              <p className="text-xs font-semibold text-gray-700 uppercase">Cleanrooms ISO Certified</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#a71930] tabular-nums mb-1">500+</div>
              <p className="text-xs font-semibold text-gray-700 uppercase">Completed In-House Ops</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#a71930] tabular-nums mb-1">2,000+</div>
              <p className="text-xs font-semibold text-gray-700 uppercase">Completed Pharma Projects</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#a71930] tabular-nums mb-1">25M+</div>
              <p className="text-xs font-semibold text-gray-700 uppercase">Sq Ft cGMP / Structural</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#a71930] tabular-nums mb-1">$12B+</div>
              <p className="text-xs font-semibold text-gray-700 uppercase">Construction Value 5Y</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#a71930] tabular-nums mb-1">#2</div>
              <p className="text-xs font-semibold text-gray-700 uppercase">cGMP Contractor Firm</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. RED ACCENT NARRATIVE: WHY CONSIGLI? ───────────────────────────── */}
      <section className="bg-[#a71930] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            <div className="lg:col-span-2 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-red-200">Excellence & Compliance</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-snug">
                Customized construction execution for the most complex life science and infrastructure projects.
              </h2>
              <p className="text-red-100 text-sm leading-relaxed max-w-2xl font-light">
                Our specialized team combines rigorous cleanroom protocols, ASTM Grade 60 steel standards, BIM 5D preconstruction, and transparent Interim Payment Certificates (IPC) to deliver projects on schedule and within budget.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href="#in-house-services"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-white text-[#a71930] font-bold text-xs hover:bg-gray-100 transition-colors shadow-sm"
                >
                  View Capabilities
                </a>
                <a
                  href="#get-in-touch"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#800000] text-white font-bold text-xs hover:bg-black/30 transition-colors border border-white/20"
                >
                  Contact Us
                </a>
              </div>
            </div>

            <div className="relative h-64 lg:h-72 rounded-xl overflow-hidden shadow-2xl border border-white/20">
              <Image
                src="/tenvo-img/construction/construction-service.jpg"
                alt="Consigli Construction Service Facility"
                fill
                className="object-cover object-center"
              />
            </div>

          </div>

          {/* Why Consigli Interactive Tabs */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <h3 className="text-center text-xl font-bold uppercase tracking-wider mb-6">Why Consigli?</h3>
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {[
                { id: 'safety', label: 'Culture of Safety' },
                { id: 'precon', label: 'Preconstruction & Design' },
                { id: 'emergency', label: 'Emergency Service & Portal' },
                { id: 'virtual', label: 'Virtual Construction (VDC)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setWhyTab(tab.id)}
                  className={`px-4 py-2 rounded-t-lg font-bold text-xs tracking-wide transition-all ${
                    whyTab === tab.id
                      ? 'bg-white text-[#a71930] shadow-md'
                      : 'bg-black/20 text-white hover:bg-black/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 max-w-3xl mx-auto text-center">
              {whyTab === 'safety' && (
                <div>
                  <h4 className="font-bold text-lg mb-2">Culture of Safety</h4>
                  <p className="text-xs text-red-100 font-light leading-relaxed">
                    Safety is deeply embedded in everything we do. Our field management maintains ISO 45001 standards, zero-harm HSE protocols, crane safety audits, and continuous worker training.
                  </p>
                </div>
              )}
              {whyTab === 'precon' && (
                <div>
                  <h4 className="font-bold text-lg mb-2">Preconstruction & Design</h4>
                  <p className="text-xs text-red-100 font-light leading-relaxed">
                    Detailed BOQ cost engineering, MRS schedule code cross-referencing, long-lead procurement planning, and value engineering prior to site mobilization.
                  </p>
                </div>
              )}
              {whyTab === 'emergency' && (
                <div>
                  <h4 className="font-bold text-lg mb-2">Emergency Service & Portal</h4>
                  <p className="text-xs text-red-100 font-light leading-relaxed">
                    24/7 emergency response portal for critical facility repairs, MEP failure interventions, and rapid dispatch of mobile batching and maintenance crews.
                  </p>
                </div>
              )}
              {whyTab === 'virtual' && (
                <div>
                  <h4 className="font-bold text-lg mb-2">Virtual Construction (VDC)</h4>
                  <p className="text-xs text-red-100 font-light leading-relaxed">
                    BIM 5D spatial coordination, 3D laser scan point-cloud integration, clash detection, and digital twin handovers for pharmaceutical cleanrooms.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. DIVERSE MODALITY EXPERIENCE CARDS ────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase">
              Diverse Modality Experience
            </h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto mt-2">
              Specialized execution capabilities across cleanroom facilities, commercial developments, and civil infrastructure.
            </p>
            <div className="w-16 h-1 bg-[#a71930] mx-auto mt-3 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DIVERSE_MODALITIES.map((item, idx) => (
              <div
                key={idx}
                className="group relative h-80 rounded-2xl overflow-hidden shadow-lg border border-gray-200 transition-transform duration-300 hover:-translate-y-1"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-lg font-bold uppercase mb-2 group-hover:text-red-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-300 font-light line-clamp-3 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. DELIVERY METHODS & STRATEGIES FOR SPEED TO MARKET ────────────── */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Red Delivery Methods Box */}
            <div className="lg:col-span-5 bg-[#a71930] text-white p-8 rounded-2xl shadow-xl">
              <h2 className="text-2xl font-extrabold uppercase mb-4">Delivery Methods</h2>
              <p className="text-xs text-red-100 mb-6 font-light">
                Flexible contractual arrangements tailored to risk profile, speed requirement, and procurement guidelines.
              </p>

              <ol className="space-y-4 font-bold text-sm">
                <li className="flex items-center gap-3 bg-[#800000] p-3.5 rounded-xl border border-white/10">
                  <span className="w-7 h-7 rounded-full bg-white text-[#a71930] flex items-center justify-center font-extrabold text-xs">
                    1
                  </span>
                  <span>CM AT RISK (CMR)</span>
                </li>
                <li className="flex items-center gap-3 bg-[#800000] p-3.5 rounded-xl border border-white/10">
                  <span className="w-7 h-7 rounded-full bg-white text-[#a71930] flex items-center justify-center font-extrabold text-xs">
                    2
                  </span>
                  <span>DESIGN-BUILD (EPC TURNKEY)</span>
                </li>
                <li className="flex items-center gap-3 bg-[#800000] p-3.5 rounded-xl border border-white/10">
                  <span className="w-7 h-7 rounded-full bg-white text-[#a71930] flex items-center justify-center font-extrabold text-xs">
                    3
                  </span>
                  <span>CM & INTEGRATED PROJECT DELIVERY (IPD)</span>
                </li>
              </ol>
            </div>

            {/* Right Strategies For Speed To Market Circular Steps */}
            <div className="lg:col-span-7">
              <h2 className="text-2xl font-extrabold text-gray-900 uppercase text-center lg:text-left mb-8">
                Strategies for Speed to Market
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                {[
                  { icon: Clock, label: 'Fast-Track Procurement' },
                  { icon: Layers, label: 'Pre-Fab & Offsite' },
                  { icon: CheckCircle2, label: 'Lean Construction' },
                  { icon: Cpu, label: 'Building Data Model & VDC' },
                  { icon: ShieldCheck, label: 'Commissioning & Qualification' },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-14 h-14 rounded-full border-2 border-[#a71930] text-[#a71930] flex items-center justify-center mb-3 bg-red-50/50 shadow-sm">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-gray-800 leading-tight uppercase">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. FEATURED PROJECTS ─────────────────────────────────────────────── */}
      <section id="featured-projects" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase">
                Featured Projects
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Representative high-spec industrial, pharmaceutical, and civil infrastructure delivery.
              </p>
            </div>
            <Link
              href="/products"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#a71930] hover:text-[#800000]"
            >
              Explore All BOQ Materials & Catalog
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURED_PROJECTS.slice(0, 3).map((prj) => (
              <div
                key={prj.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="relative h-56 w-full bg-gray-900">
                  <Image
                    src={prj.image}
                    alt={prj.title}
                    fill
                    className="object-cover object-center"
                  />
                  <div className="absolute top-3 left-3 bg-[#a71930] text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded shadow-md">
                    {prj.badge}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#a71930] uppercase tracking-wider">
                      {prj.category}
                    </span>
                    <h3 className="text-lg font-extrabold text-gray-900 mt-1 mb-2 leading-snug">
                      {prj.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-light mb-4 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {prj.location}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 font-medium">
                    <span>{prj.specs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. KEY IN-HOUSE SERVICES (INTERACTIVE ACCORDION / TABS) ──────────── */}
      <section id="in-house-services" className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase">
              Key In-House Services
            </h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto mt-2">
              End-to-end technical execution from 3D VDC modeling to site gate pass safety logs.
            </p>
            <div className="w-16 h-1 bg-[#a71930] mx-auto mt-3 rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Vertical Tabs */}
            <div className="lg:col-span-4 flex flex-col space-y-2">
              {INHOUSE_SERVICES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServiceTab(s.id)}
                  className={`text-left px-5 py-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-between border ${
                    serviceTab === s.id
                      ? 'bg-[#a71930] text-white border-[#a71930] shadow-md'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>{s.label}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${serviceTab === s.id ? 'rotate-90' : ''}`} />
                </button>
              ))}
            </div>

            {/* Right Active Service Content & Blueprint Image */}
            <div className="lg:col-span-8 bg-gray-50 rounded-2xl p-8 border border-gray-200 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#a71930] uppercase tracking-widest">
                    In-House Capability
                  </span>
                  <h3 className="text-2xl font-extrabold text-gray-900 leading-snug">
                    {activeService.title}
                  </h3>
                  <p className="text-xs text-gray-600 font-light leading-relaxed">
                    {activeService.desc}
                  </p>

                  <ul className="space-y-2 pt-2">
                    {activeService.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs font-medium text-gray-800">
                        <CheckCircle2 className="w-4 h-4 text-[#a71930] shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative h-64 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                  <Image
                    src={activeService.image}
                    alt={activeService.title}
                    fill
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-bold uppercase tracking-wide">
                      3D VDC / Structural Execution Diagram
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 8. GET IN TOUCH EXECUTIVE CONTACT & QUOTE FORM ─────────────────── */}
      <section id="get-in-touch" className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: VP / Owner Market Leader Contact Badge */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#a71930]">Direct Contact</span>
                <h2 className="text-3xl font-extrabold uppercase text-white mt-1">
                  GET IN TOUCH
                </h2>
                <p className="text-xs text-gray-300 font-light mt-2 leading-relaxed">
                  Connect directly with our VP & Construction Market Leader to discuss project scope, BOQ estimates, and contract specifications.
                </p>
              </div>

              {/* Owner / Executive Card */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl flex items-center gap-5">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#a71930] shrink-0 bg-gray-700">
                  <Image
                    src="/zeeshankeerio.png"
                    alt="Geoff Kiester / Construction VP Market Leader"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Zeeshan Keerio / Geoff Kiester</h3>
                  <p className="text-xs font-semibold text-red-400">VP & Market Leader — Construction & Life Sciences</p>
                  <p className="text-[11px] text-gray-400 mt-1">PEC Licensed Civil Engineer · 18+ Years Exp</p>
                </div>
              </div>

              {/* Direct Details */}
              <div className="space-y-3.5 text-xs text-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#a71930]/20 text-[#a71930] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Direct Phone</p>
                    <p className="font-bold text-white tabular-nums">{contact.phone || '+92-300-555-0199'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#a71930]/20 text-[#a71930] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Engineering Email</p>
                    <p className="font-bold text-white">{contact.email || 'construction@tenvo.pk'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#a71930]/20 text-[#a71930] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Head Office</p>
                    <p className="font-bold text-white">{contact.address || 'Industrial Zone, Phase 3, Lahore / Karachi'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Executive Quote Request Form */}
            <div className="lg:col-span-7 bg-white text-gray-900 rounded-2xl p-8 border border-gray-200 shadow-2xl">
              <h3 className="text-xl font-extrabold uppercase mb-1">Request Proposal & BOQ Estimate</h3>
              <p className="text-xs text-gray-500 mb-6">
                Fill out the form below to receive a formal response within 24 hours.
              </p>

              <form onSubmit={handleQuoteSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={quoteForm.firstName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, firstName: e.target.value })}
                      placeholder="e.g. Geoff"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#a71930] focus:border-[#a71930] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={quoteForm.lastName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, lastName: e.target.value })}
                      placeholder="e.g. Kiester"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#a71930] focus:border-[#a71930] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={quoteForm.email}
                      onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                      placeholder="e.g. geoff@pharma.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#a71930] focus:border-[#a71930] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={quoteForm.phone}
                      onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#a71930] focus:border-[#a71930] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Title / Designation
                    </label>
                    <input
                      type="text"
                      value={quoteForm.title}
                      onChange={(e) => setQuoteForm({ ...quoteForm, title: e.target.value })}
                      placeholder="e.g. Project Director"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#a71930] focus:border-[#a71930] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={quoteForm.company}
                      onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}
                      placeholder="e.g. BioPharma International"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#a71930] focus:border-[#a71930] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Project Modality / Type
                  </label>
                  <select
                    value={quoteForm.projectType}
                    onChange={(e) => setQuoteForm({ ...quoteForm, projectType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#a71930] focus:border-[#a71930] outline-none bg-white"
                  >
                    <option value="Life Sciences & Pharma">Life Sciences & Pharmaceutical Cleanroom</option>
                    <option value="Commercial & High-Rise">Commercial Building & High-Rise</option>
                    <option value="Civil & Heavy Infrastructure">Civil Infrastructure, Highway & Bridge</option>
                    <option value="Industrial & Warehousing">Industrial Facility & Warehousing</option>
                    <option value="BOQ Materials & RMC Supply">BOQ Steel, Cement & RMC Supply</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Project Message / Scope Notes
                  </label>
                  <textarea
                    rows={3}
                    value={quoteForm.message}
                    onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                    placeholder="Provide details on target square footage, commencement date, or BOQ requirements..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#a71930] focus:border-[#a71930] outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#a71930] hover:bg-[#800000] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <span>Submit Proposal & Quote Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
