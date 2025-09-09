import { paymentQueue } from '../config/queue.config';
import processNFCPaymentJob from '../queues/payment.processor';
import logger from '../utils/logger';

// Register the payment processor
paymentQueue.process('processNFCPayment', 5, processNFCPaymentJob);

logger.info('Payment worker started, processing up to 5 concurrent jobs');

// Handle worker shutdown gracefully
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing payment worker...');
  await paymentQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing payment worker...');
  await paymentQueue.close();
  process.exit(0);
});

export default paymentQueue;