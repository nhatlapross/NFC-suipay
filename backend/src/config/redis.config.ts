// backend/src/config/redis.config.ts - REDIS CLOUD VERSION
import { createClient } from 'redis';
import logger from '../utils/logger';

// Redis Cloud Configuration with connection pool
const redisClient = createClient({
  username: process.env.REDIS_CLOUD_USERNAME || 'default',
  password: process.env.REDIS_CLOUD_PASSWORD,
  socket: {
    host: process.env.REDIS_CLOUD_HOST,
    port: parseInt(process.env.REDIS_CLOUD_PORT || '6379'),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
    keepAlive: true, // Enable keep-alive
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        logger.error(`Redis max reconnection attempts reached: ${retries}`);
        return false; // Stop reconnecting after 10 attempts
      }
      const delay = Math.min(retries * 100, 3000); // Max 3 seconds delay
      logger.warn(`Redis reconnect attempt ${retries}, delay: ${delay}ms`);
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

// Graceful shutdown function
export const closeRedisConnection = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      logger.info('🔄 Closing Redis connection...');
      await redisClient.quit();
      logger.info('✅ Redis connection closed gracefully');
    }
  } catch (error) {
    logger.error('❌ Error closing Redis connection:', error);
    try {
      await redisClient.disconnect();
    } catch (disconnectError) {
      logger.error('❌ Error disconnecting Redis:', disconnectError);
    }
  }
};

// Connection health check with automatic recovery
export const ensureRedisConnection = async (): Promise<boolean> => {
  try {
    if (!redisClient.isReady) {
      logger.info('🔄 Redis not ready, attempting to connect...');
      await redisClient.connect();
    }

    // Ping test
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('❌ Redis connection health check failed:', error);
    return false;
  }
};

// Monitoring function
export const getConnectionInfo = () => {
  return {
    isOpen: redisClient.isOpen,
    isReady: redisClient.isReady,
    serverInfo: {
      host: process.env.REDIS_CLOUD_HOST,
      port: process.env.REDIS_CLOUD_PORT,
    }
  };
};

// Enhanced cache functions with connection checks
export const getCachedSafe = async (key: string): Promise<any> => {
  try {
    // Ensure connection is healthy
    const isHealthy = await ensureRedisConnection();
    if (!isHealthy) {
      logger.warn(`Redis unhealthy, skipping cache get for key: ${key}`);
      return null;
    }

    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Redis GET error for key ${key}:`, error);
    return null; // Fallback gracefully
  }
};

export const setCachedSafe = async (
  key: string,
  data: any,
  ttl: number = 300
): Promise<boolean> => {
  try {
    // Ensure connection is healthy
    const isHealthy = await ensureRedisConnection();
    if (!isHealthy) {
      logger.warn(`Redis unhealthy, skipping cache set for key: ${key}`);
      return false;
    }

    const serialized = JSON.stringify(data);
    await redisClient.setEx(key, ttl, serialized);
    return true;
  } catch (error) {
    logger.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
};

// Export client and initialization
export { redisClient };
export default redisClient;