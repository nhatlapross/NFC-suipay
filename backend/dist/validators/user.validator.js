"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userValidators = void 0;
const express_validator_1 = require("express-validator");
exports.userValidators = {
    updateProfile: [
        (0, express_validator_1.body)('firstName')
            .optional()
            .isLength({ min: 1, max: 50 })
            .withMessage('First name must be between 1 and 50 characters'),
        (0, express_validator_1.body)('lastName')
            .optional()
            .isLength({ min: 1, max: 50 })
            .withMessage('Last name must be between 1 and 50 characters'),
        (0, express_validator_1.body)('phone')
            .optional()
            .isMobilePhone('any')
            .withMessage('Valid phone number is required'),
        (0, express_validator_1.body)('dateOfBirth')
            .optional()
            .isISO8601()
            .withMessage('Date of birth must be in ISO format'),
    ],
    updateSettings: [
        (0, express_validator_1.body)('notifications')
            .optional()
            .isObject()
            .withMessage('Notifications must be an object'),
        (0, express_validator_1.body)('notifications.email')
            .optional()
            .isBoolean()
            .withMessage('Email notification setting must be boolean'),
        (0, express_validator_1.body)('notifications.sms')
            .optional()
            .isBoolean()
            .withMessage('SMS notification setting must be boolean'),
        (0, express_validator_1.body)('privacy')
            .optional()
            .isObject()
            .withMessage('Privacy settings must be an object'),
        (0, express_validator_1.body)('twoFactorAuth')
            .optional()
            .isBoolean()
            .withMessage('Two factor auth setting must be boolean'),
    ],
    updateLimits: [
        (0, express_validator_1.body)('dailyLimit')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Daily limit must be a positive number'),
        (0, express_validator_1.body)('monthlyLimit')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Monthly limit must be a positive number'),
        (0, express_validator_1.body)('perTransactionLimit')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Per transaction limit must be a positive number'),
    ],
    setPin: [
        (0, express_validator_1.body)('pin')
            .isLength({ min: 4, max: 4 })
            .isNumeric()
            .withMessage('PIN must be 4 digits'),
        (0, express_validator_1.body)('confirmPin')
            .isLength({ min: 4, max: 4 })
            .isNumeric()
            .withMessage('Confirm PIN must be 4 digits')
            .custom((value, { req }) => {
            if (value !== req.body.pin) {
                throw new Error('PIN confirmation does not match');
            }
            return true;
        }),
    ],
    changePin: [
        (0, express_validator_1.body)('currentPin')
            .isLength({ min: 4, max: 4 })
            .isNumeric()
            .withMessage('Current PIN must be 4 digits'),
        (0, express_validator_1.body)('newPin')
            .isLength({ min: 4, max: 4 })
            .isNumeric()
            .withMessage('New PIN must be 4 digits'),
        (0, express_validator_1.body)('confirmPin')
            .isLength({ min: 4, max: 4 })
            .isNumeric()
            .withMessage('Confirm PIN must be 4 digits')
            .custom((value, { req }) => {
            if (value !== req.body.newPin) {
                throw new Error('PIN confirmation does not match');
            }
            return true;
        }),
    ],
    verifyPin: [
        (0, express_validator_1.body)('pin')
            .isLength({ min: 4, max: 4 })
            .isNumeric()
            .withMessage('PIN must be 4 digits'),
    ],
    submitKYC: [
        (0, express_validator_1.body)('documentType')
            .isIn(['passport', 'driving_license', 'national_id'])
            .withMessage('Invalid document type'),
        (0, express_validator_1.body)('documentNumber')
            .notEmpty()
            .withMessage('Document number is required'),
        (0, express_validator_1.body)('dateOfBirth')
            .isISO8601()
            .withMessage('Date of birth must be in ISO format'),
        (0, express_validator_1.body)('address')
            .notEmpty()
            .withMessage('Address is required'),
        (0, express_validator_1.body)('nationality')
            .notEmpty()
            .withMessage('Nationality is required'),
    ],
    updateKYC: [
        (0, express_validator_1.body)('documentType')
            .optional()
            .isIn(['passport', 'driving_license', 'national_id'])
            .withMessage('Invalid document type'),
        (0, express_validator_1.body)('documentNumber')
            .optional()
            .notEmpty()
            .withMessage('Document number cannot be empty'),
        (0, express_validator_1.body)('address')
            .optional()
            .notEmpty()
            .withMessage('Address cannot be empty'),
    ],
    markNotificationAsRead: [
        (0, express_validator_1.param)('notificationId')
            .isMongoId()
            .withMessage('Valid notification ID is required'),
    ],
    deleteNotification: [
        (0, express_validator_1.param)('notificationId')
            .isMongoId()
            .withMessage('Valid notification ID is required'),
    ],
    terminateSession: [
        (0, express_validator_1.param)('sessionId')
            .notEmpty()
            .withMessage('Session ID is required'),
    ],
    getActivity: [
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        (0, express_validator_1.query)('type')
            .optional()
            .isIn(['login', 'payment', 'transfer', 'settings_change'])
            .withMessage('Invalid activity type'),
    ],
    userId: [
        (0, express_validator_1.param)('userId')
            .isMongoId()
            .withMessage('Valid user ID is required'),
    ],
    getAllUsers: [
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
            .isIn(['active', 'inactive', 'suspended', 'pending'])
            .withMessage('Invalid user status'),
        (0, express_validator_1.query)('kycStatus')
            .optional()
            .isIn(['pending', 'verified', 'rejected'])
            .withMessage('Invalid KYC status'),
    ],
    updateUserStatus: [
        (0, express_validator_1.param)('userId')
            .isMongoId()
            .withMessage('Valid user ID is required'),
        (0, express_validator_1.body)('status')
            .isIn(['active', 'inactive', 'suspended'])
            .withMessage('Invalid user status'),
        (0, express_validator_1.body)('reason')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Reason must not exceed 255 characters'),
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
    approveKYC: [
        (0, express_validator_1.param)('userId')
            .isMongoId()
            .withMessage('Valid user ID is required'),
        (0, express_validator_1.body)('notes')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Notes must not exceed 500 characters'),
    ],
    rejectKYC: [
        (0, express_validator_1.param)('userId')
            .isMongoId()
            .withMessage('Valid user ID is required'),
        (0, express_validator_1.body)('reason')
            .notEmpty()
            .withMessage('Rejection reason is required')
            .isLength({ max: 255 })
            .withMessage('Reason must not exceed 255 characters'),
    ],
    deleteAccount: [
        (0, express_validator_1.body)('password')
            .notEmpty()
            .withMessage('Password is required for account deletion'),
        (0, express_validator_1.body)('confirmation')
            .equals('DELETE')
            .withMessage('Confirmation must be "DELETE"'),
    ],
    getUser: [
        (0, express_validator_1.param)('userId')
            .isMongoId()
            .withMessage('Valid user ID is required'),
    ],
};
//# sourceMappingURL=user.validator.js.map