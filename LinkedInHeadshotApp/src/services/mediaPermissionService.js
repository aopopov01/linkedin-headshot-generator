/**
 * Android Media Permission Service
 * Handles Android 13+ granular media permissions and Expo Go limitations
 */

import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import Constants from 'expo-constants';

export class MediaPermissionService {
  constructor() {
    this.isExpoGo = Constants.appOwnership === 'expo';
    this.androidApiLevel = Platform.OS === 'android' ? Platform.Version : null;
    this.supportsGranularPermissions = this.androidApiLevel >= 33; // Android 13+
  }

  /**
   * Check if running in Expo Go with limitations
   */
  isExpoGoWithLimitations() {
    return this.isExpoGo && Platform.OS === 'android' && this.supportsGranularPermissions;
  }

  /**
   * Get appropriate permission request strategy based on Android version and Expo environment
   */
  getPermissionStrategy() {
    if (this.isExpoGoWithLimitations()) {
      return 'expo_go_limited';
    } else if (this.supportsGranularPermissions) {
      return 'granular_permissions';
    } else {
      return 'legacy_permissions';
    }
  }

  /**
   * Request camera permissions with proper fallback handling
   */
  async requestCameraPermissions() {
    try {
      console.log(`📸 Requesting camera permissions - Strategy: ${this.getPermissionStrategy()}`);
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        this.showPermissionDeniedAlert('camera');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      this.showPermissionErrorAlert('camera', error.message);
      return false;
    }
  }

  /**
   * Request media library permissions with Android 13+ support
   */
  async requestMediaLibraryPermissions() {
    try {
      const strategy = this.getPermissionStrategy();
      console.log(`📱 Requesting media library permissions - Strategy: ${strategy}`);
      
      if (strategy === 'expo_go_limited') {
        return this.handleExpoGoLimitedPermissions();
      }
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        this.showPermissionDeniedAlert('media_library');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Media library permission error:', error);
      this.showPermissionErrorAlert('media_library', error.message);
      return false;
    }
  }

  /**
   * Request permissions to save media to device gallery
   */
  async requestMediaLibrarySavePermissions() {
    try {
      const strategy = this.getPermissionStrategy();
      console.log(`💾 Requesting media save permissions - Strategy: ${strategy}`);
      
      if (strategy === 'expo_go_limited') {
        return this.handleExpoGoSaveLimitedPermissions();
      }
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        this.showPermissionDeniedAlert('media_save');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Media save permission error:', error);
      this.showPermissionErrorAlert('media_save', error.message);
      return false;
    }
  }

