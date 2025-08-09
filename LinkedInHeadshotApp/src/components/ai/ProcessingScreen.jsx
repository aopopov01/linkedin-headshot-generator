import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';

const ProcessingScreen = ({ navigation, route }) => {
  const { image, selectedStyle } = route.params || {};
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [animatedValue] = useState(new Animated.Value(0));

  const steps = [
    'Analyzing your photo...',
    'Applying AI enhancements...',
    'Generating professional styles...',
    'Optimizing image quality...',
    'Finalizing your headshots...',
  ];

  useEffect(() => {
    const generateMockResults = () => {
      // Mock generated images - in real app these would come from AI service
      return [
        { id: 1, uri: 'mock-result-1.jpg', style: selectedStyle },
        { id: 2, uri: 'mock-result-2.jpg', style: selectedStyle },
        { id: 3, uri: 'mock-result-3.jpg', style: selectedStyle },
        { id: 4, uri: 'mock-result-4.jpg', style: selectedStyle },
      ];
    };

    // Simulate processing steps
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 20;
        
        if (newProgress <= 100) {
          setCurrentStep(Math.floor(newProgress / 20));
          
          // Animate progress bar
          Animated.timing(animatedValue, {
            toValue: newProgress,
            duration: 300,
            useNativeDriver: false,
          }).start();
          
          return newProgress;
        } else {
          clearInterval(interval);
          // Navigate to results after processing is complete
          setTimeout(() => {
            navigation.navigate('ResultsGallery', {
              originalImage: image,
              selectedStyle,
              generatedImages: generateMockResults(),
            });
          }, 1000);
          return 100;
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [animatedValue, image, navigation, selectedStyle]);



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Creating Your Headshots</Text>
          <Text style={styles.subtitle}>
            Our AI is generating professional {selectedStyle} style photos for you
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: animatedValue.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        <View style={styles.stepsContainer}>
          <Text style={styles.currentStepText}>
            {currentStep < steps.length ? steps[currentStep] : 'Complete!'}
          </Text>
          
          <View style={styles.stepsIndicator}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  index <= currentStep && styles.stepDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#0A66C2" />
        </View>

        <View style={styles.estimatedTimeContainer}>
          <Text style={styles.estimatedTimeText}>
            Estimated time remaining: {Math.max(0, 10 - Math.floor(progress / 10))}s
          </Text>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Pro Tip:</Text>
          <Text style={styles.tipsText}>
            While we generate your photos, consider how you'll use them - LinkedIn 
            profiles with professional headshots get 14x more profile views!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0A66C2',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  stepsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  currentStepText: {
    fontSize: 18,
    color: '#0A66C2',
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: '#0A66C2',
  },
  spinnerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  estimatedTimeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  estimatedTimeText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  tipsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0A66C2',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
});

export default ProcessingScreen;