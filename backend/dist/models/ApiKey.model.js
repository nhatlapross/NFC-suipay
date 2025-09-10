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
exports.ApiKey = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const apiKeySchema = new mongoose_1.Schema({
    merchantId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: function (ips) {
                const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
                return ips.every(ip => ipRegex.test(ip));
            },
            message: 'Invalid IP address format'
        }
    },
    expiresAt: {
        type: Date,
    },
    metadata: mongoose_1.Schema.Types.Mixed,
}, {
    timestamps: true,
});
// Indexes
apiKeySchema.index({ merchantId: 1, isActive: 1 });
apiKeySchema.index({ publicKey: 1 });
apiKeySchema.index({ expiresAt: 1 });
// TTL index for expired keys
apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.ApiKey = mongoose_1.default.model('ApiKey', apiKeySchema);
//# sourceMappingURL=ApiKey.model.js.map