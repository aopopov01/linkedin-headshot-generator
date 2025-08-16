/**
 * Intelligent Image Processor
 * AI-powered image enhancement and analysis service
 * Handles advanced image processing with machine learning integration
 */

const sharp = require('sharp');

class IntelligentImageProcessor {
  constructor() {
    // AI processing configuration
    this.config = {
      maxProcessingTime: 30000, // 30 seconds
      fallbackToLocal: true,
      enhancementStrength: 0.8,
      qualityThreshold: 0.85
    };

    // Processing metrics
    this.metrics = {
      totalProcessed: 0,
      successfulEnhancements: 0,
      failedEnhancements: 0,
      averageProcessingTime: 0,
      aiProviderStats: {}
    };

    // Supported AI providers
    this.aiProviders = {
      replicate: {
        name: 'Replicate',
        available: false,
        endpoint: 'https://api.replicate.com/v1/predictions',
        models: {
          professional: 'tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4',
          creative: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
          tech: 'lucataco/realistic-vision-v5:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e50'
        }
      },
      openai: {
        name: 'OpenAI DALL-E',
        available: false,
        endpoint: 'https://api.openai.com/v1/images/edits'
      },
      local: {
        name: 'Local Processing',
        available: true,
        fallback: true
      }
    };

    this.initializeAIProviders();
  }

  /**
   * Initialize AI providers based on available API keys
   */
  async initializeAIProviders() {
    try {
      // Check for Replicate API key
      if (process.env.REPLICATE_API_TOKEN) {
        this.aiProviders.replicate.available = true;
        this.aiProviders.replicate.apiKey = process.env.REPLICATE_API_TOKEN;
        console.log('✅ Replicate AI provider initialized');
      }

      // Check for OpenAI API key
      if (process.env.OPENAI_API_KEY) {
        this.aiProviders.openai.available = true;
        this.aiProviders.openai.apiKey = process.env.OPENAI_API_KEY;
        console.log('✅ OpenAI provider initialized');
      }

      console.log('🤖 Intelligent Image Processor initialized');
      console.log(`🔧 Available AI providers: ${this.getAvailableProviders().join(', ')}`);

    } catch (error) {
      console.warn('⚠️ AI provider initialization failed:', error.message);
      console.log('📍 Falling back to local processing only');
    }
  }

  /**
   * Analyze image characteristics and metadata
   */
  async analyzeImage(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const stats = await sharp(imageBuffer).stats();

      // Basic image analysis
      const analysis = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        colorspace: metadata.space,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        size: imageBuffer.length,
        aspectRatio: (metadata.width / metadata.height).toFixed(2),

        // Color analysis
        brightness: this.calculateBrightness(stats),
        contrast: this.calculateContrast(stats),
        saturation: this.calculateSaturation(stats),

        // Quality indicators
        sharpness: await this.estimateSharpness(imageBuffer),
        noise: await this.estimateNoise(imageBuffer),
        compression: this.estimateCompressionArtifacts(metadata, imageBuffer.length),

        // Professional photo indicators
        isPortrait: this.detectPortraitOrientation(metadata),
        faceRegion: await this.detectFaceRegion(imageBuffer),
        backgroundType: await this.analyzeBackground(imageBuffer),

        // Processing recommendations
        recommendedEnhancements: []
      };

      // Generate enhancement recommendations
      analysis.recommendedEnhancements = this.generateEnhancementRecommendations(analysis);

      console.log(`🔍 Image analysis complete: ${analysis.width}x${analysis.height}, quality score: ${this.calculateQualityScore(analysis)}`);

