/**
 * OmniShot Comprehensive Performance Testing Suite
 * Tests backend API, load performance, stress testing, and bottleneck analysis
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class PerformanceTestSuite {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {},
      apiTests: [],
      loadTests: [],
      stressTests: [],
      bottlenecks: [],
      recommendations: []
    };
    this.testStartTime = Date.now();
  }

  async initialize() {
    console.log('🚀 Initializing OmniShot Performance Testing Suite...\n');
    
    // Create performance-testing directory if it doesn't exist
    const testDir = path.dirname(__filename);
    try {
      await fs.access(testDir);
    } catch {
      await fs.mkdir(testDir, { recursive: true });
    }
  }

  async runFullPerformanceAnalysis() {
    await this.initialize();
    
    console.log('📊 Starting Comprehensive Performance Analysis...\n');
    
    try {
      // 1. API Response Time Analysis
      await this.testAPIResponseTimes();
      
      // 2. Load Testing
      await this.runLoadTests();
      
      // 3. Stress Testing
      await this.runStressTests();
      
      // 4. Health Status Analysis
      await this.analyzeHealthStatus();
      
      // 5. Bottleneck Identification
      await this.identifyBottlenecks();
      
      // 6. Generate recommendations
      this.generateRecommendations();
      
      // 7. Save results
      await this.saveResults();
      
      // 8. Display summary
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Performance testing failed:', error);
      this.results.error = error.message;
    }
  }

  async testAPIResponseTimes() {
    console.log('🔍 Testing API Response Times...');
    
    const endpoints = [
      { name: 'Health Check', url: '/health', method: 'GET' },
      { name: 'Platform Specs', url: '/api/v1/platforms', method: 'GET' },
      { name: 'Available Styles', url: '/api/v1/styles', method: 'GET' },
      { name: 'Cost Estimation', url: '/api/v1/estimate-cost', method: 'POST', data: {
        platforms: ['linkedin', 'instagram'],
        style: 'professional',
        options: {}
      }},
      { name: 'Metrics', url: '/api/v1/metrics', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      const testResults = await this.testEndpointPerformance(endpoint, 10);
      this.results.apiTests.push(testResults);
    }
    
    console.log('✅ API Response Time Testing Complete\n');
  }

  async testEndpointPerformance(endpoint, iterations = 10) {
    const results = {
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      iterations,
      responseTimes: [],
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      errors: []
    };

    console.log(`  Testing ${endpoint.name} (${iterations} iterations)...`);

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        const response = await this.makeRequest(endpoint);
        const responseTime = Date.now() - startTime;
        
        results.responseTimes.push(responseTime);
        results.successCount++;
        
        if (responseTime < results.minResponseTime) results.minResponseTime = responseTime;
        if (responseTime > results.maxResponseTime) results.maxResponseTime = responseTime;
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.responseTimes.push(responseTime);
        results.errorCount++;
        results.errors.push({
          iteration: i + 1,
          error: error.message,
          responseTime
        });
      }
    }

    // Calculate statistics
    results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
    
    const sortedTimes = results.responseTimes.sort((a, b) => a - b);
    results.p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    
    results.successRate = (results.successCount / iterations) * 100;

    console.log(`    ✓ Avg: ${results.averageResponseTime.toFixed(2)}ms | P95: ${results.p95ResponseTime}ms | Success: ${results.successRate.toFixed(1)}%`);

    return results;
  }

  async runLoadTests() {
    console.log('⚡ Running Load Tests...');
    
    const loadScenarios = [
      { name: 'Light Load', concurrentUsers: 5, duration: 30000 },
      { name: 'Normal Load', concurrentUsers: 15, duration: 45000 },
      { name: 'Peak Load', concurrentUsers: 30, duration: 60000 }
    ];

    for (const scenario of loadScenarios) {
      const loadTestResult = await this.executeLoadTest(scenario);
      this.results.loadTests.push(loadTestResult);
    }
    
    console.log('✅ Load Testing Complete\n');
  }

  async executeLoadTest(scenario) {
    console.log(`  Executing ${scenario.name} (${scenario.concurrentUsers} users, ${scenario.duration}ms)...`);
    
    const results = {
      scenario: scenario.name,
      concurrentUsers: scenario.concurrentUsers,
      duration: scenario.duration,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      throughput: 0,
      responseTimes: [],
      errors: []
    };

    const startTime = Date.now();
    const promises = [];

    // Create concurrent user simulations
    for (let i = 0; i < scenario.concurrentUsers; i++) {
      promises.push(this.simulateUserLoad(scenario.duration, results));
    }

    await Promise.all(promises);

    const totalTime = Date.now() - startTime;
    
    // Calculate metrics
    results.averageResponseTime = results.responseTimes.length > 0 
      ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
      : 0;
    
    results.throughput = (results.totalRequests / (totalTime / 1000)).toFixed(2); // requests per second
    results.successRate = ((results.successfulRequests / results.totalRequests) * 100).toFixed(2);

    console.log(`    ✓ Throughput: ${results.throughput} req/s | Success Rate: ${results.successRate}% | Avg Response: ${results.averageResponseTime.toFixed(2)}ms`);

    return results;
  }

  async simulateUserLoad(duration, results) {
    const endTime = Date.now() + duration;
    
    while (Date.now() < endTime) {
      const startTime = Date.now();
      
      try {
        // Simulate realistic user behavior
        const endpoint = this.getRandomEndpoint();
        await this.makeRequest(endpoint);
        
        const responseTime = Date.now() - startTime;
        results.responseTimes.push(responseTime);
        results.totalRequests++;
        results.successfulRequests++;
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.responseTimes.push(responseTime);
        results.totalRequests++;
        results.failedRequests++;
        results.errors.push(error.message);
      }
      
      // Random delay to simulate user think time
      await this.sleep(Math.random() * 1000 + 500);
    }
  }

  async runStressTests() {
    console.log('💥 Running Stress Tests...');
    
    const stressScenarios = [
      { name: 'High Concurrency', concurrentUsers: 50, duration: 30000 },
      { name: 'Extended Load', concurrentUsers: 25, duration: 120000 },
      { name: 'Burst Traffic', concurrentUsers: 100, duration: 15000 }
    ];

    for (const scenario of stressScenarios) {
      const stressTestResult = await this.executeStressTest(scenario);
      this.results.stressTests.push(stressTestResult);
    }
    
    console.log('✅ Stress Testing Complete\n');
  }

  async executeStressTest(scenario) {
    console.log(`  Executing ${scenario.name} stress test...`);
    
    const results = {
      scenario: scenario.name,
      concurrentUsers: scenario.concurrentUsers,
      duration: scenario.duration,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      serverErrors: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      responseTimes: [],
      errorTypes: {},
      systemBreakingPoint: null
    };

    const startTime = Date.now();
    const promises = [];

    // Create stress load
    for (let i = 0; i < scenario.concurrentUsers; i++) {
      promises.push(this.simulateStressLoad(scenario.duration, results));
    }

    await Promise.all(promises);

    // Calculate stress metrics
    results.averageResponseTime = results.responseTimes.length > 0 
      ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
      : 0;
    
    results.maxResponseTime = Math.max(...results.responseTimes, 0);
    results.failureRate = ((results.failedRequests / results.totalRequests) * 100).toFixed(2);
    
    // Determine if system reached breaking point
    if (results.failureRate > 50 || results.averageResponseTime > 10000) {
      results.systemBreakingPoint = {
        failureRate: results.failureRate,
        averageResponseTime: results.averageResponseTime,
        concurrentUsers: scenario.concurrentUsers
      };
    }

    console.log(`    ✓ Failure Rate: ${results.failureRate}% | Max Response: ${results.maxResponseTime}ms | Breaking Point: ${results.systemBreakingPoint ? 'YES' : 'NO'}`);

    return results;
  }

  async simulateStressLoad(duration, results) {
    const endTime = Date.now() + duration;
    
    while (Date.now() < endTime) {
      const startTime = Date.now();
      
      try {
        const endpoint = this.getRandomEndpoint();
        const response = await this.makeRequest(endpoint, 5000); // 5s timeout for stress test
        
        const responseTime = Date.now() - startTime;
        results.responseTimes.push(responseTime);
        results.totalRequests++;
        results.successfulRequests++;
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.responseTimes.push(responseTime);
        results.totalRequests++;
        results.failedRequests++;
        
        if (error.code === 'ECONNABORTED') {
          results.timeouts++;
        } else if (error.response && error.response.status >= 500) {
          results.serverErrors++;
        }
        
        const errorType = error.code || (error.response ? `HTTP_${error.response.status}` : 'UNKNOWN');
        results.errorTypes[errorType] = (results.errorTypes[errorType] || 0) + 1;
      }
      
      // Minimal delay for stress testing
      await this.sleep(Math.random() * 100);
    }
  }

  async analyzeHealthStatus() {
    console.log('🔍 Analyzing System Health Status...');
    
    try {
      const healthResponse = await this.makeRequest({
        name: 'Health Check Analysis',
        url: '/health',
        method: 'GET'
      });

      this.results.healthAnalysis = {
        status: healthResponse.data.status,
        services: healthResponse.data.services,
        environment: healthResponse.data.environment,
        timestamp: healthResponse.data.timestamp,
        httpStatus: healthResponse.status
      };

      console.log(`  System Status: ${this.results.healthAnalysis.status.toUpperCase()}`);
      
      if (this.results.healthAnalysis.services) {
        Object.entries(this.results.healthAnalysis.services).forEach(([service, status]) => {
          console.log(`    ${service}: ${status.status || 'unknown'}`);
        });
      }

    } catch (error) {
      this.results.healthAnalysis = {
        status: 'error',
        error: error.message,
        httpStatus: error.response ? error.response.status : 0
      };
      console.log(`  ❌ Health check failed: ${error.message}`);
    }
    
    console.log('✅ Health Status Analysis Complete\n');
  }

  async identifyBottlenecks() {
    console.log('🎯 Identifying Performance Bottlenecks...');
    
    const bottlenecks = [];

    // Analyze API response times
    this.results.apiTests.forEach(test => {
      if (test.averageResponseTime > 1000) {
        bottlenecks.push({
          type: 'Slow API Endpoint',
          endpoint: test.name,
          issue: `Average response time of ${test.averageResponseTime.toFixed(2)}ms exceeds 1000ms threshold`,
          severity: test.averageResponseTime > 3000 ? 'HIGH' : 'MEDIUM'
        });
      }

      if (test.successRate < 95) {
        bottlenecks.push({
          type: 'API Reliability Issue',
          endpoint: test.name,
          issue: `Success rate of ${test.successRate.toFixed(1)}% is below 95% threshold`,
          severity: test.successRate < 80 ? 'HIGH' : 'MEDIUM'
        });
      }
    });

    // Analyze load test performance
    this.results.loadTests.forEach(test => {
      if (parseFloat(test.throughput) < 10) {
        bottlenecks.push({
          type: 'Low Throughput',
          scenario: test.scenario,
          issue: `Throughput of ${test.throughput} req/s is below expected 10 req/s minimum`,
          severity: 'MEDIUM'
        });
      }

      if (parseFloat(test.successRate) < 95) {
        bottlenecks.push({
          type: 'Load Test Failures',
          scenario: test.scenario,
          issue: `Success rate of ${test.successRate}% under load indicates system instability`,
          severity: 'HIGH'
        });
      }
    });

    // Analyze stress test results
    this.results.stressTests.forEach(test => {
      if (test.systemBreakingPoint) {
        bottlenecks.push({
          type: 'System Breaking Point',
          scenario: test.scenario,
          issue: `System reached breaking point at ${test.concurrentUsers} concurrent users`,
          severity: 'HIGH',
          details: test.systemBreakingPoint
        });
      }
    });

    // Analyze health status
    if (this.results.healthAnalysis && this.results.healthAnalysis.status !== 'healthy') {
      bottlenecks.push({
        type: 'System Health Issue',
        issue: `System health status is '${this.results.healthAnalysis.status}' instead of 'healthy'`,
        severity: 'HIGH'
      });
    }

    this.results.bottlenecks = bottlenecks;
    
    console.log(`  Found ${bottlenecks.length} potential bottlenecks:`);
    bottlenecks.forEach((bottleneck, index) => {
      console.log(`    ${index + 1}. [${bottleneck.severity}] ${bottleneck.type}: ${bottleneck.issue}`);
    });
    
    console.log('✅ Bottleneck Analysis Complete\n');
  }

  generateRecommendations() {
    console.log('💡 Generating Performance Recommendations...');
    
    const recommendations = [];

    // Health-based recommendations
    if (this.results.healthAnalysis && this.results.healthAnalysis.status !== 'healthy') {
      recommendations.push({
        priority: 'HIGH',
        category: 'System Health',
        recommendation: 'Investigate and resolve health check failures',
        impact: 'Critical for system reliability',
        implementation: [
          'Check service logs for error messages',
          'Verify database connectivity',
          'Ensure all dependencies are running',
          'Review monitoring alerts'
        ]
      });
    }

    // API performance recommendations
    const slowEndpoints = this.results.apiTests.filter(test => test.averageResponseTime > 1000);
    if (slowEndpoints.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'API Performance',
        recommendation: 'Optimize slow API endpoints',
        impact: 'Improve user experience and reduce server load',
        implementation: [
          'Add database query optimization and indexing',
          'Implement response caching for frequently accessed data',
          'Add database connection pooling',
          'Consider API response compression',
          'Implement pagination for large datasets'
        ]
      });
    }

    // Load handling recommendations
    const lowThroughputTests = this.results.loadTests.filter(test => parseFloat(test.throughput) < 10);
    if (lowThroughputTests.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Load Handling',
        recommendation: 'Improve system throughput capacity',
        impact: 'Better performance under normal and peak loads',
        implementation: [
          'Implement horizontal scaling with load balancers',
          'Add Redis caching layer',
          'Optimize database queries and add read replicas',
          'Implement async processing for heavy operations',
          'Add CPU and memory monitoring'
        ]
      });
    }

    // Stress test recommendations
    const breakingPointTests = this.results.stressTests.filter(test => test.systemBreakingPoint);
    if (breakingPointTests.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Scalability',
        recommendation: 'Address system breaking points and improve resilience',
        impact: 'Prevent system failures during traffic spikes',
        implementation: [
          'Implement circuit breaker patterns',
          'Add request rate limiting',
          'Implement auto-scaling infrastructure',
          'Add graceful degradation for non-critical features',
          'Implement queue-based processing for heavy operations'
        ]
      });
    }

    // Image processing specific recommendations
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Image Processing',
      recommendation: 'Optimize image processing pipeline performance',
      impact: 'Reduce processing time and resource usage',
      implementation: [
        'Implement image processing queues with background workers',
        'Add image caching and CDN integration',
        'Optimize image formats and compression',
        'Implement progressive processing for large files',
        'Add processing status tracking and user notifications'
      ]
    });

    // Mobile app recommendations
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Mobile Performance',
      recommendation: 'Optimize mobile app performance and user experience',
      impact: 'Improve app startup time and responsiveness',
      implementation: [
        'Implement lazy loading for non-critical components',
        'Add image preloading and caching strategies',
        'Optimize network requests with batching and compression',
        'Implement offline functionality with local storage',
        'Add performance monitoring for real user metrics'
      ]
    });

    // Monitoring recommendations
    recommendations.push({
      priority: 'LOW',
      category: 'Monitoring',
      recommendation: 'Enhance performance monitoring and alerting',
      impact: 'Proactive issue detection and faster resolution',
      implementation: [
        'Add comprehensive application performance monitoring (APM)',
        'Implement real-time error tracking and alerting',
        'Add custom metrics for business-critical operations',
        'Create performance dashboards and reports',
        'Set up automated performance regression testing'
      ]
    });

    this.results.recommendations = recommendations;
    
    console.log(`  Generated ${recommendations.length} recommendations:`);
    recommendations.forEach((rec, index) => {
      console.log(`    ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.recommendation}`);
    });
    
    console.log('✅ Recommendations Generated\n');
  }

  getRandomEndpoint() {
    const endpoints = [
      { name: 'Health Check', url: '/health', method: 'GET' },
      { name: 'Platform Specs', url: '/api/v1/platforms', method: 'GET' },
      { name: 'Available Styles', url: '/api/v1/styles', method: 'GET' },
      { name: 'Metrics', url: '/api/v1/metrics', method: 'GET' }
    ];
    
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }

  async makeRequest(endpoint, timeout = 10000) {
    const config = {
      method: endpoint.method,
      url: `${this.baseURL}${endpoint.url}`,
      timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (endpoint.data) {
      config.data = endpoint.data;
    }

    return await axios(config);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-test-results-${timestamp}.json`;
    const filepath = path.join(path.dirname(__filename), filename);
    
    // Calculate summary
    this.results.summary = {
      totalTestDuration: Date.now() - this.testStartTime,
      apiEndpointsTested: this.results.apiTests.length,
      loadScenariosExecuted: this.results.loadTests.length,
      stressScenariosExecuted: this.results.stressTests.length,
      bottlenecksIdentified: this.results.bottlenecks.length,
      recommendationsGenerated: this.results.recommendations.length,
      systemHealthStatus: this.results.healthAnalysis ? this.results.healthAnalysis.status : 'unknown'
    };

    await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
    console.log(`📁 Results saved to: ${filepath}`);
  }

  displaySummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 OMNISHOT PERFORMANCE TESTING SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`🕒 Test Duration: ${(this.results.summary.totalTestDuration / 1000).toFixed(2)} seconds`);
    console.log(`🏥 System Health: ${this.results.summary.systemHealthStatus.toUpperCase()}`);
    console.log(`🎯 API Endpoints Tested: ${this.results.summary.apiEndpointsTested}`);
    console.log(`⚡ Load Scenarios: ${this.results.summary.loadScenariosExecuted}`);
    console.log(`💥 Stress Scenarios: ${this.results.summary.stressScenariosExecuted}`);
    console.log(`🎯 Bottlenecks Found: ${this.results.summary.bottlenecksIdentified}`);
    console.log(`💡 Recommendations: ${this.results.summary.recommendationsGenerated}`);
    
    if (this.results.bottlenecks.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.results.bottlenecks
        .filter(b => b.severity === 'HIGH')
        .forEach((bottleneck, index) => {
          console.log(`  ${index + 1}. ${bottleneck.type}: ${bottleneck.issue}`);
        });
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS:');
      this.results.recommendations
        .filter(r => r.priority === 'HIGH')
        .slice(0, 3)
        .forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec.category}: ${rec.recommendation}`);
        });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 Performance testing complete! Review the detailed results file for full analysis.');
    console.log('='.repeat(80) + '\n');
  }
}

// Export for use as module
module.exports = PerformanceTestSuite;

// Run if executed directly
if (require.main === module) {
  const testSuite = new PerformanceTestSuite();
  testSuite.runFullPerformanceAnalysis().catch(console.error);
}