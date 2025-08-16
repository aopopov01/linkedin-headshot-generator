/**
 * OmniShot App Navigation
 * Complete navigation structure for the multi-platform photo generation app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

import DesignSystem from '../utils/omnishotDesignSystem';

// Import screens
import OnboardingScreen from '../screens/OnboardingScreen';
import OmnishotHomeScreen from '../screens/OmnishotHomeScreen';
import StyleSelectionScreen from '../screens/StyleSelectionScreen';
import PlatformSelectionScreen from '../screens/PlatformSelectionScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import PremiumScreen from '../screens/PremiumScreen';

// Additional screens (placeholders for now)
import GalleryScreen from '../screens/GalleryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const { COLORS, TYPOGRAPHY, SPACING, RADIUS } = DesignSystem;

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main photo creation flow
const PhotoCreationStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      cardStyleInterpolator: ({ current, next, layouts }) => {
        return {
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
          overlayStyle: {
            opacity: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          },
        };
      },
    }}
  >
    <Stack.Screen name="Home" component={OmnishotHomeScreen} />
    <Stack.Screen name="StyleSelection" component={StyleSelectionScreen} />
    <Stack.Screen name="PlatformSelection" component={PlatformSelectionScreen} />
    <Stack.Screen name="ProcessingScreen" component={ProcessingScreen} />
    <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
    <Stack.Screen 
      name="Premium" 
      component={PremiumScreen}
      options={{
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.height, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    />
  </Stack.Navigator>
);

// Gallery screen with navigation
const GalleryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Gallery" component={GalleryScreen} />
    <Stack.Screen name="ResultsView" component={ResultsScreen} />
  </Stack.Navigator>
);

// Profile and settings stack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Premium" component={PremiumScreen} />
  </Stack.Navigator>
);

// Main tab navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, size }) => {
        let iconName;
        let iconColor = focused ? COLORS.secondary[500] : COLORS.neutral[500];

        switch (route.name) {
          case 'Create':
            iconName = 'camera';
            break;
          case 'GalleryTab':
            iconName = 'image';
            break;
          case 'ProfileTab':
            iconName = 'user';
            break;
          default:
            iconName = 'circle';
        }

        return <Icon name={iconName} size={size} color={iconColor} />;
      },
      tabBarActiveTintColor: COLORS.secondary[500],
      tabBarInactiveTintColor: COLORS.neutral[500],
      tabBarStyle: {
        backgroundColor: COLORS.background.primary,
        borderTopColor: COLORS.border.light,
        borderTopWidth: 1,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.md,
        height: 65,
        ...Platform.select({
          ios: {
            shadowColor: COLORS.neutral[900],
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          android: {
            elevation: 16,
          },
        }),
      },
      tabBarLabelStyle: {
        ...TYPOGRAPHY.caption,
        fontWeight: '500',
        marginTop: 2,
      },
      tabBarItemStyle: {
        paddingVertical: SPACING.xs,
      },
    })}
  >
    <Tab.Screen 
      name="Create" 
      component={PhotoCreationStack}
      options={{
        tabBarLabel: 'Create',
      }}
    />
    <Tab.Screen 
      name="GalleryTab" 
      component={GalleryStack}
      options={{
        tabBarLabel: 'Gallery',
      }}
    />
    <Tab.Screen 
      name="ProfileTab" 
      component={ProfileStack}
      options={{
        tabBarLabel: 'Profile',
      }}
    />
  </Tab.Navigator>
);

// Root navigation stack
const AppNavigation = () => {
  // In a real app, you'd check if user has completed onboarding
  const hasCompletedOnboarding = false; // This would come from storage/context

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: COLORS.secondary[500],
          background: COLORS.background.primary,
          card: COLORS.background.primary,
          text: COLORS.text.primary,
          border: COLORS.border.light,
          notification: COLORS.semantic.error,
        },
      }}
    >
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          gestureEnabled: true,
        }}
        initialRouteName={hasCompletedOnboarding ? 'MainApp' : 'Onboarding'}
      >
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{
            gestureEnabled: false, // Prevent swiping back during onboarding
          }}
        />
        <Stack.Screen name="MainApp" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;