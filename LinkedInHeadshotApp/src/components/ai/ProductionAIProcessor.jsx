/**
 * Production AI Processor Component
 * Integrates the multi-tier AI service with React Native UI
 * Handles processing states, cost estimation, and user feedback
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import ProductionAIService from '../../services/productionAIService';

const { width, height } = Dimensions.get('window');

const ProductionAIProcessor = ({ 
  imageUri, 
  styleTemplate, 
  onProcessingComplete,
  onProcessingError,
  visible = false,
  onClose
}) => {
  const [processingState, setProcessingState] = useState('idle'); // idle, estimating, processing, completed, failed
  const [processingId, setProcessingId] = useState(null);
  const [costEstimate, setCostEstimate] = useState(null);
  const [processingResult, setProcessingResult] = useState(null);
  const [currentTier, setCurrentTier] = useState(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [processingStartTime, setProcessingStartTime] = useState(null);

  // Timer for processing time display
  useEffect(() => {
    let interval;
    if (processingStartTime && processingState === 'processing') {
      interval = setInterval(() => {
        setProcessingTime(Date.now() - processingStartTime);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [processingStartTime, processingState]);

  // Get cost estimate when component mounts or style changes
  useEffect(() => {
    if (visible && styleTemplate) {
      estimateCosts();
    }
  }, [visible, styleTemplate]);

  /**
   * Get cost estimation for the current configuration
   */
  const estimateCosts = async () => {
    try {
      setProcessingState('estimating');
      const estimate = ProductionAIService.estimateCost(styleTemplate, {
        premium: styleTemplate === 'executive',
        preserveFace: styleTemplate === 'healthcare' ? 'critical' : 'normal'
      });
      setCostEstimate(estimate);
      setProcessingState('idle');
    } catch (error) {
      console.error('Cost estimation failed:', error);
      setProcessingState('idle');
    }
  };

  /**
   * Start the AI processing
   */
  const startProcessing = async (processingOptions = {}) => {
    if (!imageUri || !styleTemplate) {
      Alert.alert('Error', 'Image and style template are required');
      return;
    }

    try {
      setProcessingState('processing');
      setProcessingStartTime(Date.now());
      setCurrentTier(costEstimate?.selectedTier || 'Unknown');

      console.log('🚀 Starting production AI processing...');
      
      const result = await ProductionAIService.processHeadshotWithSmartRouting(
        imageUri,
        styleTemplate,
        {
          premium: styleTemplate === 'executive',
          preserveFace: styleTemplate === 'healthcare' ? 'critical' : 'normal',
          numOutputs: 4,
          ...processingOptions
        }
      );

      console.log('✅ Processing completed successfully:', result);
      setProcessingResult(result);
      setProcessingState('completed');
      
      if (onProcessingComplete) {
        onProcessingComplete(result);
      }

    } catch (error) {
      console.error('❌ Processing failed:', error);
      setProcessingState('failed');
      
      if (onProcessingError) {
        onProcessingError(error);
      }
      
      Alert.alert(
        'Processing Failed',
        `AI processing encountered an error: ${error.message}`,
        [
          { text: 'Retry', onPress: () => retryProcessing() },
          { text: 'Cancel', style: 'cancel', onPress: handleClose }
        ]
      );
    }
  };

  /**
   * Retry processing with different options
   */
  const retryProcessing = () => {
    setProcessingState('idle');
    setProcessingResult(null);
    // Could implement retry with different tier or options
    startProcessing({ fast: true, budget: 'low' }); // Try with budget option
  };

  /**
   * Handle closing the component
   */
  const handleClose = () => {
    if (processingState === 'processing') {
      Alert.alert(
        'Cancel Processing?',
        'Your headshot is currently being processed. Are you sure you want to cancel?',
        [
          { text: 'Continue Processing', style: 'cancel' },
          { 
            text: 'Cancel', 
            style: 'destructive', 
            onPress: () => {
              setProcessingState('idle');
              onClose?.();
            }
          }
        ]
      );
    } else {
      onClose?.();
    }
  };

  /**
   * Format processing time for display
   */
  const formatProcessingTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  /**
   * Get processing status message
   */
  const getProcessingStatusMessage = () => {
    switch (processingState) {
      case 'estimating':
        return 'Calculating costs...';
      case 'processing':
        return `Processing with ${currentTier}...`;
      case 'completed':
        return 'Processing completed successfully!';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Ready to process';
    }
  };

  /**
   * Render cost estimation section
   */
  const renderCostEstimation = () => {
    if (!costEstimate) return null;

    return (
      <View style={styles.costSection}>
        <Text style={styles.costTitle}>Processing Details</Text>
        
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Selected Tier:</Text>
          <Text style={styles.costValue}>{costEstimate.selectedTier}</Text>
        </View>
        
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Cost per Image:</Text>
          <Text style={styles.costValueHighlight}>${costEstimate.costPerImage.toFixed(2)}</Text>
        </View>
        
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Est. Processing Time:</Text>
          <Text style={styles.costValue}>{costEstimate.estimatedProcessingTime}s</Text>
        </View>

        {costEstimate.alternatives && (
          <View style={styles.alternativesSection}>
            <Text style={styles.alternativesTitle}>Alternative Options:</Text>
            {costEstimate.alternatives.map((alt, index) => (
              <View key={index} style={styles.alternativeRow}>
                <Text style={styles.alternativeName}>{alt.name}</Text>
                <Text style={styles.alternativeCost}>${alt.cost.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  /**
   * Render processing progress
   */
  const renderProcessingProgress = () => {
    if (processingState !== 'processing') return null;

    return (
      <View style={styles.progressSection}>
        <ActivityIndicator size="large" color="#0066CC" style={styles.progressSpinner} />
        <Text style={styles.progressTitle}>Creating Your Professional Headshot</Text>
        <Text style={styles.progressSubtitle}>{getProcessingStatusMessage()}</Text>
        
        {processingTime > 0 && (
          <Text style={styles.progressTime}>
            Processing time: {formatProcessingTime(processingTime)}
          </Text>
        )}

        <View style={styles.progressSteps}>
          <Text style={styles.progressStep}>• Optimizing image quality</Text>
          <Text style={styles.progressStep}>• Applying AI transformation</Text>
          <Text style={styles.progressStep}>• Enhancing professional features</Text>
          <Text style={styles.progressStep}>• Finalizing LinkedIn-ready output</Text>
        </View>
      </View>
    );
  };

  /**
   * Render processing results
   */
  const renderResults = () => {
    if (processingState !== 'completed' || !processingResult) return null;

    return (
      <View style={styles.resultsSection}>
        <Text style={styles.resultsTitle}>✨ Professional Headshot Complete!</Text>
        
        <View style={styles.resultStats}>
          <View style={styles.resultStatItem}>
            <Text style={styles.resultStatLabel}>Processing Time</Text>
            <Text style={styles.resultStatValue}>
              {formatProcessingTime(processingResult.processingTime)}
            </Text>
          </View>
          <View style={styles.resultStatItem}>
            <Text style={styles.resultStatLabel}>Tier Used</Text>
            <Text style={styles.resultStatValue}>{processingResult.tier}</Text>
          </View>
          <View style={styles.resultStatItem}>
            <Text style={styles.resultStatLabel}>Cost</Text>
            <Text style={styles.resultStatValue}>${processingResult.cost.toFixed(2)}</Text>
          </View>
        </View>

        {processingResult.result?.images && processingResult.result.images.length > 0 && (
          <ScrollView 
            horizontal 
            style={styles.resultImagesContainer}
            showsHorizontalScrollIndicator={false}
          >
            {processingResult.result.images.map((imageUrl, index) => (
              <View key={index} style={styles.resultImageWrapper}>
                <Image 
                  source={{ uri: imageUrl }} 
                  style={styles.resultImage}
                  resizeMode="cover"
                />
                <Text style={styles.resultImageLabel}>Result {index + 1}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {processingResult.warning && (
          <View style={styles.warningSection}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>{processingResult.warning}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Headshot Processing</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Preview */}
          {imageUri && (
            <View style={styles.imagePreviewSection}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <Text style={styles.previewLabel}>Style: {styleTemplate}</Text>
            </View>
          )}

          {/* Cost Estimation */}
          {processingState === 'idle' && renderCostEstimation()}

          {/* Processing Progress */}
          {renderProcessingProgress()}

          {/* Results */}
          {renderResults()}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            {processingState === 'idle' && (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => startProcessing()}
                  disabled={processingState !== 'idle'}
                >
                  <Text style={styles.primaryButtonText}>
                    Start Processing (${costEstimate?.costPerImage.toFixed(2) || '0.00'})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => startProcessing({ fast: true, budget: 'low' })}
                  disabled={processingState !== 'idle'}
                >
                  <Text style={styles.secondaryButtonText}>
                    Fast Processing ($0.25)
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {processingState === 'completed' && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onProcessingComplete?.(processingResult)}
              >
                <Text style={styles.primaryButtonText}>
                  Use These Results
                </Text>
              </TouchableOpacity>
            )}

            {processingState === 'failed' && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={retryProcessing}
              >
                <Text style={styles.retryButtonText}>Retry Processing</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imagePreviewSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  costSection: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  costTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  costValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  alternativesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  alternativeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alternativeName: {
    fontSize: 14,
    color: '#6B7280',
  },
  alternativeCost: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressSection: {
    alignItems: 'center',
    padding: 40,
  },
  progressSpinner: {
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressSubtitle: {
    fontSize: 16,
    color: '#0066CC',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressTime: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  progressSteps: {
    alignSelf: 'stretch',
  },
  progressStep: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  resultStatItem: {
    alignItems: 'center',
  },
  resultStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  resultStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  resultImagesContainer: {
    marginBottom: 20,
  },
  resultImageWrapper: {
    alignItems: 'center',
    marginRight: 16,
  },
  resultImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultImageLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
  },
  actionSection: {
    paddingTop: 20,
  },
  primaryButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProductionAIProcessor;