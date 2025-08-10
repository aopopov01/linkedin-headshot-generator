/**
 * Enhanced Button Component
 * Follows iOS HIG and Material Design guidelines
 * WCAG 2.1 AA compliant with proper accessibility features
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES, ACCESSIBILITY } from '../../utils/designSystem';

const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'tertiary', 'ghost', 'danger'
  size = 'medium', // 'small', 'medium', 'large'
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left', // 'left', 'right'
  style = {},
  textStyle = {},
  testID,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}) => {
  // Get button styles based on variant and size
  const getButtonStyles = () => {
    const variants = {
      primary: {
        backgroundColor: disabled ? COLORS.neutral[300] : COLORS.primary[500],
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: disabled ? COLORS.neutral[100] : COLORS.secondary[500],
        borderWidth: 0,
      },
      tertiary: {
        backgroundColor: disabled ? COLORS.neutral[100] : COLORS.background.primary,
        borderWidth: 1,
        borderColor: disabled ? COLORS.neutral[300] : COLORS.primary[500],
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      danger: {
        backgroundColor: disabled ? COLORS.neutral[300] : COLORS.semantic.error,
        borderWidth: 0,
      },
    };

    const sizes = {
      small: {
        height: SIZES.button.small,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.sm,
      },
      medium: {
        height: SIZES.button.medium,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
      },
      large: {
        height: SIZES.button.large,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.lg,
      },
    };

    return {
      ...variants[variant],
      ...sizes[size],
      ...SHADOWS.light,
    };
  };

  // Get text styles based on variant and size
  const getTextStyles = () => {
    const textColors = {
      primary: disabled ? COLORS.neutral[500] : COLORS.text.inverse,
      secondary: disabled ? COLORS.neutral[500] : COLORS.text.inverse,
      tertiary: disabled ? COLORS.neutral[500] : COLORS.primary[500],
      ghost: disabled ? COLORS.neutral[500] : COLORS.primary[500],
      danger: disabled ? COLORS.neutral[500] : COLORS.text.inverse,
    };

    const textSizes = {
      small: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        lineHeight: TYPOGRAPHY.caption.lineHeight,
      },
      medium: {
        fontSize: TYPOGRAPHY.button.fontSize,
        lineHeight: TYPOGRAPHY.button.lineHeight,
      },
      large: {
        fontSize: TYPOGRAPHY.h4.fontSize,
        lineHeight: TYPOGRAPHY.h4.lineHeight,
      },
    };

    return {
      color: textColors[variant],
      fontWeight: TYPOGRAPHY.button.fontWeight,
      letterSpacing: TYPOGRAPHY.button.letterSpacing,
      ...textSizes[size],
    };
  };

  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();

  // Loading indicator color
  const getLoadingColor = () => {
    if (variant === 'tertiary' || variant === 'ghost') {
      return COLORS.primary[500];
    }
    return COLORS.text.inverse;
  };

  // Accessibility props
  const accessibilityProps = {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: accessibilityLabel || title,
    accessibilityHint: accessibilityHint,
    accessibilityState: {
      disabled: disabled || loading,
      busy: loading,
    },
    testID,
  };

  // Render icon helper
  const renderIcon = () => {
    if (!icon) return null;
    
    const iconStyle = {
      marginRight: iconPosition === 'left' ? SPACING.sm : 0,
      marginLeft: iconPosition === 'right' ? SPACING.sm : 0,
    };

    return (
      <View style={iconStyle}>
        {icon}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyles,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={!disabled && !loading ? onPress : undefined}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...accessibilityProps}
      {...rest}
    >
      <View style={[
        styles.content,
        iconPosition === 'right' && styles.contentReverse,
      ]}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={getLoadingColor()}
            style={styles.spinner}
          />
        ) : (
          <>
            {iconPosition === 'left' && renderIcon()}
            <Text 
              style={[textStyles, textStyle]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {title}
            </Text>
            {iconPosition === 'right' && renderIcon()}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Preset button variants for common use cases
export const PrimaryButton = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton = (props) => (
  <Button variant="secondary" {...props} />
);

export const TertiaryButton = (props) => (
  <Button variant="tertiary" {...props} />
);

export const GhostButton = (props) => (
  <Button variant="ghost" {...props} />
);

export const DangerButton = (props) => (
  <Button variant="danger" {...props} />
);

// Floating Action Button (Material Design)
export const FAB = ({
  onPress,
  icon,
  size = 'medium',
  position = 'bottomRight',
  style = {},
  ...rest
}) => {
  const fabSizes = {
    small: { width: 40, height: 40, borderRadius: 20 },
    medium: { width: 56, height: 56, borderRadius: 28 },
    large: { width: 72, height: 72, borderRadius: 36 },
  };

  const positions = {
    bottomRight: {
      position: 'absolute',
      bottom: SPACING.lg,
      right: SPACING.lg,
    },
    bottomLeft: {
      position: 'absolute',
      bottom: SPACING.lg,
      left: SPACING.lg,
    },
    topRight: {
      position: 'absolute',
      top: SPACING.lg,
      right: SPACING.lg,
    },
    topLeft: {
      position: 'absolute',
      top: SPACING.lg,
      left: SPACING.lg,
    },
  };

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        fabSizes[size],
        positions[position],
        SHADOWS.heavy,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
      {...rest}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ACCESSIBILITY.touchTargetSize,
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  contentReverse: {
    flexDirection: 'row-reverse',
  },
  
  fullWidth: {
    alignSelf: 'stretch',
  },
  
  disabled: {
    opacity: 0.6,
  },
  
  spinner: {
    marginHorizontal: SPACING.sm,
  },
  
  fab: {
    backgroundColor: COLORS.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: {
        elevation: 6,
      },
    }),
  },
});

export default Button;