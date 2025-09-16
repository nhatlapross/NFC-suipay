import { ITransaction } from '../models/Transaction.model';
export declare class PaymentService {
    private get suiClient();
    processPayment(cardUuid: string, amount: number, merchantId: string, metadata?: any): Promise<ITransaction>;
    private validateCard;
    private checkTransactionLimits;
    private executeBlockchainTransaction;
    private getUserMyCoinObjects;
    getMyCoinBalance(address: string): Promise<number>;
    private updateCardUsage;
    private updateMerchantStats;
    private sendWebhook;
    getTransactionHistory(userId: string, page?: number, limit?: number): Promise<{
        transactions: ITransaction[];
        total: number;
        pages: number;
    }>;
    getTransactionById(txId: string): Promise<ITransaction | null>;
    refundTransaction(txId: string, _reason?: string): Promise<ITransaction>;
    getPaymentStats(userId: string, period: string, cardUuid?: string): Promise<any>;
    cancelTransaction(transactionId: string, userId: string, reason?: string): Promise<ITransaction>;
    retryTransaction(transactionId: string, userId: string): Promise<{
        originalTransaction: ITransaction;
        newTransaction: ITransaction;
    }>;
}
//# sourceMappingURL=payment.service.d.ts.map