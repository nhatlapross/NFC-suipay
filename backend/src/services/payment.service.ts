import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiClient } from '../config/sui.config';
import { User, IUser } from '../models/User.model';
import { Card, ICard } from '../models/Card.model';
import { Transaction as TransactionModel, ITransaction } from '../models/Transaction.model';
import { Merchant } from '../models/Merchant.model';
import { decryptPrivateKey } from './encryption.service';
import { getCached, setCached } from '../config/redis.config';
import { CONSTANTS } from '../config/constants';
import logger from '../utils/logger';

export class PaymentService {
  private get suiClient() {
    return getSuiClient();
  }

  async processPayment(
    cardUuid: string,
    amount: number,
    merchantId: string,
    metadata?: any
  ): Promise<ITransaction> {
    try {
      // 1. Validate card
      const card = await this.validateCard(cardUuid);
      
      // 2. Get user
      const user = await User.findById(card.userId).select('+encryptedPrivateKey');
      if (!user) throw new Error('User not found');
      
      // 3. Check limits
      await this.checkTransactionLimits(user, card, amount);
      
      // 4. Get merchant
      const merchant = await Merchant.findOne({ merchantId });
      if (!merchant || !merchant.isActive) throw new Error('Invalid merchant');
      
      // 5. Create pending transaction
      const transaction = await TransactionModel.create({
        userId: user._id,
        cardId: card._id,
        cardUuid,
        type: 'payment',
        amount,
        currency: 'SUI',
        merchantId: merchant._id,
        merchantName: merchant.merchantName,
        status: 'pending',
        fromAddress: user.walletAddress,
        toAddress: merchant.walletAddress,
        metadata,
      });
      
      try {
        // 6. Build and execute blockchain transaction
        const txResult = await this.executeBlockchainTransaction(
          user,
          merchant.walletAddress,
          amount
        );
        
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
        
      } catch (error) {
        // Update transaction as failed
        transaction.status = 'failed';
        transaction.failureReason = error instanceof Error ? error.message : 'Unknown error';
        await transaction.save();
        throw error;
      }
      
    } catch (error) {
      logger.error('Payment processing error:', error);
      throw error;
    }
  }

  private async validateCard(cardUuid: string): Promise<ICard> {
    const card = await Card.findOne({ cardUuid });
    
    if (!card) throw new Error('Card not found');
    if (!card.isActive) throw new Error('Card is not active');
    if (card.isExpired) throw new Error('Card has expired');
    if (card.blockedAt) throw new Error(`Card is blocked: ${card.blockedReason}`);
    
    return card;
  }

