"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardController = exports.CardController = void 0;
const card_service_1 = require("../services/card.service");
const Card_model_1 = require("../models/Card.model");
const logger_1 = __importDefault(require("../utils/logger"));
class CardController {
    async createCard(req, res, next) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User authentication required",
                });
            }
            const { cardType, cardName, limits } = req.body;
            const cardData = {
                cardType,
                cardName,
                limits,
            };
            const card = await card_service_1.cardService.createCard(userId, cardData);
            logger_1.default.info("Card created successfully", {
                cardId: card.id,
                cardUuid: card.cardUuid,
                userId,
                cardType: card.cardType,
            });
            res.status(201).json({
                success: true,
                message: "Card created successfully",
                data: card,
            });
        }
        catch (error) {
            logger_1.default.error("Error creating card:", error);
            if (error instanceof Error && error.message === "User not found") {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                });
            }
            next(error);
        }
    }
    async getUserCards(req, res, next) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User authentication required",
                });
            }
            const { status, type } = req.query;
            const cards = await card_service_1.cardService.getUserCards(userId, {
                status,
                type,
            });
            return res.json({
                success: true,
                data: { cards },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCard(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateCard(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteCard(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async activateCard(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deactivateCard(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async blockCard(req, res, next) {
        try {
            const { cardId } = req.params;
            const { reason } = req.body;
            const userId = req.user?._id;
            console.log('🔒 [CardController] Block card request:', {
                cardId,
                reason,
                userId,
                timestamp: new Date().toISOString()
            });
            if (!userId) {
                console.log('❌ [CardController] Block card failed: No user ID');
                return res.status(401).json({
                    success: false,
                    error: "Authentication required",
                });
            }
            // Find card belonging to user
            const card = await Card_model_1.Card.findOne({
                $or: [{ _id: cardId }, { cardUuid: cardId }],
                userId,
            });
            if (!card) {
                console.log('❌ [CardController] Block card failed: Card not found', { cardId, userId });
                return res.status(404).json({
                    success: false,
                    error: "Card not found",
                });
            }
            console.log('📋 [CardController] Found card to block:', {
                cardId: card.cardUuid,
                currentStatus: card.isActive,
                currentBlockedAt: card.blockedAt,
                userId: card.userId
            });
            // Block the card
            card.isActive = false;
            card.blockedAt = new Date();
            card.blockedReason = reason || "User requested block";
            if (!card.metadata)
                card.metadata = {};
            card.metadata.blockedBy = userId;
            await card.save();
            console.log('✅ [CardController] Card blocked successfully:', {
                cardId: card.cardUuid,
                isActive: card.isActive,
                blockedAt: card.blockedAt,
                blockedReason: card.blockedReason,
                userId
            });
            logger_1.default.info("Card blocked by user", {
                cardId: card.cardUuid,
                userId,
                reason: card.blockedReason,
            });
            res.json({
                success: true,
                message: "Card blocked successfully",
                data: {
                    cardId: card.cardUuid,
                    isActive: card.isActive,
                    blockedAt: card.blockedAt,
                    blockedReason: card.blockedReason,
                },
            });
        }
        catch (error) {
            console.log('💥 [CardController] Block card error:', error);
            logger_1.default.error("Error blocking card:", error);
            next(error);
        }
    }
    async unblockCard(req, res, next) {
        try {
            const { cardId } = req.params;
            const userId = req.user?._id;
            console.log('🔓 [CardController] Unblock card request:', {
                cardId,
                userId,
                timestamp: new Date().toISOString()
            });
            if (!userId) {
                console.log('❌ [CardController] Unblock card failed: No user ID');
                return res.status(401).json({
                    success: false,
                    error: "Authentication required",
                });
            }
            // Find card belonging to user
            const card = await Card_model_1.Card.findOne({
                $or: [{ _id: cardId }, { cardUuid: cardId }],
                userId,
            });
            if (!card) {
                console.log('❌ [CardController] Unblock card failed: Card not found', { cardId, userId });
                return res.status(404).json({
                    success: false,
                    error: "Card not found",
                });
            }
            console.log('📋 [CardController] Found card to unblock:', {
                cardId: card.cardUuid,
                currentStatus: card.isActive,
                currentBlockedAt: card.blockedAt,
                userId: card.userId
            });
            // Unblock the card
            card.isActive = true;
            card.blockedAt = undefined;
            card.blockedReason = undefined;
            if (!card.metadata)
                card.metadata = {};
            card.metadata.unblockedBy = userId;
            card.metadata.unblockedAt = new Date();
            await card.save();
            console.log('✅ [CardController] Card unblocked successfully:', {
                cardId: card.cardUuid,
                isActive: card.isActive,
                unblockedAt: card.metadata.unblockedAt,
                userId
            });
            logger_1.default.info("Card unblocked by user", {
                cardId: card.cardUuid,
                userId,
            });
            res.json({
                success: true,
                message: "Card unblocked successfully",
                data: {
                    cardId: card.cardUuid,
                    isActive: card.isActive,
                    unblockedAt: card.metadata.unblockedAt,
                },
            });
        }
        catch (error) {
            console.log('💥 [CardController] Unblock card error:', error);
            logger_1.default.error("Error unblocking card:", error);
            next(error);
        }
    }
    async setPrimaryCard(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateCardLimits(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetCardLimits(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCardTransactions(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCardStats(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllCards(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async forceBlockCard(_req, res, next) {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CardController = CardController;
exports.cardController = new CardController();
//# sourceMappingURL=card.controller.js.map