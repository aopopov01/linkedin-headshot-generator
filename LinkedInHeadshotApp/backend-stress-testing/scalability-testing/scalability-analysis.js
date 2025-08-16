#!/usr/bin/env node

/**
 * Scalability Analysis Module
 * Tests system scalability and horizontal scaling readiness
 */

const axios = require('axios');
const colors = require('colors');

class ScalabilityAnalyzer {
    constructor() {
        this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        this.results = {
            tests: {},
            scalabilityMetrics: {},
            horizontalScalingReadiness: {},
            summary: {
                totalScalabilityTests: 0,
                passedTests: 0,
                failedTests: 0,
                maxThroughput: 0,
                scalingBottlenecks: [],
                horizontalScalingReady: false
            }
        };
        
        this.scalabilityTests = [
            { name: 'Throughput Analysis', test: 'testThroughputScaling' },
            { name: 'Response Time Scaling', test: 'testResponseTimeScaling' },
            { name: 'Resource Utilization Scaling', test: 'testResourceUtilizationScaling' },
            { name: 'Session Affinity Requirements', test: 'testSessionAffinity' },
            { name: 'State Management Analysis', test: 'testStateManagement' },
            { name: 'Database Scaling Impact', test: 'testDatabaseScaling' },
            { name: 'Cache Effectiveness', test: 'testCacheScaling' },
            { name: 'Load Distribution Readiness', test: 'testLoadDistribution' }
        ];
        
        this.loadLevels = [
            { name: 'Baseline', users: 10, duration: 30000 },
            { name: 'Low Load', users: 50, duration: 45000 },
            { name: 'Medium Load', users: 150, duration: 60000 },
            { name: 'High Load', users: 300, duration: 75000 },
            { name: 'Peak Load', users: 500, duration: 90000 },
            { name: 'Stress Load', users: 750, duration: 60000 },
            { name: 'Breaking Point', users: 1000, duration: 45000 }
        ];
    }

    async runScalabilityAnalysis() {
        console.log(colors.blue('📈 Starting Scalability Analysis...\\n'));
        
        for (const test of this.scalabilityTests) {
            console.log(colors.yellow(`🧪 Running ${test.name}...`));
            
            try {
                const result = await this[test.test]();
                this.results.tests[test.name] = result;
                
                if (result.success) {
                    console.log(colors.green(`✅ ${test.name} - Scaling characteristics analyzed`));
                    this.results.summary.passedTests++;
                } else {
                    console.log(colors.red(`❌ ${test.name} - Scaling issues detected`));
                    this.results.summary.failedTests++;
                    if (result.bottlenecks) {
                        this.results.summary.scalingBottlenecks.push(...result.bottlenecks);
                    }
                }
                
                this.results.summary.totalScalabilityTests++;
                
                // Recovery period between tests
                await this.sleep(5000);
                
            } catch (error) {
                console.log(colors.red(`❌ ${test.name} failed:`, error.message));
                this.results.tests[test.name] = {
                    success: false,
                    error: error.message
                };
                this.results.summary.failedTests++;
                this.results.summary.totalScalabilityTests++;
            }
        }
        
        this.analyzeHorizontalScalingReadiness();
        this.generateReport();
    }

    async testThroughputScaling() {
        console.log(colors.gray('   Analyzing throughput scaling characteristics...'));
        
        const throughputResults = [];
        
        for (const level of this.loadLevels) {
            try {
                console.log(colors.gray(`     Testing ${level.name} (${level.users} users)...`));
                
                const startTime = Date.now();
                const promises = [];
                
                // Create concurrent users
                for (let i = 0; i < level.users; i++) {
                    promises.push(this.simulateUserSession(level.duration / level.users));
                }
                
                const results = await Promise.allSettled(promises);
                const endTime = Date.now();
                
                const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
                const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;
                const totalRequests = results.reduce((sum, r) => sum + (r.value?.requests || 0), 0);
                const totalDuration = endTime - startTime;
                
                const throughput = (totalRequests / totalDuration) * 1000; // requests per second
                const successRate = (successful / level.users) * 100;
                
                throughputResults.push({
                    level: level.name,
                    users: level.users,
                    duration: totalDuration,
                    throughput,
                    successRate,
                    totalRequests,
                    successful,
                    failed
                });
                
                this.results.summary.maxThroughput = Math.max(this.results.summary.maxThroughput, throughput);
                
                // Break if success rate drops below 70%
                if (successRate < 70) {
                    console.log(colors.yellow(`     Breaking point reached at ${level.name}`));
                    break;
                }
                
            } catch (error) {
                throughputResults.push({
                    level: level.name,
                    error: error.message
                });
                break;
            }
        }
        
        // Analyze throughput scaling pattern
        const scalingPattern = this.analyzeThroughputPattern(throughputResults);
        
        return {
            success: throughputResults.length >= 3,
            throughputResults,
            scalingPattern,
            maxThroughput: this.results.summary.maxThroughput,
            bottlenecks: scalingPattern.bottlenecks || []
        };
    }

