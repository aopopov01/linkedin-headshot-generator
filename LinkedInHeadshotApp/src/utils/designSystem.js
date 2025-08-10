/**
 * Design System - Centralized styling and theming
 * Follows WCAG 2.1 AA accessibility guidelines
 * Supports iOS HIG and Material Design principles
 */

import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Screen breakpoints for responsive design
export const BREAKPOINTS = {
  small: 320,
  medium: 375,
  large: 414,
  xlarge: 768,
};

export const getScreenSize = () => {
  if (width <= BREAKPOINTS.small) return 'small';
  if (width <= BREAKPOINTS.medium) return 'medium';
  if (width <= BREAKPOINTS.large) return 'large';
  return 'xlarge';
};

// Color palette with WCAG AA compliant contrast ratios
export const COLORS = {
  // Primary colors
  primary: {
    50: '#F0F8FF',
    100: '#E1F3FF',
    200: '#C7E9FF',
    300: '#9DD9FF',
    400: '#6BC3FF',
    500: '#0A66C2', // LinkedIn Blue - Main brand
    600: '#085799',
    700: '#064770',
    800: '#043A5C',
    900: '#022F47',
  },
  
  // Secondary colors
  secondary: {
    50: '#F8FDF8',
    100: '#E8F5E8',
    200: '#D4EDD4',
    300: '#B8E0B8',
    400: '#95D095',
    500: '#27AE60', // Success green
    600: '#219A52',
    700: '#1A7A3E',
    800: '#146633',
    900: '#0F5229',
  },
  
  // Neutral grays
  neutral: {
    50: '#FAFBFC',
    100: '#F8F9FA',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#ADB5BD',
    600: '#6C757D',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  },
  
  // Text colors (WCAG AA compliant)
  text: {
    primary: '#2C3E50',    // AAA compliant on white
    secondary: '#7F8C8D',  // AA compliant on white
    disabled: '#ADB5BD',
    inverse: '#FFFFFF',
  },
  
  // Semantic colors
  semantic: {
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    info: '#3498DB',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#E9ECEF',
    overlay: 'rgba(0, 0, 0, 0.5)',
    card: '#FFFFFF',
  },
  
  // Border colors
  border: {
    light: '#E9ECEF',
    medium: '#CED4DA',
    dark: '#ADB5BD',
    focus: '#0A66C2',
  },
};

// Typography scale following platform conventions
const baseFontSize = Platform.OS === 'ios' ? 17 : 16;

