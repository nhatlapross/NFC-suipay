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
exports.Webhook = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const webhookSchema = new mongoose_1.Schema({
    merchantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true,
        index: true,
    },
    url: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
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
            validator: function (v) {
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
    metadata: mongoose_1.Schema.Types.Mixed,
}, {
    timestamps: true,
});
// Indexes
webhookSchema.index({ merchantId: 1, isActive: 1 });
webhookSchema.index({ 'events': 1 });
exports.Webhook = mongoose_1.default.model('Webhook', webhookSchema);
//# sourceMappingURL=Webhook.model.js.map