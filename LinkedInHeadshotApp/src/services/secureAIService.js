/**
 * SECURE AI Service - Client-Side Proxy Implementation
 * CRITICAL SECURITY: NO API credentials in client code
 * All external API calls routed through secure backend proxy
 */

import axios from 'axios';
import Environment from '../config/environment';
import { logger } from './logger.service';

class SecureAIService {
  constructor() {
    this.baseURL = Environment.API_BASE_URL;
    this.initialize();
  }

  // Initialize secure API client
  initialize() {
    this.apiClient = axios.create({
      baseURL: `${this.baseURL}/api`,
      timeout: 120000, // 2 minutes for AI processing
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '1.0.0',
        'X-Platform': Environment.PLATFORM
      }
    });

    // Add request interceptor for authentication
    this.apiClient.interceptors.request.use(
      (config) => {
        // Add auth token from secure storage
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log request for debugging (without sensitive data)
        if (Environment.ENABLE_NETWORK_DEBUGGING) {
          console.log('🔒 Secure AI Request:', {
            method: config.method,
            url: config.url,
            hasAuth: !!config.headers.Authorization,
            timestamp: new Date().toISOString()
          });
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const secureError = this.handleSecureError(error);
        return Promise.reject(secureError);
      }
    );
  }

  /**
   * SECURE: Process image transformation through backend proxy
   * NO external API credentials exposed to client
   */
  async processImageToHeadshot(imageUri, styleTemplate = 'executive', options = {}) {
    try {
      console.log('🔒 Starting SECURE AI transformation via backend proxy...');
      console.log(`📋 Style: ${styleTemplate}`);

      // Validate inputs client-side first
      this.validateImageInput(imageUri);
      this.validateStyleTemplate(styleTemplate);
      this.validateOptions(options);

      // Convert image to base64 for secure transmission
      const imageData = await this.prepareImageForSecureTransmission(imageUri);

      // Create secure request payload (NO API credentials)
      const requestPayload = {
        imageData,
        styleTemplate,
        options: {
          dramatic: options.dramatic || false,
          premium: options.premium || false,
          numOutputs: Math.min(options.numOutputs || 4, 8), // Client-side limit
          fast: options.fast || false
        }
      };

      // Send to secure backend proxy (credentials handled server-side)
      const response = await this.apiClient.post('/ai/transform', requestPayload);

      if (response.data.success) {
        console.log('✅ Secure AI transformation initiated successfully');
        
        return {
          success: true,
          predictionId: response.data.predictionId,
          status: response.data.status,
          styleTemplate: response.data.styleTemplate,
          estimatedTime: response.data.estimatedTime,
          processingOptions: response.data.processingOptions,
          secure: true, // Indicates this used secure proxy
          provider: 'SecureProxy'
        };
      } else {
        throw new Error(response.data.error || 'Transformation failed');
      }

    } catch (error) {
      console.error('❌ Secure AI transformation failed:', error);
      
      // Log error for analytics (sanitized)
      this.logSecureError('processImageToHeadshot', error, {
        styleTemplate,
        hasOptions: Object.keys(options).length > 0
      });

      return {
        success: false,
        error: this.sanitizeErrorForClient(error.message),
        secure: true,
        provider: 'SecureProxy'
      };
    }
  }

  /**
   * SECURE: Check prediction status through backend proxy
   */
  async checkPredictionStatus(predictionId) {
    try {
      if (!predictionId) {
        throw new Error('Prediction ID is required');
      }

      const response = await this.apiClient.get(`/ai/prediction/${predictionId}`);

      if (response.data.success) {
        return {
          success: true,
          predictionId: response.data.predictionId,
          status: response.data.status,
          progress: response.data.progress,
          outputs: response.data.outputs || [],
          error: response.data.error,
          completedAt: response.data.completedAt,
          processingTime: response.data.processingTime,
          secure: true
        };
      } else {
        throw new Error(response.data.error || 'Status check failed');
      }

    } catch (error) {
      console.error('❌ Secure status check failed:', error);
      
      return {
        success: false,
        error: this.sanitizeErrorForClient(error.message),
        secure: true
      };
    }
  }

