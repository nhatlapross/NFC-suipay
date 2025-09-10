# NFC Payment API Guide - Sui Blockchain Integration

## Tổng quan

Hệ thống NFC Payment tích hợp với Sui blockchain cho phép xử lý thanh toán an toàn và minh bạch. API cung cấp các endpoint để quản lý ví, xử lý thanh toán NFC, và theo dõi giao dịch blockchain.

## 🚀 Base URL
```
http://localhost:8080/api
```

## 🔐 Authentication

Tất cả các endpoint (trừ health check) yêu cầu JWT token:
```bash
Authorization: Bearer <your_jwt_token>
```

---

## 📋 1. Health Check

### GET /health
Kiểm tra trạng thái server

**Request:**
```bash
curl -X GET "http://localhost:8080/health"
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-09T17:31:42.132Z",
  "uptime": 411.7903651,
  "environment": "development"
}
```

---

## 💳 2. NFC Payment APIs

### 2.1 Process NFC Payment (Direct) ⭐ **RECOMMENDED**
Xử lý thanh toán NFC trực tiếp với Sui blockchain

**Endpoint:** `POST /payment/process-direct`

**Request:**
```bash
curl -X POST "http://localhost:8080/api/payment/process-direct" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 0.01,
    "merchantId": "MERCHANT_001",
    "terminalId": "TERMINAL_001"
  }'
```

**Request Body:**
```json
{
  "cardUuid": "string",     // UUID của NFC card
  "amount": "number",       // Số tiền (SUI), minimum: 0.01
  "merchantId": "string",   // ID merchant
  "terminalId": "string"    // ID terminal
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "transaction": {
    "transactionId": "17b3683a-0a56-40a7-af4d-599c6fa460f2",
    "txHash": "rPJL7BqqPRmvy1k5wtPd9DPoeo17Y5p2Xr1P4THmPyv",
    "amount": 0.01,
    "gasFee": 0.001,
    "totalAmount": 0.011,
    "status": "completed",
    "explorerUrl": "https://suiscan.xyz/testnet/tx/rPJL7BqqPRmvy1k5wtPd9DPoeo17Y5p2Xr1P4THmPyv"
  }
}
```

### 2.2 Process NFC Payment (Async)
Xử lý thanh toán NFC qua queue (có thể chậm hơn)

**Endpoint:** `POST /payment/process-async`

**Request:**
```bash
curl -X POST "http://localhost:8080/api/payment/process-async" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 0.01,
    "merchantId": "MERCHANT_001",
    "terminalId": "TERMINAL_001"
  }'
```

**Success Response (202):**
```json
{
  "success": true,
  "message": "Payment processing initiated",
  "transactionId": "f04e55ca-196d-44b8-bf6e-a526f37ea2ab",
  "status": "pending",
  "estimatedProcessingTime": "2-5 seconds",
  "tracking": {
    "jobId": "12",
    "transactionId": "f04e55ca-196d-44b8-bf6e-a526f37ea2ab",
    "websocketChannel": "user:68bf13c1746dd185de2ee844"
  }
}
```

### 2.3 Validate NFC Payment
Kiểm tra tính hợp lệ của thanh toán trước khi xử lý

**Endpoint:** `POST /payment/nfc-validate`

**Request:**
```bash
curl -X POST "http://localhost:8080/api/payment/nfc-validate" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 0.01,
    "merchantId": "MERCHANT_001"
  }'
```

---

## 💰 3. Wallet Management APIs

### 3.1 Get Wallet Balance
Kiểm tra số dư ví

**Endpoint:** `GET /wallet/balance/:address`

**Request:**
```bash
curl -X GET "http://localhost:8080/api/wallet/balance/0xf3ad909893af3343b34db08155f7f8073ee0321f00a4bdfe1cee961238ed5de2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "address": "0xf3ad909893af3343b34db08155f7f8073ee0321f00a4bdfe1cee961238ed5de2",
  "balance": 0.06600424,
  "coinObjectCount": 1
}
```

### 3.2 Get Wallet Objects
Xem các coin objects trong ví

**Endpoint:** `GET /wallet/objects/:address`

**Request:**
```bash
curl -X GET "http://localhost:8080/api/wallet/objects/0xf3ad909893af3343b34db08155f7f8073ee0321f00a4bdfe1cee961238ed5de2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "objects": [
    {
      "data": {
        "objectId": "0x3c664e8e95be7601ae1bc1fd7f74c8e49d373e4e165efff7b5edf1702300b663",
        "version": "568237325",
        "type": "0x2::coin::Coin<0x2::sui::SUI>",
        "content": {
          "fields": {
            "balance": "66004240000",
            "id": {
              "id": "0x3c664e8e95be7601ae1bc1fd7f74c8e49d373e4e165efff7b5edf1702300b663"
            }
          }
        }
      }
    }
  ],
  "hasNextPage": false
}
```

### 3.3 Transfer SUI
Chuyển SUI trực tiếp

