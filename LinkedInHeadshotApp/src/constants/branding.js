/**
 * OmniShot Branding Constants
 * Comprehensive brand guidelines and design system for consistent styling
 * across all components and screens
 */

export const BRAND_COLORS = {
  // Primary Brand Colors
  PRIMARY: '#1B365D',     // OmniShot Deep Blue
  SECONDARY: '#FF6B35',   // OmniShot Orange
  
  // Extended Palette
  PRIMARY_LIGHT: '#2D4B7A',
  PRIMARY_DARK: '#0F1F3A',
  SECONDARY_LIGHT: '#FF8659',
  SECONDARY_DARK: '#E5511F',
  
  // Neutral Colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  
  // Gray Scale
  GRAY_50: '#F9FAFB',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_300: '#D1D5DB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_900: '#111827',
  
  // Status Colors
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  
  // Background Colors
  BACKGROUND_PRIMARY: '#FFFFFF',
  BACKGROUND_SECONDARY: '#F9FAFB',
  BACKGROUND_ACCENT: '#1B365D',
  
  // Text Colors
  TEXT_PRIMARY: '#1B365D',
  TEXT_SECONDARY: '#6B7280',
  TEXT_ACCENT: '#FF6B35',
  TEXT_WHITE: '#FFFFFF',
  TEXT_MUTED: '#9CA3AF'
};

export const TYPOGRAPHY = {
  // Font Families
  FONT_FAMILY_PRIMARY: 'System',
  FONT_FAMILY_FALLBACK: 'Helvetica Neue, Arial, sans-serif',
  
  // Font Weights
  WEIGHT_REGULAR: '400',
  WEIGHT_MEDIUM: '500',
  WEIGHT_SEMIBOLD: '600',
  WEIGHT_BOLD: '700',
  WEIGHT_EXTRA_BOLD: '800',
  
  // Font Sizes
  SIZE_DISPLAY: 32,      // App titles, hero text
  SIZE_TITLE: 28,        // Page titles
  SIZE_HEADING: 24,      // Section headers
  SIZE_SUBHEADING: 20,   // Subsection headers  
  SIZE_BODY_LARGE: 18,   // Important body text
  SIZE_BODY: 16,         // Standard body text
  SIZE_BODY_SMALL: 14,   // Secondary body text
  SIZE_CAPTION: 12,      // Captions, metadata
  SIZE_TINY: 10,         // Fine print, labels
  
  // Line Heights
  LINE_HEIGHT_TIGHT: 1.2,
  LINE_HEIGHT_NORMAL: 1.4,
  LINE_HEIGHT_RELAXED: 1.6,
  
  // Letter Spacing
  LETTER_SPACING_TIGHT: -0.5,
  LETTER_SPACING_NORMAL: 0,
  LETTER_SPACING_WIDE: 0.5
};

export const SPACING = {
  // Base spacing unit (4px grid system)
  BASE: 4,
  
  // Common spacing values
  XS: 4,    // 4px
  SM: 8,    // 8px  
  MD: 12,   // 12px
  LG: 16,   // 16px
  XL: 20,   // 20px
  XXL: 24,  // 24px
  XXXL: 32, // 32px
  
  // Specific use cases
  PADDING_BUTTON: 16,
  PADDING_CARD: 20,
  PADDING_SCREEN: 24,
  MARGIN_SECTION: 32,
  MARGIN_COMPONENT: 16
};

export const BORDER_RADIUS = {
  NONE: 0,
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  XXL: 20,
  ROUND: 999,  // Fully rounded
  
  // Specific elements
  BUTTON: 12,
  CARD: 16,
  IMAGE: 8,
  MODAL: 20
};

export const SHADOWS = {
  // Elevation levels
  NONE: 'none',
  SM: '0 1px 2px rgba(0, 0, 0, 0.05)',
  MD: '0 4px 6px rgba(0, 0, 0, 0.1)',
  LG: '0 10px 15px rgba(0, 0, 0, 0.1)',
  XL: '0 20px 25px rgba(0, 0, 0, 0.1)',
  
  // Brand-specific shadows
  BRAND_LIGHT: '0 4px 6px rgba(27, 54, 93, 0.1)',
  BRAND_MEDIUM: '0 8px 16px rgba(27, 54, 93, 0.15)',
  BRAND_HEAVY: '0 16px 32px rgba(27, 54, 93, 0.2)',
  
  ACCENT_GLOW: '0 0 20px rgba(255, 107, 53, 0.3)'
};

export const BRAND_TEXT = {
  // App Name & Taglines
  APP_NAME: 'OmniShot',
  TAGLINE_PRIMARY: 'Every Platform. Every Time. Every You.',
  TAGLINE_SECONDARY: 'Multi-platform professional photo optimization',
  TAGLINE_SHORT: 'Professional photos for every platform',
  TAGLINE_TECHNICAL: 'AI-powered multi-platform optimization',
  
  // Marketing Copy
  VALUE_PROPOSITION: 'Transform any photo into professional headshots optimized for every platform',
  CTA_PRIMARY: 'Create Your OmniShot',
  CTA_SECONDARY: 'Get Started Free',
  
  // Status Messages
  PROCESSING_MESSAGES: {
    INITIALIZING: 'Initializing AI optimization...',
    CONNECTING: 'Connecting to optimization engine...',
    ANALYZING: 'Analyzing your photo...',
    OPTIMIZING: 'Creating professional versions...',
    FINALIZING: 'Finalizing optimizations...',
    COMPLETE: 'OmniShot optimization complete!'
  },
  
  // Platform Names
  PLATFORM_NAMES: {
    linkedin: 'LinkedIn',
    instagram: 'Instagram', 
    facebook: 'Facebook',
    twitter: 'Twitter',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    whatsapp_business: 'WhatsApp Business',
    github: 'GitHub'
  }
};

