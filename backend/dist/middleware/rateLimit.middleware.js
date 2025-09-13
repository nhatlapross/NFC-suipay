"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.terminalRegisterLimiter = exports.posAuthLimiter = exports.posLimiter = exports.otpLimiter = exports.authLimiter = exports.paymentLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// General API rate limiter
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
// Payment-specific rate limiter (using memory store for now)
exports.paymentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 payments per minute
    message: 'Too many payment requests, please try again later',
    skipSuccessfulRequests: false,
});
// Auth rate limiter (using memory store for now)
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true,
});
// OTP rate limiter
exports.otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 OTP requests per 5 minutes
    message: 'Too many OTP requests, please try again later',
});
// POS-specific rate limiter for terminal operations
exports.posLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per terminal
    message: {
        success: false,
        error: 'Too many POS requests from this terminal, please wait',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use terminal ID + IP for more granular rate limiting
        const terminalId = req.body?.terminalId || req.params?.terminalId || 'unknown';
        const ip = req.ip;
        return `pos_${terminalId}_${ip}`;
    },
    skip: (req) => {
        // Skip rate limiting for session checks (GET requests)
        return req.method === 'GET' && req.path.includes('/session/');
    },
});
// Aggressive rate limiter for POS authentication attempts
exports.posAuthLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 auth attempts per 5 minutes per session
    message: {
        success: false,
        error: 'Too many authentication attempts, session blocked temporarily',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: 300,
    },
    keyGenerator: (req) => {
        // Use session ID for rate limiting auth attempts
        const sessionId = req.body?.sessionId || req.params?.sessionId;
        return `pos_auth_${sessionId}`;
    },
    handler: (req, res) => {
        // Log suspicious activity
        const sessionId = req.body?.sessionId || req.params?.sessionId;
        console.warn(`🚨 POS auth rate limit exceeded for session: ${sessionId}`);
        res.status(429).json({
            success: false,
            error: 'Too many authentication attempts, session blocked temporarily',
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            retryAfter: 300,
        });
    },
});
// Terminal registration rate limiter
exports.terminalRegisterLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 terminal registrations per hour per merchant
    message: {
        success: false,
        error: 'Too many terminal registration attempts, please wait',
        code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
        retryAfter: 3600,
    },
    keyGenerator: (req) => {
        // Use merchant ID for rate limiting
        const merchantId = req.merchant?.merchantId || req.ip;
        return `terminal_register_${merchantId}`;
    },
});
//# sourceMappingURL=rateLimit.middleware.js.map