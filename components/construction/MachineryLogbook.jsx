'use client';

/**
 * Machinery Logbook Component
 * Daily equipment operation logs with fuel tracking, productivity analysis, and fleet overview.
 * Uses existing constructionIntelligence.analyzeEquipmentProductivity helper.
 */

import { useState, useTransition, useMemo } from 'react';
import {
  Truck, Plus, Fuel, Clock, TrendingUp, BarChart2,
  Edit2, Trash2, X, Wrench, AlertTriangle, CheckCircle,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import {
  logMachineryOperationAction,
  getMachineryLogsAction,
  getMachineryFleetSummaryAction,
  deleteMachineryLogAction,
} from '@/lib/actions/construction/machinery';
import { analyzeEquipmentProductivity } from '@/lib/construction/constructionIntelligence';
import notify from '@/lib/utils/appToast';

// ── Common Equipment Types ────────────────────────────────────────────────────

const EQUIPMENT_TYPES = [
  'Excavator (CAT 320 / Komatsu PC200)',
  'Motor Grader (CAT 140K)',
  'Vibratory Roller (10-12 Ton)',
  'Asphalt Paver (Vögele / Dynapac)',
  'Transit Mixer Truck',
  'Tipper / Dumper Truck',
  'Water Bowser',
  'Tower Crane',
  'Mobile Crane (50T)',
  'Concrete Pump Boom',
  'Bulldozer (CAT D6)',
  'Backhoe Loader (JCB 3CX)',
  'Compactor (Plate / Rammer)',
  'Generator Set (500 KVA)',
  'Air Compressor',
];

const OPERATION_TYPES = [
  'Earthwork Excavation',
  'Asphalt Laying',
  'Concrete Casting',
  'Compaction',
  'Material Transport',
  'Crane Lifting',
  'Maintenance',
  'Standby / Idle',
  'Testing',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n, dec = 1) {
  return Number(n || 0).toFixed(dec);
}

function fmtPKR(n) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `PKR ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `PKR ${(v / 1_000).toFixed(1)}K`;
  return `PKR ${v.toLocaleString()}`;
}

// ── Log Form Modal ────────────────────────────────────────────────────────────

function LogFormModal({ projectId, onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    log_date: new Date().toISOString().slice(0, 10),
    equipment_type: EQUIPMENT_TYPES[0],
    equipment_id: '',
    operator_name: '',
    operation_type: OPERATION_TYPES[0],
    hours_worked: '',
    fuel_consumed_litres: '',
    output_qty: '',
    output_unit: 'Cu.M',
    start_hour_meter: '',
    end_hour_meter: '',
    is_rented: false,
    rental_rate_per_hour: '',
    maintenance_flag: false,
    maintenance_note: '',
    notes: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Live productivity preview
  const productivity = useMemo(() => {
    const hours = parseFloat(form.hours_worked);
    const fuel = parseFloat(form.fuel_consumed_litres);
    const output = parseFloat(form.output_qty);
    if (!hours || !fuel) return null;
    return analyzeEquipmentProductivity({
      equipmentType: form.equipment_type,
      hoursLogged: hours,
      fuelConsumedLitres: fuel,
      outputQty: output || 0,
      outputUnit: form.output_unit,
    });
  }, [form.hours_worked, form.fuel_consumed_litres, form.output_qty, form.output_unit, form.equipment_type]);

  const { business } = useBusiness();
  const businessId = business?.id;

  const handleSubmit = () => {
    if (!form.hours_worked || !form.fuel_consumed_litres) {
      notify.error('Hours worked and fuel consumed are required');
      return;
    }
    if (!businessId) {
      notify.error('Business ID missing');
      return;
    }
    startTransition(async () => {
      const startHrs = form.start_hour_meter ? parseFloat(form.start_hour_meter) : 0;
      const hoursWorked = parseFloat(form.hours_worked) || 8;
      const endHrs = form.end_hour_meter ? parseFloat(form.end_hour_meter) : startHrs + hoursWorked;

      const res = await logMachineryOperationAction(businessId, {
        project_id: projectId,
        ...form,
        machinery_code: form.equipment_id ? form.equipment_id.trim() : `EQ-${Date.now().toString().slice(-4)}`,
        machinery_name: form.equipment_type || 'Excavator (CAT 320)',
        equipment_type: form.equipment_type || 'Excavator (CAT 320)',
        operator_name: form.operator_name ? form.operator_name.trim() : 'Site Operator',
        start_hours: startHrs,
        end_hours: Math.max(endHrs, startHrs),
        hours_worked: hoursWorked,
        fuel_litres: parseFloat(form.fuel_consumed_litres) || 0,
        fuel_consumed_litres: parseFloat(form.fuel_consumed_litres) || 0,
        output_qty: parseFloat(form.output_qty) || 0,
        rental_rate_per_hour: form.rental_rate_per_hour ? parseFloat(form.rental_rate_per_hour) : undefined,
      });
      if (res?.success) {
        notify.compactSave('Machinery log recorded');
        onSuccess?.();
        onClose();
      } else {
        notify.error(res?.error || 'Failed to log');
      }
    });
  };

  const inp = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 border border-purple-100">
              <Truck className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Log Daily Machinery Operation</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Form */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Log Date</label>
                <input className={inp} type="date" value={form.log_date} onChange={e => set('log_date', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Equipment ID / Fleet No.</label>
                <input className={inp} value={form.equipment_id} onChange={e => set('equipment_id', e.target.value)} placeholder="e.g. EQ-001" />
              </div>
            </div>

            <div>
              <label className={lbl}>Equipment Type</label>
              <select className={inp} value={form.equipment_type} onChange={e => set('equipment_type', e.target.value)}>
                {EQUIPMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Operation Type</label>
                <select className={inp} value={form.operation_type} onChange={e => set('operation_type', e.target.value)}>
                  {OPERATION_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Operator Name</label>
                <input className={inp} value={form.operator_name} onChange={e => set('operator_name', e.target.value)} placeholder="e.g. Muhammad Usman" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Hours Worked <span className="text-red-500">*</span></label>
                <input className={inp} type="number" min="0" step="0.5" value={form.hours_worked} onChange={e => set('hours_worked', e.target.value)} placeholder="8.0" />
              </div>
              <div>
                <label className={lbl}>Fuel Consumed (Litres) <span className="text-red-500">*</span></label>
                <input className={inp} type="number" min="0" step="1" value={form.fuel_consumed_litres} onChange={e => set('fuel_consumed_litres', e.target.value)} placeholder="120" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={lbl}>Output Quantity</label>
                <input className={inp} type="number" min="0" step="0.01" value={form.output_qty} onChange={e => set('output_qty', e.target.value)} placeholder="e.g. 450 (cubic metres)" />
              </div>
              <div>
                <label className={lbl}>Unit</label>
                <select className={inp} value={form.output_unit} onChange={e => set('output_unit', e.target.value)}>
                  {['Cu.M', 'Ton', 'Sq.M', 'R.Ft', 'Trip', 'Job'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Start Hour Meter</label>
                <input className={inp} type="number" min="0" value={form.start_hour_meter} onChange={e => set('start_hour_meter', e.target.value)} placeholder="e.g. 4250" />
              </div>
              <div>
                <label className={lbl}>End Hour Meter</label>
                <input className={inp} type="number" min="0" value={form.end_hour_meter} onChange={e => set('end_hour_meter', e.target.value)} placeholder="e.g. 4258" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-purple-600" checked={form.is_rented} onChange={e => set('is_rented', e.target.checked)} />
                <span className="text-xs font-semibold text-gray-600">Rented Equipment</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-red-500" checked={form.maintenance_flag} onChange={e => set('maintenance_flag', e.target.checked)} />
                <span className="text-xs font-semibold text-gray-600">Maintenance Required</span>
              </label>
            </div>

            {form.is_rented && (
              <div>
                <label className={lbl}>Rental Rate (PKR/Hour)</label>
                <input className={inp} type="number" min="0" value={form.rental_rate_per_hour} onChange={e => set('rental_rate_per_hour', e.target.value)} placeholder="e.g. 14000" />
              </div>
            )}

            {form.maintenance_flag && (
              <div>
                <label className={lbl}>Maintenance Note</label>
                <input className={inp} value={form.maintenance_note} onChange={e => set('maintenance_note', e.target.value)} placeholder="Describe issue requiring maintenance" />
              </div>
            )}

            <div>
              <label className={lbl}>Notes</label>
              <textarea className={cn(inp, 'resize-none')} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>

          {/* Right: Live productivity */}
          <div className="w-60 flex-shrink-0 border-l border-gray-100 bg-gray-50/70 p-5 overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Productivity
            </p>
            {productivity ? (
              <div className="space-y-3">
                {[
                  { l: 'Fuel / Hour', v: `${productivity.fuelPerHour} L/hr` },
                  { l: 'Output / Hour', v: `${productivity.outputPerHour} ${form.output_unit}/hr` },
                  { l: 'Fuel Cost', v: fmtPKR(productivity.fuelCostTotal) },
                  { l: 'Cost / Output', v: parseFloat(form.output_qty) > 0 ? fmtPKR(productivity.fuelCostPerOutput) : '—' },
                ].map(({ l, v }) => (
                  <div key={l} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">{l}</p>
                    <p className="text-sm font-bold text-gray-800 tabular-nums mt-0.5">{v}</p>
                  </div>
                ))}
                {form.is_rented && form.rental_rate_per_hour && form.hours_worked && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <p className="text-[10px] text-amber-600 uppercase font-semibold">Rental Cost</p>
                    <p className="text-sm font-bold text-amber-700 tabular-nums mt-0.5">
                      {fmtPKR(parseFloat(form.rental_rate_per_hour) * parseFloat(form.hours_worked))}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Fuel className="h-7 w-7 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">Enter hours and fuel to see live productivity</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-6 py-4 flex-shrink-0">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50">
            {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Record Log
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fleet Summary Cards ───────────────────────────────────────────────────────

function FleetSummaryCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const prod = analyzeEquipmentProductivity({
    equipmentType: item.equipment_type,
    hoursLogged: item.total_hours || 0,
    fuelConsumedLitres: item.total_fuel || 0,
    outputQty: item.total_output || 0,
    outputUnit: item.output_unit || 'Cu.M',
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 border border-purple-100">
            <Truck className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{item.equipment_type}</p>
            <p className="text-[11px] text-gray-400">{item.log_count} log entries</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1 rounded-lg hover:bg-gray-100">
          <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Hours</p>
          <p className="text-sm font-bold tabular-nums text-gray-800">{fmtNum(item.total_hours)}h</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Fuel</p>
          <p className="text-sm font-bold tabular-nums text-gray-800">{fmtNum(item.total_fuel, 0)}L</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">L/hr</p>
          <p className="text-sm font-bold tabular-nums text-purple-700">{fmtNum(prod.fuelPerHour)}</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3 space-y-1.5 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Output / hour</span>
            <span className="font-semibold">{fmtNum(prod.outputPerHour)} {item.output_unit}/hr</span>
          </div>
          <div className="flex justify-between">
            <span>Fuel cost (est.)</span>
            <span className="font-semibold">{fmtPKR(prod.fuelCostTotal)}</span>
          </div>
          {item.maintenance_count > 0 && (
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <AlertTriangle className="h-3 w-3" />
              {item.maintenance_count} maintenance flag{item.maintenance_count > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * @param {{ projectId: string, logs: any[], fleetSummary: any[], onRefresh: () => void }} props
 */
export function MachineryLogbook({ projectId, logs = [], fleetSummary = [], onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState('logbook'); // 'logbook' | 'fleet'
  const [isPending, startTransition] = useTransition();

  const monthlyTotals = useMemo(() => ({
    hours: logs.reduce((s, l) => s + Number(l.hours_worked || 0), 0),
    fuel:  logs.reduce((s, l) => s + Number(l.fuel_consumed_litres || 0), 0),
    fuelCost: logs.reduce((s, l) => s + (Number(l.fuel_consumed_litres || 0) * 310), 0),
    maintenanceFlags: logs.filter(l => l.maintenance_flag).length,
  }), [logs]);

  const handleDelete = (log) => {
    if (!business?.id) return;
    if (!window.confirm('Delete this log entry?')) return;
    startTransition(async () => {
      const res = await deleteMachineryLogAction(business.id, log.id);
      if (res?.success) { notify.compactSave('Log deleted'); onRefresh?.(); }
      else notify.error(res?.error || 'Failed to delete');
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {[
            { id: 'logbook', label: 'Daily Logbook' },
            { id: 'fleet',   label: 'Fleet Overview' },
          ].map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                view === t.id ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
              )}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 shadow-sm">
          <Plus className="h-3.5 w-3.5" /> Log Equipment
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'Total Hours', v: `${fmtNum(monthlyTotals.hours, 0)} hrs`, icon: Clock, c: 'text-purple-600 bg-purple-50 border-purple-100' },
          { l: 'Total Fuel', v: `${fmtNum(monthlyTotals.fuel, 0)} L`, icon: Fuel, c: 'text-blue-600 bg-blue-50 border-blue-100' },
          { l: 'Fuel Cost (Est.)', v: fmtPKR(monthlyTotals.fuelCost), icon: BarChart2, c: 'text-amber-600 bg-amber-50 border-amber-100' },
          { l: 'Maintenance Flags', v: String(monthlyTotals.maintenanceFlags), icon: Wrench, c: monthlyTotals.maintenanceFlags > 0 ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-100' },
        ].map(({ l, v, icon: Icon, c }) => (
          <div key={l} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg border text-xs', c)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{l}</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-gray-900">{v}</p>
          </div>
        ))}
      </div>

      {/* View: Fleet */}
      {view === 'fleet' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fleetSummary.length === 0 ? (
            <div className="col-span-full flex flex-col items-center py-12 text-center rounded-2xl border-2 border-dashed border-gray-200">
              <Truck className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No fleet data yet. Start logging equipment operations.</p>
            </div>
          ) : fleetSummary.map((item, i) => (
            <FleetSummaryCard key={item.equipment_type + i} item={item} />
          ))}
        </div>
      )}

      {/* View: Logbook */}
      {view === 'logbook' && (
        logs.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center rounded-2xl border-2 border-dashed border-gray-200">
            <Truck className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-500">No logs yet</p>
            <p className="mt-1 text-xs text-gray-400">Start logging daily equipment operations</p>
            <button onClick={() => setShowAdd(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
              <Plus className="h-4 w-4" /> Log Equipment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50">
                  {['Date', 'Equipment', 'Operator', 'Operation', 'Hours', 'Fuel (L)', 'Output', 'L/Hr', 'Maint.', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => {
                  const fph = Number(log.hours_worked) > 0
                    ? (Number(log.fuel_consumed_litres) / Number(log.hours_worked)).toFixed(1) : '—';
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-gray-600">{log.log_date?.slice(0, 10)}</td>
                      <td className="px-3 py-2.5 max-w-[160px]">
                        <p className="truncate font-medium text-gray-800">{log.equipment_type}</p>
                        {log.equipment_id && <p className="text-[10px] text-gray-400 font-mono">{log.equipment_id}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{log.operator_name || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-600">{log.operation_type}</td>
                      <td className="px-3 py-2.5 tabular-nums font-semibold text-purple-700">{fmtNum(log.hours_worked)}</td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-700">{fmtNum(log.fuel_consumed_litres, 0)}</td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-600">{Number(log.output_qty) > 0 ? `${fmtNum(log.output_qty)} ${log.output_unit}` : '—'}</td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-500">{fph}</td>
                      <td className="px-3 py-2.5">
                        {log.maintenance_flag ? (
                          <span className="flex items-center gap-0.5 text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-[10px] font-semibold">Req.</span>
                          </span>
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => handleDelete(log)}
                          className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {showAdd && (
        <LogFormModal projectId={projectId} onClose={() => setShowAdd(false)} onSuccess={onRefresh} />
      )}
    </div>
  );
}

export default MachineryLogbook;
