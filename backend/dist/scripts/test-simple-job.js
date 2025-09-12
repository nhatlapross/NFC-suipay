"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queue_config_1 = require("../config/queue.config");
// Simple test processor
queue_config_1.paymentQueue.process('test-job', async (job) => {
    console.log('🔄 Processing test job:', job.id);
    console.log('📋 Job data:', job.data);
    return { success: true, message: 'Test job completed' };
});
async function testSimpleJob() {
    try {
        console.log('Adding test job to queue...');
        const testJob = await queue_config_1.paymentQueue.add('test-job', {
            message: 'Hello from test job!',
            timestamp: new Date().toISOString(),
        });
        console.log('✅ Test job added:', testJob.id);
        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Check job status
        const job = await queue_config_1.paymentQueue.getJob(testJob.id);
        if (job) {
            console.log('📊 Job status:', await job.getState());
            if (job.returnvalue) {
                console.log('✅ Job result:', job.returnvalue);
            }
            if (job.failedReason) {
                console.log('❌ Job failed:', job.failedReason);
            }
        }
    }
    catch (error) {
        console.error('❌ Test error:', error);
    }
    finally {
        await queue_config_1.paymentQueue.close();
        process.exit(0);
    }
}
testSimpleJob();
//# sourceMappingURL=test-simple-job.js.map