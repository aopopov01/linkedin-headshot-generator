/**
 * Background Job Processing Service
 * Handles long-running headshot transformations and queue management
 * 
 * Features:
 * - Job queue management with priority handling
 * - Background processing for premium transformations
 * - Progress tracking and status updates
 * - Error handling and retry logic
 * - Resource management and throttling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';

// Job Queue Configuration
const QUEUE_CONFIG = {
  MAX_CONCURRENT_JOBS: 3,
  MAX_QUEUE_SIZE: 50,
  JOB_TIMEOUT: 5400000, // 90 minutes for premium jobs
  RETRY_DELAYS: [5000, 15000, 60000], // Progressive retry delays
  PRIORITY_WEIGHTS: {
    urgent: 1,
    high: 2, 
    standard: 3,
    low: 4
  },
  CLEANUP_INTERVAL: 300000 // 5 minutes
};

// Job Status Types
const JOB_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RETRYING: 'retrying'
};

export class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.processingJobs = new Set();
    this.priorityQueues = {
      urgent: [],
      high: [],
      standard: [],
      low: []
    };
    this.isProcessing = false;
    this.processingInterval = null;
    
    // Initialize queue from storage
    this.initializeFromStorage();
    
    // Start background processing
    this.startBackgroundProcessing();
    
    // Setup cleanup interval
    this.startCleanupProcess();
  }

  /**
   * Add job to queue with priority handling
   */
  async addJob(job) {
    try {
      // Validate job
      this.validateJob(job);
      
      // Check queue capacity
      if (this.getTotalQueueSize() >= QUEUE_CONFIG.MAX_QUEUE_SIZE) {
        throw new Error('Queue is full. Please try again later.');
      }
      
      // Set default values
      job.status = JOB_STATUS.QUEUED;
      job.priority = job.priority || 'standard';
      job.attempts = 0;
      job.maxAttempts = job.maxAttempts || 3;
      job.queuedAt = new Date();
      job.id = job.id || this.generateJobId();
      
      // Add to appropriate priority queue
      this.priorityQueues[job.priority].push(job);
      this.jobs.set(job.id, job);
      
      // Persist to storage
      await this.persistJob(job);
      
      console.log(`Job ${job.id} queued with priority ${job.priority}`);
      
      // Emit job added event
      this.emit('jobAdded', job);
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.startBackgroundProcessing();
      }
      
      return job.id;
      
    } catch (error) {
      console.error('Failed to add job to queue:', error);
      throw error;
    }
  }

  /**
   * Get next job from priority queues
   */
  getNextJob() {
    // Check each priority level
    for (const priority of ['urgent', 'high', 'standard', 'low']) {
      const queue = this.priorityQueues[priority];
      if (queue.length > 0) {
        const job = queue.shift();
        return job;
      }
    }
    return null;
  }

  /**
   * Start background job processing
   */
  startBackgroundProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('Starting background job processing');
    
    // Process jobs continuously
    this.processingInterval = setInterval(() => {
      this.processJobs();
    }, 2000); // Check every 2 seconds
    
    // Initial processing
    setTimeout(() => this.processJobs(), 100);
  }

  /**
   * Stop background job processing
   */
  stopBackgroundProcessing() {
    this.isProcessing = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    console.log('Background job processing stopped');
  }

  /**
   * Process available jobs
   */
  async processJobs() {
    if (this.processingJobs.size >= QUEUE_CONFIG.MAX_CONCURRENT_JOBS) {
      return; // At capacity
    }
    
    const job = this.getNextJob();
    if (!job) {
      return; // No jobs available
    }
    
    // Start processing job
    this.processingJobs.add(job.id);
    job.status = JOB_STATUS.PROCESSING;
    job.startedAt = new Date();
    
    console.log(`Starting job ${job.id} (${job.type})`);
    
    // Emit job started event
    this.emit('jobStarted', job);
    
    // Update job in storage
    await this.persistJob(job);
    
    // Process job asynchronously
    this.executeJob(job);
  }

  /**
   * Execute individual job
   */
  async executeJob(job) {
    try {
      let result;
      
      switch (job.type) {
        case 'headshot_transformation':
          result = await this.executeHeadshotTransformation(job);
          break;
          
        case 'batch_processing':
          result = await this.executeBatchProcessing(job);
          break;
          
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
      
      // Job completed successfully
      job.status = JOB_STATUS.COMPLETED;
      job.completedAt = new Date();
      job.result = result;
      
      console.log(`Job ${job.id} completed successfully`);
      
      // Emit completion event
      this.emit('jobCompleted', job, result);
      
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error.message);
      
      // Handle job failure
      await this.handleJobFailure(job, error);
      
    } finally {
      // Remove from processing set
      this.processingJobs.delete(job.id);
      
      // Update job in storage
      await this.persistJob(job);
      
      // Continue processing other jobs
      setTimeout(() => this.processJobs(), 1000);
    }
  }

  /**
   * Execute headshot transformation job
   */
  async executeHeadshotTransformation(job) {
    const { imageUri, style, provider, options } = job;
    
    // Import transformation service
    const transformationService = (await import('./headshotTransformationService')).default;
    
    // Execute the transformation based on provider
    switch (provider) {
      case 'BETTERPIC':
        return await transformationService.executeBetterPicTransformation(imageUri, style, options);
        
      case 'REPLICATE':  
        return await transformationService.executeReplicateTransformation(imageUri, style, options);
        
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Execute batch processing job
   */
  async executeBatchProcessing(job) {
    const { images, style, options } = job;
    const results = [];
    
    for (let i = 0; i < images.length; i++) {
      const imageUri = images[i];
      
      try {
        // Update progress
        job.progress = {
          current: i + 1,
          total: images.length,
          percentage: Math.round(((i + 1) / images.length) * 100)
        };
        
        // Emit progress update
        this.emit('jobProgress', job);
        
        // Process individual image
        const transformationService = (await import('./headshotTransformationService')).default;
        const result = await transformationService.executeTransformation(imageUri, style, job.provider, options);
        
        results.push({
          imageUri,
          success: true,
          result
        });
        
      } catch (error) {
        results.push({
          imageUri,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      totalProcessed: images.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Handle job failure with retry logic
   */
  async handleJobFailure(job, error) {
    job.attempts = (job.attempts || 0) + 1;
    job.lastError = error.message;
    job.lastFailedAt = new Date();
    
    if (job.attempts < job.maxAttempts) {
      // Retry job
      job.status = JOB_STATUS.RETRYING;
      
      const delay = QUEUE_CONFIG.RETRY_DELAYS[job.attempts - 1] || QUEUE_CONFIG.RETRY_DELAYS[2];
      
      console.log(`Retrying job ${job.id} in ${delay}ms (attempt ${job.attempts}/${job.maxAttempts})`);
      
      // Schedule retry
      setTimeout(() => {
        // Add back to queue with same priority
        this.priorityQueues[job.priority].unshift(job);
        job.status = JOB_STATUS.QUEUED;
      }, delay);
      
      // Emit retry event
      this.emit('jobRetrying', job, error);
      
    } else {
      // Max attempts reached, mark as failed
      job.status = JOB_STATUS.FAILED;
      job.failedAt = new Date();
      
      console.error(`Job ${job.id} permanently failed after ${job.attempts} attempts`);
      
      // Emit failure event
      this.emit('jobFailed', job, error);
    }
  }

  /**
   * Get job status by ID
   */
  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return {
        found: false,
        error: 'Job not found'
      };
    }
    
    return {
      found: true,
      id: job.id,
      type: job.type,
      status: job.status,
      priority: job.priority,
      progress: job.progress,
      queuedAt: job.queuedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      result: job.result,
      error: job.lastError,
      estimatedCompletionTime: job.estimatedCompletionTime
    };
  }

  /**
   * Cancel job by ID
   */
  async cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (job.status === JOB_STATUS.COMPLETED) {
      throw new Error('Cannot cancel completed job');
    }
    
    // Remove from queue if queued
    if (job.status === JOB_STATUS.QUEUED) {
      const queue = this.priorityQueues[job.priority];
      const index = queue.findIndex(j => j.id === jobId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
    
    // Mark as cancelled
    job.status = JOB_STATUS.CANCELLED;
    job.cancelledAt = new Date();
    
    // Remove from processing if currently processing
    this.processingJobs.delete(jobId);
    
    // Update storage
    await this.persistJob(job);
    
    // Emit cancellation event
    this.emit('jobCancelled', job);
    
    console.log(`Job ${jobId} cancelled`);
    
    return true;
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const total = this.getTotalQueueSize();
    const processing = this.processingJobs.size;
    const completed = Array.from(this.jobs.values()).filter(job => job.status === JOB_STATUS.COMPLETED).length;
    const failed = Array.from(this.jobs.values()).filter(job => job.status === JOB_STATUS.FAILED).length;
    
    return {
      total: this.jobs.size,
      queued: total,
      processing,
      completed,
      failed,
      queuedByPriority: {
        urgent: this.priorityQueues.urgent.length,
        high: this.priorityQueues.high.length,
        standard: this.priorityQueues.standard.length,
        low: this.priorityQueues.low.length
      },
      capacity: {
        maxConcurrent: QUEUE_CONFIG.MAX_CONCURRENT_JOBS,
        maxQueue: QUEUE_CONFIG.MAX_QUEUE_SIZE,
        utilizationPercentage: Math.round((processing / QUEUE_CONFIG.MAX_CONCURRENT_JOBS) * 100)
      }
    };
  }

  /**
   * Clean up old completed/failed jobs
   */
  startCleanupProcess() {
    setInterval(() => {
      this.cleanupOldJobs();
    }, QUEUE_CONFIG.CLEANUP_INTERVAL);
  }

  async cleanupOldJobs() {
    const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago
    const jobsToRemove = [];
    
    for (const [jobId, job] of this.jobs.entries()) {
      const jobTime = job.completedAt || job.failedAt || job.cancelledAt;
      
      if (jobTime && jobTime < cutoffTime) {
        if ([JOB_STATUS.COMPLETED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED].includes(job.status)) {
          jobsToRemove.push(jobId);
        }
      }
    }
    
    // Remove old jobs
    for (const jobId of jobsToRemove) {
      this.jobs.delete(jobId);
      await AsyncStorage.removeItem(`job_${jobId}`);
    }
    
    if (jobsToRemove.length > 0) {
      console.log(`Cleaned up ${jobsToRemove.length} old jobs`);
    }
  }

  // Utility methods
  getTotalQueueSize() {
    return Object.values(this.priorityQueues).reduce((total, queue) => total + queue.length, 0);
  }

  validateJob(job) {
    if (!job.type) {
      throw new Error('Job type is required');
    }
    
    if (!job.id) {
      throw new Error('Job ID is required');
    }
    
    // Add specific validation based on job type
    switch (job.type) {
      case 'headshot_transformation':
        if (!job.imageUri || !job.style || !job.provider) {
          throw new Error('Headshot transformation jobs require imageUri, style, and provider');
        }
        break;
        
      case 'batch_processing':
        if (!job.images || !Array.isArray(job.images) || job.images.length === 0) {
          throw new Error('Batch processing jobs require images array');
        }
        break;
    }
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  async persistJob(job) {
    try {
      await AsyncStorage.setItem(`job_${job.id}`, JSON.stringify(job));
    } catch (error) {
      console.error('Failed to persist job:', error);
    }
  }

  async initializeFromStorage() {
    try {
      // Get all job keys from storage
      const keys = await AsyncStorage.getAllKeys();
      const jobKeys = keys.filter(key => key.startsWith('job_'));
      
      if (jobKeys.length === 0) return;
      
      // Load all jobs
      const jobsData = await AsyncStorage.multiGet(jobKeys);
      
      for (const [key, jobJson] of jobsData) {
        if (jobJson) {
          try {
            const job = JSON.parse(jobJson);
            
            // Only restore queued and processing jobs
            if ([JOB_STATUS.QUEUED, JOB_STATUS.PROCESSING].includes(job.status)) {
              // Reset processing jobs to queued
              if (job.status === JOB_STATUS.PROCESSING) {
                job.status = JOB_STATUS.QUEUED;
              }
              
              this.jobs.set(job.id, job);
              this.priorityQueues[job.priority || 'standard'].push(job);
            } else {
              // Keep completed/failed jobs for reference but don't queue them
              this.jobs.set(job.id, job);
            }
            
          } catch (parseError) {
            console.error('Failed to parse job data:', parseError);
            // Remove corrupted job data
            await AsyncStorage.removeItem(key);
          }
        }
      }
      
      console.log(`Restored ${this.getTotalQueueSize()} jobs from storage`);
      
    } catch (error) {
      console.error('Failed to initialize from storage:', error);
    }
  }
}

export { JOB_STATUS, QUEUE_CONFIG };