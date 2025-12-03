import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

async function testConnection() {
  console.log('=== Testing Supabase Connection ===\n');
  
  const startTime = Date.now();
  
  try {
    console.log('1. Testing raw SQL query...');
    const result = await prisma.$queryRaw`SELECT NOW() as server_time, 1 as test`;
    const latency = Date.now() - startTime;
    
    console.log(`\n✅ Connection successful!`);
    console.log(`⏱️  Total latency: ${latency}ms`);
    console.log(`📊 Query result:`, result);
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
