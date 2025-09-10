"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_validator_1 = require("../validators/auth.validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', rateLimit_middleware_1.authLimiter, (0, validation_middleware_1.validate)(auth_validator_1.authValidators.register), auth_controller_1.authController.register);
router.post('/login', rateLimit_middleware_1.authLimiter, (0, validation_middleware_1.validate)(auth_validator_1.authValidators.login), auth_controller_1.authController.login);
router.post('/verify-email', (0, validation_middleware_1.validate)(auth_validator_1.authValidators.verifyEmail), auth_controller_1.authController.verifyEmail);
router.post('/forgot-password', rateLimit_middleware_1.authLimiter, (0, validation_middleware_1.validate)(auth_validator_1.authValidators.forgotPassword), auth_controller_1.authController.forgotPassword);
router.post('/reset-password', (0, validation_middleware_1.validate)(auth_validator_1.authValidators.resetPassword), auth_controller_1.authController.resetPassword);
router.post('/resend-otp', rateLimit_middleware_1.otpLimiter, (0, validation_middleware_1.validate)(auth_validator_1.authValidators.resendOtp), auth_controller_1.authController.resendOtp);
// Temporary admin creation endpoint (for testing)
router.post('/create-admin', rateLimit_middleware_1.authLimiter, (0, validation_middleware_1.validate)(auth_validator_1.authValidators.register), (req, _res, next) => {
    req.body.role = 'admin';
    next();
}, auth_controller_1.authController.register);
// Protected routes
router.use(auth_middleware_1.authenticate);
router.post('/logout', auth_controller_1.authController.logout);
router.post('/refresh-token', auth_controller_1.authController.refreshToken);
router.post('/change-password', (0, validation_middleware_1.validate)(auth_validator_1.authValidators.changePassword), auth_controller_1.authController.changePassword);
router.post('/enable-2fa', auth_controller_1.authController.enable2FA);
router.post('/disable-2fa', (0, validation_middleware_1.validate)(auth_validator_1.authValidators.disable2FA), auth_controller_1.authController.disable2FA);
router.post('/verify-2fa', (0, validation_middleware_1.validate)(auth_validator_1.authValidators.verify2FA), auth_controller_1.authController.verify2FA);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map