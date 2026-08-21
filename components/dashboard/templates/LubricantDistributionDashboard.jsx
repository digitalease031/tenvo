'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Droplet,
  Truck,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  FileText,
  MapPin,
  CheckCircle,
  Clock,
  ShieldCheck,
  Plus,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function LubricantDistributionDashboard({ businessId, category, onQuickAction }) {
  const [selectedTerritory, setSelectedTerritory] = useState('all');

  const alerts = [
    {
      id: 1,
      type: 'critical',
      title: '7 Customers Exceeded Credit Limits',
      message: 'New orders require manager approval (e.g. ABC Autos outstanding Rs. 570,000 vs Rs. 500,000 limit).',
      action: 'Review Credit Holds',
    },
    {
      id: 2,
      type: 'warning',
      title: '14 Lubricant SKUs Low Stock / Stockout Risk',
      message: 'Shell Helix HX7 10W-40 4L coverage < 7 days based on daily demand.',
      action: 'Create Purchase PO',
    },
    {
      id: 3,
      type: 'warning',
      title: 'Rs. 3.2M Overdue Receivables (> 60 Days)',
      message: 'Follow-up recommended for 12 retail accounts in Gulberg & Kot Lakhpat beat routes.',
      action: 'View Aging Ledger',
    },
    {
      id: 4,
      type: 'info',
      title: 'Van #02 Stock Reconciliation Pending',
      message: 'Salesman Ahmed finished Lahore Route 07 beat visit. 2 cartons physical variance to verify.',
      action: 'Reconcile Van Stock',
    },
  ];

  const principalTargets = [
    { name: 'Shell Lubricants', target: 'Rs 10.0M', actual: 'Rs 8.5M', pct: 85, status: 'Below Target (90% required)' },
    { name: 'Caltex Havoline', target: 'Rs 5.0M', actual: 'Rs 4.6M', pct: 92, status: 'On Track' },
    { name: 'ZIC SK Lubricants', target: 'Rs 6.0M', actual: 'Rs 6.3M', pct: 105, status: 'Target Achieved' },
    { name: 'PSO Lubricants', target: 'Rs 4.0M', actual: 'Rs 3.1M', pct: 77, status: 'Requires Push' },
  ];

  const vanFleets = [
    { id: 'VAN-01', driver: 'Ahmed Raza', route: 'Lahore -> Model Town -> Kot Lakhpat', loadCartons: 45, soldCartons: 38, cashCollected: 'Rs 912,000', status: 'In Transit' },
    { id: 'VAN-02', driver: 'Tariq Mehmood', route: 'Lahore -> Gulberg -> Garden Town', loadCartons: 60, soldCartons: 54, cashCollected: 'Rs 1,296,000', status: 'Pending Reconciliation' },
    { id: 'VAN-03', driver: 'Usman Ali', route: 'Faisalabad -> Clock Tower -> Canal Road', loadCartons: 50, soldCartons: 50, cashCollected: 'Rs 1,200,000', status: 'Reconciled' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header Strip ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Droplet className="w-6 h-6 text-amber-400 fill-amber-400/20" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Distributor Control Center</h1>
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/30">LDMS</Badge>
          </div>
          <p className="text-xs sm:text-sm text-amber-200/80">
            Real-time lubricant distribution intelligence, van stock reconciliation, credit controls & principal targets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => onQuickAction?.('new_order') || toast.success('Opening Sales Order Entry')}
            className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold shadow"
          >
            <Plus className="w-4 h-4 mr-1" /> New Sales Order
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onQuickAction?.('van_reconcile') || toast.success('Opening Van Reconciliation')}
            className="border-amber-400/40 text-amber-100 hover:bg-amber-800/50"
          >
            <Truck className="w-4 h-4 mr-1" /> Van Stock Reconcile
          </Button>
        </div>
      </div>

      {/* ── KPI Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-slate-500 flex items-center justify-between">
              TOTAL MONTHLY SALES
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-slate-900">
              Rs 52,450,000
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-emerald-600 font-medium">+12.4% vs last month • Margin 14.8%</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-slate-500 flex items-center justify-between">
              RECEIVABLES (UDHAAR)
              <CreditCard className="w-4 h-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-slate-900">
              Rs 18,320,000
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-amber-600 font-medium">Rs 3.2M Overdue (&gt;60 days) • 7 Hold</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-slate-500 flex items-center justify-between">
              VAN IN-TRANSIT STOCK
              <Truck className="w-4 h-4 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-slate-900">
              155 Cartons
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-blue-600 font-medium">3 Vans active • Rs 3.41M total value</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-slate-500 flex items-center justify-between">
              COLLECTIONS TODAY
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-slate-900">
              Rs 3,408,000
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-slate-500">Cash: Rs 2.1M • PDC Cheques: Rs 1.3M</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Proactive Control Center Alerts ─────────────────────────────── */}
      <Card className="border border-amber-200/60 bg-amber-50/30">
        <CardHeader className="p-4 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-base text-slate-900 font-semibold">Proactive Control Center Signals</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs bg-white text-slate-600">
              {alerts.length} Active Signals
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3 ${
                alert.type === 'critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : alert.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      alert.type === 'critical' ? 'bg-rose-600' : alert.type === 'warning' ? 'bg-amber-600' : 'bg-blue-600'
                    }`}
                  />
                  {alert.title}
                </div>
                <p className="text-xs text-slate-600 pl-4">{alert.message}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.success(`Triggered: ${alert.action}`)}
                className="self-start sm:self-center text-xs whitespace-nowrap bg-white hover:bg-slate-50 border-slate-300"
              >
                {alert.action}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Principal Targets & Van Fleet Status ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Principal Target Tracker */}
        <Card className="border shadow-sm">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span>Principal Target vs Achievement</span>
              <Badge variant="secondary" className="text-xs">Monthly</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Distributor sales volume against principal targets and scheme rebates.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {principalTargets.map((item) => (
              <div key={item.name} className="space-y-1.5 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.name}</span>
                  <span className="text-slate-600 tabular-nums">
                    {item.actual} / {item.target} ({item.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      item.pct >= 100 ? 'bg-emerald-500' : item.pct >= 90 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(item.pct, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">{item.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mobile Van Fleet & Beat Route Tracker */}
        <Card className="border shadow-sm">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span>Mobile Van Stock & Beat Routes</span>
              <Badge variant="outline" className="text-xs">Today</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Daily van loads, doorstep sales, cash collection & end-of-day reconciliation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {vanFleets.map((van) => (
              <div key={van.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-xs text-slate-900">{van.id} — {van.driver}</span>
                  </div>
                  <Badge
                    className={`text-[10px] ${
                      van.status === 'Reconciled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : van.status === 'Pending Reconciliation'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {van.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {van.route}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Stock: {van.soldCartons} / {van.loadCartons} Cartons Sold</span>
                  <span className="font-semibold text-slate-800">{van.cashCollected}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
