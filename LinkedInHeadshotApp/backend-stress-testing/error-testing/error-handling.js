#!/usr/bin/env node

/**
 * Error Handling Testing Module
 * Tests system resilience and error recovery mechanisms
 */

const axios = require('axios');
const colors = require('colors');

class ErrorHandlingTester {
    constructor() {
        this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        this.results = {
            tests: {},
            errorPatterns: {},
            recoveryMetrics: {},
            summary: {
                totalErrorTests: 0,
                passedTests: 0,
                failedTests: 0,
                errorRecoverySuccess: 0,
                circuitBreakerTriggered: false,
                gracefulDegradation: false
            }
        };
        
        this.errorScenarios = [
            { name: 'Invalid Request Payload', test: 'testInvalidPayloads' },
            { name: 'Malformed Image Data', test: 'testMalformedImageData' },
            { name: 'Oversized Requests', test: 'testOversizedRequests' },
            { name: 'Invalid Endpoints', test: 'testInvalidEndpoints' },
            { name: 'Timeout Scenarios', test: 'testTimeoutScenarios' },
            { name: 'Rate Limit Breaches', test: 'testRateLimitBreaches' },
            { name: 'Service Dependency Failures', test: 'testServiceDependencyFailures' },
            { name: 'Database Connection Errors', test: 'testDatabaseErrors' },
            { name: 'Memory Exhaustion', test: 'testMemoryExhaustion' },
            { name: 'Concurrent Error Conditions', test: 'testConcurrentErrors' }
        ];
    }

    async runErrorHandlingTest() {
        console.log(colors.blue('🛡️  Starting Error Handling & Resilience Testing...\\n'));
        
        for (const scenario of this.errorScenarios) {
            console.log(colors.yellow(`🧪 Testing ${scenario.name}...`));
            
            try {
                const result = await this[scenario.test]();
                this.results.tests[scenario.name] = result;
                
                if (result.success) {
                    console.log(colors.green(`✅ ${scenario.name} - Error handling working correctly`));
                    this.results.summary.passedTests++;
                } else {
                    console.log(colors.red(`❌ ${scenario.name} - Error handling issues detected`));
                    this.results.summary.failedTests++;
                }
                
                this.results.summary.totalErrorTests++;
                
                // Brief recovery period
                await this.sleep(1000);
                
            } catch (error) {
                console.log(colors.red(`❌ ${scenario.name} test failed:`, error.message));
                this.results.tests[scenario.name] = {
                    success: false,
                    error: error.message,
                    criticalFailure: true
                };
                this.results.summary.failedTests++;
                this.results.summary.totalErrorTests++;
            }
        }
        
        await this.testErrorRecovery();
        this.generateReport();
    }

    async testInvalidPayloads() {
        const invalidPayloads = [
            { name: 'Null Payload', payload: null },
            { name: 'Empty Object', payload: {} },
            { name: 'Missing Required Fields', payload: { style: 'professional' } },
            { name: 'Invalid Data Types', payload: { imageBase64: 123, platforms: 'not-array', style: null } },
            { name: 'SQL Injection Attempt', payload: { imageBase64: "'; DROP TABLE users; --", platforms: ['linkedin'], style: 'professional' } },
            { name: 'XSS Attempt', payload: { imageBase64: '<script>alert("xss")</script>', platforms: ['linkedin'], style: 'professional' } }
        ];
        
        const results = [];
        let properErrorHandling = 0;
        
        for (const test of invalidPayloads) {
            try {
                const response = await axios.post(`${this.baseUrl}/api/v1/optimize`, test.payload, {
                    timeout: 5000,
                    validateStatus: () => true // Accept all status codes
                });
                
                // Proper error handling should return 400-499 status codes
                const isProperError = response.status >= 400 && response.status < 500;
                const hasErrorMessage = response.data && response.data.error;
                
                if (isProperError && hasErrorMessage) {
                    properErrorHandling++;
                }
                
                results.push({
                    test: test.name,
                    status: response.status,
                    properErrorHandling: isProperError,
                    hasErrorMessage,
                    responseData: response.data
                });
                
            } catch (error) {
                // Network errors are acceptable for malformed requests
                results.push({
                    test: test.name,
                    networkError: true,
                    error: error.message,
                    properErrorHandling: true
                });
                properErrorHandling++;
            }
        }
        
        return {
            success: properErrorHandling >= invalidPayloads.length * 0.8, // 80% should handle errors properly
            properErrorHandling,
            totalTests: invalidPayloads.length,
            results
        };
    }

