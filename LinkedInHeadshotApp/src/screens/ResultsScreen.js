/**
 * OmniShot Results Screen
 * Results gallery with platform comparisons and download/share options
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Alert,
  Share,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import DesignSystem from '../utils/omnishotDesignSystem';

const { width, height } = Dimensions.get('window');
const { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, PLATFORM_DIMENSIONS } = DesignSystem;

const PLATFORM_INFO = {
  linkedin: { name: 'LinkedIn', color: COLORS.platform.linkedin, icon: 'linkedin' },
  instagram: { name: 'Instagram', color: COLORS.platform.instagram, icon: 'instagram' },
  facebook: { name: 'Facebook', color: COLORS.platform.facebook, icon: 'facebook' },
  twitter: { name: 'Twitter', color: COLORS.platform.twitter, icon: 'twitter' },
  tiktok: { name: 'TikTok', color: COLORS.platform.tiktok, icon: 'music' },
  youtube: { name: 'YouTube', color: COLORS.platform.youtube, icon: 'youtube' },
};

const VIEW_MODES = {
  GRID: 'grid',
  COMPARISON: 'comparison',
  INDIVIDUAL: 'individual',
};

const ResultsScreen = ({ route, navigation }) => {
  const { 
    photo, 
    selectedStyle, 
    selectedPlatforms, 
    customDimensions, 
    processingTime 
  } = route.params || {};
  
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [selectedPlatform, setSelectedPlatform] = useState(selectedPlatforms[0]);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Mock generated images - in real app, these would come from the AI service
  const generatedImages = selectedPlatforms.map(platformId => ({
    platformId,
    uri: `https://picsum.photos/400/400?random=${platformId}`, // Mock image
    dimensions: PLATFORM_DIMENSIONS[platformId]?.profile || { width: 400, height: 400 },
    optimizations: [
      'Perfect aspect ratio',
      'Professional lighting',
      'Platform-optimized colors',
      'Engagement-focused composition'
    ],
  }));

  useEffect(() => {
    // Entrance animation
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

  const handleDownload = async (platformId) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [platformId]: 0 }));
      
      // Simulate download progress
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          const currentProgress = prev[platformId] || 0;
          if (currentProgress >= 100) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, [platformId]: currentProgress + 10 };
        });
      }, 100);
      
      // Simulate download completion
      setTimeout(() => {
        clearInterval(interval);
        setDownloadProgress(prev => ({ ...prev, [platformId]: 100 }));
        
        Alert.alert(
          'Download Complete',
          `Your ${PLATFORM_INFO[platformId].name} photo has been saved to your device.`,
          [{ text: 'OK' }]
        );
        
        // Clear progress after showing completion
        setTimeout(() => {
          setDownloadProgress(prev => ({ ...prev, [platformId]: undefined }));
        }, 2000);
      }, 1000);
      
    } catch (error) {
      Alert.alert('Download Failed', 'Please try again.');
      setDownloadProgress(prev => ({ ...prev, [platformId]: undefined }));
    }
  };

  const handleShare = async (platformId) => {
    try {
      const platform = PLATFORM_INFO[platformId];
      const result = await Share.share({
        message: `Check out my professional ${platform.name} photo created with OmniShot! #OmniShot #ProfessionalPhotography`,
        url: generatedImages.find(img => img.platformId === platformId)?.uri,
      });
    } catch (error) {
      Alert.alert('Share Failed', 'Please try again.');
    }
  };

  const handleDownloadAll = async () => {
    Alert.alert(
      'Download All Photos',
      `Download all ${selectedPlatforms.length} optimized photos?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download All', 
          onPress: () => {
            selectedPlatforms.forEach(platformId => {
              setTimeout(() => handleDownload(platformId), Math.random() * 1000);
            });
          }
        },
      ]
    );
  };

  const handleGenerateMore = () => {
    navigation.navigate('StyleSelection', { photo });
  };

  const openFullscreen = (image) => {
    setFullscreenImage(image);
    setShowFullscreen(true);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
          accessibilityLabel="Go to home"
          accessibilityRole="button"
        >
          <Icon name="home" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Your Photos</Text>
          <Text style={styles.headerSubtitle}>
            Generated in {Math.round(processingTime / 1000)}s
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.downloadAllButton}
        onPress={handleDownloadAll}
        accessibilityLabel="Download all photos"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[COLORS.secondary[500], COLORS.secondary[600]]}
          style={styles.downloadAllGradient}
        >
          <Icon name="download" size={16} color={COLORS.text.inverse} />
          <Text style={styles.downloadAllText}>All</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      {[
        { mode: VIEW_MODES.GRID, icon: 'grid', label: 'Grid' },
        { mode: VIEW_MODES.COMPARISON, icon: 'columns', label: 'Compare' },
        { mode: VIEW_MODES.INDIVIDUAL, icon: 'maximize-2', label: 'Focus' },
      ].map(({ mode, icon, label }) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.viewModeButton,
            viewMode === mode && styles.activeViewModeButton,
          ]}
          onPress={() => setViewMode(mode)}
          accessibilityLabel={`Switch to ${label} view`}
          accessibilityRole="button"
        >
          <Icon 
            name={icon} 
            size={16} 
            color={viewMode === mode ? COLORS.text.inverse : COLORS.text.secondary} 
          />
          <Text style={[
            styles.viewModeText,
            viewMode === mode && styles.activeViewModeText,
          ]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderImageCard = (image, index) => {
    const platform = PLATFORM_INFO[image.platformId];
    const progress = downloadProgress[image.platformId];
    
    return (
      <Animated.View
        key={image.platformId}
        style={[
          styles.imageCard,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => openFullscreen(image)}
          accessibilityLabel={`View ${platform.name} photo fullscreen`}
          accessibilityRole="button"
        >
          <Image source={{ uri: image.uri }} style={styles.resultImage} />
          
          {/* Platform badge */}
          <View style={[styles.platformBadge, { backgroundColor: platform.color }]}>
            <Text style={styles.platformBadgeText}>{platform.name}</Text>
          </View>
          
          {/* Dimensions info */}
          <View style={styles.dimensionsInfo}>
            <Text style={styles.dimensionsText}>
              {image.dimensions.width}×{image.dimensions.height}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Action buttons */}
        <View style={styles.imageActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.downloadButton]}
            onPress={() => handleDownload(image.platformId)}
            disabled={progress !== undefined && progress < 100}
            accessibilityLabel={`Download ${platform.name} photo`}
            accessibilityRole="button"
          >
            {progress !== undefined && progress < 100 ? (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
                <Text style={styles.progressText}>{progress}%</Text>
              </View>
            ) : (
              <>
                <Icon name="download" size={16} color={COLORS.text.inverse} />
                <Text style={styles.actionButtonText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => handleShare(image.platformId)}
            accessibilityLabel={`Share ${platform.name} photo`}
            accessibilityRole="button"
          >
            <Icon name="share-2" size={16} color={COLORS.secondary[500]} />
            <Text style={[styles.actionButtonText, { color: COLORS.secondary[500] }]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Optimizations list */}
        <View style={styles.optimizations}>
          <Text style={styles.optimizationsTitle}>Optimizations Applied:</Text>
          {image.optimizations.map((opt, optIndex) => (
            <View key={optIndex} style={styles.optimizationItem}>
              <Icon name="check" size={12} color={COLORS.semantic.success} />
              <Text style={styles.optimizationText}>{opt}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderGridView = () => (
    <FlatList
      data={generatedImages}
      keyExtractor={(item) => item.platformId}
      renderItem={({ item, index }) => renderImageCard(item, index)}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
    />
  );

  const renderComparisonView = () => (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.comparisonContainer}
    >
      {generatedImages.map((image, index) => (
        <View key={image.platformId} style={[styles.comparisonSlide, { width }]}>
          {renderImageCard(image, index)}
        </View>
      ))}
    </ScrollView>
  );

  const renderIndividualView = () => {
    const currentImage = generatedImages.find(img => img.platformId === selectedPlatform);
    
    return (
      <View style={styles.individualContainer}>
        {/* Platform selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.platformSelector}
          contentContainerStyle={styles.platformSelectorContent}
        >
          {selectedPlatforms.map(platformId => {
            const platform = PLATFORM_INFO[platformId];
            const isSelected = selectedPlatform === platformId;
            
            return (
              <TouchableOpacity
                key={platformId}
                style={[
                  styles.platformSelectorButton,
                  isSelected && { backgroundColor: platform.color + '20', borderColor: platform.color },
                ]}
                onPress={() => setSelectedPlatform(platformId)}
                accessibilityLabel={`View ${platform.name} photo`}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.platformSelectorText,
                  isSelected && { color: platform.color, fontWeight: '600' },
                ]}>
                  {platform.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Individual image */}
        {currentImage && renderImageCard(currentImage, 0)}
      </View>
    );
  };

  const renderFullscreenModal = () => (
    <Modal
      visible={showFullscreen}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFullscreen(false)}
    >
      <View style={styles.fullscreenContainer}>
        <TouchableOpacity
          style={styles.fullscreenClose}
          onPress={() => setShowFullscreen(false)}
          accessibilityLabel="Close fullscreen view"
          accessibilityRole="button"
        >
          <Icon name="x" size={24} color={COLORS.text.inverse} />
        </TouchableOpacity>
        
        {fullscreenImage && (
          <Image 
            source={{ uri: fullscreenImage.uri }} 
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        )}
        
        {fullscreenImage && (
          <View style={styles.fullscreenInfo}>
            <Text style={styles.fullscreenPlatform}>
              {PLATFORM_INFO[fullscreenImage.platformId]?.name}
            </Text>
            <Text style={styles.fullscreenDimensions}>
              {fullscreenImage.dimensions.width} × {fullscreenImage.dimensions.height}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );

  const renderGenerateMoreButton = () => (
    <View style={styles.generateMoreContainer}>
      <TouchableOpacity
        style={styles.generateMoreButton}
        onPress={handleGenerateMore}
        accessibilityLabel="Generate more photos"
        accessibilityRole="button"
      >
        <Icon name="plus" size={20} color={COLORS.secondary[500]} />
        <Text style={styles.generateMoreText}>Generate More Styles</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderViewModeSelector()}
      
      <View style={styles.content}>
        {viewMode === VIEW_MODES.GRID && renderGridView()}
        {viewMode === VIEW_MODES.COMPARISON && renderComparisonView()}
        {viewMode === VIEW_MODES.INDIVIDUAL && renderIndividualView()}
      </View>
      
      {renderGenerateMoreButton()}
      {renderFullscreenModal()}
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
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  
  headerTitle: {},
  
  headerTitleText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
  },
  
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  
  downloadAllButton: {
    borderRadius: RADIUS.md,
  },
  
  downloadAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  
  downloadAllText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  
  viewModeSelector: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background.secondary,
    gap: SPACING.xs,
  },
  
  activeViewModeButton: {
    backgroundColor: COLORS.secondary[500],
  },
  
  viewModeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  activeViewModeText: {
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  
  content: {
    flex: 1,
  },
  
  gridContainer: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  
  gridRow: {
    justifyContent: 'space-between',
  },
  
  imageCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.soft,
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  
  imageContainer: {
    position: 'relative',
  },
  
  resultImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.background.tertiary,
  },
  
  platformBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  
  platformBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
    fontSize: 10,
  },
  
  dimensionsInfo: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.background.overlay,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  
  dimensionsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontSize: 10,
  },
  
  imageActions: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  
  downloadButton: {
    backgroundColor: COLORS.secondary[500],
  },
  
  shareButton: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.secondary[500],
  },
  
  actionButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  
  progressContainer: {
    position: 'relative',
    width: '100%',
    height: 20,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: COLORS.text.inverse,
    borderRadius: RADIUS.sm,
  },
  
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondary[700],
    fontWeight: '600',
    fontSize: 10,
  },
  
  optimizations: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  
  optimizationsTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  
  optimizationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: SPACING.xs,
  },
  
  optimizationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontSize: 10,
  },
  
  comparisonContainer: {
    paddingVertical: SPACING.lg,
  },
  
  comparisonSlide: {
    paddingHorizontal: SPACING.lg,
  },
  
  individualContainer: {
    flex: 1,
  },
  
  platformSelector: {
    paddingVertical: SPACING.md,
  },
  
  platformSelectorContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  
  platformSelectorButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  
  platformSelectorText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  fullscreenContainer: {
    flex: 1,
    backgroundColor: COLORS.background.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  fullscreenClose: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    zIndex: 1,
    padding: SPACING.sm,
    backgroundColor: COLORS.background.overlay,
    borderRadius: RADIUS.full,
  },
  
  fullscreenImage: {
    width: width - SPACING.xl,
    height: height * 0.7,
  },
  
  fullscreenInfo: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    backgroundColor: COLORS.background.overlay,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  
  fullscreenPlatform: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.inverse,
    marginBottom: SPACING.xs,
  },
  
  fullscreenDimensions: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.inverse + 'CC',
  },
  
  generateMoreContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.subtle,
  },
  
  generateMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.secondary[500],
    backgroundColor: COLORS.background.primary,
    gap: SPACING.sm,
  },
  
  generateMoreText: {
    ...TYPOGRAPHY.button,
    color: COLORS.secondary[500],
    fontWeight: '600',
  },
});

export default ResultsScreen;