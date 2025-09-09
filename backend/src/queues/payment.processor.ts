import { Job } from 'bull';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiClient } from '../config/sui.config';
import { User } from '../models/User.model';
import { Card } from '../models/Card.model';
import { Transaction as TransactionModel } from '../models/Transaction.model';
import { Merchant } from '../models/Merchant.model';
import { decryptPrivateKey } from '../services/encryption.service';
import { socketService } from '../services/socket.service';
import { CONSTANTS } from '../config/constants';
import logger from '../utils/logger';

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

export async function processNFCPaymentJob(job: Job<PaymentJobData>) {
  const { transactionId, paymentData } = job.data;
  const startTime = Date.now();
  
  logger.info(`Processing payment job ${job.id}`, { transactionId, paymentData });
  
  try {
    // 1. Get transaction record
    const transaction = await TransactionModel.findOne({ transactionId });
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Update status to processing
    transaction.status = 'processing';
    await transaction.save();
    
    // Notify user via WebSocket
    socketService.emitToUser(paymentData.userId, 'payment:processing', {
      transactionId,
      status: 'processing',
      message: 'Processing payment on blockchain...',
    });
    
    // 2. Get user with encrypted private key
    const user = await User.findById(paymentData.userId).select('+encryptedPrivateKey');
    if (!user || !user.encryptedPrivateKey) {
      throw new Error('User wallet not configured');
    }
    
    // 3. Validate card
    const card = await Card.findOne({ cardUuid: paymentData.cardUuid });
    if (!card || !card.isActive) {
      throw new Error('Invalid or inactive card');
    }
    
    // 4. Execute blockchain transaction
    const suiClient = getSuiClient();
    
    // Handle private key - could be encrypted base64 or bech32
    let keypair: Ed25519Keypair;
    if (user.encryptedPrivateKey.startsWith('suiprivkey1')) {
      // It's a bech32 format, use directly
      keypair = Ed25519Keypair.fromSecretKey(user.encryptedPrivateKey);
    } else {
      // It's encrypted base64, decrypt first
      const privateKey = decryptPrivateKey(user.encryptedPrivateKey);
      keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
    }
    
    // Build Sui transaction
    const tx = new Transaction();
    tx.setSender(paymentData.userWalletAddress);
    
    // Convert amount to MIST (1 SUI = 1,000,000,000 MIST)
    const amountInMist = Math.floor(paymentData.amount * 1_000_000_000);
    
    // Split coins for payment
    const [paymentCoin] = tx.splitCoins(tx.gas, [
      tx.pure.u64(amountInMist)
    ]);
    
    // Transfer to merchant
    tx.transferObjects([paymentCoin], tx.pure.address(paymentData.merchantWalletAddress));
    
    // Set gas budget
    tx.setGasBudget(CONSTANTS.DEFAULT_GAS_BUDGET || 10000000);
    
    // Sign and execute transaction
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });
    
    // Wait for transaction confirmation
    await suiClient.waitForTransaction({
      digest: result.digest,
      options: {
        showEffects: true,
      },
    });
    
    // 5. Update transaction record with success
    transaction.status = 'completed';
    transaction.txHash = result.digest;
    transaction.gasFee = Number(result.effects?.gasUsed?.computationCost || 0) / 1_000_000_000; // Convert back to SUI
    transaction.completedAt = new Date();
    await transaction.save();
    
    // 6. Update card usage stats
    card.lastUsed = new Date();
    // Note: totalTransactions and totalSpent are not in the Card model
    // You may want to add them to the model or track them separately
    await card.save();
    
    // 7. Update merchant stats
    const merchant = await Merchant.findById(paymentData.merchantId);
    if (merchant) {
      merchant.totalTransactions = (merchant.totalTransactions || 0) + 1;
      merchant.totalVolume = (merchant.totalVolume || 0) + paymentData.amount;
      await merchant.save();
    }
    
    // 8. Notify user of success via WebSocket
    socketService.emitToUser(paymentData.userId, 'payment:completed', {
      transactionId,
      status: 'completed',
      txHash: result.digest,
      amount: paymentData.amount,
      gasFee: transaction.gasFee,
      totalAmount: paymentData.totalAmount,
      processingTime: Date.now() - startTime,
      blockchainUrl: `https://suiscan.xyz/${process.env.SUI_NETWORK || 'testnet'}/tx/${result.digest}`,
    });
    
    logger.info(`Payment completed successfully`, {
      transactionId,
      txHash: result.digest,
      processingTime: Date.now() - startTime,
    });
    
    return {
      success: true,
      transactionId,
      txHash: result.digest,
      processingTime: Date.now() - startTime,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error(`Payment processing failed`, {
      transactionId,
      error: errorMessage,
      jobId: job.id,
      attempts: job.attemptsMade,
    });
    
    // Update transaction as failed
    await TransactionModel.findOneAndUpdate(
      { transactionId },
      {
        status: 'failed',
        failureReason: errorMessage,
        completedAt: new Date(),
      }
    );
    
    // Notify user of failure via WebSocket
    socketService.emitToUser(paymentData.userId, 'payment:failed', {
      transactionId,
      status: 'failed',
      error: errorMessage,
      processingTime: Date.now() - startTime,
    });
    
    // Re-throw error for Bull to handle retries
    throw error;
  }
}

// Export processor function for queue registration
export default processNFCPaymentJob;