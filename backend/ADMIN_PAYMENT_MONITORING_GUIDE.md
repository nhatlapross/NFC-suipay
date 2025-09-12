# Admin Payment Monitoring API Test Guide

## Prerequisites
- Server running on `http://localhost:8080`
- Admin JWT token (get from login endpoint with admin role user)
- Some test data (merchants, users, cards, transactions)

## Authentication Headers
All admin endpoints require JWT authentication:
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

---

## 🎯 **Payment Monitoring Dashboard**

### 1. Get Payment Dashboard Overview
**Endpoint:** `GET /api/admin/dashboard`

**cURL:**
```bash
curl -X GET http://localhost:8080/api/admin/dashboard \
  -H "Authorization: Bearer <admin_jwt_token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalTransactions": {
      "today": 150,
      "week": 1250,
      "month": 5800
    },
    "totalVolume": {
      "today": 75000,
      "week": 625000,
      "month": 2900000
    },
    "successRate": {
      "today": 98.5,
      "week": 97.2,
      "month": 96.8
    },
    "failureAnalysis": {
      "networkErrors": 12,
      "cardErrors": 8,
      "insufficientFunds": 15,
      "merchantErrors": 5,
      "systemErrors": 3
    },
    "activeCards": 2840,
    "activeMerchants": 156,
    "averageTransactionTime": 2.3,
    "timestamp": "2025-09-10T15:00:00.000Z"
  }
}
```

---

## 📊 **System Health Monitoring**

### 2. Get System Health Status
**Endpoint:** `GET /api/admin/health`

**cURL:**
```bash
curl -X GET http://localhost:8080/api/admin/health \
  -H "Authorization: Bearer <admin_jwt_token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "successRate": 97.5,
    "transactionMetrics": [{
      "total": 1250,
      "successful": 1219,
      "failed": 25,
      "pending": 6,
      "totalVolume": 625000
    }],
    "errorMetrics": [
      { "_id": "network_timeout", "count": 12 },
      { "_id": "insufficient_funds", "count": 8 },
      { "_id": "card_declined", "count": 5 }
    ],
    "performanceMetrics": {
      "avgProcessingTime": 2.1,
      "maxProcessingTime": 15.2,
      "minProcessingTime": 0.8
    },
    "systemStatus": {
      "activeUsers": 15420,
      "activeMerchants": 156,
      "activeCards": 2840,
      "databaseStatus": "healthy",
      "cacheStatus": "healthy",
      "queueStatus": "healthy"
    }
  }
}
```

### 3. Get System Statistics
**Endpoint:** `GET /api/admin/stats`

**Query Parameters:**
- `period` (optional): day, week, month, year
- `startDate` (optional): ISO date
- `endDate` (optional): ISO date

**cURL:**
```bash
curl -X GET "http://localhost:8080/api/admin/stats?period=week" \
  -H "Authorization: Bearer <admin_jwt_token>"
```

---

## 💳 **Transaction Management**

### 4. Get All Transactions (with filters)
**Endpoint:** `GET /api/admin/transactions`

**Query Parameters:**
- `page` (optional): page number (default: 1)
- `limit` (optional): items per page (default: 20)
- `status` (optional): pending, processing, completed, failed
- `merchantId` (optional): filter by merchant
- `userId` (optional): filter by user
- `cardId` (optional): filter by card
- `paymentMethod` (optional): nfc, qr, api
- `startDate` (optional): ISO date
- `endDate` (optional): ISO date
- `minAmount` (optional): minimum amount
- `maxAmount` (optional): maximum amount

**cURL:**
```bash
curl -X GET "http://localhost:8080/api/admin/transactions?status=failed&limit=10" \
  -H "Authorization: Bearer <admin_jwt_token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "transaction_id",
        "amount": 50.00,
        "status": "failed",
        "failureReason": "network_timeout",
        "userId": { "fullName": "John Doe", "email": "john@example.com" },
        "merchantId": { "merchantName": "Coffee Shop", "businessType": "Food" },
        "cardId": { "cardType": "mastercard", "lastFourDigits": "1234" },
        "createdAt": "2025-09-10T14:30:00.000Z"
      }
    ],
    "total": 45,
    "pages": 5,
    "currentPage": 1
  }
}
```

### 5. Get Transaction Details
**Endpoint:** `GET /api/admin/transactions/:transactionId`

**cURL:**
```bash
curl -X GET http://localhost:8080/api/admin/transactions/66e123456789abcdef123456 \
  -H "Authorization: Bearer <admin_jwt_token>"
```

### 6. Force Refund Transaction
**Endpoint:** `POST /api/admin/transactions/:transactionId/refund`

**Request Body:**
```json
{
  "reason": "Customer complaint - service not delivered"
}
```

**cURL:**
```bash
curl -X POST http://localhost:8080/api/admin/transactions/66e123456789abcdef123456/refund \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer complaint - service not delivered"}'
```

### 7. Update Transaction Status
**Endpoint:** `PUT /api/admin/transactions/:transactionId/status`

**Request Body:**
```json
{
  "status": "completed",
  "reason": "Manual verification completed"
}
```

**cURL:**
```bash
curl -X PUT http://localhost:8080/api/admin/transactions/66e123456789abcdef123456/status \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "reason": "Manual verification completed"}'
```

---

## 🏪 **Merchant Payment Health Monitoring**

### 8. Get All Merchants Health Status
**Endpoint:** `GET /api/admin/merchants`

