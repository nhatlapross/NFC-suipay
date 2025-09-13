import mongoose, { Document, Schema } from "mongoose";

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
    createdAt: Date;
    updatedAt: Date;
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

const merchantSchema = new Schema<IMerchant>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
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
            enum: ["daily", "weekly", "monthly"],
            default: "daily",
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
    terminals: [{
      terminalId: { type: String, required: true },
      terminalName: { type: String, required: true },
      location: { type: String, default: "" },
      terminalType: {
        type: String,
        enum: ["MOBILE", "FIXED", "KIOSK", "ONLINE"],
        default: "FIXED"
      },
      features: [{ type: String }],
      isActive: { type: Boolean, default: true },
      settings: {
        maxAmount: { type: Number, default: 5000000 },
        requireSignature: { type: Boolean, default: false },
        requirePINAmount: { type: Number, default: 50000 },
        timeout: { type: Number, default: 300 }
      },
      createdAt: { type: Date, default: Date.now },
      lastUsed: Date,
      updatedAt: Date,
      deactivatedAt: Date
    }],
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
merchantSchema.index({ merchantName: "text", businessType: "text" });

export const Merchant = mongoose.model<IMerchant>("Merchant", merchantSchema);
