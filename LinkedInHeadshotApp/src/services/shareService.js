// Share Service for social media sharing functionality
import { Share, Alert, Platform } from 'react-native';
import RNFS from 'react-native-fs';

class ShareService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize share service
  initialize() {
    this.isInitialized = true;
    console.log('ShareService initialized successfully');
  }

  // Share image to social platforms
  async shareImage(imageUri, message = '', options = {}) {
    try {
      const shareOptions = {
        message: message || 'Check out my new professional headshot!',
        url: imageUri,
        ...options,
      };

      const result = await Share.share(shareOptions);
      
      return {
        success: true,
        action: result.action,
        activityType: result.activityType,
      };
    } catch (error) {
      console.error('Share failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Share to LinkedIn specifically
  async shareToLinkedIn(imageUri, caption = '') {
    const linkedInMessage = `${caption}\n\n🚀 Created with AI-powered professional headshot generator\n#ProfessionalHeadshot #LinkedIn #CareerSuccess`;
    
    return this.shareImage(imageUri, linkedInMessage, {
      title: 'My New Professional Headshot',
      subject: 'Professional Headshot for LinkedIn',
    });
  }

  // Share with career-focused message
  async shareCareerUpdate(imageUri, context = 'new_role') {
    const messages = {
      new_role: '🎉 Excited to share my new professional headshot as I start my next career chapter! #NewJob #ProfessionalHeadshot',
      job_search: '📈 Updated my professional headshot to stand out in my job search! #JobSearch #Professional #LinkedInProfile',
      career_change: '🔄 New industry, new me! Updated my professional image for this exciting career transition. #CareerChange #Professional',
      promotion: '🚀 Celebrating my recent promotion with a fresh professional headshot! #Promotion #Professional #CareerSuccess',
      default: '✨ Just updated my professional headshot! #Professional #LinkedInProfile #CareerSuccess'
    };

    const message = messages[context] || messages.default;
    return this.shareToLinkedIn(imageUri, message);
  }

  // Share text-only message
  async shareText(message, options = {}) {
    try {
      const shareOptions = {
        message,
        ...options,
      };

      const result = await Share.share(shareOptions);
      
      return {
        success: true,
        action: result.action,
        activityType: result.activityType,
      };
    } catch (error) {
      console.error('Text share failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Share app recommendation
  async shareAppRecommendation() {
    const message = Platform.select({
      ios: '🤳 Just created amazing professional headshots with this AI app! Perfect for LinkedIn profiles.\n\nDownload: [App Store Link]',
      android: '🤳 Just created amazing professional headshots with this AI app! Perfect for LinkedIn profiles.\n\nDownload: [Play Store Link]',
      default: '🤳 Just created amazing professional headshots with this AI app! Perfect for LinkedIn profiles.'
    });

    return this.shareText(message, {
      title: 'Professional Headshot AI App',
    });
  }

  // Save and share image
  async saveAndShareImage(imageBase64, filename, message = '') {
    try {
      // Create file path
      const filePath = `${RNFS.CachesDirectoryPath}/${filename || 'headshot.jpg'}`;
      
      // Save base64 image to file
      await RNFS.writeFile(filePath, imageBase64, 'base64');
      
      // Share the saved image
      const result = await this.shareImage(`file://${filePath}`, message);
      
      // Clean up temporary file
      setTimeout(() => {
        RNFS.unlink(filePath).catch(console.error);
      }, 10000); // Delete after 10 seconds
      
      return result;
    } catch (error) {
      console.error('Save and share failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Share with custom platforms
  async shareWithOptions(content, platforms = []) {
    try {
      // Show platform selection if multiple options
      if (platforms.length > 1) {
        return this.showSharingOptions(content, platforms);
      }
      
      // Direct share for single platform
      return this.shareToSpecificPlatform(content, platforms[0]);
    } catch (error) {
      console.error('Platform-specific share failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Show sharing options dialog
  showSharingOptions(content, platforms) {
    return new Promise((resolve) => {
      const buttons = platforms.map(platform => ({
        text: this.getPlatformName(platform),
        onPress: async () => {
          const result = await this.shareToSpecificPlatform(content, platform);
          resolve(result);
        },
      }));

      buttons.push({
        text: 'Cancel',
        style: 'cancel',
        onPress: () => resolve({ success: false, cancelled: true }),
      });

      Alert.alert(
        'Share your headshot',
        'Choose where to share your professional photo:',
        buttons
      );
    });
  }

  // Share to specific platform
  async shareToSpecificPlatform(content, platform) {
    const { imageUri, message } = content;
    
    switch (platform) {
      case 'linkedin':
        return this.shareToLinkedIn(imageUri, message);
      
      case 'email':
        return this.shareViaEmail(imageUri, message);
      
      case 'messages':
        return this.shareViaMessages(imageUri, message);
      
      case 'general':
      default:
        return this.shareImage(imageUri, message);
    }
  }

  // Share via email
  async shareViaEmail(imageUri, message = '') {
    const emailMessage = `${message}\n\nSent from Professional Headshot AI`;
    
    return this.shareImage(imageUri, emailMessage, {
      title: 'My Professional Headshot',
      subject: 'New Professional Headshot',
    });
  }

  // Share via messages/SMS
  async shareViaMessages(imageUri, message = '') {
    const smsMessage = `${message} 🤳`;
    return this.shareImage(imageUri, smsMessage);
  }

  // Get platform display name
  getPlatformName(platform) {
    const names = {
      linkedin: 'LinkedIn',
      email: 'Email',
      messages: 'Messages',
      general: 'More Options',
    };
    
    return names[platform] || platform;
  }

  // Generate sharing analytics data
  getShareAnalytics(platform, contentType) {
    return {
      platform,
      content_type: contentType,
      timestamp: new Date().toISOString(),
      app_version: '1.0.0', // Would get from app config
    };
  }

  // Check if sharing is available
  isShareAvailable() {
    return Share && typeof Share.share === 'function';
  }

  // Format message for different contexts
  formatShareMessage(template, customization = {}) {
    const templates = {
      professional: '✨ Just updated my professional headshot! Perfect for LinkedIn and career opportunities. #ProfessionalHeadshot #CareerSuccess',
      
      job_search: '📈 Ready for new opportunities with my fresh professional headshot! #JobSearch #LinkedInProfile #Professional',
      
      achievement: '🏆 Celebrating career milestones with a new professional look! #Professional #CareerSuccess #Achievement',
      
      networking: '🤝 Updated my professional image for upcoming networking events! #Networking #Professional #LinkedInProfile',
      
      simple: 'Check out my new professional headshot! 📸'
    };

    let message = templates[template] || templates.simple;
    
    // Apply customizations
    if (customization.hashtags) {
      message += ` ${customization.hashtags}`;
    }
    
    if (customization.mention) {
      message += `\n\nThanks to ${customization.mention}`;
    }
    
    return message;
  }
}

// Export singleton instance
export default new ShareService();