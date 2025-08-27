# Frontend Development Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ với npm hoặc yarn
- Visual Studio Code (khuyến nghị)
- Git
- Backend server running on port 8080

### Development Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd nfc-payment-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_NAME="NFC Payment"
NEXT_PUBLIC_ENVIRONMENT=development
```

## 🛠️ Development Tools

### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["className\\s*=\\s*['\"`]([^'\"`]*)['\"`]", "([a-zA-Z0-9\\-:]+)"]
  ]
}
```

### Package Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 📝 Code Standards

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### ESLint Configuration
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "prefer-const": "error",
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## 🏗️ Architecture Patterns

### File Naming Conventions
```
PascalCase for components:    UserProfile.tsx
camelCase for utilities:      formatCurrency.ts
kebab-case for pages:         user-settings.tsx
UPPERCASE for constants:      API_ENDPOINTS.ts
```

### Import Organization
```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';

// 2. Third-party libraries
import axios from 'axios';
import { toast } from 'react-hot-toast';

// 3. Internal imports - absolute paths
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

// 4. Types
import { User, Wallet } from '@/types';
```

### Component Structure Template
```typescript
'use client';

import React, { useState, useEffect } from 'react';

// Types
interface ComponentNameProps {
  prop1: string;
  prop2?: number;
  children?: React.ReactNode;
}

// Component
export default function ComponentName({ 
  prop1, 
  prop2 = 0, 
  children 
}: ComponentNameProps) {
  // State
  const [state1, setState1] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    // Side effects
  }, []);

  // Handlers
  const handleAction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Action logic
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Early returns
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  // Main render
  return (
    <div className="component-wrapper">
      {children}
    </div>
  );
}
```

## 🎨 Styling Guidelines

### Tailwind CSS Patterns
```typescript
// Consistent spacing scale
const spacing = {
  xs: 'p-2',     // 8px
  sm: 'p-4',     // 16px
  md: 'p-6',     // 24px
  lg: 'p-8',     // 32px
  xl: 'p-12',    // 48px
};

// Color system
const colors = {
  primary: 'blue-600',
  secondary: 'gray-600',
  success: 'green-500',
  warning: 'yellow-500',
  error: 'red-500',
};

