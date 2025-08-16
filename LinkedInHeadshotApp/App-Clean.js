import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  Image, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUsedFreeGeneration, setHasUsedFreeGeneration] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const processWithAI = async (imageUri) => {
    try {
      setIsProcessing(true);
      
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': 'Token YOUR_REPLICATE_API_KEY_HERE',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "8abccf52e7cba9f6e82317253f4a3549082e966db5584e92c808ece132037776",
          input: {
            image: dataUrl,
            prompt: "professional LinkedIn headshot, business attire, studio lighting, clean background",
            negative_prompt: "cartoon, anime, painting, low quality, blurry",
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 25
          }
        }),
      });

      const prediction = await response.json();
      
      if (response.ok) {
        let result = prediction;
        while (result.status === 'starting' || result.status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
            headers: {
              'Authorization': 'Token YOUR_REPLICATE_API_KEY_HERE',
            },
          });
          result = await pollResponse.json();
        }
        
        if (result.status === 'succeeded' && result.output) {
          setGeneratedImages(result.output);
          setHasUsedFreeGeneration(true);
          setShowResult(true);
        } else {
          throw new Error('AI processing failed');
        }
      } else {
        throw new Error(prediction.detail || 'Failed to start AI processing');
      }
    } catch (error) {
      console.error('AI processing error:', error);
      Alert.alert('Error', 'Failed to generate headshot. Please try again.');
      setGeneratedImages([imageUri]);
      setHasUsedFreeGeneration(true);
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const takePhoto = async () => {
    if (hasUsedFreeGeneration) {
      Alert.alert('Upgrade Required', 'You\'ve used your free headshot. Upgrade to create more!', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => Alert.alert('Coming Soon', 'Premium features coming soon!') }
      ]);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      await processWithAI(result.assets[0].uri);
    }
  };

  const uploadPhoto = async () => {
    if (hasUsedFreeGeneration) {
      Alert.alert('Upgrade Required', 'You\'ve used your free headshot. Upgrade to create more!', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => Alert.alert('Coming Soon', 'Premium features coming soon!') }
      ]);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      await processWithAI(result.assets[0].uri);
    }
  };

  const resetApp = () => {
    setSelectedImage(null);
    setGeneratedImages([]);
    setShowResult(false);
  };

  const downloadImage = () => {
    Alert.alert('Download', 'Image would be saved to your photos', [{ text: 'OK' }]);
  };

  // Show processing screen
  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.processingContainer}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.processingImage} />
          )}
          <ActivityIndicator size="large" color="#0066CC" style={styles.spinner} />
          <Text style={styles.processingText}>Creating your professional headshot...</Text>
          <Text style={styles.processingSubtext}>This will take about 30 seconds</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show result screen
  if (showResult && generatedImages.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Your Professional Headshot</Text>
          
          <View style={styles.imageComparison}>
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>Original</Text>
              <Image source={{ uri: selectedImage }} style={styles.resultImage} />
            </View>
            
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>AI Enhanced</Text>
              <Image source={{ uri: generatedImages[0] }} style={styles.resultImage} />
            </View>
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.downloadButton} onPress={downloadImage}>
              <Text style={styles.downloadButtonText}>Download Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.newPhotoButton} onPress={resetApp}>
              <Text style={styles.newPhotoButtonText}>Create Another</Text>
            </TouchableOpacity>
          </View>

          {hasUsedFreeGeneration && (
            <View style={styles.upgradePrompt}>
              <Text style={styles.upgradeText}>💎 Upgrade to create unlimited headshots</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Main home screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>LinkedIn Headshots</Text>
        <Text style={styles.subtitle}>AI-powered professional photos</Text>
        
        {!hasUsedFreeGeneration && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>First headshot free!</Text>
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

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoStep}>1. Take or upload a photo</Text>
          <Text style={styles.infoStep}>2. AI creates your professional headshot</Text>
          <Text style={styles.infoStep}>3. Download and use on LinkedIn</Text>
        </View>

        {generatedImages.length > 0 && (
          <TouchableOpacity style={styles.viewResultButton} onPress={() => setShowResult(true)}>
            <Text style={styles.viewResultText}>View Your Result</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {hasUsedFreeGeneration ? 'Upgrade for unlimited headshots' : 'One free headshot included'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    marginBottom: 16,
  },
  freeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  freeBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Main Content
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
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
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
  disabledButtonText: {
    color: '#9CA3AF',
  },

  // Info Section
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

  // View Result Button
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

  // Footer
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

  // Processing Screen
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  processingImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 24,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Result Screen
  resultContainer: {
    flex: 1,
    padding: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  imageComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
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

  // Result Actions
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

  // Upgrade Prompt
  upgradePrompt: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeText: {
    fontSize: 14,
    color: '#1D4ED8',
    fontWeight: '600',
  },
});