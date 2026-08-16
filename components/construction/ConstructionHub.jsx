'use client';

/**
 * Construction Hub — Main Construction Management Hub
 * Complete construction domain hub with dedicated 4-section sub-sidebar.
 * Used inside /business/[handle] when category === construction-contractor.
 */

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  Building2, Calculator, Receipt, Package, Truck, Users,
  HardHat, Banknote, ShoppingCart, BarChart3, Settings,
  LayoutDashboard, RefreshCcw, ChevronRight, Menu, X, Layers, Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { useHubTab } from '@/lib/context/HubTabContext';
import { ConstructionDashboard } from './ConstructionDashboard';
import { ConstructionProjectsManager } from './ConstructionProjectsManager';
import { BOQItemsTable } from './BOQItemsTable';
import { IPCTimeline } from './IPCCalculator';
import { MachineryLogbook } from './MachineryLogbook';
import { SiteOperationsHub } from './SiteOperationsHub';
import { SubcontractorsHub } from './SubcontractorsHub';
import { MaterialRateDashboard } from './MaterialRateDashboard';
import { TaxComplianceDashboard } from './TaxComplianceDashboard';
import { SiteMaterialsHub } from './SiteMaterialsHub';
import { ConstructionFinanceHub } from './ConstructionFinanceHub';
import { ProcurementHub } from './ProcurementHub';
import { ConstructionReportsHub } from './ConstructionReportsHub';
import { ConstructionSettingsHub } from './ConstructionSettingsHub';

import { getProjectsAction } from '@/lib/actions/construction/projects';
import { getBOQItemsAction } from '@/lib/actions/construction/boq';
import { getIPCsAction } from '@/lib/actions/construction/ipc';
import { getMachineryLogsAction, getMachineryFleetSummaryAction } from '@/lib/actions/construction/machinery';
import { CONSTRUCTION_HUB_TABS, CONSTRUCTION_HUB_SECTIONS } from '@/lib/config/constructionHubNav';
import { generateConstructionIntelligenceAlerts } from '@/lib/construction/constructionIntelligence';

// ── Tab Icon Map ──────────────────────────────────────────────────────────────

const TAB_ICONS = {
  overview:         LayoutDashboard,
  dashboard:        LayoutDashboard,
  projects:         Building2,
  boq:              Calculator,
  ipc:              Receipt,
  'site-materials': Layers,
  machinery:        Cpu,
  subcontractors:   Users,
  'site-ops':       HardHat,
  'material-rates': Package,
  'tax-compliance': Receipt,
  finance:          Banknote,
  procurement:      ShoppingCart,
  reports:          BarChart3,
  settings:         Settings,
};

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * @param {{ constructionOps?: any, isOpsLoading?: boolean }} props
 */
