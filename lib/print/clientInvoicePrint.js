'use client';

import { downloadInvoicePDF } from '@/lib/pdf';
import { normalizeInvoiceForDocument, isPakistaniBusiness } from '@/lib/utils/invoiceDocument';
import { dispatchThermalReceipt } from '@/lib/print/thermalReceipt';
import { printVehicleBuyerSellerReceiptHtml } from '@/lib/print/vehicleBuyerSellerReceiptHtml';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import { getDomainConfig } from '@/lib/config/domains';
import { resolvePosSettings } from '@/lib/config/posSettings';
import { getInvoiceForPrintAction } from '@/lib/actions/basic/invoice';

function resolveInvoiceLineItems(invoice) {
  const rawItems = invoice?.items || [];
  const lineItems = rawItems.map((item) => ({
    name: item.name || item.product_name || item.description || 'Item',
    sku: item.sku || item.product_sku,
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unit_price ?? item.rate ?? item.unitPrice ?? 0),
    lineTotal:
      Number(item.total_amount ?? item.amount ?? item.lineTotal ?? 0) ||
      Math.round(
        Number(item.unit_price ?? item.rate ?? item.unitPrice ?? 0) * Number(item.quantity || 1) * 100
      ) / 100,
  }));

  if (!lineItems.length) {
    const total = Number(invoice?.grand_total ?? invoice?.amount ?? invoice?.total ?? 0);
    lineItems.push({
      name: invoice?.invoice_number || invoice?.invoiceNumber || 'Sale',
      quantity: 1,
      unitPrice: total,
      lineTotal: total,
    });
  }

  return lineItems;
}

/**
 * Build thermal receipt opts from a DB row or invoice builder draft.
 * Thermal is a till-style receipt — not the standard A4 invoice.
 */
export function buildInvoiceThermalReceiptOpts(invoice, business, category = 'retail-shop') {
  const domainConfig = getDomainConfig(category);
  const documentLabel = domainConfig?.label_overrides?.invoice || 'Receipt';
  const currencyCode = getBusinessRegionalPack(business).currency;
  const posSettings = resolvePosSettings(business);
  const taxAmount = Number(invoice?.tax_total ?? invoice?.total_tax ?? invoice?.taxAmount ?? 0);

  return {
    business,
    documentLabel,
    category,
    currencyCode,
    paperSize: posSettings.paperSize === '80mm' ? '80mm' : '58mm',
    sale: {
      invoice_number: invoice?.invoice_number || invoice?.invoiceNumber,
      date: invoice?.date || invoice?.created_at || new Date().toISOString(),
      customerName:
        invoice?.customer_name ||
        invoice?.customer?.name ||
        invoice?.customerName ||
        null,
      paymentMethod: invoice?.payment_method || invoice?.paymentMethod || 'cash',
      subtotal: invoice?.subtotal ?? invoice?.subtotal_amount,
      taxAmount,
      discountAmount: invoice?.discount_total ?? invoice?.discountAmount,
      total: invoice?.grand_total ?? invoice?.amount ?? invoice?.total,
    },
    lineItems: resolveInvoiceLineItems(invoice),
  };
}

/**
 * Hydrate invoice line items when the hub list row omitted them.
 * @param {object} invoice
 * @param {string | null | undefined} businessId
 */
export async function resolveInvoiceRowForPrint(invoice, businessId) {
  const hasItems = Array.isArray(invoice?.items) && invoice.items.length > 0;
  if (hasItems || !invoice?.id || !businessId) return invoice;
  try {
    const res = await getInvoiceForPrintAction(businessId, invoice.id);
    if (res?.success && res.invoice) return res.invoice;
  } catch (err) {
    console.warn('[invoicePrint] hydrate items failed', err);
  }
  return invoice;
}

/**
 * Standard A4 invoice PDF (domain Delivery Bill / Sales Bill / etc.).
 * Sync path when items are already on the row (detail dialog / builder).
 */
