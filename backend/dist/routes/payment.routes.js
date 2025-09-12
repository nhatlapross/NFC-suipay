"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const payment_validator_1 = require("../validators/payment.validator");
const router = (0, express_1.Router)();
// Public routes (no auth required for basic validation)
router.post('/validate', (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.validatePayment), payment_controller_1.paymentController.validatePayment);
// NFC validation endpoint (no auth required for terminals)
router.post('/nfc-validate', payment_controller_1.paymentController.validateNFCPayment);
// Protected routes
router.use(auth_middleware_1.authenticate);
router.post('/process', rateLimit_middleware_1.paymentLimiter, (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.processPayment), payment_controller_1.paymentController.processPayment);
router.post('/process-async', rateLimit_middleware_1.paymentLimiter, (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.processPayment), payment_controller_1.paymentController.processNFCPaymentAsync.bind(payment_controller_1.paymentController));
router.post('/process-direct', rateLimit_middleware_1.paymentLimiter, (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.processPayment), payment_controller_1.paymentController.processNFCPaymentDirect.bind(payment_controller_1.paymentController));
router.post('/sign', (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.signTransaction), payment_controller_1.paymentController.signTransaction);
router.post('/complete', (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.completePayment), payment_controller_1.paymentController.completePayment);
router.get('/transactions', payment_controller_1.paymentController.getTransactionHistory);
router.get('/transactions/:id', payment_controller_1.paymentController.getTransaction);
router.post('/transactions/:id/refund', (0, auth_middleware_1.authorize)('admin', 'merchant'), payment_controller_1.paymentController.refundTransaction);
router.get('/stats', payment_controller_1.paymentController.getPaymentStats);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map