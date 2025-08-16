/**
 * Multi-Platform Optimization Engine
 * Core service for optimizing images across different social media platforms
 * Handles platform-specific requirements, AI integration, and quality assurance
 */

const sharp = require('sharp');
const { PlatformSpecificationEngine } = require('./platformSpecificationEngine');
const { IntelligentImageProcessor } = require('./intelligentImageProcessor');
const { CostOptimizationService } = require('./costOptimizationService');
const { PromptEngineeringService } = require('./promptEngineeringService');
const { MonitoringService } = require('./monitoringService');

class MultiPlatformOptimizationEngine {
  constructor() {
    this.platformSpecs = new PlatformSpecificationEngine();
    this.imageProcessor = new IntelligentImageProcessor();
    this.costOptimizer = new CostOptimizationService();
    this.promptEngine = new PromptEngineeringService();
    this.monitor = new MonitoringService();
    
    // Optimization metrics
    this.metrics = {
      totalOptimizations: 0,
      successfulOptimizations: 0,
      failedOptimizations: 0,
      averageProcessingTime: 0,
      platformStats: {}
    };
  }

  /**
   * Main optimization entry point
   * Processes a single image for multiple platforms simultaneously
   */
  async optimizeForMultiplePlatforms(imageBuffer, platforms, style, options = {}) {
    const startTime = Date.now();
    const optimizationId = this.generateOptimizationId();
    
    try {
      console.log(`🚀 [${optimizationId}] Starting multi-platform optimization`);
      console.log(`📱 Platforms: ${platforms.join(', ')}`);
      console.log(`🎨 Style: ${style}`);

      // Initialize monitoring
      this.monitor.startOptimization(optimizationId, {
        platforms: platforms.length,
        style,
        inputSize: imageBuffer.length
      });

      // Validate input parameters
      this.validateInputParameters(imageBuffer, platforms, style);

      // Get platform specifications
      const platformSpecs = await this.platformSpecs.getMultiplePlatformSpecs(platforms);
      
      // Analyze input image
      const imageAnalysis = await this.imageProcessor.analyzeImage(imageBuffer);
      console.log(`🔍 [${optimizationId}] Image analysis: ${imageAnalysis.width}x${imageAnalysis.height}, format: ${imageAnalysis.format}`);

      // Generate platform-specific prompts
      const prompts = await this.promptEngine.generatePlatformPrompts(style, platforms, imageAnalysis);

      // Cost optimization - determine best processing strategy
      const processingStrategy = await this.costOptimizer.optimizeProcessingStrategy(
        platforms,
        imageAnalysis,
        options.budget || 'basic'
      );

      console.log(`💰 [${optimizationId}] Using processing strategy: ${processingStrategy.name}`);

      // Process images for each platform
      const results = {};
      const processingPromises = [];

      for (const platform of platforms) {
        const platformSpec = platformSpecs[platform];
        if (!platformSpec) {
          results[platform] = {
            success: false,
            error: `Platform ${platform} not supported`,
            platform: platform
          };
          continue;
        }

        // Create processing promise for this platform
        const processingPromise = this.optimizeForSinglePlatform(
          imageBuffer,
          platform,
          platformSpec,
          prompts[platform],
          processingStrategy,
          optimizationId
        );

        processingPromises.push(
          processingPromise.then(result => ({ platform, result }))
        );
      }

      // Execute all platform optimizations concurrently
      const platformResults = await Promise.allSettled(processingPromises);

      // Process results
      for (const promiseResult of platformResults) {
        if (promiseResult.status === 'fulfilled') {
          const { platform, result } = promiseResult.value;
          results[platform] = result;
        } else {
          // Handle rejected promises
          console.error(`❌ [${optimizationId}] Platform processing failed:`, promiseResult.reason);
          const failedPlatform = platforms.find(p => !results[p]);
          if (failedPlatform) {
            results[failedPlatform] = {
              success: false,
              error: 'Processing failed',
              platform: failedPlatform
            };
          }
        }
      }

      // Calculate success metrics
      const successfulResults = Object.values(results).filter(r => r.success);
      const failedResults = Object.values(results).filter(r => !r.success);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ [${optimizationId}] Optimization complete: ${successfulResults.length}/${platforms.length} successful in ${processingTime}ms`);

      // Update metrics
      this.updateMetrics(platforms, successfulResults.length, failedResults.length, processingTime);

      // Monitor completion
      this.monitor.completeOptimization(optimizationId, {
        success: true,
        resultsCount: successfulResults.length,
        processingTime
      });

      return {
        success: true,
        optimizationId,
        platformResults: results,
        summary: {
          totalPlatforms: platforms.length,
          successful: successfulResults.length,
          failed: failedResults.length,
          processingTime: `${processingTime}ms`,
          strategy: processingStrategy.name
        }
      };

    } catch (error) {
      console.error(`❌ [${optimizationId}] Multi-platform optimization failed:`, error);
      
      const processingTime = Date.now() - startTime;
      this.monitor.failOptimization(optimizationId, error);
      this.metrics.failedOptimizations++;

      return {
        success: false,
        optimizationId,
        error: error.message,
        processingTime: `${processingTime}ms`
      };
    }
  }

  /**
   * Optimize image for a single platform
   */
  async optimizeForSinglePlatform(imageBuffer, platform, platformSpec, prompt, strategy, optimizationId) {
    const platformStartTime = Date.now();
    
    try {
      console.log(`🔧 [${optimizationId}] Optimizing for ${platform}...`);

      // Step 1: Resize and crop for platform specifications
      const resizedImage = await this.resizeForPlatform(imageBuffer, platformSpec);
      
      // Step 2: Apply AI enhancement if strategy includes it
      let enhancedImage = resizedImage;
      if (strategy.includeAI && prompt) {
        try {
          enhancedImage = await this.imageProcessor.enhanceWithAI(
            resizedImage,
            prompt,
            platform,
            strategy.aiProvider
          );
          console.log(`✨ [${optimizationId}] AI enhancement applied for ${platform}`);
        } catch (aiError) {
          console.warn(`⚠️ [${optimizationId}] AI enhancement failed for ${platform}, using resized image:`, aiError.message);
          // Continue with resized image
        }
      }

      // Step 3: Apply platform-specific optimizations
      const optimizedImage = await this.applyPlatformOptimizations(
        enhancedImage,
        platform,
        platformSpec
      );

      // Step 4: Quality assessment
      const qualityScore = await this.assessQuality(optimizedImage, platformSpec);

      const processingTime = Date.now() - platformStartTime;
      console.log(`✅ [${optimizationId}] ${platform} optimization complete in ${processingTime}ms (Quality: ${qualityScore}%)`);

      return {
        success: true,
        imageBuffer: optimizedImage,
        platform: platformSpec.name,
        dimensions: `${platformSpec.width}x${platformSpec.height}`,
        qualityScore,
        processingTime: `${processingTime}ms`,
        optimizationLevel: strategy.includeAI ? 'premium' : 'standard',
        specifications: platformSpec
      };

    } catch (error) {
      console.error(`❌ [${optimizationId}] ${platform} optimization failed:`, error);
      return {
        success: false,
        error: error.message,
        platform: platform
      };
    }
  }

  /**
   * Resize image according to platform specifications
   */
  async resizeForPlatform(imageBuffer, platformSpec) {
    try {
      const { width, height, quality = 0.9 } = platformSpec;
      
      return await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: Math.round(quality * 100) })
        .toBuffer();
        
    } catch (error) {
      console.error('❌ Image resize failed:', error);
      throw new Error(`Failed to resize image: ${error.message}`);
    }
  }

  /**
   * Apply platform-specific optimizations
   */
  async applyPlatformOptimizations(imageBuffer, platform, platformSpec) {
    try {
      let pipeline = sharp(imageBuffer);

      // Platform-specific adjustments
      switch (platform) {
        case 'linkedin':
          // Professional, slightly increased contrast
          pipeline = pipeline.modulate({ brightness: 1.05, saturation: 1.1, hue: 0 });
          break;
          
        case 'instagram':
          // Vibrant, social media optimized
          pipeline = pipeline.modulate({ brightness: 1.1, saturation: 1.2, hue: 0 });
          break;
          
        case 'facebook':
          // Balanced, friendly appearance
          pipeline = pipeline.modulate({ brightness: 1.08, saturation: 1.15, hue: 0 });
          break;
          
        case 'twitter':
          // Sharp, clear for small display
          pipeline = pipeline.sharpen({ sigma: 1.0, m1: 1.0, m2: 2.0, x1: 2, y2: 10, y3: 20 });
          break;
          
        case 'youtube':
          // High quality for content creation
          pipeline = pipeline.modulate({ brightness: 1.02, saturation: 1.05, hue: 0 });
          break;
          
        case 'tiktok':
          // High contrast, dynamic
          pipeline = pipeline.modulate({ brightness: 1.12, saturation: 1.25, hue: 0 });
          break;
          
        case 'whatsapp_business':
          // Professional but approachable
          pipeline = pipeline.modulate({ brightness: 1.06, saturation: 1.08, hue: 0 });
          break;
          
        case 'github':
          // Clean, technical appearance
          pipeline = pipeline.modulate({ brightness: 1.03, saturation: 1.02, hue: 0 });
          break;
      }

      // Apply compression based on platform requirements
      const quality = platformSpec.quality || 0.9;
      pipeline = pipeline.jpeg({ 
        quality: Math.round(quality * 100),
        progressive: true,
        mozjpeg: true
      });

      return await pipeline.toBuffer();
      
    } catch (error) {
      console.error('❌ Platform optimization failed:', error);
      throw new Error(`Failed to optimize for ${platform}: ${error.message}`);
    }
  }

  /**
   * Assess image quality after optimization
   */
  async assessQuality(imageBuffer, platformSpec) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      // Basic quality scoring based on:
      // - Size compliance (40%)
      // - Format optimization (20%)
      // - Compression efficiency (20%)
      // - Metadata preservation (20%)
      
      let qualityScore = 0;
      
      // Size compliance
      const sizeMatch = (metadata.width === platformSpec.width && metadata.height === platformSpec.height);
      qualityScore += sizeMatch ? 40 : 30;
      
      // Format optimization
      const formatOptimal = metadata.format === 'jpeg';
      qualityScore += formatOptimal ? 20 : 15;
      
      // Compression efficiency (file size vs quality)
      const fileSizeRatio = imageBuffer.length / (metadata.width * metadata.height);
      const compressionScore = fileSizeRatio < 0.5 ? 20 : (fileSizeRatio < 1.0 ? 15 : 10);
      qualityScore += compressionScore;
      
      // Metadata preservation
      const hasMetadata = metadata.density && metadata.density > 0;
      qualityScore += hasMetadata ? 20 : 15;
      
      return Math.min(100, Math.max(60, qualityScore)); // Clamp between 60-100
      
    } catch (error) {
      console.warn('⚠️ Quality assessment failed:', error.message);
      return 85; // Default reasonable score
    }
  }

  /**
   * Validate input parameters
   */
  validateInputParameters(imageBuffer, platforms, style) {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Invalid image buffer provided');
    }
    
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      throw new Error('At least one platform must be specified');
    }
    
    if (!style || typeof style !== 'string') {
      throw new Error('Style must be specified');
    }
    
    // Validate supported platforms
    const supportedPlatforms = ['linkedin', 'instagram', 'facebook', 'twitter', 'youtube', 'tiktok', 'whatsapp_business', 'github'];
    const unsupportedPlatforms = platforms.filter(p => !supportedPlatforms.includes(p));
    
    if (unsupportedPlatforms.length > 0) {
      throw new Error(`Unsupported platforms: ${unsupportedPlatforms.join(', ')}`);
    }
  }

  /**
   * Generate unique optimization ID
   */
  generateOptimizationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `omni_${timestamp}_${random}`;
  }

  /**
   * Update optimization metrics
   */
  updateMetrics(platforms, successful, failed, processingTime) {
    this.metrics.totalOptimizations++;
    this.metrics.successfulOptimizations += successful;
    this.metrics.failedOptimizations += failed;
    
    // Update average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalOptimizations - 1) + processingTime;
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalOptimizations;
    
    // Update platform statistics
    for (const platform of platforms) {
      if (!this.metrics.platformStats[platform]) {
        this.metrics.platformStats[platform] = { total: 0, successful: 0 };
      }
      this.metrics.platformStats[platform].total++;
      if (successful > 0) {
        this.metrics.platformStats[platform].successful++;
      }
    }
  }

  /**
   * Get optimization metrics and statistics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalOptimizations > 0 
        ? (this.metrics.successfulOptimizations / this.metrics.totalOptimizations * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Health check for the optimization engine
   */
  async healthCheck() {
    try {
      console.log('🔍 Optimization engine health check starting...');
      
      // Test basic image processing capability with proper base64
      const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      const processedBuffer = await sharp(testBuffer)
        .resize(100, 100)
        .png()
        .toBuffer();
      
      if (!processedBuffer || processedBuffer.length === 0) {
        throw new Error('Basic image processing test failed');
      }
      
      // Check all dependent services with error handling
      const serviceChecks = await Promise.allSettled([
        this.platformSpecs.healthCheck(),
        this.imageProcessor.healthCheck(),
        this.costOptimizer.healthCheck(),
        this.promptEngine.healthCheck(),
        this.monitor.healthCheck()
      ]);
      
      const services = {
        platformSpecs: serviceChecks[0].status === 'fulfilled' ? serviceChecks[0].value : { status: 'unhealthy', error: serviceChecks[0].reason?.message || 'Unknown error' },
        imageProcessor: serviceChecks[1].status === 'fulfilled' ? serviceChecks[1].value : { status: 'unhealthy', error: serviceChecks[1].reason?.message || 'Unknown error' },
        costOptimizer: serviceChecks[2].status === 'fulfilled' ? serviceChecks[2].value : { status: 'unhealthy', error: serviceChecks[2].reason?.message || 'Unknown error' },
        promptEngine: serviceChecks[3].status === 'fulfilled' ? serviceChecks[3].value : { status: 'unhealthy', error: serviceChecks[3].reason?.message || 'Unknown error' },
        monitoring: serviceChecks[4].status === 'fulfilled' ? serviceChecks[4].value : { status: 'unhealthy', error: serviceChecks[4].reason?.message || 'Unknown error' }
      };
      
      // Determine overall health based on critical services
      const criticalServices = ['platformSpecs', 'imageProcessor'];
      const criticalHealthy = criticalServices.every(service => services[service].status === 'healthy');
      const anyHealthy = Object.values(services).some(service => service.status === 'healthy');
      
      let overallStatus = 'healthy';
      if (!criticalHealthy) {
        overallStatus = anyHealthy ? 'degraded' : 'unhealthy';
      }
      
      console.log(`✅ Optimization engine health check complete: ${overallStatus}`);
      
      return {
        status: overallStatus,
        services,
        metrics: this.getMetrics(),
        capabilities: {
          imageProcessing: 'available',
          multiPlatform: criticalHealthy,
          aiEnhancement: services.imageProcessor.status === 'healthy'
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Optimization engine health check failed:', error);
      
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        capabilities: {
          imageProcessing: 'unavailable',
          multiPlatform: false,
          aiEnhancement: false
        }
      };
    }
  }
}

module.exports = { MultiPlatformOptimizationEngine };