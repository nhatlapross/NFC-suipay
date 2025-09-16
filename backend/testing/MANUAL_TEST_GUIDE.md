# Manual Testing Guide for Merchant API

## Prerequisites
- Server running on `http://localhost:8080`
- Tool like Postman, Insomnia, or curl available

## Test Cases

### 1. Merchant Registration
**Endpoint:** `POST /api/merchant/register`

**Request Body:**
```json
{
  "merchantName": "Test Coffee Shop",
  "businessType": "Food & Beverage",
  "email": "your-test-email@example.com",
  "phoneNumber": "+1234567890",
  "address": {
    "street": "123 Test Street",
    "city": "San Francisco",
    "state": "CA", 
    "country": "USA",
    "postalCode": "94105"
  },
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678901234567890abcdef1234567890abcdef",
  "webhookUrl": "https://webhook.example.com/test"
}
```

**Expected Response:** `201 Created`
```json
{
  "success": true,
  "message": "Merchant registered successfully",
  "data": {
    "merchantId": "mch_...",
    "apiKeys": {
      "publicKey": "pk_...",
      "secretKey": "sk_...",
      "webhookSecret": "whsec_..."
    }
  }
}
```

**Save the API keys for next tests!**

---

### 2. Get Public Merchant Info
**Endpoint:** `GET /api/merchant/public/{merchantId}`

Replace `{merchantId}` with the ID from step 1.

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "merchantId": "mch_...",
    "merchantName": "Test Coffee Shop",
    "businessType": "Food & Beverage",
    "isActive": true,
    "isVerified": false
  }
}
```

---

### 3. Get Merchant Profile (Authenticated)
**Endpoint:** `GET /api/merchant/profile`

**Headers:**
```
Authorization: Bearer pk_your_public_key:sk_your_secret_key
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "merchantId": "mch_...",
    "merchantName": "Test Coffee Shop",
    "email": "your-test-email@example.com",
    "isActive": true,
    "totalTransactions": 0,
    "totalVolume": 0
  }
}
```

---

### 4. Update Merchant Profile
**Endpoint:** `PUT /api/merchants/profile`

**Headers:**
```
Authorization: Bearer pk_your_public_key:sk_your_secret_key
Content-Type: application/json
```

**Request Body:**
```json
{
  "merchantName": "Updated Test Coffee Shop",
  "phoneNumber": "+1234567891"
}
```

**Expected Response:** `200 OK`

---

### 5. Get Payment Stats
**Endpoint:** `GET /api/merchants/payments/stats`

**Headers:**
```
Authorization: Bearer pk_your_public_key:sk_your_secret_key
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "today": { "transactions": 0, "volume": 0, "fees": 0 },
    "week": { "transactions": 0, "volume": 0, "fees": 0 },
    "month": { "transactions": 0, "volume": 0, "fees": 0 },
    "overall": { "transactions": 0, "volume": 0, "averageTransaction": 0 }
  }
}
```

---

### 6. Get Merchant Settings
**Endpoint:** `GET /api/merchants/settings`

**Headers:**
```
Authorization: Bearer pk_your_public_key:sk_your_secret_key
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "merchantId": "mch_...",
    "notifications": {
      "email": true,
      "webhook": true,
      "paymentSuccess": true,
      "paymentFailed": true
    },
    "paymentMethods": ["nfc", "qr", "api"],
    "currency": "SUI",
    "commission": 2.5
  }
}
```

---

### 7. Create Webhook
**Endpoint:** `POST /api/merchants/webhooks`

**Headers:**
```
Authorization: Bearer pk_your_public_key:sk_your_secret_key
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://test-webhook.example.com/webhook",
  "events": ["payment.completed", "payment.failed", "refund.created"],
  "description": "Test webhook endpoint"
}
```

**Expected Response:** `201 Created`

---

### 8. Get Webhooks
**Endpoint:** `GET /api/merchants/webhooks`

**Headers:**
```
Authorization: Bearer pk_your_public_key:sk_your_secret_key
```

**Expected Response:** `200 OK` with array of webhooks

---

### 9. Create API Key
**Endpoint:** `POST /api/merchants/api-keys`

**Headers:**
```
Authorization: Bearer pk_your_public_key:sk_your_secret_key
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Test Development Key",
  "permissions": ["payments.read", "profile.read"],
  "rateLimit": {
    "requestsPerMinute": 30,
    "requestsPerHour": 500,
    "requestsPerDay": 5000
  },
  "expiresIn": 30
}
```

**Expected Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "keyId": "key_...",
    "publicKey": "pk_...",
    "secretKey": "sk_...",
    "permissions": ["payments.read", "profile.read"]
  }
}
```

---

### 10. Get API Keys
**Endpoint:** `GET /api/merchants/api-keys`

**Headers:**
```
Authorization: Bearer pk_your_public_key:sk_your_secret_key
```

**Expected Response:** `200 OK` with array of API keys (without secret keys)

---

## Error Testing

### Test Invalid Authentication
**Endpoint:** `GET /api/merchants/profile`

**Headers:**
```
Authorization: Bearer invalid:credentials
```

**Expected Response:** `401 Unauthorized`
```json
{
  "success": false,
  "error": "Invalid API credentials"
}
```

### Test Validation Errors
**Endpoint:** `POST /api/merchants/register`

**Request Body:**
```json
{
  "merchantName": "",
  "businessType": "Test"
}
```

**Expected Response:** `400 Bad Request` with validation errors

---

## PowerShell Quick Test

Run this in PowerShell to quickly test registration:

```powershell
# Change directory to backend folder
cd F:\nfc-payment-app\backend

# Run the test script
.\test-endpoints.ps1
```

## curl Quick Tests

```bash
# Test registration
curl -X POST http://localhost:3000/api/merchants/register \
  -H "Content-Type: application/json" \
  -d '{
    "merchantName": "Test Shop",
    "businessType": "Retail",
    "email": "test@example.com", 
    "phoneNumber": "+1234567890",
    "address": {
      "street": "123 St",
      "city": "SF",
      "state": "CA",
      "country": "USA", 
      "postalCode": "94105"
    },
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678901234567890abcdef1234567890abcdef"
  }'

# Test invalid auth
curl -X GET http://localhost:3000/api/merchants/profile \
  -H "Authorization: Bearer invalid:credentials"
```

---

## Success Indicators

✅ **All tests should pass with appropriate HTTP status codes**
✅ **Registration returns merchant ID and API keys**  
✅ **Authentication works with valid API keys**
✅ **Authentication fails with invalid credentials**
✅ **All endpoints return proper JSON responses**
✅ **Validation errors are handled correctly**

Happy testing! 🚀