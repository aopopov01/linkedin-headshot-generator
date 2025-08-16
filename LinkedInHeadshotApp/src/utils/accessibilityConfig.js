/**
 * OmniShot Accessibility Configuration
 * Comprehensive accessibility features and WCAG 2.1 AA compliance
 */

import { AccessibilityInfo, Platform } from 'react-native';
import DesignSystem from './omnishotDesignSystem';

const { COLORS, TYPOGRAPHY, SPACING } = DesignSystem;

// Accessibility announcement types
export const ANNOUNCEMENT_TYPES = {
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
};

// Screen reader announcements for app states
export const ANNOUNCEMENTS = {
  // Navigation
  SCREEN_CHANGED: (screenName) => `Navigated to ${screenName}`,
  BACK_NAVIGATION: 'Navigated back',
  
  // Photo capture
  PHOTO_SELECTED: 'Photo selected successfully',
  PHOTO_CAPTURE_SUCCESS: 'Photo captured successfully',
  PHOTO_CAPTURE_FAILED: 'Photo capture failed, please try again',
  
  // Style selection
  STYLE_SELECTED: (styleName) => `${styleName} style selected`,
  STYLE_PREVIEW_AVAILABLE: (styleName) => `Preview available for ${styleName} style`,
  
  // Platform selection
  PLATFORM_SELECTED: (platformName) => `${platformName} platform selected`,
  PLATFORM_DESELECTED: (platformName) => `${platformName} platform deselected`,
  MULTIPLE_PLATFORMS_SELECTED: (count) => `${count} platforms selected for optimization`,
  
  // Processing
  PROCESSING_STARTED: 'Photo processing started',
  PROCESSING_STAGE_CHANGE: (stageName) => `Now ${stageName.toLowerCase()}`,
  PROCESSING_PLATFORM_CHANGE: (platformName) => `Optimizing for ${platformName}`,
  PROCESSING_COMPLETE: 'Photo processing complete, results are ready',
  
  // Results
  RESULTS_READY: (count) => `${count} optimized photos ready for download`,
  DOWNLOAD_STARTED: (platformName) => `Downloading ${platformName} photo`,
  DOWNLOAD_COMPLETE: (platformName) => `${platformName} photo downloaded successfully`,
  SHARE_SUCCESS: 'Photo shared successfully',
  
  // Premium
  PREMIUM_FEATURE_ACCESSED: 'This is a premium feature',
  SUBSCRIPTION_SUCCESS: 'Premium subscription activated',
  
  // Errors
  NETWORK_ERROR: 'Network connection error, please check your internet',
  PROCESSING_ERROR: 'Photo processing failed, please try again',
  UPLOAD_ERROR: 'Photo upload failed, please select a different image',
};

// Accessibility labels for UI elements
export const ACCESSIBILITY_LABELS = {
  // Navigation
  HOME_TAB: 'Home tab, create professional photos',
  GALLERY_TAB: 'Gallery tab, view your generated photos',
  PROFILE_TAB: 'Profile tab, manage account and settings',
  BACK_BUTTON: 'Go back to previous screen',
  CLOSE_BUTTON: 'Close current screen',
  
  // Photo actions
  TAKE_PHOTO: 'Take photo with camera',
  UPLOAD_PHOTO: 'Upload photo from gallery',
  RETAKE_PHOTO: 'Retake photo',
  
  // Style selection
  STYLE_CARD: (styleName, description) => `${styleName} style, ${description}`,
  STYLE_PREVIEW: (styleName) => `${styleName} style preview`,
  
  // Platform selection
  PLATFORM_CARD: (platformName, selected) => 
    `${platformName} platform, ${selected ? 'selected' : 'not selected'}`,
  PLATFORM_DIMENSIONS: (platform, dimensions) => 
    `${platform} optimized for ${dimensions.aspectRatio} aspect ratio`,
  
  // Processing
  PROCESSING_INDICATOR: 'Processing your professional photos',
  PROGRESS_BAR: (progress) => `Processing progress: ${progress}%`,
  
  // Results
  RESULT_IMAGE: (platformName) => `Generated photo optimized for ${platformName}`,
  DOWNLOAD_BUTTON: (platformName) => `Download ${platformName} photo`,
  SHARE_BUTTON: (platformName) => `Share ${platformName} photo`,
  
  // Premium
  PREMIUM_BADGE: 'Premium feature',
  UPGRADE_BUTTON: 'Upgrade to premium subscription',
  
  // Controls
  TOGGLE_SWITCH: (label, state) => `${label}, ${state ? 'enabled' : 'disabled'}`,
  SELECTION_CHECKBOX: (item, selected) => `${item}, ${selected ? 'selected' : 'not selected'}`,
};

