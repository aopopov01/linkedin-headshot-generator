// Professional headshot style templates and configurations
// Enhanced with dramatic AI transformation capabilities

import { AttireTemplateUtils } from '../config/professionalAttireTemplates';

export const STYLE_TEMPLATES = {
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    displayName: 'Corporate Professional',
    description: 'Classic business attire with clean background - perfect for finance, consulting, and traditional industries',
    
    // Enhanced dramatic transformation prompts
    prompt: 'ultra-realistic professional corporate headshot portrait, impeccably dressed person in premium business suit, crisp white dress shirt, sophisticated tie, clean white studio background, premium three-point studio lighting setup, confident trustworthy expression, sharp focus, incredibly detailed, high-end corporate photography, 8K resolution, professional retouching, executive quality',
    
    negativePrompt: 'casual clothing, colorful background, poor lighting, blurry, distorted, unprofessional, cartoon, anime, low quality, pixelated, amateur photography, harsh shadows, overexposed, underexposed, wrinkled clothing, poor grooming, inappropriate attire',
    
    // Dramatic transformation settings
    dramaticSettings: {
      clothingTransformation: true,
      backgroundReplacement: true,
      lightingEnhancement: true,
      facePreservation: 0.95,
      styleStrength: 0.9,
      professionalGrade: true
    },
    
    category: 'business',
    popularity: 95,
    industries: ['Finance', 'Consulting', 'Law', 'Banking', 'Insurance'],
    
    features: {
      background: 'Premium white studio with professional gradient',
      attire: 'Executive business suit with complete professional styling',
      lighting: 'Three-point studio lighting with key, fill, and rim',
      expression: 'Confident, trustworthy, executive presence',
      composition: 'Professional headshot with dramatic quality enhancement',
      transformation: 'Complete professional makeover including attire and background'
    },
    
    // Before/After transformation examples
    transformationExamples: {
      attire: 'Transforms casual clothing to premium business suit',
      background: 'Replaces any background with professional studio setup',
      lighting: 'Adds premium studio lighting for executive appearance',
      overall: 'Creates dramatic corporate transformation with WOW factor'
    },
    
    tags: ['professional', 'corporate', 'formal', 'business', 'dramatic', 'transformation'],
    pricing: 'free',
    transformationType: 'dramatic_professional',
    recommendedFor: ['Executive meetings', 'LinkedIn profiles', 'Corporate websites', 'Professional networking']
  },

  creative: {
    id: 'creative',
    name: 'Creative',
    displayName: 'Creative Professional',
    description: 'Modern and approachable style for creative industries and startups',
    prompt: 'professional creative headshot, smart casual attire, modern background, natural lighting, approachable friendly expression, high quality, 4k, professional photography',
    negativePrompt: 'overly formal, stiff pose, harsh lighting, blurry, distorted, unprofessional',
    category: 'creative',
    popularity: 85,
    industries: ['Design', 'Marketing', 'Advertising', 'Media', 'Architecture'],
    features: {
      background: 'Modern, subtly textured',
      attire: 'Smart casual, stylish',
      lighting: 'Natural, soft lighting',
      expression: 'Friendly and approachable',
      composition: 'Relaxed but professional',
    },
    tags: ['creative', 'modern', 'approachable', 'stylish'],
    pricing: 'free',
  },

  executive: {
    id: 'executive',
    name: 'Executive',
    displayName: 'Executive Leadership',
    description: 'ULTIMATE TRANSFORMATION: Premium C-suite makeover with dramatic before/after results',
    
    // Most dramatic transformation prompts for maximum WOW factor
    prompt: 'ULTRA-REALISTIC EXECUTIVE TRANSFORMATION: CEO-level professional headshot portrait, person transformed into premium dark navy three-piece business suit, crisp white French cuff dress shirt, luxury silk tie, gold cufflinks, perfectly groomed executive appearance, sophisticated gray gradient background, PREMIUM STUDIO LIGHTING with dramatic key light and rim light, commanding authoritative expression, executive presence and gravitas, incredibly sharp focus, museum-quality detail, HIGHEST-END CORPORATE PHOTOGRAPHY, 8K+ resolution, professional retouching perfection, Fortune 500 CEO quality',
    
    negativePrompt: 'casual clothing, poor lighting, blurry, distorted, unprofessional, cartoon, anime, low quality, pixelated, amateur photography, harsh shadows, overexposed, underexposed, casual background, wrinkled clothing, poor grooming, inappropriate attire, budget photography, amateur styling, low-end appearance',
    
    // Maximum dramatic transformation settings
    dramaticSettings: {
      clothingTransformation: true,
      backgroundReplacement: true,
      lightingEnhancement: true,
      executiveGrooming: true,
      premiumStyling: true,
      facePreservation: 0.98, // Highest face preservation
      styleStrength: 0.95, // Maximum style transformation
      professionalGrade: true,
      executiveLevel: true,
      dramaticLevel: 10 // Maximum drama
    },
    
    category: 'executive',
    popularity: 75,
    industries: ['Executive', 'C-Suite', 'Board Members', 'Senior Leadership', 'Fortune 500'],
    
    features: {
      background: 'Sophisticated executive gradient with premium studio lighting',
      attire: 'Three-piece executive suit with luxury accessories and perfect grooming',
      lighting: 'Dramatic premium studio setup with key, fill, and rim lights',
      expression: 'Commanding executive presence with authoritative confidence',
      composition: 'CEO-level professional headshot with ultimate dramatic impact',
      transformation: 'COMPLETE EXECUTIVE MAKEOVER - transforms any photo into Fortune 500 CEO appearance'
    },
    
    // Dramatic before/after transformation examples
    transformationExamples: {
      attire: 'Transforms ANY clothing into premium three-piece executive suit',
      background: 'Creates sophisticated executive office environment',
      lighting: 'Adds dramatic premium studio lighting for commanding presence',
      grooming: 'Enhances to executive-level professional grooming',
      overall: 'Creates DRAMATIC CEO transformation - ordinary to Fortune 500 executive'
    },
    
    tags: ['executive', 'leadership', 'authoritative', 'premium', 'dramatic', 'CEO', 'transformation', 'luxury'],
    pricing: 'premium',
    transformationType: 'ultimate_dramatic_executive',
    recommendedFor: ['C-Suite profiles', 'Board positions', 'Executive leadership', 'Fortune 500 roles', 'Premium LinkedIn'],
    
    // Special executive features
    executiveFeatures: {
      luxuryAccessories: true,
      executiveGrooming: true,
      premiumLighting: true,
      commandingPresence: true,
      fortuneQuality: true
    }
  },

  startup: {
    id: 'startup',
    name: 'Startup',
    displayName: 'Tech & Startup',
    description: 'Modern, innovative look perfect for tech professionals and entrepreneurs',
    prompt: 'modern professional headshot, business casual shirt, clean minimal background, bright natural lighting, innovative friendly expression, high quality, 4k, professional photography',
    negativePrompt: 'overly formal suit, dark background, harsh lighting, stiff expression, blurry, distorted',
    category: 'tech',
    popularity: 90,
    industries: ['Technology', 'Startups', 'Software', 'Innovation', 'Entrepreneurship'],
    features: {
      background: 'Clean, minimal, bright',
      attire: 'Business casual, modern',
      lighting: 'Bright, energetic',
      expression: 'Innovative and forward-thinking',
      composition: 'Dynamic, contemporary',
    },
    tags: ['tech', 'startup', 'innovative', 'modern'],
    pricing: 'free',
  },

  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    displayName: 'Healthcare Professional',
    description: 'DRAMATIC MEDICAL TRANSFORMATION: Complete healthcare professional makeover',
    
    // Enhanced healthcare transformation prompts
    prompt: 'ULTRA-REALISTIC HEALTHCARE TRANSFORMATION: professional medical headshot portrait, person transformed into pristine white medical coat over premium professional business attire, perfectly clean and pressed medical appearance, stethoscope appropriately placed, clean medical facility background, professional medical photography lighting, trustworthy caring facial expression, approachable yet authoritative medical presence, incredibly detailed, hospital-grade professional photography, 8K resolution, medical-standard professional retouching',
    
    negativePrompt: 'unprofessional attire, casual clothing, distracting background, harsh expression, blurry, distorted, low quality, amateur photography, inappropriate medical setting, wrinkled medical coat, unprofessional medical environment, poor grooming',
    
    // Medical transformation settings
    dramaticSettings: {
      clothingTransformation: true,
      medicalCoatAddition: true,
      backgroundReplacement: true,
      lightingEnhancement: true,
      medicalAccessories: true,
      facePreservation: 0.96,
      styleStrength: 0.9,
      professionalGrade: true,
      medicalStandard: true
    },
    
    category: 'healthcare',
    popularity: 70,
    industries: ['Medicine', 'Healthcare', 'Nursing', 'Therapy', 'Wellness', 'Medical Practice'],
    
    features: {
      background: 'Clean medical facility environment with professional setup',
      attire: 'Pristine white medical coat with professional business attire underneath',
      lighting: 'Medical-grade even lighting for trustworthy professional appearance',
      expression: 'Trustworthy, caring, medically authoritative presence',
      composition: 'Hospital-quality professional headshot with medical credibility',
      transformation: 'COMPLETE MEDICAL MAKEOVER - transforms any photo into trusted healthcare professional'
    },
    
    // Medical transformation examples
    transformationExamples: {
      attire: 'Transforms any clothing into pristine medical coat over professional attire',
      background: 'Creates clean medical facility environment',
      lighting: 'Adds medical-standard professional lighting',
      accessories: 'Adds appropriate medical accessories like stethoscope',
      overall: 'Creates dramatic healthcare transformation - instant medical credibility'
    },
    
    tags: ['healthcare', 'medical', 'trustworthy', 'caring', 'dramatic', 'transformation', 'professional'],
    pricing: 'premium',
    transformationType: 'dramatic_medical_professional',
    recommendedFor: ['Medical practice websites', 'Healthcare LinkedIn', 'Hospital staff profiles', 'Medical directories']
  },

  academic: {
    id: 'academic',
    name: 'Academic',
    displayName: 'Academic & Education',
    description: 'Scholarly and intellectual appearance for educators and researchers',
    prompt: 'academic professional headshot, professional academic attire, scholarly background, intelligent confident expression, high quality, 4k, professional photography',
    negativePrompt: 'casual clothing, distracting background, unprofessional expression, blurry, distorted',
    category: 'education',
    popularity: 60,
    industries: ['Education', 'Research', 'Academia', 'Universities', 'Think Tanks'],
    features: {
      background: 'Scholarly, possibly with books',
      attire: 'Academic professional',
      lighting: 'Intellectual, thoughtful',
      expression: 'Intelligent and approachable',
      composition: 'Scholarly presentation',
    },
    tags: ['academic', 'scholarly', 'intellectual', 'education'],
    pricing: 'premium',
  },

  sales: {
    id: 'sales',
    name: 'Sales',
    displayName: 'Sales & Business Development',
    description: 'Energetic and personable style that builds trust and rapport',
    prompt: 'sales professional headshot, confident business attire, approachable background, energetic trustworthy expression, high quality, 4k, professional photography',
    negativePrompt: 'overly aggressive expression, unprofessional attire, distracting background, blurry, distorted',
    category: 'sales',
    popularity: 80,
    industries: ['Sales', 'Business Development', 'Account Management', 'Customer Success'],
    features: {
      background: 'Warm and inviting',
      attire: 'Professional but approachable',
      lighting: 'Warm and energetic',
      expression: 'Confident and trustworthy',
      composition: 'Engaging and personable',
    },
    tags: ['sales', 'energetic', 'trustworthy', 'personable'],
    pricing: 'free',
  },

  consulting: {
    id: 'consulting',
    name: 'Consulting',
    displayName: 'Management Consulting',
    description: 'Strategic and analytical appearance for consulting professionals',
    prompt: 'consulting professional headshot, sharp business suit, professional background, strategic confident expression, high quality, 4k, professional photography',
    negativePrompt: 'casual attire, unprofessional background, uncertain expression, blurry, distorted',
    category: 'consulting',
    popularity: 75,
    industries: ['Management Consulting', 'Strategy', 'Business Advisory', 'Analytics'],
    features: {
      background: 'Professional, strategic',
      attire: 'Sharp business formal',
      lighting: 'Crisp and clear',
      expression: 'Strategic and analytical',
      composition: 'Authoritative expertise',
    },
    tags: ['consulting', 'strategic', 'analytical', 'expert'],
    pricing: 'premium',
  },
};

