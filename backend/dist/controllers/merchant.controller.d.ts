import { Request, Response, NextFunction } from "express";
export declare class MerchantController {
    getPublicMerchantInfo(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    registerMerchant(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getMerchantProfile(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    updateMerchantProfile(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getMerchantPayments(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getMerchantPaymentStats(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    refundPayment(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getMerchantSettings(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    updateMerchantSettings(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getWebhooks(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    createWebhook(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    updateWebhook(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    deleteWebhook(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getApiKeys(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    createApiKey(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    deleteApiKey(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getAllMerchants(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    updateMerchantStatus(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    updateMerchantLimits(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
}
export declare const merchantController: MerchantController;
//# sourceMappingURL=merchant.controller.d.ts.map