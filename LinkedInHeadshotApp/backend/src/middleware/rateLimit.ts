/**
 * Rate Limiting Middleware
 * 
 * Advanced rate limiting system with Redis backend, multiple strategies,
 * and subscription-tier based limits for the OmniShot backend.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisService } from '../services/redis.service';
import { LoggerService } from '../services/logger.service';
import { MonitoringService } from '../services/monitoring.service';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface TierLimits {
  FREE: number;
  PROFESSIONAL: number;
  BUSINESS: number;
  ENTERPRISE: number;
}

export class RateLimitMiddleware {
  private static logger = new LoggerService('RateLimitMiddleware');
  private static defaultLimits: { [endpoint: string]: TierLimits } = {
    auth: {
      FREE: 10,
      PROFESSIONAL: 20,
      BUSINESS: 30,
      ENTERPRISE: 50
    },
    optimization: {
      FREE: 5,
      PROFESSIONAL: 50,
      BUSINESS: 100,
      ENTERPRISE: 500
    },
    batch: {
      FREE: 1,
      PROFESSIONAL: 5,
      BUSINESS: 10,
      ENTERPRISE: 25
    },
    upload: {
      FREE: 10,
      PROFESSIONAL: 50,
      BUSINESS: 100,
      ENTERPRISE: 200
    },
    export: {
      FREE: 1,
      PROFESSIONAL: 3,
      BUSINESS: 5,
      ENTERPRISE: 10
    },
    api: {
      FREE: 100,
      PROFESSIONAL: 500,
      BUSINESS: 1000,
      ENTERPRISE: 5000
    }
  };

  /**
   * Create rate limit middleware for specific endpoint type
   */
  public static create(
    endpointType: string,
    defaultMax: number = 100,
    windowMs: number = 60 * 1000, // 1 minute
    options: Partial<RateLimitConfig> = {}
  ) {
    return rateLimit({
      windowMs,
      max: defaultMax,
      message: {
        success: false,
        error: `Too many requests for ${endpointType}. Please try again later.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Default key generator uses IP + user ID if available
        const userId = (req as any).user?.id;
        const ip = req.ip || req.connection.remoteAddress;
        return userId ? `user:${userId}` : `ip:${ip}`;
      },
      store: new RedisRateLimitStore(),
      skip: (req) => {
        // Skip rate limiting for certain scenarios
        return RateLimitMiddleware.shouldSkipRateLimit(req);
      },
      handler: (req, res) => {
        RateLimitMiddleware.handleRateLimit(req, res, endpointType);
      },
      onLimitReached: (req) => {
        RateLimitMiddleware.onLimitReached(req, endpointType);
      },
      ...options
    });
  }

  /**
   * Tier-based rate limiting
   */
  public static tierBased(
    endpointType: string,
    windowMs: number = 60 * 1000
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = (req as any).user;
        const tier = user?.tier || 'FREE';
        const limits = RateLimitMiddleware.defaultLimits[endpointType];
        
        if (!limits) {
          RateLimitMiddleware.logger.warn(`No rate limits defined for endpoint type: ${endpointType}`);
          return next();
        }

        const maxRequests = limits[tier] || limits.FREE;
        const key = RateLimitMiddleware.generateKey(req, endpointType);
        
        const result = await RateLimitMiddleware.checkRateLimit(
          key,
          maxRequests,
          windowMs
        );

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - result.count));
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + result.ttl * 1000).toISOString());
        res.setHeader('X-RateLimit-Window', windowMs);

        if (result.exceeded) {
          RateLimitMiddleware.handleRateLimit(req, res, endpointType);
          return;
        }

        next();

      } catch (error) {
        RateLimitMiddleware.logger.error('Rate limit check failed:', error);
        // On error, allow the request to continue
        next();
      }
    };
  }

  /**
   * Sliding window rate limiter
   */
  public static slidingWindow(
    endpointType: string,
    maxRequests: number,
    windowMs: number
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = RateLimitMiddleware.generateKey(req, endpointType);
        const now = Date.now();
        const windowStart = now - windowMs;

        // Use Redis sorted set for sliding window
        const redis = RedisService.getClient();
        const pipeline = redis.pipeline();
        
        // Remove expired entries
        pipeline.zremrangebyscore(key, 0, windowStart);
        
        // Count current requests
        pipeline.zcard(key);
        
        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        
        // Set expiration
        pipeline.expire(key, Math.ceil(windowMs / 1000));

        const results = await pipeline.exec();
        const count = results?.[1]?.[1] as number || 0;

        // Set headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));
        res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

        if (count >= maxRequests) {
          // Remove the request we just added since it's rejected
          await redis.zrem(key, `${now}-${Math.random()}`);
          
          RateLimitMiddleware.handleRateLimit(req, res, endpointType);
          return;
        }

        next();

      } catch (error) {
        RateLimitMiddleware.logger.error('Sliding window rate limit failed:', error);
        next();
      }
    };
  }

  /**
   * Token bucket rate limiter
   */
  public static tokenBucket(
    endpointType: string,
    capacity: number,
    refillRate: number,
    refillInterval: number = 1000
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = RateLimitMiddleware.generateKey(req, `bucket:${endpointType}`);
        const now = Date.now();

        const redis = RedisService.getClient();
        
        // Get current bucket state
        const bucketData = await redis.hmget(key, 'tokens', 'lastRefill');
        let tokens = parseFloat(bucketData[0] || capacity.toString());
        let lastRefill = parseInt(bucketData[1] || now.toString());

        // Calculate tokens to add based on elapsed time
        const timePassed = now - lastRefill;
        const tokensToAdd = Math.floor(timePassed / refillInterval) * refillRate;
        
        tokens = Math.min(capacity, tokens + tokensToAdd);

        if (tokens < 1) {
          const nextRefill = lastRefill + Math.ceil((1 - tokens) / refillRate) * refillInterval;
          
          res.setHeader('X-RateLimit-Limit', capacity);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('X-RateLimit-Reset', new Date(nextRefill).toISOString());
          
          RateLimitMiddleware.handleRateLimit(req, res, endpointType);
          return;
        }

        // Consume one token
        tokens -= 1;

        // Update bucket state
        await redis.hmset(key, 'tokens', tokens.toString(), 'lastRefill', now.toString());
        await redis.expire(key, Math.ceil(capacity / refillRate * refillInterval / 1000));

        // Set headers
        res.setHeader('X-RateLimit-Limit', capacity);
        res.setHeader('X-RateLimit-Remaining', Math.floor(tokens));
        
        next();

      } catch (error) {
        RateLimitMiddleware.logger.error('Token bucket rate limit failed:', error);
        next();
      }
    };
  }

  /**
   * Adaptive rate limiting based on system load
   */
  public static adaptive(
    endpointType: string,
    baseMax: number,
    windowMs: number
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const systemLoad = await RateLimitMiddleware.getSystemLoad();
        const adaptiveMax = RateLimitMiddleware.calculateAdaptiveLimit(baseMax, systemLoad);
        
        // Use the standard tier-based check with adaptive limit
        const user = (req as any).user;
        const key = RateLimitMiddleware.generateKey(req, endpointType);
        
        const result = await RateLimitMiddleware.checkRateLimit(
          key,
          adaptiveMax,
          windowMs
        );

        res.setHeader('X-RateLimit-Limit', adaptiveMax);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, adaptiveMax - result.count));
        res.setHeader('X-RateLimit-Adaptive', 'true');
        res.setHeader('X-System-Load', systemLoad.toString());

        if (result.exceeded) {
          RateLimitMiddleware.handleRateLimit(req, res, endpointType);
          return;
        }

        next();

      } catch (error) {
        RateLimitMiddleware.logger.error('Adaptive rate limit failed:', error);
        next();
      }
    };
  }

  /**
   * Check rate limit against Redis
   */
  private static async checkRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ count: number; ttl: number; exceeded: boolean }> {
    const redis = RedisService.getClient();
    
    // Increment counter
    const count = await redis.incr(key);
    
    if (count === 1) {
      // Set expiration on first request
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }
    
    const ttl = await redis.ttl(key);
    
    return {
      count,
      ttl: ttl > 0 ? ttl : Math.ceil(windowMs / 1000),
      exceeded: count > maxRequests
    };
  }

  /**
   * Generate rate limit key
   */
  private static generateKey(req: Request, endpointType: string): string {
    const user = (req as any).user;
    const userId = user?.id;
    const ip = req.ip || req.connection.remoteAddress;
    
    // Prefer user ID over IP for authenticated requests
    const identifier = userId ? `user:${userId}` : `ip:${ip}`;
    
    return `rate_limit:${endpointType}:${identifier}`;
  }

  /**
   * Handle rate limit exceeded
   */
  private static handleRateLimit(req: Request, res: Response, endpointType: string): void {
    const user = (req as any).user;
    const context = {
      userId: user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      endpoint: req.path,
      method: req.method,
      endpointType
    };

    RateLimitMiddleware.logger.warn('Rate limit exceeded', context);

    // Track in monitoring
    MonitoringService.getInstance().trackRateLimitExceeded(endpointType, context);

    // Send 429 Too Many Requests
    res.status(429).json({
      success: false,
      error: `Too many requests for ${endpointType}. Please try again later.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: parseInt(res.getHeader('X-RateLimit-Reset') as string) || 60
    });
  }

  /**
   * Handle when rate limit is reached (before rejection)
   */
  private static onLimitReached(req: Request, endpointType: string): void {
    const user = (req as any).user;
    
    RateLimitMiddleware.logger.info('Rate limit reached', {
      userId: user?.id,
      endpointType,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  }

  /**
   * Check if rate limiting should be skipped
   */
  private static shouldSkipRateLimit(req: Request): boolean {
    const user = (req as any).user;
    
    // Skip for admins or enterprise users with special permissions
    if (user?.tier === 'ENTERPRISE' && user?.permissions?.includes('skip_rate_limit')) {
      return true;
    }

    // Skip for health checks
    if (req.path.startsWith('/api/health')) {
      return true;
    }

    // Skip for specific user agents (monitoring services)
    const userAgent = req.headers['user-agent']?.toLowerCase();
    if (userAgent?.includes('monitoring') || userAgent?.includes('health-check')) {
      return true;
    }

    return false;
  }

  /**
   * Get system load for adaptive rate limiting
   */
  private static async getSystemLoad(): Promise<number> {
    try {
      // This would integrate with actual system monitoring
      // For now, return a mock value
      const cpuUsage = process.cpuUsage();
      const memUsage = process.memoryUsage();
      
      // Simple load calculation (0-1 scale)
      const memLoad = memUsage.heapUsed / memUsage.heapTotal;
      return Math.min(1, memLoad);
      
    } catch (error) {
      RateLimitMiddleware.logger.error('Failed to get system load:', error);
      return 0.5; // Default to moderate load
    }
  }

  /**
   * Calculate adaptive limit based on system load
   */
  private static calculateAdaptiveLimit(baseMax: number, systemLoad: number): number {
    // Reduce limits when system load is high
    const loadFactor = Math.max(0.1, 1 - systemLoad);
    return Math.floor(baseMax * loadFactor);
  }

  /**
   * Get rate limit status for user
   */
  public static async getRateLimitStatus(
    userId: string,
    endpointType: string,
    windowMs: number = 60 * 1000
  ): Promise<{
    limit: number;
    remaining: number;
    resetTime: Date;
    tier: string;
  }> {
    const key = `rate_limit:${endpointType}:user:${userId}`;
    const redis = RedisService.getClient();
    
    const count = await redis.get(key);
    const ttl = await redis.ttl(key);
    
    // Get user to determine tier limits
    const user = await DatabaseService.getClient().user.findUnique({
      where: { id: userId },
      select: { tier: true }
    });
    
    const tier = user?.tier || 'FREE';
    const limits = RateLimitMiddleware.defaultLimits[endpointType];
    const limit = limits?.[tier] || limits?.FREE || 100;
    
    return {
      limit,
      remaining: Math.max(0, limit - (parseInt(count || '0'))),
      resetTime: new Date(Date.now() + (ttl > 0 ? ttl * 1000 : windowMs)),
      tier
    };
  }

  /**
   * Reset rate limit for user (admin function)
   */
  public static async resetRateLimit(
    userId: string,
    endpointType?: string
  ): Promise<void> {
    const redis = RedisService.getClient();
    
    if (endpointType) {
      const key = `rate_limit:${endpointType}:user:${userId}`;
      await redis.del(key);
    } else {
      // Reset all rate limits for user
      const keys = await redis.keys(`rate_limit:*:user:${userId}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }

    RateLimitMiddleware.logger.info('Rate limit reset', { userId, endpointType });
  }
}

/**
 * Redis-based rate limit store for express-rate-limit
 */
class RedisRateLimitStore {
  public async increment(key: string): Promise<{ totalHits: number; resetTime?: Date }> {
    const redis = RedisService.getClient();
    const count = await redis.incr(key);
    const ttl = await redis.ttl(key);
    
    if (count === 1 && ttl === -1) {
      // Set expiration for new keys
      await redis.expire(key, 60); // 1 minute default
    }
    
    return {
      totalHits: count,
      resetTime: ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined
    };
  }

  public async decrement(key: string): Promise<void> {
    const redis = RedisService.getClient();
    await redis.decr(key);
  }

  public async resetKey(key: string): Promise<void> {
    const redis = RedisService.getClient();
    await redis.del(key);
  }
}

// Export convenience functions for different rate limiting strategies
export const rateLimitMiddleware = (
  endpointType: string,
  max: number = 100,
  windowMs: number = 60 * 1000,
  options?: Partial<RateLimitConfig>
) => RateLimitMiddleware.create(endpointType, max, windowMs, options);

export const tierBasedRateLimit = (
  endpointType: string,
  windowMs: number = 60 * 1000
) => RateLimitMiddleware.tierBased(endpointType, windowMs);

export const slidingWindowRateLimit = (
  endpointType: string,
  maxRequests: number,
  windowMs: number
) => RateLimitMiddleware.slidingWindow(endpointType, maxRequests, windowMs);

export const tokenBucketRateLimit = (
  endpointType: string,
  capacity: number,
  refillRate: number,
  refillInterval?: number
) => RateLimitMiddleware.tokenBucket(endpointType, capacity, refillRate, refillInterval);

export const adaptiveRateLimit = (
  endpointType: string,
  baseMax: number,
  windowMs: number
) => RateLimitMiddleware.adaptive(endpointType, baseMax, windowMs);

export default RateLimitMiddleware;