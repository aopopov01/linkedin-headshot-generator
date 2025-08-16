#!/usr/bin/env node

/**
 * Focused Health Analysis for Degraded Backend
 * Analyzes current issues and stress tests working endpoints
 */

const axios = require('axios');
const colors = require('colors');
const fs = require('fs');

class FocusedHealthAnalyzer {
    constructor() {
        this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        this.results = {
            healthAnalysis: {},
            workingEndpoints: [],
            failingEndpoints: [],
            performanceMetrics: {},
            rootCauseAnalysis: {},
            recommendations: []
        };
        
        this.endpoints = [
            { path: '/health', method: 'GET', name: 'Health Check', critical: true },
            { path: '/api/v1/platforms', method: 'GET', name: 'Platform Specs', critical: false },
            { path: '/api/v1/styles', method: 'GET', name: 'Available Styles', critical: false },
            { path: '/api/v1/metrics', method: 'GET', name: 'Metrics', critical: false },
            { path: '/api/v1/estimate-cost', method: 'POST', name: 'Cost Estimation', critical: false }
        ];
    }

    async runFocusedAnalysis() {
        console.log(colors.blue('🔍 Starting Focused Health Analysis for Degraded Backend...\\n'));
        
        // 1. Analyze current health status
        await this.analyzeHealthStatus();
        
        // 2. Test individual endpoints
        await this.testIndividualEndpoints();
        
        // 3. Stress test working endpoints
        await this.stressTestWorkingEndpoints();
        
        // 4. Analyze root causes
        await this.performRootCauseAnalysis();
        
        // 5. Generate comprehensive report
        this.generateComprehensiveReport();
    }

    async analyzeHealthStatus() {
        console.log(colors.yellow('📊 Analyzing Health Status...'));
        
        try {
            const response = await axios.get(`${this.baseUrl}/health`, {
                timeout: 10000,
                validateStatus: () => true
            });
            
            this.results.healthAnalysis = {
                statusCode: response.status,
                healthData: response.data,
                timestamp: new Date().toISOString(),
                analysis: this.analyzeHealthData(response.data)
            };
            
            console.log(colors.yellow(`   Status: ${response.status} - ${response.data.status}`));
            
        } catch (error) {
            this.results.healthAnalysis = {
                error: error.message,
                timestamp: new Date().toISOString(),
                analysis: { critical: true, unreachable: true }
            };
            console.log(colors.red(`   Error: ${error.message}`));
        }
    }

    analyzeHealthData(healthData) {
        const analysis = {
            overall: healthData.status,
            issues: [],
            workingServices: [],
            failingServices: []
        };
        
        if (healthData.services) {
            Object.entries(healthData.services).forEach(([serviceName, serviceData]) => {
                if (serviceData.status === 'healthy') {
                    analysis.workingServices.push(serviceName);
                } else {
                    analysis.failingServices.push({
                        name: serviceName,
                        status: serviceData.status,
                        error: serviceData.error || 'Unknown error'
                    });
                    analysis.issues.push(`${serviceName}: ${serviceData.error || serviceData.status}`);
                }
            });
        }
        
        return analysis;
    }

    async testIndividualEndpoints() {
        console.log(colors.yellow('\\n🧪 Testing Individual Endpoints...'));
        
        for (const endpoint of this.endpoints) {
            try {
                console.log(colors.gray(`   Testing ${endpoint.name}...`));
                
                const startTime = Date.now();
                let response;
                
                if (endpoint.method === 'GET') {
                    response = await axios.get(`${this.baseUrl}${endpoint.path}`, {
                        timeout: 10000,
                        validateStatus: () => true
                    });
                } else if (endpoint.method === 'POST') {
                    const payload = this.getTestPayload(endpoint.path);
                    response = await axios.post(`${this.baseUrl}${endpoint.path}`, payload, {
                        timeout: 10000,
                        validateStatus: () => true
                    });
                }
                
                const responseTime = Date.now() - startTime;
                const isWorking = response.status >= 200 && response.status < 400;
                
                const endpointResult = {
                    ...endpoint,
                    working: isWorking,
                    statusCode: response.status,
                    responseTime,
                    responseSize: JSON.stringify(response.data).length,
                    error: !isWorking ? response.data?.error : null
                };
                
                if (isWorking) {
                    this.results.workingEndpoints.push(endpointResult);
                    console.log(colors.green(`   ✅ ${endpoint.name} - Working (${responseTime}ms)`));
                } else {
                    this.results.failingEndpoints.push(endpointResult);
                    console.log(colors.red(`   ❌ ${endpoint.name} - Failed (${response.status})`));
                }
                
            } catch (error) {
                this.results.failingEndpoints.push({
                    ...endpoint,
                    working: false,
                    error: error.message,
                    networkError: true
                });
                console.log(colors.red(`   ❌ ${endpoint.name} - Network Error: ${error.message}`));
            }
        }
    }

