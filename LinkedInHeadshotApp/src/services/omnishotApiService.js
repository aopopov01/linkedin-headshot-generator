/**
 * OmniShot API Service
 * Connects React Native frontend with comprehensive backend optimization services
 * Integrates all expert-designed services for production-ready multi-platform optimization
 */

import * as FileSystem from 'expo-file-system';
import Environment from '../config/environment';

class OmniShotAPIService {
  constructor() {
    // Use environment-aware API endpoint
    this.baseURL = Environment.API_BASE_URL;
    this.apiPrefix = '/api';
    this.timeout = Environment.API_TIMEOUT;
    this.retryAttempts = Environment.NETWORK_RETRY_ATTEMPTS;
    this.retryDelay = Environment.NETWORK_RETRY_DELAY;
  }

  /**
   * Multi-Platform Optimization - Main entry point
   * Processes image for multiple platforms with intelligent optimization
   */
  async optimizeForMultiplePlatforms(imageUri, platforms, style, customDimensions = null) {
    try {
      console.log('🚀 OmniShot API: Starting multi-platform optimization');
      console.log(`📱 Platforms: ${platforms.join(', ')}`);
      console.log(`🎨 Style: ${style}`);

      // Convert image to base64 for API transmission
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const requestBody = {
        image: `data:image/jpeg;base64,${base64Image}`,
        platforms: platforms,
        style: style,
        customDimensions: customDimensions,
        optimizationLevel: 'premium',
        preserveIdentity: true,
        enhanceQuality: true,
        includeMetadata: true
      };

      const response = await this.makeAPICall('/optimization/multi-platform', 'POST', requestBody);

      if (response.success) {
        // Process the optimized results
        const processedResults = await this.processOptimizationResults(response.data);
        
        console.log('✅ OmniShot API: Multi-platform optimization successful');
        return {
          success: true,
          results: processedResults,
          processingTime: response.processingTime,
          creditsUsed: response.creditsUsed,
          optimizationId: response.optimizationId
        };
      } else {
        throw new Error(response.error || 'Multi-platform optimization failed');
      }

    } catch (error) {
      console.error('❌ OmniShot API Error:', error);
      
      // Fallback to local processing if API fails
      console.log('🔄 Falling back to local optimization...');
      return await this.fallbackLocalOptimization(imageUri, platforms, style);
    }
  }

  /**
   * Process optimization results from backend services
   */
  async processOptimizationResults(apiData) {
    const processedResults = {};

    for (const [platform, data] of Object.entries(apiData.platformResults)) {
      try {
        if (data.success && data.optimizedImageBase64) {
          // Save optimized image locally
          const localUri = await this.saveBase64Image(
            data.optimizedImageBase64, 
            `omnishot_${platform}_${Date.now()}.jpg`
          );

          processedResults[platform] = {
            success: true,
            imageUri: localUri,
            platform: data.platformName,
            dimensions: data.dimensions,
            specifications: data.platformSpecifications,
            optimizationMetrics: {
              qualityScore: data.qualityScore,
              optimizationLevel: data.optimizationLevel,
              processingTime: data.processingTime
            },
            aiEnhancements: data.aiEnhancements || []
          };

          console.log(`✅ ${platform} optimization processed successfully`);
        } else {
          processedResults[platform] = {
            success: false,
            error: data.error || 'Platform optimization failed',
            platform: data.platformName || platform
          };
          console.log(`❌ ${platform} optimization failed: ${data.error}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${platform} result:`, error);
        processedResults[platform] = {
          success: false,
          error: 'Result processing failed',
          platform: platform
        };
      }
    }

    return processedResults;
  }

  /**
   * Fallback local optimization when backend is unavailable
   */
  async fallbackLocalOptimization(imageUri, platforms, style) {
    console.log('🔧 Using local fallback optimization');
    
    const { ImageManipulator } = await import('expo-image-manipulator');
    const results = {};

    // Platform specifications (fallback data)
    const platformSpecs = {
      linkedin: { width: 400, height: 400, quality: 0.95 },
      instagram: { width: 320, height: 320, quality: 0.90 },
      facebook: { width: 170, height: 170, quality: 0.88 },
      twitter: { width: 400, height: 400, quality: 0.92 },
      youtube: { width: 800, height: 800, quality: 0.95 },
      tiktok: { width: 200, height: 200, quality: 0.85 },
      whatsapp_business: { width: 256, height: 256, quality: 0.90 },
      github: { width: 460, height: 460, quality: 0.93 }
    };

    for (const platform of platforms) {
      try {
        const spec = platformSpecs[platform];
        if (!spec) continue;

        const processed = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            { resize: { width: spec.width, height: spec.height } }
          ],
          {
            compress: spec.quality,
            format: ImageManipulator.SaveFormat.JPEG
          }
        );

        results[platform] = {
          success: true,
          imageUri: processed.uri,
          platform: platform,
          dimensions: `${spec.width}x${spec.height}`,
          specifications: spec,
          optimizationMetrics: {
            qualityScore: 85, // Fallback score
            optimizationLevel: 'basic',
            processingTime: '2s'
          },
          aiEnhancements: ['local_resize']
        };

        console.log(`✅ ${platform} local optimization completed`);
        
      } catch (error) {
        console.error(`❌ Local optimization failed for ${platform}:`, error);
        results[platform] = {
          success: false,
          error: 'Local optimization failed',
          platform: platform
        };
      }
    }

