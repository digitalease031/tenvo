'use client';

/**
 * Tax Compliance Dashboard
 * WHT calculation, provincial tax calculator, filing calendar, and compliance checklist.
 * Supports FBR Section 153(1)(c) + PRA, SRB, KPRA, BRA provincial taxes.
 */

import { useState, useMemo } from 'react';
import { Calculator, Calendar, CheckCircle2, AlertTriangle, FileText, Info, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONSTRUCTION_TAX_CONFIG_PK } from '@/lib/construction/constructionIntelligence';
import { useBusiness } from '@/lib/context/BusinessContext';

// ── Tax Calculator Widget ────────────────────────────────────────────────────

function TaxCalculatorWidget({ currency }) {
  const [amount, setAmount] = useState('50000000');
  const [isFiler, setIsFiler] = useState(true);
  const [province, setProvince] = useState('PK-PB');

  const calculation = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return null;

    const amt = parseFloat(amount);
    const whtRate = isFiler ? CONSTRUCTION_TAX_CONFIG_PK.whtFiler : CONSTRUCTION_TAX_CONFIG_PK.whtNonFiler;
    const wht = amt * (whtRate / 100);

    let provincialRate = 0;
    let provincialLabel = 'N/A';
    switch (province) {
      case 'PK-PB':
        provincialRate = CONSTRUCTION_TAX_CONFIG_PK.pra;
        provincialLabel = `Punjab (PRA)`;
        break;
      case 'PK-SD':
        provincialRate = CONSTRUCTION_TAX_CONFIG_PK.srb;
        provincialLabel = `Sindh (SRB)`;
        break;
      case 'PK-KP':
        provincialRate = CONSTRUCTION_TAX_CONFIG_PK.kpra;
        provincialLabel = `KP (KPRA)`;
        break;
      case 'PK-BA':
        provincialRate = CONSTRUCTION_TAX_CONFIG_PK.bra;
        provincialLabel = `Balochistan (BRA)`;
        break;
    }

    const provincial = amt * (provincialRate / 100);
    const totalTax = wht + provincial;
    const netPayable = amt - totalTax;

    return {
      grossAmount: amt,
      whtRate,
      wht,
      provincialRate,
      provincialLabel,
      provincial,
      totalTax,
      netPayable,
    };
  }, [amount, isFiler, province]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">Tax Calculator</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Gross Certified Amount ({currency})
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Contractor Status
            </label>
            <select
              value={isFiler ? 'filer' : 'non-filer'}
              onChange={(e) => setIsFiler(e.target.value === 'filer')}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            >
              <option value="filer">Filer (Active Taxpayer)</option>
              <option value="non-filer">Non-Filer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Province
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            >
              <option value="PK-PB">Punjab</option>
              <option value="PK-SD">Sindh</option>
              <option value="PK-KP">KP</option>
              <option value="PK-BA">Balochistan</option>
            </select>
          </div>
        </div>

        {calculation && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Gross Amount:</span>
              <span className="font-bold tabular-nums text-gray-900">
                {currency} {calculation.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                WHT (Section 153) {calculation.whtRate}%:
              </span>
              <span className="font-semibold tabular-nums text-red-700">
                −{currency} {calculation.wht.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {calculation.provincialLabel} {calculation.provincialRate}%:
              </span>
              <span className="font-semibold tabular-nums text-red-700">
                −{currency} {calculation.provincial.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm pt-2.5 border-t border-blue-200">
              <span className="font-semibold text-gray-900">Total Tax:</span>
              <span className="font-bold tabular-nums text-red-700">
                {currency} {calculation.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t border-blue-200">
              <span className="font-semibold text-gray-900">Net Payable:</span>
              <span className="font-bold tabular-nums text-green-700 text-base">
                {currency} {calculation.netPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filing Calendar ──────────────────────────────────────────────────────────

function FilingCalendar() {
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const upcomingDeadlines = [
    {
      id: 1,
      type: 'FBR WHT',
      description: 'Section 153 Withholding Tax Return',
      dueDate: '7th of following month',
      status: 'upcoming',
      daysLeft: 5,
    },
    {
      id: 2,
      type: 'PRA',
      description: 'Punjab Sales Tax on Services',
      dueDate: '15th of following month',
      status: 'upcoming',
      daysLeft: 13,
    },
    {
      id: 3,
      type: 'SRB',
      description: 'Sindh Sales Tax on Services',
      dueDate: '15th of following month',
      status: 'upcoming',
      daysLeft: 13,
    },
    {
      id: 4,
      type: 'Annual Return',
      description: 'Income Tax Annual Return (Tax Year 2026)',
      dueDate: 'September 30, 2026',
      status: 'planned',
      daysLeft: 47,
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">Filing Calendar</h3>
      </div>

      <div className="space-y-2.5">
        {upcomingDeadlines.map((deadline) => (
          <div
            key={deadline.id}
            className={cn(
              'rounded-xl border p-3 flex items-start gap-3',
              deadline.daysLeft <= 3 && 'border-red-200 bg-red-50',
              deadline.daysLeft > 3 && deadline.daysLeft <= 7 && 'border-amber-200 bg-amber-50',
              deadline.daysLeft > 7 && 'border-gray-200 bg-gray-50'
            )}
          >
            <div
              className={cn(
                'shrink-0 rounded-lg px-2.5 py-1.5 text-center',
                deadline.daysLeft <= 3 && 'bg-red-600 text-white',
                deadline.daysLeft > 3 && deadline.daysLeft <= 7 && 'bg-amber-600 text-white',
                deadline.daysLeft > 7 && 'bg-gray-600 text-white'
              )}
            >
              <div className="text-xs font-bold">{deadline.daysLeft}</div>
              <div className="text-[10px] font-medium">days</div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-gray-900">{deadline.type}</span>
                {deadline.daysLeft <= 3 && (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                )}
              </div>
              <p className="text-xs text-gray-700">{deadline.description}</p>
              <p className="text-xs text-gray-500 mt-0.5">Due: {deadline.dueDate}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">Note:</span> Filing frequency is monthly. Late payment penalty: 1.25% per month. 
          Non-filing penalty: Minimum PKR 10,000.
        </p>
      </div>
    </div>
  );
}

// ── Compliance Checklist ─────────────────────────────────────────────────────

function ComplianceChecklist() {
  const checklist = [
    {
      id: 1,
      item: 'Active Taxpayer Status (ATL)',
      status: 'complete',
      description: 'Verify company is on FBR Active Taxpayers List',
    },
    {
      id: 2,
      item: 'PEC Registration Valid',
      status: 'complete',
      description: 'PEC license renewed for 2026',
    },
    {
      id: 3,
      item: 'Provincial Tax Registration',
      status: 'complete',
      description: 'Registered with PRA/SRB/KPRA/BRA as applicable',
    },
    {
      id: 4,
      item: 'WHT Section 153 Compliance',
      status: 'pending',
      description: 'Last month WHT return filed within 7 days',
    },
    {
      id: 5,
      item: 'E-Payment Setup',
      status: 'complete',
      description: 'Punjab e-payment mandatory from 2026',
    },
    {
      id: 6,
      item: 'Tax Reconciliation',
      status: 'warning',
      description: 'Reconcile deducted tax with certificates received',
    },
  ];

  const stats = {
    complete: checklist.filter(c => c.status === 'complete').length,
    pending: checklist.filter(c => c.status === 'pending').length,
    warning: checklist.filter(c => c.status === 'warning').length,
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">Compliance Checklist</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-green-700 font-semibold">{stats.complete}/{checklist.length}</span>
        </div>
      </div>

      <div className="space-y-2">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-gray-200 p-3 flex items-start gap-3"
          >
            <div className="shrink-0 mt-0.5">
              {item.status === 'complete' && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {item.status === 'pending' && (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
              {item.status === 'warning' && (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-gray-900">{item.item}</h4>
              <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Provincial Tax Rates Reference ───────────────────────────────────────────

function ProvincialTaxReference() {
  const provinces = [
    {
      code: 'PK-PB',
      name: 'Punjab',
      authority: 'Punjab Revenue Authority (PRA)',
      rate: CONSTRUCTION_TAX_CONFIG_PK.pra,
      portal: 'reg.pra.punjab.gov.pk',
      notes: 'E-payment mandatory from 2026. Increased from 15% to 16%.',
    },
    {
      code: 'PK-SD',
      name: 'Sindh',
      authority: 'Sindh Revenue Board (SRB)',
      rate: CONSTRUCTION_TAX_CONFIG_PK.srb,
      portal: 'srb.gov.pk',
      notes: 'Lowest provincial rate. Luxury construction: 15%, Commercial high-rise: 14%.',
    },
    {
      code: 'PK-KP',
      name: 'Khyber Pakhtunkhwa',
      authority: 'KP Revenue Authority (KPRA)',
      rate: CONSTRUCTION_TAX_CONFIG_PK.kpra,
      portal: 'kpra.gov.pk',
      notes: 'Merger districts (ex-FATA) exempted from provincial tax.',
    },
    {
      code: 'PK-BA',
      name: 'Balochistan',
      authority: 'Balochistan Revenue Authority (BRA)',
      rate: CONSTRUCTION_TAX_CONFIG_PK.bra,
      portal: 'N/A',
      notes: 'Gwadar special rate: 10% for CPEC-related construction.',
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">Provincial Tax Rates 2026</h3>
      </div>

      <div className="space-y-3">
        {provinces.map((province) => (
          <div key={province.code} className="rounded-xl border border-gray-200 p-3.5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{province.name}</h4>
                <p className="text-xs text-gray-600 mt-0.5">{province.authority}</p>
              </div>
              <span className="text-lg font-bold text-blue-700 tabular-nums">
                {province.rate}%
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2">{province.notes}</p>
            {province.portal !== 'N/A' && (
              <p className="text-xs text-blue-600 font-medium">Portal: {province.portal}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function TaxComplianceDashboard() {
  const { business } = useBusiness();
  const currency = business?.settings?.financials?.currency || 'PKR';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Tax Compliance Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          FBR WHT + Provincial tax management (Tax Year 2026)
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">FBR Section 153(1)(c) — Execution of Contracts</p>
            <p className="text-blue-700">
              Withholding tax applies to all construction contracts. Filer rate: 7.5%, Non-filer: 15%. 
              Projects above PKR 100M require upfront 3.75% WHT collection (Section 153(2A)).
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TaxCalculatorWidget currency={currency} />
        <FilingCalendar />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ComplianceChecklist />
        <ProvincialTaxReference />
      </div>
    </div>
  );
}

export default TaxComplianceDashboard;
