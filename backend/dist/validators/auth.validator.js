"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidators = void 0;
const express_validator_1 = require("express-validator");
exports.authValidators = {
    register: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        (0, express_validator_1.body)('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
        (0, express_validator_1.body)('phoneNumber')
            .isMobilePhone('any')
            .withMessage('Valid phone number is required'),
        (0, express_validator_1.body)('fullName')
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters')
            .trim(),
    ],
    login: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        (0, express_validator_1.body)('password')
            .notEmpty()
            .withMessage('Password is required'),
    ],
    verifyEmail: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        (0, express_validator_1.body)('otp')
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage('Valid 6-digit OTP is required'),
    ],
    forgotPassword: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
    ],
    resetPassword: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        (0, express_validator_1.body)('resetToken')
            .notEmpty()
            .withMessage('Reset token is required'),
        (0, express_validator_1.body)('newPassword')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    ],
    changePassword: [
        (0, express_validator_1.body)('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        (0, express_validator_1.body)('newPassword')
            .isLength({ min: 8 })
            .withMessage('New password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    ],
    disable2FA: [
        (0, express_validator_1.body)('token')
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage('Valid 6-digit 2FA token is required'),
    ],
    verify2FA: [
        (0, express_validator_1.body)('token')
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage('Valid 6-digit 2FA token is required'),
    ],
    resendOtp: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
    ],
};
//# sourceMappingURL=auth.validator.js.map