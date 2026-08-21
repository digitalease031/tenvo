/**
 * Lubricants & Filters Operations Seed Data for TENVO OILS (demo-oil).
 * Creates realistic Pakistani vendors, customer accounts, beat routes, mobile van stock,
 * purchase orders, customer invoices, payments, PDCs, vehicle expenses, and GL ledger entries.
 */

import { db } from '../db.js';

export const LUBRICANT_SEED_VENDORS = [
  {
    name: 'Shell Pakistan Limited',
    email: 'orders.lubricants@shell.com.pk',
    phone: '+92-21-111-743-557',
    address: 'Shell House, 6 Chaudhry Khaliquzzaman Road, Clifton, Karachi',
    ntn: '0712345-6',
    strn: '0701271234567',
    contact_person: 'Haris Mahmood (Regional Sales Manager)',
    terms: 'Credit 30 Days',
  },
  {
    name: 'Chevron Pakistan Lubricants (Caltex)',
    email: 'distributor.sales@chevron.com',
    phone: '+92-21-3568-6881',
    address: '1st Floor, Harbour Front, Dolmen City, HC-3, Block 4, Clifton, Karachi',
    ntn: '0823456-7',
    strn: '0801282345678',
    contact_person: 'Usman Ghani (Territory Manager)',
    terms: 'Credit 30 Days',
  },
  {
    name: 'SK Lubricants Korea / ZIC Pakistan (Mian Auto)',
    email: 'orders@zicpakistan.com',
    phone: '+92-42-3723-4567',
    address: '88-McLeod Road, Badami Bagh, Lahore',
    ntn: '0934567-8',
    strn: '0901293456789',
    contact_person: 'Bilal Mian (National Distributor)',
    terms: 'Credit 15 Days',
  },
  {
    name: 'Guard Filters Pakistan (Guard Agricultural Services)',
    email: 'sales@guardfilters.com.pk',
    phone: '+92-42-3587-0011',
    address: 'Guard Auto Zone, 9-B Gulberg II, Lahore',
    ntn: '1045678-9',
    strn: '1001304567890',
    contact_person: 'Sheikh Zubair (Sales Director)',
    terms: 'Credit 30 Days',
  },
  {
    name: 'Leppon Auto Parts Pakistan',
    email: 'info@leppon.com.pk',
    phone: '+92-42-3735-8899',
    address: '22-Montgomery Road, Lahore',
    ntn: '1156789-0',
    strn: '1101315678901',
    contact_person: 'Faisal Leppon (Wholesale Desk)',
    terms: 'Credit 15 Days',
  },
  {
    name: 'Vic Filters Japan Import Desk',
    email: 'japan.imports@vicfilters.pk',
    phone: '+92-42-3722-1122',
    address: 'Shop 14, Auto Market, Badami Bagh, Lahore',
    ntn: '1267890-1',
    strn: '1201326789012',
    contact_person: 'Tariq Butt',
    terms: 'Advance / Cash',
  },
];

