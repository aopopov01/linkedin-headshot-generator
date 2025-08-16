#!/usr/bin/env node

/**
 * Concurrency Testing Module
 * Tests system behavior under concurrent load scenarios
 */

const axios = require('axios');
const colors = require('colors');

class ConcurrencyTester {
    constructor() {
        this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        this.results = {
            scenarios: {},
            resourceUtilization: [],
            connectionMetrics: {},
            summary: {
                totalConcurrentRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                timeouts: 0,
                connectionErrors: 0,
                averageResponseTime: 0,
                concurrencySuccess: true
            }
        };
        
        this.concurrencyScenarios = [
            {
                name: 'Low Concurrency',
                concurrent: 10,
                iterations: 5,
                timeout: 5000,
                endpoints: ['health', 'platforms', 'styles']
            },
            {
                name: 'Medium Concurrency',
                concurrent: 50,
                iterations: 3,
                timeout: 10000,
                endpoints: ['health', 'platforms', 'styles', 'metrics']
            },
            {
                name: 'High Concurrency',
                concurrent: 100,
                iterations: 2,
                timeout: 15000,
                endpoints: ['health', 'platforms', 'styles', 'metrics']
            },
            {
                name: 'Extreme Concurrency',
                concurrent: 200,
                iterations: 1,
                timeout: 20000,
                endpoints: ['health', 'platforms']
            },
            {
                name: 'Mixed Workload',
                concurrent: 75,
                iterations: 3,
                timeout: 12000,
                endpoints: ['health', 'platforms', 'styles', 'metrics', 'cost-estimate'],
                mixed: true
            }
        ];
    }

    async runConcurrencyTest() {
        console.log(colors.blue('⚡ Starting Concurrency Testing...\\n'));
        
        for (const scenario of this.concurrencyScenarios) {
            console.log(colors.yellow(`🔄 Testing ${scenario.name} (${scenario.concurrent} concurrent requests)...`));
            
            const scenarioResults = await this.executeScenario(scenario);
            
            if (scenarioResults.success) {
                console.log(colors.green(`✅ ${scenario.name} passed - Success Rate: ${scenarioResults.successRate}%`));
            } else {
                console.log(colors.red(`❌ ${scenario.name} failed - Success Rate: ${scenarioResults.successRate}%`));
                this.results.summary.concurrencySuccess = false;
            }
            
            console.log(colors.gray(`   Response Time: avg ${scenarioResults.averageResponseTime}ms, max ${scenarioResults.maxResponseTime}ms\\n`));
            
            // Recovery period between scenarios
            await this.sleep(3000);
        }
        
        await this.testConnectionPooling();
        await this.testDatabaseConcurrency();
        
        this.generateReport();
    }

