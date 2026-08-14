'use client';

/**
 * Site Operations Hub
 * Daily work reports, HSE safety logs, quality testing, and site inspections.
 * All four sub-tabs unified in one component with shared project context.
 */

import { useState, useTransition, useMemo } from 'react';
import {
  Calendar, Shield, TestTube, Eye, Plus, X,
  AlertTriangle, CheckCircle, AlertCircle, Clock,
  ChevronRight, Sun, CloudRain, Wind, Thermometer,
  Users, Truck, ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import {
  createDailyWorkReportAction,
  getDailyWorkReportsAction,
  createSafetyLogAction,
  getSafetyLogsAction,
  updateSafetyLogStatusAction,
  createQualityTestAction,
  getQualityTestsAction,
  createSiteInspectionAction,
  getSiteInspectionsAction,
} from '@/lib/actions/construction/siteOperations';
import notify from '@/lib/utils/appToast';

// ── Sub-tab Config ────────────────────────────────────────────────────────────

const SUB_TABS = [
  { id: 'daily-reports', label: 'Daily Reports', icon: Calendar,     color: 'blue' },
  { id: 'safety',        label: 'HSE & Safety',  icon: Shield,       color: 'red' },
  { id: 'quality',       label: 'Quality Tests', icon: TestTube,     color: 'indigo' },
  { id: 'inspections',   label: 'Inspections',   icon: Eye,          color: 'purple' },
];

const COLOR_MAP = {
  blue:   'bg-blue-50 text-blue-600 border-blue-200',
  red:    'bg-red-50  text-red-600  border-red-200',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
};

// ── Severity / Status Badges ──────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  LOW:      'bg-gray-50   text-gray-600   border-gray-200',
  MEDIUM:   'bg-amber-50  text-amber-700  border-amber-200',
  HIGH:     'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50    text-red-700    border-red-200',
};

const QUALITY_STATUS = {
  PASS:        'bg-green-50  text-green-700  border-green-200',
  FAIL:        'bg-red-50    text-red-700    border-red-200',
  PENDING:     'bg-gray-50   text-gray-600   border-gray-200',
  CONDITIONAL: 'bg-amber-50  text-amber-700  border-amber-200',
};

const COMPLIANCE_STATUS = {
  COMPLIANT:     'bg-green-50  text-green-700  border-green-200',
  NON_COMPLIANT: 'bg-red-50    text-red-700    border-red-200',
  CONDITIONAL:   'bg-amber-50  text-amber-700  border-amber-200',
};

function Badge({ label, colorCls }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold', colorCls)}>
      {label}
    </span>
  );
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inp = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all';
const lbl = 'block text-xs font-semibold text-gray-600 mb-1.5';

// ── Daily Report Form ─────────────────────────────────────────────────────────

