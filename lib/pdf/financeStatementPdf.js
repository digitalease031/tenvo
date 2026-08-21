/**
 * Standard-format finance statement PDFs (jsPDF + autotable).
 * Audit-grade international standard presentation for P&L, Balance Sheet,
 * Trial Balance, Cash Flow, Day Book, General Ledger, Aging, and Tax Reports.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  resolveInvoiceBrandColor,
  resolveBusinessRegistrationLines,
  formatBusinessAddressBlock,
} from '@/lib/pdf/invoiceFormat';

/**
 * Resolve accent RGB for finance PDFs.
 * @param {object} [meta]
 * @returns {[number, number, number]}
 */
export function resolveFinancePdfBrand(meta = {}) {
  if (Array.isArray(meta.brandRgb) && meta.brandRgb.length === 3) {
    return meta.brandRgb;
  }
  const business = meta.business || {};
  const settings =
    business.settingsParsed ||
    (business.settings && typeof business.settings === 'object' ? business.settings : {});
  return resolveInvoiceBrandColor(business, settings);
}

/**
 * Build shared meta from hub business + regional pack.
 * @param {object} [business]
 * @param {object} [opts]
 */
export function buildFinancePdfMeta(business = {}, opts = {}) {
  const settings =
    business?.settings && typeof business.settings === 'object' ? business.settings : {};
  const brandRgb = resolveInvoiceBrandColor(business, settings);
  const taxIdLabel = opts.taxIdLabel || 'Tax ID';
  const taxIds = settings?.tax || settings?.compliance || {};
  const ntn = business?.ntn || taxIds.ntn || settings?.ntn;
  const addressLines = formatBusinessAddressBlock(business);
  const regLines = resolveBusinessRegistrationLines(business, settings);

  const subtitleParts = [];
  if (ntn) subtitleParts.push(`${taxIdLabel}: ${ntn}`);
  for (const line of regLines) {
    if (!ntn || !String(line).includes(String(ntn))) subtitleParts.push(line);
  }
  if (addressLines.length) subtitleParts.push(addressLines.join(', '));

  return {
    businessName: business?.business_name || business?.name || 'Business',
    business,
    brandRgb,
    currency: opts.currency || business?.currency || '',
    locale: opts.locale || undefined,
    subtitle: opts.subtitle != null ? opts.subtitle : subtitleParts.join('  ·  '),
    periodLabel: opts.periodLabel || '',
    title: opts.title || 'Financial Report',
    generatedAt: opts.generatedAt || new Date().toISOString(),
    footnote: opts.footnote || 'Confidential',
    balanced: opts.balanced,
  };
}

/**
 * Audit-grade International Standard Number Formatter.
 * Handles numbers, strings, Decimals, negative values in accounting style.
 * @param {unknown} value
 * @param {string} [locale]
 * @param {object} [opts]
 * @returns {string}
 */
