import mongoose, { Document, Schema } from 'mongoose';

export interface IMerchant extends Document {
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
  settlementPeriod: 'daily' | 'weekly' | 'monthly';
  nextSettlementDate: Date;
  totalTransactions: number;
  totalVolume: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const merchantSchema = new Schema<IMerchant>(
  {
    merchantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantName: {
      type: String,
      required: true,
    },
    businessType: {
      type: String,
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    bankAccount: {
      accountNumber: String,
      bankName: String,
      routingNumber: String,
    },
    apiKeys: {
      publicKey: {
        type: String,
        required: true,
      },
      secretKey: {
        type: String,
        required: true,
        select: false,
      },
      webhookSecret: {
        type: String,
        required: true,
        select: false,
      },
    },
    webhookUrl: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    commission: {
      type: Number,
      default: 2.5, // 2.5%
      min: 0,
      max: 100,
    },
    settlementPeriod: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily',
    },
    nextSettlementDate: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    totalTransactions: {
      type: Number,
      default: 0,
    },
    totalVolume: {
      type: Number,
      default: 0,
    },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Text search index
merchantSchema.index({ merchantName: 'text', businessType: 'text' });

export const Merchant = mongoose.model<IMerchant>('Merchant', merchantSchema);