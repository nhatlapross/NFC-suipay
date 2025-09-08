const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:8080';
const TEST_TOKEN = 'your-test-jwt-token'; // Get this from login

async function testFastValidation() {
  console.log('🧪 Testing Fast NFC Validation Endpoint...\n');

  // Test data
  const testData = {
    cardUuid: 'test-card-12345',
    amount: 50000,
    terminalId: 'terminal-001',
    merchantId: 'merchant-001'
  };

  try {
    // Test 1: Basic Fast Validation
    console.log('🔥 Test 1: Basic Fast Validation');
    const start1 = Date.now();
    
    const response1 = await axios.post(
      `${BASE_URL}/api/payment/fast-validate`,
      testData,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const time1 = Date.now() - start1;
    console.log(`✅ Response time: ${time1}ms`);
    console.log(`📋 Result: ${response1.data.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`🔐 Authorized: ${response1.data.authorized}`);
    
    if (time1 < 500) {
      console.log('🚀 EXCELLENT: < 500ms target achieved!');
    } else {
      console.log('⚠️  SLOW: > 500ms - needs optimization');
    }

    // Test 2: Cache Hit Performance
    console.log('\n🔥 Test 2: Cache Hit Performance');
    const start2 = Date.now();
    
    const response2 = await axios.post(
      `${BASE_URL}/api/payment/fast-validate`,
      testData,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const time2 = Date.now() - start2;
    console.log(`✅ Cache hit response time: ${time2}ms`);
    console.log(`📦 From cache: ${response2.data.fromCache}`);
    
    if (time2 < 100) {
      console.log('🚀 EXCELLENT: Cache hit < 100ms!');
    }

    // Test 3: Load Test (10 concurrent requests)
    console.log('\n🔥 Test 3: Concurrent Load Test (10 requests)');
    const startLoad = Date.now();
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const testDataCopy = { ...testData, amount: testData.amount + i };
      promises.push(
        axios.post(
          `${BASE_URL}/api/payment/fast-validate`,
          testDataCopy,
          {
            headers: {
              'Authorization': `Bearer ${TEST_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        )
      );
    }
    
    const responses = await Promise.all(promises);
    const loadTime = Date.now() - startLoad;
    const avgTime = loadTime / 10;
    
    console.log(`✅ 10 concurrent requests completed in: ${loadTime}ms`);
    console.log(`📊 Average response time: ${avgTime.toFixed(2)}ms`);
    
    const successCount = responses.filter(r => r.data.success).length;
    console.log(`✅ Success rate: ${successCount}/10 (${(successCount/10*100)}%)`);

    // Test 4: Pre-warm Cache
    console.log('\n🔥 Test 4: Pre-warm Cache');
    const startPrewarm = Date.now();
    
    const prewarmResponse = await axios.post(
      `${BASE_URL}/api/payment/pre-warm-cache`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const prewarmTime = Date.now() - startPrewarm;
    console.log(`✅ Pre-warm completed in: ${prewarmTime}ms`);
    console.log(`📦 Items cached: ${prewarmResponse.data.itemsCached}`);

    // Test 5: Health Check
    console.log('\n🔥 Test 5: Health Check');
    const healthResponse = await axios.get(`${BASE_URL}/api/payment/health`);
    console.log(`✅ Health status: ${healthResponse.data.status}`);
    console.log(`📊 Services: ${JSON.stringify(healthResponse.data.services)}`);

    console.log('\n🎉 All Fast Validation tests completed successfully!');
    
    // Performance Summary
    console.log('\n📊 PERFORMANCE SUMMARY:');
    console.log(`First request: ${time1}ms`);
    console.log(`Cache hit: ${time2}ms`);
    console.log(`Average concurrent: ${avgTime.toFixed(2)}ms`);
    console.log(`Pre-warm: ${prewarmTime}ms`);
    
    if (time1 < 500 && time2 < 100) {
      console.log('🏆 PERFORMANCE TARGET ACHIEVED!');
    } else {
      console.log('⚠️  Performance needs optimization');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 TIP: Make sure to set a valid JWT token in TEST_TOKEN');
      console.log('You can get a token by calling the login endpoint first:');
      console.log('POST http://localhost:8080/api/auth/login');
      console.log('with body: { "email": "your-email", "password": "your-password" }');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 TIP: Make sure the server is running (npm run dev)');
    }
  }
}

// Add helper to get auth token
async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com', // Update with test credentials
      password: 'password123'
    });
    
    console.log('✅ Got auth token:', response.data.token);
    return response.data.token;
  } catch (error) {
    console.error('❌ Failed to get auth token:', error.response?.data || error.message);
    return null;
  }
}

// Main execution
async function main() {
  // Try to get auth token first if not set
  if (TEST_TOKEN === 'your-test-jwt-token') {
    console.log('🔐 Attempting to get auth token first...');
    const token = await getAuthToken();
    if (token) {
      TEST_TOKEN = token;
    }
  }
  
  await testFastValidation();
}

main();