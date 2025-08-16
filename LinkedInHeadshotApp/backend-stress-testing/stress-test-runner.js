#!/usr/bin/env node

/**
 * Comprehensive Backend Stress Testing Suite for OmniShot
 * Site Reliability Engineering - Performance & Scalability Analysis
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const colors = require('colors');

class StressTestRunner {
    constructor() {
        this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        this.resultsDir = './results';
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.testSuites = [
            { name: 'API Load Testing', script: './load-testing/api-load-test.js', critical: true },
            { name: 'Concurrency Testing', script: './concurrency-testing/concurrent-requests.js', critical: true },
            { name: 'Resource Limits Testing', script: './limit-testing/resource-limits.js', critical: true },
            { name: 'Error Handling Testing', script: './error-testing/error-handling.js', critical: false },
            { name: 'Scalability Analysis', script: './scalability-testing/scalability-analysis.js', critical: true },
            { name: 'Resource Monitoring', script: './monitoring/resource-monitor.js', critical: false }
        ];
        this.results = {};
        this.overallHealth = 'unknown';
        this.criticalIssues = [];
        this.recommendations = [];
    }

    async initialize() {
        console.log(colors.cyan('🔧 Initializing OmniShot Backend Stress Testing Suite...\\n'));
        
        // Create results directory
        if (!fs.existsSync(this.resultsDir)) {
            fs.mkdirSync(this.resultsDir, { recursive: true });
        }

        // Verify backend is running
        const isRunning = await this.verifyBackendHealth();
        if (!isRunning) {
            console.log(colors.red('❌ Backend is not accessible. Please ensure the backend is running on ' + this.baseUrl));
            process.exit(1);
        }

        console.log(colors.green('✅ Backend is accessible and responding\\n'));
    }

    async verifyBackendHealth() {
        try {
            const axios = require('axios');
            const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
            console.log(colors.yellow('📊 Initial Health Status:'), response.data.status);
            return true;
        } catch (error) {
            console.log(colors.red('❌ Health check failed:'), error.message);
            return false;
        }
    }

    async runTestSuite(testSuite) {
        console.log(colors.blue(`🧪 Running ${testSuite.name}...`));
        
        return new Promise((resolve) => {
            const startTime = Date.now();
            const process = spawn('node', [testSuite.script], {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: { ...process.env, API_BASE_URL: this.baseUrl }
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                const duration = Date.now() - startTime;
                const result = {
                    name: testSuite.name,
                    success: code === 0,
                    duration,
                    output: stdout,
                    errors: stderr,
                    critical: testSuite.critical,
                    timestamp: new Date().toISOString()
                };

                this.results[testSuite.name] = result;

                if (code === 0) {
                    console.log(colors.green(`✅ ${testSuite.name} completed successfully (${duration}ms)`));
                } else {
                    console.log(colors.red(`❌ ${testSuite.name} failed (${duration}ms)`));
                    if (testSuite.critical) {
                        this.criticalIssues.push(`${testSuite.name} failed with exit code ${code}`);
                    }
                }

                resolve(result);
            });

            // Set timeout for long-running tests
            setTimeout(() => {
                if (!process.killed) {
                    console.log(colors.yellow(`⏰ ${testSuite.name} taking longer than expected...`));
                }
            }, 30000);
        });
    }

    async runAllTests() {
        console.log(colors.cyan('🚀 Starting comprehensive stress testing...\\n'));
        
        const startTime = Date.now();
        
        for (const testSuite of this.testSuites) {
            await this.runTestSuite(testSuite);
            
            // Brief pause between tests to allow system recovery
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const totalDuration = Date.now() - startTime;
        console.log(colors.cyan(`\\n⏱️  Total testing duration: ${Math.round(totalDuration / 1000)}s\\n`));
        
        this.analyzeResults();
        await this.generateReport();
    }

    analyzeResults() {
        console.log(colors.cyan('📊 Analyzing results...\\n'));
        
        const successful = Object.values(this.results).filter(r => r.success).length;
        const total = Object.values(this.results).length;
        const criticalFailures = this.criticalIssues.length;
        
        // Determine overall health
        if (criticalFailures === 0 && successful === total) {
            this.overallHealth = 'healthy';
        } else if (criticalFailures === 0) {
            this.overallHealth = 'degraded';
        } else {
            this.overallHealth = 'unhealthy';
        }

        // Generate recommendations
        this.generateRecommendations();
        
        console.log(colors.yellow('📈 Analysis Summary:'));
        console.log(`   Success Rate: ${successful}/${total} (${Math.round(successful/total*100)}%)`);
        console.log(`   Critical Issues: ${criticalFailures}`);
        console.log(`   Overall Health: ${this.getHealthColor(this.overallHealth)}`);
        console.log();
    }

    generateRecommendations() {
        const failedCritical = Object.values(this.results)
            .filter(r => !r.success && r.critical)
            .map(r => r.name);

        if (failedCritical.includes('API Load Testing')) {
            this.recommendations.push('CRITICAL: API endpoints are failing under load. Investigate rate limiting and request handling.');
        }
        
        if (failedCritical.includes('Concurrency Testing')) {
            this.recommendations.push('CRITICAL: System fails under concurrent load. Check database connection pools and resource locking.');
        }
        
        if (failedCritical.includes('Resource Limits Testing')) {
            this.recommendations.push('HIGH: Resource limits are being exceeded. Monitor memory usage and implement proper resource management.');
        }
        
        if (failedCritical.includes('Scalability Analysis')) {
            this.recommendations.push('HIGH: System not ready for horizontal scaling. Review stateless design and shared resource management.');
        }

        // Add general recommendations
        this.recommendations.push('Monitor API response times continuously');
        this.recommendations.push('Implement comprehensive health checks for all service dependencies');
        this.recommendations.push('Set up automated alerting for critical performance metrics');
        this.recommendations.push('Consider implementing circuit breakers for external service calls');
    }

    getHealthColor(status) {
        switch (status) {
            case 'healthy': return colors.green(status);
            case 'degraded': return colors.yellow(status);
            case 'unhealthy': return colors.red(status);
            default: return colors.gray(status);
        }
    }

    async generateReport() {
        const report = {
            timestamp: this.timestamp,
            summary: {
                overallHealth: this.overallHealth,
                totalTests: Object.keys(this.results).length,
                successfulTests: Object.values(this.results).filter(r => r.success).length,
                criticalIssues: this.criticalIssues.length,
                recommendations: this.recommendations
            },
            results: this.results,
            criticalIssues: this.criticalIssues,
            environment: {
                baseUrl: this.baseUrl,
                nodeVersion: process.version,
                platform: process.platform,
                architecture: process.arch
            }
        };

        const reportPath = path.join(this.resultsDir, `stress-test-report-${this.timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(colors.cyan('📄 Generating final report...\\n'));
        console.log(colors.green(`✅ Complete report saved to: ${reportPath}`));
        
        // Generate summary
        this.printSummary(report);
        
        return report;
    }

    printSummary(report) {
        console.log(colors.cyan('\\n' + '='.repeat(80)));
        console.log(colors.cyan('                    OMNISHOT BACKEND STRESS TEST SUMMARY'));
        console.log(colors.cyan('='.repeat(80)));
        
        console.log(colors.yellow('\\n📊 OVERALL HEALTH:'), this.getHealthColor(report.summary.overallHealth).toUpperCase());
        console.log(colors.yellow('🧪 TESTS EXECUTED:'), `${report.summary.successfulTests}/${report.summary.totalTests}`);
        console.log(colors.yellow('⚠️  CRITICAL ISSUES:'), report.summary.criticalIssues);
        
        if (report.criticalIssues.length > 0) {
            console.log(colors.red('\\n🚨 CRITICAL ISSUES:'));
            report.criticalIssues.forEach(issue => {
                console.log(colors.red(`   ❌ ${issue}`));
            });
        }
        
        console.log(colors.yellow('\\n💡 KEY RECOMMENDATIONS:'));
        report.summary.recommendations.slice(0, 5).forEach(rec => {
            console.log(colors.white(`   • ${rec}`));
        });
        
        console.log(colors.cyan('\\n' + '='.repeat(80)));
        
        // Exit with appropriate code
        process.exit(report.summary.criticalIssues > 0 ? 1 : 0);
    }
}

// Run the stress test suite
async function main() {
    const runner = new StressTestRunner();
    
    try {
        await runner.initialize();
        await runner.runAllTests();
    } catch (error) {
        console.error(colors.red('❌ Stress testing failed:'), error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = StressTestRunner;