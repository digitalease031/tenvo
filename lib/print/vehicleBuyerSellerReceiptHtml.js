/**
 * Vehicle Buyer-Seller Receipt & Delivery Note (HTML Print Generator)
 * Automotive Domain (vehicle-dealership, auto-marketplace, rent-a-car)
 */
import { formatBusinessAddressBlock, resolveInvoiceBrandColor } from '@/lib/pdf/invoiceFormat';

/**
 * Normalizes vehicle agreement details with mandatory fallbacks to customer & business profiles.
 * @param {object} invoice
 * @param {object} business
 */
export function resolveVehicleAgreementDetails(invoice = {}, business = {}) {
  const customer = invoice.customer || {};
  const agreement =
    invoice.vehicleAgreement ||
    invoice.vehicle_meta ||
    invoice.taxDetails?.vehicleAgreement ||
    invoice.tax_details?.vehicleAgreement ||
    invoice.domain_data?.vehicleAgreement ||
    {};

  const sellerName = String(agreement.sellerName || business.name || 'Showroom / Seller').trim();
  const sellerPhone = String(agreement.sellerPhone || business.phone || business.phone_number || '').trim();
  const sellerCnic = String(agreement.sellerCnic || business.cnic || business.ntn || '').trim();
  const sellerAddress = String(
    agreement.sellerAddress ||
    formatBusinessAddressBlock(business).join(', ') ||
    business.address ||
    ''
  ).trim();

  const buyerName = String(agreement.buyerName || customer.name || 'Purchaser / Buyer').trim();
  const buyerPhone = String(agreement.buyerPhone || customer.phone || '').trim();
  const buyerCnic = String(agreement.buyerCnic || customer.cnic || customer.domain_data?.cnic || '').trim();
  const buyerAddress = String(
    agreement.buyerAddress ||
    customer.address ||
    [customer.city, customer.state].filter(Boolean).join(', ') ||
    ''
  ).trim();

  const transactionMode = agreement.transactionMode || 'sale';
  let title = 'VEHICLE SALES AGREEMENT & BUYER-SELLER DELIVERY RECEIPT';
  if (transactionMode === 'purchase') title = 'VEHICLE TRADE-IN & PURCHASE RECEIPT';
  if (transactionMode === 'rental') title = 'VEHICLE RENTAL & LEASE AGREEMENT';

  return {
    title,
    transactionMode,
    sellerName,
    sellerPhone,
    sellerCnic,
    sellerAddress,
    buyerName,
    buyerPhone,
    buyerCnic,
    buyerAddress,
    registrationNo: agreement.registrationNo || 'UNREGISTERED',
    chassisNo: agreement.chassisNo || '-',
    engineNo: agreement.engineNo || '-',
    mileage: agreement.mileage ? `${agreement.mileage} KM` : '-',
    makeModel: agreement.makeModel || 'Vehicle',
    modelYear: agreement.modelYear || '-',
    color: agreement.color || '-',
    bodyType: agreement.bodyType || 'Sedan',
    transmission: agreement.transmission || 'Automatic',
    fuelType: agreement.fuelType || 'Petrol',
    tokenTaxStatus: agreement.tokenTaxStatus || 'Paid',
    conditionGrade: agreement.conditionGrade || 'Standard',
    witness1Name: agreement.witness1Name || '',
    witness1Cnic: agreement.witness1Cnic || '',
    witness1Phone: agreement.witness1Phone || '',
    witness2Name: agreement.witness2Name || '',
    witness2Cnic: agreement.witness2Cnic || '',
    witness2Phone: agreement.witness2Phone || '',
    ownershipTransferTerms:
      agreement.ownershipTransferTerms ||
      'Vehicle delivered in good running condition. Ownership transfer to be completed within 30 days of delivery.',
  };
}

/**
 * Builds HTML standard printable document string.
 * @param {object} invoice
 * @param {object} business
 * @param {string} [category]
 */
