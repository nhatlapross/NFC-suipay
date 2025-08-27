# Database Schema Documentation

## 📋 Overview

NFC Payment App sử dụng MongoDB làm database chính để lưu trữ thông tin người dùng, thẻ, giao dịch và merchants.

## 🗄️ Collections

### 1. Users Collection
Lưu trữ thông tin người dùng

```javascript
{
  _id: ObjectId,
  email: String, // unique, lowercase
  password: String, // hashed with bcrypt
  phoneNumber: String, // unique, indexed
  fullName: String,
  walletAddress: String, // Sui wallet address
  encryptedPrivateKey: String, // encrypted private key
  role: String, // enum: ['user', 'merchant', 'admin']
  dailyLimit: Number, // default: 1000000 (VND)
  monthlyLimit: Number, // default: 10000000 (VND)
  status: String, // enum: ['active', 'blocked', 'suspended']
  kycStatus: String, // enum: ['pending', 'verified', 'rejected']
  kycDocuments: [String], // array of document URLs
  twoFactorEnabled: Boolean, // default: false
  twoFactorSecret: String,
  pinHash: String, // hashed PIN for card transactions
  lastLogin: Date,
  loginAttempts: Number, // default: 0
  lockoutUntil: Date, // account lockout timestamp
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date,
  
  // Virtual fields
  isLocked: Boolean // computed from lockoutUntil
}
```

**Indexes:**
```javascript
// Compound indexes
{ email: 1 } // unique
{ phoneNumber: 1 } // unique  
{ walletAddress: 1 } // sparse, unique
{ fullName: 'text', email: 'text' } // text search
```

### 2. Cards Collection
Lưu trữ thông tin thẻ NFC

```javascript
{
  _id: ObjectId,
  cardUuid: String, // unique UUID for NFC card
  userId: ObjectId, // ref to Users
  cardType: String, // enum: ['standard', 'premium', 'corporate']
  cardNumber: String, // unique card number
  isActive: Boolean, // default: true
  isPrimary: Boolean, // default: false
  issueDate: Date, // default: now
  expiryDate: Date, // default: 1 year from now
  lastUsed: Date,
  usageCount: Number, // default: 0
  dailySpent: Number, // default: 0
  monthlySpent: Number, // default: 0
  lastResetDate: Date, // for spending limits reset
  blockedAt: Date,
  blockedReason: String,
  metadata: Object, // flexible data storage
  createdAt: Date,
  updatedAt: Date,
  
  // Virtual fields
  isExpired: Boolean // computed from expiryDate
}
```

**Indexes:**
```javascript
// Compound indexes
{ cardUuid: 1 } // unique
{ cardNumber: 1 } // unique
{ userId: 1, isActive: 1 }
{ expiryDate: 1, isActive: 1 }
```

### 3. Transactions Collection
Lưu trữ thông tin giao dịch

```javascript
{
  _id: ObjectId,
  transactionId: String, // unique transaction ID
  userId: ObjectId, // ref to Users
  cardId: ObjectId, // ref to Cards
  merchantId: String, // merchant identifier
  amount: Number, // transaction amount in VND
  originalAmount: Number, // original amount before fees
  currency: String, // default: 'VND'
  exchangeRate: Number, // if currency conversion
  status: String, // enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
  type: String, // enum: ['payment', 'refund', 'topup']
  
  // Blockchain data
  txHash: String, // Sui transaction hash
  blockNumber: Number,
  gasUsed: Number,
  gasFee: Number,
  
  // Payment method
  paymentMethod: String, // enum: ['nfc', 'qr', 'online']
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    location: Object
  },
  
  // Merchant info
  merchantInfo: {
    name: String,
    address: String,
    category: String
  },
  
  // Error handling
  errorCode: String,
  errorMessage: String,
  retryCount: Number, // default: 0
  
  // Timing
  initiatedAt: Date,
  processingAt: Date,
  completedAt: Date,
  refundedAt: Date,
  
  // Audit trail
  notes: String,
  adminNotes: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Compound indexes
{ transactionId: 1 } // unique
{ txHash: 1 } // unique, sparse
{ userId: 1, createdAt: -1 }
{ merchantId: 1, createdAt: -1 }
{ cardId: 1, createdAt: -1 }
{ status: 1, createdAt: -1 }
{ createdAt: -1 } // for time-based queries
```

### 4. Merchants Collection
Lưu trữ thông tin merchant

