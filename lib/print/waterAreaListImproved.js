/**
 * Water Delivery Area List - Full-page A4/A5 Register Format
 * 
 * INTELLIGENCE:
 * - Auto-calculates target bottles from qtyByProduct or dailyBottles fallback
 * - Smart grouping by route/area with sub-totals
 * - Zebra-stripe rows for readability
 * - Area headers with visual hierarchy
 * - Grand total with reconciliation footer
 * 
 * CUSTOMIZATION:
 * - Paper size: A4 (default) or A5
 * - Grouping: by routeLabel, deliveryArea, or townCode (auto-priority)
 * - Target calculation: from product columns or daily default
 * - Phone visibility: always included in area list (riders need contact info)
 * 
 * ACCURACY:
 * - Phone field comes from customer.phone via getWaterHisabDayAction
 * - Account numbers from stop snapshot or customer prefs
 * - Bottle balance reflects today's opening + DEL - REC
 * - All totals are calculated, not hardcoded
 */

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Calculate target bottles for a customer intelligently.
 * Priority: sum of qtyByProduct → dailyBottles → 1 (minimum)
 */
function calculateTargetBottles(row, products) {
  let total = 0;
  
  // Try to calculate from product columns
  if (row.qtyByProduct && typeof row.qtyByProduct === 'object') {
    for (const p of products) {
      const qty = Number(row.qtyByProduct[String(p.id)]) || 0;
      total += qty;
    }
  }
  
  // Fallback to dailyBottles
  if (total === 0 && row.dailyBottles) {
    total = Number(row.dailyBottles) || 0;
  }
  
  // Ensure minimum of 1 for active routes
  return total > 0 ? total : 1;
}

/**
 * Build intelligent area groups with sub-totals.
 * Groups by: routeLabel > deliveryArea > townCode > "General"
 */
function buildAreaGroups(rows, products) {
  const groupMap = new Map();
  
  rows.forEach((row) => {
    // Smart area detection with priority
    const area = String(
      row.routeLabel || 
      row.deliveryArea || 
      row.townCode || 
      ''
    ).trim() || 'General';
    
    if (!groupMap.has(area)) {
      groupMap.set(area, {
        name: area,
        rows: [],
        targetTotal: 0,
      });
    }
    
    const tgt = calculateTargetBottles(row, products);
    const group = groupMap.get(area);
    group.rows.push({ ...row, calculatedTarget: tgt });
    group.targetTotal += tgt;
  });
  
  return Array.from(groupMap.values());
}

/**
 * Format customer address intelligently.
 * Combines house number and name with proper formatting.
 */
function formatCustomerAddress(row) {
  const house = String(row.houseNo && row.houseNo !== '?' && row.houseNo !== 'null' 
    ? row.houseNo 
    : ''
  ).trim();
  
  const name = String(row.customerName || '').trim();
  
  if (house && name) {
    return `${house} — ${name}`;
  }
  return house || name || 'Customer';
}

/**
 * Build full-page A4/A5 Area List HTML matching screenshot format.
 * 
 * LAYOUT:
 * - Header: Business info + date
 * - Meta bar: Employee, date, stops, target load
 * - Table: Grouped by area with zebra stripes
 * - Footer: Reconciliation box + signature
 * - Legend: Column explanations
 */
