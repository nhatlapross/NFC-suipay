import Bull from 'bull';
export declare const paymentQueue: Bull.Queue<any>;
export declare const notificationQueue: Bull.Queue<any>;
export declare const blockchainQueue: Bull.Queue<any>;
export declare function checkQueueHealth(): Promise<{
    paymentQueue: Bull.JobCounts;
    notificationQueue: Bull.JobCounts;
    blockchainQueue: Bull.JobCounts;
    timestamp: Date;
} | null>;
export declare function closeQueues(): Promise<void>;
declare const _default: {
    paymentQueue: Bull.Queue<any>;
    notificationQueue: Bull.Queue<any>;
    blockchainQueue: Bull.Queue<any>;
    checkQueueHealth: typeof checkQueueHealth;
    closeQueues: typeof closeQueues;
};
export default _default;
//# sourceMappingURL=queue.config.d.ts.map