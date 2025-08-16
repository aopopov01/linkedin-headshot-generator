// Professional Attire Templates for Dramatic AI Transformations
// Defines specific clothing, backgrounds, and styling for each professional category

export const PROFESSIONAL_ATTIRE_TEMPLATES = {
  executive: {
    name: 'Executive Leadership',
    description: 'Premium executive styling for C-suite and senior leadership roles',
    
    clothing: {
      male: {
        primary: 'Premium dark navy three-piece business suit',
        secondary: 'Charcoal gray tailored business suit', 
        shirt: 'Crisp white French cuff dress shirt',
        accessories: 'Luxury silk tie, gold cufflinks, premium leather watch',
        details: 'Perfectly pressed, impeccable tailoring, executive grooming'
      },
      female: {
        primary: 'Sophisticated navy blue business suit with structured blazer',
        secondary: 'Elegant charcoal gray power suit',
        shirt: 'White silk blouse or tailored dress shirt',
        accessories: 'Pearl jewelry, professional scarf, elegant watch',
        details: 'Executive styling, polished professional appearance'
      },
      neutral: 'Premium dark business suit, white dress shirt, executive accessories'
    },

    backgrounds: {
      primary: 'Sophisticated gradient from dark gray to light gray, studio lighting',
      secondary: 'Executive office environment with blurred cityscape',
      alternative: 'Neutral professional backdrop with subtle texture',
      lighting: 'Premium three-point studio lighting with key, fill, and rim lights'
    },

    expression: 'Confident, authoritative, trustworthy, executive presence',
    
    qualityParameters: {
      formalityLevel: 10, // Maximum formality
      professionalismScore: 10,
      industryMatch: ['Executive', 'C-Suite', 'Board Member', 'Senior Leadership'],
      pricePoint: 'premium'
    }
  },

  creative: {
    name: 'Creative Professional',
    description: 'Modern, stylish appearance for creative industries',
    
    clothing: {
      male: {
        primary: 'Contemporary blazer with premium casual shirt, no tie',
        secondary: 'Sophisticated sweater or designer polo',
        details: 'Modern fit, stylish but professional, creative flair',
        colors: 'Navy, charcoal, or sophisticated earth tones'
      },
      female: {
        primary: 'Stylish blazer with contemporary blouse or shell',
        secondary: 'Designer sweater or modern business casual top',
        details: 'Fashion-forward but professional, creative styling',
        colors: 'Sophisticated palette with subtle creative touches'
      },
      neutral: 'Modern business casual with creative professional styling'
    },

    backgrounds: {
      primary: 'Clean white or light gray with subtle texture',
      secondary: 'Modern minimalist backdrop with geometric elements',
      alternative: 'Contemporary studio with soft architectural elements',
      lighting: 'Natural-style lighting with soft shadows, modern feel'
    },

    expression: 'Approachable, innovative, confident, creative energy',
    
    qualityParameters: {
      formalityLevel: 7,
      professionalismScore: 9,
      industryMatch: ['Design', 'Marketing', 'Advertising', 'Media', 'Architecture'],
      pricePoint: 'standard'
    }
  },

  healthcare: {
    name: 'Healthcare Professional',
    description: 'Trustworthy, caring appearance for medical professionals',
    
    clothing: {
      male: {
        primary: 'Pristine white medical coat over business attire',
        secondary: 'Professional scrubs in medical facility colors',
        shirt: 'Clean white or light blue dress shirt under coat',
        details: 'Medical professional grooming, stethoscope if appropriate'
      },
      female: {
        primary: 'Clean white medical coat over professional attire',
        secondary: 'Professional medical scrubs or business attire',
        details: 'Professional medical styling, appropriate medical accessories',
        shirt: 'Professional blouse or medical-appropriate top under coat'
      },
      neutral: 'Medical white coat over professional business attire'
    },

    backgrounds: {
      primary: 'Clean medical facility backdrop, sterile and professional',
      secondary: 'Soft healthcare environment with medical equipment blur',
      alternative: 'Clean white or light blue medical-grade background',
      lighting: 'Clean, even lighting typical of medical photography'
    },

    expression: 'Trustworthy, caring, professional, approachable competence',
    
    qualityParameters: {
      formalityLevel: 9,
      professionalismScore: 10,
      industryMatch: ['Medicine', 'Healthcare', 'Nursing', 'Therapy', 'Wellness'],
      pricePoint: 'premium'
    }
  },

  finance: {
    name: 'Financial Professional',
    description: 'Conservative, trustworthy styling for financial services',
    
    clothing: {
      male: {
        primary: 'Traditional navy blue business suit with conservative tie',
        secondary: 'Charcoal gray suit with white shirt and silk tie',
        details: 'Conservative financial industry styling, polished appearance',
        accessories: 'Classic watch, understated cufflinks, leather belt'
      },
      female: {
        primary: 'Conservative navy or charcoal business suit',
        secondary: 'Professional dress with blazer in traditional colors',
        details: 'Financial industry appropriate styling, conservative elegance',
        accessories: 'Classic jewelry, professional appearance'
      },
      neutral: 'Conservative business suit in traditional financial industry colors'
    },

    backgrounds: {
      primary: 'Neutral professional background in grays or navy tones',
      secondary: 'Subtle financial district environment (blurred)',
      alternative: 'Classic business backdrop with conservative styling',
      lighting: 'Professional business lighting, trustworthy and reliable'
    },

    expression: 'Trustworthy, competent, reliable, financial expertise',
    
    qualityParameters: {
      formalityLevel: 9,
      professionalismScore: 10,
      industryMatch: ['Finance', 'Banking', 'Investment', 'Insurance', 'Accounting'],
      pricePoint: 'premium'
    }
  },

  startup: {
    name: 'Tech & Startup',
    description: 'Modern, innovative appearance for tech professionals',
    
    clothing: {
      male: {
        primary: 'Modern button-down shirt or contemporary polo',
        secondary: 'Smart casual blazer with premium t-shirt or henley',
        details: 'Silicon Valley professional casual, modern fit',
        colors: 'Contemporary colors, tech industry appropriate'
      },
      female: {
        primary: 'Modern blouse or sophisticated casual top',
        secondary: 'Contemporary blazer with stylish professional casual',
        details: 'Tech industry professional styling, modern and approachable',
        colors: 'Modern professional palette'
      },
      neutral: 'Contemporary business casual appropriate for tech industry'
    },

    backgrounds: {
      primary: 'Clean, modern white or light gray backdrop',
      secondary: 'Contemporary tech office environment (blurred)',
      alternative: 'Minimalist modern backdrop with clean lines',
      lighting: 'Bright, energetic lighting with modern feel'
    },

    expression: 'Innovative, forward-thinking, approachable, tech-savvy confidence',
    
    qualityParameters: {
      formalityLevel: 6,
      professionalismScore: 8,
      industryMatch: ['Technology', 'Startups', 'Software', 'Innovation'],
      pricePoint: 'standard'
    }
  },

  tech: {
    name: 'Technology Professional',
    description: 'Professional tech industry styling',
    
    clothing: {
      male: {
        primary: 'Modern business casual shirt or contemporary sweater',
        secondary: 'Tech industry appropriate blazer with casual shirt',
        details: 'Professional but approachable tech styling',
        fit: 'Modern, contemporary cut appropriate for tech industry'
      },
      female: {
        primary: 'Professional casual blouse or modern business top',
        secondary: 'Contemporary blazer with tech-appropriate styling',
        details: 'Professional tech industry appearance, modern and capable',
        fit: 'Contemporary professional fit'
      },
      neutral: 'Modern business casual appropriate for technology sector'
    },

    backgrounds: {
      primary: 'Contemporary professional backdrop, clean and modern',
      secondary: 'Tech industry environment with modern elements',
      alternative: 'Clean minimalist backdrop with subtle tech aesthetic',
      lighting: 'Modern professional lighting, clear and bright'
    },

    expression: 'Professional, innovative, capable, tech industry confidence',
    
    qualityParameters: {
      formalityLevel: 7,
      professionalismScore: 9,
      industryMatch: ['Technology', 'Engineering', 'Software Development', 'IT'],
      pricePoint: 'standard'
    }
  }
};

