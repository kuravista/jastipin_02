import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});

async function testNewDatabase() {
  console.log('=== Testing New Database Connection ===\n');
  
  try {
    // Test 1: Basic connection
    console.log('1️⃣  Testing basic connection...');
    const start1 = Date.now();
    const result1 = await prisma.$queryRaw`SELECT NOW() as server_time, 1 as test`;
    const time1 = Date.now() - start1;
    console.log(`✅ First query: ${time1}ms`);
    console.log(`   Result: ${result1[0].server_time}\n`);

    // Test 2: Warmup queries
    console.log('2️⃣  Running warmup queries...');
    const times = [];
    for (let i = 0; i < 5; i++) {
      const s = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      times.push(Date.now() - s);
    }
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    console.log(`   Times: ${times.map(t => t + 'ms').join(', ')}`);
    console.log(`   Average: ${avgTime.toFixed(2)}ms\n`);

    // Test 3: User count
    console.log('3️⃣  Checking user data...');
    const startUser = Date.now();
    const userCount = await prisma.user.count();
    const userTime = Date.now() - startUser;
    console.log(`✅ User count: ${userCount} users (${userTime}ms)\n`);

    // Test 4: Check database info
    console.log('4️⃣  Database information...');
    const dbInfo = await prisma.$queryRaw`
      SELECT current_database() as db_name, 
             version() as pg_version,
             inet_server_addr() as server_ip
    `;
    console.log('   Database:', dbInfo[0].db_name);
    console.log('   PostgreSQL:', dbInfo[0].pg_version.split(',')[0]);
    console.log('   Server IP:', dbInfo[0].server_ip || 'N/A');
    console.log();

    // Test 5: Connection string validation
    console.log('5️⃣  Connection string validation...');
    const connString = process.env.DATABASE_URL;
    if (connString) {
      const url = new URL(connString);
      console.log(`   Host: ${url.hostname}`);
      console.log(`   Port: ${url.port}`);
      console.log(`   Database: ${url.pathname.split('/')[1]}`);
      
      // Validate it's not Sydney anymore
      if (url.hostname.includes('ap-southeast-2')) {
        console.log('   ⚠️  WARNING: Still pointing to Sydney (ap-southeast-2)');
      } else if (url.hostname.includes('ap-southeast-1')) {
        console.log('   ✅ GOOD: Pointing to Jakarta (ap-southeast-1)');
      } else {
        console.log('   ℹ️  Region:', url.hostname);
      }
    }
    console.log();

    console.log('=== Summary ===');
    console.log(`✅ New database connection successful!`);
    console.log(`⏱️  First query latency: ${time1}ms`);
    console.log(`⏱️  Average query latency: ${avgTime.toFixed(2)}ms`);
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Performance assessment
    console.log('\n=== Performance Assessment ===');
    if (time1 < 800) {
      console.log('✅ First query time is EXCELLENT (< 800ms)');
    } else if (time1 < 1200) {
      console.log('✅ First query time is GOOD (< 1200ms)');
    } else {
      console.log('⚠️  First query time is HIGH (> 1200ms)');
    }

    if (avgTime < 200) {
      console.log('✅ Average query time is EXCELLENT (< 200ms)');
    } else if (avgTime < 300) {
      console.log('✅ Average query time is GOOD (< 300ms)');
    } else {
      console.log('⚠️  Average query time is HIGH (> 300ms)');
    }

  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testNewDatabase();