function DailyReportForm({ projectId, onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    report_date: new Date().toISOString().slice(0, 10),
    weather_conditions: 'Clear / Sunny',
    manpower_on_site: '',
    work_description: '',
    equipment_deployed: '',
    materials_consumed: '',
    progress_pct: '',
    issues_encountered: '',
    remarks: '',
    reported_by: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.work_description) { notify.error('Work description is required'); return; }
    startTransition(async () => {
      const res = await createDailyWorkReportAction({
        project_id: projectId,
        ...form,
        manpower_on_site: form.manpower_on_site ? parseInt(form.manpower_on_site) : undefined,
        progress_pct: form.progress_pct ? parseFloat(form.progress_pct) : undefined,
      });
      if (res?.success) { notify.compactSave('Daily report saved'); onSuccess?.(); onClose(); }
      else notify.error(res?.error || 'Failed to save');
    });
  };

  const WEATHER_OPTIONS = ['Clear / Sunny', 'Cloudy / Overcast', 'Light Rain', 'Heavy Rain', 'Hot (>40°C)', 'Dust Storm', 'Fog'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" /> Daily Work Report</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Date</label><input className={inp} type="date" value={form.report_date} onChange={e => set('report_date', e.target.value)} /></div>
            <div><label className={lbl}>Manpower on Site</label><input className={inp} type="number" min="0" value={form.manpower_on_site} onChange={e => set('manpower_on_site', e.target.value)} placeholder="e.g. 45 workers" /></div>
          </div>
          <div><label className={lbl}>Weather Conditions</label>
            <select className={inp} value={form.weather_conditions} onChange={e => set('weather_conditions', e.target.value)}>
              {WEATHER_OPTIONS.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Work Description <span className="text-red-500">*</span></label>
            <textarea className={cn(inp, 'resize-none')} rows={3} value={form.work_description} onChange={e => set('work_description', e.target.value)} placeholder="Describe work done today — locations, quantities, activities" />
          </div>
          <div><label className={lbl}>Equipment Deployed</label><input className={inp} value={form.equipment_deployed} onChange={e => set('equipment_deployed', e.target.value)} placeholder="CAT 320, JCB, Transit Mixer x2" /></div>
          <div><label className={lbl}>Materials Consumed</label><input className={inp} value={form.materials_consumed} onChange={e => set('materials_consumed', e.target.value)} placeholder="Steel 5T, Cement 200 bags, Aggregate 150 Cu.Ft" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Progress % (cumulative)</label><input className={inp} type="number" min="0" max="100" step="0.1" value={form.progress_pct} onChange={e => set('progress_pct', e.target.value)} /></div>
            <div><label className={lbl}>Reported By</label><input className={inp} value={form.reported_by} onChange={e => set('reported_by', e.target.value)} placeholder="Site Engineer name" /></div>
          </div>
          <div><label className={lbl}>Issues / Constraints</label><textarea className={cn(inp, 'resize-none')} rows={2} value={form.issues_encountered} onChange={e => set('issues_encountered', e.target.value)} placeholder="Material delays, weather stoppages, disputes" /></div>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Save Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Safety Log Form ───────────────────────────────────────────────────────────

function SafetyLogForm({ projectId, onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    log_date: new Date().toISOString().slice(0, 10),
    incident_type: 'NEAR_MISS',
    severity: 'LOW',
    description: '',
    location_station: '',
    corrective_action: '',
    responsible_person: '',
    status: 'OPEN',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.description) { notify.error('Description is required'); return; }
    startTransition(async () => {
      const res = await createSafetyLogAction({ project_id: projectId, ...form });
      if (res?.success) { notify.compactSave('Safety log recorded'); onSuccess?.(); onClose(); }
      else notify.error(res?.error || 'Failed to save');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-red-500" /> Safety / HSE Log</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Date</label><input className={inp} type="date" value={form.log_date} onChange={e => set('log_date', e.target.value)} /></div>
            <div><label className={lbl}>Incident Type</label>
              <select className={inp} value={form.incident_type} onChange={e => set('incident_type', e.target.value)}>
                {['NEAR_MISS','INJURY','EQUIPMENT_FAILURE','SAFETY_VIOLATION','INSPECTION','OTHER'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Severity</label>
              <select className={inp} value={form.severity} onChange={e => set('severity', e.target.value)}>
                {['LOW','MEDIUM','HIGH','CRITICAL'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                {['OPEN','IN_PROGRESS','RESOLVED','CLOSED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <div><label className={lbl}>Description <span className="text-red-500">*</span></label>
            <textarea className={cn(inp, 'resize-none')} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the incident, violation, or inspection finding" />
          </div>
          <div><label className={lbl}>Location / Station</label><input className={inp} value={form.location_station} onChange={e => set('location_station', e.target.value)} placeholder="e.g. Pier P-03, KM 14+500" /></div>
          <div><label className={lbl}>Responsible Person</label><input className={inp} value={form.responsible_person} onChange={e => set('responsible_person', e.target.value)} /></div>
          <div><label className={lbl}>Corrective Action</label><textarea className={cn(inp, 'resize-none')} rows={2} value={form.corrective_action} onChange={e => set('corrective_action', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Record Log
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Quality Test Form ─────────────────────────────────────────────────────────

function QualityTestForm({ projectId, onClose, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const COMMON_TESTS = [
    'Concrete Cube Compressive Strength (ASTM C39)',
    'Soil Compaction Proctor (AASHTO T99)',
    'Rebar Tensile / Yield Strength (ASTM A615)',
    'Bitumen Penetration Grade (AASHTO M20)',
    'Aggregate Gradation (ASTM C136)',
    'Concrete Slump Test (ASTM C143)',
    'Sand Sieve Analysis',
    'Core Sample — In-Situ Concrete',
    'Asphalt Marshall Test',
    'Plate Bearing Test (Sub-grade)',
  ];
  const [form, setForm] = useState({
    test_date: new Date().toISOString().slice(0, 10),
    test_type: COMMON_TESTS[0],
    test_standard: 'ASTM C39',
    sample_location: '',
    test_results: '',
    pass_fail_status: 'PENDING',
    tested_by: '',
    remarks: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.test_results) { notify.error('Test results are required'); return; }
    startTransition(async () => {
      const res = await createQualityTestAction({ project_id: projectId, ...form });
      if (res?.success) { notify.compactSave('Quality test recorded'); onSuccess?.(); onClose(); }
      else notify.error(res?.error || 'Failed to save');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold flex items-center gap-2"><TestTube className="h-4 w-4 text-indigo-500" /> Quality Test Record</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Test Date</label><input className={inp} type="date" value={form.test_date} onChange={e => set('test_date', e.target.value)} /></div>
            <div><label className={lbl}>Result Status</label>
              <select className={cn(inp, 'font-semibold')} value={form.pass_fail_status} onChange={e => set('pass_fail_status', e.target.value)}>
                {['PASS','FAIL','PENDING','CONDITIONAL'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className={lbl}>Test Type</label>
            <select className={inp} value={form.test_type} onChange={e => set('test_type', e.target.value)}>
              {COMMON_TESTS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Test Standard (ASTM/AASHTO)</label><input className={inp} value={form.test_standard} onChange={e => set('test_standard', e.target.value)} /></div>
            <div><label className={lbl}>Sample Location</label><input className={inp} value={form.sample_location} onChange={e => set('sample_location', e.target.value)} placeholder="Pier P-03, Layer 2" /></div>
          </div>
          <div><label className={lbl}>Test Results <span className="text-red-500">*</span></label>
            <textarea className={cn(inp, 'resize-none')} rows={3} value={form.test_results} onChange={e => set('test_results', e.target.value)} placeholder="e.g. 28-day compressive strength: 32.5 MPa (Target: 30 MPa) — PASS" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Tested By</label><input className={inp} value={form.tested_by} onChange={e => set('tested_by', e.target.value)} /></div>
            <div><label className={lbl}>Remarks</label><input className={inp} value={form.remarks} onChange={e => set('remarks', e.target.value)} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Record Test
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * @param {{
 *   projectId: string;
 *   dailyReports?: any[];
 *   safetyLogs?: any[];
 *   qualityTests?: any[];
 *   inspections?: any[];
 *   onRefresh?: () => void;
 * }} props
 */
export function SiteOperationsHub({
  projectId,
  dailyReports = [],
  safetyLogs = [],
  qualityTests = [],
  inspections = [],
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState('daily-reports');
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const criticalSafety = safetyLogs.filter(l => ['HIGH','CRITICAL'].includes(l.severity) && ['OPEN','IN_PROGRESS'].includes(l.status));
  const failedTests = qualityTests.filter(t => t.pass_fail_status === 'FAIL');
  const nonCompliant = inspections.filter(i => i.compliance_status === 'NON_COMPLIANT');

  const handleStatusUpdate = (logId, status) => {
    startTransition(async () => {
      const res = await updateSafetyLogStatusAction(logId, status);
      if (res?.success) { notify.compactSave('Status updated'); onRefresh?.(); }
    });
  };

  function renderContent() {
    switch (activeTab) {
      case 'daily-reports':
        return (
          <div className="space-y-3">
            {dailyReports.length === 0 ? (
              <EmptyState icon={Calendar} label="No daily reports yet" onAdd={() => setShowForm(true)} />
            ) : dailyReports.map(r => (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{r.report_date?.slice(0,10)}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {r.weather_conditions && <span className="flex items-center gap-1"><Sun className="h-3 w-3" />{r.weather_conditions}</span>}
                    {r.manpower_on_site && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.manpower_on_site} workers</span>}
                    {r.progress_pct && <span className="font-semibold text-blue-600">{r.progress_pct}% complete</span>}
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{r.work_description}</p>
                {r.issues_encountered && (
                  <p className="mt-2 text-xs text-amber-600 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />{r.issues_encountered}
                  </p>
                )}
                {r.reported_by && <p className="mt-1.5 text-[11px] text-gray-400">Reported by: {r.reported_by}</p>}
              </div>
            ))}
          </div>
        );

      case 'safety':
        return (
          <div className="space-y-3">
            {criticalSafety.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {criticalSafety.length} critical/high severity incident{criticalSafety.length > 1 ? 's' : ''} require immediate attention
              </div>
            )}
            {safetyLogs.length === 0 ? (
              <EmptyState icon={Shield} label="No safety logs" onAdd={() => setShowForm(true)} />
            ) : safetyLogs.map(log => (
              <div key={log.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge label={log.severity} colorCls={SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.LOW} />
                    <Badge label={log.incident_type?.replace(/_/g,' ')} colorCls="bg-gray-50 text-gray-600 border-gray-200" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>{log.log_date?.slice(0,10)}</span>
                    {['OPEN','IN_PROGRESS'].includes(log.status) && (
                      <button onClick={() => handleStatusUpdate(log.id, log.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED')}
                        className="rounded-lg border border-gray-200 px-2 py-0.5 text-[10px] font-semibold hover:bg-gray-50">
                        {log.status === 'OPEN' ? 'Start' : 'Resolve'}
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-700">{log.description}</p>
                {log.corrective_action && (
                  <p className="mt-1.5 text-[11px] text-green-700 flex items-start gap-1">
                    <CheckCircle className="h-3 w-3 mt-0.5" />Action: {log.corrective_action}
                  </p>
                )}
                {log.location_station && <p className="mt-1 text-[11px] text-gray-400">Location: {log.location_station}</p>}
              </div>
            ))}
          </div>
        );

      case 'quality':
        return (
          <div className="space-y-3">
            {failedTests.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {failedTests.length} quality test failure{failedTests.length > 1 ? 's' : ''} — review and re-test required
              </div>
            )}
            {qualityTests.length === 0 ? (
              <EmptyState icon={TestTube} label="No quality tests recorded" onAdd={() => setShowForm(true)} />
            ) : qualityTests.map(t => (
              <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge label={t.pass_fail_status} colorCls={QUALITY_STATUS[t.pass_fail_status] || QUALITY_STATUS.PENDING} />
                    <span className="text-sm font-medium text-gray-800">{t.test_type}</span>
                  </div>
                  <span className="text-xs text-gray-400">{t.test_date?.slice(0,10)}</span>
                </div>
                <p className="text-xs text-gray-600">{t.test_results}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
                  {t.test_standard && <span>Standard: {t.test_standard}</span>}
                  {t.sample_location && <span>Sample: {t.sample_location}</span>}
                  {t.tested_by && <span>By: {t.tested_by}</span>}
                </div>
              </div>
            ))}
          </div>
        );

      case 'inspections':
        return (
          <div className="space-y-3">
            {nonCompliant.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {nonCompliant.length} non-compliant inspection{nonCompliant.length > 1 ? 's' : ''} — follow-up action required
              </div>
            )}
            {inspections.length === 0 ? (
              <EmptyState icon={Eye} label="No site inspections recorded" onAdd={() => setShowForm(true)} />
            ) : inspections.map(insp => (
              <div key={insp.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge label={insp.compliance_status?.replace(/_/g,' ')} colorCls={COMPLIANCE_STATUS[insp.compliance_status] || COMPLIANCE_STATUS.CONDITIONAL} />
                    <span className="text-xs font-semibold text-gray-500">{insp.inspection_type}</span>
                  </div>
                  <span className="text-xs text-gray-400">{insp.inspection_date?.slice(0,10)}</span>
                </div>
                <p className="text-xs font-medium text-gray-700">Inspector: {insp.inspector_name}</p>
                <p className="mt-1.5 text-xs text-gray-600">{insp.findings}</p>
                {insp.recommendations && (
                  <p className="mt-1.5 text-[11px] text-indigo-600">Recommendation: {insp.recommendations}</p>
                )}
                {insp.follow_up_required && insp.next_inspection_date && (
                  <p className="mt-1 text-[11px] text-amber-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />Next inspection: {insp.next_inspection_date?.slice(0,10)}
                  </p>
                )}
              </div>
            ))}
          </div>
        );

      default: return null;
    }
  }

  return (
    <div className="space-y-4">
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {SUB_TABS.map(tab => {
          const Icon = tab.icon;
          const count = tab.id === 'daily-reports' ? dailyReports.length
            : tab.id === 'safety' ? safetyLogs.length
            : tab.id === 'quality' ? qualityTests.length
            : inspections.length;
          const alerts = tab.id === 'safety' ? criticalSafety.length
            : tab.id === 'quality' ? failedTests.length
            : tab.id === 'inspections' ? nonCompliant.length : 0;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                activeTab === tab.id
                  ? cn('text-white shadow-sm', tab.color === 'blue' ? 'bg-blue-600' : tab.color === 'red' ? 'bg-red-600' : tab.color === 'indigo' ? 'bg-indigo-600' : 'bg-purple-600')
                  : 'text-gray-500 hover:bg-gray-100'
              )}>
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {count > 0 && (
                <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]',
                  activeTab === tab.id ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                )}>{count}</span>
              )}
              {alerts > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">{alerts}</span>
              )}
            </button>
          );
        })}
        <button onClick={() => setShowForm(true)}
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-xl bg-gray-800 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {renderContent()}

      {/* Contextual form modals */}
      {showForm && activeTab === 'daily-reports' && <DailyReportForm projectId={projectId} onClose={() => setShowForm(false)} onSuccess={onRefresh} />}
      {showForm && activeTab === 'safety' && <SafetyLogForm projectId={projectId} onClose={() => setShowForm(false)} onSuccess={onRefresh} />}
      {showForm && activeTab === 'quality' && <QualityTestForm projectId={projectId} onClose={() => setShowForm(false)} onSuccess={onRefresh} />}
    </div>
  );
}

function EmptyState({ icon: Icon, label, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border-2 border-dashed border-gray-200">
      <Icon className="h-10 w-10 text-gray-300 mb-3" />
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <button onClick={onAdd} className="mt-4 flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700">
        <Plus className="h-4 w-4" /> Add Entry
      </button>
    </div>
  );
}

export default SiteOperationsHub;
