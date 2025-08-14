import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider } from 'react-native-paper';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import PhotoCapture from './src/components/camera/PhotoCapture';
import ProcessingScreen from './src/components/ai/ProcessingScreen';
import PaymentScreen from './src/components/profile/PaymentScreen';

// Professional Mock Services
import { ProfessionalMockServiceCoordinator } from './src/services/mock/ProfessionalMockServices';
import { PROFESSIONAL_CONFIG, PROFESSIONAL_FEATURE_FLAGS } from './src/config/professional.config';

// Navigation Stack
const Stack = createStackNavigator();

// Professional Theme
const professionalTheme = {
  colors: {
    primary: '#0077B5',
    secondary: '#2C3E50',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1F2937',
    textSecondary: '#6B7280',
    linkedinBlue: '#0077B5',
    corporateGray: '#374151',
  },
  fonts: {
    primary: 'System',
  },
};

function App(): JSX.Element {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    initializeProfessionalApp();
  }, []);

  const initializeProfessionalApp = async () => {
    try {
      console.log('🎯 Starting LinkedIn Headshot Generator...');
      
      if (PROFESSIONAL_CONFIG.enabled) {
        console.log('👔 Initializing professional mock services...');
        await ProfessionalMockServiceCoordinator.initializeProfessionalServices();
        console.log('✅ Professional services initialized successfully');
      }

      const enabledFeatures = Object.entries(PROFESSIONAL_FEATURE_FLAGS)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature);
      
      console.log('🏢 Professional features enabled:', enabledFeatures);

      setIsInitialized(true);
      console.log('✨ LinkedIn Headshot Generator ready for professional use!');
      
    } catch (error) {
      console.error('❌ Professional app initialization failed:', error);
      setInitializationError(error instanceof Error ? error.message : 'Unknown professional initialization error');
      
      Alert.alert(
        'Professional App Error',
        'The LinkedIn Headshot Generator encountered an error during startup. Please restart the app.',
        [{ text: 'OK' }]
      );
    }
  };

  if (initializationError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={professionalTheme.colors.error}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Professional App Error</Text>
          <Text style={styles.errorMessage}>{initializationError}</Text>
          <Text style={styles.errorSubtitle}>Please restart LinkedIn Headshot Generator</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={professionalTheme.colors.primary}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingTitle}>LinkedIn Headshot Generator</Text>
          <Text style={styles.loadingSubtitle}>Initializing professional AI services...</Text>
          
          {PROFESSIONAL_CONFIG.enabled && (
            <View style={styles.professionalModeIndicator}>
              <Text style={styles.professionalModeText}>Professional Demo Mode</Text>
              <Text style={styles.professionalModeSubtext}>Full LinkedIn integration & AI processing</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={professionalTheme.colors.background}
        />
        
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: professionalTheme.colors.primary,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PhotoCapture" 
            component={PhotoCapture}
            options={{ title: 'Take Photo' }}
          />
          <Stack.Screen 
            name="Processing" 
            component={ProcessingScreen}
            options={{ title: 'Processing', headerLeft: () => null }}
          />
          <Stack.Screen 
            name="Payment" 
            component={PaymentScreen}
            options={{ title: 'Upgrade Plan' }}
          />
          <Stack.Screen 
            name="StyleTemplates" 
            component={PlaceholderScreen}
            options={{ title: 'Style Templates' }}
          />
          <Stack.Screen 
            name="HeadshotHistory" 
            component={PlaceholderScreen}
            options={{ title: 'My Headshots' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={PlaceholderScreen}
            options={{ title: 'Profile' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

// Placeholder component for screens not yet implemented
const PlaceholderScreen = ({ navigation }: { navigation: any }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderTitle}>Coming Soon</Text>
    <Text style={styles.placeholderSubtitle}>This feature is under development</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0077B5',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#B3D4E8',
    marginTop: 8,
    textAlign: 'center',
  },
  professionalModeIndicator: {
    marginTop: 40,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  professionalModeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  professionalModeSubtext: {
    color: '#B3D4E8',
    fontSize: 14,
    marginTop: 4,
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#FEE2E2',
  },
  
  // Placeholder Screen
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default App;