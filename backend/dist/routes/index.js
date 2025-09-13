"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const wallet_routes_1 = __importDefault(require("./wallet.routes"));
const card_routes_1 = __importDefault(require("./card.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const merchant_routes_1 = __importDefault(require("./merchant.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const pos_routes_1 = __importDefault(require("./pos.routes"));
const router = (0, express_1.Router)();
// Health check
router.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'NFC Payment API v1.0',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            payment: '/api/payment',
            wallet: '/api/wallet',
            card: '/api/card',
            user: '/api/user',
            merchant: '/api/merchant',
            admin: '/api/admin',
            pos: '/api/pos',
        },
    });
});
// API routes
router.use('/auth', auth_routes_1.default);
router.use('/payment', payment_routes_1.default);
router.use('/wallet', wallet_routes_1.default);
router.use('/card', card_routes_1.default);
router.use('/user', user_routes_1.default);
router.use('/merchant', merchant_routes_1.default);
router.use('/admin', admin_routes_1.default);
router.use('/pos', pos_routes_1.default);
// 404 handler for API routes
router.use('*', (_req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map