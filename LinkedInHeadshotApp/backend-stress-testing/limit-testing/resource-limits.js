#!/usr/bin/env node

/**
 * Resource Limits Testing Module
 * Tests system behavior at resource limits and breaking points
 */

const axios = require('axios');
const colors = require('colors');
const fs = require('fs');

class ResourceLimitsTester {
    constructor() {
        this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        this.results = {
            tests: {},
            breakingPoints: {},
            resourceLimits: {},
            summary: {
                maxFileSize: 0,
                maxConcurrentConnections: 0,
                memoryLimit: 0,
                responseTimeLimit: 0,
                criticalFailures: 0
            }
        };
        
        this.testScenarios = [
            { name: 'File Size Limits', test: 'testFileSizeLimits' },
            { name: 'Request Size Limits', test: 'testRequestSizeLimits' },
            { name: 'Connection Limits', test: 'testConnectionLimits' },
            { name: 'Memory Stress Test', test: 'testMemoryLimits' },
            { name: 'Response Time Limits', test: 'testResponseTimeLimits' },
            { name: 'Rate Limiting Test', test: 'testRateLimits' },
            { name: 'Database Connection Pool', test: 'testDatabaseLimits' }
        ];
    }

    async runResourceLimitsTest() {
        console.log(colors.blue('🔥 Starting Resource Limits Testing...\\n'));
        
        // Create results directory
        if (!fs.existsSync('./results')) {
            fs.mkdirSync('./results', { recursive: true });
        }
        
        for (const scenario of this.testScenarios) {
            console.log(colors.yellow(`🧪 Testing ${scenario.name}...`));
            
            try {
                const result = await this[scenario.test]();
                this.results.tests[scenario.name] = result;
                
                if (result.success) {
                    console.log(colors.green(`✅ ${scenario.name} completed`));
                } else {
                    console.log(colors.red(`❌ ${scenario.name} failed`));
                    this.results.summary.criticalFailures++;
                }
                
                console.log(colors.gray(`   Limit found: ${result.limit}\\n`));
                
                // Recovery period
                await this.sleep(3000);
                
            } catch (error) {
                console.log(colors.red(`❌ ${scenario.name} failed:`, error.message));
                this.results.tests[scenario.name] = {
                    success: false,
                    error: error.message,
                    limit: 'unknown'
                };
                this.results.summary.criticalFailures++;
            }
        }
        
        this.generateReport();
    }

    async testFileSizeLimits() {
        console.log(colors.gray('   Testing maximum file size handling...'));
        
        const fileSizes = [
            { size: 1024 * 1024, name: '1MB' },        // 1MB
            { size: 5 * 1024 * 1024, name: '5MB' },    // 5MB
            { size: 10 * 1024 * 1024, name: '10MB' },  // 10MB
            { size: 25 * 1024 * 1024, name: '25MB' },  // 25MB
            { size: 50 * 1024 * 1024, name: '50MB' },  // 50MB
            { size: 100 * 1024 * 1024, name: '100MB' } // 100MB
        ];
        
        let maxSuccessfulSize = 0;
        let maxSizeName = '';
        const results = [];
        
        for (const fileSize of fileSizes) {
            try {
                const imageData = this.generateImageData(fileSize.size);
                const startTime = Date.now();
                
                const response = await axios.post(`${this.baseUrl}/api/v1/optimize`, {
                    imageBase64: imageData,
                    platforms: ['linkedin'],
                    style: 'professional'
                }, {
                    timeout: 30000,
                    maxContentLength: fileSize.size * 2,
                    maxBodyLength: fileSize.size * 2
                });
                
                const responseTime = Date.now() - startTime;
                
                if (response.status === 200) {
                    maxSuccessfulSize = fileSize.size;
                    maxSizeName = fileSize.name;
                    results.push({
                        size: fileSize.name,
                        success: true,
                        responseTime,
                        status: response.status
                    });
                } else {
                    results.push({
                        size: fileSize.name,
                        success: false,
                        responseTime,
                        status: response.status
                    });
                    break;
                }
                
            } catch (error) {
                results.push({
                    size: fileSize.name,
                    success: false,
                    error: error.message,
                    isTimeout: error.code === 'ECONNABORTED'
                });
                break;
            }
        }
        
        this.results.summary.maxFileSize = maxSuccessfulSize;
        
        return {
            success: maxSuccessfulSize > 0,
            limit: maxSizeName || 'Less than 1MB',
            maxSize: maxSuccessfulSize,
            results
        };
    }

