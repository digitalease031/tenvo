'use client';

/**
 * Construction Finance Hub
 * Project P&L, Cash Flow Projections, Retention Money Ledger, and FBR/Provincial Tax Deductions.
 */

import { useState, useMemo } from 'react';
import {
  Banknote, ArrowRightLeft, PieChart, FileCheck, Unlock, Lock,
  TrendingUp, TrendingDown, DollarSign, Shield, Receipt, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import notify from '@/lib/utils/appToast';

const MOCK_PL_PROJECTS = [
  { id: 'p-1', code: 'PRJ-2026-001', name: 'Lahore Ring Road Southern Loop 3', contractVal: 450_000_000, certifiedVal: 185_000_000, materialCost: 92_000_000, laborCost: 28_000_000, machineryCost: 18_500_000, subCost: 15_000_000, marginPct: 17.0 },
  { id: 'p-2', code: 'PRJ-2026-002', name: 'Islamabad Commercial Tower (B+G+14)', contractVal: 280_000_000, certifiedVal: 98_000_000, materialCost: 48_000_000, laborCost: 16_000_000, machineryCost: 9_000_000, subCost: 8_500_000, marginPct: 16.8 },
  { id: 'p-3', code: 'PRJ-2026-003', name: 'Karachi Port Trust Warehouses', contractVal: 175_000_000, certifiedVal: 45_000_000, materialCost: 21_000_000, laborCost: 7_500_000, machineryCost: 4_200_000, subCost: 3_800_000, marginPct: 18.9 },
];

const MOCK_RETENTION_LEDGER = [
  { id: 'ret-1', project: 'Lahore Ring Road SL-3', client: 'C&W Department Punjab', totalCertified: 185_000_000, retentionRate: 5.0, retentionHeld: 9_250_000, dlpExpiry: '2027-03-31', status: 'HELD' },
  { id: 'ret-2', project: 'Islamabad Commercial Tower', client: 'Zameen Developments', totalCertified: 98_000_000, retentionRate: 5.0, retentionHeld: 4_900_000, dlpExpiry: '2026-11-15', status: 'HELD' },
  { id: 'ret-3', project: 'Faisalabad Bypass Extension', client: 'FDA Faisalabad', totalCertified: 65_000_000, retentionRate: 10.0, retentionHeld: 6_500_000, dlpExpiry: '2026-06-30', status: 'ELIGIBLE_FOR_RELEASE' },
];

export function ConstructionFinanceHub({ projects = [] }) {
  const { business } = useBusiness();
  const currency = business?.currency || 'PKR';
  const [activeSubTab, setActiveSubTab] = useState('project-pl');

  const totalContractVal = useMemo(() => MOCK_PL_PROJECTS.reduce((s, p) => s + p.contractVal, 0), []);
  const totalCertifiedVal = useMemo(() => MOCK_PL_PROJECTS.reduce((s, p) => s + p.certifiedVal, 0), []);
  const totalRetentionHeld = useMemo(() => MOCK_RETENTION_LEDGER.reduce((s, r) => s + r.retentionHeld, 0), []);

  const SUB_TABS = [
    { id: 'project-pl', label: 'Project P&L', icon: PieChart },
    { id: 'cash-flow', label: 'Cash Flow Projection', icon: ArrowRightLeft },
    { id: 'retention-release', label: 'Retention Ledger', icon: Unlock, badge: `${(totalRetentionHeld / 1_000_000).toFixed(1)}M Held` },
    { id: 'wht', label: 'WHT & Tax Deductions', icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Cumulative Certified Revenue</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums">
              {currency} {(totalCertifiedVal / 1_000_000).toFixed(2)}M
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Retention Held</p>
            <p className="text-xl font-bold text-purple-800 tabular-nums">
              {currency} {(totalRetentionHeld / 1_000_000).toFixed(2)}M
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Avg. Net Margin Across Projects</p>
            <p className="text-xl font-bold text-blue-700">17.2%</p>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap',
                active
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'project-pl' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Project Code & Name</th>
                  <th className="px-4 py-3">Contract Value</th>
                  <th className="px-4 py-3">Certified Work</th>
                  <th className="px-4 py-3">Material Cost</th>
                  <th className="px-4 py-3">Labor & Machinery</th>
                  <th className="px-4 py-3">Subcontractor</th>
                  <th className="px-4 py-3 text-right">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {MOCK_PL_PROJECTS.map((p) => {
                  const directCost = p.materialCost + p.laborCost + p.machineryCost + p.subCost;
                  const profit = p.certifiedVal - directCost;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <span className="block font-bold text-blue-700">{p.code}</span>
                        <span className="text-gray-900 font-semibold">{p.name}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-700 font-semibold">
                        {currency} {(p.contractVal / 1_000_000).toFixed(1)}M
                      </td>
                      <td className="px-4 py-3 tabular-nums text-emerald-700 font-bold">
                        {currency} {(p.certifiedVal / 1_000_000).toFixed(1)}M
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600">
                        {currency} {(p.materialCost / 1_000_000).toFixed(1)}M
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600">
                        {currency} {((p.laborCost + p.machineryCost) / 1_000_000).toFixed(1)}M
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600">
                        {currency} {(p.subCost / 1_000_000).toFixed(1)}M
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                          {p.marginPct}% ({currency} {(profit / 1_000_000).toFixed(1)}M)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'cash-flow' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            Rolling 60-Day Construction Cash Flow Projection
          </h3>
          <p className="text-xs text-gray-500">
            Real-time projection comparing incoming client IPC payments with outgoing supplier POs, subcontractor running bills, and daily labor payroll.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Expected Inflows (30 Days)</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-emerald-200/60">
                  <span>IPC #4 — C&W Department (Ring Road)</span>
                  <span className="font-bold text-emerald-900">{currency} 34.5M</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-200/60">
                  <span>IPC #2 — Zameen Developments</span>
                  <span className="font-bold text-emerald-900">{currency} 18.2M</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-2">
              <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide">Expected Outflows (30 Days)</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-red-200/60">
                  <span>Mughal Steel Rebar Order (PO-991)</span>
                  <span className="font-bold text-red-900">{currency} 14.8M</span>
                </div>
                <div className="flex justify-between py-1 border-b border-red-200/60">
                  <span>Subcontractor Running Account (Excavation)</span>
                  <span className="font-bold text-red-900">{currency} 6.4M</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'retention-release' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Project & Client</th>
                  <th className="px-4 py-3">Cumulative Certified</th>
                  <th className="px-4 py-3">Retention Rate</th>
                  <th className="px-4 py-3">Retention Held</th>
                  <th className="px-4 py-3">DLP Expiry Date</th>
                  <th className="px-4 py-3 text-right">Release Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {MOCK_RETENTION_LEDGER.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="block font-bold text-gray-900">{ret.project}</span>
                      <span className="text-gray-500 text-[11px]">{ret.client}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-gray-800">
                      {currency} {(ret.totalCertified / 1_000_000).toFixed(1)}M
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-700">{ret.retentionRate}%</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-purple-700">
                      {currency} {(ret.retentionHeld / 1_000_000).toFixed(2)}M
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-semibold">{ret.dlpExpiry}</td>
                    <td className="px-4 py-3 text-right">
                      {ret.status === 'ELIGIBLE_FOR_RELEASE' ? (
                        <button
                          onClick={() => notify.compactSave(`Retention release requested for ${ret.project}`)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          Request Release
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                          <Lock className="h-3 w-3" /> In DLP Period
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'wht' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-blue-600" />
            FBR Section 153(1)(c) & Provincial WHT Withholding Summary
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase">FBR WHT Withheld by Clients</h4>
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {currency} 13,875,000
              </p>
              <p className="text-xs text-gray-500">7.5% Corporate Contractor WHT on Certified IPCs</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase">Provincial Sales Tax Paid (PRA 5%)</h4>
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {currency} 9,250,000
              </p>
              <p className="text-xs text-gray-500">Punjab Revenue Authority reduced 5% construction rate</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
