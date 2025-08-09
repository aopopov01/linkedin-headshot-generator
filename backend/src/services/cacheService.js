const Redis = require('ioredis');
const logger = require('../config/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.initialized = false;
    this.localCache = new Map(); // Fallback local cache
    this.localCacheMaxSize = 1000;
    
    // Cache configuration with TTL (Time To Live) settings for LinkedIn headshots
    this.cacheConfigs = {
      // Headshot generation results
      headshot_generation: {
        ttl: 43200, // 12 hours - longer for expensive operations
        namespace: 'headshot',
        compress: true // Headshot data can be large
      },
      
      // Batch processing results
      batch_processing: {
        ttl: 86400, // 24 hours
        namespace: 'batch',
        compress: true
      },
      
      // Photo quality assessments
      photo_quality: {
        ttl: 21600, // 6 hours
        namespace: 'quality',
        compress: false
      },
      
      // User profile data
      user_profile: {
        ttl: 3600, // 1 hour
        namespace: 'user',
        compress: false
      },
      
      // AI prediction results
      ai_predictions: {
        ttl: 32400, // 9 hours - balance between cost and freshness
        namespace: 'ai_pred',
        compress: true
      },
      
      // Style generation cache
      style_generation: {
        ttl: 14400, // 4 hours
        namespace: 'style',
        compress: true
      },
      
      // API rate limiting data
      rate_limiting: {
        ttl: 3600, // 1 hour
        namespace: 'rate',
        compress: false
      },
      
      // Processing status/progress
      processing_status: {
        ttl: 1800, // 30 minutes
        namespace: 'status',
        compress: false
      },
      
      // Image preprocessing results
      image_preprocessing: {
        ttl: 172800, // 48 hours
        namespace: 'imgprep',
        compress: true
      },
      
      // Job queue data
      job_queue_data: {
        ttl: 7200, // 2 hours
        namespace: 'queue',
        compress: false
      },
      
      // LinkedIn-specific optimization data
      linkedin_optimization: {
        ttl: 28800, // 8 hours
        namespace: 'linkedin',
        compress: true
      },
      
      // Performance metrics
      performance_metrics: {
        ttl: 900, // 15 minutes
        namespace: 'metrics',
        compress: false
      }
    };

    // Performance optimization settings
    this.performanceSettings = {
      pipeline_batch_size: 100,
      connection_pool_size: 10,
      retry_attempts: 3,
      timeout_ms: 5000,
      enable_compression: true,
      enable_local_fallback: true
    };

    // Metrics tracking
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      total_operations: 0,
      avg_response_time: 0,
      cache_size: 0
    };
  }

  async initialize() {
    try {
      logger.info('Initializing LinkedIn Headshot Cache Service...');

      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: this.performanceSettings.retry_attempts,
          lazyConnect: true,
          connectTimeout: this.performanceSettings.timeout_ms,
          commandTimeout: this.performanceSettings.timeout_ms,
          maxmemoryPolicy: 'allkeys-lru', // LRU eviction policy
          compression: this.performanceSettings.enable_compression ? 'gzip' : null
        });

        this.redis.on('error', (error) => {
          logger.error('Redis cache error for LinkedIn Headshots:', error);
          this.metrics.errors++;
        });

        this.redis.on('connect', () => {
          logger.info('LinkedIn Headshot Redis cache connected successfully');
        });

        await this.redis.connect();
        
        // Test the connection
        await this.redis.ping();
        logger.info('LinkedIn Headshot Redis cache connection verified');
      } else {
        logger.warn('Redis URL not provided - using local cache only for LinkedIn Headshots');
      }

      this.initialized = true;
      logger.info('LinkedIn Headshot Cache Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('LinkedIn Headshot Cache Service initialization failed:', error);
      // Continue with local cache only
      this.initialized = true;
      return false;
    }
  }

  /**
   * Set cache value with automatic compression and TTL
   */
  async set(key, value, type = 'general', customTTL = null) {
    const startTime = Date.now();
    
    try {
      const config = this.cacheConfigs[type] || { ttl: 3600, namespace: 'general', compress: false };
      const fullKey = `linkedin:${config.namespace}:${key}`;
      const ttl = customTTL || config.ttl;
      
      let serializedValue = JSON.stringify(value);
      
      // Compress large values if enabled
      if (config.compress && serializedValue.length > 1024) {
        serializedValue = await this.compressData(serializedValue);
      }

      if (this.redis) {
        await this.redis.setex(fullKey, ttl, serializedValue);
      } else if (this.performanceSettings.enable_local_fallback) {
        this.setLocalCache(fullKey, { value: serializedValue, expires: Date.now() + (ttl * 1000) });
      }

      this.updateMetrics('set', Date.now() - startTime, true);
      return true;
    } catch (error) {
      logger.error('LinkedIn headshot cache set failed:', { key, type, error: error.message });
      this.updateMetrics('set', Date.now() - startTime, false);
      return false;
    }
  }

  /**
   * Get cache value with automatic decompression
   */
  async get(key, type = 'general') {
    const startTime = Date.now();
    
    try {
      const config = this.cacheConfigs[type] || { ttl: 3600, namespace: 'general', compress: false };
      const fullKey = `linkedin:${config.namespace}:${key}`;
      
      let cachedValue = null;
      
      if (this.redis) {
        cachedValue = await this.redis.get(fullKey);
      } else if (this.performanceSettings.enable_local_fallback) {
        const localData = this.getLocalCache(fullKey);
        if (localData && localData.expires > Date.now()) {
          cachedValue = localData.value;
        }
      }

      if (cachedValue) {
        // Try to decompress if it was compressed
        let decompressedValue = cachedValue;
        if (config.compress && this.isCompressed(cachedValue)) {
          decompressedValue = await this.decompressData(cachedValue);
        }
        
        const parsedValue = JSON.parse(decompressedValue);
        this.updateMetrics('get', Date.now() - startTime, true, true);
        return parsedValue;
      }

      this.updateMetrics('get', Date.now() - startTime, true, false);
      return null;
    } catch (error) {
      logger.error('LinkedIn headshot cache get failed:', { key, type, error: error.message });
      this.updateMetrics('get', Date.now() - startTime, false, false);
      return null;
    }
  }

  /**
   * Cache headshot generation results with specific optimizations
   */
  async cacheHeadshotGeneration(userId, imageHash, style, generationResult, customTTL = null) {
    try {
      const cacheKey = `${userId}:${imageHash}:${style}`;
      return await this.set(cacheKey, generationResult, 'headshot_generation', customTTL);
    } catch (error) {
      logger.error('Failed to cache headshot generation:', error);
      return false;
    }
  }

  /**
   * Get cached headshot generation result
   */
  async getCachedHeadshotGeneration(userId, imageHash, style) {
    try {
      const cacheKey = `${userId}:${imageHash}:${style}`;
      return await this.get(cacheKey, 'headshot_generation');
    } catch (error) {
      logger.error('Failed to get cached headshot generation:', error);
      return null;
    }
  }

  /**
   * Cache batch processing job results
   */
  async cacheBatchJob(jobId, batchResults, customTTL = null) {
    try {
      return await this.set(jobId, batchResults, 'batch_processing', customTTL);
    } catch (error) {
      logger.error('Failed to cache batch job:', error);
      return false;
    }
  }

  /**
   * Get cached batch job results
   */
  async getCachedBatchJob(jobId) {
    try {
      return await this.get(jobId, 'batch_processing');
    } catch (error) {
      logger.error('Failed to get cached batch job:', error);
      return null;
    }
  }

  /**
   * Cache photo quality assessment
   */
  async cachePhotoQuality(imageHash, qualityAssessment, customTTL = null) {
    try {
      return await this.set(imageHash, qualityAssessment, 'photo_quality', customTTL);
    } catch (error) {
      logger.error('Failed to cache photo quality:', error);
      return false;
    }
  }

  /**
   * Get cached photo quality assessment
   */
  async getCachedPhotoQuality(imageHash) {
    try {
      return await this.get(imageHash, 'photo_quality');
    } catch (error) {
      logger.error('Failed to get cached photo quality:', error);
      return null;
    }
  }

  /**
   * Cache with intelligent key generation for LinkedIn operations
   */
  async cacheLinkedInOperation(operation, keyGenerator, type = 'linkedin_optimization', customTTL = null) {
    try {
      const cacheKey = await keyGenerator();
      
      // Try to get from cache first
      const cachedResult = await this.get(cacheKey, type);
      if (cachedResult !== null) {
        return cachedResult;
      }
      
      // Execute operation and cache result
      const result = await operation();
      await this.set(cacheKey, result, type, customTTL);
      
      return result;
    } catch (error) {
      logger.error('LinkedIn cache operation failed:', error);
      // If caching fails, still execute operation
      try {
        return await operation();
      } catch (operationError) {
        throw operationError;
      }
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key, type = 'general') {
    try {
      const config = this.cacheConfigs[type] || { namespace: 'general' };
      const fullKey = `linkedin:${config.namespace}:${key}`;
      
      if (this.redis) {
        await this.redis.del(fullKey);
      }
      
      this.deleteLocalCache(fullKey);
      return true;
    } catch (error) {
      logger.error('LinkedIn headshot cache delete failed:', { key, type, error: error.message });
      return false;
    }
  }

  /**
   * Invalidate cache by pattern (Redis only) - LinkedIn specific
   */
  async invalidateLinkedInPattern(pattern, type = 'general') {
    try {
      if (!this.redis) {
        logger.warn('Pattern invalidation only supported with Redis');
        return false;
      }
      
      const config = this.cacheConfigs[type] || { namespace: 'general' };
      const fullPattern = `linkedin:${config.namespace}:${pattern}`;
      
      const keys = await this.redis.keys(fullPattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
        logger.info(`Invalidated ${keys.length} LinkedIn cache entries matching pattern: ${fullPattern}`);
      }
      
      return true;
    } catch (error) {
      logger.error('LinkedIn cache pattern invalidation failed:', { pattern, type, error: error.message });
      return false;
    }
  }

  /**
   * Pre-warm cache with frequently accessed LinkedIn data
   */
  async warmLinkedInCache(warmingData) {
    try {
      logger.info('Starting LinkedIn cache warming process...');
      let successCount = 0;
      
      for (const [key, value, type, ttl] of warmingData) {
        try {
          await this.set(key, value, type, ttl);
          successCount++;
        } catch (error) {
          logger.warn('Failed to warm LinkedIn cache entry:', { key, error: error.message });
        }
      }
      
      logger.info(`LinkedIn cache warming completed: ${successCount}/${warmingData.length} entries loaded`);
      return successCount;
    } catch (error) {
      logger.error('LinkedIn cache warming failed:', error);
      return 0;
    }
  }

  /**
   * Cache statistics and monitoring for LinkedIn headshots
   */
  getLinkedInStatistics() {
    const hitRate = this.metrics.total_operations > 0 
      ? ((this.metrics.hits / this.metrics.total_operations) * 100).toFixed(2)
      : 0;
    
    return {
      service: 'LinkedIn Headshot Generator',
      hit_rate: `${hitRate}%`,
      total_hits: this.metrics.hits,
      total_misses: this.metrics.misses,
      total_errors: this.metrics.errors,
      total_operations: this.metrics.total_operations,
      avg_response_time_ms: this.metrics.avg_response_time.toFixed(2),
      local_cache_size: this.localCache.size,
      redis_connected: this.redis && this.redis.status === 'ready',
      cache_types: Object.keys(this.cacheConfigs),
      performance_settings: this.performanceSettings
    };
  }

  /**
   * Helper methods
   */
  setLocalCache(key, data) {
    if (this.localCache.size >= this.localCacheMaxSize) {
      // Remove oldest entry (simple LRU)
      const firstKey = this.localCache.keys().next().value;
      this.localCache.delete(firstKey);
    }
    this.localCache.set(key, data);
  }

  getLocalCache(key) {
    return this.localCache.get(key);
  }

  deleteLocalCache(key) {
    this.localCache.delete(key);
  }

  updateMetrics(operation, responseTime, success, hit = null) {
    this.metrics.total_operations++;
    
    if (hit === true) this.metrics.hits++;
    if (hit === false) this.metrics.misses++;
    if (!success) this.metrics.errors++;
    
    // Update average response time
    this.metrics.avg_response_time = (
      (this.metrics.avg_response_time * (this.metrics.total_operations - 1)) + responseTime
    ) / this.metrics.total_operations;
  }

  generateHash(input) {
    // Simple hash function for cache keys
    let hash = 0;
    if (input.length === 0) return hash;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  async compressData(data) {
    // Simple compression placeholder - in production, use gzip or similar
    return `compressed:${Buffer.from(data).toString('base64')}`;
  }

  async decompressData(compressedData) {
    // Simple decompression placeholder
    if (compressedData.startsWith('compressed:')) {
      return Buffer.from(compressedData.substring(11), 'base64').toString();
    }
    return compressedData;
  }

  isCompressed(data) {
    return typeof data === 'string' && data.startsWith('compressed:');
  }

  /**
   * Cache health check
   */
  async healthCheck() {
    try {
      const testKey = 'linkedin_health_check_' + Date.now();
      const testValue = { test: true, timestamp: Date.now(), service: 'LinkedIn Headshots' };
      
      // Test set and get operations
      await this.set(testKey, testValue, 'performance_metrics', 60);
      const retrieved = await this.get(testKey, 'performance_metrics');
      await this.delete(testKey, 'performance_metrics');
      
      const isHealthy = retrieved && retrieved.test === true;
      
      return {
        service: 'LinkedIn Headshot Cache',
        healthy: isHealthy,
        redis_connected: this.redis && this.redis.status === 'ready',
        local_cache_available: true,
        last_check: new Date().toISOString(),
        metrics: this.getLinkedInStatistics()
      };
    } catch (error) {
      logger.error('LinkedIn headshot cache health check failed:', error);
      return {
        service: 'LinkedIn Headshot Cache',
        healthy: false,
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      logger.info('Shutting down LinkedIn Headshot Cache Service...');
      
      if (this.redis) {
        await this.redis.quit();
        logger.info('LinkedIn Headshot Redis connection closed');
      }
      
      this.localCache.clear();
      logger.info('LinkedIn Headshot local cache cleared');
      
      this.initialized = false;
      logger.info('LinkedIn Headshot Cache Service shutdown completed');
    } catch (error) {
      logger.error('LinkedIn Headshot Cache Service shutdown error:', error);
    }
  }
}

module.exports = new CacheService();