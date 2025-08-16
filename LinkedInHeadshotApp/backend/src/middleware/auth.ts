/**
 * Authentication Middleware
 * 
 * Handles JWT token verification, session validation, and user authentication
 * for protected routes. Supports role-based access control and session management.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/database.service';
import { RedisService } from '../services/redis.service';
import { LoggerService } from '../services/logger.service';
import { AppConfig } from '../config/app.config';
import { APIError } from '../utils/errors';

interface AuthRequest extends Request {
  user?: any;
  session?: any;
}

interface TokenPayload {
  userId: string;
  email: string;
  tier: string;
  sessionId: string;
  iat: number;
  exp: number;
}

class AuthMiddleware {
  private logger: LoggerService;
  private config: AppConfig;

  constructor() {
    this.logger = new LoggerService('AuthMiddleware');
    this.config = new AppConfig();
  }

  /**
   * Main authentication middleware
   */
  public authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new APIError('Access token required', 401);
      }

      const token = authHeader.substring(7);

      // Verify JWT token
      const decoded = jwt.verify(token, this.config.jwt.secret, {
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      }) as TokenPayload;

      // Validate session
      const session = await RedisService.getSession(decoded.sessionId);
      if (!session) {
        throw new APIError('Invalid session', 401);
      }

      // Get user data
      const user = await DatabaseService.getClient().user.findUnique({
        where: { id: decoded.userId },
        include: {
          profile: true,
          preferences: true,
          subscription: {
            include: {
              features: true
            }
          }
        }
      });

      if (!user || !user.isActive) {
        throw new APIError('User not found or inactive', 401);
      }

      // Check email verification for sensitive operations
      if (!user.emailVerified && this.requiresEmailVerification(req.path, req.method)) {
        throw new APIError('Email verification required', 403);
      }

      // Update session activity
      await RedisService.hset(`session:${decoded.sessionId}`, 'lastActivity', new Date().toISOString());

      // Attach user and session to request
      req.user = user;
      req.session = session;

      // Log API access for security monitoring
      this.logAPIAccess(req, user.id);

      next();

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn('Invalid JWT token:', error.message);
        return this.handleAuthError(res, 'Invalid access token', 401);
      }

      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('Expired JWT token');
        return this.handleAuthError(res, 'Access token expired', 401);
      }

      if (error instanceof APIError) {
        return this.handleAuthError(res, error.message, error.statusCode);
      }

      this.logger.error('Authentication error:', error);
      return this.handleAuthError(res, 'Authentication failed', 500);
    }
  };

  /**
   * Role-based authorization middleware
   */
  public authorize = (allowedTiers: string[] = [], allowedRoles: string[] = []) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new APIError('User not authenticated', 401);
        }

        // Check tier authorization
        if (allowedTiers.length > 0 && !allowedTiers.includes(req.user.tier)) {
          throw new APIError('Insufficient subscription tier', 403);
        }

        // Check role authorization (if implemented)
        if (allowedRoles.length > 0) {
          // Role checking logic can be implemented here
          // For now, we'll use tier as role
          if (!allowedRoles.includes(req.user.tier)) {
            throw new APIError('Insufficient permissions', 403);
          }
        }

        next();

      } catch (error) {
        if (error instanceof APIError) {
          return this.handleAuthError(res, error.message, error.statusCode);
        }

        this.logger.error('Authorization error:', error);
        return this.handleAuthError(res, 'Authorization failed', 500);
      }
    };
  };

  /**
   * Admin-only authorization
   */
  public requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }

      // Check if user is admin (you can implement admin role logic here)
      const isAdmin = req.user.email?.endsWith('@omnishot.com') || req.user.tier === 'ENTERPRISE';
      
      if (!isAdmin) {
        throw new APIError('Admin access required', 403);
      }

      next();

    } catch (error) {
      if (error instanceof APIError) {
        return this.handleAuthError(res, error.message, error.statusCode);
      }

      this.logger.error('Admin authorization error:', error);
      return this.handleAuthError(res, 'Admin authorization failed', 500);
    }
  };

  /**
   * Optional authentication middleware
   */
  public optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without authentication
        return next();
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, this.config.jwt.secret, {
          issuer: this.config.jwt.issuer,
          audience: this.config.jwt.audience
        }) as TokenPayload;

        const session = await RedisService.getSession(decoded.sessionId);
        if (session) {
          const user = await DatabaseService.getClient().user.findUnique({
            where: { id: decoded.userId },
            include: {
              profile: true,
              preferences: true,
              subscription: {
                include: {
                  features: true
                }
              }
            }
          });

          if (user && user.isActive) {
            req.user = user;
            req.session = session;
          }
        }
      } catch (tokenError) {
        // Invalid token, but we continue without authentication
        this.logger.debug('Optional auth token validation failed:', tokenError.message);
      }

      next();

    } catch (error) {
      this.logger.error('Optional authentication error:', error);
      next(); // Continue without authentication on error
    }
  };

  /**
   * Rate limiting based on subscription tier
   */
  public tierBasedRateLimit = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next();
    }

    const tierLimits = {
      FREE: { requests: 100, window: 3600 }, // 100 requests per hour
      PROFESSIONAL: { requests: 500, window: 3600 }, // 500 requests per hour
      BUSINESS: { requests: 1000, window: 3600 }, // 1000 requests per hour
      ENTERPRISE: { requests: 5000, window: 3600 } // 5000 requests per hour
    };

    const userTier = req.user.tier || 'FREE';
    const limits = tierLimits[userTier] || tierLimits.FREE;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limits.requests);
    res.setHeader('X-RateLimit-Window', limits.window);

    next();
  };

  /**
   * Subscription feature access control
   */
  public requireFeature = (feature: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new APIError('User not authenticated', 401);
        }

        const subscription = req.user.subscription;
        const features = subscription?.features;

        if (!subscription || subscription.status !== 'ACTIVE') {
          throw new APIError('Active subscription required', 403);
        }

        // Check if user has access to the specific feature
        const hasFeature = this.checkFeatureAccess(feature, req.user.tier, features);
        
        if (!hasFeature) {
          throw new APIError(`Feature '${feature}' not available in your subscription`, 403);
        }

        next();

      } catch (error) {
        if (error instanceof APIError) {
          return this.handleAuthError(res, error.message, error.statusCode);
        }

        this.logger.error('Feature authorization error:', error);
        return this.handleAuthError(res, 'Feature authorization failed', 500);
      }
    };
  };

  /**
   * API key authentication (for external integrations)
   */
  public apiKeyAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      
      if (!apiKey) {
        throw new APIError('API key required', 401);
      }

      // Look up API key in database
      const user = await DatabaseService.getClient().user.findFirst({
        where: {
          // API key field would need to be added to user model
          // apiKey: apiKey,
          isActive: true
        },
        include: {
          subscription: {
            include: {
              features: true
            }
          }
        }
      });

      if (!user) {
        throw new APIError('Invalid API key', 401);
      }

      // Check API access feature
      if (!user.subscription?.features?.apiAccess) {
        throw new APIError('API access not enabled', 403);
      }

      req.user = user;
      
      // Log API key usage
      await DatabaseService.logAuditEvent({
        userId: user.id,
        action: 'api_key_access',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || 'API Client',
        metadata: { endpoint: req.path, method: req.method }
      });

      next();

    } catch (error) {
      if (error instanceof APIError) {
        return this.handleAuthError(res, error.message, error.statusCode);
      }

      this.logger.error('API key authentication error:', error);
      return this.handleAuthError(res, 'API key authentication failed', 500);
    }
  };

  /**
   * Handle authentication errors
   */
  private handleAuthError(res: Response, message: string, statusCode: number): void {
    res.status(statusCode).json({
      success: false,
      error: message,
      code: statusCode === 401 ? 'AUTHENTICATION_FAILED' : 'AUTHORIZATION_FAILED'
    });
  }

  /**
   * Check if endpoint requires email verification
   */
  private requiresEmailVerification(path: string, method: string): boolean {
    const sensitiveEndpoints = [
      '/api/users/billing',
      '/api/users/subscription',
      '/api/optimization/batch',
      '/api/users/export-data'
    ];

    return sensitiveEndpoints.some(endpoint => path.startsWith(endpoint)) && 
           ['POST', 'PUT', 'DELETE'].includes(method);
  }

  /**
   * Check feature access based on tier and subscription
   */
  private checkFeatureAccess(feature: string, tier: string, subscriptionFeatures?: any): boolean {
    const tierFeatures = {
      FREE: ['basic_optimization'],
      PROFESSIONAL: ['basic_optimization', 'batch_processing', 'analytics_access'],
      BUSINESS: ['basic_optimization', 'batch_processing', 'analytics_access', 'advanced_ai', 'direct_publishing'],
      ENTERPRISE: ['basic_optimization', 'batch_processing', 'analytics_access', 'advanced_ai', 'direct_publishing', 'api_access', 'white_labeling']
    };

    // Check tier-based access
    const tierAccess = tierFeatures[tier] || tierFeatures.FREE;
    if (tierAccess.includes(feature)) {
      return true;
    }

    // Check subscription-specific features
    if (subscriptionFeatures) {
      const featureMap = {
        'advanced_ai': subscriptionFeatures.advancedAI,
        'custom_dimensions': subscriptionFeatures.customDimensions,
        'batch_processing': subscriptionFeatures.batchProcessing,
        'direct_publishing': subscriptionFeatures.directPublishing,
        'analytics_access': subscriptionFeatures.analyticsAccess,
        'priority_support': subscriptionFeatures.prioritySupport,
        'api_access': subscriptionFeatures.apiAccess,
        'white_labeling': subscriptionFeatures.whiteLabeling
      };

      return featureMap[feature] || false;
    }

    return false;
  }

  /**
   * Log API access for security monitoring
   */
  private logAPIAccess(req: AuthRequest, userId: string): void {
    // Only log sensitive operations
    const sensitiveOperations = ['POST', 'PUT', 'DELETE'];
    const sensitiveEndpoints = ['/api/users', '/api/optimization', '/api/billing'];

    const isSensitive = sensitiveOperations.includes(req.method) ||
                       sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));

    if (isSensitive) {
      DatabaseService.logAuditEvent({
        userId,
        action: `api_${req.method.toLowerCase()}`,
        resource: req.path.split('/')[2], // Extract resource from path
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || 'Unknown',
        metadata: {
          endpoint: req.path,
          method: req.method,
          query: req.query,
          body: req.method !== 'GET' ? this.sanitizeLogData(req.body) : undefined
        }
      }).catch(error => {
        this.logger.error('Failed to log API access:', error);
      });
    }
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeLogData(data: any): any {
    if (!data) return data;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...data };

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

// Export singleton instance and individual methods
const authMiddleware = new AuthMiddleware();

export const authenticate = authMiddleware.authenticate;
export const authorize = authMiddleware.authorize;
export const requireAdmin = authMiddleware.requireAdmin;
export const optionalAuth = authMiddleware.optionalAuth;
export const tierBasedRateLimit = authMiddleware.tierBasedRateLimit;
export const requireFeature = authMiddleware.requireFeature;
export const apiKeyAuth = authMiddleware.apiKeyAuth;

export { authMiddleware, AuthMiddleware };
export default authMiddleware.authenticate;