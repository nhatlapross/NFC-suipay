# NFC SuiPay API Guide

Hướng dẫn sử dụng API cho hệ thống thanh toán NFC với Sui blockchain.

## 🚀 Quick Start

### Base URL
```
Development: http://localhost:8080/api
Production: https://nfc-suipay.onrender.com/api
```

### Authentication
```bash
# JWT Token
Authorization: Bearer <jwt_token>

# Merchant API Key
Authorization: Bearer <public_key>:<secret_key>
# hoặc
X-API-Key: <public_key>:<secret_key>
```

## 📚 Core APIs

### 1. Authentication (`/api/auth`)

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123",
  "role": "user" // hoặc "merchant"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Refresh Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

### 2. Merchant APIs (`/api/merchant`)

#### Register Merchant
```bash
POST /api/merchant/register
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "merchantId": "MERCHANT_001",
  "businessName": "My Store",
  "businessType": "retail",
  "address": "123 Main St",
  "city": "Ho Chi Minh",
  "country": "Vietnam",
  "phone": "+84901234567",
  "email": "merchant@example.com",
  "walletAddress": "0x...",
  "settlementPeriod": "daily"
}
```

#### Get Merchant Profile
```bash
GET /api/merchant/profile
Authorization: Bearer <public_key>:<secret_key>
```

#### Get Payment Stats
```bash
GET /api/merchant/payments/stats
Authorization: Bearer <public_key>:<secret_key>
```

#### Get Payments
```bash
GET /api/merchant/payments?page=1&limit=10&status=completed
Authorization: Bearer <public_key>:<secret_key>
```

#### Refund Payment
```bash
POST /api/merchant/payments/refund/:paymentId
Authorization: Bearer <public_key>:<secret_key>
Content-Type: application/json

{
  "reason": "Customer request"
}
```

### 3. Oracle APIs (`/api/oracle`)

#### Get Current Rate
```bash
GET /api/oracle/rate
```

Response:
```json
{
  "success": true,
  "data": {
    "usdToVnd": 26393,
    "vndToUsd": 0.00003789,
    "timestamp": 1703123456789,
    "source": "CoinGecko",
    "formatted": {
      "usdToVnd": "26,393",
      "vndToUsd": "0.000038"
    }
  }
}
```

#### Update Rate
```bash
POST /api/oracle/rate/update
Authorization: Bearer <jwt_token>
```

#### Convert Currency
```bash
POST /api/oracle/convert
Content-Type: application/json

{
  "amount": 100,
  "from": "USD",
  "to": "VND"
}
```

### 4. Payment APIs (`/api/payment`)

#### Create Payment
```bash
POST /api/payment/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 1000000,
  "currency": "VND",
  "merchantId": "MERCHANT_001",
  "description": "Payment for goods"
}
```

#### Process Payment
```bash
POST /api/payment/process
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paymentId": "payment_123",
  "walletAddress": "0x...",
  "signature": "signature_here"
}
```

### 5. Wallet APIs (`/api/wallet`)

#### Get Balance
```bash
GET /api/wallet/balance
Authorization: Bearer <jwt_token>
```

#### Get Transactions
```bash
GET /api/wallet/transactions?page=1&limit=10
Authorization: Bearer <jwt_token>
```

## 🔧 Smart Contract Integration

### Sui Move Modules
- **Package ID**: `0x9cef0ecb45dec10eeab38bd1ba8e81c6515b49a437ee1324d07fad8b7816a46a`
- **Oracle Object ID**: `0x05509fb8ef559a5499ad13189e604434b30f86e256bd692b80d1d5ccb2ddfe00`
- **Pool Object ID**: `0xfb9b73c95fcc948cbb4860cbe1816c726ae79e797cf9c71865638c6832727ade`

### Available Functions
- `mint_token()` - Mint USD/VND tokens
- `deposit_VND()` - Deposit VND vào pool
- `deposit_USD()` - Deposit USD vào pool
- `swap_VND_to_USD()` - Swap VND sang USD
- `swap_USD_to_VND()` - Swap USD sang VND
- `update_price()` - Cập nhật tỉ giá

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🔒 Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## 🚀 Rate Limits

- **General APIs**: 100 requests/minute
- **Payment APIs**: 20 requests/minute
- **Oracle APIs**: 50 requests/minute
- **Merchant APIs**: 200 requests/minute

## 📝 Examples

### Complete Payment Flow
```bash
# 1. Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user123","email":"user@example.com","password":"password123","role":"user"}'

# 2. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 3. Get current rate
curl -X GET http://localhost:8080/api/oracle/rate

# 4. Create payment
curl -X POST http://localhost:8080/api/payment/create \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000000,"currency":"VND","merchantId":"MERCHANT_001","description":"Payment for goods"}'

# 5. Process payment
curl -X POST http://localhost:8080/api/payment/process \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"paymentId":"payment_123","walletAddress":"0x...","signature":"signature_here"}'
```

### Merchant Flow
```bash
# 1. Register merchant
curl -X POST http://localhost:8080/api/merchant/register \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"merchantId":"MERCHANT_001","businessName":"My Store","businessType":"retail","address":"123 Main St","city":"Ho Chi Minh","country":"Vietnam","phone":"+84901234567","email":"merchant@example.com","walletAddress":"0x...","settlementPeriod":"daily"}'

# 2. Get API keys
curl -X GET http://localhost:8080/api/merchant/api-keys \
  -H "Authorization: Bearer <jwt_token>"

# 3. Get payment stats
curl -X GET http://localhost:8080/api/merchant/payments/stats \
  -H "Authorization: Bearer <public_key>:<secret_key>"

# 4. Get payments
curl -X GET http://localhost:8080/api/merchant/payments?page=1&limit=10 \
  -H "Authorization: Bearer <public_key>:<secret_key>"
```

## 🎯 Next Steps

1. **Frontend Integration**: Kết nối với React frontend
2. **Mobile App**: React Native mobile app
3. **Advanced Features**: More payment methods
4. **Analytics**: Advanced reporting
5. **Scaling**: Microservices architecture
