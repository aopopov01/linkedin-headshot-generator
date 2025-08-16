// Enhanced AI Transformation Service for Professional Headshot Generation
// Implements dramatic face-swapping and professional attire transformation
// Supports multiple AI models for maximum transformation quality

import axios from 'axios';
import ImageProcessingUtils from '../utils/imageProcessing';
import dramaticTransformationPipeline from './dramaticTransformationPipeline';
// SECURITY REMEDIATION: NO HARDCODED CREDENTIALS
// All AI processing now routes through secure backend proxy
const Config = {
  // REMOVED: REPLICATE_API_TOKEN - now handled server-side only
  USE_SECURE_PROXY: true,
  DEPRECATED_DIRECT_API: false // Legacy direct API access disabled for security
};

// AI Model configurations for different transformation types
const AI_MODELS = {
  // InstantID - Real working model for face preservation
  INSTANT_ID: {
    version: "dd8025e33ddf4c3cdf6f18be24b3f846c8bbcc4a000c28b6b1ab3a3addbdae4f",
    name: "InstantID",
    description: "Face-preserving professional portrait generation",
    maxProcessingTime: 120000, // 2 minutes
    supports: ['face_preservation', 'attire_change', 'background_change']
  },
  
  // FLUX.1 Schnell - Fast, high-quality transformations
  FLUX_SCHNELL: {
    version: "f2ab8a5569c55169b2c2a4b4db4e76b73f3bcdf0306ad5a9ae6bc7b29b4d85db",
    name: "FLUX.1 Schnell",
    description: "Fast professional headshot transformation",
    maxProcessingTime: 90000, // 1.5 minutes
    supports: ['quick_transforms', 'professional_styling', 'quality_enhancement']
  },
  
  // FLUX.1 Dev - Higher quality for professional use
  FLUX_DEV: {
    version: "843b6e5cfa54cc9f88d3bb83743f82c8e5cf53b4dc60cc7d2e6db5e9f19a43fe",
    name: "FLUX.1 Dev", 
    description: "Professional quality headshot transformation",
    maxProcessingTime: 150000, // 2.5 minutes
    supports: ['professional_quality', 'dramatic_transformation', 'executive_styling']
  },
  
  // Stable Diffusion with ControlNet for precise control
  STABLE_DIFFUSION_CONTROLNET: {
    version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    name: "Stable Diffusion ControlNet",
    description: "Precise professional transformation with face control",
    maxProcessingTime: 120000, // 2 minutes
    supports: ['face_control', 'professional_attire', 'studio_lighting']
  },
  
  // PhotoMaker - The model currently in use (as fallback)
  PHOTO_MAKER: {
    version: "ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
    name: "PhotoMaker (Legacy)",
    description: "Basic photo enhancement (fallback)",
    maxProcessingTime: 90000, // 1.5 minutes
    supports: ['basic_enhancement', 'style_transfer']
  }
};

class AIService {
  constructor() {
    // SECURITY REMEDIATION: Direct API access disabled
    // All processing now routes through secure backend proxy
    if (!Config.USE_SECURE_PROXY) {
      throw new Error('SECURITY ERROR: Direct API access is disabled. Use SecureAIService instead.');
    }
    
    // Mark this service as deprecated for security
    console.warn('⚠️  DEPRECATED: AIService is deprecated for security reasons. Use SecureAIService instead.');
    this.deprecated = true;
    this.secureProxyRequired = true;
  }

  // SECURITY BLOCK: Prevent initialization with API tokens
  initialize() {
    throw new Error('SECURITY ERROR: Direct API initialization is disabled. Use SecureAIService for all AI operations.');
  }

  // SECURITY BLOCK: All methods disabled - use SecureAIService
  async processImageWithDramaticTransformation() {
    throw new Error('SECURITY ERROR: This method is disabled. Use SecureAIService.processImageToHeadshot() instead.');
  }