    async testResponseTimeScaling() {
        console.log(colors.gray('   Analyzing response time scaling...'));
        
        const responseTimeResults = [];
        
        for (const level of this.loadLevels.slice(0, 5)) { // Test first 5 levels
            try {
                const promises = [];
                const responseTimes = [];
                
                for (let i = 0; i < level.users; i++) {
                    promises.push(this.measureResponseTime());
                }
                
                const results = await Promise.allSettled(promises);
                
                results.forEach(result => {
                    if (result.status === 'fulfilled' && result.value.responseTime) {
                        responseTimes.push(result.value.responseTime);
                    }
                });
                
                const avgResponseTime = responseTimes.length > 0 ? 
                    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
                const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
                const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
                
                responseTimeResults.push({
                    level: level.name,
                    users: level.users,
                    avgResponseTime,
                    maxResponseTime,
                    p95ResponseTime,
                    samples: responseTimes.length
                });
                
            } catch (error) {
                responseTimeResults.push({
                    level: level.name,
                    error: error.message
                });
            }
        }
        
        // Analyze response time degradation
        const degradationAnalysis = this.analyzeResponseTimeDegradation(responseTimeResults);
        
        return {
            success: responseTimeResults.length >= 3,
            responseTimeResults,
            degradationAnalysis,
            bottlenecks: degradationAnalysis.bottlenecks || []
        };
    }

    async testResourceUtilizationScaling() {
        console.log(colors.gray('   Testing resource utilization scaling...'));
        
        const resourceResults = [];
        
        for (const level of this.loadLevels.slice(0, 4)) {
            try {
                const beforeMetrics = await this.getSystemMetrics();
                
                // Generate load
                const promises = [];
                for (let i = 0; i < level.users; i++) {
                    promises.push(this.generateResourceLoad());
                }
                
                await Promise.allSettled(promises);
                
                const afterMetrics = await this.getSystemMetrics();
                
                resourceResults.push({
                    level: level.name,
                    users: level.users,
                    cpuIncrease: afterMetrics.cpu - beforeMetrics.cpu,
                    memoryIncrease: afterMetrics.memory - beforeMetrics.memory,
                    connectionsIncrease: afterMetrics.connections - beforeMetrics.connections,
                    efficiency: this.calculateResourceEfficiency(level.users, afterMetrics, beforeMetrics)
                });
                
            } catch (error) {
                resourceResults.push({
                    level: level.name,
                    error: error.message
                });
            }
        }
        
        return {
            success: resourceResults.length >= 2,
            resourceResults,
            scalingEfficiency: this.analyzeResourceEfficiency(resourceResults)
        };
    }

    async testSessionAffinity() {
        console.log(colors.gray('   Testing session affinity requirements...'));
        
        const sessionTests = [];
        
        // Test if requests need to be tied to specific server instances
        for (let i = 0; i < 5; i++) {
            try {
                const sessionId = `test-session-${i}`;
                const requests = [];
                
                // Make multiple requests with same session context
                for (let j = 0; j < 10; j++) {
                    requests.push(
                        axios.get(`${this.baseUrl}/api/v1/metrics`, {
                            headers: { 'X-Session-ID': sessionId },
                            timeout: 10000
                        })
                    );
                }
                
                const results = await Promise.allSettled(requests);
                const successful = results.filter(r => r.status === 'fulfilled').length;
                
                sessionTests.push({
                    sessionId,
                    requests: requests.length,
                    successful,
                    consistentBehavior: successful === requests.length
                });
                
            } catch (error) {
                sessionTests.push({
                    sessionId: `test-session-${i}`,
                    error: error.message
                });
            }
        }
        
        const requiresAffinity = sessionTests.some(test => !test.consistentBehavior);
        
        return {
            success: true,
            sessionTests,
            requiresAffinity,
            stateless: !requiresAffinity
        };
    }

