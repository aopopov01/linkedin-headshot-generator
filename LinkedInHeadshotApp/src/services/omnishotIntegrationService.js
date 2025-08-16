/**
 * OmniShot Integration Service
 * 
 * Master integration service that orchestrates all multi-platform optimization
 * components. Provides a unified interface for the complete OmniShot system
 * including intelligent optimization, cost management, batch processing,
 * and multi-platform delivery.
 * 
 * This service ties together:
 * - Multi-Platform Optimization Engine
 * - Platform Specification Engine  
 * - Intelligent Image Processor
 * - Cost Optimization Service
 * - Batch Processing Service
 * - Custom Dimension Handler
 * - Monitoring Service
 * - Prompt Engineering Service
 * - API Integration Layer
 */

import MultiPlatformOptimizationEngine from './multiPlatformOptimizationEngine';
import PlatformSpecificationEngine from './platformSpecificationEngine';
import IntelligentImageProcessor from './intelligentImageProcessor';
import CostOptimizationService from './costOptimizationService';
import BatchProcessingService from './batchProcessingService';
import CustomDimensionHandler from './customDimensionHandler';
import MonitoringService from './monitoringService';
import PromptEngineeringService from './promptEngineeringService';
import APIIntegrationLayer from './apiIntegrationLayer';

export class OmnishotIntegrationService {
  constructor() {
    this.version = '1.0.0';
    this.initializeServices();
    this.setupServiceConnections();
    
    this.activeOperations = new Map();
    this.systemHealth = {
      status: 'initializing',
      lastHealthCheck: Date.now(),
      serviceStatuses: {}
    };
    
    console.log('🚀 OmniShot Integration Service initialized');
    this.performSystemHealthCheck();
  }

  /**
   * Initialize all service references
   */
  initializeServices() {
    this.services = {
      optimizationEngine: MultiPlatformOptimizationEngine,
      platformSpecs: PlatformSpecificationEngine,
      imageProcessor: IntelligentImageProcessor,
      costOptimizer: CostOptimizationService,
      batchProcessor: BatchProcessingService,
      dimensionHandler: CustomDimensionHandler,
      monitoring: MonitoringService,
      promptEngineering: PromptEngineeringService,
      apiIntegration: APIIntegrationLayer
    };
    
    console.log('🔧 All services initialized');
  }

  /**
   * Setup inter-service connections and event handlers
   */
  setupServiceConnections() {
    // Cost tracking integration
    this.services.costOptimizer.onCostUpdate = (data) => {
      this.services.monitoring.trackOptimization({
        ...data,
        cost: data.totalCost
      });
    };
    
    // Quality feedback loop for prompt optimization
    this.services.promptEngineering.onQualityFeedback = (promptId, results) => {
      this.services.monitoring.trackOptimization({
        jobId: promptId,
        success: results.success,
        qualityScore: results.qualityScore
      });
    };
    
    console.log('🔗 Service connections established');
  }

