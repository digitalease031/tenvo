// Audit all key tables for missing soft-delete and other important columns
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const TABLES_TO_CHECK = [
  'products', 'customers', 'invoices', 'invoice_items',
  'purchases', 'purchase_items', 'expenses', 'payments',
  'pos_transactions', 'quotations', 'credit_notes', 'journal_entries',
  'gl_accounts', 'stock_movements', 'product_variants', 'product_batches',
  'product_serials', 'warehouse_locations', 'pos_sessions', 'pos_terminals',
  'vendors', 'sales_orders', 'delivery_challans', 'purchase_returns',
  'invoice_payments', 'business_users', 'businesses', 'user_profiles',
];

async function run() {
  const client = await pool.connect();
  const issues = [];
  try {
    for (const table of TABLES_TO_CHECK) {
      const res = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
        [table]
      );
      if (res.rows.length === 0) {
        issues.push(`TABLE MISSING: ${table}`);
        continue;
      }
      const cols = res.rows.map(r => r.column_name);
      const missing = [];
      if (!cols.includes('is_deleted')) missing.push('is_deleted');
      if (!cols.includes('is_active')) missing.push('is_active');
      if (missing.length > 0) {
        issues.push(`${table}: MISSING [${missing.join(', ')}] | HAS [${cols.slice(0,8).join(', ')}...]`);
      }
    }
    if (issues.length === 0) {
      console.log('All tables have is_deleted and is_active columns.');
    } else {
      console.log('ISSUES FOUND:\n' + issues.join('\n'));
    }
  } finally {
    client.release();
    pool.end();
  }
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
