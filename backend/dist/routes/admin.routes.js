"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const admin_validator_1 = require("../validators/admin.validator");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin role
router.use(auth_middleware_1.authenticate);
router.use((0, auth_middleware_1.authorize)('admin'));
// Dashboard and statistics
router.get('/dashboard', admin_controller_1.adminController.getDashboard);
router.get('/stats', admin_controller_1.adminController.getSystemStats);
router.get('/analytics', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getAnalytics), admin_controller_1.adminController.getAnalytics);
// User management
router.get('/users', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getUsers), admin_controller_1.adminController.getUsers);
router.get('/users/:userId', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getUser), admin_controller_1.adminController.getUser);
router.put('/users/:userId/status', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.updateUserStatus), admin_controller_1.adminController.updateUserStatus);
router.put('/users/:userId/limits', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.updateUserLimits), admin_controller_1.adminController.updateUserLimits);
router.delete('/users/:userId', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.deleteUser), admin_controller_1.adminController.deleteUser);
// Merchant management
router.get('/merchants', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getMerchants), admin_controller_1.adminController.getMerchants);
router.get('/merchants/:merchantId', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getMerchant), admin_controller_1.adminController.getMerchant);
router.put('/merchants/:merchantId/status', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.updateMerchantStatus), admin_controller_1.adminController.updateMerchantStatus);
router.put('/merchants/:merchantId/limits', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.updateMerchantLimits), admin_controller_1.adminController.updateMerchantLimits);
// Transaction management
router.get('/transactions', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getTransactions), admin_controller_1.adminController.getTransactions);
router.get('/transactions/:transactionId', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getTransaction), admin_controller_1.adminController.getTransaction);
router.post('/transactions/:transactionId/refund', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.refundTransaction), admin_controller_1.adminController.refundTransaction);
router.put('/transactions/:transactionId/status', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.updateTransactionStatus), admin_controller_1.adminController.updateTransactionStatus);
// Card management
router.get('/cards', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getCards), admin_controller_1.adminController.getCards);
router.get('/cards/:cardId', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getCard), admin_controller_1.adminController.getCard);
router.put('/cards/:cardId/status', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.updateCardStatus), admin_controller_1.adminController.updateCardStatus);
router.post('/cards/:cardId/block', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.blockCard), admin_controller_1.adminController.blockCard);
router.post('/cards/:cardId/unblock', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.unblockCard), admin_controller_1.adminController.unblockCard);
// KYC management
router.get('/kyc', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getKYCRequests), admin_controller_1.adminController.getKYCRequests);
router.get('/kyc/:kycId', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getKYCRequest), admin_controller_1.adminController.getKYCRequest);
router.post('/kyc/:kycId/approve', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.approveKYC), admin_controller_1.adminController.approveKYC);
router.post('/kyc/:kycId/reject', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.rejectKYC), admin_controller_1.adminController.rejectKYC);
// System settings
router.get('/settings', admin_controller_1.adminController.getSystemSettings);
router.put('/settings', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.updateSystemSettings), admin_controller_1.adminController.updateSystemSettings);
// Audit logs
router.get('/audit-logs', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getAuditLogs), admin_controller_1.adminController.getAuditLogs);
router.get('/audit-logs/:logId', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getAuditLog), admin_controller_1.adminController.getAuditLog);
// System maintenance
router.post('/maintenance/enable', admin_controller_1.adminController.enableMaintenance);
router.post('/maintenance/disable', admin_controller_1.adminController.disableMaintenance);
router.post('/cache/clear', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.clearCache), admin_controller_1.adminController.clearCache);
router.get('/health', admin_controller_1.adminController.getSystemHealth);
// === PAYMENT MONITORING ROUTES ===
// Payment failure analysis
router.get('/payments/failures', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getTransactions), admin_controller_1.adminController.getTransactions);
// Merchant payment health overview
router.get('/payments/merchant-health', admin_controller_1.adminController.getMerchants);
router.get('/payments/merchant-health/:merchantId', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getMerchant), admin_controller_1.adminController.getMerchant);
// Card health monitoring
router.get('/payments/card-health', admin_controller_1.adminController.getCards);
// Real-time payment monitoring
router.get('/payments/live', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.getTransactions), (req, _res, next) => {
    // Add real-time filter for last hour
    if (!req.query.startDate) {
        req.query.startDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    }
    next();
}, admin_controller_1.adminController.getTransactions);
// Emergency controls
router.post('/payments/emergency/stop-merchant/:merchantId', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.updateMerchantStatus), (req, _res, next) => {
    req.body = { status: 'inactive', reason: 'Emergency stop by admin' };
    next();
}, admin_controller_1.adminController.updateMerchantStatus);
router.post('/payments/emergency/block-card/:cardId', (0, validation_middleware_1.validate)(admin_validator_1.adminValidators.blockCard), admin_controller_1.adminController.blockCard);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map