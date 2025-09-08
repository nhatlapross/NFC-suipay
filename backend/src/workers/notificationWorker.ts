import { Job } from 'bull';
import { notificationQueue } from '../config/queue.config';
import { User } from '../models/User.model';
import { Transaction } from '../models/Transaction.model';
import { setCached, getCached } from '../config/redis.config';
import logger from '../utils/logger';
import { socketService } from '../services/socket.service';

// Notification job interfaces
interface PaymentNotificationData {
  userId: string;
  transactionId: string;
  amount: number;
  merchantId?: string;
  type: 'processing' | 'success' | 'failed';
  txHash?: string;
  error?: string;
}

interface AlertNotificationData {
  transactionId: string;
  errorMessage: string;
  timestamp: Date;
  requiresManualReview: boolean;
}

// Start notification workers
export function startNotificationWorkers() {
  logger.info('🔔 Starting notification workers...');
  
  // Payment processing notification
  notificationQueue.process('paymentProcessing', 10, async (job: Job<PaymentNotificationData>) => {
    const { userId, transactionId, amount, merchantId } = job.data;
    
    logger.info(`Processing payment notification for user ${userId}`);
    
    try {
      const user = await User.findById(userId);
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
      socketService.emitTransactionUpdate(userId, {
        type: 'notification',
        title: notification.title,
        message: notification.body,
        transactionId,
        timestamp: new Date(),
      });
      
      // Cache notification for user dashboard
      const notificationKey = `user:notifications:${userId}`;
      const existingNotifications = await getCached(notificationKey) || [];
      const updatedNotifications = [{
        id: `notif_${Date.now()}`,
        ...notification,
        timestamp: new Date(),
        read: false,
      }, ...existingNotifications.slice(0, 49)]; // Keep last 50 notifications
      
      await setCached(notificationKey, updatedNotifications, 7 * 24 * 60 * 60); // 7 days
      
      logger.info(`Payment processing notification sent to user ${userId}`);
      
      return { success: true, userId, transactionId };
      
    } catch (error: any) {
      logger.error(`Failed to send payment processing notification:`, error);
      throw error;
    }
  });
  
  // Payment success notification
  notificationQueue.process('paymentSuccess', 10, async (job: Job<PaymentNotificationData>) => {
    const { userId, transactionId, txHash, amount } = job.data;
    
    logger.info(`Processing payment success notification for user ${userId}`);
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      
      const transaction = await Transaction.findOne({ transactionId });
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
      socketService.emitTransactionUpdate(userId, {
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
      
      logger.info(`Payment success notification sent to user ${userId}`);
      
      return { success: true, userId, transactionId, txHash };
      
    } catch (error: any) {
      logger.error(`Failed to send payment success notification:`, error);
      throw error;
    }
  });
  
  // Payment failed notification
  notificationQueue.process('paymentFailed', 10, async (job: Job<PaymentNotificationData>) => {
    const { userId, transactionId, error: errorMessage } = job.data;
    
    logger.info(`Processing payment failed notification for user ${userId}`);
    
    try {
      const user = await User.findById(userId);
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
      socketService.emitTransactionUpdate(userId, {
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
      
      logger.info(`Payment failed notification sent to user ${userId}`);
      
      return { success: true, userId, transactionId };
      
    } catch (error: any) {
      logger.error(`Failed to send payment failed notification:`, error);
      throw error;
    }
  });
  
  // Alert for failed transactions requiring manual review
  notificationQueue.process('alertFailedTransaction', 5, async (job: Job<AlertNotificationData>) => {
    const { transactionId, errorMessage, requiresManualReview } = job.data;
    
    logger.warn(`Processing alert for failed transaction ${transactionId}`);
    
    try {
      const transaction = await Transaction.findOne({ transactionId }).populate('userId', 'email fullName');
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }
      
      // Log to admin monitoring system
      logger.error(`🚨 ALERT: Failed transaction requiring review`, {
        transactionId,
        userId: transaction.userId,
        amount: transaction.amount,
        error: errorMessage,
        requiresManualReview,
        timestamp: new Date(),
      });
      
      // Send alert to admin dashboard via WebSocket
      socketService.broadcast('admin:alert', {
        type: 'failed_transaction',
        transactionId,
        userId: (transaction.userId as any)?._id,
        userEmail: (transaction.userId as any)?.email,
        userName: (transaction.userId as any)?.fullName,
        amount: transaction.amount,
        error: errorMessage,
        requiresManualReview,
        timestamp: new Date(),
      });
      
      // Cache alert for admin dashboard
      const alertKey = 'admin:failed_transactions';
      const existingAlerts = await getCached(alertKey) || [];
      const newAlert = {
        id: `alert_${Date.now()}`,
        transactionId,
        error: errorMessage,
        requiresManualReview,
        timestamp: new Date(),
        resolved: false,
      };
      
      const updatedAlerts = [newAlert, ...existingAlerts.slice(0, 99)]; // Keep last 100 alerts
      await setCached(alertKey, updatedAlerts, 30 * 24 * 60 * 60); // 30 days
      
      logger.info(`Admin alert sent for failed transaction ${transactionId}`);
      
      return { success: true, transactionId };
      
    } catch (error: any) {
      logger.error(`Failed to process admin alert:`, error);
      throw error;
    }
  });
  
  // Daily spending summary notification
  notificationQueue.process('dailySpendingSummary', 3, async (job: Job) => {
    const { userId, date, totalSpent, transactionCount } = job.data;
    
    logger.info(`Processing daily spending summary for user ${userId}`);
    
    try {
      const user = await User.findById(userId);
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
      socketService.emitTransactionUpdate(userId, {
        type: 'notification',
        title: notification.title,
        message: notification.body,
        data: notification.data,
        timestamp: new Date(),
      });
      
      // Update notification cache
      await updateUserNotificationCache(userId, notification);
      
      logger.info(`Daily spending summary sent to user ${userId}`);
      
      return { success: true, userId };
      
    } catch (error: any) {
      logger.error(`Failed to send daily spending summary:`, error);
      throw error;
    }
  });
  
  logger.info('✅ Notification workers started successfully');
}

// Helper functions
async function updateUserNotificationCache(userId: string, notification: any) {
  try {
    const notificationKey = `user:notifications:${userId}`;
    const existingNotifications = await getCached(notificationKey) || [];
    const updatedNotifications = [{
      id: `notif_${Date.now()}`,
      ...notification,
      timestamp: new Date(),
      read: false,
    }, ...existingNotifications.slice(0, 49)];
    
    await setCached(notificationKey, updatedNotifications, 7 * 24 * 60 * 60); // 7 days
    
  } catch (error) {
    logger.error('Failed to update notification cache:', error);
  }
}

async function sendEmailNotification(email: string, notification: any) {
  try {
    // Mock email sending implementation
    logger.info(`📧 Email notification sent to ${email}:`, {
      title: notification.title,
      body: notification.body,
    });
    
    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    
  } catch (error) {
    logger.error('Failed to send email notification:', error);
  }
}

async function sendSupportAlert(user: any, transactionId: string, errorMessage: string) {
  try {
    logger.info(`📞 Support alert sent for user ${user._id}:`, {
      userEmail: user.email,
      transactionId,
      error: errorMessage,
    });
    
    // TODO: Integrate with support ticketing system
    
  } catch (error) {
    logger.error('Failed to send support alert:', error);
  }
}

