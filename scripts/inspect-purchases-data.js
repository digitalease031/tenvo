// Inspect purchases table rows and column values
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT id, purchase_number, vendor_id, date, total_amount, subtotal, status, is_deleted, created_at
      FROM purchases
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log('\n=== PURCHASES TABLE ROWS ===\n');
    console.log(JSON.stringify(res.rows, null, 2));

    // Also check purchase_items for these POs
    const itemsRes = await client.query(`
      SELECT id, purchase_id, product_id, description, quantity, unit_cost, tax_rate, total_amount
      FROM purchase_items
      LIMIT 10
    `);
    console.log('\n=== PURCHASE_ITEMS TABLE ROWS ===\n');
    console.log(JSON.stringify(itemsRes.rows, null, 2));

  } finally {
    client.release();
    pool.end();
  }
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