```javascript
{
  _id: ObjectId,
  merchantId: String, // unique merchant identifier
  userId: ObjectId, // ref to Users (merchant owner)
  businessName: String,
  businessType: String, // enum: ['retail', 'restaurant', 'service', 'online']
  contactEmail: String,
  contactPhone: String,
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Blockchain
  walletAddress: String, // Sui wallet for receiving payments
  
  // API Integration
  apiKey: String, // for API access
  webhookUrl: String,
  webhookSecret: String,
  
  // Business settings
  isActive: Boolean, // default: false (needs approval)
  isVerified: Boolean, // default: false
  
  // Limits and fees
  dailyLimit: Number,
  monthlyLimit: Number,
  transactionFee: Number, // percentage
  
  // Statistics
  totalTransactions: Number, // default: 0
  totalVolume: Number, // default: 0
  averageTransaction: Number, // default: 0
  
  // Verification documents
  verificationDocuments: [String],
  verificationStatus: String, // enum: ['pending', 'approved', 'rejected']
  verifiedAt: Date,
  
  // Timing
  lastTransactionAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Compound indexes
{ merchantId: 1 } // unique
{ userId: 1 }
{ walletAddress: 1 }
{ businessName: 'text' } // text search
{ isActive: 1, isVerified: 1 }
```

### 5. Sessions Collection
Lưu trữ phiên đăng nhập

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref to Users
  sessionToken: String, // unique session identifier
  refreshToken: String,
  
  // Device info
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    deviceId: String,
    platform: String, // web, mobile, etc.
  },
  
  // Location
  location: {
    country: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Status
  isActive: Boolean, // default: true
  
  // Timing
  lastActivity: Date,
  expiresAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Compound indexes
{ sessionToken: 1 } // unique
{ userId: 1, isActive: 1 }
{ expiresAt: 1 } // for TTL cleanup
```

### 6. Notifications Collection
Lưu trữ thông báo

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref to Users
  type: String, // enum: ['payment', 'security', 'system', 'promotion']
  title: String,
  message: String,
  
  // Related data
  relatedId: ObjectId, // transaction ID, etc.
  relatedType: String, // 'transaction', 'card', etc.
  
  // Status
  isRead: Boolean, // default: false
  readAt: Date,
  
  // Delivery
  channels: [String], // ['email', 'sms', 'push']
  sentAt: Date,
  deliveredAt: Date,
  
  // Priority
  priority: String, // enum: ['low', 'normal', 'high', 'urgent']
  
  // Expiry
  expiresAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Compound indexes
{ userId: 1, createdAt: -1 }
{ userId: 1, isRead: 1 }
{ expiresAt: 1 } // for TTL cleanup
```

### 7. AuditLogs Collection
Lưu trữ log audit

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref to Users
  action: String, // action performed
  resource: String, // resource affected
  resourceId: String, // ID of affected resource
  
  // Request info
  method: String, // HTTP method
  endpoint: String, // API endpoint
  ipAddress: String,
  userAgent: String,
  
  // Data
  oldData: Object, // data before change
  newData: Object, // data after change
  
  // Result
  success: Boolean,
  errorMessage: String,
  
  // Timing
  timestamp: Date,
  processingTime: Number, // milliseconds
  
  createdAt: Date
}
```

**Indexes:**
```javascript
// Compound indexes
{ userId: 1, timestamp: -1 }
{ action: 1, timestamp: -1 }
{ resource: 1, timestamp: -1 }
{ timestamp: -1 } // for time-based queries
```

### 8. SystemSettings Collection
Cấu hình hệ thống

```javascript
{
  _id: ObjectId,
  key: String, // unique setting key
  value: Mixed, // setting value (string, number, object, etc.)
  description: String,
  category: String, // group settings
  
  // Access control
  isPublic: Boolean, // default: false
  requiredRole: String, // minimum role to modify
  
  // Validation
  dataType: String, // 'string', 'number', 'boolean', 'object'
  validation: Object, // validation rules
  
  // Meta
  updatedBy: ObjectId, // ref to Users
  updatedAt: Date,
  createdAt: Date
}
```

**Indexes:**
```javascript
// Compound indexes
{ key: 1 } // unique
{ category: 1 }
```

## 🔗 Relationships

### User → Cards (1:many)
```javascript
// Get user's cards
db.cards.find({ userId: ObjectId("...") });

// Populate user in card document
{
  $lookup: {
    from: "users",
    localField: "userId",
    foreignField: "_id",
    as: "user"
  }
}
```

### User → Transactions (1:many)
```javascript
// Get user's transactions
db.transactions.find({ userId: ObjectId("...") });
```

### Card → Transactions (1:many)
```javascript
// Get card's transactions
db.transactions.find({ cardId: ObjectId("...") });
```

### Merchant → Transactions (1:many)
```javascript
// Get merchant's transactions
db.transactions.find({ merchantId: "MERCHANT_001" });
```

## 🔍 Common Queries

### User Management
```javascript
// Find users by email
db.users.find({ email: "user@example.com" });

// Find active users
db.users.find({ status: "active" });

// Search users by name or email
db.users.find({ 
  $text: { $search: "John Doe" } 
});

// Find locked accounts
db.users.find({ 
  lockoutUntil: { $gt: new Date() } 
});
```

### Card Management
```javascript
// Find user's primary card
db.cards.findOne({ 
  userId: ObjectId("..."), 
  isPrimary: true 
});

// Find expired cards
db.cards.find({ 
  expiryDate: { $lt: new Date() } 
});

