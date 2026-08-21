'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Download,
    FileText,
    Calculator,
    Receipt,
    ShieldCheck,
    Loader2,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    CheckCircle2,
    AlertCircle,
    Printer,
    ChevronRight,
    Sparkles,
    SlidersHorizontal,
    Building2,
    Calendar,
} from 'lucide-react';
import { generateReportPDF, exportToCSV } from '@/lib/pdf';
import { formatCurrency } from '@/lib/utils/formatting';
import { formatDisplayDate } from '@/lib/utils/formatDisplayDate';
import { useBusiness } from '@/lib/context/BusinessContext';
import {
    filterRecordsByPeriod,
    getTaxPeriodRange,
    buildTaxPeriodSummaries,
} from '@/lib/utils/taxPeriodFilter';
import { getTaxConfigAction, configureTaxAction } from '@/lib/actions/standard/tax';
import { MobileTabHeader, MobileStatStrip } from '@/components/mobile/MobileTabHeader';
import { MOBILE_TAB_LIST } from '@/lib/utils/formMobileStyles';
import { HUB_MOBILE_ROOT } from '@/lib/utils/mobileLayout';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/**
 * Enhanced Tax & Compliance Manager with rich visual aesthetics, KPI cards,
 * rate distribution progress bars, and an interactive compliance checklist.
 */
