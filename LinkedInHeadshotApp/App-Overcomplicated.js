import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Image, 
  Animated, 
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUsedFreeGeneration, setHasUsedFreeGeneration] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    // Welcome animation
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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
            prompt: "professional LinkedIn headshot, business attire, executive lighting, studio quality, clean background",
            negative_prompt: "cartoon, anime, painting, low quality, blurry, casual clothing",
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
          Alert.alert('🎉 Success!', 'Your professional LinkedIn headshot is ready!', [
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
      Alert.alert('Processing Error', 'Failed to generate headshot. Please try again.');
      setGeneratedImages([imageUri]);
    } finally {
      setIsProcessing(false);
    }
  };

  const takePhoto = async () => {
    if (hasUsedFreeGeneration) {
      Alert.alert('🔒 Upgrade to Premium', 'You\'ve used your free LinkedIn headshot. Unlock unlimited professional headshots!', [
        { text: 'Maybe Later', style: 'cancel' },
        { text: '💎 Upgrade Now', onPress: showPremiumModal }
      ]);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'We need camera access to take your professional photo');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setCurrentScreen('processing');
      await processWithAI(result.assets[0].uri);
    }
  };

  const uploadPhoto = async () => {
    if (hasUsedFreeGeneration) {
      Alert.alert('🔒 Upgrade to Premium', 'You\'ve used your free LinkedIn headshot. Unlock unlimited professional headshots!', [
        { text: 'Maybe Later', style: 'cancel' },
        { text: '💎 Upgrade Now', onPress: showPremiumModal }
      ]);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Photo Permission', 'We need photo library access to upload your photo');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setCurrentScreen('processing');
      await processWithAI(result.assets[0].uri);
    }
  };

  const showPremiumModal = () => {
    Alert.alert('💎 Premium Features', 'Unlimited headshots • Priority processing • LinkedIn optimization • Advanced styles', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Coming Soon!', onPress: () => Alert.alert('Stay Tuned', 'Premium features launching soon!') }
    ]);
  };

  const goHome = () => setCurrentScreen('home');

  const renderHeader = (title, showBack = false) => (
    <LinearGradient colors={['#2D5A41', '#1A365D']} style={styles.header}>
      <View style={styles.headerContent}>
        {showBack && (
          <TouchableOpacity onPress={goHome} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerRight} />
      </View>
    </LinearGradient>
  );

  const renderHomeScreen = () => (
    <Animated.View style={[styles.container, { opacity: animatedValue }]}>
      {renderHeader('LinkedIn Headshots')}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient colors={['#F7FAFC', '#EDF2F7']} style={styles.heroSection}>
          <Text style={styles.heroTitle}>Professional Headshots</Text>
          <Text style={styles.heroSubtitle}>Powered by AI • Optimized for LinkedIn</Text>
          
          {!hasUsedFreeGeneration ? (
            <View style={styles.freeOfferBadge}>
              <Text style={styles.freeOfferText}>🎉 First headshot FREE</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.premiumBadge} onPress={showPremiumModal}>
              <Text style={styles.premiumBadgeText}>💎 Upgrade for unlimited</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Action Cards */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.primaryCard]}
            onPress={takePhoto}
          >
            <LinearGradient 
              colors={hasUsedFreeGeneration ? ['#E2E8F0', '#CBD5E0'] : ['#F6AD55', '#ED8936']} 
              style={styles.actionCardGradient}
            >
              <Text style={styles.actionCardIcon}>📷</Text>
              <Text style={[styles.actionCardTitle, hasUsedFreeGeneration && styles.disabledText]}>
                Take Photo
              </Text>
              <Text style={[styles.actionCardSubtitle, hasUsedFreeGeneration && styles.disabledText]}>
                {hasUsedFreeGeneration ? 'Premium Feature' : 'Camera • Free'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.secondaryCard]}
            onPress={uploadPhoto}
          >
            <View style={[styles.actionCardContent, hasUsedFreeGeneration && styles.disabledCard]}>
              <Text style={styles.actionCardIcon}>📁</Text>
              <Text style={[styles.actionCardTitle, hasUsedFreeGeneration && styles.disabledText]}>
                Upload Photo
              </Text>
              <Text style={[styles.actionCardSubtitle, hasUsedFreeGeneration && styles.disabledText]}>
                {hasUsedFreeGeneration ? 'Premium Feature' : 'Library • Free'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Choose LinkedIn Headshots?</Text>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Lightning Fast</Text>
              <Text style={styles.featureDescription}>Professional results in under 30 minutes</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>LinkedIn Optimized</Text>
              <Text style={styles.featureDescription}>Specifically designed for professional success</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📱</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Mobile First</Text>
              <Text style={styles.featureDescription}>Perfect experience on your phone</Text>
            </View>
          </View>
        </View>

        {generatedImages.length > 0 && (
          <TouchableOpacity 
            style={styles.galleryPreview} 
            onPress={() => setCurrentScreen('gallery')}
          >
            <Text style={styles.galleryPreviewTitle}>View Your Headshot</Text>
            <Text style={styles.galleryPreviewSubtitle}>Tap to see full results →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </Animated.View>
  );

  const renderProcessingScreen = () => (
    <View style={styles.container}>
      {renderHeader('Processing', true)}
      
      <View style={styles.processingContainer}>
        <View style={styles.processingImageContainer}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.processingImage} />
          )}
          <LinearGradient 
            colors={['rgba(45, 90, 65, 0.1)', 'rgba(45, 90, 65, 0.3)']} 
            style={styles.processingOverlay}
          />
        </View>
        
        <View style={styles.processingContent}>
          <Text style={styles.processingTitle}>
            {isProcessing ? 'AI is crafting your professional headshot' : 'Processing Complete!'}
          </Text>
          <Text style={styles.processingSubtitle}>
            {isProcessing ? 'This may take 20-30 seconds' : 'Check your results'}
          </Text>
          
          {isProcessing && (
            <View style={styles.processingSteps}>
              <Text style={styles.processingStep}>✓ Analyzing photo composition</Text>
              <Text style={styles.processingStep}>⚡ Applying LinkedIn optimization</Text>
              <Text style={styles.processingStep}>🎨 Enhancing professional quality</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderGalleryScreen = () => (
    <View style={styles.container}>
      {renderHeader('Your Headshot', true)}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.galleryContainer}>
          {generatedImages.map((uri, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.galleryImageContainer}
              onPress={() => Alert.alert('Download', 'Photo saved to your device!', [{ text: 'OK' }])}
            >
              <Image source={{ uri }} style={styles.galleryImage} />
              <LinearGradient 
                colors={['transparent', 'rgba(0,0,0,0.6)']} 
                style={styles.galleryImageOverlay}
              >
                <Text style={styles.galleryImageLabel}>Professional Headshot</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {hasUsedFreeGeneration && (
          <TouchableOpacity style={styles.upgradeCard} onPress={showPremiumModal}>
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.upgradeCardGradient}>
              <Text style={styles.upgradeCardIcon}>💎</Text>
              <Text style={styles.upgradeCardTitle}>Upgrade to Premium</Text>
              <Text style={styles.upgradeCardSubtitle}>
                Unlimited headshots • Advanced styles • Priority processing
              </Text>
              <Text style={styles.upgradeCardPrice}>Starting at $39/month</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {generatedImages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📸</Text>
            <Text style={styles.emptyStateTitle}>No headshots yet</Text>
            <Text style={styles.emptyStateSubtitle}>Take or upload a photo to get started</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="light" backgroundColor="#2D5A41" />
      
      {currentScreen === 'home' && renderHomeScreen()}
      {currentScreen === 'processing' && renderProcessingScreen()}
      {currentScreen === 'gallery' && renderGalleryScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header Styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 60,
  },
  backButton: {
    width: 60,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 20,
  },
  freeOfferBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  freeOfferText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  premiumBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Action Cards
  actionSection: {
    padding: 20,
    gap: 16,
  },
  actionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCard: {
    height: 120,
  },
  secondaryCard: {
    height: 120,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  actionCardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  disabledCard: {
    backgroundColor: '#F7FAFC',
  },
  disabledText: {
    color: '#A0AEC0',
  },

  // Features Section
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#4A5568',
  },

  // Gallery Preview
  galleryPreview: {
    margin: 20,
    padding: 20,
    backgroundColor: '#2D5A41',
    borderRadius: 16,
    alignItems: 'center',
  },
  galleryPreviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  galleryPreviewSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Processing Screen
  processingContainer: {
    flex: 1,
    padding: 20,
  },
  processingImageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  processingImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#F6AD55',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
  },
  processingContent: {
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 30,
  },
  processingSteps: {
    alignItems: 'flex-start',
  },
  processingStep: {
    fontSize: 16,
    color: '#2D5A41',
    marginBottom: 8,
    fontWeight: '500',
  },

  // Gallery Screen
  galleryContainer: {
    padding: 20,
  },
  galleryImageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  galleryImage: {
    width: '100%',
    height: 300,
    borderRadius: 20,
  },
  galleryImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  galleryImageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Upgrade Card
  upgradeCard: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeCardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  upgradeCardIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  upgradeCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  upgradeCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeCardPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
  },
});