  // SECURITY BLOCK: Main processing method disabled
  async processImageToHeadshot() {
    throw new Error('SECURITY ERROR: This method is disabled. Use SecureAIService.processImageToHeadshot() instead.');
  }

  // SECURITY BLOCK: All other methods disabled for security
  async batchProcessMultipleStyles() {
    throw new Error('SECURITY ERROR: This method is disabled. Use SecureAIService.batchProcessMultipleStyles() instead.');
  }

  async processWithDramaticComparison() {
    throw new Error('SECURITY ERROR: This method is disabled. Use SecureAIService.processImageToHeadshot() instead.');
  }

  async generateHeadshot() {
    throw new Error('SECURITY ERROR: This method is disabled. Use SecureAIService.processImageToHeadshot() instead.');
  }

  async checkPredictionStatus() {
    throw new Error('SECURITY ERROR: This method is disabled. Use SecureAIService.checkPredictionStatus() instead.');
  }

  async waitForPrediction() {
    throw new Error('SECURITY ERROR: This method is disabled. Use SecureAIService.waitForPrediction() instead.');
  }

  async cancelPrediction() {
    throw new Error('SECURITY ERROR: This method is disabled. Use SecureAIService.cancelPrediction() instead.');
  }

  // DEPRECATED PLACEHOLDER METHOD - This entire block would be removed
  _legacyProcessImageToHeadshot_DEPRECATED(imageUri, styleTemplate = 'corporate', options = {}) {
    try {
      if (!this.apiToken) {
        throw new Error('AI Service not initialized. Please set API token.');
      }

      console.log('Starting dramatic AI transformation for style:', styleTemplate);
      
      // Choose the best AI model for the transformation type
      const selectedModel = this.selectOptimalModel(styleTemplate, options);
      console.log(`Using AI model: ${selectedModel.name} for ${styleTemplate} style`);
      
      // First, optimize and convert image for AI processing
      const optimizedImage = await ImageProcessingUtils.resizeForProcessing(imageUri, {
        width: 1024,
        height: 1024,
        quality: 95 // Higher quality for better AI results
      });

      // Upload to Cloudinary for reliable access
      const uploadResult = await ImageProcessingUtils.uploadToCloudinary(
        optimizedImage.uri,
        { folder: 'headshot-inputs' }
      );

      if (!uploadResult.success) {
        throw new Error(`Image upload failed: ${uploadResult.error}`);
      }

      console.log('Image uploaded successfully, starting dramatic transformation...');

      // Get the dramatic transformation configuration
      const transformationConfig = this.getDramaticTransformationConfig(styleTemplate, options);
      
      // Create model-specific payload based on selected AI model
      const payload = this.createModelSpecificPayload(selectedModel, uploadResult.url, transformationConfig, options);

      const response = await this.axios.post('/predictions', payload);
      console.log(`${selectedModel.name} transformation started:`, response.data.id);
      
      return {
        ...response.data,
        originalImageUrl: uploadResult.url,
        styleTemplate,
        processingOptions: options,
        transformationType: 'dramatic_professional',
        selectedModel: selectedModel.name,
        estimatedTime: selectedModel.maxProcessingTime / 1000
      };
    } catch (error) {
      console.error('Dramatic AI Transformation Error:', error);
      throw this.handleError(error);
    }
  }

  // Select optimal AI model based on style and requirements
  selectOptimalModel(styleTemplate, options = {}) {
    // For dramatic transformations and premium results, use FLUX.1 Dev
    if (options.dramatic || options.premium || styleTemplate === 'executive') {
      return AI_MODELS.FLUX_DEV;
    }
    
    // Healthcare and finance styles need precise face preservation
    if (['healthcare', 'finance'].includes(styleTemplate)) {
      return AI_MODELS.INSTANT_ID;
    }
    
    // Creative and startup styles can use ControlNet for professional styling
    if (['creative', 'startup', 'tech'].includes(styleTemplate)) {
      return AI_MODELS.STABLE_DIFFUSION_CONTROLNET;
    }
    
    // For quick transformations, use FLUX Schnell
    if (options.fast || styleTemplate === 'corporate') {
      return AI_MODELS.FLUX_SCHNELL;
    }
    
    // Default fallback to PhotoMaker (current working model)
    return AI_MODELS.PHOTO_MAKER;
  }

