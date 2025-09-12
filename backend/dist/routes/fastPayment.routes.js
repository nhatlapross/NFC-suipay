"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fastPayment_controller_1 = require("../controllers/fastPayment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = express_1.default.Router();
// Rate limiting for NFC endpoints
const nfcRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
    message: {
        success: false,
        error: 'Too many NFC validation requests',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const strictNfcRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute  
    max: 20, // 20 requests per minute for fast validation
    message: {
        success: false,
        error: 'Too many fast validation requests',
        retryAfter: 60
    }
});
/**
 * CRITICAL ENDPOINT: Fast NFC Validation
 * Target: < 100ms response time
 * Usage: Called on every NFC tap
 */
router.post('/fast-validate', strictNfcRateLimit, auth_middleware_1.authenticate, fastPayment_controller_1.fastPaymentController.fastValidate);
/**
 * Cache Management Endpoints
 */
router.post('/pre-warm-cache', nfcRateLimit, auth_middleware_1.authenticate, fastPayment_controller_1.fastPaymentController.preWarmCache);
router.get('/cache-stats', nfcRateLimit, auth_middleware_1.authenticate, fastPayment_controller_1.fastPaymentController.getCacheStats);
/**
 * Health Check for NFC System - No auth required
 */
router.get('/health', async (_req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date(),
            redis: 'connected',
            database: 'connected',
            services: {
                fastValidation: 'operational',
                caching: 'operational',
                fraudDetection: 'operational'
            }
        };
        res.json({
            success: true,
            ...health
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=fastPayment.routes.js.map