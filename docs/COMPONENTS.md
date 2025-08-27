# Frontend Components Documentation

## 📁 Component Structure

### Core Components

#### 1. Navigation (`src/components/Navigation.tsx`)
```typescript
interface NavigationProps {
  // Component tự động lấy user state từ AuthContext
}
```

**Features:**
- Responsive navigation bar
- User authentication state
- Wallet balance display
- Active page highlighting
- Logout functionality

**Usage:**
```tsx
// Tự động render trong layout.tsx
<Navigation />
```

#### 2. TransactionHistory (`src/components/TransactionHistory.tsx`)
```typescript
interface TransactionHistoryProps {
  transactions: Transaction[];
}
```

**Features:**
- Display transaction list
- Status icons (completed/failed/pending)
- Type icons (payment/topup)
- Date formatting with Vietnamese locale
- Gas fee display

**Usage:**
```tsx
<TransactionHistory transactions={recentTransactions} />
```

### UI Components

#### 1. Toaster (`src/components/ui/toaster.tsx`)
```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}
```

**Features:**
- Auto-dismiss after 5 seconds
- Multiple toast types with icons
- Manual dismiss option
- Fixed positioning

**Usage:**
```tsx
import { toast } from '@/components/ui/toaster';

toast({
  type: 'success',
  title: 'Thành công',
  description: 'Giao dịch được xử lý thành công'
});
```

#### 2. QueryClientProvider (`src/components/QueryClientProvider.tsx`)
Wrapper cho React Query (TanStack Query) để quản lý server state.

```tsx
<QueryClientProvider>
  <App />
</QueryClientProvider>
```

## 📄 Page Components

### 1. Dashboard Page (`src/app/dashboard/page.tsx`)

**State Management:**
```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [cards, setCards] = useState([]);
const [transactions, setTransactions] = useState([]);
const [stats, setStats] = useState({
  totalSpent: 0,
  todayCount: 0,
  monthlySpent: 0
});
```

**Key Functions:**
- `loadDashboardData()` - Load all dashboard data
- `handleCreateWallet()` - Create new wallet if none exists

**Features:**
- Stats cards with icons
- Chart visualization (7-day spending)
- Recent transactions list
- Wallet creation flow
- Error handling with user feedback

### 2. Auth Page (`src/app/auth/page.tsx`)

**States:**
```typescript
type AuthMode = 'login' | 'register' | 'verify';
const [mode, setMode] = useState<AuthMode>('login');
```

**Forms:**
- **Login Form**: Email + Password
- **Register Form**: Full Name + Email + Phone + Password
- **OTP Verify**: Phone + OTP code

**Features:**
- Multi-step authentication flow
- OTP resend functionality
- Backend connection testing
- Form validation
- Error/success messages

### 3. Layout (`src/app/layout.tsx`)

**Providers Stack:**
```tsx
<QueryClientProvider>
  <AuthProvider>
    <WalletProvider>
      <Navigation />
      <main>{children}</main>
      <Toaster />
    </WalletProvider>
  </AuthProvider>
</QueryClientProvider>
```

## 🔄 Context Providers

### 1. AuthContext (`src/contexts/AuthContext.tsx`)

**State:**
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  register: (data: RegisterData) => Promise<void>;
}
```

**Key Features:**
- JWT token management
- Auto-load user on app start
- Token refresh handling
- Persistent login state

**Usage:**
```tsx
const { user, login, logout } = useAuth();

// Login
await login('user@example.com', 'password');

// Logout
await logout();
```

### 2. WalletContext (`src/contexts/WalletContext.tsx`)

**State:**
```typescript
interface WalletContextType {
  wallet: Wallet | null;
  loading: boolean;
  createWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  requestFaucet: () => Promise<void>;
}
```

**Key Features:**
- Wallet creation
- Balance checking
- MIST to SUI conversion
- Faucet integration

**Usage:**
```tsx
const { wallet, createWallet, refreshBalance } = useWalletContext();

// Create wallet
await createWallet();

// Refresh balance
await refreshBalance();
```

## 🎨 Styling System

### Tailwind CSS Classes

**Color Palette:**
- Primary: `blue-600`, `blue-50`
- Success: `green-500`, `green-100`
- Error: `red-500`, `red-100`
- Warning: `yellow-500`, `yellow-100`
- Gray scales: `gray-50` to `gray-900`

**Common Patterns:**
```css
/* Cards */
.card {
  @apply bg-white rounded-xl p-6 shadow-lg;
}

/* Buttons */
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700;
}

/* Loading spinner */
.spinner {
  @apply animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600;
}
```

### Responsive Design
```css
/* Mobile first approach */
.container {
  @apply px-4 sm:px-6 lg:px-8;
}

.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}
```

## 🔧 Component Patterns

### 1. Loading State Pattern
```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <div className="text-gray-600">Đang tải...</div>
      </div>
    </div>
  );
}
```

### 2. Error Handling Pattern
```tsx
{error && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
    <div className="flex justify-between items-center">
      <span>{error}</span>
      <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
        ✕
      </button>
    </div>
  </div>
)}
```

### 3. Conditional Rendering Pattern
```tsx
// User not logged in
if (!user) {
  return (
    <div className="text-center">
      <h1>Vui lòng đăng nhập</h1>
      <Link href="/auth">Đi đến trang đăng nhập</Link>
    </div>
  );
}

// Wallet not exists
if (!wallet && !walletLoading) {
  return (
    <div className="text-center">
      <h1>Tạo ví để bắt đầu</h1>
      <button onClick={handleCreateWallet}>Tạo ví mới</button>
    </div>
  );
}
```

## 📱 Responsive Components

### Navigation Responsive Behavior
```tsx
// Desktop: Full navigation with text
<span className="hidden md:inline">{item.label}</span>

// Mobile: Icons only
<Icon className="w-5 h-5" />
```

### Stats Cards Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Stats cards */}
</div>
```

### Chart Responsive Container
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
    {/* Chart components */}
  </LineChart>
</ResponsiveContainer>
```

## 🔐 Security Patterns

### Token Management
```typescript
// Safe token storage
const token = localStorage.getItem('authToken');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}

// Auto cleanup on logout
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  setUser(null);
};
```

### Protected Routes
```tsx
// Route protection in components
if (!user) {
  return <Redirect to="/auth" />;
}
```

### Input Validation
```tsx
<input
  type="email"
  required
  minLength={8} // For passwords
  maxLength={6} // For OTP
  pattern="[0-9]{6}" // OTP pattern
/>
```

## 🧪 Component Testing

### Test Utilities
```typescript
// Mock contexts for testing
const MockAuthProvider = ({ children, user = null }) => (
  <AuthContext.Provider value={{ user, login: jest.fn(), ... }}>
    {children}
  </AuthContext.Provider>
);

// Component testing
it('should display user name when logged in', () => {
  render(
    <MockAuthProvider user={mockUser}>
      <Navigation />
    </MockAuthProvider>
  );
  expect(screen.getByText(mockUser.fullName)).toBeInTheDocument();
});
```

## 📋 Component Checklist

### New Component Requirements
- ✅ TypeScript interfaces
- ✅ Error boundaries
- ✅ Loading states
- ✅ Responsive design
- ✅ Accessibility (ARIA labels)
- ✅ Unit tests
- ✅ JSDoc documentation

### Performance Optimization
- ✅ React.memo for expensive components
- ✅ useMemo for computed values
- ✅ useCallback for event handlers
- ✅ Code splitting with dynamic imports
- ✅ Image optimization with Next.js Image

### Accessibility
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ High contrast support
- ✅ Focus management