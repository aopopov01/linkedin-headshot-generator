/**
 * Accessible Image Component
 * WCAG 2.1 AA compliant image component with proper accessibility features
 * Handles loading states, error states, and provides meaningful alt text
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ACCESSIBILITY, responsive } from '../../utils/designSystem';

const AccessibleImage = ({
  source,
  alt = '',
  style = {},
  imageStyle = {},
  onPress,
  onLoad,
  onError,
  loadingComponent,
  errorComponent,
  resizeMode = 'cover',
  accessible = true,
  accessibilityRole = 'image',
  accessibilityLabel,
  accessibilityHint,
  testID,
  showLoadingSpinner = true,
  showErrorState = true,
  decorative = false, // For decorative images (aria-hidden equivalent)
  ...rest
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);

  const handleLoad = (event) => {
    setLoading(false);
    setError(false);
    onLoad && onLoad(event);
  };

  const handleError = (event) => {
    setLoading(false);
    setError(true);
    onError && onError(event);
  };

  const handleRetry = () => {
    if (loadAttempts < 3) {
      setLoading(true);
      setError(false);
      setLoadAttempts(prev => prev + 1);
    }
  };

  // Generate appropriate accessibility props
  const getAccessibilityProps = () => {
    if (decorative) {
      return {
        accessible: false,
        importantForAccessibility: 'no-hide-descendants',
      };
    }

    return {
      accessible,
      accessibilityRole: ACCESSIBILITY.roles.image,
      accessibilityLabel: accessibilityLabel || alt || 'Image',
      accessibilityHint,
      importantForAccessibility: 'yes',
      testID,
    };
  };

  const accessibilityProps = getAccessibilityProps();

  // Render loading state
  const renderLoading = () => {
    if (loadingComponent) {
      return loadingComponent;
    }

    if (!showLoadingSpinner) {
      return null;
    }

    return (
      <View style={[styles.overlayContainer, styles.loadingContainer]}>
        <ActivityIndicator
          size="small"
          color={COLORS.primary[500]}
          accessibilityLabel={ACCESSIBILITY.labels.loading}
        />
        <Text style={styles.loadingText}>Loading image...</Text>
      </View>
    );
  };

  // Render error state
  const renderError = () => {
    if (errorComponent) {
      return errorComponent;
    }

    if (!showErrorState) {
      return null;
    }

    return (
      <View style={[styles.overlayContainer, styles.errorContainer]}>
        <Text style={styles.errorIcon}>📷</Text>
        <Text style={styles.errorText}>Failed to load image</Text>
        {loadAttempts < 3 && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            accessible={true}
            accessibilityRole={ACCESSIBILITY.roles.button}
            accessibilityLabel="Retry loading image"
            accessibilityHint="Attempts to reload the image"
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Main image component
  const imageComponent = (
    <View style={[styles.container, style]}>
      <Image
        source={{ ...source, cache: 'force-cache' }}
        style={[styles.image, imageStyle]}
        onLoad={handleLoad}
        onError={handleError}
        resizeMode={resizeMode}
        {...accessibilityProps}
        {...rest}
      />
      
      {loading && renderLoading()}
      {error && renderError()}
    </View>
  );

  // Wrap with TouchableOpacity if onPress is provided
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.touchableContainer, style]}
        accessible={!decorative}
        accessibilityRole={ACCESSIBILITY.roles.button}
        accessibilityLabel={accessibilityLabel ? `${accessibilityLabel}, button` : `${alt}, button`}
        accessibilityHint={accessibilityHint || 'Double tap to interact with this image'}
        testID={testID}
        activeOpacity={0.8}
      >
        <View style={styles.container}>
          <Image
            source={{ ...source, cache: 'force-cache' }}
            style={[styles.image, imageStyle]}
            onLoad={handleLoad}
            onError={handleError}
            resizeMode={resizeMode}
            accessible={false} // Let TouchableOpacity handle accessibility
            {...rest}
          />
          
          {loading && renderLoading()}
          {error && renderError()}
        </View>
      </TouchableOpacity>
    );
  }

  return imageComponent;
};

// Preset components for common use cases
export const ProfileImage = ({ size = 80, ...props }) => (
  <AccessibleImage
    style={{ width: size, height: size, borderRadius: size / 2 }}
    imageStyle={{ borderRadius: size / 2 }}
    accessibilityRole={ACCESSIBILITY.roles.image}
    {...props}
  />
);

export const ThumbnailImage = ({ size = 60, ...props }) => (
  <AccessibleImage
    style={{ 
      width: size, 
      height: size, 
      borderRadius: RADIUS.sm,
      ...SHADOWS.light 
    }}
    imageStyle={{ borderRadius: RADIUS.sm }}
    {...props}
  />
);

export const HeroImage = ({ ...props }) => (
  <AccessibleImage
    style={{ 
      width: '100%', 
      height: responsive.hp(25),
      borderRadius: RADIUS.lg,
      ...SHADOWS.medium
    }}
    imageStyle={{ borderRadius: RADIUS.lg }}
    {...props}
  />
);

export const DecorativeImage = ({ ...props }) => (
  <AccessibleImage
    decorative={true}
    {...props}
  />
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },

  touchableContainer: {
    position: 'relative',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.overlay,
  },

  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },

  loadingText: {
    fontSize: responsive.fs(TYPOGRAPHY.caption.fontSize),
    color: COLORS.text.secondary,
    marginTop: responsive.sp(SPACING.sm),
    textAlign: 'center',
  },

  errorContainer: {
    backgroundColor: COLORS.background.secondary,
    padding: responsive.sp(SPACING.md),
  },

  errorIcon: {
    fontSize: responsive.fs(32),
    marginBottom: responsive.sp(SPACING.sm),
  },

  errorText: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: responsive.sp(SPACING.md),
  },

  retryButton: {
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: responsive.sp(SPACING.md),
    paddingVertical: responsive.sp(SPACING.sm),
    borderRadius: RADIUS.sm,
    minHeight: ACCESSIBILITY.touchTargetSize / 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  retryText: {
    color: COLORS.text.inverse,
    fontSize: responsive.fs(TYPOGRAPHY.button.fontSize),
    fontWeight: TYPOGRAPHY.button.fontWeight,
  },
});

export default AccessibleImage;