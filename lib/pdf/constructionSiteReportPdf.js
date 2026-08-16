/**
 * Construction Site Daily Report & HSE Safety Compliance PDF Generator
 */

import { resolveInvoiceBrandColor } from '@/lib/pdf/invoiceFormat';

export function buildSiteDailyReportHtml({ project, date = new Date(), business }) {
  const brandColor = resolveInvoiceBrandColor(business?.settings) || '#a71930';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Site Daily Work Report - ${project?.code || 'PRJ'}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Open Sans', Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 20px; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-b: 2px solid ${brandColor}; padding-bottom: 12px; margin-bottom: 16px; }
    .company-title { font-size: 18px; font-weight: 800; color: ${brandColor}; text-transform: uppercase; }
    .doc-title { font-size: 14px; font-weight: 700; color: #0f172a; text-align: right; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
    .card-title { font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #334155; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; text-align: left; padding: 6px 8px; }
    td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 10px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 40px; text-align: center; }
    .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10px; font-weight: 700; color: #475569; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-title">${business?.name || 'Tenvo Construction Contractor'}</div>
      <div>Site Operations & Field Management Division</div>
    </div>
    <div>
      <div class="doc-title">DAILY SITE WORK REPORT & HSE LOG</div>
      <div>Date: ${new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Project Context</div>
      <div><strong>Project:</strong> ${project?.name || 'Lahore Ring Road SL-3'}</div>
      <div><strong>Client:</strong> ${project?.client_name || 'National Highway Authority'}</div>
      <div><strong>Site Location:</strong> ${project?.province_code || 'PK-PB'} — Main Alignment</div>
    </div>
    <div class="card">
      <div class="card-title">Site Conditions & Safety</div>
      <div><strong>Weather:</strong> Clear / Sunny (32°C)</div>
      <div><strong>Work Shift:</strong> Day Shift (07:00 AM – 06:00 PM)</div>
      <div><strong>HSE Safety Incidents:</strong> 0 Incidents Reported (Zero Lost Time Injury)</div>
    </div>
  </div>

  <div style="font-weight:700; margin-bottom:6px; font-size:11px;">1. Site Workforce Headcount</div>
  <table>
    <thead>
      <tr>
        <th>Trade / Designation</th>
        <th>Skill Level</th>
        <th>Headcount</th>
        <th>Hours Worked</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Site Engineer & Foreman</td><td>Professional</td><td>4</td><td>40 Hrs</td></tr>
      <tr><td>Masons (Rajmistri)</td><td>Skilled</td><td>12</td><td>120 Hrs</td></tr>
      <tr><td>Steel Fixers & Shuttering Workers</td><td>Skilled</td><td>18</td><td>180 Hrs</td></tr>
      <tr><td>Laborers (Mazdoor)</td><td>Unskilled</td><td>35</td><td>350 Hrs</td></tr>
    </tbody>
  </table>

  <div style="font-weight:700; margin-bottom:6px; font-size:11px;">2. Plant & Heavy Machinery Log</div>
  <table>
    <thead>
      <tr>
        <th>Equipment Unit</th>
        <th>Registration #</th>
        <th>Operating Hours</th>
        <th>Diesel Fuel Consumed</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Excavator CAT 320D</td><td>EXC-101</td><td>8.5 Hrs</td><td>68 Litres</td></tr>
      <tr><td>Vibratory Roller 10 Ton</td><td>ROL-202</td><td>6.0 Hrs</td><td>42 Litres</td></tr>
      <tr><td>Transit Mixer 8 Cu.M</td><td>TM-305</td><td>7.0 Hrs</td><td>55 Litres</td></tr>
    </tbody>
  </table>

  <div style="font-weight:700; margin-bottom:6px; font-size:11px;">3. Quality Control & Concrete Lab Testing</div>
  <table>
    <thead>
      <tr>
        <th>Test Description</th>
        <th>Location / Component</th>
        <th>Specified Standard</th>
        <th>Test Result</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Concrete Slump Test</td><td>Bridge Pier #4 Pour</td><td>75mm ± 25mm</td><td>85mm</td><td style="color:green; font-weight:bold;">PASS</td></tr>
      <tr><td>7-Day Cube Crushing Strength</td><td>Slab Panel B-2</td><td>28 Mpa (4000 PSI)</td><td>29.5 Mpa</td><td style="color:green; font-weight:bold;">PASS</td></tr>
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-line">Prepared By<br>Site Engineer / Foreman</div>
    <div class="sig-line">Approved By<br>Project Manager</div>
  </div>
</body>
</html>
  `;
}