    async testStateManagement() {
        console.log(colors.gray('   Analyzing state management for scaling...'));
        
        const stateTests = [];
        
        try {
            // Test concurrent modifications
            const promises = [];
            for (let i = 0; i < 20; i++) {
                promises.push(
                    axios.post(`${this.baseUrl}/api/v1/estimate-cost`, {
                        platforms: ['linkedin'],
                        style: 'professional'
                    }, { timeout: 10000 })
                );
            }
            
            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            
            stateTests.push({
                test: 'Concurrent State Access',
                requests: promises.length,
                successful,
                stateConsistency: successful / promises.length >= 0.95
            });
            
        } catch (error) {
            stateTests.push({
                test: 'Concurrent State Access',
                error: error.message
            });
        }
        
        return {
            success: stateTests.length > 0,
            stateTests,
            statelessDesign: stateTests.every(test => test.stateConsistency)
        };
    }

    async testDatabaseScaling() {
        console.log(colors.gray('   Testing database scaling impact...'));
        
        const dbScalingResults = [];
        const concurrencyLevels = [10, 25, 50, 100];
        
        for (const concurrency of concurrencyLevels) {
            try {
                const promises = [];
                const startTime = Date.now();
                
                for (let i = 0; i < concurrency; i++) {
                    promises.push(
                        axios.get(`${this.baseUrl}/api/v1/metrics`, {
                            timeout: 15000
                        })
                    );
                }
                
                const results = await Promise.allSettled(promises);
                const duration = Date.now() - startTime;
                
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;
                
                dbScalingResults.push({
                    concurrency,
                    duration,
                    successful,
                    failed,
                    successRate: (successful / concurrency) * 100,
                    avgResponseTime: duration / concurrency
                });
                
            } catch (error) {
                dbScalingResults.push({
                    concurrency,
                    error: error.message
                });
            }
        }
        
        return {
            success: dbScalingResults.length >= 2,
            dbScalingResults,
            databaseBottleneck: this.identifyDatabaseBottleneck(dbScalingResults)
        };
    }

    async testCacheScaling() {
        console.log(colors.gray('   Testing cache effectiveness under load...'));
        
        const cacheResults = [];
        
        try {
            // Test repeated requests for caching
            const endpoint = '/api/v1/platforms';
            const iterations = [1, 10, 50, 100];
            
            for (const iteration of iterations) {
                const promises = [];
                const startTime = Date.now();
                
                for (let i = 0; i < iteration; i++) {
                    promises.push(
                        axios.get(`${this.baseUrl}${endpoint}`, {
                            timeout: 10000
                        })
                    );
                }
                
                const results = await Promise.allSettled(promises);
                const duration = Date.now() - startTime;
                
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const avgResponseTime = successful > 0 ? duration / successful : 0;
                
                cacheResults.push({
                    requests: iteration,
                    duration,
                    successful,
                    avgResponseTime,
                    cacheEffective: iteration > 1 && avgResponseTime < cacheResults[0]?.avgResponseTime * 1.5
                });
            }
            
        } catch (error) {
            cacheResults.push({
                error: error.message
            });
        }
        
        return {
            success: cacheResults.length >= 2,
            cacheResults,
            cachingEffective: cacheResults.some(r => r.cacheEffective)
        };
    }

    async testLoadDistribution() {
        console.log(colors.gray('   Testing load distribution readiness...'));
        
        const distributionTests = [];
        
        try {
            // Simulate requests from different sources
            const sourceTests = ['source-a', 'source-b', 'source-c'];
            
            for (const source of sourceTests) {
                const promises = [];
                
                for (let i = 0; i < 20; i++) {
                    promises.push(
                        axios.get(`${this.baseUrl}/health`, {
                            headers: { 'X-Source': source },
                            timeout: 10000
                        })
                    );
                }
                
                const results = await Promise.allSettled(promises);
                const successful = results.filter(r => r.status === 'fulfilled').length;
                
                distributionTests.push({
                    source,
                    requests: promises.length,
                    successful,
                    distributionReady: successful === promises.length
                });
            }
            
        } catch (error) {
            distributionTests.push({
                error: error.message
            });
        }
        
        return {
            success: distributionTests.length > 0,
            distributionTests,
            loadDistributionReady: distributionTests.every(test => test.distributionReady)
        };
    }

