'use client';

/**
 * Construction Projects Manager
 * Full CRUD for construction projects — list, create, detail, status management.
 */

import { useState, useCallback, useTransition, useMemo } from 'react';
import {
  Plus, Building2, Search, Filter, MoreHorizontal, CheckCircle2,
  Clock, AlertCircle, Archive, CircleDot, FileText, Calendar,
  DollarSign, TrendingUp, Users, Truck, ChevronRight,
  MapPin, Badge, Edit2, Trash2, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { useHubTab } from '@/lib/context/HubTabContext';
import {
  createProjectAction,
  getProjectsAction,
  updateProjectAction,
  deleteProjectAction,
} from '@/lib/actions/construction/projects';
import { notify } from '@/lib/utils/notify';
import { formatDistanceToNow } from 'date-fns';

// ── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  BIDDING:   { label: 'Bidding',   color: 'text-blue-600  bg-blue-50  border-blue-200',  icon: FileText },
  ACTIVE:    { label: 'Active',    color: 'text-green-700 bg-green-50 border-green-200', icon: CircleDot },
  DLP:       { label: 'DLP',       color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock },
  CLOSED:    { label: 'Completed', color: 'text-gray-600  bg-gray-50  border-gray-200',  icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600   bg-red-50   border-red-200',   icon: X },
};

const PROVINCE_LABELS = {
  'PK-PB': 'Punjab', 'PK-SD': 'Sindh', 'PK-KP': 'KP', 'PK-BA': 'Balochistan',
};

const CATEGORY_LABELS = {
  'C-A': 'C-A (Unlimited)', 'C-B': 'C-B (3,000M)', 'C-1': 'C-1 (1,000M)',
  'C-2': 'C-2 (500M)',      'C-3': 'C-3 (250M)',    'C-4': 'C-4 (100M)',
  'C-5': 'C-5 (50M)',       'C-6': 'C-6 (25M)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n, currency = 'PKR') {
  const v = Number(n || 0);
  if (v >= 1_000_000_000) return `${currency} ${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${currency} ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${currency} ${(v / 1_000).toFixed(1)}K`;
  return `${currency} ${v.toLocaleString()}`;
}

function pct(a, b) {
  if (!b || !a) return '0.0';
  return Math.min(100, ((Number(a) / Number(b)) * 100)).toFixed(1);
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;
  const Icon = cfg.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
      cfg.color
    )}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────

