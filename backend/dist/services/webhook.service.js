"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookService = exports.WebhookService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const Webhook_model_1 = require("../models/Webhook.model");
const Merchant_model_1 = require("../models/Merchant.model");
const logger_1 = __importDefault(require("../utils/logger"));
class WebhookService {
    maxRetries = 5;
    timeout = 30000; // 30 seconds
    async sendWebhook(merchantId, event, data, options = {}) {
        try {
            const merchant = await Merchant_model_1.Merchant.findOne({ merchantId });
            if (!merchant) {
                logger_1.default.error('Merchant not found for webhook', { merchantId });
                return;
            }
            // Find active webhooks for this merchant and event
            const webhooks = await Webhook_model_1.Webhook.find({
                merchantId: merchant._id,
                isActive: true,
                events: event,
                failureCount: { $lt: 10 } // Don't send to consistently failing webhooks
            });
            if (webhooks.length === 0) {
                logger_1.default.debug('No active webhooks found for event', { merchantId, event });
                return;
            }
            // Send to all matching webhooks
            for (const webhook of webhooks) {
                await this.deliverWebhook(webhook, event, data, options);
            }
        }
        catch (error) {
            logger_1.default.error('Error sending webhooks:', error);
        }
    }
    async deliverWebhook(webhook, event, data, options = {}) {
        const retryCount = options.retryCount || 0;
        try {
            // Create webhook payload
            const payload = {
                id: crypto_1.default.randomUUID(),
                event,
                data,
                timestamp: new Date().toISOString(),
                merchantId: webhook.merchantId.toString()
            };
            // Generate signature
            const signature = this.generateSignature(JSON.stringify(payload), webhook.secretKey);
            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-Event': event,
                'X-Webhook-ID': payload.id,
                'X-Webhook-Timestamp': payload.timestamp,
                'User-Agent': 'NFC-Payment-Webhook/1.0'
            };
            logger_1.default.info('Sending webhook', {
                webhookId: webhook._id,
                url: webhook.url,
                event,
                retryCount
            });
            // Send webhook
            const response = await axios_1.default.post(webhook.url, payload, {
                headers,
                timeout: this.timeout,
                validateStatus: (status) => status >= 200 && status < 300
            });
            // Success - update webhook stats
            webhook.lastDelivery = new Date();
            webhook.lastDeliveryStatus = 'success';
            webhook.failureCount = 0; // Reset failure count on success
            await webhook.save();
            logger_1.default.info('Webhook delivered successfully', {
                webhookId: webhook._id,
                url: webhook.url,
                event,
                statusCode: response.status,
                retryCount
            });
        }
        catch (error) {
            await this.handleWebhookFailure(webhook, event, data, error, retryCount);
        }
    }
    async handleWebhookFailure(webhook, event, data, error, retryCount) {
        // Update failure stats
        webhook.lastDelivery = new Date();
        webhook.lastDeliveryStatus = 'failed';
        webhook.failureCount += 1;
        const errorMessage = error.response?.data || error.message || 'Unknown error';
        const statusCode = error.response?.status;
        logger_1.default.warn('Webhook delivery failed', {
            webhookId: webhook._id,
            url: webhook.url,
            event,
            error: errorMessage,
            statusCode,
            retryCount,
            failureCount: webhook.failureCount
        });
        // Disable webhook if too many failures
        if (webhook.failureCount >= webhook.maxFailures) {
            webhook.isActive = false;
            logger_1.default.error('Webhook disabled due to excessive failures', {
                webhookId: webhook._id,
                url: webhook.url,
                failureCount: webhook.failureCount,
                maxFailures: webhook.maxFailures
            });
        }
        await webhook.save();
        // Schedule retry if not exceeded max retries and webhook still active
        if (retryCount < this.maxRetries && webhook.isActive) {
            const retryDelay = this.calculateRetryDelay(retryCount);
            logger_1.default.info('Scheduling webhook retry', {
                webhookId: webhook._id,
                retryCount: retryCount + 1,
                retryDelay
            });
            setTimeout(() => {
                this.deliverWebhook(webhook, event, data, {
                    retryCount: retryCount + 1
                });
            }, retryDelay);
        }
    }
    calculateRetryDelay(retryCount) {
        // Exponential backoff: 30s, 1m, 5m, 10m, 30m
        const delays = [30, 60, 300, 600, 1800]; // in seconds
        const delaySeconds = delays[Math.min(retryCount, delays.length - 1)];
        return delaySeconds * 1000; // convert to milliseconds
    }
    generateSignature(payload, secret) {
        return crypto_1.default
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }
    // Verify webhook signature for incoming webhook confirmations
    verifySignature(payload, signature, secret) {
        const expectedSignature = this.generateSignature(payload, secret);
        // Use crypto.timingSafeEqual to prevent timing attacks
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        if (sigBuffer.length !== expectedBuffer.length) {
            return false;
        }
        return crypto_1.default.timingSafeEqual(sigBuffer, expectedBuffer);
    }
    // Helper method to send payment webhooks
    async sendPaymentWebhook(transaction, event) {
        if (!transaction.merchantId) {
            return;
        }
        const merchant = await Merchant_model_1.Merchant.findById(transaction.merchantId);
        if (!merchant) {
            return;
        }
        const webhookData = {
            transaction: {
                id: transaction._id,
                amount: transaction.amount,
                currency: transaction.currency,
                status: transaction.status,
                merchantId: merchant.merchantId,
                merchantName: merchant.merchantName,
                cardUuid: transaction.cardUuid,
                txHash: transaction.txHash,
                gasFee: transaction.gasFee,
                metadata: transaction.metadata,
                createdAt: transaction.createdAt,
                completedAt: transaction.completedAt,
                failureReason: transaction.failureReason
            },
            merchant: {
                id: merchant.merchantId,
                name: merchant.merchantName
            }
        };
        await this.sendWebhook(merchant.merchantId, event, webhookData);
    }
    // Helper method to send refund webhooks
    async sendRefundWebhook(refundTransaction, originalTransaction) {
        if (!refundTransaction.merchantId) {
            return;
        }
        const merchant = await Merchant_model_1.Merchant.findById(refundTransaction.merchantId);
        if (!merchant) {
            return;
        }
        const webhookData = {
            refund: {
                id: refundTransaction._id,
                amount: refundTransaction.amount,
                currency: refundTransaction.currency,
                status: refundTransaction.status,
                originalTransactionId: originalTransaction._id,
                reason: refundTransaction.metadata?.reason,
                createdAt: refundTransaction.createdAt
            },
            originalTransaction: {
                id: originalTransaction._id,
                amount: originalTransaction.amount,
                createdAt: originalTransaction.createdAt
            },
            merchant: {
                id: merchant.merchantId,
                name: merchant.merchantName
            }
        };
        await this.sendWebhook(merchant.merchantId, 'refund.created', webhookData);
    }
    // Test webhook endpoint
    async testWebhook(webhookId) {
        try {
            const webhook = await Webhook_model_1.Webhook.findById(webhookId).populate('merchantId');
            if (!webhook) {
                return { success: false, error: 'Webhook not found' };
            }
            const testPayload = {
                id: crypto_1.default.randomUUID(),
                event: 'webhook.test',
                data: {
                    message: 'This is a test webhook',
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                merchantId: webhook.merchantId.toString()
            };
            const signature = this.generateSignature(JSON.stringify(testPayload), webhook.secretKey);
            const response = await axios_1.default.post(webhook.url, testPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': 'webhook.test',
                    'X-Webhook-ID': testPayload.id,
                    'X-Webhook-Timestamp': testPayload.timestamp,
                    'User-Agent': 'NFC-Payment-Webhook/1.0'
                },
                timeout: this.timeout
            });
            return {
                success: true,
                response: {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message || 'Unknown error'
            };
        }
    }
}
exports.WebhookService = WebhookService;
exports.webhookService = new WebhookService();
//# sourceMappingURL=webhook.service.js.map