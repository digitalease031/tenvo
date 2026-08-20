// Deep audit: check key action files for potential Prisma column issues
// and verify all tables referenced match the live DB schema
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const KEY_TABLES = [
  'customers', 'invoices', 'invoice_items', 'purchases', 'purchase_items',
  'expenses', 'payments', 'pos_transactions', 'quotations', 'credit_notes',
  'journal_entries', 'gl_accounts', 'stock_movements', 'product_variants',
  'product_batches', 'product_serials', 'warehouse_locations', 'pos_sessions',
  'pos_terminals', 'vendors', 'sales_orders', 'delivery_challans',
  'purchase_returns', 'invoice_payments', 'business_users', 'businesses',
  'products', 'stock_transfers',
];

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_name, column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY($1::text[])
      ORDER BY table_name, ordinal_position
    `, [KEY_TABLES]);

    const tableMap = {};
    for (const row of res.rows) {
      if (!tableMap[row.table_name]) tableMap[row.table_name] = [];
      tableMap[row.table_name].push({
        col: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default,
      });
    }

    const CHECK_COLS = ['is_deleted', 'is_active', 'deleted_at', 'business_id', 'created_at', 'updated_at'];
    
    console.log('\n=== COLUMN STATUS REPORT ===\n');
    console.log(KEY_TABLES.map(t => {
      const cols = tableMap[t];
      if (!cols) return `❌ TABLE MISSING: ${t}`;
      const status = CHECK_COLS.map(c => {
        const found = cols.find(r => r.col === c);
        return found ? `✓${c}` : `✗${c}`;
      }).join(' ');
      return `${t.padEnd(30)} ${status}`;
    }).join('\n'));

    // Find nullable booleans that should default to false/true
    console.log('\n=== NULLABLE BOOLEAN COLUMNS (potential NULL filter issues) ===\n');
    for (const [table, cols] of Object.entries(tableMap)) {
      const badBools = cols.filter(c => 
        ['is_deleted', 'is_active'].includes(c.col) && 
        c.nullable && 
        !c.default
      );
      if (badBools.length > 0) {
        console.log(`${table}: ${badBools.map(b => `${b.col} (nullable, no default)`).join(', ')}`);
      }
    }

    console.log('\n=== DONE ===');
  } finally {
    client.release();
    pool.end();
  }
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
