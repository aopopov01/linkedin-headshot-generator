/**
 * Platform Specification Engine
 * 
 * Centralized repository of platform-specific requirements, dimensions,
 * style optimizations, and processing parameters for all supported platforms.
 * 
 * This engine provides:
 * - Exact platform specifications and requirements
 * - Style-to-platform matching logic
 * - Processing priority optimization
 * - Platform recommendation algorithms
 * - Custom dimension support
 */

export class PlatformSpecificationEngine {
  constructor() {
    this.initializePlatformSpecs();
    this.initializeStyleMappings();
    this.initializeProcessingRules();
    
    console.log('📱 Platform Specification Engine initialized');
    console.log(`🎯 Supporting ${Object.keys(this.platforms).length} platforms`);
  }

  /**
   * Initialize comprehensive platform specifications
   */
  initializePlatformSpecs() {
    this.platforms = {
      // Social Media Platforms
      linkedin: {
        name: 'LinkedIn',
        category: 'professional',
        specifications: {
          profile: {
            width: 400,
            height: 400,
            aspectRatio: 1,
            maxFileSize: 8 * 1024 * 1024, // 8MB
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.95,
            qualityTarget: 'ultra_high'
          },
          banner: {
            width: 1584,
            height: 396,
            aspectRatio: 4,
            maxFileSize: 8 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.9,
            qualityTarget: 'high'
          }
        },
        optimizations: {
          intelligentCropping: true,
          faceDetection: true,
          professionalLighting: true,
          backgroundOptimization: true,
          colorCorrection: true
        },
        stylePreferences: ['executive', 'corporate', 'professional', 'finance', 'healthcare'],
        processingPriority: 'high',
        engagement_factors: ['professionalism', 'trustworthiness', 'competence']
      },

      instagram: {
        name: 'Instagram',
        category: 'social',
        specifications: {
          profile: {
            width: 320,
            height: 320,
            aspectRatio: 1,
            maxFileSize: 30 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.9,
            qualityTarget: 'high'
          },
          post_square: {
            width: 1080,
            height: 1080,
            aspectRatio: 1,
            maxFileSize: 30 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.85,
            qualityTarget: 'high'
          },
          post_portrait: {
            width: 1080,
            height: 1350,
            aspectRatio: 0.8,
            maxFileSize: 30 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.85,
            qualityTarget: 'high'
          },
          story: {
            width: 1080,
            height: 1920,
            aspectRatio: 0.5625,
            maxFileSize: 30 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.8,
            qualityTarget: 'medium_high'
          }
        },
        optimizations: {
          intelligentCropping: true,
          colorEnhancement: true,
          contrastOptimization: true,
          vibrancyBoost: true,
          hashtagOptimization: true
        },
        stylePreferences: ['creative', 'lifestyle', 'brand', 'artistic'],
        processingPriority: 'high',
        engagement_factors: ['visual_appeal', 'authenticity', 'brand_consistency']
      },

      facebook: {
        name: 'Facebook',
        category: 'social',
        specifications: {
          profile: {
            width: 720,
            height: 720,
            aspectRatio: 1,
            maxFileSize: 50 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.9,
            qualityTarget: 'high'
          },
          cover: {
            width: 1200,
            height: 675,
            aspectRatio: 1.78,
            maxFileSize: 50 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.85,
            qualityTarget: 'high'
          },
          post: {
            width: 1200,
            height: 630,
            aspectRatio: 1.91,
            maxFileSize: 50 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.8,
            qualityTarget: 'medium_high'
          }
        },
        optimizations: {
          intelligentCropping: true,
          faceDetection: true,
          socialOptimization: true,
          communityFriendly: true
        },
        stylePreferences: ['professional_casual', 'approachable', 'community_focused'],
        processingPriority: 'medium',
        engagement_factors: ['approachability', 'trustworthiness', 'relatability']
      },

      twitter: {
        name: 'Twitter/X',
        category: 'social',
        specifications: {
          profile: {
            width: 400,
            height: 400,
            aspectRatio: 1,
            maxFileSize: 10 * 1024 * 1024,
            formats: ['JPEG', 'PNG', 'GIF'],
            compressionLevel: 0.9,
            qualityTarget: 'high'
          },
          header: {
            width: 1500,
            height: 500,
            aspectRatio: 3,
            maxFileSize: 10 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.85,
            qualityTarget: 'high'
          }
        },
        optimizations: {
          intelligentCropping: true,
          textOptimization: true,
          controversyAvoidance: true,
          viralPotential: true
        },
        stylePreferences: ['thought_leader', 'industry_expert', 'conversational'],
        processingPriority: 'medium',
        engagement_factors: ['authority', 'expertise', 'discussion_worthy']
      },

      tiktok: {
        name: 'TikTok',
        category: 'social',
        specifications: {
          profile: {
            width: 200,
            height: 200,
            aspectRatio: 1,
            maxFileSize: 20 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.85,
            qualityTarget: 'medium_high'
          },
          video_thumbnail: {
            width: 1080,
            height: 1920,
            aspectRatio: 0.5625,
            maxFileSize: 20 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.8,
            qualityTarget: 'medium_high'
          }
        },
        optimizations: {
          intelligentCropping: true,
          youthfulOptimization: true,
          trendAlignment: true,
          energeticVibes: true
        },
        stylePreferences: ['authentic', 'engaging', 'trend_aware', 'energetic'],
        processingPriority: 'low',
        engagement_factors: ['authenticity', 'energy', 'trend_relevance']
      },

      youtube: {
        name: 'YouTube',
        category: 'professional',
        specifications: {
          profile: {
            width: 800,
            height: 800,
            aspectRatio: 1,
            maxFileSize: 4 * 1024 * 1024,
            formats: ['JPEG', 'PNG', 'GIF'],
            compressionLevel: 0.9,
            qualityTarget: 'high'
          },
          channel_art: {
            width: 2560,
            height: 1440,
            aspectRatio: 1.78,
            maxFileSize: 6 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.85,
            qualityTarget: 'ultra_high',
            safe_area: {
              width: 1546,
              height: 423
            }
          },
          thumbnail: {
            width: 1280,
            height: 720,
            aspectRatio: 1.78,
            maxFileSize: 2 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.9,
            qualityTarget: 'high'
          }
        },
        optimizations: {
          intelligentCropping: true,
          thumbnailOptimization: true,
          expertPositioning: true,
          brandConsistency: true
        },
        stylePreferences: ['expert', 'educator', 'authority', 'brand_focused'],
        processingPriority: 'high',
        engagement_factors: ['expertise', 'education_value', 'brand_trust']
      },

      // Professional Platforms
      github: {
        name: 'GitHub',
        category: 'professional',
        specifications: {
          profile: {
            width: 460,
            height: 460,
            aspectRatio: 1,
            maxFileSize: 1 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.9,
            qualityTarget: 'high'
          }
        },
        optimizations: {
          intelligentCropping: true,
          techCredibility: true,
          professionalFocus: true
        },
        stylePreferences: ['tech', 'developer', 'innovative'],
        processingPriority: 'medium',
        engagement_factors: ['technical_credibility', 'innovation', 'professionalism']
      },

      behance: {
        name: 'Behance',
        category: 'creative',
        specifications: {
          profile: {
            width: 276,
            height: 276,
            aspectRatio: 1,
            maxFileSize: 5 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.95,
            qualityTarget: 'ultra_high'
          },
          project_cover: {
            width: 1400,
            height: 1400,
            aspectRatio: 1,
            maxFileSize: 10 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.9,
            qualityTarget: 'ultra_high'
          }
        },
        optimizations: {
          intelligentCropping: true,
          artisticEnhancement: true,
          creativeOptimization: true,
          portfolioQuality: true
        },
        stylePreferences: ['creative', 'artistic', 'portfolio_ready'],
        processingPriority: 'high',
        engagement_factors: ['artistic_quality', 'creative_confidence', 'portfolio_impact']
      },

      dribbble: {
        name: 'Dribbble',
        category: 'creative',
        specifications: {
          avatar: {
            width: 400,
            height: 400,
            aspectRatio: 1,
            maxFileSize: 5 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.95,
            qualityTarget: 'ultra_high'
          },
          shot_4_3: {
            width: 800,
            height: 600,
            aspectRatio: 1.33,
            maxFileSize: 8 * 1024 * 1024,
            formats: ['JPEG', 'PNG', 'GIF'],
            compressionLevel: 0.9,
            qualityTarget: 'ultra_high'
          },
          shot_2_3: {
            width: 800,
            height: 1200,
            aspectRatio: 0.67,
            maxFileSize: 8 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.9,
            qualityTarget: 'ultra_high'
          }
        },
        optimizations: {
          intelligentCropping: true,
          designFocus: true,
          creativeAuthority: true,
          aestheticEnhancement: true
        },
        stylePreferences: ['design_focused', 'creative_professional', 'aesthetic'],
        processingPriority: 'high',
        engagement_factors: ['design_quality', 'aesthetic_appeal', 'creative_authority']
      },

      // Dating Platforms
      tinder: {
        name: 'Tinder',
        category: 'dating',
        specifications: {
          photo: {
            width: 640,
            height: 640,
            aspectRatio: 1,
            maxFileSize: 5 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.85,
            qualityTarget: 'high',
            note: 'Can support up to 2000x2000px'
          }
        },
        optimizations: {
          intelligentCropping: true,
          attractivenessEnhancement: true,
          authenticity: true,
          approachability: true
        },
        stylePreferences: ['approachable', 'authentic', 'lifestyle'],
        processingPriority: 'low',
        engagement_factors: ['attractiveness', 'authenticity', 'approachability']
      },

      bumble: {
        name: 'Bumble',
        category: 'dating',
        specifications: {
          photo: {
            width: 800,
            height: 600,
            aspectRatio: 1.33,
            maxFileSize: 5 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.85,
            qualityTarget: 'high',
            note: 'Supports 1:1 to 4:3 ratio'
          }
        },
        optimizations: {
          intelligentCropping: true,
          professionalCasual: true,
          achievementFocus: true,
          confidence: true
        },
        stylePreferences: ['professional_casual', 'achievement_focused', 'confident'],
        processingPriority: 'low',
        engagement_factors: ['success_indicators', 'confidence', 'approachability']
      },

      hinge: {
        name: 'Hinge',
        category: 'dating',
        specifications: {
          photo: {
            width: 1080,
            height: 1350,
            aspectRatio: 0.8,
            maxFileSize: 5 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.85,
            qualityTarget: 'high',
            note: 'Vertical preferred for better display'
          }
        },
        optimizations: {
          intelligentCropping: true,
          storyTelling: true,
          conversationStarter: true,
          personalityDisplay: true
        },
        stylePreferences: ['authentic', 'story_telling', 'lifestyle'],
        processingPriority: 'low',
        engagement_factors: ['conversation_potential', 'personality', 'authenticity']
      },

      // Business Platforms
      whatsapp_business: {
        name: 'WhatsApp Business',
        category: 'business',
        specifications: {
          profile: {
            width: 640,
            height: 640,
            aspectRatio: 1,
            maxFileSize: 5 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.9,
            qualityTarget: 'high'
          }
        },
        optimizations: {
          intelligentCropping: true,
          trustworthiness: true,
          serviceOriented: true,
          accessibility: true
        },
        stylePreferences: ['trustworthy_professional', 'service_oriented', 'approachable'],
        processingPriority: 'medium',
        engagement_factors: ['trustworthiness', 'service_quality', 'accessibility']
      },

      zoom: {
        name: 'Zoom',
        category: 'business',
        specifications: {
          profile: {
            width: 512,
            height: 512,
            aspectRatio: 1,
            maxFileSize: 2 * 1024 * 1024,
            formats: ['JPEG', 'PNG'],
            compressionLevel: 0.9,
            qualityTarget: 'high',
            note: '128px to 1024px supported'
          }
        },
        optimizations: {
          intelligentCropping: true,
          meetingReady: true,
          professionalPresence: true,
          videoOptimization: true
        },
        stylePreferences: ['professional_approachable', 'meeting_ready'],
        processingPriority: 'medium',
        engagement_factors: ['professional_presence', 'video_quality', 'meeting_appropriate']
      }
    };
  }

