/**
 * LinkedIn Headshot Generator - Professional App Entry Point
 * Production-ready React Native app with professional mock services
 */

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
import { PaperProvider } from 'react-native-paper';

// Professional Mock Services
import { ProfessionalMockServiceCoordinator } from './src/services/mock/ProfessionalMockServices';
import { PROFESSIONAL_CONFIG, PROFESSIONAL_FEATURE_FLAGS } from './src/config/professional.config';

// Professional Theme
const professionalTheme = {
  colors: {
    primary: '#0077B5', // LinkedIn Blue
    secondary: '#2C3E50', // Professional Dark
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
      
      // Initialize professional mock services
      if (PROFESSIONAL_CONFIG.enabled) {
        console.log('👔 Initializing professional mock services...');
        await ProfessionalMockServiceCoordinator.initializeProfessionalServices();
        console.log('✅ Professional services initialized successfully');
      }

      // Verify professional features
      const enabledFeatures = Object.entries(PROFESSIONAL_FEATURE_FLAGS)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature);
      
      console.log('🏢 Professional features enabled:', enabledFeatures);

      // Professional app initialization complete
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
        <SafeAreaView style={styles.container}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={professionalTheme.colors.background}
          />
          
          {/* Professional App Content */}
          <View style={styles.appContainer}>
            <View style={styles.professionalHeader}>
              <Text style={styles.professionalHeaderTitle}>LinkedIn Headshot Generator</Text>
              <Text style={styles.professionalHeaderSubtitle}>AI-Powered Professional Photos</Text>
            </View>
            
            <View style={styles.content}>
              <Text style={styles.welcomeTitle}>Professional Headshots Made Simple</Text>
              <Text style={styles.welcomeDescription}>
                Generate studio-quality professional headshots optimized for LinkedIn and 
                career success. All professional features available in demo mode.
              </Text>
              
              <View style={styles.featureList}>
                <ProfessionalFeatureItem 
                  icon="📸" 
                  title="AI Headshot Generation" 
                  description="Studio-quality professional photos in seconds"
                  enabled={PROFESSIONAL_FEATURE_FLAGS.ai_enhancement}
                />
                <ProfessionalFeatureItem 
                  icon="💼" 
                  title="LinkedIn Integration" 
                  description="Direct upload to your LinkedIn profile"
                  enabled={PROFESSIONAL_FEATURE_FLAGS.linkedin_integration}
                />
                <ProfessionalFeatureItem 
                  icon="🎨" 
                  title="Professional Styles" 
                  description="Corporate, Creative, Executive templates"
                  enabled={PROFESSIONAL_FEATURE_FLAGS.style_templates}
                />
                <ProfessionalFeatureItem 
                  icon="📊" 
                  title="Quality Scoring" 
                  description="Professional rating and improvement tips"
                  enabled={PROFESSIONAL_FEATURE_FLAGS.quality_scoring}
                />
                <ProfessionalFeatureItem 
                  icon="📈" 
                  title="Career Analytics" 
                  description="Track profile performance and career impact"
                  enabled={PROFESSIONAL_FEATURE_FLAGS.professional_analytics}
                />
                <ProfessionalFeatureItem 
                  icon="🏢" 
                  title="Industry Optimization" 
                  description="Tailored for your specific industry"
                  enabled={PROFESSIONAL_FEATURE_FLAGS.industry_optimization}
                />
              </View>
              
              {PROFESSIONAL_CONFIG.enabled && (
                <View style={styles.professionalDemoNotice}>
                  <Text style={styles.professionalDemoNoticeText}>
                    🎯 Professional Demo: Full LinkedIn integration & AI processing available
                  </Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </NavigationContainer>
    </PaperProvider>
  );
}

// Professional Feature Item Component
interface ProfessionalFeatureItemProps {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
}

const ProfessionalFeatureItem: React.FC<ProfessionalFeatureItemProps> = ({ 
  icon, title, description, enabled 
}) => (
  <View style={[styles.professionalFeatureItem, { opacity: enabled ? 1 : 0.5 }]}>
    <Text style={styles.professionalFeatureIcon}>{icon}</Text>
    <View style={styles.professionalFeatureTextContainer}>
      <Text style={styles.professionalFeatureTitle}>{title}</Text>
      <Text style={styles.professionalFeatureDescription}>{description}</Text>
    </View>
    {enabled && <Text style={styles.professionalFeatureEnabled}>✓</Text>}
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
    backgroundColor: '#0077B5', // LinkedIn Blue
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
    color: '#B3D4E8', // Light LinkedIn blue
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
  
  // Professional App
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  professionalHeader: {
    backgroundColor: '#0077B5',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  professionalHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  professionalHeaderSubtitle: {
    fontSize: 16,
    color: '#B3D4E8',
    marginTop: 4,
  },
  
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 32,
  },
  
  // Professional Features
  featureList: {
    flex: 1,
  },
  professionalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0077B5',
  },
  professionalFeatureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  professionalFeatureTextContainer: {
    flex: 1,
  },
  professionalFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  professionalFeatureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  professionalFeatureEnabled: {
    fontSize: 18,
    color: '#059669',
    fontWeight: 'bold',
  },
  
  // Professional Demo Notice
  professionalDemoNotice: {
    backgroundColor: '#EFF8FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
    marginTop: 20,
  },
  professionalDemoNoticeText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default App;