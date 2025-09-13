import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { Merchant, IMerchant } from "../models/Merchant.model";
import { Transaction as TransactionModel } from "../models/Transaction.model";
import { Webhook, IWebhook } from "../models/Webhook.model";
import { ApiKey, IApiKey } from "../models/ApiKey.model";
import { encryptData } from "./encryption.service";
import { getSuiClient } from "../config/sui.config";
import logger from "../utils/logger";

export interface MerchantRegistrationData {
    merchantName: string;
    businessType: string;
    email: string;
    phoneNumber: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
    };
    bankAccount?: {
        accountNumber: string;
        bankName: string;
        routingNumber: string;
    };
    walletAddress: string;
    webhookUrl?: string;
    settlementPeriod?: "daily" | "weekly" | "monthly";
}

export interface MerchantApiKeys {
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
}

export class MerchantService {
    private generateMerchantId(): string {
        return `mch_${uuidv4().replace(/-/g, "").substring(0, 16)}`;
    }

    private generateApiKeys(): MerchantApiKeys {
        const publicKey = `pk_${crypto.randomBytes(16).toString("hex")}`;
        const secretKey = `sk_${crypto.randomBytes(32).toString("hex")}`;
        const webhookSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

        return {
            publicKey,
            secretKey,
            webhookSecret,
        };
    }

    private async validateWalletAddress(
        walletAddress: string
    ): Promise<boolean> {
        try {
            const suiClient = getSuiClient();
            const balance = await suiClient.getBalance({
                owner: walletAddress,
            });
            return balance !== null;
        } catch (error) {
            logger.error("Wallet validation error:", error);
            return false;
        }
    }

    private calculateNextSettlementDate(
        period: "daily" | "weekly" | "monthly"
    ): Date {
        const now = new Date();

        switch (period) {
            case "daily":
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case "weekly":
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case "monthly":
                const nextMonth = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    now.getDate()
                );
                return nextMonth;
            default:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
    }