  /**
   * Initialize style-to-platform mappings
   */
  initializeStyleMappings() {
    this.styleOptimizations = {
      executive: {
        preferredPlatforms: ['linkedin', 'facebook', 'zoom', 'whatsapp_business'],
        characteristics: {
          attire: 'premium_business_suit',
          background: 'professional_gray_gradient',
          lighting: 'executive_studio_lighting',
          expression: 'confident_authoritative',
          colorPalette: ['navy', 'charcoal', 'white', 'silver']
        },
        aiPromptEnhancement: 'ultra-realistic executive portrait, premium business attire, confident leadership presence'
      },

      creative: {
        preferredPlatforms: ['instagram', 'behance', 'dribbble', 'tiktok'],
        characteristics: {
          attire: 'modern_creative_professional',
          background: 'contemporary_artistic',
          lighting: 'creative_studio_setup',
          expression: 'innovative_confident',
          colorPalette: ['modern_neutrals', 'accent_colors', 'creative_tones']
        },
        aiPromptEnhancement: 'professional creative director portrait, contemporary styling, innovative confidence'
      },

      tech: {
        preferredPlatforms: ['github', 'linkedin', 'twitter', 'youtube'],
        characteristics: {
          attire: 'smart_casual_tech',
          background: 'clean_modern',
          lighting: 'natural_professional',
          expression: 'forward_thinking_approachable',
          colorPalette: ['tech_blues', 'modern_grays', 'clean_whites']
        },
        aiPromptEnhancement: 'technology professional portrait, modern business casual, Silicon Valley executive quality'
      },

      healthcare: {
        preferredPlatforms: ['linkedin', 'facebook', 'whatsapp_business', 'zoom'],
        characteristics: {
          attire: 'medical_professional',
          background: 'clean_medical_environment',
          lighting: 'clinical_professional',
          expression: 'trustworthy_caring',
          colorPalette: ['medical_white', 'trust_blue', 'caring_teal']
        },
        aiPromptEnhancement: 'professional healthcare worker portrait, medical attire, trustworthy caring expression'
      },

      finance: {
        preferredPlatforms: ['linkedin', 'twitter', 'facebook', 'zoom'],
        characteristics: {
          attire: 'conservative_business',
          background: 'financial_professional',
          lighting: 'authoritative_studio',
          expression: 'trustworthy_competent',
          colorPalette: ['financial_navy', 'trust_gray', 'premium_silver']
        },
        aiPromptEnhancement: 'high-end financial professional portrait, impeccable business attire, Wall Street quality'
      },

      startup: {
        preferredPlatforms: ['linkedin', 'twitter', 'instagram', 'youtube'],
        characteristics: {
          attire: 'modern_entrepreneur',
          background: 'innovation_focused',
          lighting: 'dynamic_professional',
          expression: 'visionary_confident',
          colorPalette: ['startup_blues', 'innovation_greens', 'energy_accents']
        },
        aiPromptEnhancement: 'modern tech entrepreneur portrait, contemporary business casual, innovative confident expression'
      }
    };
  }

