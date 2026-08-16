'use client';

/**
 * BOQ Items Table
 * Bill of Quantities line items with MRS/CSR codes, variance analysis, and bulk import.
 */

import { useState, useTransition, useMemo } from 'react';
import {
  Plus, Calculator, TrendingUp, TrendingDown, Minus,
  Edit2, Trash2, X, Upload, Download, AlertTriangle,
  CheckCircle, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import {
  addBOQItemAction,
  updateBOQItemAction,
  deleteBOQItemAction,
  analyzeBOQVarianceAction,
} from '@/lib/actions/construction/boq';
import notify from '@/lib/utils/appToast';
import {
  PK_CONSTRUCTION_MATERIAL_RATES_2026,
  CONSTRUCTION_SOR_REFERENCES,
  BOQ_ITEM_PRESETS,
} from '@/lib/construction/constructionIntelligence';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n, currency = 'PKR') {
  const v = Number(n || 0);
  if (v >= 1_000_000_000) return `${currency} ${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${currency} ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${currency} ${(v / 1_000).toFixed(1)}K`;
  return `${currency} ${v.toLocaleString()}`;
}

function varianceColor(pct) {
  if (pct > 10) return 'text-red-600';
  if (pct < -10) return 'text-green-600';
  return 'text-gray-500';
}

function VarianceBadge({ pct }) {
  if (pct === undefined || pct === null) return null;
  const abs = Math.abs(pct);
  const isOver = pct > 0;
  const isUnder = pct < 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
      isOver  ? 'bg-red-50   text-red-600'   :
      isUnder ? 'bg-green-50 text-green-600' :
                'bg-gray-50  text-gray-500'
    )}>
      {isOver ? <TrendingUp className="h-2.5 w-2.5" /> : isUnder ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
      {abs.toFixed(1)}%
    </span>
  );
}

// ── BOQ Form Modal ────────────────────────────────────────────────────────────

const COMMON_UNITS = ['Cu.M', 'Cu.Ft', 'Ton', 'Kg', 'Bag', 'R.Ft', 'Sq.Ft', 'Sq.M', 'Hour', 'Day', 'Job', 'Month', 'Trip'];

