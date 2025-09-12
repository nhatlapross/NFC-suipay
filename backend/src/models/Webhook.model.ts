import mongoose, { Document, Schema } from 'mongoose';

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
  retryIntervals: number[]; // in seconds
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const webhookSchema = new Schema<IWebhook>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'URL must be a valid HTTP/HTTPS URL'
      }
    },
    events: {
      type: [String],
      required: true,
      enum: [
        'payment.created',
        'payment.processing', 
        'payment.completed',
        'payment.failed',
        'payment.cancelled',
        'refund.created',
        'refund.completed',
        'refund.failed',
        'settlement.created',
        'settlement.completed',
        'merchant.verified',
        'merchant.suspended'
      ],
      validate: {
        validator: function(v: string[]) {
          return v && v.length > 0;
        },
        message: 'At least one event type must be specified'
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    secretKey: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxlength: 255,
    },
    lastDelivery: {
      type: Date,
    },
    lastDeliveryStatus: {
      type: String,
      enum: ['success', 'failed'],
    },
    failureCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxFailures: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },
    retryIntervals: {
      type: [Number],
      default: [30, 60, 300, 600, 1800], // 30s, 1m, 5m, 10m, 30m
    },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
webhookSchema.index({ merchantId: 1, isActive: 1 });
webhookSchema.index({ 'events': 1 });

export const Webhook = mongoose.model<IWebhook>('Webhook', webhookSchema);