/**
 * Platform Specification Engine
 * Manages platform-specific requirements, dimensions, and optimization parameters
 * Provides comprehensive specifications for all supported social media platforms
 */

class PlatformSpecificationEngine {
  constructor() {
    this.platformSpecs = this.initializePlatformSpecifications();
    this.categories = this.initializeCategories();
  }

  /**
   * Initialize comprehensive platform specifications
   */
  initializePlatformSpecifications() {
    return {
      linkedin: {
        id: 'linkedin',
        name: 'LinkedIn',
        category: 'Professional',
        icon: '💼',
        color: '#0077B5',
        description: 'Professional networking platform',
        
        // Image specifications
        width: 400,
        height: 400,
        aspectRatio: '1:1',
        minWidth: 200,
        maxWidth: 7680,
        minHeight: 200,
        maxHeight: 4320,
        
        // Quality and compression
        quality: 0.95,
        format: 'jpeg',
        maxFileSize: 8 * 1024 * 1024, // 8MB
        
        // Professional styling requirements
        styling: {
          brightness: 1.05,
          saturation: 1.1,
          contrast: 1.08,
          sharpening: 0.5,
          professionalLevel: 'executive'
        },
        
        // Content guidelines
        guidelines: {
          background: 'professional',
          attire: 'business_professional',
          expression: 'confident_friendly',
          framing: 'headshot_shoulders'
        },
        
        // SEO and metadata
        metadata: {
          title: 'Professional LinkedIn Profile Photo',
          description: 'Executive professional headshot optimized for LinkedIn networking',
          keywords: ['professional', 'executive', 'business', 'networking', 'linkedin']
        }
      },

      instagram: {
        id: 'instagram',
        name: 'Instagram',
        category: 'Social',
        icon: '📸',
        color: '#E4405F',
        description: 'Visual social media platform',
        
        width: 320,
        height: 320,
        aspectRatio: '1:1',
        minWidth: 150,
        maxWidth: 1080,
        minHeight: 150,
        maxHeight: 1080,
        
        quality: 0.90,
        format: 'jpeg',
        maxFileSize: 3 * 1024 * 1024, // 3MB
        
        styling: {
          brightness: 1.1,
          saturation: 1.2,
          contrast: 1.12,
          sharpening: 0.7,
          professionalLevel: 'lifestyle'
        },
        
        guidelines: {
          background: 'lifestyle',
          attire: 'smart_casual',
          expression: 'friendly_approachable',
          framing: 'creative_headshot'
        },
        
        metadata: {
          title: 'Instagram Profile Photo',
          description: 'Engaging social media profile photo for Instagram',
          keywords: ['social', 'lifestyle', 'creative', 'instagram', 'personal_brand']
        }
      },

      facebook: {
        id: 'facebook',
        name: 'Facebook',
        category: 'Social',
        icon: '👥',
        color: '#1877F2',
        description: 'Social networking platform',
        
        width: 170,
        height: 170,
        aspectRatio: '1:1',
        minWidth: 128,
        maxWidth: 720,
        minHeight: 128,
        maxHeight: 720,
        
        quality: 0.88,
        format: 'jpeg',
        maxFileSize: 2 * 1024 * 1024, // 2MB
        
        styling: {
          brightness: 1.08,
          saturation: 1.15,
          contrast: 1.05,
          sharpening: 0.6,
          professionalLevel: 'friendly_professional'
        },
        
        guidelines: {
          background: 'friendly',
          attire: 'business_casual',
          expression: 'warm_friendly',
          framing: 'social_headshot'
        },
        
        metadata: {
          title: 'Facebook Profile Photo',
          description: 'Friendly professional photo for Facebook social networking',
          keywords: ['social', 'networking', 'friendly', 'facebook', 'community']
        }
      },

      twitter: {
        id: 'twitter',
        name: 'Twitter',
        category: 'Social',
        icon: '🐦',
        color: '#1DA1F2',
        description: 'Microblogging and social networking',
        
        width: 400,
        height: 400,
        aspectRatio: '1:1',
        minWidth: 128,
        maxWidth: 1024,
        minHeight: 128,
        maxHeight: 1024,
        
        quality: 0.92,
        format: 'jpeg',
        maxFileSize: 2 * 1024 * 1024, // 2MB
        
        styling: {
          brightness: 1.06,
          saturation: 1.08,
          contrast: 1.15,
          sharpening: 1.0, // Higher sharpening for small display
          professionalLevel: 'thought_leader'
        },
        
        guidelines: {
          background: 'professional',
          attire: 'smart_professional',
          expression: 'authoritative_friendly',
          framing: 'clear_headshot'
        },
        
        metadata: {
          title: 'Twitter Profile Photo',
          description: 'Professional photo for Twitter thought leadership',
          keywords: ['professional', 'thought_leader', 'expert', 'twitter', 'authority']
        }
      },

      youtube: {
        id: 'youtube',
        name: 'YouTube',
        category: 'Content',
        icon: '📺',
        color: '#FF0000',
        description: 'Video content platform',
        
        width: 800,
        height: 800,
        aspectRatio: '1:1',
        minWidth: 98,
        maxWidth: 4000,
        minHeight: 98,
        maxHeight: 4000,
        
        quality: 0.95,
        format: 'jpeg',
        maxFileSize: 4 * 1024 * 1024, // 4MB
        
        styling: {
          brightness: 1.02,
          saturation: 1.05,
          contrast: 1.10,
          sharpening: 0.8,
          professionalLevel: 'content_creator'
        },
        
        guidelines: {
          background: 'creative',
          attire: 'content_creator',
          expression: 'engaging_confident',
          framing: 'creator_headshot'
        },
        
        metadata: {
          title: 'YouTube Channel Photo',
          description: 'Professional content creator photo for YouTube',
          keywords: ['content_creator', 'youtube', 'video', 'creator', 'media']
        }
      },

      tiktok: {
        id: 'tiktok',
        name: 'TikTok',
        category: 'Content',
        icon: '🎵',
        color: '#000000',
        description: 'Short-form video content',
        
        width: 200,
        height: 200,
        aspectRatio: '1:1',
        minWidth: 100,
        maxWidth: 500,
        minHeight: 100,
        maxHeight: 500,
        
        quality: 0.85,
        format: 'jpeg',
        maxFileSize: 1 * 1024 * 1024, // 1MB
        
        styling: {
          brightness: 1.12,
          saturation: 1.25,
          contrast: 1.20,
          sharpening: 0.9,
          professionalLevel: 'dynamic'
        },
        
        guidelines: {
          background: 'dynamic',
          attire: 'trendy_professional',
          expression: 'energetic_engaging',
          framing: 'dynamic_close_up'
        },
        
        metadata: {
          title: 'TikTok Profile Photo',
          description: 'Energetic professional photo for TikTok content',
          keywords: ['dynamic', 'content', 'tiktok', 'energetic', 'engaging']
        }
      },

      whatsapp_business: {
        id: 'whatsapp_business',
        name: 'WhatsApp Business',
        category: 'Business',
        icon: '💬',
        color: '#25D366',
        description: 'Business communication platform',
        
        width: 256,
        height: 256,
        aspectRatio: '1:1',
        minWidth: 96,
        maxWidth: 640,
        minHeight: 96,
        maxHeight: 640,
        
        quality: 0.90,
        format: 'jpeg',
        maxFileSize: 512 * 1024, // 512KB
        
        styling: {
          brightness: 1.06,
          saturation: 1.08,
          contrast: 1.05,
          sharpening: 0.6,
          professionalLevel: 'approachable_business'
        },
        
        guidelines: {
          background: 'professional_friendly',
          attire: 'business_approachable',
          expression: 'trustworthy_friendly',
          framing: 'business_headshot'
        },
        
        metadata: {
          title: 'WhatsApp Business Profile Photo',
          description: 'Professional business photo for WhatsApp Business',
          keywords: ['business', 'professional', 'trustworthy', 'whatsapp', 'communication']
        }
      },

      github: {
        id: 'github',
        name: 'GitHub',
        category: 'Professional',
        icon: '⚡',
        color: '#181717',
        description: 'Developer platform and portfolio',
        
        width: 460,
        height: 460,
        aspectRatio: '1:1',
        minWidth: 120,
        maxWidth: 1024,
        minHeight: 120,
        maxHeight: 1024,
        
        quality: 0.93,
        format: 'jpeg',
        maxFileSize: 1 * 1024 * 1024, // 1MB
        
        styling: {
          brightness: 1.03,
          saturation: 1.02,
          contrast: 1.05,
          sharpening: 0.7,
          professionalLevel: 'technical_expert'
        },
        
        guidelines: {
          background: 'clean_minimal',
          attire: 'tech_professional',
          expression: 'competent_innovative',
          framing: 'developer_headshot'
        },
        
        metadata: {
          title: 'GitHub Profile Photo',
          description: 'Professional developer photo for GitHub portfolio',
          keywords: ['developer', 'technical', 'github', 'programming', 'innovation']
        }
      }
    };
  }

