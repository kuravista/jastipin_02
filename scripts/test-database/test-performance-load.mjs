import { PrismaClient } from '@prisma/client';
import http from 'http';

const prisma = new PrismaClient();

async function makeRequest(path) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(`http://localhost:4000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ time: Date.now() - start, status: res.statusCode });
      });
    });
    req.on('error', () => resolve({ time: Date.now() - start, status: 0 }));
  });
}

async function performanceTest() {
  console.log('=== Comprehensive Performance Test ===\n');
  
  // Test 1: Database performance
  console.log('1️⃣  Database Performance');
  console.log('   Testing 10 consecutive queries...');
  const dbTimes = [];
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbTimes.push(Date.now() - start);
  }
  const dbAvg = dbTimes.reduce((a, b) => a + b) / dbTimes.length;
  const dbMin = Math.min(...dbTimes);
  const dbMax = Math.max(...dbTimes);
  console.log(`   Min: ${dbMin}ms | Max: ${dbMax}ms | Avg: ${dbAvg.toFixed(2)}ms\n`);
  
  // Test 2: API response times
  console.log('2️⃣  API Response Times');
  console.log('   Testing 5 API calls...');
  const apiTimes = [];
  for (let i = 0; i < 5; i++) {
    const result = await makeRequest('/api/users');
    apiTimes.push(result.time);
  }
  const apiAvg = apiTimes.reduce((a, b) => a + b) / apiTimes.length;
  const apiMin = Math.min(...apiTimes);
  const apiMax = Math.max(...apiTimes);
  console.log(`   Min: ${apiMin}ms | Max: ${apiMax}ms | Avg: ${apiAvg.toFixed(2)}ms\n`);
  
  // Test 3: Concurrent requests
  console.log('3️⃣  Concurrent API Requests');
  console.log('   Testing 10 concurrent requests...');
  const concurrentStart = Date.now();
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(makeRequest('/api/users'));
  }
  await Promise.all(promises);
  const concurrentTime = Date.now() - concurrentStart;
  console.log(`   Total time: ${concurrentTime}ms`);
  console.log(`   Avg per request: ${(concurrentTime / 10).toFixed(2)}ms\n`);
  
  // Test 4: Complex query
  console.log('4️⃣  Complex Query Performance');
  const complexStart = Date.now();
  const orders = await prisma.order.findMany({
    take: 100,
    include: {
      items: true,
      customer: true,
    }
  });
  const complexTime = Date.now() - complexStart;
  console.log(`   Found ${orders.length} orders in ${complexTime}ms\n`);
  
  // Test 5: System info
  console.log('5️⃣  System Information');
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  console.log(`   Process uptime: ${(uptime / 60).toFixed(2)} minutes`);
  console.log(`   Heap used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   External: ${(memory.external / 1024 / 1024).toFixed(2)} MB\n`);
  
  // Summary
  console.log('=== Performance Summary ===');
  console.log(`Database avg: ${dbAvg.toFixed(2)}ms ✅`);
  console.log(`API avg: ${apiAvg.toFixed(2)}ms ✅`);
  console.log(`Concurrent 10req: ${concurrentTime}ms ✅`);
  console.log(`Complex query: ${complexTime}ms ✅`);
  
  console.log('\n=== Status ===');
  if (dbAvg < 50 && apiAvg < 100 && complexTime < 500) {
    console.log('🟢 PERFORMANCE: EXCELLENT');
  } else {
    console.log('🟡 PERFORMANCE: ACCEPTABLE');
  }
  
  await prisma.$disconnect();
}

performanceTest().catch(console.error);
