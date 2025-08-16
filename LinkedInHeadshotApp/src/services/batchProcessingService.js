/**
 * Batch Processing Service
 * 
 * Advanced batch processing system for handling multiple images and platforms
 * simultaneously. Provides intelligent queuing, resource management, progress
 * tracking, and error handling for large-scale photo optimization operations.
 * 
 * Features:
 * - Intelligent batch scheduling and resource allocation
 * - Concurrent processing with rate limiting
 * - Progress tracking and real-time updates
 * - Error handling and retry mechanisms
 * - Cost optimization for batch operations
 * - Result packaging and delivery
 */

import * as FileSystem from 'expo-file-system';

export class BatchProcessingService {
  constructor() {
    this.activeBatches = new Map();
    this.batchQueue = [];
    this.processingStats = {
      totalBatches: 0,
      totalImagesProcessed: 0,
      successRate: 0,
      averageProcessingTime: 0
    };
    
    this.maxConcurrentBatches = 3;
    this.maxConcurrentImagesPerBatch = 5;
    this.retryAttempts = 2;
    
    console.log('🔄 Batch Processing Service initialized');
  }

  /**
   * Process batch of images for multiple platforms
   */
  async processBatch(batchConfig) {
    const {
      batchId,
      imageUris,
      targetPlatforms,
      professionalStyle,
      options = {},
      maxConcurrency = 3,
      onProgress
    } = batchConfig;

    try {
      console.log(`🚀 [${batchId}] Starting batch processing`);
      console.log(`📷 Images: ${imageUris.length}, Platforms: ${targetPlatforms.length}, Total operations: ${imageUris.length * targetPlatforms.length}`);

      // Initialize batch tracking
      const batchInfo = this.initializeBatchTracking(
        batchId,
        imageUris,
        targetPlatforms,
        options
      );

      this.activeBatches.set(batchId, batchInfo);

      // Determine optimal processing strategy
      const processingStrategy = await this.determineBatchStrategy(
        imageUris.length,
        targetPlatforms.length,
        professionalStyle,
        options
      );

      console.log(`📋 [${batchId}] Processing strategy: ${processingStrategy.name}`);

      // Execute batch processing based on strategy
      const results = await this.executeBatchStrategy(
        batchId,
        imageUris,
        targetPlatforms,
        professionalStyle,
        processingStrategy,
        onProgress
      );

      // Compile final results
      const batchSummary = await this.compileBatchResults(
        batchId,
        results,
        batchInfo.startTime
      );

      // Clean up batch tracking
      this.activeBatches.delete(batchId);

      console.log(`✅ [${batchId}] Batch completed: ${batchSummary.successfulImages}/${batchSummary.totalImages} images successful`);

      return {
        batchId,
        success: true,
        results,
        summary: batchSummary,
        totalCost: batchSummary.totalCost
      };

    } catch (error) {
      console.error(`❌ [${batchId}] Batch processing failed:`, error);
      
      // Clean up on failure
      if (this.activeBatches.has(batchId)) {
        this.activeBatches.delete(batchId);
      }

      // Attempt recovery processing
      const recoveryResults = await this.attemptBatchRecovery(
        batchId,
        imageUris,
        targetPlatforms,
        error
      );

      return {
        batchId,
        success: false,
        error: error.message,
        recoveryResults
      };
    }
  }

  /**
   * Initialize batch tracking and metadata
   */
  initializeBatchTracking(batchId, imageUris, targetPlatforms, options) {
    const totalOperations = imageUris.length * targetPlatforms.length;
    
    return {
      batchId,
      startTime: Date.now(),
      status: 'processing',
      totalImages: imageUris.length,
      totalPlatforms: targetPlatforms.length,
      totalOperations,
      completedOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      currentPhase: 'initialization',
      progress: 0,
      estimatedCompletionTime: null,
      processingQueue: [],
      results: {},
      errors: [],
      options
    };
  }

