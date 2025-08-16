/**
 * SECURE AI Processor Example Component
 * Demonstrates how to use the new SecureAIService safely
 * 
 * SECURITY: All API credentials are handled server-side
 * NO hardcoded credentials in client code
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import SecureAIService from '../../services/secureAIService';
import Button from '../shared/Button';
import LoadingSpinner from '../shared/LoadingSpinner';

const SecureAIProcessorExample = ({ imageUri, onResult, onError }) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPrediction, setCurrentPrediction] = useState(null);

  /**
   * SECURE: Process image using new secure service
   * All credentials handled server-side via authenticated backend proxy
   */
  const processImageSecurely = useCallback(async (styleTemplate = 'executive') => {
    try {
      setProcessing(true);
      setProgress(10);
      
      console.log('🔒 Starting SECURE AI processing...');
      
      // Use SecureAIService - NO hardcoded credentials
      const transformationResult = await SecureAIService.processImageToHeadshot(
        imageUri,
        styleTemplate,
        {
          dramatic: true,
          premium: true,
          numOutputs: 4
        }
      );

      if (transformationResult.success) {
        console.log('✅ Secure transformation initiated:', transformationResult.predictionId);
        setCurrentPrediction(transformationResult.predictionId);
        setProgress(30);
        
        // Wait for completion using secure polling
        const finalResult = await SecureAIService.waitForPrediction(
          transformationResult.predictionId,
          180000, // 3 minutes
          3000    // 3 second intervals
        );

        if (finalResult.success) {
          console.log('🎉 Secure AI processing completed successfully!');
          setProgress(100);
          
          // Return results to parent component
          onResult?.({
            outputs: finalResult.outputs,
            predictionId: transformationResult.predictionId,
            styleTemplate,
            processingTime: finalResult.processingTime,
            secure: true // Indicates secure processing
          });
        } else {
          throw new Error(finalResult.error || 'Processing failed');
        }
      } else {
        throw new Error(transformationResult.error || 'Failed to start processing');
      }

    } catch (error) {
      console.error('❌ Secure AI processing failed:', error.message);
      
      // Show user-friendly error (no sensitive data exposed)
      Alert.alert(
        'Processing Failed',
        'Unable to process your image at this time. Please try again.',
        [{ text: 'OK' }]
      );
      
      onError?.(error.message);
    } finally {
      setProcessing(false);
      setProgress(0);
      setCurrentPrediction(null);
    }
  }, [imageUri, onResult, onError]);

  /**
   * SECURE: Cancel processing using secure service
   */
  const cancelProcessing = useCallback(async () => {
    if (!currentPrediction) return;

    try {
      const cancelResult = await SecureAIService.cancelPrediction(currentPrediction);
      
      if (cancelResult.success) {
        console.log('✅ Processing cancelled successfully');
        Alert.alert('Cancelled', 'Image processing has been cancelled.');
      }
    } catch (error) {
      console.error('❌ Failed to cancel processing:', error.message);
    } finally {
      setProcessing(false);
      setProgress(0);
      setCurrentPrediction(null);
    }
  }, [currentPrediction]);

  /**
   * SECURE: Process multiple styles using batch processing
   */
  const processBatchStyles = useCallback(async () => {
    try {
      setProcessing(true);
      setProgress(10);
      
      const batchStyles = ['executive', 'creative', 'healthcare'];
      
      const batchResult = await SecureAIService.batchProcessMultipleStyles(
        imageUri,
        batchStyles,
        {
          dramatic: true,
          numOutputs: 2 // Fewer outputs for batch processing
        }
      );

      if (batchResult.success) {
        console.log('🚀 Secure batch processing initiated:', batchResult.batchId);
        setProgress(50);
        
        // Monitor batch progress (simplified example)
        // In practice, you'd poll each prediction individually
        setTimeout(() => {
          setProgress(100);
          onResult?.({
            batchResults: batchResult.predictions,
            batchId: batchResult.batchId,
            totalStyles: batchResult.totalStyles,
            secure: true
          });
          setProcessing(false);
        }, batchResult.estimatedTime * 1000);
      }
    } catch (error) {
      console.error('❌ Secure batch processing failed:', error.message);
      onError?.(error.message);
      setProcessing(false);
    }
  }, [imageUri, onResult, onError]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 Secure AI Processing</Text>
      <Text style={styles.subtitle}>
        All processing uses secure backend proxy - no client-side API keys
      </Text>

      {processing && (
        <View style={styles.progressContainer}>
          <LoadingSpinner size="large" color="#007AFF" />
          <Text style={styles.progressText}>
            Processing securely... {progress}%
          </Text>
          {currentPrediction && (
            <Text style={styles.predictionId}>
              ID: {currentPrediction.substring(0, 8)}...
            </Text>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="🎯 Executive Style"
          onPress={() => processImageSecurely('executive')}
          disabled={processing}
          style={styles.button}
        />
        
        <Button
          title="🎨 Creative Style"
          onPress={() => processImageSecurely('creative')}
          disabled={processing}
          style={styles.button}
        />
        
        <Button
          title="🚀 Batch Process"
          onPress={processBatchStyles}
          disabled={processing}
          style={styles.button}
        />
        
        {processing && (
          <Button
            title="❌ Cancel"
            onPress={cancelProcessing}
            style={[styles.button, styles.cancelButton]}
          />
        )}
      </View>

      <View style={styles.securityNotice}>
        <Text style={styles.securityText}>
          🔒 Secure Processing: All API credentials are handled server-side
        </Text>
        <Text style={styles.securitySubtext}>
          Authentication required • Rate limited • Audit logged
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 16,
    borderWidth: 2,
    borderColor: '#28a745', // Green border indicating secure
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  predictionId: {
    marginTop: 5,
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  securityNotice: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#d4edda',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  securityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#155724',
    textAlign: 'center',
  },
  securitySubtext: {
    fontSize: 12,
    color: '#155724',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default SecureAIProcessorExample;