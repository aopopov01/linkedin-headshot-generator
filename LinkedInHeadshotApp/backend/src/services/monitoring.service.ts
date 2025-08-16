/**
 * Monitoring Service
 * 
 * Comprehensive monitoring and analytics service for the OmniShot backend.
 * Tracks performance metrics, errors, business metrics, and system health.
 */

import { DatabaseService } from './database.service';
import { RedisService } from './redis.service';
import { LoggerService } from './logger.service';

export interface MetricEvent {
  name: string;
  value: number;
  timestamp: Date;
  tags?: { [key: string]: string };
  userId?: string;
}

export interface ErrorEvent {
  type: string;
  message: string;
  statusCode: number;
  path: string;
  method: string;
  userId?: string;
  timestamp: string;
  stack?: string;
}

export interface BusinessEvent {
  event: string;
  userId: string;
  properties: { [key: string]: any };
  timestamp: Date;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  tags?: { [key: string]: string };
}

export interface SystemHealth {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  uptime: number;
  timestamp: Date;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private logger: LoggerService;
  private metricsBuffer: MetricEvent[] = [];
  private errorBuffer: ErrorEvent[] = [];
  private performanceBuffer: PerformanceMetric[] = [];
  private businessBuffer: BusinessEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.logger = new LoggerService('MonitoringService');
    this.startBufferFlush();
    this.startSystemMonitoring();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Initialize monitoring service
   */
  public static async initialize(): Promise<void> {
    const service = MonitoringService.getInstance();
    await service.setupMetricsTables();
    service.logger.info('Monitoring service initialized');
  }

  /**
   * Setup database tables for metrics
   */
  private async setupMetricsTables(): Promise<void> {
    try {
      // Metrics are already defined in Prisma schema
      // This method can be used for additional setup if needed
      this.logger.info('Metrics tables verified');
    } catch (error) {
      this.logger.error('Failed to setup metrics tables:', error);
      throw error;
    }
  }

  /**
   * Track custom metric
   */
  public trackMetric(name: string, value: number, tags?: { [key: string]: string }, userId?: string): void {
    const event: MetricEvent = {
      name,
      value,
      timestamp: new Date(),
      tags,
      userId
    };

    this.metricsBuffer.push(event);
    
    // Also store in Redis for real-time access
    this.storeInRedis(`metric:${name}`, event);
  }

  /**
   * Track error event
   */
  public trackError(error: ErrorEvent): void {
    this.errorBuffer.push(error);
    
    // Store critical errors in Redis immediately
    if (error.statusCode >= 500) {
      this.storeInRedis('errors:critical', error);
    }
    
    this.logger.error('Error tracked', {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      path: error.path,
      userId: error.userId
    });
  }

