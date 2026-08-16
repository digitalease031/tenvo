/**
 * PEC Clause 70 Price Escalation Claim Statement PDF Generator
 * Formats official price escalation claim statements under PEC Standard Bidding Documents Clause 70.
 */

import { resolveInvoiceBrandColor } from '@/lib/pdf/invoiceFormat';

function fmtPKR(n) {
  const v = Number(n || 0);
  return `PKR ${v.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function buildEscalationClaimHtml({ claim, project, business }) {
  const brandColor = resolveInvoiceBrandColor(business?.settings) || '#a71930';
  const currency = 'PKR';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>PEC Clause 70 Escalation Claim - ${project?.code || 'PRJ'}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Open Sans', Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 20px; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-b: 2px solid ${brandColor}; padding-bottom: 12px; margin-bottom: 16px; }
    .company-title { font-size: 18px; font-weight: 800; color: ${brandColor}; text-transform: uppercase; }
    .doc-title { font-size: 14px; font-weight: 700; color: #0f172a; text-align: right; }
    .doc-sub { font-size: 10px; color: #64748b; text-align: right; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; font-size: 11px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
    .card-title { font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: ${brandColor}; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; text-align: left; padding: 8px; border: 1px solid ${brandColor}; }
    td { padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .claim-box { background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 12px; margin-top: 16px; text-align: center; }
    .claim-title { font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; }
    .claim-amount { font-size: 22px; font-weight: 800; color: #991b1b; margin-top: 4px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 40px; text-align: center; }
    .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10px; font-weight: 700; color: #475569; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-title">${business?.name || 'Tenvo Construction Contractor'}</div>
      <div>PEC License Category: ${project?.contractor_category || 'C-A'} | NTN: ${business?.ntn || '4029182-7'}</div>
      <div>${business?.address || 'Lahore, Pakistan'}</div>
    </div>
    <div>
      <div class="doc-title">PEC CLAUSE 70 PRICE ESCALATION CLAIM</div>
      <div class="doc-sub">Standard Bidding Document (SBD) Escalation Statement</div>
      <div class="doc-sub">Date: ${new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Project Details</div>
      <div><strong>Project Code:</strong> ${project?.code || 'PRJ-2026'}</div>
      <div><strong>Project Name:</strong> ${project?.name || 'Contract Execution Work'}</div>
      <div><strong>Client / Employer:</strong> ${project?.client_name || 'Department of Public Works'}</div>
      <div><strong>PEC Registration No:</strong> ${project?.pec_project_no || 'PEC-CE-2026'}</div>
    </div>
    <div class="card">
      <div class="card-title">Contract Financials</div>
      <div><strong>Contract Value (P0):</strong> ${fmtPKR(project?.contract_value || claim?.P0 || 0)}</div>
      <div><strong>Gross Certified Amount:</strong> ${fmtPKR(claim?.P0 || 0)}</div>
      <div><strong>Clause 70 Weightage Sum:</strong> Steel (25%), Cement (15%), Fixed (60%)</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Specified Material</th>
        <th>Unit</th>
        <th class="text-right">Base Rate (M0)</th>
        <th class="text-right">Current Rate (Mn)</th>
        <th class="text-right">Price Shift</th>
        <th class="text-right">Weightage Factor</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="font-bold">Deformed Steel Rebar Grade 60</td>
        <td>Ton</td>
        <td class="text-right">PKR 240,000.00</td>
        <td class="text-right">PKR 267,000.00</td>
        <td class="text-right font-bold text-red-600">+11.25%</td>
        <td class="text-right">0.25</td>
      </tr>
      <tr>
        <td class="font-bold">OPC Cement 50kg Bag</td>
        <td>Bag</td>
        <td class="text-right">PKR 1,250.00</td>
        <td class="text-right">PKR 1,450.00</td>
        <td class="text-right font-bold text-red-600">+16.00%</td>
        <td class="text-right">0.15</td>
      </tr>
      <tr>
        <td class="font-bold">Fixed Non-Escalable Component</td>
        <td>—</td>
        <td class="text-right">1.00</td>
        <td class="text-right">1.00</td>
        <td class="text-right">0.00%</td>
        <td class="text-right">0.60</td>
      </tr>
    </tbody>
  </table>

  <div class="claim-box">
    <div class="claim-title">Calculated Price Adjustment Amount Payable by Employer (Clause 70)</div>
    <div class="claim-amount">${fmtPKR(claim?.netEscalationAmount || 0)}</div>
    <div style="font-size: 10px; color: #7f1d1d; margin-top: 4px;">
      Calculated using PEC formula: P_n = P_0 × [a + b(M_n/M_0) + c(C_n/C_0) - 1]
    </div>
  </div>

  <div class="signatures">
    <div class="sig-line">Prepared By<br>Contractor Cost Engineer</div>
    <div class="sig-line">Verified By<br>Resident Engineer (Consultant)</div>
    <div class="sig-line">Approved By<br>Project Director (Employer)</div>
  </div>
</body>
</html>
  `;
}
