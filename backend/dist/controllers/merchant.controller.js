"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantController = exports.MerchantController = void 0;
const merchant_service_1 = require("../services/merchant.service");
const logger_1 = __importDefault(require("../utils/logger"));
class MerchantController {
    async getPublicMerchantInfo(req, res, next) {
        try {
            const { merchantId } = req.params;
            const merchantInfo = await merchant_service_1.merchantService.getPublicMerchantInfo(merchantId);
            if (!merchantInfo) {
                return res.status(404).json({
                    success: false,
                    error: "Merchant not found",
                });
            }
            return res.json({
                success: true,
                data: merchantInfo,
            });
        }
        catch (error) {
            logger_1.default.error("Get public merchant info error:", error);
            next(error);
        }
    }
    async registerMerchant(req, res, next) {
        try {
            const { merchantName, businessType, email, phoneNumber, address, bankAccount, walletAddress, webhookUrl, settlementPeriod, } = req.body;
            // Validate required fields
            if (!merchantName ||
                !businessType ||
                !email ||
                !phoneNumber ||
                !address ||
                !walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: "Missing required fields: merchantName, businessType, email, phoneNumber, address, walletAddress",
                });
            }
            // Validate address structure
            if (!address.street ||
                !address.city ||
                !address.state ||
                !address.country ||
                !address.postalCode) {
                return res.status(400).json({
                    success: false,
                    error: "Address must include street, city, state, country, and postalCode",
                });
            }
            // Get user ID from authenticated user (if user is registering as merchant)
            const userId = req.user?.id; // Assuming JWT auth middleware adds user to request
            const registrationData = {
                merchantName,
                businessType,
                email,
                phoneNumber,
                address,
                bankAccount,
                walletAddress,
                webhookUrl,
                settlementPeriod: settlementPeriod || "daily",
            };
            const result = await merchant_service_1.merchantService.registerMerchant(registrationData, userId);
            logger_1.default.info("Merchant registration successful", {
                merchantId: result.merchant.merchantId,
                email: result.merchant.email,
                userId: userId || "standalone",
            });
            return res.status(201).json({
                success: true,
                message: "Merchant registered successfully",
                data: {
                    merchantId: result.merchant.merchantId,
                    merchantName: result.merchant.merchantName,
                    email: result.merchant.email,
                    isActive: result.merchant.isActive,
                    isVerified: result.merchant.isVerified,
                    commission: result.merchant.commission,
                    settlementPeriod: result.merchant.settlementPeriod,
                    nextSettlementDate: result.merchant.nextSettlementDate,
                    apiKeys: {
                        publicKey: result.apiKeys.publicKey,
                        secretKey: result.apiKeys.secretKey,
                        webhookSecret: result.apiKeys.webhookSecret,
                    },
                    createdAt: result.merchant.createdAt,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Merchant registration error:", error);
            if (error instanceof Error &&
                error.message.includes("already exists")) {
                return res.status(409).json({
                    success: false,
                    error: error.message,
                });
            }
            if (error instanceof Error &&
                error.message.includes("Invalid wallet address")) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
    async getMerchantProfile(req, res, next) {
        try {
            // Get merchant ID from authenticated user or API key
            const merchantId = req.merchant?.merchantId;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const merchant = await merchant_service_1.merchantService.getMerchantById(merchantId);
            if (!merchant) {
                return res.status(404).json({
                    success: false,
                    error: "Merchant not found",
                });
            }
            return res.json({
                success: true,
                data: {
                    merchantId: merchant.merchantId,
                    merchantName: merchant.merchantName,
                    businessType: merchant.businessType,
                    email: merchant.email,
                    phoneNumber: merchant.phoneNumber,
                    address: merchant.address,
                    bankAccount: merchant.bankAccount,
                    walletAddress: merchant.walletAddress,
                    webhookUrl: merchant.webhookUrl,
                    isActive: merchant.isActive,
                    isVerified: merchant.isVerified,
                    commission: merchant.commission,
                    settlementPeriod: merchant.settlementPeriod,
                    nextSettlementDate: merchant.nextSettlementDate,
                    totalTransactions: merchant.totalTransactions,
                    totalVolume: merchant.totalVolume,
                    createdAt: merchant.createdAt,
                    updatedAt: merchant.updatedAt,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Get merchant profile error:", error);
            next(error);
        }
    }
    async updateMerchantProfile(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const { merchantName, phoneNumber, address, bankAccount, webhookUrl, settlementPeriod, } = req.body;
            const updateData = {};
            if (merchantName)
                updateData.merchantName = merchantName;
            if (phoneNumber)
                updateData.phoneNumber = phoneNumber;
            if (address)
                updateData.address = address;
            if (bankAccount)
                updateData.bankAccount = bankAccount;
            if (webhookUrl !== undefined)
                updateData.webhookUrl = webhookUrl;
            if (settlementPeriod)
                updateData.settlementPeriod = settlementPeriod;
            const updatedMerchant = await merchant_service_1.merchantService.updateMerchantProfile(merchantId, updateData);
            return res.json({
                success: true,
                message: "Merchant profile updated successfully",
                data: {
                    merchantId: updatedMerchant.merchantId,
                    merchantName: updatedMerchant.merchantName,
                    phoneNumber: updatedMerchant.phoneNumber,
                    address: updatedMerchant.address,
                    bankAccount: updatedMerchant.bankAccount,
                    webhookUrl: updatedMerchant.webhookUrl,
                    settlementPeriod: updatedMerchant.settlementPeriod,
                    nextSettlementDate: updatedMerchant.nextSettlementDate,
                    updatedAt: updatedMerchant.updatedAt,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Update merchant profile error:", error);
            if (error instanceof Error &&
                error.message === "Merchant not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
    async getMerchantPayments(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const { page = 1, limit = 20, status } = req.query;
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 20;
            if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid pagination parameters. Page must be >= 1, limit must be 1-100",
                });
            }
            const result = await merchant_service_1.merchantService.getMerchantPayments(merchantId, pageNum, limitNum, status);
            return res.json({
                success: true,
                data: {
                    payments: result.payments,
                    pagination: {
                        current: pageNum,
                        total: result.pages,
                        count: result.total,
                        limit: limitNum,
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error("Get merchant payments error:", error);
            if (error instanceof Error &&
                error.message === "Merchant not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
    async getMerchantPaymentStats(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const stats = await merchant_service_1.merchantService.getMerchantPaymentStats(merchantId);
            return res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.default.error("Get merchant payment stats error:", error);
            if (error instanceof Error &&
                error.message === "Merchant not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
    async refundPayment(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            const { paymentId } = req.params;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const { amount, reason } = req.body;
            const result = await merchant_service_1.merchantService.refundPayment(merchantId, paymentId, {
                amount,
                reason,
            });
            return res.json({
                success: true,
                message: "Payment refunded successfully",
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error("Refund payment error:", error);
            if (error instanceof Error) {
                if (error.message.includes("not found")) {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message.includes("Cannot refund") ||
                    error.message.includes("already refunded")) {
                    return res.status(400).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message.includes("not authorized")) {
                    return res.status(403).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            next(error);
        }
    }
    async getMerchantSettings(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const settings = await merchant_service_1.merchantService.getMerchantSettings(merchantId);
            return res.json({
                success: true,
                data: settings,
            });
        }
        catch (error) {
            logger_1.default.error("Get merchant settings error:", error);
            if (error instanceof Error &&
                error.message === "Merchant not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
    async updateMerchantSettings(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const { notifications, paymentMethods, currency, autoSettlement, settlementPeriod, webhookUrl, apiCallbackUrl, } = req.body;
            const updatedSettings = await merchant_service_1.merchantService.updateMerchantSettings(merchantId, {
                notifications,
                paymentMethods,
                currency,
                autoSettlement,
                settlementPeriod,
                webhookUrl,
                apiCallbackUrl,
            });
            return res.json({
                success: true,
                message: "Merchant settings updated successfully",
                data: updatedSettings,
            });
        }
        catch (error) {
            logger_1.default.error("Update merchant settings error:", error);
            if (error instanceof Error &&
                error.message === "Merchant not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
    async getWebhooks(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const webhooks = await merchant_service_1.merchantService.getWebhooks(merchantId);
            return res.json({
                success: true,
                data: webhooks,
            });
        }
        catch (error) {
            logger_1.default.error("Get webhooks error:", error);
            if (error instanceof Error &&
                error.message === "Merchant not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
    async createWebhook(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const { url, events, description } = req.body;
            if (!url ||
                !events ||
                !Array.isArray(events) ||
                events.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "URL and events array are required",
                });
            }
            const webhook = await merchant_service_1.merchantService.createWebhook(merchantId, {
                url,
                events,
                description,
            });
            return res.status(201).json({
                success: true,
                message: "Webhook created successfully",
                data: webhook,
            });
        }
        catch (error) {
            logger_1.default.error("Create webhook error:", error);
            if (error instanceof Error) {
                if (error.message === "Merchant not found") {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message.includes("already exists") ||
                    error.message.includes("duplicate")) {
                    return res.status(409).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            next(error);
        }
    }
    async updateWebhook(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            const { webhookId } = req.params;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const { url, events, description, isActive } = req.body;
            const updatedWebhook = await merchant_service_1.merchantService.updateWebhook(merchantId, webhookId, {
                url,
                events,
                description,
                isActive,
            });
            return res.json({
                success: true,
                message: "Webhook updated successfully",
                data: updatedWebhook,
            });
        }
        catch (error) {
            logger_1.default.error("Update webhook error:", error);
            if (error instanceof Error) {
                if (error.message.includes("not found")) {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message.includes("not authorized")) {
                    return res.status(403).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            next(error);
        }
    }
    async deleteWebhook(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            const { webhookId } = req.params;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            await merchant_service_1.merchantService.deleteWebhook(merchantId, webhookId);
            return res.json({
                success: true,
                message: "Webhook deleted successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Delete webhook error:", error);
            if (error instanceof Error) {
                if (error.message.includes("not found")) {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message.includes("not authorized")) {
                    return res.status(403).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            next(error);
        }
    }
    async getApiKeys(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const apiKeys = await merchant_service_1.merchantService.getApiKeys(merchantId);
            return res.json({
                success: true,
                data: apiKeys,
            });
        }
        catch (error) {
            logger_1.default.error("Get API keys error:", error);
            if (error instanceof Error &&
                error.message === "Merchant not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
    async createApiKey(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const { name, permissions, rateLimit, ipWhitelist, expiresIn } = req.body;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: "API key name is required",
                });
            }
            const apiKeyResult = await merchant_service_1.merchantService.createApiKey(merchantId, {
                name,
                permissions,
                rateLimit,
                ipWhitelist,
                expiresIn,
            });
            return res.status(201).json({
                success: true,
                message: "API key created successfully",
                data: {
                    keyId: apiKeyResult.keyId,
                    name: apiKeyResult.name,
                    publicKey: apiKeyResult.publicKey,
                    secretKey: apiKeyResult.secretKey, // Only returned once
                    permissions: apiKeyResult.permissions,
                    rateLimit: apiKeyResult.rateLimit,
                    ipWhitelist: apiKeyResult.ipWhitelist,
                    expiresAt: apiKeyResult.expiresAt,
                    createdAt: apiKeyResult.createdAt,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Create API key error:", error);
            if (error instanceof Error) {
                if (error.message === "Merchant not found") {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message.includes("limit exceeded")) {
                    return res.status(429).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            next(error);
        }
    }
    async deleteApiKey(req, res, next) {
        try {
            const merchantId = req.merchant?.merchantId;
            const { keyId } = req.params;
            if (!merchantId) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            await merchant_service_1.merchantService.deleteApiKey(merchantId, keyId);
            return res.json({
                success: true,
                message: "API key deleted successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Delete API key error:", error);
            if (error instanceof Error) {
                if (error.message.includes("not found")) {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message.includes("not authorized")) {
                    return res.status(403).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            next(error);
        }
    }
    async getAllMerchants(req, res, next) {
        try {
            // Admin-only endpoint - should be protected by admin auth middleware
            const { page = 1, limit = 20, status, search, sortBy = "createdAt", } = req.query;
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 20;
            if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid pagination parameters. Page must be >= 1, limit must be 1-100",
                });
            }
            const result = await merchant_service_1.merchantService.getAllMerchants({
                page: pageNum,
                limit: limitNum,
                status: status,
                search: search,
                sortBy: sortBy,
            });
            return res.json({
                success: true,
                data: {
                    merchants: result.merchants,
                    pagination: {
                        current: pageNum,
                        total: result.pages,
                        count: result.total,
                        limit: limitNum,
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error("Get all merchants error:", error);
            next(error);
        }
    }
    async updateMerchantStatus(req, res, next) {
        try {
            const { merchantId } = req.params;
            const { status, reason } = req.body;
            if (!status) {
                return res.status(400).json({
                    success: false,
                    error: "Status is required",
                });
            }
            const validStatuses = [
                "active",
                "inactive",
                "suspended",
                "pending",
            ];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
                });
            }
            const updatedMerchant = await merchant_service_1.merchantService.updateMerchantStatus(merchantId, status, reason);
            return res.json({
                success: true,
                message: `Merchant status updated to ${status}`,
                data: {
                    merchantId: updatedMerchant.merchantId,
                    merchantName: updatedMerchant.merchantName,
                    isActive: updatedMerchant.isActive,
                    isVerified: updatedMerchant.isVerified,
                    updatedAt: updatedMerchant.updatedAt,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Update merchant status error:", error);
            if (error instanceof Error &&
                error.message === "Merchant not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
    async updateMerchantLimits(req, res, next) {
        try {
            const { merchantId } = req.params;
            const { dailyLimit, monthlyLimit, commission } = req.body;
            if (dailyLimit !== undefined &&
                (dailyLimit < 0 || dailyLimit > 1000000)) {
                return res.status(400).json({
                    success: false,
                    error: "Daily limit must be between 0 and 1,000,000",
                });
            }
            if (monthlyLimit !== undefined &&
                (monthlyLimit < 0 || monthlyLimit > 10000000)) {
                return res.status(400).json({
                    success: false,
                    error: "Monthly limit must be between 0 and 10,000,000",
                });
            }
            if (commission !== undefined &&
                (commission < 0 || commission > 10)) {
                return res.status(400).json({
                    success: false,
                    error: "Commission must be between 0 and 10 percent",
                });
            }
            const updatedMerchant = await merchant_service_1.merchantService.updateMerchantLimits(merchantId, {
                dailyLimit,
                monthlyLimit,
                commission,
            });
            return res.json({
                success: true,
                message: "Merchant limits updated successfully",
                data: {
                    merchantId: updatedMerchant.merchantId,
                    merchantName: updatedMerchant.merchantName,
                    commission: updatedMerchant.commission,
                    limits: {
                        dailyLimit,
                        monthlyLimit,
                    },
                    updatedAt: updatedMerchant.updatedAt,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Update merchant limits error:", error);
            if (error instanceof Error &&
                error.message === "Merchant not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
    // Payment Request methods (for QR code generation)
    async createPaymentRequest(req, res, next) {
        try {
            const { amount, description } = req.body;
            if (!req.merchant) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const merchant = req.merchant.merchant;
            // Import Transaction model here to avoid circular deps
            const { Transaction } = require('../models/transaction.model');
            // Create a request record using Transaction model
            const request = await Transaction.create({
                type: "payment",
                amount,
                currency: "SUI",
                status: "requested",
                merchantId: merchant._id,
                merchantName: merchant.merchantName,
                metadata: {
                    request: true,
                    description,
                    createdAt: new Date(),
                },
            });
            return res.status(201).json({
                success: true,
                message: "Merchant payment request created",
                request: {
                    id: request._id,
                    amount: request.amount,
                    status: request.status,
                    qrPayload: {
                        requestId: request._id,
                        amount: request.amount,
                        merchantId: merchant.merchantId,
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error("Create payment request error:", error);
            next(error);
        }
    }
    async getPaymentRequest(req, res, next) {
        try {
            const { id } = req.params;
            if (!req.merchant) {
                return res.status(401).json({
                    success: false,
                    error: "Merchant authentication required",
                });
            }
            const { Transaction } = require('../models/transaction.model');
            const request = await Transaction.findById(id);
            if (!request) {
                return res.status(404).json({
                    success: false,
                    error: "Request not found",
                });
            }
            return res.json({
                success: true,
                request: {
                    id: request._id,
                    amount: request.amount,
                    status: request.status,
                    merchantName: request.merchantName,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Get payment request error:", error);
            next(error);
        }
    }
}
exports.MerchantController = MerchantController;
exports.merchantController = new MerchantController();
//# sourceMappingURL=merchant.controller.js.map