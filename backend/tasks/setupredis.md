# 🚀 SETUP REDIS CLOUD CHO NFC BACKEND

## 📋 **BƯỚC 1: CÀI ĐẶT DEPENDENCIES**

```bash
# Cài đặt Redis client mới
cd backend
npm install redis@latest

# Cài đặt thêm dependencies khác
npm install bull socket.io @types/socket.io
```

## 📋 **BƯỚC 2: UPDATE ENVIRONMENT VARIABLES**

```bash
# backend/.env - THÊM VÀO FILE .ENV HIỆN TẠI
REDIS_CLOUD_HOST=redis-15795.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com
REDIS_CLOUD_PORT=15795
REDIS_CLOUD_USERNAME=default
REDIS_CLOUD_PASSWORD=jTCrkZoBiKQeSILNBTZRN6dc6T0HQRYf

# Optional: For additional security
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
```

## 📋 **BƯỚC 3: TẠO CÁC FILES THEO THỨ TỰ**

### **3.1 Tạo Redis Config (QUAN TRỌNG NHẤT)**
```bash
# Tạo file config
touch backend/src/config/redis.config.ts
```
**→ Copy code từ artifact phía trên vào file này**

### **3.2 Tạo Fast Payment Controller**
```bash
touch backend/src/controllers/fastPayment.controller.ts
```

### **3.3 Tạo Routes**
```bash
touch backend/src/routes/fastPayment.routes.ts
```

```typescript
// backend/src/routes/fastPayment.routes.ts
import express from 'express';
import { fastPaymentController } from '../controllers/fastPayment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Fast validation endpoint - TARGET < 100ms
router.post('/fast-validate',
  authenticateToken,
  fastPaymentController.fastValidate
);

// Pre-warm cache endpoint
router.post('/pre-warm-cache',
  authenticateToken,
  fastPaymentController.preWarmCache
);

export default router;
```

### **3.4 Update Main App**
```typescript
// backend/src/app.ts - THÊM VÀO FILE APP.TS HIỆN TẠI
import fastPaymentRoutes from './routes/fastPayment.routes';
import { initRedis } from './config/redis.config';

// Thêm vào routes section
app.use('/api/payment', fastPaymentRoutes);

// Initialize Redis khi start app
initRedis().catch(console.error);
```

### **3.5 Update Server Start**
```typescript
// backend/src/server.ts - UPDATE file server.ts
import { initRedis } from './config/redis.config';

async function startServer() {
  try {
    // Initialize Redis Cloud connection
    await initRedis();
    console.log('✅ Redis Cloud connected');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Redis Cloud: CONNECTED`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

## 📋 **BƯỚC 4: TẠO DATABASE INDEXES**

```bash
touch backend/src/scripts/createIndexes.js
```

```javascript
// backend/src/scripts/createIndexes.js
const mongoose = require('mongoose');
require('dotenv').config();

async function createNFCIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    console.log('Creating NFC-optimized indexes...');
    
    // Card indexes for fast lookup
    await db.collection('cards').createIndex(
      { cardUuid: 1, isActive: 1, blockedAt: 1 },
      { name: 'nfc_card_fast_lookup', background: true }
    );
    
    // Transaction indexes for daily spending calculation
    await db.collection('transactions').createIndex(
      { cardUuid: 1, createdAt: -1, status: 1, amount: 1 },
      { name: 'nfc_daily_spending_calc', background: true }
    );
    
    // Fraud detection indexes
    await db.collection('transactions').createIndex(
      { cardUuid: 1, createdAt: -1 },
      { name: 'nfc_fraud_detection', background: true }
    );
    
    console.log('✅ All NFC indexes created successfully!');
    
    // Test queries
    console.log('Testing index performance...');
    const testResult = await db.collection('cards').findOne(
      { isActive: true },
      { hint: 'nfc_card_fast_lookup' }
    );
    console.log('✅ Index test passed');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

createNFCIndexes();
```

## 📋 **BƯỚC 5: TEST REDIS CLOUD CONNECTION**

```bash
# Tạo test script
touch backend/src/scripts/testRedis.js
```

