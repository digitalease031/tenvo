'use client';

/**
 * Site Materials Hub
 * Inventory stock management, gate passes, site requisitions, and BOQ consumption tracking.
 * Tailored for Pakistani construction sites (Steel, Cement, Aggregate, Sand, Bitumen, Bricks).
 */

import { useState, useMemo } from 'react';
import {
  Warehouse, ClipboardCheck, FileEdit, TrendingDown, Package,
  Plus, Search, AlertTriangle, ArrowUpRight, ArrowDownLeft, CheckCircle2,
  Clock, Shield, Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { PK_CONSTRUCTION_MATERIAL_RATES_2026 } from '@/lib/construction/constructionIntelligence';
import notify from '@/lib/utils/appToast';

// ── Initial Mock/Seed Site Materials Stock ───────────────────────────────────

const INITIAL_SITE_STOCK = [
  { id: 'mat-1', name: 'Deformed Steel Rebar 12mm', category: 'Steel', qty: 28.5, unit: 'Ton', rate: 265000, minStock: 10, location: 'Yard A - Block 3' },
  { id: 'mat-2', name: 'Deformed Steel Rebar 16mm', category: 'Steel', qty: 18.2, unit: 'Ton', rate: 267000, minStock: 8, location: 'Yard A - Block 3' },
  { id: 'mat-3', name: 'OPC Cement 50kg (Lucky)', category: 'Cement', qty: 450, unit: 'Bag', rate: 1450, minStock: 200, location: 'Cement Shed #1' },
  { id: 'mat-4', name: 'River Sand (Chenab)', category: 'Sand', qty: 3200, unit: 'Cu.Ft', rate: 85, minStock: 1000, location: 'Aggregate Pit #2' },
  { id: 'mat-5', name: 'Aggregate 20mm (Margalla Crush)', category: 'Aggregate', qty: 4100, unit: 'Cu.Ft', rate: 135, minStock: 1500, location: 'Aggregate Pit #1' },
  { id: 'mat-6', name: 'Bitumen 60/70', category: 'Bitumen', qty: 12, unit: 'Ton', rate: 245000, minStock: 5, location: 'Hazmat Shed' },
  { id: 'mat-7', name: 'Clay Bricks 1st Class', category: 'Masonry', qty: 18500, unit: 'Piece', rate: 17.5, minStock: 5000, location: 'Brick Stack West' },
];

const INITIAL_GATE_PASSES = [
  { id: 'gp-101', type: 'INWARD', passNo: 'GP-2026-0811', vehicleNo: 'LES-8842', material: 'OPC Cement 50kg Bags', qty: '300 Bags', supplier: 'Lucky Cement Depot', driver: 'Muhammad Aslam (CNIC: 35202-*****-1)', status: 'APPROVED', time: '2026-08-14 09:30 AM' },
  { id: 'gp-102', type: 'INWARD', passNo: 'GP-2026-0812', vehicleNo: 'FDJ-1920', material: 'Steel Rebar 16mm', qty: '12 Tons', supplier: 'Mughal Steel Mills', driver: 'Tariq Mehmood (CNIC: 38403-*****-3)', status: 'APPROVED', time: '2026-08-14 02:15 PM' },
  { id: 'gp-103', type: 'OUTWARD', passNo: 'GP-2026-0813', vehicleNo: 'LHO-4411', material: 'Excavator Bucket Teeth & Scrap', qty: '1.5 Tons', destination: 'Central Workshop Badami Bagh', driver: 'Rashid Khan (CNIC: 35101-*****-7)', status: 'PENDING', time: '2026-08-15 11:00 AM' },
];

const INITIAL_REQUISITIONS = [
  { id: 'req-201', reqNo: 'MR-044', project: 'Lahore Ring Road SL-3', material: 'Deformed Steel Rebar 12mm', qtyRequested: '5 Tons', priority: 'URGENT', requestedBy: 'Engr. Shahbaz Ahmed', status: 'APPROVED', date: '2026-08-14' },
  { id: 'req-202', reqNo: 'MR-045', project: 'Islamabad Commercial Tower', material: 'Ready Mix Concrete C30', qtyRequested: '60 Cu.M', priority: 'HIGH', requestedBy: 'Foreman Boota', status: 'PENDING', date: '2026-08-15' },
];

export function SiteMaterialsHub({ projects = [] }) {
  const { business } = useBusiness();
  const currency = business?.currency || 'PKR';
  const [activeSubTab, setActiveSubTab] = useState('stock');

  // Search & filter
  const [search, setSearch] = useState('');
  const [stockList, setStockList] = useState(INITIAL_SITE_STOCK);
  const [gatePasses, setGatePasses] = useState(INITIAL_GATE_PASSES);
  const [requisitions, setRequisitions] = useState(INITIAL_REQUISITIONS);

  // Stats
  const totalStockValue = useMemo(() => {
    return stockList.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  }, [stockList]);

  const lowStockCount = useMemo(() => {
    return stockList.filter((item) => item.qty <= item.minStock).length;
  }, [stockList]);

  const SUB_TABS = [
    { id: 'stock', label: 'On-Site Stock', icon: Warehouse, badge: `${stockList.length} Items` },
    { id: 'gate-pass', label: 'Gate Passes', icon: ClipboardCheck, badge: `${gatePasses.length} Passes` },
    { id: 'requisitions', label: 'Site Requisitions', icon: FileEdit, badge: `${requisitions.length} Pending` },
    { id: 'consumption', label: 'BOQ Consumption', icon: TrendingDown },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Warehouse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Site Stock Value</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums">
              {currency} {(totalStockValue / 1_000_000).toFixed(2)}M
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Low Stock Reorder Items</p>
            <p className="text-xl font-bold text-amber-700">{lowStockCount} Items Below Threshold</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Gate Passes Today</p>
            <p className="text-xl font-bold text-emerald-700">{gatePasses.length} Inward / Outward</p>
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
          onClick={() => notify.compactSave('New material stock entry modal ready')}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Stock Issue / Pass</span>
        </button>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search site stock by name, category, yard location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Material Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Available Stock</th>
                  <th className="px-4 py-3">Unit Rate</th>
                  <th className="px-4 py-3">Total Value</th>
                  <th className="px-4 py-3">Storage Location</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {stockList
                  .filter((item) => !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase()))
                  .map((item) => {
                    const isLow = item.qty <= item.minStock;
                    const val = item.qty * item.rate;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-gray-600">{item.category}</td>
                        <td className="px-4 py-3 tabular-nums font-semibold text-gray-800">
                          {item.qty.toLocaleString()} {item.unit}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-gray-600">
                          {currency} {item.rate.toLocaleString()} / {item.unit}
                        </td>
                        <td className="px-4 py-3 tabular-nums font-bold text-gray-900">
                          {currency} {val.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{item.location}</td>
                        <td className="px-4 py-3 text-right">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              <AlertTriangle className="h-3 w-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> Optimal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'gate-pass' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Pass No</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Vehicle #</th>
                  <th className="px-4 py-3">Material & Qty</th>
                  <th className="px-4 py-3">Driver / CNIC</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {gatePasses.map((gp) => (
                  <tr key={gp.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-blue-700">{gp.passNo}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                        gp.type === 'INWARD' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      )}>
                        {gp.type === 'INWARD' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        {gp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">{gp.vehicleNo}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{gp.material} ({gp.qty})</td>
                    <td className="px-4 py-3 text-gray-500">{gp.driver}</td>
                    <td className="px-4 py-3 text-gray-500">{gp.time}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                        gp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      )}>
                        {gp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'requisitions' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Req No</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Material Requested</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {requisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-purple-700">{req.reqNo}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{req.project}</td>
                    <td className="px-4 py-3 text-gray-900 font-bold">{req.material}</td>
                    <td className="px-4 py-3 text-gray-800">{req.qtyRequested}</td>
                    <td className="px-4 py-3 text-gray-600">{req.requestedBy}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
                        req.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      )}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => notify.compactSave(`Requisition ${req.reqNo} approved`)}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors"
                      >
                        Approve & Issue
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'consumption' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-blue-600" />
            BOQ Material Consumption vs Site Stock Variance
          </h3>
          <p className="text-xs text-gray-500">
            Automated site consumption tracking comparing BOQ estimated bill of materials with store gate pass disbursements.
          </p>

          <div className="space-y-3">
            {[
              { name: 'Steel Rebar Grade 60', estimated: '120 Tons', issued: '86.7 Tons', pct: 72, status: 'On Track' },
              { name: 'OPC Cement 50kg Bags', estimated: '4,500 Bags', issued: '3,850 Bags', pct: 85, status: 'High Usage' },
              { name: 'River Sand (Chenab)', estimated: '25,000 Cu.Ft', issued: '18,400 Cu.Ft', pct: 73, status: 'On Track' },
              { name: 'Margalla Crush Aggregate', estimated: '35,000 Cu.Ft', issued: '24,100 Cu.Ft', pct: 68, status: 'Optimal' },
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900">{item.name}</span>
                  <span className="text-gray-500">
                    Issued: <strong className="text-gray-800">{item.issued}</strong> / Est: {item.estimated}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      item.pct > 80 ? 'bg-amber-500' : 'bg-blue-600'
                    )}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{item.pct}% BOQ Limit Consumed</span>
                  <span className="font-semibold text-blue-700">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
