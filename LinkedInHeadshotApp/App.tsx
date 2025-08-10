/**
 * LinkedIn Headshot Generator App
 * Professional AI-powered headshot generation for LinkedIn profiles
 * 
 * @format
 */

import React, { useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  Platform,
} from 'react-native';
import 'react-native-gesture-handler'; // Required for React Navigation

// Import navigation and services
import Navigation from './src/components/shared/Navigation';
import Alert from './src/components/shared/Alert';
import analyticsService from './src/services/analyticsService';
import paymentService from './src/services/paymentService';
import { COLORS } from './src/utils/designSystem';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  // Initialize services on app startup
  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize analytics service
      await analyticsService.initialize({
        enableInProduction: true,
        batchSize: 10,
        flushInterval: 30000,
      });

      // Initialize payment service
      await paymentService.initialize();

      // Track app launch
      analyticsService.track('app_launched', {
        platform: Platform.OS,
        version: '1.0.0',
      });

      // Start new session
      analyticsService.resetSession();

      console.log('App services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      
      // Track initialization error
      analyticsService.trackError(error, {
        context: 'app_initialization',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.background.primary}
        translucent={false}
      />
      <Navigation />
      <Alert />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
});

export default App;