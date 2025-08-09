const logger = require('../config/logger');
const db = require('../config/database');
const aiService = require('./aiService');
const photoQualityService = require('./photoQualityService');

class BatchProcessingService {
  constructor() {
    this.initialized = false;
    this.activeJobs = new Map();
    this.jobQueue = [];
    this.maxConcurrentJobs = 3;
    this.processingInterval = null;
    
    // Batch processing configurations
    this.batchConfigs = {
      professional_package: {
        styles: ['corporate', 'creative', 'executive'],
        outputs_per_style: 4,
        total_outputs: 12,
        estimated_time_minutes: 8,
        priority: 'high'
      },
      complete_package: {
        styles: ['corporate', 'creative', 'executive', 'startup', 'healthcare'],
        outputs_per_style: 3,
        total_outputs: 15,
        estimated_time_minutes: 12,
        priority: 'medium'
      },
      style_comparison: {
        styles: ['corporate', 'creative'],
        outputs_per_style: 2,
        total_outputs: 4,
        estimated_time_minutes: 4,
        priority: 'high'
      },
      custom_batch: {
        styles: [], // User-defined
        outputs_per_style: 3,
        total_outputs: 0, // Calculated
        estimated_time_minutes: 0, // Calculated
        priority: 'medium'
      }
    };

    // Job status tracking
    this.jobStatuses = {
      queued: 'Waiting in queue',
      preprocessing: 'Preparing image',
      processing: 'Generating headshots',
      postprocessing: 'Finalizing results',
      completed: 'Completed successfully',
      failed: 'Generation failed',
      cancelled: 'Cancelled by user'
    };

    // Performance metrics
    this.metrics = {
      total_jobs_processed: 0,
      average_processing_time: 0,
      success_rate: 0,
      style_performance: {},
      queue_performance: {
        average_wait_time: 0,
        peak_queue_size: 0
      }
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Batch Processing Service...');

      // Load existing jobs from database
      await this.loadExistingJobs();

      // Start job processing loop
      this.startJobProcessor();

      // Initialize performance tracking
      await this.initializeMetrics();

      this.initialized = true;
      logger.info('Batch Processing Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Batch Processing Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Submit a new batch processing job
   */
  async submitBatchJob(jobConfig) {
    try {
      const {
        user_id,
        image_base64,
        batch_type = 'professional_package',
        custom_styles = [],
        options = {},
        priority = 'medium',
        metadata = {}
      } = jobConfig;

      // Validate input
      const validation = await this.validateBatchJob(jobConfig);
      if (!validation.valid) {
        throw new Error(`Batch job validation failed: ${validation.errors.join(', ')}`);
      }

      // Get batch configuration
      const batchConfig = this.getBatchConfiguration(batch_type, custom_styles);
      
      // Estimate processing time and cost
      const estimates = this.calculateJobEstimates(batchConfig);
      
      // Create job record
      const job = await this.createJobRecord({
        user_id,
        batch_type,
        batch_config: batchConfig,
        image_data: image_base64,
        options,
        priority,
        estimates,
        metadata,
        status: 'queued',
        created_at: new Date()
      });

      // Add to processing queue
      this.addToQueue(job);

      logger.info('Batch job submitted:', {
        jobId: job.id,
        userId: user_id,
        batchType: batch_type,
        stylesCount: batchConfig.styles.length,
        estimatedTime: estimates.estimated_time_minutes
      });

      return {
        success: true,
        job_id: job.id,
        batch_config: batchConfig,
        estimates,
        queue_position: this.getQueuePosition(job.id),
        estimated_start_time: this.estimateStartTime(job.id)
      };
    } catch (error) {
      logger.error('Batch job submission failed:', error);
      throw error;
    }
  }

  /**
   * Get batch job status and progress
   */
  async getJobStatus(jobId) {
    try {
      // Check active jobs first
      if (this.activeJobs.has(jobId)) {
        const activeJob = this.activeJobs.get(jobId);
        return {
          job_id: jobId,
          status: activeJob.status,
          progress: activeJob.progress,
          current_step: activeJob.current_step,
          completed_styles: activeJob.completed_styles || [],
          estimated_completion: activeJob.estimated_completion,
          processing_details: activeJob.processing_details
        };
      }

      // Check database for completed/failed jobs
      const job = await db('batch_jobs').where('id', jobId).first();
      if (!job) {
        return { error: 'Job not found' };
      }

      const status = {
        job_id: jobId,
        status: job.status,
        progress: job.progress || 0,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        processing_time_seconds: job.processing_time_seconds,
        batch_config: JSON.parse(job.batch_config),
        results: job.results ? JSON.parse(job.results) : null,
        error_details: job.error_details
      };

      // Add queue information if still queued
      if (job.status === 'queued') {
        status.queue_position = this.getQueuePosition(jobId);
        status.estimated_start_time = this.estimateStartTime(jobId);
      }

      return status;
    } catch (error) {
      logger.error('Failed to get job status:', error);
      return { error: error.message };
    }
  }

  /**
   * Cancel a batch job
   */
  async cancelJob(jobId, userId) {
    try {
      // Check if job belongs to user
      const job = await db('batch_jobs')
        .where('id', jobId)
        .andWhere('user_id', userId)
        .first();

      if (!job) {
        throw new Error('Job not found or access denied');
      }

      // If job is active, mark for cancellation
      if (this.activeJobs.has(jobId)) {
        const activeJob = this.activeJobs.get(jobId);
        activeJob.cancelled = true;
        activeJob.status = 'cancelled';
        
        // Stop any ongoing Replicate predictions
        if (activeJob.prediction_ids) {
          for (const predictionId of activeJob.prediction_ids) {
            try {
              await aiService.cancelGeneration(predictionId);
            } catch (error) {
              logger.warn('Failed to cancel prediction:', { predictionId, error: error.message });
            }
          }
        }
      }

      // Remove from queue if not started
      this.removeFromQueue(jobId);

      // Update database
      await db('batch_jobs')
        .where('id', jobId)
        .update({
          status: 'cancelled',
          completed_at: new Date(),
          error_details: 'Cancelled by user'
        });

      logger.info('Batch job cancelled:', { jobId, userId });
      
      return { success: true, message: 'Job cancelled successfully' };
    } catch (error) {
      logger.error('Job cancellation failed:', error);
      throw error;
    }
  }

  /**
   * Process jobs from the queue
   */
  async processJobQueue() {
    try {
      // Check if we can process more jobs
      if (this.activeJobs.size >= this.maxConcurrentJobs) {
        return;
      }

      // Get next job from queue
      const nextJob = this.getNextQueuedJob();
      if (!nextJob) {
        return;
      }

      // Move job to active processing
      this.activeJobs.set(nextJob.id, {
        ...nextJob,
        status: 'preprocessing',
        progress: 0,
        started_at: new Date(),
        current_step: 'Preparing image',
        processing_details: {}
      });

      // Remove from queue
      this.removeFromQueue(nextJob.id);

      // Start processing
      this.processJob(nextJob);

    } catch (error) {
      logger.error('Job queue processing failed:', error);
    }
  }

  /**
   * Process a single batch job
   */
  async processJob(job) {
    const jobId = job.id;
    let activeJob = this.activeJobs.get(jobId);
    
    try {
      logger.info('Starting batch job processing:', {
        jobId,
        batchType: job.batch_type,
        stylesCount: job.batch_config.styles.length
      });

      // Update job status in database
      await this.updateJobStatus(jobId, 'preprocessing', 5);

      // Step 1: Validate and preprocess image
      activeJob.current_step = 'Validating image quality';
      const imageValidation = await photoQualityService.validateForHeadshot(
        Buffer.from(job.image_data, 'base64')
      );

      if (!imageValidation.valid) {
        throw new Error(`Image validation failed: ${imageValidation.errors.join(', ')}`);
      }

      // Step 2: Assess photo quality
      activeJob.current_step = 'Analyzing photo quality';
      activeJob.progress = 10;
      this.activeJobs.set(jobId, activeJob);

      const qualityAssessment = await photoQualityService.assessPhotoForHeadshot(
        Buffer.from(job.image_data, 'base64')
      );

      activeJob.processing_details.quality_assessment = qualityAssessment;

      // Check if photo is suitable for generation
      if (qualityAssessment.overall_suitability_score < 40) {
        logger.warn('Low quality photo detected for batch job:', {
          jobId,
          qualityScore: qualityAssessment.overall_suitability_score
        });
      }

      // Step 3: Process each style
      activeJob.status = 'processing';
      activeJob.current_step = 'Generating headshots';
      activeJob.progress = 15;
      activeJob.completed_styles = [];
      activeJob.prediction_ids = [];
      this.activeJobs.set(jobId, activeJob);

      await this.updateJobStatus(jobId, 'processing', 15);

      const results = {
        styles: {},
        total_images: 0,
        processing_summary: {
          successful_styles: 0,
          failed_styles: 0,
          total_processing_time: 0
        }
      };

      const batchConfig = job.batch_config;
      const totalStyles = batchConfig.styles.length;
      
      for (let i = 0; i < totalStyles; i++) {
        const style = batchConfig.styles[i];
        
        // Check if job was cancelled
        if (activeJob.cancelled) {
          throw new Error('Job was cancelled by user');
        }

        const styleStartTime = Date.now();
        activeJob.current_step = `Processing ${style} style`;
        
        try {
          logger.info('Processing style:', { jobId, style, styleIndex: i + 1, totalStyles });

          const styleResult = await aiService.generateHeadshot(
            job.image_data,
            style,
            {
              numOutputs: batchConfig.outputs_per_style,
              ...job.options.aiParameters
            }
          );

          if (styleResult.success) {
            results.styles[style] = styleResult;
            results.total_images += styleResult.generatedImages.length;
            results.processing_summary.successful_styles++;
            
            activeJob.completed_styles.push({
              style,
              success: true,
              images_count: styleResult.generatedImages.length,
              processing_time: styleResult.processingTime
            });

            // Track prediction ID for potential cancellation
            if (styleResult.predictionId) {
              activeJob.prediction_ids.push(styleResult.predictionId);
            }
          } else {
            throw new Error(`Style generation failed: ${styleResult.error || 'Unknown error'}`);
          }

          results.processing_summary.total_processing_time += (Date.now() - styleStartTime) / 1000;

        } catch (styleError) {
          logger.error('Style processing failed:', {
            jobId,
            style,
            error: styleError.message
          });

          results.styles[style] = {
            success: false,
            error: styleError.message,
            generated_images: []
          };
          
          results.processing_summary.failed_styles++;
          
          activeJob.completed_styles.push({
            style,
            success: false,
            error: styleError.message,
            processing_time: (Date.now() - styleStartTime) / 1000
          });
        }

        // Update progress
        const progress = 15 + Math.round((i + 1) / totalStyles * 70); // 15% to 85%
        activeJob.progress = progress;
        activeJob.estimated_completion = this.calculateEstimatedCompletion(
          activeJob.started_at,
          progress,
          100
        );
        this.activeJobs.set(jobId, activeJob);

        await this.updateJobStatus(jobId, 'processing', progress);
      }

      // Step 4: Post-processing and finalization
      activeJob.status = 'postprocessing';
      activeJob.current_step = 'Finalizing results';
      activeJob.progress = 90;
      this.activeJobs.set(jobId, activeJob);

      await this.updateJobStatus(jobId, 'postprocessing', 90);

      // Generate batch summary
      const batchSummary = this.generateBatchSummary(results, job, qualityAssessment);
      results.batch_summary = batchSummary;

      // Complete the job
      const completedAt = new Date();
      const processingTime = Math.round((completedAt - activeJob.started_at) / 1000);

      await db('batch_jobs')
        .where('id', jobId)
        .update({
          status: 'completed',
          progress: 100,
          completed_at: completedAt,
          processing_time_seconds: processingTime,
          results: JSON.stringify(results)
        });

      // Update metrics
      await this.updateMetrics(job, results, processingTime);

      // Remove from active jobs
      this.activeJobs.delete(jobId);

      logger.info('Batch job completed successfully:', {
        jobId,
        processingTime: `${processingTime}s`,
        totalImages: results.total_images,
        successfulStyles: results.processing_summary.successful_styles,
        failedStyles: results.processing_summary.failed_styles
      });

    } catch (error) {
      logger.error('Batch job processing failed:', {
        jobId,
        error: error.message,
        stack: error.stack
      });

      // Mark job as failed
      await db('batch_jobs')
        .where('id', jobId)
        .update({
          status: 'failed',
          completed_at: new Date(),
          error_details: error.message
        });

      // Remove from active jobs
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Helper methods
   */
  async validateBatchJob(jobConfig) {
    const errors = [];
    
    if (!jobConfig.user_id) {
      errors.push('User ID is required');
    }
    
    if (!jobConfig.image_base64) {
      errors.push('Image data is required');
    }
    
    if (jobConfig.batch_type && !this.batchConfigs[jobConfig.batch_type]) {
      errors.push('Invalid batch type');
    }
    
    if (jobConfig.batch_type === 'custom_batch' && (!jobConfig.custom_styles || jobConfig.custom_styles.length === 0)) {
      errors.push('Custom styles are required for custom batch type');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getBatchConfiguration(batchType, customStyles = []) {
    if (batchType === 'custom_batch') {
      const outputsPerStyle = 3; // Default
      return {
        styles: customStyles,
        outputs_per_style: outputsPerStyle,
        total_outputs: customStyles.length * outputsPerStyle,
        estimated_time_minutes: Math.ceil(customStyles.length * 2.5),
        priority: 'medium'
      };
    }
    
    return { ...this.batchConfigs[batchType] };
  }

  calculateJobEstimates(batchConfig) {
    const baseTimePerStyle = 2; // minutes
    const setupTime = 1; // minute
    
    const estimatedTimeMinutes = setupTime + (batchConfig.styles.length * baseTimePerStyle);
    const estimatedCost = aiService.calculateBatchCost(batchConfig.styles, batchConfig.outputs_per_style);
    
    return {
      estimated_time_minutes: estimatedTimeMinutes,
      estimated_cost_usd: parseFloat(estimatedCost),
      total_outputs: batchConfig.total_outputs
    };
  }

  async createJobRecord(jobData) {
    const [job] = await db('batch_jobs').insert({
      user_id: jobData.user_id,
      batch_type: jobData.batch_type,
      batch_config: JSON.stringify(jobData.batch_config),
      image_data: jobData.image_data,
      options: JSON.stringify(jobData.options),
      priority: jobData.priority,
      estimates: JSON.stringify(jobData.estimates),
      metadata: JSON.stringify(jobData.metadata),
      status: jobData.status,
      progress: 0,
      created_at: jobData.created_at
    }).returning('*');

    return job;
  }

  addToQueue(job) {
    this.jobQueue.push(job);
    this.sortQueueByPriority();
    
    // Update metrics
    this.metrics.queue_performance.peak_queue_size = Math.max(
      this.metrics.queue_performance.peak_queue_size,
      this.jobQueue.length
    );
  }

  removeFromQueue(jobId) {
    this.jobQueue = this.jobQueue.filter(job => job.id !== jobId);
  }

  getQueuePosition(jobId) {
    return this.jobQueue.findIndex(job => job.id === jobId) + 1;
  }

  estimateStartTime(jobId) {
    const position = this.getQueuePosition(jobId);
    if (position === 0) return null; // Not in queue
    
    const avgProcessingTime = this.metrics.average_processing_time || 8; // minutes
    const estimatedWaitMinutes = Math.ceil(position * avgProcessingTime / this.maxConcurrentJobs);
    
    const estimatedStart = new Date();
    estimatedStart.setMinutes(estimatedStart.getMinutes() + estimatedWaitMinutes);
    
    return estimatedStart;
  }

  sortQueueByPriority() {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    this.jobQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Same priority, sort by creation time
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }

  getNextQueuedJob() {
    return this.jobQueue.length > 0 ? this.jobQueue[0] : null;
  }

  async updateJobStatus(jobId, status, progress) {
    await db('batch_jobs')
      .where('id', jobId)
      .update({
        status,
        progress,
        updated_at: new Date()
      });
  }

  calculateEstimatedCompletion(startTime, currentProgress, totalProgress) {
    const elapsed = Date.now() - new Date(startTime);
    const progressRatio = currentProgress / totalProgress;
    
    if (progressRatio === 0) return null;
    
    const totalEstimatedTime = elapsed / progressRatio;
    const remainingTime = totalEstimatedTime - elapsed;
    
    const estimatedCompletion = new Date(Date.now() + remainingTime);
    return estimatedCompletion;
  }

  generateBatchSummary(results, job, qualityAssessment) {
    return {
      job_id: job.id,
      batch_type: job.batch_type,
      total_styles_processed: Object.keys(results.styles).length,
      total_images_generated: results.total_images,
      processing_summary: results.processing_summary,
      input_photo_quality: {
        overall_score: qualityAssessment.overall_suitability_score,
        quality_tier: qualityAssessment.professional_readiness.level
      },
      style_breakdown: Object.keys(results.styles).map(style => ({
        style,
        success: results.styles[style].success,
        images_count: results.styles[style].success ? results.styles[style].generatedImages.length : 0,
        error: results.styles[style].error || null
      })),
      recommendations: qualityAssessment.recommendations,
      created_at: job.created_at,
      processing_started: job.started_at,
      processing_completed: new Date().toISOString()
    };
  }

  async updateMetrics(job, results, processingTime) {
    this.metrics.total_jobs_processed++;
    
    // Update average processing time
    const totalTime = this.metrics.average_processing_time * (this.metrics.total_jobs_processed - 1) + processingTime / 60;
    this.metrics.average_processing_time = totalTime / this.metrics.total_jobs_processed;
    
    // Update success rate
    const successful = results.processing_summary.successful_styles > 0;
    const totalSuccesses = successful ? this.metrics.total_jobs_processed * this.metrics.success_rate + 1 : this.metrics.total_jobs_processed * this.metrics.success_rate;
    this.metrics.success_rate = totalSuccesses / this.metrics.total_jobs_processed;
    
    // Update style performance
    Object.keys(results.styles).forEach(style => {
      if (!this.metrics.style_performance[style]) {
        this.metrics.style_performance[style] = { total: 0, successful: 0 };
      }
      
      this.metrics.style_performance[style].total++;
      if (results.styles[style].success) {
        this.metrics.style_performance[style].successful++;
      }
    });
  }

  startJobProcessor() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    this.processingInterval = setInterval(() => {
      this.processJobQueue();
    }, 5000); // Check every 5 seconds
  }

  async loadExistingJobs() {
    try {
      // Load any jobs that were interrupted during server restart
      const incompleteJobs = await db('batch_jobs')
        .whereIn('status', ['queued', 'preprocessing', 'processing', 'postprocessing'])
        .orderBy('created_at', 'asc');

      for (const job of incompleteJobs) {
        if (job.status === 'queued') {
          this.jobQueue.push({
            ...job,
            batch_config: JSON.parse(job.batch_config),
            options: JSON.parse(job.options),
            estimates: JSON.parse(job.estimates),
            metadata: JSON.parse(job.metadata)
          });
        } else {
          // Mark interrupted jobs as failed
          await db('batch_jobs')
            .where('id', job.id)
            .update({
              status: 'failed',
              error_details: 'Server restart interrupted processing',
              completed_at: new Date()
            });
        }
      }

      this.sortQueueByPriority();
      logger.info(`Loaded ${this.jobQueue.length} queued jobs from database`);
    } catch (error) {
      logger.error('Failed to load existing jobs:', error);
    }
  }

  async initializeMetrics() {
    try {
      // Calculate metrics from historical data
      const stats = await db('batch_jobs')
        .select(
          db.raw('COUNT(*) as total_jobs'),
          db.raw('AVG(processing_time_seconds) as avg_processing_time'),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as successful_jobs', ['completed'])
        )
        .where('created_at', '>', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        .first();

      if (stats.total_jobs > 0) {
        this.metrics.total_jobs_processed = parseInt(stats.total_jobs);
        this.metrics.average_processing_time = parseFloat(stats.avg_processing_time) / 60 || 0; // Convert to minutes
        this.metrics.success_rate = parseFloat(stats.successful_jobs) / parseFloat(stats.total_jobs);
      }

      logger.info('Metrics initialized:', this.metrics);
    } catch (error) {
      logger.error('Failed to initialize metrics:', error);
    }
  }

  /**
   * Get service statistics and metrics
   */
  getServiceMetrics() {
    return {
      queue_status: {
        active_jobs: this.activeJobs.size,
        queued_jobs: this.jobQueue.length,
        max_concurrent: this.maxConcurrentJobs
      },
      performance_metrics: this.metrics,
      available_batch_types: Object.keys(this.batchConfigs),
      service_health: {
        status: this.initialized ? 'healthy' : 'initializing',
        queue_capacity: this.maxConcurrentJobs - this.activeJobs.size
      }
    };
  }

  /**
   * Get user's batch job history
   */
  async getUserBatchHistory(userId, limit = 10) {
    try {
      const jobs = await db('batch_jobs')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .select([
          'id', 'batch_type', 'status', 'progress',
          'created_at', 'started_at', 'completed_at',
          'processing_time_seconds', 'estimates'
        ]);

      return jobs.map(job => ({
        ...job,
        estimates: job.estimates ? JSON.parse(job.estimates) : null
      }));
    } catch (error) {
      logger.error('Failed to get user batch history:', error);
      throw error;
    }
  }

  /**
   * Cleanup completed jobs older than specified days
   */
  async cleanupOldJobs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await db('batch_jobs')
        .where('completed_at', '<', cutoffDate)
        .whereIn('status', ['completed', 'failed', 'cancelled'])
        .del();

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old batch jobs`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old jobs:', error);
      return 0;
    }
  }

  /**
   * Shutdown the service gracefully
   */
  async shutdown() {
    try {
      logger.info('Shutting down Batch Processing Service...');

      // Stop processing new jobs
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = null;
      }

      // Wait for active jobs to complete or timeout
      const shutdownTimeout = 60000; // 1 minute
      const startTime = Date.now();

      while (this.activeJobs.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
        logger.info(`Waiting for ${this.activeJobs.size} active jobs to complete...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Force stop remaining jobs
      if (this.activeJobs.size > 0) {
        logger.warn(`Forcing shutdown with ${this.activeJobs.size} active jobs`);
        
        for (const [jobId, job] of this.activeJobs) {
          await db('batch_jobs')
            .where('id', jobId)
            .update({
              status: 'failed',
              error_details: 'Server shutdown interrupted processing',
              completed_at: new Date()
            });
        }
        
        this.activeJobs.clear();
      }

      logger.info('Batch Processing Service shutdown completed');
    } catch (error) {
      logger.error('Error during batch processing service shutdown:', error);
    }
  }
}

module.exports = new BatchProcessingService();