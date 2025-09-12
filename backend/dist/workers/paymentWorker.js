"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPaymentWorkers = startPaymentWorkers;
const queue_config_1 = require("../config/queue.config");
const Transaction_model_1 = require("../models/Transaction.model");
const User_model_1 = require("../models/User.model");
const Card_model_1 = require("../models/Card.model");
const payment_processor_1 = __importDefault(require("../queues/payment.processor"));
const redis_config_1 = require("../config/redis.config");
const logger_1 = __importDefault(require("../utils/logger"));
const socket_service_1 = require("../services/socket.service");
// Start payment workers
function startPaymentWorkers() {
    logger_1.default.info('🚀 Starting payment workers...');
    // Main payment processor - use the new comprehensive processor
    queue_config_1.paymentQueue.process('processNFCPayment', 5, payment_processor_1.default);
    // Legacy payment processor (for backward compatibility)
    queue_config_1.paymentQueue.process('legacyProcessPayment', 3, async (job) => {
        const { transactionId, paymentData } = job.data;
        logger_1.default.info(`Processing payment job ${job.id} for transaction ${transactionId}`);
        try {
            // Update transaction status to processing
            await Transaction_model_1.Transaction.findOneAndUpdate({ transactionId }, {
                status: 'processing',
                processingStartedAt: new Date()
            });
            // Emit real-time update
            socket_service_1.socketService.emitTransactionUpdate(paymentData.userId, {
                transactionId,
                status: 'processing',
                message: 'Your payment is being processed'
            });
            // Step 1: Verify card and user balances
            const verificationResult = await verifyPaymentConditions(paymentData);
            if (!verificationResult.valid) {
                throw new Error(verificationResult.reason);
            }
            // Step 2: Process blockchain transaction
            const blockchainJob = await queue_config_1.blockchainQueue.add('processSuiTransaction', {
                transactionId,
                paymentData,
                retryCount: 0
            }, {
                priority: 10,
                delay: 0
            });
            logger_1.default.info(`Blockchain job ${blockchainJob.id} created for transaction ${transactionId}`);
            // Step 3: Update caches
            await updateCachesAfterPayment(paymentData);
            // Step 4: Send notifications
            await queue_config_1.notificationQueue.add('paymentProcessing', {
                userId: paymentData.userId,
                transactionId,
                amount: paymentData.amount,
                merchantId: paymentData.merchantId
            });
            return {
                success: true,
                transactionId,
                blockchainJobId: blockchainJob.id
            };
        }
        catch (error) {
            logger_1.default.error(`Payment processing failed for ${transactionId}:`, error);
            // Update transaction status to failed
            await Transaction_model_1.Transaction.findOneAndUpdate({ transactionId }, {
                status: 'failed',
                failureReason: error.message,
                completedAt: new Date()
            });
            // Emit failure update
            socket_service_1.socketService.emitTransactionUpdate(paymentData.userId, {
                transactionId,
                status: 'failed',
                error: error.message,
                message: 'Payment processing failed'
            });
            // Add to failed notification queue
            await queue_config_1.notificationQueue.add('paymentFailed', {
                userId: paymentData.userId,
                transactionId,
                error: error.message
            });
            throw error;
        }
    });
    // Blockchain transaction processor
    queue_config_1.blockchainQueue.process('processSuiTransaction', 3, async (job) => {
        const { transactionId, paymentData, retryCount } = job.data;
        logger_1.default.info(`Processing blockchain job ${job.id} for transaction ${transactionId}`);
        try {
            // Execute Sui blockchain transaction (mocked for now)
            const txResult = {
                success: true,
                txHash: `0x${Math.random().toString(16).substring(2, 10)}mock`,
                gasUsed: Math.floor(Math.random() * 1000000),
                blockNumber: Math.floor(Math.random() * 10000000)
            };
            // TODO: Replace with actual suiService implementation
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
            if (!txResult.success) {
                throw new Error('Blockchain transaction failed');
            }
            // Update transaction with blockchain details
            await Transaction_model_1.Transaction.findOneAndUpdate({ transactionId }, {
                status: 'completed',
                txHash: txResult.txHash,
                gasUsed: txResult.gasUsed,
                blockNumber: txResult.blockNumber,
                completedAt: new Date()
            });
            // Clear relevant caches
            await clearTransactionCaches(paymentData.cardUuid);
            // Emit success update
            socket_service_1.socketService.emitTransactionUpdate(paymentData.userId, {
                transactionId,
                status: 'completed',
                txHash: txResult.txHash,
                message: 'Payment completed successfully',
                explorerUrl: `https://suiscan.xyz/testnet/tx/${txResult.txHash}`
            });
            // Send success notification
            await queue_config_1.notificationQueue.add('paymentSuccess', {
                userId: paymentData.userId,
                transactionId,
                txHash: txResult.txHash,
                amount: paymentData.amount
            }, {
                priority: 5
            });
            return {
                success: true,
                txHash: txResult.txHash,
                transactionId
            };
        }
        catch (error) {
            logger_1.default.error(`Blockchain transaction failed for ${transactionId}:`, error);
            // Handle retry logic
            if (retryCount < 3) {
                logger_1.default.info(`Retrying blockchain transaction for ${transactionId}, attempt ${retryCount + 1}`);
                await queue_config_1.blockchainQueue.add('processSuiTransaction', {
                    transactionId,
                    paymentData,
                    retryCount: retryCount + 1
                }, {
                    delay: 5000 * (retryCount + 1), // Exponential backoff
                    priority: 15
                });
                return {
                    success: false,
                    retry: true,
                    attempt: retryCount + 1
                };
            }
            // Final failure - update transaction
            await handleFailedBlockchainTransaction(transactionId, error.message);
            throw error;
        }
    });
    logger_1.default.info('✅ Payment workers started successfully');
}
// Helper functions
async function verifyPaymentConditions(paymentData) {
    try {
        // Check card status
        const card = await Card_model_1.Card.findOne({ cardUuid: paymentData.cardUuid, isActive: true });
        if (!card) {
            return { valid: false, reason: 'Card not found or inactive' };
        }
        // Check user wallet balance (if needed)
        const user = await User_model_1.User.findById(paymentData.userId);
        if (!user) {
            return { valid: false, reason: 'User not found' };
        }
        // Check daily spending limit
        const today = new Date().toISOString().split('T')[0];
        const dailySpendingKey = redis_config_1.NFCCacheKeys.dailySpending(paymentData.cardUuid, today);
        const currentSpending = await (0, redis_config_1.getCached)(dailySpendingKey) || 0;
        const dailyLimit = 2000000; // 2M VND default
        if (currentSpending + paymentData.amount > dailyLimit) {
            return { valid: false, reason: 'Daily spending limit exceeded' };
        }
        return { valid: true };
    }
    catch (error) {
        logger_1.default.error('Payment verification failed:', error);
        return { valid: false, reason: 'Verification error' };
    }
}
async function updateCachesAfterPayment(paymentData) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const dailySpendingKey = redis_config_1.NFCCacheKeys.dailySpending(paymentData.cardUuid, today);
        // Update daily spending
        const currentSpending = await (0, redis_config_1.getCached)(dailySpendingKey) || 0;
        await (0, redis_config_1.setCached)(dailySpendingKey, currentSpending + paymentData.amount, 86400 // 24 hours
        );
        // Invalidate validation cache
        const validationKey = redis_config_1.NFCCacheKeys.fastValidation(paymentData.cardUuid, paymentData.amount);
        await (0, redis_config_1.setCached)(validationKey, null, 1);
        logger_1.default.info(`Caches updated for card ${paymentData.cardUuid}`);
    }
    catch (error) {
        logger_1.default.error('Cache update failed:', error);
    }
}
async function clearTransactionCaches(cardUuid) {
    try {
        const today = new Date().toISOString().split('T')[0];
        // Clear relevant caches
        const keysToInvalidate = [
            redis_config_1.NFCCacheKeys.cardStatus(cardUuid),
            redis_config_1.NFCCacheKeys.dailySpending(cardUuid, today)
        ];
        for (const key of keysToInvalidate) {
            await (0, redis_config_1.setCached)(key, null, 1);
        }
        logger_1.default.info(`Transaction caches cleared for card ${cardUuid}`);
    }
    catch (error) {
        logger_1.default.error('Cache clearing failed:', error);
    }
}
async function handleFailedBlockchainTransaction(transactionId, errorMessage) {
    logger_1.default.error(`🚨 Failed blockchain transaction: ${transactionId} - ${errorMessage}`);
    // Update transaction status to failed
    await Transaction_model_1.Transaction.findOneAndUpdate({ transactionId }, {
        status: 'failed',
        failureReason: `Blockchain error: ${errorMessage}`,
        completedAt: new Date()
    });
    // Add to failed transaction queue for manual review
    await queue_config_1.notificationQueue.add('alertFailedTransaction', {
        transactionId,
        errorMessage,
        timestamp: new Date(),
        requiresManualReview: true
    }, {
        delay: 0,
        priority: 10 // High priority for failed transactions
    });
}
//# sourceMappingURL=paymentWorker.js.map