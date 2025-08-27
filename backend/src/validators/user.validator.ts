import { body, param, query } from 'express-validator';

export const userValidators = {
  updateProfile: [
    body('firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Date of birth must be in ISO format'),
  ],

  updateSettings: [
    body('notifications')
      .optional()
      .isObject()
      .withMessage('Notifications must be an object'),
    body('notifications.email')
      .optional()
      .isBoolean()
      .withMessage('Email notification setting must be boolean'),
    body('notifications.sms')
      .optional()
      .isBoolean()
      .withMessage('SMS notification setting must be boolean'),
    body('privacy')
      .optional()
      .isObject()
      .withMessage('Privacy settings must be an object'),
    body('twoFactorAuth')
      .optional()
      .isBoolean()
      .withMessage('Two factor auth setting must be boolean'),
  ],

  updateLimits: [
    body('dailyLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Daily limit must be a positive number'),
    body('monthlyLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Monthly limit must be a positive number'),
    body('perTransactionLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Per transaction limit must be a positive number'),
  ],

  setPin: [
    body('pin')
      .isLength({ min: 4, max: 4 })
      .isNumeric()
      .withMessage('PIN must be 4 digits'),
    body('confirmPin')
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
    body('currentPin')
      .isLength({ min: 4, max: 4 })
      .isNumeric()
      .withMessage('Current PIN must be 4 digits'),
    body('newPin')
      .isLength({ min: 4, max: 4 })
      .isNumeric()
      .withMessage('New PIN must be 4 digits'),
    body('confirmPin')
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
    body('pin')
      .isLength({ min: 4, max: 4 })
      .isNumeric()
      .withMessage('PIN must be 4 digits'),
  ],

  submitKYC: [
    body('documentType')
      .isIn(['passport', 'driving_license', 'national_id'])
      .withMessage('Invalid document type'),
    body('documentNumber')
      .notEmpty()
      .withMessage('Document number is required'),
    body('dateOfBirth')
      .isISO8601()
      .withMessage('Date of birth must be in ISO format'),
    body('address')
      .notEmpty()
      .withMessage('Address is required'),
    body('nationality')
      .notEmpty()
      .withMessage('Nationality is required'),
  ],

  updateKYC: [
    body('documentType')
      .optional()
      .isIn(['passport', 'driving_license', 'national_id'])
      .withMessage('Invalid document type'),
    body('documentNumber')
      .optional()
      .notEmpty()
      .withMessage('Document number cannot be empty'),
    body('address')
      .optional()
      .notEmpty()
      .withMessage('Address cannot be empty'),
  ],

  markNotificationAsRead: [
    param('notificationId')
      .isMongoId()
      .withMessage('Valid notification ID is required'),
  ],

  deleteNotification: [
    param('notificationId')
      .isMongoId()
      .withMessage('Valid notification ID is required'),
  ],

  terminateSession: [
    param('sessionId')
      .notEmpty()
      .withMessage('Session ID is required'),
  ],

  getActivity: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('type')
      .optional()
      .isIn(['login', 'payment', 'transfer', 'settings_change'])
      .withMessage('Invalid activity type'),
  ],

  userId: [
    param('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
  ],

  getAllUsers: [
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
      .isIn(['active', 'inactive', 'suspended', 'pending'])
      .withMessage('Invalid user status'),
    query('kycStatus')
      .optional()
      .isIn(['pending', 'verified', 'rejected'])
      .withMessage('Invalid KYC status'),
  ],

  updateUserStatus: [
    param('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
    body('status')
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Invalid user status'),
    body('reason')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Reason must not exceed 255 characters'),
  ],

  updateUserLimits: [
    param('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
    body('dailyLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Daily limit must be a positive number'),
    body('monthlyLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Monthly limit must be a positive number'),
  ],

  approveKYC: [
    param('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters'),
  ],

  rejectKYC: [
    param('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
    body('reason')
      .notEmpty()
      .withMessage('Rejection reason is required')
      .isLength({ max: 255 })
      .withMessage('Reason must not exceed 255 characters'),
  ],

  deleteAccount: [
    body('password')
      .notEmpty()
      .withMessage('Password is required for account deletion'),
    body('confirmation')
      .equals('DELETE')
      .withMessage('Confirmation must be "DELETE"'),
  ],

  getUser: [
    param('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
  ],
};