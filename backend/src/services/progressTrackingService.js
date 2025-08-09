const Redis = require('ioredis');
const logger = require('../config/logger');
const db = require('../config/database');

class ProgressTrackingService {
  constructor() {
    this.redis = null;
    this.initialized = false;
    this.progressSubscribers = new Map(); // jobId -> Set of subscriber functions
    
    // Progress tracking configurations for LinkedIn headshot generation
    this.progressConfigs = {
      single_headshot: {
        steps: [
          { id: 'validation', name: 'Validating input photo', weight: 10 },
          { id: 'quality_assessment', name: 'Assessing photo quality', weight: 15 },
          { id: 'preprocessing', name: 'Preparing image for AI', weight: 10 },
          { id: 'ai_generation', name: 'Generating professional headshot', weight: 55 },
          { id: 'postprocessing', name: 'Enhancing final result', weight: 8 },
          { id: 'finalization', name: 'Finalizing and storing', weight: 2 }
        ],
        estimated_duration_seconds: 90
      },
      batch_headshots: {
        steps: [
          { id: 'validation', name: 'Validating input photo', weight: 5 },
          { id: 'quality_assessment', name: 'Assessing photo quality', weight: 10 },
          { id: 'preprocessing', name: 'Preparing for batch processing', weight: 5 },
          { id: 'batch_generation', name: 'Generating multiple styles', weight: 70 },
          { id: 'postprocessing', name: 'Processing results', weight: 8 },
          { id: 'finalization', name: 'Organizing final results', weight: 2 }
        ],
        estimated_duration_seconds: 480 // 8 minutes for batch
      },
      style_comparison: {
        steps: [
          { id: 'validation', name: 'Validating input', weight: 8 },
          { id: 'quality_assessment', name: 'Quality assessment', weight: 12 },
          { id: 'style_generation', name: 'Generating style variations', weight: 75 },
          { id: 'comparison_analysis', name: 'Analyzing style differences', weight: 3 },
          { id: 'finalization', name: 'Preparing comparison', weight: 2 }
        ],
        estimated_duration_seconds: 240 // 4 minutes
      },
      quality_analysis: {
        steps: [
          { id: 'validation', name: 'Validating photo', weight: 15 },
          { id: 'technical_analysis', name: 'Technical quality analysis', weight: 30 },
          { id: 'professional_assessment', name: 'Professional suitability check', weight: 40 },
          { id: 'recommendations', name: 'Generating recommendations', weight: 15 }
        ],
        estimated_duration_seconds: 20
      }
    };

    // Real-time update intervals based on job complexity
    this.updateIntervals = {
      quality_analysis: 1000,    // 1 second for quick analysis
      single_headshot: 3000,     // 3 seconds for single generation
      style_comparison: 4000,    // 4 seconds for comparison
      batch_headshots: 8000      // 8 seconds for batch processing
    };

    // WebSocket-like notifications for real-time updates
    this.realtimeCallbacks = new Map(); // userId -> Set of callbacks
    
    // Progress storage TTL
    this.progressTTL = 7200; // 2 hours (longer for headshot generation)
  }

  async initialize() {
    try {
      logger.info('Initializing Progress Tracking Service for LinkedIn Headshots...');

      // Initialize Redis connection
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });

        this.redis.on('error', (error) => {
          logger.error('Redis connection error in Progress Tracking:', error);
        });