  /**
   * Initialize processing rules and priorities
   */
  initializeProcessingRules() {
    this.processingRules = {
      priority_matrix: {
        high: ['linkedin', 'youtube', 'behance', 'dribbble'],
        medium: ['instagram', 'facebook', 'twitter', 'github', 'zoom', 'whatsapp_business'],
        low: ['tiktok', 'tinder', 'bumble', 'hinge']
      },
      
      cost_optimization: {
        premium_platforms: ['linkedin', 'behance', 'dribbble', 'youtube'],
        standard_platforms: ['instagram', 'facebook', 'twitter', 'github'],
        economy_platforms: ['tiktok', 'tinder', 'bumble', 'hinge', 'whatsapp_business', 'zoom']
      },
      
      batch_processing: {
        parallel_safe: ['instagram', 'facebook', 'twitter', 'tiktok'],
        sequential_recommended: ['linkedin', 'youtube', 'behance', 'dribbble'],
        mixed_strategy: ['github', 'zoom', 'whatsapp_business', 'dating_platforms']
      }
    };
  }

  /**
   * Get complete specifications for a platform
   */
  getSpecifications(platform) {
    if (!this.platforms[platform]) {
      throw new Error(`Platform ${platform} not supported`);
    }
    
    return {
      platform,
      ...this.platforms[platform],
      default_spec: this.getDefaultSpec(platform),
      all_specs: this.platforms[platform].specifications
    };
  }

