const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/merchants';
let testMerchantData = null;
let testApiKeys = null;

// Test data
const merchantRegistrationData = {
  merchantName: 'Test Coffee Shop',
  businessType: 'Food & Beverage',
  email: `test-merchant-${Date.now()}@example.com`,
  phoneNumber: '+1234567890',
  address: {
    street: '123 Test Street',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    postalCode: '94105'
  },
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef1234567890abcdef',
  webhookUrl: 'https://webhook-test.example.com/webhook',
  settlementPeriod: 'daily'
};

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

// Test functions
async function test1_RegisterMerchant() {
  console.log('\n🧪 Test 1: Merchant Registration');
  console.log('==========================================');
  
  const result = await apiRequest('POST', '/register', merchantRegistrationData);
  
  if (result.success) {
    console.log('✅ Merchant registration successful');
    console.log(`📧 Email: ${result.data.data.email}`);
    console.log(`🆔 Merchant ID: ${result.data.data.merchantId}`);
    console.log(`🔑 Public Key: ${result.data.data.apiKeys.publicKey}`);
    console.log(`🔐 Secret Key: ${result.data.data.apiKeys.secretKey.substring(0, 20)}...`);
    
    // Store for later tests
    testMerchantData = result.data.data;
    testApiKeys = result.data.data.apiKeys;
    
    return true;
  } else {
    console.log('❌ Merchant registration failed');
    console.log('Error:', result.error);
    return false;
  }
}

