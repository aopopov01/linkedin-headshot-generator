/**
 * API Integration Layer
 * Unified interface for external API integrations and third-party services
 * Handles authentication, rate limiting, error handling, and service orchestration
 */

class APIIntegrationLayer {
  constructor() {
    // API configuration
    this.config = {
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      rateLimits: {
        replicate: { requestsPerMinute: 10, requestsPerHour: 100 },
        openai: { requestsPerMinute: 20, requestsPerHour: 200 },
        stability: { requestsPerMinute: 5, requestsPerHour: 50 }
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000 // 1 minute
      }
    };

    // API providers configuration
    this.providers = {
      replicate: {
        name: 'Replicate',
        baseURL: 'https://api.replicate.com/v1',
        apiKey: process.env.REPLICATE_API_TOKEN,
        available: !!process.env.REPLICATE_API_TOKEN,
        endpoints: {
          predictions: '/predictions',
          models: '/models'
        }
      },
      
      openai: {
        name: 'OpenAI',
        baseURL: 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY,
        available: !!process.env.OPENAI_API_KEY,
        endpoints: {
          images: '/images',
          edits: '/images/edits'
        }
      },
      
      stability: {
        name: 'Stability AI',
        baseURL: 'https://api.stability.ai/v1',
        apiKey: process.env.STABILITY_API_KEY,
        available: !!process.env.STABILITY_API_KEY,
        endpoints: {
          generation: '/generation',
          upscaling: '/upscaling'
        }
      },
      
      cloudinary: {
        name: 'Cloudinary',
        baseURL: 'https://api.cloudinary.com/v1_1',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        available: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
        endpoints: {
          upload: '/image/upload',
          transform: '/image/upload'
        }
      }
    };

    // Rate limiting state
    this.rateLimitState = {};
    
    // Circuit breaker state
    this.circuitBreakerState = {};
    
    // Request metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      providerStats: {},
      rateLimitHits: 0,
      circuitBreakerTrips: 0
    };

