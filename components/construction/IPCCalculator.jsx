'use client';

/**
 * IPC Calculator + Timeline
 * Live interim payment certificate calculation with full deduction breakdown.
 * Includes IPC history timeline with status management + print to PDF.
 */

import { useState, useTransition, useEffect } from 'react';
import {
  Receipt, Calculator, CheckCircle2, Clock, AlertCircle,
  Unlock, DollarSign, FileText, ChevronDown, ChevronUp,
  ArrowRight, X, Plus, CheckCheck, Banknote, Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { recordIPCAction, updateIPCStatusAction } from '@/lib/actions/construction/ipc';
import { computeIPCRunningBill } from '@/lib/construction/constructionIntelligence';
import notify from '@/lib/utils/appToast';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n, currency = 'PKR') {
  const v = Number(n || 0);
  if (!v) return `${currency} 0`;
  if (v >= 1_000_000_000) return `${currency} ${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${currency} ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${currency} ${(v / 1_000).toFixed(1)}K`;
  return `${currency} ${v.toLocaleString()}`;
}

// ── IPC Status Config ─────────────────────────────────────────────────────────

const IPC_STATUS = {
  SUBMITTED: { label: 'Submitted', color: 'text-blue-600  bg-blue-50  border-blue-200',  icon: FileText,    next: 'VERIFIED' },
  VERIFIED:  { label: 'Verified',  color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: CheckCircle2, next: 'APPROVED' },
  APPROVED:  { label: 'Approved',  color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCheck,   next: 'DISBURSED' },
  DISBURSED: { label: 'Disbursed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Banknote, next: null },
  REJECTED:  { label: 'Rejected',  color: 'text-red-600   bg-red-50   border-red-200',   icon: X,           next: null },
};

function StatusBadge({ status }) {
  const cfg = IPC_STATUS[status] || IPC_STATUS.SUBMITTED;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', cfg.color)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Calculation Breakdown Row ─────────────────────────────────────────────────

function CalcRow({ label, value, currency, indent = false, bold = false, highlight, negative }) {
  return (
    <div className={cn(
      'flex items-center justify-between py-2 text-sm border-b border-gray-50 last:border-0',
      indent && 'pl-4',
    )}>
      <span className={cn('text-gray-500', bold && 'font-semibold text-gray-700', highlight && 'text-green-700 font-semibold')}>
        {label}
      </span>
      <span className={cn(
        'font-semibold tabular-nums',
        bold ? 'text-gray-900 text-base' : 'text-gray-700',
        negative ? 'text-red-600' : highlight ? 'text-green-700' : '',
      )}>
        {negative ? '− ' : ''}{fmt(Math.abs(Number(value || 0)), currency)}
      </span>
    </div>
  );
}

// ── IPC Calculator Form ───────────────────────────────────────────────────────

function IPCCalcForm({ project, onSave, onClose }) {
  const { business } = useBusiness();
  const currency = business?.settings?.financials?.currency || 'PKR';
  // Instant client-side calculation preview
  const calc = useMemo(() => {
    const gross = parseFloat(form.gross_certified_amount);
    if (!gross || !project) return null;
    return computeIPCRunningBill({
      grossCertifiedAmount: gross,
      cumulativePreviousIPCs: Number(project.cumulative_certified || 0),
      contractValue: Number(project.contract_value || 0),
      mobilizationAdvancePct: Number(project.mobilization_adv_pct || 10),
      mobilizationRecovered: Number(project.mobilization_recovered || 0),
      retentionPct: Number(project.retention_pct || 5),
      retentionReleased: 0,
      isCompanyContractor: form.is_company_contractor,
      provinceCode: project.province_code || 'PK-PB',
      hasWhtExemption: form.has_wht_exemption,
      escalationAmount: parseFloat(form.escalation_amount) || 0,
      securedAdvance: parseFloat(form.secured_advance) || 0,
    });
  }, [form.gross_certified_amount, form.escalation_amount, form.secured_advance, form.is_company_contractor, form.has_wht_exemption, project]);

  const handleSave = () => {
    if (!form.period_ending || !form.gross_certified_amount) {
      notify.error('Please fill in required fields');
      return;
    }
    if (!businessId) {
      notify.error('Business ID missing');
      return;
    }
    startTransition(async () => {
      const res = await recordIPCAction(businessId, {
        project_id: project.id,
        ...form,
        ipc_number: parseInt(form.ipc_number),
        gross_certified_amount: parseFloat(form.gross_certified_amount),
        escalation_amount: parseFloat(form.escalation_amount) || 0,
        secured_advance: parseFloat(form.secured_advance) || 0,
      });
      if (res?.success) {
        notify.compactSave(`IPC #${form.ipc_number} recorded`);
        onSave?.();
        onClose?.();
      } else {
        notify.error(res?.error || 'Failed to record IPC');
      }
    });
  };

  const input = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 border border-green-100">
              <Receipt className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Record IPC #{form.ipc_number}</h2>
              <p className="text-xs text-gray-400">{project?.name} — {project?.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 border-r border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>IPC Number</label>
                <input className={input} type="number" min="1"
                  value={form.ipc_number} onChange={(e) => set('ipc_number', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Period Ending <span className="text-red-500">*</span></label>
                <input className={input} type="date"
                  value={form.period_ending} onChange={(e) => set('period_ending', e.target.value)} />
              </div>
            </div>

            <div>
              <label className={lbl}>Gross Certified Amount (PKR) <span className="text-red-500">*</span></label>
              <input className={input} type="number" min="0" step="1000"
                value={form.gross_certified_amount}
                onChange={(e) => set('gross_certified_amount', e.target.value)}
                placeholder="Cumulative gross work certified" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Escalation (PEC Clause 70)</label>
                <input className={input} type="number" min="0" step="100"
                  value={form.escalation_amount} onChange={(e) => set('escalation_amount', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Secured Advance on Materials</label>
                <input className={input} type="number" min="0" step="100"
                  value={form.secured_advance} onChange={(e) => set('secured_advance', e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600"
                  checked={form.is_company_contractor}
                  onChange={(e) => set('is_company_contractor', e.target.checked)} />
                <span className="text-xs font-semibold text-gray-600">Company Contractor (WHT 7.5%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600"
                  checked={form.has_wht_exemption}
                  onChange={(e) => set('has_wht_exemption', e.target.checked)} />
                <span className="text-xs font-semibold text-gray-600">WHT Exemption Certificate</span>
              </label>
            </div>

            <div>
              <label className={lbl}>Engineer's Remarks</label>
              <textarea className={cn(input, 'resize-none')} rows={2}
                value={form.engineer_remarks} onChange={(e) => set('engineer_remarks', e.target.value)} />
            </div>
          </div>

          {/* Right: Live Calculation */}
          <div className="w-72 flex-shrink-0 overflow-y-auto p-6 bg-gray-50/70">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Live Calculation</span>
              {isCalcPending && (
                <span className="ml-auto h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              )}
            </div>

            {calc ? (
              <div className="space-y-0 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">This IPC Gross</p>
                  <p className="text-lg font-bold tabular-nums text-blue-700">{fmt(calc.thisIpcGross, currency)}</p>
                </div>
                <div className="px-4 py-2">
                  {calc.escalationAmount > 0 && (
                    <CalcRow label="+ Escalation (PEC Cl.70)" value={calc.escalationAmount} currency={currency} indent />
                  )}
                  <CalcRow label="− Retention Money" value={calc.retentionDeductible} currency={currency} indent negative />
                  <CalcRow label="− Mobilization Recovery" value={calc.mobilizationRecoveryThisIPC} currency={currency} indent negative />
                  {calc.securedAdvance > 0 && (
                    <CalcRow label="− Secured Advance" value={calc.securedAdvance} currency={currency} indent negative />
                  )}
                  <CalcRow label="Net Before Tax" value={calc.netBeforeTax} currency={currency} bold />
                  <CalcRow label={`− WHT ${calc.whtRate}%`} value={calc.whtDeduction} currency={currency} indent negative />
                  {calc.provincialTaxDeduction > 0 && (
                    <CalcRow label={`− ${calc.provincialTaxLabel}`} value={calc.provincialTaxDeduction} currency={currency} indent negative />
                  )}
                </div>
                <div className="px-4 py-3 bg-green-50 border-t border-green-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600">Net Payable</p>
                  <p className="text-xl font-bold tabular-nums text-green-700">{fmt(calc.netPayable, currency)}</p>
                </div>
                {calc.mobilizationOutstanding > 0 && (
                  <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
                    <p className="text-[10px] font-semibold text-amber-600">Mobilization Outstanding</p>
                    <p className="text-sm font-bold tabular-nums text-amber-700">{fmt(calc.mobilizationOutstanding, currency)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calculator className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">Enter gross certified amount to see the live calculation</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4 flex-shrink-0">
          <button onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isPending || !calc}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
            {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Record IPC #{form.ipc_number}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── IPC Timeline ──────────────────────────────────────────────────────────────

/**
 * @param {{ project: any, ipcs: any[], onRefresh: () => void }} props
 */
export function IPCTimeline({ project, ipcs = [], onRefresh }) {
  const { business } = useBusiness();
  const currency = business?.settings?.financials?.currency || 'PKR';
  const [showCalc, setShowCalc] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = (ipc, nextStatus) => {
    if (!business?.id) return;
    startTransition(async () => {
      const res = await updateIPCStatusAction(business.id, ipc.id, nextStatus);
      if (res?.success) {
        notify.compactSave(`IPC #${ipc.ipc_number} marked ${nextStatus.toLowerCase()}`);
        onRefresh?.();
      } else {
        notify.error(res?.error || 'Status update failed');
      }
    });
  };

  if (!project) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">IPC Timeline</h3>
          <p className="text-xs text-gray-400">{project.name} — {ipcs.length} certificate{ipcs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCalc(true)}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Record IPC
        </button>
      </div>

      {/* IPC List */}
      {ipcs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
          <Receipt className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No IPCs yet</p>
          <p className="mt-1 text-xs text-gray-400">Record the first interim payment certificate</p>
          <button onClick={() => setShowCalc(true)}
            className="mt-4 flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
            <Plus className="h-4 w-4" /> Record First IPC
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ipcs.map((ipc, idx) => {
            const cfg = IPC_STATUS[ipc.status] || IPC_STATUS.SUBMITTED;
            const nextStatus = cfg.next;
            return (
              <div key={ipc.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold', cfg.color)}>
                      {ipc.ipc_number}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">IPC #{ipc.ipc_number} — {ipc.ipc_code}</p>
                      <p className="text-xs text-gray-400">Period ending: {ipc.period_ending?.slice(0, 10)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ipc.status} />
                    {nextStatus && (
                      <button
                        onClick={() => handleStatusUpdate(ipc, nextStatus)}
                        disabled={isPending}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <ArrowRight className="h-3 w-3" />
                        Mark {nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        import('@/lib/pdf/ipcBillPdf').then(({ printIPCBill }) => {
                          printIPCBill({ ipc, project, business });
                        });
                      }}
                      title="Print IPC PDF"
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Financial breakdown */}
                <div className="mt-3 grid grid-cols-4 gap-2 text-center border-t border-gray-50 pt-3">
                  {[
                    { l: 'Gross Certified', v: ipc.this_ipc_gross, c: 'text-gray-700' },
                    { l: 'Retention', v: ipc.retention_deduction, c: 'text-amber-600', neg: true },
                    { l: 'Mob. Recovery', v: ipc.mobilization_recovery, c: 'text-orange-600', neg: true },
                    { l: 'Net Payable', v: ipc.net_payable, c: 'text-green-700 font-bold' },
                  ].map(({ l, v, c, neg }) => (
                    <div key={l}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l}</p>
                      <p className={cn('text-sm tabular-nums font-semibold', c)}>
                        {neg ? '−' : ''}{fmt(v, currency)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Tax row */}
                <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-400">
                  <span>WHT {ipc.wht_rate}%: {fmt(ipc.wht_deduction, currency)}</span>
                  {Number(ipc.provincial_tax_deduction) > 0 && (
                    <span>{ipc.provincial_tax_label}: {fmt(ipc.provincial_tax_deduction, currency)}</span>
                  )}
                  {ipc.approved_at && <span>Approved: {ipc.approved_at?.slice(0, 10)}</span>}
                  {ipc.disbursed_at && <span>Disbursed: {ipc.disbursed_at?.slice(0, 10)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCalc && (
        <IPCCalcForm
          project={project}
          onSave={onRefresh}
          onClose={() => setShowCalc(false)}
        />
      )}
    </div>
  );
}

export { IPCCalcForm };
export default IPCTimeline;
