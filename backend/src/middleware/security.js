const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const crypto = require('crypto');
const logger = require('../config/logger');
const db = require('../config/database');

/**
 * General rate limiting middleware
 */
const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
});

/**
 * Strict rate limiting for AI generation endpoints
 */
const aiGenerationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: {
    success: false,
    message: 'AI generation rate limit exceeded. Please wait before generating more photos.'
  },
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return req.user?.id || req.ip;
  }
});

/**
 * Auth rate limiting for login/registration
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  }
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

/**
 * Helmet security configuration
 */
const helmetConfig = helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for mobile apps
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"]
    }
  }
});

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log the request
  logger.info('Request started:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logger.info('Request completed:', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Error handling middleware
 */
const errorHandler = (error, req, res, next) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  });
};

/**
 * Privacy-specific security middleware for GDPR/CCPA compliance
 */

/**
 * Data breach detection middleware
 * Monitors for suspicious access patterns and potential data breaches
 */
const dataBreachDetection = async (req, res, next) => {
  try {
    const { user, ip, path, method } = req;
    
    // Skip monitoring for non-sensitive endpoints
    const sensitiveEndpoints = ['/api/users', '/api/privacy', '/api/photos', '/api/payments'];
    if (!sensitiveEndpoints.some(endpoint => path.startsWith(endpoint))) {
      return next();
    }

    // Detect suspicious patterns
    const suspiciousPatterns = await detectSuspiciousActivity(user?.id, ip, path, method);
    
    if (suspiciousPatterns.length > 0) {
      logger.warn('Suspicious activity detected:', {
        userId: user?.id,
        ip,
        path,
        method,
        patterns: suspiciousPatterns,
        timestamp: new Date().toISOString()
      });

      // Log security incident
      await logSecurityIncident(user?.id, ip, suspiciousPatterns, {
        path,
        method,
        userAgent: req.get('User-Agent')
      });

      // For high-risk patterns, block the request
      const highRiskPatterns = ['mass_data_access', 'rapid_deletion_requests', 'unusual_export_requests'];
      if (suspiciousPatterns.some(pattern => highRiskPatterns.includes(pattern))) {
        return res.status(429).json({
          success: false,
          message: 'Suspicious activity detected. Request blocked for security.',
          incident_id: crypto.randomBytes(16).toString('hex')
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Data breach detection failed:', error);
    next(); // Don't block requests if detection fails
  }
};

/**
 * Consent validation middleware
 * Ensures user has valid consent for data processing operations
 */
const consentValidation = async (req, res, next) => {
  try {
    const { user, path, method } = req;

    // Skip validation for essential operations
    const essentialPaths = ['/api/auth', '/api/privacy/preferences', '/health'];
    if (essentialPaths.some(endpoint => path.startsWith(endpoint))) {
      return next();
    }

    if (!user) {
      return next(); // Anonymous users don't need consent validation
    }

    // Check if operation requires specific consent
    const requiredConsent = getRequiredConsent(path, method);
    if (!requiredConsent) {
      return next();
    }

    // Validate user consent
    const hasValidConsent = await validateUserConsent(user.id, requiredConsent);
    if (!hasValidConsent) {
      return res.status(403).json({
        success: false,
        message: `This operation requires ${requiredConsent} consent.`,
        required_consent: requiredConsent,
        consent_url: '/api/privacy/preferences'
      });
    }

    next();
  } catch (error) {
    logger.error('Consent validation failed:', error);
    next(); // Don't block requests if validation fails
  }
};

/**
 * Data minimization middleware
 * Ensures only necessary data is processed and returned
 */
const dataMinimization = (req, res, next) => {
  // Store original JSON method
  const originalJson = res.json;
  
  res.json = function(data) {
    try {
      // Apply data minimization rules
      const minimizedData = minimizeResponseData(data, req.path, req.user);
      return originalJson.call(this, minimizedData);
    } catch (error) {
      logger.error('Data minimization failed:', error);
      return originalJson.call(this, data);
    }
  };

  next();
};

/**
 * Privacy-compliant request logging
 * Logs requests with anonymized/minimal data for privacy compliance
 */
const privacyCompliantLogger = (req, res, next) => {
  const start = Date.now();

  // Anonymize sensitive data in logs
  const sanitizedBody = sanitizeLogData(req.body);
  const sanitizedQuery = sanitizeLogData(req.query);

  logger.info('Privacy-compliant request:', {
    method: req.method,
    path: req.path,
    userAgent: anonymizeUserAgent(req.get('User-Agent')),
    ip: anonymizeIP(req.ip),
    userId: req.user?.id ? hashUserId(req.user.id) : null,
    hasBody: !!req.body && Object.keys(req.body).length > 0,
    timestamp: new Date().toISOString()
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Privacy-compliant response:', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id ? hashUserId(req.user.id) : null,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

// Helper Functions

async function detectSuspiciousActivity(userId, ip, path, method) {
  const patterns = [];
  const timeWindow = 5 * 60 * 1000; // 5 minutes
  const now = new Date();
  const windowStart = new Date(now.getTime() - timeWindow);

  try {
    // Check for rapid data access requests
    if (path.includes('/api/users/') || path.includes('/api/privacy/')) {
      const recentRequests = await db('request_logs')
        .where('ip_address', ip)
        .where('created_at', '>=', windowStart)
        .where('path', 'like', '%/api/users/%')
        .orWhere('path', 'like', '%/api/privacy/%')
        .count('id as count')
        .first();

      if (recentRequests && recentRequests.count > 20) {
        patterns.push('rapid_data_access');
      }
    }

    // Check for unusual export requests
    if (path.includes('/api/privacy/portability-request')) {
      const recentExports = await db('privacy_requests')
        .where(function() {
          this.where('user_id', userId).orWhere('ip_address', ip);
        })
        .where('request_type', 'portability')
        .where('created_at', '>=', windowStart)
        .count('id as count')
        .first();

      if (recentExports && recentExports.count > 3) {
        patterns.push('unusual_export_requests');
      }
    }

    // Check for mass deletion attempts
    if (path.includes('/api/privacy/deletion-request') || method === 'DELETE') {
      const recentDeletions = await db('privacy_requests')
        .where(function() {
          this.where('user_id', userId).orWhere('ip_address', ip);
        })
        .where('request_type', 'deletion')
        .where('created_at', '>=', windowStart)
        .count('id as count')
        .first();

      if (recentDeletions && recentDeletions.count > 1) {
        patterns.push('rapid_deletion_requests');
      }
    }

  } catch (error) {
    logger.error('Error detecting suspicious activity:', error);
  }

  return patterns;
}

async function logSecurityIncident(userId, ip, patterns, metadata) {
  try {
    await db('data_breaches').insert({
      breach_type: 'suspicious_activity',
      description: `Suspicious patterns detected: ${patterns.join(', ')}`,
      detected_at: new Date(),
      occurred_at: new Date(),
      affected_data_types: JSON.stringify(['user_data', 'access_patterns']),
      consequences: 'Monitoring and potential rate limiting applied',
      measures_taken: 'Logged incident and applied security restrictions',
      status: 'investigating',
      metadata: JSON.stringify({
        userId,
        ip: anonymizeIP(ip),
        patterns,
        ...metadata
      }),
      created_at: new Date()
    });
  } catch (error) {
    logger.error('Failed to log security incident:', error);
  }
}

function getRequiredConsent(path, method) {
  // Define consent requirements for different operations
  const consentRules = {
    '/api/analytics': 'analytics',
    '/api/users/analytics': 'analytics',
    '/api/photos/generate': 'personalization', // For style recommendations
    '/api/marketing': 'marketing'
  };

  for (const [pathPattern, consent] of Object.entries(consentRules)) {
    if (path.startsWith(pathPattern)) {
      return consent;
    }
  }

  return null;
}

async function validateUserConsent(userId, consentType) {
  try {
    const user = await db('users').where('id', userId).select('preferences').first();
    
    if (!user || !user.preferences) {
      return false;
    }

    const preferences = JSON.parse(user.preferences);
    const consentField = `${consentType}_consent`;
    
    return preferences[consentField] === true;
  } catch (error) {
    logger.error('Consent validation error:', error);
    return false;
  }
}

function minimizeResponseData(data, path, user) {
  // Apply data minimization based on the endpoint and user consent
  if (!data || typeof data !== 'object') {
    return data;
  }

  const minimized = { ...data };

  // Remove sensitive fields from user data responses
  if (path.includes('/api/users')) {
    const sensitiveFields = ['password_hash', 'stripe_customer_id', 'device_tokens'];
    sensitiveFields.forEach(field => {
      if (minimized.data && minimized.data.user) {
        delete minimized.data.user[field];
      }
    });
  }

  // Remove detailed analytics data if user hasn't consented
  if (path.includes('/api/analytics') && user) {
    // Check user consent and filter data accordingly
    // This would be implemented based on specific consent preferences
  }

  return minimized;
}

function sanitizeLogData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'credit_card', 'ssn', 'email'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

function anonymizeUserAgent(userAgent) {
  if (!userAgent) return null;
  
  // Keep only the browser type, remove detailed version/device info
  const browser = userAgent.split(' ')[0];
  return `${browser}/[VERSION_ANONYMIZED]`;
}

function anonymizeIP(ip) {
  if (!ip) return null;
  
  // IPv4: Replace last octet with 0
  // IPv6: Replace last 80 bits with zeros
  if (ip.includes(':')) {
    // IPv6
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + '::0';
  } else {
    // IPv4
    const parts = ip.split('.');
    return parts.slice(0, 3).join('.') + '.0';
  }
}

function hashUserId(userId) {
  return crypto.createHash('sha256').update(userId.toString()).digest('hex').substring(0, 8);
}

module.exports = {
  generalRateLimit,
  aiGenerationRateLimit,
  authRateLimit,
  corsOptions,
  helmetConfig,
  requestLogger,
  errorHandler,
  compression: compression(),
  // Privacy-specific middleware
  dataBreachDetection,
  consentValidation,
  dataMinimization,
  privacyCompliantLogger
};