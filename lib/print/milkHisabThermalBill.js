'use client';

/**
 * Milk Route Hisab 58mm thermal bill — same printer path as POS.
 * Supports totals-only receipt and PK-style day Y/N breakdown sheet.
 */
import {
  dispatchThermalReceipt,
  printThermalReceiptHtml,
  printJsPdfDocument,
} from '@/lib/print/thermalReceipt';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import {
  parseMilkHisabBillingPeriod,
  buildMilkHisabDayBreakdownGrid,
  formatMilkHisabDayHeaderLine,
  formatMilkHisabDayLine,
  shortMilkHisabProductLabel,
  abbreviateMilkHisabColumn,
} from '@/lib/storefront/milkShopHisab';
import {
  normalizeMilkHisabBillLocale,
  getMilkHisabDaySheetCopy,
  localizeMilkHisabPeriodParts,
  milkHisabUrduProductLabel,
  milkHisabUrduUnit,
  sortMilkHisabPrintColumns,
  formatMilkHisabTotalLine,
} from '@/lib/storefront/milkHisabUrdu';

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '"');
}

function resolvePeriodMeta(period = '', periodLabel = '') {
  let kind = 'month';
  let label = periodLabel;
  if (period && !label) {
    try {
      const parsed = parseMilkHisabBillingPeriod(period);
      kind = parsed.kind;
      label = parsed.label;
    } catch {
      label = period;
    }
  } else if (period) {
    try {
      kind = parseMilkHisabBillingPeriod(period).kind;
    } catch {
      kind = /W\d/i.test(period) ? 'week' : 'month';
    }
  }
  return { kind, label };
}

function money(amount, currencyCode = 'PKR', locale) {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currencyCode} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Build thermal receipt options from a hisab invoice payload.
 */
export function buildMilkHisabThermalOpts({
  business,
  invoice,
  items = [],
  houseNo = '',
  period = '',
  periodLabel = '',
  category = 'milk-shop',
}) {
  const pack = getBusinessRegionalPack(business);
  const { kind, label } = resolvePeriodMeta(period, periodLabel);

  const documentLabel = kind === 'week' ? 'Weekly Hisab Bill' : 'Monthly Hisab Bill';
  const customerBase = invoice.customer_name || invoice.customerName || 'Customer';
  const customerName = houseNo
    ? `${customerBase} · House ${houseNo}`
    : customerBase;

  const lineItems = (items || []).map((item) => {
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
    const lineTotal = Number(
      item.total_amount ?? item.lineTotal ?? Math.round(qty * unitPrice * 100) / 100
    );
    const unit = item.product_unit || item.unit || '';
    const name = item.name || item.product_name || 'Item';
    return {
      name: unit ? `${name} (${unit})` : name,
      sku: item.sku || item.product_sku || null,
      quantity: qty,
      unitPrice,
      lineTotal,
    };
  });

  if (!lineItems.length) {
    const total = Number(invoice.grand_total || invoice.amount || 0);
    lineItems.push({
      name: label ? `Route hisab ${label}` : 'Route hisab',
      quantity: 1,
      unitPrice: total,
      lineTotal: total,
    });
  }

  return {
    business,
    documentLabel,
    category: business?.category || category,
    currencyCode: pack.currency,
    paperSize: '58mm',
    sale: {
      invoice_number: invoice.invoice_number || invoice.invoiceNumber || 'DRAFT',
      date: invoice.date || invoice.created_at || invoice.due_date || new Date(),
      customerName,
      paymentMethod: invoice.payment_status === 'paid' ? (invoice.payment_method || 'cash') : 'credit',
    },
    lineItems,
  };
}

/**
 * Build daily route summary showing customer transactions.
 * Columns: Cust | Del | Rec | Bal | Cash
 */
