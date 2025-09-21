# VND/USD Swap System

Hệ thống swap VND/USD với tỉ giá thực tế trên Sui blockchain.

## 🏗️ Kiến trúc

- **Smart Contract**: Sui Move modules cho USD, VND, Oracle, và Swap
- **Oracle**: Tỉ giá thực tế từ CoinGecko API
- **Pool**: Liquidity pool để swap tokens
- **Backend**: Cập nhật tỉ giá mỗi phút

## 📁 Cấu trúc thư mục

```
swap/
├── sources/
│   ├── sUSD.move          # USD token module
│   ├── vietnamdong.move   # VND token module
│   ├── price_oracle.move  # Oracle module
│   └── swap.move          # Swap pool module
├── mint-tokens.js         # Mint USD và VND tokens
├── add-liquidity.js       # Thêm liquidity vào pool
├── swap-tokens.js         # Test swap functions
├── run-swap-flow.js       # Chạy toàn bộ flow
└── README.md              # Documentation này
```

## 🚀 Cách sử dụng

### 1. Deploy Smart Contract

```bash
cd /Users/huc/Documents/CodewithHUC/swap
sui client publish
```

### 2. Chạy toàn bộ flow

```bash
node run-swap-flow.js
```

### 3. Chạy từng bước riêng lẻ

```bash
# Mint tokens
node mint-tokens.js

# Thêm liquidity
node add-liquidity.js

# Test swap
node swap-tokens.js
```

## 📊 Kết quả

### ✅ Đã hoàn thành:
1. **Mint Tokens**: Tạo USD và VND tokens thành công
2. **Add Liquidity**: Thêm liquidity vào pool thành công
3. **Swap VND to USD**: 1,000,000 VND → 37.89 USD ✅
4. **Swap USD to VND**: 37.89 USD → 999,999.99 VND ✅
5. **Oracle Integration**: Sử dụng tỉ giá thực tế 26,393 VND/USD ✅

### 📈 Pool Status:
- **VND Balance**: 2,000,000.00 VND
- **USD Balance**: 2,000,000.00 USD
- **Exchange Rate**: 26,393 VND/USD (từ CoinGecko)

## 🔧 Configuration

### Smart Contract IDs:
- **Package ID**: `0x9cef0ecb45dec10eeab38bd1ba8e81c6515b49a437ee1324d07fad8b7816a46a`
- **Pool Object ID**: `0xfb9b73c95fcc948cbb4860cbe1816c726ae79e797cf9c71865638c6832727ade`
- **Oracle Object ID**: `0x05509fb8ef559a5499ad13189e604434b30f86e256bd692b80d1d5ccb2ddfe00`
- **USD Treasury Cap**: `0x3736073d1271ee3d8730f22613ed8787a5d43ca0d60791f13ca6d40693673e3e`
- **VND Treasury Cap**: `0xc8542d8af1f915d92b2379ba031a370a75e2000ef05cbaa9c6d214712a1cea1e`

## 🌐 Backend Integration

Backend sẽ cập nhật tỉ giá mỗi phút từ CoinGecko API và gửi lên smart contract.

### API Endpoints:
- `GET /api/oracle/rate` - Lấy tỉ giá hiện tại
- `POST /api/oracle/rate/update` - Cập nhật tỉ giá
- `POST /api/oracle/convert` - Chuyển đổi tiền tệ

## 🎯 Tính năng chính

1. **Real-time Exchange Rate**: Tỉ giá thực tế từ CoinGecko
2. **Automated Updates**: Backend cập nhật tỉ giá mỗi phút
3. **Liquidity Pool**: Pool để swap tokens
4. **Swap Functions**: Swap VND ↔ USD với tỉ giá chính xác
5. **Error Handling**: Xử lý lỗi và validation

## 🔒 Bảo mật

- **Treasury Cap**: Chỉ admin có thể mint tokens
- **Pool Access**: Chỉ authorized users có thể swap
- **Oracle Validation**: Kiểm tra tỉ giá hợp lệ
- **Balance Checks**: Kiểm tra đủ liquidity trước khi swap

## 📝 Lưu ý

- Tất cả amounts đều sử dụng 6 decimals
- Pool cần có đủ liquidity để swap
- Oracle price được cập nhật tự động
- Gas fees được tính bằng SUI tokens

## 🚀 Next Steps

1. Tích hợp vào frontend merchant UI
2. Thêm more validation và error handling
3. Optimize gas usage
4. Add more exchange rate sources
5. Implement advanced swap features
