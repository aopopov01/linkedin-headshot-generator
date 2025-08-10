#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Orchestrates all testing suites with centralized configuration and reporting
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { spawn, exec } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const commander = require('commander');

class TestRunner {
  constructor() {
    this.config = null;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {},
      suites: {},
      artifacts: [],
      errors: []
    };
    this.spinner = null;
  }

  /**
   * Load testing configuration
   */
  async loadConfig() {
    try {
      const configPath = path.join(__dirname, '../.github/testing-config.yml');
      const configContent = await fs.readFile(configPath, 'utf8');
      this.config = yaml.load(configContent);
      console.log(chalk.green('✅ Configuration loaded successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to load configuration:', error.message));
      process.exit(1);
    }
  }

  /**
   * Initialize test environment
   */
  async initializeEnvironment(environment = 'development') {
    console.log(chalk.blue(`🔧 Initializing ${environment} environment...`));
    
    const envConfig = this.config.environments[environment];
    if (!envConfig) {
      throw new Error(`Environment ${environment} not found in configuration`);
    }

    // Set environment variables
    process.env.DATABASE_URL = envConfig.database_url;
    process.env.REDIS_URL = envConfig.redis_url;
    process.env.TARGET_URL = envConfig.target_url;
    process.env.TEST_TIMEOUT = envConfig.test_timeout.toString();

    console.log(chalk.green(`✅ Environment ${environment} initialized`));
  }

  /**
   * Run a specific test suite
   */
  async runTestSuite(suiteName, options = {}) {
    const suiteConfig = this.config.test_suites[suiteName];
    if (!suiteConfig || !suiteConfig.enabled) {
      console.log(chalk.yellow(`⏭️  Skipping disabled suite: ${suiteName}`));
      return { skipped: true };
    }

    console.log(chalk.blue(`🧪 Running ${suiteName}...`));
    this.spinner = ora(`Running ${suiteName} tests`).start();

    const startTime = Date.now();
    let result = {
      suite: suiteName,
      startTime,
      endTime: null,
      duration: 0,
      status: 'running',
      passed: 0,
      failed: 0,
      coverage: null,
      artifacts: []
    };

    try {
      switch (suiteName) {
        case 'unit_tests':
          result = await this.runUnitTests(suiteConfig);
          break;
        case 'integration_tests':
          result = await this.runIntegrationTests(suiteConfig);
          break;
        case 'e2e_tests':
          result = await this.runE2ETests(suiteConfig);
          break;
        case 'security_tests':
          result = await this.runSecurityTests(suiteConfig);
          break;
        case 'performance_tests':
          result = await this.runPerformanceTests(suiteConfig);
          break;
        case 'accessibility_tests':
          result = await this.runAccessibilityTests(suiteConfig);
          break;
        case 'app_store_validation':
          result = await this.runAppStoreValidation(suiteConfig);
          break;
        default:
          throw new Error(`Unknown test suite: ${suiteName}`);
      }

      result.endTime = Date.now();
      result.duration = result.endTime - startTime;
      result.status = result.failed > 0 ? 'failed' : 'passed';

      this.spinner.succeed(`${suiteName} completed: ${result.passed} passed, ${result.failed} failed`);
      
    } catch (error) {
      result.endTime = Date.now();
      result.duration = result.endTime - startTime;
      result.status = 'error';
      result.error = error.message;
      
      this.spinner.fail(`${suiteName} failed: ${error.message}`);
      this.results.errors.push({
        suite: suiteName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    this.results.suites[suiteName] = result;
    return result;
  }

  /**
   * Run unit tests
   */
  async runUnitTests(config) {
    return new Promise((resolve, reject) => {
      const commands = [
        {
          name: 'Mobile App Unit Tests',
          cwd: './LinkedInHeadshotApp',
          command: 'npm',
          args: ['run', 'test:unit', '--', '--coverage', '--watchAll=false', '--verbose']
        },
        {
          name: 'Backend Unit Tests',
          cwd: './backend',
          command: 'npm',
          args: ['run', 'test:unit', '--', '--coverage', '--verbose']
        }
      ];

      let passed = 0;
      let failed = 0;
      let completed = 0;
      const artifacts = [];

      commands.forEach((cmd) => {
        const child = spawn(cmd.command, cmd.args, {
          cwd: cmd.cwd,
          stdio: 'pipe'
        });

        let output = '';
        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          output += data.toString();
        });

        child.on('close', (code) => {
          if (code === 0) {
            passed++;
          } else {
            failed++;
          }

          // Extract coverage information
          const coverageMatch = output.match(/All files\s+\|\s+([0-9.]+)/);
          const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : null;

          artifacts.push({
            name: `${cmd.name} Results`,
            path: `${cmd.cwd}/coverage/`,
            type: 'coverage'
          });

          completed++;
          if (completed === commands.length) {
            resolve({
              passed,
              failed,
              coverage,
              artifacts
            });
          }
        });
      });
    });
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests(config) {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'test:integration', '--', '--verbose'], {
        cwd: './backend',
        stdio: 'pipe'
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        const passed = code === 0 ? 1 : 0;
        const failed = code === 0 ? 0 : 1;

        resolve({
          passed,
          failed,
          artifacts: [{
            name: 'Integration Test Results',
            path: './backend/test-results/',
            type: 'test-results'
          }]
        });
      });
    });
  }

  /**
   * Run E2E tests
   */
  async runE2ETests(config) {
    return new Promise((resolve, reject) => {
      const platforms = config.platforms || ['ios'];
      let passed = 0;
      let failed = 0;
      let completed = 0;
      const artifacts = [];

      platforms.forEach((platform) => {
        const child = spawn('npm', ['run', `test:e2e:${platform}`], {
          cwd: './LinkedInHeadshotApp',
          stdio: 'pipe'
        });

        child.on('close', (code) => {
          if (code === 0) {
            passed++;
          } else {
            failed++;
          }

          artifacts.push({
            name: `E2E ${platform} Results`,
            path: `./LinkedInHeadshotApp/e2e/artifacts/`,
            type: 'e2e-results'
          });

          completed++;
          if (completed === platforms.length) {
            resolve({
              passed,
              failed,
              artifacts
            });
          }
        });
      });
    });
  }

  /**
   * Run security tests
   */
  async runSecurityTests(config) {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'test:security'], {
        cwd: './security-testing',
        stdio: 'pipe'
      });

      child.on('close', (code) => {
        const passed = code === 0 ? 1 : 0;
        const failed = code === 0 ? 0 : 1;

        resolve({
          passed,
          failed,
          artifacts: [{
            name: 'Security Test Results',
            path: './security-testing/reports/',
            type: 'security-reports'
          }]
        });
      });
    });
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests(config) {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'test:performance'], {
        cwd: './performance-testing',
        stdio: 'pipe'
      });

      child.on('close', (code) => {
        const passed = code === 0 ? 1 : 0;
        const failed = code === 0 ? 0 : 1;

        resolve({
          passed,
          failed,
          artifacts: [{
            name: 'Performance Test Results',
            path: './performance-testing/reports/',
            type: 'performance-reports'
          }]
        });
      });
    });
  }

  /**
   * Run accessibility tests
   */
  async runAccessibilityTests(config) {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'test:accessibility'], {
        cwd: './accessibility-testing',
        stdio: 'pipe'
      });

      child.on('close', (code) => {
        const passed = code === 0 ? 1 : 0;
        const failed = code === 0 ? 0 : 1;

        resolve({
          passed,
          failed,
          artifacts: [{
            name: 'Accessibility Test Results',
            path: './accessibility-testing/reports/',
            type: 'accessibility-reports'
          }]
        });
      });
    });
  }

  /**
   * Run app store validation
   */
  async runAppStoreValidation(config) {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'validate:all'], {
        cwd: './app-store-validation',
        stdio: 'pipe'
      });

      child.on('close', (code) => {
        const passed = code === 0 ? 1 : 0;
        const failed = code === 0 ? 0 : 1;

        resolve({
          passed,
          failed,
          artifacts: [{
            name: 'App Store Validation Results',
            path: './app-store-validation/reports/',
            type: 'validation-reports'
          }]
        });
      });
    });
  }

  /**
   * Evaluate quality gates
   */
  evaluateQualityGates() {
    const gates = this.config.quality_gates;
    const results = this.results.suites;
    const violations = [];

    console.log(chalk.blue('🚪 Evaluating quality gates...'));

    for (const [gateName, gateConfig] of Object.entries(gates)) {
      if (!gateConfig.required) continue;

      const suiteResult = results[gateName];
      if (!suiteResult) {
        violations.push(`Missing required test suite: ${gateName}`);
        continue;
      }

      if (suiteResult.status === 'error' || suiteResult.status === 'failed') {
        violations.push(`Quality gate failed: ${gateName}`);
      }

      // Check specific thresholds
      if (gateConfig.min_coverage && suiteResult.coverage < gateConfig.min_coverage) {
        violations.push(`Coverage below threshold for ${gateName}: ${suiteResult.coverage}% < ${gateConfig.min_coverage}%`);
      }

      if (gateConfig.max_failed_tests && suiteResult.failed > gateConfig.max_failed_tests) {
        violations.push(`Too many failed tests for ${gateName}: ${suiteResult.failed} > ${gateConfig.max_failed_tests}`);
      }
    }

    if (violations.length > 0) {
      console.log(chalk.red('❌ Quality gates failed:'));
      violations.forEach(v => console.log(chalk.red(`  - ${v}`)));
      return false;
    }

    console.log(chalk.green('✅ All quality gates passed'));
    return true;
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    const reportDir = './reports/test-runner';
    await fs.ensureDir(reportDir);

    // Calculate summary statistics
    const suites = Object.values(this.results.suites);
    this.results.summary = {
      total_suites: suites.length,
      passed_suites: suites.filter(s => s.status === 'passed').length,
      failed_suites: suites.filter(s => s.status === 'failed').length,
      error_suites: suites.filter(s => s.status === 'error').length,
      total_tests: suites.reduce((sum, s) => sum + (s.passed || 0) + (s.failed || 0), 0),
      passed_tests: suites.reduce((sum, s) => sum + (s.passed || 0), 0),
      failed_tests: suites.reduce((sum, s) => sum + (s.failed || 0), 0),
      total_duration: suites.reduce((sum, s) => sum + (s.duration || 0), 0)
    };

    // Collect all artifacts
    this.results.artifacts = suites.reduce((all, s) => all.concat(s.artifacts || []), []);

    // Write JSON report
    await fs.writeJson(path.join(reportDir, 'test-results.json'), this.results, { spaces: 2 });

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    await fs.writeFile(path.join(reportDir, 'test-results.html'), htmlReport);

    // Generate markdown summary
    const markdownReport = this.generateMarkdownReport();
    await fs.writeFile(path.join(reportDir, 'TEST_SUMMARY.md'), markdownReport);

    console.log(chalk.green(`📊 Test reports generated in ${reportDir}/`));
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport() {
    const { summary, suites, timestamp } = this.results;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Comprehensive Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { border-left: 4px solid #4CAF50; }
        .failed { border-left: 4px solid #f44336; }
        .error { border-left: 4px solid #ff9800; }
        .artifacts { margin-top: 10px; }
        .artifact { background: #f0f0f0; padding: 5px 10px; margin: 2px 0; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive Test Results</h1>
        <p>Generated: ${timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Suites</h3>
            <div style="font-size: 24px; font-weight: bold;">${summary.total_suites}</div>
        </div>
        <div class="metric">
            <h3>Passed Tests</h3>
            <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${summary.passed_tests}</div>
        </div>
        <div class="metric">
            <h3>Failed Tests</h3>
            <div style="font-size: 24px; font-weight: bold; color: #f44336;">${summary.failed_tests}</div>
        </div>
        <div class="metric">
            <h3>Duration</h3>
            <div style="font-size: 24px; font-weight: bold;">${Math.round(summary.total_duration / 1000)}s</div>
        </div>
    </div>
    
    <h2>Test Suite Results</h2>
    ${Object.values(suites).map(suite => `
        <div class="suite ${suite.status}">
            <h3>${suite.suite}</h3>
            <p>Status: <strong>${suite.status}</strong></p>
            <p>Passed: ${suite.passed} | Failed: ${suite.failed} | Duration: ${Math.round((suite.duration || 0) / 1000)}s</p>
            ${suite.coverage ? `<p>Coverage: ${suite.coverage}%</p>` : ''}
            ${suite.error ? `<p style="color: #f44336;">Error: ${suite.error}</p>` : ''}
            <div class="artifacts">
                <strong>Artifacts:</strong>
                ${(suite.artifacts || []).map(artifact => `
                    <div class="artifact">${artifact.name} (${artifact.type})</div>
                `).join('')}
            </div>
        </div>
    `).join('')}
</body>
</html>
    `;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport() {
    const { summary, suites, timestamp } = this.results;
    
    return `# Comprehensive Test Results

**Generated:** ${timestamp}

## Summary

| Metric | Value |
|--------|-------|
| Total Suites | ${summary.total_suites} |
| Passed Suites | ${summary.passed_suites} |
| Failed Suites | ${summary.failed_suites} |
| Error Suites | ${summary.error_suites} |
| Total Tests | ${summary.total_tests} |
| Passed Tests | ${summary.passed_tests} |
| Failed Tests | ${summary.failed_tests} |
| Total Duration | ${Math.round(summary.total_duration / 1000)}s |

## Test Suite Results

${Object.values(suites).map(suite => `
### ${suite.suite}

- **Status:** ${suite.status === 'passed' ? '✅' : suite.status === 'failed' ? '❌' : '⚠️'} ${suite.status}
- **Passed:** ${suite.passed}
- **Failed:** ${suite.failed}
- **Duration:** ${Math.round((suite.duration || 0) / 1000)}s
${suite.coverage ? `- **Coverage:** ${suite.coverage}%` : ''}
${suite.error ? `- **Error:** ${suite.error}` : ''}

**Artifacts:**
${(suite.artifacts || []).map(artifact => `- ${artifact.name} (${artifact.type})`).join('\n')}
`).join('')}

## Quality Gates

${this.evaluateQualityGates() ? '✅ All quality gates passed' : '❌ Quality gates failed'}
`;
  }

  /**
   * Run all tests based on trigger type
   */
  async runAll(trigger = 'manual', environment = 'development', options = {}) {
    console.log(chalk.blue(`🚀 Starting comprehensive test run`));
    console.log(chalk.blue(`📋 Trigger: ${trigger}, Environment: ${environment}`));

    await this.loadConfig();
    await this.initializeEnvironment(environment);

    const triggerConfig = this.config.triggers[trigger] || this.config.triggers.manual;
    const suitesToRun = triggerConfig.run_suites || Object.keys(this.config.test_suites);

    console.log(chalk.blue(`🧪 Running ${suitesToRun.length} test suites...`));

    for (const suiteName of suitesToRun) {
      if (options.skip && options.skip.includes(suiteName)) {
        console.log(chalk.yellow(`⏭️  Skipping ${suiteName} (user requested)`));
        continue;
      }

      await this.runTestSuite(suiteName, options);
    }

    const qualityGatesPassed = this.evaluateQualityGates();
    await this.generateReport();

    // Print final summary
    console.log(chalk.blue('\n📊 Final Summary:'));
    console.log(`Total Suites: ${this.results.summary.total_suites}`);
    console.log(`Passed: ${chalk.green(this.results.summary.passed_suites)}`);
    console.log(`Failed: ${chalk.red(this.results.summary.failed_suites)}`);
    console.log(`Errors: ${chalk.yellow(this.results.summary.error_suites)}`);
    console.log(`Quality Gates: ${qualityGatesPassed ? chalk.green('PASSED') : chalk.red('FAILED')}`);

    if (!qualityGatesPassed || this.results.summary.failed_suites > 0 || this.results.summary.error_suites > 0) {
      console.log(chalk.red('\n❌ Test run completed with failures'));
      process.exit(1);
    } else {
      console.log(chalk.green('\n✅ Test run completed successfully'));
    }
  }
}

// CLI Interface
const program = new commander.Command();

program
  .name('test-runner')
  .description('Comprehensive test runner for LinkedIn Headshot Generator')
  .version('1.0.0');

program
  .command('run')
  .description('Run all tests')
  .option('-t, --trigger <trigger>', 'trigger type (pull_request, push_main, nightly, deployment)', 'manual')
  .option('-e, --environment <env>', 'environment (development, staging, production)', 'development')
  .option('-s, --skip <suites>', 'comma-separated list of suites to skip')
  .option('--verbose', 'verbose output')
  .action(async (options) => {
    const runner = new TestRunner();
    const skipSuites = options.skip ? options.skip.split(',').map(s => s.trim()) : [];
    
    await runner.runAll(options.trigger, options.environment, {
      skip: skipSuites,
      verbose: options.verbose
    });
  });

program
  .command('suite <name>')
  .description('Run a specific test suite')
  .option('-e, --environment <env>', 'environment', 'development')
  .action(async (suiteName, options) => {
    const runner = new TestRunner();
    await runner.loadConfig();
    await runner.initializeEnvironment(options.environment);
    await runner.runTestSuite(suiteName);
    await runner.generateReport();
  });

program
  .command('config')
  .description('Show current configuration')
  .action(async () => {
    const runner = new TestRunner();
    await runner.loadConfig();
    console.log(JSON.stringify(runner.config, null, 2));
  });

if (require.main === module) {
  program.parse();
}

module.exports = TestRunner;