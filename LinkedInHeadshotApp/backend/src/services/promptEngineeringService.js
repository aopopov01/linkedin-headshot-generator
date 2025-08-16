/**
 * Prompt Engineering Service
 * Advanced AI prompt generation and optimization for image enhancement
 * Manages platform-specific prompts and style variations
 */

class PromptEngineeringService {
  constructor() {
    // Prompt templates and configurations
    this.promptTemplates = {
      base: {
        professional: "Professional headshot photograph of a person, corporate executive style, clean background, professional lighting, sharp focus, high quality, business attire, confident expression",
        creative: "Creative professional portrait, artistic lighting, modern aesthetic, innovative style, contemporary background, expressive and engaging, high quality photography",
        tech: "Technology professional headshot, modern tech industry style, clean minimal background, contemporary lighting, professional yet approachable, innovation-focused",
        healthcare: "Healthcare professional portrait, trustworthy and competent appearance, clean medical environment background, professional medical attire, caring expression",
        finance: "Financial professional headshot, authoritative business style, executive presence, formal business attire, confident and reliable appearance, premium quality",
        startup: "Startup entrepreneur portrait, dynamic and innovative style, modern business casual, energetic and visionary expression, contemporary setting"
      },
      
      platformSpecific: {
        linkedin: {
          emphasis: "LinkedIn profile optimization, corporate networking, executive presence, professional credibility",
          background: "neutral professional background, office environment or solid color",
          style: "business formal, executive style, authoritative yet approachable"
        },
        instagram: {
          emphasis: "Social media engagement, personal branding, lifestyle professional",
          background: "lifestyle background, trendy environment, aesthetic appeal",
          style: "smart casual professional, approachable and relatable"
        },
        facebook: {
          emphasis: "Social networking, friendly professional, community engagement",
          background: "warm and inviting background, social environment",
          style: "business casual, friendly and approachable"
        },
        twitter: {
          emphasis: "Thought leadership, expertise visibility, professional authority",
          background: "clean minimal background, focus on subject",
          style: "smart professional, confident thought leader"
        },
        youtube: {
          emphasis: "Content creator presence, engaging personality, video optimization",
          background: "content creator background, studio lighting",
          style: "professional content creator, engaging and charismatic"
        },
        tiktok: {
          emphasis: "Dynamic content creation, youthful professional energy",
          background: "trendy modern background, dynamic lighting",
          style: "modern professional, energetic and engaging"
        },
        whatsapp_business: {
          emphasis: "Business communication, trustworthy service provider",
          background: "business environment, professional setting",
          style: "approachable business professional, service-oriented"
        },
        github: {
          emphasis: "Technical expertise, developer credibility, open source contribution",
          background: "tech workspace, minimal clean background",
          style: "technical professional, competent and innovative"
        }
      }
    };

    // Advanced prompt modifiers
    this.promptModifiers = {
      quality: {
        ultra: "ultra high resolution, professional photography, studio lighting, perfect focus",
        premium: "high quality professional photo, excellent lighting, sharp details",
        standard: "professional quality, good lighting, clear focus",
        basic: "professional photo, decent quality"
      },
      
      lighting: {
        studio: "professional studio lighting, three-point lighting setup, soft box lighting",
        natural: "natural lighting, window light, soft daylight",
        corporate: "office lighting, professional environment lighting",
        creative: "artistic lighting, dramatic shadows, creative illumination"
      },
      
      composition: {
        headshot: "professional headshot composition, shoulders and head visible",
        portrait: "portrait composition, upper body visible",
        close_up: "close-up professional portrait, face focused",
        environmental: "environmental portrait, context visible"
      },
      
      enhancement: {
        subtle: "subtle enhancement, natural appearance, minimal processing",
        moderate: "moderate professional enhancement, polished appearance",
        strong: "significant professional enhancement, optimized for platform",
        dramatic: "dramatic enhancement, maximum professional impact"
      }
    };

    // Negative prompts to avoid unwanted elements
    this.negativePrompts = {
      common: "blurry, low quality, pixelated, distorted, unprofessional, casual clothing, inappropriate background",
      platform: {
        linkedin: "casual attire, party setting, unprofessional background, social media filters",
        instagram: "overly formal, corporate stiffness, boring composition",
        facebook: "too professional, intimidating, cold expression",
        twitter: "unprofessional, lacking authority, weak presence",
        youtube: "boring, unengaging, poor lighting, distracting background",
        tiktok: "too formal, corporate stiffness, outdated style",
        whatsapp_business: "intimidating, unapproachable, overly formal",
        github: "non-technical appearance, corporate formality, unsuitable for tech"
      }
    };

    // Prompt generation metrics
    this.metrics = {
      totalPrompts: 0,
      promptsByStyle: {},
      promptsByPlatform: {},
      averagePromptLength: 0,
      promptEffectiveness: {}
    };
  }