export function buildVehicleBuyerSellerReceiptHtml(invoice = {}, business = {}, category = 'vehicle-dealership') {
  const details = resolveVehicleAgreementDetails(invoice, business);
  const brandRgb = resolveInvoiceBrandColor(business, business?.settingsParsed);
  const brandHex = `#${brandRgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;

  const items = Array.isArray(invoice.items) && invoice.items.length ? invoice.items : [];
  const currency = invoice.currency || business.currency || 'PKR';
  const grandTotal = Number(invoice.grand_total ?? invoice.amount ?? invoice.total ?? 0);
  const paidAmount = Number(invoice.paid_amount ?? invoice.paidAmount ?? (invoice.payment_status === 'paid' ? grandTotal : 0));
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  const missingSellerPhone = !details.sellerPhone;
  const missingSellerCnic = !details.sellerCnic;
  const missingBuyerPhone = !details.buyerPhone;
  const missingBuyerCnic = !details.buyerCnic;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${details.title} - ${invoice.invoice_number || invoice.invoiceNumber || 'RECEIPT'}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #f8fafc; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; }
    .sheet { background: #ffffff; max-width: 800px; margin: 0 auto; padding: 32px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid ${brandHex}; }
    .business-name { font-size: 24px; font-weight: 800; color: ${brandHex}; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: -0.5px; }
    .doc-title { font-size: 14px; font-weight: 800; color: #1e293b; text-align: right; text-transform: uppercase; margin: 0; }
    .badge { display: inline-block; padding: 4px 10px; background: #e0e7ff; color: #3730a3; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .warning-text { color: #dc2626; font-weight: 700; }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
    .party-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; }
    .party-title { font-size: 11px; font-weight: 800; color: ${brandHex}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .field-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
    .field-label { font-weight: 600; color: #64748b; }
    .field-val { font-weight: 700; color: #0f172a; }

    .specs-box { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 14px; margin: 20px 0; }
    .specs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th { background: ${brandHex}; color: #ffffff; font-weight: 700; text-align: left; padding: 8px 12px; font-size: 12px; text-transform: uppercase; }
    .table td { border-bottom: 1px solid #e2e8f0; padding: 8px 12px; font-size: 12px; }

    .totals-area { display: flex; justify-content: flex-end; margin: 16px 0; }
    .totals-box { width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }

    .terms-box { background: #fffbebfb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; font-size: 11px; color: #92400e; margin: 20px 0; }

    .signatures { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 40px; padding-top: 10px; }
    .sig-col { text-align: center; }
    .sig-line { border-top: 1.5px dashed #94a3b8; margin-bottom: 6px; }
    .sig-title { font-size: 11px; font-weight: 700; color: #334155; }
    .sig-sub { font-size: 10px; color: #64748b; }

    @media print {
      body { background: #ffffff; padding: 0; }
      .sheet { box-shadow: none; border: none; max-width: 100%; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 16px auto; display: flex; justify-content: flex-end; gap: 10px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: ${brandHex}; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">🖨️ Print Receipt</button>
  </div>

  <div class="sheet">
    <div class="header">
      <div>
        <h1 class="business-name">${details.sellerName}</h1>
        <div style="font-size: 12px; color: #475569;">${details.sellerAddress}</div>
        <div style="font-size: 12px; color: #475569; margin-top: 2px;">
          <strong>Phone:</strong> ${details.sellerPhone || '<span class="warning-text">REQUIRED MISSING</span>'} | 
          <strong>CNIC/NTN:</strong> ${details.sellerCnic || '<span class="warning-text">REQUIRED MISSING</span>'}
        </div>
      </div>
      <div>
        <h2 class="doc-title">${details.title}</h2>
        <div style="text-align: right; font-size: 12px; color: #64748b; margin-top: 4px;">
          <strong>Receipt #:</strong> ${invoice.invoice_number || invoice.invoiceNumber || 'DRAFT'}<br>
          <strong>Date:</strong> ${invoice.date || new Date().toLocaleDateString('en-GB')}
        </div>
      </div>
    </div>

    <!-- Parties Identification Block (Seller & Buyer Mandatory Details) -->
    <div class="grid-2">
      <!-- SELLER DETAILS -->
      <div class="party-box">
        <div class="party-title">Seller / Transferor Details (Baichnay Wala)</div>
        <div class="field-row">
          <span class="field-label">Seller Name:</span>
          <span class="field-val">${details.sellerName}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Seller Phone (Mandatory):</span>
          <span class="field-val ${missingSellerPhone ? 'warning-text' : ''}">${details.sellerPhone || 'NOT PROVIDED'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Seller CNIC (Mandatory):</span>
          <span class="field-val ${missingSellerCnic ? 'warning-text' : ''}">${details.sellerCnic || 'NOT PROVIDED'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Address:</span>
          <span class="field-val" style="font-size: 11px;">${details.sellerAddress || '-'}</span>
        </div>
      </div>

      <!-- BUYER DETAILS -->
      <div class="party-box">
        <div class="party-title">Buyer / Purchaser Details (Khareednay Wala)</div>
        <div class="field-row">
          <span class="field-label">Buyer Name:</span>
          <span class="field-val">${details.buyerName}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Buyer Phone (Mandatory):</span>
          <span class="field-val ${missingBuyerPhone ? 'warning-text' : ''}">${details.buyerPhone || 'NOT PROVIDED'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Buyer CNIC (Mandatory):</span>
          <span class="field-val ${missingBuyerCnic ? 'warning-text' : ''}">${details.buyerCnic || 'NOT PROVIDED'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Address:</span>
          <span class="field-val" style="font-size: 11px;">${details.buyerAddress || '-'}</span>
        </div>
      </div>
    </div>

    <!-- VEHICLE TECHNICAL SPECIFICATIONS -->
    <div class="specs-box">
      <div class="party-title" style="color: #6b21a8; border-color: #f3e8ff;">Vehicle Technical Specifications</div>
      <div class="specs-grid">
        <div>
          <span class="field-label">Reg Plate #:</span>
          <div class="field-val" style="font-size: 14px; font-family: monospace; color: #581c87;">${details.registrationNo}</div>
        </div>
        <div>
          <span class="field-label">Chassis / VIN #:</span>
          <div class="field-val" style="font-family: monospace;">${details.chassisNo}</div>
        </div>
        <div>
          <span class="field-label">Engine #:</span>
          <div class="field-val" style="font-family: monospace;">${details.engineNo}</div>
        </div>
        <div>
          <span class="field-label">Make & Model:</span>
          <div class="field-val">${details.makeModel} (${details.modelYear})</div>
        </div>
        <div>
          <span class="field-label">Odometer:</span>
          <div class="field-val">${details.mileage}</div>
        </div>
        <div>
          <span class="field-label">Color / Shade:</span>
          <div class="field-val">${details.color}</div>
        </div>
        <div>
          <span class="field-label">Fuel / Trans:</span>
          <div class="field-val">${details.fuelType} / ${details.transmission}</div>
        </div>
        <div>
          <span class="field-label">Token Tax:</span>
          <div class="field-val">${details.tokenTaxStatus}</div>
        </div>
        <div>
          <span class="field-label">Inspection Grade:</span>
          <div class="field-val">${details.conditionGrade}</div>
        </div>
      </div>
    </div>

    <!-- ITEMIZED TRANSACTION PARTICULARS -->
    <table class="table">
      <thead>
        <tr>
          <th>Description / Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Amount (${currency})</th>
        </tr>
      </thead>
      <tbody>
        ${
          items.length
            ? items
                .map(
                  (it) => `<tr>
              <td><strong>${it.name || it.description || 'Vehicle Sale'}</strong></td>
              <td style="text-align: center;">${it.quantity || 1}</td>
              <td style="text-align: right;">${Number(it.amount || it.unit_price || 0).toLocaleString()} ${currency}</td>
            </tr>`
                )
                .join('')
            : `<tr>
              <td><strong>${details.makeModel} (${details.registrationNo})</strong></td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">${grandTotal.toLocaleString()} ${currency}</td>
            </tr>`
        }
      </tbody>
    </table>

    <!-- TOTALS BREAKDOWN -->
    <div class="totals-area">
      <div class="totals-box">
        <div class="field-row">
          <span class="field-label">Total Agreed Price:</span>
          <span class="field-val">${grandTotal.toLocaleString()} ${currency}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Amount Received:</span>
          <span class="field-val" style="color: #16a34a;">${paidAmount.toLocaleString()} ${currency}</span>
        </div>
        <div class="field-row" style="border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 4px;">
          <span class="field-label" style="font-size: 13px;">Balance Outstanding:</span>
          <span class="field-val" style="font-size: 13px; color: ${balanceDue > 0 ? '#dc2626' : '#16a34a'};">${balanceDue.toLocaleString()} ${currency}</span>
        </div>
      </div>
    </div>

    <!-- LEGAL TERMS & CLAUSES -->
    <div class="terms-box">
      <strong>Terms & Conditions of Sale:</strong> ${details.ownershipTransferTerms}
    </div>

    <!-- FORMAL SIGNATURE BLOCKS & WITNESSES -->
    <div class="signatures">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-title">Buyer Signature</div>
        <div class="sig-sub">${details.buyerName}</div>
      </div>

      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-title">Seller / Showroom</div>
        <div class="sig-sub">${details.sellerName}</div>
      </div>

      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-title">Witness 1 (Gawaah 1)</div>
        <div class="sig-sub">${details.witness1Name || 'Name'}<br>${details.witness1Cnic || 'CNIC #'}</div>
      </div>

      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-title">Witness 2 (Gawaah 2)</div>
        <div class="sig-sub">${details.witness2Name || 'Name'}<br>${details.witness2Cnic || 'CNIC #'}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Opens a print window for the Vehicle Buyer-Seller Receipt.
 * @param {object} invoice
 * @param {object} business
 * @param {string} [category]
 */
export function printVehicleBuyerSellerReceiptHtml(invoice, business, category = 'vehicle-dealership') {
  const html = buildVehicleBuyerSellerReceiptHtml(invoice, business, category);
  const printWin = window.open('', '_blank', 'width=900,height=950,scrollbars=yes');
  if (!printWin) {
    console.warn('[vehiclePrint] Failed to open popup print window.');
    return false;
  }
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => {
    try {
      printWin.print();
    } catch (e) {
      console.warn('[vehiclePrint] window.print error', e);
    }
  }, 300);
  return true;
}
