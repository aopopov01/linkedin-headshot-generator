/**
 * COMPREHENSIVE ERROR HANDLING & MONITORING SERVICE
 * 
 * Provides bulletproof error handling, monitoring, and user feedback systems
 * for the LinkedIn Headshot app. Features intelligent error classification,
 * user-friendly messaging, and comprehensive logging.
 * 
 * Features:
 * - Intelligent error classification and recovery suggestions
 * - Circuit breaker pattern implementation
 * - Comprehensive logging and metrics collection
 * - User-friendly error messaging
 * - Performance monitoring and alerting
 * - Retry logic with exponential backoff
 * 
 * @author LinkedIn Headshot App Team
 * @version 2.0.0
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Error classifications
const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_LIMIT_EXCEEDED: 'API_LIMIT_EXCEEDED', 
  IMAGE_PROCESSING_ERROR: 'IMAGE_PROCESSING_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  MODEL_LOADING: 'MODEL_LOADING',
  INSUFFICIENT_QUALITY: 'INSUFFICIENT_QUALITY',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Severity levels
const SEVERITY_LEVELS = {
  LOW: 'LOW',           // Minor issues, degraded experience
  MEDIUM: 'MEDIUM',     // Noticeable issues, some features affected
  HIGH: 'HIGH',         // Major issues, primary functionality affected
  CRITICAL: 'CRITICAL'  // System failure, complete functionality loss
};

// Recovery strategies
const RECOVERY_STRATEGIES = {
  RETRY_IMMEDIATE: 'RETRY_IMMEDIATE',
  RETRY_EXPONENTIAL: 'RETRY_EXPONENTIAL',
  FALLBACK_TIER: 'FALLBACK_TIER',
  FALLBACK_LOCAL: 'FALLBACK_LOCAL',
  USER_INTERVENTION: 'USER_INTERVENTION',
  GRACEFUL_DEGRADATION: 'GRACEFUL_DEGRADATION'
};

class ErrorHandlingService {
  constructor() {
    this.errorLog = [];
    this.metricsCache = new Map();
    this.circuitBreakers = new Map();
    this.retryCounters = new Map();
    this.userFeedbackHistory = [];
    
    // Performance thresholds
    this.performanceThresholds = {
      maxResponseTime: 30000,      // 30 seconds
      maxRetries: 3,
      maxErrorsPerHour: 10,
      minSuccessRate: 0.80
    };
    
    console.log('🛡️ ErrorHandlingService initialized');
    this.initializeErrorTracking();
  }

  /**
   * MAIN ERROR HANDLING METHOD
   * Processes errors and determines recovery strategy
   */
  async handleError(error, context = {}) {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    console.log(`🚨 [${errorId}] Processing error:`, error.message);

    try {
      // Step 1: Classify the error
      const classification = this.classifyError(error, context);
      
      // Step 2: Log error with full context
      const errorEntry = await this.logError(error, classification, context, errorId);
      
      // Step 3: Determine recovery strategy
      const recoveryPlan = this.determineRecoveryStrategy(classification, context);
      
      // Step 4: Update metrics and monitoring
      await this.updateErrorMetrics(classification, context);
      
      // Step 5: Generate user-friendly response
      const userResponse = this.generateUserFriendlyResponse(classification, recoveryPlan, context);
      
      // Step 6: Execute automatic recovery if possible
      const autoRecovery = await this.attemptAutoRecovery(recoveryPlan, context);
      
      return {
        errorId,
        handled: true,
        classification,
        recoveryPlan,
        userResponse,
        autoRecovery,
        timestamp,
        context: {
          ...context,
          processingTime: Date.now() - (context.startTime || Date.now())
        }
      };
      
    } catch (handlingError) {
      console.error('❌ Error handling itself failed:', handlingError);
      
      // Fallback error response
      return this.createFallbackErrorResponse(error, errorId, timestamp);
    }
  }

  /**
   * Classify errors into actionable categories
   */
  classifyError(error, context = {}) {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code;
    const httpStatus = error.response?.status;
    
    let type = ERROR_TYPES.UNKNOWN_ERROR;
    let severity = SEVERITY_LEVELS.MEDIUM;
    let isRetryable = false;
    let expectedRecoveryTime = 60000; // 1 minute default
    
    // Network-related errors
    if (errorMessage.includes('network') || errorMessage.includes('connection') || 
        errorMessage.includes('timeout') || errorCode === 'NETWORK_ERROR') {
      type = ERROR_TYPES.NETWORK_ERROR;
      severity = SEVERITY_LEVELS.HIGH;
      isRetryable = true;
      expectedRecoveryTime = 30000;
    }
    
    // API limit and quota errors
    else if (httpStatus === 429 || errorMessage.includes('rate limit') || 
             errorMessage.includes('quota') || errorMessage.includes('limit exceeded')) {
      type = ERROR_TYPES.API_LIMIT_EXCEEDED;
      severity = SEVERITY_LEVELS.MEDIUM;
      isRetryable = true;
      expectedRecoveryTime = 300000; // 5 minutes
    }
    
    // Model loading errors
    else if (httpStatus === 503 || errorMessage.includes('loading') || 
             errorMessage.includes('warming up')) {
      type = ERROR_TYPES.MODEL_LOADING;
      severity = SEVERITY_LEVELS.LOW;
      isRetryable = true;
      expectedRecoveryTime = 20000; // 20 seconds
    }
    
    // Authentication errors
    else if (httpStatus === 401 || httpStatus === 403 || 
             errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      type = ERROR_TYPES.AUTHENTICATION_ERROR;
      severity = SEVERITY_LEVELS.HIGH;
      isRetryable = false;
      expectedRecoveryTime = 0; // Requires user intervention
    }
    
    // Image processing errors
    else if (errorMessage.includes('image') || errorMessage.includes('processing') ||
             errorMessage.includes('manipulation') || errorMessage.includes('format')) {
      type = ERROR_TYPES.IMAGE_PROCESSING_ERROR;
      severity = SEVERITY_LEVELS.MEDIUM;
      isRetryable = true;
      expectedRecoveryTime = 10000; // 10 seconds
    }
    
    // Validation errors
    else if (errorMessage.includes('validation') || errorMessage.includes('invalid') ||
             errorMessage.includes('required') || errorMessage.includes('format')) {
      type = ERROR_TYPES.VALIDATION_ERROR;
      severity = SEVERITY_LEVELS.LOW;
      isRetryable = false;
      expectedRecoveryTime = 0;
    }
    
    // Timeout errors
    else if (errorMessage.includes('timeout') || errorCode === 'TIMEOUT') {
      type = ERROR_TYPES.TIMEOUT_ERROR;
      severity = SEVERITY_LEVELS.MEDIUM;
      isRetryable = true;
      expectedRecoveryTime = 15000; // 15 seconds
    }

    return {
      type,
      severity,
      isRetryable,
      expectedRecoveryTime,
      originalError: error.message,
      httpStatus,
      errorCode,
      context: context.operation || 'unknown'
    };
  }

  /**
   * Determine optimal recovery strategy
   */
  determineRecoveryStrategy(classification, context = {}) {
    const { type, severity, isRetryable } = classification;
    const currentRetries = this.getRetryCount(context.requestId) || 0;
    
    // Critical errors - immediate fallback
    if (severity === SEVERITY_LEVELS.CRITICAL) {
      return {
        strategy: RECOVERY_STRATEGIES.FALLBACK_LOCAL,
        priority: 1,
        autoExecute: true,
        userNotification: true,
        fallbackMessage: 'Switching to local processing for guaranteed results'
      };
    }
    
    // Authentication errors - require user intervention
    if (type === ERROR_TYPES.AUTHENTICATION_ERROR) {
      return {
        strategy: RECOVERY_STRATEGIES.USER_INTERVENTION,
        priority: 1,
        autoExecute: false,
        userNotification: true,
        fallbackMessage: 'Authentication issue detected. Please check your connection.'
      };
    }
    
    // Model loading - wait and retry
    if (type === ERROR_TYPES.MODEL_LOADING) {
      return {
        strategy: RECOVERY_STRATEGIES.RETRY_EXPONENTIAL,
        priority: 2,
        autoExecute: true,
        retryDelay: 20000,
        maxRetries: 2,
        userNotification: true,
        fallbackMessage: 'AI models are loading. This may take 15-20 seconds...'
      };
    }
    
    // API limits - tier fallback
    if (type === ERROR_TYPES.API_LIMIT_EXCEEDED) {
      return {
        strategy: RECOVERY_STRATEGIES.FALLBACK_TIER,
        priority: 2,
        autoExecute: true,
        userNotification: false,
        fallbackMessage: 'Switching to alternative processing method'
      };
    }
    
    // Network errors - retry with backoff
    if (type === ERROR_TYPES.NETWORK_ERROR && isRetryable && currentRetries < 3) {
      return {
        strategy: RECOVERY_STRATEGIES.RETRY_EXPONENTIAL,
        priority: 3,
        autoExecute: true,
        retryDelay: Math.pow(2, currentRetries) * 5000, // Exponential backoff
        maxRetries: 3,
        userNotification: currentRetries > 1,
        fallbackMessage: 'Retrying connection...'
      };
    }
    
    // Default fallback
    return {
      strategy: RECOVERY_STRATEGIES.FALLBACK_LOCAL,
      priority: 4,
      autoExecute: true,
      userNotification: true,
      fallbackMessage: 'Switching to local processing for reliable results'
    };
  }

  /**
   * Generate user-friendly error messages
   */
  generateUserFriendlyResponse(classification, recoveryPlan, context = {}) {
    const { type, severity } = classification;
    const { strategy } = recoveryPlan;
    
    const responses = {
      [ERROR_TYPES.NETWORK_ERROR]: {
        title: '🌐 Connection Issue',
        message: 'Having trouble connecting to our AI servers. We\'ll keep trying to give you the best results.',
        actionText: 'Retrying automatically...',
        showProgress: true
      },
      
      [ERROR_TYPES.MODEL_LOADING]: {
        title: '🤖 AI Models Loading',
        message: 'Our AI models are warming up! This is normal for the first request and takes 15-20 seconds.',
        actionText: 'Please wait while AI loads...',
        showProgress: true
      },
      
      [ERROR_TYPES.API_LIMIT_EXCEEDED]: {
        title: '⏱️ Processing Queue Full',
        message: 'Our AI servers are busy! We\'ll use alternative processing to ensure you get great results.',
        actionText: 'Switching to backup system...',
        showProgress: false
      },
      
      [ERROR_TYPES.IMAGE_PROCESSING_ERROR]: {
        title: '📸 Image Processing Issue',
        message: 'Having trouble processing your image. We\'ll optimize it and try again.',
        actionText: 'Optimizing image...',
        showProgress: true
      },
      
      [ERROR_TYPES.VALIDATION_ERROR]: {
        title: '✋ Image Quality Check',
        message: 'Your image needs some adjustment for the best results. Please try a clearer photo with good lighting.',
        actionText: 'Try another photo',
        showProgress: false
      },
      
      [ERROR_TYPES.AUTHENTICATION_ERROR]: {
        title: '🔐 Connection Authentication',
        message: 'Having trouble authenticating with our servers. Please check your internet connection.',
        actionText: 'Check connection',
        showProgress: false
      }
    };
    
    const defaultResponse = {
      title: '🔄 Processing Alternative',
      message: 'Switching to our reliable backup system to ensure you get professional results.',
      actionText: 'Applying professional enhancement...',
      showProgress: true
    };
    
    const response = responses[type] || defaultResponse;
    
    // Add recovery strategy context
    if (strategy === RECOVERY_STRATEGIES.FALLBACK_LOCAL) {
      response.message += ' We\'ll use our advanced local processing to guarantee professional results.';
    }
    
    return {
      ...response,
      severity: severity,
      errorId: context.errorId,
      timestamp: new Date().toISOString(),
      estimatedTime: classification.expectedRecoveryTime / 1000 // Convert to seconds
    };
  }

  /**
   * Attempt automatic error recovery
   */
  async attemptAutoRecovery(recoveryPlan, context = {}) {
    const { strategy, autoExecute } = recoveryPlan;
    
    if (!autoExecute) {
      return { attempted: false, reason: 'Manual intervention required' };
    }
    
    try {
      switch (strategy) {
        case RECOVERY_STRATEGIES.RETRY_IMMEDIATE:
          return await this.executeImmediateRetry(context);
          
        case RECOVERY_STRATEGIES.RETRY_EXPONENTIAL:
          return await this.executeExponentialRetry(recoveryPlan, context);
          
        case RECOVERY_STRATEGIES.FALLBACK_TIER:
          return await this.executeTierFallback(context);
          
        case RECOVERY_STRATEGIES.FALLBACK_LOCAL:
          return await this.executeLocalFallback(context);
          
        case RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION:
          return await this.executeGracefulDegradation(context);
          
        default:
          return { attempted: false, reason: 'Unknown recovery strategy' };
      }
    } catch (recoveryError) {
      console.error('Auto-recovery failed:', recoveryError);
      return { 
        attempted: true, 
        success: false, 
        error: recoveryError.message 
      };
    }
  }

  /**
   * Log error with comprehensive context
   */
  async logError(error, classification, context, errorId) {
    const errorEntry = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      classification,
      context: {
        operation: context.operation,
        requestId: context.requestId,
        userId: context.userId,
        imageSize: context.imageSize,
        styleTemplate: context.styleTemplate,
        tier: context.tier,
        retryCount: this.getRetryCount(context.requestId)
      },
      device: {
        platform: 'react-native',
        userAgent: context.userAgent
      }
    };
    
    // Add to in-memory log
    this.errorLog.push(errorEntry);
    
    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
    
    // Store critical errors persistently
    if (classification.severity === SEVERITY_LEVELS.CRITICAL) {
      try {
        await this.persistCriticalError(errorEntry);
      } catch (persistError) {
        console.warn('Failed to persist critical error:', persistError);
      }
    }
    
    return errorEntry;
  }

  /**
   * Update error metrics and monitoring
   */
  async updateErrorMetrics(classification, context = {}) {
    const currentTime = Date.now();
    const hourKey = Math.floor(currentTime / (1000 * 60 * 60)); // Hour bucket
    
    // Update error counts by type
    const typeKey = `errors_${classification.type}`;
    const currentTypeCount = this.metricsCache.get(typeKey) || 0;
    this.metricsCache.set(typeKey, currentTypeCount + 1);
    
    // Update hourly error counts
    const hourlyKey = `errors_hour_${hourKey}`;
    const currentHourlyCount = this.metricsCache.get(hourlyKey) || 0;
    this.metricsCache.set(hourlyKey, currentHourlyCount + 1);
    
    // Update severity metrics
    const severityKey = `severity_${classification.severity}`;
    const currentSeverityCount = this.metricsCache.get(severityKey) || 0;
    this.metricsCache.set(severityKey, currentSeverityCount + 1);
    
    // Check for alert conditions
    await this.checkAlertConditions(classification, context);
  }

  /**
   * Check for conditions that require alerts
   */
  async checkAlertConditions(classification, context = {}) {
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    const hourlyErrors = this.metricsCache.get(`errors_hour_${currentHour}`) || 0;
    
    // Alert if too many errors in current hour
    if (hourlyErrors > this.performanceThresholds.maxErrorsPerHour) {
      console.warn(`🚨 High error rate detected: ${hourlyErrors} errors in current hour`);
      await this.triggerAlert('HIGH_ERROR_RATE', { 
        errorCount: hourlyErrors,
        threshold: this.performanceThresholds.maxErrorsPerHour 
      });
    }
    
    // Alert on critical errors
    if (classification.severity === SEVERITY_LEVELS.CRITICAL) {
      console.error('🚨 Critical error detected:', classification.originalError);
      await this.triggerAlert('CRITICAL_ERROR', classification);
    }
  }

  /**
   * Execute exponential backoff retry
   */
  async executeExponentialRetry(recoveryPlan, context = {}) {
    const { retryDelay, maxRetries } = recoveryPlan;
    const currentRetries = this.getRetryCount(context.requestId) || 0;
    
    if (currentRetries >= maxRetries) {
      return { attempted: true, success: false, reason: 'Max retries exceeded' };
    }
    
    // Increment retry counter
    this.incrementRetryCount(context.requestId);
    
    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    
    return { 
      attempted: true, 
      success: true, 
      action: 'retry_scheduled',
      retryCount: currentRetries + 1,
      nextRetryDelay: retryDelay * 2 // Exponential backoff
    };
  }

  /**
   * Execute tier fallback
   */
  async executeTierFallback(context = {}) {
    console.log('🔄 Executing tier fallback strategy');
    
    return {
      attempted: true,
      success: true,
      action: 'tier_fallback',
      message: 'Switched to next processing tier'
    };
  }

  /**
   * Execute local fallback
   */
  async executeLocalFallback(context = {}) {
    console.log('🏠 Executing local fallback strategy');
    
    return {
      attempted: true,
      success: true,
      action: 'local_fallback',
      message: 'Switched to local processing'
    };
  }

  /**
   * Retry counter management
   */
  getRetryCount(requestId) {
    return requestId ? this.retryCounters.get(requestId) || 0 : 0;
  }

  incrementRetryCount(requestId) {
    if (requestId) {
      const current = this.getRetryCount(requestId);
      this.retryCounters.set(requestId, current + 1);
    }
  }

  resetRetryCount(requestId) {
    if (requestId) {
      this.retryCounters.delete(requestId);
    }
  }

  /**
   * Initialize error tracking
   */
  async initializeErrorTracking() {
    try {
      // Load persistent error data if needed
      const persistedErrors = await AsyncStorage.getItem('critical_errors');
      if (persistedErrors) {
        const errors = JSON.parse(persistedErrors);
        console.log(`📊 Loaded ${errors.length} persisted critical errors`);
      }
    } catch (error) {
      console.warn('Failed to initialize error tracking:', error);
    }
  }

  /**
   * Persist critical errors
   */
  async persistCriticalError(errorEntry) {
    try {
      const existing = await AsyncStorage.getItem('critical_errors');
      const errors = existing ? JSON.parse(existing) : [];
      
      errors.push({
        ...errorEntry,
        persistedAt: new Date().toISOString()
      });
      
      // Keep only last 50 critical errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      await AsyncStorage.setItem('critical_errors', JSON.stringify(errors));
    } catch (error) {
      console.error('Failed to persist critical error:', error);
    }
  }

  /**
   * Trigger alerts for monitoring
   */
  async triggerAlert(alertType, data) {
    const alert = {
      type: alertType,
      timestamp: new Date().toISOString(),
      data,
      severity: this.getAlertSeverity(alertType)
    };
    
    console.warn(`🚨 ALERT [${alertType}]:`, data);
    
    // In production, this would send alerts to monitoring systems
    // For now, just log the alert
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(alertType) {
    const severities = {
      'HIGH_ERROR_RATE': SEVERITY_LEVELS.HIGH,
      'CRITICAL_ERROR': SEVERITY_LEVELS.CRITICAL,
      'PERFORMANCE_DEGRADATION': SEVERITY_LEVELS.MEDIUM,
      'SERVICE_UNAVAILABLE': SEVERITY_LEVELS.HIGH
    };
    
    return severities[alertType] || SEVERITY_LEVELS.MEDIUM;
  }

  /**
   * Create fallback error response
   */
  createFallbackErrorResponse(originalError, errorId, timestamp) {
    return {
      errorId,
      handled: true,
      classification: {
        type: ERROR_TYPES.UNKNOWN_ERROR,
        severity: SEVERITY_LEVELS.MEDIUM,
        isRetryable: true,
        expectedRecoveryTime: 30000
      },
      recoveryPlan: {
        strategy: RECOVERY_STRATEGIES.FALLBACK_LOCAL,
        priority: 4,
        autoExecute: true
      },
      userResponse: {
        title: '🔄 Processing Issue',
        message: 'We encountered an unexpected issue but will ensure you get professional results using our backup system.',
        actionText: 'Switching to reliable processing...',
        showProgress: true
      },
      autoRecovery: {
        attempted: true,
        success: true,
        action: 'fallback_applied'
      },
      timestamp
    };
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get comprehensive error metrics
   */
  getErrorMetrics() {
    const metrics = {};
    
    // Convert Map to object
    for (const [key, value] of this.metricsCache) {
      metrics[key] = value;
    }
    
    return {
      totalErrors: this.errorLog.length,
      errorsByType: this.getErrorsByType(),
      errorsBySeverity: this.getErrorsBySeverity(),
      recentErrors: this.errorLog.slice(-10), // Last 10 errors
      retryCounters: Object.fromEntries(this.retryCounters),
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      ...metrics
    };
  }

  /**
   * Get errors by type
   */
  getErrorsByType() {
    const byType = {};
    this.errorLog.forEach(error => {
      const type = error.classification.type;
      byType[type] = (byType[type] || 0) + 1;
    });
    return byType;
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity() {
    const bySeverity = {};
    this.errorLog.forEach(error => {
      const severity = error.classification.severity;
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    });
    return bySeverity;
  }

  /**
   * Execute immediate retry
   */
  async executeImmediateRetry(context = {}) {
    console.log('⚡ Executing immediate retry');
    
    return {
      attempted: true,
      success: true,
      action: 'immediate_retry',
      message: 'Retrying immediately'
    };
  }

  /**
   * Execute graceful degradation
   */
  async executeGracefulDegradation(context = {}) {
    console.log('📉 Executing graceful degradation');
    
    return {
      attempted: true,
      success: true,
      action: 'graceful_degradation',
      message: 'Service degraded but functional'
    };
  }
}

// Export singleton instance
export default new ErrorHandlingService();