// Find cards by usage
db.cards.find({ 
  usageCount: { $gt: 10 } 
}).sort({ lastUsed: -1 });
```

### Transaction Analytics
```javascript
// Daily transaction volume
db.transactions.aggregate([
  {
    $match: { 
      status: "completed",
      createdAt: { 
        $gte: new Date(new Date().setHours(0,0,0,0)) 
      }
    }
  },
  {
    $group: {
      _id: null,
      totalAmount: { $sum: "$amount" },
      totalCount: { $sum: 1 },
      avgAmount: { $avg: "$amount" }
    }
  }
]);

// Monthly merchant stats
db.transactions.aggregate([
  {
    $match: {
      status: "completed",
      createdAt: { 
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    }
  },
  {
    $group: {
      _id: "$merchantId",
      totalAmount: { $sum: "$amount" },
      totalTransactions: { $sum: 1 }
    }
  },
  { $sort: { totalAmount: -1 } }
]);

// User spending patterns
db.transactions.aggregate([
  {
    $match: { 
      userId: ObjectId("..."),
      status: "completed" 
    }
  },
  {
    $group: {
      _id: { 
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      },
      totalSpent: { $sum: "$amount" },
      transactionCount: { $sum: 1 }
    }
  },
  { $sort: { "_id.year": -1, "_id.month": -1 } }
]);
```

### Performance Queries
```javascript
// Find slow transactions
db.transactions.find({ 
  processingTime: { $gt: 5000 } // > 5 seconds
}).sort({ processingTime: -1 });

// Find failed transactions to retry
db.transactions.find({ 
  status: "failed",
  retryCount: { $lt: 3 },
  createdAt: { $gt: new Date(Date.now() - 24*60*60*1000) }
});
```

## 🗂️ Data Migration Scripts

### Initial Setup
```javascript
// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phoneNumber: 1 }, { unique: true });
db.cards.createIndex({ cardUuid: 1 }, { unique: true });
db.transactions.createIndex({ transactionId: 1 }, { unique: true });
db.merchants.createIndex({ merchantId: 1 }, { unique: true });

// Create text indexes
db.users.createIndex({ 
  fullName: "text", 
  email: "text" 
});
db.merchants.createIndex({ 
  businessName: "text" 
});
```

### Sample Data
```javascript
// Insert sample admin user
db.users.insertOne({
  email: "admin@nfcpayment.com",
  password: "$2b$10$...", // hashed password
  phoneNumber: "+84901234567",
  fullName: "System Admin",
  role: "admin",
  status: "active",
  kycStatus: "verified",
  createdAt: new Date(),
  updatedAt: new Date()
});

// Insert sample merchant
db.merchants.insertOne({
  merchantId: "MERCHANT_001",
  businessName: "Coffee Shop ABC",
  businessType: "restaurant",
  contactEmail: "admin@coffeeshop.com",
  walletAddress: "0x...",
  isActive: true,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## 🧹 Maintenance Tasks

### Data Cleanup
```javascript
// Remove expired sessions
db.sessions.deleteMany({ 
  expiresAt: { $lt: new Date() } 
});

// Remove old notifications
db.notifications.deleteMany({ 
  expiresAt: { $lt: new Date() } 
});

// Archive old transactions (older than 2 years)
db.transactions.updateMany(
  { 
    createdAt: { 
      $lt: new Date(Date.now() - 2*365*24*60*60*1000) 
    } 
  },
  { $set: { archived: true } }
);
```

### Analytics
```javascript
// Daily stats aggregation
db.transactions.aggregate([
  {
    $match: {
      createdAt: { 
        $gte: new Date(new Date().setHours(0,0,0,0)) 
      }
    }
  },
  {
    $group: {
      _id: {
        status: "$status",
        merchant: "$merchantId"
      },
      count: { $sum: 1 },
      volume: { $sum: "$amount" }
    }
  }
]);
```

## 🔒 Security Considerations

### Sensitive Data
- Passwords: Hashed với bcrypt (cost factor 10+)
- Private Keys: Encrypted với AES-256
- PIN: Hashed với bcrypt
- PII Data: Consider encryption for sensitive fields

### Access Control
- Use connection string với authentication
- Limit database user permissions
- Enable audit logging
- Use connection pooling

### Backup Strategy
- Daily automated backups
- Point-in-time recovery
- Test restore procedures
- Encrypt backup files

### Monitoring
- Monitor slow queries
- Track connection pool usage
- Set up alerts for errors
- Monitor disk space

## 📊 Performance Optimization

### Indexing Strategy
- Create compound indexes for common query patterns
- Use sparse indexes for optional fields
- Regular index usage analysis
- Remove unused indexes

### Query Optimization
- Use aggregation pipeline efficiently
- Limit result sets with pagination
- Use projections to reduce data transfer
- Avoid $lookup when possible

### Scaling Considerations
- Implement read replicas
- Consider sharding for large collections
- Use appropriate write concerns
- Monitor replication lag