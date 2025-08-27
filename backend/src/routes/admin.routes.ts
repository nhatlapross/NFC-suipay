import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { adminValidators } from '../validators/admin.validator';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard and statistics
router.get(
  '/dashboard',
  adminController.getDashboard
);

router.get(
  '/stats',
  adminController.getSystemStats
);

router.get(
  '/analytics',
  validate(adminValidators.getAnalytics),
  adminController.getAnalytics
);

// User management
router.get(
  '/users',
  validate(adminValidators.getUsers),
  adminController.getUsers
);

router.get(
  '/users/:userId',
  validate(adminValidators.getUser),
  adminController.getUser
);

router.put(
  '/users/:userId/status',
  validate(adminValidators.updateUserStatus),
  adminController.updateUserStatus
);

router.put(
  '/users/:userId/limits',
  validate(adminValidators.updateUserLimits),
  adminController.updateUserLimits
);

router.delete(
  '/users/:userId',
  validate(adminValidators.deleteUser),
  adminController.deleteUser
);

// Merchant management
router.get(
  '/merchants',
  validate(adminValidators.getMerchants),
  adminController.getMerchants
);

router.get(
  '/merchants/:merchantId',
  validate(adminValidators.getMerchant),
  adminController.getMerchant
);

router.put(
  '/merchants/:merchantId/status',
  validate(adminValidators.updateMerchantStatus),
  adminController.updateMerchantStatus
);

router.put(
  '/merchants/:merchantId/limits',
  validate(adminValidators.updateMerchantLimits),
  adminController.updateMerchantLimits
);

// Transaction management
router.get(
  '/transactions',
  validate(adminValidators.getTransactions),
  adminController.getTransactions
);

router.get(
  '/transactions/:transactionId',
  validate(adminValidators.getTransaction),
  adminController.getTransaction
);

router.post(
  '/transactions/:transactionId/refund',
  validate(adminValidators.refundTransaction),
  adminController.refundTransaction
);

router.put(
  '/transactions/:transactionId/status',
  validate(adminValidators.updateTransactionStatus),
  adminController.updateTransactionStatus
);

// Card management
router.get(
  '/cards',
  validate(adminValidators.getCards),
  adminController.getCards
);

router.get(
  '/cards/:cardId',
  validate(adminValidators.getCard),
  adminController.getCard
);

router.put(
  '/cards/:cardId/status',
  validate(adminValidators.updateCardStatus),
  adminController.updateCardStatus
);

router.post(
  '/cards/:cardId/block',
  validate(adminValidators.blockCard),
  adminController.blockCard
);

router.post(
  '/cards/:cardId/unblock',
  validate(adminValidators.unblockCard),
  adminController.unblockCard
);

// KYC management
router.get(
  '/kyc',
  validate(adminValidators.getKYCRequests),
  adminController.getKYCRequests
);

router.get(
  '/kyc/:kycId',
  validate(adminValidators.getKYCRequest),
  adminController.getKYCRequest
);

router.post(
  '/kyc/:kycId/approve',
  validate(adminValidators.approveKYC),
  adminController.approveKYC
);

router.post(
  '/kyc/:kycId/reject',
  validate(adminValidators.rejectKYC),
  adminController.rejectKYC
);

// System settings
router.get(
  '/settings',
  adminController.getSystemSettings
);

router.put(
  '/settings',
  validate(adminValidators.updateSystemSettings),
  adminController.updateSystemSettings
);

// Audit logs
router.get(
  '/audit-logs',
  validate(adminValidators.getAuditLogs),
  adminController.getAuditLogs
);

router.get(
  '/audit-logs/:logId',
  validate(adminValidators.getAuditLog),
  adminController.getAuditLog
);

// System maintenance
router.post(
  '/maintenance/enable',
  adminController.enableMaintenance
);

router.post(
  '/maintenance/disable',
  adminController.disableMaintenance
);

router.post(
  '/cache/clear',
  validate(adminValidators.clearCache),
  adminController.clearCache
);

router.get(
  '/health',
  adminController.getSystemHealth
);

export default router;