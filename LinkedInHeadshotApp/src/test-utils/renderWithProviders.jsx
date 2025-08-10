/**
 * Custom render function with all necessary providers for testing
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mock providers for testing
const MockNavigationContainer = ({ children }) => (
  <NavigationContainer>{children}</NavigationContainer>
);

const MockSafeAreaProvider = ({ children }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 375, height: 812 },
      insets: { top: 44, left: 0, right: 0, bottom: 34 },
    }}
  >
    {children}
  </SafeAreaProvider>
);

/**
 * Custom render function that wraps components with necessary providers
 */
export const renderWithProviders = (
  component,
  {
    navigationOptions = {},
    safeAreaOptions = {},
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <MockSafeAreaProvider {...safeAreaOptions}>
      <MockNavigationContainer {...navigationOptions}>
        {children}
      </MockNavigationContainer>
    </MockSafeAreaProvider>
  );

  return render(component, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Render component with navigation only
 */
export const renderWithNavigation = (component, options = {}) => {
  const Wrapper = ({ children }) => (
    <MockNavigationContainer {...options}>
      {children}
    </MockNavigationContainer>
  );

  return render(component, { wrapper: Wrapper });
};

/**
 * Render component with SafeArea only
 */
export const renderWithSafeArea = (component, options = {}) => {
  const Wrapper = ({ children }) => (
    <MockSafeAreaProvider {...options}>
      {children}
    </MockSafeAreaProvider>
  );

  return render(component, { wrapper: Wrapper });
};

// Re-export everything from @testing-library/react-native
export * from '@testing-library/react-native';

// Make renderWithProviders the default export
export default renderWithProviders;