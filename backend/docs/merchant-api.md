# Merchant API Documentation

## Overview

The Merchant API allows businesses to integrate NFC payment processing into their applications. This API provides endpoints for merchant registration, payment processing, refunds, webhooks, and analytics.

## Authentication

All API requests (except registration and public endpoints) require authentication using API keys.

### API Key Format
- **Public Key**: `pk_xxxxxxxxxxxxxxxx`
- **Secret Key**: `sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Authentication Methods

#### 1. Authorization Header (Recommended)
```http
Authorization: Bearer pk_your_public_key:sk_your_secret_key
```

#### 2. Basic Authentication
```http
Authorization: Basic base64(pk_your_public_key:sk_your_secret_key)
```

#### 3. Custom Header
```http
X-API-Key: pk_your_public_key:sk_your_secret_key
```

## Base URL

```
https://api.nfcpayment.com/v1
```

## Endpoints

### 1. Merchant Registration

#### POST /merchants/register
Register a new merchant account.

**Request Body:**
```json
{
  "merchantName": "Coffee Shop Downtown",
  "businessType": "Food & Beverage",
  "email": "merchant@coffeeshop.com",
  "phoneNumber": "+1234567890",
  "address": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "postalCode": "94105"
  },
  "walletAddress": "0x1234567890abcdef...",
  "webhookUrl": "https://your-server.com/webhook",
  "settlementPeriod": "daily"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Merchant registered successfully",
  "data": {
    "merchantId": "mch_1234567890abcdef",
    "merchantName": "Coffee Shop Downtown",
    "email": "merchant@coffeeshop.com",
    "isActive": true,
    "isVerified": false,
    "commission": 2.5,
    "settlementPeriod": "daily",
    "nextSettlementDate": "2024-01-02T00:00:00.000Z",
    "apiKeys": {
      "publicKey": "pk_abcdef1234567890",
      "secretKey": "sk_1234567890abcdef1234567890abcdef",
      "webhookSecret": "whsec_abcdef1234567890abcdef1234567890"
    },
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. Merchant Profile

#### GET /merchants/profile
Get merchant profile information.

**Headers:**
```http
Authorization: Bearer pk_your_key:sk_your_secret
```

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "mch_1234567890abcdef",
    "merchantName": "Coffee Shop Downtown",
    "businessType": "Food & Beverage",
    "email": "merchant@coffeeshop.com",
    "phoneNumber": "+1234567890",
    "address": {
      "street": "123 Main Street",
      "city": "San Francisco",
      "state": "CA",
      "country": "USA",
      "postalCode": "94105"
    },
    "walletAddress": "0x1234567890abcdef...",
    "isActive": true,
    "isVerified": true,
    "commission": 2.5,
    "totalTransactions": 1523,
    "totalVolume": 45678.90,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### PUT /merchants/profile
Update merchant profile information.

**Request Body:**
```json
{
  "merchantName": "Coffee Shop Downtown - New Location",
  "phoneNumber": "+1234567891",
  "address": {
    "street": "456 Broadway",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "postalCode": "94102"
  },
  "webhookUrl": "https://your-new-server.com/webhook"
}
```

### 3. Payment Management

#### GET /merchants/payments
Get payment history with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by payment status

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "_id": "payment_12345",
        "amount": 25.99,
        "currency": "SUI",
        "status": "completed",
        "cardUuid": "card_abcdef",
        "txHash": "0x123abc...",
        "gasFee": 0.001,
        "createdAt": "2024-01-01T14:30:00.000Z",
        "completedAt": "2024-01-01T14:30:05.000Z",
        "userId": {
          "fullName": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "current": 1,
      "total": 15,
      "count": 298,
      "limit": 20
    }
  }
}
```

#### GET /merchants/payments/stats
Get payment statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "transactions": 12,
      "volume": 340.50,
      "fees": 0.12
    },
    "week": {
      "transactions": 89,
      "volume": 2456.78,
      "fees": 0.89
    },
    "month": {
      "transactions": 387,
      "volume": 10234.56,
      "fees": 3.67
    },
    "overall": {
      "transactions": 1523,
      "volume": 45678.90,
      "fees": 15.23,
      "averageTransaction": 30.02
    },
    "merchant": {
      "commission": 2.5,
      "nextSettlementDate": "2024-01-02T00:00:00.000Z",
      "isActive": true,
      "isVerified": true
    }
  }
}
```

#### POST /merchants/payments/refund/:paymentId
Process a refund for a payment.

