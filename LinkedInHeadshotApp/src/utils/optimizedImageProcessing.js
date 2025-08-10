/**
 * Optimized Image Processing Utilities for Mobile App
 * High-performance image operations with memory management and progressive loading
 */

import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

class OptimizedImageProcessing {
  constructor() {
    this.compressionQueue = [];
    this.isProcessing = false;
    this.maxConcurrentOperations = 2;
    this.activeOperations = 0;
    
    // Image optimization profiles
    this.profiles = {
      thumbnail: {
        width: 150,
        height: 150,
        quality: 80,
        format: 'JPEG'
      },
      preview: {
        width: 400,
        height: 400,
        quality: 85,
        format: 'JPEG'
      },
      upload: {
        width: 800,
        height: 800,
        quality: 90,
        format: 'JPEG'
      },
      original: {
        quality: 95,
        format: 'JPEG'
      }
    };

    this.cacheDir = `${RNFS.CachesDirectoryPath}/images`;
    this.maxCacheSize = 100 * 1024 * 1024; // 100MB
    this.initializeCache();
  }

  /**
   * Initialize image cache directory
   */
  async initializeCache() {
    try {
      const exists = await RNFS.exists(this.cacheDir);
      if (!exists) {
        await RNFS.mkdir(this.cacheDir);
      }
      console.log('📁 Image cache initialized');
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  /**
   * Process image with optimized settings
   */
  async processImage(imageUri, profile = 'upload', options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!imageUri) {
        throw new Error('Image URI is required');
      }

      // Get processing profile
      const processingProfile = { ...this.profiles[profile], ...options };
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(imageUri, processingProfile);
      
      // Check cache first
      const cachedImage = await this.getCachedImage(cacheKey);
      if (cachedImage) {
        console.log(`📦 Image served from cache: ${Date.now() - startTime}ms`);
        return cachedImage;
      }

      // Add to processing queue if at capacity
      if (this.activeOperations >= this.maxConcurrentOperations) {
        return await this.queueImageProcessing(imageUri, processingProfile, cacheKey);
      }

      // Process image
      const result = await this.performImageProcessing(imageUri, processingProfile, cacheKey);
      
      const processingTime = Date.now() - startTime;
      console.log(`🖼️ Image processed: ${processingTime}ms`);
      
      return result;
      
    } catch (error) {
      console.error('Image processing failed:', error);
      throw error;
    }
  }

  /**
   * Perform actual image processing
   */
  async performImageProcessing(imageUri, profile, cacheKey) {
    this.activeOperations++;
    
    try {
      // Resize and compress image
      const resizedImage = await ImageResizer.createResizedImage(
        imageUri,
        profile.width || 800,
        profile.height || 800,
        profile.format || 'JPEG',
        profile.quality || 85,
        0, // rotation
        null, // outputPath
        false, // keepMeta
        {
          mode: 'cover',
          onlyScaleDown: true
        }
      );

      // Get image info
      const imageInfo = {
        uri: resizedImage.uri,
        path: resizedImage.path,
        name: resizedImage.name,
        size: resizedImage.size,
        width: resizedImage.width,
        height: resizedImage.height,
        originalUri: imageUri,
        profile: profile,
        cacheKey: cacheKey,
        processedAt: Date.now()
      };

      // Cache the processed image
      await this.cacheImage(cacheKey, imageInfo);
      
      return imageInfo;
      
    } finally {
      this.activeOperations--;
      this.processQueue();
    }
  }

  /**
   * Queue image processing when at capacity
   */
  async queueImageProcessing(imageUri, profile, cacheKey) {
    return new Promise((resolve, reject) => {
      this.compressionQueue.push({
        imageUri,
        profile,
        cacheKey,
        resolve,
        reject
      });
    });
  }

  /**
   * Process queued images
   */
  async processQueue() {
    if (this.compressionQueue.length === 0 || this.activeOperations >= this.maxConcurrentOperations) {
      return;
    }

    const queuedItem = this.compressionQueue.shift();
    
    try {
      const result = await this.performImageProcessing(
        queuedItem.imageUri,
        queuedItem.profile,
        queuedItem.cacheKey
      );
      queuedItem.resolve(result);
    } catch (error) {
      queuedItem.reject(error);
    }
  }

