/**
 * Replicate Professional Headshot Service
 * Using proven FLUX.1 and InstantID models for dramatic "WOW factor" transformations
 */

import * as FileSystem from 'expo-file-system';

// SECURITY REMEDIATION: HARDCODED TOKEN REMOVED
// CRITICAL VULNERABILITY FIXED: API token moved to secure backend
const SECURITY_NOTICE = "DEPRECATED: Use SecureAIService - hardcoded credentials removed for security";

// Professional styles with dramatic prompts
const PROFESSIONAL_STYLES = {
  professional: {
    name: 'Professional Executive',
    model: 'tencentarc/photomaker',
    version: '5eac336e92470e1a91a862eafedd8636cfad31cfc40c85bb2e0a1f17b3cc2b2c',
    prompt: 'professional executive headshot, wearing premium dark business suit, crisp white shirt, confident executive expression, studio lighting, corporate background, magazine quality photography, ultra realistic, 8K, award-winning portrait',
    negativePrompt: 'casual clothes, amateur, blurry, distorted, low quality, unprofessional, cartoon'
  },
  
  creative: {
    name: 'Creative Professional',
    model: 'lucataco/flux-dev-lora',
    version: 'f2ab8a5569c55169b2c2a4b4db4e76b73f3bcdf0306ad5a9ae6bc7b29b4d85db',
    prompt: 'creative professional headshot, stylish modern creative attire, artistic professional lighting, contemporary background, confident creative expression, fashion photography style, ultra realistic, dramatic lighting',
    negativePrompt: 'overly formal, stiff, corporate, amateur, low quality'
  },

  tech: {
    name: 'Tech Industry',
    model: 'lucataco/flux-dev-lora', 
    version: 'f2ab8a5569c55169b2c2a4b4db4e76b73f3bcdf0306ad5a9ae6bc7b29b4d85db',
    prompt: 'modern tech professional headshot, smart casual business attire, silicon valley style, innovative lighting, clean minimalist background, confident tech professional expression, contemporary photography',
    negativePrompt: 'outdated, overly formal, amateur, low quality'
  },

  healthcare: {
    name: 'Healthcare Professional',
    model: 'tencentarc/photomaker',
    version: '5eac336e92470e1a91a862eafedd8636cfad31cfc40c85bb2e0a1f17b3cc2b2c',
    prompt: 'healthcare professional headshot, pristine medical scrubs or white coat, clinical lighting, medical background, trustworthy caring expression, professional medical photography, ultra realistic',
    negativePrompt: 'unprofessional, casual, poor medical setting, amateur'
  },

  finance: {
    name: 'Finance & Banking',
    model: 'tencentarc/photomaker',
    version: '5eac336e92470e1a91a862eafedd8636cfad31cfc40c85bb2e0a1f17b3cc2b2c', 
    prompt: 'finance executive headshot, premium formal business suit and tie, elegant studio lighting, corporate background, authoritative confident expression, wall street executive photography, ultra realistic',
    negativePrompt: 'casual, unprofessional, poor lighting, amateur photography'
  },

  startup: {
    name: 'Startup Founder',
    model: 'lucataco/flux-dev-lora',
    version: 'f2ab8a5569c55169b2c2a4b4db4e76b73f3bcdf0306ad5a9ae6bc7b29b4d85db',
    prompt: 'startup founder headshot, modern premium casual business attire, entrepreneurial confidence, innovative lighting, tech startup background, visionary expression, silicon valley photography',
    negativePrompt: 'overly formal, corporate stiff, amateur, low quality'
  }
};

class ReplicateHeadshotService {
  constructor() {
    // SECURITY REMEDIATION: Service disabled to prevent credential exposure
    throw new Error('SECURITY ERROR: ReplicateHeadshotService is deprecated. Use SecureAIService instead. ' + SECURITY_NOTICE);
  }

  /**
   * Transform headshot using Replicate AI
   */
  async transformHeadshot(imageUri, style = 'professional') {
    try {
      console.log('🚀 Starting Replicate transformation...');
      console.log(`📋 Style: ${style}`);
      
      const styleConfig = PROFESSIONAL_STYLES[style];
      if (!styleConfig) {
        throw new Error(`Invalid style: ${style}`);
      }

      // Convert image to base64 for Replicate
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const imageDataUri = `data:image/jpeg;base64,${base64Image}`;

      // Create prediction
      const predictionPayload = {
        version: styleConfig.version,
        input: {
          image: imageDataUri,
          prompt: styleConfig.prompt,
          negative_prompt: styleConfig.negativePrompt,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          seed: Math.floor(Math.random() * 1000000),
          apply_watermark: false,
          output_format: "jpg",
          output_quality: 95,
          num_outputs: 1
        }
      };

      console.log('📡 Creating Replicate prediction...');
      
      const createResponse = await fetch(`${this.baseURL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(predictionPayload),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Replicate API error: ${createResponse.status} - ${errorText}`);
      }

      const prediction = await createResponse.json();
      console.log('✅ Prediction created:', prediction.id);

      // Poll for completion
      const result = await this.waitForCompletion(prediction.id);
      
      if (result.status === 'succeeded' && result.output && result.output.length > 0) {
        console.log('🎉 Replicate transformation SUCCESS!');
        
        // Download the result image
        const resultImageUrl = result.output[0];
        const localImageUri = await this.downloadImage(resultImageUrl);
        
        return {
          success: true,
          imageUri: localImageUri,
          provider: 'Replicate',
          model: styleConfig.model,
          style: styleConfig.name,
          predictionId: prediction.id,
          processingTime: new Date() - new Date(prediction.created_at)
        };
      } else {
        throw new Error(`Transformation failed: ${result.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('❌ Replicate transformation failed:', error);
      return {
        success: false,
        error: error.message,
        provider: 'Replicate'
      };
    }
  }

  /**
   * Poll for prediction completion
   */
  async waitForCompletion(predictionId, maxAttempts = 60, interval = 2000) {
    console.log(`⏳ Waiting for completion: ${predictionId}`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}/predictions/${predictionId}`, {
          headers: {
            'Authorization': `Token ${this.apiToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const result = await response.json();
        console.log(`📊 Status: ${result.status}`);

        if (result.status === 'succeeded') {
          return result;
        }

        if (result.status === 'failed') {
          throw new Error(`Prediction failed: ${result.error}`);
        }

        if (result.status === 'canceled') {
          throw new Error('Prediction was canceled');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval));
        
      } catch (error) {
        console.error('Polling error:', error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Transformation timeout - exceeded maximum wait time');
  }

  /**
   * Download image from URL to local storage
   */
  async downloadImage(imageUrl) {
    try {
      const timestamp = Date.now();
      const localUri = `${FileSystem.documentDirectory}replicate_result_${timestamp}.jpg`;

      const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);

      if (downloadResult.status === 200) {
        console.log('📥 Image downloaded successfully');
        return localUri;
      } else {
        throw new Error(`Download failed: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  /**
   * Get available styles
   */
  getAvailableStyles() {
    return Object.keys(PROFESSIONAL_STYLES).map(key => ({
      id: key,
      ...PROFESSIONAL_STYLES[key]
    }));
  }

  /**
   * Get style configuration
   */
  getStyleConfig(style) {
    return PROFESSIONAL_STYLES[style];
  }
}

export default new ReplicateHeadshotService();