**Endpoint:** `POST /wallet/transfer`

**Request:**
```bash
curl -X POST "http://localhost:8080/api/wallet/transfer" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "0xe92bfd25182a0562f126a364881502761c7d20739585234288728f449fc51bda",
    "amount": 0.01
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "transaction": {
    "id": "68c05e036624f4a80448c20b",
    "txHash": "8Veo3d4HbGQrbBrx7TyPktKGeRxxNsgNpTZTqKyHyb7Q",
    "amount": 0.01,
    "gasFee": 0.002976,
    "totalAmount": 0.012976,
    "recipient": "0xe92bfd25182a0562f126a364881502761c7d20739585234288728f449fc51bda",
    "status": "completed",
    "explorerUrl": "https://suiscan.xyz/testnet/tx/8Veo3d4HbGQrbBrx7TyPktKGeRxxNsgNpTZTqKyHyb7Q"
  }
}
```

---

## 📊 4. Transaction APIs

### 4.1 Get Transaction History
Lấy lịch sử giao dịch

**Endpoint:** `GET /payment/transactions`

**Parameters:**
- `page` (optional): Trang, default = 1
- `limit` (optional): Số lượng, default = 20

**Request:**
```bash
curl -X GET "http://localhost:8080/api/payment/transactions?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "_id": "68c0620b5235abf9dd4386e8",
      "userId": "68bf13c1746dd185de2ee844",
      "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
      "txHash": "61cKBPDck2HBoMLhXq1CinG6WfERAzUYpSR86KvYj8MY",
      "type": "payment",
      "amount": 0.01,
      "currency": "SUI",
      "status": "completed",
      "gasFee": 0.001,
      "totalAmount": 0.011,
      "fromAddress": "0xf3ad909893af3343b34db08155f7f8073ee0321f00a4bdfe1cee961238ed5de2",
      "toAddress": "0xe92bfd25182a0562f126a364881502761c7d20739585234288728f449fc51bda",
      "completedAt": "2025-09-09T17:21:15.831Z",
      "createdAt": "2025-09-09T17:21:12.403Z"
    }
  ],
  "total": 15,
  "pages": 3
}
```

### 4.2 Get Specific Transaction
Lấy thông tin giao dịch cụ thể

**Endpoint:** `GET /payment/transactions/:id`

**Request:**
```bash
curl -X GET "http://localhost:8080/api/payment/transactions/68c0620b5235abf9dd4386e8" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4.3 Get Payment Statistics
Thống kê thanh toán theo thời gian

**Endpoint:** `GET /payment/stats`

**Parameters:**
- `period`: day, week, month, quarter, year, all
- `cardUuid` (optional): Lọc theo card cụ thể

**Request:**
```bash
curl -X GET "http://localhost:8080/api/payment/stats?period=day" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ❌ Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Authentication required |
| AUTH_002 | Token expired |
| AUTH_003 | Invalid token |
| VAL_001 | Validation error |
| PAY_001 | Insufficient balance |
| SYS_001 | System error |

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details (optional)"
}
```

---

## 🔧 Testing Examples

### Complete Payment Flow Test
```bash
# 1. Check balance
curl -X GET "http://localhost:8080/api/wallet/balance/YOUR_WALLET_ADDRESS" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Process NFC payment
curl -X POST "http://localhost:8080/api/payment/process-direct" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 0.01,
    "merchantId": "MERCHANT_001", 
    "terminalId": "TERMINAL_001"
  }'

# 3. Check transaction history
curl -X GET "http://localhost:8080/api/payment/transactions?limit=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🌐 Blockchain Integration

### Sui Network Details
- **Network**: Testnet
- **Explorer**: https://suiscan.xyz/testnet/
- **Currency**: SUI
- **Min Amount**: 0.01 SUI
- **Gas Fee**: ~0.001-0.003 SUI

### Transaction Flow
1. **Validation**: Card UUID, amount, merchant validation
2. **Blockchain Transaction**: Sui transaction creation & signing
3. **Execution**: Submit to Sui network
4. **Confirmation**: Wait for blockchain confirmation
5. **Database Update**: Update transaction status
6. **Response**: Return transaction details with explorer link

---

## 🔍 Rate Limiting
- **Default**: 100 requests per minute
- **Payment endpoints**: Additional rate limiting applied
- **Headers**: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

---

## 📝 Notes

1. **Recommend sử dụng `/process-direct`** cho thanh toán realtime
2. **Test trên Testnet** trước khi deploy production  
3. **Monitor gas fees** - có thể thay đổi theo network condition
4. **Wallet setup** cần thiết trước khi thanh toán
5. **Transaction IDs** unique cho mỗi giao dịch

---

## 🎯 Next Steps

1. Implement WebSocket real-time updates
2. Add refund functionality  
3. Merchant dashboard APIs
4. Analytics & reporting endpoints
5. Mainnet deployment guide

---

*Generated: 2025-09-09*
*Version: 1.0*
*Network: Sui Testnet*