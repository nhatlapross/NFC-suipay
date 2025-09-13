"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.posController = exports.POSController = void 0;
const Card_model_1 = require("../models/Card.model");
const Merchant_model_1 = require("../models/Merchant.model");
const Transaction_model_1 = require("../models/Transaction.model");
const redis_config_1 = require("../config/redis.config");
const constants_1 = require("../config/constants");
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../utils/logger"));
// Helper function for auth methods
function getRequiredAuthMethods(amount, card) {
    const methods = [];
    // For blockchain testing, always require PIN for security
    if (amount < 500000) { // < 500k VND
        methods.push('PIN');
    }
    else { // >= 500k VND
        methods.push('PIN');
        if (amount > 1000000) { // > 1M VND
            methods.push('SIGNATURE');
        }
    }
    // Check card-specific requirements
    if (card.requiresPIN) {
        if (!methods.includes('PIN'))
            methods.push('PIN');
    }
    return methods;
}
// Helper function for amount formatting
function formatAmount(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
}
// Helper function for PIN verification
async function verifyPIN(user, pin) {
    try {
        if (!user.pinHash) {
            return false;
        }
        // Use the User model's comparePin method
        return await user.comparePin(pin);
    }
    catch (error) {
        logger_1.default.error('PIN verification error:', error);
        return false;
    }
}
class POSController {
    /**
     * Khởi tạo POS session sau khi NFC scan thành công
     * POST /payment/pos-initiate
     */
    async initiatePOSSession(req, res, _next) {
        const startTime = Date.now();
        const requestId = `pos_init_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        try {
            const { cardUuid, amount, merchantId, terminalId, authCode } = req.body;
            logger_1.default.info(`🏪 [${requestId}] POS session initiation started`, {
                cardUuid, amount, merchantId, terminalId
            });
            // Input validation
            if (!cardUuid || !amount || !merchantId || !terminalId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: cardUuid, amount, merchantId, terminalId',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                    requestId,
                });
            }
            // Verify authCode if provided (from nfc-validate)
            if (authCode) {
                const validationKey = `nfc_validation_${cardUuid}_${amount}`;
                const cachedValidation = await (0, redis_config_1.getCached)(validationKey);
                if (!cachedValidation || cachedValidation.authCode !== authCode) {
                    return res.status(401).json({
                        success: false,
                        error: 'Invalid or expired auth code',
                        code: constants_1.ERROR_CODES.UNAUTHORIZED,
                        requestId,
                    });
                }
            }
            // Find and validate card
            const card = await Card_model_1.Card.findOne({ cardUuid }).populate('userId');
            if (!card) {
                return res.status(404).json({
                    success: false,
                    error: 'Card not found',
                    code: constants_1.ERROR_CODES.INVALID_CARD,
                    requestId,
                });
            }
            // Validate card status
            if (!card.isActive || card.blockedAt) {
                return res.status(400).json({
                    success: false,
                    error: 'Card is blocked or inactive',
                    code: constants_1.ERROR_CODES.INVALID_CARD,
                    requestId,
                });
            }
            // Find and validate merchant
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant || !merchant.isActive) {
                return res.status(404).json({
                    success: false,
                    error: 'Invalid or inactive merchant',
                    code: constants_1.ERROR_CODES.INVALID_INPUT,
                    requestId,
                });
            }
            // Validate terminal belongs to merchant
            const terminal = merchant.terminals?.find(t => t.terminalId === terminalId);
            if (!terminal || !terminal.isActive) {
                return res.status(404).json({
                    success: false,
                    error: 'Invalid or inactive terminal',
                    code: constants_1.ERROR_CODES.INVALID_INPUT,
                    requestId,
                });
            }
            // Check spending limits
            const user = card.userId;
            const dailyLimit = card.dailyLimit || user.dailyLimit || constants_1.CONSTANTS.DAILY_AMOUNT_LIMIT;
            if (card.dailySpent + amount > dailyLimit) {
                return res.status(400).json({
                    success: false,
                    error: 'Daily limit exceeded',
                    code: constants_1.ERROR_CODES.LIMIT_EXCEEDED,
                    requestId,
                    details: {
                        dailySpent: card.dailySpent,
                        dailyLimit: dailyLimit,
                        requestedAmount: amount,
                    }
                });
            }
            // Generate POS session
            const sessionId = `pos_${Date.now()}_${(0, uuid_1.v4)().substr(0, 8)}`;
            // Determine authentication methods based on amount and card settings
            const authMethods = getRequiredAuthMethods(amount, card);
            // Create session data
            const sessionData = {
                sessionId,
                cardUuid,
                cardId: card._id,
                userId: user._id,
                amount,
                merchantId,
                terminalId,
                status: 'awaiting_auth',
                authMethods,
                authComplete: false,
                createdAt: Date.now(),
                expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
                requestId,
            };
            // Cache session data
            await (0, redis_config_1.setCached)(`pos_session_${sessionId}`, sessionData, 300); // 5 minutes TTL
            // Prepare display data for POS terminal
            const displayData = {
                cardHolder: user.fullName || 'Card Holder',
                cardNumber: `**** **** **** ${card.cardNumber?.substr(-4) || '****'}`,
                amount: formatAmount(amount),
                merchantName: merchant.merchantName,
                terminalName: terminal.terminalName || `Terminal ${terminalId}`,
                authMethods: authMethods,
                sessionTimeout: 300, // seconds
            };
            const processingTime = Date.now() - startTime;
            logger_1.default.info(`✅ [${requestId}] POS session created successfully - ${processingTime}ms`);
            return res.json({
                success: true,
                sessionId,
                displayData,
                authRequired: authMethods,
                processingTime,
                requestId,
                validUntil: new Date(sessionData.expiresAt),
            });
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            logger_1.default.error(`❌ [${requestId}] POS session initiation error (${processingTime}ms):`, error);
            console.error('POS session error details:', {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : 'No stack trace',
                cardUuid: req.body.cardUuid,
                merchantId: req.body.merchantId,
                terminalId: req.body.terminalId,
                amount: req.body.amount
            });
            return res.status(500).json({
                success: false,
                error: 'POS session creation failed',
                code: constants_1.ERROR_CODES.INTERNAL_ERROR,
                processingTime,
                requestId,
                debug: process.env.NODE_ENV === 'development' ? {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    cardUuid: req.body.cardUuid,
                    merchantId: req.body.merchantId,
                    terminalId: req.body.terminalId
                } : undefined
            });
        }
    }
    /**
     * Xác thực người dùng trên POS terminal (PIN/Signature)
     * POST /payment/pos-authenticate
     */
    async authenticatePOS(req, res, _next) {
        const startTime = Date.now();
        const requestId = `pos_auth_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        try {
            const { sessionId, authMethod, authData } = req.body;
            logger_1.default.info(`🔐 [${requestId}] POS authentication started`, { sessionId, authMethod });
            // Input validation
            if (!sessionId || !authMethod || !authData) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: sessionId, authMethod, authData',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                    requestId,
                });
            }
            // Get session data
            const session = await (0, redis_config_1.getCached)(`pos_session_${sessionId}`);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Session not found or expired',
                    code: constants_1.ERROR_CODES.SESSION_EXPIRED,
                    requestId,
                });
            }
            // Check session status
            if (session.status !== 'awaiting_auth') {
                return res.status(400).json({
                    success: false,
                    error: `Invalid session status: ${session.status}`,
                    code: constants_1.ERROR_CODES.INVALID_STATE,
                    requestId,
                });
            }
            // Check if auth method is required
            if (!session.authMethods.includes(authMethod)) {
                return res.status(400).json({
                    success: false,
                    error: `Authentication method ${authMethod} not required for this transaction`,
                    code: constants_1.ERROR_CODES.INVALID_INPUT,
                    requestId,
                });
            }
            // Get card and user data
            const card = await Card_model_1.Card.findById(session.cardId).populate('userId');
            if (!card) {
                return res.status(404).json({
                    success: false,
                    error: 'Card not found',
                    code: constants_1.ERROR_CODES.INVALID_CARD,
                    requestId,
                });
            }
            const user = card.userId;
            let authResult = false;
            // Perform authentication based on method
            switch (authMethod) {
                case 'PIN':
                    authResult = await verifyPIN(user, authData);
                    break;
                case 'SIGNATURE':
                    authResult = await this.verifySignature(user, authData);
                    break;
                case 'BIOMETRIC':
                    authResult = await this.verifyBiometric(user, authData);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: `Unsupported authentication method: ${authMethod}`,
                        code: constants_1.ERROR_CODES.INVALID_INPUT,
                        requestId,
                    });
            }
            if (!authResult) {
                // Log failed attempt
                logger_1.default.warn(`❌ [${requestId}] Authentication failed`, {
                    sessionId, authMethod, userId: user._id
                });
                return res.status(401).json({
                    success: false,
                    error: 'Authentication failed',
                    code: constants_1.ERROR_CODES.AUTH_FAILED,
                    requestId,
                });
            }
            // Update session with successful auth
            session.status = 'authenticated';
            session.authComplete = true;
            session.authenticatedAt = Date.now();
            session.authMethod = authMethod;
            // Extend session for payment completion
            session.expiresAt = Date.now() + (2 * 60 * 1000); // 2 minutes for payment
            // Save updated session
            await (0, redis_config_1.setCached)(`pos_session_${sessionId}`, session, 120);
            const processingTime = Date.now() - startTime;
            logger_1.default.info(`✅ [${requestId}] POS authentication successful - ${processingTime}ms`);
            return res.json({
                success: true,
                authenticated: true,
                authMethod: authMethod,
                readyForPayment: true,
                processingTime,
                requestId,
                paymentTimeout: 120, // seconds
            });
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            logger_1.default.error(`❌ [${requestId}] POS authentication error (${processingTime}ms):`, error);
            return res.status(500).json({
                success: false,
                error: 'Authentication service temporarily unavailable',
                code: constants_1.ERROR_CODES.INTERNAL_ERROR,
                processingTime,
                requestId,
            });
        }
    }
    /**
     * Lấy thông tin session POS
     * GET /payment/pos-session/:sessionId
     */
    async getPOSSession(req, res, _next) {
        try {
            const { sessionId } = req.params;
            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'Session ID is required',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            const session = await (0, redis_config_1.getCached)(`pos_session_${sessionId}`);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Session not found or expired',
                    code: constants_1.ERROR_CODES.SESSION_EXPIRED,
                });
            }
            // Return safe session info (without sensitive data)
            return res.json({
                success: true,
                session: {
                    sessionId: session.sessionId,
                    status: session.status,
                    amount: session.amount,
                    authMethods: session.authMethods,
                    authComplete: session.authComplete,
                    expiresAt: session.expiresAt,
                    timeRemaining: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)),
                }
            });
        }
        catch (error) {
            logger_1.default.error('POS session retrieval error:', error);
            return res.status(500).json({
                success: false,
                error: 'Session service temporarily unavailable',
                code: constants_1.ERROR_CODES.INTERNAL_ERROR,
            });
        }
    }
    // Helper methods
    async verifySignature(_user, signatureData) {
        try {
            // TODO: Implement signature verification logic
            // For now, just check if signature data is provided
            return signatureData && signatureData.length > 0;
        }
        catch (error) {
            logger_1.default.error('Signature verification error:', error);
            return false;
        }
    }
    async verifyBiometric(_user, biometricData) {
        try {
            // TODO: Implement biometric verification logic  
            // For now, just check if biometric data is provided
            return biometricData && biometricData.hash;
        }
        catch (error) {
            logger_1.default.error('Biometric verification error:', error);
            return false;
        }
    }
    /**
     * Hủy POS session
     * DELETE /pos/session/:sessionId
     */
    async cancelPOSSession(req, res, _next) {
        try {
            const { sessionId } = req.params;
            const { reason } = req.body;
            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'Session ID is required',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            const session = await (0, redis_config_1.getCached)(`pos_session_${sessionId}`);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Session not found or already expired',
                    code: constants_1.ERROR_CODES.SESSION_EXPIRED,
                });
            }
            // Update session status to cancelled
            session.status = 'cancelled';
            session.cancelledAt = Date.now();
            session.cancelReason = reason || 'User cancelled';
            // Save for audit trail before deleting
            await (0, redis_config_1.setCached)(`pos_session_cancelled_${sessionId}`, session, 3600); // Keep for 1 hour
            // Remove active session
            await (0, redis_config_1.setCached)(`pos_session_${sessionId}`, null, 0);
            logger_1.default.info(`🚫 POS session cancelled: ${sessionId}`, { reason });
            return res.json({
                success: true,
                message: 'POS session cancelled successfully',
                sessionId,
                cancelledAt: session.cancelledAt,
            });
        }
        catch (error) {
            logger_1.default.error('POS session cancellation error:', error);
            return res.status(500).json({
                success: false,
                error: 'Session cancellation service temporarily unavailable',
                code: constants_1.ERROR_CODES.INTERNAL_ERROR,
            });
        }
    }
    /**
     * Lấy thông tin terminal
     * GET /pos/terminal/:terminalId
     */
    async getTerminalInfo(req, res, _next) {
        try {
            const { terminalId } = req.params;
            const merchant = req.merchant;
            if (!terminalId) {
                return res.status(400).json({
                    success: false,
                    error: 'Terminal ID is required',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Find terminal in merchant's terminals
            const terminal = merchant.terminals?.find((t) => t.terminalId === terminalId);
            if (!terminal) {
                return res.status(404).json({
                    success: false,
                    error: 'Terminal not found or does not belong to this merchant',
                    code: constants_1.ERROR_CODES.NOT_FOUND,
                });
            }
            // Get terminal stats from cache or database
            const statsKey = `terminal_stats_${terminalId}`;
            let stats = await (0, redis_config_1.getCached)(statsKey);
            if (!stats) {
                // Calculate stats from transactions (placeholder logic)
                stats = {
                    todayTransactions: 0,
                    todayAmount: 0,
                    monthTransactions: 0,
                    monthAmount: 0,
                    lastTransaction: null,
                    uptime: '99.9%',
                };
                await (0, redis_config_1.setCached)(statsKey, stats, 3600); // Cache for 1 hour
            }
            return res.json({
                success: true,
                terminal: {
                    terminalId: terminal.terminalId,
                    terminalName: terminal.terminalName,
                    location: terminal.location,
                    terminalType: terminal.terminalType,
                    isActive: terminal.isActive,
                    features: terminal.features,
                    settings: terminal.settings,
                    createdAt: terminal.createdAt,
                    lastUsed: terminal.lastUsed,
                    stats,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get terminal info error:', error);
            return res.status(500).json({
                success: false,
                error: 'Terminal service temporarily unavailable',
                code: constants_1.ERROR_CODES.INTERNAL_ERROR,
            });
        }
    }
    /**
     * Đăng ký terminal mới
     * POST /pos/terminal/register
     */
    async registerTerminal(req, res, _next) {
        try {
            const { terminalId, terminalName, location, terminalType, features } = req.body;
            const merchantAuth = req.merchant;
            // Get merchant document from database (not from auth middleware)
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId: merchantAuth.merchantId });
            if (!merchant) {
                return res.status(404).json({
                    success: false,
                    error: 'Merchant not found',
                    code: constants_1.ERROR_CODES.NOT_FOUND,
                });
            }
            // Check if terminal already exists
            const existingTerminal = merchant.terminals?.find((t) => t.terminalId === terminalId);
            if (existingTerminal) {
                return res.status(409).json({
                    success: false,
                    error: 'Terminal ID already exists',
                    code: constants_1.ERROR_CODES.DUPLICATE_ENTRY,
                });
            }
            // Create new terminal object
            const newTerminal = {
                terminalId,
                terminalName: terminalName || `Terminal ${terminalId}`,
                location: location || 'Not specified',
                terminalType: terminalType || 'FIXED',
                features: features || ['NFC', 'PIN_PAD'],
                isActive: true,
                settings: {
                    maxAmount: 5000000, // 5M VND default
                    requireSignature: false,
                    requirePINAmount: 50000, // 50k VND
                    timeout: 300, // 5 minutes
                },
                createdAt: new Date(),
                lastUsed: undefined,
            };
            // Add terminal to merchant
            if (!merchant.terminals) {
                merchant.terminals = [];
            }
            merchant.terminals.push(newTerminal);
            // Save merchant
            await merchant.save();
            logger_1.default.info(`🖥️ New terminal registered: ${terminalId} for merchant ${merchant.merchantId}`);
            return res.json({
                success: true,
                message: 'Terminal registered successfully',
                terminal: newTerminal,
            });
        }
        catch (error) {
            logger_1.default.error('Terminal registration error:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Terminal registration service temporarily unavailable',
                code: constants_1.ERROR_CODES.INTERNAL_ERROR,
                stack: error instanceof Error ? error.stack : undefined
            });
        }
    }
    /**
     * Cập nhật terminal
     * PUT /pos/terminal/:terminalId
     */
    async updateTerminal(req, res, _next) {
        try {
            const { terminalId } = req.params;
            const updates = req.body;
            const merchant = req.merchant;
            // Find terminal
            const terminalIndex = merchant.terminals?.findIndex((t) => t.terminalId === terminalId);
            if (terminalIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Terminal not found',
                    code: constants_1.ERROR_CODES.NOT_FOUND,
                });
            }
            // Update terminal
            const terminal = merchant.terminals[terminalIndex];
            const allowedUpdates = ['terminalName', 'location', 'isActive', 'features', 'settings'];
            allowedUpdates.forEach(field => {
                if (updates[field] !== undefined) {
                    terminal[field] = updates[field];
                }
            });
            terminal.updatedAt = new Date();
            // Save merchant
            await merchant.save();
            logger_1.default.info(`🔧 Terminal updated: ${terminalId}`);
            return res.json({
                success: true,
                message: 'Terminal updated successfully',
                terminal,
            });
        }
        catch (error) {
            logger_1.default.error('Terminal update error:', error);
            return res.status(500).json({
                success: false,
                error: 'Terminal update service temporarily unavailable',
                code: constants_1.ERROR_CODES.INTERNAL_ERROR,
            });
        }
    }
    /**
     * Vô hiệu hóa terminal
     * DELETE /pos/terminal/:terminalId
     */
    async deactivateTerminal(req, res, _next) {
        try {
            const { terminalId } = req.params;
            const merchant = req.merchant;
            // Find terminal
            const terminal = merchant.terminals?.find((t) => t.terminalId === terminalId);
            if (!terminal) {
                return res.status(404).json({
                    success: false,
                    error: 'Terminal not found',
                    code: constants_1.ERROR_CODES.NOT_FOUND,
                });
            }
            // Deactivate terminal
            terminal.isActive = false;
            terminal.deactivatedAt = new Date();
            // Save merchant
            await merchant.save();
            logger_1.default.info(`❌ Terminal deactivated: ${terminalId}`);
            return res.json({
                success: true,
                message: 'Terminal deactivated successfully',
                terminalId,
                deactivatedAt: terminal.deactivatedAt,
            });
        }
        catch (error) {
            logger_1.default.error('Terminal deactivation error:', error);
            return res.status(500).json({
                success: false,
                error: 'Terminal deactivation service temporarily unavailable',
                code: constants_1.ERROR_CODES.INTERNAL_ERROR,
            });
        }
    }
    /**
     * Lấy danh sách giao dịch POS
     * GET /pos/transactions
     */
    async getPOSTransactions(req, res, _next) {
        try {
            const { terminalId, startDate, endDate, status, page = 1, limit = 20 } = req.query;
            const merchant = req.merchant;
            // Build query
            const query = { merchantId: merchant.merchantId };
            if (terminalId) {
                query.terminalId = terminalId;
            }
            if (startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }
            if (status) {
                query.status = status;
            }
            // Add POS-specific filter
            query.paymentMethod = 'NFC_POS';
            const skip = (parseInt(page) - 1) * parseInt(limit);
            // Get transactions (placeholder - would use actual Transaction model)
            const transactions = await Transaction_model_1.Transaction.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('cardId', 'cardNumber cardType')
                .populate('userId', 'fullName email');
            const total = await Transaction_model_1.Transaction.countDocuments(query);
            return res.json({
                success: true,
                transactions,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(total / parseInt(limit)),
                    count: transactions.length,
                    totalRecords: total,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get POS transactions error:', error);
            return res.status(500).json({
                success: false,
                error: 'Transaction service temporarily unavailable',
                code: constants_1.ERROR_CODES.INTERNAL_ERROR,
            });
        }
    }
    /**
     * Lấy thống kê POS
     * GET /pos/stats
     */
    async getPOSStats(req, res, _next) {
        try {
            const { terminalId, period = 'today' } = req.query;
            const merchant = req.merchant;
            let dateRange = {};
            const now = new Date();
            switch (period) {
                case 'today':
                    dateRange = {
                        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
                    };
                    break;
                case 'week':
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    dateRange = {
                        $gte: weekStart,
                        $lt: new Date(),
                    };
                    break;
                case 'month':
                    dateRange = {
                        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
                    };
                    break;
            }
            const query = {
                merchantId: merchant.merchantId,
                paymentMethod: 'NFC_POS',
                createdAt: dateRange,
            };
            if (terminalId) {
                query.terminalId = terminalId;
            }
            // Get aggregated stats (placeholder logic)
            const stats = await Transaction_model_1.Transaction.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalTransactions: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                        successfulTransactions: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                        },
                        failedTransactions: {
                            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
                        },
                        avgTransactionAmount: { $avg: '$amount' },
                    },
                },
            ]);
            const result = stats[0] || {
                totalTransactions: 0,
                totalAmount: 0,
                successfulTransactions: 0,
                failedTransactions: 0,
                avgTransactionAmount: 0,
            };
            // Calculate success rate
            result.successRate = result.totalTransactions > 0
                ? (result.successfulTransactions / result.totalTransactions) * 100
                : 0;
            // Get terminal-specific stats if requested
            let terminalStats = null;
            if (terminalId) {
                terminalStats = {
                    terminalId,
                    uptime: '99.9%', // Placeholder
                    lastTransaction: await Transaction_model_1.Transaction.findOne(query).sort({ createdAt: -1 }),
                };
            }
            return res.json({
                success: true,
                period,
                stats: result,
                terminalStats,
                generatedAt: new Date(),
            });
        }
        catch (error) {
            logger_1.default.error('Get POS stats error:', error);
            return res.status(500).json({
                success: false,
                error: 'Statistics service temporarily unavailable',
                code: constants_1.ERROR_CODES.INTERNAL_ERROR,
            });
        }
    }
}
exports.POSController = POSController;
exports.posController = new POSController();
//# sourceMappingURL=pos.controller.js.map