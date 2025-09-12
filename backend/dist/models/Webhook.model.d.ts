import mongoose, { Document } from 'mongoose';
export interface IWebhook extends Document {
    merchantId: mongoose.Types.ObjectId;
    url: string;
    events: string[];
    isActive: boolean;
    secretKey: string;
    description?: string;
    lastDelivery?: Date;
    lastDeliveryStatus?: 'success' | 'failed';
    failureCount: number;
    maxFailures: number;
    retryIntervals: number[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Webhook: mongoose.Model<IWebhook, {}, {}, {}, mongoose.Document<unknown, {}, IWebhook, {}, {}> & IWebhook & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Webhook.model.d.ts.map