# NFC Payment Frontend

Ứng dụng thanh toán NFC được xây dựng bằng Next.js 15 và React, tích hợp với backend Node.js và blockchain Sui.

## 🏗️ Cấu trúc dự án

```
src/
├── app/                    # App Router pages
│   ├── auth/              # Trang đăng nhập/đăng ký
│   ├── dashboard/         # Trang dashboard chính
│   ├── history/           # Lịch sử giao dịch
│   ├── payment/           # Trang thanh toán
│   ├── settings/          # Cài đặt người dùng
│   ├── layout.tsx         # Layout chính
│   └── page.tsx           # Trang chủ
├── components/            # Các component tái sử dụng
│   ├── ui/               # UI components cơ bản
│   ├── Navigation.tsx     # Navigation bar
│   └── TransactionHistory.tsx
├── contexts/              # React Context providers
│   ├── AuthContext.tsx    # Quản lý authentication
│   └── WalletContext.tsx  # Quản lý ví
├── hooks/                 # Custom hooks
├── lib/                   # Utilities và API client
│   └── api-client.ts      # HTTP client
├── types/                 # TypeScript types
└── styles/                # CSS/Tailwind styles
```

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn
- Backend server đã chạy (port 8080)

### Cài đặt
```bash
# Clone repository
git clone <repository-url>
cd nfc-payment-app

# Cài đặt dependencies
npm install

# Tạo file môi trường
cp .env.example .env.local
```

### Cấu hình môi trường
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_NAME=NFC Payment
```

### Chạy ứng dụng
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint

# Type checking
npm run type-check
```

## 🔐 Authentication Flow

### 1. Đăng ký (Register)
```typescript
// AuthContext.tsx
const register = async (data: {
  email: string;
  password: string;
  phoneNumber: string;
  fullName: string;
}) => {
  const response = await registerAPI(data);
  // Chuyển sang bước xác thực OTP
};
```

### 2. Xác thực OTP
```typescript
const handleVerifyOtp = async (phoneNumber: string, otp: string) => {
  const response = await verifyOtpAPI(phoneNumber, otp);
  if (response.success) {
    // Chuyển về trang đăng nhập
  }
};
```

### 3. Đăng nhập (Login)
```typescript
const login = async (email: string, password: string) => {
  const response = await loginAPI(email, password);
  
  if (response.success) {
    // Lưu tokens
    localStorage.setItem('authToken', response.tokens.accessToken);
    localStorage.setItem('refreshToken', response.tokens.refreshToken);
    
    // Set user data
    setUser(response.user);
  }
};
```

## 💳 Wallet Management

### Tạo ví mới
```typescript
// WalletContext.tsx
const createWallet = async () => {
  const response = await createWalletAPI();
  if (response.success) {
    setWallet({
      address: response.wallet.address,
      balance: 0,
      tokens: []
    });
  }
};
```

### Lấy số dư ví
```typescript
const refreshBalance = async () => {
  const response = await getWalletBalanceAPI();
  if (response.success) {
    setWallet(prev => ({
      address: prev?.address || '',
      balance: parseFloat(response.balance.sui) / 1000000000, // MIST to SUI
      tokens: response.balance.coins?.map(coin => ({
        symbol: coin.type.includes('SUI') ? 'SUI' : 'UNKNOWN',
        name: coin.type.includes('SUI') ? 'Sui Token' : 'Unknown Token',
        balance: parseFloat(coin.balance) / 1000000000
      })) || []
    }));
  }
};
```

## 📊 Dashboard Components

### Stats Cards
Dashboard hiển thị 4 thống kê chính:
1. **Số dư hiện tại** - Wallet balance
2. **Tổng chi tiêu tháng** - Monthly spending
3. **Thẻ NFC** - Active cards count
4. **Giao dịch hôm nay** - Today's transactions

### Biểu đồ chi tiêu
```typescript
// Tạo dữ liệu biểu đồ 7 ngày
const chartData = React.useMemo(() => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      name: days[date.getDay()],
      amount: 0,
      date: date.toDateString()
    };
  });

  // Tính toán chi tiêu từ transactions
  transactions.forEach((tx: any) => {
    const txDate = new Date(tx.createdAt).toDateString();
    const dayData = last7Days.find(day => day.date === txDate);
    if (dayData) {
      dayData.amount += tx.amount || 0;
    }
  });

  return last7Days.map(({ name, amount }) => ({ name, amount }));
}, [transactions]);
```

## 🔌 API Integration

### HTTP Client Setup
```typescript
// lib/api-client.ts
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### API Endpoints
- **Auth**: `/auth/login`, `/auth/register`, `/auth/verify-email`
- **User**: `/user/profile`, `/user/pin/set`
- **Wallet**: `/wallet/balance`, `/wallet/create`, `/wallet/faucet`
- **Payment**: `/payment/process`, `/payment/history`
- **Card**: `/card/create`, `/card/activate`

## 🎨 UI Components

### Navigation Bar
- Responsive navigation với mobile support
- Hiển thị wallet balance
- User menu với logout
- Active state cho current page

### Toast Notifications
```typescript
// components/ui/toaster.tsx
import { toast } from '@/components/ui/toaster';

// Sử dụng
toast({
  type: 'success',
  title: 'Thành công',
  description: 'Giao dịch đã được xử lý'
});
```

### Loading States
```typescript
// Spinner component
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
```

### Error Handling
```typescript
// Error display component
{error && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    <div className="flex justify-between items-center">
      <span>{error}</span>
      <button onClick={() => setError('')}>✕</button>
    </div>
  </div>
)}
```

## 🎯 Features

### ✅ Đã hoàn thành
- ✅ Authentication (Login/Register/OTP)
- ✅ Wallet creation và balance checking
- ✅ Dashboard với real-time data
- ✅ Transaction history
- ✅ Responsive navigation
- ✅ Error handling
- ✅ Loading states
- ✅ Toast notifications

### 🚧 Đang phát triển
- 🚧 NFC card management
- 🚧 Payment processing
- 🚧 Settings page
- 🚧 Push notifications
- 🚧 Offline support

### 🔮 Tính năng tương lai
- 📱 Mobile app (React Native)
- 🔔 Real-time notifications
- 📈 Advanced analytics
- 🌐 Multi-language support
- 🔐 Biometric authentication

## 🛠️ Development

### Code Style
- ESLint + Prettier
- TypeScript strict mode
- Tailwind CSS cho styling
- Functional components với hooks

### State Management
- React Context cho global state
- Local state với useState
- Server state với React Query (tùy chọn)

### Type Safety
```typescript
// types/index.ts
export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  isVerified: boolean;
  wallet?: Wallet;
}

export interface Wallet {
  address: string;
  balance: number;
  tokens: Token[];
}
```

### Error Boundaries
```typescript
// Wrap components with error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
```env
# Production
NEXT_PUBLIC_API_URL=https://api.nfcpayment.com/api
NEXT_PUBLIC_APP_NAME=NFC Payment
NEXTAUTH_SECRET=your-secret-key
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Sui Blockchain](https://docs.sui.io/)

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## 📄 License

MIT License - xem [LICENSE](LICENSE) file để biết thêm chi tiết.