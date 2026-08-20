import { generatePurchaseOrderPdf } from '../lib/pdf/purchaseOrderPdf.js';
import fs from 'fs';

const samplePurchase = {
  purchase_number: 'PO-2608-5798',
  date: '2026-08-09T00:00:00.000Z',
  status: 'draft',
  vendor_name: 'National Suppliers Co.',
  vendor_email: 'supply@example.com',
  vendor_phone: '+923001234567',
  vendor_address: 'Plot 45, Industrial Zone',
  vendor_city: 'Karachi',
  warehouse_name: 'Primary Warehouse',
  warehouse_address: 'Karachi, Pakistan',
  subtotal: 204.00,
  tax_total: 32.64,
  total_amount: 236.64,
  notes: 'Deliver before 5 PM on weekdays.',
  items: [
    {
      id: '1',
      product_name: 'All Cheese',
      product_sku: 'RIN-8460',
      batch_number: null,
      quantity: 1,
      unit_cost: 204.00,
      total_amount: 236.64,
    }
  ]
};

const sampleBusiness = {
  name: 'STORE / BUSINESS',
  address: 'Plot 12, Main Commercial Area',
  city: 'Karachi',
  country: 'Pakistan',
  phone: '+923001234567',
  email: 'zeeshan.keerio@mindscapeanalytics.com',
  ntn: '1234567-8',
  currency: 'PKR',
};

const doc = generatePurchaseOrderPdf({
  purchase: samplePurchase,
  business: sampleBusiness,
  currency: 'PKR',
});

const pdfArrayBuffer = doc.output('arraybuffer');
fs.writeFileSync('sample_purchase_order.pdf', Buffer.from(pdfArrayBuffer));
console.log('Successfully generated sample_purchase_order.pdf! Size:', pdfArrayBuffer.byteLength, 'bytes');
