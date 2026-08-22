'use client';

/**
 * Textile Wholesale Control Panel & Business Hub
 * One-window operation center for Pakistani cloth wholesalers (Jama Cloth, Azam Market, Faisalabad)
 * 
 * Features & Business Owner Capabilities:
 * - Real-time Thaan, Meter & Suit Inventory Tracking
 * - Kora (Grey) vs Finished Fabric Valuation & Profit Margin Insights
 * - Party Credit Ledger & High-Risk Udhar Utilization Tracker
 * - Broker / Dalal Commission Management & Payout Summary
 * - Market Location Receivable Risk Exposure (Jama Cloth, Azam, Tariq Rd, etc.)
 * - Seasonal Demand Intelligence & Dead Stock Liquidation Recommendations
 * - Article-wise & Design-wise Catalog Matrix
 * - Front-Desk Quick Calculator for Thaan -> Meter -> Suit conversions
 */

import { useState, useMemo } from 'react';
import { useBusiness } from '@/lib/context/BusinessContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Wallet,
  Package,
  Users,
  Plus,
  UserCheck,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Search,
  Filter,
  Calculator,
  Download,
  Percent,
  Layers,
  MapPin,
  BadgePercent,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Clock,
  Tag,
  RefreshCw,
} from 'lucide-react';

import { 
  calculateThaanStockSummary,
  parseThaanBreakdown,
  exportPartyLedgerToCSV,
  exportStockSummaryToCSV,
  groupProductsByArticle,
  groupProductsByDesign,
  calculatePartyOutstandingSummary,
  getSeasonalRestockRecommendations,
  identifySlowMovingDesigns,
  calculateBrokerCommission,
  convertThaanToMeters,
  convertMetersToSuits,
  formatThaanQuantity,
  getCreditStatus,
  getTextileFabricTypes,
} from '@/lib/utils/textileWholesaleHelpers';

