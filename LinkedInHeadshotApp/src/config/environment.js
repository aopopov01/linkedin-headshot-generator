/**
 * Environment Configuration for OmniShot
 * Handles different API endpoints for development, testing, and production
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Network configuration for mobile-backend connectivity
const getDevServerUrl = () => {
  // Primary development server IP (WSL2/Linux host)
  const HOST_IP = '192.168.20.112';
  const BACKEND_PORT = '3000';
  
  if (__DEV__) {
    // Priority order for development connectivity:
    
    // 1. Expo tunnel (if available) - best for external testing
    if (Constants.expoConfig?.hostUri) {
      const [host] = Constants.expoConfig.hostUri.split(':');
      // Use tunnel for Expo Go, but prefer direct IP for development builds
      if (Constants.appOwnership === 'expo') {
        return `http://${host}:${BACKEND_PORT}`;
      }
    }
    
    // 2. Direct IP connection - most reliable for local development
    // This works for both physical devices and emulators on same network
    return `http://${HOST_IP}:${BACKEND_PORT}`;
  }
  
  // Production API endpoint
  return 'https://api.omnishot.app';
};

const Environment = {
  // API Configuration
  API_BASE_URL: getDevServerUrl(),
  API_TIMEOUT: 120000, // 2 minutes for AI processing
  
  // Development flags
  IS_DEVELOPMENT: __DEV__,
  IS_EXPO_GO: Constants.appOwnership === 'expo',
  
  // Network configuration
  NETWORK_RETRY_ATTEMPTS: 3,
  NETWORK_RETRY_DELAY: 1000,
  
  // Fallback configuration
  USE_FALLBACK_ON_NETWORK_ERROR: true,
  ENABLE_NETWORK_DEBUGGING: __DEV__,
  
  // Platform detection
  PLATFORM: Platform.OS,
  
  // Get current environment info
  getEnvironmentInfo: () => ({
    apiBaseUrl: Environment.API_BASE_URL,
    isDevelopment: Environment.IS_DEVELOPMENT,
    isExpoGo: Environment.IS_EXPO_GO,
    platform: Environment.PLATFORM,
    expoVersion: Constants.expoVersion,
    deviceInfo: {
      deviceName: Constants.deviceName,
      platform: Platform.OS,
      platformVersion: Platform.Version
    }
  }),
  
  // Network debugging helper
  logNetworkAttempt: (endpoint, method = 'GET') => {
    if (Environment.ENABLE_NETWORK_DEBUGGING) {
      console.log('🌐 Network Request:', {
        url: `${Environment.API_BASE_URL}${endpoint}`,
        method,
        timestamp: new Date().toISOString(),
        environment: Environment.IS_DEVELOPMENT ? 'development' : 'production'
      });
    }
  },
  
  // Get alternative endpoints for network troubleshooting
  getAlternativeEndpoints: () => {
    const alternatives = [];
    const HOST_IP = '192.168.20.112';
    const BACKEND_PORT = '3000';
    
    if (__DEV__) {
      // Primary: Direct IP connection (most reliable)
      alternatives.push(`http://${HOST_IP}:${BACKEND_PORT}`);
      
      // Secondary: Expo tunnel (if available)
      if (Constants.expoConfig?.hostUri) {
        const [host] = Constants.expoConfig.hostUri.split(':');
        alternatives.push(`http://${host}:${BACKEND_PORT}`);
      }
      
      // Fallbacks for specific platforms
      if (Platform.OS === 'android') {
        alternatives.push(`http://10.0.2.2:${BACKEND_PORT}`); // Android emulator
      }
      
      // Local development fallbacks
      alternatives.push(`http://localhost:${BACKEND_PORT}`);
      alternatives.push(`http://127.0.0.1:${BACKEND_PORT}`);
    }
    
    return alternatives;
  }
};

export default Environment;