import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { userValidators } from '../validators/user.validator';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// User profile
router.get(
  '/profile',
  userController.getProfile
);

router.put(
  '/profile',
  validate(userValidators.updateProfile),
  userController.updateProfile
);

router.delete(
  '/account',
  validate(userValidators.deleteAccount),
  userController.deleteAccount
);

// User settings
router.get(
  '/settings',
  userController.getSettings
);

router.put(
  '/settings',
  validate(userValidators.updateSettings),
  userController.updateSettings
);

// User limits
router.get(
  '/limits',
  userController.getLimits
);

router.put(
  '/limits',
  validate(userValidators.updateLimits),
  userController.updateLimits
);

// PIN management
router.post(
  '/pin/set',
  validate(userValidators.setPin),
  userController.setPin
);

router.post(
  '/pin/change',
  validate(userValidators.changePin),
  userController.changePin
);

router.post(
  '/pin/verify',
  validate(userValidators.verifyPin),
  userController.verifyPin
);

// KYC
router.get(
  '/kyc',
  userController.getKYCStatus
);

router.post(
  '/kyc/submit',
  validate(userValidators.submitKYC),
  userController.submitKYC
);

router.put(
  '/kyc/update',
  validate(userValidators.updateKYC),
  userController.updateKYC
);

// Notifications
router.get(
  '/notifications',
  userController.getNotifications
);

router.put(
  '/notifications/:notificationId/read',
  validate(userValidators.markNotificationAsRead),
  userController.markNotificationAsRead
);

router.delete(
  '/notifications/:notificationId',
  validate(userValidators.deleteNotification),
  userController.deleteNotification
);

// User sessions
router.get(
  '/sessions',
  userController.getActiveSessions
);

router.delete(
  '/sessions/:sessionId',
  validate(userValidators.terminateSession),
  userController.terminateSession
);

router.delete(
  '/sessions',
  userController.terminateAllSessions
);

// User statistics
router.get(
  '/stats',
  userController.getUserStats
);

router.get(
  '/activity',
  userController.getActivity
);

// Admin routes
router.get(
  '/admin/all',
  authorize('admin'),
  userController.getAllUsers
);

router.get(
  '/admin/:userId',
  authorize('admin'),
  validate(userValidators.getUser),
  userController.getUserById
);

router.put(
  '/admin/:userId/status',
  authorize('admin'),
  validate(userValidators.updateUserStatus),
  userController.updateUserStatus
);

router.put(
  '/admin/:userId/limits',
  authorize('admin'),
  validate(userValidators.updateUserLimits),
  userController.updateUserLimits
);

router.post(
  '/admin/:userId/kyc/approve',
  authorize('admin'),
  validate(userValidators.approveKYC),
  userController.approveKYC
);

router.post(
  '/admin/:userId/kyc/reject',
  authorize('admin'),
  validate(userValidators.rejectKYC),
  userController.rejectKYC
);

export default router;