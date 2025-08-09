import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

// Import screens
import PhotoCapture from '../camera/PhotoCapture';
import StyleSelector from '../ai/StyleSelector';
import ProcessingScreen from '../ai/ProcessingScreen';
import ResultsGallery from '../ai/ResultsGallery';
import PaymentScreen from '../profile/PaymentScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Component
const TabIcon = ({ focused, iconName, label }) => {
  const icons = {
    capture: focused ? '📷' : '📷',
    gallery: focused ? '🖼️' : '🖼️',
    profile: focused ? '👤' : '👤',
  };

  return (
    <View style={styles.tabIcon}>
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
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        },
        headerTintColor: '#2C3E50',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        cardStyle: { backgroundColor: '#ffffff' },
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
          backgroundColor: '#ffffff',
          borderTopColor: '#E9ECEF',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
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

// Custom Header Components
export const CustomHeader = ({ title, showBack = true, onBackPress, rightComponent }) => {
  return (
    <View style={styles.customHeader}>
      <View style={styles.headerLeft}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      <View style={styles.headerRight}>
        {rightComponent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Tab Navigation Styles
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  
  tabIconText: {
    fontSize: 24,
    marginBottom: 4,
  },
  
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  
  tabLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  
  tabLabelFocused: {
    color: '#0A66C2',
    fontWeight: '600',
  },

  // Placeholder Screen Styles
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
  },
  
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  placeholderSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Custom Header Styles
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  
  backButtonText: {
    fontSize: 24,
    color: '#0A66C2',
    fontWeight: 'bold',
  },
});

export default Navigation;