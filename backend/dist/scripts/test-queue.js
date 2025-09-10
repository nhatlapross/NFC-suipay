"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queue_config_1 = require("../config/queue.config");
async function testQueue() {
    try {
        console.log('Testing payment queue...');
        // Add a simple test job
        const testJob = await queue_config_1.paymentQueue.add('processNFCPayment', {
            transactionId: 'test-123',
            paymentData: {
                cardUuid: 'test-card',
                amount: 0.01,
                merchantId: 'test-merchant',
                merchantWalletAddress: '0xe92bfd25182a0562f126a364881502761c7d20739585234288728f449fc51bda',
                terminalId: 'test-terminal',
                userId: 'test-user',
                userWalletAddress: '0xf3ad909893af3343b34db08155f7f8073ee0321f00a4bdfe1cee961238ed5de2',
                gasFee: 0.001,
                totalAmount: 0.011,
            },
        });
        console.log('Test job created:', testJob.id);
        // Check queue status
        const waiting = await queue_config_1.paymentQueue.getWaiting();
        const active = await queue_config_1.paymentQueue.getActive();
        const completed = await queue_config_1.paymentQueue.getCompleted();
        const failed = await queue_config_1.paymentQueue.getFailed();
        console.log('Queue status:');
        console.log('- Waiting:', waiting.length);
        console.log('- Active:', active.length);
        console.log('- Completed:', completed.length);
        console.log('- Failed:', failed.length);
        // Check if there are any failed jobs
        if (failed.length > 0) {
            console.log('\nFailed jobs:');
            failed.slice(0, 3).forEach((job, index) => {
                console.log(`${index + 1}.`, {
                    id: job.id,
                    error: job.failedReason,
                    attempts: job.attemptsMade,
                    data: job.data?.transactionId
                });
            });
        }
        process.exit(0);
    }
    catch (error) {
        console.error('Queue test error:', error);
        process.exit(1);
    }
}
testQueue();
//# sourceMappingURL=test-queue.js.map