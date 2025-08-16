// Professional Headshot API Service
// Integrates BetterPic API as primary service with Replicate FLUX.1 as fallback
// Optimized for React Native mobile app with offline/online handling

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageProcessingUtils from '../utils/optimizedImageProcessing';

// Configuration for multiple API providers
const API_CONFIG = {
  BETTERPIC: {
    baseURL: 'https://api.betterpic.io/v1', // Hypothetical API endpoint
    timeout: 180000, // 3 minutes
    maxRetries: 3,
    costPerImage: 1.16,
    processingTime: '30-90 minutes',
    quality: '4K Professional'
  },
  REPLICATE_FLUX: {
    baseURL: 'https://api.replicate.com/v1',
    timeout: 120000, // 2 minutes
    maxRetries: 2,
    costPerImage: 0.04,
    processingTime: '1-2 minutes',
    quality: 'High Professional'
  }
};

// Style templates optimized for professional headshots
const PROFESSIONAL_STYLES = {
  linkedin_executive: {
    name: 'LinkedIn Executive',
    description: 'Premium executive headshot for C-suite profiles',
    betterPicStyle: 'executive_premium',
    fluxPrompt: 'ultra-professional executive headshot, premium dark business suit, confident authoritative expression, studio lighting, LinkedIn profile quality, 4K, professional photography',
    price: 'premium'
  },
  linkedin_professional: {
    name: 'LinkedIn Professional',
    description: 'Standard professional headshot for business profiles',
    betterPicStyle: 'business_professional',
    fluxPrompt: 'professional business headshot, business attire, confident expression, clean background, LinkedIn standard, high quality',
    price: 'standard'
  },
  linkedin_creative: {
    name: 'LinkedIn Creative',
    description: 'Modern creative professional headshot',
    betterPicStyle: 'creative_professional',
    fluxPrompt: 'creative professional headshot, modern business casual, approachable expression, contemporary background, LinkedIn quality',
    price: 'standard'
  },
  linkedin_healthcare: {
    name: 'LinkedIn Healthcare',
    description: 'Professional healthcare worker headshot',
    betterPicStyle: 'healthcare_professional',
    fluxPrompt: 'healthcare professional headshot, medical attire or business professional, trustworthy expression, clean background, LinkedIn medical professional',
    price: 'standard'
  }
};

class ProfessionalHeadshotService {
  constructor() {
    this.primaryProvider = 'BETTERPIC';
    this.fallbackProvider = 'REPLICATE_FLUX';
    this.initializeServices();
  }

