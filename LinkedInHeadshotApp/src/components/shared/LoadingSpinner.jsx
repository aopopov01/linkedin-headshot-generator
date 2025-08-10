import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ACCESSIBILITY, responsive } from '../../utils/designSystem';

const LoadingSpinner = ({ 
  visible = false, 
  message = 'Loading...', 
  subMessage = null,
  size = 'large',
  color = COLORS.primary[500],
  overlay = true,
  transparent = true,
  progress = null, // 0-100 for progress bar
  showProgress = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  useEffect(() => {
    if (progress !== null && showProgress) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, showProgress, progressAnim]);
  const SpinnerContent = () => (
    <Animated.View 
      style={[
        styles.container, 
        overlay && styles.overlay,
        { opacity: fadeAnim }
      ]}
    >
      <Animated.View 
        style={[
          styles.spinnerContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}
        accessible={true}
        accessibilityRole={ACCESSIBILITY.roles.progressBar}
        accessibilityLabel={showProgress && progress !== null ? `Loading ${Math.round(progress)}% complete` : message}
        accessibilityHint={subMessage}
        accessibilityLiveRegion="polite"
        accessibilityValue={showProgress && progress !== null ? {
          min: 0,
          max: 100,
          now: Math.round(progress || 0),
          text: `${Math.round(progress || 0)} percent`
        } : undefined}
        importantForAccessibility="yes"
      >
        <ActivityIndicator 
          size={size} 
          color={color}
          style={styles.spinner}
          accessibilityLabel={ACCESSIBILITY.labels.loading}
        />
        
        <Text style={styles.message} accessibilityRole="text">
          {message}
        </Text>
        
        {subMessage && (
          <Text style={styles.subMessage} accessibilityRole="text">
            {subMessage}
          </Text>
        )}
        
        {showProgress && progress !== null && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress || 0)}%</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );

  if (overlay) {
    return (
      <Modal
        transparent={transparent}
        visible={visible}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <SpinnerContent />
      </Modal>
    );
  }

  return visible ? <SpinnerContent /> : null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsive.sp(SPACING.lg),
  },
  overlay: {
    backgroundColor: COLORS.background.overlay,
  },
  spinnerContainer: {
    backgroundColor: COLORS.background.card,
    borderRadius: RADIUS.xl,
    padding: responsive.sp(SPACING.xxxl),
    alignItems: 'center',
    minWidth: responsive.wp(60),
    maxWidth: responsive.wp(80),
    ...SHADOWS.heavy,
    ...Platform.select({
      android: {
        elevation: 12,
      },
    }),
  },
  spinner: {
    marginBottom: responsive.sp(SPACING.lg),
    transform: [{ scale: Platform.OS === 'ios' ? 1.2 : 1 }],
  },
  message: {
    fontSize: responsive.fs(TYPOGRAPHY.body1.fontSize),
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: responsive.sp(SPACING.sm),
    letterSpacing: TYPOGRAPHY.body1.letterSpacing,
  },
  subMessage: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.body2.lineHeight,
    maxWidth: responsive.wp(60),
  },
  progressContainer: {
    marginTop: responsive.sp(SPACING.lg),
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.neutral[200],
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
    marginBottom: responsive.sp(SPACING.sm),
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
    borderRadius: RADIUS.xs,
  },
  progressText: {
    fontSize: responsive.fs(TYPOGRAPHY.caption.fontSize),
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
});

export default LoadingSpinner;