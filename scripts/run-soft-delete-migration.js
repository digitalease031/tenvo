// Run the soft-delete columns migration against the live DB
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SQL = fs.readFileSync(
  path.join(__dirname, '../prisma/migrations/20260820_ensure_soft_delete_columns/migration.sql'),
  'utf8'
);

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running soft-delete columns migration...');
    await client.query(SQL);
    console.log('Migration complete.');

    // Verify
    const tables = [
      'invoices','invoice_items','purchases','purchase_items','expenses','payments',
      'pos_transactions','quotations','credit_notes','journal_entries','gl_accounts',
      'stock_movements','product_serials','warehouse_locations','pos_sessions',
      'pos_terminals','sales_orders','delivery_challans','purchase_returns',
      'invoice_payments','business_users','businesses'
    ];
    const missing = [];
    for (const table of tables) {
      const res = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
        [table]
      );
      const cols = res.rows.map(r => r.column_name);
      if (!cols.includes('is_deleted')) missing.push(`${table}.is_deleted`);
      if (!cols.includes('is_active')) missing.push(`${table}.is_active`);
    }
    if (missing.length === 0) {
      console.log('✓ All tables now have is_deleted and is_active columns.');
    } else {
      console.log('STILL MISSING:', missing.join(', '));
    }
  } finally {
    client.release();
    pool.end();
  }
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
