/**
 * Standard-format Expense Report PDFs (jsPDF + autotable).
 * Provides beautifully formatted Daily, Weekly, Monthly, 3-Month, 6-Month & Yearly Expense Reports.
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  buildFinancePdfMeta,
  drawFinancePdfHeader,
  drawFinancePdfFooter,
  resolveFinancePdfBrand,
} from '@/lib/pdf/financeStatementPdf';
import { formatPdfMoney as formatPdfCurrency } from '@/lib/pdf/invoiceFormat';

/**
 * Generate a professional expense report PDF document.
 * @param {object} opts
 * @param {object} [opts.business]
 * @param {string} [opts.currency]
 * @param {string} [opts.locale]
 * @param {string} [opts.periodKey]
 * @param {string} [opts.periodLabel]
 * @param {string} [opts.dateFrom]
 * @param {string} [opts.dateTo]
 * @param {Array} [opts.expenses]
 * @returns {jsPDF} jsPDF document instance
 */
export function generateExpenseReportPdf(opts = {}) {
  const {
    business = {},
    currency = 'PKR',
    locale = 'en-US',
    periodLabel = 'Expense Report',
    dateFrom = '',
    dateTo = '',
    expenses = [],
  } = opts;

  const meta = buildFinancePdfMeta(business, {
    currency,
    locale,
    periodLabel: periodLabel || `Expense Report (${dateFrom} to ${dateTo})`,
    title: 'Business Expense Report',
    footnote: 'Generated automatically from Tenvo Operating Engine. Official Business Record.',
  });

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const brand = resolveFinancePdfBrand(meta);
  let y = drawFinancePdfHeader(doc, meta);

  // Calculate totals & category breakdown
  let totalAmount = 0;
  const categoryMap = new Map();

  for (const exp of expenses) {
    const amt = Number(exp.amount) || 0;
    totalAmount += amt;
    const cat = exp.category || 'General Expense';
    const curr = categoryMap.get(cat) || { count: 0, amount: 0 };
    categoryMap.set(cat, {
      count: curr.count + 1,
      amount: curr.amount + amt,
    });
  }

  // Section 1: Executive Summary Cards / Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...brand);
  doc.text('Executive Summary', 14, y);
  y += 3;

  const summaryRows = [
    ['Reporting Period', periodLabel],
    ['Date Range', `${dateFrom || 'Start'} to ${dateTo || 'Today'}`],
    ['Total Expense Transactions', String(expenses.length)],
    ['Total Expense Amount', formatPdfCurrency(totalAmount, currency)],
  ];

  doc.autoTable({
    startY: y,
    head: [['Metric', 'Value']],
    body: summaryRows,
    theme: 'striped',
    tableWidth: 182,
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: brand, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });
  y = (doc.lastAutoTable?.finalY || y) + 8;

  // Section 2: Category Breakdown
  const categoryRows = Array.from(categoryMap.entries()).map(([cat, data]) => {
    const pct = totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(1) + '%' : '0.0%';
    return [cat, String(data.count), formatPdfCurrency(data.amount, currency), pct];
  });

  if (categoryRows.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...brand);
    doc.text('Expense Breakdown by Category', 14, y);
    y += 3;

    doc.autoTable({
      startY: y,
      head: [['Expense Category', 'Transactions', `Total Amount (${currency})`, '% Share']],
      body: [
        ...categoryRows,
        ['TOTAL EXPENSES', String(expenses.length), formatPdfCurrency(totalAmount, currency), '100.0%'],
      ],
      theme: 'striped',
      tableWidth: 182,
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: brand, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });
    y = (doc.lastAutoTable?.finalY || y) + 8;
  }

  // Section 3: Itemized Expense Ledger
  if (y > 220) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...brand);
  doc.text('Itemized Expense Ledger', 14, y);
  y += 3;

  if (expenses.length > 0) {
    const itemizedRows = expenses.map((exp) => {
      const expDate = exp.date ? new Date(exp.date).toLocaleDateString(locale) : '-';
      const refNo = exp.expense_number || exp.id || '-';
      const cat = exp.category || 'General';
      const desc = exp.description || exp.notes || exp.vendor_name || '-';
      const pMethod = String(exp.paymentMethod || exp.payment_method || 'Cash').toUpperCase();
      const amt = formatPdfCurrency(exp.amount || 0, currency);
      return [expDate, refNo, cat, desc, pMethod, amt];
    });

    doc.autoTable({
      startY: y,
      head: [['Date', 'Ref #', 'Category', 'Description / Payee', 'Payment', `Amount (${currency})`]],
      body: [
        ...itemizedRows,
        ['', '', '', 'GRAND TOTAL EXPENSES', '', formatPdfCurrency(totalAmount, currency)],
      ],
      theme: 'striped',
      tableWidth: 182,
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: brand, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 28 },
        2: { cellWidth: 32 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'right', fontStyle: 'bold' },
      },
    });
  } else {
    doc.autoTable({
      startY: y,
      head: [['Message']],
      body: [['No expense transactions recorded during this selected period.']],
      theme: 'plain',
      tableWidth: 182,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, fontStyle: 'italic', textColor: [100, 100, 100], cellPadding: 4 },
    });
  }

  drawFinancePdfFooter(doc, meta);
  return doc;
}
