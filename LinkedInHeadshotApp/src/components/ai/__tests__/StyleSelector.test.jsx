/**
 * StyleSelector Component Tests
 * Comprehensive testing for AI style selection functionality
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import renderWithProviders from '../../../test-utils/renderWithProviders';
import {
  createMockNavigation,
  createMockRoute,
  mockFetchResponse,
  mockNetworkError,
  assertAccessibility,
  flushPromises,
} from '../../../test-utils/testHelpers';
import StyleSelector from '../StyleSelector';
import * as aiService from '../../../services/aiService';

// Mock external dependencies
jest.mock('../../../services/aiService');
jest.mock('../../../services/analyticsService');

const mockStyles = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, business-appropriate headshot',
    preview: 'mock://professional.jpg',
    category: 'business',
    isPremium: false,
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'High-end executive portrait',
    preview: 'mock://executive.jpg',
    category: 'business',
    isPremium: true,
  },
  {
    id: 'casual',
    name: 'Casual Professional',
    description: 'Relaxed but professional look',
    preview: 'mock://casual.jpg',
    category: 'casual',
    isPremium: false,
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Artistic and creative style',
    preview: 'mock://creative.jpg',
    category: 'creative',
    isPremium: true,
  },
];

describe('StyleSelector Component', () => {
  let mockNavigation;
  let mockRoute;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation = createMockNavigation();
    mockRoute = createMockRoute({
      params: {
        photoUri: 'mock://selected-photo.jpg',
        onStyleSelected: jest.fn(),
      },
    });

    // Mock successful API response
    aiService.getAvailableStyles.mockResolvedValue(mockStyles);
  });

  describe('Rendering', () => {
    it('renders correctly with loading state initially', () => {
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('displays styles after successful API call', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Professional')).toBeTruthy();
        expect(getByText('Executive')).toBeTruthy();
        expect(getByText('Casual Professional')).toBeTruthy();
        expect(getByText('Creative')).toBeTruthy();
      });
    });

    it('displays style categories', async () => {
      const { getByText } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Business')).toBeTruthy();
        expect(getByText('Casual')).toBeTruthy();
        expect(getByText('Creative')).toBeTruthy();
      });
    });

    it('shows premium badges for premium styles', async () => {
      const { getAllByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const premiumBadges = getAllByTestId('premium-badge');
        expect(premiumBadges).toHaveLength(2); // Executive and Creative
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels for style cards', async () => {
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const professionalCard = getByTestId('style-card-professional');
        assertAccessibility.hasLabel(professionalCard);
        assertAccessibility.hasRole(professionalCard, 'button');
      });
    });

    it('provides accessibility hints for premium styles', async () => {
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const executiveCard = getByTestId('style-card-executive');
        assertAccessibility.hasHint(executiveCard);
        expect(executiveCard.props.accessibilityHint).toContain('premium');
      });
    });

    it('has proper touch target sizes', async () => {
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const styleCard = getByTestId('style-card-professional');
        assertAccessibility.hasTouchTarget(styleCard);
      });
    });
  });

  describe('Style Selection', () => {
    it('selects style when card is pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const professionalCard = getByTestId('style-card-professional');
        fireEvent.press(professionalCard);
      });

      expect(getByTestId('style-card-professional')).toHaveStyle({
        borderColor: expect.stringContaining('#'),
        borderWidth: 2,
      });
    });

    it('shows continue button when style is selected', async () => {
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const professionalCard = getByTestId('style-card-professional');
        fireEvent.press(professionalCard);
      });

      expect(getByTestId('continue-button')).toBeTruthy();
    });

    it('calls onStyleSelected when continue button is pressed', async () => {
      const mockOnStyleSelected = jest.fn();
      const routeWithCallback = createMockRoute({
        params: {
          photoUri: 'mock://photo.jpg',
          onStyleSelected: mockOnStyleSelected,
        },
      });

      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={routeWithCallback} />
      );

      await waitFor(() => {
        const professionalCard = getByTestId('style-card-professional');
        fireEvent.press(professionalCard);
      });

      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);

      expect(mockOnStyleSelected).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'professional',
          name: 'Professional',
        })
      );
    });

    it('allows changing selected style', async () => {
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // Select professional first
        const professionalCard = getByTestId('style-card-professional');
        fireEvent.press(professionalCard);
      });

      // Select casual instead
      const casualCard = getByTestId('style-card-casual');
      fireEvent.press(casualCard);

      expect(casualCard).toHaveStyle({
        borderColor: expect.stringContaining('#'),
        borderWidth: 2,
      });
    });
  });

  describe('Premium Features', () => {
    it('shows upgrade prompt for premium styles when user is on free plan', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const executiveCard = getByTestId('style-card-executive');
        fireEvent.press(executiveCard);
      });

      await waitFor(() => {
        expect(getByText(/upgrade to premium/i)).toBeTruthy();
        expect(getByTestId('upgrade-button')).toBeTruthy();
      });
    });

    it('allows premium style selection for premium users', async () => {
      // Mock premium user
      const premiumRoute = createMockRoute({
        params: {
          photoUri: 'mock://photo.jpg',
          onStyleSelected: jest.fn(),
          userPlan: 'premium',
        },
      });

      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={premiumRoute} />
      );

      await waitFor(() => {
        const executiveCard = getByTestId('style-card-executive');
        fireEvent.press(executiveCard);
      });

      expect(executiveCard).toHaveStyle({
        borderColor: expect.stringContaining('#'),
        borderWidth: 2,
      });
    });

    it('navigates to payment screen when upgrade button is pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const executiveCard = getByTestId('style-card-executive');
        fireEvent.press(executiveCard);
      });

      await waitFor(() => {
        const upgradeButton = getByTestId('upgrade-button');
        fireEvent.press(upgradeButton);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Payment', {
        plan: 'premium',
        returnScreen: 'StyleSelector',
      });
    });
  });

  describe('Category Filtering', () => {
    it('filters styles by category', async () => {
      const { getByText, queryByText } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const businessTab = getByText('Business');
        fireEvent.press(businessTab);
      });

      expect(getByText('Professional')).toBeTruthy();
      expect(getByText('Executive')).toBeTruthy();
      expect(queryByText('Casual Professional')).toBeNull();
    });

    it('shows all styles when "All" category is selected', async () => {
      const { getByText } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const allTab = getByText('All');
        fireEvent.press(allTab);
      });

      expect(getByText('Professional')).toBeTruthy();
      expect(getByText('Executive')).toBeTruthy();
      expect(getByText('Casual Professional')).toBeTruthy();
      expect(getByText('Creative')).toBeTruthy();
    });

    it('updates selected category indicator', async () => {
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const businessTab = getByTestId('category-tab-business');
        fireEvent.press(businessTab);
      });

      expect(businessTab).toHaveStyle({
        backgroundColor: expect.stringContaining('#'),
      });
    });
  });

  describe('Preview Functionality', () => {
    it('shows style preview when style card is long pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const professionalCard = getByTestId('style-card-professional');
        fireEvent(professionalCard, 'onLongPress');
      });

      expect(getByTestId('style-preview-modal')).toBeTruthy();
    });

    it('closes preview modal when backdrop is pressed', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const professionalCard = getByTestId('style-card-professional');
        fireEvent(professionalCard, 'onLongPress');
      });

      const modalBackdrop = getByTestId('modal-backdrop');
      fireEvent.press(modalBackdrop);

      await waitFor(() => {
        expect(queryByTestId('style-preview-modal')).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      aiService.getAvailableStyles.mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/failed to load styles/i)).toBeTruthy();
        expect(getByTestId('retry-button')).toBeTruthy();
      });
    });

    it('retries API call when retry button is pressed', async () => {
      aiService.getAvailableStyles
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockStyles);

      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const retryButton = getByTestId('retry-button');
        fireEvent.press(retryButton);
      });

      await waitFor(() => {
        expect(getByTestId('style-card-professional')).toBeTruthy();
      });

      expect(aiService.getAvailableStyles).toHaveBeenCalledTimes(2);
    });

    it('handles empty styles response', async () => {
      aiService.getAvailableStyles.mockResolvedValue([]);

      const { getByText } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/no styles available/i)).toBeTruthy();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator while fetching styles', () => {
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('shows skeleton cards during loading', () => {
      const { getAllByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      const skeletonCards = getAllByTestId('skeleton-card');
      expect(skeletonCards.length).toBeGreaterThan(0);
    });

    it('hides loading state after styles are loaded', async () => {
      const { queryByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeNull();
      });
    });
  });

  describe('Analytics Integration', () => {
    it('tracks style selection events', async () => {
      const analyticsService = require('../../../services/analyticsService');
      
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const professionalCard = getByTestId('style-card-professional');
        fireEvent.press(professionalCard);
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'style_selected',
        expect.objectContaining({
          styleId: 'professional',
          styleName: 'Professional',
          category: 'business',
          isPremium: false,
        })
      );
    });

    it('tracks category filter usage', async () => {
      const analyticsService = require('../../../services/analyticsService');
      
      const { getByText } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const businessTab = getByText('Business');
        fireEvent.press(businessTab);
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'category_filter_used',
        expect.objectContaining({
          category: 'business',
        })
      );
    });

    it('tracks premium upgrade prompts', async () => {
      const analyticsService = require('../../../services/analyticsService');
      
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const executiveCard = getByTestId('style-card-executive');
        fireEvent.press(executiveCard);
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'premium_upgrade_prompt_shown',
        expect.objectContaining({
          styleId: 'executive',
          source: 'style_selector',
        })
      );
    });
  });

  describe('Performance', () => {
    it('renders large numbers of styles without performance issues', async () => {
      const manyStyles = Array.from({ length: 50 }, (_, i) => ({
        id: `style-${i}`,
        name: `Style ${i}`,
        description: `Description ${i}`,
        preview: `mock://style-${i}.jpg`,
        category: 'business',
        isPremium: i % 3 === 0,
      }));

      aiService.getAvailableStyles.mockResolvedValue(manyStyles);

      const startTime = Date.now();
      const { getByTestId } = renderWithProviders(
        <StyleSelector navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByTestId('style-card-style-0')).toBeTruthy();
      });

      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
    });
  });
});