export function ConstructionHub({ constructionOps, isOpsLoading }) {
  const { business } = useBusiness();
  const { activeTab, goToTab } = useHubTab();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const businessId = business?.id;

  // Local state for construction hub data
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [boqItems, setBoqItems] = useState([]);
  const [ipcs, setIpcs] = useState([]);
  const [machineryLogs, setMachineryLogs] = useState([]);
  const [fleetSummary, setFleetSummary] = useState([]);

  // Active tab — map generic 'dashboard' → 'overview' for construction tab matching
  const rawTab = activeTab || 'overview';
  const currentTabId = rawTab === 'dashboard' ? 'overview' : rawTab;

  // Load projects on mount / business change
  useEffect(() => {
    if (!businessId) return;
    setProjectsLoading(true);
    getProjectsAction(businessId).then((res) => {
      if (res?.success && Array.isArray(res.projects)) {
        setProjects(res.projects);
        if (res.projects.length > 0 && !selectedProject) {
          setSelectedProject(res.projects[0]);
        }
      }
      setProjectsLoading(false);
    });
  }, [businessId]);

  // Load BOQ items, IPCs, and machinery when a project is selected
  useEffect(() => {
    if (!businessId || !selectedProject) return;
    Promise.all([
      getBOQItemsAction(businessId, selectedProject.id),
      getIPCsAction(businessId, selectedProject.id),
      getMachineryLogsAction(businessId, { project_id: selectedProject.id, limit: 100 }),
      getMachineryFleetSummaryAction(businessId),
    ]).then(([boqRes, ipcRes, logRes, fleetRes]) => {
      if (boqRes?.success) setBoqItems(boqRes.boqItems || []);
      if (ipcRes?.success) setIpcs(ipcRes.ipcs || []);
      if (logRes?.success) setMachineryLogs(logRes.logs || []);
      if (fleetRes?.success) setFleetSummary(fleetRes.fleet || []);
    });
  }, [businessId, selectedProject]);

  const refreshProjects = () => {
    if (!businessId) return;
    setProjectsLoading(true);
    getProjectsAction(businessId).then((res) => {
      if (res?.success && Array.isArray(res.projects)) {
        setProjects(res.projects);
      }
      setProjectsLoading(false);
    });
  };

  const refreshProjectDetail = () => {
    if (!businessId || !selectedProject) return;
    Promise.all([
      getBOQItemsAction(businessId, selectedProject.id),
      getIPCsAction(businessId, selectedProject.id),
      getMachineryLogsAction(businessId, { project_id: selectedProject.id, limit: 100 }),
      getMachineryFleetSummaryAction(businessId),
    ]).then(([boqRes, ipcRes, logRes, fleetRes]) => {
      if (boqRes?.success) setBoqItems(boqRes.boqItems || []);
      if (ipcRes?.success) setIpcs(ipcRes.ipcs || []);
      if (logRes?.success) setMachineryLogs(logRes.logs || []);
      if (fleetRes?.success) setFleetSummary(fleetRes.fleet || []);
    });
  };

  // Active Project or default
  const activeProj = selectedProject || projects[0];

  // ── Render active module view ──────────────────────────────────────────────

  function renderTab() {
    switch (currentTabId) {
      case 'overview':
        return (
          <ConstructionDashboard
            projects={projects}
            constructionOps={constructionOps}
            isLoading={isOpsLoading}
          />
        );

      case 'projects':
        return (
          <ConstructionProjectsManager
            projects={projects}
            isLoading={projectsLoading}
            onRefresh={refreshProjects}
          />
        );

      case 'boq':
        return (
          <div className="space-y-4">
            <ProjectHeaderSelector
              projects={projects}
              selectedProject={activeProj}
              onSelect={setSelectedProject}
              title="BOQ & Composite Rate Estimation"
            />
            {activeProj ? (
              <BOQItemsTable
                projectId={activeProj.id}
                boqItems={boqItems}
                onRefresh={refreshProjectDetail}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center bg-white">
                <p className="text-xs text-gray-500">No project selected. Create a project to view BOQ line items.</p>
              </div>
            )}
          </div>
        );

      case 'ipc':
        return (
          <div className="space-y-4">
            <ProjectHeaderSelector
              projects={projects}
              selectedProject={activeProj}
              onSelect={setSelectedProject}
              title="Interim Payment Certificate (IPC) Billing & Retention"
            />
            {activeProj ? (
              <IPCTimeline
                project={activeProj}
                ipcs={ipcs}
                onRefresh={refreshProjectDetail}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center bg-white">
                <p className="text-xs text-gray-500">No project selected. Create a project to manage IPC billing.</p>
              </div>
            )}
          </div>
        );

      case 'material-rates':
        return <MaterialRateDashboard />;

      case 'tax-compliance':
        return <TaxComplianceDashboard />;

      case 'site-materials':
        return <SiteMaterialsHub projects={projects} />;

      case 'machinery':
        return (
          <MachineryLogbook
            projects={projects}
            machineryLogs={machineryLogs}
            fleetSummary={fleetSummary}
            onRefresh={refreshProjectDetail}
          />
        );

      case 'subcontractors':
        return (
          <SubcontractorsHub
            projects={projects}
            onRefresh={refreshProjects}
          />
        );

      case 'site-ops':
        return (
          <SiteOperationsHub
            projects={projects}
            onRefresh={refreshProjects}
          />
        );

      case 'finance':
        return <ConstructionFinanceHub projects={projects} />;

      case 'procurement':
        return <ProcurementHub projects={projects} />;

      case 'reports':
        return <ConstructionReportsHub projects={projects} />;

      case 'settings':
        return <ConstructionSettingsHub />;

      default:
        return (
          <ConstructionDashboard
            projects={projects}
            constructionOps={constructionOps}
            isLoading={isOpsLoading}
          />
        );
    }
  }

  // Active Tab metadata
  const activeTabMeta = CONSTRUCTION_HUB_TABS.find((t) => t.id === currentTabId) || CONSTRUCTION_HUB_TABS[0];
  const Icon = TAB_ICONS[activeTabMeta.id] || LayoutDashboard;

  return (
    <div className="space-y-6">
      {/* Top Header bar with Refresh and Mobile Nav Toggle */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-3.5 sm:px-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 lg:hidden"
            title="Toggle Construction Sub-Menu"
          >
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>{activeTabMeta.label}</span>
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                {activeTabMeta.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshProjects}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            title="Refresh Construction Data"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Live Construction Intelligence Alert Strip */}
      {(() => {
        const alerts = generateConstructionIntelligenceAlerts();
        if (!alerts || alerts.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-2.5">
            {alerts.map((alt, idx) => (
              <button
                key={idx}
                onClick={() => alt.actionTab && goToTab(alt.actionTab)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all text-left shadow-sm',
                  alt.type === 'danger' && 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
                  alt.type === 'warning' && 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
                  alt.type === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
                  alt.type === 'info' && 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                )}
              >
                <span>{alt.message}</span>
                {alt.actionTab && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />}
              </button>
            ))}
          </div>
        );
      })()}

      {/* Responsive Layout Grid: Dedicated Construction Sub-Sidebar + View Content Area */}
      <div className="lg:grid lg:grid-cols-[250px_1fr] lg:gap-6 lg:items-start">
        {/* ── Inner Construction Sub-Sidebar Card ── */}
        <aside className={cn(
          'space-y-4 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all',
          mobileNavOpen ? 'block' : 'hidden lg:block'
        )}>
          {CONSTRUCTION_HUB_SECTIONS.map((section) => {
            const sectionTabs = section.tabIds
              .map((id) => CONSTRUCTION_HUB_TABS.find((t) => t.id === id))
              .filter(Boolean);

            if (sectionTabs.length === 0) return null;

            return (
              <div key={section.id} className="space-y-1">
                <p className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {sectionTabs.map((tab) => {
                    const TabIcon = TAB_ICONS[tab.id] || LayoutDashboard;
                    const isActive = currentTabId === tab.id || (tab.id === 'overview' && currentTabId === 'dashboard');

                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          goToTab(tab.id === 'overview' ? 'dashboard' : tab.id);
                          setMobileNavOpen(false);
                        }}
                        className={cn(
                          'flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-semibold transition-all text-left',
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm font-bold'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <TabIcon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-gray-400')} />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/80" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>

        {/* ── Main View Content Area ── */}
        <main className="min-w-0 mt-4 lg:mt-0">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}

// ── Helper Components ────────────────────────────────────────────────────────

function ProjectHeaderSelector({ projects = [], selectedProject, onSelect, title }) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="text-xs font-bold text-gray-900">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Active Project:</span>
        <select
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const found = projects.find((p) => p.id === e.target.value);
            if (found) onSelect(found);
          }}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
