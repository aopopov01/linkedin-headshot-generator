const express = require('express');
const db = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    await db.raw('SELECT 1');
    const dbResponseTime = Date.now() - startTime;
    
    // Check environment variables
    const requiredEnvVars = [
      'JWT_SECRET',
      'DB_HOST',
      'DB_NAME',
      'REPLICATE_API_TOKEN',
      'CLOUDINARY_CLOUD_NAME',
      'STRIPE_SECRET_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        connected: true,
        responseTime: `${dbResponseTime}ms`
      },
      services: {
        replicate: !!process.env.REPLICATE_API_TOKEN,
        cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        mixpanel: !!process.env.MIXPANEL_TOKEN
      },
      memory: {
        used: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    };
    
    if (missingEnvVars.length > 0) {
      health.status = 'degraded';
      health.warnings = [`Missing environment variables: ${missingEnvVars.join(', ')}`];
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
    
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

/**
 * Database health check
 */
router.get('/db', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database operations
    const result = await db.raw('SELECT NOW() as current_time, version() as version');
    const responseTime = Date.now() - startTime;
    
    // Get connection pool status
    const pool = db.client.pool;
    
    res.json({
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      database: {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version,
        pool: {
          size: pool.size,
          available: pool.available,
          borrowed: pool.borrowed,
          pending: pool.pending
        }
      }
    });
    
  } catch (error) {
    logger.error('Database health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      database: {
        connected: false
      }
    });
  }
});

/**
 * Service dependencies health check
 */
router.get('/services', async (req, res) => {
  const services = {};
  
  // Test Replicate API
  try {
    if (process.env.REPLICATE_API_TOKEN) {
      // We can't easily test Replicate without making a real call
      services.replicate = {
        status: 'configured',
        configured: true
      };
    } else {
      services.replicate = {
        status: 'not_configured',
        configured: false
      };
    }
  } catch (error) {
    services.replicate = {
      status: 'error',
      error: error.message,
      configured: false
    };
  }
  
  // Test Cloudinary
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      services.cloudinary = {
        status: 'configured',
        configured: true,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME
      };
    } else {
      services.cloudinary = {
        status: 'not_configured',
        configured: false
      };
    }
  } catch (error) {
    services.cloudinary = {
      status: 'error',
      error: error.message,
      configured: false
    };
  }
  
  // Test Stripe
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      services.stripe = {
        status: 'configured',
        configured: true
      };
    } else {
      services.stripe = {
        status: 'not_configured',
        configured: false
      };
    }
  } catch (error) {
    services.stripe = {
      status: 'error',
      error: error.message,
      configured: false
    };
  }
  
  const allHealthy = Object.values(services).every(service => 
    service.status === 'configured'
  );
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services
  });
});

module.exports = router;