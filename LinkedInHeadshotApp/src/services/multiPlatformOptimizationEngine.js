/**
 * OmniShot Multi-Platform Photo Optimization Engine
 * 
 * This is the core service that handles intelligent optimization of professional photos
 * for multiple social media and business platforms. It provides platform-specific
 * sizing, cropping, styling, and delivery optimization.
 * 
 * Key Features:
 * - Platform-specific optimization rules
 * - Intelligent cropping algorithms
 * - Style-to-platform matching
 * - Batch processing for multiple platforms
 * - Cost optimization with AI model routing
 * - Custom dimension support
 * - Performance monitoring and analytics
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { PlatformSpecificationEngine } from './platformSpecificationEngine';
import { IntelligentImageProcessor } from './intelligentImageProcessor';
import { CostOptimizationService } from './costOptimizationService';
import { BatchProcessingService } from './batchProcessingService';
import { MonitoringService } from './monitoringService';

export class MultiPlatformOptimizationEngine {
  constructor() {
    this.platformSpecs = new PlatformSpecificationEngine();
    this.imageProcessor = new IntelligentImageProcessor();
    this.costOptimizer = new CostOptimizationService();
    this.batchProcessor = new BatchProcessingService();
    this.monitor = new MonitoringService();
    
    this.sessionId = this.generateSessionId();
    this.processingQueue = [];
    this.activeJobs = new Map();
    
    console.log('🚀 Multi-Platform Optimization Engine initialized:', this.sessionId);
  }

  /**
   * Main entry point: Optimize photo for multiple platforms simultaneously
   * 
   * @param {string} imageUri - Source image URI
   * @param {Array} targetPlatforms - Array of platform names to optimize for
   * @param {string} professionalStyle - Style template (executive, creative, etc.)
   * @param {Object} options - Additional processing options
   * @returns {Object} Optimization results for all platforms
   */
  async optimizeForMultiplePlatforms(imageUri, targetPlatforms, professionalStyle, options = {}) {
    const jobId = this.generateJobId();
    const startTime = Date.now();
    
    try {
      console.log(`🎯 [${jobId}] Starting multi-platform optimization`);
      console.log(`📱 Target platforms: ${targetPlatforms.join(', ')}`);
      console.log(`🎨 Professional style: ${professionalStyle}`);
      
      // Step 1: Validate and prepare inputs
      const validatedPlatforms = await this.validatePlatforms(targetPlatforms);
      const optimizedSource = await this.imageProcessor.prepareSourceImage(imageUri);
      
      // Step 2: Generate platform-specific requirements
      const platformRequirements = validatedPlatforms.map(platform => ({
        platform,
        specs: this.platformSpecs.getSpecifications(platform),
        styleOptimization: this.platformSpecs.getStyleOptimization(platform, professionalStyle),
        processingPriority: this.platformSpecs.getProcessingPriority(platform)
      }));
      
      // Step 3: Optimize cost and processing strategy
      const processingStrategy = await this.costOptimizer.optimizeProcessingStrategy(
        platformRequirements,
        professionalStyle,
        options
      );
      
      // Step 4: Execute optimizations (batch or sequential based on strategy)
      const optimizationResults = await this.executeOptimizations(
        optimizedSource,
        platformRequirements,
        processingStrategy,
        jobId
      );
      
      // Step 5: Post-process and package results
      const finalResults = await this.packageResults(
        optimizationResults,
        targetPlatforms,
        professionalStyle,
        jobId
      );
      
      // Step 6: Track analytics and performance
      await this.monitor.trackOptimization({
        jobId,
        platforms: targetPlatforms,
        style: professionalStyle,
        processingTime: Date.now() - startTime,
        strategy: processingStrategy.name,
        cost: finalResults.totalCost,
        success: finalResults.success
      });
      
      console.log(`✅ [${jobId}] Multi-platform optimization completed in ${Date.now() - startTime}ms`);
      
      return {
        jobId,
        success: true,
        platforms: finalResults.platforms,
        totalCost: finalResults.totalCost,
        processingTime: Date.now() - startTime,
        strategy: processingStrategy.name,
        downloadPackage: finalResults.downloadPackage,
        analytics: finalResults.analytics,
        recommendations: await this.generateRecommendations(finalResults)
      };
      
    } catch (error) {
      console.error(`❌ [${jobId}] Multi-platform optimization failed:`, error);
      
      await this.monitor.trackError({
        jobId,
        error: error.message,
        platforms: targetPlatforms,
        stage: 'optimization',
        processingTime: Date.now() - startTime
      });
      
      // Attempt fallback processing
      const fallbackResults = await this.executeFallbackOptimization(
        imageUri,
        targetPlatforms,
        professionalStyle,
        jobId
      );
      
      return {
        jobId,
        success: fallbackResults.success,
        platforms: fallbackResults.platforms,
        totalCost: 0,
        processingTime: Date.now() - startTime,
        strategy: 'emergency_fallback',
        warning: 'Used fallback processing due to optimization failures',
        error: error.message
      };
    }
  }

  /**
   * Optimize for a single platform with advanced options
   */
  async optimizeForPlatform(imageUri, platform, professionalStyle, customOptions = {}) {
    const jobId = this.generateJobId();
    
    try {
      console.log(`🎯 [${jobId}] Single platform optimization: ${platform}`);
      
      const platformSpec = this.platformSpecs.getSpecifications(platform);
      const styleOptimization = this.platformSpecs.getStyleOptimization(platform, professionalStyle);
      
      // Merge custom options with platform defaults
      const optimizationOptions = {
        ...platformSpec,
        ...styleOptimization,
        ...customOptions,
        preserveAspectRatio: customOptions.preserveAspectRatio ?? platformSpec.preserveAspectRatio,
        intelligentCropping: customOptions.intelligentCropping ?? true,
        qualityOptimization: customOptions.qualityOptimization ?? 'high',
        compressionLevel: customOptions.compressionLevel ?? platformSpec.compressionLevel
      };
      
      const result = await this.imageProcessor.processForPlatform(
        imageUri,
        platform,
        professionalStyle,
        optimizationOptions
      );
      
      return {
        jobId,
        success: true,
        platform,
        result,
        specifications: platformSpec,
        appliedOptimizations: optimizationOptions
      };
      
    } catch (error) {
      console.error(`❌ [${jobId}] Single platform optimization failed:`, error);
      throw error;
    }
  }

  /**
   * Generate custom dimensions for any platform
   */
  async optimizeForCustomDimensions(imageUri, dimensions, professionalStyle, options = {}) {
    const jobId = this.generateJobId();
    
    try {
      console.log(`🎯 [${jobId}] Custom dimensions optimization: ${dimensions.width}x${dimensions.height}`);
      
      const customSpec = {
        width: dimensions.width,
        height: dimensions.height,
        aspectRatio: dimensions.width / dimensions.height,
        format: options.format || 'JPEG',
        quality: options.quality || 95,
        compressionLevel: options.compressionLevel || 0.9,
        platform: 'custom'
      };
      
      const result = await this.imageProcessor.processForCustomSpec(
        imageUri,
        customSpec,
        professionalStyle,
        options
      );
      
      return {
        jobId,
        success: true,
        platform: 'custom',
        dimensions,
        result,
        appliedOptimizations: options
      };
      
    } catch (error) {
      console.error(`❌ [${jobId}] Custom dimensions optimization failed:`, error);
      throw error;
    }
  }

  /**
   * Batch optimize multiple images for multiple platforms
   */
  async batchOptimizeMultipleImages(imageUris, targetPlatforms, professionalStyle, options = {}) {
    const batchId = this.generateBatchId();
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${batchId}] Starting batch optimization`);
      console.log(`📷 Images: ${imageUris.length}, Platforms: ${targetPlatforms.length}`);
      
      const batchResults = await this.batchProcessor.processBatch({
        batchId,
        imageUris,
        targetPlatforms,
        professionalStyle,
        options,
        maxConcurrency: options.maxConcurrency || 3,
        onProgress: options.onProgress
      });
      
      return {
        batchId,
        success: true,
        totalImages: imageUris.length,
        totalPlatforms: targetPlatforms.length,
        results: batchResults.results,
        summary: batchResults.summary,
        processingTime: Date.now() - startTime,
        totalCost: batchResults.totalCost
      };
      
    } catch (error) {
      console.error(`❌ [${batchId}] Batch optimization failed:`, error);
      throw error;
    }
  }

  /**
   * Get optimization recommendations based on user context
   */
  async getOptimizationRecommendations(userProfile, targetPlatforms, currentImage) {
    try {
      const recommendations = {
        platforms: [],
        styles: [],
        dimensions: [],
        cost: {},
        performance: {}
      };
      
      // Platform recommendations based on user profile
      const platformRecs = this.platformSpecs.recommendPlatforms(userProfile);
      recommendations.platforms = platformRecs.filter(p => 
        targetPlatforms.includes(p.platform)
      );
      
      // Style recommendations
      const styleRecs = this.platformSpecs.recommendStyles(userProfile, targetPlatforms);
      recommendations.styles = styleRecs;
      
      // Dimension optimization recommendations
      if (currentImage) {
        const imageAnalysis = await this.imageProcessor.analyzeImage(currentImage);
        recommendations.dimensions = this.platformSpecs.recommendDimensions(
          imageAnalysis,
          targetPlatforms
        );
      }
      
      // Cost optimization recommendations
      const costRecs = await this.costOptimizer.getRecommendations(
        targetPlatforms,
        userProfile.tier || 'standard'
      );
      recommendations.cost = costRecs;
      
      return recommendations;
      
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return { error: error.message };
    }
  }

  /**
   * Real-time preview generation for platform optimization
   */
  async generatePreview(imageUri, platform, professionalStyle, options = {}) {
    try {
      const previewSpec = {
        ...this.platformSpecs.getSpecifications(platform),
        width: Math.min(this.platformSpecs.getSpecifications(platform).width, 400),
        height: Math.min(this.platformSpecs.getSpecifications(platform).height, 400),
        quality: 80 // Lower quality for faster preview
      };
      
      const preview = await this.imageProcessor.generatePreview(
        imageUri,
        previewSpec,
        professionalStyle,
        options
      );
      
      return {
        success: true,
        preview,
        platform,
        specifications: previewSpec
      };
      
    } catch (error) {
      console.error('Preview generation failed:', error);
      throw error;
    }
  }

  /**
   * Get current processing status
   */
  getProcessingStatus(jobId) {
    if (this.activeJobs.has(jobId)) {
      return this.activeJobs.get(jobId);
    }
    
    return {
      jobId,
      status: 'not_found',
      message: 'Job not found or completed'
    };
  }

  /**
   * Cancel active processing job
   */
  async cancelJob(jobId) {
    if (this.activeJobs.has(jobId)) {
      const job = this.activeJobs.get(jobId);
      job.cancelled = true;
      this.activeJobs.set(jobId, { ...job, status: 'cancelled' });
      
      console.log(`🛑 Job ${jobId} cancelled`);
      return { success: true, message: 'Job cancelled successfully' };
    }
    
    return { success: false, message: 'Job not found or already completed' };
  }

  /**
   * Get engine statistics and performance metrics
   */
  getEngineStats() {
    return {
      sessionId: this.sessionId,
      activeJobs: this.activeJobs.size,
      queuedJobs: this.processingQueue.length,
      totalProcessed: this.monitor.getTotalProcessed(),
      averageProcessingTime: this.monitor.getAverageProcessingTime(),
      successRate: this.monitor.getSuccessRate(),
      costEfficiency: this.costOptimizer.getCostEfficiency(),
      platformUsage: this.monitor.getPlatformUsage()
    };
  }

  // Private helper methods

  async validatePlatforms(platforms) {
    const validPlatforms = [];
    const supportedPlatforms = this.platformSpecs.getSupportedPlatforms();
    
    for (const platform of platforms) {
      if (supportedPlatforms.includes(platform)) {
        validPlatforms.push(platform);
      } else {
        console.warn(`⚠️ Platform ${platform} not supported, skipping`);
      }
    }
    
    if (validPlatforms.length === 0) {
      throw new Error('No valid platforms specified');
    }
    
    return validPlatforms;
  }

  async executeOptimizations(source, requirements, strategy, jobId) {
    this.activeJobs.set(jobId, {
      status: 'processing',
      progress: 0,
      totalPlatforms: requirements.length,
      completedPlatforms: 0,
      startTime: Date.now()
    });
    
    const results = [];
    
    if (strategy.type === 'parallel') {
      // Process platforms in parallel for speed
      const promises = requirements.map(async (req, index) => {
        try {
          const result = await this.imageProcessor.processForPlatform(
            source,
            req.platform,
            req.styleOptimization.style,
            {
              ...req.specs,
              ...req.styleOptimization,
              priority: req.processingPriority
            }
          );
          
          this.updateJobProgress(jobId, index + 1, requirements.length);
          return { platform: req.platform, success: true, result };
          
        } catch (error) {
          console.error(`Platform ${req.platform} optimization failed:`, error);
          return { platform: req.platform, success: false, error: error.message };
        }
      });
      
      const parallelResults = await Promise.allSettled(promises);
      results.push(...parallelResults.map(r => r.value || { success: false, error: r.reason }));
      
    } else {
      // Sequential processing for cost optimization
      for (const [index, req] of requirements.entries()) {
        try {
          const result = await this.imageProcessor.processForPlatform(
            source,
            req.platform,
            req.styleOptimization.style,
            {
              ...req.specs,
              ...req.styleOptimization,
              priority: req.processingPriority
            }
          );
          
          results.push({ platform: req.platform, success: true, result });
          this.updateJobProgress(jobId, index + 1, requirements.length);
          
          // Brief delay for cost optimization
          if (index < requirements.length - 1) {
            await this.delay(strategy.delayBetweenJobs || 1000);
          }
          
        } catch (error) {
          console.error(`Platform ${req.platform} optimization failed:`, error);
          results.push({ platform: req.platform, success: false, error: error.message });
        }
      }
    }
    
    this.activeJobs.delete(jobId);
    return results;
  }

  async packageResults(results, platforms, style, jobId) {
    const packagedResults = {
      success: results.filter(r => r.success).length > 0,
      platforms: {},
      totalCost: 0,
      downloadPackage: null,
      analytics: {}
    };
    
    // Process each platform result
    for (const result of results) {
      packagedResults.platforms[result.platform] = {
        success: result.success,
        image: result.success ? result.result.image : null,
        specifications: result.success ? result.result.specifications : null,
        optimizations: result.success ? result.result.optimizations : null,
        error: result.error || null,
        cost: result.success ? result.result.cost : 0
      };
      
      packagedResults.totalCost += result.success ? (result.result.cost || 0) : 0;
    }
    
    // Create download package
    if (packagedResults.success) {
      packagedResults.downloadPackage = await this.createDownloadPackage(
        packagedResults.platforms,
        style,
        jobId
      );
    }
    
    // Generate analytics
    packagedResults.analytics = {
      successRate: results.filter(r => r.success).length / results.length,
      failedPlatforms: results.filter(r => !r.success).map(r => r.platform),
      averageProcessingTime: results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length,
      costBreakdown: Object.keys(packagedResults.platforms).reduce((acc, platform) => {
        acc[platform] = packagedResults.platforms[platform].cost;
        return acc;
      }, {})
    };
    
    return packagedResults;
  }

  async createDownloadPackage(platforms, style, jobId) {
    try {
      const packageInfo = {
        id: `package_${jobId}`,
        style,
        createdAt: new Date().toISOString(),
        platforms: Object.keys(platforms),
        files: []
      };
      
      // Create organized file structure
      for (const [platform, data] of Object.entries(platforms)) {
        if (data.success && data.image) {
          const filename = `${platform}_${style}_optimized.jpg`;
          packageInfo.files.push({
            platform,
            filename,
            path: data.image,
            specifications: data.specifications,
            size: data.specifications ? `${data.specifications.width}x${data.specifications.height}` : 'unknown'
          });
        }
      }
      
      return packageInfo;
      
    } catch (error) {
      console.error('Failed to create download package:', error);
      return null;
    }
  }

  async executeFallbackOptimization(imageUri, platforms, style, jobId) {
    try {
      console.log(`🚨 [${jobId}] Executing fallback optimization...`);
      
      const fallbackResults = {
        success: true,
        platforms: {}
      };
      
      for (const platform of platforms) {
        try {
          const spec = this.platformSpecs.getSpecifications(platform);
          
          // Basic image resizing and optimization
          const processed = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: spec.width, height: spec.height } }],
            {
              compress: spec.compressionLevel || 0.9,
              format: ImageManipulator.SaveFormat.JPEG
            }
          );
          
          fallbackResults.platforms[platform] = {
            success: true,
            image: processed.uri,
            specifications: spec,
            note: 'Fallback optimization applied'
          };
          
        } catch (error) {
          fallbackResults.platforms[platform] = {
            success: false,
            error: error.message
          };
        }
      }
      
      return fallbackResults;
      
    } catch (error) {
      console.error('Fallback optimization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async generateRecommendations(results) {
    const recommendations = [];
    
    // Analyze results and generate actionable recommendations
    const successfulPlatforms = Object.keys(results.platforms).filter(
      p => results.platforms[p].success
    );
    
    const failedPlatforms = Object.keys(results.platforms).filter(
      p => !results.platforms[p].success
    );
    
    if (successfulPlatforms.length > 0) {
      recommendations.push({
        type: 'success',
        message: `Successfully optimized for ${successfulPlatforms.length} platforms`,
        platforms: successfulPlatforms
      });
    }
    
    if (failedPlatforms.length > 0) {
      recommendations.push({
        type: 'retry',
        message: `Consider retrying optimization for ${failedPlatforms.length} failed platforms`,
        platforms: failedPlatforms,
        action: 'retry_failed'
      });
    }
    
    // Cost optimization recommendations
    if (results.totalCost > 5.0) {
      recommendations.push({
        type: 'cost_optimization',
        message: 'Consider using cost-optimized processing for large batches',
        action: 'enable_cost_optimization'
      });
    }
    
    return recommendations;
  }

  updateJobProgress(jobId, completed, total) {
    if (this.activeJobs.has(jobId)) {
      const job = this.activeJobs.get(jobId);
      job.progress = Math.round((completed / total) * 100);
      job.completedPlatforms = completed;
      this.activeJobs.set(jobId, job);
    }
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export default new MultiPlatformOptimizationEngine();