**Request Body:**
```json
{
  "amount": 25.99,
  "reason": "Customer requested refund"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment refunded successfully",
  "data": {
    "originalTransaction": {
      "_id": "payment_12345",
      "status": "cancelled",
      "refundedAt": "2024-01-01T16:00:00.000Z"
    },
    "refundTransaction": {
      "_id": "refund_67890",
      "amount": 25.99,
      "status": "completed"
    },
    "refundAmount": 25.99
  }
}
```

### 4. Settings Management

#### GET /merchants/settings
Get merchant settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "mch_1234567890abcdef",
    "notifications": {
      "email": true,
      "webhook": true,
      "paymentSuccess": true,
      "paymentFailed": true,
      "refunds": true
    },
    "paymentMethods": ["nfc", "qr", "api"],
    "currency": "SUI",
    "autoSettlement": true,
    "settlementPeriod": "daily",
    "webhookUrl": "https://your-server.com/webhook",
    "commission": 2.5,
    "limits": {
      "daily": 10000,
      "monthly": 100000,
      "perTransaction": 1000
    }
  }
}
```

#### PUT /merchants/settings
Update merchant settings.

**Request Body:**
```json
{
  "notifications": {
    "email": true,
    "webhook": true,
    "paymentSuccess": true,
    "paymentFailed": false
  },
  "autoSettlement": false,
  "settlementPeriod": "weekly"
}
```

### 5. Webhook Management

#### GET /merchants/webhooks
Get all webhooks for the merchant.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "webhook_123",
      "url": "https://your-server.com/webhook",
      "events": ["payment.completed", "payment.failed", "refund.created"],
      "isActive": true,
      "description": "Main webhook endpoint",
      "lastDelivery": "2024-01-01T15:30:00.000Z",
      "lastDeliveryStatus": "success",
      "failureCount": 0,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

#### POST /merchants/webhooks
Create a new webhook.

**Request Body:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["payment.completed", "payment.failed"],
  "description": "Payment notifications webhook"
}
```

#### PUT /merchants/webhooks/:webhookId
Update an existing webhook.

#### DELETE /merchants/webhooks/:webhookId
Delete a webhook.

### 6. API Key Management

#### GET /merchants/api-keys
Get all API keys for the merchant.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "keyId": "key_1234567890abcdef",
      "name": "Production API Key",
      "publicKey": "pk_abcdef1234567890",
      "permissions": ["payments.create", "payments.read"],
      "isActive": true,
      "lastUsed": "2024-01-01T15:30:00.000Z",
      "usageCount": 1523,
      "rateLimit": {
        "requestsPerMinute": 60,
        "requestsPerHour": 1000,
        "requestsPerDay": 10000
      },
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

#### POST /merchants/api-keys
Create a new API key.

**Request Body:**
```json
{
  "name": "Development API Key",
  "permissions": ["payments.read", "profile.read"],
  "rateLimit": {
    "requestsPerMinute": 30,
    "requestsPerHour": 500,
    "requestsPerDay": 5000
  },
  "expiresIn": 365
}
```

#### DELETE /merchants/api-keys/:keyId
Delete an API key.

## Webhooks

Webhooks allow you to receive real-time notifications when events occur in your merchant account.

### Webhook Events

- `payment.created` - Payment initiated
- `payment.processing` - Payment being processed
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed
- `payment.cancelled` - Payment cancelled
- `refund.created` - Refund initiated
- `refund.completed` - Refund processed
- `refund.failed` - Refund failed

### Webhook Payload Example

```json
{
  "id": "wh_1234567890",
  "event": "payment.completed",
  "timestamp": "2024-01-01T14:30:05.000Z",
  "merchantId": "mch_1234567890abcdef",
  "data": {
    "transaction": {
      "id": "payment_12345",
      "amount": 25.99,
      "currency": "SUI",
      "status": "completed",
      "merchantId": "mch_1234567890abcdef",
      "cardUuid": "card_abcdef",
      "txHash": "0x123abc...",
      "createdAt": "2024-01-01T14:30:00.000Z",
      "completedAt": "2024-01-01T14:30:05.000Z"
    }
  }
}
```

### Webhook Security

All webhooks include an `X-Webhook-Signature` header containing an HMAC-SHA256 signature of the payload using your webhook secret.

**Verification Example (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `400` - Bad Request (validation errors, missing parameters)
- `401` - Unauthorized (invalid or missing API credentials)
- `403` - Forbidden (insufficient permissions, account inactive)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limits

- **Default**: 60 requests per minute per API key
- **Configurable** per API key up to 1000 requests per minute
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`: Request limit per window
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Window reset time

## Support

For API support and questions:
- Email: api-support@nfcpayment.com
- Documentation: https://docs.nfcpayment.com
- Status Page: https://status.nfcpayment.com