'use client';

/**
 * Procurement Hub
 * Material Purchase Orders, Supplier Quote Comparisons, and PPRA Tender Compliance.
 */

import { useState } from 'react';
import {
  ShoppingCart, FileText, DollarSign, Shield, Plus, Search,
  CheckCircle2, Clock, Truck, Building2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import notify from '@/lib/utils/appToast';

const MOCK_POS = [
  { id: 'po-1', poNo: 'PO-2026-091', supplier: 'Mughal Steel Mills Ltd', project: 'Lahore Ring Road SL-3', material: 'Steel Rebar Grade 60 16mm', qty: '50 Tons', totalVal: 13_350_000, status: 'DELIVERED', date: '2026-08-10' },
  { id: 'po-2', poNo: 'PO-2026-092', supplier: 'Lucky Cement Depot Lahore', project: 'Islamabad Commercial Tower', material: 'OPC Cement 50kg Bags', qty: '1,000 Bags', totalVal: 1_450_000, status: 'APPROVED', date: '2026-08-12' },
  { id: 'po-3', poNo: 'PO-2026-093', supplier: 'Margalla Crush Quarries', project: 'Lahore Ring Road SL-3', material: 'Aggregate 20mm Crush', qty: '5,000 Cu.Ft', totalVal: 675_000, status: 'PENDING', date: '2026-08-15' },
];

const MOCK_QUOTES = [
  { id: 'q-1', material: 'Deformed Steel Rebar Grade 60 (16mm)', unit: 'Ton', quotes: [{ supplier: 'Mughal Steel', rate: 267000, term: 'Credit 15 Days' }, { supplier: 'Ittefaq Steel', rate: 264000, term: 'Advance Cash' }, { supplier: 'Amreli Steels', rate: 269000, term: 'Credit 30 Days' }] },
  { id: 'q-2', material: 'OPC Cement 50kg Bags', unit: 'Bag', quotes: [{ supplier: 'Lucky Cement', rate: 1450, term: 'Site Delivery' }, { supplier: 'Maple Leaf', rate: 1430, term: 'Ex-Factory' }, { supplier: 'Bestway Cement', rate: 1440, term: 'Site Delivery' }] },
];

export function ProcurementHub({ projects = [] }) {
  const { business } = useBusiness();
  const currency = business?.currency || 'PKR';
  const [activeSubTab, setActiveSubTab] = useState('po');

  const SUB_TABS = [
    { id: 'po', label: 'Purchase Orders', icon: FileText, badge: `${MOCK_POS.length} Orders` },
    { id: 'quotes', label: 'Supplier Rate Quotes', icon: DollarSign },
    { id: 'ppra', label: 'PPRA Tender Compliance', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Active Material Orders</p>
            <p className="text-xl font-bold text-gray-900">{MOCK_POS.length} Purchase Orders</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Delivered Material Volume</p>
            <p className="text-xl font-bold text-emerald-800">{currency} 15.4M</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">PPRA Tender Status</p>
            <p className="text-xl font-bold text-indigo-700">Fully Compliant</p>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
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

        <button
          onClick={() => notify.compactSave('New material purchase order modal opened')}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Material PO</span>
        </button>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'po' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Material & Qty</th>
                <th className="px-4 py-3">Total Value</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {MOCK_POS.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-bold text-blue-700">{po.poNo}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{po.supplier}</td>
                  <td className="px-4 py-3 text-gray-600 font-semibold">{po.project}</td>
                  <td className="px-4 py-3 text-gray-800">{po.material} ({po.qty})</td>
                  <td className="px-4 py-3 tabular-nums font-bold text-gray-900">
                    {currency} {po.totalVal.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{po.date}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                      po.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      po.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    )}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'quotes' && (
        <div className="space-y-4">
          {MOCK_QUOTES.map((mq) => (
            <div key={mq.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                {mq.material} (Unit: {mq.unit})
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {mq.quotes.map((q, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-1 hover:border-blue-300 transition-all">
                    <p className="text-xs font-bold text-gray-800">{q.supplier}</p>
                    <p className="text-lg font-extrabold text-blue-900 tabular-nums">
                      {currency} {q.rate.toLocaleString()} <span className="text-xs font-normal text-gray-500">/ {mq.unit}</span>
                    </p>
                    <p className="text-[11px] text-gray-500">Terms: {q.term}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'ppra' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            PPRA (Public Procurement Regulatory Authority) Compliance Matrix
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: 'Active Taxpayer Status (FBR ATL)', status: 'PASS', note: 'Verified on FBR e-portal' },
              { label: 'PEC Registration Renewal 2026', status: 'PASS', note: 'Category C-2 valid till Dec 2026' },
              { label: 'Earnest Money Deposit (2% EMD)', status: 'PASS', note: 'Bank Guarantee deposited' },
              { label: 'PPRA Tender Notice Adherence', status: 'PASS', note: 'Rule 12 & 35 compliant' },
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">{item.label}</p>
                  <p className="text-[11px] text-gray-500">{item.note}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" /> {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
