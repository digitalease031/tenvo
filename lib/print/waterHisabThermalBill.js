'use client';

/**
 * Water Route Hisab 58mm thermal bills — Daily Sale Summary + weekly/monthly period sheets.
 * Exact MediaBox sizing (same printer path as POS / milk hisab).
 */
import {
  dispatchThermalReceipt,
  printThermalReceiptHtml,
  printJsPdfDocument,
} from '@/lib/print/thermalReceipt';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import {
  parseWaterHisabBillingPeriod,
  formatWaterHisabDayHeaderLine,
  shortWaterHisabProductLabel,
  computeWaterSaleAmount,
} from '@/lib/storefront/waterShopHisab';
import { formatMilkHisabDayLine } from '@/lib/storefront/milkShopHisab';
import {
  buildMilkHisabDayBreakdownPrintModel,
  createMilkHisabDayBreakdownPdf,
  buildMilkHisabDayBreakdownHtml,
  downloadMilkHisabDayBreakdownPdf,
} from '@/lib/print/milkHisabThermalBill';

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '"');
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

function resolvePeriodMeta(period = '', periodLabel = '') {
  let kind = 'month';
  let label = periodLabel;
  if (period && !label) {
    try {
      const parsed = parseWaterHisabBillingPeriod(period);
      kind = parsed.kind;
      label = parsed.label;
    } catch {
      label = period;
    }
  } else if (period) {
    try {
      kind = parseWaterHisabBillingPeriod(period).kind;
    } catch {
      kind = /W\d/i.test(period) ? 'week' : 'month';
    }
  }
  return { kind, label };
}

function pad(s, w, align = 'left') {
  const t = String(s ?? '').slice(0, w);
  if (align === 'right') return t.padStart(w, ' ');
  if (align === 'center') {
    const left = Math.floor((w - t.length) / 2);
    return t.padStart(left + t.length, ' ').padEnd(w, ' ');
  }
  return t.padEnd(w, ' ');
}

/**
 * Daily Sale Summary model (one customer, one delivery date).
 */
export function buildWaterDailySalePrintModel({
  business,
  row,
  products = [],
  deliveryDate = '',
  category = 'water-delivery',
}) {
  const pack = getBusinessRegionalPack(business);
  const lines = [];
  let delTotal = 0;
  let recTotal = 0;
  let saleTotal = 0;
  const rate =
    Number(row?.productRate) > 0
      ? Number(row.productRate)
      : 0;

  for (const p of products || []) {
    const pid = String(p.id);
    const del = Number(row?.qtyByProduct?.[pid] ?? row?.qtyByProduct?.[p.id]) || 0;
    const rec = Number(row?.recByProduct?.[pid] ?? row?.recByProduct?.[p.id]) || 0;
    if (del <= 0 && rec <= 0) continue;
    const unitRate = rate > 0 ? rate : Number(p.price) || 0;
    const amount = computeWaterSaleAmount({ qty: del, unitPrice: unitRate, accountRate: rate });
    delTotal += del;
    recTotal += rec;
    saleTotal += amount;
    lines.push({
      name: shortWaterHisabProductLabel(p, 14),
      del,
      rec,
      rate: unitRate,
      amount,
      unit: p.unit || 'pcs',
    });
  }

  const discount = Math.max(0, Number(row?.specialDiscount) || 0);
  const cash = Math.max(0, Number(row?.cashCollected) || 0);
  const grandTotal = Math.max(0, Math.round((saleTotal - discount) * 100) / 100);
  const prevBottle = Number(row?.prevBottle) || 0;
  const bottleBalance = Math.round((prevBottle + delTotal - recTotal) * 1000) / 1000;

  const dateLabel = deliveryDate
    ? String(deliveryDate).slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    businessName:
      business?.business_name || business?.name || business?.businessName || 'Water supply',
    address: business?.address || '',
    phone: business?.phone || '',
    documentLabel: 'Daily Sale Summary',
    deliveryDate: dateLabel,
    customerName: row?.customerName || 'Customer',
    accountNo: row?.accountNo || '',
    houseNo:
      row?.houseNo && String(row.houseNo).trim() !== '?' && String(row.houseNo).trim() !== 'null'
        ? String(row.houseNo).trim()
        : '',
    floorFlat: row?.floorFlat || '',
    townCode: row?.townCode || '',
    routeLabel: row?.routeLabel || '',
    productRate: rate,
    lines,
    delTotal: Math.round(delTotal * 1000) / 1000,
    recTotal: Math.round(recTotal * 1000) / 1000,
    prevBottle,
    bottleBalance,
    cashCollected: cash,
    specialDiscount: discount,
    grandTotal,
    currencyCode: pack.currency,
    numberLocale: 'en-PK',
    category: business?.category || category,
    thanks: 'Shukriya · Thank you',
    legend: 'Del = delivered · Rec = empty returned · BAL = bottles with customer',
  };
}

function estimateDailySheetHeightMm(model) {
  const lines = model?.lines?.length || 0;
  return Math.min(Math.max(52 + lines * 4.2 + 36, 72), 200);
}

/**
 * Monospace daily slip lines for perfect 58mm column alignment.
 * Improved layout (32 chars usable ≈ 54mm @ 8.5px courier):
 * PRODUCT------- DEL  REC   AMOUNT
 * 12 chars name + 5 del + 5 rec + 10 amount = 32 total
 */
export function formatWaterDailyLineHeader() {
  return `${pad('PRODUCT', 12)}${pad('DEL', 5, 'right')}${pad('REC', 5, 'right')}${pad('AMOUNT', 10, 'right')}`;
}

export function formatWaterDailyProductLine(line) {
  const name = pad(line.name || 'Item', 12);
  const del = pad(String(line.del ?? 0), 5, 'right');
  const rec = pad(String(line.rec ?? 0), 5, 'right');
  const amt = pad(
    (Number(line.amount) || 0).toFixed(0),
    10,
    'right'
  );
  return `${name}${del}${rec}${amt}`;
}

/**
 * Build exact-size 58mm jsPDF for one daily sale slip.
 */
export async function createWaterDailySalePdf(model, existingDoc = null) {
  const { default: jsPDF } = await import('jspdf');
  const d = model;
  const pageW = 58;
  const margin = 2.2;
  const contentW = pageW - margin * 2;

  const renderOnDoc = (doc) => {
    let y = margin + 2;
    const write = (text, opts = {}) => {
      const { size = 7, bold = false, align = 'center' } = opts;
      doc.setFont('courier', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      const x = align === 'center' ? pageW / 2 : align === 'right' ? pageW - margin : margin;
      doc.text(String(text ?? ''), x, y, { align, maxWidth: contentW });
      y += size * 0.38 + 1.0;
    };
    const rule = () => {
      y += 0.5;
      doc.setDrawColor(140);
      doc.line(margin, y, pageW - margin, y);
      y += 2.0;
    };
    const pair = (left, right, size = 7) => {
      doc.setFont('courier', 'normal');
      doc.setFontSize(size);
      doc.text(String(left), margin, y, { maxWidth: contentW * 0.55 });
      doc.text(String(right), pageW - margin, y, { align: 'right' });
      y += 3.0;
    };

    write(d.businessName, { size: 9, bold: true });
    if (d.address) write(d.address, { size: 6 });
    if (d.phone) write(d.phone, { size: 6 });
    rule();
    
    write('DAILY SALE SUMMARY', { size: 8, bold: true });
    write(d.deliveryDate, { size: 7.5, bold: true });
    rule();
    
    // Customer section with better organization
    write(d.customerName, { size: 7.8, bold: true });
    const customerInfo = [];
    if (d.accountNo) customerInfo.push(`ID: ${d.accountNo}`);
    if (d.townCode) customerInfo.push(`Town: ${d.townCode}`);
    if (customerInfo.length) write(customerInfo.join('  |  '), { size: 6.5 });
    
    const addressInfo = [];
    if (d.houseNo && d.houseNo.trim() !== '?') addressInfo.push(`House: ${d.houseNo}`);
    if (d.floorFlat) addressInfo.push(d.floorFlat);
    if (d.routeLabel) addressInfo.push(d.routeLabel);
    if (addressInfo.length) write(addressInfo.join('  |  '), { size: 6.5 });
    rule();
    
    // Product section with improved header
    write(formatWaterDailyLineHeader(), { size: 6.5, bold: true, align: 'left' });
    y += 0.5;
    doc.setDrawColor(180);
    doc.line(margin, y, pageW - margin, y);
    y += 2.2;
    
    for (const line of d.lines || []) {
      write(formatWaterDailyProductLine(line), { size: 6.5, align: 'left' });
      if (Number(line.rate) > 0) {
        write(`  @ ${money(line.rate, d.currencyCode, d.numberLocale)} per ${line.unit || 'pcs'}`, {
          size: 5.8,
          align: 'left',
        });
        // No y-offset hack — consistent with HTML fallback line-height
      }
    }
    rule();
    
    // Summary section with better alignment
    pair('Delivered bottles', String(d.delTotal));
    pair('Received empties', String(d.recTotal));
    y += 0.8;
    doc.setDrawColor(200);
    doc.line(margin + 1, y, pageW - margin - 1, y);
    y += 2.5;
    pair('Previous BAL', String(d.prevBottle));
    pair('Current BAL', String(d.bottleBalance), 7.2);
    
    if (d.specialDiscount > 0) {
      y += 0.6;
      pair('Special discount', money(d.specialDiscount, d.currencyCode, d.numberLocale));
    }
    
    y += 1.2;
    pair('Cash collected', money(d.cashCollected, d.currencyCode, d.numberLocale), 7.2);
    
    y += 1.0;
    doc.setDrawColor(30);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 3.8;
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.text('TOTAL DUE', margin, y);
    doc.text(money(d.grandTotal, d.currencyCode, d.numberLocale), pageW - margin, y, {
      align: 'right',
    });
    y += 5;
    rule();
    write(d.thanks || 'Shukriya · Thank you', { size: 7.5, bold: true });
    y += 0.5;
    write(d.legend || '', { size: 5.8 });
    y += 0.5;
    return { doc, finalY: y };
  };

  const probeDoc = new jsPDF({ unit: 'mm', format: [pageW, 200], orientation: 'portrait', compress: true });
  const { finalY } = renderOnDoc(probeDoc);
  const pageH = Math.min(Math.max(Math.ceil(finalY + margin + 3), 70), 220);

  let doc = existingDoc;
  if (!doc) {
    doc = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation: 'portrait', compress: true });
  } else {
    doc.addPage([pageW, pageH], 'portrait');
  }

  renderOnDoc(doc);

  const slug = String(d.accountNo || d.houseNo || d.customerName || 'daily')
    .replace(/[^\w-]+/g, '-')
    .slice(0, 28);
  return {
    doc,
    pageW,
    pageH,
    filename: `water-daily-${d.deliveryDate || 'day'}-${slug}.pdf`,
  };
}

