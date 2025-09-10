"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = require("../models/User.model");
const constants_1 = require("../config/constants");
async function authenticate(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: constants_1.ERROR_CODES.UNAUTHORIZED,
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_model_1.User.findById(decoded.userId).select('-password');
        if (!user || user.status !== 'active') {
            return res.status(401).json({
                success: false,
                error: 'Invalid authentication',
                code: constants_1.ERROR_CODES.AUTH_FAILED,
            });
        }
        req.user = user;
        req.token = token;
        return next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                code: constants_1.ERROR_CODES.TOKEN_EXPIRED,
            });
        }
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            code: constants_1.ERROR_CODES.INVALID_TOKEN,
        });
    }
}
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: constants_1.ERROR_CODES.UNAUTHORIZED,
            });
        }
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                code: constants_1.ERROR_CODES.UNAUTHORIZED,
            });
        }
        return next();
    };
}
async function optionalAuth(req, _res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await User_model_1.User.findById(decoded.userId).select('-password');
            if (user && user.status === 'active') {
                req.user = user;
                req.token = token;
            }
        }
        return next();
    }
    catch (error) {
        // Continue without authentication
        return next();
    }
}
//# sourceMappingURL=auth.middleware.js.map