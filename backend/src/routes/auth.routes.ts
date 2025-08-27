import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authLimiter, otpLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';
import { authValidators } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post(
  '/register',
  authLimiter,
  validate(authValidators.register),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(authValidators.login),
  authController.login
);

router.post(
  '/verify-email',
  validate(authValidators.verifyEmail),
  authController.verifyEmail
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(authValidators.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate(authValidators.resetPassword),
  authController.resetPassword
);

router.post(
  '/resend-otp',
  otpLimiter,
  validate(authValidators.resendOtp),
  authController.resendOtp
);

// Protected routes
router.use(authenticate);

router.post('/logout', authController.logout);

router.post('/refresh-token', authController.refreshToken);

router.post(
  '/change-password',
  validate(authValidators.changePassword),
  authController.changePassword
);

router.post(
  '/enable-2fa',
  authController.enable2FA
);

router.post(
  '/disable-2fa',
  validate(authValidators.disable2FA),
  authController.disable2FA
);

router.post(
  '/verify-2fa',
  validate(authValidators.verify2FA),
  authController.verify2FA
);

export default router;