export function buildWaterDailySaleHtml(model) {
  const d = model;
  const pageH = estimateDailySheetHeightMm(d);
  // Use px-based body width so screen preview matches print output (58mm ≈ 219px)
  const PW_PX = 219;
  const styles = `
  @page { size: 58mm ${pageH}mm; margin: 0; }
  @media print {
    @page { size: 58mm ${pageH}mm; margin: 0; }
    html, body { width: ${PW_PX}px !important; max-width: ${PW_PX}px !important; margin: 0 !important; padding: 0 !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${PW_PX}px; max-width: ${PW_PX}px; margin: 0 auto; background: #fff; overflow-x: hidden; }
  body {
    padding: 8px 8px 14px;
    font-family: 'Courier New', Courier, Consolas, monospace;
    font-size: 8px; line-height: 1.32; color: #111;
  }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .t { font-size: 10px; margin-bottom: 2px; letter-spacing: -0.02em; }
  .s { font-size: 7px; color: #444; line-height: 1.28; }
  hr { border: none; border-top: 1.5px solid #888; margin: 5px 0; }
  .hr-light { border-top: 1px solid #ccc; margin: 3px 0; }
  .grid { font-size: 7.5px; font-family: 'Courier New', Courier, Consolas, monospace; white-space: pre-wrap; word-break: break-word; letter-spacing: 0; line-height: 1.38; text-align: left; }
  .grid .hdr { font-weight: 700; border-bottom: 1px solid #444; padding-bottom: 2px; margin-bottom: 2px; }
  .grid .line { padding: 1px 0; }
  .grid .rate { font-size: 6.5px; color: #555; padding-left: 3px; margin-top: -1px; }
  .row { display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 7.5px; padding: 1px 0; }
  .row span.lbl { text-align: left; padding-right: 4px; flex: 1; }
  .row span.val { text-align: right; margin-left: auto; font-weight: 600; white-space: nowrap; }
  .row-emphasized { font-weight: 700; font-size: 8px; }
  .section-divider { border-top: 1px dashed #ddd; margin: 2px 0; }
  .tot { font-weight: 800; font-size: 10px; border-top: 1.5px solid #222; padding-top: 4px; margin-top: 3px; }
  .foot { margin-top: 6px; text-align: center; font-size: 7.5px; line-height: 1.42; }
  .foot-legend { font-size: 6.5px; color: #555; margin-top: 2px; }
  .info-line { font-size: 7px; color: #333; margin: 1px 0; }
  `;
  const pair = (l, r, emphasized = false) =>
    `<div class="row${emphasized ? ' row-emphasized' : ''}"><span class="lbl">${esc(l)}</span><span class="val">${esc(r)}</span></div>`;
  
  // Build product lines with rate annotations
  const productLines = (d.lines || []).map(line => {
    const mainLine = esc(formatWaterDailyProductLine(line));
    const rateLine = Number(line.rate) > 0 
      ? `<div class="rate">@ ${esc(money(line.rate, d.currencyCode, d.numberLocale))} per ${esc(line.unit || 'pcs')}</div>`
      : '';
    return `<div class="line">${mainLine}${rateLine}</div>`;
  }).join('\n');
  
  // Build customer info sections
  const customerInfo = [];
  if (d.accountNo) customerInfo.push(`A/C: ${d.accountNo}`);
  if (d.townCode) customerInfo.push(`Town: ${d.townCode}`);
  const customerInfoLine = customerInfo.length 
    ? `<div class="info-line c">${esc(customerInfo.join('  |  '))}</div>` 
    : '';
  
  const addressInfo = [];
  if (d.houseNo && d.houseNo.trim() !== '?') addressInfo.push(`House: ${d.houseNo}`);
  if (d.floorFlat) addressInfo.push(d.floorFlat);
  if (d.routeLabel) addressInfo.push(d.routeLabel);
  const addressInfoLine = addressInfo.length 
    ? `<div class="info-line c">${esc(addressInfo.join('  |  '))}</div>` 
    : '';
  
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Daily Sale</title><style>${styles}</style></head><body>
  <div class="c b t">${esc(d.businessName)}</div>
  ${d.address ? `<div class="c s">${esc(d.address)}</div>` : ''}
  ${d.phone ? `<div class="c s">${esc(d.phone)}</div>` : ''}
  <hr/>
  <div class="c b" style="font-size: 9px; margin-bottom: 0.5mm;">DAILY SALE SUMMARY</div>
  <div class="c b" style="font-size: 8.5px;">${esc(d.deliveryDate)}</div>
  <hr/>
  <div class="c b" style="font-size: 8.5px; margin-bottom: 0.5mm;">${esc(d.customerName)}</div>
  ${customerInfoLine}
  ${addressInfoLine}
  <hr/>
  <div class="grid">
    <div class="hdr">${esc(formatWaterDailyLineHeader())}</div>
    ${productLines}
  </div>
  <hr/>
  ${pair('Delivered bottles', String(d.delTotal))}
  ${pair('Received empties', String(d.recTotal))}
  <div class="section-divider"></div>
  ${pair('Previous BAL', String(d.prevBottle))}
  ${pair('Current BAL', String(d.bottleBalance), true)}
  ${d.specialDiscount > 0 ? `<div class="section-divider"></div>${pair('Special discount', money(d.specialDiscount, d.currencyCode, d.numberLocale))}` : ''}
  <div class="section-divider"></div>
  ${pair('Cash collected', money(d.cashCollected, d.currencyCode, d.numberLocale), true)}
  <div class="row tot"><span class="lbl">TOTAL DUE</span><span class="val">${esc(money(d.grandTotal, d.currencyCode, d.numberLocale))}</span></div>
  <hr/>
  <div class="foot">
    <div class="b">${esc(d.thanks)}</div>
    <div class="foot-legend">${esc(d.legend)}</div>
  </div>
</body></html>`;
}

/**
 * Print or download one daily sale slip.
 * @param {object} args
 * @param {'print'|'pdf'} [mode]
 */
export async function printWaterDailySaleBill(args, mode = 'print') {
  const model = buildWaterDailySalePrintModel(args);
  if (!model.lines.length && !(model.cashCollected > 0)) {
    return false;
  }
  if (mode === 'pdf') {
    try {
      const { doc, filename } = await createWaterDailySalePdf(model);
      doc.save(filename);
      return true;
    } catch (err) {
      console.error('printWaterDailySaleBill pdf', err);
      return printThermalReceiptHtml(buildWaterDailySaleHtml(model), { delayMs: 600 });
    }
  }
  try {
    const { doc, pageW, pageH } = await createWaterDailySalePdf(model);
    const ok = await printJsPdfDocument(doc, {
      delayMs: 450,
      pageW,
      pageH,
      title: `Water daily ${pageW}x${pageH}mm`,
    });
    if (ok) return true;
  } catch (err) {
    console.warn('[waterHisab] daily PDF print failed, HTML fallback', err);
  }
  return printThermalReceiptHtml(buildWaterDailySaleHtml(model), { delayMs: 500 });
}

/**
 * Multi-page 58mm: all daily customers with activity (print or Save-as-PDF).
 */
export async function printWaterDailySaleBulk(args, mode = 'pdf') {
  const { business, rows = [], products = [], deliveryDate = '', category } = args;
  const active = (rows || []).filter((row) => {
    const del = Object.values(row.qtyByProduct || {}).some((q) => Number(q) > 0);
    const rec = Object.values(row.recByProduct || {}).some((q) => Number(q) > 0);
    const cash = Number(row.cashCollected) > 0;
    return del || rec || cash;
  });
  if (!active.length) return false;

  if (active.length === 1) {
    return printWaterDailySaleBill(
      { business, row: active[0], products, deliveryDate, category },
      mode === 'print' ? 'print' : 'pdf'
    );
  }

  const models = active.map((row) =>
    buildWaterDailySalePrintModel({ business, row, products, deliveryDate, category })
  );

  // If user requested PDF download, generate multi-page 58mm PDF document via jsPDF
  if (mode === 'pdf') {
    try {
      let mainDoc = null;
      for (const m of models) {
        const { doc } = await createWaterDailySalePdf(m, mainDoc);
        mainDoc = doc;
      }
      if (mainDoc) {
        mainDoc.save(`water-daily-bills-${deliveryDate || 'today'}.pdf`);
        return true;
      }
    } catch (err) {
      console.warn('[waterHisab] Bulk daily PDF generation failed, falling back to HTML print', err);
    }
  }

  // Direct physical thermal printer execution (mode === 'print')
  const parts = models.map((m) => {
    const inner = buildWaterDailySaleHtml(m)
      .replace(/^[\s\S]*<body[^>]*>/i, '')
      .replace(/<\/body>[\s\S]*$/i, '');
    return `<section class="slip">${inner}</section>`;
  });
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Water daily bills ${esc(deliveryDate)}</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  @media print { @page { size: 58mm auto; margin: 0; } * { -webkit-print-color-adjust: exact !important; } }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #fff; }
  .slip {
    width: 219px; max-width: 219px; margin: 0 auto;
    page-break-after: always; break-after: page;
  }
  .slip:last-child { page-break-after: auto; break-after: auto; }
</style></head><body>${parts.join('\n')}</body></html>`;
  return printThermalReceiptHtml(html, { delayMs: 700 });
}

/**
 * Period (week/month) print model with water labels + account/cash/BAL extras.
 */
