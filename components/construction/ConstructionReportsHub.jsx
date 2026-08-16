'use client';

/**
 * Construction Reports Hub
 * Reports for BOQ Variance, IPC Billing History, Machinery Productivity, Subcontractors,
 * and PEC Clause 70 Price Escalation claims.
 */

import { useState } from 'react';
import {
  BarChart3, TrendingUp, Clock, Zap, Users, ArrowUp,
  FileText, Download, Calculator, Shield, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import notify from '@/lib/utils/appToast';

export function ConstructionReportsHub({ projects = [] }) {
  const { business } = useBusiness();
  const currency = business?.currency || 'PKR';
  const [activeSubTab, setActiveSubTab] = useState('escalation');

  // PEC Clause 70 Escalation State
  const [baseSteel, setBaseSteel] = useState('240000');
  const [currentSteel, setCurrentSteel] = useState('267000');
  const [weightageSteel, setWeightageSteel] = useState('0.25');

  const [baseCement, setBaseCement] = useState('1250');
  const [currentCement, setCurrentCement] = useState('1450');
  const [weightageCement, setWeightageCement] = useState('0.15');

  const [certifiedBillAmount, setCertifiedBillAmount] = useState('15000000');

  // Compute PEC Clause 70 Escalation Amount
  const escalationClaim = (() => {
    const P0 = parseFloat(certifiedBillAmount) || 0;

    const sBase = parseFloat(baseSteel) || 1;
    const sCurr = parseFloat(currentSteel) || 1;
    const sW = parseFloat(weightageSteel) || 0;

    const cBase = parseFloat(baseCement) || 1;
    const cCurr = parseFloat(currentCement) || 1;
    const cW = parseFloat(weightageCement) || 0;

    // Formula: P_n = P_0 * [a + b*(M_n/M_0) + c*(C_n/C_0) - 1]
    const steelFactor = sW * (sCurr / sBase);
    const cementFactor = cW * (cCurr / cBase);
    const fixedFactor = 1 - (sW + cW);

    const totalFactor = fixedFactor + steelFactor + cementFactor;
    const escalationPct = (totalFactor - 1) * 100;
    const netEscalationAmount = P0 * (totalFactor - 1);

    return {
      P0,
      escalationPct: escalationPct.toFixed(2),
      netEscalationAmount: Math.max(0, netEscalationAmount),
    };
  })();

  const SUB_TABS = [
    { id: 'escalation', label: 'PEC Clause 70 Escalation', icon: ArrowUp },
    { id: 'boq-variance', label: 'BOQ Cost Variance', icon: TrendingUp },
    { id: 'ipc-history', label: 'IPC Billing History', icon: Clock },
    { id: 'machinery-productivity', label: 'Machinery Productivity', icon: Zap },
    { id: 'subcontractor-accounts', label: 'Subcontractor Accounts', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <ArrowUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Calculated Escalation Claim</p>
            <p className="text-xl font-bold text-amber-900 tabular-nums">
              {currency} {escalationClaim.netEscalationAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Overall BOQ Variance</p>
            <p className="text-xl font-bold text-blue-700">+2.4% Cost Variance</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Fleet Fuel Productivity</p>
            <p className="text-xl font-bold text-emerald-800">4.8 Hrs / Litre</p>
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
            </button>
          );
        })}
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'escalation' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-600" />
                PEC Clause 70 Price Escalation Calculator (Standard Bidding Document)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Computes contract price adjustment for fluctuations in prices of specified materials (Steel, Cement, Diesel) based on Pakistan Bureau of Statistics WPI indices.
              </p>
            </div>
            <button
              onClick={() => {
                import('@/lib/pdf/constructionReportPdfManager').then(({ exportClause70EscalationPdf }) => {
                  exportClause70EscalationPdf({
                    claim: escalationClaim,
                    project: projects[0] || { code: 'PRJ-2026', name: 'Contract Execution Work', contractor_category: 'C-A', contract_value: 2890000000 },
                    business,
                  });
                });
              }}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export Claim PDF
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Input Controls */}
            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Base & Current Rate Inputs ({currency})</h4>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Gross Certified Bill Amount (P0)</label>
                <input
                  type="number"
                  value={certifiedBillAmount}
                  onChange={(e) => setCertifiedBillAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600">Steel Base Rate</label>
                  <input
                    type="number"
                    value={baseSteel}
                    onChange={(e) => setBaseSteel(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600">Steel Current Rate</label>
                  <input
                    type="number"
                    value={currentSteel}
                    onChange={(e) => setCurrentSteel(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600">Weightage (b)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={weightageSteel}
                    onChange={(e) => setWeightageSteel(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600">Cement Base Rate</label>
                  <input
                    type="number"
                    value={baseCement}
                    onChange={(e) => setBaseCement(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600">Cement Current Rate</label>
                  <input
                    type="number"
                    value={currentCement}
                    onChange={(e) => setCurrentCement(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600">Weightage (c)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={weightageCement}
                    onChange={(e) => setWeightageCement(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Claim Output Card */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-3">Escalation Claim Result Summary</h4>
                <div className="space-y-2.5 text-xs text-gray-800">
                  <div className="flex justify-between py-1 border-b border-amber-200/70">
                    <span>Steel Price Shift:</span>
                    <span className="font-bold text-gray-900">
                      {(((parseFloat(currentSteel) - parseFloat(baseSteel)) / parseFloat(baseSteel)) * 100).toFixed(1)}% Increase
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-amber-200/70">
                    <span>Cement Price Shift:</span>
                    <span className="font-bold text-gray-900">
                      {(((parseFloat(currentCement) - parseFloat(baseCement)) / parseFloat(baseCement)) * 100).toFixed(1)}% Increase
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-amber-200/70">
                    <span>Calculated Escalation Factor:</span>
                    <span className="font-extrabold text-amber-900">+{escalationClaim.escalationPct}%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-amber-600 p-4 text-white space-y-1">
                <p className="text-xs font-medium text-amber-100">Net Payable Price Adjustment (Clause 70)</p>
                <p className="text-2xl font-extrabold tabular-nums">
                  {currency} {escalationClaim.netEscalationAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'boq-variance' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Project BOQ Cost & Quantity Variance Summary
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Comparative analysis of estimated BOQ rates vs actual execution costs across all active site work packages.
              </p>
            </div>
            <button
              onClick={() => {
                import('@/lib/pdf/constructionReportPdfManager').then(({ exportBOQEstimatePdf }) => {
                  exportBOQEstimatePdf({
                    boqItems: [
                      { item_no: '1.01', description: 'Excavation in common soil (mechanical)', unit: 'Cu.M', estimated_qty: 15000, estimated_rate: 320, actual_qty: 14800, actual_rate: 310, schedule_code: 'CE-EW-02' },
                      { item_no: '1.02', description: 'Plain Cement Concrete 1:2:4 (PCC)', unit: 'Cu.M', estimated_qty: 2500, estimated_rate: 22000, actual_qty: 2600, actual_rate: 22500, schedule_code: 'BC-CC-01' },
                      { item_no: '1.03', description: 'RCC M-25 (3000 PSI) columns & slabs', unit: 'Cu.M', estimated_qty: 4800, estimated_rate: 36500, actual_qty: 4850, actual_rate: 37200, schedule_code: 'BC-CC-04' },
                      { item_no: '1.04', description: 'Deformed Steel Rebar Grade 60', unit: 'Ton', estimated_qty: 620, estimated_rate: 310000, actual_qty: 635, actual_rate: 318000, schedule_code: 'BC-CC-06' },
                      { item_no: '1.05', description: 'Brick masonry in 1:4 cement mortar (9")', unit: 'Cu.M', estimated_qty: 1800, estimated_rate: 18500, actual_qty: 1750, actual_rate: 18200, schedule_code: 'BC-MS-01' },
                    ],
                    project: projects[0] || { code: 'PRJ-2026-001', name: 'Lahore Ring Road Southern Loop 3' },
                    business,
                  });
                });
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export BOQ Report PDF
            </button>
          </div>

          <div className="space-y-3">
            {[
              { code: 'BOQ-1.01', item: 'Excavation in common soil (mechanical)', unit: 'Cu.M', estimated: 'PKR 4,800,000', actual: 'PKR 4,588,000', varPct: -4.4, status: 'Under Budget' },
              { code: 'BOQ-1.02', item: 'Plain Concrete 1:2:4 (PCC)', unit: 'Cu.M', estimated: 'PKR 55,000,000', actual: 'PKR 58,500,000', varPct: +6.4, status: 'Over Budget' },
              { code: 'BOQ-1.03', item: 'RCC M-25 (3000 PSI) columns & slabs', unit: 'Cu.M', estimated: 'PKR 175,200,000', actual: 'PKR 180,420,000', varPct: +3.0, status: 'Minor Overrun' },
              { code: 'BOQ-1.04', item: 'Deformed Steel Rebar Grade 60', unit: 'Ton', estimated: 'PKR 192,200,000', actual: 'PKR 201,930,000', varPct: +5.1, status: 'Price Escalation' },
              { code: 'BOQ-1.05', item: 'Brick masonry in 1:4 cement mortar (9")', unit: 'Cu.M', estimated: 'PKR 33,300,000', actual: 'PKR 31,850,000', varPct: -4.3, status: 'Under Budget' },
            ].map((row, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-blue-700">{row.code}</span> — <span className="font-bold text-gray-900">{row.item}</span> ({row.unit})
                  <p className="text-[11px] text-gray-500 mt-0.5">Est: {row.estimated} | Act: {row.actual} ({row.status})</p>
                </div>
                <span className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-bold',
                  row.varPct > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                )}>
                  {row.varPct > 0 ? `+${row.varPct}%` : `${row.varPct}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'ipc-history' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                Interim Payment Certificate (IPC) Billing Audit Trail
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Historical log of running bills submitted to client consultants (FIDIC / PEC Standard Clause 60).
              </p>
            </div>
            <button
              onClick={() => {
                import('@/lib/pdf/constructionReportPdfManager').then(({ exportIPCBillPdf }) => {
                  exportIPCBillPdf({
                    ipc: {
                      ipc_code: 'IPC-04',
                      ipc_number: 4,
                      gross_certified: 185000000,
                      net_payable: 148200000,
                      retention_amount: 9250000,
                      wht_amount: 11115000,
                      pra_amount: 7410000,
                      status: 'APPROVED',
                      created_at: new Date().toISOString(),
                    },
                    project: projects[0] || { code: 'PRJ-2026-001', name: 'Lahore Ring Road Southern Loop 3', client_name: 'C&W Department Punjab' },
                    business,
                  });
                });
              }}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export IPC Audit PDF
            </button>
          </div>

          <div className="space-y-3">
            {[
              { ipc: 'IPC-04', period: 'July 2026', gross: 'PKR 185,000,000', net: 'PKR 148,200,000', retention: 'PKR 9,250,000', status: 'APPROVED', date: '2026-07-31' },
              { ipc: 'IPC-03', period: 'June 2026', gross: 'PKR 142,000,000', net: 'PKR 113,800,000', retention: 'PKR 7,100,000', status: 'DISBURSED', date: '2026-06-30' },
              { ipc: 'IPC-02', period: 'May 2026', gross: 'PKR 98,000,000', net: 'PKR 78,500,000', retention: 'PKR 4,900,000', status: 'DISBURSED', date: '2026-05-31' },
              { ipc: 'IPC-01', period: 'April 2026', gross: 'PKR 45,000,000', net: 'PKR 36,000,000', retention: 'PKR 2,250,000', status: 'DISBURSED', date: '2026-04-30' },
            ].map((row, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-purple-700">{row.ipc}</span> — <span className="font-bold text-gray-900">{row.period}</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">Gross: {row.gross} | Retention (5%): {row.retention} | Net: {row.net}</p>
                </div>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-bold">
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'machinery-productivity' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" />
                Plant & Heavy Equipment Productivity Report
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Engine operating hours, fuel consumption efficiency, and downtime log across site machinery.
              </p>
            </div>
            <button
              onClick={() => {
                import('@/lib/pdf/constructionReportPdfManager').then(({ exportSiteDailyReportPdf }) => {
                  exportSiteDailyReportPdf({
                    project: projects[0] || { code: 'PRJ-2026-001', name: 'Lahore Ring Road Southern Loop 3' },
                    date: new Date().toISOString().split('T')[0],
                    business,
                  });
                });
              }}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export Fleet Log PDF
            </button>
          </div>

          <div className="space-y-3">
            {[
              { tag: 'EQ-EXC-01', model: 'CAT 320D Excavator', hours: '168 hrs', fuel: '3,024 L', avgRate: '18 L/hr', efficiency: 'Optimal' },
              { tag: 'EQ-GRD-02', model: 'CAT 140K Motor Grader', hours: '142 hrs', fuel: '3,124 L', avgRate: '22 L/hr', efficiency: 'Optimal' },
              { tag: 'EQ-PAV-01', model: 'Vögele Super 1800 Paver', hours: '98 hrs', fuel: '1,470 L', avgRate: '15 L/hr', efficiency: 'Good' },
              { tag: 'EQ-GEN-01', model: '100 KVA Perkins Generator', hours: '220 hrs', fuel: '3,080 L', avgRate: '14 L/hr', efficiency: 'Optimal' },
            ].map((row, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-700">{row.tag}</span> — <span className="font-bold text-gray-900">{row.model}</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">Month Hours: {row.hours} | Fuel Used: {row.fuel} ({row.avgRate})</p>
                </div>
                <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-1 text-[11px] font-bold">
                  {row.efficiency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'subcontractor-accounts' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Subcontractor Running Accounts & Retention Ledger
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Work order contract balances, 5% to 10% retainage deductions, and DLP release status across trade partners.
              </p>
            </div>
            <button
              onClick={() => {
                import('@/lib/pdf/constructionReportPdfManager').then(({ exportExecutiveFinancialPdf }) => {
                  exportExecutiveFinancialPdf({
                    projects: projects.length > 0 ? projects : [
                      { code: 'PRJ-2026-001', name: 'Lahore Ring Road SL-3', contract_value: 450000000, cumulative_certified: 185000000, retention_held: 9250000 },
                      { code: 'PRJ-2026-002', name: 'Islamabad Commercial Tower', contract_value: 280000000, cumulative_certified: 98000000, retention_held: 4900000 },
                    ],
                    business,
                  });
                });
              }}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export Financial Portfolio PDF
            </button>
          </div>

          <div className="space-y-3">
            {[
              { sub: 'Master Steel Builders Ltd', trade: 'Steel Reinforcement Fixing', WO: 'WO-2026-01', contract: 'PKR 28,000,000', paid: 'PKR 18,500,000', retainage: 'PKR 1,400,000', dlp: 'IN_PROGRESS' },
              { sub: 'Al-Madina Concrete Services', trade: 'PCC & Formwork', WO: 'WO-2026-02', contract: 'PKR 15,000,000', paid: 'PKR 11,200,000', retainage: 'PKR 750,000', dlp: 'IN_PROGRESS' },
              { sub: 'Tariq Paving & Asphalt Co', trade: 'Road Asphalt Works', WO: 'WO-2026-03', contract: 'PKR 42,000,000', paid: 'PKR 35,000,000', retainage: 'PKR 2,100,000', dlp: 'DLP_ELIGIBLE' },
            ].map((row, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-800">{row.sub}</span> — <span className="font-bold text-gray-900">{row.trade}</span> ({row.WO})
                  <p className="text-[11px] text-gray-500 mt-0.5">Contract: {row.contract} | Net Paid: {row.paid} | Retainage (5%): {row.retainage}</p>
                </div>
                <span className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-bold',
                  row.dlp === 'DLP_ELIGIBLE' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                )}>
                  {row.dlp === 'DLP_ELIGIBLE' ? 'Eligible for Release' : 'In Progress'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