  /**
   * Get default/primary specification for a platform
   */
  getDefaultSpec(platform) {
    const platformData = this.platforms[platform];
    if (!platformData) return null;
    
    // Return the most commonly used spec for each platform
    const specPriority = {
      linkedin: 'profile',
      instagram: 'post_square',
      facebook: 'profile',
      twitter: 'profile',
      tiktok: 'profile',
      youtube: 'profile',
      github: 'profile',
      behance: 'profile',
      dribbble: 'avatar',
      tinder: 'photo',
      bumble: 'photo',
      hinge: 'photo',
      whatsapp_business: 'profile',
      zoom: 'profile'
    };
    
    const defaultSpecKey = specPriority[platform] || Object.keys(platformData.specifications)[0];
    return {
      type: defaultSpecKey,
      ...platformData.specifications[defaultSpecKey]
    };
  }

  /**
   * Get style optimization for platform and style combination
   */
  getStyleOptimization(platform, style) {
    const platformData = this.platforms[platform];
    const styleData = this.styleOptimizations[style];
    
    if (!platformData || !styleData) {
      return { style, optimization: 'default' };
    }
    
    // Calculate style-platform compatibility score
    const compatibility = this.calculateStyleCompatibility(platform, style);
    
    return {
      style,
      platform,
      compatibility,
      recommended: styleData.preferredPlatforms.includes(platform),
      characteristics: styleData.characteristics,
      aiEnhancement: styleData.aiPromptEnhancement,
      platformOptimizations: platformData.optimizations,
      engagementFactors: platformData.engagement_factors
    };
  }

