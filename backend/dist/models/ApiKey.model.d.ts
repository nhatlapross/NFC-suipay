import mongoose, { Document } from 'mongoose';
export interface IApiKey extends Document {
    merchantId: mongoose.Types.ObjectId;
    keyId: string;
    name: string;
    publicKey: string;
    secretKeyHash: string;
    permissions: string[];
    isActive: boolean;
    lastUsed?: Date;
    usageCount: number;
    rateLimit?: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    };
    ipWhitelist?: string[];
    expiresAt?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ApiKey: mongoose.Model<IApiKey, {}, {}, {}, mongoose.Document<unknown, {}, IApiKey, {}, {}> & IApiKey & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ApiKey.model.d.ts.map