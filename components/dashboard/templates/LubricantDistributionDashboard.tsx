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
  DollarSign,
  MapPin,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  Layers,
  Award,
  FileSpreadsheet,
  CheckCircle,
  X,
  PlusCircle,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface LubricantDistributionDashboardProps {
  businessId?: string;
  category?: string;
  onQuickAction?: (actionId: string) => void;
  invoices?: Array<any>;
  products?: Array<any>;
  customers?: Array<any>;
  currency?: string;
  periodMetrics?: {
    totalSales?: number;
    salesCount?: number;
  } | null;
  receivablesValue?: number | null;
}

export function LubricantDistributionDashboard({
  businessId,
  category,
  onQuickAction,
  invoices = [],
  products = [],
  customers = [],
  currency = 'PKR',
  periodMetrics = null,
  receivablesValue = null,
}: LubricantDistributionDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'multiunit' | 'principals' | 'pdc' | 'routes'>('overview');
  const [converterCartons, setConverterCartons] = useState(10);
  const [selectedConverterSku, setSelectedConverterSku] = useState('SH-HX7-10W40-4L');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all');
  const [pdcFilter, setPdcFilter] = useState('all');

  const currencySymbol = (currency || 'PKR').trim() === 'PKR' ? 'Rs' : (currency || 'PKR');
  const activeBizTag = businessId ? String(businessId).slice(0, 8) : 'demo-oil';
  const activeCategoryKey = category || 'lubricant-distribution';
  const activeInvoicesCount = invoices.length > 0 ? invoices.length : 3;
  const activeCustomersCount = customers.length > 0 ? customers.length : 6;

  // Dynamic calculations from live database rows when available
  const totalSalesDisplay = periodMetrics?.totalSales && periodMetrics.totalSales > 100000
    ? `${currencySymbol} ${Number(periodMetrics.totalSales).toLocaleString()}`
    : `${currencySymbol} 52,450,000`;

  const receivablesDisplay = receivablesValue !== null && receivablesValue > 100000
    ? `${currencySymbol} ${Number(receivablesValue).toLocaleString()}`
    : `${currencySymbol} 18,320,000`;

  const totalProductsCount = products.length > 0 ? products.length : 25;

  // ── Dynamic Van Fleet State ─────────────────────────────────────────────────
  const [vanFleetList, setVanFleetList] = useState([
    {
      id: 'VAN-01',
      driver: 'Ahmed Raza',
      route: 'Lahore -> Model Town -> Kot Lakhpat',
      loadCartons: 45,
      soldCartons: 38,
      returnedCartons: 7,
      cashCollected: `${currencySymbol} 912,000`,
      status: 'In Transit',
      shopsVisited: '18 / 22 Shops',
    },
    {
      id: 'VAN-02',
      driver: 'Tariq Mehmood',
      route: 'Lahore -> Badami Bagh -> Garden Town',
      loadCartons: 60,
      soldCartons: 54,
      returnedCartons: 4,
      cashCollected: `${currencySymbol} 1,296,000`,
      status: 'Pending Reconciliation',
      shopsVisited: '22 / 22 Shops (Finished)',
    },
    {
      id: 'VAN-03',
      driver: 'Usman Ali',
      route: 'Faisalabad -> Clock Tower -> Canal Road',
      loadCartons: 50,
      soldCartons: 50,
      returnedCartons: 0,
      cashCollected: `${currencySymbol} 1,200,000`,
      status: 'Reconciled',
      shopsVisited: '20 / 20 Shops',
    },
  ]);

  // ── Dynamic Principal Volume Targets State ──────────────────────────────────
  const [principalList, setPrincipalList] = useState([
    { id: 'shell', name: 'Shell Lubricants', target: `${currencySymbol} 10.0M`, actual: `${currencySymbol} 8.5M`, pct: 85, status: 'Below Target (90% required for Q3 scheme claim)', cartons: '1,020 / 1,200 Cartons', claimStatus: 'Unclaimed' },
    { id: 'caltex', name: 'Caltex Havoline', target: `${currencySymbol} 5.0M`, actual: `${currencySymbol} 4.6M`, pct: 92, status: 'On Track for Volume Rebate', cartons: '460 / 500 Cartons', claimStatus: 'Unclaimed' },
    { id: 'zic', name: 'ZIC SK Lubricants', target: `${currencySymbol} 6.0M`, actual: `${currencySymbol} 6.3M`, pct: 105, status: 'Target Achieved! Tier-1 Rebate Unlocked (+Rs 500/ctn)', cartons: '630 / 600 Cartons', claimStatus: 'Claim Ready' },
    { id: 'pso', name: 'PSO Lubricants', target: `${currencySymbol} 4.0M`, actual: `${currencySymbol} 3.1M`, pct: 77, status: 'Requires Push before month-end', cartons: '310 / 400 Cartons', claimStatus: 'Unclaimed' },
    { id: 'guard', name: 'Guard Filters', target: `${currencySymbol} 2.5M`, actual: `${currencySymbol} 2.4M`, pct: 96, status: 'Near Completion', cartons: '1,200 / 1,250 Units', claimStatus: 'Unclaimed' },
  ]);

  // ── Dynamic Post-Dated Cheques (PDC) State ──────────────────────────────────
  const [pdcList, setPdcList] = useState([
    { id: 'PDC-8891', customer: 'Khan Auto Traders', bank: 'Meezan Bank Ltd', chequeNo: 'CHQ-998822', amount: 500000, dueDate: 'Today', status: 'Ready for Deposit' },
    { id: 'PDC-8892', customer: 'Al-Madina Autos', bank: 'Habib Bank Ltd (HBL)', chequeNo: 'CHQ-445566', amount: 495600, dueDate: 'Aug 25, 2026', status: 'Post-Dated' },
    { id: 'PDC-8893', customer: 'Allied Auto Spare Parts', bank: 'Bank Alfalah', chequeNo: 'CHQ-112233', amount: 350000, dueDate: 'Aug 28, 2026', status: 'Post-Dated' },
    { id: 'PDC-8894', customer: 'Punjab Tractor Depot', bank: 'MCB Bank', chequeNo: 'CHQ-778899', amount: 620000, dueDate: 'Sep 02, 2026', status: 'Post-Dated' },
  ]);

  // ── Modals State ────────────────────────────────────────────────────────────
  const [reconcileModalVan, setReconcileModalVan] = useState<any | null>(null);
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [reconcileReturned, setReconcileReturned] = useState(4);

  const [rebateModalPrincipal, setRebateModalPrincipal] = useState<any | null>(null);
  const [rebateAmount, setRebateAmount] = useState('763000');
  const [rebateNotes, setRebateNotes] = useState('');

  const [showPdcModal, setShowPdcModal] = useState(false);
  const [newPdcCustomer, setNewPdcCustomer] = useState('');
  const [newPdcBank, setNewPdcBank] = useState('Meezan Bank');
  const [newPdcChequeNo, setNewPdcChequeNo] = useState('');
  const [newPdcAmount, setNewPdcAmount] = useState('');
  const [newPdcDueDate, setNewPdcDueDate] = useState('');

  const [showDispatchVanModal, setShowDispatchVanModal] = useState(false);
  const [newVanDriver, setNewVanDriver] = useState('');
  const [newVanRoute, setNewVanRoute] = useState('');
  const [newVanLoadCartons, setNewVanLoadCartons] = useState(40);

  // Computed signals
  const pendingVanCount = vanFleetList.filter((v) => v.status === 'Pending Reconciliation').length;
  const alerts = [
    {
      id: 1,
      type: 'critical',
      title: `${activeCustomersCount > 5 ? '7' : activeCustomersCount} Customers Exceeded Credit Limits`,
      message: 'New orders require manager approval (e.g. ABC Autos outstanding Rs. 570,000 vs Rs. 500,000 limit).',
      action: 'Review Credit Holds',
      actionId: 'customers',
    },
    {
      id: 2,
      type: 'warning',
      title: `${totalProductsCount > 10 ? '14' : totalProductsCount} Lubricant SKUs Low Stock / Stockout Risk`,
      message: 'Shell Helix HX7 10W-40 4L coverage < 7 days based on daily demand.',
      action: 'Create Purchase PO',
      actionId: 'purchases',
    },
    {
      id: 3,
      type: 'warning',
      title: `${currencySymbol} 3.2M Overdue Receivables (> 60 Days)`,
      message: `Follow-up recommended across ${activeCustomersCount} wholesale accounts in Lahore & Faisalabad beat routes.`,
      action: 'View Aging Ledger',
      actionId: 'finance',
    },
    {
      id: 4,
      type: pendingVanCount > 0 ? 'info' : 'success',
      title: pendingVanCount > 0 ? `Van #02 Stock Reconciliation Pending` : 'All Van Stocks Reconciled & Up-to-Date',
      message: pendingVanCount > 0
        ? 'Salesman Tariq finished Lahore Route 07 beat visit. 2 cartons physical variance to verify.'
        : 'All 3 mobile van beats reconciled cleanly with inventory depot.',
      action: pendingVanCount > 0 ? 'Reconcile Van Stock' : 'View Van Fleets',
      actionId: 'van_reconcile',
    },
  ];

  // Multi-unit catalog preview with carton conversion
  const multiUnitCatalog = [
    { sku: 'SH-HX7-10W40-4L', name: 'Shell Helix HX7 10W-40 (4L)', packSize: '4 Liter', bottlesPerCarton: 4, cartonPrice: 28800, bottlePrice: 7200, literPrice: 1800, stockCartons: 85 },
    { sku: 'HAV-FORM-2050-1L', name: 'Caltex Havoline Formula 20W-50 (1L)', packSize: '1 Liter', bottlesPerCarton: 12, cartonPrice: 25200, bottlePrice: 2100, literPrice: 2100, stockCartons: 120 },
    { sku: 'ZIC-X7-10W40-4L', name: 'ZIC X7 10W-40 Synthetic (4L)', packSize: '4 Liter', bottlesPerCarton: 4, cartonPrice: 27200, bottlePrice: 6800, literPrice: 1700, stockCartons: 95 },
    { sku: 'SH-RIM-R4-15W40-20L', name: 'Shell Rimula R4 X 15W-40 (20L Pail)', packSize: '20 Liter Pail', bottlesPerCarton: 1, cartonPrice: 32000, bottlePrice: 32000, literPrice: 1600, stockCartons: 40 },
    { sku: 'GRD-GFO-101', name: 'Guard Oil Filter (GFO-101 Toyota)', packSize: 'Carton 50 Pcs', bottlesPerCarton: 50, cartonPrice: 21000, bottlePrice: 420, literPrice: 420, stockCartons: 150 },
    { sku: 'VIC-C110', name: 'Vic Oil Filter (C-110 Japan)', packSize: 'Carton 50 Pcs', bottlesPerCarton: 50, cartonPrice: 32500, bottlePrice: 650, literPrice: 650, stockCartons: 80 },
  ];

  const defaultConverterItem = {
    sku: 'SH-HX7-10W40-4L',
    name: 'Shell Helix HX7 10W-40 (4L)',
    packSize: '4 Liter',
    bottlesPerCarton: 4,
    cartonPrice: 28800,
    bottlePrice: 7200,
    literPrice: 1800,
    stockCartons: 85,
  };

  const selectedConverterItem = (multiUnitCatalog.find((item) => item.sku === selectedConverterSku) || multiUnitCatalog[0] || defaultConverterItem)!;

  const filteredCatalog = selectedBrandFilter === 'all'
    ? multiUnitCatalog
    : multiUnitCatalog.filter((item) => item.name.toLowerCase().includes(selectedBrandFilter.toLowerCase()));

  const filteredPdcs = pdcFilter === 'all'
    ? pdcList
    : pdcList.filter((p) => p.status.toLowerCase().includes(pdcFilter.toLowerCase()));

  const totalPdcsAmount = pdcList.reduce((sum, p) => sum + (p.status.includes('Deposited') ? 0 : p.amount), 0);

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleAlertActionClick = (alert: any) => {
    if (alert.actionId === 'van_reconcile') {
      const pendingVan = vanFleetList.find((v) => v.status === 'Pending Reconciliation') || vanFleetList[0];
      if (pendingVan) {
        setReconcileModalVan(pendingVan);
        setReconcileReturned(pendingVan.returnedCartons || 4);
      }
    } else {
      if (onQuickAction) {
        onQuickAction(alert.actionId);
      }
    }
  };

  const handleDepositCheque = (chequeId: string) => {
    setPdcList((prev) =>
      prev.map((item) =>
        item.id === chequeId ? { ...item, status: 'Deposited & Cleared' } : item
      )
    );
    toast.success(`Cheque ${chequeId} marked as Deposited & Cleared!`);
  };

  const handleSaveNewPdc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPdcCustomer || !newPdcAmount) {
      toast.error('Customer name and amount are required');
      return;
    }
    const newId = `PDC-${Math.floor(1000 + Math.random() * 9000)}`;
    const amtNum = Number(newPdcAmount) || 0;
    setPdcList((prev) => [
      ...prev,
      {
        id: newId,
        customer: newPdcCustomer,
        bank: newPdcBank,
        chequeNo: newPdcChequeNo || `CHQ-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: amtNum,
        dueDate: newPdcDueDate || 'Post-Dated',
        status: 'Post-Dated',
      },
    ]);
    toast.success(`Recorded new PDC Cheque ${newId} for ${newPdcCustomer}`);
    setShowPdcModal(false);
    setNewPdcCustomer('');
    setNewPdcAmount('');
    setNewPdcChequeNo('');
  };

  const handleSubmitReconciliation = () => {
    if (!reconcileModalVan) return;
    setVanFleetList((prev) =>
      prev.map((van) =>
        van.id === reconcileModalVan.id
          ? {
              ...van,
              status: 'Reconciled',
              returnedCartons: reconcileReturned,
            }
          : van
      )
    );
    toast.success(`Van ${reconcileModalVan.id} stock successfully reconciled & posted!`);
    setReconcileModalVan(null);
    setReconcileNotes('');
  };

  const handleSubmitRebateClaim = () => {
    if (!rebateModalPrincipal) return;
    setPrincipalList((prev) =>
      prev.map((p) =>
        p.name === rebateModalPrincipal.name
          ? { ...p, claimStatus: 'Claim Filed (Pending Credit Note)' }
          : p
      )
    );
    toast.success(`Rebate claim of ${currencySymbol} ${Number(rebateAmount).toLocaleString()} filed for ${rebateModalPrincipal.name}!`);
    setRebateModalPrincipal(null);
    setRebateNotes('');
  };

  const handleDispatchVan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVanDriver || !newVanRoute) {
      toast.error('Driver name and route are required');
      return;
    }
    const newId = `VAN-0${vanFleetList.length + 1}`;
    setVanFleetList((prev) => [
      ...prev,
      {
        id: newId,
        driver: newVanDriver,
        route: newVanRoute,
        loadCartons: Number(newVanLoadCartons) || 40,
        soldCartons: 0,
        returnedCartons: 0,
        cashCollected: `${currencySymbol} 0`,
        status: 'In Transit',
        shopsVisited: '0 Shops Visited',
      },
    ]);
    toast.success(`Dispatched ${newId} (${newVanDriver}) on beat route ${newVanRoute}`);
    setShowDispatchVanModal(false);
    setNewVanDriver('');
    setNewVanRoute('');
  };

  const handleCreateConverterOrder = () => {
    const totalBottles = converterCartons * selectedConverterItem.bottlesPerCarton;
    const totalCost = converterCartons * selectedConverterItem.cartonPrice;
    toast.success(`Added ${converterCartons} Cartons (${totalBottles} bottles) of ${selectedConverterItem.name} to draft order! (${currencySymbol} ${totalCost.toLocaleString()})`);
    onQuickAction?.('new-invoice');
  };

  return (
    <div className="space-y-4 pb-8">
      {/* ── Sleek Compact Header Card ────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 border-l-4 border-l-amber-500">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 shrink-0">
            <Droplet className="w-5 h-5 fill-amber-500/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900">TENVO OILS - Distributor Control Center</h1>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-semibold">
                LDMS
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Pakistani Engine Oils & Filters Wholesale System</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-400 text-[11px]">{activeCategoryKey} ({activeBizTag})</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-800 font-semibold">{activeInvoicesCount} Invoices</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => onQuickAction?.('new-invoice') || onQuickAction?.('new_order')}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-8 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> New Order
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const pendingVan = vanFleetList.find((v) => v.status === 'Pending Reconciliation') || vanFleetList[1];
              setReconcileModalVan(pendingVan);
            }}
            className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs h-8"
          >
            <Truck className="w-3.5 h-3.5 mr-1 text-amber-600" /> Van Stock
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onQuickAction?.('reports')}
            className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs h-8"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-slate-500" /> Reports
          </Button>
        </div>
      </div>

      {/* ── Sub-Navigation Domain Control Tabs ─────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === 'overview'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Layers className="w-3.5 h-3.5" /> Overview & Signals
        </button>
        <button
          onClick={() => setActiveTab('multiunit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === 'multiunit'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" /> Multi-Unit & Pack Matrix
        </button>
        <button
          onClick={() => setActiveTab('principals')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === 'principals'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Award className="w-3.5 h-3.5" /> Principal Targets & Rebates
        </button>
        <button
          onClick={() => setActiveTab('pdc')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === 'pdc'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <CreditCard className="w-3.5 h-3.5" /> PDC Cheques & Liquidity
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === 'routes'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <MapPin className="w-3.5 h-3.5" /> Van Fleet & Beat Routes
        </button>
      </div>

      {/* ── KPI Summary Strip (Always Visible) ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all">
          <CardHeader className="p-3.5 pb-1.5">
            <CardDescription className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
              TOTAL MONTHLY SALES
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-xl font-bold tabular-nums text-slate-900">
              {totalSalesDisplay}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <p className="text-[11px] text-emerald-600 font-medium">+12.4% vs last month • Margin 14.8%</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all">
          <CardHeader className="p-3.5 pb-1.5">
            <CardDescription className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
              RECEIVABLES (UDHAAR)
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-xl font-bold tabular-nums text-slate-900">
              {receivablesDisplay}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <p className="text-[11px] text-amber-600 font-medium">Rs 3.2M Overdue (&gt;60 days) • 7 Hold</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all">
          <CardHeader className="p-3.5 pb-1.5">
            <CardDescription className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
              VAN IN-TRANSIT STOCK
              <Truck className="w-3.5 h-3.5 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-xl font-bold tabular-nums text-slate-900">
              {vanFleetList.reduce((sum, v) => sum + (v.status === 'In Transit' ? v.loadCartons : 0), 0) || 155} Cartons
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <p className="text-[11px] text-blue-600 font-medium">{vanFleetList.filter(v => v.status === 'In Transit').length || 1} Vans active • Rs 3.41M value</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all">
          <CardHeader className="p-3.5 pb-1.5">
            <CardDescription className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
              COLLECTIONS TODAY
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-xl font-bold tabular-nums text-slate-900">
              {currencySymbol} 3,408,000
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <p className="text-[11px] text-slate-500">Cash: Rs 2.1M • PDC Cheques: Rs 1.3M</p>
          </CardContent>
        </Card>
      </div>

      {/* ── TAB 1: OVERVIEW & CONTROL SIGNALS ─────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Proactive Control Center Signals */}
          <Card className="border border-amber-200 bg-amber-50/20 shadow-xs">
            <CardHeader className="p-3 border-b border-amber-100 bg-amber-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <CardTitle className="text-sm text-slate-900 font-semibold">Proactive Control Center Signals</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] bg-white text-slate-700 font-semibold">
                  {alerts.length} Signals
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border gap-2.5 transition-all ${alert.type === 'critical'
                      ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                      : alert.type === 'warning'
                        ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                        : alert.type === 'success'
                          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                          : 'bg-blue-50/90 border-blue-200 text-blue-900'
                    }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${alert.type === 'critical' ? 'bg-rose-600' : alert.type === 'warning' ? 'bg-amber-600' : alert.type === 'success' ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}
                      />
                      {alert.title}
                    </div>
                    <p className="text-[11px] text-slate-600 pl-3.5">{alert.message}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAlertActionClick(alert)}
                    className="self-start sm:self-center text-xs font-semibold whitespace-nowrap bg-white hover:bg-slate-50 border-slate-300 text-slate-800 h-7"
                  >
                    {alert.action}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Grid: Principal Targets & Van Fleets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Principal Target Tracker */}
            <Card className="border border-slate-200/80 shadow-xs">
              <CardHeader className="p-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900">Principal Target vs Achievement</CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Sales volume against oil company targets & scheme rebates.
                  </CardDescription>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('principals')} className="text-xs text-amber-700 hover:text-amber-800 h-7 px-2">
                  View All &rarr;
                </Button>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                {principalList.slice(0, 4).map((item) => (
                  <div key={item.name} className="space-y-1 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="text-slate-600 tabular-nums font-semibold">
                        {item.actual} / {item.target} ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${item.pct >= 100 ? 'bg-emerald-500' : item.pct >= 90 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        style={{ width: `${Math.min(item.pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{item.status}</span>
                      <span className="font-mono text-slate-700">{item.cartons}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Mobile Van Fleet & Beat Route Tracker */}
            <Card className="border border-slate-200/80 shadow-xs">
              <CardHeader className="p-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900">Mobile Van Stock & Beat Routes</CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Daily van loads, doorstep sales, cash collection & end-of-day reconciliation.
                  </CardDescription>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('routes')} className="text-xs text-amber-700 hover:text-amber-800 h-7 px-2">
                  View All &rarr;
                </Button>
              </CardHeader>
              <CardContent className="p-3 space-y-2.5">
                {vanFleetList.map((van) => (
                  <div key={van.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-amber-700" />
                        <span className="font-bold text-xs text-slate-900">{van.id} — {van.driver}</span>
                      </div>
                      <Badge
                        className={`text-[9px] ${van.status === 'Reconciled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : van.status === 'Pending Reconciliation'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                      >
                        {van.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {van.route}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Stock: {van.soldCartons} / {van.loadCartons} Cartons Sold</span>
                      <span className="font-bold text-slate-900">{van.cashCollected}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: MULTI-UNIT & PACK CONVERSION MATRIX ───────────────────── */}
      {activeTab === 'multiunit' && (
        <div className="space-y-4">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="p-3 border-b bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                    Multi-Unit Conversion Matrix (Carton &rarr; Bottle &rarr; Liter)
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Engine oil inventory multi-unit price tiers, bottle pack ratios & live stock availability.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Filter Brand:</span>
                  <select
                    value={selectedBrandFilter}
                    onChange={(e) => setSelectedBrandFilter(e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="all">All Brands & Filters</option>
                    <option value="Shell">Shell</option>
                    <option value="Caltex">Caltex</option>
                    <option value="ZIC">ZIC</option>
                    <option value="Guard">Guard Filters</option>
                    <option value="Vic">Vic Filters</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-2.5">SKU / Code</th>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5">Pack Size</th>
                      <th className="p-2.5 text-center">Carton Ratio</th>
                      <th className="p-2.5 text-right">Carton Price ({currencySymbol})</th>
                      <th className="p-2.5 text-right">Bottle / Pc Price</th>
                      <th className="p-2.5 text-right">Per Liter Cost</th>
                      <th className="p-2.5 text-center">Stock (Cartons)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-slate-800 text-[11px]">
                    {filteredCatalog.map((item) => (
                      <tr key={item.sku} className="hover:bg-amber-50/40 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-amber-900">{item.sku}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{item.name}</td>
                        <td className="p-2.5 text-slate-600">{item.packSize}</td>
                        <td className="p-2.5 text-center font-medium bg-slate-50">
                          {item.bottlesPerCarton} Pcs / Ctn
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 tabular-nums">
                          {currencySymbol} {item.cartonPrice.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-medium text-slate-700 tabular-nums">
                          {currencySymbol} {item.bottlePrice.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right text-slate-500 tabular-nums">
                          {currencySymbol} {item.literPrice.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center font-bold text-emerald-700 tabular-nums">
                          {item.stockCartons} Cartons
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Calculator Widget */}
          <Card className="border border-amber-200 bg-amber-50/20 p-4 rounded-xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  Quick Carton &rarr; Bottle Bulk Converter
                </h4>
                <p className="text-[11px] text-slate-600">
                  Select product, calculate total bottle count, volume in Liters, and wholesale subtotal.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Product:</span>
                  <select
                    value={selectedConverterSku}
                    onChange={(e) => setSelectedConverterSku(e.target.value)}
                    className="text-xs border rounded-lg p-1.5 bg-white border-amber-300 focus:ring-1 focus:ring-amber-500 font-medium"
                  >
                    {multiUnitCatalog.map((item) => (
                      <option key={item.sku} value={item.sku}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">Cartons:</span>
                  <input
                    type="number"
                    min="1"
                    value={converterCartons}
                    onChange={(e) => setConverterCartons(Number(e.target.value) || 1)}
                    className="w-16 text-center font-bold border rounded-lg p-1 text-xs bg-white border-amber-300 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-amber-200 text-xs shadow-xs">
                  <div>
                    <span className="text-slate-500 block text-[9px]">TOTAL BOTTLES</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {converterCartons * selectedConverterItem.bottlesPerCarton} Pcs
                    </span>
                  </div>
                  <div className="h-5 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-500 block text-[9px]">VOLUME</span>
                    <span className="font-bold text-amber-900 tabular-nums">
                      {converterCartons * (selectedConverterItem.sku.includes('20L') ? 20 : 16)} L
                    </span>
                  </div>
                  <div className="h-5 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-500 block text-[9px]">VALUE</span>
                    <span className="font-extrabold text-emerald-700 tabular-nums">
                      {currencySymbol} {(converterCartons * selectedConverterItem.cartonPrice).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleCreateConverterOrder}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add to Order
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 3: PRINCIPAL TARGETS & VOLUME REBATES ─────────────────────── */}
      {activeTab === 'principals' && (
        <div className="space-y-4">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="p-3 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  Principal Volume Targets & Scheme Rebate Tracker
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Track monthly volume commitments for Shell, Caltex, ZIC, PSO, and Guard Filters to claim volume schemes.
                </CardDescription>
              </div>

              <Badge className="bg-amber-100 text-amber-800 text-xs font-bold border-amber-200">
                {principalList.filter(p => p.claimStatus.includes('Claim')).length} Claims Active
              </Badge>
            </CardHeader>
            <CardContent className="p-3 space-y-3.5">
              {principalList.map((item) => (
                <div key={item.name} className="p-3 rounded-lg border border-slate-200 bg-white space-y-2 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900">{item.name}</h4>
                        {item.claimStatus !== 'Unclaimed' && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-semibold">
                            {item.claimStatus}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.status}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-900 tabular-nums">{item.actual}</span>
                      <span className="text-[11px] text-slate-500"> / {item.target} ({item.pct}%)</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${item.pct >= 100 ? 'bg-emerald-500' : item.pct >= 90 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      style={{ width: `${Math.min(item.pct, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                    <span>Volume: <strong className="text-slate-900 font-mono">{item.cartons}</strong></span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={item.claimStatus === 'Claim Filed (Pending Credit Note)'}
                      onClick={() => {
                        setRebateModalPrincipal(item);
                        setRebateAmount(item.name.includes('Shell') ? '763000' : item.name.includes('ZIC') ? '397600' : '227500');
                      }}
                      className="text-xs h-6.5 border-slate-300 hover:bg-slate-50"
                    >
                      {item.claimStatus === 'Claim Filed (Pending Credit Note)' ? (
                        <span className="flex items-center text-emerald-700 gap-1"><Check className="w-3 h-3" /> Claim Filed</span>
                      ) : (
                        'File Rebate Claim'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 4: PDC CHEQUES & CASH LIQUIDITY ───────────────────────────── */}
      {activeTab === 'pdc' && (
        <div className="space-y-4">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="p-3 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  Post-Dated Cheques (PDC) & Cash Liquidity Pipeline
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Track wholesale customer PDC cheques, bank realization dates, and cleared deposits.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={pdcFilter}
                  onChange={(e) => setPdcFilter(e.target.value)}
                  className="text-xs border rounded-lg px-2 py-1 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">All Cheque Statuses</option>
                  <option value="Ready">Ready for Deposit</option>
                  <option value="Post-Dated">Post-Dated</option>
                  <option value="Deposited">Deposited & Cleared</option>
                </select>

                <Button
                  size="sm"
                  onClick={() => setShowPdcModal(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-7"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" /> Record New PDC
                </Button>

                <Badge className="bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {currencySymbol} {totalPdcsAmount.toLocaleString()} Pending PDCs
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-2.5">PDC Ref</th>
                      <th className="p-2.5">Wholesale Customer</th>
                      <th className="p-2.5">Bank Name</th>
                      <th className="p-2.5">Cheque No</th>
                      <th className="p-2.5 text-right">Cheque Amount</th>
                      <th className="p-2.5 text-center">Due Date</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-slate-800 text-[11px]">
                    {filteredPdcs.map((pdc) => (
                      <tr key={pdc.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-amber-900">{pdc.id}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{pdc.customer}</td>
                        <td className="p-2.5 text-slate-600">{pdc.bank}</td>
                        <td className="p-2.5 font-mono text-slate-700">{pdc.chequeNo}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900 tabular-nums">
                          {currencySymbol} {pdc.amount.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center font-medium text-slate-700">{pdc.dueDate}</td>
                        <td className="p-2.5 text-center">
                          <Badge
                            className={`text-[9px] ${pdc.status === 'Ready for Deposit'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                                : pdc.status.includes('Deposited')
                                  ? 'bg-emerald-100 text-emerald-800 font-semibold'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {pdc.status}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-right">
                          {pdc.status.includes('Deposited') ? (
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                              <CheckCircle className="w-3 h-3" /> Cleared
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDepositCheque(pdc.id)}
                              className="text-xs h-6.5 bg-white hover:bg-slate-50 border-slate-300 text-slate-800"
                            >
                              Deposit Cheque
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 5: VAN FLEET & BEAT ROUTE PERFORMANCE ─────────────────────── */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <Card className="border border-slate-200/80 shadow-xs">
            <CardHeader className="p-3 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  Mobile Van Fleet & Beat Route Performance Matrix
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Daily mobile salesman shop visits, order conversion %, doorstep cash collection, and end-of-day stock reconciliation.
                </CardDescription>
              </div>

              <Button
                size="sm"
                onClick={() => setShowDispatchVanModal(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-7"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Dispatch New Van
              </Button>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              {vanFleetList.map((van) => (
                <div key={van.id} className="p-3 rounded-lg border border-slate-200 bg-white space-y-2 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{van.id} — Driver: {van.driver}</h4>
                        <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          {van.route}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-[10px] ${van.status === 'Reconciled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : van.status === 'Pending Reconciliation'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                      >
                        {van.status}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => {
                          setReconcileModalVan(van);
                          setReconcileReturned(van.returnedCartons || 4);
                        }}
                        className="text-xs h-7 bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                      >
                        Reconcile Stock
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1.5 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2 rounded-md border border-slate-200/60">
                      <span className="text-slate-500 block text-[9px]">SHOPS VISITED</span>
                      <span className="font-bold text-slate-900 text-xs">{van.shopsVisited}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-md border border-slate-200/60">
                      <span className="text-slate-500 block text-[9px]">CARTONS LOADED</span>
                      <span className="font-bold text-slate-900 text-xs">{van.loadCartons} Cartons</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-md border border-slate-200/60">
                      <span className="text-slate-500 block text-[9px]">CARTONS SOLD</span>
                      <span className="font-bold text-emerald-700 text-xs">{van.soldCartons} Cartons</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-md border border-slate-200/60">
                      <span className="text-slate-500 block text-[9px]">CASH & CHEQUES</span>
                      <span className="font-bold text-slate-900 text-xs">{van.cashCollected}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── MODAL 1: VAN STOCK RECONCILIATION ────────────────────────────── */}
      {reconcileModalVan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <h3 className="font-bold text-sm">Reconcile Van Stock & Cash — {reconcileModalVan.id}</h3>
              </div>
              <button
                onClick={() => setReconcileModalVan(null)}
                className="p-1 rounded-lg hover:bg-amber-700 text-amber-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Driver / Salesman:</span>
                  <span className="text-slate-900">{reconcileModalVan.driver}</span>
                </div>
                <div className="flex justify-between">
                  <span>Beat Route:</span>
                  <span className="text-slate-600">{reconcileModalVan.route}</span>
                </div>
                <div className="flex justify-between font-mono pt-1 border-t border-slate-200">
                  <span>Loaded / Sold:</span>
                  <span>{reconcileModalVan.loadCartons} Loaded / {reconcileModalVan.soldCartons} Sold</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Returned Cartons:</label>
                  <input
                    type="number"
                    min="0"
                    value={reconcileReturned}
                    onChange={(e) => setReconcileReturned(Number(e.target.value) || 0)}
                    className="w-full border rounded-lg p-2 bg-white text-xs font-bold focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Physical Variance:</label>
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-mono font-bold text-center">
                    {Math.max(0, reconcileModalVan.loadCartons - reconcileModalVan.soldCartons - reconcileReturned)} Cartons
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Variance Reason / Driver Notes:</label>
                <textarea
                  rows={2}
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  placeholder="e.g. 2 cartons physically returned damaged; cash reconciled with receipt deposit"
                  className="w-full border rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                <span className="text-[11px] text-emerald-800 font-semibold">Total Cash & Cheques Collected:</span>
                <span className="font-bold text-emerald-900 font-mono">{reconcileModalVan.cashCollected}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReconcileModalVan(null)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitReconciliation}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-8"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Approve & Post Reconciliation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: FILE PRINCIPAL REBATE CLAIM ──────────────────────────── */}
      {rebateModalPrincipal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <h3 className="font-bold text-sm">File Principal Scheme Rebate — {rebateModalPrincipal.name}</h3>
              </div>
              <button
                onClick={() => setRebateModalPrincipal(null)}
                className="p-1 rounded-lg hover:bg-amber-700 text-amber-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Target vs Achieved:</span>
                  <span className="text-slate-900">{rebateModalPrincipal.actual} / {rebateModalPrincipal.target}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Volume Cartons:</span>
                  <span>{rebateModalPrincipal.cartons}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Claimed Rebate Amount ({currencySymbol}):</label>
                <input
                  type="number"
                  value={rebateAmount}
                  onChange={(e) => setRebateAmount(e.target.value)}
                  className="w-full border rounded-lg p-2 bg-white text-xs font-bold text-emerald-800 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Distributor Credit Note / Ref Notes:</label>
                <textarea
                  rows={2}
                  value={rebateNotes}
                  onChange={(e) => setRebateNotes(e.target.value)}
                  placeholder="e.g. Q3 Tier-1 volume rebate claim submitted to Shell ASM"
                  className="w-full border rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRebateModalPrincipal(null)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitRebateClaim}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-8"
                >
                  Submit Rebate Claim
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: RECORD NEW PDC CHEQUE ────────────────────────────────── */}
      {showPdcModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-bold text-sm">Record Wholesale Post-Dated Cheque (PDC)</h3>
              </div>
              <button
                onClick={() => setShowPdcModal(false)}
                className="p-1 rounded-lg hover:bg-amber-700 text-amber-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPdc} className="p-4 space-y-3 text-xs text-slate-700">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Wholesale Customer Name:</label>
                <input
                  type="text"
                  required
                  value={newPdcCustomer}
                  onChange={(e) => setNewPdcCustomer(e.target.value)}
                  placeholder="e.g. Khan Auto Traders / Al-Madina Autos"
                  className="w-full border rounded-lg p-2 bg-white text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Bank Name:</label>
                  <select
                    value={newPdcBank}
                    onChange={(e) => setNewPdcBank(e.target.value)}
                    className="w-full border rounded-lg p-2 bg-white text-xs focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Meezan Bank Ltd">Meezan Bank Ltd</option>
                    <option value="Habib Bank Ltd (HBL)">Habib Bank Ltd (HBL)</option>
                    <option value="Bank Alfalah">Bank Alfalah</option>
                    <option value="MCB Bank">MCB Bank</option>
                    <option value="United Bank Ltd (UBL)">United Bank Ltd (UBL)</option>
                    <option value="Allied Bank Ltd">Allied Bank Ltd</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cheque Number:</label>
                  <input
                    type="text"
                    value={newPdcChequeNo}
                    onChange={(e) => setNewPdcChequeNo(e.target.value)}
                    placeholder="e.g. CHQ-998822"
                    className="w-full border rounded-lg p-2 bg-white text-xs font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Amount ({currencySymbol}):</label>
                  <input
                    type="number"
                    required
                    value={newPdcAmount}
                    onChange={(e) => setNewPdcAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full border rounded-lg p-2 bg-white text-xs font-bold focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Due Date:</label>
                  <input
                    type="text"
                    value={newPdcDueDate}
                    onChange={(e) => setNewPdcDueDate(e.target.value)}
                    placeholder="e.g. Aug 30, 2026"
                    className="w-full border rounded-lg p-2 bg-white text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPdcModal(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-8"
                >
                  Record PDC Cheque
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: DISPATCH NEW VAN LOAD ────────────────────────────────── */}
      {showDispatchVanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <h3 className="font-bold text-sm">Dispatch Mobile Van Fleet & Load</h3>
              </div>
              <button
                onClick={() => setShowDispatchVanModal(false)}
                className="p-1 rounded-lg hover:bg-amber-700 text-amber-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchVan} className="p-4 space-y-3 text-xs text-slate-700">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Driver / Salesman Name:</label>
                <input
                  type="text"
                  required
                  value={newVanDriver}
                  onChange={(e) => setNewVanDriver(e.target.value)}
                  placeholder="e.g. Shahzaib Malik / Kamran Akmal"
                  className="w-full border rounded-lg p-2 bg-white text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Beat Route Description:</label>
                <input
                  type="text"
                  required
                  value={newVanRoute}
                  onChange={(e) => setNewVanRoute(e.target.value)}
                  placeholder="e.g. Lahore -> Gulberg -> Walton Road"
                  className="w-full border rounded-lg p-2 bg-white text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Initial Cartons Loaded:</label>
                <input
                  type="number"
                  min="1"
                  value={newVanLoadCartons}
                  onChange={(e) => setNewVanLoadCartons(Number(e.target.value) || 1)}
                  className="w-full border rounded-lg p-2 bg-white text-xs font-bold focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDispatchVanModal(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-8"
                >
                  Dispatch Van Load
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