export function buildDailyRouteSummaryModel({
  business,
  date,
  routeName = '',
  customers = [],
  category = 'milk-shop',
}) {
  const pack = getBusinessRegionalPack(business);
  const dateStr = toMilkHisabDateKey(date);
  
  const customerRows = (customers || []).map((cust) => {
    const name = cust.customerName || cust.name || 'Customer';
    const houseNo = cust.houseNo || '';
    const delivered = Number(cust.delivered || 0);
    const received = Number(cust.received || cust.empties || 0);
    const balance = Number(cust.balance || 0);
    const cash = Number(cust.cash || cust.cashCollected || 0);
    
    return {
      customerName: houseNo ? `${name} H${houseNo}` : name,
      delivered,
      received,
      balance,
      cash,
      amount: Number(cust.amount || 0),
    };
  });

  const totals = customerRows.reduce(
    (acc, row) => ({
      delivered: acc.delivered + row.delivered,
      received: acc.received + row.received,
      balance: acc.balance + row.balance,
      cash: acc.cash + row.cash,
      amount: acc.amount + row.amount,
    }),
    { delivered: 0, received: 0, balance: 0, cash: 0, amount: 0 }
  );

  return {
    businessName: business?.business_name || business?.name || 'Water Supply',
    address: business?.address || '',
    phone: business?.phone || '',
    documentLabel: 'DAILY SALE SUMMARY',
    date: dateStr,
    routeName: routeName || 'Route',
    customerRows,
    totals,
    currencyCode: pack.currency,
    locale: pack.locale,
  };
}

/**
 * Build compact 58mm HTML for daily customer summary.
 */
