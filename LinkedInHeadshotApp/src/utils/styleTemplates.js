// Professional headshot style templates and configurations

export const STYLE_TEMPLATES = {
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    displayName: 'Corporate Professional',
    description: 'Classic business attire with clean background - perfect for finance, consulting, and traditional industries',
    prompt: 'professional corporate headshot, business suit, clean white background, studio lighting, confident expression, high quality, 4k, professional photography',
    negativePrompt: 'casual clothing, colorful background, poor lighting, blurry, distorted, unprofessional, cartoon',
    category: 'business',
    popularity: 95,
    industries: ['Finance', 'Consulting', 'Law', 'Banking', 'Insurance'],
    features: {
      background: 'Clean white or neutral',
      attire: 'Business suit or formal wear',
      lighting: 'Professional studio lighting',
      expression: 'Confident and trustworthy',
      composition: 'Head and shoulders, centered',
    },
    tags: ['professional', 'corporate', 'formal', 'business'],
    pricing: 'free',
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
    description: 'Premium style for C-suite executives and senior leadership roles',
    prompt: 'executive professional headshot, formal dark business suit, neutral gray background, premium studio lighting, authoritative confident expression, high quality, 4k, professional photography',
    negativePrompt: 'casual attire, bright colors, poor posture, blurry, distorted, unprofessional',
    category: 'executive',
    popularity: 75,
    industries: ['Executive', 'C-Suite', 'Board Members', 'Senior Leadership'],
    features: {
      background: 'Sophisticated gray or navy',
      attire: 'Premium business suit',
      lighting: 'Dramatic, professional',
      expression: 'Authoritative and confident',
      composition: 'Commanding presence',
    },
    tags: ['executive', 'leadership', 'authoritative', 'premium'],
    pricing: 'premium',
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
    description: 'Trustworthy and caring appearance for medical and healthcare professionals',
    prompt: 'healthcare professional headshot, medical white coat or professional attire, clean background, trustworthy caring expression, high quality, 4k, professional photography',
    negativePrompt: 'unprofessional attire, distracting background, harsh expression, blurry, distorted',
    category: 'healthcare',
    popularity: 70,
    industries: ['Medicine', 'Healthcare', 'Nursing', 'Therapy', 'Wellness'],
    features: {
      background: 'Clean medical environment',
      attire: 'White coat or professional medical attire',
      lighting: 'Clean, reassuring',
      expression: 'Trustworthy and compassionate',
      composition: 'Professional medical standard',
    },
    tags: ['healthcare', 'medical', 'trustworthy', 'caring'],
    pricing: 'premium',
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

  // Get style configuration for AI processing
  getStyleConfig: (styleId, customizations = {}) => {
    const style = STYLE_TEMPLATES[styleId];
    if (!style) return null;

    return {
      prompt: style.prompt,
      negativePrompt: style.negativePrompt,
      styleStrength: customizations.styleStrength || 20,
      numOutputs: customizations.numOutputs || 4,
      guidanceScale: customizations.guidanceScale || 5,
      numSteps: customizations.numSteps || 50,
      ...customizations,
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