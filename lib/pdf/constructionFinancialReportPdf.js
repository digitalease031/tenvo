/**
 * Construction Project Executive Financial & Retention Ledger PDF Generator
 */

import { resolveInvoiceBrandColor } from '@/lib/pdf/invoiceFormat';

function fmtPKR(n) {
  const v = Number(n || 0);
  return `PKR ${v.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function buildConstructionFinancialReportHtml({ projects = [], business }) {
  const brandColor = resolveInvoiceBrandColor(business?.settings) || '#a71930';

  const totalContract = projects.reduce((sum, p) => sum + Number(p.contract_value || 0), 0);
  const totalCertified = projects.reduce((sum, p) => sum + Number(p.cumulative_certified || 0), 0);
  const totalRetention = projects.reduce(
    (sum, p) => sum + (Number(p.retention_held || 0) || (Number(p.cumulative_certified || 0) * (Number(p.retention_pct || 5) / 100))),
    0
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Executive Construction Financial Summary - ${business?.name || 'Tenvo'}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: 'Open Sans', Arial, sans-serif; font-size: 10px; color: #1e293b; margin: 0; padding: 20px; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-b: 2px solid ${brandColor}; padding-bottom: 12px; margin-bottom: 16px; }
    .company-title { font-size: 18px; font-weight: 800; color: ${brandColor}; text-transform: uppercase; }
    .doc-title { font-size: 14px; font-weight: 700; color: #0f172a; text-align: right; }
    .kpis { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; text-align: center; }
    .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; }
    .kpi-val { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: ${brandColor}; color: #ffffff; font-size: 9px; font-weight: 700; text-transform: uppercase; text-align: left; padding: 6px; }
    td { padding: 6px; border: 1px solid #cbd5e1; font-size: 10px; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-title">${business?.name || 'Tenvo Construction Contractor'}</div>
      <div>PEC Contractor License Category: C-A | Corporate NTN: ${business?.ntn || '4029182-7'}</div>
    </div>
    <div>
      <div class="doc-title">PROJECT PORTFOLIO EXECUTIVE FINANCIAL SUMMARY</div>
      <div>Date: ${new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi-card">
      <div style="font-size:9px; color:#64748b; font-weight:700; text-transform:uppercase;">Total Portfolio Value</div>
      <div class="kpi-val">${fmtPKR(totalContract)}</div>
    </div>
    <div class="kpi-card">
      <div style="font-size:9px; color:#64748b; font-weight:700; text-transform:uppercase;">Certified Work Done (IPC)</div>
      <div class="kpi-val" style="color:#15803d;">${fmtPKR(totalCertified)}</div>
    </div>
    <div class="kpi-card">
      <div style="font-size:9px; color:#64748b; font-weight:700; text-transform:uppercase;">Retention Money Held</div>
      <div class="kpi-val" style="color:#b45309;">${fmtPKR(totalRetention)}</div>
    </div>
    <div class="kpi-card">
      <div style="font-size:9px; color:#64748b; font-weight:700; text-transform:uppercase;">Portfolio Completion %</div>
      <div class="kpi-val" style="color:#1d4ed8;">
        ${totalContract > 0 ? ((totalCertified / totalContract) * 100).toFixed(1) : 0}%
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Project Name</th>
        <th>Employer / Client</th>
        <th>PEC Cat.</th>
        <th class="text-right">Contract Value</th>
        <th class="text-right">Certified Work</th>
        <th class="text-right">Retention Held</th>
        <th class="text-right">Completion %</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${projects.map((p) => {
        const ret = Number(p.retention_held || 0) || (Number(p.cumulative_certified || 0) * (Number(p.retention_pct || 5) / 100));
        const pct = p.contract_value > 0 ? ((Number(p.cumulative_certified || 0) / Number(p.contract_value)) * 100).toFixed(1) : '0.0';
        return `
          <tr>
            <td class="font-bold">${p.code}</td>
            <td class="font-bold">${p.name}</td>
            <td>${p.client_name}</td>
            <td>${p.contractor_category || 'C-1'}</td>
            <td class="text-right font-bold">${fmtPKR(p.contract_value)}</td>
            <td class="text-right font-bold" style="color:#15803d;">${fmtPKR(p.cumulative_certified)}</td>
            <td class="text-right font-bold" style="color:#b45309;">${fmtPKR(ret)}</td>
            <td class="text-right font-bold">${pct}%</td>
            <td>${p.status}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
</body>
</html>
  `;
}