// Gender-neutral clothing recommendations
export const NEUTRAL_PROFESSIONAL_ATTIRE = {
  executive: 'Premium dark business suit with white dress shirt and executive accessories',
  creative: 'Modern blazer with contemporary professional shirt, creative but polished',
  healthcare: 'Clean white medical coat over professional business attire',
  finance: 'Conservative business suit in traditional navy or charcoal',
  startup: 'Modern business casual appropriate for tech/startup environment',
  tech: 'Contemporary professional casual with modern tech industry styling'
};

// Background and lighting combinations for dramatic effect
export const PROFESSIONAL_BACKGROUNDS = {
  studio: {
    executive: 'Sophisticated gray gradient with premium studio lighting',
    creative: 'Clean white with subtle texture and natural-style lighting',
    healthcare: 'Medical-grade white with clean, even professional lighting',
    finance: 'Conservative neutral tones with trustworthy business lighting',
    startup: 'Modern minimalist white with bright, energetic lighting',
    tech: 'Contemporary clean backdrop with modern professional lighting'
  },
  
  environmental: {
    executive: 'Executive office with blurred cityscape and premium lighting',
    creative: 'Modern creative space with architectural elements',
    healthcare: 'Professional medical facility with clean background',
    finance: 'Traditional business office with conservative elements',
    startup: 'Contemporary tech office with modern aesthetic',
    tech: 'Professional tech environment with clean modern design'
  },

  dramatic: {
    executive: 'High-contrast gradient with dramatic executive lighting',
    creative: 'Artistic backdrop with creative professional lighting',
    healthcare: 'Medical environment with professional healthcare lighting',
    finance: 'Conservative gradient with trustworthy business lighting',
    startup: 'Tech-inspired background with innovative lighting',
    tech: 'Modern technological backdrop with professional lighting'
  }
};

