'use client';

/**
 * Subcontractors Hub
 * Work orders, running account, retainage ledger, DLP management.
 */

import { useState, useTransition, useMemo } from 'react';
import {
  Users, Plus, X, FileText, Lock, Unlock, CreditCard,
  CheckCircle2, AlertTriangle, Clock, Building2, ChevronDown,
  Shield, BadgeCheck, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import {
  createSubcontractorWorkOrderAction,
  certifySubcontractorWorkAction,
  releaseSubcontractorRetainageAction,
  updateSubcontractorWorkOrderStatusAction,
} from '@/lib/actions/construction/subcontractor';
import notify from '@/lib/utils/appToast';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPKR(n, currency = 'PKR') {
  const v = Number(n || 0);
  if (v >= 1_000_000_000) return `${currency} ${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${currency} ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${currency} ${(v / 1_000).toFixed(1)}K`;
  return `${currency} ${v.toLocaleString()}`;
}

function pct(a, b) {
  if (!b || !a) return '0.0';
  return Math.min(100, (Number(a) / Number(b)) * 100).toFixed(1);
}

// ── Status Config ─────────────────────────────────────────────────────────────

const WO_STATUS = {
  ACTIVE:    { label: 'Active',    color: 'text-green-700 bg-green-50  border-green-200' },
  COMPLETED: { label: 'Completed', color: 'text-blue-700  bg-blue-50   border-blue-200' },
  SUSPENDED: { label: 'Suspended', color: 'text-amber-700 bg-amber-50  border-amber-200' },
  TERMINATED:{ label: 'Terminated',color: 'text-red-700   bg-red-50    border-red-200' },
};

const DLP_STATUS = {
  IN_PROGRESS: { label: 'In Progress', icon: Clock },
  DLP_ACTIVE:  { label: 'DLP Active',  icon: Lock },
  RELEASED:    { label: 'Released',    icon: Unlock },
};

// ── Create Work Order Modal ───────────────────────────────────────────────────

function WorkOrderFormModal({ projectId, onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    work_order_no: '', work_order_date: new Date().toISOString().slice(0, 10),
    subcontractor_name: '', subcontractor_category: 'C-3',
    pec_license_no: '', specialization_code: '',
    work_order_value: '', retainage_pct: '10',
    scope_of_work: '', start_date: '', completion_date: '',
    dlp_months: '12', notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { business } = useBusiness();
  const businessId = business?.id;

  const handleSubmit = () => {
    if (!form.work_order_no || !form.subcontractor_name || !form.work_order_value || !form.scope_of_work) {
      notify.error('Please fill required fields');
      return;
    }
    if (!businessId) {
      notify.error('Business ID missing');
      return;
    }
    startTransition(async () => {
      const res = await createSubcontractorWorkOrderAction(businessId, {
        project_id: projectId,
        ...form,
        work_order_value: parseFloat(form.work_order_value),
        retainage_pct: parseFloat(form.retainage_pct),
        dlp_months: parseInt(form.dlp_months),
      });
      if (res?.success) { notify.compactSave('Work order created'); onSuccess?.(); onClose(); }
      else notify.error(res?.error || 'Failed to create');
    });
  };

  const inp = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1.5';
  const CATEGORIES = ['C-1','C-2','C-3','C-4','C-5','C-6','Labour','Specialist'];
  const SPEC_CODES = ['CE01 - Roads & Highways','CE02 - Bridges','CE04 - Irrigation','CE09 - Sewerage','BC01 - Building','EE01 - Electrical','ME01 - HVAC'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" /> New Subcontractor Work Order
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Work Order No. <span className="text-red-500">*</span></label>
              <input className={inp} value={form.work_order_no} onChange={e => set('work_order_no', e.target.value)} placeholder="WO-001" /></div>
            <div><label className={lbl}>Date</label>
              <input className={inp} type="date" value={form.work_order_date} onChange={e => set('work_order_date', e.target.value)} /></div>
          </div>
          <div><label className={lbl}>Subcontractor Name <span className="text-red-500">*</span></label>
            <input className={inp} value={form.subcontractor_name} onChange={e => set('subcontractor_name', e.target.value)} placeholder="e.g. Ali Steel Fixers & Co." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>PEC Category</label>
              <select className={inp} value={form.subcontractor_category} onChange={e => set('subcontractor_category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select></div>
            <div><label className={lbl}>Specialization Code</label>
              <select className={inp} value={form.specialization_code} onChange={e => set('specialization_code', e.target.value)}>
                <option value="">— Select —</option>
                {SPEC_CODES.map(s => <option key={s} value={s.split(' - ')[0]}>{s}</option>)}
              </select></div>
          </div>
          <div><label className={lbl}>PEC License No.</label>
            <input className={inp} value={form.pec_license_no} onChange={e => set('pec_license_no', e.target.value)} placeholder="PEC/CE/123456" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Work Order Value (PKR) <span className="text-red-500">*</span></label>
              <input className={inp} type="number" min="0" value={form.work_order_value} onChange={e => set('work_order_value', e.target.value)} /></div>
            <div><label className={lbl}>Retainage %</label>
              <input className={inp} type="number" min="0" max="20" step="0.5" value={form.retainage_pct} onChange={e => set('retainage_pct', e.target.value)} /></div>
          </div>
          <div><label className={lbl}>Scope of Work <span className="text-red-500">*</span></label>
            <textarea className={cn(inp, 'resize-none')} rows={2} value={form.scope_of_work} onChange={e => set('scope_of_work', e.target.value)} placeholder="Describe the scope of subcontracted work" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={lbl}>Start Date</label>
              <input className={inp} type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
            <div><label className={lbl}>Completion Date</label>
              <input className={inp} type="date" value={form.completion_date} onChange={e => set('completion_date', e.target.value)} /></div>
            <div><label className={lbl}>DLP Months</label>
              <input className={inp} type="number" min="0" max="36" value={form.dlp_months} onChange={e => set('dlp_months', e.target.value)} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Create Work Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Certify Payment Modal ─────────────────────────────────────────────────────

function CertifyModal({ workOrder, currency, onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');
  const [ref, setRef] = useState('');

  const retainageBalance = Number(workOrder.retainage_deducted) - Number(workOrder.amount_released);
  const thisRetainage = amount ? parseFloat(amount) * (Number(workOrder.retainage_pct) / 100) : 0;
  const netPayable = amount ? parseFloat(amount) - thisRetainage : 0;

  const { business } = useBusiness();
  const businessId = business?.id;

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) { notify.error('Enter amount to certify'); return; }
    if (!businessId) { notify.error('Business ID missing'); return; }
    startTransition(async () => {
      const res = await certifySubcontractorWorkAction(businessId, workOrder.id, {
        amount_to_certify: parseFloat(amount),
        payment_reference: ref,
      });
      if (res?.success) { notify.compactSave('Work certified'); onSuccess?.(); onClose(); }
      else notify.error(res?.error || 'Failed to certify');
    });
  };

  const inp = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-green-500" /> Certify Work Payment
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs space-y-1">
            <p className="font-semibold text-gray-700">{workOrder.subcontractor_name}</p>
            <p className="text-gray-500">WO Value: {fmtPKR(workOrder.work_order_value, currency)}</p>
            <p className="text-gray-500">Certified to date: {fmtPKR(workOrder.amount_certified, currency)}</p>
            <p className="text-gray-500">Retainage rate: {workOrder.retainage_pct}%</p>
          </div>
          <div><label className={lbl}>Amount to Certify (PKR)</label>
            <input className={inp} type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter gross certified amount" autoFocus /></div>
          <div><label className={lbl}>Payment Reference</label>
            <input className={inp} value={ref} onChange={e => setRef(e.target.value)} placeholder="Cheque/transfer reference" /></div>
          {amount && parseFloat(amount) > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Gross certified</span><span className="font-semibold">{fmtPKR(parseFloat(amount), currency)}</span></div>
              <div className="flex justify-between"><span className="text-red-500">− Retainage {workOrder.retainage_pct}%</span><span className="font-semibold text-red-600">−{fmtPKR(thisRetainage, currency)}</span></div>
              <div className="flex justify-between border-t border-green-200 pt-1 mt-1"><span className="font-semibold text-green-700">Net Payable</span><span className="font-bold text-green-700">{fmtPKR(netPayable, currency)}</span></div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
            {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Certify
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Work Order Card ───────────────────────────────────────────────────────────

function WorkOrderCard({ wo, currency, onCertify, onRelease, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = WO_STATUS[wo.status] || WO_STATUS.ACTIVE;
  const dlpCfg = DLP_STATUS[wo.dlp_status] || DLP_STATUS.IN_PROGRESS;
  const DlpIcon = dlpCfg.icon;
  const completionPct = pct(wo.amount_certified, wo.work_order_value);
  const retainageBalance = Math.max(0, Number(wo.retainage_deducted) - Number(wo.amount_released));

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{wo.subcontractor_name}</p>
            <p className="text-[11px] text-gray-400 font-mono">{wo.work_order_no}</p>
            {wo.pec_license_no && (
              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                <BadgeCheck className="h-3 w-3" /> PEC: {wo.pec_license_no}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold', statusCfg.color)}>
            {statusCfg.label}
          </span>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-4 gap-0 border-t border-gray-100">
        {[
          { l: 'WO Value', v: fmtPKR(wo.work_order_value, currency), c: 'text-gray-700' },
          { l: 'Certified', v: fmtPKR(wo.amount_certified, currency), c: 'text-blue-700' },
          { l: 'Retainage', v: fmtPKR(wo.retainage_deducted, currency), c: 'text-amber-700' },
          { l: 'Net Paid', v: fmtPKR(wo.net_paid, currency), c: 'text-green-700' },
        ].map(({ l, v, c }, i) => (
          <div key={l} className={cn('px-3 py-2.5 text-center', i < 3 && 'border-r border-gray-100')}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{l}</p>
            <p className={cn('text-xs font-bold tabular-nums mt-0.5', c)}>{v}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 border-t border-gray-50">
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
          <span>Completion</span>
          <span className="font-bold tabular-nums text-gray-600">{completionPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      {/* Expanded detail + actions */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/50">
          <p className="text-xs text-gray-600">{wo.scope_of_work}</p>

          <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <DlpIcon className="h-3 w-3" />
              DLP: {dlpCfg.label}
              {wo.dlp_months > 0 && ` (${wo.dlp_months} months)`}
            </span>
            {wo.subcontractor_category && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold">
                PEC {wo.subcontractor_category}
              </span>
            )}
          </div>

          {/* Retainage ledger line */}
          {Number(wo.retainage_deducted) > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-amber-700">Retainage Balance</p>
                <p className="text-sm font-bold tabular-nums text-amber-800">{fmtPKR(retainageBalance, currency)}</p>
              </div>
              {retainageBalance > 0 && wo.status !== 'TERMINATED' && (
                <button onClick={() => onRelease(wo)}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50">
                  <Unlock className="h-3.5 w-3.5" /> Release
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {wo.status === 'ACTIVE' && (
              <button onClick={() => onCertify(wo)}
                className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                <CreditCard className="h-3.5 w-3.5" /> Certify Work
              </button>
            )}
            {wo.status === 'ACTIVE' && (
              <button onClick={() => onStatusChange(wo, 'COMPLETED')}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100">
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * @param {{ projectId: string, workOrders: any[], onRefresh: () => void }} props
 */
export function SubcontractorsHub({ projectId, workOrders = [], onRefresh }) {
  const { business } = useBusiness();
  const currency = business?.settings?.financials?.currency || 'PKR';
  const [view, setView] = useState('active'); // 'active' | 'retainage'
  const [showCreate, setShowCreate] = useState(false);
  const [certifyWO, setCertifyWO] = useState(null);
  const [releaseWO, setReleaseWO] = useState(null);
  const [releaseAmount, setReleaseAmount] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (view === 'retainage') return workOrders.filter(wo => Number(wo.retainage_deducted) > 0);
    return workOrders.filter(wo => wo.status === 'ACTIVE');
  }, [workOrders, view]);

  const totals = useMemo(() => ({
    totalWOValue: workOrders.reduce((s, wo) => s + Number(wo.work_order_value), 0),
    totalCertified: workOrders.reduce((s, wo) => s + Number(wo.amount_certified), 0),
    totalRetentionHeld: workOrders.reduce((s, wo) => s + Math.max(0, Number(wo.retainage_deducted) - Number(wo.amount_released)), 0),
    totalNetPaid: workOrders.reduce((s, wo) => s + Number(wo.net_paid), 0),
  }), [workOrders]);

  const handleStatusChange = (wo, status) => {
    if (!business?.id) return;
    startTransition(async () => {
      const res = await updateSubcontractorWorkOrderStatusAction(business.id, wo.id, status);
      if (res?.success) { notify.compactSave(`Work order ${status.toLowerCase()}`); onRefresh?.(); }
      else notify.error(res?.error || 'Status update failed');
    });
  };

  const handleRelease = () => {
    if (!releaseWO || !releaseAmount || parseFloat(releaseAmount) <= 0) {
      notify.error('Enter release amount');
      return;
    }
    if (!business?.id) return;
    startTransition(async () => {
      const res = await releaseSubcontractorRetainageAction(business.id, releaseWO.id, parseFloat(releaseAmount));
      if (res?.success) { notify.compactSave('Retainage released'); setReleaseWO(null); setReleaseAmount(''); onRefresh?.(); }
      else notify.error(res?.error || 'Release failed');
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {[
            { id: 'active',    label: `Active (${workOrders.filter(w => w.status === 'ACTIVE').length})` },
            { id: 'retainage', label: `Retainage Ledger (${workOrders.filter(w => Number(w.retainage_deducted) > 0).length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                view === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
              )}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm">
          <Plus className="h-3.5 w-3.5" /> New Work Order
        </button>
      </div>

      {/* Totals strip */}
      {workOrders.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: 'Total WO Value', v: fmtPKR(totals.totalWOValue, currency), c: 'text-gray-700' },
            { l: 'Total Certified', v: fmtPKR(totals.totalCertified, currency), c: 'text-blue-700' },
            { l: 'Retention Held', v: fmtPKR(totals.totalRetentionHeld, currency), c: 'text-amber-700' },
            { l: 'Total Net Paid', v: fmtPKR(totals.totalNetPaid, currency), c: 'text-green-700' },
          ].map(({ l, v, c }) => (
            <div key={l} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{l}</p>
              <p className={cn('text-sm font-bold tabular-nums mt-1', c)}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Work orders list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center rounded-2xl border-2 border-dashed border-gray-200">
          <Users className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            {view === 'retainage' ? 'No retainage entries yet' : 'No active work orders'}
          </p>
          {view === 'active' && (
            <button onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Create Work Order
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map(wo => (
            <WorkOrderCard
              key={wo.id}
              wo={wo}
              currency={currency}
              onCertify={wo => setCertifyWO(wo)}
              onRelease={wo => setReleaseWO(wo)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <WorkOrderFormModal projectId={projectId} onClose={() => setShowCreate(false)} onSuccess={onRefresh} />
      )}
      {certifyWO && (
        <CertifyModal workOrder={certifyWO} currency={currency} onClose={() => setCertifyWO(null)} onSuccess={onRefresh} />
      )}
      {releaseWO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border bg-white shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Unlock className="h-4 w-4 text-amber-500" /> Release Retainage
            </h3>
            <p className="text-xs text-gray-500">
              Retainage balance for <span className="font-semibold">{releaseWO.subcontractor_name}</span>:
              {' '}<span className="font-bold text-amber-700">{fmtPKR(Math.max(0, Number(releaseWO.retainage_deducted) - Number(releaseWO.amount_released)), currency)}</span>
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Release Amount (PKR)</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                type="number" min="0" value={releaseAmount}
                onChange={e => setReleaseAmount(e.target.value)}
                placeholder="Enter amount to release" autoFocus />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setReleaseWO(null); setReleaseAmount(''); }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleRelease} disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
                {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubcontractorsHub;
