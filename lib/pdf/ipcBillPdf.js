/**
 * IPC Running Bill PDF Generator
 * Generates a professional Interim Payment Certificate in table-based HTML
 * suitable for window.print() or html2pdf — 80mm / A4 format.
 *
 * Layout mirrors FIDIC / PEC standard IPC formats used in Pakistan.
 */

import { resolveInvoiceBrandColor } from '@/lib/pdf/invoiceFormat';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPKR(n) {
  if (!n && n !== 0) return 'PKR 0';
  const v = Number(n);
  return `PKR ${v.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
}

const IPC_STATUS_LABELS = {
  SUBMITTED: 'Submitted — Pending Verification',
  VERIFIED: 'Verified — Pending Approval',
  APPROVED: 'Approved — Awaiting Disbursement',
  DISBURSED: 'Disbursed',
  REJECTED: 'Rejected',
};

// ── Main PDF Builder ──────────────────────────────────────────────────────────

/**
 * Build the full IPC Running Bill HTML for printing / PDF export.
 *
 * @param {{
 *   ipc: {
 *     ipc_number: number;
 *     ipc_code: string;
 *     period_starting?: string;
 *     period_ending: string;
 *     gross_certified_amount: number;
 *     this_ipc_gross: number;
 *     escalation_amount?: number;
 *     secured_advance?: number;
 *     retention_deduction: number;
 *     mobilization_recovery: number;
 *     net_before_tax: number;
 *     wht_rate: number;
 *     wht_deduction: number;
 *     provincial_tax_rate?: number;
 *     provincial_tax_label?: string;
 *     provincial_tax_deduction?: number;
 *     net_payable: number;
 *     status: string;
 *     engineer_remarks?: string;
 *     contractor_remarks?: string;
 *     approved_at?: string;
 *     disbursed_at?: string;
 *     disbursement_reference?: string;
 *   };
 *   project: {
 *     name: string;
 *     code: string;
 *     client_name: string;
 *     employer_dept?: string;
 *     contract_value: number;
 *     contractor_category: string;
 *     pec_project_no?: string;
 *     ppra_reference?: string;
 *     retention_pct: number;
 *     mobilization_adv_pct: number;
 *     province_code: string;
 *     cumulative_certified: number;
 *     retention_held: number;
 *   };
 *   business: {
 *     name: string;
 *     address?: string;
 *     phone?: string;
 *     ntn?: string;
 *     logo_url?: string;
 *     settings?: Record<string, unknown>;
 *   };
 * }} params
 * @returns {string} Complete HTML string
 */
export function buildIPCBillHtml({ ipc, project, business }) {
  const brandColor = resolveInvoiceBrandColor(business?.settings) || '#1e40af';
  const currency = 'PKR';

  const provinceLabels = {
    'PK-PB': 'Punjab', 'PK-SD': 'Sindh', 'PK-KP': 'KP', 'PK-BA': 'Balochistan',
  };
  const province = provinceLabels[project.province_code] || project.province_code;

  const deductionRows = [
    ['Retention Money', `${project.retention_pct}% of gross`, fmtPKR(ipc.retention_deduction), true],
    ['Mobilization Advance Recovery', `Pro-rata on ${project.mobilization_adv_pct}%`, fmtPKR(ipc.mobilization_recovery), true],
    ...(Number(ipc.secured_advance) > 0
      ? [['Secured Advance on Materials', '—', fmtPKR(ipc.secured_advance), true]]
      : []),
    ['Net Amount Before Tax', '', fmtPKR(ipc.net_before_tax), false],
    [`FBR WHT Sec 153(1)(c) — ${ipc.wht_rate}%`, `WHT on net`, fmtPKR(ipc.wht_deduction), true],
    ...(Number(ipc.provincial_tax_deduction) > 0
      ? [[ipc.provincial_tax_label || 'Provincial Tax', `${ipc.provincial_tax_rate}%`, fmtPKR(ipc.provincial_tax_deduction), true]]
      : []),
  ];

  const cumulativeAfterThisIPC = Number(project.cumulative_certified);
  const remainingContract = Math.max(0, Number(project.contract_value) - cumulativeAfterThisIPC);
  const completionPct = Number(project.contract_value) > 0
    ? ((cumulativeAfterThisIPC / Number(project.contract_value)) * 100).toFixed(1)
    : '0.0';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>IPC #${ipc.ipc_number} — ${project.code}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10pt;
    color: #1a1a1a;
    background: #fff;
    padding: 20mm 18mm 20mm 18mm;
  }
  .brand { color: ${brandColor}; }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid ${brandColor};
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  .business-name { font-size: 16pt; font-weight: 700; }
  .business-meta { font-size: 8pt; color: #555; margin-top: 3px; }
  .doc-title-block { text-align: right; }
  .doc-title { font-size: 14pt; font-weight: 700; letter-spacing: 0.5px; }
  .doc-sub { font-size: 9pt; color: #555; margin-top: 2px; }
  .status-badge {
    display: inline-block;
    margin-top: 6px;
    background: ${brandColor}22;
    border: 1px solid ${brandColor}55;
    color: ${brandColor};
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 8pt;
    font-weight: 600;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 14px;
  }
  .meta-cell {
    padding: 8px 12px;
    border-bottom: 1px solid #e2e8f0;
    border-right: 1px solid #e2e8f0;
  }
  .meta-cell:nth-child(2n) { border-right: none; }
  .meta-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.3px; color: #888; font-weight: 600; }
  .meta-value { font-size: 9.5pt; font-weight: 600; color: #1a1a1a; margin-top: 1px; }

  .section-title {
    font-size: 9pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: ${brandColor};
    border-bottom: 1.5px solid ${brandColor}33;
    padding-bottom: 4px;
    margin: 14px 0 8px 0;
  }

  table.calc {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
  }
  table.calc th {
    background: ${brandColor}11;
    border: 1px solid #e2e8f0;
    padding: 7px 10px;
    text-align: left;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: ${brandColor};
  }
  table.calc td {
    border: 1px solid #e2e8f0;
    padding: 7px 10px;
    vertical-align: top;
  }
  table.calc tr:nth-child(even) td { background: #f8fafc; }
  .deduction { color: #dc2626; }
  .subtotal td { font-weight: 700; background: #f1f5f9 !important; }
  .net-payable td {
    font-weight: 700;
    font-size: 11pt;
    background: ${brandColor}15 !important;
    color: ${brandColor};
  }
  .text-right { text-align: right; }
  .text-center { text-align: center; }

  .summary-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin: 14px 0;
  }
  .summary-cell {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
    background: #f8fafc;
    text-align: center;
  }
  .summary-cell .slabel { font-size: 7pt; text-transform: uppercase; color: #888; font-weight: 600; }
  .summary-cell .svalue { font-size: 10pt; font-weight: 700; color: #1a1a1a; margin-top: 2px; }

  .remarks-box {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 10px;
    background: #f8fafc;
    font-size: 9pt;
  }
  .remarks-label { font-size: 8pt; font-weight: 700; color: #555; margin-bottom: 4px; text-transform: uppercase; }

  .sig-block {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-top: 24px;
    page-break-inside: avoid;
  }
  .sig-cell {
    border-top: 1.5px solid #cbd5e1;
    padding-top: 8px;
  }
  .sig-name { font-size: 9pt; font-weight: 700; color: #1a1a1a; }
  .sig-title { font-size: 8pt; color: #666; margin-top: 2px; }
  .sig-date { font-size: 7.5pt; color: #999; margin-top: 2px; }

  .footer-strip {
    margin-top: 20px;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    font-size: 7.5pt;
    color: #aaa;
    text-align: center;
  }
  @media print {
    body { padding: 10mm; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

<!-- Page Header -->
<div class="page-header">
  <div>
    ${business.logo_url ? `<img src="${business.logo_url}" style="max-height:48px;margin-bottom:6px;" alt="Logo"/>` : ''}
    <div class="business-name">${business.name}</div>
    <div class="business-meta">
      ${business.address ? business.address + ' | ' : ''}
      ${business.phone ? business.phone + ' | ' : ''}
      ${business.ntn ? 'NTN: ' + business.ntn : ''}
    </div>
  </div>
  <div class="doc-title-block">
    <div class="doc-title brand">INTERIM PAYMENT CERTIFICATE</div>
    <div class="doc-sub">${ipc.ipc_code || `IPC #${ipc.ipc_number}`} — ${project.code}</div>
    ${ipc.period_starting
      ? `<div class="doc-sub">Period: ${fmtDate(ipc.period_starting)} to ${fmtDate(ipc.period_ending)}</div>`
      : `<div class="doc-sub">Period Ending: ${fmtDate(ipc.period_ending)}</div>`}
    <span class="status-badge">${IPC_STATUS_LABELS[ipc.status] || ipc.status}</span>
  </div>
</div>

<!-- Project Details Grid -->
<div class="meta-grid">
  <div class="meta-cell">
    <div class="meta-label">Project Name</div>
    <div class="meta-value">${project.name}</div>
  </div>
  <div class="meta-cell">
    <div class="meta-label">Client / Employer</div>
    <div class="meta-value">${project.client_name}${project.employer_dept ? ' — ' + project.employer_dept : ''}</div>
  </div>
  <div class="meta-cell">
    <div class="meta-label">Contract Value</div>
    <div class="meta-value">${fmtPKR(project.contract_value)}</div>
  </div>
  <div class="meta-cell">
    <div class="meta-label">PEC Category & Province</div>
    <div class="meta-value">${project.contractor_category} | ${province}</div>
  </div>
  ${project.pec_project_no ? `
  <div class="meta-cell">
    <div class="meta-label">PEC Project No.</div>
    <div class="meta-value">${project.pec_project_no}</div>
  </div>` : '<div class="meta-cell"></div>'}
  ${project.ppra_reference ? `
  <div class="meta-cell">
    <div class="meta-label">PPRA Reference</div>
    <div class="meta-value">${project.ppra_reference}</div>
  </div>` : '<div class="meta-cell"></div>'}
</div>

<!-- Contract Progress Summary -->
<div class="section-title">Contract Progress Summary</div>
<div class="summary-bar">
  <div class="summary-cell">
    <div class="slabel">Contract Value</div>
    <div class="svalue">${fmtPKR(project.contract_value)}</div>
  </div>
  <div class="summary-cell">
    <div class="slabel">Cumulative Certified</div>
    <div class="svalue">${fmtPKR(cumulativeAfterThisIPC)}</div>
  </div>
  <div class="summary-cell">
    <div class="slabel">Remaining Work</div>
    <div class="svalue">${fmtPKR(remainingContract)}</div>
  </div>
  <div class="summary-cell">
    <div class="slabel">Completion %</div>
    <div class="svalue">${completionPct}%</div>
  </div>
</div>

<!-- IPC Calculation Table -->
<div class="section-title">IPC Calculation — ${ipc.ipc_code || `IPC #${ipc.ipc_number}`}</div>
<table class="calc">
  <thead>
    <tr>
      <th style="width:50%">Description</th>
      <th style="width:25%">Basis / Rate</th>
      <th class="text-right" style="width:25%">Amount (PKR)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Gross Certified Amount (Cumulative)</strong></td>
      <td>Cumulative to date</td>
      <td class="text-right"><strong>${fmtPKR(ipc.gross_certified_amount)}</strong></td>
    </tr>
    <tr>
      <td>Less: Previous IPC Cumulative</td>
      <td>Prior certificates</td>
      <td class="text-right deduction">−${fmtPKR(Number(ipc.gross_certified_amount) - Number(ipc.this_ipc_gross))}</td>
    </tr>
    <tr class="subtotal">
      <td>This IPC Gross (Net Work Done)</td>
      <td></td>
      <td class="text-right">${fmtPKR(ipc.this_ipc_gross)}</td>
    </tr>
    ${Number(ipc.escalation_amount) > 0 ? `
    <tr>
      <td>Add: Price Escalation (PEC Clause 70)</td>
      <td>WPI adjustment</td>
      <td class="text-right">${fmtPKR(ipc.escalation_amount)}</td>
    </tr>` : ''}
    ${deductionRows.map(([desc, basis, amount, isDeduction]) => `
    <tr ${!isDeduction && desc !== 'Net Amount Before Tax' ? '' : ''}>
      <td>${isDeduction ? desc : `<strong>${desc}</strong>`}</td>
      <td>${basis}</td>
      <td class="text-right ${isDeduction ? 'deduction' : 'font-bold'}">${isDeduction ? '−' : ''}${amount}</td>
    </tr>`).join('')}
    <tr class="net-payable">
      <td><strong>NET AMOUNT PAYABLE</strong></td>
      <td></td>
      <td class="text-right"><strong>${fmtPKR(ipc.net_payable)}</strong></td>
    </tr>
  </tbody>
</table>

<!-- Retention Summary -->
<div class="section-title">Retention Money Account</div>
<div class="meta-grid" style="grid-template-columns:1fr 1fr 1fr;">
  <div class="meta-cell">
    <div class="meta-label">Retention Rate</div>
    <div class="meta-value">${project.retention_pct}%</div>
  </div>
  <div class="meta-cell">
    <div class="meta-label">Deducted This IPC</div>
    <div class="meta-value deduction" style="color:#dc2626">${fmtPKR(ipc.retention_deduction)}</div>
  </div>
  <div class="meta-cell">
    <div class="meta-label">Total Retention Held</div>
    <div class="meta-value">${fmtPKR(project.retention_held)}</div>
  </div>
</div>

${ipc.engineer_remarks || ipc.contractor_remarks ? `
<!-- Remarks -->
<div class="section-title">Remarks & Notes</div>
${ipc.engineer_remarks ? `
<div class="remarks-box">
  <div class="remarks-label">Engineer / Employer Remarks</div>
  ${ipc.engineer_remarks}
</div>` : ''}
${ipc.contractor_remarks ? `
<div class="remarks-box">
  <div class="remarks-label">Contractor Remarks</div>
  ${ipc.contractor_remarks}
</div>` : ''}
` : ''}

${ipc.disbursed_at ? `
<div class="remarks-box" style="background:#f0fdf4;border-color:#bbf7d0;">
  <div class="remarks-label" style="color:#15803d;">Disbursement Record</div>
  Disbursed on ${fmtDate(ipc.disbursed_at)}${ipc.disbursement_reference ? ' | Reference: ' + ipc.disbursement_reference : ''}
</div>` : ''}

<!-- Signature Blocks -->
<div class="sig-block">
  <div class="sig-cell">
    <div class="sig-name">${business.name}</div>
    <div class="sig-title">Contractor / Signature & Stamp</div>
    <div class="sig-date">Date: _______________</div>
  </div>
  <div class="sig-cell">
    <div class="sig-name">Site Engineer</div>
    <div class="sig-title">Measurement & Verification</div>
    <div class="sig-date">Date: _______________</div>
  </div>
  <div class="sig-cell">
    <div class="sig-name">${project.employer_dept || project.client_name}</div>
    <div class="sig-title">Employer / Approving Authority</div>
    <div class="sig-date">
      ${ipc.approved_at ? `Approved: ${fmtDate(ipc.approved_at)}` : 'Date: _______________'}
    </div>
  </div>
</div>

<!-- Footer -->
<div class="footer-strip">
  Generated by ${business.name} | IPC #${ipc.ipc_number} — ${project.code} | ${fmtDate(new Date().toISOString())} |
  This document is computer generated and does not require a wet signature unless specified in contract.
</div>

</body>
</html>`;
}

/**
 * Open the IPC bill in a new browser tab and trigger print.
 * @param {Parameters<typeof buildIPCBillHtml>[0]} params
 */
export function printIPCBill(params) {
  const html = buildIPCBillHtml(params);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}