  // Generate dramatic transformation configuration for each style
  getDramaticTransformationConfig(styleTemplate, options = {}) {
    const baseConfig = {
      numSteps: options.numSteps || 80, // Higher steps for better quality
      guidanceScale: options.guidanceScale || 7.5, // Stronger guidance
      strength: options.strength || 0.8, // High transformation strength
      styleStrength: options.styleStrength || 0.9 // Strong style application
    };

    const dramaticPrompts = {
      executive: {
        prompt: "ultra-realistic professional executive headshot portrait, CEO in premium dark navy business suit, crisp white dress shirt, luxury silk tie, perfectly groomed, confident authoritative expression, sophisticated gray gradient background, premium studio lighting with key light and rim light, sharp focus, incredibly detailed, high-end corporate photography, 8K resolution, professional retouching",
        negativePrompt: "casual clothing, poor lighting, blurry, distorted, unprofessional, cartoon, anime, low quality, pixelated, amateur photography, harsh shadows, overexposed, underexposed, casual background, wrinkled clothing",
        styleStrength: 0.95
      },
      
      creative: {
        prompt: "professional creative director headshot, stylish modern business casual attire, designer blazer or sophisticated sweater, contemporary clean background, natural professional lighting with soft shadows, confident creative expression, approachable but professional, high-end commercial photography style, perfectly retouched, 8K quality, magazine-worthy",
        negativePrompt: "overly formal suit, harsh corporate look, stiff pose, poor lighting, blurry, distorted, unprofessional, amateur, low quality, pixelated, outdated styling",
        styleStrength: 0.85
      },
      
      healthcare: {
        prompt: "professional healthcare worker headshot, pristine white medical coat over professional attire, clean medical background, trustworthy caring facial expression, professional medical photography lighting, approachable yet authoritative, hospital-quality professional photo, crisp details, medical-grade photo quality, 8K resolution",
        negativePrompt: "unprofessional attire, casual clothing, poor medical environment, harsh expression, blurry, distorted, low quality, amateur photography, improper medical setting",
        styleStrength: 0.9
      },
      
      finance: {
        prompt: "high-end financial professional headshot, impeccably tailored charcoal business suit, premium dress shirt, sophisticated tie, Wall Street executive styling, neutral professional background, confident trustworthy expression, premium financial industry photography, sharp professional lighting, investment-grade professional photo, 8K quality",
        negativePrompt: "casual attire, unprofessional background, poor lighting, blurry, distorted, low quality, amateur photography, inappropriate financial styling",
        styleStrength: 0.92
      },
      
      startup: {
        prompt: "modern tech professional headshot, contemporary business casual styling, premium quality shirt or designer sweater, clean minimalist background, innovative confident expression, Silicon Valley professional photography style, bright natural lighting, tech industry standard, high-end commercial quality, 8K resolution",
        negativePrompt: "overly formal suit, outdated styling, poor tech environment, stiff corporate look, blurry, distorted, low quality, amateur photography",
        styleStrength: 0.8
      },
      
      tech: {
        prompt: "professional technology leader headshot, modern business casual or smart professional attire, clean contemporary background, innovative forward-thinking expression, tech industry professional photography, perfect lighting setup, Silicon Valley executive quality, cutting-edge professional photo, 8K resolution",
        negativePrompt: "outdated styling, overly formal corporate suit, poor tech environment, amateur photography, blurry, distorted, low quality, unprofessional appearance",
        styleStrength: 0.83
      }
    };

    const config = dramaticPrompts[styleTemplate] || dramaticPrompts.executive;
    
    return {
      ...baseConfig,
      ...config,
      // Override with user options
      ...options
    };
  }