  private async checkTransactionLimits(
    user: IUser,
    card: ICard,
    amount: number
  ): Promise<void> {
    // Check user daily limit
    if (card.dailySpent + amount > user.dailyLimit) {
      throw new Error('Daily limit exceeded');
    }
    
    // Check user monthly limit
    if (card.monthlySpent + amount > user.monthlyLimit) {
      throw new Error('Monthly limit exceeded');
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

  private async executeBlockchainTransaction(
    user: IUser,
    recipientAddress: string,
    amount: number
  ) {
    // Decrypt private key
    const privateKey = decryptPrivateKey(user.encryptedPrivateKey!);
    const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
    
    // Build transaction
    const tx = new Transaction();
    tx.setSender(user.walletAddress!);
    
    // Split coins for payment
    const [paymentCoin] = tx.splitCoins(tx.gas, [
      tx.pure.u64(amount * 1_000_000_000) // Convert to MIST
    ]);
    
    // Transfer to merchant
    tx.transferObjects([paymentCoin], tx.pure.address(recipientAddress));
    
    // Set gas budget
    tx.setGasBudget(CONSTANTS.DEFAULT_GAS_BUDGET);
    
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

  private async updateCardUsage(card: ICard, amount: number): Promise<void> {
    card.dailySpent += amount;
    card.monthlySpent += amount;
    card.usageCount += 1;
    card.lastUsed = new Date();
    await card.save();
  }

  private async updateMerchantStats(merchant: any, amount: number): Promise<void> {
    merchant.totalTransactions += 1;
    merchant.totalVolume += amount;
    await merchant.save();
  }

  private async sendWebhook(merchant: any, _transaction: ITransaction): Promise<void> {
    // Implement webhook logic
    logger.info(`Sending webhook to merchant ${merchant.merchantId}`);
  }

  async getTransactionHistory(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{
    transactions: ITransaction[];
    total: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      TransactionModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('merchantId', 'merchantName'),
      TransactionModel.countDocuments({ userId }),
    ]);
    
    return {
      transactions,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getTransactionById(txId: string): Promise<ITransaction | null> {
    // Check cache
    const cached = await getCached<ITransaction>(`tx:${txId}`);
    if (cached) return cached;
    
    const transaction = await TransactionModel.findById(txId)
      .populate('userId', 'fullName email')
      .populate('merchantId', 'merchantName');
    
    if (transaction) {
      await setCached(`tx:${txId}`, transaction, CONSTANTS.CACHE_TTL.TRANSACTION);
    }
    
    return transaction;
  }

  async refundTransaction(txId: string, _reason?: string): Promise<ITransaction> {
    const transaction = await TransactionModel.findById(txId);
    
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'completed') throw new Error('Cannot refund non-completed transaction');
    if (transaction.refundedAt) throw new Error('Transaction already refunded');
    
    // Process refund on blockchain
    // ... blockchain refund logic
    
    // Update transaction
    transaction.refundedAt = new Date();
    transaction.status = 'cancelled';
    // transaction.refundTxHash = refundTxHash;
    await transaction.save();
    
    return transaction;
  }

  async getPaymentStats(userId: string, period: string, cardUuid?: string): Promise<any> {
    // Validate period parameter
    const validPeriods = ['day', 'week', 'month', 'quarter', 'year', 'all'];
    if (!validPeriods.includes(period)) {
      throw new Error('Invalid period. Must be one of: day, week, month, quarter, year, all');
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

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
    const baseQuery: any = { 
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
    const cachedStats = await getCached(cacheKey);

    if (cachedStats) {
      return { ...cachedStats, cached: true };
    }

    try {
      // Aggregate payment statistics
      const [basicStats, monthlyTrends, topMerchants, hourlyDistribution] = await Promise.all([
        // Basic statistics
        TransactionModel.aggregate([
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
        TransactionModel.aggregate([
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
        TransactionModel.aggregate([
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
        TransactionModel.aggregate([
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
        const card = await Card.findOne({ cardUuid, userId });
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
          totalUnique: await TransactionModel.distinct('merchantId', baseQuery).then(merchants => merchants.length),
        },
        card: cardStats,
        generatedAt: now,
        cached: false,
      };

      // Cache the results for 5 minutes
      await setCached(cacheKey, stats, 300);

      logger.info(`Payment stats generated`, {
        userId,
        period,
        cardUuid,
        totalTransactions: stats.overview.totalTransactions,
      });

      return stats;

    } catch (aggregationError) {
      logger.error('Payment stats aggregation error:', aggregationError);

      // Fallback to basic stats
      const fallbackStats = await TransactionModel.find(baseQuery).select('amount gasFee completedAt');

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

  async cancelTransaction(transactionId: string, userId: string, reason?: string): Promise<ITransaction> {
    const transaction = await TransactionModel.findById(transactionId);

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

    logger.info(`Transaction cancelled`, {
      transactionId,
      userId,
      reason: reason || 'User cancelled',
    });

    return transaction;
  }

  async retryTransaction(transactionId: string, userId: string): Promise<{ originalTransaction: ITransaction; newTransaction: ITransaction }> {
    const originalTransaction = await TransactionModel.findById(transactionId);

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
    const newTransaction = await this.processPayment(
      originalTransaction.cardUuid!,
      originalTransaction.amount,
      originalTransaction.merchantId!.toString(),
      {
        ...originalTransaction.metadata,
        retryOf: originalTransaction._id,
        retryAttempt: (originalTransaction.metadata?.retryAttempt || 0) + 1,
      }
    );

    logger.info(`Payment retry initiated`, {
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