# API Integration Documentation

## 🔌 HTTP Client Configuration

### Base Setup (`src/lib/api-client.ts`)

```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});
```

### Request Interceptor (Authentication)
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor (Error Handling)
```typescript
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth';
    }
    
    throw error;
  }
);
```

## 🔐 Authentication APIs

### 1. User Registration
```typescript
export async function registerAPI(data: {
  email: string;
  password: string;
  phoneNumber: string;
  fullName: string;
}) {
  return api.post('/auth/register', data);
}

// Usage example
try {
  const response = await registerAPI({
    email: 'user@example.com',
    password: 'securePassword123',
    phoneNumber: '+84901234567',
    fullName: 'Nguyễn Văn A'
  });
  
  if (response.success) {
    // Redirect to OTP verification
    console.log('Registration successful:', response.message);
  }
} catch (error) {
  console.error('Registration failed:', error.response?.data?.error);
}
```

### 2. User Login
```typescript
export async function loginAPI(email: string, password: string) {
  return api.post('/auth/login', { email, password });
}

// Response structure
interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    isVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
```

### 3. OTP Verification
```typescript
export async function verifyOtpAPI(phoneNumber: string, otp: string) {
  return api.post('/auth/verify-email', { phoneNumber, otp });
}

export async function resendOtpAPI(phoneNumber: string) {
  return api.post('/auth/resend-otp', { phoneNumber });
}
```

### 4. Logout
```typescript
export async function logoutAPI() {
  return api.post('/auth/logout');
}

// Implementation with cleanup
const handleLogout = async () => {
  try {
    await logoutAPI();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always cleanup local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }
};
```

## 👤 User Management APIs

### 1. Get User Profile
```typescript
export async function getUserProfileAPI() {
  return api.get('/user/profile');
}

// Response structure
interface UserProfile {
  success: boolean;
  user: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    isVerified: boolean;
    wallet?: {
      address: string;
      balance: number;
    };
  };
}
```

### 2. Update User Profile
```typescript
export async function updateUserProfileAPI(data: {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
}) {
  return api.put('/user/profile', data);
}
```

### 3. Set PIN Code
```typescript
export async function setPinAPI(pin: string, confirmPin: string) {
  return api.post('/user/pin/set', { pin, confirmPin });
}
```

## 💳 Card Management APIs

### 1. Create New Card
```typescript
export async function createCardAPI(data: {
  cardType: 'standard' | 'premium' | 'corporate';
  cardName?: string;
  limits?: { daily: number; monthly: number };
}) {
  return api.post('/card/create', data);
}

// Usage example
const createCard = async () => {
  try {
    const response = await createCardAPI({
      cardType: 'standard',
      cardName: 'Thẻ chính',
      limits: {
        daily: 1000000, // 1M SUI
        monthly: 10000000 // 10M SUI
      }
    });
    
    if (response.success) {
      console.log('Card created:', response.card);
    }
  } catch (error) {
    console.error('Card creation failed:', error);
  }
};
```

### 2. Get User Cards
```typescript
export async function getUserCardsAPI() {
  return api.get('/card/');
}

// Response structure
interface CardResponse {
  success: boolean;
  cards: Array<{
    id: string;
    cardType: string;
    cardName: string;
    status: 'active' | 'blocked' | 'inactive';
    balance: number;
    limits: {
      daily: number;
      monthly: number;
    };
    createdAt: string;
  }>;
}
```

### 3. Card Operations
```typescript
// Get specific card
export async function getCardAPI(cardId: string) {
  return api.get(`/card/${cardId}`);
}

// Activate card
export async function activateCardAPI(cardId: string) {
  return api.post(`/card/${cardId}/activate`);
}

// Block card
export async function blockCardAPI(cardId: string, reason?: string) {
  return api.post(`/card/${cardId}/block`, { reason });
}

// Unblock card
export async function unblockCardAPI(cardId: string) {
  return api.post(`/card/${cardId}/unblock`);
}

// Set as primary card
export async function setPrimaryCardAPI(cardId: string) {
  return api.post(`/card/${cardId}/set-primary`);
}
```

## 💰 Wallet APIs

### 1. Create Wallet
```typescript
export async function createWalletAPI() {
  return api.post('/wallet/create');
}

// Integration in WalletContext
const createWallet = async () => {
  setLoading(true);
  try {
    const response = await createWalletAPI();
    if (response.success) {
      setWallet({
        address: response.wallet.address,
        balance: 0,
        tokens: []
      });
    }
  } catch (error) {
    console.error('Failed to create wallet:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

### 2. Get Wallet Balance
```typescript
export async function getWalletBalanceAPI() {
  return api.get('/wallet/balance');
}

// Response processing
const refreshBalance = async () => {
  setLoading(true);
  try {
    const response = await getWalletBalanceAPI();
    if (response.success) {
      setWallet(prev => ({
        address: prev?.address || '',
        balance: parseFloat(response.balance.sui) / 1000000000, // MIST to SUI
        tokens: response.balance.coins?.map((coin: any) => ({
          symbol: coin.type.includes('SUI') ? 'SUI' : 'UNKNOWN',
          name: coin.type.includes('SUI') ? 'Sui Token' : 'Unknown Token',
          balance: parseFloat(coin.balance) / 1000000000
        })) || []
      }));
    }
  } catch (error) {
    console.error('Failed to refresh balance:', error);
  } finally {
    setLoading(false);
  }
};
```

### 3. Wallet Transactions
```typescript
export async function getWalletTransactionsAPI(params?: {
  page?: number;
  limit?: number;
}) {
  return api.get('/wallet/transactions', { params });
}
```

### 4. Request Faucet (Testnet)
```typescript
export async function requestFaucetAPI() {
  return api.post('/wallet/faucet');
}

