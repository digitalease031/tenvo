'use client';

/**
 * Construction Letterhead Generator & Print Suite
 * Complete letterhead design suite tailored for construction contractors, builders, and engineers.
 * Supports uploaded logos, WhiteHouse preset, background watermarks, custom headers/footers, and A4 printing.
 */

import { useState, useTransition } from 'react';
import {
  FileText, Printer, Sparkles, Image as ImageIcon, Palette, Shield,
  Building2, MapPin, Mail, Phone, RefreshCw, Check, Layers, Sliders,
  Eye, Download, FileSpreadsheet, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { exportConstructionLetterheadPdf, buildLetterheadHtml } from '@/lib/pdf/constructionLetterheadPdf';
import notify from '@/lib/utils/appToast';

const LETTERHEAD_PRESETS = [
  {
    id: 'whitehouse',
    label: 'White House Sample Preset',
    description: 'Exact replica of White House Constructions letterhead with logo, maroon accents, Bahria Town Karachi address & watermark.',
    badge: 'Popular',
    values: {
      companyName: 'WHITE HOUSE CONSTRUCTIONS',
      tagline: 'BUILDING TRUST. CREATING FUTURES.',
      logoUrl: '/storefront/construction/logo-whitehouse.png',
      logoHeight: 70,
      logoPosition: 'left',
      headerStyle: 'angled-ribbon',
      primaryColor: '#7A1C2C',
      secondaryColor: '#4A4A4A',
      pecInfo: 'PEC License Category: C-2 (Civil Engineering)',
      ntnStrn: 'NTN: 4029182-7 | STRN: 3277870192812',
      showWatermark: true,
      watermarkUrl: '/storefront/construction/logo-whitehouse.png',
      watermarkOpacity: 0.07,
      watermarkPosition: 'bottom-right',
      watermarkScale: 460,
      address: 'Office no: 5B fifth floor, Midway Pearl Building, Midway Commercial, Bahria Town Karachi',
      email: 'whitehouseconstructions@yahoo.com',
      phone: '03003232896',
      refNo: 'WHC/PRJ-2026/LTR-084',
      date: new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }),
      recipientName: 'The Superintending Engineer',
      recipientTitle: 'Infrastructure & Engineering Works Division',
      recipientCompany: 'Department of Public Works / Bahria Town Karachi',
      recipientAddress: 'Sindh, Pakistan',
      subject: 'RE: COMMERCIAL TOWER SITE QUALITY AUDIT & MILESTONE COMPLIANCE',
      salutation: 'Dear Sir,',
      bodyText: `We are pleased to submit the official progress update and quality compliance verification report for the ongoing structural works. All concrete batching tests, steel rebar tensile certifications (Grade 60), and safety audit logs conform strictly to PEC standard specifications and approved BOQ benchmarks.

Our site engineering team has completed 100% of the ground-floor slab pour and column reinforcement inspection. Should you require any further technical documentation or site inspection, please do not hesitate to contact our chief project executive directly. We remain committed to maintaining the highest engineering standards and on-schedule execution.`,
      signatoryName: 'Engr. Zeeshan Keerio',
      signatoryTitle: 'Managing Director / Chief Executive',
      showStampArea: true,
      isBlankStationery: false,
    },
  },
  {
    id: 'ipc-transmittal',
    label: 'IPC Transmittal Letter',
    description: 'Official submission cover letter for Interim Payment Certificate (Running Bill) to client/consultant.',
    values: {
      subject: 'SUBMISSION OF INTERIM PAYMENT CERTIFICATE NO. 04 (RUNNING BILL)',
      salutation: 'Respected Engineer / Client Representative,',
      bodyText: `We hereby formally submit Interim Payment Certificate (IPC) No. 04 for the certified execution period ending this month, evaluated in accordance with Contract Agreement Clause 60 and approved BOQ line item rates.

The net certified bill amount payable is PKR 14,850,000/- after applying standard 5% retention deduction and advance mobilization recovery. Detailed measurement sheets, joint measurement records (JMR), and consultant verification notes are attached herewith for your review and prompt disbursement approval.`,
      isBlankStationery: false,
    },
  },
  {
    id: 'boq-quote',
    label: 'BOQ & Tender Quote',
    description: 'Formal transmittal letter for submitting Bill of Quantities schedule & composite rate analysis.',
    values: {
      subject: 'TENDER SUBMISSION & BOQ COMPOSITE RATE BID SCHEDULE',
      salutation: 'Gentlemen,',
      bodyText: `In response to your Tender Invitation No. PEC-INFRA-2026-92, we take pleasure in submitting our complete Technical & Financial Proposal along with the itemized Bill of Quantities (BOQ) composite rate breakdown.

Our quoted rates are based on current 2026 market prices for cement, Grade 60 steel rebar, and MRS/CSR schedule rates. We confirm that our PEC license Category C-2 registration is active and fully eligible for this contract execution.`,
      isBlankStationery: false,
    },
  },
  {
    id: 'site-inspection',
    label: 'Site Inspection Notice',
    description: 'Formal notification to consultant/architect requesting pre-pour concrete or structural inspection.',
    values: {
      subject: 'REQUEST FOR PRE-POUR CONCRETE & REBAR STRUCTURAL INSPECTION',
      salutation: 'Dear Resident Engineer,',
      bodyText: `Please be informed that shuttering, steel reinforcement placement, and MEP conduit sleeve embeds for Slab Level 3 (Grid A-12) are fully completed and ready for your formal site inspection.

We request your engineering team to conduct the joint inspection at 10:00 AM tomorrow so that concrete pour operations can commence as scheduled. Structural rebar test certificates from NUST/NED laboratories are available on site for your verification.`,
      isBlankStationery: false,
    },
  },
  {
    id: 'stationery-blank',
    label: 'Blank Letterhead Stationery Mode',
    description: 'Clears the letter body text so you can print clean, branded letterhead paper for physical writing or office printing.',
    values: {
      isBlankStationery: true,
    },
  },
];

