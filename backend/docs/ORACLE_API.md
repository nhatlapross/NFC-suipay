# Oracle API Documentation

## Overview
API để tương tác với smart contract oracle của bạn (`swap::custom_oracle`) để lấy và cập nhật tỉ giá USD/VND.

## Endpoints

### 1. Lấy tỉ giá hiện tại
```http
GET /api/oracle/rate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "usdToVnd": 24300,
    "vndToUsd": 0.000041,
    "timestamp": 1695123456789,
    "source": "smart-contract",
    "formatted": {
      "usdToVnd": "24,300",
      "vndToUsd": "0.000041"
    }
  }
}
```

### 2. Cập nhật tỉ giá từ API thực tế
```http
POST /api/oracle/rate/update
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "usdToVnd": 24350,
    "vndToUsd": 0.000041,
    "timestamp": 1695123456789,
    "source": "api-updated",
    "message": "Rate updated successfully on smart contract"
  }
}
```

### 3. Truyền tỉ giá VND/USD vào smart contract (Custom Oracle)
```http
POST /api/oracle/rate/set
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "usdToVnd": 24500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "usdToVnd": 24500,
    "vndToUsd": 0.0000408,
    "timestamp": 1695123456789,
    "transactionDigest": "0x...",
    "message": "Exchange rate sent to smart contract successfully"
  }
}
```

### 4. Chuyển đổi tiền tệ
```http
POST /api/oracle/convert
Content-Type: application/json

{
  "amount": 100,
  "from": "USD",
  "to": "VND"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalAmount": 100,
    "fromCurrency": "USD",
    "toCurrency": "VND",
    "convertedAmount": 2430000
  }
}
```

### 5. Lấy danh sách currencies
```http
GET /api/oracle/currencies
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "USD",
      "name": "US Dollar"
    },
    {
      "code": "VND", 
      "name": "Vietnamese Dong"
    }
  ]
}
```

## Environment Variables

Cần set các biến môi trường sau trong `.env`:

```env
SUI_PACKAGE_ID=0x... # Package ID của smart contract
SUI_ORACLE_OBJECT_ID=0x... # Object ID của Price object
SUI_ADMIN_PRIVATE_KEY=0x... # Private key để sign transactions
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

## Smart Contract Integration

API này tương tác với smart contract Move của bạn:

### Module: `swap::custom_oracle`
```move
public struct Price has key {
    id: UID,
    value: u64, // giá USD/VND
    timestamp: u64,
}

public fun get_price(price: &Price): u64 {
    price.value
}

entry fun update_price(price: &mut Price, new_value: u64, new_timestamp: u64, ctx: &mut TxContext) {
    price.value = new_value;
    price.timestamp = new_timestamp;
}
```

## Usage Examples

### 1. Lấy tỉ giá hiện tại
```bash
curl -X GET http://localhost:8080/api/oracle/rate
```

### 2. Cập nhật tỉ giá từ API thực tế (cần JWT token)
```bash
curl -X POST http://localhost:8080/api/oracle/rate/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Truyền tỉ giá VND/USD vào smart contract (cần JWT token)
```bash
curl -X POST http://localhost:8080/api/oracle/rate/set \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"usdToVnd": 24500}'
```

### 4. Chuyển đổi 100 USD sang VND
```bash
curl -X POST http://localhost:8080/api/oracle/convert \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "from": "USD", "to": "VND"}'
```

## Error Handling

- `404`: Tỉ giá không có sẵn từ smart contract
- `400`: Thiếu tham số bắt buộc
- `401`: Token không hợp lệ (cho protected endpoints)
- `500`: Lỗi server hoặc smart contract

## Các nguồn API được sử dụng

### 1. Exchangerate-api.com (Free)
- **URL**: `https://api.exchangerate-api.com/v4/latest/USD`
- **Miễn phí**: ✅
- **Rate limit**: 1,500 requests/month
- **Độ tin cậy**: Cao

### 2. Fixer.io (Professional)
- **URL**: `http://data.fixer.io/api/latest`
- **Miễn phí**: ❌ (Có free tier)
- **Rate limit**: 1,000 requests/month (free)
- **Độ tin cậy**: Rất cao
- **Cấu hình**: Cần `FIXER_API_KEY`

### 3. Currency API (Free tier)
- **URL**: `https://api.currencyapi.com/v3/latest`
- **Miễn phí**: ✅ (Free tier)
- **Rate limit**: 300 requests/month (free)
- **Cấu hình**: Cần `CURRENCY_API_KEY` (optional)

### 4. CoinGecko (Free)
- **URL**: `https://api.coingecko.com/api/v3/exchange_rates`
- **Miễn phí**: ✅
- **Rate limit**: 10-50 calls/minute
- **Độ tin cậy**: Cao

### 5. Alpha Vantage (Free tier)
- **URL**: `https://www.alphavantage.co/query`
- **Miễn phí**: ✅ (Free tier)
- **Rate limit**: 5 calls/minute, 500 calls/day
- **Cấu hình**: Cần `ALPHA_VANTAGE_API_KEY` (optional)

### 6. Vietcombank (Mock)
- **Miễn phí**: ✅
- **Độ tin cậy**: Trung bình (mock implementation)

## Thuật toán tính toán

1. **Lấy dữ liệu từ tất cả nguồn** (song song)
2. **Loại bỏ outliers** sử dụng IQR (Interquartile Range)
3. **Tính median rate** từ các giá trị hợp lệ
4. **Fallback** về 24,300 VND/USD nếu tất cả nguồn thất bại

## Notes

- API sử dụng **6 nguồn khác nhau** để lấy tỉ giá thực tế
- Tất cả transactions được sign bằng admin private key
- Tỉ giá được lưu dưới dạng u64 trong smart contract
- Timestamp được convert từ milliseconds sang seconds
- Hệ thống tự động loại bỏ giá trị bất thường để đảm bảo độ chính xác cao