  /**
   * SECURE: Process multiple styles through backend proxy
   */
  async batchProcessMultipleStyles(imageUri, styleTemplates = ['executive', 'creative'], options = {}) {
    try {
      console.log('🔒 Starting SECURE batch processing via backend proxy...');

      // Validate inputs
      this.validateImageInput(imageUri);
      if (!Array.isArray(styleTemplates) || styleTemplates.length === 0) {
        throw new Error('Style templates must be a non-empty array');
      }
      if (styleTemplates.length > 5) {
        throw new Error('Maximum 5 styles allowed for batch processing');
      }

      // Prepare image data
      const imageData = await this.prepareImageForSecureTransmission(imageUri);

      // Create secure batch request
      const batchPayload = {
        imageData,
        styleTemplates,
        options: {
          dramatic: options.dramatic || false,
          premium: options.premium || false,
          numOutputs: Math.min(options.numOutputs || 2, 4) // Fewer outputs for batch
        }
      };

      const response = await this.apiClient.post('/ai/batch-transform', batchPayload);

      if (response.data.success) {
        console.log('✅ Secure batch processing initiated successfully');
        
        return {
          success: true,
          batchId: response.data.batchId,
          predictions: response.data.predictions,
          totalStyles: response.data.totalStyles,
          estimatedTime: response.data.estimatedTime,
          secure: true,
          provider: 'SecureProxy'
        };
      } else {
        throw new Error(response.data.error || 'Batch processing failed');
      }

    } catch (error) {
      console.error('❌ Secure batch processing failed:', error);
      
      return {
        success: false,
        error: this.sanitizeErrorForClient(error.message),
        secure: true
      };
    }
  }

  /**
   * SECURE: Cancel prediction through backend proxy
   */
  async cancelPrediction(predictionId) {
    try {
      if (!predictionId) {
        throw new Error('Prediction ID is required');
      }

      const response = await this.apiClient.delete(`/ai/prediction/${predictionId}`);

      if (response.data.success) {
        console.log('✅ Prediction cancelled successfully');
        return {
          success: true,
          message: response.data.message,
          secure: true
        };
      } else {
        throw new Error(response.data.error || 'Cancellation failed');
      }

    } catch (error) {
      console.error('❌ Secure cancellation failed:', error);
      
      return {
        success: false,
        error: this.sanitizeErrorForClient(error.message),
        secure: true
      };
    }
  }

  /**
   * SECURE: Get available styles (no sensitive data)
   */
  async getAvailableStyles() {
    try {
      const response = await this.apiClient.get('/ai/styles');

      if (response.data.success) {
        return {
          success: true,
          styles: response.data.styles,
          totalStyles: response.data.totalStyles,
          secure: true
        };
      } else {
        throw new Error(response.data.error || 'Failed to get styles');
      }

    } catch (error) {
      console.error('❌ Failed to get available styles:', error);
      
      // Return default styles as fallback
      return {
        success: true,
        styles: this.getDefaultStyles(),
        totalStyles: 6,
        secure: true,
        fallback: true
      };
    }
  }

