import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ACCESSIBILITY } from '../../utils/designSystem';

// Import screens
import PhotoCapture from '../camera/PhotoCapture';
import StyleSelector from '../ai/StyleSelector';
import ProcessingScreen from '../ai/ProcessingScreen';
import ResultsGallery from '../ai/ResultsGallery';
import PaymentScreen from '../profile/PaymentScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Enhanced Tab Bar Icon Component with proper accessibility
const TabIcon = ({ focused, iconName, label }) => {
  const icons = {
    capture: focused ? '📷' : '📷',
    gallery: focused ? '🖼️' : '🖼️',
    profile: focused ? '👤' : '👤',
  };

  return (
    <View 
      style={styles.tabIcon}
      accessible={true}
      accessibilityRole="tab"
      accessibilityLabel={`${label} tab`}
      accessibilityState={{ selected: focused }}
    >
      <Text style={[styles.tabIconText, focused && styles.tabIconFocused]}>
        {icons[iconName]}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
};

// Main App Stack Navigator
const AppStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="PhotoCapture"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background.primary,
          ...SHADOWS.light,
          borderBottomWidth: Platform.OS === 'android' ? 1 : 0,
          borderBottomColor: COLORS.border.light,
        },
        headerTintColor: COLORS.text.primary,
        headerTitleStyle: {
          fontWeight: TYPOGRAPHY.h4.fontWeight,
          fontSize: TYPOGRAPHY.h4.fontSize,
          color: COLORS.text.primary,
        },
        headerBackTitleVisible: false,
        headerLeftContainerStyle: {
          paddingLeft: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
        },
        cardStyle: { backgroundColor: COLORS.background.primary },
        gestureEnabled: Platform.OS === 'ios',
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name="PhotoCapture"
        component={PhotoCapture}
        options={{
          title: 'Capture Photo',
          headerLeft: () => null, // Remove back button for main screen
        }}
      />
      
      <Stack.Screen
        name="StyleSelector"
        component={StyleSelector}
        options={{
          title: 'Choose Style',
        }}
      />
      
      <Stack.Screen
        name="ProcessingScreen"
        component={ProcessingScreen}
        options={{
          title: 'Generating Photos',
          headerLeft: () => null, // Prevent going back during processing
        }}
      />
      
      <Stack.Screen
        name="ResultsGallery"
        component={ResultsGallery}
        options={{
          title: 'Your Headshots',
        }}
      />
      
      <Stack.Screen
        name="PaymentScreen"
        component={PaymentScreen}
        options={{
          title: 'Upgrade to Premium',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

// Tab Navigator (for future expansion)
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName;
          let label;

          if (route.name === 'Capture') {
            iconName = 'capture';
            label = 'Capture';
          } else if (route.name === 'Gallery') {
            iconName = 'gallery';
            label = 'Gallery';
          } else if (route.name === 'Profile') {
            iconName = 'profile';
            label = 'Profile';
          }

          return <TabIcon focused={focused} iconName={iconName} label={label} />;
        },
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.background.primary,
          borderTopColor: COLORS.border.light,
          borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
          height: Platform.OS === 'ios' ? 80 : 70,
          paddingBottom: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
          paddingTop: SPACING.sm,
          ...SHADOWS.light,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Capture" component={AppStack} />
      <Tab.Screen 
        name="Gallery" 
        component={PlaceholderScreen}
        initialParams={{ title: 'Photo Gallery' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={PlaceholderScreen}
        initialParams={{ title: 'Profile & Settings' }}
      />
    </Tab.Navigator>
  );
};

// Placeholder Screen Component for future features
const PlaceholderScreen = ({ route }) => {
  const { title = 'Coming Soon' } = route.params || {};
  
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderSubtitle}>
        This feature will be available in a future update
      </Text>
    </View>
  );
};

// Main Navigation Container
const Navigation = () => {
  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
};

// Enhanced Custom Header Component with accessibility
export const CustomHeader = ({ title, showBack = true, onBackPress, rightComponent }) => {
  return (
    <View style={styles.customHeader}>
      <View style={styles.headerLeft}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={ACCESSIBILITY.labels.back}
            accessibilityHint="Navigate to the previous screen"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backButtonText}>
              {Platform.OS === 'ios' ? '←' : '←'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Text 
        style={styles.headerTitle}
        accessible={true}
        accessibilityRole="header"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
      
      <View style={styles.headerRight}>
        {rightComponent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Enhanced Tab Navigation Styles
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    minHeight: ACCESSIBILITY.touchTargetSize,
    minWidth: ACCESSIBILITY.touchTargetSize,
  },
  
  tabIconText: {
    fontSize: Platform.OS === 'ios' ? 26 : 24,
    marginBottom: SPACING.xs,
  },
  
  tabIconFocused: {
    transform: [{ scale: Platform.OS === 'ios' ? 1.1 : 1.05 }],
  },
  
  tabLabel: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.caption.fontWeight,
    letterSpacing: TYPOGRAPHY.caption.letterSpacing,
  },
  
  tabLabelFocused: {
    color: COLORS.primary[500],
    fontWeight: '600',
  },

  // Enhanced Placeholder Screen Styles
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxl,
    backgroundColor: COLORS.background.primary,
  },
  
  placeholderTitle: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    letterSpacing: TYPOGRAPHY.h2.letterSpacing,
  },
  
  placeholderSubtitle: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.body1.lineHeight,
    maxWidth: 280,
  },

  // Enhanced Custom Header Styles
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    minHeight: Platform.OS === 'ios' ? 44 : 56, // Platform-specific heights
  },
  
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  
  headerTitle: {
    fontSize: TYPOGRAPHY.h4.fontSize,
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    color: COLORS.text.primary,
    textAlign: 'center',
    letterSpacing: TYPOGRAPHY.h4.letterSpacing,
    flex: 2,
  },
  
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  
  backButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    minHeight: ACCESSIBILITY.touchTargetSize,
    minWidth: ACCESSIBILITY.touchTargetSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  backButtonText: {
    fontSize: Platform.OS === 'ios' ? 28 : 24,
    color: COLORS.primary[500],
    fontWeight: Platform.OS === 'ios' ? '300' : 'normal',
  },
});

export default Navigation;