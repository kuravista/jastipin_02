const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});

async function testConnection() {
  console.log('=== Testing Supabase Connection ===\n');
  
  const startTime = Date.now();
  
  try {
    console.log('1. Testing connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    const latency = Date.now() - startTime;
    
    console.log(`✅ Connection successful!`);
    console.log(`⏱️  Latency: ${latency}ms`);
    console.log(`📊 Query result:`, result);
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
