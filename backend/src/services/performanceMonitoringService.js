/**
 * Performance Monitoring Service
 * Comprehensive real-time performance monitoring, metrics collection, and alerting
 */

const logger = require('../config/logger');
const cacheService = require('./advancedCacheService');
const databaseService = require('./databaseOptimizationService');
const os = require('os');
const fs = require('fs').promises;
const EventEmitter = require('events');

class PerformanceMonitoringService extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      system: {
        cpu: [],
        memory: [],
        disk: [],
        network: []
      },
      application: {
        requests: [],
        responses: [],
        errors: [],
        database: []
      },
      business: {
        photoGenerations: [],
        userRegistrations: [],
        payments: []
      }
    };

    this.alerts = {
      rules: [],
      history: []
    };

    this.thresholds = {
      cpu_usage: 80, // 80%
      memory_usage: 85, // 85%
      response_time: 2000, // 2 seconds
      error_rate: 5, // 5%
      database_connections: 90, // 90% of pool
      cache_hit_rate: 70, // 70%
      disk_usage: 85, // 85%
      queue_length: 100 // 100 items
    };

    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.metricsRetention = 24 * 60 * 60 * 1000; // 24 hours
    this.alertCooldown = 5 * 60 * 1000; // 5 minutes
    this.lastAlerts = new Map();
  }

  /**
   * Start performance monitoring
   */
  async startMonitoring(intervalMs = 30000) { // 30 seconds default
    if (this.isMonitoring) {
      logger.warn('Performance monitoring already running');
      return;
    }

    logger.info('🚀 Starting performance monitoring');
    this.isMonitoring = true;

    // Initialize alert rules
    this.initializeAlertRules();

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.evaluateAlerts();
        await this.cleanupOldMetrics();
      } catch (error) {
        logger.error('Error in monitoring cycle:', error);
      }
    }, intervalMs);

    // Initial metrics collection
    await this.collectMetrics();
    
    logger.info('✅ Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    logger.info('⏹️ Stopping performance monitoring');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Collect comprehensive performance metrics
   */
  async collectMetrics() {
    const timestamp = Date.now();

    try {
      // System metrics
      const systemMetrics = await this.collectSystemMetrics();
      this.addMetric('system', systemMetrics, timestamp);

      // Application metrics
      const appMetrics = await this.collectApplicationMetrics();
      this.addMetric('application', appMetrics, timestamp);

      // Database metrics
      const dbMetrics = await this.collectDatabaseMetrics();
      this.addMetric('database', dbMetrics, timestamp);

      // Cache metrics
      const cacheMetrics = await this.collectCacheMetrics();
      this.addMetric('cache', cacheMetrics, timestamp);

      // External service metrics
      const externalMetrics = await this.collectExternalServiceMetrics();
      this.addMetric('external', externalMetrics, timestamp);

      // Emit metrics event for real-time updates
      this.emit('metrics_collected', {
        timestamp,
        system: systemMetrics,
        application: appMetrics,
        database: dbMetrics,
        cache: cacheMetrics,
        external: externalMetrics
      });

    } catch (error) {
      logger.error('Failed to collect metrics:', error);
    }
  }

  /**
   * Collect system-level metrics
   */
  async collectSystemMetrics() {
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    const diskUsage = await this.getDiskUsage();
    const networkStats = await this.getNetworkStats();

    return {
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        heap: process.memoryUsage()
      },
      disk: diskUsage,
      network: networkStats,
      uptime: {
        system: os.uptime(),
        process: process.uptime()
      }
    };
  }

  /**
   * Collect application-level metrics
   */
  async collectApplicationMetrics() {
    return {
      requests: {
        total: this.getMetricSum('application.requests'),
        perSecond: this.getMetricRate('application.requests'),
        byStatus: this.getMetricBreakdown('application.requests', 'status')
      },
      responses: {
        averageTime: this.getMetricAverage('application.responses'),
        p95: this.getMetricPercentile('application.responses', 95),
        p99: this.getMetricPercentile('application.responses', 99)
      },
      errors: {
        total: this.getMetricSum('application.errors'),
        rate: this.getMetricRate('application.errors'),
        byType: this.getMetricBreakdown('application.errors', 'type')
      },
      activeConnections: this.getActiveConnections(),
      eventLoop: {
        lag: this.getEventLoopLag()
      }
    };
  }

  /**
   * Collect database metrics
   */
  async collectDatabaseMetrics() {
    try {
      const dbStats = await databaseService.getDatabaseStats();
      const performanceTest = await databaseService.testDatabasePerformance();

      return {
        connectionPool: dbStats.connectionPool,
        queryStats: dbStats.queryStats,
        performanceTest: performanceTest,
        slowQueries: dbStats.slowQueries?.length || 0,
        tableSizes: dbStats.tableSizes
      };
    } catch (error) {
      logger.error('Failed to collect database metrics:', error);
      return null;
    }
  }

  /**
   * Collect cache metrics
   */
  async collectCacheMetrics() {
    try {
      const cacheStats = cacheService.getCacheStats();
      const healthCheck = await cacheService.healthCheck();

      return {
        ...cacheStats,
        health: healthCheck,
        memoryUsage: await this.getCacheMemoryUsage()
      };
    } catch (error) {
      logger.error('Failed to collect cache metrics:', error);
      return null;
    }
  }

  /**
   * Collect external service metrics
   */
  async collectExternalServiceMetrics() {
    const services = {
      replicate: await this.testExternalService('replicate'),
      cloudinary: await this.testExternalService('cloudinary'),
      stripe: await this.testExternalService('stripe')
    };

    return services;
  }

  /**
   * Initialize alert rules
   */
  initializeAlertRules() {
    this.alerts.rules = [
      {
        name: 'High CPU Usage',
        condition: (metrics) => metrics.system?.cpu?.usage > this.thresholds.cpu_usage,
        severity: 'warning',
        message: (metrics) => `CPU usage is ${metrics.system.cpu.usage.toFixed(2)}% (threshold: ${this.thresholds.cpu_usage}%)`
      },
      {
        name: 'High Memory Usage',
        condition: (metrics) => metrics.system?.memory?.usage > this.thresholds.memory_usage,
        severity: 'warning',
        message: (metrics) => `Memory usage is ${metrics.system.memory.usage.toFixed(2)}% (threshold: ${this.thresholds.memory_usage}%)`
      },
      {
        name: 'High Response Time',
        condition: (metrics) => metrics.application?.responses?.p95 > this.thresholds.response_time,
        severity: 'warning',
        message: (metrics) => `95th percentile response time is ${metrics.application.responses.p95}ms (threshold: ${this.thresholds.response_time}ms)`
      },
      {
        name: 'High Error Rate',
        condition: (metrics) => metrics.application?.errors?.rate > this.thresholds.error_rate,
        severity: 'critical',
        message: (metrics) => `Error rate is ${metrics.application.errors.rate.toFixed(2)}% (threshold: ${this.thresholds.error_rate}%)`
      },
      {
        name: 'Database Connection Pool Full',
        condition: (metrics) => {
          const pool = metrics.database?.connectionPool;
          return pool && (pool.used / pool.max) * 100 > this.thresholds.database_connections;
        },
        severity: 'critical',
        message: (metrics) => {
          const pool = metrics.database.connectionPool;
          const usage = (pool.used / pool.max) * 100;
          return `Database connection pool is ${usage.toFixed(2)}% full (${pool.used}/${pool.max})`;
        }
      },
      {
        name: 'Low Cache Hit Rate',
        condition: (metrics) => metrics.cache?.hitRate < this.thresholds.cache_hit_rate,
        severity: 'warning',
        message: (metrics) => `Cache hit rate is ${metrics.cache.hitRate.toFixed(2)}% (threshold: ${this.thresholds.cache_hit_rate}%)`
      },
      {
        name: 'Service Unavailable',
        condition: (metrics) => {
          return Object.values(metrics.external || {}).some(service => 
            service && !service.available
          );
        },
        severity: 'critical',
        message: (metrics) => {
          const unavailable = Object.entries(metrics.external || {})
            .filter(([, service]) => service && !service.available)
            .map(([name]) => name);
          return `External services unavailable: ${unavailable.join(', ')}`;
        }
      }
    ];
  }

  /**
   * Evaluate alerts based on current metrics
   */
  async evaluateAlerts() {
    const latestMetrics = this.getLatestMetrics();
    
    for (const rule of this.alerts.rules) {
      try {
        if (rule.condition(latestMetrics)) {
          await this.triggerAlert(rule, latestMetrics);
        }
      } catch (error) {
        logger.error(`Error evaluating alert rule ${rule.name}:`, error);
      }
    }
  }

  /**
   * Trigger alert with cooldown management
   */
  async triggerAlert(rule, metrics) {
    const alertKey = rule.name;
    const now = Date.now();
    const lastAlert = this.lastAlerts.get(alertKey);

    // Check cooldown period
    if (lastAlert && (now - lastAlert) < this.alertCooldown) {
      return;
    }

    const alert = {
      timestamp: now,
      rule: rule.name,
      severity: rule.severity,
      message: rule.message(metrics),
      metrics: this.sanitizeMetricsForAlert(metrics)
    };

    // Store alert
    this.alerts.history.push(alert);
    this.lastAlerts.set(alertKey, now);

    // Log alert
    const logLevel = rule.severity === 'critical' ? 'error' : 'warn';
    logger[logLevel](`🚨 ALERT: ${alert.message}`, {
      rule: rule.name,
      severity: rule.severity
    });

    // Emit alert event
    this.emit('alert_triggered', alert);

    // Send notifications (implement based on requirements)
    await this.sendAlertNotification(alert);
  }

  /**
   * Get CPU usage percentage
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startMeasure = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endMeasure = process.cpuUsage(startMeasure);
        const endTime = Date.now();
        const timeDiff = endTime - startTime;
        
        const userCPU = endMeasure.user / 1000; // Convert to milliseconds
        const systemCPU = endMeasure.system / 1000;
        const totalCPU = userCPU + systemCPU;
        
        const usage = (totalCPU / timeDiff) * 100;
        resolve(Math.min(usage, 100)); // Cap at 100%
      }, 100);
    });
  }

  /**
   * Get memory usage details
   */
  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    
    return {
      total,
      free,
      used,
      usage: (used / total) * 100,
      heap: process.memoryUsage()
    };
  }

  /**
   * Get disk usage
   */
  async getDiskUsage() {
    try {
      const stats = await fs.stat(process.cwd());
      // This is a simplified version - in production, use a proper disk usage library
      return {
        total: 0,
        used: 0,
        free: 0,
        usage: 0
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get network statistics (simplified)
   */
  async getNetworkStats() {
    const networkInterfaces = os.networkInterfaces();
    return {
      interfaces: Object.keys(networkInterfaces).length,
      // In production, implement actual network metrics collection
      bytesIn: 0,
      bytesOut: 0
    };
  }

  /**
   * Test external service availability
   */
  async testExternalService(serviceName) {
    const startTime = Date.now();
    
    try {
      let available = false;
      let responseTime = 0;

      switch (serviceName) {
        case 'replicate':
          // Test Replicate API
          available = true; // Simplified
          break;
        case 'cloudinary':
          // Test Cloudinary API
          available = true; // Simplified
          break;
        case 'stripe':
          // Test Stripe API
          available = true; // Simplified
          break;
      }

      responseTime = Date.now() - startTime;

      return {
        available,
        responseTime,
        lastChecked: Date.now()
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        lastChecked: Date.now()
      };
    }
  }

  /**
   * Add metric to collection
   */
  addMetric(category, data, timestamp) {
    if (!this.metrics[category]) {
      this.metrics[category] = [];
    }

    this.metrics[category].push({
      timestamp,
      data
    });
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics() {
    const latest = {};
    
    Object.keys(this.metrics).forEach(category => {
      const categoryMetrics = this.metrics[category];
      if (categoryMetrics.length > 0) {
        latest[category] = categoryMetrics[categoryMetrics.length - 1].data;
      }
    });

    return latest;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const latest = this.getLatestMetrics();
    const alerts = this.getRecentAlerts(60); // Last 60 minutes

    return {
      timestamp: Date.now(),
      system: {
        cpu: latest.system?.cpu?.usage || 0,
        memory: latest.system?.memory?.usage || 0,
        uptime: latest.system?.uptime?.process || 0
      },
      application: {
        responseTime: latest.application?.responses?.averageTime || 0,
        errorRate: latest.application?.errors?.rate || 0,
        requestsPerSecond: latest.application?.requests?.perSecond || 0
      },
      database: {
        connections: latest.database?.connectionPool?.used || 0,
        slowQueries: latest.database?.slowQueries || 0
      },
      cache: {
        hitRate: latest.cache?.hitRate || 0,
        connected: latest.cache?.health?.connected || false
      },
      alerts: {
        active: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warnings: alerts.filter(a => a.severity === 'warning').length
      },
      health: this.calculateOverallHealth(latest, alerts)
    };
  }

  /**
   * Calculate overall system health score
   */
  calculateOverallHealth(metrics, alerts) {
    let score = 100;

    // Deduct points for high resource usage
    if (metrics.system?.cpu?.usage > 70) score -= 10;
    if (metrics.system?.memory?.usage > 80) score -= 10;
    if (metrics.application?.responses?.p95 > 1000) score -= 15;
    if (metrics.application?.errors?.rate > 2) score -= 20;
    
    // Deduct points for alerts
    score -= alerts.filter(a => a.severity === 'critical').length * 20;
    score -= alerts.filter(a => a.severity === 'warning').length * 10;

    return Math.max(Math.min(score, 100), 0);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(minutesBack = 60) {
    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    return this.alerts.history.filter(alert => alert.timestamp >= cutoff);
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  async cleanupOldMetrics() {
    const cutoff = Date.now() - this.metricsRetention;

    Object.keys(this.metrics).forEach(category => {
      this.metrics[category] = this.metrics[category].filter(
        metric => metric.timestamp >= cutoff
      );
    });

    // Clean up old alerts
    this.alerts.history = this.alerts.history.filter(
      alert => alert.timestamp >= cutoff
    );
  }

  /**
   * Send alert notification (implement based on requirements)
   */
  async sendAlertNotification(alert) {
    // Implement notification logic (email, Slack, webhook, etc.)
    // For now, just emit an event
    this.emit('notification_required', alert);
  }

  /**
   * Sanitize metrics for alert payload
   */
  sanitizeMetricsForAlert(metrics) {
    // Remove sensitive data and large objects
    return {
      cpu: metrics.system?.cpu?.usage,
      memory: metrics.system?.memory?.usage,
      responseTime: metrics.application?.responses?.averageTime,
      errorRate: metrics.application?.errors?.rate
    };
  }

  /**
   * Helper methods for metric calculations
   */
  getMetricSum(path) {
    // Implement metric aggregation logic
    return 0;
  }

  getMetricRate(path) {
    // Implement rate calculation logic
    return 0;
  }

  getMetricAverage(path) {
    // Implement average calculation logic
    return 0;
  }

  getMetricPercentile(path, percentile) {
    // Implement percentile calculation logic
    return 0;
  }

  getMetricBreakdown(path, field) {
    // Implement metric breakdown logic
    return {};
  }

  getActiveConnections() {
    // Implement active connections count
    return 0;
  }

  getEventLoopLag() {
    // Implement event loop lag measurement
    return 0;
  }

  async getCacheMemoryUsage() {
    // Implement cache memory usage collection
    return 0;
  }
}

module.exports = new PerformanceMonitoringService();