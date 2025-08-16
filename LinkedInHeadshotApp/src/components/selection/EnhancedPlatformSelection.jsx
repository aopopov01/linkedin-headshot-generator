/**
 * Enhanced Platform Selection Interface
 * Addresses critical UX issues: Information overload, selection confusion, limited context
 * Implements smart recommendations and progressive disclosure
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/branding';

const EnhancedPlatformSelection = ({
  selectedImage,
  selectedPlatforms = [],
  onPlatformToggle,
  onContinue,
  onBack,
  platformOptions = [],
}) => {
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Smart recommendations based on professional use cases
  const platformRecommendations = [
    {
      id: 'professional',
      title: 'Professional Networking',
      description: 'Perfect for career-focused professionals',
      platforms: ['linkedin', 'github'],
      icon: '💼',
      popular: true,
    },
    {
      id: 'complete',
      title: 'Complete Social Presence',
      description: 'All major platforms for maximum reach',
      platforms: ['linkedin', 'instagram', 'facebook', 'twitter'],
      icon: '🌟',
      popular: true,
    },
    {
      id: 'content_creator',
      title: 'Content Creator',
      description: 'Optimized for video and content platforms',
      platforms: ['youtube', 'tiktok', 'instagram', 'twitter'],
      icon: '🎥',
    },
    {
      id: 'business',
      title: 'Business Professional',
      description: 'Corporate and business-focused platforms',
      platforms: ['linkedin', 'whatsapp_business', 'facebook'],
      icon: '🏢',
    },
  ];

  // Get platform details with enhanced information
  const getPlatformDetails = (platformId) => {
    const platform = platformOptions.find(p => p.id === platformId);
    if (!platform) return null;

    const enhancedDetails = {
      linkedin: {
        tip: 'Most important for professional networking',
        audience: 'Professionals, recruiters, colleagues',
        priority: 'high',
      },
      instagram: {
        tip: 'Great for personal branding and engagement',
        audience: 'General public, younger demographics',
        priority: 'medium',
      },
      facebook: {
        tip: 'Wide reach across all age groups',
        audience: 'General public, family, friends',
        priority: 'medium',
      },
      twitter: {
        tip: 'Perfect for thought leadership',
        audience: 'Industry professionals, media',
        priority: 'medium',
      },
      youtube: {
        tip: 'Essential for video content creators',
        audience: 'Content consumers, subscribers',
        priority: 'medium',
      },
      tiktok: {
        tip: 'High engagement with younger audience',
        audience: 'Gen Z, content creators',
        priority: 'low',
      },
      whatsapp_business: {
        tip: 'Professional business communication',
        audience: 'Business contacts, customers',
        priority: 'medium',
      },
      github: {
        tip: 'Must-have for developers',
        audience: 'Developers, tech recruiters',
        priority: 'high',
      },
    };

    return {
      ...platform,
      ...enhancedDetails[platformId],
    };
  };

  // Handle recommendation selection
  const handleRecommendationSelect = (recommendation) => {
    setSelectedRecommendation(recommendation.id);
    
    // Clear existing selections
    selectedPlatforms.forEach(platformId => {
      onPlatformToggle(platformId);
    });

    // Add recommended platforms
    recommendation.platforms.forEach(platformId => {
      if (!selectedPlatforms.includes(platformId)) {
        onPlatformToggle(platformId);
      }
    });
  };

  // Get visible platforms (progressive disclosure)
  const getVisiblePlatforms = () => {
    if (showAllPlatforms) {
      return platformOptions.map(p => getPlatformDetails(p.id)).filter(Boolean);
    }

    // Show high priority platforms first
    const priorityOrder = ['high', 'medium', 'low'];
    const sortedPlatforms = platformOptions
      .map(p => getPlatformDetails(p.id))
      .filter(Boolean)
      .sort((a, b) => {
        const aPriority = priorityOrder.indexOf(a.priority || 'low');
        const bPriority = priorityOrder.indexOf(b.priority || 'low');
        return aPriority - bPriority;
      });

    return sortedPlatforms.slice(0, 4); // Show top 4 initially
  };

  const visiblePlatforms = getVisiblePlatforms();
  const hasMorePlatforms = platformOptions.length > 4 && !showAllPlatforms;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Platforms</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Preview */}
        <View style={styles.imagePreview}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          )}
          <Text style={styles.previewText}>Select platforms to optimize for</Text>
          <Text style={styles.selectionCount}>
            {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} selected
          </Text>
        </View>

        {/* Smart Recommendations */}
        <Animated.View style={[styles.recommendationsSection, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>🎯 Smart Recommendations</Text>
          <Text style={styles.sectionSubtitle}>Popular combinations for professionals</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendationsScroll}>
            {platformRecommendations.map((recommendation) => (
              <TouchableOpacity
                key={recommendation.id}
                style={[
                  styles.recommendationCard,
                  selectedRecommendation === recommendation.id && styles.recommendationCardSelected,
                  recommendation.popular && styles.recommendationCardPopular,
                ]}
                onPress={() => handleRecommendationSelect(recommendation)}
              >
                {recommendation.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Popular</Text>
                  </View>
                )}
                
                <Text style={styles.recommendationIcon}>{recommendation.icon}</Text>
                <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
                <Text style={styles.recommendationDescription}>{recommendation.description}</Text>
                
                <View style={styles.recommendationPlatforms}>
                  {recommendation.platforms.slice(0, 3).map((platformId) => {
                    const platform = getPlatformDetails(platformId);
                    return platform ? (
                      <Text key={platformId} style={styles.recommendationPlatformIcon}>
                        {platform.icon}
                      </Text>
                    ) : null;
                  })}
                  {recommendation.platforms.length > 3 && (
                    <Text style={styles.recommendationMore}>+{recommendation.platforms.length - 3}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Individual Platform Selection */}
        <View style={styles.platformsSection}>
          <Text style={styles.sectionTitle}>📱 Individual Platforms</Text>
          <Text style={styles.sectionSubtitle}>Or choose specific platforms</Text>

          <View style={styles.platformGrid}>
            {visiblePlatforms.map((platform) => (
              <TouchableOpacity
                key={platform.id}
                style={[
                  styles.platformCard,
                  selectedPlatforms.includes(platform.id) && styles.platformCardSelected,
                  platform.priority === 'high' && styles.platformCardHighPriority,
                ]}
                onPress={() => onPlatformToggle(platform.id)}
              >
                {platform.priority === 'high' && (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityBadgeText}>Recommended</Text>
                  </View>
                )}

                <View style={styles.platformCardHeader}>
                  <Text style={styles.platformIcon}>{platform.icon}</Text>
                  {selectedPlatforms.includes(platform.id) && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </View>

                <Text style={[
                  styles.platformName,
                  selectedPlatforms.includes(platform.id) && styles.platformNameSelected
                ]}>
                  {platform.name}
                </Text>

                <Text style={styles.platformDimensions}>{platform.dimensions}</Text>
                
                {platform.tip && (
                  <Text style={styles.platformTip}>{platform.tip}</Text>
                )}

                <View style={styles.platformAudience}>
                  <Text style={styles.platformAudienceLabel}>Audience:</Text>
                  <Text style={styles.platformAudienceText}>{platform.audience}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Show More Platforms Button */}
          {hasMorePlatforms && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowAllPlatforms(true)}
            >
              <Text style={styles.showMoreText}>
                Show {platformOptions.length - 4} More Platforms
              </Text>
              <Text style={styles.showMoreIcon}>▼</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selection Summary */}
        {selectedPlatforms.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Selection Summary</Text>
            <View style={styles.summaryPlatforms}>
              {selectedPlatforms.map((platformId) => {
                const platform = getPlatformDetails(platformId);
                return platform ? (
                  <View key={platformId} style={styles.summaryPlatform}>
                    <Text style={styles.summaryPlatformIcon}>{platform.icon}</Text>
                    <Text style={styles.summaryPlatformName}>{platform.name}</Text>
                  </View>
                ) : null;
              })}
            </View>
            
            <View style={styles.summaryStats}>
              <Text style={styles.summaryStatsText}>
                Estimated processing time: {Math.max(1, selectedPlatforms.length * 0.5).toFixed(1)} minutes
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedPlatforms.length === 0 && styles.continueButtonDisabled
          ]}
          onPress={onContinue}
          disabled={selectedPlatforms.length === 0}
        >
          <Text style={[
            styles.continueButtonText,
            selectedPlatforms.length === 0 && styles.continueButtonTextDisabled
          ]}>
            Continue with {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}
            {selectedPlatforms.length > 0 && ' →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.PADDING_SCREEN,
    paddingVertical: SPACING.MD,
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  backButton: {
    padding: SPACING.SM,
  },
  backButtonText: {
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
  },
  imagePreview: {
    alignItems: 'center',
    paddingVertical: SPACING.LG,
    backgroundColor: BRAND_COLORS.GRAY_50,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: SPACING.MD,
    borderWidth: 2,
    borderColor: BRAND_COLORS.SECONDARY,
  },
  previewText: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: BRAND_COLORS.GRAY_600,
    marginBottom: SPACING.XS,
  },
  selectionCount: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },
  recommendationsSection: {
    paddingVertical: SPACING.LG,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.PRIMARY,
    paddingHorizontal: SPACING.PADDING_SCREEN,
    marginBottom: SPACING.XS,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_600,
    paddingHorizontal: SPACING.PADDING_SCREEN,
    marginBottom: SPACING.MD,
  },
  recommendationsScroll: {
    paddingLeft: SPACING.PADDING_SCREEN,
  },
  recommendationCard: {
    backgroundColor: BRAND_COLORS.WHITE,
    borderWidth: 2,
    borderColor: BRAND_COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginRight: SPACING.MD,
    width: 180,
    position: 'relative',
  },
  recommendationCardSelected: {
    borderColor: BRAND_COLORS.SECONDARY,
    backgroundColor: BRAND_COLORS.SECONDARY + '10',
  },
  recommendationCardPopular: {
    borderColor: BRAND_COLORS.PRIMARY,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: BRAND_COLORS.PRIMARY,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 2,
    borderTopRightRadius: BORDER_RADIUS.LG,
    borderBottomLeftRadius: BORDER_RADIUS.SM,
  },
  popularBadgeText: {
    fontSize: 10,
    color: BRAND_COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  recommendationIcon: {
    fontSize: 24,
    marginBottom: SPACING.SM,
  },
  recommendationTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  recommendationDescription: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_600,
    marginBottom: SPACING.MD,
    lineHeight: 16,
  },
  recommendationPlatforms: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationPlatformIcon: {
    fontSize: 16,
    marginRight: SPACING.XS,
  },
  recommendationMore: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_500,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  platformsSection: {
    paddingVertical: SPACING.LG,
  },
  platformGrid: {
    paddingHorizontal: SPACING.PADDING_SCREEN,
    gap: SPACING.MD,
  },
  platformCard: {
    backgroundColor: BRAND_COLORS.WHITE,
    borderWidth: 2,
    borderColor: BRAND_COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    position: 'relative',
  },
  platformCardSelected: {
    borderColor: BRAND_COLORS.SECONDARY,
    backgroundColor: BRAND_COLORS.SECONDARY + '10',
  },
  platformCardHighPriority: {
    borderColor: BRAND_COLORS.PRIMARY + '40',
  },
  priorityBadge: {
    position: 'absolute',
    top: SPACING.SM,
    right: SPACING.SM,
    backgroundColor: BRAND_COLORS.PRIMARY,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.SM,
  },
  priorityBadgeText: {
    fontSize: 10,
    color: BRAND_COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  platformCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  platformIcon: {
    fontSize: 28,
  },
  selectedIndicator: {
    backgroundColor: BRAND_COLORS.SECONDARY,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: BRAND_COLORS.WHITE,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  platformName: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  platformNameSelected: {
    color: BRAND_COLORS.SECONDARY,
  },
  platformDimensions: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_500,
    marginBottom: SPACING.SM,
  },
  platformTip: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
    marginBottom: SPACING.SM,
    fontStyle: 'italic',
  },
  platformAudience: {
    marginTop: SPACING.SM,
  },
  platformAudienceLabel: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  platformAudienceText: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_500,
    lineHeight: 16,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    marginHorizontal: SPACING.PADDING_SCREEN,
    marginTop: SPACING.MD,
    backgroundColor: BRAND_COLORS.GRAY_50,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: BRAND_COLORS.GRAY_200,
  },
  showMoreText: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: BRAND_COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
    marginRight: SPACING.SM,
  },
  showMoreIcon: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_500,
  },
  summarySection: {
    margin: SPACING.PADDING_SCREEN,
    backgroundColor: BRAND_COLORS.GRAY_50,
    padding: SPACING.LG,
    borderRadius: BORDER_RADIUS.LG,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.MD,
  },
  summaryPlatforms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  summaryPlatform: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.WHITE,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  summaryPlatformIcon: {
    fontSize: 16,
    marginRight: SPACING.XS,
  },
  summaryPlatformName: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  summaryStats: {
    alignItems: 'center',
  },
  summaryStatsText: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_600,
    fontStyle: 'italic',
  },
  footer: {
    padding: SPACING.PADDING_SCREEN,
    backgroundColor: BRAND_COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.GRAY_200,
  },
  continueButton: {
    backgroundColor: BRAND_COLORS.SECONDARY,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: BRAND_COLORS.GRAY_200,
  },
  continueButtonText: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.WHITE,
  },
  continueButtonTextDisabled: {
    color: BRAND_COLORS.GRAY_500,
  },
});

export default EnhancedPlatformSelection;