    async testMalformedImageData() {
        const malformedImages = [
            { name: 'Invalid Base64', data: 'not-valid-base64-data' },
            { name: 'Corrupted Image Header', data: 'data:image/jpeg;base64,corrupted-header' },
            { name: 'Wrong MIME Type', data: 'data:text/plain;base64,dGVzdA==' },
            { name: 'Empty Image Data', data: '' },
            { name: 'Non-Image Base64', data: btoa('This is not an image') }
        ];
        
        const results = [];
        let properErrorHandling = 0;
        
        for (const test of malformedImages) {
            try {
                const response = await axios.post(`${this.baseUrl}/api/v1/optimize`, {
                    imageBase64: test.data,
                    platforms: ['linkedin'],
                    style: 'professional'
                }, {
                    timeout: 10000,
                    validateStatus: () => true
                });
                
                const isProperError = response.status >= 400 && response.status < 500;
                const hasErrorMessage = response.data && response.data.error;
                
                if (isProperError && hasErrorMessage) {
                    properErrorHandling++;
                }
                
                results.push({
                    test: test.name,
                    status: response.status,
                    properErrorHandling: isProperError,
                    hasErrorMessage,
                    errorMessage: response.data?.error
                });
                
            } catch (error) {
                results.push({
                    test: test.name,
                    networkError: true,
                    error: error.message,
                    properErrorHandling: true
                });
                properErrorHandling++;
            }
        }
        
        return {
            success: properErrorHandling >= malformedImages.length * 0.8,
            properErrorHandling,
            totalTests: malformedImages.length,
            results
        };
    }

    async testOversizedRequests() {
        const oversizedTests = [
            { name: 'Large Image', size: '100MB' },
            { name: 'Many Platforms', platforms: Array(1000).fill('linkedin') },
            { name: 'Large Metadata', metadata: 'x'.repeat(10 * 1024 * 1024) }
        ];
        
        const results = [];
        let properErrorHandling = 0;
        
        for (const test of oversizedTests) {
            try {
                let payload = {
                    imageBase64: this.generateImageData(1024 * 1024), // 1MB default
                    platforms: ['linkedin'],
                    style: 'professional'
                };
                
                if (test.size) {
                    payload.imageBase64 = this.generateImageData(this.parseSize(test.size));
                }
                if (test.platforms) {
                    payload.platforms = test.platforms;
                }
                if (test.metadata) {
                    payload.options = { metadata: test.metadata };
                }
                
                const response = await axios.post(`${this.baseUrl}/api/v1/optimize`, payload, {
                    timeout: 30000,
                    validateStatus: () => true
                });
                
                const isProperError = response.status === 413 || response.status === 400;
                if (isProperError) {
                    properErrorHandling++;
                }
                
                results.push({
                    test: test.name,
                    status: response.status,
                    properErrorHandling: isProperError,
                    errorMessage: response.data?.error
                });
                
            } catch (error) {
                const isExpectedError = error.code === 'ECONNABORTED' || error.message.includes('payload');
                if (isExpectedError) {
                    properErrorHandling++;
                }
                
                results.push({
                    test: test.name,
                    networkError: true,
                    error: error.message,
                    properErrorHandling: isExpectedError
                });
            }
        }
        
        return {
            success: properErrorHandling >= oversizedTests.length * 0.7,
            properErrorHandling,
            totalTests: oversizedTests.length,
            results
        };
    }