  /**
   * Batch process multiple images
   */
  async batchProcessImages(images, profile = 'upload', onProgress = null) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < images.length; i++) {
      try {
        const result = await this.processImage(images[i], profile);
        results.push(result);
        
        if (onProgress) {
          onProgress({
            completed: i + 1,
            total: images.length,
            progress: ((i + 1) / images.length) * 100
          });
        }
      } catch (error) {
        errors.push({
          index: i,
          imageUri: images[i],
          error: error.message
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors
    };
  }

  /**
   * Progressive image loading with multiple qualities
   */
  async getProgressiveImage(imageUri) {
    try {
      // Load thumbnail first for immediate display
      const thumbnail = await this.processImage(imageUri, 'thumbnail');
      
      // Load preview quality in background
      const preview = this.processImage(imageUri, 'preview');
      
      // Load full quality last
      const fullQuality = this.processImage(imageUri, 'upload');

      return {
        thumbnail,
        preview: await preview,
        fullQuality: await fullQuality
      };
    } catch (error) {
      console.error('Progressive loading failed:', error);
      throw error;
    }
  }

  /**
   * Generate cache key for image and processing profile
   */
  generateCacheKey(imageUri, profile) {
    const profileKey = JSON.stringify(profile);
    const hash = this.simpleHash(imageUri + profileKey);
    return `img_${hash}_${profile.width || 'orig'}_${profile.quality || 85}`;
  }

  /**
   * Simple hash function for cache keys
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cache processed image
   */
  async cacheImage(cacheKey, imageInfo) {
    try {
      const cacheFile = `${this.cacheDir}/${cacheKey}.json`;
      await RNFS.writeFile(cacheFile, JSON.stringify(imageInfo));
      
      // Manage cache size
      await this.manageCacheSize();
    } catch (error) {
      console.warn('Failed to cache image:', error);
    }
  }

  /**
   * Get cached image
   */
  async getCachedImage(cacheKey) {
    try {
      const cacheFile = `${this.cacheDir}/${cacheKey}.json`;
      const exists = await RNFS.exists(cacheFile);
      
      if (!exists) {
        return null;
      }

      const cacheData = await RNFS.readFile(cacheFile);
      const imageInfo = JSON.parse(cacheData);
      
      // Check if cached image file still exists
      const imageExists = await RNFS.exists(imageInfo.path);
      if (!imageExists) {
        // Remove stale cache entry
        await RNFS.unlink(cacheFile);
        return null;
      }

      // Check cache expiry (24 hours)
      const cacheAge = Date.now() - imageInfo.processedAt;
      if (cacheAge > 24 * 60 * 60 * 1000) {
        await this.clearCacheEntry(cacheKey);
        return null;
      }

      return imageInfo;
    } catch (error) {
      console.warn('Failed to get cached image:', error);
      return null;
    }
  }

  /**
   * Manage cache size to prevent storage bloat
   */
  async manageCacheSize() {
    try {
      const cacheFiles = await RNFS.readDir(this.cacheDir);
      
      // Calculate total cache size
      let totalSize = 0;
      const fileDetails = [];
      
      for (const file of cacheFiles) {
        totalSize += file.size;
        fileDetails.push({
          path: file.path,
          size: file.size,
          mtime: file.mtime
        });
      }

      // If cache exceeds limit, remove oldest files
      if (totalSize > this.maxCacheSize) {
        console.log(`🗑️ Cache size exceeded (${Math.round(totalSize / 1024 / 1024)}MB), cleaning up`);
        
        // Sort by modification time (oldest first)
        fileDetails.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
        
        // Remove files until under limit
        let currentSize = totalSize;
        const targetSize = this.maxCacheSize * 0.8; // Clean to 80% of limit
        
        for (const file of fileDetails) {
          if (currentSize <= targetSize) break;
          
          try {
            await RNFS.unlink(file.path);
            currentSize -= file.size;
          } catch (error) {
            console.warn('Failed to delete cache file:', error);
          }
        }
        
        console.log(`✅ Cache cleanup completed, new size: ${Math.round(currentSize / 1024 / 1024)}MB`);
      }
    } catch (error) {
      console.warn('Cache management failed:', error);
    }
  }

  /**
   * Clear specific cache entry
   */
  async clearCacheEntry(cacheKey) {
    try {
      const cacheFile = `${this.cacheDir}/${cacheKey}.json`;
      const exists = await RNFS.exists(cacheFile);
      
      if (exists) {
        await RNFS.unlink(cacheFile);
      }
    } catch (error) {
      console.warn('Failed to clear cache entry:', error);
    }
  }

  /**
   * Clear all cached images
   */
  async clearCache() {
    try {
      const exists = await RNFS.exists(this.cacheDir);
      if (exists) {
        await RNFS.unlink(this.cacheDir);
        await RNFS.mkdir(this.cacheDir);
      }
      console.log('🗑️ Image cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const exists = await RNFS.exists(this.cacheDir);
      if (!exists) {
        return { size: 0, files: 0, sizeFormatted: '0 MB' };
      }

      const files = await RNFS.readDir(this.cacheDir);
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      return {
        size: totalSize,
        files: files.length,
        sizeFormatted: `${Math.round(totalSize / 1024 / 1024 * 100) / 100} MB`,
        maxSize: this.maxCacheSize,
        maxSizeFormatted: `${Math.round(this.maxCacheSize / 1024 / 1024)} MB`,
        utilization: (totalSize / this.maxCacheSize) * 100
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { size: 0, files: 0, sizeFormatted: '0 MB' };
    }
  }

  /**
   * Optimize image for specific use case
   */
  async optimizeForUseCase(imageUri, useCase) {
    const useCaseProfiles = {
      profile_picture: {
        width: 200,
        height: 200,
        quality: 90,
        format: 'JPEG'
      },
      gallery_thumbnail: {
        width: 150,
        height: 150,
        quality: 80,
        format: 'JPEG'
      },
      full_resolution: {
        width: 1200,
        height: 1200,
        quality: 95,
        format: 'JPEG'
      },
      sharing: {
        width: 600,
        height: 600,
        quality: 85,
        format: 'JPEG'
      }
    };

    const profile = useCaseProfiles[useCase] || useCaseProfiles.sharing;
    return await this.processImage(imageUri, profile);
  }

  /**
   * Convert image to base64 with optimization
   */
  async convertToBase64(imageUri, maxSize = 1024 * 1024) { // 1MB default
    try {
      // First optimize the image size
      let quality = 90;
      let processedImage = null;
      
      // Iteratively reduce quality until size is acceptable
      while (quality > 20) {
        processedImage = await this.processImage(imageUri, {
          width: 800,
          height: 800,
          quality: quality,
          format: 'JPEG'
        });

        if (processedImage.size <= maxSize) {
          break;
        }

        quality -= 10;
      }

      // Convert to base64
      const base64 = await RNFS.readFile(processedImage.path, 'base64');
      
      return {
        base64: `data:image/jpeg;base64,${base64}`,
        size: processedImage.size,
        quality: quality,
        dimensions: {
          width: processedImage.width,
          height: processedImage.height
        }
      };
    } catch (error) {
      console.error('Base64 conversion failed:', error);
      throw error;
    }
  }

  /**
   * Get processing queue status
   */
  getQueueStatus() {
    return {
      activeOperations: this.activeOperations,
      queueLength: this.compressionQueue.length,
      maxConcurrent: this.maxConcurrentOperations,
      isProcessing: this.activeOperations > 0
    };
  }

  /**
   * Preload images for better user experience
   */
  async preloadImages(imageUris, profile = 'preview') {
    const preloadPromises = imageUris.map(uri => 
      this.processImage(uri, profile).catch(error => {
        console.warn(`Failed to preload image ${uri}:`, error);
        return null;
      })
    );

    const results = await Promise.all(preloadPromises);
    const successful = results.filter(result => result !== null);
    
    console.log(`📥 Preloaded ${successful.length}/${imageUris.length} images`);
    return successful;
  }
}

export default new OptimizedImageProcessing();