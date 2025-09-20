# VND/USD Swap Frontend

## Tổng quan

Frontend này tích hợp với Sui smart contract để thực hiện swap giữa VND và USD với tỉ giá thời gian thực từ oracle.

## Tính năng

- ✅ Swap VND ↔ USD trực tiếp với smart contract
- ✅ Tỉ giá thời gian thực từ oracle
- ✅ Hiển thị balance của wallet
- ✅ Hiển thị trạng thái pool
- ✅ Giao diện thân thiện với người dùng
- ✅ Tích hợp Sui SDK

## Cấu hình

### Environment Variables

Tạo file `.env.local` trong thư mục `frontend/`:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# Sui Configuration
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_PACKAGE_ID=0x9cef0ecb45dec10eeab38bd1ba8e81c6515b49a437ee1324d07fad8b7816a46a
NEXT_PUBLIC_POOL_OBJECT_ID=0xfb9b73c95fcc948cbb4860cbe1816c726ae79e797cf9c71865638c6832727ade
NEXT_PUBLIC_ORACLE_OBJECT_ID=0x05509fb8ef559a5499ad13189e604434b30f86e256bd692b80d1d5ccb2ddfe00
```

### Smart Contract Objects

- **Package ID**: `0x9cef0ecb45dec10eeab38bd1ba8e81c6515b49a437ee1324d07fad8b7816a46a`
- **Pool Object**: `0xfb9b73c95fcc948cbb4860cbe1816c726ae79e797cf9c71865638c6832727ade`
- **Oracle Object**: `0x05509fb8ef559a5499ad13189e604434b30f86e256bd692b80d1d5ccb2ddfe00`

## Cách sử dụng

### 1. Khởi động frontend

```bash
cd frontend
npm install
npm run dev
```

### 2. Truy cập trang swap

Mở trình duyệt và đi đến `http://localhost:3000/swap`

### 3. Kết nối wallet

1. Nhập **Wallet Address** (địa chỉ Sui của bạn)
2. Nhập **Private Key** (khóa riêng tư của bạn)
3. Nhấn **Connect Wallet**

### 4. Thực hiện swap

1. Chọn loại tiền tệ từ (USD hoặc VND)
2. Nhập số lượng muốn swap
3. Xem số lượng nhận được (tự động tính toán)
4. Nhấn **Swap** để thực hiện giao dịch

## Cấu trúc code

### Services

- **`src/lib/sui-swap.service.ts`**: Service chính để tương tác với Sui smart contract
- **`src/config/sui.ts`**: Cấu hình Sui

### Hooks

- **`src/hooks/useSuiSwap.ts`**: Hook React để quản lý state và logic swap

### Components

- **`src/components/swap/SwapInterface.tsx`**: Giao diện swap chính
- **`src/components/swap/RateDisplay.tsx`**: Hiển thị tỉ giá
- **`src/components/swap/SwapHistory.tsx`**: Lịch sử swap

### Pages

- **`src/app/swap/page.tsx`**: Trang swap chính

## API Methods

### SuiSwapService

```typescript
// Lấy coins của user
getUserCoins(walletAddress: string): Promise<{ usd: CoinInfo[], vnd: CoinInfo[] }>

// Lấy tỉ giá hiện tại
getCurrentRate(): Promise<number>

// Thực hiện swap VND → USD
swapVndToUsd(amount: number, walletAddress: string, privateKey: string): Promise<SwapResponse>

// Thực hiện swap USD → VND
swapUsdToVnd(amount: number, walletAddress: string, privateKey: string): Promise<SwapResponse>

// Thực hiện swap (tự động chọn hướng)
executeSwap(request: SwapRequest): Promise<SwapResponse>

// Lấy trạng thái pool
getPoolStatus(): Promise<{ vndBalance: number; usdBalance: number }>
```

## Smart Contract Functions

### Swap Functions

```move
// Swap VND sang USD
public entry fun swap_VND_to_USD(
    pool: &mut Pool, 
    my_coin: Coin<VND>, 
    price: &Price, 
    ctx: &mut TxContext
)

// Swap USD sang VND
public entry fun swap_USD_to_VND(
    pool: &mut Pool, 
    my_coin: Coin<USD>, 
    price: &Price, 
    ctx: &mut TxContext
)
```

### Oracle Functions

```move
// Lấy tỉ giá hiện tại
public fun get_price(price: &Price): u64

// Cập nhật tỉ giá
entry fun update_price(
    price: &mut Price, 
    new_value: u64, 
    new_timestamp: u64, 
    ctx: &mut TxContext
)
```

## Testing

### Chạy test script

```bash
cd frontend
node test-swap.js
```

### Test thủ công

1. Mint tokens trước (sử dụng scripts trong `/swap` directory)
2. Kết nối wallet với địa chỉ có tokens
3. Thực hiện swap test

## Troubleshooting

### Lỗi thường gặp

1. **"No USD/VND coins found"**
   - Cần mint tokens trước
   - Sử dụng scripts trong `/swap` directory

2. **"Insufficient balance"**
   - Kiểm tra balance trong wallet
   - Đảm bảo có đủ tokens để swap

3. **"Failed to fetch exchange rate"**
   - Kiểm tra kết nối mạng
   - Kiểm tra Oracle Object ID

4. **"Transaction failed"**
   - Kiểm tra gas budget
   - Kiểm tra private key
   - Kiểm tra pool balance

### Debug

1. Mở Developer Tools (F12)
2. Xem Console logs
3. Kiểm tra Network tab
4. Kiểm tra Sui Explorer cho transaction details

## Security Notes

- ⚠️ **KHÔNG** chia sẻ private key
- ⚠️ **KHÔNG** commit private key vào git
- ⚠️ Chỉ sử dụng testnet cho testing
- ⚠️ Kiểm tra kỹ trước khi swap số lượng lớn

## Next Steps

1. Thêm mint tokens functionality
2. Thêm swap history tracking
3. Thêm advanced features (slippage, deadline)
4. Thêm mobile responsive
5. Thêm dark mode
