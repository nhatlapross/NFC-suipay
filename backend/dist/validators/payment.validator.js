"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentValidators = void 0;
const express_validator_1 = require("express-validator");
exports.paymentValidators = {
    validatePayment: [
        (0, express_validator_1.body)("cardUuid")
            .notEmpty()
            .isUUID()
            .withMessage("Valid card UUID is required"),
        (0, express_validator_1.body)("amount")
            .isFloat({ min: 0.01 })
            .withMessage("Amount must be greater than 0.01"),
        (0, express_validator_1.body)("merchantId").notEmpty().withMessage("Merchant ID is required"),
    ],
    processPayment: [
        (0, express_validator_1.body)("cardUuid")
            .notEmpty()
            .isUUID()
            .withMessage("Valid card UUID is required"),
        (0, express_validator_1.body)("amount")
            .isFloat({ min: 0.01 })
            .withMessage("Amount must be greater than 0.01"),
        (0, express_validator_1.body)("merchantId").notEmpty().withMessage("Merchant ID is required"),
        (0, express_validator_1.body)("pin")
            .optional()
            .isLength({ min: 4, max: 4 })
            .isNumeric()
            .withMessage("PIN must be 4 digits"),
    ],
    createPaymentIntent: [
        (0, express_validator_1.body)("cardUuid")
            .notEmpty()
            .isUUID()
            .withMessage("Valid card UUID is required"),
        (0, express_validator_1.body)("amount")
            .isFloat({ min: 0.01 })
            .withMessage("Amount must be greater than 0.01"),
        (0, express_validator_1.body)("merchantId").notEmpty().withMessage("Merchant ID is required"),
    ],
    confirmPayment: [
        (0, express_validator_1.body)("pin")
            .notEmpty()
            .isLength({ min: 4, max: 4 })
            .isNumeric()
            .withMessage("PIN must be 4 digits"),
    ],
    signTransaction: [
        (0, express_validator_1.body)("transactionBytes")
            .notEmpty()
            .withMessage("Transaction bytes are required"),
        (0, express_validator_1.body)("cardUuid")
            .notEmpty()
            .isUUID()
            .withMessage("Valid card UUID is required"),
        (0, express_validator_1.body)("amount")
            .optional()
            .isFloat({ min: 0 })
            .withMessage("Amount must be a positive number"),
    ],
    completePayment: [
        (0, express_validator_1.body)("txHash").notEmpty().withMessage("Transaction hash is required"),
        (0, express_validator_1.body)("transactionId")
            .optional()
            .isMongoId()
            .withMessage("Valid transaction ID required"),
        (0, express_validator_1.body)("cardUuid")
            .optional()
            .isUUID()
            .withMessage("Valid card UUID required"),
    ],
    createMerchantRequest: [
        (0, express_validator_1.body)("amount")
            .isFloat({ min: 0.01 })
            .withMessage("Amount must be greater than 0.01"),
        (0, express_validator_1.body)("description")
            .optional()
            .isString()
            .isLength({ max: 200 })
            .withMessage("Description must be <= 200 chars"),
    ],
};
//# sourceMappingURL=payment.validator.js.map