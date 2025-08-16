/**
 * Cost Optimization Service
 * Optimizes processing costs and resource allocation for OmniShot
 * Manages budget constraints and processing strategy selection
 */

class CostOptimizationService {
  constructor() {
    // Cost configuration - Updated with real-world estimates
    this.costs = {
      aiProviders: {
        replicate: {
          costPerImage: 0.02, // $0.02 per image (actual Replicate pricing)
          avgProcessingTime: 15000, // 15 seconds
          qualityScore: 0.95,
          successRate: 0.98,
          availabilityRate: 0.99
        },
        openai: {
          costPerImage: 0.04, // $0.04 per image (DALL-E pricing estimate)
          avgProcessingTime: 8000, // 8 seconds
          qualityScore: 0.90,
          successRate: 0.96,
          availabilityRate: 0.98
        },
        stability: {
          costPerImage: 0.018, // $0.018 per image (Stability AI pricing)
          avgProcessingTime: 12000, // 12 seconds
          qualityScore: 0.92,
          successRate: 0.97,
          availabilityRate: 0.97
        },
        local: {
          costPerImage: 0.002, // $0.002 per image (compute cost only)
          avgProcessingTime: 3000, // 3 seconds
          qualityScore: 0.75,
          successRate: 0.99,
          availabilityRate: 1.0
        }
      },
      
      // Platform processing complexity costs
      platformComplexity: {
        linkedin: { multiplier: 1.0, priority: 'high' },
        instagram: { multiplier: 1.2, priority: 'high' },
        facebook: { multiplier: 1.0, priority: 'medium' },
        twitter: { multiplier: 0.8, priority: 'medium' },
        youtube: { multiplier: 1.5, priority: 'high' },
        tiktok: { multiplier: 1.3, priority: 'medium' },
        whatsapp_business: { multiplier: 0.9, priority: 'low' },
        github: { multiplier: 0.7, priority: 'low' }
      },

      // Budget tiers
      budgetTiers: {
        free: {
          maxCostPerRequest: 0.01,
          maxPlatforms: 2,
          aiProviderRestriction: 'local',
          features: ['basic_optimization', 'standard_platforms']
        },
        basic: {
          maxCostPerRequest: 0.10,
          maxPlatforms: 5,
          aiProviderRestriction: 'hybrid',
          features: ['ai_optimization', 'all_platforms', 'batch_processing']
        },
        premium: {
          maxCostPerRequest: 0.50,
          maxPlatforms: 8,
          aiProviderRestriction: 'premium',
          features: ['premium_ai', 'all_platforms', 'priority_processing', 'custom_dimensions']
        },
        enterprise: {
          maxCostPerRequest: 2.00,
          maxPlatforms: 16,
          aiProviderRestriction: 'unlimited',
          features: ['enterprise_ai', 'unlimited_platforms', 'priority_queue', 'dedicated_support']
        }
      }
    };

    // Optimization metrics
    this.metrics = {
      totalRequests: 0,
      totalCostSaved: 0,
      avgCostPerRequest: 0,
      strategyDistribution: {},
      budgetUtilization: {}
    };
  }

  /**
   * Optimize processing strategy based on budget and requirements
   */
  async optimizeProcessingStrategy(platforms, imageAnalysis, budget = 'basic') {
    try {
      console.log(`💰 Optimizing processing strategy for budget: ${budget}`);
      
      const budgetConfig = this.costs.budgetTiers[budget];
      if (!budgetConfig) {
        throw new Error(`Invalid budget tier: ${budget}`);
      }

      // Calculate base costs for requested platforms
      const platformCosts = this.calculatePlatformCosts(platforms, imageAnalysis);
      const totalBaseCost = platformCosts.reduce((sum, p) => sum + p.cost, 0);

      console.log(`📊 Base cost estimate: $${totalBaseCost.toFixed(4)} for ${platforms.length} platforms`);

      // Apply budget constraints
      if (platforms.length > budgetConfig.maxPlatforms) {
        console.log(`⚠️ Platform limit exceeded (${platforms.length} > ${budgetConfig.maxPlatforms}), prioritizing platforms`);
        platforms = this.prioritizePlatforms(platforms, budgetConfig.maxPlatforms);
      }

      // Select optimal processing strategy
      const strategy = this.selectOptimalStrategy(
        platforms,
        budgetConfig,
        totalBaseCost,
        imageAnalysis
      );

      // Update metrics
      this.updateMetrics(budget, strategy, totalBaseCost);

      console.log(`✅ Optimized strategy: ${strategy.name} (Estimated cost: $${strategy.estimatedCost.toFixed(4)})`);

      return strategy;

    } catch (error) {
      console.error('❌ Cost optimization failed:', error);
      return this.getFallbackStrategy(platforms);
    }
  }

