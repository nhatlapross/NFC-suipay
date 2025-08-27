import { Router } from 'express';
import { cardController } from '../controllers/card.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { cardValidators } from '../validators/card.validator';

const router = Router();

// All card routes require authentication
router.use(authenticate);

// Card management
router.post(
  '/create',
  validate(cardValidators.createCard),
  cardController.createCard
);

router.get(
  '/',
  cardController.getUserCards
);

router.get(
  '/:cardId',
  validate(cardValidators.getCard),
  cardController.getCard
);

router.put(
  '/:cardId',
  validate(cardValidators.updateCard),
  cardController.updateCard
);

router.delete(
  '/:cardId',
  validate(cardValidators.deleteCard),
  cardController.deleteCard
);

// Card operations
router.post(
  '/:cardId/activate',
  validate(cardValidators.activateCard),
  cardController.activateCard
);

router.post(
  '/:cardId/deactivate',
  validate(cardValidators.deactivateCard),
  cardController.deactivateCard
);

router.post(
  '/:cardId/block',
  validate(cardValidators.blockCard),
  cardController.blockCard
);

router.post(
  '/:cardId/unblock',
  validate(cardValidators.unblockCard),
  cardController.unblockCard
);

router.post(
  '/:cardId/set-primary',
  validate(cardValidators.setPrimary),
  cardController.setPrimaryCard
);

// Card limits
router.put(
  '/:cardId/limits',
  validate(cardValidators.updateLimits),
  cardController.updateCardLimits
);

router.post(
  '/:cardId/reset-limits',
  validate(cardValidators.resetLimits),
  cardController.resetCardLimits
);

// Card transactions
router.get(
  '/:cardId/transactions',
  validate(cardValidators.getTransactions),
  cardController.getCardTransactions
);

router.get(
  '/:cardId/stats',
  validate(cardValidators.getStats),
  cardController.getCardStats
);

// Admin routes
router.get(
  '/admin/all',
  authorize('admin'),
  cardController.getAllCards
);

router.post(
  '/admin/:cardId/force-block',
  authorize('admin'),
  validate(cardValidators.forceBlock),
  cardController.forceBlockCard
);

export default router;