/**
 * OmniShot Processing Screen
 * AI photo generation with platform-specific progress tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  BackHandler,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import DesignSystem from '../utils/omnishotDesignSystem';

const { width } = Dimensions.get('window');
const { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, PROFESSIONAL_STYLES } = DesignSystem;

const PROCESSING_STAGES = [
  { id: 'analyzing', name: 'Analyzing Photo', duration: 2000 },
  { id: 'styling', name: 'Applying Professional Style', duration: 3000 },
  { id: 'optimizing', name: 'Optimizing for Platforms', duration: 4000 },
  { id: 'finalizing', name: 'Final Quality Check', duration: 2000 },
];

const PLATFORM_NAMES = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

const ProcessingScreen = ({ route, navigation }) => {
  const { photo, selectedStyle, selectedPlatforms, customDimensions } = route.params || {};
  
  const [currentStage, setCurrentStage] = useState(0);
  const [currentPlatform, setCurrentPlatform] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [processingStartTime] = useState(Date.now());
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Prevent back navigation during processing
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isComplete) {
        Alert.alert(
          'Processing in Progress',
          'Your photo is still being generated. Do you want to cancel?',
          [
            { text: 'Continue Processing', style: 'default' },
            { 
              text: 'Cancel', 
              style: 'destructive',
              onPress: () => navigation.goBack() 
            },
          ]
        );
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isComplete, navigation]);

  useEffect(() => {
    // Start processing animation
    startProcessing();
  }, []);

  const startProcessing = () => {
    // Start rotating animation for the processing indicator
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Start pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Process through stages
    processStages();
  };

  const processStages = async () => {
    const totalStages = PROCESSING_STAGES.length;
    const totalPlatforms = selectedPlatforms.length;
    
    for (let stageIndex = 0; stageIndex < totalStages; stageIndex++) {
      setCurrentStage(stageIndex);
      const stage = PROCESSING_STAGES[stageIndex];
      
      if (stage.id === 'optimizing') {
        // Process each platform during optimization stage
        for (let platformIndex = 0; platformIndex < totalPlatforms; platformIndex++) {
          setCurrentPlatform(platformIndex);
          
          const progress = (stageIndex + (platformIndex / totalPlatforms)) / totalStages;
          animateProgress(progress);
          
          await new Promise(resolve => 
            setTimeout(resolve, stage.duration / totalPlatforms)
          );
        }
      } else {
        const progress = (stageIndex + 1) / totalStages;
        animateProgress(progress);
        await new Promise(resolve => setTimeout(resolve, stage.duration));
      }
    }
    
    completeProcessing();
  };

  const animateProgress = (progress) => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const completeProcessing = () => {
    setIsComplete(true);
    
    // Success animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Navigate to results after a brief delay
      setTimeout(() => {
        navigation.replace('ResultsScreen', {
          photo,
          selectedStyle,
          selectedPlatforms,
          customDimensions,
          processingTime: Date.now() - processingStartTime,
        });
      }, 1500);
    });
  };

  const getProcessingMessage = () => {
    if (isComplete) {
      return 'Processing Complete!';
    }
    
    const stage = PROCESSING_STAGES[currentStage];
    if (stage?.id === 'optimizing' && selectedPlatforms.length > 1) {
      return `${stage.name} for ${PLATFORM_NAMES[selectedPlatforms[currentPlatform]]}`;
    }
    
    return stage?.name || 'Processing...';
  };

  const getEstimatedTime = () => {
    const elapsedTime = Math.floor((Date.now() - processingStartTime) / 1000);
    const estimatedTotal = 15 + (selectedPlatforms.length * 3); // Base time + platform processing
    const remainingTime = Math.max(0, estimatedTotal - elapsedTime);
    
    if (isComplete) return 'Done!';
    return `${remainingTime}s remaining`;
  };

  const renderProcessingVisual = () => {
    const rotation = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View 
        style={[
          styles.processingVisual, 
          { 
            transform: [{ scale: pulseAnim }] 
          }
        ]}
      >
        <LinearGradient
          colors={[COLORS.secondary[400], COLORS.secondary[600]]}
          style={styles.processingCircle}
        >
          <Animated.View 
            style={[
              styles.processingSpinner,
              { transform: [{ rotate: rotation }] }
            ]}
          >
            <LinearGradient
              colors={[COLORS.primary[500], 'transparent']}
              style={styles.spinnerGradient}
            />
          </Animated.View>
          
          {photo?.uri && (
            <Image 
              source={{ uri: photo.uri }} 
              style={styles.processingImage}
            />
          )}
          
          {isComplete && (
            <Animated.View 
              style={[
                styles.successIndicator,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <Icon name="check" size={32} color={COLORS.text.inverse} />
            </Animated.View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderProgressBar = () => {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.progressText}>
          {Math.round((currentStage + 1) / PROCESSING_STAGES.length * 100)}%
        </Text>
      </View>
    );
  };

  const renderSelectedStyle = () => {
    const style = PROFESSIONAL_STYLES[selectedStyle];
    if (!style) return null;

    return (
      <View style={styles.styleInfo}>
        <View style={[styles.styleIndicator, { backgroundColor: style.color }]} />
        <Text style={styles.styleText}>{style.name} Style</Text>
      </View>
    );
  };

  const renderPlatformList = () => (
    <View style={styles.platformList}>
      <Text style={styles.platformListTitle}>
        Generating for {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}
      </Text>
      <View style={styles.platforms}>
        {selectedPlatforms.map((platformId, index) => (
          <View
            key={platformId}
            style={[
              styles.platformChip,
              index === currentPlatform && 
              currentStage === PROCESSING_STAGES.findIndex(s => s.id === 'optimizing') && 
              !isComplete && styles.activePlatformChip,
              index < currentPlatform && 
              currentStage >= PROCESSING_STAGES.findIndex(s => s.id === 'optimizing') &&
              styles.completedPlatformChip,
            ]}
          >
            <Text style={[
              styles.platformChipText,
              (index === currentPlatform && 
               currentStage === PROCESSING_STAGES.findIndex(s => s.id === 'optimizing') && 
               !isComplete) && styles.activePlatformChipText,
              (index < currentPlatform && 
               currentStage >= PROCESSING_STAGES.findIndex(s => s.id === 'optimizing')) &&
               styles.completedPlatformChipText,
            ]}>
              {PLATFORM_NAMES[platformId]}
            </Text>
            
            {index < currentPlatform && 
             currentStage >= PROCESSING_STAGES.findIndex(s => s.id === 'optimizing') && (
              <Icon name="check" size={12} color={COLORS.semantic.success} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderProcessingSteps = () => (
    <View style={styles.processingSteps}>
      {PROCESSING_STAGES.map((stage, index) => (
        <View key={stage.id} style={styles.stepItem}>
          <View style={[
            styles.stepIndicator,
            index < currentStage && styles.completedStep,
            index === currentStage && styles.activeStep,
          ]}>
            {index < currentStage ? (
              <Icon name="check" size={12} color={COLORS.text.inverse} />
            ) : (
              <Text style={styles.stepNumber}>{index + 1}</Text>
            )}
          </View>
          <Text style={[
            styles.stepText,
            index === currentStage && styles.activeStepText,
            index < currentStage && styles.completedStepText,
          ]}>
            {stage.name}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderProcessingVisual()}
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>{getProcessingMessage()}</Text>
          <Text style={styles.statusSubtitle}>{getEstimatedTime()}</Text>
          
          {renderProgressBar()}
          {renderSelectedStyle()}
        </View>
        
        {renderPlatformList()}
        {renderProcessingSteps()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Creating your professional photos with AI precision
          </Text>
        </View>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  
  processingVisual: {
    marginBottom: SPACING.xxxl,
  },
  
  processingCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.large,
  },
  
  processingSpinner: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -10,
    left: -10,
  },
  
  spinnerGradient: {
    flex: 1,
    borderRadius: 90,
  },
  
  processingImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background.secondary,
  },
  
  successIndicator: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  
  statusContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    width: '100%',
  },
  
  statusTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  
  statusSubtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary[500],
    borderRadius: 3,
  },
  
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  
  styleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  
  styleIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  
  styleText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  platformList: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  
  platformListTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  
  platforms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    gap: SPACING.xs,
  },
  
  activePlatformChip: {
    backgroundColor: COLORS.secondary[100],
    borderColor: COLORS.secondary[500],
  },
  
  completedPlatformChip: {
    backgroundColor: COLORS.semantic.success + '20',
    borderColor: COLORS.semantic.success,
  },
  
  platformChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  activePlatformChipText: {
    color: COLORS.secondary[700],
    fontWeight: '600',
  },
  
  completedPlatformChipText: {
    color: COLORS.semantic.success,
    fontWeight: '600',
  },
  
  processingSteps: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  
  activeStep: {
    backgroundColor: COLORS.secondary[500],
    borderColor: COLORS.secondary[500],
  },
  
  completedStep: {
    backgroundColor: COLORS.semantic.success,
    borderColor: COLORS.semantic.success,
  },
  
  stepNumber: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  
  stepText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    flex: 1,
  },
  
  activeStepText: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  
  completedStepText: {
    color: COLORS.semantic.success,
    fontWeight: '500',
  },
  
  footer: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    width: '100%',
  },
  
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
});

export default ProcessingScreen;