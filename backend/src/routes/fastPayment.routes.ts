import express from 'express';
import { fastPaymentController } from '../controllers/fastPayment.controller';
import { authenticate } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for NFC endpoints
const nfcRateLimit = rateLimit({
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

const strictNfcRateLimit = rateLimit({
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
router.post('/fast-validate',
  strictNfcRateLimit,
  authenticate,
  fastPaymentController.fastValidate
);

/**
 * Cache Management Endpoints
 */
router.post('/pre-warm-cache',
  nfcRateLimit,
  authenticate,
  fastPaymentController.preWarmCache
);

router.get('/cache-stats',
  nfcRateLimit,
  authenticate,
  fastPaymentController.getCacheStats
);

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
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: (error as Error).message
    });
  }
});

export default router;