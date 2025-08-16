/**
 * OmniShot Style Selection Screen
 * Professional style selector with previews and industry recommendations
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
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import DesignSystem from '../utils/omnishotDesignSystem';

const { width } = Dimensions.get('window');
const { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, PROFESSIONAL_STYLES } = DesignSystem;

const STYLE_CATEGORIES = [
  { id: 'all', name: 'All Styles' },
  { id: 'business', name: 'Business' },
  { id: 'creative', name: 'Creative' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'tech', name: 'Technology' },
];

const StyleSelectionScreen = ({ route, navigation }) => {
  const { photo, preselectedStyle } = route.params || {};
  const [selectedStyle, setSelectedStyle] = useState(preselectedStyle || null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewImage, setPreviewImage] = useState(photo?.uri || null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleStyleSelect = (styleId) => {
    setSelectedStyle(styleId);
    
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
    if (!selectedStyle) {
      // Show error or selection prompt
      return;
    }
    
    navigation.navigate('PlatformSelection', {
      photo,
      selectedStyle,
    });
  };

  const getFilteredStyles = () => {
    const styles = Object.entries(PROFESSIONAL_STYLES);
    
    if (selectedCategory === 'all') {
      return styles;
    }
    
    return styles.filter(([_, style]) => {
      switch (selectedCategory) {
        case 'business':
          return ['executive', 'finance', 'consulting'].includes(_);
        case 'creative':
          return ['creative', 'startup'].includes(_);
        case 'healthcare':
          return ['healthcare'].includes(_);
        case 'tech':
          return ['tech', 'startup'].includes(_);
        default:
          return true;
      }
    });
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
        <Text style={styles.headerTitleText}>Choose Your Style</Text>
        <Text style={styles.headerSubtitle}>Select the professional look that fits your goals</Text>
      </View>
    </View>
  );

  const renderPhotoPreview = () => (
    <View style={styles.photoPreview}>
      <View style={styles.previewContainer}>
        {previewImage ? (
          <Image source={{ uri: previewImage }} style={styles.previewImage} />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Icon name="user" size={48} color={COLORS.neutral[400]} />
          </View>
        )}
        
        {selectedStyle && (
          <View style={styles.selectedStyleOverlay}>
            <Text style={styles.selectedStyleText}>
              {PROFESSIONAL_STYLES[selectedStyle]?.name} Style
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.changePhotoButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Change photo"
        accessibilityRole="button"
      >
        <Icon name="edit-2" size={16} color={COLORS.secondary[500]} />
        <Text style={styles.changePhotoText}>Change Photo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {STYLE_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.activeCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category.id)}
            accessibilityLabel={`Filter by ${category.name}`}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.id && styles.activeCategoryButtonText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStyleCard = ({ item: [styleId, style] }) => {
    const isSelected = selectedStyle === styleId;
    
    return (
      <Animated.View style={{ transform: [{ scale: isSelected ? scaleAnim : 1 }] }}>
        <TouchableOpacity
          style={[
            styles.styleCard,
            isSelected && styles.selectedStyleCard,
            { borderColor: style.color },
          ]}
          onPress={() => handleStyleSelect(styleId)}
          accessibilityLabel={`Select ${style.name} professional style`}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
        >
          {/* Style preview area */}
          <View style={[styles.stylePreview, { backgroundColor: style.color + '10' }]}>
            <View style={[styles.styleColorIndicator, { backgroundColor: style.color }]} />
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Icon name="check" size={16} color={COLORS.text.inverse} />
              </View>
            )}
          </View>
          
          {/* Style info */}
          <View style={styles.styleInfo}>
            <Text style={styles.styleName}>{style.name}</Text>
            <Text style={styles.styleDescription}>{style.description}</Text>
            
            {/* Characteristics */}
            <View style={styles.characteristics}>
              {style.characteristics.slice(0, 2).map((char, index) => (
                <View key={index} style={styles.characteristicTag}>
                  <Text style={styles.characteristicText}>{char}</Text>
                </View>
              ))}
            </View>
            
            {/* Suitable for */}
            <View style={styles.suitableFor}>
              <Text style={styles.suitableForLabel}>Best for:</Text>
              <Text style={styles.suitableForText}>
                {style.suitableFor.slice(0, 2).join(', ')}
              </Text>
            </View>
            
            {/* Platform indicators */}
            <View style={styles.platformIndicators}>
              {style.platforms.map((platform) => (
                <View
                  key={platform}
                  style={[
                    styles.platformDot,
                    { backgroundColor: COLORS.platform[platform] || COLORS.neutral[400] },
                  ]}
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderContinueButton = () => (
    <View style={styles.continueContainer}>
      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedStyle && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!selectedStyle}
        accessibilityLabel="Continue to platform selection"
        accessibilityRole="button"
        accessibilityState={{ disabled: !selectedStyle }}
      >
        <LinearGradient
          colors={
            selectedStyle
              ? [COLORS.secondary[500], COLORS.secondary[600]]
              : [COLORS.neutral[300], COLORS.neutral[400]]
          }
          style={styles.continueButtonGradient}
        >
          <Text
            style={[
              styles.continueButtonText,
              !selectedStyle && styles.continueButtonTextDisabled,
            ]}
          >
            Continue
          </Text>
          <Icon
            name="arrow-right"
            size={20}
            color={selectedStyle ? COLORS.text.inverse : COLORS.neutral[500]}
          />
        </LinearGradient>
      </TouchableOpacity>
      
      {selectedStyle && (
        <Text style={styles.continueHint}>
          Next: Choose platforms for optimization
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderPhotoPreview()}
      {renderCategoryFilter()}
      
      <FlatList
        data={getFilteredStyles()}
        keyExtractor={([styleId]) => styleId}
        renderItem={renderStyleCard}
        numColumns={1}
        contentContainerStyle={styles.stylesList}
        showsVerticalScrollIndicator={false}
      />
      
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
  
  photoPreview: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  
  previewContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background.secondary,
  },
  
  previewPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  selectedStyleOverlay: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  
  selectedStyleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  changePhotoText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.secondary[500],
    fontWeight: '500',
  },
  
  categoryFilter: {
    paddingBottom: SPACING.md,
  },
  
  categoryScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  
  categoryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  
  activeCategoryButton: {
    backgroundColor: COLORS.secondary[500],
    borderColor: COLORS.secondary[500],
  },
  
  categoryButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  activeCategoryButtonText: {
    color: COLORS.text.inverse,
  },
  
  stylesList: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  
  styleCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  
  selectedStyleCard: {
    borderWidth: 3,
    ...SHADOWS.medium,
  },
  
  stylePreview: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  
  styleColorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  
  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  styleInfo: {
    padding: SPACING.lg,
  },
  
  styleName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  styleDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  
  characteristics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  
  characteristicTag: {
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  
  characteristicText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  
  suitableFor: {
    marginBottom: SPACING.sm,
  },
  
  suitableForLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  
  suitableForText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
  },
  
  platformIndicators: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  
  continueButtonDisabled: {
    opacity: 0.6,
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
  
  continueButtonTextDisabled: {
    color: COLORS.neutral[500],
  },
  
  continueHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});

export default StyleSelectionScreen;