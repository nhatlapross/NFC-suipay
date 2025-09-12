# NFC Payment API - Test Examples & Use Cases

## 🧪 Complete Test Suite

### Prerequisites
```bash
# Set base URL
export API_BASE="http://localhost:8080/api"

# Set JWT token (replace with actual token)
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJmMTNjMTc0NmRkMTg1ZGUyZWU4NDQiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc1NzQzNjQyNywiZXhwIjoxNzU3NDQwMDI3fQ.7n2qq17LM0_c8sQLCKm_MJFVWsbwVVdPWrCzdWbzxe8"

# Set test data
export USER_WALLET="0xf3ad909893af3343b34db08155f7f8073ee0321f00a4bdfe1cee961238ed5de2"
export MERCHANT_WALLET="0xe92bfd25182a0562f126a364881502761c7d20739585234288728f449fc51bda"
export TEST_CARD="550e8400-e29b-41d4-a716-446655440000"
```

---

## 🎯 Use Case 1: Standard NFC Payment Flow

### Step 1: Check User Wallet Balance
```bash
curl -X GET "$API_BASE/wallet/balance/$USER_WALLET" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | python -m json.tool
```

**Expected Response:**
```json
{
  "success": true,
  "address": "0xf3ad909893af3343b34db08155f7f8073ee0321f00a4bdfe1cee961238ed5de2",
  "balance": 0.06600424,
  "coinObjectCount": 1
}
```

### Step 2: Validate NFC Payment
```bash
curl -X POST "$API_BASE/payment/nfc-validate" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "'$TEST_CARD'",
    "amount": 0.01,
    "merchantId": "MERCHANT_001"
  }' | python -m json.tool
```

### Step 3: Process NFC Payment (Direct)
```bash
curl -X POST "$API_BASE/payment/process-direct" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "'$TEST_CARD'",
    "amount": 0.01,
    "merchantId": "MERCHANT_001",
    "terminalId": "TERMINAL_001"
  }' | python -m json.tool
```

**Expected Success Response:**
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

### Step 4: Verify Transaction in History
```bash
curl -X GET "$API_BASE/payment/transactions?limit=1" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | python -m json.tool
```

### Step 5: Check Updated Balance
```bash
curl -X GET "$API_BASE/wallet/balance/$USER_WALLET" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | python -m json.tool
```

---

## 🎯 Use Case 2: Batch Payment Processing

### Process Multiple Payments
```bash
# Payment 1
curl -X POST "$API_BASE/payment/process-direct" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "'$TEST_CARD'",
    "amount": 0.01,
    "merchantId": "MERCHANT_001",
    "terminalId": "TERMINAL_001"
  }'

echo "Waiting 5 seconds..."
sleep 5

# Payment 2  
curl -X POST "$API_BASE/payment/process-direct" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "'$TEST_CARD'",
    "amount": 0.02,
    "merchantId": "MERCHANT_001",
    "terminalId": "TERMINAL_002"
  }'

# Check batch results
curl -X GET "$API_BASE/payment/transactions?limit=5" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 🎯 Use Case 3: Error Handling Tests

### Test Insufficient Balance
```bash
curl -X POST "$API_BASE/payment/process-direct" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "'$TEST_CARD'",
    "amount": 999.99,
    "merchantId": "MERCHANT_001",
    "terminalId": "TERMINAL_001"
  }'
```

**Expected Error Response:**
```json
{
  "success": false,
  "error": "Insufficient balance",
  "code": "PAY_001",
  "details": {
    "walletBalance": 0.066,
    "requiredAmount": 1000.0,
    "transferAmount": 999.99,
    "estimatedGasFee": 0.01
  }
}
```

### Test Invalid Amount
```bash
curl -X POST "$API_BASE/payment/process-direct" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "'$TEST_CARD'",
    "amount": 0.005,
    "merchantId": "MERCHANT_001",
    "terminalId": "TERMINAL_001"
  }'
```

### Test Invalid Card UUID
```bash
curl -X POST "$API_BASE/payment/process-direct" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "invalid-card-uuid",
    "amount": 0.01,
    "merchantId": "MERCHANT_001",
    "terminalId": "TERMINAL_001"
  }'
```

### Test Missing Authentication
```bash
curl -X POST "$API_BASE/payment/process-direct" \
  -H "Content-Type: application/json" \
  -d '{
    "cardUuid": "'$TEST_CARD'",
    "amount": 0.01,
    "merchantId": "MERCHANT_001",
    "terminalId": "TERMINAL_001"
  }'
```

---

## 🎯 Use Case 4: Wallet Management

### Direct SUI Transfer
```bash
curl -X POST "$API_BASE/wallet/transfer" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "'$MERCHANT_WALLET'",
    "amount": 0.01
  }' | python -m json.tool
