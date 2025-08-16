/**
 * Health Check Routes
 * 
 * Provides system health monitoring, status checks, and diagnostics.
 * These endpoints are used by load balancers, monitoring systems,
 * and DevOps tools to assess system health.
 */

import express from 'express';
import { HealthController } from '../controllers/health.controller';
import { DatabaseService } from '../services/database.service';
import { RedisService } from '../services/redis.service';
import { JobQueueService } from '../services/jobQueue.service';

const router = express.Router();
const healthController = new HealthController();

/**
 * @route GET /api/health
 * @desc Basic health check
 * @access Public
 */
router.get('/', healthController.basicHealth);

/**
 * @route GET /api/health/detailed
 * @desc Detailed health check with service status
 * @access Public
 */
router.get('/detailed', healthController.detailedHealth);

/**
 * @route GET /api/health/ready
 * @desc Readiness probe for Kubernetes
 * @access Public
 */
router.get('/ready', healthController.readinessProbe);

/**
 * @route GET /api/health/live
 * @desc Liveness probe for Kubernetes
 * @access Public
 */
router.get('/live', healthController.livenessProbe);

/**
 * @route GET /api/health/metrics
 * @desc System metrics and statistics
 * @access Public
 */
router.get('/metrics', healthController.systemMetrics);

/**
 * @route GET /api/health/database
 * @desc Database connection health
 * @access Public
 */
router.get('/database', async (req, res) => {
  try {
    const health = await DatabaseService.healthCheck();
    res.status(health.connection ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      connection: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/health/redis
 * @desc Redis connection health
 * @access Public
 */
router.get('/redis', async (req, res) => {
  try {
    const health = await RedisService.healthCheck();
    res.status(health.connection ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      connection: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/health/queue
 * @desc Job queue health
 * @access Public
 */
router.get('/queue', async (req, res) => {
  try {
    const health = await JobQueueService.healthCheck();
    res.status(health.connection ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      connection: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/health/ai
 * @desc AI services health check
 * @access Public
 */
router.get('/ai', async (req, res) => {
  try {
    // Import AI services for health checks
    const { IntelligentImageProcessor } = require('../services/intelligentImageProcessor.js');
    const { APIIntegrationLayer } = require('../services/apiIntegrationLayer.js');
    const { CostOptimizationService } = require('../services/costOptimizationService.js');
    const { PromptEngineeringService } = require('../services/promptEngineeringService.js');

    const imageProcessor = new IntelligentImageProcessor();
    const apiIntegration = new APIIntegrationLayer();
    const costOptimization = new CostOptimizationService();
    const promptEngineering = new PromptEngineeringService();

    const [
      imageProcessorHealth,
      apiIntegrationHealth,
      costOptimizationHealth,
      promptEngineeringHealth
    ] = await Promise.allSettled([
      imageProcessor.healthCheck(),
      apiIntegration.healthCheck(),
      costOptimization.healthCheck(),
      promptEngineering.healthCheck()
    ]);

    const services = {
      imageProcessor: imageProcessorHealth.status === 'fulfilled' ? imageProcessorHealth.value : { status: 'unhealthy', error: imageProcessorHealth.reason?.message },
      apiIntegration: apiIntegrationHealth.status === 'fulfilled' ? apiIntegrationHealth.value : { status: 'unhealthy', error: apiIntegrationHealth.reason?.message },
      costOptimization: costOptimizationHealth.status === 'fulfilled' ? costOptimizationHealth.value : { status: 'unhealthy', error: costOptimizationHealth.reason?.message },
      promptEngineering: promptEngineeringHealth.status === 'fulfilled' ? promptEngineeringHealth.value : { status: 'unhealthy', error: promptEngineeringHealth.reason?.message }
    };

    const healthyCount = Object.values(services).filter((s: any) => s.status === 'healthy').length;
    const totalCount = Object.keys(services).length;
    const overallStatus = healthyCount === totalCount ? 'healthy' : 
                         healthyCount > totalCount / 2 ? 'degraded' : 'unhealthy';

    const responseStatus = overallStatus === 'healthy' ? 200 : 
                          overallStatus === 'degraded' ? 207 : 503;

    res.status(responseStatus).json({
      status: overallStatus,
      services,
      summary: {
        healthy: healthyCount,
        total: totalCount,
        percentage: Math.round((healthyCount / totalCount) * 100)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/ai/providers
 * @desc AI provider connectivity status
 * @access Public
 */
router.get('/ai/providers', async (req, res) => {
  try {
    const { APIIntegrationLayer } = require('../services/apiIntegrationLayer.js');
    const apiIntegration = new APIIntegrationLayer();
    
    const providerHealth = await apiIntegration.healthCheckProviders();
    const availableProviders = Object.values(providerHealth).filter((p: any) => p.status === 'healthy').length;
    const totalProviders = Object.keys(providerHealth).length;

    res.json({
      status: availableProviders > 0 ? 'healthy' : 'unhealthy',
      providers: providerHealth,
      summary: {
        available: availableProviders,
        total: totalProviders,
        availability: Math.round((availableProviders / totalProviders) * 100)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/version
 * @desc Application version information
 * @access Public
 */
router.get('/version', (req, res) => {
  res.json({
    name: 'OmniShot Backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default router;