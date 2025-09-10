import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    register(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    login(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    logout(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    refreshToken(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    forgotPassword(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    resetPassword(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    changePassword(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    enable2FA(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    disable2FA(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    verify2FA(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    resendOtp(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map