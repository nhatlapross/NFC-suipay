"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardService = exports.CardService = void 0;
const Card_model_1 = require("../models/Card.model");
const User_model_1 = require("../models/User.model");
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../utils/logger"));
class CardService {
    async createCard(userId, cardData) {
        try {
            // Check if user exists
            const user = await User_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            // Check if user already has cards
            const existingCards = await Card_model_1.Card.countDocuments({
                userId,
                isActive: true,
            });
            const isPrimary = existingCards === 0; // First card is primary by default
            // Generate unique card UUID
            const cardUuid = (0, uuid_1.v4)();
            // Generate card number (16 digits)
            const cardNumber = this.generateCardNumber();
            // Set default values
            const cardType = cardData.cardType; // Required field
            const dailyLimit = cardData.limits?.daily || 2000000; // 2M VND
            const monthlyLimit = cardData.limits?.monthly || 50000000; // 50M VND
            const singleTransactionLimit = 500000; // 500K VND (default)
            // Create card
            const card = new Card_model_1.Card({
                cardUuid,
                userId,
                cardType,
                cardNumber,
                isActive: true,
                isPrimary,
                dailyLimit,
                monthlyLimit,
                singleTransactionLimit,
                dailySpent: 0,
                monthlySpent: 0,
                usageCount: 0,
                issueDate: new Date(),
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
                lastResetDate: new Date(),
            });
            await card.save();
            logger_1.default.info("Card created successfully", {
                cardId: card._id,
                cardUuid: card.cardUuid,
                userId,
                cardType,
                isPrimary,
            });
            return this.formatCardResponse(card);
        }
        catch (error) {
            logger_1.default.error("Error creating card:", error);
            throw error;
        }
    }
    async getUserCards(userId, filters) {
        try {
            const query = { userId };
            if (filters?.status) {
                if (filters.status === "active") {
                    query.isActive = true;
                }
                else if (filters.status === "inactive") {
                    query.isActive = false;
                }
                else if (filters.status === "blocked") {
                    query.blockedAt = { $exists: true };
                }
                else if (filters.status === "expired") {
                    query.expiryDate = { $lt: new Date() };
                }
            }
            if (filters?.type) {
                query.cardType = filters.type;
            }
            const cards = await Card_model_1.Card.find(query).sort({ createdAt: -1 });
            return cards.map((card) => this.formatCardResponse(card));
        }
        catch (error) {
            logger_1.default.error("Error getting user cards:", error);
            throw error;
        }
    }
    async getCardById(cardId, userId) {
        try {
            const query = { $or: [{ _id: cardId }, { cardUuid: cardId }] };
            if (userId) {
                query.userId = userId;
            }
            const card = await Card_model_1.Card.findOne(query);
            if (!card) {
                throw new Error("Card not found");
            }
            return this.formatCardResponse(card);
        }
        catch (error) {
            logger_1.default.error("Error getting card by ID:", error);
            throw error;
        }
    }
    async updateCard(cardId, userId, updateData) {
        try {
            const card = await Card_model_1.Card.findOne({
                $or: [{ _id: cardId }, { cardUuid: cardId }],
                userId,
            });
            if (!card) {
                throw new Error("Card not found");
            }
            // Update allowed fields
            if (updateData.cardType)
                card.cardType = updateData.cardType;
            if (updateData.isActive !== undefined)
                card.isActive = updateData.isActive;
            if (updateData.dailyLimit !== undefined)
                card.dailyLimit = updateData.dailyLimit;
            if (updateData.monthlyLimit !== undefined)
                card.monthlyLimit = updateData.monthlyLimit;
            if (updateData.singleTransactionLimit !== undefined)
                card.singleTransactionLimit = updateData.singleTransactionLimit;
            await card.save();
            logger_1.default.info("Card updated successfully", {
                cardId: card._id,
                cardUuid: card.cardUuid,
                userId,
                updateData,
            });
            return this.formatCardResponse(card);
        }
        catch (error) {
            logger_1.default.error("Error updating card:", error);
            throw error;
        }
    }
    async deleteCard(cardId, userId) {
        try {
            const card = await Card_model_1.Card.findOne({
                $or: [{ _id: cardId }, { cardUuid: cardId }],
                userId,
            });
            if (!card) {
                throw new Error("Card not found");
            }
            // Soft delete - just deactivate
            card.isActive = false;
            await card.save();
            logger_1.default.info("Card deleted successfully", {
                cardId: card._id,
                cardUuid: card.cardUuid,
                userId,
            });
        }
        catch (error) {
            logger_1.default.error("Error deleting card:", error);
            throw error;
        }
    }
    async setPrimaryCard(cardId, userId) {
        try {
            // First, unset all primary cards for this user
            await Card_model_1.Card.updateMany({ userId }, { isPrimary: false });
            // Set the specified card as primary
            const card = await Card_model_1.Card.findOneAndUpdate({ $or: [{ _id: cardId }, { cardUuid: cardId }], userId }, { isPrimary: true }, { new: true });
            if (!card) {
                throw new Error("Card not found");
            }
            logger_1.default.info("Primary card set successfully", {
                cardId: card._id,
                cardUuid: card.cardUuid,
                userId,
            });
            return this.formatCardResponse(card);
        }
        catch (error) {
            logger_1.default.error("Error setting primary card:", error);
            throw error;
        }
    }
    generateCardNumber() {
        // Generate 16-digit card number
        let cardNumber = "";
        for (let i = 0; i < 16; i++) {
            cardNumber += Math.floor(Math.random() * 10);
        }
        return cardNumber;
    }
    formatCardResponse(card) {
        return {
            id: card._id.toString(),
            cardUuid: card.cardUuid,
            cardType: card.cardType,
            isActive: card.isActive,
            isPrimary: card.isPrimary,
            dailyLimit: card.dailyLimit,
            monthlyLimit: card.monthlyLimit,
            dailySpent: card.dailySpent,
            monthlySpent: card.monthlySpent,
            singleTransactionLimit: card.singleTransactionLimit,
            issueDate: card.issueDate,
            expiryDate: card.expiryDate,
            usageCount: card.usageCount,
            lastUsed: card.lastUsed,
            blockedAt: card.blockedAt,
            blockedReason: card.blockedReason,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
        };
    }
}
exports.CardService = CardService;
exports.cardService = new CardService();
//# sourceMappingURL=card.service.js.map