// Component variants
const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
};
```

### CSS Custom Properties
```css
/* globals.css */
:root {
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --radius: 0.5rem;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.card {
  @apply bg-white rounded-lg shadow-lg p-6;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
```

### Responsive Design Patterns
```typescript
// Mobile-first breakpoints
const breakpoints = {
  sm: '640px',   // Small devices
  md: '768px',   // Tablets
  lg: '1024px',  // Desktops
  xl: '1280px',  // Large screens
};

// Usage
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Responsive grid */}
</div>
```

## 🔄 State Management Patterns

### Context Pattern
```typescript
// AuthContext pattern
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Custom Hooks Pattern
```typescript
// Custom hook for API calls
export function useApi<T>(apiCall: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  return { data, loading, error, execute };
}

// Usage
const { data: transactions, loading, execute: loadTransactions } = useApi(
  () => getPaymentHistoryAPI({ limit: 10 })
);
```

### Local Storage Hook
```typescript
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
```

## 🧪 Testing Strategy

### Unit Testing Setup
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Jest Configuration
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

### Component Testing Example
```typescript
// __tests__/components/Navigation.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import Navigation from '@/components/Navigation';

const MockProviders = ({ children, user = null, wallet = null }) => (
  <AuthProvider value={{ user, logout: jest.fn() }}>
    <WalletProvider value={{ wallet }}>
      {children}
    </WalletProvider>
  </AuthProvider>
);

describe('Navigation', () => {
  it('should not render when user is not logged in', () => {
    render(
      <MockProviders>
        <Navigation />
      </MockProviders>
    );
    
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should display user name when logged in', () => {
    const mockUser = { id: '1', fullName: 'John Doe', email: 'john@example.com' };
    
    render(
      <MockProviders user={mockUser}>
        <Navigation />
      </MockProviders>
    );
    
    expect(screen.getByText('Xin chào, John Doe')).toBeInTheDocument();
  });

  it('should call logout when logout button is clicked', async () => {
    const mockLogout = jest.fn();
    const mockUser = { id: '1', fullName: 'John Doe' };
    
    render(
      <MockProviders user={mockUser} logout={mockLogout}>
        <Navigation />
      </MockProviders>
    );
    
    fireEvent.click(screen.getByText('Đăng xuất'));
    expect(mockLogout).toHaveBeenCalled();
  });
});
```

### API Testing
```typescript
// __tests__/lib/api-client.test.ts
import axios from 'axios';
import { loginAPI } from '@/lib/api-client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client', () => {
  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  it('should login successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        user: { id: '1', email: 'test@example.com' },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123' }
      }
    };
    
    mockedAxios.post.mockResolvedValue(mockResponse);
    
    const result = await loginAPI('test@example.com', 'password');
    
    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password'
    });
    expect(result.success).toBe(true);
  });
});
```

## 🚀 Performance Optimization

### Code Splitting
```typescript
// Dynamic imports for large components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

// Route-based splitting (automatic with Next.js pages)
const DashboardPage = dynamic(() => import('@/pages/dashboard'));
```

### Memoization Patterns
```typescript
import React, { memo, useMemo, useCallback } from 'react';

// Component memoization
const ExpensiveComponent = memo(({ data, onUpdate }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});

// Value memoization
const ProcessedData = ({ transactions }) => {
  const chartData = useMemo(() => {
    return transactions.map(tx => ({
      date: format(new Date(tx.createdAt), 'dd/MM'),
      amount: tx.amount
    }));
  }, [transactions]);

  const handleClick = useCallback((id: string) => {
    // Event handler
  }, []);

  return <Chart data={chartData} onClick={handleClick} />;
};
```

### Image Optimization
```typescript
import Image from 'next/image';

// Optimized images
<Image
  src="/images/hero.jpg"
  alt="Hero image"
  width={800}
  height={600}
  priority
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

## 🔍 Debugging Tools

### Development Logging
```typescript
// Logger utility
class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  static debug(message: string, data?: any) {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data);
    }
  }

  static error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error);
    
    // Send to error reporting service in production
    if (!this.isDevelopment) {
      // reportError(message, error);
    }
  }
}

// Usage
Logger.debug('API call started', { endpoint: '/auth/login' });
Logger.error('Login failed', error);
```

### React DevTools
```typescript
// Add displayName for better debugging
const useAuth = () => {
  // Hook logic
};
useAuth.displayName = 'useAuth';

const AuthProvider = ({ children }) => {
  // Provider logic
};
AuthProvider.displayName = 'AuthProvider';
```

### Network Debugging
```typescript
// API request/response logging
api.interceptors.request.use(request => {
  Logger.debug('API Request', {
    url: request.url,
    method: request.method,
    data: request.data
  });
  return request;
});

api.interceptors.response.use(
  response => {
    Logger.debug('API Response', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    Logger.error('API Error', {
      url: error.config?.url,
      status: error.response?.status,
      error: error.response?.data
    });
    return Promise.reject(error);
  }
);
```

## 🔒 Security Practices

### Input Sanitization
```typescript
import DOMPurify from 'dompurify';

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html);
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
```

### Environment Variables Validation
```typescript
// lib/env.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_APP_NAME'
] as const;

export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL!,
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME!,
};

// Validate on startup
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

### Content Security Policy
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' https:;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

## 📦 Build & Deployment

### Production Build
```bash
# Build optimization
npm run build

# Analyze bundle size
npm install --save-dev @next/bundle-analyzer
ANALYZE=true npm run build
```

### Docker Development
```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Environment-specific Builds
```bash
# Development
npm run build:dev

# Staging
npm run build:staging

# Production
npm run build:prod
```

## 🔄 Git Workflow

### Branch Naming
```
feature/auth-integration
bugfix/wallet-balance-display
hotfix/critical-security-fix
release/v1.2.0
```

### Commit Messages
```
feat(auth): add OTP verification
fix(wallet): correct balance display format
docs(api): update integration guide
style(ui): improve button hover states
refactor(hooks): extract common API logic
test(components): add Navigation component tests
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```