function ProjectCard({ project, currency, onView, onEdit, onDelete }) {
  const completion = pct(project.cumulative_certified, project.contract_value);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md cursor-pointer"
      onClick={() => onView(project)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{project.name}</p>
            <p className="text-[11px] text-gray-400 font-mono">{project.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={project.status} />
          <button
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div
          className="absolute right-4 top-12 z-20 w-36 rounded-xl border border-gray-200 bg-white shadow-xl py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
            onClick={() => { setMenuOpen(false); onEdit(project); }}
          >
            <Edit2 className="h-3.5 w-3.5 text-gray-400" /> Edit Project
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
            onClick={() => { setMenuOpen(false); onDelete(project); }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}

      {/* Client & Province */}
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {project.client_name}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {PROVINCE_LABELS[project.province_code] || project.province_code}
        </span>
        {project.is_government_project && (
          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
            Gov
          </span>
        )}
      </div>

      {/* Financial */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Contract</p>
          <p className="text-sm font-bold tabular-nums text-gray-800">{fmt(project.contract_value, currency)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Certified</p>
          <p className="text-sm font-bold tabular-nums text-green-700">{fmt(project.cumulative_certified, currency)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Retention</p>
          <p className="text-sm font-bold tabular-nums text-amber-700">{fmt(project.retention_held, currency)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-medium">IPC Progress</span>
          <span className="text-[11px] font-bold tabular-nums text-gray-600">{completion}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* PEC / IPC counts */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
        <span>{project.contractor_category} | {project.pec_project_no ? `PEC: ${project.pec_project_no}` : 'No PEC No.'}</span>
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {project._count?.ipcs || 0} IPCs
        </span>
      </div>
    </div>
  );
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────

function ProjectFormModal({ project = null, onClose, onSuccess }) {
  const { business } = useBusiness();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    code: project?.code || '',
    name: project?.name || '',
    client_name: project?.client_name || '',
    client_contact: project?.client_contact || '',
    contractor_category: project?.contractor_category || 'C-1',
    contract_value: project?.contract_value ? String(project.contract_value) : '',
    commencement_date: project?.commencement_date ? project.commencement_date.slice(0, 10) : '',
    completion_date: project?.completion_date ? project.completion_date.slice(0, 10) : '',
    province_code: project?.province_code || 'PK-PB',
    is_government_project: project?.is_government_project ?? false,
    pec_project_no: project?.pec_project_no || '',
    ppra_reference: project?.ppra_reference || '',
    employer_dept: project?.employer_dept || '',
    mobilization_adv_pct: project?.mobilization_adv_pct ? String(project.mobilization_adv_pct) : '10',
    retention_pct: project?.retention_pct ? String(project.retention_pct) : '5',
    notes: project?.notes || '',
  });

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        ...form,
        contract_value: parseFloat(form.contract_value) || 0,
        mobilization_adv_pct: parseFloat(form.mobilization_adv_pct) || 10,
        retention_pct: parseFloat(form.retention_pct) || 5,
      };
      const action = project
        ? updateProjectAction(project.id, payload)
        : createProjectAction(payload);
      const res = await action;
      if (res?.success) {
        notify.compactSave(project ? 'Project updated' : 'Project created');
        onSuccess?.(res.project);
        onClose();
      } else {
        notify.error(res?.error || 'Failed to save project');
      }
    });
  };

  const label = 'block text-xs font-semibold text-gray-600 mb-1';
  const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all';
  const select = cn(input, 'appearance-none');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {project ? 'Edit Project' : 'New Construction Project'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Project Code <span className="text-red-500">*</span></label>
              <input className={input} value={form.code} onChange={(e) => set('code', e.target.value)}
                placeholder="PRJ-001" required />
            </div>
            <div>
              <label className={label}>PEC Category</label>
              <select className={select} value={form.contractor_category}
                onChange={(e) => set('contractor_category', e.target.value)}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Project Name <span className="text-red-500">*</span></label>
            <input className={input} value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Lahore Ring Road Package-IV" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Client / Employer <span className="text-red-500">*</span></label>
              <input className={input} value={form.client_name} onChange={(e) => set('client_name', e.target.value)}
                placeholder="e.g. NHA, LDA, Private Developer" required />
            </div>
            <div>
              <label className={label}>Employer Department</label>
              <input className={input} value={form.employer_dept} onChange={(e) => set('employer_dept', e.target.value)}
                placeholder="e.g. CWD Punjab" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Contract Value (PKR) <span className="text-red-500">*</span></label>
              <input className={input} type="number" min="0" step="1000"
                value={form.contract_value} onChange={(e) => set('contract_value', e.target.value)}
                placeholder="e.g. 450000000" required />
            </div>
            <div>
              <label className={label}>Province</label>
              <select className={select} value={form.province_code}
                onChange={(e) => set('province_code', e.target.value)}>
                {Object.entries(PROVINCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Commencement Date <span className="text-red-500">*</span></label>
              <input className={input} type="date" value={form.commencement_date}
                onChange={(e) => set('commencement_date', e.target.value)} required />
            </div>
            <div>
              <label className={label}>Completion Date <span className="text-red-500">*</span></label>
              <input className={input} type="date" value={form.completion_date}
                onChange={(e) => set('completion_date', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={label}>Mobilization Advance %</label>
              <input className={input} type="number" min="0" max="20" step="0.5"
                value={form.mobilization_adv_pct} onChange={(e) => set('mobilization_adv_pct', e.target.value)} />
            </div>
            <div>
              <label className={label}>Retention %</label>
              <input className={input} type="number" min="0" max="10" step="0.5"
                value={form.retention_pct} onChange={(e) => set('retention_pct', e.target.value)} />
            </div>
            <div className="flex flex-col justify-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600"
                  checked={form.is_government_project}
                  onChange={(e) => set('is_government_project', e.target.checked)} />
                <span className="text-xs font-semibold text-gray-600">Government Project</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>PEC Project No.</label>
              <input className={input} value={form.pec_project_no} onChange={(e) => set('pec_project_no', e.target.value)}
                placeholder="PEC-CE-001/2026" />
            </div>
            <div>
              <label className={label}>PPRA Reference</label>
              <input className={input} value={form.ppra_reference} onChange={(e) => set('ppra_reference', e.target.value)}
                placeholder="PPRA-2026-001234" />
            </div>
          </div>

          <div>
            <label className={label}>Notes</label>
            <textarea className={cn(input, 'resize-none')} rows={2} value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Internal notes, scope summary, special conditions..." />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            form="project-form"
            type="submit"
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {project ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * @param {{ projects?: any[], isLoading?: boolean, onRefresh?: () => void }} props
 */
export function ConstructionProjectsManager({ projects = [], isLoading = false, onRefresh }) {
  const { business } = useBusiness();
  const { goToTab } = useHubTab();
  const currency = business?.settings?.financials?.currency || 'PKR';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let list = projects;
    if (statusFilter !== 'ALL') list = list.filter((p) => p.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.client_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, statusFilter, search]);

  const handleDelete = useCallback((project) => {
    if (!window.confirm(`Delete project "${project.name}"? This will remove all BOQ items, IPCs, and machinery logs.`)) return;
    startTransition(async () => {
      const res = await deleteProjectAction(project.id);
      if (res?.success) {
        notify.compactSave('Project deleted');
        onRefresh?.();
      } else {
        notify.error(res?.error || 'Failed to delete');
      }
    });
  }, [onRefresh]);

  const tabs = [
    { id: 'ALL',       label: 'All' },
    { id: 'BIDDING',   label: 'Bidding' },
    { id: 'ACTIVE',    label: 'Active' },
    { id: 'DLP',       label: 'DLP' },
    { id: 'CLOSED',    label: 'Completed' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatusFilter(t.id)}
            className={cn(
              'flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
              statusFilter === t.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            {t.label}
            <span className={cn('ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
              statusFilter === t.id ? 'bg-blue-500 text-blue-100' : 'bg-gray-100 text-gray-500'
            )}>
              {t.id === 'ALL' ? projects.length : projects.filter((p) => p.status === t.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Building2 className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            {search || statusFilter !== 'ALL' ? 'No matching projects' : 'No projects yet'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {search || statusFilter !== 'ALL' ? 'Try adjusting your search or filter' : 'Create your first PEC/PPRA project to get started'}
          </p>
          {!search && statusFilter === 'ALL' && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              currency={currency}
              onView={(p) => goToTab?.(`projects?projectId=${p.id}`)}
              onEdit={(p) => setEditProject(p)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <ProjectFormModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => onRefresh?.()}
        />
      )}
      {editProject && (
        <ProjectFormModal
          project={editProject}
          onClose={() => setEditProject(null)}
          onSuccess={() => { setEditProject(null); onRefresh?.(); }}
        />
      )}
    </div>
  );
}

export default ConstructionProjectsManager;
