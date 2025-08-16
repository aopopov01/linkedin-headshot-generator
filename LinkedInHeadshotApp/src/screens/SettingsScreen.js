/**
 * OmniShot Settings Screen
 * App settings, preferences, and privacy controls
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import DesignSystem from '../utils/omnishotDesignSystem';

const { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } = DesignSystem;

const SETTINGS_SECTIONS = [
  {
    title: 'Photo Generation',
    items: [
      { 
        type: 'select',
        icon: 'image',
        label: 'Default Quality',
        description: 'Default photo quality for generations',
        value: 'High',
        options: ['Standard', 'High', 'Ultra HD'],
        setting: 'defaultQuality'
      },
      {
        type: 'toggle',
        icon: 'save',
        label: 'Auto-save to Gallery',
        description: 'Automatically save generated photos',
        value: true,
        setting: 'autoSave'
      },
      {
        type: 'toggle',
        icon: 'download-cloud',
        label: 'Auto-download',
        description: 'Download photos immediately after generation',
        value: false,
        setting: 'autoDownload'
      },
    ],
  },
  {
    title: 'Notifications',
    items: [
      {
        type: 'toggle',
        icon: 'bell',
        label: 'Push Notifications',
        description: 'Receive notifications about photo processing',
        value: true,
        setting: 'pushNotifications'
      },
      {
        type: 'toggle',
        icon: 'mail',
        label: 'Email Updates',
        description: 'Get updates about new features',
        value: true,
        setting: 'emailUpdates'
      },
      {
        type: 'toggle',
        icon: 'star',
        label: 'Marketing Messages',
        description: 'Promotional content and offers',
        value: false,
        setting: 'marketing'
      },
    ],
  },
  {
    title: 'Privacy & Security',
    items: [
      {
        type: 'toggle',
        icon: 'eye-off',
        label: 'Private Mode',
        description: 'Keep your photos private by default',
        value: true,
        setting: 'privateMode'
      },
      {
        type: 'toggle',
        icon: 'trash-2',
        label: 'Auto-delete Uploads',
        description: 'Delete original photos after processing',
        value: false,
        setting: 'autoDelete'
      },
      {
        type: 'action',
        icon: 'download',
        label: 'Download My Data',
        description: 'Export all your data from OmniShot',
        action: 'downloadData'
      },
      {
        type: 'action',
        icon: 'user-x',
        label: 'Delete Account',
        description: 'Permanently delete your account and data',
        action: 'deleteAccount',
        danger: true
      },
    ],
  },
  {
    title: 'App Preferences',
    items: [
      {
        type: 'select',
        icon: 'globe',
        label: 'Language',
        description: 'App display language',
        value: 'English',
        options: ['English', 'Spanish', 'French', 'German', 'Japanese'],
        setting: 'language'
      },
      {
        type: 'toggle',
        icon: 'moon',
        label: 'Dark Mode',
        description: 'Use dark theme throughout the app',
        value: false,
        setting: 'darkMode'
      },
      {
        type: 'toggle',
        icon: 'zap',
        label: 'Haptic Feedback',
        description: 'Vibrate on button presses',
        value: true,
        setting: 'haptics'
      },
    ],
  },
  {
    title: 'About',
    items: [
      {
        type: 'action',
        icon: 'info',
        label: 'App Version',
        description: 'Version 1.0.0 (Build 1)',
        action: 'version'
      },
      {
        type: 'action',
        icon: 'file-text',
        label: 'Terms of Service',
        description: 'Read our terms and conditions',
        action: 'terms'
      },
      {
        type: 'action',
        icon: 'shield',
        label: 'Privacy Policy',
        description: 'How we handle your data',
        action: 'privacy'
      },
      {
        type: 'action',
        icon: 'help-circle',
        label: 'Help & Support',
        description: 'Get help with using OmniShot',
        action: 'help'
      },
    ],
  },
];

const SettingsScreen = ({ navigation }) => {
  // Settings state - in real app this would be managed by context/redux
  const [settings, setSettings] = useState({
    defaultQuality: 'High',
    autoSave: true,
    autoDownload: false,
    pushNotifications: true,
    emailUpdates: true,
    marketing: false,
    privateMode: true,
    autoDelete: false,
    language: 'English',
    darkMode: false,
    haptics: true,
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectSetting = (setting, options, currentValue) => {
    Alert.alert(
      'Select Option',
      `Choose ${setting}:`,
      [
        ...options.map(option => ({
          text: option,
          onPress: () => updateSetting(setting, option),
          style: option === currentValue ? 'default' : 'default'
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleAction = (action) => {
    switch (action) {
      case 'downloadData':
        Alert.alert(
          'Download Data',
          'Your data export will be emailed to you within 24 hours.',
          [{ text: 'OK' }]
        );
        break;
      case 'deleteAccount':
        Alert.alert(
          'Delete Account',
          'This action cannot be undone. All your photos and data will be permanently deleted.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => {
              Alert.alert('Account Deleted', 'Your account has been deleted.');
            }}
          ]
        );
        break;
      case 'terms':
        Linking.openURL('https://omnishot.app/terms');
        break;
      case 'privacy':
        Linking.openURL('https://omnishot.app/privacy');
        break;
      case 'help':
        Linking.openURL('https://omnishot.app/help');
        break;
      case 'version':
        Alert.alert('OmniShot', 'Version 1.0.0\nBuild 1\n\n© 2024 OmniShot Inc.');
        break;
      default:
        Alert.alert('Coming Soon', 'This feature is coming soon!');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Settings</Text>
      
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderSettingItem = (item, sectionIndex, itemIndex) => {
    const key = `${sectionIndex}-${itemIndex}`;
    
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.settingItem,
          item.danger && styles.dangerItem,
        ]}
        onPress={() => {
          if (item.type === 'select') {
            handleSelectSetting(item.setting, item.options, settings[item.setting]);
          } else if (item.type === 'action') {
            handleAction(item.action);
          }
        }}
        disabled={item.type === 'toggle'}
        accessibilityRole={item.type === 'toggle' ? 'switch' : 'button'}
        accessibilityLabel={item.label}
      >
        <View style={styles.settingLeft}>
          <View style={[
            styles.settingIcon,
            item.danger && styles.dangerIcon,
          ]}>
            <Icon 
              name={item.icon} 
              size={18} 
              color={item.danger ? COLORS.semantic.error : COLORS.text.secondary} 
            />
          </View>
          
          <View style={styles.settingContent}>
            <Text style={[
              styles.settingLabel,
              item.danger && styles.dangerLabel,
            ]}>
              {item.label}
            </Text>
            <Text style={styles.settingDescription}>{item.description}</Text>
          </View>
        </View>
        
        <View style={styles.settingRight}>
          {item.type === 'toggle' ? (
            <Switch
              value={settings[item.setting]}
              onValueChange={(value) => updateSetting(item.setting, value)}
              trackColor={{ false: COLORS.neutral[300], true: COLORS.secondary[400] }}
              thumbColor={settings[item.setting] ? COLORS.secondary[500] : COLORS.neutral[500]}
              accessibilityLabel={`Toggle ${item.label}`}
            />
          ) : item.type === 'select' ? (
            <>
              <Text style={styles.settingValue}>{settings[item.setting] || item.value}</Text>
              <Icon name="chevron-right" size={16} color={COLORS.text.tertiary} />
            </>
          ) : (
            <Icon name="chevron-right" size={16} color={COLORS.text.tertiary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (section, sectionIndex) => (
    <View key={sectionIndex} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContent}>
        {section.items.map((item, itemIndex) => {
          const isLast = itemIndex === section.items.length - 1;
          return (
            <View key={itemIndex}>
              {renderSettingItem(item, sectionIndex, itemIndex)}
              {!isLast && <View style={styles.separator} />}
            </View>
          );
        })}
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
        {SETTINGS_SECTIONS.map((section, index) => renderSection(section, index))}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            OmniShot v1.0.0 • Made with ❤️ for professionals
          </Text>
        </View>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.subtle,
  },
  
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    flex: 1,
  },
  
  headerSpacer: {
    width: 40,
  },
  
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: SPACING.xxxl,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 13,
  },
  
  sectionContent: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  
  dangerItem: {
    backgroundColor: COLORS.semantic.error + '05',
  },
  
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  
  dangerIcon: {
    backgroundColor: COLORS.semantic.error + '20',
  },
  
  settingContent: {
    flex: 1,
  },
  
  settingLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  
  dangerLabel: {
    color: COLORS.semantic.error,
  },
  
  settingDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    lineHeight: 14,
  },
  
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  
  settingValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  separator: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginLeft: 52, // Align with text content
  },
  
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
});

export default SettingsScreen;