"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("../controllers/wallet.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const wallet_validator_1 = require("../validators/wallet.validator");
const router = (0, express_1.Router)();
// All wallet routes require authentication
router.use(auth_middleware_1.authenticate);
// Wallet management
router.post('/create', wallet_controller_1.walletController.createWallet);
router.post('/import', (0, validation_middleware_1.validate)(wallet_validator_1.walletValidators.importWallet), wallet_controller_1.walletController.importWallet);
router.post('/export', (0, validation_middleware_1.validate)(wallet_validator_1.walletValidators.exportWallet), wallet_controller_1.walletController.exportWallet);
// Wallet information
router.get('/info', wallet_controller_1.walletController.getWalletInfo);
router.get('/balance/:address', (0, validation_middleware_1.validate)(wallet_validator_1.walletValidators.getBalance), wallet_controller_1.walletController.getWalletBalance);
router.get('/objects/:address', (0, validation_middleware_1.validate)(wallet_validator_1.walletValidators.getObjects), wallet_controller_1.walletController.getOwnedObjects);
// Transactions
router.post('/transfer', (0, validation_middleware_1.validate)(wallet_validator_1.walletValidators.transferSUI), wallet_controller_1.walletController.transferSUI);
router.get('/transactions', wallet_controller_1.walletController.getTransactionHistory);
// Faucet (testnet only)
router.post('/faucet', wallet_controller_1.walletController.requestFromFaucet);
exports.default = router;
//# sourceMappingURL=wallet.routes.js.map