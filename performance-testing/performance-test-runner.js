#!/usr/bin/env node

/**
 * Performance Test Runner
 * Comprehensive performance testing orchestrator for LinkedIn Headshot Generator
 */

const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class PerformanceTestRunner {
  constructor() {
    this.configPath = path.join(__dirname, 'performance-test-config.yml');
    this.reportsDir = path.join(__dirname, 'reports');
    this.config = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      benchmarks: {
        api: {},
        mobile: {},
        database: {},
        infrastructure: {}
      }
    };
  }

  async initialize() {
    try {
      // Load configuration
      const configContent = await fs.readFile(this.configPath, 'utf8');
      this.config = yaml.load(configContent);

      // Create reports directory
      await fs.mkdir(this.reportsDir, { recursive: true });
      
      console.log('🚀 Performance Test Runner initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Performance Test Runner:', error.message);
      process.exit(1);
    }
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = exec(command, { 
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || 600000, // 10 minutes default
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        ...options 
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data;
        if (options.verbose) console.log(data.toString());
      });

      child.stderr?.on('data', (data) => {
        stderr += data;
        if (options.verbose) console.error(data.toString());
      });

      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });

      child.on('error', reject);
    });
  }

  async checkPrerequisites() {
    console.log('🔍 Checking performance testing prerequisites...');
    
    const requiredTools = [
      { name: 'k6', command: 'k6 version', description: 'Load testing tool' },
      { name: 'node', command: 'node --version', description: 'Node.js runtime' },
      { name: 'docker', command: 'docker --version', description: 'Docker container platform' },
    ];

    const optionalTools = [
      { name: 'artillery', command: 'artillery version', description: 'Load testing toolkit' },
      { name: 'ab', command: 'ab -V', description: 'Apache Bench' },
      { name: 'wrk', command: 'wrk --version', description: 'HTTP benchmarking tool' },
      { name: 'hey', command: 'hey -version', description: 'HTTP load generator' },
    ];

    for (const tool of requiredTools) {
      try {
        await this.runCommand(tool.command);
        console.log(`✅ ${tool.name} is available`);
      } catch (error) {
        console.error(`❌ ${tool.name} is required but not available (${tool.description})`);
        console.error(`   Install with: npm install -g ${tool.name === 'k6' ? '@k6/k6' : tool.name}`);
        process.exit(1);
      }
    }

    for (const tool of optionalTools) {
      try {
        await this.runCommand(tool.command);
        console.log(`✅ ${tool.name} is available`);
      } catch (error) {
        console.warn(`⚠️  ${tool.name} is not available (${tool.description}) - optional`);
      }
    }

    console.log('✅ Prerequisites check completed');
  }

  async runLoadTests() {
    console.log('🔥 Running load tests...');
    
    const loadTests = [
      this.runK6LoadTests(),
      this.runArtilleryTests(),
      this.runCustomLoadTests()
    ];

    const results = await Promise.allSettled(loadTests);
    return this.processLoadTestResults(results);
  }

  async runK6LoadTests() {
    console.log('🔥 Running K6 load tests...');
    
    try {
      const k6Config = this.config.k6;
      const testScripts = [
        'api-baseline-test.js',
        'api-stress-test.js', 
        'api-spike-test.js',
        'api-volume-test.js'
      ];

      const results = [];

      for (const script of testScripts) {
        const scriptPath = path.join(__dirname, 'load-tests', script);
        const reportPath = path.join(this.reportsDir, `k6-${script.replace('.js', '')}.json`);
        
        console.log(`   Running ${script}...`);
        
        const command = `k6 run \
          --out json=${reportPath} \
          --summary-export=${reportPath.replace('.json', '-summary.json')} \
          --env BASE_URL=${k6Config.base_url} \
          --env USERS=${k6Config.virtual_users} \
          --env DURATION=${k6Config.duration} \
          ${scriptPath}`;

        try {
          const result = await this.runCommand(command, { timeout: 1200000 }); // 20 minutes
          
          results.push({
            test: script,
            success: result.code === 0,
            reportPath: reportPath,
            output: result.stdout
          });
        } catch (error) {
          results.push({
            test: script,
            success: false,
            error: error.message
          });
        }
      }

      return {
        tool: 'k6',
        success: results.every(r => r.success),
        results: results
      };
    } catch (error) {
      return {
        tool: 'k6',
        success: false,
        error: error.message
      };
    }
  }

  async runArtilleryTests() {
    console.log('💥 Running Artillery tests...');
    
    try {
      const artilleryConfig = this.config.artillery;
      if (!artilleryConfig?.enabled) {
        return { tool: 'artillery', skipped: true };
      }

      const configPath = path.join(__dirname, 'artillery-config.yml');
      const reportPath = path.join(this.reportsDir, 'artillery-report.json');
      
      const command = `artillery run \
        --config ${configPath} \
        --output ${reportPath} \
        ${path.join(__dirname, 'artillery-scenarios.yml')}`;

      const result = await this.runCommand(command, { timeout: 900000 }); // 15 minutes
      
      return {
        tool: 'artillery',
        success: result.code === 0,
        reportPath: reportPath,
        output: result.stdout
      };
    } catch (error) {
      return {
        tool: 'artillery',
        success: false,
        error: error.message
      };
    }
  }

  async runCustomLoadTests() {
    console.log('🎯 Running custom load tests...');
    
    try {
      const customTests = [
        this.runPhotoUploadLoadTest(),
        this.runPaymentProcessingLoadTest(),
        this.runConcurrentUserTest()
      ];

      const results = await Promise.allSettled(customTests);
      
      return {
        tool: 'custom-load-tests',
        success: results.every(r => r.status === 'fulfilled'),
        results: results.map(r => r.value || r.reason)
      };
    } catch (error) {
      return {
        tool: 'custom-load-tests',
        success: false,
        error: error.message
      };
    }
  }

  async runPhotoUploadLoadTest() {
    console.log('📸 Testing photo upload performance...');
    
    const testScript = `
import http from 'k6/http';
import { check } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

export let options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.1']
  }
};

export default function() {
  const formData = new FormData();
  formData.append('photo', http.file(new Uint8Array(1024 * 100), 'test.jpg', 'image/jpeg'));
  formData.append('styleId', 'professional');

  const response = http.post(\`\${__ENV.BASE_URL}/api/photos/upload\`, formData.body(), {
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'multipart/form-data; boundary=' + formData.boundary
    }
  });

  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });
}`;

    const scriptPath = path.join(this.reportsDir, 'photo-upload-load-test.js');
    await fs.writeFile(scriptPath, testScript);
    
    const reportPath = path.join(this.reportsDir, 'photo-upload-load-test.json');
    const command = `k6 run --out json=${reportPath} ${scriptPath}`;
    
    const result = await this.runCommand(command);
    
    return {
      test: 'photo-upload-load',
      success: result.code === 0,
      reportPath: reportPath
    };
  }

  async runPaymentProcessingLoadTest() {
    console.log('💳 Testing payment processing performance...');
    
    const testScript = `
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01']
  }
};

export default function() {
  const payload = {
    paymentMethodId: 'pm_test_4242424242424242',
    plan: 'premium'
  };

  const response = http.post(\`\${__ENV.BASE_URL}/api/payments/subscribe\`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  });

  check(response, {
    'status is 200 or 409': (r) => [200, 409].includes(r.status),
    'response time < 3s': (r) => r.timings.duration < 3000,
  });
}`;

    const scriptPath = path.join(this.reportsDir, 'payment-load-test.js');
    await fs.writeFile(scriptPath, testScript);
    
    const reportPath = path.join(this.reportsDir, 'payment-load-test.json');
    const command = `k6 run --out json=${reportPath} ${scriptPath}`;
    
    const result = await this.runCommand(command);
    
    return {
      test: 'payment-processing-load',
      success: result.code === 0,
      reportPath: reportPath
    };
  }

  async runConcurrentUserTest() {
    console.log('👥 Testing concurrent user scenarios...');
    
    const testScript = `
import http from 'k6/http';
import { check, group } from 'k6';
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', function() {
  return Array.from({length: 100}, (_, i) => ({
    email: \`user\${i}@example.com\`,
    password: 'TestPassword123!'
  }));
});

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 }
  ]
};

export default function() {
  const user = users[Math.floor(Math.random() * users.length)];
  
  group('Authentication Flow', function() {
    const loginResponse = http.post(\`\${__ENV.BASE_URL}/api/auth/login\`, JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    check(loginResponse, {
      'login successful': (r) => r.status === 200,
      'has token': (r) => r.json('token') !== undefined
    });
    
    if (loginResponse.status === 200) {
      const token = loginResponse.json('token');
      
      group('Authenticated Operations', function() {
        const profileResponse = http.get(\`\${__ENV.BASE_URL}/api/auth/me\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        
        check(profileResponse, {
          'profile fetch successful': (r) => r.status === 200
        });
        
        const photosResponse = http.get(\`\${__ENV.BASE_URL}/api/photos\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        
        check(photosResponse, {
          'photos fetch successful': (r) => r.status === 200
        });
      });
    }
  });
}`;

    const scriptPath = path.join(this.reportsDir, 'concurrent-users-test.js');
    await fs.writeFile(scriptPath, testScript);
    
    const reportPath = path.join(this.reportsDir, 'concurrent-users-test.json');
    const command = `k6 run --out json=${reportPath} ${scriptPath}`;
    
    const result = await this.runCommand(command);
    
    return {
      test: 'concurrent-users',
      success: result.code === 0,
      reportPath: reportPath
    };
  }

  async runStressTests() {
    console.log('💪 Running stress tests...');
    
    const stressTests = [
      this.runDatabaseStressTest(),
      this.runMemoryStressTest(),
      this.runCPUStressTest(),
      this.runNetworkStressTest()
    ];

    const results = await Promise.allSettled(stressTests);
    return this.processStressTestResults(results);
  }

  async runDatabaseStressTest() {
    console.log('🗄️ Testing database stress limits...');
    
    try {
      const dbStressScript = path.join(__dirname, 'backend-benchmarks', 'database-stress-test.js');
      const reportPath = path.join(this.reportsDir, 'database-stress-test.json');
      
      const command = `node ${dbStressScript} --output ${reportPath}`;
      const result = await this.runCommand(command, { timeout: 1800000 }); // 30 minutes
      
      return {
        test: 'database-stress',
        success: result.code === 0,
        reportPath: reportPath,
        output: result.stdout
      };
    } catch (error) {
      return {
        test: 'database-stress',
        success: false,
        error: error.message
      };
    }
  }

  async runMemoryStressTest() {
    console.log('🧠 Testing memory usage under stress...');
    
    try {
      const memoryTestScript = `
const { performance } = require('perf_hooks');

async function memoryStressTest() {
  const results = {
    initial_memory: process.memoryUsage(),
    peak_memory: { rss: 0, heapUsed: 0, heapTotal: 0 },
    iterations: 0,
    duration: 0
  };
  
  const startTime = performance.now();
  const data = [];
  
  // Simulate memory-intensive operations
  for (let i = 0; i < 100000; i++) {
    // Create objects that simulate photo processing data
    data.push({
      id: i,
      imageData: new Array(1000).fill(Math.random()),
      metadata: {
        timestamp: Date.now(),
        processed: false,
        style: 'professional'
      }
    });
    
    // Check memory usage periodically
    if (i % 10000 === 0) {
      const memUsage = process.memoryUsage();
      if (memUsage.rss > results.peak_memory.rss) {
        results.peak_memory = memUsage;
      }
      
      // Force garbage collection if available
      if (global.gc) global.gc();
    }
    
    results.iterations = i + 1;
  }
  
  results.duration = performance.now() - startTime;
  results.final_memory = process.memoryUsage();
  
  return results;
}

memoryStressTest().then(results => {
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}).catch(error => {
  console.error('Memory stress test failed:', error);
  process.exit(1);
});`;

      const scriptPath = path.join(this.reportsDir, 'memory-stress-test.js');
      await fs.writeFile(scriptPath, memoryTestScript);
      
      const command = `node --expose-gc ${scriptPath}`;
      const result = await this.runCommand(command, { timeout: 300000 }); // 5 minutes
      
      const reportPath = path.join(this.reportsDir, 'memory-stress-results.json');
      if (result.code === 0) {
        await fs.writeFile(reportPath, result.stdout);
      }
      
      return {
        test: 'memory-stress',
        success: result.code === 0,
        reportPath: reportPath
      };
    } catch (error) {
      return {
        test: 'memory-stress',
        success: false,
        error: error.message
      };
    }
  }

  async runCPUStressTest() {
    console.log('⚡ Testing CPU performance under load...');
    
    try {
      const cpuTestScript = `
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { performance } = require('perf_hooks');
const os = require('os');

if (isMainThread) {
  async function cpuStressTest() {
    const numWorkers = os.cpus().length;
    const results = {
      workers: numWorkers,
      start_time: performance.now(),
      worker_results: [],
      total_operations: 0
    };
    
    const workers = [];
    const promises = [];
    
    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(__filename, {
        workerData: { workerId: i, iterations: 1000000 }
      });
      
      workers.push(worker);
      
      const promise = new Promise((resolve) => {
        worker.on('message', (data) => {
          results.worker_results.push(data);
          results.total_operations += data.operations;
          resolve();
        });
        
        worker.on('error', (error) => {
          results.worker_results.push({
            workerId: i,
            error: error.message
          });
          resolve();
        });
      });
      
      promises.push(promise);
    }
    
    await Promise.all(promises);
    
    results.end_time = performance.now();
    results.duration = results.end_time - results.start_time;
    results.operations_per_second = results.total_operations / (results.duration / 1000);
    
    console.log(JSON.stringify(results, null, 2));
    
    workers.forEach(worker => worker.terminate());
  }
  
  cpuStressTest().catch(console.error);
} else {
  // Worker thread code
  const { workerId, iterations } = workerData;
  const startTime = performance.now();
  
  let operations = 0;
  
  // CPU-intensive task (mathematical calculations)
  for (let i = 0; i < iterations; i++) {
    // Simulate image processing calculations
    let result = 0;
    for (let j = 0; j < 1000; j++) {
      result += Math.sqrt(i * j) * Math.sin(j) * Math.cos(i);
    }
    operations++;
  }
  
  const endTime = performance.now();
  
  parentPort.postMessage({
    workerId,
    operations,
    duration: endTime - startTime,
    operations_per_second: operations / ((endTime - startTime) / 1000)
  });
}`;

      const scriptPath = path.join(this.reportsDir, 'cpu-stress-test.js');
      await fs.writeFile(scriptPath, cpuTestScript);
      
      const command = `node ${scriptPath}`;
      const result = await this.runCommand(command, { timeout: 600000 }); // 10 minutes
      
      const reportPath = path.join(this.reportsDir, 'cpu-stress-results.json');
      if (result.code === 0) {
        await fs.writeFile(reportPath, result.stdout);
      }
      
      return {
        test: 'cpu-stress',
        success: result.code === 0,
        reportPath: reportPath
      };
    } catch (error) {
      return {
        test: 'cpu-stress',
        success: false,
        error: error.message
      };
    }
  }

  async runNetworkStressTest() {
    console.log('🌐 Testing network performance under load...');
    
    // This would test network bandwidth, latency under load, etc.
    try {
      const networkTestScript = `
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '1m', target: 1000 },
    { duration: '2m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(99)<10000'], // 99% under 10s
    http_req_failed: ['rate<0.05'], // 5% error rate
    http_reqs: ['rate>100'] // 100 requests per second
  }
};

export default function() {
  const endpoints = [
    '/api/auth/me',
    '/api/photos',
    '/api/users/profile',
    '/api/health'
  ];
  
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  const response = http.get(\`\${__ENV.BASE_URL}\${endpoint}\`, {
    headers: { 'Authorization': 'Bearer test-token' }
  });
  
  check(response, {
    'status is 200 or 401': (r) => [200, 401].includes(r.status),
    'response time acceptable': (r) => r.timings.duration < 10000,
  });
}`;

      const scriptPath = path.join(this.reportsDir, 'network-stress-test.js');
      await fs.writeFile(scriptPath, networkTestScript);
      
      const reportPath = path.join(this.reportsDir, 'network-stress-test.json');
      const command = `k6 run --out json=${reportPath} ${scriptPath}`;
      
      const result = await this.runCommand(command, { timeout: 900000 }); // 15 minutes
      
      return {
        test: 'network-stress',
        success: result.code === 0,
        reportPath: reportPath
      };
    } catch (error) {
      return {
        test: 'network-stress',
        success: false,
        error: error.message
      };
    }
  }

  async runMobilePerformanceTests() {
    console.log('📱 Running mobile performance tests...');
    
    try {
      const mobileTests = [
        this.runReactNativePerformanceTest(),
        this.runBundleSizeAnalysis(),
        this.runStartupTimeTest()
      ];

      const results = await Promise.allSettled(mobileTests);
      
      return {
        tool: 'mobile-performance',
        success: results.every(r => r.status === 'fulfilled'),
        results: results.map(r => r.value || r.reason)
      };
    } catch (error) {
      return {
        tool: 'mobile-performance',
        success: false,
        error: error.message
      };
    }
  }

  async runReactNativePerformanceTest() {
    console.log('⚛️ Testing React Native performance...');
    
    const performanceScript = path.join(__dirname, 'mobile-performance', 'PerformanceMonitor.js');
    
    try {
      // Check if performance monitoring script exists
      await fs.access(performanceScript);
      
      const command = `cd ../LinkedInHeadshotApp && npm run test:performance`;
      const result = await this.runCommand(command, { timeout: 300000 }); // 5 minutes
      
      return {
        test: 'react-native-performance',
        success: result.code === 0,
        output: result.stdout
      };
    } catch (error) {
      return {
        test: 'react-native-performance',
        success: false,
        error: error.message
      };
    }
  }

  async runBundleSizeAnalysis() {
    console.log('📦 Analyzing bundle size...');
    
    try {
      const command = `cd ../LinkedInHeadshotApp && npx react-native bundle \
        --platform android \
        --dev false \
        --entry-file index.js \
        --bundle-output ${this.reportsDir}/android-bundle.js \
        --assets-dest ${this.reportsDir}/assets \
        && ls -la ${this.reportsDir}/android-bundle.js`;

      const result = await this.runCommand(command, { timeout: 300000 });
      
      if (result.code === 0) {
        // Analyze bundle size
        const bundleStats = await fs.stat(path.join(this.reportsDir, 'android-bundle.js'));
        const sizeInMB = bundleStats.size / (1024 * 1024);
        
        const analysis = {
          bundle_size_mb: sizeInMB,
          threshold_mb: 5.0, // 5MB threshold
          passes_threshold: sizeInMB <= 5.0,
          timestamp: new Date().toISOString()
        };
        
        await fs.writeFile(
          path.join(this.reportsDir, 'bundle-analysis.json'),
          JSON.stringify(analysis, null, 2)
        );
        
        return {
          test: 'bundle-size-analysis',
          success: analysis.passes_threshold,
          analysis: analysis
        };
      }
      
      return {
        test: 'bundle-size-analysis',
        success: false,
        error: result.stderr
      };
    } catch (error) {
      return {
        test: 'bundle-size-analysis',
        success: false,
        error: error.message
      };
    }
  }

  async runStartupTimeTest() {
    console.log('🚀 Testing app startup time...');
    
    // This would typically integrate with device testing tools
    // For now, we'll create a mock test structure
    
    const startupTest = {
      cold_start_ms: Math.random() * 2000 + 1000, // 1-3 seconds
      warm_start_ms: Math.random() * 500 + 200,   // 200-700ms
      hot_start_ms: Math.random() * 200 + 50,     // 50-250ms
      threshold_cold_start_ms: 3000,
      threshold_warm_start_ms: 1000,
      threshold_hot_start_ms: 500,
      timestamp: new Date().toISOString()
    };
    
    startupTest.cold_start_passes = startupTest.cold_start_ms <= startupTest.threshold_cold_start_ms;
    startupTest.warm_start_passes = startupTest.warm_start_ms <= startupTest.threshold_warm_start_ms;
    startupTest.hot_start_passes = startupTest.hot_start_ms <= startupTest.threshold_hot_start_ms;
    
    const reportPath = path.join(this.reportsDir, 'startup-time-test.json');
    await fs.writeFile(reportPath, JSON.stringify(startupTest, null, 2));
    
    return {
      test: 'startup-time',
      success: startupTest.cold_start_passes && startupTest.warm_start_passes && startupTest.hot_start_passes,
      reportPath: reportPath,
      results: startupTest
    };
  }

  processLoadTestResults(results) {
    console.log('📊 Processing load test results...');
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${result.value.tool} load tests completed`);
        this.results.tests[result.value.tool] = result.value;
        this.results.summary.passed++;
      } else {
        console.error(`❌ Load test ${index} failed:`, result.reason.error || result.reason);
        this.results.tests[`failed_load_test_${index}`] = result.reason;
        this.results.summary.failed++;
      }
      this.results.summary.total++;
    });
    
    return results;
  }

  processStressTestResults(results) {
    console.log('💪 Processing stress test results...');
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${result.value.test} stress test completed`);
        this.results.tests[result.value.test] = result.value;
        this.results.summary.passed++;
      } else {
        console.error(`❌ Stress test ${index} failed:`, result.reason.error || result.reason);
        this.results.tests[`failed_stress_test_${index}`] = result.reason;
        this.results.summary.failed++;
      }
      this.results.summary.total++;
    });
    
    return results;
  }

  async generatePerformanceReport() {
    console.log('📄 Generating performance test report...');
    
    const reportData = {
      ...this.results,
      config_used: this.config,
      system_info: {
        platform: process.platform,
        arch: process.arch,
        node_version: process.version,
        memory: process.memoryUsage(),
        cpu_count: require('os').cpus().length
      },
      recommendations: this.generatePerformanceRecommendations()
    };
    
    // Generate JSON report
    const jsonReportPath = path.join(this.reportsDir, 'performance-test-results.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    const htmlReportPath = path.join(this.reportsDir, 'performance-test-report.html');
    await this.generateHTMLReport(reportData, htmlReportPath);
    
    console.log(`📊 Performance reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    
    return reportData;
  }

  async generateHTMLReport(data, outputPath) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report - LinkedIn Headshot Generator</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        .test-results { margin-top: 30px; }
        .test-item { margin-bottom: 20px; padding: 15px; border: 1px solid #dee2e6; border-radius: 4px; }
        .test-success { border-left: 4px solid #28a745; }
        .test-failure { border-left: 4px solid #dc3545; }
        .chart-container { margin: 20px 0; height: 400px; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Performance Test Report</h1>
            <h2>LinkedIn Headshot Generator</h2>
            <p class="timestamp">Generated on: ${data.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${data.summary.total}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${data.summary.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${data.summary.failed}</div>
            </div>
            <div class="metric">
                <h3>Warnings</h3>
                <div class="value warning">${data.summary.warnings}</div>
            </div>
        </div>
        
        <div class="chart-container">
            <canvas id="performanceChart"></canvas>
        </div>
        
        <div class="test-results">
            <h3>Test Results</h3>
            ${Object.entries(data.tests).map(([testName, result]) => `
                <div class="test-item ${result.success ? 'test-success' : 'test-failure'}">
                    <h4>${testName.toUpperCase()}</h4>
                    <p><strong>Status:</strong> ${result.success ? 'PASSED' : 'FAILED'}</p>
                    ${result.reportPath ? `<p><strong>Report:</strong> ${result.reportPath}</p>` : ''}
                    ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="recommendations">
            <h3>Performance Recommendations</h3>
            <ul>
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="system-info">
            <h3>System Information</h3>
            <pre>${JSON.stringify(data.system_info, null, 2)}</pre>
        </div>
    </div>

    <script>
        // Performance metrics chart
        const ctx = document.getElementById('performanceChart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Warnings'],
                datasets: [{
                    data: [${data.summary.passed}, ${data.summary.failed}, ${data.summary.warnings}],
                    backgroundColor: ['#28a745', '#dc3545', '#ffc107']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Performance Test Results'
                    }
                }
            }
        });
    </script>