  /**
   * Determine optimal batch processing strategy
   */
  async determineBatchStrategy(imageCount, platformCount, style, options) {
    const totalOperations = imageCount * platformCount;
    const estimatedCost = totalOperations * 0.75; // Average cost estimate
    const estimatedTime = totalOperations * 60; // Average 60 seconds per operation

    // Strategy selection based on batch characteristics
    if (totalOperations <= 10) {
      return {
        name: 'Small Batch Parallel',
        type: 'parallel_all',
        maxConcurrency: Math.min(5, totalOperations),
        description: 'Process all operations in parallel for speed',
        estimatedTime: Math.max(estimatedTime / 5, 60)
      };
    }

    if (totalOperations <= 50 && !options.costOptimized) {
      return {
        name: 'Medium Batch Hybrid',
        type: 'hybrid_processing',
        maxConcurrency: 3,
        description: 'Mix of parallel and sequential processing',
        estimatedTime: estimatedTime / 2
      };
    }

    if (options.costOptimized || estimatedCost > 25) {
      return {
        name: 'Cost-Optimized Sequential',
        type: 'sequential_optimized',
        maxConcurrency: 2,
        delayBetweenOperations: 3000,
        description: 'Sequential processing with delays to minimize cost',
        estimatedTime: estimatedTime * 1.5
      };
    }

    return {
      name: 'Large Batch Managed',
      type: 'managed_parallel',
      maxConcurrency: 4,
      batchSize: 20,
      description: 'Process in managed chunks with controlled concurrency',
      estimatedTime: estimatedTime / 3
    };
  }

  /**
   * Execute batch processing based on selected strategy
   */
  async executeBatchStrategy(batchId, imageUris, targetPlatforms, style, strategy, onProgress) {
    const batchInfo = this.activeBatches.get(batchId);
    batchInfo.processingStrategy = strategy;
    batchInfo.estimatedCompletionTime = Date.now() + strategy.estimatedTime * 1000;

    switch (strategy.type) {
      case 'parallel_all':
        return await this.executeParallelAll(
          batchId, imageUris, targetPlatforms, style, strategy, onProgress
        );

      case 'hybrid_processing':
        return await this.executeHybridProcessing(
          batchId, imageUris, targetPlatforms, style, strategy, onProgress
        );

      case 'sequential_optimized':
        return await this.executeSequentialOptimized(
          batchId, imageUris, targetPlatforms, style, strategy, onProgress
        );

      case 'managed_parallel':
        return await this.executeManagedParallel(
          batchId, imageUris, targetPlatforms, style, strategy, onProgress
        );

      default:
        throw new Error(`Unknown batch strategy: ${strategy.type}`);
    }
  }

  /**
   * Execute parallel processing for all operations
   */
  async executeParallelAll(batchId, imageUris, targetPlatforms, style, strategy, onProgress) {
    console.log(`🔄 [${batchId}] Executing parallel processing for all operations`);
    
    const operations = this.createOperationList(imageUris, targetPlatforms, style);
    const results = [];

    // Create progress tracking
    let completedCount = 0;
    const updateProgress = (operationResult) => {
      completedCount++;
      const progress = Math.round((completedCount / operations.length) * 100);
      
      this.updateBatchProgress(batchId, progress, operationResult);
      
      if (onProgress) {
        onProgress({
          batchId,
          progress,
          completedOperations: completedCount,
          totalOperations: operations.length,
          currentOperation: operationResult
        });
      }
    };

    // Process all operations in parallel with concurrency limit
    const semaphore = this.createSemaphore(strategy.maxConcurrency);
    
    const promises = operations.map(async (operation) => {
      await semaphore.acquire();
      
      try {
        const result = await this.processOperation(operation, batchId);
        updateProgress(result);
        return result;
      } catch (error) {
        const errorResult = { ...operation, success: false, error: error.message };
        updateProgress(errorResult);
        return errorResult;
      } finally {
        semaphore.release();
      }
    });

    const allResults = await Promise.allSettled(promises);
    return allResults.map(result => result.value || { success: false, error: result.reason });
  }