export function printInvoicePdfFromRow(invoice, business, category = 'retail-shop') {
  const businessWithCategory = {
    ...business,
    category: business?.category || category,
  };
  const normalized = normalizeInvoiceForDocument(
    { ...invoice, category: invoice.category || category },
    invoice.items || [],
    businessWithCategory
  );
  downloadInvoicePDF(
    normalized,
    normalized.totals,
    {
      ...normalized.business,
      category: businessWithCategory.category,
      settings: business?.settings,
    },
    isPakistaniBusiness(business)
  );
  return true;
}

/**
 * Preferred hub entry: hydrate line items then download standard A4 PDF.
 * @returns {Promise<boolean>}
 */
export async function downloadStandardInvoicePdfFromRow(
  invoice,
  business,
  category = 'retail-shop',
  options = {}
) {
  const businessId = options.businessId || business?.id || business?.business_id;
  const full = await resolveInvoiceRowForPrint(invoice, businessId);
  printInvoicePdfFromRow(full, business, category);
  return true;
}

/** Print exact-size 58mm/80mm thermal receipt (POS paper settings) — optional till copy. */
export async function printInvoiceThermalFromRow(invoice, business, category = 'retail-shop', options = {}) {
  const businessId = options.businessId || business?.id || business?.business_id;
  const full = await resolveInvoiceRowForPrint(invoice, businessId);
  return dispatchThermalReceipt(buildInvoiceThermalReceiptOpts(full, business, category), 'print');
}

/** Print standard Vehicle Buyer-Seller Receipt HTML page for vehicle verticals. */
export async function printVehicleBuyerSellerReceiptFromRow(
  invoice,
  business,
  category = 'vehicle-dealership',
  options = {}
) {
  const businessId = options.businessId || business?.id || business?.business_id;
  const full = await resolveInvoiceRowForPrint(invoice, businessId);
  return printVehicleBuyerSellerReceiptHtml(full, business, category);
}

/** Download official Installment Application Form PDF from invoice row or draft. */
export async function downloadInstallmentFormPdfFromRow(
  invoice,
  business,
  category = 'vehicle-dealership',
  options = {}
) {
  const businessId = options.businessId || business?.id || business?.business_id;
  const full = await resolveInvoiceRowForPrint(invoice, businessId);

  const customer = full.customer || {};
  const agreement = full.vehicleAgreement || full.vehicle_meta || full.taxDetails?.vehicleAgreement || {};
  const items = Array.isArray(full.items) ? full.items : [];
  const selectedVehicle = agreement.makeModel || (items[0]?.name || items[0]?.product_name) || 'Vehicle / Product';
  const productPrice = Number(full.grand_total ?? full.amount ?? full.total ?? 0);
  const downPaymentPct = Number(agreement.downPaymentPct || 20);
  const downPaymentAmount = Number(agreement.downPaymentAmount || Math.round(productPrice * (downPaymentPct / 100)));
  const durationMonths = Number(agreement.durationMonths || 24);
  const monthlyInstallment = Number(
    agreement.monthlyInstallment || Math.round(((productPrice - downPaymentAmount) * 1.25) / durationMonths)
  );

  const pdfDoc = await generateInstallmentFormPdf({
    storeName: business?.name || business?.business_name || 'Showroom',
    selectedVehicle,
    productPrice,
    downPaymentAmount,
    downPaymentPct,
    durationMonths,
    monthlyInstallment,
    applicant: {
      fullName: agreement.buyerName || customer.name || '',
      phone: agreement.buyerPhone || customer.phone || '',
      cnic: agreement.buyerCnic || customer.cnic || customer.domain_data?.cnic || '',
      address: customer.address || '',
      city: customer.city || '',
      witness1Name: agreement.witness1Name || '',
      witness1Phone: agreement.witness1Phone || '',
      witness1Cnic: agreement.witness1Cnic || '',
      witness2Name: agreement.witness2Name || '',
      witness2Phone: agreement.witness2Phone || '',
      witness2Cnic: agreement.witness2Cnic || '',
    },
    contact: {
      phone: business?.phone || business?.phone_number || '',
      email: business?.email || '',
    },
    category,
    business,
  });

  pdfDoc.save(`Installment-Application-Form-${full.invoice_number || full.invoiceNumber || 'Draft'}.pdf`);
  return true;
}
