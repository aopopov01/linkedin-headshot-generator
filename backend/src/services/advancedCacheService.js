/**
 * Advanced Redis Caching Service
 * High-performance caching with intelligent invalidation, compression, and monitoring
 */

const Redis = require('ioredis');
const logger = require('../config/logger');
const zlib = require('zlib');
const crypto = require('crypto');

class AdvancedCacheService {
  constructor() {
    this.redis = null;
    this.cluster = null;
    this.isClusterMode = false;
    this.compressionThreshold = 1024; // Compress data > 1KB
    this.defaultTTL = 3600; // 1 hour default TTL
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    
    this.keyPatterns = {
      user: 'user:',
      photo: 'photo:',
      analytics: 'analytics:',
      session: 'session:',
      rate_limit: 'rate_limit:',
      api_response: 'api:'
    };
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000
      };

      // Check if cluster mode is enabled
      if (process.env.REDIS_CLUSTER_NODES) {
        this.isClusterMode = true;
        const nodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
          const [host, port] = node.split(':');
          return { host, port: parseInt(port) };
        });

        this.cluster = new Redis.Cluster(nodes, {
          redisOptions: redisConfig,
          enableOfflineQueue: false
        });

        this.redis = this.cluster;
        
        this.cluster.on('connect', () => {
          logger.info('✅ Redis cluster connected');
        });

        this.cluster.on('error', (error) => {
          logger.error('❌ Redis cluster error:', error);
          this.stats.errors++;
        });

      } else {
        // Single instance mode
        this.redis = new Redis(redisConfig);

        this.redis.on('connect', () => {
          logger.info('✅ Redis connected');
        });

        this.redis.on('error', (error) => {
          logger.error('❌ Redis error:', error);
          this.stats.errors++;
        });
      }

      // Test connection
      await this.redis.ping();
      logger.info('🚀 Cache service initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize cache service:', error);
      throw error;
    }
  }

  /**
   * Get data from cache with automatic decompression
   */
  async get(key, defaultValue = null) {
    try {
      const data = await this.redis.get(key);
      
      if (data === null) {
        this.stats.misses++;
        return defaultValue;
      }

      this.stats.hits++;
      return this.deserializeData(data);
    } catch (error) {
      logger.error('Cache get error:', { key, error: error.message });
      this.stats.errors++;
      return defaultValue;
    }
  }

  /**
   * Set data in cache with automatic compression and TTL
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serializedData = await this.serializeData(value);
      
      if (ttl > 0) {
        await this.redis.setex(key, ttl, serializedData);
      } else {
        await this.redis.set(key, serializedData);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      logger.error('Cache set error:', { key, error: error.message });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key) {
    try {
      const result = await this.redis.del(key);
      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error:', { key, error: error.message });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deleteByPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      const result = await this.redis.del(...keys);
      this.stats.deletes += result;
      return result;
    } catch (error) {
      logger.error('Cache delete by pattern error:', { pattern, error: error.message });
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    try {
      return await this.redis.exists(key) === 1;
    } catch (error) {
      logger.error('Cache exists error:', { key, error: error.message });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key, ttl) {
    try {
      return await this.redis.expire(key, ttl) === 1;
    } catch (error) {
      logger.error('Cache expire error:', { key, ttl, error: error.message });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get time to live for a key
   */
  async ttl(key) {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error:', { key, error: error.message });
      this.stats.errors++;
      return -1;
    }
  }

  /**
   * Cache user data with intelligent invalidation
   */
  async cacheUser(userId, userData, ttl = 3600) {
    const key = `${this.keyPatterns.user}${userId}`;
    return await this.set(key, userData, ttl);
  }

  /**
   * Get cached user data
   */
  async getCachedUser(userId) {
    const key = `${this.keyPatterns.user}${userId}`;
    return await this.get(key);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId) {
    const pattern = `${this.keyPatterns.user}${userId}*`;
    return await this.deleteByPattern(pattern);
  }

  /**
   * Cache photo generation result
   */
  async cachePhotoGeneration(predictionId, result, ttl = 7200) { // 2 hours
    const key = `${this.keyPatterns.photo}${predictionId}`;
    return await this.set(key, result, ttl);
  }

  /**
   * Get cached photo generation result
   */
  async getCachedPhotoGeneration(predictionId) {
    const key = `${this.keyPatterns.photo}${predictionId}`;
    return await this.get(key);
  }

  /**
   * Cache API response with intelligent key generation
   */
  async cacheApiResponse(endpoint, params, response, ttl = 1800) { // 30 minutes
    const key = this.generateApiResponseKey(endpoint, params);
    return await this.set(key, response, ttl);
  }

  /**
   * Get cached API response
   */
  async getCachedApiResponse(endpoint, params) {
    const key = this.generateApiResponseKey(endpoint, params);
    return await this.get(key);
  }

  /**
   * Cache analytics data with time-based keys
   */
  async cacheAnalytics(query, data, ttl = 1800) {
    const key = `${this.keyPatterns.analytics}${this.hashString(query)}`;
    return await this.set(key, data, ttl);
  }

  /**
   * Get cached analytics data
   */
  async getCachedAnalytics(query) {
    const key = `${this.keyPatterns.analytics}${this.hashString(query)}`;
    return await this.get(key);
  }

  /**
   * Implement rate limiting with sliding window
   */
  async checkRateLimit(identifier, limit, windowSize = 3600) {
    const key = `${this.keyPatterns.rate_limit}${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const window = now - windowSize;

    try {
      // Remove old entries
      await this.redis.zremrangebyscore(key, 0, window);
      
      // Count current requests
      const current = await this.redis.zcard(key);
      
      if (current >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: window + windowSize
        };
      }

      // Add current request
      await this.redis.zadd(key, now, `${now}-${Math.random()}`);
      await this.redis.expire(key, windowSize);

      return {
        allowed: true,
        remaining: limit - current - 1,
        resetTime: window + windowSize
      };
    } catch (error) {
      logger.error('Rate limit error:', { identifier, error: error.message });
      // Allow request on error
      return { allowed: true, remaining: limit - 1, resetTime: now + windowSize };
    }
  }

  /**
   * Batch operations for better performance
   */
  async batchGet(keys) {
    try {
      if (keys.length === 0) return {};

      const values = await this.redis.mget(...keys);
      const result = {};

      keys.forEach((key, index) => {
        if (values[index] !== null) {
          result[key] = this.deserializeData(values[index]);
          this.stats.hits++;
        } else {
          result[key] = null;
          this.stats.misses++;
        }
      });

      return result;
    } catch (error) {
      logger.error('Batch get error:', { keys: keys.length, error: error.message });
      this.stats.errors++;
      return {};
    }
  }

  /**
   * Batch set operations
   */
  async batchSet(data, ttl = this.defaultTTL) {
    try {
      const pipeline = this.redis.pipeline();

      for (const [key, value] of Object.entries(data)) {
        const serializedData = await this.serializeData(value);
        if (ttl > 0) {
          pipeline.setex(key, ttl, serializedData);
        } else {
          pipeline.set(key, serializedData);
        }
      }

      await pipeline.exec();
      this.stats.sets += Object.keys(data).length;
      return true;
    } catch (error) {
      logger.error('Batch set error:', { keys: Object.keys(data).length, error: error.message });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      ...this.stats,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0,
      totalRequests,
      isConnected: this.redis ? this.redis.status === 'ready' : false,
      mode: this.isClusterMode ? 'cluster' : 'standalone'
    };
  }

  /**
   * Get Redis server information
   */
  async getServerInfo() {
    try {
      const info = await this.redis.info();
      const memory = await this.redis.memory('usage');
      
      return {
        server: this.parseRedisInfo(info),
        memoryUsage: memory,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Failed to get server info:', error);
      return null;
    }
  }

  /**
   * Serialize data with compression if needed
   */
  async serializeData(data) {
    const jsonData = JSON.stringify(data);
    
    // Compress if data is large
    if (jsonData.length > this.compressionThreshold) {
      const compressed = zlib.gzipSync(Buffer.from(jsonData));
      return `gzip:${compressed.toString('base64')}`;
    }
    
    return jsonData;
  }

  /**
   * Deserialize data with decompression if needed
   */
  deserializeData(data) {
    if (data.startsWith('gzip:')) {
      const compressed = Buffer.from(data.substring(5), 'base64');
      const decompressed = zlib.gunzipSync(compressed);
      return JSON.parse(decompressed.toString());
    }
    
    return JSON.parse(data);
  }

  /**
   * Generate API response cache key
   */
  generateApiResponseKey(endpoint, params) {
    const paramStr = JSON.stringify(params);
    const hash = this.hashString(`${endpoint}:${paramStr}`);
    return `${this.keyPatterns.api_response}${hash}`;
  }

  /**
   * Hash string for cache keys
   */
  hashString(str) {
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * Parse Redis info string
   */
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    lines.forEach(line => {
      if (line.includes(':') && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    });
    
    return result;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
        connected: true,
        mode: this.isClusterMode ? 'cluster' : 'standalone'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      };
    }
  }

  /**
   * Clear all cache data
   */
  async clearAll() {
    try {
      await this.redis.flushdb();
      logger.info('Cache cleared successfully');
      return true;
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      logger.info('Cache service connection closed');
    } catch (error) {
      logger.error('Error closing cache connection:', error);
    }
  }
}

module.exports = new AdvancedCacheService();