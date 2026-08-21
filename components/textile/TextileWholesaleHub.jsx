'use client';

/**
 * Textile Wholesale Hub - Simplified Control Panel
 * One-window management for cloth wholesalers (thaan business)
 * 
 * Features:
 * - Quick invoice creation (thaan/meter/suit)
 * - Party ledger with outstanding balances
 * - Article/Design stock view
 * - Payment recording
 * - Broker commission tracking
 * - Seasonal intelligence
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
  Calendar,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';

import { 
  calculateThaanStockSummary,
  parseThaanBreakdown,
  exportPartyLedgerToCSV,
  exportStockSummaryToCSV,
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
  const [searchTerm, setSearchTerm] = useState('');

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

  // Process products into stock summary (with variable Thaan breakdown support)
  const stockSummary = useMemo(() => {
    const calculated = calculateThaanStockSummary(products);
    return {
      totalThaans: calculated.totalThaans,
      totalMeters: calculated.totalMeters,
      stockValue: formatCurrency(calculated.stockValue),
      totalArticles: products.length,
    };
  }, [products, formatCurrency]);

  // Process invoices and payments
  const { pendingInvoices, recentPayments, todayInvoices, todayRevenue } = useMemo(() => {
    const pending = invoices.filter(inv => inv.payment_status !== 'paid');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayInvs = invoices.filter(inv => {
      const invDate = new Date(inv.invoice_date || inv.created_at);
      invDate.setHours(0, 0, 0, 0);
      return invDate.getTime() === today.getTime();
    });

    const todayRev = todayInvs.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

    // Extract recent payments from paid/partially-paid invoices or payments list
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
    };
  }, [invoices]);

  // Top products by sales
  const topProducts = useMemo(() => {
    return products
      .filter(p => (p.sold_qty || 0) > 0)
      .sort((a, b) => (b.sold_qty || 0) - (a.sold_qty || 0))
      .slice(0, 10);
  }, [products]);

  // Calculate seasonal alert
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const peakMonths = ['April', 'May', 'June', 'July', 'November', 'December'];
  const isPeakSeason = peakMonths.includes(currentMonth);

  // Top outstanding parties
  const topOutstanding = useMemo(() => {
    return customers
      .filter(c => (c.outstanding_balance || 0) > 0)
      .sort((a, b) => (b.outstanding_balance || 0) - (a.outstanding_balance || 0))
      .slice(0, 10);
  }, [customers]);

  // Total outstanding
  const totalOutstanding = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
  }, [customers]);

  // Overdue parties (assuming 30-day terms)
  const overdueParties = useMemo(() => {
    return pendingInvoices.filter(inv => {
      const dueDate = new Date(inv.due_date || inv.created_at);
      return dueDate < new Date() && inv.payment_status !== 'paid';
    }).length;
  }, [pendingInvoices]);

  // Handle quick actions using window events (matches DashboardClient pattern)
  const handleQuickAction = (action, data) => {
    console.log('TextileWholesaleHub action:', action, data);
    
    switch (action) {
      case 'new-invoice':
        // Trigger new invoice modal
        window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'invoice' } }));
        break;
      case 'record-payment':
        // Switch to payments tab
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'payments' } }));
        break;
      case 'check-stock':
      case 'article-stock':
        // Switch to inventory tab
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'inventory' } }));
        break;
      case 'party-ledger':
        // Switch to customers tab
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'customers' } }));
        break;
      case 'add-stock':
        // Trigger new product modal
        window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'product' } }));
        break;
      case 'broker-expense':
      case 'log-commission':
        // Trigger expense modal
        window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'expense' } }));
        break;
      case 'seasonal-restock':
        // Switch to inventory with low-stock focus
        window.dispatchEvent(new CustomEvent('switch-tab', { 
          detail: { tab: 'inventory', inventoryFocus: 'low-stock' } 
        }));
        break;
      case 'view-party-ledger':
        // Switch to customers and view specific customer
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'customers' } }));
        if (data) {
          window.dispatchEvent(new CustomEvent('view-details', { 
            detail: { type: 'customer', item: { id: data } } 
          }));
        }
        break;
      case 'view-product-stock':
        // Switch to inventory and view specific product
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'inventory' } }));
        if (data) {
          window.dispatchEvent(new CustomEvent('view-details', { 
            detail: { type: 'product', item: { id: data } } 
          }));
        }
        break;
      case 'record-payment-for':
        // Switch to payments with specific invoice
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'payments' } }));
        break;
      case 'export-ledger':
        // Export customers CSV directly
        try {
          const csv = exportPartyLedgerToCSV(customers);
          downloadCSV(csv, `Party_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (e) {
          console.error('Failed to export party ledger:', e);
          window.dispatchEvent(new CustomEvent('open-quick-action', { detail: { actionId: 'export-customers' } }));
        }
        break;
      case 'export-stock':
        // Export stock summary CSV directly
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Textile Wholesale Control Panel
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage thaans, invoices, and party ledgers from one window
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleQuickAction('new-invoice')} size="default">
            <FileText className="h-4 w-4 mr-2" />
            Quick Invoice
          </Button>
          <Button onClick={() => handleQuickAction('record-payment')} variant="outline">
            <Wallet className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Seasonal Alert */}
      {isPeakSeason && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Peak Season Active - {currentMonth}</h3>
                <p className="text-sm text-amber-800 mt-1">
                  High demand period. Lock in mill prices 6-8 weeks ahead and increase safety stock 
                  on fast-moving lawn, cotton, and chiffon designs.
                </p>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="mt-2 text-amber-700 hover:text-amber-900"
                  onClick={() => handleQuickAction('seasonal-restock')}
                >
                  View Restock Plan <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Outstanding</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(totalOutstanding)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {topOutstanding.length} active parties
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Invoices</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {overdueParties}
                </p>
                <p className="text-xs text-rose-600 mt-1">
                  Needs collection follow-up
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Thaan Stock</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {stockSummary.totalThaans}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ≈ {stockSummary.totalMeters?.toLocaleString()}m
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Invoices</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {todayInvoices}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(todayRevenue)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common textile wholesale operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleQuickAction('new-invoice')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Quick Invoice</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleQuickAction('record-payment')}
            >
              <Wallet className="h-5 w-5" />
              <span className="text-xs">Receive Payment</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleQuickAction('article-stock')}
            >
              <Package className="h-5 w-5" />
              <span className="text-xs">Article Stock</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleQuickAction('party-ledger')}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Party Ledger</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleQuickAction('add-stock')}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Add Thaans</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleQuickAction('log-commission')}
            >
              <UserCheck className="h-5 w-5" />
              <span className="text-xs">Log Commission</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="parties">
            Parties
            {overdueParties > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {overdueParties}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="payments">Collections</TabsTrigger>
        </TabsList>

        {/* Dashboard View */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Outstanding Parties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Outstanding Parties</CardTitle>
                <CardDescription>Highest credit balances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topOutstanding.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No outstanding balances
                    </p>
                  ) : (
                    topOutstanding.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleQuickAction('view-party-ledger', customer.id)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">
                            {customer.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {customer.domain_data?.shop_name || 'Wholesale Party'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-rose-600">
                            {formatCurrency(customer.outstanding_balance)}
                          </p>
                          {customer.credit_limit > 0 && (
                            <p className="text-xs text-gray-500">
                              Limit: {formatCurrency(customer.credit_limit)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fast Moving Designs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fast Moving Designs</CardTitle>
                <CardDescription>Top selling this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No sales data available
                    </p>
                  ) : (
                    topProducts.slice(0, 8).map((product, idx) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-xs font-semibold text-gray-400 w-4">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {product.domain_data?.articleno || product.sku}
                            </p>
                            <p className="text-xs text-gray-500">
                              {product.domain_data?.designno || product.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-gray-900">
                            {product.sold_qty || 0} {product.unit || 'pcs'}
                          </p>
                          <p className="text-xs text-gray-500">
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
        </TabsContent>

        {/* Parties View */}
        <TabsContent value="parties" className="space-y-4">
          <PartyLedgerView
            customers={customers}
            formatCurrency={formatCurrency}
            onAction={handleQuickAction}
          />
        </TabsContent>

        {/* Stock View */}
        <TabsContent value="stock" className="space-y-4">
          <StockSummaryView
            products={products}
            stockSummary={stockSummary}
            onAction={handleQuickAction}
          />
        </TabsContent>

        {/* Payments View */}
        <TabsContent value="payments" className="space-y-4">
          <PaymentsCollectionView
            recentPayments={recentPayments}
            pendingInvoices={pendingInvoices}
            formatCurrency={formatCurrency}
            onAction={handleQuickAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Party Ledger Sub-component (with full search, filter, credit bar, direct actions)
function PartyLedgerView({ customers = [], formatCurrency, onAction }) {
  const [partySearch, setPartySearch] = useState('');
  const [buyerTypeFilter, setBuyerTypeFilter] = useState('all');
  const [creditFilter, setCreditFilter] = useState('all');

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

      const usage = customer.credit_limit > 0
        ? (customer.outstanding_balance / customer.credit_limit) * 100
        : 0;

      const creditMatch = creditFilter === 'all' ||
        (creditFilter === 'overdue' && customer.outstanding_balance > 0) ||
        (creditFilter === 'warning' && usage >= 60 && usage < 80) ||
        (creditFilter === 'exceeded' && usage >= 80);

      return nameMatch && buyerMatch && creditMatch;
    });
  }, [customers, partySearch, buyerTypeFilter, creditFilter]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Party Ledger ({filteredCustomers.length})</CardTitle>
            <CardDescription>Outstanding balances, credit limits, and buyer details</CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button size="sm" variant="outline" onClick={() => onAction?.('export-ledger')}>
              <FileText className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'customer' } }))}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Party
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by party, shop, market, broker..."
              value={partySearch}
              onChange={(e) => setPartySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-wine-500"
            />
          </div>
          <div className="flex gap-2">
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
              <option value="all">All Credit Status</option>
              <option value="overdue">With Balance</option>
              <option value="warning">Warning (60-80%)</option>
              <option value="exceeded">High Usage (&gt;80%)</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No parties found matching criteria
            </p>
          ) : (
            filteredCustomers.map((customer) => {
              const usage = customer.credit_limit > 0
                ? (customer.outstanding_balance / customer.credit_limit) * 100
                : 0;

              return (
                <div
                  key={customer.id}
                  className="p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{customer.name}</p>
                        {customer.domain_data?.broker_name && (
                          <Badge variant="outline" className="text-xs font-normal">
                            Agent: {customer.domain_data.broker_name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {customer.domain_data?.shop_name || 'Wholesale Party'}
                        {customer.domain_data?.market_location && 
                          ` · ${customer.domain_data.market_location}`}
                        {customer.phone && ` · 📞 ${customer.phone}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={usage > 80 ? 'destructive' : usage > 60 ? 'warning' : 'secondary'}>
                        {customer.domain_data?.buyer_type || 'Retailer'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => onAction?.('view-party-ledger', customer.id)}
                      >
                        View Ledger
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Outstanding Balance</p>
                      <p className="font-semibold text-base text-rose-600">
                        {formatCurrency(customer.outstanding_balance)}
                      </p>
                    </div>
                    {customer.credit_limit > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Credit Limit & Utilization</p>
                        <p className="font-medium text-xs text-gray-900">
                          {formatCurrency(customer.credit_limit)} ({Math.min(Math.round(usage), 100)}%)
                        </p>
                        <div className="w-36 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              usage > 80 ? 'bg-rose-500' : usage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(usage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
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

// Stock Summary Sub-component (with search, fabric type filter, thaan breakdown display)
function StockSummaryView({ products = [], stockSummary, onAction }) {
  const [stockSearch, setStockSearch] = useState('');
  const [fabricFilter, setFabricFilter] = useState('all');

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

      return nameMatch && fabricMatch;
    });
  }, [products, stockSearch, fabricFilter]);

  // Extract unique fabric types from catalog
  const fabricTypes = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.domain_data?.fabrictype) set.add(p.domain_data.fabrictype);
    });
    return Array.from(set);
  }, [products]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Stock by Article ({filteredProducts.length})</CardTitle>
              <CardDescription>Current thaan rolls and meter inventory</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => onAction?.('export-stock')}>
              <FileText className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          </div>

          {/* Search & Fabric Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search article, design, fabric, color..."
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No stock articles found
              </p>
            ) : (
              filteredProducts.map((product) => {
                const breakdownRaw = product.domain_data?.thaan_breakdown || product.domain_data?.thaanbreakdown;
                const { rolls, totalMeters: rollMeters } = parseThaanBreakdown(breakdownRaw);

                return (
                  <div
                    key={product.id}
                    className="p-3.5 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onAction?.('view-product-stock', product.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {product.domain_data?.articleno || product.sku}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {product.domain_data?.designno && `Design #${product.domain_data.designno} · `}
                          {product.domain_data?.fabrictype || 'Fabric'}
                          {product.domain_data?.colorshade && ` · ${product.domain_data.colorshade}`}
                          {product.domain_data?.korafinished && ` (${product.domain_data.korafinished})`}
                        </p>
                        {rolls.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1 font-mono">
                            Rolls ({rolls.length}): {rolls.map(r => `${r}m`).join(', ')} = {rollMeters}m
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-gray-900">
                          {product.stock || 0} {product.unit || 'pcs'}
                        </p>
                        {product.unit === 'thaan' && product.domain_data?.thaanlength && (
                          <p className="text-xs text-gray-500">
                            ≈ {(product.stock || 0) * (product.domain_data.thaanlength || 40)}m
                          </p>
                        )}
                        {product.price > 0 && (
                          <p className="text-xs text-emerald-600 font-medium mt-0.5">
                            PKR {Number(product.price).toLocaleString()}
                          </p>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Thaans</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {stockSummary.totalThaans || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Meters</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {(stockSummary.totalMeters || 0).toLocaleString()}m
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock Value</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {stockSummary.stockValue || 'N/A'}
              </p>
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => onAction?.('add-stock')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Stock
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Payments Collection Sub-component
function PaymentsCollectionView({ recentPayments, pendingInvoices, formatCurrency, onAction }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Collections</CardTitle>
          <CardDescription>Last 10 payments received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No recent payments recorded
              </p>
            ) : (
              recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-3 rounded-lg border flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {payment.customer_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.payment_date).toLocaleDateString()} · {payment.payment_method}
                    </p>
                  </div>
                  <p className="font-semibold text-emerald-600">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Pending Collections ({pendingInvoices.length})</CardTitle>
            <CardDescription>Invoices awaiting payment</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pendingInvoices.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                All invoices paid
              </p>
            ) : (
              pendingInvoices.slice(0, 15).map((invoice) => {
                const dueDate = new Date(invoice.due_date || invoice.created_at);
                const isOverdue = dueDate < new Date();

                return (
                  <div
                    key={invoice.id}
                    className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => onAction?.('record-payment-for', invoice.id)}
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {invoice.customer_name || invoice.customer?.name || 'Party'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {invoice.invoice_number} · Due {dueDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${isOverdue ? 'text-rose-600' : 'text-gray-900'}`}>
                        {formatCurrency(invoice.grand_total - (invoice.paid_amount || 0))}
                      </p>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs mt-0.5">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TextileWholesaleHub;