export function TaxComplianceManager({ invoices = [], purchaseOrders = [], posTransactions = [], business = {} }) {
    const { regionalStandards, currency, regionalPack } = useBusiness();
    const standards = regionalStandards || { taxLabel: 'GST / PST', taxIdLabel: 'NTN / Tax ID', currency, countryCode: regionalPack?.countryIso || 'PK' };
    const regionalDefaultRate = standards.defaultTaxRate ?? regionalPack?.defaultTaxRate ?? 18;

    const [activeTab, setActiveTab] = useState('overview');
    const [calcAmount, setCalcAmount] = useState('');
    const [calcRate, setCalcRate] = useState(String(regionalDefaultRate));
    const [calcType, setCalcType] = useState('exclusive');
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [savingSettings, setSavingSettings] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const [taxSettings, setTaxSettings] = useState({
        taxId: standards.taxId || business?.ntn || '',
        taxRegion: standards.countryCode === 'PK' ? 'Federal (FBR)' : standards.taxLabel,
        defaultRate: String(regionalDefaultRate),
        filingFrequency: 'monthly',
        filerStatus: 'Non-Filer',
    });

    const periodMeta = useMemo(() => getTaxPeriodRange(selectedPeriod), [selectedPeriod]);

    const periodInvoices = useMemo(
        () => filterRecordsByPeriod(invoices, 'date', selectedPeriod),
        [invoices, selectedPeriod]
    );
    const periodPurchases = useMemo(
        () => filterRecordsByPeriod(
            purchaseOrders.filter((po) => po.status === 'received' || !po.status),
            'date',
            selectedPeriod
        ),
        [purchaseOrders, selectedPeriod]
    );

    useEffect(() => {
        let cancelled = false;
        async function loadConfig() {
            if (!business?.id) {
                setLoadingConfig(false);
                return;
            }
            setLoadingConfig(true);
            try {
                const result = await getTaxConfigAction(business.id);
                if (!cancelled && result.success && result.config) {
                    const cfg = result.config;
                    setTaxSettings((prev) => ({
                        ...prev,
                        taxId: cfg.gst_number || cfg.ntn_number || prev.taxId,
                        defaultRate: String(cfg.sales_tax_rate ?? cfg.gst_rate ?? prev.defaultRate),
                        filerStatus: cfg.filer_status || prev.filerStatus,
                    }));
                    if (cfg.sales_tax_rate != null) {
                        setCalcRate(String(cfg.sales_tax_rate));
                    }
                }
            } catch (error) {
                console.error('Load tax config error:', error);
            } finally {
                if (!cancelled) setLoadingConfig(false);
            }
        }
        loadConfig();
        return () => { cancelled = true; };
    }, [business?.id]);

    const periodPos = useMemo(
        () => filterRecordsByPeriod(posTransactions || [], 'created_at', selectedPeriod),
        [posTransactions, selectedPeriod]
    );

    const taxMetrics = useMemo(() => {
        const invoiceSales = periodInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal ?? inv.grand_total) || 0), 0);
        const invoiceTax = periodInvoices.reduce((sum, inv) => sum + (Number(inv.tax_total ?? inv.total_tax) || 0), 0);
        const posSales = periodPos.reduce((sum, tx) => sum + (Number(tx.subtotal ?? tx.net_amount ?? tx.total_amount) || 0), 0);
        const posTax = periodPos.reduce((sum, tx) => sum + (Number(tx.tax_amount ?? tx.total_tax) || 0), 0);
        const totalSales = invoiceSales + posSales;
        const outputTax = invoiceTax + posTax;
        const totalPurchases = periodPurchases.reduce((sum, po) => sum + (Number(po.subtotal ?? po.total_amount) || 0), 0);
        const inputTax = periodPurchases.reduce((sum, po) => sum + (Number(po.tax_total) || 0), 0);

        const details = {};
        const defaultLabel = standards.taxLabel || 'GST/PST';

        for (const inv of periodInvoices) {
            const tax = Number(inv.tax_total ?? inv.total_tax) || 0;
            const sub = Number(inv.subtotal) || 0;
            if (tax <= 0) continue;
            const bucketRate = sub > 0 ? Math.round((tax / sub) * 100) : 0;
            const key = bucketRate > 0 ? `${defaultLabel} (${bucketRate}%)` : defaultLabel;
            const prev = details[key] || { rate: bucketRate / 100, amount: 0 };
            details[key] = { rate: bucketRate / 100, amount: Math.round((prev.amount + tax) * 100) / 100 };
        }

        for (const tx of periodPos) {
            const tax = Number(tx.tax_amount ?? tx.total_tax) || 0;
            const sub = Number(tx.subtotal ?? tx.net_amount) || 0;
            if (tax <= 0) continue;
            const bucketRate = sub > 0 ? Math.round((tax / sub) * 100) : 0;
            const key = bucketRate > 0 ? `${defaultLabel} (${bucketRate}%)` : defaultLabel;
            const prev = details[key] || { rate: bucketRate / 100, amount: 0 };
            details[key] = { rate: bucketRate / 100, amount: Math.round((prev.amount + tax) * 100) / 100 };
        }

        if (Object.keys(details).length === 0 && outputTax > 0) {
            details[defaultLabel] = { rate: (Number(taxSettings.defaultRate) || 18) / 100, amount: outputTax };
        }

        return {
            totalSales,
            totalPurchases,
            outputTax,
            inputTax,
            details,
            payable: Math.max(0, outputTax - inputTax),
            invoiceCount: periodInvoices.length,
            posCount: periodPos.length,
            purchaseCount: periodPurchases.length,
        };
    }, [periodInvoices, periodPurchases, periodPos, standards, taxSettings.defaultRate]);

    const periodReturns = useMemo(
        () => buildTaxPeriodSummaries(invoices, purchaseOrders.filter((po) => po.status === 'received' || !po.status)),
        [invoices, purchaseOrders]
    );

    const formatMoney = (value) => formatCurrency(value, currency);

    const buildSalesExportRows = () => {
        const invRows = periodInvoices.map((inv) => ({
            invoice_number: inv.invoice_number || inv.number,
            date: formatDisplayDate(inv.date),
            customer_name: inv.customer_name || 'Walk-in',
            subtotal: inv.subtotal,
            tax_total: inv.tax_total ?? inv.total_tax,
            grand_total: inv.grand_total ?? inv.total_amount,
            channel: 'Invoice',
        }));
        const posRows = periodPos.map((tx) => ({
            invoice_number: tx.transaction_number || tx.receipt_number || tx.id,
            date: formatDisplayDate(tx.created_at || tx.transaction_date),
            customer_name: tx.customer_name || 'POS',
            subtotal: tx.subtotal ?? tx.net_amount,
            tax_total: tx.tax_amount ?? tx.total_tax,
            grand_total: tx.total_amount,
            channel: 'POS',
        }));
        return [...invRows, ...posRows];
    };

    const buildPurchaseExportRows = () => periodPurchases.map((po) => ({
        purchase_number: po.purchase_number || '-',
        date: formatDisplayDate(po.date),
        vendor_name: po.vendor_name || 'Supplier',
        subtotal: formatMoney(Number(po.subtotal ?? po.total_amount) || 0),
        tax_total: formatMoney(Number(po.tax_total) || 0),
        total_amount: formatMoney(Number(po.total_amount) || 0),
    }));

    const handleTaxExport = (type, format = 'pdf') => {
        try {
            const stamp = periodMeta.label.replace(/\s+/g, '_');
            if (type === 'Purchases') {
                const rows = buildPurchaseExportRows();
                if (rows.length === 0) {
                    toast.error('No purchase records in the selected period');
                    return;
                }
                if (format === 'csv') {
                    exportToCSV(rows, `${standards.taxLabel}_purchase_register_${stamp}`);
                    toast.success('Purchase register exported');
                    return;
                }
                const doc = generateReportPDF(`${standards.taxLabel} Purchase Register, ${periodMeta.label}`, rows, [
                    { label: 'Bill No', key: 'purchase_number' },
                    { label: 'Date', key: 'date' },
                    { label: 'Vendor', key: 'vendor_name' },
                    { label: 'Taxable', key: 'subtotal' },
                    { label: 'Input Tax', key: 'tax_total' },
                    { label: 'Total', key: 'total_amount' },
                ], {
                    businessName: business?.business_name || business?.name,
                    business,
                    periodLabel: periodMeta.label,
                    currency,
                    locale: regionalPack?.locale,
                });
                doc.save(`${standards.taxLabel}_purchase_register_${stamp}.pdf`);
                toast.success('Purchase register exported');
                return;
            }

            const rows = buildSalesExportRows();
            if (rows.length === 0) {
                toast.error('No sales invoices in the selected period');
                return;
            }

            if (format === 'csv') {
                exportToCSV(rows, `${standards.taxLabel}_sales_register_${stamp}`);
                toast.success(`${type} exported successfully`);
                return;
            }

            const summaryRows = [
                { metric: 'Period', value: periodMeta.label },
                { metric: 'Taxable Sales', value: formatMoney(taxMetrics.totalSales) },
                { metric: 'Output Tax', value: formatMoney(taxMetrics.outputTax) },
                { metric: 'Input Tax Credit', value: formatMoney(taxMetrics.inputTax) },
                { metric: 'Net Payable', value: formatMoney(taxMetrics.payable) },
                { metric: 'Invoices', value: String(taxMetrics.invoiceCount) },
                { metric: 'POS sales', value: String(taxMetrics.posCount || 0) },
                { metric: 'Purchase Bills', value: String(taxMetrics.purchaseCount) },
            ];

            const pdfMeta = {
                businessName: business?.business_name || business?.name,
                business,
                periodLabel: periodMeta.label,
                currency,
                locale: regionalPack?.locale,
            };
            const doc = type === 'Summary'
                ? generateReportPDF(`${standards.taxLabel} Summary, ${periodMeta.label}`, summaryRows, [
                    { label: 'Metric', key: 'metric' },
                    { label: 'Value', key: 'value' },
                ], pdfMeta)
                : generateReportPDF(`${standards.taxLabel} Sales Register, ${periodMeta.label}`, rows, [
                    { label: 'Invoice No', key: 'invoice_number' },
                    { label: 'Date', key: 'date' },
                    { label: 'Customer', key: 'customer_name' },
                    { label: 'Taxable', key: 'subtotal' },
                    { label: 'Output Tax', key: 'tax_total' },
                    { label: 'Total', key: 'grand_total' },
                ], pdfMeta);

            doc.save(`${standards.taxLabel}_${type.toLowerCase()}_${stamp}.pdf`);
            toast.success(`${type} exported successfully`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error(`Failed to export ${type}`);
        }
    };

    const handleSaveSettings = async () => {
        if (!business?.id) {
            toast.error('Business context not ready');
            return;
        }
        setSavingSettings(true);
        try {
            const result = await configureTaxAction({
                businessId: business.id,
                ntnNumber: taxSettings.taxId,
                gstNumber: taxSettings.taxId,
                salesTaxRate: parseFloat(taxSettings.defaultRate) || 0,
                gstRate: parseFloat(taxSettings.defaultRate) || 0,
                filerStatus: taxSettings.filerStatus,
            });
            if (result.success) {
                toast.success('Tax configuration saved');
            } else {
                toast.error(result.error || 'Failed to save tax settings');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to save tax settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const calcValues = useMemo(() => {
        const amt = Number(calcAmount) || 0;
        const rate = Number(calcRate) || 0;
        if (calcType === 'exclusive') {
            const tax = amt * (rate / 100);
            return { taxable: amt, tax, total: amt + tax };
        }
        const taxable = amt / (1 + (rate / 100));
        return { taxable, tax: amt - taxable, total: amt };
    }, [calcAmount, calcRate, calcType]);

    return (
        <div className={cn('min-w-0 space-y-5 overflow-x-hidden touch-manipulation lg:space-y-6', HUB_MOBILE_ROOT)}>
            {/* Mobile View Header */}
            <MobileTabHeader
                icon={ShieldCheck}
                iconClassName="bg-wine/10 text-wine"
                title={`${standards.taxLabel} & Compliance`}
                subtitle={`Output tax, input credit · ${periodMeta.label}`}
                actions={[
                    { id: 'csv', label: 'CSV', icon: Download, onClick: () => handleTaxExport('Statement', 'csv') },
                    { id: 'pdf', label: 'Summary', icon: FileText, onClick: () => handleTaxExport('Summary') },
                    { id: 'print', label: 'Print', icon: Printer, onClick: () => window.print() },
                ]}
            />

            {/* Mobile Metric Strip */}
            <div className="lg:hidden print:hidden">
                <div className="mb-3 flex items-center gap-2">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="h-9 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold shadow-xs"
                    >
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                        <option value="all">All Time</option>
                    </select>
                    <Button variant="outline" size="sm" className="h-9 shrink-0 rounded-xl border-wine/20 text-wine text-[11px] font-bold" onClick={() => handleTaxExport('Purchases', 'pdf')}>
                        Purchases
                    </Button>
                </div>
                <MobileStatStrip
                    layout="grid"
                    items={[
                        { label: 'Taxable sales', value: formatMoney(taxMetrics.totalSales) },
                        { label: `${standards.taxLabel} output`, value: formatMoney(taxMetrics.outputTax), valueTone: 'text-wine' },
                        { label: 'Net payable', value: formatMoney(taxMetrics.payable), valueTone: 'text-red-600', alert: taxMetrics.payable > 0 },
                        { label: 'Input credit', value: formatMoney(taxMetrics.inputTax), valueTone: 'text-green-600' },
                    ]}
                />
            </div>

            {/* Desktop Modern Header & Action Bar */}
            <div className="hidden flex-col gap-4 md:flex-row md:items-center md:justify-between lg:flex print:hidden">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-wine/15 to-wine/5 text-wine rounded-2xl shadow-xs border border-wine/10">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                {standards.taxLabel} & Compliance
                                <Badge variant="outline" className="ml-1 bg-wine/5 border-wine/20 text-wine text-xs font-semibold">
                                    {taxSettings.taxRegion || 'FBR Standard'}
                                </Badge>
                            </h2>
                            <p className="text-xs text-gray-500 font-medium">
                                Output tax, input credit & filing summaries for <span className="font-semibold text-gray-800">{periodMeta.label}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="h-10 rounded-xl border border-gray-200 bg-white px-3.5 pr-8 text-xs font-semibold text-gray-700 shadow-2xs hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-wine/20 transition-all"
                        >
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>

                    <Button variant="outline" onClick={() => handleTaxExport('Statement', 'csv')} className="h-10 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-bold text-xs rounded-xl shadow-2xs">
                        <Download className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                        CSV Sales
                    </Button>

                    <Button variant="outline" onClick={() => handleTaxExport('Purchases', 'pdf')} className="h-10 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-bold text-xs rounded-xl shadow-2xs">
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                        Purchase Register
                    </Button>

                    <Button onClick={() => handleTaxExport('Summary')} className="h-10 bg-wine hover:bg-wine/90 text-white font-bold text-xs rounded-xl shadow-md shadow-wine/20 px-4 transition-all">
                        <ShieldCheck className="w-4 h-4 mr-1.5" />
                        {standards.taxLabel} Summary PDF
                    </Button>

                    <Button variant="outline" onClick={() => window.print()} className="h-10 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-bold text-xs rounded-xl shadow-2xs">
                        <Printer className="w-3.5 h-3.5 mr-1 text-gray-500" />
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={cn(MOBILE_TAB_LIST, 'rounded-2xl bg-gray-100/70 p-1.5 lg:grid lg:grid-cols-4 print:hidden border border-gray-200/50')}>
                    <TabsTrigger value="overview" className="rounded-xl text-[11px] sm:text-xs font-bold py-2.5 data-[state=active]:bg-white data-[state=active]:text-wine data-[state=active]:shadow-xs transition-all">
                        <Receipt className="w-3.5 h-3.5 mr-1.5 hidden sm:inline-block" />
                        Summary Overview
                    </TabsTrigger>
                    <TabsTrigger value="returns" className="rounded-xl text-[11px] sm:text-xs font-bold py-2.5 data-[state=active]:bg-white data-[state=active]:text-wine data-[state=active]:shadow-xs transition-all">
                        <FileText className="w-3.5 h-3.5 mr-1.5 hidden sm:inline-block" />
                        Tax Filings
                    </TabsTrigger>
                    <TabsTrigger value="calculator" className="rounded-xl text-[11px] sm:text-xs font-bold py-2.5 data-[state=active]:bg-white data-[state=active]:text-wine data-[state=active]:shadow-xs transition-all">
                        <Calculator className="w-3.5 h-3.5 mr-1.5 hidden sm:inline-block" />
                        Quick Calculator
                    </TabsTrigger>
                    <TabsTrigger value="config" className="rounded-xl text-[11px] sm:text-xs font-bold py-2.5 data-[state=active]:bg-white data-[state=active]:text-wine data-[state=active]:shadow-xs transition-all">
                        <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 hidden sm:inline-block" />
                        Tax Settings
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: SUMMARY OVERVIEW */}
                <TabsContent value="overview" className="space-y-6 pt-4 animate-in fade-in duration-300">
                    {/* Elevated 4-Grid KPI Cards */}
                    <div className="hidden grid-cols-1 gap-4 md:grid-cols-2 lg:grid lg:grid-cols-4">
                        {/* 1. Taxable Sales */}
                        <Card className="border border-gray-200/80 bg-white shadow-xs rounded-2xl hover:shadow-md transition-all">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Taxable Sales</CardTitle>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">{formatMoney(taxMetrics.totalSales)}</div>
                                <div className="mt-2 flex items-center justify-between text-xs text-gray-500 font-medium">
                                    <span>{taxMetrics.invoiceCount} inv · {taxMetrics.posCount || 0} POS</span>
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border-0">{periodMeta.label}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Tax Output */}
                        <Card className="border border-wine/10 bg-gradient-to-br from-wine/5 via-white to-white shadow-xs rounded-2xl hover:shadow-md transition-all">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-xs font-bold text-wine/80 uppercase tracking-wider">{standards.taxLabel} Output</CardTitle>
                                <div className="p-2 bg-wine/10 text-wine rounded-xl">
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-wine tracking-tight tabular-nums">{formatMoney(taxMetrics.outputTax)}</div>
                                <p className="text-xs text-gray-500 mt-2 font-medium">Collected on sales & invoices</p>
                            </CardContent>
                        </Card>

                        {/* 3. Input Tax Credit */}
                        <Card className="border border-green-200/60 bg-gradient-to-br from-green-50/40 via-white to-white shadow-xs rounded-2xl hover:shadow-md transition-all">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-xs font-bold text-green-700 uppercase tracking-wider">Input Tax Credit</CardTitle>
                                <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                                    <ArrowDownRight className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 tracking-tight tabular-nums">{formatMoney(taxMetrics.inputTax)}</div>
                                <p className="text-xs text-gray-500 mt-2 font-medium">{taxMetrics.purchaseCount} received purchase bill(s)</p>
                            </CardContent>
                        </Card>

                        {/* 4. Net Payable */}
                        <Card className="border border-red-200/80 bg-gradient-to-br from-red-50/30 via-white to-white shadow-xs rounded-2xl hover:shadow-md transition-all">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-xs font-bold text-red-700 uppercase tracking-wider">Net Tax Payable</CardTitle>
                                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                                    <Wallet className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600 tracking-tight tabular-nums">{formatMoney(taxMetrics.payable)}</div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-gray-500 font-medium">Output − Input Credit</span>
                                    {taxMetrics.payable > 0 ? (
                                        <Badge variant="secondary" className="bg-red-100 text-red-700 text-[10px] font-bold border-0">Payment Due</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] font-bold border-0">Balanced</Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tax Breakdown & Compliance Checklist Split */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Visual Output Tax Rate Breakdown Card */}
                        <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                            <CardHeader className="bg-gradient-to-r from-wine/5 via-wine/2 to-transparent border-b border-wine/10 py-4 px-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-wine text-base font-bold flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-wine" />
                                        Output Tax Rate Breakdown
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-white text-wine border-wine/20 text-[10px] font-bold">
                                        {periodMeta.label}
                                    </Badge>
                                </div>
                                <CardDescription className="text-gray-500 text-xs font-medium mt-0.5">
                                    Output tax aggregated by actual rate bucket
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                {Object.entries(taxMetrics.details || {}).length === 0 ? (
                                    <div className="py-8 text-center space-y-2">
                                        <Receipt className="w-8 h-8 text-gray-300 mx-auto" />
                                        <p className="text-sm font-semibold text-gray-500">No taxable sales in this period.</p>
                                        <p className="text-xs text-gray-400">Recorded sales invoices and POS orders will appear here.</p>
                                    </div>
                                ) : (
                                    Object.entries(taxMetrics.details || {}).map(([key, val]) => {
                                        const sharePct = taxMetrics.outputTax > 0
                                            ? Math.round((val.amount / taxMetrics.outputTax) * 100)
                                            : 0;
                                        return (
                                            <div key={key} className="space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-wine"></span>
                                                        {key}
                                                    </span>
                                                    <div className="text-right">
                                                        <span className="font-bold text-gray-900 tabular-nums">{formatMoney(val.amount)}</span>
                                                        <span className="text-gray-400 text-[11px] ml-1.5">({sharePct}%)</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-wine h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.max(5, sharePct)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">Total Output Tax</p>
                                        <p className="text-[11px] text-gray-400">Sum of all sales tax buckets</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-wine tabular-nums">{formatMoney(taxMetrics.outputTax)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interactive Compliance Checklist Card */}
                        <Card className="border border-blue-100 shadow-sm rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50/40 via-white to-white">
                            <CardHeader className="bg-blue-50/60 border-b border-blue-100/60 py-4 px-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-blue-900 text-base font-bold flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                        FBR & Regional Compliance Checklist
                                    </CardTitle>
                                    <Badge className="bg-blue-100 text-blue-800 text-[10px] font-bold border-0">
                                        Active Audit
                                    </Badge>
                                </div>
                                <CardDescription className="text-blue-700/80 text-xs font-medium mt-0.5">
                                    Essential compliance checks before filing tax returns
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-6 space-y-4">
                                {/* Checklist Item 1: Input Tax Claims */}
                                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-blue-100/80 shadow-2xs">
                                    <div className="p-1.5 bg-green-100 text-green-700 rounded-lg shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900">Claim Input Tax Credit</p>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                            Ensure purchase bills are recorded as <strong className="text-gray-800">Received</strong> to deduct input GST.
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-blue-700 hover:bg-blue-50 font-bold shrink-0 h-8 px-2.5 rounded-lg"
                                        onClick={() => handleTaxExport('Purchases', 'pdf')}
                                    >
                                        Register
                                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                                    </Button>
                                </div>

                                {/* Checklist Item 2: NTN / Tax ID Validation */}
                                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-blue-100/80 shadow-2xs">
                                    {taxSettings.taxId ? (
                                        <div className="p-1.5 bg-green-100 text-green-700 rounded-lg shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-gray-900">{standards.taxIdLabel} Verification</p>
                                            {taxSettings.taxId ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold">
                                                    {taxSettings.taxId}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                                                    Missing
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                            Keep NTN printed on all B2B invoices for compliance.
                                        </p>
                                    </div>
                                    {!taxSettings.taxId && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-wine hover:bg-wine/5 font-bold shrink-0 h-8 px-2.5 rounded-lg"
                                            onClick={() => setActiveTab('config')}
                                        >
                                            Setup
                                            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                                        </Button>
                                    )}
                                </div>

                                {/* Checklist Item 3: Export Sales & Filing Package */}
                                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-blue-100/80 shadow-2xs">
                                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900">Tax Return Sales Register</p>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                            Export official sales register before submitting monthly returns to FBR or PRA.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 font-bold text-xs shrink-0 h-8 px-3 rounded-lg"
                                        onClick={() => handleTaxExport('Statement')}
                                    >
                                        Export PDF
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 2: FILINGS & PERIOD SUMMARIES */}
                <TabsContent value="returns" className="space-y-4 pt-4">
                    <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white">
                        <CardHeader className="bg-gray-50/60 border-b border-gray-100 py-4 px-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-gray-900 font-bold text-base flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-wine" />
                                    {standards.taxIdLabel} Period Returns & Summaries
                                </CardTitle>
                                <Badge variant="outline" className="bg-white text-gray-600 text-[10px] font-bold">
                                    Automated Ledger Sums
                                </Badge>
                            </div>
                            <CardDescription className="text-gray-500 text-xs">
                                Computed from recorded sales invoices and received purchase bills per return period
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {periodReturns.length === 0 ? (
                                <div className="py-12 text-center space-y-3">
                                    <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                                    <p className="text-sm font-semibold text-gray-500">No tax return activity recorded yet.</p>
                                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                        As you create sales invoices and purchase bills, monthly tax period summaries will accumulate here automatically.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {periodReturns.map((item) => (
                                        <div key={item.periodKey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl hover:border-wine/20 hover:bg-wine/2 transition-all shadow-2xs">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-wine/5 text-wine rounded-xl shrink-0">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{item.period}</p>
                                                    <p className="text-xs text-gray-400 font-medium">
                                                        Due Date: <span className="font-semibold text-gray-700">{item.dueDate}</span> · {item.invoiceCount} invoices / {item.purchaseCount} purchase bills
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-6">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Tax Payable</p>
                                                    <p className="font-bold text-gray-900 text-base tabular-nums">{formatMoney(item.netPayable)}</p>
                                                </div>
                                                <Badge className={item.status === 'Settled' ? 'bg-green-100 text-green-700 font-bold border-0 px-3 py-1' : 'bg-amber-100 text-amber-800 font-bold border-0 px-3 py-1'}>
                                                    {item.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: QUICK TAX CALCULATOR */}
                <TabsContent value="calculator" className="pt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white">
                            <CardHeader className="border-b border-gray-100 py-4 px-6">
                                <CardTitle className="text-gray-900 font-bold text-base flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-wine" />
                                    Quick Tax Calculator
                                </CardTitle>
                                <CardDescription className="text-gray-500 text-xs">
                                    Calculate tax-exclusive or tax-inclusive amounts instantly
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-700">Amount</Label>
                                    <Input
                                        type="number"
                                        value={calcAmount}
                                        onChange={(e) => setCalcAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="h-11 font-bold text-lg rounded-xl border-gray-200"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-700">Tax Rate (%)</Label>
                                        <Input
                                            type="number"
                                            value={calcRate}
                                            onChange={(e) => setCalcRate(e.target.value)}
                                            className="h-10 rounded-xl border-gray-200 font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-700">Calculation Type</Label>
                                        <select
                                            value={calcType}
                                            onChange={(e) => setCalcType(e.target.value)}
                                            className="flex h-10 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-xs font-bold"
                                        >
                                            <option value="exclusive">Tax Exclusive (+ Tax)</option>
                                            <option value="inclusive">Tax Inclusive (Extract Tax)</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Calculation Results Card */}
                        <Card className="border border-wine/20 bg-gradient-to-br from-wine/5 via-white to-white shadow-sm rounded-2xl">
                            <CardHeader className="border-b border-wine/10 py-4 px-6">
                                <CardTitle className="text-wine text-base font-bold flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-wine" />
                                    Calculation Results
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center border-b border-wine/10 pb-3">
                                    <span className="text-xs font-bold text-gray-600">Taxable Amount</span>
                                    <span className="text-lg font-bold text-gray-900 tabular-nums">{formatMoney(calcValues.taxable)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-wine/10 pb-3">
                                    <span className="text-xs font-bold text-gray-600">{standards.taxLabel} @ {calcRate}%</span>
                                    <span className="text-lg font-bold text-wine tabular-nums">{formatMoney(calcValues.tax)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm font-bold text-gray-900">Total Value</span>
                                    <span className="text-2xl font-bold text-emerald-600 tabular-nums">{formatMoney(calcValues.total)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 4: TAX SETTINGS */}
                <TabsContent value="config" className="pt-4">
                    <Card className="max-w-2xl mx-auto border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                        <CardHeader className="bg-gray-50/60 border-b border-gray-100 py-4 px-6">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                                <Building2 className="w-5 h-5 text-wine" />
                                Business {standards.taxIdLabel} Configuration
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500">
                                Persisted to your business tax configuration for invoices and filing summaries
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {loadingConfig ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-wine" />
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-700">{standards.taxIdLabel} Number</Label>
                                            <Input
                                                value={taxSettings.taxId}
                                                onChange={(e) => setTaxSettings({ ...taxSettings, taxId: e.target.value })}
                                                placeholder="e.g. 1234567-8"
                                                className="h-10 rounded-xl border-gray-200 font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-700">Default Tax Rate (%)</Label>
                                            <Input
                                                type="number"
                                                value={taxSettings.defaultRate}
                                                onChange={(e) => setTaxSettings({ ...taxSettings, defaultRate: e.target.value })}
                                                className="h-10 rounded-xl border-gray-200 font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-700">Filer Status</Label>
                                            <select
                                                value={taxSettings.filerStatus}
                                                onChange={(e) => setTaxSettings({ ...taxSettings, filerStatus: e.target.value })}
                                                className="flex h-10 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-xs font-bold"
                                            >
                                                <option value="Filer">Active Filer</option>
                                                <option value="Non-Filer">Non-Filer</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-700">Filing Frequency</Label>
                                            <select
                                                value={taxSettings.filingFrequency}
                                                onChange={(e) => setTaxSettings({ ...taxSettings, filingFrequency: e.target.value })}
                                                className="flex h-10 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-xs font-bold"
                                            >
                                                <option value="monthly">Monthly</option>
                                                <option value="quarterly">Quarterly</option>
                                                <option value="annually">Annually</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <Button
                                            onClick={handleSaveSettings}
                                            disabled={savingSettings}
                                            className="bg-wine hover:bg-wine/90 text-white font-bold px-8 rounded-xl h-10 shadow-md shadow-wine/20 transition-all"
                                        >
                                            {savingSettings ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : 'Save Configuration'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
