/**
 * Production LinkedIn Headshot App
 * Integrates the multi-tier AI service with BetterPic, Replicate FLUX.1/InstantID
 * Professional quality headshot transformation with smart fallbacks
 */

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
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import ProductionAIProcessor from './src/components/ai/ProductionAIProcessor';
import ProductionAIService from './src/services/productionAIService';

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showStyleSelection, setShowStyleSelection] = useState(false);
  const [showAIProcessor, setShowAIProcessor] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('executive');
  const [processingResult, setProcessingResult] = useState(null);
  const [usageStats, setUsageStats] = useState(null);

  // Professional headshot styles optimized for the production AI service
  const styleOptions = [
    {
      id: 'executive',
      name: 'Executive Professional',
      description: 'Premium CEO/C-level executive styling',
      prompt: 'Ultra-realistic professional executive headshot, premium business suit, confident authoritative expression',
      icon: '👔',
      recommended: true,
      tier: 'BetterPic Premium'
    },
    {
      id: 'creative',
      name: 'Creative Professional',
      description: 'Modern creative industry professional',
      prompt: 'Professional creative director headshot, stylish modern business casual, confident creative expression',
      icon: '🎨',
      tier: 'BetterPic Standard'
    },
    {
      id: 'healthcare',
      name: 'Healthcare Professional',
      description: 'Medical and healthcare industry',
      prompt: 'Professional healthcare worker headshot, medical attire, trustworthy caring expression',
      icon: '⚕️',
      tier: 'InstantID (Face Preservation)'
    },
    {
      id: 'finance',
      name: 'Finance & Banking',
      description: 'Wall Street financial professional',
      prompt: 'High-end financial professional headshot, impeccable business suit, confident trustworthy expression',
      icon: '🏛️',
      tier: 'BetterPic Premium'
    },
    {
      id: 'tech',
      name: 'Technology Leader',
      description: 'Silicon Valley tech executive',
      prompt: 'Professional technology leader headshot, modern business casual, innovative forward-thinking expression',
      icon: '💻',
      tier: 'FLUX.1 Dev'
    },
    {
      id: 'startup',
      name: 'Startup Founder',
      description: 'Entrepreneurial and innovative',
      prompt: 'Modern startup founder headshot, contemporary business casual, innovative confident expression',
      icon: '🚀',
      tier: 'FLUX.1 Schnell'
    }
  ];

  // Load usage stats on component mount
  useEffect(() => {
    loadUsageStats();
  }, []);

  /**
   * Load current usage statistics
   */
  const loadUsageStats = () => {
    try {
      const stats = ProductionAIService.getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.warn('Failed to load usage stats:', error);
    }
  };

  /**
   * Take photo with camera
   */
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9, // Higher quality for AI processing
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setShowStyleSelection(true);
      }
    } catch (error) {
      console.error('Take Photo Error:', error);
      Alert.alert('Error', 'Camera failed to open');
    }
  };

  /**
   * Upload photo from library
   */
  const uploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is needed');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9, // Higher quality for AI processing
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setShowStyleSelection(true);
      }
    } catch (error) {
      console.error('Upload Photo Error:', error);
      Alert.alert('Error', 'Photo upload failed');
    }
  };

  /**
   * Handle AI processing completion
   */
  const handleProcessingComplete = (result) => {
    console.log('Processing completed:', result);
    setProcessingResult(result);
    setGeneratedImages(result.result?.images || []);
    setShowAIProcessor(false);
    setShowResult(true);
    setIsProcessing(false);
    
    // Update usage stats
    loadUsageStats();

    // Show success alert with details
    Alert.alert(
      '🎉 Professional Headshot Complete!', 
      `✨ Processing completed successfully using ${result.tier}\n` +
      `⏱️ Processing time: ${Math.round(result.processingTime / 1000)}s\n` +
      `💰 Cost: $${result.cost.toFixed(2)}\n\n` +
      `Your LinkedIn-ready professional headshot is ready!`,
      [{ text: 'View Results', onPress: () => setShowResult(true) }]
    );
  };

  /**
   * Handle AI processing error
   */
  const handleProcessingError = (error) => {
    console.error('Processing failed:', error);
    setIsProcessing(false);
    setShowAIProcessor(false);
    
    Alert.alert(
      'Processing Failed',
      `We encountered an issue: ${error.message}\n\n` +
      'All our AI services are temporarily unavailable. Please try again later.',
      [
        { text: 'Retry Later', style: 'cancel' },
        { text: 'Contact Support', onPress: () => {} }
      ]
    );
  };

  /**
   * Start AI processing with selected style
   */
  const startAIProcessing = () => {
    setShowStyleSelection(false);
    setShowAIProcessor(true);
    setIsProcessing(true);
  };

  /**
   * Reset app to initial state
   */
  const resetApp = () => {
    setSelectedImage(null);
    setGeneratedImages([]);
    setProcessingResult(null);
    setShowResult(false);
    setShowStyleSelection(false);
    setShowAIProcessor(false);
    setSelectedStyle('executive');
    setIsProcessing(false);
  };

  /**
   * Download generated images
   */
  const downloadImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need permission to save photos to your library.');
        return;
      }

      if (generatedImages.length === 0) {
        Alert.alert('Error', 'No image to download');
        return;
      }

      // Download the first generated image (you could implement selection)
      const imageUri = generatedImages[0];
      await MediaLibrary.createAssetAsync(imageUri);
      
      Alert.alert('✅ Saved Successfully!', 'Your professional headshot has been saved to Photos.');
      
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save Failed', 'Could not save image to Photos. Please try again.');
    }
  };

  /**
   * Share results or usage stats
   */
  const showUsageStats = () => {
    if (!usageStats) return;

    Alert.alert(
      'Usage Statistics',
      `Total Processed: ${usageStats.totalProcessed} images\n` +
      `Total Cost: $${usageStats.totalCost.toFixed(2)}\n` +
      `Most Used API: ${usageStats.mostUsedAPI || 'None'}\n` +
      `Success Rate: ${(usageStats.successRate * 100).toFixed(1)}%`,
      [{ text: 'OK' }]
    );
  };

  // Style selection screen
  if (showStyleSelection && selectedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.styleSelectionContainer}>
          <View style={styles.styleHeader}>
            <TouchableOpacity onPress={resetApp} style={styles.styleBackButton}>
              <Text style={styles.styleBackButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.styleTitle}>Choose Professional Style</Text>
            <TouchableOpacity onPress={showUsageStats} style={styles.statsButton}>
              <Text style={styles.statsButtonText}>📊</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.selectedImagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <Text style={styles.previewText}>Select your professional headshot style</Text>
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
                    <View style={styles.styleNameRow}>
                      <Text style={[
                        styles.styleName,
                        selectedStyle === style.id && styles.selectedStyleName
                      ]}>
                        {style.name}
                      </Text>
                      {style.recommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>RECOMMENDED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.styleDescription,
                      selectedStyle === style.id && styles.selectedStyleDescription
                    ]}>
                      {style.description}
                    </Text>
                    <Text style={styles.styleTier}>Processing: {style.tier}</Text>
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
              onPress={startAIProcessing}
            >
              <Text style={styles.generateButtonText}>
                🚀 Create {styleOptions.find(s => s.id === selectedStyle)?.name} Headshot
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Result screen
  if (showResult && generatedImages.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🎉 Professional Headshot Complete!</Text>
          <Text style={styles.resultSubtitle}>
            AI-Enhanced • LinkedIn-Ready • {processingResult?.tier || 'Professional'} Quality
          </Text>
          
          {processingResult && (
            <View style={styles.processingDetailsCard}>
              <View style={styles.processingDetailRow}>
                <Text style={styles.processingDetailLabel}>Processing Tier:</Text>
                <Text style={styles.processingDetailValue}>{processingResult.tier}</Text>
              </View>
              <View style={styles.processingDetailRow}>
                <Text style={styles.processingDetailLabel}>Processing Time:</Text>
                <Text style={styles.processingDetailValue}>
                  {Math.round(processingResult.processingTime / 1000)}s
                </Text>
              </View>
              <View style={styles.processingDetailRow}>
                <Text style={styles.processingDetailLabel}>Cost:</Text>
                <Text style={styles.processingDetailValue}>${processingResult.cost.toFixed(2)}</Text>
              </View>
            </View>
          )}
          
          <View style={styles.imageComparison}>
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>📸 Original</Text>
              <Image source={{ uri: selectedImage }} style={styles.resultImage} />
            </View>
            
            <View style={styles.imageContainer}>
              <Text style={[styles.imageLabel, styles.enhancedLabel]}>✨ AI-Enhanced</Text>
              <Image source={{ uri: generatedImages[0] }} style={[styles.resultImage, styles.enhancedImage]} />
            </View>
          </View>

          {generatedImages.length > 1 && (
            <View style={styles.additionalResults}>
              <Text style={styles.additionalResultsTitle}>Additional Variations</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {generatedImages.slice(1).map((imageUri, index) => (
                  <Image key={index} source={{ uri: imageUri }} style={styles.additionalResultImage} />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.downloadButton} onPress={downloadImage}>
              <Text style={styles.downloadButtonText}>📱 Save to Photos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton} onPress={() => {}}>
              <Text style={styles.shareButtonText}>📤 Share Result</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.newPhotoButton} onPress={resetApp}>
              <Text style={styles.newPhotoButtonText}>➕ Create Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Main home screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>LinkedIn Headshots</Text>
          <Text style={styles.subtitle}>AI-powered professional transformation</Text>
        </View>
        
        <View style={styles.qualityBadges}>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityBadgeText}>4K Quality</Text>
          </View>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityBadgeText}>BetterPic AI</Text>
          </View>
        </View>

        {usageStats && usageStats.totalProcessed > 0 && (
          <TouchableOpacity onPress={showUsageStats} style={styles.usageStatsButton}>
            <Text style={styles.usageStatsText}>
              📊 Processed: {usageStats.totalProcessed} | Cost: ${usageStats.totalCost.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mainContent}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.mainButton} 
            onPress={takePhoto}
            disabled={isProcessing}
          >
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>Take Photo</Text>
            <Text style={styles.buttonSubtext}>Use your camera</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.mainButton} 
            onPress={uploadPhoto}
            disabled={isProcessing}
          >
            <Text style={styles.buttonIcon}>📁</Text>
            <Text style={styles.buttonText}>Upload Photo</Text>
            <Text style={styles.buttonSubtext}>From your library</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Professional AI Features:</Text>
          <Text style={styles.featureItem}>• Multi-tier AI processing (BetterPic + FLUX.1 + InstantID)</Text>
          <Text style={styles.featureItem}>• Face identity preservation technology</Text>
          <Text style={styles.featureItem}>• 4K professional quality output</Text>
          <Text style={styles.featureItem}>• Smart cost optimization</Text>
          <Text style={styles.featureItem}>• LinkedIn-optimized results</Text>
          <Text style={styles.featureItem}>• Instant processing with fallbacks</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoStep}>1. Take or upload your photo</Text>
          <Text style={styles.infoStep}>2. Choose from 6 professional styles</Text>
          <Text style={styles.infoStep}>3. AI creates your styled headshot (30-60s)</Text>
          <Text style={styles.infoStep}>4. Download and use on LinkedIn</Text>
        </View>

        {generatedImages.length > 0 && (
          <TouchableOpacity style={styles.viewResultButton} onPress={() => setShowResult(true)}>
            <Text style={styles.viewResultText}>🎨 View Your Results</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Production-grade AI • Cost-effective • Professional quality
        </Text>
      </View>

      {/* Production AI Processor Modal */}
      <ProductionAIProcessor
        visible={showAIProcessor}
        imageUri={selectedImage}
        styleTemplate={selectedStyle}
        onProcessingComplete={handleProcessingComplete}
        onProcessingError={handleProcessingError}
        onClose={() => setShowAIProcessor(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  qualityBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  qualityBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  qualityBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  usageStatsButton: {
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  usageStatsText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    padding: 24,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  mainButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  featuresSection: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 6,
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
    color: '#111827',
    marginBottom: 12,
  },
  infoStep: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  viewResultButton: {
    backgroundColor: '#0066CC',
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
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Style selection styles
  styleSelectionContainer: {
    flex: 1,
  },
  styleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  styleBackButton: {
    padding: 8,
  },
  styleBackButtonText: {
    color: '#0066CC',
    fontSize: 16,
    fontWeight: '600',
  },
  styleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statsButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    width: 32,
    alignItems: 'center',
  },
  statsButtonText: {
    fontSize: 16,
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
    borderColor: '#0066CC',
    backgroundColor: '#F0F9FF',
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
  styleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  selectedStyleName: {
    color: '#0066CC',
  },
  recommendedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  styleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedStyleDescription: {
    color: '#1D4ED8',
  },
  styleTier: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  selectedCheckmark: {
    fontSize: 20,
    color: '#0066CC',
    fontWeight: 'bold',
  },
  styleActionContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  generateButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Result screen styles
  resultContainer: {
    flex: 1,
    padding: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#0066CC',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
  },
  processingDetailsCard: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  processingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  processingDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  processingDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  imageComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  resultImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  enhancedLabel: {
    color: '#0066CC',
    fontWeight: '700',
  },
  enhancedImage: {
    borderColor: '#0066CC',
    borderWidth: 3,
  },
  additionalResults: {
    marginBottom: 24,
  },
  additionalResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  additionalResultImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  resultActions: {
    marginBottom: 24,
  },
  downloadButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  newPhotoButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newPhotoButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});