import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { PrimaryButton } from '../shared/Button';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ACCESSIBILITY, responsive } from '../../utils/designSystem';

const StyleSelector = ({ navigation, route }) => {
  const { image } = route.params || {};
  const [selectedStyle, setSelectedStyle] = useState('corporate');

  const styles_data = [
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'Professional business attire, clean background',
      preview: require('../../../assets/style-previews/corporate.png'),
      popular: true,
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Smart casual, modern background, approachable',
      preview: require('../../../assets/style-previews/creative.png'),
      popular: false,
    },
    {
      id: 'executive',
      name: 'Executive',
      description: 'Formal business suit, premium lighting',
      preview: require('../../../assets/style-previews/executive.png'),
      popular: false,
    },
    {
      id: 'startup',
      name: 'Startup',
      description: 'Business casual, clean minimal background',
      preview: require('../../../assets/style-previews/startup.png'),
      popular: true,
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      description: 'Medical professional, trustworthy appearance',
      preview: require('../../../assets/style-previews/healthcare.png'),
      popular: false,
    },
  ];

  const handleStyleSelect = (styleId) => {
    setSelectedStyle(styleId);
  };

  const proceedToProcessing = () => {
    navigation.navigate('ProcessingScreen', {
      image,
      selectedStyle,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Style</Text>
          <Text style={styles.subtitle}>
            Select the professional style that best fits your industry
          </Text>
        </View>

        <View style={styles.stylesGrid}>
          {styles_data.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleCard,
                selectedStyle === style.id && styles.selectedStyleCard,
              ]}
              onPress={() => handleStyleSelect(style.id)}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${style.name} style option`}
              accessibilityHint={`${style.description}. ${selectedStyle === style.id ? 'Currently selected' : 'Tap to select'}`}
              accessibilityState={{ selected: selectedStyle === style.id }}
            >
              {style.popular && (
                <View 
                  style={styles.popularBadge}
                  accessible={true}
                  accessibilityLabel="Popular choice"
                >
                  <Text style={styles.popularText}>POPULAR</Text>
                </View>
              )}
              
              <View style={styles.stylePreview}>
                {/* Placeholder for style preview image */}
                <View style={styles.previewPlaceholder}>
                  <Text style={styles.previewText}>{style.name}</Text>
                </View>
              </View>

              <View style={styles.styleInfo}>
                <Text style={styles.styleName}>{style.name}</Text>
                <Text style={styles.styleDescription}>{style.description}</Text>
              </View>

              {selectedStyle === style.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <PrimaryButton
          title="Generate Professional Headshots"
          onPress={proceedToProcessing}
          size="large"
          fullWidth={true}
          accessibilityHint={`Generate headshots in ${selectedStyle} style`}
          style={styles.continueButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    flexGrow: 1,
    padding: responsive.sp(SPACING.lg),
  },
  header: {
    alignItems: 'center',
    marginBottom: responsive.sp(SPACING.xl),
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
  stylesGrid: {
    marginBottom: responsive.sp(SPACING.xl),
  },
  styleCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    padding: responsive.sp(SPACING.lg),
    marginBottom: responsive.sp(SPACING.lg),
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: ACCESSIBILITY.touchTargetSize * 3,
    ...SHADOWS.light,
  },
  selectedStyleCard: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
    ...SHADOWS.medium,
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: responsive.sp(SPACING.md),
    right: responsive.sp(SPACING.md),
    backgroundColor: COLORS.semantic.error,
    paddingHorizontal: responsive.sp(SPACING.sm),
    paddingVertical: responsive.sp(SPACING.xs),
    borderRadius: RADIUS.sm,
    zIndex: 1,
  },
  popularText: {
    color: COLORS.text.inverse,
    fontSize: responsive.fs(TYPOGRAPHY.label.fontSize),
    fontWeight: TYPOGRAPHY.label.fontWeight,
    letterSpacing: TYPOGRAPHY.label.letterSpacing,
  },
  stylePreview: {
    height: responsive.hp(15),
    marginBottom: responsive.sp(SPACING.lg),
  },
  previewPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.neutral[200],
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.neutral[300],
    borderStyle: 'dashed',
  },
  previewText: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  styleInfo: {
    flex: 1,
  },
  styleName: {
    fontSize: responsive.fs(TYPOGRAPHY.h4.fontSize),
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    color: COLORS.text.primary,
    marginBottom: responsive.sp(SPACING.xs),
    letterSpacing: TYPOGRAPHY.h4.letterSpacing,
  },
  styleDescription: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.body2.lineHeight,
  },
  selectedIndicator: {
    position: 'absolute',
    top: responsive.sp(SPACING.lg),
    left: responsive.sp(SPACING.lg),
    backgroundColor: COLORS.primary[500],
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background.primary,
    ...SHADOWS.light,
  },
  selectedText: {
    color: COLORS.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    marginTop: responsive.sp(SPACING.md),
  },
});

export default StyleSelector;