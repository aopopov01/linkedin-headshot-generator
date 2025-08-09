import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';

const LoadingSpinner = ({ 
  visible = false, 
  message = 'Loading...', 
  subMessage = null,
  size = 'large',
  color = '#0A66C2',
  overlay = true,
  transparent = true,
}) => {
  const SpinnerContent = () => (
    <View style={[styles.container, overlay && styles.overlay]}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator 
          size={size} 
          color={color}
          style={styles.spinner}
        />
        
        <Text style={styles.message}>{message}</Text>
        
        {subMessage && (
          <Text style={styles.subMessage}>{subMessage}</Text>
        )}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal
        transparent={transparent}
        visible={visible}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <SpinnerContent />
      </Modal>
    );
  }

  return visible ? <SpinnerContent /> : null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  spinnerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  spinner: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LoadingSpinner;