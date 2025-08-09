import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

const StyleSelector = ({ navigation, route }) => {
  const { image } = route.params || {};
  const [selectedStyle, setSelectedStyle] = useState('corporate');

  const styles_data = [
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'Professional business attire, clean background',
      preview: require('../../../assets/style-previews/corporate.png'),
      popular: true,
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Smart casual, modern background, approachable',
      preview: require('../../../assets/style-previews/creative.png'),
      popular: false,
    },
    {
      id: 'executive',
      name: 'Executive',
      description: 'Formal business suit, premium lighting',
      preview: require('../../../assets/style-previews/executive.png'),
      popular: false,
    },
    {
      id: 'startup',
      name: 'Startup',
      description: 'Business casual, clean minimal background',
      preview: require('../../../assets/style-previews/startup.png'),
      popular: true,
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      description: 'Medical professional, trustworthy appearance',
      preview: require('../../../assets/style-previews/healthcare.png'),
      popular: false,
    },
  ];

  const handleStyleSelect = (styleId) => {
    setSelectedStyle(styleId);
  };

  const proceedToProcessing = () => {
    navigation.navigate('ProcessingScreen', {
      image,
      selectedStyle,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Style</Text>
          <Text style={styles.subtitle}>
            Select the professional style that best fits your industry
          </Text>
        </View>

        <View style={styles.stylesGrid}>
          {styles_data.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleCard,
                selectedStyle === style.id && styles.selectedStyleCard,
              ]}
              onPress={() => handleStyleSelect(style.id)}
              activeOpacity={0.7}
            >
              {style.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>POPULAR</Text>
                </View>
              )}
              
              <View style={styles.stylePreview}>
                {/* Placeholder for style preview image */}
                <View style={styles.previewPlaceholder}>
                  <Text style={styles.previewText}>{style.name}</Text>
                </View>
              </View>

              <View style={styles.styleInfo}>
                <Text style={styles.styleName}>{style.name}</Text>
                <Text style={styles.styleDescription}>{style.description}</Text>
              </View>

              {selectedStyle === style.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={proceedToProcessing}
          activeOpacity={0.7}
        >
          <Text style={styles.continueButtonText}>
            Generate Headshots
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
  },
  stylesGrid: {
    marginBottom: 30,
  },
  styleCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedStyleCard: {
    borderColor: '#0A66C2',
    backgroundColor: '#EBF3FD',
  },
  popularBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  popularText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stylePreview: {
    height: 120,
    marginBottom: 15,
  },
  previewPlaceholder: {
    flex: 1,
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
  },
  styleInfo: {
    flex: 1,
  },
  styleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 5,
  },
  styleDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#0A66C2',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#0A66C2',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default StyleSelector;