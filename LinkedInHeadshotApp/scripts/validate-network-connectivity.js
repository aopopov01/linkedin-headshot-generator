#!/usr/bin/env node

/**
 * Network Connectivity Validation Script
 * Tests mobile-backend connectivity for OmniShot app
 * 
 * Usage: node scripts/validate-network-connectivity.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const Colors = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

class NetworkValidator {
  constructor() {
    this.results = {
      networkInfo: {},
      backendTests: [],
      recommendations: [],
      summary: {}
    };
    
    this.HOST_IP = '192.168.20.112';
    this.BACKEND_PORT = '3000';
    this.TEST_TIMEOUT = 5000;
  }

  log(message, color = Colors.RESET) {
    console.log(`${color}${message}${Colors.RESET}`);
  }

  async run() {
    this.log(`${Colors.BOLD}${Colors.CYAN}🔧 OmniShot Network Connectivity Validation${Colors.RESET}`);
    this.log('='.repeat(50));
    
    try {
      await this.gatherNetworkInfo();
      await this.testBackendEndpoints();
      await this.validateExpectedBehavior();
      await this.generateRecommendations();
      this.printSummary();
      
    } catch (error) {
      this.log(`❌ Validation failed: ${error.message}`, Colors.RED);
      process.exit(1);
    }
  }

  async gatherNetworkInfo() {
    this.log(`\n${Colors.BLUE}📡 Gathering Network Information...${Colors.RESET}`);
    
    try {
      // Get system IP information
      const { stdout: ipInfo } = await execAsync('hostname -I');
      const ips = ipInfo.trim().split(' ').filter(Boolean);
      
      // Get network interfaces
      const { stdout: ifconfig } = await execAsync('ip addr show | grep "inet " | grep -v "127.0.0.1"').catch(() => ({ stdout: 'N/A' }));
      
      // Get WSL information if applicable
      const { stdout: wslInfo } = await execAsync('cat /proc/version | grep -i microsoft').catch(() => ({ stdout: '' }));
      const isWSL = wslInfo.includes('microsoft') || wslInfo.includes('Microsoft');
      
      this.results.networkInfo = {
        primaryIP: this.HOST_IP,
        allIPs: ips,
        isWSL: isWSL,
        networkInterfaces: ifconfig.trim(),
        timestamp: new Date().toISOString()
      };
      
      this.log(`✅ Primary IP: ${this.HOST_IP}`, Colors.GREEN);
      this.log(`📋 All IPs: ${ips.join(', ')}`);
      this.log(`🖥️  WSL Environment: ${isWSL ? 'Yes' : 'No'}`);
      
    } catch (error) {
      this.log(`⚠️  Could not gather full network info: ${error.message}`, Colors.YELLOW);
    }
  }

  async testBackendEndpoints() {
    this.log(`\n${Colors.BLUE}🌐 Testing Backend Endpoints...${Colors.RESET}`);
    
    const endpoints = [
      {
        name: 'Direct IP (Primary)',
        url: `http://${this.HOST_IP}:${this.BACKEND_PORT}/health`,
        priority: 'primary'
      },
      {
        name: 'Localhost',
        url: `http://localhost:${this.BACKEND_PORT}/health`,
        priority: 'fallback'
      },
      {
        name: 'Loopback',
        url: `http://127.0.0.1:${this.BACKEND_PORT}/health`,
        priority: 'fallback'
      },
      {
        name: 'Android Emulator Bridge',
        url: `http://10.0.2.2:${this.BACKEND_PORT}/health`,
        priority: 'android'
      }
    ];

    for (const endpoint of endpoints) {
      await this.testSingleEndpoint(endpoint);
    }
  }

  async testSingleEndpoint(endpoint) {
    const startTime = Date.now();
    
    try {
      this.log(`🔄 Testing: ${endpoint.name} (${endpoint.url})`);
      
      const curlCommand = `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "${endpoint.url}"`;
      const { stdout } = await execAsync(curlCommand);
      const httpCode = stdout.trim();
      const responseTime = Date.now() - startTime;
      
      // Accept both 200 and 503 as successful for health endpoint
      const isSuccessful = httpCode === '200' || httpCode === '503';
      
      const result = {
        ...endpoint,
        httpCode: httpCode,
        responseTime: responseTime,
        success: isSuccessful,
        timestamp: new Date().toISOString()
      };
      
      this.results.backendTests.push(result);
      
      if (isSuccessful) {
        this.log(`  ✅ ${endpoint.name}: HTTP ${httpCode} (${responseTime}ms)`, Colors.GREEN);
      } else {
        this.log(`  ❌ ${endpoint.name}: HTTP ${httpCode} (${responseTime}ms)`, Colors.RED);
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const result = {
        ...endpoint,
        httpCode: 'ERROR',
        responseTime: responseTime,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      this.results.backendTests.push(result);
      this.log(`  ❌ ${endpoint.name}: Connection failed (${error.message})`, Colors.RED);
    }
  }

  async validateExpectedBehavior() {
    this.log(`\n${Colors.BLUE}🔍 Validating Expected Behavior...${Colors.RESET}`);
    
    const workingEndpoints = this.results.backendTests.filter(test => test.success);
    const primaryWorking = workingEndpoints.find(test => test.priority === 'primary');
    
    // Test full health response
    if (primaryWorking) {
      try {
        const curlCommand = `curl -s "${primaryWorking.url}"`;
        const { stdout } = await execAsync(curlCommand);
        const healthData = JSON.parse(stdout);
        
        this.log(`✅ Health endpoint returns valid JSON`, Colors.GREEN);
        this.log(`📊 Backend status: ${healthData.status}`);
        this.log(`🌍 Environment: ${healthData.environment}`);
        
        // Check if development mode accepts degraded services
        if (healthData.environment === 'development' && 
            (healthData.status === 'degraded' || healthData.status === 'unhealthy')) {
          this.log(`✅ Development mode correctly handles degraded services`, Colors.GREEN);
        }
        
      } catch (error) {
        this.log(`⚠️  Could not parse health response: ${error.message}`, Colors.YELLOW);
      }
    }
  }

  async generateRecommendations() {
    this.log(`\n${Colors.BLUE}💡 Generating Recommendations...${Colors.RESET}`);
    
    const workingEndpoints = this.results.backendTests.filter(test => test.success);
    const primaryWorking = workingEndpoints.find(test => test.priority === 'primary');
    
    if (primaryWorking) {
      this.results.recommendations.push({
        type: 'success',
        message: `Primary endpoint (${this.HOST_IP}:${this.BACKEND_PORT}) is working correctly`,
        action: 'Mobile app should connect successfully using IP-based configuration'
      });
    } else {
      this.results.recommendations.push({
        type: 'critical',
        message: `Primary endpoint (${this.HOST_IP}:${this.BACKEND_PORT}) is not accessible`,
        action: 'Check if backend server is running: cd backend && node server.js'
      });
    }
    
    if (workingEndpoints.length === 0) {
      this.results.recommendations.push({
        type: 'critical',
        message: 'No endpoints are accessible',
        action: 'Ensure backend server is running and check firewall settings'
      });
    }
    
    // Mobile-specific recommendations
    if (this.results.networkInfo.isWSL) {
      this.results.recommendations.push({
        type: 'info',
        message: 'WSL2 environment detected',
        action: 'Mobile devices should use the primary IP address for connectivity'
      });
    }
    
    this.results.recommendations.push({
      type: 'expo',
      message: 'For Expo Go testing',
      action: 'Use: npx expo start --tunnel for external device access'
    });
    
    this.results.recommendations.push({
      type: 'development',
      message: 'For development builds',
      action: `Use direct IP connection: http://${this.HOST_IP}:${this.BACKEND_PORT}`
    });
  }

  printSummary() {
    this.log(`\n${Colors.BOLD}${Colors.CYAN}📋 Summary Report${Colors.RESET}`);
    this.log('='.repeat(30));
    
    const workingEndpoints = this.results.backendTests.filter(test => test.success);
    const totalEndpoints = this.results.backendTests.length;
    
    this.results.summary = {
      totalEndpoints: totalEndpoints,
      workingEndpoints: workingEndpoints.length,
      primaryEndpointWorking: workingEndpoints.some(test => test.priority === 'primary'),
      networkConfigured: workingEndpoints.length > 0,
      timestamp: new Date().toISOString()
    };
    
    // Status indicator
    if (this.results.summary.primaryEndpointWorking) {
      this.log(`🟢 CONNECTIVITY STATUS: EXCELLENT`, Colors.GREEN);
    } else if (workingEndpoints.length > 0) {
      this.log(`🟡 CONNECTIVITY STATUS: PARTIAL`, Colors.YELLOW);
    } else {
      this.log(`🔴 CONNECTIVITY STATUS: FAILED`, Colors.RED);
    }
    
    this.log(`📊 Working Endpoints: ${workingEndpoints.length}/${totalEndpoints}`);
    this.log(`🎯 Primary IP: ${this.HOST_IP}:${this.BACKEND_PORT}`);
    
    // Print recommendations
    this.log(`\n${Colors.BOLD}🔧 Action Items:${Colors.RESET}`);
    this.results.recommendations.forEach((rec, index) => {
      const icon = rec.type === 'success' ? '✅' : 
                   rec.type === 'critical' ? '❌' : 
                   rec.type === 'info' ? 'ℹ️' : '💡';
      
      this.log(`${index + 1}. ${icon} ${rec.message}`);
      this.log(`   → ${rec.action}`, Colors.CYAN);
    });
    
    // Export results
    this.saveResults();
  }

  async saveResults() {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const resultsDir = path.join(__dirname, '../test-reports');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      
      const filename = `network-connectivity-${Date.now()}.json`;
      const filepath = path.join(resultsDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
      
      this.log(`\n💾 Results saved to: ${filepath}`, Colors.BLUE);
      
    } catch (error) {
      this.log(`⚠️  Could not save results: ${error.message}`, Colors.YELLOW);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new NetworkValidator();
  validator.run().catch(error => {
    console.error(`${Colors.RED}❌ Validation failed: ${error.message}${Colors.RESET}`);
    process.exit(1);
  });
}

module.exports = NetworkValidator;