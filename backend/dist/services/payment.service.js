"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const transactions_1 = require("@mysten/sui/transactions");
const ed25519_1 = require("@mysten/sui/keypairs/ed25519");
const sui_config_1 = require("../config/sui.config");
const User_model_1 = require("../models/User.model");
const Card_model_1 = require("../models/Card.model");
const Transaction_model_1 = require("../models/Transaction.model");
const Merchant_model_1 = require("../models/Merchant.model");
const encryption_service_1 = require("./encryption.service");
const redis_config_1 = require("../config/redis.config");
const constants_1 = require("../config/constants");
const logger_1 = __importDefault(require("../utils/logger"));
class PaymentService {
    get suiClient() {
        return (0, sui_config_1.getSuiClient)();
    }
    async processPayment(cardUuid, amount, merchantId, metadata) {
        try {
            // 1. Validate card
            const card = await this.validateCard(cardUuid);
            // 2. Get user
            const user = await User_model_1.User.findById(card.userId).select('+encryptedPrivateKey');
            if (!user)
                throw new Error('User not found');
            // 3. Check limits
            await this.checkTransactionLimits(user, card, amount);
            // 4. Get merchant
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant || !merchant.isActive)
                throw new Error('Invalid merchant');
            // 5. Create pending transaction
            const transaction = await Transaction_model_1.Transaction.create({
                userId: user._id,
                cardId: card._id,
                cardUuid,
                type: 'payment',
                amount,
                currency: 'MY_COIN',
                merchantId: merchant._id,
                merchantName: merchant.merchantName,
                status: 'pending',
                fromAddress: user.walletAddress,
                toAddress: merchant.walletAddress,
                metadata,
            });
            try {
                // 6. Build and execute blockchain transaction
                const txResult = await this.executeBlockchainTransaction(user, merchant.walletAddress, amount);
                // 7. Update transaction status
                transaction.status = 'completed';
                transaction.txHash = txResult.digest;
                transaction.gasFee = Number(txResult.effects?.gasUsed?.computationCost) || 0;
                transaction.completedAt = new Date();
                await transaction.save();
                // 8. Update card usage
                await this.updateCardUsage(card, amount);
                // 9. Update merchant stats
                await this.updateMerchantStats(merchant, amount);
                // 10. Send notifications
                // TODO: Send payment notification
                // 11. Webhook to merchant
                if (merchant.webhookUrl) {
                    await this.sendWebhook(merchant, transaction);
                }
                return transaction;
            }
            catch (error) {
                // Update transaction as failed
                transaction.status = 'failed';
                transaction.failureReason = error instanceof Error ? error.message : 'Unknown error';
                await transaction.save();
                throw error;
            }
        }
        catch (error) {
            logger_1.default.error('Payment processing error:', error);
            throw error;
        }
    }
    async validateCard(cardUuid) {
        const card = await Card_model_1.Card.findOne({ cardUuid });
        if (!card)
            throw new Error('Card not found');
        if (!card.isActive)
            throw new Error('Card is not active');
        if (card.isExpired)
            throw new Error('Card has expired');
        if (card.blockedAt)
            throw new Error(`Card is blocked: ${card.blockedReason}`);
        return card;
    }
    async checkTransactionLimits(user, card, amount) {
        // Check user daily limit
        if (card.dailySpent + amount > user.dailyLimit) {
            throw new Error('Daily limit exceeded');
        }
        // Check user monthly limit
        if (card.monthlySpent + amount > user.monthlyLimit) {
            throw new Error('Monthly limit exceeded');
        }
        // Check MY_COIN balance
        const myCoinBalance = await this.getMyCoinBalance(user.walletAddress);
        const requiredAmount = amount * Math.pow(10, constants_1.CONSTANTS.MY_COIN.DECIMALS);
        if (myCoinBalance < requiredAmount) {
            throw new Error(`Insufficient MY_COIN balance. Required: ${amount} MY_COIN, Available: ${myCoinBalance / Math.pow(10, constants_1.CONSTANTS.MY_COIN.DECIMALS)} MY_COIN`);
        }
        // Check card limits
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (card.lastResetDate < today) {
            // Reset daily spending
            card.dailySpent = 0;
            // Reset monthly if needed
            if (card.lastResetDate.getMonth() !== today.getMonth()) {
                card.monthlySpent = 0;
            }
            card.lastResetDate = today;
            await card.save();
        }
    }
    async executeBlockchainTransaction(user, recipientAddress, amount) {
        // Decrypt private key
        const privateKey = (0, encryption_service_1.decryptPrivateKey)(user.encryptedPrivateKey);
        const keypair = ed25519_1.Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
        // Build transaction
        const tx = new transactions_1.Transaction();
        tx.setSender(user.walletAddress);
        // Get user's MY_COIN objects
        const myCoinObjects = await this.getUserMyCoinObjects(user.walletAddress);
        if (myCoinObjects.length === 0) {
            throw new Error('No MY_COIN balance found');
        }
        // Calculate total available balance
        const totalBalance = myCoinObjects.reduce((sum, obj) => sum + parseInt(obj.balance), 0);
        const requiredAmount = amount * Math.pow(10, constants_1.CONSTANTS.MY_COIN.DECIMALS);
        if (totalBalance < requiredAmount) {
            throw new Error(`Insufficient MY_COIN balance. Required: ${requiredAmount}, Available: ${totalBalance}`);
        }
        // Merge coins if needed
        let primaryCoin = myCoinObjects[0].objectId;
        if (myCoinObjects.length > 1) {
            const coinsToMerge = myCoinObjects.slice(1).map(obj => obj.objectId);
            tx.mergeCoins(primaryCoin, coinsToMerge);
        }
        // Split coins for payment
        const [paymentCoin] = tx.splitCoins(primaryCoin, [
            tx.pure.u64(requiredAmount)
        ]);
        // Transfer MY_COIN to merchant
        tx.transferObjects([paymentCoin], tx.pure.address(recipientAddress));
        // Set gas budget
        tx.setGasBudget(constants_1.CONSTANTS.DEFAULT_GAS_BUDGET);
        // Execute transaction
        const result = await this.suiClient.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });
        // Wait for transaction to be indexed
        await this.suiClient.waitForTransaction({
            digest: result.digest,
        });
        return result;
    }
    async getUserMyCoinObjects(address) {
        try {
            // Get all objects owned by the user
            const objects = await this.suiClient.getOwnedObjects({
                owner: address,
                filter: {
                    StructType: constants_1.CONSTANTS.MY_COIN.TYPE,
                },
                options: {
                    showContent: true,
                    showType: true,
                },
            });
            const coinObjects = [];
            for (const obj of objects.data) {
                if (obj.data?.content && 'fields' in obj.data.content) {
                    const fields = obj.data.content.fields;
                    coinObjects.push({
                        objectId: obj.data.objectId,
                        balance: fields.balance || '0',
                    });
                }
            }
            return coinObjects;
        }
        catch (error) {
            logger_1.default.error('Error getting MY_COIN objects:', error);
            return [];
        }
    }
    async getMyCoinBalance(address) {
        try {
            const coinObjects = await this.getUserMyCoinObjects(address);
            return coinObjects.reduce((total, obj) => total + parseInt(obj.balance), 0);
        }
        catch (error) {
            logger_1.default.error('Error getting MY_COIN balance:', error);
            return 0;
        }
    }
    async updateCardUsage(card, amount) {
        card.dailySpent += amount;
        card.monthlySpent += amount;
        card.usageCount += 1;
        card.lastUsed = new Date();
        await card.save();
    }
    async updateMerchantStats(merchant, amount) {
        merchant.totalTransactions += 1;
        merchant.totalVolume += amount;
        await merchant.save();
    }
    async sendWebhook(merchant, _transaction) {
        // Implement webhook logic
        logger_1.default.info(`Sending webhook to merchant ${merchant.merchantId}`);
    }
    async getTransactionHistory(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            Transaction_model_1.Transaction.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('merchantId', 'merchantName'),
            Transaction_model_1.Transaction.countDocuments({ userId }),
        ]);
        return {
            transactions,
            total,
            pages: Math.ceil(total / limit),
        };
    }
    async getTransactionById(txId) {
        // Check cache
        const cached = await (0, redis_config_1.getCached)(`tx:${txId}`);
        if (cached)
            return cached;
        const transaction = await Transaction_model_1.Transaction.findById(txId)
            .populate('userId', 'fullName email')
            .populate('merchantId', 'merchantName');
        if (transaction) {
            await (0, redis_config_1.setCached)(`tx:${txId}`, transaction, constants_1.CONSTANTS.CACHE_TTL.TRANSACTION);
        }
        return transaction;
    }
    async refundTransaction(txId, _reason) {
        const transaction = await Transaction_model_1.Transaction.findById(txId);
        if (!transaction)
            throw new Error('Transaction not found');
        if (transaction.status !== 'completed')
            throw new Error('Cannot refund non-completed transaction');
        if (transaction.refundedAt)
            throw new Error('Transaction already refunded');
        // Process refund on blockchain
        // ... blockchain refund logic
        // Update transaction
        transaction.refundedAt = new Date();
        transaction.status = 'cancelled';
        // transaction.refundTxHash = refundTxHash;
        await transaction.save();
        return transaction;
    }
    async getPaymentStats(userId, period, cardUuid) {
        // Validate period parameter
        const validPeriods = ['day', 'week', 'month', 'quarter', 'year', 'all'];
        if (!validPeriods.includes(period)) {
            throw new Error('Invalid period. Must be one of: day, week, month, quarter, year, all');
        }
        // Calculate date range based on period
        const now = new Date();
        let startDate;
        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default: // 'all'
                startDate = new Date(0); // Unix epoch
        }
        // Build query filters
        const baseQuery = {
            userId,
            status: 'completed'
        };
        if (period !== 'all') {
            baseQuery.completedAt = { $gte: startDate };
        }
        if (cardUuid) {
            baseQuery.cardUuid = cardUuid;
        }
        // Check cache first
        const cacheKey = `payment_stats:${userId}:${period}:${cardUuid || 'all'}`;
        const cachedStats = await (0, redis_config_1.getCached)(cacheKey);
        if (cachedStats) {
            return { ...cachedStats, cached: true };
        }
        try {
            // Aggregate payment statistics
            const [basicStats, monthlyTrends, topMerchants, hourlyDistribution] = await Promise.all([
                // Basic statistics
                Transaction_model_1.Transaction.aggregate([
                    { $match: baseQuery },
                    {
                        $group: {
                            _id: null,
                            totalTransactions: { $sum: 1 },
                            totalVolume: { $sum: '$amount' },
                            totalGasFees: { $sum: '$gasFee' },
                            averageTransaction: { $avg: '$amount' },
                            minTransaction: { $min: '$amount' },
                            maxTransaction: { $max: '$amount' },
                            successRate: { $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                        },
                    },
                ]),
                // Monthly trends (last 6 months)
                Transaction_model_1.Transaction.aggregate([
                    {
                        $match: {
                            ...baseQuery,
                            completedAt: { $gte: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$completedAt' },
                                month: { $month: '$completedAt' },
                            },
                            transactions: { $sum: 1 },
                            volume: { $sum: '$amount' },
                            gasFees: { $sum: '$gasFee' },
                        },
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } },
                ]),
                // Top merchants
                Transaction_model_1.Transaction.aggregate([
                    { $match: { ...baseQuery, merchantId: { $exists: true } } },
                    {
                        $group: {
                            _id: '$merchantName',
                            transactions: { $sum: 1 },
                            totalSpent: { $sum: '$amount' },
                            averageTransaction: { $avg: '$amount' },
                        },
                    },
                    { $sort: { totalSpent: -1 } },
                    { $limit: 10 },
                ]),
                // Hourly distribution
                Transaction_model_1.Transaction.aggregate([
                    { $match: baseQuery },
                    {
                        $group: {
                            _id: { $hour: '$completedAt' },
                            transactions: { $sum: 1 },
                            volume: { $sum: '$amount' },
                        },
                    },
                    { $sort: { '_id': 1 } },
                ]),
            ]);
            // Get card-specific stats if requested
            let cardStats = null;
            if (cardUuid) {
                const card = await Card_model_1.Card.findOne({ cardUuid, userId });
                if (card) {
                    cardStats = {
                        cardType: card.cardType,
                        dailySpent: card.dailySpent,
                        monthlySpent: card.monthlySpent,
                        usageCount: card.usageCount,
                        lastUsed: card.lastUsed,
                        isActive: card.isActive,
                    };
                }
            }
            // Format response
            const stats = {
                period,
                dateRange: {
                    from: period === 'all' ? null : startDate,
                    to: now,
                },
                overview: basicStats[0] || {
                    totalTransactions: 0,
                    totalVolume: 0,
                    totalGasFees: 0,
                    averageTransaction: 0,
                    minTransaction: 0,
                    maxTransaction: 0,
                    successRate: 0,
                },
                trends: {
                    monthly: monthlyTrends.map(trend => ({
                        month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
                        transactions: trend.transactions,
                        volume: trend.volume,
                        gasFees: trend.gasFees,
                    })),
                    hourly: Array.from({ length: 24 }, (_, hour) => {
                        const hourData = hourlyDistribution.find(h => h._id === hour);
                        return {
                            hour,
                            transactions: hourData?.transactions || 0,
                            volume: hourData?.volume || 0,
                        };
                    }),
                },
                merchants: {
                    top: topMerchants,
                    totalUnique: await Transaction_model_1.Transaction.distinct('merchantId', baseQuery).then(merchants => merchants.length),
                },
                card: cardStats,
                generatedAt: now,
                cached: false,
            };
            // Cache the results for 5 minutes
            await (0, redis_config_1.setCached)(cacheKey, stats, 300);
            logger_1.default.info(`Payment stats generated`, {
                userId,
                period,
                cardUuid,
                totalTransactions: stats.overview.totalTransactions,
            });
            return stats;
        }
        catch (aggregationError) {
            logger_1.default.error('Payment stats aggregation error:', aggregationError);
            // Fallback to basic stats
            const fallbackStats = await Transaction_model_1.Transaction.find(baseQuery).select('amount gasFee completedAt');
            const totalTransactions = fallbackStats.length;
            const totalVolume = fallbackStats.reduce((sum, tx) => sum + tx.amount, 0);
            const totalGasFees = fallbackStats.reduce((sum, tx) => sum + tx.gasFee, 0);
            return {
                period,
                overview: {
                    totalTransactions,
                    totalVolume,
                    totalGasFees,
                    averageTransaction: totalTransactions > 0 ? totalVolume / totalTransactions : 0,
                },
                generatedAt: now,
                fallback: true,
            };
        }
    }
    async cancelTransaction(transactionId, userId, reason) {
        const transaction = await Transaction_model_1.Transaction.findById(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        // Verify ownership
        if (transaction.userId.toString() !== userId) {
            throw new Error('Unauthorized to cancel this transaction');
        }
        // Check if transaction can be cancelled
        if (transaction.status === 'completed') {
            throw new Error('Cannot cancel completed transaction');
        }
        if (transaction.status === 'cancelled') {
            throw new Error('Transaction already cancelled');
        }
        // Cancel the transaction
        transaction.status = 'cancelled';
        transaction.failureReason = reason || 'Cancelled by user';
        await transaction.save();
        logger_1.default.info(`Transaction cancelled`, {
            transactionId,
            userId,
            reason: reason || 'User cancelled',
        });
        return transaction;
    }
    async retryTransaction(transactionId, userId) {
        const originalTransaction = await Transaction_model_1.Transaction.findById(transactionId);
        if (!originalTransaction) {
            throw new Error('Original transaction not found');
        }
        // Verify ownership
        if (originalTransaction.userId.toString() !== userId) {
            throw new Error('Unauthorized to retry this transaction');
        }
        // Check if transaction can be retried
        if (originalTransaction.status !== 'failed') {
            throw new Error('Only failed transactions can be retried');
        }
        // Retry the payment using original parameters
        const newTransaction = await this.processPayment(originalTransaction.cardUuid, originalTransaction.amount, originalTransaction.merchantId.toString(), {
            ...originalTransaction.metadata,
            retryOf: originalTransaction._id,
            retryAttempt: (originalTransaction.metadata?.retryAttempt || 0) + 1,
        });
        logger_1.default.info(`Payment retry initiated`, {
            originalTransactionId: transactionId,
            newTransactionId: newTransaction._id,
            userId,
        });
        return {
            originalTransaction,
            newTransaction,
        };
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map