  /**
   * Execute hybrid processing (mix of parallel and sequential)
   */
  async executeHybridProcessing(batchId, imageUris, targetPlatforms, style, strategy, onProgress) {
    console.log(`🔄 [${batchId}] Executing hybrid processing strategy`);
    
    const results = [];
    let completedCount = 0;
    const totalOperations = imageUris.length * targetPlatforms.length;

    // Phase 1: Process high-priority platforms in parallel
    const highPriorityPlatforms = this.getHighPriorityPlatforms(targetPlatforms);
    const lowPriorityPlatforms = targetPlatforms.filter(p => !highPriorityPlatforms.includes(p));

    console.log(`📋 [${batchId}] Phase 1: Processing ${highPriorityPlatforms.length} high-priority platforms`);
    this.updateBatchPhase(batchId, 'high_priority_processing');

    for (const imageUri of imageUris) {
      const highPriorityOperations = highPriorityPlatforms.map(platform => ({
        imageUri,
        platform,
        style,
        priority: 'high'
      }));

      const parallelResults = await this.processOperationsInParallel(
        highPriorityOperations,
        strategy.maxConcurrency,
        batchId
      );

      results.push(...parallelResults);
      completedCount += parallelResults.length;

      if (onProgress) {
        onProgress({
          batchId,
          progress: Math.round((completedCount / totalOperations) * 100),
          completedOperations: completedCount,
          totalOperations,
          phase: 'high_priority'
        });
      }
    }

    // Phase 2: Process low-priority platforms sequentially
    if (lowPriorityPlatforms.length > 0) {
      console.log(`📋 [${batchId}] Phase 2: Processing ${lowPriorityPlatforms.length} low-priority platforms`);
      this.updateBatchPhase(batchId, 'low_priority_processing');

      for (const imageUri of imageUris) {
        for (const platform of lowPriorityPlatforms) {
          const operation = { imageUri, platform, style, priority: 'low' };
          
          try {
            const result = await this.processOperation(operation, batchId);
            results.push(result);
          } catch (error) {
            results.push({ ...operation, success: false, error: error.message });
          }

          completedCount++;
          
          if (onProgress) {
            onProgress({
              batchId,
              progress: Math.round((completedCount / totalOperations) * 100),
              completedOperations: completedCount,
              totalOperations,
              phase: 'low_priority'
            });
          }

          // Add delay for cost optimization
          await this.delay(1500);
        }
      }
    }

    return results;
  }

  /**
   * Execute sequential processing optimized for cost
   */
  async executeSequentialOptimized(batchId, imageUris, targetPlatforms, style, strategy, onProgress) {
    console.log(`🔄 [${batchId}] Executing sequential cost-optimized processing`);
    
    const operations = this.createOperationList(imageUris, targetPlatforms, style);
    const results = [];

    // Sort operations by platform priority and cost efficiency
    const sortedOperations = this.sortOperationsByCostEfficiency(operations);

    for (let i = 0; i < sortedOperations.length; i++) {
      const operation = sortedOperations[i];
      
      try {
        const result = await this.processOperation(operation, batchId);
        results.push(result);
      } catch (error) {
        const errorResult = { ...operation, success: false, error: error.message };
        results.push(errorResult);
        
        // Log error but continue processing
        console.warn(`⚠️ [${batchId}] Operation failed: ${operation.platform} - ${error.message}`);
      }

      // Update progress
      const progress = Math.round(((i + 1) / sortedOperations.length) * 100);
      this.updateBatchProgress(batchId, progress);

      if (onProgress) {
        onProgress({
          batchId,
          progress,
          completedOperations: i + 1,
          totalOperations: sortedOperations.length,
          currentOperation: operation
        });
      }

      // Add delay between operations for cost optimization
      if (i < sortedOperations.length - 1 && strategy.delayBetweenOperations) {
        await this.delay(strategy.delayBetweenOperations);
      }
    }

    return results;
  }

  /**
   * Execute managed parallel processing in chunks
   */
  async executeManagedParallel(batchId, imageUris, targetPlatforms, style, strategy, onProgress) {
    console.log(`🔄 [${batchId}] Executing managed parallel processing`);
    
    const operations = this.createOperationList(imageUris, targetPlatforms, style);
    const results = [];
    const chunkSize = strategy.batchSize || 20;
    
    // Process operations in chunks
    for (let i = 0; i < operations.length; i += chunkSize) {
      const chunk = operations.slice(i, i + chunkSize);
      console.log(`📦 [${batchId}] Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(operations.length / chunkSize)} (${chunk.length} operations)`);

      const chunkResults = await this.processOperationsInParallel(
        chunk,
        strategy.maxConcurrency,
        batchId
      );

      results.push(...chunkResults);

      // Update progress
      const progress = Math.round((results.length / operations.length) * 100);
      this.updateBatchProgress(batchId, progress);

      if (onProgress) {
        onProgress({
          batchId,
          progress,
          completedOperations: results.length,
          totalOperations: operations.length,
          currentChunk: Math.floor(i / chunkSize) + 1,
          totalChunks: Math.ceil(operations.length / chunkSize)
        });
      }

      // Brief pause between chunks to manage resource usage
      if (i + chunkSize < operations.length) {
        await this.delay(2000);
      }
    }

    return results;
  }

