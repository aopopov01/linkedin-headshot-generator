#!/usr/bin/env node

/**
 * API Load Testing Module
 * Tests all API endpoints under various load conditions
 */

const axios = require('axios');
const colors = require('colors');

class APILoadTester {
    constructor() {
        this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        this.results = {
            endpoints: {},
            summary: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                maxResponseTime: 0,
                minResponseTime: Infinity
            }
        };
        
        this.endpoints = [
            { method: 'GET', path: '/health', name: 'Health Check' },
            { method: 'GET', path: '/api/v1/platforms', name: 'Platform Specs' },
            { method: 'GET', path: '/api/v1/styles', name: 'Available Styles' },
            { method: 'GET', path: '/api/v1/metrics', name: 'Metrics' },
            { method: 'POST', path: '/api/v1/estimate-cost', name: 'Cost Estimation' }
        ];
        
        this.loadPatterns = [
            { name: 'Light Load', concurrent: 5, requests: 50, duration: 10000 },
            { name: 'Medium Load', concurrent: 20, requests: 200, duration: 15000 },
            { name: 'Heavy Load', concurrent: 50, requests: 500, duration: 20000 },
            { name: 'Spike Load', concurrent: 100, requests: 200, duration: 5000 }
        ];
    }

    async runLoadTest() {
        console.log(colors.blue('🔥 Starting API Load Testing...\\n'));
        
        for (const pattern of this.loadPatterns) {
            console.log(colors.yellow(`📊 Testing ${pattern.name} (${pattern.concurrent} concurrent, ${pattern.requests} requests)...`));
            
            const patternResults = await this.executeLoadPattern(pattern);
            console.log(colors.green(`✅ ${pattern.name} completed - Success Rate: ${patternResults.successRate}%\\n`));
            
            // Brief recovery period
            await this.sleep(2000);
        }
        
        this.generateReport();
    }

    async executeLoadPattern(pattern) {
        const promises = [];
        const results = [];
        const startTime = Date.now();
        
        // Create concurrent request batches
        const batchSize = Math.ceil(pattern.requests / pattern.concurrent);
        
        for (let i = 0; i < pattern.concurrent; i++) {
            promises.push(this.runBatch(batchSize, results));
        }
        
        await Promise.all(promises);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        const patternResult = {
            pattern: pattern.name,
            duration,
            total: results.length,
            successful,
            failed,
            successRate: Math.round((successful / results.length) * 100),
            averageResponseTime: this.calculateAverage(results.map(r => r.responseTime)),
            maxResponseTime: Math.max(...results.map(r => r.responseTime)),
            minResponseTime: Math.min(...results.map(r => r.responseTime)),
            requests: results
        };
        
        this.results.endpoints[pattern.name] = patternResult;
        this.updateSummary(results);
        
        return patternResult;
    }

    async runBatch(batchSize, results) {
        for (let i = 0; i < batchSize; i++) {
            const endpoint = this.endpoints[Math.floor(Math.random() * this.endpoints.length)];
            const result = await this.makeRequest(endpoint);
            results.push(result);
            
            // Small delay to prevent overwhelming
            await this.sleep(Math.random() * 100);
        }
    }

    async makeRequest(endpoint) {
        const startTime = Date.now();
        
        try {
            let response;
            
            if (endpoint.method === 'GET') {
                response = await axios.get(`${this.baseUrl}${endpoint.path}`, {
                    timeout: 10000
                });
            } else if (endpoint.method === 'POST') {
                const payload = this.generatePayload(endpoint.path);
                response = await axios.post(`${this.baseUrl}${endpoint.path}`, payload, {
                    timeout: 10000,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            const responseTime = Date.now() - startTime;
            
            return {
                endpoint: endpoint.name,
                method: endpoint.method,
                path: endpoint.path,
                success: response.status >= 200 && response.status < 300,
                statusCode: response.status,
                responseTime,
                responseSize: JSON.stringify(response.data).length,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            return {
                endpoint: endpoint.name,
                method: endpoint.method,
                path: endpoint.path,
                success: false,
                statusCode: error.response?.status || 0,
                responseTime,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    generatePayload(path) {
        switch (path) {
            case '/api/v1/estimate-cost':
                return {
                    platforms: ['linkedin', 'instagram'],
                    style: 'professional',
                    options: {}
                };
            case '/api/v1/optimize':
                return {
                    imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
                    platforms: ['linkedin'],
                    style: 'professional'
                };
            default:
                return {};
        }
    }

    updateSummary(requests) {
        this.results.summary.totalRequests += requests.length;
        this.results.summary.successfulRequests += requests.filter(r => r.success).length;
        this.results.summary.failedRequests += requests.filter(r => !r.success).length;
        
        const responseTimes = requests.map(r => r.responseTime);
        this.results.summary.averageResponseTime = this.calculateAverage([
            ...responseTimes,
            ...Array(this.results.summary.totalRequests - requests.length).fill(this.results.summary.averageResponseTime)
        ]);
        
        this.results.summary.maxResponseTime = Math.max(
            this.results.summary.maxResponseTime,
            Math.max(...responseTimes)
        );
        
        this.results.summary.minResponseTime = Math.min(
            this.results.summary.minResponseTime,
            Math.min(...responseTimes)
        );
    }

    calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
    }

    generateReport() {
        console.log(colors.cyan('\\n📊 API Load Test Results:\\n'));
        
        console.log(colors.yellow('Summary:'));
        console.log(`  Total Requests: ${this.results.summary.totalRequests}`);
        console.log(`  Successful: ${this.results.summary.successfulRequests}`);
        console.log(`  Failed: ${this.results.summary.failedRequests}`);
        console.log(`  Success Rate: ${Math.round((this.results.summary.successfulRequests / this.results.summary.totalRequests) * 100)}%`);
        console.log(`  Avg Response Time: ${this.results.summary.averageResponseTime}ms`);
        console.log(`  Max Response Time: ${this.results.summary.maxResponseTime}ms`);
        console.log(`  Min Response Time: ${this.results.summary.minResponseTime}ms`);
        
        console.log(colors.yellow('\\nPattern Results:'));
        Object.values(this.results.endpoints).forEach(pattern => {
            console.log(`  ${pattern.pattern}:`);
            console.log(`    Success Rate: ${pattern.successRate}%`);
            console.log(`    Avg Response Time: ${pattern.averageResponseTime}ms`);
            console.log(`    Duration: ${pattern.duration}ms`);
        });
        
        // Identify issues
        const criticalIssues = this.identifyIssues();
        if (criticalIssues.length > 0) {
            console.log(colors.red('\\n⚠️  Critical Issues Detected:'));
            criticalIssues.forEach(issue => {
                console.log(colors.red(`  ❌ ${issue}`));
            });
        }
        
        console.log(colors.green('\\n✅ API Load Testing completed\\n'));
        
        // Exit with error code if critical issues found
        process.exit(criticalIssues.length > 0 ? 1 : 0);
    }

    identifyIssues() {
        const issues = [];
        
        // Check overall success rate
        const overallSuccessRate = (this.results.summary.successfulRequests / this.results.summary.totalRequests) * 100;
        if (overallSuccessRate < 95) {
            issues.push(`Low overall success rate: ${Math.round(overallSuccessRate)}%`);
        }
        
        // Check average response time
        if (this.results.summary.averageResponseTime > 1000) {
            issues.push(`High average response time: ${this.results.summary.averageResponseTime}ms`);
        }
        
        // Check max response time
        if (this.results.summary.maxResponseTime > 5000) {
            issues.push(`Very high maximum response time: ${this.results.summary.maxResponseTime}ms`);
        }
        
        // Check individual patterns
        Object.values(this.results.endpoints).forEach(pattern => {
            if (pattern.successRate < 90) {
                issues.push(`${pattern.pattern} has low success rate: ${pattern.successRate}%`);
            }
            if (pattern.averageResponseTime > 2000) {
                issues.push(`${pattern.pattern} has high response time: ${pattern.averageResponseTime}ms`);
            }
        });
        
        return issues;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the load test if this is the main module
if (require.main === module) {
    const tester = new APILoadTester();
    tester.runLoadTest().catch(error => {
        console.error(colors.red('Load testing failed:'), error.message);
        process.exit(1);
    });
}

module.exports = APILoadTester;