import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';
import { ERROR_CODES } from '../config/constants';

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication',
        code: ERROR_CODES.AUTH_FAILED,
      });
    }
    
    req.user = user;
    req.token = token;
    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: ERROR_CODES.TOKEN_EXPIRED,
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: ERROR_CODES.INVALID_TOKEN,
    });
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }
    
    return next();
  };
}

export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status === 'active') {
        req.user = user;
        req.token = token;
      }
    }
    
    return next();
  } catch (error) {
    // Continue without authentication
    return next();
  }
}