import rateLimit from 'express-rate-limit';

// General API rate limiter
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment-specific rate limiter (using memory store for now)
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 payments per minute
  message: 'Too many payment requests, please try again later',
  skipSuccessfulRequests: false,
});

// Auth rate limiter (using memory store for now)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
});

// OTP rate limiter
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per 5 minutes
  message: 'Too many OTP requests, please try again later',
});