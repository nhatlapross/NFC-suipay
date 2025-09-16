# Sponsor Service Setup Guide

## Overview
Sponsor service cho phép tự động faucet SUI và MY_COIN (sVND) cho các addresses. Service này sử dụng một sponsor wallet được config trong environment variables.

## Features

### 🚰 **Faucet từ Sponsor Wallet** (Authenticated)
- Transfer SUI và MY_COIN từ sponsor wallet trong env
- Authenticated users có thể request faucet
- Rate limited để tránh abuse

### 💰 **Direct Sponsor** (Admin/Merchant)
- Send SUI và MY_COIN đến address bất kỳ
- Cần role admin hoặc merchant
- Cho admin tools và merchant operations

### 🎁 **User Sponsoring**
- Sponsor funds trực tiếp vào user's wallet
- Bulk sponsor cho nhiều addresses
- Admin controls

## Setup

### 1. Add Environment Variables

Thêm vào `.env` file:

```bash
# Sponsor wallet private key (Sui bech32 format)
SPONSOR_PRIVATE_KEY=suiprivkey1qq6rknnhy9gf0tukhgqfns7smushs65xm7vgut3w6292jdxf3ctdq8rnp50

# Optional: Customize network (default: testnet)
SUI_NETWORK=testnet
```

### 2. Fund Sponsor Wallet

Sponsor wallet cần có:
- **SUI**: Cho gas fees và SUI transfers
- **MY_COIN (sVND)**: Cho sVND transfers

Check balance:
```bash
curl http://localhost:8080/api/sponsor/info
```

### 3. Test the Service

```bash
node test-sponsor.js
```

## API Endpoints

### Public Endpoints

#### Get Sponsor Info
```bash
GET /api/sponsor/info
```

### Authenticated Endpoints

#### Faucet SUI từ Sponsor
```bash
POST /api/sponsor/faucet/sui
Authorization: Bearer <token>
{
  "address": "0x...",
  "amount": 0.1  // Optional, default 0.1 SUI
}
```

#### Faucet MY_COIN từ Sponsor
```bash
POST /api/sponsor/faucet/mycoin
Authorization: Bearer <token>
{
  "address": "0x...",
  "amount": 100  // Optional, default 100 sVND
}
```

### Admin/Merchant Only Endpoints

#### Sponsor SUI
```bash
POST /api/sponsor/sui
Authorization: Bearer <token>
{
  "address": "0x...",
  "amount": 0.1
}
```

#### Sponsor MY_COIN
```bash
POST /api/sponsor/mycoin
Authorization: Bearer <token>
{
  "address": "0x...",
  "amount": 10
}
```

#### Sponsor Current User
```bash
POST /api/sponsor/user
Authorization: Bearer <token>
{
  "suiAmount": 0.1,
  "myCoinAmount": 20
}
```

#### Bulk Sponsor (Admin only)
```bash
POST /api/sponsor/bulk
Authorization: Bearer <admin-token>
{
  "recipients": [
    {
      "address": "0x...",
      "suiAmount": 0.1,
      "myCoinAmount": 10
    }
  ]
}
```

## Usage Examples

### Test User Workflow
```javascript
// 1. User login
const loginResponse = await axios.post('/api/auth/login', {
  email: 'user@example.com',
  password: 'password'
});

// 2. Get free testnet SUI (public)
await axios.post('/api/sponsor/faucet/sui', {
  address: userWalletAddress
});

// 3. Sponsor sVND to user (authenticated)
await axios.post('/api/sponsor/user', {
  myCoinAmount: 50
}, {
  headers: { Authorization: `Bearer ${token}` }
});

// 4. Now user can make payments!
```

### Admin Bulk Setup
```javascript
// Sponsor nhiều test users cùng lúc
await axios.post('/api/sponsor/bulk', {
  recipients: [
    { address: '0x123...', suiAmount: 0.1, myCoinAmount: 50 },
    { address: '0x456...', suiAmount: 0.1, myCoinAmount: 50 },
    { address: '0x789...', suiAmount: 0.1, myCoinAmount: 50 }
  ]
}, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

## Security Features

- **Rate limiting** trên tất cả endpoints
- **Authentication** cho sponsor operations
- **Role-based access** (user/merchant/admin)
- **Amount limits** để tránh drain funds
- **Input validation** cho addresses và amounts
- **Comprehensive logging**

## Troubleshooting

### Sponsor Not Configured
```json
{
  "configured": false,
  "message": "Sponsor wallet not configured"
}
```
**Fix**: Add `SPONSOR_PRIVATE_KEY` to `.env`

### Insufficient Balance
```json
{
  "success": false,
  "error": "Sponsor wallet has insufficient SUI balance"
}
```
**Fix**: Fund sponsor wallet with more SUI/MY_COIN

### Invalid Address
```json
{
  "success": false,
  "error": "Invalid Sui address format"
}
```
**Fix**: Use proper Sui address format (0x... with 66 chars)

## Monitoring

Service tự động log:
- Sponsor wallet balances on startup
- All transactions với details
- Error cases với context

Check logs để monitor usage và detect issues.

---

## Quick Start

1. **Add private key to .env**
2. **Fund sponsor wallet**
3. **Restart backend**
4. **Run test script**
5. **Start sponsoring users!**

Sponsor service giúp test environment dễ dàng hơn bằng cách tự động cung cấp funds cho testing.