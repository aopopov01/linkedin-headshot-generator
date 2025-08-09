// Image Processing Utilities
import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';

class ImageProcessingUtils {
  
  // Resize image for optimal processing
  static async resizeForProcessing(imageUri, options = {}) {
    try {
      const defaultOptions = {
        width: 1024,
        height: 1024,
        quality: 90,
        outputFormat: 'JPEG',
        mode: 'cover',
        ...options,
      };

      const resizedImage = await ImageResizer.createResizedImage(
        imageUri,
        defaultOptions.width,
        defaultOptions.height,
        defaultOptions.outputFormat,
        defaultOptions.quality,
        0, // rotation
        null, // outputPath
        false, // keepMeta
        {
          mode: defaultOptions.mode,
          onlyScaleDown: true,
        }
      );

      return {
        uri: resizedImage.uri,
        width: resizedImage.width,
        height: resizedImage.height,
        size: resizedImage.size,
      };
    } catch (error) {
      console.error('Image resize failed:', error);
      throw new Error('Failed to resize image for processing');
    }
  }

  // Convert image to base64
  static async convertToBase64(imageUri, includePrefix = true) {
    try {
      const base64String = await RNFS.readFile(imageUri, 'base64');
      
      if (includePrefix) {
        return `data:image/jpeg;base64,${base64String}`;
      }
      
      return base64String;
    } catch (error) {
      console.error('Base64 conversion failed:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  // Validate image dimensions and quality
  static validateImageQuality(imageInfo) {
    const { width, height, size } = imageInfo;
    const issues = [];
    
    // Check minimum dimensions
    if (width < 400 || height < 400) {
      issues.push('Image resolution too low. Please use an image at least 400x400 pixels.');
    }
    
    // Check maximum dimensions
    if (width > 4000 || height > 4000) {
      issues.push('Image resolution too high. Please use an image smaller than 4000x4000 pixels.');
    }
    
    // Check file size
    if (size && size > 10 * 1024 * 1024) { // 10MB
      issues.push('Image file size too large. Please use an image smaller than 10MB.');
    }
    
    // Check aspect ratio
    const aspectRatio = width / height;
    if (aspectRatio < 0.5 || aspectRatio > 2.0) {
      issues.push('Image aspect ratio should be closer to square for best results.');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations: this.getQualityRecommendations(imageInfo),
    };
  }

  // Get image quality recommendations
  static getQualityRecommendations(imageInfo) {
    const recommendations = [];
    
    if (imageInfo.width < 800 || imageInfo.height < 800) {
      recommendations.push('For best results, use an image at least 800x800 pixels');
    }
    
    recommendations.push('Ensure good lighting and clear visibility of your face');
    recommendations.push('Use a plain background when possible');
    recommendations.push('Face should be centered and looking at the camera');
    
    return recommendations;
  }

  // Crop image to square aspect ratio
  static async cropToSquare(imageUri, options = {}) {
    try {
      const defaultOptions = {
        quality: 90,
        outputFormat: 'JPEG',
        ...options,
      };

      // First get image dimensions
      const imageInfo = await this.getImageDimensions(imageUri);
      const size = Math.min(imageInfo.width, imageInfo.height);
      
      const croppedImage = await ImageResizer.createResizedImage(
        imageUri,
        size,
        size,
        defaultOptions.outputFormat,
        defaultOptions.quality,
        0, // rotation
        null, // outputPath
        false, // keepMeta
        {
          mode: 'cover',
        }
      );

      return {
        uri: croppedImage.uri,
        width: croppedImage.width,
        height: croppedImage.height,
        size: croppedImage.size,
      };
    } catch (error) {
      console.error('Image crop failed:', error);
      throw new Error('Failed to crop image to square');
    }
  }

  // Get image dimensions
  static async getImageDimensions(imageUri) {
    return new Promise((resolve, reject) => {
      const Image = require('react-native').Image;
      
      Image.getSize(
        imageUri,
        (width, height) => {
          resolve({ width, height });
        },
        (error) => {
          reject(new Error('Failed to get image dimensions'));
        }
      );
    });
  }

  // Optimize image for LinkedIn profile
  static async optimizeForLinkedIn(imageUri) {
    try {
      const linkedInSpecs = {
        width: 800,
        height: 800,
        quality: 85,
        outputFormat: 'JPEG',
        mode: 'cover',
      };

      return await this.resizeForProcessing(imageUri, linkedInSpecs);
    } catch (error) {
      console.error('LinkedIn optimization failed:', error);
      throw new Error('Failed to optimize image for LinkedIn');
    }
  }

  // Create multiple sized versions
  static async createMultipleSizes(imageUri, sizes = []) {
    try {
      const defaultSizes = [
        { name: 'thumbnail', width: 150, height: 150 },
        { name: 'medium', width: 400, height: 400 },
        { name: 'large', width: 800, height: 800 },
        { name: 'linkedin', width: 800, height: 800 },
        ...sizes,
      ];

      const results = {};
      
      for (const size of defaultSizes) {
        try {
          const resized = await this.resizeForProcessing(imageUri, {
            width: size.width,
            height: size.height,
            quality: size.quality || 85,
          });
          results[size.name] = resized;
        } catch (error) {
          console.warn(`Failed to create ${size.name} size:`, error);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Multiple sizes creation failed:', error);
      throw new Error('Failed to create multiple image sizes');
    }
  }

  // Apply basic image filters/enhancements
  static async enhanceImage(imageUri, enhancements = {}) {
    try {
      const {
        brightness = 0,
        contrast = 0,
        saturation = 0,
        quality = 90,
      } = enhancements;

      // For now, just return optimized version
      // In a full implementation, you'd apply actual filters
      return await this.resizeForProcessing(imageUri, { quality });
    } catch (error) {
      console.error('Image enhancement failed:', error);
      throw new Error('Failed to enhance image');
    }
  }

  // Compress image while maintaining quality
  static async compressImage(imageUri, targetSize = 2 * 1024 * 1024) { // 2MB default
    try {
      let quality = 90;
      let result = await this.resizeForProcessing(imageUri, { quality });
      
      // Iteratively reduce quality if file is too large
      while (result.size > targetSize && quality > 20) {
        quality -= 10;
        result = await this.resizeForProcessing(imageUri, { quality });
      }
      
      return result;
    } catch (error) {
      console.error('Image compression failed:', error);
      throw new Error('Failed to compress image');
    }
  }

  // Save image to device gallery
  static async saveToGallery(imageUri, filename) {
    try {
      // This would integrate with react-native-cameraroll or similar
      // For now, just return success
      console.log(`Would save ${filename} to gallery`);
      return {
        success: true,
        path: imageUri,
      };
    } catch (error) {
      console.error('Save to gallery failed:', error);
      throw new Error('Failed to save image to gallery');
    }
  }

  // Clean up temporary files
  static async cleanupTempFiles(filePaths = []) {
    try {
      const cleanupPromises = filePaths.map(path => 
        RNFS.unlink(path).catch(console.warn)
      );
      
      await Promise.all(cleanupPromises);
      console.log('Cleaned up temporary files');
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  // Get file info
  static async getFileInfo(filePath) {
    try {
      const stat = await RNFS.stat(filePath);
      return {
        size: stat.size,
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        mtime: stat.mtime,
        ctime: stat.ctime,
      };
    } catch (error) {
      console.error('Get file info failed:', error);
      return null;
    }
  }
}

export default ImageProcessingUtils;