"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNotificationWorkers = startNotificationWorkers;
const queue_config_1 = require("../config/queue.config");
const User_model_1 = require("../models/User.model");
const Transaction_model_1 = require("../models/Transaction.model");
const redis_config_1 = require("../config/redis.config");
const logger_1 = __importDefault(require("../utils/logger"));
const socket_service_1 = require("../services/socket.service");
// Start notification workers
function startNotificationWorkers() {
    logger_1.default.info('🔔 Starting notification workers...');
    // Payment processing notification
    queue_config_1.notificationQueue.process('paymentProcessing', 10, async (job) => {
        const { userId, transactionId, amount, merchantId } = job.data;
        logger_1.default.info(`Processing payment notification for user ${userId}`);
        try {
            const user = await User_model_1.User.findById(userId);
            if (!user) {
                throw new Error(`User ${userId} not found`);
            }
            // Send push notification (mock implementation)
            const notification = {
                title: 'Payment Processing',
                body: `Your payment of ${amount} SUI is being processed`,
                data: {
                    type: 'payment_processing',
                    transactionId,
                    amount,
                    merchantId,
                },
            };
            // Send real-time notification via WebSocket
            socket_service_1.socketService.emitTransactionUpdate(userId, {
                type: 'notification',
                title: notification.title,
                message: notification.body,
                transactionId,
                timestamp: new Date(),
            });
            // Cache notification for user dashboard
            const notificationKey = `user:notifications:${userId}`;
            const existingNotifications = await (0, redis_config_1.getCached)(notificationKey) || [];
            const updatedNotifications = [{
                    id: `notif_${Date.now()}`,
                    ...notification,
                    timestamp: new Date(),
                    read: false,
                }, ...existingNotifications.slice(0, 49)]; // Keep last 50 notifications
            await (0, redis_config_1.setCached)(notificationKey, updatedNotifications, 7 * 24 * 60 * 60); // 7 days
            logger_1.default.info(`Payment processing notification sent to user ${userId}`);
            return { success: true, userId, transactionId };
        }
        catch (error) {
            logger_1.default.error(`Failed to send payment processing notification:`, error);
            throw error;
        }
    });
    // Payment success notification
    queue_config_1.notificationQueue.process('paymentSuccess', 10, async (job) => {
        const { userId, transactionId, txHash, amount } = job.data;
        logger_1.default.info(`Processing payment success notification for user ${userId}`);
        try {
            const user = await User_model_1.User.findById(userId);
            if (!user) {
                throw new Error(`User ${userId} not found`);
            }
            const transaction = await Transaction_model_1.Transaction.findOne({ transactionId });
            if (!transaction) {
                throw new Error(`Transaction ${transactionId} not found`);
            }
            const notification = {
                title: 'Payment Successful! ✅',
                body: `Your payment of ${amount} SUI has been completed successfully`,
                data: {
                    type: 'payment_success',
                    transactionId,
                    txHash,
                    amount,
                    explorerUrl: `https://suiscan.xyz/testnet/tx/${txHash}`,
                },
            };
            // Send real-time notification
            socket_service_1.socketService.emitTransactionUpdate(userId, {
                type: 'notification',
                title: notification.title,
                message: notification.body,
                transactionId,
                txHash,
                status: 'completed',
                explorerUrl: notification.data.explorerUrl,
                timestamp: new Date(),
            });
            // Update notification cache
            await updateUserNotificationCache(userId, notification);
            // Send email notification (mock)
            await sendEmailNotification(user.email, notification);
            logger_1.default.info(`Payment success notification sent to user ${userId}`);
            return { success: true, userId, transactionId, txHash };
        }
        catch (error) {
            logger_1.default.error(`Failed to send payment success notification:`, error);
            throw error;
        }
    });
    // Payment failed notification
    queue_config_1.notificationQueue.process('paymentFailed', 10, async (job) => {
        const { userId, transactionId, error: errorMessage } = job.data;
        logger_1.default.info(`Processing payment failed notification for user ${userId}`);
        try {
            const user = await User_model_1.User.findById(userId);
            if (!user) {
                throw new Error(`User ${userId} not found`);
            }
            const notification = {
                title: 'Payment Failed ❌',
                body: `Your payment could not be processed: ${errorMessage}`,
                data: {
                    type: 'payment_failed',
                    transactionId,
                    error: errorMessage,
                    timestamp: new Date(),
                },
            };
            // Send real-time notification
            socket_service_1.socketService.emitTransactionUpdate(userId, {
                type: 'notification',
                title: notification.title,
                message: notification.body,
                transactionId,
                status: 'failed',
                error: errorMessage,
                timestamp: new Date(),
            });
            // Update notification cache
            await updateUserNotificationCache(userId, notification);
            // Send support email for failed payments
            await sendSupportAlert(user, transactionId, errorMessage || 'Unknown error');
            logger_1.default.info(`Payment failed notification sent to user ${userId}`);
            return { success: true, userId, transactionId };
        }
        catch (error) {
            logger_1.default.error(`Failed to send payment failed notification:`, error);
            throw error;
        }
    });
    // Alert for failed transactions requiring manual review
    queue_config_1.notificationQueue.process('alertFailedTransaction', 5, async (job) => {
        const { transactionId, errorMessage, requiresManualReview } = job.data;
        logger_1.default.warn(`Processing alert for failed transaction ${transactionId}`);
        try {
            const transaction = await Transaction_model_1.Transaction.findOne({ transactionId }).populate('userId', 'email fullName');
            if (!transaction) {
                throw new Error(`Transaction ${transactionId} not found`);
            }
            // Log to admin monitoring system
            logger_1.default.error(`🚨 ALERT: Failed transaction requiring review`, {
                transactionId,
                userId: transaction.userId,
                amount: transaction.amount,
                error: errorMessage,
                requiresManualReview,
                timestamp: new Date(),
            });
            // Send alert to admin dashboard via WebSocket
            socket_service_1.socketService.broadcast('admin:alert', {
                type: 'failed_transaction',
                transactionId,
                userId: transaction.userId?._id,
                userEmail: transaction.userId?.email,
                userName: transaction.userId?.fullName,
                amount: transaction.amount,
                error: errorMessage,
                requiresManualReview,
                timestamp: new Date(),
            });
            // Cache alert for admin dashboard
            const alertKey = 'admin:failed_transactions';
            const existingAlerts = await (0, redis_config_1.getCached)(alertKey) || [];
            const newAlert = {
                id: `alert_${Date.now()}`,
                transactionId,
                error: errorMessage,
                requiresManualReview,
                timestamp: new Date(),
                resolved: false,
            };
            const updatedAlerts = [newAlert, ...existingAlerts.slice(0, 99)]; // Keep last 100 alerts
            await (0, redis_config_1.setCached)(alertKey, updatedAlerts, 30 * 24 * 60 * 60); // 30 days
            logger_1.default.info(`Admin alert sent for failed transaction ${transactionId}`);
            return { success: true, transactionId };
        }
        catch (error) {
            logger_1.default.error(`Failed to process admin alert:`, error);
            throw error;
        }
    });
    // Daily spending summary notification
    queue_config_1.notificationQueue.process('dailySpendingSummary', 3, async (job) => {
        const { userId, date, totalSpent, transactionCount } = job.data;
        logger_1.default.info(`Processing daily spending summary for user ${userId}`);
        try {
            const user = await User_model_1.User.findById(userId);
            if (!user) {
                throw new Error(`User ${userId} not found`);
            }
            const notification = {
                title: 'Daily Spending Summary 📊',
                body: `You spent ${totalSpent} SUI across ${transactionCount} transactions today`,
                data: {
                    type: 'daily_summary',
                    date,
                    totalSpent,
                    transactionCount,
                    timestamp: new Date(),
                },
            };
            // Send notification
            socket_service_1.socketService.emitTransactionUpdate(userId, {
                type: 'notification',
                title: notification.title,
                message: notification.body,
                data: notification.data,
                timestamp: new Date(),
            });
            // Update notification cache
            await updateUserNotificationCache(userId, notification);
            logger_1.default.info(`Daily spending summary sent to user ${userId}`);
            return { success: true, userId };
        }
        catch (error) {
            logger_1.default.error(`Failed to send daily spending summary:`, error);
            throw error;
        }
    });
    logger_1.default.info('✅ Notification workers started successfully');
}
// Helper functions
async function updateUserNotificationCache(userId, notification) {
    try {
        const notificationKey = `user:notifications:${userId}`;
        const existingNotifications = await (0, redis_config_1.getCached)(notificationKey) || [];
        const updatedNotifications = [{
                id: `notif_${Date.now()}`,
                ...notification,
                timestamp: new Date(),
                read: false,
            }, ...existingNotifications.slice(0, 49)];
        await (0, redis_config_1.setCached)(notificationKey, updatedNotifications, 7 * 24 * 60 * 60); // 7 days
    }
    catch (error) {
        logger_1.default.error('Failed to update notification cache:', error);
    }
}
async function sendEmailNotification(email, notification) {
    try {
        // Mock email sending implementation
        logger_1.default.info(`📧 Email notification sent to ${email}:`, {
            title: notification.title,
            body: notification.body,
        });
        // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    }
    catch (error) {
        logger_1.default.error('Failed to send email notification:', error);
    }
}
async function sendSupportAlert(user, transactionId, errorMessage) {
    try {
        logger_1.default.info(`📞 Support alert sent for user ${user._id}:`, {
            userEmail: user.email,
            transactionId,
            error: errorMessage,
        });
        // TODO: Integrate with support ticketing system
    }
    catch (error) {
        logger_1.default.error('Failed to send support alert:', error);
    }
}
//# sourceMappingURL=notificationWorker.js.map