  /**
   * Create list of all processing operations
   */
  createOperationList(imageUris, targetPlatforms, style) {
    const operations = [];
    
    for (const imageUri of imageUris) {
      for (const platform of targetPlatforms) {
        operations.push({
          imageUri,
          platform,
          style,
          operationId: `op_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        });
      }
    }
    
    return operations;
  }

  /**
   * Process operations in parallel with concurrency control
   */
  async processOperationsInParallel(operations, maxConcurrency, batchId) {
    const semaphore = this.createSemaphore(maxConcurrency);
    
    const promises = operations.map(async (operation) => {
      await semaphore.acquire();
      
      try {
        return await this.processOperation(operation, batchId);
      } catch (error) {
        return { ...operation, success: false, error: error.message };
      } finally {
        semaphore.release();
      }
    });

    const results = await Promise.allSettled(promises);
    return results.map(result => result.value || { success: false, error: result.reason });
  }

  /**
   * Process a single operation (image + platform + style)
   */
  async processOperation(operation, batchId) {
    const { imageUri, platform, style, operationId } = operation;
    
    try {
      // Import the multi-platform optimization engine
      const { default: OptimizationEngine } = await import('./multiPlatformOptimizationEngine');
      
      // Process for single platform
      const result = await OptimizationEngine.optimizeForPlatform(
        imageUri,
        platform,
        style,
        { batchProcessing: true, batchId }
      );

      return {
        ...operation,
        success: result.success,
        result: result.result,
        cost: result.result?.cost || 0,
        processingTime: result.result?.specifications?.processingTime || 0,
        optimizations: result.appliedOptimizations
      };
      
    } catch (error) {
      console.error(`❌ Operation failed [${operationId}]:`, error);
      
      return {
        ...operation,
        success: false,
        error: error.message,
        cost: 0,
        processingTime: 0
      };
    }
  }

  /**
   * Get high-priority platforms for hybrid processing
   */
  getHighPriorityPlatforms(platforms) {
    const priorityOrder = [
      'linkedin', 'behance', 'dribbble', 'youtube', 'instagram'
    ];
    
    return platforms.filter(platform => priorityOrder.includes(platform));
  }

  /**
   * Sort operations by cost efficiency
   */
  sortOperationsByCostEfficiency(operations) {
    // Define platform cost priorities (lower cost = higher priority in sequential processing)
    const costPriorities = {
      linkedin: 3, // High importance, process early
      behance: 3,
      youtube: 3,
      instagram: 2,
      facebook: 2,
      twitter: 2,
      github: 2,
      tiktok: 1,
      zoom: 1,
      whatsapp_business: 1,
      tinder: 0,
      bumble: 0,
      hinge: 0
    };

    return operations.sort((a, b) => {
      const aPriority = costPriorities[a.platform] || 0;
      const bPriority = costPriorities[b.platform] || 0;
      return bPriority - aPriority;
    });
  }

  /**
   * Compile final batch results and statistics
   */
  async compileBatchResults(batchId, results, startTime) {
    const processingTime = Date.now() - startTime;
    
    const summary = {
      batchId,
      totalImages: new Set(results.map(r => r.imageUri)).size,
      totalPlatforms: new Set(results.map(r => r.platform)).size,
      totalOperations: results.length,
      successfulOperations: results.filter(r => r.success).length,
      failedOperations: results.filter(r => !r.success).length,
      successRate: (results.filter(r => r.success).length / results.length) * 100,
      totalCost: results.reduce((sum, r) => sum + (r.cost || 0), 0),
      averageCostPerOperation: results.length > 0 ? 
        results.reduce((sum, r) => sum + (r.cost || 0), 0) / results.length : 0,
      totalProcessingTime: processingTime,
      averageProcessingTimePerOperation: processingTime / results.length,
      platformBreakdown: this.createPlatformBreakdown(results),
      errorSummary: this.createErrorSummary(results.filter(r => !r.success))
    };

    // Update service statistics
    this.updateServiceStatistics(summary);

    return summary;
  }

  /**
   * Create platform breakdown statistics
   */
  createPlatformBreakdown(results) {
    const breakdown = {};
    
    for (const result of results) {
      if (!breakdown[result.platform]) {
        breakdown[result.platform] = {
          total: 0,
          successful: 0,
          failed: 0,
          totalCost: 0,
          averageProcessingTime: 0
        };
      }
      
      const platformStats = breakdown[result.platform];
      platformStats.total++;
      
      if (result.success) {
        platformStats.successful++;
        platformStats.totalCost += result.cost || 0;
        platformStats.averageProcessingTime = 
          ((platformStats.averageProcessingTime * (platformStats.successful - 1)) + 
           (result.processingTime || 0)) / platformStats.successful;
      } else {
        platformStats.failed++;
      }
    }
    
    return breakdown;
  }

  /**
   * Create error summary
   */
  createErrorSummary(failedResults) {
    const errorCounts = {};
    const platformErrors = {};
    
    for (const result of failedResults) {
      // Count error types
      const errorType = this.categorizeError(result.error);
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      
      // Count platform-specific errors
      if (!platformErrors[result.platform]) {
        platformErrors[result.platform] = 0;
      }
      platformErrors[result.platform]++;
    }
    
    return {
      totalErrors: failedResults.length,
      errorTypes: errorCounts,
      platformErrors,
      commonIssues: this.identifyCommonIssues(failedResults)
    };
  }

  /**
   * Categorize error types
   */
  categorizeError(errorMessage) {
    if (!errorMessage) return 'unknown';
    
    const message = errorMessage.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) return 'network';
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('quota') || message.includes('limit')) return 'quota_exceeded';
    if (message.includes('format') || message.includes('invalid')) return 'invalid_input';
    if (message.includes('ai') || message.includes('model')) return 'ai_processing';
    if (message.includes('cost') || message.includes('budget')) return 'cost_limit';
    
    return 'processing_error';
  }

  /**
   * Identify common issues for troubleshooting
   */
  identifyCommonIssues(failedResults) {
    const issues = [];
    
    const networkErrors = failedResults.filter(r => 
      r.error && r.error.toLowerCase().includes('network')
    ).length;
    
    if (networkErrors > failedResults.length * 0.3) {
      issues.push({
        type: 'network_connectivity',
        count: networkErrors,
        recommendation: 'Check network connection and retry failed operations'
      });
    }
    
    const quotaErrors = failedResults.filter(r => 
      r.error && r.error.toLowerCase().includes('quota')
    ).length;
    
    if (quotaErrors > 0) {
      issues.push({
        type: 'quota_exceeded',
        count: quotaErrors,
        recommendation: 'API quota exceeded. Wait for quota reset or upgrade plan'
      });
    }
    
    return issues;
  }

  /**
   * Update service statistics
   */
  updateServiceStatistics(batchSummary) {
    this.processingStats.totalBatches++;
    this.processingStats.totalImagesProcessed += batchSummary.totalImages;
    
    // Update success rate (weighted average)
    const totalOps = this.processingStats.totalBatches > 1 ? 
      this.processingStats.totalImagesProcessed : batchSummary.totalOperations;
    
    this.processingStats.successRate = 
      ((this.processingStats.successRate * (totalOps - batchSummary.totalOperations)) + 
       batchSummary.successRate * batchSummary.totalOperations) / totalOps;
    
    // Update average processing time
    this.processingStats.averageProcessingTime = 
      ((this.processingStats.averageProcessingTime * (this.processingStats.totalBatches - 1)) + 
       batchSummary.averageProcessingTimePerOperation) / this.processingStats.totalBatches;
  }

  /**
   * Attempt batch recovery on failure
   */
  async attemptBatchRecovery(batchId, imageUris, targetPlatforms, originalError) {
    try {
      console.log(`🚑 [${batchId}] Attempting batch recovery`);
      
      // Use simplest possible processing strategy
      const recoveryResults = [];
      
      for (let i = 0; i < Math.min(imageUris.length, 3); i++) { // Limit to 3 images for recovery
        const imageUri = imageUris[i];
        
        for (const platform of targetPlatforms.slice(0, 2)) { // Limit to 2 platforms
          try {
            // Use local fallback processing
            const result = await this.processSimpleOperation(imageUri, platform);
            recoveryResults.push(result);
          } catch (error) {
            recoveryResults.push({
              imageUri,
              platform,
              success: false,
              error: error.message,
              recovery: true
            });
          }
        }
      }
      
      return {
        success: recoveryResults.some(r => r.success),
        results: recoveryResults,
        message: 'Partial recovery completed with basic processing'
      };
      
    } catch (error) {
      console.error(`❌ [${batchId}] Recovery attempt failed:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Recovery attempt failed'
      };
    }
  }

  /**
   * Process simple operation for recovery
   */
  async processSimpleOperation(imageUri, platform) {
    // Import image manipulator for basic processing
    const ImageManipulator = await import('expo-image-manipulator');
    
    // Basic resize for the platform (fallback processing)
    const processed = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 512, height: 512 } }],
      { 
        compress: 0.8, 
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );
    
