import { Request, Response, NextFunction } from 'express';
export declare class WalletController {
    createWallet(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getWalletBalance(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getOwnedObjects(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    transferSUI(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    importWallet(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    exportWallet(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    requestFromFaucet(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getTransactionHistory(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getWalletInfo(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
}
export declare const walletController: WalletController;
//# sourceMappingURL=wallet.controller.d.ts.map