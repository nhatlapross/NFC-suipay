import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            merchant?: {
                merchantId: string;
                merchant: any;
                apiKey: any;
                permissions: string[];
            };
        }
    }
}
export interface AuthenticatedRequest extends Request {
    merchant: {
        merchantId: string;
        merchant: any;
        apiKey: any;
        permissions: string[];
    };
}
export declare const authenticateMerchant: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;
export declare const requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => void | Response;
export declare const rateLimitByApiKey: () => (req: Request, res: Response, next: NextFunction) => void | Response;
//# sourceMappingURL=merchantAuth.middleware.d.ts.map