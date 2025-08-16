// Professional Headshot Processor Component
// React Native component for integrating BetterPic/Replicate APIs
// Optimized for mobile performance and user experience

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProfessionalHeadshotService from '../../services/professionalHeadshotService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Style options optimized for professional headshots
const STYLE_OPTIONS = [
  {
    key: 'linkedin_executive',
    name: 'Executive',
    description: 'Premium C-suite professional',
    icon: '👔',
    price: 'Premium',
    estimatedTime: '30-60 min'
  },
  {
    key: 'linkedin_professional',
    name: 'Professional',
    description: 'Standard business profile',
    icon: '💼',
    price: 'Standard',
    estimatedTime: '30-60 min'
  },
  {
    key: 'linkedin_creative',
    name: 'Creative',
    description: 'Modern creative professional',
    icon: '🎨',
    price: 'Standard',
    estimatedTime: '1-2 min'
  },
  {
    key: 'linkedin_healthcare',
    name: 'Healthcare',
    description: 'Medical professional',
    icon: '⚕️',
    price: 'Standard',
    estimatedTime: '30-60 min'
  }
];

const ProfessionalHeadshotProcessor = ({ 
  imageUri, 
  onResultsReady, 
  onError,
  onProcessingUpdate 
}) => {
  const [selectedStyle, setSelectedStyle] = useState('linkedin_professional');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [processingStartTime, setProcessingStartTime] = useState(null);

  // Update estimated cost when style changes
  useEffect(() => {
    updateEstimatedCost();
  }, [selectedStyle, selectedProvider]);

  const updateEstimatedCost = useCallback(() => {
    const style = STYLE_OPTIONS.find(s => s.key === selectedStyle);
    if (style) {
      const cost = selectedProvider === 'BETTERPIC' || style.price === 'Premium' ? 1.16 * 4 : 0.04 * 4;
      setEstimatedCost({
        perImage: selectedProvider === 'BETTERPIC' || style.price === 'Premium' ? 1.16 : 0.04,
        total: cost,
        variations: 4
      });
    }
  }, [selectedStyle, selectedProvider]);

  // Start headshot transformation
  const startTransformation = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStatus('Preparing your image...');
      setProcessingStartTime(Date.now());
      setResults(null);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + (Math.random() * 10);
        });
      }, 3000);

      // Configure options based on selected provider
      const options = {
        preferredProvider: selectedProvider === 'auto' ? undefined : selectedProvider,
        variations: 4,
        premium: selectedStyle === 'linkedin_executive',
        fastMode: selectedProvider === 'REPLICATE_FLUX'
      };

      setProcessingStatus('Transforming to professional headshot...');
      
      // Call the professional headshot service
      const result = await ProfessionalHeadshotService.transformToHeadshot(
        imageUri, 
        selectedStyle, 
        options
      );

      clearInterval(progressInterval);
      setProcessingProgress(100);
      setProcessingStatus('Complete! Your professional headshots are ready.');

      setResults(result);
      
      // Call parent callback
      if (onResultsReady) {
        onResultsReady(result);
      }

      // Show success message
      Alert.alert(
        'Success!', 
        `Your professional headshots are ready! Generated using ${result.provider}.`,
        [{ text: 'View Results', onPress: () => {} }]
      );

    } catch (error) {
      console.error('Transformation error:', error);
      setProcessingStatus(`Error: ${error.message}`);
      
      if (onError) {
        onError(error);
      }

      Alert.alert(
        'Transformation Failed', 
        error.message,
        [
          { text: 'Try Again', onPress: () => setIsProcessing(false) },
          { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessing(false) }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch process multiple styles
  const processBatchStyles = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus('Processing multiple styles...');
      setProcessingProgress(0);

      const stylesToProcess = ['linkedin_professional', 'linkedin_executive', 'linkedin_creative'];
      
      const result = await ProfessionalHeadshotService.batchProcessStyles(
        imageUri,
        stylesToProcess,
        { preferredProvider: selectedProvider === 'auto' ? undefined : selectedProvider }
      );

      setResults(result);
      setProcessingProgress(100);
      setProcessingStatus('Batch processing complete!');

      if (onResultsReady) {
        onResultsReady(result);
      }

      Alert.alert(
        'Batch Complete!',
        `Generated ${result.successfulStyles} out of ${result.totalStyles} styles successfully.`
      );

    } catch (error) {
      console.error('Batch processing error:', error);
      if (onError) {
        onError(error);
      }
      Alert.alert('Batch Processing Failed', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate processing time
  const getProcessingTime = () => {
    if (!processingStartTime) return '';
    const elapsed = Math.floor((Date.now() - processingStartTime) / 1000);
    return `${elapsed}s`;
  };

  // Render style selection
  const renderStyleSelection = () => (
    <View style={styles.styleSection}>
      <Text style={styles.sectionTitle}>Choose Your Professional Style</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScroll}>
        {STYLE_OPTIONS.map((style) => (
          <TouchableOpacity
            key={style.key}
            style={[
              styles.styleCard,
              selectedStyle === style.key && styles.styleCardSelected
            ]}
            onPress={() => setSelectedStyle(style.key)}
          >
            <Text style={styles.styleIcon}>{style.icon}</Text>
            <Text style={styles.styleName}>{style.name}</Text>
            <Text style={styles.styleDescription}>{style.description}</Text>
            <View style={styles.styleMetadata}>
              <Text style={styles.stylePrice}>{style.price}</Text>
              <Text style={styles.styleTime}>{style.estimatedTime}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render provider selection
  const renderProviderSelection = () => (
    <View style={styles.providerSection}>
      <Text style={styles.sectionTitle}>Processing Option</Text>
      <View style={styles.providerOptions}>
        <TouchableOpacity
          style={[
            styles.providerCard,
            selectedProvider === 'auto' && styles.providerCardSelected
          ]}
          onPress={() => setSelectedProvider('auto')}
        >
          <Text style={styles.providerName}>Auto (Recommended)</Text>
          <Text style={styles.providerDescription}>Best quality for your style</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.providerCard,
            selectedProvider === 'REPLICATE_FLUX' && styles.providerCardSelected
          ]}
          onPress={() => setSelectedProvider('REPLICATE_FLUX')}
        >
          <Text style={styles.providerName}>Fast Mode ⚡</Text>
          <Text style={styles.providerDescription}>1-2 minutes, $0.04/image</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.providerCard,
            selectedProvider === 'BETTERPIC' && styles.providerCardSelected
          ]}
          onPress={() => setSelectedProvider('BETTERPIC')}
        >
          <Text style={styles.providerName}>Premium Quality 👔</Text>
          <Text style={styles.providerDescription}>30-60 minutes, $1.16/image</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render processing status
  const renderProcessingStatus = () => (
    <View style={styles.processingSection}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.processingCard}
      >
        <ActivityIndicator size="large" color="#ffffff" style={styles.processingSpinner} />
        <Text style={styles.processingTitle}>Creating Your Professional Headshot</Text>
        <Text style={styles.processingStatus}>{processingStatus}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${processingProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(processingProgress)}%</Text>
        </View>

        {processingStartTime && (
          <Text style={styles.processingTime}>
            Processing time: {getProcessingTime()}
          </Text>
        )}
      </LinearGradient>
    </View>
  );

  // Render cost estimate
  const renderCostEstimate = () => (
    estimatedCost && (
      <View style={styles.costSection}>
        <Text style={styles.costTitle}>Estimated Cost</Text>
        <View style={styles.costBreakdown}>
          <Text style={styles.costLine}>
            {estimatedCost.variations} variations × ${estimatedCost.perImage.toFixed(2)} = ${estimatedCost.total.toFixed(2)}
          </Text>
        </View>
      </View>
    )
  );

  // Render action buttons
  const renderActionButtons = () => (
    <View style={styles.actionSection}>
      <TouchableOpacity
        style={[styles.actionButton, styles.primaryButton]}
        onPress={startTransformation}
        disabled={isProcessing || !imageUri}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.buttonGradient}
        >
          <Text style={styles.primaryButtonText}>
            {isProcessing ? 'Processing...' : 'Generate Professional Headshot'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={processBatchStyles}
        disabled={isProcessing || !imageUri}
      >
        <Text style={styles.secondaryButtonText}>
          Try Multiple Styles (3x)
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Preview Image */}
      {imageUri && (
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Original Image</Text>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        </View>
      )}

      {/* Processing Status */}
      {isProcessing && renderProcessingStatus()}

      {/* Style Selection */}
      {!isProcessing && renderStyleSelection()}

      {/* Provider Selection */}
      {!isProcessing && renderProviderSelection()}

      {/* Cost Estimate */}
      {!isProcessing && renderCostEstimate()}

      {/* Action Buttons */}
      {!isProcessing && renderActionButtons()}

      {/* Results Preview */}
      {results && !isProcessing && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>✨ Results Ready!</Text>
          <Text style={styles.resultsDescription}>
            Generated using {results.provider} • {results.quality}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  previewSection: {
    padding: 20,
    alignItems: 'center',
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  
  styleSection: {
    padding: 20,
  },
  
  styleScroll: {
    marginTop: 10,
  },
  
  styleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  
  styleCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f7fafc',
  },
  
  styleIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  
  styleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
  },
  
  styleDescription: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
    marginTop: 4,
  },
  
  styleMetadata: {
    marginTop: 8,
    alignItems: 'center',
  },
  
  stylePrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#667eea',
  },
  
  styleTime: {
    fontSize: 10,
    color: '#a0aec0',
  },
  
  providerSection: {
    padding: 20,
  },
  
  providerOptions: {
    marginTop: 10,
  },
  
  providerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  
  providerCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f7fafc',
  },
  
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  
  providerDescription: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  
  processingSection: {
    padding: 20,
  },
  
  processingCard: {
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
  },
  
  processingSpinner: {
    marginBottom: 15,
  },
  
  processingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  
  processingStatus: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 8,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  processingTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 10,
  },
  
  costSection: {
    padding: 20,
    paddingTop: 0,
  },
  
  costTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  
  costBreakdown: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
  },
  
  costLine: {
    fontSize: 14,
    color: '#4a5568',
  },
  
  actionSection: {
    padding: 20,
  },
  
  actionButton: {
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  
  primaryButton: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: '#ffffff',
  },
  
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 15,
  },
  
  resultsSection: {
    padding: 20,
    alignItems: 'center',
  },
  
  resultsDescription: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  }
});

export default ProfessionalHeadshotProcessor;