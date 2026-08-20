/**
 * Standard Purchase Order & Good Receipt Note (GRN) PDF Generator
 * Professional, brand-aware A4 PDF documents for procurement.
 * Uses ASCII-safe money formatting for jsPDF Helvetica compatibility.
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  formatPdfMoney,
  formatPdfAmount,
  resolveInvoiceBrandColor,
  formatBusinessAddressBlock,
  resolveBusinessRegistrationLines,
} from '@/lib/pdf/invoiceFormat';

const PAGE_MARGIN = 14;
const CONTENT_WIDTH = 182; // A4 210 - 28

/**
 * Generate a standard Purchase Order / GRN PDF document.
 * @param {object} options
 * @param {object} options.purchase - Purchase Order object with items, vendor, status, etc.
 * @param {object} [options.business] - Tenant business object
 * @param {string} [options.currency] - Currency code (e.g. PKR)
 * @param {string} [options.documentTitle] - Custom title (default: Purchase Order or Good Receipt Note)
 * @returns {jsPDF}
 */
export function generatePurchaseOrderPdf({ purchase, business = {}, currency = 'PKR', documentTitle }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const rightMargin = PAGE_MARGIN + CONTENT_WIDTH; // 196mm

  const settings = business?.settingsParsed || business?.settings || {};
  const brandRgb = resolveInvoiceBrandColor(business, settings); // [R, G, B]
  const currencyCode = purchase?.currency || business?.currency || currency || 'PKR';
  const money = (val) => formatPdfMoney(val, currencyCode);

  const isReceived = String(purchase?.status || '').toLowerCase() === 'received';
  const title = documentTitle || (isReceived ? 'GOOD RECEIPT NOTE' : 'PURCHASE ORDER');

  let y = PAGE_MARGIN;

  // ----------------------------------------------------
  // 1. BRAND ACCENT STRIP
  // ----------------------------------------------------
  doc.setFillColor(brandRgb[0], brandRgb[1], brandRgb[2]);
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 2.5, 'F');
  y += 8;

  // ----------------------------------------------------
  // 2. HEADER: BUSINESS IDENTITY & DOCUMENT METADATA
  // ----------------------------------------------------
  const busHeaderY = y;

  // Left Column: Business Name & Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55); // gray-800
  const busName = String(business?.name || business?.business_name || 'BUSINESS NAME').toUpperCase();
  doc.text(busName, PAGE_MARGIN, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128); // gray-500

  // Address lines (properly handled line by line)
  const addrParts = formatBusinessAddressBlock(business);
  if (addrParts.length > 0) {
    for (const part of addrParts) {
      if (part) {
        doc.text(part, PAGE_MARGIN, y);
        y += 4;
      }
    }
  } else if (business?.address) {
    const splitAddr = doc.splitTextToSize(String(business.address), 90);
    doc.text(splitAddr, PAGE_MARGIN, y);
    y += splitAddr.length * 4;
  }

  // Contact line (phone | email)
  const contactParts = [business?.phone, business?.email].filter(Boolean).join('  |  ');
  if (contactParts) {
    doc.text(contactParts, PAGE_MARGIN, y);
    y += 4;
  }

  // Registration lines (NTN / GSTIN / Tax ID)
  const regLines = resolveBusinessRegistrationLines(business, settings);
  if (regLines.length > 0) {
    doc.text(regLines.join('  |  '), PAGE_MARGIN, y);
    y += 4;
  }

  // Right Column: Document Title & Meta
  let rightY = busHeaderY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(brandRgb[0], brandRgb[1], brandRgb[2]);
  doc.text(title, rightMargin, rightY, { align: 'right' });

  rightY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text(`PO #: ${purchase?.purchase_number || 'PO-0000'}`, rightMargin, rightY, { align: 'right' });

  rightY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  const poDate = purchase?.date
    ? new Date(purchase.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Date: ${poDate}`, rightMargin, rightY, { align: 'right' });

  rightY += 4;
  const statusLabel = String(purchase?.status || 'Draft').toUpperCase();
  doc.text(`Status: ${statusLabel}`, rightMargin, rightY, { align: 'right' });

  y = Math.max(y, rightY) + 5;

  // Horizontal Separator Line
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(0.3);
  doc.line(PAGE_MARGIN, y, rightMargin, y);
  y += 6;

  // ----------------------------------------------------
  // 3. SUPPLIER & RECEIVING LOCATION BOXES
  // ----------------------------------------------------
  const boxWidth = 88;
  const boxGap = 6;
  const leftBoxX = PAGE_MARGIN;
  const rightBoxX = PAGE_MARGIN + boxWidth + boxGap;

  // Box Header Backgrounds
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(leftBoxX, y, boxWidth, 6, 'F');
  doc.rect(rightBoxX, y, boxWidth, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text('SUPPLIER / VENDOR DETAILS', leftBoxX + 3, y + 4.2);
  doc.text('DELIVERY / RECEIVING LOCATION', rightBoxX + 3, y + 4.2);

  y += 9;

  // Supplier Details
  let supY = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39); // gray-900
  const vendorName = purchase?.vendor_name || 'Vendor / Supplier';
  doc.text(vendorName, leftBoxX + 3, supY);
  supY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);

  const vendorAddr = [purchase?.vendor_address, purchase?.vendor_city].filter(Boolean).join(', ');
  if (vendorAddr) {
    const splitVAddr = doc.splitTextToSize(vendorAddr, boxWidth - 6);
    doc.text(splitVAddr, leftBoxX + 3, supY);
    supY += splitVAddr.length * 4;
  }

  const vendorContact = [purchase?.vendor_phone, purchase?.vendor_email].filter(Boolean).join('  |  ');
  if (vendorContact) {
    const splitVContact = doc.splitTextToSize(vendorContact, boxWidth - 6);
    doc.text(splitVContact, leftBoxX + 3, supY);
    supY += splitVContact.length * 4;
  }

  // Delivery Location Details
  let delY = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  const destName = purchase?.warehouse_name || business?.name || 'Primary Warehouse';
  doc.text(destName, rightBoxX + 3, delY);
  delY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);

  const destAddr = purchase?.warehouse_address || business?.address || 'Main Business Premises';
  if (destAddr) {
    const splitDAddr = doc.splitTextToSize(destAddr, boxWidth - 6);
    doc.text(splitDAddr, rightBoxX + 3, delY);
    delY += splitDAddr.length * 4;
  }

  y = Math.max(supY, delY) + 4;

  // ----------------------------------------------------
  // 4. ITEMS TABLE (jsPDF-AutoTable with ASCII Money)
  // ----------------------------------------------------
  const items = Array.isArray(purchase?.items) ? purchase.items : [];
  const tableData = items.map((item, index) => {
    const name = item.product_name || item.name || item.description || `Item #${index + 1}`;
    const sku = item.product_sku || item.sku || '-';
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.unit_cost ?? item.unitCost) || 0;
    const total = Number(item.total_amount ?? item.total) || qty * cost;
    const batchInfo = item.batch_number
      ? `B#: ${item.batch_number}${item.expiry_date ? ` (${item.expiry_date.slice(0, 10)})` : ''}`
      : '-';

    return [
      String(index + 1),
      name,
      sku,
      batchInfo,
      formatPdfAmount(qty),
      money(cost),
      money(total),
    ];
  });

  doc.autoTable({
    startY: y,
    head: [['#', 'Item Description', 'SKU', 'Batch / Expiry', 'Qty', 'Unit Cost', 'Total']],
    body: tableData,
    theme: 'grid',
    tableWidth: CONTENT_WIDTH,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    headStyles: {
      fillColor: [brandRgb[0], brandRgb[1], brandRgb[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 32, halign: 'center' },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 32, halign: 'right' },
    },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [31, 41, 55],
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
  });

  y = (doc.lastAutoTable?.finalY || y) + 7;

  // ----------------------------------------------------
  // 5. TOTALS & FINANCIAL SUMMARY
  // ----------------------------------------------------
  const subtotal = Number(purchase?.subtotal) || items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_cost) || 0), 0);
  const taxTotal = Number(purchase?.tax_total) || 0;
  const grandTotal = Number(purchase?.total_amount) || (subtotal + taxTotal);

  const summaryWidth = 82;
  const summaryLeft = rightMargin - summaryWidth;

  // If notes exist, put notes on left, totals on right
  const startTotalsY = y;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('Subtotal:', summaryLeft, y);
  doc.setTextColor(31, 41, 55);
  doc.text(money(subtotal), rightMargin, y, { align: 'right' });
  y += 5;

  if (taxTotal > 0) {
    doc.setTextColor(107, 114, 128);
    doc.text('Tax / GST Total:', summaryLeft, y);
    doc.setTextColor(31, 41, 55);
    doc.text(money(taxTotal), rightMargin, y, { align: 'right' });
    y += 5;
  }

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.line(summaryLeft, y, rightMargin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(brandRgb[0], brandRgb[1], brandRgb[2]);
  doc.text('Net Total:', summaryLeft, y);
  doc.text(money(grandTotal), rightMargin, y, { align: 'right' });

  let endTotalsY = y + 10;

  // ----------------------------------------------------
  // 6. NOTES & INSTRUCTIONS (Rendered alongside or below)
  // ----------------------------------------------------
  if (purchase?.notes) {
    let notesY = startTotalsY;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text('Notes & Special Instructions:', PAGE_MARGIN, notesY);
    notesY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    const splitNotes = doc.splitTextToSize(String(purchase.notes), 90);
    doc.text(splitNotes, PAGE_MARGIN, notesY);
    endTotalsY = Math.max(endTotalsY, notesY + splitNotes.length * 4 + 6);
  }

  y = endTotalsY;

  // ----------------------------------------------------
  // 7. AUTHORIZED SIGNATURE BLOCKS (Fixed near bottom)
  // ----------------------------------------------------
  const sigY = pageHeight - 32;
  const sigColWidth = (CONTENT_WIDTH - 12) / 3;

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.4);

  // Prepared By
  const sig1X = PAGE_MARGIN;
  doc.line(sig1X, sigY, sig1X + sigColWidth, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Prepared By (Procurement)', sig1X + sigColWidth / 2, sigY + 4, { align: 'center' });

  // Approved By
  const sig2X = PAGE_MARGIN + sigColWidth + 6;
  doc.line(sig2X, sigY, sig2X + sigColWidth, sigY);
  doc.text('Approved By (Management)', sig2X + sigColWidth / 2, sigY + 4, { align: 'center' });

  // Received By / Vendor Ack
  const sig3X = PAGE_MARGIN + (sigColWidth + 6) * 2;
  doc.line(sig3X, sigY, sig3X + sigColWidth, sigY);
  doc.text(isReceived ? 'Received By (Storekeeper)' : 'Vendor Acknowledgment', sig3X + sigColWidth / 2, sigY + 4, { align: 'center' });

  // Page Footer
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text(`Generated by Tenvo ERP on ${new Date().toLocaleDateString('en-US')}  ·  Page 1 of 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
}

/**
 * Trigger browser PDF download for a purchase order / GRN.
 * @param {object} params
 */
export function downloadPurchaseOrderPdf(params) {
  const doc = generatePurchaseOrderPdf(params);
  const poNum = params?.purchase?.purchase_number || 'PO';
  doc.save(`${poNum}.pdf`);
}
