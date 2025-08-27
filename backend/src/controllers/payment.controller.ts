import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { CONSTANTS, ERROR_CODES } from '../config/constants';
import { Card } from '../models/Card.model';
import { User } from '../models/User.model';
import { Merchant } from '../models/Merchant.model';
import { Transaction } from '../models/Transaction.model';
import { getCached, setCached } from '../config/redis.config';
import { getSuiClient } from '../config/sui.config';
import logger from '../utils/logger';

const paymentService = new PaymentService();

export class PaymentController {
  async validatePayment(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { cardUuid, amount, merchantId } = req.body;
      const user = (req as any).user;
      
      // Input validation
      if (!cardUuid || !amount || !merchantId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: cardUuid, amount, merchantId',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Amount validation
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount',
          code: ERROR_CODES.INVALID_INPUT,
        });
      }
      
      if (amount < CONSTANTS.MIN_TRANSACTION_AMOUNT) {
        return res.status(400).json({
          success: false,
          error: `Minimum amount is ${CONSTANTS.MIN_TRANSACTION_AMOUNT} SUI`,
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      if (amount > CONSTANTS.MAX_TRANSACTION_AMOUNT) {
        return res.status(400).json({
          success: false,
          error: `Maximum amount is ${CONSTANTS.MAX_TRANSACTION_AMOUNT} SUI`,
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Validate card existence and ownership
      const card = await Card.findOne({ cardUuid, userId: user.id });
      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found or not owned by user',
          code: ERROR_CODES.INVALID_CARD,
        });
      }
      
      // Validate card status
      if (!card.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Card is not active',
          code: ERROR_CODES.INVALID_CARD,
        });
      }
      
      if (card.blockedAt) {
        return res.status(400).json({
          success: false,
          error: `Card is blocked: ${card.blockedReason || 'Unknown reason'}`,
          code: ERROR_CODES.INVALID_CARD,
        });
      }
      
      // Check if card is expired
      if (card.expiryDate < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Card has expired',
          code: ERROR_CODES.INVALID_CARD,
        });
      }
      
      // Validate merchant
      const merchant = await Merchant.findOne({ merchantId });
      if (!merchant || !merchant.isActive) {
        return res.status(404).json({
          success: false,
          error: 'Invalid or inactive merchant',
          code: ERROR_CODES.INVALID_INPUT,
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
          code: ERROR_CODES.LIMIT_EXCEEDED,
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
          code: ERROR_CODES.LIMIT_EXCEEDED,
          details: {
            currentMonthly: card.monthlySpent,
            monthlyLimit: user.monthlyLimit,
            requestedAmount: amount,
          },
        });
      }
      
      // Check wallet balance
      try {
        const balance = await getSuiClient().getBalance({
          owner: user.walletAddress,
          coinType: '0x2::sui::SUI',
        });
        
        const walletBalanceInSui = parseFloat(balance.totalBalance) / 1_000_000_000;
        const totalRequired = amount + (CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000);
        
        if (walletBalanceInSui < totalRequired) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient wallet balance',
            code: ERROR_CODES.INSUFFICIENT_BALANCE,
            details: {
              walletBalance: walletBalanceInSui,
              requiredAmount: totalRequired,
              transactionAmount: amount,
              estimatedGasFee: CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000,
            },
          });
        }
      } catch (error) {
        logger.error('Error checking wallet balance:', error);
        return res.status(503).json({
          success: false,
          error: 'Unable to verify wallet balance',
          code: ERROR_CODES.BLOCKCHAIN_ERROR,
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
            estimatedGasFee: CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000,
            totalAmount: amount + (CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000),
          },
        },
      });
    } catch (error) {
      logger.error('Payment validation error:', error);
      next(error);
    }
  }

  async processPayment(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { cardUuid, amount, merchantId, pin } = req.body;
      const user = (req as any).user;
      
      // Input validation
      if (!cardUuid || !amount || !merchantId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // PIN verification for high-value transactions
      if (amount > CONSTANTS.DAILY_AMOUNT_LIMIT / 10) { // 10% of daily limit
        if (!pin) {
          return res.status(400).json({
            success: false,
            error: 'PIN required for high-value transactions',
            code: ERROR_CODES.AUTH_FAILED,
          });
        }
        
        // Verify PIN (implement PIN verification logic)
        const isPinValid = await this.verifyUserPin(user.id, pin);
        if (!isPinValid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid PIN',
            code: ERROR_CODES.AUTH_FAILED,
          });
        }
      }
      
      // Rate limiting check
      const rateLimitKey = `payment_rate_${user.id}`;
      const recentTransactions = await getCached<number>(rateLimitKey) || 0;
      
      if (recentTransactions >= CONSTANTS.DAILY_TRANSACTION_LIMIT) {
        return res.status(429).json({
          success: false,
          error: 'Daily transaction limit exceeded',
          code: ERROR_CODES.LIMIT_EXCEEDED,
        });
      }
      
      // Prepare transaction metadata
      const metadata = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        device: req.headers['x-device-id'] as string,
        location: req.headers['x-location'] as string,
        timestamp: new Date().toISOString(),
        apiVersion: '1.0',
      };
      
      logger.info(`Processing payment: ${cardUuid} -> ${merchantId}, amount: ${amount}`, {
        userId: user.id,
        metadata,
      });
      
      // Process payment through service
      const transaction = await paymentService.processPayment(
        cardUuid,
        amount,
        merchantId,
        metadata
      );
      
      // Update rate limiting counter
      await setCached(rateLimitKey, recentTransactions + 1, 24 * 60 * 60); // 24 hours TTL
      
      // Log successful transaction
      logger.info(`Payment processed successfully: ${transaction._id}`, {
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
    } catch (error) {
      logger.error('Payment processing error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: (req as any).user?.id,
        body: req.body,
      });
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('insufficient balance')) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient balance',
            code: ERROR_CODES.INSUFFICIENT_BALANCE,
          });
        }
        
        if (error.message.includes('limit exceeded')) {
          return res.status(400).json({
            success: false,
            error: error.message,
            code: ERROR_CODES.LIMIT_EXCEEDED,
          });
        }
        
        if (error.message.includes('Card')) {
          return res.status(400).json({
            success: false,
            error: error.message,
            code: ERROR_CODES.INVALID_CARD,
          });
        }
      }
      
      next(error);
    }
  }
  
  private async verifyUserPin(userId: string, pin: string): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('+pinHash');
      if (!user) {
        return false;
      }
      
      // Use the comparePin method from User model
      return await user.comparePin!(pin);
    } catch (error) {
      logger.error('PIN verification error:', error);
      return false;
    }
  }

  async signTransaction(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { transactionBytes, cardUuid, amount } = req.body;
      const user = (req as any).user;
      
      // Input validation
      if (!transactionBytes || !cardUuid) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: transactionBytes, cardUuid',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Verify card ownership
      const card = await Card.findOne({ cardUuid, userId: user.id });
      if (!card || !card.isActive) {
        return res.status(404).json({
          success: false,
          error: 'Card not found or not active',
          code: ERROR_CODES.INVALID_CARD,
        });
      }
      
      // Create pending transaction record for tracking
      const pendingTransaction = await Transaction.create({
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
        const userWithKey = await User.findById(user.id).select('+encryptedPrivateKey');
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
            code: ERROR_CODES.AUTH_FAILED,
          });
        }
        
        // Sign the transaction
        const transactionBytesForSigning = await tx.build({ client: getSuiClient() });
        const signature = await keypair.signTransaction(transactionBytesForSigning);
        
        // Update pending transaction with signature info
        pendingTransaction.status = 'processing';
        pendingTransaction.metadata = {
          ...pendingTransaction.metadata,
          signatureGenerated: true,
          signedBytes: transactionBytes,
        };
        await pendingTransaction.save();
        
        logger.info(`Transaction signed successfully`, {
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
        
      } catch (signingError) {
        // Update transaction status to failed
        pendingTransaction.status = 'failed';
        pendingTransaction.failureReason = signingError instanceof Error ? signingError.message : 'Signing failed';
        await pendingTransaction.save();
        
        throw signingError;
      }
      
    } catch (error) {
      logger.error('Transaction signing error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.id,
        cardUuid: req.body.cardUuid,
      });
      
      if (error instanceof Error && error.message.includes('decrypt')) {
        return res.status(500).json({
          success: false,
          error: 'Unable to access wallet keys',
          code: ERROR_CODES.INTERNAL_ERROR,
        });
      }
      
      next(error);
    }
  }

  async completePayment(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { txHash, transactionId } = req.body;
      const user = (req as any).user;
      
      // Input validation
      if (!txHash || (!transactionId && !req.body.cardUuid)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: txHash and (transactionId or cardUuid)',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Find the pending transaction
      let transaction;
      if (transactionId) {
        transaction = await Transaction.findById(transactionId);
      } else {
        transaction = await Transaction.findOne({ 
          cardUuid: req.body.cardUuid, 
          userId: user.id, 
          status: 'processing' 
        }).sort({ createdAt: -1 });
      }
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found or not in processing state',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Verify transaction ownership
      if (transaction.userId.toString() !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to complete this transaction',
          code: ERROR_CODES.UNAUTHORIZED,
        });
      }
      
      try {
        // Verify transaction on blockchain
        const blockchainTx = await getSuiClient().waitForTransaction({
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
            code: ERROR_CODES.TRANSACTION_FAILED,
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
          await Card.findByIdAndUpdate(transaction.cardId, {
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
          await Merchant.findByIdAndUpdate(transaction.merchantId, {
            $inc: {
              totalTransactions: 1,
              totalVolume: transaction.amount,
            },
            lastTransactionAt: new Date(),
          });
        }
        
        // Cache the completed transaction
        await setCached(
          `completed_tx:${txHash}`, 
          transaction, 
          CONSTANTS.CACHE_TTL.TRANSACTION
        );
        
        logger.info(`Payment completed successfully`, {
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
        
      } catch (blockchainError) {
        // Update transaction as failed
        transaction.status = 'failed';
        transaction.failureReason = blockchainError instanceof Error ? 
          blockchainError.message : 'Blockchain verification failed';
        await transaction.save();
        
        logger.error('Blockchain verification failed:', {
          error: blockchainError,
          txHash,
          transactionId: transaction._id,
        });
        
        return res.status(400).json({
          success: false,
          error: 'Unable to verify transaction on blockchain',
          code: ERROR_CODES.BLOCKCHAIN_ERROR,
        });
      }
      
    } catch (error) {
      logger.error('Payment completion error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.id,
        body: req.body,
      });
      next(error);
    }
  }

  async getTransactionHistory(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(
        parseInt(req.query.limit as string) || CONSTANTS.DEFAULT_PAGE_SIZE,
        CONSTANTS.MAX_PAGE_SIZE
      );
      
      const result = await paymentService.getTransactionHistory(userId, page, limit);
      
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransaction(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
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
    } catch (error) {
      next(error);
    }
  }

  async refundTransaction(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const transaction = await paymentService.refundTransaction(id, reason);
      
      res.json({
        success: true,
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentStats(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const userId = (req as any).user.id;
      const period = (req.query.period as string) || 'month';
      const cardUuid = req.query.cardUuid as string;
      
      // Use service to get payment stats (delegate the heavy logic to service)
      const stats = await paymentService.getPaymentStats(userId, period, cardUuid);
      
      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error('Payment stats error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.id,
        period: req.query.period,
      });
      
      if (error instanceof Error && error.message.includes('Invalid period')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      next(error);
    }
  }
  // Additional utility methods
  
  async cancelPayment(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;
      
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
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: error.message,
            code: ERROR_CODES.VALIDATION_ERROR,
          });
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({
            success: false,
            error: error.message,
            code: ERROR_CODES.UNAUTHORIZED,
          });
        }
        if (error.message.includes('Cannot cancel')) {
          return res.status(400).json({
            success: false,
            error: error.message,
            code: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }
      next(error);
    }
  }
  
  async retryPayment(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      
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
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: error.message,
            code: ERROR_CODES.VALIDATION_ERROR,
          });
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({
            success: false,
            error: error.message,
            code: ERROR_CODES.UNAUTHORIZED,
          });
        }
        if (error.message.includes('Only failed')) {
          return res.status(400).json({
            success: false,
            error: error.message,
            code: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }
      next(error);
    }
  }
  
  async getPaymentMethods(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const user = (req as any).user;
      
      // Get user's cards
      const cards = await Card.find({ 
        userId: user.id, 
        isActive: true 
      }).select('cardUuid cardType cardNumber isActive isPrimary lastUsed usageCount');
      
      // Get wallet balance
      let walletBalance = 0;
      try {
        const balance = await getSuiClient().getBalance({
          owner: user.walletAddress,
          coinType: '0x2::sui::SUI',
        });
        walletBalance = parseFloat(balance.totalBalance) / 1_000_000_000;
      } catch (error) {
        logger.warn('Unable to fetch wallet balance', { userId: user.id });
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
          minTransaction: CONSTANTS.MIN_TRANSACTION_AMOUNT,
          maxTransaction: CONSTANTS.MAX_TRANSACTION_AMOUNT,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getTransactionReceipt(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const format = req.query.format as string || 'json';
      
      const transaction = await Transaction.findById(id)
        .populate('merchantId', 'merchantName')
        .populate('cardId', 'cardType cardNumber');
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Verify ownership
      if (transaction.userId.toString() !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to view this receipt',
          code: ERROR_CODES.UNAUTHORIZED,
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
          type: (transaction.cardId as any).cardType,
          last4: (transaction.cardId as any).cardNumber?.slice(-4),
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
    } catch (error) {
      next(error);
    }
  }
  
  async validateTransaction(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { txHash } = req.params;
      
      if (!txHash) {
        return res.status(400).json({
          success: false,
          error: 'Transaction hash is required',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      try {
        // Get transaction from blockchain
        const blockchainTx = await getSuiClient().getTransactionBlock({
          digest: txHash,
          options: {
            showEffects: true,
            showInput: true,
            showObjectChanges: true,
          },
        });
        
        // Check our database
        const dbTransaction = await Transaction.findOne({ txHash });
        
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
        
      } catch (blockchainError) {
        res.json({
          success: true,
          validation: {
            exists: false,
            error: 'Transaction not found on blockchain',
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();