  /**
   * Generate platform-specific prompts
   */
  async generatePlatformPrompts(style, platforms, imageAnalysis = {}) {
    try {
      console.log(`🎨 Generating prompts for style: ${style}, platforms: ${platforms.join(', ')}`);
      
      const prompts = {};
      
      for (const platform of platforms) {
        const prompt = await this.generateSinglePlatformPrompt(style, platform, imageAnalysis);
        prompts[platform] = prompt;
        
        // Update metrics
        this.updatePromptMetrics(style, platform, prompt);
      }
      
      console.log(`✅ Generated ${platforms.length} platform-specific prompts`);
      return prompts;
      
    } catch (error) {
      console.error('❌ Prompt generation failed:', error);
      throw new Error(`Prompt generation failed: ${error.message}`);
    }
  }

  /**
   * Generate prompt for a single platform
   */
  async generateSinglePlatformPrompt(style, platform, imageAnalysis = {}) {
    try {
      // Get base prompt for style
      const basePrompt = this.promptTemplates.base[style];
      if (!basePrompt) {
        throw new Error(`Unknown style: ${style}`);
      }

      // Get platform-specific modifications
      const platformSpec = this.promptTemplates.platformSpecific[platform];
      if (!platformSpec) {
        throw new Error(`Unknown platform: ${platform}`);
      }

      // Analyze image characteristics for prompt optimization
      const imageContext = this.analyzeImageContext(imageAnalysis);
      
      // Build comprehensive prompt
      const promptComponents = [
        basePrompt,
        platformSpec.emphasis,
        platformSpec.background,
        platformSpec.style,
        this.selectQualityModifier(imageAnalysis),
        this.selectLightingModifier(platform, imageAnalysis),
        this.selectCompositionModifier(platform),
        this.selectEnhancementLevel(style, platform),
        imageContext
      ].filter(Boolean);

      // Combine and optimize prompt
      let prompt = promptComponents.join(', ');
      
      // Add negative prompts
      const negativePrompt = this.generateNegativePrompt(platform, style);
      
      // Optimize prompt length and structure
      prompt = this.optimizePrompt(prompt, platform);
      
      const finalPrompt = {
        positive: prompt,
        negative: negativePrompt,
        metadata: {
          style,
          platform,
          quality: this.selectQualityModifier(imageAnalysis),
          enhancement: this.selectEnhancementLevel(style, platform),
          imageContext: imageContext
        }
      };

      console.log(`🎯 Generated prompt for ${platform}: ${prompt.length} characters`);
      
      return finalPrompt;
      
    } catch (error) {
      console.error(`❌ Single platform prompt generation failed for ${platform}:`, error);
      
      // Return fallback prompt
      return this.getFallbackPrompt(style, platform);
    }
  }

  /**
   * Analyze image context for prompt optimization
   */
  analyzeImageContext(imageAnalysis) {
    if (!imageAnalysis || Object.keys(imageAnalysis).length === 0) {
      return '';
    }

    const contextElements = [];

    // Brightness analysis
    if (imageAnalysis.brightness < 0.4) {
      contextElements.push('improve lighting, brighten image');
    } else if (imageAnalysis.brightness > 0.8) {
      contextElements.push('balance exposure, reduce overexposure');
    }

    // Contrast analysis
    if (imageAnalysis.contrast < 0.3) {
      contextElements.push('enhance contrast, improve definition');
    }

    // Sharpness analysis
    if (imageAnalysis.sharpness < 0.5) {
      contextElements.push('sharpen details, improve clarity');
    }

    // Background analysis
    if (imageAnalysis.backgroundType) {
      switch (imageAnalysis.backgroundType.type) {
        case 'cluttered':
          contextElements.push('clean background, minimize distractions');
          break;
        case 'dark':
          contextElements.push('brighten background, professional setting');
          break;
        case 'unprofessional':
          contextElements.push('replace with professional background');
          break;
      }
    }

    return contextElements.join(', ');
  }