  /**
   * Initialize platform categories
   */
  initializeCategories() {
    return {
      Professional: {
        name: 'Professional',
        description: 'Business and career-focused platforms',
        platforms: ['linkedin', 'github'],
        defaultStyle: 'professional',
        emphasis: 'authority_expertise'
      },
      Social: {
        name: 'Social',
        description: 'Personal social networking platforms',
        platforms: ['instagram', 'facebook', 'twitter'],
        defaultStyle: 'friendly_professional',
        emphasis: 'approachability_personality'
      },
      Content: {
        name: 'Content',
        description: 'Content creation and media platforms',
        platforms: ['youtube', 'tiktok'],
        defaultStyle: 'creative_professional',
        emphasis: 'creativity_engagement'
      },
      Business: {
        name: 'Business',
        description: 'Business communication platforms',
        platforms: ['whatsapp_business'],
        defaultStyle: 'approachable_business',
        emphasis: 'trustworthiness_accessibility'
      }
    };
  }

  /**
   * Get specifications for multiple platforms
   */
  async getMultiplePlatformSpecs(platforms) {
    const specs = {};
    
    for (const platform of platforms) {
      const spec = this.getPlatformSpec(platform);
      if (spec) {
        specs[platform] = spec;
      }
    }
    
    return specs;
  }

