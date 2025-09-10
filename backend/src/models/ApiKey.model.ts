import mongoose, { Document, Schema } from 'mongoose';

export interface IApiKey extends Document {
  merchantId: mongoose.Types.ObjectId;
  keyId: string;
  name: string;
  publicKey: string;
  secretKeyHash: string; // Hashed version of secret key
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

const apiKeySchema = new Schema<IApiKey>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    keyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 50,
    },
    publicKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    secretKeyHash: {
      type: String,
      required: true,
    },
    permissions: {
      type: [String],
      default: ['payments.create', 'payments.read'],
      enum: [
        'payments.create',
        'payments.read',
        'payments.refund',
        'webhooks.manage',
        'profile.read',
        'profile.update',
        'settings.read',
        'settings.update',
        'analytics.read'
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    rateLimit: {
      requestsPerMinute: {
        type: Number,
        default: 60,
        min: 1,
        max: 1000,
      },
      requestsPerHour: {
        type: Number,
        default: 1000,
        min: 1,
        max: 10000,
      },
      requestsPerDay: {
        type: Number,
        default: 10000,
        min: 1,
        max: 100000,
      },
    },
    ipWhitelist: {
      type: [String],
      validate: {
        validator: function(ips: string[]) {
          const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
          return ips.every(ip => ipRegex.test(ip));
        },
        message: 'Invalid IP address format'
      }
    },
    expiresAt: {
      type: Date,
    },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
apiKeySchema.index({ merchantId: 1, isActive: 1 });
apiKeySchema.index({ publicKey: 1 });
apiKeySchema.index({ expiresAt: 1 });

// TTL index for expired keys
apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', apiKeySchema);