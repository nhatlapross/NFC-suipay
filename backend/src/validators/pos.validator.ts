import { body, param, query } from 'express-validator';

export const posValidators = {
  /**
   * Validation for POS session initiation
   * POST /pos/initiate
   */
  initiatePOSSession: [
    body('cardUuid')
      .notEmpty()
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('amount')
      .isFloat({ min: 0.01 }) // Minimum 0.01 for blockchain testing
      .withMessage('Amount must be greater than 0'),
    body('merchantId')
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Valid merchant ID is required'),
    body('terminalId')
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Valid terminal ID is required'),
    body('authCode')
      .optional()
      .isString()
      .isLength({ min: 10, max: 100 })
      .withMessage('Auth code must be between 10-100 characters'),
  ],

  /**
   * Validation for POS authentication
   * POST /pos/authenticate
   */
  authenticatePOS: [
    body('sessionId')
      .notEmpty()
      .isString()
      .matches(/^pos_\d+_[a-zA-Z0-9]+$/)
      .withMessage('Valid session ID is required'),
    body('authMethod')
      .notEmpty()
      .isIn(['PIN', 'SIGNATURE', 'BIOMETRIC', 'TAP_ONLY'])
      .withMessage('Auth method must be PIN, SIGNATURE, BIOMETRIC, or TAP_ONLY'),
    body('authData')
      .custom((value, { req }) => {
        const { authMethod } = req.body;
        
        switch (authMethod) {
          case 'PIN':
            if (!value || !/^\d{4,6}$/.test(value)) {
              throw new Error('PIN must be 4-6 digits');
            }
            break;
          case 'SIGNATURE':
            if (!value || !value.signatureData || value.signatureData.length === 0) {
              throw new Error('Signature data is required');
            }
            break;
          case 'BIOMETRIC':
            if (!value || !value.hash) {
              throw new Error('Biometric hash is required');
            }
            break;
          case 'TAP_ONLY':
            // No additional validation needed
            break;
        }
        
        return true;
      }),
  ],

  /**
   * Validation for getting POS session
   * GET /pos/session/:sessionId
   */
  getPOSSession: [
    param('sessionId')
      .notEmpty()
      .isString()
      .matches(/^pos_\d+_[a-zA-Z0-9]+$/)
      .withMessage('Valid session ID is required'),
  ],

  /**
   * Validation for cancelling POS session
   * DELETE /pos/session/:sessionId
   */
  cancelPOSSession: [
    param('sessionId')
      .notEmpty()
      .isString()
      .matches(/^pos_\d+_[a-zA-Z0-9]+$/)
      .withMessage('Valid session ID is required'),
  ],

  /**
   * Validation for registering POS terminal
   * POST /pos/terminal/register
   */
  registerTerminal: [
    body('terminalId')
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Terminal ID must be alphanumeric with underscores/hyphens only'),
    body('terminalName')
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Terminal name is required (max 100 characters)'),
    body('location')
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage('Location must be less than 200 characters'),
    body('terminalType')
      .optional()
      .isIn(['MOBILE', 'FIXED', 'KIOSK', 'ONLINE'])
      .withMessage('Terminal type must be MOBILE, FIXED, KIOSK, or ONLINE'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Features must be an array'),
    body('features.*')
      .optional()
      .isIn(['NFC', 'QR_CODE', 'MAGNETIC_STRIP', 'CHIP', 'CONTACTLESS', 'SIGNATURE_PAD', 'PIN_PAD'])
      .withMessage('Invalid terminal feature'),
  ],

  /**
   * Validation for getting terminal info
   * GET /pos/terminal/:terminalId
   */
  getTerminal: [
    param('terminalId')
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Valid terminal ID is required'),
  ],

  /**
   * Validation for updating terminal
   * PUT /pos/terminal/:terminalId
   */
  updateTerminal: [
    param('terminalId')
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Valid terminal ID is required'),
    body('terminalName')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Terminal name must be 1-100 characters'),
    body('location')
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage('Location must be less than 200 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be boolean'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Features must be an array'),
    body('features.*')
      .optional()
      .isIn(['NFC', 'QR_CODE', 'MAGNETIC_STRIP', 'CHIP', 'CONTACTLESS', 'SIGNATURE_PAD', 'PIN_PAD'])
      .withMessage('Invalid terminal feature'),
    body('settings')
      .optional()
      .isObject()
      .withMessage('Settings must be an object'),
    body('settings.maxAmount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Max amount must be greater than 0'),
    body('settings.requireSignature')
      .optional()
      .isBoolean()
      .withMessage('requireSignature must be boolean'),
    body('settings.requirePINAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('requirePINAmount must be a positive number'),
  ],

  /**
   * Validation for deactivating terminal
   * DELETE /pos/terminal/:terminalId
   */
  deactivateTerminal: [
    param('terminalId')
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Valid terminal ID is required'),
  ],

  /**
   * Validation for getting POS transactions
   * GET /pos/transactions
   */
  getPOSTransactions: [
    query('terminalId')
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid terminal ID'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be valid ISO8601 format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be valid ISO8601 format'),
    query('status')
      .optional()
      .isIn(['pending', 'completed', 'failed', 'cancelled'])
      .withMessage('Status must be pending, completed, failed, or cancelled'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1-100'),
  ],

  /**
   * Validation for PIN verification
   * POST /pos/verify-pin
   */
  verifyPIN: [
    body('sessionId')
      .notEmpty()
      .isString()
      .matches(/^pos_\d+_[a-zA-Z0-9]+$/)
      .withMessage('Valid session ID is required'),
    body('pin')
      .notEmpty()
      .isString()
      .matches(/^\d{4,6}$/)
      .withMessage('PIN must be 4-6 digits'),
  ],

  /**
   * Validation for signature verification
   * POST /pos/verify-signature
   */
  verifySignature: [
    body('sessionId')
      .notEmpty()
      .isString()
      .matches(/^pos_\d+_[a-zA-Z0-9]+$/)
      .withMessage('Valid session ID is required'),
    body('signatureData')
      .notEmpty()
      .isObject()
      .withMessage('Signature data object is required'),
    body('signatureData.points')
      .isArray()
      .withMessage('Signature points array is required'),
    body('signatureData.width')
      .isInt({ min: 100, max: 2000 })
      .withMessage('Signature width must be between 100-2000'),
    body('signatureData.height')
      .isInt({ min: 100, max: 1000 })
      .withMessage('Signature height must be between 100-1000'),
  ],
};