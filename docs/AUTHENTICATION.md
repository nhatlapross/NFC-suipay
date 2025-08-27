# Authentication Flow Documentation

## 🔐 Overview

Hệ thống authentication của NFC Payment sử dụng JWT (JSON Web Tokens) với refresh token pattern, tích hợp xác thực OTP qua SMS để đảm bảo tính bảo mật cao.

## 📊 Authentication Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Register  │    │  OTP Verify │    │    Login    │    │  Dashboard  │
│             │───▶│             │───▶│             │───▶│             │
│ Email+Phone │    │  Phone+OTP  │    │Email+Passwd │    │ Authenticated│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
   Send OTP            Verify OTP         Generate JWT       Access APIs
```

## 🚀 Registration Flow

### 1. User Registration
```typescript
// src/app/auth/page.tsx
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    await register({ email, password, fullName, phoneNumber });
    setMessage('Đăng ký thành công! Vui lòng xác thực số điện thoại.');
    setMode('verify'); // Chuyển sang bước OTP
  } catch (err: any) {
    setError(err.response?.data?.error || 'Đăng ký thất bại');
  } finally {
    setLoading(false);
  }
};
```

### 2. Backend Registration Endpoint
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "+84901234567"
}
```

### 3. Registration Response
```json
{
  "success": true,
  "message": "Đăng ký thành công. Vui lòng xác thực số điện thoại.",
  "user": {
    "id": "user_id_123",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "+84901234567",
    "isVerified": false
  }
}
```

## 📱 OTP Verification Flow

### 1. OTP Verification Component
```typescript
const handleVerifyOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    const response = await verifyOtpAPI(phoneNumber, otp);
    if (response.success) {
      setMessage('Xác thực thành công! Bạn có thể đăng nhập.');
      setMode('login');
    } else {
      setError('Mã OTP không hợp lệ');
    }
  } catch (err: any) {
    setError(err.response?.data?.error || 'Xác thực thất bại');
  } finally {
    setLoading(false);
  }
};
```

### 2. OTP Verification API
```
POST /api/auth/verify-email
Content-Type: application/json

{
  "phoneNumber": "+84901234567",
  "otp": "123456"
}
```

### 3. Resend OTP Feature
```typescript
const handleResendOtp = async () => {
  setLoading(true);
  setError('');
  
  try {
    await resendOtpAPI(phoneNumber);
    setMessage('Đã gửi lại mã OTP');
  } catch (err: any) {
    setError(err.response?.data?.error || 'Không thể gửi mã OTP');
  } finally {
    setLoading(false);
  }
};
```

## 🔑 Login Flow

### 1. Login Component
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    await login(email, password);
    setMessage('Đăng nhập thành công!');
    // AuthContext sẽ tự động redirect đến dashboard
  } catch (err: any) {
    setError(err.response?.data?.error || 'Đăng nhập thất bại');
  } finally {
    setLoading(false);
  }
};
```

### 2. AuthContext Login Implementation
```typescript
// src/contexts/AuthContext.tsx
const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    const response = await loginAPI(email, password);
    
    if (response.success) {
      // Lưu tokens vào localStorage
      localStorage.setItem('authToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      
      // Cập nhật user state
      setUser(response.user);
      
      // Redirect được xử lý bởi Navigation component
    } else {
      throw new Error(response.message || 'Login failed');
    }
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

### 3. Login API Request
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 4. Login Response
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "user": {
    "id": "user_id_123",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "+84901234567",
    "isVerified": true,
    "wallet": {
      "address": "0x...",
      "balance": 1.5
    }
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## 🔄 Token Management

### 1. JWT Token Structure
```typescript
// Access Token Payload
{
  "userId": "user_id_123",
  "email": "user@example.com",
  "role": "user",
  "iat": 1640995200, // Issued at
  "exp": 1640998800  // Expires at (1 hour)
}

// Refresh Token Payload
{
  "userId": "user_id_123",
  "tokenType": "refresh",
  "iat": 1640995200,
  "exp": 1648771200  // Expires at (90 days)
}
```

### 2. Automatic Token Attachment
```typescript
// src/lib/api-client.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Token Refresh Logic
```typescript
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          });
          
          const { accessToken } = response.data;
          localStorage.setItem('authToken', accessToken);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth';
      }
    }
    
    throw error;
  }
);
```

## 🚪 Logout Flow

### 1. Logout Implementation
```typescript
const logout = async () => {
  try {
    // Notify server to invalidate tokens
    await logoutAPI();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always cleanup client state
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    
    // Redirect to auth page
    router.push('/auth');
  }
};
```

### 2. Server-side Token Invalidation
```
POST /api/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

## 🔐 Route Protection

### 1. Navigation-based Protection
```typescript
// src/components/Navigation.tsx
export default function Navigation() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Hide navigation on auth pages or when not logged in
  if (!user || pathname === '/auth') {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg">
      {/* Navigation content */}
    </nav>
  );
}
```

