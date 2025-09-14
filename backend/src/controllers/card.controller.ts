import { Request, Response, NextFunction } from "express";
import { cardService } from "../services/card.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { Card } from "../models/Card.model";
import logger from "../utils/logger";

export class CardController {
    async createCard(
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
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

            const card = await cardService.createCard(userId, cardData);

            logger.info("Card created successfully", {
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
        } catch (error) {
            logger.error("Error creating card:", error);
            if (error instanceof Error && error.message === "User not found") {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                });
            }
            next(error);
        }
    }

    async getUserCards(
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User authentication required",
                });
            }

            const { status, type } = req.query as {
                status?: string;
                type?: string;
            };

            const cards = await cardService.getUserCards(userId, {
                status,
                type,
            });

            return res.json({
                success: true,
                data: { cards },
            });
        } catch (error) {
            next(error);
        }
    }

    async getCard(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        } catch (error) {
            next(error);
        }
    }

    async updateCard(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteCard(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        } catch (error) {
            next(error);
        }
    }

    async activateCard(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        } catch (error) {
            next(error);
        }
    }

    async deactivateCard(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        } catch (error) {
            next(error);
        }
    }

    async blockCard(
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
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
            const card = await Card.findOne({
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
            if (!card.metadata) card.metadata = {};
            card.metadata.blockedBy = userId;
            await card.save();

            console.log('✅ [CardController] Card blocked successfully:', {
                cardId: card.cardUuid,
                isActive: card.isActive,
                blockedAt: card.blockedAt,
                blockedReason: card.blockedReason,
                userId
            });

            logger.info("Card blocked by user", {
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
        } catch (error) {
            console.log('💥 [CardController] Block card error:', error);
            logger.error("Error blocking card:", error);
            next(error);
        }
    }

    async unblockCard(
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
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
            const card = await Card.findOne({
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
            if (!card.metadata) card.metadata = {};
            card.metadata.unblockedBy = userId;
            card.metadata.unblockedAt = new Date();
            await card.save();

            console.log('✅ [CardController] Card unblocked successfully:', {
                cardId: card.cardUuid,
                isActive: card.isActive,
                unblockedAt: card.metadata.unblockedAt,
                userId
            });

            logger.info("Card unblocked by user", {
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
        } catch (error) {
            console.log('💥 [CardController] Unblock card error:', error);
            logger.error("Error unblocking card:", error);
            next(error);
        }
    }

    async setPrimaryCard(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        } catch (error) {
            next(error);
        }
    }

    async updateCardLimits(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        } catch (error) {
            next(error);
        }
    }

    async resetCardLimits(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        } catch (error) {
            next(error);
        }
    }

    async getCardTransactions(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        } catch (error) {
            next(error);
        }
    }

    async getCardStats(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllCards(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            const { page = 1, limit = 20, status, type, userId } = req.query as {
                page?: string;
                limit?: string;
                status?: string;
                type?: string;
                userId?: string;
            };

            const pageNum = parseInt(page as string) || 1;
            const limitNum = parseInt(limit as string) || 20;
            const skip = (pageNum - 1) * limitNum;

            // Build query
            const query: any = {};
            if (status) {
                if (status === 'active') {
                    query.isActive = true;
                    query.blockedAt = { $exists: false };
                } else if (status === 'blocked') {
                    query.blockedAt = { $exists: true };
                } else if (status === 'inactive') {
                    query.isActive = false;
                    query.blockedAt = { $exists: false };
                }
            }
            if (type) {
                query.cardType = type;
            }
            if (userId) {
                query.userId = userId;
            }

            // Get cards with user info
            const cards = await Card.find(query)
                .populate('userId', 'fullName email phoneNumber')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean();

            const total = await Card.countDocuments(query);

            // Format response
            const formattedCards = cards.map(card => ({
                id: card._id,
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
                user: card.userId ? {
                    id: card.userId._id,
                    fullName: (card.userId as any).fullName,
                    email: (card.userId as any).email,
                    phoneNumber: (card.userId as any).phoneNumber
                } : null
            }));

            res.json({
                success: true,
                data: {
                    cards: formattedCards,
                    pagination: {
                        current: pageNum,
                        total: Math.ceil(total / limitNum),
                        count: total,
                        limit: limitNum
                    }
                }
            });
        } catch (error) {
            logger.error("Error getting all cards:", error);
            next(error);
        }
    }

    async forceBlockCard(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> {
        try {
            res.json({
                success: true,
                message: "Card controller method not implemented yet",
            });
        } catch (error) {
            next(error);
        }
    }
}

export const cardController = new CardController();
