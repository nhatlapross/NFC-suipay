import { body } from 'express-validator';

export const paymentValidators = {
  validatePayment: [
    body('cardUuid')
      .notEmpty()
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0.01'),
    body('merchantId')
      .notEmpty()
      .withMessage('Merchant ID is required'),
  ],

  processPayment: [
    body('cardUuid')
      .notEmpty()
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0.01'),
    body('merchantId')
      .notEmpty()
      .withMessage('Merchant ID is required'),
    body('pin')
      .optional()
      .isLength({ min: 4, max: 4 })
      .isNumeric()
      .withMessage('PIN must be 4 digits'),
  ],

  signTransaction: [
    body('transactionBytes')
      .notEmpty()
      .withMessage('Transaction bytes are required'),
    body('cardUuid')
      .notEmpty()
      .isUUID()
      .withMessage('Valid card UUID is required'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
  ],

  completePayment: [
    body('txHash')
      .notEmpty()
      .withMessage('Transaction hash is required'),
    body('transactionId')
      .optional()
      .isMongoId()
      .withMessage('Valid transaction ID required'),
    body('cardUuid')
      .optional()
      .isUUID()
      .withMessage('Valid card UUID required'),
  ],
};