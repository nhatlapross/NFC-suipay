"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNFCPaymentJob = processNFCPaymentJob;
const transactions_1 = require("@mysten/sui/transactions");
const ed25519_1 = require("@mysten/sui/keypairs/ed25519");
const sui_config_1 = require("../config/sui.config");
const User_model_1 = require("../models/User.model");
const Card_model_1 = require("../models/Card.model");
const Transaction_model_1 = require("../models/Transaction.model");
const Merchant_model_1 = require("../models/Merchant.model");
const encryption_service_1 = require("../services/encryption.service");
const socket_service_1 = require("../services/socket.service");
const constants_1 = require("../config/constants");
const logger_1 = __importDefault(require("../utils/logger"));
async function processNFCPaymentJob(job) {
    const { transactionId, paymentData } = job.data;
    const startTime = Date.now();
    logger_1.default.info(`🔄 Processing payment job ${job.id}`, { transactionId, paymentData });
    try {
        logger_1.default.info(`✅ Job ${job.id} started processing...`);
        // 1. Get transaction record
        logger_1.default.info(`📋 Finding transaction: ${transactionId}`);
        const transaction = await Transaction_model_1.Transaction.findOne({ transactionId });
        if (!transaction) {
            logger_1.default.error(`❌ Transaction not found: ${transactionId}`);
            throw new Error('Transaction not found');
        }
        logger_1.default.info(`✅ Transaction found: ${transaction._id}`);
        // Update status to processing
        transaction.status = 'processing';
        await transaction.save();
        // Notify user via WebSocket
        socket_service_1.socketService.emitToUser(paymentData.userId, 'payment:processing', {
            transactionId,
            status: 'processing',
            message: 'Processing payment on blockchain...',
        });
        // 2. Get user with encrypted private key
        const user = await User_model_1.User.findById(paymentData.userId).select('+encryptedPrivateKey');
        if (!user || !user.encryptedPrivateKey) {
            throw new Error('User wallet not configured');
        }
        // 3. Validate card
        const card = await Card_model_1.Card.findOne({ cardUuid: paymentData.cardUuid });
        if (!card || !card.isActive) {
            throw new Error('Invalid or inactive card');
        }
        // 4. Execute blockchain transaction
        const suiClient = (0, sui_config_1.getSuiClient)();
        // Handle private key - could be encrypted base64 or bech32
        let keypair;
        if (user.encryptedPrivateKey.startsWith('suiprivkey1')) {
            // It's a bech32 format, use directly
            keypair = ed25519_1.Ed25519Keypair.fromSecretKey(user.encryptedPrivateKey);
        }
        else {
            // It's encrypted base64, decrypt first
            const privateKey = (0, encryption_service_1.decryptPrivateKey)(user.encryptedPrivateKey);
            keypair = ed25519_1.Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
        }
        // Build Sui transaction
        const tx = new transactions_1.Transaction();
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
        tx.setGasBudget(constants_1.CONSTANTS.DEFAULT_GAS_BUDGET || 10000000);
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
        const merchant = await Merchant_model_1.Merchant.findById(paymentData.merchantId);
        if (merchant) {
            merchant.totalTransactions = (merchant.totalTransactions || 0) + 1;
            merchant.totalVolume = (merchant.totalVolume || 0) + paymentData.amount;
            await merchant.save();
        }
        // 8. Notify user of success via WebSocket
        socket_service_1.socketService.emitToUser(paymentData.userId, 'payment:completed', {
            transactionId,
            status: 'completed',
            txHash: result.digest,
            amount: paymentData.amount,
            gasFee: transaction.gasFee,
            totalAmount: paymentData.totalAmount,
            processingTime: Date.now() - startTime,
            blockchainUrl: `https://suiscan.xyz/${process.env.SUI_NETWORK || 'testnet'}/tx/${result.digest}`,
        });
        logger_1.default.info(`Payment completed successfully`, {
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error(`Payment processing failed`, {
            transactionId,
            error: errorMessage,
            jobId: job.id,
            attempts: job.attemptsMade,
        });
        // Update transaction as failed
        await Transaction_model_1.Transaction.findOneAndUpdate({ transactionId }, {
            status: 'failed',
            failureReason: errorMessage,
            completedAt: new Date(),
        });
        // Notify user of failure via WebSocket
        socket_service_1.socketService.emitToUser(paymentData.userId, 'payment:failed', {
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
exports.default = processNFCPaymentJob;
//# sourceMappingURL=payment.processor.js.map