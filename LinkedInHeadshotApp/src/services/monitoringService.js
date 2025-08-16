/**
 * COMPREHENSIVE MONITORING & PERFORMANCE METRICS SERVICE
 * 
 * Provides real-time monitoring, performance tracking, and analytics for the
 * LinkedIn Headshot app. Features comprehensive metrics collection, performance
 * analysis, user experience tracking, and business intelligence.
 * 
 * Features:
 * - Real-time performance monitoring
 * - User experience analytics
 * - AI transformation success tracking
 * - Business metrics and KPIs
 * - Error rate monitoring
 * - Resource usage tracking
 * - User journey analytics
 * 
 * @author LinkedIn Headshot App Team
 * @version 2.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Performance thresholds and SLAs
const PERFORMANCE_THRESHOLDS = {
  // Processing time thresholds (milliseconds)
  EXCELLENT_PROCESSING_TIME: 15000,    // 15 seconds
  GOOD_PROCESSING_TIME: 30000,         // 30 seconds
  ACCEPTABLE_PROCESSING_TIME: 45000,   // 45 seconds
  
  // Success rate thresholds
  EXCELLENT_SUCCESS_RATE: 0.95,        // 95%
  GOOD_SUCCESS_RATE: 0.90,             // 90%
  ACCEPTABLE_SUCCESS_RATE: 0.85,       // 85%
  
  // Quality thresholds
  EXCELLENT_QUALITY_SCORE: 9.0,
  GOOD_QUALITY_SCORE: 8.0,
  ACCEPTABLE_QUALITY_SCORE: 7.0,
  
  // User experience thresholds
  EXCELLENT_USER_SATISFACTION: 4.5,    // Out of 5
  GOOD_USER_SATISFACTION: 4.0,
  ACCEPTABLE_USER_SATISFACTION: 3.5,
  
  // Business metrics
  TARGET_CONVERSION_RATE: 0.15,        // 15% free to paid
  TARGET_RETENTION_RATE: 0.60,         // 60% 7-day retention
  TARGET_NPS_SCORE: 50                 // Net Promoter Score
};

// Event types for tracking
const EVENT_TYPES = {
  // User journey events
  APP_LAUNCH: 'app_launch',
  PHOTO_CAPTURE: 'photo_capture',
  PHOTO_UPLOAD: 'photo_upload',
  STYLE_SELECTION: 'style_selection',
  TRANSFORMATION_START: 'transformation_start',
  TRANSFORMATION_COMPLETE: 'transformation_complete',
  RESULT_VIEW: 'result_view',
  IMAGE_DOWNLOAD: 'image_download',
  
  // AI processing events
  AI_TIER_1_START: 'ai_tier_1_start',
  AI_TIER_1_SUCCESS: 'ai_tier_1_success',
  AI_TIER_1_FAILURE: 'ai_tier_1_failure',
  AI_TIER_2_START: 'ai_tier_2_start',
  AI_TIER_2_SUCCESS: 'ai_tier_2_success',
  AI_TIER_2_FAILURE: 'ai_tier_2_failure',
  AI_FALLBACK_LOCAL: 'ai_fallback_local',
  QUALITY_VALIDATION: 'quality_validation',
  
  // Business events
  FREE_USAGE: 'free_usage',
  UPGRADE_PROMPT: 'upgrade_prompt',
  SUBSCRIPTION_START: 'subscription_start',
  USER_FEEDBACK: 'user_feedback',
  
  // Error events
  ERROR_NETWORK: 'error_network',
  ERROR_PROCESSING: 'error_processing',
  ERROR_VALIDATION: 'error_validation',
  ERROR_CRITICAL: 'error_critical'
};

class MonitoringService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.events = [];
    this.metrics = new Map();
    this.performanceData = [];
    this.userJourneyData = [];
    this.businessMetrics = new Map();
    
    // Real-time counters
    this.counters = {
      totalSessions: 0,
      successfulTransformations: 0,
      failedTransformations: 0,
      premiumAIUsage: 0,
      localFallbackUsage: 0,
      qualityValidations: 0,
      userFeedbackSubmissions: 0
    };
    
    console.log(`📊 MonitoringService initialized - Session: ${this.sessionId}`);
    this.initializeMonitoring();
  }

  /**
   * MAIN EVENT TRACKING METHOD
   * Records events with comprehensive context
   */
  async trackEvent(eventType, data = {}, customProperties = {}) {
    const eventId = this.generateEventId();
    const timestamp = Date.now();
    
    try {
      const eventData = {
        id: eventId,
        type: eventType,
        timestamp,
        sessionId: this.sessionId,
        sessionTime: timestamp - this.sessionStart,
        data: {
          ...data,
          platform: 'react-native',
          appVersion: '2.0.0',
          ...customProperties
        },
        context: {
          userAgent: data.userAgent || 'unknown',
          networkType: data.networkType || 'unknown',
          batteryLevel: data.batteryLevel || null,
          memoryUsage: data.memoryUsage || null
        }
      };
      
      // Add to events array
      this.events.push(eventData);
      
      // Update real-time counters
      this.updateCounters(eventType, eventData);
      
      // Update business metrics
      await this.updateBusinessMetrics(eventType, eventData);
      
      // Check for performance alerts
      await this.checkPerformanceAlerts(eventType, eventData);
      
      console.log(`📈 [${eventId}] Event tracked: ${eventType}`);
      
      // Persist critical events
      if (this.isCriticalEvent(eventType)) {
        await this.persistEvent(eventData);
      }
      
      // Clean up old events to prevent memory issues
      if (this.events.length > 1000) {
        this.events = this.events.slice(-500);
      }
      
      return eventId;
      
    } catch (error) {
      console.error('Event tracking failed:', error);
      return null;
    }
  }

  /**
   * Track AI transformation performance
   */
  async trackAITransformation(transformationData) {
    const {
      requestId,
      styleTemplate,
      tier,
      processingTime,
      success,
      qualityScore,
      transformationType,
      modelUsed
    } = transformationData;
    
    try {
      // Track main transformation event
      await this.trackEvent(success ? EVENT_TYPES.TRANSFORMATION_COMPLETE : 'transformation_failed', {
        requestId,
        styleTemplate,
        tier,
        processingTime,
        qualityScore,
        transformationType,
        modelUsed,
        success
      });
      
      // Track tier-specific success/failure
      if (tier) {
        const tierEvent = success ? 
          `${tier.toLowerCase()}_success` : 
          `${tier.toLowerCase()}_failure`;
        await this.trackEvent(tierEvent, transformationData);
      }
      
      // Update performance metrics
      this.updatePerformanceMetrics(transformationData);
      
      // Track quality validation if available
      if (qualityScore) {
        await this.trackEvent(EVENT_TYPES.QUALITY_VALIDATION, {
          requestId,
          qualityScore,
          styleTemplate,
          passed: qualityScore >= 8.0
        });
      }
      
    } catch (error) {
      console.error('AI transformation tracking failed:', error);
    }
  }

  /**
   * Track user journey progression
   */
  async trackUserJourney(step, data = {}) {
    const journeyData = {
      step,
      timestamp: Date.now(),
      sessionTime: Date.now() - this.sessionStart,
      ...data
    };
    
    this.userJourneyData.push(journeyData);
    
    // Track as event
    await this.trackEvent(step, journeyData);
    
    // Analyze journey patterns
    this.analyzeUserJourney();
    
    console.log(`🗺️ User journey: ${step}`);
  }

  /**
   * Track business metrics and KPIs
   */
  async trackBusinessMetric(metricName, value, properties = {}) {
    try {
      const metricData = {
        name: metricName,
        value,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        properties
      };
      
      // Update business metrics map
      if (!this.businessMetrics.has(metricName)) {
        this.businessMetrics.set(metricName, []);
      }
      
      const metricHistory = this.businessMetrics.get(metricName);
      metricHistory.push(metricData);
      
      // Keep only last 100 values per metric
      if (metricHistory.length > 100) {
        metricHistory.splice(0, metricHistory.length - 100);
      }
      
      console.log(`💰 Business metric: ${metricName} = ${value}`);
      
      // Check for business alerts
      await this.checkBusinessAlerts(metricName, value, properties);
      
    } catch (error) {
      console.error('Business metric tracking failed:', error);
    }
  }

  /**
   * Track performance metrics
   */
  updatePerformanceMetrics(data) {
    const { processingTime, success, tier, qualityScore } = data;
    
    const performanceEntry = {
      timestamp: Date.now(),
      processingTime,
      success,
      tier,
      qualityScore,
      performance: this.calculatePerformanceLevel(processingTime),
      quality: this.calculateQualityLevel(qualityScore)
    };
    
    this.performanceData.push(performanceEntry);
    
    // Keep only last 200 performance entries
    if (this.performanceData.length > 200) {
      this.performanceData.shift();
    }
    
    // Update aggregated metrics
    this.updateAggregatedMetrics(performanceEntry);
  }

  /**
   * Calculate performance level
   */
  calculatePerformanceLevel(processingTime) {
    if (processingTime <= PERFORMANCE_THRESHOLDS.EXCELLENT_PROCESSING_TIME) return 'EXCELLENT';
    if (processingTime <= PERFORMANCE_THRESHOLDS.GOOD_PROCESSING_TIME) return 'GOOD';
    if (processingTime <= PERFORMANCE_THRESHOLDS.ACCEPTABLE_PROCESSING_TIME) return 'ACCEPTABLE';
    return 'POOR';
  }

  /**
   * Calculate quality level
   */
  calculateQualityLevel(qualityScore) {
    if (!qualityScore) return 'UNKNOWN';
    if (qualityScore >= PERFORMANCE_THRESHOLDS.EXCELLENT_QUALITY_SCORE) return 'EXCELLENT';
    if (qualityScore >= PERFORMANCE_THRESHOLDS.GOOD_QUALITY_SCORE) return 'GOOD';
    if (qualityScore >= PERFORMANCE_THRESHOLDS.ACCEPTABLE_QUALITY_SCORE) return 'ACCEPTABLE';
    return 'POOR';
  }

  /**
   * Update real-time counters
   */
  updateCounters(eventType, eventData) {
    switch (eventType) {
      case EVENT_TYPES.APP_LAUNCH:
        this.counters.totalSessions++;
        break;
      case EVENT_TYPES.TRANSFORMATION_COMPLETE:
        if (eventData.data.success) {
          this.counters.successfulTransformations++;
          if (eventData.data.tier && eventData.data.tier.includes('TIER_1')) {
            this.counters.premiumAIUsage++;
          }
        } else {
          this.counters.failedTransformations++;
        }
        break;
      case EVENT_TYPES.AI_FALLBACK_LOCAL:
        this.counters.localFallbackUsage++;
        break;
      case EVENT_TYPES.QUALITY_VALIDATION:
        this.counters.qualityValidations++;
        break;
      case EVENT_TYPES.USER_FEEDBACK:
        this.counters.userFeedbackSubmissions++;
        break;
    }
  }

  /**
   * Update business metrics based on events
   */
  async updateBusinessMetrics(eventType, eventData) {
    try {
      switch (eventType) {
        case EVENT_TYPES.TRANSFORMATION_COMPLETE:
          if (eventData.data.success) {
            await this.trackBusinessMetric('successful_transformations', 1, {
              styleTemplate: eventData.data.styleTemplate,
              tier: eventData.data.tier,
              processingTime: eventData.data.processingTime
            });
          }
          break;
          
        case EVENT_TYPES.FREE_USAGE:
          await this.trackBusinessMetric('free_usage_count', 1);
          break;
          
        case EVENT_TYPES.UPGRADE_PROMPT:
          await this.trackBusinessMetric('upgrade_prompts', 1);
          break;
          
        case EVENT_TYPES.IMAGE_DOWNLOAD:
          await this.trackBusinessMetric('image_downloads', 1);
          break;
      }
    } catch (error) {
      console.error('Business metrics update failed:', error);
    }
  }

  /**
   * Check for performance alerts
   */
  async checkPerformanceAlerts(eventType, eventData) {
    try {
      // Check processing time alerts
      if (eventData.data.processingTime > PERFORMANCE_THRESHOLDS.ACCEPTABLE_PROCESSING_TIME) {
        console.warn(`⚠️ Slow processing detected: ${eventData.data.processingTime}ms`);
        await this.triggerAlert('SLOW_PROCESSING', {
          processingTime: eventData.data.processingTime,
          threshold: PERFORMANCE_THRESHOLDS.ACCEPTABLE_PROCESSING_TIME,
          eventData
        });
      }
      
      // Check success rate
      const recentSuccessRate = this.calculateRecentSuccessRate();
      if (recentSuccessRate < PERFORMANCE_THRESHOLDS.ACCEPTABLE_SUCCESS_RATE) {
        console.warn(`⚠️ Low success rate: ${(recentSuccessRate * 100).toFixed(1)}%`);
        await this.triggerAlert('LOW_SUCCESS_RATE', {
          successRate: recentSuccessRate,
          threshold: PERFORMANCE_THRESHOLDS.ACCEPTABLE_SUCCESS_RATE
        });
      }
      
    } catch (error) {
      console.error('Performance alert check failed:', error);
    }
  }

  /**
   * Check for business alerts
   */
  async checkBusinessAlerts(metricName, value, properties) {
    try {
      // Example business alerts
      if (metricName === 'error_rate' && value > 0.15) { // 15% error rate
        await this.triggerAlert('HIGH_ERROR_RATE', { errorRate: value, properties });
      }
      
      if (metricName === 'user_satisfaction' && value < PERFORMANCE_THRESHOLDS.ACCEPTABLE_USER_SATISFACTION) {
        await this.triggerAlert('LOW_USER_SATISFACTION', { satisfaction: value, properties });
      }
      
    } catch (error) {
      console.error('Business alert check failed:', error);
    }
  }

  /**
   * Calculate recent success rate
   */
  calculateRecentSuccessRate() {
    const recentTransformations = this.performanceData.slice(-20); // Last 20
    if (recentTransformations.length === 0) return 1.0;
    
    const successes = recentTransformations.filter(t => t.success).length;
    return successes / recentTransformations.length;
  }

  /**
   * Analyze user journey patterns
   */
  analyzeUserJourney() {
    try {
      const journeySteps = this.userJourneyData.slice(-10); // Last 10 steps
      if (journeySteps.length < 2) return;
      
      // Calculate step conversion rates
      const stepCounts = {};
      journeySteps.forEach(step => {
        stepCounts[step.step] = (stepCounts[step.step] || 0) + 1;
      });
      
      // Find common drop-off points
      const dropOffAnalysis = this.identifyDropOffPoints(journeySteps);
      
      if (dropOffAnalysis.highDropOff.length > 0) {
        console.warn('📉 High drop-off detected at:', dropOffAnalysis.highDropOff);
      }
      
    } catch (error) {
      console.error('User journey analysis failed:', error);
    }
  }

  /**
   * Identify drop-off points in user journey
   */
  identifyDropOffPoints(journeySteps) {
    const stepSequence = ['photo_capture', 'style_selection', 'transformation_start', 'transformation_complete', 'result_view', 'image_download'];
    const stepCounts = {};
    
    journeySteps.forEach(step => {
      stepCounts[step.step] = (stepCounts[step.step] || 0) + 1;
    });
    
    const highDropOff = [];
    const lowDropOff = [];
    
    for (let i = 0; i < stepSequence.length - 1; i++) {
      const currentStep = stepSequence[i];
      const nextStep = stepSequence[i + 1];
      
      const currentCount = stepCounts[currentStep] || 0;
      const nextCount = stepCounts[nextStep] || 0;
      
      if (currentCount > 0) {
        const conversionRate = nextCount / currentCount;
        if (conversionRate < 0.5) { // 50% drop-off threshold
          highDropOff.push(`${currentStep} -> ${nextStep}`);
        } else if (conversionRate > 0.8) { // 80% retention
          lowDropOff.push(`${currentStep} -> ${nextStep}`);
        }
      }
    }
    
    return { highDropOff, lowDropOff };
  }

  /**
   * Update aggregated metrics
   */
  updateAggregatedMetrics(performanceEntry) {
    const timeWindow = 'last_hour';
    const windowKey = `${timeWindow}_${Math.floor(Date.now() / (60 * 60 * 1000))}`;
    
    if (!this.metrics.has(windowKey)) {
      this.metrics.set(windowKey, {
        totalTransformations: 0,
        successfulTransformations: 0,
        totalProcessingTime: 0,
        qualityScores: [],
        tierUsage: {}
      });
    }
    
    const windowMetrics = this.metrics.get(windowKey);
    windowMetrics.totalTransformations++;
    
    if (performanceEntry.success) {
      windowMetrics.successfulTransformations++;
    }
    
    windowMetrics.totalProcessingTime += performanceEntry.processingTime;
    
    if (performanceEntry.qualityScore) {
      windowMetrics.qualityScores.push(performanceEntry.qualityScore);
    }
    
    if (performanceEntry.tier) {
      windowMetrics.tierUsage[performanceEntry.tier] = 
        (windowMetrics.tierUsage[performanceEntry.tier] || 0) + 1;
    }
  }

  /**
   * Trigger monitoring alerts
   */
  async triggerAlert(alertType, data) {
    const alert = {
      type: alertType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data,
      severity: this.getAlertSeverity(alertType)
    };
    
    console.warn(`🚨 MONITORING ALERT [${alertType}]:`, data);
    
    // In production, this would send to monitoring services (DataDog, New Relic, etc.)
    await this.logAlert(alert);
  }

  /**
   * Log alerts for persistence
   */
  async logAlert(alert) {
    try {
      const alerts = await AsyncStorage.getItem('monitoring_alerts') || '[]';
      const alertsList = JSON.parse(alerts);
      
      alertsList.push(alert);
      
      // Keep only last 50 alerts
      if (alertsList.length > 50) {
        alertsList.splice(0, alertsList.length - 50);
      }
      
      await AsyncStorage.setItem('monitoring_alerts', JSON.stringify(alertsList));
    } catch (error) {
      console.error('Alert logging failed:', error);
    }
  }

  /**
   * Get alert severity level
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      'SLOW_PROCESSING': 'WARNING',
      'LOW_SUCCESS_RATE': 'ERROR',
      'HIGH_ERROR_RATE': 'CRITICAL',
      'LOW_USER_SATISFACTION': 'WARNING',
      'SYSTEM_FAILURE': 'CRITICAL'
    };
    
    return severityMap[alertType] || 'INFO';
  }

  /**
   * Initialize monitoring system
   */
  async initializeMonitoring() {
    try {
      // Track app launch
      await this.trackEvent(EVENT_TYPES.APP_LAUNCH, {
        sessionId: this.sessionId,
        timestamp: this.sessionStart
      });
      
      // Load persisted counters
      const persistedCounters = await AsyncStorage.getItem('monitoring_counters');
      if (persistedCounters) {
        const counters = JSON.parse(persistedCounters);
        Object.assign(this.counters, counters);
      }
      
      // Set up periodic data persistence
      this.setupPeriodicPersistence();
      
      console.log('📊 Monitoring system initialized successfully');
      
    } catch (error) {
      console.error('Monitoring initialization failed:', error);
    }
  }

  /**
   * Set up periodic data persistence
   */
  setupPeriodicPersistence() {
    // Persist counters every 5 minutes
    setInterval(async () => {
      try {
        await AsyncStorage.setItem('monitoring_counters', JSON.stringify(this.counters));
      } catch (error) {
        console.error('Counter persistence failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Check if event is critical and should be persisted
   */
  isCriticalEvent(eventType) {
    const criticalEvents = [
      EVENT_TYPES.ERROR_CRITICAL,
      EVENT_TYPES.SUBSCRIPTION_START,
      EVENT_TYPES.USER_FEEDBACK,
      'transformation_failed'
    ];
    
    return criticalEvents.includes(eventType);
  }

  /**
   * Persist critical events
   */
  async persistEvent(eventData) {
    try {
      const criticalEvents = await AsyncStorage.getItem('critical_events') || '[]';
      const eventsList = JSON.parse(criticalEvents);
      
      eventsList.push(eventData);
      
      // Keep only last 100 critical events
      if (eventsList.length > 100) {
        eventsList.shift();
      }
      
      await AsyncStorage.setItem('critical_events', JSON.stringify(eventsList));
    } catch (error) {
      console.error('Event persistence failed:', error);
    }
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate event ID
   */
  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get comprehensive monitoring dashboard data
   */
  getMonitoringDashboard() {
    const recentPerformance = this.performanceData.slice(-50);
    const recentEvents = this.events.slice(-100);
    
    return {
      session: {
        id: this.sessionId,
        duration: Date.now() - this.sessionStart,
        startTime: this.sessionStart
      },
      
      counters: { ...this.counters },
      
      performance: {
        recent: recentPerformance,
        averageProcessingTime: recentPerformance.reduce((sum, p) => sum + p.processingTime, 0) / recentPerformance.length || 0,
        successRate: this.calculateRecentSuccessRate(),
        averageQualityScore: this.calculateAverageQualityScore(recentPerformance),
        performanceLevels: this.getPerformanceLevelDistribution(recentPerformance)
      },
      
      userJourney: {
        steps: this.userJourneyData.slice(-20),
        dropOffAnalysis: this.identifyDropOffPoints(this.userJourneyData.slice(-50))
      },
      
      businessMetrics: Object.fromEntries(this.businessMetrics),
      
      events: {
        total: this.events.length,
        recent: recentEvents,
        byType: this.getEventsByType(recentEvents)
      },
      
      alerts: {
        thresholds: PERFORMANCE_THRESHOLDS,
        recentAlerts: this.getRecentAlerts()
      }
    };
  }

  /**
   * Calculate average quality score
   */
  calculateAverageQualityScore(performanceData) {
    const withQuality = performanceData.filter(p => p.qualityScore);
    if (withQuality.length === 0) return 0;
    
    return withQuality.reduce((sum, p) => sum + p.qualityScore, 0) / withQuality.length;
  }

  /**
   * Get performance level distribution
   */
  getPerformanceLevelDistribution(performanceData) {
    const distribution = { EXCELLENT: 0, GOOD: 0, ACCEPTABLE: 0, POOR: 0 };
    
    performanceData.forEach(p => {
      distribution[p.performance] = (distribution[p.performance] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * Get events by type
   */
  getEventsByType(events) {
    const byType = {};
    
    events.forEach(event => {
      byType[event.type] = (byType[event.type] || 0) + 1;
    });
    
    return byType;
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts() {
    try {
      const alerts = await AsyncStorage.getItem('monitoring_alerts') || '[]';
      const alertsList = JSON.parse(alerts);
      return alertsList.slice(-10); // Last 10 alerts
    } catch (error) {
      console.error('Failed to get recent alerts:', error);
      return [];
    }
  }

  /**
   * Export monitoring data for analysis
   */
  exportMonitoringData() {
    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.sessionStart,
      events: this.events,
      performanceData: this.performanceData,
      userJourneyData: this.userJourneyData,
      counters: this.counters,
      businessMetrics: Object.fromEntries(this.businessMetrics),
      exportTimestamp: Date.now()
    };
  }
}

// Export singleton instance
export default new MonitoringService();