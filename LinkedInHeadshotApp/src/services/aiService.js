// AI Service for Replicate API Integration
// This service handles communication with Replicate API for headshot generation

import axios from 'axios';

class AIService {
  constructor() {
    this.baseURL = 'https://api.replicate.com/v1';
    this.apiToken = null; // Will be set from environment variables
  }

  // Initialize the service with API token
  initialize(apiToken) {
    this.apiToken = apiToken;
    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Token ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Generate professional headshot using Replicate API
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

// Export singleton instance
export default new AIService();