// Style categories for easy filtering
export const STYLE_CATEGORIES = {
  business: {
    name: 'Business & Finance',
    styles: ['corporate', 'executive', 'consulting'],
    description: 'Traditional business and financial services',
  },
  creative: {
    name: 'Creative & Design',
    styles: ['creative', 'startup'],
    description: 'Creative industries and modern workplaces',
  },
  tech: {
    name: 'Technology',
    styles: ['startup', 'creative'],
    description: 'Tech companies and startups',
  },
  healthcare: {
    name: 'Healthcare & Medical',
    styles: ['healthcare'],
    description: 'Medical and healthcare professionals',
  },
  education: {
    name: 'Education & Research',
    styles: ['academic'],
    description: 'Educational and research institutions',
  },
  sales: {
    name: 'Sales & Marketing',
    styles: ['sales', 'creative'],
    description: 'Sales, marketing, and customer-facing roles',
  },
};

// Industry-specific style recommendations
export const INDUSTRY_RECOMMENDATIONS = {
  'Software Engineering': ['startup', 'creative'],
  'Finance': ['corporate', 'executive'],
  'Marketing': ['creative', 'sales'],
  'Healthcare': ['healthcare'],
  'Education': ['academic'],
  'Sales': ['sales', 'corporate'],
  'Consulting': ['consulting', 'executive'],
  'Law': ['corporate', 'executive'],
  'Design': ['creative'],
  'Startups': ['startup', 'creative'],
  'Real Estate': ['sales', 'corporate'],
  'Non-Profit': ['academic', 'healthcare'],
};

