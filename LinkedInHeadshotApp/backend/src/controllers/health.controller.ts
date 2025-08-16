/**
 * Health Controller
 * Provides comprehensive health monitoring and system diagnostics
 * Implements endpoints for Kubernetes probes and monitoring systems
 */

import { Request, Response } from 'express';
import { DatabaseService } from '../services/database.service';
import { RedisService } from '../services/redis.service';
import { JobQueueService } from '../services/jobQueue.service';
import { logger } from '../services/logger.service';

// Import AI services for health checks
const { IntelligentImageProcessor } = require('../services/intelligentImageProcessor.js');
const { APIIntegrationLayer } = require('../services/apiIntegrationLayer.js');
const { CostOptimizationService } = require('../services/costOptimizationService.js');
const { PromptEngineeringService } = require('../services/promptEngineeringService.js');

export class HealthController {
  private imageProcessor: any;
  private apiIntegration: any;
  private costOptimization: any;
  private promptEngineering: any;

  constructor() {
    // Initialize AI services for health checks
    this.imageProcessor = new IntelligentImageProcessor();
    this.apiIntegration = new APIIntegrationLayer();
    this.costOptimization = new CostOptimizationService();
    this.promptEngineering = new PromptEngineeringService();
  }

  /**
   * Basic health check - simple status endpoint
   */
  basicHealth = async (req: Request, res: Response) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        node: process.version
      };

      res.json(health);
    } catch (error) {
      logger.error('Basic health check failed', { error: error.message });
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Detailed health check with all service statuses
   */
  detailedHealth = async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      
      // Check all services concurrently
      const [
        databaseHealth,
        redisHealth,
        queueHealth,
        aiServicesHealth
      ] = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
        this.checkQueueHealth(),
        this.checkAIServicesHealth()
      ]);

      const processingTime = Date.now() - startTime;

      // Determine overall status
      const services = {
        database: this.getHealthResult(databaseHealth),
        redis: this.getHealthResult(redisHealth),
        queue: this.getHealthResult(queueHealth),
        aiServices: this.getHealthResult(aiServicesHealth)
      };

      const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length;
      const totalServices = Object.keys(services).length;
      const overallStatus = healthyServices === totalServices ? 'healthy' : 
                           healthyServices > totalServices / 2 ? 'degraded' : 'unhealthy';

      const health = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        processingTime: `${processingTime}ms`,
        services,
        summary: {
          total: totalServices,
          healthy: healthyServices,
          unhealthy: totalServices - healthyServices,
          healthPercentage: Math.round((healthyServices / totalServices) * 100)
        },
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024)
          },
          cpu: {
            loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
          }
        }
      };

      const responseStatus = overallStatus === 'healthy' ? 200 : 
                           overallStatus === 'degraded' ? 207 : 503;

      res.status(responseStatus).json(health);

    } catch (error) {
      logger.error('Detailed health check failed', { error: error.message, stack: error.stack });
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check service failure',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Kubernetes readiness probe
   */
  readinessProbe = async (req: Request, res: Response) => {
    try {
      // Check if application is ready to receive traffic
      const readinessChecks = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
        this.checkCriticalAIServices()
      ]);

      const allReady = readinessChecks.every(result => 
        result.status === 'fulfilled' && result.value.status === 'healthy'
      );

      if (allReady) {
        res.json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          checks: readinessChecks.map((result, index) => ({
            service: ['database', 'redis', 'ai_critical'][index],
            ready: result.status === 'fulfilled' && result.value.status === 'healthy'
          }))
        });
      }
    } catch (error) {
      logger.error('Readiness probe failed', { error: error.message });
      res.status(503).json({
        status: 'not_ready',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Kubernetes liveness probe
   */
  livenessProbe = async (req: Request, res: Response) => {
    try {
      // Simple check if application is alive
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      // Check for memory leaks or unhealthy state
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      const isMemoryHealthy = heapUsedMB < 1000; // Less than 1GB

      if (isMemoryHealthy && uptime > 0) {
        res.json({
          status: 'alive',
          uptime: uptime,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          uptime: uptime,
          memoryUsedMB: Math.round(heapUsedMB),
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Liveness probe failed', { error: error.message });
      res.status(503).json({
        status: 'dead',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * System metrics endpoint
   */
  systemMetrics = async (req: Request, res: Response) => {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          heapUsed: process.memoryUsage().heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss
        },
        cpu: {
          usage: process.cpuUsage(),
          loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
        },
        system: {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          pid: process.pid
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          port: process.env.PORT,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      // Add AI service metrics if available
      try {
        const aiMetrics = await this.getAIMetrics();
        metrics['aiServices'] = aiMetrics;
      } catch (error) {
        logger.warn('Could not retrieve AI metrics', { error: error.message });
      }

      res.json(metrics);

    } catch (error) {
      logger.error('System metrics retrieval failed', { error: error.message });
      res.status(500).json({
        error: 'Unable to retrieve system metrics',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Private helper methods

  private async checkDatabaseHealth() {
    try {
      return await DatabaseService.healthCheck();
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  private async checkRedisHealth() {
    try {
      return await RedisService.healthCheck();
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  private async checkQueueHealth() {
    try {
      return await JobQueueService.healthCheck();
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  private async checkAIServicesHealth() {
    try {
      const [
        imageProcessorHealth,
        apiIntegrationHealth,
        costOptimizationHealth,
        promptEngineeringHealth
      ] = await Promise.allSettled([
        this.imageProcessor.healthCheck(),
        this.apiIntegration.healthCheck(),
        this.costOptimization.healthCheck(),
        this.promptEngineering.healthCheck()
      ]);

      const services = {
        imageProcessor: this.getHealthResult(imageProcessorHealth),
        apiIntegration: this.getHealthResult(apiIntegrationHealth),
        costOptimization: this.getHealthResult(costOptimizationHealth),
        promptEngineering: this.getHealthResult(promptEngineeringHealth)
      };

      const healthyCount = Object.values(services).filter(s => s.status === 'healthy').length;
      const totalCount = Object.keys(services).length;

      return {
        status: healthyCount === totalCount ? 'healthy' : 
                healthyCount > totalCount / 2 ? 'degraded' : 'unhealthy',
        services,
        summary: {
          healthy: healthyCount,
          total: totalCount,
          percentage: Math.round((healthyCount / totalCount) * 100)
        }
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  private async checkCriticalAIServices() {
    try {
      // Check only critical AI services for readiness
      const imageProcessorHealth = await this.imageProcessor.healthCheck();
      const apiIntegrationHealth = await this.apiIntegration.healthCheck();

      const criticalHealthy = imageProcessorHealth.status === 'healthy' && 
                             apiIntegrationHealth.status === 'healthy';

      return {
        status: criticalHealthy ? 'healthy' : 'unhealthy',
        critical: {
          imageProcessor: imageProcessorHealth.status,
          apiIntegration: apiIntegrationHealth.status
        }
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  private async getAIMetrics() {
    try {
      return {
        imageProcessor: this.imageProcessor.getMetrics(),
        apiIntegration: this.apiIntegration.getMetrics(),
        costOptimization: this.costOptimization.getMetrics(),
        promptEngineering: this.promptEngineering.getMetrics()
      };
    } catch (error) {
      throw new Error(`AI metrics retrieval failed: ${error.message}`);
    }
  }

  private getHealthResult(promiseResult: PromiseSettledResult<any>) {
    if (promiseResult.status === 'fulfilled') {
      return promiseResult.value;
    } else {
      return {
        status: 'unhealthy',
        error: promiseResult.reason?.message || 'Unknown error'
      };
    }
  }
}