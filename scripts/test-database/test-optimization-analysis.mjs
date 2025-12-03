import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzePerformance() {
  console.log('=== Database Performance Analysis ===\n');
  
  try {
    // Test 1: Connection pool warmup
    console.log('1️⃣  Warmup queries (setelah koneksi established)...');
    const queries = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      queries.push(Date.now() - start);
    }
    const avgWarmup = queries.reduce((a, b) => a + b) / queries.length;
    console.log(`   Query times: ${queries.map(q => q + 'ms').join(', ')}`);
    console.log(`   Average: ${avgWarmup.toFixed(2)}ms\n`);

    // Test 2: Count users (realistic query)
    console.log('2️⃣  Realistic query (COUNT users)...');
    const start = Date.now();
    const userCount = await prisma.user.count();
    const realTime = Date.now() - start;
    console.log(`   Result: ${userCount} users`);
    console.log(`   Time: ${realTime}ms\n`);

    // Test 3: Index check
    console.log('3️⃣  Checking database indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT 
        t.relname as table_name,
        i.relname as index_name,
        a.attname as column_name
      FROM pg_index ix
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_class t ON t.oid = ix.indrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      LIMIT 20
    `;
    console.log(`   Found ${indexes.length} indexes\n`);

    // Test 4: Connection pool info
    console.log('4️⃣  Current connection pool stats...');
    const poolStats = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        state,
        max_idle_in_transaction_session_duration
      FROM pg_stat_activity 
      GROUP BY state, max_idle_in_transaction_session_duration
    `;
    console.log('   Pool information:', poolStats);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzePerformance();
