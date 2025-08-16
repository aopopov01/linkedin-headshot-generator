/**
 * Error Recovery Modal - Advanced Error Handling with User-Friendly Recovery Options
 * Addresses critical UX issue: Limited error recovery and user guidance
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { showAlert, showErrorAlert } from './Alert';
import { BRAND_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/branding';

const ErrorRecoveryModal = ({
  visible,
  error,
  context = 'processing',
  onRetry,
  onFallback,
  onCancel,
  onDismiss,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  // Error categorization for better user guidance
  const getErrorCategory = (error) => {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code;

    if (errorMessage.includes('network') || errorMessage.includes('connection') || errorCode === 'NETWORK_ERROR') {
      return 'network';
    }
    if (errorMessage.includes('timeout') || errorCode === 'TIMEOUT') {
      return 'timeout';
    }
    if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorCode === 'QUOTA_EXCEEDED') {
      return 'quota';
    }
    if (errorMessage.includes('server') || errorMessage.includes('500') || errorCode === 'SERVER_ERROR') {
      return 'server';
    }
    if (errorMessage.includes('invalid') || errorMessage.includes('400') || errorCode === 'INVALID_INPUT') {
      return 'input';
    }
    return 'unknown';
  };

  // Get user-friendly error information
  const getErrorInfo = (category) => {
    const errorInfoMap = {
      network: {
        title: 'Connection Issue',
        icon: '📶',
        description: 'We\'re having trouble connecting to our AI service. This might be due to poor internet connection or temporary network issues.',
        solutions: [
          'Check your internet connection',
          'Try connecting to a different network',
          'Wait a moment and try again',
          'Use offline basic optimization'
        ],
        canRetry: true,
        canFallback: true,
        fallbackLabel: 'Use Basic Optimization',
      },
      timeout: {
        title: 'Processing Timeout',
        icon: '⏱️',
        description: 'The AI processing is taking longer than expected. This can happen during peak usage times.',
        solutions: [
          'Try again with a smaller image',
          'Select fewer platforms to process',
          'Try during off-peak hours',
          'Use basic optimization for faster results'
        ],
        canRetry: true,
        canFallback: true,
        fallbackLabel: 'Quick Basic Mode',
      },
      quota: {
        title: 'Service Limit Reached',
        icon: '🔒',
        description: 'You\'ve reached the limit for AI processing. This could be due to daily usage limits or subscription restrictions.',
        solutions: [
          'Try again in 24 hours',
          'Upgrade your subscription',
          'Use basic optimization instead',
          'Contact support for assistance'
        ],
        canRetry: false,
        canFallback: true,
        fallbackLabel: 'Use Basic Mode',
      },
      server: {
        title: 'Service Temporarily Down',
        icon: '🔧',
        description: 'Our AI service is temporarily experiencing issues. Our team is working to fix this quickly.',
        solutions: [
          'Try again in a few minutes',
          'Check our status page',
          'Use basic optimization temporarily',
          'Contact support if issue persists'
        ],
        canRetry: true,
        canFallback: true,
        fallbackLabel: 'Basic Optimization',
      },
      input: {
        title: 'Photo Requirements Issue',
        icon: '📸',
        description: 'There\'s an issue with your photo that prevents AI processing. This could be due to format, size, or content requirements.',
        solutions: [
          'Try a different photo',
          'Ensure photo shows a clear face',
          'Use a higher quality image',
          'Check photo format (JPG/PNG)'
        ],
        canRetry: true,
        canFallback: false,
        fallbackLabel: null,
      },
      unknown: {
        title: 'Unexpected Error',
        icon: '❓',
        description: 'Something unexpected happened. Don\'t worry, we can try a different approach to get your photos ready.',
        solutions: [
          'Try the process again',
          'Restart the app',
          'Use basic optimization',
          'Contact support with error details'
        ],
        canRetry: true,
        canFallback: true,
        fallbackLabel: 'Safe Mode',
      },
    };

    return errorInfoMap[category] || errorInfoMap.unknown;
  };

  const category = getErrorCategory(error);
  const errorInfo = getErrorInfo(category);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry?.();
      onDismiss?.();
    } catch (retryError) {
      showErrorAlert(
        'Retry Failed',
        'The retry attempt failed. Would you like to try basic optimization instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Basic Mode', onPress: handleFallback }
        ]
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const handleFallback = async () => {
    setIsFallback(true);
    try {
      await onFallback?.();
      onDismiss?.();
    } catch (fallbackError) {
      showErrorAlert(
        'Fallback Failed',
        'Unfortunately, even the basic optimization failed. Please try again later or contact support.',
        [{ text: 'OK', onPress: onCancel }]
      );
    } finally {
      setIsFallback(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.icon}>{errorInfo.icon}</Text>
              <Text style={styles.title}>{errorInfo.title}</Text>
              <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{errorInfo.description}</Text>
            </View>

            {/* Solutions */}
            <View style={styles.solutionsContainer}>
              <Text style={styles.solutionsTitle}>What you can do:</Text>
              {errorInfo.solutions.map((solution, index) => (
                <View key={index} style={styles.solutionItem}>
                  <Text style={styles.solutionBullet}>•</Text>
                  <Text style={styles.solutionText}>{solution}</Text>
                </View>
              ))}
            </View>

            {/* Technical Details Toggle */}
            <TouchableOpacity
              style={styles.technicalToggle}
              onPress={() => setShowTechnicalDetails(!showTechnicalDetails)}
            >
              <Text style={styles.technicalToggleText}>
                {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
              </Text>
              <Text style={styles.technicalToggleIcon}>
                {showTechnicalDetails ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {showTechnicalDetails && (
              <View style={styles.technicalDetails}>
                <Text style={styles.technicalLabel}>Error Code:</Text>
                <Text style={styles.technicalValue}>{error.code || 'UNKNOWN'}</Text>
                
                <Text style={styles.technicalLabel}>Error Message:</Text>
                <Text style={styles.technicalValue}>{error.message || 'No details available'}</Text>
                
                <Text style={styles.technicalLabel}>Context:</Text>
                <Text style={styles.technicalValue}>{context}</Text>
                
                <Text style={styles.technicalLabel}>Timestamp:</Text>
                <Text style={styles.technicalValue}>{new Date().toISOString()}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {errorInfo.canRetry && (
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={handleRetry}
                disabled={isRetrying}
              >
                <Text style={[styles.actionButtonText, styles.retryButtonText]}>
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Text>
              </TouchableOpacity>
            )}

            {errorInfo.canFallback && (
              <TouchableOpacity
                style={[styles.actionButton, styles.fallbackButton]}
                onPress={handleFallback}
                disabled={isFallback}
              >
                <Text style={[styles.actionButtonText, styles.fallbackButtonText]}>
                  {isFallback ? 'Starting...' : errorInfo.fallbackLabel}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  modalContainer: {
    backgroundColor: BRAND_COLORS.WHITE,
    borderRadius: BORDER_RADIUS.XL,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  scrollContainer: {
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.MD,
  },
  icon: {
    fontSize: 32,
    marginRight: SPACING.MD,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_HEADING,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: BRAND_COLORS.PRIMARY,
    flex: 1,
  },
  closeButton: {
    padding: SPACING.SM,
  },
  closeButtonText: {
    fontSize: 20,
    color: BRAND_COLORS.GRAY_500,
  },
  descriptionContainer: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.LG,
  },
  description: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: BRAND_COLORS.GRAY_700,
    lineHeight: 22,
  },
  solutionsContainer: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.LG,
  },
  solutionsTitle: {
    fontSize: TYPOGRAPHY.SIZE_BODY_LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: BRAND_COLORS.PRIMARY,
    marginBottom: SPACING.MD,
  },
  solutionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  solutionBullet: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: BRAND_COLORS.SECONDARY,
    marginRight: SPACING.SM,
    marginTop: 2,
  },
  solutionText: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    color: BRAND_COLORS.GRAY_600,
    flex: 1,
    lineHeight: 20,
  },
  technicalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: BRAND_COLORS.GRAY_50,
    marginHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
  },
  technicalToggleText: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  technicalToggleIcon: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_500,
  },
  technicalDetails: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: BRAND_COLORS.GRAY_50,
    marginHorizontal: SPACING.LG,
    marginTop: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
  },
  technicalLabel: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: BRAND_COLORS.PRIMARY,
    marginTop: SPACING.SM,
    marginBottom: SPACING.XS,
  },
  technicalValue: {
    fontSize: TYPOGRAPHY.SIZE_BODY_SMALL,
    color: BRAND_COLORS.GRAY_600,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: SPACING.SM,
  },
  buttonContainer: {
    padding: SPACING.LG,
    gap: SPACING.MD,
  },
  actionButton: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: BRAND_COLORS.SECONDARY,
  },
  fallbackButton: {
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  cancelButton: {
    backgroundColor: BRAND_COLORS.GRAY_200,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.SIZE_BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },
  retryButtonText: {
    color: BRAND_COLORS.WHITE,
  },
  fallbackButtonText: {
    color: BRAND_COLORS.WHITE,
  },
  cancelButtonText: {
    color: BRAND_COLORS.GRAY_700,
  },
});

export default ErrorRecoveryModal;