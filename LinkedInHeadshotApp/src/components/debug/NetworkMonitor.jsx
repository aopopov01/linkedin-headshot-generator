import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import OmniShotAPIService from '../../services/omnishotApiService';
import Environment from '../../config/environment';

/**
 * NetworkMonitor Component
 * Real-time network connectivity monitoring for development
 */
const NetworkMonitor = ({ visible = false, onToggle }) => {
  const [networkStatus, setNetworkStatus] = useState({
    connected: false,
    status: 'checking',
    endpoint: '',
    lastCheck: null,
    error: null,
    diagnostics: null
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [checkInterval, setCheckInterval] = useState(null);

  useEffect(() => {
    if (visible) {
      checkConnection();
      startMonitoring();
    } else {
      stopMonitoring();
    }
    
    return () => stopMonitoring();
  }, [visible]);

  const checkConnection = async () => {
    try {
      console.log('🔍 NetworkMonitor: Checking connection...');
      const health = await OmniShotAPIService.checkServiceHealth();
      
      setNetworkStatus({
        connected: health.available,
        status: health.status,
        endpoint: health.currentEndpoint,
        lastCheck: new Date().toLocaleTimeString(),
        error: health.error || null,
        developmentMode: health.developmentMode,
        functionalForDev: health.functionalForDev,
        message: health.message,
        details: health.details
      });
      
    } catch (error) {
      console.error('❌ NetworkMonitor: Connection check failed:', error);
      setNetworkStatus(prev => ({
        ...prev,
        connected: false,
        status: 'error',
        lastCheck: new Date().toLocaleTimeString(),
        error: error.message
      }));
    }
  };

  const runDiagnostics = async () => {
    try {
      console.log('🔧 NetworkMonitor: Running diagnostics...');
      setNetworkStatus(prev => ({ ...prev, status: 'diagnosing' }));
      
      const diagnostics = await OmniShotAPIService.runNetworkDiagnostics();
      
      setNetworkStatus(prev => ({
        ...prev,
        diagnostics: diagnostics,
        status: 'diagnostic_complete',
        lastCheck: new Date().toLocaleTimeString()
      }));
      
    } catch (error) {
      console.error('❌ NetworkMonitor: Diagnostics failed:', error);
      setNetworkStatus(prev => ({
        ...prev,
        error: error.message,
        status: 'diagnostic_failed'
      }));
    }
  };

  const startMonitoring = () => {
    if (checkInterval) return;
    
    setIsMonitoring(true);
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds
    setCheckInterval(interval);
  };

  const stopMonitoring = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      setCheckInterval(null);
    }
    setIsMonitoring(false);
  };

  const getStatusColor = () => {
    if (networkStatus.connected) {
      return networkStatus.functionalForDev ? '#4CAF50' : '#FF9800';
    }
    return '#F44336';
  };

  const getStatusText = () => {
    if (networkStatus.connected) {
      if (networkStatus.functionalForDev) {
        return 'Connected (Dev Ready)';
      }
      return `Connected (${networkStatus.status})`;
    }
    return 'Disconnected';
  };

  const showDiagnosticsAlert = () => {
    if (!networkStatus.diagnostics) return;
    
    const { diagnostics } = networkStatus;
    const workingEndpoints = diagnostics.endpointTests.filter(test => test.success);
    
    let message = `Environment: ${diagnostics.environmentInfo.platform}\n\n`;
    message += `Working Endpoints: ${workingEndpoints.length}/${diagnostics.endpointTests.length}\n\n`;
    
    if (workingEndpoints.length > 0) {
      message += 'Working:\n';
      workingEndpoints.forEach(test => {
        message += `✅ ${test.url} (${test.status})\n`;
      });
    }
    
    if (diagnostics.recommendations.length > 0) {
      message += '\nRecommendations:\n';
      diagnostics.recommendations.slice(0, 3).forEach(rec => {
        message += `• ${rec}\n`;
      });
    }
    
    Alert.alert('Network Diagnostics', message);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Monitor</Text>
        <TouchableOpacity onPress={onToggle} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Connection Status */}
        <View style={styles.statusSection}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            <Text style={styles.endpointText}>{networkStatus.endpoint}</Text>
            {networkStatus.lastCheck && (
              <Text style={styles.lastCheckText}>Last check: {networkStatus.lastCheck}</Text>
            )}
          </View>
        </View>

        {/* Environment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment</Text>
          <Text style={styles.infoText}>
            API Base URL: {Environment.API_BASE_URL}{'\n'}
            Platform: {Environment.PLATFORM}{'\n'}
            Development: {Environment.IS_DEVELOPMENT ? 'Yes' : 'No'}{'\n'}
            Expo Go: {Environment.IS_EXPO_GO ? 'Yes' : 'No'}
          </Text>
        </View>

        {/* Development Status */}
        {networkStatus.developmentMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development Status</Text>
            <Text style={[styles.statusBadge, { 
              backgroundColor: networkStatus.functionalForDev ? '#E8F5E8' : '#FFF3E0',
              color: networkStatus.functionalForDev ? '#2E7D32' : '#F57C00'
            }]}>
              {networkStatus.functionalForDev ? 'Ready for Development' : 'Needs Configuration'}
            </Text>
            {networkStatus.details && (
              <Text style={styles.detailsText}>{networkStatus.details}</Text>
            )}
          </View>
        )}

        {/* Error Display */}
        {networkStatus.error && (
          <View style={styles.errorSection}>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorText}>{networkStatus.error}</Text>
            {networkStatus.message && (
              <Text style={styles.errorMessage}>{networkStatus.message}</Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={checkConnection}>
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.diagnosticsButton]} 
            onPress={runDiagnostics}
          >
            <Text style={styles.buttonText}>Run Diagnostics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, 
              isMonitoring ? styles.stopButton : styles.startButton
            ]} 
            onPress={isMonitoring ? stopMonitoring : startMonitoring}
          >
            <Text style={styles.buttonText}>
              {isMonitoring ? 'Stop Monitor' : 'Start Monitor'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Diagnostics Results */}
        {networkStatus.diagnostics && (
          <TouchableOpacity style={styles.diagnosticsResult} onPress={showDiagnosticsAlert}>
            <Text style={styles.diagnosticsTitle}>Diagnostics Available</Text>
            <Text style={styles.diagnosticsText}>
              {networkStatus.diagnostics.endpointTests.filter(t => t.success).length}/
              {networkStatus.diagnostics.endpointTests.length} endpoints working
            </Text>
            <Text style={styles.tapHint}>Tap for details</Text>
          </TouchableOpacity>
        )}

        {/* Alternative Endpoints */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alternative Endpoints</Text>
          {Environment.getAlternativeEndpoints().map((endpoint, index) => (
            <Text key={index} style={styles.endpointItem}>
              {index + 1}. {endpoint}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    width: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 4
  },
  closeText: {
    fontSize: 18,
    color: '#666'
  },
  content: {
    padding: 12
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12
  },
  statusInfo: {
    flex: 1
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  endpointText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  lastCheckText: {
    fontSize: 11,
    color: '#999'
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  detailsText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic'
  },
  errorSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336'
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C62828',
    marginBottom: 4
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    marginBottom: 4
  },
  errorMessage: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic'
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8
  },
  diagnosticsButton: {
    backgroundColor: '#FF9800'
  },
  startButton: {
    backgroundColor: '#4CAF50'
  },
  stopButton: {
    backgroundColor: '#F44336'
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  diagnosticsResult: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3'
  },
  diagnosticsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4
  },
  diagnosticsText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2
  },
  tapHint: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic'
  },
  endpointItem: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace'
  }
});

export default NetworkMonitor;