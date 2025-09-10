"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queue_config_1 = require("../config/queue.config");
const payment_processor_1 = __importDefault(require("../queues/payment.processor"));
const logger_1 = __importDefault(require("../utils/logger"));
// Register the payment processor
queue_config_1.paymentQueue.process('processNFCPayment', 5, payment_processor_1.default);
logger_1.default.info('Payment worker started, processing up to 5 concurrent jobs');
// Handle worker shutdown gracefully
process.on('SIGTERM', async () => {
    logger_1.default.info('SIGTERM received, closing payment worker...');
    await queue_config_1.paymentQueue.close();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.default.info('SIGINT received, closing payment worker...');
    await queue_config_1.paymentQueue.close();
    process.exit(0);
});
exports.default = queue_config_1.paymentQueue;
//# sourceMappingURL=payment.worker.js.map