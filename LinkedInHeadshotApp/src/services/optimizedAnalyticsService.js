/**
 * Optimized Analytics Service for Mobile App Performance
 * High-performance analytics with batching, compression, and intelligent queuing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/lib';
import { AppState } from 'react-native';

class OptimizedAnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.eventQueue = [];
    this.batchSize = 10;
    this.flushInterval = 30000; // 30 seconds
    this.maxQueueSize = 100;
    this.compressionThreshold = 5; // Compress if queue has >5 events
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    
    this.flushTimer = null;
    this.isOnline = true;
    this.isAppActive = true;
    
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    this.config = {
      enableInProduction: true,
      batchSize: 10,
      flushInterval: 30000,
      maxRetries: 3,
      compressionEnabled: true,
      persistEvents: true
    };

    this.performanceMetrics = {
      eventsProcessed: 0,
      batchesSent: 0,
      failedBatches: 0,
      averageBatchSize: 0,
      totalNetworkTime: 0,
      compressionRatio: 0
    };
  }

  /**
   * Initialize analytics service with optimizations
   */
  async initialize(config = {}) {
    if (this.isInitialized) {
      return;
    }

    this.config = { ...this.config, ...config };
    
    try {
      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Setup app state monitoring
      this.setupAppStateMonitoring();
      
      // Load persisted events
      await this.loadPersistedEvents();
      
      // Start periodic flush
      this.startPeriodicFlush();
      
      // Track initialization
      this.trackEvent('analytics_initialized', {
        config: this.config,
        sessionId: this.sessionId
      });

      this.isInitialized = true;
      console.log('📊 Optimized Analytics Service initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize analytics service:', error);
      throw error;
    }
  }

  /**
   * Track event with optimization
   */
  trackEvent(eventName, properties = {}, options = {}) {
    if (!this.isInitialized) {
      console.warn('Analytics service not initialized');
      return;
    }

    const event = {
      id: this.generateEventId(),
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        platform: 'mobile',
        appVersion: '1.0.0' // Get from app config
      },
      metadata: {
        queueTime: Date.now(),
        priority: options.priority || 'normal',
        persistent: options.persistent !== false
      }
    };

    this.addToQueue(event);
    
    // Immediate flush for high priority events
    if (options.priority === 'high' || options.immediate) {
      this.flush();
    }

    this.performanceMetrics.eventsProcessed++;
  }

  /**
   * Track screen view with performance metrics
   */
  trackScreenView(screenName, loadTime, additionalProperties = {}) {
    this.trackEvent('screen_view', {
      screenName,
      loadTime,
      ...additionalProperties
    });
  }

  /**
   * Track user interaction with timing
   */
  trackInteraction(action, element, responseTime = null) {
    this.trackEvent('user_interaction', {
      action,
      element,
      responseTime,
      interactionTime: Date.now()
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName, value, unit = 'ms') {
    this.trackEvent('performance_metric', {
      metricName,
      value,
      unit,
      sessionDuration: Date.now() - this.sessionStartTime
    });
  }

  /**
   * Track errors with context
   */
  trackError(error, context = {}) {
    const errorEvent = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: Date.now()
    };

    this.trackEvent('error', errorEvent, { 
      priority: 'high',
      immediate: true 
    });
  }

  /**
   * Add event to queue with intelligent management
   */
  addToQueue(event) {
    // Check queue size limit
    if (this.eventQueue.length >= this.maxQueueSize) {
      // Remove oldest non-critical events
      this.eventQueue = this.eventQueue.filter(e => 
        e.metadata.priority === 'high' || 
        e.metadata.priority === 'critical'
      ).slice(-(this.maxQueueSize * 0.8));
    }

    this.eventQueue.push(event);

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }

    // Persist event if needed
    if (event.metadata.persistent && this.config.persistEvents) {
      this.persistEvent(event);
    }
  }

  /**
   * Flush events to server with batching and compression
   */
  async flush() {
    if (this.eventQueue.length === 0 || !this.isOnline) {
      return;
    }

    const batchToSend = this.eventQueue.splice(0, this.batchSize);
    const batchId = this.generateBatchId();
    
    try {
      const startTime = Date.now();
      
      // Prepare batch data
      const batchData = {
        batchId,
        events: batchToSend,
        metadata: {
          sessionId: this.sessionId,
          batchSize: batchToSend.length,
          timestamp: Date.now(),
          compressed: false
        }
      };

      // Apply compression if beneficial
      if (batchToSend.length >= this.compressionThreshold && this.config.compressionEnabled) {
        batchData.events = this.compressBatch(batchToSend);
        batchData.metadata.compressed = true;
      }

      // Send to analytics endpoint
      const response = await this.sendBatch(batchData);
      
      const networkTime = Date.now() - startTime;
      
      // Update performance metrics
      this.updatePerformanceMetrics(batchToSend.length, networkTime, true);
      
      // Remove persisted events on success
      if (this.config.persistEvents) {
        await this.removePersitedEvents(batchToSend.map(e => e.id));
      }

      console.log(`📤 Analytics batch sent: ${batchToSend.length} events (${networkTime}ms)`);
      
    } catch (error) {
      console.error('📤 Failed to send analytics batch:', error);
      
      // Return events to queue for retry
      this.eventQueue.unshift(...batchToSend);
      
      // Update failure metrics
      this.updatePerformanceMetrics(batchToSend.length, 0, false);
      
      // Retry with exponential backoff
      this.scheduleRetry();
    }
  }

  /**
   * Send batch to analytics server
   */
  async sendBatch(batchData) {
    const url = 'https://api.example.com/analytics/batch'; // Replace with actual endpoint
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId
      },
      body: JSON.stringify(batchData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Compress batch data for efficient transmission
   */
  compressBatch(events) {
    // Simple compression by removing redundant data
    const compressed = events.map(event => ({
      id: event.id,
      name: event.name,
      properties: this.compressProperties(event.properties),
      timestamp: event.properties.timestamp
    }));

    const originalSize = JSON.stringify(events).length;
    const compressedSize = JSON.stringify(compressed).length;
    
    this.performanceMetrics.compressionRatio = 
      ((originalSize - compressedSize) / originalSize) * 100;

    return compressed;
  }

  /**
   * Compress event properties by removing common/redundant data
   */
  compressProperties(properties) {
    const compressed = { ...properties };
    
    // Remove session ID if it's the same as current session
    if (compressed.sessionId === this.sessionId) {
      delete compressed.sessionId;
    }

    // Remove common properties that can be inferred
    delete compressed.platform; // Always mobile for this app
    
    return compressed;
  }

  /**
   * Setup network monitoring for intelligent queuing
   */
  setupNetworkMonitoring() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected;

      if (!wasOnline && this.isOnline) {
        // Connection restored - flush queued events
        console.log('📶 Network restored, flushing queued events');
        this.flush();
      } else if (wasOnline && !this.isOnline) {
        console.log('📵 Network lost, events will be queued');
      }
    });
  }

  /**
   * Setup app state monitoring for battery optimization
   */
  setupAppStateMonitoring() {
    AppState.addEventListener('change', (nextAppState) => {
      const wasActive = this.isAppActive;
      this.isAppActive = nextAppState === 'active';

      if (!wasActive && this.isAppActive) {
        // App became active - resume normal operations
        this.startPeriodicFlush();
        this.trackEvent('app_resumed');
      } else if (wasActive && !this.isAppActive) {
        // App went to background - flush events and pause
        this.flush();
        this.stopPeriodicFlush();
        this.trackEvent('app_backgrounded');
      }
    });
  }

  /**
   * Start periodic flush timer
   */
  startPeriodicFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.isAppActive && this.isOnline) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Stop periodic flush timer
   */
  stopPeriodicFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Load persisted events from storage
   */
  async loadPersistedEvents() {
    if (!this.config.persistEvents) return;

    try {
      const persistedData = await AsyncStorage.getItem('analytics_events');
      if (persistedData) {
        const events = JSON.parse(persistedData);
        this.eventQueue.push(...events);
        console.log(`📥 Loaded ${events.length} persisted events`);
      }
    } catch (error) {
      console.warn('Failed to load persisted events:', error);
    }
  }

  /**
   * Persist event to storage
   */
  async persistEvent(event) {
    try {
      const existingData = await AsyncStorage.getItem('analytics_events');
      const events = existingData ? JSON.parse(existingData) : [];
      
      events.push(event);
      
      // Limit persisted events to prevent storage bloat
      if (events.length > 50) {
        events.splice(0, events.length - 50);
      }

      await AsyncStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to persist event:', error);
    }
  }

  /**
   * Remove persisted events after successful send
   */
  async removePersitedEvents(eventIds) {
    try {
      const existingData = await AsyncStorage.getItem('analytics_events');
      if (existingData) {
        const events = JSON.parse(existingData);
        const filteredEvents = events.filter(e => !eventIds.includes(e.id));
        await AsyncStorage.setItem('analytics_events', JSON.stringify(filteredEvents));
      }
    } catch (error) {
      console.warn('Failed to remove persisted events:', error);
    }
  }

  /**
   * Schedule retry with exponential backoff
   */
  scheduleRetry() {
    const delay = this.retryDelay * Math.pow(2, this.performanceMetrics.failedBatches % 5);
    
    setTimeout(() => {
      if (this.isOnline && this.eventQueue.length > 0) {
        this.flush();
      }
    }, delay);
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(batchSize, networkTime, success) {
    if (success) {
      this.performanceMetrics.batchesSent++;
      this.performanceMetrics.totalNetworkTime += networkTime;
      
      const totalBatches = this.performanceMetrics.batchesSent;
      this.performanceMetrics.averageBatchSize = 
        (this.performanceMetrics.averageBatchSize * (totalBatches - 1) + batchSize) / totalBatches;
    } else {
      this.performanceMetrics.failedBatches++;
    }
  }

  /**
   * Get analytics performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      queueSize: this.eventQueue.length,
      sessionDuration: Date.now() - this.sessionStartTime,
      averageNetworkTime: this.performanceMetrics.batchesSent > 0 
        ? this.performanceMetrics.totalNetworkTime / this.performanceMetrics.batchesSent 
        : 0,
      successRate: this.performanceMetrics.batchesSent + this.performanceMetrics.failedBatches > 0
        ? (this.performanceMetrics.batchesSent / (this.performanceMetrics.batchesSent + this.performanceMetrics.failedBatches)) * 100
        : 0
    };
  }

  /**
   * Reset session (call on app startup or user login)
   */
  resetSession() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    this.trackEvent('session_started', {
      previousSessionDuration: Date.now() - this.sessionStartTime
    });
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique batch ID
   */
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopPeriodicFlush();
    
    // Flush any remaining events
    if (this.eventQueue.length > 0) {
      this.flush();
    }

    console.log('📊 Analytics service cleaned up');
  }
}

export default new OptimizedAnalyticsService();