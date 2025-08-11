/**
 * Professional Configuration - LinkedIn Headshot Generator
 * Controls professional mock services and industry-specific features
 */

import { Platform } from 'react-native';

export interface ProfessionalConfig {
  enabled: boolean;
  version: string;
  professional_features: {
    ai_headshot_generation: boolean;
    linkedin_integration: boolean;
    professional_templates: boolean;
    quality_scoring: boolean;
    career_analytics: boolean;
    industry_optimization: boolean;
  };
  processing: {
    ai_delay_ms: number;
    quality_threshold: number;
    professional_standards: boolean;
  };
  industry_support: {
    supported_industries: string[];
    default_industry: string;
    custom_styling_per_industry: boolean;
  };
}

export const PROFESSIONAL_CONFIG: ProfessionalConfig = {
  enabled: true, // Professional mock services enabled
  version: '1.5.0',
  
  professional_features: {
    ai_headshot_generation: true,
    linkedin_integration: true,
    professional_templates: true,
    quality_scoring: true,
    career_analytics: true,
    industry_optimization: true
  },
  
  processing: {
    ai_delay_ms: 3500, // Longer processing for professional quality
    quality_threshold: 8.5, // Higher threshold for professional standards
    professional_standards: true
  },
  
  industry_support: {
    supported_industries: [
      'Technology',
      'Finance',
      'Healthcare',
      'Consulting',
      'Marketing',
      'Sales',
      'Executive Leadership',
      'Legal',
      'Education',
      'Engineering',
      'Real Estate',
      'Media & Communications'
    ],
    default_industry: 'Technology',
    custom_styling_per_industry: true
  }
};

// Professional Style Templates Configuration
export const PROFESSIONAL_STYLE_CONFIG = {
  corporate: {
    name: 'Corporate Professional',
    description: 'Conservative, traditional business look',
    target_industries: ['Finance', 'Legal', 'Consulting', 'Banking'],
    background_color: '#f8f9fa',
    lighting_style: 'soft-front',
    composition: 'centered-formal',
    professional_score_boost: 0.3
  },
  
  creative: {
    name: 'Creative Professional',
    description: 'Modern, approachable professional',
    target_industries: ['Marketing', 'Design', 'Media', 'Advertising'],
    background_color: '#ffffff',
    lighting_style: 'natural-side', 
    composition: 'rule-of-thirds',
    professional_score_boost: 0.2
  },
  
  executive: {
    name: 'Executive Leadership',
    description: 'Authoritative, leadership-focused',
    target_industries: ['Executive', 'C-Suite', 'Board Member', 'Director'],
    background_color: '#2c3e50',
    lighting_style: 'dramatic-key',
    composition: 'power-pose',
    professional_score_boost: 0.4
  },
  
  healthcare: {
    name: 'Healthcare Professional',
    description: 'Trustworthy and approachable',
    target_industries: ['Healthcare', 'Medicine', 'Nursing', 'Therapy'],
    background_color: '#e8f4f8',
    lighting_style: 'soft-natural',
    composition: 'approachable-confident',
    professional_score_boost: 0.25
  },
  
  technology: {
    name: 'Tech Innovation',
    description: 'Modern tech professional styling',
    target_industries: ['Technology', 'Software', 'Engineering', 'Startups'],
    background_color: '#f0f0f0',
    lighting_style: 'clean-modern',
    composition: 'contemporary-casual',
    professional_score_boost: 0.2
  }
};

// LinkedIn Integration Configuration
export const LINKEDIN_INTEGRATION_CONFIG = {
  oauth: {
    mock_success_rate: 0.85, // 85% success rate for mock OAuth
    auth_delay_ms: 2500,
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social']
  },
  
  profile_sync: {
    sync_delay_ms: 4000,
    upload_success_rate: 0.90,
    analytics_tracking: true
  },
  
  professional_benefits: {
    profile_view_increase: { min: 20, max: 80 }, // 20-80% increase
    search_appearance_boost: { min: 15, max: 45 }, // 15-45 more appearances  
    connection_growth: { min: 5, max: 20 } // 5-20 new connections
  }
};

