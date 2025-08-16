/**
 * Enhanced Processing Screen - Critical UX Improvements
 * Addresses processing anxiety, time estimates, and better user feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingSpinner from '../shared/LoadingSpinner';
import { BRAND_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/branding';

const EnhancedProcessingScreen = ({
  selectedImage,
  selectedPlatforms = [],
  selectedStyle,
  processingProgress = 0,
  currentProcessingPlatform = '',
  platformOptions = [],
  styleOptions = [],
  onCancel,
  estimatedTime = null,
  processingStage = 'initializing',
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Pulse animation for active platform
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: processingProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [processingProgress, progressAnim]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get processing stage message
  const getStageMessage = () => {
    const stages = {
      initializing: 'Preparing your photo for optimization...',
      analyzing: 'Analyzing photo composition and lighting...',
      enhancing: 'Applying AI-powered enhancements...',
      optimizing: 'Optimizing for platform specifications...',
      finalizing: 'Finalizing your professional images...',
    };
    return stages[processingStage] || 'Processing your photo...';
  };

  // Get estimated completion time
  const getEstimatedCompletion = () => {
    if (!estimatedTime) return null;
    const remaining = Math.max(0, estimatedTime - timeElapsed);
    if (remaining === 0) return 'Almost complete...';
    return `About ${formatTime(remaining)} remaining`;
  };

  // Render platform processing list with enhanced UX
  const renderPlatformList = () => {
    return selectedPlatforms.map((platformId, index) => {
      const platform = platformOptions.find(p => p.id === platformId);
      if (!platform) return null;

      const isActive = platform.name === currentProcessingPlatform;
      const isComplete = processingProgress > ((index / selectedPlatforms.length) * 100);
      const isPending = !isActive && !isComplete;

      return (
        <Animated.View
          key={platformId}
          style={[
            styles.platformItem,
            isActive && styles.platformItemActive,
            isComplete && styles.platformItemComplete,
            isPending && styles.platformItemPending,
            { transform: [{ scale: isActive ? pulseAnim : 1 }] }
          ]}
        >
          <View style={styles.platformItemContent}>
            <Text style={[
              styles.platformIcon,
              isComplete && styles.platformIconComplete
            ]}>
              {isComplete ? '✓' : platform.icon}
            </Text>
            
            <View style={styles.platformInfo}>
              <Text style={[
                styles.platformName,
                isActive && styles.platformNameActive,
                isComplete && styles.platformNameComplete
              ]}>
                {platform.name}
              </Text>
              <Text style={[
                styles.platformDimensions,
                isActive && styles.platformDimensionsActive
              ]}>
                {platform.dimensions}
              </Text>
            </View>

            <View style={styles.platformStatus}>
              {isComplete && (
                <View style={styles.completeBadge}>
                  <Text style={styles.completeText}>Done</Text>
                </View>
              )}
              {isActive && (
                <LoadingSpinner
                  visible={true}
                  size="small"
                  color={BRAND_COLORS.WHITE}
                  overlay={false}
                />
              )}
              {isPending && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Waiting</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      );
    });
  };

  const selectedStyleName = styleOptions.find(s => s.id === selectedStyle)?.name || 'Professional';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with cancel option */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OmniShot Processing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image preview */}
        {selectedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageLabel}>Original Photo</Text>
            </View>
          </View>
        )}

        {/* Progress section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Processing Progress</Text>
            <Text style={styles.progressPercentage}>{Math.round(processingProgress)}%</Text>
          </View>

          {/* Enhanced progress bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
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

          {/* Time and stage info */}
          <View style={styles.timeContainer}>
            <Text style={styles.stageText}>{getStageMessage()}</Text>
            <View style={styles.timeInfo}>
              <Text style={styles.elapsedTime}>Elapsed: {formatTime(timeElapsed)}</Text>
              {getEstimatedCompletion() && (
                <Text style={styles.estimatedTime}>{getEstimatedCompletion()}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Processing details */}
        <View style={styles.detailsSection}>
          <TouchableOpacity
            style={styles.detailsToggle}
            onPress={() => setShowDetails(!showDetails)}
          >
            <Text style={styles.detailsToggleText}>
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Text>
            <Text style={styles.detailsToggleIcon}>
              {showDetails ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {showDetails && (
            <View style={styles.detailsContent}>
              <Text style={styles.detailItem}>Style: {selectedStyleName}</Text>
              <Text style={styles.detailItem}>Platforms: {selectedPlatforms.length}</Text>
              <Text style={styles.detailItem}>Quality: AI Enhanced</Text>
              <Text style={styles.detailItem}>Resolution: High Definition</Text>
            </View>
          )}
        </View>

        {/* Platform processing list */}
        <View style={styles.platformSection}>
          <Text style={styles.platformSectionTitle}>Platform Optimization</Text>
          <View style={styles.platformList}>
            {renderPlatformList()}
          </View>
        </View>

        {/* Helpful tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>While you wait...</Text>
          <Text style={styles.tipText}>• AI is analyzing your facial features and lighting</Text>
          <Text style={styles.tipText}>• Each platform requires different optimization</Text>
          <Text style={styles.tipText}>• Professional styling is being applied</Text>
          <Text style={styles.tipText}>• High-quality results take time to perfect</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.PADDING_SCREEN,
    paddingVertical: SPACING.MD,
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  cancelButton: {
    padding: SPACING.SM,
  },
  cancelButtonText: {
    color: BRAND_COLORS.SECONDARY,
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.SIZE_HEADING,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.WHITE,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    backgroundColor: BRAND_COLORS.WHITE,
    borderTopLeftRadius: BORDER_RADIUS.XXL,
    borderTopRightRadius: BORDER_RADIUS.XXL,
  },
  imageContainer: {
    alignItems: 'center',
    padding: SPACING.PADDING_SCREEN,
    position: 'relative',
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: BRAND_COLORS.SECONDARY,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: SPACING.MD,
    backgroundColor: BRAND_COLORS.PRIMARY + '90',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.MD,
  },
  imageLabel: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  progressSection: {
    paddingHorizontal: SPACING.PADDING_SCREEN,
    paddingBottom: SPACING.LG,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  progressTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: BRAND_COLORS.PRIMARY,
  },
  progressPercentage: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.SECONDARY,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: BRAND_COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.SM,
    overflow: 'hidden',
    marginBottom: SPACING.MD,
  },
  progressBar: {
    height: '100%',
    backgroundColor: BRAND_COLORS.SECONDARY,
    borderRadius: BORDER_RADIUS.SM,
  },
  timeContainer: {
    alignItems: 'center',
  },
  stageText: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: BRAND_COLORS.GRAY_600,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  elapsedTime: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_500,
  },
  estimatedTime: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  detailsSection: {
    paddingHorizontal: SPACING.PADDING_SCREEN,
    paddingBottom: SPACING.LG,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    backgroundColor: BRAND_COLORS.GRAY_50,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
  },
  detailsToggleText: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: BRAND_COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  detailsToggleIcon: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_500,
  },
  detailsContent: {
    marginTop: SPACING.MD,
    paddingLeft: SPACING.MD,
  },
  detailItem: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_600,
    marginBottom: SPACING.XS,
  },
  platformSection: {
    paddingHorizontal: SPACING.PADDING_SCREEN,
    paddingBottom: SPACING.LG,
  },
  platformSectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.MD,
  },
  platformList: {
    gap: SPACING.SM,
  },
  platformItem: {
    backgroundColor: BRAND_COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  platformItemActive: {
    backgroundColor: BRAND_COLORS.SECONDARY,
    borderColor: BRAND_COLORS.SECONDARY,
  },
  platformItemComplete: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  platformItemPending: {
    backgroundColor: BRAND_COLORS.GRAY_100,
    borderColor: BRAND_COLORS.GRAY_200,
  },
  platformItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    fontSize: 24,
    marginRight: SPACING.MD,
  },
  platformIconComplete: {
    color: BRAND_COLORS.WHITE,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: 2,
  },
  platformNameActive: {
    color: BRAND_COLORS.WHITE,
  },
  platformNameComplete: {
    color: BRAND_COLORS.WHITE,
  },
  platformDimensions: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_500,
  },
  platformDimensionsActive: {
    color: BRAND_COLORS.WHITE + '90',
  },
  platformStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  completeBadge: {
    backgroundColor: BRAND_COLORS.WHITE + '20',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  completeText: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  pendingBadge: {
    backgroundColor: BRAND_COLORS.GRAY_200,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  pendingText: {
    color: BRAND_COLORS.GRAY_600,
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
  },
  tipsSection: {
    paddingHorizontal: SPACING.PADDING_SCREEN,
    paddingBottom: SPACING.XXL,
    backgroundColor: BRAND_COLORS.GRAY_50,
    marginHorizontal: SPACING.PADDING_SCREEN,
    marginBottom: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    paddingTop: SPACING.LG,
  },
  tipsTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.MD,
  },
  tipText: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_600,
    marginBottom: SPACING.SM,
    lineHeight: 18,
  },
});

export default EnhancedProcessingScreen;