export const BRAND_ICONS = {
  // Platform Icons (emoji-based for cross-platform compatibility)
  PLATFORMS: {
    linkedin: '💼',
    instagram: '📸',
    facebook: '👥',
    twitter: '🐦',
    youtube: '📺',
    tiktok: '🎵',
    whatsapp_business: '💬',
    github: '⚡'
  },
  
  // Style Icons
  STYLES: {
    professional: '💼',
    creative: '🎨',
    tech: '💻',
    healthcare: '⚕️',
    finance: '🏛️',
    startup: '🚀'
  },
  
  // Action Icons
  ACTIONS: {
    camera: '📷',
    upload: '📁',
    download: '📱',
    share: '↗️',
    settings: '⚙️',
    help: '❓',
    star: '⭐',
    check: '✓',
    cross: '✕',
    arrow_left: '←',
    arrow_right: '→',
    arrow_up: '↑',
    arrow_down: '↓'
  },
  
  // Status Icons
  STATUS: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
    processing: '🔄'
  }
};

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 800
};

export const BREAKPOINTS = {
  // Mobile-first responsive design
  MOBILE: 0,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280
};

export const BRAND_GRADIENTS = {
  // Primary brand gradients
  PRIMARY: ['#1B365D', '#2D4B7A'],
  SECONDARY: ['#FF6B35', '#FF8659'],
  
  // Special gradients
  HERO: ['#1B365D', '#FF6B35'],
  SUCCESS: ['#10B981', '#059669'],
  WARNING: ['#F59E0B', '#D97706'],
  ERROR: ['#EF4444', '#DC2626'],
  
  // Background gradients
  BACKGROUND_SUBTLE: ['#F9FAFB', '#FFFFFF'],
  BACKGROUND_BRAND: ['#1B365D', '#0F1F3A']
};

// Style mixins for common patterns
export const STYLE_MIXINS = {
  // Common button styles
  BUTTON_PRIMARY: {
    backgroundColor: BRAND_COLORS.SECONDARY,
    borderRadius: BORDER_RADIUS.BUTTON,
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.XXL
  },
  
  BUTTON_SECONDARY: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.BUTTON,
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.XXL
  },
  
  // Common text styles
  TEXT_HEADING: {
    fontSize: TYPOGRAPHY.SIZE_HEADING,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.TEXT_PRIMARY
  },
  
  TEXT_BODY: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_REGULAR,
    color: BRAND_COLORS.TEXT_SECONDARY,
    lineHeight: TYPOGRAPHY.SIZE_BODY * TYPOGRAPHY.LINE_HEIGHT_NORMAL
  },
  
  // Common container styles
  CONTAINER_CARD: {
    backgroundColor: BRAND_COLORS.WHITE,
    borderRadius: BORDER_RADIUS.CARD,
    padding: SPACING.PADDING_CARD,
    elevation: 2,
    shadowColor: BRAND_COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  
  CONTAINER_SCREEN: {
    flex: 1,
    backgroundColor: BRAND_COLORS.BACKGROUND_PRIMARY,
    padding: SPACING.PADDING_SCREEN
  }
};

// Platform-specific branding adjustments
export const PLATFORM_BRANDING = {
  linkedin: {
    primaryColor: BRAND_COLORS.PRIMARY,
    accentColor: '#0077B5',
    mood: 'professional',
    emphasis: 'executive'
  },
  instagram: {
    primaryColor: BRAND_COLORS.SECONDARY,
    accentColor: '#E4405F',
    mood: 'social',
    emphasis: 'lifestyle'
  },
  facebook: {
    primaryColor: BRAND_COLORS.PRIMARY,
    accentColor: '#1877F2', 
    mood: 'social',
    emphasis: 'community'
  },
  twitter: {
    primaryColor: BRAND_COLORS.PRIMARY,
    accentColor: '#1DA1F2',
    mood: 'professional',
    emphasis: 'thought-leadership'
  },
  youtube: {
    primaryColor: BRAND_COLORS.SECONDARY,
    accentColor: '#FF0000',
    mood: 'creative',
    emphasis: 'content-creation'
  },
  tiktok: {
    primaryColor: BRAND_COLORS.BLACK,
    accentColor: '#000000',
    mood: 'dynamic',
    emphasis: 'energetic'
  },
  whatsapp_business: {
    primaryColor: BRAND_COLORS.PRIMARY,
    accentColor: '#25D366',
    mood: 'business',
    emphasis: 'approachable'
  },
  github: {
    primaryColor: BRAND_COLORS.PRIMARY,
    accentColor: '#181717',
    mood: 'technical',
    emphasis: 'innovation'
  }
};

export default {
  BRAND_COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  BRAND_TEXT,
  BRAND_ICONS,
  ANIMATION_DURATIONS,
  BREAKPOINTS,
  BRAND_GRADIENTS,
  STYLE_MIXINS,
  PLATFORM_BRANDING
};