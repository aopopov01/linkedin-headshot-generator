/**
 * E2E Test Setup
 * Global setup for Detox end-to-end tests
 */

const { device } = require('detox');

// Test utilities for E2E tests
global.e2eUtils = {
  // Wait for element with better error handling
  waitForElementById: async (testID, timeout = 10000) => {
    try {
      await waitFor(element(by.id(testID)))
        .toBeVisible()
        .withTimeout(timeout);
      return element(by.id(testID));
    } catch (error) {
      throw new Error(`Element with testID '${testID}' not found within ${timeout}ms`);
    }
  },

  // Wait for element by text
  waitForElementByText: async (text, timeout = 10000) => {
    try {
      await waitFor(element(by.text(text)))
        .toBeVisible()
        .withTimeout(timeout);
      return element(by.text(text));
    } catch (error) {
      throw new Error(`Element with text '${text}' not found within ${timeout}ms`);
    }
  },

  // Tap element with retry logic
  tapElementWithRetry: async (elementMatcher, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await element(elementMatcher).tap();
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await device.sleep(1000);
      }
    }
  },

  // Type text with clearing
  typeTextWithClear: async (elementMatcher, text) => {
    await element(elementMatcher).clearText();
    await element(elementMatcher).typeText(text);
  },

  // Scroll to element and tap
  scrollToElementAndTap: async (scrollViewMatcher, elementMatcher) => {
    await waitFor(element(elementMatcher))
      .toBeVisible()
      .whileElement(scrollViewMatcher)
      .scroll(200, 'down');
    await element(elementMatcher).tap();
  },

  // Wait for loading to complete
  waitForLoadingComplete: async (loadingTestId = 'loading-indicator', timeout = 30000) => {
    try {
      await waitFor(element(by.id(loadingTestId)))
        .not.toBeVisible()
        .withTimeout(timeout);
    } catch (error) {
      // Loading indicator might not exist, which is fine
      console.log('Loading indicator not found or already hidden');
    }
  },

  // Simulate photo picker selection
  simulatePhotoSelection: async () => {
    // This would be platform-specific implementation
    if (device.getPlatform() === 'ios') {
      await element(by.label('Photos')).tap();
      await element(by.id('photo-library-first-item')).tap();
    } else {
      await element(by.text('Gallery')).tap();
      await element(by.id('gallery-first-item')).tap();
    }
  },

  // Handle permission dialogs
  handlePermissionDialog: async (allow = true) => {
    try {
      if (device.getPlatform() === 'ios') {
        const allowButton = allow ? 'Allow' : 'Don\'t Allow';
        await element(by.text(allowButton)).tap();
      } else {
        const allowButton = allow ? 'ALLOW' : 'DENY';
        await element(by.text(allowButton)).tap();
      }
    } catch (error) {
      console.log('No permission dialog found or already handled');
    }
  },

  // Take screenshot for debugging
  takeScreenshot: async (name) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await device.takeScreenshot(`${name}-${timestamp}`);
  },

  // Mock server responses for testing
  mockNetworkResponses: {
    successfulLogin: {
      success: true,
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        subscription_plan: 'free'
      },
      token: 'mock-jwt-token'
    },
    
    availableStyles: [
      {
        id: 'professional',
        name: 'Professional',
        preview: 'https://example.com/professional.jpg',
        isPremium: false
      },
      {
        id: 'executive',
        name: 'Executive',
        preview: 'https://example.com/executive.jpg',
        isPremium: true
      }
    ],

    photoProcessingComplete: {
      success: true,
      status: 'completed',
      photo: {
        id: 1,
        processedImageUrl: 'https://example.com/processed.jpg',
        processingTime: 2500
      }
    }
  },

  // Login helper for tests
  loginUser: async (email = 'test@example.com', password = 'TestPassword123!') => {
    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('login-button')).tap();
    await e2eUtils.waitForLoadingComplete();
  },

  // Logout helper
  logoutUser: async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('logout-button')).tap();
    await element(by.text('Logout')).tap(); // Confirm dialog
  },

  // Complete onboarding flow
  completeOnboarding: async () => {
    // Skip intro screens
    await element(by.id('skip-intro-button')).tap();
    
    // Accept privacy policy
    await element(by.id('accept-privacy-button')).tap();
    
    // Skip optional permissions for now
    await element(by.id('skip-permissions-button')).tap();
    
    await e2eUtils.waitForElementById('main-screen');
  }
};

// Global test data
global.testData = {
  validUser: {
    email: 'e2etest@example.com',
    password: 'E2ETestPassword123!',
    name: 'E2E Test User'
  },
  
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  },

  newUser: {
    email: 'newuser@example.com',
    password: 'NewUserPassword123!',
    name: 'New Test User'
  }
};

// Setup before each test
beforeEach(async () => {
  await device.reloadReactNative();
  
  // Wait for app to load
  await waitFor(element(by.id('app-root')))
    .toBeVisible()
    .withTimeout(30000);
});

// Cleanup after each test
afterEach(async () => {
  // Take screenshot on failure
  if (jasmine.currentSpec.failedExpectations.length > 0) {
    const specName = jasmine.currentSpec.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    await e2eUtils.takeScreenshot(`failed_${specName}`);
  }
});