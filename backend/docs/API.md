# NFC Payment API Documentation

## 📝 Overview

API RESTful cho hệ thống thanh toán NFC sử dụng Sui blockchain.

**Base URL**: `http://localhost:8080/api`

## 🔐 Authentication

### Headers
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Error Responses
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 📋 API Endpoints

### 🔐 Authentication Endpoints

#### POST /api/auth/register
Đăng ký tài khoản mới

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "phoneNumber": "+84901234567",
  "fullName": "Nguyễn Văn A"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "64f7a1b2c3d4e5f6789a0b1c",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "status": "active"
  }
}
```

#### POST /api/auth/login
Đăng nhập vào hệ thống

**Request Body:**
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
    "id": "64f7a1b2c3d4e5f6789a0b1c",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "user",
    "walletAddress": "0x..."
  }
}
```

#### POST /api/auth/logout
Đăng xuất khỏi hệ thống

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### POST /api/auth/verify-email
Xác thực email/số điện thoại bằng OTP

**Request Body:**
```json
{
  "phoneNumber": "+84901234567",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "result": true
}
```

#### POST /api/auth/resend-otp
Gửi lại mã OTP

**Request Body:**
```json
{
  "phoneNumber": "+84901234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### 👤 User Management Endpoints

#### GET /api/user/profile
Lấy thông tin profile người dùng

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "64f7a1b2c3d4e5f6789a0b1c",
    "email": "user@example.com",
    "phoneNumber": "+84901234567",
    "fullName": "Nguyễn Văn A",
    "walletAddress": "0x...",
    "role": "user",
    "status": "active",
    "kycStatus": "verified",
    "dailyLimit": 1000000,
    "monthlyLimit": 10000000,
    "createdAt": "2023-09-05T10:30:00.000Z"
  }
}
```

#### PUT /api/user/profile
Cập nhật thông tin profile

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn B",
  "phoneNumber": "+84907654321"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "64f7a1b2c3d4e5f6789a0b1c",
    "fullName": "Nguyễn Văn B",
    "phoneNumber": "+84907654321"
  }
}
```

#### POST /api/user/pin/set
Thiết lập mã PIN cho thẻ

**Request Body:**
```json
{
  "pin": "1234",
  "confirmPin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PIN set successfully"
}
```

#### POST /api/user/kyc/submit
Nộp hồ sơ KYC (Know Your Customer)

**Request Body:**
```json
{
  "documentType": "passport",
  "documentNumber": "N1234567890",
  "dateOfBirth": "1990-01-01",
  "address": "123 Nguyễn Văn Linh, Q7, TP.HCM",
  "nationality": "Vietnam"
}
```

**Response:**
```json
{
  "success": true,
  "message": "KYC documents submitted successfully",
  "kycId": "64f7a1b2c3d4e5f6789a0b1d"
}
```

### 💳 Card Management Endpoints

#### POST /api/card/create
Tạo thẻ NFC mới

**Request Body:**
```json
{
  "cardType": "standard",
  "cardName": "Thẻ chính",
  "limits": {
    "daily": 500000,
    "monthly": 5000000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Card created successfully",
  "card": {
    "id": "64f7a1b2c3d4e5f6789a0b1e",
    "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
    "cardType": "standard",
    "cardNumber": "****1234",
    "isActive": true,
    "isPrimary": false,
    "dailyLimit": 500000,
    "monthlyLimit": 5000000,
    "createdAt": "2023-09-05T10:30:00.000Z"
  }
}
```

#### GET /api/card/
Lấy danh sách thẻ của user

**Response:**
```json
{
  "success": true,
  "cards": [
    {
      "id": "64f7a1b2c3d4e5f6789a0b1e",
      "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
      "cardType": "standard",
      "cardNumber": "****1234",
      "isActive": true,
      "isPrimary": true,
      "dailySpent": 50000,
      "monthlySpent": 200000,
      "dailyLimit": 500000,
      "monthlyLimit": 5000000,
      "usageCount": 15,
      "lastUsed": "2023-09-05T08:30:00.000Z"
    }
  ]
}
```

#### POST /api/card/:cardId/activate
Kích hoạt thẻ

**Response:**
```json
{
  "success": true,
  "message": "Card activated successfully"
}
```

#### POST /api/card/:cardId/block
Khóa thẻ

**Request Body:**
```json
{
  "reason": "Lost card"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Card blocked successfully"
}
```

### 💰 Payment Processing Endpoints

#### POST /api/payment/validate
Xác thực giao dịch thanh toán

**Request Body:**
```json
{
  "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000,
  "merchantId": "MERCHANT_001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment validation successful",
  "transaction": {
    "id": "64f7a1b2c3d4e5f6789a0b1f",
    "amount": 50000,
    "currency": "VND",
    "merchant": {
      "id": "MERCHANT_001",
      "name": "Coffee Shop ABC",
      "address": "123 Main Street"
    },
    "card": {
      "cardNumber": "****1234",
      "balance": 1000000
    },
    "requiresPin": false,
    "estimatedGas": 1000
  }
}
```

#### POST /api/payment/process
Xử lý thanh toán

**Request Body:**
```json
{
  "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000,
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
    "id": "64f7a1b2c3d4e5f6789a0b1f",
    "txHash": "0xabc123...",
    "status": "completed",
    "amount": 50000,
    "gasFee": 1000,
    "completedAt": "2023-09-05T10:35:00.000Z"
  }
}
```

#### GET /api/payment/history
Lấy lịch sử giao dịch

**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số item per page (default: 10)
- `status`: Filter theo status
- `startDate`: Ngày bắt đầu (ISO format)
- `endDate`: Ngày kết thúc (ISO format)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "64f7a1b2c3d4e5f6789a0b1f",
      "amount": 50000,
      "currency": "VND",
      "status": "completed",
      "txHash": "0xabc123...",
      "merchant": {
        "name": "Coffee Shop ABC"
      },
      "card": {
        "cardNumber": "****1234"
      },
      "createdAt": "2023-09-05T10:30:00.000Z",
      "completedAt": "2023-09-05T10:35:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 👛 Wallet Endpoints

#### POST /api/wallet/create
Tạo ví blockchain

**Response:**
```json
{
  "success": true,
  "message": "Wallet created successfully",
  "wallet": {
    "address": "0x...",
    "publicKey": "0x...",
    "network": "testnet"
  }
}
```

#### GET /api/wallet/balance
Kiểm tra số dư ví

**Response:**
```json
{
  "success": true,
  "balance": {
    "sui": "1000000000",
    "usd": "1000.00",
    "coins": [
      {
        "type": "0x2::sui::SUI",
        "balance": "1000000000"
      }
    ]
  }
}
```

#### POST /api/wallet/faucet
Lấy test tokens từ faucet (chỉ testnet)

**Response:**
```json
{
  "success": true,
  "message": "Test tokens received successfully",
  "txHash": "0xdef456..."
}
```

### 🏪 Merchant Endpoints

#### POST /api/merchant/register
Đăng ký merchant

**Request Body:**
```json
{
  "businessName": "Coffee Shop ABC",
  "contactEmail": "admin@coffeeshop.com",
  "businessType": "retail",
  "address": "123 Main Street",
  "webhookUrl": "https://coffeeshop.com/webhook"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Merchant registered successfully",
  "merchant": {
    "merchantId": "MERCHANT_001",
    "apiKey": "sk_test_...",
    "walletAddress": "0x...",
    "isActive": false
  }
}
```

#### GET /api/merchant/info/:merchantId
Lấy thông tin merchant công khai

**Response:**
```json
{
  "success": true,
  "merchant": {
    "merchantId": "MERCHANT_001",
    "businessName": "Coffee Shop ABC",
    "address": "123 Main Street",
    "isActive": true,
    "acceptedPayments": ["nfc", "qr"]
  }
}
```

### 🔧 Admin Endpoints

#### GET /api/admin/dashboard
Dashboard admin

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1500,
    "totalMerchants": 250,
    "totalTransactions": 25000,
    "totalVolume": "500000000",
    "dailyStats": {
      "users": 25,
      "transactions": 150,
      "volume": "2500000"
    }
  }
}
```

