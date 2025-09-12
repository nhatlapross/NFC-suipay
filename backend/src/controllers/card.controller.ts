import { Request, Response, NextFunction } from "express";
import { cardService } from "../services/card.service";
import { AuthRequest } from "../middleware/auth.middleware";
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

    async unblockCard(
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
