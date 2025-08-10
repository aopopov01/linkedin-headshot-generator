/**
 * Test Setup Configuration
 * Global test utilities, mocks, and setup for React Native testing
 */

import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock';

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock device info
jest.mock('react-native-device-info', () => mockRNDeviceInfo);

// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    Platform: {
      ...RN.Platform,
      OS: 'ios',
      select: jest.fn((platforms) => platforms.ios || platforms.default),
    },
    Dimensions: {
      ...RN.Dimensions,
      get: jest.fn(() => ({ width: 375, height: 667, scale: 2, fontScale: 1 })),
    },
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(() => Promise.resolve()),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
      getInitialURL: jest.fn(() => Promise.resolve(null)),
    },
    PermissionsAndroid: {
      request: jest.fn(() => Promise.resolve('granted')),
      check: jest.fn(() => Promise.resolve(true)),
      PERMISSIONS: {
        CAMERA: 'android.permission.CAMERA',
        WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
        READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
      },
      RESULTS: {
        GRANTED: 'granted',
        DENIED: 'denied',
        NEVER_ASK_AGAIN: 'never_ask_again',
      },
    },
    AccessibilityInfo: {
      isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
      announceForAccessibility: jest.fn(),
    },
  };
});

// Mock Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      reset: jest.fn(),
      canGoBack: jest.fn(() => true),
      isFocused: jest.fn(() => true),
    }),
    useRoute: () => ({
      params: {},
      key: 'test-key',
      name: 'test-route',
    }),
    useFocusEffect: jest.fn(),
    useIsFocused: () => true,
  };
});

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/document/path',
  CachesDirectoryPath: '/mock/cache/path',
  writeFile: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve('')),
  unlink: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve()),
  copyFile: jest.fn(() => Promise.resolve()),
  moveFile: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn((options, callback) => {
    callback({
      assets: [{
        uri: 'mock://image.jpg',
        width: 1024,
        height: 768,
        fileSize: 123456,
        type: 'image/jpeg',
        fileName: 'mock-image.jpg',
      }],
    });
  }),
  launchCamera: jest.fn((options, callback) => {
    callback({
      assets: [{
        uri: 'mock://camera-image.jpg',
        width: 1024,
        height: 768,
        fileSize: 123456,
        type: 'image/jpeg',
        fileName: 'camera-image.jpg',
      }],
    });
  }),
  MediaType: {
    photo: 'photo',
    video: 'video',
    mixed: 'mixed',
  },
}));

// Mock react-native-image-resizer
jest.mock('@bam.tech/react-native-image-resizer', () => ({
  createResizedImage: jest.fn(() =>
    Promise.resolve({
      uri: 'mock://resized-image.jpg',
      width: 512,
      height: 384,
      size: 61728,
    })
  ),
}));

// Mock react-native-purchases
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  identify: jest.fn(),
  getOfferings: jest.fn(() => Promise.resolve({ current: { monthly: {} } })),
  purchaseProduct: jest.fn(() => Promise.resolve({ purchaserInfo: {} })),
  getCustomerInfo: jest.fn(() => Promise.resolve({ activeSubscriptions: [] })),
  restorePurchases: jest.fn(() => Promise.resolve({ purchaserInfo: {} })),
  setDebugLogsEnabled: jest.fn(),
  logIn: jest.fn(() => Promise.resolve({ purchaserInfo: {} })),
  logOut: jest.fn(() => Promise.resolve({ purchaserInfo: {} })),
}));

// Mock API services
jest.mock('../services/aiService', () => ({
  processPhoto: jest.fn(() => Promise.resolve({
    processedImageUrl: 'mock://processed-image.jpg',
    processingTime: 2500,
    style: 'professional',
  })),
  getAvailableStyles: jest.fn(() => Promise.resolve([
    { id: 'professional', name: 'Professional', preview: 'mock://preview.jpg' },
    { id: 'casual', name: 'Casual', preview: 'mock://casual.jpg' },
  ])),
}));

jest.mock('../services/paymentService', () => ({
  createPaymentIntent: jest.fn(() => Promise.resolve({
    clientSecret: 'mock-client-secret',
    paymentIntentId: 'mock-payment-id',
  })),
  confirmPayment: jest.fn(() => Promise.resolve({ success: true })),
  getSubscriptionStatus: jest.fn(() => Promise.resolve({ active: false })),
}));

jest.mock('../services/analyticsService', () => ({
  trackEvent: jest.fn(),
  trackScreenView: jest.fn(),
  trackError: jest.fn(),
  identifyUser: jest.fn(),
  setUserProperties: jest.fn(),
}));

// Global test utilities
global.mockFetch = jest.fn();
global.fetch = global.mockFetch;

// Console warnings/errors filtering
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is deprecated')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
     args[0].includes('Warning: `useNativeDriver` was not specified'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Increase timeout for integration tests
jest.setTimeout(10000);

// Custom matchers for React Native testing
expect.extend({
  toBeAccessible(received) {
    const pass = received.props.accessible !== false && 
                 (received.props.accessibilityLabel || received.props.accessibilityLabelledBy);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be accessible`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be accessible (have accessibilityLabel)`,
        pass: false,
      };
    }
  },
  
  toHaveValidTouchTarget(received, minSize = 44) {
    const { width, height } = received.props.style || {};
    const pass = width >= minSize && height >= minSize;
    
    if (pass) {
      return {
        message: () => `expected touch target to be smaller than ${minSize}x${minSize}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected touch target to be at least ${minSize}x${minSize}, got ${width}x${height}`,
        pass: false,
      };
    }
  },
});

// Global test data
global.testData = {
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    subscription: 'free',
  },
  
  mockPhoto: {
    uri: 'mock://test-photo.jpg',
    width: 1024,
    height: 768,
    fileSize: 123456,
    type: 'image/jpeg',
  },
  
  mockProcessedPhoto: {
    id: 'processed-photo-id',
    originalUri: 'mock://original.jpg',
    processedUri: 'mock://processed.jpg',
    style: 'professional',
    createdAt: '2025-01-01T00:00:00Z',
  },
  
  mockStyles: [
    { id: 'professional', name: 'Professional', preview: 'mock://prof.jpg' },
    { id: 'casual', name: 'Casual', preview: 'mock://casual.jpg' },
    { id: 'executive', name: 'Executive', preview: 'mock://exec.jpg' },
  ],
};