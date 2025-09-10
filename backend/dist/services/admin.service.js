"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = exports.AdminService = void 0;
const Transaction_model_1 = require("../models/Transaction.model");
const User_model_1 = require("../models/User.model");
const Merchant_model_1 = require("../models/Merchant.model");
const Card_model_1 = require("../models/Card.model");
const logger_1 = __importDefault(require("../utils/logger"));
class AdminService {
    // === PAYMENT MONITORING DASHBOARD ===
    async getPaymentDashboard() {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            // Get transaction counts and volumes
            const [todayStats, weekStats, monthStats] = await Promise.all([
                this.getTransactionStats(today, now),
                this.getTransactionStats(weekAgo, now),
                this.getTransactionStats(monthAgo, now)
            ]);
            // Get failure analysis for last 7 days
            const failureAnalysis = await this.getFailureAnalysis(weekAgo, now);
            // Get system metrics
            const [activeCards, activeMerchants, avgTransactionTime] = await Promise.all([
                Card_model_1.Card.countDocuments({ isActive: true }),
                Merchant_model_1.Merchant.countDocuments({ isActive: true }),
                this.getAverageTransactionTime()
            ]);
            return {
                totalTransactions: {
                    today: todayStats.count,
                    week: weekStats.count,
                    month: monthStats.count
                },
                totalVolume: {
                    today: todayStats.volume,
                    week: weekStats.volume,
                    month: monthStats.volume
                },
                successRate: {
                    today: todayStats.successRate,
                    week: weekStats.successRate,
                    month: monthStats.successRate
                },
                failureAnalysis,
                activeCards,
                activeMerchants,
                averageTransactionTime: avgTransactionTime
            };
        }
        catch (error) {
            logger_1.default.error('Error getting payment dashboard:', error);
            throw error;
        }
    }
    async getTransactionStats(startDate, endDate) {
        const [totalStats, successStats] = await Promise.all([
            Transaction_model_1.Transaction.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        type: { $in: ['payment', 'nfc_payment'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        volume: { $sum: '$amount' }
                    }
                }
            ]),
            Transaction_model_1.Transaction.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        type: { $in: ['payment', 'nfc_payment'] },
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);
        const total = totalStats[0] || { count: 0, volume: 0 };
        const success = successStats[0] || { count: 0 };
        const successRate = total.count > 0 ? (success.count / total.count) * 100 : 0;
        return {
            count: total.count,
            volume: total.volume,
            successRate: Math.round(successRate * 100) / 100
        };
    }
    async getFailureAnalysis(startDate, endDate) {
        const failures = await Transaction_model_1.Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'failed'
                }
            },
            {
                $group: {
                    _id: '$failureReason',
                    count: { $sum: 1 }
                }
            }
        ]);
        const analysis = {
            networkErrors: 0,
            cardErrors: 0,
            insufficientFunds: 0,
            merchantErrors: 0,
            systemErrors: 0
        };
        failures.forEach(failure => {
            const reason = failure._id?.toLowerCase() || '';
            if (reason.includes('network') || reason.includes('timeout')) {
                analysis.networkErrors += failure.count;
            }
            else if (reason.includes('card') || reason.includes('nfc')) {
                analysis.cardErrors += failure.count;
            }
            else if (reason.includes('insufficient') || reason.includes('balance')) {
                analysis.insufficientFunds += failure.count;
            }
            else if (reason.includes('merchant')) {
                analysis.merchantErrors += failure.count;
            }
            else {
                analysis.systemErrors += failure.count;
            }
        });
        return analysis;
    }
    async getAverageTransactionTime() {
        const result = await Transaction_model_1.Transaction.aggregate([
            {
                $match: {
                    status: 'completed',
                    processingTime: { $exists: true, $gt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    avgTime: { $avg: '$processingTime' }
                }
            }
        ]);
        return result[0]?.avgTime || 0;
    }
    // === TRANSACTION MANAGEMENT ===
    async getTransactions(filter, page = 1, limit = 20) {
        try {
            const query = {};
            if (filter.status)
                query.status = filter.status;
            if (filter.merchantId)
                query.merchantId = filter.merchantId;
            if (filter.userId)
                query.userId = filter.userId;
            if (filter.cardId)
                query.cardId = filter.cardId;
            if (filter.startDate || filter.endDate) {
                query.createdAt = {};
                if (filter.startDate)
                    query.createdAt.$gte = filter.startDate;
                if (filter.endDate)
                    query.createdAt.$lte = filter.endDate;
            }
            if (filter.minAmount || filter.maxAmount) {
                query.amount = {};
                if (filter.minAmount)
                    query.amount.$gte = filter.minAmount;
                if (filter.maxAmount)
                    query.amount.$lte = filter.maxAmount;
            }
            if (filter.paymentMethod)
                query.paymentMethod = filter.paymentMethod;
            const skip = (page - 1) * limit;
            const [transactions, total] = await Promise.all([
                Transaction_model_1.Transaction.find(query)
                    .populate('userId', 'fullName email')
                    .populate('merchantId', 'merchantName businessType')
                    .populate('cardId', 'cardType lastFourDigits')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Transaction_model_1.Transaction.countDocuments(query)
            ]);
            return {
                transactions,
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            };
        }
        catch (error) {
            logger_1.default.error('Error getting transactions:', error);
            throw error;
        }
    }
    async getTransactionById(transactionId) {
        try {
            const transaction = await Transaction_model_1.Transaction.findById(transactionId)
                .populate('userId', 'fullName email phoneNumber')
                .populate('merchantId', 'merchantName businessType email')
                .populate('cardId', 'cardType cardNumber isActive')
                .lean();
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            return transaction;
        }
        catch (error) {
            logger_1.default.error('Error getting transaction by ID:', error);
            throw error;
        }
    }
    async forceRefundTransaction(transactionId, reason, adminId) {
        try {
            const transaction = await Transaction_model_1.Transaction.findById(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            if (transaction.status !== 'completed') {
                throw new Error('Can only refund completed transactions');
            }
            if (transaction.refundedAt) {
                throw new Error('Transaction already refunded');
            }
            // Create refund transaction
            const refundTransaction = await Transaction_model_1.Transaction.create({
                userId: transaction.userId,
                cardId: transaction.cardId,
                cardUuid: transaction.cardUuid,
                type: 'admin_refund',
                amount: transaction.amount,
                currency: transaction.currency,
                merchantId: transaction.merchantId,
                status: 'completed',
                fromAddress: transaction.toAddress,
                toAddress: transaction.fromAddress,
                originalTransactionId: transaction._id,
                metadata: {
                    reason,
                    refundType: 'admin_forced',
                    adminId,
                    originalTransactionId: transaction._id
                }
            });
            // Update original transaction
            transaction.refundedAt = new Date();
            transaction.refundAmount = transaction.amount;
            transaction.refundReason = reason;
            transaction.refundType = 'admin_forced';
            await transaction.save();
            logger_1.default.info('Admin forced refund completed', {
                transactionId,
                refundTransactionId: refundTransaction._id,
                amount: transaction.amount,
                reason,
                adminId
            });
            return {
                originalTransaction: transaction,
                refundTransaction,
                refundAmount: transaction.amount
            };
        }
        catch (error) {
            logger_1.default.error('Error processing admin refund:', error);
            throw error;
        }
    }
    async updateTransactionStatus(transactionId, newStatus, reason, adminId) {
        try {
            const transaction = await Transaction_model_1.Transaction.findById(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            const oldStatus = transaction.status;
            transaction.status = newStatus;
            if (reason || adminId) {
                transaction.metadata = {
                    ...transaction.metadata,
                    statusChangeReason: reason,
                    statusChangedBy: adminId,
                    statusChangeDate: new Date(),
                    previousStatus: oldStatus
                };
            }
            await transaction.save();
            logger_1.default.info('Transaction status updated by admin', {
                transactionId,
                oldStatus,
                newStatus,
                reason,
                adminId
            });
            return transaction;
        }
        catch (error) {
            logger_1.default.error('Error updating transaction status:', error);
            throw error;
        }
    }
    // === NFC CARD MONITORING ===
    async getCardHealthStatus() {
        try {
            const cardStats = await Card_model_1.Card.aggregate([
                {
                    $group: {
                        _id: '$isActive',
                        count: { $sum: 1 }
                    }
                }
            ]);
            const failedTransactions = await Transaction_model_1.Transaction.aggregate([
                {
                    $match: {
                        status: 'failed',
                        failureReason: { $regex: /card|nfc/i },
                        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $group: {
                        _id: '$cardId',
                        failureCount: { $sum: 1 }
                    }
                },
                { $sort: { failureCount: -1 } },
                { $limit: 10 }
            ]);
            return {
                cardStats: cardStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {}),
                problematicCards: failedTransactions
            };
        }
        catch (error) {
            logger_1.default.error('Error getting card health status:', error);
            throw error;
        }
    }
    async getCardById(cardId) {
        try {
            const card = await Card_model_1.Card.findOne({ $or: [{ _id: cardId }, { cardUuid: cardId }] })
                .populate('userId', 'fullName email')
                .lean();
            if (!card) {
                throw new Error('Card not found');
            }
            // Get recent transactions for this card
            const recentTransactions = await Transaction_model_1.Transaction.find({ cardId: card._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('merchantId', 'merchantName')
                .lean();
            return {
                ...card,
                recentTransactions
            };
        }
        catch (error) {
            logger_1.default.error('Error getting card by ID:', error);
            throw error;
        }
    }
    async blockCard(cardId, reason, adminId) {
        try {
            const card = await Card_model_1.Card.findOne({ $or: [{ _id: cardId }, { cardUuid: cardId }] });
            if (!card) {
                throw new Error('Card not found');
            }
            card.isActive = false;
            card.blockedReason = reason;
            card.blockedAt = new Date();
            if (!card.metadata)
                card.metadata = {};
            card.metadata.blockedBy = adminId;
            await card.save();
            logger_1.default.info('Card blocked by admin', {
                cardId: card.cardUuid,
                reason,
                adminId
            });
            return card;
        }
        catch (error) {
            logger_1.default.error('Error blocking card:', error);
            throw error;
        }
    }
    async unblockCard(cardId, adminId) {
        try {
            const card = await Card_model_1.Card.findOne({ $or: [{ _id: cardId }, { cardUuid: cardId }] });
            if (!card) {
                throw new Error('Card not found');
            }
            card.isActive = true;
            card.blockedReason = undefined;
            card.blockedAt = undefined;
            if (!card.metadata)
                card.metadata = {};
            card.metadata.unblockedBy = adminId;
            card.metadata.unblockedAt = new Date();
            await card.save();
            logger_1.default.info('Card unblocked by admin', {
                cardId: card.cardUuid,
                adminId
            });
            return card;
        }
        catch (error) {
            logger_1.default.error('Error unblocking card:', error);
            throw error;
        }
    }
    // === PAYMENT SYSTEM HEALTH ===
    async getSystemHealthMetrics() {
        try {
            const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const [transactionMetrics, errorMetrics, performanceMetrics, systemStatus] = await Promise.all([
                this.getTransactionMetrics(last24Hours),
                this.getErrorMetrics(last24Hours),
                this.getPerformanceMetrics(last24Hours),
                this.getSystemStatus()
            ]);
            return {
                transactionMetrics,
                errorMetrics,
                performanceMetrics,
                systemStatus,
                timestamp: new Date()
            };
        }
        catch (error) {
            logger_1.default.error('Error getting system health metrics:', error);
            throw error;
        }
    }
    async getTransactionMetrics(since) {
        return await Transaction_model_1.Transaction.aggregate([
            { $match: { createdAt: { $gte: since } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    successful: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    failed: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    totalVolume: { $sum: '$amount' }
                }
            }
        ]);
    }
    async getErrorMetrics(since) {
        return await Transaction_model_1.Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: since },
                    status: 'failed'
                }
            },
            {
                $group: {
                    _id: '$failureReason',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
    }
    async getPerformanceMetrics(since) {
        const result = await Transaction_model_1.Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: since },
                    status: 'completed',
                    processingTime: { $exists: true }
                }
            },
            {
                $group: {
                    _id: null,
                    avgProcessingTime: { $avg: '$processingTime' },
                    maxProcessingTime: { $max: '$processingTime' },
                    minProcessingTime: { $min: '$processingTime' }
                }
            }
        ]);
        return result[0] || {
            avgProcessingTime: 0,
            maxProcessingTime: 0,
            minProcessingTime: 0
        };
    }
    async getSystemStatus() {
        const [activeUsers, activeMerchants, activeCards] = await Promise.all([
            User_model_1.User.countDocuments({ status: 'active' }),
            Merchant_model_1.Merchant.countDocuments({ isActive: true }),
            Card_model_1.Card.countDocuments({ isActive: true })
        ]);
        return {
            activeUsers,
            activeMerchants,
            activeCards,
            databaseStatus: 'healthy', // This would be a real health check
            cacheStatus: 'healthy', // This would be a real health check
            queueStatus: 'healthy' // This would be a real health check
        };
    }
    // === MERCHANT PAYMENT MONITORING ===
    async getMerchantPaymentHealth(merchantId) {
        try {
            const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const matchQuery = { createdAt: { $gte: last7Days } };
            if (merchantId) {
                matchQuery.merchantId = merchantId;
            }
            const merchantStats = await Transaction_model_1.Transaction.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: '$merchantId',
                        totalTransactions: { $sum: 1 },
                        successfulTransactions: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        },
                        failedTransactions: {
                            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                        },
                        totalVolume: { $sum: '$amount' },
                        avgTransactionAmount: { $avg: '$amount' }
                    }
                },
                {
                    $lookup: {
                        from: 'merchants',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'merchant'
                    }
                },
                {
                    $addFields: {
                        successRate: {
                            $multiply: [
                                { $divide: ['$successfulTransactions', '$totalTransactions'] },
                                100
                            ]
                        },
                        merchant: { $arrayElemAt: ['$merchant', 0] }
                    }
                },
                { $sort: { totalTransactions: -1 } }
            ]);
            return merchantStats.map(stat => ({
                merchantId: stat._id,
                merchantName: stat.merchant?.merchantName || 'Unknown',
                totalTransactions: stat.totalTransactions,
                successRate: Math.round(stat.successRate * 100) / 100,
                failedTransactions: stat.failedTransactions,
                totalVolume: stat.totalVolume,
                avgTransactionAmount: Math.round(stat.avgTransactionAmount * 100) / 100,
                isHealthy: stat.successRate >= 95 // 95% success rate threshold
            }));
        }
        catch (error) {
            logger_1.default.error('Error getting merchant payment health:', error);
            throw error;
        }
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
//# sourceMappingURL=admin.service.js.map