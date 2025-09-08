// backend/src/config/redis.config.ts - REDIS CLOUD VERSION
import { createClient } from 'redis';
import logger from '../utils/logger';

// Redis Cloud Configuration
const redisClient = createClient({
  username: process.env.REDIS_CLOUD_USERNAME || 'default',
  password: process.env.REDIS_CLOUD_PASSWORD,
  socket: {
    host: process.env.REDIS_CLOUD_HOST,
    port: parseInt(process.env.REDIS_CLOUD_PORT || '6379'),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
    reconnectStrategy: (retries: number) => {
      const delay = Math.min(retries * 50, 1000);
      console.log(`Redis reconnect attempt ${retries}, delay: ${delay}ms`);
      return delay;
    }
  }
});

// Event handlers for Redis Cloud
redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('✅ Connected to Redis Cloud');
});

redisClient.on('ready', () => {
  logger.info('✅ Redis Cloud is ready');
});

redisClient.on('end', () => {
  logger.warn('❌ Redis Cloud connection ended');
});

redisClient.on('reconnecting', () => {
  logger.info('🔄 Reconnecting to Redis Cloud...');
});

// Initialize connection
export async function initRedis(): Promise<void> {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      logger.info('🚀 Redis Cloud initialized successfully');
      
      // Health check
      const pong = await redisClient.ping();
      if (pong === 'PONG') {
        logger.info('✅ Redis Cloud health check passed');
      }
      
      // Performance test
      const start = Date.now();
      await redisClient.set('nfc:health:test', 'ok', { EX: 10 });
      await redisClient.get('nfc:health:test');
      const latency = Date.now() - start;
      
      logger.info(`⚡ Redis Cloud latency: ${latency}ms`);
      
      if (latency > 100) {
        logger.warn(`⚠️ High Redis latency detected: ${latency}ms`);
      }
    }
  } catch (error) {
    logger.error('❌ Failed to initialize Redis Cloud:', error);
    throw error;
  }
}

// Helper functions optimized for Redis Cloud
export const getCached = async (key: string): Promise<any> => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Redis GET error for key ${key}:`, error);
    return null; // Fallback gracefully
  }
};

export const setCached = async (
  key: string, 
  data: any, 
  ttl: number = 300
): Promise<boolean> => {
  try {
    const serialized = JSON.stringify(data);
    await redisClient.setEx(key, ttl, serialized);
    return true;
  } catch (error) {
    logger.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
};

export const deleteCached = async (key: string): Promise<boolean> => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis DELETE error for key ${key}:`, error);
    return false;
  }
};

// Batch operations for better performance with Redis Cloud
export const setCachedBatch = async (
  items: Array<{key: string, data: any, ttl?: number}>
): Promise<boolean> => {
  try {
    const pipeline = redisClient.multi();
    
    items.forEach(item => {
      const ttl = item.ttl || 300;
      const serialized = JSON.stringify(item.data);
      pipeline.setEx(item.key, ttl, serialized);
    });
    
    await pipeline.exec();
    return true;
  } catch (error) {
    logger.error('Redis batch SET error:', error);
    return false;
  }
};

export const getCachedBatch = async (keys: string[]): Promise<{[key: string]: any}> => {
  try {
    const pipeline = redisClient.multi();
    keys.forEach(key => pipeline.get(key));
    
    const results = await pipeline.exec();
    const data: {[key: string]: any} = {};
    
    results?.forEach((result:any, index:any) => {
      const key = keys[index];
      const value = result[1] as string;
      data[key] = value ? JSON.parse(value) : null;
    });
    
    return data;
  } catch (error) {
    logger.error('Redis batch GET error:', error);
    return {};
  }
};

// Advanced caching for NFC performance
export const cacheWithFallback = async <T>(
  key: string,
  fallbackFn: () => Promise<T>,
  ttl: number = 300
): Promise<T> => {
  try {
    // Try to get from cache first
    const cached = await getCached(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute fallback function
    const result = await fallbackFn();
    
    // Cache the result
    await setCached(key, result, ttl);
    
    return result;
  } catch (error) {
    logger.error(`Cache with fallback error for key ${key}:`, error);
    // If cache fails, still execute fallback
    return await fallbackFn();
  }
};

// Key pattern helpers for NFC
export const NFCCacheKeys = {
  cardStatus: (cardUuid: string) => `nfc:card:status:${cardUuid}`,
  cardLimits: (cardUuid: string) => `nfc:card:limits:${cardUuid}`,
  dailySpending: (cardUuid: string, date: string) => `nfc:spending:${cardUuid}:${date}`,
  userWallet: (userId: string) => `nfc:wallet:${userId}`,
  fastValidation: (cardUuid: string, amount: number) => `nfc:validate:${cardUuid}:${Math.floor(amount)}`,
  fraudScore: (cardUuid: string, terminalId: string) => `nfc:fraud:${cardUuid}:${terminalId}`,
  terminalStatus: (terminalId: string) => `nfc:terminal:${terminalId}`,
  merchantInfo: (merchantId: string) => `nfc:merchant:${merchantId}`
};

// Performance monitoring for Redis Cloud
export const getRedisStats = async () => {
  try {
    const info = await redisClient.info();
    return {
      connected: redisClient.isReady,
      info: info,
      timestamp: new Date(),
      latency: await measureLatency()
    };
  } catch (error:any) {
    logger.error('Failed to get Redis stats:', error);
    return { connected: false, error: error.message };
  }
};

async function measureLatency(): Promise<number> {
  const start = Date.now();
  await redisClient.ping();
  return Date.now() - start;
}

// Export client and initialization
export { redisClient };
export default redisClient;