import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { walletValidators } from '../validators/wallet.validator';

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

// Wallet management
router.post(
  '/create',
  walletController.createWallet
);

router.post(
  '/import',
  validate(walletValidators.importWallet),
  walletController.importWallet
);

router.post(
  '/export',
  validate(walletValidators.exportWallet),
  walletController.exportWallet
);

// Wallet information
router.get(
  '/info',
  walletController.getWalletInfo
);

router.get(
  '/balance/:address',
  validate(walletValidators.getBalance),
  walletController.getWalletBalance
);

router.get(
  '/objects/:address',
  validate(walletValidators.getObjects),
  walletController.getOwnedObjects
);

// Transactions
router.post(
  '/transfer',
  validate(walletValidators.transferSUI),
  walletController.transferSUI
);

router.get(
  '/transactions',
  walletController.getTransactionHistory
);

// Faucet (testnet only)
router.post(
  '/faucet',
  walletController.requestFromFaucet
);

export default router;