    async executeScenario(scenario) {
        const results = [];
        const startTime = Date.now();
        
        for (let iteration = 0; iteration < scenario.iterations; iteration++) {
            const promises = [];
            
            // Create concurrent requests
            for (let i = 0; i < scenario.concurrent; i++) {
                const endpoint = this.selectEndpoint(scenario);
                promises.push(this.makeConcurrentRequest(endpoint, scenario.timeout));
            }
            
            // Wait for all requests to complete
            const batchResults = await Promise.allSettled(promises);
            
            // Process results
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    results.push({
                        success: false,
                        error: result.reason.message,
                        timeout: result.reason.code === 'ECONNABORTED',
                        responseTime: scenario.timeout,
                        timestamp: new Date().toISOString()
                    });
                }
            });
            
            // Brief pause between iterations
            if (iteration < scenario.iterations - 1) {
                await this.sleep(1000);
            }
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        const timeouts = results.filter(r => r.timeout).length;
        
        const scenarioResult = {
            scenario: scenario.name,
            concurrent: scenario.concurrent,
            iterations: scenario.iterations,
            duration,
            total: results.length,
            successful,
            failed,
            timeouts,
            successRate: Math.round((successful / results.length) * 100),
            averageResponseTime: this.calculateAverage(results.map(r => r.responseTime)),
            maxResponseTime: Math.max(...results.map(r => r.responseTime)),
            minResponseTime: Math.min(...results.map(r => r.responseTime)),
            success: successful / results.length >= 0.95, // 95% success rate threshold
            requests: results
        };
        
        this.results.scenarios[scenario.name] = scenarioResult;
        this.updateSummary(results);
        
        return scenarioResult;
    }

    selectEndpoint(scenario) {
        if (scenario.mixed) {
            // For mixed workloads, weight different endpoints differently
            const weights = {
                'health': 0.3,
                'platforms': 0.2,
                'styles': 0.2,
                'metrics': 0.15,
                'cost-estimate': 0.15
            };
            
            const random = Math.random();
            let cumulative = 0;
            
            for (const [endpoint, weight] of Object.entries(weights)) {
                cumulative += weight;
                if (random <= cumulative && scenario.endpoints.includes(endpoint)) {
                    return endpoint;
                }
            }
        }
        
        return scenario.endpoints[Math.floor(Math.random() * scenario.endpoints.length)];
    }

    async makeConcurrentRequest(endpoint, timeout) {
        const startTime = Date.now();
        
        try {
            const config = {
                timeout,
                maxRedirects: 0,
                headers: {
                    'Connection': 'keep-alive',
                    'User-Agent': 'OmniShot-Concurrency-Tester/1.0'
                }
            };
            
            let response;
            
            switch (endpoint) {
                case 'health':
                    response = await axios.get(`${this.baseUrl}/health`, config);
                    break;
                case 'platforms':
                    response = await axios.get(`${this.baseUrl}/api/v1/platforms`, config);
                    break;
                case 'styles':
                    response = await axios.get(`${this.baseUrl}/api/v1/styles`, config);
                    break;
                case 'metrics':
                    response = await axios.get(`${this.baseUrl}/api/v1/metrics`, config);
                    break;
                case 'cost-estimate':
                    response = await axios.post(`${this.baseUrl}/api/v1/estimate-cost`, {
                        platforms: ['linkedin'],
                        style: 'professional'
                    }, config);
                    break;
                default:
                    throw new Error(`Unknown endpoint: ${endpoint}`);
            }
            
            const responseTime = Date.now() - startTime;
            
            return {
                endpoint,
                success: response.status >= 200 && response.status < 300,
                statusCode: response.status,
                responseTime,
                responseSize: JSON.stringify(response.data).length,
                timeout: false,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            return {
                endpoint,
                success: false,
                statusCode: error.response?.status || 0,
                responseTime,
                timeout: error.code === 'ECONNABORTED',
                connectionError: error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async testConnectionPooling() {
        console.log(colors.yellow('🔗 Testing Connection Pooling...'));
        
        const poolingResults = [];
        const concurrent = 50;
        const iterations = 3;
        
        for (let i = 0; i < iterations; i++) {
            const promises = [];
            const startTime = Date.now();
            
            // Create many simultaneous connections
            for (let j = 0; j < concurrent; j++) {
                promises.push(this.makeConcurrentRequest('health', 10000));
            }
            
            const results = await Promise.allSettled(promises);
            const duration = Date.now() - startTime;
            
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const connectionErrors = results.filter(r => 
                r.status === 'rejected' || 
                (r.status === 'fulfilled' && r.value.connectionError)
            ).length;
            
            poolingResults.push({
                iteration: i + 1,
                concurrent,
                duration,
                successful,
                connectionErrors,
                successRate: Math.round((successful / concurrent) * 100)
            });
        }
        
        this.results.connectionMetrics = {
            poolingTest: poolingResults,
            averageSuccessRate: this.calculateAverage(poolingResults.map(r => r.successRate)),
            totalConnectionErrors: poolingResults.reduce((sum, r) => sum + r.connectionErrors, 0)
        };
        
        console.log(colors.green(`✅ Connection Pooling Test completed`));
    }

    async testDatabaseConcurrency() {
        console.log(colors.yellow('🗄️  Testing Database Concurrency...'));
        
        // Simulate database-heavy operations by hitting metrics endpoint
        const dbResults = [];
        const concurrent = 30;
        const iterations = 2;
        
        for (let i = 0; i < iterations; i++) {
            const promises = [];
            const startTime = Date.now();
            
            for (let j = 0; j < concurrent; j++) {
                promises.push(this.makeConcurrentRequest('metrics', 15000));
            }
            
            const results = await Promise.allSettled(promises);
            const duration = Date.now() - startTime;
            
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const dbTimeouts = results.filter(r => 
                r.status === 'fulfilled' && r.value.timeout
            ).length;
            
            dbResults.push({
                iteration: i + 1,
                concurrent,
                duration,
                successful,
                dbTimeouts,
                successRate: Math.round((successful / concurrent) * 100)
            });
        }
        
        this.results.connectionMetrics.databaseTest = dbResults;
        
        console.log(colors.green(`✅ Database Concurrency Test completed`));
    }

    updateSummary(requests) {
        this.results.summary.totalConcurrentRequests += requests.length;
        this.results.summary.successfulRequests += requests.filter(r => r.success).length;
        this.results.summary.failedRequests += requests.filter(r => !r.success).length;
        this.results.summary.timeouts += requests.filter(r => r.timeout).length;
        this.results.summary.connectionErrors += requests.filter(r => r.connectionError).length;
        
        const responseTimes = requests.map(r => r.responseTime);
        this.results.summary.averageResponseTime = this.calculateAverage([
            ...responseTimes,
            ...Array(this.results.summary.totalConcurrentRequests - requests.length).fill(this.results.summary.averageResponseTime)
        ]);
    }

    calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
    }

    generateReport() {
        console.log(colors.cyan('\\n⚡ Concurrency Test Results:\\n'));
        
        console.log(colors.yellow('Summary:'));
        console.log(`  Total Concurrent Requests: ${this.results.summary.totalConcurrentRequests}`);
        console.log(`  Successful: ${this.results.summary.successfulRequests}`);
        console.log(`  Failed: ${this.results.summary.failedRequests}`);
        console.log(`  Timeouts: ${this.results.summary.timeouts}`);
        console.log(`  Connection Errors: ${this.results.summary.connectionErrors}`);
        console.log(`  Success Rate: ${Math.round((this.results.summary.successfulRequests / this.results.summary.totalConcurrentRequests) * 100)}%`);
        console.log(`  Avg Response Time: ${this.results.summary.averageResponseTime}ms`);
        
        console.log(colors.yellow('\\nScenario Results:'));
        Object.values(this.results.scenarios).forEach(scenario => {
            console.log(`  ${scenario.scenario} (${scenario.concurrent} concurrent):`);
            console.log(`    Success Rate: ${scenario.successRate}%`);
            console.log(`    Avg Response Time: ${scenario.averageResponseTime}ms`);
            console.log(`    Max Response Time: ${scenario.maxResponseTime}ms`);
            console.log(`    Timeouts: ${scenario.timeouts}`);
        });
        
        if (this.results.connectionMetrics.poolingTest) {
            console.log(colors.yellow('\\nConnection Pooling:'));
            console.log(`  Average Success Rate: ${this.results.connectionMetrics.averageSuccessRate}%`);
            console.log(`  Total Connection Errors: ${this.results.connectionMetrics.totalConnectionErrors}`);
        }
        
        if (this.results.connectionMetrics.databaseTest) {
            console.log(colors.yellow('\\nDatabase Concurrency:'));
            const dbAvgSuccess = this.calculateAverage(
                this.results.connectionMetrics.databaseTest.map(r => r.successRate)
            );
            console.log(`  Average Success Rate: ${dbAvgSuccess}%`);
        }
        
        // Identify issues
        const criticalIssues = this.identifyIssues();
        if (criticalIssues.length > 0) {
            console.log(colors.red('\\n⚠️  Critical Issues Detected:'));
            criticalIssues.forEach(issue => {
                console.log(colors.red(`  ❌ ${issue}`));
            });
        }
        
        console.log(colors.green('\\n✅ Concurrency Testing completed\\n'));
        
        // Exit with error code if critical issues found
        process.exit(criticalIssues.length > 0 ? 1 : 0);
    }

    identifyIssues() {
        const issues = [];
        
        // Check overall concurrency success
        if (!this.results.summary.concurrencySuccess) {
            issues.push('System fails under concurrent load');
        }
        
        // Check timeout rate
        const timeoutRate = (this.results.summary.timeouts / this.results.summary.totalConcurrentRequests) * 100;
        if (timeoutRate > 5) {
            issues.push(`High timeout rate: ${Math.round(timeoutRate)}%`);
        }
        
        // Check connection error rate
        const connectionErrorRate = (this.results.summary.connectionErrors / this.results.summary.totalConcurrentRequests) * 100;
        if (connectionErrorRate > 2) {
            issues.push(`High connection error rate: ${Math.round(connectionErrorRate)}%`);
        }
        
        // Check individual scenarios
        Object.values(this.results.scenarios).forEach(scenario => {
            if (scenario.successRate < 90) {
                issues.push(`${scenario.scenario} has low success rate: ${scenario.successRate}%`);
            }
            if (scenario.averageResponseTime > 3000) {
                issues.push(`${scenario.scenario} has high response time under load: ${scenario.averageResponseTime}ms`);
            }
        });
        
        // Check connection pooling
        if (this.results.connectionMetrics.averageSuccessRate < 90) {
            issues.push(`Connection pooling issues: ${this.results.connectionMetrics.averageSuccessRate}% success rate`);
        }
        
        return issues;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the concurrency test if this is the main module
if (require.main === module) {
    const tester = new ConcurrencyTester();
    tester.runConcurrencyTest().catch(error => {
        console.error(colors.red('Concurrency testing failed:'), error.message);
        process.exit(1);
    });
}

module.exports = ConcurrencyTester;