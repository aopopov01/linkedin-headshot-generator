/**
 * PhotoCapture Component Tests
 * Comprehensive testing for photo capture functionality
 */

import React from 'react';
import { Alert, Platform } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import renderWithProviders from '../../../test-utils/renderWithProviders';
import {
  createMockNavigation,
  createMockRoute,
  createMockImagePickerResponse,
  mockPermissions,
  assertAccessibility,
  flushPromises,
} from '../../../test-utils/testHelpers';
import PhotoCapture from '../PhotoCapture';

// Mock external dependencies
jest.mock('react-native-image-picker');
jest.mock('../../../services/analyticsService');

describe('PhotoCapture Component', () => {
  let mockNavigation;
  let mockRoute;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation = createMockNavigation();
    mockRoute = createMockRoute({
      params: { onPhotoCapture: jest.fn() },
    });
    
    // Reset permission mocks
    mockPermissions.mockCameraPermission('granted');
  });

  describe('Rendering', () => {
    it('renders correctly with all required elements', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Take Photo')).toBeTruthy();
      expect(getByText('Choose from Library')).toBeTruthy();
      expect(getByTestId('camera-button')).toBeTruthy();
      expect(getByTestId('library-button')).toBeTruthy();
    });

    it('displays instructions text', () => {
      const { getByText } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText(/Position your face/i)).toBeTruthy();
      expect(getByText(/Good lighting/i)).toBeTruthy();
    });

    it('shows preview area when no image is selected', () => {
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('preview-placeholder')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels for buttons', () => {
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      const libraryButton = getByTestId('library-button');

      assertAccessibility.hasLabel(cameraButton);
      assertAccessibility.hasRole(cameraButton, 'button');
      assertAccessibility.hasLabel(libraryButton);
      assertAccessibility.hasRole(libraryButton, 'button');
    });

    it('has proper accessibility hints', () => {
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      assertAccessibility.hasHint(cameraButton);
    });

    it('meets touch target size requirements', () => {
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      const libraryButton = getByTestId('library-button');

      assertAccessibility.hasTouchTarget(cameraButton);
      assertAccessibility.hasTouchTarget(libraryButton);
    });
  });

  describe('Camera Functionality', () => {
    it('launches camera when camera button is pressed', async () => {
      const mockImageResponse = createMockImagePickerResponse();
      launchCamera.mockImplementation((options, callback) => {
        callback(mockImageResponse);
      });

      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(launchCamera).toHaveBeenCalledWith(
          expect.objectContaining({
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
          }),
          expect.any(Function)
        );
      });
    });

    it('handles camera permission denial gracefully', async () => {
      mockPermissions.mockCameraPermission('denied');
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Camera Permission Required',
          expect.stringContaining('camera permission'),
          expect.any(Array)
        );
      });
    });

    it('handles camera launch errors', async () => {
      launchCamera.mockImplementation((options, callback) => {
        callback({ error: 'Camera not available' });
      });

      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Camera Error',
          expect.stringContaining('error'),
          expect.any(Array)
        );
      });
    });

    it('handles camera cancellation', async () => {
      launchCamera.mockImplementation((options, callback) => {
        callback({ didCancel: true });
      });

      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await flushPromises();

      // Should not show any error alerts
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('Image Library Functionality', () => {
    it('launches image library when library button is pressed', async () => {
      const mockImageResponse = createMockImagePickerResponse();
      launchImageLibrary.mockImplementation((options, callback) => {
        callback(mockImageResponse);
      });

      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const libraryButton = getByTestId('library-button');
      fireEvent.press(libraryButton);

      await waitFor(() => {
        expect(launchImageLibrary).toHaveBeenCalledWith(
          expect.objectContaining({
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
          }),
          expect.any(Function)
        );
      });
    });

    it('handles library selection errors', async () => {
      launchImageLibrary.mockImplementation((options, callback) => {
        callback({ error: 'Library not accessible' });
      });

      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const libraryButton = getByTestId('library-button');
      fireEvent.press(libraryButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Library Error',
          expect.stringContaining('error'),
          expect.any(Array)
        );
      });
    });
  });

  describe('Image Selection and Preview', () => {
    it('displays selected image in preview area', async () => {
      const mockImageResponse = createMockImagePickerResponse({
        uri: 'mock://selected-image.jpg',
      });
      launchImageLibrary.mockImplementation((options, callback) => {
        callback(mockImageResponse);
      });

      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const libraryButton = getByTestId('library-button');
      fireEvent.press(libraryButton);

      await waitFor(() => {
        const previewImage = getByTestId('preview-image');
        expect(previewImage.props.source.uri).toBe('mock://selected-image.jpg');
      });
    });

    it('shows continue button when image is selected', async () => {
      const mockImageResponse = createMockImagePickerResponse();
      launchImageLibrary.mockImplementation((options, callback) => {
        callback(mockImageResponse);
      });

      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const libraryButton = getByTestId('library-button');
      fireEvent.press(libraryButton);

      await waitFor(() => {
        expect(getByTestId('continue-button')).toBeTruthy();
      });
    });

    it('calls onPhotoCapture when continue button is pressed', async () => {
      const mockOnPhotoCapture = jest.fn();
      const mockRouteWithCallback = createMockRoute({
        params: { onPhotoCapture: mockOnPhotoCapture },
      });

      const mockImageResponse = createMockImagePickerResponse();
      launchImageLibrary.mockImplementation((options, callback) => {
        callback(mockImageResponse);
      });

      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRouteWithCallback} />
      );

      const libraryButton = getByTestId('library-button');
      fireEvent.press(libraryButton);

      await waitFor(() => {
        const continueButton = getByTestId('continue-button');
        fireEvent.press(continueButton);
      });

      expect(mockOnPhotoCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: mockImageResponse.assets[0].uri,
        })
      );
    });

    it('allows retaking photo after selection', async () => {
      const mockImageResponse = createMockImagePickerResponse();
      launchImageLibrary.mockImplementation((options, callback) => {
        callback(mockImageResponse);
      });

      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      // Select image first
      const libraryButton = getByTestId('library-button');
      fireEvent.press(libraryButton);

      await waitFor(() => {
        expect(getByTestId('preview-image')).toBeTruthy();
      });

      // Retake photo
      const retakeButton = getByTestId('retake-button');
      fireEvent.press(retakeButton);

      await waitFor(() => {
        expect(getByTestId('preview-placeholder')).toBeTruthy();
      });
    });
  });

  describe('Platform-specific Behavior', () => {
    it('adjusts camera options for iOS', async () => {
      Platform.OS = 'ios';
      
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(launchCamera).toHaveBeenCalledWith(
          expect.objectContaining({
            cameraType: 'front',
            includeBase64: false,
          }),
          expect.any(Function)
        );
      });
    });

    it('adjusts camera options for Android', async () => {
      Platform.OS = 'android';
      
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(launchCamera).toHaveBeenCalledWith(
          expect.objectContaining({
            saveToPhotos: true,
          }),
          expect.any(Function)
        );
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state while processing image', async () => {
      launchCamera.mockImplementation((options, callback) => {
        // Simulate delay
        setTimeout(() => {
          callback(createMockImagePickerResponse());
        }, 100);
      });

      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(getByTestId('loading-indicator')).toBeTruthy();
      });
    });

    it('disables buttons during loading', async () => {
      launchCamera.mockImplementation((options, callback) => {
        setTimeout(() => {
          callback(createMockImagePickerResponse());
        }, 100);
      });

      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      const libraryButton = getByTestId('library-button');
      
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(cameraButton).toBeDisabled();
        expect(libraryButton).toBeDisabled();
      });
    });
  });

  describe('Analytics Integration', () => {
    it('tracks camera launch events', async () => {
      const analyticsService = require('../../../services/analyticsService');
      
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const cameraButton = getByTestId('camera-button');
      fireEvent.press(cameraButton);

      await flushPromises();

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'photo_capture_camera_launched',
        expect.any(Object)
      );
    });

    it('tracks library selection events', async () => {
      const analyticsService = require('../../../services/analyticsService');
      
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const libraryButton = getByTestId('library-button');
      fireEvent.press(libraryButton);

      await flushPromises();

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'photo_capture_library_opened',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('handles missing navigation prop gracefully', () => {
      const { getByTestId } = renderWithProviders(
        <PhotoCapture route={mockRoute} />
      );

      expect(getByTestId('camera-button')).toBeTruthy();
      expect(getByTestId('library-button')).toBeTruthy();
    });

    it('handles missing route params gracefully', () => {
      const routeWithoutParams = createMockRoute({ params: {} });
      
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={routeWithoutParams} />
      );

      expect(getByTestId('camera-button')).toBeTruthy();
      expect(getByTestId('library-button')).toBeTruthy();
    });

    it('validates image file size', async () => {
      const largeImageResponse = createMockImagePickerResponse({
        fileSize: 10 * 1024 * 1024, // 10MB
      });
      launchImageLibrary.mockImplementation((options, callback) => {
        callback(largeImageResponse);
      });

      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const libraryButton = getByTestId('library-button');
      fireEvent.press(libraryButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'File Too Large',
          expect.stringContaining('size limit'),
          expect.any(Array)
        );
      });
    });

    it('validates image format', async () => {
      const invalidFormatResponse = createMockImagePickerResponse({
        type: 'image/gif',
      });
      launchImageLibrary.mockImplementation((options, callback) => {
        callback(invalidFormatResponse);
      });

      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByTestId } = renderWithProviders(
        <PhotoCapture navigation={mockNavigation} route={mockRoute} />
      );

      const libraryButton = getByTestId('library-button');
      fireEvent.press(libraryButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Invalid Format',
          expect.stringContaining('supported format'),
          expect.any(Array)
        );
      });
    });
  });
});