export function buildWaterAreaListHtml({
  business,
  rows = [],
  products = [],
  deliveryDate = '',
  riderName = '',
  paperSize = 'A4',
}) {
  const bizName = business?.business_name || business?.name || business?.businessName || 'Water Supply';
  const bizPhone = business?.phone || business?.uan || '';
  const bizAddress = business?.address || '';
  const dateLabel = deliveryDate
    ? String(deliveryDate).slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const isA5 = String(paperSize).toUpperCase() === 'A5';
  const pgSize = isA5 ? 'A5' : 'A4';

  // Build intelligent area groups
  const areaGroups = buildAreaGroups(rows, products);
  
  // Calculate grand totals
  let grandTarget = 0;
  areaGroups.forEach(g => { grandTarget += g.targetTotal; });

  // Build table body HTML with area grouping
  let bodyHtml = '';
  let serialNo = 0;
  
  areaGroups.forEach((group) => {
    // Area header row
    bodyHtml += `<tr class="area-hdr">
  <td colspan="9" class="area-cell">▸ ${esc(group.name)}</td>
</tr>\n`;

    // Data rows for this area
    group.rows.forEach((row, idx) => {
      serialNo++;
      const shade = idx % 2 === 1 ? ' class="shade"' : '';
      const acctNo = String(row.accountNo || row.customerCode || '').trim();
      const addr = formatCustomerAddress(row);
      const phone = String(row.phone || '').trim();
      const bal = row.bottleBalance != null 
        ? String(Number(row.bottleBalance) || 0) 
        : '—';

      bodyHtml += `<tr${shade}>
  <td class="c num">${serialNo}</td>
  <td class="acct">${esc(acctNo)}</td>
  <td class="addr">${esc(addr)}</td>
  <td class="phone">${esc(phone)}</td>
  <td class="c tgt">${row.calculatedTarget}</td>
  <td class="tick"></td>
  <td class="tick"></td>
  <td class="tick"></td>
  <td class="c bal">${esc(bal)}</td>
</tr>\n`;
    });

    // Area subtotal row
    bodyHtml += `<tr class="area-sub">
  <td colspan="4" class="sub-lbl">↳ Sub-total — ${esc(group.name)} (${group.rows.length} stops)</td>
  <td class="c tgt">${group.targetTotal}</td>
  <td class="tick-sum"></td>
  <td class="tick-sum"></td>
  <td class="tick-sum"></td>
  <td></td>
</tr>\n`;
  });

  // Grand total row
  bodyHtml += `<tr class="grand-total">
  <td colspan="4" class="c gt-lbl">GRAND TOTAL — ${rows.length} stops</td>
  <td class="c gt-val">${grandTarget}</td>
  <td class="tick-sum"></td>
  <td class="tick-sum"></td>
  <td class="tick-sum"></td>
  <td></td>
</tr>\n`;

  // Responsive font sizes
  const fs = isA5 ? '8px' : '9.5px';
  const fsS = isA5 ? '7px' : '8.5px';
  const fsT = isA5 ? '6.5px' : '7.5px';
  const bizFs = isA5 ? '12px' : '15px';
  const titleFs = isA5 ? '10px' : '13px';
  const tickH = isA5 ? '6mm' : '7.5mm';

  const styles = `
@page { size: ${pgSize} portrait; margin: 10mm 8mm 12mm; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { 
  font-family: 'Courier New', Courier, monospace; 
  font-size: ${fs}; 
  color: #111; 
  background: #fff; 
}
.page-wrap { width: 100%; }

/* ── Page header ── */
.doc-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  border-bottom: 2px solid #111; padding-bottom: 3mm; margin-bottom: 3mm;
}
.hdr-left { flex: 1; }
.hdr-right { text-align: right; }
.biz-name { 
  font-size: ${bizFs}; font-weight: 800; 
  text-transform: uppercase; letter-spacing: 0.03em; 
}
.biz-sub { font-size: ${fsS}; color: #555; margin-top: 0.6mm; }

.doc-title {
  font-size: ${titleFs}; font-weight: 800; text-align: center; 
  text-transform: uppercase; letter-spacing: 0.08em; 
  padding: 1.2mm 0; margin-bottom: 2mm;
  border-top: 1.5px solid #111; border-bottom: 1.5px solid #111;
}

.meta-bar {
  display: flex; flex-wrap: wrap; gap: 8mm; 
  font-size: ${fsS}; margin-bottom: 2mm;
}
.mf { display: flex; gap: 1.5mm; align-items: baseline; }
.ml { font-weight: 700; white-space: nowrap; }
.mv { border-bottom: 1px solid #666; min-width: 28mm; padding-bottom: 0.3mm; }

/* ── Table ── */
table { width: 100%; border-collapse: collapse; font-size: ${fs}; }

thead th {
  background: #111; color: #fff; font-weight: 700; 
  text-transform: uppercase; padding: 1.6mm 1.2mm; 
  text-align: center; border: 0.8px solid #111;
  font-size: ${fsT}; letter-spacing: 0.05em;
}
thead th.tl { text-align: left; }

tbody td { 
  border: 0.6px solid #c8c8c8; 
  padding: 1.2mm 1mm; 
  vertical-align: middle; 
}

/* Zebra striping for readability */
.shade td { background: #f7f9fb; }

/* ── Area header ── */
.area-hdr td.area-cell {
  background: #deeefb; color: #003d7a; font-weight: 700;
  font-size: ${isA5 ? '7.5px' : '9px'}; padding: 1.2mm 2mm;
  border-top: 1.2px solid #7db5e0; border-bottom: 1.2px solid #7db5e0;
  text-transform: uppercase; letter-spacing: 0.05em;
}

/* ── Area sub-total ── */
.area-sub td {
  background: #eaf3fc; font-weight: 700; font-size: ${fsT};
  border-top: 1px solid #9ac4e5;
}
.area-sub .sub-lbl { text-align: left; color: #555; padding-left: 2mm; }

/* ── Grand total ── */
.grand-total td { 
  background: #111; color: #fff; font-size: ${fsS}; 
  font-weight: 800; padding: 1.5mm 1mm; border: 0.8px solid #111; 
}
.grand-total .gt-lbl { text-align: right; }
.grand-total .gt-val { font-size: ${fs}; }

/* ── Column widths ── */
.c { text-align: center; }
.num { width: 7mm; font-size: ${fsT}; color: #777; }
.acct { width: 20mm; font-size: ${fsT}; color: #444; }
.addr { /* flex remaining */ }
.phone { width: 28mm; font-size: ${fsT}; color: #444; }
.tgt { width: 10mm; font-weight: 800; font-size: ${isA5 ? '9px' : '11px'}; }

/* ── Tick boxes for rider write-in ── */
.tick {
  width: 16mm; min-height: ${tickH};
  border: 1px dashed #444 !important;
  background: #fff;
}
.tick-sum {
  width: 16mm; min-height: 5mm;
  border: 1px dashed #aaa !important;
  background: #f5f9ff;
}
.bal { width: 11mm; font-weight: 700; color: #b00; }

/* ── Footer reconciliation ── */
.doc-footer {
  margin-top: 6mm; display: flex; justify-content: space-between; 
  align-items: flex-end;
}
.totals-box {
  font-size: ${fsS}; border: 1px solid #ccc; 
  padding: 2mm 3mm; min-width: 70mm;
}
.totals-box .t-row { 
  display: flex; justify-content: space-between; gap: 4mm; 
  padding: 0.7mm 0; border-bottom: 0.5px dotted #ddd; 
}
.totals-box .t-row:last-child { border-bottom: none; }
.totals-box .tl { font-weight: 700; }
.totals-box .tv { 
  border-bottom: 1px solid #888; 
  min-width: 24mm; text-align: center; 
}

.sig-block { text-align: center; min-width: 55mm; }
.sig-line { 
  border-bottom: 1px solid #555; 
  width: 55mm; height: 10mm; 
  margin: 0 auto 1.5mm; 
}
.sig-label { font-size: ${fsT}; }

.legend { 
  font-size: ${isA5 ? '5.5px' : '6.5px'}; 
  color: #777; margin-top: 2mm; 
}
`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>Area Delivery List — ${esc(dateLabel)}</title>
<style>${styles}</style>
</head><body>
<div class="page-wrap">

<div class="doc-header">
  <div class="hdr-left">
    <div class="biz-name">${esc(bizName)}</div>
    ${bizAddress ? `<div class="biz-sub">${esc(bizAddress)}</div>` : ''}
    ${bizPhone ? `<div class="biz-sub">UAN / Phone: ${esc(bizPhone)}</div>` : ''}
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
  <div class="mf"><span class="ml">Stops:</span><span class="mv">${rows.length}</span></div>
  <div class="mf"><span class="ml">Target Load:</span><span class="mv">${grandTarget} Pcs</span></div>
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
${bodyHtml}  </tbody>
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
  TGT = Target bottles&nbsp;&bull;&nbsp;
  DEL = Delivered&nbsp;&bull;&nbsp;
  REC = Empties returned&nbsp;&bull;&nbsp;
  CASH = Cash collected&nbsp;&bull;&nbsp;
  BAL = Bottles outstanding at customer
</div>

</div>
</body></html>`;
}

/**
 * Print or open the area list for Save as PDF.
 * Uses blob URL to avoid pop-up blockers.
 */
export async function printWaterAreaList(args, mode = 'print') {
  const html = buildWaterAreaListHtml(args);
  
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    
    if (!win) {
      // Fallback if blob URL fails
      const w2 = window.open('', '_blank', 'width=900,height=700');
      if (!w2) return false;
      w2.document.open();
      w2.document.write(html);
      w2.document.close();
      setTimeout(() => { 
        try { w2.focus(); w2.print(); } 
        catch { /* noop */ } 
      }, 500);
      return true;
    }
    
    // Trigger print after window loads
    setTimeout(() => {
      try { 
        win.focus(); 
        win.print(); 
      } catch { /* noop */ }
      // Clean up blob URL after print dialog
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, mode === 'pdf' ? 300 : 500);
    
    return true;
  } catch (err) {
    console.warn('[waterAreaList] blob open failed, fallback to write', err);
    const win = typeof window !== 'undefined' 
      ? window.open('', '_blank', 'width=900,height=700') 
      : null;
    if (!win) return false;
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => { 
      try { win.focus(); win.print(); } 
      catch { /* noop */ } 
    }, 500);
    return true;
  }
}
