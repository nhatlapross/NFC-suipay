import mongoose, { Document } from "mongoose";
export interface IMerchant extends Document {
    userId: mongoose.Types.ObjectId;
    merchantId: string;
    merchantName: string;
    businessType: string;
    walletAddress: string;
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
    apiKeys: {
        publicKey: string;
        secretKey: string;
        webhookSecret: string;
    };
    webhookUrl?: string;
    isActive: boolean;
    isVerified: boolean;
    commission: number;
    settlementPeriod: "daily" | "weekly" | "monthly";
    nextSettlementDate: Date;
    totalTransactions: number;
    totalVolume: number;
    metadata?: Record<string, any>;
    terminals?: Array<{
        terminalId: string;
        terminalName: string;
        location: string;
        terminalType: "MOBILE" | "FIXED" | "KIOSK" | "ONLINE";
        features: string[];
        isActive: boolean;
        settings: {
            maxAmount: number;
            requireSignature: boolean;
            requirePINAmount: number;
            timeout: number;
        };
        createdAt: Date;
        lastUsed?: Date;
        updatedAt?: Date;
        deactivatedAt?: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Merchant: mongoose.Model<IMerchant, {}, {}, {}, mongoose.Document<unknown, {}, IMerchant, {}, {}> & IMerchant & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Merchant.model.d.ts.map