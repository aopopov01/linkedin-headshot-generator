import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * GDPR/CCPA Compliant Consent Management Component
 * 
 * This component handles:
 * - Initial consent collection
 * - Granular consent preferences
 * - Consent withdrawal
 * - Privacy rights information
 * - CCPA Do Not Sell mechanism
 */

const CONSENT_STORAGE_KEY = 'user_consent_preferences';
const CONSENT_VERSION = '1.0';

const ConsentManager = ({ 
  visible, 
  onConsentUpdate, 
  onClose,
  userLocation = 'US',
  showInitialConsent = false 
}) => {
  const [consentPreferences, setConsentPreferences] = useState({
    // Essential - cannot be disabled
    essential: true,
    
    // Optional - user can control
    analytics: false,
    marketing: false,
    personalization: false,
    
    // CCPA specific
    doNotSell: false,
    
    // Metadata
    consentVersion: CONSENT_VERSION,
    consentDate: null,
    lastUpdated: null
  });

  const [hasGivenInitialConsent, setHasGivenInitialConsent] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine if user is in GDPR territory
  const isGDPRApplicable = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 
    'SK', 'SI', 'ES', 'SE', 'GB', 'IS', 'LI', 'NO', 'CH'].includes(userLocation);

  // Determine if user is in California (CCPA)
  const isCCPAApplicable = userLocation === 'CA' || userLocation === 'US';

  useEffect(() => {
    loadStoredConsent();
  }, []);

  const loadStoredConsent = async () => {
    try {
      const stored = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsedConsent = JSON.parse(stored);
        setConsentPreferences(parsedConsent);
        setHasGivenInitialConsent(!!parsedConsent.consentDate);
      }
    } catch (error) {
      console.error('Error loading consent preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConsentPreferences = async (preferences) => {
    try {
      const updatedPreferences = {
        ...preferences,
        lastUpdated: new Date().toISOString(),
        consentDate: preferences.consentDate || new Date().toISOString()
      };

      await AsyncStorage.setItem(
        CONSENT_STORAGE_KEY, 
        JSON.stringify(updatedPreferences)
      );

      setConsentPreferences(updatedPreferences);
      setHasGivenInitialConsent(true);

      // Notify parent component
      if (onConsentUpdate) {
        onConsentUpdate(updatedPreferences);
      }

      return true;
    } catch (error) {
      console.error('Error saving consent preferences:', error);
      Alert.alert('Error', 'Failed to save privacy preferences. Please try again.');
      return false;
    }
  };

  const handleConsentChange = (consentType, value) => {
    setConsentPreferences(prev => ({
      ...prev,
      [consentType]: value
    }));
  };

  const handleAcceptAll = async () => {
    const allConsent = {
      ...consentPreferences,
      analytics: true,
      marketing: true,
      personalization: true,
      doNotSell: false
    };

    const success = await saveConsentPreferences(allConsent);
    if (success && onClose) {
      onClose();
    }
  };

  const handleAcceptEssentialOnly = async () => {
    const essentialOnly = {
      ...consentPreferences,
      analytics: false,
      marketing: false,
      personalization: false,
      doNotSell: true
    };

    const success = await saveConsentPreferences(essentialOnly);
    if (success && onClose) {
      onClose();
    }
  };

  const handleSaveCustomPreferences = async () => {
    const success = await saveConsentPreferences(consentPreferences);
    if (success && onClose) {
      onClose();
    }
  };

  const handleViewPrivacyPolicy = () => {
    Linking.openURL('https://xciterr.com/privacy');
  };

  const handleExerciseRights = () => {
    Linking.openURL('mailto:xciterr@outlook.com?subject=Privacy Rights Request');
  };

  const renderConsentItem = (key, title, description, required = false) => (
    <View style={styles.consentItem} key={key}>
      <View style={styles.consentHeader}>
        <Text style={styles.consentTitle}>{title}</Text>
        {required && <Text style={styles.requiredBadge}>Required</Text>}
      </View>
      <Text style={styles.consentDescription}>{description}</Text>
      <Switch
        value={consentPreferences[key]}
        onValueChange={(value) => handleConsentChange(key, value)}
        disabled={required}
        trackColor={{ false: '#767577', true: '#007AFF' }}
        thumbColor={consentPreferences[key] ? '#007AFF' : '#f4f3f4'}
      />
    </View>
  );

  const renderInitialConsentScreen = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Privacy Choices</Text>
      
      {isGDPRApplicable && (
        <Text style={styles.gdprNotice}>
          We respect your privacy rights under the General Data Protection Regulation (GDPR).
        </Text>
      )}

      {isCCPAApplicable && (
        <Text style={styles.ccpaNotice}>
          California residents have specific privacy rights under the California Consumer Privacy Act (CCPA).
        </Text>
      )}

      <Text style={styles.description}>
        We use your data to provide our AI headshot generation service. You can control how we use your information by adjusting these preferences.
      </Text>

      <View style={styles.consentList}>
        {renderConsentItem(
          'essential',
          'Essential Functionality',
          'Required for app functionality, account management, and service delivery. Cannot be disabled.',
          true
        )}

        {renderConsentItem(
          'analytics',
          'Analytics & Performance',
          'Help us improve the app by analyzing usage patterns and performance metrics.'
        )}

        {renderConsentItem(
          'personalization',
          'Personalization',
          'Customize your experience based on your preferences and usage history.'
        )}

        {renderConsentItem(
          'marketing',
          'Marketing Communications',
          'Receive updates about new features, tips, and promotional offers.'
        )}

        {isCCPAApplicable && renderConsentItem(
          'doNotSell',
          'Do Not Sell My Personal Information',
          'Opt out of the sale of your personal information to third parties (CCPA right).'
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.acceptAllButton]} 
          onPress={handleAcceptAll}
        >
          <Text style={styles.acceptAllButtonText}>Accept All</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.essentialOnlyButton]} 
          onPress={handleAcceptEssentialOnly}
        >
          <Text style={styles.essentialOnlyButtonText}>Essential Only</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.customizeButton]} 
          onPress={handleSaveCustomPreferences}
        >
          <Text style={styles.customizeButtonText}>Save My Preferences</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.linksContainer}>
        <TouchableOpacity onPress={handleViewPrivacyPolicy}>
          <Text style={styles.linkText}>View Privacy Policy</Text>
        </TouchableOpacity>

        {(isGDPRApplicable || isCCPAApplicable) && (
          <TouchableOpacity onPress={handleExerciseRights}>
            <Text style={styles.linkText}>Exercise Your Privacy Rights</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.loadingContainer}>
          <Text>Loading privacy preferences...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Privacy Settings</Text>
          {!showInitialConsent && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
        {renderInitialConsentScreen()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  gdprNotice: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    color: '#0066cc',
    fontSize: 14,
  },
  ccpaNotice: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    color: '#856404',
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 24,
  },
  consentList: {
    marginBottom: 32,
  },
  consentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 16,
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  consentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptAllButton: {
    backgroundColor: '#007AFF',
  },
  acceptAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  essentialOnlyButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  essentialOnlyButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  customizeButton: {
    backgroundColor: '#28a745',
  },
  customizeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linksContainer: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 40,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default ConsentManager;