export function formatPdfNumber(value, locale, opts = {}) {
  if (value == null || value === '') return '';
  let n = Number(value);
  if (typeof value === 'string') {
    const cleaned = parseFloat(value.replace(/,/g, '').replace(/[^\d.-]/g, '').trim());
    if (Number.isFinite(cleaned)) n = cleaned;
  } else if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
    try { n = value.toNumber(); } catch { /* ignore */ }
  }
  if (!Number.isFinite(n)) return String(value ?? '');

  const isNeg = n < 0;
  const absVal = Math.abs(n);
  let formatted = '';
  try {
    formatted = absVal.toLocaleString(locale || 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    formatted = absVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (isNeg) {
    return opts.accountingFormat !== false ? `(${formatted})` : `-${formatted}`;
  }
  return formatted;
}

/**
 * Draw executive audit-grade header.
 * Returns y coordinate after header line.
 * @param {import('jspdf').jsPDF} doc
 * @param {object} [meta]
 * @returns {number}
 */
export function drawFinancePdfHeader(doc, meta = {}) {
  const {
    businessName = 'Business',
    title = 'Financial Report',
    subtitle = '',
    periodLabel = '',
    currency = '',
  } = meta;

  // Left Column: Business Name & Contact Details (x=14)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Clean dark navy/slate
  doc.text(String(businessName).slice(0, 50), 14, 16);

  let leftY = 21;
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const subLines = doc.splitTextToSize(String(subtitle), 105);
    doc.text(subLines, 14, leftY);
    leftY += subLines.length * 3.8;
  }

  // Right Column: Statement Title, Period & Currency (x=196, right aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(String(title).toUpperCase(), 196, 16, { align: 'right' });

  let rightY = 21;
  if (periodLabel) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(periodLabel), 196, rightY, { align: 'right' });
    rightY += 4.5;
  }

  if (currency) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Amounts in ${currency}`, 196, rightY, { align: 'right' });
    rightY += 4.5;
  }

  const y = Math.max(leftY, rightY) + 2;

  // Audit Solid Separator Line
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.6);
  doc.line(14, y, 196, y);

  return y + 5;
}

/**
 * Draw shared audit footer at document bottom.
 * @param {import('jspdf').jsPDF} doc
 * @param {object} [meta]
 */
export function drawFinancePdfFooter(doc, meta = {}) {
  const pageCount = doc.internal.getNumberOfPages();
  let generatedLabel = '';
  try {
    generatedLabel = new Date(meta.generatedAt || new Date()).toLocaleDateString(meta.locale || 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    generatedLabel = new Date().toLocaleDateString();
  }

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Hairline divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, 282, 196, 282);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    const balanceNote =
      meta.balanced === true
        ? 'Books Balanced'
        : meta.balanced === false
          ? 'Imbalance Warning'
          : '';
    const left = [
      meta.footnote || 'Confidential',
      'Tenvo Audit & Financial Engine',
      `Dated ${generatedLabel}`,
      balanceNote,
    ]
      .filter(Boolean)
      .join('  ·  ');

    doc.text(left, 14, 286.5);
    doc.text(`Page ${i} of ${pageCount}`, 196, 286.5, { align: 'right' });
  }
}

/**
 * Generic tabular finance PDF with automatic numeric right-alignment & audit styling.
 * @param {object} meta
 * @param {Array<{label: string, key: string}>} columns
 * @param {Array<Record<string, unknown>>} rows
 * @param {{ filename?: string, save?: boolean }} [opts]
 */
export function generateFinanceStatementPDF(meta, columns, rows, opts = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const locale = meta.locale;
  const startY = drawFinancePdfHeader(doc, meta);

  // Identify numeric columns for right alignment
  const numericKeyPattern = /amount|debit|credit|net|balance|total|tax|payable|receivable|outstanding|current|day|price|cost|income|expense|cogs/i;
  const isNumericCol = columns.map((col) => {
    if (numericKeyPattern.test(col.key || '') || numericKeyPattern.test(col.label || '')) return true;
    const sampleValues = (rows || []).slice(0, 10).map((r) => r[col.key]).filter((v) => v != null && v !== '');
    if (!sampleValues.length) return false;
    const numCount = sampleValues.filter((v) => typeof v === 'number' || (typeof v === 'string' && Number.isFinite(parseFloat(v.replace(/,/g, ''))))).length;
    return numCount / sampleValues.length >= 0.7;
  });

  const columnStyles = {};
  isNumericCol.forEach((isNum, idx) => {
    if (isNum) {
      columnStyles[idx] = { halign: 'right' };
    }
  });

  const tableData = (rows || []).map((row) =>
    columns.map((col, idx) => {
      const v = row[col.key];
      if (v == null || v === '') return '';
      if (isNumericCol[idx]) {
        return typeof v === 'number' ? formatPdfNumber(v, locale) : (Number.isFinite(parseFloat(String(v).replace(/,/g, ''))) ? formatPdfNumber(v, locale) : String(v));
      }
      return String(v);
    })
  );

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.label)],
    body: tableData,
    theme: 'plain',
    tableWidth: 182,
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 3,
      lineWidth: { bottom: 0.5 },
      lineColor: [203, 213, 225],
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
    },
    columnStyles,
    didParseCell(data) {
      if (data.section === 'head') {
        const colIdx = data.column.index;
        if (isNumericCol[colIdx]) {
          data.cell.styles.halign = 'right';
        }
      }
      if (data.section === 'body') {
        const rowObj = (rows || [])[data.row.index] || {};
        const isLastRow = data.row.index === (rows || []).length - 1;
        const rowText = Object.values(rowObj).join(' ').toLowerCase();

        const rowType = rowObj._type || (
          (isLastRow && (rowText.includes('total') || rowText.includes('closing balance') || rowText.includes('closing cash') || rowText.includes('end of period')))
            ? 'grand_total'
            : (rowText.startsWith('total ') || rowText.includes('subtotal') || rowText.includes('net cash provided') || rowText.includes('net change in cash'))
              ? 'subtotal'
              : 'item'
        );

        if (rowType === 'grand_total') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42];
          data.cell.styles.fontSize = 9;
          data.cell.styles.lineWidth = { top: 0.5, bottom: 1.5 };
          data.cell.styles.lineColor = [15, 23, 42];
        } else if (rowType === 'subtotal') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42];
          data.cell.styles.lineWidth = { top: 0.4 };
          data.cell.styles.lineColor = [148, 163, 184];
        } else {
          data.cell.styles.fontStyle = 'normal';
          data.cell.styles.textColor = [51, 65, 85];
          data.cell.styles.lineWidth = { bottom: 0.1 };
          data.cell.styles.lineColor = [241, 245, 249];
        }
      }
    },
  });

  drawFinancePdfFooter(doc, meta);

  if (opts.save !== false) {
    const filename = opts.filename || `${(meta.title || 'report').replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);
  }
  return doc;
}