      return analysis;

    } catch (error) {
      console.error('❌ Image analysis failed:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  /**
   * Enhance image with AI processing
   */
  async enhanceWithAI(imageBuffer, prompt, platform, aiProvider = 'auto') {
    const startTime = Date.now();
    
    try {
      console.log(`✨ Starting AI enhancement for ${platform} using ${aiProvider} provider`);

      // Auto-select provider if not specified
      if (aiProvider === 'auto') {
        aiProvider = this.selectOptimalProvider(platform);
      }

      let enhancedImage;

      // Try AI enhancement with selected provider
      if (aiProvider !== 'local' && this.aiProviders[aiProvider]?.available) {
        try {
          enhancedImage = await this.processWithAIProvider(imageBuffer, prompt, platform, aiProvider);
          this.metrics.successfulEnhancements++;
          console.log(`✅ AI enhancement successful with ${aiProvider}`);
        } catch (aiError) {
          console.warn(`⚠️ AI provider ${aiProvider} failed, falling back to local processing:`, aiError.message);
          enhancedImage = await this.processLocally(imageBuffer, prompt, platform);
          this.metrics.failedEnhancements++;
        }
      } else {
        // Use local processing
        enhancedImage = await this.processLocally(imageBuffer, prompt, platform);
        console.log('🔧 Using local image processing');
      }

      const processingTime = Date.now() - startTime;
      this.updateMetrics(aiProvider, processingTime);

      return enhancedImage;

    } catch (error) {
      console.error('❌ AI enhancement failed:', error);
      this.metrics.failedEnhancements++;
      throw new Error(`AI enhancement failed: ${error.message}`);
    }
  }

  /**
   * Process image with AI provider
   */
  async processWithAIProvider(imageBuffer, prompt, platform, provider) {
    const providerConfig = this.aiProviders[provider];
    
    switch (provider) {
      case 'replicate':
        return await this.processWithReplicate(imageBuffer, prompt, platform, providerConfig);
      
      case 'openai':
        return await this.processWithOpenAI(imageBuffer, prompt, platform, providerConfig);
        
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Process image with Replicate API
   */
  async processWithReplicate(imageBuffer, prompt, platform, config) {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      
      // Select appropriate model based on style
      const modelVersion = config.models.professional; // Default to professional
      
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: modelVersion,
          input: {
            image: `data:image/jpeg;base64,${base64Image}`,
            prompt: prompt,
            strength: this.config.enhancementStrength,
            guidance_scale: 7.5,
            num_inference_steps: 20
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
      }

      const prediction = await response.json();
      
      // Poll for completion
      const result = await this.pollReplicateResult(prediction.id, config.apiKey);
      
      // Download and return processed image
      if (result.output && result.output[0]) {
        const imageResponse = await fetch(result.output[0]);
        const processedBuffer = Buffer.from(await imageResponse.arrayBuffer());
        return processedBuffer;
      } else {
        throw new Error('No output from Replicate processing');
      }

    } catch (error) {
      console.error('❌ Replicate processing failed:', error);
      throw error;
    }
  }

  /**
   * Poll Replicate for result
   */
  async pollReplicateResult(predictionId, apiKey, maxAttempts = 30) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: {
            'Authorization': `Token ${apiKey}`
          }
        });

        const result = await response.json();

        if (result.status === 'succeeded') {
          return result;
        } else if (result.status === 'failed') {
          throw new Error(`Replicate prediction failed: ${result.error}`);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        if (attempt === maxAttempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Replicate processing timeout');
  }

  /**
   * Process image with OpenAI
   */
  async processWithOpenAI(imageBuffer, prompt, platform, config) {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('image', imageBuffer, { filename: 'image.png' });
      form.append('prompt', prompt);
      form.append('size', '1024x1024');
      form.append('n', 1);

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          ...form.getHeaders()
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.data && result.data[0] && result.data[0].url) {
        const imageResponse = await fetch(result.data[0].url);
        const processedBuffer = Buffer.from(await imageResponse.arrayBuffer());
        return processedBuffer;
      } else {
        throw new Error('No output from OpenAI processing');
      }

    } catch (error) {
      console.error('❌ OpenAI processing failed:', error);
      throw error;
    }
  }

  /**
   * Process image locally with advanced algorithms
   */
  async processLocally(imageBuffer, prompt, platform) {
    try {
      console.log(`🔧 Local processing for ${platform}`);
      
      // Analyze image first
      const analysis = await this.analyzeImage(imageBuffer);
      
      let pipeline = sharp(imageBuffer);
      
      // Apply enhancements based on analysis
      for (const enhancement of analysis.recommendedEnhancements) {
        pipeline = await this.applyEnhancement(pipeline, enhancement, platform);
      }

      // Platform-specific optimizations
      pipeline = await this.applyPlatformSpecificEnhancements(pipeline, platform);

      return await pipeline.toBuffer();

    } catch (error) {
      console.error('❌ Local processing failed:', error);
      throw error;
    }
  }

  /**
   * Apply individual enhancement to image pipeline
   */
  async applyEnhancement(pipeline, enhancement, platform) {
    switch (enhancement.type) {
      case 'brightness':
        return pipeline.modulate({ brightness: enhancement.value });
        
      case 'contrast':
        return pipeline.linear(enhancement.value, 0);
        
      case 'saturation':
        return pipeline.modulate({ saturation: enhancement.value });
        
      case 'sharpening':
        return pipeline.sharpen({ 
          sigma: enhancement.sigma || 1.0,
          m1: enhancement.m1 || 1.0,
          m2: enhancement.m2 || 2.0
        });
        
      case 'noise_reduction':
        return pipeline.blur(enhancement.radius || 0.3);
        
      case 'color_correction':
        return pipeline.modulate({
          brightness: enhancement.brightness || 1.0,
          saturation: enhancement.saturation || 1.0,
          hue: enhancement.hue || 0
        });
        
      default:
        console.warn(`⚠️ Unknown enhancement type: ${enhancement.type}`);
        return pipeline;
    }
  }

  /**
   * Apply platform-specific enhancements
   */
  async applyPlatformSpecificEnhancements(pipeline, platform) {
    switch (platform) {
      case 'linkedin':
        // Professional: slight contrast boost, professional colors
        return pipeline
          .modulate({ brightness: 1.02, saturation: 1.05 })
          .sharpen({ sigma: 0.5, m1: 1.0, m2: 1.5 });
        
      case 'instagram':
        // Social: vibrant colors, higher contrast
        return pipeline
          .modulate({ brightness: 1.05, saturation: 1.15 })
          .linear(1.1, 0);
        
      case 'facebook':
        // Balanced: friendly appearance
        return pipeline
          .modulate({ brightness: 1.03, saturation: 1.08 });
        
      case 'twitter':
        // Clear: optimized for small sizes
        return pipeline
          .sharpen({ sigma: 1.0, m1: 1.2, m2: 2.0 });
        
      default:
        return pipeline;
    }
  }

  /**
   * Generate enhancement recommendations based on analysis
   */
  generateEnhancementRecommendations(analysis) {
    const recommendations = [];

    // Brightness recommendations
    if (analysis.brightness < 0.4) {
      recommendations.push({
        type: 'brightness',
        value: 1.2,
        priority: 'high',
        reason: 'Image appears too dark'
      });
    } else if (analysis.brightness > 0.8) {
      recommendations.push({
        type: 'brightness',
        value: 0.9,
        priority: 'medium',
        reason: 'Image appears overexposed'
      });
    }

    // Contrast recommendations
    if (analysis.contrast < 0.3) {
      recommendations.push({
        type: 'contrast',
        value: 1.3,
        priority: 'high',
        reason: 'Low contrast detected'
      });
    }

    // Sharpness recommendations
    if (analysis.sharpness < 0.5) {
      recommendations.push({
        type: 'sharpening',
        sigma: 1.0,
        m1: 1.2,
        m2: 2.0,
        priority: 'medium',
        reason: 'Image appears soft'
      });
    }

    // Noise reduction recommendations
    if (analysis.noise > 0.6) {
      recommendations.push({
        type: 'noise_reduction',
        radius: 0.5,
        priority: 'medium',
        reason: 'High noise level detected'
      });
    }

    return recommendations;
  }

  /**
   * Helper functions for image analysis
   */
  calculateBrightness(stats) {
    const channels = stats.channels;
    const avgBrightness = channels.reduce((sum, channel) => sum + channel.mean, 0) / channels.length;
    return avgBrightness / 255;
  }

  calculateContrast(stats) {
    const channels = stats.channels;
    const maxStdDev = Math.max(...channels.map(channel => Math.sqrt(channel.squareSum / (channel.sum || 1))));
    return Math.min(maxStdDev / 128, 1);
  }

  calculateSaturation(stats) {
    if (stats.channels.length < 3) return 0;
    const [r, g, b] = stats.channels;
    const max = Math.max(r.mean, g.mean, b.mean);
    const min = Math.min(r.mean, g.mean, b.mean);
    return max > 0 ? (max - min) / max : 0;
  }

  async estimateSharpness(imageBuffer) {
    try {
      const { data } = await sharp(imageBuffer)
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // Simple Laplacian variance for sharpness estimation
      let variance = 0;
      const length = data.length;
      
      for (let i = 1; i < length - 1; i++) {
        const laplacian = Math.abs(2 * data[i] - data[i - 1] - data[i + 1]);
        variance += laplacian * laplacian;
      }
      
      return Math.min(variance / length / 10000, 1);
    } catch (error) {
      return 0.5; // Default moderate sharpness
    }
  }

  async estimateNoise(imageBuffer) {
    try {
      const stats = await sharp(imageBuffer).stats();
      const avgStdDev = stats.channels.reduce((sum, ch) => sum + Math.sqrt(ch.squareSum / (ch.sum || 1)), 0) / stats.channels.length;
      return Math.min(avgStdDev / 50, 1);
    } catch (error) {
      return 0.3; // Default low noise
    }
  }

  estimateCompressionArtifacts(metadata, bufferLength) {
    const expectedSize = metadata.width * metadata.height * (metadata.channels || 3);
    const compressionRatio = bufferLength / expectedSize;
    return compressionRatio < 0.1 ? 0.8 : compressionRatio < 0.3 ? 0.5 : 0.2;
  }

  detectPortraitOrientation(metadata) {
    return metadata.height > metadata.width;
  }

  async detectFaceRegion(imageBuffer) {
    // Simplified face detection - would use actual face detection library in production
    const metadata = await sharp(imageBuffer).metadata();
    return {
      detected: true, // Assume face is present for professional photos
      confidence: 0.8,
      region: {
        x: Math.round(metadata.width * 0.3),
        y: Math.round(metadata.height * 0.2),
        width: Math.round(metadata.width * 0.4),
        height: Math.round(metadata.height * 0.5)
      }
    };
  }

  async analyzeBackground(imageBuffer) {
    // Simplified background analysis
    return {
      type: 'neutral',
      complexity: 'medium',
      dominantColor: '#f0f0f0',
      suggestion: 'professional'
    };
  }

  calculateQualityScore(analysis) {
    let score = 50;
    
    // Brightness score
    if (analysis.brightness >= 0.4 && analysis.brightness <= 0.7) score += 15;
    else if (analysis.brightness >= 0.3 && analysis.brightness <= 0.8) score += 10;
    else score += 5;
    
    // Contrast score
    if (analysis.contrast >= 0.4) score += 15;
    else if (analysis.contrast >= 0.3) score += 10;
    else score += 5;
    
    // Sharpness score
    if (analysis.sharpness >= 0.6) score += 15;
    else if (analysis.sharpness >= 0.4) score += 10;
    else score += 5;
    
    // Noise penalty
    if (analysis.noise < 0.3) score += 5;
    else if (analysis.noise > 0.6) score -= 5;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Select optimal AI provider based on platform and availability
   */
  selectOptimalProvider(platform) {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.includes('replicate')) {
      return 'replicate';
    } else if (availableProviders.includes('openai')) {
      return 'openai';
    } else {
      return 'local';
    }
  }

  /**
   * Get list of available AI providers
   */
  getAvailableProviders() {
    return Object.entries(this.aiProviders)
      .filter(([name, config]) => config.available)
      .map(([name]) => name);
  }

  /**
   * Update processing metrics
   */
  updateMetrics(provider, processingTime) {
    this.metrics.totalProcessed++;
    
    // Update average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalProcessed - 1) + processingTime;
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalProcessed;
    
    // Update provider stats
    if (!this.metrics.aiProviderStats[provider]) {
      this.metrics.aiProviderStats[provider] = { used: 0, avgTime: 0 };
    }
    
    const providerStats = this.metrics.aiProviderStats[provider];
    providerStats.used++;
    providerStats.avgTime = ((providerStats.avgTime * (providerStats.used - 1)) + processingTime) / providerStats.used;
  }

  /**
   * Get processing metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalProcessed > 0 
        ? ((this.metrics.successfulEnhancements / this.metrics.totalProcessed) * 100).toFixed(2) + '%'
        : '0%',
      availableProviders: this.getAvailableProviders()
    };
  }

  /**
   * Health check for the image processor
   */
  async healthCheck() {
    try {
      // Test basic image processing with a valid 1x1 PNG
      const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      
      // Test Sharp processing capabilities
      const processedBuffer = await sharp(testBuffer)
        .resize(100, 100)
        .png()
        .toBuffer();
      
      // Verify buffer was created successfully
      if (!processedBuffer || processedBuffer.length === 0) {
        throw new Error('Image processing test failed - empty output');
      }
      
      return {
        status: 'healthy',
        availableProviders: this.getAvailableProviders(),
        metrics: this.getMetrics(),
        configuration: {
          maxProcessingTime: `${this.config.maxProcessingTime / 1000}s`,
          fallbackEnabled: this.config.fallbackToLocal,
          enhancementStrength: this.config.enhancementStrength
        },
        testResults: {
          sharpProcessing: 'passed',
          outputSize: processedBuffer.length,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Image processor health check failed:', error);
      
      // Return detailed error information for debugging
      return {
        status: 'unhealthy',
        error: error.message,
        errorDetails: {
          stack: error.stack,
          timestamp: new Date().toISOString(),
          sharpAvailable: typeof sharp !== 'undefined',
          nodeVersion: process.version
        }
      };
    }
  }
}

module.exports = { IntelligentImageProcessor };