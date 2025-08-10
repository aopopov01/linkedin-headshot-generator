#!/usr/bin/env node

/**
 * Security Test Runner
 * Automated security testing orchestrator for LinkedIn Headshot Generator
 */

const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class SecurityTestRunner {
  constructor() {
    this.configPath = path.join(__dirname, 'security-test-config.yml');
    this.reportsDir = path.join(__dirname, 'reports');
    this.config = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
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
      
      console.log('✅ Security Test Runner initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Security Test Runner:', error.message);
      process.exit(1);
    }
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = exec(command, { 
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || 300000, // 5 minutes default
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
    console.log('🔍 Checking security testing prerequisites...');
    
    const tools = [
      { name: 'docker', command: 'docker --version' },
      { name: 'node', command: 'node --version' },
      { name: 'npm', command: 'npm --version' },
    ];

    const optionalTools = [
      { name: 'zaproxy', command: 'zap.sh -version' },
      { name: 'nmap', command: 'nmap --version' },
      { name: 'trivy', command: 'trivy --version' },
    ];

    for (const tool of tools) {
      try {
        await this.runCommand(tool.command);
        console.log(`✅ ${tool.name} is available`);
      } catch (error) {
        console.error(`❌ ${tool.name} is required but not available`);
        process.exit(1);
      }
    }

    for (const tool of optionalTools) {
      try {
        await this.runCommand(tool.command);
        console.log(`✅ ${tool.name} is available`);
      } catch (error) {
        console.warn(`⚠️  ${tool.name} is not available (optional)`);
      }
    }
  }

  async runStaticAnalysis() {
    console.log('🔍 Running static analysis security tests...');
    
    const tests = [];

    // SonarQube analysis
    if (this.config.sonarqube) {
      tests.push(this.runSonarQubeAnalysis());
    }

    // Snyk vulnerability scanning
    if (this.config.snyk) {
      tests.push(this.runSnykScan());
    }

    // OWASP Dependency Check
    if (this.config.dependency_check) {
      tests.push(this.runDependencyCheck());
    }

    // Semgrep static analysis
    if (this.config.semgrep) {
      tests.push(this.runSemgrepAnalysis());
    }

    // Trivy filesystem scanning
    if (this.config.trivy?.filesystem_scanning?.enabled) {
      tests.push(this.runTrivyFilesystemScan());
    }

    const results = await Promise.allSettled(tests);
    return this.processStaticAnalysisResults(results);
  }

  async runSonarQubeAnalysis() {
    console.log('📊 Running SonarQube analysis...');
    
    try {
      const sonarConfig = this.config.sonarqube;
      const command = `sonar-scanner \
        -Dsonar.projectKey=${sonarConfig.project_key} \
        -Dsonar.projectName="${sonarConfig.project_name}" \
        -Dsonar.host.url=${sonarConfig.server_url} \
        -Dsonar.sources=./LinkedInHeadshotApp/src,./backend/src \
        -Dsonar.exclusions="${sonarConfig.exclusions.join(',')}" \
        -Dsonar.javascript.lcov.reportPaths=./coverage/lcov.info`;

      const result = await this.runCommand(command, { timeout: 600000 }); // 10 minutes
      
      return {
        tool: 'sonarqube',
        success: result.code === 0,
        output: result.stdout,
        errors: result.stderr
      };
    } catch (error) {
      return {
        tool: 'sonarqube',
        success: false,
        error: error.message
      };
    }
  }

  async runSnykScan() {
    console.log('🔍 Running Snyk vulnerability scan...');
    
    try {
      const snykConfig = this.config.snyk;
      const tests = [];

      // Scan backend dependencies
      tests.push(this.runCommand(`snyk test ./backend --json --severity-threshold=${snykConfig.test_options.severity_threshold}`, {
        cwd: process.cwd(),
        env: { ...process.env, SNYK_TOKEN: process.env[snykConfig.api_token_env] }
      }));

      // Scan React Native app dependencies
      tests.push(this.runCommand(`snyk test ./LinkedInHeadshotApp --json --severity-threshold=${snykConfig.test_options.severity_threshold}`, {
        cwd: process.cwd(),
        env: { ...process.env, SNYK_TOKEN: process.env[snykConfig.api_token_env] }
      }));

      const results = await Promise.allSettled(tests);
      
      return {
        tool: 'snyk',
        success: results.every(r => r.status === 'fulfilled'),
        results: results.map(r => r.value || r.reason)
      };
    } catch (error) {
      return {
        tool: 'snyk',
        success: false,
        error: error.message
      };
    }
  }

  async runDependencyCheck() {
    console.log('📋 Running OWASP Dependency Check...');
    
    try {
      const config = this.config.dependency_check;
      const reportPath = path.join(this.reportsDir, 'dependency-check');
      
      const command = `dependency-check \
        --project "${config.project_name}" \
        --scan ${config.scan_directories.join(' --scan ')} \
        --format ${config.formats.join(' --format ')} \
        --out ${reportPath} \
        --failOnCVSS ${config.fail_on_cvss} \
        --exclude "${config.exclude_patterns.join('|')}"`;

      const result = await this.runCommand(command, { timeout: 900000 }); // 15 minutes
      
      return {
        tool: 'dependency-check',
        success: result.code === 0,
        reportPath: reportPath,
        output: result.stdout
      };
    } catch (error) {
      return {
        tool: 'dependency-check',
        success: false,
        error: error.message
      };
    }
  }

  async runSemgrepAnalysis() {
    console.log('🔎 Running Semgrep static analysis...');
    
    try {
      const config = this.config.semgrep;
      const reportPath = path.join(this.reportsDir, 'semgrep-results.json');
      
      const command = `semgrep \
        --config=${config.rules.join(' --config=')} \
        --exclude="${config.paths.exclude.join(',')}" \
        --json \
        --output=${reportPath} \
        ${config.paths.include.join(' ')}`;

      const result = await this.runCommand(command);
      
      return {
        tool: 'semgrep',
        success: result.code === 0,
        reportPath: reportPath,
        output: result.stdout
      };
    } catch (error) {
      return {
        tool: 'semgrep',
        success: false,
        error: error.message
      };
    }
  }

  async runTrivyFilesystemScan() {
    console.log('🔍 Running Trivy filesystem scan...');
    
    try {
      const config = this.config.trivy;
      const reportPath = path.join(this.reportsDir, 'trivy-filesystem.json');
      
      const command = `trivy fs \
        --format json \
        --output ${reportPath} \
        --severity ${config.severity_levels.join(',')} \
        --cache-dir ${config.cache_dir} \
        .`;

      const result = await this.runCommand(command);
      
      return {
        tool: 'trivy-fs',
        success: result.code === 0,
        reportPath: reportPath
      };
    } catch (error) {
      return {
        tool: 'trivy-fs',
        success: false,
        error: error.message
      };
    }
  }

  async runDynamicAnalysis() {
    console.log('🌐 Running dynamic analysis security tests...');
    
    const tests = [];

    // OWASP ZAP scanning
    if (this.config.zap) {
      tests.push(this.runZapScan());
    }

    // API security testing
    if (this.config.postman_newman) {
      tests.push(this.runAPISecurityTests());
    }

    // SSL/TLS testing
    if (this.config.sslyze) {
      tests.push(this.runSSLTesting());
    }

    const results = await Promise.allSettled(tests);
    return this.processDynamicAnalysisResults(results);
  }

  async runZapScan() {
    console.log('🕷️ Running OWASP ZAP scan...');
    
    try {
      const zapConfig = this.config.zap;
      const reportPath = path.join(this.reportsDir, 'zap-report.html');
      
      // Start ZAP daemon
      const zapCommand = `zap.sh -daemon -host ${zapConfig.proxy.host} -port ${zapConfig.proxy.port}`;
      const zapProcess = spawn('sh', ['-c', zapCommand]);
      
      // Wait for ZAP to start
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Run spider scan
      if (zapConfig.spider.enabled) {
        await this.runCommand(`zap-cli spider http://localhost:3000`);
        await this.runCommand(`zap-cli spider http://localhost:3001`);
      }
      
      // Run active scan
      if (zapConfig.active_scan.enabled) {
        await this.runCommand(`zap-cli active-scan http://localhost:3000`);
        await this.runCommand(`zap-cli active-scan http://localhost:3001`);
      }
      
      // Generate report
      await this.runCommand(`zap-cli report -o ${reportPath} -f html`);
      
      // Shutdown ZAP
      zapProcess.kill();
      
      return {
        tool: 'zap',
        success: true,
        reportPath: reportPath
      };
    } catch (error) {
      return {
        tool: 'zap',
        success: false,
        error: error.message
      };
    }
  }

  async runAPISecurityTests() {
    console.log('🔌 Running API security tests...');
    
    try {
      const config = this.config.postman_newman;
      const reportDir = path.join(this.reportsDir, 'api-security');
      
      await fs.mkdir(reportDir, { recursive: true });
      
      const command = `newman run ${config.collections[0]} \
        --environment ${config.environments[0]} \
        --reporters ${config.reporters.join(',')} \
        --reporter-htmlextra-export ${path.join(reportDir, 'api-security-report.html')} \
        --reporter-junit-export ${path.join(reportDir, 'api-security-results.xml')}`;

      const result = await this.runCommand(command);
      
      return {
        tool: 'newman',
        success: result.code === 0,
        reportDir: reportDir
      };
    } catch (error) {
      return {
        tool: 'newman',
        success: false,
        error: error.message
      };
    }
  }

  async runSSLTesting() {
    console.log('🔐 Running SSL/TLS security tests...');
    
    try {
      const config = this.config.sslyze;
      const reportPath = path.join(this.reportsDir, 'ssl-analysis.json');
      
      const targets = config.targets.map(t => `${t.hostname}:${t.port}`).join(' ');
      const commands = config.scan_commands.join(' --');
      
      const command = `sslyze --json_out=${reportPath} --${commands} ${targets}`;
      
      const result = await this.runCommand(command);
      
      return {
        tool: 'sslyze',
        success: result.code === 0,
        reportPath: reportPath
      };
    } catch (error) {
      return {
        tool: 'sslyze',
        success: false,
        error: error.message
      };
    }
  }

  async runMobileSecurityTests() {
    console.log('📱 Running mobile security tests...');
    
    // This would integrate with MobSF or similar tools
    try {
      const config = this.config.mobsf;
      
      // Check if APK/IPA files exist
      const androidApk = config.android.apk_path;
      const iosIpa = config.ios.ipa_path;
      
      const results = [];
      
      // Test Android APK if available
      try {
        await fs.access(androidApk);
        console.log('📱 Testing Android APK...');
        
        // Upload APK to MobSF and run analysis
        const uploadResult = await this.runCommand(`curl -X POST \
          -F "file=@${androidApk}" \
          ${config.server_url}/api/v1/upload`);
        
        results.push({
          platform: 'android',
          success: uploadResult.code === 0,
          result: JSON.parse(uploadResult.stdout)
        });
      } catch (error) {
        console.warn('⚠️  Android APK not found, skipping mobile security test');
      }
      
      // Test iOS IPA if available
      try {
        await fs.access(iosIpa);
        console.log('📱 Testing iOS IPA...');
        
        const uploadResult = await this.runCommand(`curl -X POST \
          -F "file=@${iosIpa}" \
          ${config.server_url}/api/v1/upload`);
        
        results.push({
          platform: 'ios',
          success: uploadResult.code === 0,
          result: JSON.parse(uploadResult.stdout)
        });
      } catch (error) {
        console.warn('⚠️  iOS IPA not found, skipping mobile security test');
      }
      
      return {
        tool: 'mobsf',
        success: results.length > 0 && results.every(r => r.success),
        results: results
      };
    } catch (error) {
      return {
        tool: 'mobsf',
        success: false,
        error: error.message
      };
    }
  }

  processStaticAnalysisResults(results) {
    console.log('📊 Processing static analysis results...');
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${result.value.tool} completed successfully`);
        this.results.tests[result.value.tool] = result.value;
        this.results.summary.passed++;
      } else {
        console.error(`❌ ${result.reason.tool || `Test ${index}`} failed:`, result.reason.error || result.reason);
        this.results.tests[`failed_test_${index}`] = result.reason;
        this.results.summary.failed++;
      }
      this.results.summary.total++;
    });
    
    return results;
  }

  processDynamicAnalysisResults(results) {
    console.log('🌐 Processing dynamic analysis results...');
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${result.value.tool} completed successfully`);
        this.results.tests[result.value.tool] = result.value;
        this.results.summary.passed++;
      } else {
        console.error(`❌ ${result.reason.tool || `Test ${index}`} failed:`, result.reason.error || result.reason);
        this.results.tests[`failed_test_${index}`] = result.reason;
        this.results.summary.failed++;
      }
      this.results.summary.total++;
    });
    
    return results;
  }

  async generateReport() {
    console.log('📄 Generating security test report...');
    
    const reportData = {
      ...this.results,
      config_used: this.config,
      recommendations: this.generateRecommendations()
    };
    
    // Generate JSON report
    const jsonReportPath = path.join(this.reportsDir, 'security-test-results.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    const htmlReportPath = path.join(this.reportsDir, 'security-test-report.html');
    await this.generateHTMLReport(reportData, htmlReportPath);
    
    console.log(`📊 Reports generated:`);
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
    <title>Security Test Report - LinkedIn Headshot Generator</title>
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
        .critical { color: #dc3545; }
        .high { color: #fd7e14; }
        .medium { color: #ffc107; }
        .low { color: #28a745; }
        .test-results { margin-top: 30px; }
        .test-item { margin-bottom: 20px; padding: 15px; border: 1px solid #dee2e6; border-radius: 4px; }
        .test-success { border-left: 4px solid #28a745; }
        .test-failure { border-left: 4px solid #dc3545; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Security Test Report</h1>
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
                <h3>Critical Issues</h3>
                <div class="value critical">${data.summary.critical}</div>
            </div>
            <div class="metric">
                <h3>High Issues</h3>
                <div class="value high">${data.summary.high}</div>
            </div>
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
            <h3>Security Recommendations</h3>
            <ul>
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    </div>
</body>
</html>`;
    
    await fs.writeFile(outputPath, html);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.critical > 0) {
      recommendations.push('Address all critical vulnerabilities immediately before production deployment');
    }
    
    if (this.results.summary.high > 0) {
      recommendations.push('Review and remediate high-severity issues within the current sprint');
    }
    
    if (this.results.summary.failed > 0) {
      recommendations.push('Investigate failed security tests and ensure all tools are properly configured');
    }
    
    // Add general security recommendations
    recommendations.push(
      'Implement regular security scanning in CI/CD pipeline',
      'Conduct periodic penetration testing by external security experts',
      'Ensure all team members receive security awareness training',
      'Establish incident response procedures for security vulnerabilities',
      'Regular security architecture reviews for new features'
    );
    
    return recommendations;
  }

  async sendNotifications(results) {
    if (!this.config.notifications) return;
    
    const { slack, email, conditions } = this.config.notifications;
    
    const shouldNotify = conditions.some(condition => {
      if (condition.severity && results.summary[condition.severity] > 0 && condition.immediate) {
        return true;
      }
      if (condition.new_vulnerabilities && results.summary.total > 0) {
        return true;
      }
      return false;
    });
    
    if (!shouldNotify) return;
    
    console.log('📢 Sending security test notifications...');
    
    // Send Slack notification
    if (slack && process.env[slack.webhook_url_env]) {
      try {
        const message = this.formatSlackMessage(results);
        await this.runCommand(`curl -X POST -H 'Content-type: application/json' \
          --data '${JSON.stringify(message)}' ${process.env[slack.webhook_url_env]}`);
        console.log('✅ Slack notification sent');
      } catch (error) {
        console.error('❌ Failed to send Slack notification:', error.message);
      }
    }
  }

  formatSlackMessage(results) {
    const status = results.summary.failed === 0 ? '✅ PASSED' : '❌ FAILED';
    const color = results.summary.failed === 0 ? 'good' : 'danger';
    
    return {
      channel: this.config.notifications.slack.channel,
      attachments: [{
        color: color,
        title: `Security Test Results - ${status}`,
        fields: [
          { title: 'Total Tests', value: results.summary.total, short: true },
          { title: 'Passed', value: results.summary.passed, short: true },
          { title: 'Failed', value: results.summary.failed, short: true },
          { title: 'Critical Issues', value: results.summary.critical, short: true },
          { title: 'High Issues', value: results.summary.high, short: true },
          { title: 'Medium Issues', value: results.summary.medium, short: true }
        ],
        footer: 'LinkedIn Headshot Generator Security Tests',
        ts: Math.floor(Date.now() / 1000)
      }]
    };
  }

  async run() {
    console.log('🚀 Starting security test suite...');
    
    await this.initialize();
    await this.checkPrerequisites();
    
    // Run all security tests
    await this.runStaticAnalysis();
    await this.runDynamicAnalysis();
    await this.runMobileSecurityTests();
    
    // Generate reports
    const finalResults = await this.generateReport();
    
    // Send notifications
    await this.sendNotifications(finalResults);
    
    // Print summary
    console.log('\n📊 Security Test Summary:');
    console.log(`   Total Tests: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Critical Issues: ${this.results.summary.critical}`);
    console.log(`   High Issues: ${this.results.summary.high}`);
    
    // Exit with appropriate code
    const exitCode = this.results.summary.critical > 0 ? 2 : 
                    this.results.summary.failed > 0 ? 1 : 0;
    
    console.log(`\n${exitCode === 0 ? '✅' : '❌'} Security testing completed with exit code: ${exitCode}`);
    process.exit(exitCode);
  }
}

// CLI interface
if (require.main === module) {
  const runner = new SecurityTestRunner();
  runner.run().catch(error => {
    console.error('💥 Security test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = SecurityTestRunner;