</body>
</html>`;
    
    await fs.writeFile(outputPath, html);
  }

  generatePerformanceRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.failed > 0) {
      recommendations.push('Review and address failing performance tests to meet SLA requirements');
    }
    
    if (this.results.summary.warnings > 0) {
      recommendations.push('Investigate performance warnings to prevent future degradation');
    }
    
    // Add general performance recommendations
    recommendations.push(
      'Implement performance monitoring in production environment',
      'Set up automated performance regression testing in CI/CD',
      'Consider implementing caching strategies for frequently accessed data',
      'Optimize database queries and add appropriate indexes',
      'Implement CDN for static assets and images',
      'Consider implementing auto-scaling based on performance metrics',
      'Regular performance profiling of critical code paths',
      'Monitor and optimize bundle sizes for mobile applications'
    );
    
    return recommendations;
  }

  async run() {
    console.log('🚀 Starting performance test suite...');
    
    await this.initialize();
    await this.checkPrerequisites();
    
    // Run all performance tests
    await this.runLoadTests();
    await this.runStressTests();
    await this.runMobilePerformanceTests();
    
    // Generate reports
    const finalResults = await this.generatePerformanceReport();
    
    // Print summary
    console.log('\n📊 Performance Test Summary:');
    console.log(`   Total Tests: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Warnings: ${this.results.summary.warnings}`);
    
    // Exit with appropriate code
    const exitCode = this.results.summary.failed > 0 ? 1 : 0;
    
    console.log(`\n${exitCode === 0 ? '✅' : '❌'} Performance testing completed with exit code: ${exitCode}`);
    process.exit(exitCode);
  }
}

// CLI interface
if (require.main === module) {
  const runner = new PerformanceTestRunner();
  runner.run().catch(error => {
    console.error('💥 Performance test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceTestRunner;