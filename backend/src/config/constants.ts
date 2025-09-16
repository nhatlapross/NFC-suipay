export const CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Transaction
  MIN_TRANSACTION_AMOUNT: 0.01,
  MAX_TRANSACTION_AMOUNT: 10000,
  DEFAULT_GAS_BUDGET: 20_000_000, // 0.02 SUI

  // Custom Coin Configuration
  MY_COIN: {
    PACKAGE_ID: '0x8f3c2d177fa5e156247d4de83d73fee684e5633d9f291c31a624333325f04398',
    MODULE: 'my_coin',
    STRUCT: 'MY_COIN',
    TYPE: '0x8f3c2d177fa5e156247d4de83d73fee684e5633d9f291c31a624333325f04398::my_coin::MY_COIN',
    DECIMALS: 5, // Standard Sui token decimals
  },

  // Limits
  DAILY_TRANSACTION_LIMIT: 100,
  DAILY_AMOUNT_LIMIT: 5000,
  MONTHLY_AMOUNT_LIMIT: 50000,

  // Security
  OTP_EXPIRY_MINUTES: 5,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,

  // Cache TTL (seconds)
  CACHE_TTL: {
    USER_PROFILE: 300,    // 5 minutes
    WALLET_BALANCE: 10,   // 10 seconds
    TRANSACTION: 3600,    // 1 hour
    MERCHANT: 1800,       // 30 minutes
  },

  // File upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],

  // WebSocket
  WS_HEARTBEAT_INTERVAL: 30000, // 30 seconds
  WS_CONNECTION_TIMEOUT: 60000,  // 60 seconds
};

export const ERROR_CODES = {
  // Authentication
  AUTH_FAILED: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  INVALID_TOKEN: 'AUTH_003',
  UNAUTHORIZED: 'AUTH_004',

  // Payment
  INSUFFICIENT_BALANCE: 'PAY_001',
  INVALID_CARD: 'PAY_002',
  LIMIT_EXCEEDED: 'PAY_003',
  TRANSACTION_FAILED: 'PAY_004',

  // Validation
  VALIDATION_ERROR: 'VAL_001',
  INVALID_INPUT: 'VAL_002',

  // System
  INTERNAL_ERROR: 'SYS_001',
  SERVICE_UNAVAILABLE: 'SYS_002',
  DATABASE_ERROR: 'SYS_003',
  BLOCKCHAIN_ERROR: "SYS_004",

  // Session & State
  SESSION_EXPIRED: "SES_001",
  INVALID_STATE: "SES_002",
  NOT_FOUND: "SES_003",
  DUPLICATE_ENTRY: "SES_004",
};

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const CARD_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
};

export const USER_ROLES = {
  USER: 'user',
  MERCHANT: 'merchant',
  ADMIN: 'admin',
};