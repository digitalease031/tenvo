/**
 * KOT (Kitchen Order Ticket) Thermal Print Utility
 * Formats a clean 80mm / 58mm ticket for kitchen displays & thermal receipt printers.
 */

export function buildKotHtml({
  businessName = 'Restaurant',
  orderNumber = '',
  tokenNumber = null,
  orderType = 'Dine-In',
  tableNumber = null,
  covers = null,
  customerName = null,
  customerPhone = null,
  items = [],
  waiterNote = null,
  createdAt = new Date(),
}) {
  const dateStr = new Date(createdAt).toLocaleString('en-PK', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const formattedItems = (items || []).map((item) => {
    const qty = item.quantity || item.qty || 1;
    const name = item.name || item.item_name || item.itemName || 'Item';
    const mods = (item.modifiers || item.mods || [])
      .map((m) => typeof m === 'string' ? m : m.name)
      .filter(Boolean)
      .join(', ');
    const note = item.specialInstructions || item.special || item.notes || null;

    return `
      <div style="margin-bottom: 6px; font-size: 14px; font-weight: bold; color: #000;">
        <div style="display: flex; justify-content: space-between;">
          <span>${qty}x ${escapeHtml(name)}</span>
        </div>
        ${mods ? `<div style="font-size: 11px; font-weight: normal; margin-left: 12px; color: #333;">+ ${escapeHtml(mods)}</div>` : ''}
        ${note ? `<div style="font-size: 11px; font-style: italic; margin-left: 12px; color: #d97706;">*** ${escapeHtml(note)} ***</div>` : ''}
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>KOT - ${escapeHtml(orderNumber)}</title>
  <style>
    @page { margin: 0 !important; size: 80mm auto; }
    @media print {
      @page { margin: 0 !important; size: 80mm auto; }
      html { width: 80mm !important; max-width: 80mm !important; }
      body { width: 302px !important; max-width: 302px !important; margin: 0 !important; padding: 6px 4px !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    * { box-sizing: border-box; }
    html { width: 302px; max-width: 302px; }
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 302px;
      max-width: 302px;
      margin: 0 auto;
      padding: 6px 4px;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .border-b { border-bottom: 1px dashed #000; margin: 6px 0; }
    .border-double { border-bottom: 3px double #000; margin: 6px 0; }
    .token-box {
      border: 2px solid #000;
      padding: 4px;
      text-align: center;
      margin: 6px 0;
    }
    .token-number {
      font-size: 28px;
      font-weight: 900;
      line-height: 1.1;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="text-center" style="font-size: 16px; font-weight: 900;">*** KITCHEN ORDER TICKET ***</div>
  <div class="text-center" style="font-size: 12px; color: #555;">${escapeHtml(businessName)}</div>
  
  ${tokenNumber ? `
    <div class="token-box">
      <div style="font-size: 10px; font-weight: bold; letter-spacing: 1px;">TOKEN NUMBER</div>
      <div class="token-number">#${tokenNumber}</div>
    </div>
  ` : ''}

  <div class="border-b"></div>

  <div class="meta-row">
    <span>Order #: ${escapeHtml(orderNumber)}</span>
    <span>Type: ${escapeHtml(String(orderType).toUpperCase())}</span>
  </div>
  ${tableNumber ? `
    <div class="meta-row">
      <span>TABLE: ${escapeHtml(tableNumber)}</span>
      ${covers ? `<span>Covers: ${covers}</span>` : ''}
    </div>
  ` : ''}
  ${customerName ? `
    <div class="meta-row">
      <span>Guest: ${escapeHtml(customerName)}</span>
      ${customerPhone ? `<span>${escapeHtml(customerPhone)}</span>` : ''}
    </div>
  ` : ''}
  <div class="meta-row">
    <span>Time: ${dateStr}</span>
  </div>

  <div class="border-double"></div>

  <div style="margin: 8px 0;">
    ${formattedItems}
  </div>

  ${waiterNote ? `
    <div class="border-b"></div>
    <div style="font-size: 12px; font-weight: bold; background: #f3f4f6; padding: 4px; border-radius: 4px;">
      NOTE: ${escapeHtml(waiterNote)}
    </div>
  ` : ''}

  <div class="border-double"></div>
  <div class="text-center" style="font-size: 10px;">--- END OF KOT ---</div>
</body>
</html>
  `;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function printKotWindow(data) {
  const html = buildKotHtml(data);
  const printWin = window.open('', '_blank', 'width=350,height=600');
  if (!printWin) return false;
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => {
    printWin.print();
    printWin.close();
  }, 250);
  return true;
}
