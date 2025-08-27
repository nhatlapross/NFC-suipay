import Redis from 'ioredis';
import logger from '../utils/logger';

let redisClient: Redis;

export async function connectRedis(): Promise<void> {
  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    await redisClient.ping();
    
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCached<T>(key: string, value: T, ttl?: number): Promise<void> {
  const data = JSON.stringify(value);
  if (ttl) {
    await redisClient.setex(key, ttl, data);
  } else {
    await redisClient.set(key, data);
  }
}

export async function deleteCached(key: string): Promise<void> {
  await redisClient.del(key);
}