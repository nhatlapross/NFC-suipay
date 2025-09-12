"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const user_validator_1 = require("../validators/user.validator");
const router = (0, express_1.Router)();
// All user routes require authentication
router.use(auth_middleware_1.authenticate);
// User profile
router.get('/profile', user_controller_1.userController.getProfile);
router.put('/profile', (0, validation_middleware_1.validate)(user_validator_1.userValidators.updateProfile), user_controller_1.userController.updateProfile);
router.delete('/account', (0, validation_middleware_1.validate)(user_validator_1.userValidators.deleteAccount), user_controller_1.userController.deleteAccount);
// User settings
router.get('/settings', user_controller_1.userController.getSettings);
router.put('/settings', (0, validation_middleware_1.validate)(user_validator_1.userValidators.updateSettings), user_controller_1.userController.updateSettings);
// User limits
router.get('/limits', user_controller_1.userController.getLimits);
router.put('/limits', (0, validation_middleware_1.validate)(user_validator_1.userValidators.updateLimits), user_controller_1.userController.updateLimits);
// PIN management
router.post('/pin/set', (0, validation_middleware_1.validate)(user_validator_1.userValidators.setPin), user_controller_1.userController.setPin);
router.post('/pin/change', (0, validation_middleware_1.validate)(user_validator_1.userValidators.changePin), user_controller_1.userController.changePin);
router.post('/pin/verify', (0, validation_middleware_1.validate)(user_validator_1.userValidators.verifyPin), user_controller_1.userController.verifyPin);
// KYC
router.get('/kyc', user_controller_1.userController.getKYCStatus);
router.post('/kyc/submit', (0, validation_middleware_1.validate)(user_validator_1.userValidators.submitKYC), user_controller_1.userController.submitKYC);
router.put('/kyc/update', (0, validation_middleware_1.validate)(user_validator_1.userValidators.updateKYC), user_controller_1.userController.updateKYC);
// Notifications
router.get('/notifications', user_controller_1.userController.getNotifications);
router.put('/notifications/:notificationId/read', (0, validation_middleware_1.validate)(user_validator_1.userValidators.markNotificationAsRead), user_controller_1.userController.markNotificationAsRead);
router.delete('/notifications/:notificationId', (0, validation_middleware_1.validate)(user_validator_1.userValidators.deleteNotification), user_controller_1.userController.deleteNotification);
// User sessions
router.get('/sessions', user_controller_1.userController.getActiveSessions);
router.delete('/sessions/:sessionId', (0, validation_middleware_1.validate)(user_validator_1.userValidators.terminateSession), user_controller_1.userController.terminateSession);
router.delete('/sessions', user_controller_1.userController.terminateAllSessions);
// User statistics
router.get('/stats', user_controller_1.userController.getUserStats);
router.get('/activity', user_controller_1.userController.getActivity);
// Admin routes
router.get('/admin/all', (0, auth_middleware_1.authorize)('admin'), user_controller_1.userController.getAllUsers);
router.get('/admin/:userId', (0, auth_middleware_1.authorize)('admin'), (0, validation_middleware_1.validate)(user_validator_1.userValidators.getUser), user_controller_1.userController.getUserById);
router.put('/admin/:userId/status', (0, auth_middleware_1.authorize)('admin'), (0, validation_middleware_1.validate)(user_validator_1.userValidators.updateUserStatus), user_controller_1.userController.updateUserStatus);
router.put('/admin/:userId/limits', (0, auth_middleware_1.authorize)('admin'), (0, validation_middleware_1.validate)(user_validator_1.userValidators.updateUserLimits), user_controller_1.userController.updateUserLimits);
router.post('/admin/:userId/kyc/approve', (0, auth_middleware_1.authorize)('admin'), (0, validation_middleware_1.validate)(user_validator_1.userValidators.approveKYC), user_controller_1.userController.approveKYC);
router.post('/admin/:userId/kyc/reject', (0, auth_middleware_1.authorize)('admin'), (0, validation_middleware_1.validate)(user_validator_1.userValidators.rejectKYC), user_controller_1.userController.rejectKYC);
exports.default = router;
//# sourceMappingURL=user.routes.js.map