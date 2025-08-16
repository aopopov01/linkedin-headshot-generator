/**
 * Dual Provider Headshot Transformation Screen
 * Main interface for the new dual-provider transformation system
 * 
 * Features:
 * - Provider selection (BetterPic vs Replicate)
 * - Quality tier selection (Fast vs Premium)
 * - Cost estimation and budget tracking
 * - Real-time progress tracking
 * - Error handling and fallback
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Card, Button, Chip, ProgressBar, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

import headshotTransformationService from '../../services/headshotTransformationService';
import { CostTracker } from '../../services/costTrackingService';
import { ErrorHandler } from '../../services/errorHandlingService';
import { PROFESSIONAL_STYLES } from '../../config/professional.config';

const { width: screenWidth } = Dimensions.get('window');

// Provider Configuration UI Data
const PROVIDER_UI_CONFIG = {
  BETTERPIC: {
    name: 'BetterPic',
    tagline: 'Premium Quality',
    color: '#6366f1',
    gradient: ['#6366f1', '#8b5cf6'],
    features: ['4K Quality', 'Studio Lighting', 'Premium Retouching', '30-90min'],
    badge: 'PREMIUM',
    icon: '👑'
  },
  REPLICATE: {
    name: 'Replicate AI',
    tagline: 'Fast & Efficient', 
    color: '#06b6d4',
    gradient: ['#06b6d4', '#0891b2'],
    features: ['High Quality', 'Fast Processing', 'AI Models', '1-2min'],
    badge: 'FAST',
    icon: '⚡'
  }
};

const QUALITY_TIERS = {
  fast: {
    name: 'Fast Processing',
    description: 'Quick results with good quality',
    recommendedFor: 'Drafts, quick previews',
    estimatedTime: '1-2 minutes',
    costRange: '$0.025 - $0.04'
  },
  premium: {
    name: 'Premium Quality',
    description: '4K studio-quality results',
    recommendedFor: 'Final professional headshots',
    estimatedTime: '30-90 minutes',
    costRange: '$1.16'
  },
  auto: {
    name: 'Smart Selection',
    description: 'AI chooses the best provider',
    recommendedFor: 'Optimal balance of quality and speed',
    estimatedTime: 'Variable',
    costRange: 'Optimized'
  }
};

export default function DualProviderTransformationScreen({ 
  navigation, 
  route 
}) {
  const { imageUri, userId } = route.params;
  
  // State management
  const [selectedStyle, setSelectedStyle] = useState('executive');
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [costEstimate, setCostEstimate] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // Services
  const [costTracker] = useState(() => new CostTracker());
  const [errorHandler] = useState(() => new ErrorHandler());

  // Load budget and recommendations on mount
  useEffect(() => {
    loadBudgetStatus();
    loadCostRecommendations();
  }, []);

  // Update cost estimate when selections change
  useEffect(() => {
    updateCostEstimate();
  }, [selectedStyle, selectedQuality, selectedProvider]);

  const loadBudgetStatus = async () => {
    try {
      const status = costTracker.getBudgetStatus();
      setBudgetStatus(status);
    } catch (error) {
      console.error('Failed to load budget status:', error);
    }
  };

  const loadCostRecommendations = async () => {
    try {
      const recs = costTracker.getCostOptimizationRecommendations();
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const updateCostEstimate = () => {
    if (selectedQuality === 'auto') {
      const styleConfig = PROFESSIONAL_STYLES[selectedStyle];
      const recommendedProvider = styleConfig?.recommendedProvider || 'REPLICATE';
      
      if (recommendedProvider === 'BETTERPIC') {
        setCostEstimate({
          provider: 'BetterPic',
          cost: 1.16,
          currency: 'USD',
          processingTime: '30-90 minutes'
        });
      } else {
        setCostEstimate({
          provider: 'Replicate',
          cost: 0.035,
          currency: 'USD', 
          processingTime: '1-2 minutes'
        });
      }
    } else if (selectedQuality === 'premium') {
      setCostEstimate({
        provider: 'BetterPic',
        cost: 1.16,
        currency: 'USD',
        processingTime: '30-90 minutes'
      });
    } else {
      setCostEstimate({
        provider: 'Replicate',
        cost: 0.035,
        currency: 'USD',
        processingTime: '1-2 minutes'
      });
    }
  };

  const handleStyleSelection = (style) => {
    setSelectedStyle(style);
  };

  const handleQualitySelection = (quality) => {
    setSelectedQuality(quality);
    
    // Update provider selection based on quality
    if (quality === 'premium') {
      setSelectedProvider('BETTERPIC');
    } else if (quality === 'fast') {
      setSelectedProvider('REPLICATE');
    } else {
      setSelectedProvider(null); // Auto selection
    }
  };

  const handleProviderSelection = (provider) => {
    setSelectedProvider(provider);
    
    // Update quality tier based on provider
    if (provider === 'BETTERPIC') {
      setSelectedQuality('premium');
    } else {
      setSelectedQuality('fast');
    }
  };

  const startTransformation = async () => {
    try {
      setIsProcessing(true);\n      setError(null);\n      setJobStatus(null);\n\n      // Check budget before processing\n      const status = costTracker.getBudgetStatus();\n      const estimatedCost = costEstimate?.cost || 0;\n      \n      if (status.daily.remaining < estimatedCost) {\n        Alert.alert(\n          'Budget Exceeded',\n          'This transformation would exceed your daily budget. Would you like to continue?',\n          [\n            { text: 'Cancel', style: 'cancel' },\n            { text: 'Continue', onPress: proceedWithTransformation }\n          ]\n        );\n        return;\n      }\n\n      await proceedWithTransformation();\n\n    } catch (error) {\n      await handleTransformationError(error);\n    }\n  };\n\n  const proceedWithTransformation = async () => {\n    try {\n      const transformationOptions = {\n        imageUri,\n        style: selectedStyle,\n        quality: selectedQuality,\n        userId,\n        priority: 'standard',\n        backgroundProcessing: selectedQuality === 'premium'\n      };\n\n      const result = await headshotTransformationService.transformHeadshot(transformationOptions);\n      \n      if (result.success) {\n        if (result.backgroundProcessing) {\n          // Background job started\n          setJobStatus({\n            jobId: result.jobId,\n            status: 'queued',\n            estimatedCompletionTime: result.estimatedCompletionTime,\n            provider: result.provider\n          });\n          \n          // Start polling for updates\n          startJobPolling(result.jobId);\n        } else {\n          // Immediate result\n          navigateToResults(result);\n        }\n      } else {\n        throw new Error(result.error || 'Transformation failed');\n      }\n\n    } catch (error) {\n      await handleTransformationError(error);\n    }\n  };\n\n  const startJobPolling = (jobId) => {\n    const pollInterval = setInterval(async () => {\n      try {\n        const status = await headshotTransformationService.getJobStatus(jobId);\n        \n        if (status.success) {\n          setJobStatus(status);\n          \n          if (status.status === 'completed') {\n            clearInterval(pollInterval);\n            setIsProcessing(false);\n            navigateToResults(status.result);\n          } else if (status.status === 'failed') {\n            clearInterval(pollInterval);\n            setIsProcessing(false);\n            throw new Error(status.error || 'Job failed');\n          }\n        }\n      } catch (error) {\n        clearInterval(pollInterval);\n        await handleTransformationError(error);\n      }\n    }, 5000); // Poll every 5 seconds\n    \n    // Clear interval after 2 hours to prevent memory leaks\n    setTimeout(() => clearInterval(pollInterval), 2 * 60 * 60 * 1000);\n  };\n\n  const handleTransformationError = async (error) => {\n    setIsProcessing(false);\n    \n    const errorInfo = await errorHandler.handleError(\n      'TRANSFORMATION_ERROR',\n      error,\n      {\n        style: selectedStyle,\n        quality: selectedQuality,\n        provider: selectedProvider,\n        userId\n      }\n    );\n    \n    setError({\n      message: error.message,\n      canRetry: errorInfo.canRetry,\n      fallbackAvailable: errorInfo.fallbackAvailable,\n      severity: errorInfo.severity\n    });\n  };\n\n  const navigateToResults = (result) => {\n    navigation.navigate('TransformationResults', {\n      result,\n      originalImage: imageUri,\n      style: selectedStyle,\n      provider: result.provider\n    });\n  };\n\n  const renderStyleSelector = () => (\n    <Card style={styles.sectionCard}>\n      <Card.Content>\n        <Text style={styles.sectionTitle}>Professional Style</Text>\n        <Text style={styles.sectionSubtitle}>Choose your industry and role</Text>\n        \n        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScroll}>\n          {Object.entries(PROFESSIONAL_STYLES).map(([key, style]) => (\n            <TouchableOpacity\n              key={key}\n              style={[\n                styles.styleCard,\n                selectedStyle === key && styles.styleCardSelected\n              ]}\n              onPress={() => handleStyleSelection(key)}\n            >\n              <Text style={[\n                styles.styleCardTitle,\n                selectedStyle === key && styles.styleCardTitleSelected\n              ]}>\n                {style.name}\n              </Text>\n              <Text style={[\n                styles.styleCardDescription,\n                selectedStyle === key && styles.styleCardDescriptionSelected\n              ]}>\n                {style.description}\n              </Text>\n            </TouchableOpacity>\n          ))}\n        </ScrollView>\n      </Card.Content>\n    </Card>\n  );\n\n  const renderQualitySelector = () => (\n    <Card style={styles.sectionCard}>\n      <Card.Content>\n        <Text style={styles.sectionTitle}>Quality & Speed</Text>\n        <Text style={styles.sectionSubtitle}>Balance quality with processing time</Text>\n        \n        {Object.entries(QUALITY_TIERS).map(([key, tier]) => (\n          <TouchableOpacity\n            key={key}\n            style={[\n              styles.qualityOption,\n              selectedQuality === key && styles.qualityOptionSelected\n            ]}\n            onPress={() => handleQualitySelection(key)}\n          >\n            <View style={styles.qualityOptionContent}>\n              <View style={styles.qualityHeader}>\n                <Text style={[\n                  styles.qualityName,\n                  selectedQuality === key && styles.qualityNameSelected\n                ]}>\n                  {tier.name}\n                </Text>\n                <Text style={styles.qualityCost}>{tier.costRange}</Text>\n              </View>\n              <Text style={styles.qualityDescription}>{tier.description}</Text>\n              <Text style={styles.qualityDetails}>\n                {tier.recommendedFor} • {tier.estimatedTime}\n              </Text>\n            </View>\n            {selectedQuality === key && (\n              <View style={styles.selectedIndicator}>\n                <Text style={styles.selectedIndicatorText}>✓</Text>\n              </View>\n            )}\n          </TouchableOpacity>\n        ))}\n      </Card.Content>\n    </Card>\n  );\n\n  const renderProviderInfo = () => {\n    if (selectedQuality === 'auto') return null;\n    \n    const provider = selectedQuality === 'premium' ? 'BETTERPIC' : 'REPLICATE';\n    const config = PROVIDER_UI_CONFIG[provider];\n    \n    return (\n      <Card style={styles.sectionCard}>\n        <LinearGradient\n          colors={config.gradient}\n          style={styles.providerHeader}\n        >\n          <View style={styles.providerHeaderContent}>\n            <Text style={styles.providerIcon}>{config.icon}</Text>\n            <View style={styles.providerInfo}>\n              <Text style={styles.providerName}>{config.name}</Text>\n              <Text style={styles.providerTagline}>{config.tagline}</Text>\n            </View>\n            <Badge style={styles.providerBadge}>{config.badge}</Badge>\n          </View>\n        </LinearGradient>\n        \n        <Card.Content style={styles.providerFeatures}>\n          <Text style={styles.featuresTitle}>Features:</Text>\n          <View style={styles.featuresGrid}>\n            {config.features.map((feature, index) => (\n              <Chip key={index} mode=\"outlined\" style={styles.featureChip}>\n                {feature}\n              </Chip>\n            ))}\n          </View>\n        </Card.Content>\n      </Card>\n    );\n  };\n\n  const renderCostEstimate = () => {\n    if (!costEstimate) return null;\n    \n    return (\n      <Card style={styles.costCard}>\n        <Card.Content>\n          <View style={styles.costHeader}>\n            <Text style={styles.costTitle}>Cost Estimate</Text>\n            <Text style={styles.costAmount}>\n              ${costEstimate.cost.toFixed(costEstimate.cost < 1 ? 3 : 2)}\n            </Text>\n          </View>\n          \n          <View style={styles.costDetails}>\n            <Text style={styles.costDetail}>Provider: {costEstimate.provider}</Text>\n            <Text style={styles.costDetail}>Processing: {costEstimate.processingTime}</Text>\n          </View>\n          \n          {budgetStatus && (\n            <View style={styles.budgetInfo}>\n              <Text style={styles.budgetLabel}>Daily Budget Remaining:</Text>\n              <Text style={[\n                styles.budgetAmount,\n                budgetStatus.daily.remaining < costEstimate.cost && styles.budgetAmountLow\n              ]}>\n                ${budgetStatus.daily.remaining.toFixed(2)}\n              </Text>\n            </View>\n          )}\n        </Card.Content>\n      </Card>\n    );\n  };\n\n  const renderProcessingStatus = () => {\n    if (!isProcessing && !jobStatus) return null;\n    \n    return (\n      <Card style={styles.statusCard}>\n        <Card.Content>\n          <View style={styles.statusHeader}>\n            <ActivityIndicator size=\"small\" color=\"#6366f1\" />\n            <Text style={styles.statusTitle}>\n              {jobStatus?.status === 'queued' ? 'Queued for Processing' : 'Processing'}\n            </Text>\n          </View>\n          \n          {jobStatus && (\n            <View style={styles.statusDetails}>\n              <Text style={styles.statusDetail}>\n                Job ID: {jobStatus.jobId}\n              </Text>\n              <Text style={styles.statusDetail}>\n                Provider: {jobStatus.provider}\n              </Text>\n              {jobStatus.estimatedCompletionTime && (\n                <Text style={styles.statusDetail}>\n                  Estimated completion: {new Date(jobStatus.estimatedCompletionTime).toLocaleTimeString()}\n                </Text>\n              )}\n            </View>\n          )}\n          \n          <ProgressBar \n            indeterminate \n            style={styles.progressBar}\n            color=\"#6366f1\"\n          />\n        </Card.Content>\n      </Card>\n    );\n  };\n\n  const renderError = () => {\n    if (!error) return null;\n    \n    return (\n      <Card style={styles.errorCard}>\n        <Card.Content>\n          <Text style={styles.errorTitle}>Processing Error</Text>\n          <Text style={styles.errorMessage}>{error.message}</Text>\n          \n          <View style={styles.errorActions}>\n            {error.canRetry && (\n              <Button\n                mode=\"outlined\"\n                onPress={startTransformation}\n                style={styles.retryButton}\n              >\n                Retry\n              </Button>\n            )}\n            {error.fallbackAvailable && (\n              <Button\n                mode=\"outlined\"\n                onPress={() => {\n                  setSelectedQuality('fast');\n                  setSelectedProvider('REPLICATE');\n                  setError(null);\n                }}\n                style={styles.fallbackButton}\n              >\n                Try Fast Mode\n              </Button>\n            )}\n          </View>\n        </Card.Content>\n      </Card>\n    );\n  };\n\n  const renderActionButton = () => {\n    const isDisabled = isProcessing || !selectedStyle;\n    \n    return (\n      <View style={styles.actionContainer}>\n        <Button\n          mode=\"contained\"\n          onPress={startTransformation}\n          disabled={isDisabled}\n          loading={isProcessing}\n          style={styles.actionButton}\n          contentStyle={styles.actionButtonContent}\n        >\n          {isProcessing ? 'Processing...' : 'Transform Headshot'}\n        </Button>\n      </View>\n    );\n  };\n\n  return (\n    <View style={styles.container}>\n      <ScrollView \n        style={styles.scrollView}\n        contentContainerStyle={styles.scrollViewContent}\n        showsVerticalScrollIndicator={false}\n      >\n        {/* Original Image Preview */}\n        <Card style={styles.imageCard}>\n          <Image source={{ uri: imageUri }} style={styles.previewImage} />\n        </Card>\n        \n        {renderStyleSelector()}\n        {renderQualitySelector()}\n        {renderProviderInfo()}\n        {renderCostEstimate()}\n        {renderProcessingStatus()}\n        {renderError()}\n        \n        <View style={styles.spacer} />\n      </ScrollView>\n      \n      {renderActionButton()}\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    backgroundColor: '#f8fafc'\n  },\n  scrollView: {\n    flex: 1\n  },\n  scrollViewContent: {\n    padding: 16\n  },\n  imageCard: {\n    marginBottom: 16,\n    elevation: 2\n  },\n  previewImage: {\n    width: '100%',\n    height: 200,\n    borderRadius: 8\n  },\n  sectionCard: {\n    marginBottom: 16,\n    elevation: 2\n  },\n  sectionTitle: {\n    fontSize: 20,\n    fontWeight: 'bold',\n    color: '#1f2937',\n    marginBottom: 4\n  },\n  sectionSubtitle: {\n    fontSize: 14,\n    color: '#6b7280',\n    marginBottom: 16\n  },\n  styleScroll: {\n    marginHorizontal: -16\n  },\n  styleCard: {\n    width: 140,\n    padding: 12,\n    marginHorizontal: 8,\n    borderRadius: 8,\n    backgroundColor: '#ffffff',\n    borderWidth: 1,\n    borderColor: '#e5e7eb'\n  },\n  styleCardSelected: {\n    borderColor: '#6366f1',\n    backgroundColor: '#f0f9ff'\n  },\n  styleCardTitle: {\n    fontSize: 14,\n    fontWeight: '600',\n    color: '#374151',\n    marginBottom: 4\n  },\n  styleCardTitleSelected: {\n    color: '#6366f1'\n  },\n  styleCardDescription: {\n    fontSize: 12,\n    color: '#6b7280',\n    lineHeight: 16\n  },\n  styleCardDescriptionSelected: {\n    color: '#1d4ed8'\n  },\n  qualityOption: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    padding: 16,\n    marginBottom: 8,\n    borderRadius: 8,\n    backgroundColor: '#ffffff',\n    borderWidth: 1,\n    borderColor: '#e5e7eb'\n  },\n  qualityOptionSelected: {\n    borderColor: '#6366f1',\n    backgroundColor: '#f0f9ff'\n  },\n  qualityOptionContent: {\n    flex: 1\n  },\n  qualityHeader: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    marginBottom: 4\n  },\n  qualityName: {\n    fontSize: 16,\n    fontWeight: '600',\n    color: '#374151'\n  },\n  qualityNameSelected: {\n    color: '#6366f1'\n  },\n  qualityCost: {\n    fontSize: 14,\n    fontWeight: '500',\n    color: '#059669'\n  },\n  qualityDescription: {\n    fontSize: 14,\n    color: '#6b7280',\n    marginBottom: 4\n  },\n  qualityDetails: {\n    fontSize: 12,\n    color: '#9ca3af'\n  },\n  selectedIndicator: {\n    width: 24,\n    height: 24,\n    borderRadius: 12,\n    backgroundColor: '#6366f1',\n    justifyContent: 'center',\n    alignItems: 'center'\n  },\n  selectedIndicatorText: {\n    color: '#ffffff',\n    fontSize: 14,\n    fontWeight: 'bold'\n  },\n  providerHeader: {\n    padding: 16,\n    borderTopLeftRadius: 8,\n    borderTopRightRadius: 8\n  },\n  providerHeaderContent: {\n    flexDirection: 'row',\n    alignItems: 'center'\n  },\n  providerIcon: {\n    fontSize: 32,\n    marginRight: 12\n  },\n  providerInfo: {\n    flex: 1\n  },\n  providerName: {\n    fontSize: 18,\n    fontWeight: 'bold',\n    color: '#ffffff'\n  },\n  providerTagline: {\n    fontSize: 14,\n    color: '#e0e7ff'\n  },\n  providerBadge: {\n    backgroundColor: 'rgba(255,255,255,0.2)'\n  },\n  providerFeatures: {\n    paddingTop: 16\n  },\n  featuresTitle: {\n    fontSize: 16,\n    fontWeight: '600',\n    color: '#374151',\n    marginBottom: 12\n  },\n  featuresGrid: {\n    flexDirection: 'row',\n    flexWrap: 'wrap',\n    marginHorizontal: -4\n  },\n  featureChip: {\n    marginHorizontal: 4,\n    marginBottom: 8\n  },\n  costCard: {\n    marginBottom: 16,\n    elevation: 2,\n    backgroundColor: '#f0fdf4'\n  },\n  costHeader: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    marginBottom: 12\n  },\n  costTitle: {\n    fontSize: 18,\n    fontWeight: 'bold',\n    color: '#166534'\n  },\n  costAmount: {\n    fontSize: 24,\n    fontWeight: 'bold',\n    color: '#059669'\n  },\n  costDetails: {\n    marginBottom: 12\n  },\n  costDetail: {\n    fontSize: 14,\n    color: '#374151',\n    marginBottom: 2\n  },\n  budgetInfo: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    paddingTop: 12,\n    borderTopWidth: 1,\n    borderTopColor: '#d1fae5'\n  },\n  budgetLabel: {\n    fontSize: 14,\n    color: '#166534'\n  },\n  budgetAmount: {\n    fontSize: 16,\n    fontWeight: '600',\n    color: '#059669'\n  },\n  budgetAmountLow: {\n    color: '#dc2626'\n  },\n  statusCard: {\n    marginBottom: 16,\n    elevation: 2,\n    backgroundColor: '#fef3c7'\n  },\n  statusHeader: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    marginBottom: 12\n  },\n  statusTitle: {\n    fontSize: 16,\n    fontWeight: '600',\n    color: '#92400e',\n    marginLeft: 8\n  },\n  statusDetails: {\n    marginBottom: 12\n  },\n  statusDetail: {\n    fontSize: 14,\n    color: '#78350f',\n    marginBottom: 4\n  },\n  progressBar: {\n    height: 4,\n    borderRadius: 2\n  },\n  errorCard: {\n    marginBottom: 16,\n    elevation: 2,\n    backgroundColor: '#fef2f2'\n  },\n  errorTitle: {\n    fontSize: 16,\n    fontWeight: 'bold',\n    color: '#dc2626',\n    marginBottom: 8\n  },\n  errorMessage: {\n    fontSize: 14,\n    color: '#991b1b',\n    marginBottom: 12\n  },\n  errorActions: {\n    flexDirection: 'row',\n    justifyContent: 'flex-end'\n  },\n  retryButton: {\n    marginRight: 8\n  },\n  fallbackButton: {\n    borderColor: '#f59e0b',\n    color: '#f59e0b'\n  },\n  actionContainer: {\n    padding: 16,\n    backgroundColor: '#ffffff',\n    borderTopWidth: 1,\n    borderTopColor: '#e5e7eb'\n  },\n  actionButton: {\n    backgroundColor: '#6366f1'\n  },\n  actionButtonContent: {\n    height: 48\n  },\n  spacer: {\n    height: 16\n  }\n});