import { body, param, query } from 'express-validator';

export const cardValidators = {
  createCard: [
    body('cardType')
      .isIn(['virtual', 'physical'])
      .withMessage('Card type must be virtual or physical'),
    body('cardName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Card name must be between 1 and 50 characters'),
    body('limits')
      .optional()
      .isObject()
      .withMessage('Limits must be an object'),
    body('limits.daily')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Daily limit must be a positive number'),
    body('limits.monthly')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Monthly limit must be a positive number'),
  ],

  updateCard: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('cardName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Card name must be between 1 and 50 characters'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'blocked', 'expired'])
      .withMessage('Invalid card status'),
  ],

  cardId: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
  ],

  activateCard: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('activationCode')
      .optional()
      .isLength({ min: 4, max: 10 })
      .withMessage('Invalid activation code format'),
  ],

  blockCard: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('reason')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Reason must not exceed 255 characters'),
  ],

  updateCardLimits: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('limits')
      .isObject()
      .withMessage('Limits object is required'),
    body('limits.daily')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Daily limit must be a positive number'),
    body('limits.monthly')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Monthly limit must be a positive number'),
    body('limits.perTransaction')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Per transaction limit must be a positive number'),
  ],

  getCardTransactions: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
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
      .withMessage('Invalid transaction status'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
  ],

  getUserCards: [
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'blocked', 'expired'])
      .withMessage('Invalid card status'),
    query('type')
      .optional()
      .isIn(['virtual', 'physical'])
      .withMessage('Invalid card type'),
  ],


  getAllCards: [
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
      .isIn(['active', 'inactive', 'blocked', 'expired'])
      .withMessage('Invalid card status'),
    query('userId')
      .optional()
      .isMongoId()
      .withMessage('Valid user ID is required'),
  ],

  getCard: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
  ],

  deleteCard: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
  ],

  deactivateCard: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
  ],

  unblockCard: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
  ],

  setPrimary: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
  ],

  updateLimits: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('limits')
      .isObject()
      .withMessage('Limits object is required'),
    body('limits.daily')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Daily limit must be a positive number'),
    body('limits.monthly')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Monthly limit must be a positive number'),
  ],

  resetLimits: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
  ],

  getTransactions: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  getStats: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
  ],

  forceBlock: [
    param('cardId')
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('reason')
      .notEmpty()
      .withMessage('Reason is required for force blocking')
      .isLength({ max: 255 })
      .withMessage('Reason must not exceed 255 characters'),
  ],
};