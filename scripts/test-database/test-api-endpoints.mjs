import http from 'http';

async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = http.get(`http://localhost:4000${path}`, { timeout: 5000 }, (res) => {
      const latency = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          latency,
          size: data.length,
          description
        });
      });
    });
    
    req.on('error', (error) => {
      const latency = Date.now() - startTime;
      resolve({
        path,
        status: 'ERROR',
        message: error.message,
        latency,
        description
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const latency = Date.now() - startTime;
      resolve({
        path,
        status: 'TIMEOUT',
        latency,
        description
      });
    });
  });
}

async function runTests() {
  console.log('=== API Endpoint Testing ===\n');
  
  const endpoints = [
    { path: '/api/users', desc: 'Get users list' },
    { path: '/api/health', desc: 'Health check' },
    { path: '/api/orders', desc: 'Get orders' },
  ];
  
  const results = [];
  for (const ep of endpoints) {
    const result = await testEndpoint(ep.path, ep.desc);
    results.push(result);
    console.log(`${result.description}`);
    console.log(`  Path: ${result.path}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Latency: ${result.latency}ms`);
    if (result.size) console.log(`  Response size: ${result.size} bytes`);
    console.log();
  }
  
  // Summary
  const successful = results.filter(r => r.status === 200 || r.status === 404).length;
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  
  console.log('=== API Test Summary ===');
  console.log(`Successful requests: ${successful}/${results.length}`);
  console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
}

runTests().catch(console.error);
