'use client';

/**
 * Construction Hub — Main Hub Component
 * Renders the complete construction domain hub with all tabs.
 * Used inside /business/[handle] when category === construction-contractor.
 */

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  Building2, Calculator, Receipt, Package, Truck, Users,
  HardHat, Banknote, ShoppingCart, BarChart3, Settings,
  LayoutDashboard, Plus, RefreshCcw,
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
import { getProjectsAction, getProjectDetailAction } from '@/lib/actions/construction/projects';
import { getBOQItemsAction } from '@/lib/actions/construction/boq';
import { getIPCsAction } from '@/lib/actions/construction/ipc';
import { getMachineryLogsAction, getMachineryFleetSummaryAction } from '@/lib/actions/construction/machinery';
import { getSubcontractorWorkOrdersAction } from '@/lib/actions/construction/subcontractor';
import { CONSTRUCTION_HUB_TABS } from '@/lib/config/constructionHubNav';

// ── Tab Icon Map ──────────────────────────────────────────────────────────────

const TAB_ICONS = {
  overview:        LayoutDashboard,
  projects:        Building2,
  boq:             Calculator,
  ipc:             Receipt,
  'site-materials': Package,
  machinery:       Truck,
  subcontractors:  Users,
  'site-ops':      HardHat,
  finance:         Banknote,
  procurement:     ShoppingCart,
  reports:         BarChart3,
  settings:        Settings,
};

// ── Tab Nav Item ──────────────────────────────────────────────────────────────

function TabNavItem({ tab, active, onClick }) {
  const Icon = TAB_ICONS[tab.id] || LayoutDashboard;
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all whitespace-nowrap',
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{tab.label}</span>
    </button>
  );
}

// ── Placeholder for unbuilt tabs ──────────────────────────────────────────────

