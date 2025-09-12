"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const logger_1 = __importDefault(require("../utils/logger"));
const constants_1 = require("../config/constants");
function errorMiddleware(err, req, res, _next) {
    logger_1.default.error('Error:', {
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
            code: constants_1.ERROR_CODES.VALIDATION_ERROR,
            details: Object.values(err.errors).map((e) => e.message),
        });
    }
    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            error: `${field} already exists`,
            code: constants_1.ERROR_CODES.VALIDATION_ERROR,
        });
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            code: constants_1.ERROR_CODES.INVALID_TOKEN,
        });
    }
    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    const code = err.code || constants_1.ERROR_CODES.INTERNAL_ERROR;
    return res.status(statusCode).json({
        success: false,
        error: message,
        code,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}
//# sourceMappingURL=error.middleware.js.map