  /**
   * Calculate costs for each platform based on complexity
   */
  calculatePlatformCosts(platforms, imageAnalysis) {
    return platforms.map(platform => {
      const complexity = this.costs.platformComplexity[platform] || { multiplier: 1.0, priority: 'medium' };
      
      // Base cost factors
      let baseCost = 0.01; // $0.01 base
      
      // Image complexity factors
      const imagePixels = imageAnalysis.width * imageAnalysis.height;
      const pixelMultiplier = Math.min(imagePixels / (1024 * 1024), 4); // Max 4x for large images
      
      // Quality requirements
      const qualityMultiplier = imageAnalysis.sharpness < 0.5 ? 1.5 : 1.0; // More processing for poor quality
      
      const totalCost = baseCost * complexity.multiplier * pixelMultiplier * qualityMultiplier;
      
      return {
        platform,
        cost: totalCost,
        complexity: complexity.multiplier,
        priority: complexity.priority,
        processingTime: this.estimateProcessingTime(platform, imageAnalysis)
      };
    });
  }

  /**
   * Prioritize platforms based on importance and cost efficiency
   */
  prioritizePlatforms(platforms, maxPlatforms) {
    const platformScores = platforms.map(platform => {
      const complexity = this.costs.platformComplexity[platform];
      
      // Scoring factors
      const priorityScore = {
        'high': 10,
        'medium': 5,
        'low': 2
      }[complexity.priority];
      
      const efficiencyScore = 5 / complexity.multiplier; // Lower multiplier = higher efficiency
      
      return {
        platform,
        score: priorityScore + efficiencyScore,
        priority: complexity.priority
      };
    });

    // Sort by score and take top platforms
    const sortedPlatforms = platformScores
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPlatforms)
      .map(item => item.platform);

