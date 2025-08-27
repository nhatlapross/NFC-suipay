import { Router } from 'express';
import { merchantController } from '../controllers/merchant.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { merchantValidators } from '../validators/merchant.validator';

const router = Router();

// Public routes
router.get(
  '/public/:merchantId',
  validate(merchantValidators.getMerchant),
  merchantController.getPublicMerchantInfo
);

// Authentication required for all other routes
router.use(authenticate);

// Merchant management
router.post(
  '/register',
  validate(merchantValidators.registerMerchant),
  merchantController.registerMerchant
);

router.get(
  '/profile',
  authorize('merchant', 'admin'),
  merchantController.getMerchantProfile
);

router.put(
  '/profile',
  authorize('merchant', 'admin'),
  validate(merchantValidators.updateProfile),
  merchantController.updateMerchantProfile
);

// Merchant payments
router.get(
  '/payments',
  authorize('merchant', 'admin'),
  merchantController.getMerchantPayments
);

router.get(
  '/payments/stats',
  authorize('merchant', 'admin'),
  merchantController.getMerchantPaymentStats
);

router.post(
  '/payments/refund/:paymentId',
  authorize('merchant', 'admin'),
  validate(merchantValidators.refundPayment),
  merchantController.refundPayment
);

// Merchant settings
router.get(
  '/settings',
  authorize('merchant', 'admin'),
  merchantController.getMerchantSettings
);

router.put(
  '/settings',
  authorize('merchant', 'admin'),
  validate(merchantValidators.updateSettings),
  merchantController.updateMerchantSettings
);

// Webhook management
router.get(
  '/webhooks',
  authorize('merchant', 'admin'),
  merchantController.getWebhooks
);

router.post(
  '/webhooks',
  authorize('merchant', 'admin'),
  validate(merchantValidators.createWebhook),
  merchantController.createWebhook
);

router.put(
  '/webhooks/:webhookId',
  authorize('merchant', 'admin'),
  validate(merchantValidators.updateWebhook),
  merchantController.updateWebhook
);

router.delete(
  '/webhooks/:webhookId',
  authorize('merchant', 'admin'),
  validate(merchantValidators.deleteWebhook),
  merchantController.deleteWebhook
);

// API Keys management
router.get(
  '/api-keys',
  authorize('merchant', 'admin'),
  merchantController.getApiKeys
);

router.post(
  '/api-keys',
  authorize('merchant', 'admin'),
  validate(merchantValidators.createApiKey),
  merchantController.createApiKey
);

router.delete(
  '/api-keys/:keyId',
  authorize('merchant', 'admin'),
  validate(merchantValidators.deleteApiKey),
  merchantController.deleteApiKey
);

// Admin routes
router.get(
  '/admin/all',
  authorize('admin'),
  merchantController.getAllMerchants
);

router.put(
  '/admin/:merchantId/status',
  authorize('admin'),
  validate(merchantValidators.updateMerchantStatus),
  merchantController.updateMerchantStatus
);

router.put(
  '/admin/:merchantId/limits',
  authorize('admin'),
  validate(merchantValidators.updateMerchantLimits),
  merchantController.updateMerchantLimits
);

export default router;