  /**
   * MAIN API: Complete photo optimization for multiple platforms
   */
  async optimizePhotoForPlatforms(request) {
    const {
      imageUri,
      targetPlatforms,
      professionalStyle,
      userProfile = {},
      options = {}
    } = request;

    const operationId = this.generateOperationId();
    const startTime = Date.now();
    
    try {
      console.log(`🎯 [${operationId}] Starting multi-platform optimization`);
      console.log(`📱 Platforms: ${targetPlatforms.join(', ')}`);
      console.log(`🎨 Style: ${professionalStyle}`);
      
      // Track operation start
      this.activeOperations.set(operationId, {
        status: 'processing',
        startTime,
        platforms: targetPlatforms,
        style: professionalStyle,
        progress: 0
      });
      
      // Step 1: Validate inputs and get recommendations
      const validation = await this.validateOptimizationRequest(request);
      if (!validation.valid) {
        throw new Error(`Invalid request: ${validation.errors.join(', ')}`);
      }
      
      this.updateOperationProgress(operationId, 10);
      
      // Step 2: Get optimization recommendations
      const recommendations = await this.services.optimizationEngine.getOptimizationRecommendations(
        userProfile,
        targetPlatforms,
        imageUri
      );
      
      this.updateOperationProgress(operationId, 20);
      
      // Step 3: Cost optimization and strategy selection
      const costStrategy = await this.services.costOptimizer.optimizeProcessingStrategy(
        targetPlatforms.map(platform => ({
          platform,
          specs: this.services.platformSpecs.getSpecifications(platform),
          styleOptimization: this.services.platformSpecs.getStyleOptimization(platform, professionalStyle),
          processingPriority: this.services.platformSpecs.getProcessingPriority(platform)
        })),
        professionalStyle,
        { 
          ...options,
          userTier: userProfile.tier || 'professional'
        }
      );
      
      this.updateOperationProgress(operationId, 40);
      
      // Step 4: Execute multi-platform optimization
      const optimizationResult = await this.services.optimizationEngine.optimizeForMultiplePlatforms(
        imageUri,
        targetPlatforms,
        professionalStyle,
        {
          ...options,
          costStrategy,
          userProfile,
          operationId
        }
      );
      
      this.updateOperationProgress(operationId, 80);
      
      // Step 5: Post-processing and delivery preparation
      const deliveryPackage = await this.prepareDeliveryPackage(
        optimizationResult,
        userProfile,
        options
      );
      
      this.updateOperationProgress(operationId, 95);
      
      // Step 6: Track completion and analytics
      await this.services.monitoring.trackOptimization({
        jobId: operationId,
        platforms: targetPlatforms,
        style: professionalStyle,
        processingTime: Date.now() - startTime,
        strategy: costStrategy.name,
        cost: optimizationResult.totalCost,
        success: optimizationResult.success,
        userId: userProfile.userId,
        userTier: userProfile.tier
      });
      
      this.updateOperationProgress(operationId, 100);
      this.activeOperations.delete(operationId);
      
      const finalResult = {
        operationId,
        success: true,
        platforms: optimizationResult.platforms,
        recommendations,
        costStrategy: {
          name: costStrategy.name,
          totalCost: optimizationResult.totalCost,
          savings: costStrategy.estimatedSavings
        },
        deliveryPackage,
        processingTime: Date.now() - startTime,
        analytics: this.generateOperationAnalytics(optimizationResult)
      };
      
      console.log(`✅ [${operationId}] Multi-platform optimization completed successfully`);
      console.log(`💰 Total cost: $${optimizationResult.totalCost.toFixed(2)}`);
      console.log(`⏱️ Processing time: ${Date.now() - startTime}ms`);
      
      return finalResult;
      
    } catch (error) {
      console.error(`❌ [${operationId}] Multi-platform optimization failed:`, error);
      
      // Track error
      await this.services.monitoring.trackError({
        jobId: operationId,
        error: error.message,
        platforms: targetPlatforms,
        stage: 'optimization',
        processingTime: Date.now() - startTime,
        userId: userProfile.userId
      });
      
      this.activeOperations.delete(operationId);
      
      return {
        operationId,
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
        fallbackRecommendations: await this.generateFallbackRecommendations(request, error)
      };
    }
  }

