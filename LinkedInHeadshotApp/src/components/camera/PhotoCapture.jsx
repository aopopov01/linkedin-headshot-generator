import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

const PhotoCapture = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImagePicker = () => {
    const options = {
      title: 'Select Photo',
      mediaType: 'photo',
      quality: 1,
      maxWidth: 1024,
      maxHeight: 1024,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    Alert.alert(
      'Select Photo',
      'Choose how you want to capture your headshot',
      [
        { text: 'Camera', onPress: () => openCamera(options) },
        { text: 'Gallery', onPress: () => openGallery(options) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = (options) => {
    launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const openGallery = (options) => {
    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const proceedToStyleSelection = () => {
    if (selectedImage) {
      navigation.navigate('StyleSelector', { image: selectedImage });
    } else {
      Alert.alert('Error', 'Please select a photo first');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Capture Your Photo</Text>
          <Text style={styles.subtitle}>
            Follow our guidelines for the best results
          </Text>
        </View>

        <View style={styles.guidelinesContainer}>
          <Text style={styles.guidelinesTitle}>Photo Guidelines:</Text>
          <Text style={styles.guideline}>• Face should be clearly visible</Text>
          <Text style={styles.guideline}>• Good lighting (natural light preferred)</Text>
          <Text style={styles.guideline}>• Look directly at the camera</Text>
          <Text style={styles.guideline}>• Plain background works best</Text>
          <Text style={styles.guideline}>• Shoulders should be visible</Text>
        </View>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleImagePicker}
          activeOpacity={0.7}
        >
          <Text style={styles.captureButtonText}>
            {selectedImage ? 'Change Photo' : 'Take Photo'}
          </Text>
        </TouchableOpacity>

        {selectedImage && (
          <View style={styles.selectedImageInfo}>
            <Text style={styles.selectedImageText}>✓ Photo selected</Text>
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={proceedToStyleSelection}
              activeOpacity={0.7}
            >
              <Text style={styles.proceedButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: 40,
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
  },
  guidelinesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  guidelinesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
  },
  guideline: {
    fontSize: 16,
    color: '#34495E',
    marginBottom: 8,
    lineHeight: 22,
  },
  captureButton: {
    backgroundColor: '#0A66C2',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  captureButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  selectedImageInfo: {
    alignItems: 'center',
  },
  selectedImageText: {
    fontSize: 16,
    color: '#27AE60',
    fontWeight: '500',
    marginBottom: 15,
  },
  proceedButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  proceedButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhotoCapture;