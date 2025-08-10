/**
 * Mobile App Performance Monitoring Service
 * Tracks app performance metrics including startup time, memory usage, and rendering performance
 */

import { PerformanceObserver, performance } from 'react-native-performance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.isInitialized = false;
    this.performanceObserver = null;
    this.memoryCheckInterval = null;
    this.startupTime = Date.now();
    this.renderingMetrics = {
      slowRenders: [],
      averageRenderTime: 0,
      totalRenders: 0
    };
  }

  /**
   * Initialize performance monitoring
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Performance Monitor');

    try {
      // Set up performance observer for React Native
      this.setupPerformanceObserver();
      
      // Track app lifecycle events
      this.trackAppLifecycle();
      
      // Start memory monitoring
      this.startMemoryMonitoring();
      
      // Track startup performance
      this.trackAppStartup();
      
      this.isInitialized = true;
      console.log('✅ Performance Monitor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Performance Monitor:', error);
    }
  }

  /**
   * Set up performance observer for measuring various metrics
   */
  setupPerformanceObserver() {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.processPerformanceEntry(entry);
        });
      });

      // Observe various performance entry types
      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'navigation', 'resource', 'mark'] 
      });
    } catch (error) {
      console.warn('Performance Observer not available:', error);
    }
  }

  /**
   * Process performance entries
   */
  processPerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'measure':
        this.handleMeasureEntry(entry);
        break;
      case 'navigation':
        this.handleNavigationEntry(entry);
        break;
      case 'resource':
        this.handleResourceEntry(entry);
        break;
      default:
        break;
    }
  }

  /**
   * Handle measure performance entries
   */
  handleMeasureEntry(entry) {
    if (!this.metrics.measures) this.metrics.measures = {};
    
    this.metrics.measures[entry.name] = {
      duration: entry.duration,
      startTime: entry.startTime,
      timestamp: Date.now()
    };

    // Track slow operations
    if (entry.duration > 1000) { // > 1 second
      this.recordSlowOperation(entry.name, entry.duration);
    }
  }

  /**
   * Handle navigation performance entries
   */
  handleNavigationEntry(entry) {
    this.metrics.navigation = {
      ...entry,
      timestamp: Date.now()
    };
  }

  /**
   * Handle resource loading performance entries
   */
  handleResourceEntry(entry) {
    if (!this.metrics.resources) this.metrics.resources = [];
    
    this.metrics.resources.push({
      name: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize,
      timestamp: Date.now()
    });

    // Track slow resource loading
    if (entry.duration > 3000) { // > 3 seconds
      this.recordSlowResource(entry.name, entry.duration);
    }
  }

  /**
   * Track app lifecycle events
   */
  trackAppLifecycle() {
    let appStateChangeTime = Date.now();

    AppState.addEventListener('change', (nextAppState) => {
      const currentTime = Date.now();
      const stateChangeDuration = currentTime - appStateChangeTime;

      this.recordMetric('app_state_change', {
        newState: nextAppState,
        duration: stateChangeDuration,
        timestamp: currentTime
      });

      if (nextAppState === 'active') {
        this.recordMetric('app_resume_time', {
          duration: stateChangeDuration,
          timestamp: currentTime
        });
      }

      appStateChangeTime = currentTime;
    });
  }

  /**
   * Start monitoring memory usage
   */
  startMemoryMonitoring() {
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Check current memory usage
   */
  async checkMemoryUsage() {
    try {
      // React Native doesn't have direct memory API
      // This would need to be implemented with native modules
      const memoryInfo = await this.getNativeMemoryInfo();
      
      this.recordMetric('memory_usage', {
        ...memoryInfo,
        timestamp: Date.now()
      });

      // Alert if memory usage is high
      if (memoryInfo.usedMemory > 100 * 1024 * 1024) { // > 100MB
        this.recordPerformanceIssue('high_memory_usage', {
          usedMemory: memoryInfo.usedMemory,
          availableMemory: memoryInfo.availableMemory
        });
      }
    } catch (error) {
      console.warn('Unable to check memory usage:', error);
    }
  }

  /**
   * Get native memory information (would require native module)
   */
  async getNativeMemoryInfo() {
    // Placeholder - would need native implementation
    return {
      usedMemory: Math.random() * 50 * 1024 * 1024, // Mock data
      availableMemory: 100 * 1024 * 1024,
      totalMemory: 150 * 1024 * 1024
    };
  }

  /**
   * Track app startup performance
   */
  trackAppStartup() {
    const startupDuration = Date.now() - this.startupTime;
    
    this.recordMetric('app_startup', {
      duration: startupDuration,
      timestamp: Date.now()
    });

    // Mark as slow startup if > 3 seconds
    if (startupDuration > 3000) {
      this.recordPerformanceIssue('slow_startup', {
        duration: startupDuration
      });
    }

    console.log(`📱 App startup time: ${startupDuration}ms`);
  }

  /**
   * Measure screen render time
   */
  measureScreenRender(screenName, renderFunction) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const result = renderFunction();
      
      requestAnimationFrame(() => {
        const renderTime = Date.now() - startTime;
        
        this.recordMetric('screen_render', {
          screenName,
          renderTime,
          timestamp: Date.now()
        });

        this.updateRenderingMetrics(renderTime);

        // Track slow renders
        if (renderTime > 100) { // > 100ms
          this.recordSlowRender(screenName, renderTime);
        }

        resolve(result);
      });
    });
  }

  /**
   * Update rendering performance metrics
   */
  updateRenderingMetrics(renderTime) {
    this.renderingMetrics.totalRenders++;
    const total = this.renderingMetrics.averageRenderTime * (this.renderingMetrics.totalRenders - 1) + renderTime;
    this.renderingMetrics.averageRenderTime = total / this.renderingMetrics.totalRenders;
  }

  /**
   * Record slow render events
   */
  recordSlowRender(screenName, renderTime) {
    this.renderingMetrics.slowRenders.push({
      screenName,
      renderTime,
      timestamp: Date.now()
    });

    this.recordPerformanceIssue('slow_render', {
      screenName,
      renderTime
    });
  }

  /**
   * Record slow operations
   */
  recordSlowOperation(operationName, duration) {
    this.recordPerformanceIssue('slow_operation', {
      operation: operationName,
      duration
    });
  }

  /**
   * Record slow resource loading
   */
  recordSlowResource(resourceName, duration) {
    this.recordPerformanceIssue('slow_resource', {
      resource: resourceName,
      duration
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(metricName, data) {
    if (!this.metrics[metricName]) {
      this.metrics[metricName] = [];
    }

    this.metrics[metricName].push({
      ...data,
      timestamp: data.timestamp || Date.now()
    });

    // Keep only last 100 entries per metric
    if (this.metrics[metricName].length > 100) {
      this.metrics[metricName] = this.metrics[metricName].slice(-100);
    }
  }

  /**
   * Record performance issues
   */
  recordPerformanceIssue(issueType, data) {
    if (!this.metrics.performance_issues) {
      this.metrics.performance_issues = [];
    }

    this.metrics.performance_issues.push({
      type: issueType,
      ...data,
      timestamp: Date.now()
    });

    console.warn(`⚠️ Performance Issue: ${issueType}`, data);
  }

  /**
   * Measure API call performance
   */
  async measureApiCall(apiName, apiCall) {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      this.recordMetric('api_call', {
        apiName,
        duration,
        success: true,
        timestamp: Date.now()
      });

      if (duration > 5000) { // > 5 seconds
        this.recordPerformanceIssue('slow_api_call', {
          apiName,
          duration
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.recordMetric('api_call', {
        apiName,
        duration,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      timestamp: Date.now(),
      metrics: {
        totalMetrics: Object.keys(this.metrics).length,
        appStartup: this.getLatestMetric('app_startup'),
        memoryUsage: this.getLatestMetric('memory_usage'),
        rendering: {
          averageRenderTime: this.renderingMetrics.averageRenderTime,
          totalRenders: this.renderingMetrics.totalRenders,
          slowRenders: this.renderingMetrics.slowRenders.length
        }
      },
      issues: {
        total: this.metrics.performance_issues?.length || 0,
        byType: this.groupIssuesByType()
      }
    };

    return summary;
  }

  /**
   * Get latest metric value
   */
  getLatestMetric(metricName) {
    const metric = this.metrics[metricName];
    return metric && metric.length > 0 ? metric[metric.length - 1] : null;
  }

  /**
   * Group performance issues by type
   */
  groupIssuesByType() {
    const issues = this.metrics.performance_issues || [];
    return issues.reduce((groups, issue) => {
      groups[issue.type] = (groups[issue.type] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Export performance data
   */
  async exportPerformanceData() {
    const data = {
      timestamp: Date.now(),
      metrics: this.metrics,
      summary: this.getPerformanceSummary()
    };

    try {
      await AsyncStorage.setItem('performance_data', JSON.stringify(data));
      console.log('📊 Performance data exported to AsyncStorage');
      return data;
    } catch (error) {
      console.error('Failed to export performance data:', error);
      throw error;
    }
  }

  /**
   * Clear performance data
   */
  clearMetrics() {
    this.metrics = {};
    this.renderingMetrics = {
      slowRenders: [],
      averageRenderTime: 0,
      totalRenders: 0
    };
    console.log('🧹 Performance metrics cleared');
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

    console.log('⏹️ Performance monitoring stopped');
  }
}

export default new PerformanceMonitor();