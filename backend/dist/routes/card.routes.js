"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const card_controller_1 = require("../controllers/card.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const card_validator_1 = require("../validators/card.validator");
const router = (0, express_1.Router)();
// All card routes require authentication
router.use(auth_middleware_1.authenticate);
// Card management
router.post('/create', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.createCard), card_controller_1.cardController.createCard);
router.get('/', card_controller_1.cardController.getUserCards);
router.get('/:cardId', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.getCard), card_controller_1.cardController.getCard);
router.put('/:cardId', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.updateCard), card_controller_1.cardController.updateCard);
router.delete('/:cardId', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.deleteCard), card_controller_1.cardController.deleteCard);
// Card operations
router.post('/:cardId/activate', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.activateCard), card_controller_1.cardController.activateCard);
router.post('/:cardId/deactivate', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.deactivateCard), card_controller_1.cardController.deactivateCard);
router.post('/:cardId/block', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.blockCard), card_controller_1.cardController.blockCard);
router.post('/:cardId/unblock', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.unblockCard), card_controller_1.cardController.unblockCard);
router.post('/:cardId/set-primary', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.setPrimary), card_controller_1.cardController.setPrimaryCard);
// Card limits
router.put('/:cardId/limits', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.updateLimits), card_controller_1.cardController.updateCardLimits);
router.post('/:cardId/reset-limits', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.resetLimits), card_controller_1.cardController.resetCardLimits);
// Card transactions
router.get('/:cardId/transactions', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.getTransactions), card_controller_1.cardController.getCardTransactions);
router.get('/:cardId/stats', (0, validation_middleware_1.validate)(card_validator_1.cardValidators.getStats), card_controller_1.cardController.getCardStats);
// Admin routes
router.get('/admin/all', (0, auth_middleware_1.authorize)('admin'), card_controller_1.cardController.getAllCards);
router.post('/admin/:cardId/force-block', (0, auth_middleware_1.authorize)('admin'), (0, validation_middleware_1.validate)(card_validator_1.cardValidators.forceBlock), card_controller_1.cardController.forceBlockCard);
exports.default = router;
//# sourceMappingURL=card.routes.js.map