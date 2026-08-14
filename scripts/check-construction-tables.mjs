/**
 * Check which construction tables exist in the database
 */
import pg from 'pg';

async function checkConstructionTables() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  const client = await pool.connect();
  
  try {
    console.log('🗄️  Checking construction tables in database...\n');
    
    // Check all construction tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'construction_%'
      ORDER BY table_name
    `);
    
    const existingTables = result.rows.map(r => r.table_name);
    
    console.log('✅ Found', existingTables.length, 'construction tables:\n');
    existingTables.forEach(table => console.log('   -', table));
    
    // Check expected site operations tables
    const expectedTables = [
      'construction_daily_reports',
      'construction_safety_logs',
      'construction_quality_tests',
      'construction_site_inspections'
    ];
    
    console.log('\n📋 Expected site operations tables:');
    expectedTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(exists ? '   ✅' : '   ❌', table);
    });
    
    // Check if we need to apply migrations or resolve them
    const allExist = expectedTables.every(t => existingTables.includes(t));
    
    if (allExist) {
      console.log('\n✅ All site operations tables exist!');
      console.log('📝 Recommendation: Mark migrations as applied using:');
      console.log('   npx prisma migrate resolve --applied 20260813_construction_site_operations');
      console.log('   npx prisma migrate resolve --applied 20260814_construction_site_ops');
    } else {
      console.log('\n⚠️  Some tables are missing!');
      console.log('📝 Recommendation: Apply migrations using:');
      console.log('   npx prisma migrate deploy');
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkConstructionTables().catch(console.error);
