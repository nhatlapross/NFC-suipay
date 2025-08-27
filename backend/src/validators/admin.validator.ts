import { body, param, query } from 'express-validator';

export const adminValidators = {
  createAdmin: [
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('firstName')
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('role')
      .isIn(['admin', 'super_admin', 'moderator'])
      .withMessage('Invalid admin role'),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
  ],

  updateAdmin: [
    param('adminId')
      .isMongoId()
      .withMessage('Valid admin ID is required'),
    body('firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'super_admin', 'moderator'])
      .withMessage('Invalid admin role'),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
  ],

  adminId: [
    param('adminId')
      .isMongoId()
      .withMessage('Valid admin ID is required'),
  ],

  updateAdminStatus: [
    param('adminId')
      .isMongoId()
      .withMessage('Valid admin ID is required'),
    body('status')
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Invalid admin status'),
    body('reason')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Reason must not exceed 255 characters'),
  ],


  getSystemStats: [
    query('period')
      .optional()
      .isIn(['day', 'week', 'month', 'year'])
      .withMessage('Invalid period'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
  ],

  updateSystemSettings: [
    body('maintenanceMode')
      .optional()
      .isBoolean()
      .withMessage('Maintenance mode must be boolean'),
    body('registrationEnabled')
      .optional()
      .isBoolean()
      .withMessage('Registration enabled must be boolean'),
    body('defaultLimits')
      .optional()
      .isObject()
      .withMessage('Default limits must be an object'),
    body('defaultLimits.daily')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Daily limit must be a positive number'),
    body('defaultLimits.monthly')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Monthly limit must be a positive number'),
  ],

  createAnnouncement: [
    body('title')
      .notEmpty()
      .withMessage('Announcement title is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('message')
      .notEmpty()
      .withMessage('Announcement message is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    body('type')
      .isIn(['info', 'warning', 'error', 'success'])
      .withMessage('Invalid announcement type'),
    body('targetAudience')
      .isIn(['all', 'users', 'merchants', 'admins'])
      .withMessage('Invalid target audience'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Expiration date must be in ISO format'),
  ],

  updateAnnouncement: [
    param('announcementId')
      .isMongoId()
      .withMessage('Valid announcement ID is required'),
    body('title')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('message')
      .optional()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    body('type')
      .optional()
      .isIn(['info', 'warning', 'error', 'success'])
      .withMessage('Invalid announcement type'),
  ],

  deleteAnnouncement: [
    param('announcementId')
      .isMongoId()
      .withMessage('Valid announcement ID is required'),
  ],

  exportData: [
    body('dataType')
      .isIn(['users', 'merchants', 'transactions', 'all'])
      .withMessage('Invalid data type for export'),
    body('format')
      .isIn(['csv', 'json', 'xlsx'])
      .withMessage('Invalid export format'),
    body('dateRange')
      .optional()
      .isObject()
      .withMessage('Date range must be an object'),
    body('dateRange.start')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    body('dateRange.end')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
  ],

  // Missing validators from routes
  getAnalytics: [
    query('period')
      .optional()
      .isIn(['day', 'week', 'month', 'year'])
      .withMessage('Invalid period'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
  ],

  getUsers: [
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
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Invalid user status'),
  ],

  getUser: [
    param('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
  ],

  updateUserStatus: [
    param('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
    body('status')
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Invalid user status'),
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

  deleteUser: [
    param('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
  ],

  getMerchants: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  getMerchant: [
    param('merchantId')
      .isMongoId()
      .withMessage('Valid merchant ID is required'),
  ],

  updateMerchantStatus: [
    param('merchantId')
      .isMongoId()
      .withMessage('Valid merchant ID is required'),
    body('status')
      .isIn(['active', 'inactive', 'suspended'])
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

  getTransactions: [
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
      .isIn(['pending', 'processing', 'completed', 'failed'])
      .withMessage('Invalid transaction status'),
  ],

  getTransaction: [
    param('transactionId')
      .isMongoId()
      .withMessage('Valid transaction ID is required'),
  ],

  refundTransaction: [
    param('transactionId')
      .isMongoId()
      .withMessage('Valid transaction ID is required'),
    body('reason')
      .notEmpty()
      .withMessage('Refund reason is required'),
  ],

  updateTransactionStatus: [
    param('transactionId')
      .isMongoId()
      .withMessage('Valid transaction ID is required'),
    body('status')
      .isIn(['pending', 'processing', 'completed', 'failed'])
      .withMessage('Invalid transaction status'),
  ],

  getCards: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  getCard: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
  ],

  updateCardStatus: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('status')
      .isIn(['active', 'inactive', 'blocked'])
      .withMessage('Invalid card status'),
  ],

  blockCard: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('reason')
      .notEmpty()
      .withMessage('Block reason is required'),
  ],

  unblockCard: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
  ],

  getKYCRequests: [
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
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Invalid KYC status'),
  ],

  getKYCRequest: [
    param('kycId')
      .isMongoId()
      .withMessage('Valid KYC ID is required'),
  ],

  approveKYC: [
    param('kycId')
      .isMongoId()
      .withMessage('Valid KYC ID is required'),
  ],

  rejectKYC: [
    param('kycId')
      .isMongoId()
      .withMessage('Valid KYC ID is required'),
    body('reason')
      .notEmpty()
      .withMessage('Rejection reason is required'),
  ],

  getAuditLogs: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  getAuditLog: [
    param('logId')
      .isMongoId()
      .withMessage('Valid log ID is required'),
  ],

  clearCache: [
    body('cacheType')
      .optional()
      .isIn(['all', 'user', 'transaction', 'merchant'])
      .withMessage('Invalid cache type'),
  ],
};