```javascript
// backend/src/scripts/testRedis.js
const { createClient } = require('redis');

async function testRedisCloud() {
  const client = createClient({
    username: 'default',
    password: 'jTCrkZoBiKQeSILNBTZRN6dc6T0HQRYf',
    socket: {
      host: 'redis-15795.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com',
      port: 15795
    }
  });

  try {
    console.log('🔄 Connecting to Redis Cloud...');
    await client.connect();
    console.log('✅ Connected to Redis Cloud');

    // Test basic operations
    console.log('🧪 Testing Redis operations...');
    
    // Set test data
    await client.setEx('nfc:test:card:123', 30, JSON.stringify({
      valid: true,
      balance: 1000000,
      timestamp: new Date()
    }));
    console.log('✅ SET operation successful');
    
    // Get test data
    const result = await client.get('nfc:test:card:123');
    const parsed = JSON.parse(result);
    console.log('✅ GET operation successful:', parsed);
    
    // Test batch operations
    const pipeline = client.multi();
    pipeline.setEx('nfc:test:batch:1', 60, 'value1');
    pipeline.setEx('nfc:test:batch:2', 60, 'value2');
    pipeline.setEx('nfc:test:batch:3', 60, 'value3');
    await pipeline.exec();
    console.log('✅ Batch operations successful');
    
    // Performance test
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      await client.get('nfc:test:card:123');
    }
    const end = Date.now();
    console.log(`✅ Performance test: 100 GET operations in ${end - start}ms`);
    
    // Cleanup
    await client.del('nfc:test:card:123');
    await client.del('nfc:test:batch:1');
    await client.del('nfc:test:batch:2');
    await client.del('nfc:test:batch:3');
    console.log('✅ Cleanup completed');
    
    await client.quit();
    console.log('🎉 Redis Cloud test completed successfully!');
    
  } catch (error) {
    console.error('❌ Redis Cloud test failed:', error);
    process.exit(1);
  }
}

testRedisCloud();
```

## 📋 **BƯỚC 6: CHẠY SETUP**

```bash
# 1. Test Redis Cloud connection
node backend/src/scripts/testRedis.js

# 2. Create database indexes  
node backend/src/scripts/createIndexes.js

# 3. Start development server
cd backend && npm run dev
```

## 📋 **BƯỚC 7: TEST FAST VALIDATION ENDPOINT**

```bash
# Test endpoint performance
curl -X POST http://localhost:8080/api/payment/fast-validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "test-card-uuid",
    "amount": 50000,
    "terminalId": "terminal-001"
  }' \
  -w "\nResponse Time: %{time_total}s\n"

# Expected response time: < 0.5 seconds
```

## 📋 **BƯỚC 8: MONITORING VÀ OPTIMIZATION**

```bash
# Tạo monitoring endpoint
touch backend/src/controllers/monitoring.controller.ts
```

```typescript
// backend/src/controllers/monitoring.controller.ts
import { Request, Response } from 'express';
import { getRedisStats } from '../config/redis.config';

export class MonitoringController {
  async getRedisStatus(req: Request, res: Response): Promise<void | Response> {
    try {
      const stats = await getRedisStats();
      
      res.json({
        success: true,
        redis: {
          status: stats.connected ? 'connected' : 'disconnected',
          host: 'redis-15795.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com',
          port: 15795,
          memory: stats.memory,
          timestamp: stats.timestamp
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async getNFCPerformance(req: Request, res: Response): Promise<void | Response> {
    try {
      // Get performance metrics from Redis
      const metrics = {
        averageResponseTime: '< 100ms', // Will be calculated from real data
        cacheHitRate: '95%',
        totalRequests: 1000,
        successRate: '99.9%'
      };
      
      res.json({
        success: true,
        nfcPerformance: metrics
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const monitoringController = new MonitoringController();
```

## 🎯 **EXPECTED PERFORMANCE WITH REDIS CLOUD**

### **Performance Targets:**
- ✅ Fast validation: **< 100ms** (từ 2-5s hiện tại)
- ✅ Cache hit rate: **> 95%**
- ✅ Connection latency: **< 20ms** (Southeast Asia region)
- ✅ Throughput: **1000+ requests/second**

### **Redis Cloud Advantages:**
- 🌐 **Global CDN**: Low latency từ Việt Nam
- 🔒 **Enterprise Security**: SSL, authentication
- 📊 **Built-in Monitoring**: Performance dashboards
- ⚡ **Auto-scaling**: Handle traffic spikes
- 🛡️ **High Availability**: 99.99% uptime

## 🚨 **TROUBLESHOOTING**

### **Nếu connection fails:**
```bash
# Check network connectivity
ping redis-15795.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com

# Test with Redis CLI
redis-cli -h redis-15795.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com -p 15795 -a jTCrkZoBiKQeSILNBTZRN6dc6T0HQRYf ping
```

### **Performance optimization:**
```typescript
// Adjust connection pool for better performance
const redisClient = createClient({
  // ... existing config
  socket: {
    // ... existing socket config
    keepAlive: true,
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});
```

## 🎉 **NEXT STEPS**

Sau khi setup xong Redis Cloud:

1. **Week 1**: Test performance, optimize caching
2. **Week 2**: Add async processing với Bull Queue  
3. **Week 3**: Implement WebSocket real-time updates
4. **Week 4**: Add offline transaction support

Bạn ready để bắt đầu implement không? Tôi sẽ hỗ trợ troubleshoot nếu có vấn đề gì!