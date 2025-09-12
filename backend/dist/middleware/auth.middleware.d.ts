import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: any;
    token?: string;
}
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
export declare function authorize(...roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map