export function ConstructionLetterheadHub({ projects = [] }) {
  const { business } = useBusiness();

  // Resolved default business logo
  const initialLogo = business?.logo_url || business?.settings?.brand?.logoUrl || '/storefront/construction/logo-whitehouse.png';
  const initialCompanyName = business?.name || 'WHITE HOUSE CONSTRUCTIONS';

  // Letterhead State
  const [config, setConfig] = useState({
    companyName: initialCompanyName,
    tagline: 'BUILDING TRUST. CREATING FUTURES.',
    logoUrl: initialLogo,
    logoHeight: 70,
    logoPosition: 'left',
    headerStyle: 'angled-ribbon',
    primaryColor: '#7A1C2C',
    secondaryColor: '#4A4A4A',
    pecInfo: 'PEC License Category: C-2 (Civil Engineering)',
    ntnStrn: 'NTN: 4029182-7 | STRN: 3277870192812',
    showWatermark: true,
    watermarkUrl: initialLogo,
    watermarkOpacity: 0.07,
    watermarkPosition: 'bottom-right',
    watermarkScale: 460,
    address: 'Office no: 5B fifth floor, Midway Pearl Building, Midway Commercial, Bahria Town Karachi',
    email: 'whitehouseconstructions@yahoo.com',
    phone: '03003232896',
    refNo: 'WHC/PRJ-2026/LTR-084',
    date: new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }),
    recipientName: 'The Superintending Engineer',
    recipientTitle: 'Infrastructure & Engineering Works Division',
    recipientCompany: 'Department of Public Works / Bahria Town Karachi',
    recipientAddress: 'Sindh, Pakistan',
    subject: 'RE: COMMERCIAL TOWER SITE QUALITY AUDIT & MILESTONE COMPLIANCE',
    salutation: 'Dear Sir,',
    bodyText: `We are pleased to submit the official progress update and quality compliance verification report for the ongoing structural works. All concrete batching tests, steel rebar tensile certifications (Grade 60), and safety audit logs conform strictly to PEC standard specifications and approved BOQ benchmarks.

Our site engineering team has completed 100% of the ground-floor slab pour and column reinforcement inspection. Should you require any further technical documentation or site inspection, please do not hesitate to contact our chief project executive directly. We remain committed to maintaining the highest engineering standards and on-schedule execution.`,
    signatoryName: 'Engr. Zeeshan Keerio',
    signatoryTitle: 'Managing Director / Chief Executive',
    showStampArea: true,
    isBlankStationery: false,
  });

  const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'watermark' | 'content' | 'footer'
  const [, startTransition] = useTransition();

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset) => {
    setConfig((prev) => ({
      ...prev,
      ...preset.values,
    }));
    notify.compactSave(`Applied ${preset.label}`);
  };

  const handlePrint = () => {
    exportConstructionLetterheadPdf(config);
  };

  // Build live HTML string for iframe preview
  const previewHtml = buildLetterheadHtml(config);

  return (
    <div className="space-y-6">
      {/* Top Header & Presets Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-red-700" />
              Construction Letterhead Builder & Print Suite
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Design, customize, and print pixel-perfect A4 official company letterheads with uploaded logo, background watermark & PEC credentials.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => applyPreset(LETTERHEAD_PRESETS[0])}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-2 text-xs font-bold text-red-800 hover:bg-red-100 transition-colors shadow-sm"
              title="Load White House Constructions exact logo, colors & address preset"
            >
              <Sparkles className="h-4 w-4 text-red-700" />
              Load White House Sample
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Printer className="h-4 w-4" />
              Print / Export PDF
            </button>
          </div>
        </div>

        {/* Quick Presets Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Quick Presets:</span>
          {LETTERHEAD_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors whitespace-nowrap"
            >
              <span>{preset.label}</span>
              {preset.badge && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-800">
                  {preset.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace: Controls (Left) + Live Canvas (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left Controls Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
            
            {/* Control Tabs */}
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1 text-xs font-semibold text-gray-600">
              <button
                onClick={() => setActiveTab('branding')}
                className={cn(
                  'rounded-lg py-1.5 transition-all text-center',
                  activeTab === 'branding' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'hover:text-gray-900'
                )}
              >
                Header & Logo
              </button>
              <button
                onClick={() => setActiveTab('watermark')}
                className={cn(
                  'rounded-lg py-1.5 transition-all text-center',
                  activeTab === 'watermark' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'hover:text-gray-900'
                )}
              >
                Watermark
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={cn(
                  'rounded-lg py-1.5 transition-all text-center',
                  activeTab === 'content' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'hover:text-gray-900'
                )}
              >
                Letter Body
              </button>
              <button
                onClick={() => setActiveTab('footer')}
                className={cn(
                  'rounded-lg py-1.5 transition-all text-center',
                  activeTab === 'footer' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'hover:text-gray-900'
                )}
              >
                Footer Info
              </button>
            </div>

            {/* TAB 1: Header & Branding Controls */}
            {activeTab === 'branding' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Company Logo Image</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={config.logoUrl}
                      onChange={(e) => updateConfig('logoUrl', e.target.value)}
                      placeholder="/storefront/construction/logo-whitehouse.png or image URL"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 font-mono"
                    />
                    {config.logoUrl && (
                      <img src={config.logoUrl} alt="Logo" className="h-9 w-9 rounded-lg object-contain border border-gray-200 bg-gray-50 p-1" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Upload logo in settings or enter image URL / path.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Logo Height ({config.logoHeight}px)</label>
                    <input
                      type="range"
                      min="40"
                      max="110"
                      value={config.logoHeight}
                      onChange={(e) => updateConfig('logoHeight', Number(e.target.value))}
                      className="w-full accent-red-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Header Style</label>
                    <select
                      value={config.headerStyle}
                      onChange={(e) => updateConfig('headerStyle', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-bold text-gray-900"
                    >
                      <option value="angled-ribbon">White House Angled Ribbons</option>
                      <option value="clean-border">Clean Border Accent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={config.companyName}
                    onChange={(e) => updateConfig('companyName', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tagline / Slogan</label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => updateConfig('tagline', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => updateConfig('primaryColor', e.target.value)}
                        className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                      />
                      <span className="font-mono text-xs font-bold">{config.primaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Secondary Accent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.secondaryColor}
                        onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                        className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                      />
                      <span className="font-mono text-xs font-bold">{config.secondaryColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">PEC Registration & License</label>
                  <input
                    type="text"
                    value={config.pecInfo}
                    onChange={(e) => updateConfig('pecInfo', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">NTN & STRN</label>
                  <input
                    type="text"
                    value={config.ntnStrn}
                    onChange={(e) => updateConfig('ntnStrn', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Watermark Settings */}
            {activeTab === 'watermark' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div>
                    <p className="font-bold text-gray-900">Background Logo Watermark</p>
                    <p className="text-[10px] text-gray-500">Show semi-transparent watermark seal in background</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showWatermark}
                    onChange={(e) => updateConfig('showWatermark', e.target.checked)}
                    className="h-4 w-4 rounded accent-red-700"
                  />
                </div>

                {config.showWatermark && (
                  <>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Watermark Image URL</label>
                      <input
                        type="text"
                        value={config.watermarkUrl}
                        onChange={(e) => updateConfig('watermarkUrl', e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Watermark Opacity ({Math.round(config.watermarkOpacity * 100)}%)</label>
                      <input
                        type="range"
                        min="0.02"
                        max="0.25"
                        step="0.01"
                        value={config.watermarkOpacity}
                        onChange={(e) => updateConfig('watermarkOpacity', Number(e.target.value))}
                        className="w-full accent-red-700"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">Keep opacity under 10% so letter body text remains 100% crisp & readable.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Position</label>
                        <select
                          value={config.watermarkPosition}
                          onChange={(e) => updateConfig('watermarkPosition', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-bold text-gray-900"
                        >
                          <option value="bottom-right">Bottom Right (WhiteHouse style)</option>
                          <option value="center">Page Center</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Scale ({config.watermarkScale}px)</label>
                        <input
                          type="range"
                          min="200"
                          max="650"
                          step="10"
                          value={config.watermarkScale}
                          onChange={(e) => updateConfig('watermarkScale', Number(e.target.value))}
                          className="w-full accent-red-700"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: Letter Body & Presets */}
            {activeTab === 'content' && (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-2.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                    <span className="font-bold text-amber-900 text-[11px]">Blank Pre-printed Letterhead Mode</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.isBlankStationery}
                    onChange={(e) => updateConfig('isBlankStationery', e.target.checked)}
                    className="h-4 w-4 rounded accent-amber-700"
                  />
                </div>

                {!config.isBlankStationery && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Ref No</label>
                        <input
                          type="text"
                          value={config.refNo}
                          onChange={(e) => updateConfig('refNo', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Date</label>
                        <input
                          type="text"
                          value={config.date}
                          onChange={(e) => updateConfig('date', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Recipient Name & Title</label>
                      <input
                        type="text"
                        value={config.recipientName}
                        onChange={(e) => updateConfig('recipientName', e.target.value)}
                        placeholder="e.g. The Superintending Engineer"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900 mb-1.5"
                      />
                      <input
                        type="text"
                        value={config.recipientCompany}
                        onChange={(e) => updateConfig('recipientCompany', e.target.value)}
                        placeholder="e.g. Department of Public Works"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Subject Line</label>
                      <input
                        type="text"
                        value={config.subject}
                        onChange={(e) => updateConfig('subject', e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-red-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Letter Body Text</label>
                      <textarea
                        rows={7}
                        value={config.bodyText}
                        onChange={(e) => updateConfig('bodyText', e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-900 leading-relaxed font-sans"
                        placeholder="Type letter content... Double line breaks create new paragraphs."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Signatory Name</label>
                        <input
                          type="text"
                          value={config.signatoryName}
                          onChange={(e) => updateConfig('signatoryName', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Signatory Title</label>
                        <input
                          type="text"
                          value={config.signatoryTitle}
                          onChange={(e) => updateConfig('signatoryTitle', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 4: Footer Info */}
            {activeTab === 'footer' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Office Location Address</label>
                  <textarea
                    rows={2}
                    value={config.address}
                    onChange={(e) => updateConfig('address', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Official Email</label>
                    <input
                      type="text"
                      value={config.email}
                      onChange={(e) => updateConfig('email', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Direct Phone / Mobile</label>
                    <input
                      type="text"
                      value={config.phone}
                      onChange={(e) => updateConfig('phone', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Canvas: Scaled A4 Letterhead Live Preview */}
        <div className="lg:col-span-7">
          <div className="sticky top-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-red-700" />
                Live A4 Print Preview
              </span>
              <span className="text-[10px] text-gray-400 font-mono">210mm × 297mm (Standard A4)</span>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-gray-200/70 p-4 sm:p-6 shadow-inner flex justify-center overflow-auto">
              <div className="w-[620px] min-h-[870px] bg-white shadow-2xl rounded-sm overflow-hidden transform transition-all origin-top">
                <iframe
                  title="Letterhead Live Preview"
                  srcDoc={previewHtml}
                  className="w-full h-[870px] border-0"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