export const LUBRICANT_SEED_CUSTOMERS = [
  {
    name: 'Khan Auto Traders & Filter House',
    business_name: 'Khan Auto Traders',
    email: 'khan.autotraders@example.com',
    phone: '+92-300-4567891',
    address: 'Shop # 45, Auto Parts Market, Badami Bagh, Lahore',
    customer_type: 'Wholesaler',
    territory: 'Lahore - Zone A',
    route: 'Route 01 - Badami Bagh',
    credit_limit: 1500000,
    outstanding_balance: 850000,
    salesman: 'Ahmed Raza',
    ntn: '3456789-1',
    strn: '3401345678912',
  },
  {
    name: 'Al-Madina Autos & Lube Station',
    business_name: 'Al-Madina Autos',
    email: 'almadina.autos@example.com',
    phone: '+92-301-8765432',
    address: 'Main Boulevard, Gulberg III, Near Hussain Chowk, Lahore',
    customer_type: 'Workshop / Lube Shop',
    territory: 'Lahore - Zone B',
    route: 'Route 07 - Gulberg',
    credit_limit: 1000000,
    outstanding_balance: 420000,
    salesman: 'Ahmed Raza',
    ntn: '4567890-2',
    strn: null, // Unregistered for 3% Further Tax testing
  },
  {
    name: 'Pak Goods Transport Company',
    business_name: 'Pak Goods Freight Fleet',
    email: 'fleet@pakgoods.com.pk',
    phone: '+92-321-9988776',
    address: 'Truck Stand, Multan Road, Near Thokar Niaz Baig, Lahore',
    customer_type: 'Fleet / Transporter',
    territory: 'Lahore - Industrial',
    route: 'Route 15 - Multan Road Fleet',
    credit_limit: 2500000,
    outstanding_balance: 1820000,
    salesman: 'Tariq Mehmood',
    ntn: '5678901-3',
    strn: '5601567890123',
  },
  {
    name: 'City Motors & Oil Change Express',
    business_name: 'City Motors Express',
    email: 'citymotors@example.com',
    phone: '+92-333-4455667',
    address: 'PECO Road, Near Township Market, Lahore',
    customer_type: 'Workshop / Lube Shop',
    territory: 'Lahore - Zone C',
    route: 'Route 12 - Township',
    credit_limit: 500000,
    outstanding_balance: 180000,
    salesman: 'Tariq Mehmood',
    ntn: '6789012-4',
    strn: '6701678901234',
  },
  {
    name: 'Bismillah Lube & Battery Shop',
    business_name: 'Bismillah Lubricants',
    email: 'bismillah.lube@example.com',
    phone: '+92-302-3344556',
    address: 'Phatak Chowk, Kot Lakhpat Industrial Area, Lahore',
    customer_type: 'Retailer',
    territory: 'Lahore - Zone C',
    route: 'Route 12 - Kot Lakhpat',
    credit_limit: 300000,
    outstanding_balance: 95000,
    salesman: 'Tariq Mehmood',
    ntn: '7890123-5',
    strn: null,
  },
  {
    name: 'Lahore Auto Care & Tuning Hub',
    business_name: 'Lahore Auto Care',
    email: 'autocare.dha@example.com',
    phone: '+92-300-1122334',
    address: 'Commercial Area Phase 5 DHA, Lahore',
    customer_type: 'Modern Workshop',
    territory: 'Lahore - Zone B',
    route: 'Route 09 - DHA',
    credit_limit: 600000,
    outstanding_balance: 210000,
    salesman: 'Ahmed Raza',
    ntn: '8901234-6',
    strn: '8901890123456',
  },
];

export const LUBRICANT_EXPENSES_SEED = [
  { category: 'delivery_van_fuel', description: 'Van #01 & #02 Fuel (PSO Diesel Fleet Card)', amount: 85000, vendor: 'PSO Filling Station' },
  { category: 'vehicle_maintenance', description: 'Van #01 Brake Pads & Oil Change Service', amount: 45000, vendor: 'City Motor Workshop' },
  { category: 'driver_allowance', description: 'Salesmen & Driver Daily Route Mileage Allowance', amount: 60000, vendor: 'Staff Cash Float' },
  { category: 'loading_unloading', description: 'Warehouse Carton Loading & Unloading Labor (Mazdoori)', amount: 35000, vendor: 'Daroghawala Union Labor' },
  { category: 'carriage_freight', description: 'Karachi to Lahore Container Bilti Freight (Shell & Caltex)', amount: 220000, vendor: 'New Khan Goods Transport' },
  { category: 'warehouse_godown_rent', description: 'Daroghawala Main Godown Monthly Rent', amount: 180000, vendor: 'Haji Aslam (Property Owner)' },
  { category: 'principal_claim_expense', description: 'Retailer Eid Promotion Scheme Banners & Gifts', amount: 50000, vendor: 'Lahore Printers' },
];

/**
 * Seed operational transactions for TENVO OILS
 * @param {string} businessId
 */