// Usage with automatic balance refresh
const requestFaucet = async () => {
  setLoading(true);
  try {
    const response = await requestFaucetAPI();
    if (response.success) {
      // Wait a moment for blockchain confirmation
      setTimeout(() => refreshBalance(), 2000);
    }
    return response;
  } catch (error) {
    console.error('Failed to request faucet:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

## 💸 Payment APIs

### 1. Validate Payment
```typescript
interface PaymentRequest {
  merchantId: string;
  amount: number;
  currency: 'SUI';
  description?: string;
  metadata?: Record<string, any>;
}

export async function validatePaymentAPI(request: PaymentRequest) {
  return api.post('/payment/validate', request);
}
```

### 2. Process Payment
```typescript
export async function processPaymentAPI(
  request: PaymentRequest & { pin?: string }
): Promise<PaymentResponse> {
  return api.post('/payment/process', request);
}

// Usage example
const handlePayment = async (paymentData: PaymentRequest) => {
  try {
    // First validate
    const validation = await validatePaymentAPI(paymentData);
    if (!validation.success) {
      throw new Error(validation.error);
    }
    
    // Process payment with PIN
    const pin = await promptForPin(); // Custom PIN input
    const response = await processPaymentAPI({
      ...paymentData,
      pin
    });
    
    if (response.success) {
      toast({
        type: 'success',
        title: 'Thanh toán thành công',
        description: `Giao dịch ${response.transactionId}`
      });
    }
  } catch (error) {
    toast({
      type: 'error',
      title: 'Thanh toán thất bại',
      description: error.message
    });
  }
};
```

### 3. Payment History
```typescript
export async function getPaymentHistoryAPI(params?: {
  page?: number;
  limit?: number;
  status?: 'completed' | 'failed' | 'pending';
  startDate?: string;
  endDate?: string;
}) {
  return api.get('/payment/history', { params });
}

// Usage in Dashboard
useEffect(() => {
  const loadTransactions = async () => {
    try {
      const response = await getPaymentHistoryAPI({ limit: 10 });
      if (response.success) {
        setTransactions(response.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };
  
  if (user) {
    loadTransactions();
  }
}, [user]);
```

### 4. Refund Transaction
```typescript
export async function refundTransactionAPI(txId: string, reason?: string) {
  return api.post(`/payment/${txId}/refund`, { reason });
}
```

## 🏪 Merchant APIs

### 1. Register as Merchant
```typescript
export async function registerMerchantAPI(data: {
  businessName: string;
  contactEmail: string;
  businessType: string;
  address: string;
  webhookUrl?: string;
}) {
  return api.post('/merchant/register', data);
}
```

### 2. Get Merchant Info
```typescript
export async function getMerchantInfoAPI(merchantId: string) {
  return api.get(`/merchant/info/${merchantId}`);
}
```

## 🔄 Error Handling Patterns

### 1. API Error Types
```typescript
interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: any;
}

// Common error codes
const ERROR_CODES = {
  AUTH_001: 'Invalid credentials',
  AUTH_002: 'Token expired',
  AUTH_003: 'Token not provided',
  AUTH_004: 'Authentication required',
  USER_001: 'User not found',
  WALLET_001: 'Wallet not found',
  PAYMENT_001: 'Insufficient balance',
  // ... more codes
};
```

### 2. Error Handling Helper
```typescript
const handleApiError = (error: any) => {
  const apiError = error.response?.data;
  
  if (apiError?.code) {
    // Handle specific error codes
    switch (apiError.code) {
      case 'AUTH_004':
        // Redirect to login
        window.location.href = '/auth';
        break;
      case 'PAYMENT_001':
        toast({
          type: 'error',
          title: 'Số dư không đủ',
          description: 'Vui lòng nạp thêm tiền vào ví'
        });
        break;
      default:
        toast({
          type: 'error',
          title: 'Có lỗi xảy ra',
          description: apiError.error || 'Vui lòng thử lại sau'
        });
    }
  } else {
    // Network or unknown error
    toast({
      type: 'error',
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến server'
    });
  }
};
```

### 3. Retry Logic
```typescript
const apiWithRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Don't retry on 4xx errors (client errors)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw new Error('Max retries exceeded');
};
```

## 📊 API Response Caching

### 1. Simple Memory Cache
```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};
```

### 2. API with Caching
```typescript
export async function getUserProfileAPIWithCache() {
  const cacheKey = 'user-profile';
  const cached = getCachedData(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const response = await getUserProfileAPI();
  setCachedData(cacheKey, response);
  
  return response;
}
```

## 🔒 Security Best Practices

### 1. Token Management
```typescript
// Secure token storage (consider using httpOnly cookies in production)
const TokenManager = {
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  
  getAccessToken(): string | null {
    return localStorage.getItem('authToken');
  },
  
  clearTokens() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  },
  
  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
};
```

### 2. Request Sanitization
```typescript
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

const sanitizeApiData = (data: Record<string, any>) => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};
```

### 3. Environment Configuration
```typescript
// Environment-specific API configuration
const getApiConfig = () => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'production':
      return {
        baseURL: 'https://api.nfcpayment.com/api',
        timeout: 15000,
      };
    case 'staging':
      return {
        baseURL: 'https://staging-api.nfcpayment.com/api',
        timeout: 10000,
      };
    default:
      return {
        baseURL: 'http://localhost:8080/api',
        timeout: 5000,
      };
  }
};
```