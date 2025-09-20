# Swap VND/USD Frontend Components

Frontend components cho tính năng swap VND/USD với tỉ giá thực tế.

## 🏗️ Kiến trúc

- **Framework**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: React Hooks + Custom Hooks
- **API Integration**: Axios + Custom API Client

## 📁 Cấu trúc thư mục

```
src/components/swap/
├── SwapInterface.tsx    # Component chính cho swap
├── RateDisplay.tsx      # Hiển thị tỉ giá
├── SwapHistory.tsx      # Lịch sử swap
└── README.md           # Documentation này

src/app/swap/
└── page.tsx            # Trang swap chính

src/lib/
└── swap-api.ts         # API client cho swap

src/hooks/
└── useSwap.ts          # Custom hook cho swap
```

## 🚀 Components

### 1. SwapInterface

Component chính để thực hiện swap VND/USD.

**Features:**
- Chọn currency (USD/VND)
- Nhập amount
- Tính toán tự động
- Swap currencies
- Real-time rate updates

**Props:**
```typescript
interface SwapInterfaceProps {
  onSwap?: (fromAmount: number, fromCurrency: string, toCurrency: string) => void;
}
```

**Usage:**
```tsx
import SwapInterface from '@/components/swap/SwapInterface';

<SwapInterface 
  onSwap={(fromAmount, fromCurrency, toCurrency) => {
    console.log('Swap:', { fromAmount, fromCurrency, toCurrency });
  }}
/>
```

### 2. RateDisplay

Component hiển thị tỉ giá hiện tại.

**Features:**
- Real-time rate display
- Auto-refresh every 30 seconds
- Source information
- Last updated timestamp
- Trend indicators

**Props:**
```typescript
interface RateDisplayProps {
  className?: string;
}
```

**Usage:**
```tsx
import RateDisplay from '@/components/swap/RateDisplay';

<RateDisplay className="w-full" />
```

### 3. SwapHistory

Component hiển thị lịch sử swap.

**Features:**
- List swap transactions
- Status indicators
- Transaction details
- Pagination support
- Auto-refresh

**Props:**
```typescript
interface SwapHistoryProps {
  className?: string;
}
```

**Usage:**
```tsx
import SwapHistory from '@/components/swap/SwapHistory';

<SwapHistory className="w-full" />
```

## 🔧 API Integration

### SwapAPI Client

```typescript
import { swapAPI } from '@/lib/swap-api';

// Get exchange rate
const rate = await swapAPI.getExchangeRate();

// Convert currency
const converted = await swapAPI.convertCurrency(100, 'USD', 'VND');

// Execute swap
const result = await swapAPI.executeSwap({
  fromAmount: 100,
  fromCurrency: 'USD',
  toCurrency: 'VND',
  walletAddress: '0x...'
});

// Get swap history
const history = await swapAPI.getSwapHistory(1, 10);

// Get wallet balance
const balance = await swapAPI.getWalletBalance();
```

### useSwap Hook

```typescript
import { useSwap } from '@/hooks/useSwap';

function SwapComponent() {
  const {
    exchangeRate,
    loadingRate,
    rateError,
    refreshRate,
    balance,
    loadingBalance,
    balanceError,
    refreshBalance,
    executeSwap,
    swapLoading,
    swapError,
    history,
    loadingHistory,
    historyError,
    refreshHistory,
    convertCurrency,
    conversionLoading,
    conversionError
  } = useSwap();

  // Use the hook data and functions
}
```

## 🎨 Styling

### Tailwind Classes

```css
/* Main container */
.swap-container {
  @apply min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4;
}

/* Card styling */
.swap-card {
  @apply w-full max-w-md mx-auto;
}

/* Rate display */
.rate-display {
  @apply text-3xl font-bold text-green-600;
}

/* Status badges */
.status-completed {
  @apply bg-green-500 text-white;
}

.status-pending {
  @apply bg-yellow-500 text-white;
}

.status-failed {
  @apply bg-red-500 text-white;
}
```

### Shadcn UI Components

- `Card` - Container components
- `Button` - Action buttons
- `Input` - Form inputs
- `Label` - Form labels
- `Select` - Currency selection
- `Badge` - Status indicators
- `Tabs` - Tab navigation

## 🔄 State Management

### Local State

```typescript
const [fromAmount, setFromAmount] = useState<string>('');
const [toAmount, setToAmount] = useState<string>('');
const [fromCurrency, setFromCurrency] = useState<string>('USD');
const [toCurrency, setToCurrency] = useState<string>('VND');
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string>('');
```

### Global State (useSwap Hook)

```typescript
const {
  exchangeRate,      // Current exchange rate
  balance,           // Wallet balance
  history,           // Swap history
  loadingRate,       // Rate loading state
  loadingBalance,    // Balance loading state
  loadingHistory,    // History loading state
  swapLoading,       // Swap loading state
  // ... error states
} = useSwap();
```

## 🚀 Usage Examples

### Basic Swap Page

```tsx
import SwapInterface from '@/components/swap/SwapInterface';
import RateDisplay from '@/components/swap/RateDisplay';
import SwapHistory from '@/components/swap/SwapHistory';

export default function SwapPage() {
  const handleSwap = (fromAmount, fromCurrency, toCurrency) => {
    console.log('Swap initiated:', { fromAmount, fromCurrency, toCurrency });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SwapInterface onSwap={handleSwap} />
          </div>
          <div className="space-y-6">
            <RateDisplay />
            <SwapHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Custom Swap Component

```tsx
import { useSwap } from '@/hooks/useSwap';

function CustomSwapComponent() {
  const {
    exchangeRate,
    balance,
    executeSwap,
    swapLoading,
    swapError
  } = useSwap();

  const handleSwap = async () => {
    const result = await executeSwap({
      fromAmount: 100,
      fromCurrency: 'USD',
      toCurrency: 'VND',
      walletAddress: '0x...'
    });

    if (result.success) {
      console.log('Swap successful:', result.data);
    } else {
      console.error('Swap failed:', result.error);
    }
  };

  return (
    <div>
      <p>Rate: 1 USD = {exchangeRate?.usdToVnd} VND</p>
      <p>Balance: {balance?.usd} USD, {balance?.vnd} VND</p>
      <button onClick={handleSwap} disabled={swapLoading}>
        {swapLoading ? 'Swapping...' : 'Swap'}
      </button>
      {swapError && <p className="text-red-500">{swapError}</p>}
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080/api
```

### API Endpoints

- `GET /api/oracle/rate` - Get exchange rate
- `POST /api/oracle/convert` - Convert currency
- `POST /api/swap/execute` - Execute swap
- `GET /api/swap/history` - Get swap history
- `GET /api/wallet/balance` - Get wallet balance

## 🎯 Features

### ✅ Implemented
- Real-time exchange rate display
- Currency conversion calculator
- Swap interface with validation
- Swap history with status
- Wallet balance display
- Auto-refresh functionality
- Error handling
- Loading states
- Responsive design

### 🚀 Next Steps
- Transaction signing integration
- Sui wallet connection
- Real-time notifications
- Advanced swap options
- Mobile optimization
- Offline support

## 🔒 Security

- Input validation
- Error handling
- Rate limiting
- Secure API calls
- XSS protection
- CSRF protection

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Touch-friendly interfaces
- Optimized for all screen sizes
