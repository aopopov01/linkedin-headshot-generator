import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import { PrimaryButton, SecondaryButton } from '../components/shared/Button';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, responsive } from '../utils/designSystem';
import ImageProcessingUtils from '../utils/imageProcessing';

const { width: screenWidth } = Dimensions.get('window');
const imageWidth = (screenWidth - 60) / 2; // 2 columns with padding

const ResultScreen = ({ navigation, route }) => {
  const { outputs, originalImage, styleTemplate, processingTime, prediction } = route.params;
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleImageSelect = (imageUrl, index) => {
    setSelectedImage({ url: imageUrl, index });
  };

  const handleDownload = async (imageUrl) => {
    try {
      setIsDownloading(true);
      
      // In a real app, you would implement actual download functionality
      // For demo purposes, we'll show a success message
      Alert.alert(
        'Download Started',
        'Your professional headshot is being downloaded to your device.',
        [{ text: 'OK', style: 'default' }]
      );
      
      console.log('Downloading image:', imageUrl);
      
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert(
        'Download Failed',
        'Failed to download the image. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async (imageUrl) => {
    try {
      await Share.share({
        message: 'Check out my new professional headshot!',
        url: imageUrl,
      });
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert(
        'Share Failed',
        'Failed to share the image. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const generateNewHeadshot = () => {
    navigation.navigate('PhotoCapture');
  };

  const goHome = () => {
    navigation.navigate('Home');
  };

  const formatProcessingTime = (timeMs) => {
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (!outputs || outputs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No Results Found</Text>
          <Text style={styles.errorMessage}>
            We couldn't generate any headshots. Please try again with a different photo.
          </Text>
          <PrimaryButton
            title="Try Again"
            onPress={generateNewHeadshot}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Professional Headshots</Text>
          <Text style={styles.subtitle}>
            Generated in {formatProcessingTime(processingTime)} • {styleTemplate} style
          </Text>
        </View>

        {/* Original Image */}
        <View style={styles.originalSection}>
          <Text style={styles.sectionTitle}>Original Photo</Text>
          <Image 
            source={{ uri: originalImage.uri }}
            style={styles.originalImage}
            resizeMode="cover"
          />
        </View>

        {/* Generated Results */}
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Generated Headshots</Text>
          <Text style={styles.sectionSubtitle}>
            Tap any image to view full size
          </Text>
          
          <View style={styles.resultsGrid}>
            {outputs.map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.resultImageContainer,
                  selectedImage?.index === index && styles.selectedImageContainer
                ]}
                onPress={() => handleImageSelect(imageUrl, index)}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.resultImage}
                  resizeMode="cover"
                />
                {selectedImage?.index === index && (
                  <View style={styles.selectedOverlay}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        {selectedImage && (
          <View style={styles.actionSection}>
            <Text style={styles.actionTitle}>
              Selected Image {selectedImage.index + 1}
            </Text>
            
            <View style={styles.buttonRow}>
              <SecondaryButton
                title="Download"
                onPress={() => handleDownload(selectedImage.url)}
                disabled={isDownloading}
                style={styles.actionButton}
              />
              <PrimaryButton
                title="Share"
                onPress={() => handleShare(selectedImage.url)}
                style={styles.actionButton}
              />
            </View>
          </View>
        )}

        <View style={styles.bottomActions}>
          <SecondaryButton
            title="Generate New Headshot"
            onPress={generateNewHeadshot}
            size="large"
            fullWidth
            style={styles.bottomButton}
          />
          
          <PrimaryButton
            title="Back to Home"
            onPress={goHome}
            size="large"
            fullWidth
            style={styles.bottomButton}
          />
        </View>

        {/* Usage Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Tips for Using Your Headshots</Text>
          
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Use for LinkedIn profiles, business cards, and professional websites
            </Text>
          </View>
          
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Download the highest quality version for print materials
            </Text>
          </View>
          
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Consider generating different styles for various professional contexts
            </Text>
          </View>
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
    padding: responsive.sp(SPACING.lg),
    paddingBottom: responsive.sp(SPACING.xxxl),
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: responsive.sp(SPACING.xl),
  },
  title: {
    fontSize: responsive.fs(TYPOGRAPHY.h1.fontSize),
    fontWeight: TYPOGRAPHY.h1.fontWeight,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: responsive.sp(SPACING.sm),
  },
  subtitle: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // Original Section
  originalSection: {
    marginBottom: responsive.sp(SPACING.xl),
  },
  sectionTitle: {
    fontSize: responsive.fs(TYPOGRAPHY.h3.fontSize),
    fontWeight: TYPOGRAPHY.h3.fontWeight,
    color: COLORS.text.primary,
    marginBottom: responsive.sp(SPACING.md),
  },
  sectionSubtitle: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.secondary,
    marginBottom: responsive.sp(SPACING.lg),
  },
  originalImage: {
    width: responsive.wp(40),
    height: responsive.wp(40),
    borderRadius: RADIUS.lg,
    alignSelf: 'center',
    ...SHADOWS.medium,
  },

  // Results Section
  resultsSection: {
    marginBottom: responsive.sp(SPACING.xl),
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resultImageContainer: {
    width: imageWidth,
    height: imageWidth,
    marginBottom: responsive.sp(SPACING.lg),
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.light,
  },
  selectedImageContainer: {
    borderWidth: 3,
    borderColor: COLORS.primary.main,
    ...SHADOWS.medium,
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary.main,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: COLORS.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Action Section
  actionSection: {
    backgroundColor: COLORS.background.secondary,
    padding: responsive.sp(SPACING.lg),
    borderRadius: RADIUS.lg,
    marginBottom: responsive.sp(SPACING.xl),
  },
  actionTitle: {
    fontSize: responsive.fs(TYPOGRAPHY.h4.fontSize),
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: responsive.sp(SPACING.lg),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: responsive.sp(SPACING.sm),
  },

  // Bottom Actions
  bottomActions: {
    marginBottom: responsive.sp(SPACING.xl),
  },
  bottomButton: {
    marginBottom: responsive.sp(SPACING.md),
  },

  // Tips Section
  tipsSection: {
    backgroundColor: COLORS.background.secondary,
    padding: responsive.sp(SPACING.lg),
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary[500],
  },
  tipsTitle: {
    fontSize: responsive.fs(TYPOGRAPHY.h4.fontSize),
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    color: COLORS.text.primary,
    marginBottom: responsive.sp(SPACING.lg),
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsive.sp(SPACING.md),
  },
  tipBullet: {
    color: COLORS.primary[500],
    marginRight: responsive.sp(SPACING.md),
    fontSize: responsive.fs(TYPOGRAPHY.body1.fontSize),
    marginTop: 2,
  },
  tipText: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.primary,
    flex: 1,
    lineHeight: TYPOGRAPHY.body2.lineHeight,
  },

  // Error State
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
  retryButton: {
    width: '100%',
  },
});

export default ResultScreen;