```

### Get Wallet Objects
```bash
curl -X GET "$API_BASE/wallet/objects/$USER_WALLET" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | python -m json.tool
```

---

## 🎯 Use Case 5: Analytics & Reporting

### Daily Payment Stats
```bash
curl -X GET "$API_BASE/payment/stats?period=day" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | python -m json.tool
```

### Weekly Stats with Card Filter
```bash
curl -X GET "$API_BASE/payment/stats?period=week&cardUuid=$TEST_CARD" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | python -m json.tool
```

### All-time Stats
```bash
curl -X GET "$API_BASE/payment/stats?period=all" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | python -m json.tool
```

---

## 🎯 Use Case 6: Performance Testing

### Concurrent Payment Test
```bash
#!/bin/bash
# concurrent_test.sh

for i in {1..5}; do
  (
    echo "Starting payment $i"
    curl -X POST "$API_BASE/payment/process-direct" \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "cardUuid": "'$TEST_CARD'",
        "amount": 0.01,
        "merchantId": "MERCHANT_001",
        "terminalId": "TERMINAL_'$i'"
      }' &
  )
done

wait
echo "All payments completed"
```

### Load Test with Different Amounts
```bash
amounts=(0.01 0.02 0.015 0.025 0.03)

for amount in "${amounts[@]}"; do
  echo "Processing payment: $amount SUI"
  curl -X POST "$API_BASE/payment/process-direct" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "cardUuid": "'$TEST_CARD'",
      "amount": '$amount',
      "merchantId": "MERCHANT_001",
      "terminalId": "TERMINAL_LOAD_TEST"
    }'
  
  sleep 2
done
```

---

## 🎯 Use Case 7: Monitoring & Health

### Server Health Check
```bash
curl -X GET "http://localhost:8080/health" | python -m json.tool
```

### Rate Limit Testing
```bash
# Test rate limiting
for i in {1..10}; do
  echo "Request $i"
  curl -X GET "$API_BASE/wallet/balance/$USER_WALLET" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -w "Status: %{http_code}, Time: %{time_total}s\n" \
    -o /dev/null -s
done
```

---

## 📊 Expected Performance Metrics

### Typical Response Times
- **Health Check**: < 50ms
- **Balance Check**: 100-300ms
- **Validate Payment**: 200-500ms  
- **Direct Payment**: 3-8 seconds (blockchain dependent)
- **Async Payment**: 200ms (initial response)
- **Transaction History**: 100-400ms

### Blockchain Metrics
- **Gas Fee Range**: 0.001 - 0.003 SUI
- **Confirmation Time**: 2-5 seconds
- **Success Rate**: > 99% (with sufficient balance)

---

## 🐛 Common Issues & Solutions

### Issue: "Token expired"
**Solution:**
```bash
# Get new token via login endpoint
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Issue: "Insufficient balance"
**Solution:**
```bash
# Check current balance
curl -X GET "$API_BASE/wallet/balance/$USER_WALLET" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Get testnet SUI from faucet (external)
# Visit: https://discord.gg/sui -> #testnet-faucet -> !faucet YOUR_ADDRESS
```

### Issue: "Transaction validation failed"
**Solution:**
- Check card UUID exists and is active
- Verify merchant ID exists
- Ensure amount >= 0.01 SUI
- Confirm user has wallet configured

---

## 🚀 Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

class NFCPaymentAPI {
  constructor(baseURL, token) {
    this.api = axios.create({
      baseURL,
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async processPayment(cardUuid, amount, merchantId, terminalId) {
    try {
      const response = await this.api.post('/payment/process-direct', {
        cardUuid, amount, merchantId, terminalId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Payment failed');
    }
  }

  async getBalance(address) {
    const response = await this.api.get(`/wallet/balance/${address}`);
    return response.data;
  }
}

// Usage
const nfc = new NFCPaymentAPI('http://localhost:8080/api', 'your-jwt-token');
const result = await nfc.processPayment('card-uuid', 0.01, 'MERCHANT_001', 'TERMINAL_001');
```

### Python
```python
import requests

class NFCPaymentAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def process_payment(self, card_uuid, amount, merchant_id, terminal_id):
        url = f"{self.base_url}/payment/process-direct"
        data = {
            'cardUuid': card_uuid,
            'amount': amount, 
            'merchantId': merchant_id,
            'terminalId': terminal_id
        }
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

# Usage  
nfc = NFCPaymentAPI('http://localhost:8080/api', 'your-jwt-token')
result = nfc.process_payment('card-uuid', 0.01, 'MERCHANT_001', 'TERMINAL_001')
```

---

*Last Updated: 2025-09-09*
*API Version: 1.0*
*Blockchain: Sui Testnet*