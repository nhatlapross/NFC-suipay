import { IMerchant } from "../models/Merchant.model";
import { IWebhook } from "../models/Webhook.model";
import { IApiKey } from "../models/ApiKey.model";
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
export declare class MerchantService {
    private generateMerchantId;
    private generateApiKeys;
    private validateWalletAddress;
    private calculateNextSettlementDate;
    registerMerchant(data: MerchantRegistrationData, userId: string): Promise<{
        merchant: IMerchant;
        apiKeys: MerchantApiKeys;
    }>;
    getMerchantByPublicKey(publicKey: string): Promise<IMerchant | null>;
    getMerchantById(merchantId: string): Promise<IMerchant | null>;
    updateMerchantProfile(merchantId: string, updateData: Partial<MerchantRegistrationData>): Promise<IMerchant>;
    getMerchantPayments(merchantId: string, page?: number, limit?: number, status?: string): Promise<{
        payments: any[];
        total: number;
        pages: number;
    }>;
    getMerchantPaymentStats(merchantId: string): Promise<any>;
    getPublicMerchantInfo(merchantId: string): Promise<{
        merchantId: string;
        merchantName: string;
        businessType: string;
        isActive: boolean;
        isVerified: boolean;
    } | null>;
    refundPayment(merchantId: string, paymentId: string, refundData: {
        amount?: number;
        reason?: string;
    }): Promise<any>;
    getMerchantSettings(merchantId: string): Promise<any>;
    updateMerchantSettings(merchantId: string, settingsUpdate: any): Promise<any>;
    getWebhooks(merchantId: string): Promise<IWebhook[]>;
    createWebhook(merchantId: string, webhookData: {
        url: string;
        events: string[];
        description?: string;
    }): Promise<IWebhook>;
    updateWebhook(merchantId: string, webhookId: string, updateData: {
        url?: string;
        events?: string[];
        description?: string;
        isActive?: boolean;
    }): Promise<IWebhook>;
    deleteWebhook(merchantId: string, webhookId: string): Promise<void>;
    getApiKeys(merchantId: string): Promise<any[]>;
    createApiKey(merchantId: string, keyData: {
        name: string;
        permissions?: string[];
        rateLimit?: {
            requestsPerMinute?: number;
            requestsPerHour?: number;
            requestsPerDay?: number;
        };
        ipWhitelist?: string[];
        expiresIn?: number;
    }): Promise<{
        keyId: string;
        name: string;
        publicKey: string;
        secretKey: string;
        permissions: string[];
        rateLimit?: any;
        ipWhitelist?: string[];
        expiresAt?: Date;
        createdAt: Date;
    }>;
    deleteApiKey(merchantId: string, keyId: string): Promise<void>;
    validateApiKey(publicKey: string, secretKey: string): Promise<{
        isValid: boolean;
        merchant?: IMerchant;
        apiKey?: IApiKey;
        error?: string;
    }>;
    getAllMerchants(options: {
        page: number;
        limit: number;
        status?: string;
        search?: string;
        sortBy?: string;
    }): Promise<{
        merchants: any[];
        total: number;
        pages: number;
    }>;
    updateMerchantStatus(merchantId: string, status: string, reason?: string): Promise<IMerchant>;
    updateMerchantLimits(merchantId: string, limits: {
        dailyLimit?: number;
        monthlyLimit?: number;
        commission?: number;
    }): Promise<IMerchant>;
}
export declare const merchantService: MerchantService;
//# sourceMappingURL=merchant.service.d.ts.map