    async stressTestWorkingEndpoints() {
        console.log(colors.yellow('\\n⚡ Stress Testing Working Endpoints...'));
        
        if (this.results.workingEndpoints.length === 0) {
            console.log(colors.red('   No working endpoints found for stress testing'));
            return;
        }
        
        const stressLevels = [
            { name: 'Light', concurrent: 10, iterations: 20 },
            { name: 'Medium', concurrent: 25, iterations: 15 },
            { name: 'Heavy', concurrent: 50, iterations: 10 }
        ];
        
        for (const endpoint of this.results.workingEndpoints) {
            console.log(colors.gray(`   Stress testing ${endpoint.name}...`));
            
            const stressResults = [];
            
            for (const level of stressLevels) {
                try {
                    const promises = [];
                    const startTime = Date.now();
                    
                    for (let i = 0; i < level.concurrent; i++) {
                        for (let j = 0; j < level.iterations / level.concurrent; j++) {
                            promises.push(this.makeStressRequest(endpoint));
                        }
                    }
                    
                    const results = await Promise.allSettled(promises);
                    const duration = Date.now() - startTime;
                    
                    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
                    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;
                    
                    const levelResult = {
                        level: level.name,
                        concurrent: level.concurrent,
                        totalRequests: promises.length,
                        successful,
                        failed,
                        successRate: (successful / promises.length) * 100,
                        duration,
                        throughput: (promises.length / duration) * 1000
                    };
                    
                    stressResults.push(levelResult);
                    
                    console.log(colors.gray(`     ${level.name}: ${levelResult.successRate.toFixed(1)}% success rate`));
                    
                    // Stop if success rate drops below 70%
                    if (levelResult.successRate < 70) {
                        break;
                    }
                    
                } catch (error) {
                    stressResults.push({
                        level: level.name,
                        error: error.message
                    });
                    break;
                }
            }
            
            this.results.performanceMetrics[endpoint.name] = {
                stressResults,
                maxThroughput: Math.max(...stressResults.map(r => r.throughput || 0)),
                reliability: stressResults.every(r => (r.successRate || 0) >= 70)
            };
        }
    }

