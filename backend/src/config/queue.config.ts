import Bull from 'bull';
import logger from '../utils/logger';

// Create Redis connection options for Bull
const redisOptions = {
  host: process.env.REDIS_CLOUD_HOST,
  port: parseInt(process.env.REDIS_CLOUD_PORT || '6379'),
  username: process.env.REDIS_CLOUD_USERNAME || 'default',
  password: process.env.REDIS_CLOUD_PASSWORD
};

// Payment Processing Queue
export const paymentQueue = new Bull('payment-processing', {
  redis: redisOptions,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Notification Queue
export const notificationQueue = new Bull('notifications', {
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
export const blockchainQueue = new Bull('blockchain-transactions', {
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
paymentQueue.on('completed', (job, _result) => {
  logger.info(`✅ Payment job ${job.id} completed for transaction ${job.data.transactionId}`);
});

paymentQueue.on('failed', (job, err) => {
  logger.error(`❌ Payment job ${job.id} failed:`, err);
});

paymentQueue.on('stalled', (job) => {
  logger.warn(`⚠️ Payment job ${job.id} stalled and will be retried`);
});

notificationQueue.on('completed', (job) => {
  logger.info(`✅ Notification job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
  logger.error(`❌ Notification job ${job.id} failed:`, err);
});

blockchainQueue.on('completed', (job, result) => {
  logger.info(`✅ Blockchain job ${job.id} completed with tx: ${result?.txHash || 'unknown'}`);
});

blockchainQueue.on('failed', (job, err) => {
  logger.error(`❌ Blockchain job ${job.id} failed:`, err);
});

// Queue Health Check
export async function checkQueueHealth() {
  try {
    const [paymentHealth, notificationHealth, blockchainHealth] = await Promise.all([
      paymentQueue.getJobCounts(),
      notificationQueue.getJobCounts(),
      blockchainQueue.getJobCounts()
    ]);

    return {
      paymentQueue: paymentHealth,
      notificationQueue: notificationHealth,
      blockchainQueue: blockchainHealth,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Queue health check failed:', error);
    return null;
  }
}

// Graceful shutdown
export async function closeQueues() {
  logger.info('Closing all queues gracefully...');
  await Promise.all([
    paymentQueue.close(),
    notificationQueue.close(),
    blockchainQueue.close()
  ]);
  logger.info('All queues closed');
}

export default {
  paymentQueue,
  notificationQueue,
  blockchainQueue,
  checkQueueHealth,
  closeQueues
};