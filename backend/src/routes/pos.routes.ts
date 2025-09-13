import { Router } from 'express';
import { posController } from '../controllers/pos.controller';
import { validate } from '../middleware/validation.middleware';
import { posValidators } from '../validators/pos.validator';
import { authenticateMerchant } from '../middleware/merchantAuth.middleware';
import { posLimiter, posAuthLimiter, terminalRegisterLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

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
router.post(
  '/initiate',
  posLimiter,
  validate(posValidators.initiatePOSSession),
  posController.initiatePOSSession
);

/**
 * Authenticate user on POS terminal (PIN/Signature/Biometric)
 * Called by POS terminal when user inputs authentication data
 */
router.post(
  '/authenticate',
  posAuthLimiter, // More restrictive for auth attempts
  validate(posValidators.authenticatePOS),
  posController.authenticatePOS
);

/**
 * Get POS session status and info
 * Called by POS terminal to check session state
 */
router.get(
  '/session/:sessionId',
  validate(posValidators.getPOSSession),
  posController.getPOSSession
);

/**
 * Cancel POS session
 * Called when transaction is cancelled on POS terminal
 */
router.delete(
  '/session/:sessionId',
  validate(posValidators.cancelPOSSession),
  posController.cancelPOSSession
);

// Merchant authenticated routes
// These endpoints require merchant authentication for management

router.use(authenticateMerchant);

/**
 * Get POS terminal info for merchant
 * Called by merchant app to get terminal details
 */
router.get(
  '/terminal/:terminalId',
  validate(posValidators.getTerminal),
  posController.getTerminalInfo
);

/**
 * Register new POS terminal
 * Called by merchant to register a new terminal
 */
router.post(
  '/terminal/register',
  terminalRegisterLimiter, // Limit terminal registrations
  validate(posValidators.registerTerminal),
  posController.registerTerminal
);

/**
 * Update POS terminal settings
 * Called by merchant to update terminal configuration
 */
router.put(
  '/terminal/:terminalId',
  validate(posValidators.updateTerminal),
  posController.updateTerminal
);

/**
 * Deactivate POS terminal  
 * Called by merchant to disable a terminal
 */
router.delete(
  '/terminal/:terminalId',
  validate(posValidators.deactivateTerminal),
  posController.deactivateTerminal
);

/**
 * Get POS transactions for merchant
 * Called by merchant to view terminal transaction history
 */
router.get(
  '/transactions',
  posController.getPOSTransactions
);

/**
 * Get POS transaction stats
 * Called by merchant dashboard for analytics
 */
router.get(
  '/stats',
  posController.getPOSStats
);

export default router;