/**
 * OmniShot Platform Selection Screen
 * Multi-platform selector with dimension previews and optimization info
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Switch,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import DesignSystem from '../utils/omnishotDesignSystem';

const { width } = Dimensions.get('window');
const { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, PLATFORM_DIMENSIONS } = DesignSystem;

const PLATFORM_OPTIONS = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional networking',
    color: COLORS.platform.linkedin,
    icon: 'linkedin',
    popular: true,
    dimensions: PLATFORM_DIMENSIONS.linkedin.profile,
    features: ['Profile optimization', 'Recruiter visibility', 'Professional network'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Visual storytelling',
    color: COLORS.platform.instagram,
    icon: 'instagram',
    popular: true,
    dimensions: PLATFORM_DIMENSIONS.instagram.profile,
    features: ['Visual appeal', 'Story highlights', 'Personal branding'],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Social connection',
    color: COLORS.platform.facebook,
    icon: 'facebook',
    popular: false,
    dimensions: PLATFORM_DIMENSIONS.facebook.profile,
    features: ['Personal network', 'Business pages', 'Social presence'],
  },
  {
    id: 'twitter',
    name: 'Twitter',
    description: 'Professional discourse',
    color: COLORS.platform.twitter,
    icon: 'twitter',
    popular: true,
    dimensions: PLATFORM_DIMENSIONS.twitter.profile,
    features: ['Thought leadership', 'Industry discussions', 'Public presence'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Creative expression',
    color: COLORS.platform.tiktok,
    icon: 'music',
    popular: false,
    dimensions: PLATFORM_DIMENSIONS.tiktok.profile,
    features: ['Creative content', 'Young audience', 'Viral potential'],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Video content',
    color: COLORS.platform.youtube,
    icon: 'youtube',
    popular: false,
    dimensions: PLATFORM_DIMENSIONS.youtube.profile,
    features: ['Video content', 'Channel branding', 'Educational reach'],
  },
];

const PlatformSelectionScreen = ({ route, navigation }) => {
  const { photo, selectedStyle } = route.params || {};
  const [selectedPlatforms, setSelectedPlatforms] = useState(['linkedin']);
  const [showCustomDimensions, setShowCustomDimensions] = useState(false);
  const [customDimensions, setCustomDimensions] = useState({ width: 1000, height: 1000 });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        // Don't allow deselecting if it's the only selected platform
        if (prev.length === 1) {
          Alert.alert(
            'Select at least one platform',
            'You need to select at least one platform to generate your photo.',
            [{ text: 'OK' }]
          );
          return prev;
        }
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });

    // Animate selection
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

  const handleContinue = () => {
    navigation.navigate('ProcessingScreen', {
      photo,
      selectedStyle,
      selectedPlatforms,
      customDimensions: showCustomDimensions ? customDimensions : null,
    });
  };

  const handleSelectAll = () => {
    const allPlatformIds = PLATFORM_OPTIONS.map(p => p.id);
    setSelectedPlatforms(allPlatformIds);
  };

  const handleSelectPopular = () => {
    const popularPlatformIds = PLATFORM_OPTIONS
      .filter(p => p.popular)
      .map(p => p.id);
    setSelectedPlatforms(popularPlatformIds);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
      
      <View style={styles.headerTitle}>
        <Text style={styles.headerTitleText}>Choose Platforms</Text>
        <Text style={styles.headerSubtitle}>Select where you'll use your professional photos</Text>
      </View>
      
      <TouchableOpacity
        style={styles.viewToggleButton}
        onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        accessibilityLabel={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
        accessibilityRole="button"
      >
        <Icon name={viewMode === 'grid' ? 'list' : 'grid'} size={20} color={COLORS.text.secondary} />
      </TouchableOpacity>
    </View>
  );

  const renderQuickSelect = () => (
    <View style={styles.quickSelect}>
      <Text style={styles.quickSelectTitle}>Quick Select</Text>
      <View style={styles.quickSelectButtons}>
        <TouchableOpacity
          style={styles.quickSelectButton}
          onPress={handleSelectPopular}
          accessibilityLabel="Select popular platforms"
          accessibilityRole="button"
        >
          <Text style={styles.quickSelectButtonText}>Popular</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickSelectButton}
          onPress={handleSelectAll}
          accessibilityLabel="Select all platforms"
          accessibilityRole="button"
        >
          <Text style={styles.quickSelectButtonText}>All Platforms</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDimensionPreview = (dimensions) => (
    <View style={styles.dimensionPreview}>
      <View
        style={[
          styles.dimensionBox,
          {
            aspectRatio: dimensions.width / dimensions.height,
            backgroundColor: COLORS.background.tertiary,
          },
        ]}
      />
      <Text style={styles.dimensionText}>{dimensions.aspectRatio}</Text>
      <Text style={styles.dimensionSize}>
        {dimensions.width} × {dimensions.height}
      </Text>
    </View>
  );

  const renderPlatformCard = ({ item: platform }) => {
    const isSelected = selectedPlatforms.includes(platform.id);
    
    return (
      <Animated.View style={{ transform: [{ scale: isSelected ? scaleAnim : 1 }] }}>
        <TouchableOpacity
          style={[
            styles.platformCard,
            isSelected && styles.selectedPlatformCard,
            { borderColor: platform.color },
            viewMode === 'list' && styles.listPlatformCard,
          ]}
          onPress={() => handlePlatformToggle(platform.id)}
          accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${platform.name}`}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
        >
          {/* Platform header */}
          <View style={[styles.platformHeader, viewMode === 'list' && styles.listPlatformHeader]}>
            <View style={styles.platformInfo}>
              <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                <View style={[styles.platformIconDot, { backgroundColor: platform.color }]} />
                {platform.popular && (
                  <View style={styles.popularBadge}>
                    <Icon name="star" size={8} color={COLORS.text.inverse} />
                  </View>
                )}
              </View>
              
              <View style={styles.platformNameContainer}>
                <Text style={styles.platformName}>{platform.name}</Text>
                <Text style={styles.platformDescription}>{platform.description}</Text>
              </View>
            </View>
            
            <View style={styles.selectionIndicator}>
              <View style={[
                styles.checkbox,
                isSelected && { backgroundColor: platform.color },
              ]}>
                {isSelected && (
                  <Icon name="check" size={14} color={COLORS.text.inverse} />
                )}
              </View>
            </View>
          </View>

          {/* Dimension preview - only show in grid mode */}
          {viewMode === 'grid' && (
            <View style={styles.platformContent}>
              {renderDimensionPreview(platform.dimensions)}
              
              {/* Features */}
              <View style={styles.platformFeatures}>
                {platform.features.slice(0, 2).map((feature, index) => (
                  <View key={index} style={styles.featureTag}>
                    <Text style={styles.featureTagText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* List mode content */}
          {viewMode === 'list' && (
            <View style={styles.listContent}>
              <Text style={styles.listDimensionText}>
                {platform.dimensions.aspectRatio} • {platform.dimensions.width}×{platform.dimensions.height}
              </Text>
              <View style={styles.listFeatures}>
                {platform.features.map((feature, index) => (
                  <Text key={index} style={styles.listFeatureText}>• {feature}</Text>
                ))}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCustomDimensions = () => (
    <View style={styles.customDimensions}>
      <View style={styles.customDimensionsHeader}>
        <Text style={styles.customDimensionsTitle}>Custom Dimensions</Text>
        <Switch
          value={showCustomDimensions}
          onValueChange={setShowCustomDimensions}
          trackColor={{ false: COLORS.neutral[300], true: COLORS.secondary[400] }}
          thumbColor={showCustomDimensions ? COLORS.secondary[500] : COLORS.neutral[500]}
          accessibilityLabel="Toggle custom dimensions"
        />
      </View>
      
      {showCustomDimensions && (
        <View style={styles.customDimensionsInputs}>
          <Text style={styles.customDimensionsNote}>
            Add custom dimensions for specialized use cases
          </Text>
          {/* Custom dimension inputs would go here */}
        </View>
      )}
    </View>
  );

  const renderSelectedSummary = () => (
    <View style={styles.selectedSummary}>
      <Text style={styles.summaryTitle}>
        {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''} Selected
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.selectedPlatformsList}>
          {selectedPlatforms.map((platformId) => {
            const platform = PLATFORM_OPTIONS.find(p => p.id === platformId);
            return (
              <View key={platformId} style={[styles.selectedPlatformChip, { borderColor: platform?.color }]}>
                <View style={[styles.selectedPlatformDot, { backgroundColor: platform?.color }]} />
                <Text style={styles.selectedPlatformText}>{platform?.name}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderContinueButton = () => (
    <View style={styles.continueContainer}>
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
        accessibilityLabel="Continue to photo generation"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[COLORS.secondary[500], COLORS.secondary[600]]}
          style={styles.continueButtonGradient}
        >
          <Text style={styles.continueButtonText}>
            Generate for {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}
          </Text>
          <Icon name="arrow-right" size={20} color={COLORS.text.inverse} />
        </LinearGradient>
      </TouchableOpacity>
      
      <Text style={styles.continueHint}>
        Processing will optimize your photo for each selected platform
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderQuickSelect()}
      {renderSelectedSummary()}
      
      <FlatList
        data={PLATFORM_OPTIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderPlatformCard}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={styles.platformsList}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : null}
      />
      
      {renderCustomDimensions()}
      {renderContinueButton()}
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
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.subtle,
  },
  
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  
  headerTitle: {
    flex: 1,
  },
  
  headerTitleText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  
  headerSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
  },
  
  viewToggleButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  
  quickSelect: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  
  quickSelectTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  
  quickSelectButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  
  quickSelectButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  
  quickSelectButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  selectedSummary: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  
  summaryTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  
  selectedPlatformsList: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  
  selectedPlatformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: COLORS.background.secondary,
    gap: SPACING.xs,
  },
  
  selectedPlatformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  selectedPlatformText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  platformsList: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  
  gridRow: {
    justifyContent: 'space-between',
  },
  
  platformCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  
  selectedPlatformCard: {
    borderWidth: 3,
    ...SHADOWS.medium,
  },
  
  listPlatformCard: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  
  listPlatformHeader: {
    paddingBottom: SPACING.md,
  },
  
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    position: 'relative',
  },
  
  platformIconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  
  popularBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.secondary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  platformNameContainer: {
    flex: 1,
  },
  
  platformName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  
  platformDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  
  selectionIndicator: {},
  
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  platformContent: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  
  dimensionPreview: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  dimensionBox: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  
  dimensionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  
  dimensionSize: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    fontSize: 10,
  },
  
  platformFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  
  featureTag: {
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  
  featureTagText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontSize: 10,
  },
  
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  
  listDimensionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  
  listFeatures: {
    gap: 2,
  },
  
  listFeatureText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  
  customDimensions: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  
  customDimensionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  customDimensionsTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  
  customDimensionsInputs: {
    marginTop: SPACING.md,
  },
  
  customDimensionsNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  
  continueContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.subtle,
  },
  
  continueButton: {
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    minHeight: 52,
  },
  
  continueButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  
  continueHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});

export default PlatformSelectionScreen;