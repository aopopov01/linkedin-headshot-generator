/**
 * Production-Ready Performance Optimizations for OmniShot
 * Implements advanced optimizations to achieve 100% operational status
 */

const sharp = require('sharp');
const cluster = require('cluster');
const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

class ProductionOptimizations {
  constructor() {
    this.config = {
      // Sharp optimization settings
      sharp: {
        concurrency: Math.min(os.cpus().length, 4), // Optimal concurrency
        cache: { items: 100, files: 20, memory: 50 * 1024 * 1024 }, // 50MB cache
        simd: true, // Use SIMD instructions
        concurrency: 0 // Use all available cores
      },
      
      // Image processing optimizations
      imageProcessing: {
        qualityMap: {
          small: { jpeg: 85, webp: 80 },
          medium: { jpeg: 90, webp: 85 },
          large: { jpeg: 95, webp: 90 }
        },
        formatOptimization: {
          useWebP: true,
          useAVIF: false, // Not widely supported yet
          progressive: true
        }
      },
      
      // Memory management
      memory: {
        maxMemoryMB: 512,
        gcInterval: 30000, // 30 seconds
        bufferPoolSize: 20
      },
      
      // Concurrency settings
      concurrency: {
        maxConcurrentJobs: Math.min(os.cpus().length * 2, 8),
        queueTimeout: 30000,
        retryAttempts: 3
      }
    };
    
    this.bufferPool = [];
    this.activeJobs = new Map();
    this.jobQueue = [];
    this.isProcessing = false;
    
    this.initializeOptimizations();
  }

  /**
   * Initialize all production optimizations
   */
  initializeOptimizations() {
    console.log('🚀 Initializing Production Optimizations...');
    
    // Configure Sharp for optimal performance
    this.optimizeSharpConfig();
    
    // Set up memory management
    this.setupMemoryManagement();
    
    // Initialize job queue processing
    this.initializeJobQueue();
    
    console.log('✅ Production optimizations initialized');
  }

  /**
   * Optimize Sharp configuration for maximum performance
   */
  optimizeSharpConfig() {
    console.log('⚡ Optimizing Sharp configuration...');
    
    // Configure Sharp cache for better performance
    sharp.cache(this.config.sharp.cache);
    
    // Set concurrency to optimal level
    sharp.concurrency(this.config.sharp.concurrency);
    
    // Enable SIMD for faster processing
    if (this.config.sharp.simd) {
      sharp.simd(true);
    }
    
    console.log(`  ✓ Sharp concurrency set to: ${this.config.sharp.concurrency}`);
    console.log(`  ✓ Sharp cache configured: ${this.config.sharp.cache.memory / 1024 / 1024}MB`);
  }

  /**
   * Set up advanced memory management
   */
  setupMemoryManagement() {
    console.log('🧠 Setting up memory management...');
    
    // Initialize buffer pool
    this.initializeBufferPool();
    
    // Set up garbage collection monitoring
    this.setupGCMonitoring();
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    console.log('  ✓ Memory management configured');
  }

  /**
   * Initialize buffer pool for memory efficiency
   */
  initializeBufferPool() {
    const poolSize = this.config.memory.bufferPoolSize;
    for (let i = 0; i < poolSize; i++) {
      this.bufferPool.push(Buffer.alloc(1024 * 1024)); // 1MB buffers
    }
    console.log(`  ✓ Buffer pool initialized with ${poolSize} buffers`);
  }