        await this.redis.connect();
        logger.info('Redis connection established for headshot progress tracking');
      }

      this.initialized = true;
      logger.info('LinkedIn Headshot Progress Tracking Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('LinkedIn Headshot Progress Tracking Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start tracking progress for a headshot generation job
   */
  async startHeadshotProgress(jobId, jobType, userId, options = {}) {
    try {
      const config = this.progressConfigs[jobType];
      if (!config) {
        throw new Error(`Unknown headshot job type: ${jobType}`);
      }

      const progressData = {
        job_id: jobId,
        job_type: jobType,
        user_id: userId,
        status: 'started',
        current_step: 0,
        total_steps: config.steps.length,
        progress_percentage: 0,
        estimated_duration_seconds: config.estimated_duration_seconds,
        started_at: new Date().toISOString(),
        current_step_name: config.steps[0].name,
        steps: config.steps,
        metadata: {
          style: options.style || 'corporate',
          num_outputs: options.numOutputs || 4,
          batch_size: options.batchSize || 1,
          ...options.metadata
        },
        generation_details: {
          style_progress: {},
          current_prediction_id: null,
          estimated_images: options.numOutputs || 4
        },
        error: null
      };

      await this.storeProgress(progressData);
      this.notifyRealTimeSubscribers(userId, progressData);

      logger.info('Headshot progress tracking started:', { 
        jobId, 
        jobType, 
        userId,
        style: options.style,
        estimatedDuration: `${config.estimated_duration_seconds}s`
      });

      return progressData;
    } catch (error) {
      logger.error('Failed to start headshot progress tracking:', error);
      throw error;
    }
  }

  /**
   * Update progress with AI generation details
   */
  async updateHeadshotProgress(jobId, stepId, customProgress = null, generationDetails = {}) {
    try {
      const progressData = await this.getProgress(jobId);
      if (!progressData) {
        throw new Error('Progress data not found for headshot job: ' + jobId);
      }

      const config = this.progressConfigs[progressData.job_type];
      const stepIndex = config.steps.findIndex(step => step.id === stepId);
      
      if (stepIndex === -1 && customProgress === null) {
        throw new Error(`Unknown step: ${stepId} for job type: ${progressData.job_type}`);
      }

      // Calculate progress percentage
      let progressPercentage;
      if (customProgress !== null) {
        progressPercentage = Math.min(100, Math.max(0, customProgress));
      } else {
        let completedWeight = 0;
        for (let i = 0; i < stepIndex; i++) {
          completedWeight += config.steps[i].weight;
        }
        progressPercentage = Math.round(completedWeight);
      }

      // Update generation details
      const updatedGenerationDetails = {
        ...progressData.generation_details,
        ...generationDetails
      };

      // Special handling for AI generation progress
      if (stepId === 'ai_generation' || stepId === 'batch_generation') {
        if (generationDetails.prediction_id) {
          updatedGenerationDetails.current_prediction_id = generationDetails.prediction_id;
        }
        
        if (generationDetails.style_progress) {
          updatedGenerationDetails.style_progress = {
            ...updatedGenerationDetails.style_progress,
            ...generationDetails.style_progress
          };
        }

        // Calculate more granular progress for batch jobs
        if (progressData.job_type === 'batch_headshots' && generationDetails.completed_styles && generationDetails.total_styles) {
          const batchProgress = (generationDetails.completed_styles / generationDetails.total_styles);
          const stepWeight = config.steps[stepIndex].weight;
          const baseProgress = stepIndex > 0 ? config.steps.slice(0, stepIndex).reduce((sum, s) => sum + s.weight, 0) : 0;
          progressPercentage = Math.round(baseProgress + (stepWeight * batchProgress));
        }
      }

      const updatedProgress = {
        ...progressData,
        current_step: stepIndex >= 0 ? stepIndex : progressData.current_step,
        progress_percentage: progressPercentage,
        current_step_name: stepIndex >= 0 ? config.steps[stepIndex].name : progressData.current_step_name,
        last_updated: new Date().toISOString(),
        generation_details: updatedGenerationDetails,
        metadata: { 
          ...progressData.metadata, 
          last_step_update: stepId,
          ...generationDetails.metadata 
        }
      };

      // Calculate estimated completion
      if (progressPercentage > 0 && progressPercentage < 100) {
        const elapsed = new Date() - new Date(progressData.started_at);
        const totalEstimated = (elapsed / progressPercentage) * 100;
        const remaining = totalEstimated - elapsed;
        
        updatedProgress.estimated_completion = new Date(Date.now() + remaining).toISOString();
        updatedProgress.estimated_remaining_seconds = Math.round(remaining / 1000);
      }

      await this.storeProgress(updatedProgress);
      this.notifySubscribers(jobId, updatedProgress);
      this.notifyRealTimeSubscribers(progressData.user_id, updatedProgress);

      logger.debug('Headshot progress updated:', {
        jobId,
        stepId,
        progress: progressPercentage,
        predictionId: generationDetails.prediction_id
      });

      return updatedProgress;
    } catch (error) {
      logger.error('Failed to update headshot progress:', error);
      throw error;
    }
  }

  /**
   * Update batch generation progress with style details
   */
  async updateBatchStyleProgress(jobId, style, styleStatus, styleProgress = 0) {
    try {
      const progressData = await this.getProgress(jobId);
      if (!progressData) {
        throw new Error('Progress data not found for batch job: ' + jobId);
      }

      const updatedStyleProgress = {
        ...progressData.generation_details.style_progress,
        [style]: {
          status: styleStatus,
          progress: styleProgress,
          updated_at: new Date().toISOString()
        }
      };

      return await this.updateHeadshotProgress(jobId, 'batch_generation', null, {
        style_progress: updatedStyleProgress,
        metadata: {
          current_style: style,
          current_style_status: styleStatus
        }
      });
    } catch (error) {
      logger.error('Failed to update batch style progress:', error);
      throw error;
    }
  }

  /**
   * Complete headshot generation with results
   */
  async completeHeadshotProgress(jobId, results = {}) {
    try {
      const progressData = await this.getProgress(jobId);
      if (!progressData) {
        throw new Error('Progress data not found for job: ' + jobId);
      }

      const completedProgress = {
        ...progressData,
        status: 'completed',
        progress_percentage: 100,
        current_step: progressData.total_steps - 1,
        current_step_name: 'Completed Successfully',
        completed_at: new Date().toISOString(),
        result: {
          generated_images: results.generatedImages || [],
          total_images: results.totalImages || 0,
          successful_styles: results.successfulStyles || [],
          failed_styles: results.failedStyles || [],
          processing_summary: results.processingSummary || {},
          ...results
        },
        metadata: { 
          ...progressData.metadata, 
          completion_result: results,
          final_image_count: results.totalImages || 0
        }
      };

      // Calculate actual duration
      const actualDuration = Math.round(
        (new Date(completedProgress.completed_at) - new Date(progressData.started_at)) / 1000
      );
      completedProgress.actual_duration_seconds = actualDuration;

      await this.storeProgress(completedProgress);
      this.notifySubscribers(jobId, completedProgress);
      this.notifyRealTimeSubscribers(progressData.user_id, completedProgress);

      // Record performance metrics
      await this.recordHeadshotMetrics(jobId, progressData.job_type, actualDuration, results);

      logger.info('Headshot generation completed:', {
        jobId,
        jobType: progressData.job_type,
        actualDuration: `${actualDuration}s`,
        estimatedDuration: `${progressData.estimated_duration_seconds}s`,
        totalImages: results.totalImages || 0
      });

      return completedProgress;
    } catch (error) {
      logger.error('Failed to complete headshot progress:', error);
      throw error;
    }
  }

  /**
   * Register real-time progress updates for a user
   */
  subscribeToUserProgress(userId, callback) {
    if (!this.realtimeCallbacks.has(userId)) {
      this.realtimeCallbacks.set(userId, new Set());
    }
    
    this.realtimeCallbacks.get(userId).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.realtimeCallbacks.get(userId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.realtimeCallbacks.delete(userId);
        }
      }
    };
  }

  /**
   * Get user's active headshot jobs
   */
  async getUserActiveJobs(userId) {
    try {
      const activeJobs = await db('job_progress')
        .where('user_id', userId)
        .whereNotIn('status', ['completed', 'failed'])
        .orderBy('started_at', 'desc')
        .select([
          'job_id', 'job_type', 'status', 'progress_percentage',
          'current_step_name', 'estimated_completion', 'started_at'
        ]);

      // Enrich with real-time data from Redis
      const enrichedJobs = [];
      for (const job of activeJobs) {
        const realtimeProgress = await this.getProgress(job.job_id);
        enrichedJobs.push({
          ...job,
          realtime_progress: realtimeProgress ? {
            progress_percentage: realtimeProgress.progress_percentage,
            current_step_name: realtimeProgress.current_step_name,
            estimated_completion: realtimeProgress.estimated_completion,
            generation_details: realtimeProgress.generation_details
          } : null
        });
      }

      return enrichedJobs;
    } catch (error) {
      logger.error('Failed to get user active jobs:', error);
      throw error;
    }
  }

  /**
   * Get headshot generation statistics
   */
  async getHeadshotStatistics(timeframe = '24h') {
    try {
      let timeCondition;
      const now = new Date();
      
      switch (timeframe) {
        case '1h':
          timeCondition = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          timeCondition = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeCondition = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeCondition = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const stats = await db('job_progress')
        .where('started_at', '>=', timeCondition)
        .select(
          db.raw('job_type'),
          db.raw('COUNT(*) as total_jobs'),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as completed_jobs', ['completed']),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as failed_jobs', ['failed']),
          db.raw('AVG(actual_duration_seconds) as avg_duration'),
          db.raw('SUM(CASE WHEN result IS NOT NULL THEN JSON_EXTRACT(result, "$.totalImages") ELSE 0 END) as total_images_generated')
        )
        .groupBy('job_type');

      const summary = {
        timeframe,
        generation_performance: {},
        overall: {
          total_jobs: 0,
          completed_jobs: 0,
          failed_jobs: 0,
          success_rate: 0,
          total_images_generated: 0,
          avg_duration_seconds: 0,
          avg_images_per_job: 0
        }
      };

      let totalJobs = 0, totalCompleted = 0, totalFailed = 0;
      let totalDuration = 0, totalImages = 0;
      
      stats.forEach(stat => {
        const successRate = stat.total_jobs > 0 ? (stat.completed_jobs / stat.total_jobs) * 100 : 0;
        const avgImagesPerJob = stat.completed_jobs > 0 ? stat.total_images_generated / stat.completed_jobs : 0;
        
        summary.generation_performance[stat.job_type] = {
          total_jobs: parseInt(stat.total_jobs),
          completed_jobs: parseInt(stat.completed_jobs),
          failed_jobs: parseInt(stat.failed_jobs),
          success_rate: Math.round(successRate),
          avg_duration_seconds: Math.round(stat.avg_duration || 0),
          total_images_generated: parseInt(stat.total_images_generated || 0),
          avg_images_per_job: Math.round(avgImagesPerJob)
        };

        totalJobs += parseInt(stat.total_jobs);
        totalCompleted += parseInt(stat.completed_jobs);
        totalFailed += parseInt(stat.failed_jobs);
        totalDuration += (stat.avg_duration || 0) * parseInt(stat.total_jobs);
        totalImages += parseInt(stat.total_images_generated || 0);
      });

      summary.overall = {
        total_jobs: totalJobs,
        completed_jobs: totalCompleted,
        failed_jobs: totalFailed,
        success_rate: totalJobs > 0 ? Math.round((totalCompleted / totalJobs) * 100) : 0,
        total_images_generated: totalImages,
        avg_duration_seconds: totalJobs > 0 ? Math.round(totalDuration / totalJobs) : 0,
        avg_images_per_job: totalCompleted > 0 ? Math.round(totalImages / totalCompleted) : 0
      };

      return summary;
    } catch (error) {
      logger.error('Failed to get headshot statistics:', error);
      throw error;
    }
  }

  /**
   * Get style-specific performance metrics
   */
  async getStylePerformanceMetrics() {
    try {
      // This would require parsing the results JSON to extract style information
      // For now, return a simplified version
      const recentJobs = await db('job_progress')
        .where('status', 'completed')
        .where('started_at', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .whereNotNull('result')
        .limit(100);

      const styleMetrics = {};
      
      recentJobs.forEach(job => {
        try {
          const result = JSON.parse(job.result);
          const metadata = JSON.parse(job.metadata);
          
          if (metadata.style) {
            const style = metadata.style;
            
            if (!styleMetrics[style]) {
              styleMetrics[style] = {
                total_generations: 0,
                total_images: 0,
                avg_processing_time: 0,
                success_rate: 0
              };
            }
            
            styleMetrics[style].total_generations++;
            styleMetrics[style].total_images += result.totalImages || 0;
            styleMetrics[style].avg_processing_time += job.actual_duration_seconds || 0;
          }
        } catch (parseError) {
          // Skip jobs with invalid JSON
        }
      });

      // Calculate averages
      Object.keys(styleMetrics).forEach(style => {
        const metrics = styleMetrics[style];
        if (metrics.total_generations > 0) {
          metrics.avg_processing_time = Math.round(metrics.avg_processing_time / metrics.total_generations);
          metrics.avg_images_per_generation = Math.round(metrics.total_images / metrics.total_generations);
        }
      });

      return styleMetrics;
    } catch (error) {
      logger.error('Failed to get style performance metrics:', error);
      return {};
    }
  }

  /**
   * Helper methods (inherit base functionality and add headshot-specific features)
   */
  async getProgress(jobId) {
    try {
      // Try Redis first for latest data
      if (this.redis) {
        const redisData = await this.redis.get(`progress:${jobId}`);
        if (redisData) {
          return JSON.parse(redisData);
        }
      }

      // Fallback to database
      const dbRecord = await db('job_progress').where('job_id', jobId).first();
      if (dbRecord) {
        return {
          job_id: dbRecord.job_id,
          job_type: dbRecord.job_type,
          user_id: dbRecord.user_id,
          status: dbRecord.status,
          current_step: dbRecord.current_step,
          total_steps: dbRecord.total_steps,
          progress_percentage: dbRecord.progress_percentage,
          estimated_duration_seconds: dbRecord.estimated_duration_seconds,
          actual_duration_seconds: dbRecord.actual_duration_seconds,
          started_at: dbRecord.started_at,
          completed_at: dbRecord.completed_at,
          failed_at: dbRecord.failed_at,
          current_step_name: dbRecord.current_step_name,
          last_updated: dbRecord.last_updated,
          estimated_completion: dbRecord.estimated_completion,
          steps: JSON.parse(dbRecord.steps || '[]'),
          metadata: JSON.parse(dbRecord.metadata || '{}'),
          result: JSON.parse(dbRecord.result || 'null'),
          error: JSON.parse(dbRecord.error || 'null'),
          generation_details: JSON.parse(dbRecord.generation_details || '{}')
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to get headshot progress:', error);
      throw error;
    }
  }

  async storeProgress(progressData) {
    try {
      // Store in Redis for real-time access
      if (this.redis) {
        await this.redis.setex(
          `progress:${progressData.job_id}`,
          this.progressTTL,
          JSON.stringify(progressData)
        );
      }

      // Store/update in database
      await this.storeProgressInDB(progressData);
    } catch (error) {
      logger.error('Failed to store headshot progress:', error);
      throw error;
    }
  }

  async storeProgressInDB(progressData) {
    try {
      const dbData = {
        job_id: progressData.job_id,
        job_type: progressData.job_type,
        user_id: progressData.user_id,
        status: progressData.status,
        current_step: progressData.current_step,
        total_steps: progressData.total_steps,
        progress_percentage: progressData.progress_percentage,
        estimated_duration_seconds: progressData.estimated_duration_seconds,
        actual_duration_seconds: progressData.actual_duration_seconds,
        started_at: progressData.started_at,
        completed_at: progressData.completed_at,
        failed_at: progressData.failed_at,
        current_step_name: progressData.current_step_name,
        last_updated: progressData.last_updated || new Date().toISOString(),
        estimated_completion: progressData.estimated_completion,
        steps: JSON.stringify(progressData.steps || []),
        metadata: JSON.stringify(progressData.metadata || {}),
        result: JSON.stringify(progressData.result || null),
        error: JSON.stringify(progressData.error || null),
        generation_details: JSON.stringify(progressData.generation_details || {})
      };

      const exists = await db('job_progress').where('job_id', progressData.job_id).first();
      
      if (exists) {
        await db('job_progress')
          .where('job_id', progressData.job_id)
          .update(dbData);
      } else {
        await db('job_progress').insert(dbData);
      }
    } catch (error) {
      logger.error('Failed to store headshot progress in database:', error);
      throw error;
    }
  }

  notifySubscribers(jobId, progressData) {
    const subscribers = this.progressSubscribers.get(jobId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(progressData);
        } catch (error) {
          logger.error('Progress subscriber callback failed:', error);
        }
      });
    }
  }

  notifyRealTimeSubscribers(userId, progressData) {
    const callbacks = this.realtimeCallbacks.get(userId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback({
            type: 'progress_update',
            job_id: progressData.job_id,
            progress: progressData.progress_percentage,
            status: progressData.status,
            current_step: progressData.current_step_name,
            estimated_completion: progressData.estimated_completion,
            generation_details: progressData.generation_details
          });
        } catch (error) {
          logger.error('Real-time progress callback failed:', error);
        }
      });
    }
  }

  async recordHeadshotMetrics(jobId, jobType, actualDuration, results) {
    try {
      const config = this.progressConfigs[jobType];
      if (config) {
        const performanceRatio = actualDuration / config.estimated_duration_seconds;
        
        // Log performance variations
        if (performanceRatio > 1.5 || performanceRatio < 0.5) {
          logger.warn('Headshot generation duration significantly different from estimate:', {
            jobId,
            jobType,
            estimated: config.estimated_duration_seconds,
            actual: actualDuration,
            ratio: performanceRatio.toFixed(2),
            totalImages: results.totalImages || 0
          });
        }

        // Log successful generation metrics
        if (results.totalImages > 0) {
          logger.info('Headshot generation metrics:', {
            jobId,
            jobType,
            totalImages: results.totalImages,
            processingTimePerImage: Math.round(actualDuration / results.totalImages),
            successfulStyles: results.successfulStyles?.length || 0,
            failedStyles: results.failedStyles?.length || 0
          });
        }
      }
    } catch (error) {
      logger.error('Failed to record headshot metrics:', error);
    }
  }

  subscribeToProgress(jobId, callback) {
    if (!this.progressSubscribers.has(jobId)) {
      this.progressSubscribers.set(jobId, new Set());
    }
    
    this.progressSubscribers.get(jobId).add(callback);
    
    return () => {
      const subscribers = this.progressSubscribers.get(jobId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.progressSubscribers.delete(jobId);
        }
      }
    };
  }

  /**
   * Create a headshot-specific progress wrapper
   */
  createHeadshotProgressWrapper(jobId, jobType, userId, options = {}) {
    const config = this.progressConfigs[jobType];
    
    if (!config) {
      throw new Error(`Unknown headshot job type: ${jobType}`);
    }

    return {
      start: async () => {
        return await this.startHeadshotProgress(jobId, jobType, userId, options);
      },
      
      updateStep: async (stepId, generationDetails = {}) => {
        return await this.updateHeadshotProgress(jobId, stepId, null, generationDetails);
      },
      
      updateStyleProgress: async (style, styleStatus, styleProgress = 0) => {
        return await this.updateBatchStyleProgress(jobId, style, styleStatus, styleProgress);
      },
      
      updateCustomProgress: async (percentage, generationDetails = {}) => {
        return await this.updateHeadshotProgress(jobId, null, percentage, generationDetails);
      },
      
      complete: async (results = {}) => {
        return await this.completeHeadshotProgress(jobId, results);
      },
      
      fail: async (error) => {
        return await this.failProgress(jobId, error);
      },
      
      getCurrentProgress: async () => {
        return await this.getProgress(jobId);
      },
      
      subscribeToUpdates: (callback) => {
        return this.subscribeToProgress(jobId, callback);
      }
    };
  }

  async failProgress(jobId, error) {
    try {
      const progressData = await this.getProgress(jobId);
      if (!progressData) {
        logger.warn('Progress data not found for failed headshot job:', jobId);
        return;
      }

      const failedProgress = {
        ...progressData,
        status: 'failed',
        failed_at: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          step_failed: progressData.current_step_name
        },
        metadata: { 
          ...progressData.metadata, 
          failure_reason: error.message,
          failure_step: progressData.current_step_name
        }
      };

      await this.storeProgress(failedProgress);
      this.notifySubscribers(jobId, failedProgress);
      this.notifyRealTimeSubscribers(progressData.user_id, failedProgress);

      logger.warn('Headshot progress marked as failed:', {
        jobId,
        jobType: progressData.job_type,
        failedStep: progressData.current_step_name,
        error: error.message
      });

      return failedProgress;
    } catch (err) {
      logger.error('Failed to mark headshot progress as failed:', err);
      throw err;
    }
  }
}

module.exports = new ProgressTrackingService();