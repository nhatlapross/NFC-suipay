import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { paymentLimiter } from "../middleware/rateLimit.middleware";
import { validate } from "../middleware/validation.middleware";
import { paymentValidators } from "../validators/payment.validator";

const router: Router = Router();
// Public routes (no auth required for basic validation)
router.post(
    "/validate",
    authenticate,
    validate(paymentValidators.validatePayment),
    paymentController.validatePayment
);

// NFC validation endpoint (no auth required for terminals)
router.post("/nfc-validate", paymentController.validateNFCPayment);

// NFC direct processing (no auth required - PIN validated in controller)
router.post(
    "/process-direct",
    paymentLimiter,
    validate(paymentValidators.processPayment),
    paymentController.processNFCPaymentDirect.bind(paymentController)
);

// Protected routes
router.use(authenticate);

router.post(
    "/process",
    paymentLimiter,
    validate(paymentValidators.processPayment),
    paymentController.processPayment
);

// Payment Intent flow
router.post(
    "/create",
    paymentLimiter,
    validate(paymentValidators.createPaymentIntent),
    paymentController.createPaymentIntent.bind(paymentController)
);

router.post(
    "/:id/confirm",
    paymentLimiter,
    validate(paymentValidators.confirmPayment),
    paymentController.confirmPayment.bind(paymentController)
);

router.get(
    "/:id/status",
    paymentController.getPaymentStatus.bind(paymentController)
);

router.post(
    "/:id/cancel",
    paymentLimiter,
    paymentController.cancelPayment.bind(paymentController)
);

router.post(
    "/process-async",
    paymentLimiter,
    validate(paymentValidators.processPayment),
    paymentController.processNFCPaymentAsync.bind(paymentController)
);

router.post(
    "/sign",
    validate(paymentValidators.signTransaction),
    paymentController.signTransaction
);

router.post(
    "/complete",
    validate(paymentValidators.completePayment),
    paymentController.completePayment
);

router.get("/transactions", paymentController.getTransactionHistory);

router.get("/transactions/:id", paymentController.getTransaction);

router.post(
    "/transactions/:id/refund",
    authorize("admin", "merchant"),
    paymentController.refundTransaction
);

router.get("/stats", paymentController.getPaymentStats);

// Merchant QR request
router.post(
    "/merchant/create-request",
    paymentLimiter,
    validate(paymentValidators.createMerchantRequest),
    paymentController.createMerchantPaymentRequest.bind(paymentController)
);

router.get(
    "/merchant/request/:id",
    paymentController.getMerchantPaymentRequest.bind(paymentController)
);

export default router;