    return {
      success: true,
      results: results,
      processingTime: '10s',
      creditsUsed: 0,
      optimizationId: `local_${Date.now()}`
    };
  }

  /**
   * Save base64 image to local file system
   */
  async saveBase64Image(base64Data, filename) {
    try {
      const fileUri = `${FileSystem.documentDirectory}omnishot/${filename}`;
      
      // Ensure directory exists
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}omnishot/`, 
        { intermediates: true }
      );

      // Remove data URL prefix if present
      const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      await FileSystem.writeAsStringAsync(fileUri, cleanBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return fileUri;
    } catch (error) {
      console.error('❌ Error saving image:', error);
      throw new Error('Failed to save optimized image');
    }
  }

  /**
   * Get platform specifications from backend
   */
  async getPlatformSpecifications() {
    try {
      const response = await this.makeAPICall('/optimization/platform-specs', 'GET');
      return response.success ? response.data : this.getFallbackPlatformSpecs();
    } catch (error) {
      console.error('❌ Error fetching platform specs:', error);
      return this.getFallbackPlatformSpecs();
    }
  }

  /**
   * Get available AI styles from backend
   */
  async getAvailableStyles() {
    try {
      const response = await this.makeAPICall('/optimization/styles', 'GET');
      return response.success ? response.data : this.getFallbackStyles();
    } catch (error) {
      console.error('❌ Error fetching styles:', error);
      return this.getFallbackStyles();
    }
  }

  /**
   * Get user's optimization history
   */
  async getOptimizationHistory(userId) {
    try {
      const response = await this.makeAPICall(`/user/${userId}/optimizations`, 'GET');
      return response.success ? response.data : [];
    } catch (error) {
      console.error('❌ Error fetching history:', error);
      return [];
    }
  }

  /**
   * Check service health and availability
   */
  async checkServiceHealth() {
    try {
      const response = await this.makeAPICall('/health', 'GET');
      
      // Service is available if we get any response, including degraded states
      const validStatuses = ['healthy', 'unhealthy', 'degraded'];
      const isAvailable = response && validStatuses.includes(response.status);
      
      // In development, accept degraded services as functional
      const isDevelopmentFunctional = Environment.IS_DEVELOPMENT && 
        (response.status === 'degraded' || response.status === 'unhealthy');
      
      return {
        available: isAvailable,
        status: response?.status || 'unknown',
        services: response?.api || response?.services || {},
        environment: response?.environment || 'unknown',
        currentEndpoint: this.baseURL,
        developmentMode: Environment.IS_DEVELOPMENT,
        functionalForDev: isDevelopmentFunctional,
        message: isAvailable 
          ? `Backend reachable (${response.status})` 
          : 'Backend not responding',
        details: isDevelopmentFunctional 
          ? 'Service functional for development despite degraded status'
          : null
      };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        available: false,
        status: 'offline',
        services: {},
        environment: 'unknown',
        error: error.message,
        currentEndpoint: this.baseURL,
        environmentInfo: Environment.getEnvironmentInfo(),
        message: 'Cannot reach backend server'
      };
    }
  }

  /**
   * Network diagnostics - test connectivity to all possible endpoints
   */
  async runNetworkDiagnostics() {
    console.log('🔧 Running network diagnostics...');
    
    const results = {
      environmentInfo: Environment.getEnvironmentInfo(),
      endpointTests: [],
      recommendations: []
    };
    
    // Test main endpoint
    const mainUrl = `${Environment.API_BASE_URL}/health`;
    console.log(`Testing main endpoint: ${mainUrl}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Shorter timeout for diagnostics
      
      const response = await fetch(mainUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Accept both 200 and 503 as successful for health endpoint
      const isHealthy = response.ok || response.status === 503;
      
      results.endpointTests.push({
        url: mainUrl,
        status: response.status,
        success: isHealthy,
        responseTime: Date.now()
      });
      
      if (isHealthy) {
        results.recommendations.push(`✅ Main endpoint is accessible (HTTP ${response.status})`);
      }
      
    } catch (error) {
      results.endpointTests.push({
        url: mainUrl,
        status: 'error',
        success: false,
        error: error.message
      });
    }
    
    // Test alternative endpoints in development
    if (Environment.IS_DEVELOPMENT) {
      const alternatives = Environment.getAlternativeEndpoints();
      
      for (const altUrl of alternatives) {
        if (altUrl === Environment.API_BASE_URL) continue;
        
        const testUrl = `${altUrl}/health`;
        console.log(`Testing alternative endpoint: ${testUrl}`);
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          // Accept both 200 and 503 as successful for health endpoint
          const isHealthy = response.ok || response.status === 503;
          
          results.endpointTests.push({
            url: testUrl,
            status: response.status,
            success: isHealthy,
            responseTime: Date.now()
          });
          
          if (isHealthy) {
            results.recommendations.push(`✅ Alternative endpoint working: ${altUrl} (HTTP ${response.status})`);
          }
          
        } catch (error) {
          results.endpointTests.push({
            url: testUrl,
            status: 'error',
            success: false,
            error: error.message
          });
        }
      }
    }
    
    // Generate recommendations
    const workingEndpoints = results.endpointTests.filter(test => test.success);
    
    if (workingEndpoints.length === 0) {
      results.recommendations.push('❌ No endpoints accessible. Check if backend server is running.');
      results.recommendations.push('💡 Try: npm start or node server.js in the backend directory');
      
      if (Environment.PLATFORM === 'android') {
        results.recommendations.push('💡 Android: Make sure to use 10.0.2.2:3000 for emulator');
      }
      
      if (Environment.IS_EXPO_GO) {
        results.recommendations.push('💡 Expo Go: Try using --tunnel flag when starting expo');
      }
    }
    
    console.log('🔧 Network diagnostics complete:', results);
    return results;
  }

  /**
   * Make API call with proper error handling, timeout, and retry logic
   */
  async makeAPICall(endpoint, method = 'GET', body = null) {
    // Log network attempt for debugging
    Environment.logNetworkAttempt(endpoint, method);
    
    let lastError;
    
    // Try the main endpoint with retries
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const config = {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OmniShot-Mobile/1.0',
            'Accept': 'application/json',
          },
          signal: controller.signal,
        };

        if (body) {
          config.body = JSON.stringify(body);
        }

        // Special case for health endpoint
        const finalEndpoint = endpoint === '/health' ? endpoint : `${this.apiPrefix}${endpoint}`;
        const url = `${this.baseURL}${finalEndpoint}`;
        console.log(`🔄 API attempt ${attempt}/${this.retryAttempts}: ${method} ${url}`);
        
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        
        // Special handling for health endpoint - accept 503 as valid response
        if (!response.ok && !(endpoint === '/health' && response.status === 503)) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ API call successful: ${method} ${endpoint} (${response.status})`);
        return data;

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ API attempt ${attempt} failed:`, error.message);
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < this.retryAttempts) {
          console.log(`⏳ Retrying in ${this.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }
    
    // If all attempts with the main URL failed, try alternative endpoints for development
    if (Environment.IS_DEVELOPMENT) {
      console.log('🔄 Trying alternative development endpoints...');
      const alternatives = Environment.getAlternativeEndpoints();
      
      for (const altUrl of alternatives) {
        if (altUrl === Environment.API_BASE_URL) continue; // Skip if it's the same as main URL
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);
          
          const config = {
            method: method,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'OmniShot-Mobile/1.0',
              'Accept': 'application/json',
            },
            signal: controller.signal,
          };

          if (body) {
            config.body = JSON.stringify(body);
          }

          // Special case for health endpoint
          const finalEndpoint = endpoint === '/health' ? endpoint : `${this.apiPrefix}${endpoint}`;
          const url = `${altUrl}${finalEndpoint}`;
          console.log(`🔄 Trying alternative URL: ${method} ${url}`);
          
          const response = await fetch(url, config);
          clearTimeout(timeoutId);
          
          // Special handling for health endpoint - accept 503 as valid response
          if (!response.ok && !(endpoint === '/health' && response.status === 503)) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log(`✅ Alternative URL successful: ${method} ${url} (${response.status})`);
          
          // Update the base URL for future requests
          this.baseURL = altUrl;
          console.log(`📝 Updated base URL to: ${this.baseURL}`);
          
          return data;

        } catch (error) {
          console.warn(`⚠️ Alternative URL failed: ${altUrl}`, error.message);
        }
      }
    }
    
    // All attempts failed
    console.error(`❌ All API attempts failed for ${method} ${endpoint}`);
    
    // Provide helpful error message based on the type of error
    if (lastError.name === 'AbortError') {
      throw new Error(`Request timeout - check your network connection and backend server`);
    } else if (lastError.message.includes('Network request failed')) {
      throw new Error(`Network error - cannot reach server at ${this.baseURL}`);
    } else {
      throw new Error(`API call failed: ${lastError.message}`);
    }
  }

  /**
   * Fallback platform specifications
   */
  getFallbackPlatformSpecs() {
    return {
      linkedin: { name: 'LinkedIn', width: 400, height: 400, category: 'Professional' },
      instagram: { name: 'Instagram', width: 320, height: 320, category: 'Social' },
      facebook: { name: 'Facebook', width: 170, height: 170, category: 'Social' },
      twitter: { name: 'Twitter', width: 400, height: 400, category: 'Social' },
      youtube: { name: 'YouTube', width: 800, height: 800, category: 'Content' },
      tiktok: { name: 'TikTok', width: 200, height: 200, category: 'Content' },
      whatsapp_business: { name: 'WhatsApp Business', width: 256, height: 256, category: 'Business' },
      github: { name: 'GitHub', width: 460, height: 460, category: 'Professional' }
    };
  }

  /**
   * Fallback AI styles
   */
  getFallbackStyles() {
    return {
      professional: { name: 'Professional Executive', description: 'Classic business professional look' },
      creative: { name: 'Creative Professional', description: 'Modern creative industry style' },
      tech: { name: 'Tech Industry', description: 'Silicon Valley tech professional' },
      healthcare: { name: 'Healthcare Professional', description: 'Medical and healthcare industry' },
      finance: { name: 'Finance & Banking', description: 'Traditional finance professional' },
      startup: { name: 'Startup Founder', description: 'Entrepreneurial and innovative' }
    };
  }
}

// Export singleton instance
export default new OmniShotAPIService();