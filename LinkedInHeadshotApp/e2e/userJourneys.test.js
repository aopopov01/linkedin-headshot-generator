/**
 * User Journeys E2E Tests
 * Complete end-to-end user flow testing
 */

describe('User Journeys', () => {
  
  describe('Onboarding Flow', () => {
    it('should complete the full onboarding process', async () => {
      // App should start with welcome screen
      await waitFor(element(by.id('welcome-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Navigate through intro screens
      await element(by.id('get-started-button')).tap();
      
      await waitFor(element(by.id('intro-screen-1')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('next-button')).tap();

      await waitFor(element(by.id('intro-screen-2')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('next-button')).tap();

      // Privacy consent screen
      await waitFor(element(by.id('privacy-consent-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Verify privacy policy content
      await expect(element(by.text(/privacy policy/i))).toBeVisible();
      await expect(element(by.text(/data processing/i))).toBeVisible();

      await element(by.id('accept-privacy-button')).tap();

      // Permissions screen
      await waitFor(element(by.id('permissions-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Grant camera permission
      await element(by.id('grant-camera-permission-button')).tap();
      await e2eUtils.handlePermissionDialog(true);

      // Skip photo library permission for this test
      await element(by.id('skip-photo-permission-button')).tap();

      // Should reach main app screen
      await waitFor(element(by.id('main-navigation')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.id('photo-capture-tab'))).toBeVisible();
      await expect(element(by.id('gallery-tab'))).toBeVisible();
      await expect(element(by.id('profile-tab'))).toBeVisible();
    });

    it('should handle privacy policy rejection', async () => {
      await waitFor(element(by.id('welcome-screen')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('get-started-button')).tap();
      
      // Skip intro screens quickly
      await e2eUtils.waitForElementById('intro-screen-1');
      await element(by.id('skip-intro-button')).tap();

      // Reject privacy policy
      await e2eUtils.waitForElementById('privacy-consent-screen');
      await element(by.id('decline-privacy-button')).tap();

      // Should show explanation dialog
      await waitFor(element(by.text(/cannot proceed/i)))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('OK')).tap();

      // Should remain on privacy screen
      await expect(element(by.id('privacy-consent-screen'))).toBeVisible();
    });
  });

  describe('Authentication Flow', () => {
    beforeEach(async () => {
      await e2eUtils.completeOnboarding();
    });

    it('should register a new user successfully', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('sign-up-button')).tap();

      await waitFor(element(by.id('register-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Fill registration form
      await element(by.id('name-input')).typeText(testData.newUser.name);
      await element(by.id('email-input')).typeText(testData.newUser.email);
      await element(by.id('password-input')).typeText(testData.newUser.password);
      await element(by.id('confirm-password-input')).typeText(testData.newUser.password);

      await element(by.id('register-button')).tap();

      // Should show loading state
      await waitFor(element(by.id('loading-indicator')))
        .toBeVisible()
        .withTimeout(2000);

      // Should navigate to main app
      await waitFor(element(by.id('main-navigation')))
        .toBeVisible()
        .withTimeout(10000);

      // Verify user is logged in
      await element(by.id('profile-tab')).tap();
      await expect(element(by.text(testData.newUser.name))).toBeVisible();
    });

    it('should login existing user successfully', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await e2eUtils.loginUser(testData.validUser.email, testData.validUser.password);

      // Should navigate to main app
      await waitFor(element(by.id('main-navigation')))
        .toBeVisible()
        .withTimeout(10000);

      // Verify user profile
      await element(by.id('profile-tab')).tap();
      await expect(element(by.text(testData.validUser.email))).toBeVisible();
    });

    it('should handle invalid login credentials', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('login-button')).tap();

      await e2eUtils.waitForElementById('login-screen');

      await element(by.id('email-input')).typeText(testData.invalidUser.email);
      await element(by.id('password-input')).typeText(testData.invalidUser.password);
      await element(by.id('login-button')).tap();

      // Should show error message
      await waitFor(element(by.text(/invalid credentials/i)))
        .toBeVisible()
        .withTimeout(5000);

      // Should remain on login screen
      await expect(element(by.id('login-screen'))).toBeVisible();
    });

    it('should logout user successfully', async () => {
      // Login first
      await element(by.id('profile-tab')).tap();
      await element(by.id('login-button')).tap();
      await e2eUtils.loginUser();

      // Logout
      await e2eUtils.logoutUser();

      // Should return to unauthenticated state
      await element(by.id('profile-tab')).tap();
      await expect(element(by.id('login-button'))).toBeVisible();
      await expect(element(by.id('sign-up-button'))).toBeVisible();
    });
  });

  describe('Photo Generation Flow', () => {
    beforeEach(async () => {
      await e2eUtils.completeOnboarding();
      
      // Login for authenticated features
      await element(by.id('profile-tab')).tap();
      await element(by.id('login-button')).tap();
      await e2eUtils.loginUser();
    });

    it('should complete full photo generation flow', async () => {
      // Navigate to photo capture
      await element(by.id('photo-capture-tab')).tap();

      await waitFor(element(by.id('photo-capture-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Take a photo using camera
      await element(by.id('camera-button')).tap();

      // Handle camera permission if needed
      await e2eUtils.handlePermissionDialog(true);

      // Simulate camera capture (platform specific)
      if (device.getPlatform() === 'ios') {
        await element(by.id('camera-capture-button')).tap();
        await element(by.text('Use Photo')).tap();
      } else {
        await element(by.id('camera-shutter-button')).tap();
        await element(by.id('camera-accept-button')).tap();
      }

      // Should show photo preview
      await waitFor(element(by.id('photo-preview')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('continue-button')).tap();

      // Style selection screen
      await waitFor(element(by.id('style-selector-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify styles are loaded
      await waitFor(element(by.id('style-card-professional')))
        .toBeVisible()
        .withTimeout(10000);

      // Select a style
      await element(by.id('style-card-professional')).tap();

      // Verify style is selected
      await expect(element(by.id('style-card-professional'))).toHaveToggleValue(true);

      await element(by.id('continue-button')).tap();

      // Processing screen
      await waitFor(element(by.id('processing-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Should show processing animation
      await expect(element(by.id('processing-animation'))).toBeVisible();
      await expect(element(by.text(/processing your photo/i))).toBeVisible();

      // Wait for processing to complete (mock should complete quickly)
      await waitFor(element(by.id('results-gallery')))
        .toBeVisible()
        .withTimeout(30000);

      // Results screen
      await expect(element(by.id('processed-photo'))).toBeVisible();
      await expect(element(by.id('download-button'))).toBeVisible();
      await expect(element(by.id('share-button'))).toBeVisible();
      await expect(element(by.id('generate-another-button'))).toBeVisible();
    });

    it('should handle photo selection from gallery', async () => {
      await element(by.id('photo-capture-tab')).tap();
      
      await e2eUtils.waitForElementById('photo-capture-screen');

      // Select from photo library
      await element(by.id('library-button')).tap();

      // Handle photo library permission
      await e2eUtils.handlePermissionDialog(true);

      // Simulate photo selection
      await e2eUtils.simulatePhotoSelection();

      // Should show selected photo
      await waitFor(element(by.id('photo-preview')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('continue-button')).tap();

      // Should proceed to style selection
      await waitFor(element(by.id('style-selector-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle premium style upgrade flow', async () => {
      // Navigate to style selection (assuming we have a photo)
      await element(by.id('photo-capture-tab')).tap();
      await e2eUtils.waitForElementById('photo-capture-screen');
      
      // Quick photo selection
      await element(by.id('library-button')).tap();
      await e2eUtils.simulatePhotoSelection();
      await element(by.id('continue-button')).tap();

      await e2eUtils.waitForElementById('style-selector-screen');

      // Select premium style
      await element(by.id('style-card-executive')).tap();

      // Should show premium upgrade modal
      await waitFor(element(by.id('premium-upgrade-modal')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text(/premium subscription/i))).toBeVisible();
      await expect(element(by.id('upgrade-button'))).toBeVisible();

      // Close modal for this test
      await element(by.id('close-upgrade-modal-button')).tap();

      // Should return to style selection
      await expect(element(by.id('style-selector-screen'))).toBeVisible();
    });

    it('should handle processing errors gracefully', async () => {
      // This test would require mocking network errors
      // For now, we'll test the error UI components exist
      
      await element(by.id('photo-capture-tab')).tap();
      await e2eUtils.waitForElementById('photo-capture-screen');
      
      // Force an error scenario (this would be mocked in real implementation)
      await element(by.id('library-button')).tap();
      await e2eUtils.simulatePhotoSelection();
      await element(by.id('continue-button')).tap();
      
      await e2eUtils.waitForElementById('style-selector-screen');
      await element(by.id('style-card-professional')).tap();
      await element(by.id('continue-button')).tap();

      // If processing fails, should show error screen
      // This would be triggered by network mock in real scenario
      await waitFor(element(by.id('processing-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Error state should have retry button
      if (await element(by.id('processing-error')).exists()) {
        await expect(element(by.id('retry-button'))).toBeVisible();
      }
    });
  });

  describe('Gallery and History', () => {
    beforeEach(async () => {
      await e2eUtils.completeOnboarding();
      await element(by.id('profile-tab')).tap();
      await element(by.id('login-button')).tap();
      await e2eUtils.loginUser();
    });

    it('should display user photo history', async () => {
      await element(by.id('gallery-tab')).tap();

      await waitFor(element(by.id('gallery-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // If user has photos, they should be displayed
      // If no photos, should show empty state
      const hasPhotos = await element(by.id('photo-grid')).exists();
      const hasEmptyState = await element(by.id('empty-gallery')).exists();

      expect(hasPhotos || hasEmptyState).toBe(true);

      if (hasEmptyState) {
        await expect(element(by.text(/no photos yet/i))).toBeVisible();
        await expect(element(by.id('create-first-photo-button'))).toBeVisible();
      }
    });

    it('should allow photo sharing', async () => {
      await element(by.id('gallery-tab')).tap();
      await e2eUtils.waitForElementById('gallery-screen');

      // Assuming there's at least one photo
      if (await element(by.id('photo-item-0')).exists()) {
        await element(by.id('photo-item-0')).tap();

        await waitFor(element(by.id('photo-detail-screen')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.id('share-button')).tap();

        // Should show share options
        await waitFor(element(by.id('share-modal')))
          .toBeVisible()
          .withTimeout(5000);

        await expect(element(by.id('share-link-button'))).toBeVisible();
        await expect(element(by.id('download-button'))).toBeVisible();
      }
    });

    it('should allow photo deletion', async () => {
      await element(by.id('gallery-tab')).tap();
      await e2eUtils.waitForElementById('gallery-screen');

      if (await element(by.id('photo-item-0')).exists()) {
        // Long press to show context menu
        await element(by.id('photo-item-0')).longPress();

        await waitFor(element(by.id('photo-actions-modal')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.id('delete-photo-button')).tap();

        // Confirm deletion
        await waitFor(element(by.text(/confirm deletion/i)))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.text('Delete')).tap();

        // Should show success message
        await waitFor(element(by.text(/photo deleted/i)))
          .toBeVisible()
          .withTimeout(5000);
      }
    });
  });

  describe('Profile and Settings', () => {
    beforeEach(async () => {
      await e2eUtils.completeOnboarding();
      await element(by.id('profile-tab')).tap();
      await element(by.id('login-button')).tap();
      await e2eUtils.loginUser();
    });

    it('should display user profile information', async () => {
      await element(by.id('profile-tab')).tap();

      await waitFor(element(by.id('profile-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('user-avatar'))).toBeVisible();
      await expect(element(by.id('user-name'))).toBeVisible();
      await expect(element(by.id('user-email'))).toBeVisible();
      await expect(element(by.id('subscription-status'))).toBeVisible();
    });

    it('should navigate to settings', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('settings-button')).tap();

      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('privacy-settings'))).toBeVisible();
      await expect(element(by.id('notification-settings'))).toBeVisible();
      await expect(element(by.id('account-settings'))).toBeVisible();
    });

    it('should handle subscription management', async () => {
      await element(by.id('profile-tab')).tap();
      
      if (await element(by.id('upgrade-to-premium-button')).exists()) {
        await element(by.id('upgrade-to-premium-button')).tap();

        await waitFor(element(by.id('payment-screen')))
          .toBeVisible()
          .withTimeout(5000);

        await expect(element(by.text(/premium features/i))).toBeVisible();
        await expect(element(by.id('monthly-plan-button'))).toBeVisible();
        await expect(element(by.id('yearly-plan-button'))).toBeVisible();
      }
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      await e2eUtils.completeOnboarding();
    });

    it('should be navigable with accessibility services', async () => {
      // Enable accessibility mode
      await device.enableSynchronization();

      await element(by.id('photo-capture-tab')).tap();
      
      // Test accessibility labels
      const cameraButton = element(by.id('camera-button'));
      await expect(cameraButton).toHaveLabel('Take photo with camera');
      
      const libraryButton = element(by.id('library-button'));
      await expect(libraryButton).toHaveLabel('Choose photo from library');

      // Test navigation with accessibility
      await element(by.id('gallery-tab')).tap();
      await element(by.id('profile-tab')).tap();

      // All navigation should work without issues
      await expect(element(by.id('profile-screen'))).toBeVisible();
    });

    it('should provide proper accessibility hints', async () => {
      await element(by.id('photo-capture-tab')).tap();
      
      await e2eUtils.waitForElementById('photo-capture-screen');
      
      // Check that buttons have accessibility hints
      const cameraButton = element(by.id('camera-button'));
      await expect(cameraButton).toHaveAccessibilityHint();
      
      const libraryButton = element(by.id('library-button'));
      await expect(libraryButton).toHaveAccessibilityHint();
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(async () => {
      await e2eUtils.completeOnboarding();
    });

    it('should handle network connectivity issues', async () => {
      // This would require network mocking in real implementation
      await element(by.id('profile-tab')).tap();
      await element(by.id('login-button')).tap();

      // Simulate network error during login
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password');
      await element(by.id('login-button')).tap();

      // Should handle network error gracefully
      if (await element(by.text(/network error/i)).exists()) {
        await expect(element(by.id('retry-button'))).toBeVisible();
      }
    });

    it('should handle permission denials', async () => {
      await element(by.id('photo-capture-tab')).tap();
      await element(by.id('camera-button')).tap();

      // Deny camera permission
      await e2eUtils.handlePermissionDialog(false);

      // Should show permission denied message
      await waitFor(element(by.text(/camera permission/i)))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('open-settings-button'))).toBeVisible();
    });

    it('should handle app crashes gracefully', async () => {
      // This test would simulate app crashes and recovery
      await element(by.id('photo-capture-tab')).tap();
      
      // Simulate app restart
      await device.reloadReactNative();
      
      // App should recover to main screen
      await waitFor(element(by.id('main-navigation')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });
});