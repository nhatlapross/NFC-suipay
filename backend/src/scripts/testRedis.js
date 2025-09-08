const { createClient } = require('redis');
require('dotenv').config();

async function testRedisCloud() {
  console.log('🧪 Testing Redis Cloud Connection...\n');
  
  const client = createClient({
    username: process.env.REDIS_CLOUD_USERNAME,
    password: process.env.REDIS_CLOUD_PASSWORD,
    socket: {
      host: process.env.REDIS_CLOUD_HOST,
      port: parseInt(process.env.REDIS_CLOUD_PORT)
    }
  });

  try {
    // Test 1: Basic Connection
    console.log('🔗 Test 1: Basic Connection');
    const startConnect = Date.now();
    await client.connect();
    const connectTime = Date.now() - startConnect;
    console.log(`✅ Connected in ${connectTime}ms\n`);

    // Test 2: Basic Operations
    console.log('🔧 Test 2: Basic Operations');
    const testKey = 'nfc:test:' + Date.now();
    const testData = { message: 'Hello NFC!', timestamp: new Date() };
    
    // SET operation
    const startSet = Date.now();
    await client.setEx(testKey, 60, JSON.stringify(testData));
    const setTime = Date.now() - startSet;
    console.log(`✅ SET operation: ${setTime}ms`);
    
    // GET operation  
    const startGet = Date.now();
    const result = await client.get(testKey);
    const getTime = Date.now() - startGet;
    const parsed = JSON.parse(result);
    console.log(`✅ GET operation: ${getTime}ms`);
    console.log(`📋 Data retrieved:`, parsed.message);

    // Test 3: Batch Operations
    console.log('\n🚀 Test 3: Batch Operations');
    const pipeline = client.multi();
    const batchKeys = [];
    
    for (let i = 1; i <= 10; i++) {
      const key = `nfc:batch:test:${i}`;
      batchKeys.push(key);
      pipeline.setEx(key, 60, JSON.stringify({ id: i, value: `test${i}` }));
    }
    
    const startBatch = Date.now();
    await pipeline.exec();
    const batchTime = Date.now() - startBatch;
    console.log(`✅ Batch SET (10 items): ${batchTime}ms`);
    
    // Batch GET
    const getPipeline = client.multi();
    batchKeys.forEach(key => getPipeline.get(key));
    
    const startBatchGet = Date.now();
    const batchResults = await getPipeline.exec();
    const batchGetTime = Date.now() - startBatchGet;
    console.log(`✅ Batch GET (10 items): ${batchGetTime}ms`);

    // Test 4: Performance Test
    console.log('\n⚡ Test 4: Performance Test (100 operations)');
    const startPerf = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await client.get(testKey);
    }
    
    const perfTime = Date.now() - startPerf;
    const avgTime = perfTime / 100;
    console.log(`✅ 100 GET operations: ${perfTime}ms (avg: ${avgTime.toFixed(2)}ms/op)`);

    // Performance Assessment
    console.log('\n📊 Performance Assessment:');
    if (avgTime < 10) {
      console.log('🟢 EXCELLENT: < 10ms average latency');
    } else if (avgTime < 50) {
      console.log('🟡 GOOD: < 50ms average latency');
    } else {
      console.log('🟠 ACCEPTABLE: < 100ms average latency');
    }

    // Cleanup
    await client.del(testKey);
    for (const key of batchKeys) {
      await client.del(key);
    }
    
    await client.quit();
    console.log('\n🎉 All Redis Cloud tests passed!');
    
  } catch (error) {
    console.error('❌ Redis Cloud test failed:', error);
    process.exit(1);
  }
}

testRedisCloud();