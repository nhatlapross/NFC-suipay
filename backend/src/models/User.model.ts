import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  phoneNumber: string;
  fullName: string;
  walletAddress?: string;
  encryptedPrivateKey?: string;
  role: 'user' | 'merchant' | 'admin';
  dailyLimit: number;
  monthlyLimit: number;
  status: 'active' | 'blocked' | 'suspended';
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDocuments?: string[];
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  pinHash?: string;
  lastLogin?: Date;
  loginAttempts: number;
  lockoutUntil?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  // Virtual properties
  isLocked: boolean;
  comparePassword(password: string): Promise<boolean>;
  comparePin?(pin: string): Promise<boolean>;
  setPin?(pin: string): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    encryptedPrivateKey: {
      type: String,
      select: false, // Don't return by default
    },
    role: {
      type: String,
      enum: ['user', 'merchant', 'admin'],
      default: 'user',
    },
    dailyLimit: {
      type: Number,
      default: 1000,
      min: 0,
    },
    monthlyLimit: {
      type: Number,
      default: 10000,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'suspended'],
      default: 'active',
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    kycDocuments: [String],
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    pinHash: {
      type: String,
      select: false, // Don't return by default for security
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: Date,
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for text search
userSchema.index({ fullName: 'text', email: 'text' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Compare PIN method
userSchema.methods.comparePin = async function (pin: string): Promise<boolean> {
  if (!this.pinHash) return false;
  return bcrypt.compare(pin, this.pinHash);
};

// Set PIN method
userSchema.methods.setPin = async function (pin: string): Promise<void> {
  const salt = await bcrypt.genSalt(10);
  this.pinHash = await bcrypt.hash(pin, salt);
};

// Check if account is locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockoutUntil && this.lockoutUntil > new Date());
});

export const User = mongoose.model<IUser>('User', userSchema);