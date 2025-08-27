import { body, param, query } from 'express-validator';

export const merchantValidators = {
  getMerchant: [
    param('merchantId')
      .isMongoId()
      .withMessage('Valid merchant ID is required'),
  ],

  registerMerchant: [
    body('businessName')
      .notEmpty()
      .withMessage('Business name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Business name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('businessType')
      .notEmpty()
      .withMessage('Business type is required'),
    body('businessAddress')
      .notEmpty()
      .withMessage('Business address is required'),
  ],

  updateProfile: [
    body('businessName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Business name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('businessAddress')
      .optional()
      .notEmpty()
      .withMessage('Business address cannot be empty'),
  ],

  updateMerchantProfile: [
    body('businessName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Business name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('businessAddress')
      .optional()
      .notEmpty()
      .withMessage('Business address cannot be empty'),
  ],

  createWebhook: [
    body('url')
      .isURL()
      .withMessage('Valid webhook URL is required'),
    body('events')
      .isArray({ min: 1 })
      .withMessage('At least one event type is required'),
    body('events.*')
      .isIn(['payment.created', 'payment.completed', 'payment.failed', 'refund.created'])
      .withMessage('Invalid event type'),
  ],

  updateWebhook: [
    param('webhookId')
      .isMongoId()
      .withMessage('Valid webhook ID is required'),
    body('url')
      .optional()
      .isURL()
      .withMessage('Valid webhook URL is required'),
    body('events')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one event type is required'),
  ],

  deleteWebhook: [
    param('webhookId')
      .isMongoId()
      .withMessage('Valid webhook ID is required'),
  ],

  createApiKey: [
    body('name')
      .notEmpty()
      .withMessage('API key name is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('API key name must be between 1 and 50 characters'),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
  ],

  deleteApiKey: [
    param('keyId')
      .isMongoId()
      .withMessage('Valid API key ID is required'),
  ],

  refundPayment: [
    body('paymentId')
      .isMongoId()
      .withMessage('Valid payment ID is required'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Refund amount must be greater than 0.01'),
    body('reason')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Reason must not exceed 255 characters'),
  ],

  getMerchantPayments: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
      .withMessage('Invalid payment status'),
  ],

  updateSettings: [
    body('notifications')
      .optional()
      .isObject()
      .withMessage('Notifications must be an object'),
    body('paymentMethods')
      .optional()
      .isArray()
      .withMessage('Payment methods must be an array'),
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'SUI'])
      .withMessage('Invalid currency'),
  ],

  updateMerchantSettings: [
    body('notifications')
      .optional()
      .isObject()
      .withMessage('Notifications must be an object'),
    body('paymentMethods')
      .optional()
      .isArray()
      .withMessage('Payment methods must be an array'),
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'SUI'])
      .withMessage('Invalid currency'),
  ],

  merchantId: [
    param('merchantId')
      .isMongoId()
      .withMessage('Valid merchant ID is required'),
  ],

  updateMerchantStatus: [
    param('merchantId')
      .isMongoId()
      .withMessage('Valid merchant ID is required'),
    body('status')
      .isIn(['active', 'inactive', 'suspended', 'pending'])
      .withMessage('Invalid merchant status'),
  ],

  updateMerchantLimits: [
    param('merchantId')
      .isMongoId()
      .withMessage('Valid merchant ID is required'),
    body('dailyLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Daily limit must be a positive number'),
    body('monthlyLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Monthly limit must be a positive number'),
  ],
};