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
exports.Transaction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const transactionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    cardId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Card",
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
        enum: ["payment", "topup", "withdraw", "refund"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: "MY_COIN",
    },
    merchantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Merchant",
        index: true,
    },
    merchantName: String,
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "cancelled"],
        default: "pending",
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
    refundAmount: Number,
    refundReason: String,
    originalTransactionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Transaction",
    },
    completedAt: Date,
}, {
    timestamps: true,
});
// Compound indexes for efficient queries
transactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
transactionSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });
// Virtual for transaction age
transactionSchema.virtual("age").get(function () {
    return Date.now() - this.createdAt.getTime();
});
// Pre-save hook to calculate total amount
transactionSchema.pre("save", function (next) {
    if (this.isModified("amount") || this.isModified("gasFee")) {
        this.totalAmount = this.amount + this.gasFee;
    }
    next();
});
exports.Transaction = mongoose_1.default.model("Transaction", transactionSchema);
//# sourceMappingURL=Transaction.model.js.map