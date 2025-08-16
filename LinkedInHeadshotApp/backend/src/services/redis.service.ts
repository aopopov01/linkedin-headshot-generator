/**
 * Redis Service
 * 
 * Centralized Redis connection and caching service.
 * Handles connection management, caching operations, pub/sub, and session storage.
 */

import Redis from 'ioredis';
import { LoggerService } from './logger.service';

export class RedisService {
  private static instance: RedisService;
  private static client: Redis;
  private static publisher: Redis;
  private static subscriber: Redis;
  private static logger: LoggerService;

  private constructor() {
    RedisService.logger = new LoggerService('RedisService');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Initialize Redis connections
   */
  public static async initialize(): Promise<void> {
    try {
      RedisService.logger = new LoggerService('RedisService');

      const redisUrl = process.env.REDIS_URL!;
      const connectionOptions = {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        keyPrefix: 'omnishot:',
      };

      // Main Redis client for general operations
      RedisService.client = new Redis(redisUrl, {
        ...connectionOptions,
        connectionName: 'main'
      });

      // Publisher client for pub/sub
      RedisService.publisher = new Redis(redisUrl, {
        ...connectionOptions,
        connectionName: 'publisher'
      });

      // Subscriber client for pub/sub
      RedisService.subscriber = new Redis(redisUrl, {
        ...connectionOptions,
        connectionName: 'subscriber'
      });

      // Setup event handlers
      RedisService.setupEventHandlers();

      // Connect to Redis
      await Promise.all([
        RedisService.client.connect(),
        RedisService.publisher.connect(),
        RedisService.subscriber.connect()
      ]);

      // Test connection
      await RedisService.healthCheck();

      RedisService.logger.info('Redis service initialized successfully');
    } catch (error) {
      RedisService.logger.error('Failed to initialize Redis service:', error);
      throw error;
    }
  }

  /**
   * Setup Redis event handlers
   */
  private static setupEventHandlers(): void {
    const clients = [
      { name: 'main', client: RedisService.client },
      { name: 'publisher', client: RedisService.publisher },
      { name: 'subscriber', client: RedisService.subscriber }
    ];

    clients.forEach(({ name, client }) => {
      client.on('connect', () => {
        RedisService.logger.info(`Redis ${name} client connected`);
      });

      client.on('ready', () => {
        RedisService.logger.info(`Redis ${name} client ready`);
      });

      client.on('error', (error) => {
        RedisService.logger.error(`Redis ${name} client error:`, error);
      });

      client.on('close', () => {
        RedisService.logger.warn(`Redis ${name} client connection closed`);
      });

      client.on('reconnecting', () => {
        RedisService.logger.info(`Redis ${name} client reconnecting`);
      });
    });
  }

  /**
   * Get Redis client
   */
  public static getClient(): Redis {
    if (!RedisService.client) {
      throw new Error('Redis service not initialized. Call initialize() first.');
    }
    return RedisService.client;
  }

  /**
   * Get publisher client
   */
  public static getPublisher(): Redis {
    return RedisService.publisher;
  }

  /**
   * Get subscriber client
   */
  public static getSubscriber(): Redis {
    return RedisService.subscriber;
  }

  /**
   * Health check
   */
  public static async healthCheck(): Promise<{ status: string; connection: boolean; version?: string }> {
    try {
      const pong = await RedisService.client.ping();
      const info = await RedisService.client.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1];

      return {
        status: pong === 'PONG' ? 'healthy' : 'unhealthy',
        connection: true,
        version
      };
    } catch (error) {
      RedisService.logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        connection: false
      };
    }
  }

  // ================================
  // CACHING OPERATIONS
  // ================================

  /**
   * Set cache with expiration
   */
  public static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await RedisService.client.setex(key, ttl, serializedValue);
    } catch (error) {
      RedisService.logger.error(`Failed to set cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get cache value
   */
  public static async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await RedisService.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      RedisService.logger.error(`Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete cache key
   */
  public static async del(key: string): Promise<void> {
    try {
      await RedisService.client.del(key);
    } catch (error) {
      RedisService.logger.error(`Failed to delete cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  public static async exists(key: string): Promise<boolean> {
    try {
      const result = await RedisService.client.exists(key);
      return result === 1;
    } catch (error) {
      RedisService.logger.error(`Failed to check existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration on existing key
   */
  public static async expire(key: string, ttl: number): Promise<void> {
    try {
      await RedisService.client.expire(key, ttl);
    } catch (error) {
      RedisService.logger.error(`Failed to set expiration on key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get TTL of key
   */
  public static async ttl(key: string): Promise<number> {
    try {
      return await RedisService.client.ttl(key);
    } catch (error) {
      RedisService.logger.error(`Failed to get TTL of key ${key}:`, error);
      return -1;
    }
  }

  // ================================
  // HASH OPERATIONS
  // ================================

  /**
   * Set hash field
   */
  public static async hset(key: string, field: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await RedisService.client.hset(key, field, serializedValue);
    } catch (error) {
      RedisService.logger.error(`Failed to set hash field ${key}:${field}:`, error);
      throw error;
    }
  }

  /**
   * Get hash field
   */
  public static async hget<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const value = await RedisService.client.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      RedisService.logger.error(`Failed to get hash field ${key}:${field}:`, error);
      return null;
    }
  }

  /**
   * Get all hash fields
   */
  public static async hgetall<T = Record<string, any>>(key: string): Promise<T | null> {
    try {
      const hash = await RedisService.client.hgetall(key);
      if (Object.keys(hash).length === 0) return null;

      const result = {} as T;
      for (const [field, value] of Object.entries(hash)) {
        (result as any)[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      RedisService.logger.error(`Failed to get all hash fields ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete hash field
   */
  public static async hdel(key: string, field: string): Promise<void> {
    try {
      await RedisService.client.hdel(key, field);
    } catch (error) {
      RedisService.logger.error(`Failed to delete hash field ${key}:${field}:`, error);
      throw error;
    }
  }

  // ================================
  // LIST OPERATIONS
  // ================================

  /**
   * Push to list (right)
   */
  public static async rpush(key: string, ...values: any[]): Promise<number> {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await RedisService.client.rpush(key, ...serializedValues);
    } catch (error) {
      RedisService.logger.error(`Failed to rpush to list ${key}:`, error);
      throw error;
    }
  }

  /**
   * Pop from list (left)
   */
  public static async lpop<T = any>(key: string): Promise<T | null> {
    try {
      const value = await RedisService.client.lpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      RedisService.logger.error(`Failed to lpop from list ${key}:`, error);
      return null;
    }
  }

  /**
   * Get list length
   */
  public static async llen(key: string): Promise<number> {
    try {
      return await RedisService.client.llen(key);
    } catch (error) {
      RedisService.logger.error(`Failed to get length of list ${key}:`, error);
      return 0;
    }
  }

  // ================================
  // SET OPERATIONS
  // ================================

  /**
   * Add to set
   */
  public static async sadd(key: string, ...members: any[]): Promise<number> {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await RedisService.client.sadd(key, ...serializedMembers);
    } catch (error) {
      RedisService.logger.error(`Failed to add to set ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all set members
   */
  public static async smembers<T = any>(key: string): Promise<T[]> {
    try {
      const members = await RedisService.client.smembers(key);
      return members.map(m => JSON.parse(m));
    } catch (error) {
      RedisService.logger.error(`Failed to get set members ${key}:`, error);
      return [];
    }
  }

  /**
   * Remove from set
   */
  public static async srem(key: string, ...members: any[]): Promise<number> {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await RedisService.client.srem(key, ...serializedMembers);
    } catch (error) {
      RedisService.logger.error(`Failed to remove from set ${key}:`, error);
      throw error;
    }
  }

  // ================================
  // PUB/SUB OPERATIONS
  // ================================

  /**
   * Publish message
   */
  public static async publish(channel: string, message: any): Promise<number> {
    try {
      const serializedMessage = JSON.stringify(message);
      return await RedisService.publisher.publish(channel, serializedMessage);
    } catch (error) {
      RedisService.logger.error(`Failed to publish to channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to channel
   */
  public static async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await RedisService.subscriber.subscribe(channel);
      
      RedisService.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (error) {
            RedisService.logger.error('Failed to parse pub/sub message:', error);
          }
        }
      });
    } catch (error) {
      RedisService.logger.error(`Failed to subscribe to channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from channel
   */
  public static async unsubscribe(channel: string): Promise<void> {
    try {
      await RedisService.subscriber.unsubscribe(channel);
    } catch (error) {
      RedisService.logger.error(`Failed to unsubscribe from channel ${channel}:`, error);
      throw error;
    }
  }

  // ================================
  // SESSION OPERATIONS
  // ================================

  /**
   * Store session
   */
  public static async setSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<void> {
    try {
      await RedisService.set(`session:${sessionId}`, sessionData, ttl);
    } catch (error) {
      RedisService.logger.error(`Failed to store session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get session
   */
  public static async getSession(sessionId: string): Promise<any> {
    try {
      return await RedisService.get(`session:${sessionId}`);
    } catch (error) {
      RedisService.logger.error(`Failed to get session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Delete session
   */
  public static async deleteSession(sessionId: string): Promise<void> {
    try {
      await RedisService.del(`session:${sessionId}`);
    } catch (error) {
      RedisService.logger.error(`Failed to delete session ${sessionId}:`, error);
      throw error;
    }
  }

  // ================================
  // RATE LIMITING
  // ================================

  /**
   * Increment rate limit counter
   */
  public static async incrementRateLimit(key: string, window: number = 3600): Promise<number> {
    try {
      const pipeline = RedisService.client.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, window);
      const results = await pipeline.exec();
      
      return results?.[0]?.[1] as number || 0;
    } catch (error) {
      RedisService.logger.error(`Failed to increment rate limit ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get rate limit count
   */
  public static async getRateLimit(key: string): Promise<number> {
    try {
      const count = await RedisService.client.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      RedisService.logger.error(`Failed to get rate limit ${key}:`, error);
      return 0;
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  /**
   * Get Redis info
   */
  public static async getInfo(): Promise<any> {
    try {
      const info = await RedisService.client.info();
      return info;
    } catch (error) {
      RedisService.logger.error('Failed to get Redis info:', error);
      return null;
    }
  }

  /**
   * Flush all data (development only)
   */
  public static async flushAll(): Promise<void> {
    try {
      if (process.env.NODE_ENV !== 'production') {
        await RedisService.client.flushall();
        RedisService.logger.warn('Redis cache flushed (development mode)');
      } else {
        throw new Error('Cannot flush Redis in production mode');
      }
    } catch (error) {
      RedisService.logger.error('Failed to flush Redis:', error);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  public static async close(): Promise<void> {
    try {
      await Promise.all([
        RedisService.client?.quit(),
        RedisService.publisher?.quit(),
        RedisService.subscriber?.quit()
      ]);
      RedisService.logger.info('Redis connections closed');
    } catch (error) {
      RedisService.logger.error('Error closing Redis connections:', error);
      throw error;
    }
  }
}

export default RedisService;