/**
 * OmniShot Profile Screen
 * User profile, subscription status, and account management
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import DesignSystem from '../utils/omnishotDesignSystem';

const { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } = DesignSystem;

const PROFILE_STATS = [
  { label: 'Photos Generated', value: '47', icon: 'image' },
  { label: 'Platforms Used', value: '6', icon: 'grid' },
  { label: 'Days Active', value: '23', icon: 'calendar' },
];

const PROFILE_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'user', label: 'Edit Profile', action: 'editProfile' },
      { icon: 'star', label: 'Upgrade to Premium', action: 'premium', highlight: true },
      { icon: 'credit-card', label: 'Billing & Payments', action: 'billing' },
      { icon: 'download', label: 'Download History', action: 'downloads' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'bell', label: 'Notifications', action: 'notifications', toggle: true, value: true },
      { icon: 'moon', label: 'Dark Mode', action: 'darkMode', toggle: true, value: false },
      { icon: 'globe', label: 'Language', action: 'language', value: 'English' },
      { icon: 'shield', label: 'Privacy Settings', action: 'privacy' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle', label: 'Help Center', action: 'help' },
      { icon: 'message-circle', label: 'Contact Support', action: 'support' },
      { icon: 'star', label: 'Rate OmniShot', action: 'rate' },
      { icon: 'share-2', label: 'Share with Friends', action: 'share' },
    ],
  },
];

const ProfileScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Mock user data
  const user = {
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    avatar: 'https://picsum.photos/150/150?random=user',
    joinDate: '2024-01-15',
    isPremium: false,
    subscription: null,
  };

  const handleItemPress = (action) => {
    switch (action) {
      case 'premium':
        navigation.navigate('Premium');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'editProfile':
        Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
        break;
      case 'billing':
        Alert.alert('Billing', 'Billing management coming soon!');
        break;
      case 'downloads':
        Alert.alert('Downloads', 'Download history coming soon!');
        break;
      case 'help':
        Alert.alert('Help', 'Help center opening soon!');
        break;
      case 'support':
        Alert.alert('Support', 'Contact support feature coming soon!');
        break;
      case 'rate':
        Alert.alert('Rate App', 'Thank you! App Store rating coming soon!');
        break;
      case 'share':
        Alert.alert('Share', 'Share feature coming soon!');
        break;
      default:
        Alert.alert('Coming Soon', 'This feature is coming soon!');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Profile</Text>
    </View>
  );

  const renderUserInfo = () => (
    <View style={styles.userSection}>
      <View style={styles.userInfo}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        
        <View style={styles.userDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user.name}</Text>
            {user.isPremium && (
              <LinearGradient
                colors={[COLORS.secondary[500], COLORS.primary[500]]}
                style={styles.premiumBadge}
              >
                <Icon name="star" size={12} color={COLORS.text.inverse} />
                <Text style={styles.premiumBadgeText}>PRO</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.joinDate}>
            Member since {new Date(user.joinDate).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>
      </View>
      
      {!user.isPremium && (
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => handleItemPress('premium')}
        >
          <LinearGradient
            colors={[COLORS.secondary[500], COLORS.secondary[600]]}
            style={styles.upgradeButtonGradient}
          >
            <Icon name="star" size={16} color={COLORS.text.inverse} />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Your Statistics</Text>
      <View style={styles.statsGrid}>
        {PROFILE_STATS.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Icon name={stat.icon} size={20} color={COLORS.secondary[500]} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderProfileSections = () => (
    <>
      {PROFILE_SECTIONS.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.sectionItem,
                  item.highlight && styles.highlightItem,
                ]}
                onPress={() => !item.toggle && handleItemPress(item.action)}
                disabled={item.toggle}
              >
                <View style={styles.itemLeft}>
                  <View style={[
                    styles.itemIcon,
                    item.highlight && styles.highlightIcon,
                  ]}>
                    <Icon 
                      name={item.icon} 
                      size={18} 
                      color={item.highlight ? COLORS.text.inverse : COLORS.text.secondary} 
                    />
                  </View>
                  <Text style={[
                    styles.itemLabel,
                    item.highlight && styles.highlightLabel,
                  ]}>
                    {item.label}
                  </Text>
                </View>
                
                <View style={styles.itemRight}>
                  {item.toggle ? (
                    <Switch
                      value={item.action === 'notifications' ? notifications : darkMode}
                      onValueChange={(value) => {
                        if (item.action === 'notifications') {
                          setNotifications(value);
                        } else if (item.action === 'darkMode') {
                          setDarkMode(value);
                        }
                      }}
                      trackColor={{ false: COLORS.neutral[300], true: COLORS.secondary[400] }}
                      thumbColor={
                        (item.action === 'notifications' ? notifications : darkMode)
                          ? COLORS.secondary[500] 
                          : COLORS.neutral[500]
                      }
                    />
                  ) : (
                    <>
                      {item.value && (
                        <Text style={styles.itemValue}>{item.value}</Text>
                      )}
                      <Icon name="chevron-right" size={16} color={COLORS.text.tertiary} />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </>
  );

  const renderSignOut = () => (
    <View style={styles.signOutSection}>
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => {
          Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive' },
            ]
          );
        }}
      >
        <Icon name="log-out" size={18} color={COLORS.semantic.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
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
        {renderUserInfo()}
        {renderStats()}
        {renderProfileSections()}
        {renderSignOut()}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.subtle,
  },
  
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
  },
  
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  
  userSection: {
    padding: SPACING.lg,
  },
  
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background.secondary,
    marginRight: SPACING.lg,
  },
  
  userDetails: {
    flex: 1,
  },
  
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  
  userName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },
  
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 2,
  },
  
  premiumBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
    fontSize: 9,
  },
  
  userEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  
  joinDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  
  upgradeButton: {
    borderRadius: RADIUS.md,
    ...SHADOWS.soft,
  },
  
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  
  upgradeButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  
  statsSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    marginVertical: SPACING.xs,
  },
  
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  section: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  
  sectionTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  
  sectionContent: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  
  highlightItem: {
    backgroundColor: COLORS.secondary[50],
  },
  
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  
  highlightIcon: {
    backgroundColor: COLORS.secondary[500],
  },
  
  itemLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    flex: 1,
  },
  
  highlightLabel: {
    fontWeight: '600',
    color: COLORS.secondary[700],
  },
  
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  
  itemValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
  },
  
  signOutSection: {
    paddingHorizontal: SPACING.lg,
  },
  
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.semantic.error,
    backgroundColor: COLORS.background.primary,
    gap: SPACING.sm,
  },
  
  signOutText: {
    ...TYPOGRAPHY.button,
    color: COLORS.semantic.error,
    fontWeight: '600',
  },
});

export default ProfileScreen;