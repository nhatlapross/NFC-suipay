import mongoose, { Document } from 'mongoose';
export interface ICard extends Document {
    cardUuid: string;
    userId: mongoose.Types.ObjectId;
    cardType: 'standard' | 'premium' | 'corporate' | 'virtual' | 'physical' | 'test';
    cardNumber: string;
    isActive: boolean;
    isPrimary: boolean;
    issueDate: Date;
    expiryDate: Date;
    lastUsed?: Date;
    usageCount: number;
    dailySpent: number;
    monthlySpent: number;
    dailyLimit: number;
    monthlyLimit: number;
    singleTransactionLimit: number;
    lastResetDate: Date;
    blockedAt?: Date;
    blockedReason?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    isExpired: boolean;
}
export declare const Card: mongoose.Model<ICard, {}, {}, {}, mongoose.Document<unknown, {}, ICard, {}, {}> & ICard & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Card.model.d.ts.map