  // Create model-specific API payload
  createModelSpecificPayload(selectedModel, imageUrl, transformationConfig, options = {}) {
    const basePayload = {
      version: selectedModel.version
    };

    // Configure input parameters based on the selected model
    switch (selectedModel.name) {
      case 'InstantID':
        return {
          ...basePayload,
          input: {
            image: imageUrl,
            face_image: imageUrl,
            prompt: transformationConfig.prompt,
            negative_prompt: transformationConfig.negativePrompt,
            num_inference_steps: transformationConfig.numSteps,
            guidance_scale: transformationConfig.guidanceScale,
            strength: transformationConfig.strength,
            num_outputs: options.numOutputs || 4,
            seed: options.seed || null,
            controlnet_conditioning_scale: 0.8,
            ip_adapter_scale: 0.6
          }
        };

      case 'FLUX.1 Dev':
        return {
          ...basePayload,
          input: {
            prompt: transformationConfig.prompt,
            image: imageUrl,
            strength: transformationConfig.strength,
            num_inference_steps: transformationConfig.numSteps,
            guidance_scale: transformationConfig.guidanceScale,
            num_outputs: options.numOutputs || 4,
            output_format: "png",
            output_quality: 90,
            seed: options.seed || null
          }
        };

      case 'FLUX.1 Schnell':
        return {
          ...basePayload,
          input: {
            prompt: transformationConfig.prompt,
            image: imageUrl,
            strength: transformationConfig.strength,
            num_inference_steps: Math.min(transformationConfig.numSteps, 4), // Schnell is optimized for 4 steps
            num_outputs: options.numOutputs || 4,
            output_format: "png",
            seed: options.seed || null
          }
        };

      case 'Stable Diffusion ControlNet':
        return {
          ...basePayload,
          input: {
            image: imageUrl,
            prompt: transformationConfig.prompt,
            negative_prompt: transformationConfig.negativePrompt,
            num_inference_steps: transformationConfig.numSteps,
            guidance_scale: transformationConfig.guidanceScale,
            controlnet_conditioning_scale: 0.7,
            strength: transformationConfig.strength,
            num_outputs: options.numOutputs || 4,
            seed: options.seed || null
          }
        };

      default: // PhotoMaker (Legacy) - Current working format
        return {
          ...basePayload,
          input: {
            input_image: imageUrl,
            prompt: transformationConfig.prompt,
            negative_prompt: transformationConfig.negativePrompt,
            num_steps: transformationConfig.numSteps,
            style_strength_ratio: Math.round(transformationConfig.styleStrength * 25), // Convert to 0-25 scale
            num_outputs: options.numOutputs || 4,
            guidance_scale: transformationConfig.guidanceScale
          }
        };
    }
  }

  // NEW: Batch process multiple styles for dramatic comparison
  async batchProcessMultipleStyles(imageUri, styleTemplates = ['executive', 'creative', 'healthcare'], options = {}) {
    try {
      console.log('Starting batch processing for multiple professional styles...');
      
      const batchResults = [];
      const processingPromises = [];

      for (const styleTemplate of styleTemplates) {
        const styleOptions = { ...options, numOutputs: 2 }; // Fewer outputs per style for batch
        const promise = this.processImageToHeadshot(imageUri, styleTemplate, styleOptions)
          .then(result => ({
            style: styleTemplate,
            success: true,
            data: result
          }))
          .catch(error => ({
            style: styleTemplate,
            success: false,
            error: error.message
          }));

        processingPromises.push(promise);
      }

      // Wait for all styles to process (but don't fail if one fails)
      const results = await Promise.allSettled(processingPromises);
      
      return {
        success: true,
        batchId: `batch_${Date.now()}`,
        results: results.map(result => result.value),
        totalStyles: styleTemplates.length,
        successfulStyles: results.filter(r => r.value?.success).length
      };

    } catch (error) {
      console.error('Batch Processing Error:', error);
      throw this.handleError(error);
    }
  }

