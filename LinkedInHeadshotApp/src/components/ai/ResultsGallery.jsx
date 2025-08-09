import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Share,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 2;

const ResultsGallery = ({ navigation, route }) => {
  const { originalImage, selectedStyle, generatedImages } = route.params || {};
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handleDownload = () => {
    if (selectedImage) {
      // In a real app, this would download the selected image
      Alert.alert(
        'Download Started',
        'Your professional headshot is being saved to your gallery.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', 'Please select an image first');
    }
  };

  const handleShare = async () => {
    if (selectedImage) {
      try {
        await Share.share({
          message: 'Check out my new professional headshot created with AI!',
          // In a real app, would include the actual image URL
          url: selectedImage.uri,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to share image');
      }
    } else {
      Alert.alert('Error', 'Please select an image first');
    }
  };

  const handleCreateMore = () => {
    navigation.navigate('PhotoCapture');
  };

  const handleUpgrade = () => {
    navigation.navigate('PaymentScreen');
  };

  // Mock generated images for display
  const mockResults = [
    { id: 1, style: selectedStyle, isSelected: false },
    { id: 2, style: selectedStyle, isSelected: false },
    { id: 3, style: selectedStyle, isSelected: false },
    { id: 4, style: selectedStyle, isSelected: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Professional Headshots</Text>
          <Text style={styles.subtitle}>
            Tap to select your favorite, then download or share
          </Text>
        </View>

        <View style={styles.resultsGrid}>
          {mockResults.map((image) => (
            <TouchableOpacity
              key={image.id}
              style={[
                styles.imageCard,
                selectedImage?.id === image.id && styles.selectedImageCard,
              ]}
              onPress={() => handleImageSelect(image)}
              activeOpacity={0.7}
            >
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {selectedStyle} #{image.id}
                </Text>
              </View>

              {selectedImage?.id === image.id && (
                <View style={styles.selectedOverlay}>
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {selectedImage && (
          <View style={styles.actionContainer}>
            <Text style={styles.selectedImageText}>
              Image {selectedImage.id} selected
            </Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton]}
                onPress={handleDownload}
                activeOpacity={0.7}
              >
                <Text style={styles.downloadButtonText}>Download</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.shareButton]}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.createMoreButton}
            onPress={handleCreateMore}
            activeOpacity={0.7}
          >
            <Text style={styles.createMoreButtonText}>Create More Photos</Text>
          </TouchableOpacity>

          <View style={styles.upgradeContainer}>
            <Text style={styles.upgradeText}>
              Want unlimited headshots? Upgrade to Premium!
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.7}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  imageCard: {
    width: imageSize,
    height: imageSize,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedImageCard: {
    borderColor: '#0A66C2',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 102, 194, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    backgroundColor: '#0A66C2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  selectedImageText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#27AE60',
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#0A66C2',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomActions: {
    alignItems: 'center',
  },
  createMoreButton: {
    backgroundColor: '#34495E',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
  },
  createMoreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  upgradeText: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#F39C12',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResultsGallery;