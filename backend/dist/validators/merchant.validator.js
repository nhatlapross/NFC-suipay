"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantValidators = void 0;
const express_validator_1 = require("express-validator");
exports.merchantValidators = {
    getMerchant: [
        (0, express_validator_1.param)('merchantId')
            .matches(/^mch_[a-f0-9]{16}$/)
            .withMessage('Valid merchant ID is required'),
    ],
    registerMerchant: [
        (0, express_validator_1.body)('merchantName')
            .notEmpty()
            .withMessage('Merchant name is required')
            .isLength({ min: 2, max: 100 })
            .withMessage('Merchant name must be between 2 and 100 characters'),
        (0, express_validator_1.body)('businessType')
            .notEmpty()
            .withMessage('Business type is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('Business type must be between 2 and 50 characters'),
        (0, express_validator_1.body)('email')
            .isEmail()
            .withMessage('Valid email is required'),
        (0, express_validator_1.body)('phoneNumber')
            .notEmpty()
            .withMessage('Phone number is required')
            .isMobilePhone('any')
            .withMessage('Valid phone number is required'),
        (0, express_validator_1.body)('walletAddress')
            .notEmpty()
            .withMessage('Wallet address is required')
            .matches(/^0x[a-fA-F0-9]{64}$/)
            .withMessage('Invalid Sui wallet address format'),
        (0, express_validator_1.body)('address.street')
            .notEmpty()
            .withMessage('Street address is required'),
        (0, express_validator_1.body)('address.city')
            .notEmpty()
            .withMessage('City is required'),
        (0, express_validator_1.body)('address.state')
            .notEmpty()
            .withMessage('State is required'),
        (0, express_validator_1.body)('address.country')
            .notEmpty()
            .withMessage('Country is required'),
        (0, express_validator_1.body)('address.postalCode')
            .notEmpty()
            .withMessage('Postal code is required'),
        (0, express_validator_1.body)('bankAccount.accountNumber')
            .optional()
            .isLength({ min: 8, max: 20 })
            .withMessage('Account number must be between 8 and 20 characters'),
        (0, express_validator_1.body)('bankAccount.bankName')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Bank name must be between 2 and 100 characters'),
        (0, express_validator_1.body)('bankAccount.routingNumber')
            .optional()
            .isLength({ min: 9, max: 12 })
            .withMessage('Routing number must be between 9 and 12 characters'),
        (0, express_validator_1.body)('webhookUrl')
            .optional()
            .isURL()
            .withMessage('Valid webhook URL is required'),
        (0, express_validator_1.body)('settlementPeriod')
            .optional()
            .isIn(['daily', 'weekly', 'monthly'])
            .withMessage('Settlement period must be daily, weekly, or monthly'),
    ],
    updateProfile: [
        (0, express_validator_1.body)('businessName')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Business name must be between 2 and 100 characters'),
        (0, express_validator_1.body)('phone')
            .optional()
            .isMobilePhone('any')
            .withMessage('Valid phone number is required'),
        (0, express_validator_1.body)('businessAddress')
            .optional()
            .notEmpty()
            .withMessage('Business address cannot be empty'),
    ],
    updateMerchantProfile: [
        (0, express_validator_1.body)('businessName')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Business name must be between 2 and 100 characters'),
        (0, express_validator_1.body)('phone')
            .optional()
            .isMobilePhone('any')
            .withMessage('Valid phone number is required'),
        (0, express_validator_1.body)('businessAddress')
            .optional()
            .notEmpty()
            .withMessage('Business address cannot be empty'),
    ],
    createWebhook: [
        (0, express_validator_1.body)('url')
            .isURL()
            .withMessage('Valid webhook URL is required'),
        (0, express_validator_1.body)('events')
            .isArray({ min: 1 })
            .withMessage('At least one event type is required'),
        (0, express_validator_1.body)('events.*')
            .isIn(['payment.created', 'payment.completed', 'payment.failed', 'refund.created'])
            .withMessage('Invalid event type'),
    ],
    updateWebhook: [
        (0, express_validator_1.param)('webhookId')
            .isMongoId()
            .withMessage('Valid webhook ID is required'),
        (0, express_validator_1.body)('url')
            .optional()
            .isURL()
            .withMessage('Valid webhook URL is required'),
        (0, express_validator_1.body)('events')
            .optional()
            .isArray({ min: 1 })
            .withMessage('At least one event type is required'),
    ],
    deleteWebhook: [
        (0, express_validator_1.param)('webhookId')
            .isMongoId()
            .withMessage('Valid webhook ID is required'),
    ],
    createApiKey: [
        (0, express_validator_1.body)('name')
            .notEmpty()
            .withMessage('API key name is required')
            .isLength({ min: 1, max: 50 })
            .withMessage('API key name must be between 1 and 50 characters'),
        (0, express_validator_1.body)('permissions')
            .optional()
            .isArray()
            .withMessage('Permissions must be an array'),
    ],
    deleteApiKey: [
        (0, express_validator_1.param)('keyId')
            .isMongoId()
            .withMessage('Valid API key ID is required'),
    ],
    refundPayment: [
        (0, express_validator_1.body)('paymentId')
            .isMongoId()
            .withMessage('Valid payment ID is required'),
        (0, express_validator_1.body)('amount')
            .optional()
            .isFloat({ min: 0.01 })
            .withMessage('Refund amount must be greater than 0.01'),
        (0, express_validator_1.body)('reason')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Reason must not exceed 255 characters'),
    ],
    getMerchantPayments: [
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        (0, express_validator_1.query)('status')
            .optional()
            .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
            .withMessage('Invalid payment status'),
    ],
    updateSettings: [
        (0, express_validator_1.body)('notifications')
            .optional()
            .isObject()
            .withMessage('Notifications must be an object'),
        (0, express_validator_1.body)('paymentMethods')
            .optional()
            .isArray()
            .withMessage('Payment methods must be an array'),
        (0, express_validator_1.body)('currency')
            .optional()
            .isIn(['USD', 'EUR', 'GBP', 'SUI'])
            .withMessage('Invalid currency'),
    ],
    updateMerchantSettings: [
        (0, express_validator_1.body)('notifications')
            .optional()
            .isObject()
            .withMessage('Notifications must be an object'),
        (0, express_validator_1.body)('paymentMethods')
            .optional()
            .isArray()
            .withMessage('Payment methods must be an array'),
        (0, express_validator_1.body)('currency')
            .optional()
            .isIn(['USD', 'EUR', 'GBP', 'SUI'])
            .withMessage('Invalid currency'),
    ],
    merchantId: [
        (0, express_validator_1.param)('merchantId')
            .isMongoId()
            .withMessage('Valid merchant ID is required'),
    ],
    updateMerchantStatus: [
        (0, express_validator_1.param)('merchantId')
            .isMongoId()
            .withMessage('Valid merchant ID is required'),
        (0, express_validator_1.body)('status')
            .isIn(['active', 'inactive', 'suspended', 'pending'])
            .withMessage('Invalid merchant status'),
    ],
    updateMerchantLimits: [
        (0, express_validator_1.param)('merchantId')
            .isMongoId()
            .withMessage('Valid merchant ID is required'),
        (0, express_validator_1.body)('dailyLimit')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Daily limit must be a positive number'),
        (0, express_validator_1.body)('monthlyLimit')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Monthly limit must be a positive number'),
    ],
    createPaymentRequest: [
        (0, express_validator_1.body)('amount')
            .isFloat({ min: 0.01 })
            .withMessage('Amount must be at least 0.01'),
        (0, express_validator_1.body)('description')
            .optional()
            .isLength({ max: 200 })
            .withMessage('Description must not exceed 200 characters'),
    ],
};
//# sourceMappingURL=merchant.validator.js.map