// Accessibility hints for complex interactions
export const ACCESSIBILITY_HINTS = {
  STYLE_SELECTION: 'Swipe to browse different professional styles, double tap to select',
  PLATFORM_SELECTION: 'Double tap to select platform, you can choose multiple platforms',
  PHOTO_GALLERY: 'Swipe to browse photos, double tap to view full size',
  PROCESSING_SCREEN: 'Processing cannot be cancelled, please wait for completion',
  PREMIUM_FEATURES: 'This feature requires premium subscription, double tap to upgrade',
  NAVIGATION: 'Use tab bar at bottom to navigate between sections',
};

// Color contrast validation for WCAG compliance
export const validateColorContrast = (foregroundColor, backgroundColor, level = 'AA', size = 'normal') => {
  // This is a simplified version - in production you'd use a full contrast calculation library
  const requiredRatio = level === 'AAA' 
    ? (size === 'large' ? 4.5 : 7) 
    : (size === 'large' ? 3 : 4.5);
  
  // Mock calculation - replace with actual contrast calculation
  return true;
};

// Focus management utilities
export const focusManagement = {
  // Set focus to specific element
  setFocus: (ref) => {
    if (ref?.current) {
      AccessibilityInfo.setAccessibilityFocus(ref.current);
    }
  },
  
  // Announce message to screen reader
  announceMessage: (message, type = ANNOUNCEMENT_TYPES.POLITE) => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // Android implementation
      AccessibilityInfo.announceForAccessibility(message);
    }
  },
  
  // Check if screen reader is enabled
  isScreenReaderEnabled: async () => {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      return false;
    }
  },
};

// Accessible component props generators
export const getAccessibleProps = {
  button: (label, hint = null, state = {}) => ({
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: state,
  }),
  
  image: (description) => ({
    accessible: true,
    accessibilityRole: 'image',
    accessibilityLabel: description,
  }),
  
  text: (content, role = 'text') => ({
    accessible: true,
    accessibilityRole: role,
    accessibilityLabel: content,
  }),
  
  toggle: (label, value, hint = null) => ({
    accessible: true,
    accessibilityRole: 'switch',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { checked: value },
  }),
  
  selection: (label, selected, hint = null) => ({
    accessible: true,
    accessibilityRole: 'checkbox',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { selected },
  }),
};

// Touch target size validation
export const validateTouchTarget = (width, height) => {
  const MIN_TOUCH_TARGET = 44; // iOS HIG minimum
  return width >= MIN_TOUCH_TARGET && height >= MIN_TOUCH_TARGET;
};

// Dynamic font size support
export const getFontSizeScale = () => {
  // This would integrate with system accessibility settings
  // For now, return 1 (no scaling)
  return 1;
};

// High contrast mode detection and adjustments
export const highContrastAdjustments = {
  isEnabled: false, // Would be detected from system settings
  
  adjustColors: (normalColors) => {
    if (!highContrastAdjustments.isEnabled) {
      return normalColors;
    }
    
    // Apply high contrast adjustments
    return {
      ...normalColors,
      background: normalColors.background === COLORS.background.primary 
        ? '#FFFFFF' 
        : '#000000',
      text: normalColors.text === COLORS.text.primary 
        ? '#000000' 
        : '#FFFFFF',
      border: '#000000',
    };
  },
  
  adjustShadows: (normalShadows) => {
    if (!highContrastAdjustments.isEnabled) {
      return normalShadows;
    }
    
    // Remove shadows in high contrast mode
    return {};
  },
};

// Reduced motion detection and animations
export const reducedMotionSupport = {
  isEnabled: false, // Would be detected from system settings
  
  getAnimationDuration: (normalDuration) => {
    return reducedMotionSupport.isEnabled ? 0 : normalDuration;
  },
  
  shouldAnimate: () => {
    return !reducedMotionSupport.isEnabled;
  },
};

// Accessibility testing helpers
export const accessibilityTesting = {
  // Log accessibility tree for debugging
  logAccessibilityTree: (component) => {
    if (__DEV__) {
      console.log('Accessibility Tree:', component);
    }
  },
  
  // Validate component accessibility
  validateComponent: (component, requirements = []) => {
    const issues = [];
    
    // Check for required accessibility props
    requirements.forEach(requirement => {
      if (!component.props[requirement]) {
        issues.push(`Missing required accessibility prop: ${requirement}`);
      }
    });
    
    if (issues.length > 0 && __DEV__) {
      console.warn('Accessibility Issues:', issues);
    }
    
    return issues.length === 0;
  },
};

// Export all accessibility utilities
export default {
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENTS,
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_HINTS,
  validateColorContrast,
  focusManagement,
  getAccessibleProps,
  validateTouchTarget,
  getFontSizeScale,
  highContrastAdjustments,
  reducedMotionSupport,
  accessibilityTesting,
};