**cURL:**
```bash
curl -X GET http://localhost:8080/api/admin/merchants \
  -H "Authorization: Bearer <admin_jwt_token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "merchants": [
      {
        "merchantId": "66e123456789abcdef123456",
        "merchantName": "Coffee Shop",
        "totalTransactions": 245,
        "successRate": 98.8,
        "failedTransactions": 3,
        "totalVolume": 12250.50,
        "avgTransactionAmount": 50.00,
        "isHealthy": true
      }
    ],
    "summary": {
      "total": 156,
      "healthy": 148,
      "unhealthy": 8
    }
  }
}
```

### 9. Get Specific Merchant Health
**Endpoint:** `GET /api/admin/merchants/:merchantId`

**cURL:**
```bash
curl -X GET http://localhost:8080/api/admin/merchants/66e123456789abcdef123456 \
  -H "Authorization: Bearer <admin_jwt_token>"
```

---

## 💳 **NFC Card Management**

### 10. Get Card Health Overview
**Endpoint:** `GET /api/admin/cards`

**cURL:**
```bash
curl -X GET http://localhost:8080/api/admin/cards \
  -H "Authorization: Bearer <admin_jwt_token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "cardStats": {
      "active": 2840,
      "blocked": 45,
      "expired": 12,
      "inactive": 8
    },
    "problematicCards": [
      {
        "_id": "card_id_1",
        "failureCount": 15
      },
      {
        "_id": "card_id_2", 
        "failureCount": 8
      }
    ]
  }
}
```

### 11. Get Card Details
**Endpoint:** `GET /api/admin/cards/:cardId`

**cURL:**
```bash
curl -X GET http://localhost:8080/api/admin/cards/card-uuid-1234 \
  -H "Authorization: Bearer <admin_jwt_token>"
```

### 12. Block Card (Emergency)
**Endpoint:** `POST /api/admin/cards/:cardId/block`

**Request Body:**
```json
{
  "reason": "Suspicious activity detected - multiple failed transactions"
}
```

**cURL:**
```bash
curl -X POST http://localhost:8080/api/admin/cards/card-uuid-1234/block \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Suspicious activity detected"}'
```

### 13. Unblock Card
**Endpoint:** `POST /api/admin/cards/:cardId/unblock`

**cURL:**
```bash
curl -X POST http://localhost:8080/api/admin/cards/card-uuid-1234/unblock \
  -H "Authorization: Bearer <admin_jwt_token>"
```

---

## 🚨 **Advanced Payment Monitoring**

### 14. Real-time Payment Monitoring (Last Hour)
**Endpoint:** `GET /api/admin/payments/live`

**cURL:**
```bash
curl -X GET http://localhost:8080/api/admin/payments/live \
  -H "Authorization: Bearer <admin_jwt_token>"
```

### 15. Payment Failure Analysis
**Endpoint:** `GET /api/admin/payments/failures`

**cURL:**
```bash
curl -X GET "http://localhost:8080/api/admin/payments/failures?status=failed&startDate=2025-09-09T00:00:00.000Z" \
  -H "Authorization: Bearer <admin_jwt_token>"
```

### 16. Merchant Payment Health Dashboard
**Endpoint:** `GET /api/admin/payments/merchant-health`

**cURL:**
```bash
curl -X GET http://localhost:8080/api/admin/payments/merchant-health \
  -H "Authorization: Bearer <admin_jwt_token>"
```

### 17. Card Health Monitoring
**Endpoint:** `GET /api/admin/payments/card-health`

**cURL:**
```bash
curl -X GET http://localhost:8080/api/admin/payments/card-health \
  -H "Authorization: Bearer <admin_jwt_token>"
```

---

## 🚨 **Emergency Controls**

### 18. Emergency Stop Merchant
**Endpoint:** `POST /api/admin/payments/emergency/stop-merchant/:merchantId`

**cURL:**
```bash
curl -X POST http://localhost:8080/api/admin/payments/emergency/stop-merchant/66e123456789abcdef123456 \
  -H "Authorization: Bearer <admin_jwt_token>"
```

### 19. Emergency Block Card
**Endpoint:** `POST /api/admin/payments/emergency/block-card/:cardId`

**Request Body:**
```json
{
  "reason": "Emergency block - fraud detected"
}
```

**cURL:**
```bash
curl -X POST http://localhost:8080/api/admin/payments/emergency/block-card/card-uuid-1234 \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Emergency block - fraud detected"}'
```

---

## 📈 **Success Indicators**

### Payment System Health ✅
- Success rate > 95%: System healthy
- Success rate 85-95%: Warning status  
- Success rate < 85%: Critical status

### Key Metrics to Monitor ✅
- **Transaction success rate** (should be > 95%)
- **Average processing time** (should be < 3 seconds)
- **Failed transaction patterns** (check for spikes)
- **Merchant payment health** (individual success rates)
- **Card failure rates** (identify problematic cards)
- **System resource usage** (database, cache, queues)

### Emergency Response ✅
- Quick merchant shutdown capability
- Instant card blocking
- Force refund processing
- Real-time monitoring alerts

---

## 🎯 **Use Cases for Payment Success**

1. **Proactive Monitoring**: Dashboard shows real-time payment health
2. **Quick Issue Resolution**: Identify and resolve payment failures fast
3. **Merchant Support**: Monitor individual merchant payment health
4. **Card Management**: Block problematic cards before they cause issues
5. **Emergency Response**: Quickly stop problematic merchants/cards
6. **Performance Optimization**: Track and improve transaction processing times
7. **Fraud Detection**: Monitor for suspicious transaction patterns

Happy monitoring! 🚀