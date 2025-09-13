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
exports.Merchant = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const merchantSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    metadata: mongoose_1.Schema.Types.Mixed,
}, {
    timestamps: true,
});
// Text search index
merchantSchema.index({ merchantName: "text", businessType: "text" });
exports.Merchant = mongoose_1.default.model("Merchant", merchantSchema);
//# sourceMappingURL=Merchant.model.js.map