async function test2_GetPublicMerchantInfo() {
  console.log('\n🧪 Test 2: Get Public Merchant Info');
  console.log('==========================================');
  
  if (!testMerchantData) {
    console.log('❌ No merchant data available');
    return false;
  }
  
  const result = await apiRequest('GET', `/public/${testMerchantData.merchantId}`);
  
  if (result.success) {
    console.log('✅ Public merchant info retrieved successfully');
    console.log(`📊 Data:`, JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to get public merchant info');
    console.log('Error:', result.error);
    return false;
  }
}

async function test3_GetMerchantProfile() {
  console.log('\n🧪 Test 3: Get Merchant Profile (Authenticated)');
  console.log('==========================================');
  
  if (!testApiKeys) {
    console.log('❌ No API keys available');
    return false;
  }
  
  const authHeader = `Bearer ${testApiKeys.publicKey}:${testApiKeys.secretKey}`;
  const result = await apiRequest('GET', '/profile', null, {
    'Authorization': authHeader
  });
  
  if (result.success) {
    console.log('✅ Merchant profile retrieved successfully');
    console.log(`👤 Merchant: ${result.data.data.merchantName}`);
    console.log(`📧 Email: ${result.data.data.email}`);
    console.log(`🏪 Business Type: ${result.data.data.businessType}`);
    console.log(`✅ Active: ${result.data.data.isActive}`);
    console.log(`✅ Verified: ${result.data.data.isVerified}`);
    return true;
  } else {
    console.log('❌ Failed to get merchant profile');
    console.log('Error:', result.error);
    return false;
  }
}

async function test4_UpdateMerchantProfile() {
  console.log('\n🧪 Test 4: Update Merchant Profile');
  console.log('==========================================');
  
  if (!testApiKeys) {
    console.log('❌ No API keys available');
    return false;
  }
  
  const updateData = {
    merchantName: 'Updated Test Coffee Shop',
    phoneNumber: '+1234567891',
    webhookUrl: 'https://updated-webhook.example.com/webhook'
  };
  
  const authHeader = `Bearer ${testApiKeys.publicKey}:${testApiKeys.secretKey}`;
  const result = await apiRequest('PUT', '/profile', updateData, {
    'Authorization': authHeader
  });
  
  if (result.success) {
    console.log('✅ Merchant profile updated successfully');
    console.log(`📝 Updated name: ${result.data.data.merchantName}`);
    console.log(`📞 Updated phone: ${result.data.data.phoneNumber}`);
    console.log(`🔗 Updated webhook: ${result.data.data.webhookUrl}`);
    return true;
  } else {
    console.log('❌ Failed to update merchant profile');
    console.log('Error:', result.error);
    return false;
  }
}

async function test5_GetMerchantPayments() {
  console.log('\n🧪 Test 5: Get Merchant Payments');
  console.log('==========================================');
  
  if (!testApiKeys) {
    console.log('❌ No API keys available');
    return false;
  }
  
  const authHeader = `Bearer ${testApiKeys.publicKey}:${testApiKeys.secretKey}`;
  const result = await apiRequest('GET', '/payments?page=1&limit=10', null, {
    'Authorization': authHeader
  });
  
  if (result.success) {
    console.log('✅ Merchant payments retrieved successfully');
    console.log(`📊 Total payments: ${result.data.data.pagination.count}`);
    console.log(`📄 Current page: ${result.data.data.pagination.current}`);
    console.log(`📋 Payment entries: ${result.data.data.payments.length}`);
    return true;
  } else {
    console.log('❌ Failed to get merchant payments');
    console.log('Error:', result.error);
    return false;
  }
}

async function test6_GetMerchantPaymentStats() {
  console.log('\n🧪 Test 6: Get Merchant Payment Stats');
  console.log('==========================================');
  
  if (!testApiKeys) {
    console.log('❌ No API keys available');
    return false;
  }
  
  const authHeader = `Bearer ${testApiKeys.publicKey}:${testApiKeys.secretKey}`;
  const result = await apiRequest('GET', '/payments/stats', null, {
    'Authorization': authHeader
  });
  
  if (result.success) {
    console.log('✅ Payment stats retrieved successfully');
    console.log(`📈 Today: ${result.data.data.today.transactions} transactions, $${result.data.data.today.volume}`);
    console.log(`📈 Week: ${result.data.data.week.transactions} transactions, $${result.data.data.week.volume}`);
    console.log(`📈 Month: ${result.data.data.month.transactions} transactions, $${result.data.data.month.volume}`);
    console.log(`📈 Overall: ${result.data.data.overall.transactions} transactions, $${result.data.data.overall.volume}`);
    return true;
  } else {
    console.log('❌ Failed to get payment stats');
    console.log('Error:', result.error);
    return false;
  }
}

async function test7_GetMerchantSettings() {
  console.log('\n🧪 Test 7: Get Merchant Settings');
  console.log('==========================================');
  
  if (!testApiKeys) {
    console.log('❌ No API keys available');
    return false;
  }
  
  const authHeader = `Bearer ${testApiKeys.publicKey}:${testApiKeys.secretKey}`;
  const result = await apiRequest('GET', '/settings', null, {
    'Authorization': authHeader
  });
  
  if (result.success) {
    console.log('✅ Merchant settings retrieved successfully');
    console.log(`⚙️  Payment methods: ${result.data.data.paymentMethods.join(', ')}`);
    console.log(`💰 Currency: ${result.data.data.currency}`);
    console.log(`🔔 Notifications: Email=${result.data.data.notifications.email}, Webhook=${result.data.data.notifications.webhook}`);
    console.log(`💵 Commission: ${result.data.data.commission}%`);
    return true;
  } else {
    console.log('❌ Failed to get merchant settings');
    console.log('Error:', result.error);
    return false;
  }
}

async function test8_UpdateMerchantSettings() {
  console.log('\n🧪 Test 8: Update Merchant Settings');
  console.log('==========================================');
  
  if (!testApiKeys) {
    console.log('❌ No API keys available');
    return false;
  }
  
  const settingsUpdate = {
    notifications: {
      email: true,
      webhook: false,
      paymentSuccess: true,
      paymentFailed: true
    },
    autoSettlement: false,
    currency: 'SUI'
  };
  
  const authHeader = `Bearer ${testApiKeys.publicKey}:${testApiKeys.secretKey}`;
  const result = await apiRequest('PUT', '/settings', settingsUpdate, {
    'Authorization': authHeader
  });
  
  if (result.success) {
    console.log('✅ Merchant settings updated successfully');
    console.log(`🔔 Notifications updated`);
    console.log(`💱 Auto settlement: ${result.data.data.autoSettlement}`);
    return true;
  } else {
    console.log('❌ Failed to update merchant settings');
    console.log('Error:', result.error);
    return false;
  }
}

async function test9_CreateWebhook() {
  console.log('\n🧪 Test 9: Create Webhook');
  console.log('==========================================');
  
  if (!testApiKeys) {
    console.log('❌ No API keys available');
    return false;
  }
  
  const webhookData = {
    url: 'https://test-webhook.example.com/webhook',
    events: ['payment.completed', 'payment.failed', 'refund.created'],
    description: 'Test webhook endpoint'
  };
  
  const authHeader = `Bearer ${testApiKeys.publicKey}:${testApiKeys.secretKey}`;
  const result = await apiRequest('POST', '/webhooks', webhookData, {
    'Authorization': authHeader
  });
  
  if (result.success) {
    console.log('✅ Webhook created successfully');
    console.log(`🔗 URL: ${result.data.data.url}`);
    console.log(`📅 Events: ${result.data.data.events.join(', ')}`);
    console.log(`📝 Description: ${result.data.data.description}`);
    console.log(`🆔 Webhook ID: ${result.data.data._id}`);
    
    // Store webhook ID for later tests
    testMerchantData.webhookId = result.data.data._id;
    return true;
  } else {
    console.log('❌ Failed to create webhook');
    console.log('Error:', result.error);
    return false;
  }
}

async function test10_GetWebhooks() {
  console.log('\n🧪 Test 10: Get Webhooks');
  console.log('==========================================');
  
  if (!testApiKeys) {
    console.log('❌ No API keys available');
    return false;
  }
  
  const authHeader = `Bearer ${testApiKeys.publicKey}:${testApiKeys.secretKey}`;
  const result = await apiRequest('GET', '/webhooks', null, {
    'Authorization': authHeader
  });
  
  if (result.success) {
    console.log('✅ Webhooks retrieved successfully');
    console.log(`📊 Total webhooks: ${result.data.data.length}`);
    result.data.data.forEach((webhook, index) => {
      console.log(`  ${index + 1}. ${webhook.url} - Events: ${webhook.events.join(', ')} - Active: ${webhook.isActive}`);
    });
    return true;
  } else {
    console.log('❌ Failed to get webhooks');
    console.log('Error:', result.error);
    return false;
  }
}

async function test11_CreateApiKey() {
  console.log('\n🧪 Test 11: Create API Key');
  console.log('==========================================');
  
  if (!testApiKeys) {
    console.log('❌ No API keys available');
    return false;
  }
  
  const apiKeyData = {
    name: 'Test Development Key',
    permissions: ['payments.read', 'profile.read'],
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 5000
    },
    expiresIn: 30
  };
  
  const authHeader = `Bearer ${testApiKeys.publicKey}:${testApiKeys.secretKey}`;
  const result = await apiRequest('POST', '/api-keys', apiKeyData, {
    'Authorization': authHeader
  });
  
  if (result.success) {
    console.log('✅ API Key created successfully');
    console.log(`📛 Name: ${result.data.data.name}`);
    console.log(`🔑 Public Key: ${result.data.data.publicKey}`);
    console.log(`🔐 Secret Key: ${result.data.data.secretKey.substring(0, 20)}...`);
    console.log(`🔐 Permissions: ${result.data.data.permissions.join(', ')}`);
    console.log(`⏰ Expires: ${result.data.data.expiresAt}`);
    
    // Store for deletion test
    testMerchantData.testApiKeyId = result.data.data.keyId;
    return true;
  } else {
    console.log('❌ Failed to create API key');
    console.log('Error:', result.error);
    return false;
  }
}

