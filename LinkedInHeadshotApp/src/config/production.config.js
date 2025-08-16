/**
 * Production Configuration for Headshot Transformation Service
 * Centralized configuration management for dual-provider architecture
 * 
 * Features:
 * - Environment-specific configurations
 * - Provider settings and API keys
 * - Feature flags and toggles
 * - Performance and monitoring settings
 * - Security configurations
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment Detection
const ENV = process.env.NODE_ENV || 'development';
const IS_DEV = ENV === 'development';
const IS_PROD = ENV === 'production';
const IS_TEST = ENV === 'test';

// Base Configuration
const BASE_CONFIG = {
  APP_VERSION: '2.0.0',
  API_VERSION: 'v2',
  BUILD_NUMBER: '2024.01.15',
  
  // Environment Info
  ENVIRONMENT: ENV,
  IS_DEVELOPMENT: IS_DEV,
  IS_PRODUCTION: IS_PROD,
  IS_TESTING: IS_TEST,
  
  // Platform Info
  PLATFORM: Platform.OS,
  IS_IOS: Platform.OS === 'ios',
  IS_ANDROID: Platform.OS === 'android'
};

// API Configuration
const API_CONFIG = {
  development: {
    BASE_URL: 'https://dev-api.headshotapp.com',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  },
  
  production: {
    BASE_URL: 'https://api.headshotapp.com',
    TIMEOUT: 60000,
    RETRY_ATTEMPTS: 5,
    RETRY_DELAY: 2000
  },
  
  test: {
    BASE_URL: 'http://localhost:3000',
    TIMEOUT: 5000,
    RETRY_ATTEMPTS: 1,
    RETRY_DELAY: 100
  }
};

// Provider Configuration
const PROVIDER_CONFIG = {
  BETTERPIC: {
    enabled: true,
    baseURL: 'https://api.betterpic.ai/v1',
    apiKey: IS_PROD 
      ? process.env.EXPO_PUBLIC_BETTERPIC_API_KEY_PROD
      : process.env.EXPO_PUBLIC_BETTERPIC_API_KEY_DEV,
    timeout: IS_PROD ? 5400000 : 300000, // 90min prod, 5min dev
    maxRetries: IS_PROD ? 3 : 2,
    costPerImage: 1.16,
    currency: 'USD',
    features: {
      fourK: true,
      studioLighting: true,
      premiumRetouching: true,
      facePreservation: true,
      backgroundRemoval: true
    },
    limits: {
      maxConcurrentJobs: IS_PROD ? 10 : 3,
      maxQueueSize: IS_PROD ? 100 : 10,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
    }
  },
  
  REPLICATE: {
    enabled: true,
    baseURL: 'https://api.replicate.com/v1',
    apiKey: IS_PROD 
      ? process.env.EXPO_PUBLIC_REPLICATE_API_TOKEN_PROD
      : process.env.EXPO_PUBLIC_REPLICATE_API_TOKEN_DEV,
    timeout: IS_PROD ? 300000 : 120000, // 5min prod, 2min dev
    maxRetries: IS_PROD ? 2 : 1,
    costPerImage: 0.035, // Average cost
    currency: 'USD',
    models: {
      FLUX_SCHNELL: {
        version: "f2ab8a5569c55169b2c2a4b4db4e76b73f3bcdf0306ad5a9ae6bc7b29b4d85db",
        cost: 0.025,
        speed: 'fastest',
        quality: 'good'
      },
      FLUX_DEV: {
        version: "843b6e5cfa54cc9f88d3bb83743f82c8e5cf53b4dc60cc7d2e6db5e9f19a43fe",
        cost: 0.04,
        speed: 'fast', 
        quality: 'excellent'
      },
      INSTANT_ID: {
        version: "dd8025e33ddf4c3cdf6f18be24b3f846c8bbcc4a000c28b6b1ab3a3addbdae4f",
        cost: 0.03,
        speed: 'fast',
        quality: 'excellent',
        facePreservation: true
      }
    },
    features: {
      fastProcessing: true,
      multipleModels: true,
      facePreservation: true,
      styleTransfer: true
    },
    limits: {
      maxConcurrentJobs: IS_PROD ? 20 : 5,
      maxQueueSize: IS_PROD ? 200 : 20,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      supportedFormats: ['jpg', 'jpeg', 'png']
    }
  }
};

// Feature Flags
const FEATURE_FLAGS = {
  // Core Features
  DUAL_PROVIDER_SYSTEM: true,
  INTELLIGENT_ROUTING: true,
  BACKGROUND_PROCESSING: true,
  COST_TRACKING: true,
  ERROR_MONITORING: true,
  
  // Provider Features
  BETTERPIC_INTEGRATION: !IS_TEST,
  REPLICATE_INTEGRATION: true,
  PROVIDER_FALLBACK: true,
  PROVIDER_HEALTH_MONITORING: true,
  
  // UI Features
  ADVANCED_GALLERY: true,
  FULLSCREEN_PREVIEW: true,
  BATCH_OPERATIONS: IS_PROD,
  SOCIAL_SHARING: !IS_TEST,
  
  // Analytics & Monitoring
  DETAILED_ANALYTICS: true,
  PERFORMANCE_MONITORING: IS_PROD,
  ERROR_REPORTING: IS_PROD,
  USAGE_ANALYTICS: !IS_TEST,
  
  // Premium Features
  PREMIUM_STYLES: true,
  CUSTOM_BACKGROUNDS: IS_PROD,
  BATCH_PROCESSING: IS_PROD,
  PRIORITY_PROCESSING: IS_PROD,
  
  // Experimental Features (dev only)
  AI_STYLE_SUGGESTIONS: IS_DEV,
  REALTIME_PREVIEW: IS_DEV,
  COLLABORATIVE_EDITING: false,
  VIDEO_HEADSHOTS: false
};

// Performance Configuration
const PERFORMANCE_CONFIG = {
  // Image Processing
  IMAGE_QUALITY: IS_PROD ? 90 : 80,
  MAX_IMAGE_DIMENSION: IS_PROD ? 2048 : 1024,
  THUMBNAIL_SIZE: 300,
  PREVIEW_QUALITY: 60,
  
  // Caching
  CACHE_ENABLED: true,
  CACHE_SIZE_LIMIT: IS_PROD ? 100 * 1024 * 1024 : 50 * 1024 * 1024, // 100MB prod, 50MB dev
  CACHE_TTL: IS_PROD ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000, // 24h prod, 1h dev
  
  // Background Jobs
  MAX_CONCURRENT_JOBS: IS_PROD ? 5 : 2,
  JOB_TIMEOUT: IS_PROD ? 5400000 : 300000, // 90min prod, 5min dev
  POLLING_INTERVAL: IS_PROD ? 10000 : 5000, // 10s prod, 5s dev
  
  // Network
  REQUEST_TIMEOUT: IS_PROD ? 30000 : 15000,
  UPLOAD_CHUNK_SIZE: 1024 * 1024, // 1MB
  MAX_UPLOAD_RETRIES: IS_PROD ? 5 : 3
};

// Analytics Configuration
const ANALYTICS_CONFIG = {
  enabled: FEATURE_FLAGS.USAGE_ANALYTICS,
  
  // Providers
  providers: {
    internal: {
      enabled: true,
      endpoint: API_CONFIG[ENV].BASE_URL + '/analytics'
    },
    mixpanel: {
      enabled: IS_PROD,
      token: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN
    },
    amplitude: {
      enabled: IS_PROD,
      apiKey: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY
    }
  },
  
  // Event Configuration
  events: {
    sessionTracking: true,
    screenTracking: true,
    errorTracking: FEATURE_FLAGS.ERROR_REPORTING,
    performanceTracking: FEATURE_FLAGS.PERFORMANCE_MONITORING,
    customEvents: true
  },
  
  // Privacy
  anonymizeUserData: IS_PROD,
  respectDoNotTrack: true,
  dataRetentionDays: IS_PROD ? 365 : 30
};

// Monitoring Configuration
const MONITORING_CONFIG = {
  enabled: IS_PROD || IS_DEV,
  
  // Error Monitoring
  errorReporting: {
    enabled: FEATURE_FLAGS.ERROR_REPORTING,
    sampleRate: IS_PROD ? 1.0 : 0.1,
    maxBreadcrumbs: 50,
    attachStackTrace: true
  },
  
  // Performance Monitoring
  performance: {
    enabled: FEATURE_FLAGS.PERFORMANCE_MONITORING,
    sampleRate: IS_PROD ? 0.1 : 1.0,
    tracesSampleRate: IS_PROD ? 0.1 : 1.0
  },
  
  // Health Checks
  healthCheck: {
    enabled: true,
    interval: IS_PROD ? 60000 : 30000, // 1min prod, 30s dev
    endpoints: [
      '/health',
      '/providers/health',
      '/jobs/health'
    ]
  },
  
  // Alerting
  alerts: {
    enabled: IS_PROD,
    errorThreshold: 0.05, // 5% error rate
    responseTimeThreshold: 5000, // 5s
    availabilityThreshold: 0.99 // 99% uptime
  }
};

// Security Configuration
const SECURITY_CONFIG = {
  // API Security
  api: {
    validateSSL: IS_PROD,
    timeout: PERFORMANCE_CONFIG.REQUEST_TIMEOUT,
    maxRedirects: IS_PROD ? 5 : 10,
    headers: {
      'User-Agent': `HeadshotApp/${BASE_CONFIG.APP_VERSION} (${Platform.OS})`
    }
  },
  
  // Data Protection
  encryption: {
    enabled: IS_PROD,
    algorithm: 'AES-256-GCM',
    keyRotationDays: 90
  },
  
  // Storage Security
  storage: {
    secure: IS_PROD,
    encryptSensitiveData: IS_PROD,
    autoCleanup: true,
    retentionDays: IS_PROD ? 30 : 7
  },
  
  // Privacy
  privacy: {
    anonymizeUserData: IS_PROD,
    minimizeDataCollection: IS_PROD,
    respectDoNotTrack: true,
    gdprCompliant: IS_PROD
  }
};

// Budget and Billing Configuration
const BUDGET_CONFIG = {
  // Default Budgets
  defaultBudgets: {
    daily: IS_DEV ? 10 : 50,
    weekly: IS_DEV ? 50 : 300,
    monthly: IS_DEV ? 200 : 1000
  },
  
  // Alert Thresholds
  alertThresholds: {
    warning: 0.8,   // 80%
    critical: 0.95  // 95%
  },
  
  // Cost Tracking
  trackingEnabled: FEATURE_FLAGS.COST_TRACKING,
  granularity: 'per_transformation',
  reporting: {
    daily: true,
    weekly: true,
    monthly: true
  }
};

// Consolidated Configuration
const PRODUCTION_CONFIG = {
  ...BASE_CONFIG,
  api: API_CONFIG[ENV],
  providers: PROVIDER_CONFIG,
  features: FEATURE_FLAGS,
  performance: PERFORMANCE_CONFIG,
  analytics: ANALYTICS_CONFIG,
  monitoring: MONITORING_CONFIG,
  security: SECURITY_CONFIG,
  budget: BUDGET_CONFIG
};

// Configuration Validation
function validateConfiguration() {
  const errors = [];
  
  // Validate API keys
  if (IS_PROD && !PROVIDER_CONFIG.BETTERPIC.apiKey) {
    errors.push('BetterPic API key is required in production');
  }
  
  if (!PROVIDER_CONFIG.REPLICATE.apiKey) {
    errors.push('Replicate API key is required');
  }
  
  // Validate endpoints
  if (!API_CONFIG[ENV]?.BASE_URL) {
    errors.push(`API base URL is required for environment: ${ENV}`);
  }
  
  // Validate budget limits
  const budgets = BUDGET_CONFIG.defaultBudgets;
  if (budgets.daily > budgets.weekly || budgets.weekly > budgets.monthly) {
    errors.push('Budget hierarchy is invalid (daily <= weekly <= monthly)');
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation errors:', errors);
    if (IS_PROD) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }
  
  return errors.length === 0;
}

// Configuration Management
class ConfigManager {
  constructor() {
    this.config = PRODUCTION_CONFIG;
    this.overrides = new Map();
  }
  
  get(key, defaultValue = null) {
    if (this.overrides.has(key)) {
      return this.overrides.get(key);
    }
    
    return key.split('.').reduce((config, prop) => {
      return config?.[prop];
    }, this.config) || defaultValue;
  }
  
  set(key, value) {
    this.overrides.set(key, value);
  }
  
  async loadRemoteConfig() {
    try {
      // Load remote configuration overrides
      const response = await fetch(`${this.get('api.BASE_URL')}/config`);
      if (response.ok) {
        const remoteConfig = await response.json();
        
        // Apply safe overrides (only non-sensitive config)
        Object.entries(remoteConfig).forEach(([key, value]) => {
          if (this.isSafeToOverride(key)) {
            this.set(key, value);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load remote config:', error);
    }
  }
  
  isSafeToOverride(key) {
    const safeKeys = [
      'features',
      'performance.IMAGE_QUALITY',
      'performance.POLLING_INTERVAL',
      'budget.defaultBudgets',
      'analytics.events'
    ];
    
    return safeKeys.some(safeKey => key.startsWith(safeKey));
  }
  
  async persistConfig() {
    try {
      const configToSave = Object.fromEntries(this.overrides);
      await AsyncStorage.setItem('app_config_overrides', JSON.stringify(configToSave));
    } catch (error) {
      console.error('Failed to persist config:', error);
    }
  }
  
  async loadPersistedConfig() {
    try {
      const saved = await AsyncStorage.getItem('app_config_overrides');
      if (saved) {
        const overrides = JSON.parse(saved);
        Object.entries(overrides).forEach(([key, value]) => {
          this.set(key, value);
        });
      }
    } catch (error) {
      console.error('Failed to load persisted config:', error);
    }
  }
  
  getProviderConfig(providerName) {
    return this.get(`providers.${providerName}`);
  }
  
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false);
  }
  
  getApiConfig() {
    return this.get('api');
  }
  
  getPerformanceConfig() {
    return this.get('performance');
  }
  
  getBudgetConfig() {
    return this.get('budget');
  }
}

// Singleton instance
const configManager = new ConfigManager();

// Initialize configuration
async function initializeConfiguration() {
  try {
    validateConfiguration();
    await configManager.loadPersistedConfig();
    
    if (IS_PROD || IS_DEV) {
      await configManager.loadRemoteConfig();
    }
    
    console.log(`Configuration initialized for ${ENV} environment`);
    
    return true;
  } catch (error) {
    console.error('Failed to initialize configuration:', error);
    return false;
  }
}

// Exports
export {
  PRODUCTION_CONFIG,
  BASE_CONFIG,
  API_CONFIG,
  PROVIDER_CONFIG,
  FEATURE_FLAGS,
  PERFORMANCE_CONFIG,
  ANALYTICS_CONFIG,
  MONITORING_CONFIG,
  SECURITY_CONFIG,
  BUDGET_CONFIG,
  configManager,
  initializeConfiguration,
  validateConfiguration
};

export default PRODUCTION_CONFIG;