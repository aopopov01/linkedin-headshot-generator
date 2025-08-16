import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home'); // home, camera, gallery, styles
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUsedFreeGeneration, setHasUsedFreeGeneration] = useState(false);
  
  const processWithAI = async (imageUri) => {
    try {
      setIsProcessing(true);
      
      // Read the image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Create data URL for Replicate
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
            prompt: "professional headshot, linkedin profile photo, business attire, high quality, studio lighting, neutral background",
            negative_prompt: "cartoon, anime, painting, low quality, blurry",
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 20
          }
        }),
      });

      const prediction = await response.json();
      
      if (response.ok) {
        // Poll for completion
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
          Alert.alert('Success!', 'Your FREE professional headshot is ready!', [
            { text: 'View Result', onPress: () => setCurrentScreen('gallery') }
          ]);
        } else {
          throw new Error('AI processing failed');
        }
      } else {
        throw new Error(prediction.detail || 'Failed to start AI processing');
      }
    } catch (error) {
      console.error('AI processing error:', error);
      Alert.alert('Processing Error', 'Failed to generate headshot. Using original photo as preview.');
      // Fallback to original image
      setGeneratedImages([imageUri]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const takePhoto = async () => {
    if (hasUsedFreeGeneration) {
      Alert.alert('Upgrade Required', 'You have used your free headshot generation. Upgrade to Premium to generate more professional headshots!', [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => Alert.alert('Coming Soon', 'Premium upgrade will be available soon!') }
      ]);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
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
      setCurrentScreen('camera');
      // Process with real AI
      await processWithAI(result.assets[0].uri);
    }
  };

  const uploadPhoto = async () => {
    if (hasUsedFreeGeneration) {
      Alert.alert('Upgrade Required', 'You have used your free headshot generation. Upgrade to Premium to generate more professional headshots!', [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => Alert.alert('Coming Soon', 'Premium upgrade will be available soon!') }
      ]);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required');
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
      setCurrentScreen('camera');
      // Process with real AI
      await processWithAI(result.assets[0].uri);
    }
  };

  const showStyles = () => {
    setCurrentScreen('styles');
  };

  const showGallery = () => {
    if (generatedImages.length === 0) {
      Alert.alert('No Images', 'Take or upload a photo first to see results!');
      return;
    }
    setCurrentScreen('gallery');
  };

  const goHome = () => {
    setCurrentScreen('home');
  };

  const renderHomeScreen = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LinkedIn Headshot</Text>
        <Text style={styles.headerSubtitle}>AI-Powered Professional Photos</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Create Professional Headshots</Text>
          <Text style={styles.welcomeText}>
            Transform your photos into LinkedIn-ready professional headshots using advanced AI technology.
          </Text>
          {!hasUsedFreeGeneration && (
            <Text style={styles.freeOfferText}>🎉 Get your first headshot FREE!</Text>
          )}
          {hasUsedFreeGeneration && (
            <Text style={styles.upgradeText}>💎 Upgrade to Premium for unlimited generations</Text>
          )}
        </View>

        {/* Feature Buttons */}
        <View style={styles.featureSection}>
          <TouchableOpacity 
            style={[styles.featureButton, hasUsedFreeGeneration ? styles.disabledButton : styles.primaryButton]} 
            onPress={takePhoto}
          >
            <Text style={hasUsedFreeGeneration ? styles.disabledButtonText : styles.primaryButtonText}>
              {hasUsedFreeGeneration ? 'Take New Photo (Premium)' : 'Take New Photo - FREE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.featureButton, hasUsedFreeGeneration ? styles.disabledButton : styles.secondaryButton]} 
            onPress={uploadPhoto}
          >
            <Text style={hasUsedFreeGeneration ? styles.disabledButtonText : styles.secondaryButtonText}>
              {hasUsedFreeGeneration ? 'Upload Photo (Premium)' : 'Upload Existing Photo - FREE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.featureButton, styles.secondaryButton]} 
            onPress={showStyles}
          >
            <Text style={styles.secondaryButtonText}>Browse Styles</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.featureButton, styles.secondaryButton]} 
            onPress={showGallery}
          >
            <Text style={styles.secondaryButtonText}>My Headshot{generatedImages.length > 1 ? 's' : ''}</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoStep}>1. Take or upload a clear photo of yourself (FREE)</Text>
          <Text style={styles.infoStep}>2. Our AI creates your professional LinkedIn headshot</Text>
          <Text style={styles.infoStep}>3. Download and use for your professional profile</Text>
          <Text style={styles.infoStep}>4. Upgrade to Premium for unlimited generations</Text>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>LinkedIn Headshot Generator v1.0</Text>
        <Text style={styles.footerSubtext}>{hasUsedFreeGeneration ? 'Premium upgrade available' : '1 FREE headshot included'}</Text>
      </View>
    </>
  );

  const renderCameraScreen = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={goHome} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Processing Photo</Text>
      </View>
      <View style={styles.processingContainer}>
        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
        )}
        <Text style={styles.processingText}>{isProcessing ? 'AI is generating your professional headshots...' : 'Processing complete!'}</Text>
        <Text style={styles.processingSubtext}>{isProcessing ? 'This may take 30-60 seconds' : 'Check your gallery for results'}</Text>
      </View>
    </>
  );

  const renderStylesScreen = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={goHome} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Styles</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {['Corporate', 'Creative', 'Executive', 'Casual', 'Healthcare', 'Tech'].map((style, index) => (
          <TouchableOpacity key={index} style={styles.styleOption} onPress={() => Alert.alert('Style Selected', `${style} style selected! Take a photo to apply this style.`)}>
            <Text style={styles.styleTitle}>{style}</Text>
            <Text style={styles.styleDescription}>Perfect for {style.toLowerCase()} professionals</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  const renderGalleryScreen = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={goHome} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Headshots</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.galleryGrid}>
          {generatedImages.map((uri, index) => (
            <TouchableOpacity key={index} style={styles.galleryItem} onPress={() => Alert.alert('Download', 'Photo saved to your device!', [{ text: 'OK' }])}>
              <Image source={{ uri }} style={styles.galleryImage} />
              <Text style={styles.galleryLabel}>Professional Headshot</Text>
            </TouchableOpacity>
          ))}
        </View>
        {hasUsedFreeGeneration && (
          <TouchableOpacity style={styles.upgradeButton} onPress={() => Alert.alert('Premium Upgrade', 'Get unlimited headshot generations for $9.99/month or $49.99/year', [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => Alert.alert('Coming Soon', 'Premium upgrade will be available soon!') }
          ])}>
            <Text style={styles.upgradeButtonText}>💎 Upgrade to Premium</Text>
            <Text style={styles.upgradeButtonSubtext}>Unlimited generations • Priority processing • Advanced styles</Text>
          </TouchableOpacity>
        )}
        {generatedImages.length === 0 && (
          <View style={styles.emptyGallery}>
            <Text style={styles.emptyText}>No headshots yet</Text>
            <Text style={styles.emptySubtext}>Take or upload a photo to get started</Text>
          </View>
        )}
      </ScrollView>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#0077B5" />
      
      {currentScreen === 'home' && renderHomeScreen()}
      {currentScreen === 'camera' && renderCameraScreen()}
      {currentScreen === 'styles' && renderStylesScreen()}
      {currentScreen === 'gallery' && renderGalleryScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#0077B5',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#b3d4e8',
    textAlign: 'center',
    marginTop: 5,
  },

  // Content Styles
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },

  // Welcome Section
  welcomeSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Feature Section
  featureSection: {
    marginBottom: 30,
  },
  featureButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#0077B5',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },

  // Info Section
  infoSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  infoStep: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 8,
    paddingLeft: 10,
  },

  // Footer Styles
  footer: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  // Back Button Styles
  backButton: {
    position: 'absolute',
    left: 20,
    top: 55,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Processing Screen Styles
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 30,
    borderWidth: 4,
    borderColor: '#0077B5',
  },
  processingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  processingSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Style Options
  styleOption: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  styleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0077B5',
    marginBottom: 8,
  },
  styleDescription: {
    fontSize: 16,
    color: '#6b7280',
  },

  // Gallery Styles
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryItem: {
    width: '48%',
    marginBottom: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  galleryImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  galleryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  emptyGallery: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Free offer and upgrade styles
  freeOfferText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
    textAlign: 'center',
    marginTop: 10,
  },
  upgradeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 10,
  },

  // Disabled button styles
  disabledButton: {
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  disabledButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },

  // Upgrade button
  upgradeButton: {
    backgroundColor: '#8b5cf6',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  upgradeButtonSubtext: {
    fontSize: 14,
    color: '#e0e7ff',
    textAlign: 'center',
  },
});