    async makeStressRequest(endpoint) {
        const startTime = Date.now();
        
        try {
            let response;
            
            if (endpoint.method === 'GET') {
                response = await axios.get(`${this.baseUrl}${endpoint.path}`, { timeout: 5000 });
            } else {
                const payload = this.getTestPayload(endpoint.path);
                response = await axios.post(`${this.baseUrl}${endpoint.path}`, payload, { timeout: 5000 });
            }
            
            return {
                success: response.status >= 200 && response.status < 400,
                responseTime: Date.now() - startTime,
                statusCode: response.status
            };
            
        } catch (error) {
            return {
                success: false,
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }

    getTestPayload(path) {
        switch (path) {
            case '/api/v1/estimate-cost':
                return {
                    platforms: ['linkedin'],
                    style: 'professional',
                    options: {}
                };
            default:
                return {};
        }
    }

    async performRootCauseAnalysis() {
        console.log(colors.yellow('\\n🔍 Performing Root Cause Analysis...'));
        
        const rootCauses = [];
        const recommendations = [];
        
        // Analyze health data
        if (this.results.healthAnalysis.analysis) {
            const analysis = this.results.healthAnalysis.analysis;
            
            if (analysis.failingServices.length > 0) {
                analysis.failingServices.forEach(service => {
                    if (service.error.includes('Input buffer contains unsupported image format')) {
                        rootCauses.push({
                            category: 'Image Processing',
                            issue: 'Unsupported image format handling',
                            severity: 'High',
                            description: 'Image processor failing to handle certain image formats',
                            affectedService: service.name
                        });
                        recommendations.push({
                            priority: 'High',
                            action: 'Implement robust image format validation and conversion',
                            details: 'Add support for more image formats or better error handling for unsupported formats'
                        });
                    }
                    
                    if (service.error.includes('Missing configuration')) {
                        rootCauses.push({
                            category: 'Configuration',
                            issue: 'Missing API configurations',
                            severity: 'Medium',
                            description: 'External API services not properly configured',
                            affectedService: service.name
                        });
                        recommendations.push({
                            priority: 'Medium',
                            action: 'Configure missing API keys and service endpoints',
                            details: 'Set up proper environment variables for external service integrations'
                        });
                    }
                });
            }
        }
        
        // Analyze endpoint failures
        this.results.failingEndpoints.forEach(endpoint => {
            if (endpoint.critical && !endpoint.working) {
                rootCauses.push({
                    category: 'Critical Endpoint Failure',
                    issue: `${endpoint.name} not responding correctly`,
                    severity: 'Critical',
                    description: `Critical endpoint ${endpoint.path} returning ${endpoint.statusCode}`,
                    affectedEndpoint: endpoint.path
                });
                recommendations.push({
                    priority: 'Critical',
                    action: `Fix ${endpoint.name} endpoint immediately`,
                    details: 'Critical endpoints must be operational for system health'
                });
            }
        });
        
        // Analyze performance
        Object.entries(this.results.performanceMetrics).forEach(([endpointName, metrics]) => {
            if (!metrics.reliability) {
                rootCauses.push({
                    category: 'Performance',
                    issue: `${endpointName} performance degradation under load`,
                    severity: 'Medium',
                    description: 'Endpoint fails under concurrent load',
                    affectedEndpoint: endpointName
                });
                recommendations.push({
                    priority: 'Medium',
                    action: `Optimize ${endpointName} for better load handling`,
                    details: 'Implement better concurrency handling and resource management'
                });
            }
        });
        
        // General system recommendations
        recommendations.push({
            priority: 'High',
            action: 'Implement comprehensive health monitoring',
            details: 'Set up real-time monitoring and alerting for all critical services'
        });
        
        recommendations.push({
            priority: 'Medium',
            action: 'Add circuit breakers for external service calls',
            details: 'Prevent cascade failures when external services are unavailable'
        });
        
        recommendations.push({
            priority: 'Medium',
            action: 'Implement graceful degradation',
            details: 'Allow system to operate in reduced functionality mode when some services fail'
        });
        
        this.results.rootCauseAnalysis = {
            rootCauses,
            timestamp: new Date().toISOString(),
            summary: {
                totalIssues: rootCauses.length,
                criticalIssues: rootCauses.filter(rc => rc.severity === 'Critical').length,
                highSeverityIssues: rootCauses.filter(rc => rc.severity === 'High').length,
                mediumSeverityIssues: rootCauses.filter(rc => rc.severity === 'Medium').length
            }
        };
        
        this.results.recommendations = recommendations.sort((a, b) => {
            const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    generateComprehensiveReport() {
        console.log(colors.cyan('\\n' + '='.repeat(80)));
        console.log(colors.cyan('                    OMNISHOT BACKEND STRESS TEST ANALYSIS'));
        console.log(colors.cyan('                         (Degraded State Analysis)'));
        console.log(colors.cyan('='.repeat(80)));
        
        // Current Status
        console.log(colors.yellow('\\n📊 CURRENT STATUS:'));
        if (this.results.healthAnalysis.healthData) {
            console.log(`   Overall Health: ${this.getStatusColor(this.results.healthAnalysis.healthData.status)}`);
            console.log(`   Status Code: ${this.results.healthAnalysis.statusCode}`);
        }
        console.log(`   Working Endpoints: ${this.results.workingEndpoints.length}/${this.endpoints.length}`);
        console.log(`   Failing Endpoints: ${this.results.failingEndpoints.length}/${this.endpoints.length}`);
        
        // Root Cause Analysis
        if (this.results.rootCauseAnalysis.rootCauses.length > 0) {
            console.log(colors.red('\\n🚨 ROOT CAUSE ANALYSIS:'));
            console.log(`   Total Issues: ${this.results.rootCauseAnalysis.summary.totalIssues}`);
            console.log(`   Critical: ${this.results.rootCauseAnalysis.summary.criticalIssues}`);
            console.log(`   High Severity: ${this.results.rootCauseAnalysis.summary.highSeverityIssues}`);
            console.log(`   Medium Severity: ${this.results.rootCauseAnalysis.summary.mediumSeverityIssues}`);
            
            console.log(colors.red('\\n   🔍 IDENTIFIED ISSUES:'));
            this.results.rootCauseAnalysis.rootCauses.forEach((issue, index) => {
                const severityColor = this.getSeverityColor(issue.severity);
                console.log(`   ${index + 1}. ${severityColor} [${issue.severity}] ${issue.category}: ${issue.issue}`);
                console.log(`      📝 ${issue.description}`);
            });
        }
        
        // Performance Analysis
        if (Object.keys(this.results.performanceMetrics).length > 0) {
            console.log(colors.yellow('\\n⚡ PERFORMANCE ANALYSIS:'));
            Object.entries(this.results.performanceMetrics).forEach(([endpoint, metrics]) => {
                console.log(`   ${endpoint}:`);
                console.log(`     Max Throughput: ${metrics.maxThroughput.toFixed(2)} req/sec`);
                console.log(`     Reliability: ${metrics.reliability ? colors.green('✅ Good') : colors.red('❌ Poor')}`);
                
                if (metrics.stressResults.length > 0) {
                    const lastResult = metrics.stressResults[metrics.stressResults.length - 1];
                    console.log(`     Last Test: ${lastResult.successRate.toFixed(1)}% success rate at ${lastResult.level} load`);
                }
            });
        }
        
        // Recommendations
        console.log(colors.cyan('\\n💡 CRITICAL RECOMMENDATIONS:'));
        this.results.recommendations.slice(0, 10).forEach((rec, index) => {
            const priorityColor = this.getPriorityColor(rec.priority);
            console.log(`   ${index + 1}. ${priorityColor} [${rec.priority}] ${rec.action}`);
            console.log(`      📝 ${rec.details}`);
        });
        
        // System Health Assessment
        console.log(colors.yellow('\\n🏥 SYSTEM HEALTH ASSESSMENT:'));
        const healthScore = this.calculateHealthScore();
        console.log(`   Health Score: ${this.getHealthScoreColor(healthScore)}/100`);
        console.log(`   Production Ready: ${healthScore >= 80 ? colors.green('✅ Yes') : colors.red('❌ No')}`);
        console.log(`   Immediate Action Required: ${healthScore < 60 ? colors.red('✅ Yes') : colors.green('❌ No')}`);
        
        // Save detailed report
        const reportPath = `./results/focused-health-analysis-${Date.now()}.json`;
        if (!fs.existsSync('./results')) {
            fs.mkdirSync('./results', { recursive: true });
        }
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        console.log(colors.cyan('\\n' + '='.repeat(80)));
        console.log(colors.green(`📄 Detailed report saved to: ${reportPath}`));
        console.log(colors.cyan('='.repeat(80)));
        
        // Exit with appropriate code
        const criticalIssues = this.results.rootCauseAnalysis.summary?.criticalIssues || 0;
        process.exit(criticalIssues > 0 ? 1 : 0);
    }

    calculateHealthScore() {
        let score = 100;
        
        // Deduct for failing endpoints
        const endpointScore = (this.results.workingEndpoints.length / this.endpoints.length) * 40;
        score = score - 40 + endpointScore;
        
        // Deduct for critical issues
        const criticalIssues = this.results.rootCauseAnalysis.summary?.criticalIssues || 0;
        score -= criticalIssues * 20;
        
        // Deduct for high severity issues
        const highIssues = this.results.rootCauseAnalysis.summary?.highSeverityIssues || 0;
        score -= highIssues * 10;
        
        // Deduct for medium severity issues
        const mediumIssues = this.results.rootCauseAnalysis.summary?.mediumSeverityIssues || 0;
        score -= mediumIssues * 5;
        
        // Performance penalty
        const unreliableEndpoints = Object.values(this.results.performanceMetrics)
            .filter(metrics => !metrics.reliability).length;
        score -= unreliableEndpoints * 10;
        
        return Math.max(0, Math.round(score));
    }

    getStatusColor(status) {
        switch (status) {
            case 'healthy': return colors.green(status);
            case 'degraded': return colors.yellow(status);
            case 'unhealthy': return colors.red(status);
            default: return colors.gray(status);
        }
    }

    getSeverityColor(severity) {
        switch (severity) {
            case 'Critical': return colors.red('🔴');
            case 'High': return colors.red('🟠');
            case 'Medium': return colors.yellow('🟡');
            case 'Low': return colors.green('🟢');
            default: return colors.gray('⚪');
        }
    }

    getPriorityColor(priority) {
        switch (priority) {
            case 'Critical': return colors.red('🚨');
            case 'High': return colors.red('⚠️ ');
            case 'Medium': return colors.yellow('📋');
            case 'Low': return colors.green('💡');
            default: return colors.gray('ℹ️ ');
        }
    }

    getHealthScoreColor(score) {
        if (score >= 80) return colors.green(score);
        if (score >= 60) return colors.yellow(score);
        return colors.red(score);
    }
}

// Run the focused health analysis
if (require.main === module) {
    const analyzer = new FocusedHealthAnalyzer();
    analyzer.runFocusedAnalysis().catch(error => {
        console.error(colors.red('Focused health analysis failed:'), error.message);
        process.exit(1);
    });
}

module.exports = FocusedHealthAnalyzer;