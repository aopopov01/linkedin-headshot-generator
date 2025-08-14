import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const features = [
    {
      id: 'camera',
      icon: '📸',
      title: 'Take Photo',
      description: 'Capture a new photo for headshot generation',
      onPress: () => navigation.navigate('PhotoCapture'),
    },
    {
      id: 'gallery',
      icon: '🖼️',
      title: 'Choose from Gallery',
      description: 'Select an existing photo from your device',
      onPress: () => navigation.navigate('PhotoCapture', { source: 'gallery' }),
    },
    {
      id: 'styles',
      icon: '🎨',
      title: 'Style Templates',
      description: 'Browse professional headshot styles',
      onPress: () => navigation.navigate('StyleTemplates'),
    },
    {
      id: 'history',
      icon: '📋',
      title: 'My Headshots',
      description: 'View your generated headshots',
      onPress: () => navigation.navigate('HeadshotHistory'),
    },
    {
      id: 'payment',
      icon: '💳',
      title: 'Upgrade Plan',
      description: 'Access premium features and styles',
      onPress: () => navigation.navigate('Payment'),
    },
    {
      id: 'profile',
      icon: '👤',
      title: 'Profile',
      description: 'Manage your account and settings',
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LinkedIn Headshot</Text>
        <Text style={styles.subtitle}>AI-Powered Professional Photos</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeText}>
          Generate studio-quality professional headshots optimized for LinkedIn and career success.
        </Text>

        <View style={styles.featuresGrid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={feature.onPress}
              accessibilityLabel={feature.title}
              accessibilityHint={feature.description}
            >
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#0077B5',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#B3D4E8',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#0077B5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default HomeScreen;