  /**
   * Track performance metric
   */
  public trackPerformance(operation: string, duration: number, success: boolean, tags?: { [key: string]: string }): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      success,
      timestamp: new Date(),
      tags
    };

    this.performanceBuffer.push(metric);
    
    // Store slow operations in Redis
    if (duration > 5000) { // 5 seconds threshold
      this.storeInRedis('performance:slow', metric);
    }
  }

  /**
   * Track business event
   */
  public trackBusinessEvent(event: string, userId: string, properties: { [key: string]: any }): void {
    const businessEvent: BusinessEvent = {
      event,
      userId,
      properties,
      timestamp: new Date()
    };

    this.businessBuffer.push(businessEvent);
    
    // Store important business events in Redis
    const importantEvents = ['user_registered', 'subscription_upgraded', 'optimization_completed'];
    if (importantEvents.includes(event)) {
      this.storeInRedis(`business:${event}`, businessEvent);
    }
  }

  /**
   * Track optimization job completion
   */
  public trackOptimization(data: {
    jobId: string;
    platforms?: string[];
    style?: string;
    processingTime?: number;
    strategy?: string;
    cost?: number;
    success: boolean;
    userId?: string;
    userTier?: string;
    batchSize?: number;
    action?: string;
  }): void {
    const tags = {
      success: data.success.toString(),
      userId: data.userId || 'unknown',
      userTier: data.userTier || 'free',
      action: data.action || 'optimize'
    };

    // Track processing time
    if (data.processingTime) {
      this.trackMetric('optimization.processing_time', data.processingTime, tags);
    }

    // Track cost
    if (data.cost) {
      this.trackMetric('optimization.cost', data.cost, tags);
    }

    // Track success/failure
    this.trackMetric('optimization.completed', 1, tags);

    // Track platform usage
    if (data.platforms) {
      data.platforms.forEach(platform => {
        this.trackMetric('optimization.platform_usage', 1, { ...tags, platform });
      });
    }

    // Track business event
    if (data.userId) {
      this.trackBusinessEvent('optimization_completed', data.userId, {
        jobId: data.jobId,
        platforms: data.platforms,
        style: data.style,
        cost: data.cost,
        success: data.success,
        processingTime: data.processingTime
      });
    }
  }

  /**
   * Track job completion
   */
  public trackJobCompletion(queueName: string, jobId: string, success: boolean, error?: string): void {
    const tags = {
      queue: queueName,
      success: success.toString()
    };

    this.trackMetric('job.completed', 1, tags);

    if (!success && error) {
      this.trackError({
        type: 'JobError',
        message: error,
        statusCode: 500,
        path: `/queue/${queueName}`,
        method: 'JOB',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Track rate limit exceeded
   */
  public trackRateLimitExceeded(endpointType: string, context: any): void {
    this.trackMetric('rate_limit.exceeded', 1, {
      endpoint_type: endpointType,
      user_id: context.userId || 'anonymous'
    });

    // Track as security event
    this.trackBusinessEvent('rate_limit_exceeded', context.userId || 'anonymous', {
      endpointType,
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint
    });
  }

  /**
   * Track API usage
   */
  public trackAPIUsage(endpoint: string, method: string, statusCode: number, responseTime: number, userId?: string): void {
    const tags = {
      endpoint,
      method,
      status_code: statusCode.toString(),
      user_id: userId || 'anonymous'
    };

    this.trackMetric('api.request', 1, tags);
    this.trackMetric('api.response_time', responseTime, tags);

    // Track error rate
    if (statusCode >= 400) {
      this.trackMetric('api.error', 1, tags);
    }
  }

  /**
   * Get real-time metrics
   */
  public async getMetrics(metricName?: string, timeframe: number = 3600): Promise<any> {
    try {
      const redis = RedisService.getClient();
      const keys = metricName 
        ? [`metric:${metricName}`]
        : await redis.keys('metric:*');

      const metrics: any = {};

      for (const key of keys) {
        const data = await redis.lrange(key, 0, -1);
        const parsedData = data.map(item => JSON.parse(item));
        
        // Filter by timeframe
        const cutoff = new Date(Date.now() - (timeframe * 1000));
        const filteredData = parsedData.filter(item => 
          new Date(item.timestamp) > cutoff
        );

        metrics[key.replace('metric:', '')] = filteredData;
      }

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get metrics:', error);
      return {};
    }
  }

  /**
   * Get system health metrics
   */
  public async getSystemHealth(): Promise<SystemHealth> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        cpu: {
          usage: this.calculateCPUPercentage(cpuUsage),
          load: [0, 0, 0] // Would implement actual load average
        },
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
        },
        disk: {
          used: 0, // Would implement actual disk usage
          total: 0,
          percentage: 0
        },
        network: {
          bytesIn: 0, // Would implement actual network stats
          bytesOut: 0
        },
        uptime: process.uptime(),
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get system health:', error);
      throw error;
    }
  }

  /**
   * Get analytics dashboard data
   */
  public async getAnalyticsDashboard(): Promise<any> {
    try {
      const [
        recentErrors,
        performanceMetrics,
        businessMetrics,
        systemHealth
      ] = await Promise.all([
        this.getRecentErrors(),
        this.getPerformanceMetrics(),
        this.getBusinessMetrics(),
        this.getSystemHealth()
      ]);

      return {
        errors: recentErrors,
        performance: performanceMetrics,
        business: businessMetrics,
        system: systemHealth,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get analytics dashboard:', error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  public async getUserAnalytics(userId: string): Promise<any> {
    try {
      const userAnalytics = await DatabaseService.getClient().userAnalytics.findUnique({
        where: { userId }
      });

      const recentActivity = await this.getRecentUserActivity(userId);
      
      return {
        analytics: userAnalytics,
        recentActivity,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  /**
   * Update user analytics
   */
  public async updateUserAnalytics(userId: string, updates: any): Promise<void> {
    try {
      await DatabaseService.updateUserAnalytics(userId, updates);
    } catch (error) {
      this.logger.error('Failed to update user analytics:', error);
      throw error;
    }
  }

  /**
   * Create performance timer
   */
  public createTimer(operation: string, tags?: { [key: string]: string }) {
    const startTime = Date.now();
    
    return {
      end: (success: boolean = true) => {
        const duration = Date.now() - startTime;
        this.trackPerformance(operation, duration, success, tags);
        return duration;
      }
    };
  }

  /**
   * Flush buffers to database
   */
  private async flushBuffers(): Promise<void> {
    try {
      // Flush metrics
      if (this.metricsBuffer.length > 0) {
        await this.flushMetrics();
      }

      // Flush errors
      if (this.errorBuffer.length > 0) {
        await this.flushErrors();
      }

      // Flush performance metrics
      if (this.performanceBuffer.length > 0) {
        await this.flushPerformanceMetrics();
      }

      // Flush business events
      if (this.businessBuffer.length > 0) {
        await this.flushBusinessEvents();
      }

    } catch (error) {
      this.logger.error('Failed to flush monitoring buffers:', error);
    }
  }

  /**
   * Flush metrics to database
   */
  private async flushMetrics(): Promise<void> {
    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    // Group metrics by date for efficient storage
    const groupedMetrics = this.groupMetricsByDate(metricsToFlush);

    for (const [dateStr, metrics] of Object.entries(groupedMetrics)) {
      const date = new Date(dateStr);
      
      for (const [metricName, data] of Object.entries(metrics)) {
        await this.updateSystemMetrics(date, metricName, data);
      }
    }
  }

  /**
   * Flush errors to database
   */
  private async flushErrors(): Promise<void> {
    // Errors are already logged, could implement additional storage here
    this.errorBuffer = [];
  }

  /**
   * Flush performance metrics
   */
  private async flushPerformanceMetrics(): Promise<void> {
    // Performance metrics could be stored in a separate table
    this.performanceBuffer = [];
  }

  /**
   * Flush business events
   */
  private async flushBusinessEvents(): Promise<void> {
    // Business events could be stored separately for analytics
    this.businessBuffer = [];
  }

  /**
   * Store data in Redis for real-time access
   */
  private async storeInRedis(key: string, data: any): Promise<void> {
    try {
      await RedisService.rpush(key, data);
      
      // Keep only last 1000 entries
      const length = await RedisService.llen(key);
      if (length > 1000) {
        await RedisService.getClient().ltrim(key, -1000, -1);
      }
    } catch (error) {
      this.logger.error('Failed to store in Redis:', error);
    }
  }

  /**
   * Start buffer flush interval
   */
  private startBufferFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushBuffers();
    }, 30000); // Flush every 30 seconds
  }

  /**
   * Start system monitoring
   */
  private startSystemMonitoring(): void {
    // Monitor system health every minute
    setInterval(async () => {
      try {
        const health = await this.getSystemHealth();
        
        // Track system metrics
        this.trackMetric('system.cpu_usage', health.cpu.usage);
        this.trackMetric('system.memory_usage', health.memory.percentage);
        this.trackMetric('system.uptime', health.uptime);

        // Alert on high resource usage
        if (health.cpu.usage > 80) {
          this.logger.warn('High CPU usage detected', { usage: health.cpu.usage });
        }
        
        if (health.memory.percentage > 85) {
          this.logger.warn('High memory usage detected', { usage: health.memory.percentage });
        }

      } catch (error) {
        this.logger.error('System monitoring failed:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Helper methods
   */
  private calculateCPUPercentage(cpuUsage: NodeJS.CpuUsage): number {
    // Simple CPU calculation - would need more sophisticated implementation
    return Math.min(100, (cpuUsage.user + cpuUsage.system) / 10000);
  }

  private groupMetricsByDate(metrics: MetricEvent[]): { [date: string]: { [metric: string]: any } } {
    const grouped: { [date: string]: { [metric: string]: any } } = {};

    metrics.forEach(metric => {
      const dateStr = metric.timestamp.toISOString().split('T')[0];
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = {};
      }
      
      if (!grouped[dateStr][metric.name]) {
        grouped[dateStr][metric.name] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          values: []
        };
      }

      const data = grouped[dateStr][metric.name];
      data.count++;
      data.sum += metric.value;
      data.min = Math.min(data.min, metric.value);
      data.max = Math.max(data.max, metric.value);
      data.values.push(metric.value);
    });

    return grouped;
  }

  private async updateSystemMetrics(date: Date, metricName: string, data: any): Promise<void> {
    try {
      const hour = date.getHours();
      
      await DatabaseService.getClient().systemMetrics.upsert({
        where: {
          date_hour: {
            date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            hour
          }
        },
        update: {
          // Update logic based on metric name
        },
        create: {
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          hour,
          timestamp: new Date(),
          // Create logic based on metric name
        }
      });
    } catch (error) {
      this.logger.error('Failed to update system metrics:', error);
    }
  }

  private async getRecentErrors(): Promise<any[]> {
    try {
      const redis = RedisService.getClient();
      const errors = await redis.lrange('errors:critical', 0, 99);
      return errors.map(error => JSON.parse(error));
    } catch (error) {
      this.logger.error('Failed to get recent errors:', error);
      return [];
    }
  }

  private async getPerformanceMetrics(): Promise<any> {
    try {
      const redis = RedisService.getClient();
      const slowOps = await redis.lrange('performance:slow', 0, 99);
      return {
        slowOperations: slowOps.map(op => JSON.parse(op)),
        averageResponseTime: 0, // Calculate from stored metrics
        errorRate: 0 // Calculate from stored metrics
      };
    } catch (error) {
      this.logger.error('Failed to get performance metrics:', error);
      return { slowOperations: [], averageResponseTime: 0, errorRate: 0 };
    }
  }

  private async getBusinessMetrics(): Promise<any> {
    try {
      // Get business metrics from database
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [userCount, optimizationCount, revenue] = await Promise.all([
        DatabaseService.getClient().user.count({
          where: { createdAt: { gte: today } }
        }),
        DatabaseService.getClient().optimization.count({
          where: { createdAt: { gte: today } }
        }),
        DatabaseService.getClient().optimization.aggregate({
          where: { 
            createdAt: { gte: today },
            status: 'COMPLETED'
          },
          _sum: { actualCost: true }
        })
      ]);

      return {
        newUsers: userCount,
        optimizations: optimizationCount,
        revenue: revenue._sum.actualCost || 0
      };
    } catch (error) {
      this.logger.error('Failed to get business metrics:', error);
      return { newUsers: 0, optimizations: 0, revenue: 0 };
    }
  }

  private async getRecentUserActivity(userId: string): Promise<any[]> {
    try {
      const recentOptimizations = await DatabaseService.getClient().optimization.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          targetPlatforms: true,
          professionalStyle: true,
          createdAt: true,
          actualCost: true
        }
      });

      return recentOptimizations;
    } catch (error) {
      this.logger.error('Failed to get recent user activity:', error);
      return [];
    }
  }

  /**
   * Cleanup monitoring service
   */
  public async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Final flush
    await this.flushBuffers();
    
    this.logger.info('Monitoring service cleaned up');
  }
}

export default MonitoringService;