  /**
   * Select quality modifier based on image analysis
   */
  selectQualityModifier(imageAnalysis = {}) {
    const qualityScore = imageAnalysis.sharpness || 0.7;
    
    if (qualityScore < 0.4) return this.promptModifiers.quality.ultra;
    if (qualityScore < 0.6) return this.promptModifiers.quality.premium;
    if (qualityScore < 0.8) return this.promptModifiers.quality.standard;
    
    return this.promptModifiers.quality.premium; // Default to premium
  }

  /**
   * Select lighting modifier based on platform and image
   */
  selectLightingModifier(platform, imageAnalysis = {}) {
    const brightness = imageAnalysis.brightness || 0.5;
    
    // Platform-specific lighting preferences
    const lightingPrefs = {
      linkedin: brightness < 0.5 ? 'corporate' : 'studio',
      instagram: 'natural',
      facebook: 'natural',
      twitter: 'studio',
      youtube: 'studio',
      tiktok: 'creative',
      whatsapp_business: 'corporate',
      github: 'studio'
    };

    const selectedLighting = lightingPrefs[platform] || 'studio';
    return this.promptModifiers.lighting[selectedLighting];
  }

  /**
   * Select composition modifier based on platform
   */
  selectCompositionModifier(platform) {
    const compositionMap = {
      linkedin: 'headshot',
      instagram: 'portrait',
      facebook: 'portrait',
      twitter: 'headshot',
      youtube: 'portrait',
      tiktok: 'close_up',
      whatsapp_business: 'headshot',
      github: 'headshot'
    };

    const composition = compositionMap[platform] || 'headshot';
    return this.promptModifiers.composition[composition];
  }

  /**
   * Select enhancement level based on style and platform
   */
  selectEnhancementLevel(style, platform) {
    // Enhancement matrix based on style and platform
    const enhancementMatrix = {
      professional: {
        linkedin: 'moderate',
        github: 'subtle',
        whatsapp_business: 'moderate'
      },
      creative: {
        instagram: 'strong',
        youtube: 'strong',
        tiktok: 'dramatic'
      },
      tech: {
        github: 'subtle',
        linkedin: 'moderate',
        twitter: 'moderate'
      },
      healthcare: {
        linkedin: 'moderate',
        whatsapp_business: 'moderate'
      },
      finance: {
        linkedin: 'moderate',
        twitter: 'moderate'
      },
      startup: {
        instagram: 'strong',
        twitter: 'moderate',
        youtube: 'strong'
      }
    };

    const styleEnhancements = enhancementMatrix[style] || {};
    const enhancement = styleEnhancements[platform] || 'moderate';
    
    return this.promptModifiers.enhancement[enhancement];
  }

  /**
   * Generate negative prompt to avoid unwanted elements
   */
  generateNegativePrompt(platform, style) {
    const commonNegatives = this.negativePrompts.common;
    const platformNegatives = this.negativePrompts.platform[platform] || '';
    
    // Style-specific negatives
    const styleNegatives = {
      professional: 'casual, informal, party, entertainment',
      creative: 'boring, corporate stiffness, conventional',
      tech: 'non-technical, traditional corporate',
      healthcare: 'casual attire, unprofessional setting',
      finance: 'casual, unreliable appearance',
      startup: 'overly formal, traditional corporate'
    };

    const components = [
      commonNegatives,
      platformNegatives,
      styleNegatives[style] || ''
    ].filter(Boolean);

    return components.join(', ');
  }

  /**
   * Optimize prompt for length and effectiveness
   */
  optimizePrompt(prompt, platform) {
    // Remove redundant words and phrases
    let optimized = prompt
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/,\s*,/g, ',') // Remove empty comma sequences
      .replace(/professional professional/gi, 'professional') // Remove duplicates
      .trim();

    // Platform-specific optimizations
    const maxLengths = {
      linkedin: 400,
      instagram: 350,
      facebook: 300,
      twitter: 280,
      youtube: 400,
      tiktok: 300,
      whatsapp_business: 250,
      github: 350
    };

    const maxLength = maxLengths[platform] || 350;
    
