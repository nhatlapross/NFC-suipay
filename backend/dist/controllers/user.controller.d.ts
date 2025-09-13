import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class UserController {
    getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
    updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
    deleteAccount(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
    updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
    getLimits(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    updateLimits(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    setPin(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
    changePin(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
    verifyPin(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
    getKYCStatus(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    submitKYC(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    updateKYC(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getNotifications(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    markNotificationAsRead(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    deleteNotification(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getActiveSessions(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    terminateSession(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    terminateAllSessions(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getUserStats(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getActivity(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    getUserById(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    updateUserStatus(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    updateUserLimits(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    approveKYC(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    rejectKYC(_req: Request, res: Response, next: NextFunction): Promise<void | Response>;
}
export declare const userController: UserController;
//# sourceMappingURL=user.controller.d.ts.map