  /**
   * Get specification for a single platform
   */
  getPlatformSpec(platform) {
    return this.platformSpecs[platform] || null;
  }

  /**
   * Get all supported platforms
   */
  getAllPlatforms() {
    return Object.keys(this.platformSpecs);
  }

  /**
   * Get platforms by category
   */
  getPlatformsByCategory(category) {
    const categoryInfo = this.categories[category];
    if (!categoryInfo) return [];
    
    return categoryInfo.platforms.map(platformId => ({
      ...this.platformSpecs[platformId],
      categoryInfo
    }));
  }

  /**
   * Get all platform categories
   */
  getAllCategories() {
    return this.categories;
  }

  /**
   * Validate platform requirements
   */
  validateImageForPlatform(imageInfo, platform) {
    const spec = this.getPlatformSpec(platform);
    if (!spec) {
      return { valid: false, error: `Platform ${platform} not supported` };
    }

    const errors = [];

    // Check dimensions
    if (imageInfo.width < spec.minWidth || imageInfo.width > spec.maxWidth) {
      errors.push(`Width ${imageInfo.width}px outside range ${spec.minWidth}-${spec.maxWidth}px`);
    }

    if (imageInfo.height < spec.minHeight || imageInfo.height > spec.maxHeight) {
      errors.push(`Height ${imageInfo.height}px outside range ${spec.minHeight}-${spec.maxHeight}px`);
    }

    // Check file size
    if (imageInfo.size > spec.maxFileSize) {
      const maxSizeMB = (spec.maxFileSize / (1024 * 1024)).toFixed(1);
      const currentSizeMB = (imageInfo.size / (1024 * 1024)).toFixed(1);
      errors.push(`File size ${currentSizeMB}MB exceeds limit of ${maxSizeMB}MB`);
    }

    return {
      valid: errors.length === 0,
      errors,
      recommendations: this.generateOptimizationRecommendations(imageInfo, spec)
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(imageInfo, spec) {
    const recommendations = [];

    // Dimension recommendations
    if (imageInfo.width !== spec.width || imageInfo.height !== spec.height) {
      recommendations.push({
        type: 'resize',
        description: `Resize to ${spec.width}x${spec.height}px for optimal display`,
        priority: 'high'
      });
    }

    // Quality recommendations
    if (imageInfo.quality && imageInfo.quality > spec.quality) {
      recommendations.push({
        type: 'compression',
        description: `Reduce quality to ${Math.round(spec.quality * 100)}% for optimal file size`,
        priority: 'medium'
      });
    }

    // Styling recommendations based on platform
    const styling = spec.styling;
    recommendations.push({
      type: 'enhancement',
      description: `Apply ${spec.name} optimization: ${styling.professionalLevel} styling`,
      priority: 'high',
      details: {
        brightness: styling.brightness,
        saturation: styling.saturation,
        contrast: styling.contrast
      }
    });

    return recommendations;
  }

  /**
   * Get optimal batch processing order
   * Orders platforms by processing complexity and file size to optimize resource usage
   */
  getOptimalProcessingOrder(platforms) {
    const platformsWithSpecs = platforms.map(platform => ({
      platform,
      spec: this.getPlatformSpec(platform),
      complexity: this.calculateProcessingComplexity(platform)
    })).filter(item => item.spec);

    // Sort by complexity (simple first) and then by file size (largest first)
    return platformsWithSpecs
      .sort((a, b) => {
        if (a.complexity !== b.complexity) {
          return a.complexity - b.complexity; // Simple first
        }
        return b.spec.maxFileSize - a.spec.maxFileSize; // Larger files first
      })
      .map(item => item.platform);
  }

  /**
   * Calculate processing complexity for a platform
   */
  calculateProcessingComplexity(platform) {
    const spec = this.getPlatformSpec(platform);
    if (!spec) return 10; // Unknown = high complexity

    let complexity = 0;

    // Size complexity
    const pixelCount = spec.width * spec.height;
    complexity += Math.log10(pixelCount); // Larger images = more complex

    // Styling complexity
    const styling = spec.styling;
    if (styling.brightness !== 1.0) complexity += 1;
    if (styling.saturation !== 1.0) complexity += 1;
    if (styling.contrast !== 1.0) complexity += 1;
    if (styling.sharpening > 0.5) complexity += 2;

    // Quality requirements
    if (spec.quality > 0.9) complexity += 1;

    return Math.round(complexity);
  }

  /**
   * Get platform comparison matrix
   */
  getPlatformComparisonMatrix(platforms) {
    const matrix = {};
    
    for (const platform of platforms) {
      const spec = this.getPlatformSpec(platform);
      if (spec) {
        matrix[platform] = {
          dimensions: `${spec.width}x${spec.height}`,
          fileSize: `${(spec.maxFileSize / (1024 * 1024)).toFixed(1)}MB`,
          quality: `${Math.round(spec.quality * 100)}%`,
          category: spec.category,
          complexity: this.calculateProcessingComplexity(platform)
        };
      }
    }
    
    return matrix;
  }

  /**
   * Health check for platform specifications
   */
  async healthCheck() {
    try {
      const platformCount = Object.keys(this.platformSpecs).length;
      const categoryCount = Object.keys(this.categories).length;
      
      // Validate all specifications have required fields
      const validationResults = [];
      for (const [platformId, spec] of Object.entries(this.platformSpecs)) {
        const isValid = spec.width && spec.height && spec.quality && spec.format;
        validationResults.push({ platform: platformId, valid: isValid });
      }
      
      const validPlatforms = validationResults.filter(r => r.valid).length;
      
      return {
        status: 'healthy',
        platforms: platformCount,
        categories: categoryCount,
        validSpecifications: validPlatforms,
        supportedPlatforms: this.getAllPlatforms()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = { PlatformSpecificationEngine };