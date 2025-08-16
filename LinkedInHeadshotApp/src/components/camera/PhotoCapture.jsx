import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Button, { PrimaryButton, SecondaryButton } from '../shared/Button';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ACCESSIBILITY, responsive } from '../../utils/designSystem';
import contentModerationService from '../../services/contentModerationService';
import aiContentFilterService from '../../services/aiContentFilterService';
import aiService from '../../services/aiService';

const PhotoCapture = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [moderationResult, setModerationResult] = useState(null);

  const handleImagePicker = () => {
    // Enhanced alert with accessibility
    Alert.alert(
      'Select Photo Source',
      'Choose how you would like to capture your professional headshot photo',
      [
        { 
          text: 'Take Photo', 
          onPress: () => openCamera(),
          style: 'default',
          accessibilityLabel: 'Take a new photo with camera'
        },
        { 
          text: 'Choose from Gallery', 
          onPress: () => openGallery(),
          style: 'default',
          accessibilityLabel: 'Select existing photo from gallery'
        },
        { 
          text: 'Cancel', 
          style: 'cancel',
          accessibilityLabel: 'Cancel photo selection'
        },
      ],
      {
        cancelable: true,
        userInterfaceStyle: 'light'
      }
    );
  };

  const openCamera = async () => {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access to take photos for your professional headshot.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        await processImageWithModeration(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openGallery = async () => {
    try {
      // Request media library permissions
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (libraryPermission.status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Please enable photo library access to select photos for your professional headshot.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        await processImageWithModeration(result.assets[0]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const processImageWithModeration = async (imageAsset) => {
    setIsProcessing(true);
    setModerationResult(null);

    try {
      // Prepare image data for moderation
      const imageData = {
        uri: imageAsset.uri,
        fileSize: imageAsset.fileSize || 0,
        width: imageAsset.width,
        height: imageAsset.height,
        type: imageAsset.type || 'image/jpeg'
      };

      // User context for moderation (in production, get from auth service)
      const userContext = {
        userId: 'demo-user',
        email: 'demo@example.com',
        ageVerified: true,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version
        }
      };

      // Run content moderation
      const moderationResult = await contentModerationService.moderateImageUpload(
        imageData, 
        userContext
      );

      // Also run AI content filtering
      const aiAnalysis = await aiContentFilterService.analyzeContent(imageData);

      setModerationResult({ moderation: moderationResult, aiAnalysis });

      if (moderationResult.approved && aiAnalysis.safe) {
        // Image passed moderation - allow user to proceed
        setSelectedImage(imageAsset);
        
        // Show success message if there were warnings
        if (moderationResult.warnings.length > 0 || aiAnalysis.warnings.length > 0) {
          const warnings = [
            ...moderationResult.warnings.map(w => w.message),
            ...aiAnalysis.warnings.map(w => w.message)
          ].join('\n');
          
          Alert.alert(
            'Photo Accepted with Notes',
            `Your photo meets our guidelines, but consider these suggestions:\n\n${warnings}`,
            [{ text: 'Continue', style: 'default' }]
          );
        }
      } else {
        // Image failed moderation
        await contentModerationService.handleContentViolation(
          moderationResult, 
          userContext
        );
      }

    } catch (error) {
      console.error('Image moderation error:', error);
      Alert.alert(
        'Processing Error',
        'There was an issue processing your image. Please try again or select a different photo.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const proceedToAIProcessing = async () => {
    if (!selectedImage) {
      Alert.alert(
        'Photo Required', 
        'Please capture or select a photo before continuing.',
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
      return;
    }

    try {
      setIsProcessing(true);
      
      console.log('Starting AI headshot generation...');
      
      // Process the image with AI service
      const prediction = await aiService.processImageToHeadshot(
        selectedImage.uri,
        'corporate', // Default style template
        {
          numOutputs: 4,
          numSteps: 30, // Faster processing for demo
          guidanceScale: 5
        }
      );

      console.log('Prediction initiated:', prediction.id);

      // Navigate to processing screen with prediction details
      navigation.navigate('Processing', {
        predictionId: prediction.id,
        originalImage: selectedImage,
        styleTemplate: 'corporate',
        prediction: prediction
      });

    } catch (error) {
      console.error('AI Processing Error:', error);
      
      Alert.alert(
        'Processing Failed',
        `Failed to start AI processing: ${error.message}. Please try again with a different photo or check your internet connection.`,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const proceedToStyleSelection = () => {
    if (selectedImage) {
      navigation.navigate('StyleSelector', { image: selectedImage });
    } else {
      Alert.alert(
        'Photo Required', 
        'Please capture or select a photo before continuing to style selection.',
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Capture Your Photo</Text>
          <Text style={styles.subtitle}>
            Follow our guidelines for the best results
          </Text>
        </View>

        <View 
          style={styles.guidelinesContainer}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="Photo guidelines for best results"
        >
          <Text style={styles.guidelinesTitle}>Photo Guidelines for Best Results:</Text>
          
          <View style={styles.guidelineItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.guideline}>Face should be clearly visible and well-lit</Text>
          </View>
          
          <View style={styles.guidelineItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.guideline}>Use natural lighting when possible</Text>
          </View>
          
          <View style={styles.guidelineItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.guideline}>Look directly at the camera with a slight smile</Text>
          </View>
          
          <View style={styles.guidelineItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.guideline}>Plain or neutral background preferred</Text>
          </View>
          
          <View style={styles.guidelineItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.guideline}>Include shoulders for professional framing</Text>
          </View>
        </View>

        {/* Content Policy Notice */}
        <View style={styles.policyNotice}>
          <Text style={styles.policyText}>
            By uploading a photo, you agree to our content guidelines. We automatically scan all images to ensure they meet community standards and are appropriate for professional use.
          </Text>
        </View>

        <PrimaryButton
          title={selectedImage ? 'Change Photo' : 'Capture or Select Photo'}
          onPress={handleImagePicker}
          size="large"
          fullWidth={true}
          disabled={isProcessing}
          accessibilityHint="Opens options to take a new photo or select from gallery"
          style={styles.captureButton}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary.main} />
            <Text style={styles.processingText}>
              Analyzing photo for quality and compliance...
            </Text>
            <Text style={styles.processingSubtext}>
              This helps ensure the best results for your professional headshot
            </Text>
          </View>
        )}

        {selectedImage && (
          <View style={styles.selectedImageInfo}>
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: selectedImage.uri }}
                style={styles.imagePreview}
                accessibilityLabel="Selected photo preview"
              />
              <View style={styles.successIndicator}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>
            
            <Text style={styles.selectedImageText}>
              Photo selected successfully
            </Text>
            
            <PrimaryButton
              title="Generate Professional Headshot"
              onPress={proceedToAIProcessing}
              size="large"
              fullWidth={true}
              disabled={isProcessing}
              accessibilityHint="Generate professional headshot with AI"
              style={styles.proceedButton}
            />
            
            <SecondaryButton
              title="Choose Style First"
              onPress={proceedToStyleSelection}
              size="medium"
              fullWidth={true}
              style={[styles.proceedButton, { marginTop: 12 }]}
              accessibilityHint="Select style template before processing"
            />
          </View>
        )}
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
    paddingTop: responsive.sp(SPACING.xl),
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
    maxWidth: responsive.wp(80),
  },
  guidelinesContainer: {
    backgroundColor: COLORS.background.secondary,
    padding: responsive.sp(SPACING.lg),
    borderRadius: RADIUS.lg,
    marginBottom: responsive.sp(SPACING.xxxl),
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary[500],
    ...SHADOWS.light,
  },
  guidelinesTitle: {
    fontSize: responsive.fs(TYPOGRAPHY.h4.fontSize),
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    color: COLORS.text.primary,
    marginBottom: responsive.sp(SPACING.lg),
    letterSpacing: TYPOGRAPHY.h4.letterSpacing,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsive.sp(SPACING.md),
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary[500],
    marginRight: responsive.sp(SPACING.md),
    marginTop: responsive.sp(SPACING.sm),
  },
  guideline: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.body2.lineHeight,
    flex: 1,
  },
  policyNotice: {
    backgroundColor: COLORS.background.secondary,
    padding: responsive.sp(SPACING.md),
    borderRadius: RADIUS.md,
    marginBottom: responsive.sp(SPACING.lg),
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  policyText: {
    fontSize: responsive.fs(TYPOGRAPHY.caption.fontSize),
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.caption.lineHeight,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: responsive.sp(SPACING.xl),
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    marginBottom: responsive.sp(SPACING.lg),
  },
  processingText: {
    fontSize: responsive.fs(TYPOGRAPHY.body2.fontSize),
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: responsive.sp(SPACING.md),
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: responsive.fs(TYPOGRAPHY.caption.fontSize),
    color: COLORS.text.secondary,
    marginTop: responsive.sp(SPACING.sm),
    textAlign: 'center',
    maxWidth: responsive.wp(80),
  },
  captureButton: {
    marginBottom: responsive.sp(SPACING.xl),
  },
  selectedImageInfo: {
    alignItems: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: responsive.sp(SPACING.lg),
  },
  imagePreview: {
    width: responsive.wp(40),
    height: responsive.wp(40),
    borderRadius: RADIUS.lg,
    borderWidth: 3,
    borderColor: COLORS.secondary[500],
  },
  successIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.secondary[500],
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background.primary,
  },
  checkmark: {
    color: COLORS.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedImageText: {
    fontSize: responsive.fs(TYPOGRAPHY.body1.fontSize),
    color: COLORS.secondary[600],
    fontWeight: '600',
    marginBottom: responsive.sp(SPACING.lg),
    textAlign: 'center',
  },
  proceedButton: {
    width: '100%',
  },
});

export default PhotoCapture;