    return {
      imageUri,
      platform,
      success: true,
      result: { image: processed.uri },
      recovery: true,
      cost: 0
    };
  }

  /**
   * Update batch progress
   */
  updateBatchProgress(batchId, progress, operationResult = null) {
    if (this.activeBatches.has(batchId)) {
      const batchInfo = this.activeBatches.get(batchId);
      batchInfo.progress = progress;
      batchInfo.lastUpdate = Date.now();
      
      if (operationResult) {
        if (operationResult.success) {
          batchInfo.successfulOperations++;
        } else {
          batchInfo.failedOperations++;
        }
        batchInfo.completedOperations++;
      }
      
      this.activeBatches.set(batchId, batchInfo);
    }
  }

  /**
   * Update batch phase
   */
  updateBatchPhase(batchId, phase) {
    if (this.activeBatches.has(batchId)) {
      const batchInfo = this.activeBatches.get(batchId);
      batchInfo.currentPhase = phase;
      this.activeBatches.set(batchId, batchInfo);
    }
  }

  /**
   * Get batch status
   */
  getBatchStatus(batchId) {
    if (this.activeBatches.has(batchId)) {
      return this.activeBatches.get(batchId);
    }
    
    return {
      batchId,
      status: 'not_found',
      message: 'Batch not found or completed'
    };
  }

  /**
   * Cancel active batch
   */
  async cancelBatch(batchId) {
    if (this.activeBatches.has(batchId)) {
      const batchInfo = this.activeBatches.get(batchId);
      batchInfo.status = 'cancelled';
      batchInfo.cancelled = true;
      
      console.log(`🛑 Batch ${batchId} cancelled`);
      
      // Clean up after a delay to allow current operations to complete
      setTimeout(() => {
        this.activeBatches.delete(batchId);
      }, 5000);
      
      return { 
        success: true, 
        message: 'Batch cancelled successfully',
        partialResults: batchInfo.results
      };
    }
    
    return { 
      success: false, 
      message: 'Batch not found or already completed' 
    };
  }

  /**
   * Get service statistics
   */
  getServiceStatistics() {
    return {
      ...this.processingStats,
      activeBatches: this.activeBatches.size,
      queuedBatches: this.batchQueue.length
    };
  }

  // Utility methods

  /**
   * Create semaphore for concurrency control
   */
  createSemaphore(maxConcurrency) {
    let current = 0;
    const queue = [];
    
    return {
      async acquire() {
        if (current < maxConcurrency) {
          current++;
          return Promise.resolve();
        }
        
        return new Promise(resolve => {
          queue.push(resolve);
        });
      },
      
      release() {
        current--;
        if (queue.length > 0) {
          const next = queue.shift();
          current++;
          next();
        }
      }
    };
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export default new BatchProcessingService();