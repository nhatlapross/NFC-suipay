"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletValidators = void 0;
const express_validator_1 = require("express-validator");
exports.walletValidators = {
    importWallet: [
        (0, express_validator_1.body)('privateKey')
            .notEmpty()
            .withMessage('Private key is required')
            .isLength({ min: 32 })
            .withMessage('Invalid private key format'),
    ],
    exportWallet: [
        (0, express_validator_1.body)('password')
            .notEmpty()
            .withMessage('Password is required for wallet export'),
    ],
    getBalance: [
        (0, express_validator_1.param)('address')
            .notEmpty()
            .withMessage('Wallet address is required')
            .matches(/^0x[a-fA-F0-9]{64}$/)
            .withMessage('Invalid Sui address format'),
    ],
    getObjects: [
        (0, express_validator_1.param)('address')
            .notEmpty()
            .withMessage('Wallet address is required')
            .matches(/^0x[a-fA-F0-9]{64}$/)
            .withMessage('Invalid Sui address format'),
        (0, express_validator_1.query)('cursor')
            .optional()
            .isString()
            .withMessage('Cursor must be a string'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
    ],
    transferSUI: [
        (0, express_validator_1.body)('recipient')
            .notEmpty()
            .withMessage('Recipient address is required')
            .matches(/^0x[a-fA-F0-9]{64}$/)
            .withMessage('Invalid recipient address format'),
        (0, express_validator_1.body)('amount')
            .isFloat({ min: 0.01 })
            .withMessage('Amount must be greater than 0.01 SUI'),
        (0, express_validator_1.body)('description')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Description must not exceed 255 characters'),
    ],
};
//# sourceMappingURL=wallet.validator.js.map