// Utility functions
export const StyleTemplateUtils = {
  
  // Get style by ID
  getStyleById: (styleId) => {
    return STYLE_TEMPLATES[styleId] || null;
  },

  // Get all free styles
  getFreeStyles: () => {
    return Object.values(STYLE_TEMPLATES).filter(style => style.pricing === 'free');
  },

  // Get all premium styles
  getPremiumStyles: () => {
    return Object.values(STYLE_TEMPLATES).filter(style => style.pricing === 'premium');
  },

  // Get styles by category
  getStylesByCategory: (category) => {
    return Object.values(STYLE_TEMPLATES).filter(style => style.category === category);
  },

  // Get recommended styles for industry
  getRecommendedStyles: (industry) => {
    const recommendedIds = INDUSTRY_RECOMMENDATIONS[industry] || ['corporate', 'creative'];
    return recommendedIds.map(id => STYLE_TEMPLATES[id]).filter(Boolean);
  },

  // Get popular styles
  getPopularStyles: (limit = 5) => {
    return Object.values(STYLE_TEMPLATES)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  },

  // Search styles by keyword
  searchStyles: (keyword) => {
    const searchTerm = keyword.toLowerCase();
    return Object.values(STYLE_TEMPLATES).filter(style => 
      style.name.toLowerCase().includes(searchTerm) ||
      style.description.toLowerCase().includes(searchTerm) ||
      style.tags.some(tag => tag.includes(searchTerm)) ||
      style.industries.some(industry => industry.toLowerCase().includes(searchTerm))
    );
  },

  // Get style configuration for AI processing (ENHANCED for dramatic transformations)
  getStyleConfig: (styleId, customizations = {}) => {
    const style = STYLE_TEMPLATES[styleId];
    if (!style) return null;

    // Use dramatic settings if available
    const dramaticSettings = style.dramaticSettings || {};
    
    return {
      prompt: style.prompt,
      negativePrompt: style.negativePrompt,
      styleStrength: customizations.styleStrength || dramaticSettings.styleStrength || 0.8,
      numOutputs: customizations.numOutputs || 4,
      guidanceScale: customizations.guidanceScale || 7.5, // Higher for better results
      numSteps: customizations.numSteps || 80, // Higher for better quality
      strength: customizations.strength || 0.85, // High transformation strength
      facePreservation: dramaticSettings.facePreservation || 0.95,
      transformationType: style.transformationType || 'standard',
      dramaticLevel: dramaticSettings.dramaticLevel || 5,
      ...customizations,
    };
  },

  // NEW: Get dramatic transformation configuration
  getDramaticConfig: (styleId, options = {}) => {
    const style = STYLE_TEMPLATES[styleId];
    if (!style) return null;

    const attireConfig = AttireTemplateUtils.generateTransformationPrompt(
      styleId, 
      options.gender || 'neutral', 
      options.backgroundType || 'studio'
    );

    if (!attireConfig) {
      // Fallback to style template prompts
      return StyleTemplateUtils.getStyleConfig(styleId, options);
    }

    return {
      prompt: attireConfig.mainPrompt,
      negativePrompt: attireConfig.negativePrompt,
      styleStrength: attireConfig.styleStrength,
      formalityLevel: attireConfig.formalityLevel,
      numSteps: options.numSteps || 100, // High quality for dramatic results
      guidanceScale: options.guidanceScale || 8.0, // Strong prompt adherence
      strength: options.strength || 0.9, // High transformation
      numOutputs: options.numOutputs || 6, // More variations
      seed: options.seed || null,
      metadata: attireConfig.metadata,
      transformationType: 'dramatic_professional'
    };
  },

  // NEW: Get transformation examples for marketing/display
  getTransformationExamples: (styleId) => {
    const style = STYLE_TEMPLATES[styleId];
    return style?.transformationExamples || null;
  },

  // NEW: Check if style supports dramatic transformation
  supportsDramaticTransformation: (styleId) => {
    const style = STYLE_TEMPLATES[styleId];
    return style?.dramaticSettings?.clothingTransformation === true;
  },

  // NEW: Get recommended processing time for dramatic transformations
  getDramaticProcessingTime: (styleId, numOutputs = 4) => {
    const style = STYLE_TEMPLATES[styleId];
    const baseTime = style?.dramaticSettings?.dramaticLevel || 5;
    const outputMultiplier = numOutputs / 4;
    const qualityMultiplier = style?.transformationType === 'ultimate_dramatic_executive' ? 1.5 : 1;
    
    return Math.ceil((baseTime * 30 * outputMultiplier * qualityMultiplier) / 1000) * 1000; // Round to seconds
  },

  // NEW: Get style comparison for before/after marketing
  getStyleComparison: (styleId) => {
    const style = STYLE_TEMPLATES[styleId];
    if (!style) return null;

    return {
      before: 'Casual photo with any clothing and background',
      after: style.features.transformation || style.description,
      dramaticLevel: style.dramaticSettings?.dramaticLevel || 5,
      transformationFeatures: Object.keys(style.dramaticSettings || {}).filter(key => 
        style.dramaticSettings[key] === true
      )
    };
  },

  // Format style for display
  formatStyleForDisplay: (styleId) => {
    const style = STYLE_TEMPLATES[styleId];
    if (!style) return null;

    return {
      id: style.id,
      name: style.displayName || style.name,
      description: style.description,
      category: style.category,
      isPremium: style.pricing === 'premium',
      popularity: style.popularity,
      industries: style.industries,
      features: Object.entries(style.features).map(([key, value]) => ({
        feature: key,
        description: value,
      })),
    };
  },
};

export default STYLE_TEMPLATES;