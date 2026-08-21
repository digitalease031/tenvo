/**
 * Sanity-check Car Dealership (vehicle-dealership) Buyer-Seller Receipt,
 * mandatory Buyer/Seller Phone and CNIC, PDF generation, and HTML print template.
 * Run: bun run verify:dealership-receipt or node scripts/verify-dealership-buyer-seller-receipt.mjs
 */
import assert from 'node:assert/strict';
import { resolveInvoiceDocumentTitle } from '../lib/pdf/invoiceFormat.js';
import { buildInvoicePDFDoc } from '../lib/pdf/invoicePdfCore.js';
import {
  resolveVehicleAgreementDetails,
  buildVehicleBuyerSellerReceiptHtml,
} from '../lib/print/vehicleBuyerSellerReceiptHtml.js';

// 1. Check document title resolution for automotive transaction modes
assert.equal(
  resolveInvoiceDocumentTitle({ category: 'vehicle-dealership', transactionMode: 'sale' }),
  'VEHICLE SALES AGREEMENT & DELIVERY RECEIPT'
);
assert.equal(
  resolveInvoiceDocumentTitle({ category: 'vehicle-dealership', transactionMode: 'purchase' }),
  'VEHICLE TRADE-IN & PURCHASE RECEIPT'
);
assert.equal(
  resolveInvoiceDocumentTitle({ category: 'vehicle-dealership', transactionMode: 'rental' }),
  'VEHICLE RENTAL & LEASE AGREEMENT'
);

// 2. Check Vehicle Agreement details normalization with mandatory Phone & CNIC fallbacks
const sampleInvoice = {
  invoice_number: 'INV-DEAL-001',
  date: '2026-08-21',
  grand_total: 4500000,
  currency: 'PKR',
  customer: {
    name: 'Tariq Mehmood',
    phone: '0300-9876543',
    cnic: '35202-1234567-1',
    address: 'Gulberg III, Lahore',
  },
  vehicleAgreement: {
    transactionMode: 'sale',
    registrationNo: 'LEC-2025-9981',
    chassisNo: 'NZE140-9012345',
    engineNo: '2ZR-1234567',
    mileage: '32000',
    makeModel: 'Toyota Corolla Altis Grande 1.8',
    modelYear: '2024',
    color: 'Super White',
    buyerName: 'Tariq Mehmood',
    buyerPhone: '0300-9876543',
    buyerCnic: '35202-1234567-1',
    sellerName: 'Tenvo Motors Showroom',
    sellerPhone: '0321-7766554',
    sellerCnic: '35201-8899000-5',
    witness1Name: 'Muhammad Ali',
    witness1Cnic: '35202-7711223-9',
    witness1Phone: '0301-4455667',
    witness2Name: 'Usman Farooq',
    witness2Cnic: '35202-8822334-1',
    witness2Phone: '0333-1122334',
  },
  items: [
    {
      name: 'Toyota Corolla Altis Grande 1.8 (2024)',
      quantity: 1,
      unit_price: 4500000,
      amount: 4500000,
    },
  ],
};

const sampleBusiness = {
  id: 'biz-dealership-01',
  name: 'Tenvo Motors Showroom',
  phone: '0321-7766554',
  cnic: '35201-8899000-5',
  address: 'Main Boulevard, Gulberg III',
  city: 'Lahore',
  country: 'Pakistan',
  category: 'vehicle-dealership',
};

const normalized = resolveVehicleAgreementDetails(sampleInvoice, sampleBusiness);
assert.equal(normalized.sellerName, 'Tenvo Motors Showroom');
assert.equal(normalized.sellerPhone, '0321-7766554');
assert.equal(normalized.sellerCnic, '35201-8899000-5');
assert.equal(normalized.buyerName, 'Tariq Mehmood');
assert.equal(normalized.buyerPhone, '0300-9876543');
assert.equal(normalized.buyerCnic, '35202-1234567-1');
assert.equal(normalized.registrationNo, 'LEC-2025-9981');
assert.equal(normalized.chassisNo, 'NZE140-9012345');

// 3. Test HTML Buyer-Seller Receipt Generation
const html = buildVehicleBuyerSellerReceiptHtml(sampleInvoice, sampleBusiness, 'vehicle-dealership');
assert.ok(html.includes('VEHICLE SALES AGREEMENT &amp; BUYER-SELLER DELIVERY RECEIPT') || html.includes('BUYER-SELLER DELIVERY RECEIPT'));
assert.ok(html.includes('0300-9876543'), 'HTML receipt contains Buyer Phone');
assert.ok(html.includes('35202-1234567-1'), 'HTML receipt contains Buyer CNIC');
assert.ok(html.includes('0321-7766554'), 'HTML receipt contains Seller Phone');
assert.ok(html.includes('35201-8899000-5'), 'HTML receipt contains Seller CNIC');
assert.ok(html.includes('LEC-2025-9981'), 'HTML receipt contains Reg Plate No');
assert.ok(html.includes('Witness 1 (Gawaah 1)'), 'HTML receipt contains Witness 1 block');

// 4. Test jsPDF Doc Creation
const pdfDoc = buildInvoicePDFDoc(
  {
    ...sampleInvoice,
    category: 'vehicle-dealership',
    invoiceNumber: sampleInvoice.invoice_number,
    business: sampleBusiness,
    totals: { subtotal: 4500000, total: 4500000 },
  },
  true
);
assert.ok(pdfDoc, 'jsPDF document created successfully');

console.log('verify-dealership-buyer-seller-receipt: ok');