function BOQFormModal({ item = null, projectId, onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    item_no: item?.item_no || '',
    description: item?.description || '',
    unit: item?.unit || 'Cu.M',
    estimated_qty: item?.estimated_qty ? String(item.estimated_qty) : '',
    estimated_rate: item?.estimated_rate ? String(item.estimated_rate) : '',
    actual_qty: item?.actual_qty ? String(item.actual_qty) : '0',
    actual_rate: item?.actual_rate ? String(item.actual_rate) : '',
    schedule_code: item?.schedule_code || '',
    sor_reference: item?.sor_reference || '',
    material_cost_ratio: item?.material_cost_ratio ? String(item.material_cost_ratio) : '0.60',
    labor_cost_ratio: item?.labor_cost_ratio ? String(item.labor_cost_ratio) : '0.25',
    machinery_cost_ratio: item?.machinery_cost_ratio ? String(item.machinery_cost_ratio) : '0.10',
    overhead_ratio: item?.overhead_ratio ? String(item.overhead_ratio) : '0.05',
    location_station: item?.location_station || '',
    work_phase: item?.work_phase || '',
    specification_grade: item?.specification_grade || '',
    notes: item?.notes || '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Auto-fill rate from 2026 benchmarks when item description matches
  const suggestRate = () => {
    const desc = form.description.toLowerCase();
    const match = Object.entries(PK_CONSTRUCTION_MATERIAL_RATES_2026).find(
      ([name]) => desc.includes(name.toLowerCase().split(' ')[0])
    );
    if (match) {
      set('estimated_rate', String(match[1].rate));
      notify.compactSave(`Rate auto-filled: ${match[1].rate} / ${match[1].unit}`);
    }
  };

  const estimatedTotal = (parseFloat(form.estimated_qty) || 0) * (parseFloat(form.estimated_rate) || 0);

  const { business } = useBusiness();
  const businessId = business?.id;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!businessId) {
      notify.error('Business ID missing');
      return;
    }
    startTransition(async () => {
      const payload = {
        project_id: projectId,
        ...form,
        estimated_qty: parseFloat(form.estimated_qty) || 0,
        estimated_rate: parseFloat(form.estimated_rate) || 0,
        actual_qty: parseFloat(form.actual_qty) || 0,
        actual_rate: form.actual_rate ? parseFloat(form.actual_rate) : undefined,
        material_cost_ratio: parseFloat(form.material_cost_ratio) || 0.6,
        labor_cost_ratio: parseFloat(form.labor_cost_ratio) || 0.25,
        machinery_cost_ratio: parseFloat(form.machinery_cost_ratio) || 0.1,
        overhead_ratio: parseFloat(form.overhead_ratio) || 0.05,
      };
      const action = item ? updateBOQItemAction(businessId, item.id, payload) : addBOQItemAction(businessId, payload);
      const res = await action;
      if (res?.success) {
        notify.compactSave(item ? 'BOQ item updated' : 'BOQ item added');
        onSuccess?.();
        onClose();
      } else {
        notify.error(res?.error || 'Failed to save BOQ item');
      }
    });
  };

  const inp = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-blue-500" />
            {item ? 'Edit BOQ Item' : 'Add BOQ Line Item'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Item No. <span className="text-red-500">*</span></label>
              <input className={inp} value={form.item_no} onChange={(e) => set('item_no', e.target.value)}
                placeholder="BOQ-3.1" required />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Description <span className="text-red-500">*</span></label>
              <div className="flex gap-1">
                <input className={inp} value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Deformed Steel Rebar Grade 60" required />
                <button type="button" onClick={suggestRate}
                  className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-2 text-xs text-blue-600 hover:bg-blue-100 font-semibold"
                  title="Auto-fill rate from 2026 benchmarks">
                  Rate
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Unit</label>
              <select className={inp} value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                {COMMON_UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Est. Qty <span className="text-red-500">*</span></label>
              <input className={inp} type="number" min="0" step="0.001"
                value={form.estimated_qty} onChange={(e) => set('estimated_qty', e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>Est. Rate (PKR)</label>
              <input className={inp} type="number" min="0" step="0.01"
                value={form.estimated_rate} onChange={(e) => set('estimated_rate', e.target.value)} />
            </div>
          </div>

          {estimatedTotal > 0 && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              Estimated Total: {fmt(estimatedTotal)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Actual Qty (to date)</label>
              <input className={inp} type="number" min="0" step="0.001"
                value={form.actual_qty} onChange={(e) => set('actual_qty', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Actual Rate (if different)</label>
              <input className={inp} type="number" min="0" step="0.01"
                value={form.actual_rate} onChange={(e) => set('actual_rate', e.target.value)}
                placeholder="Leave blank to use est. rate" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Schedule Code (MRS/CSR)</label>
              <input className={inp} value={form.schedule_code}
                onChange={(e) => set('schedule_code', e.target.value)}
                placeholder="MRS-PUNJAB-14.2" />
            </div>
            <div>
              <label className={lbl}>SOR Reference Schedule</label>
              <select
                className={inp}
                value={form.sor_reference}
                onChange={(e) => set('sor_reference', e.target.value)}
              >
                <option value="">— Select Schedule of Rates —</option>
                {CONSTRUCTION_SOR_REFERENCES.map((sor) => (
                  <option key={sor.code} value={sor.code}>
                    {sor.label} ({sor.issuer})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cost ratio breakdown */}
          <div>
            <label className={cn(lbl, 'mb-2')}>Cost Component Ratios (must total ≤ 1.0)</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { k: 'material_cost_ratio', l: 'Material' },
                { k: 'labor_cost_ratio',    l: 'Labour' },
                { k: 'machinery_cost_ratio', l: 'Machinery' },
                { k: 'overhead_ratio',      l: 'Overhead' },
              ].map(({ k, l }) => (
                <div key={k}>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">{l}</label>
                  <input className={inp} type="number" min="0" max="1" step="0.01"
                    value={form[k]} onChange={(e) => set(k, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl}>Location / Station</label>
            <input className={inp} value={form.location_station}
              onChange={(e) => set('location_station', e.target.value)}
              placeholder="KM 14+200 to 18+100, Pier P-01 to P-04" />
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {item ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * @param {{ projectId: string, boqItems: any[], onRefresh: () => void }} props
 */
export function BOQItemsTable({ projectId, boqItems = [], onRefresh }) {
  const { business } = useBusiness();
  const currency = business?.settings?.financials?.currency || 'PKR';
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [variance, setVariance] = useState(null);
  const [showVariance, setShowVariance] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totals = useMemo(() => ({
    estimatedTotal: boqItems.reduce((s, i) => s + (Number(i.estimated_qty) * Number(i.estimated_rate)), 0),
    actualTotal: boqItems.reduce((s, i) => s + (Number(i.actual_qty) * Number(i.actual_rate || i.estimated_rate)), 0),
  }), [boqItems]);

  const overallVariancePct = totals.estimatedTotal > 0
    ? (((totals.actualTotal - totals.estimatedTotal) / totals.estimatedTotal) * 100).toFixed(1)
    : '0.0';

  const handleDelete = (item) => {
    if (!business?.id) return;
    if (!window.confirm(`Delete BOQ item "${item.item_no} — ${item.description}"?`)) return;
    startTransition(async () => {
      const res = await deleteBOQItemAction(business.id, item.id);
      if (res?.success) {
        notify.compactSave('BOQ item deleted');
        onRefresh?.();
      } else {
        notify.error(res?.error || 'Failed to delete');
      }
    });
  };

  const handleAnalyze = () => {
    if (!business?.id) return;
    startTransition(async () => {
      const res = await analyzeBOQVarianceAction(business.id, projectId);
      if (res?.success) {
        setVariance(res.analysis);
        setShowVariance(true);
      } else {
        notify.error('Variance analysis failed');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">BOQ Line Items</h3>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
            {boqItems.length} items
          </span>
        </div>
        <div className="flex items-center gap-2">
          {boqItems.length > 0 && (
            <>
              <button onClick={handleAnalyze} disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
                <TrendingUp className="h-3.5 w-3.5" />
                Variance Analysis
              </button>
              <button
                onClick={() => {
                  import('@/lib/pdf/constructionReportPdfManager').then(({ exportBOQEstimatePdf }) => {
                    exportBOQEstimatePdf({ boqItems, project: { code: projectId, name: 'BOQ Estimation Schedule' }, business });
                  });
                }}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                Export BOQ PDF
              </button>
            </>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {boqItems.length > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <div>
            <span className="text-xs text-gray-400 uppercase font-semibold">Estimated Total</span>
            <p className="font-bold tabular-nums text-gray-800">{fmt(totals.estimatedTotal, currency)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase font-semibold">Actual Total</span>
            <p className="font-bold tabular-nums text-gray-800">{fmt(totals.actualTotal, currency)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase font-semibold">Overall Variance</span>
            <p className={cn('font-bold tabular-nums', varianceColor(parseFloat(overallVariancePct)))}>
              {overallVariancePct}%
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {boqItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
          <Calculator className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No BOQ items yet</p>
          <p className="mt-1 text-xs text-gray-400">Add line items with MRS/CSR rates to start tracking costs</p>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Add Line Item
            </button>
            <button
              onClick={async () => {
                if (!businessId || !projectId) return;
                notify.compactSave('Pre-loading standard Pakistani BOQ items...');
                for (const cat of BOQ_ITEM_PRESETS || []) {
                  for (const preset of cat.items || []) {
                    await addBOQItemAction(businessId, {
                      project_id: projectId,
                      item_no: preset.schedule_code,
                      description: preset.description,
                      unit: preset.unit,
                      estimated_qty: 100,
                      estimated_rate: preset.estimatedRate,
                      schedule_code: preset.schedule_code,
                      sor_reference: preset.sor_reference,
                      material_cost_ratio: parseFloat(preset.material_cost_ratio),
                      labor_cost_ratio: parseFloat(preset.labor_cost_ratio),
                      machinery_cost_ratio: parseFloat(preset.machinery_cost_ratio),
                      overhead_ratio: parseFloat(preset.overhead_ratio),
                      work_phase: preset.work_phase,
                    });
                  }
                }
                onRefresh?.();
                notify.compactSave('Pre-loaded 20+ standard BOQ work items successfully');
              }}
              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Calculator className="h-4 w-4" /> Pre-load Standard BOQ
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Item No.', 'Description', 'Unit', 'Est. Qty', 'Est. Rate', 'Est. Total', 'Act. Qty', 'Variance', 'Schedule Code', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {boqItems.map((item) => {
                const estTotal = Number(item.estimated_qty) * Number(item.estimated_rate);
                const actTotal = Number(item.actual_qty) * Number(item.actual_rate || item.estimated_rate);
                const varPct = estTotal > 0 ? ((actTotal - estTotal) / estTotal) * 100 : 0;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 font-mono font-semibold text-gray-700">{item.item_no}</td>
                    <td className="px-3 py-2.5 max-w-[200px]">
                      <p className="truncate font-medium text-gray-800">{item.description}</p>
                      {item.location_station && (
                        <p className="truncate text-[10px] text-gray-400">{item.location_station}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">{item.unit}</td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-700">{Number(item.estimated_qty).toLocaleString()}</td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-700">{Number(item.estimated_rate).toLocaleString()}</td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold text-gray-800">{fmt(estTotal, currency)}</td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-600">{Number(item.actual_qty).toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      {Number(item.actual_qty) > 0 ? (
                        <VarianceBadge pct={varPct} />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-gray-400">{item.schedule_code || '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditItem(item)}
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item)}
                          className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Variance Analysis Panel */}
      {showVariance && variance && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-indigo-900">BOQ Variance Analysis</h4>
            <button onClick={() => setShowVariance(false)}
              className="text-indigo-400 hover:text-indigo-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { l: 'Total Estimated', v: fmt(variance.summary.totalEstimated, currency), c: 'text-gray-700' },
              { l: 'Total Actual', v: fmt(variance.summary.totalActual, currency), c: 'text-gray-700' },
              { l: 'Overall Variance', v: `${variance.summary.overallVariancePct}%`, c: varianceColor(variance.summary.overallVariancePct) },
              { l: 'Over Budget', v: variance.summary.overBudgetLines, c: 'text-red-600 font-bold' },
              { l: 'Under Budget', v: variance.summary.underBudgetLines, c: 'text-green-600 font-bold' },
              { l: 'On Track', v: variance.summary.onTrackLines, c: 'text-gray-600' },
            ].map(({ l, v, c }) => (
              <div key={l} className="rounded-lg border border-indigo-100 bg-white px-3 py-2 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">{l}</p>
                <p className={cn('text-sm font-bold tabular-nums', c)}>{v}</p>
              </div>
            ))}
          </div>
          {variance.lines.filter((l) => l.status !== 'ON_TRACK').map((line) => (
            <div key={line.id} className={cn(
              'flex items-center justify-between rounded-lg border px-3 py-2 text-xs mb-1.5',
              line.status === 'OVER_BUDGET' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            )}>
              <div className="flex items-center gap-2">
                {line.status === 'OVER_BUDGET'
                  ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  : <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                <span className="font-medium text-gray-700">{line.description}</span>
              </div>
              <span className={cn('font-bold tabular-nums', line.status === 'OVER_BUDGET' ? 'text-red-600' : 'text-green-600')}>
                {line.variancePct > 0 ? '+' : ''}{line.variancePct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <BOQFormModal projectId={projectId} onClose={() => setShowAdd(false)} onSuccess={onRefresh} />
      )}
      {editItem && (
        <BOQFormModal item={editItem} projectId={projectId}
          onClose={() => setEditItem(null)} onSuccess={() => { setEditItem(null); onRefresh?.(); }} />
      )}
    </div>
  );
}

export default BOQItemsTable;