export function buildWaterPeriodPrintModel(args = {}) {
  const base = buildMilkHisabDayBreakdownPrintModel({
    ...args,
    billLocale: args.billLocale || 'en',
  });
  const { kind } = resolvePeriodMeta(args.period, args.periodLabel);
  const documentLabel =
    kind === 'week' ? 'Weekly Water Bill' : kind === 'day' ? 'Daily Water Bill' : 'Monthly Water Bill';

  return {
    ...base,
    documentLabel,
    daySection: 'Day delivery (Y/N)',
    totalSection: 'Product totals',
    totalLabel: 'TOTAL DUE',
    thanks: 'Shukriya · Thank you',
    legend: 'Y = delivered · N = no delivery · Empties on daily route',
    housePrefix: 'H',
    accountNo: args.accountNo || '',
    townCode: args.townCode || '',
    floorFlat: args.floorFlat || '',
    cashCollected: Number(args.cashCollected) || 0,
    specialDiscount: Number(args.specialDiscount) || 0,
    bottleBalance: args.bottleBalance != null ? Number(args.bottleBalance) : null,
    delTotal: Number(args.delTotal) || 0,
    recTotal: Number(args.recTotal) || 0,
  };
}

/**
 * Enhance milk PDF with water meta lines (account / cash / BAL).
 */