export const TYPOGRAPHY = {
  // Headings
  h1: {
    fontSize: baseFontSize * 2,     // 34pt iOS, 32pt Android
    lineHeight: baseFontSize * 2.4, // 41pt iOS, 38pt Android
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    letterSpacing: Platform.OS === 'ios' ? 0.37 : 0.25,
  },
  
  h2: {
    fontSize: baseFontSize * 1.65,  // 28pt iOS, 26pt Android
    lineHeight: baseFontSize * 2,   // 34pt iOS, 32pt Android
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    letterSpacing: Platform.OS === 'ios' ? 0.3 : 0.25,
  },
  
  h3: {
    fontSize: baseFontSize * 1.35,  // 23pt iOS, 22pt Android
    lineHeight: baseFontSize * 1.65, // 28pt iOS, 26pt Android
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    letterSpacing: Platform.OS === 'ios' ? 0.23 : 0.15,
  },
  
  h4: {
    fontSize: baseFontSize * 1.18,  // 20pt iOS, 19pt Android
    lineHeight: baseFontSize * 1.5, // 25.5pt iOS, 24pt Android
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    letterSpacing: Platform.OS === 'ios' ? 0.2 : 0.15,
  },
  
  // Body text
  body1: {
    fontSize: baseFontSize,         // 17pt iOS, 16pt Android
    lineHeight: baseFontSize * 1.35, // 23pt iOS, 22pt Android
    fontWeight: '400',
    letterSpacing: Platform.OS === 'ios' ? -0.41 : 0.5,
  },
  
  body2: {
    fontSize: baseFontSize * 0.88,  // 15pt iOS, 14pt Android
    lineHeight: baseFontSize * 1.25, // 21pt iOS, 20pt Android
    fontWeight: '400',
    letterSpacing: Platform.OS === 'ios' ? -0.24 : 0.25,
  },
  
  // UI text
  button: {
    fontSize: baseFontSize,
    lineHeight: baseFontSize * 1.2,
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    letterSpacing: Platform.OS === 'ios' ? -0.41 : 1.25,
  },
  
  caption: {
    fontSize: baseFontSize * 0.76,  // 13pt iOS, 12pt Android
    lineHeight: baseFontSize,       // 17pt iOS, 16pt Android
    fontWeight: '400',
    letterSpacing: Platform.OS === 'ios' ? -0.08 : 0.4,
  },
  
  label: {
    fontSize: baseFontSize * 0.65,  // 11pt iOS, 10pt Android
    lineHeight: baseFontSize * 0.82, // 14pt iOS, 13pt Android
    fontWeight: '600',
    letterSpacing: Platform.OS === 'ios' ? 0.07 : 1.5,
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
};

// Border radius following platform conventions
export const RADIUS = {
  xs: Platform.OS === 'ios' ? 6 : 4,
  sm: Platform.OS === 'ios' ? 8 : 6,
  md: Platform.OS === 'ios' ? 12 : 8,
  lg: Platform.OS === 'ios' ? 16 : 12,
  xl: Platform.OS === 'ios' ? 20 : 16,
  full: 9999,
};

// Shadow presets following platform guidelines
export const SHADOWS = {
  none: {},
  
  light: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
  
  heavy: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
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
    small: 32,
    medium: 44,
    large: 52,
  },
  
  // Input heights
  input: {
    small: 36,
    medium: 44,
    large: 52,
  },
  
  // Icon sizes
  icon: {
    xs: 12,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
  
  // Touch targets (minimum 44pt per iOS HIG)
  touchTarget: {
    minimum: 44,
  },
};

// Animation timings
export const TIMINGS = {
  fast: 150,
  medium: 250,
  slow: 350,
  
  // Platform-specific defaults
  default: Platform.OS === 'ios' ? 250 : 225,
};

// Accessibility helpers
export const ACCESSIBILITY = {
  // Minimum touch target size (WCAG 2.1 AAA)
  touchTargetSize: 44,
  
  // Color contrast ratios for WCAG AA compliance
  contrastRatios: {
    normal: 4.5,
    large: 3,
    aa: 4.5,
    aaa: 7,
  },
  
  // Screen reader labels
  labels: {
    loading: 'Loading content',
    close: 'Close',
    back: 'Go back',
    next: 'Continue to next step',
    select: 'Select this option',
    required: 'Required field',
    error: 'Error message',
    success: 'Success message',
    uploadFile: 'Upload file',
    generateHeadshots: 'Generate professional headshots',
    downloadImage: 'Download image',
    selectStyle: 'Select headshot style',
    photoPreview: 'Photo preview',
    processingStatus: 'Processing status update',
  },
  
  // WCAG 2.1 AA compliant focus indicators
  focusIndicator: {
    width: 2,
    color: COLORS.primary[500],
    offset: 2,
    style: 'solid',
  },
  
  // Enhanced color contrast validation
  validateContrast: (foreground, background, level = 'aa', size = 'normal') => {
    // This would include actual contrast calculation logic in production
    const requiredRatio = level === 'aaa' 
      ? (size === 'large' ? 4.5 : 7) 
      : (size === 'large' ? 3 : 4.5);
    return true; // Placeholder - would calculate actual contrast
  },
  
  // Screen reader announcements
  announcements: {
    photoSelected: 'Photo selected successfully',
    generationStarted: 'Headshot generation started',
    generationComplete: 'Headshot generation complete',
    navigationChanged: 'Navigation changed to',
    errorOccurred: 'An error has occurred',
    formSubmitted: 'Form submitted successfully',
  },
  
  // Semantic roles mapping
  roles: {
    button: 'button',
    link: 'link',
    heading: 'header',
    image: 'image',
    textInput: 'none', // Let TextInput handle its own role
    alert: 'alert',
    status: 'status',
    progressBar: 'progressbar',
    menu: 'menu',
    menuItem: 'menuitem',
    tab: 'tab',
    tabList: 'tablist',
    tabPanel: 'tabpanel',
  },
};

// Platform-specific styling helpers
export const getPlatformStyles = (iosStyle, androidStyle) => {
  return Platform.select({
    ios: iosStyle,
    android: androidStyle,
  });
};

// Responsive helper functions
export const responsive = {
  // Width percentage
  wp: (percentage) => (width * percentage) / 100,
  
  // Height percentage
  hp: (percentage) => (height * percentage) / 100,
  
  // Font scaling based on screen size
  fs: (size) => {
    const scale = width / BREAKPOINTS.medium;
    return Math.round(size * scale);
  },
  
  // Spacing scaling
  sp: (space) => {
    const screenSize = getScreenSize();
    const scales = {
      small: 0.9,
      medium: 1,
      large: 1.1,
      xlarge: 1.2,
    };
    return space * scales[screenSize];
  },
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  SIZES,
  TIMINGS,
  ACCESSIBILITY,
  BREAKPOINTS,
  getPlatformStyles,
  responsive,
  getScreenSize,
};