### 2. Page-level Protection
```typescript
// src/app/dashboard/page.tsx
export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h1>
          <a href="/auth" className="text-blue-600 hover:text-blue-500">
            Đi đến trang đăng nhập
          </a>
        </div>
      </div>
    );
  }

  // Protected content
  return <DashboardContent />;
}
```

### 3. Higher-Order Component for Route Protection
```typescript
// src/components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  fallback = <AuthRedirect /> 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return fallback;
  }

  return <>{children}</>;
}

// Usage
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

## 🏃‍♂️ Auto-login on App Start

### 1. AuthContext Initialization
```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Validate token by fetching user profile
        const response = await getUserProfileAPI();
        if (response.success) {
          setUser(response.user);
        } else {
          // Invalid token, clean up
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of provider
}
```

### 2. Loading States During Auto-login
```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <AuthLoadingWrapper>
            <WalletProvider>
              <Navigation />
              <main>{children}</main>
            </WalletProvider>
          </AuthLoadingWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

function AuthLoadingWrapper({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang khởi tạo ứng dụng...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

## 🔒 Security Considerations

### 1. Token Storage Security
```typescript
// Hiện tại sử dụng localStorage (development)
// Production nên sử dụng httpOnly cookies
const TokenStorage = {
  setTokens(accessToken: string, refreshToken: string) {
    if (process.env.NODE_ENV === 'production') {
      // Use httpOnly cookies in production
      document.cookie = `accessToken=${accessToken}; HttpOnly; Secure; SameSite=Strict`;
      document.cookie = `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict`;
    } else {
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  getAccessToken(): string | null {
    if (process.env.NODE_ENV === 'production') {
      // Extract from httpOnly cookie
      return getCookieValue('accessToken');
    }
    return localStorage.getItem('authToken');
  }
};
```

### 2. CSRF Protection
```typescript
// Add CSRF token to requests
api.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

### 3. Input Validation
```typescript
// Client-side validation
const validateAuthInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  password: (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },
  
  phoneNumber: (phone: string): boolean => {
    // Vietnamese phone number format
    const phoneRegex = /^(\+84|84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
    return phoneRegex.test(phone);
  },
  
  otp: (otp: string): boolean => {
    return /^\d{6}$/.test(otp);
  }
};
```

## 📱 Mobile Considerations

### 1. Responsive Auth Forms
```typescript
// Mobile-friendly form styling
<form className="space-y-6 max-w-sm mx-auto px-4">
  <input
    className="w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    type="tel"
    inputMode="numeric"
    pattern="[0-9]*"
    maxLength={6}
    placeholder="123456"
  />
  
  <button className="w-full py-3 text-lg bg-blue-600 text-white rounded-lg">
    Xác thực
  </button>
</form>
```

### 2. Touch-friendly OTP Input
```typescript
const OtpInput = ({ value, onChange }) => {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={6}
      className="text-center text-2xl tracking-widest py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
      style={{ fontSize: '24px', letterSpacing: '0.5em' }}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      placeholder="• • • • • •"
    />
  );
};
```

## 🐛 Error Handling

### 1. Auth Error Types
```typescript
interface AuthError {
  code: string;
  message: string;
  field?: string;
}

const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    code: 'AUTH_001',
    message: 'Email hoặc mật khẩu không đúng'
  },
  TOKEN_EXPIRED: {
    code: 'AUTH_002',
    message: 'Phiên đăng nhập đã hết hạn'
  },
  USER_NOT_VERIFIED: {
    code: 'AUTH_005',
    message: 'Tài khoản chưa được xác thực'
  },
  OTP_INVALID: {
    code: 'AUTH_006',
    message: 'Mã OTP không đúng hoặc đã hết hạn'
  }
};
```

### 2. Error Display Component
```typescript
const AuthError = ({ error, onDismiss }) => {
  if (!error) return null;

  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'AUTH_001':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'AUTH_006':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getErrorIcon(error.code)}
          <span>{error.message}</span>
        </div>
        <button onClick={onDismiss} className="text-red-700 hover:text-red-900">
          ✕
        </button>
      </div>
    </div>
  );
};
```

## 📊 Authentication Analytics

### 1. Login Success Tracking
```typescript
const trackAuthEvent = (event: string, data?: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    analytics.track(event, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }
};

// Usage in auth flows
const login = async (email: string, password: string) => {
  try {
    const response = await loginAPI(email, password);
    trackAuthEvent('login_success', { method: 'email' });
    return response;
  } catch (error) {
    trackAuthEvent('login_failed', { 
      method: 'email',
      error: error.response?.data?.code 
    });
    throw error;
  }
};
```

### 2. Session Duration Tracking
```typescript
const SessionTracker = {
  startSession() {
    sessionStorage.setItem('sessionStart', Date.now().toString());
  },

  endSession() {
    const startTime = sessionStorage.getItem('sessionStart');
    if (startTime) {
      const duration = Date.now() - parseInt(startTime);
      trackAuthEvent('session_end', { duration });
      sessionStorage.removeItem('sessionStart');
    }
  }
};
```