// Lighting specifications for each professional style
export const PROFESSIONAL_LIGHTING_SETUPS = {
  executive: {
    key: 'Strong directional key light from 45-degree angle',
    fill: 'Soft fill light to reduce shadows while maintaining authority',
    rim: 'Subtle rim light for professional separation from background',
    mood: 'Authoritative, commanding, executive presence'
  },
  
  creative: {
    key: 'Natural-style key light with soft characteristics',
    fill: 'Gentle fill light for approachable appearance',
    background: 'Even background lighting for clean professional look',
    mood: 'Approachable, innovative, creatively professional'
  },
  
  healthcare: {
    key: 'Even, clean lighting typical of medical photography',
    fill: 'Soft, trustworthy fill light for caring appearance',
    background: 'Medical-grade even background lighting',
    mood: 'Trustworthy, caring, professionally competent'
  },
  
  finance: {
    key: 'Traditional business lighting with professional quality',
    fill: 'Conservative fill light for trustworthy appearance',
    background: 'Professional business background lighting',
    mood: 'Trustworthy, reliable, financially competent'
  },
  
  startup: {
    key: 'Bright, energetic key light with modern characteristics',
    fill: 'Contemporary fill light for approachable innovation',
    background: 'Clean, modern background lighting',
    mood: 'Innovative, energetic, forward-thinking'
  },
  
  tech: {
    key: 'Clear, modern professional lighting',
    fill: 'Tech-appropriate fill for professional capability',
    background: 'Contemporary professional background lighting',
    mood: 'Capable, modern, technologically proficient'
  }
};

