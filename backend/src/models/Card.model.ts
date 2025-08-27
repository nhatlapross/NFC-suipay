import mongoose, { Document, Schema } from 'mongoose';

export interface ICard extends Document {
  cardUuid: string;
  userId: mongoose.Types.ObjectId;
  cardType: 'standard' | 'premium' | 'corporate';
  cardNumber: string;
  isActive: boolean;
  isPrimary: boolean;
  issueDate: Date;
  expiryDate: Date;
  lastUsed?: Date;
  usageCount: number;
  dailySpent: number;
  monthlySpent: number;
  lastResetDate: Date;
  blockedAt?: Date;
  blockedReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  // Virtual properties
  isExpired: boolean;
}

const cardSchema = new Schema<ICard>(
  {
    cardUuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cardType: {
      type: String,
      enum: ['standard', 'premium', 'corporate'],
      default: 'standard',
    },
    cardNumber: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
    lastUsed: Date,
    usageCount: {
      type: Number,
      default: 0,
    },
    dailySpent: {
      type: Number,
      default: 0,
    },
    monthlySpent: {
      type: Number,
      default: 0,
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
    blockedAt: Date,
    blockedReason: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
cardSchema.index({ userId: 1, isActive: 1 });
cardSchema.index({ expiryDate: 1, isActive: 1 });

// Check if card is expired
cardSchema.virtual('isExpired').get(function () {
  return this.expiryDate < new Date();
});

// Reset daily/monthly spending
cardSchema.methods.resetSpending = function (type: 'daily' | 'monthly') {
  if (type === 'daily') {
    this.dailySpent = 0;
  } else {
    this.monthlySpent = 0;
  }
  this.lastResetDate = new Date();
  return this.save();
};

export const Card = mongoose.model<ICard>('Card', cardSchema);