/**
 * Focused API Health and Performance Analysis
 * Deep dive into specific API endpoint issues
 */

const axios = require('axios');
const fs = require('fs').promises;

class APIHealthAnalysis {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.results = {
      timestamp: new Date().toISOString(),
      endpointAnalysis: {},
      healthStatus: {},
      performanceMetrics: {},
      criticalIssues: [],
      recommendations: []
    };
  }

  async runFocusedAnalysis() {
    console.log('🔍 Starting Focused API Health Analysis...\n');
    
    try {
      await this.testHealthEndpoint();
      await this.testWorkingEndpoints();
      await this.testFailingEndpoints();
      await this.analyzeSystemHealth();
      await this.identifyCriticalIssues();
      this.generateActionableRecommendations();
      await this.saveResults();
      this.displayCriticalFindings();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    }
  }

  async testHealthEndpoint() {
    console.log('🏥 Analyzing Health Endpoint...');
    
    const healthResults = {
      endpoint: '/health',
      attempts: 10,
      results: [],
      patterns: {},
      issues: []
    };

    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      
      try {
        const response = await axios.get(`${this.baseURL}/health`, {
          timeout: 5000,
          validateStatus: () => true // Accept all status codes
        });
        
        const responseTime = Date.now() - startTime;
        
        const result = {
          attempt: i + 1,
          status: response.status,
          responseTime,
          data: response.data,
          success: response.status === 200
        };
        
        healthResults.results.push(result);
        
        console.log(`  Attempt ${i + 1}: ${response.status} (${responseTime}ms) - ${response.data?.status || 'no status'}`);
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        const result = {
          attempt: i + 1,
          status: 'ERROR',
          responseTime,
          error: error.message,
          success: false
        };
        
        healthResults.results.push(result);
        console.log(`  Attempt ${i + 1}: ERROR (${responseTime}ms) - ${error.message}`);
      }
      
      await this.sleep(500); // Half second between tests
    }

    // Analyze patterns
    const statusCounts = {};
    healthResults.results.forEach(result => {
      const status = result.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    healthResults.patterns = {
      statusDistribution: statusCounts,
      successRate: (healthResults.results.filter(r => r.success).length / 10) * 100,
      averageResponseTime: healthResults.results.reduce((sum, r) => sum + r.responseTime, 0) / 10,
      consistentFailure: statusCounts['503'] > 5,
      intermittentFailure: statusCounts['503'] > 0 && statusCounts['503'] < 10
    };

    // Identify issues
    if (healthResults.patterns.consistentFailure) {
      healthResults.issues.push('Health endpoint consistently returning 503 (Service Unavailable)');
    }
    
    if (healthResults.patterns.intermittentFailure) {
      healthResults.issues.push('Health endpoint showing intermittent failures');
    }

    this.results.endpointAnalysis.health = healthResults;
    console.log(`  ✓ Success Rate: ${healthResults.patterns.successRate}%`);
    console.log(`  ✓ Average Response Time: ${healthResults.patterns.averageResponseTime.toFixed(2)}ms`);
    console.log(`  ✓ Issues Found: ${healthResults.issues.length}\n`);
  }

  async testWorkingEndpoints() {
    console.log('✅ Testing Known Working Endpoints...');
    
    const workingEndpoints = [
      { name: 'Platforms', url: '/api/v1/platforms' },
      { name: 'Styles', url: '/api/v1/styles' },
      { name: 'Metrics', url: '/api/v1/metrics' }
    ];

    for (const endpoint of workingEndpoints) {
      const results = await this.testEndpointStability(endpoint.url, endpoint.name, 5);
      this.results.endpointAnalysis[endpoint.name.toLowerCase()] = results;
      
      console.log(`  ${endpoint.name}: ${results.successRate}% success, ${results.averageResponseTime.toFixed(2)}ms avg`);
    }
    console.log();
  }

  async testFailingEndpoints() {
    console.log('❌ Testing Potentially Failing Endpoints...');
    
    const testEndpoints = [
      { 
        name: 'Optimize', 
        url: '/api/v1/optimize',
        method: 'POST',
        data: {
          imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 PNG
          platforms: ['linkedin', 'instagram'],
          style: 'professional'
        }
      },
      {
        name: 'Cost Estimation',
        url: '/api/v1/estimate-cost',
        method: 'POST',
        data: {
          platforms: ['linkedin'],
          style: 'professional'
        }
      }
    ];

    for (const endpoint of testEndpoints) {
      const results = await this.testEndpointStability(endpoint.url, endpoint.name, 3, endpoint.method, endpoint.data);
      this.results.endpointAnalysis[endpoint.name.toLowerCase().replace(' ', '_')] = results;
      
      console.log(`  ${endpoint.name}: ${results.successRate}% success, ${results.averageResponseTime.toFixed(2)}ms avg`);
      
      if (results.commonErrors.length > 0) {
        console.log(`    Common errors: ${results.commonErrors.slice(0, 2).join(', ')}`);
      }
    }
    console.log();
  }

  async testEndpointStability(url, name, attempts = 5, method = 'GET', data = null) {
    const results = {
      endpoint: url,
      name,
      attempts,
      responses: [],
      successRate: 0,
      averageResponseTime: 0,
      commonErrors: [],
      statusCodes: {}
    };

    for (let i = 0; i < attempts; i++) {
      const startTime = Date.now();
      
      try {
        const config = {
          method,
          url: `${this.baseURL}${url}`,
          timeout: 10000,
          validateStatus: () => true
        };

        if (data && method === 'POST') {
          config.data = data;
          config.headers = { 'Content-Type': 'application/json' };
        }

        const response = await axios(config);
        const responseTime = Date.now() - startTime;
        
        results.responses.push({
          attempt: i + 1,
          status: response.status,
          responseTime,
          success: response.status >= 200 && response.status < 300,
          dataReceived: !!response.data
        });

        results.statusCodes[response.status] = (results.statusCodes[response.status] || 0) + 1;
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        results.responses.push({
          attempt: i + 1,
          status: 'ERROR',
          responseTime,
          error: error.message,
          success: false
        });

        results.commonErrors.push(error.message);
      }
      
      await this.sleep(200);
    }

    results.successRate = (results.responses.filter(r => r.success).length / attempts) * 100;
    results.averageResponseTime = results.responses.reduce((sum, r) => sum + r.responseTime, 0) / attempts;
    
    // Count unique error messages
    const errorCounts = {};
    results.commonErrors.forEach(error => {
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });
    
    results.commonErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([error]) => error);

    return results;
  }

  async analyzeSystemHealth() {
    console.log('🔍 Analyzing System Health Patterns...');
    
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
        validateStatus: () => true
      });

      this.results.healthStatus = {
        lastCheckStatus: response.status,
        lastCheckData: response.data,
        systemStatus: response.data?.status || 'unknown',
        services: response.data?.services || {},
        environment: response.data?.environment || 'unknown'
      };

      // Analyze individual service health
      if (response.data?.services) {
        const serviceIssues = [];
        
        Object.entries(response.data.services).forEach(([serviceName, serviceData]) => {
          if (serviceData.status === 'degraded' || serviceData.status === 'unhealthy') {
            serviceIssues.push({
              service: serviceName,
              status: serviceData.status,
              issue: serviceData.message || 'Unknown issue'
            });
          }
        });

        this.results.healthStatus.serviceIssues = serviceIssues;
        
        console.log(`  System Status: ${this.results.healthStatus.systemStatus}`);
        console.log(`  Service Issues: ${serviceIssues.length}`);
        
        serviceIssues.forEach(issue => {
          console.log(`    - ${issue.service}: ${issue.status} (${issue.issue})`);
        });
      }

    } catch (error) {
      this.results.healthStatus = {
        error: error.message,
        accessible: false
      };
      console.log(`  ❌ Health endpoint not accessible: ${error.message}`);
    }
    
    console.log();
  }

  async identifyCriticalIssues() {
    console.log('🚨 Identifying Critical Issues...');
    
    const issues = [];

    // Check health endpoint reliability
    const healthAnalysis = this.results.endpointAnalysis.health;
    if (healthAnalysis && healthAnalysis.patterns.successRate < 50) {
      issues.push({
        severity: 'CRITICAL',
        category: 'System Health',
        issue: 'Health endpoint failing consistently',
        impact: 'System monitoring and load balancer health checks will fail',
        details: `Success rate: ${healthAnalysis.patterns.successRate}%`
      });
    }

    // Check for service degradation
    if (this.results.healthStatus.serviceIssues && this.results.healthStatus.serviceIssues.length > 0) {
      issues.push({
        severity: 'HIGH',
        category: 'Service Degradation',
        issue: 'Multiple services reporting degraded status',
        impact: 'Reduced system performance and reliability',
        details: this.results.healthStatus.serviceIssues.map(s => `${s.service}: ${s.status}`).join(', ')
      });
    }

    // Check for image processing failures
    const optimizeAnalysis = this.results.endpointAnalysis.optimize;
    if (optimizeAnalysis && optimizeAnalysis.successRate < 20) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Core Functionality',
        issue: 'Image optimization endpoint failing',
        impact: 'Primary app functionality unavailable to users',
        details: `Success rate: ${optimizeAnalysis.successRate}%`
      });
    }

    // Check for performance issues
    Object.entries(this.results.endpointAnalysis).forEach(([name, analysis]) => {
      if (analysis.averageResponseTime > 5000) {
        issues.push({
          severity: 'MEDIUM',
          category: 'Performance',
          issue: `${name} endpoint has slow response times`,
          impact: 'Poor user experience and potential timeouts',
          details: `Average response time: ${analysis.averageResponseTime.toFixed(2)}ms`
        });
      }
    });

    this.results.criticalIssues = issues;
    
    console.log(`  Found ${issues.length} critical issues:`);
    issues.forEach((issue, index) => {
      console.log(`    ${index + 1}. [${issue.severity}] ${issue.category}: ${issue.issue}`);
    });
    console.log();
  }

  generateActionableRecommendations() {
    console.log('💡 Generating Actionable Recommendations...');
    
    const recommendations = [];

    // Health endpoint recommendations
    const healthAnalysis = this.results.endpointAnalysis.health;
    if (healthAnalysis && healthAnalysis.patterns.successRate < 80) {
      recommendations.push({
        priority: 'IMMEDIATE',
        category: 'Health Monitoring',
        action: 'Fix health endpoint reliability',
        steps: [
          '1. Check all service dependencies (database, Redis, external APIs)',
          '2. Verify network connectivity between services',
          '3. Review health check timeout configurations',
          '4. Add retry logic to health check service calls',
          '5. Implement circuit breaker pattern for failing services'
        ],
        expectedOutcome: 'Health endpoint returns consistent 200 responses'
      });
    }

    // Service degradation recommendations
    if (this.results.healthStatus.serviceIssues && this.results.healthStatus.serviceIssues.length > 0) {
      this.results.healthStatus.serviceIssues.forEach(issue => {
        recommendations.push({
          priority: 'HIGH',
          category: 'Service Recovery',
          action: `Resolve ${issue.service} service degradation`,
          steps: [
            `1. Check ${issue.service} service logs for specific errors`,
            '2. Verify service dependencies and configurations',
            '3. Test service endpoints individually',
            '4. Restart service if necessary',
            '5. Monitor service recovery'
          ],
          expectedOutcome: `${issue.service} service returns to healthy status`
        });
      });
    }

    // Image processing recommendations
    const optimizeAnalysis = this.results.endpointAnalysis.optimize;
    if (optimizeAnalysis && optimizeAnalysis.commonErrors.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Image Processing',
        action: 'Fix image processing pipeline',
        steps: [
          '1. Review image format validation and support',
          '2. Check AI service connectivity and API keys',
          '3. Implement proper error handling for unsupported formats',
          '4. Add input validation for image data',
          '5. Test with various image formats and sizes'
        ],
        expectedOutcome: 'Image optimization succeeds for supported formats'
      });
    }

    // Performance optimization recommendations
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Performance Optimization',
      action: 'Implement comprehensive performance improvements',
      steps: [
        '1. Add Redis caching for platform specifications and styles',
        '2. Implement connection pooling for database and external APIs',
        '3. Add request compression and response caching',
        '4. Optimize database queries with proper indexing',
        '5. Implement queue-based processing for image operations'
      ],
      expectedOutcome: 'All endpoints respond under 1000ms consistently'
    });

    // Monitoring recommendations
    recommendations.push({
      priority: 'LOW',
      category: 'Monitoring Enhancement',
      action: 'Enhance system monitoring and alerting',
      steps: [
        '1. Add detailed application performance monitoring',
        '2. Implement real-time error tracking and alerting',
        '3. Create performance dashboards for key metrics',
        '4. Set up automated health check monitoring',
        '5. Add user experience monitoring'
      ],
      expectedOutcome: 'Proactive issue detection and faster resolution'
    });

    this.results.recommendations = recommendations;
    
    console.log(`  Generated ${recommendations.length} actionable recommendations`);
    console.log();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `api-health-analysis-${timestamp}.json`;
    const filepath = `/home/he_reat/Desktop/Projects/LinkedIn Headshot/LinkedInHeadshotApp/performance-testing/${filename}`;
    
    await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
    console.log(`📁 Analysis saved to: ${filename}`);
  }

  displayCriticalFindings() {
    console.log('\n' + '='.repeat(80));
    console.log('🚨 CRITICAL API HEALTH FINDINGS');
    console.log('='.repeat(80));
    
    // Display health status
    console.log(`🏥 SYSTEM HEALTH STATUS: ${(this.results.healthStatus.systemStatus || 'UNKNOWN').toUpperCase()}`);
    
    if (this.results.endpointAnalysis.health) {
      const healthAnalysis = this.results.endpointAnalysis.health;
      console.log(`📊 Health Endpoint Success Rate: ${healthAnalysis.patterns.successRate}%`);
    }

    // Display critical issues
    if (this.results.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
      this.results.criticalIssues
        .filter(issue => issue.severity === 'CRITICAL')
        .forEach((issue, index) => {
          console.log(`\n${index + 1}. ${issue.category}: ${issue.issue}`);
          console.log(`   Impact: ${issue.impact}`);
          console.log(`   Details: ${issue.details}`);
        });
    }

    // Display immediate actions
    const immediateActions = this.results.recommendations.filter(r => r.priority === 'IMMEDIATE' || r.priority === 'CRITICAL');
    if (immediateActions.length > 0) {
      console.log('\n⚡ IMMEDIATE ACTIONS REQUIRED:');
      immediateActions.forEach((action, index) => {
        console.log(`\n${index + 1}. ${action.action}`);
        action.steps.slice(0, 3).forEach(step => {
          console.log(`   ${step}`);
        });
      });
    }

    // Display working endpoints
    console.log('\n✅ WORKING ENDPOINTS:');
    Object.entries(this.results.endpointAnalysis).forEach(([name, analysis]) => {
      if (analysis.successRate >= 80) {
        console.log(`   ${name}: ${analysis.successRate}% success`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('🎯 Review the detailed JSON report for complete analysis and step-by-step remediation.');
    console.log('='.repeat(80) + '\n');
  }
}

// Run if executed directly
if (require.main === module) {
  const analysis = new APIHealthAnalysis();
  analysis.runFocusedAnalysis().catch(console.error);
}

module.exports = APIHealthAnalysis;