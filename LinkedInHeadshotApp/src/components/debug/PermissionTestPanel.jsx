/**
 * Permission Testing Panel
 * Use this component to test and debug media permissions
 * Add to your app temporarily for testing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import mediaPermissionService from '../../services/mediaPermissionService';

export const PermissionTestPanel = () => {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);

  useEffect(() => {
    initializeDiagnostics();
  }, []);

  const initializeDiagnostics = async () => {
    try {
      // Log diagnostics to console
      mediaPermissionService.logDiagnostics();
      
      // Get current status
      const status = await mediaPermissionService.checkPermissionStatus();
      setPermissionStatus(status);
      
      // Get diagnostic info
      setDiagnostics({
        isExpoGo: mediaPermissionService.isExpoGo,
        strategy: mediaPermissionService.getPermissionStrategy(),
        hasLimitations: mediaPermissionService.isExpoGoWithLimitations(),
        androidApiLevel: mediaPermissionService.androidApiLevel
      });
    } catch (error) {
      console.error('Diagnostics error:', error);
    }
  };

  const testCameraPermission = async () => {
    try {
      const result = await mediaPermissionService.requestCameraPermissions();
      Alert.alert('Camera Permission', result ? 'Granted ✅' : 'Denied ❌');
      await initializeDiagnostics(); // Refresh status
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const testLibraryPermission = async () => {
    try {
      const result = await mediaPermissionService.requestMediaLibraryPermissions();
      Alert.alert('Library Permission', result ? 'Granted ✅' : 'Denied ❌');
      await initializeDiagnostics(); // Refresh status
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const testSavePermission = async () => {
    try {
      const result = await mediaPermissionService.requestMediaLibrarySavePermissions();
      Alert.alert('Save Permission', result ? 'Granted ✅' : 'Denied ❌');
      await initializeDiagnostics(); // Refresh status
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const getStatusIcon = (granted) => granted ? '✅' : '❌';
  const getStatusColor = (granted) => granted ? '#10B981' : '#EF4444';

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Permission Test Panel</Text>
      
      {/* Environment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment Info</Text>
        {diagnostics && (
          <>
            <Text style={styles.infoText}>
              📱 Environment: {diagnostics.isExpoGo ? 'Expo Go' : 'Development Build'}
            </Text>
            <Text style={styles.infoText}>
              🤖 Android API: {diagnostics.androidApiLevel || 'N/A'}
            </Text>
            <Text style={styles.infoText}>
              🎯 Strategy: {diagnostics.strategy}
            </Text>
            <Text style={[styles.infoText, { color: diagnostics.hasLimitations ? '#EF4444' : '#10B981' }]}>
              ⚠️ Has Limitations: {diagnostics.hasLimitations ? 'Yes' : 'No'}
            </Text>
          </>
        )}
      </View>

      {/* Current Permission Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Permissions</Text>
        {permissionStatus && (
          <>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Camera:</Text>
              <Text style={[styles.permissionStatus, { color: getStatusColor(permissionStatus.camera) }]}>
                {getStatusIcon(permissionStatus.camera)} {permissionStatus.camera ? 'Granted' : 'Denied'}
              </Text>
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Media Library:</Text>
              <Text style={[styles.permissionStatus, { color: getStatusColor(permissionStatus.mediaLibrary) }]}>
                {getStatusIcon(permissionStatus.mediaLibrary)} {permissionStatus.mediaLibrary ? 'Granted' : 'Denied'}
              </Text>
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Save to Gallery:</Text>
              <Text style={[styles.permissionStatus, { color: getStatusColor(permissionStatus.mediaSave) }]}>
                {getStatusIcon(permissionStatus.mediaSave)} {permissionStatus.mediaSave ? 'Granted' : 'Denied'}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Test Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Permissions</Text>
        
        <TouchableOpacity style={styles.testButton} onPress={testCameraPermission}>
          <Text style={styles.testButtonText}>📷 Test Camera Permission</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testLibraryPermission}>
          <Text style={styles.testButtonText}>📱 Test Library Permission</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testSavePermission}>
          <Text style={styles.testButtonText}>💾 Test Save Permission</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.refreshButton} onPress={initializeDiagnostics}>
          <Text style={styles.refreshButtonText}>🔄 Refresh Status</Text>
        </TouchableOpacity>
      </View>

      {/* Debugging Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Info</Text>
        <Text style={styles.debugText}>
          Check console logs for detailed diagnostics.
        </Text>
        {permissionStatus?.error && (
          <Text style={styles.errorText}>
            Error: {permissionStatus.error}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  permissionStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 8,
  },
});

export default PermissionTestPanel;