import { body, param, query } from 'express-validator';

export const walletValidators = {
  importWallet: [
    body('privateKey')
      .notEmpty()
      .withMessage('Private key is required')
      .isLength({ min: 32 })
      .withMessage('Invalid private key format'),
  ],

  exportWallet: [
    body('password')
      .notEmpty()
      .withMessage('Password is required for wallet export'),
  ],

  getBalance: [
    param('address')
      .notEmpty()
      .withMessage('Wallet address is required')
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid Sui address format'),
  ],

  getObjects: [
    param('address')
      .notEmpty()
      .withMessage('Wallet address is required')
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid Sui address format'),
    query('cursor')
      .optional()
      .isString()
      .withMessage('Cursor must be a string'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  transferSUI: [
    body('recipient')
      .notEmpty()
      .withMessage('Recipient address is required')
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid recipient address format'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0.01 SUI'),
    body('description')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Description must not exceed 255 characters'),
  ],
};