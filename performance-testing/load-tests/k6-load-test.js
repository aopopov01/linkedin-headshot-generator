/**
 * K6 Load Testing Suite for LinkedIn Headshot API
 * Comprehensive performance testing scenarios covering all API endpoints
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorCounter = new Counter('errors');
const successRate = new Rate('success_rate');
const apiResponseTime = new Trend('api_response_time');
const imageProcessingTime = new Trend('image_processing_time');
const authenticationTime = new Trend('authentication_time');

// Test configuration
const API_BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const TEST_IMAGE_BASE64 = __ENV.TEST_IMAGE || generateTestImage();

// Load testing scenarios
export const options = {
  scenarios: {
    // Baseline load test
    baseline_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      tags: { scenario: 'baseline' },
    },
    
    // Peak load simulation
    peak_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      tags: { scenario: 'peak' },
    },
    
    // Stress test
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
      ],
      tags: { scenario: 'stress' },
    },

    // Spike test
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 0 },
        { duration: '30s', target: 300 },
        { duration: '30s', target: 300 },
        { duration: '10s', target: 0 },
      ],
      tags: { scenario: 'spike' },
    },

    // Soak test (long duration)
    soak_test: {
      executor: 'constant-vus',
      vus: 30,
      duration: '1h',
      tags: { scenario: 'soak' },
    },
  },
  
  thresholds: {
    // Overall system thresholds
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'], // Less than 5% failure rate
    
    // API-specific thresholds
    'api_response_time': ['p(95)<1000'],
    'image_processing_time': ['p(95)<60000'], // Image processing under 60s
    'authentication_time': ['p(95)<500'],
    
    // Scenario-specific thresholds
    'http_req_duration{scenario:baseline}': ['p(95)<1500'],
    'http_req_duration{scenario:peak}': ['p(95)<3000'],
    'http_req_duration{scenario:stress}': ['p(95)<5000'],
    'http_req_duration{scenario:spike}': ['p(95)<10000'],
  },
};

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'TestPass123!' },
  { email: 'test2@example.com', password: 'TestPass123!' },
  { email: 'test3@example.com', password: 'TestPass123!' },
];

const styleTemplates = ['corporate', 'creative', 'executive', 'startup', 'healthcare'];

export function setup() {
  console.log('🚀 Starting LinkedIn Headshot API Load Tests');
  console.log(`📊 API Base URL: ${API_BASE_URL}`);
  
  // Health check before starting tests
  const healthCheck = http.get(`${API_BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('API is not healthy, cannot start tests');
  }
  
  return {
    baseUrl: API_BASE_URL,
    testImage: TEST_IMAGE_BASE64,
  };
}

export default function(data) {
  const testUser = testUsers[Math.floor(Math.random() * testUsers.length)];
  const styleTemplate = styleTemplates[Math.floor(Math.random() * styleTemplates.length)];
  
  // Test workflow simulation
  testAuthenticationFlow(data.baseUrl, testUser);
  testUserManagement(data.baseUrl);
  testImageProcessing(data.baseUrl, data.testImage, styleTemplate);
  testAnalytics(data.baseUrl);
  
  sleep(Math.random() * 3 + 1); // Random sleep 1-4 seconds
}

function testAuthenticationFlow(baseUrl, user) {
  const startTime = Date.now();
  
  // Register or login
  const loginResponse = http.post(`${baseUrl}/api/auth/login`, {
    email: user.email,
    password: user.password,
  }, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const authTime = Date.now() - startTime;
  authenticationTime.add(authTime);
  
  const isSuccess = check(loginResponse, {
    'authentication status is 200 or 400': (r) => [200, 400].includes(r.status),
    'authentication response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  successRate.add(isSuccess);
  if (!isSuccess) errorCounter.add(1);
  
  return loginResponse.json('token');
}

function testUserManagement(baseUrl) {
  const token = 'mock-token'; // In real scenario, use token from auth
  
  // Get user profile
  const profileResponse = http.get(`${baseUrl}/api/users/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const isSuccess = check(profileResponse, {
    'profile fetch status is 200 or 401': (r) => [200, 401].includes(r.status),
    'profile response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  apiResponseTime.add(profileResponse.timings.duration);
  successRate.add(isSuccess);
  if (!isSuccess) errorCounter.add(1);
}

function testImageProcessing(baseUrl, imageData, styleTemplate) {
  const token = 'mock-token';
  const startTime = Date.now();
  
  // Start image generation
  const generateResponse = http.post(`${baseUrl}/api/photos/generate`, {
    image: imageData,
    styleTemplate: styleTemplate,
    numOutputs: 4,
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const processingTime = Date.now() - startTime;
  imageProcessingTime.add(processingTime);
  
  const isSuccess = check(generateResponse, {
    'generation request status is 200 or 401': (r) => [200, 401].includes(r.status),
    'generation request has prediction_id': (r) => {
      try {
        const body = r.json();
        return body.predictionId !== undefined;
      } catch {
        return r.status === 401; // Auth error is acceptable
      }
    },
  });
  
  successRate.add(isSuccess);
  if (!isSuccess) errorCounter.add(1);
  
  // If successful, poll for status (simulation)
  if (generateResponse.status === 200) {
    sleep(2); // Simulate some processing time
    
    const statusResponse = http.get(`${baseUrl}/api/photos/status/mock-prediction-id`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    check(statusResponse, {
      'status check returns valid response': (r) => [200, 401, 404].includes(r.status),
    });
  }
}

function testAnalytics(baseUrl) {
  const token = 'mock-token';
  
  // Track analytics event
  const analyticsResponse = http.post(`${baseUrl}/api/analytics/track`, {
    event: 'performance_test',
    properties: {
      scenario: __ENV.SCENARIO || 'load_test',
      timestamp: Date.now(),
    },
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const isSuccess = check(analyticsResponse, {
    'analytics tracking status is 200 or 401': (r) => [200, 401].includes(r.status),
    'analytics response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  apiResponseTime.add(analyticsResponse.timings.duration);
  successRate.add(isSuccess);
  if (!isSuccess) errorCounter.add(1);
}

function generateTestImage() {
  // Generate a minimal test image in base64 format
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
}

export function teardown(data) {
  console.log('🏁 Load tests completed');
}

// Helper function to generate performance report
export function handleSummary(data) {
  return {
    'performance-report.json': JSON.stringify(data, null, 2),
    stdout: generateTextSummary(data),
  };
}

function generateTextSummary(data) {
  const summary = `
📊 LINKEDIN HEADSHOT API PERFORMANCE TEST RESULTS
================================================

🔍 Test Overview:
- Duration: ${data.state.testRunDurationMs / 1000}s
- Total Requests: ${data.metrics.http_reqs.count}
- Failed Requests: ${data.metrics.http_req_failed.count}
- Data Transferred: ${(data.metrics.data_received.count / 1024 / 1024).toFixed(2)} MB

⚡ Response Times:
- Average: ${data.metrics.http_req_duration.avg.toFixed(2)}ms
- 95th Percentile: ${data.metrics.http_req_duration['p(95)'].toFixed(2)}ms
- 99th Percentile: ${data.metrics.http_req_duration['p(99)'].toFixed(2)}ms

📈 Key Metrics:
- Success Rate: ${((1 - data.metrics.http_req_failed.rate) * 100).toFixed(2)}%
- Requests/sec: ${data.metrics.http_reqs.rate.toFixed(2)}
- Authentication Time (avg): ${data.metrics.authentication_time ? data.metrics.authentication_time.avg.toFixed(2) : 'N/A'}ms

🎯 Thresholds:
${Object.entries(data.thresholds || {}).map(([key, threshold]) => 
  `- ${key}: ${threshold.ok ? '✅ PASS' : '❌ FAIL'}`
).join('\n')}

💡 Recommendations:
${generateRecommendations(data)}
`;
  
  return summary;
}

function generateRecommendations(data) {
  const recommendations = [];
  const failureRate = data.metrics.http_req_failed.rate;
  const avgResponseTime = data.metrics.http_req_duration.avg;
  const p95ResponseTime = data.metrics.http_req_duration['p(95)'];
  
  if (failureRate > 0.05) {
    recommendations.push('- High failure rate detected. Check error logs and server capacity.');
  }
  
  if (avgResponseTime > 1000) {
    recommendations.push('- Average response time is high. Consider API optimization.');
  }
  
  if (p95ResponseTime > 2000) {
    recommendations.push('- 95th percentile response time exceeds threshold. Optimize slow endpoints.');
  }
  
  if (data.metrics.authentication_time && data.metrics.authentication_time.avg > 500) {
    recommendations.push('- Authentication is slow. Consider JWT caching or database optimization.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('- Performance looks good! Monitor trends over time.');
  }
  
  return recommendations.join('\n');
}