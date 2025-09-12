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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const cardSchema = new mongoose_1.Schema({
    cardUuid: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    cardType: {
        type: String,
        enum: ['standard', 'premium', 'corporate', 'virtual', 'physical', 'test'],
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
    dailyLimit: {
        type: Number,
        default: 2000000, // 2M VND equivalent (about 2 SUI)
    },
    monthlyLimit: {
        type: Number,
        default: 50000000, // 50M VND equivalent (about 50 SUI)
    },
    singleTransactionLimit: {
        type: Number,
        default: 500000, // 500K VND equivalent (about 0.5 SUI)
    },
    lastResetDate: {
        type: Date,
        default: Date.now,
    },
    blockedAt: Date,
    blockedReason: String,
    metadata: mongoose_1.Schema.Types.Mixed,
}, {
    timestamps: true,
});
// Compound index for efficient queries
cardSchema.index({ userId: 1, isActive: 1 });
cardSchema.index({ expiryDate: 1, isActive: 1 });
// Check if card is expired
cardSchema.virtual('isExpired').get(function () {
    return this.expiryDate < new Date();
});
// Reset daily/monthly spending
cardSchema.methods.resetSpending = function (type) {
    if (type === 'daily') {
        this.dailySpent = 0;
    }
    else {
        this.monthlySpent = 0;
    }
    this.lastResetDate = new Date();
    return this.save();
};
exports.Card = mongoose_1.default.model('Card', cardSchema);
//# sourceMappingURL=Card.model.js.map