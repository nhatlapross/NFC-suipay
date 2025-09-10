"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardValidators = void 0;
const express_validator_1 = require("express-validator");
exports.cardValidators = {
    createCard: [
        (0, express_validator_1.body)('cardType')
            .isIn(['virtual', 'physical'])
            .withMessage('Card type must be virtual or physical'),
        (0, express_validator_1.body)('cardName')
            .optional()
            .isLength({ min: 1, max: 50 })
            .withMessage('Card name must be between 1 and 50 characters'),
        (0, express_validator_1.body)('limits')
            .optional()
            .isObject()
            .withMessage('Limits must be an object'),
        (0, express_validator_1.body)('limits.daily')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Daily limit must be a positive number'),
        (0, express_validator_1.body)('limits.monthly')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Monthly limit must be a positive number'),
    ],
    updateCard: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
        (0, express_validator_1.body)('cardName')
            .optional()
            .isLength({ min: 1, max: 50 })
            .withMessage('Card name must be between 1 and 50 characters'),
        (0, express_validator_1.body)('status')
            .optional()
            .isIn(['active', 'inactive', 'blocked', 'expired'])
            .withMessage('Invalid card status'),
    ],
    cardId: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
    ],
    activateCard: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
        (0, express_validator_1.body)('activationCode')
            .optional()
            .isLength({ min: 4, max: 10 })
            .withMessage('Invalid activation code format'),
    ],
    blockCard: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
        (0, express_validator_1.body)('reason')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Reason must not exceed 255 characters'),
    ],
    updateCardLimits: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
        (0, express_validator_1.body)('limits')
            .isObject()
            .withMessage('Limits object is required'),
        (0, express_validator_1.body)('limits.daily')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Daily limit must be a positive number'),
        (0, express_validator_1.body)('limits.monthly')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Monthly limit must be a positive number'),
        (0, express_validator_1.body)('limits.perTransaction')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Per transaction limit must be a positive number'),
    ],
    getCardTransactions: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
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
            .withMessage('Invalid transaction status'),
        (0, express_validator_1.query)('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date must be in ISO format'),
        (0, express_validator_1.query)('endDate')
            .optional()
            .isISO8601()
            .withMessage('End date must be in ISO format'),
    ],
    getUserCards: [
        (0, express_validator_1.query)('status')
            .optional()
            .isIn(['active', 'inactive', 'blocked', 'expired'])
            .withMessage('Invalid card status'),
        (0, express_validator_1.query)('type')
            .optional()
            .isIn(['virtual', 'physical'])
            .withMessage('Invalid card type'),
    ],
    getAllCards: [
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
            .isIn(['active', 'inactive', 'blocked', 'expired'])
            .withMessage('Invalid card status'),
        (0, express_validator_1.query)('userId')
            .optional()
            .isMongoId()
            .withMessage('Valid user ID is required'),
    ],
    getCard: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
    ],
    deleteCard: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
    ],
    deactivateCard: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
    ],
    unblockCard: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
    ],
    setPrimary: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
    ],
    updateLimits: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
        (0, express_validator_1.body)('limits')
            .isObject()
            .withMessage('Limits object is required'),
        (0, express_validator_1.body)('limits.daily')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Daily limit must be a positive number'),
        (0, express_validator_1.body)('limits.monthly')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Monthly limit must be a positive number'),
    ],
    resetLimits: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
    ],
    getTransactions: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
    ],
    getStats: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
    ],
    forceBlock: [
        (0, express_validator_1.param)('cardId')
            .isUUID()
            .withMessage('Valid card UUID is required'),
        (0, express_validator_1.body)('reason')
            .notEmpty()
            .withMessage('Reason is required for force blocking')
            .isLength({ max: 255 })
            .withMessage('Reason must not exceed 255 characters'),
    ],
};
//# sourceMappingURL=card.validator.js.map