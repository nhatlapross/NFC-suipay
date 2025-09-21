"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletController = exports.WalletController = void 0;
const ed25519_1 = require("@mysten/sui/keypairs/ed25519");
const transactions_1 = require("@mysten/sui/transactions");
const sui_config_1 = require("../config/sui.config");
const User_model_1 = require("../models/User.model");
const Transaction_model_1 = require("../models/Transaction.model");
const encryption_service_1 = require("../services/encryption.service");
const redis_config_1 = require("../config/redis.config");
const constants_1 = require("../config/constants");
const logger_1 = __importDefault(require("../utils/logger"));
const faucet_1 = require("@mysten/sui/faucet");
class WalletController {
    async createWallet(req, res, next) {
        try {
            const userId = req.user.id;
            // Check if user already has a wallet
            const user = await User_model_1.User.findById(userId);
            if (user?.walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'User already has a wallet',
                });
            }
            // Generate new keypair
            const keypair = new ed25519_1.Ed25519Keypair();
            const publicKey = keypair.getPublicKey();
            const walletAddress = publicKey.toSuiAddress();
            // Store private key in bech32 format (no encryption needed for bech32)
            const privateKey = keypair.getSecretKey(); // Already in bech32 format
            // Update user with wallet info
            user.walletAddress = walletAddress;
            user.encryptedPrivateKey = privateKey; // Store bech32 format directly
            await user.save();
            res.json({
                success: true,
                walletAddress,
                publicKey: publicKey.toBase64(),
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getWalletBalance(req, res, next) {
        try {
            const { address } = req.params;
            const cacheKey = `balance:${address}`;
            // Check cache
            const cached = await (0, redis_config_1.getCached)(cacheKey);
            if (cached) {
                return res.json({
                    success: true,
                    ...cached,
                });
            }
            // Get balance from blockchain
            const suiClient = (0, sui_config_1.getSuiClient)();
            const balance = await suiClient.getBalance({
                owner: address,
                coinType: '0x2::sui::SUI',
            });
            const result = {
                address,
                balance: parseFloat(balance.totalBalance) / 1_000_000_000,
                coinObjectCount: balance.coinObjectCount,
            };
            // Cache result
            await (0, redis_config_1.setCached)(cacheKey, result, constants_1.CONSTANTS.CACHE_TTL.WALLET_BALANCE);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getOwnedObjects(req, res, next) {
        try {
            const { address } = req.params;
            const cursor = req.query.cursor;
            const limit = parseInt(req.query.limit) || 50;
            const objects = await (0, sui_config_1.getSuiClient)().getOwnedObjects({
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
        }
        catch (error) {
            next(error);
        }
    }
    async transferSUI(req, res, next) {
        try {
            const { recipient, amount, description } = req.body;
            const userId = req.user.id;
            // Input validation
            if (!recipient || !amount) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: recipient, amount',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            if (typeof amount !== 'number' || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid amount',
                    code: constants_1.ERROR_CODES.INVALID_INPUT,
                });
            }
            if (amount < constants_1.CONSTANTS.MIN_TRANSACTION_AMOUNT) {
                return res.status(400).json({
                    success: false,
                    error: `Minimum transfer amount is ${constants_1.CONSTANTS.MIN_TRANSACTION_AMOUNT} SUI`,
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Get user with encrypted private key
            const user = await User_model_1.User.findById(userId).select('+encryptedPrivateKey');
            if (!user || !user.walletAddress || !user.encryptedPrivateKey) {
                return res.status(400).json({
                    success: false,
                    error: 'User wallet not found',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Check wallet balance
            const balance = await (0, sui_config_1.getSuiClient)().getBalance({
                owner: user.walletAddress,
                coinType: '0x2::sui::SUI',
            });
            const walletBalanceInSui = parseFloat(balance.totalBalance) / 1_000_000_000;
            const totalRequired = amount + (constants_1.CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000);
            if (walletBalanceInSui < totalRequired) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient balance',
                    code: constants_1.ERROR_CODES.INSUFFICIENT_BALANCE,
                    details: {
                        walletBalance: walletBalanceInSui,
                        requiredAmount: totalRequired,
                        transferAmount: amount,
                        estimatedGasFee: constants_1.CONSTANTS.DEFAULT_GAS_BUDGET / 1_000_000_000,
                    },
                });
            }
            // Handle private key - could be encrypted or bech32 format
            let keypair;
            if (user.encryptedPrivateKey.startsWith('suiprivkey1')) {
                // It's a bech32 format, use directly
                keypair = ed25519_1.Ed25519Keypair.fromSecretKey(user.encryptedPrivateKey);
            }
            else {
                // It's encrypted, decrypt first
                const privateKey = (0, encryption_service_1.decryptPrivateKey)(user.encryptedPrivateKey);
                // Check if decrypted key is bech32 or raw bytes
                if (privateKey.startsWith('suiprivkey1')) {
                    keypair = ed25519_1.Ed25519Keypair.fromSecretKey(privateKey);
                }
                else {
                    // Assume it's base64 encoded bytes
                    keypair = ed25519_1.Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
                }
            }
            // Build transfer transaction
            const tx = new transactions_1.Transaction();
            tx.setSender(user.walletAddress);
            const [paymentCoin] = tx.splitCoins(tx.gas, [
                tx.pure.u64(amount * 1_000_000_000) // Convert to MIST
            ]);
            tx.transferObjects([paymentCoin], tx.pure.address(recipient));
            tx.setGasBudget(constants_1.CONSTANTS.DEFAULT_GAS_BUDGET);
            // Execute transaction
            const result = await (0, sui_config_1.getSuiClient)().signAndExecuteTransaction({
                transaction: tx,
                signer: keypair,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
            });
            // Wait for transaction confirmation
            await (0, sui_config_1.getSuiClient)().waitForTransaction({
                digest: result.digest,
            });
            // Record transaction in database
            const transactionRecord = await Transaction_model_1.Transaction.create({
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
            await (0, redis_config_1.setCached)(`balance:${user.walletAddress}`, null, 0);
            logger_1.default.info(`SUI transfer completed`, {
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
        }
        catch (error) {
            logger_1.default.error('Transfer error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?.id,
                body: req.body,
            });
            if (error instanceof Error && error.message.includes('Insufficient')) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient balance for transfer',
                    code: constants_1.ERROR_CODES.INSUFFICIENT_BALANCE,
                });
            }
            next(error);
        }
    }
    async importWallet(req, res, next) {
        try {
            const { privateKey } = req.body;
            const userId = req.user.id;
            // Input validation
            if (!privateKey) {
                return res.status(400).json({
                    success: false,
                    error: 'Private key is required',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Check if user already has a wallet
            const user = await User_model_1.User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            if (user.walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'User already has a wallet. Cannot import over existing wallet.',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            try {
                // Validate and create keypair from private key
                let keypair;
                // Try to parse private key (support different formats)
                if (privateKey.startsWith('suiprivkey1')) {
                    // Sui bech32 format - use directly
                    keypair = ed25519_1.Ed25519Keypair.fromSecretKey(privateKey);
                }
                else if (privateKey.startsWith('0x')) {
                    // Hex format
                    const keyBytes = Buffer.from(privateKey.slice(2), 'hex');
                    keypair = ed25519_1.Ed25519Keypair.fromSecretKey(keyBytes);
                }
                else {
                    // Base64 format
                    const keyBytes = Buffer.from(privateKey, 'base64');
                    keypair = ed25519_1.Ed25519Keypair.fromSecretKey(keyBytes);
                }
                const publicKey = keypair.getPublicKey();
                const walletAddress = publicKey.toSuiAddress();
                // Store private key in bech32 format (recommended)
                const storedPrivateKey = keypair.getSecretKey(); // bech32 format
                // Update user with wallet info
                user.walletAddress = walletAddress;
                user.encryptedPrivateKey = storedPrivateKey; // Store bech32 format
                await user.save();
                // Get wallet balance for response
                let balance = 0;
                try {
                    const balanceResult = await (0, sui_config_1.getSuiClient)().getBalance({
                        owner: walletAddress,
                        coinType: '0x2::sui::SUI',
                    });
                    balance = parseFloat(balanceResult.totalBalance) / 1_000_000_000;
                }
                catch (balanceError) {
                    logger_1.default.warn('Could not fetch balance for imported wallet', { walletAddress });
                }
                logger_1.default.info(`Wallet imported successfully`, {
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
            }
            catch (keyError) {
                logger_1.default.error('Invalid private key format:', keyError);
                return res.status(400).json({
                    success: false,
                    error: 'Invalid private key format. Please provide a valid Ed25519 private key.',
                    code: constants_1.ERROR_CODES.INVALID_INPUT,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Wallet import error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?.id,
            });
            next(error);
        }
    }
    async exportWallet(req, res, next) {
        try {
            const userId = req.user.id;
            const { password } = req.body;
            // Input validation
            if (!password) {
                return res.status(400).json({
                    success: false,
                    error: 'Password is required for wallet export',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Get user with encrypted private key and password
            const user = await User_model_1.User.findById(userId).select('+encryptedPrivateKey +password');
            if (!user || !user.walletAddress || !user.encryptedPrivateKey) {
                return res.status(404).json({
                    success: false,
                    error: 'User wallet not found',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Verify user password for security
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid password',
                    code: constants_1.ERROR_CODES.AUTH_FAILED,
                });
            }
            try {
                // Decrypt private key
                const privateKey = (0, encryption_service_1.decryptPrivateKey)(user.encryptedPrivateKey);
                // Create keypair to get public key
                const keypair = ed25519_1.Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
                const publicKey = keypair.getPublicKey();
                // Get wallet balance
                let balance = 0;
                try {
                    const balanceResult = await (0, sui_config_1.getSuiClient)().getBalance({
                        owner: user.walletAddress,
                        coinType: '0x2::sui::SUI',
                    });
                    balance = parseFloat(balanceResult.totalBalance) / 1_000_000_000;
                }
                catch (balanceError) {
                    logger_1.default.warn('Could not fetch balance for wallet export', {
                        walletAddress: user.walletAddress
                    });
                }
                // Log export event (for security audit)
                logger_1.default.warn(`Wallet export requested`, {
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
            }
            catch (decryptError) {
                logger_1.default.error('Failed to decrypt private key for export:', {
                    error: decryptError,
                    userId: user._id,
                });
                return res.status(500).json({
                    success: false,
                    error: 'Failed to decrypt wallet. Please contact support.',
                    code: constants_1.ERROR_CODES.INTERNAL_ERROR,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Wallet export error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?.id,
            });
            next(error);
        }
    }
    async requestFromFaucet(req, res, next) {
        try {
            const userId = req.user.id;
            // Get user wallet
            const user = await User_model_1.User.findById(userId);
            if (!user || !user.walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'User wallet not found',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Check if on testnet/devnet
            if (process.env.NODE_ENV === 'production') {
                return res.status(400).json({
                    success: false,
                    error: 'Faucet is only available on testnet/devnet',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            try {
                // Determine network for faucet
                const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
                // Request from faucet
                await (0, faucet_1.requestSuiFromFaucetV2)({
                    host: (0, faucet_1.getFaucetHost)(network),
                    recipient: user.walletAddress,
                });
                // Clear balance cache to reflect new balance
                await (0, redis_config_1.setCached)(`balance:${user.walletAddress}`, null, 0);
                // Get updated balance
                const balanceResult = await (0, sui_config_1.getSuiClient)().getBalance({
                    owner: user.walletAddress,
                    coinType: '0x2::sui::SUI',
                });
                const newBalance = parseFloat(balanceResult.totalBalance) / 1_000_000_000;
                logger_1.default.info(`Faucet request completed`, {
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
            }
            catch (faucetError) {
                logger_1.default.error('Faucet request failed:', {
                    error: faucetError,
                    userId: user._id,
                    walletAddress: user.walletAddress,
                });
                return res.status(400).json({
                    success: false,
                    error: 'Faucet request failed. You may have reached the rate limit.',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async getTransactionHistory(req, res, next) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || constants_1.CONSTANTS.DEFAULT_PAGE_SIZE, constants_1.CONSTANTS.MAX_PAGE_SIZE);
            // Get user wallet
            const user = await User_model_1.User.findById(userId);
            if (!user || !user.walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'User wallet not found',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            const skip = (page - 1) * limit;
            // Get wallet transactions from database
            const [transactions, total] = await Promise.all([
                Transaction_model_1.Transaction.find({
                    $or: [
                        { fromAddress: user.walletAddress },
                        { toAddress: user.walletAddress }
                    ]
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('merchantId', 'merchantName'),
                Transaction_model_1.Transaction.countDocuments({
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
        }
        catch (error) {
            next(error);
        }
    }
    async getWalletInfo(req, res, next) {
        try {
            const userId = req.user.id;
            // Get user wallet
            const user = await User_model_1.User.findById(userId);
            if (!user || !user.walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'User wallet not found',
                    code: constants_1.ERROR_CODES.VALIDATION_ERROR,
                });
            }
            // Get balance and objects in parallel
            const [balanceResult, objectsResult] = await Promise.all([
                (0, sui_config_1.getSuiClient)().getBalance({
                    owner: user.walletAddress,
                    coinType: '0x2::sui::SUI',
                }),
                (0, sui_config_1.getSuiClient)().getOwnedObjects({
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
            const recentTransactionCount = await Transaction_model_1.Transaction.countDocuments({
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WalletController = WalletController;
exports.walletController = new WalletController();
//# sourceMappingURL=wallet.controller.js.map