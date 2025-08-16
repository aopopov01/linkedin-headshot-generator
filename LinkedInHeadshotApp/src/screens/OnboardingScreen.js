/**
 * OmniShot Onboarding Screen
 * Multi-platform professional photo generator onboarding experience
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import DesignSystem from '../utils/omnishotDesignSystem';

const { width, height } = Dimensions.get('window');
const { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } = DesignSystem;

const ONBOARDING_SLIDES = [
  {
    id: 1,
    title: 'Every Platform.\nEvery Time.\nEvery You.',
    subtitle: 'Create professional photos optimized for LinkedIn, Instagram, Facebook, Twitter, and more',
    illustration: 'multi-platform',
    features: [
      'AI-powered professional photos',
      'Multi-platform optimization',
      'Studio-quality results',
    ],
  },
  {
    id: 2,
    title: 'Professional Styles\nfor Every Industry',
    subtitle: 'Choose from Executive, Creative, Tech, Healthcare, Finance, and Startup styles',
    illustration: 'professional-styles',
    features: [
      'Industry-specific styling',
      'Professional photo guidance',
      'Instant style previews',
    ],
  },
  {
    id: 3,
    title: 'Perfect for\nEvery Platform',
    subtitle: 'Get the right dimensions, lighting, and style for each social platform',
    illustration: 'platform-optimization',
    features: [
      'Platform-specific dimensions',
      'Optimized for engagement',
      'Compare across platforms',
    ],
  },
  {
    id: 4,
    title: 'Ready to Transform\nYour Professional Image?',
    subtitle: 'Join thousands of professionals who trust OmniShot for their career-defining photos',
    illustration: 'success-stories',
    features: [
      'Used by 50K+ professionals',
      'Proven to increase engagement',
      'Career-focused results',
    ],
    isLastSlide: true,
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      const nextSlide = currentSlide + 1;
      
      // Animate slide transition
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: nextSlide,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSlide(nextSlide);
        scrollViewRef.current?.scrollTo({
          x: nextSlide * width,
          animated: true,
        });
        
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    navigation.navigate('Home');
  };

  const handleGetStarted = () => {
    navigation.navigate('Home');
  };

  const handleSlideChange = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const renderSlideIndicators = () => {
    return (
      <View style={styles.indicatorContainer}>
        {ONBOARDING_SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentSlide === index && styles.activeIndicator,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderFeatureList = (features) => {
    return (
      <View style={styles.featureList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSlide = (slide) => {
    return (
      <View style={styles.slide}>
        {/* Illustration placeholder */}
        <View style={styles.illustrationContainer}>
          <View style={[styles.illustrationPlaceholder, { 
            backgroundColor: slide.id === 1 ? COLORS.primary[100] :
                            slide.id === 2 ? COLORS.secondary[100] :
                            slide.id === 3 ? COLORS.platform.linkedin + '20' :
                            COLORS.semantic.success + '20'
          }]}>
            <Text style={styles.illustrationText}>{slide.illustration}</Text>
          </View>
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          {renderFeatureList(slide.features)}
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityLabel="Skip onboarding"
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        
        <View style={styles.logo}>
          <Text style={styles.logoText}>OmniShot</Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleSlideChange}
        style={styles.slidesContainer}
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <View key={slide.id} style={[styles.slideWrapper, { width }]}>
            {renderSlide(slide)}
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {renderSlideIndicators()}
        
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          accessibilityLabel={
            currentSlide === ONBOARDING_SLIDES.length - 1 
              ? "Get started with OmniShot" 
              : "Continue to next slide"
          }
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[COLORS.secondary[500], COLORS.secondary[600]]}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentSlide === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    height: 56,
  },
  
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  
  skipText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  logo: {
    flex: 1,
    alignItems: 'center',
  },
  
  logoText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary[500],
    fontWeight: 'bold',
  },
  
  headerSpacer: {
    width: 80,
  },
  
  slidesContainer: {
    flex: 1,
  },
  
  slideWrapper: {
    flex: 1,
  },
  
  slide: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  
  illustrationContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  
  illustrationPlaceholder: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  illustrationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  content: {
    flex: 0.5,
    paddingBottom: SPACING.xxxl,
  },
  
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: TYPOGRAPHY.h1.fontSize * 1.2,
  },
  
  subtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  
  featureList: {
    paddingHorizontal: SPACING.lg,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary[500],
    marginRight: SPACING.md,
  },
  
  featureText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    flex: 1,
  },
  
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.md,
  },
  
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.neutral[300],
    marginHorizontal: 4,
  },
  
  activeIndicator: {
    backgroundColor: COLORS.secondary[500],
    width: 24,
  },
  
  nextButton: {
    borderRadius: RADIUS.md,
    ...SHADOWS.soft,
  },
  
  nextButtonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  
  nextButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
});

export default OnboardingScreen;