    async simulateUserSession(duration) {
        const requests = [];
        const startTime = Date.now();
        
        while (Date.now() - startTime < duration) {
            try {
                const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
                requests.push({
                    success: response.status === 200,
                    responseTime: Date.now() - startTime
                });
            } catch (error) {
                requests.push({
                    success: false,
                    error: error.message
                });
            }
            
            await this.sleep(Math.random() * 1000); // Random delay between requests
        }
        
        return {
            success: requests.filter(r => r.success).length > requests.length * 0.8,
            requests: requests.length,
            successRate: (requests.filter(r => r.success).length / requests.length) * 100
        };
    }

    async measureResponseTime() {
        const startTime = Date.now();
        
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/metrics`, { timeout: 10000 });
            return {
                responseTime: Date.now() - startTime,
                success: response.status === 200
            };
        } catch (error) {
            return {
                responseTime: Date.now() - startTime,
                success: false,
                error: error.message
            };
        }
    }

    async generateResourceLoad() {
        try {
            const response = await axios.post(`${this.baseUrl}/api/v1/estimate-cost`, {
                platforms: ['linkedin', 'instagram', 'facebook'],
                style: 'professional'
            }, { timeout: 10000 });
            
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async getSystemMetrics() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/metrics`, { timeout: 10000 });
            return {
                cpu: response.data?.data?.resources?.cpuUsage || 0,
                memory: response.data?.data?.resources?.memoryUsage || 0,
                connections: response.data?.data?.resources?.activeConnections || 0
            };
        } catch (error) {
            return { cpu: 0, memory: 0, connections: 0 };
        }
    }

    analyzeThroughputPattern(results) {
        const bottlenecks = [];
        
        // Check for linear scaling
        let previousThroughput = 0;
        for (const result of results) {
            if (result.throughput && previousThroughput > 0) {
                const scalingRatio = result.throughput / previousThroughput;
                if (scalingRatio < 0.8) {
                    bottlenecks.push(`Throughput scaling degrades at ${result.level}`);
                }
            }
            previousThroughput = result.throughput || 0;
        }
        
        return {
            linearScaling: bottlenecks.length === 0,
            bottlenecks
        };
    }

    analyzeResponseTimeDegradation(results) {
        const bottlenecks = [];
        
        let baselineResponseTime = 0;
        for (const result of results) {
            if (result.avgResponseTime) {
                if (baselineResponseTime === 0) {
                    baselineResponseTime = result.avgResponseTime;
                } else if (result.avgResponseTime > baselineResponseTime * 3) {
                    bottlenecks.push(`Response time degrades significantly at ${result.level}`);
                }
            }
        }
        
        return {
            acceptableDegradation: bottlenecks.length === 0,
            bottlenecks
        };
    }

    calculateResourceEfficiency(users, afterMetrics, beforeMetrics) {
        const resourceIncrease = (afterMetrics.cpu + afterMetrics.memory - beforeMetrics.cpu - beforeMetrics.memory);
        return resourceIncrease > 0 ? users / resourceIncrease : 0;
    }

    analyzeResourceEfficiency(results) {
        const efficiencies = results.map(r => r.efficiency).filter(e => e > 0);
        return {
            averageEfficiency: efficiencies.length > 0 ? efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length : 0,
            resourceScaling: efficiencies.length > 1 ? efficiencies[efficiencies.length - 1] / efficiencies[0] : 1
        };
    }

    identifyDatabaseBottleneck(results) {
        let bottleneck = false;
        
        for (let i = 1; i < results.length; i++) {
            const current = results[i];
            const previous = results[i - 1];
            
            if (current.successRate < previous.successRate * 0.8) {
                bottleneck = true;
                break;
            }
        }
        
        return bottleneck;
    }

    calculatePercentile(numbers, percentile) {
        if (numbers.length === 0) return 0;
        
        const sorted = [...numbers].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    analyzeHorizontalScalingReadiness() {
        console.log(colors.yellow('\\n🔄 Analyzing Horizontal Scaling Readiness...'));
        
        const readinessFactors = {
            stateless: this.results.tests['Session Affinity Requirements']?.stateless || false,
            loadDistributionReady: this.results.tests['Load Distribution Readiness']?.loadDistributionReady || false,
            noDatabaseBottlenecks: !this.results.tests['Database Scaling Impact']?.databaseBottleneck || false,
            acceptableResponseTimeDegradation: this.results.tests['Response Time Scaling']?.degradationAnalysis?.acceptableDegradation || false,
            resourceEfficient: (this.results.tests['Resource Utilization Scaling']?.scalingEfficiency?.averageEfficiency || 0) > 1
        };
        
        const readyFactors = Object.values(readinessFactors).filter(Boolean).length;
        const totalFactors = Object.keys(readinessFactors).length;
        
        this.results.summary.horizontalScalingReady = readyFactors >= totalFactors * 0.8;
        this.results.horizontalScalingReadiness = {
            readinessScore: (readyFactors / totalFactors) * 100,
            factors: readinessFactors,
            recommendations: this.generateScalingRecommendations(readinessFactors)
        };
    }

    generateScalingRecommendations(factors) {
        const recommendations = [];
        
        if (!factors.stateless) {
            recommendations.push('Implement stateless design for horizontal scaling');
        }
        
        if (!factors.loadDistributionReady) {
            recommendations.push('Optimize for load balancer distribution');
        }
        
        if (!factors.noDatabaseBottlenecks) {
            recommendations.push('Address database connection pooling and query optimization');
        }
        
        if (!factors.acceptableResponseTimeDegradation) {
            recommendations.push('Optimize response time under load');
        }
        
        if (!factors.resourceEfficient) {
            recommendations.push('Improve resource utilization efficiency');
        }
        
        return recommendations;
    }

    generateReport() {
        console.log(colors.cyan('\\n📈 Scalability Analysis Results:\\n'));
        
        console.log(colors.yellow('Summary:'));
        console.log(`  Total Tests: ${this.results.summary.totalScalabilityTests}`);
        console.log(`  Passed Tests: ${this.results.summary.passedTests}`);
        console.log(`  Failed Tests: ${this.results.summary.failedTests}`);
        console.log(`  Max Throughput: ${this.results.summary.maxThroughput.toFixed(2)} req/sec`);
        console.log(`  Horizontal Scaling Ready: ${this.results.summary.horizontalScalingReady ? 'Yes' : 'No'}`);
        
        if (this.results.horizontalScalingReadiness) {
            console.log(colors.yellow('\\nHorizontal Scaling Readiness:'));
            console.log(`  Readiness Score: ${this.results.horizontalScalingReadiness.readinessScore.toFixed(1)}%`);
            
            Object.entries(this.results.horizontalScalingReadiness.factors).forEach(([factor, ready]) => {
                const status = ready ? colors.green('✅') : colors.red('❌');
                console.log(`  ${status} ${factor.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            });
        }
        
        if (this.results.summary.scalingBottlenecks.length > 0) {
            console.log(colors.red('\\n⚠️  Scaling Bottlenecks:'));
            [...new Set(this.results.summary.scalingBottlenecks)].forEach(bottleneck => {
                console.log(colors.red(`  ❌ ${bottleneck}`));
            });
        }
        
        if (this.results.horizontalScalingReadiness?.recommendations.length > 0) {
            console.log(colors.yellow('\\n💡 Scaling Recommendations:'));
            this.results.horizontalScalingReadiness.recommendations.forEach(rec => {
                console.log(colors.white(`  • ${rec}`));
            });
        }
        
        console.log(colors.green('\\n✅ Scalability analysis completed\\n'));
        
        // Exit with error if not ready for horizontal scaling
        process.exit(this.results.summary.horizontalScalingReady ? 0 : 1);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the scalability analysis if this is the main module
if (require.main === module) {
    const analyzer = new ScalabilityAnalyzer();
    analyzer.runScalabilityAnalysis().catch(error => {
        console.error(colors.red('Scalability analysis failed:'), error.message);
        process.exit(1);
    });
}

module.exports = ScalabilityAnalyzer;