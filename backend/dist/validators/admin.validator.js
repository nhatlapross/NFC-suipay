"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminValidators = void 0;
const express_validator_1 = require("express-validator");
exports.adminValidators = {
    createAdmin: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .withMessage('Valid email is required'),
        (0, express_validator_1.body)('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long'),
        (0, express_validator_1.body)('firstName')
            .notEmpty()
            .withMessage('First name is required')
            .isLength({ min: 1, max: 50 })
            .withMessage('First name must be between 1 and 50 characters'),
        (0, express_validator_1.body)('lastName')
            .notEmpty()
            .withMessage('Last name is required')
            .isLength({ min: 1, max: 50 })
            .withMessage('Last name must be between 1 and 50 characters'),
        (0, express_validator_1.body)('role')
            .isIn(['admin', 'super_admin', 'moderator'])
            .withMessage('Invalid admin role'),
        (0, express_validator_1.body)('permissions')
            .optional()
            .isArray()
            .withMessage('Permissions must be an array'),
    ],
    updateAdmin: [
        (0, express_validator_1.param)('adminId')
            .isMongoId()
            .withMessage('Valid admin ID is required'),
        (0, express_validator_1.body)('firstName')
            .optional()
            .isLength({ min: 1, max: 50 })
            .withMessage('First name must be between 1 and 50 characters'),
        (0, express_validator_1.body)('lastName')
            .optional()
            .isLength({ min: 1, max: 50 })
            .withMessage('Last name must be between 1 and 50 characters'),
        (0, express_validator_1.body)('role')
            .optional()
            .isIn(['admin', 'super_admin', 'moderator'])
            .withMessage('Invalid admin role'),
        (0, express_validator_1.body)('permissions')
            .optional()
            .isArray()
            .withMessage('Permissions must be an array'),
    ],
    adminId: [
        (0, express_validator_1.param)('adminId')
            .isMongoId()
            .withMessage('Valid admin ID is required'),
    ],
    updateAdminStatus: [
        (0, express_validator_1.param)('adminId')
            .isMongoId()
            .withMessage('Valid admin ID is required'),
        (0, express_validator_1.body)('status')
            .isIn(['active', 'inactive', 'suspended'])
            .withMessage('Invalid admin status'),
        (0, express_validator_1.body)('reason')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Reason must not exceed 255 characters'),
    ],
    getSystemStats: [
        (0, express_validator_1.query)('period')
            .optional()
            .isIn(['day', 'week', 'month', 'year'])
            .withMessage('Invalid period'),
        (0, express_validator_1.query)('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date must be in ISO format'),
        (0, express_validator_1.query)('endDate')
            .optional()
            .isISO8601()
            .withMessage('End date must be in ISO format'),
    ],
    updateSystemSettings: [
        (0, express_validator_1.body)('maintenanceMode')
            .optional()
            .isBoolean()
            .withMessage('Maintenance mode must be boolean'),
        (0, express_validator_1.body)('registrationEnabled')
            .optional()
            .isBoolean()
            .withMessage('Registration enabled must be boolean'),
        (0, express_validator_1.body)('defaultLimits')
            .optional()
            .isObject()
            .withMessage('Default limits must be an object'),
        (0, express_validator_1.body)('defaultLimits.daily')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Daily limit must be a positive number'),
        (0, express_validator_1.body)('defaultLimits.monthly')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Monthly limit must be a positive number'),
    ],
    createAnnouncement: [
        (0, express_validator_1.body)('title')
            .notEmpty()
            .withMessage('Announcement title is required')
            .isLength({ min: 1, max: 100 })
            .withMessage('Title must be between 1 and 100 characters'),
        (0, express_validator_1.body)('message')
            .notEmpty()
            .withMessage('Announcement message is required')
            .isLength({ min: 1, max: 1000 })
            .withMessage('Message must be between 1 and 1000 characters'),
        (0, express_validator_1.body)('type')
            .isIn(['info', 'warning', 'error', 'success'])
            .withMessage('Invalid announcement type'),
        (0, express_validator_1.body)('targetAudience')
            .isIn(['all', 'users', 'merchants', 'admins'])
            .withMessage('Invalid target audience'),
        (0, express_validator_1.body)('expiresAt')
            .optional()
            .isISO8601()
            .withMessage('Expiration date must be in ISO format'),
    ],
    updateAnnouncement: [
        (0, express_validator_1.param)('announcementId')
            .isMongoId()
            .withMessage('Valid announcement ID is required'),
        (0, express_validator_1.body)('title')
            .optional()
            .isLength({ min: 1, max: 100 })
            .withMessage('Title must be between 1 and 100 characters'),
        (0, express_validator_1.body)('message')
            .optional()
            .isLength({ min: 1, max: 1000 })
            .withMessage('Message must be between 1 and 1000 characters'),
        (0, express_validator_1.body)('type')
            .optional()
            .isIn(['info', 'warning', 'error', 'success'])
            .withMessage('Invalid announcement type'),
    ],
    deleteAnnouncement: [
        (0, express_validator_1.param)('announcementId')
            .isMongoId()
            .withMessage('Valid announcement ID is required'),
    ],
    exportData: [
        (0, express_validator_1.body)('dataType')
            .isIn(['users', 'merchants', 'transactions', 'all'])
            .withMessage('Invalid data type for export'),
        (0, express_validator_1.body)('format')
            .isIn(['csv', 'json', 'xlsx'])
            .withMessage('Invalid export format'),
        (0, express_validator_1.body)('dateRange')
            .optional()
            .isObject()
            .withMessage('Date range must be an object'),
        (0, express_validator_1.body)('dateRange.start')
            .optional()
            .isISO8601()
            .withMessage('Start date must be in ISO format'),
        (0, express_validator_1.body)('dateRange.end')
            .optional()
            .isISO8601()
            .withMessage('End date must be in ISO format'),
    ],
    // Missing validators from routes
    getAnalytics: [
        (0, express_validator_1.query)('period')
            .optional()
            .isIn(['day', 'week', 'month', 'year'])
            .withMessage('Invalid period'),
        (0, express_validator_1.query)('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date must be in ISO format'),
        (0, express_validator_1.query)('endDate')
            .optional()
            .isISO8601()
            .withMessage('End date must be in ISO format'),
    ],
    getUsers: [
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
            .isIn(['active', 'inactive', 'suspended'])
            .withMessage('Invalid user status'),
    ],
    getUser: [
        (0, express_validator_1.param)('userId')
            .isMongoId()
            .withMessage('Valid user ID is required'),
    ],
    updateUserStatus: [
        (0, express_validator_1.param)('userId')
            .isMongoId()
            .withMessage('Valid user ID is required'),
        (0, express_validator_1.body)('status')
            .isIn(['active', 'inactive', 'suspended'])
            .withMessage('Invalid user status'),
    ],
    updateUserLimits: [
        (0, express_validator_1.param)('userId')
            .isMongoId()
            .withMessage('Valid user ID is required'),
        (0, express_validator_1.body)('dailyLimit')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Daily limit must be a positive number'),
        (0, express_validator_1.body)('monthlyLimit')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Monthly limit must be a positive number'),
    ],
    deleteUser: [
        (0, express_validator_1.param)('userId')
            .isMongoId()
            .withMessage('Valid user ID is required'),
    ],
    getMerchants: [
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
    ],
    getMerchant: [
        (0, express_validator_1.param)('merchantId')
            .isMongoId()
            .withMessage('Valid merchant ID is required'),
    ],
    updateMerchantStatus: [
        (0, express_validator_1.param)('merchantId')
            .isMongoId()
            .withMessage('Valid merchant ID is required'),
        (0, express_validator_1.body)('status')
            .isIn(['active', 'inactive', 'suspended'])
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
    getTransactions: [
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
            .isIn(['pending', 'processing', 'completed', 'failed'])
            .withMessage('Invalid transaction status'),
    ],
    getTransaction: [
        (0, express_validator_1.param)('transactionId')
            .isMongoId()
            .withMessage('Valid transaction ID is required'),
    ],
    refundTransaction: [
        (0, express_validator_1.param)('transactionId')
            .isMongoId()
            .withMessage('Valid transaction ID is required'),
        (0, express_validator_1.body)('reason')
            .notEmpty()
            .withMessage('Refund reason is required'),
    ],
    updateTransactionStatus: [
        (0, express_validator_1.param)('transactionId')
            .isMongoId()
            .withMessage('Valid transaction ID is required'),
        (0, express_validator_1.body)('status')
            .isIn(['pending', 'processing', 'completed', 'failed'])
            .withMessage('Invalid transaction status'),
    ],
    getCards: [
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
    ],
    getCard: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
    ],
    updateCardStatus: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
        (0, express_validator_1.body)('status')
            .isIn(['active', 'inactive', 'blocked'])
            .withMessage('Invalid card status'),
    ],
    blockCard: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
        (0, express_validator_1.body)('reason')
            .notEmpty()
            .withMessage('Block reason is required'),
    ],
    unblockCard: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
    ],
    getKYCRequests: [
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
            .isIn(['pending', 'approved', 'rejected'])
            .withMessage('Invalid KYC status'),
    ],
    getKYCRequest: [
        (0, express_validator_1.param)('kycId')
            .isMongoId()
            .withMessage('Valid KYC ID is required'),
    ],
    approveKYC: [
        (0, express_validator_1.param)('kycId')
            .isMongoId()
            .withMessage('Valid KYC ID is required'),
    ],
    rejectKYC: [
        (0, express_validator_1.param)('kycId')
            .isMongoId()
            .withMessage('Valid KYC ID is required'),
        (0, express_validator_1.body)('reason')
            .notEmpty()
            .withMessage('Rejection reason is required'),
    ],
    getAuditLogs: [
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
    ],
    getAuditLog: [
        (0, express_validator_1.param)('logId')
            .isMongoId()
            .withMessage('Valid log ID is required'),
    ],
    clearCache: [
        (0, express_validator_1.body)('cacheType')
            .optional()
            .isIn(['all', 'user', 'transaction', 'merchant'])
            .withMessage('Invalid cache type'),
    ],
};
//# sourceMappingURL=admin.validator.js.map