/**
 * OmniShot Integration Service
 * Main integration layer that coordinates all OmniShot services
 * Provides unified interface for multi-platform photo optimization
 */

const { MultiPlatformOptimizationEngine } = require('./multiPlatformOptimizationEngine');
const { PlatformSpecificationEngine } = require('./platformSpecificationEngine');
const { IntelligentImageProcessor } = require('./intelligentImageProcessor');
const { CustomDimensionHandler } = require('./customDimensionHandler');
const { BatchProcessingService } = require('./batchProcessingService');
const { MonitoringService } = require('./monitoringService');

class OmniShotIntegrationService {
  constructor() {
    this.optimizationEngine = new MultiPlatformOptimizationEngine();
    this.platformSpecs = new PlatformSpecificationEngine();
    this.imageProcessor = new IntelligentImageProcessor();
    this.customDimensions = new CustomDimensionHandler();
    this.batchProcessor = new BatchProcessingService();
    this.monitor = new MonitoringService();
    
    // Service configuration
    this.config = {
      maxConcurrentOptimizations: 5,
      maxImageSize: 50 * 1024 * 1024, // 50MB
      supportedFormats: ['jpeg', 'jpg', 'png', 'webp'],
      defaultTimeout: 120000, // 2 minutes
      retryAttempts: 3,
      retryDelay: 1000
    };

    // Service metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      uptime: Date.now()
    };
  }

  /**
   * Main API endpoint for multi-platform optimization
   * Unified entry point that handles all optimization requests
   */
  async optimizeImage(request) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      console.log(`🚀 [${requestId}] Starting OmniShot optimization request`);
      this.metrics.totalRequests++;

      // Validate request
      this.validateRequest(request);

      // Extract request parameters
      const {
        imageBuffer,
        platforms = ['linkedin'],
        style = 'professional',
        customDimensions = null,
        options = {}
      } = request;

      console.log(`📱 [${requestId}] Platforms: ${platforms.join(', ')}, Style: ${style}`);

      // Start monitoring
      this.monitor.startRequest(requestId, {
        platforms: platforms.length,
        style,
        hasCustomDimensions: !!customDimensions,
        imageSize: imageBuffer.length
      });

      // Handle custom dimensions if provided
      let processedRequest = request;
      if (customDimensions) {
        console.log(`📐 [${requestId}] Processing custom dimensions`);
        processedRequest = await this.customDimensions.processCustomDimensions(
          request,
          customDimensions
        );
      }

      // Execute optimization
      const optimizationResult = await this.optimizationEngine.optimizeForMultiplePlatforms(
        processedRequest.imageBuffer,
        platforms,
        style,
        options
      );

      // Process results
      const processedResults = await this.processOptimizationResults(
        optimizationResult,
        requestId
      );

      const processingTime = Date.now() - startTime;
      console.log(`✅ [${requestId}] OmniShot optimization complete in ${processingTime}ms`);

      // Update metrics
      this.updateMetrics(true, processingTime);

      // Complete monitoring
      this.monitor.completeRequest(requestId, {
        success: true,
        platformCount: platforms.length,
        processingTime
      });

      return {
        success: true,
        requestId,
        results: processedResults,
        metadata: {
          platforms,
          style,
          customDimensions: !!customDimensions,
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error(`❌ [${requestId}] OmniShot optimization failed:`, error);
      
      const processingTime = Date.now() - startTime;
      this.updateMetrics(false, processingTime);
      this.monitor.failRequest(requestId, error);

      return {
        success: false,
        requestId,
        error: error.message,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Batch optimization for multiple images
   */
  async optimizeBatch(batchRequest) {
    const batchId = this.generateBatchId();
    
    try {
      console.log(`📦 [${batchId}] Starting batch optimization for ${batchRequest.images.length} images`);

      // Validate batch request
      this.validateBatchRequest(batchRequest);

      // Process batch
      const batchResult = await this.batchProcessor.processBatch(
        batchRequest,
        this.optimizeImage.bind(this)
      );

      return {
        success: true,
        batchId,
        results: batchResult,
        summary: {
          totalImages: batchRequest.images.length,
          successful: batchResult.filter(r => r.success).length,
          failed: batchResult.filter(r => !r.success).length
        }
      };

    } catch (error) {
      console.error(`❌ [${batchId}] Batch optimization failed:`, error);
      return {
        success: false,
        batchId,
        error: error.message
      };
    }
  }

  /**
   * Get available platforms with specifications
   */
  async getAvailablePlatforms() {
    try {
      const platforms = this.platformSpecs.getAllPlatforms();
      const platformDetails = {};

      for (const platform of platforms) {
        const spec = this.platformSpecs.getPlatformSpec(platform);
        platformDetails[platform] = {
          name: spec.name,
          category: spec.category,
          icon: spec.icon,
          color: spec.color,
          description: spec.description,
          dimensions: `${spec.width}x${spec.height}`,
          aspectRatio: spec.aspectRatio
        };
      }

      return {
        success: true,
        platforms: platformDetails,
        categories: this.platformSpecs.getAllCategories()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available AI styles
   */
  getAvailableStyles() {
    return {
      success: true,
      styles: {
        professional: {
          name: 'Professional',
          description: 'Executive business professional style',
          bestFor: ['linkedin', 'github', 'whatsapp_business'],
          enhancement: 'Corporate authority and expertise'
        },
        creative: {
          name: 'Creative',
          description: 'Artistic and innovative style',
          bestFor: ['instagram', 'youtube', 'tiktok'],
          enhancement: 'Creative personality and innovation'
        },
        tech: {
          name: 'Tech Professional',
          description: 'Modern technical expert style',
          bestFor: ['github', 'linkedin', 'twitter'],
          enhancement: 'Technical competence and innovation'
        },
        healthcare: {
          name: 'Healthcare Professional',
          description: 'Medical and healthcare professional style',
          bestFor: ['linkedin', 'whatsapp_business'],
          enhancement: 'Trust and medical authority'
        },
        finance: {
          name: 'Finance Professional',
          description: 'Banking and finance expert style',
          bestFor: ['linkedin', 'twitter'],
          enhancement: 'Financial expertise and reliability'
        },
        startup: {
          name: 'Startup Leader',
          description: 'Entrepreneurial and dynamic style',
          bestFor: ['twitter', 'instagram', 'youtube'],
          enhancement: 'Leadership and innovation'
        }
      }
    };
  }

  /**
   * Process optimization results
   */
  async processOptimizationResults(optimizationResult, requestId) {
    try {
      const processedResults = {};

      if (optimizationResult.success && optimizationResult.platformResults) {
        for (const [platform, result] of Object.entries(optimizationResult.platformResults)) {
          if (result.success) {
            processedResults[platform] = {
              success: true,
              platform: result.platform,
              dimensions: result.dimensions,
              quality: result.qualityScore,
              processingTime: result.processingTime,
              optimizationLevel: result.optimizationLevel,
              imageData: result.imageBuffer.toString('base64'),
              specifications: {
                width: result.specifications.width,
                height: result.specifications.height,
                format: result.specifications.format,
                quality: result.specifications.quality
              }
            };
          } else {
            processedResults[platform] = {
              success: false,
              platform: platform,
              error: result.error
            };
          }
        }
      }

      return processedResults;

    } catch (error) {
      console.error(`❌ [${requestId}] Result processing failed:`, error);
      throw new Error(`Failed to process optimization results: ${error.message}`);
    }
  }

  /**
   * Validate optimization request
   */
  validateRequest(request) {
    if (!request) {
      throw new Error('Request is required');
    }

    if (!request.imageBuffer || !Buffer.isBuffer(request.imageBuffer)) {
      throw new Error('Valid image buffer is required');
    }

    if (request.imageBuffer.length > this.config.maxImageSize) {
      throw new Error(`Image size ${request.imageBuffer.length} exceeds maximum of ${this.config.maxImageSize}`);
    }

    if (request.platforms && !Array.isArray(request.platforms)) {
      throw new Error('Platforms must be an array');
    }

    if (request.platforms && request.platforms.length === 0) {
      throw new Error('At least one platform must be specified');
    }

    const supportedPlatforms = this.platformSpecs.getAllPlatforms();
    const unsupportedPlatforms = (request.platforms || []).filter(p => !supportedPlatforms.includes(p));
    
    if (unsupportedPlatforms.length > 0) {
      throw new Error(`Unsupported platforms: ${unsupportedPlatforms.join(', ')}`);
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

    if (batchRequest.images.length > 10) {
      throw new Error('Batch size cannot exceed 10 images');
    }

    // Validate each image in batch
    batchRequest.images.forEach((imageRequest, index) => {
      try {
        this.validateRequest(imageRequest);
      } catch (error) {
        throw new Error(`Image ${index + 1} validation failed: ${error.message}`);
      }
    });
  }

  /**
   * Update service metrics
   */
  updateMetrics(success, processingTime) {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average processing time
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageProcessingTime = (
      (this.metrics.averageProcessingTime * (totalRequests - 1) + processingTime) / totalRequests
    );
  }

  /**
   * Get service metrics and status
   */
  getServiceStatus() {
    return {
      status: 'active',
      uptime: Date.now() - this.metrics.uptime,
      metrics: {
        ...this.metrics,
        successRate: this.metrics.totalRequests > 0 
          ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
          : '0%'
      },
      configuration: {
        maxConcurrentOptimizations: this.config.maxConcurrentOptimizations,
        maxImageSize: `${(this.config.maxImageSize / (1024 * 1024)).toFixed(1)}MB`,
        supportedFormats: this.config.supportedFormats,
        timeout: `${this.config.defaultTimeout / 1000}s`
      }
    };
  }

  /**
   * Health check for all integrated services
   */
  async healthCheck() {
    try {
      const serviceChecks = await Promise.allSettled([
        this.optimizationEngine.healthCheck(),
        this.platformSpecs.healthCheck(),
        this.imageProcessor.healthCheck(),
        this.customDimensions.healthCheck(),
        this.batchProcessor.healthCheck(),
        this.monitor.healthCheck()
      ]);

      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          optimizationEngine: serviceChecks[0].status === 'fulfilled' ? serviceChecks[0].value : { status: 'unhealthy', error: serviceChecks[0].reason?.message },
          platformSpecs: serviceChecks[1].status === 'fulfilled' ? serviceChecks[1].value : { status: 'unhealthy', error: serviceChecks[1].reason?.message },
          imageProcessor: serviceChecks[2].status === 'fulfilled' ? serviceChecks[2].value : { status: 'unhealthy', error: serviceChecks[2].reason?.message },
          customDimensions: serviceChecks[3].status === 'fulfilled' ? serviceChecks[3].value : { status: 'unhealthy', error: serviceChecks[3].reason?.message },
          batchProcessor: serviceChecks[4].status === 'fulfilled' ? serviceChecks[4].value : { status: 'unhealthy', error: serviceChecks[4].reason?.message },
          monitoring: serviceChecks[5].status === 'fulfilled' ? serviceChecks[5].value : { status: 'unhealthy', error: serviceChecks[5].reason?.message }
        }
      };

      // Check if any service is unhealthy
      const unhealthyServices = Object.entries(healthStatus.services)
        .filter(([name, status]) => status.status !== 'healthy')
        .map(([name]) => name);

      if (unhealthyServices.length > 0) {
        healthStatus.status = 'degraded';
        healthStatus.unhealthyServices = unhealthyServices;
      }

      return healthStatus;

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `omnishot_${timestamp}_${random}`;
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
   * Graceful shutdown
   */
  async shutdown() {
    try {
      console.log('🔄 Shutting down OmniShot Integration Service...');
      
      // Stop accepting new requests
      this.config.acceptingRequests = false;
      
      // Wait for current optimizations to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Shutdown monitoring
      await this.monitor.shutdown();
      
      console.log('✅ OmniShot Integration Service shutdown complete');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }
}

module.exports = { OmniShotIntegrationService };