export declare const CONSTANTS: {
    DEFAULT_PAGE_SIZE: number;
    MAX_PAGE_SIZE: number;
    MIN_TRANSACTION_AMOUNT: number;
    MAX_TRANSACTION_AMOUNT: number;
    DEFAULT_GAS_BUDGET: number;
    DAILY_TRANSACTION_LIMIT: number;
    DAILY_AMOUNT_LIMIT: number;
    MONTHLY_AMOUNT_LIMIT: number;
    OTP_EXPIRY_MINUTES: number;
    MAX_LOGIN_ATTEMPTS: number;
    LOCKOUT_DURATION_MINUTES: number;
    CACHE_TTL: {
        USER_PROFILE: number;
        WALLET_BALANCE: number;
        TRANSACTION: number;
        MERCHANT: number;
    };
    MAX_FILE_SIZE: number;
    ALLOWED_FILE_TYPES: string[];
    WS_HEARTBEAT_INTERVAL: number;
    WS_CONNECTION_TIMEOUT: number;
};
export declare const ERROR_CODES: {
    AUTH_FAILED: string;
    TOKEN_EXPIRED: string;
    INVALID_TOKEN: string;
    UNAUTHORIZED: string;
    INSUFFICIENT_BALANCE: string;
    INVALID_CARD: string;
    LIMIT_EXCEEDED: string;
    TRANSACTION_FAILED: string;
    VALIDATION_ERROR: string;
    INVALID_INPUT: string;
    INTERNAL_ERROR: string;
    SERVICE_UNAVAILABLE: string;
    DATABASE_ERROR: string;
    BLOCKCHAIN_ERROR: string;
};
export declare const TRANSACTION_STATUS: {
    PENDING: string;
    PROCESSING: string;
    COMPLETED: string;
    FAILED: string;
    CANCELLED: string;
};
export declare const CARD_STATUS: {
    ACTIVE: string;
    BLOCKED: string;
    EXPIRED: string;
    SUSPENDED: string;
};
export declare const USER_ROLES: {
    USER: string;
    MERCHANT: string;
    ADMIN: string;
};
//# sourceMappingURL=constants.d.ts.map