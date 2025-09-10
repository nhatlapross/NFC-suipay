import { Request, Response, NextFunction } from 'express';
import { merchantService } from '../services/merchant.service';
import logger from '../utils/logger';

// Extend Request interface to include merchant data
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

export const authenticateMerchant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    // Extract API key from headers
    const authorization = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'] as string;
    
    let publicKey: string | undefined;
    let secretKey: string | undefined;

    // Support both Authorization header and X-API-Key header
    if (authorization) {
      logger.info('Processing authorization header:', {
        type: authorization.startsWith('Bearer ') ? 'Bearer' : authorization.startsWith('Basic ') ? 'Basic' : 'Unknown',
        length: authorization.length
      });
      
      // Format: "Bearer pk_xxx:sk_xxx" or "Basic base64(pk_xxx:sk_xxx)"
      if (authorization.startsWith('Bearer ')) {
        const credentials = authorization.substring(7);
        const [pk, sk] = credentials.split(':');
        publicKey = pk;
        secretKey = sk;
        
        logger.info('Extracted credentials from Bearer token:', {
          publicKeyLength: pk ? pk.length : 0,
          secretKeyLength: sk ? sk.length : 0,
          publicKeyStart: pk ? pk.substring(0, 10) + '...' : 'undefined',
          secretKeyStart: sk ? sk.substring(0, 10) + '...' : 'undefined'
        });
      } else if (authorization.startsWith('Basic ')) {
        const credentials = Buffer.from(authorization.substring(6), 'base64').toString();
        const [pk, sk] = credentials.split(':');
        publicKey = pk;
        secretKey = sk;
      }
    } else if (apiKeyHeader) {
      // Format: "pk_xxx:sk_xxx"
      const [pk, sk] = apiKeyHeader.split(':');
      publicKey = pk;
      secretKey = sk;
    }

    if (!publicKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid API credentials. Use Authorization header with Bearer pk_xxx:sk_xxx or X-API-Key header.'
      });
    }

    // Validate API key format
    if (!publicKey.startsWith('pk_') || !secretKey.startsWith('sk_')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format. Public key must start with pk_ and secret key with sk_'
      });
    }

    // Validate API key
    const validation = await merchantService.validateApiKey(publicKey, secretKey);
    
    if (!validation.isValid) {
      logger.warn('Invalid API key attempt', {
        publicKey: publicKey.substring(0, 10) + '...',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        error: validation.error
      });

      return res.status(401).json({
        success: false,
        error: validation.error || 'Invalid API credentials'
      });
    }

    // Check if merchant is active
    if (!validation.merchant?.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Merchant account is not active'
      });
    }

    // Check IP whitelist if configured
    if (validation.apiKey?.ipWhitelist && validation.apiKey.ipWhitelist.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress;
      const isWhitelisted = validation.apiKey.ipWhitelist.some((ip: string) => {
        if (ip.includes('/')) {
          // CIDR notation support would go here
          return false;
        }
        return ip === clientIP;
      });

      if (!isWhitelisted) {
        logger.warn('IP not whitelisted', {
          merchantId: validation.merchant.merchantId,
          clientIP,
          whitelist: validation.apiKey.ipWhitelist
        });

        return res.status(403).json({
          success: false,
          error: 'IP address not whitelisted for this API key'
        });
      }
    }

    // Attach merchant data to request
    req.merchant = {
      merchantId: validation.merchant.merchantId,
      merchant: validation.merchant,
      apiKey: validation.apiKey,
      permissions: validation.apiKey?.permissions || []
    };

    logger.info('Merchant authenticated', {
      merchantId: validation.merchant.merchantId,
      keyId: validation.apiKey?.keyId,
      ip: req.ip,
      endpoint: `${req.method} ${req.path}`
    });

    next();

  } catch (error) {
    logger.error('Merchant authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication service error'
    });
  }
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    if (!req.merchant) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasPermission = req.merchant.permissions.includes(permission) || 
                         req.merchant.permissions.includes('*');

    if (!hasPermission) {
      logger.warn('Permission denied', {
        merchantId: req.merchant.merchantId,
        requiredPermission: permission,
        userPermissions: req.merchant.permissions,
        endpoint: `${req.method} ${req.path}`
      });

      return res.status(403).json({
        success: false,
        error: `Permission denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

// Rate limiting per API key
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimitByApiKey = () => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    if (!req.merchant?.apiKey) {
      return next();
    }

    const apiKey = req.merchant.apiKey;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    
    const keyId = apiKey.keyId;
    const current = rateLimitStore.get(keyId);
    
    // Reset if window expired
    if (!current || now > current.resetTime) {
      rateLimitStore.set(keyId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    // Check rate limit
    const limit = apiKey.rateLimit?.requestsPerMinute || 60;
    
    if (current.count >= limit) {
      logger.warn('Rate limit exceeded', {
        merchantId: req.merchant.merchantId,
        keyId,
        count: current.count,
        limit
      });

      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        details: {
          limit,
          remaining: 0,
          resetTime: new Date(current.resetTime).toISOString()
        }
      });
    }

    // Increment counter
    current.count++;
    rateLimitStore.set(keyId, current);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': (limit - current.count).toString(),
      'X-RateLimit-Reset': new Date(current.resetTime).toISOString()
    });

    next();
  };
};

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes