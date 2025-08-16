/**
 * Custom Dimension Handler
 * Manages custom image dimensions and aspect ratio requirements
 * Handles non-standard sizes and user-specified dimensions
 */

class CustomDimensionHandler {
  constructor() {
    // Dimension constraints
    this.constraints = {
      minWidth: 50,
      maxWidth: 4096,
      minHeight: 50,
      maxHeight: 4096,
      maxPixels: 16777216, // 16 megapixels (4096x4096)
      supportedAspectRatios: {
        'square': { ratio: 1.0, tolerance: 0.02 },
        'portrait': { ratio: 0.75, tolerance: 0.05 }, // 3:4
        'landscape': { ratio: 1.33, tolerance: 0.05 }, // 4:3
        'widescreen': { ratio: 1.78, tolerance: 0.05 }, // 16:9
        'ultrawide': { ratio: 2.4, tolerance: 0.1 }
      }
    };

    // Common dimension presets
    this.presets = {
      'linkedin_custom': { width: 500, height: 500, aspectRatio: '1:1', category: 'professional' },
      'instagram_story': { width: 1080, height: 1920, aspectRatio: '9:16', category: 'social' },
      'instagram_post': { width: 1080, height: 1080, aspectRatio: '1:1', category: 'social' },
      'facebook_cover': { width: 851, height: 315, aspectRatio: '27:10', category: 'social' },
      'twitter_header': { width: 1500, height: 500, aspectRatio: '3:1', category: 'social' },
      'youtube_thumbnail': { width: 1280, height: 720, aspectRatio: '16:9', category: 'content' },
      'website_avatar': { width: 300, height: 300, aspectRatio: '1:1', category: 'web' },
      'print_passport': { width: 413, height: 531, aspectRatio: '35:45mm', category: 'print' },
      'business_card': { width: 1050, height: 600, aspectRatio: '7:4', category: 'print' }
    };

    // Processing metrics
    this.metrics = {
      totalRequests: 0,
      successfulProcessing: 0,
      failedProcessing: 0,
      presetUsage: {},
      customDimensionStats: {
        averageWidth: 0,
        averageHeight: 0,
        mostCommonAspectRatio: null
      }
    };
  }

  /**
   * Process custom dimensions request
   */
  async processCustomDimensions(request, customDimensions) {
    try {
      console.log(`📐 Processing custom dimensions: ${JSON.stringify(customDimensions)}`);
      this.metrics.totalRequests++;

      // Validate custom dimensions
      const validatedDimensions = this.validateCustomDimensions(customDimensions);
      
      // Apply dimension processing to request
      const processedRequest = await this.applyCustomDimensions(request, validatedDimensions);
      
      // Update metrics
      this.updateMetrics(validatedDimensions);
      this.metrics.successfulProcessing++;

      console.log(`✅ Custom dimensions processed successfully`);
      
      return processedRequest;

    } catch (error) {
      console.error('❌ Custom dimension processing failed:', error);
      this.metrics.failedProcessing++;
      throw new Error(`Custom dimension processing failed: ${error.message}`);
    }
  }

  /**
   * Validate custom dimensions against constraints
   */
  validateCustomDimensions(customDimensions) {
    if (!customDimensions) {
      throw new Error('Custom dimensions are required');
    }

    // Handle preset dimensions
    if (typeof customDimensions === 'string') {
      const preset = this.presets[customDimensions];
      if (!preset) {
        throw new Error(`Unknown dimension preset: ${customDimensions}`);
      }
      
      // Track preset usage
      this.trackPresetUsage(customDimensions);
      
      return {
        width: preset.width,
        height: preset.height,
        aspectRatio: preset.aspectRatio,
        source: 'preset',
        presetName: customDimensions,
        category: preset.category
      };
    }

    // Handle explicit dimensions
    if (typeof customDimensions === 'object') {
      const { width, height, aspectRatio, maintainAspectRatio = true } = customDimensions;
      
      // Validate width and height
      if (width && height) {
        return this.validateExplicitDimensions(width, height, maintainAspectRatio);
      }
      
      // Handle aspect ratio only
      if (aspectRatio) {
        return this.validateAspectRatioOnly(aspectRatio, customDimensions);
      }
      
      throw new Error('Either width+height or aspectRatio must be specified');
    }

    throw new Error('Invalid custom dimensions format');
  }

  /**
   * Validate explicit width and height dimensions
   */
  validateExplicitDimensions(width, height, maintainAspectRatio) {
    // Convert to numbers
    const w = parseInt(width);
    const h = parseInt(height);
    
    if (isNaN(w) || isNaN(h)) {
      throw new Error('Width and height must be valid numbers');
    }
    
    // Check constraints
    if (w < this.constraints.minWidth || w > this.constraints.maxWidth) {
      throw new Error(`Width ${w} outside allowed range ${this.constraints.minWidth}-${this.constraints.maxWidth}`);
    }
    
    if (h < this.constraints.minHeight || h > this.constraints.maxHeight) {
      throw new Error(`Height ${h} outside allowed range ${this.constraints.minHeight}-${this.constraints.maxHeight}`);
    }
    
    // Check total pixels
    const totalPixels = w * h;
    if (totalPixels > this.constraints.maxPixels) {
      throw new Error(`Total pixels ${totalPixels} exceeds maximum ${this.constraints.maxPixels}`);
    }
    
    const aspectRatio = w / h;
    const aspectRatioString = this.calculateAspectRatioString(aspectRatio);
    
    return {
      width: w,
      height: h,
      aspectRatio: aspectRatioString,
      aspectRatioDecimal: aspectRatio,
      source: 'explicit',
      maintainAspectRatio,
      totalPixels
    };
  }

  /**
   * Validate aspect ratio only specification
   */
  validateAspectRatioOnly(aspectRatio, customDimensions) {
    let ratio;
    
    if (typeof aspectRatio === 'string') {
      // Handle string ratios like "16:9", "4:3", etc.
      ratio = this.parseAspectRatioString(aspectRatio);
    } else if (typeof aspectRatio === 'number') {
      ratio = aspectRatio;
    } else {
      throw new Error('Invalid aspect ratio format');
    }
    
    if (ratio <= 0 || ratio > 10) {
      throw new Error(`Aspect ratio ${ratio} is out of reasonable range (0.1 - 10.0)`);
    }
    
    // Determine default dimensions based on aspect ratio
    const defaultDimensions = this.calculateDefaultDimensions(ratio, customDimensions);
    
    return {
      aspectRatio: aspectRatio,
      aspectRatioDecimal: ratio,
      width: defaultDimensions.width,
      height: defaultDimensions.height,
      source: 'aspect_ratio_only',
      calculatedDimensions: true
    };
  }

  /**
   * Parse aspect ratio string like "16:9" or "4:3"
   */
  parseAspectRatioString(aspectRatioString) {
    const parts = aspectRatioString.split(':');
    if (parts.length !== 2) {
      throw new Error(`Invalid aspect ratio format: ${aspectRatioString}. Expected format: "width:height"`);
    }
    
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      throw new Error(`Invalid aspect ratio values in: ${aspectRatioString}`);
    }
    
    return w / h;
  }

  /**
   * Calculate aspect ratio string from decimal ratio
   */
  calculateAspectRatioString(ratio) {
    // Common aspect ratios
    const commonRatios = [
      { ratio: 1.0, string: '1:1' },
      { ratio: 4/3, string: '4:3' },
      { ratio: 3/4, string: '3:4' },
      { ratio: 16/9, string: '16:9' },
      { ratio: 9/16, string: '9:16' },
      { ratio: 3/2, string: '3:2' },
      { ratio: 2/3, string: '2:3' },
      { ratio: 5/4, string: '5:4' },
      { ratio: 4/5, string: '4:5' }
    ];
    
    // Find closest common ratio
    for (const common of commonRatios) {
      if (Math.abs(ratio - common.ratio) < 0.02) {
        return common.string;
      }
    }
    
    // Generate ratio string for uncommon ratios
    const gcd = this.calculateGCD(Math.round(ratio * 100), 100);
    const w = Math.round(ratio * 100) / gcd;
    const h = 100 / gcd;
    
    return `${w}:${h}`;
  }

  /**
   * Calculate greatest common divisor
   */
  calculateGCD(a, b) {
    return b === 0 ? a : this.calculateGCD(b, a % b);
  }

  /**
   * Calculate default dimensions for aspect ratio
   */
  calculateDefaultDimensions(aspectRatio, customDimensions = {}) {
    const { preferredSize = 'medium', maxWidth, maxHeight } = customDimensions;
    
    // Size presets
    const sizePresets = {
      small: 400,
      medium: 800,
      large: 1200,
      xlarge: 1600
    };
    
    let baseSize = sizePresets[preferredSize] || sizePresets.medium;
    
    // Apply constraints if provided
    if (maxWidth) baseSize = Math.min(baseSize, maxWidth);
    if (maxHeight && aspectRatio < 1) baseSize = Math.min(baseSize, maxHeight * aspectRatio);
    
    let width, height;
    
    if (aspectRatio >= 1) {
      // Landscape or square
      width = baseSize;
      height = Math.round(baseSize / aspectRatio);
    } else {
      // Portrait
      height = baseSize;
      width = Math.round(baseSize * aspectRatio);
    }
    
    // Ensure within constraints
    width = Math.max(this.constraints.minWidth, Math.min(width, this.constraints.maxWidth));
    height = Math.max(this.constraints.minHeight, Math.min(height, this.constraints.maxHeight));
    
    return { width, height };
  }

  /**
   * Apply custom dimensions to image request
   */
  async applyCustomDimensions(request, validatedDimensions) {
    const processedRequest = { ...request };
    
    // Add custom dimension information to the request
    processedRequest.customDimensions = validatedDimensions;
    
    // If we have an image buffer, we might need to pre-process it
    if (request.imageBuffer && this.shouldPreProcess(validatedDimensions)) {
      processedRequest.imageBuffer = await this.preProcessImage(
        request.imageBuffer,
        validatedDimensions
      );
    }
    
    // Add dimension metadata for downstream processing
    processedRequest.dimensionMetadata = {
      originalRequest: request.customDimensions,
      processedDimensions: validatedDimensions,
      processingRequired: this.requiresSpecialProcessing(validatedDimensions),
      recommendations: this.generateDimensionRecommendations(validatedDimensions)
    };
    
    return processedRequest;
  }

  /**
   * Check if image should be pre-processed
   */
  shouldPreProcess(dimensions) {
    // Pre-process if dimensions are very large or unusual aspect ratios
    return dimensions.totalPixels > 4000000 || // > 4MP
           Math.abs(dimensions.aspectRatioDecimal - 1) > 2; // Very wide or tall
  }

  /**
   * Pre-process image for custom dimensions
   */
  async preProcessImage(imageBuffer, dimensions) {
    try {
      const sharp = require('sharp');
      
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const currentRatio = metadata.width / metadata.height;
      const targetRatio = dimensions.aspectRatioDecimal;
      
      let pipeline = sharp(imageBuffer);
      
      // If aspect ratios don't match and we're maintaining aspect ratio
      if (Math.abs(currentRatio - targetRatio) > 0.05 && dimensions.maintainAspectRatio) {
        // Crop to target aspect ratio first
        let cropWidth, cropHeight, left = 0, top = 0;
        
        if (currentRatio > targetRatio) {
          // Current image is wider, crop width
          cropHeight = metadata.height;
          cropWidth = Math.round(cropHeight * targetRatio);
          left = Math.round((metadata.width - cropWidth) / 2);
        } else {
          // Current image is taller, crop height
          cropWidth = metadata.width;
          cropHeight = Math.round(cropWidth / targetRatio);
          top = Math.round((metadata.height - cropHeight) / 2);
        }
        
        pipeline = pipeline.extract({
          left: Math.max(0, left),
          top: Math.max(0, top),
          width: Math.min(cropWidth, metadata.width),
          height: Math.min(cropHeight, metadata.height)
        });
      }
      
      // Resize to target dimensions
      pipeline = pipeline.resize(dimensions.width, dimensions.height, {
        fit: dimensions.maintainAspectRatio ? 'cover' : 'fill',
        position: 'center'
      });
      
      return await pipeline.toBuffer();
      
    } catch (error) {
      console.error('❌ Image pre-processing failed:', error);
      return imageBuffer; // Return original if pre-processing fails
    }
  }

  /**
   * Check if dimensions require special processing
   */
  requiresSpecialProcessing(dimensions) {
    return dimensions.source === 'explicit' ||
           dimensions.calculatedDimensions ||
           dimensions.totalPixels > 2000000; // > 2MP
  }

  /**
   * Generate recommendations for dimension optimization
   */
  generateDimensionRecommendations(dimensions) {
    const recommendations = [];
    
    // Performance recommendations
    if (dimensions.totalPixels > 8000000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Consider reducing dimensions for faster processing',
        suggestedWidth: Math.round(dimensions.width * 0.75),
        suggestedHeight: Math.round(dimensions.height * 0.75)
      });
    }
    
    // Aspect ratio recommendations
    if (Math.abs(dimensions.aspectRatioDecimal - 1) > 3) {
      recommendations.push({
        type: 'aspect_ratio',
        priority: 'medium',
        message: 'Extreme aspect ratios may not work well on all platforms',
        suggestion: 'Consider using more standard aspect ratios'
      });
    }
    
    // Platform compatibility
    const incompatiblePlatforms = this.checkPlatformCompatibility(dimensions);
    if (incompatiblePlatforms.length > 0) {
      recommendations.push({
        type: 'platform_compatibility',
        priority: 'medium',
        message: `Custom dimensions may not work optimally on: ${incompatiblePlatforms.join(', ')}`,
        suggestion: 'Consider platform-specific dimensions'
      });
    }
    
    return recommendations;
  }

  /**
   * Check platform compatibility for custom dimensions
   */
  checkPlatformCompatibility(dimensions) {
    const incompatible = [];
    const ratio = dimensions.aspectRatioDecimal;
    
    // Check against common platform requirements
    if (Math.abs(ratio - 1) > 0.5) {
      incompatible.push('LinkedIn', 'Instagram profile');
    }
    
    if (ratio < 0.5 || ratio > 2) {
      incompatible.push('Facebook', 'Twitter');
    }
    
    if (dimensions.width < 200 || dimensions.height < 200) {
      incompatible.push('YouTube', 'High-resolution platforms');
    }
    
    return incompatible;
  }

  /**
   * Track preset usage for analytics
   */
  trackPresetUsage(presetName) {
    if (!this.metrics.presetUsage[presetName]) {
      this.metrics.presetUsage[presetName] = 0;
    }
    this.metrics.presetUsage[presetName]++;
  }

  /**
   * Update processing metrics
   */
  updateMetrics(dimensions) {
    // Update dimension statistics
    const totalProcessed = this.metrics.successfulProcessing;
    
    // Update average dimensions
    if (totalProcessed === 0) {
      this.metrics.customDimensionStats.averageWidth = dimensions.width;
      this.metrics.customDimensionStats.averageHeight = dimensions.height;
    } else {
      this.metrics.customDimensionStats.averageWidth = 
        (this.metrics.customDimensionStats.averageWidth * totalProcessed + dimensions.width) / (totalProcessed + 1);
      this.metrics.customDimensionStats.averageHeight = 
        (this.metrics.customDimensionStats.averageHeight * totalProcessed + dimensions.height) / (totalProcessed + 1);
    }
    
    // Track most common aspect ratio
    const ratioString = dimensions.aspectRatio;
    // Simplified tracking - in production would maintain more detailed statistics
    this.metrics.customDimensionStats.mostCommonAspectRatio = ratioString;
  }

  /**
   * Get available dimension presets
   */
  getAvailablePresets() {
    return {
      presets: Object.entries(this.presets).map(([key, preset]) => ({
        id: key,
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        ...preset,
        usage: this.metrics.presetUsage[key] || 0
      })),
      categories: [...new Set(Object.values(this.presets).map(p => p.category))]
    };
  }

  /**
   * Get dimension constraints and limits
   */
  getConstraints() {
    return {
      ...this.constraints,
      supportedPresets: Object.keys(this.presets).length,
      maxTotalPixels: this.constraints.maxPixels,
      maxTotalPixelsMB: (this.constraints.maxPixels * 3 / (1024 * 1024)).toFixed(1) // Rough estimate for RGB
    };
  }

  /**
   * Get processing metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 
        ? ((this.metrics.successfulProcessing / this.metrics.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      mostUsedPreset: Object.entries(this.metrics.presetUsage)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'
    };
  }

  /**
   * Health check for custom dimension handler
   */
  async healthCheck() {
    try {
      // Test dimension validation
      const testDimensions = { width: 500, height: 500 };
      this.validateCustomDimensions(testDimensions);
      
      return {
        status: 'healthy',
        metrics: this.getMetrics(),
        constraints: this.getConstraints(),
        availablePresets: Object.keys(this.presets).length
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = { CustomDimensionHandler };