  /**
   * Batch optimization for multiple images across platforms
   */
  async batchOptimizePhotos(batchRequest) {
    const {
      imageUris,
      targetPlatforms,
      professionalStyle,
      userProfile = {},
      options = {}
    } = batchRequest;

    const batchId = this.generateBatchId();
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${batchId}] Starting batch optimization`);
      console.log(`📷 Images: ${imageUris.length}, Platforms: ${targetPlatforms.length}`);
      
      // Validate batch request
      if (imageUris.length === 0 || targetPlatforms.length === 0) {
        throw new Error('No images or platforms specified');
      }
      
      // Cost estimation for batch
      const costEstimate = await this.services.costOptimizer.estimateCost(
        targetPlatforms,
        professionalStyle,
        userProfile.tier || 'professional',
        { batchSize: imageUris.length }
      );
      
      console.log(`💰 [${batchId}] Estimated cost: $${costEstimate.totalCost.toFixed(2)}`);
      
      // Check budget limits
      if (!costEstimate.withinBudget && !options.ignoreBudget) {
        throw new Error(`Batch cost $${costEstimate.totalCost.toFixed(2)} exceeds budget limits`);
      }
      
      // Execute batch processing
      const batchResult = await this.services.batchProcessor.processBatch({
        batchId,
        imageUris,
        targetPlatforms,
        professionalStyle,
        options: {
          ...options,
          userProfile,
          maxConcurrency: options.maxConcurrency || 3
        },
        onProgress: (progressData) => {
          console.log(`🔄 [${batchId}] Progress: ${progressData.progress}%`);
        }
      });
      
      // Compile batch results
      const compiledResults = this.compileBatchResults(batchResult, costEstimate);
      
      // Track batch completion
      await this.services.monitoring.trackOptimization({
        jobId: batchId,
        platforms: targetPlatforms,
        style: professionalStyle,
        processingTime: Date.now() - startTime,
        cost: batchResult.totalCost,
        success: batchResult.success,
        batchSize: imageUris.length,
        userId: userProfile.userId,
        userTier: userProfile.tier
      });
      
      console.log(`✅ [${batchId}] Batch optimization completed`);
      
      return {
        batchId,
        success: true,
        results: compiledResults,
        summary: batchResult.summary,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`❌ [${batchId}] Batch optimization failed:`, error);
      
      await this.services.monitoring.trackError({
        jobId: batchId,
        error: error.message,
        platforms: targetPlatforms,
        stage: 'batch_optimization'
      });
      
      return {
        batchId,
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Custom dimension optimization
   */
  async optimizeForCustomDimensions(request) {
    const {
      imageUri,
      dimensions,
      professionalStyle,
      userProfile = {},
      options = {}
    } = request;

    const operationId = this.generateOperationId();
    
    try {
      console.log(`📐 [${operationId}] Custom dimension optimization: ${dimensions.width}x${dimensions.height}`);
      
      // Process with custom dimension handler
      const result = await this.services.dimensionHandler.processCustomDimensions(
        imageUri,
        dimensions,
        {
          ...options,
          professionalStyle,
          userProfile
        }
      );
      
      // Apply AI enhancement if requested
      if (options.applyAIEnhancement && result.success) {
        const enhancedResult = await this.services.optimizationEngine.optimizeForCustomDimensions(
          result.result.imageUri,
          dimensions,
          professionalStyle,
          options
        );
        
        result.aiEnhanced = enhancedResult;
      }
      
      console.log(`✅ [${operationId}] Custom dimension optimization completed`);
      
      return {
        operationId,
        success: true,
        result,
        customDimensions: dimensions
      };
      
    } catch (error) {
      console.error(`❌ [${operationId}] Custom dimension optimization failed:`, error);
      
      return {
        operationId,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Direct platform publishing
   */
  async publishToPlatforms(publishRequest) {
    const {
      imageUri,
      platforms,
      caption = '',
      scheduledTime,
      userProfile = {},
      options = {}
    } = publishRequest;

    const publishId = this.generatePublishId();
    
    try {
      console.log(`📤 [${publishId}] Publishing to ${platforms.length} platforms`);
      
      // Batch publish using API integration layer
      const publishResult = await this.services.apiIntegration.batchPublishToplatforms({
        imageUri,
        platforms,
        caption,
        scheduledTime,
        options: {
          ...options,
          userProfile
        }
      });
      
      // Track publishing activity
      await this.services.monitoring.trackOptimization({
        jobId: publishId,
        platforms,
        processingTime: 0, // Publishing time
        cost: 0,
        success: publishResult.success,
        userId: userProfile.userId,
        action: 'publish'
      });
      
      console.log(`✅ [${publishId}] Publishing completed`);
      
      return {
        publishId,
        success: publishResult.success,
        results: publishResult.summary.results,
        summary: publishResult.summary
      };
      
    } catch (error) {
      console.error(`❌ [${publishId}] Publishing failed:`, error);
      
      return {
        publishId,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive system status and analytics
   */
  async getSystemDashboard() {
    try {
      const dashboard = {
        system: {
          version: this.version,
          status: this.systemHealth.status,
          uptime: Date.now() - this.systemHealth.lastHealthCheck,
          activeOperations: this.activeOperations.size
        },
        
        services: {},
        
        analytics: await this.services.monitoring.getAnalyticsDashboard(),
        
        platformStatus: this.getPlatformStatus(),
        
        costAnalytics: await this.services.costOptimizer.getCostEfficiency(),
        
        recommendations: this.generateSystemRecommendations()
      };
      
      // Get individual service statuses
      for (const [name, service] of Object.entries(this.services)) {
        if (typeof service.getServiceStatistics === 'function') {
          dashboard.services[name] = await service.getServiceStatistics();
        } else {
          dashboard.services[name] = { status: 'active' };
        }
      }
      
      return {
        success: true,
        dashboard,
        generatedAt: Date.now()
      };
      
    } catch (error) {
      console.error('Failed to generate system dashboard:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get operation status and progress
   */
  getOperationStatus(operationId) {
    if (this.activeOperations.has(operationId)) {
      return {
        found: true,
        ...this.activeOperations.get(operationId)
      };
    }
    
    return {
      found: false,
      message: 'Operation not found or completed'
    };
  }

  /**
   * Get platform-specific recommendations
   */
  async getPlatformRecommendations(userProfile, currentImage = null) {
    try {
      // Get platform recommendations
      const platformRecs = this.services.platformSpecs.recommendPlatforms(userProfile);
      
      // Get style recommendations
      const requestedPlatforms = platformRecs.slice(0, 5).map(r => r.platform);
      const styleRecs = this.services.platformSpecs.recommendStyles(userProfile, requestedPlatforms);
      
      // Get cost recommendations
      const costRecs = await this.services.costOptimizer.getRecommendations(
        requestedPlatforms,
        userProfile.tier || 'professional'
      );
      
      // Get optimization recommendations from main engine
      const optimizationRecs = await this.services.optimizationEngine.getOptimizationRecommendations(
        userProfile,
        requestedPlatforms,
        currentImage
      );
      
      return {
        success: true,
        recommendations: {
          platforms: platformRecs,
          styles: styleRecs,
          cost: costRecs,
          optimization: optimizationRecs
        }
      };
      
    } catch (error) {
      console.error('Failed to get platform recommendations:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods

  async validateOptimizationRequest(request) {
    const errors = [];
    
    if (!request.imageUri) {
      errors.push('Image URI is required');
    }
    
    if (!request.targetPlatforms || request.targetPlatforms.length === 0) {
      errors.push('At least one target platform is required');
    }
    
    if (!request.professionalStyle) {
      errors.push('Professional style is required');
    }
    
    // Validate platform support
    const supportedPlatforms = this.services.platformSpecs.getSupportedPlatforms();
    const unsupportedPlatforms = request.targetPlatforms.filter(
      platform => !supportedPlatforms.includes(platform)
    );
    
    if (unsupportedPlatforms.length > 0) {
      errors.push(`Unsupported platforms: ${unsupportedPlatforms.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async prepareDeliveryPackage(optimizationResult, userProfile, options) {
    try {
      const deliveryPackage = {
        downloadLinks: {},
        sharingOptions: {},
        cloudStorage: null,
        directPublishing: null
      };
      
      // Generate download links for each platform
      for (const [platform, data] of Object.entries(optimizationResult.platforms)) {
        if (data.success && data.image) {
          deliveryPackage.downloadLinks[platform] = {
            url: data.image,
            specifications: data.specifications,
            filename: `${platform}_${optimizationResult.jobId}.jpg`
          };
        }
      }
      
      // Cloud storage integration if requested
      if (options.cloudStorage && userProfile.tier !== 'free') {
        deliveryPackage.cloudStorage = await this.setupCloudStorageDelivery(
          optimizationResult,
          options.cloudStorage
        );
      }
      
      // Direct publishing setup if requested
      if (options.directPublishing) {
        deliveryPackage.directPublishing = await this.setupDirectPublishing(
          optimizationResult,
          options.directPublishing
        );
      }
      
      return deliveryPackage;
      
    } catch (error) {
      console.error('Failed to prepare delivery package:', error);
      return null;
    }
  }

  generateOperationAnalytics(result) {
    return {
      platformsProcessed: Object.keys(result.platforms).length,
      successfulPlatforms: Object.values(result.platforms).filter(p => p.success).length,
      totalCost: result.totalCost,
      averageQuality: this.calculateAverageQuality(result.platforms),
      processingEfficiency: result.processingTime / Object.keys(result.platforms).length
    };
  }

  calculateAverageQuality(platforms) {
    const qualityScores = Object.values(platforms)
      .filter(p => p.success && p.qualityScore)
      .map(p => p.qualityScore);
    
    if (qualityScores.length === 0) return 0;
    
    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  }

  async generateFallbackRecommendations(request, error) {
    return [
      {
        type: 'retry',
        message: 'Try again with simplified processing options',
        action: 'retry_with_basic_options'
      },
      {
        type: 'reduce_platforms',
        message: 'Try processing fewer platforms simultaneously',
        action: 'reduce_platform_count'
      },
      {
        type: 'local_processing',
        message: 'Use local processing mode for basic optimization',
        action: 'enable_local_mode'
      }
    ];
  }

  compileBatchResults(batchResult, costEstimate) {
    return {
      ...batchResult,
      costAnalysis: {
        estimated: costEstimate.totalCost,
        actual: batchResult.totalCost,
        savings: Math.max(0, costEstimate.totalCost - batchResult.totalCost)
      }
    };
  }

  getPlatformStatus() {
    const supportedPlatforms = this.services.platformSpecs.getSupportedPlatforms();
    
    return supportedPlatforms.reduce((status, platform) => {
      status[platform] = {
        supported: true,
        apiIntegration: this.services.apiIntegration.platformAPIs[platform]?.supported || false,
        lastUsed: null // Would track from monitoring service
      };
      return status;
    }, {});
  }

  generateSystemRecommendations() {
    const recommendations = [];
    
    // System health recommendations
    if (this.activeOperations.size > 10) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'High concurrent operation load detected',
        action: 'Consider implementing operation queuing'
      });
    }
    
    // Cost optimization recommendations
    const costEfficiency = this.services.costOptimizer.getCostEfficiency();
    if (costEfficiency.totalSpent > 100) {
      recommendations.push({
        type: 'cost',
        priority: 'low',
        message: 'Significant AI processing costs detected',
        action: 'Review cost optimization strategies'
      });
    }
    
    return recommendations;
  }

  async performSystemHealthCheck() {
    try {
      this.systemHealth.status = 'checking';
      this.systemHealth.lastHealthCheck = Date.now();
      
      // Check core services
      const serviceChecks = await Promise.allSettled([
        this.checkServiceHealth('optimizationEngine'),
        this.checkServiceHealth('platformSpecs'),
        this.checkServiceHealth('monitoring'),
        this.checkServiceHealth('costOptimizer')
      ]);
      
      const healthyServices = serviceChecks.filter(check => 
        check.status === 'fulfilled' && check.value.healthy
      ).length;
      
      this.systemHealth.status = healthyServices >= 3 ? 'healthy' : 'degraded';
      
      console.log(`💚 System health check: ${this.systemHealth.status} (${healthyServices}/4 services healthy)`);
      
      // Schedule next health check
      setTimeout(() => this.performSystemHealthCheck(), 300000); // 5 minutes
      
    } catch (error) {
      this.systemHealth.status = 'error';
      console.error('System health check failed:', error);
    }
  }

  async checkServiceHealth(serviceName) {
    try {
      const service = this.services[serviceName];
      
      // Basic service availability check
      const isHealthy = service && typeof service === 'object';
      
      return {
        service: serviceName,
        healthy: isHealthy,
        lastCheck: Date.now()
      };
      
    } catch (error) {
      return {
        service: serviceName,
        healthy: false,
        error: error.message
      };
    }
  }

  updateOperationProgress(operationId, progress) {
    if (this.activeOperations.has(operationId)) {
      const operation = this.activeOperations.get(operationId);
      operation.progress = progress;
      operation.lastUpdate = Date.now();
      this.activeOperations.set(operationId, operation);
    }
  }

  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  generatePublishId() {
    return `pub_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  async setupCloudStorageDelivery(optimizationResult, cloudOptions) {
    // Setup cloud storage delivery (placeholder)
    return {
      service: cloudOptions.service,
      status: 'configured',
      estimatedTime: '2-5 minutes'
    };
  }

  async setupDirectPublishing(optimizationResult, publishOptions) {
    // Setup direct publishing (placeholder)
    return {
      platforms: publishOptions.platforms,
      status: 'ready',
      scheduledTime: publishOptions.scheduledTime
    };
  }
}

// Export singleton instance
export default new OmnishotIntegrationService();