import { Job } from 'bull';
import { paymentQueue, notificationQueue, blockchainQueue } from '../config/queue.config';
import { Transaction } from '../models/Transaction.model';
import { User } from '../models/User.model';
import { Card } from '../models/Card.model';
import processNFCPaymentJob from '../queues/payment.processor';
import { setCached, getCached, NFCCacheKeys } from '../config/redis.config';
import logger from '../utils/logger';
import { socketService } from '../services/socket.service';

interface PaymentJobData {
  transactionId: string;
  paymentData: {
    cardUuid: string;
    amount: number;
    merchantId: string;
    merchantWalletAddress: string;
    terminalId: string;
    userId: string;
    userWalletAddress: string;
    gasFee: number;
    totalAmount: number;
  };
}

// Start payment workers
export function startPaymentWorkers() {
  logger.info('🚀 Starting payment workers...');
  
  // Main payment processor - use the new comprehensive processor
  paymentQueue.process('processNFCPayment', 5, processNFCPaymentJob);
  
  // Legacy payment processor (for backward compatibility)
  paymentQueue.process('legacyProcessPayment', 3, async (job: Job<PaymentJobData>) => {
    const { transactionId, paymentData } = job.data;
    
    logger.info(`Processing payment job ${job.id} for transaction ${transactionId}`);
    
    try {
      // Update transaction status to processing
      await Transaction.findOneAndUpdate(
        { transactionId },
        { 
          status: 'processing',
          processingStartedAt: new Date()
        }
      );
      
      // Emit real-time update
      socketService.emitTransactionUpdate(paymentData.userId, {
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
      const blockchainJob = await blockchainQueue.add(
        'processSuiTransaction',
        {
          transactionId,
          paymentData,
          retryCount: 0
        },
        {
          priority: 10,
          delay: 0
        }
      );
      
      logger.info(`Blockchain job ${blockchainJob.id} created for transaction ${transactionId}`);
      
      // Step 3: Update caches
      await updateCachesAfterPayment(paymentData);
      
      // Step 4: Send notifications
      await notificationQueue.add(
        'paymentProcessing',
        {
          userId: paymentData.userId,
          transactionId,
          amount: paymentData.amount,
          merchantId: paymentData.merchantId
        }
      );
      
      return {
        success: true,
        transactionId,
        blockchainJobId: blockchainJob.id
      };
      
    } catch (error: any) {
      logger.error(`Payment processing failed for ${transactionId}:`, error);
      
      // Update transaction status to failed
      await Transaction.findOneAndUpdate(
        { transactionId },
        { 
          status: 'failed',
          failureReason: error.message,
          completedAt: new Date()
        }
      );
      
      // Emit failure update
      socketService.emitTransactionUpdate(paymentData.userId, {
        transactionId,
        status: 'failed',
        error: error.message,
        message: 'Payment processing failed'
      });
      
      // Add to failed notification queue
      await notificationQueue.add(
        'paymentFailed',
        {
          userId: paymentData.userId,
          transactionId,
          error: error.message
        }
      );
      
      throw error;
    }
  });
  
  // Blockchain transaction processor
  blockchainQueue.process('processSuiTransaction', 3, async (job: Job) => {
    const { transactionId, paymentData, retryCount } = job.data;
    
    logger.info(`Processing blockchain job ${job.id} for transaction ${transactionId}`);
    
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
      await Transaction.findOneAndUpdate(
        { transactionId },
        {
          status: 'completed',
          txHash: txResult.txHash,
          gasUsed: txResult.gasUsed,
          blockNumber: txResult.blockNumber,
          completedAt: new Date()
        }
      );
      
      // Clear relevant caches
      await clearTransactionCaches(paymentData.cardUuid);
      
      // Emit success update
      socketService.emitTransactionUpdate(paymentData.userId, {
        transactionId,
        status: 'completed',
        txHash: txResult.txHash,
        message: 'Payment completed successfully',
        explorerUrl: `https://suiscan.xyz/testnet/tx/${txResult.txHash}`
      });
      
      // Send success notification
      await notificationQueue.add(
        'paymentSuccess',
        {
          userId: paymentData.userId,
          transactionId,
          txHash: txResult.txHash,
          amount: paymentData.amount
        },
        {
          priority: 5
        }
      );
      
      return {
        success: true,
        txHash: txResult.txHash,
        transactionId
      };
      
    } catch (error: any) {
      logger.error(`Blockchain transaction failed for ${transactionId}:`, error);
      
      // Handle retry logic
      if (retryCount < 3) {
        logger.info(`Retrying blockchain transaction for ${transactionId}, attempt ${retryCount + 1}`);
        
        await blockchainQueue.add(
          'processSuiTransaction',
          {
            transactionId,
            paymentData,
            retryCount: retryCount + 1
          },
          {
            delay: 5000 * (retryCount + 1), // Exponential backoff
            priority: 15
          }
        );
        
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
  
  logger.info('✅ Payment workers started successfully');
}

// Helper functions
async function verifyPaymentConditions(paymentData: any): Promise<{valid: boolean, reason?: string}> {
  try {
    // Check card status
    const card = await Card.findOne({ cardUuid: paymentData.cardUuid, isActive: true });
    if (!card) {
      return { valid: false, reason: 'Card not found or inactive' };
    }
    
    // Check user wallet balance (if needed)
    const user = await User.findById(paymentData.userId);
    if (!user) {
      return { valid: false, reason: 'User not found' };
    }
    
    // Check daily spending limit
    const today = new Date().toISOString().split('T')[0];
    const dailySpendingKey = NFCCacheKeys.dailySpending(paymentData.cardUuid, today);
    const currentSpending = await getCached(dailySpendingKey) || 0;
    
    const dailyLimit = 2000000; // 2M VND default
    if (currentSpending + paymentData.amount > dailyLimit) {
      return { valid: false, reason: 'Daily spending limit exceeded' };
    }
    
    return { valid: true };
    
  } catch (error: any) {
    logger.error('Payment verification failed:', error);
    return { valid: false, reason: 'Verification error' };
  }
}

async function updateCachesAfterPayment(paymentData: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailySpendingKey = NFCCacheKeys.dailySpending(paymentData.cardUuid, today);
    
    // Update daily spending
    const currentSpending = await getCached(dailySpendingKey) || 0;
    await setCached(
      dailySpendingKey,
      currentSpending + paymentData.amount,
      86400 // 24 hours
    );
    
    // Invalidate validation cache
    const validationKey = NFCCacheKeys.fastValidation(paymentData.cardUuid, paymentData.amount);
    await setCached(validationKey, null, 1);
    
    logger.info(`Caches updated for card ${paymentData.cardUuid}`);
    
  } catch (error) {
    logger.error('Cache update failed:', error);
  }
}

async function clearTransactionCaches(cardUuid: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Clear relevant caches
    const keysToInvalidate = [
      NFCCacheKeys.cardStatus(cardUuid),
      NFCCacheKeys.dailySpending(cardUuid, today)
    ];
    
    for (const key of keysToInvalidate) {
      await setCached(key, null, 1);
    }
    
    logger.info(`Transaction caches cleared for card ${cardUuid}`);
    
  } catch (error) {
    logger.error('Cache clearing failed:', error);
  }
}

async function handleFailedBlockchainTransaction(
  transactionId: string,
  errorMessage: string
): Promise<void> {
  logger.error(`🚨 Failed blockchain transaction: ${transactionId} - ${errorMessage}`);
  
  // Update transaction status to failed
  await Transaction.findOneAndUpdate(
    { transactionId },
    {
      status: 'failed',
      failureReason: `Blockchain error: ${errorMessage}`,
      completedAt: new Date()
    }
  );
  
  // Add to failed transaction queue for manual review
  await notificationQueue.add(
    'alertFailedTransaction',
    {
      transactionId,
      errorMessage,
      timestamp: new Date(),
      requiresManualReview: true
    },
    {
      delay: 0,
      priority: 10 // High priority for failed transactions
    }
  );
}

