import mongoose, { Document } from "mongoose";
export interface ITransaction extends Document {
    userId: mongoose.Types.ObjectId;
    cardId?: mongoose.Types.ObjectId;
    cardUuid?: string;
    txHash: string;
    type: "payment" | "topup" | "withdraw" | "refund";
    amount: number;
    currency: string;
    merchantUserId?: mongoose.Types.ObjectId;
    merchantId?: mongoose.Types.ObjectId;
    merchantName?: string;
    status: "pending" | "processing" | "completed" | "failed" | "cancelled";
    gasFee: number;
    totalAmount: number;
    fromAddress: string;
    toAddress: string;
    description?: string;
    metadata?: {
        location?: string;
        device?: string;
        ipAddress?: string;
        userAgent?: string;
        [key: string]: any;
    };
    failureReason?: string;
    refundedAt?: Date;
    refundTxHash?: string;
    refundAmount?: number;
    refundReason?: string;
    refundType?: string;
    originalTransactionId?: mongoose.Types.ObjectId;
    processingTime?: number;
    createdAt: Date;
    completedAt?: Date;
    updatedAt: Date;
}
export declare const Transaction: mongoose.Model<ITransaction, {}, {}, {}, mongoose.Document<unknown, {}, ITransaction, {}, {}> & ITransaction & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Transaction.model.d.ts.map