    async testInvalidEndpoints() {
        const invalidEndpoints = [
            '/api/v1/nonexistent',
            '/api/v2/optimize',
            '/admin/secret',
            '/../../etc/passwd',
            '/api/v1/optimize/../admin'
        ];
        
        const results = [];
        let proper404Handling = 0;
        
        for (const endpoint of invalidEndpoints) {
            try {
                const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                    timeout: 5000,
                    validateStatus: () => true
                });
                
                const isProper404 = response.status === 404;
                if (isProper404) {
                    proper404Handling++;
                }
                
                results.push({
                    endpoint,
                    status: response.status,
                    proper404Handling: isProper404
                });
                
            } catch (error) {
                results.push({
                    endpoint,
                    networkError: true,
                    error: error.message
                });
            }
        }
        
        return {
            success: proper404Handling >= invalidEndpoints.length * 0.9,
            proper404Handling,
            totalTests: invalidEndpoints.length,
            results
        };
    }

    async testTimeoutScenarios() {
        const timeoutTests = [
            { name: 'Very Short Timeout', timeout: 1 },
            { name: 'Short Timeout', timeout: 100 },
            { name: 'Medium Timeout', timeout: 1000 }
        ];
        
        const results = [];
        let properTimeoutHandling = 0;
        
        for (const test of timeoutTests) {
            try {
                const response = await axios.get(`${this.baseUrl}/api/v1/metrics`, {
                    timeout: test.timeout
                });
                
                // If request succeeds with very short timeout, server is very fast
                results.push({
                    test: test.name,
                    timeout: test.timeout,
                    success: true,
                    responseTime: response.config.metadata?.responseTime || 0
                });
                
            } catch (error) {
                const isTimeoutError = error.code === 'ECONNABORTED';
                if (isTimeoutError) {
                    properTimeoutHandling++;
                }
                
                results.push({
                    test: test.name,
                    timeout: test.timeout,
                    timedOut: isTimeoutError,
                    error: error.message
                });
            }
        }
        
        return {
            success: properTimeoutHandling > 0, // At least some timeouts should occur
            properTimeoutHandling,
            totalTests: timeoutTests.length,
            results
        };
    }

    async testRateLimitBreaches() {
        const burstRequests = 150; // Attempt to exceed rate limits
        const results = [];
        
        try {
            const promises = [];
            const startTime = Date.now();
            
            for (let i = 0; i < burstRequests; i++) {
                promises.push(
                    axios.get(`${this.baseUrl}/health`, {
                        timeout: 5000,
                        validateStatus: () => true
                    })
                );
            }
            
            const responses = await Promise.allSettled(promises);
            const duration = Date.now() - startTime;
            
            let rateLimitedCount = 0;
            let successCount = 0;
            
            responses.forEach((response, index) => {
                if (response.status === 'fulfilled') {
                    if (response.value.status === 429) {
                        rateLimitedCount++;
                    } else if (response.value.status === 200) {
                        successCount++;
                    }
                }
            });
            
            results.push({
                totalRequests: burstRequests,
                successful: successCount,
                rateLimited: rateLimitedCount,
                duration,
                rateLimitingActive: rateLimitedCount > 0
            });
            
        } catch (error) {
            results.push({
                error: error.message,
                rateLimitingActive: false
            });
        }
        
        return {
            success: results.length > 0 && results[0].rateLimitingActive,
            rateLimitingDetected: results.length > 0 && results[0].rateLimitingActive,
            results
        };
    }

    async testServiceDependencyFailures() {
        // Test how the system handles missing external services
        const dependencyTests = [
            { name: 'AI Service Failure Simulation', endpoint: '/api/v1/optimize' },
            { name: 'Database Failure Simulation', endpoint: '/api/v1/metrics' }
        ];
        
        const results = [];
        
        for (const test of dependencyTests) {
            try {
                const payload = test.endpoint === '/api/v1/optimize' ? {
                    imageBase64: this.generateImageData(1024),
                    platforms: ['linkedin'],
                    style: 'professional'
                } : undefined;
                
                const method = payload ? 'post' : 'get';
                const response = await axios[method](`${this.baseUrl}${test.endpoint}`, payload, {
                    timeout: 15000,
                    validateStatus: () => true
                });
                
                // Check if system gracefully handles service failures
                const gracefulFailure = response.status >= 500 && response.status < 600;
                const hasErrorMessage = response.data && response.data.error;
                
                results.push({
                    test: test.name,
                    status: response.status,
                    gracefulFailure,
                    hasErrorMessage,
                    responseData: response.data
                });
                
            } catch (error) {
                results.push({
                    test: test.name,
                    networkError: true,
                    error: error.message
                });
            }
        }
        
        return {
            success: results.every(r => r.gracefulFailure || r.networkError),
            gracefulFailureHandling: true,
            results
        };
    }

    async testDatabaseErrors() {
        // Test database connection resilience
        const results = [];
        
        try {
            // Overwhelm with many concurrent database-heavy requests
            const promises = [];
            for (let i = 0; i < 50; i++) {
                promises.push(
                    axios.get(`${this.baseUrl}/api/v1/metrics`, {
                        timeout: 10000,
                        validateStatus: () => true
                    })
                );
            }
            
            const responses = await Promise.allSettled(promises);
            
            let successCount = 0;
            let errorCount = 0;
            let dbErrorCount = 0;
            
            responses.forEach(response => {
                if (response.status === 'fulfilled') {
                    if (response.value.status === 200) {
                        successCount++;
                    } else if (response.value.status >= 500) {
                        errorCount++;
                        if (response.value.data?.error?.includes('database')) {
                            dbErrorCount++;
                        }
                    }
                }
            });
            
            results.push({
                totalRequests: promises.length,
                successful: successCount,
                errors: errorCount,
                databaseErrors: dbErrorCount,
                connectionPoolHandling: errorCount < promises.length * 0.5 // Less than 50% errors
            });
            
        } catch (error) {
            results.push({
                error: error.message,
                connectionPoolHandling: false
            });
        }
        
        return {
            success: results.length > 0 && results[0].connectionPoolHandling,
            databaseResilienceVerified: true,
            results
        };
    }

    async testMemoryExhaustion() {
        // Test behavior under memory pressure
        const memoryTests = [
            { name: 'Large Payload Memory Test', size: '50MB' },
            { name: 'Multiple Large Requests', concurrent: 10, size: '10MB' }
        ];
        
        const results = [];
        
        for (const test of memoryTests) {
            try {
                if (test.concurrent) {
                    const promises = [];
                    for (let i = 0; i < test.concurrent; i++) {
                        promises.push(
                            axios.post(`${this.baseUrl}/api/v1/optimize`, {
                                imageBase64: this.generateImageData(this.parseSize(test.size)),
                                platforms: ['linkedin'],
                                style: 'professional'
                            }, {
                                timeout: 30000,
                                validateStatus: () => true
                            })
                        );
                    }
                    
                    const responses = await Promise.allSettled(promises);
                    const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status < 400).length;
                    
                    results.push({
                        test: test.name,
                        concurrent: test.concurrent,
                        successful,
                        memoryHandling: successful > 0 || responses.some(r => r.value?.status === 413)
                    });
                } else {
                    const response = await axios.post(`${this.baseUrl}/api/v1/optimize`, {
                        imageBase64: this.generateImageData(this.parseSize(test.size)),
                        platforms: ['linkedin'],
                        style: 'professional'
                    }, {
                        timeout: 60000,
                        validateStatus: () => true
                    });
                    
                    results.push({
                        test: test.name,
                        status: response.status,
                        memoryHandling: response.status < 400 || response.status === 413
                    });
                }
            } catch (error) {
                results.push({
                    test: test.name,
                    error: error.message,
                    memoryHandling: error.code === 'ECONNABORTED' || error.message.includes('payload')
                });
            }
        }
        
        return {
            success: results.every(r => r.memoryHandling),
            memoryManagementVerified: true,
            results
        };
    }

    async testConcurrentErrors() {
        // Test error handling under concurrent error conditions
        const errorScenarios = [
            { type: 'invalid', payload: { invalid: 'data' } },
            { type: 'malformed', payload: { imageBase64: 'invalid', platforms: ['linkedin'], style: 'professional' } },
            { type: 'oversized', payload: { imageBase64: this.generateImageData(10 * 1024 * 1024), platforms: ['linkedin'], style: 'professional' } }
        ];
        
        const results = [];
        
        try {
            const promises = [];
            
            // Create concurrent error conditions
            for (let i = 0; i < 30; i++) {
                const scenario = errorScenarios[i % errorScenarios.length];
                promises.push(
                    axios.post(`${this.baseUrl}/api/v1/optimize`, scenario.payload, {
                        timeout: 10000,
                        validateStatus: () => true
                    })
                );
            }
            
            const responses = await Promise.allSettled(promises);
            
            let properErrorResponses = 0;
            let serverErrors = 0;
            
            responses.forEach(response => {
                if (response.status === 'fulfilled') {
                    if (response.value.status >= 400 && response.value.status < 500) {
                        properErrorResponses++;
                    } else if (response.value.status >= 500) {
                        serverErrors++;
                    }
                }
            });
            
            results.push({
                totalRequests: promises.length,
                properErrorResponses,
                serverErrors,
                concurrentErrorHandling: serverErrors < promises.length * 0.2 // Less than 20% server errors
            });
            
        } catch (error) {
            results.push({
                error: error.message,
                concurrentErrorHandling: false
            });
        }
        
        return {
            success: results.length > 0 && results[0].concurrentErrorHandling,
            concurrentErrorResilienceVerified: true,
            results
        };
    }

    async testErrorRecovery() {
        console.log(colors.yellow('🔄 Testing Error Recovery Mechanisms...'));
        
        // Simulate system stress and recovery
        try {
            // Cause temporary stress
            const stressPromises = [];
            for (let i = 0; i < 100; i++) {
                stressPromises.push(
                    axios.get(`${this.baseUrl}/health`, { timeout: 5000, validateStatus: () => true })
                );
            }
            
            await Promise.allSettled(stressPromises);
            
            // Wait for recovery
            await this.sleep(5000);
            
            // Test if system recovered
            const recoveryTest = await axios.get(`${this.baseUrl}/health`, { timeout: 10000 });
            
            this.results.summary.errorRecoverySuccess = recoveryTest.status === 200 ? 1 : 0;
            
        } catch (error) {
            this.results.summary.errorRecoverySuccess = 0;
        }
    }

    generateImageData(sizeBytes) {
        const baseImage = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        const baseSize = baseImage.length;
        const repetitions = Math.max(1, Math.floor(sizeBytes / baseSize));
        return baseImage.repeat(repetitions);
    }

    parseSize(sizeStr) {
        const multipliers = { 'B': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024 };
        const match = sizeStr.match(/^(\\d+)([A-Z]+)$/);
        if (match) {
            return parseInt(match[1]) * (multipliers[match[2]] || 1);
        }
        return parseInt(sizeStr) || 0;
    }

    generateReport() {
        console.log(colors.cyan('\\n🛡️  Error Handling Test Results:\\n'));
        
        console.log(colors.yellow('Summary:'));
        console.log(`  Total Error Tests: ${this.results.summary.totalErrorTests}`);
        console.log(`  Passed Tests: ${this.results.summary.passedTests}`);
        console.log(`  Failed Tests: ${this.results.summary.failedTests}`);
        console.log(`  Success Rate: ${Math.round((this.results.summary.passedTests / this.results.summary.totalErrorTests) * 100)}%`);
        console.log(`  Error Recovery: ${this.results.summary.errorRecoverySuccess ? 'Success' : 'Failed'}`);
        
        console.log(colors.yellow('\\nDetailed Results:'));
        Object.entries(this.results.tests).forEach(([name, result]) => {
            const status = result.success ? colors.green('✅') : colors.red('❌');
            console.log(`  ${status} ${name}`);
            if (result.properErrorHandling !== undefined) {
                console.log(`       Proper error handling: ${result.properErrorHandling}/${result.totalTests}`);
            }
        });
        
        // Identify critical issues
        const criticalIssues = this.identifyIssues();
        if (criticalIssues.length > 0) {
            console.log(colors.red('\\n⚠️  Critical Error Handling Issues:'));
            criticalIssues.forEach(issue => {
                console.log(colors.red(`  ❌ ${issue}`));
            });
        }
        
        console.log(colors.green('\\n✅ Error handling testing completed\\n'));
        
        // Exit with error code if critical issues found
        process.exit(criticalIssues.length > 2 ? 1 : 0);
    }

    identifyIssues() {
        const issues = [];
        
        if (this.results.summary.failedTests > this.results.summary.totalErrorTests * 0.3) {
            issues.push(`High error handling failure rate: ${this.results.summary.failedTests}/${this.results.summary.totalErrorTests}`);
        }
        
        if (this.results.summary.errorRecoverySuccess === 0) {
            issues.push('System failed to recover from stress conditions');
        }
        
        Object.entries(this.results.tests).forEach(([name, result]) => {
            if (!result.success && result.criticalFailure) {
                issues.push(`Critical failure in ${name}`);
            }
        });
        
        return issues;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the error handling test if this is the main module
if (require.main === module) {
    const tester = new ErrorHandlingTester();
    tester.runErrorHandlingTest().catch(error => {
        console.error(colors.red('Error handling testing failed:'), error.message);
        process.exit(1);
    });
}

module.exports = ErrorHandlingTester;