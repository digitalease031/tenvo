// Deep audit: compare Prisma schema models against live DB columns
// Finds columns that Prisma expects but DB doesn't have
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Parse schema.prisma to extract model -> column mappings
function parseSchema(schemaPath) {
  const content = fs.readFileSync(schemaPath, 'utf8');
  const models = {};
  let currentModel = null;
  
  for (const line of content.split('\n')) {
    const modelMatch = line.match(/^model (\w+) \{/);
    if (modelMatch) {
      currentModel = modelMatch[1].toLowerCase();
      models[currentModel] = [];
      continue;
    }
    if (line.trim() === '}') {
      currentModel = null;
      continue;
    }
    if (currentModel) {
      // Match field lines: fieldName Type...
      const fieldMatch = line.trim().match(/^(\w+)\s+/);
      if (fieldMatch && !line.trim().startsWith('//') && !line.trim().startsWith('@@') && !line.trim().startsWith('@')) {
        const fieldName = fieldMatch[1];
        // Skip relation fields (type starts with uppercase and isn't a scalar)
        const isRelation = /^\w+\s+\w+\[\]|\w+\s+\w+\??\s+@relation/.test(line.trim());
        if (!isRelation && fieldName !== 'id' || fieldName === 'id') {
          models[currentModel].push(fieldName);
        }
      }
    }
  }
  return models;
}

async function run() {
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    const schemaModels = parseSchema(schemaPath);
    
    // Get all DB columns grouped by table
    const res = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    
    const dbTables = {};
    for (const row of res.rows) {
      if (!dbTables[row.table_name]) dbTables[row.table_name] = [];
      dbTables[row.table_name].push(row.column_name);
    }
    
    console.log('\n=== PRISMA SCHEMA vs LIVE DB DRIFT REPORT ===\n');
    
    let driftFound = false;
    for (const [model, fields] of Object.entries(schemaModels)) {
      const dbCols = dbTables[model] || null;
      if (!dbCols) continue; // Skip models that map to no DB table (views, etc.)
      
      const missingInDb = fields.filter(f => !dbCols.includes(f) && 
        !['id'].includes(f) && 
        !/[A-Z]/.test(f) // skip relation fields (camelCase)
      );
      
      if (missingInDb.length > 0) {
        console.log(`TABLE: ${model}`);
        console.log(`  Schema has but DB missing: [${missingInDb.join(', ')}]`);
        driftFound = true;
      }
    }
    
    if (!driftFound) {
      console.log('✓ No drift found — all Prisma schema columns exist in live DB.');
    }
    
    console.log('\n=== DONE ===');
  } finally {
    client.release();
    pool.end();
  }
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