  /**
   * SECURE: Wait for prediction completion with polling
   */
  async waitForPrediction(predictionId, maxWaitTime = 180000, pollInterval = 3000) {
    const startTime = Date.now();
    
    console.log(`⏳ Waiting for secure prediction completion: ${predictionId}`);
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const result = await this.checkPredictionStatus(predictionId);
        
        if (result.success) {
          console.log(`📊 Secure prediction status: ${result.status}`);
          
          if (result.status === 'succeeded') {
            console.log('🎉 Secure prediction completed successfully!');
            return {
              success: true,
              prediction: result,
              outputs: result.outputs || [],
              processingTime: Date.now() - startTime,
              secure: true
            };
          }
          
          if (result.status === 'failed') {
            return {
              success: false,
              error: result.error || 'Prediction failed',
              prediction: result,
              secure: true
            };
          }
          
          if (result.status === 'canceled') {
            return {
              success: false,
              error: 'Prediction was canceled',
              prediction: result,
              secure: true
            };
          }
        }
        
        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        console.error('❌ Error during secure polling:', error);
        
        // Continue polling unless it's a permanent error
        if (error.message.includes('404') || error.message.includes('Access denied')) {
          return {
            success: false,
            error: error.message,
            prediction: null,
            secure: true
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    // Timeout reached
    return {
      success: false,
      error: `Prediction timed out after ${maxWaitTime / 1000} seconds`,
      prediction: null,
      secure: true
    };
  }

  // VALIDATION METHODS (Client-side security)
  validateImageInput(imageUri) {
    if (!imageUri) {
      throw new Error('Image URI is required');
    }

    if (typeof imageUri !== 'string') {
      throw new Error('Image URI must be a string');
    }

    // Validate image format for base64 or file URI
    if (!imageUri.startsWith('data:image/') && !imageUri.startsWith('file://')) {
      throw new Error('Invalid image format');
    }
  }

  validateStyleTemplate(styleTemplate) {
    const validStyles = ['executive', 'creative', 'healthcare', 'finance', 'startup', 'tech', 'corporate'];
    
    if (!validStyles.includes(styleTemplate)) {
      throw new Error(`Invalid style template. Must be one of: ${validStyles.join(', ')}`);
    }
  }

  validateOptions(options) {
    if (typeof options !== 'object') {
      throw new Error('Options must be an object');
    }

    if (options.numOutputs && (options.numOutputs < 1 || options.numOutputs > 8)) {
      throw new Error('Number of outputs must be between 1 and 8');
    }

    if (options.numSteps && (options.numSteps < 10 || options.numSteps > 150)) {
      throw new Error('Number of steps must be between 10 and 150');
    }
  }

  // UTILITY METHODS
  async prepareImageForSecureTransmission(imageUri) {
    try {
      // Handle different image sources securely
      if (imageUri.startsWith('data:image/')) {
        // Already base64, validate and return
        this.validateBase64Image(imageUri);
        return imageUri;
      } else if (imageUri.startsWith('file://')) {
        // Convert file URI to base64
        return await this.convertFileToBase64(imageUri);
      } else {
        throw new Error('Unsupported image format');
      }
    } catch (error) {
      throw new Error(`Image preparation failed: ${error.message}`);
    }
  }

  validateBase64Image(base64String) {
    // Check if valid base64 image
    if (!base64String.match(/^data:image\/(jpeg|jpg|png|webp);base64,/)) {
      throw new Error('Invalid base64 image format');
    }

    // Check size (approximate)
    const sizeInBytes = (base64String.length * 3) / 4;
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (sizeInBytes > maxSize) {
      throw new Error('Image too large. Maximum size is 10MB');
    }
  }

  async convertFileToBase64(fileUri) {
    // Platform-specific implementation for converting file to base64
    try {
      if (typeof FileSystem !== 'undefined') {
        // Expo/React Native
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
      } else {
        throw new Error('File system access not available');
      }
    } catch (error) {
      throw new Error(`File conversion failed: ${error.message}`);
    }
  }

  getAuthToken() {
    // Get authentication token from secure storage
    // Implementation would use AsyncStorage, SecureStore, etc.
    try {
      // Placeholder - implement secure token retrieval
      return global.authToken || null;
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }

  getDefaultStyles() {
    return [
      {
        id: 'executive',
        name: 'Executive Professional',
        description: 'Premium executive headshot with formal business attire'
      },
      {
        id: 'creative',
        name: 'Creative Professional',
        description: 'Modern creative professional with stylish contemporary look'
      },
      {
        id: 'healthcare',
        name: 'Healthcare Professional',
        description: 'Trustworthy healthcare professional in medical attire'
      },
      {
        id: 'finance',
        name: 'Finance Professional',
        description: 'Authoritative finance executive in premium business suit'
      },
      {
        id: 'startup',
        name: 'Startup Professional',
        description: 'Modern startup founder with business casual styling'
      },
      {
        id: 'tech',
        name: 'Tech Professional',
        description: 'Contemporary technology professional with modern styling'
      }
    ];
  }

  handleSecureError(error) {
    // Handle different types of errors securely
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || 'API Error';
      
      switch (status) {
        case 401:
          return new Error('Authentication required. Please log in.');
        case 403:
          return new Error('Access denied. Insufficient permissions.');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(this.sanitizeErrorForClient(message));
      }
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error(this.sanitizeErrorForClient(error.message));
    }
  }

  sanitizeErrorForClient(errorMessage) {
    // Remove any potential sensitive information from error messages
    return errorMessage
      .replace(/api[_-]?key[s]?[:\s]*[a-zA-Z0-9_-]+/gi, '[REDACTED]')
      .replace(/token[s]?[:\s]*[a-zA-Z0-9_.-]+/gi, '[REDACTED]')
      .replace(/secret[s]?[:\s]*[a-zA-Z0-9_.-]+/gi, '[REDACTED]')
      .replace(/password[s]?[:\s]*[a-zA-Z0-9_.-]+/gi, '[REDACTED]');
  }

  logSecureError(operation, error, context = {}) {
    // Log errors for analytics without exposing sensitive data
    const sanitizedError = {
      operation,
      message: this.sanitizeErrorForClient(error.message),
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        platform: Environment.PLATFORM,
        isDevelopment: Environment.IS_DEVELOPMENT
      }
    };

    console.error('🔒 Secure AI Service Error:', sanitizedError);
    
    // Send to analytics service if available
    if (typeof Analytics !== 'undefined') {
      Analytics.logError('SecureAIService', sanitizedError);
    }
  }
}

// Export singleton instance
export default new SecureAIService();