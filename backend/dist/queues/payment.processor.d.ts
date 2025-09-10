import { Job } from 'bull';
interface PaymentJobData {
    transactionId: string;
    paymentData: {
        cardUuid: string;
        amount: number;
        merchantId: string;
        merchantWalletAddress: string;
        terminalId: string;
        userId: string;
        userWalletAddress: string;
        gasFee: number;
        totalAmount: number;
    };
}
export declare function processNFCPaymentJob(job: Job<PaymentJobData>): Promise<{
    success: boolean;
    transactionId: string;
    txHash: string;
    processingTime: number;
}>;
export default processNFCPaymentJob;
//# sourceMappingURL=payment.processor.d.ts.map