import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Share,
  Image,
  Platform,
} from 'react-native';
import Grid, { RESPONSIVE_CONFIGS } from '../shared/Grid';
import { PrimaryButton, SecondaryButton, TertiaryButton } from '../shared/Button';
import Card, { ActionCard, InfoCard } from '../shared/Card';
import { showAlert, showSuccessAlert, showErrorAlert } from '../shared/Alert';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ACCESSIBILITY, responsive } from '../../utils/designSystem';

const ResultsGallery = ({ navigation, route }) => {
  const { originalImage, selectedStyle, generatedImages } = route.params || {};
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handleDownload = () => {
    if (selectedImage) {
      // In a real app, this would download the selected image
      showSuccessAlert(
        'Download Started',
        'Your professional headshot is being saved to your gallery.',
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      showErrorAlert(
        'No Image Selected',
        'Please select an image before downloading.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleShare = async () => {
    if (selectedImage) {
      try {
        await Share.share({
          message: 'Check out my new professional headshot created with AI! Perfect for LinkedIn and professional profiles.',
          // In a real app, would include the actual image URL
          url: selectedImage.uri,
        });
      } catch (error) {
        showErrorAlert(
          'Share Failed',
          'Unable to share the image at this time. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } else {
      showErrorAlert(
        'No Image Selected',
        'Please select an image before sharing.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleCreateMore = () => {
    navigation.navigate('PhotoCapture');
  };

  const handleUpgrade = () => {
    navigation.navigate('PaymentScreen');
  };

  // Mock generated images for display
  const mockResults = [
    { id: 1, style: selectedStyle, isSelected: false },
    { id: 2, style: selectedStyle, isSelected: false },
    { id: 3, style: selectedStyle, isSelected: false },
    { id: 4, style: selectedStyle, isSelected: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Professional Headshots</Text>
          <Text style={styles.subtitle}>
            Tap to select your favorite, then download or share
          </Text>
        </View>

        <Grid
          responsive={RESPONSIVE_CONFIGS.gallery}
          spacing={responsive.sp(SPACING.lg)}
          style={styles.resultsGrid}
        >
          {mockResults.map((image) => (
            <Card
              key={image.id}
              selected={selectedImage?.id === image.id}
              onPress={() => handleImageSelect(image)}
              variant="elevated"
              padding="none"
              accessibilityLabel={`${selectedStyle} headshot ${image.id}`}
              accessibilityHint={selectedImage?.id === image.id ? 'Currently selected' : 'Tap to select this headshot'}
              style={styles.imageCard}
            >
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {selectedStyle} #{image.id}
                </Text>
                
                <View style={styles.qualityBadge}>
                  <Text style={styles.qualityBadgeText}>HD</Text>
                </View>
              </View>
            </Card>
          ))}
        </Grid>

        {selectedImage && (
          <View style={styles.actionContainer}>
            <InfoCard
              icon={<Text style={styles.selectionIcon}>✓</Text>}
              title={`${selectedStyle} Headshot #${selectedImage.id} Selected`}
              description="Ready to download or share your professional headshot"
              style={styles.selectionCard}
            />
            
            <View style={styles.buttonRow}>
              <SecondaryButton
                title="Download"
                onPress={handleDownload}
                size="large"
                icon={<Text style={styles.buttonIcon}>⬇️</Text>}
                accessibilityHint="Download selected headshot to device"
                style={styles.downloadButton}
              />

              <PrimaryButton
                title="Share"
                onPress={handleShare}
                size="large"
                icon={<Text style={styles.buttonIcon}>📤</Text>}
                accessibilityHint="Share selected headshot with others"
                style={styles.shareButton}
              />
            </View>
          </View>
        )}

        <View style={styles.bottomActions}>
          <TertiaryButton
            title="Create More Photos"
            onPress={handleCreateMore}
            size="large"
            fullWidth
            accessibilityHint="Return to photo capture to create more headshots"
            style={styles.createMoreButton}
          />

          <ActionCard
            icon={<Text style={styles.upgradeIcon}>👑</Text>}
            title="Upgrade to Premium"
            description="Get unlimited professional headshots, priority processing, and premium styles"
            actionText="Upgrade Now"
            onActionPress={handleUpgrade}
            style={styles.upgradeContainer}
          />
        </View>
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
  resultsGrid: {
    marginBottom: responsive.sp(SPACING.xl),
  },
  imageCard: {
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: COLORS.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: responsive.sp(SPACING.md),
  },
  imagePlaceholderText: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  qualityBadge: {
    position: 'absolute',
    top: responsive.sp(SPACING.sm),
    right: responsive.sp(SPACING.sm),
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: responsive.sp(SPACING.sm),
    paddingVertical: responsive.sp(SPACING.xs),
    borderRadius: RADIUS.sm,
  },
  qualityBadgeText: {
    color: COLORS.text.inverse,
    fontSize: responsive.fs(TYPOGRAPHY.caption.fontSize),
    fontWeight: 'bold',
  },
  selectionIcon: {
    fontSize: responsive.fs(24),
    color: COLORS.secondary[500],
  },
  selectionCard: {
    marginBottom: responsive.sp(SPACING.lg),
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: responsive.sp(SPACING.xl),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: responsive.sp(SPACING.md),
  },
  buttonIcon: {
    fontSize: 16,
  },
  downloadButton: {
    flex: 1,
  },
  shareButton: {
    flex: 1,
  },
  bottomActions: {
    alignItems: 'center',
  },
  createMoreButton: {
    marginBottom: responsive.sp(SPACING.xl),
  },
  upgradeContainer: {
    width: '100%',
  },
  upgradeIcon: {
    fontSize: responsive.fs(32),
  },
});

export default ResultsGallery;