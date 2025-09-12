"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
// Index for text search
userSchema.index({ fullName: 'text', email: 'text' });
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Compare password method
userSchema.methods.comparePassword = async function (password) {
    return bcryptjs_1.default.compare(password, this.password);
};
// Compare PIN method
userSchema.methods.comparePin = async function (pin) {
    if (!this.pinHash)
        return false;
    return bcryptjs_1.default.compare(pin, this.pinHash);
};
// Set PIN method
userSchema.methods.setPin = async function (pin) {
    const salt = await bcryptjs_1.default.genSalt(10);
    this.pinHash = await bcryptjs_1.default.hash(pin, salt);
};
// Check if account is locked
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockoutUntil && this.lockoutUntil > new Date());
});
exports.User = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.model.js.map