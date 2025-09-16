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
router.post("/validate", auth_middleware_1.authenticate, (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.validatePayment), payment_controller_1.paymentController.validatePayment);
// NFC validation endpoint (no auth required for terminals)
router.post("/nfc-validate", payment_controller_1.paymentController.validateNFCPayment);
// NFC direct processing (no auth required - PIN validated in controller)
router.post("/process-direct", rateLimit_middleware_1.paymentLimiter, (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.processPayment), payment_controller_1.paymentController.processNFCPaymentDirect.bind(payment_controller_1.paymentController));
// Protected routes
router.use(auth_middleware_1.authenticate);
router.post("/process", rateLimit_middleware_1.paymentLimiter, (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.processPayment), payment_controller_1.paymentController.processPayment);
// Payment Intent flow
router.post("/create", rateLimit_middleware_1.paymentLimiter, (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.createPaymentIntent), payment_controller_1.paymentController.createPaymentIntent.bind(payment_controller_1.paymentController));
router.post("/:id/confirm", rateLimit_middleware_1.paymentLimiter, (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.confirmPayment), payment_controller_1.paymentController.confirmPayment.bind(payment_controller_1.paymentController));
router.get("/:id/status", payment_controller_1.paymentController.getPaymentStatus.bind(payment_controller_1.paymentController));
router.post("/:id/cancel", rateLimit_middleware_1.paymentLimiter, payment_controller_1.paymentController.cancelPayment.bind(payment_controller_1.paymentController));
router.post("/process-async", rateLimit_middleware_1.paymentLimiter, (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.processPayment), payment_controller_1.paymentController.processNFCPaymentAsync.bind(payment_controller_1.paymentController));
router.post("/sign", (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.signTransaction), payment_controller_1.paymentController.signTransaction);
router.post("/complete", (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.completePayment), payment_controller_1.paymentController.completePayment);
router.get("/transactions", payment_controller_1.paymentController.getTransactionHistory);
router.get("/transactions/:id", payment_controller_1.paymentController.getTransaction);
router.post("/transactions/:id/refund", (0, auth_middleware_1.authorize)("admin", "merchant"), payment_controller_1.paymentController.refundTransaction);
router.get("/stats", payment_controller_1.paymentController.getPaymentStats);
// Merchant QR request
router.post("/merchant/create-request", rateLimit_middleware_1.paymentLimiter, (0, validation_middleware_1.validate)(payment_validator_1.paymentValidators.createMerchantRequest), payment_controller_1.paymentController.createMerchantPaymentRequest.bind(payment_controller_1.paymentController));
router.get("/merchant/request/:id", payment_controller_1.paymentController.getMerchantPaymentRequest.bind(payment_controller_1.paymentController));
// MY_COIN Test APIs
router.get("/mycoin/balance", payment_controller_1.paymentController.getMyCoinBalance.bind(payment_controller_1.paymentController));
router.get("/mycoin/objects", payment_controller_1.paymentController.getMyCoinObjects.bind(payment_controller_1.paymentController));
router.post("/mycoin/test-payment", payment_controller_1.paymentController.testMyCoinPayment.bind(payment_controller_1.paymentController));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map