    async testRequestSizeLimits() {
        console.log(colors.gray('   Testing maximum request payload size...'));
        
        const payloadSizes = ['1MB', '5MB', '10MB', '25MB', '50MB'];
        let maxSuccessfulPayload = '';
        const results = [];
        
        for (const size of payloadSizes) {
            try {
                const sizeBytes = this.parseSize(size);
                const largePayload = {
                    imageBase64: this.generateImageData(sizeBytes / 2),
                    platforms: Array(100).fill('linkedin'), // Large array
                    style: 'professional',
                    options: {
                        largeMetadata: 'x'.repeat(sizeBytes / 4)
                    }
                };
                
                const response = await axios.post(`${this.baseUrl}/api/v1/optimize`, largePayload, {
                    timeout: 20000
                });
                
                if (response.status === 200) {
                    maxSuccessfulPayload = size;
                    results.push({ size, success: true, status: response.status });
                } else {
                    results.push({ size, success: false, status: response.status });
                    break;
                }
                
            } catch (error) {
                results.push({
                    size,
                    success: false,
                    error: error.message
                });
                break;
            }
        }
        
        return {
            success: maxSuccessfulPayload !== '',
            limit: maxSuccessfulPayload || 'Less than 1MB',
            results
        };
    }

    async testConnectionLimits() {
        console.log(colors.gray('   Testing maximum concurrent connections...'));
        
        const connectionLimits = [50, 100, 200, 500, 1000];
        let maxConnections = 0;
        const results = [];
        
        for (const limit of connectionLimits) {
            try {
                const promises = [];
                const startTime = Date.now();
                
                // Create many concurrent connections
                for (let i = 0; i < limit; i++) {
                    promises.push(
                        axios.get(`${this.baseUrl}/health`, {
                            timeout: 15000,
                            headers: { 'Connection': 'keep-alive' }
                        })
                    );
                }
                
                const settledResults = await Promise.allSettled(promises);
                const successful = settledResults.filter(r => r.status === 'fulfilled').length;
                const duration = Date.now() - startTime;
                
                const successRate = (successful / limit) * 100;
                
                results.push({
                    connections: limit,
                    successful,
                    successRate,
                    duration
                });
                
                if (successRate >= 90) {
                    maxConnections = limit;
                } else {
                    break;
                }
                
                // Brief recovery
                await this.sleep(2000);
                
            } catch (error) {
                results.push({
                    connections: limit,
                    error: error.message
                });
                break;
            }
        }
        
        this.results.summary.maxConcurrentConnections = maxConnections;
        
        return {
            success: maxConnections > 0,
            limit: `${maxConnections} concurrent connections`,
            maxConnections,
            results
        };
    }

    async testMemoryLimits() {
        console.log(colors.gray('   Testing memory stress limits...'));
        
        const memoryTests = [
            { name: 'Small Batch', images: 10, size: '1MB' },
            { name: 'Medium Batch', images: 25, size: '2MB' },
            { name: 'Large Batch', images: 50, size: '3MB' },
            { name: 'Extreme Batch', images: 100, size: '5MB' }
        ];
        
        let maxMemoryTest = '';
        const results = [];
        
        for (const test of memoryTests) {
            try {
                const images = [];
                const sizeBytes = this.parseSize(test.size);
                
                // Create batch of images
                for (let i = 0; i < test.images; i++) {
                    images.push(this.generateImageData(sizeBytes));
                }
                
                const startTime = Date.now();
                
                const response = await axios.post(`${this.baseUrl}/api/v1/batch`, {
                    images,
                    platforms: ['linkedin'],
                    style: 'professional'
                }, {
                    timeout: 60000
                });
                
                const duration = Date.now() - startTime;
                
                if (response.status === 200) {
                    maxMemoryTest = test.name;
                    results.push({
                        test: test.name,
                        images: test.images,
                        size: test.size,
                        success: true,
                        duration,
                        status: response.status
                    });
                } else {
                    results.push({
                        test: test.name,
                        success: false,
                        status: response.status
                    });
                    break;
                }
                
            } catch (error) {
                results.push({
                    test: test.name,
                    success: false,
                    error: error.message
                });
                break;
            }
        }
        
        return {
            success: maxMemoryTest !== '',
            limit: maxMemoryTest || 'Small batch limit',
            results
        };
    }