#### GET /api/admin/users
Quản lý users

**Query Parameters:**
- `page`: Số trang
- `limit`: Items per page
- `status`: Filter theo status
- `search`: Tìm kiếm

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "64f7a1b2c3d4e5f6789a0b1c",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "status": "active",
      "kycStatus": "verified",
      "createdAt": "2023-09-05T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 1500
  }
}
```

## 🚫 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": ["Additional error details"]
}
```

### Common Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Authentication required |
| 401 | INVALID_TOKEN | Invalid or expired token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

### Blockchain Error Codes

| Code | Description |
|------|-------------|
| BLOCKCHAIN_CONNECTION_ERROR | Cannot connect to Sui network |
| INSUFFICIENT_GAS | Not enough gas for transaction |
| TRANSACTION_FAILED | Blockchain transaction failed |
| INVALID_SIGNATURE | Invalid transaction signature |

## 📊 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 1 minute |
| Authentication | 5 attempts | 15 minutes |
| Payment | 10 requests | 1 minute |
| OTP | 3 requests | 5 minutes |

## 🔄 Webhooks

### Merchant Webhooks

Khi có giao dịch thành công, hệ thống sẽ gửi webhook đến URL đã cấu hình:

**POST to webhook URL:**
```json
{
  "event": "payment.completed",
  "timestamp": "2023-09-05T10:35:00.000Z",
  "data": {
    "transactionId": "64f7a1b2c3d4e5f6789a0b1f",
    "merchantId": "MERCHANT_001",
    "amount": 50000,
    "currency": "VND",
    "txHash": "0xabc123...",
    "user": {
      "id": "64f7a1b2c3d4e5f6789a0b1c"
    }
  },
  "signature": "sha256=..."
}
```

### Webhook Verification
Verify webhook signature:
```javascript
const crypto = require('crypto');

const signature = req.headers['x-signature'];
const payload = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

const isValid = signature === `sha256=${expectedSignature}`;
```

## 🧪 Testing

### Example API Tests

```bash
# Register new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "phoneNumber": "+84901234567",
    "fullName": "Test User"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Get user profile
curl -X GET http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create card
curl -X POST http://localhost:8080/api/card/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardType": "standard",
    "limits": {
      "daily": 500000,
      "monthly": 5000000
    }
  }'
```

## 📱 SDK & Integration

### JavaScript SDK Example
```javascript
const NFCPaymentAPI = require('@nfc-payment/sdk');

const client = new NFCPaymentAPI({
  apiKey: 'your-api-key',
  baseURL: 'http://localhost:8080/api'
});

// Create payment
const payment = await client.payments.create({
  cardUuid: '550e8400-e29b-41d4-a716-446655440000',
  amount: 50000,
  merchantId: 'MERCHANT_001'
});
```

## 📞 Support

- Documentation: [GitHub Wiki](https://github.com/your-repo/wiki)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Email: dev@nfcpayment.com