async function test12_GetApiKeys() {
  console.log('\n🧪 Test 12: Get API Keys');
  console.log('==========================================');
  
  if (!testApiKeys) {
    console.log('❌ No API keys available');
    return false;
  }
  
  const authHeader = `Bearer ${testApiKeys.publicKey}:${testApiKeys.secretKey}`;
  const result = await apiRequest('GET', '/api-keys', null, {
    'Authorization': authHeader
  });
  
  if (result.success) {
    console.log('✅ API Keys retrieved successfully');
    console.log(`📊 Total API keys: ${result.data.data.length}`);
    result.data.data.forEach((key, index) => {
      console.log(`  ${index + 1}. ${key.name} - ${key.publicKey} - Active: ${key.isActive} - Usage: ${key.usageCount}`);
    });
    return true;
  } else {
    console.log('❌ Failed to get API keys');
    console.log('Error:', result.error);
    return false;
  }
}

async function test13_TestAuthenticationFailure() {
  console.log('\n🧪 Test 13: Authentication Failure (Invalid API Key)');
  console.log('==========================================');
  
  const result = await apiRequest('GET', '/profile', null, {
    'Authorization': 'Bearer invalid_key:invalid_secret'
  });
  
  if (!result.success && result.status === 401) {
    console.log('✅ Authentication properly rejected invalid credentials');
    console.log(`🔒 Status: ${result.status}`);
    console.log(`❌ Error: ${result.error.error}`);
    return true;
  } else {
    console.log('❌ Authentication should have failed but didn\'t');
    return false;
  }
}

async function test14_TestValidationError() {
  console.log('\n🧪 Test 14: Validation Error (Missing Required Fields)');
  console.log('==========================================');
  
  const invalidData = {
    merchantName: '', // Empty name should fail
    businessType: 'Test',
    // Missing email, phone, address, walletAddress
  };
  
  const result = await apiRequest('POST', '/register', invalidData);
  
  if (!result.success && result.status === 400) {
    console.log('✅ Validation properly rejected invalid data');
    console.log(`🔒 Status: ${result.status}`);
    console.log(`❌ Error: ${result.error.error || result.error.errors?.[0]?.msg}`);
    return true;
  } else {
    console.log('❌ Validation should have failed but didn\'t');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 MERCHANT API ENDPOINTS TEST SUITE');
  console.log('=====================================');
  console.log('Testing all merchant endpoints...\n');
  
  const tests = [
    test1_RegisterMerchant,
    test2_GetPublicMerchantInfo,
    test3_GetMerchantProfile,
    test4_UpdateMerchantProfile,
    test5_GetMerchantPayments,
    test6_GetMerchantPaymentStats,
    test7_GetMerchantSettings,
    test8_UpdateMerchantSettings,
    test9_CreateWebhook,
    test10_GetWebhooks,
    test11_CreateApiKey,
    test12_GetApiKeys,
    test13_TestAuthenticationFailure,
    test14_TestValidationError
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 TEST RESULTS');
  console.log('=====================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (testMerchantData) {
    console.log('\n📋 TEST DATA CREATED:');
    console.log(`🆔 Merchant ID: ${testMerchantData.merchantId}`);
    console.log(`📧 Email: ${testMerchantData.email}`);
    console.log(`🔑 API Keys: Created and tested`);
    console.log(`🪝 Webhooks: Created and tested`);
  }
  
  console.log('\n🎉 Test suite completed!');
}

// Run the tests
runAllTests().catch(console.error);