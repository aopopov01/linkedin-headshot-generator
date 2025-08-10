/**
 * Accessibility Testing Utilities
 * Provides tools for testing WCAG 2.1 AA compliance in React Native components
 */

import { AccessibilityInfo, Platform } from 'react-native';
import { COLORS, ACCESSIBILITY } from './designSystem';

/**
 * Color contrast utilities for WCAG compliance testing
 */
export const ColorContrast = {
  // Convert hex color to RGB values
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // Calculate relative luminance
  getLuminance: (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio between two colors
  getContrastRatio: (color1, color2) => {
    const rgb1 = ColorContrast.hexToRgb(color1);
    const rgb2 = ColorContrast.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;

    const lum1 = ColorContrast.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = ColorContrast.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const bright = Math.max(lum1, lum2);
    const dark = Math.min(lum1, lum2);

    return (bright + 0.05) / (dark + 0.05);
  },

  // Check if contrast ratio meets WCAG standards
  meetsWCAG: (foreground, background, level = 'aa', size = 'normal') => {
    const ratio = ColorContrast.getContrastRatio(foreground, background);
    const requiredRatio = ACCESSIBILITY.contrastRatios[level];
    const sizeAdjustedRatio = size === 'large' ? ACCESSIBILITY.contrastRatios.large : requiredRatio;
    
    return {
      ratio,
      required: sizeAdjustedRatio,
      passes: ratio >= sizeAdjustedRatio,
      level,
      size
    };
  },

  // Test all color combinations in design system
  testDesignSystemColors: () => {
    const results = [];
    
    // Test primary text on backgrounds
    const backgrounds = [
      { name: 'primary', color: COLORS.background.primary },
      { name: 'secondary', color: COLORS.background.secondary },
      { name: 'tertiary', color: COLORS.background.tertiary },
    ];

    const textColors = [
      { name: 'primary', color: COLORS.text.primary },
      { name: 'secondary', color: COLORS.text.secondary },
      { name: 'disabled', color: COLORS.text.disabled },
    ];

    backgrounds.forEach(bg => {
      textColors.forEach(text => {
        const result = ColorContrast.meetsWCAG(text.color, bg.color);
        results.push({
          combination: `${text.name} text on ${bg.name} background`,
          foreground: text.color,
          background: bg.color,
          ...result
        });
      });
    });

    return results;
  }
};

/**
 * Touch target size testing
 */
export const TouchTargets = {
  // Check if element meets minimum touch target size
  validateSize: (width, height) => {
    const minSize = ACCESSIBILITY.touchTargetSize;
    return {
      width,
      height,
      minRequired: minSize,
      widthPasses: width >= minSize,
      heightPasses: height >= minSize,
      passes: width >= minSize && height >= minSize
    };
  },

  // Get recommended touch target size for platform
  getRecommendedSize: () => {
    return Platform.select({
      ios: 44, // iOS HIG recommendation
      android: 48, // Material Design recommendation
      default: 44
    });
  }
};

/**
 * Screen reader testing utilities
 */
export const ScreenReader = {
  // Check if screen reader is enabled
  isScreenReaderEnabled: async () => {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.warn('Could not check screen reader status:', error);
      return false;
    }
  },

  // Announce message to screen reader
  announce: (message) => {
    AccessibilityInfo.announceForAccessibility(message);
  },

  // Test if element has proper accessibility props
  validateAccessibilityProps: (props) => {
    const issues = [];
    
    if (props.accessible !== false && !props.accessibilityLabel && !props.accessibilityLabelledBy) {
      issues.push('Missing accessibilityLabel or accessibilityLabelledBy');
    }
    
    if (props.accessibilityRole && !Object.values(ACCESSIBILITY.roles).includes(props.accessibilityRole)) {
      issues.push(`Invalid accessibilityRole: ${props.accessibilityRole}`);
    }
    
    if (props.accessibilityState && typeof props.accessibilityState !== 'object') {
      issues.push('accessibilityState should be an object');
    }

    if (props.accessibilityValue && typeof props.accessibilityValue !== 'object') {
      issues.push('accessibilityValue should be an object');
    }

    return {
      passes: issues.length === 0,
      issues
    };
  }
};

/**
 * Keyboard navigation testing
 */