// Professional Quality Metrics
export const PROFESSIONAL_QUALITY_METRICS = {
  scoring_weights: {
    lighting: 0.30,
    composition: 0.25,
    professionalism: 0.35,
    linkedin_compliance: 0.10
  },
  
  minimum_scores: {
    entry_level: 7.5,
    mid_level: 8.0,
    senior_level: 8.5,
    executive_level: 9.0
  },
  
  quality_factors: {
    background_cleanliness: { weight: 0.15, min_score: 8.0 },
    professional_attire: { weight: 0.20, min_score: 8.5 },
    eye_contact: { weight: 0.15, min_score: 8.0 },
    facial_expression: { weight: 0.20, min_score: 7.5 },
    image_resolution: { weight: 0.10, min_score: 9.0 },
    lighting_quality: { weight: 0.20, min_score: 8.5 }
  }
};

// Professional Mock Data Templates
export const PROFESSIONAL_DEMO_PROFILES = [
  {
    id: 'prof_demo_1',
    firstName: 'Alexandra',
    lastName: 'Chen',
    industry: 'Technology',
    experience_level: 'senior',
    headline: 'Senior Product Manager | AI & Machine Learning',
    location: 'San Francisco Bay Area',
    connections: 1247,
    preferred_style: 'technology'
  },
  {
    id: 'prof_demo_2', 
    firstName: 'Michael',
    lastName: 'Rodriguez',
    industry: 'Finance',
    experience_level: 'executive',
    headline: 'VP of Investment Strategy | Financial Planning',
    location: 'New York, NY',
    connections: 2156,
    preferred_style: 'corporate'
  },
  {
    id: 'prof_demo_3',
    firstName: 'Sarah',
    lastName: 'Johnson',
    industry: 'Healthcare',
    experience_level: 'mid-level',
    headline: 'Registered Nurse | Patient Care Specialist',
    location: 'Chicago, IL',
    connections: 634,
    preferred_style: 'healthcare'
  }
];

// Platform-specific Professional Configuration
export const PLATFORM_PROFESSIONAL_CONFIG = {
  ios: {
    camera_quality: 'high',
    processing_indicator: 'elegant',
    professional_haptics: true,
    linkedin_deep_linking: true
  },
  android: {
    camera_quality: 'high',
    processing_indicator: 'material',
    professional_haptics: true,
    linkedin_deep_linking: true
  }
};

export const getProfessionalPlatformConfig = () => {
  return PLATFORM_PROFESSIONAL_CONFIG[Platform.OS] || PLATFORM_PROFESSIONAL_CONFIG.ios;
};

// Professional Feature Flags
export const PROFESSIONAL_FEATURE_FLAGS = {
  ai_enhancement: true,
  style_templates: true,
  linkedin_integration: true,
  quality_scoring: true,
  professional_analytics: true,
  career_impact_tracking: true,
  industry_optimization: true,
  premium_processing: true,
  batch_processing: false, // Future feature
  video_headshots: false, // Future feature
  team_management: false  // Future feature
};

// Professional Environment Configuration
export const getProfessionalConfigForEnvironment = (environment: 'development' | 'production' | 'testing') => {
  const baseConfig = { ...PROFESSIONAL_CONFIG };
  
  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        processing: {
          ...baseConfig.processing,
          ai_delay_ms: 1500, // Faster for development
          professional_standards: true
        }
      };
      
    case 'testing':
      return {
        ...baseConfig,
        processing: {
          ...baseConfig.processing,
          ai_delay_ms: 200, // Very fast for tests
          quality_threshold: 5.0, // Lower for testing
          professional_standards: false
        }
      };
      
    case 'production':
      return {
        ...baseConfig,
        processing: {
          ...baseConfig.processing,
          professional_standards: true, // Highest quality for production
          quality_threshold: 8.5
        }
      };
      
    default:
      return baseConfig;
  }
};