/**
 * Help System Component - Contextual Tooltips and Guidance
 * Provides contextual help throughout the app to reduce user confusion
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { BRAND_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/branding';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Tooltip Component
export const Tooltip = ({
  visible,
  text,
  position = 'bottom',
  children,
  onDismiss,
  anchorPosition = null,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
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
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return children;

  const getTooltipPosition = () => {
    if (anchorPosition) {
      const { x, y, width, height } = anchorPosition;
      
      switch (position) {
        case 'top':
          return {
            left: x + width / 2,
            top: y - 10,
            transform: [{ translateX: -50 }, { translateY: -100 }],
          };
        case 'bottom':
          return {
            left: x + width / 2,
            top: y + height + 10,
            transform: [{ translateX: -50 }],
          };
        case 'left':
          return {
            left: x - 10,
            top: y + height / 2,
            transform: [{ translateX: -100 }, { translateY: -50 }],
          };
        case 'right':
          return {
            left: x + width + 10,
            top: y + height / 2,
            transform: [{ translateY: -50 }],
          };
        default:
          return {
            left: x + width / 2,
            top: y + height + 10,
            transform: [{ translateX: -50 }],
          };
      }
    }

    // Default centering
    return {
      left: screenWidth / 2,
      top: screenHeight / 2,
      transform: [{ translateX: -50 }, { translateY: -50 }],
    };
  };

  const getArrowStyle = () => {
    const arrowSize = 8;
    const baseArrow = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    switch (position) {
      case 'top':
        return {
          ...baseArrow,
          bottom: -arrowSize,
          left: '50%',
          marginLeft: -arrowSize,
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: BRAND_COLORS.PRIMARY,
        };
      case 'bottom':
        return {
          ...baseArrow,
          top: -arrowSize,
          left: '50%',
          marginLeft: -arrowSize,
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: BRAND_COLORS.PRIMARY,
        };
      case 'left':
        return {
          ...baseArrow,
          right: -arrowSize,
          top: '50%',
          marginTop: -arrowSize,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: BRAND_COLORS.PRIMARY,
        };
      case 'right':
        return {
          ...baseArrow,
          left: -arrowSize,
          top: '50%',
          marginTop: -arrowSize,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: BRAND_COLORS.PRIMARY,
        };
      default:
        return baseArrow;
    }
  };

  return (
    <>
      {children}
      <Modal transparent visible={visible} animationType="none">
        <TouchableOpacity
          style={styles.tooltipOverlay}
          onPress={onDismiss}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.tooltipContainer,
              getTooltipPosition(),
              {
                opacity: fadeAnim,
                transform: [
                  ...getTooltipPosition().transform,
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipText}>{text}</Text>
              <View style={getArrowStyle()} />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// Help Button Component
export const HelpButton = ({ onPress, size = 24, style = {} }) => {
  return (
    <TouchableOpacity
      style={[styles.helpButton, style]}
      onPress={onPress}
      accessibilityLabel="Get help"
      accessibilityRole="button"
    >
      <Text style={[styles.helpButtonText, { fontSize: size }]}>?</Text>
    </TouchableOpacity>
  );
};

// Help Modal Component
export const HelpModal = ({
  visible,
  title,
  content,
  steps = [],
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.helpModalOverlay}>
        <Animated.View
          style={[
            styles.helpModalContainer,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.helpModalHeader}>
            <Text style={styles.helpModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.helpModalClose}>
              <Text style={styles.helpModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.helpModalContent}>
            {content && (
              <Text style={styles.helpModalText}>{content}</Text>
            )}

            {steps.length > 0 && (
              <View style={styles.helpModalSteps}>
                <Text style={styles.helpModalStepsTitle}>How it works:</Text>
                {steps.map((step, index) => (
                  <View key={index} style={styles.helpModalStep}>
                    <View style={styles.helpModalStepNumber}>
                      <Text style={styles.helpModalStepNumberText}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.helpModalStepContent}>
                      <Text style={styles.helpModalStepTitle}>{step.title}</Text>
                      <Text style={styles.helpModalStepDescription}>
                        {step.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.helpModalButton}
            onPress={onDismiss}
          >
            <Text style={styles.helpModalButtonText}>Got it!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Contextual Help Provider
export const HelpProvider = ({ children }) => {
  const [currentHelp, setCurrentHelp] = useState(null);

  const showHelp = (helpConfig) => {
    setCurrentHelp(helpConfig);
  };

  const hideHelp = () => {
    setCurrentHelp(null);
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      {currentHelp && (
        <HelpModal
          visible={!!currentHelp}
          title={currentHelp.title}
          content={currentHelp.content}
          steps={currentHelp.steps}
          onDismiss={hideHelp}
        />
      )}
    </View>
  );
};

// Predefined help content
export const HELP_CONTENT = {
  photo_requirements: {
    title: 'Photo Requirements',
    content: 'For best results, use a high-quality photo with good lighting and a clear view of your face.',
    steps: [
      {
        title: 'Good Lighting',
        description: 'Use natural light or well-lit indoor lighting. Avoid harsh shadows.'
      },
      {
        title: 'Clear Face View',
        description: 'Face should be clearly visible and centered in the photo.'
      },
      {
        title: 'High Quality',
        description: 'Use the highest resolution available. Avoid blurry or pixelated images.'
      },
      {
        title: 'Appropriate Format',
        description: 'JPG or PNG formats work best. Keep file size under 10MB.'
      }
    ]
  },

  platform_selection: {
    title: 'Platform Selection Guide',
    content: 'Choose platforms where you want to maintain a professional presence. Different platforms have different requirements.',
    steps: [
      {
        title: 'Professional Networks',
        description: 'LinkedIn and GitHub are essential for career development and networking.'
      },
      {
        title: 'Social Media',
        description: 'Instagram, Facebook, and Twitter help build personal brand and reach.'
      },
      {
        title: 'Content Platforms',
        description: 'YouTube and TikTok are perfect if you create video content.'
      },
      {
        title: 'Business Communication',
        description: 'WhatsApp Business helps maintain professional client communication.'
      }
    ]
  },

  style_selection: {
    title: 'Professional Styles',
    content: 'Choose a style that matches your industry and professional goals.',
    steps: [
      {
        title: 'Executive',
        description: 'Conservative, authoritative look perfect for leadership roles and corporate environments.'
      },
      {
        title: 'Creative',
        description: 'Modern, artistic approach ideal for creative industries and innovative companies.'
      },
      {
        title: 'Tech',
        description: 'Contemporary, approachable style that works well in technology and startup environments.'
      },
      {
        title: 'Industry-Specific',
        description: 'Healthcare, Finance, and Legal styles tailored for specific professional requirements.'
      }
    ]
  },

  processing_time: {
    title: 'Processing Information',
    content: 'AI optimization takes time to ensure the best results for your professional photos.',
    steps: [
      {
        title: 'Analysis Phase',
        description: 'AI analyzes your photo composition, lighting, and facial features.'
      },
      {
        title: 'Enhancement Phase',
        description: 'Professional styling and lighting adjustments are applied.'
      },
      {
        title: 'Platform Optimization',
        description: 'Each platform gets optimized dimensions and quality settings.'
      },
      {
        title: 'Quality Assurance',
        description: 'Final quality checks ensure professional standards are met.'
      }
    ]
  },

  results_explanation: {
    title: 'Understanding Your Results',
    content: 'Your optimized photos are ready for professional use across all selected platforms.',
    steps: [
      {
        title: 'Quality Scores',
        description: 'Each image gets a quality score showing optimization effectiveness.'
      },
      {
        title: 'Platform Specifications',
        description: 'Images are sized and optimized for each platform\'s requirements.'
      },
      {
        title: 'Download Options',
        description: 'Save all images to your device or share directly to platforms.'
      },
      {
        title: 'Usage Tips',
        description: 'Best practices for using your professional photos effectively.'
      }
    ]
  }
};

const styles = StyleSheet.create({
  // Tooltip Styles
  tooltipOverlay: {
    flex: 1,
  },
  tooltipContainer: {
    position: 'absolute',
    maxWidth: 250,
    zIndex: 9999,
  },
  tooltipContent: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tooltipText: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Help Button Styles
  helpButton: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  helpButtonText: {
    color: BRAND_COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },

  // Help Modal Styles
  helpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  helpModalContainer: {
    backgroundColor: BRAND_COLORS.WHITE,
    borderRadius: BORDER_RADIUS.XL,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  helpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.GRAY_200,
  },
  helpModalTitle: {
    fontSize: TYPOGRAPHY.SIZE_HEADING,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.PRIMARY,
    flex: 1,
  },
  helpModalClose: {
    padding: SPACING.SM,
  },
  helpModalCloseText: {
    fontSize: 20,
    color: BRAND_COLORS.GRAY_500,
  },
  helpModalContent: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    maxHeight: 400,
  },
  helpModalText: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: BRAND_COLORS.GRAY_700,
    lineHeight: 22,
    marginBottom: SPACING.LG,
  },
  helpModalSteps: {
    marginTop: SPACING.MD,
  },
  helpModalStepsTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.MD,
  },
  helpModalStep: {
    flexDirection: 'row',
    marginBottom: SPACING.LG,
  },
  helpModalStepNumber: {
    backgroundColor: BRAND_COLORS.SECONDARY,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  helpModalStepNumberText: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  helpModalStepContent: {
    flex: 1,
  },
  helpModalStepTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  helpModalStepDescription: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_600,
    lineHeight: 18,
  },
  helpModalButton: {
    backgroundColor: BRAND_COLORS.SECONDARY,
    marginHorizontal: SPACING.LG,
    marginVertical: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  helpModalButtonText: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },
});

export default {
  Tooltip,
  HelpButton,
  HelpModal,
  HelpProvider,
  HELP_CONTENT,
};