#!/usr/bin/env node

/**
 * Testing Environment Health Check
 * Validates that all testing infrastructure is properly configured and functional
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

class HealthCheck {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overall_status: 'unknown',
      checks: {},
      recommendations: []
    };
  }

  /**
   * Run a shell command and return result
   */
  async runCommand(command, args, options = {}) {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0
        });
      });
    });
  }

  /**
   * Check if a file or directory exists
   */
  async checkFileExists(filePath, description) {
    const exists = await fs.pathExists(filePath);
    this.results.checks[description] = {
      status: exists ? 'pass' : 'fail',
      details: exists ? `Found: ${filePath}` : `Missing: ${filePath}`,
      path: filePath
    };
    return exists;
  }

  /**
   * Check if a command is available
   */
  async checkCommandAvailable(command, description, version_flag = '--version') {
    const result = await this.runCommand(command, [version_flag]);
    this.results.checks[description] = {
      status: result.success ? 'pass' : 'fail',
      details: result.success ? 
        `Available: ${result.stdout.split('\n')[0]}` : 
        `Not found: ${command}`,
      command: command
    };
    return result.success;
  }

  /**
   * Check Node.js and npm versions
   */
  async checkNodeEnvironment() {
    console.log(chalk.blue('🔍 Checking Node.js environment...'));
    
    const nodeResult = await this.runCommand('node', ['--version']);
    const npmResult = await this.runCommand('npm', ['--version']);
    
    this.results.checks['Node.js version'] = {
      status: nodeResult.success ? 'pass' : 'fail',
      details: nodeResult.success ? nodeResult.stdout.trim() : 'Node.js not found'
    };

    this.results.checks['npm version'] = {
      status: npmResult.success ? 'pass' : 'fail',
      details: npmResult.success ? npmResult.stdout.trim() : 'npm not found'
    };

    if (nodeResult.success) {
      const version = nodeResult.stdout.trim().replace('v', '');
      const majorVersion = parseInt(version.split('.')[0]);
      if (majorVersion < 16) {
        this.results.recommendations.push('Upgrade Node.js to version 16 or higher');
      }
    }
  }

  /**
   * Check project structure
   */
  async checkProjectStructure() {
    console.log(chalk.blue('🏗️  Checking project structure...'));

    const requiredPaths = [
      ['LinkedInHeadshotApp/', 'Mobile app directory'],
      ['backend/', 'Backend directory'],
      ['scripts/', 'Scripts directory'],
      ['security-testing/', 'Security testing directory'],
      ['performance-testing/', 'Performance testing directory'],
      ['accessibility-testing/', 'Accessibility testing directory'],
      ['app-store-validation/', 'App store validation directory'],
      ['.github/workflows/', 'GitHub workflows directory'],
      ['.github/testing-config.yml', 'Testing configuration file'],
      ['scripts/test-runner.js', 'Test runner script'],
      ['COMPREHENSIVE_TESTING_STRATEGY.md', 'Testing strategy document']
    ];

    for (const [filePath, description] of requiredPaths) {
      await this.checkFileExists(filePath, description);
    }
  }

  /**
   * Check package.json files and dependencies
   */
  async checkDependencies() {
    console.log(chalk.blue('📦 Checking dependencies...'));

    const packagePaths = [
      ['package.json', 'Root package.json'],
      ['LinkedInHeadshotApp/package.json', 'Mobile app package.json'],
      ['backend/package.json', 'Backend package.json'],
      ['scripts/package.json', 'Scripts package.json'],
      ['security-testing/package.json', 'Security testing package.json'],
      ['performance-testing/package.json', 'Performance testing package.json'],
      ['accessibility-testing/package.json', 'Accessibility testing package.json']
    ];

    for (const [packagePath, description] of packagePaths) {
      const exists = await this.checkFileExists(packagePath, description);
      
      if (exists) {
        try {
          const packageJson = await fs.readJson(packagePath);
          this.results.checks[`${description} validation`] = {
            status: 'pass',
            details: `Valid JSON with ${Object.keys(packageJson.dependencies || {}).length} dependencies`
          };
        } catch (error) {
          this.results.checks[`${description} validation`] = {
            status: 'fail',
            details: `Invalid JSON: ${error.message}`
          };
        }
      }
    }

    // Check if node_modules are installed
    const nodeModulesPaths = [
      'LinkedInHeadshotApp/node_modules',
      'backend/node_modules', 
      'scripts/node_modules'
    ];

    for (const modulePath of nodeModulesPaths) {
      const exists = await fs.pathExists(modulePath);
      this.results.checks[`${modulePath} installed`] = {
        status: exists ? 'pass' : 'warn',
        details: exists ? 'Dependencies installed' : 'Dependencies not installed (run npm install)'
      };
      
      if (!exists) {
        this.results.recommendations.push(`Install dependencies in ${path.dirname(modulePath)}: cd ${path.dirname(modulePath)} && npm install`);
      }
    }
  }

  /**
   * Check testing tools availability
   */
  async checkTestingTools() {
    console.log(chalk.blue('🧪 Checking testing tools...'));

    const tools = [
      ['java', 'Java (for Android builds)', '--version'],
      ['python3', 'Python 3 (for reports server)', '--version'],
      ['docker', 'Docker (for security tools)', '--version'],
      ['git', 'Git version control', '--version']
    ];

    for (const [command, description, flag] of tools) {
      await this.checkCommandAvailable(command, description, flag);
    }

    // Check React Native CLI
    const rnResult = await this.runCommand('npx', ['react-native', '--version']);
    this.results.checks['React Native CLI'] = {
      status: rnResult.success ? 'pass' : 'warn',
      details: rnResult.success ? 
        rnResult.stdout.split('\n')[0] : 
        'React Native CLI not found (will be installed with project dependencies)'
    };
  }

  /**
   * Check environment variables
   */
  async checkEnvironmentVariables() {
    console.log(chalk.blue('🌍 Checking environment variables...'));

    const requiredEnvVars = [
      ['NODE_ENV', 'Node environment', false],
      ['DATABASE_URL', 'Database URL (for integration tests)', false],
      ['REDIS_URL', 'Redis URL (for caching tests)', false]
    ];

    const optionalEnvVars = [
      ['SNYK_TOKEN', 'Snyk security scanning'],
      ['SLACK_WEBHOOK_URL', 'Slack notifications'],
      ['SONAR_TOKEN', 'SonarCloud analysis']
    ];

    for (const [envVar, description, required] of requiredEnvVars) {
      const value = process.env[envVar];
      this.results.checks[`Environment: ${description}`] = {
        status: value ? 'pass' : (required ? 'fail' : 'warn'),
        details: value ? 'Set' : 'Not set'
      };
    }

    for (const [envVar, description] of optionalEnvVars) {
      const value = process.env[envVar];
      this.results.checks[`Optional: ${description}`] = {
        status: value ? 'pass' : 'info',
        details: value ? 'Set' : 'Not set (optional for full functionality)'
      };
    }
  }

  /**
   * Check database connectivity (if configured)
   */
  async checkDatabaseConnectivity() {
    console.log(chalk.blue('🗃️  Checking database connectivity...'));

    if (!process.env.DATABASE_URL) {
      this.results.checks['Database connectivity'] = {
        status: 'skip',
        details: 'No DATABASE_URL configured'
      };
      return;
    }

    try {
      // Basic connection test would go here
      // For now, just validate URL format
      const url = new URL(process.env.DATABASE_URL);
      this.results.checks['Database URL format'] = {
        status: 'pass',
        details: `Valid URL for ${url.protocol}//${url.hostname}`
      };
    } catch (error) {
      this.results.checks['Database URL format'] = {
        status: 'fail',
        details: `Invalid DATABASE_URL: ${error.message}`
      };
    }
  }

  /**
   * Check test directories and permissions
   */
  async checkTestDirectories() {
    console.log(chalk.blue('📁 Checking test directories...'));

    const testDirs = [
      'reports',
      'LinkedInHeadshotApp/__tests__',
      'LinkedInHeadshotApp/e2e',
      'backend/src/tests'
    ];

    for (const dir of testDirs) {
      try {
        await fs.ensureDir(dir);
        this.results.checks[`Test directory: ${dir}`] = {
          status: 'pass',
          details: 'Directory exists or was created'
        };
      } catch (error) {
        this.results.checks[`Test directory: ${dir}`] = {
          status: 'fail',
          details: `Cannot create directory: ${error.message}`
        };
      }
    }
  }

  /**
   * Run all health checks
   */
  async runAllChecks() {
    console.log(chalk.blue('🏥 Starting testing environment health check...\n'));

    try {
      await this.checkNodeEnvironment();
      await this.checkProjectStructure();
      await this.checkDependencies();
      await this.checkTestingTools();
      await this.checkEnvironmentVariables();
      await this.checkDatabaseConnectivity();
      await this.checkTestDirectories();

      this.analyzeResults();
      this.printResults();
      
    } catch (error) {
      console.error(chalk.red('❌ Health check failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Analyze check results and set overall status
   */
  analyzeResults() {
    const checks = Object.values(this.results.checks);
    const failed = checks.filter(c => c.status === 'fail').length;
    const warnings = checks.filter(c => c.status === 'warn').length;
    const passed = checks.filter(c => c.status === 'pass').length;

    if (failed > 0) {
      this.results.overall_status = 'fail';
    } else if (warnings > 0) {
      this.results.overall_status = 'warn';
    } else {
      this.results.overall_status = 'pass';
    }

    this.results.summary = {
      total: checks.length,
      passed,
      warnings,
      failed,
      skipped: checks.filter(c => c.status === 'skip').length
    };
  }

  /**
   * Print health check results
   */
  printResults() {
    console.log(chalk.blue('\n📊 Health Check Results\n'));

    // Print summary
    const { summary } = this.results;
    console.log(chalk.blue('Summary:'));
    console.log(`  Total Checks: ${summary.total}`);
    console.log(`  ${chalk.green('Passed')}: ${summary.passed}`);
    console.log(`  ${chalk.yellow('Warnings')}: ${summary.warnings}`);
    console.log(`  ${chalk.red('Failed')}: ${summary.failed}`);
    console.log(`  Skipped: ${summary.skipped}\n`);

    // Print detailed results
    console.log(chalk.blue('Detailed Results:'));
    for (const [checkName, result] of Object.entries(this.results.checks)) {
      let icon, color;
      
      switch (result.status) {
        case 'pass':
          icon = '✅';
          color = chalk.green;
          break;
        case 'warn':
          icon = '⚠️ ';
          color = chalk.yellow;
          break;
        case 'fail':
          icon = '❌';
          color = chalk.red;
          break;
        case 'info':
          icon = 'ℹ️ ';
          color = chalk.blue;
          break;
        default:
          icon = '⏭️ ';
          color = chalk.gray;
      }

      console.log(`  ${icon} ${color(checkName)}: ${result.details}`);
    }

    // Print recommendations
    if (this.results.recommendations.length > 0) {
      console.log(chalk.blue('\n💡 Recommendations:'));
      this.results.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    // Print overall status
    console.log(chalk.blue('\n🏥 Overall Health Status:'));
    switch (this.results.overall_status) {
      case 'pass':
        console.log(chalk.green('✅ HEALTHY - All systems operational'));
        break;
      case 'warn':
        console.log(chalk.yellow('⚠️  CAUTION - Some issues detected, but tests should work'));
        break;
      case 'fail':
        console.log(chalk.red('❌ UNHEALTHY - Critical issues detected, tests may fail'));
        process.exit(1);
        break;
    }

    // Save results
    this.saveResults();
  }

  /**
   * Save health check results to file
   */
  async saveResults() {
    try {
      await fs.ensureDir('./reports/health-check');
      const filename = `health-check-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = `./reports/health-check/${filename}`;
      
      await fs.writeJson(filepath, this.results, { spaces: 2 });
      console.log(chalk.gray(`\n📄 Results saved to: ${filepath}`));
    } catch (error) {
      console.error(chalk.red('Failed to save results:'), error.message);
    }
  }
}

// Run health check if called directly
if (require.main === module) {
  const healthCheck = new HealthCheck();
  healthCheck.runAllChecks();
}

module.exports = HealthCheck;