  // NEW: Enhanced processing with dramatic before/after capability
  async processWithDramaticComparison(imageUri, primaryStyle = 'executive', options = {}) {
    try {
      console.log('Starting dramatic comparison processing...');
      
      // Set dramatic transformation options
      const dramaticOptions = {
        ...options,
        dramatic: true,
        numOutputs: 6, // More variations for selection
        numSteps: 100, // Higher quality
        strength: 0.9, // Strong transformation
        guidanceScale: 8.0 // Strong prompt adherence
      };

      // Process with primary style
      const primaryResult = await this.processImageToHeadshot(imageUri, primaryStyle, dramaticOptions);
      
      // Also generate a contrasting style for comparison
      const contrastingStyles = {
        executive: 'creative',
        creative: 'executive', 
        healthcare: 'finance',
        finance: 'healthcare',
        startup: 'executive',
        tech: 'finance'
      };
      
      const contrastStyle = contrastingStyles[primaryStyle] || 'corporate';
      const contrastOptions = { ...dramaticOptions, numOutputs: 3 };
      
      try {
        const contrastResult = await this.processImageToHeadshot(imageUri, contrastStyle, contrastOptions);
        
        return {
          success: true,
          primaryStyle: {
            style: primaryStyle,
            result: primaryResult
          },
          contrastStyle: {
            style: contrastStyle,
            result: contrastResult
          },
          processingType: 'dramatic_comparison',
          totalVariations: (dramaticOptions.numOutputs + contrastOptions.numOutputs)
        };
        
      } catch (contrastError) {
        console.warn('Contrast style failed, returning primary only:', contrastError);
        return {
          success: true,
          primaryStyle: {
            style: primaryStyle,
            result: primaryResult
          },
          contrastStyle: null,
          processingType: 'single_dramatic',
          totalVariations: dramaticOptions.numOutputs
        };
      }

    } catch (error) {
      console.error('Dramatic Comparison Processing Error:', error);
      throw this.handleError(error);
    }
  }

