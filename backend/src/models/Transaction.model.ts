import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  cardId?: mongoose.Types.ObjectId;
  cardUuid?: string;
  txHash: string;
  type: 'payment' | 'topup' | 'withdraw' | 'refund';
  amount: number;
  currency: string;
  merchantId?: mongoose.Types.ObjectId;
  merchantName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
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
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      index: true,
    },
    cardUuid: String,
    txHash: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['payment', 'topup', 'withdraw', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'SUI',
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      index: true,
    },
    merchantName: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    gasFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    fromAddress: {
      type: String,
      required: true,
      index: true,
    },
    toAddress: {
      type: String,
      required: true,
      index: true,
    },
    description: String,
    metadata: {
      location: String,
      device: String,
      ipAddress: String,
      userAgent: String,
    },
    failureReason: String,
    refundedAt: Date,
    refundTxHash: String,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
transactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
transactionSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });

// Virtual for transaction age
transactionSchema.virtual('age').get(function () {
  return Date.now() - this.createdAt.getTime();
});

// Pre-save hook to calculate total amount
transactionSchema.pre('save', function (next) {
  if (this.isModified('amount') || this.isModified('gasFee')) {
    this.totalAmount = this.amount + this.gasFee;
  }
  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);