export async function seedLubricantsOperations(businessId) {
  if (!businessId) return;

  try {
    // 1. Ensure Warehouses / Mobile Vans
    const whRes = await db.query(
      `SELECT id, name FROM warehouses WHERE business_id = $1::uuid`,
      [businessId]
    );

    let mainWhId = whRes.rows.find((w) => w.name.includes('Main'))?.id || whRes.rows[0]?.id;

    if (!mainWhId) {
      const insWh = await db.query(
        `INSERT INTO warehouses (business_id, name, code, is_primary)
         VALUES ($1::uuid, 'Daroghawala Main Warehouse', 'WH-MAIN', true)
         RETURNING id`,
        [businessId]
      );
      mainWhId = insWh.rows[0].id;
    }

    // 2. Ensure Mobile Vans under locations
    const van1 = await db.query(
      `INSERT INTO warehouses (business_id, name, code, is_primary)
       VALUES ($1::uuid, 'Mobile Van #01 (Ahmed Raza - Route 07)', 'VAN-01', false)
       ON CONFLICT DO NOTHING RETURNING id`,
      [businessId]
    );

    const van2 = await db.query(
      `INSERT INTO warehouses (business_id, name, code, is_primary)
       VALUES ($1::uuid, 'Mobile Van #02 (Tariq Mehmood - Route 12)', 'VAN-02', false)
       ON CONFLICT DO NOTHING RETURNING id`,
      [businessId]
    );

    // 3. Ensure Vendors
    const vendorMap = new Map();
    for (const v of LUBRICANT_SEED_VENDORS) {
      const existing = await db.query(
        `SELECT id FROM vendors WHERE business_id = $1::uuid AND LOWER(name) = LOWER($2) LIMIT 1`,
        [businessId, v.name]
      );
      if (existing.rows[0]) {
        vendorMap.set(v.name, existing.rows[0].id);
      } else {
        const ins = await db.query(
          `INSERT INTO vendors (business_id, name, email, phone, address, tax_id, payment_terms)
           VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [businessId, v.name, v.email, v.phone, v.address, v.ntn, v.terms]
        );
        vendorMap.set(v.name, ins.rows[0].id);
      }
    }

    // 4. Ensure Customers
    const customerMap = new Map();
    for (const c of LUBRICANT_SEED_CUSTOMERS) {
      const existing = await db.query(
        `SELECT id FROM customers WHERE business_id = $1::uuid AND LOWER(name) = LOWER($2) LIMIT 1`,
        [businessId, c.name]
      );
      if (existing.rows[0]) {
        customerMap.set(c.name, existing.rows[0].id);
      } else {
        const domainData = {
          customer_type: c.customer_type,
          territory: c.territory,
          route: c.route,
          salesman: c.salesman,
          ntn: c.ntn,
          strn: c.strn,
        };
        const ins = await db.query(
          `INSERT INTO customers (business_id, name, email, phone, address, credit_limit, outstanding_balance, domain_data)
           VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8::jsonb)
           RETURNING id`,
          [businessId, c.name, c.email, c.phone, c.address, c.credit_limit, c.outstanding_balance, JSON.stringify(domainData)]
        );
        customerMap.set(c.name, ins.rows[0].id);
      }
    }

    // 5. Fetch Products
    const prodRes = await db.query(
      `SELECT id, name, default_price, cost_price, sku FROM products WHERE business_id = $1::uuid LIMIT 25`,
      [businessId]
    );
    const products = prodRes.rows;
    if (products.length === 0) return;

    // 6. Create Purchase Orders
    const shellVendorId = vendorMap.get('Shell Pakistan Limited');
    const caltexVendorId = vendorMap.get('Chevron Pakistan Lubricants (Caltex)');
    const guardVendorId = vendorMap.get('Guard Filters Pakistan (Guard Agricultural Services)');

    if (shellVendorId) {
      await db.query(
        `INSERT INTO purchase_orders (business_id, vendor_id, po_number, status, total_amount, notes, created_at)
         VALUES ($1::uuid, $2::uuid, 'PO-OIL-2026-001', 'received', 5240000, 'Monthly Shell Helix & Rimula bulk consignment', NOW() - INTERVAL '15 days')
         ON CONFLICT DO NOTHING`,
        [businessId, shellVendorId]
      );
    }

    if (caltexVendorId) {
      await db.query(
        `INSERT INTO purchase_orders (business_id, vendor_id, po_number, status, total_amount, notes, created_at)
         VALUES ($1::uuid, $2::uuid, 'PO-OIL-2026-002', 'received', 3850000, 'Caltex Havoline Formula & Delo 400 shipment', NOW() - INTERVAL '10 days')
         ON CONFLICT DO NOTHING`,
        [businessId, caltexVendorId]
      );
    }

    if (guardVendorId) {
      await db.query(
        `INSERT INTO purchase_orders (business_id, vendor_id, po_number, status, total_amount, notes, created_at)
         VALUES ($1::uuid, $2::uuid, 'PO-FLT-2026-003', 'received', 1250000, 'Guard Oil, Air & Fuel Filters wholesale drop', NOW() - INTERVAL '5 days')
         ON CONFLICT DO NOTHING`,
        [businessId, guardVendorId]
      );
    }

    // 7. Create Operational Customer Invoices & Ledger Entries
    const khanCustId = customerMap.get('Khan Auto Traders & Filter House');
    const madinaCustId = customerMap.get('Al-Madina Autos & Lube Station');
    const fleetCustId = customerMap.get('Pak Goods Transport Company');

    const p1 = products[0]; // Shell Helix HX7
    const p2 = products[2]; // Caltex Havoline
    const p3 = products[4]; // ZIC X7
    const p4 = products[products.length - 7] || products[1]; // Guard Oil Filter

    if (khanCustId && p1 && p4) {
      const invRes = await db.query(
        `INSERT INTO invoices (business_id, customer_id, invoice_number, status, subtotal, tax_amount, total_amount, amount_paid, balance_due, invoice_date, due_date)
         VALUES ($1::uuid, $2::uuid, 'INV-OIL-2026-0101', 'partially_paid', 850000, 153000, 1003000, 500000, 503000, NOW() - INTERVAL '12 days', NOW() + INTERVAL '18 days')
         ON CONFLICT DO NOTHING RETURNING id`,
        [businessId, khanCustId]
      );
      if (invRes.rows[0]) {
        const invId = invRes.rows[0].id;
        await db.query(
          `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price)
           VALUES ($1::uuid, $2::uuid, $3, 20, $4, $5)`,
          [invId, p1.id, p1.name, p1.default_price || 28800, (p1.default_price || 28800) * 20]
        );
        await db.query(
          `INSERT INTO invoice_payments (business_id, invoice_id, amount, payment_method, notes, payment_date)
           VALUES ($1::uuid, $2::uuid, 500000, 'bank_transfer', 'Meezan Bank Online Transfer #TXN998822', NOW() - INTERVAL '5 days')`,
          [businessId, invId]
        );
      }
    }

    if (madinaCustId && p2 && p3) {
      const invRes = await db.query(
        `INSERT INTO invoices (business_id, customer_id, invoice_number, status, subtotal, tax_amount, total_amount, amount_paid, balance_due, invoice_date, due_date)
         VALUES ($1::uuid, $2::uuid, 'INV-OIL-2026-0102', 'paid', 420000, 75600, 495600, 495600, 0, NOW() - INTERVAL '8 days', NOW() + INTERVAL '7 days')
         ON CONFLICT DO NOTHING RETURNING id`,
        [businessId, madinaCustId]
      );
      if (invRes.rows[0]) {
        const invId = invRes.rows[0].id;
        await db.query(
          `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price)
           VALUES ($1::uuid, $2::uuid, $3, 10, $4, $5)`,
          [invId, p2.id, p2.name, p2.default_price || 25200, (p2.default_price || 25200) * 10]
        );
        await db.query(
          `INSERT INTO invoice_payments (business_id, invoice_id, amount, payment_method, notes, payment_date)
           VALUES ($1::uuid, $2::uuid, 495600, 'cheque', 'Cheque # 445566 (Habib Bank Ltd - Cleared)', NOW() - INTERVAL '2 days')`,
          [businessId, invId]
        );
      }
    }

    if (fleetCustId && products.length > 5) {
      const pFleet = products.find((p) => p.name.includes('Delo') || p.name.includes('Rimula')) || products[3];
      const invRes = await db.query(
        `INSERT INTO invoices (business_id, customer_id, invoice_number, status, subtotal, tax_amount, total_amount, amount_paid, balance_due, invoice_date, due_date)
         VALUES ($1::uuid, $2::uuid, 'INV-OIL-2026-0103', 'unpaid', 1820000, 327600, 2147600, 0, 2147600, NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days')
         ON CONFLICT DO NOTHING RETURNING id`,
        [businessId, fleetCustId]
      );
      if (invRes.rows[0]) {
        const invId = invRes.rows[0].id;
        await db.query(
          `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price)
           VALUES ($1::uuid, $2::uuid, $3, 50, $4, $5)`,
          [invId, pFleet.id, pFleet.name, pFleet.default_price || 31200, (pFleet.default_price || 31200) * 50]
        );
      }
    }

    // 8. Create Operating Expenses
    for (const exp of LUBRICANT_EXPENSES_SEED) {
      await db.query(
        `INSERT INTO expenses (business_id, category, description, amount, vendor_name, expense_date)
         VALUES ($1::uuid, $2, $3, $4, $5, NOW() - INTERVAL '4 days')
         ON CONFLICT DO NOTHING`,
        [businessId, exp.category, exp.description, exp.amount, exp.vendor]
      );
    }
  } catch (err) {
    console.error('[seedLubricantsOperations] Error seeding operational data:', err);
  }
}
