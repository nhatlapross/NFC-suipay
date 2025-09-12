const Bull = require('bull');

const redisOptions = {
  host: process.env.REDIS_CLOUD_HOST,
  port: parseInt(process.env.REDIS_CLOUD_PORT || '6379'),
  username: process.env.REDIS_CLOUD_USERNAME || 'default',
  password: process.env.REDIS_CLOUD_PASSWORD
};

const paymentQueue = new Bull('payment-processing', { redis: redisOptions });

async function checkQueue() {
  try {
    console.log('Checking queue...');
    
    const failed = await paymentQueue.getFailed(0, 5);
    console.log('Failed jobs count:', failed.length);
    
    if (failed.length > 0) {
      console.log('\nRecent failed jobs:');
      failed.forEach((job, index) => {
        console.log(`${index + 1}. Job ID: ${job.id}`);
        console.log(`   Transaction: ${job.data?.transactionId}`);
        console.log(`   Error: ${job.failedReason}`);
        console.log(`   Attempts: ${job.attemptsMade}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await paymentQueue.close();
    process.exit(0);
  }
}

checkQueue();