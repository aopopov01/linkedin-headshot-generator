/**
 * Security Middleware
 * 
 * Comprehensive security middleware for the OmniShot backend.
 * Includes XSS protection, CSRF protection, request validation, and security headers.
 */

import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import { LoggerService } from '../services/logger.service';
import { RedisService } from '../services/redis.service';
import { APIError } from '../utils/errors';

export class SecurityMiddleware {
  private static logger = new LoggerService('SecurityMiddleware');

  /**
   * XSS Protection middleware
   */
  public static xssProtection = (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = SecurityMiddleware.sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = SecurityMiddleware.sanitizeObject(req.query);
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = SecurityMiddleware.sanitizeObject(req.params);
      }

      next();
    } catch (error) {
      SecurityMiddleware.logger.error('XSS protection failed:', error);
      next(error);
    }
  };

  /**
   * CSRF Protection middleware
   */
  public static csrfProtection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Skip CSRF for API endpoints with proper authentication
      if (req.path.startsWith('/api/') && req.headers.authorization) {
        return next();
      }

      const csrfToken = req.headers['x-csrf-token'] as string;
      
      if (!csrfToken) {
        throw new APIError('CSRF token required', 403);
      }

      // Validate CSRF token
      const isValid = await SecurityMiddleware.validateCSRFToken(csrfToken, req);
      
      if (!isValid) {
        throw new APIError('Invalid CSRF token', 403);
      }

      next();
    } catch (error) {
      SecurityMiddleware.logger.error('CSRF protection failed:', error);
      next(error);
    }
  };

  /**
   * Request validation middleware
   */
  public static requestValidation = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorDetails = errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value,
        location: error.location
      }));

      SecurityMiddleware.logger.warn('Request validation failed:', {
        path: req.path,
        method: req.method,
        errors: errorDetails
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errorDetails
      });
      return;
    }

    next();
  };

  /**
   * SQL Injection protection
   */
  public static sqlInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const suspiciousPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
        /(\'|\-\-|\/\*|\*\/|;)/g,
        /(\b(OR|AND)\b.*=.*)/gi,
        /(script|javascript|vbscript|onload|onerror|onclick)/gi
      ];

      const checkValue = (value: any): boolean => {
        if (typeof value === 'string') {
          return suspiciousPatterns.some(pattern => pattern.test(value));
        }
        return false;
      };

      const checkObject = (obj: any): boolean => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'object' && value !== null) {
              if (checkObject(value)) return true;
            } else if (checkValue(value)) {
              return true;
            }
          }
        }
        return false;
      };

      // Check request body, query, and params
      const suspicious = checkObject({ ...req.body, ...req.query, ...req.params });

      if (suspicious) {
        SecurityMiddleware.logger.security('SQL injection attempt detected', {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          path: req.path,
          method: req.method,
          body: SecurityMiddleware.sanitizeForLog(req.body),
          query: SecurityMiddleware.sanitizeForLog(req.query)
        });

        throw new APIError('Malicious request detected', 400);
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  /**
   * File upload security
   */
  public static fileUploadSecurity = (allowedMimeTypes: string[], maxSize: number = 50 * 1024 * 1024) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const files = req.files as Express.Multer.File[] | undefined;
        const file = req.file as Express.Multer.File | undefined;

        const filesToCheck = files || (file ? [file] : []);

        for (const uploadedFile of filesToCheck) {
          // Check file size
          if (uploadedFile.size > maxSize) {
            throw new APIError(`File too large. Maximum size: ${maxSize} bytes`, 413);
          }

          // Check MIME type
          if (!allowedMimeTypes.includes(uploadedFile.mimetype)) {
            throw new APIError(`File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`, 415);
          }

          // Check file extension
          const allowedExtensions = SecurityMiddleware.getExtensionsFromMimeTypes(allowedMimeTypes);
          const fileExtension = uploadedFile.originalname.toLowerCase().split('.').pop();
          
          if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            throw new APIError(`File extension not allowed`, 415);
          }

          // Basic file content validation (magic numbers)
          SecurityMiddleware.validateFileContent(uploadedFile);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };

  /**
   * IP-based access control
   */
  public static ipAccessControl = (allowedIPs: string[] = [], blockedIPs: string[] = []) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientIP = req.ip || req.connection.remoteAddress || '';

      // Check blocked IPs
      if (blockedIPs.includes(clientIP)) {
        SecurityMiddleware.logger.security('Blocked IP access attempt', {
          ip: clientIP,
          userAgent: req.headers['user-agent'],
          path: req.path
        });

        throw new APIError('Access denied', 403);
      }

      // Check allowed IPs (if specified)
      if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        SecurityMiddleware.logger.security('Unauthorized IP access attempt', {
          ip: clientIP,
          userAgent: req.headers['user-agent'],
          path: req.path
        });

        throw new APIError('Access denied', 403);
      }

      next();
    };
  };

  /**
   * Request size limiter
   */
  public static requestSizeLimiter = (maxSize: number = 10 * 1024 * 1024) => { // 10MB default
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);

      if (contentLength > maxSize) {
        SecurityMiddleware.logger.warn('Request too large', {
          contentLength,
          maxSize,
          ip: req.ip,
          path: req.path
        });

        throw new APIError('Request entity too large', 413);
      }

      next();
    };
  };

  /**
   * Security headers middleware
   */
  public static securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: wss:; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    );

    // Strict Transport Security (HTTPS only)
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Permissions Policy
    res.setHeader('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=()'
    );

    next();
  };

  /**
   * Rate limiting for failed attempts
   */
  public static failedAttemptProtection = (
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    blockDurationMs: number = 60 * 60 * 1000 // 1 hour
  ) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const key = `failed_attempts:${req.ip}`;
        const redis = RedisService.getClient();

        const attempts = await redis.get(key);
        const attemptCount = attempts ? parseInt(attempts, 10) : 0;

        if (attemptCount >= maxAttempts) {
          const ttl = await redis.ttl(key);
          throw new APIError(
            `Too many failed attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`,
            429
          );
        }

        // Store original response methods
        const originalJson = res.json;
        const originalStatus = res.status;

        let statusCode = 200;

        // Override res.status to capture status code
        res.status = function(code: number) {
          statusCode = code;
          return originalStatus.call(this, code);
        };

        // Override res.json to check for authentication failures
        res.json = function(data: any) {
          if (statusCode >= 400 && statusCode < 500) {
            // This is likely a failed attempt
            SecurityMiddleware.incrementFailedAttempts(key, windowMs, blockDurationMs);
          } else if (statusCode === 200 && data.success) {
            // Successful request, clear failed attempts
            redis.del(key).catch(err => 
              SecurityMiddleware.logger.error('Failed to clear attempt counter:', err)
            );
          }

          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        next(error);
      }
    };
  };

  /**
   * Sanitize object recursively
   */
  private static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => SecurityMiddleware.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = SecurityMiddleware.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Validate CSRF token
   */
  private static async validateCSRFToken(token: string, req: Request): Promise<boolean> {
    try {
      // Simple token validation - in production, use more sophisticated methods
      const sessionId = req.headers['x-session-id'] as string;
      if (!sessionId) return false;

      const expectedToken = await RedisService.get(`csrf:${sessionId}`);
      return expectedToken === token;
    } catch (error) {
      SecurityMiddleware.logger.error('CSRF token validation error:', error);
      return false;
    }
  }

  /**
   * Get file extensions from MIME types
   */
  private static getExtensionsFromMimeTypes(mimeTypes: string[]): string[] {
    const mimeToExt: { [key: string]: string[] } = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'image/svg+xml': ['svg'],
      'application/pdf': ['pdf'],
      'text/plain': ['txt'],
      'application/json': ['json']
    };

    const extensions: string[] = [];
    mimeTypes.forEach(mimeType => {
      const exts = mimeToExt[mimeType];
      if (exts) {
        extensions.push(...exts);
      }
    });

    return extensions;
  }

  /**
   * Validate file content using magic numbers
   */
  private static validateFileContent(file: Express.Multer.File): void {
    // This would read file headers to validate actual file type
    // For now, we'll just check basic properties
    if (!file.buffer) {
      return; // Can't validate without buffer
    }

    const header = file.buffer.slice(0, 10);
    
    // Check for common malicious patterns
    const maliciousPatterns = [
      Buffer.from('<?php', 'utf8'),
      Buffer.from('<script', 'utf8'),
      Buffer.from('javascript:', 'utf8')
    ];

    for (const pattern of maliciousPatterns) {
      if (header.includes(pattern)) {
        throw new APIError('Potentially malicious file content detected', 400);
      }
    }
  }

  /**
   * Increment failed attempts counter
   */
  private static async incrementFailedAttempts(
    key: string,
    windowMs: number,
    blockDurationMs: number
  ): Promise<void> {
    try {
      const redis = RedisService.getClient();
      const count = await redis.incr(key);
      
      if (count === 1) {
        // Set initial expiration
        await redis.expire(key, Math.ceil(windowMs / 1000));
      } else if (count >= 5) {
        // Extend block duration for repeated failures
        await redis.expire(key, Math.ceil(blockDurationMs / 1000));
      }
    } catch (error) {
      SecurityMiddleware.logger.error('Failed to increment attempt counter:', error);
    }
  }

  /**
   * Sanitize data for logging
   */
  private static sanitizeForLog(data: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    
    if (typeof data !== 'object' || !data) {
      return data;
    }

    const sanitized = { ...data };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Generate CSRF token
   */
  public static async generateCSRFToken(sessionId: string): Promise<string> {
    const token = SecurityMiddleware.generateRandomToken();
    
    // Store token in Redis with expiration
    await RedisService.set(`csrf:${sessionId}`, token, 3600); // 1 hour
    
    return token;
  }

  /**
   * Generate random token
   */
  private static generateRandomToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export individual middleware functions
export const xssProtection = SecurityMiddleware.xssProtection;
export const csrfProtection = SecurityMiddleware.csrfProtection;
export const requestValidation = SecurityMiddleware.requestValidation;
export const sqlInjectionProtection = SecurityMiddleware.sqlInjectionProtection;
export const securityHeaders = SecurityMiddleware.securityHeaders;
export const fileUploadSecurity = SecurityMiddleware.fileUploadSecurity;
export const ipAccessControl = SecurityMiddleware.ipAccessControl;
export const requestSizeLimiter = SecurityMiddleware.requestSizeLimiter;
export const failedAttemptProtection = SecurityMiddleware.failedAttemptProtection;

// Export main class
export default SecurityMiddleware;