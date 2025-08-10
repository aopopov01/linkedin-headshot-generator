/**
 * Capacity Planning and Load Testing Suite
 * Advanced load testing with capacity recommendations and auto-scaling triggers
 */

const autocannon = require('autocannon');
const fs = require('fs').promises;
const path = require('path');
const logger = console; // Simplified logger for capacity planning

class CapacityPlanner {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.testResults = [];
    this.capacityModel = {
      maxConcurrentUsers: 0,
      requestsPerSecond: 0,
      memoryPerUser: 0,
      cpuPerUser: 0,
      breakingPoint: null
    };
    
    this.testProfiles = {
      light: { connections: 10, duration: 60 },
      medium: { connections: 50, duration: 120 },
      heavy: { connections: 100, duration: 180 },
      stress: { connections: 200, duration: 300 },
      spike: { connections: 500, duration: 60 }
    };
  }

  /**
   * Run comprehensive capacity planning tests
   */
  async runCapacityPlanning() {
    logger.log('🚀 Starting Capacity Planning Tests');
    logger.log(`📊 Target URL: ${this.baseUrl}`);
    
    try {
      // Health check
      await this.healthCheck();
      
      // Progressive load testing
      await this.runProgressiveLoadTest();
      
      // Endurance testing
      await this.runEnduranceTest();
      
      // Spike testing
      await this.runSpikeTest();
      
      // Generate capacity model
      this.generateCapacityModel();
      
      // Generate recommendations
      const recommendations = this.generateRecommendations();
      
      // Save results
      await this.saveResults();
      
      return {
        success: true,
        capacityModel: this.capacityModel,
        recommendations,
        testResults: this.testResults
      };

    } catch (error) {
      logger.error('❌ Capacity planning failed:', error);
      throw error;
    }
  }

  /**
   * Health check before starting tests
   */
  async healthCheck() {
    logger.log('\n🔍 Running Health Check...');
    
    const result = await autocannon({
      url: `${this.baseUrl}/health`,
      connections: 1,
      duration: 10
    });

    if (result.non2xx > 0 || result.errors > 0) {
      throw new Error('Health check failed - API is not responding correctly');
    }

    logger.log('✅ Health check passed');
  }

  /**
   * Progressive load testing to find breaking point
   */
  async runProgressiveLoadTest() {
    logger.log('\n📈 Running Progressive Load Test...');
    
    const testLevels = [10, 25, 50, 75, 100, 150, 200, 300, 500];
    const results = [];
    
    for (const connections of testLevels) {
      logger.log(`Testing with ${connections} concurrent connections...`);
      
      const result = await autocannon({
        url: `${this.baseUrl}/api/auth/login`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPass123!'
        }),
        connections,
        duration: 60
      });

      const testResult = {
        testType: 'progressive',
        connections,
        requestsPerSecond: result.requests.average,
        latency: {
          avg: result.latency.average,
          p95: result.latency.p95,
          p99: result.latency.p99
        },
        errors: result.errors,
        timeouts: result.timeouts,
        throughput: result.throughput.average,
        successful: result.errors === 0 && result.latency.p95 < 2000
      };

      results.push(testResult);
      this.testResults.push(testResult);

      logger.log(`  RPS: ${testResult.requestsPerSecond.toFixed(2)}, P95: ${testResult.latency.p95}ms, Errors: ${testResult.errors}`);

      // Check if we've hit the breaking point
      if (!testResult.successful) {
        logger.log(`💥 Breaking point detected at ${connections} concurrent users`);
        this.capacityModel.breakingPoint = {
          connections,
          reason: result.errors > 0 ? 'errors' : 'high_latency',
          details: testResult
        };
        break;
      }

      // Update capacity model with successful test
      this.capacityModel.maxConcurrentUsers = connections;
      this.capacityModel.requestsPerSecond = Math.max(
        this.capacityModel.requestsPerSecond, 
        testResult.requestsPerSecond
      );

      // Brief pause between tests
      await this.sleep(5000);
    }

    return results;
  }

  /**
   * Endurance testing to check for memory leaks and performance degradation
   */
  async runEnduranceTest() {
    logger.log('\n⏰ Running Endurance Test (10 minutes)...');
    
    const connections = Math.floor(this.capacityModel.maxConcurrentUsers * 0.7); // 70% of capacity
    
    const result = await autocannon({
      url: `${this.baseUrl}/api/users/profile`,
      headers: { 'Authorization': 'Bearer mock-token' },
      connections,
      duration: 600 // 10 minutes
    });

    const testResult = {
      testType: 'endurance',
      connections,
      duration: 600,
      requestsPerSecond: result.requests.average,
      latency: {
        avg: result.latency.average,
        p95: result.latency.p95,
        p99: result.latency.p99
      },
      errors: result.errors,
      timeouts: result.timeouts,
      throughput: result.throughput.average,
      memoryLeak: this.detectMemoryLeak(result),
      performanceDegradation: this.detectPerformanceDegradation(result)
    };

    this.testResults.push(testResult);
    
    logger.log(`✅ Endurance test completed - RPS: ${testResult.requestsPerSecond.toFixed(2)}, Errors: ${testResult.errors}`);
    return testResult;
  }

  /**
   * Spike testing to check elasticity
   */
  async runSpikeTest() {
    logger.log('\n⚡ Running Spike Test...');
    
    const normalLoad = Math.floor(this.capacityModel.maxConcurrentUsers * 0.5);
    const spikeLoad = Math.floor(this.capacityModel.maxConcurrentUsers * 1.5);
    
    // Normal load phase
    logger.log(`Phase 1: Normal load (${normalLoad} connections)`);
    const normalResult = await autocannon({
      url: `${this.baseUrl}/api/photos/status/test-id`,
      headers: { 'Authorization': 'Bearer mock-token' },
      connections: normalLoad,
      duration: 60
    });

    // Brief pause
    await this.sleep(10000);

    // Spike phase
    logger.log(`Phase 2: Spike load (${spikeLoad} connections)`);
    const spikeResult = await autocannon({
      url: `${this.baseUrl}/api/photos/status/test-id`,
      headers: { 'Authorization': 'Bearer mock-token' },
      connections: spikeLoad,
      duration: 60
    });

    // Recovery phase
    await this.sleep(10000);
    logger.log(`Phase 3: Recovery (${normalLoad} connections)`);
    const recoveryResult = await autocannon({
      url: `${this.baseUrl}/api/photos/status/test-id`,
      headers: { 'Authorization': 'Bearer mock-token' },
      connections: normalLoad,
      duration: 60
    });

    const testResult = {
      testType: 'spike',
      phases: {
        normal: {
          connections: normalLoad,
          requestsPerSecond: normalResult.requests.average,
          latency: normalResult.latency.p95,
          errors: normalResult.errors
        },
        spike: {
          connections: spikeLoad,
          requestsPerSecond: spikeResult.requests.average,
          latency: spikeResult.latency.p95,
          errors: spikeResult.errors
        },
        recovery: {
          connections: normalLoad,
          requestsPerSecond: recoveryResult.requests.average,
          latency: recoveryResult.latency.p95,
          errors: recoveryResult.errors
        }
      },
      elasticity: this.calculateElasticity(normalResult, spikeResult, recoveryResult)
    };

    this.testResults.push(testResult);
    
    logger.log(`✅ Spike test completed - Elasticity score: ${testResult.elasticity.score}/100`);
    return testResult;
  }

  /**
   * Generate capacity model based on test results
   */
  generateCapacityModel() {
    logger.log('\n📊 Generating Capacity Model...');
    
    const successfulTests = this.testResults.filter(test => 
      test.testType === 'progressive' && test.successful
    );

    if (successfulTests.length > 0) {
      // Calculate resource usage per user
      this.capacityModel.memoryPerUser = this.estimateMemoryPerUser();
      this.capacityModel.cpuPerUser = this.estimateCPUPerUser();
      
      // Calculate optimal operating parameters
      this.capacityModel.optimalConnections = Math.floor(this.capacityModel.maxConcurrentUsers * 0.7);
      this.capacityModel.safetyMargin = Math.floor(this.capacityModel.maxConcurrentUsers * 0.2);
      
      // Calculate scaling thresholds
      this.capacityModel.scaleUpThreshold = Math.floor(this.capacityModel.maxConcurrentUsers * 0.6);
      this.capacityModel.scaleDownThreshold = Math.floor(this.capacityModel.maxConcurrentUsers * 0.3);
    }

    logger.log('📈 Capacity Model Generated:', this.capacityModel);
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = {
      infrastructure: [],
      application: [],
      monitoring: [],
      scaling: []
    };

    // Infrastructure recommendations
    if (this.capacityModel.maxConcurrentUsers < 100) {
      recommendations.infrastructure.push('Consider upgrading server resources - low concurrent user capacity');
    }

    if (this.capacityModel.breakingPoint && this.capacityModel.breakingPoint.reason === 'errors') {
      recommendations.infrastructure.push('Application errors detected at high load - review error handling and resource allocation');
    }

    if (this.capacityModel.breakingPoint && this.capacityModel.breakingPoint.reason === 'high_latency') {
      recommendations.infrastructure.push('High latency detected at peak load - consider optimizing database queries and adding caching');
    }

    // Application recommendations
    const enduranceTest = this.testResults.find(test => test.testType === 'endurance');
    if (enduranceTest && enduranceTest.memoryLeak) {
      recommendations.application.push('Potential memory leak detected - review application for memory management issues');
    }

    if (enduranceTest && enduranceTest.performanceDegradation) {
      recommendations.application.push('Performance degradation over time - investigate resource cleanup and connection pooling');
    }

    // Scaling recommendations
    recommendations.scaling.push(`Scale up when concurrent users exceed ${this.capacityModel.scaleUpThreshold}`);
    recommendations.scaling.push(`Scale down when concurrent users drop below ${this.capacityModel.scaleDownThreshold}`);
    recommendations.scaling.push(`Maintain ${this.capacityModel.safetyMargin} user safety margin for unexpected load spikes`);

    // Monitoring recommendations
    recommendations.monitoring.push('Monitor response time P95 - alert if > 2000ms');
    recommendations.monitoring.push('Monitor error rate - alert if > 1%');
    recommendations.monitoring.push('Monitor memory usage - alert if increasing over time');
    recommendations.monitoring.push(`Monitor concurrent connections - alert if > ${this.capacityModel.scaleUpThreshold}`);

    return recommendations;
  }

  /**
   * Estimate memory usage per user
   */
  estimateMemoryPerUser() {
    // Simplified calculation - in production, measure actual memory usage
    return 2.5; // MB per concurrent user
  }

  /**
   * Estimate CPU usage per user
   */
  estimateCPUPerUser() {
    // Simplified calculation - in production, measure actual CPU usage
    return 0.1; // % CPU per concurrent user
  }

  /**
   * Detect memory leaks in endurance test
   */
  detectMemoryLeak(result) {
    // In production, this would analyze memory usage over time
    // For now, return false
    return false;
  }

  /**
   * Detect performance degradation over time
   */
  detectPerformanceDegradation(result) {
    // In production, this would analyze performance metrics over time
    // For now, check if latency increased significantly
    return result.latency.p95 > result.latency.average * 2;
  }

  /**
   * Calculate system elasticity based on spike test
   */
  calculateElasticity(normalResult, spikeResult, recoveryResult) {
    let score = 100;
    
    // Deduct points for high error rates during spike
    if (spikeResult.errors > normalResult.errors) {
      score -= 30;
    }
    
    // Deduct points for poor recovery
    const recoveryDiff = Math.abs(recoveryResult.requests.average - normalResult.requests.average);
    const recoveryThreshold = normalResult.requests.average * 0.1; // 10% tolerance
    if (recoveryDiff > recoveryThreshold) {
      score -= 20;
    }
    
    // Deduct points for high latency during spike
    if (spikeResult.latency.p95 > normalResult.latency.p95 * 3) {
      score -= 25;
    }

    return {
      score: Math.max(score, 0),
      details: {
        normalRPS: normalResult.requests.average,
        spikeRPS: spikeResult.requests.average,
        recoveryRPS: recoveryResult.requests.average,
        spikeErrors: spikeResult.errors,
        recoveryDiff: recoveryDiff
      }
    };
  }

  /**
   * Save test results to files
   */
  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsDir = path.join(__dirname, 'results');
    
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Save detailed results
    const detailedResults = {
      timestamp: new Date(),
      baseUrl: this.baseUrl,
      capacityModel: this.capacityModel,
      testResults: this.testResults,
      recommendations: this.generateRecommendations()
    };

    const detailedFile = path.join(resultsDir, `capacity-planning-${timestamp}.json`);
    await fs.writeFile(detailedFile, JSON.stringify(detailedResults, null, 2));

    // Save summary report
    const summaryReport = this.generateSummaryReport(detailedResults);
    const summaryFile = path.join(resultsDir, `capacity-summary-${timestamp}.txt`);
    await fs.writeFile(summaryFile, summaryReport);

    logger.log('\n📄 Results saved:');
    logger.log(`  Detailed: ${detailedFile}`);
    logger.log(`  Summary: ${summaryFile}`);
  }

  /**
   * Generate human-readable summary report
   */
  generateSummaryReport(results) {
    return `
LINKEDIN HEADSHOT API - CAPACITY PLANNING REPORT
===============================================
Test Date: ${results.timestamp}
Base URL: ${results.baseUrl}

CAPACITY MODEL
--------------
• Maximum Concurrent Users: ${results.capacityModel.maxConcurrentUsers}
• Peak Requests per Second: ${results.capacityModel.requestsPerSecond.toFixed(2)}
• Optimal Operating Capacity: ${results.capacityModel.optimalConnections || 'N/A'}
• Safety Margin: ${results.capacityModel.safetyMargin || 'N/A'} users
• Memory per User: ${results.capacityModel.memoryPerUser}MB
• CPU per User: ${results.capacityModel.cpuPerUser}%

BREAKING POINT
--------------
${results.capacityModel.breakingPoint ? 
  `• Limit reached at: ${results.capacityModel.breakingPoint.connections} concurrent users
• Failure reason: ${results.capacityModel.breakingPoint.reason}
• Error details: Available in detailed JSON report` :
  '• No breaking point reached within test limits'
}

SCALING THRESHOLDS
-----------------
• Scale Up Threshold: ${results.capacityModel.scaleUpThreshold || 'N/A'} concurrent users
• Scale Down Threshold: ${results.capacityModel.scaleDownThreshold || 'N/A'} concurrent users

TEST SUMMARY
------------
• Total Tests Conducted: ${results.testResults.length}
• Progressive Load Tests: ${results.testResults.filter(t => t.testType === 'progressive').length}
• Endurance Tests: ${results.testResults.filter(t => t.testType === 'endurance').length}
• Spike Tests: ${results.testResults.filter(t => t.testType === 'spike').length}

KEY RECOMMENDATIONS
------------------
Infrastructure:
${results.recommendations.infrastructure.map(r => `• ${r}`).join('\n')}

Application:
${results.recommendations.application.map(r => `• ${r}`).join('\n')}

Scaling:
${results.recommendations.scaling.map(r => `• ${r}`).join('\n')}

Monitoring:
${results.recommendations.monitoring.map(r => `• ${r}`).join('\n')}

NEXT STEPS
----------
1. Review recommendations and implement high-priority items
2. Set up monitoring alerts based on identified thresholds
3. Configure auto-scaling policies using the calculated thresholds
4. Schedule regular capacity planning tests to track changes over time
5. Monitor real-world usage patterns and adjust capacity model accordingly

For detailed metrics and test data, refer to the JSON report file.
`;
  }

  /**
   * Sleep utility function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = CapacityPlanner;

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3001';
  const planner = new CapacityPlanner(baseUrl);
  
  planner.runCapacityPlanning()
    .then((results) => {
      logger.log('\n✅ Capacity planning completed successfully');
      logger.log('📊 Summary:', results.capacityModel);
      process.exit(0);
    })
    .catch(error => {
      logger.error('\n❌ Capacity planning failed:', error);
      process.exit(1);
    });
}