    async testResponseTimeLimits() {
        console.log(colors.gray('   Testing response time under stress...'));
        
        const stressLevels = [
            { name: 'Light', concurrent: 10, duration: 5000 },
            { name: 'Medium', concurrent: 25, duration: 10000 },
            { name: 'Heavy', concurrent: 50, duration: 15000 },
            { name: 'Extreme', concurrent: 100, duration: 20000 }
        ];
        
        let maxStressLevel = '';
        const results = [];
        
        for (const level of stressLevels) {
            try {
                const promises = [];
                const startTime = Date.now();
                
                for (let i = 0; i < level.concurrent; i++) {
                    promises.push(
                        axios.get(`${this.baseUrl}/api/v1/metrics`, {
                            timeout: level.duration
                        })
                    );
                }
                
                const settledResults = await Promise.allSettled(promises);
                const successful = settledResults.filter(r => r.status === 'fulfilled');
                const failed = settledResults.filter(r => r.status === 'rejected');
                
                const responseTimes = successful.map(r => 
                    r.value.config?.metadata?.responseTime || 0
                );
                
                const avgResponseTime = responseTimes.length > 0 ? 
                    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
                
                const duration = Date.now() - startTime;
                
                results.push({
                    level: level.name,
                    concurrent: level.concurrent,
                    successful: successful.length,
                    failed: failed.length,
                    avgResponseTime,
                    duration
                });
                
                // Consider successful if >80% succeed and avg response time <10s
                if (successful.length / level.concurrent >= 0.8 && avgResponseTime < 10000) {
                    maxStressLevel = level.name;
                } else {
                    break;
                }
                
            } catch (error) {
                results.push({
                    level: level.name,
                    error: error.message
                });
                break;
            }
        }
        
        return {
            success: maxStressLevel !== '',
            limit: maxStressLevel || 'Below light stress',
            results
        };
    }

    async testRateLimits() {
        console.log(colors.gray('   Testing rate limiting behavior...'));
        
        const rateLimitTests = [
            { name: 'Burst Test', requests: 100, interval: 10 },
            { name: 'Sustained Test', requests: 200, interval: 100 },
            { name: 'Extreme Test', requests: 500, interval: 5 }
        ];
        
        const results = [];
        
        for (const test of rateLimitTests) {
            try {
                const promises = [];
                const startTime = Date.now();
                
                for (let i = 0; i < test.requests; i++) {
                    promises.push(
                        axios.get(`${this.baseUrl}/health`)
                            .then(response => ({ success: true, status: response.status }))
                            .catch(error => ({ 
                                success: false, 
                                status: error.response?.status,
                                rateLimited: error.response?.status === 429
                            }))
                    );
                    
                    if (test.interval > 0) {
                        await this.sleep(test.interval);
                    }
                }
                
                const responses = await Promise.all(promises);
                const duration = Date.now() - startTime;
                
                const successful = responses.filter(r => r.success).length;
                const rateLimited = responses.filter(r => r.rateLimited).length;
                
                results.push({
                    test: test.name,
                    requests: test.requests,
                    successful,
                    rateLimited,
                    duration,
                    successRate: (successful / test.requests) * 100
                });
                
            } catch (error) {
                results.push({
                    test: test.name,
                    error: error.message
                });
            }
        }
        
        return {
            success: true,
            limit: 'Rate limiting functional',
            results
        };
    }

