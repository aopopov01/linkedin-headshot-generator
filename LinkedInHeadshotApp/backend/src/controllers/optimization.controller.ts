/**
 * Optimization Controller
 * 
 * Handles all optimization-related API endpoints.
 * Integrates with the existing OmniShot service architecture.
 */

import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../services/database.service';
import { RedisService } from '../services/redis.service';
import { LoggerService } from '../services/logger.service';
import { JobQueueService } from '../services/jobQueue.service';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';

// Import existing services
import { OmnishotIntegrationService } from '../../src/services/omnishotIntegrationService';
import { MultiPlatformOptimizationEngine } from '../../src/services/multiPlatformOptimizationEngine';
import { PlatformSpecificationEngine } from '../../src/services/platformSpecificationEngine';
import { CostOptimizationService } from '../../src/services/costOptimizationService';
import { BatchProcessingService } from '../../src/services/batchProcessingService';

export class OptimizationController {
  private logger: LoggerService;
  private omnishotService: any;
  private optimizationEngine: any;
  private platformSpecs: any;
  private costOptimizer: any;
  private batchProcessor: any;

  constructor() {
    this.logger = new LoggerService('OptimizationController');
    
    // Initialize existing services
    this.omnishotService = OmnishotIntegrationService;
    this.optimizationEngine = new MultiPlatformOptimizationEngine();
    this.platformSpecs = new PlatformSpecificationEngine();
    this.costOptimizer = new CostOptimizationService();
    this.batchProcessor = new BatchProcessingService();
  }

  /**
   * Optimize a single photo for multiple platforms
   */
  public optimizePhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { targetPlatforms, professionalStyle, options = {} } = req.body;
      const imageFile = req.file;

      if (!imageFile) {
        res.status(400).json({
          success: false,
          error: 'Image file is required'
        });
        return;
      }

      this.logger.info(`Starting optimization for user ${userId}`, {
        platforms: targetPlatforms,
        style: professionalStyle
      });

      // Upload image to storage
      const imageUrl = await StorageService.uploadFile(imageFile, 'originals');

