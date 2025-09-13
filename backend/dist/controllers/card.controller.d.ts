import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
export declare class CardController {
    createCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
    getUserCards(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
    getCard(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    updateCard(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    deleteCard(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    activateCard(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    deactivateCard(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    blockCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
    unblockCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
    setPrimaryCard(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    updateCardLimits(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    resetCardLimits(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getCardTransactions(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getCardStats(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getAllCards(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    forceBlockCard(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
}
export declare const cardController: CardController;
//# sourceMappingURL=card.controller.d.ts.map