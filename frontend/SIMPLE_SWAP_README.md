# Simple VND/USD Swap với Sui DApp Kit

## Tổng quan

Frontend đơn giản sử dụng Sui DApp Kit để thực hiện swap VND/USD với smart contract.

## Tính năng

- ✅ Connect wallet với Sui DApp Kit
- ✅ Swap VND ↔ USD trực tiếp với smart contract
- ✅ Tỉ giá thời gian thực từ oracle
- ✅ Giao diện đơn giản và dễ sử dụng
- ✅ Không cần nhập private key

## Cài đặt

```bash
cd frontend
npm install @mysten/dapp-kit
```

## Cách sử dụng

### 1. Khởi động frontend

```bash
npm run dev
```

### 2. Truy cập trang swap

Mở trình duyệt và đi đến `http://localhost:3000/swap`

### 3. Connect wallet

1. Nhấn **Connect Wallet** button
2. Chọn Sui Wallet extension
3. Approve connection

### 4. Thực hiện swap

1. Chọn loại tiền tệ từ (USD hoặc VND)
2. Nhập số lượng muốn swap
3. Xem số lượng nhận được (tự động tính toán)
4. Nhấn **Swap** để thực hiện giao dịch
5. Sign transaction trong wallet

## Cấu trúc code

### Components

- **`SimpleSwapInterface.tsx`**: Giao diện swap đơn giản sử dụng DApp Kit
- **`swap/page.tsx`**: Trang swap với ConnectButton

### DApp Kit Integration

```tsx
import { ConnectButton, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';

// Connect wallet
<ConnectButton />

// Use client
const client = useSuiClient();

// Sign and execute transaction
const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
```

### Smart Contract Interaction

```tsx
// Create transaction
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::swap::swap_VND_to_USD`,
  arguments: [
    tx.object(POOL_OBJECT_ID),
    tx.object(coinId),
    tx.object(ORACLE_OBJECT_ID)
  ]
});

// Execute transaction
signAndExecuteTransaction({
  transaction: tx,
  options: {
    showEffects: true,
    showObjectChanges: true,
  },
});
```

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_PACKAGE_ID=0x9cef0ecb45dec10eeab38bd1ba8e81c6515b49a437ee1324d07fad8b7816a46a
NEXT_PUBLIC_POOL_OBJECT_ID=0xfb9b73c95fcc948cbb4860cbe1816c726ae79e797cf9c71865638c6832727ade
NEXT_PUBLIC_ORACLE_OBJECT_ID=0x05509fb8ef559a5499ad13189e604434b30f86e256bd692b80d1d5ccb2ddfe00
```

### Layout Provider

```tsx
<SuiClientProvider networks={{
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
}} defaultNetwork="testnet">
  <DAppKitWalletProvider>
    {children}
  </DAppKitWalletProvider>
</SuiClientProvider>
```

## Lợi ích của DApp Kit

1. **Đơn giản**: Chỉ cần ConnectButton và hooks
2. **An toàn**: Không cần nhập private key
3. **Tích hợp sẵn**: Hỗ trợ nhiều wallet
4. **TypeScript**: Type safety đầy đủ
5. **React**: Hooks và components sẵn có

## So sánh với implementation cũ

| Tính năng | Cũ (Private Key) | Mới (DApp Kit) |
|-----------|------------------|----------------|
| Wallet Connection | Manual input | ConnectButton |
| Security | Private key exposure | Wallet extension |
| User Experience | Phức tạp | Đơn giản |
| Maintenance | Nhiều code | Ít code |
| Wallet Support | Chỉ 1 wallet | Nhiều wallet |

## Next Steps

1. Thêm mint tokens functionality
2. Thêm balance display
3. Thêm transaction history
4. Cải thiện UI/UX
5. Thêm error handling tốt hơn
