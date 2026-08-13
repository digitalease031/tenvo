/**
 * BOQ Estimate PDF Generator
 * Generates a professional Bill of Quantities estimate PDF in HTML
 * following Pakistan MRS/CSR format standards.
 */

import { resolveInvoiceBrandColor } from '@/lib/pdf/invoiceFormat';

function fmtPKR(n) {
  if (!n && n !== 0) return '0';
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Build BOQ Estimate HTML for printing or PDF export.
 * @param {{
 *   boqItems: Array<{
 *     item_no: string; description: string; unit: string;
 *     estimated_qty: number; estimated_rate: number;
 *     actual_qty?: number; actual_rate?: number;
 *     schedule_code?: string; specification_grade?: string;
 *     work_phase?: string; location_station?: string;
 *   }>;
 *   project: { name: string; code: string; client_name: string; contract_value: number; contractor_category: string; commencement_date?: string; completion_date?: string; };
 *   business: { name: string; address?: string; phone?: string; ntn?: string; logo_url?: string; settings?: Record<string, unknown>; };
 *   overheadProfile?: string;
 *   preparedBy?: string;
 * }} params
 */
export function buildBOQEstimateHtml({ boqItems = [], project, business, overheadProfile = 'PPRA Competitive Bid', preparedBy }) {
  const brandColor = resolveInvoiceBrandColor(business?.settings) || '#1e40af';

  const lines = boqItems.map((item, idx) => {
    const estTotal = Number(item.estimated_qty) * Number(item.estimated_rate);
    const actQty = Number(item.actual_qty || 0);
    const actRate = Number(item.actual_rate || item.estimated_rate);
    const actTotal = actQty * actRate;
    const variance = actTotal - estTotal;
    const variancePct = estTotal > 0 ? ((variance / estTotal) * 100).toFixed(1) : '0.0';
    return { ...item, idx: idx + 1, estTotal, actTotal, variance, variancePct };
  });

  const grandEstimated = lines.reduce((s, l) => s + l.estTotal, 0);
  const grandActual    = lines.reduce((s, l) => s + l.actTotal, 0);
  const grandVariance  = grandActual - grandEstimated;
  const overallPct     = grandEstimated > 0 ? ((grandVariance / grandEstimated) * 100).toFixed(1) : '0.0';

  const hasActuals = lines.some(l => Number(l.actual_qty) > 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>BOQ — ${project.code}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:9pt; color:#1a1a1a; background:#fff; padding:16mm 14mm; }
  .brand { color:${brandColor}; }
  .page-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid ${brandColor}; padding-bottom:10px; margin-bottom:14px; }
  .biz-name { font-size:15pt; font-weight:700; }
  .biz-meta { font-size:8pt; color:#555; margin-top:3px; }
  .doc-block { text-align:right; }
  .doc-title { font-size:13pt; font-weight:700; letter-spacing:0.5px; }
  .doc-sub { font-size:8.5pt; color:#555; margin-top:2px; }

  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; margin-bottom:14px; }
  .info-cell { padding:7px 11px; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0; }
  .info-cell:nth-child(2n) { border-right:none; }
  .info-label { font-size:7pt; text-transform:uppercase; letter-spacing:0.3px; color:#888; font-weight:600; }
  .info-value { font-size:9pt; font-weight:600; color:#1a1a1a; margin-top:1px; }

  .section-title { font-size:8.5pt; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:${brandColor}; border-bottom:1.5px solid ${brandColor}33; padding-bottom:4px; margin:12px 0 8px 0; }

  table { width:100%; border-collapse:collapse; font-size:8pt; }
  th { background:${brandColor}12; border:1px solid #e2e8f0; padding:6px 8px; text-align:left; font-size:7.5pt; font-weight:700; text-transform:uppercase; letter-spacing:0.2px; color:${brandColor}; }
  td { border:1px solid #e2e8f0; padding:6px 8px; vertical-align:top; }
  tr:nth-child(even) td { background:#f8fafc; }
  .text-right { text-align:right; }
  .text-center { text-align:center; }
  .mono { font-family:monospace; font-size:8pt; }
  .over { color:#dc2626; font-weight:600; }
  .under { color:#16a34a; font-weight:600; }

  .grand-row td { font-weight:700; font-size:10pt; background:${brandColor}15 !important; color:${brandColor}; }
  .subtotal-row td { font-weight:700; background:#f1f5f9 !important; }

  .summary-strip { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:14px 0; }
  .s-cell { border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px; background:#f8fafc; text-align:center; }
  .s-label { font-size:7pt; text-transform:uppercase; color:#888; font-weight:600; }
  .s-value { font-size:11pt; font-weight:700; color:#1a1a1a; margin-top:2px; }

  .footer-strip { margin-top:20px; border-top:1px solid #e2e8f0; padding-top:8px; font-size:7pt; color:#aaa; text-align:center; }
  @media print { body { padding:10mm; } }
</style>
</head>
<body>

<div class="page-header">
  <div>
    ${business.logo_url ? `<img src="${business.logo_url}" style="max-height:44px;margin-bottom:5px;" alt="Logo"/>` : ''}
    <div class="biz-name">${business.name}</div>
    <div class="biz-meta">${[business.address, business.phone, business.ntn ? 'NTN: ' + business.ntn : ''].filter(Boolean).join(' | ')}</div>
  </div>
  <div class="doc-block">
    <div class="doc-title brand">BILL OF QUANTITIES</div>
    <div class="doc-sub">Project: ${project.name}</div>
    <div class="doc-sub">Code: ${project.code} | Client: ${project.client_name}</div>
    <div class="doc-sub">Date: ${fmtDate(null)} | Prepared by: ${preparedBy || business.name}</div>
  </div>
</div>

<div class="info-grid">
  <div class="info-cell"><div class="info-label">Contract Value</div><div class="info-value">PKR ${fmtPKR(project.contract_value)}</div></div>
  <div class="info-cell"><div class="info-label">PEC Category</div><div class="info-value">${project.contractor_category}</div></div>
  <div class="info-cell"><div class="info-label">Commencement</div><div class="info-value">${fmtDate(project.commencement_date)}</div></div>
  <div class="info-cell"><div class="info-label">Completion</div><div class="info-value">${fmtDate(project.completion_date)}</div></div>
  <div class="info-cell"><div class="info-label">Overhead Profile</div><div class="info-value">${overheadProfile}</div></div>
  <div class="info-cell"><div class="info-label">Total BOQ Items</div><div class="info-value">${lines.length} line items</div></div>
</div>

<div class="summary-strip">
  <div class="s-cell"><div class="s-label">Total Estimated</div><div class="s-value">PKR ${(grandEstimated / 1_000_000).toFixed(2)}M</div></div>
  ${hasActuals ? `<div class="s-cell"><div class="s-label">Actual to Date</div><div class="s-value">PKR ${(grandActual / 1_000_000).toFixed(2)}M</div></div>` : `<div class="s-cell"><div class="s-label">BOQ Items</div><div class="s-value">${lines.length} items</div></div>`}
  <div class="s-cell"><div class="s-label">${hasActuals ? 'Overall Variance' : 'Contract Value'}</div>
    <div class="s-value ${hasActuals && grandVariance > 0 ? 'over' : hasActuals && grandVariance < 0 ? 'under' : ''}">${hasActuals ? overallPct + '%' : 'PKR ' + (Number(project.contract_value) / 1_000_000).toFixed(2) + 'M'}</div>
  </div>
</div>

<div class="section-title">Bill of Quantities — Detailed Schedule</div>
<table>
  <thead>
    <tr>
      <th style="width:5%">No.</th>
      <th style="width:28%">Description</th>
      <th style="width:6%">Unit</th>
      <th class="text-right" style="width:9%">Est. Qty</th>
      <th class="text-right" style="width:10%">Unit Rate (PKR)</th>
      <th class="text-right" style="width:12%">Estimated Total (PKR)</th>
      ${hasActuals ? `<th class="text-right" style="width:9%">Act. Qty</th><th class="text-right" style="width:11%">Act. Total (PKR)</th><th class="text-right" style="width:10%">Variance %</th>` : ''}
      <th style="width:10%">SOR Code</th>
    </tr>
  </thead>
  <tbody>
    ${lines.map(line => `
    <tr>
      <td class="mono text-center">${line.item_no}</td>
      <td>
        <span style="font-weight:600">${line.description}</span>
        ${line.specification_grade ? `<br/><span style="font-size:7pt;color:#888">${line.specification_grade}</span>` : ''}
        ${line.location_station ? `<br/><span style="font-size:7pt;color:#aaa">${line.location_station}</span>` : ''}
      </td>
      <td class="text-center">${line.unit}</td>
      <td class="text-right">${Number(line.estimated_qty).toLocaleString()}</td>
      <td class="text-right">${fmtPKR(line.estimated_rate)}</td>
      <td class="text-right" style="font-weight:600">${fmtPKR(line.estTotal)}</td>
      ${hasActuals ? `
        <td class="text-right">${Number(line.actual_qty) > 0 ? Number(line.actual_qty).toLocaleString() : '—'}</td>
        <td class="text-right">${Number(line.actual_qty) > 0 ? fmtPKR(line.actTotal) : '—'}</td>
        <td class="text-right ${parseFloat(line.variancePct) > 5 ? 'over' : parseFloat(line.variancePct) < -5 ? 'under' : ''}">${Number(line.actual_qty) > 0 ? line.variancePct + '%' : '—'}</td>
      ` : ''}
      <td class="mono" style="font-size:7pt;color:#999">${line.schedule_code || '—'}</td>
    </tr>`).join('')}
    <tr class="grand-row">
      <td colspan="5" class="text-right">GRAND TOTAL (Estimated)</td>
      <td class="text-right">PKR ${fmtPKR(grandEstimated)}</td>
      ${hasActuals ? `<td></td><td class="text-right">PKR ${fmtPKR(grandActual)}</td><td class="text-right ${parseFloat(overallPct) > 0 ? 'over' : parseFloat(overallPct) < 0 ? 'under' : ''}">${overallPct}%</td>` : ''}
      <td></td>
    </tr>
  </tbody>
</table>

<div class="footer-strip">
  Generated by ${business.name} | BOQ — ${project.code} | ${fmtDate(null)} | All rates in PKR — inclusive of taxes unless stated otherwise.
</div>
</body>
</html>`;
}

/**
 * Open BOQ PDF in a new tab and trigger print.
 */
export function printBOQEstimate(params) {
  const html = buildBOQEstimateHtml(params);
  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}
