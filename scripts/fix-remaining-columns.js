// Fix remaining column gaps: stock_transfers + add missing deleted_at/updated_at
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log('Fixing remaining column gaps...');

    // stock_transfers: missing is_deleted, is_active
    await client.query(`
      ALTER TABLE stock_transfers
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ
    `);
    console.log('✓ stock_transfers: is_deleted, is_active, deleted_at added');

    // invoice_items: add deleted_at, updated_at for completeness
    await client.query(`
      ALTER TABLE invoice_items
        ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW()
    `);
    console.log('✓ invoice_items: deleted_at, updated_at added');

    // purchase_items: add deleted_at, updated_at
    await client.query(`
      ALTER TABLE purchase_items
        ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW()
    `);
    console.log('✓ purchase_items: deleted_at, updated_at added');

    // pos_transactions: add deleted_at, updated_at
    await client.query(`
      ALTER TABLE pos_transactions
        ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW()
    `);
    console.log('✓ pos_transactions: deleted_at, updated_at added');

    // pos_sessions: add created_at, updated_at, deleted_at
    await client.query(`
      ALTER TABLE pos_sessions
        ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ
    `);
    console.log('✓ pos_sessions: created_at, updated_at, deleted_at added');

    // stock_movements: add deleted_at, updated_at
    await client.query(`
      ALTER TABLE stock_movements
        ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW()
    `);
    console.log('✓ stock_movements: deleted_at, updated_at added');

    // Performance indexes for stock_transfers
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_transfers_deleted ON stock_transfers (business_id, is_deleted)
    `);
    console.log('✓ stock_transfers index added');

    console.log('\nAll gaps fixed successfully.');
  } finally {
    client.release();
    pool.end();
  }
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