function TabPlaceholder({ tab }) {
  const Icon = TAB_ICONS[tab.id] || LayoutDashboard;
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 border border-gray-200 mb-4">
        <Icon className="h-7 w-7 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-600">{tab.label}</h3>
      <p className="mt-1 text-sm text-gray-400 max-w-xs">
        {tab.description}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
        Coming soon
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * @param {{ constructionOps?: any, isOpsLoading?: boolean }} props
 */
export function ConstructionHub({ constructionOps, isOpsLoading }) {
  const { business, membership } = useBusiness();
  const { activeTab, goToTab } = useHubTab();
  const [isPending, startTransition] = useTransition();

  // Local state for each tab's data
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [boqItems, setBoqItems] = useState([]);
  const [ipcs, setIpcs] = useState([]);
  const [machineryLogs, setMachineryLogs] = useState([]);
  const [fleetSummary, setFleetSummary] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);

  // Active tab — default to overview
  const currentTabId = activeTab || 'overview';

  // Filter tabs by plan access
  const availableTabs = useMemo(() =>
    CONSTRUCTION_HUB_TABS.filter((t) => !t.featureGate || membership?.hasFeature?.(t.featureGate) !== false),
    [membership]
  );

  // Load projects when on projects/boq/ipc/machinery/site-ops tabs
  useEffect(() => {
    if (!['projects', 'boq', 'ipc', 'machinery', 'site-ops'].includes(currentTabId)) return;
    setProjectsLoading(true);
    getProjectsAction().then((res) => {
      if (res?.success) setProjects(res.projects || []);
      setProjectsLoading(false);
    });
  }, [currentTabId]);

  // Load BOQ items, IPCs, and machinery when a project is selected
  useEffect(() => {
    if (!selectedProject) return;
    Promise.all([
      getBOQItemsAction(selectedProject.id),
      getIPCsAction(selectedProject.id),
      getMachineryLogsAction({ projectId: selectedProject.id, limit: 100 }),
      getMachineryFleetSummaryAction(selectedProject.id),
    ]).then(([boqRes, ipcRes, logRes, fleetRes]) => {
      if (boqRes?.success) setBoqItems(boqRes.boqItems || []);
      if (ipcRes?.success) setIpcs(ipcRes.ipcs || []);
      if (logRes?.success) setMachineryLogs(logRes.logs || []);
      if (fleetRes?.success) setFleetSummary(fleetRes.fleet || []);
    });
  }, [selectedProject]);

  const refreshProjects = () => {
    setProjectsLoading(true);
    getProjectsAction().then((res) => {
      if (res?.success) setProjects(res.projects || []);
      setProjectsLoading(false);
    });
  };

  const refreshProjectDetail = () => {
    if (!selectedProject) return;
    Promise.all([
      getBOQItemsAction(selectedProject.id),
      getIPCsAction(selectedProject.id),
      getMachineryLogsAction({ projectId: selectedProject.id, limit: 100 }),
      getMachineryFleetSummaryAction(selectedProject.id),
    ]).then(([boqRes, ipcRes, logRes, fleetRes]) => {
      if (boqRes?.success) setBoqItems(boqRes.boqItems || []);
      if (ipcRes?.success) setIpcs(ipcRes.ipcs || []);
      if (logRes?.success) setMachineryLogs(logRes.logs || []);
      if (fleetRes?.success) setFleetSummary(fleetRes.fleet || []);
    });
  };

  // ── Render tab content ─────────────────────────────────────────────────────

  function renderTab() {
    switch (currentTabId) {
      case 'overview':
        return (
          <ConstructionDashboard
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
        if (!selectedProject) {
          return (
            <ProjectSelector
              projects={projects}
              isLoading={projectsLoading}
              onSelect={setSelectedProject}
              label="Select a project to view BOQ"
            />
          );
        }
        return (
          <div className="space-y-4">
            <ProjectBreadcrumb project={selectedProject} onBack={() => setSelectedProject(null)} />
            <BOQItemsTable
              projectId={selectedProject.id}
              boqItems={boqItems}
              onRefresh={refreshProjectDetail}
            />
          </div>
        );

      case 'ipc':
        if (!selectedProject) {
          return (
            <ProjectSelector
              projects={projects}
              isLoading={projectsLoading}
              onSelect={setSelectedProject}
              label="Select a project to view IPCs"
            />
          );
        }
        return (
          <div className="space-y-4">
            <ProjectBreadcrumb project={selectedProject} onBack={() => setSelectedProject(null)} />
            <IPCTimeline
              project={selectedProject}
              ipcs={ipcs}
              onRefresh={refreshProjectDetail}
            />
          </div>
        );

      case 'machinery':
        if (!selectedProject) {
          return (
            <ProjectSelector
              projects={projects}
              isLoading={projectsLoading}
              onSelect={setSelectedProject}
              label="Select a project to view machinery logs"
            />
          );
        }
        return (
          <div className="space-y-4">
            <ProjectBreadcrumb project={selectedProject} onBack={() => setSelectedProject(null)} />
            <MachineryLogbook
              projectId={selectedProject.id}
              logs={machineryLogs}
              fleetSummary={fleetSummary}
              onRefresh={refreshProjectDetail}
            />
          </div>
        );

      case 'site-ops':
        if (!selectedProject) {
          return (
            <ProjectSelector
              projects={projects}
              isLoading={projectsLoading}
              onSelect={setSelectedProject}
              label="Select a project to view site operations"
            />
          );
        }
        return (
          <div className="space-y-4">
            <ProjectBreadcrumb project={selectedProject} onBack={() => setSelectedProject(null)} />
            <SiteOperationsHub
              projectId={selectedProject.id}
              onRefresh={refreshProjectDetail}
            />
          </div>
        );

      default: {
        const tab = availableTabs.find((t) => t.id === currentTabId);
        return tab ? <TabPlaceholder tab={tab} /> : null;
      }
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab Navigation — horizontal scroll on mobile */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
          {availableTabs.map((tab) => (
            <TabNavItem
              key={tab.id}
              tab={tab}
              active={currentTabId === tab.id}
              onClick={() => goToTab(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {renderTab()}
      </div>
    </div>
  );
}

// ── Helper Sub-components ─────────────────────────────────────────────────────

function ProjectSelector({ projects, isLoading, onSelect, label }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{label}</p>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border-2 border-dashed border-gray-200">
          <Building2 className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No projects found. Create a project first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="flex flex-col items-start gap-1 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 w-full">
                <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="flex-1 truncate text-sm font-semibold text-gray-800">{p.name}</span>
                <span className={cn(
                  'text-[10px] font-semibold rounded-full px-2 py-0.5 border',
                  p.status === 'ACTIVE' ? 'text-green-700 bg-green-50 border-green-200' :
                  p.status === 'BIDDING' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                  'text-gray-500 bg-gray-50 border-gray-200'
                )}>
                  {p.status}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-mono">{p.code}</span>
              <span className="text-xs text-gray-500">{p.client_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectBreadcrumb({ project, onBack }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onBack}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
        ← All Projects
      </button>
      <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5">
        <Building2 className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-xs font-semibold text-blue-700">{project.name}</span>
        <span className="text-xs text-blue-400 font-mono">({project.code})</span>
      </div>
    </div>
  );
}

export default ConstructionHub;
