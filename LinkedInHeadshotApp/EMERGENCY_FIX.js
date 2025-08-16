// EMERGENCY FIX - Safe Image Processing Functions
import * as ImageManipulator from 'expo-image-manipulator';

// Get image dimensions safely
const getImageInfo = async (imageUri) => {
  try {
    // Use Image.getSize from React Native instead of FileSystem.getInfoAsync
    return new Promise((resolve, reject) => {
      const Image = require('react-native').Image;
      Image.getSize(
        imageUri,
        (width, height) => {
          resolve({ width, height });
        },
        (error) => {
          // Fallback to default dimensions
          console.log('Image size detection failed, using defaults:', error);
          resolve({ width: 800, height: 800 });
        }
      );
    });
  } catch (error) {
    console.log('getImageInfo fallback to defaults:', error);
    return { width: 800, height: 800 };
  }
};

// Safe crop function that validates bounds
const safeCrop = (originalWidth, originalHeight, cropSettings) => {
  const { originX, originY, width, height } = cropSettings;
  
  // Ensure crop doesn't exceed image bounds
  const safeOriginX = Math.min(originX, originalWidth - 100);
  const safeOriginY = Math.min(originY, originalHeight - 100);
  const maxWidth = originalWidth - safeOriginX;
  const maxHeight = originalHeight - safeOriginY;
  const safeWidth = Math.min(width, maxWidth);
  const safeHeight = Math.min(height, maxHeight);
  
  return {
    originX: Math.max(0, safeOriginX),
    originY: Math.max(0, safeOriginY),
    width: Math.max(100, safeWidth),
    height: Math.max(100, safeHeight)
  };
};

// Safe professional enhancement
const safeCreateProfessionalEnhancement = async (imageUri, selectedStyle) => {
  try {
    // Get actual image dimensions
    const imageInfo = await getImageInfo(imageUri);
    console.log('Image dimensions:', imageInfo);

    // Start with safe resize to standard size
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 800, height: 800 } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Apply safe professional crop
    const cropSettings = { originX: 50, originY: 50, width: 700, height: 700 };
    const safeCropSettings = safeCrop(800, 800, cropSettings);
    
    const cropped = await ImageManipulator.manipulateAsync(
      resized.uri,
      [{ crop: safeCropSettings }],
      { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Final professional resize
    const final = await ImageManipulator.manipulateAsync(
      cropped.uri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );

    return final.uri;
  } catch (error) {
    console.log('Safe enhancement failed, using simple resize:', error);
    
    // Ultimate fallback - just resize
    try {
      const simple = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      return simple.uri;
    } catch (finalError) {
      console.log('Even simple resize failed:', finalError);
      return imageUri; // Return original if all else fails
    }
  }
};

// Safe tier success message function
const getTierSuccessMessage = (tier) => {
  const messages = {
    'TIER_1_PREMIUM': '🔥 PREMIUM AI TRANSFORMATION',
    'TIER_1_HUGGING_FACE': '🤗 HUGGING FACE AI ENHANCEMENT',
    'TIER_2_STABILITY_AI': '⚡ STABILITY AI PROFESSIONAL',
    'TIER_2_RUNWAY_ML': '🎬 RUNWAY ML TRANSFORMATION',
    'TIER_3_ADVANCED_LOCAL': '✨ ADVANCED AI SIMULATION',
    'TIER_4_PROFESSIONAL': '💼 PROFESSIONAL ENHANCEMENT',
    'FALLBACK': '📸 PROFESSIONAL PROCESSING'
  };
  
  return messages[tier] || '✨ PROFESSIONAL ENHANCEMENT';
};

export { getImageInfo, safeCrop, safeCreateProfessionalEnhancement, getTierSuccessMessage };