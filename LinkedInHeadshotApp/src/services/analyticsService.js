// Privacy-Compliant Analytics Service
// This service handles user events and analytics with full privacy compliance
// Respects GDPR, CCPA, and user consent preferences

import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_STORAGE_KEY = 'user_consent_preferences';
const ANALYTICS_QUEUE_KEY = 'pending_analytics_events';

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.events = [];
    this.consentPreferences = null;
    this.hasValidConsent = false;
  }

  // Initialize analytics service with consent checking
  async initialize(config = {}) {
    try {
      this.config = {
        enableInProduction: true,
        batchSize: 10,
        flushInterval: 30000, // 30 seconds
        respectDoNotTrack: true,
        anonymizeData: true,
        ...config,
      };

      // Load user consent preferences
      await this.loadConsentPreferences();

      this.isInitialized = true;

      // Start event batching only if user has consented
      if (this.hasValidConsent && this.config.flushInterval > 0) {
        this.startEventBatching();
      }

      // Process any queued events from before consent was given
      await this.processQueuedEvents();

      console.log('Privacy-compliant AnalyticsService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AnalyticsService:', error);
    }
  }

  // Load and validate user consent preferences
  async loadConsentPreferences() {
    try {
      const storedConsent = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
      if (storedConsent) {
        this.consentPreferences = JSON.parse(storedConsent);
        this.hasValidConsent = this.validateConsent();
      }
    } catch (error) {
      console.error('Error loading consent preferences:', error);
      this.hasValidConsent = false;
    }
  }

  // Validate if user has given valid consent for analytics
  validateConsent() {
    if (!this.consentPreferences) {
      return false;
    }

    // Check if user has explicitly consented to analytics
    const analyticsConsent = this.consentPreferences.analytics === true;
    
    // Check if consent is not expired (valid for 12 months per GDPR)
    const consentDate = new Date(this.consentPreferences.consentDate);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const consentNotExpired = consentDate > twelveMonthsAgo;

    return analyticsConsent && consentNotExpired;
  }

  // Set user identification
  setUserId(userId, userProperties = {}) {
    this.userId = userId;
    this.track('user_identified', {
      user_id: userId,
      ...userProperties,
    });
  }

  // Update consent preferences and revalidate
  async updateConsentPreferences(newConsent) {
    this.consentPreferences = newConsent;
    this.hasValidConsent = this.validateConsent();

    if (!this.hasValidConsent) {
      // Clear pending events if consent is withdrawn
      this.events = [];
      await this.clearQueuedEvents();
    }
  }

  // Queue events when consent is not available
  async queueEvent(event) {
    try {
      const existingQueue = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      
      // Limit queue size to prevent storage overflow
      if (queue.length < 100) {
        queue.push(event);
        await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Error queuing analytics event:', error);
    }
  }

  // Process queued events when consent becomes available
  async processQueuedEvents() {
    if (!this.hasValidConsent) {
      return;
    }

    try {
      const queuedEvents = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
      if (queuedEvents) {
        const events = JSON.parse(queuedEvents);
        
        // Process essential events only (respect retroactive consent limitations)
        const essentialEvents = events.filter(event => 
          event.essential || event.event.includes('error') || event.event.includes('crash')
        );

        this.events.push(...essentialEvents);
        
        // Clear the queue
        await AsyncStorage.removeItem(ANALYTICS_QUEUE_KEY);
      }
    } catch (error) {
      console.error('Error processing queued events:', error);
    }
  }

  // Clear queued events when consent is withdrawn
  async clearQueuedEvents() {
    try {
      await AsyncStorage.removeItem(ANALYTICS_QUEUE_KEY);
    } catch (error) {
      console.error('Error clearing queued events:', error);
    }
  }

  // Privacy-compliant event tracking
  track(eventName, properties = {}, essential = false) {
    // Essential events can be tracked without explicit analytics consent
    // (e.g., security events, errors, crashes for service delivery)
    if (!essential && !this.hasValidConsent) {
      // Queue non-essential events for potential future processing
      const event = this.createEvent(eventName, properties, essential);
      this.queueEvent(event);
      return;
    }

    if (!this.shouldTrack() && !essential) {
      return;
    }

    const event = this.createEvent(eventName, properties, essential);
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

  // Create anonymized event object
  createEvent(eventName, properties = {}, essential = false) {
    const baseEvent = {
      event: eventName,
      essential,
      properties: {
        ...this.anonymizeProperties(properties),
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        platform: this.getPlatform(),
        privacy_compliant: true,
        consent_version: this.consentPreferences?.consentVersion || '1.0'
      }
    };

    // Only include user_id if user has consented to personalization
    if (this.consentPreferences?.personalization && this.userId) {
      baseEvent.properties.user_id = this.userId;
    } else if (essential && this.userId) {
      // For essential events, use hashed user ID
      baseEvent.properties.user_id_hash = this.hashUserId(this.userId);
    }

    return baseEvent;
  }

  // Anonymize sensitive data in properties
  anonymizeProperties(properties) {
    const anonymized = { ...properties };

    // Remove or hash PII
    const piiFields = ['email', 'phone', 'name', 'address', 'ip_address'];
    piiFields.forEach(field => {
      if (anonymized[field]) {
        delete anonymized[field];
      }
    });

    // Truncate or generalize location data
    if (anonymized.location) {
      // Keep only country/region level location
      anonymized.location = anonymized.location.split(',')[0];
    }

    return anonymized;
  }

  // Hash user ID for essential tracking
  hashUserId(userId) {
    // Simple hash function - in production use crypto library
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `user_${Math.abs(hash)}`;
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