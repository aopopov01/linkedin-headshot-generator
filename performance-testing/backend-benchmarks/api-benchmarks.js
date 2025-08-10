/**
 * Backend API Performance Benchmarking Suite
 * Comprehensive testing of all API endpoints with detailed performance metrics
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

class APIBenchmarkSuite {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.results = {};
    this.testImage = this.generateTestImage();
  }

  /**
   * Run comprehensive API benchmarks
   */
  async runBenchmarks() {
    console.log('🚀 Starting API Performance Benchmarks');
    console.log(`📊 Target URL: ${this.baseUrl}`);
    
    try {
      // Health check first
      await this.benchmarkHealthCheck();
      
      // Authentication endpoints
      await this.benchmarkAuthentication();
      
      // User management endpoints
      await this.benchmarkUserManagement();
      
      // Photo processing endpoints
      await this.benchmarkPhotoProcessing();
      
      // Analytics endpoints
      await this.benchmarkAnalytics();
      
      // Generate comprehensive report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Benchmark suite failed:', error);
      throw error;
    }
  }

  /**
   * Benchmark health check endpoint
   */
  async benchmarkHealthCheck() {
    console.log('\n🔍 Testing Health Check Endpoint...');
    
    const result = await autocannon({
      url: `${this.baseUrl}/health`,
      connections: 50,
      duration: 30,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.results.healthCheck = {
      ...this.extractMetrics(result),
      endpoint: '/health',
      method: 'GET'
    };

    console.log(`✅ Health Check: ${result.requests.average.toFixed(2)} req/sec`);
  }

  /**
   * Benchmark authentication endpoints
   */
  async benchmarkAuthentication() {
    console.log('\n🔐 Testing Authentication Endpoints...');
    
    // Login endpoint benchmark
    const loginResult = await autocannon({
      url: `${this.baseUrl}/api/auth/login`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!'
      }),
      connections: 20,
      duration: 30
    });

    this.results.authLogin = {
      ...this.extractMetrics(loginResult),
      endpoint: '/api/auth/login',
      method: 'POST'
    };

    // Register endpoint benchmark
    const registerResult = await autocannon({
      url: `${this.baseUrl}/api/auth/register`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User'
      }),
      connections: 10,
      duration: 30
    });

    this.results.authRegister = {
      ...this.extractMetrics(registerResult),
      endpoint: '/api/auth/register',
      method: 'POST'
    };

    console.log(`✅ Login: ${loginResult.requests.average.toFixed(2)} req/sec`);
    console.log(`✅ Register: ${registerResult.requests.average.toFixed(2)} req/sec`);
  }

  /**
   * Benchmark user management endpoints
   */
  async benchmarkUserManagement() {
    console.log('\n👤 Testing User Management Endpoints...');
    
    const profileResult = await autocannon({
      url: `${this.baseUrl}/api/users/profile`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      connections: 30,
      duration: 30
    });

    this.results.userProfile = {
      ...this.extractMetrics(profileResult),
      endpoint: '/api/users/profile',
      method: 'GET'
    };

    console.log(`✅ User Profile: ${profileResult.requests.average.toFixed(2)} req/sec`);
  }

  /**
   * Benchmark photo processing endpoints
   */
  async benchmarkPhotoProcessing() {
    console.log('\n📸 Testing Photo Processing Endpoints...');
    
    // Photo generation endpoint
    const generateResult = await autocannon({
      url: `${this.baseUrl}/api/photos/generate`,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: this.testImage,
        styleTemplate: 'corporate',
        numOutputs: 4
      }),
      connections: 5, // Lower connections for heavy endpoint
      duration: 30
    });

    this.results.photoGenerate = {
      ...this.extractMetrics(generateResult),
      endpoint: '/api/photos/generate',
      method: 'POST'
    };

    // Photo status check endpoint
    const statusResult = await autocannon({
      url: `${this.baseUrl}/api/photos/status/mock-prediction-id`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      connections: 20,
      duration: 30
    });

    this.results.photoStatus = {
      ...this.extractMetrics(statusResult),
      endpoint: '/api/photos/status/:id',
      method: 'GET'
    };

    console.log(`✅ Photo Generate: ${generateResult.requests.average.toFixed(2)} req/sec`);
    console.log(`✅ Photo Status: ${statusResult.requests.average.toFixed(2)} req/sec`);
  }

  /**
   * Benchmark analytics endpoints
   */
  async benchmarkAnalytics() {
    console.log('\n📊 Testing Analytics Endpoints...');
    
    const trackResult = await autocannon({
      url: `${this.baseUrl}/api/analytics/track`,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'benchmark_test',
        properties: {
          test: true,
          timestamp: Date.now()
        }
      }),
      connections: 25,
      duration: 30
    });

    this.results.analyticsTrack = {
      ...this.extractMetrics(trackResult),
      endpoint: '/api/analytics/track',
      method: 'POST'
    };

    console.log(`✅ Analytics Track: ${trackResult.requests.average.toFixed(2)} req/sec`);
  }

  /**
   * Extract relevant metrics from autocannon results
   */
  extractMetrics(result) {
    return {
      requestsPerSecond: result.requests.average,
      throughputBytes: result.throughput.average,
      latencyMs: {
        average: result.latency.average,
        p50: result.latency.p50,
        p95: result.latency.p95,
        p99: result.latency.p99,
        max: result.latency.max
      },
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result.non2xx,
      duration: result.duration,
      connections: result.connections
    };
  }

  /**
   * Generate test image for photo processing benchmarks
   */
  generateTestImage() {
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport() {
    const timestamp = new Date().toISOString();
    const reportData = {
      timestamp,
      baseUrl: this.baseUrl,
      results: this.results,
      summary: this.generateSummary()
    };

    // Save detailed JSON report
    const reportPath = path.join(__dirname, `api-benchmark-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // Generate and save text report
    const textReport = this.generateTextReport(reportData);
    const textReportPath = path.join(__dirname, `api-benchmark-report-${Date.now()}.txt`);
    fs.writeFileSync(textReportPath, textReport);

    console.log('\n📋 PERFORMANCE BENCHMARK REPORT');
    console.log('=====================================');
    console.log(textReport);
    console.log(`\n💾 Detailed reports saved:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Text: ${textReportPath}`);
  }

  /**
   * Generate performance summary
   */
  generateSummary() {
    const allEndpoints = Object.values(this.results);
    
    return {
      totalEndpointsTested: allEndpoints.length,
      averageRequestsPerSecond: allEndpoints.reduce((sum, result) => sum + result.requestsPerSecond, 0) / allEndpoints.length,
      averageLatency: allEndpoints.reduce((sum, result) => sum + result.latencyMs.average, 0) / allEndpoints.length,
      totalErrors: allEndpoints.reduce((sum, result) => sum + result.errors, 0),
      slowestEndpoint: allEndpoints.reduce((slowest, current) => 
        current.latencyMs.average > slowest.latencyMs.average ? current : slowest
      ),
      fastestEndpoint: allEndpoints.reduce((fastest, current) => 
        current.latencyMs.average < fastest.latencyMs.average ? current : fastest
      )
    };
  }

  /**
   * Generate human-readable text report
   */
  generateTextReport(reportData) {
    const { results, summary } = reportData;
    
    let report = `
API PERFORMANCE BENCHMARK RESULTS
=================================
Test Date: ${reportData.timestamp}
Base URL: ${reportData.baseUrl}

OVERALL SUMMARY
--------------
• Total Endpoints Tested: ${summary.totalEndpointsTested}
• Average Requests/sec: ${summary.averageRequestsPerSecond.toFixed(2)}
• Average Latency: ${summary.averageLatency.toFixed(2)}ms
• Total Errors: ${summary.totalErrors}

ENDPOINT PERFORMANCE BREAKDOWN
-----------------------------
`;

    Object.entries(results).forEach(([key, result]) => {
      report += `
${result.method} ${result.endpoint}
• Requests/sec: ${result.requestsPerSecond.toFixed(2)}
• Avg Latency: ${result.latencyMs.average.toFixed(2)}ms
• P95 Latency: ${result.latencyMs.p95.toFixed(2)}ms
• P99 Latency: ${result.latencyMs.p99.toFixed(2)}ms
• Errors: ${result.errors}
• Timeouts: ${result.timeouts}
`;
    });

    report += `
PERFORMANCE INSIGHTS
-------------------
🚀 Fastest Endpoint: ${summary.fastestEndpoint.method} ${summary.fastestEndpoint.endpoint} 
   (${summary.fastestEndpoint.latencyMs.average.toFixed(2)}ms avg)
   
🐌 Slowest Endpoint: ${summary.slowestEndpoint.method} ${summary.slowestEndpoint.endpoint}
   (${summary.slowestEndpoint.latencyMs.average.toFixed(2)}ms avg)

RECOMMENDATIONS
--------------
${this.generateRecommendations(summary, results)}
`;

    return report;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(summary, results) {
    const recommendations = [];
    
    // High latency recommendations
    Object.values(results).forEach(result => {
      if (result.latencyMs.average > 1000) {
        recommendations.push(`• Optimize ${result.endpoint} - high average latency (${result.latencyMs.average.toFixed(2)}ms)`);
      }
      if (result.latencyMs.p95 > 2000) {
        recommendations.push(`• Investigate ${result.endpoint} - P95 latency exceeds 2s (${result.latencyMs.p95.toFixed(2)}ms)`);
      }
    });

    // Error rate recommendations
    Object.values(results).forEach(result => {
      if (result.errors > 0) {
        recommendations.push(`• Fix errors in ${result.endpoint} - ${result.errors} errors detected`);
      }
    });

    // Throughput recommendations
    if (summary.averageRequestsPerSecond < 100) {
      recommendations.push('• Consider scaling infrastructure - low overall throughput');
    }

    if (results.photoGenerate && results.photoGenerate.requestsPerSecond < 1) {
      recommendations.push('• Optimize image processing pipeline - very low throughput');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('• Performance looks healthy! Monitor trends over time.');
      recommendations.push('• Consider implementing caching for frequently accessed endpoints.');
    }

    return recommendations.join('\n');
  }
}

module.exports = APIBenchmarkSuite;

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3001';
  const benchmarkSuite = new APIBenchmarkSuite(baseUrl);
  
  benchmarkSuite.runBenchmarks()
    .then(() => {
      console.log('\n✅ Benchmark suite completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Benchmark suite failed:', error);
      process.exit(1);
    });
}