'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle2, Package, Loader2, FileText, Building2, MapPin, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useBusiness } from '@/lib/context/BusinessContext';
import { purchaseAPI } from '@/lib/api/purchases';
import { downloadPurchaseOrderPdf } from '@/lib/pdf/purchaseOrderPdf';
import toast from 'react-hot-toast';
import {
  getPurchaseStatusLabel,
  isReceivablePurchaseStatus,
  normalizePurchaseStatus,
  PURCHASE_STATUSES,
} from '@/lib/constants/purchaseStatus';

export default function GRNView({ poId, businessId, business, onUpdateStatus, colors, initialPo = null }) {
    const { currency: ctxCurrency } = useBusiness();
    const currency = business?.currency || ctxCurrency || 'PKR';
    const brandColorHex =
        business?.settings?.brand?.primaryColor ||
        business?.settingsParsed?.brand?.primaryColor ||
        colors?.primary ||
        '#0284c7';

    const targetPoId = poId || initialPo?.id;
    const targetBusinessId = businessId || initialPo?.business_id || business?.id;

    const [purchase, setPurchase] = useState(initialPo);
    const [loading, setLoading] = useState(!initialPo);

    useEffect(() => {
        if (initialPo) setPurchase(initialPo);
    }, [initialPo]);

    useEffect(() => {
        async function fetchDetails() {
            if (!targetPoId || !targetBusinessId) {
                setLoading(false);
                return;
            }
            try {
                if (!initialPo) setLoading(true);
                const data = await purchaseAPI.getById(targetBusinessId, targetPoId);
                if (data) {
                    setPurchase(data);
                }
            } catch (error) {
                console.error('Error fetching PO details:', error);
                if (!initialPo && !purchase) {
                    toast.error('Failed to load document details');
                }
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [targetPoId, targetBusinessId]);

    if (loading && !purchase) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
    if (!purchase) return <div className="p-8 text-center text-gray-400 font-medium">Document not found</div>;

    const isReceived = normalizePurchaseStatus(purchase.status) === PURCHASE_STATUSES.RECEIVED;
    const canReceive = isReceivablePurchaseStatus(purchase.status);
    const vendorAddress = [purchase.vendor_address, purchase.vendor_city].filter(Boolean).join(', ');

    // Normalize item array from purchase object
    const rawItems = purchase.items || purchase.purchase_items || purchase.lines || purchase.po_items || [];
    const items = Array.isArray(rawItems) ? rawItems : [];

    // Calculate bulletproof financial totals
    const calculatedSubtotal = items.reduce((sum, item) => {
        const qty = Number(item.quantity ?? item.qty ?? 0);
        const cost = Number(item.unit_cost ?? item.unitCost ?? item.cost ?? 0);
        const itemTotal = Number(item.total_amount ?? item.total ?? (qty * cost));
        return sum + (itemTotal > 0 ? itemTotal : qty * cost);
    }, 0);

    const taxTotal = Number(purchase.tax_total ?? purchase.total_tax ?? 0);
    const grandTotal = Number(purchase.total_amount ?? purchase.total ?? 0) || (calculatedSubtotal + taxTotal);
    const subtotal = Number(purchase.subtotal) > 0 
        ? Number(purchase.subtotal) 
        : (calculatedSubtotal > 0 ? calculatedSubtotal : (grandTotal > taxTotal ? grandTotal - taxTotal : grandTotal));

    const normalizedPurchase = {
        ...purchase,
        items,
        subtotal,
        tax_total: taxTotal,
        total_amount: grandTotal,
    };

    const handleDownloadPdf = () => {
        try {
            downloadPurchaseOrderPdf({ purchase: normalizedPurchase, business, currency });
            toast.success('Purchase Order PDF downloaded');
        } catch (err) {
            console.error('Failed to generate PO PDF:', err);
            toast.error('Could not generate PDF');
        }
    };

    const handlePrintDocument = () => {
        try {
            const elem = document.getElementById('printable-grn');
            if (!elem) {
                window.print();
                return;
            }

            const clone = elem.cloneNode(true);
            const noPrints = clone.querySelectorAll('.no-print');
            noPrints.forEach((el) => el.remove());

            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow.document;
            const docTitle = isReceived ? `GRN_${purchase.purchase_number}` : `PO_${purchase.purchase_number}`;

            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>${docTitle}</title>
                        <style>
                            @page {
                                size: A4 portrait;
                                margin: 10mm 12mm;
                            }
                            * {
                                box-sizing: border-box;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            html, body {
                                margin: 0 !important;
                                padding: 0 !important;
                                background: #ffffff !important;
                                color: #111827 !important;
                                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                                font-size: 12px;
                                line-height: 1.5;
                            }
                            .no-print {
                                display: none !important;
                            }
                            table {
                                border-collapse: collapse !important;
                                width: 100% !important;
                            }
                            th, td {
                                border: 1px solid #e5e7eb !important;
                                padding: 6px 10px !important;
                            }
                            thead th {
                                background-color: #f3f4f6 !important;
                                color: #374151 !important;
                                text-transform: uppercase !important;
                                font-size: 10px !important;
                                letter-spacing: 0.05em !important;
                            }
                        </style>
                        ${Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
                            .map((el) => el.outerHTML)
                            .join('\n')}
                        <style>
                            @media print {
                                @page {
                                    size: A4 portrait;
                                    margin: 10mm 12mm;
                                }
                                html, body {
                                    visibility: visible !important;
                                    opacity: 1 !important;
                                    background: #ffffff !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                }
                                body * {
                                    visibility: visible !important;
                                    opacity: 1 !important;
                                }
                                .no-print, .no-print * {
                                    display: none !important;
                                    visibility: hidden !important;
                                }
                            }
                            body * {
                                visibility: visible !important;
                                opacity: 1 !important;
                            }
                            .no-print {
                                display: none !important;
                            }
                        </style>
                    </head>
                    <body>
                        <div id="printable-grn" style="padding: 12px; background: white;">
                            ${clone.innerHTML}
                        </div>
                    </body>
                </html>
            `);
            doc.close();

            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 1000);
            }, 300);
        } catch (err) {
            console.error('Print iframe error:', err);
            window.print();
        }
    };

    return (
        <div id="printable-grn" className="space-y-8 animate-in fade-in duration-500 bg-white p-2 text-gray-900">
            {/* Top Brand Strip */}
            <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: brandColorHex }} />

            {/* Header Info */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 border-2 border-gray-900 text-gray-900 rounded-lg">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {isReceived ? 'Good Receipt Note (GRN)' : 'Purchase Order'}
                            </h2>
                            <p className="text-gray-600 font-bold uppercase text-[10px] tracking-widest mt-0.5">
                                Ref: #{purchase.purchase_number}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 pt-2">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <Label className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Supplier Details</Label>
                            </div>
                            <div className="pl-6">
                                <p className="font-semibold text-gray-800 text-lg">{purchase.vendor_name || 'Supplier'}</p>
                                {purchase.vendor_email && <p className="text-sm text-gray-500">{purchase.vendor_email}</p>}
                                {purchase.vendor_phone && <p className="text-sm text-gray-500">{purchase.vendor_phone}</p>}
                                {vendorAddress && (
                                    <p className="text-sm text-gray-500">{vendorAddress}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <Label className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Receiving Entity</Label>
                            </div>
                            <div className="pl-6">
                                <p className="font-semibold text-gray-800 text-lg">{business?.name || 'Main Business'}</p>
                                <p className="text-sm text-gray-500">{business?.address || 'Primary Business Location'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-right space-y-4">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Date Issued</Label>
                        <p className="font-bold text-gray-800 text-sm">{purchase.date ? new Date(purchase.date).toLocaleDateString('en-PK', { dateStyle: 'long' }) : '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Status</Label>
                        <div>
                            <span className="inline-block px-3 py-1 border border-emerald-600 bg-emerald-50 text-emerald-800 font-bold uppercase text-[11px] rounded-md tracking-wider">
                                {getPurchaseStatusLabel(purchase.status)}
                            </span>
                            {isReceived && (
                                <p className="text-[10px] font-medium text-gray-500 mt-1">
                                    Received on {new Date(purchase.updated_at || purchase.date || Date.now()).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Item Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b border-gray-200 font-semibold text-[10px] uppercase text-gray-600 tracking-widest">
                        <tr>
                            <th className="px-6 py-3 text-left">Item Description</th>
                            <th className="px-4 py-3 text-center">SKU</th>
                            <th className="px-4 py-3 text-center">Batch Info</th>
                            <th className="px-4 py-3 text-center w-24">Qty</th>
                            <th className="px-4 py-3 text-right w-32">Unit Cost</th>
                            <th className="px-6 py-3 text-right w-32">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-900">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 font-medium bg-gray-50/50">
                                    No line items recorded for this purchase transaction.
                                </td>
                            </tr>
                        ) : (
                            items.map((item, idx) => {
                                const itemName = item.product_name || item.name || item.description || `Item #${idx + 1}`;
                                const sku = item.product_sku || item.sku || 'N/A';
                                const qty = Number(item.quantity ?? item.qty ?? 0);
                                const cost = Number(item.unit_cost ?? item.unitCost ?? item.cost ?? 0);
                                const itemTotal = Number(item.total_amount ?? item.total ?? (qty * cost));

                                return (
                                    <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <p className="font-bold text-gray-900">{itemName}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-[11px] font-medium text-gray-600">{sku}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.batch_number ? (
                                                <div className="flex flex-col text-[10px] font-bold">
                                                    <span>B# {item.batch_number}</span>
                                                    {item.expiry_date && <span>Exp: {new Date(item.expiry_date).toLocaleDateString()}</span>}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold">{qty}</td>
                                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-800">{formatCurrency(cost, currency)}</td>
                                        <td className="px-6 py-3 text-right tabular-nums font-bold text-gray-900">{formatCurrency(itemTotal, currency)}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Notes */}
            <div className="flex justify-between items-start gap-12">
                <div className="flex-1 space-y-2">
                    <Label className="text-[10px] font-semibold uppercase text-gray-500 tracking-widest">Notes & Instructions</Label>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 border border-gray-200">
                        {purchase.notes || 'No additional notes provided for this transaction.'}
                    </div>
                </div>
                <div className="w-80 space-y-3 pt-2">
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span>Subtotal</span>
                        <span className="tabular-nums font-semibold text-gray-800">{formatCurrency(subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span>GST / Tax Total</span>
                        <span className="tabular-nums font-semibold text-gray-800">{formatCurrency(taxTotal, currency)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between text-xl font-bold text-gray-900">
                            <span>Net Payable</span>
                            <span className="tabular-nums font-bold" style={{ color: brandColorHex }}>{formatCurrency(grandTotal, currency)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signature Blocks */}
            <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs text-gray-500">
                <div className="border-t border-gray-300 pt-2 font-semibold">
                    Prepared By (Procurement)
                </div>
                <div className="border-t border-gray-300 pt-2 font-semibold">
                    Approved By (Management)
                </div>
                <div className="border-t border-gray-300 pt-2 font-semibold">
                    {isReceived ? 'Received By (Storekeeper)' : 'Vendor Acknowledgment'}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 no-print pt-6 border-t border-dashed border-gray-200">
                <Button variant="outline" className="rounded-xl h-11 px-5 font-bold" onClick={handleDownloadPdf}>
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
                <Button variant="outline" className="rounded-xl h-11 px-6 font-bold" onClick={handlePrintDocument}>
                    <Printer className="w-4 h-4 mr-2" /> Print Document
                </Button>
                {canReceive && (
                    <Button
                        className="rounded-xl h-11 px-8 font-semibold shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white"
                        style={{ backgroundColor: '#059669' }}
                        onClick={() => onUpdateStatus?.(purchase.id, PURCHASE_STATUSES.RECEIVED)}
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Received
                    </Button>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 12mm;
                    }
                    #printable-grn, #printable-grn * {
                        visibility: visible !important;
                    }
                    #printable-grn {
                        position: relative !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

