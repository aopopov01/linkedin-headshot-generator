/**
 * OmniShot Design System - Multi-Platform Professional Photo Generator
 * Brand: "Every Platform. Every Time. Every You."
 * Colors: Deep Blue (#1B365D) + Orange (#FF6B35)
 * Personality: Professional, sophisticated, accessible
 */

import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Screen breakpoints for responsive design
export const BREAKPOINTS = {
  small: 320,
  medium: 375,
  large: 414,
  xlarge: 768,
  tablet: 1024,
};

export const getScreenSize = () => {
  if (width <= BREAKPOINTS.small) return 'small';
  if (width <= BREAKPOINTS.medium) return 'medium';
  if (width <= BREAKPOINTS.large) return 'large';
  if (width <= BREAKPOINTS.xlarge) return 'xlarge';
  return 'tablet';
};

// OmniShot Brand Colors - WCAG AA compliant
export const COLORS = {
  // Primary brand colors
  primary: {
    50: '#F0F4F8',
    100: '#E1E9F1',
    200: '#C2D3E3',
    300: '#8BADD5',
    400: '#5487C7',
    500: '#1B365D', // Deep Blue - Main brand
    600: '#162D4F',
    700: '#112441',
    800: '#0D1B33',
    900: '#081225',
  },
  
  // Secondary brand colors
  secondary: {
    50: '#FFF8F5',
    100: '#FFF0E6',
    200: '#FFE1CC',
    300: '#FFBF99',
    400: '#FF9D66',
    500: '#FF6B35', // Orange - Accent brand
    600: '#E55A2E',
    700: '#CC4A26',
    800: '#B23B1F',
    900: '#992C17',
  },
  
  // Platform-specific accent colors
  platform: {
    linkedin: '#0A66C2',
    instagram: '#E4405F',
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    tiktok: '#FE2C55',
    youtube: '#FF0000',
    discord: '#5865F2',
    snapchat: '#FFFC00',
    pinterest: '#E60023',
    github: '#333333',
  },
  
  // Professional style colors
  professional: {
    executive: '#1B365D',
    creative: '#6B46C1',
    tech: '#10B981',
    healthcare: '#EF4444',
    finance: '#F59E0B',
    startup: '#8B5CF6',
    consulting: '#6366F1',
    legal: '#374151',
  },
  
  // Neutral grays
  neutral: {
    50: '#FAFBFC',
    100: '#F7F8F9',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Text colors (WCAG AA compliant)
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    tertiary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
    brand: '#1B365D',
    accent: '#FF6B35',
  },
  
  // Semantic colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    processing: '#8B5CF6',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    overlay: 'rgba(27, 54, 93, 0.8)',
    card: '#FFFFFF',
    platform: 'rgba(255, 107, 53, 0.05)',
  },
  
  // Border colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
    focus: '#FF6B35',
    platform: '#1B365D',
  },
  
  // Status colors for platform optimization
  status: {
    optimized: '#10B981',
    processing: '#F59E0B',
    pending: '#6B7280',
    error: '#EF4444',
    premium: '#8B5CF6',
  },
};

// Typography scale - optimized for professional content
const baseFontSize = Platform.OS === 'ios' ? 17 : 16;

export const TYPOGRAPHY = {
  // Display headings
  display: {
    fontSize: baseFontSize * 2.5,
    lineHeight: baseFontSize * 3,
    fontWeight: Platform.OS === 'ios' ? '800' : 'bold',
    letterSpacing: Platform.OS === 'ios' ? -0.5 : 0,
  },
  
  // Main headings
  h1: {
    fontSize: baseFontSize * 2,
    lineHeight: baseFontSize * 2.4,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    letterSpacing: Platform.OS === 'ios' ? -0.3 : 0,
  },
  
  h2: {
    fontSize: baseFontSize * 1.65,
    lineHeight: baseFontSize * 2,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0,
  },
  
  h3: {
    fontSize: baseFontSize * 1.35,
    lineHeight: baseFontSize * 1.65,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0,
  },
  
  h4: {
    fontSize: baseFontSize * 1.18,
    lineHeight: baseFontSize * 1.5,
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    letterSpacing: 0,
  },
  
  // Body text
  body1: {
    fontSize: baseFontSize,
    lineHeight: baseFontSize * 1.5,
    fontWeight: '400',
    letterSpacing: Platform.OS === 'ios' ? -0.2 : 0.15,
  },
  
  body2: {
    fontSize: baseFontSize * 0.88,
    lineHeight: baseFontSize * 1.3,
    fontWeight: '400',
    letterSpacing: Platform.OS === 'ios' ? -0.1 : 0.25,
  },
  
  // UI text
  button: {
    fontSize: baseFontSize * 0.94,
    lineHeight: baseFontSize * 1.2,
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    letterSpacing: Platform.OS === 'ios' ? 0.5 : 1,
  },
  
  caption: {
    fontSize: baseFontSize * 0.76,
    lineHeight: baseFontSize,
    fontWeight: '500',
    letterSpacing: Platform.OS === 'ios' ? 0.1 : 0.5,
  },
  
  label: {
    fontSize: baseFontSize * 0.65,
    lineHeight: baseFontSize * 0.85,
    fontWeight: '600',
    letterSpacing: Platform.OS === 'ios' ? 0.5 : 1.5,
    textTransform: 'uppercase',
  },
  
  // Platform-specific text
  platform: {
    fontSize: baseFontSize * 0.7,
    lineHeight: baseFontSize * 0.9,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};

// Spacing system (8pt grid)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  xxxxl: 96,
};

