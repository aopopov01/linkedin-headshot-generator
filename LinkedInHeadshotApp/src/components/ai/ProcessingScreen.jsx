import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Platform,
  AccessibilityInfo,
  Alert,
} from 'react-native';
import LoadingSpinner from '../shared/LoadingSpinner';
import { InfoCard } from '../shared/Card';
import { PrimaryButton } from '../shared/Button';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ACCESSIBILITY, responsive } from '../../utils/designSystem';
import aiService from '../../services/aiService';

const ProcessingScreen = ({ navigation, route }) => {
  const { 
    predictionId, 
    originalImage, 
    styleTemplate, 
    prediction 
  } = route.params || {};
  
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [animatedValue] = useState(new Animated.Value(0));
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingError, setProcessingError] = useState(null);
  const [startTime] = useState(Date.now());

  const steps = [
    'Analyzing source image and face detection...',
    'Preparing dramatic transformation algorithms...',
    'Applying professional attire and styling...',
    'Adding studio lighting and premium background...',
    'Enhancing image quality with professional polish...',
    'Finalizing your dramatic transformation...',
  ];

  useEffect(() => {
    // Announce processing started to screen readers
    AccessibilityInfo.announceForAccessibility('Professional headshot generation started');
    
    if (!predictionId) {
      setProcessingError('Missing prediction ID. Please try again.');
      setIsProcessing(false);
      return;
    }

    processAIHeadshots();
  }, [predictionId]);

  const processAIHeadshots = async () => {
    try {
      setIsProcessing(true);
      setProcessingError(null);
      
      console.log('Starting AI processing for prediction:', predictionId);

      // Simulate progress updates while waiting for AI
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) {
            const newProgress = prev + Math.random() * 15;
            const newStep = Math.floor(newProgress / 20);
            setCurrentStep(Math.min(newStep, steps.length - 1));
            
            // Animate progress bar
            Animated.timing(animatedValue, {
              toValue: newProgress,
              duration: 500,
              useNativeDriver: false,
            }).start();
            
            return newProgress;
          }
          return prev;
        });
      }, 2000);

      // Wait for the AI prediction to complete
      const result = await aiService.waitForPrediction(predictionId, 180000, 3000);
      
      clearInterval(progressInterval);

      if (result.success) {
        console.log('AI processing completed successfully');
        
        // Final progress update
        setProgress(100);
        setCurrentStep(steps.length - 1);
        
        Animated.timing(animatedValue, {
          toValue: 100,
          duration: 500,
          useNativeDriver: false,
        }).start();

        // Announce completion
        AccessibilityInfo.announceForAccessibility('Professional headshots generated successfully');

        // Navigate to results
        setTimeout(() => {
          navigation.navigate('Result', {
            outputs: result.outputs,
            originalImage: originalImage,
            styleTemplate: styleTemplate,
            processingTime: result.processingTime,
            prediction: result.prediction
          });
        }, 1500);

      } else {
        console.error('AI processing failed:', result.error);
        setProcessingError(result.error || 'Processing failed');
        setIsProcessing(false);
        
        // Announce error
        AccessibilityInfo.announceForAccessibility('Processing failed. Please try again.');
      }

    } catch (error) {
      console.error('Processing error:', error);
      setProcessingError(error.message || 'An unexpected error occurred');
      setIsProcessing(false);
      
      AccessibilityInfo.announceForAccessibility('Processing failed due to an error');
    }
  };

  const handleRetry = () => {
    navigation.goBack();
  };

  const handleCancel = () => {
    if (predictionId) {
      aiService.cancelPrediction(predictionId).catch(console.warn);
    }
    navigation.navigate('Home');
  };

  // If there's an error, show error state
  if (processingError && !isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Processing Failed</Text>
          <Text style={styles.errorMessage}>{processingError}</Text>
          
          <View style={styles.errorActions}>
            <PrimaryButton
              title="Try Again"
              onPress={handleRetry}
              style={styles.errorButton}
            />
            <PrimaryButton
              title="Cancel"
              onPress={handleCancel}
              style={[styles.errorButton, { backgroundColor: COLORS.neutral[400] }]}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }



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
            Creating dramatic {styleTemplate || 'corporate'} transformation with professional attire, studio lighting, and premium backgrounds
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
  
  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsive.sp(SPACING.xl),
  },
  errorTitle: {
    fontSize: responsive.fs(TYPOGRAPHY.h2.fontSize),
    fontWeight: TYPOGRAPHY.h2.fontWeight,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: responsive.sp(SPACING.lg),
  },
  errorMessage: {
    fontSize: responsive.fs(TYPOGRAPHY.body1.fontSize),
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: responsive.sp(SPACING.xl),
    lineHeight: TYPOGRAPHY.body1.lineHeight,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  errorButton: {
    flex: 1,
    marginHorizontal: responsive.sp(SPACING.sm),
  },
});

export default ProcessingScreen;