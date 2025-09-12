import crypto from 'crypto';
import axios from 'axios';
import { Webhook, IWebhook } from '../models/Webhook.model';
import { Merchant } from '../models/Merchant.model';
import { ITransaction } from '../models/Transaction.model';
import logger from '../utils/logger';

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  merchantId: string;
  id: string;
}

export class WebhookService {
  private readonly maxRetries = 5;
  private readonly timeout = 30000; // 30 seconds

  async sendWebhook(
    merchantId: string,
    event: string,
    data: any,
    options: {
      immediate?: boolean;
      retryCount?: number;
    } = {}
  ): Promise<void> {
    try {
      const merchant = await Merchant.findOne({ merchantId });
      if (!merchant) {
        logger.error('Merchant not found for webhook', { merchantId });
        return;
      }

      // Find active webhooks for this merchant and event
      const webhooks = await Webhook.find({
        merchantId: merchant._id,
        isActive: true,
        events: event,
        failureCount: { $lt: 10 } // Don't send to consistently failing webhooks
      });

      if (webhooks.length === 0) {
        logger.debug('No active webhooks found for event', { merchantId, event });
        return;
      }

      // Send to all matching webhooks
      for (const webhook of webhooks) {
        await this.deliverWebhook(webhook, event, data, options);
      }

    } catch (error) {
      logger.error('Error sending webhooks:', error);
    }
  }

  private async deliverWebhook(
    webhook: IWebhook,
    event: string,
    data: any,
    options: {
      immediate?: boolean;
      retryCount?: number;
    } = {}
  ): Promise<void> {
    const retryCount = options.retryCount || 0;
    
    try {
      // Create webhook payload
      const payload: WebhookPayload = {
        id: crypto.randomUUID(),
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

      logger.info('Sending webhook', {
        webhookId: webhook._id,
        url: webhook.url,
        event,
        retryCount
      });

      // Send webhook
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: this.timeout,
        validateStatus: (status) => status >= 200 && status < 300
      });

      // Success - update webhook stats
      webhook.lastDelivery = new Date();
      webhook.lastDeliveryStatus = 'success';
      webhook.failureCount = 0; // Reset failure count on success
      await webhook.save();

      logger.info('Webhook delivered successfully', {
        webhookId: webhook._id,
        url: webhook.url,
        event,
        statusCode: response.status,
        retryCount
      });

    } catch (error) {
      await this.handleWebhookFailure(webhook, event, data, error, retryCount);
    }
  }

  private async handleWebhookFailure(
    webhook: IWebhook,
    event: string,
    data: any,
    error: any,
    retryCount: number
  ): Promise<void> {
    // Update failure stats
    webhook.lastDelivery = new Date();
    webhook.lastDeliveryStatus = 'failed';
    webhook.failureCount += 1;

    const errorMessage = error.response?.data || error.message || 'Unknown error';
    const statusCode = error.response?.status;

    logger.warn('Webhook delivery failed', {
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
      logger.error('Webhook disabled due to excessive failures', {
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
      
      logger.info('Scheduling webhook retry', {
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

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 30s, 1m, 5m, 10m, 30m
    const delays = [30, 60, 300, 600, 1800]; // in seconds
    const delaySeconds = delays[Math.min(retryCount, delays.length - 1)];
    return delaySeconds * 1000; // convert to milliseconds
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // Verify webhook signature for incoming webhook confirmations
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    
    // Use crypto.timingSafeEqual to prevent timing attacks
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  }

  // Helper method to send payment webhooks
  async sendPaymentWebhook(
    transaction: ITransaction,
    event: 'payment.created' | 'payment.processing' | 'payment.completed' | 'payment.failed'
  ): Promise<void> {
    if (!transaction.merchantId) {
      return;
    }

    const merchant = await Merchant.findById(transaction.merchantId);
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
  async sendRefundWebhook(
    refundTransaction: ITransaction,
    originalTransaction: ITransaction
  ): Promise<void> {
    if (!refundTransaction.merchantId) {
      return;
    }

    const merchant = await Merchant.findById(refundTransaction.merchantId);
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
  async testWebhook(webhookId: string): Promise<{ success: boolean; response?: any; error?: string }> {
    try {
      const webhook = await Webhook.findById(webhookId).populate('merchantId');
      if (!webhook) {
        return { success: false, error: 'Webhook not found' };
      }

      const testPayload = {
        id: crypto.randomUUID(),
        event: 'webhook.test',
        data: {
          message: 'This is a test webhook',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        merchantId: webhook.merchantId.toString()
      };

      const signature = this.generateSignature(JSON.stringify(testPayload), webhook.secretKey);

      const response = await axios.post(webhook.url, testPayload, {
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

    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message || 'Unknown error'
      };
    }
  }
}

export const webhookService = new WebhookService();