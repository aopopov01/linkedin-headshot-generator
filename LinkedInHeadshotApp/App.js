import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity, 
  Alert, 
  Image, 
  SafeAreaView,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import omnishotApiService from './src/services/omnishotApiService';
import mediaPermissionService from './src/services/mediaPermissionService';
import { 
  BRAND_COLORS, 
  TYPOGRAPHY, 
  SPACING, 
  BORDER_RADIUS, 
  BRAND_TEXT, 
  BRAND_ICONS,
  STYLE_MIXINS
} from './src/constants/branding';

// Import enhanced UX components
import OnboardingScreen from './src/screens/OnboardingScreen';
import EnhancedProcessingScreen from './src/components/ai/EnhancedProcessingScreen';
import EnhancedPlatformSelection from './src/components/selection/EnhancedPlatformSelection';
import ErrorRecoveryModal from './src/components/shared/ErrorRecoveryModal';
import { HelpProvider, HelpButton, HelpModal, HELP_CONTENT } from './src/components/shared/HelpSystem';
import EnhancedResultsScreen from './src/components/results/EnhancedResultsScreen';

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUsedFreeGeneration, setHasUsedFreeGeneration] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showPlatformSelection, setShowPlatformSelection] = useState(false);
  const [showStyleSelection, setShowStyleSelection] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingPlatform, setCurrentProcessingPlatform] = useState('');
  
  // Enhanced UX states
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [errorRecovery, setErrorRecovery] = useState({ visible: false, error: null });
  const [processingStage, setProcessingStage] = useState('initializing');
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [currentHelp, setCurrentHelp] = useState(null);

  // Platform options with specifications using branding constants
  const platformOptions = [
    {
      id: 'linkedin',
      name: BRAND_TEXT.PLATFORM_NAMES.linkedin,
      icon: BRAND_ICONS.PLATFORMS.linkedin,
      description: 'Professional networking',
      dimensions: '400x400',
      color: '#0077B5',
      category: 'Professional'
    },
    {
      id: 'instagram',
      name: BRAND_TEXT.PLATFORM_NAMES.instagram,
      icon: BRAND_ICONS.PLATFORMS.instagram,
      description: 'Social media profile',
      dimensions: '320x320',
      color: '#E4405F',
      category: 'Social'
    },
    {
      id: 'facebook',
      name: BRAND_TEXT.PLATFORM_NAMES.facebook,
      icon: BRAND_ICONS.PLATFORMS.facebook,
      description: 'Social networking',
      dimensions: '170x170',
      color: '#1877F2',
      category: 'Social'
    },
    {
      id: 'twitter',
      name: BRAND_TEXT.PLATFORM_NAMES.twitter,
      icon: BRAND_ICONS.PLATFORMS.twitter,
      description: 'Professional updates',
      dimensions: '400x400',
      color: '#1DA1F2',
      category: 'Social'
    },
    {
      id: 'youtube',
      name: BRAND_TEXT.PLATFORM_NAMES.youtube,
      icon: BRAND_ICONS.PLATFORMS.youtube,
      description: 'Content creation',
      dimensions: '800x800',
      color: '#FF0000',
      category: 'Content'
    },
    {
      id: 'tiktok',
      name: BRAND_TEXT.PLATFORM_NAMES.tiktok,
      icon: BRAND_ICONS.PLATFORMS.tiktok,
      description: 'Short-form content',
      dimensions: '200x200',
      color: '#000000',
      category: 'Content'
    },
    {
      id: 'whatsapp_business',
      name: BRAND_TEXT.PLATFORM_NAMES.whatsapp_business,
      icon: BRAND_ICONS.PLATFORMS.whatsapp_business,
      description: 'Business communication',
      dimensions: '256x256',
      color: '#25D366',
      category: 'Business'
    },
    {
      id: 'github',
      name: BRAND_TEXT.PLATFORM_NAMES.github,
      icon: BRAND_ICONS.PLATFORMS.github,
      description: 'Developer profile',
      dimensions: '460x460',
      color: '#181717',
      category: 'Professional'
    }
  ];

  // Professional AI headshot transformation styles using branding constants
  const styleOptions = [
    {
      id: 'professional',
      name: 'Professional Executive',
      description: 'Classic business professional look',
      icon: BRAND_ICONS.STYLES.professional
    },
    {
      id: 'creative',
      name: 'Creative Professional',
      description: 'Modern creative industry style',
      icon: BRAND_ICONS.STYLES.creative
    },
    {
      id: 'tech',
      name: 'Tech Industry',
      description: 'Silicon Valley tech professional',
      icon: BRAND_ICONS.STYLES.tech
    },
    {
      id: 'healthcare',
      name: 'Healthcare Professional',
      description: 'Medical and healthcare industry',
      icon: BRAND_ICONS.STYLES.healthcare
    },
    {
      id: 'finance',
      name: 'Finance & Banking',
      description: 'Traditional finance professional',
      icon: BRAND_ICONS.STYLES.finance
    },
    {
      id: 'startup',
      name: 'Startup Founder',
      description: 'Entrepreneurial and innovative',
      icon: BRAND_ICONS.STYLES.startup
    }
  ];

  // Enhanced multi-platform optimization with better UX
  const processMultiPlatformOptimization = async (imageUri) => {
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStage('initializing');
      setEstimatedTime(selectedPlatforms.length * 30); // Estimate 30 seconds per platform
      
      console.log('🎯 Starting OmniShot multi-platform optimization with AI backend');
      console.log(`📱 Platforms: ${selectedPlatforms.join(', ')}`);
      console.log(`🎨 Style: ${selectedStyle}`);

      // Stage 1: Initialize
      setProcessingStage('analyzing');
      setCurrentProcessingPlatform('Analyzing photo composition...');
      setProcessingProgress(10);

      // Check service health first
      const healthCheck = await omnishotApiService.checkServiceHealth();
      console.log('🏥 OmniShot service health:', healthCheck);

      // Stage 2: Enhancement
      setProcessingStage('enhancing');
      setCurrentProcessingPlatform('Applying AI enhancements...');
      setProcessingProgress(30);

      // Stage 3: Optimization
      setProcessingStage('optimizing');
      setCurrentProcessingPlatform('Optimizing for platforms...');
      setProcessingProgress(50);

      // Call the comprehensive multi-platform optimization API
      const optimizationResult = await omnishotApiService.optimizeForMultiplePlatforms(
        imageUri, 
        selectedPlatforms, 
        selectedStyle
      );

      // Stage 4: Finalizing
      setProcessingStage('finalizing');
      setProcessingProgress(90);
      
      if (optimizationResult.success) {
        setGeneratedImages(optimizationResult.results);
        setHasUsedFreeGeneration(true);
        setShowResult(true);
        setProcessingProgress(100);
        
        console.log('✅ OmniShot optimization completed successfully');
      } else {
        throw new Error('Multi-platform optimization failed');
      }
      
    } catch (error) {
      console.error('❌ Multi-platform optimization failed:', error);
      
      // Show enhanced error recovery modal
      setErrorRecovery({
        visible: true,
        error,
        context: 'processing',
      });
      
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setCurrentProcessingPlatform('');
      setProcessingStage('initializing');
      setEstimatedTime(null);
    }
  };

  // Enhanced error recovery functions
  const handleRetryProcessing = async () => {
    await processMultiPlatformOptimization(selectedImage);
  };

  const handleFallbackProcessing = async () => {
    try {
      const fallbackResult = await omnishotApiService.fallbackLocalOptimization(
        selectedImage, 
        selectedPlatforms, 
        selectedStyle
      );
      
      setGeneratedImages(fallbackResult.results);
      setHasUsedFreeGeneration(true);
      setShowResult(true);
      
      Alert.alert(
        '📱 Basic Optimization Complete',
        'Your photos have been optimized using basic processing. Upgrade for AI-enhanced results!'
      );
    } catch (fallbackError) {
      console.error('❌ Fallback processing failed:', fallbackError);
      throw fallbackError;
    }
  };

  const handleCancelProcessing = () => {
    resetApp();
  };

  // Service health check and permission diagnostics on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Log media permission diagnostics
        mediaPermissionService.logDiagnostics();
        
        // Check current permission status
        const permissionStatus = await mediaPermissionService.checkPermissionStatus();
        console.log('📱 Current Permission Status:', permissionStatus);
        
        if (permissionStatus.hasLimitations) {
          console.log('⚠️ Running in Expo Go with Android 13+ limitations');
        }
        
        // Service health check
        const health = await omnishotApiService.checkServiceHealth();
        console.log('🏥 OmniShot Service Status:', health.available ? 'Available' : 'Offline');
        console.log('🔗 Current endpoint:', health.currentEndpoint);
        
        if (!health.available) {
          console.log('⚠️ AI optimization service is offline, running diagnostics...');
          
          // Run network diagnostics if health check fails
          const diagnostics = await omnishotApiService.runNetworkDiagnostics();
          console.log('🔧 Network diagnostics:', diagnostics);
          
          // Log recommendations for debugging
          diagnostics.recommendations.forEach(rec => console.log(rec));
        }
      } catch (error) {
        console.log('⚠️ App initialization error:', error.message);
      }
    };

    initializeApp();
  }, []);

  const takePhoto = async () => {
    try {
      if (hasUsedFreeGeneration) {
        Alert.alert('Upgrade Required', 'You\'ve used your free OmniShot. Upgrade for unlimited multi-platform optimization!');
        return;
      }

      // Use enhanced permission service
      const hasPermission = await mediaPermissionService.requestCameraPermissions();
      if (!hasPermission) {
        return; // Permission service handles user messaging
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setShowPlatformSelection(true);
      }
    } catch (error) {
      console.error('Take Photo Error:', error);
      Alert.alert('Camera Error', 'Camera failed to open. Please try again.');
    }
  };

  const uploadPhoto = async () => {
    try {
      if (hasUsedFreeGeneration) {
        Alert.alert('Upgrade Required', 'You\'ve used your free OmniShot. Upgrade for unlimited multi-platform optimization!');
        return;
      }

      // Use enhanced permission service with Android 13+ support
      const hasPermission = await mediaPermissionService.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return; // Permission service handles user messaging and limitations
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setShowPlatformSelection(true);
      }
    } catch (error) {
      console.error('Upload Photo Error:', error);
      
      // Enhanced error handling for Expo Go limitations
      if (mediaPermissionService.isExpoGoWithLimitations()) {
        Alert.alert(
          'Expo Go Limitation', 
          'Photo selection may be limited in Expo Go on Android 13+. For full functionality, create a development build.'
        );
      } else {
        Alert.alert('Photo Selection Error', 'Photo upload failed. Please try again.');
      }
    }
  };

  const resetApp = () => {
    setSelectedImage(null);
    setGeneratedImages({});
    setShowResult(false);
    setShowPlatformSelection(false);
    setShowStyleSelection(false);
    setSelectedPlatforms([]);
    setSelectedStyle('professional');
    setProcessingProgress(0);
    setCurrentProcessingPlatform('');
    setErrorRecovery({ visible: false, error: null });
    setProcessingStage('initializing');
    setEstimatedTime(null);
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Help system functions
  const showHelp = (helpType) => {
    setCurrentHelp(HELP_CONTENT[helpType]);
  };

  const hideHelp = () => {
    setCurrentHelp(null);
  };

  const togglePlatformSelection = (platformId) => {
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter(id => id !== platformId));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  const downloadImages = async () => {
    try {
      // Use enhanced permission service for saving media
      const hasPermission = await mediaPermissionService.requestMediaLibrarySavePermissions();
      if (!hasPermission) {
        return; // Permission service handles user messaging and limitations
      }

      const successfulImages = Object.entries(generatedImages).filter(([_, data]) => data.success);
      
      if (successfulImages.length === 0) {
        Alert.alert('Error', 'No images to download');
        return;
      }

      let savedCount = 0;
      let failedCount = 0;

      for (const [platform, data] of successfulImages) {
        try {
          await MediaLibrary.createAssetAsync(data.imageUri);
          savedCount++;
          console.log(`✅ Saved ${platform} image successfully`);
        } catch (saveError) {
          failedCount++;
          console.error(`❌ Failed to save ${platform} image:`, saveError);
        }
      }
      
      if (savedCount > 0) {
        const message = failedCount > 0 
          ? `${savedCount}/${successfulImages.length} images saved successfully.\n\n${failedCount} images failed to save. ${mediaPermissionService.isExpoGoWithLimitations() ? 'This may be due to Expo Go limitations on Android 13+.' : 'Please try again.'}`
          : `✅ All ${savedCount} optimized images saved to Photos!\n\nReady for all your platforms!`;
          
        Alert.alert(savedCount === successfulImages.length ? 'All Images Saved!' : 'Partial Save', message);
      } else {
        Alert.alert(
          'Save Failed', 
          `Could not save any images. ${mediaPermissionService.isExpoGoWithLimitations() ? 'This is a known limitation in Expo Go on Android 13+. Use a development build for full functionality.' : 'Please check permissions and try again.'}`
        );
      }
      
    } catch (error) {
      console.error('Save error:', error);
      
      if (mediaPermissionService.isExpoGoWithLimitations()) {
        Alert.alert(
          'Expo Go Limitation', 
          'Saving images may not work reliably in Expo Go on Android 13+. For full functionality, create a development build.'
        );
      } else {
        Alert.alert('Save Failed', 'Could not save images to Photos. Please try again.');
      }
    }
  };

  // Show onboarding first
  if (showOnboarding) {
    return (
      <OnboardingScreen 
        navigation={{ navigate: handleOnboardingComplete }}
      />
    );
  }

  // Enhanced processing screen
  if (isProcessing) {
    return (
      <EnhancedProcessingScreen
        selectedImage={selectedImage}
        selectedPlatforms={selectedPlatforms}
        selectedStyle={selectedStyle}
        processingProgress={processingProgress}
        currentProcessingPlatform={currentProcessingPlatform}
        platformOptions={platformOptions}
        styleOptions={styleOptions}
        onCancel={handleCancelProcessing}
        estimatedTime={estimatedTime}
        processingStage={processingStage}
      />
    );
  }

  // Enhanced platform selection screen
  if (showPlatformSelection && selectedImage) {
    return (
      <EnhancedPlatformSelection
        selectedImage={selectedImage}
        selectedPlatforms={selectedPlatforms}
        onPlatformToggle={togglePlatformSelection}
        onContinue={() => {
          setShowPlatformSelection(false);
          setShowStyleSelection(true);
        }}
        onBack={resetApp}
        platformOptions={platformOptions}
      />
    );
  }

  // Style selection screen
  if (showStyleSelection && selectedImage && selectedPlatforms.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#1B365D" />
        <View style={styles.styleSelectionContainer}>
          <View style={styles.styleHeader}>
            <TouchableOpacity 
              onPress={() => {
                setShowStyleSelection(false);
                setShowPlatformSelection(true);
              }} 
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.styleTitle}>Choose Style</Text>
            <View style={styles.headerRight} />
          </View>
          
          <View style={styles.selectedImagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <Text style={styles.previewText}>Professional style for all platforms</Text>
            <Text style={styles.selectedCount}>
              {selectedPlatforms.length} platforms • AI optimization
            </Text>
          </View>

          <ScrollView style={styles.styleOptionsContainer} showsVerticalScrollIndicator={false}>
            {styleOptions.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleOption,
                  selectedStyle === style.id && styles.selectedStyleOption
                ]}
                onPress={() => setSelectedStyle(style.id)}
              >
                <View style={styles.styleOptionContent}>
                  <Text style={styles.styleIcon}>{style.icon}</Text>
                  <View style={styles.styleInfo}>
                    <Text style={[
                      styles.styleName,
                      selectedStyle === style.id && styles.selectedStyleName
                    ]}>
                      {style.name}
                    </Text>
                    <Text style={[
                      styles.styleDescription,
                      selectedStyle === style.id && styles.selectedStyleDescription
                    ]}>
                      {style.description}
                    </Text>
                  </View>
                  {selectedStyle === style.id && (
                    <Text style={styles.selectedCheckmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.styleActionContainer}>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={async () => {
                setShowStyleSelection(false);
                await processMultiPlatformOptimization(selectedImage);
              }}
            >
              <Text style={styles.generateButtonText}>
                🚀 Generate OmniShot ({selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Enhanced result screen
  if (showResult && Object.keys(generatedImages).length > 0) {
    return (
      <EnhancedResultsScreen
        selectedImage={selectedImage}
        generatedImages={generatedImages}
        onNewPhoto={resetApp}
        onShowHelp={showHelp}
        platformOptions={platformOptions}
      />
    );
  }

  // Main home screen - OmniShot branding
  return (
    <HelpProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#1B365D" />
        
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>{BRAND_TEXT.APP_NAME}</Text>
            <HelpButton 
              onPress={() => showHelp('photo_requirements')}
              style={styles.headerHelpButton}
            />
          </View>
          <Text style={styles.tagline}>{BRAND_TEXT.TAGLINE_PRIMARY}</Text>
          <Text style={styles.subtitle}>{BRAND_TEXT.TAGLINE_SECONDARY}</Text>
          
          {!hasUsedFreeGeneration && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>First OmniShot free!</Text>
            </View>
          )}
        </View>

      <View style={styles.mainContent}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.mainButton, hasUsedFreeGeneration && styles.disabledButton]} 
            onPress={takePhoto}
          >
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={[styles.buttonText, hasUsedFreeGeneration && styles.disabledButtonText]}>
              Take Photo
            </Text>
            <Text style={[styles.buttonSubtext, hasUsedFreeGeneration && styles.disabledButtonText]}>
              {hasUsedFreeGeneration ? 'Requires upgrade' : 'Use your camera'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mainButton, hasUsedFreeGeneration && styles.disabledButton]} 
            onPress={uploadPhoto}
          >
            <Text style={styles.buttonIcon}>📁</Text>
            <Text style={[styles.buttonText, hasUsedFreeGeneration && styles.disabledButtonText]}>
              Upload Photo
            </Text>
            <Text style={[styles.buttonSubtext, hasUsedFreeGeneration && styles.disabledButtonText]}>
              {hasUsedFreeGeneration ? 'Requires upgrade' : 'From your library'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.platformShowcase}>
          <Text style={styles.showcaseTitle}>Optimize for all platforms:</Text>
          <View style={styles.platformIconsGrid}>
            {platformOptions.slice(0, 8).map((platform) => (
              <View key={platform.id} style={styles.platformShowcaseItem}>
                <Text style={styles.platformShowcaseIcon}>{platform.icon}</Text>
                <Text style={styles.platformShowcaseName}>{platform.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How OmniShot works:</Text>
          <Text style={styles.infoStep}>1. Take or upload a photo</Text>
          <Text style={styles.infoStep}>2. Select target platforms</Text>
          <Text style={styles.infoStep}>3. Choose professional style</Text>
          <Text style={styles.infoStep}>4. AI optimizes for each platform</Text>
          <Text style={styles.infoStep}>5. Download all optimized images</Text>
        </View>

        {Object.keys(generatedImages).length > 0 && (
          <TouchableOpacity style={styles.viewResultButton} onPress={() => setShowResult(true)}>
            <Text style={styles.viewResultText}>View Your OmniShot Results</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {hasUsedFreeGeneration ? 'Upgrade for unlimited OmniShots' : 'One free OmniShot included'}
        </Text>
      </View>

        {/* Enhanced Error Recovery Modal */}
        <ErrorRecoveryModal
          visible={errorRecovery.visible}
          error={errorRecovery.error}
          context={errorRecovery.context}
          onRetry={handleRetryProcessing}
          onFallback={handleFallbackProcessing}
          onCancel={handleCancelProcessing}
          onDismiss={() => setErrorRecovery({ visible: false, error: null })}
        />

        {/* Help Modal */}
        <HelpModal
          visible={!!currentHelp}
          title={currentHelp?.title}
          content={currentHelp?.content}
          steps={currentHelp?.steps}
          onDismiss={hideHelp}
        />
      </SafeAreaView>
    </HelpProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  header: {
    padding: SPACING.PADDING_SCREEN,
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  headerHelpButton: {
    position: 'absolute',
    right: 0,
    backgroundColor: BRAND_COLORS.SECONDARY,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_DISPLAY,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.WHITE,
    marginBottom: SPACING.XS,
  },
  tagline: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: BRAND_COLORS.GRAY_400,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  freeBadge: {
    backgroundColor: BRAND_COLORS.SECONDARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS + 2,
    borderRadius: BORDER_RADIUS.LG,
  },
  freeBadgeText: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },
  mainContent: {
    flex: 1,
    backgroundColor: BRAND_COLORS.WHITE,
    borderTopLeftRadius: BORDER_RADIUS.XXL,
    borderTopRightRadius: BORDER_RADIUS.XXL,
    padding: SPACING.PADDING_SCREEN,
    marginTop: SPACING.SM,
  },
  buttonContainer: {
    marginBottom: SPACING.MARGIN_SECTION,
  },
  mainButton: {
    backgroundColor: BRAND_COLORS.GRAY_50,
    borderWidth: 2,
    borderColor: BRAND_COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.PADDING_SCREEN,
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  disabledButton: {
    backgroundColor: BRAND_COLORS.GRAY_100,
    borderColor: BRAND_COLORS.GRAY_300,
  },
  buttonIcon: {
    fontSize: TYPOGRAPHY.SIZE_DISPLAY,
    marginBottom: SPACING.SM,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  buttonSubtext: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_500,
  },
  disabledButtonText: {
    color: BRAND_COLORS.GRAY_400,
  },
  platformShowcase: {
    marginBottom: 32,
  },
  showcaseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B365D',
    marginBottom: 16,
    textAlign: 'center',
  },
  platformIconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  platformShowcaseItem: {
    alignItems: 'center',
    width: 80,
    paddingVertical: 8,
  },
  platformShowcaseIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  platformShowcaseName: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B365D',
    marginBottom: 12,
  },
  infoStep: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  viewResultButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewResultText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Processing Screen Styles
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1B365D',
  },
  processingImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  spinner: {
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  platformsProcessingList: {
    width: '100%',
  },
  platformProcessingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#334155',
    marginBottom: 8,
    borderRadius: 8,
  },
  platformProcessingActive: {
    backgroundColor: '#FF6B35',
  },
  platformProcessingComplete: {
    backgroundColor: '#10B981',
  },
  platformProcessingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  platformProcessingName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  platformProcessingCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Platform Selection Styles
  platformSelectionContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1B365D',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  platformTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 60,
  },
  selectedImagePreview: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedCount: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  platformOptionsContainer: {
    flex: 1,
    padding: 20,
  },
  categoryHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B365D',
    marginTop: 16,
    marginBottom: 12,
  },
  platformOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedPlatformOption: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7ED',
  },
  platformOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B365D',
    marginBottom: 4,
  },
  selectedPlatformName: {
    color: '#FF6B35',
  },
  platformDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedPlatformDescription: {
    color: '#EA580C',
  },
  selectedCheckmark: {
    fontSize: 20,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  platformActionContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Style Selection Styles
  styleSelectionContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  styleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1B365D',
  },
  styleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  styleOptionsContainer: {
    flex: 1,
    padding: 20,
  },
  styleOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedStyleOption: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7ED',
  },
  styleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  styleInfo: {
    flex: 1,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B365D',
    marginBottom: 4,
  },
  selectedStyleName: {
    color: '#FF6B35',
  },
  styleDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedStyleDescription: {
    color: '#EA580C',
  },
  styleActionContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  generateButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Result Screen Styles
  resultContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B365D',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#FF6B35',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  originalImageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  originalImageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  originalImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  successResultsContainer: {
    marginBottom: 24,
  },
  successResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B365D',
    marginBottom: 16,
    textAlign: 'center',
  },
  platformResultItem: {
    flex: 1,
    alignItems: 'center',
    margin: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  platformResultIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  platformResultName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B365D',
    marginBottom: 8,
    textAlign: 'center',
  },
  platformResultImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  platformResultDimensions: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  failedResultsContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  failedResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  failedResultText: {
    fontSize: 12,
    color: '#991B1B',
    marginBottom: 4,
  },
  resultActions: {
    marginTop: 16,
  },
  downloadAllButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  downloadAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  newPhotoButton: {
    backgroundColor: '#1B365D',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newPhotoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Enhanced optimization metrics styles
  optimizationMetrics: {
    marginTop: 8,
    alignItems: 'center',
  },
  qualityScore: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 2,
  },
  optimizationLevel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
  },
});