    if (optimized.length > maxLength) {
      // Truncate while preserving important keywords
      const sentences = optimized.split(',').map(s => s.trim());
      let truncated = '';
      
      for (const sentence of sentences) {
        if ((truncated + ', ' + sentence).length <= maxLength) {
          truncated += (truncated ? ', ' : '') + sentence;
        } else {
          break;
        }
      }
      
      optimized = truncated || optimized.substring(0, maxLength - 3) + '...';
    }

    return optimized;
  }

  /**
   * Get fallback prompt for error cases
   */
  getFallbackPrompt(style, platform) {
    const fallbackBase = "Professional headshot, high quality, business attire, clean background";
    
    return {
      positive: fallbackBase,
      negative: this.negativePrompts.common,
      metadata: {
        style,
        platform,
        fallback: true
      }
    };
  }

  /**
   * Update prompt generation metrics
   */
  updatePromptMetrics(style, platform, prompt) {
    this.metrics.totalPrompts++;
    
    // Track by style
    if (!this.metrics.promptsByStyle[style]) {
      this.metrics.promptsByStyle[style] = 0;
    }
    this.metrics.promptsByStyle[style]++;
    
    // Track by platform
    if (!this.metrics.promptsByPlatform[platform]) {
      this.metrics.promptsByPlatform[platform] = 0;
    }
    this.metrics.promptsByPlatform[platform]++;
    
    // Update average length
    const promptLength = prompt.positive ? prompt.positive.length : 0;
    const totalLength = this.metrics.averagePromptLength * (this.metrics.totalPrompts - 1) + promptLength;
    this.metrics.averagePromptLength = totalLength / this.metrics.totalPrompts;
  }

  /**
   * A/B test different prompt variations
   */
  async generatePromptVariations(style, platform, imageAnalysis = {}, variationCount = 3) {
    const variations = [];
    
    for (let i = 0; i < variationCount; i++) {
      // Modify parameters slightly for each variation
      const modifiedAnalysis = this.createVariationContext(imageAnalysis, i);
      const variation = await this.generateSinglePlatformPrompt(style, platform, modifiedAnalysis);
      
      variations.push({
        id: `v${i + 1}`,
        prompt: variation,
        context: modifiedAnalysis
      });
    }
    
    return variations;
  }

  /**
   * Create variation context for A/B testing
   */
  createVariationContext(originalAnalysis, variationIndex) {
    const modified = { ...originalAnalysis };
    
    // Apply slight modifications based on variation index
    switch (variationIndex) {
      case 1:
        // More conservative enhancement
        modified.enhancement_preference = 'subtle';
        break;
      case 2:
        // More aggressive enhancement
        modified.enhancement_preference = 'strong';
        break;
      default:
        // Standard enhancement
        modified.enhancement_preference = 'moderate';
    }
    
    return modified;
  }

  /**
   * Get prompt templates for external use
   */
  getPromptTemplates() {
    return {
      styles: Object.keys(this.promptTemplates.base),
      platforms: Object.keys(this.promptTemplates.platformSpecific),
      modifiers: Object.keys(this.promptModifiers),
      templates: this.promptTemplates
    };
  }

  /**
   * Get prompt metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      mostUsedStyle: this.getMostUsedCategory(this.metrics.promptsByStyle),
      mostUsedPlatform: this.getMostUsedCategory(this.metrics.promptsByPlatform)
    };
  }

  /**
   * Get most used category from metrics
   */
  getMostUsedCategory(categoryMetrics) {
    if (!categoryMetrics || Object.keys(categoryMetrics).length === 0) {
      return 'none';
    }
    
    return Object.entries(categoryMetrics)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  /**
   * Health check for prompt engineering service
   */
  async healthCheck() {
    try {
      // Test basic prompt generation
      const testPrompt = await this.generateSinglePlatformPrompt('professional', 'linkedin', {});
      
      if (!testPrompt || !testPrompt.positive) {
        throw new Error('Failed to generate test prompt');
      }
      
      return {
        status: 'healthy',
        metrics: this.getMetrics(),
        availableStyles: Object.keys(this.promptTemplates.base).length,
        supportedPlatforms: Object.keys(this.promptTemplates.platformSpecific).length,
        promptModifiers: Object.keys(this.promptModifiers).length
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = { PromptEngineeringService };