  /**
   * Calculate compatibility between style and platform
   */
  calculateStyleCompatibility(platform, style) {
    const platformData = this.platforms[platform];
    const styleData = this.styleOptimizations[style];
    
    if (!platformData || !styleData) return 0.5;
    
    // Base compatibility from preferred platforms
    let score = styleData.preferredPlatforms.includes(platform) ? 0.8 : 0.4;
    
    // Adjust based on platform category and style characteristics
    if (platformData.category === 'professional' && ['executive', 'finance', 'healthcare'].includes(style)) {
      score += 0.2;
    }
    
    if (platformData.category === 'creative' && ['creative', 'artistic'].includes(style)) {
      score += 0.2;
    }
    
    if (platformData.category === 'social' && ['lifestyle', 'approachable'].includes(style)) {
      score += 0.1;
    }
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Get processing priority for a platform
   */
  getProcessingPriority(platform) {
    for (const [priority, platforms] of Object.entries(this.processingRules.priority_matrix)) {
      if (platforms.includes(platform)) {
        return priority;
      }
    }
    return 'medium';
  }

  /**
   * Get cost tier for a platform
   */
  getCostTier(platform) {
    for (const [tier, platforms] of Object.entries(this.processingRules.cost_optimization)) {
      if (platforms.includes(platform)) {
        return tier.replace('_platforms', '');
      }
    }
    return 'standard';
  }

  /**
   * Recommend platforms based on user profile
   */
  recommendPlatforms(userProfile) {
    const recommendations = [];
    
    // Professional recommendations
    if (userProfile.industry || userProfile.jobTitle) {
      recommendations.push({
        platform: 'linkedin',
        priority: 'essential',
        reason: 'Professional networking and career growth',
        compatibility: 0.95
      });
    }
    
    // Creative industry recommendations
    if (userProfile.industry === 'creative' || userProfile.role === 'designer') {
      recommendations.push(
        {
          platform: 'behance',
          priority: 'highly_recommended',
          reason: 'Portfolio showcase for creative professionals',
          compatibility: 0.9
        },
        {
          platform: 'dribbble',
          priority: 'recommended',
          reason: 'Design community and inspiration',
          compatibility: 0.85
        }
      );
    }
    
    // Tech industry recommendations
    if (userProfile.industry === 'technology' || userProfile.role === 'developer') {
      recommendations.push({
        platform: 'github',
        priority: 'essential',
        reason: 'Code portfolio and professional credibility',
        compatibility: 0.9
      });
    }
    
    // General social media recommendations
    recommendations.push(
      {
        platform: 'instagram',
        priority: 'recommended',
        reason: 'Personal branding and visual storytelling',
        compatibility: 0.7
      },
      {
        platform: 'facebook',
        priority: 'optional',
        reason: 'Broader social network and community building',
        compatibility: 0.6
      }
    );
    
    return recommendations.sort((a, b) => b.compatibility - a.compatibility);
  }

  /**
   * Recommend styles based on user profile and target platforms
   */
  recommendStyles(userProfile, targetPlatforms) {
    const styleScores = {};
    
    // Calculate scores for each style based on platforms and profile
    for (const style of Object.keys(this.styleOptimizations)) {
      let score = 0;
      
      // Platform compatibility
      for (const platform of targetPlatforms) {
        const compatibility = this.calculateStyleCompatibility(platform, style);
        score += compatibility;
      }
      
      // User profile matching
      if (userProfile.industry === 'finance' && style === 'finance') score += 0.5;
      if (userProfile.industry === 'healthcare' && style === 'healthcare') score += 0.5;
      if (userProfile.industry === 'technology' && style === 'tech') score += 0.5;
      if (userProfile.industry === 'creative' && style === 'creative') score += 0.5;
      if (userProfile.role === 'executive' && style === 'executive') score += 0.5;
      
      styleScores[style] = score / targetPlatforms.length;
    }
    
    // Sort by score and return top recommendations
    return Object.entries(styleScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([style, score]) => ({
        style,
        compatibility: score,
        description: this.getStyleDescription(style),
        characteristics: this.styleOptimizations[style].characteristics
      }));
  }

  /**
   * Recommend optimal dimensions based on image analysis and target platforms
   */
  recommendDimensions(imageAnalysis, targetPlatforms) {
    const recommendations = [];
    
    const originalAspectRatio = imageAnalysis.width / imageAnalysis.height;
    
    for (const platform of targetPlatforms) {
      const specs = this.getSpecifications(platform);
      const defaultSpec = specs.default_spec;
      
      // Analyze how well the original image fits the platform requirements
      const aspectRatioDifference = Math.abs(originalAspectRatio - defaultSpec.aspectRatio);
      const resolutionMatch = Math.min(imageAnalysis.width / defaultSpec.width, imageAnalysis.height / defaultSpec.height);
      
      recommendations.push({
        platform,
        targetSpec: defaultSpec,
        aspectRatioCompatibility: Math.max(0, 1 - aspectRatioDifference),
        resolutionCompatibility: Math.min(1, resolutionMatch),
        croppingRequired: aspectRatioDifference > 0.1,
        upscalingRequired: resolutionMatch < 1,
        recommendedProcessing: this.getRecommendedProcessing(
          imageAnalysis, 
          defaultSpec, 
          aspectRatioDifference, 
          resolutionMatch
        )
      });
    }
    
    return recommendations.sort((a, b) => 
      (b.aspectRatioCompatibility + b.resolutionCompatibility) - 
      (a.aspectRatioCompatibility + a.resolutionCompatibility)
    );
  }

  /**
   * Get recommended processing based on image analysis
   */
  getRecommendedProcessing(imageAnalysis, targetSpec, aspectDiff, resolutionMatch) {
    const recommendations = [];
    
    if (aspectDiff > 0.1) {
      recommendations.push('intelligent_cropping');
    }
    
    if (resolutionMatch < 0.8) {
      recommendations.push('upscaling');
    }
    
    if (resolutionMatch > 2.0) {
      recommendations.push('downscaling');
    }
    
    if (imageAnalysis.quality < 0.8) {
      recommendations.push('quality_enhancement');
    }
    
    if (imageAnalysis.lighting < 0.7) {
      recommendations.push('lighting_optimization');
    }
    
    return recommendations;
  }

  /**
   * Get all supported platforms
   */
  getSupportedPlatforms() {
    return Object.keys(this.platforms);
  }

  /**
   * Get platforms by category
   */
  getPlatformsByCategory(category) {
    return Object.entries(this.platforms)
      .filter(([, data]) => data.category === category)
      .map(([platform]) => platform);
  }

  /**
   * Get style description
   */
  getStyleDescription(style) {
    const descriptions = {
      executive: 'C-suite executive presence with premium business attire and authoritative confidence',
      creative: 'Modern creative professional with contemporary styling and innovative confidence',
      tech: 'Silicon Valley professional with smart casual tech styling and forward-thinking presence',
      healthcare: 'Medical professional with clinical attire and trustworthy, caring expression',
      finance: 'Wall Street quality financial professional with conservative business attire',
      startup: 'Modern entrepreneur with contemporary business casual and visionary confidence'
    };
    
    return descriptions[style] || 'Professional headshot optimization';
  }

  /**
   * Validate platform compatibility
   */
  validatePlatformCompatibility(platforms, style) {
    const results = platforms.map(platform => ({
      platform,
      supported: this.platforms[platform] !== undefined,
      compatibility: this.platforms[platform] ? this.calculateStyleCompatibility(platform, style) : 0,
      recommendations: this.platforms[platform] ? this.getOptimizationRecommendations(platform, style) : null
    }));
    
    return {
      allSupported: results.every(r => r.supported),
      averageCompatibility: results.reduce((sum, r) => sum + r.compatibility, 0) / results.length,
      results
    };
  }

  /**
   * Get optimization recommendations for platform and style
   */
  getOptimizationRecommendations(platform, style) {
    const platformData = this.platforms[platform];
    const styleData = this.styleOptimizations[style];
    
    if (!platformData || !styleData) return [];
    
    const recommendations = [];
    
    // Add platform-specific optimizations
    if (platformData.optimizations.intelligentCropping) {
      recommendations.push('Enable intelligent face-aware cropping');
    }
    
    if (platformData.optimizations.professionalLighting) {
      recommendations.push('Apply professional lighting optimization');
    }
    
    // Add style-specific recommendations
    if (styleData.preferredPlatforms.includes(platform)) {
      recommendations.push(`${style} style is highly compatible with ${platform}`);
    } else {
      recommendations.push(`Consider adjusting ${style} style for better ${platform} compatibility`);
    }
    
    return recommendations;
  }
}

// Export singleton instance
export default new PlatformSpecificationEngine();