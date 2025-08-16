/**
 * OmniShot Home Screen
 * Main entry point for creating professional photos
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import DesignSystem from '../utils/omnishotDesignSystem';

const { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } = DesignSystem;

const RECENT_STYLES = [
  { id: 'executive', name: 'Executive', color: COLORS.professional.executive },
  { id: 'creative', name: 'Creative', color: COLORS.professional.creative },
  { id: 'tech', name: 'Tech', color: COLORS.professional.tech },
];

const POPULAR_PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', color: COLORS.platform.linkedin, icon: 'linkedin' },
  { id: 'instagram', name: 'Instagram', color: COLORS.platform.instagram, icon: 'instagram' },
  { id: 'facebook', name: 'Facebook', color: COLORS.platform.facebook, icon: 'facebook' },
  { id: 'twitter', name: 'Twitter', color: COLORS.platform.twitter, icon: 'twitter' },
];

const OmnishotHomeScreen = ({ navigation }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(COLORS.background.primary);
    }
  }, []);

  const handleCameraPress = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.9,
      includeBase64: false,
      maxWidth: 2000,
      maxHeight: 2000,
    };

    launchCamera(options, (response) => {
      if (response.didCancel || response.error) return;
      
      if (response.assets && response.assets[0]) {
        const photo = response.assets[0];
        setSelectedPhoto(photo);
        navigateToStyleSelection(photo);
      }
    });
  };

  const handleGalleryPress = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.9,
      includeBase64: false,
      maxWidth: 2000,
      maxHeight: 2000,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.error) return;
      
      if (response.assets && response.assets[0]) {
        const photo = response.assets[0];
        setSelectedPhoto(photo);
        navigateToStyleSelection(photo);
      }
    });
  };

  const navigateToStyleSelection = (photo) => {
    navigation.navigate('StyleSelection', { photo });
  };

  const handleQuickStart = (style) => {
    if (!selectedPhoto) {
      Alert.alert(
        'Photo Required',
        'Please take or upload a photo first to use quick start.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    navigation.navigate('PlatformSelection', { 
      photo: selectedPhoto, 
      preselectedStyle: style 
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.logoText}>OmniShot</Text>
        <Text style={styles.tagline}>Every Platform. Every Time. Every You.</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.premiumBadge}
        onPress={() => navigation.navigate('Premium')}
        accessibilityLabel="Upgrade to premium"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[COLORS.semantic.processing, COLORS.secondary[500]]}
          style={styles.premiumBadgeGradient}
        >
          <Icon name="star" size={SIZES.icon.sm} color={COLORS.text.inverse} />
          <Text style={styles.premiumText}>Pro</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderPhotoActions = () => (
    <View style={styles.photoActions}>
      <Text style={styles.sectionTitle}>Start Creating</Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={handleCameraPress}
          accessibilityLabel="Take photo with camera"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[COLORS.secondary[500], COLORS.secondary[600]]}
            style={styles.primaryActionGradient}
          >
            <Icon name="camera" size={SIZES.icon.lg} color={COLORS.text.inverse} />
            <Text style={styles.primaryActionText}>Take Photo</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={handleGalleryPress}
          accessibilityLabel="Upload photo from gallery"
          accessibilityRole="button"
        >
          <Icon name="image" size={SIZES.icon.md} color={COLORS.secondary[500]} />
          <Text style={styles.secondaryActionText}>Upload Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQuickStart = () => (
    <View style={styles.quickStart}>
      <Text style={styles.sectionTitle}>Quick Start</Text>
      <Text style={styles.sectionSubtitle}>
        Choose a professional style to get started quickly
      </Text>
      
      <View style={styles.styleGrid}>
        {RECENT_STYLES.map((style) => (
          <TouchableOpacity
            key={style.id}
            style={[styles.styleCard, { borderColor: style.color }]}
            onPress={() => handleQuickStart(style)}
            accessibilityLabel={`Quick start with ${style.name} style`}
            accessibilityRole="button"
          >
            <View style={[styles.styleIcon, { backgroundColor: style.color + '20' }]}>
              <View style={[styles.styleIconDot, { backgroundColor: style.color }]} />
            </View>
            <Text style={styles.styleCardText}>{style.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPopularPlatforms = () => (
    <View style={styles.popularPlatforms}>
      <Text style={styles.sectionTitle}>Popular Platforms</Text>
      <Text style={styles.sectionSubtitle}>
        Most used platforms by professionals
      </Text>
      
      <View style={styles.platformGrid}>
        {POPULAR_PLATFORMS.map((platform) => (
          <View key={platform.id} style={styles.platformCard}>
            <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
              <View style={[styles.platformIconDot, { backgroundColor: platform.color }]} />
            </View>
            <Text style={styles.platformCardText}>{platform.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRecentPhotos = () => (
    <View style={styles.recentPhotos}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Photos</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Gallery')}
          accessibilityLabel="View all recent photos"
          accessibilityRole="button"
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.photoGrid}>
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.photoPlaceholder}>
            <Icon name="image" size={SIZES.icon.lg} color={COLORS.neutral[400]} />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderPhotoActions()}
        {renderQuickStart()}
        {renderPopularPlatforms()}
        {renderRecentPhotos()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.subtle,
  },
  
  headerContent: {
    flex: 1,
  },
  
  logoText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary[500],
    fontWeight: 'bold',
  },
  
  tagline: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  
  premiumBadge: {
    borderRadius: RADIUS.full,
    ...SHADOWS.soft,
  },
  
  premiumBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  
  premiumText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  
  photoActions: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  
  sectionSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  
  viewAllText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.secondary[500],
    fontWeight: '500',
  },
  
  actionButtons: {
    gap: SPACING.md,
  },
  
  primaryAction: {
    borderRadius: RADIUS.lg,
    ...SHADOWS.medium,
  },
  
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    gap: SPACING.md,
    minHeight: SIZES.button.large,
  },
  
  primaryActionText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.inverse,
    fontWeight: '600',
    fontSize: 18,
  },
  
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.secondary[500],
    backgroundColor: COLORS.background.primary,
    gap: SPACING.md,
    minHeight: SIZES.button.large,
  },
  
  secondaryActionText: {
    ...TYPOGRAPHY.button,
    color: COLORS.secondary[500],
    fontWeight: '600',
    fontSize: 18,
  },
  
  quickStart: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  
  styleGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  
  styleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    backgroundColor: COLORS.background.secondary,
  },
  
  styleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  
  styleIconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  
  styleCardText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  popularPlatforms: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  
  platformCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background.secondary,
  },
  
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  
  platformIconDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  
  platformCardText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  recentPhotos: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  
  photoGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  
  photoPlaceholder: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OmnishotHomeScreen;