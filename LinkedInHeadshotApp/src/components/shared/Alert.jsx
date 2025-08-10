/**
 * Enhanced Alert Component
 * Custom alert system with better accessibility and design
 * Replaces React Native's Alert.alert with consistent styling
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  BackHandler,
  Platform,
} from 'react-native';
import Button, { PrimaryButton, TertiaryButton } from './Button';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ACCESSIBILITY, responsive } from '../../utils/designSystem';

// Alert context for global state management
let alertInstance = null;

const Alert = () => {
  const [alerts, setAlerts] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    alertInstance = {
      show: (config) => {
        setAlerts(prev => [...prev, { ...config, id: Date.now() + Math.random() }]);
      },
      hide: (id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
      },
    };

    return () => {
      alertInstance = null;
    };
  }, []);

  const currentAlert = alerts[0];

  useEffect(() => {
    if (currentAlert) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Handle Android back button
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (currentAlert.cancelable !== false) {
          handleDismiss();
          return true;
        }
        return false;
      });

      return () => backHandler.remove();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentAlert, fadeAnim, scaleAnim]);

  const handleDismiss = () => {
    if (currentAlert) {
      setAlerts(prev => prev.slice(1));
      if (currentAlert.onDismiss) {
        currentAlert.onDismiss();
      }
    }
  };

  const handleButtonPress = (button) => {
    if (button.onPress) {
      button.onPress();
    }
    setAlerts(prev => prev.slice(1));
  };

  if (!currentAlert) return null;

  const {
    title,
    message,
    buttons = [{ text: 'OK', style: 'default' }],
    type = 'default', // 'default', 'success', 'warning', 'error'
    icon,
    cancelable = true,
  } = currentAlert;

  // Get alert styles based on type
  const getAlertStyles = () => {
    const typeStyles = {
      default: {
        iconColor: COLORS.primary[500],
        titleColor: COLORS.text.primary,
      },
      success: {
        iconColor: COLORS.semantic.success,
        titleColor: COLORS.semantic.success,
      },
      warning: {
        iconColor: COLORS.semantic.warning,
        titleColor: COLORS.semantic.warning,
      },
      error: {
        iconColor: COLORS.semantic.error,
        titleColor: COLORS.semantic.error,
      },
    };

    return typeStyles[type] || typeStyles.default;
  };

  const alertStyles = getAlertStyles();

  // Default icons for different alert types
  const getDefaultIcon = () => {
    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      default: 'ℹ️',
    };
    return icons[type] || icons.default;
  };

  return (
    <Modal
      transparent
      visible={!!currentAlert}
      animationType="none"
      statusBarTranslucent
      onRequestClose={cancelable ? handleDismiss : undefined}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={cancelable ? handleDismiss : undefined}
          activeOpacity={1}
        >
          <Animated.View 
            style={[
              styles.alertContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
            accessible={true}
            accessibilityRole={ACCESSIBILITY.roles.alert}
            accessibilityLabel={title ? `Alert: ${title}` : 'Alert'}
            accessibilityLiveRegion="assertive"
            importantForAccessibility="yes"
          >
            <TouchableOpacity 
              style={styles.alertContent}
              activeOpacity={1}
              onPress={() => {}} // Prevent closing when tapping alert content
            >
              {/* Icon */}
              <View style={styles.iconContainer}>
                {icon ? (
                  typeof icon === 'string' ? (
                    <Text style={[styles.iconText, { color: alertStyles.iconColor }]}>
                      {icon}
                    </Text>
                  ) : icon
                ) : (
                  <Text style={[styles.iconText, { color: alertStyles.iconColor }]}>
                    {getDefaultIcon()}
                  </Text>
                )}
              </View>

              {/* Content */}
              <View style={styles.textContainer}>
                {title && (
                  <Text 
                    style={[styles.title, { color: alertStyles.titleColor }]}
                    accessibilityRole="header"
                  >
                    {title}
                  </Text>
                )}
                
                {message && (
                  <Text 
                    style={styles.message}
                    accessibilityRole="text"
                  >
                    {message}
                  </Text>
                )}
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => {
                  const isLast = index === buttons.length - 1;
                  const isPrimary = button.style === 'default' || button.style === 'destructive';
                  
                  return (
                    <View key={index} style={[
                      styles.buttonWrapper,
                      !isLast && styles.buttonSpacing
                    ]}>
                      {isPrimary ? (
                        <PrimaryButton
                          title={button.text}
                          onPress={() => handleButtonPress(button)}
                          variant={button.style === 'destructive' ? 'danger' : 'primary'}
                          size="medium"
                          fullWidth
                          accessibilityHint={`${button.text} button for ${title}`}
                        />
                      ) : (
                        <TertiaryButton
                          title={button.text}
                          onPress={() => handleButtonPress(button)}
                          size="medium"
                          fullWidth
                          accessibilityHint={`${button.text} button for ${title}`}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

// Global alert functions
export const showAlert = (config) => {
  if (alertInstance) {
    alertInstance.show(config);
  }
};

export const showSuccessAlert = (title, message, buttons) => {
  showAlert({
    title,
    message,
    buttons,
    type: 'success',
  });
};

export const showWarningAlert = (title, message, buttons) => {
  showAlert({
    title,
    message,
    buttons,
    type: 'warning',
  });
};

export const showErrorAlert = (title, message, buttons) => {
  showAlert({
    title,
    message,
    buttons,
    type: 'error',
  });
};

export const showConfirmAlert = (title, message, onConfirm, onCancel) => {
  showAlert({
    title,
    message,
    buttons: [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
  });
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsive.sp(SPACING.lg),
  },
  
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  
  alertContainer: {
    width: '100%',
    maxWidth: responsive.wp(85),
    minWidth: responsive.wp(70),
  },
  
  alertContent: {
    backgroundColor: COLORS.background.card,
    borderRadius: RADIUS.xl,
    padding: responsive.sp(SPACING.xl),
    alignItems: 'center',
    ...SHADOWS.heavy,
    ...Platform.select({
      android: {
        elevation: 16,
      },
    }),
  },
  
  iconContainer: {
    marginBottom: responsive.sp(SPACING.lg),
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  iconText: {
    fontSize: responsive.fs(48),
  },
  
  textContainer: {
    alignItems: 'center',
    marginBottom: responsive.sp(SPACING.xl),
    width: '100%',
  },
  
  title: {
    fontSize: responsive.fs(TYPOGRAPHY.h3.fontSize),
    fontWeight: TYPOGRAPHY.h3.fontWeight,
    textAlign: 'center',
    marginBottom: responsive.sp(SPACING.md),
    letterSpacing: TYPOGRAPHY.h3.letterSpacing,
  },
  
  message: {
    fontSize: responsive.fs(TYPOGRAPHY.body1.fontSize),
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.body1.lineHeight,
    maxWidth: responsive.wp(70),
  },
  
  buttonContainer: {
    width: '100%',
    flexDirection: 'column',
  },
  
  buttonWrapper: {
    width: '100%',
  },
  
  buttonSpacing: {
    marginBottom: responsive.sp(SPACING.md),
  },
});

export default Alert;