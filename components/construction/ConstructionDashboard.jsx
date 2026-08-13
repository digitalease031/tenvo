'use client';

/**
 * Construction Operations Dashboard
 * Shows real-time KPIs for construction-contractor domain.
 * Used in: Easy dashboard Operations tab and hub overview.
 */

import { useMemo } from 'react';
import {
  Building2, Receipt, Lock, Clock, Truck, TrendingUp,
  AlertTriangle, CheckCircle2, Target, Package, Shield,
  TestTube, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(val, currency = 'PKR') {
  if (!val && val !== 0) return '—';
  const n = Number(val);
  if (n >= 1_000_000_000) return `${currency} ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${currency} ${(n / 1_000).toFixed(1)}K`;
  return `${currency} ${n.toLocaleString()}`;
}

function formatNum(val, decimals = 0) {
  if (!val && val !== 0) return '—';
  return Number(val).toFixed(decimals);
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, trend, color = 'blue', alert = false }) {
  const colorMap = {
    blue:   'bg-blue-50   text-blue-600   border-blue-100',
    green:  'bg-green-50  text-green-600  border-green-100',
    amber:  'bg-amber-50  text-amber-600  border-amber-100',
    red:    'bg-red-50    text-red-600    border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    slate:  'bg-slate-50  text-slate-600  border-slate-100',
  };
  const cls = colorMap[color] || colorMap.blue;

  return (
    <div className={cn(
      'relative flex flex-col gap-2 rounded-xl border p-4 bg-white shadow-sm transition-shadow hover:shadow-md',
      alert && 'ring-2 ring-red-200'
    )}>
      <div className="flex items-center justify-between">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg border text-sm', cls)}>
          <Icon className="h-4 w-4" />
        </span>
        {trend !== undefined && (
          <span className={cn('flex items-center gap-0.5 text-xs font-semibold',
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'
          )}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums text-gray-900 leading-tight">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHead({ children }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
      {children}
    </h3>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * @param {{
 *   constructionOps?: {
 *     activeProjects?: number;
 *     totalProjects?: number;
 *     contractValue?: number;
 *     certifiedWork?: number;
 *     retentionHeld?: number;
 *     pendingIpcCount?: number;
 *     totalBoqItems?: number;
 *     machineryHoursThisMonth?: number;
 *     openSafetyIncidents?: number;
 *     failedQualityTests?: number;
 *   };
 *   isLoading?: boolean;
 *   compact?: boolean;
 * }} props
 */
export function ConstructionDashboard({ constructionOps = {}, isLoading = false, compact = false }) {
  const { business } = useBusiness();
  const currency = business?.settings?.financials?.currency || 'PKR';

  const {
    activeProjects = 0,
    totalProjects = 0,
    contractValue = 0,
    certifiedWork = 0,
    retentionHeld = 0,
    pendingIpcCount = 0,
    totalBoqItems = 0,
    machineryHoursThisMonth = 0,
    openSafetyIncidents = 0,
    failedQualityTests = 0,
  } = constructionOps;

  const certifiedPct = contractValue > 0
    ? Math.min(100, ((certifiedWork / contractValue) * 100)).toFixed(1)
    : '0.0';

  const unbilledEstimate = Math.max(0, contractValue - certifiedWork);

  const kpisTop = useMemo(() => [
    {
      icon: Building2,
      label: 'Active Projects',
      value: String(activeProjects),
      sub: `${totalProjects} total`,
      color: 'blue',
    },
    {
      icon: TrendingUp,
      label: 'Total Contract Value',
      value: formatCurrency(contractValue, currency),
      sub: 'Active + DLP projects',
      color: 'blue',
    },
    {
      icon: CheckCircle2,
      label: 'Certified (IPC)',
      value: formatCurrency(certifiedWork, currency),
      sub: `${certifiedPct}% of contract`,
      color: 'green',
    },
    {
      icon: Lock,
      label: 'Retention Held',
      value: formatCurrency(retentionHeld, currency),
      sub: 'Pending DLP release',
      color: 'amber',
    },
  ], [activeProjects, totalProjects, contractValue, certifiedWork, retentionHeld, currency, certifiedPct]);

  const kpisOps = useMemo(() => [
    {
      icon: Clock,
      label: 'Pending IPCs',
      value: String(pendingIpcCount),
      sub: 'Awaiting approval',
      color: pendingIpcCount > 0 ? 'amber' : 'green',
      alert: pendingIpcCount > 3,
    },
    {
      icon: Package,
      label: 'BOQ Items',
      value: String(totalBoqItems),
      sub: 'Across all projects',
      color: 'slate',
    },
    {
      icon: Truck,
      label: 'Fleet Hours (Month)',
      value: `${formatNum(machineryHoursThisMonth, 0)} hrs`,
      sub: 'All equipment',
      color: 'purple',
    },
    {
      icon: Receipt,
      label: 'Unbilled Work',
      value: formatCurrency(unbilledEstimate, currency),
      sub: 'Contract − certified',
      color: unbilledEstimate > contractValue * 0.15 ? 'amber' : 'slate',
      alert: unbilledEstimate > contractValue * 0.15,
    },
  ], [pendingIpcCount, totalBoqItems, machineryHoursThisMonth, unbilledEstimate, contractValue, currency]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(compact ? 4 : 8)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-5', compact && 'space-y-4')}>
      {/* Alerts row */}
      {(openSafetyIncidents > 0 || failedQualityTests > 0) && (
        <div className="flex flex-wrap gap-2">
          {openSafetyIncidents > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              <Shield className="h-3.5 w-3.5" />
              {openSafetyIncidents} open safety incident{openSafetyIncidents > 1 ? 's' : ''} (HIGH/CRITICAL)
            </div>
          )}
          {failedQualityTests > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              <TestTube className="h-3.5 w-3.5" />
              {failedQualityTests} quality test failure{failedQualityTests > 1 ? 's' : ''} (last 30 days)
            </div>
          )}
        </div>
      )}

      {/* Financial KPIs */}
      {!compact && <SectionHead>Financial Overview</SectionHead>}
      <div className={cn(
        'grid gap-3',
        compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'
      )}>
        {kpisTop.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Operational KPIs */}
      {!compact && (
        <>
          <SectionHead>Operations This Month</SectionHead>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpisOps.map((k) => (
              <KpiCard key={k.label} {...k} />
            ))}
          </div>
        </>
      )}

      {/* Progress bar */}
      {!compact && contractValue > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Cumulative IPC Progress
            </span>
            <span className="text-sm font-bold tabular-nums text-gray-700">
              {certifiedPct}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700"
              style={{ width: `${certifiedPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
            <span>Certified: {formatCurrency(certifiedWork, currency)}</span>
            <span>Retention: {formatCurrency(retentionHeld, currency)}</span>
            <span>Contract: {formatCurrency(contractValue, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConstructionDashboard;
