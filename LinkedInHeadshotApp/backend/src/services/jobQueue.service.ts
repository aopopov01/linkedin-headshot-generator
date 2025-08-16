/**
 * Job Queue Service
 * 
 * Manages background job processing using Bull queue with Redis.
 * Handles optimization jobs, batch processing, notifications, and scheduled tasks.
 */

import Bull, { Job, Queue, QueueOptions, JobOptions } from 'bull';
import { RedisService } from './redis.service';
import { LoggerService } from './logger.service';
import { DatabaseService } from './database.service';
import { MonitoringService } from './monitoring.service';
import { NotificationService } from './notification.service';

// Import job processors
import { OptimizationJobProcessor } from '../jobs/optimization.job';
import { BatchJobProcessor } from '../jobs/batch.job';
import { NotificationJobProcessor } from '../jobs/notification.job';
import { CleanupJobProcessor } from '../jobs/cleanup.job';

export interface JobData {
  [key: string]: any;
}

export interface JobProgress {
  percentage: number;
  message?: string;
  data?: any;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export class JobQueueService {
  private static instance: JobQueueService;
  private queues: Map<string, Queue> = new Map();
  private logger: LoggerService;
  private processors: Map<string, any> = new Map();

  private constructor() {
    this.logger = new LoggerService('JobQueueService');
    this.setupJobProcessors();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): JobQueueService {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }

  /**
   * Initialize job queue service
   */
  public static async initialize(): Promise<void> {
    const service = JobQueueService.getInstance();
    await service.createQueues();
    await service.startProcessors();
    service.setupEventHandlers();
    service.startCleanupJobs();
  }

  /**
   * Setup job processors
   */
  private setupJobProcessors(): void {
    this.processors.set('optimization', new OptimizationJobProcessor());
    this.processors.set('batch-optimization', new BatchJobProcessor());
    this.processors.set('notification', new NotificationJobProcessor());
    this.processors.set('cleanup', new CleanupJobProcessor());
  }

  /**
   * Create job queues
   */
  private async createQueues(): Promise<void> {
    const queueOptions: QueueOptions = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_QUEUE_DB || '1'),
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        keyPrefix: 'omnishot:queue:',
      },
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    };

    // Create queues for different job types
    const queueConfigs = [
      { name: 'optimization', concurrency: 5 },
      { name: 'batch-optimization', concurrency: 2 },
      { name: 'notification', concurrency: 10 },
      { name: 'cleanup', concurrency: 1 },
      { name: 'analytics', concurrency: 3 },
      { name: 'publishing', concurrency: 5 },
    ];

    for (const config of queueConfigs) {
      const queue = new Bull(config.name, queueOptions);
      this.queues.set(config.name, queue);
      this.logger.info(`Queue created: ${config.name} (concurrency: ${config.concurrency})`);
    }
  }

  /**
   * Start job processors
   */
  private async startProcessors(): Promise<void> {
    for (const [queueName, queue] of this.queues.entries()) {
      const processor = this.processors.get(queueName);
      
      if (processor && typeof processor.process === 'function') {
        const concurrency = this.getQueueConcurrency(queueName);
        queue.process(concurrency, processor.process.bind(processor));
        this.logger.info(`Processor started for queue: ${queueName}`);
      } else {
        this.logger.warn(`No processor found for queue: ${queueName}`);
      }
    }
  }

  /**
   * Get queue concurrency setting
   */
  private getQueueConcurrency(queueName: string): number {
    const concurrencyMap = {
      'optimization': 5,
      'batch-optimization': 2,
      'notification': 10,
      'cleanup': 1,
      'analytics': 3,
      'publishing': 5,
    };

    return concurrencyMap[queueName] || 1;
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    for (const [queueName, queue] of this.queues.entries()) {
      // Job completion
      queue.on('completed', (job: Job) => {
        this.logger.info(`Job completed: ${queueName}:${job.id}`, {
          jobId: job.id,
          queueName,
          processingTime: Date.now() - job.processedOn,
        });

        // Track job completion in monitoring
        MonitoringService.getInstance().trackJobCompletion(queueName, job.id.toString(), true);
      });

      // Job failure
      queue.on('failed', (job: Job, error: Error) => {
        this.logger.error(`Job failed: ${queueName}:${job.id}`, error, {
          jobId: job.id,
          queueName,
          attemptsMade: job.attemptsMade,
          failedReason: error.message,
        });

        // Track job failure in monitoring
        MonitoringService.getInstance().trackJobCompletion(queueName, job.id.toString(), false, error.message);
      });

      // Job stuck/stalled
      queue.on('stalled', (job: Job) => {
        this.logger.warn(`Job stalled: ${queueName}:${job.id}`, {
          jobId: job.id,
          queueName,
        });
      });

      // Job progress
      queue.on('progress', (job: Job, progress: number) => {
        this.logger.debug(`Job progress: ${queueName}:${job.id} - ${progress}%`, {
          jobId: job.id,
          queueName,
          progress,
        });
      });

      // Queue error
      queue.on('error', (error: Error) => {
        this.logger.error(`Queue error: ${queueName}`, error);
      });
    }
  }

  /**
   * Start cleanup jobs
   */
  private startCleanupJobs(): void {
    // Daily cleanup of completed jobs
    this.addJob('cleanup', 'daily-cleanup', {}, {
      repeat: { cron: '0 2 * * *' }, // Daily at 2 AM
      removeOnComplete: 1,
      removeOnFail: 1,
    });

    // Weekly analytics aggregation
    this.addJob('analytics', 'weekly-aggregation', {}, {
      repeat: { cron: '0 3 * * 0' }, // Weekly on Sunday at 3 AM
      removeOnComplete: 1,
      removeOnFail: 1,
    });

    this.logger.info('Cleanup and maintenance jobs scheduled');
  }

  /**
   * Add job to queue
   */
  public async addJob(
    queueName: string,
    jobType: string,
    data: JobData,
    options: JobOptions = {}
  ): Promise<Job> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const jobOptions: JobOptions = {
      attempts: 3,
      backoff: 'exponential',
      ...options,
    };

    const job = await queue.add(jobType, data, jobOptions);

    this.logger.info(`Job added: ${queueName}:${job.id}`, {
      jobId: job.id,
      jobType,
      queueName,
      priority: options.priority || 0,
    });

    return job;
  }

  /**
   * Get job by ID
   */
  public async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    return await queue.getJob(jobId);
  }

  /**
   * Remove job
   */
  public async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    
    if (job) {
      await job.remove();
      this.logger.info(`Job removed: ${queueName}:${jobId}`);
    }
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(queueName: string): Promise<QueueStats> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * Get all queue statistics
   */
  public async getAllQueueStats(): Promise<{ [queueName: string]: QueueStats }> {
    const stats: { [queueName: string]: QueueStats } = {};

    for (const queueName of this.queues.keys()) {
      stats[queueName] = await this.getQueueStats(queueName);
    }

    return stats;
  }

  /**
   * Pause queue
   */
  public async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.pause();
    this.logger.info(`Queue paused: ${queueName}`);
  }

  /**
   * Resume queue
   */
  public async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.resume();
    this.logger.info(`Queue resumed: ${queueName}`);
  }

  /**
   * Clean queue (remove old jobs)
   */
  public async cleanQueue(
    queueName: string,
    grace: number = 24 * 60 * 60 * 1000, // 24 hours
    status: 'completed' | 'failed' = 'completed',
    limit: number = 100
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.clean(grace, status, limit);
    this.logger.info(`Queue cleaned: ${queueName} (${status}, grace: ${grace}ms, limit: ${limit})`);
  }

  /**
   * Retry failed jobs
   */
  public async retryFailedJobs(queueName: string, count: number = 10): Promise<void> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const failedJobs = await queue.getFailed(0, count - 1);
    
    for (const job of failedJobs) {
      await job.retry();
      this.logger.info(`Job retried: ${queueName}:${job.id}`);
    }

    this.logger.info(`Retried ${failedJobs.length} failed jobs in queue: ${queueName}`);
  }

  /**
   * Get queue health status
   */
  public async getQueueHealth(queueName: string): Promise<{
    healthy: boolean;
    stats: QueueStats;
    issues: string[];
  }> {
    const stats = await this.getQueueStats(queueName);
    const issues: string[] = [];
    
    // Check for issues
    if (stats.failed > 50) {
      issues.push(`High number of failed jobs: ${stats.failed}`);
    }
    
    if (stats.waiting > 100) {
      issues.push(`High number of waiting jobs: ${stats.waiting}`);
    }
    
    if (stats.active === 0 && stats.waiting > 0) {
      issues.push('Jobs waiting but no active processing');
    }

    return {
      healthy: issues.length === 0,
      stats,
      issues,
    };
  }

  /**
   * Health check for service registry
   */
  public static async healthCheck(): Promise<{ status: string; connection: boolean }> {
    try {
      // Simple check - try to get stats from a queue
      const service = JobQueueService.getInstance();
      const queueNames = Array.from(service.queues.keys());
      
      if (queueNames.length === 0) {
        return { status: 'unhealthy', connection: false };
      }

      const stats = await service.getQueueStats(queueNames[0]);
      
      return {
        status: 'healthy',
        connection: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connection: false
      };
    }
  }

  /**
   * Close all queues
   */
  public async close(): Promise<void> {
    this.logger.info('Closing job queue service...');

    for (const [queueName, queue] of this.queues.entries()) {
      await queue.close();
      this.logger.info(`Queue closed: ${queueName}`);
    }

    this.queues.clear();
    this.logger.info('Job queue service closed');
  }

  /**
   * Get queue instance (for direct access if needed)
   */
  public getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  /**
   * Get all queue names
   */
  public getQueueNames(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Add bulk jobs
   */
  public async addBulkJobs(
    queueName: string,
    jobs: Array<{ name: string; data: JobData; opts?: JobOptions }>
  ): Promise<Job[]> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const createdJobs = await queue.addBulk(jobs);
    
    this.logger.info(`Bulk jobs added: ${queueName} (count: ${jobs.length})`);
    
    return createdJobs;
  }

  /**
   * Update job progress
   */
  public async updateJobProgress(
    queueName: string,
    jobId: string,
    progress: number | JobProgress
  ): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    
    if (job) {
      await job.progress(progress);
    }
  }

  /**
   * Get job logs
   */
  public async getJobLogs(queueName: string, jobId: string): Promise<string[]> {
    const job = await this.getJob(queueName, jobId);
    
    if (job) {
      return job.opts.jobId ? await job.getState() as any : [];
    }
    
    return [];
  }
}

export default JobQueueService;