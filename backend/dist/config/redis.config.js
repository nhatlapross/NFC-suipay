"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.setCachedSafe = exports.getCachedSafe = exports.getConnectionInfo = exports.ensureRedisConnection = exports.closeRedisConnection = exports.getRedisStats = exports.NFCCacheKeys = exports.cacheWithFallback = exports.getCachedBatch = exports.setCachedBatch = exports.deleteCached = exports.setCached = exports.getCached = void 0;
exports.initRedis = initRedis;
// backend/src/config/redis.config.ts - REDIS CLOUD VERSION
const redis_1 = require("redis");
const logger_1 = __importDefault(require("../utils/logger"));
// Redis Cloud Configuration with connection pool
const redisClient = (0, redis_1.createClient)({
    username: process.env.REDIS_CLOUD_USERNAME || 'default',
    password: process.env.REDIS_CLOUD_PASSWORD,
    socket: {
        host: process.env.REDIS_CLOUD_HOST,
        port: parseInt(process.env.REDIS_CLOUD_PORT || '6379'),
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
        keepAlive: true, // Enable keep-alive
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                logger_1.default.error(`Redis max reconnection attempts reached: ${retries}`);
                return false; // Stop reconnecting after 10 attempts
            }
            const delay = Math.min(retries * 100, 3000); // Max 3 seconds delay
            logger_1.default.warn(`Redis reconnect attempt ${retries}, delay: ${delay}ms`);
            return delay;
        }
    }
});
exports.redisClient = redisClient;
// Event handlers for Redis Cloud
redisClient.on('error', (err) => {
    logger_1.default.error('Redis Client Error:', err);
});
redisClient.on('connect', () => {
    logger_1.default.info('✅ Connected to Redis Cloud');
});
redisClient.on('ready', () => {
    logger_1.default.info('✅ Redis Cloud is ready');
});
redisClient.on('end', () => {
    logger_1.default.warn('❌ Redis Cloud connection ended');
});
redisClient.on('reconnecting', () => {
    logger_1.default.info('🔄 Reconnecting to Redis Cloud...');
});
// Initialize connection
async function initRedis() {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
            logger_1.default.info('🚀 Redis Cloud initialized successfully');
            // Health check
            const pong = await redisClient.ping();
            if (pong === 'PONG') {
                logger_1.default.info('✅ Redis Cloud health check passed');
            }
            // Performance test
            const start = Date.now();
            await redisClient.set('nfc:health:test', 'ok', { EX: 10 });
            await redisClient.get('nfc:health:test');
            const latency = Date.now() - start;
            logger_1.default.info(`⚡ Redis Cloud latency: ${latency}ms`);
            if (latency > 100) {
                logger_1.default.warn(`⚠️ High Redis latency detected: ${latency}ms`);
            }
        }
    }
    catch (error) {
        logger_1.default.error('❌ Failed to initialize Redis Cloud:', error);
        throw error;
    }
}
// Helper functions optimized for Redis Cloud
const getCached = async (key) => {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (error) {
        logger_1.default.error(`Redis GET error for key ${key}:`, error);
        return null; // Fallback gracefully
    }
};
exports.getCached = getCached;
const setCached = async (key, data, ttl = 300) => {
    try {
        const serialized = JSON.stringify(data);
        await redisClient.setEx(key, ttl, serialized);
        return true;
    }
    catch (error) {
        logger_1.default.error(`Redis SET error for key ${key}:`, error);
        return false;
    }
};
exports.setCached = setCached;
const deleteCached = async (key) => {
    try {
        await redisClient.del(key);
        return true;
    }
    catch (error) {
        logger_1.default.error(`Redis DELETE error for key ${key}:`, error);
        return false;
    }
};
exports.deleteCached = deleteCached;
// Batch operations for better performance with Redis Cloud
const setCachedBatch = async (items) => {
    try {
        const pipeline = redisClient.multi();
        items.forEach(item => {
            const ttl = item.ttl || 300;
            const serialized = JSON.stringify(item.data);
            pipeline.setEx(item.key, ttl, serialized);
        });
        await pipeline.exec();
        return true;
    }
    catch (error) {
        logger_1.default.error('Redis batch SET error:', error);
        return false;
    }
};
exports.setCachedBatch = setCachedBatch;
const getCachedBatch = async (keys) => {
    try {
        const pipeline = redisClient.multi();
        keys.forEach(key => pipeline.get(key));
        const results = await pipeline.exec();
        const data = {};
        results?.forEach((result, index) => {
            const key = keys[index];
            const value = result[1];
            data[key] = value ? JSON.parse(value) : null;
        });
        return data;
    }
    catch (error) {
        logger_1.default.error('Redis batch GET error:', error);
        return {};
    }
};
exports.getCachedBatch = getCachedBatch;
// Advanced caching for NFC performance
const cacheWithFallback = async (key, fallbackFn, ttl = 300) => {
    try {
        // Try to get from cache first
        const cached = await (0, exports.getCached)(key);
        if (cached !== null) {
            return cached;
        }
        // Execute fallback function
        const result = await fallbackFn();
        // Cache the result
        await (0, exports.setCached)(key, result, ttl);
        return result;
    }
    catch (error) {
        logger_1.default.error(`Cache with fallback error for key ${key}:`, error);
        // If cache fails, still execute fallback
        return await fallbackFn();
    }
};
exports.cacheWithFallback = cacheWithFallback;
// Key pattern helpers for NFC
exports.NFCCacheKeys = {
    cardStatus: (cardUuid) => `nfc:card:status:${cardUuid}`,
    cardLimits: (cardUuid) => `nfc:card:limits:${cardUuid}`,
    dailySpending: (cardUuid, date) => `nfc:spending:${cardUuid}:${date}`,
    userWallet: (userId) => `nfc:wallet:${userId}`,
    fastValidation: (cardUuid, amount) => `nfc:validate:${cardUuid}:${Math.floor(amount)}`,
    fraudScore: (cardUuid, terminalId) => `nfc:fraud:${cardUuid}:${terminalId}`,
    terminalStatus: (terminalId) => `nfc:terminal:${terminalId}`,
    merchantInfo: (merchantId) => `nfc:merchant:${merchantId}`
};
// Performance monitoring for Redis Cloud
const getRedisStats = async () => {
    try {
        const info = await redisClient.info();
        return {
            connected: redisClient.isReady,
            info: info,
            timestamp: new Date(),
            latency: await measureLatency()
        };
    }
    catch (error) {
        logger_1.default.error('Failed to get Redis stats:', error);
        return { connected: false, error: error.message };
    }
};
exports.getRedisStats = getRedisStats;
async function measureLatency() {
    const start = Date.now();
    await redisClient.ping();
    return Date.now() - start;
}
// Graceful shutdown function
const closeRedisConnection = async () => {
    try {
        if (redisClient.isOpen) {
            logger_1.default.info('🔄 Closing Redis connection...');
            await redisClient.quit();
            logger_1.default.info('✅ Redis connection closed gracefully');
        }
    }
    catch (error) {
        logger_1.default.error('❌ Error closing Redis connection:', error);
        try {
            await redisClient.disconnect();
        }
        catch (disconnectError) {
            logger_1.default.error('❌ Error disconnecting Redis:', disconnectError);
        }
    }
};
exports.closeRedisConnection = closeRedisConnection;
// Connection health check with automatic recovery
const ensureRedisConnection = async () => {
    try {
        if (!redisClient.isReady) {
            logger_1.default.info('🔄 Redis not ready, attempting to connect...');
            await redisClient.connect();
        }
        // Ping test
        await redisClient.ping();
        return true;
    }
    catch (error) {
        logger_1.default.error('❌ Redis connection health check failed:', error);
        return false;
    }
};
exports.ensureRedisConnection = ensureRedisConnection;
// Monitoring function
const getConnectionInfo = () => {
    return {
        isOpen: redisClient.isOpen,
        isReady: redisClient.isReady,
        serverInfo: {
            host: process.env.REDIS_CLOUD_HOST,
            port: process.env.REDIS_CLOUD_PORT,
        }
    };
};
exports.getConnectionInfo = getConnectionInfo;
// Enhanced cache functions with connection checks
const getCachedSafe = async (key) => {
    try {
        // Ensure connection is healthy
        const isHealthy = await (0, exports.ensureRedisConnection)();
        if (!isHealthy) {
            logger_1.default.warn(`Redis unhealthy, skipping cache get for key: ${key}`);
            return null;
        }
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (error) {
        logger_1.default.error(`Redis GET error for key ${key}:`, error);
        return null; // Fallback gracefully
    }
};
exports.getCachedSafe = getCachedSafe;
const setCachedSafe = async (key, data, ttl = 300) => {
    try {
        // Ensure connection is healthy
        const isHealthy = await (0, exports.ensureRedisConnection)();
        if (!isHealthy) {
            logger_1.default.warn(`Redis unhealthy, skipping cache set for key: ${key}`);
            return false;
        }
        const serialized = JSON.stringify(data);
        await redisClient.setEx(key, ttl, serialized);
        return true;
    }
    catch (error) {
        logger_1.default.error(`Redis SET error for key ${key}:`, error);
        return false;
    }
};
exports.setCachedSafe = setCachedSafe;
exports.default = redisClient;
//# sourceMappingURL=redis.config.js.map