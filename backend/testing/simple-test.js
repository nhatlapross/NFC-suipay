// Simple test script for merchant endpoints
const http = require('http');

// Test data
const merchantData = {
  merchantName: 'Test Coffee Shop',
  businessType: 'Food & Beverage',
  email: `test-${Date.now()}@example.com`,
  phoneNumber: '+1234567890',
  address: {
    street: '123 Test Street',
    city: 'San Francisco', 
    state: 'CA',
    country: 'USA',
    postalCode: '94105'
  },
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef1234567890abcdef',
  webhookUrl: 'https://webhook.example.com/test'
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testMerchantRegistration() {
  console.log('\n🧪 Testing Merchant Registration...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/merchants/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, merchantData);
    
    if (response.status === 201) {
      console.log('✅ Merchant registration successful!');
      console.log(`📧 Email: ${response.data.data.email}`);
      console.log(`🆔 Merchant ID: ${response.data.data.merchantId}`);
      console.log(`🔑 Public Key: ${response.data.data.apiKeys.publicKey}`);
      return response.data.data;
    } else {
      console.log('❌ Registration failed');
      console.log(`Status: ${response.status}`);
      console.log('Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    return null;
  }
}

async function testPublicMerchantInfo(merchantId) {
  console.log('\n🧪 Testing Public Merchant Info...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/merchants/public/${merchantId}`,
    method: 'GET'
  };

  try {
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Public merchant info retrieved!');
      console.log('Data:', JSON.stringify(response.data.data, null, 2));
      return true;
    } else {
      console.log('❌ Failed to get public info');
      console.log(`Status: ${response.status}`);
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Public info error:', error.message);
    return false;
  }
}

async function testMerchantProfile(apiKeys) {
  console.log('\n🧪 Testing Merchant Profile (Authenticated)...');
  
  const auth = Buffer.from(`${apiKeys.publicKey}:${apiKeys.secretKey}`).toString('base64');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/merchants/profile',
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Merchant profile retrieved!');
      console.log(`👤 Name: ${response.data.data.merchantName}`);
      console.log(`📧 Email: ${response.data.data.email}`);
      console.log(`✅ Active: ${response.data.data.isActive}`);
      return true;
    } else {
      console.log('❌ Failed to get profile');
      console.log(`Status: ${response.status}`);
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Profile error:', error.message);
    return false;
  }
}

async function testInvalidAuth() {
  console.log('\n🧪 Testing Invalid Authentication...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/merchants/profile',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid:credentials'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.status === 401) {
      console.log('✅ Invalid auth properly rejected!');
      console.log(`🔒 Status: ${response.status}`);
      console.log(`❌ Error: ${response.data.error}`);
      return true;
    } else {
      console.log('❌ Should have failed auth but didn\'t');
      console.log(`Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Auth test error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 MERCHANT API BASIC TESTS');
  console.log('============================');
  
  let passed = 0;
  let total = 0;
  
  // Test 1: Merchant Registration
  total++;
  const merchantData = await testMerchantRegistration();
  if (merchantData) passed++;
  
  if (merchantData) {
    // Test 2: Public Merchant Info
    total++;
    const publicInfoResult = await testPublicMerchantInfo(merchantData.merchantId);
    if (publicInfoResult) passed++;
    
    // Test 3: Authenticated Profile
    total++;
    const profileResult = await testMerchantProfile(merchantData.apiKeys);
    if (profileResult) passed++;
  }
  
  // Test 4: Invalid Authentication
  total++;
  const invalidAuthResult = await testInvalidAuth();
  if (invalidAuthResult) passed++;
  
  console.log('\n📊 TEST RESULTS');
  console.log('================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`🎯 Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
  
  if (merchantData) {
    console.log('\n📋 CREATED TEST DATA:');
    console.log(`🆔 Merchant ID: ${merchantData.merchantId}`);
    console.log(`📧 Email: ${merchantData.email}`);
  }
  
  console.log('\n🎉 Basic tests completed!');
}

// Run the tests
runTests().catch(console.error);