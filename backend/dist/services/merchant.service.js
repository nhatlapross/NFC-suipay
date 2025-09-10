"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantService = exports.MerchantService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const Merchant_model_1 = require("../models/Merchant.model");
const Transaction_model_1 = require("../models/Transaction.model");
const Webhook_model_1 = require("../models/Webhook.model");
const ApiKey_model_1 = require("../models/ApiKey.model");
const encryption_service_1 = require("./encryption.service");
const sui_config_1 = require("../config/sui.config");
const logger_1 = __importDefault(require("../utils/logger"));
class MerchantService {
    generateMerchantId() {
        return `mch_${(0, uuid_1.v4)().replace(/-/g, '').substring(0, 16)}`;
    }
    generateApiKeys() {
        const publicKey = `pk_${crypto_1.default.randomBytes(16).toString('hex')}`;
        const secretKey = `sk_${crypto_1.default.randomBytes(32).toString('hex')}`;
        const webhookSecret = `whsec_${crypto_1.default.randomBytes(24).toString('hex')}`;
        return {
            publicKey,
            secretKey,
            webhookSecret
        };
    }
    async validateWalletAddress(walletAddress) {
        try {
            const suiClient = (0, sui_config_1.getSuiClient)();
            const balance = await suiClient.getBalance({ owner: walletAddress });
            return balance !== null;
        }
        catch (error) {
            logger_1.default.error('Wallet validation error:', error);
            return false;
        }
    }
    calculateNextSettlementDate(period) {
        const now = new Date();
        switch (period) {
            case 'daily':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case 'weekly':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case 'monthly':
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
                return nextMonth;
            default:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
    }
    async registerMerchant(data) {
        try {
            // 1. Validate wallet address
            const isValidWallet = await this.validateWalletAddress(data.walletAddress);
            if (!isValidWallet) {
                throw new Error('Invalid wallet address or wallet not found on Sui network');
            }
            // 2. Check for existing merchant with same email or wallet
            const existingMerchant = await Merchant_model_1.Merchant.findOne({
                $or: [
                    { email: data.email },
                    { walletAddress: data.walletAddress }
                ]
            });
            if (existingMerchant) {
                if (existingMerchant.email === data.email) {
                    throw new Error('Merchant with this email already exists');
                }
                if (existingMerchant.walletAddress === data.walletAddress) {
                    throw new Error('Merchant with this wallet address already exists');
                }
            }
            // 3. Generate unique merchant ID and API keys
            const merchantId = this.generateMerchantId();
            const apiKeys = this.generateApiKeys();
            // 4. Calculate next settlement date
            const settlementPeriod = data.settlementPeriod || 'daily';
            const nextSettlementDate = this.calculateNextSettlementDate(settlementPeriod);
            // 5. Create merchant record
            const merchant = await Merchant_model_1.Merchant.create({
                merchantId,
                merchantName: data.merchantName,
                businessType: data.businessType,
                walletAddress: data.walletAddress,
                email: data.email,
                phoneNumber: data.phoneNumber,
                address: data.address,
                bankAccount: data.bankAccount,
                apiKeys: {
                    publicKey: apiKeys.publicKey,
                    secretKey: apiKeys.secretKey, // Store unencrypted for now to debug
                    webhookSecret: (0, encryption_service_1.encryptData)(apiKeys.webhookSecret)
                },
                webhookUrl: data.webhookUrl,
                settlementPeriod,
                nextSettlementDate,
                isActive: true,
                isVerified: false, // Will be verified manually or through KYC process
                commission: 2.5, // Default 2.5%
                totalTransactions: 0,
                totalVolume: 0
            });
            logger_1.default.info('Merchant registered successfully', {
                merchantId,
                email: data.email,
                walletAddress: data.walletAddress
            });
            return {
                merchant,
                apiKeys
            };
        }
        catch (error) {
            logger_1.default.error('Merchant registration error:', error);
            throw error;
        }
    }
    async getMerchantByPublicKey(publicKey) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ 'apiKeys.publicKey': publicKey })
                .select('+apiKeys.secretKey +apiKeys.webhookSecret'); // Explicitly include the excluded fields
            return merchant;
        }
        catch (error) {
            logger_1.default.error('Error finding merchant by public key:', error);
            return null;
        }
    }
    async getMerchantById(merchantId) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            return merchant;
        }
        catch (error) {
            logger_1.default.error('Error finding merchant by ID:', error);
            return null;
        }
    }
    async updateMerchantProfile(merchantId, updateData) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            // Update allowed fields
            const allowedUpdates = [
                'merchantName', 'phoneNumber', 'address', 'bankAccount',
                'webhookUrl', 'settlementPeriod'
            ];
            Object.keys(updateData).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    merchant[key] = updateData[key];
                }
            });
            // Recalculate next settlement date if period changed
            if (updateData.settlementPeriod && updateData.settlementPeriod !== merchant.settlementPeriod) {
                merchant.nextSettlementDate = this.calculateNextSettlementDate(updateData.settlementPeriod);
            }
            await merchant.save();
            logger_1.default.info('Merchant profile updated', {
                merchantId,
                updatedFields: Object.keys(updateData)
            });
            return merchant;
        }
        catch (error) {
            logger_1.default.error('Merchant profile update error:', error);
            throw error;
        }
    }
    async getMerchantPayments(merchantId, page = 1, limit = 20, status) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            const skip = (page - 1) * limit;
            const query = { merchantId: merchant._id };
            if (status) {
                query.status = status;
            }
            const [payments, total] = await Promise.all([
                Transaction_model_1.Transaction.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('userId', 'fullName email')
                    .populate('cardId', 'cardType lastFourDigits'),
                Transaction_model_1.Transaction.countDocuments(query)
            ]);
            return {
                payments,
                total,
                pages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching merchant payments:', error);
            throw error;
        }
    }
    async getMerchantPaymentStats(merchantId) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const baseQuery = { merchantId: merchant._id, status: 'completed' };
            const [todayStats, weekStats, monthStats, overallStats] = await Promise.all([
                // Today's stats
                Transaction_model_1.Transaction.aggregate([
                    { $match: { ...baseQuery, completedAt: { $gte: startOfDay } } },
                    {
                        $group: {
                            _id: null,
                            transactions: { $sum: 1 },
                            volume: { $sum: '$amount' },
                            fees: { $sum: '$gasFee' }
                        }
                    }
                ]),
                // Week stats
                Transaction_model_1.Transaction.aggregate([
                    { $match: { ...baseQuery, completedAt: { $gte: startOfWeek } } },
                    {
                        $group: {
                            _id: null,
                            transactions: { $sum: 1 },
                            volume: { $sum: '$amount' },
                            fees: { $sum: '$gasFee' }
                        }
                    }
                ]),
                // Month stats
                Transaction_model_1.Transaction.aggregate([
                    { $match: { ...baseQuery, completedAt: { $gte: startOfMonth } } },
                    {
                        $group: {
                            _id: null,
                            transactions: { $sum: 1 },
                            volume: { $sum: '$amount' },
                            fees: { $sum: '$gasFee' }
                        }
                    }
                ]),
                // Overall stats
                Transaction_model_1.Transaction.aggregate([
                    { $match: baseQuery },
                    {
                        $group: {
                            _id: null,
                            transactions: { $sum: 1 },
                            volume: { $sum: '$amount' },
                            fees: { $sum: '$gasFee' },
                            averageTransaction: { $avg: '$amount' }
                        }
                    }
                ])
            ]);
            return {
                today: todayStats[0] || { transactions: 0, volume: 0, fees: 0 },
                week: weekStats[0] || { transactions: 0, volume: 0, fees: 0 },
                month: monthStats[0] || { transactions: 0, volume: 0, fees: 0 },
                overall: overallStats[0] || { transactions: 0, volume: 0, fees: 0, averageTransaction: 0 },
                merchant: {
                    totalTransactions: merchant.totalTransactions,
                    totalVolume: merchant.totalVolume,
                    commission: merchant.commission,
                    nextSettlementDate: merchant.nextSettlementDate,
                    isActive: merchant.isActive,
                    isVerified: merchant.isVerified
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching merchant payment stats:', error);
            throw error;
        }
    }
    async getPublicMerchantInfo(merchantId) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId }).select('merchantId merchantName businessType isActive isVerified');
            if (!merchant) {
                return null;
            }
            return {
                merchantId: merchant.merchantId,
                merchantName: merchant.merchantName,
                businessType: merchant.businessType,
                isActive: merchant.isActive,
                isVerified: merchant.isVerified
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching public merchant info:', error);
            return null;
        }
    }
    async refundPayment(merchantId, paymentId, refundData) {
        try {
            // Find merchant
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            // Find transaction
            const transaction = await Transaction_model_1.Transaction.findById(paymentId);
            if (!transaction) {
                throw new Error('Payment not found');
            }
            // Verify merchant owns this transaction
            if (transaction.merchantId?.toString() !== merchant._id.toString()) {
                throw new Error('Merchant not authorized to refund this payment');
            }
            // Check if payment can be refunded
            if (transaction.status !== 'completed') {
                throw new Error('Cannot refund non-completed payment');
            }
            if (transaction.refundedAt) {
                throw new Error('Payment already refunded');
            }
            // Determine refund amount
            const refundAmount = refundData.amount || transaction.amount;
            if (refundAmount > transaction.amount) {
                throw new Error('Refund amount cannot exceed original payment amount');
            }
            // Create refund transaction record
            const refundTransaction = await Transaction_model_1.Transaction.create({
                userId: transaction.userId,
                cardId: transaction.cardId,
                cardUuid: transaction.cardUuid,
                type: 'refund',
                amount: refundAmount,
                currency: transaction.currency,
                merchantId: merchant._id,
                merchantName: merchant.merchantName,
                status: 'completed',
                fromAddress: merchant.walletAddress,
                toAddress: transaction.fromAddress,
                originalTransactionId: transaction._id,
                metadata: {
                    reason: refundData.reason || 'Merchant refund',
                    originalPaymentId: transaction._id
                }
            });
            // Mark original transaction as refunded
            transaction.refundedAt = new Date();
            transaction.refundAmount = refundAmount;
            transaction.refundReason = refundData.reason;
            await transaction.save();
            // Update merchant stats
            merchant.totalVolume -= refundAmount;
            await merchant.save();
            logger_1.default.info('Payment refunded successfully', {
                merchantId,
                paymentId,
                refundAmount,
                reason: refundData.reason
            });
            return {
                originalTransaction: transaction,
                refundTransaction,
                refundAmount,
                refundedAt: transaction.refundedAt
            };
        }
        catch (error) {
            logger_1.default.error('Refund payment error:', error);
            throw error;
        }
    }
    async getMerchantSettings(merchantId) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            const settings = merchant.metadata?.settings || {};
            return {
                merchantId: merchant.merchantId,
                notifications: settings.notifications || {
                    email: true,
                    webhook: true,
                    sms: false,
                    paymentSuccess: true,
                    paymentFailed: true,
                    refunds: true,
                    settlements: true
                },
                paymentMethods: settings.paymentMethods || ['nfc', 'qr', 'api'],
                currency: settings.currency || 'SUI',
                autoSettlement: settings.autoSettlement !== false,
                settlementPeriod: merchant.settlementPeriod,
                webhookUrl: merchant.webhookUrl,
                apiCallbackUrl: settings.apiCallbackUrl,
                commission: merchant.commission,
                limits: settings.limits || {
                    daily: 10000,
                    monthly: 100000,
                    perTransaction: 1000
                },
                security: settings.security || {
                    requireWebhookSignature: true,
                    ipWhitelist: [],
                    apiRateLimit: 1000
                },
                updatedAt: merchant.updatedAt
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching merchant settings:', error);
            throw error;
        }
    }
    async updateMerchantSettings(merchantId, settingsUpdate) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            // Initialize metadata if not exists
            if (!merchant.metadata) {
                merchant.metadata = {};
            }
            if (!merchant.metadata.settings) {
                merchant.metadata.settings = {};
            }
            const currentSettings = merchant.metadata.settings;
            // Update specific settings
            if (settingsUpdate.notifications) {
                currentSettings.notifications = {
                    ...currentSettings.notifications,
                    ...settingsUpdate.notifications
                };
            }
            if (settingsUpdate.paymentMethods) {
                currentSettings.paymentMethods = settingsUpdate.paymentMethods;
            }
            if (settingsUpdate.currency) {
                currentSettings.currency = settingsUpdate.currency;
            }
            if (settingsUpdate.autoSettlement !== undefined) {
                currentSettings.autoSettlement = settingsUpdate.autoSettlement;
            }
            if (settingsUpdate.apiCallbackUrl !== undefined) {
                currentSettings.apiCallbackUrl = settingsUpdate.apiCallbackUrl;
            }
            if (settingsUpdate.limits) {
                currentSettings.limits = {
                    ...currentSettings.limits,
                    ...settingsUpdate.limits
                };
            }
            if (settingsUpdate.security) {
                currentSettings.security = {
                    ...currentSettings.security,
                    ...settingsUpdate.security
                };
            }
            // Update direct merchant fields
            if (settingsUpdate.webhookUrl !== undefined) {
                merchant.webhookUrl = settingsUpdate.webhookUrl;
            }
            if (settingsUpdate.settlementPeriod) {
                merchant.settlementPeriod = settingsUpdate.settlementPeriod;
                merchant.nextSettlementDate = this.calculateNextSettlementDate(settingsUpdate.settlementPeriod);
            }
            merchant.metadata.settings = currentSettings;
            await merchant.save();
            logger_1.default.info('Merchant settings updated', {
                merchantId,
                updatedFields: Object.keys(settingsUpdate)
            });
            // Return updated settings
            return await this.getMerchantSettings(merchantId);
        }
        catch (error) {
            logger_1.default.error('Error updating merchant settings:', error);
            throw error;
        }
    }
    async getWebhooks(merchantId) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            const webhooks = await Webhook_model_1.Webhook.find({ merchantId: merchant._id }).select('-secretKey');
            return webhooks;
        }
        catch (error) {
            logger_1.default.error('Error fetching webhooks:', error);
            throw error;
        }
    }
    async createWebhook(merchantId, webhookData) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            // Check for duplicate webhook URL
            const existingWebhook = await Webhook_model_1.Webhook.findOne({
                merchantId: merchant._id,
                url: webhookData.url
            });
            if (existingWebhook) {
                throw new Error('Webhook with this URL already exists for this merchant');
            }
            // Generate webhook secret
            const secretKey = crypto_1.default.randomBytes(32).toString('hex');
            const webhook = await Webhook_model_1.Webhook.create({
                merchantId: merchant._id,
                url: webhookData.url,
                events: webhookData.events,
                description: webhookData.description,
                secretKey,
                isActive: true,
                failureCount: 0
            });
            logger_1.default.info('Webhook created', {
                merchantId,
                webhookId: webhook._id,
                url: webhookData.url,
                events: webhookData.events
            });
            // Return webhook without secret key
            const { secretKey: _, ...webhookResponse } = webhook.toObject();
            return webhookResponse;
        }
        catch (error) {
            logger_1.default.error('Error creating webhook:', error);
            throw error;
        }
    }
    async updateWebhook(merchantId, webhookId, updateData) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            const webhook = await Webhook_model_1.Webhook.findById(webhookId);
            if (!webhook) {
                throw new Error('Webhook not found');
            }
            if (webhook.merchantId.toString() !== merchant._id.toString()) {
                throw new Error('Merchant not authorized to update this webhook');
            }
            // Check for duplicate URL if URL is being updated
            if (updateData.url && updateData.url !== webhook.url) {
                const existingWebhook = await Webhook_model_1.Webhook.findOne({
                    merchantId: merchant._id,
                    url: updateData.url,
                    _id: { $ne: webhookId }
                });
                if (existingWebhook) {
                    throw new Error('Webhook with this URL already exists for this merchant');
                }
            }
            // Update fields
            if (updateData.url)
                webhook.url = updateData.url;
            if (updateData.events)
                webhook.events = updateData.events;
            if (updateData.description !== undefined)
                webhook.description = updateData.description;
            if (updateData.isActive !== undefined)
                webhook.isActive = updateData.isActive;
            // Reset failure count if reactivating
            if (updateData.isActive === true && webhook.failureCount > 0) {
                webhook.failureCount = 0;
            }
            await webhook.save();
            logger_1.default.info('Webhook updated', {
                merchantId,
                webhookId,
                updatedFields: Object.keys(updateData)
            });
            // Return webhook without secret key
            const { secretKey: _, ...webhookResponse } = webhook.toObject();
            return webhookResponse;
        }
        catch (error) {
            logger_1.default.error('Error updating webhook:', error);
            throw error;
        }
    }
    async deleteWebhook(merchantId, webhookId) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            const webhook = await Webhook_model_1.Webhook.findById(webhookId);
            if (!webhook) {
                throw new Error('Webhook not found');
            }
            if (webhook.merchantId.toString() !== merchant._id.toString()) {
                throw new Error('Merchant not authorized to delete this webhook');
            }
            await Webhook_model_1.Webhook.findByIdAndDelete(webhookId);
            logger_1.default.info('Webhook deleted', {
                merchantId,
                webhookId,
                url: webhook.url
            });
        }
        catch (error) {
            logger_1.default.error('Error deleting webhook:', error);
            throw error;
        }
    }
    async getApiKeys(merchantId) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            const apiKeys = await ApiKey_model_1.ApiKey.find({ merchantId: merchant._id })
                .select('-secretKeyHash')
                .sort({ createdAt: -1 });
            return apiKeys.map(key => ({
                keyId: key.keyId,
                name: key.name,
                publicKey: key.publicKey,
                permissions: key.permissions,
                isActive: key.isActive,
                lastUsed: key.lastUsed,
                usageCount: key.usageCount,
                rateLimit: key.rateLimit,
                ipWhitelist: key.ipWhitelist,
                expiresAt: key.expiresAt,
                createdAt: key.createdAt,
                updatedAt: key.updatedAt
            }));
        }
        catch (error) {
            logger_1.default.error('Error fetching API keys:', error);
            throw error;
        }
    }
    async createApiKey(merchantId, keyData) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            // Check API key limit (max 10 keys per merchant)
            const existingKeysCount = await ApiKey_model_1.ApiKey.countDocuments({
                merchantId: merchant._id,
                isActive: true
            });
            if (existingKeysCount >= 10) {
                throw new Error('API key limit exceeded. Maximum 10 active API keys per merchant.');
            }
            // Generate key ID and keys
            const keyId = `key_${(0, uuid_1.v4)().replace(/-/g, '').substring(0, 16)}`;
            const publicKey = `pk_${crypto_1.default.randomBytes(16).toString('hex')}`;
            const secretKey = `sk_${crypto_1.default.randomBytes(32).toString('hex')}`;
            // Hash the secret key for storage
            const secretKeyHash = crypto_1.default.createHash('sha256').update(secretKey).digest('hex');
            // Set default permissions if not provided
            const permissions = keyData.permissions || ['payments.create', 'payments.read'];
            // Set expiration date if provided
            let expiresAt;
            if (keyData.expiresIn && keyData.expiresIn > 0) {
                expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + keyData.expiresIn);
            }
            const apiKey = await ApiKey_model_1.ApiKey.create({
                merchantId: merchant._id,
                keyId,
                name: keyData.name,
                publicKey,
                secretKeyHash,
                permissions,
                rateLimit: keyData.rateLimit || {
                    requestsPerMinute: 60,
                    requestsPerHour: 1000,
                    requestsPerDay: 10000
                },
                ipWhitelist: keyData.ipWhitelist || [],
                expiresAt,
                isActive: true,
                usageCount: 0
            });
            logger_1.default.info('API key created', {
                merchantId,
                keyId,
                name: keyData.name,
                permissions
            });
            return {
                keyId: apiKey.keyId,
                name: apiKey.name,
                publicKey: apiKey.publicKey,
                secretKey, // Only returned once during creation
                permissions: apiKey.permissions,
                rateLimit: apiKey.rateLimit,
                ipWhitelist: apiKey.ipWhitelist,
                expiresAt: apiKey.expiresAt,
                createdAt: apiKey.createdAt
            };
        }
        catch (error) {
            logger_1.default.error('Error creating API key:', error);
            throw error;
        }
    }
    async deleteApiKey(merchantId, keyId) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            const apiKey = await ApiKey_model_1.ApiKey.findOne({ keyId });
            if (!apiKey) {
                throw new Error('API key not found');
            }
            if (apiKey.merchantId.toString() !== merchant._id.toString()) {
                throw new Error('Merchant not authorized to delete this API key');
            }
            await ApiKey_model_1.ApiKey.findByIdAndDelete(apiKey._id);
            logger_1.default.info('API key deleted', {
                merchantId,
                keyId,
                name: apiKey.name
            });
        }
        catch (error) {
            logger_1.default.error('Error deleting API key:', error);
            throw error;
        }
    }
    async validateApiKey(publicKey, secretKey) {
        try {
            logger_1.default.info('Starting API key validation', {
                publicKey: publicKey.substring(0, 10) + '...',
                secretKeyLength: secretKey.length
            });
            // First, check if it's a primary API key (stored in merchant document)
            const merchant = await this.getMerchantByPublicKey(publicKey);
            if (merchant) {
                logger_1.default.info('Found merchant for public key:', {
                    merchantId: merchant.merchantId,
                    publicKey: publicKey.substring(0, 10) + '...'
                });
                // For now, compare directly without decryption to debug
                const storedSecretKey = merchant.apiKeys.secretKey;
                logger_1.default.info('Comparing keys directly', {
                    storedLength: storedSecretKey.length,
                    providedLength: secretKey.length,
                    storedStart: storedSecretKey.substring(0, 10) + '...',
                    providedStart: secretKey.substring(0, 10) + '...'
                });
                if (storedSecretKey === secretKey) {
                    logger_1.default.info('API key validation successful for merchant:', merchant.merchantId);
                    return {
                        isValid: true,
                        merchant,
                        apiKey: {
                            keyId: 'primary',
                            publicKey: merchant.apiKeys.publicKey,
                            permissions: ['*'], // Primary keys have all permissions
                            isActive: merchant.isActive
                        }
                    };
                }
                else {
                    logger_1.default.warn('Secret key mismatch for merchant:', {
                        merchantId: merchant.merchantId,
                        expected: storedSecretKey.substring(0, 10) + '...',
                        provided: secretKey.substring(0, 10) + '...'
                    });
                }
            }
            else {
                logger_1.default.info('No merchant found for public key:', publicKey.substring(0, 10) + '...');
            }
            logger_1.default.info('Checking ApiKey collection');
            // If not found in merchant document, check ApiKey collection
            const apiKey = await ApiKey_model_1.ApiKey.findOne({ publicKey, isActive: true })
                .populate('merchantId');
            if (!apiKey) {
                logger_1.default.info('No API key found in ApiKey collection');
                return { isValid: false, error: 'Invalid API key' };
            }
            // Check if key is expired
            if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
                return { isValid: false, error: 'API key has expired' };
            }
            // Verify secret key
            const secretKeyHash = crypto_1.default.createHash('sha256').update(secretKey).digest('hex');
            if (apiKey.secretKeyHash !== secretKeyHash) {
                return { isValid: false, error: 'Invalid API key' };
            }
            // Update usage statistics
            apiKey.lastUsed = new Date();
            apiKey.usageCount += 1;
            await apiKey.save();
            return {
                isValid: true,
                merchant: apiKey.merchantId,
                apiKey
            };
        }
        catch (error) {
            logger_1.default.error('Error validating API key - detailed:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : 'No stack trace',
                publicKey: publicKey.substring(0, 10) + '...'
            });
            return { isValid: false, error: 'API key validation failed' };
        }
    }
    async getAllMerchants(options) {
        try {
            const { page, limit, status, search, sortBy = 'createdAt' } = options;
            const skip = (page - 1) * limit;
            // Build query
            const query = {};
            if (status) {
                if (status === 'active') {
                    query.isActive = true;
                }
                else if (status === 'inactive') {
                    query.isActive = false;
                }
                else if (status === 'verified') {
                    query.isVerified = true;
                }
                else if (status === 'unverified') {
                    query.isVerified = false;
                }
            }
            if (search) {
                query.$or = [
                    { merchantName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { merchantId: { $regex: search, $options: 'i' } },
                    { businessType: { $regex: search, $options: 'i' } }
                ];
            }
            // Build sort
            const sortOptions = {};
            const validSortFields = ['createdAt', 'updatedAt', 'merchantName', 'totalVolume', 'totalTransactions'];
            if (validSortFields.includes(sortBy)) {
                sortOptions[sortBy] = -1; // Descending by default
            }
            else {
                sortOptions.createdAt = -1;
            }
            const [merchants, total] = await Promise.all([
                Merchant_model_1.Merchant.find(query)
                    .select('-apiKeys.secretKey -apiKeys.webhookSecret')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Merchant_model_1.Merchant.countDocuments(query)
            ]);
            const merchantsWithStats = merchants.map(merchant => ({
                ...merchant,
                stats: {
                    totalTransactions: merchant.totalTransactions || 0,
                    totalVolume: merchant.totalVolume || 0,
                    commission: merchant.commission || 0,
                    nextSettlement: merchant.nextSettlementDate,
                    status: merchant.isActive ? 'active' : 'inactive',
                    verified: merchant.isVerified
                }
            }));
            return {
                merchants: merchantsWithStats,
                total,
                pages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching all merchants:', error);
            throw error;
        }
    }
    async updateMerchantStatus(merchantId, status, reason) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            // Update status
            switch (status) {
                case 'active':
                    merchant.isActive = true;
                    merchant.isVerified = true;
                    break;
                case 'inactive':
                    merchant.isActive = false;
                    break;
                case 'suspended':
                    merchant.isActive = false;
                    merchant.isVerified = false;
                    break;
                case 'pending':
                    merchant.isActive = false;
                    merchant.isVerified = false;
                    break;
            }
            // Store status change in metadata
            if (!merchant.metadata) {
                merchant.metadata = {};
            }
            if (!merchant.metadata.statusHistory) {
                merchant.metadata.statusHistory = [];
            }
            merchant.metadata.statusHistory.push({
                status,
                reason,
                timestamp: new Date(),
                previousStatus: {
                    isActive: !merchant.isActive,
                    isVerified: !merchant.isVerified
                }
            });
            await merchant.save();
            logger_1.default.info('Merchant status updated by admin', {
                merchantId,
                newStatus: status,
                reason
            });
            return merchant;
        }
        catch (error) {
            logger_1.default.error('Error updating merchant status:', error);
            throw error;
        }
    }
    async updateMerchantLimits(merchantId, limits) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error('Merchant not found');
            }
            // Update commission if provided
            if (limits.commission !== undefined) {
                merchant.commission = limits.commission;
            }
            // Store limits in metadata
            if (!merchant.metadata) {
                merchant.metadata = {};
            }
            if (!merchant.metadata.limits) {
                merchant.metadata.limits = {};
            }
            if (limits.dailyLimit !== undefined) {
                merchant.metadata.limits.dailyLimit = limits.dailyLimit;
            }
            if (limits.monthlyLimit !== undefined) {
                merchant.metadata.limits.monthlyLimit = limits.monthlyLimit;
            }
            // Store limits history
            if (!merchant.metadata.limitsHistory) {
                merchant.metadata.limitsHistory = [];
            }
            merchant.metadata.limitsHistory.push({
                limits,
                timestamp: new Date()
            });
            await merchant.save();
            logger_1.default.info('Merchant limits updated by admin', {
                merchantId,
                limits
            });
            return merchant;
        }
        catch (error) {
            logger_1.default.error('Error updating merchant limits:', error);
            throw error;
        }
    }
}
exports.MerchantService = MerchantService;
exports.merchantService = new MerchantService();
//# sourceMappingURL=merchant.service.js.map