import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ERROR_CODES } from '../config/constants';

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      code: ERROR_CODES.VALIDATION_ERROR,
      details: Object.values(err.errors).map((e: any) => e.message),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      error: `${field} already exists`,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: ERROR_CODES.INVALID_TOKEN,
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || ERROR_CODES.INTERNAL_ERROR;

  return res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}