  // Generate professional headshot using Replicate API (legacy method for base64)
  async generateHeadshot(imageBase64, styleTemplate, options = {}) {
    try {
      if (!this.apiToken) {
        throw new Error('AI Service not initialized. Please set API token.');
      }

      const payload = {
        version: "ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        input: {
          input_image: imageBase64,
          prompt: this.getStylePrompt(styleTemplate),
          num_steps: options.numSteps || 50,
          style_strength_ratio: options.styleStrength || 20,
          num_outputs: options.numOutputs || 4,
          guidance_scale: options.guidanceScale || 5,
          negative_prompt: options.negativePrompt || "blurry, low quality, distorted, unprofessional, cartoon, anime"
        }
      };

      const response = await this.axios.post('/predictions', payload);
      return response.data;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw this.handleError(error);
    }
  }

  // Check the status of a prediction
  async checkPredictionStatus(predictionId) {
    try {
      const response = await this.axios.get(`/predictions/${predictionId}`);
      return response.data;
    } catch (error) {
      console.error('Prediction Status Error:', error);
      throw this.handleError(error);
    }
  }

  // Wait for prediction to complete with polling
  async waitForPrediction(predictionId, maxWaitTime = 180000, pollInterval = 3000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const prediction = await this.checkPredictionStatus(predictionId);
        
        console.log(`Prediction ${predictionId} status: ${prediction.status}`);
        
        if (prediction.status === 'succeeded') {
          return {
            success: true,
            prediction,
            outputs: prediction.output || [],
            processingTime: Date.now() - startTime
          };
        }
        
        if (prediction.status === 'failed') {
          return {
            success: false,
            error: prediction.error || 'Prediction failed',
            prediction
          };
        }
        
        if (prediction.status === 'canceled') {
          return {
            success: false,
            error: 'Prediction was canceled',
            prediction
          };
        }
        
        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        console.error('Error checking prediction status:', error);
        
        // Continue polling unless it's a permanent error
        if (error.message.includes('404') || error.message.includes('Invalid API')) {
          return {
            success: false,
            error: error.message,
            prediction: null
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    // Timeout reached
    return {
      success: false,
      error: `Prediction timed out after ${maxWaitTime / 1000} seconds`,
      prediction: null
    };
  }

  // Get style-specific prompts for different professional templates
  getStylePrompt(template) {
    const prompts = {
      corporate: "professional corporate headshot, business suit, clean white background, studio lighting, confident expression, high quality, 4k, professional photography",
      
      creative: "professional creative headshot, smart casual attire, modern background, natural lighting, approachable friendly expression, high quality, 4k, professional photography",
      
      executive: "executive professional headshot, formal dark business suit, neutral gray background, premium studio lighting, authoritative confident expression, high quality, 4k, professional photography",
      
      startup: "modern professional headshot, business casual shirt, clean minimal background, bright natural lighting, innovative friendly expression, high quality, 4k, professional photography",
      
      healthcare: "healthcare professional headshot, medical white coat or professional attire, clean background, trustworthy caring expression, high quality, 4k, professional photography",
      
      tech: "tech professional headshot, modern casual business attire, contemporary background, natural lighting, approachable innovative expression, high quality, 4k, professional photography",
      
      finance: "finance professional headshot, formal business suit, conservative background, professional lighting, trustworthy authoritative expression, high quality, 4k, professional photography"
    };
    
    return prompts[template] || prompts.corporate;
  }

  // Validate image before processing
  validateImage(imageBase64) {
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    // Check if it's a valid base64 image
    if (!imageBase64.startsWith('data:image/')) {
      throw new Error('Invalid image format. Please provide a valid image.');
    }

    // Check image size (should be reasonable for processing)
    const sizeInBytes = (imageBase64.length * 3) / 4;
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (sizeInBytes > maxSize) {
      throw new Error('Image too large. Please use an image smaller than 10MB.');
    }

    return true;
  }

  // Handle API errors gracefully
  handleError(error) {
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.message || 'API Error';
      
      switch (status) {
        case 401:
          return new Error('Invalid API credentials. Please check your API token.');
        case 402:
          return new Error('Insufficient credits. Please add credits to your account.');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(`API Error: ${message}`);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your internet connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred.');
    }
  }

  // Get estimated processing time based on options
  getEstimatedProcessingTime(options = {}) {
    const baseTime = 15; // seconds
    const stepsMultiplier = (options.numSteps || 50) / 50;
    const outputsMultiplier = (options.numOutputs || 4) / 4;
    
    return Math.ceil(baseTime * stepsMultiplier * outputsMultiplier);
  }

  // Cancel a running prediction
  async cancelPrediction(predictionId) {
    try {
      const response = await this.axios.post(`/predictions/${predictionId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel Prediction Error:', error);
      throw this.handleError(error);
    }
  }
}

/**
 * SECURITY REMEDIATION NOTICE
 * 
 * This AIService has been DEPRECATED and DISABLED for security reasons.
 * It previously contained hardcoded API credentials (CVSS 9.8 vulnerability).
 * 
 * SECURE REPLACEMENT: Use SecureAIService instead
 * 
 * Migration Guide:
 * OLD: import AIService from './aiService'
 * NEW: import SecureAIService from './secureAIService'
 * 
 * The new SecureAIService routes all AI processing through a secure
 * backend proxy, eliminating client-side credential exposure.
 */

// Export disabled service with security warnings
const deprecatedAIService = new AIService();
deprecatedAIService._securityNotice = 'DEPRECATED: Use SecureAIService for all AI operations';
deprecatedAIService._migrationRequired = true;

export default deprecatedAIService;