    async registerMerchant(
        data: MerchantRegistrationData,
        userId: string
    ): Promise<{
        merchant: IMerchant;
        apiKeys: MerchantApiKeys;
    }> {
        try {
            // 1. Validate wallet address
            const isValidWallet = await this.validateWalletAddress(
                data.walletAddress
            );
            if (!isValidWallet) {
                throw new Error(
                    "Invalid wallet address or wallet not found on Sui network"
                );
            }

            // 2. Check for existing merchant with same email or wallet
            const existingMerchant = await Merchant.findOne({
                $or: [
                    { email: data.email },
                    { walletAddress: data.walletAddress },
                ],
            });

            if (existingMerchant) {
                if (existingMerchant.email === data.email) {
                    throw new Error("Merchant with this email already exists");
                }
                if (existingMerchant.walletAddress === data.walletAddress) {
                    throw new Error(
                        "Merchant with this wallet address already exists"
                    );
                }
            }

            // 3. Generate unique merchant ID and API keys
            const merchantId = this.generateMerchantId();
            const apiKeys = this.generateApiKeys();

            // 4. Calculate next settlement date
            const settlementPeriod = data.settlementPeriod || "daily";
            const nextSettlementDate =
                this.calculateNextSettlementDate(settlementPeriod);

            // 5. Create merchant record
            const merchant = await Merchant.create({
                userId,
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
                    secretKey: apiKeys.secretKey, // Store encrypted in production
                    webhookSecret: encryptData(apiKeys.webhookSecret), // Keep this encrypted
                },
                webhookUrl: data.webhookUrl,
                settlementPeriod,
                nextSettlementDate,
                isActive: true,
                isVerified: false, // Will be verified manually or through KYC process
                commission: 2.5, // Default 2.5%
                totalTransactions: 0,
                totalVolume: 0,
            });

            logger.info("Merchant registered successfully", {
                merchantId,
                email: data.email,
                walletAddress: data.walletAddress,
                userId: userId || "standalone",
            });

            return {
                merchant,
                apiKeys,
            };
        } catch (error) {
            logger.error("Merchant registration error:", error);
            throw error;
        }
    }

    async getMerchantByPublicKey(publicKey: string): Promise<IMerchant | null> {
        try {
            const merchant = await Merchant.findOne({
                "apiKeys.publicKey": publicKey,
            }).select("+apiKeys.secretKey +apiKeys.webhookSecret"); // Explicitly include the excluded fields
            return merchant;
        } catch (error) {
            logger.error("Error finding merchant by public key:", error);
            return null;
        }
    }

    async getMerchantById(merchantId: string): Promise<IMerchant | null> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            return merchant;
        } catch (error) {
            logger.error("Error finding merchant by ID:", error);
            return null;
        }
    }

    async updateMerchantProfile(
        merchantId: string,
        updateData: Partial<MerchantRegistrationData>
    ): Promise<IMerchant> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            // Update allowed fields
            const allowedUpdates = [
                "merchantName",
                "phoneNumber",
                "address",
                "bankAccount",
                "webhookUrl",
                "settlementPeriod",
            ];

            Object.keys(updateData).forEach((key) => {
                if (allowedUpdates.includes(key)) {
                    (merchant as any)[key] = (updateData as any)[key];
                }
            });

            // Recalculate next settlement date if period changed
            if (
                updateData.settlementPeriod &&
                updateData.settlementPeriod !== merchant.settlementPeriod
            ) {
                merchant.nextSettlementDate = this.calculateNextSettlementDate(
                    updateData.settlementPeriod
                );
            }

            await merchant.save();

            logger.info("Merchant profile updated", {
                merchantId,
                updatedFields: Object.keys(updateData),
            });

            return merchant;
        } catch (error) {
            logger.error("Merchant profile update error:", error);
            throw error;
        }
    }

    async getMerchantPayments(
        merchantId: string,
        page: number = 1,
        limit: number = 20,
        status?: string
    ): Promise<{
        payments: any[];
        total: number;
        pages: number;
    }> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            const skip = (page - 1) * limit;
            const query: any = { merchantId: merchant._id };

            if (status) {
                query.status = status;
            }

            const [payments, total] = await Promise.all([
                TransactionModel.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate("userId", "fullName email")
                    .populate("cardId", "cardType lastFourDigits"),
                TransactionModel.countDocuments(query),
            ]);

            return {
                payments,
                total,
                pages: Math.ceil(total / limit),
            };
        } catch (error) {
            logger.error("Error fetching merchant payments:", error);
            throw error;
        }
    }

    async getMerchantPaymentStats(merchantId: string): Promise<any> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            const now = new Date();
            const startOfDay = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );
            const startOfWeek = new Date(
                now.getTime() - 7 * 24 * 60 * 60 * 1000
            );
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const baseQuery = { merchantId: merchant._id, status: "completed" };

            const [todayStats, weekStats, monthStats, overallStats] =
                await Promise.all([
                    // Today's stats
                    TransactionModel.aggregate([
                        {
                            $match: {
                                ...baseQuery,
                                completedAt: { $gte: startOfDay },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                transactions: { $sum: 1 },
                                volume: { $sum: "$amount" },
                                fees: { $sum: "$gasFee" },
                            },
                        },
                    ]),

                    // Week stats
                    TransactionModel.aggregate([
                        {
                            $match: {
                                ...baseQuery,
                                completedAt: { $gte: startOfWeek },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                transactions: { $sum: 1 },
                                volume: { $sum: "$amount" },
                                fees: { $sum: "$gasFee" },
                            },
                        },
                    ]),

                    // Month stats
                    TransactionModel.aggregate([
                        {
                            $match: {
                                ...baseQuery,
                                completedAt: { $gte: startOfMonth },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                transactions: { $sum: 1 },
                                volume: { $sum: "$amount" },
                                fees: { $sum: "$gasFee" },
                            },
                        },
                    ]),

                    // Overall stats
                    TransactionModel.aggregate([
                        { $match: baseQuery },
                        {
                            $group: {
                                _id: null,
                                transactions: { $sum: 1 },
                                volume: { $sum: "$amount" },
                                fees: { $sum: "$gasFee" },
                                averageTransaction: { $avg: "$amount" },
                            },
                        },
                    ]),
                ]);

            return {
                today: todayStats[0] || { transactions: 0, volume: 0, fees: 0 },
                week: weekStats[0] || { transactions: 0, volume: 0, fees: 0 },
                month: monthStats[0] || { transactions: 0, volume: 0, fees: 0 },
                overall: overallStats[0] || {
                    transactions: 0,
                    volume: 0,
                    fees: 0,
                    averageTransaction: 0,
                },
                merchant: {
                    totalTransactions: merchant.totalTransactions,
                    totalVolume: merchant.totalVolume,
                    commission: merchant.commission,
                    nextSettlementDate: merchant.nextSettlementDate,
                    isActive: merchant.isActive,
                    isVerified: merchant.isVerified,
                },
            };
        } catch (error) {
            logger.error("Error fetching merchant payment stats:", error);
            throw error;
        }
    }

    async getPublicMerchantInfo(merchantId: string): Promise<{
        merchantId: string;
        merchantName: string;
        businessType: string;
        isActive: boolean;
        isVerified: boolean;
    } | null> {
        try {
            const merchant = await Merchant.findOne({ merchantId }).select(
                "merchantId merchantName businessType isActive isVerified"
            );

            if (!merchant) {
                return null;
            }

            return {
                merchantId: merchant.merchantId,
                merchantName: merchant.merchantName,
                businessType: merchant.businessType,
                isActive: merchant.isActive,
                isVerified: merchant.isVerified,
            };
        } catch (error) {
            logger.error("Error fetching public merchant info:", error);
            return null;
        }
    }

    async refundPayment(
        merchantId: string,
        paymentId: string,
        refundData: { amount?: number; reason?: string }
    ): Promise<any> {
        try {
            // Find merchant
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            // Find transaction
            const transaction = await TransactionModel.findById(paymentId);
            if (!transaction) {
                throw new Error("Payment not found");
            }

            // Verify merchant owns this transaction
            if (
                transaction.merchantId?.toString() !==
                (merchant._id as any).toString()
            ) {
                throw new Error(
                    "Merchant not authorized to refund this payment"
                );
            }

            // Check if payment can be refunded
            if (transaction.status !== "completed") {
                throw new Error("Cannot refund non-completed payment");
            }

            if (transaction.refundedAt) {
                throw new Error("Payment already refunded");
            }

            // Determine refund amount
            const refundAmount = refundData.amount || transaction.amount;
            if (refundAmount > transaction.amount) {
                throw new Error(
                    "Refund amount cannot exceed original payment amount"
                );
            }

            // Create refund transaction record
            const refundTransaction = await TransactionModel.create({
                userId: transaction.userId,
                cardId: transaction.cardId,
                cardUuid: transaction.cardUuid,
                type: "refund",
                amount: refundAmount,
                currency: transaction.currency,
                merchantId: merchant._id,
                merchantName: merchant.merchantName,
                status: "completed",
                fromAddress: merchant.walletAddress,
                toAddress: transaction.fromAddress,
                originalTransactionId: transaction._id,
                metadata: {
                    reason: refundData.reason || "Merchant refund",
                    originalPaymentId: transaction._id,
                },
            });

            // Mark original transaction as refunded
            transaction.refundedAt = new Date();
            transaction.refundAmount = refundAmount;
            transaction.refundReason = refundData.reason;
            await transaction.save();

            // Update merchant stats
            merchant.totalVolume -= refundAmount;
            await merchant.save();

            logger.info("Payment refunded successfully", {
                merchantId,
                paymentId,
                refundAmount,
                reason: refundData.reason,
            });

            return {
                originalTransaction: transaction,
                refundTransaction,
                refundAmount,
                refundedAt: transaction.refundedAt,
            };
        } catch (error) {
            logger.error("Refund payment error:", error);
            throw error;
        }
    }

    async getMerchantSettings(merchantId: string): Promise<any> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
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
                    settlements: true,
                },
                paymentMethods: settings.paymentMethods || ["nfc", "qr", "api"],
                currency: settings.currency || "SUI",
                autoSettlement: settings.autoSettlement !== false,
                settlementPeriod: merchant.settlementPeriod,
                webhookUrl: merchant.webhookUrl,
                apiCallbackUrl: settings.apiCallbackUrl,
                commission: merchant.commission,
                limits: settings.limits || {
                    daily: 10000,
                    monthly: 100000,
                    perTransaction: 1000,
                },
                security: settings.security || {
                    requireWebhookSignature: true,
                    ipWhitelist: [],
                    apiRateLimit: 1000,
                },
                updatedAt: merchant.updatedAt,
            };
        } catch (error) {
            logger.error("Error fetching merchant settings:", error);
            throw error;
        }
    }

    async updateMerchantSettings(
        merchantId: string,
        settingsUpdate: any
    ): Promise<any> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
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
                    ...settingsUpdate.notifications,
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
                    ...settingsUpdate.limits,
                };
            }

            if (settingsUpdate.security) {
                currentSettings.security = {
                    ...currentSettings.security,
                    ...settingsUpdate.security,
                };
            }

            // Update direct merchant fields
            if (settingsUpdate.webhookUrl !== undefined) {
                merchant.webhookUrl = settingsUpdate.webhookUrl;
            }

            if (settingsUpdate.settlementPeriod) {
                merchant.settlementPeriod = settingsUpdate.settlementPeriod;
                merchant.nextSettlementDate = this.calculateNextSettlementDate(
                    settingsUpdate.settlementPeriod
                );
            }

            merchant.metadata.settings = currentSettings;
            await merchant.save();

            logger.info("Merchant settings updated", {
                merchantId,
                updatedFields: Object.keys(settingsUpdate),
            });

            // Return updated settings
            return await this.getMerchantSettings(merchantId);
        } catch (error) {
            logger.error("Error updating merchant settings:", error);
            throw error;
        }
    }

    async getWebhooks(merchantId: string): Promise<IWebhook[]> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            const webhooks = await Webhook.find({
                merchantId: merchant._id,
            }).select("-secretKey");
            return webhooks;
        } catch (error) {
            logger.error("Error fetching webhooks:", error);
            throw error;
        }
    }

    async createWebhook(
        merchantId: string,
        webhookData: {
            url: string;
            events: string[];
            description?: string;
        }
    ): Promise<IWebhook> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            // Check for duplicate webhook URL
            const existingWebhook = await Webhook.findOne({
                merchantId: merchant._id,
                url: webhookData.url,
            });

            if (existingWebhook) {
                throw new Error(
                    "Webhook with this URL already exists for this merchant"
                );
            }

            // Generate webhook secret
            const secretKey = crypto.randomBytes(32).toString("hex");

            const webhook = await Webhook.create({
                merchantId: merchant._id,
                url: webhookData.url,
                events: webhookData.events,
                description: webhookData.description,
                secretKey,
                isActive: true,
                failureCount: 0,
            });

            logger.info("Webhook created", {
                merchantId,
                webhookId: webhook._id,
                url: webhookData.url,
                events: webhookData.events,
            });

            // Return webhook without secret key
            const { secretKey: _, ...webhookResponse } = webhook.toObject();
            return webhookResponse as any;
        } catch (error) {
            logger.error("Error creating webhook:", error);
            throw error;
        }
    }

    async updateWebhook(
        merchantId: string,
        webhookId: string,
        updateData: {
            url?: string;
            events?: string[];
            description?: string;
            isActive?: boolean;
        }
    ): Promise<IWebhook> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            const webhook = await Webhook.findById(webhookId);
            if (!webhook) {
                throw new Error("Webhook not found");
            }

            if (
                webhook.merchantId.toString() !==
                (merchant._id as any).toString()
            ) {
                throw new Error(
                    "Merchant not authorized to update this webhook"
                );
            }

            // Check for duplicate URL if URL is being updated
            if (updateData.url && updateData.url !== webhook.url) {
                const existingWebhook = await Webhook.findOne({
                    merchantId: merchant._id,
                    url: updateData.url,
                    _id: { $ne: webhookId },
                });

                if (existingWebhook) {
                    throw new Error(
                        "Webhook with this URL already exists for this merchant"
                    );
                }
            }

            // Update fields
            if (updateData.url) webhook.url = updateData.url;
            if (updateData.events) webhook.events = updateData.events;
            if (updateData.description !== undefined)
                webhook.description = updateData.description;
            if (updateData.isActive !== undefined)
                webhook.isActive = updateData.isActive;

            // Reset failure count if reactivating
            if (updateData.isActive === true && webhook.failureCount > 0) {
                webhook.failureCount = 0;
            }

            await webhook.save();

            logger.info("Webhook updated", {
                merchantId,
                webhookId,
                updatedFields: Object.keys(updateData),
            });

            // Return webhook without secret key
            const { secretKey: _, ...webhookResponse } = webhook.toObject();
            return webhookResponse as any;
        } catch (error) {
            logger.error("Error updating webhook:", error);
            throw error;
        }
    }

    async deleteWebhook(merchantId: string, webhookId: string): Promise<void> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            const webhook = await Webhook.findById(webhookId);
            if (!webhook) {
                throw new Error("Webhook not found");
            }

            if (
                webhook.merchantId.toString() !==
                (merchant._id as any).toString()
            ) {
                throw new Error(
                    "Merchant not authorized to delete this webhook"
                );
            }

            await Webhook.findByIdAndDelete(webhookId);

            logger.info("Webhook deleted", {
                merchantId,
                webhookId,
                url: webhook.url,
            });
        } catch (error) {
            logger.error("Error deleting webhook:", error);
            throw error;
        }
    }

    async getApiKeys(merchantId: string): Promise<any[]> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            const apiKeys = await ApiKey.find({ merchantId: merchant._id })
                .select("-secretKeyHash")
                .sort({ createdAt: -1 });

            return apiKeys.map((key) => ({
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
                updatedAt: key.updatedAt,
            }));
        } catch (error) {
            logger.error("Error fetching API keys:", error);
            throw error;
        }
    }

    async createApiKey(
        merchantId: string,
        keyData: {
            name: string;
            permissions?: string[];
            rateLimit?: {
                requestsPerMinute?: number;
                requestsPerHour?: number;
                requestsPerDay?: number;
            };
            ipWhitelist?: string[];
            expiresIn?: number; // days
        }
    ): Promise<{
        keyId: string;
        name: string;
        publicKey: string;
        secretKey: string;
        permissions: string[];
        rateLimit?: any;
        ipWhitelist?: string[];
        expiresAt?: Date;
        createdAt: Date;
    }> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            // Check API key limit (max 10 keys per merchant)
            const existingKeysCount = await ApiKey.countDocuments({
                merchantId: merchant._id,
                isActive: true,
            });

            if (existingKeysCount >= 10) {
                throw new Error(
                    "API key limit exceeded. Maximum 10 active API keys per merchant."
                );
            }

            // Generate key ID and keys
            const keyId = `key_${uuidv4().replace(/-/g, "").substring(0, 16)}`;
            const publicKey = `pk_${crypto.randomBytes(16).toString("hex")}`;
            const secretKey = `sk_${crypto.randomBytes(32).toString("hex")}`;

            // Hash the secret key for storage
            const secretKeyHash = crypto
                .createHash("sha256")
                .update(secretKey)
                .digest("hex");

            // Set default permissions if not provided
            const permissions = keyData.permissions || [
                "payments.create",
                "payments.read",
            ];

            // Set expiration date if provided
            let expiresAt: Date | undefined;
            if (keyData.expiresIn && keyData.expiresIn > 0) {
                expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + keyData.expiresIn);
            }

            const apiKey = await ApiKey.create({
                merchantId: merchant._id,
                keyId,
                name: keyData.name,
                publicKey,
                secretKeyHash,
                permissions,
                rateLimit: keyData.rateLimit || {
                    requestsPerMinute: 60,
                    requestsPerHour: 1000,
                    requestsPerDay: 10000,
                },
                ipWhitelist: keyData.ipWhitelist || [],
                expiresAt,
                isActive: true,
                usageCount: 0,
            });

            logger.info("API key created", {
                merchantId,
                keyId,
                name: keyData.name,
                permissions,
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
                createdAt: apiKey.createdAt,
            };
        } catch (error) {
            logger.error("Error creating API key:", error);
            throw error;
        }
    }

    async deleteApiKey(merchantId: string, keyId: string): Promise<void> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            const apiKey = await ApiKey.findOne({ keyId });
            if (!apiKey) {
                throw new Error("API key not found");
            }

            if (
                apiKey.merchantId.toString() !==
                (merchant._id as any).toString()
            ) {
                throw new Error(
                    "Merchant not authorized to delete this API key"
                );
            }

            await ApiKey.findByIdAndDelete(apiKey._id);

            logger.info("API key deleted", {
                merchantId,
                keyId,
                name: apiKey.name,
            });
        } catch (error) {
            logger.error("Error deleting API key:", error);
            throw error;
        }
    }

    async validateApiKey(
        publicKey: string,
        secretKey: string
    ): Promise<{
        isValid: boolean;
        merchant?: IMerchant;
        apiKey?: IApiKey;
        error?: string;
    }> {
        try {
            logger.info("Starting API key validation", {
                publicKey: publicKey.substring(0, 10) + "...",
                secretKeyLength: secretKey.length,
            });

            // First, check if it's a primary API key (stored in merchant document)
            const merchant = await this.getMerchantByPublicKey(publicKey);
            if (merchant) {
                logger.info("Found merchant for public key:", {
                    merchantId: merchant.merchantId,
                    publicKey: publicKey.substring(0, 10) + "...",
                });

                const storedSecretKey = merchant.apiKeys.secretKey;

                // In production, you should encrypt/decrypt secret keys
                // For now, comparing directly but you should implement proper encryption
                if (storedSecretKey === secretKey) {
                    logger.info(
                        "API key validation successful for merchant:",
                        merchant.merchantId
                    );
                    return {
                        isValid: true,
                        merchant,
                        apiKey: {
                            keyId: "primary",
                            publicKey: merchant.apiKeys.publicKey,
                            permissions: ["*"], // Primary keys have all permissions
                            isActive: merchant.isActive,
                            rateLimit: {
                                requestsPerMinute: 60,
                                requestsPerHour: 1000,
                                requestsPerDay: 10000,
                            },
                        } as any,
                    };
                } else {
                    logger.warn("Secret key mismatch for merchant:", {
                        merchantId: merchant.merchantId,
                    });
                }
            } else {
                logger.info(
                    "No merchant found for public key:",
                    publicKey.substring(0, 10) + "..."
                );
            }

            // If not found in merchant document, check ApiKey collection
            const apiKey = await ApiKey.findOne({
                publicKey,
                isActive: true,
            }).populate("merchantId");

            if (!apiKey) {
                logger.info("No API key found in ApiKey collection");
                return { isValid: false, error: "Invalid API key" };
            }

            // Check if key is expired
            if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
                return { isValid: false, error: "API key has expired" };
            }

            // Verify secret key using hash
            const secretKeyHash = crypto
                .createHash("sha256")
                .update(secretKey)
                .digest("hex");
            if (apiKey.secretKeyHash !== secretKeyHash) {
                return { isValid: false, error: "Invalid API key" };
            }

            // Update usage statistics
            apiKey.lastUsed = new Date();
            apiKey.usageCount += 1;
            await apiKey.save();

            return {
                isValid: true,
                merchant: apiKey.merchantId as any,
                apiKey,
            };
        } catch (error) {
            logger.error("Error validating API key:", {
                error: error instanceof Error ? error.message : String(error),
                publicKey: publicKey.substring(0, 10) + "...",
            });
            return { isValid: false, error: "API key validation failed" };
        }
    }

    async getAllMerchants(options: {
        page: number;
        limit: number;
        status?: string;
        search?: string;
        sortBy?: string;
    }): Promise<{
        merchants: any[];
        total: number;
        pages: number;
    }> {
        try {
            const {
                page,
                limit,
                status,
                search,
                sortBy = "createdAt",
            } = options;
            const skip = (page - 1) * limit;

            // Build query
            const query: any = {};

            if (status) {
                if (status === "active") {
                    query.isActive = true;
                } else if (status === "inactive") {
                    query.isActive = false;
                } else if (status === "verified") {
                    query.isVerified = true;
                } else if (status === "unverified") {
                    query.isVerified = false;
                }
            }

            if (search) {
                query.$or = [
                    { merchantName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { merchantId: { $regex: search, $options: "i" } },
                    { businessType: { $regex: search, $options: "i" } },
                ];
            }

            // Build sort
            const sortOptions: any = {};
            const validSortFields = [
                "createdAt",
                "updatedAt",
                "merchantName",
                "totalVolume",
                "totalTransactions",
            ];

            if (validSortFields.includes(sortBy)) {
                sortOptions[sortBy] = -1; // Descending by default
            } else {
                sortOptions.createdAt = -1;
            }

            const [merchants, total] = await Promise.all([
                Merchant.find(query)
                    .select("-apiKeys.secretKey -apiKeys.webhookSecret")
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Merchant.countDocuments(query),
            ]);

            const merchantsWithStats = merchants.map((merchant) => ({
                ...merchant,
                stats: {
                    totalTransactions: merchant.totalTransactions || 0,
                    totalVolume: merchant.totalVolume || 0,
                    commission: merchant.commission || 0,
                    nextSettlement: merchant.nextSettlementDate,
                    status: merchant.isActive ? "active" : "inactive",
                    verified: merchant.isVerified,
                },
            }));

            return {
                merchants: merchantsWithStats,
                total,
                pages: Math.ceil(total / limit),
            };
        } catch (error) {
            logger.error("Error fetching all merchants:", error);
            throw error;
        }
    }

    async updateMerchantStatus(
        merchantId: string,
        status: string,
        reason?: string
    ): Promise<IMerchant> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
            }

            // Update status
            switch (status) {
                case "active":
                    merchant.isActive = true;
                    merchant.isVerified = true;
                    break;
                case "inactive":
                    merchant.isActive = false;
                    break;
                case "suspended":
                    merchant.isActive = false;
                    merchant.isVerified = false;
                    break;
                case "pending":
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
                    isVerified: !merchant.isVerified,
                },
            });

            await merchant.save();

            logger.info("Merchant status updated by admin", {
                merchantId,
                newStatus: status,
                reason,
            });

            return merchant;
        } catch (error) {
            logger.error("Error updating merchant status:", error);
            throw error;
        }
    }

    async updateMerchantLimits(
        merchantId: string,
        limits: {
            dailyLimit?: number;
            monthlyLimit?: number;
            commission?: number;
        }
    ): Promise<IMerchant> {
        try {
            const merchant = await Merchant.findOne({ merchantId });
            if (!merchant) {
                throw new Error("Merchant not found");
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
                timestamp: new Date(),
            });

            await merchant.save();

            logger.info("Merchant limits updated by admin", {
                merchantId,
                limits,
            });

            return merchant;
        } catch (error) {
            logger.error("Error updating merchant limits:", error);
            throw error;
        }
    }
}

export const merchantService = new MerchantService();
