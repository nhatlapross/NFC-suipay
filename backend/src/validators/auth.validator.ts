import { body } from 'express-validator';

export const authValidators = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    body('phoneNumber')
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('fullName')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters')
      .trim(),
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  verifyEmail: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Valid 6-digit OTP is required'),
  ],

  forgotPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
  ],

  resetPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('resetToken')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  ],

  disable2FA: [
    body('token')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Valid 6-digit 2FA token is required'),
  ],

  verify2FA: [
    body('token')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Valid 6-digit 2FA token is required'),
  ],

  resendOtp: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
  ],
};