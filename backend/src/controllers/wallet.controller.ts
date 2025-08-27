import { Request, Response, NextFunction } from 'express';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient } from '../config/sui.config';
import { User } from '../models/User.model';
import { Transaction as TransactionModel } from '../models/Transaction.model';
import { encryptPrivateKey, decryptPrivateKey } from '../services/encryption.service';
import { getCached, setCached } from '../config/redis.config';
import { CONSTANTS, ERROR_CODES } from '../config/constants';
import logger from '../utils/logger';
import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysten/sui/faucet';

export class WalletController {
  private get suiClient() {
    return getSuiClient();
  }

  async createWallet(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const userId = (req as any).user.id;
      
      // Check if user already has a wallet
      const user = await User.findById(userId);
      if (user?.walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'User already has a wallet',
        });
      }
      
      // Generate new keypair
      const keypair = Ed25519Keypair.generate();
      const publicKey = keypair.getPublicKey();
      const walletAddress = publicKey.toSuiAddress();
      
      // Encrypt and store private key
      const encryptedPrivateKey = encryptPrivateKey(
        Buffer.from(keypair.getSecretKey()).toString('base64')
      );
      
      // Update user with wallet info
      user!.walletAddress = walletAddress;
      user!.encryptedPrivateKey = encryptedPrivateKey;
      await user!.save();
      
      res.json({
        success: true,
        walletAddress,
        publicKey: publicKey.toBase64(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getWalletBalance(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { address } = req.params;
      const cacheKey = `balance:${address}`;
      
      // Check cache
      const cached = await getCached<any>(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          ...cached,
        });
      }
      
      // Get balance from blockchain
      const balance = await this.suiClient.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI',
      });
      
      const result = {
        address,
        balance: parseFloat(balance.totalBalance) / 1_000_000_000,
        coinObjectCount: balance.coinObjectCount,
      };
      
      // Cache result
      await setCached(cacheKey, result, CONSTANTS.CACHE_TTL.WALLET_BALANCE);
      
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOwnedObjects(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { address } = req.params;
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const objects = await this.suiClient.getOwnedObjects({
        owner: address,
        cursor,
        limit,
        options: {
          showType: true,
          showContent: true,
          showOwner: true,
        },
      });
      
      res.json({
        success: true,
        objects: objects.data,
        hasNextPage: objects.hasNextPage,
        nextCursor: objects.nextCursor,
      });
    } catch (error) {
      next(error);
    }
  }

  async transferSUI(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { recipient, amount, description } = req.body;
      const userId = (req as any).user.id;
      
      // Input validation
      if (!recipient || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: recipient, amount',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
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
          error: `Minimum transfer amount is ${CONSTANTS.MIN_TRANSACTION_AMOUNT} SUI`,
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Get user with encrypted private key
      const user = await User.findById(userId).select('+encryptedPrivateKey');
      if (!user || !user.walletAddress || !user.encryptedPrivateKey) {
        return res.status(400).json({
          success: false,
          error: 'User wallet not found',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Check wallet balance
      const balance = await this.suiClient.getBalance({
        owner: user.walletAddress,
        coinType: '0x2::sui::SUI',
      });
      
      const walletBalanceInSui = parseFloat(balance.totalBalance) / 1_000_000_000;
      const totalRequired = amount + (CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000);
      
      if (walletBalanceInSui < totalRequired) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance',
          code: ERROR_CODES.INSUFFICIENT_BALANCE,
          details: {
            walletBalance: walletBalanceInSui,
            requiredAmount: totalRequired,
            transferAmount: amount,
            estimatedGasFee: CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000,
          },
        });
      }
      
      // Decrypt private key and create keypair
      const privateKey = decryptPrivateKey(user.encryptedPrivateKey);
      const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
      
      // Build transfer transaction
      const tx = new Transaction();
      tx.setSender(user.walletAddress);
      
      const [paymentCoin] = tx.splitCoins(tx.gas, [
        tx.pure.u64(amount * 1_000_000_000) // Convert to MIST
      ]);
      
      tx.transferObjects([paymentCoin], tx.pure.address(recipient));
      tx.setGasBudget(CONSTANTS.DEFAULT_GAS_BUDGET);
      
      // Execute transaction
      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });
      
      // Wait for transaction confirmation
      await this.suiClient.waitForTransaction({
        digest: result.digest,
      });
      
      // Record transaction in database
      const transactionRecord = await TransactionModel.create({
        userId: user._id,
        type: 'withdraw',
        amount,
        currency: 'SUI',
        status: 'completed',
        txHash: result.digest,
        fromAddress: user.walletAddress,
        toAddress: recipient,
        gasFee: result.effects?.gasUsed ? 
          (parseInt(result.effects.gasUsed.computationCost) + 
           parseInt(result.effects.gasUsed.storageCost)) / 1_000_000_000 : 0,
        totalAmount: amount + (result.effects?.gasUsed ? 
          (parseInt(result.effects.gasUsed.computationCost) + 
           parseInt(result.effects.gasUsed.storageCost)) / 1_000_000_000 : 0),
        description: description || 'SUI Transfer',
        completedAt: new Date(),
        metadata: {
          transferType: 'direct',
          balanceChanges: result.balanceChanges,
        },
      });
      
      // Clear balance cache
      await setCached(`balance:${user.walletAddress}`, null, 0);
      
      logger.info(`SUI transfer completed`, {
        userId: user._id,
        txHash: result.digest,
        amount,
        recipient,
        gasFee: transactionRecord.gasFee,
      });
      
      res.json({
        success: true,
        message: 'Transfer completed successfully',
        transaction: {
          id: transactionRecord._id,
          txHash: result.digest,
          amount,
          gasFee: transactionRecord.gasFee,
          totalAmount: transactionRecord.totalAmount,
          recipient,
          status: 'completed',
          explorerUrl: `https://suiscan.xyz/testnet/tx/${result.digest}`,
        },
      });
    } catch (error) {
      logger.error('Transfer error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.id,
        body: req.body,
      });
      
      if (error instanceof Error && error.message.includes('Insufficient')) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance for transfer',
          code: ERROR_CODES.INSUFFICIENT_BALANCE,
        });
      }
      
      next(error);
    }
  }

  async importWallet(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { privateKey } = req.body;
      const userId = (req as any).user.id;
      
      // Input validation
      if (!privateKey) {
        return res.status(400).json({
          success: false,
          error: 'Private key is required',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Check if user already has a wallet
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      if (user.walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'User already has a wallet. Cannot import over existing wallet.',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      try {
        // Validate and create keypair from private key
        let keypair: Ed25519Keypair;
        
        // Try to parse private key (support different formats)
        if (privateKey.startsWith('0x')) {
          // Hex format
          const keyBytes = Buffer.from(privateKey.slice(2), 'hex');
          keypair = Ed25519Keypair.fromSecretKey(keyBytes);
        } else {
          // Base64 format
          const keyBytes = Buffer.from(privateKey, 'base64');
          keypair = Ed25519Keypair.fromSecretKey(keyBytes);
        }
        
        const publicKey = keypair.getPublicKey();
        const walletAddress = publicKey.toSuiAddress();
        
        // Encrypt and store private key
        const encryptedPrivateKey = encryptPrivateKey(
          Buffer.from(keypair.getSecretKey()).toString('base64')
        );
        
        // Update user with wallet info
        user.walletAddress = walletAddress;
        user.encryptedPrivateKey = encryptedPrivateKey;
        await user.save();
        
        // Get wallet balance for response
        let balance = 0;
        try {
          const balanceResult = await this.suiClient.getBalance({
            owner: walletAddress,
            coinType: '0x2::sui::SUI',
          });
          balance = parseFloat(balanceResult.totalBalance) / 1_000_000_000;
        } catch (balanceError) {
          logger.warn('Could not fetch balance for imported wallet', { walletAddress });
        }
        
        logger.info(`Wallet imported successfully`, {
          userId: user._id,
          walletAddress,
          balance,
        });
        
        res.json({
          success: true,
          message: 'Wallet imported successfully',
          wallet: {
            address: walletAddress,
            publicKey: publicKey.toBase64(),
            balance,
            explorerUrl: `https://suiscan.xyz/testnet/account/${walletAddress}`,
          },
        });
        
      } catch (keyError) {
        logger.error('Invalid private key format:', keyError);
        return res.status(400).json({
          success: false,
          error: 'Invalid private key format. Please provide a valid Ed25519 private key.',
          code: ERROR_CODES.INVALID_INPUT,
        });
      }
      
    } catch (error) {
      logger.error('Wallet import error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.id,
      });
      next(error);
    }
  }

  async exportWallet(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const userId = (req as any).user.id;
      const { password } = req.body;
      
      // Input validation
      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Password is required for wallet export',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Get user with encrypted private key and password
      const user = await User.findById(userId).select('+encryptedPrivateKey +password');
      if (!user || !user.walletAddress || !user.encryptedPrivateKey) {
        return res.status(404).json({
          success: false,
          error: 'User wallet not found',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Verify user password for security
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password',
          code: ERROR_CODES.AUTH_FAILED,
        });
      }
      
      try {
        // Decrypt private key
        const privateKey = decryptPrivateKey(user.encryptedPrivateKey);
        
        // Create keypair to get public key
        const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
        const publicKey = keypair.getPublicKey();
        
        // Get wallet balance
        let balance = 0;
        try {
          const balanceResult = await this.suiClient.getBalance({
            owner: user.walletAddress,
            coinType: '0x2::sui::SUI',
          });
          balance = parseFloat(balanceResult.totalBalance) / 1_000_000_000;
        } catch (balanceError) {
          logger.warn('Could not fetch balance for wallet export', { 
            walletAddress: user.walletAddress 
          });
        }
        
        // Log export event (for security audit)
        logger.warn(`Wallet export requested`, {
          userId: user._id,
          walletAddress: user.walletAddress,
          timestamp: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
        
        res.json({
          success: true,
          message: 'Wallet exported successfully',
          wallet: {
            address: user.walletAddress,
            publicKey: publicKey.toBase64(),
            privateKey: privateKey, // Base64 encoded
            privateKeyHex: `0x${Buffer.from(privateKey, 'base64').toString('hex')}`, // Hex format
            balance,
            explorerUrl: `https://suiscan.xyz/testnet/account/${user.walletAddress}`,
          },
          security: {
            warning: 'Keep your private key secure. Never share it with anyone.',
            recommendation: 'Store in a secure location and delete from device after saving.',
          },
        });
        
      } catch (decryptError) {
        logger.error('Failed to decrypt private key for export:', {
          error: decryptError,
          userId: user._id,
        });
        return res.status(500).json({
          success: false,
          error: 'Failed to decrypt wallet. Please contact support.',
          code: ERROR_CODES.INTERNAL_ERROR,
        });
      }
      
    } catch (error) {
      logger.error('Wallet export error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.id,
      });
      next(error);
    }
  }

  async requestFromFaucet(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const userId = (req as any).user.id;
      
      // Get user wallet
      const user = await User.findById(userId);
      if (!user || !user.walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'User wallet not found',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Check if on testnet/devnet
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({
          success: false,
          error: 'Faucet is only available on testnet/devnet',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      try {
        // Determine network for faucet
        const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
        
        // Request from faucet
        await requestSuiFromFaucetV2({
          host: getFaucetHost(network as 'testnet' | 'devnet'),
          recipient: user.walletAddress,
        });
        
        // Clear balance cache to reflect new balance
        await setCached(`balance:${user.walletAddress}`, null, 0);
        
        // Get updated balance
        const balanceResult = await this.suiClient.getBalance({
          owner: user.walletAddress,
          coinType: '0x2::sui::SUI',
        });
        const newBalance = parseFloat(balanceResult.totalBalance) / 1_000_000_000;
        
        logger.info(`Faucet request completed`, {
          userId: user._id,
          walletAddress: user.walletAddress,
          newBalance,
        });
        
        res.json({
          success: true,
          message: 'Test SUI received from faucet',
          faucet: {
            amount: '1.0', // Faucet typically gives 1 SUI
            newBalance,
            explorerUrl: `https://suiscan.xyz/${network}/account/${user.walletAddress}`,
            network,
          },
        });
        
      } catch (faucetError) {
        logger.error('Faucet request failed:', {
          error: faucetError,
          userId: user._id,
          walletAddress: user.walletAddress,
        });
        
        return res.status(400).json({
          success: false,
          error: 'Faucet request failed. You may have reached the rate limit.',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
    } catch (error) {
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
      
      // Get user wallet
      const user = await User.findById(userId);
      if (!user || !user.walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'User wallet not found',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      const skip = (page - 1) * limit;
      
      // Get wallet transactions from database
      const [transactions, total] = await Promise.all([
        TransactionModel.find({
          $or: [
            { fromAddress: user.walletAddress },
            { toAddress: user.walletAddress }
          ]
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('merchantId', 'merchantName'),
        TransactionModel.countDocuments({
          $or: [
            { fromAddress: user.walletAddress },
            { toAddress: user.walletAddress }
          ]
        }),
      ]);
      
      const formattedTransactions = transactions.map(tx => ({
        id: tx._id,
        txHash: tx.txHash,
        type: tx.type,
        amount: tx.amount,
        gasFee: tx.gasFee,
        totalAmount: tx.totalAmount,
        currency: tx.currency,
        status: tx.status,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        description: tx.description,
        merchantName: tx.merchantName,
        createdAt: tx.createdAt,
        completedAt: tx.completedAt,
        explorerUrl: tx.txHash ? `https://suiscan.xyz/testnet/tx/${tx.txHash}` : null,
        isIncoming: tx.toAddress === user.walletAddress,
        isOutgoing: tx.fromAddress === user.walletAddress,
      }));
      
      res.json({
        success: true,
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      });
      
    } catch (error) {
      next(error);
    }
  }

  async getWalletInfo(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const userId = (req as any).user.id;
      
      // Get user wallet
      const user = await User.findById(userId);
      if (!user || !user.walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'User wallet not found',
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
      
      // Get balance and objects in parallel
      const [balanceResult, objectsResult] = await Promise.all([
        this.suiClient.getBalance({
          owner: user.walletAddress,
          coinType: '0x2::sui::SUI',
        }),
        this.suiClient.getOwnedObjects({
          owner: user.walletAddress,
          limit: 10,
          options: {
            showType: true,
            showContent: true,
          },
        }),
      ]);
      
      const balance = parseFloat(balanceResult.totalBalance) / 1_000_000_000;
      
      // Get recent transaction count
      const recentTransactionCount = await TransactionModel.countDocuments({
        $or: [
          { fromAddress: user.walletAddress },
          { toAddress: user.walletAddress }
        ],
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });
      
      res.json({
        success: true,
        wallet: {
          address: user.walletAddress,
          balance,
          coinObjectCount: balanceResult.coinObjectCount,
          totalObjects: objectsResult.data.length,
          recentTransactionCount,
          explorerUrl: `https://suiscan.xyz/testnet/account/${user.walletAddress}`,
        },
        network: {
          name: process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet',
          rpcUrl: process.env.NEXT_PUBLIC_SUI_RPC_URL,
        },
        user: {
          dailyLimit: user.dailyLimit,
          monthlyLimit: user.monthlyLimit,
          status: user.status,
        },
      });
      
    } catch (error) {
      next(error);
    }
  }
}

export const walletController = new WalletController();