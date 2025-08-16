/**
 * Production-Ready Headshot Transformation Service
 * Dual-Provider Architecture: BetterPic API + Replicate FLUX.1/InstantID
 * 
 * Features:
 * - Intelligent provider routing (fast vs premium)
 * - Robust error handling and fallback systems
 * - Cost tracking and analytics
 * - Background job processing
 * - Professional headshot styles
 * - 4K quality output
 * - Face identity preservation
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageProcessingUtils from '../utils/imageProcessing';
import { JobQueue } from './backgroundJobService';
import { CostTracker } from './costTrackingService';
import { AnalyticsService } from './analyticsService';
import { ErrorHandler } from './errorHandlingService';

// Provider Configurations
const PROVIDERS = {
  BETTERPIC: {
    name: 'BetterPic',
    baseURL: 'https://api.betterpic.ai/v1',
    costPerImage: 1.16,
    processingTime: { min: 30, max: 90 }, // minutes
    quality: 'premium',
    apiKey: process.env.EXPO_PUBLIC_BETTERPIC_API_KEY,
    features: ['4K_output', 'face_preservation', 'premium_quality', 'studio_lighting'],
    maxRetries: 3,
    timeout: 5400000 // 90 minutes
  },
  
  REPLICATE: {
    name: 'Replicate',
    baseURL: 'https://api.replicate.com/v1',
    costPerImage: 0.035, // Average between FLUX.1 and InstantID
    processingTime: { min: 1, max: 2 }, // minutes  
    quality: 'fast',
    apiKey: process.env.EXPO_PUBLIC_REPLICATE_API_TOKEN,
    features: ['fast_processing', 'instant_id', 'flux_models'],
    maxRetries: 2,
    timeout: 300000 // 5 minutes
  }
};

// Professional Headshot Styles
const PROFESSIONAL_STYLES = {
  executive: {
    name: 'Executive Leadership',
    description: 'Premium CEO/C-Suite professional headshot',
    recommendedProvider: 'BETTERPIC',
    pricing: 'premium',
    features: ['luxury_styling', 'executive_presence', 'premium_retouching']
  },
  
  creative: {
    name: 'Creative Professional', 
    description: 'Modern creative industry headshot',
    recommendedProvider: 'REPLICATE',
    pricing: 'standard',
    features: ['contemporary_styling', 'approachable_professional']
  },
  
  tech: {
    name: 'Technology Professional',
    description: 'Modern tech industry headshot',
    recommendedProvider: 'REPLICATE', 
    pricing: 'standard',
    features: ['tech_casual', 'innovation_focused']
  },
  
  healthcare: {
    name: 'Healthcare Professional',
    description: 'Trustworthy medical professional headshot',
    recommendedProvider: 'BETTERPIC',
    pricing: 'premium',
    features: ['medical_professionalism', 'trustworthy_appearance']
  },
  
  finance: {
    name: 'Finance Professional',
    description: 'Conservative financial industry headshot',
    recommendedProvider: 'BETTERPIC',
    pricing: 'premium', 
    features: ['financial_conservative', 'trustworthy_authoritative']
  },
  
  startup: {
    name: 'Startup Professional',
    description: 'Dynamic startup professional headshot', 
    recommendedProvider: 'REPLICATE',
    pricing: 'standard',
    features: ['startup_energy', 'innovative_professional']
  }
};

class HeadshotTransformationService {
  constructor() {
    this.jobQueue = new JobQueue();
    this.costTracker = new CostTracker();
    this.analytics = new AnalyticsService();
    this.errorHandler = new ErrorHandler();
    this.activeJobs = new Map();
    this.providerHealth = new Map();
    
    // Initialize provider health monitoring
    this.initializeProviderHealthMonitoring();
  }

  /**
   * Main transformation method - Intelligently routes to best provider
   */
  async transformHeadshot(options) {
    const {
      imageUri,
      style = 'executive',
      quality = 'auto', // auto, fast, premium
      userId,
      priority = 'standard', // standard, high, urgent
      backgroundProcessing = false
    } = options;

    try {
      // Validate inputs
      await this.validateTransformationRequest(options);
      
      // Generate unique job ID
      const jobId = this.generateJobId();
      
      // Select optimal provider based on requirements
      const provider = await this.selectOptimalProvider(style, quality, priority);
      
      // Track request analytics
      await this.analytics.trackTransformationRequest({
        jobId,
        userId,
        style,
        provider: provider.name,
        quality,
        priority
      });
      
      // Background processing for long-running premium jobs
      if (backgroundProcessing || provider.name === 'BETTERPIC') {
        return this.processInBackground(jobId, imageUri, style, provider, options);
      }
      
      // Immediate processing for fast jobs
      return this.processImmediate(jobId, imageUri, style, provider, options);
      
    } catch (error) {
      await this.errorHandler.handleError('TRANSFORMATION_ERROR', error, {
        imageUri: imageUri ? 'provided' : 'missing',
        style,
        quality
      });
      throw error;
    }
  }

  /**
   * Background processing for premium/long-running transformations
   */
  async processInBackground(jobId, imageUri, style, provider, options) {
    const job = {
      id: jobId,
      type: 'headshot_transformation',
      status: 'queued',
      provider: provider.name,
      style,
      imageUri,
      options,
      createdAt: new Date(),
      estimatedCompletionTime: this.calculateEstimatedCompletion(provider)
    };

    // Add to job queue
    await this.jobQueue.addJob(job);
    this.activeJobs.set(jobId, job);

    // Start background processing
    this.processJobInBackground(job);

    return {
      success: true,
      jobId,
      status: 'queued',
      estimatedCompletionTime: job.estimatedCompletionTime,
      provider: provider.name,
      backgroundProcessing: true,
      trackingUrl: `${process.env.EXPO_PUBLIC_API_URL}/jobs/${jobId}/status`
    };
  }

  /**
   * Immediate processing for fast transformations
   */
  async processImmediate(jobId, imageUri, style, provider, options) {
    const job = {
      id: jobId,
      type: 'headshot_transformation',
      status: 'processing',
      provider: provider.name,
      style,
      imageUri,
      options,
      createdAt: new Date()
    };

    this.activeJobs.set(jobId, job);

    try {
      // Process image with selected provider
      const result = await this.executeTransformation(imageUri, style, provider, options);
      
      // Update job status
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      
      // Track completion
      await this.trackJobCompletion(job);
      
      return {
        success: true,
        jobId,
        status: 'completed',
        result,
        provider: provider.name,
        processingTime: job.completedAt - job.createdAt
      };

    } catch (error) {
      // Handle failure with fallback
      const fallbackResult = await this.handleProviderFailure(job, error);
      
      if (fallbackResult.success) {
        return fallbackResult;
      }
      
      // Update job with failure
      job.status = 'failed';
      job.error = error.message;
      job.failedAt = new Date();
      
      throw error;
    } finally {
      // Clean up
      setTimeout(() => this.activeJobs.delete(jobId), 300000); // Keep for 5 minutes
    }
  }

  /**
   * Execute transformation with specific provider
   */
  async executeTransformation(imageUri, style, provider, options) {
    switch (provider.name) {
      case 'BETTERPIC':
        return this.executeBetterPicTransformation(imageUri, style, options);
        
      case 'REPLICATE':
        return this.executeReplicateTransformation(imageUri, style, options);
        
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  /**
   * BetterPic API Integration
   */
  async executeBetterPicTransformation(imageUri, style, options) {
    const provider = PROVIDERS.BETTERPIC;
    
    try {
      // Prepare image for BetterPic
      const processedImage = await ImageProcessingUtils.optimizeForProvider(imageUri, {
        provider: 'betterpic',
        quality: 95,
        format: 'jpg',
        maxDimension: 2048
      });

      // Upload image to BetterPic
      const uploadResponse = await this.uploadToBetterPic(processedImage);
      
      if (!uploadResponse.success) {
        throw new Error(`BetterPic upload failed: ${uploadResponse.error}`);
      }

      // Configure transformation based on style
      const transformationConfig = this.getBetterPicStyleConfig(style, options);
      
      // Start transformation
      const transformationResponse = await axios.post(
        `${provider.baseURL}/transformations`,
        {
          imageId: uploadResponse.imageId,
          style: transformationConfig.style,
          quality: 'premium',
          outputFormat: '4K',
          facePreservation: true,
          professionalLighting: true,
          backgroundType: transformationConfig.background,
          attireStyle: transformationConfig.attire,
          ...transformationConfig.parameters
        },
        {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: provider.timeout
        }
      );

      const transformationId = transformationResponse.data.id;
      
      // Track cost
      await this.costTracker.trackCost({
        provider: 'BetterPic',
        cost: provider.costPerImage,
        transformationId,
        style
      });

      // Poll for completion
      const result = await this.pollBetterPicCompletion(transformationId);
      
      return {
        success: true,
        provider: 'BetterPic',
        transformationId,
        outputs: result.outputs,
        quality: '4K',
        processingTime: result.processingTime,
        cost: provider.costPerImage
      };

    } catch (error) {
      await this.handleProviderError('BETTERPIC', error);
      throw error;
    }
  }

  /**
   * Replicate API Integration (FLUX.1 + InstantID)
   */
  async executeReplicateTransformation(imageUri, style, options) {
    const provider = PROVIDERS.REPLICATE;
    
    try {
      // Select best Replicate model for the style
      const model = this.selectReplicateModel(style, options);
      
      // Prepare image for Replicate
      const processedImage = await ImageProcessingUtils.optimizeForProvider(imageUri, {
        provider: 'replicate',
        quality: 90,
        format: 'jpg',
        maxDimension: 1024
      });

      // Upload to cloud storage for Replicate access
      const uploadResult = await ImageProcessingUtils.uploadToCloudinary(
        processedImage.uri,
        { folder: 'headshot-inputs-replicate' }
      );

      if (!uploadResult.success) {
        throw new Error(`Image upload failed: ${uploadResult.error}`);
      }

      // Configure transformation
      const transformationConfig = this.getReplicateStyleConfig(style, model, options);
      
      // Create prediction
      const payload = {
        version: model.version,
        input: {
          image: uploadResult.url,
          ...transformationConfig
        }
      };

      const response = await axios.post(
        `${provider.baseURL}/predictions`,
        payload,
        {
          headers: {
            'Authorization': `Token ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: provider.timeout
        }
      );

      const predictionId = response.data.id;
      
      // Track cost
      await this.costTracker.trackCost({
        provider: 'Replicate',
        cost: provider.costPerImage,
        predictionId,
        model: model.name,
        style
      });

      // Wait for completion
      const result = await this.pollReplicateCompletion(predictionId);
      
      return {
        success: true,
        provider: 'Replicate',
        model: model.name,
        predictionId,
        outputs: result.outputs,
        processingTime: result.processingTime,
        cost: provider.costPerImage
      };

    } catch (error) {
      await this.handleProviderError('REPLICATE', error);
      throw error;
    }
  }

  /**
   * Intelligent provider selection based on requirements
   */
  async selectOptimalProvider(style, quality, priority) {
    const styleConfig = PROFESSIONAL_STYLES[style];
    
    // Check provider health
    const betterPicHealthy = this.providerHealth.get('BETTERPIC')?.healthy !== false;
    const replicateHealthy = this.providerHealth.get('REPLICATE')?.healthy !== false;
    
    // Priority override - urgent jobs go to fastest available provider
    if (priority === 'urgent') {
      return replicateHealthy ? PROVIDERS.REPLICATE : PROVIDERS.BETTERPIC;
    }
    
    // Quality override - premium quality always uses BetterPic if available
    if (quality === 'premium') {
      if (betterPicHealthy) {
        return PROVIDERS.BETTERPIC;
      } else if (replicateHealthy) {
        console.warn('BetterPic unavailable, falling back to Replicate for premium quality');
        return PROVIDERS.REPLICATE;
      }
    }
    
    // Fast quality always uses Replicate if available
    if (quality === 'fast') {
      return replicateHealthy ? PROVIDERS.REPLICATE : PROVIDERS.BETTERPIC;
    }
    
    // Auto selection based on style recommendation
    if (quality === 'auto') {
      const recommendedProvider = PROVIDERS[styleConfig.recommendedProvider];
      const isHealthy = this.providerHealth.get(styleConfig.recommendedProvider)?.healthy !== false;
      
      if (isHealthy) {
        return recommendedProvider;
      } else {
        // Fallback to the other provider
        const fallbackProvider = styleConfig.recommendedProvider === 'BETTERPIC' ? 
          PROVIDERS.REPLICATE : PROVIDERS.BETTERPIC;
        return fallbackProvider;
      }
    }
    
    // Default fallback
    return replicateHealthy ? PROVIDERS.REPLICATE : PROVIDERS.BETTERPIC;
  }

  /**
   * Select optimal Replicate model based on style and options
   */
  selectReplicateModel(style, options) {
    const models = {
      FLUX_SCHNELL: {
        name: 'FLUX.1 Schnell',
        version: "f2ab8a5569c55169b2c2a4b4db4e76b73f3bcdf0306ad5a9ae6bc7b29b4d85db",
        cost: 0.025,
        speed: 'fastest',
        quality: 'good'
      },
      
      FLUX_DEV: {
        name: 'FLUX.1 Dev',  
        version: "843b6e5cfa54cc9f88d3bb83743f82c8e5cf53b4dc60cc7d2e6db5e9f19a43fe",
        cost: 0.04,
        speed: 'fast',
        quality: 'excellent'
      },
      
      INSTANT_ID: {
        name: 'InstantID',
        version: "dd8025e33ddf4c3cdf6f18be24b3f846c8bbcc4a000c28b6b1ab3a3addbdae4f", 
        cost: 0.03,
        speed: 'fast',
        quality: 'excellent',
        facePreservation: true
      }
    };

    // For executive/finance/healthcare - use highest quality with face preservation
    if (['executive', 'finance', 'healthcare'].includes(style)) {
      return models.INSTANT_ID;
    }
    
    // For creative/tech/startup - use FLUX.1 Dev for quality
    if (['creative', 'tech', 'startup'].includes(style)) {
      return options.fast ? models.FLUX_SCHNELL : models.FLUX_DEV;
    }
    
    // Default to INSTANT_ID for best face preservation
    return models.INSTANT_ID;
  }

  /**
   * Handle provider failures with intelligent fallback
   */
  async handleProviderFailure(job, error) {
    const failedProvider = job.provider;
    const fallbackProvider = failedProvider === 'BETTERPIC' ? 'REPLICATE' : 'BETTERPIC';
    
    console.warn(`${failedProvider} failed, attempting fallback to ${fallbackProvider}:`, error.message);
    
    // Mark failed provider as unhealthy temporarily
    this.providerHealth.set(failedProvider, {
      healthy: false,
      lastFailure: new Date(),
      error: error.message
    });
    
    // Attempt fallback
    try {
      const fallbackProviderConfig = PROVIDERS[fallbackProvider];
      const result = await this.executeTransformation(
        job.imageUri,
        job.style,
        fallbackProviderConfig,
        job.options
      );
      
      // Update job with fallback success
      job.status = 'completed';
      job.provider = fallbackProvider;
      job.fallbackUsed = true;
      job.originalProviderFailure = failedProvider;
      job.result = result;
      job.completedAt = new Date();
      
      await this.trackJobCompletion(job);
      
      return {
        success: true,
        jobId: job.id,
        status: 'completed',
        result,
        provider: fallbackProvider,
        fallbackUsed: true,
        originalProviderFailure: failedProvider
      };
      
    } catch (fallbackError) {
      console.error(`Fallback to ${fallbackProvider} also failed:`, fallbackError.message);
      
      // Mark both providers as potentially problematic
      this.providerHealth.set(fallbackProvider, {
        healthy: false,
        lastFailure: new Date(),
        error: fallbackError.message
      });
      
      return {
        success: false,
        error: 'All providers failed',
        primaryError: error.message,
        fallbackError: fallbackError.message
      };
    }
  }

  /**
   * Get job status for tracking
   */
  async getJobStatus(jobId) {
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      // Check completed jobs in storage
      const storedJob = await AsyncStorage.getItem(`job_${jobId}`);
      if (storedJob) {
        return JSON.parse(storedJob);
      }
      
      return {
        success: false,
        error: 'Job not found',
        jobId
      };
    }
    
    return {
      success: true,
      jobId,
      status: job.status,
      provider: job.provider,
      style: job.style,
      createdAt: job.createdAt,
      estimatedCompletionTime: job.estimatedCompletionTime,
      completedAt: job.completedAt,
      result: job.result,
      error: job.error
    };
  }

  /**
   * Cancel active job
   */
  async cancelJob(jobId) {
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      throw new Error('Job not found or already completed');
    }
    
    if (job.status === 'completed') {
      throw new Error('Cannot cancel completed job');
    }
    
    try {
      // Cancel with provider if possible
      if (job.provider === 'REPLICATE' && job.predictionId) {
        await axios.post(
          `${PROVIDERS.REPLICATE.baseURL}/predictions/${job.predictionId}/cancel`,
          {},
          {
            headers: {
              'Authorization': `Token ${PROVIDERS.REPLICATE.apiKey}`
            }
          }
        );
      }
      
      // BetterPic cancellation would go here when available
      
      // Update job status
      job.status = 'cancelled';
      job.cancelledAt = new Date();
      
      return {
        success: true,
        jobId,
        status: 'cancelled'
      };
      
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  }

  // Utility methods
  generateJobId() {
    return `hts_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  calculateEstimatedCompletion(provider) {
    const now = new Date();
    const avgMinutes = (provider.processingTime.min + provider.processingTime.max) / 2;
    return new Date(now.getTime() + (avgMinutes * 60000));
  }

  async validateTransformationRequest(options) {
    if (!options.imageUri) {
      throw new Error('Image URI is required');
    }
    
    if (!PROFESSIONAL_STYLES[options.style]) {
      throw new Error(`Invalid style: ${options.style}`);
    }
    
    // Add additional validation as needed
  }
}

// Export singleton instance
export default new HeadshotTransformationService();