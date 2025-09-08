# 🔌 NFC Payment System - API Endpoints Documentation

**Base URL:** `http://localhost:8080`  
**Version:** 1.0  
**Environment:** Development

---

## 🔐 **AUTHENTICATION ENDPOINTS**

### **POST** `/api/auth/register`
Đăng ký user mới trong hệ thống

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "Test User",
  "phoneNumber": "0123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "68bf13c1746dd185de2ee844",
    "email": "user@example.com",
    "fullName": "Test User",
    "status": "active"
  }
}
```

### **POST** `/api/auth/login`
Đăng nhập và nhận JWT tokens

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": "68bf13c1746dd185de2ee844",
    "email": "user@example.com",
    "fullName": "Test User",
    "role": "user"
  }
}
```

---

## 💳 **NFC PAYMENT ENDPOINTS**

### **POST** `/api/payment/nfc-validate` ⚡
**[PUBLIC - NO AUTH REQUIRED]**  
Validation nhanh cho thiết bị terminal NFC

**Performance Target:** < 500ms  
**Current Average:** 270ms

**Request:**
```json
{
  "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1.5,
  "merchantId": "MERCHANT_001",
  "terminalId": "TERMINAL_001"
}
```

**Success Response:**
```json
{
  "success": true,
  "authorized": true,
  "authCode": "NFC_MFBEYWP8_VNNNIC",
  "processingTime": 253,
  "fromCache": false,
  "requestId": "nfc_1757353616177_17owz",
  "validUntil": "2025-09-08T17:47:26.396Z",
  "details": {
    "cardType": "physical",
    "lastUsed": "2025-09-08T10:30:00.000Z",
    "remainingDaily": 998.5
  },
  "merchant": {
    "merchantName": "Coffee Shop ABC",
    "terminalId": "TERMINAL_001"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "authorized": false,
  "error": "Daily limit exceeded",
  "code": "PAY_003",
  "processingTime": 142,
  "requestId": "nfc_1757353616177_error",
  "details": {
    "dailySpent": 950,
    "dailyLimit": 1000,
    "requestedAmount": 100
  }
}
```

### **POST** `/api/payment/process-async` 🔒
**[REQUIRES AUTH]**  
Khởi tạo xử lý thanh toán async

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1.5,
  "merchantId": "MERCHANT_001",
  "terminalId": "TERMINAL_001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment processing initiated",
  "transactionId": "nfc_1757353616177_abc123",
  "status": "pending",
  "estimatedProcessingTime": "2-5 seconds",
  "tracking": {
    "jobId": "12345",
    "transactionId": "nfc_1757353616177_abc123",
    "websocketChannel": "user:68bf13c1746dd185de2ee844"
  }
}
```

### **POST** `/api/payment/validate` 🔒
**[REQUIRES AUTH]**  
Validation đầy đủ với user authentication

**Request:**
```json
{
  "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 0.05,
  "merchantId": "MERCHANT_001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment validation successful",
  "data": {
    "walletAddress": "0xuser123...",
    "cardInfo": {
      "cardType": "physical",
      "lastUsed": "2025-09-08T10:30:00.000Z",
      "dailySpent": 1.5,
      "monthlySpent": 1.5
    },
    "merchantInfo": {
      "merchantName": "Coffee Shop ABC",
      "walletAddress": "0xmerchant123..."
    },
    "transactionDetails": {
      "amount": 0.05,
      "estimatedGasFee": 0.02,
      "totalAmount": 0.07
    }
  }
}
```

### **POST** `/api/payment/process` 🔒
**[REQUIRES AUTH]**  
Xử lý thanh toán synchronous

**Request:**
```json
{
  "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1.5,
  "merchantId": "MERCHANT_001",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "transaction": {
    "id": "trans_12345",
    "txHash": "0xabc123def456...",
    "amount": 1.5,
    "totalAmount": 1.52,
    "gasFee": 0.02,
    "status": "completed",
    "merchantName": "Coffee Shop ABC",
    "timestamp": "2025-09-08T17:47:26.396Z"
  },
  "receipt": {
    "transactionId": "trans_12345",
    "amount": 1.5,
    "currency": "SUI",
    "merchant": "Coffee Shop ABC",
    "cardLast4": "0000",
    "status": "completed"
  }
}
```

### **GET** `/api/payment/transactions/:id` 🔒
**[REQUIRES AUTH]**  
Lấy thông tin chi tiết giao dịch

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "nfc_1757353616177_abc123",
    "status": "completed",
    "txHash": "0xabc123def456...",
    "amount": 1.5,
    "currency": "SUI",
    "createdAt": "2025-09-08T17:47:20.000Z",
    "completedAt": "2025-09-08T17:47:26.396Z",
    "processingTime": "6396ms",
    "explorerUrl": "https://suiscan.xyz/testnet/tx/0xabc123def456...",
    "merchant": {
      "merchantId": "MERCHANT_001",
      "merchantName": "Coffee Shop ABC"
    }
  }
}
```

