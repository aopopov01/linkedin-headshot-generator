// Analytics Service for user behavior tracking
// This service handles user events and analytics using a flexible approach

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.events = [];
  }

  // Initialize analytics service
  async initialize(config = {}) {
    try {
      this.isInitialized = true;
      this.config = {
        enableInProduction: true,
        batchSize: 10,
        flushInterval: 30000, // 30 seconds
        ...config,
      };

      // Start event batching
      if (this.config.flushInterval > 0) {
        this.startEventBatching();
      }

      console.log('AnalyticsService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AnalyticsService:', error);
    }
  }

  // Set user identification
  setUserId(userId, userProperties = {}) {
    this.userId = userId;
    this.track('user_identified', {
      user_id: userId,
      ...userProperties,
    });
  }

  // Track user events
  track(eventName, properties = {}) {
    if (!this.shouldTrack()) {
      return;
    }

    const event = {
      event: eventName,
      properties: {
        ...properties,
        session_id: this.sessionId,
        user_id: this.userId,
        timestamp: new Date().toISOString(),
        platform: this.getPlatform(),
      },
    };

    this.events.push(event);

    // Log in development
    if (__DEV__) {
      console.log('Analytics Event:', event);
    }

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Track screen views
  trackScreen(screenName, properties = {}) {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  // Track user registration/signup
  trackSignup(method = 'email', properties = {}) {
    this.track('user_signup', {
      signup_method: method,
      ...properties,
    });
  }

  // Track purchases
  trackPurchase(productId, price, currency = 'USD', properties = {}) {
    this.track('purchase_completed', {
      product_id: productId,
      price,
      currency,
      revenue: price,
      ...properties,
    });
  }

  // Track subscription events
  trackSubscription(action, planId, properties = {}) {
    this.track(`subscription_${action}`, {
      plan_id: planId,
      ...properties,
    });
  }

  // Track photo generation events
  trackPhotoGeneration(style, numPhotos, processingTime, properties = {}) {
    this.track('photo_generated', {
      style_template: style,
      num_photos: numPhotos,
      processing_time_seconds: processingTime,
      ...properties,
    });
  }

  // Track photo downloads
  trackPhotoDownload(photoId, style, properties = {}) {
    this.track('photo_downloaded', {
      photo_id: photoId,
      style_template: style,
      ...properties,
    });
  }

  // Track sharing events
  trackShare(platform, contentType, properties = {}) {
    this.track('content_shared', {
      platform,
      content_type: contentType,
      ...properties,
    });
  }

  // Track errors
  trackError(error, context = {}) {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_context: context,
    });
  }

  // Track user journey milestones
  trackMilestone(milestone, properties = {}) {
    const milestones = {
      onboarding_started: 'User started onboarding',
      first_photo_captured: 'User captured their first photo',
      first_style_selected: 'User selected their first style',
      first_generation_started: 'User started their first photo generation',
      first_photo_downloaded: 'User downloaded their first photo',
      first_purchase: 'User made their first purchase',
      subscription_started: 'User started subscription',
    };

    this.track('milestone_reached', {
      milestone_name: milestone,
      milestone_description: milestones[milestone],
      ...properties,
    });
  }

  // Set user properties
  setUserProperties(properties) {
    this.track('user_properties_updated', properties);
  }

  // Track timing events
  timeEvent(eventName) {
    const startTime = Date.now();
    
    return {
      end: (properties = {}) => {
        const duration = Date.now() - startTime;
        this.track(eventName, {
          duration_ms: duration,
          ...properties,
        });
      },
    };
  }

  // Flush events to analytics service
  async flush() {
    if (this.events.length === 0) {
      return;
    }

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // In a real implementation, send to your analytics backend
      // Example: await this.sendToAnalytics(eventsToSend);
      
      if (__DEV__) {
        console.log('Flushing analytics events:', eventsToSend);
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-add events to queue on failure
      this.events.unshift(...eventsToSend);
    }
  }

  // Start automatic event batching
  startEventBatching() {
    setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  // Helper methods
  shouldTrack() {
    return this.isInitialized && (this.config.enableInProduction || __DEV__);
  }

  getPlatform() {
    // This would typically use react-native's Platform detection
    return 'mobile'; // Simplified for now
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Reset session (useful for new app launches)
  resetSession() {
    this.sessionId = this.generateSessionId();
    this.track('session_started');
  }

  // Get analytics summary for debugging
  getAnalyticsSummary() {
    return {
      isInitialized: this.isInitialized,
      userId: this.userId,
      sessionId: this.sessionId,
      pendingEvents: this.events.length,
      config: this.config,
    };
  }
}

// Export singleton instance
export default new AnalyticsService();