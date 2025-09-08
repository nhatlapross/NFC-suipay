import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { paymentLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';
import { paymentValidators } from '../validators/payment.validator';

const router = Router();

// Public routes (no auth required for basic validation)
router.post(
  '/validate',
  validate(paymentValidators.validatePayment),
  paymentController.validatePayment
);

// NFC validation endpoint (no auth required for terminals)
router.post(
  '/nfc-validate',
  paymentController.validateNFCPayment
);

// Protected routes
router.use(authenticate);

router.post(
  '/process',
  paymentLimiter,
  validate(paymentValidators.processPayment),
  paymentController.processPayment
);

router.post(
  '/process-async',
  paymentLimiter,
  validate(paymentValidators.processPayment),
  paymentController.processNFCPaymentAsync
);

router.post(
  '/sign',
  validate(paymentValidators.signTransaction),
  paymentController.signTransaction
);

router.post(
  '/complete',
  validate(paymentValidators.completePayment),
  paymentController.completePayment
);

router.get(
  '/transactions',
  paymentController.getTransactionHistory
);

router.get(
  '/transactions/:id',
  paymentController.getTransaction
);

router.post(
  '/transactions/:id/refund',
  authorize('admin', 'merchant'),
  paymentController.refundTransaction
);

router.get(
  '/stats',
  paymentController.getPaymentStats
);

export default router;