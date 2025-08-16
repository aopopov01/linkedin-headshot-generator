/**
 * OmniShot Premium Screen
 * Premium features showcase and subscription management
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import DesignSystem from '../utils/omnishotDesignSystem';

const { width } = Dimensions.get('window');
const { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } = DesignSystem;

const PREMIUM_FEATURES = [
  {
    icon: 'zap',
    title: 'Unlimited Generations',
    description: 'Generate professional photos for all platforms without limits',
    included: 'free',
    highlight: false,
  },
  {
    icon: 'layers',
    title: 'All Professional Styles',
    description: 'Access Executive, Creative, Tech, Healthcare, Finance & Startup styles',
    included: 'premium',
    highlight: true,
  },
  {
    icon: 'grid',
    title: 'Custom Dimensions',
    description: 'Create photos with any custom size for specialized use cases',
    included: 'premium',
    highlight: false,
  },
  {
    icon: 'download-cloud',
    title: 'High-Resolution Downloads',
    description: 'Download photos in 4K resolution for print and professional use',
    included: 'premium',
    highlight: true,
  },
  {
    icon: 'image',
    title: 'Background Removal',
    description: 'Professional background removal and replacement options',
    included: 'premium',
    highlight: false,
  },
  {
    icon: 'users',
    title: 'Team Management',
    description: 'Manage photos for your entire team with shared workspaces',
    included: 'premium',
    highlight: false,
  },
  {
    icon: 'trending-up',
    title: 'Analytics Dashboard',
    description: 'Track engagement and performance across all platforms',
    included: 'premium',
    highlight: true,
  },
  {
    icon: 'headphones',
    title: 'Priority Support',
    description: '24/7 premium support with dedicated account manager',
    included: 'premium',
    highlight: false,
  },
];

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 19.99,
    period: 'month',
    description: 'Perfect for getting started',
    popular: false,
    savings: null,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 149.99,
    period: 'year',
    description: 'Best value for professionals',
    popular: true,
    savings: '37% off',
    monthlyEquivalent: 12.50,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 399.99,
    period: 'lifetime',
    description: 'One-time payment, lifetime access',
    popular: false,
    savings: '83% off',
  },
];

const PremiumScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true);
      
      // Simulate subscription process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Welcome to Premium!',
        'Your subscription has been activated. Enjoy unlimited access to all professional features.',
        [
          {
            text: 'Start Creating',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Subscription Failed', 'Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Close premium screen"
        accessibilityRole="button"
      >
        <Icon name="x" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
      
      <LinearGradient
        colors={[COLORS.secondary[500], COLORS.primary[500]]}
        style={styles.premiumBadge}
      >
        <Icon name="star" size={20} color={COLORS.text.inverse} />
        <Text style={styles.premiumBadgeText}>Premium</Text>
      </LinearGradient>
    </View>
  );

  const renderHero = () => (
    <Animated.View 
      style={[
        styles.hero,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.heroTitle}>
        Unlock Your{'\n'}Professional Potential
      </Text>
      <Text style={styles.heroSubtitle}>
        Join 50,000+ professionals who trust OmniShot Premium for their career-defining photos
      </Text>
      
      {/* Hero visual */}
      <View style={styles.heroVisual}>
        <LinearGradient
          colors={[COLORS.secondary[400], COLORS.secondary[600]]}
          style={styles.heroCircle}
        >
          <Icon name="camera" size={32} color={COLORS.text.inverse} />
        </LinearGradient>
        
        {/* Floating elements */}
        {['linkedin', 'instagram', 'twitter', 'facebook'].map((platform, index) => (
          <Animated.View
            key={platform}
            style={[
              styles.floatingElement,
              {
                transform: [
                  { rotate: `${index * 90}deg` },
                  { translateX: 60 },
                  { rotate: `-${index * 90}deg` },
                ],
              },
            ]}
          >
            <View style={[
              styles.platformDot,
              { backgroundColor: COLORS.platform[platform] || COLORS.neutral[400] }
            ]} />
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderFeaturesList = () => (
    <View style={styles.featuresSection}>
      <Text style={styles.sectionTitle}>Premium Features</Text>
      
      {PREMIUM_FEATURES.map((feature, index) => (
        <Animated.View
          key={feature.title}
          style={[
            styles.featureItem,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
            feature.highlight && styles.highlightFeature,
          ]}
        >
          <View style={[
            styles.featureIcon,
            feature.included === 'premium' && styles.premiumFeatureIcon,
          ]}>
            <Icon 
              name={feature.icon} 
              size={20} 
              color={feature.included === 'premium' ? COLORS.text.inverse : COLORS.secondary[500]} 
            />
          </View>
          
          <View style={styles.featureContent}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              {feature.included === 'premium' && (
                <View style={styles.premiumTag}>
                  <Text style={styles.premiumTagText}>PRO</Text>
                </View>
              )}
              {feature.highlight && (
                <Icon name="star" size={14} color={COLORS.secondary[500]} />
              )}
            </View>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderPricingPlans = () => (
    <View style={styles.pricingSection}>
      <Text style={styles.sectionTitle}>Choose Your Plan</Text>
      <Text style={styles.sectionSubtitle}>
        All plans include a 7-day free trial
      </Text>
      
      <View style={styles.plansContainer}>
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Animated.View
            key={plan.id}
            style={{ transform: [{ scale: selectedPlan === plan.id ? scaleAnim : 1 }] }}
          >
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlanCard,
                plan.popular && styles.popularPlan,
              ]}
              onPress={() => handlePlanSelect(plan.id)}
              accessibilityLabel={`Select ${plan.name} plan`}
              accessibilityRole="button"
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}
              
              {plan.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsBadgeText}>{plan.savings}</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>
              
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>
                  ${plan.price}
                </Text>
                <Text style={styles.planPeriod}>
                  /{plan.period === 'lifetime' ? 'once' : plan.period}
                </Text>
              </View>
              
              {plan.monthlyEquivalent && (
                <Text style={styles.monthlyEquivalent}>
                  ${plan.monthlyEquivalent}/month when billed yearly
                </Text>
              )}
              
              <View style={[
                styles.planSelector,
                selectedPlan === plan.id && styles.selectedPlanSelector,
              ]}>
                {selectedPlan === plan.id && (
                  <Icon name="check" size={16} color={COLORS.text.inverse} />
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const renderSubscribeButton = () => (
    <View style={styles.subscribeContainer}>
      <TouchableOpacity
        style={[
          styles.subscribeButton,
          isSubscribing && styles.subscribingButton,
        ]}
        onPress={handleSubscribe}
        disabled={isSubscribing}
        accessibilityLabel="Subscribe to premium"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={
            isSubscribing
              ? [COLORS.neutral[400], COLORS.neutral[500]]
              : [COLORS.secondary[500], COLORS.secondary[600]]
          }
          style={styles.subscribeButtonGradient}
        >
          {isSubscribing ? (
            <Text style={styles.subscribeButtonText}>Subscribing...</Text>
          ) : (
            <>
              <Text style={styles.subscribeButtonText}>
                Start 7-Day Free Trial
              </Text>
              <Icon name="arrow-right" size={20} color={COLORS.text.inverse} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <Text style={styles.subscribeDisclaimer}>
        Cancel anytime. No commitment required.
      </Text>
      
      <View style={styles.trustIndicators}>
        <View style={styles.trustItem}>
          <Icon name="shield" size={16} color={COLORS.semantic.success} />
          <Text style={styles.trustText}>Secure Payment</Text>
        </View>
        <View style={styles.trustItem}>
          <Icon name="refresh-cw" size={16} color={COLORS.semantic.success} />
          <Text style={styles.trustText}>Cancel Anytime</Text>
        </View>
        <View style={styles.trustItem}>
          <Icon name="users" size={16} color={COLORS.semantic.success} />
          <Text style={styles.trustText}>50K+ Users</Text>
        </View>
      </View>
    </View>
  );

  const renderTestimonials = () => (
    <View style={styles.testimonialsSection}>
      <Text style={styles.sectionTitle}>Loved by Professionals</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.testimonialsContainer}
      >
        {[
          {
            name: 'Sarah Chen',
            role: 'Marketing Director',
            company: 'TechCorp',
            text: 'OmniShot Premium transformed my LinkedIn presence. Got 3x more profile views!',
            rating: 5,
          },
          {
            name: 'Michael Rodriguez',
            role: 'CEO',
            company: 'StartupX',
            text: 'The team management feature is perfect for our growing startup. Highly recommended.',
            rating: 5,
          },
          {
            name: 'Dr. Emily Watson',
            role: 'Healthcare Professional',
            company: 'City Hospital',
            text: 'Professional quality photos that help me connect with patients on social media.',
            rating: 5,
          },
        ].map((testimonial, index) => (
          <View key={index} style={styles.testimonialCard}>
            <View style={styles.testimonialRating}>
              {[...Array(testimonial.rating)].map((_, i) => (
                <Icon key={i} name="star" size={12} color={COLORS.secondary[500]} />
              ))}
            </View>
            <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
            <View style={styles.testimonialAuthor}>
              <Text style={styles.testimonialName}>{testimonial.name}</Text>
              <Text style={styles.testimonialRole}>
                {testimonial.role} at {testimonial.company}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHero()}
        {renderFeaturesList()}
        {renderPricingPlans()}
        {renderTestimonials()}
      </ScrollView>
      
      {renderSubscribeButton()}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.subtle,
  },
  
  closeButton: {
    padding: SPACING.sm,
  },
  
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  
  premiumBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  
  hero: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxxl,
  },
  
  heroTitle: {
    ...TYPOGRAPHY.display,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  
  heroSubtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.md,
  },
  
  heroVisual: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  heroCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
  },
  
  floatingElement: {
    position: 'absolute',
  },
  
  platformDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    ...SHADOWS.soft,
  },
  
  featuresSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  
  sectionSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.soft,
  },
  
  highlightFeature: {
    borderWidth: 2,
    borderColor: COLORS.secondary[300],
    ...SHADOWS.medium,
  },
  
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  
  premiumFeatureIcon: {
    backgroundColor: COLORS.secondary[500],
  },
  
  featureContent: {
    flex: 1,
  },
  
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  
  featureTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  
  premiumTag: {
    backgroundColor: COLORS.semantic.processing,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  
  premiumTagText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
    fontSize: 9,
  },
  
  featureDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.body2.lineHeight,
  },
  
  pricingSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  
  plansContainer: {
    gap: SPACING.md,
  },
  
  planCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    position: 'relative',
    ...SHADOWS.soft,
  },
  
  selectedPlanCard: {
    borderColor: COLORS.secondary[500],
    ...SHADOWS.medium,
  },
  
  popularPlan: {
    borderColor: COLORS.semantic.processing,
  },
  
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: COLORS.semantic.processing,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    ...SHADOWS.soft,
  },
  
  popularBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  
  savingsBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.semantic.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  
  savingsBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
    fontSize: 10,
  },
  
  planHeader: {
    marginBottom: SPACING.md,
  },
  
  planName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  planDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
  },
  
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  
  planPrice: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  
  planPeriod: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },
  
  monthlyEquivalent: {
    ...TYPOGRAPHY.caption,
    color: COLORS.semantic.success,
    fontWeight: '500',
    marginBottom: SPACING.md,
  },
  
  planSelector: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.primary,
  },
  
  selectedPlanSelector: {
    backgroundColor: COLORS.secondary[500],
    borderColor: COLORS.secondary[500],
  },
  
  testimonialsSection: {
    paddingBottom: SPACING.xxxl,
  },
  
  testimonialsContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  
  testimonialCard: {
    width: width * 0.8,
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.soft,
  },
  
  testimonialRating: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: 2,
  },
  
  testimonialText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  
  testimonialAuthor: {},
  
  testimonialName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  
  testimonialRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  
  subscribeContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.large,
  },
  
  subscribeButton: {
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  
  subscribingButton: {
    opacity: 0.7,
  },
  
  subscribeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    minHeight: 56,
  },
  
  subscribeButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.inverse,
    fontWeight: '600',
    fontSize: 18,
  },
  
  subscribeDisclaimer: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  trustText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
});

export default PremiumScreen;