  // Initialize API clients
  async initializeServices() {
    // BetterPic API Client
    this.betterPicClient = axios.create({
      baseURL: API_CONFIG.BETTERPIC.baseURL,
      timeout: API_CONFIG.BETTERPIC.timeout,
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_BETTERPIC_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Replicate FLUX Client
    this.replicateClient = axios.create({
      baseURL: API_CONFIG.REPLICATE_FLUX.baseURL,
      timeout: API_CONFIG.REPLICATE_FLUX.timeout,
      headers: {
        'Authorization': `Token ${process.env.EXPO_PUBLIC_REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Load cached user preferences
    await this.loadUserPreferences();
  }

  // Main method: Transform image to professional headshot
  async transformToHeadshot(imageUri, styleKey = 'linkedin_professional', options = {}) {
    try {
      console.log('🎯 Starting Professional Headshot Transformation');
      console.log('Style:', styleKey, 'Options:', options);

      // Validate input
      if (!imageUri) throw new Error('Image URI is required');
      if (!PROFESSIONAL_STYLES[styleKey]) {
        throw new Error(`Invalid style: ${styleKey}`);
      }

      const style = PROFESSIONAL_STYLES[styleKey];
      
      // Prepare image for processing
      const processedImage = await this.prepareImageForAPI(imageUri);
      
      // Determine which API to use based on user preference and requirements
      const selectedProvider = this.selectOptimalProvider(options);
      
      // Start transformation with selected provider
      let result;
      try {
        if (selectedProvider === 'BETTERPIC') {
          result = await this.transformWithBetterPic(processedImage, style, options);
        } else {
          result = await this.transformWithReplicate(processedImage, style, options);
        }
        
        // Cache successful result
        await this.cacheTransformationResult(result);
        
        return {
          success: true,
          provider: selectedProvider,
          style: style.name,
          result,
          estimatedCost: this.calculateCost(selectedProvider, options),
          quality: API_CONFIG[selectedProvider].quality
        };
        
      } catch (primaryError) {
        console.warn(`Primary provider ${selectedProvider} failed:`, primaryError.message);
        
        // Attempt fallback
        const fallbackProvider = selectedProvider === 'BETTERPIC' ? 'REPLICATE_FLUX' : 'BETTERPIC';
        console.log(`Attempting fallback to ${fallbackProvider}`);
        
        try {
          if (fallbackProvider === 'BETTERPIC') {
            result = await this.transformWithBetterPic(processedImage, style, options);
          } else {
            result = await this.transformWithReplicate(processedImage, style, options);
          }
          
          return {
            success: true,
            provider: fallbackProvider,
            fallbackUsed: true,
            primaryError: primaryError.message,
            style: style.name,
            result,
            estimatedCost: this.calculateCost(fallbackProvider, options),
            quality: API_CONFIG[fallbackProvider].quality
          };
          
        } catch (fallbackError) {
          console.error('Both providers failed:', { primaryError, fallbackError });
          throw new Error(`Transformation failed: ${primaryError.message}`);
        }
      }

    } catch (error) {
      console.error('Professional Headshot Service Error:', error);
      throw this.handleError(error);
    }
  }

  // Transform using BetterPic API
  async transformWithBetterPic(imageUri, style, options = {}) {
    try {
      console.log('🎨 Using BetterPic API for transformation');

      // Upload image to BetterPic
      const uploadResponse = await this.betterPicClient.post('/upload', {
        image: imageUri,
        format: 'base64'
      });

      if (!uploadResponse.data.success) {
        throw new Error('BetterPic image upload failed');
      }

      // Start transformation
      const transformResponse = await this.betterPicClient.post('/transform', {
        imageId: uploadResponse.data.imageId,
        style: style.betterPicStyle,
        options: {
          quality: '4K',
          backgroundStyle: options.background || 'professional_gray',
          clothingStyle: options.clothing || 'business_professional',
          numVariations: options.variations || 4,
          enhanceFace: true,
          professionalLighting: true,
          ...options
        }
      });

      const transformationId = transformResponse.data.transformationId;
      console.log('BetterPic transformation started:', transformationId);

      // Poll for results
      const result = await this.pollBetterPicResults(transformationId);
      
      return {
        transformationId,
        provider: 'BetterPic',
        images: result.images,
        processingTime: result.processingTimeMs,
        quality: '4K Professional',
        metadata: result.metadata
      };

    } catch (error) {
      console.error('BetterPic transformation error:', error);
      throw new Error(`BetterPic API error: ${error.message}`);
    }
  }

  // Transform using Replicate FLUX.1
  async transformWithReplicate(imageUri, style, options = {}) {
    try {
      console.log('⚡ Using Replicate FLUX.1 for transformation');

      // Choose optimal FLUX model
      const model = options.fastMode ? 
        "f2ab8a5569c55169b2c2a4b4db4e76b73f3bcdf0306ad5a9ae6bc7b29b4d85db" : // FLUX Schnell
        "843b6e5cfa54cc9f88d3bb83743f82c8e5cf53b4dc60cc7d2e6db5e9f19a43fe";   // FLUX Dev

      const payload = {
        version: model,
        input: {
          prompt: style.fluxPrompt,
          image: imageUri,
          strength: options.strength || 0.8,
          num_inference_steps: options.steps || 50,
          guidance_scale: options.guidance || 7.5,
          num_outputs: options.variations || 4,
          output_format: "png",
          output_quality: 95
        }
      };

      const response = await this.replicateClient.post('/predictions', payload);
      const predictionId = response.data.id;
      console.log('Replicate prediction started:', predictionId);

      // Wait for completion
      const result = await this.waitForReplicatePrediction(predictionId);
      
      return {
        predictionId,
        provider: 'Replicate FLUX.1',
        images: result.output,
        processingTime: result.processingTimeMs,
        quality: 'High Professional',
        metadata: {
          model: model.includes('schnell') ? 'FLUX Schnell' : 'FLUX Dev',
          steps: payload.input.num_inference_steps
        }
      };

    } catch (error) {
      console.error('Replicate transformation error:', error);
      throw new Error(`Replicate API error: ${error.message}`);
    }
  }

  // Prepare image for API processing
  async prepareImageForAPI(imageUri) {
    try {
      // Optimize image for professional headshot processing
      const optimizedImage = await ImageProcessingUtils.resizeForProcessing(imageUri, {
        width: 1024,
        height: 1024,
        quality: 95,
        format: 'jpeg'
      });

      // Enhance face detection and cropping
      const faceEnhanced = await ImageProcessingUtils.enhanceForHeadshot(optimizedImage.uri, {
        detectFace: true,
        centerFace: true,
        enhanceDetails: true
      });

      return faceEnhanced.uri;
    } catch (error) {
      console.error('Image preparation error:', error);
      // Return original if processing fails
      return imageUri;
    }
  }

  // Select optimal provider based on requirements
  selectOptimalProvider(options = {}) {
    // Use user preference if available
    if (options.preferredProvider && API_CONFIG[options.preferredProvider.toUpperCase()]) {
      return options.preferredProvider.toUpperCase();
    }

    // Select based on requirements
    if (options.premium || options.quality === '4K') {
      return 'BETTERPIC';
    }

    if (options.fastMode || options.budget) {
      return 'REPLICATE_FLUX';
    }

    // Default to primary provider
    return this.primaryProvider;
  }

  // Poll BetterPic results
  async pollBetterPicResults(transformationId, maxWait = 300000) { // 5 minutes
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < maxWait) {
      try {
        const response = await this.betterPicClient.get(`/transform/${transformationId}/status`);
        const status = response.data;

        console.log(`BetterPic status: ${status.status}`);

        if (status.status === 'completed') {
          return {
            images: status.results.images,
            processingTimeMs: Date.now() - startTime,
            metadata: status.results.metadata
          };
        }

        if (status.status === 'failed') {
          throw new Error(status.error || 'BetterPic transformation failed');
        }

        // Continue polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error('BetterPic transformation not found');
        }
        console.warn('BetterPic polling error:', error.message);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('BetterPic transformation timeout');
  }

  // Wait for Replicate prediction
  async waitForReplicatePrediction(predictionId, maxWait = 120000) { // 2 minutes
    const startTime = Date.now();
    const pollInterval = 3000; // 3 seconds

    while (Date.now() - startTime < maxWait) {
      try {
        const response = await this.replicateClient.get(`/predictions/${predictionId}`);
        const prediction = response.data;

        console.log(`Replicate status: ${prediction.status}`);

        if (prediction.status === 'succeeded') {
          return {
            output: prediction.output,
            processingTimeMs: Date.now() - startTime,
            metadata: prediction.metrics
          };
        }

        if (prediction.status === 'failed') {
          throw new Error(prediction.error || 'Replicate prediction failed');
        }

        // Continue polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error('Replicate prediction not found');
        }
        console.warn('Replicate polling error:', error.message);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Replicate prediction timeout');
  }

  // Calculate estimated cost
  calculateCost(provider, options = {}) {
    const config = API_CONFIG[provider];
    const variations = options.variations || 4;
    return {
      provider,
      costPerImage: config.costPerImage,
      totalCost: config.costPerImage * variations,
      currency: 'USD'
    };
  }

  // Batch process multiple styles
  async batchProcessStyles(imageUri, styleKeys = ['linkedin_professional', 'linkedin_executive'], options = {}) {
    try {
      console.log('🚀 Batch processing multiple styles');
      
      const results = [];
      const batchOptions = { ...options, variations: 2 }; // Fewer variations per style

      for (const styleKey of styleKeys) {
        try {
          const result = await this.transformToHeadshot(imageUri, styleKey, batchOptions);
          results.push({
            style: styleKey,
            success: true,
            result
          });
        } catch (error) {
          results.push({
            style: styleKey,
            success: false,
            error: error.message
          });
        }
      }

      return {
        batchId: `batch_${Date.now()}`,
        results,
        totalStyles: styleKeys.length,
        successfulStyles: results.filter(r => r.success).length
      };

    } catch (error) {
      console.error('Batch processing error:', error);
      throw error;
    }
  }

  // Get available styles
  getAvailableStyles() {
    return Object.keys(PROFESSIONAL_STYLES).map(key => ({
      key,
      ...PROFESSIONAL_STYLES[key]
    }));
  }

  // Cache transformation result
  async cacheTransformationResult(result) {
    try {
      const cacheKey = `headshot_cache_${Date.now()}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        result,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache result:', error);
    }
  }

  // Load user preferences
  async loadUserPreferences() {
    try {
      const preferences = await AsyncStorage.getItem('headshot_preferences');
      if (preferences) {
        const parsed = JSON.parse(preferences);
        this.primaryProvider = parsed.primaryProvider || this.primaryProvider;
      }
    } catch (error) {
      console.warn('Failed to load preferences:', error);
    }
  }

  // Handle errors gracefully
  handleError(error) {
    const errorMap = {
      'Network Error': 'Please check your internet connection and try again.',
      'timeout': 'The request took too long. Please try again.',
      'Invalid API': 'API configuration error. Please contact support.',
      '401': 'Authentication failed. Please check API credentials.',
      '402': 'Insufficient credits. Please add credits to your account.',
      '429': 'Too many requests. Please wait and try again.',
      '500': 'Server error. Please try again later.'
    };

    const message = errorMap[error.message] || error.message || 'An unexpected error occurred';
    return new Error(message);
  }
}

// Export singleton instance
export default new ProfessionalHeadshotService();