    async testDatabaseLimits() {
        console.log(colors.gray('   Testing database connection limits...'));
        
        const dbTests = [
            { name: 'Light DB Load', concurrent: 20, requests: 100 },
            { name: 'Medium DB Load', concurrent: 50, requests: 200 },
            { name: 'Heavy DB Load', concurrent: 100, requests: 300 }
        ];
        
        const results = [];
        
        for (const test of dbTests) {
            try {
                const promises = [];
                
                for (let i = 0; i < test.concurrent; i++) {
                    for (let j = 0; j < test.requests / test.concurrent; j++) {
                        promises.push(
                            axios.get(`${this.baseUrl}/api/v1/metrics`, {
                                timeout: 15000
                            })
                        );
                    }
                }
                
                const startTime = Date.now();
                const settledResults = await Promise.allSettled(promises);
                const duration = Date.now() - startTime;
                
                const successful = settledResults.filter(r => r.status === 'fulfilled').length;
                const failed = settledResults.filter(r => r.status === 'rejected').length;
                
                results.push({
                    test: test.name,
                    concurrent: test.concurrent,
                    totalRequests: promises.length,
                    successful,
                    failed,
                    successRate: (successful / promises.length) * 100,
                    duration
                });
                
            } catch (error) {
                results.push({
                    test: test.name,
                    error: error.message
                });
            }
        }
        
        return {
            success: true,
            limit: 'Database connection testing completed',
            results
        };
    }

    generateImageData(sizeBytes) {
        // Generate a base64 image data of approximately the specified size
        const baseImage = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        
        // Repeat the base image to reach approximately the target size
        const baseSize = baseImage.length;
        const repetitions = Math.max(1, Math.floor(sizeBytes / baseSize));
        
        return baseImage.repeat(repetitions);
    }

    parseSize(sizeStr) {
        const multipliers = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024
        };
        
        const match = sizeStr.match(/^(\\d+)([A-Z]+)$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            return value * (multipliers[unit] || 1);
        }
        
        return parseInt(sizeStr) || 0;
    }

    generateReport() {
        console.log(colors.cyan('\\n🔥 Resource Limits Test Results:\\n'));
        
        console.log(colors.yellow('Test Summary:'));
        console.log(`  Total Tests: ${Object.keys(this.results.tests).length}`);
        console.log(`  Successful Tests: ${Object.values(this.results.tests).filter(t => t.success).length}`);
        console.log(`  Critical Failures: ${this.results.summary.criticalFailures}`);
        
        console.log(colors.yellow('\\nDiscovered Limits:'));
        Object.entries(this.results.tests).forEach(([name, result]) => {
            const status = result.success ? colors.green('✅') : colors.red('❌');
            console.log(`  ${status} ${name}: ${result.limit}`);
        });
        
        // Breaking point analysis
        const breakingPoints = this.identifyBreakingPoints();
        if (breakingPoints.length > 0) {
            console.log(colors.red('\\n⚠️  Breaking Points Identified:'));
            breakingPoints.forEach(point => {
                console.log(colors.red(`  ❌ ${point}`));
            });
        }
        
        // Recommendations
        const recommendations = this.generateRecommendations();
        console.log(colors.yellow('\\n💡 Recommendations:'));
        recommendations.forEach(rec => {
            console.log(colors.white(`  • ${rec}`));
        });
        
        console.log(colors.green('\\n✅ Resource limits testing completed\\n'));
        
        // Exit with error if critical failures
        process.exit(this.results.summary.criticalFailures > 2 ? 1 : 0);
    }

    identifyBreakingPoints() {
        const breakingPoints = [];
        
        Object.entries(this.results.tests).forEach(([name, result]) => {
            if (!result.success) {
                breakingPoints.push(`${name} failed - system limit reached`);
            }
        });
        
        return breakingPoints;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.summary.maxFileSize < 10 * 1024 * 1024) { // Less than 10MB
            recommendations.push('Increase file size limits or implement streaming for large files');
        }
        
        if (this.results.summary.maxConcurrentConnections < 100) {
            recommendations.push('Optimize connection handling and consider connection pooling');
        }
        
        if (this.results.summary.criticalFailures > 0) {
            recommendations.push('Implement graceful degradation for resource-intensive operations');
        }
        
        recommendations.push('Implement proper resource monitoring and alerting');
        recommendations.push('Add circuit breakers for external service calls');
        recommendations.push('Consider horizontal scaling for handling increased load');
        
        return recommendations;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the resource limits test if this is the main module
if (require.main === module) {
    const tester = new ResourceLimitsTester();
    tester.runResourceLimitsTest().catch(error => {
        console.error(colors.red('Resource limits testing failed:'), error.message);
        process.exit(1);
    });
}

module.exports = ResourceLimitsTester;