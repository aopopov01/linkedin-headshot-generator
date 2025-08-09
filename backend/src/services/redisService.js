const Redis = require('ioredis');
const logger = require('../config/logger');

class RedisService {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  async connect() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
      };

      if (process.env.REDIS_URL) {
        this.client = new Redis(process.env.REDIS_URL);
      } else {
        this.client = new Redis(redisConfig);
      }

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.connected = true;
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error);
        this.connected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis client connection ended');
        this.connected = false;
      });

      // Test connection
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
    }
  }

  // Session management
  async setSession(sessionId, data, ttlSeconds = 86400) {
    if (!this.connected) throw new Error('Redis not connected');
    await this.client.setex(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
  }

  async getSession(sessionId) {
    if (!this.connected) throw new Error('Redis not connected');
    const data = await this.client.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId) {
    if (!this.connected) throw new Error('Redis not connected');
    await this.client.del(`session:${sessionId}`);
  }

  // Caching
  async set(key, value, ttlSeconds) {
    if (!this.connected) throw new Error('Redis not connected');
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get(key) {
    if (!this.connected) throw new Error('Redis not connected');
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async del(key) {
    if (!this.connected) throw new Error('Redis not connected');
    await this.client.del(key);
  }

  // Rate limiting
  async incrementRateLimit(key, windowMs, maxRequests) {
    if (!this.connected) throw new Error('Redis not connected');
    
    const multi = this.client.multi();
    multi.incr(key);
    multi.expire(key, Math.ceil(windowMs / 1000));
    
    const results = await multi.exec();
    const count = results[0][1];
    
    return {
      count,
      remaining: Math.max(0, maxRequests - count),
      resetTime: Date.now() + windowMs
    };
  }

  // Processing queues
  async addToQueue(queueName, data, delay = 0) {
    if (!this.connected) throw new Error('Redis not connected');
    const timestamp = Date.now() + delay;
    await this.client.zadd(`queue:${queueName}`, timestamp, JSON.stringify(data));
  }

  async getFromQueue(queueName, limit = 10) {
    if (!this.connected) throw new Error('Redis not connected');
    const now = Date.now();
    const results = await this.client.zrangebyscore(
      `queue:${queueName}`,
      '-inf',
      now,
      'LIMIT',
      0,
      limit
    );
    
    if (results.length > 0) {
      await this.client.zrem(`queue:${queueName}`, ...results);
      return results.map(item => JSON.parse(item));
    }
    
    return [];
  }

  // Photo processing cache
  async cachePhotoAnalysis(photoId, analysis, ttlSeconds = 3600) {
    await this.set(`photo:analysis:${photoId}`, analysis, ttlSeconds);
  }

  async getCachedPhotoAnalysis(photoId) {
    return await this.get(`photo:analysis:${photoId}`);
  }

  // User preferences cache
  async cacheUserPreferences(userId, preferences, ttlSeconds = 7200) {
    await this.set(`user:preferences:${userId}`, preferences, ttlSeconds);
  }

  async getCachedUserPreferences(userId) {
    return await this.get(`user:preferences:${userId}`);
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = new RedisService();