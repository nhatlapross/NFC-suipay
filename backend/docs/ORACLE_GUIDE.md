# Oracle Integration Guide

Hướng dẫn tích hợp Oracle cho tỉ giá VND/USD thực tế.

## 🏗️ Kiến trúc Oracle

### Smart Contract
- **Package ID**: `0x9cef0ecb45dec10eeab38bd1ba8e81c6515b49a437ee1324d07fad8b7816a46a`
- **Oracle Object ID**: `0x05509fb8ef559a5499ad13189e604434b30f86e256bd692b80d1d5ccb2ddfe00`
- **Pool Object ID**: `0xfb9b73c95fcc948cbb4860cbe1816c726ae79e797cf9c71865638c6832727ade`

### Data Sources
1. **CoinGecko** (Primary) - `https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=vnd`
2. **Exchangerate API** - `https://api.exchangerate-api.com/v4/latest/USD`
3. **Currency API** - `https://api.currencyapi.com/v3/latest?apikey=...&currencies=VND&base_currency=USD`
4. **Alpha Vantage** - `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=USD&to_symbol=VND&apikey=...`
5. **Vietcombank** (Mock) - Simulated rate for testing

## 🔄 Update Process

### Automatic Updates
- **Frequency**: Mỗi phút
- **Worker**: `price-updater.worker.ts`
- **Cron**: `* * * * *` (every minute)

### Manual Updates
```bash
# Update rate manually
curl -X POST http://localhost:8080/api/oracle/rate/update \
  -H "Authorization: Bearer <jwt_token>"

# Set custom rate
curl -X POST http://localhost:8080/api/oracle/rate/set \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"usdToVnd": 26393}'
```

## 📊 Rate Calculation

### Multi-source Aggregation
1. **Fetch** rates from all sources
2. **Filter** outliers using IQR (Interquartile Range)
3. **Calculate** median rate
4. **Update** smart contract

### Outlier Removal
```typescript
// Calculate IQR
const q1 = sortedRates[Math.floor(sortedRates.length * 0.25)];
const q3 = sortedRates[Math.floor(sortedRates.length * 0.75)];
const iqr = q3 - q1;

// Filter outliers
const lowerBound = q1 - 1.5 * iqr;
const upperBound = q3 + 1.5 * iqr;
const filteredRates = sortedRates.filter(rate => 
  rate >= lowerBound && rate <= upperBound
);

// Use median
const medianRate = filteredRates[Math.floor(filteredRates.length / 2)];
```

## 🚀 API Endpoints

### Get Current Rate
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

### Update Rate
```bash
POST /api/oracle/rate/update
Authorization: Bearer <jwt_token>
```

### Convert Currency
```bash
POST /api/oracle/convert
Content-Type: application/json

{
  "amount": 100,
  "from": "USD",
  "to": "VND"
}
```

### Get Supported Currencies
```bash
GET /api/oracle/currencies
```

## 🔧 Configuration

### Environment Variables
```env
# Sui Configuration
SUI_PACKAGE_ID=0x9cef0ecb45dec10eeab38bd1ba8e81c6515b49a437ee1324d07fad8b7816a46a
SUI_ORACLE_OBJECT_ID=0x05509fb8ef559a5499ad13189e604434b30f86e256bd692b80d1d5ccb2ddfe00
SUI_ADMIN_PRIVATE_KEY=your_admin_private_key
SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# API Keys
EXCHANGERATE_API_KEY=your_exchangerate_api_key
FIXER_API_KEY=your_fixer_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
```

### Smart Contract Functions
```move
// Update price
entry fun update_price(price: &mut Price, new_value: u64, new_timestamp: u64, ctx: &mut TxContext)

// Get price
public fun get_price(price: &Price): u64

// Create price (initialization)
entry fun create_price(initial_value: u64, initial_timestamp: u64, ctx: &mut TxContext)
```

## 📈 Monitoring

### Logs
```bash
# View oracle logs
tail -f logs/combined.log | grep "oracle"

# View rate updates
tail -f logs/combined.log | grep "Exchange rate updated"
```

### Health Check
```bash
# Check oracle health
curl -X GET http://localhost:8080/api/oracle/rate
```

## 🚨 Error Handling

### Common Errors
- **Rate fetch failure**: Fallback to last known rate
- **Smart contract error**: Retry with exponential backoff
- **Network timeout**: Use cached rate
- **Invalid rate**: Skip update, log error

### Fallback Strategy
1. Try primary source (CoinGecko)
2. Try secondary sources
3. Use cached rate if all fail
4. Log error for monitoring

## 🎯 Best Practices

### Rate Updates
- Always validate rate before updating
- Use median of multiple sources
- Implement proper error handling
- Monitor update success rate

### Smart Contract
- Check gas budget before transactions
- Handle transaction failures gracefully
- Implement retry logic
- Monitor contract state

### API Usage
- Implement rate limiting
- Cache responses when appropriate
- Monitor API usage
- Handle rate limit errors

## 🔍 Troubleshooting

### Rate Not Updating
1. Check worker status
2. Verify API keys
3. Check network connectivity
4. Review error logs

### Smart Contract Errors
1. Verify object IDs
2. Check admin private key
3. Ensure sufficient gas
4. Validate rate values

### API Errors
1. Check authentication
2. Verify request format
3. Review rate limits
4. Check server logs
