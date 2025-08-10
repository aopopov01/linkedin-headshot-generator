import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';

const PaymentScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState('package_5');

  const pricingPlans = [
    {
      id: 'package_5',
      name: '5 Photos Package',
      price: '$4.99',
      description: 'Perfect for getting started',
      features: [
        '5 professional headshots',
        'Multiple style options',
        'High-resolution downloads',
        'LinkedIn optimized sizing',
      ],
      popular: true,
    },
    {
      id: 'package_10',
      name: '10 Photos Package',
      price: '$7.99',
      description: 'Best value for variety',
      features: [
        '10 professional headshots',
        'All style templates',
        'High-resolution downloads',
        'LinkedIn optimized sizing',
        'Priority processing',
      ],
      popular: false,
    },
    {
      id: 'package_25',
      name: '25 Photos Package',
      price: '$14.99',
      description: 'Professional package',
      features: [
        '25 professional headshots',
        'All premium styles',
        'High-resolution downloads',
        'Multiple formats (LinkedIn, resume)',
        'Priority processing',
        'Email support',
      ],
      popular: false,
    },
    {
      id: 'monthly_sub',
      name: 'Monthly Unlimited',
      price: '$9.99/month',
      description: 'Unlimited photos monthly',
      features: [
        'Unlimited photo generations',
        'All premium styles',
        'Priority processing',
        'Multiple export formats',
        'Email support',
        'Cancel anytime',
      ],
      popular: false,
    },
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handlePurchase = () => {
    const selectedPlanData = pricingPlans.find(plan => plan.id === selectedPlan);
    
    Alert.alert(
      'Confirm Purchase',
      `You're about to purchase: ${selectedPlanData.name} for ${selectedPlanData.price}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Purchase', onPress: processPurchase },
      ]
    );
  };

  const processPurchase = () => {
    // In a real app, this would integrate with RevenueCat/App Store
    Alert.alert(
      'Purchase Successful!',
      'Your purchase has been processed. You can now generate professional headshots!',
      [
        { 
          text: 'Start Creating', 
          onPress: () => navigation.navigate('PhotoCapture') 
        },
      ]
    );
  };

  const handleRestorePurchases = () => {
    Alert.alert(
      'Restore Purchases',
      'Checking for previous purchases...',
      [{ text: 'OK' }]
    );
  };

  const openTermsOfService = () => {
    // In production, open terms URL in browser
    Alert.alert(
      'Terms of Service',
      'Opening Terms of Service...',
      [{ text: 'OK' }]
    );
  };

  const openPrivacyPolicy = () => {
    // In production, open privacy policy URL in browser
    Alert.alert(
      'Privacy Policy', 
      'Opening Privacy Policy...',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Package</Text>
          <Text style={styles.subtitle}>
            Get professional headshots that boost your career
          </Text>
        </View>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Why upgrade?</Text>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>📈</Text>
            <Text style={styles.benefitText}>
              LinkedIn profiles with professional photos get 14x more views
            </Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>
              Get results in 30 seconds vs weeks with traditional photography
            </Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>💰</Text>
            <Text style={styles.benefitText}>
              Save $200-500 compared to professional photography sessions
            </Text>
          </View>
        </View>

        <View style={styles.plansContainer}>
          {pricingPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlanCard,
              ]}
              onPress={() => handlePlanSelect(plan.id)}
              activeOpacity={0.7}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.feature}>
                    <Text style={styles.featureIcon}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {selectedPlan === plan.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          activeOpacity={0.7}
        >
          <Text style={styles.purchaseButtonText}>
            Purchase Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          activeOpacity={0.7}
        >
          <Text style={styles.restoreButtonText}>
            Restore Previous Purchases
          </Text>
        </TouchableOpacity>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By purchasing, you agree to our{' '}
            <Text style={styles.linkText} onPress={() => openTermsOfService()}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.linkText} onPress={() => openPrivacyPolicy()}>
              Privacy Policy
            </Text>.{'\n\n'}
            
            {selectedPlan === 'monthly_sub' && (
              <>Payment will be charged to your iTunes Account or Google Play Store account at confirmation of purchase. 
              Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period. 
              Account will be charged for renewal within 24-hours prior to the end of the current period. 
              Subscriptions may be managed by the user and auto-renewal may be turned off by going to the user's Account Settings after purchase. 
              Any unused portion of a free trial period, if offered, will be forfeited when the user purchases a subscription to that publication.{'\n\n'}
              </>
            )}
            
            Prices are in US Dollars and may vary in countries other than the U.S. and are subject to change without notice.{'\n\n'}
            
            For customer support, email us at support@linkedinheadshots.com or use the support feature in app settings.
          </Text>
        </View>
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
  benefitsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
    textAlign: 'center',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 25,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#34495E',
    lineHeight: 20,
  },
  plansContainer: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#0A66C2',
    backgroundColor: '#F8FBFF',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    marginBottom: 15,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A66C2',
    marginBottom: 5,
  },
  planDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  featuresContainer: {
    marginBottom: 10,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    color: '#27AE60',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    width: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#34495E',
  },
  selectedIndicator: {
    backgroundColor: '#0A66C2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  selectedBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  purchaseButton: {
    backgroundColor: '#0A66C2',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreButtonText: {
    color: '#0A66C2',
    fontSize: 16,
    fontWeight: '500',
  },
  termsContainer: {
    paddingHorizontal: 10,
  },
  termsText: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    fontSize: 12,
    color: '#0A66C2',
    textDecorationLine: 'underline',
  },
});

export default PaymentScreen;