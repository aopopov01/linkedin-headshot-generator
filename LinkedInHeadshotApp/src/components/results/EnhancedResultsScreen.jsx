/**
 * Enhanced Results Screen - Advanced Results Presentation
 * Addresses UX issues: Limited sharing options, no preview mode, limited metadata
 * Implements preview modes, comparison views, and better sharing workflow
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Share,
  Alert,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { BRAND_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/branding';
import { HelpButton, HELP_CONTENT } from '../shared/HelpSystem';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EnhancedResultsScreen = ({
  selectedImage,
  generatedImages = {},
  onNewPhoto,
  onShowHelp,
  platformOptions = [],
}) => {
  const [previewMode, setPreviewMode] = useState(null); // null, 'fullscreen', 'comparison'
  const [selectedResultForPreview, setSelectedResultForPreview] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedResultForShare, setSelectedResultForShare] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});

  const successfulResults = Object.entries(generatedImages).filter(([_, data]) => data.success);
  const failedResults = Object.entries(generatedImages).filter(([_, data]) => !data.success);

  // Full screen preview
  const showFullscreenPreview = (result) => {
    setSelectedResultForPreview(result);
    setPreviewMode('fullscreen');
  };

  // Comparison view
  const showComparisonView = () => {
    setPreviewMode('comparison');
  };

  // Share individual image
  const shareIndividualImage = async (platformId, data) => {
    try {
      if (Platform.OS === 'web') {
        // Web sharing
        if (navigator.share) {
          await navigator.share({
            title: `Professional photo for ${data.platform}`,
            url: data.imageUri,
          });
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(data.imageUri);
          Alert.alert('Link Copied', 'Image link copied to clipboard');
        }
      } else {
        // Mobile sharing
        await Share.share({
          title: `Professional photo for ${data.platform}`,
          url: data.imageUri,
          message: `Check out my professional photo optimized for ${data.platform}!`,
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('Share Failed', 'Could not share the image. Please try again.');
    }
  };

  // Download individual image
  const downloadIndividualImage = async (platformId, data) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [platformId]: 'downloading' }));
      
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to save images.');
        setDownloadProgress(prev => ({ ...prev, [platformId]: 'failed' }));
        return;
      }

      // Save to media library
      await MediaLibrary.createAssetAsync(data.imageUri);
      
      setDownloadProgress(prev => ({ ...prev, [platformId]: 'success' }));
      
      setTimeout(() => {
        setDownloadProgress(prev => ({ ...prev, [platformId]: null }));
      }, 2000);

      Alert.alert('Success', `${data.platform} image saved to Photos!`);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadProgress(prev => ({ ...prev, [platformId]: 'failed' }));
      
      setTimeout(() => {
        setDownloadProgress(prev => ({ ...prev, [platformId]: null }));
      }, 2000);

      Alert.alert('Download Failed', 'Could not save the image. Please try again.');
    }
  };

  // Download all images
  const downloadAllImages = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to save images.');
        return;
      }

      let savedCount = 0;
      let failedCount = 0;

      for (const [platformId, data] of successfulResults) {
        try {
          await MediaLibrary.createAssetAsync(data.imageUri);
          savedCount++;
        } catch (error) {
          failedCount++;
          console.error(`Failed to save ${platformId}:`, error);
        }
      }

      if (savedCount > 0) {
        const message = failedCount > 0 
          ? `${savedCount}/${successfulResults.length} images saved successfully.`
          : `All ${savedCount} images saved to Photos!`;
          
        Alert.alert('Download Complete', message);
      } else {
        Alert.alert('Download Failed', 'Could not save any images. Please try again.');
      }
    } catch (error) {
      console.error('Batch download failed:', error);
      Alert.alert('Download Failed', 'Could not save images. Please try again.');
    }
  };

  // Render result card
  const renderResultCard = ({ item: [platformId, data], index }) => {
    const platform = platformOptions.find(p => p.id === platformId);
    const downloadState = downloadProgress[platformId];

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultCardHeader}>
          <Text style={styles.resultPlatformIcon}>{platform?.icon || '📱'}</Text>
          <View style={styles.resultPlatformInfo}>
            <Text style={styles.resultPlatformName}>{data.platform}</Text>
            <Text style={styles.resultDimensions}>{data.dimensions}</Text>
          </View>
          
          {data.optimizationMetrics?.qualityScore && (
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityScore}>
                {data.optimizationMetrics.qualityScore}%
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.resultImageContainer}
          onPress={() => showFullscreenPreview([platformId, data])}
        >
          <Image source={{ uri: data.imageUri }} style={styles.resultImage} />
          <View style={styles.resultImageOverlay}>
            <Text style={styles.resultImageOverlayText}>Tap to preview</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.resultActions}>
          <TouchableOpacity
            style={styles.resultActionButton}
            onPress={() => shareIndividualImage(platformId, data)}
          >
            <Text style={styles.resultActionIcon}>📤</Text>
            <Text style={styles.resultActionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resultActionButton,
              downloadState === 'downloading' && styles.resultActionButtonDisabled,
            ]}
            onPress={() => downloadIndividualImage(platformId, data)}
            disabled={downloadState === 'downloading'}
          >
            <Text style={styles.resultActionIcon}>
              {downloadState === 'downloading' ? '⏳' : 
               downloadState === 'success' ? '✅' : 
               downloadState === 'failed' ? '❌' : '💾'}
            </Text>
            <Text style={styles.resultActionText}>
              {downloadState === 'downloading' ? 'Saving...' : 
               downloadState === 'success' ? 'Saved' : 
               downloadState === 'failed' ? 'Failed' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {data.optimizationMetrics && (
          <View style={styles.resultMetrics}>
            <Text style={styles.resultMetricsText}>
              Size: {data.optimizationMetrics.fileSize || 'Optimized'} • 
              Level: {data.optimizationMetrics.optimizationLevel === 'premium' ? 'AI Enhanced' : 'Basic'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Fullscreen Preview Modal
  const renderFullscreenPreview = () => {
    if (!selectedResultForPreview) return null;
    
    const [platformId, data] = selectedResultForPreview;
    const platform = platformOptions.find(p => p.id === platformId);

    return (
      <Modal visible={previewMode === 'fullscreen'} animationType="fade">
        <View style={styles.fullscreenContainer}>
          <SafeAreaView style={styles.fullscreenContent}>
            <View style={styles.fullscreenHeader}>
              <TouchableOpacity
                style={styles.fullscreenCloseButton}
                onPress={() => setPreviewMode(null)}
              >
                <Text style={styles.fullscreenCloseText}>✕</Text>
              </TouchableOpacity>
              
              <View style={styles.fullscreenHeaderInfo}>
                <Text style={styles.fullscreenPlatformName}>{data.platform}</Text>
                <Text style={styles.fullscreenDimensions}>{data.dimensions}</Text>
              </View>

              <View style={styles.fullscreenActions}>
                <TouchableOpacity
                  style={styles.fullscreenActionButton}
                  onPress={() => shareIndividualImage(platformId, data)}
                >
                  <Text style={styles.fullscreenActionIcon}>📤</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.fullscreenActionButton}
                  onPress={() => downloadIndividualImage(platformId, data)}
                >
                  <Text style={styles.fullscreenActionIcon}>💾</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fullscreenImageContainer}>
              <Image 
                source={{ uri: data.imageUri }} 
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.fullscreenFooter}>
              <Text style={styles.fullscreenFooterText}>
                Professional photo optimized for {data.platform}
              </Text>
              {data.optimizationMetrics?.qualityScore && (
                <Text style={styles.fullscreenQualityText}>
                  Quality Score: {data.optimizationMetrics.qualityScore}%
                </Text>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  // Comparison View Modal
  const renderComparisonView = () => {
    return (
      <Modal visible={previewMode === 'comparison'} animationType="slide">
        <View style={styles.comparisonContainer}>
          <SafeAreaView style={styles.comparisonContent}>
            <View style={styles.comparisonHeader}>
              <TouchableOpacity
                style={styles.comparisonCloseButton}
                onPress={() => setPreviewMode(null)}
              >
                <Text style={styles.comparisonCloseText}>✕ Close</Text>
              </TouchableOpacity>
              
              <Text style={styles.comparisonTitle}>Before & After Comparison</Text>
              
              <View style={styles.comparisonSpacer} />
            </View>

            <ScrollView style={styles.comparisonScroll}>
              <View style={styles.comparisonSection}>
                <Text style={styles.comparisonSectionTitle}>Original Photo</Text>
                <Image source={{ uri: selectedImage }} style={styles.comparisonImage} />
              </View>

              <View style={styles.comparisonSection}>
                <Text style={styles.comparisonSectionTitle}>Optimized Results</Text>
                <FlatList
                  data={successfulResults}
                  renderItem={({ item: [platformId, data] }) => {
                    const platform = platformOptions.find(p => p.id === platformId);
                    return (
                      <View style={styles.comparisonResultItem}>
                        <Text style={styles.comparisonResultName}>
                          {platform?.icon} {data.platform}
                        </Text>
                        <Image source={{ uri: data.imageUri }} style={styles.comparisonResultImage} />
                      </View>
                    );
                  }}
                  numColumns={2}
                  scrollEnabled={false}
                  keyExtractor={([platformId]) => platformId}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎉 OmniShot Complete!</Text>
        <HelpButton onPress={() => onShowHelp('results_explanation')} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>
            {successfulResults.length}/{successfulResults.length + failedResults.length} platforms optimized
          </Text>
          <Text style={styles.summarySubtitle}>
            Professional AI-enhanced photos ready for all your platforms
          </Text>
        </View>

        {/* View Options */}
        <View style={styles.viewOptions}>
          <TouchableOpacity
            style={styles.viewOptionButton}
            onPress={showComparisonView}
          >
            <Text style={styles.viewOptionIcon}>🔍</Text>
            <Text style={styles.viewOptionText}>Compare Before/After</Text>
          </TouchableOpacity>
        </View>

        {/* Successful Results */}
        {successfulResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsSectionTitle}>✅ Optimized Images</Text>
            <FlatList
              data={successfulResults}
              renderItem={renderResultCard}
              numColumns={1}
              scrollEnabled={false}
              keyExtractor={([platformId]) => platformId}
              contentContainerStyle={styles.resultsList}
            />
          </View>
        )}

        {/* Failed Results */}
        {failedResults.length > 0 && (
          <View style={styles.failedSection}>
            <Text style={styles.failedSectionTitle}>⚠️ Processing Issues</Text>
            {failedResults.map(([platformId, data]) => {
              const platform = platformOptions.find(p => p.id === platformId);
              return (
                <View key={platformId} style={styles.failedItem}>
                  <Text style={styles.failedItemIcon}>{platform?.icon || '📱'}</Text>
                  <Text style={styles.failedItemText}>
                    {data.platform}: {data.error || 'Processing failed'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.downloadAllButton}
          onPress={downloadAllImages}
        >
          <Text style={styles.downloadAllButtonText}>
            📱 Save All Images ({successfulResults.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newPhotoButton}
          onPress={onNewPhoto}
        >
          <Text style={styles.newPhotoButtonText}>🚀 Create New OmniShot</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderFullscreenPreview()}
      {renderComparisonView()}
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
  headerTitle: {
    fontSize: TYPOGRAPHY.SIZE_HEADING,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.WHITE,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  summarySection: {
    alignItems: 'center',
    paddingVertical: SPACING.LG,
    backgroundColor: BRAND_COLORS.GRAY_50,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  summarySubtitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: BRAND_COLORS.GRAY_600,
    textAlign: 'center',
    paddingHorizontal: SPACING.LG,
  },
  viewOptions: {
    paddingHorizontal: SPACING.PADDING_SCREEN,
    paddingVertical: SPACING.MD,
  },
  viewOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_COLORS.SECONDARY + '20',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: BRAND_COLORS.SECONDARY,
  },
  viewOptionIcon: {
    fontSize: 20,
    marginRight: SPACING.SM,
  },
  viewOptionText: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: BRAND_COLORS.SECONDARY,
  },
  resultsSection: {
    paddingHorizontal: SPACING.PADDING_SCREEN,
    paddingBottom: SPACING.LG,
  },
  resultsSectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.MD,
  },
  resultsList: {
    gap: SPACING.MD,
  },
  resultCard: {
    backgroundColor: BRAND_COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: BRAND_COLORS.GRAY_200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  resultPlatformIcon: {
    fontSize: 24,
    marginRight: SPACING.MD,
  },
  resultPlatformInfo: {
    flex: 1,
  },
  resultPlatformName: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.PRIMARY,
  },
  resultDimensions: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_500,
  },
  qualityBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  qualityScore: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  resultImageContainer: {
    position: 'relative',
    marginBottom: SPACING.MD,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.MD,
  },
  resultImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: SPACING.SM,
    borderBottomLeftRadius: BORDER_RADIUS.MD,
    borderBottomRightRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  resultImageOverlayText: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  resultActions: {
    flexDirection: 'row',
    gap: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  resultActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_COLORS.GRAY_50,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: BRAND_COLORS.GRAY_200,
  },
  resultActionButtonDisabled: {
    opacity: 0.6,
  },
  resultActionIcon: {
    fontSize: 16,
    marginRight: SPACING.XS,
  },
  resultActionText: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
    color: BRAND_COLORS.PRIMARY,
  },
  resultMetrics: {
    alignItems: 'center',
  },
  resultMetricsText: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_500,
    fontStyle: 'italic',
  },
  failedSection: {
    paddingHorizontal: SPACING.PADDING_SCREEN,
    paddingBottom: SPACING.LG,
  },
  failedSectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: '#DC2626',
    marginBottom: SPACING.MD,
  },
  failedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.SM,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  failedItemIcon: {
    fontSize: 20,
    marginRight: SPACING.MD,
  },
  failedItemText: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: '#991B1B',
    flex: 1,
  },
  actionButtons: {
    padding: SPACING.PADDING_SCREEN,
    gap: SPACING.MD,
    backgroundColor: BRAND_COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.GRAY_200,
  },
  downloadAllButton: {
    backgroundColor: BRAND_COLORS.SECONDARY,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  downloadAllButtonText: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  newPhotoButton: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  newPhotoButtonText: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },

  // Fullscreen Preview Styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullscreenContent: {
    flex: 1,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullscreenCloseButton: {
    padding: SPACING.SM,
  },
  fullscreenCloseText: {
    color: BRAND_COLORS.WHITE,
    fontSize: 18,
  },
  fullscreenHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  fullscreenPlatformName: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  fullscreenDimensions: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    opacity: 0.8,
  },
  fullscreenActions: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  fullscreenActionButton: {
    padding: SPACING.SM,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.SM,
  },
  fullscreenActionIcon: {
    fontSize: 20,
  },
  fullscreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  fullscreenFooter: {
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullscreenFooterText: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY,
    textAlign: 'center',
  },
  fullscreenQualityText: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    opacity: 0.8,
    marginTop: SPACING.XS,
  },

  // Comparison View Styles
  comparisonContainer: {
    flex: 1,
    backgroundColor: BRAND_COLORS.WHITE,
  },
  comparisonContent: {
    flex: 1,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.PADDING_SCREEN,
    paddingVertical: SPACING.MD,
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  comparisonCloseButton: {
    padding: SPACING.SM,
  },
  comparisonCloseText: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },
  comparisonTitle: {
    color: BRAND_COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE_HEADING,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    flex: 1,
    textAlign: 'center',
  },
  comparisonSpacer: {
    width: 80,
  },
  comparisonScroll: {
    flex: 1,
  },
  comparisonSection: {
    paddingHorizontal: SPACING.PADDING_SCREEN,
    paddingVertical: SPACING.LG,
  },
  comparisonSectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  comparisonImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.LG,
    alignSelf: 'center',
  },
  comparisonResultItem: {
    flex: 1,
    margin: SPACING.SM,
    alignItems: 'center',
  },
  comparisonResultName: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  comparisonResultImage: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 2,
    borderColor: BRAND_COLORS.SECONDARY,
  },
});

export default EnhancedResultsScreen;