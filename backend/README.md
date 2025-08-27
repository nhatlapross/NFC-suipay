# NFC Payment Backend API

Backend service cho ứng dụng thanh toán NFC sử dụng Sui blockchain, Node.js, Express và MongoDB.

## 📋 Mục lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Khởi chạy](#khởi-chạy)
- [API Documentation](#api-documentation)
- [Kiến trúc](#kiến-trúc)
- [Database Schema](#database-schema)
- [Blockchain Integration](#blockchain-integration)

## 🔧 Yêu cầu hệ thống

- Node.js >= 18.0.0
- MongoDB >= 5.0
- Redis >= 6.0 (optional)
- Yarn hoặc npm

## 📦 Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd nfc-payment-app/backend

# Cài đặt dependencies
npm install

# Hoặc sử dụng yarn
yarn install
```

## ⚙️ Cấu hình

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cấu hình các biến môi trường:

```env
# Server Configuration
NODE_ENV=development
PORT=8080
HOST=localhost

# Database
MONGODB_URI=mongodb://localhost:27017/nfc-payment
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-character-encryption-key

# Sui Blockchain
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io
SUI_PACKAGE_ID=0x...your-deployed-package-id
SUI_MERCHANT_WALLET=0x...merchant-wallet-address
SUI_ADMIN_PRIVATE_KEY=suiprivkey1...your-private-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🚀 Khởi chạy

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker-compose up -d
```

## 📚 API Documentation

### Base URL
```
http://localhost:8080/api
```

### Authentication
Tất cả API (trừ auth endpoints) yêu cầu JWT token trong header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Đăng ký tài khoản mới |
| POST | `/login` | Đăng nhập |
| POST | `/logout` | Đăng xuất |
| POST | `/refresh-token` | Làm mới token |
| POST | `/verify-email` | Xác thực email/phone |
| POST | `/forgot-password` | Quên mật khẩu |
| POST | `/reset-password` | Đặt lại mật khẩu |
| POST | `/change-password` | Đổi mật khẩu |

#### 👤 User Management (`/api/user`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Lấy thông tin profile |
| PUT | `/profile` | Cập nhật profile |
| DELETE | `/account` | Xóa tài khoản |
| GET | `/settings` | Lấy cài đặt |
| PUT | `/settings` | Cập nhật cài đặt |
| POST | `/pin/set` | Thiết lập PIN |
| POST | `/pin/change` | Đổi PIN |
| GET | `/kyc` | Lấy trạng thái KYC |
| POST | `/kyc/submit` | Nộp hồ sơ KYC |

#### 💳 Card Management (`/api/card`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Tạo thẻ mới |
| GET | `/` | Lấy danh sách thẻ |
| GET | `/:cardId` | Lấy thông tin thẻ |
| PUT | `/:cardId` | Cập nhật thẻ |
| DELETE | `/:cardId` | Xóa thẻ |
| POST | `/:cardId/activate` | Kích hoạt thẻ |
| POST | `/:cardId/block` | Khóa thẻ |
| POST | `/:cardId/set-primary` | Đặt thẻ chính |

#### 💰 Payment Processing (`/api/payment`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/validate` | Xác thực giao dịch |
| POST | `/process` | Xử lý thanh toán |
| POST | `/sign` | Ký giao dịch |
| POST | `/complete` | Hoàn tất giao dịch |
| GET | `/history` | Lịch sử giao dịch |
| POST | `/:txId/refund` | Hoàn tiền |

#### 🏪 Merchant (`/api/merchant`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Đăng ký merchant |
| GET | `/info/:merchantId` | Thông tin merchant |
| GET | `/stats` | Thống kê merchant |
| POST | `/webhook/config` | Cấu hình webhook |

#### 👛 Wallet (`/api/wallet`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Tạo ví |
| GET | `/balance` | Kiểm tra số dư |
| GET | `/transactions` | Lịch sử giao dịch |
| POST | `/faucet` | Lấy test tokens |

#### 🔧 Admin (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard admin |
| GET | `/users` | Quản lý users |
| GET | `/merchants` | Quản lý merchants |
| GET | `/transactions` | Quản lý giao dịch |
| GET | `/settings` | Cài đặt hệ thống |

## 🏗️ Kiến trúc

```
src/
├── config/          # Cấu hình database, blockchain
├── controllers/     # API controllers
├── middleware/      # Express middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utilities
└── validators/      # Input validation
```

### Layers

1. **Routes** - Định nghĩa API endpoints
2. **Middleware** - Authentication, validation, rate limiting
3. **Controllers** - Xử lý HTTP requests/responses
4. **Services** - Business logic và blockchain integration
5. **Models** - Database schema definitions

## 💾 Database Schema

### Users
```javascript
{
  email: String,
  password: String,
  phoneNumber: String,
  fullName: String,
  walletAddress: String,
  role: ['user', 'merchant', 'admin'],
  status: ['active', 'blocked', 'suspended'],
  kycStatus: ['pending', 'verified', 'rejected'],
  createdAt: Date,
  updatedAt: Date
}
```

### Cards
```javascript
{
  cardUuid: String,
  userId: ObjectId,
  cardType: ['standard', 'premium', 'corporate'],
  cardNumber: String,
  isActive: Boolean,
  expiryDate: Date,
  dailyLimit: Number,
  monthlyLimit: Number,
  usageCount: Number,
  createdAt: Date
}
```

### Transactions
```javascript
{
  transactionId: String,
  userId: ObjectId,
  cardId: ObjectId,
  merchantId: ObjectId,
  amount: Number,
  currency: String,
  status: ['pending', 'processing', 'completed', 'failed'],
  txHash: String,
  blockchainData: Object,
  createdAt: Date,
  completedAt: Date
}
```

### Merchants
```javascript
{
  merchantId: String,
  businessName: String,
  contactEmail: String,
  walletAddress: String,
  apiKey: String,
  webhookUrl: String,
  isActive: Boolean,
  createdAt: Date
}
```

## ⛓️ Blockchain Integration

### Sui Network Configuration

- **Network**: Testnet/Mainnet
- **RPC Endpoint**: Sui full node RPC
- **Smart Contracts**: Payment processing contracts
- **Wallet Integration**: Ed25519 keypairs

### Payment Flow

1. **Validation** - Xác thực thông tin thanh toán
2. **Transaction Creation** - Tạo transaction trên Sui
3. **Signing** - Ký transaction với private key
4. **Execution** - Submit transaction lên blockchain
5. **Confirmation** - Chờ confirmation và cập nhật database

### Error Handling

- Network errors
- Insufficient gas fees
- Invalid transactions
- Timeout handling

## 🔒 Security

### Authentication
- JWT tokens với refresh mechanism
- Password hashing với bcrypt
- Rate limiting cho API endpoints

### Encryption
- Private keys được mã hóa trong database
- Sensitive data encryption
- HTTPS enforcement

### Validation
- Input validation với express-validator
- Schema validation cho API requests
- XSS protection

## 📊 Monitoring & Logging

### Logging
- Winston logger với multiple transports
- Error tracking và alerting
- Request/response logging

### Health Checks
```
GET /health
```

### Metrics
- API response times
- Database connection status
- Blockchain connectivity
- Error rates

## 🚦 Error Codes

| Code | Description |
|------|-------------|
| 1001 | Invalid request |
| 1002 | Unauthorized |
| 1003 | Forbidden |
| 2001 | User not found |
| 2002 | Invalid credentials |
| 3001 | Card not found |
| 3002 | Card expired |
| 4001 | Transaction failed |
| 4002 | Insufficient balance |
| 5001 | Blockchain error |

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Integration tests
npm run test:integration
```

## 📱 Development

### Code Style
- ESLint với TypeScript rules
- Prettier cho code formatting
- Husky pre-commit hooks

### Git Workflow
- Feature branches
- Pull request reviews
- Automated testing

## 🚀 Deployment

### Environment Variables
Đảm bảo tất cả biến môi trường được cấu hình đúng trong production.

### Database Migration
```bash
npm run migrate
```

### Process Management
- PM2 cho process management
- Docker containers
- Load balancing

## 📞 Support

- Email: support@nfcpayment.com
- Documentation: [API Docs](./docs)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 📄 License

MIT License - xem file [LICENSE](./LICENSE) để biết chi tiết.