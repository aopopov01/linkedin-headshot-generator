/**
 * Batch Processing Service
 * Handles multiple image optimization requests efficiently
 * Manages queue, concurrency, and resource allocation for batch operations
 */

class BatchProcessingService {
  constructor() {
    // Batch processing configuration
    this.config = {
      maxConcurrentJobs: 3,
      maxBatchSize: 10,
      maxQueueSize: 50,
      jobTimeout: 300000, // 5 minutes
      retryAttempts: 2,
      retryDelay: 5000 // 5 seconds
    };

    // Processing queues
    this.activeJobs = new Map();
    this.jobQueue = [];
    this.completedJobs = new Map();
    this.failedJobs = new Map();

    // Batch metrics
    this.metrics = {
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0,
      totalImages: 0,
      successfulImages: 0,
      failedImages: 0,
      averageBatchTime: 0,
      averageImageTime: 0,
      concurrencyStats: {
        current: 0,
        peak: 0,
        average: 0
      }
    };

    // Start processing queue
    this.startQueueProcessor();
  }

  /**
   * Process a batch of images
   */
  async processBatch(batchRequest, optimizeFunction) {
    const batchId = this.generateBatchId();
    const startTime = Date.now();

    try {
      console.log(`📦 [${batchId}] Starting batch processing for ${batchRequest.images.length} images`);

      // Validate batch request
      this.validateBatchRequest(batchRequest);

      // Create batch job
      const batchJob = {
        id: batchId,
        images: batchRequest.images,
        options: batchRequest.options || {},
        status: 'queued',
        startTime,
        results: [],
        progress: {
          total: batchRequest.images.length,
          completed: 0,
          failed: 0,
          percentage: 0
        }
      };

      // Add to queue or process immediately
      if (this.activeJobs.size < this.config.maxConcurrentJobs) {
        return await this.processBatchJob(batchJob, optimizeFunction);
      } else {
        // Add to queue
        this.jobQueue.push({ batchJob, optimizeFunction });
        console.log(`⏳ [${batchId}] Added to queue (position: ${this.jobQueue.length})`);
        
        // Wait for processing
        return await this.waitForBatchCompletion(batchId);
      }

    } catch (error) {
      console.error(`❌ [${batchId}] Batch processing failed:`, error);
      this.metrics.failedBatches++;
      
      return {
        batchId,
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Process individual batch job
   */
  async processBatchJob(batchJob, optimizeFunction) {
    const { id: batchId } = batchJob;
    
    try {
      console.log(`🔄 [${batchId}] Processing batch with ${batchJob.images.length} images`);
      
      // Mark as active
      batchJob.status = 'processing';
      this.activeJobs.set(batchId, batchJob);
      this.updateConcurrencyMetrics();

      const results = [];
      const maxConcurrent = Math.min(this.config.maxConcurrentJobs, batchJob.images.length);
      
      // Process images in controlled chunks to manage memory and resources
      for (let i = 0; i < batchJob.images.length; i += maxConcurrent) {
        const chunk = batchJob.images.slice(i, i + maxConcurrent);
        const chunkPromises = chunk.map(async (imageRequest, index) => {
          const globalIndex = i + index;
          return this.processImageWithRetry(imageRequest, optimizeFunction, batchId, globalIndex);
        });

        // Wait for chunk completion
        const chunkResults = await Promise.allSettled(chunkPromises);
        
        // Process chunk results
        for (let j = 0; j < chunkResults.length; j++) {
          const globalIndex = i + j;
          const promiseResult = chunkResults[j];
          
          if (promiseResult.status === 'fulfilled') {
            results[globalIndex] = promiseResult.value;
            if (promiseResult.value.success) {
              batchJob.progress.completed++;
              this.metrics.successfulImages++;
            } else {
              batchJob.progress.failed++;
              this.metrics.failedImages++;
            }
          } else {
            results[globalIndex] = {
              success: false,
              error: promiseResult.reason?.message || 'Processing failed',
              imageIndex: globalIndex
            };
            batchJob.progress.failed++;
            this.metrics.failedImages++;
          }

          // Update progress
          batchJob.progress.percentage = Math.round(
            ((batchJob.progress.completed + batchJob.progress.failed) / batchJob.progress.total) * 100
          );

          console.log(`📊 [${batchId}] Progress: ${batchJob.progress.percentage}% (${batchJob.progress.completed + batchJob.progress.failed}/${batchJob.progress.total})`);
        }

        // Brief pause between chunks to prevent resource exhaustion
        if (i + maxConcurrent < batchJob.images.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Complete batch job
      const processingTime = Date.now() - batchJob.startTime;
      batchJob.status = 'completed';
      batchJob.results = results;
      batchJob.completedAt = Date.now();
      batchJob.processingTime = processingTime;

      // Move to completed jobs
      this.completedJobs.set(batchId, batchJob);
      this.activeJobs.delete(batchId);

      // Update metrics
      this.updateBatchMetrics(batchJob, processingTime);

      console.log(`✅ [${batchId}] Batch completed in ${processingTime}ms (${batchJob.progress.completed}/${batchJob.progress.total} successful)`);

      return {
        batchId,
        success: true,
        results,
        summary: {
          total: batchJob.progress.total,
          successful: batchJob.progress.completed,
          failed: batchJob.progress.failed,
          processingTime: `${processingTime}ms`
        }
      };

    } catch (error) {
      console.error(`❌ [${batchId}] Batch job processing failed:`, error);
      
      batchJob.status = 'failed';
      batchJob.error = error.message;
      this.failedJobs.set(batchId, batchJob);
      this.activeJobs.delete(batchId);
      
      throw error;
    }
  }

  /**
   * Process individual image with retry logic
   */
  async processImageWithRetry(imageRequest, optimizeFunction, batchId, imageIndex) {
    let lastError = null;
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await Promise.race([
          optimizeFunction(imageRequest),
          this.createTimeoutPromise(this.config.jobTimeout)
        ]);
        
        if (attempt > 0) {
          console.log(`🔄 [${batchId}] Image ${imageIndex} succeeded on attempt ${attempt + 1}`);
        }
        
        return {
          ...result,
          imageIndex,
          attempts: attempt + 1
        };
        
      } catch (error) {
        lastError = error;
        
        if (attempt < this.config.retryAttempts) {
          console.warn(`⚠️ [${batchId}] Image ${imageIndex} failed attempt ${attempt + 1}, retrying: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        } else {
          console.error(`❌ [${batchId}] Image ${imageIndex} failed all ${this.config.retryAttempts + 1} attempts: ${error.message}`);
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'Processing failed after all retry attempts',
      imageIndex,
      attempts: this.config.retryAttempts + 1
    };
  }

  /**
   * Create timeout promise for job timeout handling
   */
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Job timeout after ${timeout}ms`)), timeout);
    });
  }

  /**
   * Start the queue processor to handle queued jobs
   */
  startQueueProcessor() {
    setInterval(() => {
      if (this.jobQueue.length > 0 && this.activeJobs.size < this.config.maxConcurrentJobs) {
        const queuedJob = this.jobQueue.shift();
        this.processBatchJob(queuedJob.batchJob, queuedJob.optimizeFunction)
          .catch(error => {
            console.error('❌ Queued job processing failed:', error);
          });
      }
    }, 2000); // Check every 2 seconds
  }

  /**
   * Wait for batch completion when job is queued
   */
  async waitForBatchCompletion(batchId, maxWaitTime = 600000) { // 10 minutes
    const startWait = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        // Check if completed
        if (this.completedJobs.has(batchId)) {
          clearInterval(checkInterval);
          const batchJob = this.completedJobs.get(batchId);
          resolve({
            batchId,
            success: true,
            results: batchJob.results,
            summary: {
              total: batchJob.progress.total,
              successful: batchJob.progress.completed,
              failed: batchJob.progress.failed,
              processingTime: `${batchJob.processingTime}ms`
            }
          });
          return;
        }
        
        // Check if failed
        if (this.failedJobs.has(batchId)) {
          clearInterval(checkInterval);
          const batchJob = this.failedJobs.get(batchId);
          reject(new Error(`Batch processing failed: ${batchJob.error}`));
          return;
        }
        
        // Check for timeout
        if (Date.now() - startWait > maxWaitTime) {
          clearInterval(checkInterval);
          reject(new Error(`Batch processing timeout after ${maxWaitTime}ms`));
          return;
        }
      }, 5000); // Check every 5 seconds
    });
  }

  /**
   * Get batch status
   */
  getBatchStatus(batchId) {
    if (this.activeJobs.has(batchId)) {
      const job = this.activeJobs.get(batchId);
      return {
        status: 'processing',
        progress: job.progress,
        startTime: job.startTime,
        elapsedTime: Date.now() - job.startTime
      };
    }
    
    if (this.completedJobs.has(batchId)) {
      const job = this.completedJobs.get(batchId);
      return {
        status: 'completed',
        progress: job.progress,
        processingTime: job.processingTime,
        completedAt: job.completedAt
      };
    }
    
    if (this.failedJobs.has(batchId)) {
      const job = this.failedJobs.get(batchId);
      return {
        status: 'failed',
        error: job.error,
        progress: job.progress
      };
    }
    
    // Check queue
    const queuePosition = this.jobQueue.findIndex(item => item.batchJob.id === batchId);
    if (queuePosition !== -1) {
      return {
        status: 'queued',
        queuePosition: queuePosition + 1,
        estimatedWaitTime: this.estimateQueueWaitTime(queuePosition)
      };
    }
    
    return {
      status: 'not_found',
      error: 'Batch ID not found'
    };
  }

  /**
   * Estimate queue wait time
   */
  estimateQueueWaitTime(queuePosition) {
    const avgBatchTime = this.metrics.averageBatchTime || 60000; // Default 1 minute
    const estimatedTime = queuePosition * (avgBatchTime / this.config.maxConcurrentJobs);
    return Math.round(estimatedTime);
  }

  /**
   * Cancel a batch job
   */
  async cancelBatch(batchId) {
    try {
      // Remove from queue
      const queueIndex = this.jobQueue.findIndex(item => item.batchJob.id === batchId);
      if (queueIndex !== -1) {
        this.jobQueue.splice(queueIndex, 1);
        console.log(`🚫 [${batchId}] Batch cancelled (removed from queue)`);
        return { success: true, message: 'Batch removed from queue' };
      }
      
      // Cancel active job (note: individual image optimizations may still complete)
      if (this.activeJobs.has(batchId)) {
        const job = this.activeJobs.get(batchId);
        job.status = 'cancelled';
        this.activeJobs.delete(batchId);
        console.log(`🚫 [${batchId}] Active batch marked for cancellation`);
        return { success: true, message: 'Batch marked for cancellation' };
      }
      
      return { success: false, message: 'Batch not found or already completed' };
      
    } catch (error) {
      console.error(`❌ Failed to cancel batch ${batchId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate batch request
   */
  validateBatchRequest(batchRequest) {
    if (!batchRequest || !batchRequest.images || !Array.isArray(batchRequest.images)) {
      throw new Error('Batch request must contain an array of images');
    }
    
    if (batchRequest.images.length === 0) {
      throw new Error('Batch must contain at least one image');
    }
    
    if (batchRequest.images.length > this.config.maxBatchSize) {
      throw new Error(`Batch size ${batchRequest.images.length} exceeds maximum of ${this.config.maxBatchSize}`);
    }
    
    if (this.jobQueue.length >= this.config.maxQueueSize) {
      throw new Error(`Queue is full (${this.config.maxQueueSize} jobs). Please try again later.`);
    }
  }

  /**
   * Update batch processing metrics
   */
  updateBatchMetrics(batchJob, processingTime) {
    this.metrics.totalBatches++;
    this.metrics.successfulBatches++;
    this.metrics.totalImages += batchJob.progress.total;
    
    // Update average batch time
    const totalBatchTime = this.metrics.averageBatchTime * (this.metrics.totalBatches - 1) + processingTime;
    this.metrics.averageBatchTime = totalBatchTime / this.metrics.totalBatches;
    
    // Update average image time
    const avgImageTime = processingTime / batchJob.progress.total;
    const totalImageTime = this.metrics.averageImageTime * (this.metrics.totalImages - batchJob.progress.total) + (avgImageTime * batchJob.progress.total);
    this.metrics.averageImageTime = totalImageTime / this.metrics.totalImages;
  }

  /**
   * Update concurrency metrics
   */
  updateConcurrencyMetrics() {
    this.metrics.concurrencyStats.current = this.activeJobs.size;
    this.metrics.concurrencyStats.peak = Math.max(this.metrics.concurrencyStats.peak, this.activeJobs.size);
    
    // Calculate average concurrency (simplified)
    if (this.metrics.totalBatches > 0) {
      this.metrics.concurrencyStats.average = (
        (this.metrics.concurrencyStats.average * (this.metrics.totalBatches - 1) + this.activeJobs.size) / 
        this.metrics.totalBatches
      );
    }
  }

  /**
   * Generate unique batch ID
   */
  generateBatchId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `batch_${timestamp}_${random}`;
  }

  /**
   * Get processing metrics and statistics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueStatus: {
        active: this.activeJobs.size,
        queued: this.jobQueue.length,
        capacity: this.config.maxConcurrentJobs
      },
      successRate: this.metrics.totalBatches > 0 
        ? ((this.metrics.successfulBatches / this.metrics.totalBatches) * 100).toFixed(2) + '%'
        : '0%',
      imageSuccessRate: this.metrics.totalImages > 0
        ? ((this.metrics.successfulImages / this.metrics.totalImages) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Get queue information
   */
  getQueueInfo() {
    return {
      active: Array.from(this.activeJobs.keys()).map(batchId => ({
        batchId,
        status: this.activeJobs.get(batchId).status,
        progress: this.activeJobs.get(batchId).progress,
        elapsedTime: Date.now() - this.activeJobs.get(batchId).startTime
      })),
      queued: this.jobQueue.map((item, index) => ({
        batchId: item.batchJob.id,
        position: index + 1,
        imageCount: item.batchJob.images.length,
        estimatedWaitTime: this.estimateQueueWaitTime(index)
      })),
      capacity: {
        maxConcurrent: this.config.maxConcurrentJobs,
        maxBatchSize: this.config.maxBatchSize,
        maxQueueSize: this.config.maxQueueSize
      }
    };
  }

  /**
   * Health check for batch processing service
   */
  async healthCheck() {
    try {
      return {
        status: 'healthy',
        metrics: this.getMetrics(),
        configuration: {
          maxConcurrentJobs: this.config.maxConcurrentJobs,
          maxBatchSize: this.config.maxBatchSize,
          maxQueueSize: this.config.maxQueueSize,
          jobTimeout: `${this.config.jobTimeout / 1000}s`
        },
        queueInfo: this.getQueueInfo()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Clean up old completed and failed jobs
   */
  cleanupOldJobs(maxAge = 3600000) { // 1 hour
    const cutoffTime = Date.now() - maxAge;
    
    // Clean completed jobs
    for (const [batchId, job] of this.completedJobs.entries()) {
      if (job.completedAt < cutoffTime) {
        this.completedJobs.delete(batchId);
      }
    }
    
    // Clean failed jobs
    for (const [batchId, job] of this.failedJobs.entries()) {
      if (job.startTime < cutoffTime) {
        this.failedJobs.delete(batchId);
      }
    }
    
    console.log('🧹 Old batch jobs cleaned up');
  }
}

module.exports = { BatchProcessingService };