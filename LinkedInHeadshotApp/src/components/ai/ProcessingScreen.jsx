import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import LoadingSpinner from '../shared/LoadingSpinner';
import { InfoCard } from '../shared/Card';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ACCESSIBILITY, responsive } from '../../utils/designSystem';

const ProcessingScreen = ({ navigation, route }) => {
  const { image, selectedStyle } = route.params || {};
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [animatedValue] = useState(new Animated.Value(0));

  const steps = [
    'Analyzing your photo...',
    'Applying AI enhancements...',
    'Generating professional styles...',
    'Optimizing image quality...',
    'Finalizing your headshots...',
  ];

  useEffect(() => {
    // Announce processing started to screen readers
    AccessibilityInfo.announceForAccessibility(ACCESSIBILITY.announcements.generationStarted);
    
    const generateMockResults = () => {
      // Mock generated images - in real app these would come from AI service
      return [
        { id: 1, uri: 'mock-result-1.jpg', style: selectedStyle },
        { id: 2, uri: 'mock-result-2.jpg', style: selectedStyle },
        { id: 3, uri: 'mock-result-3.jpg', style: selectedStyle },
        { id: 4, uri: 'mock-result-4.jpg', style: selectedStyle },
      ];
    };

    // Simulate processing steps
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 20;
        
        if (newProgress <= 100) {
          const newStep = Math.floor(newProgress / 20);
          setCurrentStep(newStep);
          
          // Announce step changes to screen readers
          if (newStep < steps.length) {
            AccessibilityInfo.announceForAccessibility(`Step ${newStep + 1}: ${steps[newStep]}`);
          }
          
          // Animate progress bar
          Animated.timing(animatedValue, {
            toValue: newProgress,
            duration: 300,
            useNativeDriver: false,
          }).start();
          
          return newProgress;
        } else {
          clearInterval(interval);
          // Announce completion
          AccessibilityInfo.announceForAccessibility(ACCESSIBILITY.announcements.generationComplete);
          
          // Navigate to results after processing is complete
          setTimeout(() => {
            navigation.navigate('ResultsGallery', {
              originalImage: image,
              selectedStyle,
              generatedImages: generateMockResults(),
            });
          }, 1000);
          return 100;
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [animatedValue, image, navigation, selectedStyle, steps]);



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text 
            style={styles.title}
            accessible={true}
            accessibilityRole="header"
          >
            Creating Your Headshots
          </Text>
          <Text 
            style={styles.subtitle}
            accessible={true}
            accessibilityRole="text"
          >
            Our AI is generating professional {selectedStyle} style photos for you
          </Text>
        </View>

        <View 
          style={styles.progressContainer}
          accessible={true}
          accessibilityRole={ACCESSIBILITY.roles.progressBar}
          accessibilityLabel={`Progress: ${progress} percent complete`}
          accessibilityValue={{ min: 0, max: 100, now: progress, text: `${progress} percent` }}
          accessibilityLiveRegion="polite"
          importantForAccessibility="yes"
        >
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: animatedValue.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        <View style={styles.stepsContainer}>
          <Text 
            style={styles.currentStepText}
            accessible={true}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            {currentStep < steps.length ? steps[currentStep] : 'Complete!'}
          </Text>
          
          <View 
            style={styles.stepsIndicator}
            accessible={true}
            accessibilityLabel={`Step ${currentStep + 1} of ${steps.length}`}
          >
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  index <= currentStep && styles.stepDotActive,
                ]}
                accessible={false}
              />
            ))}
          </View>
        </View>

        <LoadingSpinner
          visible={true}
          overlay={false}
          size="large"
          message="Processing your photo..."
          subMessage={`Step ${currentStep + 1} of ${steps.length}`}
          showProgress={true}
          progress={progress}
        />

        <View style={styles.estimatedTimeContainer}>
          <Text 
            style={styles.estimatedTimeText}
            accessible={true}
            accessibilityRole="text"
          >
            Estimated time remaining: {Math.max(0, 10 - Math.floor(progress / 10))}s
          </Text>
        </View>

        <InfoCard
          icon={<Text style={styles.tipIcon}>💡</Text>}
          title="Pro Tip"
          description="LinkedIn profiles with professional headshots get 14x more profile views! Your new photos will help you make a great first impression."
          style={styles.tipsContainer}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    flex: 1,
    padding: responsive.sp(SPACING.lg),
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: responsive.sp(SPACING.xxxl),
  },
  title: {
    fontSize: responsive.fs(TYPOGRAPHY.h1.fontSize),
    fontWeight: TYPOGRAPHY.h1.fontWeight,
    color: COLORS.text.primary,
    marginBottom: responsive.sp(SPACING.md),
    textAlign: 'center',
    letterSpacing: TYPOGRAPHY.h1.letterSpacing,
  },
  subtitle: {
    fontSize: responsive.fs(TYPOGRAPHY.body1.fontSize),
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.body1.lineHeight,
    maxWidth: responsive.wp(85),
  },
  progressContainer: {
    marginBottom: responsive.sp(SPACING.xl),
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.neutral[200],
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    marginBottom: responsive.sp(SPACING.md),
    ...SHADOWS.light,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
    borderRadius: RADIUS.sm,
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
  },
  progressText: {
    textAlign: 'center',
    fontSize: responsive.fs(TYPOGRAPHY.h4.fontSize),
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    color: COLORS.text.primary,
    letterSpacing: TYPOGRAPHY.h4.letterSpacing,
  },
  stepsContainer: {
    alignItems: 'center',
    marginBottom: responsive.sp(SPACING.xl),
  },
  currentStepText: {
    fontSize: responsive.fs(TYPOGRAPHY.h4.fontSize),
    color: COLORS.primary[500],
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    marginBottom: responsive.sp(SPACING.lg),
    textAlign: 'center',
    letterSpacing: TYPOGRAPHY.h4.letterSpacing,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.neutral[300],
    marginHorizontal: responsive.sp(SPACING.xs),
    ...Platform.select({
      android: {
        elevation: 1,
      },
    }),
  },
  stepDotActive: {
    backgroundColor: COLORS.primary[500],
    transform: [{ scale: 1.2 }],
  },
  estimatedTimeContainer: {
    alignItems: 'center',
    marginBottom: responsive.sp(SPACING.xl),
    marginTop: responsive.sp(SPACING.lg),
  },
  estimatedTimeText: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  tipsContainer: {
    marginTop: responsive.sp(SPACING.xl),
  },
  tipIcon: {
    fontSize: responsive.fs(24),
  },
});

export default ProcessingScreen;