export function buildDailyRouteSummaryHtml(model) {
  const d = model;
  const width = '54mm';
  
  const styles = `
  @page { size: 58mm auto; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { width: 58mm; max-width: 58mm; }
  body {
    width: ${width}; max-width: ${width}; margin: 0 auto;
    padding: 2.5mm 2mm 4mm;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 8px; line-height: 1.3; color: #111;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .t { font-size: 10px; margin-bottom: 0.8mm; }
  .s { font-size: 7px; color: #444; }
  hr { border: none; border-top: 1px dashed #999; margin: 1.8mm 0; }
  table { width: 100%; border-collapse: collapse; font-size: 7px; margin: 1mm 0; }
  thead th { font-weight: 700; border-bottom: 1px solid #333; padding: 0.8mm 1mm; text-align: center; }
  tbody td { padding: 0.8mm 1mm; text-align: center; border-bottom: 1px dotted #ddd; }
  tbody td:first-child { text-align: left; max-width: 18mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .totals td { font-weight: 700; border-top: 1px solid #333; border-bottom: 2px solid #333; padding-top: 1mm; }
  .foot { margin-top: 2mm; text-align: center; font-size: 7.5px; }
  .legend { font-size: 6.5px; color: #666; margin-top: 1mm; }
  `;

  const rows = (d.customerRows || [])
    .map((row) => {
      return `<tr>
        <td>${esc(row.customerName)}</td>
        <td>${row.delivered}</td>
        <td>${row.received}</td>
        <td>${row.balance}</td>
        <td>${money(row.cash, d.currencyCode, d.locale)}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>${esc(d.documentLabel)}</title>
<style>${styles}</style>
</head><body>
  <div class="c b t">${esc(d.businessName)}</div>
  ${d.address ? `<div class="c s">${esc(d.address)}</div>` : ''}
  ${d.phone ? `<div class="c s">${esc(d.phone)}</div>` : ''}
  <hr/>
  <div class="c b">${esc(d.documentLabel)}</div>
  <div class="c s">${esc(d.date)}</div>
  ${d.routeName ? `<div class="c s b">${esc(d.routeName)}</div>` : ''}
  <hr/>
  <table>
    <thead>
      <tr>
        <th>Cust</th>
        <th>Del</th>
        <th>Rec</th>
        <th>Bal</th>
        <th>Cash</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="totals">
        <td>TOTAL</td>
        <td>${d.totals.delivered}</td>
        <td>${d.totals.received}</td>
        <td>${d.totals.balance}</td>
        <td>${money(d.totals.cash, d.currencyCode, d.locale)}</td>
      </tr>
    </tbody>
  </table>
  <hr/>
  <div class="foot">
    <div class="b">Shukriya · Thank you</div>
    <div class="legend">Del = delivered · Rec = empty returned · Bal = bottles with customer</div>
  </div>
</body></html>`;
}

/**
 * Helper to format date key (reuse from milkShopHisab or define here for independence).
 */
function toMilkHisabDateKey(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(String(dateLike));
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Print/PDF daily route summary.
 */
export async function printDailyRouteSummary(args, mode = 'print') {
  const model = buildDailyRouteSummaryModel(args);
  const html = buildDailyRouteSummaryHtml(model);
  
  if (mode === 'pdf') {
    return printThermalReceiptHtml(html, { delayMs: 500 });
  }
  
  return printThermalReceiptHtml(html, { delayMs: 500 });
}

/**
 * Build 58mm bill from a Bills-table customer row (works before invoice exists).
 */
export function buildMilkHisabThermalOptsFromRow({
  business,
  row,
  productColumns = [],
  period = '',
  periodLabel = '',
  category = 'milk-shop',
}) {
  const { kind, label } = resolvePeriodMeta(period, periodLabel);
  const qtyByProduct = row?.qtyByProduct || {};
  const meta = row?.productMeta || {};
  const total = Math.round((Number(row?.amount) || 0) * 100) / 100;

  const rawLines = [];
  const seen = new Set();

  for (const col of productColumns) {
    const qty = Number(qtyByProduct[col.id]) || 0;
    if (qty <= 0) continue;
    seen.add(String(col.id));
    const unitMeta = meta[col.id] || {};
    const unit = unitMeta.unit || col.unit || '';
    const name = unitMeta.name || col.name || 'Item';
    rawLines.push({ name: unit ? `${name} (${unit})` : name, quantity: qty });
  }

  for (const [productId, rawQty] of Object.entries(qtyByProduct)) {
    if (seen.has(String(productId))) continue;
    const qty = Number(rawQty) || 0;
    if (qty <= 0) continue;
    const unitMeta = meta[productId] || {};
    const unit = unitMeta.unit || '';
    const name = unitMeta.name || 'Item';
    rawLines.push({ name: unit ? `${name} (${unit})` : name, quantity: qty });
  }

  const qtySum = rawLines.reduce((s, r) => s + (Number(r.quantity) || 0), 0) || 1;
  let allocated = 0;
  const itemsForReceipt = rawLines.length
    ? rawLines.map((item, idx) => {
        const qty = Number(item.quantity) || 1;
        let lineTotal;
        if (idx === rawLines.length - 1) {
          lineTotal = Math.round((total - allocated) * 100) / 100;
        } else {
          lineTotal = Math.round((qty / qtySum) * total * 100) / 100;
          allocated += lineTotal;
        }
        return {
          name: item.name,
          quantity: qty,
          unit_price: qty ? Math.round((lineTotal / qty) * 100) / 100 : lineTotal,
          total_amount: lineTotal,
        };
      })
    : [
        {
          name: label ? `Route hisab ${label}` : 'Route hisab',
          quantity: 1,
          unit_price: total,
          total_amount: total,
        },
      ];

  return buildMilkHisabThermalOpts({
    business,
    invoice: {
      invoice_number: row?.invoiceNumber || (kind === 'week' ? 'WEEKLY-DRAFT' : 'MONTHLY-DRAFT'),
      customer_name: row?.customerName || 'Customer',
      grand_total: total,
      subtotal: total,
      payment_status: row?.paymentStatus || 'unpaid',
      payment_method: 'credit',
      date: new Date(),
      isDraft: !row?.invoiceId,
    },
    items: itemsForReceipt,
    houseNo: row?.houseNo || '',
    period,
    periodLabel: label,
    category,
  });
}

/**
 * Normalize day-breakdown payload for HTML / PDF.
 * @param {object} args
 * @param {'en'|'ur'} [args.billLocale]
 */
export function buildMilkHisabDayBreakdownPrintModel({
  business,
  breakdown,
  customerName = '',
  houseNo = '',
  period = '',
  periodLabel = '',
  invoiceNumber = '',
  grandTotal = 0,
  paymentStatus = 'unpaid',
  productMeta = {},
  billLocale = 'en',
}) {
  const pack = getBusinessRegionalPack(business);
  const locale = normalizeMilkHisabBillLocale(billLocale);
  const { kind, label, startIso, endIso } = (() => {
    const meta = resolvePeriodMeta(period, periodLabel);
    let start = '';
    let end = '';
    if (period) {
      try {
        const parsed = parseMilkHisabBillingPeriod(period);
        start = parsed.startIso;
        end = parsed.endIso;
      } catch {
        /* keep empty */
      }
    }
    return { ...meta, startIso: start, endIso: end };
  })();
  const copy = getMilkHisabDaySheetCopy(locale, kind);
  const columns = sortMilkHisabPrintColumns(breakdown?.columns || []);
  const days = breakdown?.days || [];
  const headerLine = formatMilkHisabDayHeaderLine(columns);
  const dayLines = days.map((day) => formatMilkHisabDayLine(day, columns));

  const totals = (breakdown?.totalsByProduct || [])
    .filter((t) => Number(t.qty) > 0)
    .map((t) => {
      const meta = productMeta[t.id] || {};
      const unitPrice = Number(meta.unitPrice) || 0;
      const qty = Number(t.qty) || 0;
      const amount =
        unitPrice > 0
          ? Math.round(qty * unitPrice * 100) / 100
          : null;
      const enLabel = shortMilkHisabProductLabel(
        { name: t.name, hisabShortLabel: t.shortLabel },
        12
      );
      const unitRaw = t.unit || meta.unit || '';
      return {
        id: t.id,
        name: t.name || meta.name,
        shortLabel: t.shortLabel || enLabel,
        label:
          locale === 'ur'
            ? milkHisabUrduProductLabel({
                name: t.name || meta.name,
                hisabShortLabel: t.shortLabel || enLabel,
              })
            : enLabel,
        unit: locale === 'ur' ? milkHisabUrduUnit(unitRaw) : unitRaw,
        qty,
        amount,
      };
    });
  const totalsOrdered = sortMilkHisabPrintColumns(totals);

  const paid = String(paymentStatus || 'unpaid').toLowerCase() === 'paid';
  const periodParts = localizeMilkHisabPeriodParts(label || period, locale, kind, {
    startIso,
    endIso,
  });

  return {
    billLocale: locale,
    businessName: business?.business_name || business?.name || copy.shopFallback,
    address: business?.address || '',
    phone: business?.phone || '',
    documentLabel: copy.documentLabel,
    periodTitle: periodParts.title,
    periodRange: periodParts.range,
    periodLabel: [periodParts.title, periodParts.range].filter(Boolean).join(' · '),
    customerName: customerName || copy.customerFallback,
    houseNo: houseNo || '',
    housePrefix: copy.housePrefix,
    invoiceNumber:
      invoiceNumber || (kind === 'week' ? copy.draftWeekly : copy.draftMonthly),
    paymentMethod: paid ? copy.cash : copy.credit,
    daysWord: copy.daysWord,
    paidDaysLabel: copy.paidDays,
    daySection: copy.daySection,
    totalSection: copy.totalSection,
    totalLabel: copy.total,
    thanks: copy.thanks,
    legend: copy.legend,
    currencyCode: pack.currency,
    locale: pack.locale,
    // Keep PKR amounts in en-PK so digits stay Western and readable on thermal.
    numberLocale: 'en-PK',
    headerLine,
    dayLines,
    activeDays: breakdown?.activeDays || days.filter((d) => d.hasDelivery).length,
    totals: totalsOrdered,
    grandTotal: Math.round((Number(grandTotal) || 0) * 100) / 100,
    columns,
  };
}

/**
 * Compact 58mm HTML for day Y/N sheet + period totals (Urdu / fallback).
 */
export function buildMilkHisabDayBreakdownHtml(model) {
  const d = model;
  const isUrdu = d.billLocale === 'ur';
  const width = '54mm';
  const pageH = estimateMilkHisabDaySheetHeightMm(d);
  const fontStack = isUrdu
    ? `'Noto Naskh Arabic', 'Noto Nastaliq Urdu', 'Segoe UI', Tahoma, sans-serif`
    : `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  const PW_PX = 219;
  const styles = `
  @page { size: 58mm ${pageH}mm; margin: 0 !important; }
  @media print {
    @page { size: 58mm ${pageH}mm; margin: 0 !important; }
    html { width: 58mm !important; max-width: 58mm !important; }
    body { width: ${PW_PX}px !important; max-width: ${PW_PX}px !important; margin: 0 !important; padding: 1.5mm 1.5mm 2.5mm !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { width: ${PW_PX}px; max-width: ${PW_PX}px; }
  body {
    width: ${width}; max-width: ${width}; margin: 0 auto;
    padding: 1.5mm 1.5mm 2.5mm;
    font-family: ${fontStack};
    font-size: ${isUrdu ? '8.5px' : '7.5px'}; line-height: ${isUrdu ? '1.35' : '1.2'}; color: #111;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    direction: ltr;
  }
  .ur { font-family: 'Noto Naskh Arabic', 'Noto Nastaliq Urdu', 'Segoe UI', Tahoma, sans-serif; }
  .rtl { direction: rtl; unicode-bidi: plaintext; }
  .ltr { direction: ltr; unicode-bidi: isolate; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .t { font-size: ${isUrdu ? '10px' : '9px'}; margin-bottom: 0.4mm; }
  .s { font-size: ${isUrdu ? '7.5px' : '6.5px'}; color: #444; }
  .m { color: #666; }
  .sec {
    font-size: ${isUrdu ? '7px' : '6.5px'}; font-weight: 700; color: #555;
    margin: 0.6mm 0 0.4mm; text-align: center;
  }
  hr { border: none; border-top: 1px dashed #999; margin: 1mm 0; }
  .grid {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 6.5px; white-space: pre; letter-spacing: 0;
    line-height: 1.25; font-variant-numeric: tabular-nums;
    direction: ltr; text-align: center;
  }
  .grid .hdr { font-weight: 700; border-bottom: 1px solid #333; padding-bottom: 0.3mm; margin-bottom: 0.3mm; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 1mm; font-size: ${isUrdu ? '8px' : '7px'}; padding: 0.2mm 0; direction: ltr; }
  .row .l { color: #333; flex: 1; min-width: 0; direction: ltr; unicode-bidi: isolate; text-align: left; }
  .row .r { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 600; }
  .tot { font-weight: 800; font-size: ${isUrdu ? '10px' : '9px'}; border-top: 1px solid #333; padding-top: 0.8mm; margin-top: 0.6mm; }
  .tot .l { ${isUrdu ? "font-family: 'Noto Naskh Arabic', Tahoma, sans-serif; direction: rtl; text-align: right;" : ''} }
  .foot { margin-top: 1.2mm; text-align: center; font-size: ${isUrdu ? '8px' : '7px'}; }
  .meta { margin-top: 0.3mm; }
  `;

  const dayBlock = [
    `<div class="hdr">${esc(d.headerLine)}</div>`,
    ...(d.dayLines || []).map((line) => esc(line)),
  ].join('\n');

  const moneyLocale = d.numberLocale || d.locale;
  const totalRows = (d.totals || [])
    .map((t) => {
      const left = formatMilkHisabTotalLine(t, d.billLocale || 'en');
      const right =
        t.amount != null ? money(t.amount, d.currencyCode, moneyLocale) : '';
      return `<div class="row"><span class="l">${esc(left)}</span><span class="r ltr">${esc(right)}</span></div>`;
    })
    .join('');

  const urClass = isUrdu ? ' ur rtl' : '';
  const houseBit = d.houseNo
    ? ` · <span class="ltr">${esc(d.housePrefix)} ${esc(d.houseNo)}</span>`
    : '';
  const periodTitle = d.periodTitle || d.periodLabel || '';
  const periodRange = d.periodRange || '';
  const statusLine = [
    d.invoiceNumber,
    d.paymentMethod,
    `${d.activeDays || 0} ${d.paidDaysLabel || d.daysWord || 'days'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const fontLink = isUrdu
    ? `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" rel="stylesheet"/>`
    : '';

  return `<!doctype html>
<html lang="${isUrdu ? 'ur' : 'en'}"><head>
<meta charset="utf-8"/>
<title>${esc(d.documentLabel)}</title>
${fontLink}
<style>${styles}</style>
</head><body>
  <div class="c b t${urClass}">${esc(d.businessName)}</div>
  ${d.address ? `<div class="c s${urClass}">${esc(d.address)}</div>` : ''}
  ${d.phone ? `<div class="c s ltr">${esc(d.phone)}</div>` : ''}
  <hr/>
  <div class="c b${urClass}">${esc(d.documentLabel)}</div>
  <div class="c s b${urClass}">${esc(periodTitle)}</div>
  ${periodRange ? `<div class="c s m ltr">${esc(periodRange)}</div>` : ''}
  <div class="c s meta${urClass}">${esc(d.customerName)}${houseBit}</div>
  <div class="c s m meta${urClass}">${esc(statusLine)}</div>
  <hr/>
  <div class="sec${urClass}">${esc(d.daySection || 'Day delivery (Y/N)')}</div>
  <div class="grid">${dayBlock}</div>
  <hr/>
  <div class="sec${urClass}">${esc(d.totalSection || 'Totals')}</div>
  ${totalRows}
  <div class="row tot"><span class="l${urClass}">${esc(d.totalLabel || 'TOTAL')}</span><span class="r ltr">${esc(money(d.grandTotal, d.currencyCode, moneyLocale))}</span></div>
  <hr/>
  <div class="foot">
    <div class="b${urClass}">${esc(d.thanks || 'Shukriya · Thank you')}</div>
    <div class="s m${urClass}">${esc(d.legend || 'Y = delivered · N = not delivered')}</div>
  </div>
</body></html>`;
}

function estimateMilkHisabDaySheetHeightMm(model) {
  const days = model?.dayLines?.length || 0;
  const totals = model?.totals?.length || 0;
  return Math.min(Math.max(48 + days * 3.2 + totals * 3.2 + 28, 70), 320);
}

/**
 * Build exact-size 58mm jsPDF for day Y/N sheet (English / Latin digits).
 * @returns {Promise<{ doc: import('jspdf').jsPDF, pageW: number, pageH: number, filename: string }>}
 */
export async function createMilkHisabDayBreakdownPdf(model, existingDoc = null) {
  const { default: jsPDF } = await import('jspdf');
  const d = model;
  const pageW = 58;
  const margin = 2;
  const contentW = pageW - margin * 2;

  const renderOnDoc = (targetDoc) => {
    let y = margin + 2;
    const write = (text, opts = {}) => {
      const { size = 7, bold = false, align = 'center' } = opts;
      targetDoc.setFont('courier', bold ? 'bold' : 'normal');
      targetDoc.setFontSize(size);
      const x = align === 'center' ? pageW / 2 : align === 'right' ? pageW - margin : margin;
      targetDoc.text(String(text ?? ''), x, y, { align, maxWidth: contentW });
      y += size * 0.4 + 1.05;
    };
    const rule = () => {
      y += 0.6;
      targetDoc.setDrawColor(150);
      targetDoc.line(margin, y, pageW - margin, y);
      y += 2.2;
    };

    write(d.businessName, { size: 9, bold: true });
    if (d.address) write(d.address, { size: 6.5 });
    if (d.phone) write(d.phone, { size: 6.5 });
    rule();
    write(String(d.documentLabel || '').toUpperCase(), { size: 8, bold: true });
    write(d.periodTitle || d.periodLabel, { size: 7, bold: true });
    if (d.periodRange) write(d.periodRange, { size: 6.5 });
    write(
      `${d.customerName}${d.houseNo ? ` · ${d.housePrefix || 'H'} ${d.houseNo}` : ''}`,
      { size: 7 }
    );
    write(
      [
        d.invoiceNumber,
        d.paymentMethod,
        `${d.activeDays || 0} ${d.paidDaysLabel || d.daysWord || 'days'}`,
      ]
        .filter(Boolean)
        .join(' · '),
      { size: 6.5 }
    );
    rule();
    write(d.daySection || 'Day delivery (Y/N)', { size: 6, bold: true });
    // Centered monospace day grid — header + Y/N columns align
    write(d.headerLine, { size: 6.5, bold: true });
    for (const line of d.dayLines || []) {
      write(line, { size: 6.5 });
    }
    rule();
    write(d.totalSection || 'Totals', { size: 6, bold: true });
    for (const t of d.totals || []) {
      const left = formatMilkHisabTotalLine(t, 'en');
      const right =
        t.amount != null ? money(t.amount, d.currencyCode, d.numberLocale || d.locale) : '';
      targetDoc.setFont('courier', 'normal');
      targetDoc.setFontSize(7);
      targetDoc.text(String(left), margin, y, { maxWidth: contentW * 0.58 });
      if (right) targetDoc.text(String(right), pageW - margin, y, { align: 'right' });
      y += 3.1;
    }
    y += 0.5;
    targetDoc.setDrawColor(40);
    targetDoc.line(margin, y, pageW - margin, y);
    y += 3;
    targetDoc.setFont('courier', 'bold');
    targetDoc.setFontSize(9);
    targetDoc.text(d.totalLabel || 'TOTAL', margin, y);
    targetDoc.text(money(d.grandTotal, d.currencyCode, d.numberLocale || d.locale), pageW - margin, y, {
      align: 'right',
    });
    y += 4;
    rule();
    write(d.thanks || 'Shukriya · Thank you', { size: 7, bold: true });
    write(d.legend || 'Y = delivered · N = not delivered', { size: 6 });

    return { doc: targetDoc, finalY: y };
  };

  const probeH = Math.max(estimateMilkHisabDaySheetHeightMm(d) + 40, 120);
  const probeDoc = new jsPDF({ unit: 'mm', format: [pageW, probeH], orientation: 'portrait', compress: true });
  const { finalY } = renderOnDoc(probeDoc);
  const pageH = Math.min(Math.max(Math.ceil(finalY + margin + 3), 60), 320);

  let doc = existingDoc;
  if (!doc) {
    doc = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation: 'portrait', compress: true });
  } else {
    doc.addPage([pageW, pageH], 'portrait');
  }

  renderOnDoc(doc);

  const slug = String(d.invoiceNumber || 'hisab-day')
    .replace(/[^\w-]+/g, '-')
    .slice(0, 36);
  return {
    doc,
    pageW,
    pageH,
    filename: `${slug || 'hisab-day'}-days.pdf`,
  };
}

/**
 * PDF twin of day-breakdown (58mm MediaBox).
 * Urdu print/PDF uses HTML so Naskh glyphs render; English uses jsPDF.
 */
export async function downloadMilkHisabDayBreakdownPdf(model) {
  if (model?.billLocale === 'ur') {
    const html = buildMilkHisabDayBreakdownHtml(model);
    return printThermalReceiptHtml(html, { delayMs: 900 });
  }

  try {
    const { doc, filename } = await createMilkHisabDayBreakdownPdf(model);
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('downloadMilkHisabDayBreakdownPdf', err);
    return false;
  }
}

/**
 * Build a File/Blob for WhatsApp Web Share (when supported) or local download.
 * Always English/Latin day sheet so Courier PDF stays reliable.
 */
export async function createMilkHisabDayBreakdownPdfBlob(args) {
  const model = buildMilkHisabDayBreakdownPrintModel({
    ...args,
    billLocale: 'en',
  });
  const { doc, filename } = await createMilkHisabDayBreakdownPdf(model);
  const blob = doc.output('blob');
  return { blob, filename, model };
}

export async function printMilkHisabThermalBill(args, mode = 'print') {
  const opts = buildMilkHisabThermalOpts(args);
  return dispatchThermalReceipt(opts, mode);
}

/** Print/PDF from Bills table row (invoice optional) — totals style. */
export async function printMilkHisabThermalBillFromRow(args, mode = 'print') {
  const opts = buildMilkHisabThermalOptsFromRow(args);
  return dispatchThermalReceipt(opts, mode);
}

/**
 * Print/PDF PK day-sheet (Y/N per day) for one customer period.
 * Print uses exact 58mm PDF MediaBox (same as POS) for English;
 * Urdu keeps HTML with fixed thermal page height for Naskh fonts.
 * @param {object} args
 * @param {'print'|'pdf'} [mode]
 */
export async function printMilkHisabDayBreakdownBill(args, mode = 'print') {
  const model = buildMilkHisabDayBreakdownPrintModel(args);
  if (mode === 'pdf') {
    return downloadMilkHisabDayBreakdownPdf(model);
  }

  // English: exact-size PDF print (avoids Letter/A4 from HTML @page).
  if (model.billLocale !== 'ur') {
    try {
      const { doc, pageW, pageH } = await createMilkHisabDayBreakdownPdf(model);
      const ok = await printJsPdfDocument(doc, {
        delayMs: 500,
        pageW,
        pageH,
        title: `Hisab ${pageW}x${pageH}mm`,
      });
      if (ok) return true;
    } catch (err) {
      console.warn('[milkHisab] PDF day print failed, HTML fallback', err);
    }
  }

  const html = buildMilkHisabDayBreakdownHtml(model);
  if (model.billLocale === 'ur' && typeof window !== 'undefined') {
    try {
      if (document.fonts?.load) {
        await document.fonts.load('700 11px "Noto Naskh Arabic"');
      }
    } catch {
      /* print anyway */
    }
  }
  return printThermalReceiptHtml(html, {
    delayMs: model.billLocale === 'ur' ? 900 : 500,
  });
}

// re-export helpers used by verify / UI
export {
  abbreviateMilkHisabColumn,
  buildMilkHisabDayBreakdownGrid,
  formatMilkHisabDayHeaderLine,
  formatMilkHisabDayLine,
};
