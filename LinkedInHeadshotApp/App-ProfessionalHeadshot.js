// Enhanced LinkedIn Headshot App with Professional API Integration
// Features BetterPic and Replicate FLUX.1 APIs for premium quality results

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
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

// Import our new professional headshot components
import ProfessionalHeadshotProcessor from './src/components/headshot/ProfessionalHeadshotProcessor';

const { width: screenWidth } = Dimensions.get('window');

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('welcome'); // welcome, processing, results
  const [transformationResults, setTransformationResults] = useState(null);
  const [appReady, setAppReady] = useState(false);

  // Initialize app and request permissions
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Request image picker permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photos to create professional headshots.',
          [{ text: 'OK' }]
        );
      }
      setAppReady(true);
    } catch (error) {
      console.error('App initialization error:', error);
      setAppReady(true); // Continue anyway
    }
  };

  // Select image from gallery
  const selectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for headshots
        quality: 0.9,
        base64: false
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setCurrentScreen('processing');
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        base64: false
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setCurrentScreen('processing');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Handle transformation results
  const handleTransformationResults = (results) => {
    console.log('Transformation results received:', results);
    setTransformationResults(results);
    setCurrentScreen('results');
  };

  // Handle transformation error
  const handleTransformationError = (error) => {
    console.error('Transformation error:', error);
    Alert.alert(
      'Transformation Failed',
      error.message || 'Something went wrong. Please try again.',
      [
        { text: 'Try Again', onPress: () => setCurrentScreen('processing') },
        { text: 'Start Over', onPress: () => startOver() }
      ]
    );
  };

  // Start over
  const startOver = () => {
    setSelectedImage(null);
    setTransformationResults(null);
    setCurrentScreen('welcome');
  };

  // Render welcome screen
  const renderWelcomeScreen = () => (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.title}>Professional Headshots</Text>
        <Text style={styles.subtitle}>
          Transform your photo into a stunning professional headshot perfect for LinkedIn
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>✨ What You'll Get</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureName}>4K Quality</Text>
              <Text style={styles.featureDescription}>Studio-grade professional headshots</Text>
            </View>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureName}>Fast Results</Text>
              <Text style={styles.featureDescription}>1-60 minutes depending on quality</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🎨</Text>
              <Text style={styles.featureName}>Multiple Styles</Text>
              <Text style={styles.featureDescription}>Executive, creative, healthcare & more</Text>
            </View>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>💼</Text>
              <Text style={styles.featureName}>LinkedIn Ready</Text>
              <Text style={styles.featureDescription}>Perfect for professional profiles</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={selectImage}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.buttonGradient}>
              <Text style={styles.primaryButtonText}>📱 Choose from Gallery</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
            <Text style={styles.secondaryButtonText}>📷 Take New Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 Tips for Best Results</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Use good lighting (natural light works best)</Text>
            <Text style={styles.tipItem}>• Face the camera directly</Text>
            <Text style={styles.tipItem}>• Keep shoulders visible in frame</Text>
            <Text style={styles.tipItem}>• Avoid busy backgrounds</Text>
            <Text style={styles.tipItem}>• Smile naturally and look confident</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  // Render processing screen
  const renderProcessingScreen = () => (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.processingHeader}>
          <TouchableOpacity onPress={startOver} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Start Over</Text>
          </TouchableOpacity>
          <Text style={styles.processingTitle}>Create Professional Headshot</Text>
        </View>

        <ProfessionalHeadshotProcessor
          imageUri={selectedImage}
          onResultsReady={handleTransformationResults}
          onError={handleTransformationError}
          onProcessingUpdate={(status) => console.log('Processing update:', status)}
        />
      </SafeAreaView>
    </View>
  );

  // Render results screen
  const renderResultsScreen = () => (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultsHeader}>
          <TouchableOpacity onPress={startOver} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Create New</Text>
          </TouchableOpacity>
          <Text style={styles.resultsTitle}>Your Professional Headshots</Text>
        </View>

        <ScrollView contentContainerStyle={styles.resultsContent}>
          {/* Success Message */}
          <View style={styles.successBanner}>
            <LinearGradient colors={['#48bb78', '#38a169']} style={styles.successGradient}>
              <Text style={styles.successIcon}>✨</Text>
              <Text style={styles.successTitle}>Headshots Ready!</Text>
              <Text style={styles.successDescription}>
                Generated with {transformationResults?.provider} • {transformationResults?.quality}
              </Text>
            </LinearGradient>
          </View>

          {/* Results Grid */}
          {transformationResults?.result?.images && (
            <View style={styles.resultsGrid}>
              <Text style={styles.gridTitle}>Choose Your Favorite</Text>
              <View style={styles.imageGrid}>
                {transformationResults.result.images.map((imageUrl, index) => (
                  <TouchableOpacity key={index} style={styles.resultImageContainer}>
                    <Image source={{ uri: imageUrl }} style={styles.resultImage} />
                    <View style={styles.imageOverlay}>
                      <TouchableOpacity style={styles.downloadButton}>
                        <Text style={styles.downloadButtonText}>Download</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.resultsActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={startOver}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.buttonGradient}>
                <Text style={styles.primaryButtonText}>Create Another Set</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );

  // Loading screen
  if (!appReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading Professional Headshot App...</Text>
      </View>
    );
  }

  // Render appropriate screen
  return (
    <>
      <StatusBar style="light" />
      {currentScreen === 'welcome' && renderWelcomeScreen()}
      {currentScreen === 'processing' && renderProcessingScreen()}
      {currentScreen === 'results' && renderResultsScreen()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  safeArea: {
    flex: 1,
  },
  
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: 16,
    color: '#667eea',
    marginTop: 15,
  },
  
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  content: {
    padding: 20,
  },
  
  featuresSection: {
    marginBottom: 30,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    width: (screenWidth - 60) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  featureIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  
  featureName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 5,
  },
  
  featureDescription: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  actionSection: {
    marginBottom: 30,
  },
  
  primaryButton: {
    borderRadius: 15,
    marginBottom: 15,
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
    borderRadius: 15,
  },
  
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderRadius: 15,
  },
  
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 18,
  },
  
  tipsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  tipsList: {
    marginTop: 10,
  },
  
  tipItem: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
    lineHeight: 20,
  },
  
  processingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  
  backButton: {
    padding: 10,
  },
  
  backButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  
  processingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginLeft: 10,
  },
  
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginLeft: 10,
  },
  
  resultsContent: {
    padding: 20,
  },
  
  successBanner: {
    borderRadius: 15,
    marginBottom: 30,
    overflow: 'hidden',
  },
  
  successGradient: {
    padding: 25,
    alignItems: 'center',
  },
  
  successIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  
  successDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  
  resultsGrid: {
    marginBottom: 30,
  },
  
  gridTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  resultImageContainer: {
    width: (screenWidth - 60) / 2,
    height: (screenWidth - 60) / 2,
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  
  resultImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    alignItems: 'center',
  },
  
  downloadButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  resultsActions: {
    marginTop: 20,
  },
});

export default App;