// Border radius - modern, professional feel
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// Shadow system - professional depth
export const SHADOWS = {
  none: {},
  
  subtle: Platform.select({
    ios: {
      shadowColor: COLORS.neutral[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
  }),
  
  soft: Platform.select({
    ios: {
      shadowColor: COLORS.neutral[900],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }),
  
  medium: Platform.select({
    ios: {
      shadowColor: COLORS.neutral[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
  }),
  
  large: Platform.select({
    ios: {
      shadowColor: COLORS.neutral[900],
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
  }),
  
  brand: Platform.select({
    ios: {
      shadowColor: COLORS.primary[500],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
};

// Component sizing
export const SIZES = {
  // Button heights
  button: {
    small: 36,
    medium: 48,
    large: 56,
    xlarge: 64,
  },
  
  // Input heights
  input: {
    small: 40,
    medium: 48,
    large: 56,
  },
  
  // Icon sizes
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // Avatar sizes
  avatar: {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
    xxl: 128,
  },
  
  // Touch targets
  touchTarget: {
    minimum: 44,
    comfortable: 48,
  },
  
  // Platform thumbnails
  thumbnail: {
    small: 64,
    medium: 96,
    large: 128,
  },
};

// Animation timings - smooth, professional
export const TIMINGS = {
  instant: 0,
  fast: 150,
  medium: 250,
  slow: 400,
  slower: 600,
  
  // Specific use cases
  transition: 250,
  fade: 200,
  slide: 300,
  bounce: 400,
  
  // Platform-specific
  default: Platform.OS === 'ios' ? 250 : 200,
};

// Platform dimensions for optimization preview
export const PLATFORM_DIMENSIONS = {
  linkedin: {
    profile: { width: 400, height: 400, aspectRatio: '1:1' },
    cover: { width: 1584, height: 396, aspectRatio: '4:1' },
    post: { width: 1200, height: 627, aspectRatio: '1.91:1' },
  },
  instagram: {
    profile: { width: 320, height: 320, aspectRatio: '1:1' },
    story: { width: 1080, height: 1920, aspectRatio: '9:16' },
    post: { width: 1080, height: 1080, aspectRatio: '1:1' },
    reel: { width: 1080, height: 1920, aspectRatio: '9:16' },
  },
  facebook: {
    profile: { width: 170, height: 170, aspectRatio: '1:1' },
    cover: { width: 851, height: 315, aspectRatio: '2.7:1' },
    post: { width: 1200, height: 630, aspectRatio: '1.91:1' },
  },
  twitter: {
    profile: { width: 400, height: 400, aspectRatio: '1:1' },
    header: { width: 1500, height: 500, aspectRatio: '3:1' },
    post: { width: 1200, height: 675, aspectRatio: '16:9' },
  },
  tiktok: {
    profile: { width: 200, height: 200, aspectRatio: '1:1' },
    video: { width: 1080, height: 1920, aspectRatio: '9:16' },
  },
  youtube: {
    profile: { width: 800, height: 800, aspectRatio: '1:1' },
    channel: { width: 2560, height: 1440, aspectRatio: '16:9' },
    thumbnail: { width: 1280, height: 720, aspectRatio: '16:9' },
  },
  custom: {
    square: { width: 1000, height: 1000, aspectRatio: '1:1' },
    portrait: { width: 1000, height: 1400, aspectRatio: '5:7' },
    landscape: { width: 1400, height: 1000, aspectRatio: '7:5' },
  },
};

// Professional styles configuration
export const PROFESSIONAL_STYLES = {
  executive: {
    name: 'Executive',
    description: 'Confident, authoritative presence for leadership roles',
    color: COLORS.professional.executive,
    characteristics: ['Formal attire', 'Confident posture', 'Direct gaze', 'Minimal background'],
    suitableFor: ['C-Suite', 'Director', 'VP', 'Senior Management'],
    platforms: ['linkedin', 'twitter', 'facebook'],
  },
  creative: {
    name: 'Creative',
    description: 'Artistic, innovative approach for creative professionals',
    color: COLORS.professional.creative,
    characteristics: ['Creative lighting', 'Artistic background', 'Expressive pose', 'Modern styling'],
    suitableFor: ['Designer', 'Artist', 'Writer', 'Marketing'],
    platforms: ['instagram', 'linkedin', 'pinterest'],
  },
  tech: {
    name: 'Tech',
    description: 'Modern, innovative look for technology professionals',
    color: COLORS.professional.tech,
    characteristics: ['Clean aesthetic', 'Modern background', 'Approachable pose', 'Smart casual'],
    suitableFor: ['Developer', 'Engineer', 'Product Manager', 'Startup'],
    platforms: ['linkedin', 'github', 'twitter'],
  },
  healthcare: {
    name: 'Healthcare',
    description: 'Trustworthy, professional appearance for medical professionals',
    color: COLORS.professional.healthcare,
    characteristics: ['Clean background', 'Professional attire', 'Trustworthy expression', 'Soft lighting'],
    suitableFor: ['Doctor', 'Nurse', 'Healthcare Admin', 'Medical Sales'],
    platforms: ['linkedin', 'facebook'],
  },
  finance: {
    name: 'Finance',
    description: 'Conservative, reliable look for financial professionals',
    color: COLORS.professional.finance,
    characteristics: ['Conservative styling', 'Neutral background', 'Professional attire', 'Confident pose'],
    suitableFor: ['Banker', 'Accountant', 'Financial Advisor', 'Analyst'],
    platforms: ['linkedin', 'twitter'],
  },
  startup: {
    name: 'Startup',
    description: 'Dynamic, energetic presence for entrepreneurs',
    color: COLORS.professional.startup,
    characteristics: ['Dynamic pose', 'Modern background', 'Energetic expression', 'Smart casual'],
    suitableFor: ['Founder', 'Entrepreneur', 'Startup Team', 'Consultant'],
    platforms: ['linkedin', 'twitter', 'instagram'],
  },
};

// Accessibility configuration
export const ACCESSIBILITY = {
  // Touch targets
  touchTargetSize: 44,
  
  // Contrast ratios
  contrastRatios: {
    normal: 4.5,
    large: 3,
    aa: 4.5,
    aaa: 7,
  },
  
  // Screen reader labels
  labels: {
    // Navigation
    home: 'Home screen',
    back: 'Go back',
    next: 'Continue to next step',
    close: 'Close',
    menu: 'Open menu',
    
    // Photo capture
    takePhoto: 'Take photo with camera',
    uploadPhoto: 'Upload photo from gallery',
    retakePhoto: 'Retake photo',
    photoPreview: 'Photo preview',
    
    // Platform selection
    selectPlatform: 'Select platform',
    platformSelected: 'Platform selected',
    optimizeForPlatform: 'Optimize for this platform',
    
    // Style selection
    selectStyle: 'Select professional style',
    stylePreview: 'Style preview',
    styleSelected: 'Professional style selected',
    
    // Processing
    generating: 'Generating professional photos',
    processingComplete: 'Photo processing complete',
    
    // Results
    downloadPhoto: 'Download photo',
    sharePhoto: 'Share photo',
    viewLarger: 'View larger image',
    
    // Premium
    upgradeToPremium: 'Upgrade to premium',
    premiumFeature: 'Premium feature',
  },
  
  // Focus indicators
  focusIndicator: {
    width: 3,
    color: COLORS.secondary[500],
    offset: 2,
    borderRadius: RADIUS.sm,
  },
  
  // High contrast mode adjustments
  highContrast: {
    enabled: false, // Can be toggled by user
    adjustments: {
      borderWidth: 2,
      shadowOpacity: 0.3,
      contrastMultiplier: 1.5,
    },
  },
};

// Layout helpers
export const LAYOUT = {
  // Safe area adjustments
  safeArea: {
    top: Platform.OS === 'ios' ? 44 : 24,
    bottom: Platform.OS === 'ios' ? 34 : 0,
  },
  
  // Header heights
  header: {
    default: 56,
    large: 64,
    compact: 48,
  },
  
  // Tab bar
  tabBar: {
    height: Platform.OS === 'ios' ? 83 : 60,
  },
  
  // Common layouts
  containerPadding: SPACING.md,
  sectionSpacing: SPACING.xl,
  itemSpacing: SPACING.lg,
};

// Responsive utilities
export const responsive = {
  // Width percentage
  wp: (percentage) => (width * percentage) / 100,
  
  // Height percentage  
  hp: (percentage) => (height * percentage) / 100,
  
  // Font scaling
  fs: (size) => {
    const scale = width / BREAKPOINTS.medium;
    return Math.round(size * Math.min(scale, 1.3));
  },
  
  // Spacing scaling
  sp: (space) => {
    const screenSize = getScreenSize();
    const scales = {
      small: 0.85,
      medium: 1,
      large: 1.1,
      xlarge: 1.2,
      tablet: 1.4,
    };
    return space * scales[screenSize];
  },
  
  // Component scaling
  componentScale: () => {
    const screenSize = getScreenSize();
    return {
      small: 0.9,
      medium: 1,
      large: 1.05,
      xlarge: 1.1,
      tablet: 1.2,
    }[screenSize];
  },
};

// Export default design system
export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  SIZES,
  TIMINGS,
  PLATFORM_DIMENSIONS,
  PROFESSIONAL_STYLES,
  ACCESSIBILITY,
  LAYOUT,
  BREAKPOINTS,
  responsive,
  getScreenSize,
};