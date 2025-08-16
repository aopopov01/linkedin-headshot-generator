/**
 * Monitoring Service
 * Comprehensive monitoring and observability for OmniShot
 * Tracks performance, errors, usage patterns, and system health
 */

class MonitoringService {
  constructor() {
    // Monitoring configuration
    this.config = {
      metricsRetentionDays: 30,
      alertThresholds: {
        errorRate: 0.05, // 5%
        avgResponseTime: 30000, // 30 seconds
        queueLength: 20,
        memoryUsage: 0.9, // 90%
        cpuUsage: 0.8 // 80%
      },
      reportingInterval: 300000 // 5 minutes
    };

    // System metrics
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        inProgress: 0
      },
      
      performance: {
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        responseTimeHistory: []
      },
      
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      
      resources: {
        memoryUsage: 0,
        cpuUsage: 0,
        activeConnections: 0,
        queueLength: 0
      },
      
      business: {
        platformUsage: {},
        stylePreferences: {},
        userEngagement: {
          totalUsers: 0,
          activeUsers: 0,
          averageSessionTime: 0
        }
      },
      
      system: {
        uptime: Date.now(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Active requests tracking
    this.activeRequests = new Map();
    
    // Alerts and notifications
    this.alerts = {
      active: [],
      history: []
    };

    // Health status
    this.healthStatus = {
      status: 'healthy',
      lastCheck: Date.now(),
      components: {}
    };

    // Initialize monitoring
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring system
   */
  initializeMonitoring() {
    console.log('🔍 Initializing OmniShot monitoring system...');
    
    // Start periodic health checks
    this.startHealthChecks();
    
    // Start system metrics collection
    this.startSystemMetricsCollection();
    
    // Start automated reporting
    this.startAutomatedReporting();
    
    console.log('✅ Monitoring system initialized');
  }

  /**
   * Start monitoring a request
   */
  startRequest(requestId, metadata = {}) {
    const requestData = {
      id: requestId,
      startTime: Date.now(),
      metadata: {
        platforms: metadata.platforms || 1,
        style: metadata.style || 'unknown',
        imageSize: metadata.imageSize || 0,
        ...metadata
      },
      status: 'processing'
    };

    this.activeRequests.set(requestId, requestData);
    this.metrics.requests.inProgress++;
    
    console.log(`📊 [${requestId}] Request monitoring started`);
  }

  /**
   * Complete a request with success
   */
  completeRequest(requestId, results = {}) {
    const requestData = this.activeRequests.get(requestId);
    if (!requestData) {
      console.warn(`⚠️ Request ${requestId} not found in monitoring`);
      return;
    }

    const completionTime = Date.now();
    const responseTime = completionTime - requestData.startTime;
    
    // Update request metrics
    this.metrics.requests.total++;
    this.metrics.requests.successful++;
    this.metrics.requests.inProgress--;
    
    // Update performance metrics
    this.updatePerformanceMetrics(responseTime);
    
    // Update business metrics
    this.updateBusinessMetrics(requestData.metadata, results);
    
    // Remove from active requests
    this.activeRequests.delete(requestId);
    
    console.log(`✅ [${requestId}] Request completed in ${responseTime}ms`);
  }

  /**
   * Fail a request
   */
  failRequest(requestId, error) {
    const requestData = this.activeRequests.get(requestId);
    if (!requestData) {
      console.warn(`⚠️ Request ${requestId} not found in monitoring`);
      return;
    }

    const completionTime = Date.now();
    const responseTime = completionTime - requestData.startTime;
    
    // Update request metrics
    this.metrics.requests.total++;
    this.metrics.requests.failed++;
    this.metrics.requests.inProgress--;
    
    // Update error metrics
    this.recordError(error, requestId, requestData);
    
    // Update performance metrics (even for failed requests)
    this.updatePerformanceMetrics(responseTime);
    
    // Remove from active requests
    this.activeRequests.delete(requestId);
    
    console.log(`❌ [${requestId}] Request failed after ${responseTime}ms: ${error.message}`);
  }

  /**
   * Start optimization monitoring
   */
  startOptimization(optimizationId, metadata) {
    return this.startRequest(optimizationId, metadata);
  }

  /**
   * Complete optimization monitoring
   */
  completeOptimization(optimizationId, results) {
    return this.completeRequest(optimizationId, results);
  }

  /**
   * Fail optimization monitoring
   */
  failOptimization(optimizationId, error) {
    return this.failRequest(optimizationId, error);
  }

  /**
   * Record an error
   */
  recordError(error, requestId = null, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      requestId,
      context,
      type: this.classifyError(error)
    };

    this.metrics.errors.total++;
    
    // Count by error type
    if (!this.metrics.errors.byType[errorData.type]) {
      this.metrics.errors.byType[errorData.type] = 0;
    }
    this.metrics.errors.byType[errorData.type]++;
    
    // Keep recent errors (last 100)
    this.metrics.errors.recent.unshift(errorData);
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(0, 100);
    }
    
    // Check if alert should be triggered
    this.checkErrorRateAlert();
    
    console.error(`🚨 Error recorded: [${errorData.type}] ${error.message}`);
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('network') || message.includes('fetch')) return 'network';
    if (message.includes('validation')) return 'validation';
    if (message.includes('auth')) return 'authentication';
    if (message.includes('permission')) return 'authorization';
    if (message.includes('api')) return 'api_error';
    if (message.includes('processing')) return 'processing_error';
    if (message.includes('memory')) return 'resource_error';
    
