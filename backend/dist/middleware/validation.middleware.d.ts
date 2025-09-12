import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
export declare function validate(validations: ValidationChain[]): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=validation.middleware.d.ts.map