      // Get user profile for optimization context
      const user = await DatabaseService.getUserWithProfile(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Create optimization record
      const optimization = await DatabaseService.createOptimization({
        userId,
        originalImageUrl: imageUrl,
        originalImageHash: await this.generateImageHash(imageUrl),
        targetPlatforms,
        professionalStyle,
        customDimensions: options.customDimensions,
        status: 'PENDING',
        metadata: {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          options
        }
      });

      // Add to job queue for async processing
      await JobQueueService.addJob('optimization', {
        optimizationId: optimization.id,
        userId,
        imageUri: imageUrl,
        targetPlatforms,
        professionalStyle,
        options: {
          ...options,
          userProfile: user
        }
      }, {
        priority: user.tier === 'ENTERPRISE' ? 10 : user.tier === 'BUSINESS' ? 5 : 1,
        delay: 0,
        attempts: 3
      });

      // Store optimization ID in Redis for real-time tracking
      await RedisService.hset(`optimization:${optimization.id}`, 'status', 'PENDING');
      await RedisService.hset(`optimization:${optimization.id}`, 'progress', 0);
      await RedisService.expire(`optimization:${optimization.id}`, 3600); // 1 hour

      // Log audit event
      await DatabaseService.logAuditEvent({
        userId,
        action: 'optimization_create',
        resource: 'optimization',
        resourceId: optimization.id,
        newValues: { targetPlatforms, professionalStyle },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        data: {
          optimizationId: optimization.id,
          status: 'PENDING',
          estimatedTime: await this.estimateProcessingTime(targetPlatforms.length),
          targetPlatforms,
          professionalStyle,
          createdAt: optimization.createdAt
        }
      });

    } catch (error) {
      this.logger.error('Photo optimization failed:', error);
      next(error);
    }
  };

  /**
   * Optimize photo from URL
   */
  public optimizePhotoFromUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { imageUrl, targetPlatforms, professionalStyle, options = {} } = req.body;

      this.logger.info(`Starting URL optimization for user ${userId}`, {
        imageUrl,
        platforms: targetPlatforms
      });

      // Download and validate image
      const downloadedImage = await StorageService.downloadFromUrl(imageUrl);
      const uploadedImageUrl = await StorageService.uploadFile(downloadedImage, 'originals');

      // Continue with standard optimization flow
      const user = await DatabaseService.getUserWithProfile(userId);
      
      const optimization = await DatabaseService.createOptimization({
        userId,
        originalImageUrl: uploadedImageUrl,
        originalImageHash: await this.generateImageHash(uploadedImageUrl),
        targetPlatforms,
        professionalStyle,
        customDimensions: options.customDimensions,
        status: 'PENDING',
        metadata: {
          sourceUrl: imageUrl,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          options
        }
      });

      await JobQueueService.addJob('optimization', {
        optimizationId: optimization.id,
        userId,
        imageUri: uploadedImageUrl,
        targetPlatforms,
        professionalStyle,
        options: {
          ...options,
          userProfile: user
        }
      });

      res.status(201).json({
        success: true,
        data: {
          optimizationId: optimization.id,
          status: 'PENDING',
          estimatedTime: await this.estimateProcessingTime(targetPlatforms.length),
          targetPlatforms,
          professionalStyle
        }
      });

    } catch (error) {
      this.logger.error('URL optimization failed:', error);
      next(error);
    }
  };

  /**
   * Get optimization details
   */
  public getOptimization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { optimizationId } = req.params;
      const userId = req.user?.id;

      const optimization = await DatabaseService.getOptimizationDetails(optimizationId);
      
      if (!optimization) {
        res.status(404).json({
          success: false,
          error: 'Optimization not found'
        });
        return;
      }

      // Verify ownership
      if (optimization.userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      // Get real-time status from Redis if available
      const redisStatus = await RedisService.hgetall(`optimization:${optimizationId}`);
      
      const responseData = {
        id: optimization.id,
        status: redisStatus?.status || optimization.status,
        progress: redisStatus?.progress || optimization.progress,
        targetPlatforms: optimization.targetPlatforms,
        professionalStyle: optimization.professionalStyle,
        originalImageUrl: optimization.originalImageUrl,
        customDimensions: optimization.customDimensions,
        results: optimization.results,
        estimatedCost: optimization.estimatedCost,
        actualCost: optimization.actualCost,
        processingTime: optimization.processingTime,
        qualityScore: optimization.qualityScore,
        userRating: optimization.userRating,
        createdAt: optimization.createdAt,
        updatedAt: optimization.updatedAt,
        completedAt: optimization.completedAt
      };

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      this.logger.error('Failed to get optimization:', error);
      next(error);
    }
  };

  /**
   * Get optimization status
   */
  public getOptimizationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { optimizationId } = req.params;
      const userId = req.user?.id;

      // First check Redis for real-time status
      const redisStatus = await RedisService.hgetall(`optimization:${optimizationId}`);
      
      if (redisStatus) {
        res.json({
          success: true,
          data: {
            optimizationId,
            status: redisStatus.status,
            progress: parseInt(redisStatus.progress || '0'),
            message: redisStatus.message,
            estimatedTimeRemaining: redisStatus.estimatedTimeRemaining
          }
        });
        return;
      }

      // Fall back to database
      const optimization = await DatabaseService.getClient().optimization.findUnique({
        where: { id: optimizationId },
        select: {
          id: true,
          userId: true,
          status: true,
          progress: true,
          processingTime: true,
          createdAt: true,
          completedAt: true
        }
      });

      if (!optimization || optimization.userId !== userId) {
        res.status(404).json({
          success: false,
          error: 'Optimization not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          optimizationId,
          status: optimization.status,
          progress: optimization.progress,
          processingTime: optimization.processingTime,
          createdAt: optimization.createdAt,
          completedAt: optimization.completedAt
        }
      });

    } catch (error) {
      this.logger.error('Failed to get optimization status:', error);
      next(error);
    }
  };

  /**
   * Get optimization results
   */
  public getOptimizationResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { optimizationId } = req.params;
      const userId = req.user?.id;

      const optimization = await DatabaseService.getOptimizationDetails(optimizationId);
      
      if (!optimization || optimization.userId !== userId) {
        res.status(404).json({
          success: false,
          error: 'Optimization not found'
        });
        return;
      }

      if (optimization.status !== 'COMPLETED') {
        res.status(400).json({
          success: false,
          error: 'Optimization not yet completed',
          status: optimization.status
        });
        return;
      }

      const results = optimization.results.map(result => ({
        platform: result.platform,
        optimizedImageUrl: result.optimizedImageUrl,
        thumbnailUrl: result.thumbnailUrl,
        dimensions: result.dimensions,
        qualityScore: result.qualityScore,
        fileSize: result.fileSize,
        compressionRatio: result.compressionRatio,
        meetsRequirements: result.meetsRequirements,
        processingTime: result.processingTime,
        cost: result.cost
      }));

      res.json({
        success: true,
        data: {
          optimizationId,
          status: optimization.status,
          totalResults: results.length,
          results,
          totalCost: optimization.actualCost,
          processingTime: optimization.processingTime,
          qualityScore: optimization.qualityScore
        }
      });

    } catch (error) {
      this.logger.error('Failed to get optimization results:', error);
      next(error);
    }
  };

  /**
   * Get platform-specific result
   */
  public getPlatformResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { optimizationId, platform } = req.params;
      const userId = req.user?.id;

      const optimization = await DatabaseService.getOptimizationDetails(optimizationId);
      
      if (!optimization || optimization.userId !== userId) {
        res.status(404).json({
          success: false,
          error: 'Optimization not found'
        });
        return;
      }

      const platformResult = optimization.results.find(result => result.platform === platform);
      
      if (!platformResult) {
        res.status(404).json({
          success: false,
          error: `Result for platform ${platform} not found`
        });
        return;
      }

      res.json({
        success: true,
        data: {
          optimizationId,
          platform,
          optimizedImageUrl: platformResult.optimizedImageUrl,
          thumbnailUrl: platformResult.thumbnailUrl,
          dimensions: platformResult.dimensions,
          qualityScore: platformResult.qualityScore,
          fileSize: platformResult.fileSize,
          compressionRatio: platformResult.compressionRatio,
          meetsRequirements: platformResult.meetsRequirements,
          compliance: platformResult.compliance,
          processingTime: platformResult.processingTime,
          cost: platformResult.cost
        }
      });

    } catch (error) {
      this.logger.error('Failed to get platform result:', error);
      next(error);
    }
  };

  /**
   * Create batch optimization job
   */
  public createBatchJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { targetPlatforms, professionalStyle, options = {} } = req.body;
      const imageFiles = req.files as Express.Multer.File[];

      if (!imageFiles || imageFiles.length === 0) {
        res.status(400).json({
          success: false,
          error: 'At least one image file is required'
        });
        return;
      }

      this.logger.info(`Starting batch optimization for user ${userId}`, {
        imageCount: imageFiles.length,
        platforms: targetPlatforms
      });

      // Upload all images
      const imageUrls = await Promise.all(
        imageFiles.map(file => StorageService.uploadFile(file, 'originals'))
      );

      // Create batch job record
      const batchJob = await DatabaseService.getClient().batchJob.create({
        data: {
          userId,
          name: options.name || `Batch Job ${new Date().toISOString()}`,
          description: options.description,
          targetPlatforms,
          professionalStyle,
          status: 'PENDING',
          totalImages: imageUrls.length,
          estimatedCost: await this.estimateBatchCost(imageUrls.length, targetPlatforms)
        }
      });

      // Add to job queue
      await JobQueueService.addJob('batch-optimization', {
        batchJobId: batchJob.id,
        userId,
        imageUris: imageUrls,
        targetPlatforms,
        professionalStyle,
        options
      });

      res.status(201).json({
        success: true,
        data: {
          batchJobId: batchJob.id,
          status: 'PENDING',
          totalImages: imageUrls.length,
          targetPlatforms,
          professionalStyle,
          estimatedCost: batchJob.estimatedCost,
          estimatedTime: await this.estimateBatchProcessingTime(imageUrls.length, targetPlatforms.length)
        }
      });

    } catch (error) {
      this.logger.error('Batch job creation failed:', error);
      next(error);
    }
  };

  /**
   * Get batch job details
   */
  public getBatchJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { batchId } = req.params;
      const userId = req.user?.id;

      const batchJob = await DatabaseService.getClient().batchJob.findUnique({
        where: { id: batchId },
        include: {
          optimizations: {
            include: {
              results: true
            }
          }
        }
      });

      if (!batchJob || batchJob.userId !== userId) {
        res.status(404).json({
          success: false,
          error: 'Batch job not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: batchJob.id,
          name: batchJob.name,
          description: batchJob.description,
          status: batchJob.status,
          progress: batchJob.progress,
          totalImages: batchJob.totalImages,
          processedImages: batchJob.processedImages,
          successfulImages: batchJob.successfulImages,
          failedImages: batchJob.failedImages,
          targetPlatforms: batchJob.targetPlatforms,
          professionalStyle: batchJob.professionalStyle,
          estimatedCost: batchJob.estimatedCost,
          actualCost: batchJob.actualCost,
          startedAt: batchJob.startedAt,
          completedAt: batchJob.completedAt,
          createdAt: batchJob.createdAt,
          optimizations: batchJob.optimizations.map(opt => ({
            id: opt.id,
            status: opt.status,
            progress: opt.progress,
            originalImageUrl: opt.originalImageUrl,
            resultCount: opt.results.length
          }))
        }
      });

    } catch (error) {
      this.logger.error('Failed to get batch job:', error);
      next(error);
    }
  };

  /**
   * Get user recommendations
   */
  public getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      const user = await DatabaseService.getUserWithProfile(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Use existing service to get recommendations
      const recommendations = await this.omnishotService.getPlatformRecommendations(user);

      res.json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      this.logger.error('Failed to get recommendations:', error);
      next(error);
    }
  };

  /**
   * Estimate optimization cost
   */
  public estimateCost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { targetPlatforms, professionalStyle, imageCount = 1 } = req.body;
      const userId = req.user?.id;

      const user = await DatabaseService.getUserWithProfile(userId);
      const userTier = user?.tier || 'FREE';

      const costEstimate = await this.costOptimizer.estimateCost(
        targetPlatforms,
        professionalStyle,
        userTier,
        { batchSize: imageCount }
      );

      res.json({
        success: true,
        data: {
          totalCost: costEstimate.totalCost,
          costPerImage: costEstimate.costPerImage,
          breakdown: costEstimate.breakdown,
          withinBudget: costEstimate.withinBudget,
          estimatedSavings: costEstimate.estimatedSavings,
          recommendedStrategy: costEstimate.recommendedStrategy
        }
      });

    } catch (error) {
      this.logger.error('Failed to estimate cost:', error);
      next(error);
    }
  };

  /**
   * Get optimization history
   */
  public getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const platform = req.query.platform as string;
      const style = req.query.style as string;

      const skip = (page - 1) * limit;
      
      const where: any = { userId };
      
      if (status) where.status = status;
      if (style) where.professionalStyle = style;
      if (platform) {
        where.targetPlatforms = {
          has: platform
        };
      }

      const [optimizations, total] = await Promise.all([
        DatabaseService.getClient().optimization.findMany({
          where,
          include: {
            results: {
              select: {
                platform: true,
                qualityScore: true,
                fileSize: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        DatabaseService.getClient().optimization.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          optimizations: optimizations.map(opt => ({
            id: opt.id,
            status: opt.status,
            progress: opt.progress,
            targetPlatforms: opt.targetPlatforms,
            professionalStyle: opt.professionalStyle,
            actualCost: opt.actualCost,
            qualityScore: opt.qualityScore,
            processingTime: opt.processingTime,
            resultCount: opt.results.length,
            createdAt: opt.createdAt,
            completedAt: opt.completedAt
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      this.logger.error('Failed to get optimization history:', error);
      next(error);
    }
  };

  /**
   * Get optimization statistics
   */
  public getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const period = req.query.period as string || 'month';

      const userAnalytics = await DatabaseService.getClient().userAnalytics.findUnique({
        where: { userId }
      });

      if (!userAnalytics) {
        res.json({
          success: true,
          data: {
            totalOptimizations: 0,
            totalCost: 0,
            averageQualityScore: 0,
            successRate: 0,
            platformUsage: {},
            styleUsage: {}
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          totalOptimizations: userAnalytics.totalOptimizations,
          totalCost: userAnalytics.totalCost,
          totalSavings: userAnalytics.totalSavings,
          averageQualityScore: userAnalytics.averageQualityScore,
          averageProcessingTime: userAnalytics.averageProcessingTime,
          successRate: userAnalytics.successRate,
          platformUsage: userAnalytics.platformUsage,
          styleUsage: userAnalytics.styleUsage,
          longestStreak: userAnalytics.longestStreak,
          currentStreak: userAnalytics.currentStreak
        }
      });

    } catch (error) {
      this.logger.error('Failed to get optimization stats:', error);
      next(error);
    }
  };

  // ... Additional methods for retry, cancel, rating, etc.

  /**
   * Retry failed optimization
   */
  public retryOptimization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { optimizationId } = req.params;
      const userId = req.user?.id;

      const optimization = await DatabaseService.getOptimizationDetails(optimizationId);
      
      if (!optimization || optimization.userId !== userId) {
        res.status(404).json({
          success: false,
          error: 'Optimization not found'
        });
        return;
      }

      if (optimization.status !== 'FAILED') {
        res.status(400).json({
          success: false,
          error: 'Only failed optimizations can be retried'
        });
        return;
      }

      // Update status and add to queue
      await DatabaseService.getClient().optimization.update({
        where: { id: optimizationId },
        data: {
          status: 'PENDING',
          progress: 0,
          retryCount: { increment: 1 }
        }
      });

      await JobQueueService.addJob('optimization', {
        optimizationId,
        userId,
        imageUri: optimization.originalImageUrl,
        targetPlatforms: optimization.targetPlatforms,
        professionalStyle: optimization.professionalStyle,
        options: {}
      });

      res.json({
        success: true,
        data: {
          optimizationId,
          status: 'PENDING',
          retryCount: optimization.retryCount + 1
        }
      });

    } catch (error) {
      this.logger.error('Failed to retry optimization:', error);
      next(error);
    }
  };

  // Webhook handlers
  public handleProcessingComplete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for processing completion webhook
    res.status(200).json({ success: true });
  };

  public handleBatchComplete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for batch completion webhook
    res.status(200).json({ success: true });
  };

  // Helper methods
  private async generateImageHash(imageUrl: string): Promise<string> {
    // Implementation for generating image hash
    return 'hash_placeholder';
  }

  private async estimateProcessingTime(platformCount: number): Promise<number> {
    // Implementation for time estimation
    return platformCount * 30; // 30 seconds per platform
  }

  private async estimateBatchCost(imageCount: number, platforms: string[]): Promise<number> {
    // Implementation for batch cost estimation
    return imageCount * platforms.length * 0.10;
  }

  private async estimateBatchProcessingTime(imageCount: number, platformCount: number): Promise<number> {
    // Implementation for batch time estimation
    return imageCount * platformCount * 30;
  }

  // Additional methods: cancelOptimization, analyzeImage, getPlatformSpecs, etc.
  public cancelOptimization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation
    res.status(501).json({ error: 'Not implemented' });
  };

  public getBatchJobStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation
    res.status(501).json({ error: 'Not implemented' });
  };

  public getBatchJobResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation
    res.status(501).json({ error: 'Not implemented' });
  };

  public cancelBatchJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation
    res.status(501).json({ error: 'Not implemented' });
  };

  public optimizeCustomDimensions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation
    res.status(501).json({ error: 'Not implemented' });
  };

  public analyzeImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation
    res.status(501).json({ error: 'Not implemented' });
  };

  public getPlatformSpecs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation
    res.status(501).json({ error: 'Not implemented' });
  };

  public getPlatformSpec = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation
    res.status(501).json({ error: 'Not implemented' });
  };

  public getCostBreakdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation
    res.status(501).json({ error: 'Not implemented' });
  };

  public rateOptimization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation
    res.status(501).json({ error: 'Not implemented' });
  };

  public getQualityReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation
    res.status(501).json({ error: 'Not implemented' });
  };
}