    // Initialize rate limiters and circuit breakers
    this.initializeProviders();
  }

  /**
   * Initialize provider configurations
   */
  initializeProviders() {
    for (const [providerId, provider] of Object.entries(this.providers)) {
      // Initialize rate limiting
      this.rateLimitState[providerId] = {
        requests: [],
        blocked: false,
        blockUntil: null
      };
      
      // Initialize circuit breaker
      this.circuitBreakerState[providerId] = {
        state: 'closed', // closed, open, half-open
        failures: 0,
        lastFailure: null,
        nextAttempt: null
      };
      
      // Initialize provider metrics
      this.metrics.providerStats[providerId] = {
        requests: 0,
        successes: 0,
        failures: 0,
        averageTime: 0,
        available: provider.available
      };
    }
    
    console.log(`🔌 API Integration Layer initialized with ${this.getAvailableProviders().length} providers`);
  }

  /**
   * Make API request with full error handling and retry logic
   */
  async makeAPIRequest(providerId, endpoint, options = {}) {
    const startTime = Date.now();
    
    try {
      this.metrics.totalRequests++;
      
      // Validate provider
      const provider = this.providers[providerId];
      if (!provider) {
        throw new Error(`Unknown provider: ${providerId}`);
      }
      
      if (!provider.available) {
        throw new Error(`Provider ${providerId} not available (missing configuration)`);
      }

      // Check circuit breaker
      if (!this.checkCircuitBreaker(providerId)) {
        throw new Error(`Provider ${providerId} circuit breaker is open`);
      }

      // Check rate limits
      if (!this.checkRateLimit(providerId)) {
        this.metrics.rateLimitHits++;
        throw new Error(`Rate limit exceeded for provider ${providerId}`);
      }

      // Make request with retry logic
      const response = await this.executeRequestWithRetry(provider, endpoint, options);
      
      // Record successful request
      this.recordSuccess(providerId, Date.now() - startTime);
      
      return response;

    } catch (error) {
      this.recordFailure(providerId, error, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Execute request with retry logic
   */
  async executeRequestWithRetry(provider, endpoint, options) {
    let lastError = null;
    
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        return await this.executeSingleRequest(provider, endpoint, options);
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          throw error;
        }
        
        // Wait before retry
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Execute single API request
   */
  async executeSingleRequest(provider, endpoint, options) {
    const url = `${provider.baseURL}${endpoint}`;
    const requestOptions = this.buildRequestOptions(provider, options);
    
    console.log(`🔗 Making request to ${provider.name}: ${endpoint}`);
    
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`${provider.name} API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.arrayBuffer();
    }
  }

  /**
   * Build request options for specific provider
   */
  buildRequestOptions(provider, options) {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'OmniShot/1.0',
        ...this.getAuthHeaders(provider),
        ...(options.headers || {})
      },
      signal: AbortSignal.timeout(this.config.timeout)
    };

    // Add body if provided
    if (options.body) {
      if (options.body instanceof FormData) {
        requestOptions.body = options.body;
        // Don't set Content-Type for FormData, let browser set it
      } else if (typeof options.body === 'object') {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(options.body);
      } else {
        requestOptions.body = options.body;
      }
    }

    return requestOptions;
  }

  /**
   * Get authentication headers for provider
   */
  getAuthHeaders(provider) {
    const headers = {};
    
    switch (provider.name) {
      case 'Replicate':
        if (provider.apiKey) {
          headers['Authorization'] = `Token ${provider.apiKey}`;
        }
        break;
        
      case 'OpenAI':
        if (provider.apiKey) {
          headers['Authorization'] = `Bearer ${provider.apiKey}`;
        }
        break;
        
      case 'Stability AI':
        if (provider.apiKey) {
          headers['Authorization'] = `Bearer ${provider.apiKey}`;
        }
        break;
        
      case 'Cloudinary':
        // Cloudinary uses different auth mechanism
        break;
    }
    
    return headers;
  }

  /**
   * Check if request should not be retried
   */
  shouldNotRetry(error) {
    const message = error.message.toLowerCase();
    
    // Don't retry on authentication errors
    if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
      return true;
    }
    
    // Don't retry on client errors (4xx except rate limits)
    if (message.includes('400') || message.includes('404')) {
      return true;
    }
    
    // Don't retry on rate limit errors (will be handled by rate limiter)
    if (message.includes('429') || message.includes('rate limit')) {
      return true;
    }
    
    return false;
  }

  /**
   * Check rate limit for provider
   */
  checkRateLimit(providerId) {
    const rateLimitConfig = this.config.rateLimits[providerId];
    if (!rateLimitConfig) {
      return true; // No rate limit configured
    }
    
    const state = this.rateLimitState[providerId];
    const now = Date.now();
    
    // Clean old requests
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    
    state.requests = state.requests.filter(timestamp => timestamp > oneHourAgo);
    
    // Check minute limit
    const recentRequests = state.requests.filter(timestamp => timestamp > oneMinuteAgo);
    if (recentRequests.length >= rateLimitConfig.requestsPerMinute) {
      console.warn(`⚠️ Rate limit exceeded for ${providerId}: ${recentRequests.length}/${rateLimitConfig.requestsPerMinute} per minute`);
      return false;
    }
    
    // Check hour limit
    if (state.requests.length >= rateLimitConfig.requestsPerHour) {
      console.warn(`⚠️ Rate limit exceeded for ${providerId}: ${state.requests.length}/${rateLimitConfig.requestsPerHour} per hour`);
      return false;
    }
    
    // Record request
    state.requests.push(now);
    return true;
  }

  /**
   * Check circuit breaker state
   */
  checkCircuitBreaker(providerId) {
    const state = this.circuitBreakerState[providerId];
    const now = Date.now();
    
    switch (state.state) {
      case 'closed':
        return true;
        
      case 'open':
        if (now >= state.nextAttempt) {
          state.state = 'half-open';
          console.log(`🔄 Circuit breaker for ${providerId} moving to half-open`);
          return true;
        }
        return false;
        
      case 'half-open':
        return true;
        
      default:
        return true;
    }
  }

  /**
   * Record successful request
   */
  recordSuccess(providerId, responseTime) {
    this.metrics.successfulRequests++;
    
    // Update provider stats
    const providerStats = this.metrics.providerStats[providerId];
    providerStats.requests++;
    providerStats.successes++;
    
    // Update average time
    const totalTime = providerStats.averageTime * (providerStats.requests - 1) + responseTime;
    providerStats.averageTime = totalTime / providerStats.requests;
    
    // Update overall average
    const totalTime2 = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime2 / this.metrics.totalRequests;
    
    // Reset circuit breaker on success
    const circuitState = this.circuitBreakerState[providerId];
    if (circuitState.state === 'half-open') {
      circuitState.state = 'closed';
      circuitState.failures = 0;
      console.log(`✅ Circuit breaker for ${providerId} reset to closed`);
    }
    
    console.log(`✅ API request to ${providerId} succeeded in ${responseTime}ms`);
  }

  /**
   * Record failed request
   */
  recordFailure(providerId, error, responseTime) {
    this.metrics.failedRequests++;
    
    // Update provider stats
    const providerStats = this.metrics.providerStats[providerId];
    providerStats.requests++;
    providerStats.failures++;
    
    // Update circuit breaker
    const circuitState = this.circuitBreakerState[providerId];
    circuitState.failures++;
    circuitState.lastFailure = Date.now();
    
    if (circuitState.failures >= this.config.circuitBreaker.failureThreshold) {
      circuitState.state = 'open';
      circuitState.nextAttempt = Date.now() + this.config.circuitBreaker.resetTimeout;
      this.metrics.circuitBreakerTrips++;
      console.warn(`🔴 Circuit breaker for ${providerId} opened after ${circuitState.failures} failures`);
    }
    
    console.error(`❌ API request to ${providerId} failed: ${error.message}`);
  }

  /**
   * Provider-specific API methods
   */
  
  // Replicate API methods
  async replicateCreatePrediction(modelVersion, input) {
    return this.makeAPIRequest('replicate', '/predictions', {
      method: 'POST',
      body: {
        version: modelVersion,
        input
      }
    });
  }

  async replicateGetPrediction(predictionId) {
    return this.makeAPIRequest('replicate', `/predictions/${predictionId}`);
  }

  // OpenAI API methods
  async openaiCreateImageEdit(imageFile, prompt, options = {}) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', prompt);
    
    if (options.mask) formData.append('mask', options.mask);
    if (options.n) formData.append('n', options.n.toString());
    if (options.size) formData.append('size', options.size);
    
    return this.makeAPIRequest('openai', '/images/edits', {
      method: 'POST',
      body: formData
    });
  }

  // Stability AI methods
  async stabilityGenerateImage(engineId, prompt, options = {}) {
    return this.makeAPIRequest('stability', `/generation/${engineId}/text-to-image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      body: {
        text_prompts: [{ text: prompt }],
        cfg_scale: options.cfg_scale || 7,
        height: options.height || 512,
        width: options.width || 512,
        samples: options.samples || 1,
        steps: options.steps || 20
      }
    });
  }

  // Cloudinary methods
  async cloudinaryUpload(imageBuffer, options = {}) {
    // Cloudinary upload implementation would go here
    // This is a simplified placeholder
    console.log('📤 Cloudinary upload requested');
    return { secure_url: 'https://example.cloudinary.com/image.jpg' };
  }

  /**
   * Health check for all providers
   */
  async healthCheckProviders() {
    const providerHealth = {};
    
    for (const [providerId, provider] of Object.entries(this.providers)) {
      try {
        if (!provider.available) {
          providerHealth[providerId] = {
            status: 'unavailable',
            reason: 'Missing configuration'
          };
          continue;
        }

        // Check circuit breaker state
        const circuitState = this.circuitBreakerState[providerId];
        if (circuitState.state === 'open') {
          providerHealth[providerId] = {
            status: 'circuit_open',
            reason: 'Circuit breaker is open',
            nextAttempt: new Date(circuitState.nextAttempt).toISOString()
          };
          continue;
        }

        // Simple health check (could be enhanced with actual API calls)
        providerHealth[providerId] = {
          status: 'healthy',
          circuitState: circuitState.state,
          failures: circuitState.failures,
          stats: this.metrics.providerStats[providerId]
        };

      } catch (error) {
        providerHealth[providerId] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    return providerHealth;
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return Object.entries(this.providers)
      .filter(([, provider]) => provider.available)
      .map(([id, provider]) => ({ id, name: provider.name }));
  }

  /**
   * Get integration metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 
        ? ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      availableProviders: this.getAvailableProviders().length,
      totalProviders: Object.keys(this.providers).length
    };
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for API integration layer
   */
  async healthCheck() {
    try {
      const providerHealth = await this.healthCheckProviders();
      const availableProviders = Object.values(providerHealth).filter(p => p.status === 'healthy').length;
      
      return {
        status: availableProviders > 0 ? 'healthy' : 'degraded',
        metrics: this.getMetrics(),
        providers: providerHealth,
        configuration: {
          timeout: `${this.config.timeout / 1000}s`,
          retryAttempts: this.config.retryAttempts,
          circuitBreakerThreshold: this.config.circuitBreaker.failureThreshold
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = { APIIntegrationLayer };