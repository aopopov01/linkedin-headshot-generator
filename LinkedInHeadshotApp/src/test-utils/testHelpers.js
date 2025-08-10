/**
 * Test Helper Utilities
 * Common test utilities and helpers for React Native testing
 */

import { act, waitFor } from '@testing-library/react-native';

/**
 * Wait for all promises to resolve and state updates to complete
 */
export const flushPromises = () => {
  return act(() => new Promise(resolve => setImmediate(resolve)));
};

/**
 * Create mock navigation prop
 */
export const createMockNavigation = (overrides = {}) => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
  getState: jest.fn(() => ({ routes: [], index: 0 })),
  getParent: jest.fn(),
  ...overrides,
});

/**
 * Create mock route prop
 */
export const createMockRoute = (overrides = {}) => ({
  key: 'test-key',
  name: 'TestScreen',
  params: {},
  ...overrides,
});

/**
 * Mock fetch response helper
 */
export const mockFetchResponse = (data, options = {}) => {
  const { status = 200, ok = true, headers = {} } = options;
  
  return {
    ok,
    status,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
  };
};

/**
 * Mock network error
 */
export const mockNetworkError = (message = 'Network request failed') => {
  return Promise.reject(new Error(message));
};

/**
 * Wait for async operations with timeout
 */
export const waitForAsync = async (callback, timeout = 5000) => {
  await waitFor(callback, { timeout });
};

/**
 * Create mock image picker response
 */
export const createMockImagePickerResponse = (overrides = {}) => ({
  assets: [{
    uri: 'mock://test-image.jpg',
    width: 1024,
    height: 768,
    fileSize: 123456,
    type: 'image/jpeg',
    fileName: 'test-image.jpg',
    ...overrides,
  }],
});

/**
 * Create mock processed photo response
 */
export const createMockProcessedPhotoResponse = (overrides = {}) => ({
  id: 'processed-photo-id',
  processedImageUrl: 'mock://processed-image.jpg',
  processingTime: 2500,
  style: 'professional',
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock payment response
 */
export const createMockPaymentResponse = (overrides = {}) => ({
  success: true,
  paymentIntentId: 'pi_test_12345',
  clientSecret: 'pi_test_12345_secret',
  ...overrides,
});

/**
 * Create mock subscription response
 */
export const createMockSubscriptionResponse = (overrides = {}) => ({
  active: false,
  plan: 'free',
  expiresAt: null,
  features: {
    monthlyGenerations: 3,
    unlimitedGenerations: false,
    premiumStyles: false,
    highResolution: false,
  },
  ...overrides,
});

/**
 * Mock AsyncStorage operations
 */
export const mockAsyncStorageOperations = {
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
};

/**
 * Mock permissions
 */
export const mockPermissions = {
  granted: 'granted',
  denied: 'denied',
  never_ask_again: 'never_ask_again',
  
  mockCameraPermission: (result = 'granted') => {
    jest.clearAllMocks();
    require('react-native').PermissionsAndroid.request.mockResolvedValue(result);
    return result;
  },
  
  mockStoragePermission: (result = 'granted') => {
    jest.clearAllMocks();
    require('react-native').PermissionsAndroid.request.mockResolvedValue(result);
    return result;
  },
};

/**
 * Create mock analytics events
 */
export const createMockAnalyticsEvent = (eventName, properties = {}) => ({
  eventName,
  properties: {
    timestamp: new Date().toISOString(),
    platform: 'ios',
    version: '1.0.0',
    ...properties,
  },
});

/**
 * Mock error scenarios
 */
export const mockErrorScenarios = {
  networkError: () => new Error('Network request failed'),
  serverError: () => new Error('Internal server error'),
  validationError: () => new Error('Validation failed'),
  authError: () => new Error('Authentication required'),
  paymentError: () => new Error('Payment processing failed'),
  permissionError: () => new Error('Permission denied'),
};

/**
 * Assert accessibility requirements
 */
export const assertAccessibility = {
  hasLabel: (element) => {
    expect(element).toHaveProp('accessibilityLabel');
    expect(element.props.accessibilityLabel).toBeTruthy();
  },
  
  hasRole: (element, role) => {
    expect(element).toHaveProp('accessibilityRole', role);
  },
  
  hasHint: (element) => {
    expect(element).toHaveProp('accessibilityHint');
    expect(element.props.accessibilityHint).toBeTruthy();
  },
  
  hasTouchTarget: (element, minSize = 44) => {
    expect(element).toHaveValidTouchTarget(minSize);
  },
  
  isAccessible: (element) => {
    expect(element).toBeAccessible();
  },
};

/**
 * Performance testing helpers
 */
export const performanceHelpers = {
  measureRenderTime: (renderFunction) => {
    const startTime = Date.now();
    const result = renderFunction();
    const endTime = Date.now();
    
    return {
      result,
      renderTime: endTime - startTime,
    };
  },
  
  measureAsyncOperation: async (operation) => {
    const startTime = Date.now();
    const result = await operation();
    const endTime = Date.now();
    
    return {
      result,
      duration: endTime - startTime,
    };
  },
};

/**
 * Debug helpers for tests
 */
export const debugHelpers = {
  logComponent: (component) => {
    console.log('Component structure:', component.debug());
  },
  
  logProps: (element) => {
    console.log('Element props:', element.props);
  },
  
  findAllByType: (component, type) => {
    return component.findAllByType(type);
  },
  
  getComponentTree: (component) => {
    return component.toJSON();
  },
};

export default {
  flushPromises,
  createMockNavigation,
  createMockRoute,
  mockFetchResponse,
  mockNetworkError,
  waitForAsync,
  createMockImagePickerResponse,
  createMockProcessedPhotoResponse,
  createMockPaymentResponse,
  createMockSubscriptionResponse,
  mockAsyncStorageOperations,
  mockPermissions,
  createMockAnalyticsEvent,
  mockErrorScenarios,
  assertAccessibility,
  performanceHelpers,
  debugHelpers,
};