    return 'unknown';
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(responseTime) {
    const perf = this.metrics.performance;
    
    // Update min/max
    perf.minResponseTime = Math.min(perf.minResponseTime, responseTime);
    perf.maxResponseTime = Math.max(perf.maxResponseTime, responseTime);
    
    // Update average
    const totalRequests = this.metrics.requests.total;
    if (totalRequests === 1) {
      perf.averageResponseTime = responseTime;
    } else {
      perf.averageResponseTime = (
        (perf.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests
      );
    }
    
    // Keep response time history (last 100 requests)
    perf.responseTimeHistory.unshift({
      time: responseTime,
      timestamp: Date.now()
    });
    
    if (perf.responseTimeHistory.length > 100) {
      perf.responseTimeHistory = perf.responseTimeHistory.slice(0, 100);
    }
    
    // Check response time alert
    if (responseTime > this.config.alertThresholds.avgResponseTime) {
      this.triggerAlert('high_response_time', {
        responseTime,
        threshold: this.config.alertThresholds.avgResponseTime
      });
    }
  }

  /**
   * Update business metrics
   */
  updateBusinessMetrics(requestMetadata, results = {}) {
    // Track platform usage
    if (requestMetadata.platforms) {
      const platforms = Array.isArray(requestMetadata.platforms) 
        ? requestMetadata.platforms 
        : [requestMetadata.platforms];
      
      platforms.forEach(platform => {
        if (!this.metrics.business.platformUsage[platform]) {
          this.metrics.business.platformUsage[platform] = 0;
        }
        this.metrics.business.platformUsage[platform]++;
      });
    }
    
    // Track style preferences
    if (requestMetadata.style) {
      if (!this.metrics.business.stylePreferences[requestMetadata.style]) {
        this.metrics.business.stylePreferences[requestMetadata.style] = 0;
      }
      this.metrics.business.stylePreferences[requestMetadata.style]++;
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }

  /**
   * Start system metrics collection
   */
  startSystemMetricsCollection() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Start automated reporting
   */
  startAutomatedReporting() {
    setInterval(() => {
      this.generatePerformanceReport();
    }, this.config.reportingInterval);
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    try {
      const healthData = {
        status: 'healthy',
        timestamp: Date.now(),
        components: {}
      };

      // Check error rate
      const errorRate = this.calculateErrorRate();
      healthData.components.errorRate = {
        status: errorRate < this.config.alertThresholds.errorRate ? 'healthy' : 'degraded',
        value: errorRate,
        threshold: this.config.alertThresholds.errorRate
      };

      // Check response time
      healthData.components.responseTime = {
        status: this.metrics.performance.averageResponseTime < this.config.alertThresholds.avgResponseTime ? 'healthy' : 'degraded',
        value: this.metrics.performance.averageResponseTime,
        threshold: this.config.alertThresholds.avgResponseTime
      };

      // Check queue length
      const queueLength = this.metrics.resources.queueLength;
      healthData.components.queueLength = {
        status: queueLength < this.config.alertThresholds.queueLength ? 'healthy' : 'degraded',
        value: queueLength,
        threshold: this.config.alertThresholds.queueLength
      };

      // Determine overall status
      const componentStatuses = Object.values(healthData.components).map(c => c.status);
      if (componentStatuses.includes('unhealthy')) {
        healthData.status = 'unhealthy';
      } else if (componentStatuses.includes('degraded')) {
        healthData.status = 'degraded';
      }

      this.healthStatus = healthData;

      // Trigger alerts if unhealthy
      if (healthData.status !== 'healthy') {
        this.triggerAlert('system_health', { healthStatus: healthData });
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.healthStatus = {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      this.metrics.resources.memoryUsage = memUsage.heapUsed / memUsage.heapTotal;

      // Active connections (approximation)
      this.metrics.resources.activeConnections = this.activeRequests.size;
      this.metrics.resources.queueLength = this.activeRequests.size;

      // CPU usage would require additional library in production
      // For now, we'll estimate based on request load
      const recentRequestRate = this.calculateRecentRequestRate();
      this.metrics.resources.cpuUsage = Math.min(recentRequestRate / 10, 1); // Rough estimate

    } catch (error) {
      console.error('❌ System metrics collection failed:', error);
    }
  }

  /**
   * Calculate current error rate
   */
  calculateErrorRate() {
    const total = this.metrics.requests.total;
    if (total === 0) return 0;
    
    return this.metrics.requests.failed / total;
  }

  /**
   * Calculate recent request rate
   */
  calculateRecentRequestRate() {
    const recentRequests = this.metrics.performance.responseTimeHistory
      .filter(entry => Date.now() - entry.timestamp < 300000); // Last 5 minutes
    
    return recentRequests.length / 5; // Requests per minute
  }

  /**
   * Trigger an alert
   */
  triggerAlert(type, data) {
    const alert = {
      id: this.generateAlertId(),
      type,
      message: this.generateAlertMessage(type, data),
      data,
      timestamp: Date.now(),
      status: 'active',
      severity: this.getAlertSeverity(type)
    };

    this.alerts.active.push(alert);
    this.alerts.history.unshift(alert);
    
    // Keep history manageable
    if (this.alerts.history.length > 1000) {
      this.alerts.history = this.alerts.history.slice(0, 1000);
    }

    console.warn(`🚨 ALERT [${type}]: ${alert.message}`);
    
    // In production, this would send to external alerting systems
    this.sendExternalAlert(alert);
  }

  /**
   * Generate alert message
   */
  generateAlertMessage(type, data) {
    switch (type) {
      case 'high_error_rate':
        return `Error rate ${(data.errorRate * 100).toFixed(2)}% exceeds threshold ${(data.threshold * 100).toFixed(2)}%`;
      
      case 'high_response_time':
        return `Response time ${data.responseTime}ms exceeds threshold ${data.threshold}ms`;
      
      case 'system_health':
        return `System health degraded: ${data.healthStatus.status}`;
      
      case 'resource_exhaustion':
        return `Resource usage critical: ${data.resource} at ${(data.usage * 100).toFixed(1)}%`;
      
      default:
        return `Alert triggered: ${type}`;
    }
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(type) {
    const severityMap = {
      high_error_rate: 'critical',
      high_response_time: 'warning',
      system_health: 'critical',
      resource_exhaustion: 'critical',
      queue_overflow: 'warning'
    };
    
    return severityMap[type] || 'info';
  }

  /**
   * Send external alert (placeholder)
   */
  sendExternalAlert(alert) {
    // In production, integrate with:
    // - Slack/Discord webhooks
    // - Email notifications
    // - PagerDuty/OpsGenie
    // - Datadog/New Relic
    // - Custom webhook endpoints
    
    console.log(`📧 External alert would be sent: ${alert.message}`);
  }

  /**
   * Check error rate alert
   */
  checkErrorRateAlert() {
    const errorRate = this.calculateErrorRate();
    if (errorRate > this.config.alertThresholds.errorRate) {
      this.triggerAlert('high_error_rate', {
        errorRate,
        threshold: this.config.alertThresholds.errorRate
      });
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      period: `Last ${this.config.reportingInterval / 1000 / 60} minutes`,
      
      summary: {
        totalRequests: this.metrics.requests.total,
        successRate: this.metrics.requests.total > 0 
          ? ((this.metrics.requests.successful / this.metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%',
        errorRate: (this.calculateErrorRate() * 100).toFixed(2) + '%',
        averageResponseTime: `${Math.round(this.metrics.performance.averageResponseTime)}ms`
      },
      
      topPlatforms: this.getTopPlatforms(5),
      topStyles: this.getTopStyles(5),
      recentErrors: this.metrics.errors.recent.slice(0, 10),
      activeAlerts: this.alerts.active.length,
      
      systemHealth: this.healthStatus.status
    };

    console.log('📊 Performance Report:', JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * Get top platforms by usage
   */
  getTopPlatforms(limit = 5) {
    return Object.entries(this.metrics.business.platformUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([platform, count]) => ({ platform, count }));
  }

  /**
   * Get top styles by preference
   */
  getTopStyles(limit = 5) {
    return Object.entries(this.metrics.business.stylePreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([style, count]) => ({ style, count }));
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      derived: {
        errorRate: this.calculateErrorRate(),
        successRate: this.metrics.requests.total > 0 
          ? (this.metrics.requests.successful / this.metrics.requests.total) 
          : 0,
        uptime: Date.now() - this.metrics.system.uptime,
        requestRate: this.calculateRecentRequestRate()
      }
    };
  }

  /**
   * Generate alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check for monitoring service
   */
  async healthCheck() {
    try {
      return {
        status: 'healthy',
        metrics: this.getMetrics(),
        healthStatus: this.healthStatus,
        activeAlerts: this.alerts.active.length,
        configuration: {
          metricsRetention: `${this.config.metricsRetentionDays} days`,
          reportingInterval: `${this.config.reportingInterval / 1000} seconds`,
          alertThresholds: this.config.alertThresholds
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Shutdown monitoring service
   */
  async shutdown() {
    console.log('🔍 Shutting down monitoring service...');
    
    // Generate final report
    this.generatePerformanceReport();
    
    // Clear intervals would go here in production
    
    console.log('✅ Monitoring service shutdown complete');
  }
}

module.exports = { MonitoringService };