async function createWaterPeriodPdf(model, existingDoc = null) {
  const discount = Math.max(0, Number(model.specialDiscount) || 0);
  const enriched = {
    ...model,
    // Ensure water-specific document label is NOT overwritten by the milk builder.
    documentLabel: model.documentLabel || 'Water Route Bill',
    customerName: [
      model.customerName,
      model.accountNo ? `A/C ${model.accountNo}` : '',
      model.townCode ? `T${model.townCode}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
    houseNo: [model.houseNo, model.floorFlat].filter(Boolean).join(' / '),
  };

  // Append cash/BAL into legend footer when present.
  const extraBits = [];
  if (enriched.delTotal > 0 || enriched.recTotal > 0) {
    extraBits.push(`Del ${enriched.delTotal} · Rec ${enriched.recTotal}`);
  }
  if (enriched.bottleBalance != null) extraBits.push(`BAL ${enriched.bottleBalance}`);
  if (enriched.cashCollected > 0) {
    extraBits.push(`Cash ${money(enriched.cashCollected, enriched.currencyCode, enriched.numberLocale)}`);
  }
  if (discount > 0) {
    extraBits.push(`Disc ${money(discount, enriched.currencyCode, enriched.numberLocale)}`);
  }
  if (extraBits.length) {
    enriched.legend = `${enriched.legend} · ${extraBits.join(' · ')}`;
  }

  return createMilkHisabDayBreakdownPdf(enriched, existingDoc);
}

export async function printWaterPeriodBill(args, mode = 'print') {
  const model = buildWaterPeriodPrintModel(args);
  if (mode === 'pdf') {
    if (model.billLocale === 'ur') {
      return downloadMilkHisabDayBreakdownPdf(model);
    }
    try {
      const { doc, filename } = await createWaterPeriodPdf(model);
      doc.save(filename.replace('hisab-day', 'water-hisab'));
      return true;
    } catch (err) {
      console.error('printWaterPeriodBill pdf', err);
      return downloadMilkHisabDayBreakdownPdf(model);
    }
  }

  if (model.billLocale !== 'ur') {
    try {
      const { doc, pageW, pageH } = await createWaterPeriodPdf(model);
      const ok = await printJsPdfDocument(doc, {
        delayMs: 500,
        pageW,
        pageH,
        title: `Water hisab ${pageW}x${pageH}mm`,
      });
      if (ok) return true;
    } catch (err) {
      console.warn('[waterHisab] period PDF print failed', err);
    }
  }

  const html = buildMilkHisabDayBreakdownHtml(model);
  return printThermalReceiptHtml(html, {
    delayMs: model.billLocale === 'ur' ? 900 : 500,
  });
}

/**
 * Bulk week/month: one print job / PDF dialog for all customers.
 * @param {{ models: object[], periodLabel?: string, kind?: string, mode?: 'print'|'pdf' }} args
 */
export async function printWaterPeriodBulk({ models = [], periodLabel = '', kind = 'month', mode = 'pdf' }) {
  const list = (models || []).filter(Boolean);
  if (!list.length) return false;

  if (list.length === 1) {
    return printWaterPeriodBill(list[0], mode);
  }

  if (mode === 'pdf') {
    try {
      let mainDoc = null;
      for (const mArgs of list) {
        const model = buildWaterPeriodPrintModel(mArgs);
        const { doc } = await createWaterPeriodPdf(model, mainDoc);
        mainDoc = doc;
      }
      if (mainDoc) {
        mainDoc.save(`water-${kind || 'period'}-bills-${periodLabel || 'report'}.pdf`);
        return true;
      }
    } catch (err) {
      console.warn('[waterHisab] Bulk period PDF generation failed, falling back to HTML print', err);
    }
  }

  const parts = list.map((args) => {
    const model = buildWaterPeriodPrintModel(args);
    const enriched = {
      ...model,
      customerName: [
        model.customerName,
        model.accountNo ? `A/C ${model.accountNo}` : '',
      ]
        .filter(Boolean)
        .join(' · '),
      houseNo: [model.houseNo, model.floorFlat].filter(Boolean).join(' / '),
    };
    const inner = buildMilkHisabDayBreakdownHtml(enriched)
      .replace(/^[\s\S]*<body[^>]*>/i, '')
      .replace(/<\/body>[\s\S]*$/i, '');
    return `<section class="slip">${inner}</section>`;
  });

  const title =
    kind === 'week'
      ? `Weekly water bills ${periodLabel}`
      : `Monthly water bills ${periodLabel}`;

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>${esc(title)}</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  @media print { @page { size: 58mm auto; margin: 0; } * { -webkit-print-color-adjust: exact !important; } }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #fff; }
  .slip {
    width: 219px; max-width: 219px; margin: 0 auto;
    page-break-after: always; break-after: page;
  }
  .slip:last-child { page-break-after: auto; }
</style></head><body>${parts.join('\n')}</body></html>`;

  return printThermalReceiptHtml(html, { delayMs: 800 });
}

export async function createWaterPeriodPdfBlob(args) {
  const model = buildWaterPeriodPrintModel({ ...args, billLocale: 'en' });
  const { doc, filename } = await createWaterPeriodPdf(model);
  return {
    blob: doc.output('blob'),
    filename: String(filename).replace('hisab-day', 'water-hisab'),
    model,
  };
}

/** Totals-only thermal (invoice / bills row) — water document labels. */
export function buildWaterThermalOptsFromRow({
  business,
  row,
  productColumns = [],
  period = '',
  periodLabel = '',
  category = 'water-delivery',
}) {
  const pack = getBusinessRegionalPack(business);
  const { kind, label } = resolvePeriodMeta(period, periodLabel);
  const documentLabel = kind === 'week' ? 'Weekly Water Bill' : 'Monthly Water Bill';
  const total = Math.round((Number(row?.amount) || 0) * 100) / 100;
  const qtyByProduct = row?.qtyByProduct || {};
  const meta = row?.productMeta || {};
  const lineItems = [];

  for (const col of productColumns) {
    const qty = Number(qtyByProduct[col.id]) || 0;
    if (qty <= 0) continue;
    const unitMeta = meta[col.id] || {};
    const unit = unitMeta.unit || col.unit || '';
    const name = unitMeta.name || col.name || 'Item';
    const unitPrice = Number(unitMeta.unitPrice) || (qty ? total / qty : total);
    lineItems.push({
      name: unit ? `${name} (${unit})` : name,
      quantity: qty,
      unitPrice,
      lineTotal: Math.round(qty * unitPrice * 100) / 100,
    });
  }

  if (!lineItems.length) {
    lineItems.push({
      name: label ? `Water route ${label}` : 'Water route hisab',
      quantity: 1,
      unitPrice: total,
      lineTotal: total,
    });
  }

  const customerBase = row?.customerName || 'Customer';
  const customerName = [
    customerBase,
    row?.accountNo ? `A/C ${row.accountNo}` : '',
    row?.houseNo ? `H ${row.houseNo}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    business,
    documentLabel,
    category: business?.category || category,
    currencyCode: pack.currency,
    paperSize: '58mm',
    sale: {
      invoice_number: row?.invoiceNumber || 'DRAFT',
      date: new Date(),
      customerName,
      paymentMethod: String(row?.paymentStatus || '').toLowerCase() === 'paid' ? 'cash' : 'credit',
    },
    lineItems,
  };
}

export async function printWaterThermalBillFromRow(args, mode = 'print') {
  return dispatchThermalReceipt(buildWaterThermalOptsFromRow(args), mode);
}

export async function printWaterThermalBill(args, mode = 'print') {
  const pack = getBusinessRegionalPack(args.business);
  const { kind, label } = resolvePeriodMeta(args.period, args.periodLabel);
  const invoice = args.invoice || {};
  const items = args.items || [];
  const documentLabel = kind === 'week' ? 'Weekly Water Bill' : 'Monthly Water Bill';
  const customerBase = invoice.customer_name || invoice.customerName || 'Customer';
  const customerName = args.houseNo ? `${customerBase} · H ${args.houseNo}` : customerBase;
  const lineItems = items.map((item) => {
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
    const lineTotal = Number(
      item.total_amount ?? item.lineTotal ?? Math.round(qty * unitPrice * 100) / 100
    );
    const unit = item.product_unit || item.unit || '';
    const name = item.name || item.product_name || 'Item';
    return {
      name: unit ? `${name} (${unit})` : name,
      quantity: qty,
      unitPrice,
      lineTotal,
    };
  });
  if (!lineItems.length) {
    const total = Number(invoice.grand_total || invoice.amount || 0);
    lineItems.push({
      name: label ? `Water route ${label}` : 'Water route hisab',
      quantity: 1,
      unitPrice: total,
      lineTotal: total,
    });
  }
  return dispatchThermalReceipt(
    {
      business: args.business,
      documentLabel,
      category: args.business?.category || args.category || 'water-delivery',
      currencyCode: pack.currency,
      paperSize: '58mm',
      sale: {
        invoice_number: invoice.invoice_number || invoice.invoiceNumber || 'DRAFT',
        date: invoice.date || invoice.created_at || new Date(),
        customerName,
        paymentMethod:
          invoice.payment_status === 'paid' ? invoice.payment_method || 'cash' : 'credit',
      },
      lineItems,
    },
    mode
  );
}

/**
 * Build exact-size jsPDF document for Water Delivery Checklist (58mm or 80mm).
 * Intelligent, customizable format with smart target calculation.
 * 
 * 80mm layout (per plant register image):
 *   H# | ADDRESS/CUSTOMER (17) | PH (8) | TGT | DEL[] | REC[] | CASH[] | BAL
 * 58mm layout (compact thermal):
 *   H# | CUSTOMER (12) | TGT | DEL[] | REC[] | BAL
 *
 * @param {{
 *   business: object,
 *   rows: Array<{ customerName: string, houseNo?: string, phone?: string, routeLabel?: string, accountNo?: string, bottleBalance?: number, qtyByProduct?: object, dailyBottles?: number }>,
 *   products: Array<{ id: string, name: string, unit?: string, hisabShortLabel?: string }>,
 *   deliveryDate?: string,
 *   riderName?: string,
 *   paperSize?: '58mm'|'80mm',
 *   config?: object,
 * }} args
 * @param {object} [existingDoc]
 */
export async function createWaterDeliveryChecklistPdf(args, existingDoc = null) {
  const { default: jsPDF } = await import('jspdf');
  const { buildChecklistPayload, readChecklistConfig } = await import('@/lib/storefront/waterChecklistConfig');
  
  const paperSize = args.paperSize === '80mm' ? '80mm' : '58mm';
  const is80 = paperSize === '80mm';
  const pageW = is80 ? 80 : 58;
  const margin = 2.5;
  const contentW = pageW - margin * 2;
  const business = args.business || {};
  
  // Build intelligent checklist payload with smart targets
  const checklistConfig = args.config || readChecklistConfig(business.settings || {});
  const payload = buildChecklistPayload({
    rows: args.rows || [],
    products: args.products || [],
    business,
    deliveryDate: args.deliveryDate,
    riderName: args.riderName,
    config: checklistConfig,
  });
  
  const rows = payload.enrichedRows;
  const products = args.products || [];
  const deliveryDate = args.deliveryDate
    ? String(args.deliveryDate).slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const riderName = args.riderName || '';
  const businessName =
    business?.business_name || business?.name || business?.businessName || 'Water Supply';
  const address = business?.address || '';
  const bizPhone = business?.phone || '';

  let totalTargetBottles = 0;
  rows.forEach((r) => {
    // Use smart calculated target from intelligent config
    const smartTarget = r.displayTarget || r.calculatedTarget || 0;
    if (smartTarget > 0) {
      totalTargetBottles += smartTarget;
    } else {
      // Fallback: sum product quantities or daily bottles
      let rowTarget = 0;
      products.forEach((p) => {
        rowTarget += Number(r.qtyByProduct?.[String(p.id)] ?? r.qtyByProduct?.[p.id]) || 0;
      });
      if (rowTarget === 0) rowTarget = Number(r.dailyBottles) || 1;
      totalTargetBottles += rowTarget;
    }
  });

  const renderOnDoc = (doc) => {
    let y = margin + 2;

    const write = (text, opts = {}) => {
      const { size = 7, bold = false, align = 'center', spacing = 0 } = opts;
      doc.setFont('courier', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      const x = align === 'center' ? pageW / 2 : align === 'right' ? pageW - margin : margin;
      doc.text(String(text ?? ''), x, y, { align, maxWidth: contentW });
      // FIXED: Better vertical advance calculation for proper text spacing
      // Font height in mm ≈ size * 0.353 (pt to mm) + line spacing
      const lineHeight = size * 0.42;  // More accurate pt-to-mm with breathing room
      y += lineHeight + (spacing || 0);
    };

    const rule = (weight = 'normal', style = 'solid') => {
      y += 1.5;  // FIXED: More clearance before line (was 0.8mm)
      if (weight === 'heavy') {
        doc.setLineWidth(0.5);
        doc.setDrawColor(30, 30, 30);
      } else if (weight === 'light') {
        doc.setLineWidth(0.2);
        doc.setDrawColor(160, 160, 160);
      } else {
        doc.setLineWidth(0.3);
        doc.setDrawColor(80, 80, 80);
      }
      doc.setLineDashPattern(style === 'dashed' ? [1.2, 1.2] : [], 0);
      doc.line(margin, y, pageW - margin, y);
      doc.setLineDashPattern([], 0);
      doc.setLineWidth(0.2);
      y += style === 'dashed' ? 2.2 : 2.8;  // FIXED: More space after line (was 1.5 : 2.0)
    };

    // ── Header Section with Perfect Spacing ──
    // Business name - bold, prominent with proper clearance below
    write(businessName, { size: is80 ? 10.5 : 9.5, bold: true, spacing: 1.8 });
    
    // Business address - smaller, grey color simulation via lighter weight
    if (address) {
      doc.setTextColor(60, 60, 60);
      write(address, { size: is80 ? 6.5 : 6.0, spacing: 1.2 });
      doc.setTextColor(0, 0, 0);
    }
    
    // Business phone - same styling as address with breathing room
    if (bizPhone) {
      doc.setTextColor(60, 60, 60);
      write(bizPhone, { size: is80 ? 6.5 : 6.0, spacing: 1.5 });
      doc.setTextColor(0, 0, 0);
    }
    
    // Heavy separator after business info - proper clearance from text above
    rule('heavy', 'solid');

    // Document title - uppercase, bold, well-spaced from line above
    write('ROUTE DELIVERY CHECKLIST', { size: is80 ? 9.0 : 8.0, bold: true, spacing: 2.2 });
    
    // Date and rider info - bold, medium size with clear separation
    const dateRiderText = riderName 
      ? `Date: ${deliveryDate}  |  Rider: ${riderName}`
      : `Date: ${deliveryDate}`;
    write(dateRiderText, { size: is80 ? 7.5 : 7.0, bold: true, spacing: 1.8 });
    
    // Stops and target summary - clear spacing before line
    const summaryText = `Stops: ${rows.length}  |  Target Load: ${totalTargetBottles} Pcs`;
    write(summaryText, { size: is80 ? 7.0 : 6.5, bold: false, spacing: 2.0 });
    
    // Heavy separator before data table - professional gap
    rule('heavy', 'solid');

    // ── Column x-positions (mm from left margin) ──────────────────────────
    //
    //  80mm usable = 75mm (margin 2.5 each side)
    //  H#(8) | CUST(15) | PHONE(13) | TGT(6) | _DEL_(8) | _REC_(8) | CASH(8) | BAL(6)
    //   0      8          23          36       42         50         58        69
    //
    //  58mm usable = 53mm (margin 2.5 each side)
    //  H#(7) | CUST(13) | TGT(5) | _DEL_(7) | _REC_(7) | BAL(5)
    //   0      7          20       25         32         39        44
    const col = is80
      ? { h: 0, cu: 8, ph: 23, tg: 36, del: 45, rec: 53, cash: 61, bal: 69 }
      : { h: 0, cu: 7, tg: 20, del: 27, rec: 34, bal: 44 };

    const boxW58 = 5.5;   // tick box width 58mm
    const boxW80 = 6.5;   // tick box width 80mm
    const boxW   = is80 ? boxW80 : boxW58;
    const boxH   = 4.5;   // tick box height
    const rowH   = boxH + 4.2;   // Proper spacing: box height + vertical padding for clean separation
    const fontSize = is80 ? 6.8 : 6.2;

    // ── Column headers ─────────────────────────────────────────────────────
    // FIXED: Add proper breathing room after separator line before column headers
    y += 0.8;  // Extra spacing to prevent header overlap with separator
    
    // Header labels are centered over their tick-box column (box center = col.X + boxW/2)
    doc.setFont('courier', 'bold');
    doc.setFontSize(fontSize);

    if (is80) {
      doc.text('H#',       margin + col.h,              y, { align: 'left' });
      doc.text('CUSTOMER', margin + col.cu,              y, { align: 'left' });
      doc.text('PHONE',    margin + col.ph,              y, { align: 'left' });
      doc.text('TGT',      margin + col.tg + 2,          y, { align: 'center' });
      doc.text('DEL',      margin + col.del + boxW / 2,  y, { align: 'center' });
      doc.text('REC',      margin + col.rec + boxW / 2,  y, { align: 'center' });
      doc.text('CASH',     margin + col.cash + boxW / 2, y, { align: 'center' });
      doc.text('BAL',      margin + col.bal + 4,         y, { align: 'right' });
    } else {
      doc.text('H#',       margin + col.h,              y, { align: 'left' });
      doc.text('CUSTOMER', margin + col.cu,              y, { align: 'left' });
      doc.text('TGT',      margin + col.tg + 1.5,        y, { align: 'center' });
      doc.text('DEL',      margin + col.del + boxW / 2,  y, { align: 'center' });
      doc.text('REC',      margin + col.rec + boxW / 2,  y, { align: 'center' });
      doc.text('BAL',      margin + col.bal + 3.5,       y, { align: 'right' });
    }
    y += 3.2;  // FIXED: Better spacing after column headers (was 2.5mm)
    rule();

    // ── Data rows ──────────────────────────────────────────────────────────
    doc.setFont('courier', 'normal');
    doc.setFontSize(fontSize);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Calculate smart target for this row
      let rowTgt = row.displayTarget || row.calculatedTarget || 0;
      if (rowTgt === 0) {
        // Fallback calculation
        products.forEach((p) => {
          rowTgt += Number(row.qtyByProduct?.[String(p.id)] ?? row.qtyByProduct?.[p.id]) || 0;
        });
        if (rowTgt === 0) rowTgt = Number(row.dailyBottles) || 1;
      }

      // Truncate house# to fit narrow column; name clipped by maxWidth in jsPDF
      const houseRaw = String(row.houseNo && row.houseNo !== '?' ? row.houseNo : '-');
      const nameRaw  = String(row.customerName || '');
      const house = houseRaw.slice(0, 5);   // 5 chars fits H# column at 6.8pt courier
      const name  = nameRaw;               // jsPDF maxWidth clips naturally
      const ph    = is80 ? String(row.phone || '').replace(/\s+/g, '').slice(0, 11) : '';
      const bal   = row.bottleBalance != null ? String(Math.round(Number(row.bottleBalance) || 0)) : '-';

      // FIXED: Align tick-box center vertically with text baseline for perfect alignment
      // Text sits at `y`, boxes should be vertically centered on that baseline
      const textBaselineY = y;
      const boxCenterOffset = boxH / 2;  // Center box on text baseline
      const rowTop = textBaselineY - boxCenterOffset;   // Calculate box top position

      // H# bold
      doc.setFont('courier', 'bold');
      doc.text(house, margin + col.h + 0.5, textBaselineY, { align: 'left' });
      doc.setFont('courier', 'normal');
      
      // Customer name — maxWidth prevents bleed into adjacent column
      const nameMaxW = is80 ? (col.ph - col.cu - 1.5) : (col.tg - col.cu - 1.5);
      doc.text(name, margin + col.cu + 0.5, textBaselineY, { align: 'left', maxWidth: nameMaxW });
      
      // Phone (small, grey) - strict boundary protection
      if (is80 && ph) {
        doc.setFontSize(5.2);
        doc.setTextColor(100, 100, 100);
        const phMaxW = col.tg - col.ph - 2;  // Extra margin to prevent overlap
        doc.text(ph, margin + col.ph + 0.5, textBaselineY, { align: 'left', maxWidth: phMaxW });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(fontSize);
      }
      
      // TGT bold - properly centered in column
      doc.setFont('courier', 'bold');
      const tgtX = is80 ? margin + col.tg + 2 : margin + col.tg + 1.5;
      doc.text(String(rowTgt), tgtX, textBaselineY, { align: 'left' });
      doc.setFont('courier', 'normal');
      
      // BAL - right-aligned within its designated column space
      const balX = is80 ? margin + col.bal + 5.5 : margin + col.bal + 4;
      doc.text(bal, balX, textBaselineY, { align: 'right' });

      // Draw tick boxes with proper borders (solid, not dashed to match thermal print)
      const drawBox = (cx) => {
        const bx = margin + cx;
        doc.setDrawColor(60, 60, 60);
        doc.setLineWidth(0.15);
        doc.setLineDashPattern([], 0);  // Solid lines for clarity
        doc.rect(bx, rowTop, boxW, boxH);
      };

      if (is80) {
        drawBox(col.del);
        drawBox(col.rec);
        drawBox(col.cash);
      } else {
        drawBox(col.del);
        drawBox(col.rec);
      }

      // Move to next row with proper spacing
      y += rowH;

      // FIXED: Light dotted row separator positioned further down for clean separation
      doc.setDrawColor(200);
      doc.setLineDashPattern([0.4, 0.8], 0);
      doc.line(margin, y - rowH + boxH + 1.2, pageW - margin, y - rowH + boxH + 1.2);
      doc.setLineDashPattern([], 0);
    }

    // Light separator before reconciliation
    rule('light', 'dashed');

    // ── End-of-shift reconciliation section ──────────────────────────────────────
    // Header with background-like effect (top border + spacing)
    y += 1.5;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 2, contentW, 6, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(is80 ? 7.5 : 7.0);
    write('END OF SHIFT RECONCILIATION', { size: is80 ? 7.5 : 7.0, bold: true, spacing: 2.5 });

    const reconItems = [
      'Total Loaded:',
      'Total Delivered:',
      'Empties Collected:',
      'Cash Collected:',
      'Shortage / Surplus:',
    ];

    doc.setFont('courier', 'normal');
    doc.setFontSize(is80 ? 6.8 : 6.5);
    const lblW = is80 ? 34 : 26;  // label width in mm (reduced for better spacing)
    const boxRW = contentW - lblW - 2; // write-in box width with margin

    for (const label of reconItems) {
      doc.setFont('courier', 'bold');
      doc.text(label, margin + 1, y);
      const bx = margin + lblW;
      const by = y - 3.8;
      // Draw write-in box with light background
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.2);
      doc.rect(bx, by, boxRW, 4.5, 'FD');
      y += is80 ? 5.8 : 5.5;
    }

    // Signature section with proper spacing
    y += 3.5;
    doc.setDrawColor(80);
    doc.setLineWidth(0.3);
    doc.line(margin + 6, y, pageW - margin - 6, y);
    y += 4.5;
    doc.setFont('courier', 'normal');
    doc.setFontSize(is80 ? 6.5 : 6.0);
    doc.setTextColor(100, 100, 100);
    write('Rider / Employee Signature', { size: is80 ? 6.5 : 6.0, bold: false, spacing: 0.5 });
    doc.setTextColor(0, 0, 0);
    y += 1.0;

    return { doc, finalY: y };
  };

  const probeDoc = new jsPDF({ unit: 'mm', format: [pageW, 400], orientation: 'portrait', compress: true });
  const { finalY } = renderOnDoc(probeDoc);
  const pageH = Math.min(Math.max(Math.ceil(finalY + margin + 4), 90), 700);

  let doc = existingDoc;
  if (!doc) {
    doc = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation: 'portrait', compress: true });
  } else {
    doc.addPage([pageW, pageH], 'portrait');
  }

  renderOnDoc(doc);

  const dateSlug = deliveryDate ? deliveryDate.replace(/[^\w-]+/g, '-') : 'today';
  return {
    doc,
    pageW,
    pageH,
    filename: `water-delivery-checklist-${paperSize}-${dateSlug}.pdf`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// THERMAL DELIVERY CHECKLIST  (58 mm / 80 mm roll)
//
//  Exact column layout from the confirmed screenshot:
//
//  80 mm: H# | CUSTOMER | PHONE | TGT | DEL☐ | REC☐ | CASH☐ | BAL
//  58 mm: H# | CUSTOMER | TGT | DEL☐ | REC☐ | BAL
//
//  Key design rules from the screenshot:
//  ▸ NO row-number (#) column — H# is always leftmost
//  ▸ H# bold, Customer normal — same cell width split
//  ▸ Dotted bottom border between rows (not background shading)
//  ▸ Tick boxes: 1px dashed border rectangles, white fill
//  ▸ BAL right-aligned, no colour
//  ▸ PHONE: small font, grey, overflow hidden — read-only reference
//  ▸ All column widths in mm so @page size maps exactly
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build HTML thermal delivery checklist matching the confirmed screenshot format.
 *
 * @param {{
 *   business: object,
 *   rows: Array<{
 *     customerName: string,
 *     houseNo?: string,
 *     phone?: string,
 *     bottleBalance?: number,
 *     qtyByProduct?: Record<string,number>,
 *     dailyBottles?: number,
 *   }>,
 *   products: Array<{ id: string }>,
 *   deliveryDate?: string,
 *   riderName?: string,
 *   paperSize?: '58mm' | '80mm',
 * }} args
 * @returns {string} Complete HTML document
 */
export function buildWaterDeliveryChecklistHtml({
  business,
  rows = [],
  products = [],
  deliveryDate = '',
  riderName = '',
  paperSize = '58mm',
}) {
  const bizName    = business?.business_name || business?.name || business?.businessName || 'Water Supply';
  const bizAddress = business?.address || '';
  const bizPhone   = business?.phone   || '';
  const dateLabel  = deliveryDate
    ? String(deliveryDate).slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const is80 = paperSize === '80mm';

  // ── Compute total target load ────────────────────────────────────────────
  let totalTgt = 0;
  rows.forEach((r) => {
    let t = r.displayTarget || r.calculatedTarget || 0;
    if (t === 0) {
      products.forEach((p) => { t += Number(r.qtyByProduct?.[String(p.id)]) || 0; });
      if (t === 0) t = Number(r.dailyBottles) || 0;
    }
    totalTgt += t;
  });

  // ── Pixel dimensions ─────────────────────────────────────────────────────
  // 58mm = 219px, 80mm = 302px at 96dpi screen rendering
  const PW_PX  = is80 ? 302 : 219;
  const PAD_PX = 8;
  // USE_PX kept for reference; table now uses width:100% inside padded body
  void (PW_PX - PAD_PX * 2);

  // ── Column widths (px) ───────────────────────────────────────────────────
  // Fixed columns (H#, TGT, tick-boxes, BAL) have explicit widths.
  // CUSTOMER (.cu) is width:auto / flex-remaining so it never overflows.
  // 58mm usable ≈ 203px: h(22) + tgt(15) + bx(20)*2 + bal(22) = 99px fixed
  //   → .cu gets ~104px remaining — plenty for 10-12 char names
  // 80mm usable ≈ 286px: h(22) + ph(38) + tgt(15) + bx(22)*3 + bal(22) = 163px
  //   → .cu gets ~123px remaining
  const C = is80
    ? { h: 22, ph: 38, tgt: 15, bx: 22, bal: 22 }
    : { h: 22,         tgt: 15, bx: 20, bal: 22 };

  // ── Row height is driven by the tick box ─────────────────────────────────
  const TICK_W = is80 ? 18 : 16;   // tick box inner width (px)
  const TICK_H = is80 ? 14 : 13;   // tick box height (px) — writable space
  const ROW_PAD = 2;                // cell padding top/bottom (px)
  const ROW_H = TICK_H + ROW_PAD * 2 + 1;  // 18px (58mm) / 19px (80mm)

  // Font sizes
  const F = {
    biz:  is80 ? 10.5 : 9.5,
    sub:  is80 ? 6.5  : 6,
    hdr:  is80 ? 6.5  : 6,
    cell: is80 ? 6.5  : 6,
    ph:   is80 ? 5.5  : 0,
    recon:is80 ? 6.5  : 6,
  };

  // ── Tick box: inline-block for clean vertical centering ──────────────────
  // solid border for strong thermal print visibility
  const BOX_DIV = `<span style="display:inline-block;width:${TICK_W}px;height:${TICK_H}px;border:1.5px solid #333;background:#fff;vertical-align:middle;"></span>`;

  const dataRows = rows.map((row) => {
    let tgt = row.displayTarget || row.calculatedTarget || 0;
    if (tgt === 0) {
      products.forEach((p) => { tgt += Number(row.qtyByProduct?.[String(p.id)]) || 0; });
      if (tgt === 0) tgt = Number(row.dailyBottles) || 1;
    }
    // House# kept to 5 chars in JS to fit the narrow fixed column;
    // customer name NOT sliced — CSS text-overflow:ellipsis handles it.
    const houseRaw = String(row.houseNo && row.houseNo !== '?' ? row.houseNo : '-');
    const nameRaw  = String(row.customerName || '');
    const house = esc(houseRaw.slice(0, 5));
    const name  = esc(nameRaw);
    // Phone: strip spaces, keep up to 11 chars (local mobile format)
    const ph    = is80 ? esc(String(row.phone || '').replace(/\s+/g, '').slice(0, 11)) : '';
    const bal   = row.bottleBalance != null ? String(Math.round(Number(row.bottleBalance) || 0)) : '-';

    if (is80) {
      return `<tr>
  <td class="h">${house}</td><td class="cu">${name}</td><td class="ph">${ph}</td>
  <td class="tg">${tgt}</td><td class="bx">${BOX_DIV}</td><td class="bx">${BOX_DIV}</td><td class="bx">${BOX_DIV}</td>
  <td class="bl">${esc(bal)}</td>
</tr>`;
    }
    return `<tr>
  <td class="h">${house}</td><td class="cu">${name}</td>
  <td class="tg">${tgt}</td><td class="bx">${BOX_DIV}</td><td class="bx">${BOX_DIV}</td>
  <td class="bl">${esc(bal)}</td>
</tr>`;
  });

  // ── Column header ────────────────────────────────────────────────────────
  const thead = is80
    ? `<tr><th class="h">H#</th><th class="cu tl">CUSTOMER</th><th class="ph tl">PHONE</th><th class="tg">TGT</th><th class="bx">DEL</th><th class="bx">REC</th><th class="bx">CASH</th><th class="bl">BAL</th></tr>`
    : `<tr><th class="h">H#</th><th class="cu tl">CUSTOMER</th><th class="tg">TGT</th><th class="bx">DEL</th><th class="bx">REC</th><th class="bl">BAL</th></tr>`;

  // ── CSS ──────────────────────────────────────────────────────────────────
  const css = `
@page { size: ${is80 ? '80mm' : '58mm'} auto; margin: 0; }
@media print {
  @page { size: ${is80 ? '80mm' : '58mm'} auto; margin: 0; }
  html, body { width: ${PW_PX}px !important; max-width: ${PW_PX}px !important; margin: 0 !important; padding: 0 !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .no-print { display: none !important; }
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: ${PW_PX}px;
  max-width: ${PW_PX}px;
  margin: 0 auto;
  background: #fff;
  overflow-x: hidden;
}
body {
  padding: ${PAD_PX}px ${PAD_PX}px ${PAD_PX + 2}px;
  font-family: 'Courier New', Courier, monospace;
  font-size: ${F.cell}px;
  color: #111;
  line-height: 1.35;
}

/* Business header — constrained to paper width */
.biz-name { 
  font-size: ${F.biz}px; 
  font-weight: 800; 
  text-align: center; 
  letter-spacing: 0.4px; 
  margin-bottom: 3px;
  color: #000;
  line-height: 1.15;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.biz-sub { 
  font-size: ${F.sub}px; 
  text-align: center; 
  color: #555; 
  margin-bottom: 2px;
  line-height: 1.2;
  font-weight: 400;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Document title */
.doc-title { 
  font-size: ${is80 ? 9 : 8}px; 
  font-weight: 800; 
  text-align: center; 
  text-transform: uppercase; 
  letter-spacing: 0.8px; 
  margin: 4px 0 3px;
  color: #000;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
}

/* Metadata lines — single definition, no duplicates */
.meta-line { 
  font-size: ${is80 ? 7.2 : 6.8}px; 
  text-align: center; 
  font-weight: 700; 
  margin-bottom: 2px;
  color: #000;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta-light { 
  font-weight: 400; 
  color: #333;
  font-size: ${is80 ? 6.8 : 6.5}px;
}

/* Separator rules — solid 1.5px for strong thermal visibility */
hr.solid { 
  border: none; 
  border-top: 1.5px solid #2a2a2a; 
  margin: 4px 0; 
}

/* Main table — fluid width fills the padded body exactly */
table.main {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-top: 3px;
  margin-bottom: 2px;
}

/* Header row — dark background, clear labels */
table.main thead th {
  background: #2a2a2a;
  color: #fff;
  font-size: ${F.hdr}px;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  padding: ${ROW_PAD + 1}px 1px;
  height: ${ROW_H + 3}px;
  border: none;
  white-space: nowrap;
  overflow: hidden;
  vertical-align: middle;
  letter-spacing: 0.3px;
  line-height: 1.1;
}
table.main thead th.tl { text-align: left; padding-left: 3px; }

/* Data cells — uniform height, dotted separators */
table.main tbody td {
  font-size: ${F.cell}px;
  padding: ${ROW_PAD}px 1px;
  border: none;
  border-bottom: 1px dotted #ccc;
  vertical-align: middle;
  overflow: hidden;
  white-space: nowrap;
  height: ${ROW_H}px;
  text-overflow: ellipsis;
}

/* Fixed-width columns */
.h  { width: ${C.h}px;  font-weight: 800; text-align: left;   padding-left: 2px !important; }
/* .cu has no explicit width — takes remaining space via table-layout:fixed auto */
.cu { font-weight: 400; text-align: left; padding-left: 2px !important; padding-right: 1px !important; overflow: hidden; text-overflow: ellipsis; }
.ph { width: ${is80 ? C.ph : 0}px; font-size: ${F.ph}px; color: #666; overflow: hidden; text-overflow: ellipsis; padding-right: 1px !important; ${!is80 ? 'display:none;' : ''} }
.tg { width: ${C.tgt}px; font-weight: 700; text-align: center; font-size: ${is80 ? 7 : 6.5}px; padding: 0 1px !important; }

/* Tick-box cells — fixed width, centered */
.bx {
  width: ${C.bx}px;
  text-align: center;
  padding: ${ROW_PAD}px 1px !important;
  vertical-align: middle;
  overflow: hidden;
}

/* BAL — fixed width, right-aligned */
.bl { width: ${C.bal}px; text-align: right; font-size: ${F.cell}px; font-weight: 600; padding-right: 2px !important; }

/* Reconciliation section */
.recon { 
  margin-top: 8px; 
  padding-top: 4px;
  border-top: 1.5px solid #bbb;
}
.recon-hdr { 
  font-weight: 800; 
  text-align: center; 
  font-size: ${F.recon}px; 
  padding: 3px 0 4px;
  margin-bottom: 3px; 
  text-transform: uppercase; 
  letter-spacing: 0.5px;
  color: #000;
  background: #f0f0f0;
  border-radius: 2px;
}
table.recon-t { 
  width: 100%; 
  border-collapse: collapse;
  margin-top: 2px;
}
table.recon-t td { 
  font-size: ${F.recon}px; 
  padding: 3px 1px; 
  border: none; 
  line-height: 1.3;
}
td.rl { 
  font-weight: 600; 
  width: ${is80 ? '52%' : '55%'}; 
  white-space: nowrap;
  color: #000;
  padding-left: 2px;
}
td.rv { 
  border-bottom: 1.5px solid #333; 
  width: ${is80 ? '48%' : '45%'};
  height: ${is80 ? '17px' : '15px'};
  background: #fafafa;
}

/* Signature section */
.sig-wrap { 
  margin-top: 10px; 
  padding-top: 4px;
  text-align: center; 
  font-size: ${F.sub}px; 
  color: #555;
}
.sig-line { 
  border-bottom: 1.5px solid #333; 
  width: ${is80 ? 150 : 110}px; 
  height: ${is80 ? 22 : 18}px; 
  margin: 0 auto 4px;
  background: #f9f9f9;
}
.sig-label {
  font-size: ${is80 ? 6.5 : 6}px;
  color: #555;
  font-weight: 500;
  margin-top: 2px;
}
`;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Delivery Checklist ${esc(dateLabel)}</title>
<style>${css}</style>
</head><body>

<div class="biz-name">${esc(bizName)}</div>
${bizAddress ? `<div class="biz-sub">${esc(bizAddress)}</div>` : ''}
${bizPhone   ? `<div class="biz-sub">${esc(bizPhone)}</div>`   : ''}
<hr class="solid"/>

<div class="doc-title">Route Delivery Checklist</div>

<div class="meta-line">${riderName ? `Date: ${esc(dateLabel)} &nbsp;|&nbsp; Rider: ${esc(riderName)}` : `Date: ${esc(dateLabel)}`}</div>
<div class="meta-line meta-light">Stops: ${rows.length} &nbsp;|&nbsp; Target Load: ${totalTgt} Pcs</div>

<hr class="solid"/>

<table class="main">
  <thead>${thead}</thead>
  <tbody>${dataRows.join('\n')}</tbody>
</table>

<div class="recon">
  <div class="recon-hdr">End of Shift Reconciliation</div>
  <table class="recon-t">
    <tr><td class="rl">Total Loaded:</td><td class="rv"></td></tr>
    <tr><td class="rl">Total Delivered:</td><td class="rv"></td></tr>
    <tr><td class="rl">Empties Collected:</td><td class="rv"></td></tr>
    <tr><td class="rl">Cash Collected:</td><td class="rv"></td></tr>
    <tr><td class="rl">Shortage / Surplus:</td><td class="rv"></td></tr>
  </table>
</div>

<div class="sig-wrap">
  <div class="sig-line"></div>
  <div class="sig-label">Rider / Employee Signature</div>
</div>

</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// A4 AREA LIST  (full-page register format, grouped by route/area)
//
//  Matches the Pakistan water plant paper register:
//  Header: Company · UAN · Date  |  Emp Name · Area
//  Columns: # | Acct No | Address / Customer | Phone | TGT | DEL☐ | REC☐ | CASH☐ | BAL
//  Rows grouped by area/route with a shaded area sub-header.
//  Footer: end-of-day totals write-in box + signature line.
//
//  Print via window.print() → browser "Save as PDF" for PDF export.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a full-page A4 Area List matching the plant paper register format.
 * Intelligent, customizable with smart target calculation and flexible grouping.
 *
 * @param {{
 *   business: object,
 *   rows: Array<{ customerName:string, houseNo?:string, phone?:string, routeLabel?:string, deliveryArea?:string, townCode?:string, accountNo?:string, bottleBalance?:number, qtyByProduct?:object, dailyBottles?:number, displayTarget?:number, calculatedTarget?:number }>,
 *   products: Array<{ id:string }>,
 *   deliveryDate?: string,
 *   riderName?: string,
 *   paperSize?: 'A4'|'A5',
 *   config?: object,
 * }} args
 * @returns {string}
 */
export async function buildWaterAreaListHtml({
  business,
  rows = [],
  products = [],
  deliveryDate = '',
  riderName = '',
  paperSize = 'A4',
  config = null,
}) {
  const { buildChecklistPayload, readChecklistConfig } = await import('@/lib/storefront/waterChecklistConfig');
  
  const bizName    = business?.business_name || business?.name || business?.businessName || 'Water Supply';
  const bizPhone   = business?.phone   || business?.uan || '';
  const bizAddress = business?.address || '';
  const dateLabel  = deliveryDate
    ? String(deliveryDate).slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const isA5 = String(paperSize).toUpperCase() === 'A5';
  const pgSize = isA5 ? 'A5' : 'A4';

  // Build intelligent checklist payload with smart targets
  const checklistConfig = config || readChecklistConfig(business.settings || {});
  const payload = buildChecklistPayload({
    rows,
    products,
    business,
    deliveryDate,
    riderName,
    config: checklistConfig,
  });

  const enrichedRows = payload.enrichedRows;
  const groups = payload.groups;
  const grandTgt = payload.totals.targetBottles;

  // ── Build table body HTML with smart targets ─────────────────────────────
  let bodyHtml = '';
  let sNo = 0;
  for (const group of groups) {
    const area = group.name;
    const aRows = group.rows;
    
    // Area header row
    bodyHtml += `<tr class="area-hdr">
  <td colspan="9" class="area-cell">&#9654;&nbsp;${esc(area)}</td>
</tr>`;

    let areaTgt = 0;
    aRows.forEach((row, idx) => {
      sNo++;
      // Use smart calculated target
      const tgt = row.displayTarget || row.calculatedTarget || 1;
      areaTgt += tgt;

      const house   = String(row.houseNo && row.houseNo !== '?' ? row.houseNo : '').trim();
      const custNm  = String(row.customerName || '').trim();
      const addr    = house ? (custNm ? `${house} \u2014 ${custNm}` : house) : custNm;
      const phone   = String(row.phone || '').trim();
      const acctNo  = String(row.accountNo || row.customerCode || '').trim();
      const bal     = row.bottleBalance != null ? String(Number(row.bottleBalance) || 0) : '\u2014';
      const shade   = idx % 2 === 1 ? ' class="shade"' : '';

      bodyHtml += `<tr${shade}>
  <td class="c num">${sNo}</td>
  <td class="acct">${esc(acctNo)}</td>
  <td class="addr">${esc(addr)}</td>
  <td class="phone">${esc(phone)}</td>
  <td class="c tgt">${tgt}</td>
  <td class="tick"><div class="tick-box"></div></td>
  <td class="tick"><div class="tick-box"></div></td>
  <td class="tick"><div class="tick-box"></div></td>
  <td class="c bal">${esc(bal)}</td>
</tr>`;
    });

    // Area subtotal row
    bodyHtml += `<tr class="area-sub">
  <td colspan="4" class="sub-lbl">&#8627;&nbsp;Sub-total &mdash; ${esc(area)} (${aRows.length} stops)</td>
  <td class="c tgt">${areaTgt}</td>
  <td class="tick-sum"></td>
  <td class="tick-sum"></td>
  <td class="tick-sum"></td>
  <td></td>
</tr>`;
  }

  // Grand total row
  bodyHtml += `<tr class="grand-total">
  <td colspan="4" class="c gt-lbl">GRAND TOTAL &mdash; ${enrichedRows.length} stops</td>
  <td class="c gt-val">${grandTgt}</td>
  <td class="tick-sum"></td>
  <td class="tick-sum"></td>
  <td class="tick-sum"></td>
  <td></td>
</tr>`;

  // ── Styles ────────────────────────────────────────────────────────────────
  const fs     = isA5 ? '7.5px' : '9px';
  const fsS    = isA5 ? '7px'   : '8px';
  const fsT    = isA5 ? '6.5px' : '7.5px';
  const bizFs  = isA5 ? '11px'  : '14px';
  const titleFs= isA5 ? '9px'   : '11px';
  const rowPad = isA5 ? '1mm'   : '1.3mm';

  const styles = `
@page { size: ${pgSize} portrait; margin: ${isA5 ? '8mm' : '12mm'} ${isA5 ? '6mm' : '10mm'}; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { 
  font-family: 'Arial', 'Helvetica', sans-serif; 
  font-size: ${fs}; 
  color: #1a1a1a; 
  background: #fff; 
  line-height: 1.2;
}
.page-wrap { width: 100%; max-width: 100%; }

/* ── Page header ── */
.doc-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  border-bottom: 2.5px solid #000; padding-bottom: 2.5mm; margin-bottom: 3mm;
}
.hdr-left { flex: 1; }
.hdr-right { text-align: right; padding-top: 1mm; }
.biz-name { 
  font-size: ${bizFs}; 
  font-weight: 700; 
  text-transform: uppercase; 
  letter-spacing: 0.02em; 
  color: #000;
  margin-bottom: 1mm;
}
.biz-sub { 
  font-size: ${fsS}; 
  color: #444; 
  margin-top: 0.5mm; 
  line-height: 1.3;
}
.doc-title {
  font-size: ${titleFs}; 
  font-weight: 700; 
  text-align: center; 
  text-transform: uppercase;
  letter-spacing: 0.1em; 
  padding: 1.5mm 0; 
  margin-bottom: 2.5mm;
  border-top: 2px solid #000; 
  border-bottom: 2px solid #000;
  background: #f8f9fa;
}
.meta-bar {
  display: flex; 
  flex-wrap: wrap; 
  gap: ${isA5 ? '6mm' : '10mm'}; 
  font-size: ${fsS}; 
  margin-bottom: 2.5mm;
  padding: 1mm 0;
}
.mf { display: flex; gap: 2mm; align-items: baseline; }
.ml { font-weight: 700; white-space: nowrap; color: #000; }
.mv { 
  border-bottom: 1.5px solid #555; 
  min-width: ${isA5 ? '22mm' : '30mm'}; 
  padding-bottom: 0.4mm; 
  color: #000;
}

/* ── Table ── */
table { 
  width: 100%; 
  border-collapse: collapse; 
  font-size: ${fs}; 
  table-layout: fixed;
}
thead th {
  background: #1a1a1a; 
  color: #fff; 
  font-weight: 700; 
  text-transform: uppercase;
  padding: ${isA5 ? '1.4mm' : '2mm'} ${isA5 ? '1mm' : '1.5mm'}; 
  text-align: center; 
  border: 1px solid #000;
  font-size: ${fsT}; 
  letter-spacing: 0.06em;
  vertical-align: middle;
}
thead th.tl { text-align: left; padding-left: 2mm; }

tbody td { 
  border: 0.8px solid #d0d0d0; 
  padding: ${rowPad} ${isA5 ? '0.8mm' : '1.2mm'}; 
  vertical-align: middle; 
  font-size: ${fs};
}

/* Zebra striping for readability */
tbody tr:not(.area-hdr):not(.area-sub):not(.grand-total):nth-child(odd) td { 
  background: #fff; 
}
tbody tr:not(.area-hdr):not(.area-sub):not(.grand-total):nth-child(even) td { 
  background: #f7f9fb; 
}

/* ── Area header row ── */
.area-hdr td.area-cell {
  background: linear-gradient(135deg, #d4e8f7 0%, #c2ddf3 100%);
  color: #00478f; 
  font-weight: 700;
  font-size: ${isA5 ? '7.5px' : '8.5px'}; 
  padding: ${isA5 ? '1.2mm' : '1.8mm'} 2.5mm;
  border-top: 2px solid #5a9ed4; 
  border-bottom: 2px solid #5a9ed4;
  border-left: 0.8px solid #d0d0d0;
  border-right: 0.8px solid #d0d0d0;
  text-transform: uppercase; 
  letter-spacing: 0.06em;
}

/* ── Area sub-total row ── */
.area-sub td {
  background: #e8f3fc; 
  font-weight: 700; 
  font-size: ${fsT};
  border-top: 1.5px solid #7db5e0;
  border-bottom: 1.5px solid #7db5e0;
  padding: ${isA5 ? '1mm' : '1.4mm'} ${isA5 ? '1mm' : '1.5mm'};
}
.area-sub .sub-lbl { 
  text-align: left; 
  color: #444; 
  padding-left: 3mm; 
  font-style: italic;
}

/* ── Grand total row ── */
.grand-total td { 
  background: #1a1a1a; 
  color: #fff; 
  font-size: ${fsS}; 
  font-weight: 700; 
  padding: ${isA5 ? '1.5mm' : '2mm'} ${isA5 ? '1mm' : '1.5mm'}; 
  border: 1px solid #000; 
}
.grand-total .gt-lbl { 
  text-align: right; 
  padding-right: 3mm; 
  letter-spacing: 0.05em;
}
.grand-total .gt-val { 
  font-size: ${isA5 ? '9px' : '10px'}; 
  font-weight: 800;
}

/* ── Column widths ── */
.c { text-align: center; }
.num   { width: ${isA5 ? '6mm' : '8mm'};  font-size: ${fsT}; color: #666; font-weight: 400; }
.acct  { width: ${isA5 ? '18mm' : '22mm'}; font-size: ${fsT}; color: #333; font-weight: 600; }
.addr  { 
  /* flex remaining space */ 
  text-align: left;
  padding-left: 2mm !important;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.phone { 
  width: ${isA5 ? '24mm' : '30mm'}; 
  font-size: ${fsT}; 
  color: #555; 
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tgt   { 
  width: ${isA5 ? '9mm' : '12mm'}; 
  font-weight: 800; 
  font-size: ${isA5 ? '9px' : '10.5px'}; 
  color: #000;
}

/* ── Tick boxes — high contrast, writable ── */
.tick {
  width: ${isA5 ? '14mm' : '16mm'};
  text-align: center;
  padding: ${isA5 ? '1mm' : '1.5mm'} 0;
  vertical-align: middle;
  border: 0.8px solid #d0d0d0 !important;
  background: #fff;
}
.tick-box {
  display: inline-block;
  width: ${isA5 ? '10mm' : '12mm'};
  height: ${isA5 ? '5mm' : '6mm'};
  border: 1.5px solid #555;
  background: #fff;
  vertical-align: middle;
}
.tick-sum {
  width: ${isA5 ? '14mm' : '16mm'};
  text-align: center;
  padding: ${isA5 ? '1mm' : '1.2mm'} 0;
  border: 0.8px solid #d0d0d0 !important;
  background: #f0f6fc;
  vertical-align: middle;
}
.bal { 
  width: ${isA5 ? '10mm' : '12mm'}; 
  text-align: center; 
  font-weight: 700; 
  color: #000; 
  font-size: ${fs};
}

/* ── Footer ── */
.doc-footer {
  margin-top: ${isA5 ? '5mm' : '8mm'}; 
  display: flex; 
  justify-content: space-between; 
  align-items: flex-end;
  gap: 6mm;
  page-break-inside: avoid;
}
.totals-box {
  font-size: ${fsS}; 
  border: 1.5px solid #999; 
  padding: ${isA5 ? '2mm' : '3mm'} ${isA5 ? '2.5mm' : '4mm'};
  min-width: ${isA5 ? '60mm' : '80mm'};
  background: #fafbfc;
  border-radius: 1mm;
}
.totals-box .t-row { 
  display: flex; 
  justify-content: space-between; 
  gap: ${isA5 ? '3mm' : '5mm'}; 
  padding: ${isA5 ? '0.8mm' : '1mm'} 0; 
  border-bottom: 0.8px dotted #ccc; 
}
.totals-box .t-row:last-child { border-bottom: none; font-weight: 700; }
.totals-box .tl { font-weight: 600; color: #000; }
.totals-box .tv { 
  border-bottom: 1.5px solid #555; 
  min-width: ${isA5 ? '20mm' : '28mm'}; 
  text-align: center; 
  padding-bottom: 0.5mm;
}
.sig-block { 
  text-align: center; 
  min-width: ${isA5 ? '45mm' : '60mm'}; 
}
.sig-line { 
  border-bottom: 1.5px solid #333; 
  width: ${isA5 ? '45mm' : '60mm'}; 
  height: ${isA5 ? '9mm' : '12mm'}; 
  margin: 0 auto ${isA5 ? '1.5mm' : '2mm'}; 
}
.sig-label { 
  font-size: ${fsT}; 
  color: #555; 
  font-weight: 600;
}
.legend { 
  font-size: ${isA5 ? '5.5px' : '6px'}; 
  color: #888; 
  margin-top: ${isA5 ? '2mm' : '3mm'}; 
  text-align: center;
  font-style: italic;
}

/* ── Print optimization ── */
@media print {
  @page { size: ${pgSize} portrait; margin: ${isA5 ? '8mm' : '12mm'} ${isA5 ? '6mm' : '10mm'}; }
  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .page-wrap { page-break-after: auto; }
  table { page-break-inside: auto; }
  thead { display: table-header-group; }
  tbody tr { page-break-inside: avoid; page-break-after: auto; }
  .doc-footer { page-break-inside: avoid; }
}
`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>Area Delivery List &mdash; ${esc(dateLabel)}</title>
<style>${styles}</style>
</head><body>
<div class="page-wrap">

<div class="doc-header">
  <div class="hdr-left">
    <div class="biz-name">${esc(bizName)}</div>
    ${bizAddress ? `<div class="biz-sub">${esc(bizAddress)}</div>` : ''}
    ${bizPhone   ? `<div class="biz-sub">UAN / Phone: ${esc(bizPhone)}</div>` : ''}
  </div>
  <div class="hdr-right">
    <div class="biz-sub" style="font-weight:800;font-size:${isA5 ? '8px' : '10px'}">AREA DELIVERY LIST</div>
    <div class="biz-sub">Date: ${esc(dateLabel)}</div>
  </div>
</div>

<div class="doc-title">Route Delivery Area List</div>

<div class="meta-bar">
  <div class="mf"><span class="ml">Emp Name:</span><span class="mv">${esc(riderName)}</span></div>
  <div class="mf"><span class="ml">Date:</span><span class="mv">${esc(dateLabel)}</span></div>
  <div class="mf"><span class="ml">Stops:</span><span class="mv">${enrichedRows.length}</span></div>
  <div class="mf"><span class="ml">Target Load:</span><span class="mv">${grandTgt} Pcs</span></div>
  <div class="mf"><span class="ml">Routes:</span><span class="mv">${groups.length}</span></div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:7mm">#</th>
      <th class="tl" style="width:20mm">Acct No</th>
      <th class="tl">Address / Customer</th>
      <th class="tl" style="width:28mm">Phone</th>
      <th style="width:10mm">TGT</th>
      <th style="width:16mm">DEL</th>
      <th style="width:16mm">REC</th>
      <th style="width:16mm">CASH</th>
      <th style="width:11mm">BAL</th>
    </tr>
  </thead>
  <tbody>
${bodyHtml}
  </tbody>
</table>

<div class="doc-footer">
  <div class="totals-box">
    <div class="t-row"><span class="tl">Total Loaded:</span><span class="tv"></span></div>
    <div class="t-row"><span class="tl">Total Delivered:</span><span class="tv"></span></div>
    <div class="t-row"><span class="tl">Empties Collected:</span><span class="tv"></span></div>
    <div class="t-row"><span class="tl">Cash Collected:</span><span class="tv"></span></div>
    <div class="t-row"><span class="tl">Shortage / Surplus:</span><span class="tv"></span></div>
  </div>
  <div class="sig-block">
    <div class="sig-line"></div>
    <div class="sig-label">Rider / Employee Signature</div>
  </div>
</div>

<div class="legend">
  TGT&nbsp;=&nbsp;Target bottles &nbsp;&bull;&nbsp;
  DEL&nbsp;=&nbsp;Delivered &nbsp;&bull;&nbsp;
  REC&nbsp;=&nbsp;Empties returned &nbsp;&bull;&nbsp;
  CASH&nbsp;=&nbsp;Cash collected &nbsp;&bull;&nbsp;
  BAL&nbsp;=&nbsp;Bottles outstanding at customer
</div>

</div>
</body></html>`;
}

/**
 * Print or download the full-page (A4) Area List register.
 * @param {Parameters<typeof buildWaterAreaListHtml>[0]} args
 * @param {'print'|'pdf'} [mode]
 */
/**
 * Print or download the full-page (A4/A5) Area List register.
 *
 * Opens an A4-formatted page in a new window and triggers window.print().
 * The browser print dialog lets the rider save directly as PDF — no jsPDF
 * needed for A4 since the HTML/@page CSS already controls page size/margins.
 *
 * @param {Parameters<typeof buildWaterAreaListHtml>[0]} args
 * @param {'print'|'pdf'} [mode]  Both modes open the print dialog; 'pdf' just delays slightly longer.
 */
export async function printWaterAreaList(args, mode = 'print') {
  const html = await buildWaterAreaListHtml(args);
  // Use a Blob URL so the new window isn't blocked by pop-up blockers
  // (same origin blob URLs are treated as user-navigated, not pop-ups).
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (!win) {
      // Fallback: write directly (may be blocked in some browsers)
      const w2 = window.open('', '_blank', 'width=900,height=700');
      if (!w2) return false;
      w2.document.open();
      w2.document.write(html);
      w2.document.close();
      setTimeout(() => { try { w2.focus(); w2.print(); } catch { /* noop */ } }, 500);
      return true;
    }
    // Revoke after print is triggered
    setTimeout(() => {
      try { win.focus(); win.print(); } catch { /* noop */ }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, mode === 'pdf' ? 300 : 500);
    return true;
  } catch (err) {
    console.warn('[waterAreaList] blob open failed, fallback to write', err);
    const win = typeof window !== 'undefined' ? window.open('', '_blank', 'width=900,height=700') : null;
    if (!win) return false;
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => { try { win.focus(); win.print(); } catch { /* noop */ } }, 500);
    return true;
  }
}

/**
 * Print or download physical delivery checklist for riders (vector PDF MediaBox + HTML fallback).
 * @param {Parameters<typeof buildWaterDeliveryChecklistHtml>[0]} args
 * @param {'print'|'pdf'} [mode]
 */
export async function printWaterDeliveryChecklist(args, mode = 'print') {
  if (mode === 'pdf') {
    try {
      const { doc, filename } = await createWaterDeliveryChecklistPdf(args);
      doc.save(filename);
      return true;
    } catch (err) {
      console.error('printWaterDeliveryChecklist pdf error', err);
      return printThermalReceiptHtml(buildWaterDeliveryChecklistHtml(args), { delayMs: 600 });
    }
  }

  try {
    const { doc, pageW, pageH } = await createWaterDeliveryChecklistPdf(args);
    const ok = await printJsPdfDocument(doc, {
      delayMs: 450,
      pageW,
      pageH,
      title: `Water Delivery Checklist ${pageW}x${pageH}mm`,
    });
    if (ok) return true;
  } catch (err) {
    console.warn('[waterHisab] delivery checklist PDF print failed, fallback to HTML', err);
  }

  return printThermalReceiptHtml(buildWaterDeliveryChecklistHtml(args), { delayMs: 500 });
}

export {
  formatWaterHisabDayHeaderLine,
  formatMilkHisabDayLine as formatWaterHisabDayLine,
  buildWaterAreaListHtml,
  printWaterAreaList,
  buildWaterDeliveryChecklistHtml,
  printWaterDeliveryChecklist,
};
