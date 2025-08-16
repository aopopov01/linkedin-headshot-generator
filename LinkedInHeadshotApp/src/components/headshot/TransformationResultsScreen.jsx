/**
 * Transformation Results Screen
 * Displays results from dual-provider headshot transformations
 * 
 * Features:
 * - High-quality image gallery with zoom
 * - Provider comparison and analytics
 * - Cost breakdown and savings insights
 * - Social sharing and export options
 * - Quality rating and feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
  Share,
  Alert,
  Modal,
  PanResponder
} from 'react-native';
import { Card, Button, Chip, FAB, Portal, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

import { CostTracker } from '../../services/costTrackingService';
import { AnalyticsService } from '../../services/analyticsService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Provider UI Configuration
const PROVIDER_COLORS = {
  BetterPic: '#6366f1',
  Replicate: '#06b6d4'
};

export default function TransformationResultsScreen({ 
  navigation, 
  route 
}) {
  const { result, originalImage, style, provider } = route.params;
  
  // State management
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [qualityRating, setQualityRating] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [shareProgress, setShareProgress] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Services
  const [costTracker] = useState(() => new CostTracker());
  const [analytics] = useState(() => new AnalyticsService());

  // Pan responder for image zoom/pan
  const panResponder = useRef();
  const [imageScale, setImageScale] = useState(1);
  const [imageTranslate, setImageTranslate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadCostBreakdown();
    trackResultsView();
    initializePanResponder();
  }, []);

  const loadCostBreakdown = async () => {
    try {
      if (result.cost) {
        const breakdown = {
          cost: result.cost,
          provider: result.provider,
          processingTime: result.processingTime,
          quality: result.quality || 'Standard',
          savings: calculatePotentialSavings()
        };
        setCostBreakdown(breakdown);
      }
    } catch (error) {
      console.error('Failed to load cost breakdown:', error);
    }
  };

  const calculatePotentialSavings = () => {
    const currentCost = result.cost || 0;
    const alternativeCost = result.provider === 'BetterPic' ? 0.035 : 1.16;
    const savings = Math.abs(alternativeCost - currentCost);
    
    return {
      amount: savings,
      percentage: ((savings / Math.max(currentCost, alternativeCost)) * 100).toFixed(1),
      direction: currentCost < alternativeCost ? 'saved' : 'premium_paid'
    };
  };

  const trackResultsView = async () => {
    await analytics.trackEvent('transformation_results_viewed', {
      provider: result.provider,
      style,
      imageCount: result.outputs?.length || 0,
      processingTime: result.processingTime,
      cost: result.cost
    });
  };

  const initializePanResponder = () => {
    panResponder.current = PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Handle pinch-to-zoom and pan gestures
        setImageTranslate({
          x: gestureState.dx,
          y: gestureState.dy
        });
      },
      onPanResponderRelease: () => {
        // Reset position
        setImageTranslate({ x: 0, y: 0 });
      }
    });
  };

  const handleImagePress = (index) => {
    setSelectedImageIndex(index);
    setShowFullscreen(true);
  };

  const handleSaveImage = async (imageUrl, index) => {
    try {
      setSavingProgress(true);

      // Request permissions
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please grant camera roll permissions to save images.');
        return;
      }

      // Download image
      const timestamp = new Date().getTime();
      const filename = `headshot_${style}_${index}_${timestamp}.jpg`;
      const localUri = FileSystem.documentDirectory + filename;
      
      const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);
      
      if (downloadResult.status === 200) {
        // Save to media library
        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
        
        Alert.alert('Success', 'Image saved to your photo library!');
        
        // Track save action
        await analytics.trackEvent('image_saved', {
          provider: result.provider,
          style,
          imageIndex: index
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save image. Please try again.');
      console.error('Save image error:', error);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleShareImage = async (imageUrl, index) => {
    try {
      setShareProgress(true);

      const shareResult = await Share.share({
        message: `Check out my professional headshot created with ${result.provider}!`,
        url: imageUrl
      });

      if (shareResult.action === Share.sharedAction) {
        await analytics.trackEvent('image_shared', {
          provider: result.provider,
          style,
          imageIndex: index,
          shareMethod: shareResult.activityType || 'unknown'
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share image. Please try again.');
      console.error('Share image error:', error);
    } finally {
      setShareProgress(false);
    }
  };

  const handleQualityRating = async (rating) => {
    setQualityRating(rating);
    
    await analytics.trackEvent('quality_rating_submitted', {
      provider: result.provider,
      style,
      rating,
      cost: result.cost,
      processingTime: result.processingTime
    });

    // Show thank you message
    Alert.alert('Thank you!', 'Your feedback helps us improve our service.');
  };

  const renderImageGallery = () => (
    <Card style={styles.galleryCard}>
      <Card.Content>
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryTitle}>Your Professional Headshots</Text>
          <Badge 
            style={[
              styles.providerBadge, 
              { backgroundColor: PROVIDER_COLORS[result.provider] }
            ]}
          >
            {result.provider}
          </Badge>
        </View>
        
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 32));
            setSelectedImageIndex(index);
          }}
        >
          {result.outputs?.map((imageUrl, index) => (
            <TouchableOpacity
              key={index}
              style={styles.imageContainer}
              onPress={() => handleImagePress(index)}
            >
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.galleryImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <TouchableOpacity 
                  style={styles.overlayButton}
                  onPress={() => handleSaveImage(imageUrl, index)}
                >
                  <Text style={styles.overlayButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.overlayButton}
                  onPress={() => handleShareImage(imageUrl, index)}
                >
                  <Text style={styles.overlayButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )) || []}
        </ScrollView>
        
        <View style={styles.imageIndicators}>
          {result.outputs?.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                selectedImageIndex === index && styles.indicatorActive
              ]}
            />
          )) || []}
        </View>
      </Card.Content>
    </Card>
  );

  const renderBeforeAfter = () => (
    <Card style={styles.comparisonCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Before & After</Text>
        
        <View style={styles.comparisonContainer}>
          <View style={styles.comparisonImage}>
            <Text style={styles.comparisonLabel}>Original</Text>
            <Image 
              source={{ uri: originalImage }} 
              style={styles.comparisonImageStyle}
              resizeMode="cover"
            />
          </View>
          
          <View style={styles.comparisonArrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
          
          <View style={styles.comparisonImage}>
            <Text style={styles.comparisonLabel}>Transformed</Text>
            <Image 
              source={{ uri: result.outputs?.[selectedImageIndex] || result.outputs?.[0] }} 
              style={styles.comparisonImageStyle}
              resizeMode="cover"
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderCostBreakdown = () => {
    if (!costBreakdown) return null;
    
    return (
      <Card style={styles.costCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Cost Breakdown</Text>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Provider</Text>
            <Text style={styles.costValue}>{costBreakdown.provider}</Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Processing Cost</Text>
            <Text style={styles.costValue}>${costBreakdown.cost.toFixed(3)}</Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Processing Time</Text>
            <Text style={styles.costValue}>
              {Math.round(costBreakdown.processingTime / 1000)}s
            </Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Quality Tier</Text>
            <Text style={styles.costValue}>{costBreakdown.quality}</Text>
          </View>
          
          {costBreakdown.savings && (
            <View style={styles.savingsSection}>
              <View style={styles.savingsRow}>
                <Text style={styles.savingsLabel}>
                  {costBreakdown.savings.direction === 'saved' ? 'You saved' : 'Premium paid'}
                </Text>
                <Text style={[
                  styles.savingsAmount,
                  costBreakdown.savings.direction === 'saved' ? styles.savingsPositive : styles.savingsPremium
                ]}>
                  ${costBreakdown.savings.amount.toFixed(3)} ({costBreakdown.savings.percentage}%)
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderQualityRating = () => (
    <Card style={styles.ratingCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Rate Quality</Text>
        <Text style={styles.ratingSubtitle}>How satisfied are you with the results?</Text>
        
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleQualityRating(star)}
              style={styles.starButton}
            >
              <Text style={[
                styles.star,
                star <= qualityRating && styles.starSelected
              ]}>
                ⭐
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {qualityRating > 0 && (
          <Text style={styles.ratingThankYou}>
            Thank you for your feedback!
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderFullscreenModal = () => (
    <Modal
      visible={showFullscreen}
      transparent={true}
      onRequestClose={() => setShowFullscreen(false)}
    >
      <View style={styles.fullscreenContainer}>
        <TouchableOpacity
          style={styles.fullscreenClose}
          onPress={() => setShowFullscreen(false)}
        >
          <Text style={styles.fullscreenCloseText}>✕</Text>
        </TouchableOpacity>
        
        <View
          style={styles.fullscreenImageContainer}
          {...(panResponder.current?.panHandlers || {})}
        >
          <Image
            source={{ uri: result.outputs?.[selectedImageIndex] }}
            style={[
              styles.fullscreenImage,
              {
                transform: [
                  { scale: imageScale },
                  { translateX: imageTranslate.x },
                  { translateY: imageTranslate.y }
                ]
              }
            ]}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.fullscreenActions}>
          <Button
            mode="contained"
            onPress={() => handleSaveImage(result.outputs?.[selectedImageIndex], selectedImageIndex)}
            loading={savingProgress}
            style={styles.fullscreenButton}
          >
            Save to Photos
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleShareImage(result.outputs?.[selectedImageIndex], selectedImageIndex)}
            loading={shareProgress}
            style={styles.fullscreenButton}
          >
            Share
          </Button>
        </View>
      </View>
    </Modal>
  );

  const renderFloatingActions = () => (
    <Portal>
      <FAB.Group
        open={fabOpen}
        icon={fabOpen ? 'close' : 'dots-horizontal'}
        actions={[
          {
            icon: 'download',
            label: 'Save All',
            onPress: () => {
              result.outputs?.forEach((url, index) => {
                handleSaveImage(url, index);
              });
            }
          },
          {
            icon: 'share',
            label: 'Share Gallery',
            onPress: () => {
              // Share multiple images or create a collage
              Alert.alert('Coming Soon', 'Gallery sharing will be available in the next update!');
            }
          },
          {
            icon: 'star',
            label: 'Rate Quality',
            onPress: () => {
              // Scroll to rating section
              Alert.alert('Scroll Down', 'Please scroll down to rate the quality of your headshots.');
            }
          }
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        style={styles.fab}
      />
    </Portal>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {renderImageGallery()}
        {renderBeforeAfter()}
        {renderCostBreakdown()}
        {renderQualityRating()}
        
        <View style={styles.spacer} />
      </ScrollView>
      
      {renderFullscreenModal()}
      {renderFloatingActions()}
      
      <View style={styles.bottomActions}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.bottomButton}
        >
          Create Another
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Home')}
          style={styles.bottomButton}
        >
          Done
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollView: {
    flex: 1
  },
  scrollViewContent: {
    padding: 16
  },
  galleryCard: {
    marginBottom: 16,
    elevation: 4
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  galleryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  providerBadge: {
    color: '#ffffff'
  },
  imageScroll: {
    marginHorizontal: -16
  },
  imageContainer: {
    width: screenWidth - 32,
    height: 300,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  galleryImage: {
    width: '100%',
    height: '100%'
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 12
  },
  overlayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20
  },
  overlayButtonText: {
    color: '#ffffff',
    fontWeight: '600'
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
    marginHorizontal: 4
  },
  indicatorActive: {
    backgroundColor: '#6366f1'
  },
  comparisonCard: {
    marginBottom: 16,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  comparisonImage: {
    flex: 1,
    alignItems: 'center'
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8
  },
  comparisonImageStyle: {
    width: 120,
    height: 160,
    borderRadius: 8
  },
  comparisonArrow: {
    paddingHorizontal: 16
  },
  arrowText: {
    fontSize: 24,
    color: '#6366f1'
  },
  costCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#f0fdf4'
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  costLabel: {
    fontSize: 14,
    color: '#374151'
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669'
  },
  savingsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d1fae5'
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  savingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534'
  },
  savingsAmount: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  savingsPositive: {
    color: '#059669'
  },
  savingsPremium: {
    color: '#dc2626'
  },
  ratingCard: {
    marginBottom: 16,
    elevation: 2
  },
  ratingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16
  },
  starButton: {
    paddingHorizontal: 8
  },
  star: {
    fontSize: 32,
    opacity: 0.3
  },
  starSelected: {
    opacity: 1
  },
  ratingThankYou: {
    textAlign: 'center',
    fontSize: 14,
    color: '#059669',
    fontWeight: '600'
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)'
  },
  fullscreenClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullscreenCloseText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  fullscreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullscreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8
  },
  fullscreenActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20
  },
  fullscreenButton: {
    flex: 1,
    marginHorizontal: 8
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  bottomButton: {
    flex: 1,
    marginHorizontal: 8
  },
  spacer: {
    height: 32
  }
});