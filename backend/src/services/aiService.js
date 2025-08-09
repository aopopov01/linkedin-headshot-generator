const Replicate = require('replicate');
const logger = require('../config/logger');

class AIService {
  constructor() {
    this.isDemo = process.env.ENABLE_MOCK_AI === 'true' || process.env.REPLICATE_API_TOKEN === 'demo_token';
    
    if (!this.isDemo) {
      this.replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });
    }
    
    // Model configurations for different styles
    this.styleConfigs = {
      corporate: {
        model: "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        prompt: "professional corporate headshot, business attire, clean neutral background, studio lighting, confident expression, high quality, 4K",
        negative_prompt: "blurry, low quality, distorted, unprofessional, casual clothing, messy background, poor lighting",
        num_steps: 50,
        style_strength_ratio: 20,
        guidance_scale: 5
      },
      creative: {
        model: "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        prompt: "professional creative headshot, smart casual attire, modern clean background, natural lighting, approachable friendly expression, artistic, high quality",
        negative_prompt: "blurry, low quality, distorted, too formal, stuffy, poor lighting, messy background",
        num_steps: 45,
        style_strength_ratio: 18,
        guidance_scale: 4.5
      },
      executive: {
        model: "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        prompt: "executive professional headshot, formal business suit, premium neutral background, premium studio lighting, authoritative confident expression, luxury quality",
        negative_prompt: "blurry, low quality, distorted, casual, unprofessional, poor lighting, cheap appearance",
        num_steps: 55,
        style_strength_ratio: 22,
        guidance_scale: 5.5
      },
      startup: {
        model: "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        prompt: "modern professional headshot, business casual, clean minimal background, bright natural lighting, innovative friendly expression, tech startup vibe",
        negative_prompt: "blurry, low quality, distorted, too formal, outdated, poor lighting, cluttered background",
        num_steps: 45,
        style_strength_ratio: 16,
        guidance_scale: 4
      },
      healthcare: {
        model: "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        prompt: "healthcare professional headshot, medical professional attire, clean clinical background, soft professional lighting, trustworthy caring expression",
        negative_prompt: "blurry, low quality, distorted, unprofessional, casual, poor lighting, inappropriate background",
        num_steps: 50,
        style_strength_ratio: 20,
        guidance_scale: 5
      }
    };
  }

  /**
   * Generate professional headshots using Replicate API or demo mode
   */
  async generateHeadshot(imageBase64, styleTemplate, options = {}) {
    try {
      const startTime = Date.now();
      
      if (!this.styleConfigs[styleTemplate]) {
        throw new Error(`Invalid style template: ${styleTemplate}`);
      }

      const config = this.styleConfigs[styleTemplate];
      const numOutputs = options.numOutputs || 4;

      logger.info('Starting headshot generation:', {
        styleTemplate,
        numOutputs,
        isDemo: this.isDemo,
        model: config.model
      });

      // Demo mode - return mock results
      if (this.isDemo) {
        return await this.generateDemoHeadshots(imageBase64, styleTemplate, numOutputs);
      }

      // Real Replicate API mode
      const prediction = await this.replicate.predictions.create({
        version: config.model.split(':')[1],
        input: {
          input_image: imageBase64,
          prompt: config.prompt,
          negative_prompt: config.negative_prompt,
          num_steps: config.num_steps,
          style_strength_ratio: config.style_strength_ratio,
          num_outputs: numOutputs,
          guidance_scale: config.guidance_scale,
          ...options.aiParameters
        }
      });

      logger.info('Replicate prediction created:', {
        predictionId: prediction.id,
        status: prediction.status
      });

      // Poll for completion
      let completedPrediction = await this.waitForCompletion(prediction.id);
      
      const processingTime = Math.floor((Date.now() - startTime) / 1000);

      if (completedPrediction.status === 'succeeded') {
        logger.info('Headshot generation completed:', {
          predictionId: prediction.id,
          processingTime: `${processingTime}s`,
          outputCount: completedPrediction.output?.length || 0
        });

        return {
          success: true,
          predictionId: prediction.id,
          generatedImages: completedPrediction.output || [],
          processingTime,
          metadata: {
            styleTemplate,
            model: config.model,
            parameters: {
              num_steps: config.num_steps,
              style_strength_ratio: config.style_strength_ratio,
              guidance_scale: config.guidance_scale
            }
          }
        };
      } else {
        throw new Error(`Generation failed: ${completedPrediction.error || 'Unknown error'}`);
      }

    } catch (error) {
      logger.error('Headshot generation failed:', {
        error: error.message,
        styleTemplate,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Generate demo headshots with sample images
   */
  async generateDemoHeadshots(imageBase64, styleTemplate, numOutputs = 4) {
    const startTime = Date.now();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const processingTime = Math.floor((Date.now() - startTime) / 1000);
    const predictionId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Sample professional headshot images from Unsplash (for demo purposes)
    const demoImages = {
      corporate: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=400&fit=crop&crop=face'
      ],
      creative: [
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face'
      ],
      executive: [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop&crop=face'
      ],
      startup: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1558507652-2d9626c4e67a?w=400&h=400&fit=crop&crop=face'
      ],
      healthcare: [
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=400&fit=crop&crop=face'
      ]
    };

    const styleImages = demoImages[styleTemplate] || demoImages.corporate;
    const selectedImages = styleImages.slice(0, numOutputs);

    logger.info('Demo headshot generation completed:', {
      predictionId,
      styleTemplate,
      processingTime: `${processingTime}s`,
      outputCount: selectedImages.length
    });

    return {
      success: true,
      predictionId,
      generatedImages: selectedImages,
      processingTime,
      metadata: {
        styleTemplate,
        isDemo: true,
        parameters: this.styleConfigs[styleTemplate]
      }
    };
  }

  /**
   * Wait for Replicate prediction to complete
   */
  async waitForCompletion(predictionId, maxWaitTime = 300000) { // 5 minutes max
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const prediction = await this.replicate.predictions.get(predictionId);
        
        if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
          return prediction;
        }

        logger.debug('Prediction still processing:', {
          predictionId,
          status: prediction.status,
          elapsedTime: `${Math.floor((Date.now() - startTime) / 1000)}s`
        });

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        logger.error('Error polling prediction status:', {
          predictionId,
          error: error.message
        });
        throw error;
      }
    }

    throw new Error('Generation timeout - processing took too long');
  }

  /**
   * Cancel a running prediction
   */
  async cancelGeneration(predictionId) {
    try {
      const prediction = await this.replicate.predictions.cancel(predictionId);
      
      logger.info('Generation cancelled:', { predictionId });
      
      return {
        success: true,
        predictionId,
        status: prediction.status
      };
    } catch (error) {
      logger.error('Failed to cancel generation:', {
        predictionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get prediction status and progress
   */
  async getGenerationStatus(predictionId) {
    try {
      const prediction = await this.replicate.predictions.get(predictionId);
      
      return {
        id: prediction.id,
        status: prediction.status,
        output: prediction.output,
        error: prediction.error,
        logs: prediction.logs,
        created_at: prediction.created_at,
        started_at: prediction.started_at,
        completed_at: prediction.completed_at
      };
    } catch (error) {
      logger.error('Failed to get generation status:', {
        predictionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Estimate processing cost based on style and parameters
   */
  estimateProcessingCost(styleTemplate, numOutputs = 4) {
    // Rough cost estimates based on Replicate pricing
    const baseCostPerImage = 0.0023; // ~$0.0023 per image
    const styleMutlipliers = {
      corporate: 1.0,
      creative: 0.9,
      executive: 1.2, // Higher quality settings
      startup: 0.8,
      healthcare: 1.0
    };

    const multiplier = styleMutlipliers[styleTemplate] || 1.0;
    return (baseCostPerImage * numOutputs * multiplier).toFixed(4);
  }

  /**
   * Validate image for processing
   */
  validateImage(imageBase64) {
    try {
      // Check if it's a valid base64 image
      const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid image format - must be base64 encoded');
      }

      const imageType = matches[1];
      const imageData = matches[2];

      // Check supported formats
      const supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
      if (!supportedFormats.includes(imageType.toLowerCase())) {
        throw new Error(`Unsupported image format: ${imageType}. Supported formats: ${supportedFormats.join(', ')}`);
      }

      // Estimate file size (base64 is ~33% larger than binary)
      const estimatedSize = (imageData.length * 0.75) / 1024 / 1024; // MB
      const maxSize = 10; // 10MB limit

      if (estimatedSize > maxSize) {
        throw new Error(`Image too large: ${estimatedSize.toFixed(2)}MB. Maximum size: ${maxSize}MB`);
      }

      return {
        valid: true,
        imageType,
        estimatedSizeMB: estimatedSize.toFixed(2)
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Test AI service connection
   */
  async testConnection() {
    try {
      // Test with a minimal request to verify API token
      const models = await this.replicate.models.list();
      logger.info('AI service connection test successful');
      return true;
    } catch (error) {
      logger.error('AI service connection test failed:', error.message);
      throw new Error('Failed to connect to AI service');
    }
  }

  /**
   * Get available style templates
   */
  getAvailableStyles() {
    return Object.keys(this.styleConfigs).map(style => ({
      id: style,
      name: this.formatStyleName(style),
      description: this.getStyleDescription(style),
      estimatedCost: this.estimateProcessingCost(style),
      processingTime: this.getEstimatedProcessingTime(style)
    }));
  }

  /**
   * Format style name for display
   */
  formatStyleName(style) {
    const names = {
      corporate: 'Corporate Professional',
      creative: 'Creative Professional',
      executive: 'Executive Premium',
      startup: 'Modern Startup',
      healthcare: 'Healthcare Professional'
    };
    return names[style] || style;
  }

  /**
   * Get style description
   */
  getStyleDescription(style) {
    const descriptions = {
      corporate: 'Traditional business professional look with formal attire and neutral background',
      creative: 'Modern creative professional with smart casual attire and artistic touch',
      executive: 'Premium executive style with luxury business attire and authoritative presence',
      startup: 'Contemporary tech professional with modern casual business look',
      healthcare: 'Trustworthy healthcare professional with medical industry appropriate styling'
    };
    return descriptions[style] || 'Professional headshot style';
  }

  /**
   * Get estimated processing time
   */
  getEstimatedProcessingTime(style) {
    const times = {
      corporate: '45-60 seconds',
      creative: '40-55 seconds',
      executive: '50-65 seconds', // Higher quality = longer processing
      startup: '35-50 seconds',
      healthcare: '45-60 seconds'
    };
    return times[style] || '45-60 seconds';
  }

  /**
   * Batch generate multiple styles
   */
  async generateMultipleStyles(imageBase64, styles = ['corporate', 'creative'], options = {}) {
    try {
      const results = [];
      const errors = [];

      for (const style of styles) {
        try {
          const result = await this.generateHeadshot(imageBase64, style, {
            ...options,
            numOutputs: options.numOutputsPerStyle || 2
          });
          results.push({
            style,
            ...result
          });
        } catch (error) {
          errors.push({
            style,
            error: error.message
          });
        }
      }

      return {
        success: results.length > 0,
        results,
        errors: errors.length > 0 ? errors : undefined,
        totalProcessingCost: this.calculateBatchCost(styles, options.numOutputsPerStyle || 2)
      };
    } catch (error) {
      logger.error('Batch generation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate cost for batch processing
   */
  calculateBatchCost(styles, numOutputsPerStyle) {
    return styles.reduce((total, style) => {
      return total + parseFloat(this.estimateProcessingCost(style, numOutputsPerStyle));
    }, 0).toFixed(4);
  }
}

module.exports = new AIService();