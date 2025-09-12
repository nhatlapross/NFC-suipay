"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.PaymentController = void 0;
const payment_service_1 = require("../services/payment.service");
const constants_1 = require("../config/constants");
const Card_model_1 = require("../models/Card.model");
const User_model_1 = require("../models/User.model");
const Merchant_model_1 = require("../models/Merchant.model");
const Transaction_model_1 = require("../models/Transaction.model");
const redis_config_1 = require("../config/redis.config");
const sui_config_1 = require("../config/sui.config");
const queue_config_1 = require("../config/queue.config");
const socket_service_1 = require("../services/socket.service");
const uuid_1 = require("uuid");
const transactions_1 = require("@mysten/sui/transactions");
const ed25519_1 = require("@mysten/sui/keypairs/ed25519");
const logger_1 = __importDefault(require("../utils/logger"));
const paymentService = new payment_service_1.PaymentService();
class PaymentController {
    async validatePayment(req, res, next) {
        try {
            const { cardUuid, amount, merchantId } = req.body;
            const user = req.user;
            // User authentication check
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: constants_1.ERROR_CODES.UNAUTHORIZED,
                });
            }
            // Input validation
            if (!cardUuid || !amount || !merchantId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: cardUuid, amount, merchantId',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Amount validation
            if (typeof amount !== 'number' || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid amount',
                    code: constants_1.ERROR_CODES.INVALID_INPUT,
                });
            }
            if (amount < constants_1.CONSTANTS.MIN_TRANSACTION_AMOUNT) {
                return res.status(400).json({
                    success: false,
                    error: `Minimum amount is ${constants_1.CONSTANTS.MIN_TRANSACTION_AMOUNT} SUI`,
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            if (amount > constants_1.CONSTANTS.MAX_TRANSACTION_AMOUNT) {
                return res.status(400).json({
                    success: false,
                    error: `Maximum amount is ${constants_1.CONSTANTS.MAX_TRANSACTION_AMOUNT} SUI`,
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Validate card existence and ownership
            const card = await Card_model_1.Card.findOne({ cardUuid, userId: user._id });
            if (!card) {
                return res.status(404).json({
                    success: false,
                    error: 'Card not found or not owned by user',
                    code: constants_1.ERROR_CODES.INVALID_CARD,
                });
            }
            // Validate card status
            if (!card.isActive) {
                return res.status(400).json({
                    success: false,
                    error: 'Card is not active',
                    code: constants_1.ERROR_CODES.INVALID_CARD,
                });
            }
            if (card.blockedAt) {
                return res.status(400).json({
                    success: false,
                    error: `Card is blocked: ${card.blockedReason || 'Unknown reason'}`,
                    code: constants_1.ERROR_CODES.INVALID_CARD,
                });
            }
            // Check if card is expired
            if (card.expiryDate < new Date()) {
                return res.status(400).json({
                    success: false,
                    error: 'Card has expired',
                    code: constants_1.ERROR_CODES.INVALID_CARD,
                });
            }
            // Validate merchant
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant || !merchant.isActive) {
                return res.status(404).json({
                    success: false,
                    error: 'Invalid or inactive merchant',
                    code: constants_1.ERROR_CODES.INVALID_INPUT,
                });
            }
            // Check spending limits
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (card.lastResetDate < today) {
                // Reset daily spending if needed
                card.dailySpent = 0;
                if (card.lastResetDate.getMonth() !== today.getMonth()) {
                    card.monthlySpent = 0;
                }
                card.lastResetDate = today;
                await card.save();
            }
            if (card.dailySpent + amount > user.dailyLimit) {
                return res.status(400).json({
                    success: false,
                    error: 'Daily spending limit exceeded',
                    code: constants_1.ERROR_CODES.LIMIT_EXCEEDED,
                    details: {
                        currentDaily: card.dailySpent,
                        dailyLimit: user.dailyLimit,
                        requestedAmount: amount,
                    },
                });
            }
            if (card.monthlySpent + amount > user.monthlyLimit) {
                return res.status(400).json({
                    success: false,
                    error: 'Monthly spending limit exceeded',
                    code: constants_1.ERROR_CODES.LIMIT_EXCEEDED,
                    details: {
                        currentMonthly: card.monthlySpent,
                        monthlyLimit: user.monthlyLimit,
                        requestedAmount: amount,
                    },
                });
            }
            // Check wallet balance
            try {
                const balance = await (0, sui_config_1.getSuiClient)().getBalance({
                    owner: user.walletAddress,
                    coinType: '0x2::sui::SUI',
                });
                const walletBalanceInSui = parseFloat(balance.totalBalance) / 1_000_000_000;
                const totalRequired = amount + (constants_1.CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000);
                if (walletBalanceInSui < totalRequired) {
                    return res.status(400).json({
                        success: false,
                        error: 'Insufficient wallet balance',
                        code: constants_1.ERROR_CODES.INSUFFICIENT_BALANCE,
                        details: {
                            walletBalance: walletBalanceInSui,
                            requiredAmount: totalRequired,
                            transactionAmount: amount,
                            estimatedGasFee: constants_1.CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000,
                        },
                    });
                }
            }
            catch (error) {
                logger_1.default.error('Error checking wallet balance:', error);
                return res.status(503).json({
                    success: false,
                    error: 'Unable to verify wallet balance',
                    code: constants_1.ERROR_CODES.BLOCKCHAIN_ERROR,
                });
            }
            res.json({
                success: true,
                message: 'Payment validation successful',
                data: {
                    walletAddress: user.walletAddress,
                    cardInfo: {
                        cardType: card.cardType,
                        lastUsed: card.lastUsed,
                        dailySpent: card.dailySpent,
                        monthlySpent: card.monthlySpent,
                    },
                    merchantInfo: {
                        merchantName: merchant.merchantName,
                        walletAddress: merchant.walletAddress,
                    },
                    transactionDetails: {
                        amount,
                        estimatedGasFee: constants_1.CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000,
                        totalAmount: amount + (constants_1.CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Payment validation error:', error);
            next(error);
        }
    }
    // NFC validation without authentication - for terminal use
    async validateNFCPayment(req, res, _next) {
        const startTime = Date.now();
        const requestId = `nfc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        try {
            const { cardUuid, amount, merchantId, terminalId } = req.body;
            logger_1.default.info(`🔍 [${requestId}] NFC validation started`, { cardUuid, amount, merchantId });
            // Input validation
            if (!cardUuid || !amount || !merchantId) {
                const processingTime = Date.now() - startTime;
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: cardUuid, amount, merchantId',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                    processingTime,
                    requestId,
                });
            }
            // Check cache first for fast response
            const validationKey = redis_config_1.NFCCacheKeys.fastValidation(cardUuid, amount);
            const cached = await (0, redis_config_1.getCached)(validationKey);
            if (cached && cached.expiresAt > Date.now()) {
                const processingTime = Date.now() - startTime;
                logger_1.default.info(`✅ [${requestId}] Cache hit - ${processingTime}ms`);
                return res.json({
                    success: true,
                    authorized: cached.authorized,
                    authCode: cached.authCode,
                    processingTime,
                    fromCache: true,
                    requestId
                });
            }
            // Find card without requiring user authentication
            const card = await Card_model_1.Card.findOne({ cardUuid }).populate('userId');
            if (!card) {
                const processingTime = Date.now() - startTime;
                await (0, redis_config_1.setCached)(validationKey, { authorized: false, reason: 'CARD_NOT_FOUND', expiresAt: Date.now() + 30000 }, 30);
                return res.status(404).json({
                    success: false,
                    authorized: false,
                    error: 'Card not found',
                    code: constants_1.ERROR_CODES.INVALID_CARD,
                    processingTime,
                    requestId,
                });
            }
            // Check card status
            if (!card.isActive || card.blockedAt) {
                const processingTime = Date.now() - startTime;
                await (0, redis_config_1.setCached)(validationKey, { authorized: false, reason: 'CARD_BLOCKED', expiresAt: Date.now() + 30000 }, 30);
                return res.status(400).json({
                    success: false,
                    authorized: false,
                    error: 'Card is blocked or inactive',
                    code: constants_1.ERROR_CODES.INVALID_CARD,
                    processingTime,
                    requestId,
                });
            }
            // Verify merchant
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant || !merchant.isActive) {
                const processingTime = Date.now() - startTime;
                return res.status(404).json({
                    success: false,
                    authorized: false,
                    error: 'Invalid merchant',
                    code: constants_1.ERROR_CODES.INVALID_INPUT,
                    processingTime,
                    requestId,
                });
            }
            // Check spending limits
            const user = card.userId;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (card.dailySpent + amount > (card.dailyLimit || user.dailyLimit || constants_1.CONSTANTS.DAILY_AMOUNT_LIMIT)) {
                const processingTime = Date.now() - startTime;
                await (0, redis_config_1.setCached)(validationKey, { authorized: false, reason: 'DAILY_LIMIT', expiresAt: Date.now() + 30000 }, 30);
                return res.status(400).json({
                    success: false,
                    authorized: false,
                    error: 'Daily limit exceeded',
                    code: constants_1.ERROR_CODES.LIMIT_EXCEEDED,
                    processingTime,
                    requestId,
                    details: {
                        dailySpent: card.dailySpent,
                        dailyLimit: card.dailyLimit || user.dailyLimit,
                        requestedAmount: amount,
                    }
                });
            }
            // Amount validation
            if (amount > constants_1.CONSTANTS.MAX_TRANSACTION_AMOUNT) {
                const processingTime = Date.now() - startTime;
                return res.status(400).json({
                    success: false,
                    authorized: false,
                    error: `Maximum amount is ${constants_1.CONSTANTS.MAX_TRANSACTION_AMOUNT} SUI`,
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                    processingTime,
                    requestId,
                });
            }
            // Generate auth code
            const authCode = `NFC_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
            // Cache successful validation
            const result = {
                authorized: true,
                authCode,
                expiresAt: Date.now() + 30000, // 30 seconds
                cardInfo: {
                    cardType: card.cardType,
                    lastUsed: card.lastUsed,
                    remainingDaily: (card.dailyLimit || user.dailyLimit) - card.dailySpent,
                },
                merchantInfo: {
                    merchantName: merchant.merchantName,
                    terminalId: terminalId,
                }
            };
            await (0, redis_config_1.setCached)(validationKey, result, 30);
            const processingTime = Date.now() - startTime;
            logger_1.default.info(`✅ [${requestId}] NFC validation successful - ${processingTime}ms`);
            res.json({
                success: true,
                authorized: true,
                authCode,
                processingTime,
                fromCache: false,
                requestId,
                validUntil: new Date(result.expiresAt),
                details: result.cardInfo,
                merchant: result.merchantInfo,
            });
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            logger_1.default.error(`❌ [${requestId}] NFC validation error (${processingTime}ms):`, error);
            res.status(500).json({
                success: false,
                authorized: false,
                error: 'Validation service temporarily unavailable',
                code: constants_1.ERROR_CODES.INTERNAL_ERROR,
                processingTime,
                requestId,
                fallback: true,
            });
        }
    }
    async processNFCPaymentAsync(req, res, next) {
        try {
            const { cardUuid, amount, merchantId, terminalId } = req.body;
            const user = req.user;
            // Input validation
            if (!cardUuid || !amount || !merchantId || !terminalId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Check if user has a wallet address
            if (!user.walletAddress) {
                // For testing purposes, use a default wallet address
                // In production, this should prompt user to set up their wallet
                user.walletAddress = '0xdefault_user_wallet_' + user._id;
            }
            // Quick pre-validation using cache
            const validationKey = redis_config_1.NFCCacheKeys.fastValidation(cardUuid, amount);
            const cachedValidation = await (0, redis_config_1.getCached)(validationKey);
            if (cachedValidation === false) {
                return res.status(400).json({
                    success: false,
                    error: 'Payment validation failed',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Find merchant by merchantId string
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid merchant',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Generate transaction ID
            const transactionId = (0, uuid_1.v4)();
            // Calculate gas fee (example: 0.001 SUI)
            const gasFee = 0.001;
            const totalAmount = amount + gasFee;
            // Create pending transaction for immediate response
            await Transaction_model_1.Transaction.create({
                transactionId,
                userId: user._id,
                cardUuid,
                txHash: 'pending_' + transactionId, // Temporary hash for pending transaction
                type: 'payment',
                amount,
                currency: 'SUI',
                status: 'pending',
                merchantId: merchant._id, // Use the MongoDB ObjectId
                merchantName: merchant.merchantName,
                terminalId,
                fromAddress: user.walletAddress,
                toAddress: merchant.walletAddress, // Add merchant wallet address
                gasFee,
                totalAmount, // Add calculated total
                metadata: {
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.headers['user-agent'],
                    timestamp: new Date(),
                    merchantIdString: merchantId, // Store original merchantId string for reference
                    terminalId,
                },
            });
            // Add to processing queue
            const job = await queue_config_1.paymentQueue.add('processNFCPayment', {
                transactionId,
                paymentData: {
                    cardUuid,
                    amount,
                    merchantId: merchant._id.toString(),
                    merchantWalletAddress: merchant.walletAddress,
                    terminalId,
                    userId: user.id,
                    userWalletAddress: user.walletAddress,
                    gasFee,
                    totalAmount,
                },
            }, {
                priority: amount > 1000000 ? 5 : 10, // Higher priority for large amounts
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });
            // Connect user to socket for real-time updates
            socket_service_1.socketService.addUserSocket(user.id, req.headers['x-socket-id'] || '');
            logger_1.default.info(`Async payment initiated`, {
                transactionId,
                jobId: job.id,
                userId: user.id,
                amount,
            });
            // Return immediate response
            res.status(202).json({
                success: true,
                message: 'Payment processing initiated',
                transactionId,
                status: 'pending',
                estimatedProcessingTime: '2-5 seconds',
                tracking: {
                    jobId: job.id,
                    transactionId,
                    websocketChannel: `user:${user.id}`,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Async payment initiation error:', error);
            next(error);
        }
    }
    async processNFCPaymentDirect(req, res, next) {
        try {
            const { cardUuid, amount, merchantId, terminalId } = req.body;
            const user = req.user;
            // Input validation
            if (!cardUuid || !amount || !merchantId || !terminalId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Check if user has a wallet address
            if (!user.walletAddress) {
                user.walletAddress = '0xdefault_user_wallet_' + user._id;
            }
            // Find merchant by merchantId string
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid merchant',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Generate transaction ID
            const transactionId = (0, uuid_1.v4)();
            // Calculate gas fee
            const gasFee = 0.001;
            const totalAmount = amount + gasFee;
            // Create transaction record
            const transaction = await Transaction_model_1.Transaction.create({
                transactionId,
                userId: user._id,
                cardUuid,
                txHash: 'pending_' + transactionId,
                type: 'payment',
                amount,
                currency: 'SUI',
                status: 'processing',
                merchantId: merchant._id,
                merchantName: merchant.merchantName,
                terminalId,
                fromAddress: user.walletAddress,
                toAddress: merchant.walletAddress,
                gasFee,
                totalAmount,
                metadata: {
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.headers['user-agent'],
                    timestamp: new Date(),
                    merchantIdString: merchantId,
                    terminalId,
                },
            });
            // Process directly (like the successful test script)
            const userWithKey = await User_model_1.User.findById(user._id).select('+encryptedPrivateKey');
            if (!userWithKey || !userWithKey.encryptedPrivateKey) {
                throw new Error('User wallet not configured');
            }
            // Process blockchain transaction directly
            let keypair;
            if (userWithKey.encryptedPrivateKey.startsWith('suiprivkey1')) {
                keypair = ed25519_1.Ed25519Keypair.fromSecretKey(userWithKey.encryptedPrivateKey);
            }
            else {
                throw new Error('Private key format not supported');
            }
            const amountInMist = Math.floor(amount * 1_000_000_000);
            const tx = new transactions_1.Transaction();
            tx.setSender(user.walletAddress);
            const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);
            tx.transferObjects([paymentCoin], tx.pure.address(merchant.walletAddress));
            tx.setGasBudget(10000000);
            const suiClient = (0, sui_config_1.getSuiClient)();
            const result = await suiClient.signAndExecuteTransaction({
                transaction: tx,
                signer: keypair,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showEvents: true,
                },
            });
            await suiClient.waitForTransaction({
                digest: result.digest,
                options: { showEffects: true },
            });
            const actualGasFee = Number(result.effects?.gasUsed?.computationCost || 0) / 1_000_000_000;
            // Update transaction with success
            transaction.status = 'completed';
            transaction.txHash = result.digest;
            transaction.gasFee = actualGasFee;
            transaction.totalAmount = amount + actualGasFee;
            transaction.completedAt = new Date();
            await transaction.save();
            res.json({
                success: true,
                message: 'Payment completed successfully',
                transaction: {
                    transactionId,
                    txHash: result.digest,
                    amount,
                    gasFee: actualGasFee,
                    totalAmount: amount + actualGasFee,
                    status: 'completed',
                    explorerUrl: `https://suiscan.xyz/${process.env.SUI_NETWORK || 'testnet'}/tx/${result.digest}`,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Direct payment error:', error);
            next(error);
        }
    }
    async processPayment(req, res, next) {
        try {
            const { cardUuid, amount, merchantId, pin } = req.body;
            const user = req.user;
            // Input validation
            if (!cardUuid || !amount || !merchantId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // PIN verification for high-value transactions
            if (amount > constants_1.CONSTANTS.DAILY_AMOUNT_LIMIT / 10) { // 10% of daily limit
                if (!pin) {
                    return res.status(400).json({
                        success: false,
                        error: 'PIN required for high-value transactions',
                        code: constants_1.ERROR_CODES.AUTH_FAILED,
                    });
                }
                // Verify PIN (implement PIN verification logic)
                const isPinValid = await this.verifyUserPin(user.id, pin);
                if (!isPinValid) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid PIN',
                        code: constants_1.ERROR_CODES.AUTH_FAILED,
                    });
                }
            }
            // Rate limiting check
            const rateLimitKey = `payment_rate_${user.id}`;
            const recentTransactions = await (0, redis_config_1.getCached)(rateLimitKey) || 0;
            if (recentTransactions >= constants_1.CONSTANTS.DAILY_TRANSACTION_LIMIT) {
                return res.status(429).json({
                    success: false,
                    error: 'Daily transaction limit exceeded',
                    code: constants_1.ERROR_CODES.LIMIT_EXCEEDED,
                });
            }
            // Prepare transaction metadata
            const metadata = {
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'],
                device: req.headers['x-device-id'],
                location: req.headers['x-location'],
                timestamp: new Date().toISOString(),
                apiVersion: '1.0',
            };
            logger_1.default.info(`Processing payment: ${cardUuid} -> ${merchantId}, amount: ${amount}`, {
                userId: user.id,
                metadata,
            });
            // Process payment through service
            const transaction = await paymentService.processPayment(cardUuid, amount, merchantId, metadata);
            // Update rate limiting counter
            await (0, redis_config_1.setCached)(rateLimitKey, recentTransactions + 1, 24 * 60 * 60); // 24 hours TTL
            // Log successful transaction
            logger_1.default.info(`Payment processed successfully: ${transaction._id}`, {
                txId: transaction._id,
                txHash: transaction.txHash,
                userId: user.id,
                amount,
                status: transaction.status,
            });
            res.json({
                success: true,
                message: 'Payment processed successfully',
                transaction: {
                    id: transaction._id,
                    txHash: transaction.txHash,
                    amount: transaction.amount,
                    totalAmount: transaction.totalAmount,
                    gasFee: transaction.gasFee,
                    status: transaction.status,
                    merchantName: transaction.merchantName,
                    timestamp: transaction.createdAt,
                    estimatedConfirmationTime: '2-5 seconds',
                },
                receipt: {
                    transactionId: transaction._id,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    merchant: transaction.merchantName,
                    cardLast4: cardUuid.slice(-4),
                    timestamp: transaction.createdAt,
                    status: transaction.status,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Payment processing error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                userId: req.user?.id,
                body: req.body,
            });
            // Handle specific error types
            if (error instanceof Error) {
                if (error.message.includes('insufficient balance')) {
                    return res.status(400).json({
                        success: false,
                        error: 'Insufficient balance',
                        code: constants_1.ERROR_CODES.INSUFFICIENT_BALANCE,
                    });
                }
                if (error.message.includes('limit exceeded')) {
                    return res.status(400).json({
                        success: false,
                        error: error.message,
                        code: constants_1.ERROR_CODES.LIMIT_EXCEEDED,
                    });
                }
                if (error.message.includes('Card')) {
                    return res.status(400).json({
                        success: false,
                        error: error.message,
                        code: constants_1.ERROR_CODES.INVALID_CARD,
                    });
                }
            }
            next(error);
        }
    }
    async verifyUserPin(userId, pin) {
        try {
            const user = await User_model_1.User.findById(userId).select('+pinHash');
            if (!user) {
                return false;
            }
            // Use the comparePin method from User model
            return await user.comparePin(pin);
        }
        catch (error) {
            logger_1.default.error('PIN verification error:', error);
            return false;
        }
    }
    async signTransaction(req, res, next) {
        try {
            const { transactionBytes, cardUuid, amount } = req.body;
            const user = req.user;
            // Input validation
            if (!transactionBytes || !cardUuid) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: transactionBytes, cardUuid',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Verify card ownership
            const card = await Card_model_1.Card.findOne({ cardUuid, userId: user.id });
            if (!card || !card.isActive) {
                return res.status(404).json({
                    success: false,
                    error: 'Card not found or not active',
                    code: constants_1.ERROR_CODES.INVALID_CARD,
                });
            }
            // Create pending transaction record for tracking
            const pendingTransaction = await Transaction_model_1.Transaction.create({
                userId: user._id,
                cardId: card._id,
                cardUuid,
                type: 'payment',
                amount: amount || 0,
                currency: 'SUI',
                status: 'pending',
                fromAddress: user.walletAddress,
                toAddress: '', // Will be filled when merchant is known
                metadata: {
                    signedAt: new Date(),
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            });
            try {
                // Import required Sui modules
                const { Transaction } = require('@mysten/sui/transactions');
                const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
                const { decryptPrivateKey } = require('../services/encryption.service');
                // Get user's private key
                const userWithKey = await User_model_1.User.findById(user.id).select('+encryptedPrivateKey');
                if (!userWithKey || !userWithKey.encryptedPrivateKey) {
                    throw new Error('User private key not found');
                }
                // Decrypt and create keypair
                const privateKey = decryptPrivateKey(userWithKey.encryptedPrivateKey);
                const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
                // Parse transaction bytes
                const transactionBytesArray = Array.isArray(transactionBytes)
                    ? new Uint8Array(transactionBytes)
                    : new Uint8Array(Buffer.from(transactionBytes, 'base64'));
                // Deserialize transaction
                const tx = Transaction.from(transactionBytesArray);
                // Verify transaction sender matches user wallet
                if (tx.getSender() !== user.walletAddress) {
                    return res.status(400).json({
                        success: false,
                        error: 'Transaction sender does not match user wallet',
                        code: constants_1.ERROR_CODES.AUTH_FAILED,
                    });
                }
                // Sign the transaction
                const transactionBytesForSigning = await tx.build({ client: (0, sui_config_1.getSuiClient)() });
                const signature = await keypair.signTransaction(transactionBytesForSigning);
                // Update pending transaction with signature info
                pendingTransaction.status = 'processing';
                pendingTransaction.metadata = {
                    ...pendingTransaction.metadata,
                    signatureGenerated: true,
                    signedBytes: transactionBytes,
                };
                await pendingTransaction.save();
                logger_1.default.info(`Transaction signed successfully`, {
                    transactionId: pendingTransaction._id,
                    userId: user.id,
                    cardUuid,
                });
                res.json({
                    success: true,
                    message: 'Transaction signed successfully',
                    signature: signature.signature,
                    transactionId: pendingTransaction._id,
                    data: {
                        signature: signature.signature,
                        publicKey: keypair.getPublicKey().toSuiAddress(),
                        transactionBytes: Buffer.from(transactionBytesForSigning).toString('base64'),
                    },
                });
            }
            catch (signingError) {
                // Update transaction status to failed
                pendingTransaction.status = 'failed';
                pendingTransaction.failureReason = signingError instanceof Error ? signingError.message : 'Signing failed';
                await pendingTransaction.save();
                throw signingError;
            }
        }
        catch (error) {
            logger_1.default.error('Transaction signing error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?.id,
                cardUuid: req.body.cardUuid,
            });
            if (error instanceof Error && error.message.includes('decrypt')) {
                return res.status(500).json({
                    success: false,
                    error: 'Unable to access wallet keys',
                    code: constants_1.ERROR_CODES.INTERNAL_ERROR,
                });
            }
            next(error);
        }
    }
    async completePayment(req, res, next) {
        try {
            const { txHash, transactionId } = req.body;
            const user = req.user;
            // Input validation
            if (!txHash || (!transactionId && !req.body.cardUuid)) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: txHash and (transactionId or cardUuid)',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Find the pending transaction
            let transaction;
            if (transactionId) {
                transaction = await Transaction_model_1.Transaction.findById(transactionId);
            }
            else {
                transaction = await Transaction_model_1.Transaction.findOne({
                    cardUuid: req.body.cardUuid,
                    userId: user.id,
                    status: 'processing'
                }).sort({ createdAt: -1 });
            }
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found or not in processing state',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Verify transaction ownership
            if (transaction.userId.toString() !== user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized to complete this transaction',
                    code: constants_1.ERROR_CODES.UNAUTHORIZED,
                });
            }
            try {
                // Verify transaction on blockchain
                const blockchainTx = await (0, sui_config_1.getSuiClient)().waitForTransaction({
                    digest: txHash,
                    options: {
                        showEffects: true,
                        showObjectChanges: true,
                        showBalanceChanges: true,
                    },
                });
                // Check if transaction was successful on blockchain
                const isSuccess = blockchainTx.effects?.status?.status === 'success';
                if (!isSuccess) {
                    transaction.status = 'failed';
                    transaction.failureReason = 'Blockchain transaction failed';
                    await transaction.save();
                    return res.status(400).json({
                        success: false,
                        error: 'Transaction failed on blockchain',
                        code: constants_1.ERROR_CODES.TRANSACTION_FAILED,
                        details: blockchainTx.effects?.status,
                    });
                }
                // Extract gas fee from blockchain transaction
                const gasFeeFromChain = blockchainTx.effects?.gasUsed ?
                    (parseInt(blockchainTx.effects.gasUsed.computationCost) +
                        parseInt(blockchainTx.effects.gasUsed.storageCost)) : 0;
                // Update transaction with completion details
                transaction.status = 'completed';
                transaction.txHash = txHash;
                transaction.gasFee = gasFeeFromChain / 1_000_000_000; // Convert MIST to SUI
                transaction.totalAmount = transaction.amount + transaction.gasFee;
                transaction.completedAt = new Date();
                transaction.metadata = {
                    ...transaction.metadata,
                    blockchainConfirmed: true,
                    confirmationTime: new Date(),
                    gasUsed: blockchainTx.effects?.gasUsed,
                    balanceChanges: blockchainTx.balanceChanges,
                };
                await transaction.save();
                // Update card usage statistics
                if (transaction.cardId) {
                    await Card_model_1.Card.findByIdAndUpdate(transaction.cardId, {
                        $inc: {
                            dailySpent: transaction.amount,
                            monthlySpent: transaction.amount,
                            usageCount: 1
                        },
                        lastUsed: new Date(),
                    });
                }
                // Update merchant statistics if applicable
                if (transaction.merchantId) {
                    await Merchant_model_1.Merchant.findByIdAndUpdate(transaction.merchantId, {
                        $inc: {
                            totalTransactions: 1,
                            totalVolume: transaction.amount,
                        },
                        lastTransactionAt: new Date(),
                    });
                }
                // Cache the completed transaction
                await (0, redis_config_1.setCached)(`completed_tx:${txHash}`, transaction, constants_1.CONSTANTS.CACHE_TTL.TRANSACTION);
                logger_1.default.info(`Payment completed successfully`, {
                    transactionId: transaction._id,
                    txHash,
                    userId: user.id,
                    amount: transaction.amount,
                    gasFee: transaction.gasFee,
                });
                res.json({
                    success: true,
                    message: 'Payment completed successfully',
                    transaction: {
                        id: transaction._id,
                        txHash: transaction.txHash,
                        amount: transaction.amount,
                        gasFee: transaction.gasFee,
                        totalAmount: transaction.totalAmount,
                        status: transaction.status,
                        completedAt: transaction.completedAt,
                        merchantName: transaction.merchantName,
                    },
                    receipt: {
                        transactionId: transaction._id,
                        txHash: transaction.txHash,
                        amount: transaction.amount,
                        currency: transaction.currency,
                        gasFee: transaction.gasFee,
                        totalAmount: transaction.totalAmount,
                        merchant: transaction.merchantName,
                        timestamp: transaction.completedAt,
                        status: 'completed',
                    },
                    blockchain: {
                        confirmed: true,
                        confirmationTime: blockchainTx.timestampMs,
                        gasUsed: blockchainTx.effects?.gasUsed,
                        explorerUrl: `https://suiscan.xyz/testnet/tx/${txHash}`,
                    },
                });
            }
            catch (blockchainError) {
                // Update transaction as failed
                transaction.status = 'failed';
                transaction.failureReason = blockchainError instanceof Error ?
                    blockchainError.message : 'Blockchain verification failed';
                await transaction.save();
                logger_1.default.error('Blockchain verification failed:', {
                    error: blockchainError,
                    txHash,
                    transactionId: transaction._id,
                });
                return res.status(400).json({
                    success: false,
                    error: 'Unable to verify transaction on blockchain',
                    code: constants_1.ERROR_CODES.BLOCKCHAIN_ERROR,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Payment completion error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?.id,
                body: req.body,
            });
            next(error);
        }
    }
    async getTransactionHistory(req, res, next) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || constants_1.CONSTANTS.DEFAULT_PAGE_SIZE, constants_1.CONSTANTS.MAX_PAGE_SIZE);
            const result = await paymentService.getTransactionHistory(userId, page, limit);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getTransaction(req, res, next) {
        try {
            const { id } = req.params;
            const transaction = await paymentService.getTransactionById(id);
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found',
                });
            }
            res.json({
                success: true,
                transaction,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refundTransaction(req, res, next) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const transaction = await paymentService.refundTransaction(id, reason);
            res.json({
                success: true,
                transaction,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPaymentStats(req, res, next) {
        try {
            const userId = req.user.id;
            const period = req.query.period || 'month';
            const cardUuid = req.query.cardUuid;
            // Use service to get payment stats (delegate the heavy logic to service)
            const stats = await paymentService.getPaymentStats(userId, period, cardUuid);
            res.json({
                success: true,
                stats,
            });
        }
        catch (error) {
            logger_1.default.error('Payment stats error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?.id,
                period: req.query.period,
            });
            if (error instanceof Error && error.message.includes('Invalid period')) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            next(error);
        }
    }
    // Additional utility methods
    async cancelPayment(req, res, next) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const user = req.user;
            // Use service to cancel payment
            const transaction = await paymentService.cancelTransaction(id, user.id, reason);
            res.json({
                success: true,
                message: 'Transaction cancelled successfully',
                transaction: {
                    id: transaction._id,
                    status: transaction.status,
                    cancelledAt: transaction.updatedAt,
                },
            });
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                        code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                    });
                }
                if (error.message.includes('Unauthorized')) {
                    return res.status(403).json({
                        success: false,
                        error: error.message,
                        code: constants_1.ERROR_CODES.UNAUTHORIZED,
                    });
                }
                if (error.message.includes('Cannot cancel')) {
                    return res.status(400).json({
                        success: false,
                        error: error.message,
                        code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                    });
                }
            }
            next(error);
        }
    }
    async retryPayment(req, res, next) {
        try {
            const { id } = req.params;
            const user = req.user;
            // Use service to retry payment
            const result = await paymentService.retryTransaction(id, user.id);
            res.json({
                success: true,
                message: 'Payment retry initiated',
                originalTransactionId: id,
                newTransaction: {
                    id: result.newTransaction._id,
                    status: result.newTransaction.status,
                    amount: result.newTransaction.amount,
                },
            });
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                        code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                    });
                }
                if (error.message.includes('Unauthorized')) {
                    return res.status(403).json({
                        success: false,
                        error: error.message,
                        code: constants_1.ERROR_CODES.UNAUTHORIZED,
                    });
                }
                if (error.message.includes('Only failed')) {
                    return res.status(400).json({
                        success: false,
                        error: error.message,
                        code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                    });
                }
            }
            next(error);
        }
    }
    async getPaymentMethods(req, res, next) {
        try {
            const user = req.user;
            // Get user's cards
            const cards = await Card_model_1.Card.find({
                userId: user.id,
                isActive: true
            }).select('cardUuid cardType cardNumber isActive isPrimary lastUsed usageCount');
            // Get wallet balance
            let walletBalance = 0;
            try {
                const balance = await (0, sui_config_1.getSuiClient)().getBalance({
                    owner: user.walletAddress,
                    coinType: '0x2::sui::SUI',
                });
                walletBalance = parseFloat(balance.totalBalance) / 1_000_000_000;
            }
            catch (error) {
                logger_1.default.warn('Unable to fetch wallet balance', { userId: user.id });
            }
            res.json({
                success: true,
                paymentMethods: {
                    wallet: {
                        address: user.walletAddress,
                        balance: walletBalance,
                        currency: 'SUI',
                    },
                    cards: cards.map(card => ({
                        uuid: card.cardUuid,
                        type: card.cardType,
                        last4: card.cardNumber.slice(-4),
                        isActive: card.isActive,
                        isPrimary: card.isPrimary,
                        lastUsed: card.lastUsed,
                        usageCount: card.usageCount,
                    })),
                },
                limits: {
                    dailyLimit: user.dailyLimit,
                    monthlyLimit: user.monthlyLimit,
                    minTransaction: constants_1.CONSTANTS.MIN_TRANSACTION_AMOUNT,
                    maxTransaction: constants_1.CONSTANTS.MAX_TRANSACTION_AMOUNT,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getTransactionReceipt(req, res, next) {
        try {
            const { id } = req.params;
            const user = req.user;
            const format = req.query.format || 'json';
            const transaction = await Transaction_model_1.Transaction.findById(id)
                .populate('merchantId', 'merchantName')
                .populate('cardId', 'cardType cardNumber');
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Verify ownership
            if (transaction.userId.toString() !== user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized to view this receipt',
                    code: constants_1.ERROR_CODES.UNAUTHORIZED,
                });
            }
            const receipt = {
                transactionId: transaction._id,
                txHash: transaction.txHash,
                status: transaction.status,
                amount: transaction.amount,
                gasFee: transaction.gasFee,
                totalAmount: transaction.totalAmount,
                currency: transaction.currency,
                merchant: transaction.merchantName,
                card: transaction.cardId ? {
                    type: transaction.cardId.cardType,
                    last4: transaction.cardId.cardNumber?.slice(-4),
                } : null,
                timestamps: {
                    created: transaction.createdAt,
                    completed: transaction.completedAt,
                },
                blockchain: transaction.txHash ? {
                    network: 'Sui Testnet',
                    explorerUrl: `https://suiscan.xyz/testnet/tx/${transaction.txHash}`,
                } : null,
                metadata: transaction.metadata,
            };
            if (format === 'pdf') {
                // TODO: Generate PDF receipt
                return res.status(501).json({
                    success: false,
                    error: 'PDF format not yet implemented',
                });
            }
            res.json({
                success: true,
                receipt,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async validateTransaction(req, res, next) {
        try {
            const { txHash } = req.params;
            if (!txHash) {
                return res.status(400).json({
                    success: false,
                    error: 'Transaction hash is required',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            try {
                // Get transaction from blockchain
                const blockchainTx = await (0, sui_config_1.getSuiClient)().getTransactionBlock({
                    digest: txHash,
                    options: {
                        showEffects: true,
                        showInput: true,
                        showObjectChanges: true,
                    },
                });
                // Check our database
                const dbTransaction = await Transaction_model_1.Transaction.findOne({ txHash });
                res.json({
                    success: true,
                    validation: {
                        exists: !!blockchainTx,
                        inDatabase: !!dbTransaction,
                        status: blockchainTx?.effects?.status?.status,
                        timestamp: blockchainTx?.timestampMs,
                        gasUsed: blockchainTx?.effects?.gasUsed,
                        explorerUrl: `https://suiscan.xyz/testnet/tx/${txHash}`,
                    },
                    transaction: dbTransaction ? {
                        id: dbTransaction._id,
                        status: dbTransaction.status,
                        amount: dbTransaction.amount,
                    } : null,
                });
            }
            catch (blockchainError) {
                res.json({
                    success: true,
                    validation: {
                        exists: false,
                        error: 'Transaction not found on blockchain',
                    },
                });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
exports.paymentController = new PaymentController();
//# sourceMappingURL=payment.controller.js.map