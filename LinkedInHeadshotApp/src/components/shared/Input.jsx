/**
 * Enhanced Input Component
 * Follows iOS HIG and Material Design guidelines
 * WCAG 2.1 AA compliant with proper accessibility features
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SIZES, ACCESSIBILITY } from '../../utils/designSystem';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  secureTextEntry = false,
  leftIcon = null,
  rightIcon = null,
  style = {},
  inputStyle = {},
  testID,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef(null);

  // Handle focus animations
  const handleFocus = (e) => {
    setFocused(true);
    Animated.timing(animatedIsFocused, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus && onFocus(e);
  };

  // Handle blur animations
  const handleBlur = (e) => {
    setFocused(false);
    setIsEmpty(!value);
    
    if (!value) {
      Animated.timing(animatedIsFocused, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    
    onBlur && onBlur(e);
  };

  // Handle text change
  const handleTextChange = (text) => {
    setIsEmpty(!text);
    onChangeText && onChangeText(text);
  };

  // Focus input when label is tapped
  const handleLabelPress = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Get container styles
  const getContainerStyles = () => {
    let borderColor = COLORS.border.light;
    let backgroundColor = COLORS.background.primary;

    if (error) {
      borderColor = COLORS.semantic.error;
    } else if (focused) {
      borderColor = COLORS.primary[500];
    }

    if (disabled) {
      backgroundColor = COLORS.neutral[100];
      borderColor = COLORS.border.light;
    }

    return {
      borderColor,
      backgroundColor,
    };
  };

  // Animated label styles
  const getLabelStyles = () => {
    return {
      position: 'absolute',
      left: leftIcon ? SIZES.icon.lg + SPACING.md : SPACING.md,
      top: animatedIsFocused.interpolate({
        inputRange: [0, 1],
        outputRange: [multiline ? SPACING.md + 4 : SPACING.md + 2, -SPACING.sm],
      }),
      fontSize: animatedIsFocused.interpolate({
        inputRange: [0, 1],
        outputRange: [TYPOGRAPHY.body1.fontSize, TYPOGRAPHY.caption.fontSize],
      }),
      color: animatedIsFocused.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.text.secondary, focused ? COLORS.primary[500] : COLORS.text.secondary],
      }),
      backgroundColor: COLORS.background.primary,
      paddingHorizontal: SPACING.xs,
      zIndex: 1,
    };
  };

  // Get text input styles
  const getTextInputStyles = () => {
    return {
      color: disabled ? COLORS.text.disabled : COLORS.text.primary,
      fontSize: TYPOGRAPHY.body1.fontSize,
      lineHeight: TYPOGRAPHY.body1.lineHeight,
      paddingLeft: leftIcon ? SIZES.icon.lg + SPACING.md : SPACING.md,
      paddingRight: rightIcon ? SIZES.icon.lg + SPACING.md : SPACING.md,
      paddingTop: label ? SPACING.lg : SPACING.md,
      paddingBottom: SPACING.md,
      minHeight: multiline ? SIZES.input.large * 2 : SIZES.input.medium,
      textAlignVertical: multiline ? 'top' : 'center',
    };
  };

  // Accessibility props
  const accessibilityProps = {
    accessible: true,
    accessibilityLabel: accessibilityLabel || label,
    accessibilityHint: accessibilityHint || helperText,
    accessibilityRole: 'none', // Let TextInput handle its own role
    accessibilityState: {
      disabled: disabled,
    },
    testID,
  };

  const containerStyles = getContainerStyles();
  const labelStyles = getLabelStyles();
  const textInputStyles = getTextInputStyles();

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.container, containerStyles]}>
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}

        {/* Floating Label */}
        {label && (
          <TouchableWithoutFeedback onPress={handleLabelPress}>
            <Animated.Text 
              style={[styles.label, labelStyles]}
              numberOfLines={1}
            >
              {label}
              {required && <Text style={styles.required}> *</Text>}
            </Animated.Text>
          </TouchableWithoutFeedback>
        )}

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={[styles.textInput, textInputStyles, inputStyle]}
          placeholder={!label && focused ? placeholder : ''}
          placeholderTextColor={COLORS.text.secondary}
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          secureTextEntry={secureTextEntry}
          underlineColorAndroid="transparent"
          {...accessibilityProps}
          {...rest}
        />

        {/* Right Icon */}
        {rightIcon && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <Text style={[
          styles.helperText,
          error && styles.errorText,
        ]}>
          {error || helperText}
        </Text>
      )}

      {/* Character Count */}
      {maxLength && value && (
        <Text style={styles.characterCount}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

// Search Input variant
export const SearchInput = ({
  placeholder = "Search...",
  onClear,
  clearIcon,
  searchIcon,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(props.value || '');

  const handleClear = () => {
    setLocalValue('');
    onClear && onClear();
    props.onChangeText && props.onChangeText('');
  };

  const defaultSearchIcon = (
    <Text style={{ fontSize: SIZES.icon.md, color: COLORS.text.secondary }}>🔍</Text>
  );

  const defaultClearIcon = (
    <TouchableWithoutFeedback onPress={handleClear}>
      <Text style={{ fontSize: SIZES.icon.md, color: COLORS.text.secondary }}>✕</Text>
    </TouchableWithoutFeedback>
  );

  return (
    <Input
      {...props}
      value={localValue}
      onChangeText={(text) => {
        setLocalValue(text);
        props.onChangeText && props.onChangeText(text);
      }}
      placeholder={placeholder}
      leftIcon={searchIcon || defaultSearchIcon}
      rightIcon={localValue ? (clearIcon || defaultClearIcon) : null}
      style={[styles.searchInput, props.style]}
    />
  );
};

// Textarea variant
export const Textarea = (props) => (
  <Input
    multiline
    numberOfLines={4}
    {...props}
    style={[styles.textarea, props.style]}
  />
);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  
  container: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    position: 'relative',
    minHeight: SIZES.input.medium,
  },
  
  label: {
    fontWeight: TYPOGRAPHY.body2.fontWeight,
    letterSpacing: TYPOGRAPHY.body2.letterSpacing,
  },
  
  required: {
    color: COLORS.semantic.error,
  },
  
  textInput: {
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
  
  leftIcon: {
    position: 'absolute',
    left: SPACING.md,
    top: '50%',
    marginTop: -SIZES.icon.md / 2,
    zIndex: 2,
  },
  
  rightIcon: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    marginTop: -SIZES.icon.md / 2,
    zIndex: 2,
  },
  
  helperText: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    lineHeight: TYPOGRAPHY.caption.lineHeight,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
  },
  
  errorText: {
    color: COLORS.semantic.error,
  },
  
  characterCount: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: COLORS.text.secondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
    marginRight: SPACING.md,
  },
  
  searchInput: {
    marginBottom: 0,
  },
  
  textarea: {
    marginBottom: SPACING.md,
  },
});

export default Input;