  /**
   * Handle Expo Go limitations for media library access
   */
  async handleExpoGoLimitedPermissions() {
    return new Promise((resolve) => {
      Alert.alert(
        'Expo Go Limitation',
        'Due to Android 13+ permission changes, Expo Go has limited media library access.\n\nOptions:\n1. Continue with limited functionality\n2. Create a development build for full access',
        [
          {
            text: 'Continue Limited',
            onPress: () => {
              console.log('📱 User chose to continue with Expo Go limitations');
              resolve(true); // Allow limited functionality
            }
          },
          {
            text: 'Development Build Info',
            onPress: () => {
              this.showDevelopmentBuildInfo();
              resolve(false);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          }
        ]
      );
    });
  }

  /**
   * Handle Expo Go limitations for saving media
   */
  async handleExpoGoSaveLimitedPermissions() {
    return new Promise((resolve) => {
      Alert.alert(
        'Save Limitation in Expo Go',
        'Saving photos to gallery may not work reliably in Expo Go on Android 13+.\n\nFor full functionality, create a development build.',
        [
          {
            text: 'Try Anyway',
            onPress: () => {
              console.log('📱 User chose to try saving despite limitations');
              resolve(true);
            }
          },
          {
            text: 'Development Build Info',
            onPress: () => {
              this.showDevelopmentBuildInfo();
              resolve(false);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          }
        ]
      );
    });
  }

  /**
   * Show information about creating development builds
   */
  showDevelopmentBuildInfo() {
    Alert.alert(
      'Development Build Required',
      'For full media library functionality on Android 13+:\n\n1. Run: npm run dev-build:android\n2. Install the .apk on your device\n3. Enjoy full media access!\n\nDevelopment builds have all native permissions properly configured.',
      [
        { text: 'Got it', style: 'default' }
      ]
    );
  }

  /**
   * Show permission denied alert with specific guidance
   */
  showPermissionDeniedAlert(permissionType) {
    const messages = {
      camera: {
        title: 'Camera Permission Required',
        message: 'OmniShot needs camera access to take photos for professional headshot optimization.\n\nPlease enable camera permission in Settings.'
      },
      media_library: {
        title: 'Media Library Permission Required',
        message: 'OmniShot needs photo library access to select photos for optimization.\n\nPlease enable media/photos permission in Settings.'
      },
      media_save: {
        title: 'Save Permission Required',
        message: 'OmniShot needs permission to save optimized photos to your gallery.\n\nPlease enable photos/media permission in Settings.'
      }
    };

    const config = messages[permissionType] || messages.media_library;
    
    Alert.alert(
      config.title,
      config.message,
      [
        { text: 'Settings', onPress: this.openAppSettings },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  /**
   * Show permission error alert with troubleshooting info
   */
  showPermissionErrorAlert(permissionType, errorMessage) {
    Alert.alert(
      'Permission Error',
      `There was an error requesting ${permissionType} permission:\n\n${errorMessage}\n\nTroubleshooting:\n• Restart the app\n• Check Android Settings\n• For full functionality, use a development build`,
      [
        { text: 'Retry', onPress: () => this.requestAppropriatePermissions(permissionType) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  /**
   * Retry permission request based on type
   */
  async requestAppropriatePermissions(permissionType) {
    switch (permissionType) {
      case 'camera':
        return this.requestCameraPermissions();
      case 'media_library':
        return this.requestMediaLibraryPermissions();
      case 'media_save':
        return this.requestMediaLibrarySavePermissions();
      default:
        return false;
    }
  }

  /**
   * Open app settings (best effort)
   */
  openAppSettings() {
    console.log('📱 User should manually open app settings to enable permissions');
    // Note: Expo doesn't provide direct settings access, user must do this manually
  }

  /**
   * Check current permission status without requesting
   */
  async checkPermissionStatus() {
    try {
      const [cameraStatus, mediaStatus, saveStatus] = await Promise.all([
        ImagePicker.getCameraPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(),
        MediaLibrary.getPermissionsAsync()
      ]);

      return {
        camera: cameraStatus.status === 'granted',
        mediaLibrary: mediaStatus.status === 'granted',
        mediaSave: saveStatus.status === 'granted',
        strategy: this.getPermissionStrategy(),
        isExpoGo: this.isExpoGo,
        androidApiLevel: this.androidApiLevel,
        hasLimitations: this.isExpoGoWithLimitations()
      };
    } catch (error) {
      console.error('Permission status check error:', error);
      return {
        camera: false,
        mediaLibrary: false,
        mediaSave: false,
        strategy: this.getPermissionStrategy(),
        isExpoGo: this.isExpoGo,
        androidApiLevel: this.androidApiLevel,
        hasLimitations: this.isExpoGoWithLimitations(),
        error: error.message
      };
    }
  }

  /**
   * Log diagnostic information for debugging
   */
  logDiagnostics() {
    console.log('=== MEDIA PERMISSION DIAGNOSTICS ===');
    console.log(`Platform: ${Platform.OS}`);
    console.log(`Android API Level: ${this.androidApiLevel}`);
    console.log(`Expo Environment: ${this.isExpoGo ? 'Expo Go' : 'Development/Production Build'}`);
    console.log(`Permission Strategy: ${this.getPermissionStrategy()}`);
    console.log(`Supports Granular Permissions: ${this.supportsGranularPermissions}`);
    console.log(`Has Expo Go Limitations: ${this.isExpoGoWithLimitations()}`);
    console.log('=====================================');
  }
}

// Export singleton instance
export const mediaPermissionService = new MediaPermissionService();
export default mediaPermissionService;