export const KeyboardNavigation = {
  // Test if element is focusable
  isFocusable: (element) => {
    // In React Native, elements are focusable if they have onFocus/onBlur or are touchable
    return !!(
      element.props.onFocus ||
      element.props.onBlur ||
      element.props.onPress ||
      element.props.accessible !== false
    );
  },

  // Validate focus order
  validateFocusOrder: (elements) => {
    const focusableElements = elements.filter(KeyboardNavigation.isFocusable);
    
    return {
      totalElements: elements.length,
      focusableCount: focusableElements.length,
      elements: focusableElements.map((el, index) => ({
        index,
        type: el.type.name || el.type,
        accessible: el.props.accessible,
        accessibilityLabel: el.props.accessibilityLabel
      }))
    };
  }
};

/**
 * Comprehensive accessibility audit
 */
export const AccessibilityAudit = {
  // Audit a single component
  auditComponent: (component, props = {}) => {
    const results = {
      component: component.name || 'Unknown',
      timestamp: new Date().toISOString(),
      issues: [],
      warnings: [],
      passes: []
    };

    // Check accessibility props
    const propsAudit = ScreenReader.validateAccessibilityProps(props);
    if (!propsAudit.passes) {
      results.issues.push(...propsAudit.issues);
    } else {
      results.passes.push('Accessibility props are properly configured');
    }

    // Check touch targets if dimensions are provided
    if (props.width && props.height) {
      const touchTarget = TouchTargets.validateSize(props.width, props.height);
      if (!touchTarget.passes) {
        results.issues.push(`Touch target too small: ${props.width}x${props.height} (min: ${touchTarget.minRequired}x${touchTarget.minRequired})`);
      } else {
        results.passes.push('Touch target meets minimum size requirements');
      }
    }

    // Check color contrast if colors are provided
    if (props.textColor && props.backgroundColor) {
      const contrast = ColorContrast.meetsWCAG(props.textColor, props.backgroundColor);
      if (!contrast.passes) {
        results.issues.push(`Insufficient color contrast: ${contrast.ratio.toFixed(2)}:1 (required: ${contrast.required}:1)`);
      } else {
        results.passes.push(`Color contrast meets WCAG ${contrast.level.toUpperCase()} standards`);
      }
    }

    return results;
  },

  // Generate comprehensive accessibility report
  generateReport: async () => {
    const report = {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      screenReaderEnabled: await ScreenReader.isScreenReaderEnabled(),
      colorContrastTests: ColorContrast.testDesignSystemColors(),
      recommendations: []
    };

    // Analyze color contrast results
    const failedContrasts = report.colorContrastTests.filter(test => !test.passes);
    if (failedContrasts.length > 0) {
      report.recommendations.push({
        category: 'Color Contrast',
        priority: 'High',
        message: `${failedContrasts.length} color combinations fail WCAG contrast requirements`,
        details: failedContrasts
      });
    }

    // Platform-specific recommendations
    if (Platform.OS === 'ios') {
      report.recommendations.push({
        category: 'iOS Accessibility',
        priority: 'Medium',
        message: 'Ensure VoiceOver navigation is tested on physical device',
        details: 'Simulator VoiceOver behavior may differ from actual device'
      });
    }

    if (Platform.OS === 'android') {
      report.recommendations.push({
        category: 'Android Accessibility',
        priority: 'Medium',
        message: 'Test with TalkBack and Switch Access',
        details: 'Verify proper focus management and navigation flow'
      });
    }

    return report;
  }
};

/**
 * Development helpers for accessibility testing
 */
export const AccessibilityDevTools = {
  // Log accessibility tree
  logAccessibilityTree: (element, depth = 0) => {
    const indent = '  '.repeat(depth);
    const info = {
      type: element.type?.name || element.type,
      accessible: element.props?.accessible,
      accessibilityRole: element.props?.accessibilityRole,
      accessibilityLabel: element.props?.accessibilityLabel,
      accessibilityHint: element.props?.accessibilityHint,
    };

    console.log(`${indent}${JSON.stringify(info, null, 2)}`);

    if (element.children) {
      element.children.forEach(child => {
        if (typeof child === 'object' && child.type) {
          AccessibilityDevTools.logAccessibilityTree(child, depth + 1);
        }
      });
    }
  },

  // Quick accessibility check for development
  quickCheck: (props) => {
    const issues = [];
    
    if (props.onPress && !props.accessibilityRole) {
      issues.push('Interactive element missing accessibilityRole');
    }
    
    if (!props.accessibilityLabel && props.accessible !== false) {
      issues.push('Missing accessibilityLabel');
    }
    
    if (issues.length > 0) {
      console.warn('Accessibility issues found:', issues);
    } else {
      console.log('✅ No immediate accessibility issues detected');
    }
    
    return issues;
  }
};

export default {
  ColorContrast,
  TouchTargets,
  ScreenReader,
  KeyboardNavigation,
  AccessibilityAudit,
  AccessibilityDevTools
};