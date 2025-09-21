import { Router } from "express";
import { merchantController } from "../controllers/merchant.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { authenticateMerchant } from "../middleware/merchantAuth.middleware";
import { validate } from "../middleware/validation.middleware";
import { merchantValidators } from "../validators/merchant.validator";

const router = Router();

// Public routes
router.get(
    "/public/:merchantId",
    validate(merchantValidators.getMerchant),
    merchantController.getPublicMerchantInfo
);

router.post(
    "/register",
    authenticate,
    authorize("merchant"),
    validate(merchantValidators.registerMerchant),
    merchantController.registerMerchant
);

// Authentication required for all other routes
router.use(authenticateMerchant);

router.get("/profile", merchantController.getMerchantProfile);

router.put(
    "/profile",
    validate(merchantValidators.updateProfile),
    merchantController.updateMerchantProfile
);

// Merchant payments
router.get("/payments", merchantController.getMerchantPayments);

router.get("/payments/stats", merchantController.getMerchantPaymentStats);

// Payment request creation (for QR codes)
router.post(
    "/payment-requests",
    validate(merchantValidators.createPaymentRequest),
    merchantController.createPaymentRequest
);

router.get(
    "/payment-requests/:id",
    merchantController.getPaymentRequest
);

router.post(
    "/payments/refund/:paymentId",
    validate(merchantValidators.refundPayment),
    merchantController.refundPayment
);

// Merchant settings
router.get("/settings", merchantController.getMerchantSettings);

router.put(
    "/settings",
    validate(merchantValidators.updateSettings),
    merchantController.updateMerchantSettings
);

// Webhook management
router.get("/webhooks", merchantController.getWebhooks);

router.post(
    "/webhooks",
    validate(merchantValidators.createWebhook),
    merchantController.createWebhook
);

router.put(
    "/webhooks/:webhookId",
    validate(merchantValidators.updateWebhook),
    merchantController.updateWebhook
);

router.delete(
    "/webhooks/:webhookId",
    validate(merchantValidators.deleteWebhook),
    merchantController.deleteWebhook
);

// API Keys management
router.get("/api-keys", merchantController.getApiKeys);

router.post(
    "/api-keys",
    validate(merchantValidators.createApiKey),
    merchantController.createApiKey
);

router.delete(
    "/api-keys/:keyId",
    validate(merchantValidators.deleteApiKey),
    merchantController.deleteApiKey
);

// Admin routes (use JWT authentication)
const adminRouter = Router();
adminRouter.use(authenticate); // JWT authentication for admin routes

adminRouter.get(
    "/admin/all",
    authorize("admin"),
    merchantController.getAllMerchants
);

adminRouter.put(
    "/admin/:merchantId/status",
    authorize("admin"),
    validate(merchantValidators.updateMerchantStatus),
    merchantController.updateMerchantStatus
);

adminRouter.put(
    "/admin/:merchantId/limits",
    authorize("admin"),
    validate(merchantValidators.updateMerchantLimits),
    merchantController.updateMerchantLimits
);

router.use(adminRouter);

export default router;
