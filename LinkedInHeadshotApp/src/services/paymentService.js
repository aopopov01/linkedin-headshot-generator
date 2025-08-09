// Payment Service using RevenueCat for in-app purchases and subscriptions
import Purchases from 'react-native-purchases';

class PaymentService {
  constructor() {
    this.isInitialized = false;
    this.offerings = null;
    this.customerInfo = null;
  }

  // Initialize RevenueCat
  async initialize() {
    try {
      // Note: Replace with actual RevenueCat API keys
      const apiKey = __DEV__ 
        ? 'your_dev_api_key_here' 
        : 'your_prod_api_key_here';

      await Purchases.configure({ apiKey });
      
      // Set debug logs for development
      if (__DEV__) {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.VERBOSE);
      }

      this.isInitialized = true;
      console.log('PaymentService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PaymentService:', error);
      throw error;
    }
  }

  // Get available offerings/products
  async getOfferings() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const offerings = await Purchases.getOfferings();
      this.offerings = offerings;
      
      return {
        current: offerings.current,
        all: offerings.all,
      };
    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw error;
    }
  }

  // Purchase a product
  async purchaseProduct(productIdentifier) {
    try {
      const purchaseResult = await Purchases.purchaseProduct(productIdentifier);
      
      this.customerInfo = purchaseResult.customerInfo;
      
      return {
        transaction: purchaseResult.transaction,
        customerInfo: purchaseResult.customerInfo,
        success: true,
      };
    } catch (error) {
      if (error.userCancelled) {
        return {
          success: false,
          cancelled: true,
          error: 'Purchase was cancelled by user',
        };
      }
      
      console.error('Purchase failed:', error);
      return {
        success: false,
        cancelled: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  // Purchase a subscription package
  async purchasePackage(packageObj) {
    try {
      const purchaseResult = await Purchases.purchasePackage(packageObj);
      
      this.customerInfo = purchaseResult.customerInfo;
      
      return {
        transaction: purchaseResult.transaction,
        customerInfo: purchaseResult.customerInfo,
        success: true,
      };
    } catch (error) {
      if (error.userCancelled) {
        return {
          success: false,
          cancelled: true,
          error: 'Purchase was cancelled by user',
        };
      }
      
      console.error('Package purchase failed:', error);
      return {
        success: false,
        cancelled: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  // Restore previous purchases
  async restorePurchases() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      
      return {
        success: true,
        customerInfo,
      };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore purchases',
      };
    }
  }

  // Get customer info
  async getCustomerInfo() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;
      
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  // Check if user has active entitlement
  hasActiveEntitlement(entitlementKey) {
    if (!this.customerInfo) {
      return false;
    }

    const entitlement = this.customerInfo.entitlements.active[entitlementKey];
    return entitlement && entitlement.isActive;
  }

  // Check if user has premium access
  hasPremiumAccess() {
    return this.hasActiveEntitlement('premium') || 
           this.hasActiveEntitlement('unlimited_photos');
  }

  // Get remaining photo credits for user
  getRemainingPhotos() {
    if (!this.customerInfo) {
      return 0;
    }

    // Check for unlimited access first
    if (this.hasPremiumAccess()) {
      return 999; // Unlimited
    }

    // Check for photo packages
    const packageEntitlements = ['photos_5', 'photos_10', 'photos_25'];
    let totalPhotos = 0;

    packageEntitlements.forEach(key => {
      if (this.hasActiveEntitlement(key)) {
        switch (key) {
          case 'photos_5':
            totalPhotos += 5;
            break;
          case 'photos_10':
            totalPhotos += 10;
            break;
          case 'photos_25':
            totalPhotos += 25;
            break;
        }
      }
    });

    return totalPhotos;
  }

  // Set user attributes for analytics
  async setUserAttributes(attributes) {
    try {
      await Purchases.setAttributes(attributes);
    } catch (error) {
      console.error('Failed to set user attributes:', error);
    }
  }

  // Identify user
  async identifyUser(userId) {
    try {
      await Purchases.logIn(userId);
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;
      
      return customerInfo;
    } catch (error) {
      console.error('Failed to identify user:', error);
      throw error;
    }
  }

  // Log out user
  async logOutUser() {
    try {
      const customerInfo = await Purchases.logOut();
      this.customerInfo = customerInfo;
      
      return customerInfo;
    } catch (error) {
      console.error('Failed to log out user:', error);
      throw error;
    }
  }

  // Get product pricing information
  getProductPrice(product) {
    if (!product) return null;
    
    return {
      price: product.price,
      priceString: product.priceString,
      currencyCode: product.currencyCode,
    };
  }

  // Check if purchase is pending
  hasPendingPurchases() {
    if (!this.customerInfo) {
      return false;
    }

    return Object.keys(this.customerInfo.nonSubscriptionTransactions).length > 0;
  }

  // Format entitlements for display
  formatEntitlements() {
    if (!this.customerInfo) {
      return [];
    }

    return Object.entries(this.customerInfo.entitlements.active).map(([key, entitlement]) => ({
      key,
      identifier: entitlement.identifier,
      isActive: entitlement.isActive,
      willRenew: entitlement.willRenew,
      periodType: entitlement.periodType,
      latestPurchaseDate: entitlement.latestPurchaseDate,
      expirationDate: entitlement.expirationDate,
    }));
  }
}

// Export singleton instance
export default new PaymentService();