    console.log(`📱 Prioritized platforms: ${sortedPlatforms.join(', ')}`);
    return sortedPlatforms;
  }

  /**
   * Select optimal processing strategy
   */
  selectOptimalStrategy(platforms, budgetConfig, baseCost, imageAnalysis, recommendedProvider = null) {
    const strategies = [];

    // Strategy 1: Local Processing Only
    const localTime = this.predictProcessingTime('local', platforms, imageAnalysis);
    strategies.push({
      name: 'local_optimized',
      description: 'Cost-effective local processing',
      includeAI: false,
      aiProvider: 'local',
      estimatedCost: platforms.length * this.costs.aiProviders.local.costPerImage,
      estimatedTime: localTime,
      qualityScore: this.costs.aiProviders.local.qualityScore,
      features: ['basic_optimization', 'fast_processing', 'no_external_dependency'],
      reasons: this.generateProviderReasons('local', this.costs.aiProviders.local, imageAnalysis)
    });

    // Strategy 2: AI Processing (using recommended provider if available)
    if (budgetConfig.aiProviderRestriction !== 'local') {
      const aiProvider = recommendedProvider && recommendedProvider !== 'local' ? recommendedProvider : 'stability';
      const aiConfig = this.costs.aiProviders[aiProvider];
      
      if (aiConfig) {
        const aiCost = platforms.length * aiConfig.costPerImage;
        const aiTime = this.predictProcessingTime(aiProvider, platforms, imageAnalysis);
        
        if (aiCost <= budgetConfig.maxCostPerRequest) {
          strategies.push({
            name: `ai_enhanced_${aiProvider}`,
            description: `AI-enhanced processing with ${aiProvider}`,
            includeAI: true,
            aiProvider: aiProvider,
            estimatedCost: aiCost,
            estimatedTime: aiTime,
            qualityScore: aiConfig.qualityScore,
            features: ['ai_optimization', 'professional_quality', 'smart_enhancement'],
            reasons: this.generateProviderReasons(aiProvider, aiConfig, imageAnalysis)
          });
        }
      }
    }

    // Strategy 3: Premium Multi-Provider (if unlimited budget)
    if (budgetConfig.aiProviderRestriction === 'unlimited') {
      const premiumProviders = ['replicate', 'openai'];
      
      for (const provider of premiumProviders) {
        const providerConfig = this.costs.aiProviders[provider];
        if (providerConfig) {
          const premiumCost = platforms.length * providerConfig.costPerImage;
          const premiumTime = this.predictProcessingTime(provider, platforms, imageAnalysis);
          
          if (premiumCost <= budgetConfig.maxCostPerRequest) {
            strategies.push({
              name: `premium_${provider}`,
              description: `Premium ${provider} AI optimization`,
              includeAI: true,
              aiProvider: provider,
              estimatedCost: premiumCost,
              estimatedTime: premiumTime,
              qualityScore: providerConfig.qualityScore,
              features: ['premium_ai', 'maximum_quality', 'professional_enhancement'],
              reasons: this.generateProviderReasons(provider, providerConfig, imageAnalysis)
            });
          }
        }
      }
    }

    // Select best strategy within budget
    const affordableStrategies = strategies.filter(s => s.estimatedCost <= budgetConfig.maxCostPerRequest);
    
    if (affordableStrategies.length === 0) {
      console.log('⚠️ No strategies within budget, using fallback');
      return this.getFallbackStrategy(platforms);
    }

    // Choose strategy with best quality-to-cost ratio
    const selectedStrategy = affordableStrategies.reduce((best, current) => {
      const bestRatio = best.qualityScore / best.estimatedCost;
      const currentRatio = current.qualityScore / current.estimatedCost;
      return currentRatio > bestRatio ? current : best;
    });

    return selectedStrategy;
  }

  /**
   * Get fallback strategy for budget/error conditions
   */
  getFallbackStrategy(platforms) {
    return {
      name: 'fallback_local',
      description: 'Emergency fallback to local processing',
      includeAI: false,
      aiProvider: 'local',
      estimatedCost: 0.005, // Very low cost
      estimatedTime: platforms.length * 2000, // 2s per platform
      qualityScore: 0.70,
      features: ['basic_optimization', 'guaranteed_processing']
    };
  }

  /**
   * Estimate processing time for platform
   */
  estimateProcessingTime(platform, imageAnalysis) {
    const baseTime = 2000; // 2 seconds base
    const complexity = this.costs.platformComplexity[platform].multiplier;
    const imageSize = imageAnalysis.width * imageAnalysis.height;
    const sizeMultiplier = Math.min(imageSize / (1024 * 1024), 3);
    
    return Math.round(baseTime * complexity * sizeMultiplier);
  }

  /**
   * Calculate potential cost savings
   */
  calculateSavings(originalCost, optimizedCost) {
    const savings = Math.max(0, originalCost - optimizedCost);
    const savingsPercent = originalCost > 0 ? (savings / originalCost * 100).toFixed(1) : 0;
    
    return {
      amount: savings,
      percentage: `${savingsPercent}%`,
      originalCost,
      optimizedCost
    };
  }

  /**
   * Get budget recommendations for user
   */
  getBudgetRecommendations(platforms, imageAnalysis) {
    const recommendations = [];
    
    for (const [budgetTier, config] of Object.entries(this.costs.budgetTiers)) {
      const strategy = this.selectOptimalStrategy(platforms, config, 0.05, imageAnalysis);
      
      recommendations.push({
        tier: budgetTier,
        maxPlatforms: config.maxPlatforms,
        estimatedCost: strategy.estimatedCost,
        features: config.features,
        recommended: platforms.length <= config.maxPlatforms && strategy.estimatedCost <= config.maxCostPerRequest
      });
    }
    
    return recommendations.sort((a, b) => a.estimatedCost - b.estimatedCost);
  }

  /**
   * Monitor cost efficiency over time
   */
  analyzeCostEfficiency(timeRange = '24h') {
    const analysis = {
      timeRange,
      totalRequests: this.metrics.totalRequests,
      averageCost: this.metrics.avgCostPerRequest,
      totalSavings: this.metrics.totalCostSaved,
      strategyEfficiency: {}
    };

    // Calculate efficiency for each strategy
    for (const [strategy, usage] of Object.entries(this.metrics.strategyDistribution)) {
      const efficiency = usage.totalQuality / usage.totalCost;
      analysis.strategyEfficiency[strategy] = {
        usage: usage.count,
        efficiency: efficiency.toFixed(3),
        avgCost: (usage.totalCost / usage.count).toFixed(4),
        avgQuality: (usage.totalQuality / usage.count).toFixed(2)
      };
    }

    return analysis;
  }

  /**
   * Update optimization metrics
   */
  updateMetrics(budget, strategy, baseCost) {
    this.metrics.totalRequests++;
    
    // Update cost metrics
    const totalCost = this.metrics.avgCostPerRequest * (this.metrics.totalRequests - 1) + strategy.estimatedCost;
    this.metrics.avgCostPerRequest = totalCost / this.metrics.totalRequests;
    
    // Update savings
    const potentialSavings = Math.max(0, baseCost - strategy.estimatedCost);
    this.metrics.totalCostSaved += potentialSavings;
    
    // Update strategy distribution
    if (!this.metrics.strategyDistribution[strategy.name]) {
      this.metrics.strategyDistribution[strategy.name] = {
        count: 0,
        totalCost: 0,
        totalQuality: 0
      };
    }
    
    const strategyStats = this.metrics.strategyDistribution[strategy.name];
    strategyStats.count++;
    strategyStats.totalCost += strategy.estimatedCost;
    strategyStats.totalQuality += strategy.qualityScore;
    
    // Update budget utilization
    if (!this.metrics.budgetUtilization[budget]) {
      this.metrics.budgetUtilization[budget] = { requests: 0, totalCost: 0 };
    }
    
    this.metrics.budgetUtilization[budget].requests++;
    this.metrics.budgetUtilization[budget].totalCost += strategy.estimatedCost;
  }

  /**
   * Get cost optimization metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      costEfficiencyRatio: this.metrics.totalCostSaved > 0 
        ? (this.metrics.totalCostSaved / (this.metrics.avgCostPerRequest * this.metrics.totalRequests) * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  /**
   * Health check for cost optimization service
   */
  async healthCheck() {
    try {
      // Validate budget configurations
      const budgetTiers = Object.keys(this.costs.budgetTiers);
      const aiProviders = Object.keys(this.costs.aiProviders);
      const platforms = Object.keys(this.costs.platformComplexity);
      
      return {
        status: 'healthy',
        configuration: {
          budgetTiers: budgetTiers.length,
          aiProviders: aiProviders.length,
          supportedPlatforms: platforms.length
        },
        metrics: this.getMetrics(),
        budgetTiers,
        aiProviders
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Predict optimal AI provider based on current load and performance
   */
  predictOptimalProvider(imageAnalysis, platforms, budget) {
    const providers = Object.entries(this.costs.aiProviders);
    const budgetConfig = this.costs.budgetTiers[budget];
    
    if (!budgetConfig) {
      return 'local';
    }
    
    // Filter providers based on budget restrictions
    let availableProviders = providers;
    
    switch (budgetConfig.aiProviderRestriction) {
      case 'local':
        availableProviders = providers.filter(([name]) => name === 'local');
        break;
      case 'hybrid':
        availableProviders = providers.filter(([name]) => ['local', 'stability'].includes(name));
        break;
      case 'premium':
        availableProviders = providers.filter(([name]) => !['openai'].includes(name));
        break;
      case 'unlimited':
        // All providers available
        break;
    }
    
    // Score each provider based on multiple factors
    const scoredProviders = availableProviders.map(([name, config]) => {
      let score = 0;
      
      // Quality score weight: 40%
      score += config.qualityScore * 0.4;
      
      // Cost efficiency weight: 30%
      const costEfficiency = 1 / (config.costPerImage + 0.001); // Avoid division by zero
      score += (costEfficiency / 50) * 0.3; // Normalize to 0-1 range
      
      // Speed weight: 20%
      const speedScore = 1 - (config.avgProcessingTime / 30000); // Normalize against 30s max
      score += Math.max(0, speedScore) * 0.2;
      
      // Reliability weight: 10%
      score += (config.successRate * config.availabilityRate) * 0.1;
      
      return {
        name,
        score,
        config,
        reasons: this.generateProviderReasons(name, config, imageAnalysis)
      };
    });
    
    // Sort by score and return the best provider
    const bestProvider = scoredProviders.sort((a, b) => b.score - a.score)[0];
    return bestProvider ? bestProvider.name : 'local';
  }
  
  /**
   * Generate reasons for provider selection
   */
  generateProviderReasons(providerName, config, imageAnalysis) {
    const reasons = [];
    
    if (config.qualityScore > 0.9) {
      reasons.push('High quality output');
    }
    
    if (config.costPerImage < 0.01) {
      reasons.push('Cost effective');
    }
    
    if (config.avgProcessingTime < 5000) {
      reasons.push('Fast processing');
    }
    
    if (config.successRate > 0.95) {
      reasons.push('Highly reliable');
    }
    
    if (providerName === 'local') {
      reasons.push('No external API dependency');
    }
    
    return reasons;
  }
  
  /**
   * Enhanced processing time prediction
   */
  predictProcessingTime(provider, platforms, imageAnalysis) {
    const baseConfig = this.costs.aiProviders[provider];
    if (!baseConfig) {
      return 5000; // Default fallback
    }
    
    let totalTime = 0;
    
    for (const platform of platforms) {
      const platformComplexity = this.costs.platformComplexity[platform];
      let platformTime = baseConfig.avgProcessingTime;
      
      // Apply complexity multiplier
      platformTime *= platformComplexity.multiplier;
      
      // Apply image quality factors
      if (imageAnalysis.sharpness < 0.5) {
        platformTime *= 1.3; // Extra processing for low quality
      }
      
      if (imageAnalysis.noise > 0.6) {
        platformTime *= 1.2; // Extra time for noise reduction
      }
      
      // Apply image size factors
      const imagePixels = imageAnalysis.width * imageAnalysis.height;
      if (imagePixels > 2073600) { // > 1920x1080
        platformTime *= 1.5;
      } else if (imagePixels > 1048576) { // > 1024x1024
        platformTime *= 1.2;
      }
      
      totalTime += platformTime;
    }
    
    // Add overhead for batch processing
    if (platforms.length > 3) {
      totalTime *= 1.1;
    }
    
    // Add network latency for AI providers
    if (provider !== 'local') {
      totalTime += 2000; // 2 second network overhead
    }
    
    return Math.round(totalTime);
  }
  
  /**
   * Calculate optimization cost for given parameters
   */
  async calculateOptimizationCost(platforms, style = 'professional', options = {}) {
    try {
      console.log(`💰 Calculating optimization cost for ${platforms.length} platforms, style: ${style}`);
      
      // Default budget tier if not specified
      const budget = options.budget || 'basic';
      
      // Validate budget tier
      if (!this.costs.budgetTiers[budget]) {
        throw new Error(`Invalid budget tier: ${budget}. Available tiers: ${Object.keys(this.costs.budgetTiers).join(', ')}`);
      }
      
      // Mock image analysis for cost calculation
      const mockImageAnalysis = {
        width: options.width || 1024,
        height: options.height || 1024,
        sharpness: 0.7,
        ...options.imageAnalysis
      };
      
      // Calculate platform costs
      const platformCosts = this.calculatePlatformCosts(platforms, mockImageAnalysis);
      const totalBaseCost = platformCosts.reduce((sum, p) => sum + p.cost, 0);
      
      // Get budget configuration
      const budgetConfig = this.costs.budgetTiers[budget];
      
      // Predict optimal provider
      const optimalProvider = this.predictOptimalProvider(mockImageAnalysis, platforms, budget);
      
      // Select optimization strategy
      const strategy = this.selectOptimalStrategy(
        platforms.slice(0, budgetConfig.maxPlatforms), // Limit platforms to budget
        budgetConfig,
        totalBaseCost,
        mockImageAnalysis,
        optimalProvider
      );
      
      // Calculate cost breakdown
      const costBreakdown = {
        baseCost: totalBaseCost,
        strategyMultiplier: strategy.estimatedCost / totalBaseCost || 1,
        finalCost: strategy.estimatedCost,
        savings: Math.max(0, totalBaseCost - strategy.estimatedCost),
        currency: 'USD'
      };
      
      const estimate = {
        success: true,
        budget,
        platforms: platforms.slice(0, budgetConfig.maxPlatforms),
        style,
        strategy: strategy.name,
        estimatedCost: strategy.estimatedCost,
        estimatedTime: strategy.estimatedTime,
        qualityScore: strategy.qualityScore,
        costBreakdown,
        budgetLimits: {
          maxCost: budgetConfig.maxCostPerRequest,
          maxPlatforms: budgetConfig.maxPlatforms,
          withinBudget: strategy.estimatedCost <= budgetConfig.maxCostPerRequest
        },
        features: strategy.features || budgetConfig.features,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ Cost estimate: $${estimate.estimatedCost.toFixed(4)} for ${estimate.platforms.length} platforms`);
      
      return estimate;
      
    } catch (error) {
      console.error('❌ Cost calculation failed:', error);
      
      // Return error estimate with fallback
      return {
        success: false,
        error: error.message,
        fallbackEstimate: {
          budget: 'free',
          estimatedCost: 0.01,
          estimatedTime: 10000,
          platforms: platforms.slice(0, 2), // Free tier limit
          strategy: 'fallback_local',
          withinBudget: true
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Reset metrics (for testing or maintenance)
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      totalCostSaved: 0,
      avgCostPerRequest: 0,
      strategyDistribution: {},
      budgetUtilization: {}
    };
    
    console.log('📊 Cost optimization metrics reset');
  }
}

module.exports = { CostOptimizationService };