/**
 * Unified multi-section financial statement (Profit & Loss, Balance Sheet).
 * Renders as ONE continuous, beautifully formatted international statement table.
 * @param {object} meta
 * @param {Array<{ heading?: string, rows?: Array<{label: string, amount: number|string}>, totalLabel?: string, totalAmount?: number|string, isGrand?: boolean }>} sections
 * @param {{ filename?: string }} [opts]
 */
export function generateSectionedFinancePDF(meta, sections, opts = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const locale = meta.locale;
  const startY = drawFinancePdfHeader(doc, meta);

  const tableRows = [];
  const rowMeta = [];

  for (const section of sections || []) {
    if (!section) continue;

    // Section Header Row (e.g. OPERATING INCOME)
    if (section.heading && String(section.heading).trim() !== '') {
      tableRows.push([section.heading.toUpperCase(), '']);
      rowMeta.push({ type: 'section_head', heading: section.heading });
    }

    // Detail Line Rows
    for (const r of section.rows || []) {
      const formattedAmt = typeof r.amount === 'number' ? formatPdfNumber(r.amount, locale) : String(r.amount ?? '');
      tableRows.push([`    ${r.label}`, formattedAmt]);
      rowMeta.push({ type: 'item' });
    }

    // Section Total Row (e.g. Total Income)
    if (section.totalLabel != null && String(section.totalLabel).trim() !== '') {
      const formattedTotal = typeof section.totalAmount === 'number' ? formatPdfNumber(section.totalAmount, locale) : String(section.totalAmount ?? '');
      const isGrand = section.isGrand ?? /gross profit|net income|total assets|total liabilities & equity|total equity/i.test(section.totalLabel);
      tableRows.push([section.totalLabel, formattedTotal]);
      rowMeta.push({ type: isGrand ? 'grand_total' : 'subtotal' });
    }

    // Spacing
    tableRows.push(['', '']);
    rowMeta.push({ type: 'spacer' });
  }

  // Remove trailing spacer
  if (rowMeta.length > 0 && rowMeta[rowMeta.length - 1].type === 'spacer') {
    tableRows.pop();
    rowMeta.pop();
  }

  const amtHeader = meta.currency ? `Amount (${meta.currency})` : 'Amount';

  autoTable(doc, {
    startY,
    head: [['Description', amtHeader]],
    body: tableRows,
    theme: 'plain',
    tableWidth: 182,
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 3,
      lineWidth: { bottom: 0.5 },
      lineColor: [203, 213, 225],
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'right' },
    },
    didParseCell(data) {
      if (data.section === 'head' && data.column.index === 1) {
        data.cell.styles.halign = 'right';
      }
      if (data.section === 'body') {
        const metaInfo = rowMeta[data.row.index];
        if (!metaInfo) return;

        if (metaInfo.type === 'spacer') {
          data.cell.styles.cellPadding = 1;
        } else if (metaInfo.type === 'section_head') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42]; // Crisp Slate-900
          data.cell.styles.fillColor = [248, 250, 252];
          data.cell.styles.fontSize = 8.5;
          data.cell.styles.lineWidth = { top: 0.3 };
          data.cell.styles.lineColor = [226, 232, 240];
        } else if (metaInfo.type === 'subtotal') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42];
          data.cell.styles.lineWidth = { top: 0.3 };
          data.cell.styles.lineColor = [203, 213, 225];
        } else if (metaInfo.type === 'grand_total') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42];
          data.cell.styles.fontSize = 9;
          data.cell.styles.lineWidth = { top: 0.5, bottom: 1.5 };
          data.cell.styles.lineColor = [15, 23, 42];
        }
      }
    },
  });

  drawFinancePdfFooter(doc, meta);

  const filename = opts.filename || `${(meta.title || 'statement').replace(/\s+/g, '-')}.pdf`;
  doc.save(filename);
  return doc;
}

/**
 * Back-compat wrapper used by aging / GST.
 */
export function generateReportPDFWithChrome(title, data, columns, meta = {}) {
  return generateFinanceStatementPDF(
    {
      businessName: meta.businessName || 'Business',
      business: meta.business,
      brandRgb: meta.brandRgb,
      title,
      subtitle: meta.subtitle,
      periodLabel: meta.periodLabel,
      currency: meta.currency,
      locale: meta.locale,
      generatedAt: meta.generatedAt || new Date().toISOString(),
      footnote: meta.footnote,
      balanced: meta.balanced,
    },
    columns,
    data,
    { filename: meta.filename || `${String(title).replace(/\s+/g, '-')}.pdf`, save: false }
  );
}

export const FINANCE_PDF_FALLBACK_BRAND = [15, 23, 42];
