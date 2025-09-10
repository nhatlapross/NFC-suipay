import { ITransaction } from '../models/Transaction.model';
export declare class WebhookService {
    private readonly maxRetries;
    private readonly timeout;
    sendWebhook(merchantId: string, event: string, data: any, options?: {
        immediate?: boolean;
        retryCount?: number;
    }): Promise<void>;
    private deliverWebhook;
    private handleWebhookFailure;
    private calculateRetryDelay;
    private generateSignature;
    verifySignature(payload: string, signature: string, secret: string): boolean;
    sendPaymentWebhook(transaction: ITransaction, event: 'payment.created' | 'payment.processing' | 'payment.completed' | 'payment.failed'): Promise<void>;
    sendRefundWebhook(refundTransaction: ITransaction, originalTransaction: ITransaction): Promise<void>;
    testWebhook(webhookId: string): Promise<{
        success: boolean;
        response?: any;
        error?: string;
    }>;
}
export declare const webhookService: WebhookService;
//# sourceMappingURL=webhook.service.d.ts.map