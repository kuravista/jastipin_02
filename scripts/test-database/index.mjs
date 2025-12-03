#!/usr/bin/env node

/**
 * Jastipin Database Test Suite Runner
 * 
 * Usage:
 *   node index.mjs              - Interactive menu
 *   node index.mjs --all        - Run all tests
 *   node index.mjs --quick      - Run quick tests only
 *   node index.mjs --verify     - Database verification only
 *   node index.mjs --performance - Performance tests only
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const tests = {
  verify: {
    name: 'Database Connection Verification',
    file: 'verify-new-db.mjs',
    desc: 'Test database connection and basic performance'
  },
  health: {
    name: 'API Health Check',
    file: 'test-api-health.mjs',
    desc: 'Test API server availability'
  },
  endpoints: {
    name: 'API Endpoints Testing',
    file: 'test-api-endpoints.mjs',
    desc: 'Test multiple API endpoints'
  },
  performance: {
    name: 'Comprehensive Performance Analysis',
    file: 'test-performance-final.mjs',
    desc: 'Full performance test and before/after comparison'
  },
  load: {
    name: 'Load Testing',
    file: 'test-performance-load.mjs',
    desc: 'Stress test with concurrent requests'
  },
  optimization: {
    name: 'Optimization Analysis',
    file: 'test-optimization-analysis.mjs',
    desc: 'Database optimization metrics'
  },
  supabase: {
    name: 'Supabase Connection Test',
    file: 'test-supabase-connection.mjs',
    desc: 'Direct Prisma connection test'
  }
};

const testGroups = {
  quick: ['verify', 'health'],
  standard: ['verify', 'endpoints', 'performance'],
  all: ['verify', 'health', 'endpoints', 'performance', 'load', 'optimization', 'supabase'],
  performance: ['performance', 'load', 'optimization']
};

async function runTest(testKey) {
  return new Promise((resolve) => {
    const test = tests[testKey];
    const scriptPath = join(__dirname, test.file);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`▶️  Running: ${test.name}`);
    console.log(`📄 File: ${test.file}`);
    console.log(`${test.desc}`);
    console.log(`${'='.repeat(80)}\n`);
    
    const proc = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        console.warn(`⚠️  Test exited with code ${code}`);
      }
      resolve(code);
    });
    
    proc.on('error', (err) => {
      console.error(`❌ Error running test: ${err.message}`);
      resolve(1);
    });
  });
}

async function runTests(testKeys) {
  console.log(`\n╔${'═'.repeat(78)}╗`);
  console.log(`║${'Jastipin Database Test Suite'.padEnd(78)}║`);
  console.log(`╚${'═'.repeat(78)}╝\n`);
  
  const results = {};
  let passed = 0;
  let failed = 0;
  
  for (const key of testKeys) {
    const code = await runTest(key);
    results[key] = code === 0 ? 'PASS' : 'FAIL';
    if (code === 0) passed++;
    else failed++;
  }
  
  // Print summary
  console.log(`\n${'═'.repeat(80)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'═'.repeat(80)}`);
  
  for (const key of testKeys) {
    const status = results[key] === 'PASS' ? '✅' : '❌';
    const testName = tests[key].name;
    console.log(`${status} ${testName.padEnd(50)} ${results[key]}`);
  }
  
  console.log(`${'═'.repeat(80)}`);
  console.log(`Total: ${testKeys.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`${'═'.repeat(80)}\n`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log(`⚠️  ${failed} test(s) failed`);
  }
}

async function showMenu() {
  console.log(`\n╔${'═'.repeat(78)}╗`);
  console.log(`║${'Jastipin Database Test Suite'.padEnd(78)}║`);
  console.log(`╚${'═'.repeat(78)}╝\n`);
  
  console.log('Available Tests:\n');
  
  let index = 1;
  for (const [key, test] of Object.entries(tests)) {
    console.log(`${index}. ${test.name.padEnd(50)}`);
    console.log(`   ${test.desc}\n`);
    index++;
  }
  
  console.log('Quick Options:\n');
  console.log('q  - Quick tests (Database + API Health)');
  console.log('p  - Performance tests only');
  console.log('a  - Run all tests');
  console.log('x  - Exit\n');
  
  console.log('Examples:');
  console.log('  node index.mjs --all              - Run all tests');
  console.log('  node index.mjs --quick            - Run quick tests');
  console.log('  node index.mjs --performance      - Run performance tests');
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  await showMenu();
} else {
  const arg = args[0].toLowerCase();
  
  if (arg === '--all') {
    await runTests(testGroups.all);
  } else if (arg === '--quick') {
    await runTests(testGroups.quick);
  } else if (arg === '--performance') {
    await runTests(testGroups.performance);
  } else if (arg === '--verify') {
    await runTests(['verify']);
  } else if (arg === '--standard') {
    await runTests(testGroups.standard);
  } else {
    console.log('Unknown option:', arg);
    console.log('\nUsage:');
    console.log('  node index.mjs              - Show menu');
    console.log('  node index.mjs --all        - Run all tests');
    console.log('  node index.mjs --quick      - Quick tests');
    console.log('  node index.mjs --performance - Performance tests');
    console.log('  node index.mjs --verify     - Verify database');
  }
}
