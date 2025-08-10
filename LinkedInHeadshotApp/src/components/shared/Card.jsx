/**
 * Enhanced Card Component
 * Follows iOS HIG and Material Design guidelines
 * WCAG 2.1 AA compliant with proper accessibility features
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ACCESSIBILITY, responsive } from '../../utils/designSystem';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  onPress,
  selected = false,
  disabled = false,
  variant = 'elevated', // 'elevated', 'outlined', 'filled'
  padding = 'medium', // 'none', 'small', 'medium', 'large'
  style = {},
  contentStyle = {},
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  ...rest
}) => {
  // Get card styles based on variant and state
  const getCardStyles = () => {
    const variants = {
      elevated: {
        backgroundColor: COLORS.background.card,
        borderWidth: 0,
        ...SHADOWS.light,
      },
      outlined: {
        backgroundColor: COLORS.background.card,
        borderWidth: 1,
        borderColor: selected ? COLORS.primary[500] : COLORS.border.light,
      },
      filled: {
        backgroundColor: selected ? COLORS.primary[50] : COLORS.background.secondary,
        borderWidth: 0,
      },
    };

    const paddings = {
      none: {},
      small: { padding: responsive.sp(SPACING.md) },
      medium: { padding: responsive.sp(SPACING.lg) },
      large: { padding: responsive.sp(SPACING.xl) },
    };

    let baseStyle = {
      ...variants[variant],
      ...paddings[padding],
      borderRadius: RADIUS.lg,
    };

    if (selected) {
      baseStyle = {
        ...baseStyle,
        ...SHADOWS.medium,
        transform: [{ scale: 1.02 }],
      };

      if (variant === 'outlined') {
        baseStyle.borderColor = COLORS.primary[500];
        baseStyle.borderWidth = 2;
      }
    }

    if (disabled) {
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  // Accessibility props
  const accessibilityProps = onPress ? {
    accessible: true,
    accessibilityRole,
    accessibilityLabel: accessibilityLabel || title,
    accessibilityHint,
    accessibilityState: {
      disabled,
      selected,
    },
    testID,
  } : {};

  const cardStyles = getCardStyles();

  const CardContent = () => (
    <View style={[styles.card, cardStyles, style]}>
      {/* Header */}
      {(title || subtitle || headerAction) && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {title && (
              <Text 
                style={styles.title}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text 
                style={styles.subtitle}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {subtitle}
              </Text>
            )}
          </View>
          {headerAction && (
            <View style={styles.headerAction}>
              {headerAction}
            </View>
          )}
        </View>
      )}

      {/* Content */}
      {children && (
        <View style={[styles.content, contentStyle]}>
          {children}
        </View>
      )}

      {/* Selection indicator */}
      {selected && (
        <View style={styles.selectionIndicator}>
          <View style={styles.selectionDot}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.touchable}
        {...accessibilityProps}
        {...rest}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

// Specialized card variants
export const InfoCard = ({ icon, title, description, ...props }) => (
  <Card variant="filled" {...props}>
    <View style={styles.infoContent}>
      {icon && <View style={styles.infoIcon}>{icon}</View>}
      <View style={styles.infoText}>
        <Text style={styles.infoTitle}>{title}</Text>
        {description && (
          <Text style={styles.infoDescription}>{description}</Text>
        )}
      </View>
    </View>
  </Card>
);

export const ActionCard = ({ 
  icon, 
  title, 
  description, 
  actionText = 'Learn More',
  onActionPress,
  ...props 
}) => (
  <Card variant="outlined" {...props}>
    <View style={styles.actionContent}>
      {icon && <View style={styles.actionIcon}>{icon}</View>}
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        {description && (
          <Text style={styles.actionDescription}>{description}</Text>
        )}
      </View>
      {onActionPress && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  </Card>
);

export const FeatureCard = ({ 
  image, 
  title, 
  description, 
  badge,
  onPress,
  ...props 
}) => (
  <Card onPress={onPress} variant="elevated" {...props}>
    {image && <View style={styles.featureImage}>{image}</View>}
    <View style={styles.featureContent}>
      {badge && <View style={styles.featureBadge}>{badge}</View>}
      <Text style={styles.featureTitle}>{title}</Text>
      {description && (
        <Text style={styles.featureDescription}>{description}</Text>
      )}
    </View>
  </Card>
);

const styles = StyleSheet.create({
  touchable: {
    marginBottom: responsive.sp(SPACING.md),
  },
  
  card: {
    position: 'relative',
    minHeight: ACCESSIBILITY.touchTargetSize,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: responsive.sp(SPACING.md),
  },
  
  headerContent: {
    flex: 1,
    marginRight: responsive.sp(SPACING.sm),
  },
  
  headerAction: {
    alignItems: 'flex-end',
  },
  
  title: {
    fontSize: responsive.fs(TYPOGRAPHY.h4.fontSize),
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    color: COLORS.text.primary,
    marginBottom: responsive.sp(SPACING.xs),
    letterSpacing: TYPOGRAPHY.h4.letterSpacing,
  },
  
  subtitle: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.body2.lineHeight,
  },
  
  // Content styles
  content: {
    flex: 1,
  },
  
  // Selection indicator
  selectionIndicator: {
    position: 'absolute',
    top: responsive.sp(SPACING.md),
    right: responsive.sp(SPACING.md),
    zIndex: 2,
  },
  
  selectionDot: {
    backgroundColor: COLORS.primary[500],
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background.primary,
    ...SHADOWS.light,
  },
  
  checkmark: {
    color: COLORS.text.inverse,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Info Card styles
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  infoIcon: {
    marginRight: responsive.sp(SPACING.md),
    marginTop: responsive.sp(SPACING.xs),
  },
  
  infoText: {
    flex: 1,
  },
  
  infoTitle: {
    fontSize: responsive.fs(TYPOGRAPHY.body1.fontSize),
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: responsive.sp(SPACING.xs),
  },
  
  infoDescription: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.body2.lineHeight,
  },
  
  // Action Card styles
  actionContent: {
    alignItems: 'center',
    padding: responsive.sp(SPACING.md),
  },
  
  actionIcon: {
    marginBottom: responsive.sp(SPACING.md),
  },
  
  actionText: {
    alignItems: 'center',
    marginBottom: responsive.sp(SPACING.lg),
  },
  
  actionTitle: {
    fontSize: responsive.fs(TYPOGRAPHY.h4.fontSize),
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    color: COLORS.text.primary,
    marginBottom: responsive.sp(SPACING.sm),
    textAlign: 'center',
  },
  
  actionDescription: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.body2.lineHeight,
  },
  
  actionButton: {
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: responsive.sp(SPACING.lg),
    paddingVertical: responsive.sp(SPACING.md),
    borderRadius: RADIUS.full,
    minHeight: ACCESSIBILITY.touchTargetSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  actionButtonText: {
    color: COLORS.text.inverse,
    fontSize: responsive.fs(TYPOGRAPHY.button.fontSize),
    fontWeight: TYPOGRAPHY.button.fontWeight,
  },
  
  // Feature Card styles
  featureImage: {
    marginBottom: responsive.sp(SPACING.md),
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  
  featureContent: {
    position: 'relative',
  },
  
  featureBadge: {
    position: 'absolute',
    top: -responsive.sp(SPACING.sm),
    right: 0,
    zIndex: 1,
  },
  
  featureTitle: {
    fontSize: responsive.fs(TYPOGRAPHY.h4.fontSize),
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    color: COLORS.text.primary,
    marginBottom: responsive.sp(SPACING.sm),
  },
  
  featureDescription: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.body2.lineHeight,
  },
});

export default Card;