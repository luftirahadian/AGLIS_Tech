#!/usr/bin/env node

const http = require('http');

const API_URL = 'localhost';
const API_PORT = 3001;

async function makeRequest(num) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: API_URL,
      port: API_PORT,
      path: '/api/packages',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const headers = res.headers;
        resolve({
          num,
          status: res.statusCode,
          limit: headers['ratelimit-limit'],
          remaining: headers['ratelimit-remaining'],
          reset: headers['ratelimit-reset']
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function testRateLimit() {
  console.log('🧪 Testing Rate Limiter...\n');
  console.log('Configuration: 100 requests per 15 minutes\n');
  console.log('Making 105 requests to /api/packages...\n');
  
  for (let i = 1; i <= 105; i++) {
    try {
      const result = await makeRequest(i);
      
      // Show every 10 requests
      if (i % 10 === 0 || i <= 5 || result.status === 429) {
        console.log(`Request #${result.num}:`);
        console.log(`  Status: ${result.status}`);
        console.log(`  Limit: ${result.limit}`);
        console.log(`  Remaining: ${result.remaining}`);
        console.log(`  Reset in: ${result.reset}s`);
        
        if (result.status === 429) {
          console.log('  ❌ RATE LIMITED! (As expected)');
        } else {
          console.log('  ✅ OK');
        }
        console.log('');
      }
      
      // Stop if rate limited
      if (result.status === 429) {
        console.log('✅ Rate limiter is working correctly!');
        console.log('   API blocked after reaching the limit.\n');
        break;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 10));
      
    } catch (error) {
      console.error(`Error on request ${i}:`, error.message);
      break;
    }
  }
}

testRateLimit().then(() => {
  console.log('Test completed!');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});


