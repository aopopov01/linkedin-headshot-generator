const Mixpanel = require('mixpanel');
const logger = require('../config/logger');
const db = require('../config/database');

class AnalyticsService {
  constructor() {
    this.mixpanel = null;
    this.enabled = false;
  }

  async initialize() {
    try {
      if (process.env.MIXPANEL_TOKEN) {
        this.mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN, {
          debug: process.env.NODE_ENV === 'development'
        });
        this.enabled = true;
        logger.info('Mixpanel analytics service initialized');
      } else {
        logger.warn('Mixpanel token not configured, analytics disabled');
      }
      
      return true;
    } catch (error) {
      logger.error('Analytics service initialization failed:', error);
      this.enabled = false;
      return false;
    }
  }

  /**
   * Track user event
   */
  async trackEvent(userId, eventName, properties = {}) {
    try {
      // Always store in database
      await this.storeEventInDatabase(userId, eventName, properties);

      // Send to Mixpanel if enabled
      if (this.enabled && this.mixpanel) {
        this.mixpanel.track(eventName, {
          distinct_id: userId,
          ...properties,
          timestamp: new Date().toISOString(),
          platform: 'backend_api'
        });
      }

      logger.debug('Event tracked:', {
        userId,
        eventName,
        properties: Object.keys(properties)
      });
    } catch (error) {
      logger.error('Failed to track event:', error);
      // Don't throw - analytics failures shouldn't break app functionality
    }
  }

  /**
   * Store event in database for backup and analysis
   */
  async storeEventInDatabase(userId, eventName, properties) {
    try {
      await db('analytics_events').insert({
        user_id: userId,
        event_name: eventName,
        properties: JSON.stringify(properties),
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Failed to store event in database:', error);
      throw error;
    }
  }

  /**
   * Track user registration
   */
  async trackUserRegistration(userId, registrationData = {}) {
    await this.trackEvent(userId, 'User Registered', {
      registration_method: registrationData.method || 'email',
      source: registrationData.source || 'app',
      ...registrationData
    });

    // Set user profile in Mixpanel
    if (this.enabled && this.mixpanel) {
      this.mixpanel.people.set(userId, {
        $email: registrationData.email,
        $created: new Date().toISOString(),
        registration_method: registrationData.method || 'email',
        platform: 'mobile_app'
      });
    }
  }

  /**
   * Track photo upload
   */
  async trackPhotoUpload(userId, photoData = {}) {
    await this.trackEvent(userId, 'Photo Uploaded', {
      file_size_mb: photoData.fileSize,
      image_type: photoData.imageType,
      upload_method: photoData.uploadMethod || 'camera',
      processing_time_ms: photoData.processingTime
    });
  }

  /**
   * Track AI generation request
   */
  async trackAIGeneration(userId, generationData = {}) {
    await this.trackEvent(userId, 'AI Generation Started', {
      style_template: generationData.styleTemplate,
      num_outputs: generationData.numOutputs || 4,
      estimated_cost: generationData.estimatedCost,
      user_credits_before: generationData.userCreditsBefore
    });
  }

  /**
   * Track AI generation completion
   */
  async trackAIGenerationComplete(userId, generationData = {}) {
    await this.trackEvent(userId, 'AI Generation Completed', {
      style_template: generationData.styleTemplate,
      num_outputs: generationData.numOutputs,
      processing_time_seconds: generationData.processingTime,
      success: generationData.success,
      error: generationData.error,
      actual_cost: generationData.actualCost
    });

    // Update user profile with generation stats
    if (this.enabled && this.mixpanel) {
      this.mixpanel.people.increment(userId, {
        total_generations: 1,
        [`generations_${generationData.styleTemplate}`]: 1
      });

      if (generationData.success) {
        this.mixpanel.people.increment(userId, 'successful_generations', 1);
      }
    }
  }

  /**
   * Track purchase events
   */
  async trackPurchaseStarted(userId, purchaseData = {}) {
    await this.trackEvent(userId, 'Purchase Started', {
      product_id: purchaseData.productId,
      price: purchaseData.price,
      currency: purchaseData.currency || 'usd',
      payment_method: purchaseData.paymentMethod || 'stripe'
    });
  }

  async trackPurchaseCompleted(userId, purchaseData = {}) {
    await this.trackEvent(userId, 'Purchase Completed', {
      product_id: purchaseData.productId,
      price: purchaseData.price,
      currency: purchaseData.currency || 'usd',
      payment_method: purchaseData.paymentMethod || 'stripe',
      credits_purchased: purchaseData.credits,
      transaction_id: purchaseData.transactionId
    });

    // Update user profile with purchase data
    if (this.enabled && this.mixpanel) {
      this.mixpanel.people.increment(userId, {
        total_purchases: 1,
        total_spent: purchaseData.price,
        total_credits_purchased: purchaseData.credits || 0
      });

      this.mixpanel.people.set(userId, {
        last_purchase_date: new Date().toISOString(),
        last_product_purchased: purchaseData.productId
      });
    }
  }

  /**
   * Track photo sharing
   */
  async trackPhotoShare(userId, shareData = {}) {
    await this.trackEvent(userId, 'Photo Shared', {
      platform: shareData.platform, // 'linkedin', 'instagram', 'download', etc.
      style_template: shareData.styleTemplate,
      share_method: shareData.shareMethod
    });
  }

  /**
   * Track app usage patterns
   */
  async trackSessionStart(userId, sessionData = {}) {
    await this.trackEvent(userId, 'Session Started', {
      platform: sessionData.platform || 'mobile',
      app_version: sessionData.appVersion,
      device_type: sessionData.deviceType,
      os_version: sessionData.osVersion
    });
  }

  async trackSessionEnd(userId, sessionData = {}) {
    await this.trackEvent(userId, 'Session Ended', {
      session_duration_minutes: sessionData.durationMinutes,
      photos_generated: sessionData.photosGenerated || 0,
      actions_taken: sessionData.actionsTaken || 0
    });
  }

  /**
   * Track errors and issues
   */
  async trackError(userId, errorData = {}) {
    await this.trackEvent(userId, 'Error Occurred', {
      error_type: errorData.errorType,
      error_message: errorData.errorMessage,
      error_code: errorData.errorCode,
      context: errorData.context,
      stack_trace: errorData.stackTrace?.substring(0, 500) // Limit stack trace length
    });
  }

  /**
   * Track user feedback
   */
  async trackFeedback(userId, feedbackData = {}) {
    await this.trackEvent(userId, 'Feedback Submitted', {
      rating: feedbackData.rating,
      feedback_type: feedbackData.type, // 'rating', 'bug_report', 'feature_request'
      feedback_text: feedbackData.text?.substring(0, 200), // Limit text length
      context: feedbackData.context
    });
  }

  /**
   * Get user analytics summary
   */
  async getUserAnalytics(userId, days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const events = await db('analytics_events')
        .where('user_id', userId)
        .where('created_at', '>=', since)
        .select('event_name', 'properties', 'created_at')
        .orderBy('created_at', 'desc');

      // Aggregate statistics
      const stats = {
        total_events: events.length,
        unique_event_types: [...new Set(events.map(e => e.event_name))].length,
        events_by_type: {},
        recent_activity: events.slice(0, 10),
        period_days: days
      };

      // Count events by type
      events.forEach(event => {
        stats.events_by_type[event.event_name] = 
          (stats.events_by_type[event.event_name] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  /**
   * Get application-wide analytics
   */
  async getApplicationAnalytics(days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [
        totalEvents,
        uniqueUsers,
        topEvents,
        dailyStats
      ] = await Promise.all([
        // Total events
        db('analytics_events')
          .where('created_at', '>=', since)
          .count('* as count')
          .first(),

        // Unique users
        db('analytics_events')
          .where('created_at', '>=', since)
          .countDistinct('user_id as count')
          .first(),

        // Top events
        db('analytics_events')
          .where('created_at', '>=', since)
          .select('event_name')
          .count('* as count')
          .groupBy('event_name')
          .orderBy('count', 'desc')
          .limit(10),

        // Daily statistics
        db.raw(`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as events,
            COUNT(DISTINCT user_id) as unique_users
          FROM analytics_events 
          WHERE created_at >= ?
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `, [since])
      ]);

      return {
        period_days: days,
        total_events: parseInt(totalEvents.count),
        unique_users: parseInt(uniqueUsers.count),
        top_events: topEvents,
        daily_stats: dailyStats.rows || dailyStats,
        average_events_per_user: totalEvents.count / uniqueUsers.count || 0
      };
    } catch (error) {
      logger.error('Failed to get application analytics:', error);
      throw error;
    }
  }

  /**
   * Create user funnel analysis
   */
  async getUserFunnel(days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const funnelSteps = [
        'User Registered',
        'Photo Uploaded', 
        'AI Generation Started',
        'AI Generation Completed',
        'Purchase Started',
        'Purchase Completed'
      ];

      const funnelData = {};

      for (const step of funnelSteps) {
        const count = await db('analytics_events')
          .where('event_name', step)
          .where('created_at', '>=', since)
          .countDistinct('user_id as count')
          .first();
        
        funnelData[step] = parseInt(count.count);
      }

      // Calculate conversion rates
      const totalUsers = funnelData['User Registered'] || 1;
      const conversions = {};
      
      funnelSteps.forEach(step => {
        conversions[step] = {
          users: funnelData[step],
          rate: ((funnelData[step] / totalUsers) * 100).toFixed(2) + '%'
        };
      });

      return {
        period_days: days,
        funnel_steps: conversions,
        total_registered_users: totalUsers
      };
    } catch (error) {
      logger.error('Failed to create user funnel:', error);
      throw error;
    }
  }

  /**
   * Identify user (for Mixpanel)
   */
  identifyUser(userId, userData = {}) {
    if (this.enabled && this.mixpanel) {
      this.mixpanel.people.set(userId, {
        $email: userData.email,
        $first_name: userData.firstName,
        $last_name: userData.lastName,
        ...userData
      });
    }
  }
}

module.exports = new AnalyticsService();