"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pos_controller_1 = require("../controllers/pos.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const pos_validator_1 = require("../validators/pos.validator");
const merchantAuth_middleware_1 = require("../middleware/merchantAuth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
/**
 * POS Terminal Routes
 * These routes are for POS terminal interactions and authentication
 */
// Public routes (no auth required for POS terminals)
// These endpoints are called by POS terminals directly
/**
 * Initialize POS session after NFC card scan
 * Called by POS terminal after successful NFC card read
 */
router.post('/initiate', rateLimit_middleware_1.posLimiter, (0, validation_middleware_1.validate)(pos_validator_1.posValidators.initiatePOSSession), pos_controller_1.posController.initiatePOSSession);
/**
 * Authenticate user on POS terminal (PIN/Signature/Biometric)
 * Called by POS terminal when user inputs authentication data
 */
router.post('/authenticate', rateLimit_middleware_1.posAuthLimiter, // More restrictive for auth attempts
(0, validation_middleware_1.validate)(pos_validator_1.posValidators.authenticatePOS), pos_controller_1.posController.authenticatePOS);
/**
 * Get POS session status and info
 * Called by POS terminal to check session state
 */
router.get('/session/:sessionId', (0, validation_middleware_1.validate)(pos_validator_1.posValidators.getPOSSession), pos_controller_1.posController.getPOSSession);
/**
 * Cancel POS session
 * Called when transaction is cancelled on POS terminal
 */
router.delete('/session/:sessionId', (0, validation_middleware_1.validate)(pos_validator_1.posValidators.cancelPOSSession), pos_controller_1.posController.cancelPOSSession);
// Merchant authenticated routes
// These endpoints require merchant authentication for management
router.use(merchantAuth_middleware_1.authenticateMerchant);
/**
 * Get POS terminal info for merchant
 * Called by merchant app to get terminal details
 */
router.get('/terminal/:terminalId', (0, validation_middleware_1.validate)(pos_validator_1.posValidators.getTerminal), pos_controller_1.posController.getTerminalInfo);
/**
 * Register new POS terminal
 * Called by merchant to register a new terminal
 */
router.post('/terminal/register', rateLimit_middleware_1.terminalRegisterLimiter, // Limit terminal registrations
(0, validation_middleware_1.validate)(pos_validator_1.posValidators.registerTerminal), pos_controller_1.posController.registerTerminal);
/**
 * Update POS terminal settings
 * Called by merchant to update terminal configuration
 */
router.put('/terminal/:terminalId', (0, validation_middleware_1.validate)(pos_validator_1.posValidators.updateTerminal), pos_controller_1.posController.updateTerminal);
/**
 * Deactivate POS terminal
 * Called by merchant to disable a terminal
 */
router.delete('/terminal/:terminalId', (0, validation_middleware_1.validate)(pos_validator_1.posValidators.deactivateTerminal), pos_controller_1.posController.deactivateTerminal);
/**
 * Get POS transactions for merchant
 * Called by merchant to view terminal transaction history
 */
router.get('/transactions', pos_controller_1.posController.getPOSTransactions);
/**
 * Get POS transaction stats
 * Called by merchant dashboard for analytics
 */
router.get('/stats', pos_controller_1.posController.getPOSStats);
exports.default = router;
//# sourceMappingURL=pos.routes.js.map