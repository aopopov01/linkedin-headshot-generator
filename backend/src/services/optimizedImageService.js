/**
 * Optimized Image Processing Service
 * High-performance image processing with intelligent compression, CDN integration, and batch processing
 */

const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const logger = require('../config/logger');
const cacheService = require('./advancedCacheService');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class OptimizedImageService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.processingQueue = [];
    this.isProcessing = false;
    this.maxConcurrentProcessing = 3;
    this.activeProcessing = 0;
    
    // Image optimization settings
    this.optimizationProfiles = {
      thumbnail: { width: 150, height: 150, quality: 85 },
      medium: { width: 400, height: 400, quality: 88 },
      large: { width: 800, height: 800, quality: 92 },
      original: { quality: 95 }
    };

    // Supported formats
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    this.outputFormat = 'webp'; // Default to WebP for better compression
    
    this.initializeCloudinary();
  }

  /**
   * Initialize Cloudinary for CDN storage
   */
  initializeCloudinary() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }

  /**
   * Process and optimize image with multiple variants
   */
  async processAndOptimizeImage(imageData, options = {}) {
    const startTime = Date.now();
    const imageId = this.generateImageId();
    
    try {
      // Validate input
      const validation = await this.validateImage(imageData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Convert base64 to buffer if needed
      const imageBuffer = this.prepareImageBuffer(imageData);
      
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      logger.info('Processing image:', {
        imageId,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: imageBuffer.length
      });

      // Generate optimized variants
      const variants = await this.generateImageVariants(imageBuffer, imageId, options);
      
      // Upload to CDN with parallel processing
      const uploadResults = await this.uploadToCDN(variants, imageId);
      
      // Cache results
      await this.cacheImageResults(imageId, uploadResults);
      
      const processingTime = Date.now() - startTime;
      logger.info('Image processing completed:', {
        imageId,
        processingTime,
        variants: Object.keys(uploadResults).length
      });

      return {
        success: true,
        imageId,
        processingTime,
        originalMetadata: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          size: imageBuffer.length
        },
        variants: uploadResults
      };

    } catch (error) {
      logger.error('Image processing failed:', {
        imageId,
        error: error.message,
        processingTime: Date.now() - startTime
      });
      
      throw error;
    }
  }

  /**
   * Generate multiple image variants for different use cases
   */
  async generateImageVariants(imageBuffer, imageId, options = {}) {
    const variants = {};
    const profiles = options.profiles || this.optimizationProfiles;
    
    const promises = Object.entries(profiles).map(async ([variantName, profile]) => {
      try {
        let processor = sharp(imageBuffer);
        
        // Apply transformations
        if (profile.width || profile.height) {
          processor = processor.resize(profile.width, profile.height, {
            fit: 'cover',
            position: 'center'
          });
        }

        // Convert to optimal format
        const format = options.format || this.outputFormat;
        processor = processor.toFormat(format, {
          quality: profile.quality || 85,
          progressive: true,
          mozjpeg: format === 'jpeg'
        });

        // Apply additional optimizations
        if (format === 'png') {
          processor = processor.png({
            compressionLevel: 9,
            adaptiveFiltering: true
          });
        } else if (format === 'webp') {
          processor = processor.webp({
            quality: profile.quality || 85,
            effort: 6
          });
        }

        const optimizedBuffer = await processor.toBuffer();
        
        variants[variantName] = {
          buffer: optimizedBuffer,
          format: format,
          size: optimizedBuffer.length,
          filename: `${imageId}_${variantName}.${format}`
        };

      } catch (error) {
        logger.error(`Failed to generate ${variantName} variant:`, error);
      }
    });

    await Promise.all(promises);
    return variants;
  }

  /**
   * Upload images to CDN with optimization
   */
  async uploadToCDN(variants, imageId) {
    const uploadResults = {};
    
    const uploadPromises = Object.entries(variants).map(async ([variantName, variant]) => {
      try {
        const uploadResult = await cloudinary.uploader.upload(
          `data:image/${variant.format};base64,${variant.buffer.toString('base64')}`,
          {
            public_id: `linkedin-headshots/${imageId}/${variantName}`,
            folder: 'linkedin-headshots',
            resource_type: 'image',
            format: variant.format,
            transformation: this.getCloudinaryTransformations(variantName)
          }
        );

        uploadResults[variantName] = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
          version: uploadResult.version,
          etag: uploadResult.etag
        };

      } catch (error) {
        logger.error(`Failed to upload ${variantName}:`, error);
      }
    });

    await Promise.all(uploadPromises);
    return uploadResults;
  }

  /**
   * Get Cloudinary transformations for different variants
   */
  getCloudinaryTransformations(variantName) {
    const transformations = {
      thumbnail: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      medium: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        { dpr: 'auto' }
      ],
      large: [
        { quality: 'auto:best' },
        { fetch_format: 'auto' },
        { dpr: 'auto' }
      ],
      original: [
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
    };

    return transformations[variantName] || transformations.medium;
  }

  /**
   * Batch process multiple images
   */
  async batchProcessImages(images, options = {}) {
    const startTime = Date.now();
    const results = [];
    const concurrency = options.concurrency || this.maxConcurrentProcessing;
    
    logger.info(`Starting batch processing of ${images.length} images with concurrency: ${concurrency}`);

    // Process images in batches
    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (imageData, index) => {
        try {
          const result = await this.processAndOptimizeImage(imageData, options);
          return { index: i + index, success: true, result };
        } catch (error) {
          logger.error(`Batch processing error for image ${i + index}:`, error);
          return { index: i + index, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming the system
      if (i + concurrency < images.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const processingTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    logger.info('Batch processing completed:', {
      total: images.length,
      successful: successCount,
      failed: images.length - successCount,
      processingTime
    });

    return {
      success: true,
      processingTime,
      totalImages: images.length,
      successfulImages: successCount,
      failedImages: images.length - successCount,
      results
    };
  }

  /**
   * Compress image with smart quality adjustment
   */
  async compressImage(imageBuffer, targetSize = null, maxQuality = 95) {
    let quality = maxQuality;
    let compressedBuffer = imageBuffer;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const processor = sharp(imageBuffer)
        .jpeg({ quality, progressive: true, mozjpeg: true });

      compressedBuffer = await processor.toBuffer();
      
      // If no target size specified or we've reached it, return
      if (!targetSize || compressedBuffer.length <= targetSize) {
        break;
      }

      // Reduce quality for next attempt
      quality = Math.max(quality - 10, 20);
      attempts++;
    }

    const compressionRatio = ((imageBuffer.length - compressedBuffer.length) / imageBuffer.length) * 100;
    
    logger.debug('Image compression completed:', {
      originalSize: imageBuffer.length,
      compressedSize: compressedBuffer.length,
      compressionRatio: compressionRatio.toFixed(2) + '%',
      finalQuality: quality,
      attempts
    });

    return {
      buffer: compressedBuffer,
      originalSize: imageBuffer.length,
      compressedSize: compressedBuffer.length,
      compressionRatio,
      quality
    };
  }

  /**
   * Generate responsive image URLs
   */
  generateResponsiveUrls(imageId, baseUrl) {
    const sizes = [150, 300, 600, 1200];
    const formats = ['webp', 'jpeg'];
    
    const responsiveUrls = {};
    
    formats.forEach(format => {
      responsiveUrls[format] = {};
      sizes.forEach(size => {
        const transformations = `w_${size},h_${size},c_fill,f_${format},q_auto:good`;
        responsiveUrls[format][size] = `${baseUrl}/${transformations}/${imageId}`;
      });
    });

    return responsiveUrls;
  }

  /**
   * Get cached image results
   */
  async getCachedImageResults(imageId) {
    return await cacheService.get(`image:${imageId}`);
  }

  /**
   * Cache image processing results
   */
  async cacheImageResults(imageId, results) {
    return await cacheService.set(`image:${imageId}`, results, 86400); // Cache for 24 hours
  }

  /**
   * Validate image data
   */
  async validateImage(imageData) {
    try {
      const imageBuffer = this.prepareImageBuffer(imageData);
      
      if (!imageBuffer || imageBuffer.length === 0) {
        return { isValid: false, error: 'Invalid or empty image data' };
      }

      // Check file size (max 10MB)
      if (imageBuffer.length > 10 * 1024 * 1024) {
        return { isValid: false, error: 'Image too large (max 10MB)' };
      }

      // Validate image format using Sharp
      const metadata = await sharp(imageBuffer).metadata();
      
      if (!this.supportedFormats.includes(metadata.format)) {
        return { 
          isValid: false, 
          error: `Unsupported format: ${metadata.format}. Supported formats: ${this.supportedFormats.join(', ')}` 
        };
      }

      // Check image dimensions (reasonable limits)
      if (metadata.width > 4000 || metadata.height > 4000) {
        return { isValid: false, error: 'Image dimensions too large (max 4000x4000)' };
      }

      if (metadata.width < 100 || metadata.height < 100) {
        return { isValid: false, error: 'Image dimensions too small (min 100x100)' };
      }

      return { 
        isValid: true, 
        metadata: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          channels: metadata.channels,
          hasProfile: metadata.hasProfile
        }
      };

    } catch (error) {
      return { isValid: false, error: `Image validation failed: ${error.message}` };
    }
  }

  /**
   * Prepare image buffer from various input formats
   */
  prepareImageBuffer(imageData) {
    if (Buffer.isBuffer(imageData)) {
      return imageData;
    }

    if (typeof imageData === 'string') {
      // Handle base64 data URLs
      if (imageData.startsWith('data:image/')) {
        const base64Data = imageData.split(',')[1];
        return Buffer.from(base64Data, 'base64');
      }
      
      // Handle raw base64
      try {
        return Buffer.from(imageData, 'base64');
      } catch (error) {
        throw new Error('Invalid base64 image data');
      }
    }

    throw new Error('Unsupported image data format');
  }

  /**
   * Generate unique image ID
   */
  generateImageId() {
    return `img_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Get image processing statistics
   */
  getProcessingStats() {
    return {
      activeProcessing: this.activeProcessing,
      queueLength: this.processingQueue.length,
      maxConcurrency: this.maxConcurrentProcessing,
      supportedFormats: this.supportedFormats,
      outputFormat: this.outputFormat
    };
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(olderThanMinutes = 60) {
    try {
      const files = await fs.readdir(this.tempDir);
      const cutoffTime = Date.now() - (olderThanMinutes * 60 * 1000);
      
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }
      
      logger.info(`Cleaned up ${cleanedCount} temporary files`);
      return cleanedCount;
      
    } catch (error) {
      logger.error('Failed to cleanup temp files:', error);
      return 0;
    }
  }

  /**
   * Health check for image service
   */
  async healthCheck() {
    try {
      // Test Sharp processing
      const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA2m8x0wAAAABJRU5ErkJggg==', 'base64');
      await sharp(testBuffer).metadata();
      
      // Test Cloudinary connection
      const cloudinaryTest = await cloudinary.api.ping();
      
      return {
        status: 'healthy',
        sharpAvailable: true,
        cloudinaryConnected: cloudinaryTest.status === 'ok',
        activeProcessing: this.activeProcessing,
        queueLength: this.processingQueue.length
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new OptimizedImageService();