### **GET** `/api/payment/transactions` 🔒
**[REQUIRES AUTH]**  
Lấy lịch sử giao dịch của user

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "trans_12345",
      "amount": 1.5,
      "currency": "SUI",
      "status": "completed",
      "merchantName": "Coffee Shop ABC",
      "createdAt": "2025-09-08T17:47:26.396Z"
    }
  ],
  "total": 1,
  "pages": 1
}
```

### **GET** `/api/payment/stats` 🔒
**[REQUIRES AUTH]**  
Thống kê thanh toán của user

**Response:**
```json
{
  "success": true,
  "stats": {
    "period": "month",
    "dateRange": {
      "from": "2025-08-31T17:00:00.000Z",
      "to": "2025-09-08T17:36:04.794Z"
    },
    "overview": {
      "totalTransactions": 0,
      "totalVolume": 0,
      "totalGasFees": 0,
      "averageTransaction": 0,
      "successRate": 0
    },
    "trends": {
      "monthly": [],
      "hourly": []
    }
  }
}
```

---

## ⚡ **FAST PAYMENT ENDPOINTS** 

### **GET** `/api/fast-payment/health`
**[PUBLIC]**  
Kiểm tra health của fast payment system

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-09-08T17:47:26.396Z",
  "redis": "connected",
  "database": "connected",
  "services": {
    "fastValidation": "operational",
    "caching": "operational",
    "fraudDetection": "operational"
  }
}
```

### **POST** `/api/fast-payment/fast-validate` 🔒
**[REQUIRES AUTH]**  
Ultra-fast validation với cache (TARGET < 100ms)

**Request:**
```json
{
  "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000,
  "terminalId": "TERMINAL_001",
  "merchantId": "MERCHANT_001"
}
```

### **GET** `/api/fast-payment/cache-stats` 🔒
**[REQUIRES AUTH]**  
Thống kê performance cache

**Response:**
```json
{
  "success": true,
  "stats": {
    "redis": {
      "connected": true,
      "latency": "< 10ms",
      "hitRate": "95%"
    },
    "performance": {
      "averageResponseTime": "< 100ms",
      "requestsPerSecond": 1000,
      "cacheHitRate": "95%"
    }
  }
}
```

### **POST** `/api/fast-payment/pre-warm-cache` 🔒
**[REQUIRES AUTH]**  
Pre-warm cache cho active cards

**Response:**
```json
{
  "success": true,
  "message": "Cache pre-warmed for 2 active cards",
  "itemsCached": 6,
  "processingTime": 145,
  "cards": 2
}
```

---

## 🏥 **HEALTH & MONITORING ENDPOINTS**

### **GET** `/health`
**[PUBLIC]**  
System health check chính

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-08T17:44:24.289Z",
  "uptime": 14.1515285,
  "environment": "development"
}
```

### **GET** `/api/`
**[PUBLIC]**  
API information và available endpoints

**Response:**
```json
{
  "success": true,
  "message": "NFC Payment API v1.0",
  "version": "1.0.0",
  "timestamp": "2025-09-08T17:44:24.289Z",
  "endpoints": {
    "auth": "/api/auth",
    "payment": "/api/payment",
    "wallet": "/api/wallet",
    "card": "/api/card",
    "user": "/api/user",
    "merchant": "/api/merchant",
    "admin": "/api/admin"
  }
}
```

---

## 🚨 **ERROR RESPONSES**

### **Common Error Codes:**

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTH_001` | Authentication failed | 401 |
| `AUTH_002` | Token expired | 401 |
| `AUTH_003` | Invalid token | 401 |
| `AUTH_004` | Unauthorized | 401 |
| `PAY_001` | Insufficient balance | 400 |
| `PAY_002` | Invalid card | 400 |
| `PAY_003` | Limit exceeded | 400 |
| `PAY_004` | Transaction failed | 400 |
| `VAL_001` | Validation error | 400 |
| `VAL_002` | Invalid input | 400 |
| `SYS_001` | Internal error | 500 |
| `SYS_002` | Service unavailable | 503 |

### **Error Response Format:**
```json
{
  "success": false,
  "error": "Card not found or not owned by user",
  "code": "PAY_002",
  "details": {
    "field": "cardUuid",
    "value": "invalid-uuid"
  }
}
```

---

## 📊 **RATE LIMITS**

### **General API:**
- 100 requests/minute per IP

### **NFC Endpoints:**
- `/api/payment/nfc-validate`: 100 requests/minute
- `/api/fast-payment/fast-validate`: 20 requests/minute

### **Authentication:**
- `/api/auth/login`: 10 requests/minute per IP

---

## 🧪 **SAMPLE TESTING DATA**

### **Test User:**
```
Email: user@example.com
Password: SecurePass123!
```

### **Test Cards:**
```
Physical Card: 550e8400-e29b-41d4-a716-446655440000
- Daily Limit: 1000 SUI
- Monthly Limit: 20000 SUI

Test Card: test-nfc-card-12345  
- Daily Limit: 100 SUI
- Monthly Limit: 1000 SUI
```

### **Test Merchants:**
```
MERCHANT_001 - Coffee Shop ABC
MERCHANT_TEST - NFC Test Terminal
```

---

## 🚀 **CURL EXAMPLES**

### **Quick NFC Validation Test:**
```bash
curl -X POST http://localhost:8080/api/payment/nfc-validate \
  -H "Content-Type: application/json" \
  -d '{"cardUuid": "test-nfc-card-12345", "amount": 0.01, "merchantId": "MERCHANT_TEST", "terminalId": "TERMINAL_001"}'
```

### **Get JWT Token:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'
```

### **Authenticated Request:**
```bash
curl -X GET http://localhost:8080/api/payment/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

**Last Updated:** 2025-09-08 17:50:00 UTC  
**API Status:** ✅ OPERATIONAL  
**Total Endpoints:** 20+ endpoints documented