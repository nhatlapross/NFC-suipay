import { Request, Response, NextFunction } from "express";
export declare class PaymentController {
    createPaymentIntent(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    confirmPayment(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    validatePayment(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    validateNFCPayment(req: Request, res: Response, _next: NextFunction): Promise<void | Response>;
    processNFCPaymentAsync(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    processNFCPaymentDirect(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    processPayment(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    private verifyUserPin;
    signTransaction(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    completePayment(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getTransactionHistory(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getTransaction(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    refundTransaction(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getPaymentStats(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    cancelPayment(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    createMerchantPaymentRequest(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getMerchantPaymentRequest(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    retryPayment(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getPaymentMethods(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getTransactionReceipt(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    validateTransaction(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
}
export declare const paymentController: PaymentController;
//# sourceMappingURL=payment.controller.d.ts.map