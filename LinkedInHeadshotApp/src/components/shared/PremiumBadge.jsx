import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const PremiumBadge = ({ 
  type = 'icon', // 'icon', 'banner', 'button'
  size = 'medium', // 'small', 'medium', 'large'
  onPress = null,
  showText = true,
  style = {},
  textStyle = {},
}) => {
  const getBadgeStyles = () => {
    const sizeStyles = {
      small: {
        container: styles.small,
        text: styles.textSmall,
      },
      medium: {
        container: styles.medium,
        text: styles.textMedium,
      },
      large: {
        container: styles.large,
        text: styles.textLarge,
      },
    };

    const typeStyles = {
      icon: styles.iconType,
      banner: styles.bannerType,
      button: styles.buttonType,
    };

    return {
      container: [
        styles.base,
        sizeStyles[size]?.container,
        typeStyles[type],
        style,
      ],
      text: [
        styles.baseText,
        sizeStyles[size]?.text,
        textStyle,
      ],
    };
  };

  const badgeStyles = getBadgeStyles();

  const BadgeContent = () => (
    <View style={badgeStyles.container}>
      <Text style={styles.crown}>👑</Text>
      {showText && (
        <Text style={badgeStyles.text}>
          {type === 'banner' ? 'PREMIUM FEATURE' : 'PRO'}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <BadgeContent />
      </TouchableOpacity>
    );
  }

  return <BadgeContent />;
};

// Premium Banner Component (full width)
export const PremiumBanner = ({ 
  message = 'Unlock all premium styles and unlimited generations',
  actionText = 'Upgrade Now',
  onActionPress,
  style = {},
}) => {
  return (
    <View style={[styles.premiumBanner, style]}>
      <View style={styles.bannerContent}>
        <View style={styles.bannerLeft}>
          <Text style={styles.crown}>👑</Text>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Premium</Text>
            <Text style={styles.bannerMessage}>{message}</Text>
          </View>
        </View>
        
        {onActionPress && (
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={onActionPress}
            activeOpacity={0.7}
          >
            <Text style={styles.bannerButtonText}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Premium Feature Lock Component
export const PremiumLock = ({ 
  title = 'Premium Feature',
  description = 'Upgrade to unlock this feature',
  onUpgradePress,
}) => {
  return (
    <View style={styles.premiumLock}>
      <View style={styles.lockIcon}>
        <Text style={styles.lockEmoji}>🔒</Text>
      </View>
      
      <Text style={styles.lockTitle}>{title}</Text>
      <Text style={styles.lockDescription}>{description}</Text>
      
      {onUpgradePress && (
        <TouchableOpacity
          style={styles.lockButton}
          onPress={onUpgradePress}
          activeOpacity={0.7}
        >
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.lockButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base badge styles
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F39C12',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  
  baseText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 4,
  },

  crown: {
    fontSize: 14,
  },

  // Size variations
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },

  textSmall: {
    fontSize: 10,
  },

  textMedium: {
    fontSize: 12,
  },

  textLarge: {
    fontSize: 14,
  },

  // Type variations
  iconType: {
    minWidth: 'auto',
  },

  bannerType: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  buttonType: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },

  // Premium Banner styles
  premiumBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    padding: 16,
    margin: 16,
  },

  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  bannerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },

  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },

  bannerMessage: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 18,
  },

  bannerButton: {
    backgroundColor: '#F39C12',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 12,
  },

  bannerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Premium Lock styles
  premiumLock: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
  },

  lockIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#E9ECEF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  lockEmoji: {
    fontSize: 24,
  },

  lockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },

  lockDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },

  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F39C12',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },

  lockButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PremiumBadge;