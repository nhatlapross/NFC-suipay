"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_ROLES = exports.CARD_STATUS = exports.TRANSACTION_STATUS = exports.ERROR_CODES = exports.CONSTANTS = void 0;
exports.CONSTANTS = {
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    // Transaction
    MIN_TRANSACTION_AMOUNT: 0.01,
    MAX_TRANSACTION_AMOUNT: 10000,
    DEFAULT_GAS_BUDGET: 20_000_000, // 0.02 SUI
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
        USER_PROFILE: 300, // 5 minutes
        WALLET_BALANCE: 10, // 10 seconds
        TRANSACTION: 3600, // 1 hour
        MERCHANT: 1800, // 30 minutes
    },
    // File upload
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    // WebSocket
    WS_HEARTBEAT_INTERVAL: 30000, // 30 seconds
    WS_CONNECTION_TIMEOUT: 60000, // 60 seconds
};
exports.ERROR_CODES = {
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
    BLOCKCHAIN_ERROR: 'SYS_004',
};
exports.TRANSACTION_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
};
exports.CARD_STATUS = {
    ACTIVE: 'active',
    BLOCKED: 'blocked',
    EXPIRED: 'expired',
    SUSPENDED: 'suspended',
};
exports.USER_ROLES = {
    USER: 'user',
    MERCHANT: 'merchant',
    ADMIN: 'admin',
};
//# sourceMappingURL=constants.js.map