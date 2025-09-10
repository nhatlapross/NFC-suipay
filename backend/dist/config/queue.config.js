"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainQueue = exports.notificationQueue = exports.paymentQueue = void 0;
exports.checkQueueHealth = checkQueueHealth;
exports.closeQueues = closeQueues;
const bull_1 = __importDefault(require("bull"));
const logger_1 = __importDefault(require("../utils/logger"));
// Create Redis connection options for Bull
const redisOptions = {
    host: process.env.REDIS_CLOUD_HOST,
    port: parseInt(process.env.REDIS_CLOUD_PORT || '6379'),
    username: process.env.REDIS_CLOUD_USERNAME || 'default',
    password: process.env.REDIS_CLOUD_PASSWORD
};
// Payment Processing Queue
exports.paymentQueue = new bull_1.default('payment-processing', {
    redis: redisOptions,
    defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        }
    }
});
// Notification Queue
exports.notificationQueue = new bull_1.default('notifications', {
    redis: redisOptions,
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 1000
        }
    }
});
// Blockchain Transaction Queue
exports.blockchainQueue = new bull_1.default('blockchain-transactions', {
    redis: redisOptions,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        timeout: 60000 // 1 minute timeout for blockchain operations
    }
});
// Queue Event Handlers
exports.paymentQueue.on('completed', (job, _result) => {
    logger_1.default.info(`✅ Payment job ${job.id} completed for transaction ${job.data.transactionId}`);
});
exports.paymentQueue.on('failed', (job, err) => {
    logger_1.default.error(`❌ Payment job ${job.id} failed:`, err);
});
exports.paymentQueue.on('stalled', (job) => {
    logger_1.default.warn(`⚠️ Payment job ${job.id} stalled and will be retried`);
});
exports.notificationQueue.on('completed', (job) => {
    logger_1.default.info(`✅ Notification job ${job.id} completed`);
});
exports.notificationQueue.on('failed', (job, err) => {
    logger_1.default.error(`❌ Notification job ${job.id} failed:`, err);
});
exports.blockchainQueue.on('completed', (job, result) => {
    logger_1.default.info(`✅ Blockchain job ${job.id} completed with tx: ${result?.txHash || 'unknown'}`);
});
exports.blockchainQueue.on('failed', (job, err) => {
    logger_1.default.error(`❌ Blockchain job ${job.id} failed:`, err);
});
// Queue Health Check
async function checkQueueHealth() {
    try {
        const [paymentHealth, notificationHealth, blockchainHealth] = await Promise.all([
            exports.paymentQueue.getJobCounts(),
            exports.notificationQueue.getJobCounts(),
            exports.blockchainQueue.getJobCounts()
        ]);
        return {
            paymentQueue: paymentHealth,
            notificationQueue: notificationHealth,
            blockchainQueue: blockchainHealth,
            timestamp: new Date()
        };
    }
    catch (error) {
        logger_1.default.error('Queue health check failed:', error);
        return null;
    }
}
// Graceful shutdown
async function closeQueues() {
    logger_1.default.info('Closing all queues gracefully...');
    await Promise.all([
        exports.paymentQueue.close(),
        exports.notificationQueue.close(),
        exports.blockchainQueue.close()
    ]);
    logger_1.default.info('All queues closed');
}
exports.default = {
    paymentQueue: exports.paymentQueue,
    notificationQueue: exports.notificationQueue,
    blockchainQueue: exports.blockchainQueue,
    checkQueueHealth,
    closeQueues
};
//# sourceMappingURL=queue.config.js.map