// Utility functions for attire template management
export const AttireTemplateUtils = {
  
  // Get complete attire configuration for a style
  getAttireConfig: (styleId, gender = 'neutral') => {
    const template = PROFESSIONAL_ATTIRE_TEMPLATES[styleId];
    if (!template) return null;

    const clothing = gender === 'neutral' 
      ? NEUTRAL_PROFESSIONAL_ATTIRE[styleId]
      : template.clothing[gender] || template.clothing.neutral;

    return {
      ...template,
      selectedClothing: clothing,
      gender,
      styleId
    };
  },

  // Get background configuration for dramatic effect
  getBackgroundConfig: (styleId, backgroundType = 'studio') => {
    return PROFESSIONAL_BACKGROUNDS[backgroundType]?.[styleId] || 
           PROFESSIONAL_BACKGROUNDS.studio[styleId];
  },

  // Get lighting setup for professional photography
  getLightingSetup: (styleId) => {
    return PROFESSIONAL_LIGHTING_SETUPS[styleId];
  },

  // Generate complete transformation prompt including attire, background, and lighting
  generateTransformationPrompt: (styleId, gender = 'neutral', backgroundType = 'studio') => {
    const attireConfig = AttireTemplateUtils.getAttireConfig(styleId, gender);
    const backgroundConfig = AttireTemplateUtils.getBackgroundConfig(styleId, backgroundType);
    const lightingSetup = AttireTemplateUtils.getLightingSetup(styleId);

    if (!attireConfig) return null;

    const clothing = typeof attireConfig.selectedClothing === 'string' 
      ? attireConfig.selectedClothing
      : attireConfig.selectedClothing.primary || attireConfig.selectedClothing;

    return {
      mainPrompt: `ultra-realistic professional ${styleId} headshot portrait, person wearing ${clothing}, ${backgroundConfig}, ${lightingSetup.key}, ${lightingSetup.fill}, ${attireConfig.expression}, incredibly detailed, high-end professional photography, 8K resolution, perfect professional retouching`,
      
      negativePrompt: `casual clothing, poor lighting, blurry, distorted, unprofessional, cartoon, anime, low quality, pixelated, amateur photography, harsh shadows, overexposed, underexposed, inappropriate attire, wrinkled clothing, poor grooming`,
      
      styleStrength: attireConfig.qualityParameters.professionalismScore / 10,
      formalityLevel: attireConfig.qualityParameters.formalityLevel,
      
      metadata: {
        styleId,
        gender,
        backgroundType,
        clothing,
        expression: attireConfig.expression,
        industries: attireConfig.qualityParameters.industryMatch,
        pricePoint: attireConfig.qualityParameters.pricePoint
      }
    };
  },

  // Get all available styles with their characteristics
  getAllStyles: () => {
    return Object.entries(PROFESSIONAL_ATTIRE_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      formalityLevel: template.qualityParameters.formalityLevel,
      professionalismScore: template.qualityParameters.professionalismScore,
      industries: template.qualityParameters.industryMatch,
      pricePoint: template.qualityParameters.pricePoint
    }));
  },

  // Get recommended styles for specific industry
  getStylesForIndustry: (industry) => {
    return AttireTemplateUtils.getAllStyles().filter(style => 
      style.industries.some(ind => 
        ind.toLowerCase().includes(industry.toLowerCase()) ||
        industry.toLowerCase().includes(ind.toLowerCase())
      )
    );
  },

  // Validate style configuration
  validateStyleConfig: (styleId, gender, backgroundType) => {
    const template = PROFESSIONAL_ATTIRE_TEMPLATES[styleId];
    const hasValidGender = gender === 'neutral' || 
      (template?.clothing[gender] !== undefined);
    const hasValidBackground = PROFESSIONAL_BACKGROUNDS[backgroundType]?.[styleId] !== undefined;

    return {
      valid: !!template && hasValidGender && hasValidBackground,
      errors: [
        !template && `Invalid style ID: ${styleId}`,
        !hasValidGender && `Invalid gender option: ${gender}`,
        !hasValidBackground && `Invalid background type: ${backgroundType}`
      ].filter(Boolean)
    };
  }
};

export default PROFESSIONAL_ATTIRE_TEMPLATES;