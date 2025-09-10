import { body, param, query } from 'express-validator';

export const merchantValidators = {
  getMerchant: [
    param('merchantId')
      .matches(/^mch_[a-f0-9]{16}$/)
      .withMessage('Valid merchant ID is required'),
  ],

  registerMerchant: [
    body('merchantName')
      .notEmpty()
      .withMessage('Merchant name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Merchant name must be between 2 and 100 characters'),
    body('businessType')
      .notEmpty()
      .withMessage('Business type is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Business type must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('walletAddress')
      .notEmpty()
      .withMessage('Wallet address is required')
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid Sui wallet address format'),
    body('address.street')
      .notEmpty()
      .withMessage('Street address is required'),
    body('address.city')
      .notEmpty()
      .withMessage('City is required'),
    body('address.state')
      .notEmpty()
      .withMessage('State is required'),
    body('address.country')
      .notEmpty()
      .withMessage('Country is required'),
    body('address.postalCode')
      .notEmpty()
      .withMessage('Postal code is required'),
    body('bankAccount.accountNumber')
      .optional()
      .isLength({ min: 8, max: 20 })
      .withMessage('Account number must be between 8 and 20 characters'),
    body('bankAccount.bankName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Bank name must be between 2 and 100 characters'),
    body('bankAccount.routingNumber')
      .optional()
      .isLength({ min: 9, max: 12 })
      .withMessage('Routing number must be between 9 and 12 characters'),
    body('webhookUrl')
      .optional()
      .isURL()
      .withMessage('Valid webhook URL is required'),
    body('settlementPeriod')
      .optional()
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('Settlement period must be daily, weekly, or monthly'),
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