// Helper to trigger browser CSV file download
function downloadCSV(csvString, filename = 'export.csv') {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function TextileWholesaleHub({ 
  businessId,
  category,
  products = [],
  customers = [], 
  invoices = [],
  currency = 'PKR',
  onAction,
  dashboardMetrics = {},
  isLoading = false
}) {
  const { business, regionalPack } = useBusiness();
  const [activeView, setActiveView] = useState('dashboard');
  const [catalogGroupMode, setCatalogGroupMode] = useState('article'); // 'article' | 'design' | 'flat'

  const displayCurrency = currency || regionalPack?.currency || 'PKR';
  const locale = regionalPack?.locale || 'en-PK';

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Stock Summary & Financial Valuation
  const stockSummary = useMemo(() => {
    const calculated = calculateThaanStockSummary(products);
    
    let totalSellingValue = 0;
    let koraCount = 0;
    let finishedCount = 0;

    products.forEach(p => {
      const stock = Number(p.stock || 0);
      const price = Number(p.price || p.cost_price || 0);
      totalSellingValue += stock * price;

      const koraStatus = (p.domain_data?.korafinished || '').toLowerCase();
      if (koraStatus.includes('kora') || koraStatus.includes('grey')) {
        koraCount += stock;
      } else {
        finishedCount += stock;
      }
    });

    const profitMarginPotential = totalSellingValue > calculated.stockValue 
      ? totalSellingValue - calculated.stockValue 
      : 0;

    const marginPercentage = calculated.stockValue > 0 
      ? Math.round((profitMarginPotential / calculated.stockValue) * 100)
      : 0;

    return {
      totalThaans: calculated.totalThaans,
      totalMeters: calculated.totalMeters,
      stockValue: calculated.stockValue,
      sellingValue: Math.round(totalSellingValue),
      profitMarginPotential: Math.round(profitMarginPotential),
      marginPercentage,
      totalArticles: products.length,
      koraCount,
      finishedCount,
    };
  }, [products]);

  // Process Invoices & Payment Ledger
  const { pendingInvoices, recentPayments, todayInvoices, todayRevenue, totalBrokerCommission } = useMemo(() => {
    const pending = invoices.filter(inv => inv.payment_status !== 'paid');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayInvs = invoices.filter(inv => {
      const invDate = new Date(inv.invoice_date || inv.created_at);
      invDate.setHours(0, 0, 0, 0);
      return invDate.getTime() === today.getTime();
    });

    const todayRev = todayInvs.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

    // Calculate total broker commissions on current invoices (default 1.5%)
    let commissionTotal = 0;
    invoices.forEach(inv => {
      const brokerRate = Number(inv.domain_data?.broker_commission || 1.5);
      const total = Number(inv.grand_total || 0);
      commissionTotal += calculateBrokerCommission(total, brokerRate);
    });

    // Extract recent payments
    const payments = invoices
      .filter(inv => (inv.paid_amount || 0) > 0)
      .map(inv => ({
        id: inv.id,
        customer_name: inv.customer_name || inv.customer?.name || 'Party',
        payment_date: inv.updated_at || inv.created_at || new Date().toISOString(),
        payment_method: inv.payment_method || inv.payment_terms || 'Cash',
        amount: Number(inv.paid_amount || 0),
      }))
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
      .slice(0, 10);

    return {
      pendingInvoices: pending,
      recentPayments: payments,
      todayInvoices: todayInvs.length,
      todayRevenue: todayRev,
      totalBrokerCommission: Math.round(commissionTotal),
    };
  }, [invoices]);

  // Party Credit Metrics
  const partyMetrics = useMemo(() => {
    return calculatePartyOutstandingSummary(customers);
  }, [customers]);

  // High Risk Parties (>80% credit limit)
  const highRiskParties = useMemo(() => {
    return customers.filter(c => {
      const limit = Number(c.credit_limit || 0);
      const bal = Number(c.outstanding_balance || 0);
      return limit > 0 && bal >= limit * 0.8;
    });
  }, [customers]);

  // Market Location Wise Receivables Exposure
  const marketExposure = useMemo(() => {
    const map = new Map();
    customers.forEach(c => {
      const location = c.domain_data?.market_location || 'Other / General';
      const bal = Number(c.outstanding_balance || 0);
      if (!map.has(location)) {
        map.set(location, { location, count: 0, balance: 0 });
      }
      const entry = map.get(location);
      entry.count += 1;
      entry.balance += bal;
    });
    return Array.from(map.values()).sort((a, b) => b.balance - a.balance);
  }, [customers]);

  // Broker / Dalal Commission Ledger Summary
  const brokerLedger = useMemo(() => {
    const map = new Map();
    customers.forEach(c => {
      const brokerName = c.domain_data?.broker_name;
      if (brokerName && brokerName.trim()) {
        const key = brokerName.trim();
        if (!map.has(key)) {
          map.set(key, { brokerName: key, partyCount: 0, totalOutstanding: 0 });
        }
        const entry = map.get(key);
        entry.partyCount += 1;
        entry.totalOutstanding += Number(c.outstanding_balance || 0);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }, [customers]);

  // Seasonal Restock Recommendations
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const peakMonths = ['April', 'May', 'June', 'July', 'November', 'December'];
  const isPeakSeason = peakMonths.includes(currentMonth);

  const restockRecommendations = useMemo(() => {
    return getSeasonalRestockRecommendations(products, currentMonth);
  }, [products, currentMonth]);

  // Slow Moving / Dead Stock Designs
  const slowMovingDesigns = useMemo(() => {
    return identifySlowMovingDesigns(products, 90);
  }, [products]);

  // Top outstanding parties
  const topOutstanding = useMemo(() => {
    return customers
      .filter(c => (c.outstanding_balance || 0) > 0)
      .sort((a, b) => (b.outstanding_balance || 0) - (a.outstanding_balance || 0))
      .slice(0, 8);
  }, [customers]);

  // Top selling products
  const topProducts = useMemo(() => {
    return products
      .filter(p => (p.sold_qty || 0) > 0)
      .sort((a, b) => (b.sold_qty || 0) - (a.sold_qty || 0))
      .slice(0, 8);
  }, [products]);

  // Handle quick actions using window events (matches DashboardClient pattern)
  const handleQuickAction = (action, data) => {
    console.log('TextileWholesaleHub action:', action, data);
    
    switch (action) {
      case 'new-invoice':
        window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'invoice' } }));
        break;
      case 'record-payment':
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'payments' } }));
        break;
      case 'check-stock':
      case 'article-stock':
        setActiveView('catalog');
        break;
      case 'party-ledger':
        setActiveView('parties');
        break;
      case 'add-stock':
        window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'product' } }));
        break;
      case 'broker-expense':
      case 'log-commission':
        window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'expense' } }));
        break;
      case 'seasonal-restock':
        setActiveView('insights');
        break;
      case 'view-party-ledger':
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'customers' } }));
        if (data) {
          window.dispatchEvent(new CustomEvent('view-details', { 
            detail: { type: 'customer', item: { id: data } } 
          }));
        }
        break;
      case 'view-product-stock':
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'inventory' } }));
        if (data) {
          window.dispatchEvent(new CustomEvent('view-details', { 
            detail: { type: 'product', item: { id: data } } 
          }));
        }
        break;
      case 'record-payment-for':
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'payments' } }));
        break;
      case 'export-ledger':
        try {
          const csv = exportPartyLedgerToCSV(customers);
          downloadCSV(csv, `Party_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (e) {
          console.error('Failed to export party ledger:', e);
        }
        break;
      case 'export-stock':
        try {
          const csv = exportStockSummaryToCSV(products);
          downloadCSV(csv, `Stock_Summary_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (e) {
          console.error('Failed to export stock summary:', e);
        }
        break;
      default:
        console.warn('Unhandled textile action:', action);
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 bg-slate-50/50 min-h-screen">
      {/* Light-themed & Theme-aware Compact Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Textile Wholesale Command Center
            </h1>
            <Badge className="bg-wine-100/90 text-wine-900 border border-wine-200/80 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              Jama Cloth & Azam Market Verified
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-3xl">
            One-window management for cloth merchants: thaans, party ledgers, broker commissions, kora fabric balances, and seasonal restocking.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button onClick={() => handleQuickAction('new-invoice')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs h-9 px-3">
            <FileText className="h-4 w-4 mr-1.5" />
            Quick Invoice
          </Button>
          <Button onClick={() => handleQuickAction('record-payment')} size="sm" variant="outline" className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs h-9 px-3">
            <Wallet className="h-4 w-4 mr-1.5" />
            Receive Payment
          </Button>
          <Button onClick={() => handleQuickAction('add-stock')} size="sm" variant="outline" className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs h-9 px-3">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Thaans
          </Button>
        </div>
      </div>

      {/* Seasonal & Demand Forecast Alert */}
      {isPeakSeason && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/90 border border-amber-200/80 shadow-xs">
          <CardContent className="p-4 sm:p-4.5">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900 text-sm sm:text-base">Peak Demand Active - {currentMonth}</h3>
                  <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                    High demand period for lawn, cotton, chiffon & festive suits. Lock mill bookings early and maintain safety stock on top-selling design numbers.
                  </p>
                  {restockRecommendations.length > 0 && (
                    <p className="text-xs font-semibold text-amber-900 mt-1.5">
                      ⚠️ {restockRecommendations.length} articles require urgent restocking to avoid stockouts.
                    </p>
                  )}
                </div>
              </div>
              <Button 
                size="sm" 
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shrink-0 h-8 px-3"
                onClick={() => handleQuickAction('seasonal-restock')}
              >
                View Restock Plan <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Business Owner KPIs Grid (5 Core Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Outstanding */}
        <Card className="bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition-all">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Party Receivables</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 font-tabular tracking-tight">
                  {formatCurrency(partyMetrics.totalOutstanding)}
                </p>
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <Badge variant={partyMetrics.creditUtilization > 80 ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0 font-medium">
                    {partyMetrics.creditUtilization}% Limit Used
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{partyMetrics.partiesWithBalance} parties</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High Risk Credit Alert */}
        <Card className="bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition-all">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">High Risk Udhar</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 font-tabular tracking-tight">
                  {highRiskParties.length}
                </p>
                <p className="text-xs text-rose-600 font-medium pt-0.5 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Exceeding &gt;80% Limit</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thaan & Meter Stock */}
        <Card className="bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition-all">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Thaan & Meter Stock</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 font-tabular tracking-tight">
                  {stockSummary.totalThaans} <span className="text-xs font-normal text-slate-500">Thaans</span>
                </p>
                <p className="text-xs text-blue-600 font-medium pt-0.5 font-tabular">
                  ≈ {stockSummary.totalMeters?.toLocaleString()} meters total
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Valuation & Profit Margin Potential */}
        <Card className="bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition-all">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock Valuation</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 font-tabular tracking-tight">
                  {formatCurrency(stockSummary.stockValue)}
                </p>
                <p className="text-xs text-emerald-600 font-medium pt-0.5 font-tabular">
                  +{stockSummary.marginPercentage}% Selling Margin
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Broker Commission Payout */}
        <Card className="bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition-all">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Broker Commission</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 font-tabular tracking-tight">
                  {formatCurrency(totalBrokerCommission)}
                </p>
                <p className="text-xs text-purple-600 font-medium pt-0.5 font-tabular">
                  {brokerLedger.length} Active Dalals
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                <BadgePercent className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Grid */}
      <Card className="border shadow-sm">
        <CardHeader className="py-3 px-4 bg-gray-50/70 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-800">Quick Textile Operations</CardTitle>
            <span className="text-xs text-gray-500">Shortcuts for daily counter tasks</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 border-gray-200 hover:border-wine-500 hover:bg-wine-50/50 transition-colors"
              onClick={() => handleQuickAction('new-invoice')}
            >
              <FileText className="h-5 w-5 text-wine-700" />
              <span className="text-xs font-medium text-gray-800">Quick Invoice</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
              onClick={() => handleQuickAction('record-payment')}
            >
              <Wallet className="h-5 w-5 text-emerald-600" />
              <span className="text-xs font-medium text-gray-800">Receive Cash</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
              onClick={() => handleQuickAction('article-stock')}
            >
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium text-gray-800">Articles & Designs</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 border-gray-200 hover:border-purple-500 hover:bg-purple-50/50 transition-colors"
              onClick={() => handleQuickAction('party-ledger')}
            >
              <Users className="h-5 w-5 text-purple-600" />
              <span className="text-xs font-medium text-gray-800">Party Ledgers</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 border-gray-200 hover:border-amber-500 hover:bg-amber-50/50 transition-colors"
              onClick={() => setActiveView('calculator')}
            >
              <Calculator className="h-5 w-5 text-amber-600" />
              <span className="text-xs font-medium text-gray-800">Suit Calculator</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors"
              onClick={() => handleQuickAction('log-commission')}
            >
              <UserCheck className="h-5 w-5 text-indigo-600" />
              <span className="text-xs font-medium text-gray-800">Dalal Payout</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 h-auto p-1 bg-gray-100 rounded-lg">
          <TabsTrigger value="dashboard" className="text-xs py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="parties" className="text-xs py-2">
            Party Khata
            {highRiskParties.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[10px]">
                {highRiskParties.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="catalog" className="text-xs py-2">
            Articles & Designs
          </TabsTrigger>
          <TabsTrigger value="collections" className="text-xs py-2">
            Collections & Dalals
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-xs py-2">
            Insights & Restock
            {slowMovingDesigns.length > 0 && (
              <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-500 inline-block" />
            )}
          </TabsTrigger>
          <TabsTrigger value="calculator" className="text-xs py-2">
            Front-Desk Calc
          </TabsTrigger>
        </TabsList>

        {/* ==================================================================== */}
        {/* OVERVIEW TAB */}
        {/* ==================================================================== */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top Outstanding Parties */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Top Outstanding Party Khatas</CardTitle>
                  <CardDescription>Highest credit balances requiring recovery follow-up</CardDescription>
                </div>
                <Button size="sm" variant="ghost" className="text-wine-700 text-xs" onClick={() => setActiveView('parties')}>
                  View All ({customers.length}) <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topOutstanding.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No party credit balances found
                    </p>
                  ) : (
                    topOutstanding.map((customer) => {
                      const creditStatus = getCreditStatus(customer);

                      return (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:border-wine-200 hover:bg-wine-50/20 cursor-pointer transition-all"
                          onClick={() => handleQuickAction('view-party-ledger', customer.id)}
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-gray-900 truncate">
                                {customer.name}
                              </p>
                              {customer.domain_data?.broker_name && (
                                <Badge variant="outline" className="text-[10px] py-0 border-gray-300 font-normal shrink-0">
                                  Broker: {customer.domain_data.broker_name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {customer.domain_data?.shop_name || 'Wholesale Party'}
                              {customer.domain_data?.market_location && ` · ${customer.domain_data.market_location}`}
                              {customer.phone && ` · 📞 ${customer.phone}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-sm text-rose-600 font-tabular">
                              {formatCurrency(customer.outstanding_balance)}
                            </p>
                            {customer.credit_limit > 0 ? (
                              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                <span className="text-[11px] text-gray-500 font-tabular">
                                  Limit: {formatCurrency(customer.credit_limit)}
                                </span>
                                <span className={`text-[10px] font-semibold ${
                                  creditStatus.status === 'exceeded' ? 'text-rose-600' :
                                  creditStatus.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                  ({creditStatus.utilization}%)
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-400">No Limit</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fast Moving Design Numbers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Fast Moving Designs</CardTitle>
                <CardDescription>Top designs by volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No sales data logged yet
                    </p>
                  ) : (
                    topProducts.map((product, idx) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="h-6 w-6 rounded-full bg-wine-100 text-wine-800 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-gray-900 truncate">
                              Article: {product.domain_data?.articleno || product.sku}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              Design: {product.domain_data?.designno || product.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-xs text-gray-900 font-tabular">
                            {product.sold_qty || 0} {product.unit || 'pcs'}
                          </p>
                          <p className="text-[10px] text-gray-500 font-tabular">
                            Stock: {product.stock || 0}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Exposure & Kora/Finished Balance Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Market Receivable Risk Exposure */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Market Location Receivables</CardTitle>
                    <CardDescription>Credit exposure across Pakistani textile hubs</CardDescription>
                  </div>
                  <MapPin className="h-4 w-4 text-wine-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketExposure.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No market location data available</p>
                  ) : (
                    marketExposure.slice(0, 6).map((item) => {
                      const percentage = partyMetrics.totalOutstanding > 0 
                        ? Math.round((item.balance / partyMetrics.totalOutstanding) * 100)
                        : 0;

                      return (
                        <div key={item.location} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-800">{item.location} ({item.count} parties)</span>
                            <span className="font-bold text-gray-900 font-tabular">
                              {formatCurrency(item.balance)} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-wine-700 rounded-full transition-all"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inventory Type & Stock Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Fabric Stage & Valuation Summary</CardTitle>
                    <CardDescription>Kora (Grey) vs Dyed/Finished fabric metrics</CardDescription>
                  </div>
                  <Layers className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                    <p className="text-xs text-amber-800 font-medium">Kora / Grey Cloth Stock</p>
                    <p className="text-xl font-bold text-amber-900 mt-1 font-tabular">
                      {stockSummary.koraCount} <span className="text-xs font-normal">Thaans</span>
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Awaiting dyeing/printing</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    <p className="text-xs text-emerald-800 font-medium">Finished Fabric Stock</p>
                    <p className="text-xl font-bold text-emerald-900 mt-1 font-tabular">
                      {stockSummary.finishedCount} <span className="text-xs font-normal">Thaans</span>
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Ready for dispatch</p>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Total Stock Cost Value:</span>
                    <span className="font-semibold text-gray-900 font-tabular">{formatCurrency(stockSummary.stockValue)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Total Retail Value:</span>
                    <span className="font-semibold text-gray-900 font-tabular">{formatCurrency(stockSummary.sellingValue)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-emerald-700 pt-1 border-t">
                    <span>Gross Profit Margin Potential:</span>
                    <span className="font-bold font-tabular">{formatCurrency(stockSummary.profitMarginPotential)} ({stockSummary.marginPercentage}%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================================================================== */}
        {/* PARTY KHATA & CREDIT TAB */}
        {/* ==================================================================== */}
        <TabsContent value="parties" className="space-y-4">
          <PartyLedgerView
            customers={customers}
            formatCurrency={formatCurrency}
            onAction={handleQuickAction}
          />
        </TabsContent>

        {/* ==================================================================== */}
        {/* ARTICLE & DESIGN CATALOG TAB */}
        {/* ==================================================================== */}
        <TabsContent value="catalog" className="space-y-4">
          <ArticleDesignCatalogView
            products={products}
            stockSummary={stockSummary}
            formatCurrency={formatCurrency}
            onAction={handleQuickAction}
          />
        </TabsContent>

        {/* ==================================================================== */}
        {/* COLLECTIONS & DALAL COMMISSIONS TAB */}
        {/* ==================================================================== */}
        <TabsContent value="collections" className="space-y-4">
          <CollectionsAndBrokersView
            recentPayments={recentPayments}
            pendingInvoices={pendingInvoices}
            brokerLedger={brokerLedger}
            totalBrokerCommission={totalBrokerCommission}
            formatCurrency={formatCurrency}
            onAction={handleQuickAction}
          />
        </TabsContent>

        {/* ==================================================================== */}
        {/* INSIGHTS & RESTOCK TAB */}
        {/* ==================================================================== */}
        <TabsContent value="insights" className="space-y-4">
          <SeasonalAndRestockInsightsView
            restockRecommendations={restockRecommendations}
            slowMovingDesigns={slowMovingDesigns}
            currentMonth={currentMonth}
            isPeakSeason={isPeakSeason}
            formatCurrency={formatCurrency}
            onAction={handleQuickAction}
          />
        </TabsContent>

        {/* ==================================================================== */}
        {/* FRONT-DESK CALCULATOR TAB */}
        {/* ==================================================================== */}
        <TabsContent value="calculator" className="space-y-4">
          <FrontDeskTextileCalculator formatCurrency={formatCurrency} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================================ */
/* SUB-COMPONENT: PARTY LEDGER VIEW (With Filters, Search, Credit Utilization)  */
/* ============================================================================ */
function PartyLedgerView({ customers = [], formatCurrency, onAction }) {
  const [partySearch, setPartySearch] = useState('');
  const [buyerTypeFilter, setBuyerTypeFilter] = useState('all');
  const [creditFilter, setCreditFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');

  // Extract unique market locations
  const marketLocations = useMemo(() => {
    const set = new Set();
    customers.forEach(c => {
      if (c.domain_data?.market_location) set.add(c.domain_data.market_location);
    });
    return Array.from(set);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const q = partySearch.toLowerCase().trim();
      const nameMatch = !q || (
        (customer.name || '').toLowerCase().includes(q) ||
        (customer.domain_data?.shop_name || '').toLowerCase().includes(q) ||
        (customer.domain_data?.market_location || '').toLowerCase().includes(q) ||
        (customer.domain_data?.broker_name || '').toLowerCase().includes(q)
      );

      const buyerMatch = buyerTypeFilter === 'all' || (customer.domain_data?.buyer_type || 'Retailer') === buyerTypeFilter;
      const marketMatch = marketFilter === 'all' || (customer.domain_data?.market_location || '') === marketFilter;

      const usage = customer.credit_limit > 0
        ? (customer.outstanding_balance / customer.credit_limit) * 100
        : 0;

      const creditMatch = creditFilter === 'all' ||
        (creditFilter === 'overdue' && customer.outstanding_balance > 0) ||
        (creditFilter === 'warning' && usage >= 60 && usage < 80) ||
        (creditFilter === 'exceeded' && usage >= 80);

      return nameMatch && buyerMatch && marketMatch && creditMatch;
    });
  }, [customers, partySearch, buyerTypeFilter, marketFilter, creditFilter]);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b bg-gray-50/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-gray-900">Party Credit Ledgers ({filteredCustomers.length})</CardTitle>
            <CardDescription>Track party khata, credit limits, broker agents & market locations</CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button size="sm" variant="outline" onClick={() => onAction?.('export-ledger')}>
              <Download className="h-4 w-4 mr-1.5" />
              Export Party CSV
            </Button>
            <Button size="sm" className="bg-wine-800 hover:bg-wine-900 text-white" onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'customer' } }))}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Wholesale Party
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by party, shop, market, broker agent..."
              value={partySearch}
              onChange={(e) => setPartySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-wine-500"
            />
          </div>
          <select
            value={buyerTypeFilter}
            onChange={(e) => setBuyerTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none"
          >
            <option value="all">All Buyer Types</option>
            <option value="Retailer">Retailer</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="Tailor">Tailor</option>
            <option value="Boutique">Boutique</option>
          </select>
          <select
            value={creditFilter}
            onChange={(e) => setCreditFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none"
          >
            <option value="all">All Credit Statuses</option>
            <option value="overdue">With Active Balance</option>
            <option value="warning">Warning (60–80%)</option>
            <option value="exceeded">High Risk (&gt;80%)</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">
              No party ledgers found matching your search filters.
            </p>
          ) : (
            filteredCustomers.map((customer) => {
              const creditStatus = getCreditStatus(customer);

              return (
                <div
                  key={customer.id}
                  className="p-4 rounded-xl border hover:border-wine-300 hover:bg-wine-50/10 transition-all bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-base text-gray-900">{customer.name}</p>
                        <Badge variant={customer.domain_data?.buyer_type === 'Wholesaler' ? 'default' : 'secondary'} className="text-xs">
                          {customer.domain_data?.buyer_type || 'Retailer'}
                        </Badge>
                        {customer.domain_data?.broker_name && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-800 border-purple-200">
                            Broker: {customer.domain_data.broker_name}
                          </Badge>
                        )}
                        {customer.domain_data?.ntn_status === 'Active' && (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-0">FBR Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        🏢 {customer.domain_data?.shop_name || 'Wholesale Shop'} 
                        {customer.domain_data?.market_location && ` · 📍 ${customer.domain_data.market_location}`}
                        {customer.phone && ` · 📞 ${customer.phone}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-wine-800 border-wine-200 hover:bg-wine-50"
                        onClick={() => onAction?.('view-party-ledger', customer.id)}
                      >
                        View Ledger & History
                      </Button>
                    </div>
                  </div>

                  {/* Credit Bar & Balance Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-3 border-t bg-gray-50/60 p-3 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Outstanding Balance</p>
                      <p className="font-bold text-lg text-rose-600 font-tabular">
                        {formatCurrency(customer.outstanding_balance)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Payment Terms</p>
                      <p className="font-semibold text-sm text-gray-800">
                        {customer.payment_terms || customer.domain_data?.payment_terms || 'Standard Credit (30 Days)'}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Credit Limit Utilization</span>
                        <span className="font-semibold text-gray-900 font-tabular">
                          {customer.credit_limit > 0 
                            ? `${formatCurrency(customer.credit_limit)} (${creditStatus.utilization}%)`
                            : 'Unlimited'}
                        </span>
                      </div>
                      {customer.credit_limit > 0 && (
                        <div className="w-full h-2 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              creditStatus.status === 'exceeded' ? 'bg-rose-500' :
                              creditStatus.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(creditStatus.utilization, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================================ */
/* SUB-COMPONENT: ARTICLE & DESIGN CATALOG VIEW (Group by Article or Design)   */
/* ============================================================================ */
function ArticleDesignCatalogView({ products = [], stockSummary, formatCurrency, onAction }) {
  const [stockSearch, setStockSearch] = useState('');
  const [fabricFilter, setFabricFilter] = useState('all');
  const [koraFilter, setKoraFilter] = useState('all');
  const [viewMode, setViewMode] = useState('article'); // 'article' | 'design' | 'flat'

  // Extract unique fabric types
  const fabricTypes = useMemo(() => getTextileFabricTypes(), []);

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const q = stockSearch.toLowerCase().trim();
      const nameMatch = !q || (
        (product.name || '').toLowerCase().includes(q) ||
        (product.sku || '').toLowerCase().includes(q) ||
        (product.domain_data?.articleno || '').toLowerCase().includes(q) ||
        (product.domain_data?.designno || '').toLowerCase().includes(q) ||
        (product.domain_data?.fabrictype || '').toLowerCase().includes(q) ||
        (product.domain_data?.colorshade || '').toLowerCase().includes(q)
      );

      const fabricMatch = fabricFilter === 'all' || (product.domain_data?.fabrictype || '') === fabricFilter;

      const koraRaw = (product.domain_data?.korafinished || '').toLowerCase();
      const koraMatch = koraFilter === 'all' ||
        (koraFilter === 'kora' && (koraRaw.includes('kora') || koraRaw.includes('grey'))) ||
        (koraFilter === 'finished' && (!koraRaw.includes('kora') && !koraRaw.includes('grey')));

      return nameMatch && fabricMatch && koraMatch;
    });
  }, [products, stockSearch, fabricFilter, koraFilter]);

  // Article grouping
  const articleGroups = useMemo(() => {
    return groupProductsByArticle(filteredProducts);
  }, [filteredProducts]);

  // Design grouping
  const designGroups = useMemo(() => {
    return groupProductsByDesign(filteredProducts);
  }, [filteredProducts]);

  return (
    <div className="space-y-4">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Textile Inventory & Catalog ({filteredProducts.length})</CardTitle>
              <CardDescription>Article Numbers, Design Numbers, Thaan roll breakdowns & Fabric types</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white border rounded-lg p-1 flex gap-1 text-xs">
                <button
                  className={`px-3 py-1 rounded font-medium transition-colors ${viewMode === 'article' ? 'bg-wine-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setViewMode('article')}
                >
                  By Article
                </button>
                <button
                  className={`px-3 py-1 rounded font-medium transition-colors ${viewMode === 'design' ? 'bg-wine-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setViewMode('design')}
                >
                  By Design
                </button>
                <button
                  className={`px-3 py-1 rounded font-medium transition-colors ${viewMode === 'flat' ? 'bg-wine-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setViewMode('flat')}
                >
                  All Items
                </button>
              </div>
              <Button size="sm" variant="outline" onClick={() => onAction?.('export-stock')}>
                <Download className="h-4 w-4 mr-1.5" />
                Export Stock CSV
              </Button>
            </div>
          </div>

          {/* Search & Fabric Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Article #, Design #, Fabric, Color..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-wine-500"
              />
            </div>
            <select
              value={fabricFilter}
              onChange={(e) => setFabricFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none"
            >
              <option value="all">All Fabric Types</option>
              {fabricTypes.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <select
              value={koraFilter}
              onChange={(e) => setKoraFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none"
            >
              <option value="all">Kora & Finished Both</option>
              <option value="kora">Kora (Grey Cloth Only)</option>
              <option value="finished">Finished Fabric Only</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* ARTICLE VIEW */}
          {viewMode === 'article' && (
            <div className="space-y-4">
              {articleGroups.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-10">No articles match criteria.</p>
              ) : (
                articleGroups.map(group => (
                  <div key={group.articleNo} className="border rounded-xl p-4 bg-white hover:border-wine-300 transition-all">
                    <div className="flex items-center justify-between pb-3 border-b">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-gray-900">Article #{group.articleNo}</h3>
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800">
                            {group.designs.length} Designs
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Total Stock: <span className="font-semibold text-gray-800">{group.totalStock} units</span> · Stock Value: <span className="font-semibold text-emerald-700">{formatCurrency(group.totalValue)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                      {group.designs.map(item => {
                        const breakdown = parseThaanBreakdown(item.domain_data?.thaan_breakdown || item.domain_data?.thaanbreakdown);
                        return (
                          <div
                            key={item.id}
                            className="p-3 rounded-lg border bg-gray-50/50 hover:bg-wine-50/20 hover:border-wine-200 cursor-pointer transition-all"
                            onClick={() => onAction?.('view-product-stock', item.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-xs text-gray-900">Design #{item.domain_data?.designno || item.name}</p>
                                <p className="text-[11px] text-gray-600 mt-0.5">
                                  {item.domain_data?.fabrictype || 'Fabric'} {item.domain_data?.colorshade && `· ${item.domain_data.colorshade}`}
                                </p>
                                {breakdown.rolls.length > 0 && (
                                  <p className="text-[10px] text-blue-600 mt-1 font-mono">
                                    Rolls ({breakdown.rolls.length}): {breakdown.rolls.join(', ')}m
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-xs text-gray-900 font-tabular">{item.stock || 0} {item.unit || 'pcs'}</p>
                                <p className="text-[11px] font-semibold text-emerald-600 font-tabular">PKR {Number(item.price || 0).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* DESIGN VIEW */}
          {viewMode === 'design' && (
            <div className="space-y-4">
              {designGroups.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-10">No designs match criteria.</p>
              ) : (
                designGroups.map(group => (
                  <div key={group.designNo} className="border rounded-xl p-4 bg-white">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div>
                        <h3 className="font-bold text-base text-gray-900">Design #{group.designNo}</h3>
                        <p className="text-xs text-gray-500">
                          {group.articles.length} Article variants · Sold: <span className="font-semibold text-gray-800">{group.totalSold} units</span> · Stock: <span className="font-semibold text-gray-800">{group.totalStock} units</span>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                      {group.articles.map(item => (
                        <div key={item.id} className="p-3 rounded-lg border bg-gray-50/50">
                          <p className="font-bold text-xs text-gray-900">Article #{item.domain_data?.articleno || item.sku}</p>
                          <p className="text-[11px] text-gray-600 mt-0.5">{item.domain_data?.fabrictype} · {item.domain_data?.colorshade || 'Standard'}</p>
                          <div className="flex justify-between items-center mt-2 pt-1 border-t text-xs">
                            <span className="text-gray-500">Stock: {item.stock || 0} {item.unit}</span>
                            <span className="font-semibold text-emerald-600">PKR {Number(item.price || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* FLAT ITEM LIST */}
          {viewMode === 'flat' && (
            <div className="space-y-2">
              {filteredProducts.map(product => {
                const breakdown = parseThaanBreakdown(product.domain_data?.thaan_breakdown || product.domain_data?.thaanbreakdown);
                return (
                  <div
                    key={product.id}
                    className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
                    onClick={() => onAction?.('view-product-stock', product.id)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">Article #{product.domain_data?.articleno || product.sku}</span>
                        {product.domain_data?.designno && (
                          <Badge variant="outline" className="text-xs">Design #{product.domain_data.designno}</Badge>
                        )}
                        <span className="text-xs text-gray-500">{product.domain_data?.fabrictype || 'Fabric'}</span>
                      </div>
                      {breakdown.rolls.length > 0 && (
                        <p className="text-xs text-blue-600 font-mono mt-0.5">
                          Roll breakdown ({breakdown.rolls.length}): {breakdown.rolls.map(r => `${r}m`).join(', ')} = {breakdown.totalMeters}m
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900 font-tabular">{product.stock || 0} {product.unit || 'pcs'}</p>
                      <p className="text-xs text-emerald-600 font-semibold font-tabular">PKR {Number(product.price || 0).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================================ */
/* SUB-COMPONENT: COLLECTIONS & BROKER COMMISSIONS VIEW                        */
/* ============================================================================ */
function CollectionsAndBrokersView({ recentPayments, pendingInvoices, brokerLedger, totalBrokerCommission, formatCurrency, onAction }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Pending Invoice Collections */}
      <Card className="lg:col-span-2 border shadow-sm">
        <CardHeader className="pb-3 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Pending Collections ({pendingInvoices.length})</CardTitle>
              <CardDescription>Unpaid wholesale invoices requiring recovery</CardDescription>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onAction?.('record-payment')}>
              <Wallet className="h-4 w-4 mr-1.5" />
              Receive Cash
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            {pendingInvoices.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">All party invoices have been settled!</p>
            ) : (
              pendingInvoices.slice(0, 15).map((invoice) => {
                const dueDate = new Date(invoice.due_date || invoice.created_at);
                const isOverdue = dueDate < new Date();
                const pendingBal = invoice.grand_total - (invoice.paid_amount || 0);

                return (
                  <div
                    key={invoice.id}
                    className="p-3.5 rounded-lg border hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
                    onClick={() => onAction?.('record-payment-for', invoice.id)}
                  >
                    <div>
                      <p className="font-bold text-sm text-gray-900">
                        {invoice.customer_name || invoice.customer?.name || 'Party'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Inv #{invoice.invoice_number} · Due {dueDate.toLocaleDateString()}
                        {invoice.domain_data?.broker_name && ` · Broker: ${invoice.domain_data.broker_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${isOverdue ? 'text-rose-600' : 'text-gray-900'} font-tabular`}>
                        {formatCurrency(pendingBal)}
                      </p>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-[10px] mt-0.5">Overdue</Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Broker / Dalal Commission Ledger */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Dalal Commission Ledger</CardTitle>
              <CardDescription>Agent commissions payable</CardDescription>
            </div>
            <UserCheck className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4 p-3 rounded-lg bg-purple-50 border border-purple-200">
            <p className="text-xs text-purple-800">Total Calculated Commissions</p>
            <p className="text-xl font-bold text-purple-950 mt-0.5 font-tabular">
              {formatCurrency(totalBrokerCommission)}
            </p>
            <p className="text-[11px] text-purple-700 mt-0.5">Standard 1.5% commission rate</p>
          </div>

          <div className="space-y-3">
            {brokerLedger.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No active brokers assigned to parties.</p>
            ) : (
              brokerLedger.map((broker) => (
                <div key={broker.brokerName} className="p-3 rounded-lg border bg-white flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-gray-900">{broker.brokerName}</p>
                    <p className="text-[11px] text-gray-500">{broker.partyCount} Linked Parties</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-xs text-gray-900 font-tabular">
                      {formatCurrency(broker.totalOutstanding)}
                    </p>
                    <p className="text-[10px] text-purple-700 font-medium">Party Khata</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full mt-4 text-purple-800 border-purple-200 hover:bg-purple-50"
            onClick={() => onAction?.('log-commission')}
          >
            Log Dalal Commission Payout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================================ */
/* SUB-COMPONENT: SEASONAL & RESTOCK INSIGHTS VIEW                              */
/* ============================================================================ */
function SeasonalAndRestockInsightsView({ restockRecommendations, slowMovingDesigns, currentMonth, isPeakSeason, formatCurrency, onAction }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Seasonal Restock Recommendations */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Urgent Restock Plan ({restockRecommendations.length})</CardTitle>
              <CardDescription>Fast-moving articles running low during peak demand ({currentMonth})</CardDescription>
            </div>
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {restockRecommendations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Stock levels look adequate for current sales velocity!</p>
            ) : (
              restockRecommendations.map((item) => (
                <div key={item.productId} className="p-3.5 rounded-lg border bg-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-gray-900">Article #{item.articleNo || item.sku}</p>
                      {item.designNo && <Badge variant="outline" className="text-xs">Design #{item.designNo}</Badge>}
                    </div>
                    <p className="text-xs text-amber-700 font-medium mt-0.5">⚠️ {item.reason}</p>
                    <p className="text-xs text-gray-500">Current Stock: {item.currentStock} · Avg Monthly Sales: {item.avgMonthlySales}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-emerald-700 font-tabular">+ {item.recommendedQty} Thaans</p>
                    <span className="text-[10px] text-gray-400">Order Qty</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dead Stock & Slow Moving Detector */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Slow-Moving & Dead Stock ({slowMovingDesigns.length})</CardTitle>
              <CardDescription>Designs with no sales in &gt;90 days (locked capital)</CardDescription>
            </div>
            <Clock className="h-4 w-4 text-rose-600" />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {slowMovingDesigns.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No dead stock detected! All designs are moving nicely.</p>
            ) : (
              slowMovingDesigns.slice(0, 10).map((item) => (
                <div key={item.productId} className="p-3 rounded-lg border bg-rose-50/30 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-gray-900">Article #{item.articleNo || item.sku}</p>
                    <p className="text-[11px] text-gray-600">Design #{item.designNo || 'N/A'}</p>
                    <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                      ⏳ {item.daysWithoutSale} days without sale
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-gray-900 font-tabular">{item.stock} Thaans</p>
                    <p className="text-[11px] font-semibold text-rose-700 font-tabular">{formatCurrency(item.stockValue)} Value</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================================ */
/* SUB-COMPONENT: FRONT-DESK TEXTILE QUICK CALCULATOR                          */
/* ============================================================================ */
function FrontDeskTextileCalculator({ formatCurrency }) {
  const [thaansInput, setThaansInput] = useState('10');
  const [thaanLengthInput, setThaanLengthInput] = useState('40');
  const [suitCutInput, setSuitCutInput] = useState('2.25');

  const [suitOrderInput, setSuitOrderInput] = useState('50');

  // Thaan -> Meter -> Suit conversion results
  const conversionResult = useMemo(() => {
    const thaans = Math.max(0, Number(thaansInput) || 0);
    const thaanLength = Math.max(1, Number(thaanLengthInput) || 40);
    const suitCutting = Math.max(0.5, Number(suitCutInput) || 2.25);

    const totalMeters = convertThaanToMeters(thaans, thaanLength);
    const totalGaz = Math.round(totalMeters / 0.9144 * 100) / 100;
    const totalSuits = convertMetersToSuits(totalMeters, suitCutting);
    const metersUsed = Math.round(totalSuits * suitCutting * 100) / 100;
    const remnantMeters = Math.round((totalMeters - metersUsed) * 100) / 100;

    return {
      totalMeters,
      totalGaz,
      totalSuits,
      remnantMeters,
    };
  }, [thaansInput, thaanLengthInput, suitCutInput]);

  // Suit Order Fulfiller calculation
  const orderFulfillResult = useMemo(() => {
    const suitsNeeded = Math.max(0, Number(suitOrderInput) || 0);
    const suitCutting = Math.max(0.5, Number(suitCutInput) || 2.25);
    const thaanLength = Math.max(1, Number(thaanLengthInput) || 40);

    const requiredMeters = Math.round(suitsNeeded * suitCutting * 100) / 100;
    const exactThaans = requiredMeters / thaanLength;
    const roundedThaansNeeded = Math.ceil(exactThaans);
    const totalProvidedMeters = roundedThaansNeeded * thaanLength;
    const leftoverMeters = Math.round((totalProvidedMeters - requiredMeters) * 100) / 100;

    return {
      requiredMeters,
      roundedThaansNeeded,
      leftoverMeters,
    };
  }, [suitOrderInput, suitCutInput, thaanLengthInput]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Thaan to Suit Converter */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Thaan Roll → Suit Cutting Calculator</CardTitle>
              <CardDescription>Instantly convert Thaans to Meters, Gaz and Suit cuts</CardDescription>
            </div>
            <Calculator className="h-5 w-5 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Number of Thaans</label>
              <input
                type="number"
                value={thaansInput}
                onChange={(e) => setThaansInput(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-wine-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Length per Thaan (m)</label>
              <input
                type="number"
                value={thaanLengthInput}
                onChange={(e) => setThaanLengthInput(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-wine-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Suit Cutting (m)</label>
              <input
                type="number"
                step="0.05"
                value={suitCutInput}
                onChange={(e) => setSuitCutInput(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-wine-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-wine-50 rounded-xl border border-wine-200">
              <p className="text-xs text-wine-800 font-medium">Total Meters</p>
              <p className="text-2xl font-bold text-wine-950 mt-1 font-tabular">{conversionResult.totalMeters}m</p>
              <p className="text-[11px] text-wine-700 mt-0.5 font-tabular">≈ {conversionResult.totalGaz} Gaz</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs text-emerald-800 font-medium">Full Suits Yield</p>
              <p className="text-2xl font-bold text-emerald-950 mt-1 font-tabular">{conversionResult.totalSuits} Suits</p>
              <p className="text-[11px] text-emerald-700 mt-0.5 font-tabular">Cut piece remnant: {conversionResult.remnantMeters}m</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suit Order Fulfiller */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Suit Order Thaan Requirement</CardTitle>
              <CardDescription>Calculate exact Thaans needed to fulfill customer suit orders</CardDescription>
            </div>
            <Tag className="h-5 w-5 text-wine-600" />
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Party Ordered Suits Qty</label>
            <input
              type="number"
              value={suitOrderInput}
              onChange={(e) => setSuitOrderInput(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-wine-500"
              placeholder="e.g. 50 Suits"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Total Cloth Required:</span>
              <span className="font-bold text-gray-900 font-tabular">{orderFulfillResult.requiredMeters} Meters</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-wine-900 pt-1 border-t">
              <span>Full Thaans to Issue:</span>
              <span className="font-extrabold text-wine-800 font-tabular">{orderFulfillResult.roundedThaansNeeded} Thaans</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>Leftover Thaan Tail Remnant:</span>
              <span className="font-medium text-emerald-700 font-tabular">{orderFulfillResult.leftoverMeters} Meters</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TextileWholesaleHub;
