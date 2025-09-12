import { Request, Response, NextFunction } from 'express';
export declare class FastPaymentController {
    /**
     * ULTRA FAST NFC VALIDATION - TARGET < 100ms
     *
     * This endpoint is the heart of NFC performance optimization
     * It uses Redis Cloud for aggressive caching and parallel processing
     */
    fastValidate(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
    /**
     * Validate Card Status with Caching
     */
    private validateCard;
    /**
     * Validate Transaction Limits with Caching
     */
    private validateLimits;
    /**
     * Validate Fraud Risk with Caching
     */
    private validateFraud;
    /**
     * Generate Authorization Code
     */
    private generateAuthCode;
    /**
     * Pre-warm Cache for Active Cards
     * Call this endpoint periodically to maintain cache performance
     */
    preWarmCache(_req: Request, res: Response): Promise<void | Response>;
    /**
     * Get Cache Statistics
     */
    getCacheStats(_req: Request, res: Response): Promise<void | Response>;
    private getRedisStats;
    private getPerformanceStats;
}
export declare const fastPaymentController: FastPaymentController;
//# sourceMappingURL=fastPayment.controller.d.ts.map