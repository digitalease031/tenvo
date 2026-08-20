// Check and fix vendors table columns
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    // 1. Check existing columns
    const colRes = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'vendors'
      ORDER BY ordinal_position
    `);
    console.log('Current vendors columns:', colRes.rows.map(r => r.column_name).join(', '));

    // 2. Add missing columns idempotently
    await client.query(`
      ALTER TABLE vendors
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ
    `);
    console.log('Columns ensured: is_active, is_deleted, deleted_at');

    // 3. Backfill existing rows
    const upd = await client.query(`
      UPDATE vendors
      SET is_active = true, is_deleted = false
      WHERE is_active IS NULL OR is_deleted IS NULL
    `);
    console.log('Backfilled rows:', upd.rowCount);

    // 4. Confirm
    const after = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'vendors'
      ORDER BY ordinal_position
    `);
    console.log('After columns:', after.rows.map(r => r.column_name).join(', '));
    console.log('Done.');
  } finally {
    client.release();
    pool.end();
  }
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