  /**
   * Set up garbage collection monitoring
   */
  setupGCMonitoring() {
    if (global.gc) {
      setInterval(() => {
        const beforeGC = process.memoryUsage();
        global.gc();
        const afterGC = process.memoryUsage();
        
        const freedMemory = beforeGC.heapUsed - afterGC.heapUsed;
        if (freedMemory > 10 * 1024 * 1024) { // 10MB threshold
          console.log(`🧹 GC freed ${(freedMemory / 1024 / 1024).toFixed(2)}MB`);
        }
      }, this.config.memory.gcInterval);
    }
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      
      if (heapUsedMB > this.config.memory.maxMemoryMB) {
        console.warn(`⚠️ High memory usage: ${heapUsedMB.toFixed(2)}MB`);
        
        // Trigger cleanup
        this.performMemoryCleanup();
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Perform aggressive memory cleanup
   */
  performMemoryCleanup() {
    console.log('🧹 Performing memory cleanup...');
    
    // Clear buffer pool and recreate
    this.bufferPool = [];
    this.initializeBufferPool();
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    // Clear Sharp cache
    sharp.cache(false);
    sharp.cache(this.config.sharp.cache);
    
    console.log('  ✓ Memory cleanup completed');
  }

  /**
   * Initialize job queue processing
   */
  initializeJobQueue() {
    console.log('⚙️ Initializing job queue...');
    
    // Start job processor
    this.startJobProcessor();
    
    console.log(`  ✓ Job queue initialized with max ${this.config.concurrency.maxConcurrentJobs} concurrent jobs`);
  }

  /**
   * Start job processor with concurrency control
   */
  async startJobProcessor() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (true) {
      // Check if we can process more jobs
      if (this.activeJobs.size < this.config.concurrency.maxConcurrentJobs && this.jobQueue.length > 0) {
        const job = this.jobQueue.shift();
        this.processJob(job);
      }
      
      // Small delay to prevent busy waiting
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Process individual job with optimization
   */
  async processJob(job) {
    const jobId = Date.now() + Math.random();
    this.activeJobs.set(jobId, job);
    
    try {
      const result = await this.optimizedImageProcessing(job);
      job.resolve(result);
    } catch (error) {
      job.reject(error);
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Optimized image processing with advanced Sharp configuration
   */
  async optimizedImageProcessing({ imageBuffer, platforms, style, options = {} }) {
    const startTime = Date.now();
    const results = {};
    
    try {
      // Analyze image once for all platforms
      const metadata = await sharp(imageBuffer).metadata();
      const imageSize = this.categorizeImageSize(metadata.width, metadata.height);
      
      // Process all platforms concurrently with optimizations
      const platformPromises = platforms.map(async (platform) => {
        try {
          const platformResult = await this.processPlatformOptimized(
            imageBuffer, 
            platform, 
            imageSize, 
            metadata,
            style,
            options
          );
          return { platform, result: platformResult };
        } catch (error) {
          return { platform, error: error.message };
        }
      });
      
      const platformResults = await Promise.all(platformPromises);
      
      // Compile results
      for (const { platform, result, error } of platformResults) {
        if (result) {
          results[platform] = {
            success: true,
            ...result
          };
        } else {
          results[platform] = {
            success: false,
            error
          };
        }
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        results,
        processingTime: `${processingTime}ms`,
        totalPlatforms: platforms.length,
        successfulPlatforms: Object.values(results).filter(r => r.success).length
      };
      
    } catch (error) {
      throw new Error(`Optimized processing failed: ${error.message}`);
    }
  }

  /**
   * Process single platform with advanced optimizations
   */
  async processPlatformOptimized(imageBuffer, platform, imageSize, metadata, style, options) {
    const platformSpec = this.getPlatformSpec(platform);
    if (!platformSpec) {
      throw new Error(`Platform ${platform} not supported`);
    }
    
    // Create optimized Sharp pipeline
    let pipeline = sharp(imageBuffer);
    
    // Optimize based on image size and platform
    pipeline = await this.applyOptimizedTransformations(
      pipeline, 
      platformSpec, 
      imageSize, 
      style
    );
    
    // Apply platform-specific optimizations
    pipeline = this.applyPlatformOptimizations(pipeline, platform, imageSize);
    
    // Apply advanced compression
    pipeline = this.applyAdvancedCompression(pipeline, platformSpec, imageSize);
    
    // Process and get result
    const startTime = Date.now();
    const outputBuffer = await pipeline.toBuffer();
    const processingTime = Date.now() - startTime;
    
    return {
      platform,
      optimizedImageBuffer: outputBuffer,
      dimensions: `${platformSpec.width}x${platformSpec.height}`,
      fileSize: outputBuffer.length,
      processingTime: `${processingTime}ms`,
      compressionRatio: (imageBuffer.length / outputBuffer.length).toFixed(2),
      format: platformSpec.format || 'jpeg'
    };
  }

  /**
   * Apply optimized transformations based on image analysis
   */
  async applyOptimizedTransformations(pipeline, platformSpec, imageSize, style) {
    // Resize with optimized algorithm
    pipeline = pipeline.resize(platformSpec.width, platformSpec.height, {
      fit: 'cover',
      position: 'centre',
      kernel: sharp.kernel.lanczos3, // High-quality resampling
      withoutEnlargement: false
    });
    
    // Apply style-specific optimizations
    if (style === 'professional') {
      pipeline = pipeline.modulate({
        brightness: 1.05,
        saturation: 1.1,
        hue: 0
      });
    } else if (style === 'creative') {
      pipeline = pipeline.modulate({
        brightness: 1.1,
        saturation: 1.25,
        hue: 0
      });
    }
    
    // Apply sharpening based on image size
    const sharpenConfig = this.getSharpenConfig(imageSize);
    pipeline = pipeline.sharpen(sharpenConfig);
    
    return pipeline;
  }

  /**
   * Apply platform-specific optimizations
   */
  applyPlatformOptimizations(pipeline, platform, imageSize) {
    const platformOptimizations = {
      linkedin: { brightness: 1.02, saturation: 1.05 },
      instagram: { brightness: 1.08, saturation: 1.2 },
      facebook: { brightness: 1.05, saturation: 1.1 },
      twitter: { brightness: 1.03, saturation: 1.08 },
      youtube: { brightness: 1.02, saturation: 1.05 },
      tiktok: { brightness: 1.1, saturation: 1.25 }
    };
    
    const optimization = platformOptimizations[platform];
    if (optimization) {
      pipeline = pipeline.modulate(optimization);
    }
    
    return pipeline;
  }

  /**
   * Apply advanced compression based on image characteristics
   */
  applyAdvancedCompression(pipeline, platformSpec, imageSize) {
    const quality = this.config.imageProcessing.qualityMap[imageSize];
    
    if (this.config.imageProcessing.formatOptimization.useWebP && platformSpec.supportsWebP) {
      pipeline = pipeline.webp({
        quality: quality.webp,
        effort: 6, // Maximum compression effort
        smartSubsample: true
      });
    } else {
      pipeline = pipeline.jpeg({
        quality: quality.jpeg,
        progressive: this.config.imageProcessing.formatOptimization.progressive,
        mozjpeg: true, // Use mozjpeg for better compression
        optimiseScans: true,
        optimiseCoding: true
      });
    }
    
    return pipeline;
  }

  /**
   * Get optimized sharpening configuration
   */
  getSharpenConfig(imageSize) {
    const sharpenConfigs = {
      small: { sigma: 0.5, m1: 1.0, m2: 1.5, x1: 2, y2: 10, y3: 20 },
      medium: { sigma: 1.0, m1: 1.2, m2: 2.0, x1: 3, y2: 15, y3: 25 },
      large: { sigma: 1.5, m1: 1.5, m2: 2.5, x1: 4, y2: 20, y3: 30 }
    };
    
    return sharpenConfigs[imageSize] || sharpenConfigs.medium;
  }

  /**
   * Categorize image size for optimization
   */
  categorizeImageSize(width, height) {
    const pixels = width * height;
    
    if (pixels <= 400 * 400) return 'small';
    if (pixels <= 1200 * 1200) return 'medium';
    return 'large';
  }

  /**
   * Get platform specifications
   */
  getPlatformSpec(platform) {
    const specs = {
      linkedin: { width: 400, height: 400, format: 'jpeg', quality: 0.95, supportsWebP: false },
      instagram: { width: 400, height: 400, format: 'jpeg', quality: 0.90, supportsWebP: true },
      facebook: { width: 400, height: 400, format: 'jpeg', quality: 0.90, supportsWebP: true },
      twitter: { width: 400, height: 400, format: 'jpeg', quality: 0.85, supportsWebP: false },
      youtube: { width: 800, height: 800, format: 'jpeg', quality: 0.95, supportsWebP: true },
      tiktok: { width: 400, height: 400, format: 'jpeg', quality: 0.85, supportsWebP: true }
    };
    
    return specs[platform];
  }

  /**
   * Queue job for processing with priority
   */
  async queueJob(imageBuffer, platforms, style, options = {}) {
    return new Promise((resolve, reject) => {
      const job = {
        imageBuffer,
        platforms,
        style,
        options,
        resolve,
        reject,
        priority: options.priority || 'normal',
        timestamp: Date.now()
      };
      
      // Insert job based on priority
      if (job.priority === 'high') {
        this.jobQueue.unshift(job);
      } else {
        this.jobQueue.push(job);
      }
    });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      activeJobs: this.activeJobs.size,
      queueLength: this.jobQueue.length,
      maxConcurrentJobs: this.config.concurrency.maxConcurrentJobs,
      bufferPoolSize: this.bufferPool.length,
      memory: process.memoryUsage(),
      sharpCache: sharp.cache(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check for production optimizations
   */
  async healthCheck() {
    try {
      // Test basic image processing
      const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      
      const startTime = Date.now();
      await sharp(testBuffer).resize(100, 100).jpeg().toBuffer();
      const processingTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        processingTime: `${processingTime}ms`,
        metrics: this.getPerformanceMetrics(),
        optimizations: {
          sharpConcurrency: this.config.sharp.concurrency,
          bufferPoolEnabled: this.bufferPool.length > 0,
          memoryMonitoring: true,
          jobQueueActive: this.isProcessing
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = { ProductionOptimizations };